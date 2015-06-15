#!/usr/bin/env node

'use strict';

var program = require('commander');
var shapefile2geojson = require('./shapefile2geojson.js');
var fs = require('fs');


var shpName, dbfName;
program
    .option('-s, --shp <shp>', 'shp file')
    .option('-d, --dbf <dbf>', 'dbf file')
    .option('-p, --pretty', 'pretty output')
    .parse(process.argv);

if (typeof  program.shp === 'undefined') {
    console.error('shp file is mandatory');
}
if (typeof program.dbf === 'undefined') {
    console.error('dbf file is mandatory');
}

if (typeof program.shp === 'undefined' || typeof program.dbf === 'undefined') {
    process.exit(1);
}

var geojson = shapefile2geojson(fs.readFileSync(program.shp), fs.readFileSync(program.dbf));

if (program.pretty === true) {
    console.log(JSON.stringify(geojson, null, 2));
} else {
    console.log(JSON.stringify(geojson));
}
