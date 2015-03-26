( function () {
  var plan = function (times) {
    var that = this;
    return {
      it: function(title,fn) {
        if ( fn && fn.length ) {
          var wrappedFunc = function (done) {
            var funcCtx = this;
            var wrappedDone = function (err) {
              times--;
              if (err){
                done(err);
              }
              else if ( times <  0 ) {
                done('done was called much than planned');
              }
              else if ( times == 0 ) {
                done();
              }
            };
            return fn.call(funcCtx, wrappedDone);
          };
          // call mocha's it... there should be.
          return it.call(this,title,wrappedFunc);
        }
        else {
          throw('plan was used in non-async context');
        }
      }
    }
  };
  module.exports = {
    plan: plan
  };

})();
