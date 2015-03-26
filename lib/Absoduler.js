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
    if ( 'undefined' === opts.server
      && 'undefined' === opts.socket ) {
      throw('option server or socket is required');
    }
    this.pongs = [];
    this.maxPongs = 8;
    this.initialized = false;
    this.schema = 'absop:';
    this.schemaRegex = /^absop:/;
    this.timerObject
      = opts.timer                    ? opts.timer
      : 'undefined' !== typeof window ? window
      : 'undefined' !== typeof global ? global
      : null
      ;
    if ( ! this.timerObject ) {
      throw('No timer found');
    }
    this.WebSocket
      = opts.WebSocket                   ? opts.WebSocket
      : 'undefined' !== typeof WebSocket ? WebSocket
      :                                    _find_ws()
      ;
    if ( ! this.WebSocket ) {
      throw('No WebSocket found');
    }
    if ( this.WebSocket.Sender ) {
      this.isNode = true;
    }
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
  };

  Absoduler.prototype._onMessage = function (wsmessage) {
    var msg;
    if ( msg = this._unpack(wsmessage) ) {
      if ( 'pong' === msg.type ) {

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
      var msg;
      if ( msg = that._unpack(wsmessage.data) ) {
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
    if ( this.schemaRegex.test(wsmessage) ) {
      msgjson = wsmessage.replace(this.schemaRegex,'');
      if ( this.isNode && typeof msgjson !== 'string' ) {
        msg = msgjson;
      }
      else {
        msg = JSON.parse(msgjson);
      }
    }
    else {
      throw('unrecognizable message');
    }
    return msg;
  };

  Absoduler.prototype._send = function (msg) {
    if ( this.socket.readyState !== 1 ) return;
    this.socket.send(this._pack(msg));
  };

  /*
    Ping
      type: ping
      b: client side begin time in epoch(ms)
   */
  Absoduler.prototype.ping = function () {
    var begin = (new Date()).getTime();
    this._send({type:'ping',b:begin});
  };

  /*
    Pong Message: {
      type: pong
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
    Absoduler.prototype.calculateOffsetByWeightedAverage.apply(this,arguments);
  };

  // In my experience, the most quick response is
  // better to use.
  Absoduler.prototype.calculateOffsetFastest = function () {
    // This couldn't work if rtt is over an hour ;)
    var min_rtt = 3600000
      , offset
      , i
      , pongs = this.pongs
      , len = pongs.length;
    for ( i=0;i<len;i++ ) {
      if ( pongs[i].r < min_rtt ) {
        min_rtt = pongs[i].r;
        offset = pongs[i].o
      }
    }
    this.offset = offset;
  };

  // from variance
  Absoduler.prototype.calculateOffsetVariance = function () {
    var sumRtt = 0
      , sumOffset = 0
      , pongs = this.pongs
      , i
      , len = pongs.length;
    for ( i=0;i<len;i++ ) {
      sumRtt += pongs[i].r;
      sumOffset += pongs[i].o;
    }
    var avgRtt = sumRtt / len;
    var avgOffset = sumOffset / len;
    var sumVariRtt = 0;
    var sumVariOffset = 0;
    for ( i=0;i<len;i++ ) {
      sumVariRtt += Math.pow(pongs[i].r - avgRtt, 2);
      sumVariOffset += Math.pow(pongs[i].o - avgOffset, 2);
    }
    var variRtt = sumVariRtt / len;
    var variOffset = sumVariOffset / len;
    var stdDevRtt = Math.sqrt(variRtt);
    var stdDevOffset = Math.sqrt(variOffset);
    this.offset = avgOffset;
  };

  // Average version;
  Absoduler.prototype.calculateOffsetAvg = function () {
    // This couldn't work if rtt is over an hour ;)
    var rtt = 0
      , offset = 0
      , i
      , pongs = this.pongs
      , len = pongs.length;
    for ( i=0;i<len;i++ ) {
      offset += pongs[i].o;
    }
    this.offset = offset/len;
  };

  // Average of offset weighted by rtt;
  Absoduler.prototype.calculateOffsetByWeightedAverage = function () {
    // This couldn't work if rtt is over an hour ;)
    var minrtt = 3600000
      , rtt = 0
      , i
      , pongs = this.pongs
      , len = pongs.length
      , sumOffset = 0
      , weight = 0
      , totalWeight = 0
      ;
    // find min rtt
    for ( i=0;i<len;i++ ) {
      if ( pongs[i].r < minrtt ) {
        minrtt = pongs[i].r;
      }
    }

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
    var i = 0;
    var that = this;
    for (;i<n;i++) {
      (function (j) {
        that.timerObject.setTimeout( function () {
          that.ping();
        }, j * 50);
      })(i);
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
    this.emit(msg.type, msg);
  };

  Absoduler.prototype.clearAllTimer = function () {
    for ( var tid in this.timerStock ) {
      this.timerObject.clearTimeout(tid);
    }
  };

  // event
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
