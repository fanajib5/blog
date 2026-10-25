---
title: "Understanding GPS Protocols: How Tracker Devices Communicate"
description: "GPS trackers send location data over TCP sockets using binary protocols that differ per brand. My notes on how it works, the packet formats of Teltonika and GT06, and why not HTTP."
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

When I was first trusted with the backend for hundreds of GPS trackers, I figured the job was just a standard REST API: the device sends a `POST /api/location` with JSON, the server saves it to the database, done. Easy, right? Hahaha.

I was wrong. The backend was eventually migrated from Laravel to Go, covering 370+ endpoints. I tell the full story in my [Hijrah Backend narrative series](/en/writing/2026/hijrah-backend-01/). The series you're reading is its tutorial counterpart: rebuilding the backend from scratch, with code you can follow along.

GPS trackers don't speak HTTP. No JSON either. A TCP connection carries raw bytes such as `\x00\x00\x00\x2f\x8e\x01\x04\x01\x03...`, with no headers, content-type, or any hint at all. Each brand also has its own way of arranging those bytes.

In this article I'll first talk about how GPS trackers chat with a server. It's not the decoder tutorial yet, that's in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/). We start with the concepts you need before writing any parser code.

## What Is a GPS Tracker, Really?

A GPS tracker is an embedded device built around two core modules:

1. **GPS module**: receives satellite signals to work out position (latitude, longitude, altitude, speed, heading).
2. **GSM/LTE module**: sends that position data to your server over the cellular network.

Besides those, trackers usually have:

- **Digital I/O**: sensors for door open/closed, ignition (engine on), and SOS buttons
- **Analog inputs**: fuel level and temperature sensors
- **Accelerometer**: shock detection (crashes or harsh braking)
- **Internal battery**: backup when main power is disconnected

Data from all these sensors is bundled into one packet and pushed to the server periodically, usually every 10 to 30 seconds while moving, and less often when parked to save data.

## Why TCP Instead of HTTP?

My first question was the same: why don't the devices just use an HTTP REST API?

There are four reasons.

### 1. Bandwidth Efficiency

HTTP requests carry a lot of overhead. Headers alone can easily eat 500+ bytes (`Host`, `Content-Type`, `Accept`, `Authorization`, and so on), while a typical binary GPS packet is only 40 to 60 bytes. Over flaky 2G/3G links, with SIM data billed per megabyte, every byte counts.

### 2. Persistent Connections

A tracker needs to keep its connection alive so the server can send commands anytime: "cut the engine" (engine kill), "update reporting interval", or "send location now". HTTP is request-response. Sending a command while the device isn't making a request needs another mechanism, like polling or a separate channel.

### 3. Full Control Over the Data Layout

HTTP forces a certain structure (methods, headers, body, status codes). A custom binary protocol lets manufacturers design the format as compactly as they like. With bitmasks, one byte can stand for three or four fields.

### 4. Hardware Constraints

Many GPS trackers use microcontrollers with limited resources (often 64KB RAM and a 48MHz clock). An HTTP stack (header parsing, TLS handshakes, JSON serialization) eats too much of that. Raw TCP sockets are much lighter.

## How GPS Tracker Communication Works

The flow looks like this:

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

The tracker opens a TCP socket to the server's IP and port. Once connected, it sends a **login packet**, usually containing its IMEI (International Mobile Equipment Identity), a unique 15-digit number that identifies the device.

The server replies with an ACK. If the IMEI is unknown or unauthorized, the server can close the connection or ignore the data.

### Phase 2: Data Reporting

After a successful login, the tracker starts sending location data at regular intervals. Many protocols also report on events:

- When motion is detected
- When a distance threshold from the previous point is crossed (distance-based reporting)
- When ignition is switched on or off
- When the SOS button is pressed
- When a geofence is breached

Every location packet contains at least a timestamp, latitude, and longitude. There's usually speed, heading/azimuth, altitude, I/O status (ignition, door, alarms), and battery level too.

### Phase 3: Server Commands

The server can send commands to any online tracker. For example:

- **Reboot device**: handy when firmware hangs
- **Set reporting interval**: change how often it sends data
- **Engine cut**: disable the starter relay (anti-theft)
- **Listen-in**: open the onboard mic for audio monitoring
- **Request current location**: ask for a position right now

### Phase 4: Heartbeat / Keep-Alive

When the vehicle is parked and idle, the tracker keeps the TCP connection alive by sending a heartbeat packet every 2 to 5 minutes. This prevents NAT timeouts and keeps the socket reachable.

## Anatomy of a GPS Packet

Formats differ across brands, but most binary GPS packets follow this general layout:

```
┌──────────┬──────────┬────────────┬─────────────┬──────────┬──────────┐
│  Start   │  Length  │  Protocol  │   Payload   │   CRC    │   End    │
│  Marker  │  Bytes   │    ID      │   (Data)    │  Check   │  Marker  │
└──────────┴──────────┴────────────┴─────────────┴──────────┴──────────┘
```

- **Start marker**: fixed bytes marking the start of a packet (e.g., `\x78\x78` for GT06, or four zero bytes `\x00\x00\x00\x00` for Teltonika)
- **Length**: payload byte length (so the server knows when a full packet has been read)
- **Protocol ID / Codec ID**: identifier for the data type (location, alarm, heartbeat, command response)
- **Payload**: the actual data (IMEI, coordinates, I/O status, etc.)
- **CRC**: checksum to validate data integrity
- **End marker**: fixed bytes marking the end of a packet (e.g., `\x0d\x0a` for GT06)

### Example: GT06 (Concox) Packet Structure

GT06 is common in Indonesia because the hardware is cheap and easy to find. Its structure looks like this:

```
78 78      Start bit (2 bytes)
0D         Length (1 byte: spanning protocol number through CRC, inclusive)
01         Protocol number (login = 0x01)
01 23 45 67 89 01 23 45    IMEI (8 bytes, BCD encoded)
00 01      Serial number (2 bytes)
8C DD      CRC-ITU (2 bytes)
0D 0A      Stop bit (2 bytes)
```

The example above is a login packet from the Concox GT06 v1.8.1 datasheet for terminal ID `123456789012345` (a 15-digit IMEI: 8 BCD bytes hold 16 nibbles, with the leading nibble dropped). CRC-ITU is computed from the _length_ byte through the _serial number_ (inclusive); we'll go through CRC variants in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/). The `0x7878` header and `0x0D0A` trailer are kind of the GT06 "signature". When you spot those bytes in raw TCP logs, you know right away it's Concox/GT06 family hardware.

### Example: Teltonika Packet Structure

Teltonika (FMB and FMTC series) takes a slightly different approach. The structure is more orderly and built around "codec" frames:

```
0000 0000        Preamble (4 zero bytes)
0000 0039         Data field length (4 bytes)
08               Codec ID (1 byte: 0x08 = codec8, 0x0E = codec8 extended)
01               Number of data (1 byte: count of AVL records)
...              AVL data (records only; IMEI is sent separately during the handshake)
...              Number of data (repeat verification)
0000 0XXX         CRC-16 (4 bytes)
```

Teltonika uses a 4-byte length prefix and CRC-16, while GT06 uses a 1-byte length, 2-byte CRC-ITU, and a serial number to match ACKs. These differences will matter when we write decoders in Part 3.

## Popular Protocols in the Field

From my experience with GPS tracking in production, these are the protocols and brands you're likely to run into:

| Protocol       | Common Brands                        | Format         | Description                                 |
| -------------- | ------------------------------------ | -------------- | ------------------------------------------- |
| **GT06**       | Concox, Coban, Xexun, diverse OEMs   | Binary         | Most affordable, widest variety of clones   |
| **Teltonika**  | Teltonika FMB/FMTC/FM                | Binary         | Premium tier, solid docs, codec system      |
| **Meitrack**   | Meitrack MVT/MST                     | Binary         | Common across enterprise fleet deployments  |
| **Wialon IPS** | Various brands (Universal)           | Text (ASCII)   | Comma-separated, human-readable format      |
| **H02**        | H02/GPS103                           | Text (ASCII)   | Simple, common in budget trackers           |
| **MQTT**       | Modern multi-sensor hardware         | JSON over MQTT | Emerging trend: 4G hardware pushing JSON    |

### Binary vs. Text Protocols

GPS protocols fall into two big camps.

**Binary protocols** (Teltonika, GT06, Meitrack):

- Every byte has a precise meaning, often packing several fields
- Very bandwidth-efficient (1 byte = 8 bits = 8 independent boolean flags)
- Harder for humans to read (`\x8e\x01\x04` vs. `lat=-6.2,lng=106.8`)
- Needs thorough vendor documentation to parse correctly

**Text protocols** (Wialon, H02):

- Directly readable ASCII strings: `#L#359769030123456;NA`
- Easy to debug in plaintext logs
- Higher bandwidth footprint
- Good for quick prototyping or low-resource devices

### The Trend: MQTT and JSON

Lately I've started running into newer trackers (4G/LTE, Cat-M1, NB-IoT) that use MQTT with JSON payloads. A payload can look like this:

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

JSON is easier to parse, human-readable, and doesn't need a special low-level protocol spec. But in Indonesia 2G/3G devices are still common and still use binary TCP. Both approaches will probably live side by side for the next few years.

## Misconceptions I Learned the Hard Way

### "Reading one vendor's documentation is enough"

Wrong. GT06 has dozens of protocol variations because countless white-label OEM clones tweaked small framing details. Concox GT06, Coban GPS103, and "generic GT06" have subtle differences that will crash your parser if you don't handle those edge cases.

### "IMEIs are always unique per device"

In theory, yes. In practice, cheap clone hardware can ship with duplicate or invalid IMEIs. Give your database its own surrogate `device_id` primary key, and don't use raw IMEIs as primary keys without normalization.

### "An active TCP connection means the tracker is online"

Not always. NAT table drops, silent carrier-level resets, and frozen devices can leave a socket looking alive on the server while the device has been dead for hours. That's why heartbeat/keep-alive timeouts are a must.

### "Every tracker reports timestamps in UTC"

Most do, but some brands send timestamps in local time (such as UTC+7 for Indonesia). Check the protocol spec, or better, don't assume and test with a real device.

## Tools for Packet Inspection

Before writing a decoder, I "peek" at the incoming traffic first with a few tools.

### 1. TCP Packet Logger

To see packet structure, use a simple TCP connection handler that logs incoming bytes. This example only receives and prints data; it does not forward anything to another server:

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

If you can capture traffic on the server interface, filter Wireshark by `tcp.port == 5094` (or your listening port) to inspect each packet. "Follow TCP Stream" shows the full conversation between tracker and server.

### 3. Device Simulators

Some vendors provide simulators. If yours doesn't, record packets from a physical tracker and replay them in tests. That way you don't need a physical device every time you work on a decoder for another protocol.

## What to Have in Your Head Before Moving On

Before moving on, make sure you've got these:

- **Why GPS devices use TCP sockets rather than HTTP**: bandwidth efficiency, persistent connections, and control over the format
- **Device-to-server lifecycle**: connect → login → data reporting → commands → heartbeat
- **Binary packet anatomy**: start marker, length, payload, CRC, end marker
- **Protocol differences per brand**: binary vs. text, GT06 vs. Teltonika vs. MQTT
- **Common gotchas**: duplicated IMEIs, TCP "alive" but device dead, inconsistent timezones

## What's Next

This article is part of the **Building a GPS Backend from Scratch** series.

Next up: [Part 2: Building a High-Performance GPS TCP Listener in Go](/en/writing/2026/tcp-listener-gps-go/), where we build a TCP server that handles hundreds of tracker connections concurrently with goroutines.

If you want to jump straight to reading packets, [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/) covers the details of parsing GT06 and Teltonika binary frames.

## CTA

For questions or discussion, head to [Contact](/en/contact/) or subscribe to [RSS](/en/writing/index.xml).
