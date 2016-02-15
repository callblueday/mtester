/*!
 * Sensorium v0.1.0
 * define actions for snesors or motors etc. in makelock
 * it surports 2560, mcore, orion and zeroPi.
 * Copyright 2015- Makeblock, Inc.
 * Author callblueday
 * Licensed under the MIT license
 */


Sensorium = function(socket) {
    this.socket = socket;

    /* 一些公用变量 */
    this.SETTING = {
        //设备类型
        VERSION: 0, //版本号
        ULTRASONIC_SENSOR:   1,  //超声波
        TEMPERATURE_SENSOR:  2,  //温度
        LIGHT_SENSOR:    3,  // 光线
        POTENTIONMETER:  4,  // 电位计
        JOYSTICK:    5,
        GYRO:    6,
        SOUND_SENSOR:    7,
        RGBLED:  8,
        SEVSEG:  9,
        MOTOR:   10,
        SERVO:   11,
        ENCODER: 12,
        IR:  13,
        IRREMOTE:    14,
        PIRMOTION:   15,
        INFRARED:    16,
        LINEFOLLOWER:    17,
        IRREMOTECODE:    18,
        SHUTTER: 20,
        LIMITSWITCH: 21,
        BUTTON:  22,
        HUMITURE:    23,
        FLAMESENSOR: 24,
        GASSENSOR:   25,
        COMPASS: 26,
        TEMPERATURE:  27,
        DIGITAL: 30,
        ANALOG:  31,
        PWM: 32,
        SERVO_PIN:   33,
        TONE:    34,
        BUTTON_INNER:    35,
        ULTRASONIC_ARDUINO:  36,
        PULSEIN: 37,
        STEPPER: 40, // 通用步进电机
        LEDMATRIX:   41,
        TIMER:   50,
        JOYSTICK_MOVE: 52, // 通用摇杆设备
        COMMON_COMMONCMD: 60, // 针对套件的命令
        ENCODER_BOARD: 61, // 板载编码电机

        /* 发送数据相关 */
        CODE_CHUNK_PREFIX: [255, 85],
        READ_CHUNK_SUFFIX: [13, 10],
        // 回复数据的index位置
        READ_BYTES_INDEX: 2,
        // 发送数据中表示“读”的值
        READMODULE: 1,
        // 发送数据中表示“写”的值
        WRITEMODULE: 2,

        // PORT口
        PORT: {
            "2560": {
                // 通用port口列表
                COMMON_LIST: [6, 7, 8, 9, 10],
                // 板载传感器port口
                LIGHT: 11,
                TEMPERATURE: 13,
                GYROSCOPE: 6,
                VOLUME: 14,
                MOTOR: [1,2],
                LED_PANEL: 0
            },
            "mcore": {
                COMMON_LIST: [1, 2, 3, 4],
                MOTOR: [9,10],
                LED: 7,
                LIGHT: 6
            },
            "orion": {
                COMMON_LIST: [1, 2, 3, 4, 5, 6, 7, 8],
                MOTOR: [9,10]
            },
            "zeroPi": {
                MOTOR: [9,10]
            }
        },

        // tone
        ToneHzTable: {
            // 原始数据：D5: 587 "E5": 658,"F5": 698,"G5": 784,"A5": 880,"B5": 988,"C6": 1047
            "C2": 65,"D2": 73,"E2": 82,"F2": 87,"G2": 98,"A2": 110,"B2": 123,
            "C3": 131,"D3": 147,"E3": 165,"F3": 175,"G3": 196,"A3": 220,
            "B3": 247,"C4": 262,"D4": 294,"E4": 330,"F4": 349,"G4": 392,
            "A4": 440,"B4": 494,"C5": 523,"D5": 555,"E5": 640,"F5": 698,
            "G5": 784,"A5": 880,"B5": 988,"C6": 1047,"D6": 1175,"E6": 1319,
            "F6": 1397,"G6": 1568,"A6": 1760,"B6": 1976,"C7": 2093,"D7": 2349,
            "E7": 2637,"F7": 2794,"G7": 3136,"A7": 3520,"B7": 3951,"C8": 4186
        },

        LINEFOLLOWER_VALUE: {
            'BLACK_BLACK': 128,
            'BLACK_WHITE': 64,
            'WHITE_BLACK': 191,
            'WHITE_WHITE': 0
        },

        LedPosition: {
            LEFT: 1,
            RIGHT: 2,
            BOTH: 0
        }
    };

    this.buffer = [];
    this.tabletTiltLeftRightStatus = 0;
    this.tabletTiltForwardBackwardStatus = 0;
    this.tabletLastShakeTime = 0;
    this.bluetoothConnected = true;
    this.bleLastTimeConnected = true;
    this.isMotorMoving = false;
};


// 设备相关
Sensorium.prototype.deviceInfo = {};
Sensorium.prototype.getDeviceInfo = function() {
    return this.deviceInfo;
};
Sensorium.prototype.setDeviceInfo = function(data) {
    var type = data.type;
    if(type == "default") {
        type = "mcore";
    }
    this.deviceInfo.type = type;
    this.deviceInfo.portlist = this.SETTING.PORT[type];
};


Sensorium.prototype.action = function() {
    var that = this;
    return {
        baseSpeed: 85,
        timeCount: 0,
        ulTimer: null,   // ultrasoinic timer
        lineTimer: null, // linefollow timer
        lightTimer: null, // linefollow timer
        turnDegreeSpendTime : null,

        /**
         * --------------------
         * 辅助功能
         * --------------------
         */

        // 读取版本号
        getVersion: function() {
            var data = {
                methodName: 'action.getVersion',
                methodParams: [],
                type: 'getVersion',
                params: []
            }
            that.sendRequest(data);
        },

        // 读取电量
        getBattery: function() {
            var cmd = "ff 55 04 00 01 3c 70";
            this.sendSerialData(cmd);
        },

        /**
         * 切换固件模式
         * @param {number} device 套件的类别：
         *       0x10： starter
         *       0x11： auriga
         * @param {number} modeNumber 模式有4种，如下：
         *       00： 蓝牙模式
         *       01： 超声波自动避障
         *       02： 自平衡
         *       03： 红外模式"
         */
        setMode: function(modeNumber) {
            var device = 0x11;
            var modeNumber = parseInt(modeNumber);
            var data = {
                methodName: 'action.setMode',
                methodParams: [device, modeNumber],
                type: 'setMode',
                params: [device, modeNumber]
            }
            that.sendRequest(data);
        },

        /**
         * --------------------
         * 运动类
         * --------------------
         */

        // 设置直流电机: port口：mbot是09和10，其他是01和02
        setDcMotor: function(speed, port) {
            var cmd = "ff 55 06 00 02 "
                + that.SETTING.MOTOR.toString(16) + " "
                + parseInt(port).toString(16) + " "
                + parseInt(speed).toString(16) + " 00";
            this.sendSerialData(cmd);
        },

        // 设置编码电机
        setEncoderMotor: function(speed, slot) {
            var cmd = "ff 55 07 00 02 3d 00 "
                + parseInt(slot).toString(16) + " "
                + (parseInt(speed) & 0xff).toString(16) + " "
                + ((parseInt(speed) >> 8) & 0xff).toString(16);
            this.sendSerialData(cmd);
        },

        // 设置步进电机
        setStepperMotor: function(speed, distance, port) {
            var cmd = "ff 55 08 00 02 "
                + that.SETTING.STEPPER.toString(16) + " "
                + parseInt(port).toString(16) + " "
                + (parseInt(speed) & 0xff).toString(16) + " "
                + ((parseInt(speed) >> 8) & 0xff).toString(16) + " "
                + (parseInt(distance) & 0xff).toString(16) + " "
                + ((parseInt(distance) >> 8) & 0xff).toString(16);
            this.sendSerialData(cmd);
        },

        // 设置舵机
        setServoMotor: function(angle, port, slot) {
            var cmd = "ff 55 06 00 02 0b "
                + parseInt(port).toString(16) + " "
                + parseInt(slot).toString(16) + " "
                + parseInt(angle).toString(16);
            this.sendSerialData(cmd);
        },


        /**
         * --------------------
         * 传感器类
         * --------------------
         */

        // 超声波
        openUltrasonic : function(port) {
            that.ulTimer = setInterval(function() {
                that.timeCount++;
                if(that.timeCount > 10) {
                    clearInterval(that.ulTimer);
                    that.timeCount = 0;
                    return false;
                }

                var data = {
                    methodName: 'action.openUltrasonic',
                    methodParams: [port],
                    type: 'ultrasonic',
                    params: [port]
                }
                that.sendRequest(data);
            }, 1000);
        },

        stopUltrasoinic : function() {
            clearInterval(that.ulTimer);
        },

        // 巡线
        openLineFollow : function(port) {
            that.lineTimer = setInterval(function() {
                var data = {
                    methodName: 'action.openLineFollow',
                    methodParams: [port],
                    type: 'lineFollow',
                    params: [port]
                }
                that.sendRequest(data);

            }, 1000);
        },
        stopLineFollow : function() {
            clearInterval(that.lineTimer);
        },

        // 光线传感器
        openLightSensor : function(port) {
            that.lightTimer = setInterval(function() {
                var data = {
                    methodName: 'action.openLightSensor',
                    methodParams: [port],
                    type: 'lightSensor',
                    params: [port]
                }
                that.sendRequest(data);

            }, 1000);
        },
        stopLightSensor : function() {
            clearInterval(that.lightTimer);
        },


        // 温度
        openTemperature: function(port) {
            var cmd = "";
            this.sendSerialData(cmd);
        },
        stopTemperature: function() {
            clearInterval(that.temperatureTimer);
        },

        // 人体红外
        openInfrared: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },
        stopInfrared: function() {
            clearInterval(that.InfraredTimer);
        },

        // 陀螺仪: 01表示X轴，02表示Y轴，03表示Z轴
        getGyro: function(axis) {
            axis = axis ? axis : "01";
            var cmd = "ff 55 05 00 01 06 01 " + axis;
            this.sendSerialData(cmd);
        },

        // 湿度
        openHumidity: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },
        stopHumidity: function() {
            clearInterval(that.humidityTimer);
        },

        // 火焰传感器
        openFire: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },
        stopFire: function() {
            clearInterval(that.fireTimer);
        },

        // 气体传感器
        openGas: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },
        stopGas: function() {
            clearInterval(that.gasTimer);
        },


        /**
         * --------------------
         * 提示类
         * --------------------
         */

        // led
        turnOnLed: function() {
            var r = 255;
            var g = 0;
            var b = 0;
            var position = 0;

            var data = {
                methodName: 'action.turnOnLed',
                methodParams: [],
                type: 'led',
                params: [r,g,b,position]
            }
            that.sendRequest(data);
        },

        turnOffLed: function() {
            var r = 0;
            var g = 0;
            var b = 0;
            var position = 0;

            var data = {
                methodName: 'action.turnOffLed',
                methodParams: [],
                type: 'led',
                params: [r,g,b,position]
            }
            that.sendRequest(data);
        },

        // tone
        playTone: function(toneName, beat) {
            var data = {
                methodName: 'action.playTone',
                methodParams: [toneName, beat],
                type: 'playTone',
                params: [toneName, beat]
            }
            that.sendRequest(data);
        },

        // 数码管
        setTube: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        // MP3模块
        setMp3: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        /**
         * --------------------
         * 控制类（向外界输出信号）
         * --------------------
         */

        // 摇杆
        setRocker: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        // 设置相机快门
        setShutter: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        // 设置限位开关
        setLimitSwitch: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        // 设置电位器
        setPotentiometer: function() {
            var cmd = "";
            this.sendSerialData(cmd);
        },

        /**
         * --------------------
         * 其他行为封装
         * --------------------
         */
        forward: function(speed) {
            var speed = parseInt(speed);
            var dir = 1;
            var spd1 = -dir * speed;
            var spd2 = dir * speed;

            var data = {
                methodName: 'action.forward',
                methodParams: [speed],
                type: 'setSpeed',
                params: [spd1, spd2]
            }
            that.sendRequest(data);
        },
        backward: function(speed) {
            var speed = parseInt(speed);
            var dir = -1;
            var spd1 = -dir * speed;
            var spd2 = dir * speed;

            var data = {
                methodName: 'action.backward',
                methodParams: [speed],
                type: 'setSpeed',
                params: [spd1, spd2]
            }
            that.sendRequest(data);
        },
        turnLeft: function(speed) {
            var speed = parseInt(speed);
            var dir = 1;
            var spd1 = -dir * speed;
            var spd2 = dir * speed;

            var data = {
                methodName: 'action.forward',
                methodParams: [speed],
                type: 'setSpeed',
                params: [spd1, spd2]
            }
            that.sendRequest(data);
        },
        turnRight: function(speed, dir) {
            var speed = parseInt(speed);
            var spd1 = -dir * speed;
            var spd2 = dir * speed;

            var data = {
                methodName: 'action.turnRight',
                methodParams: [speed],
                type: 'setSpeed',
                params: [spd1, spd2]
            }
            that.sendRequest(data);
        },
        stop: function() {
            var data = {
                methodName: 'action.stop',
                methodParams: [],
                type: 'setSpeed',
                params: [0, 0]
            }
            that.sendRequest(data);
        },
        stopAll: function() {
            MBlockly.Control.stopAll();
        },


        /**
         * send data via serialport
         * @param  {string | array} str decimal interger array.
         * @return void.
         */
        sendSerialData: function(str, type) {
            console.log(str);
            if(typeof(str) == 'object' || type == "chart") {
                var data = {
                    methodName: 'action.sendSerialData',
                    methodParams: str,
                    type: 'serialData',
                    params: str
                }
                console.log(str);
                that.sendRequest(data);
            } else {
                if(str.length) {
                    dataTemp = str.split(" ");
                    var temp = [];
                    for(var i in dataTemp) {
                        var item = parseInt(dataTemp[i], 16); // 16进制转10进制
                        temp.push(item);
                    }
                    var data = {
                        methodName: 'action.sendSerialData',
                        methodParams: str,
                        type: 'serialData',
                        params: temp
                    }
                    that.sendRequest(data);
                }
            }
        }
    };
};


Sensorium.prototype.sendRequest = function(data) {
    this.socket.emit('fromWebClient', data);
};


Sensorium.prototype.sendCmd = {
    /**
     * build write short
     * short type number has 2 bytes
     * @private
     */
    buildModuleWriteShort: function(type, port, slot, value) {
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x6;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = type;
        a[6] = port;
        a[7] = value & 0xff;
        a[8] = (value >> 8) & 0xff;
        a[9] = 0;
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },


    /**
     * 设置舵机  servo motor
     * @param  {number} type  设备类型
     * @param  {number} port  port口
     * @param  {number} slot  slot值
     * @param  {number} angle 角度值
     * @return void.
     *
     * 示例：设置舵port口5，slot1，45°
        ff 55 06 60 02 0b 05 01 2d
     */
    buildModuleWriteServo: function(type, port, slot, angle) {
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x6;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = type;
        a[6] = port;
        a[7] = value & 0xff;
        a[8] = (value >> 8) & 0xff;
        a[9] = 0;
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * 设置直流电机指令 dc motor
     * @param  {number} port  端口号
     * @param  {number} value 速度值
     * @return void.
     *
     * ff 55 06 00 02 0a 09 ff 00  通用直流电机
     * ff 55 06 60 02 34 05 ff 00  zeropi 直流电机
     */
    buildModuleWriteDCMotor: function(port, value) {
        var a = new Array(9);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x6;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        if(this.deviceInfo.type == "zeropi") {
            a[5] = this.SETTING.ZEROPIDCMOTOR; // 设备类型
        } else {
            a[5] = this.SETTING.MOTOR;
        }
        a[6] = port;
        a[7] = value & 0xff;  // short型的低位
        a[8] = (value >> 8) & 0xff;  // short型的高位
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * 设置编码电机指令 encoder motor
     * @param  {string} motorDirection  电机类型，1是左，2是右
     * @param  {string} value 速度值
     * @return void.
     *
     * 左电机 255 速度运转
       ff 55 07 60 02   61     00            01                0xff          0
                       设备号  port口  电机类型，1是左，2是右   速度值第一位  速度值第一位
     */
    buildModuleWriteEncoderMotor: function(motorDirection, value) {
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x7;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = this.SETTING.ENCODER_BOARD;
        a[6] = 0x00;  // port口
        a[7] = motorDirection;
        a[8] = value & 0xff;  // short型的第一位
        a[9] = (value >> 8) & 0xff;  // short型的第二位
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * 读取编码电机的速度/位置
     * @param  {number} motorDirection 01是左电机，02是右电机
     * @param  {number} type          01表示位置，02表示速度
     * @return void.
     * 示例：
     *     ff 55 06 00 01 3d 00 01 02
     *
     */
    buildModuleReadEncoderMotor: function(motorDirection, type) {
        var a = new Array(9);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x6;
        a[3] = 0;
        a[4] = this.SETTING.READMODULE;
        a[5] = this.SETTING.ENCODER_BOARD;
        a[6] = 0x00;  // port口
        a[7] = motorDirection;
        a[8] = type;
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * 设置步进电机指令 step motor
     * @param  {number} port  port口
     * @param  {number} speed 电机的速度
     * @param  {number} distance  步进电机运动的距离
     * @return void.
     *
     * 示例：设置步进电机port口1，速度3000，距离1000
            ff 55 08 60 02 33 01 b8 0b e8 03  zeropi 的步进电机
            ff 55 08 60 02 28 01 b8 0b e8 03  通用步进电机
     */
    buildModuleWriteStepperMotor: function(port, speed, distance) {
        var a = new Array(11);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x8;
        a[3] = 0; //index
        a[4] = this.SETTING.WRITEMODULE;
        if(this.deviceInfo.type == "zeropi") {
            a[5] = this.SETTING.ZEROPISTEPPER; // zeropi 步进电机
        } else {
            a[5] = this.SETTING.STEPPER; // 通用步进电机
        }
        a[6] = port;
        a[7] = speed & 0xff;  // short型的低位
        a[8] = (speed >> 8) & 0xff;  // short型的高位
        a[9] = distance & 0xff;
        a[10] =(distance >> 8) & 0xff;
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * build RGB machine code.
     * @private
     * 示例：          ff 55 09 00 02 08 07 02 00 ff 00 00
     * 老版本固件示例： ff 55 08 00 02 08 07 00 ff 00 00 00
     */
    buildModuleWriteRGB: function(port, slot, position, r, g, b) {
        var a = new Array(12);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x9;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 08;
        a[6] = port;
        a[7] = slot;
        a[8] = position;
        a[9] = r;
        a[10] = g;
        a[11] = b;

        // 老版本的固件
        if(this.getDeviceInfo().version == "1.2.103") {
            a[2] = 8;
            a[7] = position;
            a[8] = r;
            a[9] = g;
            a[10] = b;
            a[11] = 0;
        }

        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * build Buzzer machine code
     * @private
     * 播放音调为C4，四分之一拍：ff 55 07 60 02 22 06 01 fa 00
     * （老版本）：             ff 55 05 00 02 22 06 01
     */
    buildModuleWriteMcoreBuzzer: function(value) {
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x7;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 0x22;
        a[6] = value & 0xff;         // short型的第一位
        a[7] = (value >> 8) & 0xff;  // short型的第二位
        a[8] = 0xfa;                 // 节拍第一位
        a[9] = 0;                    // 节拍第二位

        // 老版本的mbot固件
        if(this.getDeviceInfo().version == "1.2.103") {
            a[2] = 5;
            a[8] = 0;
            a[9] = 0;
        }

        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * build Buzzer machine code
     * @private
     * 播放引脚为10，音调为B2，节拍为四分之一：ff 55 08 00 02 22 0a 7b 00 fa 00
     */
    buildModuleWriteBuzzer: function(value) {
        var a = new Array(11);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x8;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 0x22;
        a[6] = 0x0a;
        a[7] = value & 0xff;  // short型的第一位
        a[8] = (value >> 8) & 0xff;  // short型的第二位
        a[9] = 0xfa;
        a[10] = 0;
        MBlockly.HostInterface.sendBluetoothRequestUnrelibly(a);
    },

    /**
     * build Read code
     * @private
     */
    buildModuleRead: function(type, port, index) {
        var a = new Array(9);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x04;
        a[3] = index;
        a[4] = this.SETTING.READMODULE;
        a[5] = type;
        a[6] = port;
        MBlockly.HostInterface.sendBluetoothRequest(a);
    },

    /**
     * ff 55 05 00 01 06 01 03
     */
    buildModuleRead5: function(type, port, index, subCommand) {
        var a = new Array(9);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x05;
        a[3] = index;
        a[4] = this.SETTING.READMODULE;
        a[5] = type;
        a[6] = port;
        a[7] = subCommand;
        console.log('gyroData: ' + a);
        MBlockly.HostInterface.sendBluetoothRequest(a);
    }
};
