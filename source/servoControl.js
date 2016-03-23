/* 舵机数据处理 */
ServoControl = function(data, socket) {
    this.socket = socket;
    this.socket.emit('reportBoardInfo', "优必选舵机");
    this.data = data;
    this.buffer = [];
};

ServoControl.prototype.decodeData = function(data) {
    console.log('nihao: ' + data);
    var bytes = data;

    for (var i = 0; i < bytes.length; i++) {
        this.buffer.push(bytes[i]);
        var length = this.buffer.length;

        // 过滤无效数据
        // if (length == 10 || length == 1) {
        //     // 返回有效数据
        //     this.socket.emit('serialportData-receive', this.buffer.join(' '));
        //     // this.socket.emit('serialportData-receive', this.buffer.join(' '));\
        //     this.buffer = [];
        // }

        // // 过滤无效数据
        if (length > 1 && this.buffer[length - 1] == 0xf7 && this.buffer[0] == 0xf0) {
            // 返回有效数据
            this.socket.emit('serialportData-receive', this.buffer.join(' '));

            this.buffer = [];
        }
    }
};

module.exports = ServoControl;