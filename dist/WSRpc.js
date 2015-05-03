var lg3x;
(function (lg3x) {
    lg3x.DEBUG = false;
    var UUIDGenerator = (function () {
        function UUIDGenerator() {
        }
        UUIDGenerator.generateUUID = function () {
            var d = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        };
        return UUIDGenerator;
    })();
    lg3x.UUIDGenerator = UUIDGenerator;
    var EventBus = (function () {
        function EventBus() {
            this.listeners = {};
            if (EventBus._instance) {
                throw new Error('Instantiate EventBus error.');
            }
            EventBus._instance = this;
        }
        EventBus.getSharedEventBus = function () {
            if (EventBus._instance === null) {
                EventBus._instance = new EventBus();
            }
            return EventBus._instance;
        };
        EventBus.prototype.on = function (eventId, callback) {
            if (!this.listeners[eventId]) {
                this.listeners[eventId] = [callback];
                return;
            }
            this.listeners[eventId].push(callback);
        };
        EventBus.prototype.fire = function (eventId, data) {
            for (var x in this.listeners[eventId]) {
                var method = this.listeners[eventId][x];
                if (method) {
                    setTimeout(method(data));
                }
            }
        };
        EventBus.prototype.remove = function (eventId, callback) {
            if (this.listeners[eventId]) {
                var len = this.listeners[eventId].length;
                var newcallbacks = [function (data) {
                }];
                for (var x = 0; x < len; x++) {
                    var _callback = this.listeners[eventId][x];
                    if (_callback === callback) {
                    }
                    else {
                        newcallbacks.push(_callback);
                    }
                }
                this.listeners[eventId] = newcallbacks;
            }
        };
        EventBus._instance = null;
        return EventBus;
    })();
    lg3x.EventBus = EventBus;
    var RPCParser = (function () {
        function RPCParser(rpc) {
            if (rpc.jsonrpc !== '2.0') {
                throw 'RPC Method Parser Error';
            }
            this._id = rpc.id;
            this._broadcast = false;
            if (rpc.error) {
                this._code = rpc.error.code;
                this._message = rpc.error.message;
            }
            else if (rpc.result) {
                this._result = rpc.result;
            }
            else {
                this._params = rpc.params;
                var t = rpc.method.split('.');
                this._namedMethod = t[t.length - 1];
                this._namedInstance = null;
                if (t[0].split('}')[0] === '{broadcast') {
                    this._broadcast = true;
                    this._namedInstance = t[0].split('}')[1];
                }
                else {
                    this._namedInstance = t[0];
                }
            }
        }
        RPCParser.prototype.isError = function () {
            return (this._code !== undefined);
        };
        RPCParser.prototype.isRequest = function () {
            return (this._namedMethod !== undefined);
        };
        RPCParser.prototype.isResponse = function () {
            return (this._result != undefined);
        };
        RPCParser.prototype.getCode = function () {
            return this._code;
        };
        RPCParser.prototype.getErrorMessage = function () {
            return this._message;
        };
        RPCParser.prototype.getResult = function () {
            return this._result;
        };
        RPCParser.prototype.getParams = function () {
            return this._params;
        };
        RPCParser.prototype.isBroadcast = function () {
            return this._broadcast;
        };
        RPCParser.prototype.getMethod = function () {
            return this._namedMethod;
        };
        RPCParser.prototype.getNamedInstance = function () {
            return this._namedInstance;
        };
        RPCParser.prototype.getId = function () {
            return this._id;
        };
        return RPCParser;
    })();
    lg3x.RPCParser = RPCParser;
    var RPCRegistry = (function () {
        function RPCRegistry() {
            this._instances = {};
        }
        RPCRegistry.prototype.add = function (name, instance) {
            this._instances[name] = instance;
        };
        RPCRegistry.prototype.invoke = function (namedInstance, namedMethod, params) {
            try {
                var instance = this._instances[namedInstance];
                return instance[namedMethod](params);
            }
            catch (err) {
                var msg = 'RPCRegistry invoke fail on ' + namedInstance + '.' + namedMethod;
                msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
                throw (msg);
            }
        };
        return RPCRegistry;
    })();
    lg3x.RPCRegistry = RPCRegistry;
    var RPC = (function () {
        function RPC() {
        }
        RPC.Response = function (id, result) {
            return {
                'jsonrpc': RPC.VERSION,
                'result': (result) ? result : null,
                'id': (id) ? id : null
            };
        };
        RPC.Request = function (id, method, data) {
            return {
                'jsonrpc': RPC.VERSION,
                'method': method,
                'params': data,
                'id': (id) ? id : null
            };
        };
        RPC.Error = function (id, code, message) {
            return {
                'jsonrpc': RPC.VERSION,
                'error': {
                    'code': code,
                    'message': message
                },
                'id': (id) ? id : null
            };
        };
        RPC.VERSION = '2.0';
        RPC.PARSE_ERROR = -32700;
        RPC.INVALID_REQUEST = -32600;
        RPC.METHOD_NOT_FOUND = -32601;
        RPC.INVALID_PARAMS = -32602;
        RPC.INTERNAL_ERROR = -32603;
        return RPC;
    })();
    lg3x.RPC = RPC;
    var WSRpcContext = (function () {
        function WSRpcContext() {
        }
        return WSRpcContext;
    })();
    lg3x.WSRpcContext = WSRpcContext;
    var WSRpcLogging = (function () {
        function WSRpcLogging() {
        }
        WSRpcLogging.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (lg3x.DEBUG) {
                console.debug.apply(console, args);
            }
        };
        return WSRpcLogging;
    })();
    lg3x.WSRpcLogging = WSRpcLogging;
    var WSRpcInvoke = (function () {
        function WSRpcInvoke(context) {
            this._context = context;
        }
        WSRpcInvoke.prototype.method = function (method) {
            this._context.method = method;
            return new WSRpcMethod(this._context);
        };
        return WSRpcInvoke;
    })();
    lg3x.WSRpcInvoke = WSRpcInvoke;
    var WSRpcMethod = (function () {
        function WSRpcMethod(context) {
            this._context = context;
        }
        WSRpcMethod.prototype.withParams = function (params) {
            this._context.data = params;
            return new WSRpcMethodRequest(this._context);
        };
        return WSRpcMethod;
    })();
    lg3x.WSRpcMethod = WSRpcMethod;
    var WSRpcMethodRequest = (function () {
        function WSRpcMethodRequest(context) {
            this._context = context;
        }
        WSRpcMethodRequest.prototype.broadcast = function () {
            this._context.broadcast = true;
            return this;
        };
        WSRpcMethodRequest.prototype.now = function () {
            var _rpc = RPC.Request(this._context.id, this._context.method, this._context.data);
            if (this._context.ws) {
                WSRpcLogging.log('WSRpc', 'now', this._context.ws.url, JSON.stringify(_rpc));
                return this._context.ws.send(JSON.stringify(_rpc));
            }
            else {
                throw 'WS send error: connection may be closed';
            }
        };
        WSRpcMethodRequest.prototype.then = function () {
            var callbacks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                callbacks[_i - 0] = arguments[_i];
            }
            this._context.id = this._context.method + ':' + UUIDGenerator.generateUUID();
            if (callbacks && callbacks.length > 0) {
                var eventBus = EventBus.getSharedEventBus();
                for (var x = 0; x < callbacks.length; x++) {
                    eventBus.on(this._context.id, callbacks[x]);
                }
            }
            this.now();
        };
        return WSRpcMethodRequest;
    })();
    lg3x.WSRpcMethodRequest = WSRpcMethodRequest;
    var WSRpc = (function () {
        function WSRpc(url) {
            this._url = url;
        }
        WSRpc.prototype.connect = function () {
            var _this = this;
            WSRpcLogging.log('WSRpc', 'connecting ...', this._url);
            this._ws = new WebSocket(this._url, ['jsonrpc_2.0_over_websocket']);
            if (this._onConnectCallback) {
                setTimeout(this._onConnectCallback(), 0);
            }
            this._ws.onopen = function (event) {
                WSRpcLogging.log('WSRpc', 'onOpen', _this._url);
                if (_this._onOpenCallback) {
                    setTimeout(_this._onOpenCallback(event), 0);
                }
            };
            this._ws.onclose = function (event) {
                WSRpcLogging.log('WSRpc', 'onclose', _this._url);
                if (_this._onCloseCallback) {
                    setTimeout(_this._onCloseCallback(event), 0);
                }
            };
            this._ws.onmessage = function (event) {
                WSRpcLogging.log('WSRpc', 'onmessage', _this._url, event.data);
                var rpc = JSON.parse(event.data);
                if (rpc.jsonrpc && rpc.jsonrpc === RPC.VERSION && rpc.id) {
                    EventBus.getSharedEventBus().fire(rpc.id, rpc.result);
                }
            };
            this._ws.onerror = function (event) {
                WSRpcLogging.log('WSRpc', 'onerror', _this._url, event);
                if (_this._onErrorCallback) {
                    setTimeout(_this._onErrorCallback(event), 0);
                }
            };
        };
        WSRpc.prototype.close = function () {
            if (this._ws) {
                this._ws.close();
                this._ws = null;
                return true;
            }
            return false;
        };
        WSRpc.prototype.onOpen = function (callback) {
            this._onOpenCallback = callback;
        };
        WSRpc.prototype.onClose = function (callback) {
            this._onCloseCallback = callback;
        };
        WSRpc.prototype.onError = function (callback) {
            this._onErrorCallback = callback;
        };
        WSRpc.prototype.onConnect = function (callback) {
            this._onConnectCallback = callback;
        };
        WSRpc.prototype.call = function (about) {
            var wsCtx = new WSRpcContext();
            wsCtx.ws = this._ws;
            wsCtx.id = about;
            return new WSRpcInvoke(wsCtx);
        };
        WSRpc.prototype.on = function (about) {
            var callbacks = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                callbacks[_i - 1] = arguments[_i];
            }
            WSRpcLogging.log('Setting callback for', '"' + about + '"');
            if (callbacks && callbacks.length > 0) {
                var eventBus = EventBus.getSharedEventBus();
                for (var x = 0; x < callbacks.length; x++) {
                    eventBus.on(about, callbacks[x]);
                }
            }
        };
        WSRpc.prototype.doRequest = function (action, data) {
            var callbacks = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                callbacks[_i - 2] = arguments[_i];
            }
            var _rpc = null;
            if (callbacks && callbacks.length > 0) {
                var _uuid = action + ':' + UUIDGenerator.generateUUID();
                var eventBus = EventBus.getSharedEventBus();
                for (var x = 0; x < callbacks.length; x++) {
                    eventBus.on(_uuid, callbacks[x]);
                }
                _rpc = RPC.Request(_uuid, action, data);
            }
            else {
                _rpc = RPC.Request(action, action, data);
            }
            if (this._ws) {
                WSRpcLogging.log('WSRpc', 'send', this._ws.url, JSON.stringify(_rpc));
                return this._ws.send(JSON.stringify(_rpc));
            }
            else {
                throw 'WS send error: connection may be closed';
            }
        };
        WSRpc.prototype.onResponse = function (action) {
            var callbacks = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                callbacks[_i - 1] = arguments[_i];
            }
            if (callbacks && callbacks.length > 0) {
                var eventBus = EventBus.getSharedEventBus();
                for (var x = 0; x < callbacks.length; x++) {
                    eventBus.on(action, callbacks[x]);
                }
            }
        };
        return WSRpc;
    })();
    lg3x.WSRpc = WSRpc;
})(lg3x = exports.lg3x || (exports.lg3x = {}));

//# sourceMappingURL=WSRpc.js.map