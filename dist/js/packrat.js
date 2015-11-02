(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

},{"./rect":4}],2:[function(require,module,exports){
/**
 * bin-packing layout library - Credit goes to desandro
 *
 * Licensed GPLv3 for open source use
 * or Packery Commercial License for commercial use
 *
 * Copyright 2015 Metafizzy
 */

var Rect = require('./rect');

/**
 * @param {Number} width
 * @param {Number} height
 * @param {String} sortDirection
 *   topLeft for vertical, leftTop for horizontal
 */
function Packer( width, height, sortDirection ) {
  this.width = width || 0;
  this.height = height || 0;
  this.sortDirection = sortDirection || 'downwardLeftToRight';

  this.reset();
}

Packer.prototype.reset = function() {
  this.spaces = [];
  this.newSpaces = [];

  var initialSpace = new Rect({
    x: 0,
    y: 0,
    width: this.width,
    height: this.height
  });

  this.spaces.push( initialSpace );
  // set sorter
  this.sorter = sorters[ this.sortDirection ] || sorters.downwardLeftToRight;
};

// change x and y of rect to fit with in Packer's available spaces
Packer.prototype.pack = function( rect ) {
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    if ( space.canFit( rect ) ) {
      this.placeInSpace( rect, space );
      break;
    }
  }
};

Packer.prototype.placeInSpace = function( rect, space ) {
  // place rect in space
  rect.x = space.x;
  rect.y = space.y;

  this.placed( rect );
};

// update spaces with placed rect
Packer.prototype.placed = function( rect ) {
  // update spaces
  var revisedSpaces = [];
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    var newSpaces = space.getMaximalFreeRects( rect );
    // add either the original space or the new spaces to the revised spaces
    if ( newSpaces ) {
      revisedSpaces.push.apply( revisedSpaces, newSpaces );
    } else {
      revisedSpaces.push( space );
    }
  }

  this.spaces = revisedSpaces;

  this.mergeSortSpaces();
};

Packer.prototype.mergeSortSpaces = function() {
  // remove redundant spaces
  Packer.mergeRects( this.spaces );
  this.spaces.sort( this.sorter );
};

// add a space back
Packer.prototype.addSpace = function( rect ) {
  this.spaces.push( rect );
  this.mergeSortSpaces();
};

// -------------------------- utility functions -------------------------- //

/**
 * Remove redundant rectangle from array of rectangles
 * @param {Array} rects: an array of Rects
 * @returns {Array} rects: an array of Rects
**/
Packer.mergeRects = function( rects ) {
  for ( var i=0, len = rects.length; i < len; i++ ) {
    var rect = rects[i];
    // skip over this rect if it was already removed
    if ( !rect ) {
      continue;
    }
    // clone rects we're testing, remove this rect
    var compareRects = rects.slice(0);
    // do not compare with self
    compareRects.splice( i, 1 );
    // compare this rect with others
    var removedCount = 0;
    for ( var j=0, jLen = compareRects.length; j < jLen; j++ ) {
      var compareRect = compareRects[j];
      // if this rect contains another,
      // remove that rect from test collection
      var indexAdjust = i > j ? 0 : 1;
      if ( rect.contains( compareRect ) ) {
        // console.log( 'current test rects:' + testRects.length, testRects );
        // console.log( i, j, indexAdjust, rect, compareRect );
        rects.splice( j + indexAdjust - removedCount, 1 );
        removedCount++;
      }
    }
  }

  return rects;
};


// -------------------------- sorters -------------------------- //

// functions for sorting rects in order
var sorters = {
  // top down, then left to right
  downwardLeftToRight: function( a, b ) {
    return a.y - b.y || a.x - b.x;
  },
  // left to right, then top down
  rightwardTopToBottom: function( a, b ) {
    return a.x - b.x || a.y - b.y;
  }
};

module.exports = Packer;

},{"./rect":4}],3:[function(require,module,exports){

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


/// test

$('#zone1, #zone2, #zone3').packrat({
  accept: '.pin'
});


$('.pin').draggable();

},{"./item":1,"./packer":2,"./rect":4,"./vendor/jquery-bridget":5}],4:[function(require,module,exports){
/**
 * Simple Rect constructor - By desandro
 *
 * Licensed GPLv3 for open source use
 * or Packery Commercial License for commercial use
 *
 * Copyright 2015 Metafizzy
 */

function Rect( props ) {
  // extend properties from defaults
  for ( var prop in Rect.defaults ) {
    this[ prop ] = Rect.defaults[ prop ];
  }

  for ( prop in props ) {
    this[ prop ] = props[ prop ];
  }

}

Rect.defaults = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

/**
 * Determines whether or not this rectangle wholly encloses another rectangle or point.
 * @param {Rect} rect
 * @returns {Boolean}
**/
Rect.prototype.contains = function( rect ) {
  // points don't have width or height
  var otherWidth = rect.width || 0;
  var otherHeight = rect.height || 0;
  return this.x <= rect.x &&
    this.y <= rect.y &&
    this.x + this.width >= rect.x + otherWidth &&
    this.y + this.height >= rect.y + otherHeight;
};

/**
 * Determines whether or not the rectangle intersects with another.
 * @param {Rect} rect
 * @returns {Boolean}
**/
Rect.prototype.overlaps = function( rect ) {
  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;

  // http://stackoverflow.com/a/306332
  return this.x < rectRight &&
    thisRight > rect.x &&
    this.y < rectBottom &&
    thisBottom > rect.y;
};

/**
 * @param {Rect} rect - the overlapping rect
 * @returns {Array} freeRects - rects representing the area around the rect
**/
Rect.prototype.getMaximalFreeRects = function( rect ) {

  // if no intersection, return false
  if ( !this.overlaps( rect ) ) {
    return false;
  }

  var freeRects = [];
  var freeRect;

  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;

  // top
  if ( this.y < rect.y ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: rect.y - this.y
    });
    freeRects.push( freeRect );
  }

  // right
  if ( thisRight > rectRight ) {
    freeRect = new Rect({
      x: rectRight,
      y: this.y,
      width: thisRight - rectRight,
      height: this.height
    });
    freeRects.push( freeRect );
  }

  // bottom
  if ( thisBottom > rectBottom ) {
    freeRect = new Rect({
      x: this.x,
      y: rectBottom,
      width: this.width,
      height: thisBottom - rectBottom
    });
    freeRects.push( freeRect );
  }

  // left
  if ( this.x < rect.x ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: rect.x - this.x,
      height: this.height
    });
    freeRects.push( freeRect );
  }

  return freeRects;
};

Rect.prototype.canFit = function( rect ) {
  return this.width >= rect.width && this.height >= rect.height;
};

module.exports = Rect;


},{}],5:[function(require,module,exports){
/**
 * Bridget makes jQuery widgets
 * v1.1.0
 * MIT license
 */

(function(window) {

  'use strict';

  // -------------------------- utils -------------------------- //

  var slice = Array.prototype.slice;

  function noop() {}

  // -------------------------- definition -------------------------- //

  function defineBridget( $ ) {

    // bail if no jQuery
    if ( !$ ) {
      return;
    }

    // -------------------------- addOptionMethod -------------------------- //

    /**
     * adds option method -> $().plugin('option', {...})
     * @param {Function} PluginClass - constructor class
     */
    function addOptionMethod( PluginClass ) {
      // don't overwrite original option method
      if ( PluginClass.prototype.option ) {
        return;
      }

      // option setter
      PluginClass.prototype.option = function( opts ) {
        // bail out if not an object
        if ( !$.isPlainObject( opts ) ){
          return;
        }
        this.options = $.extend( true, this.options, opts );
      };
    }

    // -------------------------- plugin bridge -------------------------- //

    // helper function for logging errors
    // $.error breaks jQuery chaining
    var logError = typeof console === 'undefined' ? noop :
      function( message ) {
        console.error( message );
      };

    /**
     * jQuery plugin bridge, access methods like $elem.plugin('method')
     * @param {String} namespace - plugin name
     * @param {Function} PluginClass - constructor class
     */
    function bridge( namespace, PluginClass ) {
      // add to jQuery fn namespace
      $.fn[ namespace ] = function( options ) {
        if ( typeof options === 'string' ) {
          // call plugin method when first argument is a string
          // get arguments for method
          var args = slice.call( arguments, 1 );

          for ( var i=0, len = this.length; i < len; i++ ) {
            var elem = this[i];
            var instance = $.data( elem, namespace );
            if ( !instance ) {
              logError( "cannot call methods on " + namespace + " prior to initialization; " +
                "attempted to call '" + options + "'" );
              continue;
            }
            if ( !$.isFunction( instance[options] ) || options.charAt(0) === '_' ) {
              logError( "no such method '" + options + "' for " + namespace + " instance" );
              continue;
            }

            // trigger method with arguments
            var returnValue = instance[ options ].apply( instance, args );

            // break look and return first value if provided
            if ( returnValue !== undefined ) {
              return returnValue;
            }
          }
          // return this if no return value
          return this;
        } else {
          return this.each( function() {
            var instance = $.data( this, namespace );
            if ( instance ) {
              // apply options & init
              instance.option( options );
              instance._init();
            } else {
              // initialize new instance
              instance = new PluginClass( this, options );
              $.data( this, namespace, instance );
            }
          });
        }
      };

    }

    // -------------------------- bridget -------------------------- //

    /**
     * converts a Prototypical class into a proper jQuery plugin
     *   the class must have a ._init method
     * @param {String} namespace - plugin name, used in $().pluginName
     * @param {Function} PluginClass - constructor class
     */
    $.bridget = function( namespace, PluginClass ) {
      addOptionMethod( PluginClass );
      bridge( namespace, PluginClass );
    };

  }

  defineBridget( window.jQuery || window.$ );

})(window);

},{}]},{},[3]);
