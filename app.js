var SerialPort = require("serialport");
var http = require('http');   
var express = require('express'); 
var sio = require('socket.io'); 
var path = require('path');  
var fs = require('fs');
var ejs = require('ejs');

var app = express();  //创建express实例

// 环境变量
// app.set('views', __dirname + 'public/views');
// app.engine('.html', ejs.__express);
// app.set('view engine', 'html');

//设置public文件夹为静态资源文件夹
app.use(express.static(path.join(__dirname, 'public'))); 

// 设置路由
app.get('/', function (req, res) {
    //设置路由，当客户端请求'/'时，发送文件index.html
    res.sendFile(__dirname + 'public/index.html');
});

// 建立静态服务器
var server = http.createServer(app);
server.listen(3000, function() {
    console.log('node server start at http://localhost:3000');
});






