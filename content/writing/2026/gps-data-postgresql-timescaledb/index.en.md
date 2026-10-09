---
title: "Storing GPS Data with PostgreSQL and TimescaleDB"
description: "Storing millions of GPS points without bringing PostgreSQL to its knees: hypertable setup, continuous aggregates for reporting, compression policies for historical data, all tested with 155k rows."
author: "Faiq Najib Al-Aziz"
date: 2026-10-28
lastmod: 2026-10-28
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - postgresql
  - timescaledb
  - gps
  - database
pillar: "postgresql"
series: "gps-backend-series"
series_part: 4
---

Let's do some quick math first. A single vehicle reports its position every 10 seconds. One thousand vehicles means 8.6 million rows per day, 260 million per month, and roughly 3 billion a year. On top of that, customer dashboards demand two completely conflicting things: lightning-fast inserts for continuous streams of data, and reporting queries that sweep through weeks of telemetry in an instant.

A standard PostgreSQL table can handle ingesting that volume (with the right indexes, inserts remain fast), but aggregate queries like "maximum speed per hour over the last 30 days" will scan hundreds of millions of rows every single time they are run. B-tree indexes are useless for time-range aggregates: what you need isn't looking up a single row, but summarizing millions of them.

In [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/), coordinates were flowing smoothly out of our decoders. This article is about their permanent home: PostgreSQL + [TimescaleDB](https://www.timescale.com/)[^ts]. All examples below were run on a `timescale/timescaledb:latest-pg16` container (TimescaleDB 2.30) populated with 155,000 synthetic rows.

## Why TimescaleDB, Not Just Regular Tables?

TimescaleDB is a PostgreSQL extension, not a separate database. That means everything in your existing stack (pgx, DBeaver, `pg_dump` backups, database user permissions) keeps working without changes. What it adds are three superpowers purpose-built for time-series data:

1. **Hypertables**: tables that are automatically partitioned into time-range chunks under the hood. You write queries just like normal SQL; TimescaleDB figures out which chunks to touch.
2. **Continuous aggregates**: materialized summaries computed incrementally in the background, rather than recalculated from scratch on every query.
3. **Compression policies**: older data gets compressed automatically into a columnar format, shrinking storage footprints drastically while remaining fully queryable.

Common alternatives often brought up: Cassandra (heavy operational overhead, lacks full SQL), InfluxDB (proprietary query language, poor relational joins), or ClickHouse (blazing fast for analytics, but not PostgreSQL, forcing you to maintain two separate systems). For GPS tracking that requires operational queries (latest vehicle position, trip breadcrumbs) **and** lightweight analytics in one engine, TimescaleDB hits the sweet spot. In production, this hypertable setup handles millions of points a day while slashing reporting runtimes from minutes to sub-second responses.

## Setup: Device Table and Positions Hypertable

GPS data falls into two distinct categories: *registry data* that changes infrequently (devices, vehicles, tenants) and *time-series data* that grows relentlessly (coordinates). Keep them separated, never lump them into a single monolithic table.

```sql
CREATE TABLE devices (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imei      TEXT UNIQUE NOT NULL,
    name      TEXT NOT NULL,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE positions (
    time      TIMESTAMPTZ  NOT NULL,
    device_id BIGINT       NOT NULL REFERENCES devices(id),
    lat       DOUBLE PRECISION NOT NULL,
    lon       DOUBLE PRECISION NOT NULL,
    speed_kmh SMALLINT     NOT NULL DEFAULT 0,
    course    SMALLINT     NOT NULL DEFAULT 0,
    attrs     JSONB
);
```

Then comes the single line that changes everything:

```sql
SELECT create_hypertable('positions', 'time',
    chunk_time_interval => INTERVAL '1 day');
```

From this point on, `positions` is a hypertable: incoming data for each day lands in a dedicated chunk partition. Creating indexes follows standard PostgreSQL syntax. Keep in mind that the most common access pattern in GPS tracking is "device X over time range Y", so:

```sql
CREATE INDEX idx_positions_device_time ON positions (device_id, time DESC);
```

> A hard-earned production tip: never let your application run unbound `SELECT *` queries against this table. Always bound your time ranges. The `(device_id, time DESC)` index makes querying "device 1 positions today" dirt cheap, but without a time limit, you force PostgreSQL to scan the device's entire historical timeline.

## Inserting from Go with pgx

On the application side, the pattern I use in production is simple: the protocol listener (Part 2) never talks directly to the database. It pushes parsed coordinates into a message queue, and dedicated consumer workers handle persistence. For inserting batches, `pgx` with batching is more than fast enough:

```go
func insertPositions(ctx context.Context, pool *pgxpool.Pool, pts []Position) error {
    b := &pgx.Batch{}
    for _, p := range pts {
        b.Queue(`INSERT INTO positions (time, device_id, lat, lon, speed_kmh, course)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
            p.Time, p.DeviceID, p.Lat, p.Lon, p.SpeedKmh, p.Course)
    }
    return pool.SendBatch(ctx, b).Close()
}
```

One major headache you never have to deal with: writing mass `UPDATE` or `DELETE` jobs to prune stale data. That belongs in database lifecycle policies, not application code.

## Daily Queries: Latest Position per Device

The single most frequent query requested by frontend dashboards is the latest coordinates for each vehicle. The idiomatic way in PostgreSQL is using `DISTINCT ON`:

```sql
SELECT DISTINCT ON (device_id) device_id, d.name, time, lat, lon, speed_kmh
FROM positions p
JOIN devices d ON d.id = p.device_id
ORDER BY device_id, time DESC;
```

```text
 device_id |    name    |             time              |  lat  |  lon  | speed_kmh
-----------+------------+-------------------------------+-------+-------+-----------
         1 | B 1234 XYZ | 2026-09-12 14:33:09+00        | -7.25 | 112.76|        68
         2 | B 5678 ABC | 2026-09-12 14:33:19+00        | -7.25 | 112.74|        55
         3 | L 9012 KLW | 2026-09-12 14:33:19+00        | -7.25 | 112.74|        32
(3 rows)
```

Thanks to our `(device_id, time DESC)` composite index, this query stays blisteringly fast no matter how large the table grows, because each device only inspects its most recent record.

## Continuous Aggregates: Precomputed Reporting

Now onto the second challenge: "calculate maximum and average speed per hour, per vehicle, over the last 7 days". Without optimization, PostgreSQL will scan every single raw point each time someone reloads the dashboard. Continuous aggregates calculate this in the background:

```sql
CREATE MATERIALIZED VIEW positions_hourly
WITH (timescaledb.continuous) AS
SELECT device_id,
       time_bucket('1 hour', time) AS bucket,
       count(*)                AS points,
       max(speed_kmh)          AS max_speed,
       avg(speed_kmh)::smallint AS avg_speed
FROM positions
GROUP BY device_id, bucket
WITH NO DATA;

SELECT add_continuous_aggregate_policy('positions_hourly',
    start_offset      => INTERVAL '3 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Historical data outside the policy window: perform a one-off manual refresh
CALL refresh_continuous_aggregate('positions_hourly',
    now() - INTERVAL '7 days', now());
```

This is not a traditional PostgreSQL materialized view that requires an expensive full refresh. Continuous aggregates are incremental: only new and modified chunks get processed. Querying them is transparent, behaving just like any standard table or view.

Real benchmark numbers from my test dataset (155,000 rows, 3 devices, 7 days, local container):

| 7-Day Summary Query                            | Execution Time |
| ---------------------------------------------- | -------------- |
| Direct `GROUP BY time_bucket` on `positions`   | **158 ms**     |
| Query against `positions_hourly`               | **0.5 ms**     |

That is over 300x faster, and the performance gap widens as raw data accumulates, since the continuous aggregate table grows much slower than the raw data table.

## Compression: Shrinking Historical Data Automatically

The guiding rule can be summarized in one sentence: data older than 3 days is rarely accessed row-by-row on real-time dashboards, so there is no reason to store it uncompressed.

```sql
-- Define compression layout: segment by device, order by time
ALTER TABLE positions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby   = 'time'
);

SELECT add_compression_policy('positions', INTERVAL '3 days');
```

From that point forward, a background worker compresses chunks older than 3 days automatically with zero downtime. To verify the effect without waiting for the scheduled job, I manually compressed a chunk:

```sql
SELECT compress_chunk(c)
FROM show_chunks('positions', older_than => INTERVAL '3 days') c
LIMIT 1;
```

The result on a chunk holding one day of data (2,856 kB before compression): **it plummeted to 24 kB**. Granted, this was synthetic data, which compresses exceptionally well. On real-world GPS feeds with noisy sensor readings, expect realistic compression ratios around 10x to 20x. Still, on 260 million rows per month, saving 90%+ in disk space translates to hundreds of gigabytes preserved.

Best of all: **compressed chunks remain completely queryable** via standard SQL. TimescaleDB decompresses records transparently on the fly whenever needed.

> The natural partner to compression is a **retention policy** (`add_retention_policy`) to automatically drop chunks older than N months, depending on legal or business compliance rules. While I didn't attach one in this demo, you should define your retention timeline from day one in production.

## Key Takeaways Before Moving Forward

- **Keep registry and time-series data apart.** `devices` is a standard relational table; `positions` is a hypertable. Don't mix them together.
- **Always bound queries by time.** The `(device_id, time DESC)` index only helps when your query specifies which time range it cares about.
- **Use continuous aggregates for all reporting metrics.** Precompute summaries in the background instead of calculating them on demand every time a user opens a dashboard. In production, this pattern turns multi-minute queries into sub-second responses.
- **Implement compression and retention from day one.** Neither can be retrofitted effortlessly down the road. Deciding how long raw data lives is a business requirement, don't let it become an operational emergency.

Now coordinates are stored cleanly and queryable at high speed. But fleet tracking is more than logging dots on a map. Customers inevitably ask: "Did my vehicle leave the delivery zone?" In [Part 5](/en/writing/2026/geofencing-postgis/), we will explore geofencing with PostGIS: polygons, `ST_Contains`, and real-time zone entry/exit detection.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 3 - Decode Packet: GT06 & Teltonika Protocol](/en/writing/2026/decode-packet-gt06-teltonika/)
- Next: [Part 5 - Geofencing with PostGIS](/en/writing/2026/geofencing-postgis/)

## CTA

Share this article if you found it useful. To discuss further, feel free to reach out via [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).

[^ts]: All SQL examples in this post were verified on TimescaleDB 2.30.0 (PostgreSQL 16, Docker image `timescale/timescaledb:latest-pg16`) with 155,523 synthetic rows. You can reproduce the full setup using `docker run` combined with the SQL commands above.
