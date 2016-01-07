/**
 * @description provide util functions.
 * @author Hujinhogn
 * @copyright 2015 Makeblock.cc
 */

'use strict';


var Base = {
    config: {
        'nodeSerialPortMode': false,
        'edit': true
    }
};

(function(that) {
    // 辅助函数：扩充对象
    that.extend =  function() {
        var args = arguments;
        if (args.length < 2) { return };
        var temp = args[0];
        for (var n = 1; n < args.length; n++) {
            for (var i in args[n]) {
                temp[i] = args[n][i];
            }
        }
        return temp;
    };

    that.date2str = function (x, y) {
        var z = {
            M: x.getMonth() + 1,
            d: x.getDate(),
            h: x.getHours(),
            m: x.getMinutes(),
            s: x.getSeconds()
        };
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
            return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2);
        });
        return y.replace(/(y+)/g, function(v) {
            return x.getFullYear().toString().slice(-v.length);
        });
    };

    // 辅助函数，输出信息
    that.mylog = function(msg) {
        var s = $('#log').html() + '<br>' + msg;
        $('#log').html(s);
    };

    // 自定义编码字符串
    that.xencode = function(str) {
        return str.replace(/\"/g, "@");
    };

    // 自定义解码字符串
    that.xdecode = function(str) {
        return str.replace(/@/g, "\"");
    };

    /**
     * 封装dialog
     * @param {object} options
     */
    that.Dialog = function(options) {
        /*
        <div class="dialog">
            <div class="head">
                <i class="fa fa-info-circle"></i>
                <span class="title">Save Project</span>
                <i class="fa fa-times dialog-close-btn"></i>
            </div>
            <div class="body">
                <input type="text" name="projectName" autofocus placeholder="Input a project name">
            </div>
            <div class="footer">
                <button class="cancel">No</button>
                <button class="ok">Ok</button>
                <button class="save-as-new">Save as new</button>
            </div>
        </div>
        */
        var that = this;
        var eventType = MBlockly.App.getEventType();
        var app = MBlockly.App;
        var $dialog = $('.dialog');
        options ? options : {};

        var defaultOptions = {
            type: '',
            cancelValue: 'No',
            okValue: 'Ok',
            saveAsNewValue: 'Save as new',

            beforeShow: null,
            onShow: function() {
                this.registerEvents();
                $('.dialog .body').show();
                $('.dialog .head .title').html(Blockly.Msg.Dialog_SAVE);

                if (!app.isWorkspaceEmpty() && this.type != 'edit') {
                    $('.save-as-new').hide();
                    if (app.currentProject && app.currentProject.id) {
                        $('.dialog .head .title').html(Blockly.Msg.Dialog_OVERWRITE);
                        $('.dialog input').val(app.currentProject.name);
                        $('.save-as-new').show();
                    } else {
                        $('.dialog input').val("");
                    }
                    $('.dialog').show();
                }
            },
            hide: function() {
                document.activeElement.blur();
                $("input").blur();
                setTimeout(function() {
                    window.scrollTo(0, 0);
                }, 50)

                $('.dialog').hide();
                this.removeEvents();
                app.dialog = null;
            },
            removeEvents: function() {
                $('.cancel').off();
                $('.ok').off();
                $('.save-as-new').off();
            },
            registerEvents: function() {
                $('.cancel').on(eventType, function() {
                    that.hide();
                    if (that.cancelCallback !== null) {
                        that.cancelCallback();
                    }
                });

                $('.ok').on(eventType, function(e) {
                    if (that.type == 'delete') {
                        // callback
                        if (that.okCallback !== null) {
                            that.okCallback(name);
                        }
                        that.hide();
                    } else {
                        var name = $dialog.find('[name=projectName]').val();
                        if (name && name.length) {

                            if (that.type != 'edit') {
                                if (app.currentProject && app.currentProject.id) {
                                    app.edit(name, app.currentProject.id); // update
                                } else {
                                    app.save(name); // add
                                }
                            }

                            // callback
                            if (that.okCallback !== null) {
                                that.okCallback(name);
                            }
                            that.hide();
                        }
                    }
                });

                $('.save-as-new').on(eventType, function() {
                    var name = $dialog.find('[name=projectName]').val();
                    if (name && name.length) {
                        that.hide();
                        app.save(name);

                        if (that.saveAsNewCallback !== null) {
                            that.saveAsNewCallback();
                        }
                    }
                });
            },
            cancelCallback: null,
            okCallback: null,
            saveAsNewCallback: null
        };

        var option = $.extend(defaultOptions, options);
        $.extend(Dialog.prototype, option);

        if (this.title) {
            $dialog.find('.head .title').html(this.title);
        }


        // close-btn
        $dialog.find('.dialog-close-btn').on(eventType, function() {
            that.hide();
        });

        // onshow
        if (that.onShow !== null && that.onShow !== undefined) {
            that.onShow();
        }

        // beforeshow
        if (that.beforeShow !== null && that.beforeShow !== undefined) {
            that.beforeShow();
        }


        // edit
        if (that.onEdit !== null && that.onEdit !== undefined) {
            that.onEdit();
        }
    };


    /**
     * 取String 或者 object的长度
     *
     * */
    that.getLength = function(o) {
        var t = typeof o;
        if(t == 'string'){
                return o.length;
        }else if(t == 'object'){
                var n = 0;
                for(var i in o){
                        n++;
                }
                return n;
        }
        return false;
    };

    /**
     * 判断设备类型
     */
    that.checkDeviceType = function() {

        var checkFunc = {
            android: function() {
                return navigator.userAgent.match(/Android/i) ? true : false;
            },
            blackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i) ? true : false;
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
            },
            winphone: function() {
                return navigator.userAgent.match(/IEMobile/i) ? true : false;
            },
            mobile: function() {
                return (checkFunc.android() || checkFunc.blackBerry() || checkFunc.iOS() || checkFunc.winphone());
            }
        };

        var device = {
            android: checkFunc.android(),
            blackBerry: checkFunc.blackBerry(),
            iOS: checkFunc.iOS(),
            winphone: checkFunc.winphone(),
            mobile: checkFunc.mobile(),
            pc: (!checkFunc.mobile())
        };

        return device;
    };

    /**
     * 检测是否包含某字符串
     */
    String.prototype.hasStr = function(str) {
        var text = this;
        if(text.indexOf(str) > -1) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * 检测某字符串出现的次数
        var s = "The rain in Spain falls rain mainly in the rain plain";
        var re = new RegExp("rain","g");
        var arr = s.match(re);
     */
    String.prototype.countStrFrequency = function(str) {
        var count;
        var text = this;
        var re = new RegExp(str, "g");
        var arr = text.match(re);
        if(arr) {
            count = arr.length;
        } else {
            count = 0;
        }
        return count;
    };

})(window);

module.exports = {
    extend: extend
}