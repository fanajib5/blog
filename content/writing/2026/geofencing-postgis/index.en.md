---
title: "Geofencing with PostGIS: Real-Time Entry-Exit Detection"
description: "Detecting when vehicles enter and exit areas with PostGIS: polygon geofences, ST_Within, entry/exit events using window functions, up to POI radius with geography, tested against real routes."
author: "Faiq Najib Al-Aziz"
date: 2026-11-11
lastmod: 2026-11-11
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - postgresql
  - postgis
  - gps
  - gis
pillar: "postgresql"
series: "gps-backend-series"
series_part: 5
---

"Vehicle A entered the port area at 03:00, exited at 05:30."

A sentence that simple is one of the most commercially attractive features in the GPS tracking world, and one of the most frequently botched in implementation. Geofencing is not just about drawing a _polygon_ on a map; it is about accurately detecting entry and exit _events_ from a data stream arriving every 10 to 30 seconds.

In [Part 4](/en/writing/2026/gps-data-postgresql-timescaledb/), positions were neatly stored in TimescaleDB. This post adds another dimension: **regions**. All examples here were tested on PostGIS 3.5 (PostgreSQL 16, container `postgis/postgis:16-3.5`).

## A Geofence Is Just an Inside or Outside Question

The core problem of geofencing is really just one question answered over and over again: _is this point inside that polygon?_ PostGIS answers this with `ST_Within(point, polygon)`. Before talking real-time, let us verify the foundations first.

First, the geofences table: polygons with SRID 4326 (the standard GPS latitude/longitude coordinate system) and a GiST index:

```sql
CREATE TABLE geofences (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    name      TEXT NOT NULL,
    geom      GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE INDEX idx_geofences_geom ON geofences USING GIST (geom);
```

For this demo, I will use a bounding box roughly covering the Tanjung Perak Port area in Surabaya (in production, polygons are drawn by customers on a map and can take any shape):

```sql
INSERT INTO geofences (name, geom) VALUES (
    'Area Pelabuhan Tanjung Perak',
    ST_GeomFromText(
        'POLYGON((112.72 -7.20, 112.78 -7.20, 112.78 -7.23,
                  112.72 -7.23, 112.72 -7.20))', 4326)
);
```

Next, position points. Here is a neat little trick: if your `positions` table still uses `lat`/`lon` columns (like our schema in Part 4), we can add an **automatically generated** geometry column via a _generated column_, without changing our insert flow at all:

```sql
ALTER TABLE positions ADD COLUMN geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED;
```

Now let us test membership with a truck route I seeded: two points outside the area, two points inside:

```sql
SELECT time, lat, lon,
       ST_Within(geom, (SELECT geom FROM geofences WHERE id = 1)) AS inside
FROM positions ORDER BY time;
```

```text
          time          |  lat  |  lon   | inside
------------------------+-------+--------+--------
 2026-11-11 02:58:00+07 | -7.19 | 112.73 | f
 2026-11-11 03:00:00+07 | -7.21 | 112.74 | t
 2026-11-11 03:30:00+07 | -7.22 | 112.75 | t
 2026-11-11 05:30:00+07 | -7.25 | 112.76 | f
(4 rows)
```

The foundation works. But customers do not buy a list of `true`/`false` values; they pay for **events**.

## Turning Inside/Outside into Events: Entry and Exit

Membership alone is not enough. A truck idling inside the port for 4 hours will emit hundreds of `inside` points, and a dashboard that displays "entered" 400 times is a broken dashboard. What we really need: a single `ENTER` event when state shifts from outside to inside, and one `EXIT` event for the reverse transition.

This is purely a matter of comparing the current point's status against the previous point, a perfect job for the `LAG` window function:

```sql
WITH membership AS (
    SELECT p.device_id, p.time,
           ST_Within(p.geom, g.geom) AS inside
    FROM positions p
    CROSS JOIN geofences g
),
changes AS (
    SELECT *,
           LAG(inside) OVER (ORDER BY time) AS prev_inside
    FROM membership
)
SELECT device_id, time,
       CASE WHEN NOT prev_inside AND inside THEN 'ENTER'
            WHEN prev_inside AND NOT inside THEN 'EXIT' END AS event
FROM changes
WHERE prev_inside IS NOT NULL          -- first point: no comparison baseline yet
  AND prev_inside IS DISTINCT FROM inside;
```

Here is the result on that route, exactly two rows, precisely what the customer wants:

```text
 device_id |          time          | event
-----------+------------------------+-------
         1 | 2026-11-11 03:00:00+07 | ENTER
         1 | 2026-11-11 05:30:00+07 | EXIT
```

(In production, add `PARTITION BY device_id, g.id ORDER BY time`, since each device tracks its own state sequence per fence.)

## Real-Time: Checking Inside the Ingest Worker

The query above is great for historical analysis. For real-time alerts, our checking location should not be a bulk query, but **right at the data ingestion point**. Following our architecture from Part 2: the listener never touches the database, the ingest worker does the heavy lifting:

```go
func checkGeofences(ctx context.Context, pool *pgxpool.Pool, p Position) {
    rows, err := pool.Query(ctx, `
        SELECT g.id, g.name,
               ST_Within(ST_SetSRID(ST_MakePoint($1, $2), 4326), g.geom) AS inside
        FROM geofences g
        WHERE g.tenant_id = $3
          AND ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                         g.geom::geography, 5000)`, -- pre-filter 5 km bbox
        p.Lon, p.Lat, p.TenantID)
    if err != nil {
        log.Printf("geofence query: %v", err)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var id int64
        var name string
        var inside bool
        _ = rows.Scan(&id, &name, &inside)
        // compare with previous status (cache/Redis per device+fence),
        // changed -> emit ENTER/EXIT event
    }
}
```

Two key details make this approach efficient across thousands of fences:

1. **Pre-filtering with `ST_DWithin` on geography at 5 km** utilizes the GiST index to prune distant fences, so exact `_Within` checks run only for nearby candidates.
2. **Previous state is not queried from `positions`**; it is retrieved directly from cache (`device_id:fence_id -> inside`). It is literally a single bit of state that only updates upon a change event.

Why not use PostgreSQL triggers? You could, but triggers couple business logic tightly to your schema, are difficult to unit-test in isolation, and hide background workloads from application metrics. With the worker pattern, dispatching alert notifications (push, WhatsApp, email) is just regular Go code.

## POI Radius: geography, Not geometry

Polygon geofences are ideal for clearly bounded areas (ports, warehouses, industrial zones). But a requirement like "alert when a vehicle approaches a gas station within 500 meters" is more naturally modeled as a circle. And here lies a classic PostGIS trap: **units of measurement**.

`geometry` operates in angular degrees; `geography` operates on the Earth's curved surface in **meters**. A 500-meter radius written as `ST_DWithin(geom, geom, 500)` on a geometry column means 500 *degrees*, circling the globe multiple times over. Always use `geography`:

```sql
CREATE TABLE pois (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    geog GEOGRAPHY(Point, 4326) NOT NULL
);

INSERT INTO pois (name, geog) VALUES
    ('SPBU Kalimas', ST_SetSRID(ST_MakePoint(112.7521, -7.2575), 4326)::geography);

SELECT name,
       ST_DWithin(geog,
           ST_SetSRID(ST_MakePoint(112.7521, -7.2593), 4326)::geography,
           500) AS dalam_500m,
       ST_Distance(geog,
           ST_SetSRID(ST_MakePoint(112.7521, -7.2593), 4326)::geography) AS jarak_m
FROM pois;
```

```text
    name     | dalam_500m |   jarak_m
--------------+------------+--------------
  SPBU Kalimas | t          | 199.0656
(1 row)
```

199 meters: well within radius, and the calculation makes sense because `geography` accounts for the curvature of the Earth.

## Gotchas That Will Bite You

- **GPS drift along polygon boundaries.** A fluctuating GPS signal sitting near a boundary line can generate erratic ENTER/EXIT events in rapid succession (e.g. a truck parked right next to the fence). Common solutions: a buffer zone where entry requires going 50 meters inside (`ST_DWithin(geom, geom, -50)` is invalid; use `ST_Contains(ST_Buffer(geom, -0.0005), point)`), or requiring two consecutive consistent readings before firing an event.
- **Sampling interval vs. speed.** A vehicle moving at 60 km/h with a 60-second ping interval travels 1 km per point. A route clipping through a small fence can easily jump across between pings without ever recording a point *inside*. For mission-critical boundaries, inspect the path segment (checking whether the line between two consecutive points intersects the polygon boundary using `ST_Intersects` on `ST_MakeLine`).
- **Degree units vs. meters**: as emphasized above, `geometry` uses degrees while `geography` uses meters. Always stay conscious of which type you are querying.
- **Mismatched SRIDs**: when calling `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`, if you omit the SRID, PostGIS will refuse to compare them (or worse, silently match if both are 0). Also watch the parameter order: **longitude first, latitude second**, the opposite of our daily spoken "lat-long" habit.

## Key Takeaways

- A geofence is an inside/outside query (`ST_Within`) transformed into a **transition event** (`LAG` state comparison), not a raw membership log.
- Perform real-time evaluations inside the **ingest worker** using an `ST_DWithin` pre-filter and a 1-bit cached state; save heavy window function queries for historical reporting.
- `geometry` vs `geography`: degrees vs meters. POI radius checks belong in `geography`.
- Real-world GPS data is imprecise: engineer around drift (buffers) and sparse sampling intervals (line segments vs points).

Now position data is persisted and regional events are reliably detected. What remains for this backend: bringing it all to life on the customer's screen, a live map moving smoothly without page refreshes. In [Part 6](/en/writing/2026/real-time-gps-dashboard/), we will dive into building a real-time dashboard: WebSockets, fan-out, and broadcast architecture patterns.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 4: Storing GPS Data with PostgreSQL + TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/)
- Next: [Part 6: Building a Real-Time GPS Dashboard](/en/writing/2026/real-time-gps-dashboard/)

## CTA

Share this post if you found it useful. For further discussions, head over to [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
