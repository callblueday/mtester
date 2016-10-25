Blockly.JavaScript['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  // modified by callblueday, the origin is :Blockly.JavaScript.ORDER_ATOMIC
  return [code, Blockly.JavaScript.ORDER_NONE];
};