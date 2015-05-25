var jrpc = require('./JsonRpc');
var handler = require('./BackendCallHandler');
exports.DEBUG = false;
var WSRpcBackend = (function () {
    function WSRpcBackend() {
        this._handler = new handler.BackendCallHandler();
    }
    WSRpcBackend.prototype.link = function (server) {
        var _this = this;
        this._server = server;
        this._server.on('error', function (err) {
            WSRpcBackend.log('Server err ' + err);
        });
        this._server.on('headers', function (headers) {
            WSRpcBackend.log('Server headers ');
            headers.forEach(function (h) {
                WSRpcBackend.log(h);
            });
        });
        this._server.on('connection', function (client) {
            client.on('message', function (data, flags) {
                _this._onClientMessage(client, data, flags);
            });
            client.on('error', function (err) {
                WSRpcBackend.log('Client error ' + err);
            });
            client.on('close', function (code, message) {
                WSRpcBackend.log('Client close code ' + code + ", message " + message);
            });
            client.on('ping', function (data, flags) {
                WSRpcBackend.log('Ping ' + data);
            });
            client.on('pong', function (data, flags) {
                WSRpcBackend.log('Pong ' + data);
            });
            client.on('open', function () {
                WSRpcBackend.log('Client open ' + client);
            });
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
    WSRpcBackend.prototype._onClientMessage = function (client, data, flags) {
        WSRpcBackend.log('<<WSRpcBackend ' + data);
        try {
            var _rpc = new jrpc.RPC(JSON.parse(data));
            var _id = (_rpc.getId().split(':').length == 1) ? _rpc.getId() : _rpc.getId().split(':')[1];
            if (_rpc.isRequest() && _rpc.isBroadcast()) {
                WSRpcBackend.log('WSRpcBackend : broadcastExecute', _rpc.getId());
                this._handler.broadcastExecute(this._server, client, _rpc.getInstance(), _rpc.getMethod(), _rpc.getParams(), _rpc.getId());
            }
            else if (_rpc.isRequest()) {
                WSRpcBackend.log('WSRpcBackend : execute', _rpc.getId());
                this._handler.execute(client, _rpc.getInstance(), _rpc.getMethod(), _rpc.getParams(), _rpc.getId());
            }
            else if (_rpc.isResponse() && this._handler.getClientResponseWithId(_id)) {
                WSRpcBackend.log('WSRpcBackend : sendResponseToOrigin', _rpc.getId());
                var _client = this._handler.getClientResponseWithId(_id);
                this._handler.sendResponseToOrigin(_client, _rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isResponse()) {
                WSRpcBackend.log('WSRpcBackend : useResponse', _rpc.getId());
                this._handler.useResponse(_rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isError() && this._handler.getClientResponseWithId(_id)) {
                WSRpcBackend.log('WSRpcBackend : sendErrorToOrigin', _rpc.getId());
                var _client = this._handler.getClientResponseWithId(_id);
                this._handler.sendErrorToOrigin(_client, _rpc.getId(), _rpc.getCode(), _rpc.getErrorMessage());
            }
            else if (_rpc.isError()) {
                WSRpcBackend.log('WSRpcBackend : receiveClientError', _rpc.getId());
                this._handler.receiveClientError(_rpc);
            }
        }
        catch (err) {
            console.warn(err);
        }
    };
    WSRpcBackend.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG) {
            console.log(args);
        }
    };
    return WSRpcBackend;
})();
exports.WSRpcBackend = WSRpcBackend;

//# sourceMappingURL=WSRpcBackend.js.map