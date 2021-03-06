( function () {
  var assert = require('assert');

  // Add done() counter to mocha.
  // Note: this works well for less invokes, but fails to check over calling
  // at end of test suites. If you need to make sure done calles exact times,
  // set some timer to wait for that.
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
                // TODO: describe what test fails.
                assert.fail('done was called much than planned');
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
