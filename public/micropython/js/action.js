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
    LIMIT_CHAR_LENGTH: 100,

    // 和校验
    checkSum: function() {

    },

    // 0x01:在线，0x02:离线
    sendBegin: function(type) {
        var rtype = type || 0x01;
        var a = [0xff, 0x55, 0x04, 0x00, 0x02, 0x50, rtype];
        this.send(a);
        console.log('begin');
    },

    sendEnd: function() {
        var a = [0xff, 0x55, 0x04, 0x00, 0x02, 0x50, 0x04];
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

        function sendStr(str) {
            var r = that.stringToAsciiCode(str);
            var a = [0xff, 0x55, r.length + 4, 0x00, 0x02, 0x50, 0x03].concat(r);
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

        that.sendBegin(type);
        sliceStr(content);

    },

    send: function(a) {
        tester.sendSerialData(a);
    },

    stringToAsciiCode: function(string) {
        var result = [];
        var list = string.split("");
        for(var i in list) {
            result.push(list[i].charCodeAt());
        }
        return result;
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
        if (parseInt(data[i]) === 0x55 && parseInt(data[i - 1]) === 0xff) {
            // start flag
            this.recvLength = 0;
            this.beginRecv = true;
        } else if (parseInt(data[i - 1]) === 0x0d && parseInt(data[i]) === 0x0a) {
            // end flag
            this.beginRecv = false;
            var buf = this.buffer.slice(0, this.recvLength - 1);
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

/**
 * 回复数据数值解析
 * @param  {string} type 传感器的类型
 * @param  {array} buf 待解析的数据数组
 * @return {Number}      传感器返回的数值
 *
 * 回复数据从左到右第四位数据的值所代表的含义
 *     1: 单字符(1 byte)
 *     2： float(4 byte)
 *     3： short(2 byte)，16个长度
 *     4： 字符串
 *     5： double(4 byte)
 *     6: long(4 byte)
 */
MBlockly.Control.sensor_callback = function(buf) {
    var result = bytesToString(buf);
    console.log(result);
};


MBlockly.Control.bytesToString = function(bytes) {
    var endIndex = 5 + parseInt(bytes[4]);
    var str = bytes.toString('utf8', 5, endIndex);
    return str;
};