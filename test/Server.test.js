var Server = require('../lib/Server')
  , Absoduler = require('../lib/Absoduler')
  , plan = require('./testutil').plan
  ;
Absoduler.NodeAbsodulerize = require('../lib/Node')

Server.Serialize = Absoduler.Serialize = require('../lib/Serialize');
require('should');

describe('Absoduler.Server', function () {
  plan(1).it('run without exception', function (done) {
    var server;
    (function() {
      server = new Server({port:8087})
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
        server = new Server({port:8087})
      }).should.not.throw();
      setTimeout(function () {
        server.broadcast({ t: 'foo', after: 1500 });
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

  describe('Fallback', function () {
    context.prototype.plan = function (t){console.log(t)};
    plan(5).it('can fallback', function (done) {
      this.timeout(8000); // Wait synchronize
      var server;
      (function() {
        server = new Server({port:8088});
        server.on('connection', function(ws) {
          setTimeout( function () {
            ws.sendEvent('fire', 200);
            done();
          }, 2000);
          setTimeout( function () {
            ws.send('water');
            done();
          }, 2000);
        });
      }).should.not.throw();

      setTimeout( function () {
        cli = new Absoduler({ server: 'ws://localhost:8088/' });
        cli.on('initialized', function () {
          done();
        });
        cli.on('fire', function () {
          done();
        });
        cli.on('message', function (msg) {
          msg.should.equal('water');
          done();
        });
      }, 1000);
    });
  });

});
