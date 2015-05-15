/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="Registry.ts" />
/// <reference path="JsonRpc.ts" />
/// <reference path="WSRpc.ts" />
import reg = require('./Registry');
import jrpc = require('./JsonRpc');
import bus = require('./EventBus');
import rpc = require('./WSRpc');
import ws = require('ws');

export var DEBUG: boolean = false;

export module api {

    export interface IWSRpcBackend {
        link(server: ws.Server);
        singleton(instanceName: string, classNames: any);
        stateless(instanceName: string, classNames: any);
        statefull(instanceName: string, classNames: any);
    }
}

class WSRpcLogging {
    static log(...args: any[]) {
        if (DEBUG) {
            console.log(args);
        }
    }
    static error(...args: any[]) {
        console.warn(args);
    }
}

export class WSRpcBackend implements api.IWSRpcBackend {

    private _server: ws.Server;
    private _handler: WSRpcServerCallHandler;

    constructor() {
        this._handler = new WSRpcServerCallHandler();
    }

    public link(server: ws.Server) {
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
            var _rpc: jrpc.RpcMessage = new jrpc.RpcMessage(JSON.parse(data));
            if (_rpc.isRequest() && _rpc.isBroadcast()) {
                this._handler.broadcastRpcInvoke(
                    this._server,
					client,
                    _rpc.getAction(),
                    _rpc.getInstance(),
                    _rpc.getMethod(),
                    _rpc.getParams(),
                    _rpc.getId()
                );
            }
            else if (_rpc.isRequest()) {
                this._handler.rpcInvoke(
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
}

export class WSRpcServerCallHandler {

    private _singleton: reg.ObjectRegistry;
    private _stateless: reg.ClassRegistry;
    private _names: { [name: string]: Object };
	private _eventBus: bus.EventBus;
	private _pendingRequest: { [id: string]: any };

	constructor() {
        this._names = {};
        this._singleton = new reg.ObjectRegistry();
        this._stateless = new reg.ClassRegistry();
		this._pendingRequest = {};
		this._eventBus = bus.EventBus.getSharedEventBus();
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

    public getRegistry(instanceName: string): reg.api.IRPCRegistry {
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
            var registry: reg.api.IRPCRegistry = null;
            if (this._names[instance] === this._singleton) {
                registry = this._singleton;
            }
            else if (this._names[instance] === this._stateless) {
                registry = this._stateless;
            }
			try {
				var result: JSON = registry.invoke(instance, method, params);
				client.send(JSON.stringify(jrpc.RPC.Response(id, result)));
			} catch (err) {
				console.warn('RPC server call "' + instance + '.' + method + '" fail.');
				WSRpcLogging.error('<< ' + JSON.stringify(jrpc.RPC.Error('Error', jrpc.RPC.INTERNAL_ERROR,
					'RPC server call "' + instance + '.' + method + '" fail.')));
				client.send(JSON.stringify(jrpc.RPC.Error('Error', jrpc.RPC.INTERNAL_ERROR,
					'RPC server call "' + instance + '.' + method + '" fail.')));
			}
        }
        else {
            client.send(
                JSON.stringify(
                    jrpc.RPC.Error(id, jrpc.RPC.METHOD_NOT_FOUND, 'RPC server instance named ' + instance + ' not found.')
                )
            );
        }
    }

    public broadcastRpcInvoke(server: ws.Server, client: WebSocket, action: string, instance: string, method: string, params: JSON, id: string) {
		if (id) {
			this._pendingRequest[id] = client;
		}
		var m: string = (action) ? action : instance + '.' + method;
		var newRpc = jrpc.RPC.Request(id, m, params);
		server.clients.forEach((_client) => {
			_client.send(JSON.stringify(newRpc));
		});
    }

    public sendResponseToOrigin(id: string, result: JSON) {
        if (id && this._pendingRequest[id]) {
			var newRpc = jrpc.RPC.Response(id, result);
			var client = this._pendingRequest[id];
			client.send(JSON.stringify(newRpc));
		}
    }

    public sendErrorToOrigin(id: string, code: number, message: string) {
		if (id && this._pendingRequest[id]) {
			var newRpc = jrpc.RPC.Error(id, code, message);
			var client = this._pendingRequest[id];
			client.send(JSON.stringify(newRpc));
		}
	}

    public useResponse(id: string, result: JSON) {
        this._eventBus.fire(id, result);
    }

    public receiveClientError(rpc: jrpc.RpcMessage) {
        WSRpcLogging.error('Get error : ' + JSON.stringify(rpc));
	}

    public getClientResponseWithId(id: string): any {
        return this._pendingRequest[id];
    }
}