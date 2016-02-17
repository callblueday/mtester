// 监听主板类型
socket.on('reportBoardInfo', function(str) {
    $('.version').text(str);
});


// 监听
socket.on('serialportData-send', function(data) {
    var temp = intStrToHexStr(data);
    var str = $('.msg-serial .msg-content').html() + temp + '<br>';
    $('.msg-serial .msg-content').html(str);
});

socket.on('log', function(msg) {
    var str = $('.msg-serial .msg-content').html() + msg.toString() + '<br>';
    $('.msg-serial .msg-content').html(str);
});


// 监听串口返回的十六进制数据
socket.on('serialportData-receive', function(data) {
    if(data.length){
        var temp = intStrToHexStr(data.split(" "));
        var str = $('.msg-serial .msg-content').html() + '<span class="data-recieve">' + temp + '</span><br>';
        $('.msg-serial .msg-content').html(str);
        outputValue(temp);
        toBottom();
    }
});

// 监听传感器具体返回值
socket.on('serialportData-receive-data', function(data) {
    var type = data.type;
    var value = data.value;

    $('.' + type).find('.sensor-value').text(value);
});


// 监听串口相关信息
socket.on('serials_to_web', function (data) {
    document.getElementById("com_num").options.add(new Option(data, data));
});

socket.on('serial_state', function (data) {
    if(data == "open") {
        $('.serialport .tip').html('<span class="text-success">串口打开成功</span>');

    } else {
        $('.serialport .tip').html('<span class="text-muted">串口处于关闭状态</span>');
        $('.version').text("");
    }
})

/**----------------------
 * dom events
 -----------------------*/

// 将滚动条始终置于页面底部
function toBottom() {
    var scrollOffset = $('#msgContent')[0].scrollHeight - $('#msgContent').height();
    $('#msgContent').animate({scrollTop: scrollOffset}, 0);
}

// 显示设备介绍
function showDeviceIntro() {
    var data = {
        "bluetoothModule": "bluetoothModule",
        "touchSensor": "touchSensor",
    };

    // $("[data-device]").hover(function() {
    //     var deviceName = $(this).attr("data-device");
    //     if(deviceName) {
    //         var imgSrc = "images/device/" + deviceName + ".jpg";
    //         $('.pic-show .img-wrap img').attr("src", imgSrc);
    //         $('.pic-show').css("left", 0);
    //         $('.pic-show .img-title').text(deviceName);
    //     }
    // }, function() {
    //     $('.pic-show').css("left", "-101%");
    // });
    //
    $("[data-device]").on("mouseover", function() {
        var deviceName = $(this).attr("data-device");
        if(deviceName) {
            var imgSrc = "images/device/" + deviceName + ".jpg";
            $('.pic-show .img-wrap img').attr("src", imgSrc);
            $('.pic-show').css("left", 0);
            $('.pic-show .img-title').text(deviceName);
        }
    });

    $("[data-device]").on("mouseout", function() {
        $('.pic-show').css("left", "-101%");
    });
}

$(function() {
    // 提示框
    $('[data-toggle="tooltip"]').tooltip();

    // port 口改变监听
    $('#com_num').on("change", function() {
        $('.serialport .tip').html('<span class="text-muted">串口处于关闭状态</span>');
        postSerialsInfo();
    });

    // 介绍具体设备
    showDeviceIntro();

    function postSerialsInfo() {
        var com_num = $("#com_num").find("option:selected").val(); //获取串口号
        var data = {
            comName: com_num
        };
        socket.emit('open_serial', data);
    }

    // 发送设备类型
    function sendDeviceType(type) {
        var data = {
            type: "deviceType",
            params: type
        };
        socket.emit('fromWebClient', data);
    }


    $('.ops input[type="text"], .ops input[type="number"], .ops select').on('click', function(e) {
        e.stopPropagation();
    });

    $('.clear-screen').on("click", function() {
        $('.msg-serial .msg-content').html("");
    });

    $('#dataSendType').on('change', function() {
        $(this).attr("data-type", $(this).val());
        console.log('发送格式为：' + $(this).val());
    });

    // tone
    // 原始数据：D5: 587 "E5": 658,"F5": 698,"G5": 784,"A5": 880,"B5": 988,"C6": 1047
    var toneHzTable = {
        "C2": 65,"D2": 73,"E2": 82,"F2": 87,"G2": 98,"A2": 110,"B2": 123,
        "C3": 131,"D3": 147,"E3": 165,"F3": 175,"G3": 196,"A3": 220,
        "B3": 247,"C4": 262,"D4": 294,"E4": 330,"F4": 349,"G4": 392,
        "A4": 440,"B4": 494,"C5": 523,"D5": 555,"E5": 640,"F5": 698,
        "G5": 784,"A5": 880,"B5": 988,"C6": 1047,"D6": 1175,"E6": 1319,
        "F6": 1397,"G6": 1568,"A6": 1760,"B6": 1976,"C7": 2093,"D7": 2349,
        "E7": 2637,"F7": 2794,"G7": 3136,"A7": 3520,"B7": 3951,"C8": 4186
    };

    var beats = {"Quater":250,"Half":500,"Eighth":125,"Whole":1000,"Double":2000,"Zero":0};

    (function() {
        if($("#toneList").length) {
            for(var i in toneHzTable) {
                $("#toneList")[0].options.add(new Option(i, i));
            }
        }
        $('#toneList').on('change', function() {
            var hz = toneHzTable[$(this).val()];
            $(this).parent().find('.hz').text(hz);
        });

        if($('#beats').length) {
            for(var i in beats) {
                $('#beats')[0].options.add(new Option(i, beats[i]));
            }
        }

        if($('.mzero-buzzers').length) {
            var beat = "$(\'#beats\').val()";
            var port = "$(\'#tonePort\').val()";
            for(var i in toneHzTable) {
                var a = '<button class="btn btn-small" onclick="action.playTone(' + port + ', \'' + i.toUpperCase() + '\', ' + beat + ');">' + i.toUpperCase() + '</button>';
                $('.mzero-buzzers').append($(a));
            }
        }

        countDevices();

    })();

    // 主动发送设备类型，默认为2560
    sendDeviceType("2560");
    $('#deviceType').on("change", function() {
        var type = $(this).val();
        sendDeviceType(type);
        if($('#deviceHelp').length) {
            $('#deviceHelp span').text(type);
        }
    });

    // 统计传感器、硬件设备数量
    function countDevices() {
        var groups = $('.category');
        for(var i = 0; i < groups.length; i++) {
            var count = $(groups[i]).find('.panel-body .group').length;
            $(groups[i]).find('.badge').text(count);
        }
    }
});


/**----------------------
 * 回复数据数值解析
 * 从左到右第四位数据：
 * 1: 单字符(1 byte)
 * 2： float(4 byte)
 * 3： short(2 byte)，16个长度
 * 4： 字符串(length)
 * 5： double(4 byte)
 * 6: long(4 byte)
 *-----------------------*/

function outputValue(hexStr) {
    var hexStrArray = hexStr.split(" ");
    if(hexStrArray[hexStrArray.length - 1] == "0a" && hexStrArray[hexStrArray.length - 2] == "0d") {
        if(hexStrArray[3] == "03") {
            // 2byte
            var a = hexStrArray.slice(hexStrArray.length - 4, hexStrArray.length - 2).join(" ");
            var value = calculate(a);
            $('#calValue').text(value);
        } else if(hexStrArray[3] == "01") {
            // 1byte
            var a = hexStrArray.slice(hexStrArray.length - 3, hexStrArray.length - 2).join(" ");
            var value = calculate(a);
            $('#calValue').text(value);
        } else if( hexStrArray[3] == "04") {
            // 字符串
            var value = hexStr2IntArray(hexStr).toString();
            $('#calValue').text(value);
        } else {
            // 4byte
            var a = hexStrArray.slice(hexStrArray.length - 6, hexStrArray.length - 2).join(" ");
            var value = calculate(a);
            $('#calValue').text(value);
        }
    }
}

// 计算数值
function calculate(hexStr) {
    var intArray = hexStr2IntArray(hexStr);
    var result = intArray2float(intArray);

    $('#calValue').text(result);

    return result;
}


// 将十进制字符串数组转为16进制
function intStrToHexStr(data) {
    var temp = [];
    for(var i = 0; i < data.length; i++) {
        if(data[i] != null) {
            var item =  parseInt(data[i]).toString(16);
            if(item.length == 1) {
                item = "0" + item;
            }
            temp.push(item);
        }
    }
    return temp.join(" ");
}

// 十六进制字符串转成十进制
function hexStr2IntArray(str) {
    var a = str.split(" ");
    var arr = [];
    for(var i in a) {
        var num = parseInt(a[i], 16);
        arr.push(num);
    }
    arr.reverse();
    console.log(arr);
    return arr;
}

 /**
 * 计算数值: short型字节数据转换成浮点型
 * @param  {array}tArray 十进制数组
 * @return {float}    十进制
 */
function intArray2float(intArray) {
    // FIXME: n个byte转成int值
    var bytesToInt = function(intArray) {
        var val = 0;
        for(var i = intArray.length - 1; i >= 0; i--) {
            val += (intArray[intArray.length - i - 1] << (i * 8) );
        }
        return val;
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
    var intValue = bytesToInt(intArray);
    var result = parseFloat(intBitsToFloat(intValue).toFixed(2));
    return result;
}

/**
 * float to bytes
 * 现将float转成整形，再将整形转成字节表示
 * @param  {float} float number
 * @return {bytes}
 */
function float32ToBytes(value) {
    var bytesInt = 0;
    switch (value) {
        case Number.POSITIVE_INFINITY: bytesInt = 0x7F800000; break;
        case Number.NEGATIVE_INFINITY: bytesInt = 0xFF800000; break;
        case +0.0: bytesInt = 0x40000000; break;
        case -0.0: bytesInt = 0xC0000000; break;
        default:
            if (Number.isNaN(value)) { bytesInt = 0x7FC00000; break; }

            if (value <= -0.0) {
                bytesInt = 0x80000000;
                value = -value;
            }

            var exponent = Math.floor(Math.log(value) / Math.log(2));
            var significand = ((value / Math.pow(2, exponent)) * 0x00800000) | 0;

            exponent += 127;
            if (exponent >= 0xFF) {
                exponent = 0xFF;
                significand = 0;
            } else if (exponent < 0) exponent = 0;

            bytesInt = bytesInt | (exponent << 23);
            bytesInt = bytesInt | (significand & ~(-1 << 23));
        break;
    }
    var bytesArray = int2BytesArray(bytesInt);
    return bytesArray;
};

/**
 * 整形转换成字节数组
 * @param  {number} value 整形
 * @return {array}  array数组
 */
function int2BytesArray(value) {
    var bytesArray = [];
    var b1 = (value & 0xff).toString(16);
    var b2 = ((value >> 8) & 0xff).toString(16);
    var b3 = ((value >> 16) & 0xff).toString(16);
    var b4 = ((value >> 24) & 0xff).toString(16);
    bytesArray.push(b1);
    bytesArray.push(b2);
    bytesArray.push(b3);
    bytesArray.push(b4);
    return bytesArray;
}