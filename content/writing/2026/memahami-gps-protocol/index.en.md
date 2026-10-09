---
title: "Understanding GPS Protocols: How Tracker Devices Communicate"
description: "GPS trackers send location data via TCP sockets using brand-specific binary protocols. Learn how GPS tracker communication works, the packet structure of Teltonika and GT06, and why HTTP falls short."
author: "Faiq Najib Al-Aziz"
date: 2026-09-08
lastmod: 2026-09-13
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - gps
  - iot
  - tcp
  - networking
pillar: "gps-iot"
series:
  - gps-backend-series
series_part: 1
---

When I was first trusted to build and maintain a backend for hundreds of GPS trackers, I assumed it was just a matter of writing a standard REST API: the device fires off a `POST /api/location` with JSON, the server saves it to the database, and we're done.

I was dead wrong. (The full story of why that backend was eventually migrated from Laravel to Go, across 370+ endpoints, is documented in my [Hijrah Backend narrative series](/en/writing/2026/hijrah-backend-01/). The series you are reading right now is the tutorial counterpart: rebuilding the architecture from scratch, complete with code you can follow along with.)

GPS trackers know nothing about HTTP. There is no JSON. What actually arrives on the wire is a stream of raw bytes landing on a TCP connection (`\x00\x00\x00\x2f\x8e\x01\x04\x01\x03...`), with no HTTP headers, no content-type, and zero contextual hints. To make things more interesting, every single hardware vendor organizes those bytes differently.

This article is my field guide to understanding how GPS trackers communicate with a server. It is not a decoder walkthrough (we will tackle that in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/)), but rather the conceptual foundation you need before writing a single line of parser code.

## What Is a GPS Tracker, Really?

A GPS tracker is an embedded device built around two core modules:

1. **GPS module**: receives satellite signals to calculate physical position (latitude, longitude, altitude, speed, heading).
2. **GSM/LTE module**: transmits those telemetry coordinates to your server over cellular networks.

Beyond those basics, trackers typically feature:

- **Digital I/O**: sensors for door status (open/closed), engine ignition state, and SOS emergency buttons
- **Analog inputs**: fuel level and temperature sensors
- **Accelerometer**: crash detection, harsh braking, and motion triggers
- **Internal battery**: backup power reserve when the vehicle battery is disconnected

Data collected across all these sensors is bundled into a single compact packet and pushed to the server periodically, usually every 10 to 30 seconds when the vehicle is moving, and much less frequently when parked (to save cellular data).

## Why TCP Instead of HTTP?

This was the very first question that popped into my head: why didn't device manufacturers simply stick to an HTTP REST API?

There are four core reasons:

### 1. Bandwidth Efficiency

HTTP requests introduce massive overhead. Headers alone can easily consume 500+ bytes (`Host`, `Content-Type`, `Accept`, `Authorization`, and so on). In contrast, a typical binary GPS packet fits neatly into 40 to 60 bytes. Operating over flaky 2G/3G cellular links where SIM data is billed per megabyte, every single byte matters.

### 2. Persistent Connections

A vehicle tracker needs an **always-on persistent connection**. The server must be capable of sending downlink commands to the tracker at any moment: "cut the engine" (engine kill), "update reporting interval", or "request immediate location update". The transient request-response lifecycle of HTTP does not fit this requirement because connections close immediately after each exchange.

### 3. Granular Control Over Data Layout

HTTP imposes a rigid payload format (methods, headers, body, status codes). A bespoke binary protocol allows hardware manufacturers to design data layouts with surgical efficiency. A single byte can convey three or four discrete status fields simultaneously via bitmasks.

### 4. Hardware Constraints

Many GPS trackers run on ultra-low-power microcontrollers with tiny resource envelopes (often 64KB RAM, 48MHz clock speeds). An HTTP networking stack (header parsing, TLS handshakes, JSON serialization) consumes far too much memory and CPU cycles. Raw TCP sockets are remarkably lightweight in comparison.

## How GPS Tracker Communication Works

In simplified terms, the communication lifecycle looks like this:

```
Device                          Server
  │                               │
  │──── Connect (TCP) ───────────→│
  │                               │
  │──── Login packet (IMEI) ─────→│
  │                               │
  │←─── ACK / Login response ─────│
  │                               │
  │──── Location data ───────────→│  (loop, every N seconds)
  │←─── ACK ──────────────────────│
  │                               │
  │←─── Command (optional) ───────│  (server → device)
  │──── Command response ────────→│
  │                               │
  │──── Heartbeat (keep-alive) ──→│  (when idle)
  │←─── Heartbeat ACK ────────────│
  │                               │
```

### Phase 1: Connection & Login

The tracker opens a raw TCP socket to the server's IP and port. Once connected, the tracker dispatches a **login packet**, typically containing its IMEI (International Mobile Equipment Identity), the unique 15-digit identifier that serves as the hardware's identity.

The server acknowledges with an ACK packet. If the IMEI is unrecognized or unauthorized, the server can immediately drop the connection or ignore subsequent packets.

### Phase 2: Data Reporting

Following a successful handshake, the tracker begins pushing telemetry packets at regular intervals. Many protocols also emit event-driven triggers:

- When motion is detected
- When a distance threshold from the previous coordinate is crossed (distance-based reporting)
- When ignition is toggled on or off
- When the SOS button is triggered
- When an onboard geofence is breached

Every location packet contains at minimum: timestamp, latitude, and longitude. In real-world telemetry, it also packs: speed, heading/azimuth, altitude, I/O sensor status (ignition, door switches, alarms), and backup battery voltage.

### Phase 3: Server Commands

The server can dispatch commands to any online tracker. Typical examples include:

- **Reboot device**: handy when hardware firmware hangs
- **Set reporting interval**: adjust ping frequencies dynamically
- **Engine cut**: disable the starter motor relay (anti-theft immobilizer)
- **Listen-in**: open an audio monitoring channel via onboard mic
- **Request current location**: force an immediate coordinate broadcast

### Phase 4: Heartbeat / Keep-Alive

When the vehicle is parked and stationary, the tracker keeps the TCP connection alive by sending a lightweight heartbeat ping every 2 to 5 minutes. This prevents intermediate carrier NAT timeouts and ensures the socket remains reachable.

## Anatomy of a GPS Packet

While protocol specifications vary across vendors, most binary GPS protocols adhere to this general layout:

```
┌──────────┬──────────┬────────────┬─────────────┬──────────┬──────────┐
│  Start   │  Length  │  Protocol  │   Payload   │   CRC    │   End    │
│  Marker  │  Bytes   │    ID      │   (Data)    │  Check   │  Marker  │
└──────────┴──────────┴────────────┴─────────────┴──────────┴──────────┘
```

- **Start marker**: fixed sentinel bytes denoting packet start (e.g., `\x78\x78` for GT06, or four zero bytes `\x00\x00\x00\x00` for Teltonika)
- **Length**: payload byte length, informing the server when a full packet frame has been read
- **Protocol ID / Codec ID**: data type identifier (location update, alarm notification, heartbeat, command acknowledgment)
- **Payload**: the actual serialized telemetry (IMEI, coordinates, sensor bitfields)
- **CRC**: checksum validating data integrity over the wire
- **End marker**: sentinel bytes indicating the end of the frame (e.g., `\x0d\x0a` for GT06)

### Example: GT06 (Concox) Packet Structure

GT06 is one of the most widely used tracker protocols in Indonesia due to affordable hardware and widespread availability. Its packet structure looks like this:

```
78 78      Start bit (2 bytes)
0D         Length (1 byte: spanning protocol number through CRC, inclusive)
01         Protocol number (login = 0x01)
01 23 45 67 89 01 23 45    IMEI (8 bytes, BCD encoded)
00 01      Serial number (2 bytes)
8C DD      CRC-ITU (2 bytes)
0D 0A      Stop bit (2 bytes)
```

The example above illustrates a login packet from the Concox GT06 v1.8.1 datasheet for terminal ID `123456789012345` (a 15-digit IMEI: 8 BCD bytes hold 16 nibbles, with the leading nibble dropped). CRC-ITU is computed starting from the _length_ byte through the _serial number_ (inclusive); we will dive into CRC variants in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/). The `0x7878` header and `0x0D0A` trailer act as the GT06 "signature". When you spot those bytes in raw TCP logs, you immediately know: this is Concox/GT06 family hardware.

### Example: Teltonika Packet Structure

Teltonika (FMB and FMTC series) adopts a different, more structured design built around "codec" frames:

```
0000 0000        Preamble (4 zero bytes)
0000 0039         Data field length (4 bytes)
08               Codec ID (1 byte: 0x08 = codec8, 0x0E = codec8 extended)
01               Number of data (1 byte: count of AVL records)
...              AVL data (IMEI + records)
...              Number of data (repeat verification)
0000 0XXX         CRC-16 (4 bytes)
```

Teltonika uses a 4-byte length prefix and CRC-16, whereas GT06 uses a 1-byte length, 2-byte CRC-ITU, and an incremental serial number used to match ACKs. These structural differences become crucial when we write robust decoders in Part 3.

## Popular Protocols in the Field

Drawing from my hands-on production experience in fleet tracking, here are the protocols and brands you will encounter most often:

| Protocol       | Common Brands                        | Format         | Description                                 |
| -------------- | ------------------------------------ | -------------- | ------------------------------------------- |
| **GT06**       | Concox, Coban, Xexun, diverse OEMs   | Binary         | Most affordable, widest variety of clones   |
| **Teltonika**  | Teltonika FMB/FMTC/FM                | Binary         | Premium tier, rock-solid docs, codec system |
| **Meitrack**   | Meitrack MVT/MST                     | Binary         | Common across enterprise fleet deployments  |
| **Wialon IPS** | Various brands (Universal)           | Text (ASCII)   | Comma-separated, human-readable format      |
| **H02**        | H02/GPS103                           | Text (ASCII)   | Simple, prevalent in budget trackers        |
| **MQTT**       | Modern multi-sensor hardware         | JSON over MQTT | Emerging trend: 4G hardware pushing JSON    |

### Binary vs. Text Protocols

GPS protocols fall into two broad architectural families:

**Binary protocols** (Teltonika, GT06, Meitrack):

- Every byte carries precise meaning, frequently packing multiple fields
- Highly bandwidth-efficient (1 byte = 8 bits = 8 independent boolean flags)
- Harder for human inspection (`\x8e\x01\x04` vs. `lat=-6.2,lng=106.8`)
- Demands rigorous vendor documentation to parse correctly

**Text protocols** (Wialon, H02):

- Directly readable ASCII strings: `#L#359769030123456;NA`
- Trivial to debug in plaintext logs
- Higher bandwidth footprint
- Suited for quick prototyping or low-complexity devices

### The Trend: MQTT and JSON

Next-generation GPS trackers (4G/LTE, Cat-M1, NB-IoT) are increasingly adopting MQTT with JSON payloads. This represents a noticeable shift:

```json
{
  "imei": "359769030123456",
  "lat": -6.2,
  "lng": 106.816666,
  "speed": 42,
  "course": 180,
  "ignition": true,
  "timestamp": "2026-09-08T10:30:00Z"
}
```

JSON is effortless to parse, human-readable, and does not require low-level protocol decoding specs. However, legacy 2G/3G devices still dominate the market and run on binary TCP. For years to come, both architectures will coexist.

## Common Misconceptions I Learned the Hard Way

### "Reading one vendor's documentation is enough"

Wrong. GT06 has dozens of protocol dialect variations because countless white-label OEM clones tweaked minor framing details. Concox GT06, Coban GPS103, and "generic GT06" have subtle quirks that will crash your parser unless you guard against unexpected packet variations.

### "IMEIs are always globally unique"

In theory, yes. In practice? Budget clone hardware often ships with duplicate or invalid IMEIs right out of the box. Always assign an internal surrogate `device_id` primary key in your database; never use raw IMEIs as primary keys without normalization.

### "An active TCP connection means the tracker is online"

Not necessarily. NAT connection table drops, silent cellular resets, and frozen hardware loops can leave a socket half-open on the server side while the physical device has been offline for hours. Explicit heartbeat/keep-alive timeouts are mandatory, not optional.

### "Every tracker reports timestamps in UTC"

Most do, but several vendors push timestamps in local vehicle time (such as UTC+7 for Indonesia). Always cross-reference your protocol spec, or better yet, assume nothing and verify against real hardware running live tests.

## Tools for Packet Inspection

Before writing decoder code, you will want a way to inspect raw incoming traffic. Here are the tools I rely on:

### 1. TCP Proxy Logger

A simple TCP proxy that dumps raw bytes to standard output before forwarding them to an upstream server:

```go
// Minimal TCP logger: dump all inbound bytes
func handleConn(conn net.Conn) {
    defer conn.Close()
    buf := make([]byte, 1024)
    for {
        n, err := conn.Read(buf)
        if err != nil {
            break
        }
        fmt.Printf("%x\n", buf[:n]) // print as hex
    }
}
```

Hex dumps let you visually analyze byte layouts and cross-examine them against vendor datasheets.

### 2. Wireshark

If you can capture network traffic directly on your server interface, Wireshark filtered by `tcp.port == 5094` (or whatever listening port you use) will surface every packet in detail. Use "Follow TCP Stream" to view full duplex conversational sessions between tracker and server.

### 3. Device Simulators

Certain vendors provide desktop simulation software. If none is available, record raw packet captures from physical trackers and build a replay harness for automated testing. This is invaluable: you do not want to rely on physical test devices every time you tweak your parsing logic across multiple protocols.

## Key Takeaways Before Moving Forward

By this stage, you should have a solid grasp of:

- **Why GPS devices run on TCP sockets rather than HTTP**: bandwidth efficiency, persistent downlinks, and compact binary representations
- **Device-to-server lifecycle**: connect → login → telemetry reporting → commands → heartbeat
- **Binary packet anatomy**: start sentinel, length prefix, payload, CRC, end sentinel
- **Protocol tradeoffs**: binary vs. text, GT06 vs. Teltonika vs. MQTT
- **Production gotchas**: duplicated IMEIs, zombie TCP sockets, and inconsistent timestamp timezones

This conceptual clarity is your foundation. Without it, seeing a raw `0x7878` header in production logs will look like gibberish rather than an actionable signal.

## What's Next

This article is part of the **Building a GPS Backend from Scratch** series.

Up next: [Part 2: Building a High-Performance GPS TCP Listener in Go](/en/writing/2026/tcp-listener-gps-go/). We will dive straight into code, creating a concurrent TCP listener capable of handling hundreds of tracker connections using Go goroutines.

If you are eager to jump straight to packet parsing, [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/) covers binary frame decoding for GT06 and Teltonika in depth.

## Wrap-Up

If you found this guide helpful, feel free to share it. For discussions or questions, reach out via [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
