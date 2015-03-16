var Hotel = require('../lib/Hotel')
  , plan = require('./testutil').plan
  ;
require('should');

describe('Hotel', function () {
  it('can add object to specified room', function () {
    var hotel = new Hotel();
    var boss = {name: "Taku", id: 1};
    hotel.addMemberTo('room1', boss);
    hotel.should.have.property('rooms');
    hotel.rooms.should.have.property('room1');
  });
  describe('join to room', function () {
    var hotel = new Hotel();
    var boss = {name: "Taku", id: 1};
    hotel.should.have.property('rooms');
    hotel.rooms.should.be.empty;
    plan(1).it('can add member', function (done) {
      hotel.on('createroom', function (roomname, room) {
        roomname.should.equal('peatix');
        hotel.should.be.length(1);
        done();
      });
      hotel.addMemberTo('peatix',boss);
    });

  });
  describe('leave from room', function () {
    var hotel = new Hotel();
    var boss = {name: "Taku", id: 1};
    hotel.should.have.property('rooms');
    hotel.rooms.should.be.empty;
    plan(2).it('can leave member', function (done) {
      hotel.on('createroom', function (roomname, room) {
        roomname.should.equal('peatix');
        hotel.should.be.length(1);
        done();
      });
      hotel.on('deleteroom', function (roomname, room) {
        roomname.should.equal('peatix');
        hotel.should.be.length(0);
        done();
      });
      hotel.addMemberTo('peatix',boss);
      setTimeout(function() {
        hotel.leaveMemberFrom('peatix', boss);
      }, 20);
    });
  });
});
