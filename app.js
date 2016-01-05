var SerialPort = require("serialport"); //引入串口模块
var http = require('http');   //引入http模块
var express = require('express'); //引入express模块
var sio = require('socket.io'); //引入socket.io模块
var app = express();  //创建express实例
var path = require('path');  //引入path模块
var fs = require('fs');  //引入fs模块


// 建立静态服务器
var server = http.createServer(app);
server.listen(3000, function() {
    console.log('node server start at http://localhost:3000');
});

// 设置路由
app.use(express.static(path.join(__dirname, 'public'))); //设置public文件夹为静态资源文件夹
app.get('/', function (req, res) {
    //设置路由，当客户端请求'/'时，发送文件index.html
    res.sendFile(__dirname + 'public/index.html');
});



