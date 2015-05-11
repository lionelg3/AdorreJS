console.log('WSRpc client and backend test');

var assert = require('assert');
var after = require('after');

var wsrpc = require('../dist/WSRpc');
var sample = require('./extra/wsrpc_registry_classes').wsrpc_registry_classes;

wsrpc.DEBUG = true;
var PORT = 3001;

suite('WSRpc Client Backend');


test('Clients connect', function(done) {
    done = after(1, done);
    var client1 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    var client2 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    client1.connect();
    client2.connect();
    setTimeout(function() {
        client1.close();
        client2.close();
        done();
    }, 1000);
});

test('Backend test 1 : rpcInvoke', function(done) {
    done = after(3, done);
    var client1 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    client1.connect();

    setTimeout(function() {
        client1.call()
            .method('compteur.increment')
            .withParams()
            .then(function(json) {
                console.log('Reponse 1 ok');
                done();
            });
        done();
    }, 100);

    setTimeout(function() {
        client1.close();
        done();
    }, 1000);
});

test('Backend test 2 : broadcastRpcInvoke, useResponse and sendResponseToOrigin', function(done) {
    done = after(5, done);
    var client1 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    var client2 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    var clientHour = -2;
    var serverHour = -3;
    client1.connect();
    client2.connect();

    client2.stateless('dateutil', sample.DateUtil);

    setTimeout(function() {
        client1.call()
            .method('dateutil.getHour')
            .withParams()
            .then(function(json) {
                console.log('Server reponse = ' + JSON.stringify(json));
                serverHour = JSON.stringify(json);
                done();
            });
        done();
    }, 200);

    setTimeout(function() {
        client1.call()
            .method('dateutil.getHour')
            .withParams()
            .broadcast()
            .then(function(json) {
                console.log('Broadcasted reponse = ' + JSON.stringify(json));
                clientHour = JSON.stringify(json);
                done();
            });
        done();
    }, 500);

    setTimeout(function() {
        assert.equal(clientHour, serverHour);
        client1.close();
        client2.close();
        done();
    }, 1000);
});

test('Backend test 3 : broadcastRpcInvoke, receiveClientError and sendErrorToOrigin', function(done) {
    done = after(3, done);
    var client1 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    var client2 = new wsrpc.WSRpc('ws://localhost:' + PORT);
    client1.connect();
    client2.connect();

    client2.stateless('dateutil', sample.DateUtil);

    client1.on('Error', function(err) {
        console.log('Error ' + JSON.stringify(err));
        done();
    });

    setTimeout(function() {
        client1.call()
            .method('dateutil.getHOUR')
            .withParams()
            .then(function(json) {
                console.log('Server reponse = ' + JSON.stringify(json));
            });/*
            .otherwise(function(err) {
                console.log('Server err = ' + JSON.stringify(err));
                //done();
            });*/
        done();
    }, 200);

    setTimeout(function() {
        client1.close();
        client2.close();
        done();
    }, 1000);
});

