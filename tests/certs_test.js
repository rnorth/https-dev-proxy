var test = require('tape'),
    tmp = require('tmp');

var certs = require('../lib/certs.js');

/*
 * Tests
 */
test('we can create a self-signed CA', function (t) {
    t.plan(1);

    var ca = certs.ca(tmp.dirSync().name);

    t.ok(ca);
});

test('we can create certificates and keys for any subdomain', function (t) {
    t.plan(2);

    var ca = certs.ca(tmp.dirSync().name);

    t.ok(ca);

    var assets = ca.assetsForDomain('127.0.0.1.xip.io');

    t.ok(assets);
});