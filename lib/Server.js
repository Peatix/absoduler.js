(function () {

  var EventEmitter = require('events').EventEmitter,
    WebSocketServer = require('ws').Server,
    util = require('util'),
    Room = require('./Room'),
    Serialize = require('./Serialize'),
    NodeAbsodulerize = require('./Node');

  /*
  NOTE: in this source, use 'message' for plain websocket message
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
    this.room = new Room();
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
      var obj = {ws:ws,id:that.total++};
      that.room.join(obj);
      ws.on('close', function () {
        that.room.leave(obj);
      });
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

  Server.prototype.broadcast = function(msg) {
    var now = (new Date()).getTime();
    if ( msg.after ) {
      msg.a = now + msg.after;
    }
    var that = this;
    this.room.each(function() {
      this.ws._abdl_original_send(that.serialize.pack(msg));
    });
  };

  Server.prototype.close = function () {
    this.wss.close();
  };

  module.exports = Server;
})();
