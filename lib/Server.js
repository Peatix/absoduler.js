(function () {

  var EventEmitter = require('events').EventEmitter,
    WebSocketServer = require('ws').Server,
    util = require('util'),
    Room = require('./Room'),
    Serialize = require('./Serialize');

  /*
  NOTE: in this source, use 'message' for plain websocket message
        and use 'msg' for parsed absoluter message object --

   */
  function Server (opts,callback) {
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

  Server.prototype.__initNewServer = function (opts,callback) {
    var that = this;
    var wss = new WebSocketServer(opts,callback);
    wss.on('connection', function(ws) {
      var obj = {ws:ws,id:that.total++};
      that.room.join(obj);
      ws.on('message', function(message) {
        return that.messageHandler(ws,message);
      });
      ws.on('close', function () {
        that.room.leave(obj);
      });
    });
    this.wss = wss;
    return this;
  };

  Server.prototype.messageHandler = function (ws,message) {
    var msg = this.serialize.unpack(message);
    if ( msg ) {
      if ( msg.type === 'ping' ) {
        this.ping(ws,msg);
      }
    }
    else if ( this.__messageFallbacks.length ) {
      var len = this.__messageFallbacks.length;
      for (var i=0;i<len;i++) {
        var listener = this.__messageFallbacks[i];
        listener.call(ws,message); // should pass arguments?
      }
    }
  };

  Server.prototype.ping = function(ws,msg) {
    var now = (new Date()).getTime();
    var wsmessage = this.serialize.pack({type:'pong',b:msg.b,s:now});
    ws.send(wsmessage);
  };

  Server.prototype.broadcast = function(msg) {
    var now = (new Date()).getTime();
    if ( msg.after ) {
      msg.at = now + msg.after;
    }
    var that = this;
    this.room.each(function() {
      this.ws.send(that.serialize.pack(msg));
    });
  };

  Server.prototype.close = function () {
    this.wss.close();
  };

  module.exports = Server;
})();
