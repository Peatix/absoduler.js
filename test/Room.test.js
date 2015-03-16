var Room = require('../lib/Room')
  , plan = require('./testutil').plan
  ;
require('should');

describe('Room', function () {
  describe('#join', function () {
    var room = new Room();
    var boss = { name: "Taku", id: 1 };
    room.should.have.property('members');
    room.members.should.be.empty;
    plan(1).it('can add member', function (done) {
      room.on('join', function () {
        room.should.have.property('members');
        room.members.should.have.property(1);
        room.members[1].should.eql(boss);
        done();
      });
      room.join(boss);
    });
  });
  describe('#leave', function () {
    var room = new Room();
    var boss = { name: "Taku", id: 1 };
    room.should.have.property('members');
    room.members.should.be.empty;
    plan(3).it('can add member', function (done) {
      var empty = 0;
      room.on('join', function (member) {
        room.should.have.property('members');
        room.members.should.have.property(1);
        room.members[1].should.eql(boss);
        room.should.be.length(1);
        empty.should.equal(0);
        done();
      });
      room.on('leave', function () {
        room.should.have.property('members');
        room.members.should.be.empty;
        room.should.be.length(0);
        empty.should.equal(0);
        done();
      });
      room.on('empty', function () {
        room.should.have.property('members');
        room.members.should.be.empty;
        room.should.be.length(0);
        empty = 1;
        done();
      });
      room.join(boss);
      setTimeout(function () {
        room.leave(boss);
      },10);
    });
  });
  describe('.primaryKey', function () {
    it('pk is id by default, and throw exception if not given', function () {
      var room = new Room();
      var boss = { name: "Taku", id: 1 };
      var nonEmployee = { name: "lestrrat" };
      (function () { room.join(boss) }).should.not.throw();
      (function () { room.join(nonEmployee) }).should.throw();
    });
    it('can change primary key', function () {
      var room = new Room({pk: '_id'});
      var boss = { name: "Taku", _id: 1 };
      var nonEmployee = { name: "lestrrat", id: 5 };
      (function () { room.join(boss) }).should.not.throw();
      (function () { room.join(nonEmployee) }).should.throw();
    });
  });
});
