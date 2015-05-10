/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="WSRpc.ts" />

import ws = require('ws');
import rpc = require('./WSRpc');

export var DEBUG: boolean = false;

export module api {

    export interface IWSRpcBackend {
        start(server: ws.Server);
        singleton(instanceName: string, classNames: any);
        stateless(instanceName: string, classNames: any);
        statefull(instanceName: string, classNames: any);
    }
}

class WSRpcLogging {
    static log(...args: any[]) {
        if (DEBUG) {
            console.debug.apply(console, args);
        }
    }
}

export class WSRpcBackend implements api.IWSRpcBackend {

    private _server: ws.Server;
    private _handler: WSRpcServerCallHandler;

    constructor() {
        this._handler = new WSRpcServerCallHandler();
    }

    public start(server: ws.Server) {
        this._server = server;
        this._server.on('error', (err: Error) => {
                this._onServerError(err);
            }
        );

        this._server.on('headers', (headers: string[]) => {
                this._onServerHeaders(headers);
            }
        );

        this._server.on('connection', (client) => {
                this._onClientConnect(client);
            }
        );
    }

    public singleton(instanceName: string, classNames: any) {
        this._handler.singleton(instanceName, classNames);
    }

    public stateless(instanceName: string, classNames: any) {
        this._handler.stateless(instanceName, classNames);
    }

    public statefull(instanceName: string, classNames: any) {
        this._handler.statefull(instanceName, classNames);
    }

    private _onClientConnect(client: any) {
        client.on('message', (data: any, flags: {binary: boolean}) => {
                this._onClientMessage(client, data, flags);
            }
        );
        client.on('error', (err: Error) => {
                this._onClientError(client, err);
            }
        );
        client.on('close', (code: number, message: string) => {
                this._onClientClose(client, code, message);
            }
        );
        client.on('ping', (data: any, flags: {binary: boolean}) => {
                this._onClientPingPongMessage(client, data, flags, true);
            }
        );
        client.on('pong', (data: any, flags: {binary: boolean}) => {
                this._onClientPingPongMessage(client, data, flags, false);
            }
        );
        client.on('open', () => {
                this._onClientOpen(client);
            }
        );
    }

    private _onClientClose(client: WebSocket, code: number, message: string) {
        WSRpcLogging.log('Client close code ' + code + ", message " + message);
    }

    private _onClientPingPongMessage(client: WebSocket, data: any, flags: {binary: boolean}, ping: boolean) {
        WSRpcLogging.log('Ping Pong ' + data);
    }

    private _onClientError(client: WebSocket, err: Error) {
        WSRpcLogging.log('Client error ' + err);
    }

    private _onClientOpen(client: WebSocket) {
        WSRpcLogging.log('Client open ');
    }

    private _onServerError(err: Error) {
        WSRpcLogging.log('Server err ' + err);
    }

    private _onServerHeaders(headers: string[]) {
        WSRpcLogging.log('Server headers ');
        headers.forEach(function (h) {
            WSRpcLogging.log(h)
        });
    }

    public _onClientMessage(client: WebSocket, data: any, flags: {binary: boolean}) {
        WSRpcLogging.log('>> ' + data);
        try {
            var _rpc: rpc.RpcMessage = new rpc.RpcMessage(JSON.parse(data));
            if (_rpc.isBroadcast() && _rpc.isRequest()) {
                this._handler.broadcastRpcInvoke(
                    client,
                    _rpc.getNamedInstance(),
                    _rpc.getMethod(),
                    _rpc.getParams(),
                    _rpc.getId()
                );
            }
            else if (this._handler.hasPendingResponseWithId(_rpc.getId()) && _rpc.isResponse()) {
                this._handler.broadcastResponseToOrigin(
                    _rpc
                );
            }
            else if (this._handler.hasPendingResponseWithId(_rpc.getId()) && _rpc.getCode()) {
                this._handler.broadcastResponseToOrigin(
                    _rpc
                );
            }
            else if (_rpc.isRequest()) {
                this._handler.rpcInvoke(
                    client,
                    _rpc.getNamedInstance(),
                    _rpc.getMethod(),
                    _rpc.getParams(),
                    _rpc.getId()
                );
            }
            else if (_rpc.isResponse()) {
                this._handler.broadcastResponseToOrigin(
                    _rpc
                );
            }
            else if (_rpc.getCode()) {
                this._handler.receiveClientError(
                    _rpc
                );
            }
        } catch (err) {
            console.warn(err);
        }
    }
}

export class WSRpcServerCallHandler {

    private _singleton: rpc.ObjectRegistry;
    private _stateless: rpc.ClassRegistry;
    private _names: { [name: string]: Object };

    constructor() {
        this._names = {};
        this._singleton = new rpc.ObjectRegistry();
        this._stateless = new rpc.ClassRegistry();
    }

    public singleton(instanceName: string, classNames: any) {
        this._names[instanceName] = this._singleton;
        this._singleton.register(instanceName, classNames);
    }

    public stateless(instanceName: string, classNames: any) {
        this._names[instanceName] = this._stateless;
        this._stateless.register(instanceName, classNames);
    }

    public statefull(instanceName: string, classNames: any) {
        console.warn('Session objects not implemented yet !');
    }

    public getRegistry(instanceName: string): rpc.api.IRPCRegistry {
        if (this._names[instanceName] === this._singleton) {
            return this._singleton;
        }
        else if (this._names[instanceName] === this._stateless) {
            return this._stateless;
        }
        return null;
    }

    public rpcInvoke(client: WebSocket, instance: string, method: string, params: JSON, id: string) {
        if (this._names[instance]) {
            var registry: rpc.api.IRPCRegistry = null;
            if (this._names[instance] === this._singleton) {
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                registry = this._stateless;
            }
            var result: JSON = registry.invoke(instance, method, params);
            client.send(JSON.stringify(rpc.RPC.Response(id, result)));
        }
        else {
            client.send(
                JSON.stringify(
                    rpc.RPC.Error(id, rpc.RPC.METHOD_NOT_FOUND, 'RPC server instance named ' + instance + ' not found.')
                )
            );
        }
    }

    public broadcastRpcInvoke(client: WebSocket, instance: string, method: string, params: JSON, id: string) {
        WSRpcLogging.log('Not implemented yet !');
    }

    public broadcastResponseToOrigin(rpc: rpc.RpcMessage) {
        WSRpcLogging.log('Not implemented yet !');
    }

    public receiveClientError(rpc: rpc.RpcMessage) {
        WSRpcLogging.log('Not implemented yet !');
    }

    public hasPendingResponseWithId(id: string): boolean {
        return true;
    }
}