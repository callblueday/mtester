/**
 * 与串口通信的类
 */

var control = {
    socket: null,
    serialPort: null
};


control.sendRequest = function(data) {
    this.socket.emit('serialportData-send', data);
    if(this.serialPort && this.serialPort.isOpen()) {
        console.log('send: ' + data);
        this.serialPort.write(data);
    } else {
        console.log('串口未开启');
    }
}


control.decodeData = function(data) {
    console.log(data.toString());
    this.socket.emit('serialportData-receive', data.toString());
}



module.exports = control;