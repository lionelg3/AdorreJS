/// <reference path="Registry.ts" />
/// <reference path="JsonRpc.ts" />
import reg = require('./Registry');
import jrpc = require('./JsonRpc');

export var DEBUG:boolean = false;

export module api {
	export interface IFrontendCallHandler {
		singleton(instanceName:string, classNames:any);
		stateless(instanceName:string, classNames:any);
		getRegistry(instanceName:string): reg.api.IRPCRegistry;

		execute(client:WebSocket, instance:string, method:string, params:JSON, id:string);
	}
}

export class FrontendCallHandler implements api.IFrontendCallHandler {

    private _singleton:reg.ObjectRegistry;
    private _stateless:reg.ClassRegistry;
    private _names:{ [name: string]: Object };

    constructor() {
        this._names = {};
        this._singleton = new reg.ObjectRegistry();
        this._stateless = new reg.ClassRegistry();
    }

    public singleton(instanceName:string, classNames:any) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    }

    public stateless(instanceName:string, classNames:any) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    }

    public getRegistry(instanceName:string):reg.api.IRPCRegistry {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    }

    public execute(client:WebSocket, instance:string, method:string, params:JSON, id:string) {
        if (this._names[instance]) {
            var registry:reg.api.IRPCRegistry = null;
            if (this._names[instance] === this._singleton) {
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                registry = this._stateless;
            }
            try {
                var result:JSON = registry.invoke(instance, method, params);
                client.send(JSON.stringify(jrpc.RPC.Response(id, result)));
            } catch (err) {
                console.warn('RPC frontend call "' + instance + '.' + method + '" fail.');
                FrontendCallHandler.log('>>FrontendCallHandler ' + JSON.stringify(jrpc.RPC.Error('Error', jrpc.RPC.INTERNAL_ERROR,
                        'RPC frontend call "' + instance + '.' + method + '" fail.')));
                client.send(JSON.stringify(jrpc.RPC.Error('Error:' + id, jrpc.RPC.INTERNAL_ERROR,
                    'RPC frontend call "' + instance + '.' + method + '" fail.')));
            }
        }
        else {
            client.send(
                JSON.stringify(
                    jrpc.RPC.Error('Error:' + id, jrpc.RPC.METHOD_NOT_FOUND, 'RPC frontend instance named ' + instance + ' not' +
                        ' found.')
                )
            );
        }
    }

    public static log(...args:any[]) {
        if (DEBUG) {
            console.debug.apply(console, args);
        }
    }
}
