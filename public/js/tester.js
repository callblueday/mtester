/*!
 * Tester v0.1.0
 * define actions for snesors or motors etc. in makelock
 * it surports auriga, mcore, orion and megaPi.
 * Copyright 2015- Makeblock, Inc.
 * Author Hyman
 * Licensed under the MIT license
 */


/**
* <h4>Hello Tester</h4>
* <p>Tester是用于Makeblock硬件交互的Js库</p>
* @class Tester
* @version 0.1.0
* @param {object} socket socket对象
*/
Tester = function(socket) {
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
            "auriga": {
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
            "megaPi": {
                MOTOR: [1,2,3,4,9,10,11,12]
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

    this.timer = 800;  // 循环读取数据的时间间隔
};


// 设备相关
Tester.prototype = {

    /**
     * device info: json对象，包含type(主板的类型: 类型的值有：auriga,mcore,orion,megaPi)
     * @type {Object}
     */
    deviceInfo : {},

    /**
     * 获取主板的类型
     * @return {object} deviceInfo信息
     */
    getDeviceInfo : function() {
        return this.deviceInfo;
    },

    /**
     * @param {object} data json对象，包含type(主板的类型: 类型的值有：auriga,mcore,orion,megaPi)
     */
    setDeviceInfo : function(data) {
        var type = data.type;
        if(type == "default") {
            type = "mcore";
        }
        this.deviceInfo.type = type;
        this.deviceInfo.portlist = this.SETTING.PORT[type];
    },

    baseSpeed: 85,
    timeCount: 0,
    ulTimer: null,   // ultrasoinic timer
    lineTimer: null, // linefollow timer
    lightTimer: null, // light timer
    temperatureTimer: null,
    soundTimer: null,
    pirTimer: null, // 人体红外
    gyroXTimer: null,
    gyroYTimer: null,
    gyroZTimer: null,
    gasTimer: null,
    fireTimer: null,
    humidityTimer: null,
    joystickTimer: null,
    limitSwitchTimer: null,
    potentiometerTimer: null,
    encoderTimer: null,
    turnDegreeSpendTime : null,

    /**
     * 读取版本号
     */
    getVersion: function() {
        var cmd = "ff 55 04 00 01 00 00";
        this.sendSerialData(cmd);
    },

    /**
     * 读取电量
     */
    getBattery: function() {
        var cmd = "ff 55 04 00 01 3c 70";
        this.sendSerialData(cmd);
    },

    /**
     * 切换固件模式
     * @param {number} device 套件的类别：
     *       0x10： starter(orion)
     *       0x11： auriga
     * @param {number} modeNumber 模式有4种，如下：
     *       00： 蓝牙模式
     *       01： 超声波自动避障
     *       02： 自平衡
     *       03： 红外模式
     *       03： 巡线模式
     */
    setMode: function(modeNumber) {
        var device;
        var boardType = $("#deviceType").val();
        if(boardType == "auriga") {
            device = 0x11;
        } else {
            device = 0X10;
        }
        var cmd = "ff 55 05 00 02 3c "
            + parseInt(device).toString(16) + " "
            + parseInt(modeNumber).toString(16);
        this.sendSerialData(cmd);
    },

    // ff 55 07 00 02 05 64 00 64 00
    setVirtualJoystick: function(leftSpeed, rightSpeed) {
        var cmd = "ff 55 07 00 02 05 "
            + (parseInt(leftSpeed) & 0xff).toString(16) + " "
            + ((parseInt(leftSpeed) >> 8) & 0xff).toString(16) + " "
            + (parseInt(rightSpeed) & 0xff).toString(16) + " "
            + ((parseInt(rightSpeed) >> 8) & 0xff).toString(16);
        this.sendSerialData(cmd);
    },

    /**
      * 设置直流电机: port口：mbot是09和10，其他是01和02
      * @param {number} speed speed value, 0 ~ 255
      * @param {number} port  port number
      */
    setDcMotor: function(speed, port) {
        var cmd = "ff 55 06 00 02 "
            + this.SETTING.MOTOR.toString(16) + " "
            + parseInt(port).toString(16) + " "
            + parseInt(speed).toString(16) + " 00";
        this.sendSerialData(cmd);
    },

    /**
     * 设置板载编码电机速度
     * @param {number} speed speed value, 0 ~ 255
     * @param {number} port  port number
     * @param {number} slot  slot number
     */
    setEncoderMotor: function(speed, port, slot) {
        var cmd = "ff 55 07 00 02 3d "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16) + " "
            + (parseInt(speed) & 0xff).toString(16) + " "
            + ((parseInt(speed) >> 8) & 0xff).toString(16);
        this.sendSerialData(cmd);
    },

    stopEncoderMotor: function(element) {
        var slot = $($(element).parent().find('button')[0]).find('.slot').val();
        this.setEncoderMotor(0, 0, slot);
    },

    /**
     * 设置通用编码电机: ff 55 09 00 02 0c 08 01 64 00 e8 03
     * @param {number} speed speed value, 0 ~ 255
     * @param {number} distance distance value
     * @param {number} port  port number
     * @param {number} slot  slot number
     */
    setCommonEncoderMotor: function(speed, distance, port, slot) {
        var cmd;
        if(this.deviceInfo.type == "megaPi") {
            // 因为是板载，port口为0，共有8个直流电机port口，其中port口1，2，3，4可以复用为编码电机的port口
            cmd = "ff 55 09 00 02 0c 00 "
                + parseInt(slot).toString(16) + " "
                + (parseInt(speed) & 0xff).toString(16) + " "
                + ((parseInt(speed) >> 8) & 0xff).toString(16) + " "
                + (parseInt(distance) & 0xff).toString(16) + " "
                + ((parseInt(distance) >> 8) & 0xff).toString(16);
        } else {
            // port值为0x08，是系统默认值，该处实际为I²C的值
            cmd = "ff 55 09 00 02 0c 08 "
                // + parseInt(port).toString(16) + " "
                + parseInt(slot).toString(16) + " "
                + (parseInt(speed) & 0xff).toString(16) + " "
                + ((parseInt(speed) >> 8) & 0xff).toString(16) + " "
                + (parseInt(distance) & 0xff).toString(16) + " "
                + ((parseInt(distance) >> 8) & 0xff).toString(16);
        }

        this.sendSerialData(cmd);
    },

    /**
     * 读取板载编码电机的值：01表示位置，02表示速度
     * @example
     * ff 55 06 00 01 3d 00 01 02
     * @param  {number} type 1表示位置，2表示速度
     * @param {number} port  port number
     * @param {number} slot  slot number
     */
    readEncoderMotor: function(type, port, slot) {
        var self = this;
        var cmd = "ff 55 06 00 01 3d "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16) + " "
            + parseInt(type).toString(16);

        this.encoderTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopReadEncoderMotor : function() {
        clearInterval(this.encoderTimer);
    },

    /**
     * 设置步进电机
     * @param {number} speed speed value, 0 ~ 255
     * @param {number} distance distance value
     * @param {number} port  port number
     */
    setStepperMotor: function(speed, distance, port) {
        var cmd = "ff 55 08 00 02 "
            + this.SETTING.STEPPER.toString(16) + " "
            + parseInt(port).toString(16) + " "
            + (parseInt(speed) & 0xff).toString(16) + " "
            + ((parseInt(speed) >> 8) & 0xff).toString(16) + " "
            + (parseInt(distance) & 0xff).toString(16) + " "
            + ((parseInt(distance) >> 8) & 0xff).toString(16);
        this.sendSerialData(cmd);
    },

    /**
     * 设置舵机
     * @param {number} angle angle number, 0°~180°
     * @param {number} port  port number
     * @param {number} slot  slot number
     */
    setServoMotor: function(angle, port, slot) {
        var cmd = "ff 55 06 00 02 0b "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16) + " "
            + parseInt(angle).toString(16);
        this.sendSerialData(cmd);
    },


    /*--------------------
     * 传感器类
     * --------------------
     */

    /**
     * 读取超声波传感器的值
     * @param {number} port  port number
     */
    readUltrasonic: function(port) {
        var cmd = "ff 55 04 00 01 01 "
            + parseInt(port).toString(16);
        this.sendSerialData(cmd);
    },
    openUltrasonic : function(port) {
        var self = this;
        this.ulTimer = setInterval(function() {
            self.readUltrasonic(port);
        }, this.timer);
    },
    stopUltrasoinic : function() {
        clearInterval(this.ulTimer);
    },

    /**
     * 读取巡线传感器的值
     * @example
     * ff 55 04 00 01 11 05
     * @param {number} port  port number
     */
    readLineFollow: function(port) {
        var cmd = "ff 55 04 00 01 01 "
            + parseInt(port).toString(16);
        this.sendSerialData(cmd);
    },
    openLineFollow : function(port) {
        var self = this;
        this.lineTimer = setInterval(function() {
            self.readLineFollow(port);
        }, this.timer);
    },
    stopLineFollow : function() {
        clearInterval(this.lineTimer);
    },

    /**
     * 读取光线传感器的值
     * @param {number} port  port number
     */
    readLightSensor: function(port) {
        var cmd = "ff 55 04 00 01 03 "
            + parseInt(port).toString(16);
        this.sendSerialData(cmd);
    },
    openLightSensor : function(port) {
        var self = this;
        this.lightTimer = setInterval(function() {
            self.readLightSensor(port);
        }, this.timer);
    },
    stopLightSensor : function() {
        clearInterval(this.lightTimer);
    },

    /**
     * 读取温度传感器的值
     * @param {number} port  port number
     * @example
     * ff 55 05 00 01 02 03 01
     */
    readTemperatureSensor: function(port) {
        var cmd = "ff 55 05 00 01 02 "
            + parseInt(port).toString(16)
            + " 01";
        // for auriga 板载: ff 55 04 00 01 1b 0d
        if(this.deviceInfo.type == "auriga") {
            var cmd = "ff 55 04 00 01 1b "
            + parseInt(port).toString(16);
        }
        this.sendSerialData(cmd);
    },
    openTemperature: function(port) {
        var self = this;
        this.temperatureTimer = setInterval(function() {
            self.readTemperatureSensor(port);
        }, this.timer);
    },
    stopTemperature: function() {
        clearInterval(this.temperatureTimer);
    },

    /**
     * 读取音量传感器的值
     * @param {number} port  port number
     */
    readSoundSensor: function(port) {
        var cmd = "ff 55 04 00 01 07 "
            + parseInt(port).toString(16);
        this.sendSerialData(cmd);
    },
    openSound: function(port) {
        var self = this;
        this.soundTimer = setInterval(function() {
            self.readSoundSensor(port);
        }, this.timer);
    },
    stopSound: function() {
        clearInterval(this.soundTimer);
    },

    /**
     * 读取人体红外传感器的状态值
     * @param {number} port  port number
     */
    readPirMotionSensor: function(port) {
        var cmd = "ff 55 04 00 01 0f "
            + parseInt(port).toString(16);
        this.sendSerialData(cmd);
    },
    openPir: function(port) {
        var self = this;
        this.pirTimer = setInterval(function() {
            self.readPirMotionSensor(port);
        }, this.timer);
    },
    stopPir: function() {
        clearInterval(this.pirTimer);
    },

    /**
     * 读取陀螺仪传感器的值
     * @param  {number} axis 方向轴，1表示X轴，2表示Y轴，3表示Z轴.
     * @param {number} port  port number.
     */
    readGyroSensor: function(axis, port) {
        var cmd = "ff 55 05 00 01 06 "
            + parseInt(port).toString(16) + " "
            + axis;
        this.sendSerialData(cmd);
    },
    getGyro: function(axis, port) {
        var self = this;
        if(axis == "01") {
            this.gyroXTimer = setInterval(function() {
                self.readGyroSensor(axis, port);
            }, this.timer);
        }
        if(axis == "02") {
            this.gyroYTimer = setInterval(function() {
                self.readGyroSensor(axis, port);
            }, this.timer);
        }
        if(axis == "03") {
            this.gyroZTimer = setInterval(function() {
                self.readGyroSensor(axis, port);
            }, this.timer);
        }
    },
    stopGyro: function() {
        clearInterval(this.gyroXTimer);
        clearInterval(this.gyroYTimer);
        clearInterval(this.gyroZTimer);
    },

    // 湿度
    openHumidity: function(port, slot) {
        var self = this;
        var cmd = "ff 55 05 00 01 02 "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16);
        this.humidityTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopHumidity: function() {
        clearInterval(this.humidityTimer);
    },

    // 火焰传感器
    openFire: function(port) {
        var self = this;
        var cmd = "ff 55 05 00 01 02 "
            + parseInt(port).toString(16);
        this.fireTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopFire: function() {
        clearInterval(this.fireTimer);
    },

    // 气体传感器
    openGas: function(port) {
        var self = this;
        var cmd = "ff 55 04 00 01 19 "
            + parseInt(port).toString(16);
        this.gasTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopGas: function() {
        clearInterval(this.gasTimer);
    },


    /**
     * --------------------
     * 提示类
     * --------------------
     */

    // led:
    turnOnLed: function(port, slot, position, r, g, b) {
        var cmd = "ff 55 09 00 02 08 "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16) + " "
            + parseInt(position).toString(16) + " "
            + parseInt(r).toString(16) + " "
            + parseInt(g).toString(16) + " "
            + parseInt(b).toString(16);
        this.sendSerialData(cmd);
    },

    turnOffLed: function(element) {
        var target = $(element).parent().find('button')[0];
        var cmd = "ff 55 09 00 02 08 "
            + parseInt(target.children[0].value).toString(16) + " "
            + parseInt(target.children[1].value).toString(16) + " "
            + parseInt(target.children[2].value).toString(16) + " 0 0 0";
        this.sendSerialData(cmd);
    },

    // tone： ff 55 08 00 02 22 2d 6e 00 f4 01
    playTone: function(port, tone, beat) {
        var cmd;
        var boardType = this.deviceInfo.type;

        if(boardType == "auriga") {
            cmd = "ff 55 08 00 02 22 "
                + parseInt(port).toString(16) + " "
                + (parseInt(tone) & 0xff).toString(16) + " "
                + ((parseInt(tone) >> 8) & 0xff).toString(16) + " "
                + (parseInt(beat) & 0xff).toString(16) + " "
                + ((parseInt(beat) >> 8) & 0xff).toString(16);
        } else {
            cmd = "ff 55 07 00 02 22 "
                + (parseInt(tone) & 0xff).toString(16) + " "
                + ((parseInt(tone) >> 8) & 0xff).toString(16) + " "
                + (parseInt(beat) & 0xff).toString(16) + " "
                + ((parseInt(beat) >> 8) & 0xff).toString(16);
        }

        this.sendSerialData(cmd);
    },

    // 数码管: ff 55 08 00 02 09 03 00 00 c8 42
    setTube: function(port, nubmer) {
        var input = parseFloat(nubmer);
        var bytes = float32ToBytes(input);
        var cmd = "ff 55 08 00 02 09 "
            + parseInt(port).toString(16) + " "
            + bytes.join(" ");
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

    // 摇杆：01表示x轴，02表示y轴
    readJoystick: function(axis, port) {
        var self = this;
        var cmd = "ff 55 05 00 01 05 "
            + parseInt(port).toString(16) + " "
            + parseInt(axis).toString(16);
        this.joystickTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
        this.sendSerialData(cmd);
    },
    stopJoystick: function() {
        clearInterval(this.joystickTimer);
    },

    // 设置相机快门
    // action: 00是按下快门，01是松开快门，02是开始对焦，03是停止对焦
    setShutter: function(port, action) {
        var cmd = "ff 55 05 00 02 14 "
            + parseInt(port).toString(16) + " "
            + parseInt(action).toString(16);
        this.sendSerialData(cmd);
    },

    // 设置限位开关
    readLimitSwitch: function(port, slot) {
        var self = this;
        var cmd = "ff 55 05 00 01 15 "
            + parseInt(port).toString(16) + " "
            + parseInt(slot).toString(16);
        this.limitSwitchTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopLimitSwitch: function() {
        clearInterval(this.limitSwitchTimer);
    },


    // 设置电位器
    readPotentiometer: function(port) {
        var self = this;
        var cmd = "ff 55 04 00 01 04 "
            + parseInt(port).toString(16);
        this.potentiometerTimer = setInterval(function() {
            self.sendSerialData(cmd);
        }, this.timer);
    },
    stopPotentiometer: function() {
        clearInterval(this.potentiometerTimer);
    },

    /**
     * --------------------
     * 其他行为封装
     * --------------------
     */
    stop: function(element) {
        var port = $($(element).parent().find('button')[0]).find('.port').val();
        this.setDcMotor(0, port);
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
                methodName: 'sendSerialData',
                methodParams: str,
                type: 'serialData',
                params: str
            }
            this._sendRequest(data);
        } else {
            if(str.length) {
                dataTemp = str.split(" ");
                var temp = [];
                for(var i in dataTemp) {
                    var item = parseInt(dataTemp[i], 16); // 16进制转10进制
                    temp.push(item);
                }
                var data = {
                    methodName: 'sendSerialData',
                    methodParams: str,
                    type: 'serialData',
                    params: temp
                }
                this._sendRequest(data);
            }
        }
    },

    _sendRequest : function(cmdStr) {
        this.socket.emit('fromWebClient', cmdStr);
    }
};
