---
title: "Decoding Packets: GT06 & Teltonika Protocols"
description: "Parsing binary GPS tracker packets in Go: why GT06's CRC-ITU isn't standard CCITT, decoding BCD IMEIs, extracting coordinates, and Teltonika AVL structures, all verified against datasheets."
author: "Faiq Najib Al-Aziz"
date: 2026-10-14
lastmod: 2026-10-14
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - golang
  - gps
  - protocol
  - binary
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 3
---

In [Part 2](/en/writing/2026/tcp-listener-gps-go/), we built a listener that tidies up incoming TCP streams into complete frames. Now comes the real "archaeology" work: parsing the contents inside those frames. Raw bytes like `0x78 0x78 0x0D 0x01 ...` need to be transformed into meaningful telemetry, something like `IMEI 123456789012345, position -7.2575, 112.7521, heading 180°`.

Before diving in, an honest confession: while writing this article, I was initially convinced that the login packet example from the GT06 datasheet was `... 6C 00 01 8C ...`, and that the CRC implementation was just standard CRC-CCITT. **Both assumptions were flat wrong.** I only realized this when my code rejected the datasheet's own example. The full story is detailed below, and it underscores the most vital lesson in binary protocols: never trust your memory. Trust test vectors.

This article focuses on GT06 (dissected inside and out) and then examines Teltonika (its architecture and contrasting design choices). All code below has been validated against official examples from the Concox GT06 v1.8.1 datasheet and the decoder structure of [Traccar](https://www.traccar.org/)[^traccar], an open-source engine battle-tested in production for years.

## Trap #1: GT06's "CRC-ITU" Isn't the CRC-CCITT You Think It Is

The GT06 datasheet casually states: the CRC field contains a *CRC-ITU value*. The most common reference for CRC-ITU is CRC-16/CCITT using polynomial 0x1021. That is precisely where the trap lies: there are over a dozen CRC variants using that exact polynomial, differing by initial values (*init*), processing direction (*reflected*), and final XOR masks (*xor-out*).

I brute-forced all common 0x1021 variants against the official datasheet sample, a login packet `78 78 0D 01 01 23 45 67 89 01 23 45 00 01 8C DD 0D 0A`, whose CRC is listed as `0x8CDD`:

| Variant (poly 0x1021) | Init   | Reflected | XOR out    | Result          |
| --------------------- | ------ | --------- | ---------- | --------------- |
| CCITT-FALSE           | 0xFFFF | no        | 0x0000     | `0x81F6` ❌     |
| XMODEM                | 0x0000 | no        | 0x0000     | `0x55F9` ❌     |
| X25                   | 0xFFFF | **yes**   | **0xFFFF** | **`0x8CDD` ✅** |

The verdict: **the X25 variant**, processed *reflected* with a final XOR of `0xFFFF`. Plus another surprise: the scope does not start at the protocol number. It spans **from the length byte up through the serial number (inclusive)**, exactly matching the subtle wording in the WD-209 datasheet when read carefully: *"from packet length to information serial number (including)"*.

Here is the implementation in Go:

```go
// crcITU = GT06's "CRC-ITU": CRC-16/X25 variant
// (poly 0x1021, init 0xFFFF, reflected, xor-out 0xFFFF).
// Scope: from packet LENGTH byte to SERIAL byte (inclusive).
func crcITU(data []byte) uint16 {
    crc := uint16(0xFFFF)
    for _, b := range data {
        crc ^= uint16(b)
        for i := 0; i < 8; i++ {
            if crc&1 != 0 {
                crc = (crc >> 1) ^ 0x8408 // reflected version of 0x1021
            } else {
                crc >>= 1
            }
        }
    }
    return crc ^ 0xFFFF
}
```

Here is an interesting production note: Traccar, the most widely deployed open-source GPS tracking server in the world, **does not validate inbound CRCs for GT06 at all**. Why? Because the market is flooded with clones and OEM GT06 variants whose CRC calculations deviate slightly from the spec. For this article, our design decision is to validate CRC strictly (and drop corrupt packets as recommended by the datasheet). Just don't be surprised if cheap third-party devices get rejected down the road: that is the messy reality of budget hardware protocols.

## Frame Parser with CRC Validation

Extending `readFrame` from Part 2, let's unpack an intact frame:

```go
type GT06Frame struct {
    Protocol byte
    Data     []byte   // payload content
    Serial   uint16   // used for ACK matching
}

func parseGT06(frame []byte) (*GT06Frame, error) {
    if len(frame) < 9 || frame[0] != 0x78 || frame[1] != 0x78 {
        return nil, fmt.Errorf("not a GT06 frame")
    }
    length := int(frame[2])
    body := frame[2 : 3+length] // length..crc: CRC calculation scope!

    got := binary.BigEndian.Uint16(body[len(body)-2:])
    want := crcITU(body[:len(body)-2])
    if got != want {
        return nil, fmt.Errorf("CRC mismatch: packet=0x%04X calculated=0x%04X", got, want)
    }

    return &GT06Frame{
        Protocol: body[1],
        Data:     body[2 : len(body)-4],
        Serial:   binary.BigEndian.Uint16(body[len(body)-4 : len(body)-2]),
    }, nil
}
```

The first test that must pass: the datasheet login example must pass validation, and our recalculated CRC must match down to the exact byte: `0x8CDD`.

## Login: BCD IMEI and Mandatory ACK Responses

The login packet (protocol `0x01`) stores the **IMEI in BCD format**: 8 bytes storing 16 decimal digits, even though an IMEI is only 15 digits long. The first digit is simply a leading `0` padding that needs to be stripped:

```go
// IMEI: 8 bytes BCD -> 16 hex digits -> drop first digit -> 15 digits
func decodeIMEI(data []byte) string {
    return fmt.Sprintf("%X", data)[1:]
}
```

Datasheet example: `01 23 45 67 89 01 23 45` -> `"0123456789012345"` -> IMEI `123456789012345`.

Once the IMEI is decoded, replying is mandatory. As noted in Part 1: an unacknowledged device will retransmit incessantly until it gives up or hangs. The login ACK packet format is `78 78 05 <protocol> <serial> <crc> 0D 0A`:

```go
// buildAck: 78 78 05 <protocol> <serial> <crc> 0D 0A
// CRC is computed from length byte (05) up to serial number.
func buildAck(f *GT06Frame) []byte {
    body := []byte{0x05, f.Protocol, byte(f.Serial >> 8), byte(f.Serial)}
    crc := crcITU(body)
    out := []byte{0x78, 0x78}
    out = append(out, body...)
    out = append(out, byte(crc>>8), byte(crc), 0x0D, 0x0A)
    return out
}
```

The test vector: for serial `0001`, the correct response is `78 78 05 01 00 01 D9 DC 0D 0A`, and our implementation above produces precisely that. (Notice that `D9 DC` is produced by CRC X25 over `05 01 00 01`, confirming the length byte is part of the CRC scope.)

## Location: Converting Raw Bytes into Coordinates

The most common position packet uses protocol `0x12`. Here is the GPS payload breakdown:

| Offset | Size | Field          | Notes                                     |
| ------ | ---- | -------------- | ----------------------------------------- |
| +0     | 6    | Datetime       | BCD: YY MM DD HH MM SS                    |
| +6     | 1    | Satellites     | low nibble only                           |
| +7     | 4    | Latitude       | big-endian, unit in **minutes × 30,000**  |
| +11    | 4    | Longitude      | big-endian, unit in minutes × 30,000      |
| +15    | 1    | Speed          | km/h                                      |
| +16    | 2    | Course + flags | see breakdown below                       |

Two traps often trip developers up here:

1. **Coordinates are not decimal degrees.** The raw integer value must be divided by `60 × 30,000 = 1,800,000`. For instance, Surabaya at -7.2575° is stored as `7.2575 × 60 × 30,000 = 13,063,500` -> `00 C7 55 4C`.
2. **Hemisphere signs (south/west) are not stored in the numbers**, all coordinate values are positive integers. Signs reside in the status *flags* bits within the course bytes.

Flag layout (2 bytes): bit 0-9 = heading (0-359°), bit 10 = latitude direction (**1 = north/positive, 0 = south/negative**), bit 11 = longitude direction (**1 = west/negative**), bit 12 = GPS fix valid. (These bit assignments reflect Traccar's production-tested decoder logic; wording in datasheets often varies between revisions. Once again: verify with real hardware.)

```go
func decodeLocation(data []byte, tz *time.Location) Location {
    t := time.Date(
        bcd(data[0])+2000, time.Month(bcd(data[1])), bcd(data[2]),
        bcd(data[3]), bcd(data[4]), bcd(data[5]), 0, tz)

    sat := int(data[6] & 0x0F)
    lat := float64(binary.BigEndian.Uint32(data[7:11])) / 60.0 / 30000.0
    lng := float64(binary.BigEndian.Uint32(data[11:15])) / 60.0 / 30000.0
    speed := int(data[15])

    flags := binary.BigEndian.Uint16(data[16:18])
    course := int(flags & 0x3FF)
    if flags&(1<<10) == 0 { // bit 10: 0 = South
        lat = -lat
    }
    if flags&(1<<11) != 0 { // bit 11: 1 = West
        lng = -lng
    }
    valid := flags&(1<<12) != 0

    return Location{t, sat, lat, lng, speed, course, valid}
}

func bcd(b byte) int { return int(b>>4)*10 + int(b&0x0F) }
```

Testing the decoder without physical hardware: I constructed a synthetic `0x12` packet in unit tests (Surabaya, 12 satellites, 42 km/h, heading 180°, valid fix) and decoded it back. The parsed output returned `-7.2575, 112.7521, heading 180, valid fix`. The full byte stream is `78 78 17 12 26 09 12 14 30 00 0C 00 C7 55 4C 0C 18 D4 34 2A 10 B4 00 01 00 A2 0D 0A`, which you can replay directly over `/dev/tcp` as shown in Part 2.

> Note: following the GPS block, a real `0x12` packet contains cellular base station (LBS) data for positioning fallback when GPS fix is lost, alongside terminal status info. We can parse that later as needed; for building core tracking capabilities, the GPS segment is all we need.

## Teltonika: A Cleaner Engineering Philosophy

Teltonika approaches the exact same problem with architectural choices that feel significantly more refined:

**1. Handshake first, data later.** A new connection begins with an identification packet: 2 bytes of length (`00 0F`) + 15 ASCII digits of IMEI + `\r\n`. The server responds with a single byte: `01` (IMEI accepted) or `00` (rejected):

```go
func decodeIMEITeltonika(b []byte) (string, bool) {
    n := int(binary.BigEndian.Uint16(b[0:2]))
    if n != 15 || len(b) < 2+n {
        return "", false
    }
    imei := string(b[2 : 2+n])
    for _, c := range imei {
        if c < '0' || c > '9' {
            return "", false
        }
    }
    return imei, true // reply: 0x01 = accept, 0x00 = reject
}
```

**2. Batched records instead of one-off transmissions.** A single AVL packet packages multiple telemetry points in one go. Here is the Codec 8 structure:

```text
00 00 00 00        preamble (4 zero bytes)
00 00 00 39        data length (4 bytes: codec ID up to num2)
08                 codec ID (0x08 = codec8)
01                 number of records
... AVL record ... (timestamp 8B, priority 1B, GPS element, IO elements)
01                 number of records (repeated, for validation)
00 00 0X XX        CRC-16 (4 bytes, 16-bit value in lower bytes)
```

**3. Direct degrees × 10,000,000.** No minutes/30,000 acrobatics: longitude and latitude are signed 4-byte big-endian integers. Dividing by 10,000,000 immediately yields standard decimal degrees. A single record's GPS element contains: longitude (4B), latitude (4B), altitude (2B), angle (2B), satellites (1B), and speed (2B).

**4. CRC-16 IBM** (poly 0x8005, init 0, reflected: the CRC-16/ARC variant), calculated from the codec ID through *number of data 2*:

```go
func crc16IBM(data []byte) uint16 {
    crc := uint16(0x0000)
    for _, b := range data {
        crc ^= uint16(b)
        for i := 0; i < 8; i++ {
            if crc&1 != 0 {
                crc = (crc >> 1) ^ 0xA001
            } else {
                crc >>= 1
            }
        }
    }
    return crc
}
```

Their acknowledgement design is also the cleanest among all protocols: the server simply replies with the **count of records received** as a 4-byte integer. If 1 record was received, return `00 00 00 01`. If the count does not match what the device transmitted, it triggers a clean retry, avoiding per-packet sequence serial numbers entirely.

## Test Results

All code in this article passes 13 targeted assertions[^tests]:

| Scenario                                                                | Result |
| ----------------------------------------------------------------------- | ------ |
| GT06 datasheet login packet (`8C DD`) passes CRC validation             | ✓      |
| Recalculated CRC = `8CDD`; serial 1 ACK = `D9 DC`                       | ✓      |
| BCD IMEI -> `123456789012345` (15 digits)                               | ✓      |
| Round-trip location 0x12: coordinates, course, speed, satellites, time  | ✓      |
| Teltonika handshake with `356307042441013`                              | ✓      |
| AVL Codec 8: valid CRC, correct coordinates & speed                     | ✓      |

## What You Should Take Away Before Moving On

- **CRC variants trigger the most insidious bugs in binary protocols.** GT06's "CRC-ITU" turned out to be the X25 variant, with a calculation scope that includes the length byte: two subtle details that will each independently break validation if missed.
- **Never rely on memory: trust test vectors.** Official examples in datasheets serve as ground truth. When your code and the datasheet clash, one of them is wrong; systematically verify which one.
- **BCD and coordinate units differ wildly across manufacturers**: minutes × 30,000 in GT06 versus degrees × 10⁷ in Teltonika. Always write round-trip tests for unit conversions.
- **Traccar skips inbound CRC validation for GT06 and Teltonika**: a pragmatic choice born from quirky firmware clones in the wild. Strict validation is mathematically correct, but keep your error handling configurable (drop vs. log) when weird hardware shows up in production.

By Part 4, our coordinate stream is flowing smoothly. Next comes the persistence bottleneck: storing incoming positions. When a single tracker reports every 10 seconds, 500 active trackers generate 4.3 million points per day. A vanilla PostgreSQL table will buckle under that write volume without optimization; that is where TimescaleDB steps in.

## What's Next

This post is part of the **Building a GPS Tracking Backend from Scratch** series.

- Previous: [Part 2 - Building a High-Throughput GPS TCP Listener in Go](/en/writing/2026/tcp-listener-gps-go/)
- Next: [Part 4 - Storing High-Throughput GPS Data with PostgreSQL and TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/)

## CTA

Share this post if you found it useful. For questions or discussions, head over to [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).

[^traccar]: Traccar's decoder source code for [GT06](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/protocol/Gt06ProtocolDecoder.java) and [Teltonika](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/protocol/TeltonikaProtocolDecoder.java) is a gold standard for production-tested behavior. I used it to cross-verify field layouts and unit scaling factors.

[^tests]: The Concox GT06 v1.8.1 datasheet example (login and ACK) was used as an external test vector. Location packets and AVL records were validated via round-trip encoding and decoding with manually confirmed coordinates for Surabaya.
