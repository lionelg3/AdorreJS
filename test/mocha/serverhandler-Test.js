var assert = require("assert");

//var WebSocketServer = require('ws').Server;
var wsrpc = require('../../dist/WSRpc');
var wsrpcBackend = require('../../dist/WSRpcBackend');
var sample = require('..//extra/wsrpc_registry_classes').wsrpc_registry_classes;

wsrpcBackend.DEBUG = true;

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

describe('WSRpcServerCallHandler', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    _handler.singleton('compteur', sample.Compteur);
    _handler.singleton('chatroom', sample.Chatroom);
    _handler.stateless('dateutil', sample.DateUtil);

    describe('rpcInvoke: on singleton', function () {
        it('increment compteur value', function () {
            var registry = _handler.getRegistry('compteur');

            _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(null, mockClient.result());

            _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(1, mockClient.result());

            _handler.rpcInvoke(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(2, mockClient.result());

            var v = registry.invoke('compteur', 'increment', null);
            assert.equal(3, v);

            v = registry.invoke('compteur', 'increment', null);
            assert.equal(4, v);
        })
    });

    describe('rpcInvoke: on stateless', function () {
        it('get hour value', function () {
            var registry = _handler.getRegistry('dateutil');

            var h = registry.invoke('dateutil', 'getHour', null);

            _handler.rpcInvoke(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());

            _handler.rpcInvoke(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());

            _handler.rpcInvoke(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());
        })
    });
});