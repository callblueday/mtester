/* 舵机数据处理 */
ServoControl = function(data, socket) {
    console.log(1);
    this.socket = socket;
    socket.emit('reportBoardInfo', "优必选舵机");
    this.data = data;
};

ServoControl.prototype.decodeData = function(data) {
    var bytes = data;
    // 报告主板信息
    if(bytes.toString().indexOf("Version") != -1) {
        this.socket.emit('reportBoardInfo', bytes.toString());
    }

    this.socket.emit('serialportData-receive', data);


    for (var i = 0; i < bytes.length; i++) {
        this.buffer.push(bytes[i]);
        var length = this.buffer.length;


        if(this.buffer[i] == '0xaa') {
            globalSocketIO.emit('serialportData-receive', this.bytes.join(' '));
        }

        // 过滤无效数据
        if (length > 0 && this.buffer[0] == '0xed') {
            if (this.buffer.length != 10) {
                this.buffer = [];
            } else {
                // 以下为有效数据, 获取返回字节流中的索引位
                var id = this.buffer[2];

                // 返回有效数据
                globalSocketIO.emit('serialportData-receive', this.buffer.join(' '));

                this.buffer = [];
            }
        }
    }
};


module.exports = ServoControl;