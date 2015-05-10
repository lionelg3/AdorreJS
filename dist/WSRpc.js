exports.DEBUG = false;
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
exports.UUIDGenerator = UUIDGenerator;
var WSRpcClientCallHandler = (function () {
    function WSRpcClientCallHandler() {
        this._names = {};
        this._singleton = new ObjectRegistry();
        this._stateless = new ClassRegistry();
    }
    WSRpcClientCallHandler.prototype.singleton = function (instanceName, classNames) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    };
    WSRpcClientCallHandler.prototype.stateless = function (instanceName, classNames) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    };
    WSRpcClientCallHandler.prototype.getRegistry = function (instanceName) {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    };
    WSRpcClientCallHandler.prototype.execute = function (client, rpc) {
        this.rpcInvoke(client, rpc.getNamedInstance(), rpc.getMethod(), rpc.getParams(), rpc.getId());
    };
    WSRpcClientCallHandler.prototype.rpcInvoke = function (client, instance, method, params, id) {
        if (this._names[instance]) {
            var registry = null;
            if (this._names[instance] === this._singleton) {
                WSRpcLogging.log(':registry:_singleton');
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                WSRpcLogging.log(':registry:_stateless');
                registry = this._stateless;
            }
            WSRpcLogging.log(':invoke:' + instance + '.' + method + '(' + params + ') : ' + id);
            var result = registry.invoke(instance, method, params);
            WSRpcLogging.log(':response:' + JSON.stringify(RPC.Response(id, result)));
            client.send(JSON.stringify(RPC.Response(id, result)));
        }
        else {
            client.send(JSON.stringify(RPC.Error(id, RPC.METHOD_NOT_FOUND, 'RPC client instance named ' + instance + ' not found.')));
        }
    };
    return WSRpcClientCallHandler;
})();
exports.WSRpcClientCallHandler = WSRpcClientCallHandler;
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
exports.EventBus = EventBus;
var RpcMessage = (function () {
    function RpcMessage(rpc) {
        if (rpc.jsonrpc !== '2.0') {
            throw 'Json-RPC Message Error';
        }
        this._id = rpc.id;
        this._broadcast = false;
        if (rpc.error) {
            this._code = rpc.error.code;
            this._message = rpc.error.message;
        }
        else if (rpc.method) {
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
        else {
            this._result = rpc.result;
        }
    }
    RpcMessage.prototype.isError = function () {
        return (this._code !== undefined);
    };
    RpcMessage.prototype.isRequest = function () {
        return (this._namedMethod !== undefined);
    };
    RpcMessage.prototype.isResponse = function () {
        return (this._result !== undefined);
    };
    RpcMessage.prototype.getCode = function () {
        return this._code;
    };
    RpcMessage.prototype.getErrorMessage = function () {
        return this._message;
    };
    RpcMessage.prototype.getResult = function () {
        return this._result;
    };
    RpcMessage.prototype.getParams = function () {
        return this._params;
    };
    RpcMessage.prototype.isBroadcast = function () {
        return this._broadcast;
    };
    RpcMessage.prototype.getMethod = function () {
        return this._namedMethod;
    };
    RpcMessage.prototype.getNamedInstance = function () {
        return this._namedInstance;
    };
    RpcMessage.prototype.getId = function () {
        return this._id;
    };
    return RpcMessage;
})();
exports.RpcMessage = RpcMessage;
var ObjectRegistry = (function () {
    function ObjectRegistry() {
        this._objects = {};
    }
    ObjectRegistry.prototype.register = function (name, className) {
        this._objects[name] = new className();
    };
    ObjectRegistry.prototype.invoke = function (name, method, params) {
        try {
            var instance = this._objects[name];
            return instance[method](params);
        }
        catch (err) {
            var msg = 'ObjectRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    };
    ObjectRegistry.prototype.get = function (name) {
        return this._objects[name];
    };
    return ObjectRegistry;
})();
exports.ObjectRegistry = ObjectRegistry;
var ClassRegistry = (function () {
    function ClassRegistry() {
        this._classNames = {};
    }
    ClassRegistry.prototype.register = function (name, className) {
        this._classNames[name] = className;
    };
    ClassRegistry.prototype.invoke = function (name, method, params) {
        try {
            var instance = new this._classNames[name];
            return instance[method](params);
        }
        catch (err) {
            var msg = 'ClassRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    };
    ClassRegistry.prototype.get = function (name) {
        return this._classNames[name];
    };
    return ClassRegistry;
})();
exports.ClassRegistry = ClassRegistry;
var KeyRegistry = (function () {
    function KeyRegistry(key, registry) {
        this._objects = {};
        this._key = key;
        this._classRegistry = registry;
    }
    KeyRegistry.prototype.register = function (name, className) {
        throw 'Register method should not be use on KeyRegistry';
    };
    KeyRegistry.prototype.invoke = function (name, method, params) {
        try {
            var instance = this._objects[this._key + ':' + name];
            if (!instance) {
                var className = this._classRegistry.get(name);
                this._objects[this._key + ':' + name] = new className();
                instance = this._objects[this._key + ':' + name];
            }
            return instance[method](params);
        }
        catch (err) {
            var msg = 'KeyRegistry ' + this._key + ' invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    };
    KeyRegistry.prototype.key = function () {
        return this._key;
    };
    KeyRegistry.prototype.get = function (name) {
        return this._classRegistry.get(name);
    };
    return KeyRegistry;
})();
exports.KeyRegistry = KeyRegistry;
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
exports.RPC = RPC;
var WSRpcContext = (function () {
    function WSRpcContext() {
    }
    return WSRpcContext;
})();
exports.WSRpcContext = WSRpcContext;
var WSRpcLogging = (function () {
    function WSRpcLogging() {
    }
    WSRpcLogging.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG) {
            console.debug.apply(console, args);
        }
    };
    return WSRpcLogging;
})();
exports.WSRpcLogging = WSRpcLogging;
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
exports.WSRpcInvoke = WSRpcInvoke;
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
exports.WSRpcMethod = WSRpcMethod;
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
exports.WSRpcMethodRequest = WSRpcMethodRequest;
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
            var _rpcMessage = new RpcMessage(rpc);
            if (_rpcMessage.getId()) {
                EventBus.getSharedEventBus().fire(rpc.id, rpc.result);
            }
            if (_rpcMessage.isRequest()) {
                _this._handler.execute(_this._ws, _rpcMessage);
            }
        };
        this._ws.onerror = function (event) {
            WSRpcLogging.log('WSRpc', 'onerror', _this._url, event);
            if (_this._onErrorCallback) {
                setTimeout(_this._onErrorCallback(event), 0);
            }
        };
        this._handler = new WSRpcClientCallHandler();
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
    WSRpc.prototype.singleton = function (instanceName, classNames) {
        this._handler.singleton(instanceName, classNames);
    };
    WSRpc.prototype.stateless = function (instanceName, classNames) {
        this._handler.stateless(instanceName, classNames);
    };
    return WSRpc;
})();
exports.WSRpc = WSRpc;

//# sourceMappingURL=WSRpc.js.map