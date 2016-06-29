

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


var SerialPort = require("serialport");
var http = require('http');
var express = require('express');
var hbs = require('hbs');
var sio = require('socket.io');
var path = require('path');
var fs = require('fs');

var ServoControl = require('./app/server/servoControl');
var control = require('./app/server/mboardControl');

var expressApp = express();

hbs.registerPartials(__dirname + '/app/views/partials');

// set the view engine to use handlebars
expressApp.set('view engine', 'hbs');
expressApp.set('views', __dirname + '/app/views');

// 设置资源路径，例如css，js文件路径
expressApp.use(express.static(__dirname + '/app/public'));

// 设置路由
expressApp.get('/', function (req, res) {
    res.render('index');
});
expressApp.get('/board', function (req, res) {
    res.render('board');
});
expressApp.get('/resource', function (req, res) {
    res.render('resource');
});
expressApp.get('/servo', function (req, res) {
    res.render('servo');
});

/**
 * 建立http服务器
 */
var httpServer = http.createServer(expressApp);
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



/**
 * -------------------------
 *   electron
 * -------------------------
 */
const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
// const BrowserWindow = electron.BrowserWindow

const { BrowserWindow } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1280, height: 800})

  // and load the index.html of the app.
  // mainWindow.loadURL(`file://${__dirname}/app/views/index`)
  setTimeout(function() {
    mainWindow.loadURL('http://localhost:3003')
  }, 800);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

