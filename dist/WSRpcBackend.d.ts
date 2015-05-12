/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="WSRpc.d.ts" />
import ws = require('ws');
import rpc = require('./WSRpc');
export declare var DEBUG: boolean;
export declare module api {
    interface IWSRpcBackend {
        start(server: ws.Server): any;
        singleton(instanceName: string, classNames: any): any;
        stateless(instanceName: string, classNames: any): any;
        statefull(instanceName: string, classNames: any): any;
    }
}
export declare class WSRpcBackend implements api.IWSRpcBackend {
    private _server;
    private _handler;
    constructor();
    start(server: ws.Server): void;
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    statefull(instanceName: string, classNames: any): void;
    private _onClientConnect(client);
    private _onClientClose(client, code, message);
    private _onClientPingPongMessage(client, data, flags, ping);
    private _onClientError(client, err);
    private _onClientOpen(client);
    private _onServerError(err);
    private _onServerHeaders(headers);
    _onClientMessage(client: WebSocket, data: any, flags: {
        binary: boolean;
    }): void;
}
export declare class WSRpcServerCallHandler {
    private _singleton;
    private _stateless;
    private _names;
    private _eventBus;
    private _pendingRequest;
    constructor();
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    statefull(instanceName: string, classNames: any): void;
    getRegistry(instanceName: string): rpc.api.IRPCRegistry;
    rpcInvoke(client: WebSocket, instance: string, method: string, params: JSON, id: string): void;
    broadcastRpcInvoke(server: ws.Server, client: WebSocket, action: string, instance: string, method: string, params: JSON, id: string): void;
    sendResponseToOrigin(id: string, result: JSON): void;
    sendErrorToOrigin(id: string, code: number, message: string): void;
    useResponse(id: string, result: JSON): void;
    receiveClientError(rpc: rpc.RpcMessage): void;
    getClientResponseWithId(id: string): any;
}
