/**
 * The richness of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
Blockly.HSV_SATURATION = 0.60;

/**
 * The intensity of block colours, regardless of the hue.
 * Must be in the range of 0 (inclusive) to 1 (exclusive).
 */
Blockly.HSV_VALUE = 1;

/**
 * Required name space for HTML elements link.
 * @const
 */
Blockly.HTML_LINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * zoom-ctrl icons and images.
 * 3.125 == 375 /(Blockly.ZoomControls.prototype.ZOOM_RECT_WIDTH*3)
 */
Blockly.ZOOM_CTRL = {
  width: 375/3.125,
  height: 625/3.125,
  url: '../../images/zoom-ctrl.png'
};