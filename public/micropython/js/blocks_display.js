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

MBlockly.BlockKeeper.makeBlock('set_led_with_index', ["=POS", "ACTION"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.display);

    var dropdown = new Blockly.FieldDropdown([
        ['on', 'ON'],
        ['off', 'OFF'],
        ['toggle', 'TOGGLE'],
        ['intensity', 'INTENSITY']
    ]);

    this.appendDummyInput()
        .appendField("set led #");

    this.appendValueInput('POS');

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

MBlockly.BlockKeeper.makeBlock('input_text', ["*TEXT"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.display);

    this.appendDummyInput()
        .appendField("input ");

    this.appendValueInput('TEXT');

    this.setInputsInline(true);
    this.setOutput(false);
    this.setNextStatement(true);
    this.setPreviousStatement(true);

}, function(args){
    var code = eval(args[0]) + '\r\n';
    return code;
});


MBlockly.BlockKeeper.makeBlock('gpio', ["=INDEX", "STATE"], function(){
    this.setColour(MBlockly.BlockKeeper.HUE.display);

    this.appendDummyInput()
        .appendField("set gpio ");

    var dropdown = new Blockly.FieldDropdown([
        ['0', 'IN'],
        ['1', 'OUT_OD']
    ]);

    this.appendValueInput('INDEX');

    this.appendDummyInput()
        .appendField("state ")
        .appendField(dropdown, "STATE");

    this.setInputsInline(true);
    this.setOutput(false);
    this.setNextStatement(true);
    this.setPreviousStatement(true);

}, function(args){
    var code = 'pyb.Pin(pyb.Pin.board.X' + args[0] + ', pyb.Pin.' + eval(args[1]) + ')\r\n';
    return code;
});