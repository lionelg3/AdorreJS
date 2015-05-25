var uuid = require('./UUIDGenerator');
var jrpc = require('./JsonRpc');
var evt = require('./EventBus');
var handler = require('./FrontendCallHandler');
exports.DEBUG = false;
var WSRpcFrontend = (function () {
    function WSRpcFrontend() {
        this._ws = null;
        this._handler = new handler.FrontendCallHandler();
    }
    WSRpcFrontend.prototype.link = function (ws) {
        var _this = this;
        this._ws = ws;
        if (this._ws) {
            this._ws.onmessage = function (event) {
                WSRpcFrontend.log('WSRpcFrontend onmessage ' + event.data);
                var rpc = JSON.parse(event.data);
                var message = new jrpc.RPC(rpc);
                if (message.isRequest()) {
                    _this._handler.execute(_this._ws, message.getInstance(), message.getMethod(), message.getParams(), message.getId());
                }
                else {
                    evt.EventBus.getSharedEventBus().fire(rpc.id, (rpc.result) ? rpc.result : rpc.error);
                }
            };
        }
        else {
            throw 'ERR WSRpcFrontend WRC_001: Can not link without WebSocket connection.';
        }
    };
    WSRpcFrontend.prototype.call = function (name, method, then, otherwise) {
        var call = new WSRpcFrontendCall();
        call.ws = this._ws;
        call.clazz = name;
        call.method = method;
        call.id = name + '.' + method + '/' + uuid.UUIDGenerator.generateUUID();
        var eventBus = evt.EventBus.getSharedEventBus();
        if (then) {
            eventBus.on(call.id, then);
        }
        if (otherwise) {
            eventBus.on('Error:' + call.id, otherwise);
        }
        return call;
    };
    WSRpcFrontend.prototype.singleton = function (instanceName, classNames) {
        this._handler.singleton(instanceName, classNames);
    };
    WSRpcFrontend.prototype.stateless = function (instanceName, classNames) {
        this._handler.stateless(instanceName, classNames);
    };
    WSRpcFrontend.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG)
            console.log(args);
    };
    return WSRpcFrontend;
})();
exports.WSRpcFrontend = WSRpcFrontend;
var WSRpcFrontendCall = (function () {
    function WSRpcFrontendCall() {
        this.ws = null;
        this.id = null;
        this.clazz = null;
        this.method = null;
    }
    WSRpcFrontendCall.prototype.fire = function (data) {
        var _rpc = jrpc.RPC.Request(this.id, this.clazz + '.' + this.method, data);
        if (this.ws) {
            WSRpcFrontend.log('>>WSRpcFrontend ' + JSON.stringify(_rpc));
            this.ws.send(JSON.stringify(_rpc));
        }
        else {
            throw 'ERR WSRpcFrontend WRC_002: Can not send without WebSocket connection.';
        }
    };
    WSRpcFrontendCall.prototype.broadcast = function (data) {
        this.clazz = '{broadcast}' + this.clazz;
        this.fire(data);
    };
    return WSRpcFrontendCall;
})();

//# sourceMappingURL=WSRpcFrontend.js.map