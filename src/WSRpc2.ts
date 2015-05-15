/// <reference path="UUIDGenerator.ts" />
/// <reference path="Registry.ts" />
/// <reference path="JsonRpc.ts" />
/// <reference path="EventBus.ts" />
/// <reference path="ClientCallHandler.ts" />
import uuid = require('./UUIDGenerator');
import reg = require('./Registry');
import jrpc = require('./JsonRpc');
import evt = require('./EventBus');
import handler = require('./ClientCallHandler');

export var DEBUG:boolean = false;

export module api {
	export interface IWSRpc2 {
		link(ws:WebSocket);
		createCall(name:string, method:string, then?:(data?:JSON) => void, otherwise?:(data:JSON) => void): IWSRpc2Call;
		singleton(instanceName:string, classNames:any);
		stateless(instanceName:string, classNames:any);
	}

	export interface IWSRpc2Call {
		fire(data?:JSON);
		broadcast(data?:JSON);
	}
}

export class WSRpc2 implements api.IWSRpc2 {

	private _ws:WebSocket;
	private _handler:handler.ClientCallHandler;

	constructor() {
		this._ws = null;
		this._handler = new handler.ClientCallHandler();
	}

	public link(ws:WebSocket) {
		this._ws = ws;
		if (this._ws) {
			this._ws.onmessage = (event:any) => {
				WSRpc2.log('WSRpc2', 'onmessage', this._ws.url, event.data);
				var rpc = JSON.parse(event.data);
				var message:jrpc.RpcMessage = new jrpc.RpcMessage(rpc);
				if (message.getId()) {
					evt.EventBus.getSharedEventBus().fire(rpc.id, (rpc.result) ? rpc.result : rpc.error);
				}
				if (message.isRequest()) {
					this._handler.execute(this._ws, message);
				}
			};
		} else {
			throw 'ERR WRC_001: Can not link without WebSocket connection.';
		}
	}

	public createCall(name:string, method:string, then?:(data?:JSON) => void, otherwise?:(data:JSON) => void):api.IWSRpc2Call {
		var call:WSRpc2Call = new WSRpc2Call();
		call.ws = this._ws;
		call.clazz = name;
		call.method = method;
		call.id = name + '.' + method + ':' + uuid.UUIDGenerator.generateUUID();

		var eventBus:evt.EventBus = evt.EventBus.getSharedEventBus();
		if (then) {
			eventBus.on(call.id, then);
		}
		if (otherwise) {
			eventBus.on('Error:' + call.id, otherwise);
		}
		return call;
	}

	public singleton(instanceName:string, classNames:any) {
		this._handler.singleton(instanceName, classNames);
	}

	public stateless(instanceName:string, classNames:any) {
		this._handler.stateless(instanceName, classNames);
	}

	public static log(...args:any[]) {
		if (DEBUG)
			console.debug.apply(console, args);
	}
}

class WSRpc2Call {
	ws:WebSocket = null;
	id:string = null;
	clazz:string = null;
	method:string = null;

	public fire(data?:JSON) {
		var _rpc = jrpc.RPC.Request(this.id, this.clazz + '.' + this.method, data);
		if (this.ws) {
			WSRpc2.log('>> Send :', JSON.stringify(_rpc));
			this.ws.send(JSON.stringify(_rpc));
		} else {
			throw 'ERR WRC_002: Can not send without WebSocket connection.';
		}
	}

	public broadcast(data?:JSON) {
		this.clazz = '{broadcast}' + this.clazz;
		this.fire(data);
	}
}