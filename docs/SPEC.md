# PURPOSE/GOAL

To have a synchronized timer shared by one server and many clients.
The synchronization precisionaccuracy would be enough good to entertainment use (rough for scientific/computing/networking use).

# SYNC PHASES

## measure_offset

Old school ping/pong offset calculation.
* Client send pings a few times with timestamp.
* When server received a ping, echo that to client with own timestamp (pong)
* When client received a pong, calculate the offset.

```
   Slave           Master
     |     ping       |
     |--------------->|
     |                |
     |     pong       |
     |<---------------|
     |                |

     (repeat ping/pong)
            ...
```

## measure OWT

The calculated offset could have network up/down speeds' asymmetricity and jitter.
As some papers suggests, and my own experiment says, we can avoid jitters by repeating ping/pongs.
Next step, survey the network asynmmetricity by test unidirectional signal's time. It's similar to round trip time(RTT), but one way.
Here I call it One Way Time (OWT) and call a message to measure OWT `pung`.

```
     |                |
     | request pungs  |    request have a provisional offset.
     |--------------->|
     |                |
     |     pung       |    try to measure the time from master to slave ( t-ms )
     |<---------------|    each pung has { t: the time the server sent this message, e: the expected server time which calculated from provitional offset }
     |<---------------|
     |<---------------|
     |                |
     |                |
     | req reversal   |    request a task to watch and calcurate pung data
     |--------------->|
     |  pung ready    +    server create a test object and send pung ready
     |<---------------#
     |                #
     |     pung       #    try to measure the time from slave to master ( t-sm )
     |--------------->#    each pung has { t: the time the server sent this message, e: the expected server time which calculated from provitional offset }
     |--------------->#
     |--------------->#
     |  return result #
     |<---------------#
     |                |
```

## Verify values

Okay, now we have 3 provisional values. the offset, t-ms and t-sm. So we can test how these values' accuracy. So
We can build a ping/pong request to verify which includes

* client time to start senging ping
* expected server time receives ping message which calcurated by OWT t-sm
* expected client time receives pong message which calcurated by OWT t-ms

