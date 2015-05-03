console.log('WSRpc test');

var assert = require('assert');
var after = require('after');

var lg3x = require('../dist/WSRpc').lg3x;
lg3x.DEBUG = true;

suite('WSRpc');

test('WSRpc connect', function(done) {
    done = after(1, done);
    var wsrpc = new lg3x.WSRpc('ws://localhost:3000');
    wsrpc.connect();
    setTimeout(function() {
        wsrpc.close();
        done();
    }, 1000);
});

test('WSRpc request REPEAT_MY_NAME', function(done) {
    done = after(3, done);
    var wsrpc = new lg3x.WSRpc('ws://localhost:3000');
    wsrpc.connect();

    wsrpc.onResponse('REPEAT_MY_NAME',
        function (json) {
            console.log('check name "john doe" equal ' + json.name);
            assert.equal(json.name, 'john doe');
            done();
        }
    );
    setTimeout(function() {
        wsrpc.doRequest('REPEAT_MY_NAME',
            JSON.parse('{"name": "john doe"}'));
        done();
    }, 500);

    setTimeout(function() {
        wsrpc.close();
        done();
    }, 1000);
});

test('WSRpc request REPEAT_THE_DATE', function(done) {
    done = after(2, done);
    var wsrpc = new lg3x.WSRpc('ws://localhost:3000');
    wsrpc.connect();

    setTimeout(function() {
        var d = new Date().getTime();
        wsrpc.doRequest('REPEAT_THE_DATE',
            JSON.parse('{"date": "'+d+'"}'),
            function(json) {
                console.log('check date ' + d + ' equal ' + json.date);
                assert.equal(json.date, d);
                done();
            });
    }, 500);

    setTimeout(function() {
        wsrpc.close();
        done();
    }, 1000);
});

test('WSRpc invoke METHOD 1', function(done) {
    done = after(3, done);
    var wsrpc = new lg3x.WSRpc('ws://localhost:3000');
    wsrpc.connect();

    setTimeout(function() {
        wsrpc.on('HELLO WORLD',
            function (json) {
                console.log('HELLO WORLD return = ' + json.message);
                assert.equal(json.message, 'Hello world!');
                done();
            }
        );

        wsrpc.call('HELLO WORLD')
            .method('remoteObject.sayHello')
            .withParams(JSON.parse('{"who": "world"}'))
            .now();
        done();
    }, 500);

    setTimeout(function() {
        wsrpc.close();
        done();
    }, 1000);
});

test('WSRpc invoke METHOD 2', function(done) {
    done = after(2, done);
    var wsrpc = new lg3x.WSRpc('ws://localhost:3000');
    wsrpc.connect();

    setTimeout(function() {
        wsrpc.call()
            .method('remoteObject.sayHelloAll')
            .withParams(JSON.parse('{"who": "world"}'))
            .then(function (json) {
                console.log('HELLO ALL WORLD return = ' + json.message);
                assert.equal(json.message, 'Hello all the world!');
                done();
            }
        );
    }, 500);

    setTimeout(function() {
        wsrpc.close();
        done();
    }, 1000);
});

