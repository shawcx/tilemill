# Latest Status - October 2026

TileMill now runs on modern Node.js. Highlights since v1.2.0:

- **Node.js 22+** (tested on 24 LTS), with current npm.
- **No system libraries to build.** Mapnik 4, SQLite and GDAL come as prebuilt binaries (`@mapnik/mapnik`, `sqlite3`, `gdal-async`) on Linux x64/arm64 and macOS.
- **Updated server stack.** `bones`, `carto` 1.2, `millstone`, `mirror`, `tilelive` and `srs` are vendored under `vendor/` and run on express 4 and jsdom 26. Unmaintained packages (`request`, `optimist`, `mkdirp`, `rimraf`, `uglify-js` 1.x) are replaced.
- **Updated browser libraries.** jQuery 3.7, jQuery UI 1.14, underscore 1.13 and Backbone 1.6 (were 1.5, 1.8, 1.1 and 0.3), with a compatibility layer so existing views behave the same.
- **PostGIS 17 in Docker.** `docker compose` now uses `postgis/postgis:17-3.5` with a healthcheck, and binds its ports to localhost only. If you have data in the old 9.6 volume, see [Upgrading the PostGIS database](#upgrading-the-postgis-database).
- **CI on GitHub Actions.** Tests run on Node 22 and 24 against PostGIS, plus a Docker build and smoke test.
- **Fixes:** carto now validates fonts against the target Mapnik version, MBTiles exports no longer write `attribution="undefined"`, the static export preview works with Mapnik 4, and the OSM loader script works with current Overpass and osm2pgsql.
- **Removed:** the broken Plugins page and the old macOS app build.

v1.2.0 (August 30, 2026) added easier map exports, visual aids for colors, and a Postgres management window.

See the [Change Log](CHANGELOG.md) for details.


# General Info
TileMill is a modern map design studio powered by [Node.js](https://nodejs.org) and [Mapnik](https://mapnik.org).

- TileMill is tested on Linux with Node 24 LTS (Node 22 or newer is required).
- TileMill currently only works in server mode, there is no standalone GUI.  Your browser is used for the interface.
- There are no native packages provided. Installation requires cloning this repo. See details below under *Installation*.
- Tilemill should theoretically work on the Windows platform, but it isn't tested.


# Dependencies

- Node.js 22 or newer (tested on 24 LTS)
- Mapnik, SQLite and GDAL come as prebuilt binaries via `@mapnik/mapnik`, `sqlite3` and `gdal-async`; no system libraries are needed on Linux x64/arm64 or macOS.
- `bones`, `carto`, `millstone`, `mirror`, `tilelive` and `srs` are vendored under `vendor/` (npm workspaces) with fixes for modern Node. Bones runs on express 4 with a compatibility layer for the express 2 API (`vendor/bones/server/compat.js`).


# Installation
### Quick installation instructions for Linux and macOS:

    git clone https://github.com/shawcx/tilemill.git
    cd tilemill
    nvm install 24
    nvm use 24
    npm install
    npm start

### Installation Scripts 
Scripts have been created that will do most everything for you. They were written for MacOS, but may still be usable for Ubunto and Windows with some modification.  (If you are successful with Ubunto and Windows, please post an Issue to let us know!)

[Installation Script Instructions](https://tilemill-project.github.io/tilemill/docs/mac-install/)


[Full Installation instructions can be found in the TileMill Documentation](https://tilemill-project.github.io/tilemill/docs/install/).

### Docker
It is also possible to run tilemill as a docker container:

    git clone https://github.com/shawcx/tilemill.git
    cd tilemill
    docker compose up

TileMill is then reachable at [http://localhost:20009](http://localhost:20009) (tiles on port 20008).
A PostGIS 17 instance is started as well and is reachable from the host at

	host=localhost port=5432 user=docker password=docker dbname=gis

All ports are bound to 127.0.0.1, so they are only reachable from this machine. Inside the
compose network TileMill reaches the database as `host=postgis`.

Docker hosted volumes are used for the containers, hence if you want to use sqlite dbs you have to interact with those to get the dbs into the docker container.

#### Upgrading the PostGIS database

Older versions of `docker-compose.yml` used `kartoza/postgis:9.6-2.4` with the `postgisVolume`
volume. PostgreSQL 17 cannot read that data directory, so the new setup uses a fresh volume,
`postgisData`, and leaves the old one untouched. To move your data across:

1. Before updating, with the old `docker-compose.yml`, dump the `gis` database:

        docker compose exec -T -e PGPASSWORD=docker postgis pg_dump -h localhost -U docker -Fc gis > gis.dump
        docker compose down

   If you already updated, run `git checkout <old commit> -- docker-compose.yml` to get the old
   file back temporarily.

2. With the new `docker-compose.yml`, start the database and restore the dump:

        docker compose up -d postgis
        docker compose exec -T postgis pg_restore -U docker -d gis --no-owner < gis.dump

   `pg_restore` reports errors for old PostGIS 2.4 helper functions (`could not access file
   "$libdir/postgis-2.4"`). These are legacy functions that no longer exist in PostGIS 3 and can
   be ignored; your tables and data are restored.

3. Once you have checked your data, the old volume can be removed with
   `docker volume rm <project>_postgisVolume` (see `docker volume ls`).

# Build Status, Running Tests, Updating Documentation

See CONTRIBUTING.md
