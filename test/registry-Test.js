console.log('RPC test');

var assert = require('assert');
var after = require('after');

var lg3x = require('../dist/WSRpc').lg3x;
lg3x.DEBUG = true;

suite('RPCRegistry');

/* ES6 Compteur
class Compteur {
  index: number;
  constructor() {
    this.index = 0;
  }
  increment() {
    return this.index++;
  }
}
*/
var Compteur = (function () {
    function Compteur() {
        this.index = 0;
    }
    Compteur.prototype.increment = function () {
        return this.index++;
    };
    return Compteur;
})();
/* ES6 Chatroom
class Chatroom {
  messages: string[];
  constructor() {
    this.messages = [];
  }
  say(msg: string) {
    return this.messages.push(msg);
  }
  getMessages() {
    return this.messages;
  }
  print() {
    this.messages.forEach(function(m) {
      console.log(' _ ' + m);
    });
  }
}
*/
var Chatroom = (function () {
    function Chatroom() {
        this.messages = [];
    }
    Chatroom.prototype.say = function (msg) {
        return this.messages.push(msg);
    };
    Chatroom.prototype.getMessages = function () {
        return this.messages;
    };
    Chatroom.prototype.print = function () {
        this.messages.forEach(function (m) {
            console.log(' _ ' + m);
        });
    };
    return Chatroom;
})();

test('Building and working with registry', function() {
    var registry = new lg3x.RPCRegistry();
    registry.add('compteur', new Compteur());
    var chatroom = new Chatroom();
    registry.add('chatroom', chatroom);

    var r = registry.invoke('compteur', 'increment');
    assert.equal(r, 0);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 1);
    r = registry.invoke('compteur', 'increment');
    assert.equal(r, 2);

    registry.invoke('chatroom', 'say', 'COUCOU2');
    registry.invoke('chatroom', 'say', 'COUCOU aussi');
    registry.invoke('chatroom', 'print');
    assert.equal(chatroom.getMessages().length, 2);

    var error = null;
    try {
        registry.invoke('chatroom', 'print2');
    } catch(err) {
        error = err;
    }
    assert.equal('RPCRegistry invoke fail on chatroom.print2()', error);
});