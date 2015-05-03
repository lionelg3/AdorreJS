var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 3000 });


wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(data) {
        try {
            console.log('incomming data : ' + data);
            var response = null;
            var request = JSON.parse(data);
            console.log('Got JSON-RPC request:\n  %s', JSON.stringify(request));

            if ('REPEAT_MY_NAME' === request.method) {
                json = {'name': request.params.name};
                response = {
                    'jsonrpc':'2.0',
                    'result': json,
                    'id':request.id
                };
                console.log('Send JSON-RPC response:\n  %s', JSON.stringify(response));
                ws.send(JSON.stringify(response));
                return;
            }

            if ('REPEAT_THE_DATE' === request.method) {
                json = {'date': request.params.date};
                response = {
                    'jsonrpc':'2.0',
                    'result': json,
                    'id':request.id
                };
                console.log('Send JSON-RPC response:\n  %s', JSON.stringify(response));
                ws.send(JSON.stringify(response));
                return;
            }

            // do rpc
            if ('remoteObject.sayHello' === request.method) {
                json = {'message': 'Hello ' + request.params.who + '!'};
                response = {
                    'jsonrpc':'2.0',
                    'result': json,
                    'id':request.id
                };
                console.log('Send JSON-RPC return:\n  %s', JSON.stringify(response));
                ws.send(JSON.stringify(response));
            }

            if ('remoteObject.sayHelloAll' === request.method) {
                json = {'message': 'Hello all the ' + request.params.who + '!'};
                response = {
                    'jsonrpc':'2.0',
                    'result': json,
                    'id':request.id
                };
                console.log('Send JSON-RPC return:\n  %s', JSON.stringify(response));
                ws.send(JSON.stringify(response));
            }

        } catch (err) {
            console.log('Got non JSON-RPC request:\n  "%s"', data);
        }
    });

    ws.on('close', function close() {
        console.log('disconnected');
    });

    console.log('one client connected');

    //ws.send('something');
});

console.log('WebSocketServer listening on port 3000');