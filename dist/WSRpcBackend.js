var rpc = require('./WSRpc');
exports.DEBUG = false;
var WSRpcLogging = (function () {
    function WSRpcLogging() {
    }
    WSRpcLogging.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG) {
            console.log(args);
        }
    };
    WSRpcLogging.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.warn(args);
    };
    return WSRpcLogging;
})();
var WSRpcBackend = (function () {
    function WSRpcBackend() {
        this._handler = new WSRpcServerCallHandler();
    }
    WSRpcBackend.prototype.start = function (server) {
        var _this = this;
        this._server = server;
        this._server.on('error', function (err) {
            _this._onServerError(err);
        });
        this._server.on('headers', function (headers) {
            _this._onServerHeaders(headers);
        });
        this._server.on('connection', function (client) {
            _this._onClientConnect(client);
        });
    };
    WSRpcBackend.prototype.singleton = function (instanceName, classNames) {
        this._handler.singleton(instanceName, classNames);
    };
    WSRpcBackend.prototype.stateless = function (instanceName, classNames) {
        this._handler.stateless(instanceName, classNames);
    };
    WSRpcBackend.prototype.statefull = function (instanceName, classNames) {
        this._handler.statefull(instanceName, classNames);
    };
    WSRpcBackend.prototype._onClientConnect = function (client) {
        var _this = this;
        client.on('message', function (data, flags) {
            _this._onClientMessage(client, data, flags);
        });
        client.on('error', function (err) {
            _this._onClientError(client, err);
        });
        client.on('close', function (code, message) {
            _this._onClientClose(client, code, message);
        });
        client.on('ping', function (data, flags) {
            _this._onClientPingPongMessage(client, data, flags, true);
        });
        client.on('pong', function (data, flags) {
            _this._onClientPingPongMessage(client, data, flags, false);
        });
        client.on('open', function () {
            _this._onClientOpen(client);
        });
    };
    WSRpcBackend.prototype._onClientClose = function (client, code, message) {
        WSRpcLogging.log('Client close code ' + code + ", message " + message);
    };
    WSRpcBackend.prototype._onClientPingPongMessage = function (client, data, flags, ping) {
        WSRpcLogging.log('Ping Pong ' + data);
    };
    WSRpcBackend.prototype._onClientError = function (client, err) {
        WSRpcLogging.log('Client error ' + err);
    };
    WSRpcBackend.prototype._onClientOpen = function (client) {
        WSRpcLogging.log('Client open ');
    };
    WSRpcBackend.prototype._onServerError = function (err) {
        WSRpcLogging.log('Server err ' + err);
    };
    WSRpcBackend.prototype._onServerHeaders = function (headers) {
        WSRpcLogging.log('Server headers ');
        headers.forEach(function (h) {
            WSRpcLogging.log(h);
        });
    };
    WSRpcBackend.prototype._onClientMessage = function (client, data, flags) {
        WSRpcLogging.log('>> ' + data);
        try {
            var _rpc = new rpc.RpcMessage(JSON.parse(data));
            if (_rpc.isRequest() && _rpc.isBroadcast()) {
                this._handler.broadcastRpcInvoke(this._server, client, _rpc.getAction(), _rpc.getInstance(), _rpc.getMethod(), _rpc.getParams(), _rpc.getId());
            }
            else if (_rpc.isRequest()) {
                this._handler.rpcInvoke(client, _rpc.getInstance(), _rpc.getMethod(), _rpc.getParams(), _rpc.getId());
            }
            else if (_rpc.isResponse() && this._handler.getClientResponseWithId(_rpc.getId())) {
                this._handler.sendResponseToOrigin(_rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isResponse()) {
                this._handler.useResponse(_rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isError() && this._handler.getClientResponseWithId(_rpc.getId())) {
                this._handler.sendErrorToOrigin(_rpc.getId(), _rpc.getCode(), _rpc.getErrorMessage());
            }
            else if (_rpc.isError()) {
                this._handler.receiveClientError(_rpc);
            }
        }
        catch (err) {
            console.warn(err);
        }
    };
    return WSRpcBackend;
})();
exports.WSRpcBackend = WSRpcBackend;
var WSRpcServerCallHandler = (function () {
    function WSRpcServerCallHandler() {
        this._names = {};
        this._singleton = new rpc.ObjectRegistry();
        this._stateless = new rpc.ClassRegistry();
        this._pendingRequest = {};
        this._eventBus = rpc.EventBus.getSharedEventBus();
    }
    WSRpcServerCallHandler.prototype.singleton = function (instanceName, classNames) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    };
    WSRpcServerCallHandler.prototype.stateless = function (instanceName, classNames) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    };
    WSRpcServerCallHandler.prototype.statefull = function (instanceName, classNames) {
        console.warn('Session objects not implemented yet !');
    };
    WSRpcServerCallHandler.prototype.getRegistry = function (instanceName) {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    };
    WSRpcServerCallHandler.prototype.rpcInvoke = function (client, instance, method, params, id) {
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
                client.send(JSON.stringify(rpc.RPC.Response(id, result)));
            }
            catch (err) {
                console.warn('RPC server call "' + instance + '.' + method + '" fail.');
                WSRpcLogging.error('<< ' + JSON.stringify(rpc.RPC.Error('Error', rpc.RPC.INTERNAL_ERROR, 'RPC server call "' + instance + '.' + method + '" fail.')));
                client.send(JSON.stringify(rpc.RPC.Error('Error', rpc.RPC.INTERNAL_ERROR, 'RPC server call "' + instance + '.' + method + '" fail.')));
            }
        }
        else {
            client.send(JSON.stringify(rpc.RPC.Error(id, rpc.RPC.METHOD_NOT_FOUND, 'RPC server instance named ' + instance + ' not found.')));
        }
    };
    WSRpcServerCallHandler.prototype.broadcastRpcInvoke = function (server, client, action, instance, method, params, id) {
        if (id) {
            this._pendingRequest[id] = client;
        }
        var m = (action) ? action : instance + '.' + method;
        var newRpc = rpc.RPC.Request(id, m, params);
        server.clients.forEach(function (_client) {
            _client.send(JSON.stringify(newRpc));
        });
    };
    WSRpcServerCallHandler.prototype.sendResponseToOrigin = function (id, result) {
        if (id && this._pendingRequest[id]) {
            var newRpc = rpc.RPC.Response(id, result);
            var client = this._pendingRequest[id];
            client.send(JSON.stringify(newRpc));
        }
    };
    WSRpcServerCallHandler.prototype.sendErrorToOrigin = function (id, code, message) {
        if (id && this._pendingRequest[id]) {
            var newRpc = rpc.RPC.Error(id, code, message);
            var client = this._pendingRequest[id];
            client.send(JSON.stringify(newRpc));
        }
    };
    WSRpcServerCallHandler.prototype.useResponse = function (id, result) {
        this._eventBus.fire(id, result);
    };
    WSRpcServerCallHandler.prototype.receiveClientError = function (rpc) {
        WSRpcLogging.error('Get error : ' + JSON.stringify(rpc));
    };
    WSRpcServerCallHandler.prototype.getClientResponseWithId = function (id) {
        return this._pendingRequest[id];
    };
    return WSRpcServerCallHandler;
})();
exports.WSRpcServerCallHandler = WSRpcServerCallHandler;

//# sourceMappingURL=WSRpcBackend.js.map