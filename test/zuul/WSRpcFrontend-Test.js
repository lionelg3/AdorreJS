console.log('WSRpcFrontend test');

var WS_PORT = 3000;

var assert = require('assert');
var after = require('after');

var wrc = require('../../dist/WSRpcFrontend');
var bus = require('../../dist/EventBus');
var reg = require('../../dist/Registry');
var jrpc = require('../../dist/JsonRpc');

var sample = require('./../extra/wsrpc_registry_classes').wsrpc_registry_classes;

wrc.DEBUG = true;

suite('WSRpcFrontend');

test('WSRpcFrontend WebSocket client connect', function (done) {
    done = after(2, done);
    var _ws = new WebSocket('ws://localhost:' + WS_PORT);
    done();
    setTimeout(function () {
        _ws.close();
        done();
    }, 1000);
});

test('WSRpcFrontend link', function (done) {
    done = after(4, done);
    var _ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _wrc = new wrc.WSRpcFrontend();
    try {
        _wrc.link(null);
    } catch (err) {
        done();
    }

    try {
        _wrc.call(
            'sample',
            'action').fire();
    } catch (err) {
        done();
    }

    try {
        _wrc.link(_ws);
        done();
    } catch (err) {
        console.warn(err);
    }
    setTimeout(function () {
        _ws.close();
        done();
    }, 1000);
});

test('WSRpcFrontend fire call', function (done) {
    done = after(3, done);
    var ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.link(ws);
    done();

    setTimeout(function () {
        _wrc.call(
            'remoteObject',
            'sayHello',
            function (json) {
                assert.equal(json.message, 'Hello world!');
                done();
            }
        ).fire({'who': 'world'});
    }, 400);

    setTimeout(function () {
        ws.close();
        done();
    }, 1500);
});

test('WSRpcFrontend broadcast call', function (done) {
    done = after(6, done);
    var counter = 0;
    var ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.link(ws);
    done();

    setTimeout(function () {
        _wrc.call(
            'remoteObject',
            'sayHello',
            function (json) {
                assert.equal(json.message, 'Hello world!');
                counter++;
                done();
            }
        ).broadcast({'who': 'world'});
    }, 400);

    setTimeout(function () {
        ws.close();
        assert.equal(counter, 4);
        done();
    }, 1500);
});

test('WSRpcFrontend create failed call', function (done) {
    done = after(3, done);
    var ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.link(ws);
    done();

    setTimeout(function () {
        _wrc.call(
            'remoteObject',
            'sayHelloFailed',
            function (json) {

            },
            function (json) {
                assert.equal(-32601, json.code);
                done();
            }
        ).fire({'who': 'world'});
    }, 400);

    setTimeout(function () {
        ws.close();
        done();
    }, 1500);
});

test('WSRpcFrontend simulate singleton handler', function () {
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.singleton('compteur', sample.Compteur);

    var __message = null;
    var mockClient = {
        send: function(data) {
            __message = data;
        }
    };

    var _rpc = jrpc.RPC.Request('id1', 'compteur.increment');
    var _msg = new jrpc.RPC(_rpc);
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());

    var lastresponse = new jrpc.RPC(JSON.parse(__message));
    var result = lastresponse.getResult();
    assert.equal(3, result);
});

test('WSRpcFrontend simulate stateless handler', function () {
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.stateless('compteur', sample.Compteur);

    var __message = null;
    var mockClient = {
        send: function(data) {
            __message = data;
        }
    };

    var _rpc = jrpc.RPC.Request('id1', 'compteur.increment');
    var _msg = new jrpc.RPC(_rpc);
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());
    _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());

    var lastresponse = new jrpc.RPC(JSON.parse(__message));
    var result = lastresponse.getResult();
    assert.equal(1, result);
});

test('WSRpcFrontend use client handler', function (done) {
    done = after(3, done);
    var ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _wrc = new wrc.WSRpcFrontend();
    _wrc.link(ws);
    _wrc.singleton('compteur', sample.Compteur);
    done();

    setTimeout(function () {
        _wrc.call(
            'remoteObject',
            'callme'
        ).fire()
    }, 400);

    setTimeout(function () {
        var mockClient = {
            send: function (data) {
                done();
                assert.equal(6, JSON.parse(data).result);
            }
        };
        var _rpc = jrpc.RPC.Request('id_final', 'compteur.increment');
        var _msg = new jrpc.RPC(_rpc);
        _wrc._handler.execute(mockClient, _msg.getInstance(), _msg.getMethod(), _msg.getParams(), _msg.getId());
    }, 1000);

    setTimeout(function () {
        ws.close();
        done();
    }, 1500);
});