(function () {

  var EventEmitter = require('events').EventEmitter,
    WebSocketServer = require('ws').Server,
    util = require('util'),
    Serialize = require('./Serialize'),
    NodeAbsodulerize = require('./Node');

  /*
  NOTE: in this source, use 'wsmessage' for plain websocket message
        and use 'msg' for parsed absoluter message object --

   */
  function Server (opts) {
    if ( 'undefined' === typeof opts ) opts = {};
    this.init(opts);
    this.serialize = Serialize.JSON;
    this.__initNewServer(opts);
    return this;
  }
  util.inherits(Server, EventEmitter);

  Server.prototype.init = function (opts) {
    this.__messageFallbacks = [];
    this.total = 0;
  };

  Server.prototype.__initNewServer = function (opts) {
    var that = this;
    var wss = new WebSocketServer(opts);
    wss.on('connection', function(ws) {
      NodeAbsodulerize.call(that,ws,that.serialize);

      ws.sendEvent = function (eventtype, after, payload) {
        ws.sendEvents(eventtype, after, [payload]);
      };
      ws.sendEvents = function (eventtype, after, events) {
        var at = (new Date()).getTime() + after;
        ws.send_abdl({ t: eventtype, a: at, e: events });
      };
      that.emit('connection', ws);
    });
    this.wss = wss;
    return this;
  };

  Server.prototype.handler = function (ws,msg) {
    if ( msg.t === 'ping' ) {
      this.pong(ws,msg);
    }
  };

  Server.prototype.pong = function(ws,msg) {
    var now = (new Date()).getTime();
    var wsmessage = this.serialize.pack({t:'pong',b:msg.b,s:now});
    ws._abdl_original_send(wsmessage);
  };

  Server.prototype.close = function () {
    this.wss.close();
  };

  module.exports = Server;

})();
