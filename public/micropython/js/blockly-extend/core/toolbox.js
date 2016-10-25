/**
 * @fileOverride add side content to toolboxDiv.
 */


/**
 * Initializes the toolbox.
 */
Blockly.Toolbox.prototype.init = function() {
  var workspace = this.workspace_;
  var svg = this.workspace_.getParentSvg();

  // Create an HTML container for the Toolbox menu.
  this.HtmlDiv =
      goog.dom.createDom(goog.dom.TagName.DIV, 'blocklyToolboxDiv');
  this.HtmlDiv.setAttribute('dir', workspace.RTL ? 'RTL' : 'LTR');
  // svg.parentNode.insertBefore(this.HtmlDiv, svg);

  // Modified by hyman
  document.getElementById('toolboxDiv').appendChild(this.HtmlDiv);

  // Clicking on toolbox closes popups.
  Blockly.bindEvent_(this.HtmlDiv, 'mousedown', this,
      function(e) {
        if (Blockly.isRightButton(e) || e.target == this.HtmlDiv) {
          // Close flyout.
          Blockly.hideChaff(false);
        } else {
          // Just close popups.
          Blockly.hideChaff(true);
        }
      });
  var workspaceOptions = {
    disabledPatternId: workspace.options.disabledPatternId,
    parentWorkspace: workspace,
    RTL: workspace.RTL,
    horizontalLayout: workspace.horizontalLayout,
    toolboxPosition: workspace.options.toolboxPosition
  };
  /**
   * @type {!Blockly.Flyout}
   * @private
   */
  this.flyout_ = new Blockly.Flyout(workspaceOptions);
  goog.dom.insertSiblingAfter(this.flyout_.createDom(), workspace.svgGroup_);
  this.flyout_.init(workspace);

  this.config_['cleardotPath'] = workspace.options.pathToMedia + '1x1.gif';
  this.config_['cssCollapsedFolderIcon'] =
      'blocklyTreeIconClosed' + (workspace.RTL ? 'Rtl' : 'Ltr');
  var tree = new Blockly.Toolbox.TreeControl(this, this.config_);
  this.tree_ = tree;
  tree.setShowRootNode(false);
  tree.setShowLines(false);
  tree.setShowExpandIcons(false);
  tree.setSelectedItem(null);
  var openNode = this.populate_(workspace.options.languageTree);
  tree.render(this.HtmlDiv);
  if (openNode) {
    tree.setSelectedItem(openNode);
  }
  this.addColour_();
  this.position();
};


/**
 * Display/hide the flyout when an item is selected.
 * @param {goog.ui.tree.BaseNode} node The item to select.
 * @override
 */
Blockly.Toolbox.TreeControl.prototype.setSelectedItem = function(node) {
  var toolbox = this.toolbox_;
  if (node == this.selectedItem_ || node == toolbox.tree_) {
    return;
  }

  //modified by jeremy.yang:
  //there's a conflict between inline-style with class-style
  //if (toolbox.lastCategory_) {
  //  toolbox.lastCategory_.getRowElement().style.backgroundColor = '';
  //}
  if (node) {
    //var hexColour = node.hexColour || '#57e';
    //node.getRowElement().style.backgroundColor = hexColour;
    toolbox.addColour_(node);
  }
  var oldNode = this.getSelectedItem();
  goog.ui.tree.TreeControl.prototype.setSelectedItem.call(this, node);
  if (node && node.blocks && node.blocks.length) {
    toolbox.flyout_.show(node.blocks);
    // Scroll the flyout to the top if the category has changed.
    if (toolbox.lastCategory_ != node) {
      toolbox.flyout_.scrollToStart();
    }
  } else {
    // Hide the flyout.
    toolbox.flyout_.hide();
  }
  if (oldNode != node && oldNode != this) {
    var event = new Blockly.Events.Ui(null, 'category',
        oldNode && oldNode.getHtml(), node && node.getHtml());
    event.workspaceId = toolbox.workspace_.id;
    Blockly.Events.fire(event);
  }
  if (node) {
    toolbox.lastCategory_ = node;
  }
};