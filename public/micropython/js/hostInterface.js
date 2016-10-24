// 监听串口返回的数据
socket.on('serialportData-receive', function(data) {
    MBlockly.Control.decodeData(data);
});

// 监听串口发送的数据
socket.on('serialportData-send', function(data) {
    // todo
});