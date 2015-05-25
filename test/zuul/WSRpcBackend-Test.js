console.log('WSRpcBackend test');

var WS_PORT = 3001;

var assert = require('assert');
var after = require('after');

var backend = require('../../dist/WSRpcBackend');
var frontend = require('../../dist/WSRpcFrontend');
var bus = require('../../dist/EventBus');
var reg = require('../../dist/Registry');
var jrpc = require('../../dist/JsonRpc');

var sample = require('./../extra/wsrpc_registry_classes').wsrpc_registry_classes;

backend.DEBUG = true;
frontend.DEBUG = true;

suite('WSRpcBackend');

test('Clients connect', function(done) {
    done = after(1, done);
    var client1 = new WebSocket('ws://localhost:' + WS_PORT);
    var client2 = new WebSocket('ws://localhost:' + WS_PORT);
    setTimeout(function() {
        client1.close();
        client2.close();
        done();
    }, 1000);
});

test('Backend test : execute', function(done) {
    done = after(3, done);
    var _ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _frontend = new frontend.WSRpcFrontend();
    _frontend.link(_ws);

    setTimeout(function() {
        _frontend.call(
            'compteur',
            'increment',
            function (json) {
                assert.equal(1, json);
                done();
            }).fire();

        done();
    }, 500);

    setTimeout(function() {
        _ws.close();
        done();
    }, 1000);
});

test('Backend test : broadcastExecute & sendResponseToOrigin', function(done) {
    done = after(5, done);
    var _ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _frontend = new frontend.WSRpcFrontend();
    _frontend.singleton('dateutil', sample.DateUtil);
    _frontend.link(_ws);

    var _ws2 = new WebSocket('ws://localhost:' + WS_PORT);
    var _frontend2 = new frontend.WSRpcFrontend();
    _frontend2.singleton('dateutil', sample.DateUtil);
    _frontend2.link(_ws2);

    var _ws3 = new WebSocket('ws://localhost:' + WS_PORT);
    var _frontend3 = new frontend.WSRpcFrontend();
    _frontend3.singleton('dateutil', sample.DateUtil);
    _frontend3.link(_ws3);

    setTimeout(function() {
        _frontend.call(
            'dateutil',
            'getHour',
            function (json) {
                assert.equal(23, json);
                console.log('Reponse = ' + JSON.stringify(json));
                done();
            },
            function (json) {
                console.log('Error = ' + JSON.stringify(json));
            }).broadcast();
        done();
    }, 100);

    setTimeout(function() {
        _ws.close();
        _ws2.close();
        _ws3.close();
        done();
    }, 1000);
});

test('Backend test : broadcastExecute & receiveClientError & sendErrorToOrigin', function(done) {
    done = after(3, done);
    var _ws = new WebSocket('ws://localhost:' + WS_PORT);
    var _frontend = new frontend.WSRpcFrontend();

    _frontend.singleton('dateutil', sample.DateUtil);
    _frontend.link(_ws);

    setTimeout(function() {
        _frontend.call(
            'dateutil2',
            'getHour',
            function (json) {
                console.log('Fail, dateutil2 does not exist.');
            },
            function (json) {
                console.log('Error = ' + JSON.stringify(json));
                done();
            }).broadcast();
        done();
    }, 100);

    setTimeout(function() {
        _ws.close();
        done();
    }, 1000);
});
