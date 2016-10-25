/**
 * Override: add
 * Handle a mouse-up anywhere in the SVG pane.  Is only registered when a
 * block is clicked.  We can't use mouseUp on the block since a fast-moving
 * cursor can briefly escape the block before it catches up.
 * @param {!Event} e Mouse up event.
 * @private
 */
Blockly.BlockSvg.prototype.onMouseUp_ = function(e) {
  if (Blockly.dragMode_ != Blockly.DRAG_FREE &&
      !Blockly.WidgetDiv.isVisible()) {
    Blockly.Events.fire(
        new Blockly.Events.Ui(this, 'click', undefined, undefined));
  }
  Blockly.terminateDrag_();
  if (Blockly.selected && Blockly.highlightedConnection_) {
    // Connect two blocks together.
    Blockly.localConnection_.connect(Blockly.highlightedConnection_);
    if (this.rendered) {
      // Trigger a connection animation.
      // Determine which connection is inferior (lower in the source stack).
      var inferiorConnection = Blockly.localConnection_.isSuperior() ?
          Blockly.highlightedConnection_ : Blockly.localConnection_;
      inferiorConnection.getSourceBlock().connectionUiEffect();
    }
    if (this.workspace.trashcan) {
      // Don't throw an object in the trash can if it just got connected.
      this.workspace.trashcan.close();
    }
  } else if (!this.getParent() && Blockly.selected.isDeletable() &&
      this.workspace.isDeleteArea(e)) {
    var trashcan = this.workspace.trashcan;
    if (trashcan) {
      goog.Timer.callOnce(trashcan.close, 100, trashcan);
    }

    // Modified by Hyman
    if(Blockly.onBlockMouseUp){ Blockly.onBlockMouseUp(); }

    Blockly.selected.dispose(false, true);
  }
  if (Blockly.highlightedConnection_) {
    Blockly.highlightedConnection_.unhighlight();
    Blockly.highlightedConnection_ = null;
  }
  Blockly.Css.setCursor(Blockly.Css.Cursor.OPEN);
  if (!Blockly.WidgetDiv.isVisible()) {
    Blockly.Events.setGroup(false);
  }

  // Modified by Hyman
  if(Blockly.onBlockMouseUp){ Blockly.onBlockMouseUp(); }
};

Blockly.BlockSvg.prototype.onMouseDown_ = function(e) {

  // Modified by Hyman
  if (this.workspace && this.workspace.options.readOnly) {
    return;
  }
  if (this.isInFlyout) {
    return;
  }
  if (this.isInMutator) {
    // Mutator's coordinate system could be out of date because the bubble was
    // dragged, the block was moved, the parent workspace zoomed, etc.
    this.workspace.resize();
  }

  this.workspace.updateScreenCalculationsIfScrolled();
  this.workspace.markFocused();
  Blockly.terminateDrag_();
  this.select();
  Blockly.hideChaff();
  if (Blockly.isRightButton(e)) {
    // Right-click.
    this.showContextMenu_(e);
  } else if (!this.isMovable()) {
    // Allow immovable blocks to be selected and context menued, but not
    // dragged.  Let this event bubble up to document, so the workspace may be
    // dragged instead.
    return;
  } else {
    if (!Blockly.Events.getGroup()) {
      Blockly.Events.setGroup(true);
    }
    // Left-click (or middle click)
    Blockly.Css.setCursor(Blockly.Css.Cursor.CLOSED);

    this.dragStartXY_ = this.getRelativeToSurfaceXY();
    this.workspace.startDrag(e, this.dragStartXY_);

    Blockly.dragMode_ = Blockly.DRAG_STICKY;
    Blockly.BlockSvg.onMouseUpWrapper_ = Blockly.bindEvent_(document,
        'mouseup', this, this.onMouseUp_);
    Blockly.BlockSvg.onMouseMoveWrapper_ = Blockly.bindEvent_(document,
        'mousemove', this, this.onMouseMove_);
    // Build a list of bubbles that need to be moved and where they started.
    this.draggedBubbles_ = [];
    var descendants = this.getDescendants();
    for (var i = 0, descendant; descendant = descendants[i]; i++) {
      var icons = descendant.getIcons();
      for (var j = 0; j < icons.length; j++) {
        var data = icons[j].getIconLocation();
        data.bubble = icons[j];
        this.draggedBubbles_.push(data);
      }
    }
  }
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
  e.preventDefault();
};


/**
 * Override: modify options.
 * Show the context menu for this block.
 * @param {!Event} e Mouse event.
 * @private
 */
Blockly.BlockSvg.prototype.showContextMenu_ = function(e) {
  if (this.workspace.options.readOnly || !this.contextMenu) {
    return;
  }
  // Save the current block in a variable for use in closures.
  var block = this;
  var menuOptions = [];

  if (this.isDeletable() && this.isMovable() && !block.isInFlyout) {

    // Option to duplicate this block.
    var duplicateOption = {
      text: Blockly.Msg.DUPLICATE_BLOCK,
      enabled: true,
      callback: function() {
        Blockly.duplicate_(block);
      }
    };
    if (this.getDescendants().length > this.workspace.remainingCapacity()) {
      duplicateOption.enabled = false;
    }
    menuOptions.push(duplicateOption);

    // Modified by hyman:
    // Option to duplicate this block and the below.
    var duplicateBelowOption = {
      text: Blockly.Msg.DUPLICATE_BELOW_BLOCK,
      enabled: true,
      callback: function() {
        Blockly.duplicateBelow_(block);
      }
    };
    if (this.getDescendants().length > this.workspace.remainingCapacity()) {
      duplicateOption.enabled = false;
    }
    menuOptions.push(duplicateBelowOption);

    // Modified by hyman:
    // Copy blocks onto the local clipboard.
    var copyBelowOption = {
      text: Blockly.Msg.COPY_BELOW_BLOCKS,
      enabled: true,
      callback: function() {
        Blockly.copyBelow_(block);
      }
    };
    if (this.getDescendants().length > this.workspace.remainingCapacity()) {
      copyBelowOption.enabled = false;
    }
    menuOptions.push(copyBelowOption);


    if (this.isEditable() && !this.collapsed_ &&
        this.workspace.options.comments) {
      // Option to add/remove a comment.
      var commentOption = {enabled: !goog.userAgent.IE};
      if (this.comment) {
        commentOption.text = Blockly.Msg.REMOVE_COMMENT;
        commentOption.callback = function() {
          block.setCommentText(null);
        };
      } else {
        commentOption.text = Blockly.Msg.ADD_COMMENT;
        commentOption.callback = function() {
          block.setCommentText('');
        };
      }
      // menuOptions.push(commentOption);
    }

    // Option to make block inline.
    if (!this.collapsed_) {
      for (var i = 1; i < this.inputList.length; i++) {
        if (this.inputList[i - 1].type != Blockly.NEXT_STATEMENT &&
            this.inputList[i].type != Blockly.NEXT_STATEMENT) {
          // Only display this option if there are two value or dummy inputs
          // next to each other.
          var inlineOption = {enabled: true};
          var isInline = this.getInputsInline();
          inlineOption.text = isInline ?
              Blockly.Msg.EXTERNAL_INPUTS : Blockly.Msg.INLINE_INPUTS;
          inlineOption.callback = function() {
            block.setInputsInline(!isInline);
          };
          // menuOptions.push(inlineOption);
          break;
        }
      }
    }

    if (this.workspace.options.collapse) {
      // Option to collapse/expand block.
      if (this.collapsed_) {
        var expandOption = {enabled: true};
        expandOption.text = Blockly.Msg.EXPAND_BLOCK;
        expandOption.callback = function() {
          block.setCollapsed(false);
        };
        menuOptions.push(expandOption);
      } else {
        var collapseOption = {enabled: true};
        collapseOption.text = Blockly.Msg.COLLAPSE_BLOCK;
        collapseOption.callback = function() {
          block.setCollapsed(true);
        };
        // menuOptions.push(collapseOption);
      }
    }

    if (this.workspace.options.disable) {
      // Option to disable/enable block.
      var disableOption = {
        text: this.disabled ?
            Blockly.Msg.ENABLE_BLOCK : Blockly.Msg.DISABLE_BLOCK,
        enabled: !this.getInheritedDisabled(),
        callback: function() {
          block.setDisabled(!block.disabled);
        }
      };
      // menuOptions.push(disableOption);
    }

    // Option to delete this block.
    // Count the number of blocks that are nested in this block.
    var descendantCount = this.getDescendants().length;
    var nextBlock = this.getNextBlock();
    if (nextBlock) {
      // Blocks in the current stack would survive this block's deletion.
      descendantCount -= nextBlock.getDescendants().length;
    }
    var deleteOption = {
      text: descendantCount == 1 ? Blockly.Msg.DELETE_BLOCK :
          Blockly.Msg.DELETE_X_BLOCKS.replace('%1', String(descendantCount)),
      enabled: true,
      callback: function() {
        Blockly.Events.setGroup(true);
        block.dispose(true, true);
        Blockly.Events.setGroup(false);
      }
    };
    menuOptions.push(deleteOption);
  }

  // Option to get help.
  var url = goog.isFunction(this.helpUrl) ? this.helpUrl() : this.helpUrl;
  var helpOption = {enabled: !!url};
  helpOption.text = Blockly.Msg.HELP;
  helpOption.callback = function() {
    block.showHelp_();
  };
  // menuOptions.push(helpOption);

  // Allow the block to add or modify menuOptions.
  if (this.customContextMenu && !block.isInFlyout) {
    this.customContextMenu(menuOptions);
  }

  Blockly.ContextMenu.show(e, menuOptions, this.RTL);
  Blockly.ContextMenu.currentBlock = this;
};


/**
 * Change the colour of a block.
 */
Blockly.BlockSvg.prototype.updateColour = function() {
  if (this.disabled) {
    // Disabled blocks don't have colour.
    return;
  }
  var hexColour = this.getColour();
  var rgb = goog.color.hexToRgb(hexColour);
  if (this.isShadow()) {
    rgb = goog.color.lighten(rgb, 0.2);
    hexColour = goog.color.rgbArrayToHex(rgb);
    this.svgPathLight_.style.display = 'none';
    this.svgPathDark_.setAttribute('fill', hexColour);
  } else {
    this.svgPathLight_.style.display = '';
    var hexLight = goog.color.rgbArrayToHex(goog.color.lighten(rgb, 0.3));
    var hexDark = goog.color.rgbArrayToHex(goog.color.darken(rgb, 0.2));
    this.svgPathLight_.setAttribute('stroke', hexLight);
    this.svgPathDark_.setAttribute('fill', hexDark);
  }
  this.svgPath_.setAttribute('fill', hexColour);

  var icons = this.getIcons();
  for (var i = 0; i < icons.length; i++) {
    icons[i].updateColour();
  }

  // Bump every dropdown to change its colour.
  for (var x = 0, input; input = this.inputList[x]; x++) {
    for (var y = 0, field; field = input.fieldRow[y]; y++) {
      field.setText(null);
    }
  }
};