console.log('RPC test');

var assert = require('assert');
var after = require('after');

var wsrpc = require('../dist/WSRpc');
var sample = require('./extra/wsrpc_registry_classes').wsrpc_registry_classes;

wsrpc.DEBUG = true;

suite('RPCRegistry');

test('Building and working with object registry', function() {
    var registry = new wsrpc.ObjectRegistry();
    registry.register('compteur', sample.Compteur);
    registry.register('chatroom', sample.Chatroom);

    var r = registry.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 1);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 2);

    registry.invoke('chatroom', 'say', 'COUCOU2');
    registry.invoke('chatroom', 'say', 'COUCOU aussi');
    registry.invoke('chatroom', 'print');
    assert.equal(registry.invoke('chatroom', 'getMessages').length, 2);

    var error = null;
    try {
        registry.invoke('chatroom', 'print2');
    } catch(err) {
        error = err;
    }
    assert.equal('ObjectRegistry invoke fail on chatroom.print2()', error);
});

test('Building and working with class registry', function() {
    var registry = new wsrpc.ClassRegistry();
    registry.register('compteur', sample.Compteur);
    registry.register('chatroom', sample.Chatroom);

    var r = registry.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 0);

    registry.invoke('chatroom', 'say', 'COUCOU2');
    registry.invoke('chatroom', 'say', 'COUCOU aussi');
    registry.invoke('chatroom', 'print');
    assert.equal(registry.invoke('chatroom', 'getMessages').length, 0);

    var error = null;
    try {
        registry.invoke('chatroom', 'print2');
    } catch(err) {
        error = err;
    }
    assert.equal('ClassRegistry invoke fail on chatroom.print2()', error);
});

test('Building and working with key registry', function() {
    var classRegistry = new wsrpc.ClassRegistry();
    classRegistry.register('compteur', sample.Compteur);
    classRegistry.register('chatroom', sample.Chatroom);

    var r1 = new wsrpc.KeyRegistry('lionelg3', classRegistry);
    var r2 = new wsrpc.KeyRegistry('my', classRegistry);

    var r = r1.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = r1.invoke('compteur', 'increment');
    assert.equal(r, 1);
    r = r1.invoke('compteur', 'increment');
    assert.equal(r, 2);

    var r = r2.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = r2.invoke('compteur', 'increment');
    assert.equal(r, 1);
    r = r2.invoke('compteur', 'increment');
    assert.equal(r, 2);


    r1.invoke('chatroom', 'say', 'COUCOU2');
    r1.invoke('chatroom', 'say', 'COUCOU aussi');
    r1.invoke('chatroom', 'print');
    assert.equal(r1.invoke('chatroom', 'getMessages').length, 2);


    r2.invoke('chatroom', 'say', 'COUCOU2');
    r2.invoke('chatroom', 'say', 'COUCOU aussi');
    r2.invoke('chatroom', 'say', 'COUCOU trois');
    r2.invoke('chatroom', 'print');
    assert.equal(r2.invoke('chatroom', 'getMessages').length, 3);

    assert.equal(r1.invoke('chatroom', 'getMessages').length, 2);

    var error = null;
    try {
        r1.invoke('chatroom', 'print2');
    } catch(err) {
        error = err;
    }
    assert.equal('KeyRegistry lionelg3 invoke fail on chatroom.print2()', error);
});