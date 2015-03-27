#!/usr/bin/env node
var http = require('http'),
  AbsodulerServer = require('../index').Server,
  fs = require('fs');


var files = {};
var host = process.argv[2];
if ( !host ) host = 'localhost';
console.log( 'running server', host );
function registerFile (url,file) {
  var content = fs.readFileSync(__dirname + '/' + file, {encoding: 'utf8'});
  files[url] = content.replace('__HOST__', host);
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
  var rgb = [
      parseInt(Math.random() * 256),
      parseInt(Math.random() * 256),
      parseInt(Math.random() * 256)
  ];
  as.wss.clients.forEach( function (ws) {
    ws.sendEvent('color', 1000, rgb);
  });
}, 1000);
