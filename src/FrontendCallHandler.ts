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
		execute(client:WebSocket, rpc:jrpc.RPC);
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

    public execute(client:WebSocket, rpc:jrpc.RPC) {
        this.rpcInvoke(
            client,
            rpc.getInstance(),
            rpc.getMethod(),
            rpc.getParams(),
            rpc.getId()
        );
    }

    public rpcInvoke(client:WebSocket, instance:string, method:string, params:JSON, id:string) {
        if (this._names[instance]) {
            var registry:reg.api.IRPCRegistry = null;
            if (this._names[instance] === this._singleton) {
                FrontendCallHandler.log(':registry:_singleton');
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                FrontendCallHandler.log(':registry:_stateless');
                registry = this._stateless;
            }
            FrontendCallHandler.log(':invoke:' + instance + '.' + method + '(' + params + ') : ' + id);
            var result:JSON = registry.invoke(instance, method, params);
            FrontendCallHandler.log(':response:' + JSON.stringify(jrpc.RPC.Response(id, result)));
            client.send(JSON.stringify(jrpc.RPC.Response(id, result)));
        }
        else {
            client.send(
                JSON.stringify(
                    jrpc.RPC.Error(id, jrpc.RPC.METHOD_NOT_FOUND, 'RPC client instance named ' + instance + ' not' +
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
