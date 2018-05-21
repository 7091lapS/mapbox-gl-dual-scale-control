(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DualScaleControl = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Ported from Webkit
 * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 */

module.exports = UnitBezier;

function UnitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;

    this.p1x = p1x;
    this.p1y = p2y;
    this.p2x = p2x;
    this.p2y = p2y;
}

UnitBezier.prototype.sampleCurveX = function(t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((this.ax * t + this.bx) * t + this.cx) * t;
};

UnitBezier.prototype.sampleCurveY = function(t) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
};

UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
};

UnitBezier.prototype.solveCurveX = function(x, epsilon) {
    if (typeof epsilon === 'undefined') epsilon = 1e-6;

    var t0, t1, t2, x2, i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {

        x2 = this.sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) return t2;

        var d2 = this.sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;

        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {

        x2 = this.sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) return t2;

        if (x > x2) {
            t0 = t2;
        } else {
            t1 = t2;
        }

        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
};

UnitBezier.prototype.solve = function(x, epsilon) {
    return this.sampleCurveY(this.solveCurveX(x, epsilon));
};

},{}],2:[function(require,module,exports){
'use strict';
//      

/**
 * A coordinate is a column, row, zoom combination, often used
 * as the data component of a tile.
 *
 * @param {number} column
 * @param {number} row
 * @param {number} zoom
 * @private
 */
var Coordinate = function Coordinate(column    , row    , zoom    ) {
    this.column = column;
    this.row = row;
    this.zoom = zoom;
};

/**
 * Create a clone of this coordinate that can be mutated without
 * changing the original coordinate
 *
 * @returns {Coordinate} clone
 * @private
 * var coord = new Coordinate(0, 0, 0);
 * var c2 = coord.clone();
 * // since coord is cloned, modifying a property of c2 does
 * // not modify it.
 * c2.zoom = 2;
 */
Coordinate.prototype.clone = function clone () {
    return new Coordinate(this.column, this.row, this.zoom);
};

/**
 * Zoom this coordinate to a given zoom level. This returns a new
 * coordinate object, not mutating the old one.
 *
 * @param {number} zoom
 * @returns {Coordinate} zoomed coordinate
 * @private
 * @example
 * var coord = new Coordinate(0, 0, 0);
 * var c2 = coord.zoomTo(1);
 * c2 // equals new Coordinate(0, 0, 1);
 */
Coordinate.prototype.zoomTo = function zoomTo (zoom    ) { return this.clone()._zoomTo(zoom); };

/**
 * Subtract the column and row values of this coordinate from those
 * of another coordinate. The other coordinat will be zoomed to the
 * same level as `this` before the subtraction occurs
 *
 * @param {Coordinate} c other coordinate
 * @returns {Coordinate} result
 * @private
 */
Coordinate.prototype.sub = function sub (c        ) { return this.clone()._sub(c); };

Coordinate.prototype._zoomTo = function _zoomTo (zoom    ) {
    var scale = Math.pow(2, zoom - this.zoom);
    this.column *= scale;
    this.row *= scale;
    this.zoom = zoom;
    return this;
};

Coordinate.prototype._sub = function _sub (c        ) {
    c = c.zoomTo(this.zoom);
    this.column -= c.column;
    this.row -= c.row;
    return this;
};

module.exports = Coordinate;

},{}],3:[function(require,module,exports){
'use strict';

/* eslint-env browser */
module.exports = self;

},{}],4:[function(require,module,exports){
'use strict';

var Point = require('point-geometry');
var window = require('./window');

exports.create = function (tagName, className, container) {
    var el = window.document.createElement(tagName);
    if (className) { el.className = className; }
    if (container) { container.appendChild(el); }
    return el;
};

var docStyle = window.document.documentElement.style;

function testProp(props) {
    for (var i = 0; i < props.length; i++) {
        if (props[i] in docStyle) {
            return props[i];
        }
    }
    return props[0];
}

var selectProp = testProp(['userSelect', 'MozUserSelect', 'WebkitUserSelect', 'msUserSelect']);
var userSelect;
exports.disableDrag = function () {
    if (selectProp) {
        userSelect = docStyle[selectProp];
        docStyle[selectProp] = 'none';
    }
};
exports.enableDrag = function () {
    if (selectProp) {
        docStyle[selectProp] = userSelect;
    }
};

var transformProp = testProp(['transform', 'WebkitTransform']);
exports.setTransform = function(el, value) {
    el.style[transformProp] = value;
};

// Suppress the next click, but only if it's immediate.
function suppressClick(e) {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('click', suppressClick, true);
}
exports.suppressClick = function() {
    window.addEventListener('click', suppressClick, true);
    window.setTimeout(function () {
        window.removeEventListener('click', suppressClick, true);
    }, 0);
};

exports.mousePos = function (el, e) {
    var rect = el.getBoundingClientRect();
    e = e.touches ? e.touches[0] : e;
    return new Point(
        e.clientX - rect.left - el.clientLeft,
        e.clientY - rect.top - el.clientTop
    );
};

exports.touchPos = function (el, e) {
    var rect = el.getBoundingClientRect(),
        points = [];
    var touches = (e.type === 'touchend') ? e.changedTouches : e.touches;
    for (var i = 0; i < touches.length; i++) {
        points.push(new Point(
            touches[i].clientX - rect.left - el.clientLeft,
            touches[i].clientY - rect.top - el.clientTop
        ));
    }
    return points;
};

exports.remove = function(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
};

},{"./window":3,"point-geometry":6}],5:[function(require,module,exports){
'use strict';
//      

var UnitBezier = require('@mapbox/unitbezier');
var Coordinate = require('../geo/coordinate');
var Point = require('point-geometry');

/**
 * Given a value `t` that varies between 0 and 1, return
 * an interpolation function that eases between 0 and 1 in a pleasing
 * cubic in-out fashion.
 *
 * @private
 */
exports.easeCubicInOut = function(t        )         {
    if (t <= 0) { return 0; }
    if (t >= 1) { return 1; }
    var t2 = t * t,
        t3 = t2 * t;
    return 4 * (t < 0.5 ? t3 : 3 * (t - t2) + t3 - 0.75);
};

/**
 * Given given (x, y), (x1, y1) control points for a bezier curve,
 * return a function that interpolates along that curve.
 *
 * @param p1x control point 1 x coordinate
 * @param p1y control point 1 y coordinate
 * @param p2x control point 2 x coordinate
 * @param p2y control point 2 y coordinate
 * @private
 */
exports.bezier = function(p1x        , p1y        , p2x        , p2y        )                        {
    var bezier = new UnitBezier(p1x, p1y, p2x, p2y);
    return function(t        ) {
        return bezier.solve(t);
    };
};

/**
 * A default bezier-curve powered easing function with
 * control points (0.25, 0.1) and (0.25, 1)
 *
 * @private
 */
exports.ease = exports.bezier(0.25, 0.1, 0.25, 1);

/**
 * constrain n to the given range via min + max
 *
 * @param n value
 * @param min the minimum value to be returned
 * @param max the maximum value to be returned
 * @returns the clamped value
 * @private
 */
exports.clamp = function (n        , min        , max        )         {
    return Math.min(max, Math.max(min, n));
};

/**
 * constrain n to the given range, excluding the minimum, via modular arithmetic
 *
 * @param n value
 * @param min the minimum value to be returned, exclusive
 * @param max the maximum value to be returned, inclusive
 * @returns constrained number
 * @private
 */
exports.wrap = function (n        , min        , max        )         {
    var d = max - min;
    var w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
};

/*
 * Call an asynchronous function on an array of arguments,
 * calling `callback` with the completed results of all calls.
 *
 * @param array input to each call of the async function.
 * @param fn an async function with signature (data, callback)
 * @param callback a callback run after all async work is done.
 * called with an array, containing the results of each async call.
 * @private
 */
exports.asyncAll = function (array            , fn          , callback          ) {
    if (!array.length) { return callback(null, []); }
    var remaining = array.length;
    var results = new Array(array.length);
    var error = null;
    array.forEach(function (item, i) {
        fn(item, function (err, result) {
            if (err) { error = err; }
            results[i] = result;
            if (--remaining === 0) { callback(error, results); }
        });
    });
};

/*
 * Polyfill for Object.values. Not fully spec compliant, but we don't
 * need it to be.
 *
 * @private
 */
exports.values = function (obj        )                {
    var result = [];
    for (var k in obj) {
        result.push(obj[k]);
    }
    return result;
};

/*
 * Compute the difference between the keys in one object and the keys
 * in another object.
 *
 * @returns keys difference
 * @private
 */
exports.keysDifference = function (obj        , other        )                {
    var difference = [];
    for (var i in obj) {
        if (!(i in other)) {
            difference.push(i);
        }
    }
    return difference;
};

/**
 * Given a destination object and optionally many source objects,
 * copy all properties from the source objects into the destination.
 * The last source object given overrides properties from previous
 * source objects.
 *
 * @param dest destination object
 * @param {...Object} sources sources from which properties are pulled
 * @private
 */
// eslint-disable-next-line no-unused-vars
exports.extend = function (dest        , source0        , source1         , source2         )         {
    var arguments$1 = arguments;

    for (var i = 1; i < arguments.length; i++) {
        var src = arguments$1[i];
        for (var k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
};

/**
 * Given an object and a number of properties as strings, return version
 * of that object with only those properties.
 *
 * @param src the object
 * @param properties an array of property names chosen
 * to appear on the resulting object.
 * @returns object with limited properties.
 * @example
 * var foo = { name: 'Charlie', age: 10 };
 * var justName = pick(foo, ['name']);
 * // justName = { name: 'Charlie' }
 * @private
 */
exports.pick = function (src        , properties               )         {
    var result = {};
    for (var i = 0; i < properties.length; i++) {
        var k = properties[i];
        if (k in src) {
            result[k] = src[k];
        }
    }
    return result;
};

var id = 1;

/**
 * Return a unique numeric id, starting at 1 and incrementing with
 * each call.
 *
 * @returns unique numeric id.
 * @private
 */
exports.uniqueId = function ()         {
    return id++;
};

/**
 * Given an array of member function names as strings, replace all of them
 * with bound versions that will always refer to `context` as `this`. This
 * is useful for classes where otherwise event bindings would reassign
 * `this` to the evented object or some other value: this lets you ensure
 * the `this` value always.
 *
 * @param fns list of member function names
 * @param context the context value
 * @example
 * function MyClass() {
 *   bindAll(['ontimer'], this);
 *   this.name = 'Tom';
 * }
 * MyClass.prototype.ontimer = function() {
 *   alert(this.name);
 * };
 * var myClass = new MyClass();
 * setTimeout(myClass.ontimer, 100);
 * @private
 */
exports.bindAll = function(fns               , context        )       {
    fns.forEach(function (fn) {
        if (!context[fn]) { return; }
        context[fn] = context[fn].bind(context);
    });
};

/**
 * Given a list of coordinates, get their center as a coordinate.
 *
 * @returns centerpoint
 * @private
 */
exports.getCoordinatesCenter = function(coords                   )             {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    for (var i = 0; i < coords.length; i++) {
        minX = Math.min(minX, coords[i].column);
        minY = Math.min(minY, coords[i].row);
        maxX = Math.max(maxX, coords[i].column);
        maxY = Math.max(maxY, coords[i].row);
    }

    var dx = maxX - minX;
    var dy = maxY - minY;
    var dMax = Math.max(dx, dy);
    var zoom = Math.max(0, Math.floor(-Math.log(dMax) / Math.LN2));
    return new Coordinate((minX + maxX) / 2, (minY + maxY) / 2, 0)
        .zoomTo(zoom);
};

/**
 * Determine if a string ends with a particular substring
 *
 * @private
 */
exports.endsWith = function(string        , suffix        )          {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
};

/**
 * Create an object by mapping all the values of an existing object while
 * preserving their keys.
 *
 * @private
 */
exports.mapObject = function(input        , iterator          , context         )         {
    var this$1 = this;

    var output = {};
    for (var key in input) {
        output[key] = iterator.call(context || this$1, input[key], key, input);
    }
    return output;
};

/**
 * Create an object by filtering out values of an existing object.
 *
 * @private
 */
exports.filterObject = function(input        , iterator          , context         )         {
    var this$1 = this;

    var output = {};
    for (var key in input) {
        if (iterator.call(context || this$1, input[key], key, input)) {
            output[key] = input[key];
        }
    }
    return output;
};

/**
 * Deeply compares two object literals.
 *
 * @private
 */
exports.deepEqual = function(a        , b        )          {
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) { return false; }
        for (var i = 0; i < a.length; i++) {
            if (!exports.deepEqual(a[i], b[i])) { return false; }
        }
        return true;
    }
    if (typeof a === 'object' && a !== null && b !== null) {
        if (!(typeof b === 'object')) { return false; }
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) { return false; }
        for (var key in a) {
            if (!exports.deepEqual(a[key], b[key])) { return false; }
        }
        return true;
    }
    return a === b;
};

/**
 * Deeply clones two objects.
 *
 * @private
 */
exports.clone = function   (input   )    {
    if (Array.isArray(input)) {
        return input.map(exports.clone);
    } else if (typeof input === 'object' && input) {
        return ((exports.mapObject(input, exports.clone)     )   );
    } else {
        return input;
    }
};

/**
 * Check if two arrays have at least one common element.
 *
 * @private
 */
exports.arraysIntersect = function(a            , b            )          {
    for (var l = 0; l < a.length; l++) {
        if (b.indexOf(a[l]) >= 0) { return true; }
    }
    return false;
};

/**
 * Print a warning message to the console and ensure duplicate warning messages
 * are not printed.
 *
 * @private
 */
var warnOnceHistory = {};
exports.warnOnce = function(message        )       {
    if (!warnOnceHistory[message]) {
        // console isn't defined in some WebWorkers, see #2558
        if (typeof console !== "undefined") { console.warn(message); }
        warnOnceHistory[message] = true;
    }
};

/**
 * Indicates if the provided Points are in a counter clockwise (true) or clockwise (false) order
 *
 * @returns true for a counter clockwise set of points
 */
// http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
exports.isCounterClockwise = function(a       , b       , c       )          {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
};

/**
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @param ring Exterior or interior ring
 */
exports.calculateSignedArea = function(ring              )         {
    var sum = 0;
    for (var i = 0, len = ring.length, j = len - 1, p1 = (void 0), p2 = (void 0); i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
};

/**
 * Detects closed polygons, first + last point are equal
 *
 * @param points array of points
 * @return true if the points are a closed polygon
 */
exports.isClosedPolygon = function(points              )          {
    // If it is 2 points that are the same then it is a point
    // If it is 3 points with start and end the same then it is a line
    if (points.length < 4)
        { return false; }

    var p1 = points[0];
    var p2 = points[points.length - 1];

    if (Math.abs(p1.x - p2.x) > 0 ||
        Math.abs(p1.y - p2.y) > 0) {
        return false;
    }

    // polygon simplification can produce polygons with zero area and more than 3 points
    return (Math.abs(exports.calculateSignedArea(points)) > 0.01);
};

/**
 * Converts spherical coordinates to cartesian coordinates.
 *
 * @param spherical Spherical coordinates, in [radial, azimuthal, polar]
 * @return cartesian coordinates in [x, y, z]
 */

exports.sphericalToCartesian = function(spherical               )                {
    var r = spherical[0];
    var azimuthal = spherical[1],
        polar = spherical[2];
    // We abstract "north"/"up" (compass-wise) to be 0° when really this is 90° (π/2):
    // correct for that here
    azimuthal += 90;

    // Convert azimuthal and polar angles to radians
    azimuthal *= Math.PI / 180;
    polar *= Math.PI / 180;

    // spherical to cartesian (x, y, z)
    return [
        r * Math.cos(azimuthal) * Math.sin(polar),
        r * Math.sin(azimuthal) * Math.sin(polar),
        r * Math.cos(polar)
    ];
};

/**
 * Parses data from 'Cache-Control' headers.
 *
 * @param cacheControl Value of 'Cache-Control' header
 * @return object containing parsed header info.
 */

exports.parseCacheControl = function(cacheControl        )         {
    // Taken from [Wreck](https://github.com/hapijs/wreck)
    var re = /(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g;

    var header = {};
    cacheControl.replace(re, function ($0, $1, $2, $3) {
        var value = $2 || $3;
        header[$1] = value ? value.toLowerCase() : true;
        return '';
    });

    if (header['max-age']) {
        var maxAge = parseInt(header['max-age'], 10);
        if (isNaN(maxAge)) { delete header['max-age']; }
        else { header['max-age'] = maxAge; }
    }

    return header;
};

},{"../geo/coordinate":2,"@mapbox/unitbezier":1,"point-geometry":6}],6:[function(require,module,exports){
'use strict';

module.exports = Point;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
        return this.x === p.x &&
               this.y === p.y;
    },

    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

// constructs Point from an array if necessary
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

},{}],7:[function(require,module,exports){
//adapted from https://github.com/mapbox/mapbox-gl-js/blob/061fdb514a33cf9b2b542a1c7bd433c166da917e/src/ui/control/scale_control.js#L19-L52

'use strict';

var DOM = require('mapbox-gl/src/util/dom');
var util = require('mapbox-gl/src/util/util');

/**
 * A `ScaleControl` control displays the ratio of a distance on the map to the corresponding distance on the ground.
 *
 * @implements {IControl}
 * @param {Object} [options]
 * @param {number} [options.maxWidth='150'] The maximum length of the scale control in pixels.
 * @example
 * map.addControl(new ScaleControl({
 *     maxWidth: 80
 * }));
 */
 var DualScaleControl = function DualScaleControl(options) {
      this.options = options;

      util.bindAll([
          '_onMove', '_onMouseMove'
      ], this);
  };

  DualScaleControl.prototype.getDefaultPosition = function getDefaultPosition () {
      return 'bottom-left';
  };

  DualScaleControl.prototype._onMove = function _onMove () {
      updateScale(this._map, this._metricContainer, this._imperialContainer, this.options);
  };

  DualScaleControl.prototype._onMouseMove = function _onMouseMove (e) {
      updatePosition(this._map, this._positionContainer, e.lngLat);
  };

  DualScaleControl.prototype.onAdd = function onAdd (map) {
      this._map = map;
      this._container = DOM.create('div', 'mapboxgl-ctrl mapboxgl-ctrl-scale maphubs-ctrl-scale', map.getContainer());
      this._positionContainer = DOM.create('div', 'map-position', this._container);
      this._metricContainer = DOM.create('div', 'metric-scale', this._container);
      this._imperialContainer = DOM.create('div', 'imperial-scale', this._container);

      this._map.on('move', this._onMove);
      this._onMove();

      this._map.on('mousemove', this._onMouseMove);
      //this._onMouseMove(this._map.getCenter()); //start at center

      return this._container;
  };

  DualScaleControl.prototype.onRemove = function onRemove () {
      this._container.parentNode.removeChild(this._container);
      this._map.off('move', this._onMove);
      this._map.off('mousemove', this._onMouseMove);
      this._map = undefined;
  };

module.exports = DualScaleControl;


function updatePosition(map, container, lngLat) {
  var lat = lngLat.lat.toPrecision(4);
  var lng = lngLat.lng.toPrecision(4);
  container.innerHTML = lat + ", " + lng;
}

function updateScale(map, metricContainer, imperialContainer, options) {
    // A horizontal scale is imagined to be present at center of the map
    // container with maximum length (Default) as 100px.
    // Using spherical law of cosines approximation, the real distance is
    // found between the two coordinates.
    var maxWidth = options && options.maxWidth || 100;

    var y = map._container.clientHeight / 2;
    var maxMeters = getDistance(map.unproject([0, y]), map.unproject([maxWidth, y]));
    // The real distance corresponding to 100px scale length is rounded off to
    // near pretty number and the scale length for the same is found out.
    // Default unit of the scale is based on User's locale.
    var maxYards = 1.09361 * maxMeters;
    if (maxYards > 440) {
        var maxMiles = maxYards / 1760;
        setScale(imperialContainer, maxWidth, maxMiles, 'mi');
    } else {
        setScale(imperialContainer, maxWidth, maxYards, 'yd');
    }
    setScale(metricContainer, maxWidth, maxMeters, 'm');

}

function setScale(container, maxWidth, maxDistance, unit) {
    var distance = getRoundNum(maxDistance);
    var ratio = distance / maxDistance;

    if (unit === 'm' && distance >= 1000) {
        distance = distance / 1000;
        unit = 'km';
    }

    container.style.width = (maxWidth * ratio) + "px";
    container.innerHTML = distance + unit;
}

function getDistance(latlng1, latlng2) {
    // Uses spherical law of cosines approximation.
    var R = 6371000;

    var rad = Math.PI / 180,
        lat1 = latlng1.lat * rad,
        lat2 = latlng2.lat * rad,
        a = Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

    var maxMeters = R * Math.acos(Math.min(a, 1));
    return maxMeters;

}

function getRoundNum(num) {
    var pow10 = Math.pow(10, (("" + (Math.floor(num)))).length - 1);
    var d = num / pow10;

    d = d >= 10 ? 10 :
        d >= 5 ? 5 :
            d >= 3 ? 3 :
                d >= 2 ? 2 :
                    d >= 1 ? 1 :
                        d >= 0.5 ? 0.5 : 0.25;

    return pow10 * d;
}

},{"mapbox-gl/src/util/dom":4,"mapbox-gl/src/util/util":5}]},{},[7])(7)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQG1hcGJveC91bml0YmV6aWVyL2luZGV4LmpzIiwiL1VzZXJzL2FudG9uaW9fdm9jZS9kZXYvbWFwYm94LWdsLWR1YWwtc2NhbGUtY29udHJvbC9ub2RlX21vZHVsZXMvbWFwYm94LWdsL3NyYy9nZW8vY29vcmRpbmF0ZS5qcyIsIi9Vc2Vycy9hbnRvbmlvX3ZvY2UvZGV2L21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9icm93c2VyL3dpbmRvdy5qcyIsIi9Vc2Vycy9hbnRvbmlvX3ZvY2UvZGV2L21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9kb20uanMiLCIvVXNlcnMvYW50b25pb192b2NlL2Rldi9tYXBib3gtZ2wtZHVhbC1zY2FsZS1jb250cm9sL25vZGVfbW9kdWxlcy9tYXBib3gtZ2wvc3JjL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9wb2ludC1nZW9tZXRyeS9pbmRleC5qcyIsIi9Vc2Vycy9hbnRvbmlvX3ZvY2UvZGV2L21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBWWIsSUFBTSxVQUFVLEdBQUMsQUFJakIsQUFBSSxtQkFBVyxDQUFDLE1BQU0sSUFBSSxBQUFJLEVBQUUsR0FBRyxJQUFJLEFBQUksRUFBRSxJQUFJLElBQUksQUFBSSxFQUFFO0lBQ3ZELEFBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixBQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLEFBQUksQ0FBQyxDQUFBOztBQUVMLEFBQUk7Q0FDSCxBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtBQUNMLEFBQUkscUJBQUEsS0FBSyxrQkFBQSxHQUFHO0lBQ1IsQUFBSSxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEUsQUFBSSxDQUFDLENBQUE7O0FBRUwsQUFBSTtDQUNILEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0FBQ0wsQUFBSSxxQkFBQSxNQUFNLG1CQUFBLENBQUMsSUFBSSxJQUFJLEFBQUksRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUE7O0FBRS9ELEFBQUk7Q0FDSCxBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtBQUNMLEFBQUkscUJBQUEsR0FBRyxnQkFBQSxDQUFDLENBQUMsUUFBUSxBQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBOztBQUV2RCxBQUFJLHFCQUFBLE9BQU8sb0JBQUEsQ0FBQyxJQUFJLElBQUksQUFBSSxFQUFFO0lBQ3RCLEFBQUksR0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELEFBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUM7SUFDekIsQUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQztJQUN0QixBQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLEFBQUksT0FBTyxJQUFJLENBQUM7QUFDcEIsQUFBSSxDQUFDLENBQUE7O0FBRUwsQUFBSSxxQkFBQSxJQUFJLGlCQUFBLENBQUMsQ0FBQyxRQUFRLEFBQUksRUFBRTtJQUNwQixBQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixBQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM1QixBQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUN0QixBQUFJLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEFBQUksQ0FBQyxDQUFBLEFBQ0o7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7OztBQy9FNUIsWUFBWSxDQUFDOzs7QUFHYixNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzs7O0FDSHRCLFlBQVksQ0FBQzs7QUFFYixHQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hDLEdBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUVuQyxPQUFPLENBQUMsTUFBTSxHQUFHLFVBQVUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUU7SUFDdEQsR0FBSyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxJQUFJLFNBQVMsRUFBRSxFQUFBLEVBQUUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEVBQUE7SUFDeEMsSUFBSSxTQUFTLEVBQUUsRUFBQSxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUE7SUFDekMsT0FBTyxFQUFFLENBQUM7Q0FDYixDQUFDOztBQUVGLEdBQUssQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDOztBQUV2RCxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUU7SUFDckIsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNuQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUU7WUFDdEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7S0FDSjtJQUNELE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ25COztBQUVELEdBQUssQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ2pHLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDZixPQUFPLENBQUMsV0FBVyxHQUFHLFlBQVk7SUFDOUIsSUFBSSxVQUFVLEVBQUU7UUFDWixVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUM7S0FDakM7Q0FDSixDQUFDO0FBQ0YsT0FBTyxDQUFDLFVBQVUsR0FBRyxZQUFZO0lBQzdCLElBQUksVUFBVSxFQUFFO1FBQ1osUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztLQUNyQztDQUNKLENBQUM7O0FBRUYsR0FBSyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE9BQU8sQ0FBQyxZQUFZLEdBQUcsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFO0lBQ3ZDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ25DLENBQUM7OztBQUdGLFNBQVMsYUFBYSxDQUFDLENBQUMsRUFBRTtJQUN0QixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzVEO0FBQ0QsT0FBTyxDQUFDLGFBQWEsR0FBRyxXQUFXO0lBQy9CLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBQSxHQUFHLEFBQUc7UUFDcEIsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNULENBQUM7O0FBRUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDaEMsR0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUN4QyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxPQUFPLElBQUksS0FBSztRQUNaLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVTtRQUNyQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVM7S0FDdEMsQ0FBQztDQUNMLENBQUM7O0FBRUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDaEMsR0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDbkMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixHQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDdkUsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSztZQUNqQixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLFVBQVU7WUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxTQUFTO1NBQy9DLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7QUFFRixPQUFPLENBQUMsTUFBTSxHQUFHLFNBQVMsSUFBSSxFQUFFO0lBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQztDQUNKLENBQUM7OztBQ2pGRixZQUFZLENBQUM7OztBQUdiLEdBQUssQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDakQsR0FBSyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRCxHQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTeEMsT0FBTyxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsa0JBQWtCO0lBQ2pELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFBLE9BQU8sQ0FBQyxDQUFDLEVBQUE7SUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUEsT0FBTyxDQUFDLENBQUMsRUFBQTtJQUNyQixHQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0NBQ3hELENBQUM7Ozs7Ozs7Ozs7OztBQVlGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsVUFBVSxHQUFHLGlDQUFpQztJQUNqRyxHQUFLLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sU0FBUyxDQUFDLFVBQVU7UUFDdkIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFCLENBQUM7Q0FDTCxDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7QUFXbEQsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxrQkFBa0I7SUFDbkUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzFDLENBQUM7Ozs7Ozs7Ozs7O0FBV0YsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxrQkFBa0I7SUFDbEUsR0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLEdBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUN4QyxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7Q0FDaEMsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEtBQUssY0FBYyxFQUFFLFlBQVksUUFBUSxZQUFZO0lBQzlFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDakQsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzdCLEdBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBQSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQUFBRztRQUN2QixFQUFFLENBQUMsSUFBSSxFQUFFLFNBQUEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEFBQUc7WUFDdEIsSUFBSSxHQUFHLEVBQUUsRUFBQSxLQUFLLEdBQUcsR0FBRyxDQUFDLEVBQUE7WUFDckIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztZQUNwQixJQUFJLEVBQUUsU0FBUyxLQUFLLENBQUMsRUFBRSxFQUFBLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBQTtTQUNuRCxDQUFDLENBQUM7S0FDTixDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVSxHQUFHLHlCQUF5QjtJQUNuRCxHQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLEdBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLE1BQU0sQ0FBQztDQUNqQixDQUFDOzs7Ozs7Ozs7QUFTRixPQUFPLENBQUMsY0FBYyxHQUFHLFVBQVUsR0FBRyxVQUFVLEtBQUsseUJBQXlCO0lBQzFFLEdBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssR0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7UUFDakIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0QjtLQUNKO0lBQ0QsT0FBTyxVQUFVLENBQUM7Q0FDckIsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWFGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVSxJQUFJLFVBQVUsT0FBTyxVQUFVLE9BQU8sV0FBVyxPQUFPLG1CQUFtQixDQUFDOztBQUFBO0lBQ25HLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdkMsR0FBSyxDQUFDLEdBQUcsR0FBRyxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsS0FBSyxHQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BCO0tBQ0o7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNmLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkYsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUcsVUFBVSxVQUFVLHlCQUF5QjtJQUNyRSxHQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLEdBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUNWLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEI7S0FDSjtJQUNELE9BQU8sTUFBTSxDQUFDO0NBQ2pCLENBQUM7O0FBRUYsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7OztBQVNYLE9BQU8sQ0FBQyxRQUFRLEdBQUcsb0JBQW9CO0lBQ25DLE9BQU8sRUFBRSxFQUFFLENBQUM7Q0FDZixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCRixPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxpQkFBaUIsT0FBTyxnQkFBZ0I7SUFDbEUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFBLENBQUMsRUFBRSxFQUFFLEFBQUc7UUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRTtRQUM3QixPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUMzQyxDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLE1BQU0saUNBQWlDO0lBQzNFLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDckIsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQzs7SUFFckIsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4QyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3hDOztJQUVELEdBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztJQUN2QixHQUFLLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7SUFDdkIsR0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QixHQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDekQsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3JCLENBQUM7Ozs7Ozs7QUFPRixPQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsTUFBTSxVQUFVLE1BQU0sbUJBQW1CO0lBQ2pFLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDdkUsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsS0FBSyxVQUFVLFFBQVEsWUFBWSxPQUFPLG1CQUFtQixDQUFDOztBQUFBO0lBQ3ZGLEdBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEtBQUssR0FBSyxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUU7UUFDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hFO0lBQ0QsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7Ozs7OztBQU9GLE9BQU8sQ0FBQyxZQUFZLEdBQUcsU0FBUyxLQUFLLFVBQVUsUUFBUSxZQUFZLE9BQU8sbUJBQW1CLENBQUM7O0FBQUE7SUFDMUYsR0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbEIsS0FBSyxHQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRTtRQUNyQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7S0FDSjtJQUNELE9BQU8sTUFBTSxDQUFDO0NBQ2pCLENBQUM7Ozs7Ozs7QUFPRixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO0lBQ3hELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQzdELEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUEsT0FBTyxLQUFLLENBQUMsRUFBQTtTQUNwRDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkQsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQzNDLEdBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQ3hELEtBQUssR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUU7WUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUEsT0FBTyxLQUFLLENBQUMsRUFBQTtTQUN4RDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbEIsQ0FBQzs7Ozs7OztBQU9GLE9BQU8sQ0FBQyxLQUFLLEdBQUcsWUFBWSxLQUFLLFFBQVE7SUFDckMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkMsTUFBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEVBQUU7UUFDM0MsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztLQUM5RCxNQUFNO1FBQ0gsT0FBTyxLQUFLLENBQUM7S0FDaEI7Q0FDSixDQUFDOzs7Ozs7O0FBT0YsT0FBTyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFDLHVCQUF1QjtJQUN0RSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQy9CLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQSxPQUFPLElBQUksQ0FBQyxFQUFBO0tBQ3pDO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDaEIsQ0FBQzs7Ozs7Ozs7QUFRRixHQUFLLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMzQixPQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsT0FBTyxnQkFBZ0I7SUFDL0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRTs7UUFFM0IsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsRUFBQSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUE7UUFDMUQsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNuQztDQUNKLENBQUM7Ozs7Ozs7O0FBUUYsT0FBTyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGtCQUFrQjtJQUN6RSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEUsQ0FBQzs7Ozs7Ozs7O0FBU0YsT0FBTyxDQUFDLG1CQUFtQixHQUFHLFNBQVMsSUFBSSx3QkFBd0I7SUFDL0QsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsV0FBQSxFQUFFLEVBQUUsV0FBQSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFO1FBQ3RFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUNELE9BQU8sR0FBRyxDQUFDO0NBQ2QsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsZUFBZSxHQUFHLFNBQVMsTUFBTSx5QkFBeUI7OztJQUc5RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNqQixFQUFBLE9BQU8sS0FBSyxDQUFDLEVBQUE7O0lBRWpCLEdBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLEdBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBRXJDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0tBQ2hCOzs7SUFHRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztDQUNqRSxDQUFDOzs7Ozs7Ozs7QUFTRixPQUFPLENBQUMsb0JBQW9CLEdBQUcsU0FBUyxTQUFTLGdDQUFnQztJQUM3RSxHQUFLLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0lBR3pCLFNBQVMsSUFBSSxFQUFFLENBQUM7OztJQUdoQixTQUFTLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDM0IsS0FBSyxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDOzs7SUFHdkIsT0FBTztRQUNILENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3pDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3pDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztLQUN0QixDQUFDO0NBQ0wsQ0FBQzs7Ozs7Ozs7O0FBU0YsT0FBTyxDQUFDLGlCQUFpQixHQUFHLFNBQVMsWUFBWSxrQkFBa0I7O0lBRS9ELEdBQUssQ0FBQyxFQUFFLEdBQUcsMEpBQTBKLENBQUM7O0lBRXRLLEdBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFNBQUEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQUFBRztRQUN6QyxHQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDdkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2hELE9BQU8sRUFBRSxDQUFDO0tBQ2IsQ0FBQyxDQUFDOztJQUVILElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ25CLEdBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFBLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUE7YUFDdkMsRUFBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUE7S0FDbkM7O0lBRUQsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7O0FDcGNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzs7SUFFcEYsR0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hELE9BQU8sU0FBUyxDQUFDOztDQUVwQjs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxHQUFHLEVBQUU7SUFDdEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7O0lBRXBCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7UUFDWixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDTixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ04sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUNOLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzt3QkFDTixDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7O0lBRTFDLE9BQU8sS0FBSyxHQUFHLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXG4gKiBDb3B5cmlnaHQgKEMpIDIwMDggQXBwbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zXG4gKiBhcmUgbWV0OlxuICogMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gKiAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgQVBQTEUgSU5DLiBgYEFTIElTJycgQU5EIEFOWVxuICogRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAqIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUlxuICogUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC4gIElOIE5PIEVWRU5UIFNIQUxMIEFQUExFIElOQy4gT1JcbiAqIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLFxuICogRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLFxuICogUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZXG4gKiBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqXG4gKiBQb3J0ZWQgZnJvbSBXZWJraXRcbiAqIGh0dHA6Ly9zdm4ud2Via2l0Lm9yZy9yZXBvc2l0b3J5L3dlYmtpdC90cnVuay9Tb3VyY2UvV2ViQ29yZS9wbGF0Zm9ybS9ncmFwaGljcy9Vbml0QmV6aWVyLmhcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXRCZXppZXI7XG5cbmZ1bmN0aW9uIFVuaXRCZXppZXIocDF4LCBwMXksIHAyeCwgcDJ5KSB7XG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBwb2x5bm9taWFsIGNvZWZmaWNpZW50cywgaW1wbGljaXQgZmlyc3QgYW5kIGxhc3QgY29udHJvbCBwb2ludHMgYXJlICgwLDApIGFuZCAoMSwxKS5cbiAgICB0aGlzLmN4ID0gMy4wICogcDF4O1xuICAgIHRoaXMuYnggPSAzLjAgKiAocDJ4IC0gcDF4KSAtIHRoaXMuY3g7XG4gICAgdGhpcy5heCA9IDEuMCAtIHRoaXMuY3ggLSB0aGlzLmJ4O1xuXG4gICAgdGhpcy5jeSA9IDMuMCAqIHAxeTtcbiAgICB0aGlzLmJ5ID0gMy4wICogKHAyeSAtIHAxeSkgLSB0aGlzLmN5O1xuICAgIHRoaXMuYXkgPSAxLjAgLSB0aGlzLmN5IC0gdGhpcy5ieTtcblxuICAgIHRoaXMucDF4ID0gcDF4O1xuICAgIHRoaXMucDF5ID0gcDJ5O1xuICAgIHRoaXMucDJ4ID0gcDJ4O1xuICAgIHRoaXMucDJ5ID0gcDJ5O1xufVxuXG5Vbml0QmV6aWVyLnByb3RvdHlwZS5zYW1wbGVDdXJ2ZVggPSBmdW5jdGlvbih0KSB7XG4gICAgLy8gYGF4IHReMyArIGJ4IHReMiArIGN4IHQnIGV4cGFuZGVkIHVzaW5nIEhvcm5lcidzIHJ1bGUuXG4gICAgcmV0dXJuICgodGhpcy5heCAqIHQgKyB0aGlzLmJ4KSAqIHQgKyB0aGlzLmN4KSAqIHQ7XG59O1xuXG5Vbml0QmV6aWVyLnByb3RvdHlwZS5zYW1wbGVDdXJ2ZVkgPSBmdW5jdGlvbih0KSB7XG4gICAgcmV0dXJuICgodGhpcy5heSAqIHQgKyB0aGlzLmJ5KSAqIHQgKyB0aGlzLmN5KSAqIHQ7XG59O1xuXG5Vbml0QmV6aWVyLnByb3RvdHlwZS5zYW1wbGVDdXJ2ZURlcml2YXRpdmVYID0gZnVuY3Rpb24odCkge1xuICAgIHJldHVybiAoMy4wICogdGhpcy5heCAqIHQgKyAyLjAgKiB0aGlzLmJ4KSAqIHQgKyB0aGlzLmN4O1xufTtcblxuVW5pdEJlemllci5wcm90b3R5cGUuc29sdmVDdXJ2ZVggPSBmdW5jdGlvbih4LCBlcHNpbG9uKSB7XG4gICAgaWYgKHR5cGVvZiBlcHNpbG9uID09PSAndW5kZWZpbmVkJykgZXBzaWxvbiA9IDFlLTY7XG5cbiAgICB2YXIgdDAsIHQxLCB0MiwgeDIsIGk7XG5cbiAgICAvLyBGaXJzdCB0cnkgYSBmZXcgaXRlcmF0aW9ucyBvZiBOZXd0b24ncyBtZXRob2QgLS0gbm9ybWFsbHkgdmVyeSBmYXN0LlxuICAgIGZvciAodDIgPSB4LCBpID0gMDsgaSA8IDg7IGkrKykge1xuXG4gICAgICAgIHgyID0gdGhpcy5zYW1wbGVDdXJ2ZVgodDIpIC0geDtcbiAgICAgICAgaWYgKE1hdGguYWJzKHgyKSA8IGVwc2lsb24pIHJldHVybiB0MjtcblxuICAgICAgICB2YXIgZDIgPSB0aGlzLnNhbXBsZUN1cnZlRGVyaXZhdGl2ZVgodDIpO1xuICAgICAgICBpZiAoTWF0aC5hYnMoZDIpIDwgMWUtNikgYnJlYWs7XG5cbiAgICAgICAgdDIgPSB0MiAtIHgyIC8gZDI7XG4gICAgfVxuXG4gICAgLy8gRmFsbCBiYWNrIHRvIHRoZSBiaXNlY3Rpb24gbWV0aG9kIGZvciByZWxpYWJpbGl0eS5cbiAgICB0MCA9IDAuMDtcbiAgICB0MSA9IDEuMDtcbiAgICB0MiA9IHg7XG5cbiAgICBpZiAodDIgPCB0MCkgcmV0dXJuIHQwO1xuICAgIGlmICh0MiA+IHQxKSByZXR1cm4gdDE7XG5cbiAgICB3aGlsZSAodDAgPCB0MSkge1xuXG4gICAgICAgIHgyID0gdGhpcy5zYW1wbGVDdXJ2ZVgodDIpO1xuICAgICAgICBpZiAoTWF0aC5hYnMoeDIgLSB4KSA8IGVwc2lsb24pIHJldHVybiB0MjtcblxuICAgICAgICBpZiAoeCA+IHgyKSB7XG4gICAgICAgICAgICB0MCA9IHQyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdDEgPSB0MjtcbiAgICAgICAgfVxuXG4gICAgICAgIHQyID0gKHQxIC0gdDApICogMC41ICsgdDA7XG4gICAgfVxuXG4gICAgLy8gRmFpbHVyZS5cbiAgICByZXR1cm4gdDI7XG59O1xuXG5Vbml0QmV6aWVyLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHgsIGVwc2lsb24pIHtcbiAgICByZXR1cm4gdGhpcy5zYW1wbGVDdXJ2ZVkodGhpcy5zb2x2ZUN1cnZlWCh4LCBlcHNpbG9uKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gICAgICBcblxuLyoqXG4gKiBBIGNvb3JkaW5hdGUgaXMgYSBjb2x1bW4sIHJvdywgem9vbSBjb21iaW5hdGlvbiwgb2Z0ZW4gdXNlZFxuICogYXMgdGhlIGRhdGEgY29tcG9uZW50IG9mIGEgdGlsZS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gY29sdW1uXG4gKiBAcGFyYW0ge251bWJlcn0gcm93XG4gKiBAcGFyYW0ge251bWJlcn0gem9vbVxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgQ29vcmRpbmF0ZSB7XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIFxuICAgIGNvbnN0cnVjdG9yKGNvbHVtbiAgICAgICAgLCByb3cgICAgICAgICwgem9vbSAgICAgICAgKSB7XG4gICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgICAgICB0aGlzLnJvdyA9IHJvdztcbiAgICAgICAgdGhpcy56b29tID0gem9vbTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBjbG9uZSBvZiB0aGlzIGNvb3JkaW5hdGUgdGhhdCBjYW4gYmUgbXV0YXRlZCB3aXRob3V0XG4gICAgICogY2hhbmdpbmcgdGhlIG9yaWdpbmFsIGNvb3JkaW5hdGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtDb29yZGluYXRlfSBjbG9uZVxuICAgICAqIEBwcml2YXRlXG4gICAgICogdmFyIGNvb3JkID0gbmV3IENvb3JkaW5hdGUoMCwgMCwgMCk7XG4gICAgICogdmFyIGMyID0gY29vcmQuY2xvbmUoKTtcbiAgICAgKiAvLyBzaW5jZSBjb29yZCBpcyBjbG9uZWQsIG1vZGlmeWluZyBhIHByb3BlcnR5IG9mIGMyIGRvZXNcbiAgICAgKiAvLyBub3QgbW9kaWZ5IGl0LlxuICAgICAqIGMyLnpvb20gPSAyO1xuICAgICAqL1xuICAgIGNsb25lKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvb3JkaW5hdGUodGhpcy5jb2x1bW4sIHRoaXMucm93LCB0aGlzLnpvb20pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFpvb20gdGhpcyBjb29yZGluYXRlIHRvIGEgZ2l2ZW4gem9vbSBsZXZlbC4gVGhpcyByZXR1cm5zIGEgbmV3XG4gICAgICogY29vcmRpbmF0ZSBvYmplY3QsIG5vdCBtdXRhdGluZyB0aGUgb2xkIG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tXG4gICAgICogQHJldHVybnMge0Nvb3JkaW5hdGV9IHpvb21lZCBjb29yZGluYXRlXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHZhciBjb29yZCA9IG5ldyBDb29yZGluYXRlKDAsIDAsIDApO1xuICAgICAqIHZhciBjMiA9IGNvb3JkLnpvb21UbygxKTtcbiAgICAgKiBjMiAvLyBlcXVhbHMgbmV3IENvb3JkaW5hdGUoMCwgMCwgMSk7XG4gICAgICovXG4gICAgem9vbVRvKHpvb20gICAgICAgICkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl96b29tVG8oem9vbSk7IH1cblxuICAgIC8qKlxuICAgICAqIFN1YnRyYWN0IHRoZSBjb2x1bW4gYW5kIHJvdyB2YWx1ZXMgb2YgdGhpcyBjb29yZGluYXRlIGZyb20gdGhvc2VcbiAgICAgKiBvZiBhbm90aGVyIGNvb3JkaW5hdGUuIFRoZSBvdGhlciBjb29yZGluYXQgd2lsbCBiZSB6b29tZWQgdG8gdGhlXG4gICAgICogc2FtZSBsZXZlbCBhcyBgdGhpc2AgYmVmb3JlIHRoZSBzdWJ0cmFjdGlvbiBvY2N1cnNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q29vcmRpbmF0ZX0gYyBvdGhlciBjb29yZGluYXRlXG4gICAgICogQHJldHVybnMge0Nvb3JkaW5hdGV9IHJlc3VsdFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3ViKGMgICAgICAgICAgICApIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fc3ViKGMpOyB9XG5cbiAgICBfem9vbVRvKHpvb20gICAgICAgICkge1xuICAgICAgICBjb25zdCBzY2FsZSA9IE1hdGgucG93KDIsIHpvb20gLSB0aGlzLnpvb20pO1xuICAgICAgICB0aGlzLmNvbHVtbiAqPSBzY2FsZTtcbiAgICAgICAgdGhpcy5yb3cgKj0gc2NhbGU7XG4gICAgICAgIHRoaXMuem9vbSA9IHpvb207XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIF9zdWIoYyAgICAgICAgICAgICkge1xuICAgICAgICBjID0gYy56b29tVG8odGhpcy56b29tKTtcbiAgICAgICAgdGhpcy5jb2x1bW4gLT0gYy5jb2x1bW47XG4gICAgICAgIHRoaXMucm93IC09IGMucm93O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29vcmRpbmF0ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50LWVudiBicm93c2VyICovXG5tb2R1bGUuZXhwb3J0cyA9IHNlbGY7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFBvaW50ID0gcmVxdWlyZSgncG9pbnQtZ2VvbWV0cnknKTtcbmNvbnN0IHdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93Jyk7XG5cbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gKHRhZ05hbWUsIGNsYXNzTmFtZSwgY29udGFpbmVyKSB7XG4gICAgY29uc3QgZWwgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgaWYgKGNvbnRhaW5lcikgY29udGFpbmVyLmFwcGVuZENoaWxkKGVsKTtcbiAgICByZXR1cm4gZWw7XG59O1xuXG5jb25zdCBkb2NTdHlsZSA9IHdpbmRvdy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGU7XG5cbmZ1bmN0aW9uIHRlc3RQcm9wKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocHJvcHNbaV0gaW4gZG9jU3R5bGUpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvcHNbMF07XG59XG5cbmNvbnN0IHNlbGVjdFByb3AgPSB0ZXN0UHJvcChbJ3VzZXJTZWxlY3QnLCAnTW96VXNlclNlbGVjdCcsICdXZWJraXRVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKTtcbmxldCB1c2VyU2VsZWN0O1xuZXhwb3J0cy5kaXNhYmxlRHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2VsZWN0UHJvcCkge1xuICAgICAgICB1c2VyU2VsZWN0ID0gZG9jU3R5bGVbc2VsZWN0UHJvcF07XG4gICAgICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gJ25vbmUnO1xuICAgIH1cbn07XG5leHBvcnRzLmVuYWJsZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNlbGVjdFByb3ApIHtcbiAgICAgICAgZG9jU3R5bGVbc2VsZWN0UHJvcF0gPSB1c2VyU2VsZWN0O1xuICAgIH1cbn07XG5cbmNvbnN0IHRyYW5zZm9ybVByb3AgPSB0ZXN0UHJvcChbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nXSk7XG5leHBvcnRzLnNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uKGVsLCB2YWx1ZSkge1xuICAgIGVsLnN0eWxlW3RyYW5zZm9ybVByb3BdID0gdmFsdWU7XG59O1xuXG4vLyBTdXBwcmVzcyB0aGUgbmV4dCBjbGljaywgYnV0IG9ubHkgaWYgaXQncyBpbW1lZGlhdGUuXG5mdW5jdGlvbiBzdXBwcmVzc0NsaWNrKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdXBwcmVzc0NsaWNrLCB0cnVlKTtcbn1cbmV4cG9ydHMuc3VwcHJlc3NDbGljayA9IGZ1bmN0aW9uKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHN1cHByZXNzQ2xpY2ssIHRydWUpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VwcHJlc3NDbGljaywgdHJ1ZSk7XG4gICAgfSwgMCk7XG59O1xuXG5leHBvcnRzLm1vdXNlUG9zID0gZnVuY3Rpb24gKGVsLCBlKSB7XG4gICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGUgPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0gOiBlO1xuICAgIHJldHVybiBuZXcgUG9pbnQoXG4gICAgICAgIGUuY2xpZW50WCAtIHJlY3QubGVmdCAtIGVsLmNsaWVudExlZnQsXG4gICAgICAgIGUuY2xpZW50WSAtIHJlY3QudG9wIC0gZWwuY2xpZW50VG9wXG4gICAgKTtcbn07XG5cbmV4cG9ydHMudG91Y2hQb3MgPSBmdW5jdGlvbiAoZWwsIGUpIHtcbiAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIHBvaW50cyA9IFtdO1xuICAgIGNvbnN0IHRvdWNoZXMgPSAoZS50eXBlID09PSAndG91Y2hlbmQnKSA/IGUuY2hhbmdlZFRvdWNoZXMgOiBlLnRvdWNoZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBvaW50cy5wdXNoKG5ldyBQb2ludChcbiAgICAgICAgICAgIHRvdWNoZXNbaV0uY2xpZW50WCAtIHJlY3QubGVmdCAtIGVsLmNsaWVudExlZnQsXG4gICAgICAgICAgICB0b3VjaGVzW2ldLmNsaWVudFkgLSByZWN0LnRvcCAtIGVsLmNsaWVudFRvcFxuICAgICAgICApKTtcbiAgICB9XG4gICAgcmV0dXJuIHBvaW50cztcbn07XG5cbmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24obm9kZSkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG4vLyAgICAgIFxuXG5jb25zdCBVbml0QmV6aWVyID0gcmVxdWlyZSgnQG1hcGJveC91bml0YmV6aWVyJyk7XG5jb25zdCBDb29yZGluYXRlID0gcmVxdWlyZSgnLi4vZ2VvL2Nvb3JkaW5hdGUnKTtcbmNvbnN0IFBvaW50ID0gcmVxdWlyZSgncG9pbnQtZ2VvbWV0cnknKTtcblxuLyoqXG4gKiBHaXZlbiBhIHZhbHVlIGB0YCB0aGF0IHZhcmllcyBiZXR3ZWVuIDAgYW5kIDEsIHJldHVyblxuICogYW4gaW50ZXJwb2xhdGlvbiBmdW5jdGlvbiB0aGF0IGVhc2VzIGJldHdlZW4gMCBhbmQgMSBpbiBhIHBsZWFzaW5nXG4gKiBjdWJpYyBpbi1vdXQgZmFzaGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmVhc2VDdWJpY0luT3V0ID0gZnVuY3Rpb24odCAgICAgICAgKSAgICAgICAgIHtcbiAgICBpZiAodCA8PSAwKSByZXR1cm4gMDtcbiAgICBpZiAodCA+PSAxKSByZXR1cm4gMTtcbiAgICBjb25zdCB0MiA9IHQgKiB0LFxuICAgICAgICB0MyA9IHQyICogdDtcbiAgICByZXR1cm4gNCAqICh0IDwgMC41ID8gdDMgOiAzICogKHQgLSB0MikgKyB0MyAtIDAuNzUpO1xufTtcblxuLyoqXG4gKiBHaXZlbiBnaXZlbiAoeCwgeSksICh4MSwgeTEpIGNvbnRyb2wgcG9pbnRzIGZvciBhIGJlemllciBjdXJ2ZSxcbiAqIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgaW50ZXJwb2xhdGVzIGFsb25nIHRoYXQgY3VydmUuXG4gKlxuICogQHBhcmFtIHAxeCBjb250cm9sIHBvaW50IDEgeCBjb29yZGluYXRlXG4gKiBAcGFyYW0gcDF5IGNvbnRyb2wgcG9pbnQgMSB5IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSBwMnggY29udHJvbCBwb2ludCAyIHggY29vcmRpbmF0ZVxuICogQHBhcmFtIHAyeSBjb250cm9sIHBvaW50IDIgeSBjb29yZGluYXRlXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmJlemllciA9IGZ1bmN0aW9uKHAxeCAgICAgICAgLCBwMXkgICAgICAgICwgcDJ4ICAgICAgICAsIHAyeSAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICBjb25zdCBiZXppZXIgPSBuZXcgVW5pdEJlemllcihwMXgsIHAxeSwgcDJ4LCBwMnkpO1xuICAgIHJldHVybiBmdW5jdGlvbih0ICAgICAgICApIHtcbiAgICAgICAgcmV0dXJuIGJlemllci5zb2x2ZSh0KTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBBIGRlZmF1bHQgYmV6aWVyLWN1cnZlIHBvd2VyZWQgZWFzaW5nIGZ1bmN0aW9uIHdpdGhcbiAqIGNvbnRyb2wgcG9pbnRzICgwLjI1LCAwLjEpIGFuZCAoMC4yNSwgMSlcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmVhc2UgPSBleHBvcnRzLmJlemllcigwLjI1LCAwLjEsIDAuMjUsIDEpO1xuXG4vKipcbiAqIGNvbnN0cmFpbiBuIHRvIHRoZSBnaXZlbiByYW5nZSB2aWEgbWluICsgbWF4XG4gKlxuICogQHBhcmFtIG4gdmFsdWVcbiAqIEBwYXJhbSBtaW4gdGhlIG1pbmltdW0gdmFsdWUgdG8gYmUgcmV0dXJuZWRcbiAqIEBwYXJhbSBtYXggdGhlIG1heGltdW0gdmFsdWUgdG8gYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHRoZSBjbGFtcGVkIHZhbHVlXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmNsYW1wID0gZnVuY3Rpb24gKG4gICAgICAgICwgbWluICAgICAgICAsIG1heCAgICAgICAgKSAgICAgICAgIHtcbiAgICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIG4pKTtcbn07XG5cbi8qKlxuICogY29uc3RyYWluIG4gdG8gdGhlIGdpdmVuIHJhbmdlLCBleGNsdWRpbmcgdGhlIG1pbmltdW0sIHZpYSBtb2R1bGFyIGFyaXRobWV0aWNcbiAqXG4gKiBAcGFyYW0gbiB2YWx1ZVxuICogQHBhcmFtIG1pbiB0aGUgbWluaW11bSB2YWx1ZSB0byBiZSByZXR1cm5lZCwgZXhjbHVzaXZlXG4gKiBAcGFyYW0gbWF4IHRoZSBtYXhpbXVtIHZhbHVlIHRvIGJlIHJldHVybmVkLCBpbmNsdXNpdmVcbiAqIEByZXR1cm5zIGNvbnN0cmFpbmVkIG51bWJlclxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy53cmFwID0gZnVuY3Rpb24gKG4gICAgICAgICwgbWluICAgICAgICAsIG1heCAgICAgICAgKSAgICAgICAgIHtcbiAgICBjb25zdCBkID0gbWF4IC0gbWluO1xuICAgIGNvbnN0IHcgPSAoKG4gLSBtaW4pICUgZCArIGQpICUgZCArIG1pbjtcbiAgICByZXR1cm4gKHcgPT09IG1pbikgPyBtYXggOiB3O1xufTtcblxuLypcbiAqIENhbGwgYW4gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIG9uIGFuIGFycmF5IG9mIGFyZ3VtZW50cyxcbiAqIGNhbGxpbmcgYGNhbGxiYWNrYCB3aXRoIHRoZSBjb21wbGV0ZWQgcmVzdWx0cyBvZiBhbGwgY2FsbHMuXG4gKlxuICogQHBhcmFtIGFycmF5IGlucHV0IHRvIGVhY2ggY2FsbCBvZiB0aGUgYXN5bmMgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZm4gYW4gYXN5bmMgZnVuY3Rpb24gd2l0aCBzaWduYXR1cmUgKGRhdGEsIGNhbGxiYWNrKVxuICogQHBhcmFtIGNhbGxiYWNrIGEgY2FsbGJhY2sgcnVuIGFmdGVyIGFsbCBhc3luYyB3b3JrIGlzIGRvbmUuXG4gKiBjYWxsZWQgd2l0aCBhbiBhcnJheSwgY29udGFpbmluZyB0aGUgcmVzdWx0cyBvZiBlYWNoIGFzeW5jIGNhbGwuXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmFzeW5jQWxsID0gZnVuY3Rpb24gKGFycmF5ICAgICAgICAgICAgLCBmbiAgICAgICAgICAsIGNhbGxiYWNrICAgICAgICAgICkge1xuICAgIGlmICghYXJyYXkubGVuZ3RoKSB7IHJldHVybiBjYWxsYmFjayhudWxsLCBbXSk7IH1cbiAgICBsZXQgcmVtYWluaW5nID0gYXJyYXkubGVuZ3RoO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBuZXcgQXJyYXkoYXJyYXkubGVuZ3RoKTtcbiAgICBsZXQgZXJyb3IgPSBudWxsO1xuICAgIGFycmF5LmZvckVhY2goKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgZm4oaXRlbSwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSBlcnJvciA9IGVycjtcbiAgICAgICAgICAgIHJlc3VsdHNbaV0gPSByZXN1bHQ7XG4gICAgICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIGNhbGxiYWNrKGVycm9yLCByZXN1bHRzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKlxuICogUG9seWZpbGwgZm9yIE9iamVjdC52YWx1ZXMuIE5vdCBmdWxseSBzcGVjIGNvbXBsaWFudCwgYnV0IHdlIGRvbid0XG4gKiBuZWVkIGl0IHRvIGJlLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMudmFsdWVzID0gZnVuY3Rpb24gKG9iaiAgICAgICAgKSAgICAgICAgICAgICAgICB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICByZXN1bHQucHVzaChvYmpba10pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLypcbiAqIENvbXB1dGUgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUga2V5cyBpbiBvbmUgb2JqZWN0IGFuZCB0aGUga2V5c1xuICogaW4gYW5vdGhlciBvYmplY3QuXG4gKlxuICogQHJldHVybnMga2V5cyBkaWZmZXJlbmNlXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmtleXNEaWZmZXJlbmNlID0gZnVuY3Rpb24gKG9iaiAgICAgICAgLCBvdGhlciAgICAgICAgKSAgICAgICAgICAgICAgICB7XG4gICAgY29uc3QgZGlmZmVyZW5jZSA9IFtdO1xuICAgIGZvciAoY29uc3QgaSBpbiBvYmopIHtcbiAgICAgICAgaWYgKCEoaSBpbiBvdGhlcikpIHtcbiAgICAgICAgICAgIGRpZmZlcmVuY2UucHVzaChpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlmZmVyZW5jZTtcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBkZXN0aW5hdGlvbiBvYmplY3QgYW5kIG9wdGlvbmFsbHkgbWFueSBzb3VyY2Ugb2JqZWN0cyxcbiAqIGNvcHkgYWxsIHByb3BlcnRpZXMgZnJvbSB0aGUgc291cmNlIG9iamVjdHMgaW50byB0aGUgZGVzdGluYXRpb24uXG4gKiBUaGUgbGFzdCBzb3VyY2Ugb2JqZWN0IGdpdmVuIG92ZXJyaWRlcyBwcm9wZXJ0aWVzIGZyb20gcHJldmlvdXNcbiAqIHNvdXJjZSBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSBkZXN0IGRlc3RpbmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsuLi5PYmplY3R9IHNvdXJjZXMgc291cmNlcyBmcm9tIHdoaWNoIHByb3BlcnRpZXMgYXJlIHB1bGxlZFxuICogQHByaXZhdGVcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5leHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uIChkZXN0ICAgICAgICAsIHNvdXJjZTAgICAgICAgICwgc291cmNlMSAgICAgICAgICwgc291cmNlMiAgICAgICAgICkgICAgICAgICB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc3JjID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKGNvbnN0IGsgaW4gc3JjKSB7XG4gICAgICAgICAgICBkZXN0W2tdID0gc3JjW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufTtcblxuLyoqXG4gKiBHaXZlbiBhbiBvYmplY3QgYW5kIGEgbnVtYmVyIG9mIHByb3BlcnRpZXMgYXMgc3RyaW5ncywgcmV0dXJuIHZlcnNpb25cbiAqIG9mIHRoYXQgb2JqZWN0IHdpdGggb25seSB0aG9zZSBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSBzcmMgdGhlIG9iamVjdFxuICogQHBhcmFtIHByb3BlcnRpZXMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgY2hvc2VuXG4gKiB0byBhcHBlYXIgb24gdGhlIHJlc3VsdGluZyBvYmplY3QuXG4gKiBAcmV0dXJucyBvYmplY3Qgd2l0aCBsaW1pdGVkIHByb3BlcnRpZXMuXG4gKiBAZXhhbXBsZVxuICogdmFyIGZvbyA9IHsgbmFtZTogJ0NoYXJsaWUnLCBhZ2U6IDEwIH07XG4gKiB2YXIganVzdE5hbWUgPSBwaWNrKGZvbywgWyduYW1lJ10pO1xuICogLy8ganVzdE5hbWUgPSB7IG5hbWU6ICdDaGFybGllJyB9XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLnBpY2sgPSBmdW5jdGlvbiAoc3JjICAgICAgICAsIHByb3BlcnRpZXMgICAgICAgICAgICAgICApICAgICAgICAge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrID0gcHJvcGVydGllc1tpXTtcbiAgICAgICAgaWYgKGsgaW4gc3JjKSB7XG4gICAgICAgICAgICByZXN1bHRba10gPSBzcmNba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmxldCBpZCA9IDE7XG5cbi8qKlxuICogUmV0dXJuIGEgdW5pcXVlIG51bWVyaWMgaWQsIHN0YXJ0aW5nIGF0IDEgYW5kIGluY3JlbWVudGluZyB3aXRoXG4gKiBlYWNoIGNhbGwuXG4gKlxuICogQHJldHVybnMgdW5pcXVlIG51bWVyaWMgaWQuXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLnVuaXF1ZUlkID0gZnVuY3Rpb24gKCkgICAgICAgICB7XG4gICAgcmV0dXJuIGlkKys7XG59O1xuXG4vKipcbiAqIEdpdmVuIGFuIGFycmF5IG9mIG1lbWJlciBmdW5jdGlvbiBuYW1lcyBhcyBzdHJpbmdzLCByZXBsYWNlIGFsbCBvZiB0aGVtXG4gKiB3aXRoIGJvdW5kIHZlcnNpb25zIHRoYXQgd2lsbCBhbHdheXMgcmVmZXIgdG8gYGNvbnRleHRgIGFzIGB0aGlzYC4gVGhpc1xuICogaXMgdXNlZnVsIGZvciBjbGFzc2VzIHdoZXJlIG90aGVyd2lzZSBldmVudCBiaW5kaW5ncyB3b3VsZCByZWFzc2lnblxuICogYHRoaXNgIHRvIHRoZSBldmVudGVkIG9iamVjdCBvciBzb21lIG90aGVyIHZhbHVlOiB0aGlzIGxldHMgeW91IGVuc3VyZVxuICogdGhlIGB0aGlzYCB2YWx1ZSBhbHdheXMuXG4gKlxuICogQHBhcmFtIGZucyBsaXN0IG9mIG1lbWJlciBmdW5jdGlvbiBuYW1lc1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGNvbnRleHQgdmFsdWVcbiAqIEBleGFtcGxlXG4gKiBmdW5jdGlvbiBNeUNsYXNzKCkge1xuICogICBiaW5kQWxsKFsnb250aW1lciddLCB0aGlzKTtcbiAqICAgdGhpcy5uYW1lID0gJ1RvbSc7XG4gKiB9XG4gKiBNeUNsYXNzLnByb3RvdHlwZS5vbnRpbWVyID0gZnVuY3Rpb24oKSB7XG4gKiAgIGFsZXJ0KHRoaXMubmFtZSk7XG4gKiB9O1xuICogdmFyIG15Q2xhc3MgPSBuZXcgTXlDbGFzcygpO1xuICogc2V0VGltZW91dChteUNsYXNzLm9udGltZXIsIDEwMCk7XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmJpbmRBbGwgPSBmdW5jdGlvbihmbnMgICAgICAgICAgICAgICAsIGNvbnRleHQgICAgICAgICkgICAgICAge1xuICAgIGZucy5mb3JFYWNoKChmbikgPT4ge1xuICAgICAgICBpZiAoIWNvbnRleHRbZm5dKSB7IHJldHVybjsgfVxuICAgICAgICBjb250ZXh0W2ZuXSA9IGNvbnRleHRbZm5dLmJpbmQoY29udGV4dCk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEdpdmVuIGEgbGlzdCBvZiBjb29yZGluYXRlcywgZ2V0IHRoZWlyIGNlbnRlciBhcyBhIGNvb3JkaW5hdGUuXG4gKlxuICogQHJldHVybnMgY2VudGVycG9pbnRcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZ2V0Q29vcmRpbmF0ZXNDZW50ZXIgPSBmdW5jdGlvbihjb29yZHMgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICB7XG4gICAgbGV0IG1pblggPSBJbmZpbml0eTtcbiAgICBsZXQgbWluWSA9IEluZmluaXR5O1xuICAgIGxldCBtYXhYID0gLUluZmluaXR5O1xuICAgIGxldCBtYXhZID0gLUluZmluaXR5O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWluWCA9IE1hdGgubWluKG1pblgsIGNvb3Jkc1tpXS5jb2x1bW4pO1xuICAgICAgICBtaW5ZID0gTWF0aC5taW4obWluWSwgY29vcmRzW2ldLnJvdyk7XG4gICAgICAgIG1heFggPSBNYXRoLm1heChtYXhYLCBjb29yZHNbaV0uY29sdW1uKTtcbiAgICAgICAgbWF4WSA9IE1hdGgubWF4KG1heFksIGNvb3Jkc1tpXS5yb3cpO1xuICAgIH1cblxuICAgIGNvbnN0IGR4ID0gbWF4WCAtIG1pblg7XG4gICAgY29uc3QgZHkgPSBtYXhZIC0gbWluWTtcbiAgICBjb25zdCBkTWF4ID0gTWF0aC5tYXgoZHgsIGR5KTtcbiAgICBjb25zdCB6b29tID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigtTWF0aC5sb2coZE1heCkgLyBNYXRoLkxOMikpO1xuICAgIHJldHVybiBuZXcgQ29vcmRpbmF0ZSgobWluWCArIG1heFgpIC8gMiwgKG1pblkgKyBtYXhZKSAvIDIsIDApXG4gICAgICAgIC56b29tVG8oem9vbSk7XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHN0cmluZyBlbmRzIHdpdGggYSBwYXJ0aWN1bGFyIHN1YnN0cmluZ1xuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZW5kc1dpdGggPSBmdW5jdGlvbihzdHJpbmcgICAgICAgICwgc3VmZml4ICAgICAgICApICAgICAgICAgIHtcbiAgICByZXR1cm4gc3RyaW5nLmluZGV4T2Yoc3VmZml4LCBzdHJpbmcubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gb2JqZWN0IGJ5IG1hcHBpbmcgYWxsIHRoZSB2YWx1ZXMgb2YgYW4gZXhpc3Rpbmcgb2JqZWN0IHdoaWxlXG4gKiBwcmVzZXJ2aW5nIHRoZWlyIGtleXMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5tYXBPYmplY3QgPSBmdW5jdGlvbihpbnB1dCAgICAgICAgLCBpdGVyYXRvciAgICAgICAgICAsIGNvbnRleHQgICAgICAgICApICAgICAgICAge1xuICAgIGNvbnN0IG91dHB1dCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIGlucHV0KSB7XG4gICAgICAgIG91dHB1dFtrZXldID0gaXRlcmF0b3IuY2FsbChjb250ZXh0IHx8IHRoaXMsIGlucHV0W2tleV0sIGtleSwgaW5wdXQpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gb2JqZWN0IGJ5IGZpbHRlcmluZyBvdXQgdmFsdWVzIG9mIGFuIGV4aXN0aW5nIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmZpbHRlck9iamVjdCA9IGZ1bmN0aW9uKGlucHV0ICAgICAgICAsIGl0ZXJhdG9yICAgICAgICAgICwgY29udGV4dCAgICAgICAgICkgICAgICAgICB7XG4gICAgY29uc3Qgb3V0cHV0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gaW5wdXQpIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCB8fCB0aGlzLCBpbnB1dFtrZXldLCBrZXksIGlucHV0KSkge1xuICAgICAgICAgICAgb3V0cHV0W2tleV0gPSBpbnB1dFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIERlZXBseSBjb21wYXJlcyB0d28gb2JqZWN0IGxpdGVyYWxzLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZGVlcEVxdWFsID0gZnVuY3Rpb24oYSAgICAgICAgLCBiICAgICAgICApICAgICAgICAgIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYikgfHwgYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFleHBvcnRzLmRlZXBFcXVhbChhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIGEgIT09IG51bGwgJiYgYiAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoISh0eXBlb2YgYiA9PT0gJ29iamVjdCcpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhhKTtcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gYSkge1xuICAgICAgICAgICAgaWYgKCFleHBvcnRzLmRlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGEgPT09IGI7XG59O1xuXG4vKipcbiAqIERlZXBseSBjbG9uZXMgdHdvIG9iamVjdHMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5jbG9uZSA9IGZ1bmN0aW9uICAgKGlucHV0ICAgKSAgICB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5tYXAoZXhwb3J0cy5jbG9uZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnICYmIGlucHV0KSB7XG4gICAgICAgIHJldHVybiAoKGV4cG9ydHMubWFwT2JqZWN0KGlucHV0LCBleHBvcnRzLmNsb25lKSAgICAgKSAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdHdvIGFycmF5cyBoYXZlIGF0IGxlYXN0IG9uZSBjb21tb24gZWxlbWVudC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmFycmF5c0ludGVyc2VjdCA9IGZ1bmN0aW9uKGEgICAgICAgICAgICAsIGIgICAgICAgICAgICApICAgICAgICAgIHtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IGEubGVuZ3RoOyBsKyspIHtcbiAgICAgICAgaWYgKGIuaW5kZXhPZihhW2xdKSA+PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBQcmludCBhIHdhcm5pbmcgbWVzc2FnZSB0byB0aGUgY29uc29sZSBhbmQgZW5zdXJlIGR1cGxpY2F0ZSB3YXJuaW5nIG1lc3NhZ2VzXG4gKiBhcmUgbm90IHByaW50ZWQuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuY29uc3Qgd2Fybk9uY2VIaXN0b3J5ID0ge307XG5leHBvcnRzLndhcm5PbmNlID0gZnVuY3Rpb24obWVzc2FnZSAgICAgICAgKSAgICAgICB7XG4gICAgaWYgKCF3YXJuT25jZUhpc3RvcnlbbWVzc2FnZV0pIHtcbiAgICAgICAgLy8gY29uc29sZSBpc24ndCBkZWZpbmVkIGluIHNvbWUgV2ViV29ya2Vycywgc2VlICMyNTU4XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIikgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICB3YXJuT25jZUhpc3RvcnlbbWVzc2FnZV0gPSB0cnVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW5kaWNhdGVzIGlmIHRoZSBwcm92aWRlZCBQb2ludHMgYXJlIGluIGEgY291bnRlciBjbG9ja3dpc2UgKHRydWUpIG9yIGNsb2Nrd2lzZSAoZmFsc2UpIG9yZGVyXG4gKlxuICogQHJldHVybnMgdHJ1ZSBmb3IgYSBjb3VudGVyIGNsb2Nrd2lzZSBzZXQgb2YgcG9pbnRzXG4gKi9cbi8vIGh0dHA6Ly9icnljZWJvZS5jb20vMjAwNi8xMC8yMy9saW5lLXNlZ21lbnQtaW50ZXJzZWN0aW9uLWFsZ29yaXRobS9cbmV4cG9ydHMuaXNDb3VudGVyQ2xvY2t3aXNlID0gZnVuY3Rpb24oYSAgICAgICAsIGIgICAgICAgLCBjICAgICAgICkgICAgICAgICAge1xuICAgIHJldHVybiAoYy55IC0gYS55KSAqIChiLnggLSBhLngpID4gKGIueSAtIGEueSkgKiAoYy54IC0gYS54KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2lnbmVkIGFyZWEgZm9yIHRoZSBwb2x5Z29uIHJpbmcuICBQb3N0aXZlIGFyZWFzIGFyZSBleHRlcmlvciByaW5ncyBhbmRcbiAqIGhhdmUgYSBjbG9ja3dpc2Ugd2luZGluZy4gIE5lZ2F0aXZlIGFyZWFzIGFyZSBpbnRlcmlvciByaW5ncyBhbmQgaGF2ZSBhIGNvdW50ZXIgY2xvY2t3aXNlXG4gKiBvcmRlcmluZy5cbiAqXG4gKiBAcGFyYW0gcmluZyBFeHRlcmlvciBvciBpbnRlcmlvciByaW5nXG4gKi9cbmV4cG9ydHMuY2FsY3VsYXRlU2lnbmVkQXJlYSA9IGZ1bmN0aW9uKHJpbmcgICAgICAgICAgICAgICkgICAgICAgICB7XG4gICAgbGV0IHN1bSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHJpbmcubGVuZ3RoLCBqID0gbGVuIC0gMSwgcDEsIHAyOyBpIDwgbGVuOyBqID0gaSsrKSB7XG4gICAgICAgIHAxID0gcmluZ1tpXTtcbiAgICAgICAgcDIgPSByaW5nW2pdO1xuICAgICAgICBzdW0gKz0gKHAyLnggLSBwMS54KSAqIChwMS55ICsgcDIueSk7XG4gICAgfVxuICAgIHJldHVybiBzdW07XG59O1xuXG4vKipcbiAqIERldGVjdHMgY2xvc2VkIHBvbHlnb25zLCBmaXJzdCArIGxhc3QgcG9pbnQgYXJlIGVxdWFsXG4gKlxuICogQHBhcmFtIHBvaW50cyBhcnJheSBvZiBwb2ludHNcbiAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgcG9pbnRzIGFyZSBhIGNsb3NlZCBwb2x5Z29uXG4gKi9cbmV4cG9ydHMuaXNDbG9zZWRQb2x5Z29uID0gZnVuY3Rpb24ocG9pbnRzICAgICAgICAgICAgICApICAgICAgICAgIHtcbiAgICAvLyBJZiBpdCBpcyAyIHBvaW50cyB0aGF0IGFyZSB0aGUgc2FtZSB0aGVuIGl0IGlzIGEgcG9pbnRcbiAgICAvLyBJZiBpdCBpcyAzIHBvaW50cyB3aXRoIHN0YXJ0IGFuZCBlbmQgdGhlIHNhbWUgdGhlbiBpdCBpcyBhIGxpbmVcbiAgICBpZiAocG9pbnRzLmxlbmd0aCA8IDQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IHAxID0gcG9pbnRzWzBdO1xuICAgIGNvbnN0IHAyID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXTtcblxuICAgIGlmIChNYXRoLmFicyhwMS54IC0gcDIueCkgPiAwIHx8XG4gICAgICAgIE1hdGguYWJzKHAxLnkgLSBwMi55KSA+IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIHBvbHlnb24gc2ltcGxpZmljYXRpb24gY2FuIHByb2R1Y2UgcG9seWdvbnMgd2l0aCB6ZXJvIGFyZWEgYW5kIG1vcmUgdGhhbiAzIHBvaW50c1xuICAgIHJldHVybiAoTWF0aC5hYnMoZXhwb3J0cy5jYWxjdWxhdGVTaWduZWRBcmVhKHBvaW50cykpID4gMC4wMSk7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHNwaGVyaWNhbCBjb29yZGluYXRlcyB0byBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMuXG4gKlxuICogQHBhcmFtIHNwaGVyaWNhbCBTcGhlcmljYWwgY29vcmRpbmF0ZXMsIGluIFtyYWRpYWwsIGF6aW11dGhhbCwgcG9sYXJdXG4gKiBAcmV0dXJuIGNhcnRlc2lhbiBjb29yZGluYXRlcyBpbiBbeCwgeSwgel1cbiAqL1xuXG5leHBvcnRzLnNwaGVyaWNhbFRvQ2FydGVzaWFuID0gZnVuY3Rpb24oc3BoZXJpY2FsICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICB7XG4gICAgY29uc3QgciA9IHNwaGVyaWNhbFswXTtcbiAgICBsZXQgYXppbXV0aGFsID0gc3BoZXJpY2FsWzFdLFxuICAgICAgICBwb2xhciA9IHNwaGVyaWNhbFsyXTtcbiAgICAvLyBXZSBhYnN0cmFjdCBcIm5vcnRoXCIvXCJ1cFwiIChjb21wYXNzLXdpc2UpIHRvIGJlIDDCsCB3aGVuIHJlYWxseSB0aGlzIGlzIDkwwrAgKM+ALzIpOlxuICAgIC8vIGNvcnJlY3QgZm9yIHRoYXQgaGVyZVxuICAgIGF6aW11dGhhbCArPSA5MDtcblxuICAgIC8vIENvbnZlcnQgYXppbXV0aGFsIGFuZCBwb2xhciBhbmdsZXMgdG8gcmFkaWFuc1xuICAgIGF6aW11dGhhbCAqPSBNYXRoLlBJIC8gMTgwO1xuICAgIHBvbGFyICo9IE1hdGguUEkgLyAxODA7XG5cbiAgICAvLyBzcGhlcmljYWwgdG8gY2FydGVzaWFuICh4LCB5LCB6KVxuICAgIHJldHVybiBbXG4gICAgICAgIHIgKiBNYXRoLmNvcyhhemltdXRoYWwpICogTWF0aC5zaW4ocG9sYXIpLFxuICAgICAgICByICogTWF0aC5zaW4oYXppbXV0aGFsKSAqIE1hdGguc2luKHBvbGFyKSxcbiAgICAgICAgciAqIE1hdGguY29zKHBvbGFyKVxuICAgIF07XG59O1xuXG4vKipcbiAqIFBhcnNlcyBkYXRhIGZyb20gJ0NhY2hlLUNvbnRyb2wnIGhlYWRlcnMuXG4gKlxuICogQHBhcmFtIGNhY2hlQ29udHJvbCBWYWx1ZSBvZiAnQ2FjaGUtQ29udHJvbCcgaGVhZGVyXG4gKiBAcmV0dXJuIG9iamVjdCBjb250YWluaW5nIHBhcnNlZCBoZWFkZXIgaW5mby5cbiAqL1xuXG5leHBvcnRzLnBhcnNlQ2FjaGVDb250cm9sID0gZnVuY3Rpb24oY2FjaGVDb250cm9sICAgICAgICApICAgICAgICAge1xuICAgIC8vIFRha2VuIGZyb20gW1dyZWNrXShodHRwczovL2dpdGh1Yi5jb20vaGFwaWpzL3dyZWNrKVxuICAgIGNvbnN0IHJlID0gLyg/Ol58KD86XFxzKlxcLFxccyopKShbXlxceDAwLVxceDIwXFwoXFwpPD5AXFwsO1xcOlxcXFxcIlxcL1xcW1xcXVxcP1xcPVxce1xcfVxceDdGXSspKD86XFw9KD86KFteXFx4MDAtXFx4MjBcXChcXCk8PkBcXCw7XFw6XFxcXFwiXFwvXFxbXFxdXFw/XFw9XFx7XFx9XFx4N0ZdKyl8KD86XFxcIigoPzpbXlwiXFxcXF18XFxcXC4pKilcXFwiKSkpPy9nO1xuXG4gICAgY29uc3QgaGVhZGVyID0ge307XG4gICAgY2FjaGVDb250cm9sLnJlcGxhY2UocmUsICgkMCwgJDEsICQyLCAkMykgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9ICQyIHx8ICQzO1xuICAgICAgICBoZWFkZXJbJDFdID0gdmFsdWUgPyB2YWx1ZS50b0xvd2VyQ2FzZSgpIDogdHJ1ZTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0pO1xuXG4gICAgaWYgKGhlYWRlclsnbWF4LWFnZSddKSB7XG4gICAgICAgIGNvbnN0IG1heEFnZSA9IHBhcnNlSW50KGhlYWRlclsnbWF4LWFnZSddLCAxMCk7XG4gICAgICAgIGlmIChpc05hTihtYXhBZ2UpKSBkZWxldGUgaGVhZGVyWydtYXgtYWdlJ107XG4gICAgICAgIGVsc2UgaGVhZGVyWydtYXgtYWdlJ10gPSBtYXhBZ2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhlYWRlcjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7XG5cbmZ1bmN0aW9uIFBvaW50KHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG59XG5cblBvaW50LnByb3RvdHlwZSA9IHtcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpOyB9LFxuXG4gICAgYWRkOiAgICAgZnVuY3Rpb24ocCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9hZGQocCk7ICAgICB9LFxuICAgIHN1YjogICAgIGZ1bmN0aW9uKHApIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fc3ViKHApOyAgICAgfSxcbiAgICBtdWx0OiAgICBmdW5jdGlvbihrKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX211bHQoayk7ICAgIH0sXG4gICAgZGl2OiAgICAgZnVuY3Rpb24oaykgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9kaXYoayk7ICAgICB9LFxuICAgIHJvdGF0ZTogIGZ1bmN0aW9uKGEpIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fcm90YXRlKGEpOyAgfSxcbiAgICBtYXRNdWx0OiBmdW5jdGlvbihtKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX21hdE11bHQobSk7IH0sXG4gICAgdW5pdDogICAgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3VuaXQoKTsgfSxcbiAgICBwZXJwOiAgICBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fcGVycCgpOyB9LFxuICAgIHJvdW5kOiAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9yb3VuZCgpOyB9LFxuXG4gICAgbWFnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xuICAgIH0sXG5cbiAgICBlcXVhbHM6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMueCA9PT0gcC54ICYmXG4gICAgICAgICAgICAgICB0aGlzLnkgPT09IHAueTtcbiAgICB9LFxuXG4gICAgZGlzdDogZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdFNxcihwKSk7XG4gICAgfSxcblxuICAgIGRpc3RTcXI6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdmFyIGR4ID0gcC54IC0gdGhpcy54LFxuICAgICAgICAgICAgZHkgPSBwLnkgLSB0aGlzLnk7XG4gICAgICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICB9LFxuXG4gICAgYW5nbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnksIHRoaXMueCk7XG4gICAgfSxcblxuICAgIGFuZ2xlVG86IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55IC0gYi55LCB0aGlzLnggLSBiLngpO1xuICAgIH0sXG5cbiAgICBhbmdsZVdpdGg6IGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5nbGVXaXRoU2VwKGIueCwgYi55KTtcbiAgICB9LFxuXG4gICAgLy8gRmluZCB0aGUgYW5nbGUgb2YgdGhlIHR3byB2ZWN0b3JzLCBzb2x2aW5nIHRoZSBmb3JtdWxhIGZvciB0aGUgY3Jvc3MgcHJvZHVjdCBhIHggYiA9IHxhfHxifHNpbijOuCkgZm9yIM64LlxuICAgIGFuZ2xlV2l0aFNlcDogZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMihcbiAgICAgICAgICAgIHRoaXMueCAqIHkgLSB0aGlzLnkgKiB4LFxuICAgICAgICAgICAgdGhpcy54ICogeCArIHRoaXMueSAqIHkpO1xuICAgIH0sXG5cbiAgICBfbWF0TXVsdDogZnVuY3Rpb24obSkge1xuICAgICAgICB2YXIgeCA9IG1bMF0gKiB0aGlzLnggKyBtWzFdICogdGhpcy55LFxuICAgICAgICAgICAgeSA9IG1bMl0gKiB0aGlzLnggKyBtWzNdICogdGhpcy55O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2FkZDogZnVuY3Rpb24ocCkge1xuICAgICAgICB0aGlzLnggKz0gcC54O1xuICAgICAgICB0aGlzLnkgKz0gcC55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3N1YjogZnVuY3Rpb24ocCkge1xuICAgICAgICB0aGlzLnggLT0gcC54O1xuICAgICAgICB0aGlzLnkgLT0gcC55O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX211bHQ6IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgdGhpcy54ICo9IGs7XG4gICAgICAgIHRoaXMueSAqPSBrO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2RpdjogZnVuY3Rpb24oaykge1xuICAgICAgICB0aGlzLnggLz0gaztcbiAgICAgICAgdGhpcy55IC89IGs7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfdW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2Rpdih0aGlzLm1hZygpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9wZXJwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgICAgIHRoaXMueSA9IHRoaXMueDtcbiAgICAgICAgdGhpcy54ID0gLXk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfcm90YXRlOiBmdW5jdGlvbihhbmdsZSkge1xuICAgICAgICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpLFxuICAgICAgICAgICAgc2luID0gTWF0aC5zaW4oYW5nbGUpLFxuICAgICAgICAgICAgeCA9IGNvcyAqIHRoaXMueCAtIHNpbiAqIHRoaXMueSxcbiAgICAgICAgICAgIHkgPSBzaW4gKiB0aGlzLnggKyBjb3MgKiB0aGlzLnk7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfcm91bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKHRoaXMueCk7XG4gICAgICAgIHRoaXMueSA9IE1hdGgucm91bmQodGhpcy55KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuLy8gY29uc3RydWN0cyBQb2ludCBmcm9tIGFuIGFycmF5IGlmIG5lY2Vzc2FyeVxuUG9pbnQuY29udmVydCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBQb2ludCkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChhWzBdLCBhWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG59O1xuIiwiLy9hZGFwdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9tYXBib3gtZ2wtanMvYmxvYi8wNjFmZGI1MTRhMzNjZjliMmI1NDJhMWM3YmQ0MzNjMTY2ZGE5MTdlL3NyYy91aS9jb250cm9sL3NjYWxlX2NvbnRyb2wuanMjTDE5LUw1MlxuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IERPTSA9IHJlcXVpcmUoJ21hcGJveC1nbC9zcmMvdXRpbC9kb20nKTtcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCdtYXBib3gtZ2wvc3JjL3V0aWwvdXRpbCcpO1xuXG4vKipcbiAqIEEgYFNjYWxlQ29udHJvbGAgY29udHJvbCBkaXNwbGF5cyB0aGUgcmF0aW8gb2YgYSBkaXN0YW5jZSBvbiB0aGUgbWFwIHRvIHRoZSBjb3JyZXNwb25kaW5nIGRpc3RhbmNlIG9uIHRoZSBncm91bmQuXG4gKlxuICogQGltcGxlbWVudHMge0lDb250cm9sfVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdpZHRoPScxNTAnXSBUaGUgbWF4aW11bSBsZW5ndGggb2YgdGhlIHNjYWxlIGNvbnRyb2wgaW4gcGl4ZWxzLlxuICogQGV4YW1wbGVcbiAqIG1hcC5hZGRDb250cm9sKG5ldyBTY2FsZUNvbnRyb2woe1xuICogICAgIG1heFdpZHRoOiA4MFxuICogfSkpO1xuICovXG4gY2xhc3MgRHVhbFNjYWxlQ29udHJvbCB7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAgICAgdXRpbC5iaW5kQWxsKFtcbiAgICAgICAgICAgICdfb25Nb3ZlJywgJ19vbk1vdXNlTW92ZSdcbiAgICAgICAgXSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0RGVmYXVsdFBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2JvdHRvbS1sZWZ0JztcbiAgICB9XG5cbiAgICBfb25Nb3ZlKCkge1xuICAgICAgICB1cGRhdGVTY2FsZSh0aGlzLl9tYXAsIHRoaXMuX21ldHJpY0NvbnRhaW5lciwgdGhpcy5faW1wZXJpYWxDb250YWluZXIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgX29uTW91c2VNb3ZlKGUpIHtcbiAgICAgICAgdXBkYXRlUG9zaXRpb24odGhpcy5fbWFwLCB0aGlzLl9wb3NpdGlvbkNvbnRhaW5lciwgZS5sbmdMYXQpO1xuICAgIH1cblxuICAgIG9uQWRkKG1hcCkge1xuICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXBib3hnbC1jdHJsIG1hcGJveGdsLWN0cmwtc2NhbGUgbWFwaHVicy1jdHJsLXNjYWxlJywgbWFwLmdldENvbnRhaW5lcigpKTtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25Db250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwLXBvc2l0aW9uJywgdGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fbWV0cmljQ29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21ldHJpYy1zY2FsZScsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX2ltcGVyaWFsQ29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ2ltcGVyaWFsLXNjYWxlJywgdGhpcy5fY29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLl9tYXAub24oJ21vdmUnLCB0aGlzLl9vbk1vdmUpO1xuICAgICAgICB0aGlzLl9vbk1vdmUoKTtcblxuICAgICAgICB0aGlzLl9tYXAub24oJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICAgICAgLy90aGlzLl9vbk1vdXNlTW92ZSh0aGlzLl9tYXAuZ2V0Q2VudGVyKCkpOyAvL3N0YXJ0IGF0IGNlbnRlclxuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgfVxuXG4gICAgb25SZW1vdmUoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX21hcC5vZmYoJ21vdmUnLCB0aGlzLl9vbk1vdmUpO1xuICAgICAgICB0aGlzLl9tYXAub2ZmKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgICAgIHRoaXMuX21hcCA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRHVhbFNjYWxlQ29udHJvbDtcblxuXG5mdW5jdGlvbiB1cGRhdGVQb3NpdGlvbihtYXAsIGNvbnRhaW5lciwgbG5nTGF0KSB7XG4gIGNvbnN0IGxhdCA9IGxuZ0xhdC5sYXQudG9QcmVjaXNpb24oNCk7XG4gIGNvbnN0IGxuZyA9IGxuZ0xhdC5sbmcudG9QcmVjaXNpb24oNCk7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgJHtsYXR9LCAke2xuZ31gO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTY2FsZShtYXAsIG1ldHJpY0NvbnRhaW5lciwgaW1wZXJpYWxDb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAvLyBBIGhvcml6b250YWwgc2NhbGUgaXMgaW1hZ2luZWQgdG8gYmUgcHJlc2VudCBhdCBjZW50ZXIgb2YgdGhlIG1hcFxuICAgIC8vIGNvbnRhaW5lciB3aXRoIG1heGltdW0gbGVuZ3RoIChEZWZhdWx0KSBhcyAxMDBweC5cbiAgICAvLyBVc2luZyBzcGhlcmljYWwgbGF3IG9mIGNvc2luZXMgYXBwcm94aW1hdGlvbiwgdGhlIHJlYWwgZGlzdGFuY2UgaXNcbiAgICAvLyBmb3VuZCBiZXR3ZWVuIHRoZSB0d28gY29vcmRpbmF0ZXMuXG4gICAgdmFyIG1heFdpZHRoID0gb3B0aW9ucyAmJiBvcHRpb25zLm1heFdpZHRoIHx8IDEwMDtcblxuICAgIHZhciB5ID0gbWFwLl9jb250YWluZXIuY2xpZW50SGVpZ2h0IC8gMjtcbiAgICB2YXIgbWF4TWV0ZXJzID0gZ2V0RGlzdGFuY2UobWFwLnVucHJvamVjdChbMCwgeV0pLCBtYXAudW5wcm9qZWN0KFttYXhXaWR0aCwgeV0pKTtcbiAgICAvLyBUaGUgcmVhbCBkaXN0YW5jZSBjb3JyZXNwb25kaW5nIHRvIDEwMHB4IHNjYWxlIGxlbmd0aCBpcyByb3VuZGVkIG9mZiB0b1xuICAgIC8vIG5lYXIgcHJldHR5IG51bWJlciBhbmQgdGhlIHNjYWxlIGxlbmd0aCBmb3IgdGhlIHNhbWUgaXMgZm91bmQgb3V0LlxuICAgIC8vIERlZmF1bHQgdW5pdCBvZiB0aGUgc2NhbGUgaXMgYmFzZWQgb24gVXNlcidzIGxvY2FsZS5cbiAgICB2YXIgbWF4WWFyZHMgPSAxLjA5MzYxICogbWF4TWV0ZXJzO1xuICAgIGlmIChtYXhZYXJkcyA+IDQ0MCkge1xuICAgICAgICB2YXIgbWF4TWlsZXMgPSBtYXhZYXJkcyAvIDE3NjA7XG4gICAgICAgIHNldFNjYWxlKGltcGVyaWFsQ29udGFpbmVyLCBtYXhXaWR0aCwgbWF4TWlsZXMsICdtaScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFNjYWxlKGltcGVyaWFsQ29udGFpbmVyLCBtYXhXaWR0aCwgbWF4WWFyZHMsICd5ZCcpO1xuICAgIH1cbiAgICBzZXRTY2FsZShtZXRyaWNDb250YWluZXIsIG1heFdpZHRoLCBtYXhNZXRlcnMsICdtJyk7XG5cbn1cblxuZnVuY3Rpb24gc2V0U2NhbGUoY29udGFpbmVyLCBtYXhXaWR0aCwgbWF4RGlzdGFuY2UsIHVuaXQpIHtcbiAgICBsZXQgZGlzdGFuY2UgPSBnZXRSb3VuZE51bShtYXhEaXN0YW5jZSk7XG4gICAgY29uc3QgcmF0aW8gPSBkaXN0YW5jZSAvIG1heERpc3RhbmNlO1xuXG4gICAgaWYgKHVuaXQgPT09ICdtJyAmJiBkaXN0YW5jZSA+PSAxMDAwKSB7XG4gICAgICAgIGRpc3RhbmNlID0gZGlzdGFuY2UgLyAxMDAwO1xuICAgICAgICB1bml0ID0gJ2ttJztcbiAgICB9XG5cbiAgICBjb250YWluZXIuc3R5bGUud2lkdGggPSBgJHttYXhXaWR0aCAqIHJhdGlvfXB4YDtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gZGlzdGFuY2UgKyB1bml0O1xufVxuXG5mdW5jdGlvbiBnZXREaXN0YW5jZShsYXRsbmcxLCBsYXRsbmcyKSB7XG4gICAgLy8gVXNlcyBzcGhlcmljYWwgbGF3IG9mIGNvc2luZXMgYXBwcm94aW1hdGlvbi5cbiAgICBjb25zdCBSID0gNjM3MTAwMDtcblxuICAgIGNvbnN0IHJhZCA9IE1hdGguUEkgLyAxODAsXG4gICAgICAgIGxhdDEgPSBsYXRsbmcxLmxhdCAqIHJhZCxcbiAgICAgICAgbGF0MiA9IGxhdGxuZzIubGF0ICogcmFkLFxuICAgICAgICBhID0gTWF0aC5zaW4obGF0MSkgKiBNYXRoLnNpbihsYXQyKSArXG4gICAgICAgICAgTWF0aC5jb3MobGF0MSkgKiBNYXRoLmNvcyhsYXQyKSAqIE1hdGguY29zKChsYXRsbmcyLmxuZyAtIGxhdGxuZzEubG5nKSAqIHJhZCk7XG5cbiAgICBjb25zdCBtYXhNZXRlcnMgPSBSICogTWF0aC5hY29zKE1hdGgubWluKGEsIDEpKTtcbiAgICByZXR1cm4gbWF4TWV0ZXJzO1xuXG59XG5cbmZ1bmN0aW9uIGdldFJvdW5kTnVtKG51bSkge1xuICAgIHZhciBwb3cxMCA9IE1hdGgucG93KDEwLCAoKFwiXCIgKyAoTWF0aC5mbG9vcihudW0pKSkpLmxlbmd0aCAtIDEpO1xuICAgIHZhciBkID0gbnVtIC8gcG93MTA7XG5cbiAgICBkID0gZCA+PSAxMCA/IDEwIDpcbiAgICAgICAgZCA+PSA1ID8gNSA6XG4gICAgICAgICAgICBkID49IDMgPyAzIDpcbiAgICAgICAgICAgICAgICBkID49IDIgPyAyIDpcbiAgICAgICAgICAgICAgICAgICAgZCA+PSAxID8gMSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBkID49IDAuNSA/IDAuNSA6IDAuMjU7XG5cbiAgICByZXR1cm4gcG93MTAgKiBkO1xufSJdfQ==
