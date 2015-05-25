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

//# sourceMappingURL=Registry.js.map