// carto's mapnik-reference stops at Mapnik 3.0.x. Mapnik 4 keeps the 3.0
// style schema, so map newer versions onto the latest known reference.
var semver = require('semver');
var mapnik = require('mapnik');

module.exports = semver.gte(mapnik.versions.mapnik, '4.0.0') ? '3.0.6' : mapnik.versions.mapnik;
