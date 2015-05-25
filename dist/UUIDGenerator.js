var UUIDGenerator = (function () {
    function UUIDGenerator() {
    }
    UUIDGenerator.generateUUID = function () {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };
    return UUIDGenerator;
})();
exports.UUIDGenerator = UUIDGenerator;

//# sourceMappingURL=UUIDGenerator.js.map