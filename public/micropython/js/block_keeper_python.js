goog.provide('MBlockly.BlockKeeper');

goog.require('Blockly.Blocks');

/**
 * BlockKeeper provides an unified interface for adding blocks to Blockly system.
 * Example:
 * MBlockly.BlockKeeper.makeBlock('set_led_color', ['LED_POSITION', '*COLOUR1'], function(){
 *     // block ui builder
 *     this.appendDummyInput()
                .appendField(Blockly.Msg.DISPLAY_LED_SET_LED_ON_BOARD)
                .appendField(ledPositionList, 'LED_POSITION')
                .appendField(Blockly.Msg.DISPLAY_LED_TO_COLOR);
                ......
 *
 * }, function(led_position, colour1){
 *     // code to run when block is activated
 *
 * })
 *
 * @type {[type]}
 */
MBlockly.BlockKeeper = {
    HUE: {
        start: 200,
        move: 218,
        display: 250,
        event: 40,
        detect: 18,
        math: 289,
        control: 330,
        webapi: 355
    },
    blockList : {},
    getBlocks : function(){
        return this.blockList;
    },

    /**
     * Register a block into MBlockly system; add a function to javascript parser;
     * when block is executed, call that added function.
     *
     * @param  {string} blockName - name of the block in xml description
     * @param  {[string]} argList   - list of argument this block takes
     * @param  {function} uiBuilder - a function for building the block
     * @param  {function} handler   - show what is done when the block is run
     * @param  {enum} opOrder   - the operation order of this block
     * @return {void}
     *
     * opOrder types - if you omit this argument, it will generate a normal block;
     * otherwise a valued block. Possible values:
     * Blockly.Python.ORDER_ATOMIC
     * Blockly.Python.ORDER_ADDITION
     * Blockly.Python.ORDER_SUBTRACTION
     * Blockly.Python.ORDER_MULTIPLICATION
     * Blockly.Python.ORDER_DIVISION
     * Blockly.Python.ORDER_COMMA
     * Blockly.Python.ORDER_FUNCTION_CALL
     * Blockly.Python.ORDER_UNARY_NEGATION
     * Blockly.Python.ORDER_NONE
     */
    makeBlock : function(blockName, argList, uiBuilder, handler, opOrder){

        Blockly.Blocks[blockName] = {
            init: uiBuilder
        };

        Blockly.Python[blockName] = function(block){
            var argValues = [];
            for(var i=0;i<argList.length;i++){
                if(argList[i].charAt(0) == '*'){
                    // for string
                    var codeForm = Blockly.Python.valueToCode(block, argList[i].substring(1), Blockly.Python.ORDER_COMMA);
                    argValues.push(codeForm.substring(1, codeForm.length-1));
                } else if(argList[i].charAt(0) == '='){
                    // for number
                    var codeForm = Blockly.Python.valueToCode(block, argList[i].substring(1), Blockly.Python.ORDER_COMMA);
                    if(parseInt(codeForm)){
                        codeForm = parseInt(codeForm);
                    }
                    argValues.push(codeForm);
                } else if(argList[i].charAt(0) == '@') {
                    // TO FIXED: for statement code
                    // var codeForm = Blockly.Python.statementToCode(block, argList[i].substring(1), Blockly.Python.ORDER_COMMA);
                    // argValues.push(codeForm);
                }
                else {
                    argValues.push(block.getFieldValue(argList[i]));
                }
            }

            for(var i in argValues) {
                if(typeof(argValues[i]) == 'string' && argValues[i].indexOf('(') == -1 ) {
                    // 不包含语句的参数全部用引号包裹
                    argValues[i] = ('"' + argValues[i] + '"');
                }
            }
            // var argStr = argValues.join(',');

            // if(argStr == '""'){
            //     argStr = '';
            // }

            // var code = 'blockly_js_func_'+blockName+'('+argStr+')';
            // if(opOrder){    // this is a value block, output a value tuple;
            //     code = [code, opOrder];
            // }
            // else{   // this is a normal block, output a line of code
            //     code += ';\n';
            // }
            // // 返回的是该UI块对应的js函数字符串
            // return code;
            return handler(argValues);
        }

        // this.blockList[blockName] = {
        //     'argList': argList,
        //     'handler': handler,
        //     'funcName': 'blockly_js_func_'+blockName
        // };
    }
}