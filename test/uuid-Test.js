console.log('UUIDGenerator test');

var assert = require('assert');

var uuid = require('../dist/UUIDGenerator');

suite('UUIDGenerator');

test('UUIDGenerator simple', function() {
    var uuid1 = uuid.UUIDGenerator.generateUUID();
    var uuid2 = uuid.UUIDGenerator.generateUUID();
    assert.notEqual(uuid1, uuid2);
});