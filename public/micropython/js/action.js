MBlockly = MBlockly || {};


/**
 *
 *         | head | block num | type | cmd | value | 校验位 |  end |
 *  握手头：| 0xf0 | 0x01      | 0x58 |0x01 |0x01:在线，0x02:离线 | - | 0xf7 |

           | head | block num | type | cmd | length | data | 校验位 |  end |
 *  传输：  | 0xf0 | 0x01      | 0x58 |0x02 |        | -    | -     |  0xf7  |
 *
               | head | block num | type | cmd |  | 校验位 |  end |
 *  传输结束：  | 0xf0 | 0x01      | 0x58 |0x03 | - |  -   |  0xf7  |
 */

MBlockly.Control = {};

extend(MBlockly.Control, {

    // 每次最大的传输字符长度
    LIMIT_CHAR_LENGTH: 10,

    // 校验位，目前置为0，不做校验位处理
    CHECK_SUM: 0,

    // 和校验
    checkSum: function() {

    },

    sendBegin: function(type) {
        var rtype = 0x01;
        var a = [0xf0, 0x01, 0x58, 0x01, rtype, this.CHECK_SUM, 0xf7];
        this.send(a);
        console.log('begin');
    },

    sendEnd: function(type) {
        var a = [0xf0, 0x01, 0x58, 0x03, this.CHECK_SUM, 0xf7];
        this.send(a);
        console.log('end');
    },

    /**
     * send content
     * @param  {number} type    01表示在线（存在flash中），02表示预览(存在rom中)
     * @param  {string} content string
     */
    sendContent: function(type, content) {
        var that = MBlockly.Control;
        that.sendBegin();

        function sendStr(str) {
            var a = [0xf0, 0x01, 0x58, 0x02, str.length, str, that.CHECK_SUM, 0xf7];
            MBlockly.Control.send(a);
        }

        function sliceStr(data) {
            var result;
            if(data.length > that.LIMIT_CHAR_LENGTH) {
                result = data.slice(0, that.LIMIT_CHAR_LENGTH);
                sendStr(result);
                data = data.slice(that.LIMIT_CHAR_LENGTH, data.length);
                sliceStr(data);
            } else {
                result = data.slice(0, data.length);
                sendStr(result);
                that.sendEnd();
            }
        }

        sliceStr(content);
    },

    send: function(a) {
        tester.sendSerialData(a);
    }
});

// 接收的消息队列并实现组包，例如：ff 55 3c 02 10  01 0d 0a ff 55 03 04 01 0d 0a 0a 32
MBlockly.Control.decodeData = function(bytes) {
    var data;
    if(typeof(bytes) == 'string') {
        console.log("【receive data】:" + bytes);
        data = bytes.split(" ");
    } else {
        data = bytes;
    }
    // parse buffer data
    for (var i = 0; i < data.length; i++) {
        if (parseInt(data[i]) === 0xf0) {
            // start flag
            this.recvLength = 0;
            this.beginRecv = true;
        } else if (parseInt(data[i]) === 0xf7) {
            // end flag
            this.beginRecv = false;
            var buf = this.buffer.slice(0, this.recvLength - 1);

            // 计算对应传感器的返回值
            this.sensor_callback(buf);
        } else {
            // normal
            if (this.beginRecv) {
                if (this.recvLength >= this.SETTING.REC_BUF_LENGTH) {
                    console.log("receive buffer overflow!");
                }
                this.buffer[this.recvLength++] = parseInt(data[i]);
            }
        }
    }
};

MBlockly.Control.sensor_callback = function(data) {

};