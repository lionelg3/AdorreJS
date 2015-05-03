var wsrpc_registry_classes;
(function (wsrpc_registry_classes) {
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
    wsrpc_registry_classes.Chatroom = Chatroom;
    var Compteur = (function () {
        function Compteur() {
            this.index = 0;
        }
        Compteur.prototype.increment = function () {
            return this.index++;
        };
        return Compteur;
    })();
    wsrpc_registry_classes.Compteur = Compteur;
})(wsrpc_registry_classes = exports.wsrpc_registry_classes || (exports.wsrpc_registry_classes = {}));
