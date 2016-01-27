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

        // 设置直流电机
        setDcMotor: function(speed, port) {
            var data = {
                methodName: 'action.setDcMotor',
                methodParams: [speed, port],
                type: 'dcMotor',
                params: [speed, port]
            }
            that.sendRequest(data);
        },

        // 设置编码电机
        setEncoderMotor: function(port, speed, distance) {

        },

        // 设置步进电机
        setStepperMotor: function(port, speed, distance) {

        },

        // 设置舵机
        setServoMotor: function(port, speed, distance) {

        },

        /**
         * send data via serialport
         * @param  {string | array} str decimal interger array.
         * @return void.
         */
        sendSerialData: function(str, type) {
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
                    console.log(temp);
                    that.sendRequest(data);
                }
            }
        },

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

        // Light
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


        /****** Todo ******/
        stopAll: function() {
            MBlockly.Control.stopAll();
        }
    };
};


Sensorium.prototype.sendRequest = function(data) {
    this.socket.emit('fromWebClient', data);
};