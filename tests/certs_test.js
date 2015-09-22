var test = require('tape');

var certs = require('../lib/certs.js');

/*
 * Tests
 */
test('we can create a self-signed CA', function (t) {
    t.plan(1);

    var ca = certs.ca(process.cwd());

    t.ok(ca);
});

test('we can create certificates and keys for any subdomain', function (t) {
    t.plan(2);

    var ca = certs.ca(process.cwd());

    t.ok(ca);

    var assets = ca.assetsForDomain('127.0.0.1.xip.io');

    t.ok(assets);
});