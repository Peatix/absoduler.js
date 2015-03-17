(function () {

  var EventEmitter = require('events').EventEmitter
    , WebSocketServer = require('ws').Server
    , util = require('util')
    , Room = require('./Room')
    ;

  /*
  NOTE: in this source, use 'message' for plain websocket message
        and use 'msg' for parsed absoluter message object --

   */
  function AbsodulerServer (opts,callback) {
    if ( 'undefined' === typeof opts ) opts = {};
    this.init(opts);
    this.__initNewServer(opts);
    return this;
  };
  util.inherits(AbsodulerServer, EventEmitter);

  AbsodulerServer.prototype.init = function (opts) {
    this.schema = 'absop:';
    this.schemaRegex = /^absop:/;
    this.room = new Room();
    this.__messageFallbacks = [];
    this.total = 0;
  };

  AbsodulerServer.prototype.__initNewServer = function (opts,callback) {
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
  AbsodulerServer.prototype.messageHandler = function (ws,message) {
    var msg;
    if ( msg = this._unpack(message) ) {
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
  AbsodulerServer.prototype._pack = function (msg) {
    var wsmessage, msgjson;
    msgjson = JSON.stringify(msg);
    wsmessage = this.schema + msgjson;
    return wsmessage;
  };

  AbsodulerServer.prototype._unpack = function (wsmessage) {
    var msgjson, msg;
    if ( this.schemaRegex.test(wsmessage) ) {
      msgjson = wsmessage.replace(this.schemaRegex,'');
      try {
        msg = JSON.parse(msgjson);
        return msg;
      }
      catch (e) {
        console.warn('Invalid JSON');
      }
    }
    return;
  };


  AbsodulerServer.prototype.ping = function(ws,msg) {
    var now = (new Date()).getTime();
    var wsmessage = this._pack({type:'pong',b:msg.b,s:now});
    ws.send(wsmessage);
  };

  AbsodulerServer.prototype.broadcast = function(msg) {
    var now = (new Date()).getTime();
    if ( msg.after ) {
      msg.at = now + msg.after;
    }
    var that = this;
    this.room.each(function() {
      this.ws.send(that._pack(msg));
    });
  };

  module.exports = AbsodulerServer;
})();
