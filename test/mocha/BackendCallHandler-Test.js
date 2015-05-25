var assert = require("assert");

var bus = require('../../dist/EventBus');
var jrpc = require('../../dist/JsonRpc');
var handler = require('../../dist/BackendCallHandler');
var sample = require('../extra/wsrpc_registry_classes').wsrpc_registry_classes;

handler.DEBUG = true;

var mockClient = {
    callCount: 0,
    jsonRpcMessage: null,
    send: function(data) {
        this.callCount ++;
        //console.log('MOCK SEND ' + '(' + this.callCount + '), data = ' + data);
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

describe('BackendCallHandler execute tests', function () {

    var _handler = new handler.BackendCallHandler();

    _handler.singleton('compteur', sample.Compteur);
    _handler.singleton('chatroom', sample.Chatroom);
    _handler.stateless('dateutil', sample.DateUtil);

    describe('execute: on singleton', function () {
        it('call execute: increment on singleton object', function () {
            var registry = _handler.getRegistry('compteur');

            _handler.execute(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(1, mockClient.result());

            _handler.execute(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(2, mockClient.result());

            _handler.execute(mockClient, 'compteur', 'increment', null, 'INC');
            assert.equal(3, mockClient.result());

            var v = registry.invoke('compteur', 'increment', null);
            assert.equal(4, v);

            v = registry.invoke('compteur', 'increment', null);
            assert.equal(5, v);
        })
    });

    describe('execute: on stateless', function () {
        it('call execute: increment on stateless object', function () {
            var registry = _handler.getRegistry('dateutil');

            var h = registry.invoke('dateutil', 'getHour', null);

            _handler.execute(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());

            _handler.execute(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());

            _handler.execute(mockClient, 'dateutil', 'getHour', null, 'HOUR');
            assert.equal(h, mockClient.result());
        })
    });
});

describe('BackendCallHandler sendResponseToOrigin tests', function () {

    var _handler = new handler.BackendCallHandler();

    describe('sendResponseToOrigin', function () {
        it('send response json to the corresponding client', function () {
            mockClient.callCount = 0;
            _handler.broadcastExecute(mockServer, mockClient, 'compteur', 'increment', null, 'INC_1');

            assert.equal(2, mockClient.callCount);

            mockClient.callCount = 0;
            var message = '{"jsonrpc":"2.0","result":100,"id":"INC_1"}';
            var rpc = new jrpc.RPC(JSON.parse(message));
            var client = _handler.getClientResponseWithId(rpc.getId());
            _handler.sendResponseToOrigin(client, rpc.getId(), rpc.getResult());

            assert.equal(1, mockClient.callCount);
            assert.equal(100, mockClient.result());
            assert.equal(mockClient, _handler.getClientResponseWithId('INC_1'));
        })
    });
});

describe('BackendCallHandler sendErrorToOrigin tests', function () {

    var _handler = new handler.BackendCallHandler();

    describe('send error json to the corresponding client', function () {
        it('call sendErrorToOrigin', function () {
            mockClient.callCount = 0;
            _handler.broadcastExecute(mockServer, mockClient, 'compteur', 'incrementation', null, 'INC_2');
            assert.equal(2, mockClient.callCount);

            mockClient.callCount = 0;
            var message = '{"jsonrpc":"2.0","error":{"code":-32601,"message":"RPC client instance named null not found."},"id":"INC_2"}';
            var rpc = new jrpc.RPC(JSON.parse(message));
            var client = _handler.getClientResponseWithId(rpc.getId());
            _handler.sendErrorToOrigin(client, rpc.getId(), rpc.getCode(), rpc.getErrorMessage());

            assert.equal(1, mockClient.callCount);
            assert.equal(-32601, mockClient.error().code);
            assert.equal(mockClient, _handler.getClientResponseWithId('INC_2'));
        })
    });
});

describe('BackendCallHandler useResponse tests', function () {

    var _handler = new handler.BackendCallHandler();

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