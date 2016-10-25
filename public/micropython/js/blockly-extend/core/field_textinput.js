// Add method to customize widget content
Blockly.Field.prototype.showWidgetWithContent = function(htmlStr) {
    Blockly.WidgetDiv.DIV.innerHTML = htmlStr;
    Blockly.WidgetDiv.show(this, this.sourceBlock_.RTL, null, true);
};

Blockly.Field.prototype.hideWidget = function(htmlStr) {
    Blockly.WidgetDiv.hide();
};

