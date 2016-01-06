var SerialPort = require("serialport");
var http = require('http');
var express = require('express');
var sio = require('socket.io');
var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
// var server = require('./source/server');


var globalSocketIO;


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
httpServer.listen(3000, function() {
    console.log('node server start at http://localhost:3000');
});


/**
 * 创建串口通信
 * control mbot
 */
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/cu.Makeblock-ELETSPP", {
  baudrate: 115200
}, false); // this is the openImmediately flag [default is true]

serialPort.open(function (error) {
  if ( error ) {
    console.log('端口打开失败: ' + error);
  } else {
    console.log('端口打开成功...');

    serialPort.on('data', function(data) {
        // 接收数据并进行解析
        decodeData(data);
    });
  }
});



/**
 * 建立 socket.io链接
 * socket 监听的是一个http server.
 */
var io = require('socket.io').listen(httpServer);
io.sockets.on('connection', function (socketIO) {
    globalSocketIO = socketIO;
    // 从客户端接收数据
    socketIO.on('fromWebClient', function (webClientData) {

        socketIO.emit('pushToWebClient', webClientData);

        // var type = webClientData.type;
        // var data = webClientData.data;

        // if(type == 'speed') {
        //     var leftSpeed = parseInt(data[0]);
        //     var rightSpeed = parseInt(data[1]);
        //     console.log(leftSpeed + '-' + rightSpeed);
        //     setSpeed(leftSpeed, rightSpeed);
        // }

        // if(type == 'led') {
        //     setLed(data[0],data[1], data[2], data[3]);
        // }

        // if(type == 'buzzer') {
        //     var toneName = data[0];
        //     buzzer(toneName);
        // }

        // if(type == 'stopBuzzer') {
        //     stopBuzzer();
        // }

        // if(type == 'ultrasoinic') {
        //     doUltrasoinic();
        // }

        // if(type == 'stopUltrasoinic') {
        //     stopUltrasoinic();
        // }

        // if(type == 'lineFollow') {
        //     doLineFollow();
        // }

        // if(type == 'stopLineFollow') {
        //     stopLineFollow();
        // }

        // if(type == 'stopAll') {
        //     stopAll();
        // }

    });
    // 客户端断开连接
    socketIO.on('disconnect', function () {
        console.log('DISCONNECTED FROM CLIENT');
    });
 });


module.exports = {
    socketIO: globalSocketIO
};