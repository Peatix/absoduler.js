var AbsodulerServer = require('../lib/AbsodulerServer')
  , Absoduler = require('../lib/Absoduler')
  , plan = require('./testutil').plan
  ;
require('should');

describe('AbsodulerServer', function () {
  plan(1).it('run without exception', function (done) {
    var server;
    (function() {
      server = new AbsodulerServer({port:8087})
    }).should.not.throw();
    setTimeout(function () {
      server.close();
      done();
    }, 1000);
  });

  describe('connect', function () {
    context.prototype.plan = function (t){console.log(t)};
    plan(3).it('can connect', function (done) {
      this.timeout(8000); // Wait synchronize
      var server;
      (function() {
        server = new AbsodulerServer({port:8087})
      }).should.not.throw();
      setTimeout(function () {
        server.broadcast({ type: 'foo', after: 1500 });
        setTimeout( function () { server.close() }, 2000 );
        done();
      }, 2000);

      setTimeout( function () {
        cli = new Absoduler({ server: 'ws://localhost:8087/' });
        cli.on('initialized', function () {
          done();
        });
        cli.on('foo', function () {
          done();
        });
      }, 1000);
    });
  });
});
