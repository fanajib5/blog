---
title: "Building a Real-Time GPS Dashboard"
description: "The GPS Backend series finale: bringing fleet positions to life on a map without refreshing - a WebSocket hub with slow-client protection, Redis pub/sub fan-out, and Leaflet.js. Tested end-to-end in a real browser."
author: "Faiq Najib Al-Aziz"
date: 2026-11-25
lastmod: 2026-11-25
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - gps
  - dashboard
  - websocket
  - realtime
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 6
---

All the GPS backend components have been established across the previous five articles: [protocols](/en/writing/2026/memahami-gps-protocol/), [TCP listener](/en/writing/2026/tcp-listener-gps-go/), [decoder](/en/writing/2026/decode-packet-gt06-teltonika/), [TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/), and [geofencing](/en/writing/2026/geofencing-postgis/). Data flows in, gets stored, and boundary events are detected.

However, clients don't want to look at database tables; they want to see **a map moving on its own**. This concluding article brings everything together: WebSockets for real-time push, Redis pub/sub as the bridge from the ingest worker, and Leaflet.js running in the browser. I tested all the code below end-to-end: a local Go server + Redis, opening the dashboard in a real browser, and dispatching positions via `PUBLISH`.

## Polling First, WebSockets Later

The most naive way to build a "real-time" dashboard is polling: JavaScript calling `GET /api/positions` every 2 seconds. The arithmetic deteriorates quickly: 30 requests/minute per client. An operator dashboard with 20 open tabs translates to 600 requests/minute, where 90% of the payload hasn't changed at all. Add to that an average latency equal to half the polling interval, meaning the "current" position is already 1 second stale.

The modern alternatives narrow down to two: **SSE** (Server-Sent Events, unidirectional over HTTP) or **WebSockets** (bidirectional, an upgrade from HTTP). To be fair: if the only requirement is pushing positions down to the browser, SSE is plenty sufficient and simpler to implement. But recall Part 1: down the road, a GPS server also needs to *send commands back upstream* (querying current position on demand, modifying reporting intervals, or issuing remote engine cut-offs). For this series, we build with WebSockets right from the start.

Here is the final architecture:

```text
[Tracker] → [Listener] → [Queue] → [Ingest Worker] ──┬──▶ [PostgreSQL]
                                                     ├──▶ [Redis: last position cache]
                                                     └──▶ [Redis PUBLISH positions:live]
                                                                │
                                               [Bridge (subscribe)] → [Hub] ──▶ N × browser WebSocket
```

The ingest worker is oblivious to any browser; it merely executes `PUBLISH`. The hub has no clue about GPS devices; it simply broadcasts. Redis decouples these two worlds cleanly, allowing each side to scale independently when traffic demands it.

## The Hub: Client Registry and Broadcast

The core engine is compact: a client registry, a broadcast channel, and an eviction strategy for slow consumers:

```go
type client struct {
    send chan []byte // 64-message buffer per client
}

type Hub struct {
    mu         sync.RWMutex
    clients    map[*client]struct{}
    register   chan *client
    unregister chan *client
}

func (h *Hub) run() {
    for {
        select {
        case c := <-h.register:
            h.mu.Lock()
            h.clients[c] = struct{}{}
            h.mu.Unlock()
        case c := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[c]; ok {
                delete(h.clients, c)
                close(c.send)
            }
            h.mu.Unlock()
        }
    }
}

// Broadcasts to all clients. Slow clients (full buffers) are dropped
// instead of stalling everyone else.
func (h *Hub) Broadcast(msg []byte) {
    h.mu.RLock()
    var victims []*client
    for c := range h.clients {
        select {
        case c.send <- msg:
        default: // buffer full: drop candidate
            victims = append(victims, c)
        }
    }
    h.mu.RUnlock()

    for _, c := range victims {
        h.mu.Lock()
        if _, ok := h.clients[c]; ok {
            delete(h.clients, c)
            close(c.send)
        }
        h.mu.Unlock()
        log.Printf("slow client dropped")
    }
}
```

Two deliberate design decisions are embedded here:

1. **Buffered `send` channel per client instead of writing directly to the network connection.** `Broadcast` never touches socket I/O; it simply enqueues messages into each client's buffer. A dedicated writer goroutine per connection drains that buffer. Without this layer, a single browser on a flaky connection would choke the broadcast loop for everyone else.
2. **Dropping clients whose buffers overflow.** Real-time dashboards are fundamentally stateless-friendly: a dropped client can simply reconnect and hydrate its state from the cache. Dropping a sluggish connection is vastly cheaper than dragging down healthy clients.

(In the first iteration of this code, I wrote the map `delete` directly inside the `RLock` block: an insidious data race where a write occurred under a read lock. The snippet above cleanly decouples them: gather drop candidates under `RLock`, then execute evictions under `Lock`. Go's `-race` detector catches this instantly: keep it enabled during testing.)

## The WebSocket Endpoint: One Writer per Connection

```go
var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func (h *Hub) wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    c := &client{send: make(chan []byte, 64)}

    h.register <- c
    defer func() { h.unregister <- c }()

    // The ONLY goroutine that WRITES to this connection
    go func() {
        for msg := range c.send {
            conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                return
            }
        }
        conn.Close()
    }()

    // We do not anticipate incoming messages from the dashboard; just listen for closure
    for {
        if _, _, err := conn.ReadMessage(); err != nil {
            return
        }
    }
}
```

The cardinal rule of gorilla/websocket (and WebSocket programming in general): **never allow two concurrent goroutines to write to the same connection**. The single-writer pattern resolves this cleanly while the reader goroutine sits idle purely to detect socket closures. `SetWriteDeadline` guarantees that a writer stalled by an unresponsive browser won't hang indefinitely.

## The Bridge: From Redis to the Hub

```go
func bridge(ctx context.Context, hub *Hub, rdb *redis.Client) {
    sub := rdb.Subscribe(ctx, "positions:live")
    for msg := range sub.Channel() {
        hub.Broadcast([]byte(msg.Payload))
    }
}
```

Five lines that bridge two distinct worlds. The ingest worker (the same one storing coordinates into TimescaleDB and validating geofences in Part 5) closes its processing loop with `rdb.Publish(ctx, "positions:live", jsonPosition)`. Optionally, it executes `SET device:last:<id>` to cache the latest position, which newly connected clients can query immediately so their map doesn't sit blank waiting for the next incoming packet.

## In the Browser: Leaflet + Auto-Reconnect

Client-side: map initialization, marker tracking per device, and a self-healing connection:

```html
<div id="map"></div>
<div id="status">connecting…</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map("map").setView([-7.2575, 112.7521], 12); // Surabaya
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  const markers = {}; // device_id -> L.Marker
  const statusEl = document.getElementById("status");

  function connect() {
    const ws = new WebSocket(`ws://${location.hostname}:8081/ws`);
    ws.onopen = () => (statusEl.textContent = "connected");
    ws.onclose = () => {
      statusEl.textContent = "disconnected, reconnecting in 3s…";
      setTimeout(connect, 3000); // automatic reconnection
    };
    ws.onmessage = (ev) => {
      const p = JSON.parse(ev.data);
      if (!markers[p.device_id]) {
        markers[p.device_id] = L.marker([p.lat, p.lon]).addTo(map);
      } else {
        markers[p.device_id].setLatLng([p.lat, p.lon]); // update position, avoid duplicates
      }
    };
  }
  connect();
</script>
```

## End-to-End Test Results

Three tiers of testing, all performed locally on my machine (loopback, local Redis, Chromium browser):

| Scenario | Result |
| --- | --- |
| 1 `PUBLISH` → 50 connected WebSocket clients | 50/50 received the update, within **2.5–3.4 ms** |
| Slow client (4 KB buffer, never reading) + healthy client, 300 messages of 64 KB transmitted | Healthy client received **300/300**; slow client was cleanly **dropped** by the hub (`slow client dropped` in server logs) |
| Real browser: 3 positions (2 devices) sent via `PUBLISH` | Status updated to `connected · 3 positions`; **2 markers** visible on map; updates for identical devices updated coordinates via `setLatLng` without duplicating markers |

That last row addresses the most common blunder in beginner dashboards: instantiating a brand-new marker on every single payload. With 500 devices pushing updates every 10 seconds, your map turns into an unusable lagfest within a minute. The remedy is simple: maintain a lookup dictionary `markers` keyed by `device_id`.

## Production Gotchas to Keep in Mind

- **Ping/pong heartbeats.** Proxies and load balancers love silently terminating quiet connections. Send periodic pings from the server (in gorilla: configure `SetReadDeadline` alongside a pong handler) and reply from the client, or configure underlying `TCP keepalive`.
- **Connection authentication.** In production, do not keep `CheckOrigin` returning `true` for any arbitrary caller. Validate tokens and tenant identity during the upgrade handshake (via cookies or headers); WebSocket connections cannot be re-validated on every frame like typical stateless HTTP requests.
- **Backpressure is a feature.** A 64-message buffer coupled with evictions is a conscious engineering trade-off: dashboard metrics operate under *latest-wins* semantics (only the freshest coordinate matters), rather than strict delivery guarantees for every intermediate packet. Complete audit logs and telemetry histories remain the responsibility of the database ingestion pipeline.

## Key Takeaways

- **Decouple your pipeline**: the ingest worker only executes `PUBLISH`, while the hub strictly handles broadcasts, with Redis acting as the shock absorber in between. Both halves can scale on their own terms.
- **One writer goroutine per connection** paired with a per-client buffer and explicit drop semantics for lagging consumers.
- **Latest-wins paradigm**: update markers via `device_id` lookups rather than re-creating them, and hydrate newcomers straight from the last-known position cache.
- **Reconnection is part of the protocol**: an evicted or dropped client must gracefully reconnect and rebuild its local state without manual intervention.

## Series Wrap-Up: What Lies Ahead?

With this dashboard in place, all six articles now form a complete GPS backend pipeline: from raw bytes on a raw socket to live dots moving across a customer's map. The entire series will be compiled into a **free ebook: "Building a GPS Backend with Go"**. Keep an eye on the [RSS feed](/en/writing/index.xml) or [reach out directly](/en/contact/) for release announcements.

Upcoming series under consideration include: message broker internals (RabbitMQ/Kafka), an API layer powered by Fiber + pgx, and zero-downtime deployment recipes on Coolify. If any of those pique your interest, [let me know](/en/contact/).

## CTA

Share this article if you found it helpful. For further discussions, visit [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
