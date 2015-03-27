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

abdls.on('connected', function (ws) {
  ws.sendEvent('blah', 1000, {'additional': 'informations'});
});
```

## Description

Absoduler is a thin websocket wrapper which provides a way to fire events in any clients, scheduled in absolute time ( not on their machine time, but synchronized in real-time).

### WebSocket Transparency

Absoduler is designed to keep transpaarency for WebSocket, so It's easy to implement synced event into existing applications.


## Disclaimer

This software is still alpha quality. We may change APIs without notice.

## Author

[Peatix Inc.](http://peatix.com/)

## License

*TBA*

