MBlockly.BlockKeeper.makeBlock('set_led', ["POS", "ACTION"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.display);

    var position = new Blockly.FieldDropdown([
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
        ['4', '4']
    ]);

    var dropdown = new Blockly.FieldDropdown([
        ['on', 'ON'],
        ['off', 'OFF'],
        ['toggle', 'TOGGLE'],
        ['intensity', 'INTENSITY']
    ]);

    this.appendDummyInput()
        .appendField("set led #")
        .appendField(position, 'POS');

    this.appendDummyInput()
        .appendField(" ")
        .appendField(dropdown, 'ACTION');

    this.setInputsInline(true);
    this.setOutput(false);
    this.setNextStatement(true);
    this.setPreviousStatement(true);

}, function(args){
    var code = 'pyb.LED(' + eval(args[0]) + ').' + eval(args[1].toLowerCase()) + '()\r\n';
    return code;
});