console.log('WSRpc test');

var assert = require('assert');
var after = require('after');

var handler = require('../../dist/FrontendCallHandler');
var jrpc = require('../../dist/JsonRpc');

var sample = require('./../extra/wsrpc_registry_classes').wsrpc_registry_classes;

handler.DEBUG = true;

suite('FrontendCallHandler');

var mockClient = {
    jsonRpcMessage: null,
    send: function(data) {
        console.log('MOCK SEND ' + data);
        this.jsonRpcMessage = data;
    },
    result: function() {
        return JSON.parse(this.jsonRpcMessage).result;
    }
};

test('FrontendCallHandler call singleton', function() {

    var _handler = new handler.FrontendCallHandler();

    _handler.singleton('compteur', sample.Compteur);
    _handler.singleton('chatroom', sample.Chatroom);
    _handler.stateless('dateutil', sample.DateUtil);

    // Test singleton compteur
    _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
    assert.equal(null, mockClient.result());

    _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
    assert.equal(1, mockClient.result());

    _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
    assert.equal(2, mockClient.result());

    var registry = _handler.getRegistry('compteur');
    var v = registry.invoke('compteur', 'increment', null);

    assert.equal(3, v);

    var rpc = new jrpc.RPC(
        JSON.parse(
            '{' +
            '"jsonrpc":"2.0",' +
            '"method":"compteur.increment",' +
            '"params":null,' +
            '"id":"INC"' +
            '}'
        )
    );
    _handler.execute(mockClient, rpc);

    v = registry.invoke('compteur', 'increment', null);

    assert.equal(5, v);
});

test('FrontendCallHandler call stateless', function() {
    var _handler = new handler.FrontendCallHandler();

    _handler.singleton('compteur', sample.Compteur);
    _handler.singleton('chatroom', sample.Chatroom);
    _handler.stateless('dateutil', sample.DateUtil);

    // Test stateless dateutil
    var registry = _handler.getRegistry('dateutil');
    var h1 = registry.invoke('dateutil', 'getHour', null);

    _handler.rpcInvoke(mockClient, 'dateutil', 'getHour', null, 'HOUR');
    assert.equal(h1, mockClient.result());

    var rpc = new jrpc.RPC(
        JSON.parse(
            '{' +
                '"jsonrpc":"2.0",' +
                '"method":"dateutil.getHour",' +
                '"params":null,' +
                '"id":"HOUR"' +
            '}'
        )
    );

    _handler.execute(mockClient, rpc);
    assert.equal(h1, mockClient.result());

    var h2 = registry.invoke('dateutil', 'getHour', null);
    assert.equal(h1, h2);
});


test('FrontendCallHandler call unknowned instance', function() {
    var _handler = new handler.FrontendCallHandler();

    // Test stateless unknowned instance
    var registry = _handler.getRegistry('foo');
    assert.equal(registry, null);

    var noCatch = null;
    try {
        _handler.rpcInvoke(mockClient, 'foo', 'bar', null, 'FOO');
        noCatch = true;
    } catch (err) {
        noCatch = false;
    }
    assert.equal(true, noCatch);

    var rpc = new jrpc.RPC(
        JSON.parse(
            '{' +
                '"jsonrpc":"2.0",' +
                '"method":"foo.bar",' +
                '"params":null,' +
                '"id":"FOO.BAR"' +
            '}'
        )
    );

    noCatch = null;
    try {
        _handler.execute(mockClient, rpc);
        noCatch = true;
    } catch (err) {
        noCatch = false;
    }
    assert.equal(true, noCatch);

    rpc = new jrpc.RPC(
        JSON.parse(
            '{' +
                '"jsonrpc":"2.0",' +
                '"method":"foo_bar",' +
                '"params":null,' +
                '"id":"FOO_BAR"' +
            '}'
        )
    );

    noCatch = null;
    try {
        _handler.execute(mockClient, rpc);
        noCatch = true;
    } catch (err) {
        noCatch = false;
    }
    assert.equal(true, noCatch);
});

