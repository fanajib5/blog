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

When I first took responsibility for the backend serving hundreds of GPS trackers, I assumed the job was to build a standard REST API: the device sends a `POST /api/location` with JSON, the server saves it to the database, and that's it.

I was wrong. The backend was eventually migrated from Laravel to Go across 370+ endpoints. I tell the full story in my [Hijrah Backend narrative series](/en/writing/2026/hijrah-backend-01/). The series you are reading is its tutorial counterpart: rebuilding the backend from scratch, with code you can follow.

GPS trackers do not speak HTTP or send JSON. A TCP connection carries raw bytes such as `\x00\x00\x00\x2f\x8e\x01\x04\x01\x03...`, with no HTTP headers, content-type, or other clues. Each hardware vendor also has its own way of arranging those bytes.

This article explains how GPS trackers communicate with a server. It is not a decoder walkthrough; that is covered in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/). Here, we will cover the concepts you need before writing parser code.

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

My first question was simple: why don't device manufacturers just use an HTTP REST API?

There are four core reasons:

### 1. Bandwidth Efficiency

HTTP requests add overhead. Headers alone can easily consume 500+ bytes (`Host`, `Content-Type`, `Accept`, `Authorization`, and so on), while a typical binary GPS packet is only 40 to 60 bytes. Over unreliable 2G/3G cellular links, where SIM data is billed per megabyte, every byte matters.

### 2. Persistent Connections

A vehicle tracker needs an **always-on persistent connection**. The server must be able to send downlink commands at any moment: "cut the engine" (engine kill), "update reporting interval", or "request immediate location update". HTTP's short-lived request-response cycle does not fit because connections close after each exchange.

### 3. Granular Control Over Data Layout

HTTP defines a fixed structure (methods, headers, body, and status codes). A custom binary protocol lets hardware manufacturers choose a compact data layout. With bitmasks, a single byte can represent three or four status fields.

### 4. Hardware Constraints

Many GPS trackers use microcontrollers with limited resources (often 64KB RAM and a 48MHz clock). An HTTP stack (header parsing, TLS handshakes, JSON serialization) can use too much memory and processing power. Raw TCP sockets are lighter.

## How GPS Tracker Communication Works

The communication lifecycle looks like this:

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

The tracker opens a TCP socket to the server's IP and port. Once connected, it sends a **login packet**, typically containing its IMEI (International Mobile Equipment Identity), a unique 15-digit identifier for the device.

The server responds with an ACK packet. If the IMEI is unknown or unauthorized, the server can close the connection or ignore subsequent packets.

### Phase 2: Data Reporting

After a successful handshake, the tracker sends telemetry packets at regular intervals. Many protocols also report events:

- When motion is detected
- When a distance threshold from the previous coordinate is crossed (distance-based reporting)
- When ignition is toggled on or off
- When the SOS button is triggered
- When an onboard geofence is breached

Every location packet contains at least a timestamp, latitude, and longitude. It may also include speed, heading/azimuth, altitude, I/O sensor status (ignition, door switches, alarms), and backup battery voltage.

### Phase 3: Server Commands

The server can send commands to any online tracker. Examples include:

- **Reboot device**: handy when hardware firmware hangs
- **Set reporting interval**: adjust ping frequencies dynamically
- **Engine cut**: disable the starter motor relay (anti-theft immobilizer)
- **Listen-in**: open an audio monitoring channel via onboard mic
- **Request current location**: force an immediate coordinate broadcast

### Phase 4: Heartbeat / Keep-Alive

When the vehicle is parked and stationary, the tracker keeps the TCP connection alive by sending a lightweight heartbeat ping every 2 to 5 minutes. This prevents intermediate carrier NAT timeouts and ensures the socket remains reachable.

## Anatomy of a GPS Packet

Protocol specifications vary across vendors, but most binary GPS packets follow this general layout:

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

GT06 is common in Indonesia because the hardware is affordable and widely available. Its packet structure looks like this:

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

Teltonika (FMB and FMTC series) uses a different, more structured design built around "codec" frames:

```
0000 0000        Preamble (4 zero bytes)
0000 0039         Data field length (4 bytes)
08               Codec ID (1 byte: 0x08 = codec8, 0x0E = codec8 extended)
01               Number of data (1 byte: count of AVL records)
...              AVL data (IMEI + records)
...              Number of data (repeat verification)
0000 0XXX         CRC-16 (4 bytes)
```

Teltonika uses a 4-byte length prefix and CRC-16, while GT06 uses a 1-byte length, 2-byte CRC-ITU, and an incremental serial number to match ACKs. These differences matter when we write decoders in Part 3.

## Popular Protocols in the Field

From my experience with GPS tracking in production, these are protocols and brands you are likely to encounter:

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

Next-generation GPS trackers (4G/LTE, Cat-M1, NB-IoT) are increasingly adopting MQTT with JSON payloads. The payload can look like this:

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

JSON is easier to parse, human-readable, and does not require a low-level protocol specification. However, 2G/3G devices still dominate the market and use binary TCP. Both approaches will coexist for the next few years.

## Common Misconceptions I Learned the Hard Way

### "Reading one vendor's documentation is enough"

Wrong. GT06 has dozens of protocol dialect variations because countless white-label OEM clones tweaked minor framing details. Concox GT06, Coban GPS103, and "generic GT06" have subtle quirks that will crash your parser unless you guard against unexpected packet variations.

### "IMEIs are always globally unique"

In theory, yes. In practice, budget clone hardware can ship with duplicate or invalid IMEIs. Assign an internal surrogate `device_id` primary key in your database; do not use raw IMEIs as primary keys without normalization.

### "An active TCP connection means the tracker is online"

Not necessarily. NAT connection table drops, silent cellular resets, and frozen hardware loops can leave a socket half-open on the server while the device has been offline for hours. Heartbeat/keep-alive timeouts are essential to detect this.

### "Every tracker reports timestamps in UTC"

Most do, but some vendors send timestamps in local vehicle time (such as UTC+7 for Indonesia). Check the protocol spec and verify it against a real device.

## Tools for Packet Inspection

Before writing a decoder, inspect the incoming traffic. These are the tools I use:

### 1. TCP Proxy Logger

A simple TCP proxy can dump raw bytes to standard output before forwarding them to an upstream server:

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

Hex dumps make it easier to compare packet layouts with vendor datasheets.

### 2. Wireshark

If you can capture traffic on the server interface, filter Wireshark by `tcp.port == 5094` (or your listening port) to inspect packets. "Follow TCP Stream" shows the full conversation between tracker and server.

### 3. Device Simulators

Some vendors provide desktop simulators. If yours does not, record packets from a physical tracker and replay them in automated tests. That way, you do not need a physical device every time you change parsing logic for another protocol.

## Key Takeaways Before Moving Forward

Before moving on, keep these points in mind:

- **Why GPS devices run on TCP sockets rather than HTTP**: bandwidth efficiency, persistent downlinks, and compact binary representations
- **Device-to-server lifecycle**: connect → login → telemetry reporting → commands → heartbeat
- **Binary packet anatomy**: start sentinel, length prefix, payload, CRC, end sentinel
- **Protocol tradeoffs**: binary vs. text, GT06 vs. Teltonika vs. MQTT
- **Production gotchas**: duplicated IMEIs, zombie TCP sockets, and inconsistent timestamp timezones

## What's Next

This article is part of the **Building a GPS Backend from Scratch** series.

Next is [Part 2: Building a High-Performance GPS TCP Listener in Go](/en/writing/2026/tcp-listener-gps-go/), where we build a concurrent TCP listener that handles hundreds of tracker connections with Go goroutines.

[Part 3](/en/writing/2026/decode-packet-gt06-teltonika/) covers binary frame decoding for GT06 and Teltonika.

## Wrap-Up

For questions or discussion, use [Contact](/en/contact/) or subscribe to [RSS](/en/writing/index.xml).
