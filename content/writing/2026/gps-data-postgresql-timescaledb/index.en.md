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

Each vehicle reports its position every 10 seconds. With one thousand vehicles, that is 8.6 million rows a day, 260 million a month, or around 3 billion a year. Customer dashboards want two things: new data inserted quickly, and reports over several weeks that do not take forever to load. PostgreSQL has to do both jobs here.

A regular PostgreSQL table can ingest that volume with the right indexes. The trouble is a query like "maximum speed per hour over the last 30 days" has to summarize hundreds of millions of rows whenever it runs. B-tree indexes are useful, but they do not help much with time-range aggregates. This is not a lookup for one row; it is a summary over many rows.

In [Part 3](/en/writing/2026/decode-packet-gt06-teltonika/), the coordinates came out of the decoder. Now I store them in PostgreSQL + [TimescaleDB](https://www.timescale.com/)[^ts]. I ran these examples in a `timescale/timescaledb:latest-pg16` container (TimescaleDB 2.30) with 155,000 synthetic rows. Not millions yet. I would rather not make my laptop complain.

## Why TimescaleDB, Not Just Regular Tables?

TimescaleDB is a PostgreSQL extension, not another database to maintain separately. Your usual tools (pgx, DBeaver, `pg_dump` backups, and database permissions) still work. For time-series data, it adds a few features:

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

> A production tip I learned the hard way: do not run an unbounded `SELECT *` against this table. Put a time range on the query. The `(device_id, time DESC)` index makes "device 1 positions today" cheap, but without a time limit PostgreSQL still has to scan that device's entire history. The index is not magic, sadly.

## Inserting from Go with pgx

In the production application, the protocol listener (Part 2) does not talk to the database. It pushes parsed coordinates into a queue, and workers handle the inserts. For batching inserts, `pgx` is more than fast enough:

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

Then there is a request like "maximum and average speed per hour, per vehicle, over the last 7 days". Without a continuous aggregate, PostgreSQL has to read all the raw points again whenever someone opens the dashboard. A continuous aggregate keeps a summary up to date in the background:

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

On this small dataset, the aggregate query is about 300 times faster. Please do not assume my laptop just solved everyone’s database problems. The main win is that the dashboard does not have to redo the raw-data calculation every time it loads.

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

In this test, a one-day chunk shrank from 2,856 kB to **24 kB**. The synthetic data compresses very easily. For real GPS feeds, a more reasonable estimate is 10x to 20x because sensor data is noisier. At 260 million rows a month, saving more than 90% still means a lot of disk space.

**Compressed chunks remain queryable** via standard SQL. TimescaleDB decompresses them transparently when needed.

> Compression usually goes with a **retention policy** (`add_retention_policy`) to automatically drop chunks older than N months. The number depends on legal rules and business needs. I did not add one to this demo, but in production it is better to decide early, before storage starts asking awkward questions.

## A Few Notes Before Moving On

- **Keep registry and time-series data apart.** `devices` is a standard relational table; `positions` is a hypertable. Don't mix them together.
- **Always bound queries by time.** The `(device_id, time DESC)` index only helps when your query specifies which time range it cares about.
- **Use continuous aggregates for reporting.** Summarize in the background so the dashboard does not have to calculate everything again. In the production system I work on, this pattern helped take reporting from minutes to seconds.
- **Think about compression and retention early.** How long to keep data is a business decision too. Do not wait until storage is full to ask, "do we still need last year's data?"

The coordinates are stored and queryable now. Fleet tracking also needs to answer questions like "Did my vehicle leave the delivery zone?" In [Part 5](/en/writing/2026/geofencing-postgis/), I will get into geofencing with PostGIS, polygons, `ST_Contains`, and detecting when a vehicle enters or leaves an area.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 3 - Decode Packet: GT06 & Teltonika Protocol](/en/writing/2026/decode-packet-gt06-teltonika/)
- Next: [Part 5 - Geofencing with PostGIS](/en/writing/2026/geofencing-postgis/)

## CTA

For questions about storing GPS data with PostgreSQL or TimescaleDB, [contact me](/en/contact/). You can also subscribe to [RSS](/en/writing/index.xml) to follow future posts.

[^ts]: All SQL examples in this post were verified on TimescaleDB 2.30.0 (PostgreSQL 16, Docker image `timescale/timescaledb:latest-pg16`) with 155,523 synthetic rows. You can reproduce the full setup using `docker run` combined with the SQL commands above.
