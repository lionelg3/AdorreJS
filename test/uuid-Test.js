console.log('UUIDGenerator test');

var assert = require('assert');

var wsrpc = require('../dist/WSRpc');
wsrpc.DEBUG = true;

suite('UUIDGenerator');

test('UUIDGenerator simple', function() {
    var uuid1 = wsrpc.UUIDGenerator.generateUUID();
    var uuid2 = wsrpc.UUIDGenerator.generateUUID();
    assert.notEqual(uuid1, uuid2);
});