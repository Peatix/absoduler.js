(function () {
  // search the WebSocket interface
  function findWebSocket () {

  }

  function Absoduler (opts) {
    this.pings = 0;
    this.pongs = [];
    this.maxPongs = 10;
    this.initialized = false;
    this.schema = 'absyp:';
    this.schemaRegex = /^absyp:/;
    this.socket = this._wrapSocket(opts.socket);
    this.timerObject = opts.timer || window;
    this.timerStock = {};
  }

  Absoduler.prototype._wrapSocket = function (socket) {
    var __original_onmessage = socket.onmessage;
    var that = this;
    socket.onmessage = function (wsmessage) {
      var msg;
      if ( msg = that.unpack(wsmessage) ) {
        if ( 'pong' === msg.type ) {
          that.onPong(msg);
        }
        else {
          that.scheduleDispatch(msg);
        }
      }
      else {
        return __original_onmessage.call(socket, arguments);
      }
    }
  };

  Absoduler.prototype._pack = function (msg) {
    var wsmessage, msgjson;
    msgjson = JSON.stringify(msg);
    wsmessage = this.schema + msgjson;
    return wsmessage;
  };

  Absoduler.prototype._unpack = function (wsmessage) {
    var msgjson, msg;
    if ( this.schemaRegex.test(msg) ) {
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

  Absoduler.prototype._send = function (msg) {
    this.socket.send(msg);
  };

  /*
    Ping
      type: ping
      b: client side begin time in epoch(ms)
   */
  Absoduler.prototype.ping = function () {
    var begin = (new Date()).getTime();
    var msg = JSON.stringify({ type: 'ping', b: begin });
    this._send(msg);
  };

  /*
    Pong Message: {
      type: pong
      b: begin time in epoch(ms) (just a echo from server)
      s: server side time the ping have received, in epoch(ms)
    }
    And take the pong received time as e, then we should
    stock: {
        l ( latency )    : ( e - b ) / 2
        d ( delay time ) : s - ( b + l )
    }
   */

  Absoduler.prototype.onPong = function (msg) {
    var end = (new Date()).getTime();
    var begin = parseInt(msg.b);
    var serverTime = parseInt(msg.s);
    var latency = (end - begin) / 2;
    var delay = serverTime - begin + latency;
    var pong = {
      b: begin,
      l: latency,
      d: delay
    };
    this.pongs.push(pong);
    while ( this.maxPongs < this.pongs.length ) {
      if ( !this.initialized ) {
        this.initialized = true;
        this.finishInitialize();
      }
      this.pongs.shift();
    }
    if ( this.initialized ) {
      this.calculateDelay();
    }
  };

  // In my experience, the most quick response is
  // better to use.
  Absoduler.prototype.calculateDelay = function () {
    // This couldn't work if latency is over an hour ;)
    var min_latency = 3600000
      , delay
      , i
      , pongs = this.pongs
      , len = pongs.length;
    for ( i=0;i<len,i++ ) {
      if ( pongs[i].l < min_latency ) {
        delay = pongs[i].d
      }
    }
    this.delay = delay;
  };

  Absoduler.prototype.finishInitialize = function () {
    // this.emit('initialized');
  };

  Absoduler.prototype.scheduleDispatch = function (msg) {
    var after;
    var that = this;
    if ( msg.after ) {
      after = parseInt(msg.after) - this.delay;
    }
    else if ( msg.at ) {
      var now = ( new Date() ).getTime();
      after = (parseInt(msg.at) - now) - this.delay;
    }
    this.timerStock.push(
      this.timerObject.setTimeout( function() {
        that.dispatch(msg);
      }, after));
  };

  Absoduler.prototype.dispatch = function (msg) {
    this.emit(msg.type);
  };

  Absoduler.prototype.on = function () {
    
  };

  Absoduler.clearAllTimer = function () {
    for ( var tid in this.timerStock ) {
      this.timerObject.clearTimeout(tid);
    }
  };

  if ( 'undefined' !== typeof module ) {
    module.exports = Absoduler;
  }
  if ( 'undefined' !== typeof window ) {
    window.Absoduler = Absoduler;
  }
})();
