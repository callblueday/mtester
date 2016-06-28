var SerialPort = require("serialport");
var http = require('http');
var express = require('express');
var hbs = require('hbs');
var sio = require('socket.io');
var path = require('path');
var fs = require('fs');

var ServoControl = require('./server/servoControl');
var control = require('./server/mboardControl');

var app = express();

hbs.registerPartials(__dirname + '/views/partials');

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

// 设置资源路径，例如css，js文件路径
app.use(express.static(__dirname + '/public'));

// 设置路由
app.get('/', function (req, res) {
    res.render('index');
});
app.get('/board', function (req, res) {
    res.render('board');
});
app.get('/resource', function (req, res) {
    res.render('resource');
});
app.get('/servo', function (req, res) {
    res.render('servo');
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
var serialInfo = {}; // comName: '/dev/cu.wchusbserial1480'
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

    // 输出串口列表
    showPortList();

    // 从客户端接收数据
    socket.on('fromWebClient', function (webClientData) {

        socket.emit('pushToWebClient', webClientData);

        var type = webClientData.type;
        var data = webClientData.params;

        // 监听web页面中设备类型的设定
        if(type == 'deviceType') {
            _deviceType = data;
            control.deviceInfo.type = data.params;

            // 设置主板类型
            control.setDeviceInfo({
                type: _deviceType
            });
            console.log(_deviceType);
        }

        // set serialData
        if(type == 'serialData') {
            control.sendRequest(data);
        }

        // 重新获取port口列表
        if(type == 'refreshPortList') {
            showPortList();
        }
    });

    // 监听web页面中串口配置信息的更改
    socket.on('open_serial', function(data) {
        serialInfo = data;

        if(serialPort && serialPort.isOpen()) {
            // 关闭port口
            closeSerial();
            globalSocketIO.emit('serial_state', "close");
        }

        // 重新打开
        if(serialInfo.comName != 0) {
            openSerial();
        }
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
 * 输出串口列表
 */
function showPortList() {
    SerialPort.list(function (err, ports) {
        var portArray = [];
        for(var i = 0; i < ports.length; i++) {
            // console.log(ports[i].comName);
            portArray.push(ports[i].comName);
        }
        serials_to_web(portArray);
    });
}

/**
 * 打开串口
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

            if(_deviceType == 'ybx' || _deviceType == 'mservo') {
                // 舵机相关处理
                var servoControl = new ServoControl(data, globalSocketIO);
                servoControl.decodeData(data);
            } else{
                // mainboard 接收数据并进行解析
                control.decodeData(data);
            }
        });
      }
    });
}

/**
 * 关闭串口
 */
function closeSerial() {
    serialPort.close();
    console.log('串口已经关闭...')
}

// 发送串口号
function serials_to_web(data) {
    globalSocketIO.emit('serials_to_web', data);
}