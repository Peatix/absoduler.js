# Absoduler.js

Absolute scheDuler - event scheduler for multiple devices with synchronized in absolute time.

## Synopsys

```
// In browser
var abdl = new Absoduler('ws://example.com:9801/');
abdl.on('blah', function () {
  console.log('baah');
});

// In server
var AbsodulerServer = require('Absoduler').Server;
var abdls = new AbsodulerServer({ port: 9801 });

// send an event, then it fires on every clients at same time
abdls.broadcast({
  type: blah,
  after: 1000
});
```

## Description

Absoduler is a thin websocket wrapper which provides a way to fire events in any clients, scheduled in absolute time ( not on their machin time, but synchronized in real-time).

## Disclaimer

This software is still alpha quality. We may change APIs without notice.

## Author

[Peatix Inc.](http://peatix.com/)

## License

*TBA*

