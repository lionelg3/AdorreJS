console.log('RPC test');

var assert = require('assert');

var jrpc = require('../dist/JsonRpc');

suite('RpcMessage');

test('Building empty JSon Rpc Request', function() {
	var req1 = jrpc.RPC.Request('id1', 'action1', null);
	var req2 = jrpc.RPC.Request('id2', 'action2');
	assert.equal(req1.jsonrpc, jrpc.RPC.VERSION);
	assert.equal(req1.id, 'id1');
	assert.equal(req1.method, 'action1');
	assert.equal(req1.params, null);
    assert.equal(req2.jsonrpc, jrpc.RPC.VERSION);
	assert.equal(req2.id, 'id2');
    assert.equal(req2.method, 'action2');
    assert.equal(req2.params, null);
});

test('Building non-empty JSon Rpc Request', function() {
	var req1 = jrpc.RPC.Request(
        'id1',
        'action1',
        JSON.parse('{"name": "john doe","mail": "john.doe@gmail.com"}')
    );
	assert.equal(req1.jsonrpc, jrpc.RPC.VERSION);
	assert.equal(req1.id, 'id1');
	assert.equal(req1.method, 'action1');
	assert.equal(req1.params.name, 'john doe');
	assert.equal(req1.params.mail, 'john.doe@gmail.com');
});

test('Building empty JSon Rpc Response', function() {
    var req1 = jrpc.RPC.Response('id1');
    var req2 = jrpc.RPC.Response('id2', null);
    assert.equal(req1.jsonrpc, jrpc.RPC.VERSION);
    assert.equal(req1.id, 'id1');
    assert.equal(req1.result, null);
    assert.equal(req2.jsonrpc, jrpc.RPC.VERSION);
    assert.equal(req2.id, 'id2');
    assert.equal(req2.result, null);
});

test('Building non-empty JSon Rpc Response', function() {
    var req1 = jrpc.RPC.Response('id1',
        JSON.parse('{"name": "john doe","mail": "john.doe@gmail.com"}')
    );
    assert.equal(req1.jsonrpc, jrpc.RPC.VERSION);
    assert.equal(req1.id, 'id1');
    assert.equal(req1.result.name, 'john doe');
    assert.equal(req1.result.mail, 'john.doe@gmail.com');
});

test('Building error JSon Rpc', function() {
    var err1 = jrpc.RPC.Error('id1',
        jrpc.RPC.PARSE_ERROR,
        'Parse error message'
    );
    assert.equal(err1.jsonrpc, jrpc.RPC.VERSION);
    assert.equal(err1.id, 'id1');
    assert.equal(err1.error.code, -32700);
    assert.equal(err1.error.message, 'Parse error message');
});

test('Parse JSon Rpc Request', function() {
    var req1 = JSON.parse('{"jsonrpc":"2.0","method":"remoteObject.sayHello","params":{"who":"world"},"id":"remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863"}');
    var req2 = JSON.parse('{"jsonrpc":"2.0","method":"{broadcast}remoteObject.sayHelloAll","params":{"who":"all the world"},"id":"remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863"}');
    var req3 = JSON.parse('{"jsonrpc":"2.0","method":"remoteObject_sayHello","params":{"who":"world"},"id":"remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863"}');
    var req4 = JSON.parse('{"jsonrpc":"2.0","method":"{broadcast}remoteObject_sayHelloAll","params":{"who":"all the world"},"id":"remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863"}');

    var msg1 = new jrpc.RpcMessage(req1);
    assert.equal(msg1.getMethod(), 'sayHello');
    assert.equal(msg1.getInstance(), 'remoteObject');
    assert.equal(msg1.getParams().who, 'world');
    assert.equal(msg1.getId(), 'remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(msg1.isRequest(), true);
    assert.equal(msg1.isResponse(), false);
    assert.equal(msg1.isBroadcast(), false);
    assert.equal(msg1.isError(), false);

    var msg2 = new jrpc.RpcMessage(req2);
    assert.equal(msg2.getMethod(), 'sayHelloAll');
    assert.equal(msg2.getInstance(), 'remoteObject');
    assert.equal(msg2.getParams().who, 'all the world');
    assert.equal(msg2.getId(), 'remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(msg2.isRequest(), true);
    assert.equal(msg2.isResponse(), false);
    assert.equal(msg2.isBroadcast(), true);
    assert.equal(msg2.isError(), false);

    var msg3 = new jrpc.RpcMessage(req3);
    assert.equal(msg3.getAction(), 'remoteObject_sayHello');
    assert.equal(msg3.getParams().who, 'world');
    assert.equal(msg3.getId(), 'remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(msg3.isRequest(), true);
    assert.equal(msg3.isResponse(), false);
    assert.equal(msg3.isBroadcast(), false);
    assert.equal(msg3.isError(), false);

    var msg4 = new jrpc.RpcMessage(req4);
    assert.equal(msg4.getAction(), 'remoteObject_sayHelloAll');
    assert.equal(msg4.getParams().who, 'all the world');
    assert.equal(msg4.getId(), 'remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(msg4.isRequest(), true);
    assert.equal(msg4.isResponse(), false);
    assert.equal(msg4.isBroadcast(), true);
    assert.equal(msg4.isError(), false);
});

test('Parse JSon Rpc Response', function() {
    var resp1 = JSON.parse('{"jsonrpc":"2.0","result":{"message":"Hello all the world!"},"id":"remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883"}');

    var msg1 = new jrpc.RpcMessage(resp1);
    assert.equal(msg1.getResult().message, 'Hello all the world!');
    assert.equal(msg1.getId(), 'remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883');
    assert.equal(msg1.isRequest(), false);
    assert.equal(msg1.isResponse(), true);
    assert.equal(msg1.isBroadcast(), false);
    assert.equal(msg1.isError(), false);

    var resp2 = JSON.parse('{"jsonrpc":"2.0","result":null,"id":"INC"}');

    var msg2 = new jrpc.RpcMessage(resp2);
    assert.equal(msg2.getResult(), null);
    assert.equal(msg2.getId(), 'INC');
    assert.equal(msg2.isRequest(), false);
    assert.equal(msg2.isResponse(), true);
    assert.equal(msg2.isBroadcast(), false);
    assert.equal(msg2.isError(), false);
});

test('Parse JSon Rpc Error', function() {
    var error = JSON.parse('{"jsonrpc":"2.0","error":{"code":-32700,"message":"Message erreur"},"id":"remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883"}');

    var msg = new jrpc.RpcMessage(error);
    assert.equal(msg.getCode(), -32700);
    assert.equal(msg.getErrorMessage(), 'Message erreur');
    assert.equal(msg.getId(), 'remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883');
    assert.equal(msg.isRequest(), false);
    assert.equal(msg.isResponse(), false);
    assert.equal(msg.isBroadcast(), false);
    assert.equal(msg.isError(), true);
});