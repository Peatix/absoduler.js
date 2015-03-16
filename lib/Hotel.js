( function () {

  var Room = require('./Room')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')
  ;

  function Hotel (opts) {
    if ( !opts ) opts = {};
    this.primaryKey = opts.pk || 'id';
    this.lounge = new Room();
    this.rooms = {};
    this.length = 0;
  }
  util.inherits(Hotel, EventEmitter);

  Hotel.prototype.createRoom = function (roomname) {
    var that = this;
    var room = this.rooms[roomname] = new Room();
    room.on('empty', function () {
      delete that.rooms[roomname];
      that.length--;
      that.emit('deleteroom', roomname, room);
    });
    this.length++;
    this.emit('createroom', roomname, room);
    return room;
  };

  Hotel.prototype.addMemberTo = function (roomname, member) {
    var room = this.rooms[roomname];
    if ( 'undefined' === typeof room ) {
      room = this.createRoom(roomname);
    }
    room.join(member);
  };
  Hotel.prototype.leaveMemberFrom = function (roomname, member) {
    var room = this.rooms[roomname];
    if ( 'undefined' === typeof room ) {
      throw('Cannot leave member from room which non-exists');
    }
    room.leave(member);
  };

  module.exports = Hotel;
})();
