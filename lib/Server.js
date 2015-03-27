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

  // XXX: now customizing ws object dynamically.
  //      is it more safer if to make wrapper object?
  Server.prototype.wrapSocket = function (ws) {
    var i,len, that = this;
    ws._abdl_original_send = ws.send;
    ws.send = function (wspayload, flags, callback) {
      ws._abdl_original_send({ m: wspayload }, flags, callback);
    };
    ws.sendEvent = function (eventtype, after, payload, callback) {
      ws.sendEvents(eventtype, after, [payload]);
    };
    ws.sendEvents = function (eventtype, af, events) {
      ws.send({ t: eventtype, a: at, e: events });
    };

    // Delegate message handler
    var existingHandlers = ws.listeners('message');
    ws.removeAllListeners('message');
    len = existingHandlers.length;
    for ( i=0;i<len;i++ ) {
      ws.on('nonAbsodulerMessage', existingHandlers[i]);
    }
    ws._abdl_original_on = ws.on;
    ws.on('message', function(message, flags) {
      return that.messageHandler(ws,message,flags);
    });

    ws.on = function(event, listener) {
      if (event === 'message') event = 'nonAbsodulerMessage';
      ws._abdl_original_on(event,listener);
    };
  };

  Server.prototype.__initNewServer = function (opts, callback) {
    var that = this;
    var wss = new WebSocketServer(opts,callback);
    wss.on('connection', function(ws) {
      that.wrapSocket(ws);
      var obj = {ws:ws,id:that.total++};
      that.room.join(obj);
      ws.on('close', function () {
        that.room.leave(obj);
      });
    });
    this.wss = wss;
    return this;
  };

  Server.prototype.messageHandler = function (ws, message, flags) {
    var msg = this.serialize.unpack(message);
    if ( msg ) {
      if ( msg.t === 'ping' ) {
        this.ping(ws,msg);
      }
    }
    else {
      ws.emit('nonAbsodulerMessage', message, flags);
    }
  };

  Server.prototype.ping = function(ws,msg) {
    var now = (new Date()).getTime();
    var wsmessage = this.serialize.pack({t:'pong',b:msg.b,s:now});
    ws._abdl_original_send(wsmessage);
  };

  Server.prototype.broadcast = function(msg) {
    var now = (new Date()).getTime();
    if ( msg.after ) {
      msg.at = now + msg.after;
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
