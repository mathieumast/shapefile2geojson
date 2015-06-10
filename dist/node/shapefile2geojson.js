/**
 * shapefile2geojson: transform shapefile (shp & dbf) to geojson.
 * 
 * Copyright (c) 2015, Mathieu MAST
 * Licensed under the MIT license.
 */

'use strict';

function shapefile2geojson(shpBuffer, dbfBuffer) {
    var parser = new shapefile2geojsonParser(shpBuffer, dbfBuffer);
    return parser.geojson;
}

function shapefile2geojsonParser(shpBuffer, dbfBuffer) {
    var shpDv, dbfDv;
    if (typeof DataView === 'function' && shpBuffer instanceof DataView || typeof jDataView === 'function' && shpBuffer instanceof jDataView) {
        shpDv = shpBuffer;
    } else if (typeof ArrayBuffer === 'function' && shpBuffer instanceof ArrayBuffer) {
        shpDv = new DataView(shpBuffer);
    } else {
        try {
            shpDv = new DataView(new Uint8Array(shpBuffer).buffer);
        } catch (err) {
            throw new Error('Unsupported shp buffer');
        }
    }
    if (typeof DataView === 'function' && dbfBuffer instanceof DataView || typeof jDataView === 'function' && dbfBuffer instanceof jDataView) {
        dbfDv = dbfBuffer;
    } else if (typeof ArrayBuffer === 'function' && dbfBuffer instanceof ArrayBuffer) {
        dbfDv = new DataView(dbfBuffer);
    } else {
        try {
            dbfDv = new DataView(new Uint8Array(dbfBuffer).buffer);
        } catch (err) {
            throw new Error('Unsupported shp buffer');
        }
    }  
    var geometries = this.parseShp(shpDv);
    var propertiesArray = this.parseDbf(dbfDv);
    var geojson = {}; 
    geojson.type = 'FeatureCollection';
    geojson.features = [];
    var i = 0;
    var len = (geometries.length < propertiesArray.length) ? geometries.length : propertiesArray.length;
    while (i < len) {
        geojson.features.push({
            'type': 'Feature',
            'geometry': geometries[i],
            'properties': propertiesArray[i]
        });
        i++;
    }
    this.geojson = geojson;
}

shapefile2geojsonParser.prototype.parseShp = function(dv) {
    var idx = 0;
    var fileCode = dv.getInt32(idx, false);
    idx += 6*4;
    var wordLength = dv.getInt32(idx, false);
    var byteLength = wordLength * 2;
    idx += 4;
    var version = dv.getInt32(idx, true);
    idx += 4;
    var shapeType = dv.getInt32(idx, true);
    idx += 4;
    var minX = dv.getFloat64(idx, true);
    var minY = dv.getFloat64(idx+8, true);
    var maxX = dv.getFloat64(idx+16, true);
    var maxY = dv.getFloat64(idx+24, true);
    var minZ = dv.getFloat64(idx+32, true);
    var maxZ = dv.getFloat64(idx+40, true);
    var minM = dv.getFloat64(idx+48, true);
    var maxM = dv.getFloat64(idx+56, true);
    idx += 8*8;
    var features = [];
    while (idx < byteLength) {
        var feature = {};
        var number = dv.getInt32(idx, false);
        idx += 4;
        var length = dv.getInt32(idx, false);
        idx += 4;
        try {
            var type = dv.getInt32(idx, true);
            var idxFeature = idx + 4;
            var byteLen = length * 2;
            switch (type) {
                case 1:
                case 11:
                case 21:
                    feature.type = 'Point';
                    feature.coordinates = [
                        dv.getFloat64(idxFeature, true),
                        dv.getFloat64(idxFeature+8, true)
                    ];
                    break;
                case 3:
                case 5:
                case 13:
                case 15:
                case 23:
                case 25:
                    if (type === 3 || type === 13 || type === 23) {
                        feature.type = 'MultiLineString';
                    } else if (type === 5 || type === 15 || type === 25) {
                        feature.type = 'Polygon';
                    }
                    feature.coordinates =  [];
                    var nbparts = dv.getInt32(idxFeature+32, true);
                    var nbpoints = dv.getInt32(idxFeature+36, true);
                    idxFeature += 40;
                    var nbpartsPoint = [];
                    for (var i=0; i < nbparts; i++) {
                        nbpartsPoint.push(dv.getInt32(idxFeature, true));
                        idxFeature += 4;
                    }
                    for (var i=0; i < nbparts; i++) {
                        var idstart = nbpartsPoint[i];
                        var idend = nbpoints - 1;
                        if (i < nbparts - 1) {
                            idend = nbpartsPoint[i + 1] - 1;
                        }                            
                        var part = [];
                        for (var j=idstart; j <= idend; j++) {
                            part.push([
                                dv.getFloat64(idxFeature, true),
                                dv.getFloat64(idxFeature+8, true)
                            ]);
                            idxFeature += 16;
                        }
                        feature.coordinates.push(part);
                    }
                    break;
                case 8:
                case 18:
                case 28:
                    feature.type = 'MultiPoint';
                    feature.coordinates =  [];
                    var nbpoints = dv.getInt32(idxFeature+32, true);
                    idxFeature += 36;
                    for (var i=0; i < nbpoints; i++) {
                        feature.coordinates.push([
                            dv.getFloat64(idxFeature, true),
                            dv.getFloat64(idxFeature+8, true)
                        ]);
                        idxFeature += 16;
                    }
                    break;
            }
        } catch(e) {
            if (console && console.log) console.log(e);
        }
        idx += length * 2;
        features.push(feature);
    }
    return features;
};

shapefile2geojsonParser.prototype.parseDbf = function(dv) {
    var idx = 4;
    var numberOfRecords = dv.getInt32(idx, true);
    idx += 28;
    var end = false;
    var fields = [];
    try {
        while (true) {
            var field = {};
            var nameArray = [];
            for (var i = 0; i < 10; i++) {
                var letter = dv.getUint8(idx);
                if (letter != 0) nameArray.push(String.fromCharCode(letter));
                idx += 1;
            }
            field.name = nameArray.join('');
            idx += 1;
            field.type = String.fromCharCode(dv.getUint8(idx));
            idx += 5;
            field.fieldLength = dv.getUint8(idx);
            idx += 16;
            fields.push(field);
            if (dv.getUint8(idx) == 0x0D) break;
        }
    } catch(err) {
        if (console && console.log) console.log(err);
        end = true;
    }
    idx += 1;
    var propertiesArray = [];
    for (var i = 0; i < numberOfRecords; i++) {
        var properties = {};
        if (!end) {
            idx += 1;
            for (var j = 0; j < fields.length; j++) {
                var charString = [];
                for (var h = 0; h < fields[j].fieldLength; h++) {
                    charString.push(String.fromCharCode(dv.getUint8(idx)));
                    idx += 1;
                }
                properties[fields[j].name] = charString.join('').trim();

            }
        }
        propertiesArray.push(properties);
    }
    return propertiesArray;
};

module.exports = shapefile2geojson;