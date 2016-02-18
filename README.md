# sensorium-tester
sensorium-tester is a hardware test framework for makeblock. It bases on hardware protocol defined in makeblock，and covers
all the product in makeblock. The mainboard includes `mcore`,`2560`,`orion`,`zeroPI`.

![demo ui](/public/images/demo.png)

# To Start

    npm install & npm start

then visit `http:localhost:3003` in your browser.

# Description of files

- **source/mboardControl.js** different hardware protocol.Inclue `mcore`,`2560`,`orion`,`zeroPI` etc.
- **source/servoControl.js** servo test
- **app.js** start file
- **base.js** util functions
- **public/**  test web interface. includes `images/`, `css/`, `js/`, `*.html`

# Change log
【20160216 v0.1.0】
>1. 增加 提示信息
2. 增加 完善了传感器及硬件测试框架

