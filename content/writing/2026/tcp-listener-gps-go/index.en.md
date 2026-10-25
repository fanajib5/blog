---
title: "Building a TCP Listener for GPS Devices in Go"
description: "How to build a concurrent TCP server in Go to handle hundreds of GPS trackers: from net.Listen and binary packet framing on raw TCP streams to read deadlines and graceful shutdown."
author: "Faiq Najib Al-Aziz"
date: 2026-09-22
lastmod: 2026-09-22
draft: false
toc: true
comments: true
images:
  - og.png
tags:
  - golang
  - gps
  - tcp
  - networking
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 2
---

Imagine 500 GPS trackers connected to your server at once. Each sends location data every 10–30 seconds, while some send only a heartbeat when idle. Connections can stay open for hours, drop without notice, or deliver data in fragments.

If you are used to HTTP APIs, moving to TCP feels different. Connections can stay open for hours, and data does not always arrive in one complete piece.

In [Part 1](/en/writing/2026/memahami-gps-protocol/) we covered how devices communicate through persistent TCP connections and binary packets governed by vendor-specific rules. Here, we will build a TCP listener in Go to accept those connections.

The pattern here is the same one handling hundreds of devices in my production systems. It uses only Go's standard library, with no third-party frameworks.

## What We Are Building Today

The goal is a small program that:

1. Accepts multiple connections concurrently, assigning one goroutine per connection.
2. Reassembles raw TCP streams into valid **GT06 frames** (this is where most developers trip up).
3. Drops zombie connections that went silent without properly closing.
4. Shuts down cleanly during deploys through graceful shutdown.

We will not decode packet payloads, store data in a database, or add a message queue yet. Login and location packets, along with valid ACK responses, require CRC-ITU checksums; that is covered in [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/). The listener's job is to accept and assemble frames, not handle those downstream steps.

## A Basic TCP Server

Start with a basic server:

```go
listener, err := net.Listen("tcp", ":5094")
if err != nil {
    log.Fatal(err)
}
defer listener.Close()

for {
    conn, err := listener.Accept()
    if err != nil {
        log.Printf("accept error: %v", err)
        continue
    }
    go handleConnection(conn)
}
```

`net.Listen` opens the port, and the `Accept` loop waits for connections. Each one runs in its own goroutine. **Goroutines are cheap**: their initial stack takes a few kilobytes, compared with the megabytes used by OS threads. That makes the "one goroutine per connection" model lightweight for 500, 5,000, or even 50,000 connections.

For a GPS listener, I do not recommend HTTP: per-request header overhead, ephemeral handshakes, and HTTP parsing add no value for raw binary streams. Your tracker will not send a `Content-Type` header either.

## The First Pitfall: TCP Is a Stream, Not a Message Bus

This is the main difference between handling GPS TCP traffic and serving HTTP requests.

HTTP developers take an implicit guarantee for granted: one request equals one self-contained packet. In TCP, **there is no such guarantee**. A call to `conn.Read(buf)` merely asks the OS kernel: "give me whatever bytes are currently in the buffer." That means:

- **A frame can arrive fragmented.** A device transmits a 70-byte frame, but your first `Read` only pulls 40 bytes; the remaining 30 bytes arrive 200 ms later.
- **Multiple frames can merge into one chunk.** If a device sends two packets back-to-back, a single `Read` may grab both simultaneously.
- **Garbage bytes happen.** Freshly booted trackers frequently spew random garbage bytes right before transmitting their first valid packet.

If you treat each `Read` result as a complete message, packet decoding can fail unpredictably. It is easy to mistake a socket handling bug for a hardware problem. (Ask me how I know.)

The solution is **explicit framing**. We use `bufio.Reader` to read the stream, find the GT06 start bits (`0x78 0x78`), read the length indicator, and then pull the rest of the frame:

```go
// readFrame extracts a single GT06 frame from the stream:
//
//	78 78 | len | protocol | data | serial | crc | 0D 0A
func readFrame(r *bufio.Reader) ([]byte, error) {
	// 1. Synchronize: discard bytes until we locate start bits 78 78
	for {
		b, err := r.ReadByte()
		if err != nil {
			return nil, err
		}
		if b != 0x78 {
			continue // Garbage byte: skip it
		}
		b2, err := r.ReadByte()
		if err != nil {
			return nil, err
		}
		if b2 != 0x78 {
			continue // Isolated 0x78, not a start delimiter: keep scanning
		}
		break
	}

	frame := []byte{0x78, 0x78}

	// 2. Read length (1 byte: count of bytes from protocol through CRC, inclusive)
	lenByte, err := r.ReadByte()
	if err != nil {
		return nil, err
	}
	frame = append(frame, lenByte)

	// 3. Pull the remaining frame: len + 2 bytes (payload + CRC + stop bits 0D 0A)
	rest := make([]byte, int(lenByte)+2)
	if _, err := io.ReadFull(r, rest); err != nil {
		return nil, err
	}
	frame = append(frame, rest...)

	// 4. Validate stop bits
	if frame[len(frame)-2] != 0x0D || frame[len(frame)-1] != 0x0A {
		return nil, fmt.Errorf("invalid stop bits: %X", frame[len(frame)-2:])
	}
	return frame, nil
}
```

`io.ReadFull` **waits until the destination buffer is full**, assembling bytes that arrive in fragments into one frame. `bufio.Reader` keeps unused bytes buffered, so when two frames arrive together, the next frame remains available for the following read.

Remember the framing rule from Part 1: the `len` byte covers everything starting from the protocol number up to the CRC, inclusive. That is why after capturing `lenByte`, we must read exactly `len + 2` additional bytes (payload + CRC + 2 stop bytes).

## handleConnection: The Frame Processing Loop

With framing in place, the handler reads frames from each connection:

```go
func handleConnection(ctx context.Context, conn net.Conn) {
	defer conn.Close()
	remote := conn.RemoteAddr().String()
	log.Printf("connected: %s", remote)

	reader := bufio.NewReader(conn)
	for {
		conn.SetReadDeadline(time.Now().Add(readTimeout))

		frame, err := readFrame(reader)
		if err != nil {
			if errors.Is(err, io.EOF) {
				log.Printf("disconnected: %s", remote)
			} else if ctx.Err() == nil {
				log.Printf("read error (%s): %v", remote, err)
			}
			return
		}
		log.Printf("frame from %s: %X (%d bytes)", remote, frame, len(frame))
		// TODO part 3: decode payload + send valid ACK response (requires CRC-ITU)
	}
}
```

For now, the handler only logs each frame in hex. In Part 3, we will replace the `TODO` with a decoder.

## Zombie Sockets and Read Deadlines

The `conn.SetReadDeadline(...)` call controls how long the handler waits for data.

GPS trackers on cellular networks can disconnect without sending a TCP closing packet (`FIN`), for example when a signal drops, a battery dies, or a mobile carrier resets the connection. The server may then keep sockets that **appear active but are completely dead**. Without cleanup, these connections accumulate and consume file descriptors.

With `SetReadDeadline`, if no bytes arrive before the deadline, Read returns an I/O timeout error. The handler exits and closes the connection.

**Your read deadline must exceed the device's idle heartbeat interval.** As discussed in Part 1, stationary devices send a heartbeat every 2 to 5 minutes. A 90-second deadline would disconnect a healthy idle device. That is why I set it to:

```go
// Must exceed device heartbeat interval (GT06 devices send heartbeats every 2-5 minutes when idle)
var readTimeout = 10 * time.Minute
```

The deadline resets after every frame, so active devices remain connected.

## Exiting Gracefully: Graceful Shutdown

Production listeners may restart during deploys, scaling, or maintenance. When a container or system stops, the OS usually sends a `SIGTERM` signal and gives the process time to shut down before forcing it to exit.

Use that time to close the listener, close active connections, and wait for the handler goroutines to finish before exiting.

```go
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	listener, err := net.Listen("tcp", ":5094")
	if err != nil {
		log.Fatal(err)
	}

	var wg sync.WaitGroup
	conns := newConnTracker()

	// Shutdown supervisor: close listener and terminate active sockets upon receiving a signal
	go func() {
		<-ctx.Done()
		log.Println("shutting down: closing listener and active connections")
		listener.Close()
		conns.CloseAll()
	}()

	log.Println("listening on :5094")
	for {
		conn, err := listener.Accept()
		if err != nil {
			if ctx.Err() != nil {
				break // Shutdown initiated: break out of accept loop
			}
			log.Printf("accept error: %v", err)
			continue
		}
		wg.Add(1)
		conns.Add(conn)
		go func() {
			defer wg.Done()
			defer conns.Remove(conn)
			handleConnection(ctx, conn)
		}()
	}

	wg.Wait()
	log.Println("bye")
}
```

`connTracker` stores active connections so they can all be closed at once:

```go
type connTracker struct {
	mu    sync.Mutex
	conns map[net.Conn]struct{}
}

func newConnTracker() *connTracker {
	return &connTracker{conns: make(map[net.Conn]struct{})}
}

func (t *connTracker) Add(c net.Conn) {
	t.mu.Lock()
	t.conns[c] = struct{}{}
	t.mu.Unlock()
}

func (t *connTracker) Remove(c net.Conn) {
	t.mu.Lock()
	delete(t.conns, c)
	t.mu.Unlock()
}

func (t *connTracker) CloseAll() {
	t.mu.Lock()
	defer t.mu.Unlock()
	for c := range t.conns {
		c.Close()
	}
}
```

`signal.NotifyContext` turns `SIGTERM` or Ctrl+C into `ctx.Done()`. The cleanup goroutine closes the listener, causing `Accept` to return an error and end the main loop, then closes active connections. `sync.WaitGroup` waits for all handlers to finish before `main` exits.

## Testing Without Real Hardware

You can try this without a physical tracker. Bash's `/dev/tcp` support is enough to send data as if it came from a GT06 tracker:

```bash
exec 3<>/dev/tcp/127.0.0.1/5094
printf '\x78\x78\x0d\x01\x01\x23\x45\x67\x89\x01\x23\x45\x00\x01\x8c\xdd\x0d\x0a' >&3
```

This is a GT06 login frame from the protocol datasheet, with terminal ID `123456789012345`, discussed in [Part 1](/en/writing/2026/memahami-gps-protocol/). I tested the program over loopback on my laptop with these scenarios:

| Scenario | Result |
| --- | --- |
| Complete single frame | Extracted 1 frame, 18 bytes ✓ |
| Frame split across two writes (second chunk sent 1 second later) | Successfully reassembled into a single frame ✓ |
| Two frames combined into a single write | Correctly parsed as two separate frames ✓ |
| Leading garbage bytes (`FF DE AD`) preceding valid frame | Discarded garbage bytes, frame read cleanly ✓ |
| 20 concurrent connections transmitting simultaneously | 20 frames parsed without race conditions ✓ |
| `SIGTERM` issued while connections are active | Listener and sockets closed, clean exit ✓ |

This is the log output from startup through shutdown:

```text
2026/09/12 20:25:31 listening on :5094
2026/09/12 20:25:32 connected: 127.0.0.1:45870
2026/09/12 20:25:32 frame from 127.0.0.1:45870: 78780D01012345678901234500018CDD0D0A (18 bytes)
2026/09/12 20:25:33 shutting down: closing listener and active connections
2026/09/12 20:25:33 bye
```

## Key Takeaways Before Moving On

- **One goroutine per connection** is a standard pattern for Go TCP servers. Goroutines are lightweight and can hold hundreds of thousands of concurrent sockets.
- **TCP is a stream.** One `Read` call does not equal one discrete packet. Custom framing (start bits + length headers + `io.ReadFull`) is the only reliable way to read binary network protocols.
- **Set deadlines higher than heartbeat intervals.** `SetReadDeadline` cleans up dead sockets, but a short timeout will disconnect healthy, idle devices.
- **Close connections during shutdown.** `SIGTERM` gives the process a chance to close the listener and active sockets cleanly.

The listener now captures and separates frames, but does not parse their payloads or respond with ACK packets. Without an ACK, real trackers may assume the server is not responding and continuously retransmit old packets. Both tasks require CRC-ITU checksums and an understanding of GT06 payloads.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 1: Understanding GPS Protocols](/en/writing/2026/memahami-gps-protocol/)
- Next: [Part 3: Decoding Packets: GT06 and Teltonika Protocols](/en/writing/2026/decode-packet-gt06-teltonika/): we will write our full packet decoder to parse login packets and coordinates, calculate CRCs, and transmit valid ACKs.

## Connect

If you have questions about this GPS listener, reach out via [Contact](/contact/). You can also subscribe via [RSS](/writing/index.xml) to follow the next article.
