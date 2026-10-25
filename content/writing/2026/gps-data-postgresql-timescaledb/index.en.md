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

Each vehicle reports its position every 10 seconds. With one thousand vehicles, that adds up to 8.6 million rows per day, 260 million per month, and roughly 3 billion a year. Customer dashboards also need two things at once: fast inserts for a continuous stream of data, and reporting queries that can summarize weeks of telemetry quickly.

A standard PostgreSQL table can ingest that volume with the right indexes. But an aggregate query like "maximum speed per hour over the last 30 days" will scan hundreds of millions of rows every time it runs. B-tree indexes don't help much with time-range aggregates. These queries need to summarize millions of rows, not look up a single one.

In [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/), the coordinates came out of the decoder. Here, I store and query them with PostgreSQL + [TimescaleDB](https://www.timescale.com/)[^ts]. I ran all the examples in a `timescale/timescaledb:latest-pg16` container (TimescaleDB 2.30) populated with 155,000 synthetic rows.

## Why TimescaleDB, Not Just Regular Tables?

TimescaleDB is a PostgreSQL extension, not a separate database. Your existing tools and setup (pgx, DBeaver, `pg_dump` backups, database user permissions) keep working. For time-series data, it adds three features:

1. **Hypertables**: tables that are automatically partitioned into time-range chunks under the hood. You write queries just like normal SQL; TimescaleDB figures out which chunks to touch.
2. **Continuous aggregates**: materialized summaries computed incrementally in the background, rather than recalculated from scratch on every query.
3. **Compression policies**: older data gets compressed automatically into a columnar format, shrinking storage footprints drastically while remaining fully queryable.

Common alternatives include Cassandra (heavy operational overhead, lacks full SQL), InfluxDB (proprietary query language, poor relational joins), and ClickHouse (fast for analytics, but not PostgreSQL, so it requires two systems). For GPS tracking that needs operational queries (latest vehicle position, trip breadcrumbs) **and** lightweight analytics in one engine, TimescaleDB is a good fit. In production, this hypertable setup handles millions of points a day and cuts reporting runtimes from minutes to sub-second responses.

## Setup: Device Table and Positions Hypertable

GPS data falls into two categories: *registry data* that changes infrequently (devices, vehicles, tenants) and *time-series data* that keeps growing (coordinates). Store them in separate tables.

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

Use this command to turn `positions` into a hypertable:

```sql
SELECT create_hypertable('positions', 'time',
    chunk_time_interval => INTERVAL '1 day');
```

After that, `positions` is a hypertable, and each day's data goes into a separate chunk. You create indexes with the same syntax as in regular PostgreSQL. Since a common GPS access pattern is "device X over time range Y", add this index:

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

You don't need to write bulk `UPDATE` or `DELETE` jobs to prune stale data. Database lifecycle policies handle that, not application code.

## Daily Queries: Latest Position per Device

Dashboards most often ask for the latest coordinates for each vehicle. In PostgreSQL, `DISTINCT ON` is a concise way to get them:

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

With the `(device_id, time DESC)` index, this query stays fast as the table grows because it only needs each device's most recent record.

## Continuous Aggregates: Precomputed Reporting

The next requirement is "calculate maximum and average speed per hour, per vehicle, over the last 7 days". Without a continuous aggregate, PostgreSQL has to scan every raw point whenever someone reloads the dashboard. A continuous aggregate computes the summary in the background:

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

Unlike a traditional PostgreSQL materialized view, which needs a full refresh, a continuous aggregate is incremental. It processes only new and modified chunks. You query it just like a regular table or view.

Real benchmark numbers from my test dataset (155,000 rows, 3 devices, 7 days, local container):

| 7-Day Summary Query                            | Execution Time |
| ---------------------------------------------- | -------------- |
| Direct `GROUP BY time_bucket` on `positions`   | **158 ms**     |
| Query against `positions_hourly`               | **0.5 ms**     |

The query against the aggregate is over 300x faster on this dataset. The gap grows as raw data accumulates because the continuous aggregate table grows much slower than the raw data table.

## Compression: Shrinking Historical Data Automatically

In this example, data older than 3 days is rarely accessed row-by-row on real-time dashboards. It can therefore be stored in compressed form.

```sql
-- Define compression layout: segment by device, order by time
ALTER TABLE positions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby   = 'time'
);

SELECT add_compression_policy('positions', INTERVAL '3 days');
```

A background worker compresses chunks older than 3 days automatically, with zero downtime. I also compressed a chunk manually to see the result without waiting for the scheduled job:

```sql
SELECT compress_chunk(c)
FROM show_chunks('positions', older_than => INTERVAL '3 days') c
LIMIT 1;
```

On a chunk holding one day of data, its size went from 2,856 kB to **24 kB**. This synthetic data compresses exceptionally well. For real-world GPS feeds, the realistic ratio is around 10x to 20x because sensor data is noisier. At 260 million rows per month, though, saving 90%+ in disk space means hundreds of gigabytes.

**Compressed chunks remain queryable** via standard SQL. TimescaleDB decompresses them transparently when needed.

> The natural partner to compression is a **retention policy** (`add_retention_policy`) to automatically drop chunks older than N months, depending on legal or business compliance rules. While I didn't attach one in this demo, you should define your retention timeline from day one in production.

## Key Takeaways Before Moving Forward

- **Keep registry and time-series data apart.** `devices` is a standard relational table; `positions` is a hypertable. Don't mix them together.
- **Always bound queries by time.** The `(device_id, time DESC)` index only helps when your query specifies which time range it cares about.
- **Use continuous aggregates for all reporting metrics.** Precompute summaries in the background instead of calculating them on demand every time a user opens a dashboard. In production, this pattern turns multi-minute queries into sub-second responses.
- **Implement compression and retention from day one.** Neither can be retrofitted effortlessly down the road. Deciding how long raw data lives is a business requirement, don't let it become an operational emergency.

Coordinates are now stored and queryable. Fleet tracking also needs to answer questions like "Did my vehicle leave the delivery zone?" In [Part 5](/en/writing/2026/geofencing-postgis/), I cover geofencing with PostGIS: polygons, `ST_Contains`, and real-time zone entry/exit detection.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 3 - Decode Packet: GT06 & Teltonika Protocol](/en/writing/2026/decode-packet-gt06-teltonika/)
- Next: [Part 5 - Geofencing with PostGIS](/en/writing/2026/geofencing-postgis/)

## CTA

For questions about storing GPS data with PostgreSQL or TimescaleDB, [contact me](/en/contact/). You can also subscribe to [RSS](/en/writing/index.xml) to follow future posts.

[^ts]: All SQL examples in this post were verified on TimescaleDB 2.30.0 (PostgreSQL 16, Docker image `timescale/timescaledb:latest-pg16`) with 155,523 synthetic rows. You can reproduce the full setup using `docker run` combined with the SQL commands above.
