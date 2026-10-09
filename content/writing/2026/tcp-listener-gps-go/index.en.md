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

Picture 500 GPS trackers connected to your server simultaneously, each streaming location data every 10–30 seconds, while others only emit a quiet heartbeat when parked. These connections stay alive for hours, occasionally drop without saying goodbye, and sometimes deliver fragmented data in bursts.

If you come from the world of HTTP APIs, where one neat request yields one neat response, stepping into TCP feels like moving from delivering individual courier parcels to running a bustling sorting office where the mail never stops flowing.

In [Part 1](/en/writing/2026/memahami-gps-protocol/) we unpacked how these devices communicate: persistent TCP connections exchanging binary packets governed by proprietary vendor protocols. Now, we are going to build the front door: a TCP listener in Go capable of hosting hundreds of concurrent device connections.

The pattern I use in this article is identical to what powers hundreds of live devices in my production systems: zero third-party frameworks, just Go's standard library.

## What We Are Building Today

Our end goal is a lean, robust program that:

1. Accepts multiple connections concurrently, assigning one goroutine per connection.
2. Reassembles raw TCP streams into valid **GT06 frames** (this is where most developers trip up).
3. Drops zombie connections that went silent without properly closing.
4. Shuts down cleanly during deploys through graceful shutdown.

What we are intentionally **not** tackling yet: decoding packet payloads (login packets, GPS coordinates, and computing CRC-ITU checksums for valid ACK responses belong to [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/)), database persistence, and message queuing. In fact, a well-architected listener should know nothing about those downstream concerns.

## A Basic TCP Server

Let's begin with the simplest possible baseline:

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

`net.Listen` binds the listening port, and we enter an `Accept` loop where every incoming connection gets handed off to its own goroutine. This highlights Go's distinct advantage for networking: **goroutines are remarkably cheap** (starting with just a few kilobytes of stack space, unlike heavyweight OS threads that consume megabytes). As a result, the "one goroutine per connection" model easily scales across 500, 5,000, or even 50,000 concurrent sockets without breaking a sweat.

For a GPS listener, I strongly advise against HTTP. The per-request header overhead, ephemeral handshakes, and HTTP parsing offer zero value for raw binary streams. Your tracker hardware won't be sending a `Content-Type` header anyway.

## The First Pitfall: TCP Is a Stream, Not a Message Bus

This is the single most crucial concept in this article, and the core difference between handling GPS TCP traffic and serving HTTP requests.

HTTP developers take an implicit guarantee for granted: one request equals one self-contained packet. In TCP, **there is no such guarantee**. A call to `conn.Read(buf)` merely asks the OS kernel: "give me whatever bytes are currently in the buffer." That means:

- **A frame can arrive fragmented.** A device transmits a 70-byte frame, but your first `Read` only pulls 40 bytes; the remaining 30 bytes arrive 200 ms later.
- **Multiple frames can merge into one chunk.** If a device sends two packets back-to-back, a single `Read` may grab both simultaneously.
- **Garbage bytes happen.** Freshly booted trackers frequently spew random garbage bytes right before transmitting their first valid packet.

If you treat every individual `Read` return value as a complete message, packet decoding will fail intermittently and unpredictably. You will end up blaming hardware glitches for what is actually a socket handling bug. (Ask me how I know.)

The remedy is **explicit framing**. We wrap the socket with `bufio.Reader`, synchronize on the GT06 start bits (`0x78 0x78`), read the length indicator, and pull the exact remaining payload size:

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

The secret weapon here is `io.ReadFull`: it **blocks until the destination buffer is completely populated**, seamlessly stitching fragmented packets back together. Meanwhile, `bufio.Reader` buffers unused bytes internally, ensuring coalesced frames are never dropped or skipped.

Remember the framing rule from Part 1: the `len` byte covers everything starting from the protocol number up to the CRC, inclusive. That is why after capturing `lenByte`, we must read exactly `len + 2` additional bytes (payload + CRC + 2 stop bytes).

## handleConnection: The Frame Processing Loop

With reliable framing in place, our per-connection worker loop becomes remarkably clean:

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

For now, logging the hex representation is plenty. In Part 3, we will replace that `TODO` comment with our real decoder pipeline.

## Zombie Sockets and Read Deadlines

Notice the `conn.SetReadDeadline(...)` call above; it is not just boilerplate.

GPS trackers running over cellular networks regularly drop offline without performing an orderly TCP handshake (no `FIN` packet): cell towers drop, batteries die, or mobile carriers reset connections silently. Back on the server, you end up with sockets that **appear active but are completely dead** (zombie connections). Leave these unchecked, and zombies will quietly exhaust your operating system's file descriptors.

`SetReadDeadline` fixes this: if no bytes arrive before the deadline expires, the ongoing read operation aborts with an I/O timeout error. The handler loop exits and frees the connection cleanly.

There is one critical caveat: **your read deadline must comfortably exceed the device's idle heartbeat interval**. Recall from Part 1 that stationary devices transmit heartbeats only every 2 to 5 minutes. If you configure a tight 90-second timeout, you will prematurely kill healthy devices that are simply parked outside. Here is what I configure in practice:

```go
// Must exceed device heartbeat interval (GT06 devices send heartbeats every 2-5 minutes when idle)
var readTimeout = 10 * time.Minute
```

Because we refresh the deadline after every successful frame, active devices remain connected without interruption.

## Exiting Gracefully: Graceful Shutdown

Production listeners need frequent restarts during rolling deployments, scaling operations, and routine maintenance. When a container shuts down, it is rarely an instant power kill; the host OS issues an interrupt signal (typically `SIGTERM`), granting your process a brief grace window to wrap up.

We can take advantage of that window: close the listener socket to reject new incoming handshakes, terminate existing active sockets cleanly, wait for all handler goroutines to finish, and exit cleanly.

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

Here is the supporting `connTracker`, a thread-safe registry tracking open connections so we can close them all at once:

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

The execution flow works as follows: `signal.NotifyContext` maps incoming `SIGTERM` or Ctrl+C signals to `ctx.Done()`. Our background cleanup goroutine reacts by closing the network listener (forcing `Accept` to return an error and breaking the accept loop) and closing all registered connections. Finally, `sync.WaitGroup` guarantees all connection handlers exit before `main` terminates.

## Testing Without Real Hardware

You do not need physical GPS trackers on your desk to verify this implementation. Bash comes equipped with built-in `/dev/tcp` support, which is more than enough to impersonate a GT06 tracker:

```bash
exec 3<>/dev/tcp/127.0.0.1/5094
printf '\x78\x78\x0d\x01\x01\x23\x45\x67\x89\x01\x23\x45\x00\x01\x8c\xdd\x0d\x0a' >&3
```

This hex string is the standard GT06 login frame straight out of the protocol datasheet (terminal ID `123456789012345`) that we dissected in [Part 1](/en/writing/2026/memahami-gps-protocol/). I tested the listener above against several real-world scenarios on my local loopback interface:

| Scenario | Result |
| --- | --- |
| Complete single frame | Extracted 1 frame, 18 bytes ✓ |
| Frame split across two writes (second chunk sent 1 second later) | Successfully reassembled into a single frame ✓ |
| Two frames combined into a single write | Correctly parsed as two separate frames ✓ |
| Leading garbage bytes (`FF DE AD`) preceding valid frame | Discarded garbage bytes, frame read cleanly ✓ |
| 20 concurrent connections transmitting simultaneously | 20 frames parsed without race conditions ✓ |
| `SIGTERM` issued while connections are active | Listener and sockets closed, clean exit ✓ |

Here is the log output covering the server's full lifecycle:

```text
2026/09/12 20:25:31 listening on :5094
2026/09/12 20:25:32 connected: 127.0.0.1:45870
2026/09/12 20:25:32 frame from 127.0.0.1:45870: 78780D01012345678901234500018CDD0D0A (18 bytes)
2026/09/12 20:25:33 shutting down: closing listener and active connections
2026/09/12 20:25:33 bye
```

## Key Takeaways Before Moving On

- **One goroutine per connection** is the idiomatic pattern for Go TCP servers: lightweight, idiomatic, and capable of holding hundreds of thousands of concurrent sockets.
- **TCP is a stream.** One `Read` call does not equal one discrete packet. Custom framing (start bits + length headers + `io.ReadFull`) is the only reliable way to read binary network protocols.
- **Set deadlines higher than heartbeat frequencies.** `SetReadDeadline` cleans up dead sockets, but an overly aggressive timeout will sever connections from healthy, idle hardware.
- **Shut down cleanly.** `SIGTERM` handlers give you the opportunity to drain sockets and release file descriptors gracefully, especially in modern containerized deployments.

At this stage, our listener reliably captures and delimits frames, but it cannot interpret their payload yet. Equally important: **it does not yet respond with ACK packets**, meaning actual trackers will assume our server is dead and continuously retransmit old packets. Both tasks require computing CRC-ITU checksums and parsing GT06 payloads.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 1: Understanding GPS Protocols](/en/writing/2026/memahami-gps-protocol/)
- Next: [Part 3: Decoding Packets: GT06 and Teltonika Protocols](/en/writing/2026/decode-packet-gt06-teltonika/): we will write our full packet decoder to parse login packets and coordinates, calculate CRCs, and transmit valid ACKs.

## Connect

Share this post if you found it useful. To discuss further, feel free to reach out via [Contact](/contact/) or subscribe via [RSS](/writing/index.xml).
