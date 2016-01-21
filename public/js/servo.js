/**
 * 舵机测试程序
 * Copyright 2015- Makeblock, Inc.
 * Author callblueday
 * Licensed under the MIT license
 */


// 报告测试的设备类型
sensorium.sendRequest({
    type: "deviceType",
    params: 'servo'
});

$(function() {
    $('.serialport .device-type').text('servo');
});

// 优必选舵机协议
var ybx = {
    setting: {
        CODE_WRITE_PREFIX: [0xfa, 0xaf],
        CODE_READ_PREFIX: [0xfc, 0xcf],
        CODE_SUFFEX: 0XED,
        ID: 0, // 范围为1-240，0时，为广播模式
        MODE_MOVE: 0x01, // 指定时间运动
        MODE_LED: 0x04, // led灯开关
        MODE_READ_ANGLE: 0x02, // 角度回读（舵机失电指令）
        MODE_MODIFY_ID: 0xCD, // 修改ID
        MODE_SET_ADJUSTED_VALUE: 0xD2, // 设置舵机角度校正值
        MODE_READ_ADJUSTED_VALUE: 0xD4, // 读舵机角度校正值
        MODE_READ_VERSION: 0x01 // 读版本（不能广播）
    },


    move: function(targetAngle, duration, endDelay, idNumber) {
        var targetAngle = parseInt(targetAngle);
        var duration = parseInt(duration);
        var endDelay = parseInt(endDelay);
        var idNumber = parseInt(idNumber);
        this.turnAngle(targetAngle, duration, endDelay, idNumber);
    },


    /**
     * 设置舵机ID
     * @param {int} idNumber 待设定的新id
     */
    setIdNumber: function(idNumber) {
        var idNumber = parseInt(idNumber);

        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = 0x00;
        a[3] = this.setting.MODE_MODIFY_ID;
        a[4] = 0x00;
        a[5] = idNumber; // 新id
        a[6] = 0x00;
        a[7] = 0x00;
        a[8] = a[2] + a[3] + a[4] + a[5] + a[6] + a[7];
        a[9] = this.setting.CODE_SUFFEX;
        console.log(a);
        action.sendSerialData(a);
    },

    /**
     * 舵机在指定时间运动到指定角度
     * @param  {number} targetAngle target angle 0~252
     * @param  {number} duration   舵机从现在的角度到目标角度运行所用时间，单位，20ms
     * @param  {number} endDelay   舵机执行这帧指令后所等待时间，等待时间完成后才会处理新的指令，单位，20ms
     * @param  {number} idNumber   舵机被分配的id, 00 表示广播
     * @return void.
     */
    turnAngle: function(targetAngle, duration, endDelay, idNumber) {
        idNumber = idNumber ? idNumber : this.setting.ID;

        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = idNumber;
        a[3] = this.setting.MODE_MOVE;
        a[4] = targetAngle; // 0 - 252
        a[5] = duration; // 0 - 100
        a[6] = endDelay & 0xff;
        a[7] = (endDelay >> 8) & 0xff;
        a[8] = a[2] + a[3] + a[4] + a[5] + a[6] + a[7];
        a[9] = this.setting.CODE_SUFFEX;
        console.log(a);
        action.sendSerialData(a);
    },

    turnOnLed: function() {
        //fa af 00 04 00 00 00 00 04 ed
        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = this.setting.ID;
        a[3] = this.setting.MODE_LED;
        a[4] = 0;
        a[5] = 0;
        a[6] = 0;
        a[7] = 0;
        a[8] = a[2] + a[3] + a[4] + a[5] + a[6] + a[7];
        a[9] = this.setting.CODE_SUFFEX;
        action.sendSerialData(a);
    },

    turnOffLed: function() {
        // fa af 00 04 01 00 00 00 05 ed
        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = this.setting.ID;
        a[3] = this.setting.MODE_LED;
        a[4] = 1;
        a[5] = 0;
        a[6] = 0;
        a[7] = 0;
        a[8] = a[2] + a[3] + a[4] + a[5] + a[6] + a[7];
        a[9] = this.setting.CODE_SUFFEX;
        action.sendSerialData(a);
    },
    readAngle: function() {
        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = this.setting.ID;
        a[3] = this.setting.MODE_READ_ANGLE;
        a[4] = 0;
        a[5] = 0;
        a[6] = 0;
        a[7] = 0;
        a[8] = a[2] + a[3] + a[4] + a[5] + a[6] + a[7];
        a[9] = this.setting.CODE_SUFFEX;
        action.sendSerialData(a);
    }
};

// makeblock 舵机协议
var mbServo = {
    setting: {
        START_SYSEX            : 0xF0, // start a MIDI SysEx message
        END_SYSEX              : 0xF7, // end a MIDI SysEx message
        ASSIGN_ID              : 0x10, // command assign id
        START_ID               : 0x00,  // master control ,start ID = 0,fist servo =1 ect...
        PROCESS_SUC            : 0x0F,
        PROCESS_BUSY           : 0x10,
        PROCESS_ERROR          : 0x11,
        WRONG_TYPE_OF_SERVICE  : 0x12,
        CTL_SET_BAUD_RATE      : 0x13,
        SERVO_TYPE             : 0x70,
        GET_SPEED              : 0x23,
        GET_POSITION           : 0x22,
        GET_TEMPRATURE         : 0x25,
        GET_VOLTAGE            : 0x27,
        GET_CURRENT            : 0x26,//************************************
        CTL_ERROR_CODE         : 0x1F,//************************************
        NUMAMOSTRAS            : 5,   // Number of samples
        TEMPERATURENOMINAL     : 25, ///Nominl temperature depicted on the datasheet
        SERIESRESISTOR         : 10000, // Value of the series resistor
        BCOEFFICIENT           : 3377, //// Beta value for our thermistor(3350-3399)
        TERMISTORNOMINAL       : 10000,// Nominal temperature value for the thermistor
        SET_SERVO_ABSOLUTE_POS : 0x11,
        SELFDETECT_MODE        : 0x01,
        ASK_MODE               : 0x00,
        AUTO_MODE              : 0x02,
        SET_SERVO_BREAK        : 0x16,
        BAUD_SWITCH_921600     : 0x01,
        BAUD_SWITCH_115200     : 0x00
    },

    initSerial: function() {
        // F0 FF 10 00 7F F7
        var a = new Array(6);
        a[0] = this.setting.START_SYSEX;
        a[1] = 0xff;
        a[2] = 0x10;
        a[3] = 00;
        a[4] = 0x7f;
        a[5] = this.setting.END_SYSEX;
        action.sendSerialData(a);
    },
    // 255 速度 转 400度
    // F0 01 70 11 10 03 00 7f 01 00 f7
    // 00000001 10010000
    // 00000000 00000011 00010000
    // 00 03 10
    setAbsolutePos: function(angle, speed) {
        var angleBytes = this.sendShort(angle);
        var speedBytes = this.sendShort(speed);

        var a = new Array(11);
        a[0] = this.setting.START_SYSEX;
        a[1] = 0x01;
        a[2] = 0x70;
        a[3] = 0x11;
        a[4] = angleBytes[0];
        a[5] = angleBytes[1];
        a[6] = angleBytes[2];
        a[7] = speedBytes[0];
        a[8] = speedBytes[1];
        a[9] = speedBytes[2];
        a[10] = this.setting.END_SYSEX;
        action.sendSerialData(a);
    },

    setRelativePos: function(angle, speed) {
        var angleBytes = this.sendShort(angle);
        var speedBytes = this.sendShort(speed);

        var a = new Array(11);
        a[0] = this.setting.START_SYSEX;
        a[1] = 0x01;
        a[2] = 0x70;
        a[3] = 0x12;
        a[4] = angleBytes[0];
        a[5] = angleBytes[1];
        a[6] = angleBytes[2];
        a[7] = speedBytes[0];
        a[8] = speedBytes[1];
        a[9] = speedBytes[2];
        a[10] = this.setting.END_SYSEX;
        action.sendSerialData(a);
    },

    /**
     * int to 7 bytes
     * @param  {number} val number value
     * @return {array}    bytes array
     * 400
     * [16, 3, 0]
     */
    sendShort: function(val) {
        var _7bit = [];
        var temp0, temp1;
        temp0 =  val & 0xfF;        //low byte
        temp1 =  (val >> 8) & 0xFF;// high byte
        _7bit[0] = (temp0&0xff) & 0x7f;
        _7bit[1] = (((temp1&0xff) << 1) | ((temp0&0xff) >> 7)) & 0x7f;
        _7bit[2] = (temp1 >> 6) & 0x7f;
        return _7bit;
    },

};