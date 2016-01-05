// var base = require('./base.js');
// var config = require('/config.js');
// var protocol = require('./protocol.js');
// var action = require('./action.js');
var control = require('./control.js');
// var data = require('./data.js');
// var mockdata = require('/data.json');


/**
 * 创建node http服务器
 */
// var http = require('http');
// var app = http.createServer(function(req, res){
//   // do nothing.
// }).listen(function() {
//     console.log("服务器开始监听...");

// });

/**
 * Create SerialPort
 */
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/cu.Makeblock-ELETSPP", {
  baudrate: 115200
}, false); // this is the openImmediately flag [default is true]

serialPort.open(function (error) {
  if ( error ) {
    console.log('open serialport failed: ' + error);
  } else {
    console.log('open serialport success...');

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
// var http = require('http');
// var url = require('url');

// var LastUltrasonicValue = 0;
// var LastPressureValue = 0;

// http.createServer(function (req, res) {
//     console.log("服务器开始监听...");
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     if(req.url == '/ultrasonic'){

//       if(LastUltrasonicValue < 15 && LastUltrasonicValue > 0) {
//           // you have forgotten something
//           res.end('' + 1);
//       } else {
//           // there is nothing you forgot
//           res.end('' + 0);
//       }
//     }

//     if(req.url == '/weight'){
//       if(LastPressureValue > 10000) {
//           // there is rubbish
//           res.end('' + 1);
//         } else {
//           // no rubbish here
//           res.end('' + 0);
//       }
//     }
// }).listen(9615);



/**
 * 建立 socket.io链接
 */
var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socketIO) {
    globalSocketIO = socketIO;
    // 从客户端接收数据
    socketIO.on('fromWebClient', function (webClientData) {
        var type = webClientData.type;
        var data = webClientData.data;

        if(type == 'speed') {
            var leftSpeed = parseInt(data[0]);
            var rightSpeed = parseInt(data[1]);
            mylog(leftSpeed + '-' + rightSpeed);
            setSpeed(leftSpeed, rightSpeed);
        }

        if(type == 'led') {
            setLed(data[0],data[1], data[2], data[3]);
        }

        if(type == 'buzzer') {
            var toneName = data[0];
            buzzer(toneName);
        }

        if(type == 'stopBuzzer') {
            stopBuzzer();
        }

        if(type == 'ultrasoinic') {
            doUltrasoinic();
        }

        if(type == 'stopUltrasoinic') {
            stopUltrasoinic();
        }

        if(type == 'lineFollow') {
            doLineFollow();
        }

        if(type == 'stopLineFollow') {
            stopLineFollow();
        }

        if(type == 'stopAll') {
            stopAll();
        }

    });
    // 客户端断开连接
    socketIO.on('disconnect', function () {
        mylog('DISCONNECTED FROM CLIENT');
    });
 });

