# Build Status

[![test](https://github.com/shawcx/tilemill/actions/workflows/test.yml/badge.svg)](https://github.com/shawcx/tilemill/actions/workflows/test.yml)

GitHub Actions (`.github/workflows/test.yml`) runs `npm test` on Node 22 and 24
against a PostGIS service container, and builds and smoke-tests the Docker
image.

# Running tests

Install the dependencies and run the tests

    npm install
    npm test

Note: the tests require the postgres client tools (`psql`, `createdb`), a
running postgres server and a postgis enabled database called
`template_postgis`. Connection settings come from the standard `PG*`
environment variables. The quickest way is a throwaway PostGIS container:

    docker run -d --rm --name tilemill-test-postgis -p 127.0.0.1:55432:5432 \
        -e POSTGRES_PASSWORD=tilemill postgis/postgis:17-3.5
    PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres PGPASSWORD=tilemill npm test
    docker stop tilemill-test-postgis

If you use your own server and do not have a template_postgis create one like:

    createdb -E UTF8 template_postgis
    psql -c "CREATE EXTENSION postgis" template_postgis

For more detailed info, see the [Using Open Street Map (OSM) Data in TileMill section of the installation guide](https://tilemill-project.github.io/tilemill/docs/install/#useosm).
For more info see: http://postgis.net/docs/manual-1.5/ch02.html

1. Debug the project data by running TileMill with

    ./index.js --files=./test/fixtures/files/

2. Try clearing the cache of test data:

    rm -rf ./test/fixtures/files/


# Documentation

TileMill documentation is kept in the gh-pages branch, which is independently managed and not merged with master.

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually sync'ed from the gh-pages branch.

To checkout the g-pages branch, do the following:

    cd ~
    git clone -b gh-pages https://github.com/tilemill-project/tilemill.git tilemill-gh-pages

You can find more info about how to keep the documentation up to date in the CONTRIBUTING.md file within the tilemill-gh-pages directory.
