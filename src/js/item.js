
var Rect = require('./rect');

function Item(el, layout) {
  this.el = el;
  this.$el = jQuery(el);

  this.id = this.$el.attr('id'); // things have to ids for now

  this.layout = layout;

  this.rect = new Rect();
  this.placeRect = new Rect(); // we will use this at some point...

  this.updateRect();
}

Item.prototype.updateRect = function() {
  var pos = this.layout.$el.position();
  this.rect.x = this.$el.position().left - pos.left;
  this.rect.y = this.$el.position().top - pos.top;
  this.rect.width = this.$el.width();
  this.rect.height = this.$el.height();

  this.placeRect.width = this.$el.width();
  this.placeRect.height = this.$el.height();
};

Item.prototype.updateDOM = function() {
  var pos = this.layout.$el.position();
  this.$el.css({
    left: pos.left + this.rect.x,
    top: pos.top + this.rect.y
  });
};

Item.prototype.dragMove = function(x, y) {
  var pos = this.layout.$el.position();
  x = x - pos.left;
  y = y - pos.top;
  this.placeRect.x = x;
  this.placeRect.y = y;

  this.rect.x = x;
  this.rect.y = y;
};

module.exports = Item;
