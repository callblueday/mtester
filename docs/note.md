### steps note
- 基础知识点
    - require 引用文件
    - exports 导出公共函数、变量
    - module
    - 模块初始化: 一个模块中的JS代码仅在模块第一次被使用时执行一次，并在执行过程中初始化模块的导出对象。之后，缓存起来的导出对象被重复利用

- []底层协议部分
    - [√]2560
    - [√]mcore
    - [√]orion
    - zeroPI
- []socket 串口通信测试
- []页面测试框架搭建（了解底层过程实现）
    - 搭建node的静态服务器： http.createServer
    - 实现路由：nodejs更改默认文件位置
    - 文件读取:设定用户只能请求public目录下的文件: fs。通过path模块的path.exists方法来判断静态文件是否存在磁盘上
    - 使用 express 框架来辅助搭建 （使用框架）
        使用express-generator（npm install express-generator -g）来辅助生成应用结构
        启动应用： DEBUG=myapp npm start
        浏览器中打开 http://localhost:3000/


- 舵机的测试图标
    - highchart

- 多蓝牙连接
- http服务器
- 研究客户端执行node

- api文档
- sdk

http://v3.bootcss.com/getting-started/