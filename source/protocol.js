'use strict';

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
    JOYSTICKMOVE:    52,

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
            MOTOR: [9,10]
        },
        "zeroPI": {
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
}

