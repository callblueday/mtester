var SerialPort = require("serialport");
var http = require('http');
var express = require('express');
var sio = require('socket.io');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var ServoControl = require('./source/servoControl');
var control = require('./source/mboardControl');

/**
 * 设置环境变量
 * @type {[type]}
 */
var app = express();  //创建express实例
//设置public文件夹为静态资源文件夹
app.use(express.static(path.join(__dirname, 'public')));
// 设置路由
app.get('/', function (req, res) {
    //设置路由，当客户端请求'/'时，发送文件index.html
    res.sendFile(__dirname + 'public/index.html');
});


/**
 * 建立http服务器
 */
var httpServer = http.createServer(app);
httpServer.listen(3003, function() {
    console.log('node server start at http://localhost:3003');
});


// 定义全局变量，存储socket对象, 和serialPort对象
var globalSocketIO;
var serialPort;
var serialInfo = {
    comName: '/dev/cu.wchusbserial1480'
};
var _deviceType = "board"; // 设备类型

/**
 * 建立 socket.io链接
 * socket 监听的是一个http server.
 */
var io = require('socket.io').listen(httpServer);
io.sockets.on('connection', function (socket) {
    globalSocketIO = socket;
    control.socket = globalSocketIO;
    console.log('与客户端的命令连接通道已经建立');

    /* 输出串口列表 */
    SerialPort.list(function (err, ports) {
        for(var i = 0; i < ports.length; i++) {
            console.log(ports[i].comName);
            serials_to_web(ports[i].comName);
        }
    });

    // 打开串口
    openSerial();


    // 从客户端接收数据
    socket.on('fromWebClient', function (webClientData) {

        socket.emit('pushToWebClient', webClientData);

        var type = webClientData.type;
        var data = webClientData.params;


        if(type == 'deviceType') {
            _deviceType = data;
            console.log(_deviceType);
        }

        if(type == 'setSpeed') {
            var leftSpeed = parseInt(data[0]);
            var rightSpeed = parseInt(data[1]);
            control.setSpeed(leftSpeed, rightSpeed);
        }

        // set led
        if(type == 'led') {
            var r = parseInt(data[0]);
            var g = parseInt(data[1]);
            var b = parseInt(data[2]);
            var position = parseInt(data[3]);
            control.setLed(r, g, b, position);
        }

        // set serialData
        if(type == 'serialData') {
            control.sendRequest(data);
        }

        // play tone
        if(type == 'playTone') {
            control.playTone(data);
        }

        // set motor
        if(type == 'dcMotor') {
            control.setDcMotor(data[0], data[1]);
        }

        // ultrasonic
        if(type == 'ultrasonic') {
            var port = parseInt(data[0]);
            var val = control.getUltrasonicValue(port, function(value) {
                var data = {
                    type: 'ultrasonic',
                    value: value
                };
                globalSocketIO.emit('serialportData-receive-data', data);
            });
        }

        // line Follow
        if(type == 'lineFollow') {
            var port = parseInt(data[0]);
            var val = control.getLineFollowValue(port, function(value) {
                var data = {
                    type: 'lineFollow',
                    value: value
                };
                globalSocketIO.emit('serialportData-receive-data', data);
            });
        }

        // light sensor
        if(type == 'lightSensor') {
            var port = parseInt(data[0]);
            var val = control.getLightSensorValue(port, function(value) {
                var data = {
                    type: 'lightSensor',
                    value: value
                };
                globalSocketIO.emit('serialportData-receive-data', data);
            });
        }
    });

    // 监听web页面中串口配置信息的更改
    socket.on('open_serial', function(data) {
        serialInfo = data;
        globalSocketIO.emit('serial_state', "close");
        openSerial();
    });


    // 客户端断开连接
    socket.on('disconnect', function () {
        console.log('DISCONNECTED FROM CLIENT');
    });
 });

/**
 * ------------
 * 串口配置相关
 * ------------
 */

/**
 * 创建串口
 */
function openSerial(type) {
    var comName = serialInfo.comName;

    var SerialPort = require("serialport").SerialPort;
    // serialPort = new SerialPort("/dev/cu.Makeblock-ELETSPP", {
    serialPort = new SerialPort(comName, {
      baudrate: 115200
    }, false); // this is the openImmediately flag [default is true]

    serialPort.open(function (error) {
      if ( error ) {
        console.log('端口打开失败: ' + error);
        globalSocketIO.emit('serial_state', "close");
      } else {
        console.log('端口打开成功...');
        globalSocketIO.emit('serial_state', "open");
        control.serialPort = serialPort;

        serialPort.on('data', function(data) {
            // globalSocketIO.emit('log', data);

            if(_deviceType == 'servo') {
                // 舵机相关处理
                var servoControl = new ServoControl(data, globalSocketIO);
                servoControl.decodeData(data);
            } else {
                // mainboard 接收数据并进行解析
                control.decodeData(data);
            }
        });
      }
    });
}

// 发送串口号
function serials_to_web(data) {
    globalSocketIO.emit('serials_to_web', data);
}