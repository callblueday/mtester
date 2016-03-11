### steps note
- 基础知识点
    - nodejs
        - require 引用文件
        - exports 导出公共函数、变量
        - [x]module
            - 引用一个文件 require('./js/xx')
            - 模块初始化: 一个模块中的JS代码仅在模块第一次被使用时执行一次，并在执行过程中初始化模块的导出对象。之后，缓存起来的导出对象被重复利用
            - 把整个模块引出去，包含所有的方法，和变量。 JavaScript使用script标签引入JavaScript文件就可以访问其内容了，但这样带了的弊端很多，最大的就是作用域相同，产生冲突问题。
            - nodejs中一个文件就是一个模块。我们可以把模块中希望被外界访问的内容定义到exports对象中
    - socketio加深理解
        - socket分为client端和server端，两端都有发和收的动作
            - 发：socket.emit('keyword', data);
            - 收：socket.on('keyword', function(data){});
        - client 端通过script的js引用获取socket对象
            <script src="js/socket.io-1.3.7.js"></script>
            var socket = io.connect('192.168.3.146:3001');
        - server 端通过npm安装获取socket对象
            var io = require('socket.io').listen(httpServer);
            io.sockets.on('connection', function (socketIO) {
                // get socketIO and do something.
            })
    - 串口工具 serialPort 理解
        - 波特率
        - 停止位
        - 校验位
        - 停止 serialPort: serialPort.close()
        - serialport.write()

- []底层协议部分
    - [√]auriga
    - [√]mcore
    - [√]orion
    - zeroPI
- []socket 串口通信测试
- []页面测试框架搭建（了解底层过程实现）
    - 搭建node的静态服务器： http.createServer
    - 实现路由：nodejs更改默认文件位置
    - 文件读取:设定用户只能请求public目录下的文件: fs。通过path模块的path.exists方法来判断静态文件是否存在磁盘上
    - 使用 express 框架来辅助搭建 （使用框架）
        浏览器中打开 http://localhost:3000/
    - nodejs + express 使用html模板，而不是jade，使用的是ejs
        app.engine('.html', ejs.__express);app.set('view engine', 'html');
        http://blog.fens.me/nodejs-express3/
    - 记录两种
        1. express 直接使用 html 文件，路由功能使用比较简单，不用模板，适合快速demo
        2. express 使用完整结构，使用路由，配合使用ejs模板，适合功能完整项目
    - 用 requirejs 来组织 sensorium.js 中的函数依赖
        - action
        - control
- 尝试使用node webkit封装串口工具
    http://electron.atom.io/docs/v0.36.0/tutorial/quick-start/


- 多蓝牙连接
- http服务器
- 研究客户端执行node

- api文档
- sdk

http://v3.bootcss.com/getting-started/




# 舵机测试
- 用串口直接接电脑，进行通信
    - 显示串口
- 优必选舵机协议定义

    - 控制灯：
        fa af 0 04 01 0 0 0 5 ed
        fa af 0 04 0 0 0 0 4 ed

    - 控制转动：
        fa af 0 01 1 5 5 0 b ed

- me舵机协议定义
- 舵机控制


### slot 口
所有接适配器的都有slot

限位开关


# jsdoc 的语法


# nodejs 中的 buffer
是nodejs中用来处理buffer的

https://nodejs.org/dist/latest-v5.x/docs/api/buffer.html
