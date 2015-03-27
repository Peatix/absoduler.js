(function () {

  // XXX: now customizing ws object dynamically.
  //      is it more safer if to make wrapper object?
  function NodeAbsodulerize (ws,serializer) {
    var i,len, that = this, existingHandlers;
    ws._abdl_original_send = ws.send;
    ws.send = function (wspayload, flags, callback) {
      return ws._abdl_original_send(serializer.pack({ w: wspayload }), flags, callback);
    };
    ws.send_abdl = function(obj) {
      return ws._abdl_original_send(serializer.pack(obj));
    };

    // Delegate message handler
    existingHandlers = ws.listeners('message');
    ws.removeAllListeners('message');
    len = existingHandlers.length;
    for ( i=0;i<len;i++ ) {
      ws.on('nonAbsodulerMessage', existingHandlers[i]);
    }
    ws._abdl_original_on = ws.on;
    ws.on('message', function(wsmessage, flags) {
      var msg = serializer.unpack(wsmessage);
      if ( msg.w ) {
        return ws.emit('nonAbsodulerMessage', msg.w, flags);
      }
      return that.handler(ws,msg);
    });

    ws.on = function(event, listener) {
      if (event === 'message') event = 'nonAbsodulerMessage';
      ws._abdl_original_on(event,listener);
    };
  }

  module.exports = NodeAbsodulerize;
})();
