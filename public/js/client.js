socket.on('pushToWebClient', function(data) {
    var msg;
    if(data.type == 'serialData') {
        msg = data.methodName + '(' + data.methodParams + ');';
    } else {
        msg = data.methodName + '(' + data.methodParams.join(',') + ');';
    }

    var str = $('.msg-fun .msg-content').html() + msg + '<br>';
    $('.msg-fun .msg-content').html(str);
});


// 监听主板类型
socket.on('reportBoardInfo', function(str) {
    $('.version').text(str);
});


// 监听
socket.on('serialportData-send', function(data) {
    var temp = strToHex(data);
    var str = $('.msg-serial .msg-content').html() + temp + '<br>';
    $('.msg-serial .msg-content').html(str);
});

// 监听串口返回的十六进制数据
socket.on('serialportData-receive', function(data) {
    var temp = strToHex(data.split(" "));
    var str = $('.msg-serial .msg-content').html() + '<span class="data-recieve">' + temp + '</span><br>';
    $('.msg-serial .msg-content').html(str);
});

// 监听传感器具体返回值
socket.on('serialportData-receive-data', function(data) {
    var type = data.type;
    var value = data.value;

    if(type == 'ultrasonic') {
        $('.distance').text(value);
    }
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
    }
})


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



$('.ops input[type="text"]').on('click', function(e) {
    e.stopPropagation();
});


/* 辅助函数 */
// 将十进制数组转为16进制
function strToHex(data) {
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



