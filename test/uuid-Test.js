console.log('UUIDGenerator test');

var assert = require('assert');

var lg3x = require('../dist/WSRpc').lg3x;
lg3x.DEBUG = true;

suite('UUIDGenerator');

test('UUIDGenerator simple', function() {
    var uuid1 = lg3x.UUIDGenerator.generateUUID();
    var uuid2 = lg3x.UUIDGenerator.generateUUID();
    assert.notEqual(uuid1, uuid2);
});