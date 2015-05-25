var reg = require('./Registry');
var jrpc = require('./JsonRpc');
var bus = require('./EventBus');
exports.DEBUG = false;
var BackendCallHandler = (function () {
    function BackendCallHandler() {
        this._names = {};
        this._singleton = new reg.ObjectRegistry();
        this._stateless = new reg.ClassRegistry();
        this._pendingRequest = {};
        this._eventBus = bus.EventBus.getSharedEventBus();
    }
    BackendCallHandler.prototype.singleton = function (instanceName, classNames) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    };
    BackendCallHandler.prototype.stateless = function (instanceName, classNames) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    };
    BackendCallHandler.prototype.statefull = function (instanceName, classNames) {
        console.warn('Session objects not implemented yet !');
    };
    BackendCallHandler.prototype.getRegistry = function (instanceName) {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    };
    BackendCallHandler.prototype.execute = function (client, instance, method, params, id) {
        if (this._names[instance]) {
            var registry = null;
            if (this._names[instance] === this._singleton) {
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                registry = this._stateless;
            }
            try {
                var result = registry.invoke(instance, method, params);
                client.send(JSON.stringify(jrpc.RPC.Response(id, result)));
            }
            catch (err) {
                console.warn('RPC backend call "' + instance + '.' + method + '" fail.');
                BackendCallHandler.log('<<BackendCallHandler ' + JSON.stringify(jrpc.RPC.Error('Error', jrpc.RPC.INTERNAL_ERROR, 'RPC backend call "' + instance + '.' + method + '" fail.')));
                client.send(JSON.stringify(jrpc.RPC.Error('Error:' + id, jrpc.RPC.INTERNAL_ERROR, 'RPC backend call "' + instance + '.' + method + '" fail.')));
            }
        }
        else {
            console.warn('RPC backend instance named ' + instance + ' not  found.');
            client.send(JSON.stringify(jrpc.RPC.Error('Error:' + id, jrpc.RPC.METHOD_NOT_FOUND, 'RPC backend instance named ' + instance + ' not found.')));
        }
    };
    BackendCallHandler.prototype.broadcastExecute = function (server, client, instance, method, params, id) {
        this._pendingRequest[id] = client;
        var m = instance + '.' + method;
        var newRpc = jrpc.RPC.Request(id, m, params);
        server.clients.forEach(function (_client) {
            _client.send(JSON.stringify(newRpc));
        });
    };
    BackendCallHandler.prototype.sendResponseToOrigin = function (client, id, result) {
        if (id && client) {
            var newRpc = jrpc.RPC.Response(id, result);
            client.send(JSON.stringify(newRpc));
        }
    };
    BackendCallHandler.prototype.sendErrorToOrigin = function (client, id, code, message) {
        if (id && client) {
            var newRpc = jrpc.RPC.Error(id, code, message);
            client.send(JSON.stringify(newRpc));
        }
    };
    BackendCallHandler.prototype.useResponse = function (id, result) {
        this._eventBus.fire(id, result);
    };
    BackendCallHandler.prototype.receiveClientError = function (rpc) {
        BackendCallHandler.log('Get error : ' + JSON.stringify(rpc));
    };
    BackendCallHandler.prototype.getClientResponseWithId = function (id) {
        return this._pendingRequest[id];
    };
    BackendCallHandler.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG) {
            console.log(args);
        }
    };
    return BackendCallHandler;
})();
exports.BackendCallHandler = BackendCallHandler;

//# sourceMappingURL=BackendCallHandler.js.map