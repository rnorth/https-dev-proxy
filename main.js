#!/usr/bin/env node
var proxy = require('./lib/proxy');
var argv = require('yargs')
    .usage('Usage: $0 PORT [[http://]localhost:]HTTP_PORT')
    .demand(2)
    .argv;

var listenPort = argv['_'][0];
var remote = argv['_'][1];

var remoteMatch = /(http:\/\/)?(([^:\s]+):)?([\d]+)/.exec(remote);
var remoteProtocol = remoteMatch[1] || 'http://';
var remoteHost = remoteMatch[3] || 'localhost';
var remotePort = remoteMatch[4];
var remoteAddress = remoteProtocol + remoteHost + ':' + remotePort;

/*
 * Command line mode
 */

var server = proxy.createServer({
    target: remoteAddress
});
server.listen(listenPort);