---
title: "Building a Real-Time GPS Dashboard"
description: "The last GPS Backend episode: sending fleet positions to a map with WebSockets, Redis pub/sub, and Leaflet.js. I tested the flow from Go and Redis through to a browser."
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

In the previous five articles, I put this GPS backend together bit by bit: [protocols](/en/writing/2026/memahami-gps-protocol/), [TCP listener](/en/writing/2026/tcp-listener-gps-go/), [decoder](/en/writing/2026/decode-packet-gt06-teltonika/), [TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/), and [geofencing](/en/writing/2026/geofencing-postgis/). Data comes in, gets stored, and can trigger boundary events.

Customers don’t look at database tables. They want **a map that moves**. In this last article, I connect the pieces: WebSockets send the positions, Redis pub/sub bridges the ingest worker, and Leaflet.js displays them in the browser. I tested the code on my laptop with a local Go server and Redis. Then I opened the dashboard in a browser and sent positions with `PUBLISH`. It’s pretty satisfying to watch the dots move hehe.

## From Polling to WebSockets

The simplest way to make a dashboard feel "real-time" is polling: JavaScript calls `GET /api/positions` every 2 seconds. But the requests add up. One client makes 30 requests per minute; 20 open tabs on an operator’s dashboard make 600, even though 90% of the data is unchanged. Average latency is half the polling interval, so the "current" position may already be a second old.

Other options are **SSE** (Server-Sent Events, one-way over HTTP) and **WebSockets** (two-way, upgraded from HTTP). If all we need is to send positions to the browser, SSE is enough and simpler. But as I mentioned in Part 1, a GPS server may need to send commands back too, such as requesting a current position, changing the interval, or issuing an engine cut-off. So I chose WebSockets for this series.

The flow looks roughly like this:

```text
[Tracker] → [Listener] → [Queue] → [Ingest Worker] ──┬──▶ [PostgreSQL]
                                                     ├──▶ [Redis: last position cache]
                                                     └──▶ [Redis PUBLISH positions:live]
                                                                │
                                               [Bridge (subscribe)] → [Hub] ──▶ N × browser WebSocket
```

The ingest worker doesn’t need to know about browsers. It only executes `PUBLISH`. The hub doesn’t need to know about devices either; it just broadcasts. Redis sits between them. If traffic grows, each part can be scaled on its own.

## A Hub to Manage Clients

The hub keeps a client list, a broadcast channel, and a rule for slow clients. Here’s the code:

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

There are two choices in this code that might not be obvious:

1. **A buffered `send` channel for each client.** `Broadcast` never touches socket I/O; it simply enqueues messages into each client's buffer. A dedicated writer goroutine per connection drains that buffer. Without this layer, a single browser on a flaky connection would choke the broadcast loop for everyone else.
2. **Disconnect clients whose queues fill up.** This real-time dashboard is stateless-friendly: a dropped client can reconnect and hydrate its state from the cache. Ending a sluggish connection is cheaper than dragging down healthy clients.

(In my first version, I called `delete` on the map inside `RLock`. I only noticed on a closer look that this was a data race: writing to a map while the read lock was held. The code above collects candidates under `RLock`, then removes them under `Lock`. Run with `-race` and it will catch this.)

## WebSocket Endpoint: Keep One Writer

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

The gorilla/websocket rule (and a general WebSocket rule) is: **don’t let two goroutines write to the same connection at once**. One writer per connection avoids that; the reader just waits for the connection to close. `SetWriteDeadline` also stops the writer from waiting forever if the browser stops responding.

## Passing Messages from Redis

```go
func bridge(ctx context.Context, hub *Hub, rdb *redis.Client) {
    sub := rdb.Subscribe(ctx, "positions:live")
    for msg := range sub.Channel() {
        hub.Broadcast([]byte(msg.Payload))
    }
}
```

The ingest worker that stores coordinates in TimescaleDB and validates geofences in Part 5 publishes each position with `rdb.Publish(ctx, "positions:live", jsonPosition)`. It can also execute `SET device:last:<id>` to cache the latest position. A newly connected client can fetch it from the cache instead of waiting for the next incoming packet to populate its map.

## In the Browser, the Markers Move

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

## What I Tried Locally

I tried these three scenarios on my laptop, using loopback, local Redis, and Chromium:

| Scenario | Result |
| --- | --- |
| 1 `PUBLISH` → 50 connected WebSocket clients | 50/50 received the update, within **2.5-3.4 ms** |
| Slow client (4 KB buffer, never reading) + healthy client, 300 messages of 64 KB transmitted | Healthy client received **300/300**; slow client was cleanly **dropped** by the hub (`slow client dropped` in server logs) |
| Real browser: 3 positions (2 devices) sent via `PUBLISH` | Status updated to `connected · 3 positions`; **2 markers** visible on map; updates for identical devices updated coordinates via `setLatLng` without duplicating markers |

In the browser test, each device gets one marker, and its coordinates update when a new message arrives. If we made a new marker for every message, the map would become a mess within a minute with 500 devices reporting every 10 seconds. That’s why `markers` uses `device_id` as its key.

## Things Still to Sort Out for Production

- **Ping/pong heartbeats.** Proxies and load balancers love silently terminating quiet connections. Send periodic pings from the server (in gorilla: configure `SetReadDeadline` alongside a pong handler) and reply from the client, or configure underlying `TCP keepalive`.
- **Connection authentication.** In production, do not keep `CheckOrigin` returning `true` for any arbitrary caller. Validate tokens and tenant identity during the upgrade handshake (via cookies or headers); WebSocket connections cannot be re-validated on every frame like typical stateless HTTP requests.
- **Backpressure is a feature.** A 64-message buffer coupled with evictions is a conscious engineering trade-off: dashboard metrics operate under *latest-wins* semantics (only the freshest coordinate matters), rather than strict delivery guarantees for every intermediate packet. Complete audit logs and telemetry histories remain the responsibility of the database ingestion pipeline.

## A Few Things to Remember

- **Decouple your pipeline**: the ingest worker only executes `PUBLISH`, while the hub strictly handles broadcasts, with Redis acting as the shock absorber in between. Both halves can scale on their own terms.
- **One writer goroutine per connection** paired with a per-client buffer and explicit drop semantics for lagging consumers.
- **Latest-wins paradigm**: update markers via `device_id` lookups rather than re-creating them, and hydrate newcomers straight from the last-known position cache.
- **Reconnection is part of the protocol**: an evicted or dropped client must gracefully reconnect and rebuild its local state without manual intervention.

## The Series Is Done, Now What?

That makes six articles covering the GPS backend, from raw bytes on a socket to moving dots on a customer’s map. I plan to put the series together as a **free ebook, "Building a GPS Backend with Go"**. I’ll share release news through the [RSS feed](/en/writing/index.xml) or [Contact](/en/contact/).

For a follow-up series, I’m considering message brokers (RabbitMQ/Kafka), an API with Fiber + pgx, or deployment on Coolify. If there’s one you’d rather read about, [let me know](/en/contact/).

To discuss the WebSocket setup, Redis bridge, or marker updates, [reach out directly](/en/contact/). You can follow future posts via [RSS](/en/writing/index.xml).
