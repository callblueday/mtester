/**
 * the width of the zoom rect
 */
Blockly.ZoomControls.prototype.ZOOM_RECT_WIDTH = 40;
/**
 * the height of the zoom-control's background
 */
Blockly.ZoomControls.prototype.ZOOM_BG_HEIGHT = 54;
/**
 * the width of the zoom-control's background
 */
Blockly.ZoomControls.prototype.ZOOM_BG_WIDTH = 248;
/**
 * Create the zoom controls.
 * @return {!Element} The zoom controls SVG group.
 */
Blockly.ZoomControls.prototype.createDom = function() {
  var workspace = this.workspace_;
  /* Here's the markup that will be generated:
  <g class="blocklyZoom">
    //modified by jeremy
    // add undo and redo button as bellow
    <clippath id="blocklyZoomUndoClipPath837493">
      <rect width="32" height="32" y="77"></rect>
    </clippath>
    <image width="96" height="124" x="-64" y="-15" xlink:href="media/sprites.png"
        clip-path="url(#blocklyZoomoutClipPath837493)"></image>
    <clippath id="blocklyZoomReduClipPath837493">
      <rect width="32" height="32" y="77"></rect>
    </clippath>
    <image width="96" height="124" x="-64" y="-15" xlink:href="media/sprites.png"
        clip-path="url(#blocklyZoomoutClipPath837493)"></image>

    <clippath id="blocklyZoomoutClipPath837493">
      <rect width="32" height="32" y="77"></rect>
    </clippath>
    <image width="96" height="124" x="-64" y="-15" xlink:href="media/sprites.png"
        clip-path="url(#blocklyZoomoutClipPath837493)"></image>
    <clippath id="blocklyZoominClipPath837493">
      <rect width="32" height="32" y="43"></rect>
    </clippath>
    <image width="96" height="124" x="-32" y="-49" xlink:href="media/sprites.png"
        clip-path="url(#blocklyZoominClipPath837493)"></image>
    <clippath id="blocklyZoomresetClipPath837493">
      <rect width="32" height="32"></rect>
    </clippath>
    <image width="96" height="124" y="-92" xlink:href="media/sprites.png"
        clip-path="url(#blocklyZoomresetClipPath837493)"></image>
  </g>
  */
  //g
  this.svgGroup_ = Blockly.createSvgElement('g',
      {'class': 'blocklyZoom', 'id': 'blocklyZoom'}, null);
  //radius-rect
  Blockly.createSvgElement('rect',
      {'class': 'blocklyZoomBg',
       'width': this.ZOOM_BG_WIDTH,
       'height': this.ZOOM_BG_HEIGHT,
       'x': 0,
       'y': 65,
       'rx': 27,
       'ry': 27,
       'style': 'fill:#fff;stroke:#dedede;stroke-width:1;'
      },
      this.svgGroup_);

  var rnd = String(Math.random()).substring(2);;
  //custom to
  if (MBlockly.Settings.OPEN_UNDO) {
    //Undo
    var clip = Blockly.createSvgElement('clipPath',
        {'id': 'blocklyZoomUndoClipPath' + rnd},
        this.svgGroup_);
    Blockly.createSvgElement('rect',
        {'width': this.ZOOM_RECT_WIDTH, 'height': this.ZOOM_RECT_WIDTH, 'x': 8, 'y': 72},
        clip
    );
    var zoomUndoSvg = Blockly.createSvgElement('image',
        {'id': 'undoSvg', 'class': 'zoomundo',
         'width': Blockly.ZOOM_CTRL.width,
         'height': Blockly.ZOOM_CTRL.height,
         'x': 8,
         'y': 72,
         'clip-path': 'url(#blocklyZoomUndoClipPath' + rnd + ')'},
        this.svgGroup_
    );
    zoomUndoSvg.setAttributeNS(Blockly.HTML_LINK_NS, 'xlink:href', Blockly.ZOOM_CTRL.url);

    //Redo
    var clip = Blockly.createSvgElement('clipPath',
        {'id': 'blocklyZoomRedoClipPath' + rnd},
        this.svgGroup_);
    Blockly.createSvgElement('rect',
        {'width': this.ZOOM_RECT_WIDTH, 'height': this.ZOOM_RECT_WIDTH, 'x': 56, 'y': 72},
        clip);
    var zoomRedoSvg = Blockly.createSvgElement('image',
        {'id': 'redoSvg', 'class': 'zoomredo',
         'width': Blockly.ZOOM_CTRL.width,
         'height': Blockly.ZOOM_CTRL.height,
         'x': 56,
         'y': 32,
         'clip-path': 'url(#blocklyZoomRedoClipPath' + rnd + ')'},
        this.svgGroup_
    );
    zoomRedoSvg.setAttributeNS(Blockly.HTML_LINK_NS, 'xlink:href', Blockly.ZOOM_CTRL.url);
  }
  //position on the center
  //Reset
  var clip = Blockly.createSvgElement('clipPath',
      {'id': 'blocklyZoomresetClipPath' + rnd},
      this.svgGroup_);
  Blockly.createSvgElement('rect',
      {'width': this.ZOOM_RECT_WIDTH, 'height': this.ZOOM_RECT_WIDTH, 'x': 104, 'y': 72},
      clip
  );
  var zoomresetSvg = Blockly.createSvgElement('image',
      {'class': 'zoomreset',
       'width': Blockly.ZOOM_CTRL.width,
       'height': Blockly.ZOOM_CTRL.height,
       'x': 64,
       'y': -8,
       'clip-path': 'url(#blocklyZoomresetClipPath' + rnd + ')'},
      this.svgGroup_);
  zoomresetSvg.setAttributeNS(Blockly.HTML_LINK_NS, 'xlink:href', Blockly.ZOOM_CTRL.url);

  //In
  var clip = Blockly.createSvgElement('clipPath',
      {'id': 'blocklyZoominClipPath' + rnd},
      this.svgGroup_);
  Blockly.createSvgElement('rect',
      {'width': this.ZOOM_RECT_WIDTH, 'height': this.ZOOM_RECT_WIDTH, 'x': 152, 'y': 72},
      clip);
  var zoominSvg = Blockly.createSvgElement('image',
      {'class': 'zoomin',
       'width': Blockly.ZOOM_CTRL.width,
       'height': Blockly.ZOOM_CTRL.height,
       'x': 112,//152,
       'y': -48,
       'clip-path': 'url(#blocklyZoominClipPath' + rnd + ')'},
      this.svgGroup_);
  zoominSvg.setAttributeNS(Blockly.HTML_LINK_NS, 'xlink:href', Blockly.ZOOM_CTRL.url);

  //out
  var clip = Blockly.createSvgElement('clipPath',
      {'id': 'blocklyZoomoutClipPath' + rnd},
      this.svgGroup_);
  Blockly.createSvgElement('rect',
      {'width': this.ZOOM_RECT_WIDTH, 'height': this.ZOOM_RECT_WIDTH, 'x': 200, 'y': 72},
      clip);
  var zoomoutSvg = Blockly.createSvgElement('image',
      { 'class': 'zoomout',
        'width': Blockly.ZOOM_CTRL.width,
       'height': Blockly.ZOOM_CTRL.height,
       'x': 160,
       'y': -88,
       'clip-path': 'url(#blocklyZoomoutClipPath' + rnd + ')'},
      this.svgGroup_);
  zoomoutSvg.setAttributeNS(Blockly.HTML_LINK_NS, 'xlink:href', Blockly.ZOOM_CTRL.url);

  // Attach event listeners.
  Blockly.bindEvent_(zoomresetSvg, 'mousedown', null, function(e) {
    zoomresetSvg.classList.add('active');
    workspace.setScale(1);
    workspace.scrollCenter();
    e.stopPropagation();  // Don't start a workspace scroll.
    e.preventDefault();  // Stop double-clicking from selecting text.
  });
  Blockly.bindEvent_(zoominSvg, 'mousedown', null, function(e) {
    zoominSvg.classList.add('active');
    workspace.zoomCenter(-1);
    e.stopPropagation();  // Don't start a workspace scroll.
    e.preventDefault();  // Stop double-clicking from selecting text.
  });
  Blockly.bindEvent_(zoomoutSvg, 'mousedown', null, function(e) {
    zoomoutSvg.classList.add('active');
    workspace.zoomCenter(1);
    e.stopPropagation();  // Don't start a workspace scroll.
    e.preventDefault();  // Stop double-clicking from selecting text.
  });
  //Redo
  zoomRedoSvg && Blockly.bindEvent_(zoomRedoSvg, 'mousedown', null, function(e) {
    zoomRedoSvg.classList.add('active');
    workspace.undo(true);
    e.stopPropagation();  //? Don't start a workspace scroll.
    e.preventDefault();  //? Stop double-clicking from selecting text.
  });
  //Undo
  zoomUndoSvg && Blockly.bindEvent_(zoomUndoSvg, 'mousedown', null, function(e) {
    zoomUndoSvg.classList.add('active');
    workspace.undo(false);
    e.stopPropagation();  //? Don't start a workspace scroll.
    e.preventDefault();  //? Stop double-clicking from selecting text.
  });

  //mouseUp
  Blockly.bindEvent_(zoomresetSvg, 'mouseup', null, function(e) {
    zoomresetSvg.classList.remove('active');
  });
  Blockly.bindEvent_(zoominSvg, 'mouseup', null, function(e) {
    zoominSvg.classList.remove('active');
  });
  Blockly.bindEvent_(zoomoutSvg, 'mouseup', null, function(e) {
    zoomoutSvg.classList.remove('active');
  });
  //Redo
  zoomRedoSvg && Blockly.bindEvent_(zoomRedoSvg, 'mouseup', null, function(e) {
    zoomRedoSvg.classList.remove('active');
  });
  //Undo
  zoomUndoSvg && Blockly.bindEvent_(zoomUndoSvg, 'mouseup', null, function(e) {
    zoomUndoSvg.classList.remove('active');
  });
  return this.svgGroup_;
};


/**
 * Move the zoom controls to the bottom-right corner.
 */
Blockly.ZoomControls.prototype.position = function() {
  var metrics = this.workspace_.getMetrics();
  if (!metrics) {
    // There are no metrics available (workspace is probably not visible).
    return;
  }
  if (this.workspace_.RTL) {
    this.left_ = this.MARGIN_SIDE_ + Blockly.Scrollbar.scrollbarThickness;
    if (metrics.toolboxPosition == Blockly.TOOLBOX_AT_LEFT) {
      this.left_ += metrics.flyoutWidth;
      if (this.workspace_.toolbox_) {
        this.left_ += metrics.absoluteLeft;
      }
    }
  } else {
    this.left_ = metrics.viewWidth + metrics.absoluteLeft /*-
        this.WIDTH_ - this.MARGIN_SIDE_ - Blockly.Scrollbar.scrollbarThickness*/;

    if (metrics.toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {
      this.left_ -= metrics.flyoutWidth;
    }
  }
  this.top_ = metrics.viewHeight + metrics.absoluteTop -
      this.HEIGHT_ - this.bottom_;
  if (metrics.toolboxPosition == Blockly.TOOLBOX_AT_BOTTOM) {
    this.top_ -= metrics.flyoutHeight;
  }
  var left_ = (this.left_ - this.ZOOM_BG_WIDTH)/2;
  // var bg_ = this.svgGroup_.getElementsByClassName('blocklyZoomBg')[0];
  // bg_.setAttribute('transform', 'translate(' + left_ + ',0)');
  this.svgGroup_.setAttribute('transform',
      'translate(' + left_ + ',' + this.top_ + ')');
};