# WSRpc

## About

Few information about [JSON-RPC](http://www.jsonrpc.org/)    

## Fluid API :

Usage :

    var _wsrpc = new lg3x.WSRpc('ws://myhost:5555');

Simple method call with params. The result is in the "then" callcack.

    _wsrpc.call()
            .method('remoteObject.sayHello')
            .withParams(JSON.parse('{"who": "world"}'))
            .then(function (json) {
                    console.log('go ' + json);
                }
            );

Simple "named" method call with params. The result is in the "on" callcack.
Very usefull with many answers.

    _wsrpc.on('HELLO WORLD',
        function (json) {
            console.log('go ' + json);
        }
    );
    _wsrpc.call('HELLO WORLD')
            .method('remoteObject.sayHello')
            .withParams(JSON.parse('{"who": "world"}'))
            .now();
            
## Request / response API :

Usage :

    var _wsrpc = new lg3x.WSRpc('ws://myhost:5555');
    
Simple named call. The result is in the callcack.

    _wsrpc.doRequest('CALL_ME_1', {'name': 'john'}),
        function (json) {
            console.log('Server say ' + json.message);
        }
    );    

With named response.

    _wsrpc.onResponse('CALL_ME_2', function (json) {
                console.log('Server say ' + json.message);
            });
    _wsrpc.doRequest('CALL_ME_2', {'name': 'john'}));