/**
 * @fileOverview  Add some extend UI and function to the dom.
 * @author hujinhong@makeblock.cc(Hyman)
 */


/**
 * Add name area.
 */
Blockly.WorkspaceSvg.prototype.createDom = function(opt_backgroundClass) {
  /**
   * <g class="blocklyWorkspace">
   *   <rect class="blocklyMainBackground" height="100%" width="100%"></rect>
   *   [Trashcan and/or flyout may go here]
   *   <g class="blocklyBlockCanvas"></g>
   *   <g class="blocklyBubbleCanvas"></g>
   *   [Scrollbars may go here]
   * </g>
   * @type {SVGElement}
   */
  this.svgGroup_ = Blockly.createSvgElement('g',
      {'class': 'blocklyWorkspace'}, null);
  if (opt_backgroundClass) {
    /** @type {SVGElement} */
    this.svgBackground_ = Blockly.createSvgElement('rect',
        {'height': '100%', 'width': '100%', 'class': opt_backgroundClass},
        this.svgGroup_);
    if (opt_backgroundClass == 'blocklyMainBackground') {
      this.svgBackground_.style.fill =
          'url(#' + this.options.gridPattern.id + ')';
    }

    // Modified by Hyman: add name area.
    this.svgWidgetName_ = Blockly.createSvgElement('g', {}, this.svgGroup_);
    this.nameWrapper = Blockly.createSvgElement('rect', {
      'class': 'name-wrapper',
      'width': MBlockly.Settings.NAME_WRAPPER_MIN_WIDTH,
      'height': '40',
      'x': '50%',
      'transform': 'translate(-100 20)',
      'rx': '5'
    }, this.svgWidgetName_);
    this.nameText = Blockly.createSvgElement('text', {
      'class': 'name-value',
      'x': '50%',
      'y': '25'
    }, this.svgWidgetName_);
  }

  /** @type {SVGElement} */
  this.svgBlockCanvas_ = Blockly.createSvgElement('g',
      {'class': 'blocklyBlockCanvas'}, this.svgGroup_, this);
  /** @type {SVGElement} */
  this.svgBubbleCanvas_ = Blockly.createSvgElement('g',
      {'class': 'blocklyBubbleCanvas'}, this.svgGroup_, this);
  var bottom = Blockly.Scrollbar.scrollbarThickness;
  if (this.options.hasTrashcan) {
    bottom = this.addTrashcan_(bottom);
  }
  if (this.options.zoomOptions && this.options.zoomOptions.controls) {
    bottom = this.addZoomControls_(bottom);
  }
  Blockly.bindEvent_(this.svgGroup_, 'mousedown', this, this.onMouseDown_);
  var thisWorkspace = this;
  Blockly.bindEvent_(this.svgGroup_, 'touchstart', null,
                     function(e) {Blockly.longStart_(e, thisWorkspace);});
  if (this.options.zoomOptions && this.options.zoomOptions.wheel) {
    // Mouse-wheel.
    Blockly.bindEvent_(this.svgGroup_, 'wheel', this, this.onMouseWheel_);
  }

  // Determine if there needs to be a category tree, or a simple list of
  // blocks.  This cannot be changed later, since the UI is very different.
  if (this.options.hasCategories) {
    this.toolbox_ = new Blockly.Toolbox(this);
  } else if (this.options.languageTree) {
    this.addFlyout_();
  }
  this.updateGridPattern_();
  return this.svgGroup_;
};

/**
 * Override: add paste option in contextMenu if Blockly.clipboardXml_ is not empty.
 * Show the context menu for the workspace.
 * @param {!Event} e Mouse event.
 * @private
 */
Blockly.WorkspaceSvg.prototype.showContextMenu_ = function(e) {
  if (this.options.readOnly || this.isFlyout) {
    return;
  }
  var menuOptions = [];
  var topBlocks = this.getTopBlocks(true);
  var eventGroup = Blockly.genUid();

  // Modified by Hyman: Option to paste the workspace's clipboardXml.
  if (Blockly.clipboardXml_) {
    var pasteOption = {};
    pasteOption.text = Blockly.Msg.PASTE_BLOCKS;
    pasteOption.enabled = true;
    pasteOption.callback = this.paste.bind(this, Blockly.clipboardXml_);
    menuOptions.push(pasteOption);
  }

  // Options to undo/redo previous action.
  var undoOption = {};
  undoOption.text = Blockly.Msg.UNDO;
  undoOption.enabled = this.undoStack_.length > 0;
  undoOption.callback = this.undo.bind(this, false);
  menuOptions.push(undoOption);
  var redoOption = {};
  redoOption.text = Blockly.Msg.REDO;
  redoOption.enabled = this.redoStack_.length > 0;
  redoOption.callback = this.undo.bind(this, true);
  menuOptions.push(redoOption);

  // Option to clean up blocks.
  if (this.scrollbar) {
    var cleanOption = {};
    cleanOption.text = Blockly.Msg.CLEAN_UP;
    cleanOption.enabled = topBlocks.length > 1;
    cleanOption.callback = this.cleanUp_.bind(this);
    menuOptions.push(cleanOption);
  }

  // Add a little animation to collapsing and expanding.
  var DELAY = 10;
  if (this.options.collapse) {
    var hasCollapsedBlocks = false;
    var hasExpandedBlocks = false;
    for (var i = 0; i < topBlocks.length; i++) {
      var block = topBlocks[i];
      while (block) {
        if (block.isCollapsed()) {
          hasCollapsedBlocks = true;
        } else {
          hasExpandedBlocks = true;
        }
        block = block.getNextBlock();
      }
    }

    /**
     * Option to collapse or expand top blocks.
     * @param {boolean} shouldCollapse Whether a block should collapse.
     * @private
     */
    var toggleOption = function(shouldCollapse) {
      var ms = 0;
      for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        while (block) {
          setTimeout(block.setCollapsed.bind(block, shouldCollapse), ms);
          block = block.getNextBlock();
          ms += DELAY;
        }
      }
    };

    // Option to collapse top blocks.
    var collapseOption = {enabled: hasExpandedBlocks};
    collapseOption.text = Blockly.Msg.COLLAPSE_ALL;
    collapseOption.callback = function() {
      toggleOption(true);
    };
    menuOptions.push(collapseOption);

    // Option to expand top blocks.
    var expandOption = {enabled: hasCollapsedBlocks};
    expandOption.text = Blockly.Msg.EXPAND_ALL;
    expandOption.callback = function() {
      toggleOption(false);
    };
    menuOptions.push(expandOption);
  }

  // Option to delete all blocks.
  // Count the number of blocks that are deletable.
  var deleteList = [];
  function addDeletableBlocks(block) {
    if (block.isDeletable()) {
      deleteList = deleteList.concat(block.getDescendants());
    } else {
      var children = block.getChildren();
      for (var i = 0; i < children.length; i++) {
        addDeletableBlocks(children[i]);
      }
    }
  }
  for (var i = 0; i < topBlocks.length; i++) {
    addDeletableBlocks(topBlocks[i]);
  }

  function deleteNext() {
    Blockly.Events.setGroup(eventGroup);
    var block = deleteList.shift();
    if (block) {
      if (block.workspace) {
        block.dispose(false, true);
        setTimeout(deleteNext, DELAY);
      } else {
        deleteNext();
      }
    }
    Blockly.Events.setGroup(false);
  }

  var deleteOption = {
    text: deleteList.length == 1 ? Blockly.Msg.DELETE_BLOCK :
        Blockly.Msg.DELETE_X_BLOCKS.replace('%1', String(deleteList.length)),
    enabled: deleteList.length > 0,
    callback: function() {
      if (deleteList.length < 2 ||
          window.confirm(Blockly.Msg.DELETE_ALL_BLOCKS.replace('%1',
          String(deleteList.length)))) {
        deleteNext();
      }
    }
  };
  menuOptions.push(deleteOption);

  Blockly.ContextMenu.show(e, menuOptions, this.RTL);
};

/**
 * Override: improve delete area ui.
 * Is the mouse event over a delete area (toolbar or non-closing flyout)?
 * Opens or closes the trashcan and sets the cursor as a side effect.
 * @param {!Event} e Mouse move event.
 * @return {boolean} True if event is in a delete area.
 */
Blockly.WorkspaceSvg.prototype.isDeleteArea = function(e) {
  var isDelete = false;
  var xy = new goog.math.Coordinate(e.clientX, e.clientY);
  if (this.deleteAreaTrash_) {
    if (this.deleteAreaTrash_.contains(xy)) {
      this.trashcan.setOpen_(true);
      Blockly.Css.setCursor(Blockly.Css.Cursor.DELETE);
      return true;
    }
    this.trashcan.setOpen_(false);
  }
  if (this.deleteAreaToolbox_) {
    if (this.deleteAreaToolbox_.contains(xy)) {
      Blockly.Css.setCursor(Blockly.Css.Cursor.DELETE);
      // modified: when mouse is over toolbox
      if(Blockly.onMouseOverToolboxDeletionZoneHandler){
        Blockly.onMouseOverToolboxDeletionZoneHandler();
      }
      return true;
    }
  }

  // modified: when mouse leave out toolbox
  if(Blockly.onMouseOutToolboxDeletionZoneHandler){
    Blockly.onMouseOutToolboxDeletionZoneHandler();
  }
  Blockly.Css.setCursor(Blockly.Css.Cursor.CLOSED);
  return false;
};