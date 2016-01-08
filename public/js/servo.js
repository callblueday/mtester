/**
 * 舵机测试程序
 * Copyright 2015- Makeblock, Inc.
 * Author callblueday
 * Licensed under the MIT license
 */

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


    move: function(targetAngle, duration, endDelay) {
        var targetAngle = parseInt(targetAngle);
        var duration = parseInt(duration);
        var endDelay = parseInt(endDelay);
        this.turnAngle(targetAngle, duration, endDelay);
    },


    /**
     * 舵机在指定时间运动到指定角度
     * @param  {number} targetAngle target angle 0~252
     * @param  {number} duration   舵机从现在的角度到目标角度运行所用时间，单位，20ms
     * @param  {number} endDelay   舵机执行这帧指令后所等待时间，等待时间完成后才会处理新的指令，单位，20ms
     * @return void.
     */
    turnAngle: function(targetAngle, duration, endDelay) {
        var a = new Array(10);
        a[0] = this.setting.CODE_WRITE_PREFIX[0];
        a[1] = this.setting.CODE_WRITE_PREFIX[1];
        a[2] = this.setting.ID;
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