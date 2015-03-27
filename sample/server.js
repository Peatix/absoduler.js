#!/usr/bin/env node
var http = require('http'),
  AbsodulerServer = require('../index').Server,
  fs = require('fs');


var files = {};
function registerFile (url,file) {
  files[url] = fs.readFileSync(__dirname + '/' + file, {encoding: 'utf8'});
}

registerFile(  '/index.html', 'index.html' );
registerFile( '/Absoduler.js', '/../lib/Absoduler.js');
registerFile( '/Serialize.js', '/../lib/Serialize.js');

var js = fs.readFileSync(__dirname + '/../lib/Serialize.js');

var httpserver = http.createServer(function(request, response) {
  var url = request.url;
  var res = 200;
  if ( url === '/' ) url = '/index.html';
  var content = files[url];
  if ( !content ) { res = 404; content = "Not found"; }
  if ( url.match(/\.js$/) ) {
    response.writeHead(res, {"Content-Type": "text/javascript"});
  }
  else {
    response.writeHead(res, {"Content-Type": "text/html"});
  }
  response.write(content);
  response.end();
});
httpserver.listen(8080);

var as = new AbsodulerServer({port: 8088});

setInterval( function () {
  as.wss.clients.forEach( function (ws) {
    ws.sendEvent('color', 1000, [
      parseInt(Math.random() * 256),
      parseInt(Math.random() * 256),
      parseInt(Math.random() * 256)
    ]);
  });
}, 1000);
