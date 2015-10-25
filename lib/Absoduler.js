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
    this.maxPongs = 16;
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
      this.connect(opts);
    }
    else {
      this.socket = this.Absodulerize(opts.socket, opts.fallback);
    }
    this.startInitialize();
  }

  Absoduler.prototype.Absodulerize = function(socket,fallback) {
    if (this.isNode) {
      return this._absodulerizeNode(socket,fallback);
    }
    else {
      return this._absodulerizeBrowser(socket,fallback);
    }
  };

  Absoduler.prototype._absodulerizeNode = function(socket) {
    this.constructor.NodeAbsodulerize.call(this,socket,this.serialize);
  };

  Absoduler.prototype._absodulerizeBrowser = function (socket,fallback) {
    var that = this;
    socket.onmessage = function (wsmessage) {
      var msg = that.serialize.unpack(wsmessage);
      if (!msg) throw("Unknown message");
      if ( msg.w ) {
        if ( fallback ) {
          return fallback(msg.w);
        }
        return;
      }
      return that.handler(that.socket, msg);
    };
    socket._abdl_original_send = socket.send;
    socket.send = function (wspayload, flags, callback) {
      socket._abdl_original_send(that.serialize.pack({ w: wspayload }));
    };
    socket.send_abdl = function (obj) {
      return socket._abdl_original_send(that.serialize.pack(obj));
    };
  };

  Absoduler.prototype.handler = function(ws,msg) {
    if(msg.t === 'pong' ) {
      this.onPong(msg);
    }
    else {
      this.scheduleDispatch(msg);
    }
  };

  Absoduler.prototype.connect = function (opts) {
    return this.isNode ? this._connectNode(opts) : this._connectBrowser(opts);
  };

  Absoduler.prototype._connectNode = function (opts) {
    var that = this;
    this.socket = new this.WebSocket(opts.server);
    this.socket.on('open', function () {
    });
    this.socket.on('error', function (error) {
      if ( that.initimer ) {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
      }
      console.error('socket has closed by error: ', error);
    });
    this.Absodulerize(this.socket,opts.fallback);
  };

  Absoduler.prototype._connectBrowser = function (opts) {
    var that = this;
    this.socket = new this.WebSocket(opts.server);
    this.socket.onopen = function () {
    };
    this.socket.onerror = function (wsmessage) {
      if ( that.initimer ) {
        that.timerObject.clearInterval(that.initimer);
        that.initimer = null;
      }
      console.error('socket has closed by error');
    };
    this.Absodulerize(this.socket, opts.fallback);
  };

  /*
    Ping
      t: ping
      b: client side begin time in epoch(ms)
   */
  Absoduler.prototype.ping = function () {
    var begin = (new Date()).getTime();
    this.socket.send_abdl({t:'ping',b:begin});
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
    // Sometime happen when testing in local
    if ( minrtt <= 0 ) {
      this.offset = 0;
      return;
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
    if ( msg.a ) {
      var now = ( new Date() ).getTime();
      after = (parseInt(msg.a) - now) - this.offset;
    }

    var timer = this.timerObject.setTimeout( function() {
      that.dispatch(msg);
    }, after);
    this.timerStock[timer] = 1;
  };

  Absoduler.prototype.dispatch = function (msg) {
    this.emit(msg.t, msg.d);
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

  var proxies = { open: 1, message: 1, close: 1 };
  Absoduler.prototype.on = function (type,fn) {
    if ( this.isNode && proxies[type] ) {
      this.socket.on(type,fn);
    }
    var stock = this.handlers[type];
    if ( 'undefined' === typeof stock ) {
      this.handlers[type] = stock = {};
    }
    stock[fn] = fn;
  };

  Absoduler.prototype.off = function (type,fn) {
    if ( this.isNode && proxies[type] ) {
      this.socket.off(type,fn);
    }
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
