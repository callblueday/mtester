MBlockly.BlockKeeper.makeBlock('move_set_servo_motor', ["=DEGREE"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.move);

    var position = new Blockly.FieldDropdown([
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['4', '4']
    ]);

    this.appendDummyInput()
        .appendField("set servo angle")
    this.appendValueInput('DEGREE')
        .setCheck('Number');

    this.setInputsInline(true);
    this.setNextStatement(true);
    this.setPreviousStatement(true);

}, function(degree){
    var code = "";
    code += 'pyb.Servo(1).angle(' + degree + ')\r\n';
    return code;
});