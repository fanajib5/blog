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

"Vehicle A entered the port area at 03:00 and left at 05:30."

That kind of note is a common feature in GPS tracking services. It sounds simple, but it is easy to get wrong. We need to draw a _polygon_ and detect entry and exit _events_ from a stream of positions arriving every 10-30 seconds.

In [Part 4](/en/writing/2026/gps-data-postgresql-timescaledb/), positions were stored in TimescaleDB. This time I am adding one thing: **regions**. I tested the examples with PostGIS 3.5 (PostgreSQL 16, container `postgis/postgis:16-3.5`).

## First, Is This Point Inside or Outside?

The basic question is simple: _is this point inside the polygon or outside it?_ PostGIS has `ST_Within(point, polygon)` for that. I will start with this basic check.

I create the geofences table with polygons using SRID 4326 (the standard GPS latitude/longitude coordinate system) and a GiST index:

```sql
CREATE TABLE geofences (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    name      TEXT NOT NULL,
    geom      GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE INDEX idx_geofences_geom ON geofences USING GIST (geom);
CREATE INDEX idx_geofences_geog ON geofences USING GIST ((geom::geography));
```

For this demo I use a bounding box that roughly covers Tanjung Perak Port in Surabaya. In production, customers can draw polygons of any shape on the map.

```sql
INSERT INTO geofences (name, geom) VALUES (
    'Area Pelabuhan Tanjung Perak',
    ST_GeomFromText(
        'POLYGON((112.72 -7.20, 112.78 -7.20, 112.78 -7.23,
                  112.72 -7.23, 112.72 -7.20))', 4326)
);
```

Next I prepare geometry for the position points. If the `positions` table still uses `lat`/`lon` columns like the schema in Part 4, we can add a geometry column as a _generated column_. The insert statement does not need to change:

```sql
ALTER TABLE positions ADD COLUMN geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED;
```

I will test this against the sample truck route, with two points outside the area and two inside:

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

The query works. But users do not need a list of `true` and `false` values; they need **events**.

## Turning Status into Entry and Exit Events

Inside/outside status alone is not enough. A truck sitting in the port for 4 hours could send hundreds of `inside` points. A dashboard that says "entered" 400 times is clearly wrong. We only need an `ENTER` when the state changes from outside to inside, then an `EXIT` when it changes back.

To spot a change, I compare the current point with the previous one. The `LAG` window function is handy for this:

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

The route produces two rows:

```text
 device_id |          time          | event
-----------+------------------------+-------
         1 | 2026-11-11 03:00:00+07 | ENTER
         1 | 2026-11-11 05:30:00+07 | EXIT
```

(In production, add `PARTITION BY device_id, g.id ORDER BY time` so each device has its own status sequence for each fence.)

## Check Positions as They Arrive

The query above is useful for historical analysis. Real-time alerts need a check **when the data arrives**. In the Part 2 architecture, the listener does not touch the database. The ingest worker handles that:

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

Here are two things to keep in mind as the number of fences grows:

1. **The 5 km geography `ST_DWithin` pre-filter** can use the `idx_geofences_geog` expression index on `geom::geography` to prune distant fences. The `idx_geofences_geom` index remains available for geometry operations such as `ST_Within`. The planner may choose a different scan depending on table size and statistics, so check the query plan with `EXPLAIN (ANALYZE, BUFFERS)`.
2. **Previous state is not queried from `positions`**; it is retrieved directly from cache (`device_id:fence_id -> inside`). It is literally a single bit of state that only updates upon a change event.

Why not use PostgreSQL triggers? They can work, but business logic gets tied to the schema, testing it separately is harder, and the work is hidden from application metrics. With a worker, notifications (push, WhatsApp, email) can go through ordinary Go functions. I find the boundaries easier to follow this way.

## POI Radius: Use geography, Not geometry

Polygon geofences fit areas with clear boundaries, like ports or warehouses. If the requirement is "alert when a vehicle gets within 500 meters of a gas station", a radius makes more sense. There is one PostGIS gotcha: **units**.

`geometry` operates in angular degrees; `geography` operates on the Earth's curved surface in **meters**. A 500-meter radius written as `ST_DWithin(geom, geom, 500)` on a geometry column means 500 *degrees*, enough to circle the globe multiple times. For radius checks, use `geography`:

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

The result is 199 meters, still within the 500-meter radius. `geography` also accounts for the Earth's curvature.

## A Few Things That Can Surprise You

- **GPS drift along polygon boundaries.** A fluctuating GPS signal near a boundary can generate repeated ENTER/EXIT events, for example when a truck is parked right next to the fence. One common solution is a buffer zone: require the point to be 50 meters inside (`ST_DWithin(geom, geom, -50)` is invalid; use `ST_Contains(ST_Buffer(geom, -0.0005), point)`), or require two consecutive consistent readings before firing an event.
- **Sampling interval vs. speed.** A vehicle moving at 60 km/h with a 60-second ping interval travels 1 km between points. A route through a small fence can be missed between pings without ever recording a point *inside*. For mission-critical boundaries, inspect the path segment to see whether the line between two consecutive points intersects the polygon boundary using `ST_Intersects` on `ST_MakeLine`.
- **Degree units vs. meters**: `geometry` uses degrees while `geography` uses meters. Check which type you are querying.
- **Mismatched SRIDs**: if you omit the SRID when calling `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`, PostGIS will refuse to compare them (or worse, silently match if both are 0). The parameter order matters too: **longitude first, latitude second**, the opposite of our usual "lat-long" phrasing.

So, `ST_Within` gives us an inside/outside status, and `LAG` helps read status changes as events. For real-time checks, the worker can use an `ST_DWithin` pre-filter and keep the latest status in a cache. For radius checks, `geography` uses meters while `geometry` uses degrees. GPS can drift or send sparse updates, so we also need to think about the space between points.

The positions are stored and the geofence events are detected. In [Part 6](/en/writing/2026/real-time-gps-dashboard/), I will move on to a real-time GPS dashboard that displays the map without refreshing, with WebSockets, fan-out, and broadcast patterns.

## What's Next

This post is part of the **Building a GPS Backend from Scratch** series.

- Previous: [Part 4: Storing GPS Data with PostgreSQL + TimescaleDB](/en/writing/2026/gps-data-postgresql-timescaledb/)
- Next: [Part 6: Building a Real-Time GPS Dashboard](/en/writing/2026/real-time-gps-dashboard/)

## If You Want to Talk

If you want to talk more about geofencing with PostGIS, visit [Contact](/en/contact/) or subscribe via [RSS](/en/writing/index.xml).
