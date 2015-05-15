export module api {

    export interface IRPCRegistry {
        register(name: string, classname: any);
        invoke(name: string, method: string, params?: any): any;
        get(name: string): any;
    }
}

export class ObjectRegistry implements api.IRPCRegistry {
    private _objects: { [name: string]: Object } = {};
    constructor() {}

    register(name: string, className: any) {
        this._objects[name] = new className();
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = this._objects[name];
            return instance[method](params);
        } catch (err) {
            var msg: string = 'ObjectRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    get(name: string): any {
        return this._objects[name];
    }
}

export class ClassRegistry implements api.IRPCRegistry {
    private _classNames: { [name: string]: any } = {};
    constructor() {}

    register(name: string, className: any) {
        this._classNames[name] = className;
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = new this._classNames[name];
            return instance[method](params);
        } catch (err) {
            var msg: string = 'ClassRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    get(name: string): any {
        return this._classNames[name];
    }
}

export class KeyRegistry implements api.IRPCRegistry {
    private _key: string;
    private _classRegistry: ClassRegistry;
    private _objects: { [name: string]: Object } = {};
    constructor(key: string, registry: ClassRegistry) {
        this._key = key;
        this._classRegistry = registry;
    }

    register(name: string, className: any) {
        throw 'Register method should not be use on KeyRegistry';
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = this._objects[this._key + ':' + name];
            if (!instance) {
                var className = this._classRegistry.get(name);
                this._objects[this._key + ':' + name] = new className();
                instance = this._objects[this._key + ':' + name];
            }
            return instance[method](params);
        } catch (err) {
            var msg: string = 'KeyRegistry ' + this._key + ' invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    key() {
        return this._key;
    }

    get(name: string): any {
        return this._classRegistry.get(name);
    }
}