( function () {
  var Serialize = {
    JSON: {
      unpack: function (wsmessage) {
        var msg;
        if ('string' === typeof wsmessage ) {
          msg = JSON.parse(wsmessage);
        }
        else if ('object' === typeof wsmessage && wsmessage.data ){
          msg = JSON.parse(wsmessage.data);
        }
        else if ( typeof wsmessage === 'object' ) {
          msg = wsmessage;
        }
        else {
          console.log('Unrecognizable Message', typeof wsmessage, wsmessage);
          throw('unrecognizable message');
        }
        return msg;
      },
      pack: function (msg) {
        return JSON.stringify(msg);
      }
    }
  };

  if ( 'undefined' !== typeof module ) {
    module.exports = Serialize;
  }

  if ( 'undefined' !== typeof window ) {
    window.Absoduler.Serialize = Serialize;
  }
})();
