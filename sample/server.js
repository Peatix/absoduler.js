#!/usr/bin/env node
var http = require('http')
  , AbsodulerServer = require('../index').Server
  , fs = require('fs')
  ;
var page = fs.readFileSync(__dirname + '/index.html', {
  encoding: 'utf-8'
});
var js = fs.readFileSync(__dirname + '/../lib/Absoduler.js');

var httpserver = http.createServer(function(request, response) {
  if ( request.url === '/Absoduler.js' ) {
    response.writeHead(200, {"Content-Type": "text/javascript"});
    response.write(js);
  }
  else {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(page);
  }
  response.end();
});
httpserver.listen(8089);

var as = new AbsodulerServer({port: 8088});

setInterval( function () {
  as.broadcast({ type: 'color', after: 1000, color: [
    parseInt(Math.random() * 256),
    parseInt(Math.random() * 256),
    parseInt(Math.random() * 256)
  ]});
}, 1000);
