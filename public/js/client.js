socket.on('pushToWebClient', function(data) {
    // var msg;
    // if(typeof(data.methodParams) == 'string') {
    //     msg = data.methodName + '(' + data.methodParams + ');';

    // } else {
    //     msg = data.methodName + '(' + data.methodParams.join(',') + ');';
    // }

    // var str = $('.msg-fun .msg-content').html() + msg + '<br>';
    // $('.msg-fun .msg-content').html(str);
});


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
    $('#msgContent').animate({scrollTop: scrollOffset}, 300);
}

$(function() {
    $('#com_num').on("change", function() {
        $('.serialport .tip').html('<span class="text-muted">串口处于关闭状态</span>');
        postSerialsInfo();
    });


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

    var beats = {"Half":500,"Quater":250,"Eighth":125,"Whole":1000,"Double":2000,"Zero":0};

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
            for(var i in toneHzTable) {
                var a = '<button class="btn btn-small" onclick="action.playTone(\'' + i.toUpperCase() + '\', ' + beat + ');">' + i.toUpperCase() + '</button>';
                $('.mzero-buzzers').append($(a));
            }
        }

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
});


/**----------------------
 * util funcs
 -----------------------*/
function outputValue(hexStr) {
    var hexStrArray = hexStr.split(" ");
    if(hexStrArray.length >= 10 && hexStrArray[hexStrArray.length - 1] == "0a" && hexStrArray[hexStrArray.length - 2] == "0d") {
        var a = hexStrArray.slice(hexStrArray.length - 6, hexStrArray.length - 2).join(" ");
        var value = calculate(a);
        $('#calValue').text(value);
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