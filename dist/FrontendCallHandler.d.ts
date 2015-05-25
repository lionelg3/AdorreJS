/// <reference path="Registry.d.ts" />
/// <reference path="JsonRpc.d.ts" />
import reg = require('./Registry');
export declare var DEBUG: boolean;
export declare module api {
    interface IFrontendCallHandler {
        singleton(instanceName: string, classNames: any): any;
        stateless(instanceName: string, classNames: any): any;
        getRegistry(instanceName: string): reg.api.IRPCRegistry;
        execute(client: WebSocket, instance: string, method: string, params: JSON, id: string): any;
    }
}
export declare class FrontendCallHandler implements api.IFrontendCallHandler {
    private _singleton;
    private _stateless;
    private _names;
    constructor();
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    getRegistry(instanceName: string): reg.api.IRPCRegistry;
    execute(client: WebSocket, instance: string, method: string, params: JSON, id: string): void;
    static log(...args: any[]): void;
}
