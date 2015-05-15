console.log('EventBus test');

var assert = require('assert');

var bus = require('../../dist/EventBus');

suite('EventBus');

test('Shared event bus instance are equal', function() {
    var bus1 = bus.EventBus.getSharedEventBus();
    var bus2 = bus.EventBus.getSharedEventBus();
    assert.equal(bus1, bus2);
});

test('Invoke one callback without params', function () {
    var myInteger = 0;
    assert.equal(0, myInteger);
    var bus1 = bus.EventBus.getSharedEventBus();
    bus1.on('increment_x', function(params) {
        myInteger ++;
    });
    bus1.fire('increment_x');
    assert.equal(1, myInteger);
    bus1.fire('increment_x', null);
    assert.equal(2, myInteger);
    bus1.fire('increment_x', undefined);
    assert.equal(3, myInteger);
});

test('Invoke one callback with params', function () {
    var myInteger = 0;
    assert.equal(0, myInteger);
    var bus1 = bus.EventBus.getSharedEventBus();
    var params = JSON.parse('{"inc": 10}');
    bus1.on('increment_x', function(params) {
        myInteger += params.inc;
    });
    bus1.fire('increment_x', params);
    assert.equal(10, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(20, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(30, myInteger);
});

test('Invoke with removed callback', function () {
    var myInteger = 0;
    var incFunction = function(params) {
        myInteger += params.inc;
    };
    assert.equal(0, myInteger);
    var bus1 = bus.EventBus.getSharedEventBus();
    var params = JSON.parse('{"inc": 10}');
    bus1.on('increment_x', incFunction);
    bus1.fire('increment_x', params);
    assert.equal(10, myInteger);

    // Remove callback
    bus1.remove('increment_x', incFunction);

    bus1.fire('increment_x', params);
    assert.equal(10, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(10, myInteger);
});

test('Invoke multiple callback with params', function () {
    var myInteger = 0;
    assert.equal(0, myInteger);
    var bus1 = bus.EventBus.getSharedEventBus();
    var params = JSON.parse('{"inc": 10}');
    bus1.on('increment_x', function(params) {
        myInteger += params.inc;
    });
    bus1.on('increment_x', function(params) {
        myInteger -= (params.inc / 10);
    });
    bus1.fire('increment_x', params);
    assert.equal(9, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(18, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(27, myInteger);
});

test('Invoke multiple callback with params and removed one', function () {
    var div10 = function(params) {
        myInteger -= (params.inc / 10);
    };

    var myInteger = 0;
    assert.equal(0, myInteger);
    var bus1 = bus.EventBus.getSharedEventBus();
    var params = JSON.parse('{"inc": 10}');
    bus1.on('increment_x', function(params) {
        myInteger += params.inc;
    });
    bus1.on('increment_x', div10);
    bus1.fire('increment_x', params);
    assert.equal(9, myInteger);

    // remove div10
    bus1.remove('increment_x', div10);

    bus1.fire('increment_x', params);
    assert.equal(19, myInteger);
    bus1.fire('increment_x', params);
    assert.equal(29, myInteger);
});
