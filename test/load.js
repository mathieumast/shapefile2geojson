var shapefile2geojson = require('../src/shapefile2geojson');
var assert = require('assert');
var fs = require('fs');

function read(name) {
    return shapefile2geojson(fs.readFileSync('test/data/' + name + '.shp'), fs.readFileSync('test/data/' + name + '.dbf'));
}

describe('Load', function(){
    it('polygon', function(){
        var geojson = read('polygon');
        assert.equal(474, geojson.features.length);
    });
    it('pline', function(){
        var geojson = read('pline');
        assert.equal(460, geojson.features.length);
    });
    it('multipnt', function(){
        var geojson = read('multipnt');
        assert.equal(1, geojson.features.length);
        assert.equal(1, geojson.features[0].geometry.coordinates.length);
    });
    it('csah', function(){
        var geojson = read('csah');
        assert.equal(124, geojson.features.length);
    });
    it('anno', function(){
        var geojson = read('anno');
        assert.equal(201, geojson.features.length);
    });
    it('brklinz', function(){
        var geojson = read('brklinz');
        assert.equal(122, geojson.features.length);
    });
    it('3dpoints', function(){
        var geojson = read('3dpoints');
        assert.equal(22, geojson.features.length);
    });
    it('masspntz', function(){
        var geojson = read('masspntz');
        assert.equal(815, geojson.features.length);
    });
});
