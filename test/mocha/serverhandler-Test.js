var assert = require("assert");

//var WebSocketServer = require('ws').Server;
var bus = require('../../dist/EventBus');
var jrpc = require('../../dist/JsonRpc');
var wsrpc = require('../../dist/WSRpc');
var wsrpcBackend = require('../../dist/WSRpcBackend');
var sample = require('../extra/wsrpc_registry_classes').wsrpc_registry_classes;

wsrpcBackend.DEBUG = true;

var mockClient = {
    callCount: 0,
    jsonRpcMessage: null,
    send: function(data) {
        this.callCount ++;
        console.log('MOCK SEND ' + '(' + this.callCount + '), data = ' + data);
        this.jsonRpcMessage = data;
    },
    result: function() {
        return JSON.parse(this.jsonRpcMessage).result;
    },
    error: function() {
        return JSON.parse(this.jsonRpcMessage).error;
    }
};

var mockServer = {
    clients: [mockClient, mockClient]
};

describe('WSRpcServerCallHandler rpcInvoke tests', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    _handler.singleton('compteur', sample.Compteur);
    _handler.singleton('chatroom', sample.Chatroom);
    _handler.stateless('dateutil', sample.DateUtil);

    describe('rpcInvoke: on singleton', function () {
        it('call rpcInvoke: increment on singleton object', function () {
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
        it('call rpcInvoke: increment on stateless object', function () {
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

describe('WSRpcServerCallHandler broadcastRpcInvoke tests', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    describe('broadcastRpcInvoke', function () {
        it('broadcast Rpc request  x 2', function () {
            mockClient.callCount = 0;
            _handler.broadcastRpcInvoke(mockServer, mockClient, null, 'compteur', 'increment', null, 'INC');

            assert.equal(2, mockClient.callCount);
            assert.equal(mockClient, _handler.getClientResponseWithId('INC'));

            _handler.broadcastRpcInvoke(mockServer, mockClient, 'compteur_increment', null, null, null, 'INC');

            assert.equal(4, mockClient.callCount);
            assert.equal(mockClient, _handler.getClientResponseWithId('INC'));
        })
    });
});

describe('WSRpcServerCallHandler sendResponseToOrigin tests', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    describe('sendResponseToOrigin', function () {
        it('send response json to the corresponding client', function () {
            mockClient.callCount = 0;
            _handler.broadcastRpcInvoke(mockServer, mockClient, null, 'compteur', 'increment', null, 'INC_1');

            assert.equal(2, mockClient.callCount);

            mockClient.callCount = 0;
            var message = '{"jsonrpc":"2.0","result":100,"id":"INC_1"}';
            var rpc = new jrpc.RpcMessage(JSON.parse(message));
            _handler.sendResponseToOrigin(rpc.getId(), rpc.getResult());

            assert.equal(1, mockClient.callCount);
            assert.equal(100, mockClient.result());
            assert.equal(mockClient, _handler.getClientResponseWithId('INC_1'));
        })
    });
});

describe('WSRpcServerCallHandler sendErrorToOrigin tests', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    describe('send error json to the corresponding client', function () {
        it('call sendErrorToOrigin', function () {
            mockClient.callCount = 0;
            _handler.broadcastRpcInvoke(mockServer, mockClient, null, 'compteur', 'incrementation', null, 'INC_2');
            assert.equal(2, mockClient.callCount);

            mockClient.callCount = 0;
            var message = '{"jsonrpc":"2.0","error":{"code":-32601,"message":"RPC client instance named null not found."},"id":"INC_2"}';
            var rpc = new jrpc.RpcMessage(JSON.parse(message));
            _handler.sendErrorToOrigin(rpc.getId(), rpc.getCode(), rpc.getErrorMessage());

            assert.equal(1, mockClient.callCount);
            assert.equal(-32601, mockClient.error().code);
            assert.equal(mockClient, _handler.getClientResponseWithId('INC_2'));
        })
    });
});

describe('WSRpcServerCallHandler useResponse tests', function () {

    var _handler = new wsrpcBackend.WSRpcServerCallHandler();

    describe('fire response to eventBus', function () {
        it('call useResponse', function () {
            var done = false;
            var data = null;
            var eventBus = bus.EventBus.getSharedEventBus();
            eventBus.on('INC_3', function(x) {
                done = true;
                data = x;
            });

            _handler.useResponse('INC_3', { RESULT: 'DONE' });

            assert.equal(true, done);
            assert.equal('DONE', data.RESULT);
        })
    });
});