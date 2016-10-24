MBlockly.BlockKeeper.makeBlock('control_delay', ["=SECOND"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.display);

    this.appendDummyInput()
        .appendField("delay");

    this.appendValueInput('SECOND')
        .setCheck('Number');
        // .setAlign(Blockly.ALIGN_RIGHT)

    this.appendDummyInput()
        .appendField("second")

    this.setInputsInline(true);
    this.setOutput(false);
    this.setNextStatement(true);
    this.setPreviousStatement(true);

}, function(args){
    var code = 'pyb.delay(' + args[0] + ')\r\n';
    return code;
});