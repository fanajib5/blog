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

The previous five articles built this GPS backend step by step: [protocols](/en/writing/2026/memahami-gps-protocol/), [TCP listener](/en/writing/2026/tcp-listener-gps-go/), [decoder](/en/writing/2026/decode-packet-gt06-teltonika/), [TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/), and [geofencing](/en/writing/2026/geofencing-postgis/). Data flows in, gets stored, and boundary events are detected.

Clients don't want database tables. They want **a map that moves on its own**. This final article brings the pieces together: WebSockets for real-time push, Redis pub/sub as the bridge from the ingest worker, and Leaflet.js in the browser. I tested all the code below end-to-end: a local Go server + Redis, the dashboard open in a real browser, and positions sent via `PUBLISH`.

## Polling First, WebSockets Later

The most naive way to build a "real-time" dashboard is polling: JavaScript calls `GET /api/positions` every 2 seconds. The arithmetic deteriorates quickly: 30 requests/minute per client. An operator dashboard with 20 open tabs generates 600 requests/minute, even though 90% of the payload hasn't changed. Average latency is also half the polling interval, so the "current" position is already 1 second stale.

There are two alternatives: **SSE** (Server-Sent Events, unidirectional over HTTP) or **WebSockets** (bidirectional, an upgrade from HTTP). If the only requirement is pushing positions to the browser, SSE is sufficient and simpler to implement. As discussed in Part 1, though, a GPS server may also need to *send commands back upstream* (querying current position on demand, modifying reporting intervals, or issuing remote engine cut-offs). For this series, we use WebSockets from the start.

The resulting architecture looks like this:

```text
[Tracker] → [Listener] → [Queue] → [Ingest Worker] ──┬──▶ [PostgreSQL]
                                                     ├──▶ [Redis: last position cache]
                                                     └──▶ [Redis PUBLISH positions:live]
                                                                │
                                               [Bridge (subscribe)] → [Hub] ──▶ N × browser WebSocket
```

The ingest worker is oblivious to any browser; it merely executes `PUBLISH`. The hub has no clue about GPS devices; it simply broadcasts. Redis decouples these two worlds cleanly, allowing each side to scale independently when traffic demands it.

## The Hub: Client Registry and Broadcast

The hub has three parts: a client registry, a broadcast channel, and a policy for handling slow consumers:

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
2. **Dropping clients whose buffers overflow.** This real-time dashboard is stateless-friendly: a dropped client can reconnect and hydrate its state from the cache. Ending a sluggish connection is cheaper than dragging down healthy clients.

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

The ingest worker that stores coordinates in TimescaleDB and validates geofences in Part 5 publishes each position with `rdb.Publish(ctx, "positions:live", jsonPosition)`. It can also execute `SET device:last:<id>` to cache the latest position. A newly connected client can fetch it from the cache instead of waiting for the next incoming packet to populate its map.

## In the Browser: Leaflet + Auto-Reconnect

In the browser, Leaflet displays the map and a marker for each device. The WebSocket connection reconnects if it drops:

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

I ran these three checks locally (loopback, local Redis, Chromium browser):

| Scenario | Result |
| --- | --- |
| 1 `PUBLISH` → 50 connected WebSocket clients | 50/50 received the update, within **2.5–3.4 ms** |
| Slow client (4 KB buffer, never reading) + healthy client, 300 messages of 64 KB transmitted | Healthy client received **300/300**; slow client was cleanly **dropped** by the hub (`slow client dropped` in server logs) |
| Real browser: 3 positions (2 devices) sent via `PUBLISH` | Status updated to `connected · 3 positions`; **2 markers** visible on map; updates for identical devices updated coordinates via `setLatLng` without duplicating markers |

In the browser test, each device has one marker whose position changes when a new message arrives. If a dashboard creates a new marker for every payload, the map becomes unreadable within a minute with 500 devices sending positions every 10 seconds. The `markers` dictionary uses `device_id` as its key so the existing marker can be updated.

## Production Gotchas to Keep in Mind

- **Ping/pong heartbeats.** Proxies and load balancers love silently terminating quiet connections. Send periodic pings from the server (in gorilla: configure `SetReadDeadline` alongside a pong handler) and reply from the client, or configure underlying `TCP keepalive`.
- **Connection authentication.** In production, do not keep `CheckOrigin` returning `true` for any arbitrary caller. Validate tokens and tenant identity during the upgrade handshake (via cookies or headers); WebSocket connections cannot be re-validated on every frame like typical stateless HTTP requests.
- **Backpressure is a feature.** A 64-message buffer coupled with evictions is a conscious engineering trade-off: dashboard metrics operate under *latest-wins* semantics (only the freshest coordinate matters), rather than strict delivery guarantees for every intermediate packet. Complete audit logs and telemetry histories remain the responsibility of the database ingestion pipeline.

## Key Takeaways

- **Decouple your pipeline**: the ingest worker only executes `PUBLISH`, while the hub strictly handles broadcasts, with Redis acting as the shock absorber in between. Both halves can scale on their own terms.
- **One writer goroutine per connection** paired with a per-client buffer and explicit drop semantics for lagging consumers.
- **Latest-wins paradigm**: update markers via `device_id` lookups rather than re-creating them, and hydrate newcomers straight from the last-known position cache.
- **Reconnection is part of the protocol**: an evicted or dropped client must gracefully reconnect and rebuild its local state without manual intervention.

## Series Wrap-Up

With this dashboard in place, all six articles now form a complete GPS backend pipeline: from raw bytes on a raw socket to live dots moving across a customer's map. The entire series will be compiled into a **free ebook: "Building a GPS Backend with Go"**. Keep an eye on the [RSS feed](/en/writing/index.xml) or [reach out directly](/en/contact/) for release announcements.

Topics under consideration for a follow-up series include message broker internals (RabbitMQ/Kafka), an API layer powered by Fiber + pgx, and zero-downtime deployment recipes on Coolify. If one of those is on your list, [let me know](/en/contact/).

## CTA

To discuss the WebSocket setup, Redis bridge, or marker updates in this dashboard, visit [Contact](/en/contact/) or follow future articles via [RSS](/en/writing/index.xml).
