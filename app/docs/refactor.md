### 重构
- [x]使用模板hbs
- 使用es6, node重构项目


express几个点
- 路由配置
    express启动了路由系统后，所有的连接都会是从配置中读取并执行。由配置决定渲染哪个文件。指定路径->渲染文件。
- 模板系统hbs
    1. layout.hbs是基本模板
    2. 用{{> template}}来引用其他模板文件


node有服务器和客户端的分别

需要web服务器，使用httpServer
不需要web服务器

### 客户端和服务器
html页面在web浏览器上加载，无法使用 require这种node的模式，属于客户端执行，只能使用script标签引用
    <script src = "xxx.js"></script>
Commonjs的写法

在服务器端使用，作为服务器，可以使用require使用
    require('jquery');

### 小技巧
- nodejs 引用jquery和bootstrap的方法

    var $ = require('jquery');
    global.jQuery = $;
    var bootstrap = require('bootstrap');



- npm start multiple commands 执行多条指令，用|分隔

    "start": "node app/app.js | electron ."

- electron 加载本地文件

        const electron = require('electron')
        const BrowserWindow = electron.BrowserWindow
        mainWindow = new BrowserWindow({width: 1280, height: 800})
        mainWindow.loadURL(`file://${__dirname}/app/views/index`)

- electron 加载网址

        const { BrowserWindow } = require('electron');
        mainWindow = new BrowserWindow({width: 1280, height: 800})
        mainWindow.loadURL('http://localhost:3003')

- // Open the DevTools.
  mainWindow.webContents.openDevTools()

- electron 加载jquery和bootstrap

    <script src="vendors/jquery-2.1.3.min.js" onload="$ = jQuery = module.exports;"></script>

    或者（推荐下面，兼容electron和web浏览器）

    <script>if (typeof module === 'object') {window.module = module; module = undefined;}</script>
    <script src="vendors/jquery-2.1.3.min.js"></script>
    <script>if (window.module) module = window.module;</script>

- electron 打包
