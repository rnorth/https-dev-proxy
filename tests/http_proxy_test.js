var test = require('tape'),
    http = require('http'),
    https = require('https'),
    randomstring = require('randomstring'),
    tmp = require('tmp');

var proxy = require('../lib/proxy.js');

/*
 * Dummy HTTP server for testing
 */
var express = require('express');
var app = express();
var server = http.createServer(app);
app.get('/', function (req, res) {
    res.send('Hello World!');
});

/*
 * Tests
 */
test('the dummy HTTP server serves correctly', function (t) {
    t.plan(2);

    server.listen(3000);

    http.get('http://localhost:3000', function (res) {
        t.equal(res.statusCode, 200);

        res.on('data', function (data) {
            t.equal(data.toString(), 'Hello World!');
        });

        server.close();
    });
});

test('we can use a proxy server to hit any subdomain', function (t) {
    t.plan(2);

    // Start the dummy server
    server.listen(3000);

    // Start the proxy server
    var proxyServer = proxy.createServer({
        target: 'http://localhost:3000',
        workingDir: tmp.dirSync().name
    });
    proxyServer.listen(4000);

    // Prefix the hostname so we know this is the first request and a new cert must be built
    var randomPrefix = randomstring.generate(5);
    var requestOptions = {
        host: randomPrefix + '.127.0.0.1.xip.io',
        port: '4000',
        ca: proxyServer.caCert(),
        rejectUnauthorized: true
    };

    // Call the proxy endpoint
    https.get(requestOptions, function (res) {
        t.equal(res.statusCode, 200);

        res.on('data', function (data) {
            t.equal(data.toString(), 'Hello World!');
        });

        // Kill the dummy server and proxy
        server.close();
        proxyServer.close();
    });
});