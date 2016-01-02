var base = require('./base.js');
var config = require('/config.js');
var protocol = require('./protocol.js');
var action = require('./action.js');
var control = require('./control.js');
var data = require('./data.js');
var mockdata = require('/data.json');



/**
 * Create SerialPort
 */
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/cu.Makeblock-ELETSPP", {
  baudrate: 115200
}, false); // this is the openImmediately flag [default is true]

serialPort.open(function (error) {
  if ( error ) {
    mylog('open serialport failed: ' + error);
  } else {
    mylog('open serialport success...');

    setTimeout(function() {
        // start listen ultrasonic data
        doUltrasoinic();
    }, 500);

    serialPort.on('data', function(data) {
        decodeData(data);
        // console.log(data);
    });
  }
});

/**
 * Create http server.
 */
var http = require('http');
var url = require('url');

var LastUltrasonicValue = 0;
var LastPressureValue = 0;

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if(req.url == '/ultrasonic'){

      if(LastUltrasonicValue < 15 && LastUltrasonicValue > 0) {
          // you have forgotten something
          res.end('' + 1);
      } else {
          // there is nothing you forgot
          res.end('' + 0);
      }
    }

    if(req.url == '/weight'){
      if(LastPressureValue > 10000) {
          // there is rubbish
          res.end('' + 1);
        } else {
          // no rubbish here
          res.end('' + 0);
      }
    }
}).listen(9615);