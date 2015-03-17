( function () {

  var EventEmitter = require('events').EventEmitter
    , util = require('util');

  function Room (opts) {
    if ( !opts ) opts = {};
    this.primaryKey = opts.pk || 'id';
    this.members = {};
    this.length = 0;
  }
  util.inherits(Room, EventEmitter);

  Room.prototype.join = function (member) {
    var id = member[this.primaryKey];
    if ( 'undefined' === typeof id ) {
      throw('member must have primaryKey');
    }
    this.members[id] = member;
    this.length++;
    this.emit('join', member);
  };
  Room.prototype.leave = function (member) {
    var id = member[this.primaryKey];
    if ( 'undefined' === typeof id ) {
      throw('member must have primaryKey');
    }
    delete this.members[id];
    this.length--;
    this.emit('leave', member);
    if ( !this.length ) {
      this.emit('empty');
    }
  };
  Room.prototype.each = function ( fn ) {
    var that = this;
    for ( var k in this.members ) {
      fn.apply(this.members[k]);
    }
  };
  module.exports = Room;
})();
