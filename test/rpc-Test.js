console.log('RPC test');

var assert = require('assert');

var lg3x = require('../dist/WSRpc').lg3x;
lg3x.DEBUG = true;

suite('RPC');

test('Building empty JSon Rpc Request', function() {
	var req1 = lg3x.RPC.Request('id1', 'action1', null);
	var req2 = lg3x.RPC.Request('id2', 'action2');
	assert.equal(req1.jsonrpc, lg3x.RPC.VERSION);
	assert.equal(req1.id, 'id1');
	assert.equal(req1.method, 'action1');
	assert.equal(req1.params, null);
    assert.equal(req2.jsonrpc, lg3x.RPC.VERSION);
	assert.equal(req2.id, 'id2');
    assert.equal(req2.method, 'action2');
    assert.equal(req2.params, null);
});

test('Building non-empty JSon Rpc Request', function() {
	var req1 = lg3x.RPC.Request(
        'id1',
        'action1',
        JSON.parse('{"name": "john doe","mail": "john.doe@gmail.com"}')
    );
	assert.equal(req1.jsonrpc, lg3x.RPC.VERSION);
	assert.equal(req1.id, 'id1');
	assert.equal(req1.method, 'action1');
	assert.equal(req1.params.name, 'john doe');
	assert.equal(req1.params.mail, 'john.doe@gmail.com');
});

test('Building empty JSon Rpc Response', function() {
    var req1 = lg3x.RPC.Response('id1');
    var req2 = lg3x.RPC.Response('id2', null);
    assert.equal(req1.jsonrpc, lg3x.RPC.VERSION);
    assert.equal(req1.id, 'id1');
    assert.equal(req1.result, null);
    assert.equal(req2.jsonrpc, lg3x.RPC.VERSION);
    assert.equal(req2.id, 'id2');
    assert.equal(req2.result, null);
});

test('Building non-empty JSon Rpc Response', function() {
    var req1 = lg3x.RPC.Response('id1',
        JSON.parse('{"name": "john doe","mail": "john.doe@gmail.com"}')
    );
    assert.equal(req1.jsonrpc, lg3x.RPC.VERSION);
    assert.equal(req1.id, 'id1');
    assert.equal(req1.result.name, 'john doe');
    assert.equal(req1.result.mail, 'john.doe@gmail.com');
});

test('Building error JSon Rpc', function() {
    var err1 = lg3x.RPC.Error('id1',
        lg3x.RPC.PARSE_ERROR,
        'Parse error message'
    );
    assert.equal(err1.jsonrpc, lg3x.RPC.VERSION);
    assert.equal(err1.id, 'id1');
    assert.equal(err1.error.code, -32700);
    assert.equal(err1.error.message, 'Parse error message');
});

test('Parse JSon Rpc Request', function() {
    var req1 = JSON.parse('{"jsonrpc":"2.0","method":"remoteObject.sayHello","params":{"who":"world"},"id":"remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863"}');
    var req2 = JSON.parse('{"jsonrpc":"2.0","method":"{broadcast}remoteObject.sayHelloAll","params":{"who":"all the world"},"id":"remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863"}');

    var parser1 = new lg3x.RPCParser(req1);
    assert.equal(parser1.getMethod(), 'sayHello');
    assert.equal(parser1.getNamedInstance(), 'remoteObject');
    assert.equal(parser1.getParams().who, 'world');
    assert.equal(parser1.getId(), 'remoteObject.sayHello:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(parser1.isRequest(), true);
    assert.equal(parser1.isResponse(), false);
    assert.equal(parser1.isBroadcast(), false);
    assert.equal(parser1.isError(), false);

    var parser2 = new lg3x.RPCParser(req2);
    assert.equal(parser2.getMethod(), 'sayHelloAll');
    assert.equal(parser2.getNamedInstance(), 'remoteObject');
    assert.equal(parser2.getParams().who, 'all the world');
    assert.equal(parser2.getId(), 'remoteObject.sayHelloAll:9e9e3947-4d1b-448a-870d-a62e0846b863');
    assert.equal(parser2.isRequest(), true);
    assert.equal(parser2.isResponse(), false);
    assert.equal(parser2.isBroadcast(), true);
    assert.equal(parser2.isError(), false);
});

test('Parse JSon Rpc Response', function() {
    var resp = JSON.parse('{"jsonrpc":"2.0","result":{"message":"Hello all the world!"},"id":"remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883"}');

    var parser = new lg3x.RPCParser(resp);
    assert.equal(parser.getResult().message, 'Hello all the world!');
    assert.equal(parser.getId(), 'remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883');
    assert.equal(parser.isRequest(), false);
    assert.equal(parser.isResponse(), true);
    assert.equal(parser.isBroadcast(), false);
    assert.equal(parser.isError(), false);
});

test('Parse JSon Rpc Error', function() {
    var error = JSON.parse('{"jsonrpc":"2.0","error":{"code":-32700,"message":"Message erreur"},"id":"remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883"}');

    var parser = new lg3x.RPCParser(error);
    assert.equal(parser.getCode(), -32700);
    assert.equal(parser.getErrorMessage(), 'Message erreur');
    assert.equal(parser.getId(), 'remoteObject.sayHelloAll:6be5407c-f33f-4935-83d0-901052a96883');
    assert.equal(parser.isRequest(), false);
    assert.equal(parser.isResponse(), false);
    assert.equal(parser.isBroadcast(), false);
    assert.equal(parser.isError(), true);
});