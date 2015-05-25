# WSRpc

## How to use
   
### Node.JS (Backend part)   
   
The following example links WSRpcBackend to a WebSocketServer. 
   
    var WebSocketServer = require('ws').Server,
        wsserver = new WebSocketServer({ port: 3000 }),
    var backend = new backend.WSRpcBackend()
    backend.singleton('myObject1', mypackage.MyObject1);
    backend.link(wsserver);
    
All methods off class "mypackage.MyObject" can now be call from the WSRpcFrontEnd.    
  
### Browser (Frontend part)

The frontend part is like the backend part.   
   
    var frontend = require('WSRpcFrontend');
    var wsclient = new WebSocket('ws://localhost:' + WS_PORT);
    var frontend = new frontend.WSRpcFrontend();
    frontend.stateless('myObject2', mypackage.MyObject2);
    frontend.link(wsclient);

Methods of the backend can now be call like this :

    frontend.call('myObject1', 'method1',
       function (json) {
           console.log('myObject1.method1 gives ' + JSON.stringify(json));
       },
       function (err) {
           console.log('Fail ' + err);
       }
    ).fire(jsonParams); 

Methods of the other frontend can now be call like this :

    frontend.call('myObject2', 'method2',
       function (json) {
           console.log('myObject2.method2 gives ' + JSON.stringify(json));
       },
       function (err) {
           console.log('Fail ' + err);
       }
    ).broadcast(jsonParams);   
   
# License

[MIT](https://github.com/lionelg3/WSRpc/blob/master/LICENSE)