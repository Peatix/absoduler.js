(function () {
  function _find_ws(){
    var ws;
    try {
      ws = require('ws');
    }
    catch (e) {}
    return ws;
  }

  function Absoduler (opts) {
    if ( 'undefined' === opts ) {
      throw('option is not given');
    }
    if ( 'undefined' === opts.server &&
         'undefined' === opts.socket ) {
      throw('option server or socket is required');
    }
    this.pongs = [];
    this.maxPongs = 8;
    this.initialized = false;
    this.timerObject =
      opts.timer                    ? opts.timer :
      'undefined' !== typeof window ? window     :
      'undefined' !== typeof global ? global     : null;

    if ( ! this.timerObject ) {
      throw('No timer found');
    }
    this.WebSocket =
      opts.WebSocket                   ? opts.WebSocket :
      'undefined' !== typeof WebSocket ? WebSocket      : _find_ws();

    if ( ! this.WebSocket ) {
      throw('No WebSocket found');
    }

    // TODO: look for more good way to detect
    if ( this.WebSocket.Sender ) {
      this.isNode = true;
    }

    this.serialize = Absoduler.Serialize.JSON;
    this.handlers = {};
    this.timerStock = {};
    if ( opts.server ) {
      if ( this.isNode ) {
        this.connectWebSocketNode(opts);
      }
      else {
        this.connectWebSocket(opts);
      }
    }
    else {
      this.socket = this._wrapSocket(opts.socket);
    }
    this.startInitialize();
  }

  Absoduler.prototype._onMessage = function (wsmessage) {
    var msg = this.serialize.unpack(wsmessage);
    if ( msg ) {
      if ( 'pong' === msg.t ) {
        this.onPong(msg);
      }
      this.scheduleDispatch(msg);
    }
    else {
      throw('Unexpected message');
    }
  };

  Absoduler.prototype.connectWebSocketNode = function (opts) {
    var that = this;
    this.socket = new this.WebSocket(opts.server);
    this.socket.on('open', function () {
    });
    this.socket.on('message', function (data,flags) {
      Absoduler.prototype._onMessage.apply(that,arguments);
    });
    this.socket.on('error', function (error) {
      if ( that.initimer ) {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
      }
      console.error('socket has closed by error: ', error);
    });
  };

  Absoduler.prototype.connectWebSocket = function (opts) {
    var that = this;
    this.socket = new this.WebSocket(opts.server);
    this.socket.onopen = function () {
    };
    this.socket.onmessage = function () {
      Absoduler.prototype._onMessage.apply(that,arguments);
    };
    this.socket.onerror = function (wsmessage) {
      if ( that.initimer ) {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
      }
      console.error('socket has closed by error');
    };
  };

  Absoduler.prototype._wrapSocket = function (socket) {
    var __original_onmessage = socket.onmessage;
    var that = this;
    socket.onmessage = function (wsmessage) {
      var msg = that.serialize.unpack(wsmessage.data);
      if ( msg ) {
        if ( 'pong' === msg.t ) {
          that.onPong(msg);
        }
        else {
          that.scheduleDispatch(msg);
        }
      }
      else {
        return __original_onmessage.call(socket, arguments);
      }
    };
  };

  Absoduler.prototype._send = function (msg) {
    if ( this.socket.readyState !== 1 ) {
      throw ('cannot send message until connection has created');
    }
    this.socket.send(this.serialize.pack(msg));
  };

  /*
    Ping
      t: ping
      b: client side begin time in epoch(ms)
   */
  Absoduler.prototype.ping = function () {
    var begin = (new Date()).getTime();
    this._send({t:'ping',b:begin});
  };

  /*
    Pong Message: {
      t: pong
      b: begin time in epoch(ms) (just a echo from server)
      s: server side time the ping have received, in epoch(ms)
    }
    And take the pong received time as e, then we should
    stock: {
        r ( round trip time)    : ( e - b ) / 2
        o ( offset ) : s - b + l
    }
   */

  Absoduler.prototype.onPong = function (msg) {
    var end = (new Date()).getTime();
    var begin = parseInt(msg.b);
    var serverTime = parseInt(msg.s);
    var rtt = (end - begin) / 2;
    var offset = serverTime - begin + rtt;
    var pong = {
      b: begin,
      r: rtt,
      o: offset
    };
    this.pongs.push(pong);
    if ( this.maxPongs <= this.pongs.length ) {
      while ( this.maxPongs < this.pongs.length ) {
        this.pongs.shift();
      }
      if ( !this.initialized ) {
        this.initialized = true;
        this.finishInitialize();
      }
      if ( this.initialized ) {
        this.calculateOffset();
      }
    }
  };

  Absoduler.prototype.calculateOffset = function () {
    // This couldn't work if rtt is over an hour ;)
    var minrtt = 3600000,
      rtt = 0,
      i,
      pongs = this.pongs,
      len = pongs.length,
      sumOffset = 0,
      weight = 0,
      totalWeight = 0;

    // find min rtt
    for ( i=0;i<len;i++ ) {
      if ( pongs[i].r < minrtt ) {
        minrtt = pongs[i].r;
      }
    }

    // Calcurate weight ( ratio against min rtt )
    // TODO: continue pings if not enough trustful data.
    for ( i=0;i<len;i++ ) {
      weight = minrtt / pongs[i].r;
      sumOffset += pongs[i].o * weight;
      totalWeight += weight;
    }
    this.offset = sumOffset/totalWeight;
  };

  Absoduler.prototype.startInitialize = function () {
    var that = this;
    this.initimer = this.timerObject.setInterval( function () {
      if ( that.socket.readyState === 0 ) {
        console.log('waiting...');
      }
      else if ( that.socket.readyState === 1 ) {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
        that._initialize();
      }
      else {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
        throw('socket has closed');
      }
    },100);
  };

  Absoduler.prototype._initialize = function () {
    this.sendPings(this.maxPongs);
  };

  // Burst
  Absoduler.prototype.sendPings = function (n) {
    var i = 0, that = this;
    var doPing = function () { that.ping(); };
    for (;i<n;i++) {
      that.timerObject.setTimeout( doPing, i*50 );
    }
  };

  Absoduler.prototype.finishInitialize = function () {
    this.emit('initialized');
    var that = this;
    this.updatePingTimer = this.timerObject.setInterval(
      function () {
        that.sendPings(that.maxPings / 2);
    }, 5000);
  };

  Absoduler.prototype.scheduleDispatch = function (msg) {
    var after = 0;
    var that = this;
    if ( msg.at ) {
      var now = ( new Date() ).getTime();
      after = (parseInt(msg.at) - now) - this.offset;
    }

    var timer = this.timerObject.setTimeout( function() {
      that.dispatch(msg);
    }, after);
    this.timerStock[timer] = 1;
  };

  Absoduler.prototype.dispatch = function (msg) {
    this.emit(msg.t, msg);
  };

  Absoduler.prototype.clearAllTimer = function () {
    for ( var tid in this.timerStock ) {
      this.timerObject.clearTimeout(tid);
    }
  };

  // event : too simple emulation of EventEmitter style ;)
  Absoduler.prototype.emit = function (type,msg) {
    var stock = this.handlers[type];
    if ( 'undefined' === typeof stock ) return;
    for (var fn in stock) {
      stock[fn].call(this,msg);
    }
  };

  Absoduler.prototype.on = function (type,fn) {
    var stock = this.handlers[type];
    if ( 'undefined' === typeof stock ) {
      this.handlers[type] = stock = {};
    }
    stock[fn] = fn;
  };

  Absoduler.prototype.off = function (type,fn) {
    var stock = this.handlers[type];
    if ( 'undefined' === typeof stock ) return;
    delete stock[fn];
  };

  Absoduler.prototype.close = function () {
    this.ws.close();
  };

  if ( 'undefined' !== typeof module ) {
    module.exports = Absoduler;
  }

  if ( 'undefined' !== typeof window ) {
    window.Absoduler = Absoduler;
  }
})();
