var reg = require('./Registry');
var jrpc = require('./JsonRpc');
exports.DEBUG = false;
var FrontendCallHandler = (function () {
    function FrontendCallHandler() {
        this._names = {};
        this._singleton = new reg.ObjectRegistry();
        this._stateless = new reg.ClassRegistry();
    }
    FrontendCallHandler.prototype.singleton = function (instanceName, classNames) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    };
    FrontendCallHandler.prototype.stateless = function (instanceName, classNames) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    };
    FrontendCallHandler.prototype.getRegistry = function (instanceName) {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    };
    FrontendCallHandler.prototype.execute = function (client, instance, method, params, id) {
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
                console.warn('RPC frontend call "' + instance + '.' + method + '" fail.');
                FrontendCallHandler.log('>>FrontendCallHandler ' + JSON.stringify(jrpc.RPC.Error('Error', jrpc.RPC.INTERNAL_ERROR, 'RPC frontend call "' + instance + '.' + method + '" fail.')));
                client.send(JSON.stringify(jrpc.RPC.Error('Error:' + id, jrpc.RPC.INTERNAL_ERROR, 'RPC frontend call "' + instance + '.' + method + '" fail.')));
            }
        }
        else {
            console.warn('RPC frontend instance named ' + instance + ' not  found.');
            client.send(JSON.stringify(jrpc.RPC.Error('Error:' + id, jrpc.RPC.METHOD_NOT_FOUND, 'RPC frontend instance named ' + instance + ' not' + ' found.')));
        }
    };
    FrontendCallHandler.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (exports.DEBUG) {
            console.debug.apply(console, args);
        }
    };
    return FrontendCallHandler;
})();
exports.FrontendCallHandler = FrontendCallHandler;

//# sourceMappingURL=FrontendCallHandler.js.map