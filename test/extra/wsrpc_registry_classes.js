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
            this.index++;
            return this.index;
        };
        return Compteur;
    })();
    wsrpc_registry_classes.Compteur = Compteur;
    var DateUtil = (function () {
        function DateUtil() {
            console.log('DateUtil <constructor>');
        }
        DateUtil.prototype.getHour = function () {
            console.log('DateUtil getHour()');
            return 23;
        };
        DateUtil.prototype.getMinutes = function () {
            console.log('DateUtil getMinutes()');
            return 59;
        };
        DateUtil.prototype.getSecondes = function () {
            console.log('DateUtil getSecondes()');
            return 59;
        };
        return DateUtil;
    })();
    wsrpc_registry_classes.DateUtil = DateUtil;
})(wsrpc_registry_classes = exports.wsrpc_registry_classes || (exports.wsrpc_registry_classes = {}));
