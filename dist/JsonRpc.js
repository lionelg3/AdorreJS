var RPC = (function () {
    function RPC(rpc) {
        if (rpc.jsonrpc !== '2.0') {
            throw 'Json-RPC Message Error';
        }
        this._id = rpc.id;
        this._broadcast = false;
        if (rpc.error) {
            this._code = rpc.error.code;
            this._message = rpc.error.message;
        }
        else if (rpc.method) {
            this._params = rpc.params;
            var t = rpc.method.split('.');
            if (t.length == 2) {
                this._namedMethod = t[t.length - 1];
                if (t[0].split('}')[0] === '{broadcast') {
                    this._broadcast = true;
                    this._namedInstance = t[0].split('}')[1];
                }
                else {
                    this._namedInstance = t[0];
                }
            }
            else {
                throw 'RPC Parse error';
            }
        }
        else {
            this._result = rpc.result;
        }
    }
    RPC.prototype.isError = function () {
        return (this._code !== undefined);
    };
    RPC.prototype.isRequest = function () {
        return (this._namedMethod !== undefined);
    };
    RPC.prototype.isResponse = function () {
        return (this._result !== undefined);
    };
    RPC.prototype.getCode = function () {
        return this._code;
    };
    RPC.prototype.getErrorMessage = function () {
        return this._message;
    };
    RPC.prototype.getResult = function () {
        return this._result;
    };
    RPC.prototype.getParams = function () {
        return this._params;
    };
    RPC.prototype.isBroadcast = function () {
        return this._broadcast;
    };
    RPC.prototype.getMethod = function () {
        return this._namedMethod;
    };
    RPC.prototype.getInstance = function () {
        return this._namedInstance;
    };
    RPC.prototype.getId = function () {
        return this._id;
    };
    RPC.Response = function (id, result) {
        return {
            'jsonrpc': RPC.VERSION,
            'result': (result) ? result : null,
            'id': (id) ? id : null
        };
    };
    RPC.Request = function (id, method, data) {
        return {
            'jsonrpc': RPC.VERSION,
            'method': method,
            'params': data,
            'id': (id) ? id : null
        };
    };
    RPC.Error = function (id, code, message) {
        return {
            'jsonrpc': RPC.VERSION,
            'error': {
                'code': code,
                'message': message
            },
            'id': (id) ? id : null
        };
    };
    RPC.VERSION = '2.0';
    RPC.PARSE_ERROR = -32700;
    RPC.INVALID_REQUEST = -32600;
    RPC.METHOD_NOT_FOUND = -32601;
    RPC.INVALID_PARAMS = -32602;
    RPC.INTERNAL_ERROR = -32603;
    return RPC;
})();
exports.RPC = RPC;

//# sourceMappingURL=JsonRpc.js.map