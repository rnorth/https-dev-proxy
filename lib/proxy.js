var http = require('http'),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    certs = require('./certs'),
    tls = require('tls');

exports = module.exports || {};

var HttpsProxyServer = function(opts) {
    if (!opts) {
        console.warn('new HttpsProxyServer() requires an options hash as the first argument'.red);
        throw new Error();
    }

    if (!opts.target) {
        console.warn("new HttpsProxyServer options requires a 'target' key specifying the address of the HTTP server to be proxied".red);
        throw new Error();
    }

    opts.workingDir = opts.workingDir || process.cwd();

    this.ca = certs.ca(opts.workingDir);
    this.opts = opts;
    var self = this;

    this.proxy = httpProxy.createProxyServer({
        target: opts.target,
        ssl: {
            SNICallback: function(servername, cb) {
                console.log('Handling request with SNI for servername: ' + servername);

                var assets = self.ca.assetsForDomain(servername);

                var context = tls.createSecureContext({
                    key: assets.key,
                    cert: assets.cert
                });

                cb(null, context);
            }
        }
    });

    this.caCert = function() {
        return self.ca.caCert();
    };

    this.listen = function(port) {
        this.proxy.listen(port);
        console.log(("HTTPS->HTTP proxy is listening on port " + port + ' and is proxying requests to ' + self.opts.target).green);
    };
};


HttpsProxyServer.prototype.close = function() {
    this.proxy.close();
};

exports.createServer = function (opts) {
    return new HttpsProxyServer(opts);
};
