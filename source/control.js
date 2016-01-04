/**
 * hardware control
 */
var buffer = [],
    globalSocketIO = null;

var DEVICE_TYPE = '2560';


var SETTING = {
    /* 发送数据相关 */
    CODE_CHUNK_PREFIX: [255, 85],
    READ_CHUNK_SUFFIX: [13, 10],
    // 回复数据的index位置
    READ_BYTES_INDEX: 2,
    // 发送数据中表示“读”的值
    READMODULE: 1,
    // 发送数据中表示“写”的值
    WRITEMODULE: 2,

    //设备类型
    DEV_VERSION: 0, //版本号
    DEV_ULTRASONIC:   1,  //超声波
    DEV_TEMPERATURE:  2,  //温度
    DEV_LIGHT_SENSOR:    3,  // 光线
    DEV_POTENTIONMETER:  4,  // 电位计
    DEV_JOYSTICK:    5,
    DEV_GYRO:    6,
    DEV_SOUND_SENSOR:    7,
    DEV_RGBLED:  8,
    DEV_SEVSEG:  9,
    DEV_MOTOR:   10,
    DEV_SERVO:   11,
    DEV_ENCODER: 12,
    DEV_IR:  13,
    DEV_IRREMOTE:    14,
    DEV_PIRMOTION:   15,
    DEV_INFRARED:    16,
    DEV_LINEFOLLOWER:    17,
    DEV_IRREMOTECODE:    18,
    DEV_SHUTTER: 20,
    DEV_LIMITSWITCH: 21,
    DEV_BUTTON:  22,
    DEV_HUMITURE:    23,
    DEV_FLAMESENSOR: 24,
    DEV_GASSENSOR:   25,
    DEV_COMPASS: 26,
    DEV_TEMPERATURE_板载:  27,
    DEV_DIGITAL: 30,
    DEV_ANALOG:  31,
    DEV_PWM: 32,
    DEV_SERVO_PIN:   33,
    DEV_TONE:    34,
    DEV_BUTTON_INNER:    35,
    DEV_ULTRASONIC_ARDUINO:  36,
    DEV_PULSEIN: 37,
    DEV_STEPPER: 40,
    DEV_LEDMATRIX:   41,
    DEV_TIMER:   50,
    DEV_JOYSTICKMOVE:    52,
    DEV_PRESSURE: 0X40,

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
            LED_PANEL: 0,

            // 其他
            ULTRASONIC: 6,
            LINEFOLLOWER: 2,
            PRESSURE: 4,
        },
        "mcore": {
            COMMON_LIST: [1, 2, 3, 4],
            MOTOR: [9,10],
            LED: 7,
            LIGHT: 6
        },
        "orion": {
            MOTOR: [9,10],
            COMMON_LIST: [1, 2, 3, 4],
        },
        "zeroPI": {
            MOTOR: [9,10],
            COMMON_LIST: [1, 2, 3, 4],
        }
    },

    //RGB的亮度缩小倍率
    RGB_BRIGHTNESS: 20,
    LedPosition : {
        LEFT: 1,
        RIGHT: 2,
        BOTH: 0
    },

    // tone
    ToneHzTable : {
        "C2":65, "D2":73, "E2":82, "F2":87, "G2":98, "A2":110, "B2":123, "C3":131, "D3":147, "E3":165, "F3":175, "G3":196, "A3":220, "B3":247, "C4":262, "D4":294, "E4":330, "F4":349, "G4":392, "A4":440, "B4":494, "C5":523, "D5":587, "E5":658, "F5":698, "G5":784, "A5":880, "B5":988, "C6":1047, "D6":1175, "E6":1319, "F6":1397, "G6":1568, "A6":1760, "B6":1976, "C7":2093, "D7":2349, "E7":2637, "F7":2794, "G7":3136, "A7":3520, "B7":3951, "C8":4186
    },

    ulTimer: 0,
    pressureTimer: 0,
    timeCount2: 0,
    timeCount1: 0,
    timeCount: 0,
    lineTimer: 0
};


function getDevicePort() {
    return SETTING.PORT[DEVICE_TYPE];
}


function decodeData(data) {
    var bytes = data;

    for (var i = 0; i < bytes.length; i++) {
        buffer.push(bytes[i]);
        var length = buffer.length;
        // filter data
        if (length > 1 && buffer[length - 2] == SETTING.READ_CHUNK_SUFFIX[0] && buffer[length - 1] == SETTING.READ_CHUNK_SUFFIX[1]) {
            if (buffer.length != 10) {
                buffer = [];
            } else {
                // 以下为有效数据, 获取返回字节流中的索引位
                var dataIndex = buffer[SETTING.READ_BYTES_INDEX];
                var promiseType = PromiseList.getType(dataIndex);

                switch(promiseType) {
                    case PromiseList.PromiseType.LINEFOLLOW:
                        // 巡线
                        lineFollow_callback();
                        break;
                    case PromiseList.PromiseType.ULTRASONIC:
                        // 超声波
                        ultrasoinic_callback();
                        break;
                    case PromiseList.PromiseType.LIGHTSENSOR:
                        // 光线传感器
                        lightSensor_callback();
                        break;
                    case PromiseList.PromiseType.TEMPERATURE:
                        // 温度传感器
                        temperature_callback();
                        break;
                    case PromiseList.PromiseType.VOLUME:
                        // 音量传感器
                        volume_callback();
                        break;
                    case PromiseList.PromiseType.WEIGHT:
                        // 音量传感器
                        pressure_callback();
                        break;
                    default:
                        break;
                }
                buffer = [];
            }
        }
    }
};

var PromiseList =  {
    PromiseType : {
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
        // 压力传感器
        WEIGHT: 8
    },

    requestList: new Array(256),
    index: 1,

    // 将请求加入请求队列，拥有类型，回调，以及值对象，
    // 并返回该请求在列表中的索引
    add: function(type) {
        this.index++;
        if (this.index > 255) {
            this.index = 1;
        }
        this.requestList[this.index] = {
            type: type
        };
        return this.index;
    },

    setIndex: function(type) {
        this.index++;
        if (this.index > 255) {
            this.index = 1;
        }
        return this.index;
    },

    // 将值写到对应请求的值对象中，并且启动回调
    receiveValue: function(index, value) {
        if (this.requestList[index]) {
            if(callback) {
                this.requestList[index].callback(value);
            }
        }
    },

    getType: function(index) {
        // return this.requestList[index].type;
        return 1;
    }
};

// 超声波控制
function doUltrasoinic() {
    SETTING.ulTimer = setInterval(function() {
        SETTING.timeCount1++;
        if(SETTING.timeCount1 > 1000) {
            clearInterval(SETTING.ulTimer);
            SETTING.timeCount1 = 0;
            return false;
        }
        PromiseList.add(PromiseList.PromiseType.ULTRASONIC);
        ultrasoinic(0, PromiseList.PromiseType.ULTRASONIC);
    }, 500);
};

function stopUltrasoinic() {
    clearInterval(SETTING.ulTimer);
};

function ultrasoinic(slot, index) {
    var type = SETTING.DEV_ULTRASONIC;
    var port = getDevicePort().ULTRASONIC;
    buildModuleRead(type, port, slot, index);
}

// 读取压力传感器
function getPressure() {
    SETTING.ulTimer = setInterval(function() {
        SETTING.timeCount2++;
        if(SETTING.timeCount2 > 1000) {
            clearInterval(SETTING.pressureTimer);
            SETTING.timeCount2 = 0;
            return false;
        }
        pressure(0, PromiseList.PromiseType.WEIGHT);
    }, 500);
};

function stopPressure() {
    clearInterval(SETTING.pressureTimer);
};

function pressure(slot, index) {
    var type = SETTING.DEV_PRESSURE;
    var port = getDevicePort().ULTRASONIC;
    buildModuleRead(type, port, slot, index);
}


//------- 超声波回调执行 ---------
ultrasoinic_callback= function() {
    console.log('-------------ultrasoinic data start-------------');

    if(buffer[0] == 0xff && buffer[1] == 0x55) {
        // console.log(buffer[7] + '-' + buffer[6] + '-' + buffer[5] + '-' + buffer[4]);
        var distance = getResponseValue(parseInt(buffer[7]), parseInt(buffer[6]), parseInt(buffer[5]), parseInt(buffer[4]));
        console.log(distance);


        LastUltrasonicValue =  distance;

        // // 向客户端发送数据, 3秒以内算一次通过
        // globalSocketIO.emit('pushToWebClient', {
        //     "type": 'ultrasoinic',
        //     "result": distance
        // });
    } else {
        console.log('end');
    }
};

//------- 压力传感器回调执行 ---------
pressure_callback = function() {
    console.log('-------------pressure data start-------------');

    if(buffer[0] == 0xff && buffer[1] == 0x55) {
        // console.log(buffer[7] + '-' + buffer[6] + '-' + buffer[5] + '-' + buffer[4]);
        var result = getResponseValue(parseInt(buffer[7]), parseInt(buffer[6]), parseInt(buffer[5]), parseInt(buffer[4]));
        console.log(result);

        LastPressureValue = result;
        // // 向客户端发送数据, 3秒以内算一次通过
        // globalSocketIO.emit('pushToWebClient', {
        //     "type": 'pressure',
        //     "result": result
        // });
    } else {
        console.log('end');
    }
};


/**
 * 数据转化
 */
buildModuleRead = function(type, port, slot, index) {
    var a = new Array(9);
    a[0] = SETTING.CODE_CHUNK_PREFIX[0];
    a[1] = SETTING.CODE_CHUNK_PREFIX[1];
    a[2] = 0x5;
    a[3] = index;
    a[4] = SETTING.READMODULE;
    a[5] = type;
    a[6] = port;
    a[7] = slot;
    a[8] = 0;
    sendRequest(a);
};

buildModuleWriteShort = function(type, port, slot, value) {
    var a = new Array(10);
    a[0] = SETTING.CODE_CHUNK_PREFIX[0];
    a[1] = SETTING.CODE_CHUNK_PREFIX[1];
    a[2] = 0x6;
    a[3] = 0;
    a[4] = SETTING.WRITEMODULE;
    a[5] = type;
    a[6] = port;
    a[7] = value&0xff;
    a[8] = (value>>8)&0xff;
    a[9] = 0;
    sendRequest(a);
};

/**
 * build RGB machine code.
 * @private
 */
buildModuleWriteRGB = function(type, port, slot, index, r, g, b) {
    var a = new Array(12);
    a[0] = SETTING.CODE_CHUNK_PREFIX[0];
    a[1] = SETTING.CODE_CHUNK_PREFIX[1];
    a[2] = 0x8;
    a[3] = 0;
    a[4] = SETTING.WRITEMODULE;
    a[5] = type;
    a[6] = port;
    a[7] = index;
    a[8] = r;
    a[9] = g;
    a[10] = b;
    a[11] = 0;
    sendRequest(a);
};

/**
 * build Buzzer machine code
 * @private
 */
buildModuleWriteBuzzer = function(hz) {
    var a = new Array(10);
    a[0] = SETTING.CODE_CHUNK_PREFIX[0];
    a[1] = SETTING.CODE_CHUNK_PREFIX[1];
    a[2] = 0x5;  //后面的数据长度
    a[3] = 0;
    a[4] = SETTING.WRITEMODULE;
    a[5] = SETTING.TONE;
    a[6] = hz&0xff;
    a[7] = (hz>>8)&0xff;

    a[8] = 0;
    a[9] = 0;
    sendRequest(a);
};


// 发送字节流到串口
function sendRequest(bufferData) {
    serialPort.write(bufferData);
}

/* 解析从小车返回的字节数据 */
function getResponseValue(b1, b2, b3, b4) {
    var intValue = fourBytesToInt(b1,b2,b3,b4);
    var result = parseFloat(intBitsToFloat(intValue).toFixed(2));
    return result;
};

function fourBytesToInt(b1,b2,b3,b4 ) {
    return ( b1 << 24 ) + ( b2 << 16 ) + ( b3 << 8 ) + b4;
};

function intBitsToFloat(num) {
    /* s 为符号（sign）；e 为指数（exponent）；m 为有效位数（mantissa）*/
    s = ( num >> 31 ) == 0 ? 1 : -1,
    e = ( num >> 23 ) & 0xff,
    m = ( e == 0 ) ?
    ( num & 0x7fffff ) << 1 :
    ( num & 0x7fffff ) | 0x800000;
    return s * m * Math.pow( 2, e - 150 );
};
