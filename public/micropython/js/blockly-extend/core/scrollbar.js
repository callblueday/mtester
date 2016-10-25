/**
 * Width of vertical scrollbar or height of horizontal scrollbar.
 * Increase the size of scrollbars on touch devices.
 * Don't define if there is no document object (e.g. node.js).
 */
Blockly.Scrollbar.scrollbarThickness = 15;
if (goog.events.BrowserFeature.TOUCH_ENABLED && checkDeviceType().phone) {
  Blockly.Scrollbar.scrollbarThickness = 10;
}
