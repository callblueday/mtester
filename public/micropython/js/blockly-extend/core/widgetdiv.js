/**
 * Override: change the top position when reach edge.
 * Position the widget at a given location.  Prevent the widget from going
 * offscreen top or left (right in RTL).
 * @param {number} anchorX Horizontal location (window coorditates, not body).
 * @param {number} anchorY Vertical location (window coorditates, not body).
 * @param {!goog.math.Size} windowSize Height/width of window.
 * @param {!goog.math.Coordinate} scrollOffset X/y of window scrollbars.
 * @param {boolean} rtl True if RTL, false if LTR.
 */
Blockly.WidgetDiv.position = function(anchorX, anchorY, windowSize,
                                      scrollOffset, rtl) {
  // Don't let the widget go above the top edge of the window.
  // Modified by Hyman
  if (anchorY < scrollOffset.y) {
    anchorY = scrollOffset.y;
    if(checkDeviceType().ipad || checkDeviceType().androidPad) {
      anchorY = scrollOffset.y + MBlockly.Settings.MARGIN_TOP_IPAD;
    } else if(checkDeviceType().phone) {
      anchorY = scrollOffset.y + MBlockly.Settings.MARGIN_TOP_PHONE;
    }
  }
  if (rtl) {
    // Don't let the widget go right of the right edge of the window.
    if (anchorX > windowSize.width + scrollOffset.x) {
      anchorX = windowSize.width + scrollOffset.x;
    }
  } else {
    // Don't let the widget go left of the left edge of the window.
    if (anchorX < scrollOffset.x) {
      anchorX = scrollOffset.x;
    }
  }
  Blockly.WidgetDiv.DIV.style.left = anchorX + 'px';
  Blockly.WidgetDiv.DIV.style.top = anchorY + 'px';
  Blockly.WidgetDiv.DIV.style.height =
      (windowSize.height - anchorY + scrollOffset.y) + 'px';
};


/**
 * new add: if we want to add classes for the WidgetDiv.DIV, then call this method.
 * Position the widget by a given class. at the same time show a mask for WidgetDiv.
 * @param {String} className    (optional) a class you want give to the dom.
 */
Blockly.WidgetDiv.addClassAndMask = function(className){
  var oldClass = Blockly.WidgetDiv.DIV.className;
  Blockly.WidgetDiv.showMask();
  if(className && oldClass.indexOf(className) == -1){
    Blockly.WidgetDiv.DIV.className += ' ' + className;
  }
  var dispose = Blockly.WidgetDiv.dispose_;
  Blockly.WidgetDiv.dispose_ = function(){//rewrite this callback function
    dispose && dispose();
    Blockly.WidgetDiv.DIV.className = oldClass;
    Blockly.WidgetDiv.hideMask();
  }
}

/**
 * Show a mask for WidgetDiv if called.
 * We define the mask here because a popup will always be followed by a mask.
 */
Blockly.WidgetDiv.showMask = function(){
  if (Blockly.WidgetDiv.MASK) {
    Blockly.WidgetDiv.MASK.style.display = 'block';
  }else{
    Blockly.WidgetDiv.MASK = goog.dom.createDom('div', 'widgetMask');
    document.body.appendChild(Blockly.WidgetDiv.MASK);
  }
  // bind events to hide this mask
  Blockly.WidgetDiv.MASK.bindData = Blockly.bindEvent_(Blockly.WidgetDiv.MASK, 'mousedown', this, Blockly.WidgetDiv.hide);
}

Blockly.WidgetDiv.hideMask = function(){
  Blockly.WidgetDiv.MASK.style.display = 'none';
  // unbind events
  Blockly.unbindEvent_(Blockly.WidgetDiv.MASK.bindData);
}


/**
 * Initialize and display the widget div.  Close the old one if needed.
 * @param {!Object} newOwner The object that will be using this container.
 * @param {boolean} rtl Right-to-left (true) or left-to-right (false).
 * @param {Function} dispose Optional cleanup function to be run when the widget
 *   is closed.
 * @param {boolean} isCustomized whether this widget is customized.
 */
Blockly.WidgetDiv.show = function(newOwner, rtl, dispose, isCustomized) {
  Blockly.WidgetDiv.hide();
  Blockly.WidgetDiv.owner_ = newOwner;
  Blockly.WidgetDiv.dispose_ = dispose;
  // Temporarily move the widget to the top of the screen so that it does not
  // cause a scrollbar jump in Firefox when displayed.
  var xy = goog.style.getViewportPageOffset(document);
  var el = Blockly.WidgetDiv.DIV;
  el.style.top = xy.y + 'px';
  el.style.direction = rtl ? 'rtl' : 'ltr';
  el.style.display = 'block';

  if(isCustomized) {
    Blockly.WidgetDiv.addClassAndMask('widget-center');
  } else {
    var className = Blockly.WidgetDiv.DIV.className;
    Blockly.WidgetDiv.DIV.className = className.replace("widget-center", "");
  }
  // if (Blockly.onWidgetDivShow) { Blockly.onWidgetDivShow(this); }
};

/**
 * Destroy the widget and hide the div.
 */
Blockly.WidgetDiv.hide = function() {
  if (Blockly.WidgetDiv.owner_) {
    Blockly.WidgetDiv.owner_ = null;
    Blockly.WidgetDiv.DIV.style.display = 'none';
    Blockly.WidgetDiv.DIV.style.left = '';
    Blockly.WidgetDiv.DIV.style.top = '';
    Blockly.WidgetDiv.DIV.style.height = '';
    Blockly.WidgetDiv.dispose_ && Blockly.WidgetDiv.dispose_();
    Blockly.WidgetDiv.dispose_ = null;
    goog.dom.removeChildren(Blockly.WidgetDiv.DIV);
    if (Blockly.onWidgetDivHide) { Blockly.onWidgetDivHide(this); }
  }
};