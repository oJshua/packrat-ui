
require('./vendor/jquery-bridget');

var Packer = require('./packer');
var Rect = require('./rect');
var Item = require('./item');

var Packrat = function(el, options) {
  this.el = el;
  this.$el = jQuery(el);
  this.options = options;
  this._init();
};

Packrat.prototype._init = function() {
  var self = this;

  this.packer = new Packer(this.$el.width(), this.$el.height());
  this.collection = {};
  this.order = [];
  this.stamps = [];

  this.$el.droppable({
    accept: this.options.accept,
    hoverClass: 'hovered',
    drop: function(event, ui) {
      self.attachElement(ui.draggable);
      self.layout();
    },
    out: function(event, ui) {
      self.detachElement(ui.draggable);
    },
    over: function(event, ui) {
      self.attachElement(ui.draggable);
    }
  });
};

Packrat.prototype.isAttached = function(element) {
  var id = element.attr('id');
  return (id in this.collection);
};

Packrat.prototype.attachElement = function(element) {
  if (this.isAttached(element)) {
    return;
  }

  var self = this;
  var item = new Item(element, this);
  this.collection[element.attr('id')] = item;

  this.order.push(item);

  element.data('packrat.item', item);

  item.events = {
    dragstart: function(event, ui) {
      self.itemDragStart(item, ui);
    },
    drag: function(event, ui) {
      self.itemDragMove(item, ui.position.left, ui.position.right);
    },
    dragstop: function(event, ui) {
      self.itemDragStop(item, ui);
    }
  };

  element.on('dragstart', item.events.dragstart);
  element.on('drag', item.events.drag);
  element.on('dragstop', item.events.dragstop);

  item.unbindEvents = function() {
    element.off('dragstart', item.events.dragstart);
    element.off('drag', item.events.drag);
    element.off('dragstop', item.events.dragstop);
  };
};

Packrat.prototype.itemDragStart = function(item) {
  item.isPlacing = true;
  this.packer.addSpace(item.rect);
};

Packrat.prototype.itemDragMove = function(item, x, y) {
  item.dragMove(x, y);

  this.order.sort(function(a, b) {
    return a.rect.x - b.rect.x || a.rect.y - b.rect.y;
  });

  this.layout();
};

Packrat.prototype.itemDragStop = function(item) {
  item.isPlacing = false;
  item.updateDOM();
};

Packrat.prototype.beforeLayout = function() {
  this.packer.reset();
};

Packrat.prototype.afterLayout = function() { };

Packrat.prototype.layout = function() {
  this.beforeLayout();
  this.order.forEach(function(item) {
    if (item.isPlacing) {
      this.packer.pack(item.rect);
    } else {
      this.packer.pack(item.rect);
      item.updateDOM();
    }
  }.bind(this));
  this.afterLayout();
};

Packrat.prototype.getItem = function(element) {
  return this.collection[element.attr('id')];
};

Packrat.prototype.detachElement = function(element) {
  var item = element.data('packrat.item');
  this.packer.addSpace(item.rect);
  item.unbindEvents();
  for(var i=0; i<this.order.length; i++) {
    if (this.order[i] === item) {
      this.order.splice(i, 1);
      break;
    }
  }
  delete this.collection[element.attr('id')];
};

$.bridget('packrat', Packrat);

module.exports = Packrat;
