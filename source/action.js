/**
 * @description action.js - define actions and dispose methods in control.js
 * @author Hujinhong
 * @copyright Makeblock.cc
 */

Sensorium = Sensorium || {};

Sensorium.Action = {
    buffer : [],
    baseSpeed: 85,
    // currentMode: 0,
    timeCount: 0,
    ulTimer: null,   // ultrasoinic timer
    lineTimer: null, // linefollow timer
    direction: [0,0],
    turnDegreeSpendTime : null,

    runSpeed : function(speed, dir) {
        var spd1 = -dir * speed;
        var spd2 = dir * speed;
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    turnSpeed : function(speed, dir) {
        // var spd1 = dir * speed;
        // var spd2 = dir * speed/2;
        if(dir == 1) {
            var spd1 = -1 * speed;
            var spd2 = speed/3;
        } else {
            var spd1 = -1 * speed/3;
            var spd2 = speed;
        }
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    setMotor : function(port, speed) {
        MBlockly.Control.setCodingMotor(port, speed);
    },

    stopSpeed: function() {
        MBlockly.Control.stopSpeed();
    },

    /*
     *  For mbot: turn 1° spend 10ms at speed 102
     *      1° = 10ms * 102
     *  @param  {num} degree - degree value
     *  @param  {num} dir - direction, 1: clockwise, -1: anticlockwise
     *  @param  {num} speed - speed value for clockwiseRotate and anticlockwiseRotate
     *  @param  {num} times - repeat times
     */
    turnDegree : function(degree, dir, speed, times) {
        var that = this;
        speed = speed ? speed : 102;
        times = times ? times : 1;
        this.turnDegreeSpendTime = (102 * 10) / speed * degree;

        this.turnSpeed(speed, dir);
        setTimeout(function() {
            that.stopSpeed();
        }, that.turnDegreeSpendTime * times);
    },

    forward : function() {
        var spd1 = -1 * this.baseSpeed;
        var spd2 = 1 * this.baseSpeed;
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    backForward : function() {
        var spd1 = 1 * this.baseSpeed;
        var spd2 = -1 * this.baseSpeed;
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    turnLeftLittle : function() {
        var spd1 = -1 * (this.baseSpeed - 30);
        var spd2 = 1 * this.baseSpeed;
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    turnRightLittle : function() {
        var spd1 = 1 * (this.baseSpeed - 20);
        var spd2 = 1 * (this.baseSpeed - 20);
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    turnLeftExtreme : function() {
        var spd1 = 1 * (this.baseSpeed - 20);
        var spd2 = 1 * (this.baseSpeed - 20);
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    turnRightExtreme : function() {
        var spd1 = -1 * (this.baseSpeed - 20);
        var spd2 = -1 * (this.baseSpeed - 20);
        MBlockly.Control.setSpeed(spd1, spd2);
    },

    clockwiseRotate : function(speed, time) {
        var that = this;
        var spd1 = -1 * speed;
        var spd2 = -1 * speed;
        MBlockly.Control.setSpeed(spd1, spd2);
        setTimeout(function() {
            MBlockly.Control.stopSpeed();
        }, time*1000);
    },

    antiClockwiseRotate : function(speed, time) {
        var that = this;
        var spd1 = 1 * speed;
        var spd2 = 1 * speed;
        MBlockly.Control.setSpeed(spd1, spd2);
        setTimeout(function() {
            MBlockly.Control.stopSpeed();
        }, time*1000);
    },

    clockwiseRotateTimes : function(speed, times) {
        this.turnDegree(360, -1, speed, times);
    },

    antiClockwiseRotateTimes : function(speed, times) {
        this.turnDegree(360, 1, speed, times);
    },

    // led
    setLed: function(r, g, b, position) {
        MBlockly.Control.setLed(r, g, b, position);
    },

    setLedPanel: function(r, g, b, position, port) {
        var position = position.data;
        // if(position == 'all') {
        //     MBlockly.Control.setLedPanel(r, g, b, 00, port);
        // } else if(position.hasStr('-')) {
        //     var posArary = position.split("-");
        //     if(posArary.length == 12) {
        //         MBlockly.Control.setLedPanel(r, g, b, 00, port);
        //     } else {
        //         for(var i in posArary) {
        //             setTimeout((function(i) {
        //                 MBlockly.Control.setLedPanel(r, g, b, posArary[i], port);
        //                 console.log(posArary[i]);
        //             })(i), 50);
        //         }
        //     }
        // } else {
        //     MBlockly.Control.setLedPanel(r, g, b, position, port);
        // }
        MBlockly.Control.setLedPanel(r, g, b, position, port);
    },

    stopLed: function(port) {
        MBlockly.Control.stopAllLed(port);
    },

    // tone
    playTone: function(toneName) {
        MBlockly.Control.playTone(toneName);
    },

    doUltrasoinic : function() {
        var that = this;
        this.ulTimer = setInterval(function() {
            that.timeCount++;
            if(that.timeCount > 10) {
                clearInterval(that.ulTimer);
                that.timeCount = 0;
                return false;
            }
            MBlockly.Control.ultrasoinic(0, 1);
        }, 1000);
    },

    stopUltrasoinic : function() {
        clearInterval(this.ulTimer);
    },

    doLineFollow : function() {
        var that = this;
        this.lineTimer = setInterval(function() {
            that.timeCount++;
            if(that.timeCount > 1000) {
                clearInterval(that.lineTimer);
                that.timeCount = 0;
                return false;
            }
            MBlockly.Control.lineFollow(0, 1);
        }, 1000);
    },

    stopLineFollow : function() {
        clearInterval(this.lineTimer);
    },

    stopAll: function() {
        MBlockly.Control.stopAll();
    }
};
