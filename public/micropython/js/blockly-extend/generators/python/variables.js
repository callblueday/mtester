Blockly.Python['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Python.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  // modified by callblueday, the origin is :Blockly.Python.ORDER_ATOMIC
  return [code, Blockly.Python.ORDER_NONE];
};