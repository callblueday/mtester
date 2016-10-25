/**
 * Selects the node.
 */
goog.ui.tree.BaseNode.prototype.select = function() {
    MBlockly.App.currentTabIndex = this.id_;
    var tree = this.getTree();
    if (tree) {
        tree.setSelectedItem(this);
    }
};