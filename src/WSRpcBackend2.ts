/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="Registry.ts" />
/// <reference path="JsonRpc.ts" />
/// <reference path="EventBus.ts" />
/// <reference path="BackendCallHandler.ts" />
import ws = require('ws');
import reg = require('./Registry');
import jrpc = require('./JsonRpc');
import bus = require('./EventBus');
import handler = require('./BackendCallHandler');

export var DEBUG: boolean = false;

export module api {
    export interface IWSRpcBackend {
        link(server: ws.Server);
        singleton(instanceName: string, classNames: any);
        stateless(instanceName: string, classNames: any);
        statefull(instanceName: string, classNames: any);
    }
}

export class WSRpcBackend implements api.IWSRpcBackend {

    private _server: ws.Server;
    private _handler: handler.BackendCallHandler;

    constructor() {
        this._handler = new handler.BackendCallHandler();
    }

    public link(server: ws.Server) {
        this._server = server;
        this._server.on('error', (err: Error) => {
                WSRpcBackend.log('Server err ' + err);
            }
        );

        this._server.on('headers', (headers: string[]) => {
                WSRpcBackend.log('Server headers ');
                headers.forEach(function (h) {
                    WSRpcBackend.log(h)
                });            }
        );

        this._server.on('connection', (client) => {
                client.on('message', (data: any, flags: {binary: boolean}) => {
                        this._onClientMessage(client, data, flags);
                    }
                );
                client.on('error', (err: Error) => {
                        WSRpcBackend.log('Client error ' + err);
                    }
                );
                client.on('close', (code: number, message: string) => {
                        WSRpcBackend.log('Client close code ' + code + ", message " + message);
                    }
                );
                client.on('ping', (data: any, flags: {binary: boolean}) => {
                        WSRpcBackend.log('Ping ' + data);
                    }
                );
                client.on('pong', (data: any, flags: {binary: boolean}) => {
                        WSRpcBackend.log('Pong ' + data);
                    }
                );
                client.on('open', () => {
                        WSRpcBackend.log('Client open ' + client);
                    }
                );
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

    private _onClientMessage(client: any, data: any, flags: {binary: boolean}) {
        WSRpcBackend.log('>> ' + data);
        try {
            var _rpc: jrpc.RPC = new jrpc.RPC(JSON.parse(data));
            if (_rpc.isRequest() && _rpc.isBroadcast()) {
                this._handler.broadcastExecute(
                    this._server,
					client,
                    _rpc.getInstance(),
                    _rpc.getMethod(),
                    _rpc.getParams(),
                    _rpc.getId()
                );
            }
            else if (_rpc.isRequest()) {
                this._handler.execute(
                    client,
                    _rpc.getInstance(),
                    _rpc.getMethod(),
                    _rpc.getParams(),
                    _rpc.getId()
                );
            }
            else if (_rpc.isResponse() && this._handler.getClientResponseWithId(_rpc.getId())) {
                this._handler.sendResponseToOrigin(_rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isResponse()) {
                this._handler.useResponse(_rpc.getId(), _rpc.getResult());
            }
            else if (_rpc.isError() && this._handler.getClientResponseWithId(_rpc.getId())) {
                this._handler.sendErrorToOrigin(_rpc.getId(), _rpc.getCode(), _rpc.getErrorMessage());
            }
            else if (_rpc.isError()) {
                this._handler.receiveClientError(_rpc);
            }
        } catch (err) {
            console.warn(err);
        }
    }
    
    public static log(...args:any[]) {
        if (DEBUG) {
            console.log(args);
        }
    }
}