console.log('RPC test');

var assert = require('assert');
var after = require('after');

var lg3x = require('../dist/WSRpc').lg3x;
var sample = require('./extra/wsrpc_registry_classes').wsrpc_registry_classes;

lg3x.DEBUG = true;

suite('RPCRegistry');

test('Building and working with object registry', function() {
    var registry = new lg3x.ObjectRegistry();
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
    var registry = new lg3x.ClassRegistry();
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