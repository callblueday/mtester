/**
 * mainboard contorl in makeblock.
 */

// 辅助函数：扩充对象
function extend() {
    var args = arguments;
    if (args.length < 2) { return };
    var temp = args[0];
    for (var n = 1; n < args.length; n++) {
        for (var i in args[n]) {
            temp[i] = args[n][i];
        }
    }
    return temp;
};

ValueWrapper = function() {

},
ValueWrapper.prototype.toString = function() {
    return this.val;
};

ValueWrapper.prototype.setValue = function(value) {
    this.val = value;
};

/* 一些公用变量 */
var control = {
    socket: null,
    serialPort: null,
    SETTING: {
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
        TEMPERATURE_板载:  27,
        DIGITAL: 30,
        ANALOG:  31,
        PWM: 32,
        SERVO_PIN:   33,
        TONE:    34,
        BUTTON_INNER:    35,
        ULTRASONIC_ARDUINO:  36,
        PULSEIN: 37,
        STEPPER: 40,
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
        }
    },

    buffer: [],
    tabletTiltLeftRightStatus: 0,
    tabletTiltForwardBackwardStatus: 0,
    tabletLastShakeTime: 0,
    bluetoothConnected: true,
    bleLastTimeConnected: true,

    isMotorMoving: false,

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
    },

    // 用来记录不同设备类型的port, slot等信息
    deviceInfo : {},
    getDeviceInfo: function() {
        return this.deviceInfo;
    },
    setDeviceInfo: function(data) {
        var type = data.type;
        // var type = "mcore";
        // var type = "orion";
        // var type = "auriga";
        // var type = "zeroPi";
        if(type == "default") {
            type = "mcore";
        }
        this.deviceInfo.type = type;
        this.deviceInfo.portlist = this.SETTING.PORT[type];
    }
};

/* step2: 定义发送具体条目的串口指令 */
extend(control, {
    // 超声波
    ultrasonic: function(index, port) {
        var type = 0x01;
        var port = port ? port : 0x05;
        this.buildModuleRead(type, port, index);
    },

    // 巡线
    lineFollow: function(index, port) {
        var type = 0x11;
        var port = port ? port : 0x03;
        this.buildModuleRead(type, port, index);
    },

    // 光线传感器
    lightSensor: function(index, port) {
        var type = 0x03;
        var port = port ? port : 0x0b;
        this.buildModuleRead(type, port, index);
    },

    // 点击按钮
    onTopButton: function(index) {
        var type = 31;
        var port = 7;
        this.buildModuleRead(type, port, index);
    },

    // 温度传感器
    temperatureSensor: function(index, port) {
        var type = 0x1b;
        var port = port ? port : 0x0d;
        this.buildModuleRead(type, port, index);
    },

    // 陀螺仪
    gyroscopeSensor: function(index, port) {
        var type = 0x06;
        var port = port ? port : 0x00;
        this.buildModuleRead(type, port, index);
    },

    // 音量传感器
    volumeSensor: function(index, port) {
        var type = 0x07;
        var port = port ? port : 0x0e;
        this.buildModuleRead(type, port, index);
    },

    /**
     * 设置套件固件的模式
     * @param {number} device 套件的类别：
     *       10： starter
     *       11： auriga
     * @param {number} modeNumber 模式有4种，如下：
     *       00： 蓝牙模式
     *       01： 超声波自动避障
     *       02： 自平衡
     *       03： 红外模式"
     */
    setMode: function(device, modeNumber) {
        this.buildModuleWriteShort5(device, modeNumber);
    },

    // ff 55 04 00 01 00 00
    getVersion: function() {
        this.buildModuleRead(0,0,0);
    },

    /**
     * 设置左右电机速度
     * @param {number} leftSpeed  左电机速度
     * @param {number} rightSpeed 右电机速度
     */
    setSpeed: function(leftSpeed, rightSpeed) {
        var that = this;
        var portLeft = this.deviceInfo.portlist.MOTOR[0];
        var portRight = this.deviceInfo.portlist.MOTOR[1];

        this.setMotor(portLeft, leftSpeed);
        setTimeout(function() {
            that.setMotor(portRight, rightSpeed);
        }, 21);
    },

    // 设置直流电机转速
    setMotor: function(port, speed) {
        if (speed != 0) {
            this.isMotorMoving = true;
        } else {
            this.isMotorMoving = false;
        }
        console.log('【speed】: ' + speed);

        if(this.deviceInfo.type == 'auriga') {
            // 编码电机
            this.buildModuleWriteCodingMotor(port, speed);
        } else {
            // 直流电机
            this.buildModuleWriteMotor(port, speed);
        }
    },

    // 设置直流电机
    setDcMotor: function(speed, port) {
        speed = parseInt(speed);
        port = parseInt(port);
        this.buildModuleWriteMotor(port, speed);
    },

    // 设置编码电机
    setEncoderMotor: function(port, speed, distance) {
        speed = parseInt(speed);
        this.buildModuleWriteCodingMotor(port, speed);
    },

    // 设置步进电机
    setStepperMotor: function(port, speed, distance) {

    },

    // 设置舵机
    setServoMotor: function(port, speed, distance) {

    },

    // 停止速度
    stopSpeed: function() {
        this.setSpeed(0, 0);
    },

    // 设置板载LED灯
    setLed: function(red, green, blue, position) {
        var that = this;
        setTimeout(function() {
            that.setLedByPosition(red, green, blue, position);
        }, 100);
        var port = this.deviceInfo.portlist.LED;
        if (position == 1) {
            this.setLedByPosition(0, 0, 0, this.LedPosition.RIGHT, port);
        } else if (position == 2) {
            this.setLedByPosition(0, 0, 0, this.LedPosition.LEFT, port);
        }
    },

    // 设置灯盘
    setLedPanel: function(r, g, b, position, port) {
        this.setLedByPosition(r, g, b, position, port);
    },


    setLedByPosition: function(r, g, b, position, port) {
        var port = port ? port : 0; //0是板载，其余是可外接端口

        if(this.deviceInfo.type == 'mcore') {
            port = this.deviceInfo.portlist.LED;
        }

        var slot = 2;

        var red = parseInt(r / 25);
        var green = parseInt(g / 25);
        var blue = parseInt(b / 25);

        this.buildModuleWriteRGB(port, slot, position, red, green, blue);
    },

    stopLed: function() {
        this.setLed(0, 0, 0);
    },

    stopAllLed: function(port) {
        this.setLedByPosition(0, 0, 0, 0, port);
    },

    playTone: function(toneName, beat) {
        if (toneName in this.SETTING.ToneHzTable) {
            this.playBuzzer(this.SETTING.ToneHzTable[toneName], beat);
        }
    },

    playBuzzer: function(toneValue, beat) {
        if(this.deviceInfo.type == "mcore") {
            this.buildModuleWriteMcoreBuzzer(toneValue, beat);
        } else {
            this.buildModuleWriteBuzzer(toneValue, beat);
        }
    },

    stopBuzzer: function() {
        if(this.deviceInfo.type == "mcore") {
            this.buildModuleWriteMcoreBuzzer(0);
        } else {
            this.buildModuleWriteBuzzer(0);
        }
    },

    // stop All
    stopAll: function() {
        var that = this;
        this.stopSpeed();
        setTimeout(function() {
            that.stopLed();
        }, 100);
        setTimeout(function() {
            MBlockly.Action.stopUltrasoinic();
        }, 100);
        setTimeout(function() {
            MBlockly.Action.stopLineFollow();
        }, 100);
    },

    // ff 55 05 00 02 3c 11 00
    buildModuleWriteShort5: function(device, modeNumber) {
        var a = new Array(8);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x5;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = this.SETTING.COMMON_COMMONCMD;
        a[6] = device;
        a[7] = modeNumber;
        control.sendRequest(a);
    },

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
        control.sendRequest(a);
    },

    // 设置直流电机 dc motor
    // ff 55 06 00 02 0a 09 00 00
    buildModuleWriteMotor: function(port, value) {
        var a = new Array(9);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x6;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 0x0a;
        a[6] = port;
        a[7] = value & 0xff;  // short型的第一位
        a[8] = (value >> 8) & 0xff;  // short型的第二位
        control.sendRequest(a);
    },

    /**
     * 写编码电机串口指令
     * 左电机 255 速度运转
       ff 55 07 60 02   61     00            01                0xff          0
                       设备号  port口  电机类型，1是左，2是右   速度值第一位  速度值第一位
     * @param  {string} motorDirection  电机类型，1是左，2是右
     * @param  {string} value 速度值
     * @return void.
     */
    buildModuleWriteCodingMotor: function(motorDirection, value) {
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x7;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 0x3d;
        a[6] = 0x00;
        a[7] = motorDirection;
        a[8] = value & 0xff;  // short型的第一位
        a[9] = (value >> 8) & 0xff;  // short型的第二位
        control.sendRequest(a);
    },

    /**
     * build RGB machine code.
     * @private
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
        control.sendRequest(a);
    },

    /**
     * build Buzzer machine code for mcore board.
     * @param {int} value tone hz value
     * @param {int} beat beat value: 500, 250, 125, 1000, 2000, 0, default is 250.
     * 播放音调为C4，四分之一拍：ff 55 07 60 02 22 06 01 fa 00
     */
    buildModuleWriteMcoreBuzzer: function(value, beat) {
        beat ? beat : 250;
        var a = new Array(10);
        a[0] = this.SETTING.CODE_CHUNK_PREFIX[0];
        a[1] = this.SETTING.CODE_CHUNK_PREFIX[1];
        a[2] = 0x7;
        a[3] = 0;
        a[4] = this.SETTING.WRITEMODULE;
        a[5] = 0x22;
        a[6] = value & 0xff;  // short型的第一位
        a[7] = (value >> 8) & 0xff;  // short型的第二位
        a[8] = beat & 0xff;         // 节拍第一位
        a[9] = (beat >> 8) & 0xff;  // 节拍第二位
        control.sendRequest(a);
    },

    /**
     * build Buzzer machine code for common board.
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
        control.sendRequest(a);
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
        control.sendRequest(a);
    }
});


// TODO: 实现接收的消息队列
control.decodeData = function(data) {
    var bytes = data;

    // 报告主板信息
    if(bytes.toString().indexOf("Version") != -1) {
        this.socket.emit('reportBoardInfo', bytes.toString());
    }

    for (var i = 0; i < bytes.length; i++) {
        this.buffer.push(bytes[i]);
        var length = this.buffer.length;

        // 过滤无效数据, 对于makeblock体系，协议的结束位是0d 0a
        if (length > 1 && this.buffer[length - 2] == this.SETTING.READ_CHUNK_SUFFIX[0] && this.buffer[length - 1] == this.SETTING.READ_CHUNK_SUFFIX[1]) {
            // if (this.buffer.length != 10) {
            if (this.buffer.length > 20) {
                this.buffer = [];
            } else {
                // 返回数据
                this.socket.emit('serialportData-receive', this.buffer.join(' '));

                // 以下为有效数据, 获取返回字节流中的索引位
                var dataIndex = this.buffer[this.SETTING.READ_BYTES_INDEX];
                // var promiseType = control.PromiseList.getType(dataIndex);

                // 返回有效数据
                // switch(promiseType) {
                //     case control.PromiseType.LINEFOLLOW:
                //         // 巡线
                //         this.lineFollow_callback();
                //         break;
                //     case control.PromiseType.ULTRASONIC:
                //         // 超声波
                //         this.ultrasonic_callback();
                //         break;
                //     case control.PromiseType.LIGHTSENSOR:
                //         // 光线传感器
                //         this.lightSensor_callback();
                //         break;
                //     case control.PromiseType.TEMPERATURE:
                //         // 温度传感器
                //         this.temperature_callback();
                //         break;
                //     case control.PromiseType.VOLUME:
                //         // 音量传感器
                //         this.volume_callback();
                //         break;
                //     default:
                //         break;
                // }
                this.buffer = [];
            }
        }
    }
};

/**
 * 定义主板回复数据的接收规则
 * @return {boolean}.
 */
control.dataFilterRule = function() {

}

/**
 * 用来储存“读取数据”block对数据的请求，使用valueWrapper来完成程序变量的临时替代
 * 在蓝牙返回数据之后设置真实的值，然后继续程序执行。
 * 最终目的：取到程序块中请求的值
 */
extend(control, {

    // 用索引来标识不同设备发出的指令，用于判断接收到的回复的指令是属于哪种设备的
    PromiseType: {
        // 超声波传感器
        ULTRASONIC: 1,
        // 巡线传感器
        LINEFOLLOW: 2,
        // 光线传感器
        LIGHTSENSOR: 3,
        // 顶部按钮
        ON_TOP_BUTTON: 4,
        // 温度传感器
        TEMPERATURE: 5,
        // 陀螺仪
        GYROSCOPE: 6,
        // 音量传感器
        VOLUME: 7,

        // 自定义组件
        WIDGET_SLIDER: 8,
        WIDGET_SWITCH: 41,
        WIDGET_BUTTON: 42
    },

    PromiseList: {
        requestList: new Array(256),
        index: 1,

        // 将请求加入请求队列，拥有类型，回调，以及值对象，
        // 并返回该请求在列表中的索引
        add: function(type, callback, valueWrapper) {
            this.index++;
            if (this.index > 255) {
                this.index = 1;
            }
            this.requestList[this.index] = {
                type: type,
                callback: callback,
                valueWrapper: valueWrapper
            };
            return this.index;
        },

        // 将值写到对应请求的值对象中，并且启动回调
        receiveValue: function(index, value) {
            if (this.requestList[index]) {
                this.requestList[index].valueWrapper.setValue(value);
                this.requestList[index].callback(value);
            }
        },

        getType: function(index) {
            return this.requestList[index].type;
        }
    },

    // 发送读取超声波返回的数据的请求
    getUltrasonicValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.ULTRASONIC, callback, valueWrapper);
        control.ultrasonic(index, port);
        /*  // 设置如果发送失败则500秒后重发，避免程序立即中断
        var resendInterval = setInterval(function(){
            if(control.PromiseList.requestList[index] != null){
                control.ultrasonic(index, port);
            }
            else{
                clearInterval(resendInterval);
            }
        }, 500);
        */
        return valueWrapper;
    },

    // 发送读取巡线传感器返回的数据的请求
    getLineFollowValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.LINEFOLLOW, callback, valueWrapper);
        control.lineFollow(index, port);
        return valueWrapper;
    },

    getLightSensorValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.LIGHTSENSOR, callback, valueWrapper);
        control.lightSensor(index, port);
        return valueWrapper;
    },

    getOnTopButtonValue: function(callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.ON_TOP_BUTTON, callback, valueWrapper);
        control.onTopButton(index, port);
        return valueWrapper;
    },

    getTemperatureValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.TEMPERATURE, callback, valueWrapper);
        control.temperatureSensor(index, port);
        return valueWrapper;
    },

    getGyroscopeValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.GYROSCOPE, callback, valueWrapper);
        control.gyroscopeSensor(index, port);
        return valueWrapper;
    },

    getVolumeValue: function(port, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.VOLUME, callback, valueWrapper);
        control.volumeSensor(index, port);
        return valueWrapper;
    },

    getSliderValue: function(id, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.WIDGET_SLIDER, callback, valueWrapper);
        MBlockly.HostInterface.requestWidgetValue(id, index);
        return valueWrapper;
    },

    getSwitchState: function(id, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.WIDGET_SWITCH, callback, valueWrapper);

        MBlockly.HostInterface.requestWidgetValue(id, index);
        return valueWrapper;
    },

    getButtonState: function(id, callback) {
        var valueWrapper = new ValueWrapper();
        var index = control.PromiseList
            .add(control.PromiseType.WIDGET_BUTTON, callback, valueWrapper);

        MBlockly.HostInterface.requestWidgetValue(id, index);
        return valueWrapper;
    },

    //------- 巡线回调执行 ---------
    lineFollow_callback: function() {
        console.log('linefollow callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            var sum = parseInt(this.buffer[7]) + parseInt(this.buffer[6]);
            console.log('linefollow sum: ' + sum)
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], sum);
        }
    },

    //------- 超声波回调执行 ---------
    ultrasonic_callback: function() {
        console.log('ultrasonic callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            var distance = this.getResponseValue(parseInt(this.buffer[7]), parseInt(this.buffer[6]), parseInt(this.buffer[5]), parseInt(this.buffer[4]));
            console.log('ultrasonic distance: ' + distance);
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], distance);
        } else {
            console.log('end');
        }
    },

    //------- 光线传感器回调执行 ---------
    lightSensor_callback: function() {
        console.log('lightsensor callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            var brightness = this.getResponseValue(parseInt(this.buffer[7]), parseInt(this.buffer[6]), parseInt(this.buffer[5]), parseInt(this.buffer[4]));
            console.log('brightness: ' + brightness);
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], brightness);
        } else {
            console.log('end');
        }
    },

    //------- 温度传感器回调执行 ---------
    temperature_callback: function() {
        console.log('temperature callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            var temperature = this.getResponseValue(parseInt(this.buffer[7]), parseInt(this.buffer[6]), parseInt(this.buffer[5]), parseInt(this.buffer[4]));
            // temperature = parseInt(temperature / 34);
            console.log('temperature: ' + temperature);
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], temperature);
        } else {
            console.log('end');
        }
    },

    //------- 音量传感器回调执行 ---------
    volume_callback: function() {
        console.log('volume callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            var volume = this.getResponseValue(parseInt(this.buffer[7]), parseInt(this.buffer[6]), parseInt(this.buffer[5]), parseInt(this.buffer[4]));
            volume = parseInt(volume / 3);
            console.log('volume: ' + volume);
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], volume);
        } else {
            console.log('end');
        }
    },

    //------- 顶端按钮回调执行 ---------
    onTopButton_callback: function() {
        console.log('ontopbutton callback: ' + this.buffer.join(' '));

        if (this.buffer[0] == 0xff && this.buffer[1] == 0x55) {
            if (this.buffer[6] == 0) {
                pressed = 1;
            } else {
                pressed = 0;
            }
            console.log('pressed: ' + this.buffer[6]);
            control.PromiseList.receiveValue(this.buffer[this.SETTING.READ_BYTES_INDEX], pressed);
        } else {
            console.log('end');
        }
    },

    // 将小车返回的short型数据转换成浮点型
    getResponseValue: function(b1, b2, b3, b4) {
        // FIXME: 4byte转int字节
        var fourBytesToInt = function(b1, b2, b3, b4) {
            return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
        };
        // FIXME: int字节转浮点型
        var intBitsToFloat = function(num) {
            /* s 为符号（sign）；e 为指数（exponent）；m 为有效位数（mantissa）*/
            s = (num >> 31) == 0 ? 1 : -1,
                e = (num >> 23) & 0xff,
                m = (e == 0) ?
                (num & 0x7fffff) << 1 :
                (num & 0x7fffff) | 0x800000;
            return s * m * Math.pow(2, e - 150);
        };
        var intValue = fourBytesToInt(b1, b2, b3, b4);
        var result = parseFloat(intBitsToFloat(intValue).toFixed(2));
        return result;
    }
});


/**
 * 发送字节流到串口
 * @param  {array} data bufferData字节数组或者字符串
 * @return void.
 */
control.sendRequest = function(data) {
    this.socket.emit('serialportData-send', data);
    this.serialPort.write(data);
}


module.exports = control;