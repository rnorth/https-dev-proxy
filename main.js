var proxy = require('./lib/proxy');


/*
 * Command line mode
 */

var server = proxy.createServer({
    target: 'http://localhost:3000'
});
server.listen(4000);