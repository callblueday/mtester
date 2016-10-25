/**
 * Show and populate the flyout.
 * @param {!Array|string} xmlList List of blocks to show.
 *     Variables and procedures have a custom set of blocks.
 */
Blockly.Flyout.prototype.show = function(xmlList) {
  this.hide();
  this.clearOldBlocks_();

  if (xmlList == Blockly.Variables.NAME_TYPE) {
    // Special category for variables.
    xmlList =
        Blockly.Variables.flyoutCategory(this.workspace_.targetWorkspace);
  } else if (xmlList == Blockly.Procedures.NAME_TYPE) {
    // Special category for procedures.
    xmlList =
        Blockly.Procedures.flyoutCategory(this.workspace_.targetWorkspace);
  }

  this.svgGroup_.style.display = 'block';
  // Create the blocks to be shown in this flyout.
  var contents = [];
  var gaps = [];
  this.permanentlyDisabled_.length = 0;

  // Modified by Hyman: a funtion to add block
  var addBlock = function(xml, workspace) {
    var curBlock = Blockly.Xml.domToBlock(xml, workspace);
    curBlock.xmlData = xml;
    if (curBlock.disabled) {
      // Record blocks that were initially disabled.
      // Do not enable these blocks as a result of capacity filtering.
      this.permanentlyDisabled_.push(curBlock);
    }
    contents.push({type: 'block', block: curBlock});
    var gap = parseInt(xml.getAttribute('gap'), 10);
    gaps.push(isNaN(gap) ? default_gap : gap);
  };

  for (var i = 0, xml; xml = xmlList[i]; i++) {
    if (xml.tagName) {
      var tagName = xml.tagName.toUpperCase();
      var default_gap = this.horizontalLayout_ ? this.GAP_X : this.GAP_Y;
      if (tagName == 'BLOCK') {

        /* Modified by Hyman: filter block for current device  */
        var openFilter = MBlockly.Settings.FILTER_BLOCKS_FOR_BOARDS;
        var filterBeginBlocks = MBlockly.App.currentTabIndex == ':1' && MBlockly.Settings.FILTER_BEGIN_BLOCKS;
        if (openFilter) {
            if (filterBeginBlocks) {
                if (xml.getAttribute('data-widgetType') == MBlockly.App.currentWidget.type) {
                    addBlock(xml, this.workspace_);
                }
            } else {
                // 根据不同的主板类型，显示该类型主板所拥有的block块。对于声明了 data-not-devicetype 的块，过滤该块
                var deviceName = xml.getAttribute('data-devicetype');
                var notDeviceName = xml.getAttribute('data-not-devicetype') || " ";
                var shouldShow = (!deviceName || deviceName.hasStr(MBlockly.Control.deviceInfo.type) || deviceName.hasStr('all')) && !notDeviceName.hasStr(MBlockly.Control.deviceInfo.type);
                if(shouldShow) {
                    addBlock(xml, this.workspace_);
                }
            }
        } else {
            addBlock(xml, this.workspace_);
        }

      } else if (xml.tagName.toUpperCase() == 'SEP') {
        // Change the gap between two blocks.
        // <sep gap="36"></sep>
        // The default gap is 24, can be set larger or smaller.
        // This overwrites the gap attribute on the previous block.
        // Note that a deprecated method is to add a gap to a block.
        // <block type="math_arithmetic" gap="8"></block>
        var newGap = parseInt(xml.getAttribute('gap'), 10);
        // Ignore gaps before the first block.
        if (!isNaN(newGap) && gaps.length > 0) {
          gaps[gaps.length - 1] = newGap;
        } else {
          gaps.push(default_gap);
        }
      } else if (tagName == 'BUTTON') {
        var label = xml.getAttribute('text');
        var curButton = new Blockly.FlyoutButton(this.workspace_,
            this.targetWorkspace_, label);
        contents.push({type: 'button', button: curButton});
        gaps.push(default_gap);
      }
    }
  }

  this.layout_(contents, gaps);
  // IE 11 is an incompetent browser that fails to fire mouseout events.
  // When the mouse is over the background, deselect all blocks.
  var deselectAll = function() {
    var topBlocks = this.workspace_.getTopBlocks(false);
    for (var i = 0, block; block = topBlocks[i]; i++) {
      block.removeSelect();
    }
  };

  this.listeners_.push(Blockly.bindEvent_(this.svgBackground_, 'mouseover',
      this, deselectAll));

  if (this.horizontalLayout_) {
    this.height_ = 0;
  } else {
    this.width_ = 0;
  }
  this.reflow();

  this.filterForCapacity_();

  // Correctly position the flyout's scrollbar when it opens.
  this.position();

  this.reflowWrapper_ = this.reflow.bind(this);
  this.workspace_.addChangeListener(this.reflowWrapper_);
};

