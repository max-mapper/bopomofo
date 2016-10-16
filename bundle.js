(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (Buffer){
var _templateObject = _taggedTemplateLiteral(['\n    <div>\n      <img src=', '></img>\n      <ul>\n        <li>', '</li>\n        <li>', '</li>\n        <li>', '</li>\n        <li class="comment">', '</li>\n      </ul>\n    </div>\n  '], ['\n    <div>\n      <img src=', '></img>\n      <ul>\n        <li>', '</li>\n        <li>', '</li>\n        <li>', '</li>\n        <li class="comment">', '</li>\n      </ul>\n    </div>\n  ']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var yo = require('yo-yo');
var hundred = require('./one-hundred-common.json');
var svgs = require('./one-hundred-svgs.json');
var current;
var interval;
var content = document.querySelector('.content');

render(0);

function render(num) {
  current = num;
  var code = hundred[current][1].charCodeAt(0);
  var str = svgs[current];
  str = str.replace('<svg ', '<svg foo="' + Date.now() + '" '); // force re-animation
  var b64 = "data:image/svg+xml;base64," + new Buffer(str).toString('base64');
  var html = yo(_templateObject, b64, hundred[current][1], hundred[current][3], hundred[current][4], hundred[current][6]);
  yo.update(content, html);
  clearInterval(interval);
  interval = setInterval(function () {
    render(current);
  }, 7000);
}

document.body.addEventListener('keypress', checkInput);
document.body.addEventListener('paste', checkInput);

function checkInput() {
  setTimeout(function () {
    var val = document.querySelector('input').value.trim()[0];
    var curchar = hundred[current][1];
    if (val === curchar) {
      document.querySelector('input').value = '';
      var next = current + 1;
      if (hundred[next] === undefined) next = 0;
      render(next);
    }
  }, 0);
}

window.render = render;
}).call(this,require("buffer").Buffer)
},{"./one-hundred-common.json":11,"./one-hundred-svgs.json":12,"buffer":14,"yo-yo":2}],2:[function(require,module,exports){
var bel = require('bel') // turns template tag into DOM elements
var morphdom = require('morphdom') // efficiently diffs + morphs two DOM elements
var defaultEvents = require('./update-events.js') // default events to be copied when dom elements update

module.exports = bel

// TODO move this + defaultEvents to a new module once we receive more feedback
module.exports.update = function (fromNode, toNode, opts) {
  if (!opts) opts = {}
  if (opts.events !== false) {
    if (!opts.onBeforeElUpdated) opts.onBeforeElUpdated = copier
  }

  return morphdom(fromNode, toNode, opts)

  // morphdom only copies attributes. we decided we also wanted to copy events
  // that can be set via attributes
  function copier (f, t) {
    // copy events:
    var events = opts.events || defaultEvents
    for (var i = 0; i < events.length; i++) {
      var ev = events[i]
      if (t[ev]) { // if new element has a whitelisted attribute
        f[ev] = t[ev] // update existing element
      } else if (f[ev]) { // if existing element has it and new one doesnt
        f[ev] = undefined // remove it from existing element
      }
    }
    // copy values for form elements
    if ((f.nodeName === 'INPUT' && f.type !== 'file') || f.nodeName === 'TEXTAREA' || f.nodeName === 'SELECT') {
      if (t.getAttribute('value') === null) t.value = f.value
    }
  }
}

},{"./update-events.js":10,"bel":3,"morphdom":9}],3:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload || function () {}
    var unload = props.onunload || function () {}
    onload(el, function belOnload () {
      load(el)
    }, function belOnunload () {
      unload(el)
    },
    // We have to use non-standard `caller` to find who invokes `belCreateElement`
    belCreateElement.caller.caller.caller)
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement)
module.exports.createElement = belCreateElement

},{"global/document":4,"hyperx":6,"on-load":8}],4:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":13}],5:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12

module.exports = function (h, opts) {
  h = attrToProp(h)
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        p.push([ VAR, xstate, arg ])
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else cur[1][key] = concat(cur[1][key], parts[i][1])
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else cur[1][key] = concat(cur[1][key], parts[i][2])
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state)) {
          if (state === OPEN) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === TEXT) {
          reg += c
        } else if (state === OPEN && /\s/.test(c)) {
          res.push([OPEN, reg])
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[\w-]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":7}],7:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],8:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  if (watch[mutation.oldValue]) {
    off(mutation.oldValue, mutation.target)
  }
  if (watch[newValue]) {
    on(newValue, mutation.target)
  }
}

function sameOrigin (oldValue, newValue) {
  if (!oldValue || !newValue) return false
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"global/document":4,"global/window":5}],9:[function(require,module,exports){
'use strict';
// Create a range object for efficently rendering strings to elements.
var range;

var doc = typeof document !== 'undefined' && document;

var testEl = doc ?
    doc.body || doc.createElement('div') :
    {};

var NS_XHTML = 'http://www.w3.org/1999/xhtml';

var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

// Fixes <https://github.com/patrick-steele-idem/morphdom/issues/32>
// (IE7+ support) <=IE7 does not support el.hasAttribute(name)
var hasAttributeNS;

if (testEl.hasAttributeNS) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttributeNS(namespaceURI, name);
    };
} else if (testEl.hasAttribute) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttribute(name);
    };
} else {
    hasAttributeNS = function(el, namespaceURI, name) {
        return !!el.getAttributeNode(name);
    };
}

function toElement(str) {
    if (!range && doc.createRange) {
        range = doc.createRange();
        range.selectNode(doc.body);
    }

    var fragment;
    if (range && range.createContextualFragment) {
        fragment = range.createContextualFragment(str);
    } else {
        fragment = doc.createElement('body');
        fragment.innerHTML = str;
    }
    return fragment.childNodes[0];
}

function syncBooleanAttrProp(fromEl, toEl, name) {
    if (fromEl[name] !== toEl[name]) {
        fromEl[name] = toEl[name];
        if (fromEl[name]) {
            fromEl.setAttribute(name, '');
        } else {
            fromEl.removeAttribute(name, '');
        }
    }
}

var specialElHandlers = {
    /**
     * Needed for IE. Apparently IE doesn't think that "selected" is an
     * attribute when reading over the attributes using selectEl.attributes
     */
    OPTION: function(fromEl, toEl) {
        syncBooleanAttrProp(fromEl, toEl, 'selected');
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
        syncBooleanAttrProp(fromEl, toEl, 'checked');
        syncBooleanAttrProp(fromEl, toEl, 'disabled');

        if (fromEl.value !== toEl.value) {
            fromEl.value = toEl.value;
        }

        if (!hasAttributeNS(toEl, null, 'value')) {
            fromEl.removeAttribute('value');
        }
    },

    TEXTAREA: function(fromEl, toEl) {
        var newValue = toEl.value;
        if (fromEl.value !== newValue) {
            fromEl.value = newValue;
        }

        if (fromEl.firstChild) {
            fromEl.firstChild.nodeValue = newValue;
        }
    }
};

function noop() {}

/**
 * Returns true if two node's names are the same.
 *
 * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
 *       nodeName and different namespace URIs.
 *
 * @param {Element} a
 * @param {Element} b The target element
 * @return {boolean}
 */
function compareNodeNames(fromEl, toEl) {
    var fromNodeName = fromEl.nodeName;
    var toNodeName = toEl.nodeName;

    if (fromNodeName === toNodeName) {
        return true;
    }

    if (toEl.actualize &&
        fromNodeName.charCodeAt(0) < 91 && /* from tag name is upper case */
        toNodeName.charCodeAt(0) > 90 /* target tag name is lower case */) {
        // If the target element is a virtual DOM node then we may need to normalize the tag name
        // before comparing. Normal HTML elements that are in the "http://www.w3.org/1999/xhtml"
        // are converted to upper case
        return fromNodeName === toNodeName.toUpperCase();
    } else {
        return false;
    }
}

/**
 * Create an element, optionally with a known namespace URI.
 *
 * @param {string} name the element name, e.g. 'div' or 'svg'
 * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
 * its `xmlns` attribute or its inferred namespace.
 *
 * @return {Element}
 */
function createElementNS(name, namespaceURI) {
    return !namespaceURI || namespaceURI === NS_XHTML ?
        doc.createElement(name) :
        doc.createElementNS(namespaceURI, name);
}

/**
 * Loop over all of the attributes on the target node and make sure the original
 * DOM node has the same attributes. If an attribute found on the original node
 * is not on the new node then remove it from the original node.
 *
 * @param  {Element} fromNode
 * @param  {Element} toNode
 */
function morphAttrs(fromNode, toNode) {
    var attrs = toNode.attributes;
    var i;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;

    if (toNode.assignAttributes) {
        toNode.assignAttributes(fromNode);
    } else {
        for (i = attrs.length - 1; i >= 0; --i) {
            attr = attrs[i];
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;
            attrValue = attr.value;

            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;
                fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

                if (fromValue !== attrValue) {
                    fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
                }
            } else {
                fromValue = fromNode.getAttribute(attrName);

                if (fromValue !== attrValue) {
                    fromNode.setAttribute(attrName, attrValue);
                }
            }
        }
    }

    // Remove any extra attributes found on the original DOM element that
    // weren't found on the target element.
    attrs = fromNode.attributes;

    for (i = attrs.length - 1; i >= 0; --i) {
        attr = attrs[i];
        if (attr.specified !== false) {
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;

            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;

                if (!hasAttributeNS(toNode, attrNamespaceURI, attrName)) {
                    fromNode.removeAttributeNS(attrNamespaceURI, attrName);
                }
            } else {
                if (!hasAttributeNS(toNode, null, attrName)) {
                    fromNode.removeAttribute(attrName);
                }
            }
        }
    }
}

/**
 * Copies the children of one DOM element to another DOM element
 */
function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
        var nextChild = curChild.nextSibling;
        toEl.appendChild(curChild);
        curChild = nextChild;
    }
    return toEl;
}

function defaultGetNodeKey(node) {
    return node.id;
}

function morphdom(fromNode, toNode, options) {
    if (!options) {
        options = {};
    }

    if (typeof toNode === 'string') {
        if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML') {
            var toNodeHtml = toNode;
            toNode = doc.createElement('html');
            toNode.innerHTML = toNodeHtml;
        } else {
            toNode = toElement(toNode);
        }
    }

    var getNodeKey = options.getNodeKey || defaultGetNodeKey;
    var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
    var onNodeAdded = options.onNodeAdded || noop;
    var onBeforeElUpdated = options.onBeforeElUpdated || noop;
    var onElUpdated = options.onElUpdated || noop;
    var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
    var onNodeDiscarded = options.onNodeDiscarded || noop;
    var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
    var childrenOnly = options.childrenOnly === true;

    // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
    var fromNodesLookup = {};
    var keyedRemovalList;

    function addKeyedRemoval(key) {
        if (keyedRemovalList) {
            keyedRemovalList.push(key);
        } else {
            keyedRemovalList = [key];
        }
    }

    function walkDiscardedChildNodes(node, skipKeyedNodes) {
        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {

                var key = undefined;

                if (skipKeyedNodes && (key = getNodeKey(curChild))) {
                    // If we are skipping keyed nodes then we add the key
                    // to a list so that it can be handled at the very end.
                    addKeyedRemoval(key);
                } else {
                    // Only report the node as discarded if it is not keyed. We do this because
                    // at the end we loop through all keyed elements that were unmatched
                    // and then discard them in one final pass.
                    onNodeDiscarded(curChild);
                    if (curChild.firstChild) {
                        walkDiscardedChildNodes(curChild, skipKeyedNodes);
                    }
                }

                curChild = curChild.nextSibling;
            }
        }
    }

    /**
     * Removes a DOM node out of the original DOM
     *
     * @param  {Node} node The node to remove
     * @param  {Node} parentNode The nodes parent
     * @param  {Boolean} skipKeyedNodes If true then elements with keys will be skipped and not discarded.
     * @return {undefined}
     */
    function removeNode(node, parentNode, skipKeyedNodes) {
        if (onBeforeNodeDiscarded(node) === false) {
            return;
        }

        if (parentNode) {
            parentNode.removeChild(node);
        }

        onNodeDiscarded(node);
        walkDiscardedChildNodes(node, skipKeyedNodes);
    }

    // // TreeWalker implementation is no faster, but keeping this around in case this changes in the future
    // function indexTree(root) {
    //     var treeWalker = document.createTreeWalker(
    //         root,
    //         NodeFilter.SHOW_ELEMENT);
    //
    //     var el;
    //     while((el = treeWalker.nextNode())) {
    //         var key = getNodeKey(el);
    //         if (key) {
    //             fromNodesLookup[key] = el;
    //         }
    //     }
    // }

    // // NodeIterator implementation is no faster, but keeping this around in case this changes in the future
    //
    // function indexTree(node) {
    //     var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
    //     var el;
    //     while((el = nodeIterator.nextNode())) {
    //         var key = getNodeKey(el);
    //         if (key) {
    //             fromNodesLookup[key] = el;
    //         }
    //     }
    // }

    function indexTree(node) {
        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {
                var key = getNodeKey(curChild);
                if (key) {
                    fromNodesLookup[key] = curChild;
                }

                // Walk recursively
                indexTree(curChild);

                curChild = curChild.nextSibling;
            }
        }
    }

    indexTree(fromNode);

    function handleNodeAdded(el) {
        onNodeAdded(el);

        var curChild = el.firstChild;
        while (curChild) {
            var nextSibling = curChild.nextSibling;

            var key = getNodeKey(curChild);
            if (key) {
                var unmatchedFromEl = fromNodesLookup[key];
                if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
                    curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
                    morphEl(unmatchedFromEl, curChild);
                }
            }

            handleNodeAdded(curChild);
            curChild = nextSibling;
        }
    }

    function morphEl(fromEl, toEl, childrenOnly) {
        var toElKey = getNodeKey(toEl);
        var curFromNodeKey;

        if (toElKey) {
            // If an element with an ID is being morphed then it is will be in the final
            // DOM so clear it out of the saved elements collection
            delete fromNodesLookup[toElKey];
        }

        if (toNode.isSameNode && toNode.isSameNode(fromNode)) {
            return;
        }

        if (!childrenOnly) {
            if (onBeforeElUpdated(fromEl, toEl) === false) {
                return;
            }

            morphAttrs(fromEl, toEl);
            onElUpdated(fromEl);

            if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
                return;
            }
        }

        if (fromEl.nodeName !== 'TEXTAREA') {
            var curToNodeChild = toEl.firstChild;
            var curFromNodeChild = fromEl.firstChild;
            var curToNodeKey;

            var fromNextSibling;
            var toNextSibling;
            var matchingFromEl;

            outer: while (curToNodeChild) {
                toNextSibling = curToNodeChild.nextSibling;
                curToNodeKey = getNodeKey(curToNodeChild);

                while (curFromNodeChild) {
                    fromNextSibling = curFromNodeChild.nextSibling;

                    if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    curFromNodeKey = getNodeKey(curFromNodeChild);

                    var curFromNodeType = curFromNodeChild.nodeType;

                    var isCompatible = undefined;

                    if (curFromNodeType === curToNodeChild.nodeType) {
                        if (curFromNodeType === ELEMENT_NODE) {
                            // Both nodes being compared are Element nodes

                            if (curToNodeKey) {
                                // The target node has a key so we want to match it up with the correct element
                                // in the original DOM tree
                                if (curToNodeKey !== curFromNodeKey) {
                                    // The current element in the original DOM tree does not have a matching key so
                                    // let's check our lookup to see if there is a matching element in the original
                                    // DOM tree
                                    if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                                        if (curFromNodeChild.nextSibling === matchingFromEl) {
                                            // Special case for single element removals. To avoid removing the original
                                            // DOM node out of the tree (since that can break CSS transitions, etc.),
                                            // we will instead discard the current node and wait until the next
                                            // iteration to properly match up the keyed target element with its matching
                                            // element in the original tree
                                            isCompatible = false;
                                        } else {
                                            // We found a matching keyed element somewhere in the original DOM tree.
                                            // Let's moving the original DOM node into the current position and morph
                                            // it.

                                            // NOTE: We use insertBefore instead of replaceChild because we want to go through
                                            // the `removeNode()` function for the node that is being discarded so that
                                            // all lifecycle hooks are correctly invoked
                                            fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                                            if (curFromNodeKey) {
                                                // Since the node is keyed it might be matched up later so we defer
                                                // the actual removal to later
                                                addKeyedRemoval(curFromNodeKey);
                                            } else {
                                                // NOTE: we skip nested keyed nodes from being removed since there is
                                                //       still a chance they will be matched up later
                                                removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);

                                            }
                                            fromNextSibling = curFromNodeChild.nextSibling;
                                            curFromNodeChild = matchingFromEl;
                                        }
                                    } else {
                                        // The nodes are not compatible since the "to" node has a key and there
                                        // is no matching keyed node in the source tree
                                        isCompatible = false;
                                    }
                                }
                            } else if (curFromNodeKey) {
                                // The original has a key
                                isCompatible = false;
                            }

                            isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                            if (isCompatible) {
                                // We found compatible DOM elements so transform
                                // the current "from" node to match the current
                                // target DOM node.
                                morphEl(curFromNodeChild, curToNodeChild);
                            }

                        } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                            // Both nodes being compared are Text or Comment nodes
                            isCompatible = true;
                            // Simply update nodeValue on the original node to
                            // change the text value
                            curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                        }
                    }

                    if (isCompatible) {
                        // Advance both the "to" child and the "from" child since we found a match
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    // No compatible match so remove the old node from the DOM and continue trying to find a
                    // match in the original DOM. However, we only do this if the from node is not keyed
                    // since it is possible that a keyed node might match up with a node somewhere else in the
                    // target tree and we don't want to discard it just yet since it still might find a
                    // home in the final DOM tree. After everything is done we will remove any keyed nodes
                    // that didn't find a home
                    if (curFromNodeKey) {
                        // Since the node is keyed it might be matched up later so we defer
                        // the actual removal to later
                        addKeyedRemoval(curFromNodeKey);
                    } else {
                        // NOTE: we skip nested keyed nodes from being removed since there is
                        //       still a chance they will be matched up later
                        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                    }

                    curFromNodeChild = fromNextSibling;
                }

                // If we got this far then we did not find a candidate match for
                // our "to node" and we exhausted all of the children "from"
                // nodes. Therefore, we will just append the current "to" node
                // to the end
                if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
                    fromEl.appendChild(matchingFromEl);
                    morphEl(matchingFromEl, curToNodeChild);
                } else {
                    var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
                    if (onBeforeNodeAddedResult !== false) {
                        if (onBeforeNodeAddedResult) {
                            curToNodeChild = onBeforeNodeAddedResult;
                        }

                        if (curToNodeChild.actualize) {
                            curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
                        }
                        fromEl.appendChild(curToNodeChild);
                        handleNodeAdded(curToNodeChild);
                    }
                }

                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
            }

            // We have processed all of the "to nodes". If curFromNodeChild is
            // non-null then we still have some from nodes left over that need
            // to be removed
            while (curFromNodeChild) {
                fromNextSibling = curFromNodeChild.nextSibling;
                if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
                    // Since the node is keyed it might be matched up later so we defer
                    // the actual removal to later
                    addKeyedRemoval(curFromNodeKey);
                } else {
                    // NOTE: we skip nested keyed nodes from being removed since there is
                    //       still a chance they will be matched up later
                    removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                }
                curFromNodeChild = fromNextSibling;
            }
        }

        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
            specialElHandler(fromEl, toEl);
        }
    } // END: morphEl(...)

    var morphedNode = fromNode;
    var morphedNodeType = morphedNode.nodeType;
    var toNodeType = toNode.nodeType;

    if (!childrenOnly) {
        // Handle the case where we are given two DOM nodes that are not
        // compatible (e.g. <div> --> <span> or <div> --> TEXT)
        if (morphedNodeType === ELEMENT_NODE) {
            if (toNodeType === ELEMENT_NODE) {
                if (!compareNodeNames(fromNode, toNode)) {
                    onNodeDiscarded(fromNode);
                    morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
                }
            } else {
                // Going from an element node to a text node
                morphedNode = toNode;
            }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
            if (toNodeType === morphedNodeType) {
                morphedNode.nodeValue = toNode.nodeValue;
                return morphedNode;
            } else {
                // Text node to something else
                morphedNode = toNode;
            }
        }
    }

    if (morphedNode === toNode) {
        // The "to node" was not compatible with the "from node" so we had to
        // toss out the "from node" and use the "to node"
        onNodeDiscarded(fromNode);
    } else {
        morphEl(morphedNode, toNode, childrenOnly);

        // We now need to loop over any keyed nodes that might need to be
        // removed. We only do the removal if we know that the keyed node
        // never found a match. When a keyed node is matched up we remove
        // it out of fromNodesLookup and we use fromNodesLookup to determine
        // if a keyed node has been matched up or not
        if (keyedRemovalList) {
            for (var i=0, len=keyedRemovalList.length; i<len; i++) {
                var elToRemove = fromNodesLookup[keyedRemovalList[i]];
                if (elToRemove) {
                    removeNode(elToRemove, elToRemove.parentNode, false);
                }
            }
        }
    }

    if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        if (morphedNode.actualize) {
            morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
        }
        // If we had to swap out the from node with a new node because the old
        // node was not compatible with the target node then we need to
        // replace the old DOM node in the original DOM tree. This is only
        // possible if the original DOM node was part of a DOM tree which
        // we know is the case if it has a parent node.
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
    }

    return morphedNode;
}

module.exports = morphdom;

},{}],10:[function(require,module,exports){
module.exports = [
  // attribute events (can be set with attributes)
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'ondragstart',
  'ondrag',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondrop',
  'ondragend',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onunload',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onselect',
  'onchange',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'oninput',
  // other common events
  'oncontextmenu',
  'onfocusin',
  'onfocusout'
]

},{}],11:[function(require,module,exports){
module.exports=[
  [
    "人",
    "人",
    "亻",
    "human, person, people",
    "ren2",
    "今仁休位他",
    "Note similarity with 八, which means eight.",
    "单人旁（亻），人字头（人）"
  ],
  [
    "口",
    "口",
    "",
    "mouth, opening",
    "kou3",
    "古可名告知",
    "Note similarity with 囗, which always encloses characters, and means enclosure.",
    "口字旁"
  ],
  [
    "土",
    "土",
    "",
    "earth",
    "tu3",
    "在地型城地",
    "Note similarity with 士, which has a longer upper stroke and shorter bottom one, and means scholar.",
    "提土旁"
  ],
  [
    "女",
    "女",
    "",
    "woman, female",
    "nv3",
    "好妄始姓安",
    "",
    "女子旁"
  ],
  [
    "心",
    "心",
    "忄，⺗",
    "heart",
    "xin1",
    "必忙忘性想",
    "",
    "竖心旁（忄），心字底（心），竖心底（⺗）"
  ],
  [
    "手",
    "手",
    "扌，龵",
    "hand",
    "shou3",
    "持掌打抱押",
    "",
    "提手旁（扌），看字头（龵），手字旁（手）"
  ],
  [
    "日",
    "日",
    "",
    "sun, day",
    "ri4",
    "白百明时晩",
    "Note similarity with 曰, which is broader and lower, and means to say. Also note 白 which means white.",
    "日字旁"
  ],
  [
    "月",
    "月",
    "",
    "moon, month",
    "yue4",
    "有服青朝明",
    "This radical is actually two: moon 月 and meat 肉, but in modern Chinese, they look the same in most cases。",
    "月字旁"
  ],
  [
    "木",
    "木",
    "",
    "tree",
    "mu4",
    "板相根本林",
    "Note similarity with 禾, which means grain.",
    "木字旁"
  ],
  [
    "氵",
    "氵",
    "水，氺",
    "water",
    "shui3",
    "永泳海洋沙",
    "Note similarity with 冫, which means ice.",
    "水字旁（水），三点水（氵），泰字底水（氺）"
  ],
  [
    "火",
    "火",
    "灬",
    "fire",
    "huo3",
    "灯炎焦然炸",
    "",
    "火字旁（火），四点底（灬）"
  ],
  [
    "纟",
    "糹",
    "糸",
    "silk",
    "(mi4)",
    "纪纸累细绩",
    "",
    "绞丝旁（纟），独立绞丝（糸）"
  ],
  [
    "艹",
    "艹",
    "艸",
    "grass",
    "cao3",
    "花英苦草茶",
    "Note that when the radical is on top, the traditional variant has four strokes.",
    "草字头（艹）"
  ],
  [
    "讠",
    "訁",
    "言",
    "speech",
    "yan2",
    "说讲识评试",
    "",
    "言字旁（讠）"
  ],
  [
    "辶",
    "辶",
    "⻍",
    "walk",
    "(chuo4)",
    "迎通道这近",
    "",
    "走之旁（⻌）"
  ],
  [
    "钅",
    "釒",
    "金",
    "gold, metal",
    "jin1",
    "银针钱铁钟",
    "",
    "金字旁（钅）"
  ],
  [
    "刂",
    "刂",
    "刀",
    "knife, sword",
    "dao1",
    "分切初利刻",
    "Note similarity with 力, which means force.",
    "立刀旁（刂），刀字旁（刀）"
  ],
  [
    "宀",
    "宀",
    "",
    "roof",
    "(mian2)",
    "守家室字宅",
    "Note similarity with 冖, which means cover, and with 亠, which means lid.",
    "宝盖头"
  ],
  [
    "贝",
    "貝",
    "",
    "shell",
    "bei4",
    "财贪货贸员",
    "Note similarity with 见, which means to see.",
    "贝字旁"
  ],
  [
    "一",
    "一",
    "",
    "one",
    "yi1",
    "三旦正百天",
    "",
    "横"
  ],
  [
    "力",
    "力",
    "",
    "power, force",
    "li4",
    "力加助勉男",
    "Note similarity with 刀, which means knife.",
    "力字旁"
  ],
  [
    "又",
    "又",
    "",
    "right hand",
    "you4",
    "反取受左友",
    "",
    "又字旁"
  ],
  [
    "犭",
    "犭",
    "犬",
    "dog",
    "(quan3)",
    "犯狂狗献猪",
    "Note similarity with 大, which means big.",
    "反犬旁（犭），犬字旁（犬）"
  ],
  [
    "禾",
    "禾",
    "",
    "grain",
    "(he)",
    "利私季和香",
    "Note similarity with 木, which means tree.",
    "禾木旁"
  ],
  [
    "⺮",
    "⺮",
    "竹",
    "bamboo",
    "zhu2",
    "笑第简筷算",
    "",
    "竹子头（竹字头）"
  ],
  [
    "虫",
    "虫",
    "",
    "insect",
    "chong2",
    "強独蛇蛋蚊",
    "Even though this radical means insect, it's used for many organisms which aren't insects according to our taxonomy.",
    "虫字旁"
  ],
  [
    "阜",
    "阝",
    "",
    "mound, dam",
    "(fu4)",
    "防阻陆院陈",
    "Note that there are two radicals which look like this. On the left, it means mound, dam, and on the right, it means city.",
    "双耳刀（左耳刀）"
  ],
  [
    "大",
    "大",
    "",
    "big, very",
    "da4",
    "天尖因奇美",
    "",
    "大字旁（头）"
  ],
  [
    "广",
    "广",
    "",
    "house on cliff",
    "guang3",
    "店府度座庭",
    "Note similarity with 厂, which means cliff (i.e. without the house).",
    "广字旁"
  ],
  [
    "田",
    "田",
    "",
    "field",
    "tian2",
    "思留略番累",
    "",
    "田字旁"
  ],
  [
    "目",
    "目",
    "罒",
    "eye",
    "mu4",
    "眼睛看相省",
    "Note that the horizontal version can also mean net.",
    "目字旁（目），四字头（罒）"
  ],
  [
    "石",
    "石",
    "",
    "stone",
    "shi2",
    "砂破碑矿码",
    "",
    "石字旁"
  ],
  [
    "衤",
    "衤",
    "衣",
    "clothes",
    "yi1",
    "初被裁裤袜",
    "Note similarity with  礻, which means sign, show or spirit.",
    "衣字旁（衤）"
  ],
  [
    "足",
    "足",
    "⻊",
    "foot",
    "zu2",
    "跑跨跟路距",
    "",
    "足字旁"
  ],
  [
    "马",
    "馬",
    "",
    "horse",
    "ma3",
    "码驾骂驻妈",
    "",
    "马字旁"
  ],
  [
    "页",
    "頁",
    "",
    "leaf",
    "ye4",
    "顺须领预顶",
    "",
    "页字旁"
  ],
  [
    "巾",
    "巾",
    "",
    "turban, scarf",
    "(jin1)",
    "市布帝帐帽",
    "",
    "巾字旁"
  ],
  [
    "米",
    "米",
    "",
    "rice",
    "mi3",
    "类粉迷粗糖",
    "",
    "米字旁"
  ],
  [
    "车",
    "車",
    "",
    "cart, vehicle",
    "che1",
    "轮软军较输",
    "",
    "车字旁"
  ],
  [
    "八",
    "八",
    "",
    "eight",
    "ba1",
    "公分趴兵共",
    "Note similarity with 人, which means human, person.",
    "八字旁（头）"
  ],
  [
    "尸",
    "尸",
    "",
    "corpse",
    "shi1",
    "尺局尾居展",
    "Note similarity with 戶, which means door, family.",
    "尸字头"
  ],
  [
    "寸",
    "寸",
    "",
    "thumb, inch",
    "cun4",
    "寺尊对射付",
    "",
    "寸字旁"
  ],
  [
    "山",
    "山",
    "",
    "mountain",
    "shan1",
    "岩岛岁崗岔",
    "",
    "山字旁（头）"
  ],
  [
    "攵",
    "攵",
    "攴",
    "knock, tap",
    "(pu1)",
    "收改攻做政",
    "Note similarity with 夊, which means to walk (slowly).",
    "反文旁（攵），旧反文旁（攴）"
  ],
  [
    "彳",
    "彳",
    "",
    "(small) step",
    "(chi2)",
    "彼很律微德",
    "Note similarity with 亻, which means human, person.",
    "双人旁"
  ],
  [
    "十",
    "十",
    "",
    "ten",
    "shi2",
    "什计古叶早",
    "",
    "十字旁（头）"
  ],
  [
    "工",
    "工",
    "",
    "work",
    "gong1",
    "左江红巧功",
    "",
    "工字旁"
  ],
  [
    "方",
    "方",
    "",
    "square, raft",
    "fang1",
    "放旅族仿房",
    "",
    "方字旁"
  ],
  [
    "门",
    "門",
    "",
    "gate",
    "men2",
    "间闲问闭闻",
    "",
    "门字框"
  ],
  [
    "饣",
    "飠",
    "食",
    "eat, food",
    "shi2",
    "饭饿饮馆饱",
    "",
    "食字旁"
  ],
  [
    "欠",
    "欠",
    "",
    "lack, yawn",
    "qian4",
    "欢欧欲次歌",
    "",
    "欠字旁"
  ],
  [
    "儿",
    "儿",
    "",
    "human, legs",
    "er2",
    "元四光兄充",
    "Note similarity with 人, which means human, person, and with 八 which means eight.",
    "儿座底"
  ],
  [
    "冫",
    "冫",
    "",
    "ice",
    "bing1",
    "冬冷冻况净",
    "",
    "两点水"
  ],
  [
    "子",
    "子",
    "",
    "child, seed",
    "zi3",
    "字学存孩季",
    "",
    "子字旁"
  ],
  [
    "疒",
    "疒",
    "",
    "sickness",
    "(ne4)",
    "病痛疗疯痩",
    "",
    "病字旁"
  ],
  [
    "隹",
    "隹",
    "",
    "(short-tailed) bird",
    "(zhui1)",
    "雀集难雅谁",
    "",
    "隹字旁"
  ],
  [
    "斤",
    "斤",
    "",
    "axe",
    "(jin1)",
    "所新听近析",
    "",
    "斤字旁"
  ],
  [
    "亠",
    "亠",
    "",
    "lid",
    "(tou2)",
    "亡交京",
    "Note similarity with  宀, which means roof, and 冖 which means cover.",
    "点横头"
  ],
  [
    "王",
    "王",
    "玉",
    "jade, king",
    "yu4, wang2",
    "主弄皇理现",
    "This radical is 玉, but when in composition, it looks like 王, king, and is probably more easily remembered like that.",
    "王字旁"
  ],
  [
    "白",
    "白",
    "",
    "white",
    "bai2",
    "的皆皇怕迫",
    "Note similarity with 日, which means sun.",
    "白字旁"
  ],
  [
    "立",
    "立",
    "",
    "stand, erect",
    "li4",
    "音意端亲位",
    "",
    "立字旁"
  ],
  [
    "羊",
    "羊",
    "⺶，⺷",
    "sheep",
    "yang2",
    "着样洋美鲜",
    "",
    "羊字旁"
  ],
  [
    "艮",
    "艮",
    "",
    "stopping",
    "(gen4)",
    "很恨恳根眼",
    "",
    "艮字旁"
  ],
  [
    "冖",
    "冖",
    "",
    "cover",
    "(mi4)",
    "写军农深荣",
    "",
    "秃宝盖"
  ],
  [
    "厂",
    "厂",
    "",
    "cliff",
    "(han4)",
    "厚原厉厅厕",
    "Note similarity with 广, which has ha house on top (the dot).",
    "厂字旁"
  ],
  [
    "皿",
    "皿",
    "",
    "dish",
    "(min3)",
    "盆监盟盛盖",
    "",
    "皿字底"
  ],
  [
    "礻",
    "礻",
    "示",
    "sign, spirit, show",
    "shi4",
    "社神视祝祥",
    "Note similarity with 衤, which means clothes.",
    "示字旁"
  ],
  [
    "穴",
    "穴",
    "",
    "cave",
    "xue4",
    "空突穷究窗",
    "",
    "穴宝盖"
  ],
  [
    "走",
    "走",
    "",
    "run, walk",
    "zou3",
    "起超越赶徒",
    "",
    "走字旁"
  ],
  [
    "雨",
    "雨",
    "",
    "rain",
    "yu3",
    "雷雪霜需露",
    "",
    "雨字头"
  ],
  [
    "囗",
    "囗",
    "",
    "enclosure",
    "(wei2)",
    "回国因图团",
    "Note similarity with 口, which does not enclose other components and means mouth.",
    "国字框"
  ],
  [
    "小",
    "小",
    "⺌⺍",
    "small",
    "xiao3",
    "少肖尚尖尘",
    "",
    "小字旁（头）"
  ],
  [
    "戈",
    "戈",
    "",
    "halberd",
    "(ge1)",
    "成式战感我",
    "",
    "戈字旁"
  ],
  [
    "几",
    "几",
    "",
    "table",
    "ji1",
    "朵机风凡凤",
    "",
    "几字旁"
  ],
  [
    "舌",
    "舌",
    "",
    "tongue",
    "she2",
    "乱适话舍活",
    "",
    "舌字旁"
  ],
  [
    "干",
    "干",
    "",
    "dry",
    "gan1",
    "平刊汗旱赶",
    "",
    "干字旁"
  ],
  [
    "殳",
    "殳",
    "",
    "weapon",
    "(shu1)",
    "段没投般设",
    "",
    "殳字旁"
  ],
  [
    "夕",
    "夕",
    "",
    "evening, sunset",
    "xi1",
    "外多夜名岁",
    "",
    "夕字旁"
  ],
  [
    "止",
    "止",
    "",
    "stop",
    "zhi3",
    "正此步歪址",
    "",
    "止字旁"
  ],
  [
    "皮",
    "皮",
    "",
    "skin",
    "pi2",
    "披彼波破疲",
    "",
    "皮字旁"
  ],
  [
    "耳",
    "耳",
    "",
    "ear",
    "er3",
    "取闻职聪联",
    "",
    "耳字旁"
  ],
  [
    "辛",
    "辛",
    "",
    "bitter",
    "xin1",
    "辜辟辣辨辩",
    "",
    "辛字旁"
  ],
  [
    "阝",
    "阝",
    "邑",
    "city",
    "(yi4)",
    "那邦部都邮",
    "Note that there are two radicals which look like this. On the left, it means mound, dam, and on the right, it means city.",
    "双耳刀（右耳刀）"
  ],
  [
    "酉",
    "酉",
    "",
    "wine",
    "(you3)",
    "醉酒醒酸尊",
    "",
    "酉字旁"
  ],
  [
    "青",
    "青",
    "",
    "green/blue",
    "qing1",
    "请清情晴猜",
    "",
    "青字旁"
  ],
  [
    "鸟",
    "鳥",
    "",
    "bird",
    "niao3",
    "鸦鸣鸭岛鸡",
    "",
    "鸟字旁"
  ],
  [
    "弓",
    "弓",
    "",
    "bow",
    "gong1",
    "引张弱第强",
    "",
    "弓字旁"
  ],
  [
    "厶",
    "厶",
    "",
    "private",
    "si1",
    "公勾去私云",
    "",
    "私字旁"
  ],
  [
    "户",
    "户",
    "戶",
    "door, house",
    "hu4",
    "所房炉护启",
    "Note similarity with 尸, which means corpse.",
    "户字旁"
  ],
  [
    "羽",
    "羽",
    "",
    "feather",
    "yu3",
    "习翻翅塌扇",
    "",
    "羽字旁"
  ],
  [
    "舟",
    "舟",
    "",
    "boat",
    "chuan2",
    "般船航盘艇",
    "",
    "舟字旁"
  ],
  [
    "里",
    "里",
    "",
    "village, mile",
    "li3",
    "野重量理埋",
    "",
    "里字旁"
  ],
  [
    "匕",
    "匕",
    "",
    "spoon",
    "(bi3)",
    "匙比北呢旨",
    "",
    "匕字旁"
  ],
  [
    "夂",
    "夂",
    "",
    "go (slowly)",
    "(sui1)",
    "各條复备夏",
    "Note similarity with 攵, which means to knock, to rap.",
    "折文旁"
  ],
  [
    "见",
    "見",
    "",
    "see",
    "jian4",
    "观规视现觉",
    "Note similarity with 贝, which means shell.",
    "见字旁"
  ],
  [
    "卩",
    "卩",
    "",
    "seal",
    "(jie2)",
    "卷印却即危",
    "",
    "单耳刀"
  ],
  [
    "罒",
    "罒",
    "网",
    "net",
    "wang3",
    "罗罚罢罪罩",
    "Note that the horizontal version can also mean net.",
    "四字头（罒）"
  ],
  [
    "士",
    "士",
    "",
    "scholar",
    "shi4",
    "吉壶志声壮",
    "Note similarity with 土, which means earth.",
    "士字旁"
  ],
  [
    "勹",
    "勹",
    "",
    "embrace, wrap",
    "(bao1)",
    "包勿勾勺勻",
    "",
    "包字头"
  ]
]
},{}],12:[function(require,module,exports){
module.exports=[
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1074;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.1240234375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 936;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.01171875s both;\n          animation-delay: 1.1240234375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 475 485 Q 547 653 563 683 Q 573 695 565 708 Q 558 721 519 742 Q 491 757 480 754 Q 462 750 465 730 Q 484 537 292 308 Q 280 296 269 284 Q 212 217 68 102 Q 58 92 66 89 Q 76 86 90 92 Q 190 138 274 210 Q 380 294 462 456 L 475 485 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 462 456 Q 480 423 575 292 Q 666 171 733 101 Q 764 67 793 69 Q 881 75 958 79 Q 991 80 992 89 Q 993 98 956 112 Q 772 178 740 205 Q 617 304 490 466 Q 481 476 475 485 L 462 456 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 475 485 Q 547 653 563 683 Q 573 695 565 708 Q 558 721 519 742 Q 491 757 480 754 Q 462 750 465 730 Q 484 537 292 308 Q 280 296 269 284 Q 212 217 68 102 Q 58 92 66 89 Q 76 86 90 92 Q 190 138 274 210 Q 380 294 462 456 L 475 485 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 483 736 L 508 702 L 511 678 L 473 552 L 408 416 L 328 303 L 271 244 L 144 139 L 72 95\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"946 1892\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 462 456 Q 480 423 575 292 Q 666 171 733 101 Q 764 67 793 69 Q 881 75 958 79 Q 991 80 992 89 Q 993 98 956 112 Q 772 178 740 205 Q 617 304 490 466 Q 481 476 475 485 L 462 456 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 474 477 L 477 459 L 490 439 L 571 333 L 691 200 L 753 145 L 798 119 L 986 90\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"808 1616\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 718;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8343098958333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1050;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1044921875s both;\n          animation-delay: 0.8343098958333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 641;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7716471354166666s both;\n          animation-delay: 1.9388020833333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 295 571 Q 267 590 236 597 Q 227 600 221 594 Q 211 587 223 573 Q 281 477 292 248 Q 293 176 338 142 Q 339 141 343 139 Q 365 133 365 170 Q 365 174 365 177 L 360 223 Q 327 406 322 528 L 295 571 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 719 261 Q 755 472 821 538 Q 845 563 824 589 Q 802 607 729 642 Q 704 652 674 641 Q 515 587 295 571 L 322 528 Q 331 529 345 533 Q 493 555 634 577 Q 671 584 685 568 Q 707 549 703 505 Q 684 372 654 268 L 719 261 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 365 177 Q 372 177 383 178 Q 495 200 738 212 Q 751 213 754 224 Q 755 234 719 261 L 654 268 Q 491 235 360 223 L 365 177 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 295 571 Q 267 590 236 597 Q 227 600 221 594 Q 211 587 223 573 Q 281 477 292 248 Q 293 176 338 142 Q 339 141 343 139 Q 365 133 365 170 Q 365 174 365 177 L 360 223 Q 327 406 322 528 L 295 571 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 229 584 L 272 548 L 287 517 L 330 203 L 348 152\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"590 1180\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 719 261 Q 755 472 821 538 Q 845 563 824 589 Q 802 607 729 642 Q 704 652 674 641 Q 515 587 295 571 L 322 528 Q 331 529 345 533 Q 493 555 634 577 Q 671 584 685 568 Q 707 549 703 505 Q 684 372 654 268 L 719 261 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 304 569 L 333 552 L 488 574 L 663 608 L 700 607 L 720 598 L 759 559 L 758 552 L 694 295 L 661 273\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"922 1844\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 365 177 Q 372 177 383 178 Q 495 200 738 212 Q 751 213 754 224 Q 755 234 719 261 L 654 268 Q 491 235 360 223 L 365 177 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 369 185 L 394 203 L 651 238 L 710 236 L 744 224\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"513 1026\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 720;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8359375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 900;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.982421875s both;\n          animation-delay: 0.8359375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1058;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1110026041666667s both;\n          animation-delay: 1.818359375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 535 428 Q 602 441 673 451 Q 739 464 749 472 Q 759 481 755 490 Q 748 505 715 514 Q 681 523 647 511 Q 592 495 537 481 L 483 470 Q 395 454 293 449 Q 251 445 280 424 Q 320 397 409 409 Q 445 415 483 420 L 535 428 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 521 151 Q 528 293 535 428 L 537 481 Q 538 595 566 720 Q 570 733 546 751 Q 504 773 475 779 Q 456 783 446 773 Q 436 763 447 746 Q 481 694 481 658 Q 484 567 483 470 L 483 420 Q 480 290 471 145 L 521 151 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 471 145 Q 314 130 132 111 Q 107 110 125 87 Q 162 50 211 60 Q 452 121 842 114 Q 875 113 903 112 Q 928 111 935 122 Q 942 137 922 154 Q 847 212 795 192 Q 689 176 521 151 L 471 145 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 535 428 Q 602 441 673 451 Q 739 464 749 472 Q 759 481 755 490 Q 748 505 715 514 Q 681 523 647 511 Q 592 495 537 481 L 483 470 Q 395 454 293 449 Q 251 445 280 424 Q 320 397 409 409 Q 445 415 483 420 L 535 428 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 283 438 L 312 430 L 379 430 L 486 445 L 692 487 L 741 485\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"592 1184\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 521 151 Q 528 293 535 428 L 537 481 Q 538 595 566 720 Q 570 733 546 751 Q 504 773 475 779 Q 456 783 446 773 Q 436 763 447 746 Q 481 694 481 658 Q 484 567 483 470 L 483 420 Q 480 290 471 145 L 521 151 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 461 760 L 517 714 L 518 685 L 498 173 L 476 153\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"772 1544\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 471 145 Q 314 130 132 111 Q 107 110 125 87 Q 162 50 211 60 Q 452 121 842 114 Q 875 113 903 112 Q 928 111 935 122 Q 942 137 922 154 Q 847 212 795 192 Q 689 176 521 151 L 471 145 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 129 99 L 188 87 L 378 115 L 818 156 L 866 149 L 922 129\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"930 1860\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1325;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.3282877604166667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 940;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0149739583333333s both;\n          animation-delay: 1.3282877604166667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1148;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1842447916666667s both;\n          animation-delay: 2.34326171875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 445 467 Q 485 576 514 665 Q 526 705 540 732 Q 562 757 524 789 Q 478 825 449 826 Q 433 827 429 815 Q 425 806 434 798 Q 455 774 453 731 Q 441 625 390 461 L 375 416 Q 348 338 337 327 Q 313 309 331 280 Q 340 270 356 274 Q 393 283 491 221 L 535 192 Q 637 132 757 11 Q 776 -8 789 -7 Q 805 -6 805 17 Q 804 54 773 100 Q 755 127 701 153 Q 599 213 569 230 L 519 256 Q 395 320 393 327 Q 393 333 427 423 L 445 467 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 695 496 Q 656 544 628 541 Q 612 540 614 522 Q 618 504 617 486 L 606 440 Q 566 319 519 256 L 491 221 Q 406 128 277 81 Q 256 74 237 65 Q 221 59 233 53 Q 248 49 289 53 Q 356 63 413 95 Q 473 122 535 192 L 569 230 Q 600 275 659 395 Q 669 423 688 447 L 695 496 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 688 447 Q 757 456 931 443 Q 956 440 962 449 Q 969 462 957 475 Q 926 503 881 524 Q 866 531 839 522 Q 767 507 695 496 L 617 486 Q 461 471 445 467 L 390 461 Q 314 454 268 447 Q 189 435 73 434 Q 60 434 57 422 Q 57 409 76 394 Q 94 381 126 369 Q 138 365 156 373 Q 205 392 375 416 L 427 423 Q 448 426 606 440 L 688 447 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 445 467 Q 485 576 514 665 Q 526 705 540 732 Q 562 757 524 789 Q 478 825 449 826 Q 433 827 429 815 Q 425 806 434 798 Q 455 774 453 731 Q 441 625 390 461 L 375 416 Q 348 338 337 327 Q 313 309 331 280 Q 340 270 356 274 Q 393 283 491 221 L 535 192 Q 637 132 757 11 Q 776 -8 789 -7 Q 805 -6 805 17 Q 804 54 773 100 Q 755 127 701 153 Q 599 213 569 230 L 519 256 Q 395 320 393 327 Q 393 333 427 423 L 445 467 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 442 810 L 475 787 L 498 746 L 453 573 L 373 346 L 365 309 L 498 244 L 675 132 L 740 81 L 787 11\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1197 2394\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 695 496 Q 656 544 628 541 Q 612 540 614 522 Q 618 504 617 486 L 606 440 Q 566 319 519 256 L 491 221 Q 406 128 277 81 Q 256 74 237 65 Q 221 59 233 53 Q 248 49 289 53 Q 356 63 413 95 Q 473 122 535 192 L 569 230 Q 600 275 659 395 Q 669 423 688 447 L 695 496 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 628 527 L 652 492 L 651 462 L 587 314 L 549 249 L 520 214 L 452 148 L 384 105 L 321 78 L 238 58\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"812 1624\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 688 447 Q 757 456 931 443 Q 956 440 962 449 Q 969 462 957 475 Q 926 503 881 524 Q 866 531 839 522 Q 767 507 695 496 L 617 486 Q 461 471 445 467 L 390 461 Q 314 454 268 447 Q 189 435 73 434 Q 60 434 57 422 Q 57 409 76 394 Q 94 381 126 369 Q 138 365 156 373 Q 205 392 375 416 L 427 423 Q 448 426 606 440 L 688 447 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 70 420 L 138 402 L 383 440 L 857 487 L 913 474 L 950 458\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1020 2040\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 489;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.64794921875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1086;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1337890625s both;\n          animation-delay: 0.64794921875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 436;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6048177083333334s both;\n          animation-delay: 1.78173828125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 477;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.63818359375s both;\n          animation-delay: 2.3865559895833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 171 459 Q 147 381 112 311 Q 91 269 117 230 Q 129 209 152 227 Q 177 249 190 289 Q 211 344 208 392 Q 211 432 199 462 Q 192 472 185 472 Q 175 469 171 459 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 863 228 Q 859 243 834 262 Q 797 290 698 391 Q 691 398 685 398 Q 682 397 684 389 Q 708 338 732 281 Q 742 257 728 241 Q 689 208 550 226 Q 441 244 397 323 Q 370 377 355 435 Q 348 463 324 476 Q 306 486 299 478 Q 295 474 302 454 Q 312 429 335 363 Q 372 224 476 178 Q 495 171 521 163 Q 710 115 851 212 Q 866 221 863 228 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 441 617 Q 475 578 511 531 Q 524 515 541 513 Q 553 512 561 525 Q 568 541 564 574 Q 560 619 444 670 Q 428 677 420 675 Q 414 672 414 658 Q 415 645 441 617 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 760 585 Q 814 536 877 465 Q 896 441 914 437 Q 924 436 933 447 Q 948 463 932 514 Q 922 563 840 592 Q 789 613 761 621 Q 751 627 748 612 Q 747 596 760 585 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 171 459 Q 147 381 112 311 Q 91 269 117 230 Q 129 209 152 227 Q 177 249 190 289 Q 211 344 208 392 Q 211 432 199 462 Q 192 472 185 472 Q 175 469 171 459 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 185 462 L 176 372 L 133 236\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"361 722\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 863 228 Q 859 243 834 262 Q 797 290 698 391 Q 691 398 685 398 Q 682 397 684 389 Q 708 338 732 281 Q 742 257 728 241 Q 689 208 550 226 Q 441 244 397 323 Q 370 377 355 435 Q 348 463 324 476 Q 306 486 299 478 Q 295 474 302 454 Q 312 429 335 363 Q 372 224 476 178 Q 495 171 521 163 Q 710 115 851 212 Q 866 221 863 228 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 306 473 L 333 435 L 369 327 L 400 274 L 429 244 L 471 215 L 538 193 L 634 183 L 693 187 L 748 205 L 784 234 L 773 267 L 691 393\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"958 1916\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 441 617 Q 475 578 511 531 Q 524 515 541 513 Q 553 512 561 525 Q 568 541 564 574 Q 560 619 444 670 Q 428 677 420 675 Q 414 672 414 658 Q 415 645 441 617 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 425 667 L 520 581 L 542 534\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"308 616\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 760 585 Q 814 536 877 465 Q 896 441 914 437 Q 924 436 933 447 Q 948 463 932 514 Q 922 563 840 592 Q 789 613 761 621 Q 751 627 748 612 Q 747 596 760 585 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 761 607 L 838 558 L 886 518 L 915 457\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"349 698\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 659;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7862955729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 643;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7732747395833334s both;\n          animation-delay: 0.7862955729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1080;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.12890625s both;\n          animation-delay: 1.5595703125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1119;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.16064453125s both;\n          animation-delay: 2.6884765625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 502 718 Q 550 731 590 746 Q 641 759 683 764 Q 701 763 706 771 Q 710 781 700 795 Q 679 814 634 837 Q 619 847 605 847 Q 596 844 594 832 Q 591 802 411 730 Q 365 714 310 696 Q 303 687 310 684 Q 328 678 449 707 Q 458 708 468 711 L 502 718 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 555 563 Q 697 591 706 599 Q 716 606 711 616 Q 704 628 674 636 Q 644 643 547 611 L 506 600 Q 496 599 486 596 Q 413 580 327 574 Q 290 568 315 550 Q 358 528 428 540 Q 468 549 513 554 L 555 563 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 575 389 Q 687 398 843 397 Q 927 394 935 406 Q 942 419 923 436 Q 863 479 820 471 Q 723 452 571 429 L 525 422 Q 513 422 503 420 Q 325 398 115 373 Q 90 372 108 351 Q 124 335 145 329 Q 169 322 187 328 Q 352 373 527 385 L 575 389 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 527 385 Q 536 154 492 78 Q 488 69 479 66 Q 467 62 376 87 Q 369 88 366 85 Q 365 81 373 73 Q 437 19 470 -22 Q 482 -35 489 -33 Q 505 -32 532 -3 Q 590 57 589 171 Q 590 237 575 389 L 571 429 Q 562 519 555 563 L 547 611 Q 541 650 540 680 Q 540 699 528 706 Q 515 713 502 718 L 468 711 Q 486 687 506 600 L 513 554 Q 520 493 525 422 L 527 385 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 502 718 Q 550 731 590 746 Q 641 759 683 764 Q 701 763 706 771 Q 710 781 700 795 Q 679 814 634 837 Q 619 847 605 847 Q 596 844 594 832 Q 591 802 411 730 Q 365 714 310 696 Q 303 687 310 684 Q 328 678 449 707 Q 458 708 468 711 L 502 718 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 696 777 L 623 796 L 504 743 L 388 705 L 314 690\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"531 1062\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 555 563 Q 697 591 706 599 Q 716 606 711 616 Q 704 628 674 636 Q 644 643 547 611 L 506 600 Q 496 599 486 596 Q 413 580 327 574 Q 290 568 315 550 Q 358 528 428 540 Q 468 549 513 554 L 555 563 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 319 563 L 387 557 L 515 578 L 654 611 L 700 610\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"515 1030\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 575 389 Q 687 398 843 397 Q 927 394 935 406 Q 942 419 923 436 Q 863 479 820 471 Q 723 452 571 429 L 525 422 Q 513 422 503 420 Q 325 398 115 373 Q 90 372 108 351 Q 124 335 145 329 Q 169 322 187 328 Q 352 373 527 385 L 575 389 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 111 362 L 168 352 L 395 390 L 830 435 L 869 430 L 926 412\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"952 1904\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 527 385 Q 536 154 492 78 Q 488 69 479 66 Q 467 62 376 87 Q 369 88 366 85 Q 365 81 373 73 Q 437 19 470 -22 Q 482 -35 489 -33 Q 505 -32 532 -3 Q 590 57 589 171 Q 590 237 575 389 L 571 429 Q 562 519 555 563 L 547 611 Q 541 650 540 680 Q 540 699 528 706 Q 515 713 502 718 L 468 711 Q 486 687 506 600 L 513 554 Q 520 493 525 422 L 527 385 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 474 710 L 512 683 L 538 532 L 557 281 L 556 186 L 548 115 L 520 46 L 492 22 L 372 81\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"991 1982\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 888;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.97265625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1240;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.2591145833333333s both;\n          animation-delay: 0.97265625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 486;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6455078125s both;\n          animation-delay: 2.231770833333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 555;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.70166015625s both;\n          animation-delay: 2.877278645833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 349 664 Q 348 665 347 666 Q 322 687 292 696 Q 282 697 274 689 Q 270 682 279 670 Q 331 531 294 261 Q 287 216 271 169 Q 262 141 267 118 Q 277 81 291 65 Q 304 50 314 66 Q 324 79 332 102 L 339 137 Q 349 186 350 238 Q 350 316 351 391 L 352 420 Q 353 576 361 626 L 349 664 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 608 120 Q 641 78 665 39 Q 675 18 688 19 Q 707 20 724 59 Q 745 104 740 157 Q 728 310 721 593 Q 720 629 738 654 Q 748 669 738 681 Q 716 703 656 730 Q 635 740 617 729 Q 512 684 349 664 L 361 626 Q 410 635 590 672 Q 624 679 640 666 Q 691 615 658 164 Q 657 163 657 159 Q 653 143 640 144 L 608 120 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 351 391 Q 390 378 433 387 Q 493 399 554 411 Q 582 417 587 421 Q 596 428 591 437 Q 584 447 556 455 Q 531 461 450 435 Q 375 423 352 420 L 351 391 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 332 102 Q 345 98 361 100 Q 440 115 608 120 L 640 144 Q 633 153 614 166 Q 596 178 561 170 Q 438 146 339 137 L 332 102 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 349 664 Q 348 665 347 666 Q 322 687 292 696 Q 282 697 274 689 Q 270 682 279 670 Q 331 531 294 261 Q 287 216 271 169 Q 262 141 267 118 Q 277 81 291 65 Q 304 50 314 66 Q 324 79 332 102 L 339 137 Q 349 186 350 238 Q 350 316 351 391 L 352 420 Q 353 576 361 626 L 349 664 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 284 684 L 321 646 L 328 617 L 332 516 L 323 261 L 302 136 L 302 70\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"760 1520\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 608 120 Q 641 78 665 39 Q 675 18 688 19 Q 707 20 724 59 Q 745 104 740 157 Q 728 310 721 593 Q 720 629 738 654 Q 748 669 738 681 Q 716 703 656 730 Q 635 740 617 729 Q 512 684 349 664 L 361 626 Q 410 635 590 672 Q 624 679 640 666 Q 691 615 658 164 Q 657 163 657 159 Q 653 143 640 144 L 608 120 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 359 660 L 374 648 L 388 650 L 635 703 L 668 687 L 690 665 L 699 450 L 699 159 L 685 105 L 688 37\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1112 2224\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 351 391 Q 390 378 433 387 Q 493 399 554 411 Q 582 417 587 421 Q 596 428 591 437 Q 584 447 556 455 Q 531 461 450 435 Q 375 423 352 420 L 351 391 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 357 413 L 369 404 L 398 404 L 534 432 L 581 431\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"358 716\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 332 102 Q 345 98 361 100 Q 440 115 608 120 L 640 144 Q 633 153 614 166 Q 596 178 561 170 Q 438 146 339 137 L 332 102 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 340 106 L 355 119 L 432 130 L 585 147 L 632 143\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"427 854\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1111;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.1541341145833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1389;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.38037109375s both;\n          animation-delay: 1.1541341145833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 431;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6007486979166666s both;\n          animation-delay: 2.534505208333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 448;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6145833333333334s both;\n          animation-delay: 3.1352539062499996s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 398 390 Q 410 502 412 535 L 414 566 Q 417 717 420 735 L 405 766 Q 405 767 404 767 Q 353 791 337 787 Q 316 783 334 760 Q 373 697 357 455 Q 353 356 304 239 Q 271 154 155 37 Q 140 24 137 16 Q 136 9 148 10 Q 164 11 186 26 Q 246 69 281 112 Q 333 173 363 244 Q 382 296 394 361 L 398 390 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 420 735 Q 429 735 609 769 Q 631 773 637 762 Q 656 713 657 390 Q 657 128 640 101 Q 634 94 612 99 Q 581 105 549 111 Q 527 117 528 107 Q 595 55 633 16 Q 649 -3 665 -9 Q 675 -13 685 -2 Q 730 53 725 113 Q 712 321 709 657 Q 708 721 723 750 Q 736 772 723 783 Q 698 804 658 820 Q 639 827 621 820 Q 569 793 536 785 Q 493 773 405 766 L 420 735 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 412 535 Q 442 529 533 542 Q 587 551 594 554 Q 603 561 599 569 Q 592 579 566 587 Q 538 594 511 583 Q 487 576 462 572 Q 440 568 414 566 L 412 535 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 394 361 Q 428 351 561 374 Q 564 375 568 375 Q 590 379 594 382 Q 603 389 599 397 Q 592 407 566 415 Q 538 421 511 411 Q 484 404 456 397 Q 428 393 398 390 L 394 361 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 398 390 Q 410 502 412 535 L 414 566 Q 417 717 420 735 L 405 766 Q 405 767 404 767 Q 353 791 337 787 Q 316 783 334 760 Q 373 697 357 455 Q 353 356 304 239 Q 271 154 155 37 Q 140 24 137 16 Q 136 9 148 10 Q 164 11 186 26 Q 246 69 281 112 Q 333 173 363 244 Q 382 296 394 361 L 398 390 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 339 773 L 379 742 L 387 685 L 385 504 L 366 342 L 341 259 L 296 169 L 236 93 L 184 43 L 145 17\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"983 1966\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 420 735 Q 429 735 609 769 Q 631 773 637 762 Q 656 713 657 390 Q 657 128 640 101 Q 634 94 612 99 Q 581 105 549 111 Q 527 117 528 107 Q 595 55 633 16 Q 649 -3 665 -9 Q 675 -13 685 -2 Q 730 53 725 113 Q 712 321 709 657 Q 708 721 723 750 Q 736 772 723 783 Q 698 804 658 820 Q 639 827 621 820 Q 569 793 536 785 Q 493 773 405 766 L 420 735 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 415 764 L 429 752 L 503 762 L 634 796 L 666 780 L 681 758 L 687 291 L 683 93 L 664 56 L 632 63 L 538 104\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1261 2522\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 412 535 Q 442 529 533 542 Q 587 551 594 554 Q 603 561 599 569 Q 592 579 566 587 Q 538 594 511 583 Q 487 576 462 572 Q 440 568 414 566 L 412 535 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 417 542 L 430 550 L 535 566 L 588 564\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"303 606\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 394 361 Q 428 351 561 374 Q 564 375 568 375 Q 590 379 594 382 Q 603 389 599 397 Q 592 407 566 415 Q 538 421 511 411 Q 484 404 456 397 Q 428 393 398 390 L 394 361 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 399 368 L 413 375 L 535 394 L 588 392\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"320 640\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 801;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.90185546875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1132;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1712239583333333s both;\n          animation-delay: 0.90185546875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 790;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8929036458333334s both;\n          animation-delay: 2.073079427083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 836;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.9303385416666666s both;\n          animation-delay: 2.9659830729166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 524 533 Q 537 536 755 560 Q 768 557 779 573 Q 780 586 754 600 Q 709 627 634 603 Q 526 582 524 580 L 479 572 Q 404 563 234 546 Q 200 542 226 521 Q 265 491 291 494 Q 309 503 446 521 L 524 533 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 524 580 Q 524 682 544 758 Q 559 783 532 802 Q 516 814 485 833 Q 460 851 439 834 Q 433 828 440 813 Q 474 762 476 711 Q 477 647 479 572 L 477 458 Q 474 208 466 155 Q 442 46 456 5 Q 460 -7 466 -21 Q 473 -40 481 -43 Q 488 -50 495 -41 Q 504 -37 514 -15 Q 524 10 523 44 Q 522 90 523 480 L 524 580 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 446 521 Q 368 337 127 132 Q 114 119 124 117 Q 134 113 146 119 Q 276 176 403 344 Q 472 450 477 458 L 478.19215155615694 525.9526387009472 L 446 521 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 523 480 Q 607 338 716 186 Q 737 159 774 157 Q 901 147 942 150 Q 954 151 957 157 Q 957 164 941 173 Q 773 251 721 302 Q 628 398 523 532 Q 523 533 524 533 L 523.5292758089369 532.9275808936826 L 523 480 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 524 533 Q 537 536 755 560 Q 768 557 779 573 Q 780 586 754 600 Q 709 627 634 603 Q 526 582 524 580 L 479 572 Q 404 563 234 546 Q 200 542 226 521 Q 265 491 291 494 Q 309 503 446 521 L 524 533 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 228 534 L 280 522 L 695 584 L 728 584 L 766 574\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"673 1346\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 524 580 Q 524 682 544 758 Q 559 783 532 802 Q 516 814 485 833 Q 460 851 439 834 Q 433 828 440 813 Q 474 762 476 711 Q 477 647 479 572 L 477 458 Q 474 208 466 155 Q 442 46 456 5 Q 460 -7 466 -21 Q 473 -40 481 -43 Q 488 -50 495 -41 Q 504 -37 514 -15 Q 524 10 523 44 Q 522 90 523 480 L 524 580 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 453 825 L 506 771 L 498 218 L 486 -29\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1004 2008\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 446 521 Q 368 337 127 132 Q 114 119 124 117 Q 134 113 146 119 Q 276 176 403 344 Q 472 450 477 458 L 478.19215155615694 525.9526387009472 L 446 521 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 474 519 L 459 504 L 447 460 L 404 389 L 332 297 L 244 206 L 179 154 L 130 124\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"662 1324\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 523 480 Q 607 338 716 186 Q 737 159 774 157 Q 901 147 942 150 Q 954 151 957 157 Q 957 164 941 173 Q 773 251 721 302 Q 628 398 523 532 Q 523 533 524 533 L 523.5292758089369 532.9275808936826 L 523 480 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 528 513 L 549 470 L 641 344 L 749 220 L 789 200 L 951 159\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"708 1416\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 447;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.61376953125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 424;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.5950520833333334s both;\n          animation-delay: 0.61376953125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 679;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8025716145833334s both;\n          animation-delay: 1.2088216145833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 438 711 Q 478 680 523 641 Q 539 626 558 627 Q 571 628 576 644 Q 580 663 569 697 Q 562 724 519 743 Q 420 774 404 768 Q 398 762 400 747 Q 404 734 438 711 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 326 514 Q 402 442 444 427 Q 460 426 470 440 Q 477 455 472 474 Q 453 525 338 557 Q 319 561 309 557 Q 302 556 306 542 Q 307 529 326 514 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 362 145 Q 349 144 347 124 Q 350 39 384 13 Q 391 4 402 6 Q 411 6 416 33 Q 440 100 592 354 Q 602 370 602 377 Q 603 387 592 382 Q 579 376 424 197 Q 385 158 362 145 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 438 711 Q 478 680 523 641 Q 539 626 558 627 Q 571 628 576 644 Q 580 663 569 697 Q 562 724 519 743 Q 420 774 404 768 Q 398 762 400 747 Q 404 734 438 711 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 408 761 L 422 748 L 510 704 L 530 687 L 556 647\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"319 638\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 326 514 Q 402 442 444 427 Q 460 426 470 440 Q 477 455 472 474 Q 453 525 338 557 Q 319 561 309 557 Q 302 556 306 542 Q 307 529 326 514 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 317 548 L 423 480 L 442 463 L 448 448\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"296 592\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 362 145 Q 349 144 347 124 Q 350 39 384 13 Q 391 4 402 6 Q 411 6 416 33 Q 440 100 592 354 Q 602 370 602 377 Q 603 387 592 382 Q 579 376 424 197 Q 385 158 362 145 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 398 19 L 391 46 L 397 108 L 595 375\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"551 1102\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 433;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6023763020833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 522;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6748046875s both;\n          animation-delay: 0.6023763020833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1177;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.2078450520833333s both;\n          animation-delay: 1.2771809895833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 837;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.93115234375s both;\n          animation-delay: 2.485026041666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 226 483 Q 254 443 285 393 Q 295 375 312 372 Q 324 369 333 381 Q 342 396 342 430 Q 342 472 235 536 Q 220 543 213 543 Q 206 540 204 526 Q 205 513 226 483 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 690 568 Q 677 547 584 441 Q 571 422 592 425 Q 638 449 738 513 Q 762 532 791 543 Q 816 553 805 575 Q 789 597 759 615 Q 731 633 715 629 Q 700 628 704 612 Q 708 590 690 568 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 511 382 Q 520 439 529 618 Q 530 669 548 728 Q 554 741 543 750 Q 521 769 479 785 Q 454 795 434 789 Q 410 779 430 759 Q 464 725 465 690 Q 469 500 448 374 Q 427 209 284 106 Q 244 81 186 49 Q 170 43 167 39 Q 160 32 179 29 Q 197 28 258 48 Q 301 61 365 101 Q 414 131 442 172 Q 484 232 504 341 L 511 382 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 504 341 Q 597 175 715 40 Q 740 9 767 9 Q 843 13 911 17 Q 939 18 940 25 Q 941 32 910 48 Q 753 117 709 157 Q 592 268 511 382 L 504 341 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 226 483 Q 254 443 285 393 Q 295 375 312 372 Q 324 369 333 381 Q 342 396 342 430 Q 342 472 235 536 Q 220 543 213 543 Q 206 540 204 526 Q 205 513 226 483 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 216 534 L 299 440 L 316 391\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"305 610\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 690 568 Q 677 547 584 441 Q 571 422 592 425 Q 638 449 738 513 Q 762 532 791 543 Q 816 553 805 575 Q 789 597 759 615 Q 731 633 715 629 Q 700 628 704 612 Q 708 590 690 568 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 714 618 L 736 593 L 744 571 L 696 522 L 587 433\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"394 788\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 511 382 Q 520 439 529 618 Q 530 669 548 728 Q 554 741 543 750 Q 521 769 479 785 Q 454 795 434 789 Q 410 779 430 759 Q 464 725 465 690 Q 469 500 448 374 Q 427 209 284 106 Q 244 81 186 49 Q 170 43 167 39 Q 160 32 179 29 Q 197 28 258 48 Q 301 61 365 101 Q 414 131 442 172 Q 484 232 504 341 L 511 382 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 436 773 L 475 753 L 497 733 L 503 713 L 488 443 L 470 321 L 456 275 L 418 195 L 368 138 L 279 78 L 174 36\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1049 2098\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 504 341 Q 597 175 715 40 Q 740 9 767 9 Q 843 13 911 17 Q 939 18 940 25 Q 941 32 910 48 Q 753 117 709 157 Q 592 268 511 382 L 504 341 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 513 375 L 521 341 L 606 223 L 689 127 L 745 76 L 768 60 L 934 25\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"709 1418\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 731;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8448893229166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 824;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.9205729166666666s both;\n          animation-delay: 0.8448893229166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 386;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5641276041666666s both;\n          animation-delay: 1.7654622395833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 435;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.60400390625s both;\n          animation-delay: 2.32958984375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 382;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5608723958333334s both;\n          animation-delay: 2.93359375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 374;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.5543619791666666s both;\n          animation-delay: 3.4944661458333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 495 503 Q 472 503 398 502 Q 374 502 376 512 Q 377 517 404 559 Q 465 649 508 705 Q 509 706 510 706 Q 521 722 521 731 Q 518 746 478 778 Q 467 788 457 789 L 441 789 Q 431 786 435 776 Q 441 760 438 739 Q 435 714 414 665 Q 388 608 366.5 572.5 Q 345 537 314 511 Q 296 496 297 482 Q 298 478 300 470 Q 314 434 335 439 Q 341 441 356 449 Q 396 468 478 478 L 495 503 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 561 363 Q 499 351 426 329 Q 410 322 412 329 Q 412 332 419 343 Q 451 388 555 502 Q 588 542 613 563 Q 625 572 623 580 Q 620 585 617 589 Q 606 608 575 626 Q 560 637 548 634 Q 547 633 546 633 Q 541 631 540 621 Q 535 573 495 503 L 478 478 Q 476 478 476 476 Q 363 327 334 314 Q 327 308 323 302 Q 321 298 321 288 Q 323 274 351 253 Q 364 240 378 253 Q 450 305 570 345 L 561 363 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 570 345 Q 592 302 608 295 Q 610 295 611 295 Q 631 295 634 340 Q 633 368 588 401 Q 557 423 544 424 Q 540 423 537 412 Q 537 402 561 363 L 570 345 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 300 137 L 351 29 Q 359 18 369 12 Q 372 11 377 12 Q 397 15 402 59 Q 408 98 325 172 L 316 182 Q 301 192 296 192 Q 294 192 293 190 Q 280 183 292 155 L 300 137 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 431 176 Q 447 155 470 114 Q 482 100 495 98 Q 515 94 515 143 Q 514 172 437 218 Q 426 224 423 224 Q 416 224 414 210 Q 414 199 431 176 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 536 269 Q 531 265 529 254 Q 531 245 539 234 Q 574 188 587 169 Q 592 161 598 157 Q 612 148 620 156 Q 625 159 627 165 Q 630 172 630 200 Q 628 219 590 245 Q 554 269 536 269 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 495 503 Q 472 503 398 502 Q 374 502 376 512 Q 377 517 404 559 Q 465 649 508 705 Q 509 706 510 706 Q 521 722 521 731 Q 518 746 478 778 Q 467 788 457 789 L 441 789 Q 431 786 435 776 Q 441 760 438 739 Q 435 714 414 665 Q 388 608 366.5 572.5 Q 345 537 314 511 Q 296 496 297 482 Q 298 478 300 470 Q 314 434 335 439 Q 341 441 356 449 Q 396 468 478 478 L 495 503 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 445 779 L 469 749 L 474 723 L 420 621 L 354 520 L 346 487 L 395 482 L 467 488 L 483 497\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"603 1206\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 561 363 Q 499 351 426 329 Q 410 322 412 329 Q 412 332 419 343 Q 451 388 555 502 Q 588 542 613 563 Q 625 572 623 580 Q 620 585 617 589 Q 606 608 575 626 Q 560 637 548 634 Q 547 633 546 633 Q 541 631 540 621 Q 535 573 495 503 L 478 478 Q 476 478 476 476 Q 363 327 334 314 Q 327 308 323 302 Q 321 298 321 288 Q 323 274 351 253 Q 364 240 378 253 Q 450 305 570 345 L 561 363 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 553 622 L 571 578 L 505 477 L 394 342 L 384 315 L 386 302 L 433 309 L 542 348 L 554 351 L 560 346\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"696 1392\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 570 345 Q 592 302 608 295 Q 610 295 611 295 Q 631 295 634 340 Q 633 368 588 401 Q 557 423 544 424 Q 540 423 537 412 Q 537 402 561 363 L 570 345 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 546 415 L 603 345 L 610 306\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"258 516\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 300 137 L 351 29 Q 359 18 369 12 Q 372 11 377 12 Q 397 15 402 59 Q 408 98 325 172 L 316 182 Q 301 192 296 192 Q 294 192 293 190 Q 280 183 292 155 L 300 137 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 298 186 L 368 72 L 373 27\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"307 614\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 431 176 Q 447 155 470 114 Q 482 100 495 98 Q 515 94 515 143 Q 514 172 437 218 Q 426 224 423 224 Q 416 224 414 210 Q 414 199 431 176 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 426 212 L 487 142 L 498 111\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"254 508\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 536 269 Q 531 265 529 254 Q 531 245 539 234 Q 574 188 587 169 Q 592 161 598 157 Q 612 148 620 156 Q 625 159 627 165 Q 630 172 630 200 Q 628 219 590 245 Q 554 269 536 269 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 540 262 L 595 206 L 610 169\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"246 492\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 960;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.03125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 507;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.66259765625s both;\n          animation-delay: 1.03125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 556;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7024739583333334s both;\n          animation-delay: 1.69384765625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 636 396 Q 742 405 846 394 Q 864 391 870 403 Q 876 416 861 433 Q 809 482 712 460 Q 684 457 653 451 L 595 443 Q 505 433 405 421 L 353 416 Q 265 409 167 401 Q 133 398 156 380 Q 201 350 287 361 Q 323 370 361 375 L 407 382 Q 437 392 586 395 L 636 396 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 405 421 Q 404 455 403 483 Q 406 505 384 511 Q 345 535 319 527 Q 300 518 315 497 Q 342 460 353 416 L 361 375 Q 365 347 368 319 Q 374 297 387 281 Q 400 268 406 281 Q 410 297 407 382 L 405 421 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 586 395 Q 568 301 569 288 Q 572 272 588 286 Q 603 302 636 396 L 653 451 Q 660 479 679 514 Q 692 530 681 541 Q 666 557 628 574 Q 610 583 592 572 Q 582 565 591 553 Q 606 523 595 443 L 586 395 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 636 396 Q 742 405 846 394 Q 864 391 870 403 Q 876 416 861 433 Q 809 482 712 460 Q 684 457 653 451 L 595 443 Q 505 433 405 421 L 353 416 Q 265 409 167 401 Q 133 398 156 380 Q 201 350 287 361 Q 323 370 361 375 L 407 382 Q 437 392 586 395 L 636 396 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 159 392 L 190 384 L 257 383 L 465 410 L 759 434 L 819 427 L 855 411\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"832 1664\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 405 421 Q 404 455 403 483 Q 406 505 384 511 Q 345 535 319 527 Q 300 518 315 497 Q 342 460 353 416 L 361 375 Q 365 347 368 319 Q 374 297 387 281 Q 400 268 406 281 Q 410 297 407 382 L 405 421 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 325 511 L 361 487 L 369 475 L 397 284\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"379 758\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 586 395 Q 568 301 569 288 Q 572 272 588 286 Q 603 302 636 396 L 653 451 Q 660 479 679 514 Q 692 530 681 541 Q 666 557 628 574 Q 610 583 592 572 Q 582 565 591 553 Q 606 523 595 443 L 586 395 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 598 562 L 611 558 L 639 523 L 611 392 L 579 289\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"428 856\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 406;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5804036458333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 670;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7952473958333334s both;\n          animation-delay: 0.5804036458333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 439;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6072591145833334s both;\n          animation-delay: 1.3756510416666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 424;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5950520833333334s both;\n          animation-delay: 1.98291015625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 487;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6463216145833334s both;\n          animation-delay: 2.5779622395833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 571;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.7146809895833334s both;\n          animation-delay: 3.224283854166667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 438;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.6064453125s both;\n          animation-delay: 3.9389648437500004s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 340 778 L 412 731 Q 437 711 453 727 Q 457 731 459 739 Q 462 756 447 785 Q 429 821 327 828 Q 311 829 306 826 Q 302 822 303 808 Q 310 798 340 778 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 84 572 Q 72 571 67 561 Q 65 551 81 538 Q 129 510 170 527 Q 294 575 432 602 Q 480 612 486 616 Q 488 619 488 621 Q 488 639 459 648 Q 434 655 415 649 Q 174 582 84 572 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 255 468 Q 237 463 261 450 Q 270 444 287 449 L 431 486 Q 457 495 442 508 Q 429 519 404 521 Q 375 521 255 468 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 263 365 Q 245 359 269 345 Q 275 339 302 345 Q 364 361 425 374 Q 451 381 439 394 Q 427 406 400 410 Q 372 411 263 365 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 233 245 Q 190 257 184 254 Q 182 253 182 252 Q 174 246 184 229 Q 210 176 225 81 Q 229 54 245 36 Q 263 14 268.5 29.5 Q 274 45 270 77 L 265 112 Q 252 196 252 218 L 233 245 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 423 141 Q 439 212 461 231 Q 482 259 459 272 Q 453 274 418 294 Q 398 307 382 302 Q 368 299 349 284 Q 302 263 233 245 L 252 218 Q 257 220 347 245 Q 374 252 381 242 Q 390 235 370 149 Q 370 145 369 143 L 423 141 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 270 77 Q 278 77 302 84 Q 347 96 439 110 Q 449 111 451 121 Q 451 127 423 141 L 369 143 Q 316 125 265 112 L 270 77 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 340 778 L 412 731 Q 437 711 453 727 Q 457 731 459 739 Q 462 756 447 785 Q 429 821 327 828 Q 311 829 306 826 Q 302 822 303 808 Q 310 798 340 778 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 312 820 L 409 775 L 437 742\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"278 556\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 84 572 Q 72 571 67 561 Q 65 551 81 538 Q 129 510 170 527 Q 294 575 432 602 Q 480 612 486 616 Q 488 619 488 621 Q 488 639 459 648 Q 434 655 415 649 Q 174 582 84 572 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 78 558 L 144 551 L 410 624 L 447 629 L 481 621\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"542 1084\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 255 468 Q 237 463 261 450 Q 270 444 287 449 L 431 486 Q 457 495 442 508 Q 429 519 404 521 Q 375 521 255 468 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 257 459 L 397 499 L 434 498\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"311 622\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 263 365 Q 245 359 269 345 Q 275 339 302 345 Q 364 361 425 374 Q 451 381 439 394 Q 427 406 400 410 Q 372 411 263 365 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 266 355 L 376 385 L 404 390 L 429 386\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"296 592\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 233 245 Q 190 257 184 254 Q 182 253 182 252 Q 174 246 184 229 Q 210 176 225 81 Q 229 54 245 36 Q 263 14 268.5 29.5 Q 274 45 270 77 L 265 112 Q 252 196 252 218 L 233 245 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 187 249 L 216 222 L 225 203 L 258 36\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"359 718\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 423 141 Q 439 212 461 231 Q 482 259 459 272 Q 453 274 418 294 Q 398 307 382 302 Q 368 299 349 284 Q 302 263 233 245 L 252 218 Q 257 220 347 245 Q 374 252 381 242 Q 390 235 370 149 Q 370 145 369 143 L 423 141 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 242 245 L 258 236 L 379 273 L 397 270 L 412 259 L 422 246 L 402 168 L 384 160 L 376 145\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"443 886\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 270 77 Q 278 77 302 84 Q 347 96 439 110 Q 449 111 451 121 Q 451 127 423 141 L 369 143 Q 316 125 265 112 L 270 77 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 273 83 L 284 97 L 375 122 L 416 125 L 444 120\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"310 620\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 404;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5787760416666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 789;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.89208984375s both;\n          animation-delay: 0.5787760416666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1111;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1541341145833333s both;\n          animation-delay: 1.4708658854166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 239 734 Q 267 712 297 686 Q 313 673 332 675 Q 344 676 348 692 Q 352 710 340 743 Q 325 776 229 788 Q 210 791 204 787 Q 198 783 201 768 Q 207 755 239 734 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 292 201 Q 307 210 312 229 Q 319 269 276 345 Q 246 406 329 498 Q 351 517 332 532 Q 311 548 277 563 Q 255 576 237 558 Q 206 536 166 521 Q 114 499 96 502 Q 89 502 86 497 Q 85 493 93 488 Q 135 467 227 505 Q 237 508 245 498 Q 267 474 244 446 Q 190 394 236 331 Q 281 246 270 206 Q 269 205 268 202 L 292 201 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 268 202 Q 225 203 180 188 Q 146 175 94 169 Q 87 169 84 160 Q 81 153 90 143 Q 108 125 132 114 Q 144 108 162 123 Q 225 174 296 161 Q 363 146 497 86 Q 722 -17 808 5 Q 809 6 812 6 Q 875 28 928 65 Q 952 80 927 80 Q 708 80 569 113 Q 481 138 369 181 Q 332 197 292 201 L 268 202 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 239 734 Q 267 712 297 686 Q 313 673 332 675 Q 344 676 348 692 Q 352 710 340 743 Q 325 776 229 788 Q 210 791 204 787 Q 198 783 201 768 Q 207 755 239 734 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 211 779 L 296 735 L 329 694\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"276 552\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 292 201 Q 307 210 312 229 Q 319 269 276 345 Q 246 406 329 498 Q 351 517 332 532 Q 311 548 277 563 Q 255 576 237 558 Q 206 536 166 521 Q 114 499 96 502 Q 89 502 86 497 Q 85 493 93 488 Q 135 467 227 505 Q 237 508 245 498 Q 267 474 244 446 Q 190 394 236 331 Q 281 246 270 206 Q 269 205 268 202 L 292 201 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 93 495 L 133 493 L 247 531 L 270 526 L 286 512 L 279 470 L 248 413 L 241 385 L 249 350 L 272 309 L 290 254 L 292 230 L 287 215 L 278 209\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"661 1322\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 268 202 Q 225 203 180 188 Q 146 175 94 169 Q 87 169 84 160 Q 81 153 90 143 Q 108 125 132 114 Q 144 108 162 123 Q 225 174 296 161 Q 363 146 497 86 Q 722 -17 808 5 Q 809 6 812 6 Q 875 28 928 65 Q 952 80 927 80 Q 708 80 569 113 Q 481 138 369 181 Q 332 197 292 201 L 268 202 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 97 156 L 140 145 L 194 170 L 234 181 L 298 181 L 354 166 L 559 87 L 697 52 L 795 43 L 889 61 L 918 72\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"983 1966\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 849;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.94091796875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 404;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.5787760416666666s both;\n          animation-delay: 0.94091796875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 492;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.650390625s both;\n          animation-delay: 1.5196940104166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 535;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6853841145833334s both;\n          animation-delay: 2.1700846354166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 592;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7317708333333334s both;\n          animation-delay: 2.85546875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 372;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.552734375s both;\n          animation-delay: 3.5872395833333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 389;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.5665690104166666s both;\n          animation-delay: 4.139973958333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 666;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.7919921875s both;\n          animation-delay: 4.706542968750001s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 371 698 Q 390 725 409 744 Q 414 749 416 754 Q 420 772 378 808 Q 351 826 331 825 Q 312 823 319 801 Q 335 765 321 735 Q 306 697 284 659 Q 212 519 71 353 Q 61 342 59 336 Q 58 335 58 334 Q 55 324 69 327 Q 122 333 284 559 Q 345 647 357 674 L 371 698 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 357 674 Q 364 668 372 662 Q 426 623 462 595 Q 472 586 482 586 Q 496 585 499 598 Q 503 612 494 635 Q 482 672 371 698 L 357 674 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 339 447 Q 455 484 456 484 Q 463 494 458 502 Q 454 508 439 514 Q 400 527 359 506 Q 305 480 235 468 Q 225 466 220 463 Q 204 454 225 445 Q 255 433 298 435 L 339 447 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 312 349 L 184 310 Q 166 305 190 288 Q 203 278 229 285 L 312 304 L 361 316 Q 419 329 456 336 Q 483 342 472 357 Q 443 391 363 367 L 312 349 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 363 367 L 366 410 Q 365 427 339 447 L 298 435 Q 307 416 312 349 L 312 304 L 312 110 L 355 122 Q 357 229 361 316 L 363 367 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 161 225 Q 163 218 173 207 Q 210 172 231 149 Q 241 137 256 137 Q 258 137 260 138 Q 278 144 269 188 Q 264 206 239 219 Q 178 244 165 239 Q 161 236 161 225 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 427 280 Q 429 276 429 271 Q 427 253 388 188 Q 383 180 388 175 Q 395 175 400 180 Q 459 229 486 247 L 490 249 Q 508 261 472 286 Q 455 300 437 298 Q 424 298 427 280 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 312 110 L 174 74 Q 154 67 117 69 Q 103 67 100 57 Q 97 44 108 34 Q 127 20 165 -3 Q 174 -7 188 2 Q 190 4 192 5 Q 227 27 357 80 Q 472 127 494 143 Q 508 151 508 161 Q 504 167 490 165 L 355 122 L 312 110 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 371 698 Q 390 725 409 744 Q 414 749 416 754 Q 420 772 378 808 Q 351 826 331 825 Q 312 823 319 801 Q 335 765 321 735 Q 306 697 284 659 Q 212 519 71 353 Q 61 342 59 336 Q 58 335 58 334 Q 55 324 69 327 Q 122 333 284 559 Q 345 647 357 674 L 371 698 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 331 810 L 349 796 L 369 761 L 322 668 L 258 561 L 188 464 L 121 384 L 64 332\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"721 1442\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 357 674 Q 364 668 372 662 Q 426 623 462 595 Q 472 586 482 586 Q 496 585 499 598 Q 503 612 494 635 Q 482 672 371 698 L 357 674 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 366 677 L 381 678 L 432 652 L 461 633 L 485 600\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"276 552\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 339 447 Q 455 484 456 484 Q 463 494 458 502 Q 454 508 439 514 Q 400 527 359 506 Q 305 480 235 468 Q 225 466 220 463 Q 204 454 225 445 Q 255 433 298 435 L 339 447 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 223 454 L 299 458 L 417 496 L 453 491\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"364 728\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 312 349 L 184 310 Q 166 305 190 288 Q 203 278 229 285 L 312 304 L 361 316 Q 419 329 456 336 Q 483 342 472 357 Q 443 391 363 367 L 312 349 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 188 299 L 232 304 L 399 351 L 435 354 L 460 349\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"407 814\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 363 367 L 366 410 Q 365 427 339 447 L 298 435 Q 307 416 312 349 L 312 304 L 312 110 L 355 122 Q 357 229 361 316 L 363 367 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 306 434 L 335 411 L 337 390 L 334 139 L 318 117\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"464 928\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 161 225 Q 163 218 173 207 Q 210 172 231 149 Q 241 137 256 137 Q 258 137 260 138 Q 278 144 269 188 Q 264 206 239 219 Q 178 244 165 239 Q 161 236 161 225 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 170 230 L 238 185 L 254 154\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"244 488\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 427 280 Q 429 276 429 271 Q 427 253 388 188 Q 383 180 388 175 Q 395 175 400 180 Q 459 229 486 247 L 490 249 Q 508 261 472 286 Q 455 300 437 298 Q 424 298 427 280 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 437 286 L 456 261 L 392 182\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"261 522\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 312 110 L 174 74 Q 154 67 117 69 Q 103 67 100 57 Q 97 44 108 34 Q 127 20 165 -3 Q 174 -7 188 2 Q 190 4 192 5 Q 227 27 357 80 Q 472 127 494 143 Q 508 151 508 161 Q 504 167 490 165 L 355 122 L 312 110 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 116 52 L 172 36 L 361 101 L 502 158\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"538 1076\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 614;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7496744791666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1167;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.19970703125s both;\n          animation-delay: 0.7496744791666666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 368 617 Q 399 542 374 347 Q 365 308 395 274 Q 405 264 415 274 Q 433 301 434 382 Q 434 539 442 586 Q 449 608 428 620 Q 388 647 373 639 Q 364 632 368 617 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 569 703 Q 573 667 578 123 Q 578 101 565 91 Q 556 84 534 91 Q 507 98 482 103 Q 448 115 451 104 Q 452 97 473 82 Q 543 30 560 -1 Q 581 -37 598 -37 Q 613 -38 628 -2 Q 646 46 642 122 Q 623 357 626 593 Q 627 684 641 732 Q 657 763 600 785 Q 564 804 545 796 Q 526 789 544 766 Q 566 738 569 703 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 368 617 Q 399 542 374 347 Q 365 308 395 274 Q 405 264 415 274 Q 433 301 434 382 Q 434 539 442 586 Q 449 608 428 620 Q 388 647 373 639 Q 364 632 368 617 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 380 628 L 410 593 L 409 417 L 401 326 L 405 282\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"486 972\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 569 703 Q 573 667 578 123 Q 578 101 565 91 Q 556 84 534 91 Q 507 98 482 103 Q 448 115 451 104 Q 452 97 473 82 Q 543 30 560 -1 Q 581 -37 598 -37 Q 613 -38 628 -2 Q 646 46 642 122 Q 623 357 626 593 Q 627 684 641 732 Q 657 763 600 785 Q 564 804 545 796 Q 526 789 544 766 Q 566 738 569 703 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 551 781 L 569 773 L 602 740 L 599 453 L 608 95 L 589 46 L 558 54 L 489 85 L 471 95 L 469 102 L 458 102\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1039 2078\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 419;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5909830729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 458;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6227213541666666s both;\n          animation-delay: 0.5909830729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 960;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.03125s both;\n          animation-delay: 1.2137044270833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 445 567 Q 476 539 509 504 Q 524 489 542 489 Q 554 490 560 505 Q 567 521 557 556 Q 551 578 516 597 Q 431 628 416 623 Q 410 619 411 604 Q 415 591 445 567 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 232 316 Q 247 359 257 385 L 261 417 Q 261 418 261 419 Q 249 443 238 451 Q 219 466 217 440 Q 220 410 190 367 Q 135 303 166 253 L 167 251 Q 182 224 202 252 Q 220 277 232 316 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 257 385 Q 284 370 322 378 Q 437 412 694 434 Q 769 441 774 421 Q 774 418 720 341 Q 711 329 717 324 Q 724 320 740 329 Q 803 363 852 372 Q 894 382 893 391 Q 893 401 825 463 Q 803 485 729 473 Q 579 458 371 429 Q 316 422 261 417 L 257 385 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 445 567 Q 476 539 509 504 Q 524 489 542 489 Q 554 490 560 505 Q 567 521 557 556 Q 551 578 516 597 Q 431 628 416 623 Q 410 619 411 604 Q 415 591 445 567 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 420 616 L 514 554 L 539 510\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"291 582\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 232 316 Q 247 359 257 385 L 261 417 Q 261 418 261 419 Q 249 443 238 451 Q 219 466 217 440 Q 220 410 190 367 Q 135 303 166 253 L 167 251 Q 182 224 202 252 Q 220 277 232 316 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 228 445 L 238 415 L 236 404 L 191 304 L 183 255\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"330 660\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 257 385 Q 284 370 322 378 Q 437 412 694 434 Q 769 441 774 421 Q 774 418 720 341 Q 711 329 717 324 Q 724 320 740 329 Q 803 363 852 372 Q 894 382 893 391 Q 893 401 825 463 Q 803 485 729 473 Q 579 458 371 429 Q 316 422 261 417 L 257 385 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 270 411 L 279 398 L 311 399 L 469 427 L 670 450 L 742 456 L 795 445 L 810 429 L 817 410 L 722 329\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"832 1664\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 800;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9010416666666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1177;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.2078450520833333s both;\n          animation-delay: 0.9010416666666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 494;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6520182291666666s both;\n          animation-delay: 2.10888671875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 503;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6593424479166666s both;\n          animation-delay: 2.7609049479166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 557;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7032877604166666s both;\n          animation-delay: 3.420247395833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 602;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.7399088541666666s both;\n          animation-delay: 4.12353515625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 568;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.7122395833333334s both;\n          animation-delay: 4.863444010416667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 363 751 Q 350 764 327 771 Q 317 777 303 772 Q 296 766 302 753 Q 320 675 322 672 Q 322 668 323 660 Q 338 468 308 335 Q 290 277 332 226 Q 344 211 355 225 Q 367 241 368 259 L 372 301 Q 372 314 373 419 L 373 453 Q 374 516 375 562 L 376 591 Q 376 705 380 712 L 363 751 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 640 286 Q 671 246 693 207 Q 703 186 716 187 Q 735 188 753 226 Q 775 271 771 324 Q 764 447 759 672 Q 758 709 777 735 Q 787 750 777 762 Q 755 784 694 813 Q 673 823 655 813 Q 553 771 363 751 L 380 712 Q 401 713 626 754 Q 662 760 679 746 Q 709 722 696 431 Q 695 352 688 328 Q 684 315 674 313 L 640 286 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 375 562 Q 387 559 405 562 Q 522 583 608 595 Q 636 599 625 615 Q 613 631 583 637 Q 555 641 507 628 Q 437 607 376 591 L 375 562 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 373 419 Q 379 419 388 420 Q 517 439 611 452 Q 639 456 629 471 Q 617 489 588 494 Q 555 500 373 453 L 373 419 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 368 259 Q 374 259 381 260 Q 465 276 640 286 L 674 313 Q 665 322 648 334 Q 629 346 592 338 Q 471 313 372 301 L 368 259 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 401 209 Q 371 128 175 1 Q 148 -12 181 -13 Q 257 -16 416 106 Q 434 124 479 158 Q 494 171 492 182 Q 491 198 461 210 Q 430 226 415 224 Q 406 223 401 209 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 594 174 Q 669 98 758 -14 Q 774 -39 793 -46 Q 803 -49 813 -37 Q 829 -22 818 32 Q 805 107 602 209 Q 599 212 597 212 Q 587 219 584 204 Q 583 188 594 174 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 363 751 Q 350 764 327 771 Q 317 777 303 772 Q 296 766 302 753 Q 320 675 322 672 Q 322 668 323 660 Q 338 468 308 335 Q 290 277 332 226 Q 344 211 355 225 Q 367 241 368 259 L 372 301 Q 372 314 373 419 L 373 453 Q 374 516 375 562 L 376 591 Q 376 705 380 712 L 363 751 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 311 763 L 338 732 L 350 668 L 350 462 L 337 303 L 344 231\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"672 1344\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 640 286 Q 671 246 693 207 Q 703 186 716 187 Q 735 188 753 226 Q 775 271 771 324 Q 764 447 759 672 Q 758 709 777 735 Q 787 750 777 762 Q 755 784 694 813 Q 673 823 655 813 Q 553 771 363 751 L 380 712 Q 401 713 626 754 Q 662 760 679 746 Q 709 722 696 431 Q 695 352 688 328 Q 684 315 674 313 L 640 286 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 373 748 L 385 737 L 405 735 L 672 785 L 703 771 L 730 743 L 731 339 L 726 301 L 715 273 L 716 205\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1049 2098\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 375 562 Q 387 559 405 562 Q 522 583 608 595 Q 636 599 625 615 Q 613 631 583 637 Q 555 641 507 628 Q 437 607 376 591 L 375 562 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 383 569 L 401 580 L 538 610 L 585 614 L 614 607\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"366 732\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 373 419 Q 379 419 388 420 Q 517 439 611 452 Q 639 456 629 471 Q 617 489 588 494 Q 555 500 373 453 L 373 419 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 380 425 L 393 440 L 514 463 L 573 471 L 617 464\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"375 750\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 368 259 Q 374 259 381 260 Q 465 276 640 286 L 674 313 Q 665 322 648 334 Q 629 346 592 338 Q 471 313 372 301 L 368 259 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 374 265 L 396 284 L 605 312 L 666 311\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"429 858\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 401 209 Q 371 128 175 1 Q 148 -12 181 -13 Q 257 -16 416 106 Q 434 124 479 158 Q 494 171 492 182 Q 491 198 461 210 Q 430 226 415 224 Q 406 223 401 209 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 471 180 L 432 175 L 387 125 L 308 62 L 244 22 L 186 -3\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"474 948\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 594 174 Q 669 98 758 -14 Q 774 -39 793 -46 Q 803 -49 813 -37 Q 829 -22 818 32 Q 805 107 602 209 Q 599 212 597 212 Q 587 219 584 204 Q 583 188 594 174 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 594 202 L 676 134 L 760 53 L 778 27 L 797 -27\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"440 880\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1067;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.1183268229166667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 518 382 Q 572 385 623 389 Q 758 399 900 383 Q 928 379 935 390 Q 944 405 930 419 Q 896 452 845 475 Q 829 482 798 473 Q 723 460 480 434 Q 180 409 137 408 Q 130 408 124 408 Q 108 408 106 395 Q 105 380 127 363 Q 146 348 183 334 Q 195 330 216 338 Q 232 344 306 354 Q 400 373 518 382 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 518 382 Q 572 385 623 389 Q 758 399 900 383 Q 928 379 935 390 Q 944 405 930 419 Q 896 452 845 475 Q 829 482 798 473 Q 723 460 480 434 Q 180 409 137 408 Q 130 408 124 408 Q 108 408 106 395 Q 105 380 127 363 Q 146 348 183 334 Q 195 330 216 338 Q 232 344 306 354 Q 400 373 518 382 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 121 393 L 193 372 L 417 402 L 827 434 L 920 401\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"939 1878\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1446;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.4267578125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1168;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.2005208333333333s both;\n          animation-delay: 1.4267578125s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 521 525 Q 600 540 679 548 Q 704 549 709 537 Q 718 518 712 470 Q 693 293 656 200 Q 637 142 617 124 Q 604 111 576 120 Q 539 132 505 144 Q 480 151 497 129 Q 546 74 573 33 Q 583 9 606 16 Q 628 17 654 47 Q 732 122 767 421 Q 774 488 801 526 Q 820 551 810 563 Q 792 585 751 603 Q 723 619 691 605 Q 621 580 527 561 L 468 550 Q 303 531 241 532 Q 216 536 216 522 Q 215 510 240 492 Q 271 468 303 478 Q 382 499 461 514 L 521 525 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 461 514 Q 392 231 161 88 Q 142 75 123 60 Q 107 48 123 46 Q 139 45 182 62 Q 267 101 330 161 Q 402 224 449 318 Q 507 445 521 525 L 527 561 Q 558 717 573 745 Q 585 767 565 778 Q 507 820 474 810 Q 458 804 466 786 Q 496 723 468 550 L 461 514 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 521 525 Q 600 540 679 548 Q 704 549 709 537 Q 718 518 712 470 Q 693 293 656 200 Q 637 142 617 124 Q 604 111 576 120 Q 539 132 505 144 Q 480 151 497 129 Q 546 74 573 33 Q 583 9 606 16 Q 628 17 654 47 Q 732 122 767 421 Q 774 488 801 526 Q 820 551 810 563 Q 792 585 751 603 Q 723 619 691 605 Q 621 580 527 561 L 468 550 Q 303 531 241 532 Q 216 536 216 522 Q 215 510 240 492 Q 271 468 303 478 Q 382 499 461 514 L 521 525 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 228 521 L 269 505 L 303 506 L 709 577 L 724 574 L 757 546 L 720 306 L 689 188 L 654 109 L 627 80 L 604 71 L 498 138\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1318 2636\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 461 514 Q 392 231 161 88 Q 142 75 123 60 Q 107 48 123 46 Q 139 45 182 62 Q 267 101 330 161 Q 402 224 449 318 Q 507 445 521 525 L 527 561 Q 558 717 573 745 Q 585 767 565 778 Q 507 820 474 810 Q 458 804 466 786 Q 496 723 468 550 L 461 514 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 478 795 L 511 768 L 524 742 L 490 513 L 468 435 L 436 355 L 382 260 L 319 184 L 244 120 L 127 53\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1040 2080\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1455;\n            stroke-width: 128;\n          }\n          83% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.43408203125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1144;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1809895833333333s both;\n          animation-delay: 1.43408203125s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 532 313 Q 539 325 549 337 Q 616 430 658 564 Q 673 612 708 643 Q 730 662 711 678 Q 686 696 653 704 Q 626 716 551 686 Q 404 646 283 635 Q 262 635 258 629 Q 254 616 280 599 Q 311 578 384 603 Q 568 658 589 652 Q 601 652 601 632 Q 568 473 491 354 L 468 322 Q 438 288 405 254 Q 317 175 148 91 Q 130 82 140 76 Q 147 72 175 81 Q 400 151 503 276 L 532 313 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 503 276 Q 669 62 732 58 Q 844 49 936 57 Q 984 61 980 74 Q 979 80 932 96 Q 749 153 725 166 Q 623 221 532 313 L 491 354 Q 428 423 364 503 Q 327 549 289 553 Q 270 554 265 550 Q 262 543 278 530 Q 344 485 468 322 L 503 276 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 532 313 Q 539 325 549 337 Q 616 430 658 564 Q 673 612 708 643 Q 730 662 711 678 Q 686 696 653 704 Q 626 716 551 686 Q 404 646 283 635 Q 262 635 258 629 Q 254 616 280 599 Q 311 578 384 603 Q 568 658 589 652 Q 601 652 601 632 Q 568 473 491 354 L 468 322 Q 438 288 405 254 Q 317 175 148 91 Q 130 82 140 76 Q 147 72 175 81 Q 400 151 503 276 L 532 313 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 266 625 L 310 613 L 349 618 L 590 676 L 630 669 L 648 653 L 578 447 L 522 348 L 477 289 L 422 233 L 338 172 L 233 116 L 145 82\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1327 2654\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 503 276 Q 669 62 732 58 Q 844 49 936 57 Q 984 61 980 74 Q 979 80 932 96 Q 749 153 725 166 Q 623 221 532 313 L 491 354 Q 428 423 364 503 Q 327 549 289 553 Q 270 554 265 550 Q 262 543 278 530 Q 344 485 468 322 L 503 276 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 271 547 L 312 527 L 345 499 L 547 261 L 627 183 L 689 133 L 730 110 L 761 102 L 937 77 L 947 71 L 974 72\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1016 2032\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 692;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8131510416666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1137;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.17529296875s both;\n          animation-delay: 0.8131510416666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 657;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.78466796875s both;\n          animation-delay: 1.9884440104166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 517 600 Q 524 609 531 617 Q 573 671 610 713 Q 623 725 610 742 Q 568 784 543 784 Q 530 783 531 767 Q 530 706 483 638 L 452 597 Q 448 594 445 589 Q 405 540 356 504 Q 316 476 295 456 Q 285 441 301 444 Q 364 448 481 560 L 517 600 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 537 398 Q 564 263 528 112 Q 527 109 526 105 Q 522 92 514 90 Q 490 86 426 106 Q 395 115 389 108 Q 386 102 397 90 Q 457 50 497 11 Q 516 -16 526 -15 Q 533 -16 548 -1 Q 624 119 583 416 Q 576 464 563 503 Q 547 558 522 593 Q 519 597 517 600 L 483 638 Q 435 686 374 711 Q 359 718 355 707 Q 351 692 359 672 Q 369 653 387 648 Q 411 639 452 597 L 481 560 Q 497 544 520 477 L 537 398 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 438 349 Q 389 285 272 168 Q 265 158 277 155 Q 298 152 419 257 Q 479 311 537 398 L 520 477 Q 483 410 438 349 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 517 600 Q 524 609 531 617 Q 573 671 610 713 Q 623 725 610 742 Q 568 784 543 784 Q 530 783 531 767 Q 530 706 483 638 L 452 597 Q 448 594 445 589 Q 405 540 356 504 Q 316 476 295 456 Q 285 441 301 444 Q 364 448 481 560 L 517 600 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 544 771 L 565 735 L 566 723 L 516 639 L 458 568 L 414 525 L 351 478 L 305 453\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"564 1128\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 537 398 Q 564 263 528 112 Q 527 109 526 105 Q 522 92 514 90 Q 490 86 426 106 Q 395 115 389 108 Q 386 102 397 90 Q 457 50 497 11 Q 516 -16 526 -15 Q 533 -16 548 -1 Q 624 119 583 416 Q 576 464 563 503 Q 547 558 522 593 Q 519 597 517 600 L 483 638 Q 435 686 374 711 Q 359 718 355 707 Q 351 692 359 672 Q 369 653 387 648 Q 411 639 452 597 L 481 560 Q 497 544 520 477 L 537 398 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 366 702 L 383 680 L 440 644 L 469 617 L 522 543 L 542 489 L 562 402 L 573 282 L 571 196 L 561 124 L 547 76 L 527 50 L 521 47 L 474 65 L 394 105\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1009 2018\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 438 349 Q 389 285 272 168 Q 265 158 277 155 Q 298 152 419 257 Q 479 311 537 398 L 520 477 Q 483 410 438 349 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 518 470 L 508 403 L 455 329 L 377 244 L 279 163\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"529 1058\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 656;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7838541666666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 872;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.9596354166666666s both;\n          animation-delay: 0.7838541666666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1007;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0694986979166667s both;\n          animation-delay: 1.7434895833333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 782;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.8863932291666666s both;\n          animation-delay: 2.81298828125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 829;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.9246419270833334s both;\n          animation-delay: 3.6993815104166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 510 721 Q 597 751 654 756 Q 673 755 679 763 Q 685 775 672 789 Q 650 810 602 834 Q 586 844 570 845 Q 561 841 559 829 Q 553 781 290 693 Q 283 683 290 680 L 456 707 L 510 721 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 537 505 Q 634 523 792 539 Q 805 538 816 553 Q 817 566 790 579 Q 745 606 673 582 Q 609 567 544 553 Q 541 553 539 551 L 487 541 Q 379 526 202 506 Q 168 502 193 481 Q 230 453 256 455 Q 280 464 450 491 L 537 505 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 536 480 Q 536 493 537 505 L 539 551 Q 542 612 555 656 Q 564 671 561 685 Q 554 694 510 721 L 456 707 Q 484 667 485 623 Q 486 584 487 541 L 487 425 Q 484 202 478 162 Q 459 53 460 46 Q 460 34 479 -10 Q 486 -28 494 -31 Q 500 -38 508 -29 Q 515 -25 526 -4 Q 536 21 535 53 Q 534 93 536 433 L 536 480 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 450 491 Q 369 314 128 125 Q 113 112 125 109 Q 152 99 249 165 Q 337 222 487 425 L 487 496.95402298850576 L 450 491 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 536 433 Q 630 301 750 162 Q 772 137 809 139 Q 935 142 975 148 Q 987 151 989 157 Q 989 164 972 172 Q 824 223 747 279 Q 650 361 536 480 L 536 433 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 510 721 Q 597 751 654 756 Q 673 755 679 763 Q 685 775 672 789 Q 650 810 602 834 Q 586 844 570 845 Q 561 841 559 829 Q 553 781 290 693 Q 283 683 290 680 L 456 707 L 510 721 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 668 770 L 590 791 L 527 757 L 457 730 L 332 701 L 326 695 L 311 692 L 304 697 L 297 687\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"528 1056\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 537 505 Q 634 523 792 539 Q 805 538 816 553 Q 817 566 790 579 Q 745 606 673 582 Q 609 567 544 553 Q 541 553 539 551 L 487 541 Q 379 526 202 506 Q 168 502 193 481 Q 230 453 256 455 Q 280 464 450 491 L 537 505 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 196 494 L 256 484 L 483 518 L 719 562 L 754 564 L 804 554\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"744 1488\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 536 480 Q 536 493 537 505 L 539 551 Q 542 612 555 656 Q 564 671 561 685 Q 554 694 510 721 L 456 707 Q 484 667 485 623 Q 486 584 487 541 L 487 425 Q 484 202 478 162 Q 459 53 460 46 Q 460 34 479 -10 Q 486 -28 494 -31 Q 500 -38 508 -29 Q 515 -25 526 -4 Q 536 21 535 53 Q 534 93 536 433 L 536 480 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 464 703 L 506 685 L 518 659 L 499 -17\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"879 1758\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 450 491 Q 369 314 128 125 Q 113 112 125 109 Q 152 99 249 165 Q 337 222 487 425 L 487 496.95402298850576 L 450 491 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 482 490 L 465 471 L 456 434 L 445 416 L 334 276 L 227 176 L 152 125 L 128 117\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"654 1308\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 536 433 Q 630 301 750 162 Q 772 137 809 139 Q 935 142 975 148 Q 987 151 989 157 Q 989 164 972 172 Q 824 223 747 279 Q 650 361 536 480 L 536 433 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 540 472 L 551 441 L 612 368 L 731 243 L 781 200 L 819 184 L 982 158\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"701 1402\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 656;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7838541666666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 453;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.61865234375s both;\n          animation-delay: 0.7838541666666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 351;\n            stroke-width: 128;\n          }\n          53% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.53564453125s both;\n          animation-delay: 1.4025065104166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 629;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7618815104166666s both;\n          animation-delay: 1.9381510416666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 477;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.63818359375s both;\n          animation-delay: 2.700032552083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 391;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.5681966145833334s both;\n          animation-delay: 3.338216145833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 328 661 L 354 708 Q 374 743 376 749 Q 378 758 367 768 Q 317 804 292 796 Q 284 794 284 786 L 286 757 Q 294 654 186 517 Q 180 515 137 459 Q 134 453 134 450 Q 135 445 145 447 Q 172 453 220 502 Q 278 564 316 635 L 328 661 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 316 635 Q 359 613 413 630 L 502 649 Q 523 654 525 657 Q 535 666 529 674 Q 521 686 492 692 Q 473 694 429 684 Q 355 664 328 661 L 316 635 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 327 509 Q 355 466 388 453 Q 396 451 404 455 Q 421 465 416 493 Q 411 517 394 531 Q 338 561 316 550 Q 308 549 310 536 Q 311 524 327 509 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 643 680 Q 652 710 692 782 Q 702 798 684 811 Q 633 841 608 833 Q 601 830 601 821 L 605 791 Q 615 697 527 568 Q 518 564 486 511 Q 484 507 484 504 Q 482 496 494 501 Q 513 505 546 539 Q 596 590 630 653 L 643 680 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 630 653 Q 678 629 741 647 Q 862 673 866 678 Q 873 684 872 691 Q 872 709 829 717 Q 820 718 813 719 Q 793 719 767 710 Q 715 690 643 680 L 630 653 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 619 559 Q 622 551 636 540 Q 684 503 711 478 Q 719 471 727 468 Q 750 459 760 482 Q 764 498 753 529 Q 741 560 645 577 Q 637 579 631 579 Q 615 578 619 559 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 328 661 L 354 708 Q 374 743 376 749 Q 378 758 367 768 Q 317 804 292 796 Q 284 794 284 786 L 286 757 Q 294 654 186 517 Q 180 515 137 459 Q 134 453 134 450 Q 135 445 145 447 Q 172 453 220 502 Q 278 564 316 635 L 328 661 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 299 782 L 328 745 L 285 628 L 248 567 L 201 506 L 141 453\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"528 1056\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 316 635 Q 359 613 413 630 L 502 649 Q 523 654 525 657 Q 535 666 529 674 Q 521 686 492 692 Q 473 694 429 684 Q 355 664 328 661 L 316 635 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 325 639 L 444 663 L 495 670 L 519 667\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"325 650\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 327 509 Q 355 466 388 453 Q 396 451 404 455 Q 421 465 416 493 Q 411 517 394 531 Q 338 561 316 550 Q 308 549 310 536 Q 311 524 327 509 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 324 538 L 371 507 L 393 475\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"223 446\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 643 680 Q 652 710 692 782 Q 702 798 684 811 Q 633 841 608 833 Q 601 830 601 821 L 605 791 Q 615 697 527 568 Q 518 564 486 511 Q 484 507 484 504 Q 482 496 494 501 Q 513 505 546 539 Q 596 590 630 653 L 643 680 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 616 821 L 647 785 L 617 684 L 567 592 L 490 506\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"501 1002\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 630 653 Q 678 629 741 647 Q 862 673 866 678 Q 873 684 872 691 Q 872 709 829 717 Q 820 718 813 719 Q 793 719 767 710 Q 715 690 643 680 L 630 653 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 640 657 L 748 674 L 808 691 L 857 690\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"349 698\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 619 559 Q 622 551 636 540 Q 684 503 711 478 Q 719 471 727 468 Q 750 459 760 482 Q 764 498 753 529 Q 741 560 645 577 Q 637 579 631 579 Q 615 578 619 559 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 631 565 L 717 519 L 738 488\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"263 526\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 527;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6788736979166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 873;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.96044921875s both;\n          animation-delay: 0.6788736979166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 654;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7822265625s both;\n          animation-delay: 1.6393229166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 930;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.0068359375s both;\n          animation-delay: 2.4215494791666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 793;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.8953450520833334s both;\n          animation-delay: 3.4283854166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 534;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.6845703125s both;\n          animation-delay: 4.32373046875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 291 530 Q 278 536 241 540 Q 228 543 223 536 Q 216 529 227 511 Q 264 447 290 338 Q 296 305 317 284 Q 339 260 344 279 Q 347 289 347 304 L 342 341 Q 326 392 309 493 L 291 530 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 721 384 Q 754 480 791 509 Q 812 530 795 551 Q 720 614 672 600 Q 597 576 530 560 L 472 550 Q 384 538 291 530 L 309 493 Q 319 494 330 497 Q 402 510 473 519 L 530 528 Q 578 538 627 545 Q 664 552 679 537 Q 689 527 687 505 Q 677 444 663 393 L 721 384 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 526 327 Q 614 339 733 346 Q 745 347 747 357 Q 747 364 721 384 L 663 393 Q 591 381 527 366 L 475 358 Q 405 348 342 341 L 347 304 Q 354 303 365 304 Q 410 314 475 321 L 526 327 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 521 148 Q 524 239 526 327 L 527 366 Q 528 448 530 528 L 530 560 Q 530 617 555 742 Q 559 755 533 774 Q 487 798 457 802 Q 436 806 426 795 Q 416 785 428 766 Q 465 711 467 673 Q 470 613 472 550 L 473 519 Q 474 441 475 358 L 475 321 Q 474 233 470 138 L 521 148 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 680 180 Q 602 165 521 148 L 470 138 Q 370 122 263 104 Q 230 98 180 105 Q 164 106 160 94 Q 156 78 165 66 Q 190 42 228 14 Q 240 8 256 17 Q 325 53 523 102 Q 659 138 698 152 L 680 180 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 698 152 Q 732 98 773 31 Q 786 6 802 -3 Q 811 -7 822 2 Q 838 14 835 66 Q 835 129 661 253 Q 652 260 647 248 Q 641 230 680 180 L 698 152 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 291 530 Q 278 536 241 540 Q 228 543 223 536 Q 216 529 227 511 Q 264 447 290 338 Q 296 305 317 284 Q 339 260 344 279 Q 347 289 347 304 L 342 341 Q 326 392 309 493 L 291 530 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 233 528 L 268 503 L 280 478 L 331 284\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"399 798\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 721 384 Q 754 480 791 509 Q 812 530 795 551 Q 720 614 672 600 Q 597 576 530 560 L 472 550 Q 384 538 291 530 L 309 493 Q 319 494 330 497 Q 402 510 473 519 L 530 528 Q 578 538 627 545 Q 664 552 679 537 Q 689 527 687 505 Q 677 444 663 393 L 721 384 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 299 526 L 320 514 L 506 539 L 641 569 L 690 570 L 722 551 L 738 530 L 701 418 L 671 398\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"745 1490\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 526 327 Q 614 339 733 346 Q 745 347 747 357 Q 747 364 721 384 L 663 393 Q 591 381 527 366 L 475 358 Q 405 348 342 341 L 347 304 Q 354 303 365 304 Q 410 314 475 321 L 526 327 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 351 311 L 364 324 L 380 327 L 659 367 L 711 366 L 739 357\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"526 1052\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 521 148 Q 524 239 526 327 L 527 366 Q 528 448 530 528 L 530 560 Q 530 617 555 742 Q 559 755 533 774 Q 487 798 457 802 Q 436 806 426 795 Q 416 785 428 766 Q 465 711 467 673 Q 470 613 472 550 L 473 519 Q 474 441 475 358 L 475 321 Q 474 233 470 138 L 521 148 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 442 782 L 502 734 L 505 699 L 497 168 L 475 146\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"802 1604\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 680 180 Q 602 165 521 148 L 470 138 Q 370 122 263 104 Q 230 98 180 105 Q 164 106 160 94 Q 156 78 165 66 Q 190 42 228 14 Q 240 8 256 17 Q 325 53 523 102 Q 659 138 698 152 L 680 180 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 176 88 L 242 58 L 648 156 L 672 161 L 693 155\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"665 1330\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 698 152 Q 732 98 773 31 Q 786 6 802 -3 Q 811 -7 822 2 Q 838 14 835 66 Q 835 129 661 253 Q 652 260 647 248 Q 641 230 680 180 L 698 152 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 657 243 L 782 93 L 800 56 L 808 15\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"406 812\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 901;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9832356770833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 938;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0133463541666667s both;\n          animation-delay: 0.9832356770833334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 480 396 Q 538 362 589 322 Q 604 307 618 321 Q 634 331 642 358 Q 657 415 597 501 Q 548 558 587 597 Q 627 657 651 671 Q 675 686 663 701 Q 647 723 604 746 Q 579 756 563 743 Q 506 700 428 685 L 446 649 Q 488 656 532 675 Q 550 685 560 674 Q 566 668 558 650 Q 542 613 530 575 Q 514 547 531 525 Q 588 434 571 411 Q 564 401 540 405 Q 510 411 477 411 Q 450 414 480 396 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 428 685 Q 403 704 376 711 Q 366 714 358 704 Q 354 697 363 685 Q 390 625 392 550 Q 404 276 362 133 Q 353 103 359 82 Q 369 43 382 29 Q 395 14 406 30 Q 439 67 439 273 Q 439 603 446 649 L 428 685 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 480 396 Q 538 362 589 322 Q 604 307 618 321 Q 634 331 642 358 Q 657 415 597 501 Q 548 558 587 597 Q 627 657 651 671 Q 675 686 663 701 Q 647 723 604 746 Q 579 756 563 743 Q 506 700 428 685 L 446 649 Q 488 656 532 675 Q 550 685 560 674 Q 566 668 558 650 Q 542 613 530 575 Q 514 547 531 525 Q 588 434 571 411 Q 564 401 540 405 Q 510 411 477 411 Q 450 414 480 396 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 437 682 L 463 672 L 561 707 L 586 707 L 603 693 L 597 668 L 560 599 L 547 560 L 554 524 L 584 480 L 604 433 L 607 406 L 601 378 L 598 373 L 565 376 L 485 405\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"773 1546\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 428 685 Q 403 704 376 711 Q 366 714 358 704 Q 354 697 363 685 Q 390 625 392 550 Q 404 276 362 133 Q 353 103 359 82 Q 369 43 382 29 Q 395 14 406 30 Q 439 67 439 273 Q 439 603 446 649 L 428 685 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 369 699 L 404 665 L 409 653 L 417 569 L 416 287 L 393 100 L 394 35\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"810 1620\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 866;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9547526041666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1201;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.2273763020833333s both;\n          animation-delay: 0.9547526041666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 898;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.9807942708333334s both;\n          animation-delay: 2.18212890625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 494 476 Q 542 485 795 501 Q 817 502 822 512 Q 826 525 808 540 Q 750 580 707 569 Q 631 550 500 522 L 436 509 Q 331 490 213 469 Q 189 465 208 447 Q 241 420 294 432 Q 357 453 431 465 L 494 476 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 487 437 Q 491 456 494 476 L 500 522 Q 510 711 528 763 Q 534 776 523 786 Q 501 805 459 822 Q 434 832 414 825 Q 390 816 410 796 Q 444 762 444 726 Q 445 602 436 509 L 431 465 Q 398 275 310 179 Q 303 173 297 166 Q 251 118 148 55 Q 133 48 130 43 Q 124 36 144 34 Q 195 34 300 104 Q 385 173 414 218 Q 444 266 480 396 L 487 437 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 480 396 Q 501 357 575 245 Q 657 124 718 56 Q 746 22 774 22 Q 856 28 928 32 Q 959 33 959 41 Q 960 50 927 66 Q 753 144 719 174 Q 614 267 500 419 Q 493 429 487 437 L 480 396 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 494 476 Q 542 485 795 501 Q 817 502 822 512 Q 826 525 808 540 Q 750 580 707 569 Q 631 550 500 522 L 436 509 Q 331 490 213 469 Q 189 465 208 447 Q 241 420 294 432 Q 357 453 431 465 L 494 476 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 210 458 L 268 453 L 514 503 L 719 534 L 770 529 L 810 517\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"738 1476\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 487 437 Q 491 456 494 476 L 500 522 Q 510 711 528 763 Q 534 776 523 786 Q 501 805 459 822 Q 434 832 414 825 Q 390 816 410 796 Q 444 762 444 726 Q 445 602 436 509 L 431 465 Q 398 275 310 179 Q 303 173 297 166 Q 251 118 148 55 Q 133 48 130 43 Q 124 36 144 34 Q 195 34 300 104 Q 385 173 414 218 Q 444 266 480 396 L 487 437 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 416 810 L 444 799 L 482 759 L 469 518 L 448 394 L 426 320 L 386 231 L 361 196 L 307 140 L 202 67 L 138 41\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1073 2146\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 480 396 Q 501 357 575 245 Q 657 124 718 56 Q 746 22 774 22 Q 856 28 928 32 Q 959 33 959 41 Q 960 50 927 66 Q 753 144 719 174 Q 614 267 500 419 Q 493 429 487 437 L 480 396 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 486 430 L 500 393 L 576 284 L 660 182 L 722 118 L 774 77 L 953 42\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"770 1540\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 426;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5966796875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 746;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8570963541666666s both;\n          animation-delay: 0.5966796875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 919;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.9978841145833334s both;\n          animation-delay: 1.4537760416666665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 476 765 Q 516 741 562 711 Q 578 701 595 703 Q 605 704 609 720 Q 610 736 597 766 Q 581 802 462 814 Q 446 815 439 811 Q 435 807 439 793 Q 445 783 476 765 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 336 539 Q 352 557 789 606 Q 801 603 811 618 Q 812 631 788 644 Q 749 668 661 645 Q 466 608 401 600 Q 356 597 310 590 L 336 539 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 310 590 Q 271 617 251 609 Q 238 602 245 587 Q 261 568 262 511 Q 261 496 260 479 Q 254 320 216 211 Q 183 118 111 5 Q 107 -2 104 -9 Q 101 -21 112 -18 Q 151 -11 225 112 Q 234 130 244 148 Q 304 283 325 479 Q 328 513 336 539 L 310 590 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 476 765 Q 516 741 562 711 Q 578 701 595 703 Q 605 704 609 720 Q 610 736 597 766 Q 581 802 462 814 Q 446 815 439 811 Q 435 807 439 793 Q 445 783 476 765 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 446 805 L 554 759 L 591 721\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"298 596\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 336 539 Q 352 557 789 606 Q 801 603 811 618 Q 812 631 788 644 Q 749 668 661 645 Q 466 608 401 600 Q 356 597 310 590 L 336 539 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 318 586 L 347 570 L 697 625 L 754 629 L 799 620\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"618 1236\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 310 590 Q 271 617 251 609 Q 238 602 245 587 Q 261 568 262 511 Q 261 496 260 479 Q 254 320 216 211 Q 183 118 111 5 Q 107 -2 104 -9 Q 101 -21 112 -18 Q 151 -11 225 112 Q 234 130 244 148 Q 304 283 325 479 Q 328 513 336 539 L 310 590 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 257 596 L 286 570 L 297 535 L 284 390 L 263 281 L 235 188 L 200 112 L 157 42 L 113 -9\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"791 1582\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 790;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8929036458333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1410;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.3974609375s both;\n          animation-delay: 0.8929036458333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 579;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.72119140625s both;\n          animation-delay: 2.2903645833333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 660;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.787109375s both;\n          animation-delay: 3.0115559895833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 654;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7822265625s both;\n          animation-delay: 3.7986653645833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 225 620 Q 201 636 175 642 Q 168 646 161 639 Q 151 632 163 619 Q 163 616 169 607 Q 230 487 231 222 Q 234 140 277 112 L 279 111 Q 300 104 302 142 Q 302 152 301 164 L 297 200 Q 296 213 292 227 Q 264 473 260 573 Q 260 574 261 574 L 225 620 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 669 194 Q 679 166 703 111 Q 712 92 723 92 Q 741 93 753 123 Q 805 217 816 348 Q 829 430 840 523 Q 847 581 873 615 Q 894 639 879 655 Q 854 680 798 705 Q 776 717 738 703 Q 626 666 496 644 Q 385 629 225 620 L 261 574 Q 348 592 461 609 L 513 617 Q 600 632 701 646 Q 750 655 768 632 Q 778 610 779 586 Q 769 414 727 248 Q 723 218 710 216 L 669 194 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 529 394 Q 598 404 660 411 Q 685 414 677 428 Q 667 444 640 450 Q 613 454 530 436 L 478 426 Q 408 413 345 402 Q 326 398 347 382 Q 363 370 394 375 Q 436 382 478 387 L 529 394 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 530 436 Q 533 598 534 598 Q 522 610 513 617 L 461 609 Q 465 602 470 594 Q 477 575 478 426 L 478 387 Q 478 320 478 219 L 524 226 Q 525 316 529 394 L 530 436 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 301 164 Q 419 185 669 194 L 710 216 Q 707 216 675 236 Q 653 251 524 226 L 478 219 Q 381 207 297 200 L 301 164 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 225 620 Q 201 636 175 642 Q 168 646 161 639 Q 151 632 163 619 Q 163 616 169 607 Q 230 487 231 222 Q 234 140 277 112 L 279 111 Q 300 104 302 142 Q 302 152 301 164 L 297 200 Q 296 213 292 227 Q 264 473 260 573 Q 260 574 261 574 L 225 620 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 168 630 L 204 600 L 225 563 L 253 357 L 267 183 L 285 124\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"662 1324\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 669 194 Q 679 166 703 111 Q 712 92 723 92 Q 741 93 753 123 Q 805 217 816 348 Q 829 430 840 523 Q 847 581 873 615 Q 894 639 879 655 Q 854 680 798 705 Q 776 717 738 703 Q 626 666 496 644 Q 385 629 225 620 L 261 574 Q 348 592 461 609 L 513 617 Q 600 632 701 646 Q 750 655 768 632 Q 778 610 779 586 Q 769 414 727 248 Q 723 218 710 216 L 669 194 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 234 618 L 277 600 L 518 632 L 739 675 L 770 675 L 804 655 L 823 634 L 792 401 L 761 236 L 746 196 L 726 169 L 724 108\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1282 2564\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 529 394 Q 598 404 660 411 Q 685 414 677 428 Q 667 444 640 450 Q 613 454 530 436 L 478 426 Q 408 413 345 402 Q 326 398 347 382 Q 363 370 394 375 Q 436 382 478 387 L 529 394 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 346 392 L 383 391 L 601 427 L 642 430 L 665 423\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"451 902\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 530 436 Q 533 598 534 598 Q 522 610 513 617 L 461 609 Q 465 602 470 594 Q 477 575 478 426 L 478 387 Q 478 320 478 219 L 524 226 Q 525 316 529 394 L 530 436 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 468 608 L 503 582 L 502 251 L 484 228\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"532 1064\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 301 164 Q 419 185 669 194 L 710 216 Q 707 216 675 236 Q 653 251 524 226 L 478 219 Q 381 207 297 200 L 301 164 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 305 171 L 320 185 L 393 194 L 604 216 L 696 217\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"526 1052\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 917;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9962565104166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1307;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.3136393229166667s both;\n          animation-delay: 0.9962565104166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 491;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6495768229166666s both;\n          animation-delay: 2.3098958333333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 495;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.65283203125s both;\n          animation-delay: 2.95947265625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 555;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.70166015625s both;\n          animation-delay: 3.6123046875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 329 714 Q 320 723 298 731 Q 286 737 273 732 Q 266 726 272 712 Q 275 699 281 685 Q 309 624 291 287 Q 285 239 271 184 Q 256 121 295 70 Q 308 54 320 69 Q 335 87 334 115 L 338 152 Q 339 180 340 216 Q 341 280 342 336 L 342 369 Q 343 439 345 493 L 346 525 Q 349 646 351 660 Q 352 670 352 677 L 329 714 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 597 135 Q 637 86 665 43 Q 675 22 688 23 Q 707 24 724 63 Q 743 108 739 161 Q 726 329 717 637 Q 716 674 735 699 Q 745 714 735 725 Q 713 747 653 775 Q 632 785 614 775 Q 494 727 329 714 L 352 677 Q 361 677 586 717 Q 620 723 636 710 Q 676 667 660 203 Q 657 181 656 163 Q 652 144 633 149 L 597 135 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 345 493 Q 369 486 539 511 Q 542 512 548 512 Q 581 518 586 522 Q 593 529 590 537 Q 584 549 558 556 Q 530 563 503 553 Q 466 543 426 535 Q 389 529 346 525 L 345 493 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 342 336 Q 382 329 540 348 Q 544 349 550 349 Q 584 353 589 358 Q 598 365 594 373 Q 588 385 562 393 Q 535 400 507 392 Q 470 382 428 376 Q 388 370 342 369 L 342 336 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 334 115 Q 376 130 597 135 L 633 149 Q 630 159 604 178 Q 588 188 554 183 Q 436 161 338 152 L 334 115 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 329 714 Q 320 723 298 731 Q 286 737 273 732 Q 266 726 272 712 Q 275 699 281 685 Q 309 624 291 287 Q 285 239 271 184 Q 256 121 295 70 Q 308 54 320 69 Q 335 87 334 115 L 338 152 Q 339 180 340 216 Q 341 280 342 336 L 342 369 Q 343 439 345 493 L 346 525 Q 349 646 351 660 Q 352 670 352 677 L 329 714 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 281 723 L 309 693 L 320 667 L 321 645 L 317 286 L 302 147 L 308 76\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"789 1578\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 597 135 Q 637 86 665 43 Q 675 22 688 23 Q 707 24 724 63 Q 743 108 739 161 Q 726 329 717 637 Q 716 674 735 699 Q 745 714 735 725 Q 713 747 653 775 Q 632 785 614 775 Q 494 727 329 714 L 352 677 Q 361 677 586 717 Q 620 723 636 710 Q 676 667 660 203 Q 657 181 656 163 Q 652 144 633 149 L 597 135 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 338 711 L 365 698 L 385 700 L 636 747 L 665 730 L 687 706 L 697 152 L 683 110 L 605 132\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1179 2358\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 345 493 Q 369 486 539 511 Q 542 512 548 512 Q 581 518 586 522 Q 593 529 590 537 Q 584 549 558 556 Q 530 563 503 553 Q 466 543 426 535 Q 389 529 346 525 L 345 493 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 348 498 L 368 510 L 516 532 L 578 532\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"363 726\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 342 336 Q 382 329 540 348 Q 544 349 550 349 Q 584 353 589 358 Q 598 365 594 373 Q 588 385 562 393 Q 535 400 507 392 Q 470 382 428 376 Q 388 370 342 369 L 342 336 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 346 342 L 365 353 L 462 359 L 540 372 L 581 369\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"367 734\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 334 115 Q 376 130 597 135 L 633 149 Q 630 159 604 178 Q 588 188 554 183 Q 436 161 338 152 L 334 115 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 335 121 L 361 139 L 483 152 L 576 160 L 626 150\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"427 854\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 806;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9059244791666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 927;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.00439453125s both;\n          animation-delay: 0.9059244791666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 545;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6935221354166666s both;\n          animation-delay: 1.9103190104166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 820;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.9173177083333334s both;\n          animation-delay: 2.603841145833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 574;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7171223958333334s both;\n          animation-delay: 3.5211588541666665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 491 646 Q 602 662 721 677 Q 803 690 816 700 Q 826 707 822 718 Q 815 733 783 743 Q 749 753 715 742 Q 499 685 275 676 Q 232 673 261 651 Q 310 620 370 631 Q 401 635 436 639 L 491 646 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 371 369 Q 425 442 500 565 Q 527 608 527 609 Q 524 631 491 646 L 436 639 Q 448 528 275 324 Q 268 318 261 309 Q 207 251 73 136 Q 64 132 76 128 Q 136 135 279 263 Q 309 294 341 331 L 371 369 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 399 360 Q 390 364 371 369 L 341 331 Q 371 255 387 138 Q 388 99 410 73 Q 429 48 436 66 Q 440 79 441 100 L 439 137 Q 421 228 411 322 L 399 360 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 735 170 Q 765 299 810 335 Q 831 357 812 379 Q 791 395 728 426 Q 706 435 680 424 Q 554 376 399 360 L 411 322 Q 423 323 438 327 Q 549 348 654 368 Q 681 374 692 362 Q 705 350 703 323 Q 690 241 673 176 L 735 170 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 441 100 Q 448 99 461 100 Q 552 119 749 130 Q 761 131 763 141 Q 763 150 735 170 L 673 176 Q 543 149 439 137 L 441 100 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 491 646 Q 602 662 721 677 Q 803 690 816 700 Q 826 707 822 718 Q 815 733 783 743 Q 749 753 715 742 Q 499 685 275 676 Q 232 673 261 651 Q 310 620 370 631 Q 401 635 436 639 L 491 646 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 265 665 L 304 655 L 373 656 L 585 685 L 740 714 L 809 712\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"678 1356\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 371 369 Q 425 442 500 565 Q 527 608 527 609 Q 524 631 491 646 L 436 639 Q 448 528 275 324 Q 268 318 261 309 Q 207 251 73 136 Q 64 132 76 128 Q 136 135 279 263 Q 309 294 341 331 L 371 369 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 444 635 L 476 604 L 474 594 L 435 510 L 371 408 L 257 271 L 142 174 L 79 134\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"799 1598\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 399 360 Q 390 364 371 369 L 341 331 Q 371 255 387 138 Q 388 99 410 73 Q 429 48 436 66 Q 440 79 441 100 L 439 137 Q 421 228 411 322 L 399 360 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 376 357 L 377 323 L 424 72\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"417 834\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 735 170 Q 765 299 810 335 Q 831 357 812 379 Q 791 395 728 426 Q 706 435 680 424 Q 554 376 399 360 L 411 322 Q 423 323 438 327 Q 549 348 654 368 Q 681 374 692 362 Q 705 350 703 323 Q 690 241 673 176 L 735 170 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 408 356 L 427 344 L 668 394 L 696 397 L 720 388 L 754 353 L 714 209 L 681 181\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"692 1384\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 441 100 Q 448 99 461 100 Q 552 119 749 130 Q 761 131 763 141 Q 763 150 735 170 L 673 176 Q 543 149 439 137 L 441 100 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 446 106 L 459 120 L 669 151 L 725 150 L 754 141\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"446 892\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 419;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5909830729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1044;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.099609375s both;\n          animation-delay: 0.5909830729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 629;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7618815104166666s both;\n          animation-delay: 1.6905924479166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 367;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5486653645833334s both;\n          animation-delay: 2.452473958333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 374;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5543619791666666s both;\n          animation-delay: 3.0011393229166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 480 762 Q 517 735 557 703 Q 573 690 589 693 Q 601 694 605 708 Q 609 724 597 755 Q 582 791 471 812 Q 455 815 448 811 Q 442 807 445 793 Q 449 783 480 762 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 519 526 Q 443 370 268 199 Q 253 189 256 185 Q 259 182 272 188 Q 357 231 461 353 L 481 379 Q 512 424 549 479 Q 583 536 632 573 Q 648 585 635 599 Q 616 615 587 624 Q 565 633 548 621 Q 455 555 302 549 Q 290 550 288 543 Q 285 533 299 523 Q 335 499 367 504 Q 379 508 393 514 Q 519 571 526 560 Q 533 550 519 526 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 461 353 Q 480 301 481 264 Q 481 159 464 84 Q 454 42 483 0 Q 484 -3 487 -5 Q 503 -20 514 5 Q 527 42 527 83 Q 526 258 530 298 Q 537 323 528 332 Q 492 374 481 379 L 461 353 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 593 359 Q 642 402 669 418 Q 682 422 678 430 Q 674 440 658 453 Q 643 465 628 465 Q 618 464 619 450 Q 620 435 576 365 L 593 359 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 576 365 Q 573 368 567 369 Q 557 372 552 370 Q 548 369 549 359 Q 550 352 569 336 Q 599 311 631 280 Q 640 271 651 272 Q 658 272 662 281 Q 665 291 660 311 Q 656 330 627 346 Q 611 353 593 359 L 576 365 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 480 762 Q 517 735 557 703 Q 573 690 589 693 Q 601 694 605 708 Q 609 724 597 755 Q 582 791 471 812 Q 455 815 448 811 Q 442 807 445 793 Q 449 783 480 762 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 455 803 L 553 751 L 587 711\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"291 582\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 519 526 Q 443 370 268 199 Q 253 189 256 185 Q 259 182 272 188 Q 357 231 461 353 L 481 379 Q 512 424 549 479 Q 583 536 632 573 Q 648 585 635 599 Q 616 615 587 624 Q 565 633 548 621 Q 455 555 302 549 Q 290 550 288 543 Q 285 533 299 523 Q 335 499 367 504 Q 379 508 393 514 Q 519 571 526 560 Q 533 550 519 526 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 298 539 L 359 528 L 425 545 L 515 581 L 569 579 L 551 529 L 448 370 L 358 267 L 305 219 L 259 187\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"916 1832\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 461 353 Q 480 301 481 264 Q 481 159 464 84 Q 454 42 483 0 Q 484 -3 487 -5 Q 503 -20 514 5 Q 527 42 527 83 Q 526 258 530 298 Q 537 323 528 332 Q 492 374 481 379 L 461 353 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 481 372 L 485 348 L 504 311 L 503 162 L 493 54 L 499 5\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"501 1002\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 593 359 Q 642 402 669 418 Q 682 422 678 430 Q 674 440 658 453 Q 643 465 628 465 Q 618 464 619 450 Q 620 435 576 365 L 593 359 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 630 454 L 641 438 L 640 430 L 593 373 L 584 375\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"239 478\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 576 365 Q 573 368 567 369 Q 557 372 552 370 Q 548 369 549 359 Q 550 352 569 336 Q 599 311 631 280 Q 640 271 651 272 Q 658 272 662 281 Q 665 291 660 311 Q 656 330 627 346 Q 611 353 593 359 L 576 365 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 559 362 L 629 316 L 648 287\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"246 492\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 516;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.669921875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 712;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8294270833333334s both;\n          animation-delay: 0.669921875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 497;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6544596354166666s both;\n          animation-delay: 1.4993489583333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 595;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7342122395833334s both;\n          animation-delay: 2.15380859375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 442;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6097005208333334s both;\n          animation-delay: 2.8880208333333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 726;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.8408203125s both;\n          animation-delay: 3.497721354166667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 931;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 1.0076497395833333s both;\n          animation-delay: 4.338541666666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 375 757 Q 365 763 328 768 Q 316 771 313 765 Q 306 759 316 743 Q 350 679 372 572 Q 376 539 395 519 Q 414 497 419 514 Q 422 523 422 535 L 419 569 Q 403 645 386 722 L 375 757 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 643 599 Q 677 698 713 722 Q 732 743 716 762 Q 698 778 642 807 Q 623 816 598 807 Q 517 777 375 757 L 386 722 Q 395 723 405 726 Q 493 739 578 754 Q 600 758 609 750 Q 619 740 616 718 Q 603 655 587 604 L 643 599 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 516 550 Q 570 559 656 566 Q 666 567 668 575 Q 668 584 643 599 L 587 604 Q 493 582 419 569 L 422 535 Q 428 535 435 536 Q 450 540 473 543 L 516 550 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 530 213 Q 534 301 537 375 L 538 402 Q 541 480 544 500 Q 551 518 542 528 Q 529 541 516 550 L 473 543 Q 488 513 488 485 Q 489 458 488 239 L 530 213 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 537 375 L 716 395 Q 744 399 733 415 Q 721 431 691 437 Q 655 443 538 402 L 537 375 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 349 342 Q 362 366 376 386 Q 386 401 370 417 Q 319 453 292 448 Q 279 444 283 428 Q 299 293 152 122 Q 140 119 89 54 Q 80 36 97 42 Q 122 48 155 76 Q 257 164 310 270 Q 320 292 333 313 L 349 342 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 333 313 Q 471 183 708 40 Q 739 27 907 63 Q 940 72 948 82 Q 954 94 935 95 Q 850 108 797 112 Q 665 122 530 213 L 488 239 Q 419 285 349 342 L 333 313 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 375 757 Q 365 763 328 768 Q 316 771 313 765 Q 306 759 316 743 Q 350 679 372 572 Q 376 539 395 519 Q 414 497 419 514 Q 422 523 422 535 L 419 569 Q 403 645 386 722 L 375 757 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 322 757 L 352 735 L 362 709 L 407 519\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"388 776\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 643 599 Q 677 698 713 722 Q 732 743 716 762 Q 698 778 642 807 Q 623 816 598 807 Q 517 777 375 757 L 386 722 Q 395 723 405 726 Q 493 739 578 754 Q 600 758 609 750 Q 619 740 616 718 Q 603 655 587 604 L 643 599 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 385 754 L 398 742 L 601 781 L 635 773 L 663 741 L 660 729 L 623 629 L 594 609\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"584 1168\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 516 550 Q 570 559 656 566 Q 666 567 668 575 Q 668 584 643 599 L 587 604 Q 493 582 419 569 L 422 535 Q 428 535 435 536 Q 450 540 473 543 L 516 550 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 428 541 L 443 556 L 583 582 L 634 583 L 659 575\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"369 738\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 530 213 Q 534 301 537 375 L 538 402 Q 541 480 544 500 Q 551 518 542 528 Q 529 541 516 550 L 473 543 Q 488 513 488 485 Q 489 458 488 239 L 530 213 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 481 538 L 497 531 L 515 511 L 510 253 L 528 221\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"467 934\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 537 375 L 716 395 Q 744 399 733 415 Q 721 431 691 437 Q 655 443 538 402 L 537 375 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 544 382 L 554 394 L 670 414 L 722 407\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"314 628\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 349 342 Q 362 366 376 386 Q 386 401 370 417 Q 319 453 292 448 Q 279 444 283 428 Q 299 293 152 122 Q 140 119 89 54 Q 80 36 97 42 Q 122 48 155 76 Q 257 164 310 270 Q 320 292 333 313 L 349 342 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 296 434 L 328 392 L 271 250 L 194 140 L 99 52\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"598 1196\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 333 313 Q 471 183 708 40 Q 739 27 907 63 Q 940 72 948 82 Q 954 94 935 95 Q 850 108 797 112 Q 665 122 530 213 L 488 239 Q 419 285 349 342 L 333 313 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 353 334 L 352 321 L 359 312 L 459 233 L 577 153 L 687 95 L 724 80 L 756 77 L 912 80 L 939 86\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"803 1606\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 634;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7659505208333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 736;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8489583333333334s both;\n          animation-delay: 0.7659505208333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 496;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6536458333333334s both;\n          animation-delay: 1.6149088541666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 509;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6642252604166666s both;\n          animation-delay: 2.2685546875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 605;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7423502604166666s both;\n          animation-delay: 2.9327799479166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1356;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.353515625s both;\n          animation-delay: 3.675130208333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 432;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.6015625s both;\n          animation-delay: 5.028645833333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 357;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.54052734375s both;\n          animation-delay: 5.630208333333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes8 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 355;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-8 {\n          animation: keyframes8 0.5388997395833334s both;\n          animation-delay: 6.170735677083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes9 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 376;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-9 {\n          animation: keyframes9 0.5559895833333334s both;\n          animation-delay: 6.709635416666666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 548 771 Q 737 807 742 810 Q 749 817 746 825 Q 740 837 714 844 Q 693 850 582 820 Q 465 796 366 789 Q 363 789 361 787 L 380 757 Q 396 753 490 762 Q 493 763 498 763 L 548 771 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 361 787 Q 357 791 350 795 Q 313 820 293 823 Q 278 822 275 811 Q 272 799 282 790 Q 298 763 302 742 Q 317 582 286 407 Q 279 382 280 377 Q 281 367 296 355 Q 312 342 319 340 L 353 428 Q 349 456 355 606 Q 365 730 373 742 Q 377 749 380 757 L 361 787 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 566 641 Q 669 668 671 669 Q 678 676 675 683 Q 668 692 645 697 Q 615 703 567 681 L 513 666 Q 479 659 438 654 Q 410 648 430 635 Q 463 617 509 629 Q 510 630 513 629 L 566 641 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 561 518 Q 598 528 638 536 Q 671 545 675 549 Q 682 556 679 563 Q 672 572 649 577 Q 625 581 562 557 L 513 544 Q 471 537 426 530 Q 398 526 418 512 Q 445 499 510 508 Q 511 508 513 508 L 561 518 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 562 557 Q 563 602 566 641 L 567 681 Q 567 699 570 726 Q 577 747 549 770 L 548 771 L 498 763 Q 508 745 513 666 L 513 629 Q 513 595 513 544 L 513 508 Q 514 471 514 427 L 559 433 Q 560 478 561 518 L 562 557 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 319 340 Q 496 406 765 418 Q 780 417 797 408 Q 810 398 808 379 Q 809 361 782 205 Q 761 112 739 78 Q 729 56 703 58 Q 675 67 647 74 Q 628 81 624 77 Q 620 71 637 58 Q 698 -21 702 -45 Q 706 -55 717 -57 Q 735 -61 771 -26 Q 805 8 817 52 Q 881 374 904 390 Q 914 397 913 405 Q 914 414 879 441 Q 831 471 800 461 Q 776 458 750 455 Q 669 455 559 433 L 514 427 Q 441 418 392 405 Q 355 401 353 428 L 319 340 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 184 301 Q 174 243 152 187 Q 140 150 166 118 Q 178 102 196 120 Q 215 142 222 177 Q 229 217 223 249 Q 222 283 208 307 Q 201 314 195 314 Q 186 310 184 301 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 304 255 Q 314 195 331 174 Q 340 165 352 171 Q 362 177 368 190 Q 375 229 333 273 Q 332 276 330 277 Q 320 287 312 289 Q 308 290 304 281 Q 300 272 304 255 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 423 278 Q 441 229 465 204 Q 477 197 488 206 Q 497 215 499 229 Q 500 251 490 267 Q 475 288 444 306 Q 432 315 423 314 Q 417 315 416 304 Q 415 294 423 278 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 565 311 Q 593 248 622 223 Q 635 216 647 226 Q 657 236 659 253 Q 659 295 588 342 L 587 343 Q 574 352 563 351 Q 557 351 556 339 Q 555 329 565 311 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 548 771 Q 737 807 742 810 Q 749 817 746 825 Q 740 837 714 844 Q 693 850 582 820 Q 465 796 366 789 Q 363 789 361 787 L 380 757 Q 396 753 490 762 Q 493 763 498 763 L 548 771 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 366 783 L 402 774 L 476 779 L 697 823 L 738 819\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"506 1012\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 361 787 Q 357 791 350 795 Q 313 820 293 823 Q 278 822 275 811 Q 272 799 282 790 Q 298 763 302 742 Q 317 582 286 407 Q 279 382 280 377 Q 281 367 296 355 Q 312 342 319 340 L 353 428 Q 349 456 355 606 Q 365 730 373 742 Q 377 749 380 757 L 361 787 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 291 806 L 325 775 L 337 754 L 322 435 L 307 377 L 318 349\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"608 1216\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 566 641 Q 669 668 671 669 Q 678 676 675 683 Q 668 692 645 697 Q 615 703 567 681 L 513 666 Q 479 659 438 654 Q 410 648 430 635 Q 463 617 509 629 Q 510 630 513 629 L 566 641 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 432 645 L 454 640 L 495 644 L 575 661 L 614 676 L 667 678\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"368 736\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 561 518 Q 598 528 638 536 Q 671 545 675 549 Q 682 556 679 563 Q 672 572 649 577 Q 625 581 562 557 L 513 544 Q 471 537 426 530 Q 398 526 418 512 Q 445 499 510 508 Q 511 508 513 508 L 561 518 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 420 522 L 463 519 L 516 526 L 626 555 L 669 558\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"381 762\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 562 557 Q 563 602 566 641 L 567 681 Q 567 699 570 726 Q 577 747 549 770 L 548 771 L 498 763 Q 508 745 513 666 L 513 629 Q 513 595 513 544 L 513 508 Q 514 471 514 427 L 559 433 Q 560 478 561 518 L 562 557 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 505 762 L 534 741 L 539 718 L 537 453 L 521 434\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"477 954\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 319 340 Q 496 406 765 418 Q 780 417 797 408 Q 810 398 808 379 Q 809 361 782 205 Q 761 112 739 78 Q 729 56 703 58 Q 675 67 647 74 Q 628 81 624 77 Q 620 71 637 58 Q 698 -21 702 -45 Q 706 -55 717 -57 Q 735 -61 771 -26 Q 805 8 817 52 Q 881 374 904 390 Q 914 397 913 405 Q 914 414 879 441 Q 831 471 800 461 Q 776 458 750 455 Q 669 455 559 433 L 514 427 Q 441 418 392 405 Q 355 401 353 428 L 319 340 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 324 347 L 362 382 L 603 424 L 773 437 L 811 434 L 840 418 L 854 400 L 847 359 L 805 153 L 782 73 L 765 38 L 734 10 L 692 30 L 629 74\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"1228 2456\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 184 301 Q 174 243 152 187 Q 140 150 166 118 Q 178 102 196 120 Q 215 142 222 177 Q 229 217 223 249 Q 222 283 208 307 Q 201 314 195 314 Q 186 310 184 301 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 197 303 L 198 239 L 180 128\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"304 608\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 304 255 Q 314 195 331 174 Q 340 165 352 171 Q 362 177 368 190 Q 375 229 333 273 Q 332 276 330 277 Q 320 287 312 289 Q 308 290 304 281 Q 300 272 304 255 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 313 280 L 343 207 L 343 185\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"229 458\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-8\">\n        <path d=\"M 423 278 Q 441 229 465 204 Q 477 197 488 206 Q 497 215 499 229 Q 500 251 490 267 Q 475 288 444 306 Q 432 315 423 314 Q 417 315 416 304 Q 415 294 423 278 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-8)\" d=\"M 426 304 L 467 249 L 475 220\" fill=\"none\" id=\"make-me-a-hanzi-animation-8\" stroke-dasharray=\"227 454\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-9\">\n        <path d=\"M 565 311 Q 593 248 622 223 Q 635 216 647 226 Q 657 236 659 253 Q 659 295 588 342 L 587 343 Q 574 352 563 351 Q 557 351 556 339 Q 555 329 565 311 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-9)\" d=\"M 567 340 L 626 264 L 633 241\" fill=\"none\" id=\"make-me-a-hanzi-animation-9\" stroke-dasharray=\"248 496\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 949;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0222981770833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 433;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6023763020833334s both;\n          animation-delay: 1.0222981770833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 683;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8058268229166666s both;\n          animation-delay: 1.6246744791666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1020;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.080078125s both;\n          animation-delay: 2.430501302083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 482;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6422526041666666s both;\n          animation-delay: 3.510579427083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 486;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.6455078125s both;\n          animation-delay: 4.15283203125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 539;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.6886393229166666s both;\n          animation-delay: 4.79833984375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 576;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.71875s both;\n          animation-delay: 5.486979166666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes8 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 512;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-8 {\n          animation: keyframes8 0.6666666666666666s both;\n          animation-delay: 6.205729166666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 486 755 Q 501 764 639 768 Q 673 769 877 770 Q 898 770 903 779 Q 909 791 892 805 Q 828 856 786 835 Q 591 802 209 759 Q 187 758 203 739 Q 218 724 236 719 Q 258 712 275 717 Q 354 739 445 750 L 486 755 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 431 603 Q 450 625 464 641 Q 516 704 526 710 Q 542 725 528 737 Q 512 749 486 755 L 445 750 Q 444 747 448 741 Q 457 717 403 600 L 431 603 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 358 597 Q 349 604 337 608 Q 327 612 315 608 Q 308 604 313 590 Q 346 497 329 317 Q 314 230 331 198 Q 337 188 345 177 Q 355 164 367 177 Q 376 190 378 205 L 381 240 Q 381 250 382 330 L 382 356 Q 382 411 383 450 L 383 476 Q 384 537 385 544 Q 386 557 386 566 L 358 597 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 662 230 Q 663 220 672 209 Q 688 176 698 178 Q 714 179 731 216 Q 747 244 746 268 Q 733 359 734 503 Q 733 545 756 580 Q 766 596 758 608 Q 728 633 677 656 Q 661 662 635 652 Q 560 622 431 603 L 403 600 Q 378 599 358 597 L 386 566 Q 390 566 394 567 Q 520 597 611 611 Q 642 617 653 600 Q 669 579 670 506 Q 674 299 664 259 Q 663 258 663 256 L 662 230 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 383 450 Q 393 447 410 449 Q 522 468 605 479 Q 630 482 621 496 Q 611 512 583 517 Q 562 520 383 476 L 383 450 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 382 330 Q 392 327 410 329 Q 525 345 609 355 Q 634 358 625 372 Q 615 388 588 393 Q 563 397 519 387 Q 446 371 382 356 L 382 330 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 378 205 Q 468 220 662 230 L 663 256 Q 656 262 646 269 Q 630 279 600 273 Q 479 251 381 240 L 378 205 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 399 159 Q 384 89 199 -39 Q 174 -54 204 -52 Q 276 -55 419 63 Q 420 69 476 113 Q 489 125 487 136 Q 486 151 457 162 Q 426 177 412 174 Q 403 173 399 159 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 615 132 Q 672 65 738 -29 Q 754 -54 770 -61 Q 780 -64 789 -53 Q 805 -40 797 11 Q 793 77 621 167 Q 611 174 607 160 Q 604 145 615 132 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 486 755 Q 501 764 639 768 Q 673 769 877 770 Q 898 770 903 779 Q 909 791 892 805 Q 828 856 786 835 Q 591 802 209 759 Q 187 758 203 739 Q 218 724 236 719 Q 258 712 275 717 Q 354 739 445 750 L 486 755 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 206 749 L 258 740 L 546 783 L 804 805 L 851 799 L 891 785\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"821 1642\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 431 603 Q 450 625 464 641 Q 516 704 526 710 Q 542 725 528 737 Q 512 749 486 755 L 445 750 Q 444 747 448 741 Q 457 717 403 600 L 431 603 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 452 747 L 483 718 L 426 616 L 409 611\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"305 610\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 358 597 Q 349 604 337 608 Q 327 612 315 608 Q 308 604 313 590 Q 346 497 329 317 Q 314 230 331 198 Q 337 188 345 177 Q 355 164 367 177 Q 376 190 378 205 L 381 240 Q 381 250 382 330 L 382 356 Q 382 411 383 450 L 383 476 Q 384 537 385 544 Q 386 557 386 566 L 358 597 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 323 599 L 341 580 L 355 552 L 359 415 L 351 250 L 356 183\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"555 1110\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 662 230 Q 663 220 672 209 Q 688 176 698 178 Q 714 179 731 216 Q 747 244 746 268 Q 733 359 734 503 Q 733 545 756 580 Q 766 596 758 608 Q 728 633 677 656 Q 661 662 635 652 Q 560 622 431 603 L 403 600 Q 378 599 358 597 L 386 566 Q 390 566 394 567 Q 520 597 611 611 Q 642 617 653 600 Q 669 579 670 506 Q 674 299 664 259 Q 663 258 663 256 L 662 230 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 365 594 L 400 583 L 637 632 L 661 631 L 698 600 L 707 580 L 701 518 L 706 262 L 698 190\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"892 1784\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 383 450 Q 393 447 410 449 Q 522 468 605 479 Q 630 482 621 496 Q 611 512 583 517 Q 562 520 383 476 L 383 450 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 390 457 L 401 466 L 563 495 L 610 490\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"354 708\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 382 330 Q 392 327 410 329 Q 525 345 609 355 Q 634 358 625 372 Q 615 388 588 393 Q 563 397 519 387 Q 446 371 382 356 L 382 330 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 389 337 L 407 346 L 559 371 L 591 373 L 614 366\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"358 716\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 378 205 Q 468 220 662 230 L 663 256 Q 656 262 646 269 Q 630 279 600 273 Q 479 251 381 240 L 378 205 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 382 210 L 396 225 L 595 250 L 639 250 L 651 237\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"411 822\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 399 159 Q 384 89 199 -39 Q 174 -54 204 -52 Q 276 -55 419 63 Q 420 69 476 113 Q 489 125 487 136 Q 486 151 457 162 Q 426 177 412 174 Q 403 173 399 159 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 467 133 L 432 130 L 360 51 L 303 7 L 209 -43\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"448 896\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-8\">\n        <path d=\"M 615 132 Q 672 65 738 -29 Q 754 -54 770 -61 Q 780 -64 789 -53 Q 805 -40 797 11 Q 793 77 621 167 Q 611 174 607 160 Q 604 145 615 132 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-8)\" d=\"M 619 153 L 704 77 L 747 29 L 774 -44\" fill=\"none\" id=\"make-me-a-hanzi-animation-8\" stroke-dasharray=\"384 768\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 611;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7472330729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1116;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.158203125s both;\n          animation-delay: 0.7472330729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1134;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1728515625s both;\n          animation-delay: 1.9054361979166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 300 555 Q 281 574 244 572 Q 231 566 237 554 Q 279 473 246 325 Q 219 261 257 217 Q 264 204 276 210 Q 309 234 309 331 Q 310 473 313 513 L 300 555 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 542 555 Q 593 562 656 568 Q 677 569 689 558 Q 707 552 711 526 Q 718 462 711 341 Q 712 313 686 313 Q 649 314 620 317 Q 601 318 607 309 Q 611 297 643 278 Q 689 247 717 212 Q 730 202 743 209 Q 771 228 784 319 Q 785 337 785 354 Q 770 540 785 563 Q 797 578 787 590 Q 774 602 724 620 Q 702 627 685 617 Q 660 610 591 601 Q 566 598 543 594 L 481 583 Q 447 579 418 573 Q 349 561 300 555 L 313 513 Q 323 514 334 522 Q 385 535 481 548 L 542 555 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 481 548 Q 480 481 480 395 Q 477 -10 486 -34 Q 487 -38 491 -44 Q 507 -60 517 -38 Q 536 16 537 342 Q 538 466 542 555 L 543 594 Q 546 720 569 755 Q 576 773 555 789 Q 528 811 482 823 Q 461 829 447 813 Q 437 804 450 791 Q 478 766 481 731 Q 481 673 481 583 L 481 548 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 300 555 Q 281 574 244 572 Q 231 566 237 554 Q 279 473 246 325 Q 219 261 257 217 Q 264 204 276 210 Q 309 234 309 331 Q 310 473 313 513 L 300 555 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 247 561 L 275 538 L 285 493 L 284 386 L 270 280 L 269 221\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"483 966\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 542 555 Q 593 562 656 568 Q 677 569 689 558 Q 707 552 711 526 Q 718 462 711 341 Q 712 313 686 313 Q 649 314 620 317 Q 601 318 607 309 Q 611 297 643 278 Q 689 247 717 212 Q 730 202 743 209 Q 771 228 784 319 Q 785 337 785 354 Q 770 540 785 563 Q 797 578 787 590 Q 774 602 724 620 Q 702 627 685 617 Q 660 610 591 601 Q 566 598 543 594 L 481 583 Q 447 579 418 573 Q 349 561 300 555 L 313 513 Q 323 514 334 522 Q 385 535 481 548 L 542 555 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 307 550 L 324 539 L 604 584 L 674 591 L 721 583 L 741 567 L 743 556 L 746 314 L 725 274 L 616 309\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"988 1976\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 481 548 Q 480 481 480 395 Q 477 -10 486 -34 Q 487 -38 491 -44 Q 507 -60 517 -38 Q 536 16 537 342 Q 538 466 542 555 L 543 594 Q 546 720 569 755 Q 576 773 555 789 Q 528 811 482 823 Q 461 829 447 813 Q 437 804 450 791 Q 478 766 481 731 Q 481 673 481 583 L 481 548 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 456 803 L 469 803 L 494 788 L 521 759 L 511 592 L 503 -37\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1006 2012\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 407;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5812174479166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 491;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6495768229166666s both;\n          animation-delay: 0.5812174479166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 923;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0011393229166667s both;\n          animation-delay: 1.2307942708333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1152;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.1875s both;\n          animation-delay: 2.23193359375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 753;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.86279296875s both;\n          animation-delay: 3.41943359375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 821;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.9181315104166666s both;\n          animation-delay: 4.2822265625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 292 617 Q 319 592 347 561 Q 362 546 379 546 Q 391 546 396 561 Q 402 577 394 610 Q 388 631 356 647 Q 283 678 264 671 Q 258 667 260 653 Q 263 640 292 617 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 672 704 Q 657 680 587 592 Q 575 573 595 577 Q 622 592 719 653 Q 741 672 768 683 Q 792 693 780 714 Q 765 733 736 750 Q 709 766 695 762 Q 680 761 685 745 Q 689 724 672 704 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 524 439 Q 597 451 810 470 Q 823 469 835 483 Q 836 498 809 512 Q 770 536 736 529 Q 595 496 522 485 L 478 477 Q 451 474 171 447 Q 135 444 162 422 Q 175 409 193 398 Q 209 388 237 395 Q 328 413 438 427 L 524 439 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 475 387 Q 472 186 461 131 Q 439 22 451 -8 Q 455 -21 462 -37 Q 469 -56 477 -59 Q 484 -66 492 -57 Q 499 -53 510 -31 Q 520 -6 520 28 Q 519 71 521 392 L 522 485 Q 528 704 541 751 Q 550 788 550 791 Q 543 801 485 837 Q 460 855 439 838 Q 433 834 440 817 Q 476 765 476 712 Q 477 636 480 548 Q 479 514 478 477 L 475 387 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 438 427 Q 354 262 119 87 Q 107 75 116 73 Q 125 69 137 74 Q 269 126 386 267 Q 441 342 475 387 L 476.51246105919006 432.3738317757009 L 438 427 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 521 392 Q 678 158 763 98 Q 778 89 794 89 Q 869 99 932 107 Q 960 110 960 117 Q 961 124 929 138 Q 767 198 721 238 Q 616 325 524 439 L 521.5016278487353 438.6513899323817 L 521 392 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 292 617 Q 319 592 347 561 Q 362 546 379 546 Q 391 546 396 561 Q 402 577 394 610 Q 388 631 356 647 Q 283 678 264 671 Q 258 667 260 653 Q 263 640 292 617 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 269 663 L 356 604 L 378 564\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"279 558\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 672 704 Q 657 680 587 592 Q 575 573 595 577 Q 622 592 719 653 Q 741 672 768 683 Q 792 693 780 714 Q 765 733 736 750 Q 709 766 695 762 Q 680 761 685 745 Q 689 724 672 704 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 694 751 L 715 729 L 723 708 L 693 674 L 590 584\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"363 726\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 524 439 Q 597 451 810 470 Q 823 469 835 483 Q 836 498 809 512 Q 770 536 736 529 Q 595 496 522 485 L 478 477 Q 451 474 171 447 Q 135 444 162 422 Q 175 409 193 398 Q 209 388 237 395 Q 328 413 438 427 L 524 439 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 164 435 L 224 422 L 485 455 L 755 498 L 823 485\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"795 1590\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 475 387 Q 472 186 461 131 Q 439 22 451 -8 Q 455 -21 462 -37 Q 469 -56 477 -59 Q 484 -66 492 -57 Q 499 -53 510 -31 Q 520 -6 520 28 Q 519 71 521 392 L 522 485 Q 528 704 541 751 Q 550 788 550 791 Q 543 801 485 837 Q 460 855 439 838 Q 433 834 440 817 Q 476 765 476 712 Q 477 636 480 548 Q 479 514 478 477 L 475 387 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 453 829 L 481 807 L 507 770 L 498 277 L 483 -45\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"1024 2048\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 438 427 Q 354 262 119 87 Q 107 75 116 73 Q 125 69 137 74 Q 269 126 386 267 Q 441 342 475 387 L 476.51246105919006 432.3738317757009 L 438 427 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 471 425 L 363 275 L 293 202 L 223 142 L 122 79\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"625 1250\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 521 392 Q 678 158 763 98 Q 778 89 794 89 Q 869 99 932 107 Q 960 110 960 117 Q 961 124 929 138 Q 767 198 721 238 Q 616 325 524 439 L 521.5016278487353 438.6513899323817 L 521 392 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 524 431 L 540 391 L 581 339 L 693 216 L 751 166 L 796 138 L 954 117\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"693 1386\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 630;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7626953125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 547;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6951497395833334s both;\n          animation-delay: 0.7626953125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 944;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0182291666666667s both;\n          animation-delay: 1.4578450520833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 471;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.63330078125s both;\n          animation-delay: 2.47607421875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 520;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6731770833333334s both;\n          animation-delay: 3.109375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1064;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.1158854166666667s both;\n          animation-delay: 3.7825520833333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1212;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 1.236328125s both;\n          animation-delay: 4.8984375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 552 695 Q 610 707 671 717 Q 723 729 730 735 Q 740 742 735 752 Q 728 764 698 772 Q 667 779 637 768 Q 595 755 553 743 L 490 729 Q 429 719 363 713 Q 326 709 352 690 Q 391 666 464 680 Q 476 683 490 683 L 552 695 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 317 580 Q 293 592 270 595 Q 263 596 257 591 Q 250 584 261 573 Q 294 534 319 403 Q 326 337 368 312 Q 369 312 371 311 Q 386 308 388 330 L 385 364 Q 381 388 372 413 Q 353 518 349 541 L 317 580 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 655 361 Q 655 358 657 354 Q 661 336 676 337 Q 692 338 701 354 Q 717 372 746 461 Q 767 519 808 551 Q 830 569 813 587 Q 794 606 737 638 Q 719 651 650 633 Q 598 630 549 619 L 490 609 Q 460 605 435 599 Q 365 586 317 580 L 349 541 Q 400 557 491 571 L 549 580 Q 678 601 701 589 Q 711 582 704 547 Q 674 418 660 390 L 655 361 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 549 466 Q 586 473 622 476 Q 644 479 637 492 Q 627 507 601 513 Q 582 517 549 509 L 492 495 Q 449 485 412 477 Q 396 473 415 458 Q 425 451 446 453 Q 468 457 492 459 L 549 466 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 550 352 Q 595 358 655 361 L 660 390 Q 630 412 549 391 L 493 380 Q 435 370 385 364 L 388 330 Q 395 330 403 331 Q 437 340 493 345 L 550 352 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 551 225 Q 630 231 900 232 Q 925 231 931 242 Q 938 257 918 274 Q 839 334 793 311 Q 697 295 551 273 L 492 264 Q 323 245 124 223 Q 97 222 117 199 Q 159 160 203 173 Q 374 218 461 218 Q 474 221 492 220 L 551 225 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 492 220 Q 483 43 500 -38 Q 503 -56 511 -68 Q 527 -84 536 -61 Q 552 -22 551 225 L 551 273 Q 550 310 550 352 L 549 391 Q 549 431 549 466 L 549 509 Q 549 546 549 580 L 549 619 Q 550 662 552 695 L 553 743 Q 553 744 554 745 Q 555 781 574 812 Q 581 830 559 846 Q 532 867 486 878 Q 465 884 451 868 Q 441 859 455 846 Q 486 819 489 781 Q 489 759 490 729 L 490 683 Q 490 650 490 609 L 491 571 Q 491 537 492 495 L 492 459 Q 492 420 493 380 L 493 345 Q 493 302 492 264 L 492 220 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 552 695 Q 610 707 671 717 Q 723 729 730 735 Q 740 742 735 752 Q 728 764 698 772 Q 667 779 637 768 Q 595 755 553 743 L 490 729 Q 429 719 363 713 Q 326 709 352 690 Q 391 666 464 680 Q 476 683 490 683 L 552 695 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 355 703 L 421 696 L 509 709 L 664 745 L 724 746\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"502 1004\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 317 580 Q 293 592 270 595 Q 263 596 257 591 Q 250 584 261 573 Q 294 534 319 403 Q 326 337 368 312 Q 369 312 371 311 Q 386 308 388 330 L 385 364 Q 381 388 372 413 Q 353 518 349 541 L 317 580 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 266 584 L 301 559 L 320 525 L 354 371 L 374 324\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"419 838\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 655 361 Q 655 358 657 354 Q 661 336 676 337 Q 692 338 701 354 Q 717 372 746 461 Q 767 519 808 551 Q 830 569 813 587 Q 794 606 737 638 Q 719 651 650 633 Q 598 630 549 619 L 490 609 Q 460 605 435 599 Q 365 586 317 580 L 349 541 Q 400 557 491 571 L 549 580 Q 678 601 701 589 Q 711 582 704 547 Q 674 418 660 390 L 655 361 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 324 577 L 360 565 L 630 612 L 701 617 L 720 612 L 743 591 L 756 569 L 675 355\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"816 1632\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 549 466 Q 586 473 622 476 Q 644 479 637 492 Q 627 507 601 513 Q 582 517 549 509 L 492 495 Q 449 485 412 477 Q 396 473 415 458 Q 425 451 446 453 Q 468 457 492 459 L 549 466 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 414 468 L 593 494 L 626 487\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"343 686\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 550 352 Q 595 358 655 361 L 660 390 Q 630 412 549 391 L 493 380 Q 435 370 385 364 L 388 330 Q 395 330 403 331 Q 437 340 493 345 L 550 352 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 395 336 L 409 351 L 564 375 L 638 380 L 646 370\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"392 784\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 551 225 Q 630 231 900 232 Q 925 231 931 242 Q 938 257 918 274 Q 839 334 793 311 Q 697 295 551 273 L 492 264 Q 323 245 124 223 Q 97 222 117 199 Q 159 160 203 173 Q 374 218 461 218 Q 474 221 492 220 L 551 225 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 120 211 L 181 199 L 386 233 L 813 274 L 860 269 L 918 249\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"936 1872\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 492 220 Q 483 43 500 -38 Q 503 -56 511 -68 Q 527 -84 536 -61 Q 552 -22 551 225 L 551 273 Q 550 310 550 352 L 549 391 Q 549 431 549 466 L 549 509 Q 549 546 549 580 L 549 619 Q 550 662 552 695 L 553 743 Q 553 744 554 745 Q 555 781 574 812 Q 581 830 559 846 Q 532 867 486 878 Q 465 884 451 868 Q 441 859 455 846 Q 486 819 489 781 Q 489 759 490 729 L 490 683 Q 490 650 490 609 L 491 571 Q 491 537 492 495 L 492 459 Q 492 420 493 380 L 493 345 Q 493 302 492 264 L 492 220 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 461 858 L 488 851 L 526 815 L 519 633 L 523 -61\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"1084 2168\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 720;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8359375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1062;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1142578125s both;\n          animation-delay: 0.8359375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 317 465 Q 318 338 155 190 Q 136 178 79 126 Q 67 110 85 113 Q 110 114 146 137 Q 258 209 325 305 Q 368 363 406 409 Q 419 422 404 441 Q 355 486 329 484 Q 316 483 317 465 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 446 687 Q 507 636 530 577 Q 608 343 711 190 Q 732 163 846 151 Q 892 147 958 141 Q 983 140 984 146 Q 984 152 963 163 Q 756 269 675 396 Q 621 480 551 644 Q 530 690 483 702 Q 449 709 445 702 Q 438 692 446 687 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 317 465 Q 318 338 155 190 Q 136 178 79 126 Q 67 110 85 113 Q 110 114 146 137 Q 258 209 325 305 Q 368 363 406 409 Q 419 422 404 441 Q 355 486 329 484 Q 316 483 317 465 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 331 470 L 358 421 L 291 303 L 204 206 L 143 156 L 89 123\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"592 1184\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 446 687 Q 507 636 530 577 Q 608 343 711 190 Q 732 163 846 151 Q 892 147 958 141 Q 983 140 984 146 Q 984 152 963 163 Q 756 269 675 396 Q 621 480 551 644 Q 530 690 483 702 Q 449 709 445 702 Q 438 692 446 687 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 452 695 L 484 681 L 525 640 L 645 378 L 693 302 L 755 227 L 839 190 L 978 147\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"934 1868\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 774;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8798828125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 623;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7569986979166666s both;\n          animation-delay: 0.8798828125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1057;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1101888020833333s both;\n          animation-delay: 1.6368815104166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 719 568 Q 749 661 786 687 Q 805 708 788 728 Q 706 791 647 762 Q 533 722 378 699 L 390 662 Q 400 663 415 668 Q 530 692 639 715 Q 667 722 679 711 Q 689 701 687 678 Q 677 621 663 573 L 719 568 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 371 482 Q 392 476 406 479 Q 509 504 734 529 Q 747 530 748 541 Q 748 550 719 568 L 663 573 Q 662 574 660 573 Q 501 533 374 514 L 371 482 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 378 699 Q 377 700 376 700 Q 324 728 306 726 Q 284 723 301 698 Q 320 661 320 613 Q 323 549 306 414 Q 296 323 246 217 Q 216 156 122 60 Q 89 36 77 18 Q 76 11 88 10 Q 106 10 129 25 Q 187 61 223 97 Q 322 199 353 369 Q 363 420 371 482 L 374 514 Q 380 569 384 631 Q 388 650 390 662 L 378 699 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 719 568 Q 749 661 786 687 Q 805 708 788 728 Q 706 791 647 762 Q 533 722 378 699 L 390 662 Q 400 663 415 668 Q 530 692 639 715 Q 667 722 679 711 Q 689 701 687 678 Q 677 621 663 573 L 719 568 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 387 695 L 399 685 L 434 689 L 648 739 L 681 743 L 699 737 L 734 706 L 699 598 L 671 578\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"646 1292\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 371 482 Q 392 476 406 479 Q 509 504 734 529 Q 747 530 748 541 Q 748 550 719 568 L 663 573 Q 662 574 660 573 Q 501 533 374 514 L 371 482 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 379 487 L 411 501 L 658 546 L 710 548 L 738 541\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"495 990\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 378 699 Q 377 700 376 700 Q 324 728 306 726 Q 284 723 301 698 Q 320 661 320 613 Q 323 549 306 414 Q 296 323 246 217 Q 216 156 122 60 Q 89 36 77 18 Q 76 11 88 10 Q 106 10 129 25 Q 187 61 223 97 Q 322 199 353 369 Q 363 420 371 482 L 374 514 Q 380 569 384 631 Q 388 650 390 662 L 378 699 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 307 711 L 348 674 L 353 646 L 339 448 L 309 300 L 281 228 L 237 152 L 152 63 L 86 19\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"929 1858\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1047;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.10205078125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1217;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.2403971354166667s both;\n          animation-delay: 1.10205078125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 417;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.58935546875s both;\n          animation-delay: 2.342447916666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 639 526 Q 756 544 901 531 Q 925 530 931 538 Q 938 551 926 564 Q 895 592 849 612 Q 833 618 807 608 Q 740 592 670 581 Q 654 580 640 576 L 586 569 Q 211 521 157 518 Q 150 519 144 518 Q 129 517 129 505 Q 128 492 148 478 Q 166 465 199 454 Q 209 450 229 459 Q 271 474 414 499 Q 498 515 586 520 L 639 526 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 586 520 Q 587 372 588 117 Q 587 93 575 84 Q 565 75 537 82 Q 506 88 476 93 Q 439 103 443 92 Q 444 85 468 70 Q 547 19 568 -12 Q 593 -49 611 -48 Q 627 -49 641 -11 Q 657 38 653 117 Q 638 322 639 526 L 640 576 Q 640 687 658 753 Q 677 786 616 810 Q 579 829 559 821 Q 540 814 557 789 Q 581 761 583 724 Q 584 708 586 569 L 586 520 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 342 367 Q 369 336 397 299 Q 410 283 428 280 Q 441 279 448 293 Q 457 309 451 344 Q 448 368 416 389 Q 382 407 345 423 Q 329 429 320 427 Q 314 424 314 409 Q 315 396 342 367 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 639 526 Q 756 544 901 531 Q 925 530 931 538 Q 938 551 926 564 Q 895 592 849 612 Q 833 618 807 608 Q 740 592 670 581 Q 654 580 640 576 L 586 569 Q 211 521 157 518 Q 150 519 144 518 Q 129 517 129 505 Q 128 492 148 478 Q 166 465 199 454 Q 209 450 229 459 Q 271 474 414 499 Q 498 515 586 520 L 639 526 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 142 505 L 155 497 L 207 488 L 477 534 L 834 575 L 919 547\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"919 1838\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 586 520 Q 587 372 588 117 Q 587 93 575 84 Q 565 75 537 82 Q 506 88 476 93 Q 439 103 443 92 Q 444 85 468 70 Q 547 19 568 -12 Q 593 -49 611 -48 Q 627 -49 641 -11 Q 657 38 653 117 Q 638 322 639 526 L 640 576 Q 640 687 658 753 Q 677 786 616 810 Q 579 829 559 821 Q 540 814 557 789 Q 581 761 583 724 Q 584 708 586 569 L 586 520 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 562 808 L 584 796 L 618 763 L 612 466 L 619 91 L 597 36 L 552 48 L 450 92\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1089 2178\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 342 367 Q 369 336 397 299 Q 410 283 428 280 Q 441 279 448 293 Q 457 309 451 344 Q 448 368 416 389 Q 382 407 345 423 Q 329 429 320 427 Q 314 424 314 409 Q 315 396 342 367 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 325 418 L 408 347 L 429 300\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"289 578\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 827;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9230143229166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1115;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1573893229166667s both;\n          animation-delay: 0.9230143229166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 706;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8245442708333334s both;\n          animation-delay: 2.0804036458333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 536 209 Q 546 407 552 587 Q 556 633 562 664 Q 569 691 574 710 Q 578 723 554 740 Q 512 762 484 767 Q 465 771 456 760 Q 447 751 457 734 Q 488 688 489 655 Q 499 444 488 200 L 536 209 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 796 244 Q 657 232 536 209 L 488 200 Q 379 182 284 155 Q 256 148 263 180 Q 267 253 272 329 Q 275 357 263 373 Q 220 416 190 409 Q 178 403 188 382 Q 224 309 215 236 Q 211 166 182 133 Q 161 112 170 96 Q 183 78 203 66 Q 219 57 230 67 Q 243 83 283 99 Q 440 151 606 182 Q 757 210 789 197 L 796 244 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 789 197 Q 783 166 774 145 Q 756 118 785 55 Q 795 36 809 49 Q 837 73 846 173 Q 868 386 890 427 Q 900 443 889 460 Q 867 479 831 501 Q 816 510 802 503 Q 793 499 796 484 Q 823 435 796 244 L 789 197 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 536 209 Q 546 407 552 587 Q 556 633 562 664 Q 569 691 574 710 Q 578 723 554 740 Q 512 762 484 767 Q 465 771 456 760 Q 447 751 457 734 Q 488 688 489 655 Q 499 444 488 200 L 536 209 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 472 748 L 525 700 L 514 235 L 493 208\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"699 1398\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 796 244 Q 657 232 536 209 L 488 200 Q 379 182 284 155 Q 256 148 263 180 Q 267 253 272 329 Q 275 357 263 373 Q 220 416 190 409 Q 178 403 188 382 Q 224 309 215 236 Q 211 166 182 133 Q 161 112 170 96 Q 183 78 203 66 Q 219 57 230 67 Q 243 83 283 99 Q 440 151 606 182 Q 757 210 789 197 L 796 244 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 196 398 L 217 379 L 239 340 L 243 263 L 233 126 L 282 127 L 380 155 L 575 197 L 710 218 L 772 221 L 788 237\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"987 1974\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 789 197 Q 783 166 774 145 Q 756 118 785 55 Q 795 36 809 49 Q 837 73 846 173 Q 868 386 890 427 Q 900 443 889 460 Q 867 479 831 501 Q 816 510 802 503 Q 793 499 796 484 Q 823 435 796 244 L 789 197 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 810 490 L 826 477 L 849 433 L 798 57\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"578 1156\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 775;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8806966145833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 614;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7496744791666666s both;\n          animation-delay: 0.8806966145833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 941;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0157877604166667s both;\n          animation-delay: 1.63037109375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 949;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.0222981770833333s both;\n          animation-delay: 2.646158854166667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 398 698 Q 350 542 220 346 Q 210 333 209 327 Q 206 314 221 319 Q 248 325 317 421 L 332 443 Q 336 450 343 459 Q 365 490 388 530 L 403 556 Q 472 691 486 705 Q 495 718 488 732 Q 482 745 449 766 Q 418 784 399 781 Q 378 777 390 754 Q 406 726 398 698 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 591 537 Q 645 552 703 564 Q 749 576 756 582 Q 766 592 760 602 Q 751 615 717 623 Q 681 630 582 593 Q 477 566 403 556 L 388 530 Q 437 508 518 522 Q 524 523 532 524 L 591 537 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 466 229 Q 399 142 279 97 Q 246 87 206 75 Q 191 72 187 69 Q 181 65 197 59 Q 251 44 378 89 Q 453 119 498 184 L 528 234 Q 529 238 532 241 Q 566 313 596 428 Q 603 456 621 489 Q 628 499 621 510 Q 611 523 591 537 L 532 524 Q 562 455 491 274 L 466 229 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 317 421 Q 369 379 466 229 L 498 184 Q 541 126 597 62 Q 615 40 646 35 Q 743 22 822 24 Q 864 25 862 36 Q 859 42 672 123 Q 599 163 528 234 L 491 274 Q 442 329 394 394 Q 366 434 332 443 L 317 421 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 398 698 Q 350 542 220 346 Q 210 333 209 327 Q 206 314 221 319 Q 248 325 317 421 L 332 443 Q 336 450 343 459 Q 365 490 388 530 L 403 556 Q 472 691 486 705 Q 495 718 488 732 Q 482 745 449 766 Q 418 784 399 781 Q 378 777 390 754 Q 406 726 398 698 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 400 766 L 419 753 L 443 719 L 422 661 L 385 580 L 322 468 L 258 371 L 218 328\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"647 1294\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 591 537 Q 645 552 703 564 Q 749 576 756 582 Q 766 592 760 602 Q 751 615 717 623 Q 681 630 582 593 Q 477 566 403 556 L 388 530 Q 437 508 518 522 Q 524 523 532 524 L 591 537 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 396 534 L 413 540 L 505 546 L 684 592 L 747 594\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"486 972\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 466 229 Q 399 142 279 97 Q 246 87 206 75 Q 191 72 187 69 Q 181 65 197 59 Q 251 44 378 89 Q 453 119 498 184 L 528 234 Q 529 238 532 241 Q 566 313 596 428 Q 603 456 621 489 Q 628 499 621 510 Q 611 523 591 537 L 532 524 Q 562 455 491 274 L 466 229 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 540 522 L 577 497 L 578 485 L 563 409 L 531 305 L 508 250 L 480 204 L 434 154 L 373 114 L 260 73 L 193 65\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"813 1626\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 317 421 Q 369 379 466 229 L 498 184 Q 541 126 597 62 Q 615 40 646 35 Q 743 22 822 24 Q 864 25 862 36 Q 859 42 672 123 Q 599 163 528 234 L 491 274 Q 442 329 394 394 Q 366 434 332 443 L 317 421 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 325 424 L 344 421 L 364 401 L 507 216 L 577 141 L 639 87 L 733 59 L 859 34\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"821 1642\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 684;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.806640625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 802;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.9026692708333334s both;\n          animation-delay: 0.806640625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 660;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.787109375s both;\n          animation-delay: 1.7093098958333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 570 808 Q 545 829 525 830 Q 506 830 512 807 Q 522 782 511 761 Q 480 692 432 629 Q 386 569 325 503 Q 315 493 311 487 Q 307 477 322 477 Q 380 484 535 675 Q 559 720 593 745 Q 603 755 600 770 Q 597 783 570 808 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 536 531 Q 461 384 281 195 Q 271 185 267 179 Q 263 169 278 170 Q 326 177 472 342 L 500 375 Q 531 414 565 458 Q 596 506 622 528 Q 632 538 629 553 Q 625 566 597 592 Q 572 614 551 615 Q 532 614 538 591 Q 551 557 536 531 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 472 342 Q 490 303 490 231 Q 490 138 470 55 Q 460 10 494 -41 Q 495 -41 497 -44 Q 515 -60 527 -33 Q 542 7 541 54 Q 540 249 545 292 Q 552 319 543 330 Q 504 372 500 375 L 472 342 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 570 808 Q 545 829 525 830 Q 506 830 512 807 Q 522 782 511 761 Q 480 692 432 629 Q 386 569 325 503 Q 315 493 311 487 Q 307 477 322 477 Q 380 484 535 675 Q 559 720 593 745 Q 603 755 600 770 Q 597 783 570 808 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 524 815 L 540 800 L 555 766 L 505 683 L 413 568 L 362 517 L 320 486\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"556 1112\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 536 531 Q 461 384 281 195 Q 271 185 267 179 Q 263 169 278 170 Q 326 177 472 342 L 500 375 Q 531 414 565 458 Q 596 506 622 528 Q 632 538 629 553 Q 625 566 597 592 Q 572 614 551 615 Q 532 614 538 591 Q 551 557 536 531 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 551 600 L 573 574 L 582 546 L 545 482 L 416 311 L 319 211 L 275 178\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"674 1348\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 472 342 Q 490 303 490 231 Q 490 138 470 55 Q 460 10 494 -41 Q 495 -41 497 -44 Q 515 -60 527 -33 Q 542 7 541 54 Q 540 249 545 292 Q 552 319 543 330 Q 504 372 500 375 L 472 342 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 497 368 L 503 334 L 516 306 L 515 157 L 504 33 L 510 -32\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"532 1064\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1092;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.138671875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1138;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1761067708333333s both;\n          animation-delay: 1.138671875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 541 450 Q 754 474 901 462 Q 935 462 940 467 Q 949 482 935 494 Q 862 560 793 538 Q 745 529 542 499 L 482 492 Q 355 479 290 469 Q 218 457 112 455 Q 97 455 96 443 Q 95 430 116 414 Q 134 401 168 388 Q 180 384 199 393 Q 215 399 292 413 Q 377 434 482 444 L 541 450 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 482 444 Q 482 240 478 171 Q 475 -6 495 -40 Q 511 -56 521 -34 Q 539 21 540 425 Q 540 438 541 450 L 542 499 Q 543 722 569 763 Q 576 781 555 798 Q 528 819 482 830 Q 461 836 447 821 Q 437 812 450 799 Q 480 774 482 739 Q 482 651 482 492 L 482 444 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 541 450 Q 754 474 901 462 Q 935 462 940 467 Q 949 482 935 494 Q 862 560 793 538 Q 745 529 542 499 L 482 492 Q 355 479 290 469 Q 218 457 112 455 Q 97 455 96 443 Q 95 430 116 414 Q 134 401 168 388 Q 180 384 199 393 Q 215 399 292 413 Q 377 434 482 444 L 541 450 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 109 442 L 177 422 L 373 456 L 819 505 L 869 499 L 932 476\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"964 1928\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 482 444 Q 482 240 478 171 Q 475 -6 495 -40 Q 511 -56 521 -34 Q 539 21 540 425 Q 540 438 541 450 L 542 499 Q 543 722 569 763 Q 576 781 555 798 Q 528 819 482 830 Q 461 836 447 821 Q 437 812 450 799 Q 480 774 482 739 Q 482 651 482 492 L 482 444 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 456 811 L 484 803 L 522 767 L 512 593 L 507 -33\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1010 2020\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 735;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.84814453125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 679;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8025716145833334s both;\n          animation-delay: 0.84814453125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1111;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1541341145833333s both;\n          animation-delay: 1.6507161458333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 538 620 Q 614 633 697 643 Q 766 656 777 664 Q 787 673 783 682 Q 776 697 743 706 Q 709 716 675 704 Q 596 682 510 665 Q 416 649 306 645 Q 264 641 293 620 Q 336 589 402 601 Q 439 607 477 611 L 538 620 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 535 216 Q 562 534 573 562 Q 586 581 572 596 Q 554 611 538 620 L 477 611 Q 496 580 495 539 Q 491 385 487 212 L 535 216 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 521 162 Q 578 163 632 168 Q 779 178 927 159 Q 955 155 962 165 Q 972 180 958 194 Q 924 228 873 252 Q 857 259 827 250 Q 754 237 678 228 Q 593 222 535 216 L 487 212 Q 357 202 291 195 Q 218 186 109 188 Q 93 188 91 175 Q 90 160 111 143 Q 130 128 166 113 Q 179 109 200 117 Q 218 123 295 134 Q 397 153 521 162 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 538 620 Q 614 633 697 643 Q 766 656 777 664 Q 787 673 783 682 Q 776 697 743 706 Q 709 716 675 704 Q 596 682 510 665 Q 416 649 306 645 Q 264 641 293 620 Q 336 589 402 601 Q 439 607 477 611 L 538 620 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 296 634 L 346 623 L 389 624 L 512 640 L 710 679 L 769 677\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"607 1214\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 535 216 Q 562 534 573 562 Q 586 581 572 596 Q 554 611 538 620 L 477 611 Q 496 580 495 539 Q 491 385 487 212 L 535 216 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 485 607 L 534 573 L 513 239 L 492 220\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"551 1102\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 521 162 Q 578 163 632 168 Q 779 178 927 159 Q 955 155 962 165 Q 972 180 958 194 Q 924 228 873 252 Q 857 259 827 250 Q 754 237 678 228 Q 593 222 535 216 L 487 212 Q 357 202 291 195 Q 218 186 109 188 Q 93 188 91 175 Q 90 160 111 143 Q 130 128 166 113 Q 179 109 200 117 Q 218 123 295 134 Q 397 153 521 162 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 106 173 L 143 157 L 183 150 L 424 181 L 855 211 L 948 177\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"983 1966\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 436;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6048177083333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1027;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0857747395833333s both;\n          animation-delay: 0.6048177083333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 960;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.03125s both;\n          animation-delay: 1.6905924479166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 885;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.97021484375s both;\n          animation-delay: 2.7218424479166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 472 770 Q 506 739 544 700 Q 560 684 580 684 Q 593 684 600 701 Q 607 719 596 756 Q 584 798 467 830 Q 448 834 440 832 Q 433 828 435 811 Q 439 798 472 770 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 514 542 Q 643 563 895 562 Q 919 563 924 573 Q 931 586 911 603 Q 848 646 789 635 Q 576 592 151 534 Q 126 531 144 511 Q 162 495 182 489 Q 207 483 226 489 Q 341 520 470 537 Q 471 538 474 537 L 514 542 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 510 433 Q 528 415 615 398 Q 657 389 656 353 Q 653 343 650 324 Q 625 180 576 113 Q 566 101 551 96 Q 527 89 462 118 Q 422 133 418 126 Q 414 116 432 105 Q 492 69 520 19 Q 526 1 538 -5 Q 551 -9 586 14 Q 640 62 688 241 Q 709 334 734 348 Q 746 354 747 363 Q 748 373 725 399 Q 692 432 642 431 Q 584 435 528 459 L 510 433 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 528 459 Q 531 463 534 466 Q 549 476 547 492 Q 540 516 515 542 Q 514 543 514 542 L 474 537 Q 481 465 324 257 Q 311 242 298 228 Q 234 162 126 90 Q 119 86 114 81 Q 107 72 118 69 Q 139 63 245 122 Q 270 140 298 162 Q 397 246 493 406 Q 500 421 510 433 L 528 459 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 472 770 Q 506 739 544 700 Q 560 684 580 684 Q 593 684 600 701 Q 607 719 596 756 Q 584 798 467 830 Q 448 834 440 832 Q 433 828 435 811 Q 439 798 472 770 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 446 823 L 543 758 L 557 745 L 578 706\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"308 616\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 514 542 Q 643 563 895 562 Q 919 563 924 573 Q 931 586 911 603 Q 848 646 789 635 Q 576 592 151 534 Q 126 531 144 511 Q 162 495 182 489 Q 207 483 226 489 Q 341 520 470 537 Q 471 538 474 537 L 514 542 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 148 522 L 214 514 L 511 565 L 812 600 L 874 592 L 910 580\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"899 1798\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 510 433 Q 528 415 615 398 Q 657 389 656 353 Q 653 343 650 324 Q 625 180 576 113 Q 566 101 551 96 Q 527 89 462 118 Q 422 133 418 126 Q 414 116 432 105 Q 492 69 520 19 Q 526 1 538 -5 Q 551 -9 586 14 Q 640 62 688 241 Q 709 334 734 348 Q 746 354 747 363 Q 748 373 725 399 Q 692 432 642 431 Q 584 435 528 459 L 510 433 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 518 437 L 534 438 L 649 409 L 688 383 L 695 370 L 660 237 L 635 160 L 606 100 L 584 71 L 557 50 L 423 122\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"832 1664\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 528 459 Q 531 463 534 466 Q 549 476 547 492 Q 540 516 515 542 Q 514 543 514 542 L 474 537 Q 481 465 324 257 Q 311 242 298 228 Q 234 162 126 90 Q 119 86 114 81 Q 107 72 118 69 Q 139 63 245 122 Q 270 140 298 162 Q 397 246 493 406 Q 500 421 510 433 L 528 459 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 481 534 L 503 510 L 507 492 L 418 339 L 344 241 L 288 184 L 225 133 L 122 77\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"757 1514\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 963;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.03369140625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 686;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8082682291666666s both;\n          animation-delay: 1.03369140625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 349;\n            stroke-width: 128;\n          }\n          53% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5340169270833334s both;\n          animation-delay: 1.8419596354166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 381;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.56005859375s both;\n          animation-delay: 2.3759765625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 566;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7106119791666666s both;\n          animation-delay: 2.93603515625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1313;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.3185221354166667s both;\n          animation-delay: 3.6466471354166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 370;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.5511067708333334s both;\n          animation-delay: 4.965169270833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 419;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.5909830729166666s both;\n          animation-delay: 5.516276041666666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 270 716 Q 246 740 213 748 Q 203 751 196 741 Q 192 735 200 724 Q 260 577 214 260 Q 205 202 186 142 Q 176 114 181 92 Q 191 55 203 41 Q 216 26 226 41 Q 263 80 264 255 Q 264 357 267 461 L 268 494 Q 268 534 271 565 L 272 599 Q 276 663 281 689 L 270 716 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 386 477 Q 387 473 394 464 Q 416 433 436 460 Q 448 476 455 535 Q 458 649 485 690 Q 498 708 484 723 Q 465 738 435 754 Q 419 760 404 753 Q 341 729 270 716 L 281 689 Q 378 722 404 708 Q 413 702 412 672 Q 408 587 402 516 Q 401 506 397 499 L 386 477 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 271 565 Q 320 575 357 580 Q 379 586 369 597 Q 359 610 334 613 Q 312 614 274 601 L 272 599 L 271 565 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 267 461 Q 271 461 276 462 Q 310 471 386 477 L 397 499 Q 390 506 375 514 Q 360 521 332 513 Q 298 503 268 494 L 267 461 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 631 767 Q 609 786 584 795 Q 578 798 573 794 Q 566 790 573 777 Q 603 714 594 569 Q 591 506 621 481 Q 622 481 624 479 Q 640 472 644 501 Q 644 504 644 506 L 645 540 Q 642 567 642 620 L 642 646 Q 642 695 644 735 L 631 767 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 810 517 Q 816 115 795 78 Q 789 72 770 77 Q 743 83 716 90 Q 695 97 696 87 Q 754 35 785 -3 Q 798 -24 815 -28 Q 825 -32 833 -22 Q 876 27 875 86 Q 862 303 860 655 Q 859 716 873 744 Q 886 763 873 775 Q 851 794 811 810 Q 790 819 734 790 Q 698 778 631 767 L 644 735 Q 692 744 764 762 Q 783 766 791 755 Q 804 742 805 696 Q 808 618 809 545 L 810 517 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 642 620 Q 643 620 648 620 Q 708 627 751 633 Q 773 637 765 649 Q 755 662 731 666 Q 698 670 642 646 L 642 620 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 644 506 Q 651 505 663 506 Q 709 515 810 517 L 809 545 Q 803 549 794 556 Q 778 566 747 559 Q 692 546 645 540 L 644 506 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 270 716 Q 246 740 213 748 Q 203 751 196 741 Q 192 735 200 724 Q 260 577 214 260 Q 205 202 186 142 Q 176 114 181 92 Q 191 55 203 41 Q 216 26 226 41 Q 263 80 264 255 Q 264 357 267 461 L 268 494 Q 268 534 271 565 L 272 599 Q 276 663 281 689 L 270 716 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 207 736 L 243 696 L 252 611 L 251 453 L 239 243 L 215 101 L 215 46\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"835 1670\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 386 477 Q 387 473 394 464 Q 416 433 436 460 Q 448 476 455 535 Q 458 649 485 690 Q 498 708 484 723 Q 465 738 435 754 Q 419 760 404 753 Q 341 729 270 716 L 281 689 Q 378 722 404 708 Q 413 702 412 672 Q 408 587 402 516 Q 401 506 397 499 L 386 477 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 279 712 L 291 704 L 342 721 L 418 731 L 448 702 L 426 507 L 416 478 L 400 477\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"558 1116\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 271 565 Q 320 575 357 580 Q 379 586 369 597 Q 359 610 334 613 Q 312 614 274 601 L 272 599 L 271 565 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 278 570 L 284 582 L 304 591 L 329 595 L 361 590\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"221 442\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 267 461 Q 271 461 276 462 Q 310 471 386 477 L 397 499 Q 390 506 375 514 Q 360 521 332 513 Q 298 503 268 494 L 267 461 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 271 466 L 284 481 L 345 495 L 388 497\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"253 506\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 631 767 Q 609 786 584 795 Q 578 798 573 794 Q 566 790 573 777 Q 603 714 594 569 Q 591 506 621 481 Q 622 481 624 479 Q 640 472 644 501 Q 644 504 644 506 L 645 540 Q 642 567 642 620 L 642 646 Q 642 695 644 735 L 631 767 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 579 786 L 610 752 L 616 729 L 618 559 L 629 490\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"438 876\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 810 517 Q 816 115 795 78 Q 789 72 770 77 Q 743 83 716 90 Q 695 97 696 87 Q 754 35 785 -3 Q 798 -24 815 -28 Q 825 -32 833 -22 Q 876 27 875 86 Q 862 303 860 655 Q 859 716 873 744 Q 886 763 873 775 Q 851 794 811 810 Q 790 819 734 790 Q 698 778 631 767 L 644 735 Q 692 744 764 762 Q 783 766 791 755 Q 804 742 805 696 Q 808 618 809 545 L 810 517 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 641 765 L 654 754 L 787 786 L 807 780 L 835 752 L 835 69 L 815 35 L 785 43 L 706 84\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"1185 2370\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 642 620 Q 643 620 648 620 Q 708 627 751 633 Q 773 637 765 649 Q 755 662 731 666 Q 698 670 642 646 L 642 620 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 645 627 L 658 637 L 714 647 L 755 643\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"242 484\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 644 506 Q 651 505 663 506 Q 709 515 810 517 L 809 545 Q 803 549 794 556 Q 778 566 747 559 Q 692 546 645 540 L 644 506 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 648 512 L 660 523 L 760 539 L 792 535 L 800 524\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"291 582\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 823;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9197591145833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 385;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.5633138020833334s both;\n          animation-delay: 0.9197591145833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 344;\n            stroke-width: 128;\n          }\n          53% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5299479166666666s both;\n          animation-delay: 1.4830729166666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 675;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.79931640625s both;\n          animation-delay: 2.0130208333333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 361;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5437825520833334s both;\n          animation-delay: 2.8123372395833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 376;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.5559895833333334s both;\n          animation-delay: 3.356119791666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 799;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.9002278645833334s both;\n          animation-delay: 3.9121093750000004s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 365;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.5470377604166666s both;\n          animation-delay: 4.812337239583334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 589 780 Q 589 788 578 798 Q 560 816 535 821 Q 519 825 510 825 Q 494 823 496 811 Q 517 737 439 610 L 378 521 Q 341 471 238 365 Q 232 359 241 357 Q 251 359 277 377 Q 320 402 360 437 L 385 463 L 406 484 Q 463 557 500 619 L 508 635 Q 527 672 553 714 L 564 735 Q 565 745 577 759 Q 590 772 589 780 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 553 714 Q 561 708 576 701 L 656 657 Q 666 651 676 653 Q 693 656 686 685 Q 681 699 672 708 Q 647 733 564 735 L 553 714 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 500 619 Q 502 614 557 574 Q 568 565 578 564 Q 599 561 602 582 Q 602 590 598 598 Q 586 621 556 627 Q 523 636 508 635 L 500 619 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 564 287 Q 566 283 568 280 Q 594 249 606 261 Q 615 270 624 294.5 Q 633 319 651 415 Q 659 443 676 463 Q 683 471 681 479 Q 676 494 625 523 Q 610 528 555 512 L 437 474 L 459 447 Q 466 450 475 453 Q 565 485 589 482 Q 608 478 606 457 Q 606 447 600 414 Q 584 327 576 319 L 564 287 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 455 353 Q 500 365 549 374 Q 551 374 553 375 Q 566 380 564 387 Q 561 393 550 399 Q 512 417 457 384 L 455 353 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 455 267 Q 529 282 564 287 L 576 319 Q 556 332 455 294 L 455 267 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 385 463 Q 414 424 417 314 L 417 276 Q 417 138 364 74 Q 345 55 374 16 Q 380 9 382 8 Q 392 0 404 12 Q 447 65 576 164 L 564 180 Q 541 169 485 136 Q 466 125 459 128 Q 453 130 454 143 Q 454 145 455 147 L 455 267 L 455 294 Q 455 331 455 353 L 457 384 Q 457 416 459 447 L 437 474 Q 427 480 406 484 L 385 463 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 576 164 Q 588 139 610 137 Q 614 135 619 137 Q 635 144 629 169 Q 629 177 625 185 Q 617 199 597 211 Q 582 220 572 225 Q 543 243 539 237 Q 537 235 537 231 Q 535 218 564 180 L 576 164 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 589 780 Q 589 788 578 798 Q 560 816 535 821 Q 519 825 510 825 Q 494 823 496 811 Q 517 737 439 610 L 378 521 Q 341 471 238 365 Q 232 359 241 357 Q 251 359 277 377 Q 320 402 360 437 L 385 463 L 406 484 Q 463 557 500 619 L 508 635 Q 527 672 553 714 L 564 735 Q 565 745 577 759 Q 590 772 589 780 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 508 813 L 540 775 L 517 708 L 470 614 L 386 494 L 331 436 L 265 379 L 247 371 L 244 363\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"695 1390\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 553 714 Q 561 708 576 701 L 656 657 Q 666 651 676 653 Q 693 656 686 685 Q 681 699 672 708 Q 647 733 564 735 L 553 714 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 561 716 L 577 719 L 626 703 L 656 687 L 674 667\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"257 514\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 500 619 Q 502 614 557 574 Q 568 565 578 564 Q 599 561 602 582 Q 602 590 598 598 Q 586 621 556 627 Q 523 636 508 635 L 500 619 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 506 621 L 531 616 L 583 582\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"216 432\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 564 287 Q 566 283 568 280 Q 594 249 606 261 Q 615 270 624 294.5 Q 633 319 651 415 Q 659 443 676 463 Q 683 471 681 479 Q 676 494 625 523 Q 610 528 555 512 L 437 474 L 459 447 Q 466 450 475 453 Q 565 485 589 482 Q 608 478 606 457 Q 606 447 600 414 Q 584 327 576 319 L 564 287 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 445 473 L 456 467 L 481 470 L 588 502 L 617 497 L 634 481 L 638 463 L 610 335 L 593 289 L 575 289\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"547 1094\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 455 353 Q 500 365 549 374 Q 551 374 553 375 Q 566 380 564 387 Q 561 393 550 399 Q 512 417 457 384 L 455 353 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 460 360 L 472 375 L 504 385 L 556 386\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"233 466\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 455 267 Q 529 282 564 287 L 576 319 Q 556 332 455 294 L 455 267 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 464 274 L 470 287 L 551 303 L 571 315\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"248 496\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 385 463 Q 414 424 417 314 L 417 276 Q 417 138 364 74 Q 345 55 374 16 Q 380 9 382 8 Q 392 0 404 12 Q 447 65 576 164 L 564 180 Q 541 169 485 136 Q 466 125 459 128 Q 453 130 454 143 Q 454 145 455 147 L 455 267 L 455 294 Q 455 331 455 353 L 457 384 Q 457 416 459 447 L 437 474 Q 427 480 406 484 L 385 463 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 395 463 L 421 453 L 433 408 L 437 274 L 429 98 L 449 99 L 481 112 L 560 164 L 562 173\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"671 1342\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 576 164 Q 588 139 610 137 Q 614 135 619 137 Q 635 144 629 169 Q 629 177 625 185 Q 617 199 597 211 Q 582 220 572 225 Q 543 243 539 237 Q 537 235 537 231 Q 535 218 564 180 L 576 164 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 543 232 L 597 180 L 615 151\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"237 474\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 760;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8684895833333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 795;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.89697265625s both;\n          animation-delay: 0.8684895833333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 896;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.9791666666666666s both;\n          animation-delay: 1.7654622395833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 759;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.86767578125s both;\n          animation-delay: 2.74462890625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 398 575 Q 416 606 431 637 Q 464 707 496 765 Q 506 781 488 797 Q 433 833 404 826 Q 391 822 395 805 Q 419 667 274 478 Q 250 454 204 394 Q 197 375 214 382 Q 278 400 376 541 L 398 575 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 376 541 Q 395 525 443 539 Q 558 570 663 594 Q 700 598 702 582 Q 701 560 655 478 Q 648 462 655 457 Q 662 453 676 466 Q 766 545 803 563 Q 833 573 830 590 Q 829 603 747 642 Q 719 654 627 624 Q 480 591 398 575 L 376 541 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 523 312 Q 529 336 533 360 Q 537 390 543 408 Q 549 421 540 430 Q 519 452 495 461 Q 473 473 462 469 Q 452 465 455 453 Q 494 321 417 188 Q 410 178 400 166 Q 331 88 163 31 Q 151 30 147 25 Q 141 21 151 15 Q 157 14 172 15 Q 274 27 346 65 Q 460 116 513 273 L 523 312 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 513 273 Q 618 111 701 19 Q 725 -9 749 -8 Q 818 -1 878 4 Q 903 7 904 13 Q 905 20 876 34 Q 728 98 686 137 Q 604 210 523 312 L 513 273 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 398 575 Q 416 606 431 637 Q 464 707 496 765 Q 506 781 488 797 Q 433 833 404 826 Q 391 822 395 805 Q 419 667 274 478 Q 250 454 204 394 Q 197 375 214 382 Q 278 400 376 541 L 398 575 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 409 812 L 445 767 L 398 631 L 351 545 L 316 495 L 273 445 L 215 393\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"632 1264\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 376 541 Q 395 525 443 539 Q 558 570 663 594 Q 700 598 702 582 Q 701 560 655 478 Q 648 462 655 457 Q 662 453 676 466 Q 766 545 803 563 Q 833 573 830 590 Q 829 603 747 642 Q 719 654 627 624 Q 480 591 398 575 L 376 541 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 384 544 L 643 611 L 683 618 L 724 612 L 750 587 L 716 534 L 659 464\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"667 1334\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 523 312 Q 529 336 533 360 Q 537 390 543 408 Q 549 421 540 430 Q 519 452 495 461 Q 473 473 462 469 Q 452 465 455 453 Q 494 321 417 188 Q 410 178 400 166 Q 331 88 163 31 Q 151 30 147 25 Q 141 21 151 15 Q 157 14 172 15 Q 274 27 346 65 Q 460 116 513 273 L 523 312 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 466 458 L 504 411 L 501 360 L 478 256 L 433 168 L 395 126 L 319 75 L 241 42 L 153 22\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"768 1536\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 513 273 Q 618 111 701 19 Q 725 -9 749 -8 Q 818 -1 878 4 Q 903 7 904 13 Q 905 20 876 34 Q 728 98 686 137 Q 604 210 523 312 L 513 273 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 527 304 L 531 273 L 619 163 L 680 96 L 740 46 L 749 40 L 898 14\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"631 1262\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 947;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0206705729166667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1430;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.4137369791666667s both;\n          animation-delay: 1.0206705729166667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 310 637 Q 340 577 311 357 Q 299 300 269 232 Q 236 163 146 80 Q 130 67 125 59 Q 122 50 136 50 Q 178 50 258 125 Q 354 224 386 446 Q 395 524 405 602 Q 412 627 389 639 Q 334 669 315 667 Q 293 663 310 637 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 979 84 Q 954 144 939 247 Q 936 265 930 272 Q 920 279 916 262 Q 903 201 887 155 Q 880 124 852 105 Q 825 78 707 87 Q 641 96 622 132 Q 595 201 620 515 Q 627 621 641 666 Q 653 697 566 747 Q 547 760 526 749 Q 513 742 536 711 Q 564 671 565 570 Q 565 489 557 329 Q 542 128 591 71 Q 630 32 708 20 Q 753 16 816 16 Q 895 17 953 42 Q 993 54 979 84 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 310 637 Q 340 577 311 357 Q 299 300 269 232 Q 236 163 146 80 Q 130 67 125 59 Q 122 50 136 50 Q 178 50 258 125 Q 354 224 386 446 Q 395 524 405 602 Q 412 627 389 639 Q 334 669 315 667 Q 293 663 310 637 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 317 651 L 326 648 L 363 606 L 351 422 L 330 317 L 293 219 L 259 165 L 191 94 L 134 59\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"819 1638\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 979 84 Q 954 144 939 247 Q 936 265 930 272 Q 920 279 916 262 Q 903 201 887 155 Q 880 124 852 105 Q 825 78 707 87 Q 641 96 622 132 Q 595 201 620 515 Q 627 621 641 666 Q 653 697 566 747 Q 547 760 526 749 Q 513 742 536 711 Q 564 671 565 570 Q 565 489 557 329 Q 542 128 591 71 Q 630 32 708 20 Q 753 16 816 16 Q 895 17 953 42 Q 993 54 979 84 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 535 738 L 564 719 L 598 671 L 580 233 L 590 142 L 613 93 L 659 65 L 704 53 L 744 51 L 839 55 L 905 80 L 917 89 L 922 130 L 925 264\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1302 2604\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 455;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6202799479166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 641;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7716471354166666s both;\n          animation-delay: 0.6202799479166666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 441 644 Q 484 599 529 546 Q 542 530 558 529 Q 570 528 577 541 Q 584 556 579 588 Q 572 639 443 695 Q 427 701 420 699 Q 414 696 414 682 Q 417 670 441 644 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 403 190 Q 390 187 391 169 Q 404 88 436 70 Q 442 63 453 64 Q 462 65 464 91 Q 471 133 591 395 Q 600 411 599 418 Q 598 428 589 422 Q 579 416 447 231 Q 432 210 403 190 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 441 644 Q 484 599 529 546 Q 542 530 558 529 Q 570 528 577 541 Q 584 556 579 588 Q 572 639 443 695 Q 427 701 420 699 Q 414 696 414 682 Q 417 670 441 644 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 425 691 L 528 604 L 559 548\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"327 654\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 403 190 Q 390 187 391 169 Q 404 88 436 70 Q 442 63 453 64 Q 462 65 464 91 Q 471 133 591 395 Q 600 411 599 418 Q 598 428 589 422 Q 579 416 447 231 Q 432 210 403 190 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 449 75 L 437 117 L 439 160 L 592 416\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"513 1026\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 883;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9685872395833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1002;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0654296875s both;\n          animation-delay: 0.9685872395833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1090;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1370442708333333s both;\n          animation-delay: 2.0340169270833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 544 561 Q 575 580 648 638 Q 679 666 700 671 Q 737 683 739 698 Q 740 708 705 746 Q 672 782 661 780 Q 657 783 644 778 Q 575 748 344 719 Q 323 720 309 722 Q 290 726 283 715 Q 280 708 288 697 Q 298 684 322 666 Q 343 650 354 650 Q 364 649 384 662 Q 420 690 607 732 Q 632 738 637 735 Q 643 731 642 723 Q 642 714 543 589 Q 534 580 529 573 L 544 561 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 529 573 Q 505 588 486 592 Q 474 596 466 591 Q 462 587 474 574 Q 495 544 508 451 L 513 407 Q 541 169 492 90 Q 489 83 482 81 Q 467 77 356 100 Q 349 100 346 97 Q 345 93 354 85 Q 429 30 470 -13 Q 483 -26 492 -24 Q 505 -23 527 -1 Q 575 44 576 136 Q 583 239 562 411 L 557 457 Q 551 505 549 542 Q 549 554 544 561 L 529 573 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 508 451 Q 499 452 299 429 Q 227 419 121 418 Q 108 418 106 406 Q 105 393 124 378 Q 142 365 174 353 Q 186 349 204 357 Q 222 363 297 375 Q 393 397 513 407 L 562 411 Q 769 430 888 417 Q 937 417 940 418 Q 940 421 942 421 Q 949 434 937 447 Q 864 513 800 491 Q 739 479 675 469 Q 605 463 557 457 L 508 451 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 544 561 Q 575 580 648 638 Q 679 666 700 671 Q 737 683 739 698 Q 740 708 705 746 Q 672 782 661 780 Q 657 783 644 778 Q 575 748 344 719 Q 323 720 309 722 Q 290 726 283 715 Q 280 708 288 697 Q 298 684 322 666 Q 343 650 354 650 Q 364 649 384 662 Q 420 690 607 732 Q 632 738 637 735 Q 643 731 642 723 Q 642 714 543 589 Q 534 580 529 573 L 544 561 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 294 711 L 355 686 L 462 717 L 620 752 L 658 752 L 675 732 L 681 708 L 549 578 L 536 574\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"755 1510\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 529 573 Q 505 588 486 592 Q 474 596 466 591 Q 462 587 474 574 Q 495 544 508 451 L 513 407 Q 541 169 492 90 Q 489 83 482 81 Q 467 77 356 100 Q 349 100 346 97 Q 345 93 354 85 Q 429 30 470 -13 Q 483 -26 492 -24 Q 505 -23 527 -1 Q 575 44 576 136 Q 583 239 562 411 L 557 457 Q 551 505 549 542 Q 549 554 544 561 L 529 573 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 472 588 L 516 549 L 530 478 L 550 263 L 549 179 L 537 99 L 523 64 L 505 42 L 490 34 L 383 79 L 368 91 L 353 93\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"874 1748\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 508 451 Q 499 452 299 429 Q 227 419 121 418 Q 108 418 106 406 Q 105 393 124 378 Q 142 365 174 353 Q 186 349 204 357 Q 222 363 297 375 Q 393 397 513 407 L 562 411 Q 769 430 888 417 Q 937 417 940 418 Q 940 421 942 421 Q 949 434 937 447 Q 864 513 800 491 Q 739 479 675 469 Q 605 463 557 457 L 508 451 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 119 405 L 142 394 L 186 386 L 410 420 L 826 459 L 855 457 L 916 439 L 937 422\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"962 1924\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 409;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5828450520833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 699;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.81884765625s both;\n          animation-delay: 0.5828450520833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 957;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.02880859375s both;\n          animation-delay: 1.4016927083333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 387;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.56494140625s both;\n          animation-delay: 2.4305013020833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 486;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6455078125s both;\n          animation-delay: 2.9954427083333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 515 783 Q 545 761 577 734 Q 593 721 612 723 Q 624 724 628 740 Q 632 758 619 791 Q 604 825 505 837 Q 486 838 480 836 Q 474 830 477 816 Q 483 803 515 783 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 362 610 Q 399 597 472 606 Q 595 627 725 647 Q 788 660 797 668 Q 807 677 803 686 Q 796 699 763 710 Q 729 717 625 686 Q 472 653 357 645 Q 350 645 348 643 L 362 610 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 279 350 Q 249 191 150 19 Q 146 12 143 6 Q 142 -4 152 -2 Q 188 5 258 131 Q 268 155 281 180 Q 339 321 350 504 Q 353 601 362 610 L 348 643 Q 300 676 278 667 Q 266 660 274 646 Q 293 619 294 548 Q 293 541 293 531 Q 293 455 284 386 L 279 350 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 150 512 Q 169 488 190 459 Q 200 444 216 442 Q 226 441 233 453 Q 240 466 236 496 Q 235 515 208 532 Q 144 565 132 563 Q 128 560 126 548 Q 127 536 150 512 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 284 386 Q 95 299 67 297 Q 54 294 54 284 Q 54 271 64 265 Q 88 252 121 240 Q 131 239 142 248 Q 164 273 279 350 L 284 386 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 515 783 Q 545 761 577 734 Q 593 721 612 723 Q 624 724 628 740 Q 632 758 619 791 Q 604 825 505 837 Q 486 838 480 836 Q 474 830 477 816 Q 483 803 515 783 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 486 828 L 574 784 L 609 742\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"281 562\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 362 610 Q 399 597 472 606 Q 595 627 725 647 Q 788 660 797 668 Q 807 677 803 686 Q 796 699 763 710 Q 729 717 625 686 Q 472 653 357 645 Q 350 645 348 643 L 362 610 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 354 639 L 383 626 L 459 629 L 701 675 L 755 683 L 789 681\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"571 1142\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 279 350 Q 249 191 150 19 Q 146 12 143 6 Q 142 -4 152 -2 Q 188 5 258 131 Q 268 155 281 180 Q 339 321 350 504 Q 353 601 362 610 L 348 643 Q 300 676 278 667 Q 266 660 274 646 Q 293 619 294 548 Q 293 541 293 531 Q 293 455 284 386 L 279 350 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 284 655 L 310 635 L 324 609 L 317 431 L 303 337 L 276 236 L 234 130 L 193 58 L 153 8\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"829 1658\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 150 512 Q 169 488 190 459 Q 200 444 216 442 Q 226 441 233 453 Q 240 466 236 496 Q 235 515 208 532 Q 144 565 132 563 Q 128 560 126 548 Q 127 536 150 512 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 134 558 L 204 494 L 217 460\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"259 518\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 284 386 Q 95 299 67 297 Q 54 294 54 284 Q 54 271 64 265 Q 88 252 121 240 Q 131 239 142 248 Q 164 273 279 350 L 284 386 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 68 283 L 121 277 L 261 356 L 271 369\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"358 716\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 938;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0133463541666667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 832;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.9270833333333334s both;\n          animation-delay: 1.0133463541666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 402;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5771484375s both;\n          animation-delay: 1.9404296875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 626;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7594401041666666s both;\n          animation-delay: 2.517578125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 578;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7203776041666666s both;\n          animation-delay: 3.2770182291666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 598;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.7366536458333334s both;\n          animation-delay: 3.997395833333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 664;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.7903645833333334s both;\n          animation-delay: 4.734049479166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 808;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.9075520833333334s both;\n          animation-delay: 5.524414062499999s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 306 551 Q 340 605 379 667 Q 412 730 442 760 Q 452 773 447 789 Q 443 805 408 831 Q 377 853 354 852 Q 332 851 341 824 Q 360 784 344 748 Q 298 631 225 523 Q 155 420 60 305 Q 48 292 45 285 Q 41 272 58 275 Q 112 287 277 510 L 306 551 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 346 138 Q 346 396 356 458 Q 365 488 340 514 Q 310 548 306 551 L 277 510 Q 278 504 283 498 Q 301 461 303 424 Q 303 378 302 332 Q 302 205 269 75 Q 263 53 273 16 Q 286 -23 298 -35 Q 319 -53 331 -23 Q 344 19 346 107 L 346 138 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 566 754 Q 593 732 621 707 Q 637 694 655 695 Q 668 696 672 712 Q 676 730 664 763 Q 657 782 624 794 Q 548 815 532 807 Q 526 803 529 788 Q 533 775 566 754 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 606 566 Q 667 579 735 591 Q 787 601 794 609 Q 803 616 799 624 Q 792 636 764 644 Q 737 650 616 613 Q 475 589 430 584 Q 394 578 419 562 Q 453 538 557 557 L 606 566 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 632 411 Q 675 421 725 429 Q 768 439 774 445 Q 783 452 779 460 Q 772 472 744 479 Q 723 485 633 458 L 576 444 Q 521 434 457 428 Q 423 422 447 406 Q 481 385 557 397 Q 564 398 576 400 L 632 411 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 628 280 Q 779 311 786 317 Q 795 324 791 332 Q 784 344 756 352 Q 732 358 629 326 L 576 313 Q 518 303 450 296 Q 414 290 439 274 Q 473 253 547 265 Q 559 268 576 270 L 628 280 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 625 171 Q 626 228 628 280 L 629 326 Q 630 371 632 411 L 633 458 Q 633 485 636 512 Q 645 539 606 566 L 557 557 Q 572 521 576 444 L 576 400 Q 576 364 576 313 L 576 270 Q 576 224 576 165 L 625 171 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 576 165 Q 470 153 346 138 L 346 107 Q 373 92 400 98 Q 553 137 848 137 Q 864 137 882 136 Q 901 136 907 144 Q 911 156 896 170 Q 836 215 787 198 Q 721 188 625 171 L 576 165 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 306 551 Q 340 605 379 667 Q 412 730 442 760 Q 452 773 447 789 Q 443 805 408 831 Q 377 853 354 852 Q 332 851 341 824 Q 360 784 344 748 Q 298 631 225 523 Q 155 420 60 305 Q 48 292 45 285 Q 41 272 58 275 Q 112 287 277 510 L 306 551 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 354 835 L 374 819 L 398 780 L 341 663 L 222 474 L 126 353 L 53 281\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"810 1620\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 346 138 Q 346 396 356 458 Q 365 488 340 514 Q 310 548 306 551 L 277 510 Q 278 504 283 498 Q 301 461 303 424 Q 303 378 302 332 Q 302 205 269 75 Q 263 53 273 16 Q 286 -23 298 -35 Q 319 -53 331 -23 Q 344 19 346 107 L 346 138 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 304 545 L 309 508 L 325 481 L 328 443 L 321 197 L 305 56 L 311 -25\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"704 1408\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 566 754 Q 593 732 621 707 Q 637 694 655 695 Q 668 696 672 712 Q 676 730 664 763 Q 657 782 624 794 Q 548 815 532 807 Q 526 803 529 788 Q 533 775 566 754 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 538 799 L 625 753 L 653 714\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"274 548\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 606 566 Q 667 579 735 591 Q 787 601 794 609 Q 803 616 799 624 Q 792 636 764 644 Q 737 650 616 613 Q 475 589 430 584 Q 394 578 419 562 Q 453 538 557 557 L 606 566 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 422 574 L 471 568 L 522 573 L 723 615 L 787 620\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"498 996\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 632 411 Q 675 421 725 429 Q 768 439 774 445 Q 783 452 779 460 Q 772 472 744 479 Q 723 485 633 458 L 576 444 Q 521 434 457 428 Q 423 422 447 406 Q 481 385 557 397 Q 564 398 576 400 L 632 411 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 450 418 L 480 412 L 544 416 L 703 451 L 767 456\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"450 900\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 628 280 Q 779 311 786 317 Q 795 324 791 332 Q 784 344 756 352 Q 732 358 629 326 L 576 313 Q 518 303 450 296 Q 414 290 439 274 Q 473 253 547 265 Q 559 268 576 270 L 628 280 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 442 286 L 472 280 L 534 284 L 717 325 L 779 328\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"470 940\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 625 171 Q 626 228 628 280 L 629 326 Q 630 371 632 411 L 633 458 Q 633 485 636 512 Q 645 539 606 566 L 557 557 Q 572 521 576 444 L 576 400 Q 576 364 576 313 L 576 270 Q 576 224 576 165 L 625 171 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 564 554 L 598 532 L 603 508 L 601 193 L 581 173\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"536 1072\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 576 165 Q 470 153 346 138 L 346 107 Q 373 92 400 98 Q 553 137 848 137 Q 864 137 882 136 Q 901 136 907 144 Q 911 156 896 170 Q 836 215 787 198 Q 721 188 625 171 L 576 165 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 355 130 L 366 120 L 381 119 L 513 139 L 809 170 L 862 163 L 897 150\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"680 1360\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 568;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7122395833333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 994;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0589192708333333s both;\n          animation-delay: 0.7122395833333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 786;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8896484375s both;\n          animation-delay: 1.7711588541666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 851;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.9425455729166666s both;\n          animation-delay: 2.6608072916666665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 372 669 Q 510 709 546 727 Q 601 749 648 759 Q 669 760 673 770 Q 677 783 663 796 Q 638 815 583 836 Q 564 845 549 843 Q 539 839 539 825 Q 539 786 360 693 L 372 669 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 360 514 Q 364 614 371 662 Q 372 666 372 669 L 360 693 Q 297 724 281 720 Q 259 716 277 691 Q 317 621 290 389 Q 280 326 250 253 Q 217 169 124 84 Q 108 69 104 62 Q 103 53 116 54 Q 167 57 239 140 Q 321 230 349 412 Q 352 445 357 481 L 360 514 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 618 519 Q 630 522 868 541 Q 889 542 894 551 Q 898 564 881 577 Q 823 613 786 603 Q 668 573 360 514 L 357 481 Q 387 469 425 478 Q 486 497 556 508 L 618 519 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 588 -35 Q 594 -63 601 -73 Q 607 -80 615 -78 Q 631 -69 638 -4 Q 645 63 644 129 Q 637 378 656 474 Q 659 493 644 503 Q 629 513 618 519 L 556 508 Q 557 507 559 505 Q 578 465 581 439 Q 585 316 583 125 Q 583 5 588 -35 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 372 669 Q 510 709 546 727 Q 601 749 648 759 Q 669 760 673 770 Q 677 783 663 796 Q 638 815 583 836 Q 564 845 549 843 Q 539 839 539 825 Q 539 786 360 693 L 372 669 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 660 776 L 576 788 L 483 731 L 400 694 L 382 688 L 376 693\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"440 880\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 360 514 Q 364 614 371 662 Q 372 666 372 669 L 360 693 Q 297 724 281 720 Q 259 716 277 691 Q 317 621 290 389 Q 280 326 250 253 Q 217 169 124 84 Q 108 69 104 62 Q 103 53 116 54 Q 167 57 239 140 Q 321 230 349 412 Q 352 445 357 481 L 360 514 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 283 705 L 307 689 L 331 662 L 328 478 L 321 407 L 303 321 L 266 224 L 233 170 L 167 97 L 113 62\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"866 1732\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 618 519 Q 630 522 868 541 Q 889 542 894 551 Q 898 564 881 577 Q 823 613 786 603 Q 668 573 360 514 L 357 481 Q 387 469 425 478 Q 486 497 556 508 L 618 519 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 365 486 L 378 496 L 533 527 L 790 569 L 832 569 L 883 556\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"658 1316\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 588 -35 Q 594 -63 601 -73 Q 607 -80 615 -78 Q 631 -69 638 -4 Q 645 63 644 129 Q 637 378 656 474 Q 659 493 644 503 Q 629 513 618 519 L 556 508 Q 557 507 559 505 Q 578 465 581 439 Q 585 316 583 125 Q 583 5 588 -35 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 569 500 L 615 474 L 611 -68\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"723 1446\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 426;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5966796875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 992;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0572916666666667s both;\n          animation-delay: 0.5966796875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 437 544 Q 477 516 519 483 Q 535 470 552 472 Q 564 473 569 488 Q 573 504 560 537 Q 545 576 428 596 Q 410 599 404 595 Q 398 591 401 577 Q 407 564 437 544 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 325 335 Q 608 398 854 376 Q 887 376 891 382 Q 898 395 886 408 Q 855 436 809 456 Q 799 459 650 430 Q 611 430 315 390 Q 254 380 160 378 Q 147 378 145 366 Q 144 353 164 338 Q 182 325 214 313 Q 226 309 244 318 Q 259 322 325 335 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 437 544 Q 477 516 519 483 Q 535 470 552 472 Q 564 473 569 488 Q 573 504 560 537 Q 545 576 428 596 Q 410 599 404 595 Q 398 591 401 577 Q 407 564 437 544 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 411 587 L 517 531 L 549 492\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"298 596\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 325 335 Q 608 398 854 376 Q 887 376 891 382 Q 898 395 886 408 Q 855 436 809 456 Q 799 459 650 430 Q 611 430 315 390 Q 254 380 160 378 Q 147 378 145 366 Q 144 353 164 338 Q 182 325 214 313 Q 226 309 244 318 Q 259 322 325 335 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 158 365 L 182 354 L 224 347 L 450 385 L 770 417 L 815 415 L 882 390\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"864 1728\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 707;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8253580729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 636;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.767578125s both;\n          animation-delay: 0.8253580729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 755;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8644205729166666s both;\n          animation-delay: 1.5929361979166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1073;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.1232096354166667s both;\n          animation-delay: 2.457356770833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 528 646 Q 601 659 678 670 Q 739 680 749 689 Q 761 698 755 709 Q 748 725 711 735 Q 672 745 579 716 Q 444 685 307 677 Q 261 673 293 649 Q 341 621 432 632 Q 450 635 472 638 L 528 646 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 539 380 Q 707 411 713 416 Q 723 425 719 434 Q 712 447 679 458 Q 645 465 610 453 Q 576 443 541 434 L 490 423 Q 421 410 341 405 Q 299 401 328 380 Q 373 355 455 367 Q 471 370 489 372 L 539 380 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 533 159 Q 536 277 539 380 L 541 434 Q 542 548 548 600 Q 557 627 529 645 L 528 646 L 472 638 Q 487 602 491 498 Q 490 468 490 423 L 489 372 Q 488 285 485 154 L 533 159 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 520 106 Q 574 107 626 112 Q 776 124 907 105 Q 934 102 940 111 Q 950 127 936 140 Q 903 171 855 195 Q 839 202 810 193 Q 740 180 668 171 Q 587 165 533 159 L 485 154 Q 361 145 299 138 Q 229 128 125 130 Q 109 130 108 117 Q 107 104 127 87 Q 146 72 181 58 Q 193 54 213 62 Q 231 68 304 78 Q 401 97 520 106 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 528 646 Q 601 659 678 670 Q 739 680 749 689 Q 761 698 755 709 Q 748 725 711 735 Q 672 745 579 716 Q 444 685 307 677 Q 261 673 293 649 Q 341 621 432 632 Q 450 635 472 638 L 528 646 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 296 665 L 329 657 L 385 655 L 675 704 L 742 702\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"579 1158\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 539 380 Q 707 411 713 416 Q 723 425 719 434 Q 712 447 679 458 Q 645 465 610 453 Q 576 443 541 434 L 490 423 Q 421 410 341 405 Q 299 401 328 380 Q 373 355 455 367 Q 471 370 489 372 L 539 380 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 331 394 L 364 387 L 424 387 L 548 407 L 647 431 L 706 428\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"508 1016\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 533 159 Q 536 277 539 380 L 541 434 Q 542 548 548 600 Q 557 627 529 645 L 528 646 L 472 638 Q 487 602 491 498 Q 490 468 490 423 L 489 372 Q 488 285 485 154 L 533 159 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 479 636 L 515 610 L 516 575 L 510 185 L 490 163\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"627 1254\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 520 106 Q 574 107 626 112 Q 776 124 907 105 Q 934 102 940 111 Q 950 127 936 140 Q 903 171 855 195 Q 839 202 810 193 Q 740 180 668 171 Q 587 165 533 159 L 485 154 Q 361 145 299 138 Q 229 128 125 130 Q 109 130 108 117 Q 107 104 127 87 Q 146 72 181 58 Q 193 54 213 62 Q 231 68 304 78 Q 401 97 520 106 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 122 116 L 158 100 L 196 94 L 403 122 L 837 156 L 926 123\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"945 1890\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 605;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7423502604166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 727;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8416341145833334s both;\n          animation-delay: 0.7423502604166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1331;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.3331705729166667s both;\n          animation-delay: 1.583984375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 595;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7342122395833334s both;\n          animation-delay: 2.917154947916667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 605;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7423502604166666s both;\n          animation-delay: 3.6513671875000004s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 330 536 Q 397 597 434 638 Q 518 732 544 746 Q 569 764 552 783 Q 531 802 496 815 Q 463 828 448 821 Q 432 817 440 801 Q 452 762 384 658 Q 306 538 305 535 L 330 536 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 227 531 Q 209 541 190 547 Q 183 550 176 543 Q 167 537 178 524 Q 236 419 241 179 Q 242 113 281 79 Q 282 78 287 75 Q 306 69 309 104 Q 309 111 309 117 L 304 156 Q 303 169 298 184 Q 292 239 283 310 Q 282 311 282 312 L 279 342 Q 272 421 270 485 L 227 531 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 640 134 Q 650 106 675 51 Q 684 32 695 32 Q 713 35 724 63 Q 772 150 780 268 Q 792 341 801 428 Q 808 483 834 518 Q 855 540 840 556 Q 815 581 761 606 Q 740 618 702 605 Q 555 557 330 536 L 305 535 Q 268 535 227 531 L 270 485 Q 303 497 669 549 Q 712 556 729 536 Q 739 515 739 494 Q 732 337 696 185 Q 692 158 681 156 Q 677 155 664 160 L 640 134 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 282 312 Q 297 305 324 308 Q 490 330 613 342 Q 643 345 633 362 Q 620 381 588 389 Q 558 396 505 384 Q 382 360 279 342 L 282 312 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 309 117 Q 315 116 324 117 Q 426 133 640 134 L 664 160 Q 655 170 643 179 Q 625 192 590 186 Q 431 162 304 156 L 309 117 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 330 536 Q 397 597 434 638 Q 518 732 544 746 Q 569 764 552 783 Q 531 802 496 815 Q 463 828 448 821 Q 432 817 440 801 Q 452 762 384 658 Q 306 538 305 535 L 330 536 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 449 809 L 469 796 L 487 761 L 423 665 L 330 549 L 312 536\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"477 954\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 227 531 Q 209 541 190 547 Q 183 550 176 543 Q 167 537 178 524 Q 236 419 241 179 Q 242 113 281 79 Q 282 78 287 75 Q 306 69 309 104 Q 309 111 309 117 L 304 156 Q 303 169 298 184 Q 292 239 283 310 Q 282 311 282 312 L 279 342 Q 272 421 270 485 L 227 531 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 184 534 L 210 513 L 236 471 L 271 169 L 292 88\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"599 1198\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 640 134 Q 650 106 675 51 Q 684 32 695 32 Q 713 35 724 63 Q 772 150 780 268 Q 792 341 801 428 Q 808 483 834 518 Q 855 540 840 556 Q 815 581 761 606 Q 740 618 702 605 Q 555 557 330 536 L 305 535 Q 268 535 227 531 L 270 485 Q 303 497 669 549 Q 712 556 729 536 Q 739 515 739 494 Q 732 337 696 185 Q 692 158 681 156 Q 677 155 664 160 L 640 134 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 235 528 L 277 511 L 336 517 L 550 547 L 719 578 L 742 574 L 766 557 L 784 536 L 757 334 L 727 160 L 697 109 L 695 47\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1203 2406\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 282 312 Q 297 305 324 308 Q 490 330 613 342 Q 643 345 633 362 Q 620 381 588 389 Q 558 396 505 384 Q 382 360 279 342 L 282 312 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 287 335 L 300 327 L 315 327 L 570 365 L 620 355\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"467 934\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 309 117 Q 315 116 324 117 Q 426 133 640 134 L 664 160 Q 655 170 643 179 Q 625 192 590 186 Q 431 162 304 156 L 309 117 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 311 150 L 324 139 L 337 138 L 585 160 L 655 161\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"477 954\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 420;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.591796875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 740;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8522135416666666s both;\n          animation-delay: 0.591796875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 419;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5909830729166666s both;\n          animation-delay: 1.4440104166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 603;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.74072265625s both;\n          animation-delay: 2.034993489583333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1083;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.13134765625s both;\n          animation-delay: 2.775716145833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 440 735 Q 513 672 557 663 Q 576 662 586 680 Q 590 696 585 718 Q 561 772 453 785 Q 450 786 449 786 Q 427 789 416 782 Q 409 779 414 765 Q 418 750 440 735 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 284 510 Q 242 503 272 484 Q 321 456 382 470 Q 527 498 679 527 Q 748 543 758 552 Q 768 561 763 570 Q 756 583 723 593 Q 687 600 601 570 Q 442 524 284 510 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 327 337 Q 351 297 375 251 Q 385 235 400 229 Q 410 226 421 237 Q 431 250 432 283 Q 433 322 338 387 Q 325 396 317 395 Q 310 394 308 379 Q 307 367 327 337 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 567 156 Q 597 205 645 320 Q 658 354 686 398 Q 702 414 691 427 Q 678 448 638 470 Q 619 482 598 472 Q 586 465 595 452 Q 605 421 599 384 Q 581 299 534 180 Q 528 167 527 153 L 567 156 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 527 153 Q 464 150 231 113 Q 174 106 123 108 Q 113 108 104 101 Q 97 94 103 83 Q 115 65 174 35 Q 189 28 212 38 Q 368 98 536 113 Q 678 126 910 82 Q 931 79 938 89 Q 947 102 925 119 Q 840 188 796 175 Q 772 171 567 156 L 527 153 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 440 735 Q 513 672 557 663 Q 576 662 586 680 Q 590 696 585 718 Q 561 772 453 785 Q 450 786 449 786 Q 427 789 416 782 Q 409 779 414 765 Q 418 750 440 735 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 424 772 L 533 718 L 564 689\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"292 584\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 284 510 Q 242 503 272 484 Q 321 456 382 470 Q 527 498 679 527 Q 748 543 758 552 Q 768 561 763 570 Q 756 583 723 593 Q 687 600 601 570 Q 442 524 284 510 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 275 499 L 314 490 L 369 493 L 673 559 L 751 564\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"612 1224\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 327 337 Q 351 297 375 251 Q 385 235 400 229 Q 410 226 421 237 Q 431 250 432 283 Q 433 322 338 387 Q 325 396 317 395 Q 310 394 308 379 Q 307 367 327 337 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 320 385 L 390 297 L 404 248\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"291 582\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 567 156 Q 597 205 645 320 Q 658 354 686 398 Q 702 414 691 427 Q 678 448 638 470 Q 619 482 598 472 Q 586 465 595 452 Q 605 421 599 384 Q 581 299 534 180 Q 528 167 527 153 L 567 156 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 603 461 L 622 450 L 645 413 L 577 225 L 555 176 L 533 159\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"475 950\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 527 153 Q 464 150 231 113 Q 174 106 123 108 Q 113 108 104 101 Q 97 94 103 83 Q 115 65 174 35 Q 189 28 212 38 Q 368 98 536 113 Q 678 126 910 82 Q 931 79 938 89 Q 947 102 925 119 Q 840 188 796 175 Q 772 171 567 156 L 527 153 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 114 91 L 189 71 L 424 121 L 654 140 L 825 136 L 925 97\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"955 1910\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 393;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.56982421875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 474;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6357421875s both;\n          animation-delay: 0.56982421875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 686;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8082682291666666s both;\n          animation-delay: 1.20556640625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 610;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7464192708333334s both;\n          animation-delay: 2.0138346354166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1096;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.1419270833333333s both;\n          animation-delay: 2.76025390625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 915;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.99462890625s both;\n          animation-delay: 3.902180989583333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 366 769 Q 391 745 419 716 Q 432 703 448 703 Q 458 703 465 717 Q 469 732 462 761 Q 453 791 362 818 Q 346 822 340 819 Q 336 815 336 802 Q 339 792 366 769 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 637 819 Q 624 797 551 711 Q 541 693 558 697 Q 609 724 637 743 Q 707 791 726 798 Q 748 808 738 827 Q 725 846 697 861 Q 672 876 659 874 Q 646 873 649 858 Q 653 839 637 819 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 539 604 Q 731 640 737 645 Q 747 654 743 663 Q 736 676 705 685 Q 671 692 583 665 Q 441 632 316 623 Q 276 619 304 599 Q 349 572 409 583 Q 445 589 482 595 L 539 604 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 539 445 Q 584 455 631 463 Q 679 473 686 479 Q 696 486 691 496 Q 684 508 654 516 Q 623 523 593 512 Q 565 503 539 495 L 480 481 Q 414 468 339 461 Q 302 457 328 438 Q 364 416 444 428 Q 460 431 479 434 L 539 445 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 539 289 Q 746 313 903 296 Q 936 296 941 300 Q 941 301 942 301 Q 949 314 937 327 Q 864 393 799 371 Q 715 356 539 336 L 478 329 Q 354 317 290 309 Q 217 299 109 298 Q 96 298 94 286 Q 93 273 112 258 Q 130 245 162 233 Q 174 229 192 237 Q 210 243 286 255 Q 373 274 478 285 L 539 289 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 478 285 Q 478 -40 499 -62 Q 511 -74 522 -49 Q 538 -10 539 195 Q 539 243 539 289 L 539 336 Q 539 391 539 445 L 539 495 Q 539 550 539 604 L 482 595 Q 481 540 480 481 L 479 434 Q 478 382 478 329 L 478 285 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 366 769 Q 391 745 419 716 Q 432 703 448 703 Q 458 703 465 717 Q 469 732 462 761 Q 453 791 362 818 Q 346 822 340 819 Q 336 815 336 802 Q 339 792 366 769 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 345 813 L 421 760 L 446 723\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"265 530\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 637 819 Q 624 797 551 711 Q 541 693 558 697 Q 609 724 637 743 Q 707 791 726 798 Q 748 808 738 827 Q 725 846 697 861 Q 672 876 659 874 Q 646 873 649 858 Q 653 839 637 819 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 659 863 L 685 822 L 633 769 L 577 720 L 564 715 L 563 708\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"346 692\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 539 604 Q 731 640 737 645 Q 747 654 743 663 Q 736 676 705 685 Q 671 692 583 665 Q 441 632 316 623 Q 276 619 304 599 Q 349 572 409 583 Q 445 589 482 595 L 539 604 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 307 613 L 330 605 L 383 604 L 576 635 L 668 658 L 730 657\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"558 1116\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 539 445 Q 584 455 631 463 Q 679 473 686 479 Q 696 486 691 496 Q 684 508 654 516 Q 623 523 593 512 Q 565 503 539 495 L 480 481 Q 414 468 339 461 Q 302 457 328 438 Q 364 416 444 428 Q 460 431 479 434 L 539 445 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 331 451 L 371 444 L 414 447 L 482 457 L 608 488 L 680 490\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"482 964\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 539 289 Q 746 313 903 296 Q 936 296 941 300 Q 941 301 942 301 Q 949 314 937 327 Q 864 393 799 371 Q 715 356 539 336 L 478 329 Q 354 317 290 309 Q 217 299 109 298 Q 96 298 94 286 Q 93 273 112 258 Q 130 245 162 233 Q 174 229 192 237 Q 210 243 286 255 Q 373 274 478 285 L 539 289 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 107 285 L 171 266 L 413 301 L 824 339 L 885 329 L 935 307\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"968 1936\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 478 285 Q 478 -40 499 -62 Q 511 -74 522 -49 Q 538 -10 539 195 Q 539 243 539 289 L 539 336 Q 539 391 539 445 L 539 495 Q 539 550 539 604 L 482 595 Q 481 540 480 481 L 479 434 Q 478 382 478 329 L 478 285 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 533 596 L 510 571 L 507 -54\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"787 1574\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 832;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9270833333333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 443;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6105143229166666s both;\n          animation-delay: 0.9270833333333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 463;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6267903645833334s both;\n          animation-delay: 1.53759765625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1080;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.12890625s both;\n          animation-delay: 2.1643880208333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 465;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.62841796875s both;\n          animation-delay: 3.2932942708333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 923;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.0011393229166667s both;\n          animation-delay: 3.9217122395833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 555 471 Q 568 455 581 449 Q 591 442 607 463 Q 623 491 654 638 Q 661 669 686 696 Q 699 709 687 724 Q 671 740 626 767 Q 602 777 532 753 Q 528 753 422 726 Q 374 713 336 705 L 357 672 Q 429 696 554 720 Q 579 726 589 717 Q 602 701 600 684 Q 578 546 566 525 Q 562 512 546 510 L 546 509 L 555 471 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 351 563 Q 385 554 478 575 Q 499 579 523 585 Q 545 591 548 594 Q 555 601 551 609 Q 544 619 517 625 Q 489 629 463 618 Q 438 609 411 602 Q 383 595 350 590 L 351 563 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 394 443 Q 451 458 555 471 L 546 509 L 545 510 Q 529 517 498 509 Q 419 485 353 471 L 353 428 L 394 443 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 336 705 Q 317 720 299 727 Q 280 734 270 728 Q 258 721 269 705 Q 329 588 296 205 Q 295 153 252 98 Q 239 82 248 58 Q 258 30 273 17 Q 286 8 300 27 Q 318 58 482 186 Q 503 199 508 210 Q 512 220 502 220 Q 490 220 363 155 Q 347 148 347 162 Q 353 307 353 428 L 353 471 Q 352 519 351 563 L 350 590 Q 347 662 357 672 L 336 705 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 560 299 Q 663 363 716 385 Q 735 388 732 400 Q 728 416 710 438 Q 692 459 670 463 Q 654 464 653 445 Q 654 430 643 415 Q 607 375 541 313 L 560 299 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 541 313 Q 436 400 394 443 L 353 428 Q 387 410 414 380 Q 568 217 690 106 Q 712 84 745 89 Q 863 104 907 116 Q 926 120 933 130 Q 937 139 924 141 Q 734 180 679 216 Q 676 219 674 219 Q 623 250 560 299 L 541 313 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 555 471 Q 568 455 581 449 Q 591 442 607 463 Q 623 491 654 638 Q 661 669 686 696 Q 699 709 687 724 Q 671 740 626 767 Q 602 777 532 753 Q 528 753 422 726 Q 374 713 336 705 L 357 672 Q 429 696 554 720 Q 579 726 589 717 Q 602 701 600 684 Q 578 546 566 525 Q 562 512 546 510 L 546 509 L 555 471 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 343 702 L 365 693 L 569 744 L 586 745 L 618 735 L 640 702 L 600 532 L 584 493 L 554 510\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"704 1408\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 351 563 Q 385 554 478 575 Q 499 579 523 585 Q 545 591 548 594 Q 555 601 551 609 Q 544 619 517 625 Q 489 629 463 618 Q 438 609 411 602 Q 383 595 350 590 L 351 563 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 357 570 L 487 601 L 540 603\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"315 630\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 394 443 Q 451 458 555 471 L 546 509 L 545 510 Q 529 517 498 509 Q 419 485 353 471 L 353 428 L 394 443 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 358 435 L 372 456 L 480 483 L 525 490 L 545 475\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"335 670\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 336 705 Q 317 720 299 727 Q 280 734 270 728 Q 258 721 269 705 Q 329 588 296 205 Q 295 153 252 98 Q 239 82 248 58 Q 258 30 273 17 Q 286 8 300 27 Q 318 58 482 186 Q 503 199 508 210 Q 512 220 502 220 Q 490 220 363 155 Q 347 148 347 162 Q 353 307 353 428 L 353 471 Q 352 519 351 563 L 350 590 Q 347 662 357 672 L 336 705 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 278 716 L 304 695 L 318 671 L 325 600 L 331 421 L 317 148 L 321 116 L 370 129 L 501 213\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"952 1904\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 560 299 Q 663 363 716 385 Q 735 388 732 400 Q 728 416 710 438 Q 692 459 670 463 Q 654 464 653 445 Q 654 430 643 415 Q 607 375 541 313 L 560 299 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 668 448 L 684 411 L 563 314 L 550 316\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"337 674\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 541 313 Q 436 400 394 443 L 353 428 Q 387 410 414 380 Q 568 217 690 106 Q 712 84 745 89 Q 863 104 907 116 Q 926 120 933 130 Q 937 139 924 141 Q 734 180 679 216 Q 676 219 674 219 Q 623 250 560 299 L 541 313 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 361 427 L 389 424 L 402 414 L 579 249 L 671 176 L 727 140 L 807 132 L 923 131\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"795 1590\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 461;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6251627604166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 932;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0084635416666667s both;\n          animation-delay: 0.6251627604166666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 265 683 Q 253 707 242 716 Q 223 731 221 705 Q 225 674 176 611 Q 140 575 167 515 Q 182 488 202 515 Q 214 533 260 650 L 265 683 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 260 650 Q 279 641 336 651 Q 474 691 701 706 Q 725 707 737 705 Q 755 692 752 684 Q 752 681 721 603 Q 714 590 721 585 Q 728 581 745 594 Q 800 636 846 651 Q 885 666 883 675 Q 882 685 808 737 Q 787 753 713 741 Q 563 725 367 695 Q 315 688 265 683 L 260 650 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 265 683 Q 253 707 242 716 Q 223 731 221 705 Q 225 674 176 611 Q 140 575 167 515 Q 182 488 202 515 Q 214 533 260 650 L 265 683 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 232 710 L 242 680 L 233 648 L 191 572 L 183 519\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"333 666\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 260 650 Q 279 641 336 651 Q 474 691 701 706 Q 725 707 737 705 Q 755 692 752 684 Q 752 681 721 603 Q 714 590 721 585 Q 728 581 745 594 Q 800 636 846 651 Q 885 666 883 675 Q 882 685 808 737 Q 787 753 713 741 Q 563 725 367 695 Q 315 688 265 683 L 260 650 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 266 655 L 281 665 L 497 701 L 748 725 L 786 706 L 800 684 L 726 592\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"804 1608\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 752;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8619791666666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1062;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1142578125s both;\n          animation-delay: 0.8619791666666666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 364 648 Q 394 644 429 650 Q 586 675 751 701 Q 826 716 837 725 Q 849 734 843 745 Q 836 761 799 771 Q 763 781 666 751 Q 498 709 337 697 L 364 648 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 337 697 Q 292 727 262 718 Q 240 709 257 690 Q 288 657 288 623 Q 289 472 270 371 Q 237 178 109 54 Q 94 41 77 24 Q 64 15 61 11 Q 57 4 75 4 Q 111 4 204 90 Q 297 184 334 399 Q 343 466 349 566 Q 350 605 364 648 L 337 697 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 364 648 Q 394 644 429 650 Q 586 675 751 701 Q 826 716 837 725 Q 849 734 843 745 Q 836 761 799 771 Q 763 781 666 751 Q 498 709 337 697 L 364 648 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 345 693 L 383 673 L 418 676 L 765 739 L 830 738\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"624 1248\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 337 697 Q 292 727 262 718 Q 240 709 257 690 Q 288 657 288 623 Q 289 472 270 371 Q 237 178 109 54 Q 94 41 77 24 Q 64 15 61 11 Q 57 4 75 4 Q 111 4 204 90 Q 297 184 334 399 Q 343 466 349 566 Q 350 605 364 648 L 337 697 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 264 703 L 299 684 L 324 644 L 308 421 L 280 286 L 252 211 L 198 120 L 136 54 L 69 9\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"934 1868\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 597;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.73583984375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1110;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1533203125s both;\n          animation-delay: 0.73583984375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 534;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6845703125s both;\n          animation-delay: 1.88916015625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 570;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7138671875s both;\n          animation-delay: 2.57373046875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1145;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.1818033854166667s both;\n          animation-delay: 3.28759765625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 241 534 Q 219 546 196 550 Q 180 554 171 546 Q 164 539 173 523 Q 201 483 216 439 Q 229 396 264 219 L 308 224 Q 266 449 270 492 Q 270 495 269 496 L 241 534 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 730 266 Q 776 458 823 531 Q 835 543 831 555 Q 824 571 761 603 Q 745 612 729 607 Q 507 564 241 534 L 269 496 Q 320 508 374 517 L 400 522 Q 470 537 544 547 L 590 554 Q 698 575 727 557 Q 739 548 735 518 Q 714 409 672 258 L 730 266 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 438 237 Q 453 291 411 489 Q 410 493 410 496 Q 409 511 400 522 L 374 517 Q 375 493 381 468 Q 387 431 387 385 Q 387 264 416 235 L 438 237 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 605 449 Q 617 492 627 514 Q 631 523 616 538 Q 603 548 590 554 L 544 547 Q 545 546 546 543 Q 561 515 559 497 Q 552 379 529 245 L 566 248 Q 587 354 605 449 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 501 198 Q 562 201 619 206 Q 791 218 930 200 Q 955 196 963 206 Q 972 219 958 233 Q 927 264 880 286 Q 864 293 837 284 Q 783 274 730 266 L 672 258 Q 611 254 566 248 L 529 245 Q 469 242 438 237 L 416 235 Q 352 231 308 224 L 264 219 Q 188 212 77 212 Q 62 212 61 200 Q 60 187 80 171 Q 98 158 131 143 Q 143 139 163 147 Q 182 153 263 166 Q 369 188 501 198 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 241 534 Q 219 546 196 550 Q 180 554 171 546 Q 164 539 173 523 Q 201 483 216 439 Q 229 396 264 219 L 308 224 Q 266 449 270 492 Q 270 495 269 496 L 241 534 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 181 537 L 220 509 L 236 483 L 279 257 L 284 241 L 299 236\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"469 938\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 730 266 Q 776 458 823 531 Q 835 543 831 555 Q 824 571 761 603 Q 745 612 729 607 Q 507 564 241 534 L 269 496 Q 320 508 374 517 L 400 522 Q 470 537 544 547 L 590 554 Q 698 575 727 557 Q 739 548 735 518 Q 714 409 672 258 L 730 266 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 250 531 L 277 518 L 666 581 L 711 584 L 745 579 L 779 543 L 713 303 L 705 286 L 678 266\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"982 1964\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 438 237 Q 453 291 411 489 Q 410 493 410 496 Q 409 511 400 522 L 374 517 Q 375 493 381 468 Q 387 431 387 385 Q 387 264 416 235 L 438 237 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 382 511 L 393 500 L 399 474 L 421 263 L 432 242\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"406 812\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 605 449 Q 617 492 627 514 Q 631 523 616 538 Q 603 548 590 554 L 544 547 Q 545 546 546 543 Q 561 515 559 497 Q 552 379 529 245 L 566 248 Q 587 354 605 449 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 557 537 L 585 524 L 591 510 L 554 276 L 546 260 L 535 253\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"442 884\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 501 198 Q 562 201 619 206 Q 791 218 930 200 Q 955 196 963 206 Q 972 219 958 233 Q 927 264 880 286 Q 864 293 837 284 Q 783 274 730 266 L 672 258 Q 611 254 566 248 L 529 245 Q 469 242 438 237 L 416 235 Q 352 231 308 224 L 264 219 Q 188 212 77 212 Q 62 212 61 200 Q 60 187 80 171 Q 98 158 131 143 Q 143 139 163 147 Q 182 153 263 166 Q 369 188 501 198 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 74 199 L 110 184 L 146 178 L 471 219 L 863 248 L 950 216\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"1017 2034\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 401;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5763346354166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1046;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1012369791666667s both;\n          animation-delay: 0.5763346354166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 652;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7805989583333334s both;\n          animation-delay: 1.6775716145833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 400;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5755208333333334s both;\n          animation-delay: 2.458170572916667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 470 762 Q 498 738 527 710 Q 542 697 559 697 Q 571 698 576 712 Q 582 728 571 761 Q 559 795 464 815 Q 448 819 440 815 Q 434 811 436 797 Q 440 784 470 762 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 499 505 Q 421 346 252 177 Q 236 165 240 161 Q 243 158 257 164 Q 347 209 451 340 L 474 371 Q 501 411 531 457 Q 565 515 613 553 Q 629 566 615 581 Q 593 596 562 605 Q 538 614 521 600 Q 440 537 284 518 Q 271 519 269 511 Q 268 501 282 491 Q 322 466 340 470 Q 352 473 483 537 Q 499 546 505 538 Q 511 529 499 505 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 451 340 Q 491 274 453 81 Q 434 12 471 -33 Q 471 -34 474 -36 Q 490 -52 502 -26 Q 517 14 516 59 Q 517 246 524 287 Q 531 314 522 324 Q 483 366 474 371 L 451 340 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 569 355 Q 600 327 634 293 Q 644 281 659 281 Q 668 281 673 293 Q 677 306 671 331 Q 667 353 635 371 Q 565 404 548 399 Q 544 395 544 384 Q 547 374 569 355 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 470 762 Q 498 738 527 710 Q 542 697 559 697 Q 571 698 576 712 Q 582 728 571 761 Q 559 795 464 815 Q 448 819 440 815 Q 434 811 436 797 Q 440 784 470 762 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 447 806 L 538 749 L 557 716\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"273 546\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 499 505 Q 421 346 252 177 Q 236 165 240 161 Q 243 158 257 164 Q 347 209 451 340 L 474 371 Q 501 411 531 457 Q 565 515 613 553 Q 629 566 615 581 Q 593 596 562 605 Q 538 614 521 600 Q 440 537 284 518 Q 271 519 269 511 Q 268 501 282 491 Q 322 466 340 470 Q 352 473 483 537 Q 499 546 505 538 Q 511 529 499 505 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 278 508 L 330 497 L 440 534 L 490 559 L 522 564 L 548 559 L 523 492 L 417 331 L 329 233 L 243 164\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"918 1836\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 451 340 Q 491 274 453 81 Q 434 12 471 -33 Q 471 -34 474 -36 Q 490 -52 502 -26 Q 517 14 516 59 Q 517 246 524 287 Q 531 314 522 324 Q 483 366 474 371 L 451 340 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 473 364 L 478 336 L 497 300 L 481 39 L 486 -26\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"524 1048\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 569 355 Q 600 327 634 293 Q 644 281 659 281 Q 668 281 673 293 Q 677 306 671 331 Q 667 353 635 371 Q 565 404 548 399 Q 544 395 544 384 Q 547 374 569 355 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 552 390 L 635 335 L 658 297\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"272 544\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 434;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6031901041666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 480;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.640625s both;\n          animation-delay: 0.6031901041666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 922;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0003255208333333s both;\n          animation-delay: 1.2438151041666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 665;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.7911783854166666s both;\n          animation-delay: 2.244140625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 857;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.9474283854166666s both;\n          animation-delay: 3.0353190104166665s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 453 738 Q 489 710 527 674 Q 543 658 562 660 Q 575 661 580 676 Q 586 695 574 729 Q 567 754 528 772 Q 438 803 420 796 Q 414 792 416 775 Q 420 762 453 738 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 264 551 Q 252 578 240 589 Q 221 605 218 577 Q 224 541 166 475 Q 124 436 155 371 Q 170 343 193 371 Q 212 399 229 441 Q 247 492 263 524 L 264 551 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 263 524 Q 293 503 331 515 Q 475 560 672 578 Q 712 582 727 580 Q 745 567 741 558 Q 729 510 715 462 L 717 461 Q 726 457 742 471 Q 797 513 844 528 Q 881 543 880 551 Q 879 561 800 614 Q 776 632 695 615 Q 581 602 373 566 Q 321 557 267 552 Q 266 552 264 551 L 263 524 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 347 340 Q 348 232 218 100 Q 182 76 146 37 Q 136 21 153 25 Q 175 26 207 47 Q 304 110 363 195 Q 400 246 434 287 Q 447 300 432 318 Q 383 360 358 358 Q 345 357 347 340 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 494 401 Q 528 376 549 337 Q 649 168 731 51 Q 747 29 775 26 Q 878 22 917 26 Q 935 27 941 34 Q 947 41 936 47 Q 806 110 743 169 Q 665 242 557 397 Q 547 416 529 420 Q 498 424 488 415 Q 484 408 494 401 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 453 738 Q 489 710 527 674 Q 543 658 562 660 Q 575 661 580 676 Q 586 695 574 729 Q 567 754 528 772 Q 438 803 420 796 Q 414 792 416 775 Q 420 762 453 738 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 425 789 L 433 779 L 529 726 L 560 680\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"306 612\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 264 551 Q 252 578 240 589 Q 221 605 218 577 Q 224 541 166 475 Q 124 436 155 371 Q 170 343 193 371 Q 212 399 229 441 Q 247 492 263 524 L 264 551 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 229 582 L 240 549 L 235 529 L 182 432 L 172 375\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"352 704\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 263 524 Q 293 503 331 515 Q 475 560 672 578 Q 712 582 727 580 Q 745 567 741 558 Q 729 510 715 462 L 717 461 Q 726 457 742 471 Q 797 513 844 528 Q 881 543 880 551 Q 879 561 800 614 Q 776 632 695 615 Q 581 602 373 566 Q 321 557 267 552 Q 266 552 264 551 L 263 524 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 268 544 L 288 533 L 319 535 L 528 577 L 729 601 L 771 587 L 791 560 L 730 473 L 719 468\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"794 1588\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 347 340 Q 348 232 218 100 Q 182 76 146 37 Q 136 21 153 25 Q 175 26 207 47 Q 304 110 363 195 Q 400 246 434 287 Q 447 300 432 318 Q 383 360 358 358 Q 345 357 347 340 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 359 345 L 387 298 L 336 205 L 303 159 L 230 84 L 157 36\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"537 1074\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 494 401 Q 528 376 549 337 Q 649 168 731 51 Q 747 29 775 26 Q 878 22 917 26 Q 935 27 941 34 Q 947 41 936 47 Q 806 110 743 169 Q 665 242 557 397 Q 547 416 529 420 Q 498 424 488 415 Q 484 408 494 401 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 496 410 L 532 396 L 675 192 L 773 80 L 932 38\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"729 1458\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 640;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7708333333333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 619;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7537434895833334s both;\n          animation-delay: 0.7708333333333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 947;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0206705729166667s both;\n          animation-delay: 1.5245768229166667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 547;\n            stroke-width: 128;\n          }\n          64% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6951497395833334s both;\n          animation-delay: 2.5452473958333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 449;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6153971354166666s both;\n          animation-delay: 3.240397135416667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 705;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.82373046875s both;\n          animation-delay: 3.8557942708333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 910;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.9905598958333334s both;\n          animation-delay: 4.679524739583334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 541 606 Q 587 616 638 624 Q 690 636 698 643 Q 708 650 703 660 Q 696 672 666 680 Q 645 686 543 656 L 492 642 Q 485 642 479 640 Q 407 624 322 618 Q 285 612 311 594 Q 350 573 427 585 Q 458 591 493 597 L 541 606 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 533 485 Q 537 546 541 606 L 543 656 Q 544 719 562 788 Q 565 798 546 813 Q 512 831 488 835 Q 472 838 464 830 Q 457 823 465 808 Q 486 778 486 758 Q 490 703 492 642 L 493 597 Q 493 540 492 477 L 533 485 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 520 446 Q 565 453 832 469 Q 851 470 857 479 Q 861 492 844 505 Q 792 541 750 533 Q 666 512 533 485 L 492 477 Q 491 478 489 477 Q 341 452 168 423 Q 146 420 163 403 Q 196 376 236 385 Q 363 427 479 440 L 520 446 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 533 154 Q 536 223 540 281 L 541 308 Q 542 377 547 399 Q 554 415 545 425 Q 532 438 520 446 L 479 440 Q 491 409 492 390 Q 493 368 492 182 L 533 154 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 540 281 Q 550 277 567 280 Q 660 298 729 309 Q 757 316 746 331 Q 733 347 701 352 Q 671 355 541 308 L 540 281 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 377 271 Q 384 284 395 297 Q 405 310 391 325 Q 349 359 322 357 Q 310 356 312 340 Q 319 213 181 66 Q 139 32 105 -8 Q 96 -23 112 -19 Q 172 -9 274 113 Q 281 123 360 244 L 377 271 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 360 244 Q 465 139 598 48 Q 617 36 639 22 Q 726 -36 758 -39 Q 777 -39 914 -13 Q 948 -6 956 6 Q 962 18 942 19 Q 861 34 811 38 Q 678 51 542 149 Q 536 152 533 154 L 492 182 Q 434 224 377 271 L 360 244 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 541 606 Q 587 616 638 624 Q 690 636 698 643 Q 708 650 703 660 Q 696 672 666 680 Q 645 686 543 656 L 492 642 Q 485 642 479 640 Q 407 624 322 618 Q 285 612 311 594 Q 350 573 427 585 Q 458 591 493 597 L 541 606 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 314 607 L 343 601 L 415 605 L 636 652 L 692 654\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"512 1024\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 533 485 Q 537 546 541 606 L 543 656 Q 544 719 562 788 Q 565 798 546 813 Q 512 831 488 835 Q 472 838 464 830 Q 457 823 465 808 Q 486 778 486 758 Q 490 703 492 642 L 493 597 Q 493 540 492 477 L 533 485 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 475 821 L 521 783 L 514 509 L 498 485\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"491 982\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 520 446 Q 565 453 832 469 Q 851 470 857 479 Q 861 492 844 505 Q 792 541 750 533 Q 666 512 533 485 L 492 477 Q 491 478 489 477 Q 341 452 168 423 Q 146 420 163 403 Q 196 376 236 385 Q 363 427 479 440 L 520 446 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 165 413 L 225 407 L 368 440 L 752 499 L 785 499 L 846 484\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"819 1638\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 533 154 Q 536 223 540 281 L 541 308 Q 542 377 547 399 Q 554 415 545 425 Q 532 438 520 446 L 479 440 Q 491 409 492 390 Q 493 368 492 182 L 533 154 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 487 434 L 519 409 L 513 196 L 531 163\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"419 838\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 540 281 Q 550 277 567 280 Q 660 298 729 309 Q 757 316 746 331 Q 733 347 701 352 Q 671 355 541 308 L 540 281 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 547 287 L 580 303 L 686 327 L 733 323\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"321 642\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 377 271 Q 384 284 395 297 Q 405 310 391 325 Q 349 359 322 357 Q 310 356 312 340 Q 319 213 181 66 Q 139 32 105 -8 Q 96 -23 112 -19 Q 172 -9 274 113 Q 281 123 360 244 L 377 271 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 323 345 L 350 303 L 307 203 L 226 85 L 147 12 L 114 -10\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"577 1154\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 360 244 Q 465 139 598 48 Q 617 36 639 22 Q 726 -36 758 -39 Q 777 -39 914 -13 Q 948 -6 956 6 Q 962 18 942 19 Q 861 34 811 38 Q 678 51 542 149 Q 536 152 533 154 L 492 182 Q 434 224 377 271 L 360 244 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 378 261 L 398 230 L 516 136 L 684 32 L 762 3 L 920 4 L 947 10\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"782 1564\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 696;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.81640625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 691;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8123372395833334s both;\n          animation-delay: 0.81640625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1509;\n            stroke-width: 128;\n          }\n          83% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.47802734375s both;\n          animation-delay: 1.6287434895833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 813;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.91162109375s both;\n          animation-delay: 3.1067708333333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 354;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5380859375s both;\n          animation-delay: 4.018391927083334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 357;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.54052734375s both;\n          animation-delay: 4.556477864583334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 362;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.5445963541666666s both;\n          animation-delay: 5.097005208333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 357;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.54052734375s both;\n          animation-delay: 5.641601562500001s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 502 676 Q 587 689 679 701 Q 743 711 753 719 Q 763 726 758 736 Q 752 749 723 758 Q 692 767 661 756 Q 588 737 509 722 Q 422 709 321 705 Q 284 701 308 682 Q 350 655 424 667 Q 440 670 458 670 L 502 676 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 219 488 Q 191 512 164 517 Q 158 520 153 513 Q 149 506 153 492 Q 184 438 187 392 Q 196 284 185 165 Q 181 140 192 118 Q 205 97 224 84 Q 239 75 241 87 Q 248 91 250 115 Q 256 142 246 231 Q 234 390 234 450 L 219 488 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 529 507 Q 559 514 789 532 Q 808 533 814 524 Q 824 517 822 466 Q 816 258 783 141 Q 773 105 742 111 Q 703 120 668 127 Q 655 131 654 125 Q 653 118 664 107 Q 740 49 761 17 Q 771 -1 784 2 Q 800 3 815 33 Q 843 76 852 129 Q 868 199 882 446 Q 885 491 899 515 Q 917 537 903 542 Q 887 558 849 576 Q 825 592 799 581 Q 763 571 672 560 Q 596 553 530 543 L 485 536 Q 430 529 386 519 Q 301 501 219 488 L 234 450 Q 255 468 486 500 L 529 507 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 530 543 Q 531 589 541 623 Q 548 636 546 646 Q 540 653 502 676 L 458 670 Q 458 669 460 665 Q 482 635 483 604 Q 484 573 485 536 L 486 500 Q 486 281 474 230 Q 459 203 485 142 Q 491 127 497 125 Q 503 119 508 126 Q 515 130 523 147 Q 530 166 530 193 Q 529 224 529 507 L 530 543 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 327 380 Q 378 347 405 341 Q 415 341 420 352 Q 423 362 418 373 Q 399 409 331 409 L 330 409 Q 317 410 312 406 Q 308 405 311 396 Q 314 389 327 380 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 319 246 Q 370 206 395 201 Q 407 201 412 212 Q 415 222 411 235 Q 404 253 388 260 Q 369 270 324 277 Q 311 278 304 275 Q 300 274 303 264 Q 306 255 319 246 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 611 413 Q 669 383 697 382 Q 709 383 712 395 Q 713 407 707 418 Q 689 445 632 445 Q 598 445 591 439 Q 587 436 592 428 Q 596 419 611 413 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 609 269 Q 658 233 686 228 Q 699 228 704 240 Q 707 252 702 264 Q 684 297 633 300 Q 600 304 592 299 Q 588 298 591 287 Q 594 278 609 269 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 502 676 Q 587 689 679 701 Q 743 711 753 719 Q 763 726 758 736 Q 752 749 723 758 Q 692 767 661 756 Q 588 737 509 722 Q 422 709 321 705 Q 284 701 308 682 Q 350 655 424 667 Q 440 670 458 670 L 502 676 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 312 695 L 343 687 L 396 686 L 520 701 L 698 734 L 747 730\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"568 1136\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 219 488 Q 191 512 164 517 Q 158 520 153 513 Q 149 506 153 492 Q 184 438 187 392 Q 196 284 185 165 Q 181 140 192 118 Q 205 97 224 84 Q 239 75 241 87 Q 248 91 250 115 Q 256 142 246 231 Q 234 390 234 450 L 219 488 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 162 506 L 196 471 L 209 425 L 217 303 L 218 146 L 232 89\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"563 1126\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 529 507 Q 559 514 789 532 Q 808 533 814 524 Q 824 517 822 466 Q 816 258 783 141 Q 773 105 742 111 Q 703 120 668 127 Q 655 131 654 125 Q 653 118 664 107 Q 740 49 761 17 Q 771 -1 784 2 Q 800 3 815 33 Q 843 76 852 129 Q 868 199 882 446 Q 885 491 899 515 Q 917 537 903 542 Q 887 558 849 576 Q 825 592 799 581 Q 763 571 672 560 Q 596 553 530 543 L 485 536 Q 430 529 386 519 Q 301 501 219 488 L 234 450 Q 255 468 486 500 L 529 507 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 232 457 L 246 475 L 259 479 L 510 523 L 813 557 L 845 540 L 855 530 L 858 511 L 840 271 L 826 174 L 808 104 L 780 69 L 679 109 L 661 123\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1381 2762\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 530 543 Q 531 589 541 623 Q 548 636 546 646 Q 540 653 502 676 L 458 670 Q 458 669 460 665 Q 482 635 483 604 Q 484 573 485 536 L 486 500 Q 486 281 474 230 Q 459 203 485 142 Q 491 127 497 125 Q 503 119 508 126 Q 515 130 523 147 Q 530 166 530 193 Q 529 224 529 507 L 530 543 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 465 670 L 498 651 L 511 625 L 507 312 L 499 210 L 502 136\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"685 1370\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 327 380 Q 378 347 405 341 Q 415 341 420 352 Q 423 362 418 373 Q 399 409 331 409 L 330 409 Q 317 410 312 406 Q 308 405 311 396 Q 314 389 327 380 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 318 400 L 372 381 L 405 357\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"226 452\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 319 246 Q 370 206 395 201 Q 407 201 412 212 Q 415 222 411 235 Q 404 253 388 260 Q 369 270 324 277 Q 311 278 304 275 Q 300 274 303 264 Q 306 255 319 246 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 310 269 L 373 239 L 396 218\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"229 458\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 611 413 Q 669 383 697 382 Q 709 383 712 395 Q 713 407 707 418 Q 689 445 632 445 Q 598 445 591 439 Q 587 436 592 428 Q 596 419 611 413 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 598 434 L 670 415 L 697 398\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"234 468\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 609 269 Q 658 233 686 228 Q 699 228 704 240 Q 707 252 702 264 Q 684 297 633 300 Q 600 304 592 299 Q 588 298 591 287 Q 594 278 609 269 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 598 292 L 663 266 L 687 246\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"229 458\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 976;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0442708333333333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1511;\n            stroke-width: 128;\n          }\n          83% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.4796549479166667s both;\n          animation-delay: 1.0442708333333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 733;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8465169270833334s both;\n          animation-delay: 2.52392578125s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 269 744 Q 257 756 237 763 Q 225 770 212 765 Q 202 759 209 744 Q 231 657 234 646 Q 234 306 200 169 Q 179 87 219 39 Q 231 23 244 37 Q 254 50 258 68 L 264 110 Q 268 144 268 196 Q 286 686 292 701 L 269 744 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 707 92 Q 738 52 761 15 Q 771 -6 784 -5 Q 803 -4 820 35 Q 841 80 836 133 Q 823 317 817 657 Q 816 696 836 723 Q 846 739 836 751 Q 812 775 748 804 Q 726 816 707 804 Q 613 771 469 756 Q 333 743 269 744 L 292 701 Q 317 702 652 745 Q 707 752 734 729 Q 753 707 762 577 Q 769 450 763 281 Q 757 178 753 135 Q 750 123 743 120 L 707 92 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 258 68 Q 265 67 276 68 Q 415 89 707 92 L 743 120 Q 736 129 721 140 Q 702 153 665 147 Q 442 116 264 110 L 258 68 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 269 744 Q 257 756 237 763 Q 225 770 212 765 Q 202 759 209 744 Q 231 657 234 646 Q 234 306 200 169 Q 179 87 219 39 Q 231 23 244 37 Q 254 50 258 68 L 264 110 Q 268 144 268 196 Q 286 686 292 701 L 269 744 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 220 753 L 250 713 L 261 652 L 250 325 L 228 112 L 232 45\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"848 1696\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 707 92 Q 738 52 761 15 Q 771 -6 784 -5 Q 803 -4 820 35 Q 841 80 836 133 Q 823 317 817 657 Q 816 696 836 723 Q 846 739 836 751 Q 812 775 748 804 Q 726 816 707 804 Q 613 771 469 756 Q 333 743 269 744 L 292 701 Q 317 702 652 745 Q 707 752 734 729 Q 753 707 762 577 Q 769 450 763 281 Q 757 178 753 135 Q 750 123 743 120 L 707 92 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 274 740 L 305 723 L 486 739 L 729 774 L 757 759 L 786 731 L 796 279 L 795 136 L 781 81 L 784 13\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1383 2766\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 258 68 Q 265 67 276 68 Q 415 89 707 92 L 743 120 Q 736 129 721 140 Q 702 153 665 147 Q 442 116 264 110 L 258 68 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 262 75 L 286 91 L 733 120\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"605 1210\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1166;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.1988932291666667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 487;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6463216145833334s both;\n          animation-delay: 1.1988932291666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 512;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6666666666666666s both;\n          animation-delay: 1.84521484375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 499 695 Q 503 661 501 132 Q 500 110 488 101 Q 478 92 448 100 Q 414 107 383 113 Q 347 123 351 112 Q 352 105 375 91 Q 456 42 479 10 Q 504 -26 523 -25 Q 538 -26 552 11 Q 568 57 564 133 Q 531 583 572 723 Q 590 754 532 778 Q 498 797 477 789 Q 459 782 475 759 Q 497 731 499 695 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 266 475 Q 223 408 170 349 Q 160 339 155 320 Q 148 292 154 273 Q 158 251 185 261 Q 213 274 237 308 Q 273 357 284 404 Q 297 441 293 470 Q 289 480 283 484 Q 273 484 266 475 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 706 472 Q 769 411 842 323 Q 860 299 878 293 Q 888 292 897 303 Q 913 318 900 370 Q 887 431 709 508 Q 699 515 696 500 Q 695 484 706 472 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 499 695 Q 503 661 501 132 Q 500 110 488 101 Q 478 92 448 100 Q 414 107 383 113 Q 347 123 351 112 Q 352 105 375 91 Q 456 42 479 10 Q 504 -26 523 -25 Q 538 -26 552 11 Q 568 57 564 133 Q 531 583 572 723 Q 590 754 532 778 Q 498 797 477 789 Q 459 782 475 759 Q 497 731 499 695 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 484 773 L 501 765 L 533 730 L 525 545 L 532 191 L 528 90 L 510 54 L 459 68 L 358 112\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1038 2076\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 266 475 Q 223 408 170 349 Q 160 339 155 320 Q 148 292 154 273 Q 158 251 185 261 Q 213 274 237 308 Q 273 357 284 404 Q 297 441 293 470 Q 289 480 283 484 Q 273 484 266 475 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 280 476 L 254 405 L 170 274\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"359 718\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 706 472 Q 769 411 842 323 Q 860 299 878 293 Q 888 292 897 303 Q 913 318 900 370 Q 887 431 709 508 Q 699 515 696 500 Q 695 484 706 472 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 709 494 L 800 425 L 848 380 L 866 353 L 879 311\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"384 768\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 684;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.806640625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1427;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.4112955729166667s both;\n          animation-delay: 0.806640625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 893;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.9767252604166666s both;\n          animation-delay: 2.217936197916667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 425;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5958658854166666s both;\n          animation-delay: 3.1946614583333335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 475 506 Q 595 557 599 560 Q 608 570 602 579 Q 592 592 558 595 Q 515 596 455 559 L 409 537 Q 289 489 193 464 Q 153 451 185 436 Q 236 417 296 440 Q 359 464 427 488 L 475 506 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 554 225 Q 656 68 774 -1 Q 844 -47 874 -44 Q 896 -37 885 -8 Q 879 47 881 207 Q 880 234 870 235 Q 863 234 856 210 Q 840 161 826 121 Q 813 79 797 78 Q 784 75 752 93 Q 659 157 590 263 L 560 315 Q 520 390 475 506 L 455 559 Q 421 661 416 743 Q 420 789 356 801 Q 314 811 295 798 Q 274 786 289 767 Q 347 733 355 696 Q 383 611 409 537 L 427 488 Q 472 371 525 275 L 554 225 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 525 275 Q 519 271 514 264 Q 429 174 236 80 Q 226 73 232 68 Q 239 64 253 66 Q 338 82 414 122 Q 480 152 554 225 L 590 263 Q 627 308 669 369 Q 691 399 716 426 Q 726 435 723 447 Q 719 460 689 487 Q 667 506 656 505 Q 640 504 639 487 Q 630 403 560 315 L 525 275 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 615 733 Q 654 708 695 677 Q 711 664 729 667 Q 741 668 745 684 Q 748 700 734 732 Q 718 768 604 785 Q 586 786 580 783 Q 574 779 578 765 Q 584 753 615 733 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 475 506 Q 595 557 599 560 Q 608 570 602 579 Q 592 592 558 595 Q 515 596 455 559 L 409 537 Q 289 489 193 464 Q 153 451 185 436 Q 236 417 296 440 Q 359 464 427 488 L 475 506 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 186 451 L 211 448 L 265 457 L 424 515 L 532 563 L 565 571 L 592 570\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"556 1112\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 554 225 Q 656 68 774 -1 Q 844 -47 874 -44 Q 896 -37 885 -8 Q 879 47 881 207 Q 880 234 870 235 Q 863 234 856 210 Q 840 161 826 121 Q 813 79 797 78 Q 784 75 752 93 Q 659 157 590 263 L 560 315 Q 520 390 475 506 L 455 559 Q 421 661 416 743 Q 420 789 356 801 Q 314 811 295 798 Q 274 786 289 767 Q 347 733 355 696 Q 383 611 409 537 L 427 488 Q 472 371 525 275 L 554 225 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 301 781 L 341 772 L 374 750 L 430 552 L 529 319 L 580 231 L 686 105 L 753 53 L 790 37 L 827 31 L 847 81 L 870 228\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1299 2598\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 525 275 Q 519 271 514 264 Q 429 174 236 80 Q 226 73 232 68 Q 239 64 253 66 Q 338 82 414 122 Q 480 152 554 225 L 590 263 Q 627 308 669 369 Q 691 399 716 426 Q 726 435 723 447 Q 719 460 689 487 Q 667 506 656 505 Q 640 504 639 487 Q 630 403 560 315 L 525 275 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 656 488 L 671 455 L 671 436 L 606 329 L 516 226 L 454 176 L 383 132 L 302 94 L 238 73\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"765 1530\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 615 733 Q 654 708 695 677 Q 711 664 729 667 Q 741 668 745 684 Q 748 700 734 732 Q 718 768 604 785 Q 586 786 580 783 Q 574 779 578 765 Q 584 753 615 733 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 586 775 L 690 726 L 726 686\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"297 594\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1017;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.07763671875s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1609;\n            stroke-width: 128;\n          }\n          84% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.5594075520833333s both;\n          animation-delay: 1.07763671875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 395 691 Q 394 692 392 693 Q 340 720 324 717 Q 302 714 319 690 Q 352 632 330 422 Q 323 335 277 234 Q 244 158 141 62 Q 125 49 121 41 Q 120 34 132 34 Q 150 34 172 49 Q 226 85 259 119 Q 352 221 377 378 Q 395 478 401 627 Q 404 643 406 654 L 395 691 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 970 80 Q 992 89 984 112 Q 969 164 964 237 Q 961 277 953 284 Q 944 288 941 276 Q 905 152 866 122 Q 844 107 791 102 Q 721 96 682 108 Q 642 118 626 139 Q 610 158 603 191 Q 594 231 608 375 Q 621 522 647 617 Q 657 662 696 694 Q 712 713 694 728 Q 670 747 617 766 Q 595 772 576 760 Q 501 708 395 691 L 406 654 Q 427 657 555 696 Q 568 702 576 698 Q 580 694 581 679 Q 547 261 549 216 Q 549 27 798 35 Q 819 38 842 40 Q 906 49 970 80 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 395 691 Q 394 692 392 693 Q 340 720 324 717 Q 302 714 319 690 Q 352 632 330 422 Q 323 335 277 234 Q 244 158 141 62 Q 125 49 121 41 Q 120 34 132 34 Q 150 34 172 49 Q 226 85 259 119 Q 352 221 377 378 Q 395 478 401 627 Q 404 643 406 654 L 395 691 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 325 703 L 365 668 L 369 652 L 363 470 L 339 324 L 302 225 L 265 163 L 197 89 L 147 49 L 129 42\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"889 1778\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 970 80 Q 992 89 984 112 Q 969 164 964 237 Q 961 277 953 284 Q 944 288 941 276 Q 905 152 866 122 Q 844 107 791 102 Q 721 96 682 108 Q 642 118 626 139 Q 610 158 603 191 Q 594 231 608 375 Q 621 522 647 617 Q 657 662 696 694 Q 712 713 694 728 Q 670 747 617 766 Q 595 772 576 760 Q 501 708 395 691 L 406 654 Q 427 657 555 696 Q 568 702 576 698 Q 580 694 581 679 Q 547 261 549 216 Q 549 27 798 35 Q 819 38 842 40 Q 906 49 970 80 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 407 661 L 423 678 L 493 695 L 588 729 L 611 723 L 631 703 L 613 634 L 595 513 L 574 244 L 582 163 L 605 119 L 623 103 L 687 74 L 764 67 L 857 78 L 897 94 L 930 117 L 949 277\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1481 2962\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 634;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7659505208333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1056;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.109375s both;\n          animation-delay: 0.7659505208333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 637;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7683919270833334s both;\n          animation-delay: 1.8753255208333335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 564;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.708984375s both;\n          animation-delay: 2.643717447916667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 770;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.8766276041666666s both;\n          animation-delay: 3.352701822916667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 567;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.71142578125s both;\n          animation-delay: 4.229329427083334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 516 650 Q 595 687 652 697 Q 671 698 675 706 Q 679 718 666 731 Q 597 779 563 775 Q 554 771 554 758 Q 554 718 325 610 Q 319 609 313 605 Q 307 595 314 592 Q 338 592 437 624 Q 452 628 470 633 L 516 650 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 537 436 Q 642 445 903 446 Q 925 446 931 456 Q 938 469 919 484 Q 856 532 790 513 Q 690 495 541 473 L 489 466 Q 321 447 130 424 Q 108 423 124 403 Q 157 370 201 380 Q 378 428 473 429 Q 479 430 488 430 L 537 436 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 519 284 Q 529 362 537 436 L 541 473 Q 547 549 567 606 Q 571 616 552 632 Q 533 644 516 650 L 470 633 Q 491 600 491 549 Q 490 510 489 466 L 488 430 Q 484 357 477 276 L 519 284 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 353 262 Q 341 268 311 273 Q 298 276 295 271 Q 288 264 297 247 Q 334 168 354 40 Q 357 3 379 -24 Q 398 -46 403 -30 Q 410 -6 405 35 L 398 74 Q 376 186 370 225 L 353 262 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 683 104 Q 713 198 751 229 Q 770 248 755 270 Q 683 330 636 316 Q 573 297 519 284 L 477 276 Q 416 269 353 262 L 370 225 Q 377 225 606 259 Q 633 263 643 253 Q 655 243 652 219 Q 642 159 629 110 L 683 104 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 405 35 Q 450 50 700 62 Q 713 63 715 73 Q 715 82 683 104 L 629 110 Q 500 85 398 74 L 405 35 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 516 650 Q 595 687 652 697 Q 671 698 675 706 Q 679 718 666 731 Q 597 779 563 775 Q 554 771 554 758 Q 554 718 325 610 Q 319 609 313 605 Q 307 595 314 592 Q 338 592 437 624 Q 452 628 470 633 L 516 650 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 664 712 L 589 726 L 514 678 L 420 635 L 317 599\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"506 1012\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 537 436 Q 642 445 903 446 Q 925 446 931 456 Q 938 469 919 484 Q 856 532 790 513 Q 690 495 541 473 L 489 466 Q 321 447 130 424 Q 108 423 124 403 Q 157 370 201 380 Q 378 428 473 429 Q 479 430 488 430 L 537 436 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 127 413 L 162 404 L 190 405 L 439 445 L 816 482 L 859 480 L 918 463\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"928 1856\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 519 284 Q 529 362 537 436 L 541 473 Q 547 549 567 606 Q 571 616 552 632 Q 533 644 516 650 L 470 633 Q 491 600 491 549 Q 490 510 489 466 L 488 430 Q 484 357 477 276 L 519 284 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 478 630 L 508 618 L 525 603 L 502 310 L 483 284\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"509 1018\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 353 262 Q 341 268 311 273 Q 298 276 295 271 Q 288 264 297 247 Q 334 168 354 40 Q 357 3 379 -24 Q 398 -46 403 -30 Q 410 -6 405 35 L 398 74 Q 376 186 370 225 L 353 262 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 303 263 L 332 239 L 341 219 L 392 -24\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"436 872\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 683 104 Q 713 198 751 229 Q 770 248 755 270 Q 683 330 636 316 Q 573 297 519 284 L 477 276 Q 416 269 353 262 L 370 225 Q 377 225 606 259 Q 633 263 643 253 Q 655 243 652 219 Q 642 159 629 110 L 683 104 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 361 258 L 383 246 L 509 261 L 620 286 L 648 287 L 671 279 L 700 249 L 664 134 L 636 116\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"642 1284\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 405 35 Q 450 50 700 62 Q 713 63 715 73 Q 715 82 683 104 L 629 110 Q 500 85 398 74 L 405 35 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 406 42 L 419 58 L 625 84 L 674 83 L 706 73\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"439 878\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 686;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8082682291666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1099;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1443684895833333s both;\n          animation-delay: 0.8082682291666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1033;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.0906575520833333s both;\n          animation-delay: 1.95263671875s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 524 729 Q 597 742 677 756 Q 737 768 746 776 Q 756 785 751 794 Q 744 807 711 817 Q 677 826 587 796 Q 446 762 325 753 Q 283 749 312 728 Q 355 703 438 715 Q 445 716 457 718 L 524 729 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 545 455 Q 755 479 902 467 Q 938 467 943 473 Q 950 489 937 501 Q 903 532 854 553 Q 838 560 809 550 Q 782 544 546 508 L 486 501 Q 465 501 286 476 Q 214 463 107 461 Q 91 461 90 448 Q 90 435 111 419 Q 130 406 166 392 Q 178 388 198 397 Q 214 403 291 417 Q 378 438 485 450 L 545 455 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 482 0 Q 489 -30 496 -41 Q 503 -48 511 -46 Q 527 -37 537 33 Q 547 123 545 213 Q 542 271 545 455 L 546 508 Q 546 607 562 682 Q 565 703 549 713 Q 536 723 524 729 L 457 718 Q 481 661 484 653 Q 485 640 486 501 L 485 450 Q 479 35 482 0 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 524 729 Q 597 742 677 756 Q 737 768 746 776 Q 756 785 751 794 Q 744 807 711 817 Q 677 826 587 796 Q 446 762 325 753 Q 283 749 312 728 Q 355 703 438 715 Q 445 716 457 718 L 524 729 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 315 742 L 360 734 L 407 736 L 686 789 L 739 788\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"558 1116\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 545 455 Q 755 479 902 467 Q 938 467 943 473 Q 950 489 937 501 Q 903 532 854 553 Q 838 560 809 550 Q 782 544 546 508 L 486 501 Q 465 501 286 476 Q 214 463 107 461 Q 91 461 90 448 Q 90 435 111 419 Q 130 406 166 392 Q 178 388 198 397 Q 214 403 291 417 Q 378 438 485 450 L 545 455 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 104 447 L 175 427 L 466 474 L 837 513 L 934 482\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"971 1942\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 482 0 Q 489 -30 496 -41 Q 503 -48 511 -46 Q 527 -37 537 33 Q 547 123 545 213 Q 542 271 545 455 L 546 508 Q 546 607 562 682 Q 565 703 549 713 Q 536 723 524 729 L 457 718 Q 481 661 484 653 Q 485 640 486 501 L 485 450 Q 479 35 482 0 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 465 709 L 518 683 L 520 668 L 506 -35\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"905 1810\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 643;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7732747395833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 917;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.9962565104166666s both;\n          animation-delay: 0.7732747395833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1157;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1915690104166667s both;\n          animation-delay: 1.76953125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 980;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.0475260416666667s both;\n          animation-delay: 2.961100260416667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 396 753 Q 353 775 339 773 Q 320 770 335 750 Q 363 705 341 578 Q 335 557 327 534 Q 311 494 267 449 Q 254 437 251 431 Q 250 425 260 425 Q 290 425 334 469 Q 394 532 405 696 Q 406 709 409 718 L 396 753 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 806 487 Q 821 493 812 508 Q 797 527 779 538 Q 769 545 744 536 Q 696 514 637 517 Q 600 518 588 546 Q 572 571 578 647 Q 579 693 619 743 Q 635 759 618 773 Q 594 792 567 803 Q 557 807 539 797 Q 485 773 396 753 L 409 718 Q 469 733 531 750 Q 540 746 538 731 Q 534 563 536 552 Q 542 506 577 482 Q 617 460 693 463 Q 768 466 806 487 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 524 160 Q 570 221 600 312 Q 610 349 634 368 Q 653 383 633 401 Q 611 420 576 437 Q 552 447 528 436 Q 444 397 330 386 Q 300 383 287 376 Q 277 369 298 357 Q 326 342 370 356 Q 445 371 519 385 Q 538 392 539 369 Q 539 287 479 194 L 451 158 Q 382 83 175 27 Q 157 24 167 14 Q 174 7 207 9 Q 322 21 390 49 Q 445 73 489 118 L 524 160 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 489 118 Q 633 -26 681 -30 Q 774 -30 871 -10 Q 913 -3 909 9 Q 908 15 865 26 Q 675 71 628 94 Q 588 115 524 160 L 479 194 Q 430 236 377 285 Q 334 327 296 325 Q 277 324 273 318 Q 272 311 289 300 Q 346 267 451 158 L 489 118 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 396 753 Q 353 775 339 773 Q 320 770 335 750 Q 363 705 341 578 Q 335 557 327 534 Q 311 494 267 449 Q 254 437 251 431 Q 250 425 260 425 Q 290 425 334 469 Q 394 532 405 696 Q 406 709 409 718 L 396 753 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 339 761 L 363 744 L 377 716 L 377 667 L 365 579 L 347 525 L 324 486 L 292 452 L 258 432\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"515 1030\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 806 487 Q 821 493 812 508 Q 797 527 779 538 Q 769 545 744 536 Q 696 514 637 517 Q 600 518 588 546 Q 572 571 578 647 Q 579 693 619 743 Q 635 759 618 773 Q 594 792 567 803 Q 557 807 539 797 Q 485 773 396 753 L 409 718 Q 469 733 531 750 Q 540 746 538 731 Q 534 563 536 552 Q 542 506 577 482 Q 617 460 693 463 Q 768 466 806 487 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 406 750 L 427 741 L 543 772 L 560 769 L 576 753 L 557 668 L 557 572 L 564 538 L 593 502 L 637 490 L 667 489 L 717 494 L 765 507 L 803 499\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"789 1578\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 524 160 Q 570 221 600 312 Q 610 349 634 368 Q 653 383 633 401 Q 611 420 576 437 Q 552 447 528 436 Q 444 397 330 386 Q 300 383 287 376 Q 277 369 298 357 Q 326 342 370 356 Q 445 371 519 385 Q 538 392 539 369 Q 539 287 479 194 L 451 158 Q 382 83 175 27 Q 157 24 167 14 Q 174 7 207 9 Q 322 21 390 49 Q 445 73 489 118 L 524 160 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 296 369 L 330 367 L 404 379 L 543 412 L 560 406 L 583 381 L 540 242 L 513 193 L 454 122 L 386 76 L 327 52 L 197 19 L 174 19\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1029 2058\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 489 118 Q 633 -26 681 -30 Q 774 -30 871 -10 Q 913 -3 909 9 Q 908 15 865 26 Q 675 71 628 94 Q 588 115 524 160 L 479 194 Q 430 236 377 285 Q 334 327 296 325 Q 277 324 273 318 Q 272 311 289 300 Q 346 267 451 158 L 489 118 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 280 316 L 312 306 L 344 287 L 517 129 L 641 40 L 683 21 L 733 14 L 903 7\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"852 1704\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 763;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8709309895833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1355;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.3527018229166667s both;\n          animation-delay: 0.8709309895833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 438;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6064453125s both;\n          animation-delay: 2.2236328125s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 371 481 Q 410 518 443 557 L 463 584 Q 479 606 494 630 Q 534 697 573 751 Q 586 764 569 783 Q 523 822 492 820 Q 479 819 481 801 Q 490 657 322 489 Q 283 459 242 414 Q 232 396 249 401 Q 282 407 355 467 L 371 481 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 443 557 Q 500 532 631 578 Q 658 588 669 581 Q 678 575 656 510 Q 605 333 438 167 Q 320 62 207 3 Q 197 -3 198 -8 Q 199 -14 208 -13 Q 340 -7 516 168 Q 550 207 586 253 Q 659 353 732 511 Q 751 545 780 567 Q 798 577 797 587 Q 797 603 762 621 Q 720 646 703 646 Q 690 645 677 635 Q 548 592 471 585 Q 467 585 463 584 L 443 557 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 355 467 Q 358 460 364 454 Q 407 412 460 350 Q 475 331 489 327 Q 498 326 505 334 Q 517 347 506 388 Q 499 427 432 457 Q 393 473 371 481 L 355 467 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 371 481 Q 410 518 443 557 L 463 584 Q 479 606 494 630 Q 534 697 573 751 Q 586 764 569 783 Q 523 822 492 820 Q 479 819 481 801 Q 490 657 322 489 Q 283 459 242 414 Q 232 396 249 401 Q 282 407 355 467 L 371 481 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 494 806 L 525 760 L 462 626 L 421 566 L 354 492 L 251 411\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"635 1270\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 443 557 Q 500 532 631 578 Q 658 588 669 581 Q 678 575 656 510 Q 605 333 438 167 Q 320 62 207 3 Q 197 -3 198 -8 Q 199 -14 208 -13 Q 340 -7 516 168 Q 550 207 586 253 Q 659 353 732 511 Q 751 545 780 567 Q 798 577 797 587 Q 797 603 762 621 Q 720 646 703 646 Q 690 645 677 635 Q 548 592 471 585 Q 467 585 463 584 L 443 557 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 449 559 L 479 568 L 540 574 L 676 608 L 704 603 L 722 584 L 684 485 L 635 381 L 583 296 L 520 214 L 461 151 L 352 64 L 268 16 L 206 -5\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1227 2454\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 355 467 Q 358 460 364 454 Q 407 412 460 350 Q 475 331 489 327 Q 498 326 505 334 Q 517 347 506 388 Q 499 427 432 457 Q 393 473 371 481 L 355 467 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 365 464 L 374 465 L 453 408 L 474 384 L 491 344\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"310 620\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 910;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9905598958333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 512;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.6666666666666666s both;\n          animation-delay: 0.9905598958333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 615;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.75048828125s both;\n          animation-delay: 1.6572265625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1061;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.1134440104166667s both;\n          animation-delay: 2.40771484375s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 544 136 Q 548 286 552 424 L 553 451 Q 556 622 577 716 Q 581 731 558 749 Q 516 770 488 774 Q 469 778 460 768 Q 451 758 461 741 Q 498 689 497 653 Q 510 412 495 131 L 544 136 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 552 424 Q 603 406 652 420 Q 716 433 781 449 Q 812 456 816 461 Q 825 471 820 479 Q 811 492 780 498 Q 747 504 715 490 Q 682 477 645 468 Q 605 458 557 452 Q 554 452 553 451 L 552 424 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 347 116 Q 334 323 339 400 Q 343 425 326 439 Q 301 458 270 469 Q 254 475 244 468 Q 235 461 243 444 Q 267 398 278 350 Q 285 302 302 113 L 347 116 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 495 131 Q 423 127 347 116 L 302 113 Q 217 106 128 98 Q 103 97 120 75 Q 156 39 201 49 Q 498 118 900 96 Q 901 97 904 96 Q 928 95 934 105 Q 941 118 922 136 Q 859 184 788 170 Q 691 155 544 136 L 495 131 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 544 136 Q 548 286 552 424 L 553 451 Q 556 622 577 716 Q 581 731 558 749 Q 516 770 488 774 Q 469 778 460 768 Q 451 758 461 741 Q 498 689 497 653 Q 510 412 495 131 L 544 136 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 474 756 L 530 713 L 532 680 L 521 158 L 500 139\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"782 1564\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 552 424 Q 603 406 652 420 Q 716 433 781 449 Q 812 456 816 461 Q 825 471 820 479 Q 811 492 780 498 Q 747 504 715 490 Q 682 477 645 468 Q 605 458 557 452 Q 554 452 553 451 L 552 424 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 557 444 L 578 435 L 603 436 L 760 473 L 807 472\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"384 768\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 347 116 Q 334 323 339 400 Q 343 425 326 439 Q 301 458 270 469 Q 254 475 244 468 Q 235 461 243 444 Q 267 398 278 350 Q 285 302 302 113 L 347 116 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 254 457 L 301 409 L 323 136 L 339 127\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"487 974\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 495 131 Q 423 127 347 116 L 302 113 Q 217 106 128 98 Q 103 97 120 75 Q 156 39 201 49 Q 498 118 900 96 Q 901 97 904 96 Q 928 95 934 105 Q 941 118 922 136 Q 859 184 788 170 Q 691 155 544 136 L 495 131 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 124 86 L 180 74 L 446 109 L 813 137 L 887 126 L 921 112\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"933 1866\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 836;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9303385416666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 934;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0100911458333333s both;\n          animation-delay: 0.9303385416666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 703;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8221028645833334s both;\n          animation-delay: 1.9404296875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1058;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.1110026041666667s both;\n          animation-delay: 2.7625325520833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 939;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.01416015625s both;\n          animation-delay: 3.87353515625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 553 581 Q 616 597 679 608 Q 722 611 723 592 Q 724 576 701 510 Q 694 492 703 489 Q 712 485 724 501 Q 800 571 832 588 Q 857 597 854 612 Q 851 625 766 662 Q 741 671 712 661 Q 625 636 555 616 L 501 604 Q 425 591 329 573 L 339 528 Q 351 529 369 535 Q 436 554 501 568 L 553 581 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 329 573 Q 328 574 327 574 Q 278 599 261 597 Q 240 594 256 571 Q 289 511 261 291 Q 249 234 221 166 Q 190 96 100 13 Q 85 0 82 -7 Q 79 -14 92 -14 Q 134 -14 208 62 Q 301 165 327 389 Q 336 521 339 528 L 329 573 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 543 405 Q 547 496 553 581 L 555 616 Q 558 718 578 783 Q 581 795 560 811 Q 523 830 496 835 Q 478 839 470 829 Q 463 822 471 805 Q 496 769 496 745 Q 500 678 501 604 L 501 568 Q 501 486 498 393 L 543 405 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 600 165 Q 640 226 669 320 Q 676 354 696 372 Q 712 385 694 401 Q 675 417 641 431 Q 620 438 599 428 Q 571 415 543 405 L 498 393 Q 408 381 397 374 Q 388 367 406 358 Q 431 345 470 357 Q 531 370 591 383 Q 612 389 612 366 Q 612 287 562 198 L 535 159 Q 477 86 305 34 Q 289 30 299 22 Q 306 16 335 20 Q 432 32 490 59 Q 533 81 568 122 L 600 165 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 568 122 Q 704 -20 761 -27 Q 875 -27 945 -19 Q 958 -15 962 -7 Q 966 2 944 5 Q 886 24 822 41 Q 716 72 600 165 L 562 198 Q 544 214 527 231 Q 443 321 390 316 Q 377 316 365 312 Q 355 308 361 298 Q 367 289 378 289 Q 417 286 535 159 L 568 122 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 553 581 Q 616 597 679 608 Q 722 611 723 592 Q 724 576 701 510 Q 694 492 703 489 Q 712 485 724 501 Q 800 571 832 588 Q 857 597 854 612 Q 851 625 766 662 Q 741 671 712 661 Q 625 636 555 616 L 501 604 Q 425 591 329 573 L 339 528 Q 351 529 369 535 Q 436 554 501 568 L 553 581 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 344 537 L 359 556 L 679 630 L 727 633 L 750 626 L 771 605 L 707 497\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"708 1416\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 329 573 Q 328 574 327 574 Q 278 599 261 597 Q 240 594 256 571 Q 289 511 261 291 Q 249 234 221 166 Q 190 96 100 13 Q 85 0 82 -7 Q 79 -14 92 -14 Q 134 -14 208 62 Q 301 165 327 389 Q 336 521 339 528 L 329 573 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 262 583 L 292 559 L 304 529 L 302 405 L 279 257 L 249 169 L 210 100 L 157 40 L 122 11 L 90 -6\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"806 1612\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 543 405 Q 547 496 553 581 L 555 616 Q 558 718 578 783 Q 581 795 560 811 Q 523 830 496 835 Q 478 839 470 829 Q 463 822 471 805 Q 496 769 496 745 Q 500 678 501 604 L 501 568 Q 501 486 498 393 L 543 405 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 483 819 L 533 778 L 522 429 L 504 401\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"575 1150\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 600 165 Q 640 226 669 320 Q 676 354 696 372 Q 712 385 694 401 Q 675 417 641 431 Q 620 438 599 428 Q 571 415 543 405 L 498 393 Q 408 381 397 374 Q 388 367 406 358 Q 431 345 470 357 Q 531 370 591 383 Q 612 389 612 366 Q 612 287 562 198 L 535 159 Q 477 86 305 34 Q 289 30 299 22 Q 306 16 335 20 Q 432 32 490 59 Q 533 81 568 122 L 600 165 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 402 368 L 459 370 L 614 407 L 636 398 L 650 377 L 630 288 L 608 231 L 583 184 L 545 132 L 495 90 L 451 67 L 343 32 L 305 27\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"930 1860\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 568 122 Q 704 -20 761 -27 Q 875 -27 945 -19 Q 958 -15 962 -7 Q 966 2 944 5 Q 886 24 822 41 Q 716 72 600 165 L 562 198 Q 544 214 527 231 Q 443 321 390 316 Q 377 316 365 312 Q 355 308 361 298 Q 367 289 378 289 Q 417 286 535 159 L 568 122 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 372 302 L 395 301 L 440 280 L 490 238 L 595 132 L 661 78 L 735 29 L 790 11 L 953 -6\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"811 1622\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 834;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9287109375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 636;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.767578125s both;\n          animation-delay: 0.9287109375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1069;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.1199544270833333s both;\n          animation-delay: 1.6962890625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 398;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5738932291666666s both;\n          animation-delay: 2.816243489583333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 414;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5869140625s both;\n          animation-delay: 3.3901367187499996s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1082;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.1305338541666667s both;\n          animation-delay: 3.9770507812499996s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 636 765 Q 715 774 784 778 Q 796 777 807 790 Q 808 803 783 816 Q 747 844 662 821 Q 499 791 294 773 Q 263 772 231 768 Q 198 767 222 745 Q 255 715 305 722 Q 312 723 323 724 L 382 733 Q 463 748 561 757 L 636 765 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 323 724 Q 336 697 337 352 L 385 357 Q 386 418 388 475 L 389 506 Q 390 555 392 600 L 393 628 Q 393 665 396 692 Q 402 711 382 733 L 323 724 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 641 388 Q 641 655 656 730 Q 659 749 644 760 Q 640 763 636 765 L 561 757 Q 585 702 587 689 Q 590 661 587 380 L 586 339 Q 577 -6 601 -41 Q 607 -48 615 -46 Q 631 -37 638 28 Q 648 125 645 223 Q 642 260 642 341 L 641 388 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 392 600 Q 434 594 538 619 Q 538 620 540 620 Q 547 627 543 634 Q 536 644 511 649 Q 510 649 393 628 L 392 600 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 388 475 Q 440 466 553 493 Q 553 494 555 494 Q 562 501 559 509 Q 552 519 526 527 Q 508 530 432 512 Q 411 509 389 506 L 388 475 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 642 341 Q 730 345 838 342 Q 922 339 931 350 Q 937 363 919 380 Q 853 431 786 411 Q 722 402 641 388 L 587 380 Q 544 377 499 370 Q 444 364 385 357 L 337 352 Q 228 342 111 329 Q 86 328 104 307 Q 138 273 183 282 Q 373 331 586 339 L 642 341 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 636 765 Q 715 774 784 778 Q 796 777 807 790 Q 808 803 783 816 Q 747 844 662 821 Q 499 791 294 773 Q 263 772 231 768 Q 198 767 222 745 Q 255 715 305 722 Q 312 723 323 724 L 382 733 Q 463 748 561 757 L 636 765 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 224 757 L 249 749 L 295 747 L 727 803 L 796 792\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"706 1412\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 323 724 Q 336 697 337 352 L 385 357 Q 386 418 388 475 L 389 506 Q 390 555 392 600 L 393 628 Q 393 665 396 692 Q 402 711 382 733 L 323 724 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 332 721 L 362 696 L 363 664 L 362 379 L 342 366\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"508 1016\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 641 388 Q 641 655 656 730 Q 659 749 644 760 Q 640 763 636 765 L 561 757 Q 585 702 587 689 Q 590 661 587 380 L 586 339 Q 577 -6 601 -41 Q 607 -48 615 -46 Q 631 -37 638 28 Q 648 125 645 223 Q 642 260 642 341 L 641 388 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 569 749 L 616 724 L 619 690 L 611 -36\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"941 1882\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 392 600 Q 434 594 538 619 Q 538 620 540 620 Q 547 627 543 634 Q 536 644 511 649 Q 510 649 393 628 L 392 600 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 397 607 L 411 617 L 513 631 L 535 629\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"270 540\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 388 475 Q 440 466 553 493 Q 553 494 555 494 Q 562 501 559 509 Q 552 519 526 527 Q 508 530 432 512 Q 411 509 389 506 L 388 475 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 394 483 L 413 492 L 489 503 L 549 504\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"286 572\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 642 341 Q 730 345 838 342 Q 922 339 931 350 Q 937 363 919 380 Q 853 431 786 411 Q 722 402 641 388 L 587 380 Q 544 377 499 370 Q 444 364 385 357 L 337 352 Q 228 342 111 329 Q 86 328 104 307 Q 138 273 183 282 Q 373 331 586 339 L 642 341 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 107 318 L 162 307 L 423 345 L 823 380 L 883 371 L 924 356\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"954 1908\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 387;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.56494140625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 686;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8082682291666666s both;\n          animation-delay: 0.56494140625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 360;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.54296875s both;\n          animation-delay: 1.3732096354166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 479;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6398111979166666s both;\n          animation-delay: 1.9161783854166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1068;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.119140625s both;\n          animation-delay: 2.555989583333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 831;\n            stroke-width: 128;\n          }\n          73% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.92626953125s both;\n          animation-delay: 3.675130208333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 771;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.87744140625s both;\n          animation-delay: 4.601399739583333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 467 814 Q 492 795 517 771 Q 533 759 549 761 Q 561 762 565 776 Q 569 792 557 823 Q 545 851 459 864 Q 443 867 436 863 Q 430 859 433 845 Q 437 835 467 814 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 307 697 Q 270 693 296 674 Q 332 650 412 662 Q 533 683 659 703 Q 720 715 730 723 Q 739 730 735 740 Q 728 753 698 761 Q 670 768 580 740 Q 427 706 307 697 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 343 588 Q 391 506 412 501 Q 425 497 435 514 Q 439 527 434 548 Q 427 567 404 582 Q 370 607 353 613 Q 344 617 341 606 Q 338 597 343 588 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 562 481 Q 580 500 627 570 Q 637 588 658 610 Q 674 620 666 632 Q 657 650 629 672 Q 616 684 598 679 Q 588 675 593 663 Q 600 627 540 504 Q 531 488 529 476 L 562 481 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 529 440 Q 653 453 836 451 Q 870 450 899 451 Q 921 450 927 460 Q 934 473 915 488 Q 846 542 803 520 Q 709 504 562 481 L 529 476 Q 516 476 501 473 Q 323 451 114 428 Q 92 427 108 407 Q 124 391 143 385 Q 167 379 184 384 Q 307 417 445 431 Q 449 432 458 432 L 529 440 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 534 269 Q 619 278 743 278 Q 803 275 811 287 Q 817 299 800 313 Q 740 358 668 336 Q 611 327 536 312 L 475 302 Q 364 289 237 271 Q 215 270 231 251 Q 262 223 314 234 Q 389 255 476 262 L 534 269 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 481 -38 Q 487 -63 494 -73 Q 500 -80 507 -78 Q 520 -69 529 -9 Q 529 9 534 269 L 536 312 Q 536 369 545 410 Q 548 438 530 439 L 529 440 L 458 432 Q 470 392 475 341 Q 475 323 475 302 L 476 262 Q 476 3 481 -38 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 467 814 Q 492 795 517 771 Q 533 759 549 761 Q 561 762 565 776 Q 569 792 557 823 Q 545 851 459 864 Q 443 867 436 863 Q 430 859 433 845 Q 437 835 467 814 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 443 855 L 514 818 L 547 779\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"259 518\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 307 697 Q 270 693 296 674 Q 332 650 412 662 Q 533 683 659 703 Q 720 715 730 723 Q 739 730 735 740 Q 728 753 698 761 Q 670 768 580 740 Q 427 706 307 697 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 299 687 L 339 679 L 382 681 L 676 735 L 723 734\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"558 1116\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 343 588 Q 391 506 412 501 Q 425 497 435 514 Q 439 527 434 548 Q 427 567 404 582 Q 370 607 353 613 Q 344 617 341 606 Q 338 597 343 588 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 352 600 L 402 548 L 416 519\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"232 464\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 562 481 Q 580 500 627 570 Q 637 588 658 610 Q 674 620 666 632 Q 657 650 629 672 Q 616 684 598 679 Q 588 675 593 663 Q 600 627 540 504 Q 531 488 529 476 L 562 481 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 601 669 L 613 660 L 624 624 L 554 495 L 534 482\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"351 702\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 529 440 Q 653 453 836 451 Q 870 450 899 451 Q 921 450 927 460 Q 934 473 915 488 Q 846 542 803 520 Q 709 504 562 481 L 529 476 Q 516 476 501 473 Q 323 451 114 428 Q 92 427 108 407 Q 124 391 143 385 Q 167 379 184 384 Q 307 417 445 431 Q 449 432 458 432 L 529 440 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 111 417 L 166 407 L 423 447 L 831 489 L 914 467\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"940 1880\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 534 269 Q 619 278 743 278 Q 803 275 811 287 Q 817 299 800 313 Q 740 358 668 336 Q 611 327 536 312 L 475 302 Q 364 289 237 271 Q 215 270 231 251 Q 262 223 314 234 Q 389 255 476 262 L 534 269 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 234 261 L 256 255 L 302 255 L 456 281 L 709 311 L 743 309 L 802 293\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"703 1406\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 481 -38 Q 487 -63 494 -73 Q 500 -80 507 -78 Q 520 -69 529 -9 Q 529 9 534 269 L 536 312 Q 536 369 545 410 Q 548 438 530 439 L 529 440 L 458 432 Q 470 392 475 341 Q 475 323 475 302 L 476 262 Q 476 3 481 -38 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 466 427 L 505 397 L 503 -69\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"643 1286\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 901;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.9832356770833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 938;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0133463541666667s both;\n          animation-delay: 0.9832356770833334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 480 396 Q 538 362 589 322 Q 604 307 618 321 Q 634 331 642 358 Q 657 415 597 501 Q 548 558 587 597 Q 627 657 651 671 Q 675 686 663 701 Q 647 723 604 746 Q 579 756 563 743 Q 506 700 428 685 L 446 649 Q 488 656 532 675 Q 550 685 560 674 Q 566 668 558 650 Q 542 613 530 575 Q 514 547 531 525 Q 588 434 571 411 Q 564 401 540 405 Q 510 411 477 411 Q 450 414 480 396 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 428 685 Q 403 704 376 711 Q 366 714 358 704 Q 354 697 363 685 Q 390 625 392 550 Q 404 276 362 133 Q 353 103 359 82 Q 369 43 382 29 Q 395 14 406 30 Q 439 67 439 273 Q 439 603 446 649 L 428 685 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 480 396 Q 538 362 589 322 Q 604 307 618 321 Q 634 331 642 358 Q 657 415 597 501 Q 548 558 587 597 Q 627 657 651 671 Q 675 686 663 701 Q 647 723 604 746 Q 579 756 563 743 Q 506 700 428 685 L 446 649 Q 488 656 532 675 Q 550 685 560 674 Q 566 668 558 650 Q 542 613 530 575 Q 514 547 531 525 Q 588 434 571 411 Q 564 401 540 405 Q 510 411 477 411 Q 450 414 480 396 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 437 682 L 463 672 L 561 707 L 586 707 L 603 693 L 597 668 L 560 599 L 547 560 L 554 524 L 584 480 L 604 433 L 607 406 L 601 378 L 598 373 L 565 376 L 485 405\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"773 1546\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 428 685 Q 403 704 376 711 Q 366 714 358 704 Q 354 697 363 685 Q 390 625 392 550 Q 404 276 362 133 Q 353 103 359 82 Q 369 43 382 29 Q 395 14 406 30 Q 439 67 439 273 Q 439 603 446 649 L 428 685 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 369 699 L 404 665 L 409 653 L 417 569 L 416 287 L 393 100 L 394 35\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"810 1620\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 979;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0467122395833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 783;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.88720703125s both;\n          animation-delay: 1.0467122395833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1218;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.2412109375s both;\n          animation-delay: 1.9339192708333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 697;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.8172200520833334s both;\n          animation-delay: 3.175130208333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 757;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.8660481770833334s both;\n          animation-delay: 3.9923502604166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 458;\n            stroke-width: 128;\n          }\n          60% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.6227213541666666s both;\n          animation-delay: 4.8583984375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 617;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.7521158854166666s both;\n          animation-delay: 5.481119791666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 573 726 Q 639 732 868 732 Q 890 732 895 741 Q 901 754 883 769 Q 820 817 759 797 Q 573 764 170 720 Q 148 717 164 699 Q 179 684 198 678 Q 220 672 238 677 Q 311 696 391 707 L 436 713 Q 455 717 508 721 L 573 726 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 309 538 Q 290 554 266 560 Q 256 561 250 553 Q 246 547 254 536 Q 299 428 266 195 Q 260 164 250 129 Q 241 102 246 82 Q 256 46 268 33 Q 280 18 290 33 Q 299 43 305 62 L 313 104 Q 317 134 323 308 Q 324 462 331 502 L 309 538 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 650 90 Q 680 53 702 18 Q 712 -1 724 -1 Q 742 0 759 38 Q 778 80 773 131 Q 763 252 752 477 Q 751 513 768 537 Q 778 552 768 563 Q 746 585 687 611 Q 666 621 650 610 Q 613 595 568 582 L 530 572 Q 499 566 464 559 Q 463 559 462 558 L 417 551 Q 347 542 309 538 L 331 502 Q 347 503 376 510 Q 395 514 415 517 L 460 525 Q 494 532 529 538 L 565 545 Q 650 563 674 546 Q 713 518 694 133 Q 688 114 673 118 L 650 90 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 391 707 Q 416 682 417 551 L 415 517 Q 412 433 359 310 Q 355 304 354 299 Q 353 290 362 293 Q 392 305 435 407 Q 435 411 437 414 Q 446 444 460 525 L 462 558 Q 463 595 464 653 Q 464 663 466 675 Q 472 688 464 697 Q 454 707 436 713 L 391 707 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 568 582 Q 572 637 588 698 Q 592 713 583 721 Q 579 724 573 726 L 508 721 Q 509 717 515 712 Q 533 691 530 572 L 529 538 Q 528 505 527 469 Q 521 366 567 331 Q 580 318 642 323 Q 673 324 684 340 Q 693 350 686 357 Q 682 361 615 366 Q 552 373 565 545 L 568 582 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 401 228 Q 382 224 405 206 Q 414 199 433 202 Q 527 215 596 224 Q 624 228 613 243 Q 601 259 571 266 Q 543 270 495 257 Q 446 241 401 228 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 305 62 Q 315 61 328 63 Q 431 82 650 90 L 673 118 Q 664 128 648 139 Q 629 151 592 143 Q 438 115 313 104 L 305 62 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 573 726 Q 639 732 868 732 Q 890 732 895 741 Q 901 754 883 769 Q 820 817 759 797 Q 573 764 170 720 Q 148 717 164 699 Q 179 684 198 678 Q 220 672 238 677 Q 311 696 391 707 L 436 713 Q 455 717 508 721 L 573 726 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 168 709 L 220 700 L 431 732 L 797 768 L 846 761 L 883 748\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"851 1702\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 309 538 Q 290 554 266 560 Q 256 561 250 553 Q 246 547 254 536 Q 299 428 266 195 Q 260 164 250 129 Q 241 102 246 82 Q 256 46 268 33 Q 280 18 290 33 Q 299 43 305 62 L 313 104 Q 317 134 323 308 Q 324 462 331 502 L 309 538 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 260 548 L 290 518 L 299 493 L 301 462 L 302 296 L 277 93 L 279 37\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"655 1310\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 650 90 Q 680 53 702 18 Q 712 -1 724 -1 Q 742 0 759 38 Q 778 80 773 131 Q 763 252 752 477 Q 751 513 768 537 Q 778 552 768 563 Q 746 585 687 611 Q 666 621 650 610 Q 613 595 568 582 L 530 572 Q 499 566 464 559 Q 463 559 462 558 L 417 551 Q 347 542 309 538 L 331 502 Q 347 503 376 510 Q 395 514 415 517 L 460 525 Q 494 532 529 538 L 565 545 Q 650 563 674 546 Q 713 518 694 133 Q 688 114 673 118 L 650 90 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 315 534 L 341 523 L 363 525 L 670 583 L 699 569 L 724 545 L 734 133 L 720 82 L 724 15\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1090 2180\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 391 707 Q 416 682 417 551 L 415 517 Q 412 433 359 310 Q 355 304 354 299 Q 353 290 362 293 Q 392 305 435 407 Q 435 411 437 414 Q 446 444 460 525 L 462 558 Q 463 595 464 653 Q 464 663 466 675 Q 472 688 464 697 Q 454 707 436 713 L 391 707 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 399 708 L 436 680 L 438 519 L 415 403 L 378 323 L 362 301\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"569 1138\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 568 582 Q 572 637 588 698 Q 592 713 583 721 Q 579 724 573 726 L 508 721 Q 509 717 515 712 Q 533 691 530 572 L 529 538 Q 528 505 527 469 Q 521 366 567 331 Q 580 318 642 323 Q 673 324 684 340 Q 693 350 686 357 Q 682 361 615 366 Q 552 373 565 545 L 568 582 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 515 719 L 555 694 L 545 457 L 555 389 L 572 360 L 595 346 L 649 343 L 681 351\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"629 1258\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 401 228 Q 382 224 405 206 Q 414 199 433 202 Q 527 215 596 224 Q 624 228 613 243 Q 601 259 571 266 Q 543 270 495 257 Q 446 241 401 228 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 403 217 L 541 242 L 574 243 L 602 236\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"330 660\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 305 62 Q 315 61 328 63 Q 431 82 650 90 L 673 118 Q 664 128 648 139 Q 629 151 592 143 Q 438 115 313 104 L 305 62 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 311 68 L 330 83 L 350 88 L 605 117 L 665 117\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"489 978\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 630;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7626953125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 596;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7350260416666666s both;\n          animation-delay: 0.7626953125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 606;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7431640625s both;\n          animation-delay: 1.4977213541666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1070;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.1207682291666667s both;\n          animation-delay: 2.2408854166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 660;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.787109375s both;\n          animation-delay: 3.361653645833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1011;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 1.07275390625s both;\n          animation-delay: 4.148763020833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 421;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 0.5926106770833334s both;\n          animation-delay: 5.221516927083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 435;\n            stroke-width: 128;\n          }\n          59% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.60400390625s both;\n          animation-delay: 5.814127604166666s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 539 701 Q 701 734 706 737 Q 715 744 710 752 Q 704 764 676 772 Q 648 779 618 769 Q 581 759 543 748 L 481 735 Q 415 725 343 719 Q 307 715 332 698 Q 368 671 425 683 Q 453 687 484 692 L 539 701 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 533 593 Q 567 602 672 614 Q 681 613 689 624 Q 690 634 670 644 Q 642 665 540 633 Q 537 633 535 632 L 486 621 Q 441 615 348 602 Q 323 598 342 583 Q 373 562 408 569 Q 442 578 487 584 L 533 593 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 528 506 Q 531 551 533 593 L 535 632 Q 536 668 539 701 L 543 748 Q 544 763 547 773 Q 551 789 554 800 Q 558 810 538 825 Q 504 843 480 847 Q 464 850 456 841 Q 449 834 457 819 Q 478 791 479 772 Q 480 754 481 735 L 484 692 Q 485 658 486 621 L 487 584 Q 487 544 487 500 L 528 506 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 487 500 Q 367 487 306 475 Q 236 462 129 458 Q 116 458 115 447 Q 115 435 133 421 Q 178 394 209 405 Q 240 418 402 449 Q 456 459 517 466 Q 572 472 624 479 Q 780 500 911 488 Q 933 487 940 495 Q 947 508 935 519 Q 869 576 806 554 Q 745 541 681 529 Q 587 516 528 506 L 487 500 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 391 177 Q 392 217 397 247 L 400 274 Q 404 328 408 346 Q 408 350 408 353 L 396 381 Q 378 399 347 399 Q 334 395 339 383 Q 381 289 330 109 Q 297 40 328 -2 Q 334 -15 344 -10 Q 377 11 387 121 Q 388 137 389 151 L 391 177 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 408 353 Q 420 354 437 359 Q 570 387 592 377 Q 605 373 609 346 Q 625 184 620 58 Q 619 33 605 27 Q 593 23 534 38 Q 521 41 522 32 Q 523 25 539 15 Q 576 -16 605 -50 Q 621 -66 638 -65 Q 654 -61 672 -15 Q 696 31 691 79 Q 681 193 670 296 Q 666 338 682 371 Q 695 387 679 402 Q 660 418 620 431 Q 598 441 579 429 Q 560 422 525 410 Q 438 389 396 381 L 408 353 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 397 247 Q 418 241 541 261 Q 542 262 547 262 Q 568 266 571 269 Q 578 276 574 283 Q 568 292 545 298 Q 532 301 448 281 Q 426 277 400 274 L 397 247 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 389 151 Q 419 147 505 155 Q 527 159 551 162 Q 575 166 578 169 Q 585 176 582 182 Q 576 192 553 199 Q 529 205 505 196 Q 480 189 451 184 Q 423 180 391 177 L 389 151 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 539 701 Q 701 734 706 737 Q 715 744 710 752 Q 704 764 676 772 Q 648 779 618 769 Q 581 759 543 748 L 481 735 Q 415 725 343 719 Q 307 715 332 698 Q 368 671 425 683 Q 453 687 484 692 L 539 701 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 334 710 L 358 702 L 397 701 L 549 724 L 632 747 L 678 751 L 701 746\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"502 1004\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 533 593 Q 567 602 672 614 Q 681 613 689 624 Q 690 634 670 644 Q 642 665 540 633 Q 537 633 535 632 L 486 621 Q 441 615 348 602 Q 323 598 342 583 Q 373 562 408 569 Q 442 578 487 584 L 533 593 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 344 593 L 388 587 L 625 631 L 679 626\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"468 936\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 528 506 Q 531 551 533 593 L 535 632 Q 536 668 539 701 L 543 748 Q 544 763 547 773 Q 551 789 554 800 Q 558 810 538 825 Q 504 843 480 847 Q 464 850 456 841 Q 449 834 457 819 Q 478 791 479 772 Q 480 754 481 735 L 484 692 Q 485 658 486 621 L 487 584 Q 487 544 487 500 L 528 506 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 469 831 L 502 808 L 514 789 L 509 530 L 493 507\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"478 956\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 487 500 Q 367 487 306 475 Q 236 462 129 458 Q 116 458 115 447 Q 115 435 133 421 Q 178 394 209 405 Q 240 418 402 449 Q 456 459 517 466 Q 572 472 624 479 Q 780 500 911 488 Q 933 487 940 495 Q 947 508 935 519 Q 869 576 806 554 Q 745 541 681 529 Q 587 516 528 506 L 487 500 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 127 446 L 152 436 L 196 432 L 424 474 L 822 525 L 873 522 L 929 504\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"942 1884\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 391 177 Q 392 217 397 247 L 400 274 Q 404 328 408 346 Q 408 350 408 353 L 396 381 Q 378 399 347 399 Q 334 395 339 383 Q 381 289 330 109 Q 297 40 328 -2 Q 334 -15 344 -10 Q 377 11 387 121 Q 388 137 389 151 L 391 177 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 348 388 L 370 370 L 380 347 L 380 286 L 365 145 L 339 0\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"532 1064\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 408 353 Q 420 354 437 359 Q 570 387 592 377 Q 605 373 609 346 Q 625 184 620 58 Q 619 33 605 27 Q 593 23 534 38 Q 521 41 522 32 Q 523 25 539 15 Q 576 -16 605 -50 Q 621 -66 638 -65 Q 654 -61 672 -15 Q 696 31 691 79 Q 681 193 670 296 Q 666 338 682 371 Q 695 387 679 402 Q 660 418 620 431 Q 598 441 579 429 Q 560 422 525 410 Q 438 389 396 381 L 408 353 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 402 375 L 417 370 L 447 374 L 600 406 L 642 378 L 642 290 L 656 84 L 652 32 L 628 -10 L 599 -3 L 530 31\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"883 1766\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 397 247 Q 418 241 541 261 Q 542 262 547 262 Q 568 266 571 269 Q 578 276 574 283 Q 568 292 545 298 Q 532 301 448 281 Q 426 277 400 274 L 397 247 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 401 253 L 421 262 L 517 277 L 563 278\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"293 586\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 389 151 Q 419 147 505 155 Q 527 159 551 162 Q 575 166 578 169 Q 585 176 582 182 Q 576 192 553 199 Q 529 205 505 196 Q 480 189 451 184 Q 423 180 391 177 L 389 151 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 394 157 L 535 181 L 571 178\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"307 614\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 483;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.64306640625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 710;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8277994791666666s both;\n          animation-delay: 0.64306640625s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 781;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8855794270833334s both;\n          animation-delay: 1.4708658854166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 425;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5958658854166666s both;\n          animation-delay: 2.3564453125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 494;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6520182291666666s both;\n          animation-delay: 2.9523111979166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 502;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.6585286458333334s both;\n          animation-delay: 3.604329427083333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1271;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 1.2843424479166667s both;\n          animation-delay: 4.262858072916666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes7 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 428;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-7 {\n          animation: keyframes7 0.5983072916666666s both;\n          animation-delay: 5.547200520833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes8 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 358;\n            stroke-width: 128;\n          }\n          54% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-8 {\n          animation: keyframes8 0.5413411458333334s both;\n          animation-delay: 6.1455078125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes9 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 345;\n            stroke-width: 128;\n          }\n          53% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-9 {\n          animation: keyframes9 0.53076171875s both;\n          animation-delay: 6.686848958333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes10 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 386;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-10 {\n          animation: keyframes10 0.5641276041666666s both;\n          animation-delay: 7.217610677083333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 416 688 Q 450 716 472 735 Q 536 795 554 805 Q 575 818 561 835 Q 545 851 516 863 Q 489 873 476 869 Q 463 866 469 852 Q 478 828 433 756 Q 388 687 386 681 L 416 688 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 361 402 Q 361 427 362 459 L 362 483 Q 362 493 363 502 Q 364 536 366 560 L 368 587 Q 371 627 380 643 L 362 676 Q 311 701 308 702 Q 296 701 293 692 Q 292 682 300 675 Q 319 645 323 543 Q 327 336 306 295 Q 303 288 306 282 Q 307 272 321 262 Q 336 249 343 248 L 362 370 Q 362 373 362 375 L 361 402 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 594 504 Q 598 497 608 496 Q 629 499 669 569 Q 690 623 731 652 Q 753 668 736 686 Q 718 705 667 737 Q 651 749 576 729 Q 539 729 421 690 Q 418 690 416 688 L 386 681 Q 371 680 362 676 L 380 643 Q 387 643 393 645 Q 454 670 596 700 Q 621 704 631 700 Q 638 694 632 669 Q 605 572 595 553 Q 592 549 590 542 L 594 504 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 366 560 Q 381 557 479 576 Q 495 580 516 585 Q 537 589 540 593 Q 547 600 543 607 Q 536 616 513 621 Q 501 624 415 598 Q 393 592 368 587 L 366 560 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 362 459 Q 375 456 394 460 Q 505 487 594 504 L 590 542 Q 575 543 362 483 L 362 459 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 362 375 Q 390 368 458 376 Q 515 389 578 402 Q 611 409 615 414 Q 622 421 619 429 Q 612 439 586 446 Q 567 450 470 421 Q 386 406 361 402 L 362 375 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 343 248 Q 460 300 684 325 Q 765 335 791 322 Q 804 312 803 291 Q 804 278 787 159 Q 772 87 756 61 Q 747 36 721 37 Q 690 47 659 55 Q 640 62 636 57 Q 633 51 649 38 Q 718 -41 723 -66 Q 727 -76 738 -78 Q 757 -81 793 -45 Q 827 -9 837 35 Q 882 290 903 306 Q 913 313 912 322 Q 913 331 875 358 Q 827 388 800 379 Q 794 379 789 376 Q 768 372 741 370 Q 588 363 415 316 Q 363 295 362 370 L 343 248 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 213 198 Q 204 149 187 101 Q 174 58 207 23 Q 222 5 242 27 Q 282 81 262 139 Q 258 179 240 206 Q 231 213 225 213 Q 215 209 213 198 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 334 176 Q 353 119 375 97 Q 387 90 400 98 Q 410 107 413 122 Q 413 170 359 203 L 357 205 Q 345 215 336 214 Q 330 215 328 204 Q 325 194 334 176 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 459 217 Q 492 147 517 141 Q 530 137 539 153 Q 543 165 538 186 Q 532 202 512 215 Q 482 236 468 241 Q 461 245 457 234 Q 454 227 459 217 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 606 222 Q 625 197 644 168 Q 654 152 671 150 Q 681 149 689 161 Q 696 174 693 206 Q 692 225 665 242 Q 604 278 588 275 Q 582 272 582 259 Q 583 247 606 222 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 416 688 Q 450 716 472 735 Q 536 795 554 805 Q 575 818 561 835 Q 545 851 516 863 Q 489 873 476 869 Q 463 866 469 852 Q 478 828 433 756 Q 388 687 386 681 L 416 688 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 477 859 L 509 822 L 465 760 L 394 686\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"355 710\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 361 402 Q 361 427 362 459 L 362 483 Q 362 493 363 502 Q 364 536 366 560 L 368 587 Q 371 627 380 643 L 362 676 Q 311 701 308 702 Q 296 701 293 692 Q 292 682 300 675 Q 319 645 323 543 Q 327 336 306 295 Q 303 288 306 282 Q 307 272 321 262 Q 336 249 343 248 L 362 370 Q 362 373 362 375 L 361 402 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 306 691 L 339 657 L 345 641 L 342 381 L 327 285 L 341 256\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"582 1164\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 594 504 Q 598 497 608 496 Q 629 499 669 569 Q 690 623 731 652 Q 753 668 736 686 Q 718 705 667 737 Q 651 749 576 729 Q 539 729 421 690 Q 418 690 416 688 L 386 681 Q 371 680 362 676 L 380 643 Q 387 643 393 645 Q 454 670 596 700 Q 621 704 631 700 Q 638 694 632 669 Q 605 572 595 553 Q 592 549 590 542 L 594 504 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 369 673 L 391 663 L 479 692 L 583 712 L 591 718 L 631 721 L 653 715 L 680 671 L 607 509\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"653 1306\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 366 560 Q 381 557 479 576 Q 495 580 516 585 Q 537 589 540 593 Q 547 600 543 607 Q 536 616 513 621 Q 501 624 415 598 Q 393 592 368 587 L 366 560 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 369 567 L 431 587 L 510 603 L 533 602\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"297 594\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 362 459 Q 375 456 394 460 Q 505 487 594 504 L 590 542 Q 575 543 362 483 L 362 459 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 368 465 L 379 476 L 399 476 L 406 482 L 567 518 L 589 535\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"366 732\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 362 375 Q 390 368 458 376 Q 515 389 578 402 Q 611 409 615 414 Q 622 421 619 429 Q 612 439 586 446 Q 567 450 470 421 Q 386 406 361 402 L 362 375 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 366 395 L 388 389 L 429 392 L 545 419 L 608 424\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"374 748\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 343 248 Q 460 300 684 325 Q 765 335 791 322 Q 804 312 803 291 Q 804 278 787 159 Q 772 87 756 61 Q 747 36 721 37 Q 690 47 659 55 Q 640 62 636 57 Q 633 51 649 38 Q 718 -41 723 -66 Q 727 -76 738 -78 Q 757 -81 793 -45 Q 827 -9 837 35 Q 882 290 903 306 Q 913 313 912 322 Q 913 331 875 358 Q 827 388 800 379 Q 794 379 789 376 Q 768 372 741 370 Q 588 363 415 316 Q 363 295 362 370 L 343 248 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 366 334 L 364 315 L 376 289 L 571 331 L 706 348 L 811 348 L 844 324 L 850 309 L 824 154 L 808 82 L 784 20 L 754 -10 L 706 12 L 641 54\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"1143 2286\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-7\">\n        <path d=\"M 213 198 Q 204 149 187 101 Q 174 58 207 23 Q 222 5 242 27 Q 282 81 262 139 Q 258 179 240 206 Q 231 213 225 213 Q 215 209 213 198 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-7)\" d=\"M 226 203 L 232 156 L 222 32\" fill=\"none\" id=\"make-me-a-hanzi-animation-7\" stroke-dasharray=\"300 600\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-8\">\n        <path d=\"M 334 176 Q 353 119 375 97 Q 387 90 400 98 Q 410 107 413 122 Q 413 170 359 203 L 357 205 Q 345 215 336 214 Q 330 215 328 204 Q 325 194 334 176 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-8)\" d=\"M 339 203 L 380 142 L 386 114\" fill=\"none\" id=\"make-me-a-hanzi-animation-8\" stroke-dasharray=\"230 460\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-9\">\n        <path d=\"M 459 217 Q 492 147 517 141 Q 530 137 539 153 Q 543 165 538 186 Q 532 202 512 215 Q 482 236 468 241 Q 461 245 457 234 Q 454 227 459 217 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-9)\" d=\"M 468 229 L 503 191 L 522 159\" fill=\"none\" id=\"make-me-a-hanzi-animation-9\" stroke-dasharray=\"217 434\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-10\">\n        <path d=\"M 606 222 Q 625 197 644 168 Q 654 152 671 150 Q 681 149 689 161 Q 696 174 693 206 Q 692 225 665 242 Q 604 278 588 275 Q 582 272 582 259 Q 583 247 606 222 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-10)\" d=\"M 591 268 L 654 212 L 671 170\" fill=\"none\" id=\"make-me-a-hanzi-animation-10\" stroke-dasharray=\"258 516\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 730;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8440755208333334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 579;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.72119140625s both;\n          animation-delay: 0.8440755208333334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1485;\n            stroke-width: 128;\n          }\n          83% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.45849609375s both;\n          animation-delay: 1.5652669270833335s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 675 625 Q 706 700 744 726 Q 763 745 747 766 Q 729 782 671 811 Q 652 820 627 811 Q 524 768 371 748 Q 352 747 354 736 Q 357 726 378 720 Q 406 707 446 721 Q 531 737 611 753 Q 633 757 641 749 Q 653 734 620 633 L 675 625 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 379 534 Q 448 558 687 589 Q 700 590 700 601 Q 700 608 675 625 L 620 633 Q 616 633 612 631 Q 482 594 376 574 L 379 534 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 320 336 Q 413 388 642 408 Q 669 411 679 401 Q 698 379 688 335 Q 672 244 627 119 Q 617 94 595 80 Q 577 74 479 107 Q 460 116 459 106 Q 458 96 479 78 Q 531 29 553 -13 Q 572 -47 601 -28 Q 661 11 686 62 Q 702 107 746 310 Q 755 359 778 379 Q 794 395 787 407 Q 775 420 723 449 Q 696 464 614 445 Q 437 417 358 396 Q 336 395 341 408 Q 362 495 379 534 L 376 574 Q 363 589 348 596 Q 323 606 314 603 Q 304 597 310 583 Q 331 541 297 437 Q 290 421 261 392 Q 249 377 258 364 Q 268 351 289 334 Q 301 324 320 336 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 675 625 Q 706 700 744 726 Q 763 745 747 766 Q 729 782 671 811 Q 652 820 627 811 Q 524 768 371 748 Q 352 747 354 736 Q 357 726 378 720 Q 406 707 446 721 Q 531 737 611 753 Q 633 757 641 749 Q 653 734 620 633 L 675 625 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 364 737 L 409 733 L 631 783 L 655 781 L 692 745 L 657 657 L 629 643\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"602 1204\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 379 534 Q 448 558 687 589 Q 700 590 700 601 Q 700 608 675 625 L 620 633 Q 616 633 612 631 Q 482 594 376 574 L 379 534 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 381 541 L 396 559 L 594 602 L 665 607 L 690 600\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"451 902\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 320 336 Q 413 388 642 408 Q 669 411 679 401 Q 698 379 688 335 Q 672 244 627 119 Q 617 94 595 80 Q 577 74 479 107 Q 460 116 459 106 Q 458 96 479 78 Q 531 29 553 -13 Q 572 -47 601 -28 Q 661 11 686 62 Q 702 107 746 310 Q 755 359 778 379 Q 794 395 787 407 Q 775 420 723 449 Q 696 464 614 445 Q 437 417 358 396 Q 336 395 341 408 Q 362 495 379 534 L 376 574 Q 363 589 348 596 Q 323 606 314 603 Q 304 597 310 583 Q 331 541 297 437 Q 290 421 261 392 Q 249 377 258 364 Q 268 351 289 334 Q 301 324 320 336 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 319 593 L 345 565 L 349 540 L 306 377 L 359 375 L 480 405 L 650 431 L 683 430 L 702 423 L 732 393 L 674 147 L 652 84 L 634 57 L 590 27 L 466 104\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1357 2714\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1369;\n            stroke-width: 128;\n          }\n          82% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.3640950520833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 596;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.7350260416666666s both;\n          animation-delay: 1.3640950520833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 440 550 Q 268 249 204 207 Q 147 174 163 120 Q 173 90 190 89 Q 197 90 219 104 Q 336 173 638 205 Q 675 209 735 210 L 716 240 Q 515 240 306 198 Q 258 189 286 224 Q 316 276 403 396 Q 536 583 565 605 Q 575 615 582 624 Q 586 640 562 660 Q 516 693 483 695 Q 465 695 457 687 Q 453 678 464 667 Q 471 655 475 633 Q 474 611 440 550 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 735 210 Q 760 170 787 123 Q 799 98 814 89 Q 823 85 834 94 Q 850 106 847 155 Q 848 230 640 401 Q 633 408 626 396 Q 622 381 631 368 Q 671 311 716 240 L 735 210 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 440 550 Q 268 249 204 207 Q 147 174 163 120 Q 173 90 190 89 Q 197 90 219 104 Q 336 173 638 205 Q 675 209 735 210 L 716 240 Q 515 240 306 198 Q 258 189 286 224 Q 316 276 403 396 Q 536 583 565 605 Q 575 615 582 624 Q 586 640 562 660 Q 516 693 483 695 Q 465 695 457 687 Q 453 678 464 667 Q 471 655 475 633 Q 474 611 440 550 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 467 682 L 502 659 L 521 627 L 393 420 L 253 218 L 240 171 L 275 165 L 476 205 L 616 221 L 707 225 L 727 212\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1241 2482\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 735 210 Q 760 170 787 123 Q 799 98 814 89 Q 823 85 834 94 Q 850 106 847 155 Q 848 230 640 401 Q 633 408 626 396 Q 622 381 631 368 Q 671 311 716 240 L 735 210 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 637 388 L 782 209 L 810 157 L 820 107\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"468 936\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 421;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.5926106770833334s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 781;\n            stroke-width: 128;\n          }\n          72% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.8855794270833334s both;\n          animation-delay: 0.5926106770833334s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 625;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.7586263020833334s both;\n          animation-delay: 1.4781901041666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1008;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.0703125s both;\n          animation-delay: 2.23681640625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 496 784 Q 529 760 563 730 Q 579 717 599 718 Q 612 719 616 736 Q 620 755 607 789 Q 592 825 486 840 Q 467 844 460 840 Q 454 834 457 819 Q 463 806 496 784 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 713 451 Q 750 547 786 568 Q 808 590 790 612 Q 700 682 639 652 Q 543 613 382 583 L 389 547 Q 404 548 419 554 Q 528 579 633 604 Q 661 611 672 601 Q 682 591 678 568 Q 663 505 645 455 L 713 451 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 367 364 Q 368 364 371 363 Q 383 359 398 363 Q 501 388 726 413 Q 739 414 740 425 Q 740 432 713 451 L 645 455 Q 492 418 371 399 L 367 364 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 382 583 Q 381 586 376 588 Q 324 616 306 615 Q 284 612 301 587 Q 331 529 305 323 Q 295 238 248 140 Q 215 71 110 -26 Q 94 -39 89 -46 Q 88 -53 100 -54 Q 148 -54 229 27 Q 278 76 307 133 Q 335 193 352 277 Q 359 317 367 364 L 371 399 Q 378 454 383 519 Q 387 535 389 547 L 382 583 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 496 784 Q 529 760 563 730 Q 579 717 599 718 Q 612 719 616 736 Q 620 755 607 789 Q 592 825 486 840 Q 467 844 460 840 Q 454 834 457 819 Q 463 806 496 784 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 467 832 L 479 821 L 563 781 L 597 737\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"293 586\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 713 451 Q 750 547 786 568 Q 808 590 790 612 Q 700 682 639 652 Q 543 613 382 583 L 389 547 Q 404 548 419 554 Q 528 579 633 604 Q 661 611 672 601 Q 682 591 678 568 Q 663 505 645 455 L 713 451 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 392 579 L 406 568 L 642 629 L 673 633 L 693 627 L 731 590 L 691 486 L 652 460\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"653 1306\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 367 364 Q 368 364 371 363 Q 383 359 398 363 Q 501 388 726 413 Q 739 414 740 425 Q 740 432 713 451 L 645 455 Q 492 418 371 399 L 367 364 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 371 370 L 408 386 L 642 429 L 705 432 L 731 424\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"497 994\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 382 583 Q 381 586 376 588 Q 324 616 306 615 Q 284 612 301 587 Q 331 529 305 323 Q 295 238 248 140 Q 215 71 110 -26 Q 94 -39 89 -46 Q 88 -53 100 -54 Q 148 -54 229 27 Q 278 76 307 133 Q 335 193 352 277 Q 359 317 367 364 L 371 399 Q 378 454 383 519 Q 387 535 389 547 L 382 583 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 307 600 L 325 589 L 348 562 L 351 534 L 332 316 L 304 200 L 267 116 L 227 60 L 152 -14 L 97 -46\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"880 1760\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1153;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.1883138020833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 391;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.5681966145833334s both;\n          animation-delay: 1.1883138020833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 576;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.71875s both;\n          animation-delay: 1.7565104166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1300;\n            stroke-width: 128;\n          }\n          81% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 1.3079427083333333s both;\n          animation-delay: 2.4752604166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 380;\n            stroke-width: 128;\n          }\n          55% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.5592447916666666s both;\n          animation-delay: 3.783203125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 561;\n            stroke-width: 128;\n          }\n          65% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.70654296875s both;\n          animation-delay: 4.342447916666667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 345 149 Q 317 156 287 163 Q 268 169 269 159 Q 327 113 362 78 Q 375 59 389 55 Q 398 51 406 61 Q 445 112 443 159 Q 436 321 439 582 Q 438 637 452 662 Q 464 680 452 690 Q 433 708 397 722 Q 381 729 365 723 Q 308 690 215 683 Q 200 682 209 674 Q 216 664 230 658 Q 251 654 355 679 Q 374 683 379 674 Q 391 643 389 381 Q 383 170 369 150 Q 365 144 345 149 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 215 532 Q 245 510 276 484 Q 289 474 303 475 Q 313 476 317 488 Q 321 501 310 529 Q 298 559 208 575 Q 193 578 188 575 Q 184 571 186 559 Q 190 549 215 532 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 100 260 Q 88 254 90 243 Q 91 230 104 225 Q 132 218 171 211 Q 181 211 191 224 Q 213 261 329 376 Q 345 392 356 409 Q 366 421 363 430 Q 356 434 345 427 Q 143 273 100 260 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 712 108 Q 678 115 645 123 Q 623 129 624 119 Q 694 65 733 25 Q 748 4 765 -1 Q 775 -5 784 6 Q 829 61 827 120 Q 817 307 819 613 Q 818 677 832 704 Q 845 726 832 737 Q 808 756 768 773 Q 749 780 731 773 Q 668 734 558 718 Q 540 717 551 707 Q 561 695 577 690 Q 595 687 690 712 Q 741 727 749 719 Q 764 671 762 377 Q 756 130 741 109 Q 735 102 712 108 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 551 557 Q 573 538 598 514 Q 611 502 626 503 Q 636 504 641 516 Q 645 531 636 559 Q 626 586 545 603 Q 530 606 524 603 Q 520 599 521 587 Q 525 577 551 557 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 480 298 Q 468 291 470 281 Q 473 268 484 264 Q 512 257 548 251 Q 558 252 567 264 Q 588 300 695 410 Q 711 426 720 442 Q 730 452 727 462 Q 720 465 620 390 Q 509 308 480 298 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 345 149 Q 317 156 287 163 Q 268 169 269 159 Q 327 113 362 78 Q 375 59 389 55 Q 398 51 406 61 Q 445 112 443 159 Q 436 321 439 582 Q 438 637 452 662 Q 464 680 452 690 Q 433 708 397 722 Q 381 729 365 723 Q 308 690 215 683 Q 200 682 209 674 Q 216 664 230 658 Q 251 654 355 679 Q 374 683 379 674 Q 391 643 389 381 Q 383 170 369 150 Q 365 144 345 149 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 218 674 L 262 674 L 380 702 L 396 695 L 417 672 L 414 330 L 406 144 L 399 125 L 386 112 L 355 120 L 279 157\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"1025 2050\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 215 532 Q 245 510 276 484 Q 289 474 303 475 Q 313 476 317 488 Q 321 501 310 529 Q 298 559 208 575 Q 193 578 188 575 Q 184 571 186 559 Q 190 549 215 532 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 193 569 L 266 530 L 301 491\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"263 526\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 100 260 Q 88 254 90 243 Q 91 230 104 225 Q 132 218 171 211 Q 181 211 191 224 Q 213 261 329 376 Q 345 392 356 409 Q 366 421 363 430 Q 356 434 345 427 Q 143 273 100 260 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 105 246 L 163 251 L 358 425\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"448 896\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 712 108 Q 678 115 645 123 Q 623 129 624 119 Q 694 65 733 25 Q 748 4 765 -1 Q 775 -5 784 6 Q 829 61 827 120 Q 817 307 819 613 Q 818 677 832 704 Q 845 726 832 737 Q 808 756 768 773 Q 749 780 731 773 Q 668 734 558 718 Q 540 717 551 707 Q 561 695 577 690 Q 595 687 690 712 Q 741 727 749 719 Q 764 671 762 377 Q 756 130 741 109 Q 735 102 712 108 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 562 708 L 594 707 L 654 720 L 744 749 L 777 735 L 792 712 L 790 231 L 784 101 L 763 64 L 731 72 L 634 116\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"1172 2344\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 551 557 Q 573 538 598 514 Q 611 502 626 503 Q 636 504 641 516 Q 645 531 636 559 Q 626 586 545 603 Q 530 606 524 603 Q 520 599 521 587 Q 525 577 551 557 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 529 597 L 603 552 L 623 521\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"252 504\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 480 298 Q 468 291 470 281 Q 473 268 484 264 Q 512 257 548 251 Q 558 252 567 264 Q 588 300 695 410 Q 711 426 720 442 Q 730 452 727 462 Q 720 465 620 390 Q 509 308 480 298 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 486 283 L 540 289 L 726 457\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"433 866\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 494;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.6520182291666666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1009;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0711263020833333s both;\n          animation-delay: 0.6520182291666666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1266;\n            stroke-width: 128;\n          }\n          80% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 1.2802734375s both;\n          animation-delay: 1.72314453125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 353;\n            stroke-width: 128;\n          }\n          53% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.5372721354166666s both;\n          animation-delay: 3.00341796875s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1085;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 1.1329752604166667s both;\n          animation-delay: 3.5406901041666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 386;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.5641276041666666s both;\n          animation-delay: 4.673665364583333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 419 643 Q 548 781 565 792 Q 584 805 570 821 Q 554 836 524 845 Q 499 854 486 849 Q 473 845 480 832 Q 489 805 418 682 Q 409 667 400 650 L 419 643 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 400 650 Q 363 666 351 664 Q 330 660 347 638 Q 378 584 367 389 L 364 354 Q 342 150 187 8 Q 174 -5 170 -12 Q 169 -19 180 -18 Q 219 -18 301 70 Q 392 179 413 359 L 417 393 Q 424 475 426 581 Q 430 600 431 613 L 419 643 L 400 650 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 431 613 L 584 642 Q 606 646 612 634 Q 619 615 623 583 Q 627 495 632 416 L 633 374 Q 642 88 625 53 Q 619 46 597 51 Q 563 57 528 64 Q 506 68 509 59 Q 579 10 620 -27 Q 635 -46 651 -51 Q 661 -55 670 -44 Q 709 13 706 67 Q 696 194 687 375 L 685 423 Q 684 478 682 536 Q 679 597 694 624 Q 707 646 694 656 Q 672 675 632 691 Q 613 698 596 691 Q 523 655 419 643 L 431 613 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 470 527 Q 524 458 546 454 Q 559 453 565 469 Q 566 481 559 500 Q 541 531 476 551 Q 467 552 466 542 Q 465 535 470 527 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 413 359 Q 497 372 633 374 L 687 375 Q 795 378 918 371 Q 940 370 946 380 Q 953 393 935 409 Q 871 457 800 440 Q 748 434 685 423 L 632 416 Q 575 412 512 403 Q 466 399 417 393 L 367 389 Q 246 380 115 368 Q 91 367 108 347 Q 123 331 143 324 Q 165 317 184 322 Q 269 343 364 354 L 413 359 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 480 272 Q 504 248 528 219 Q 538 206 554 206 Q 564 205 569 217 Q 575 230 569 258 Q 562 288 480 316 Q 467 320 460 319 Q 456 315 455 304 Q 458 294 480 272 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 419 643 Q 548 781 565 792 Q 584 805 570 821 Q 554 836 524 845 Q 499 854 486 849 Q 473 845 480 832 Q 489 805 418 682 Q 409 667 400 650 L 419 643 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 487 839 L 519 805 L 422 659 L 407 654\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"366 732\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 400 650 Q 363 666 351 664 Q 330 660 347 638 Q 378 584 367 389 L 364 354 Q 342 150 187 8 Q 174 -5 170 -12 Q 169 -19 180 -18 Q 219 -18 301 70 Q 392 179 413 359 L 417 393 Q 424 475 426 581 Q 430 600 431 613 L 419 643 L 400 650 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 352 651 L 370 640 L 395 608 L 395 430 L 387 336 L 374 271 L 326 146 L 289 89 L 238 32 L 177 -11\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"881 1762\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 431 613 L 584 642 Q 606 646 612 634 Q 619 615 623 583 Q 627 495 632 416 L 633 374 Q 642 88 625 53 Q 619 46 597 51 Q 563 57 528 64 Q 506 68 509 59 Q 579 10 620 -27 Q 635 -46 651 -51 Q 661 -55 670 -44 Q 709 13 706 67 Q 696 194 687 375 L 685 423 Q 684 478 682 536 Q 679 597 694 624 Q 707 646 694 656 Q 672 675 632 691 Q 613 698 596 691 Q 523 655 419 643 L 431 613 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 428 641 L 436 632 L 451 631 L 608 668 L 640 652 L 654 635 L 652 561 L 667 198 L 666 48 L 646 12 L 614 18 L 519 57\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"1138 2276\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 470 527 Q 524 458 546 454 Q 559 453 565 469 Q 566 481 559 500 Q 541 531 476 551 Q 467 552 466 542 Q 465 535 470 527 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 479 537 L 525 501 L 548 470\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"225 450\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 413 359 Q 497 372 633 374 L 687 375 Q 795 378 918 371 Q 940 370 946 380 Q 953 393 935 409 Q 871 457 800 440 Q 748 434 685 423 L 632 416 Q 575 412 512 403 Q 466 399 417 393 L 367 389 Q 246 380 115 368 Q 91 367 108 347 Q 123 331 143 324 Q 165 317 184 322 Q 269 343 364 354 L 413 359 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 111 358 L 165 346 L 475 384 L 826 410 L 874 406 L 933 388\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"957 1914\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 480 272 Q 504 248 528 219 Q 538 206 554 206 Q 564 205 569 217 Q 575 230 569 258 Q 562 288 480 316 Q 467 320 460 319 Q 456 315 455 304 Q 458 294 480 272 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 464 309 L 527 264 L 555 220\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"258 516\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 617;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7521158854166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1071;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.12158203125s both;\n          animation-delay: 0.7521158854166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 487;\n            stroke-width: 128;\n          }\n          61% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6463216145833334s both;\n          animation-delay: 1.8736979166666665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 518;\n            stroke-width: 128;\n          }\n          63% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6715494791666666s both;\n          animation-delay: 2.52001953125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 864;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.953125s both;\n          animation-delay: 3.1915690104166665s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 626;\n            stroke-width: 128;\n          }\n          67% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.7594401041666666s both;\n          animation-delay: 4.144694010416666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1090;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 1.1370442708333333s both;\n          animation-delay: 4.904134114583333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 285 715 Q 266 724 245 727 Q 238 730 233 723 Q 226 716 236 706 Q 287 640 307 467 Q 314 407 355 377 Q 356 377 359 375 Q 377 372 377 401 L 372 437 Q 368 456 360 477 Q 333 618 325 678 L 285 715 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 628 430 Q 646 399 664 388 Q 674 378 694 402 Q 716 436 768 626 Q 781 662 809 689 Q 825 702 812 719 Q 796 740 748 772 Q 726 785 706 778 Q 663 768 604 761 Q 528 751 430 736 Q 351 723 285 715 L 325 678 Q 377 693 453 703 L 507 711 Q 568 721 644 729 Q 690 735 703 718 Q 719 696 715 675 Q 664 477 643 461 L 628 430 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 396 570 Q 378 566 400 550 Q 407 546 479 553 L 533 561 Q 579 568 621 574 Q 646 578 637 592 Q 627 608 599 613 Q 575 616 535 606 L 479 591 Q 436 581 396 570 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 530 422 Q 573 426 628 430 L 643 461 Q 618 486 531 464 L 478 453 Q 421 444 372 437 L 377 401 Q 383 401 390 402 Q 423 409 478 416 L 530 422 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 523 119 Q 524 183 526 242 L 527 293 Q 528 360 530 422 L 531 464 Q 532 515 533 561 L 535 606 Q 538 682 536 687 Q 523 700 507 711 L 453 703 Q 477 651 479 609 Q 479 600 479 591 L 479 553 Q 479 517 478 453 L 478 416 Q 477 359 475 282 L 474 234 Q 473 179 472 113 L 523 119 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 526 242 Q 691 273 697 277 Q 707 286 703 295 Q 696 308 665 317 Q 632 324 599 314 Q 563 304 527 293 L 475 282 Q 411 272 336 267 Q 296 263 324 243 Q 369 216 443 230 Q 456 233 474 234 L 526 242 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 472 113 Q 309 97 121 79 Q 94 78 113 55 Q 131 37 152 30 Q 179 23 199 28 Q 503 101 919 80 Q 920 81 923 80 Q 948 79 955 90 Q 962 105 942 122 Q 873 179 798 158 Q 690 140 523 119 L 472 113 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 285 715 Q 266 724 245 727 Q 238 730 233 723 Q 226 716 236 706 Q 287 640 307 467 Q 314 407 355 377 Q 356 377 359 375 Q 377 372 377 401 L 372 437 Q 368 456 360 477 Q 333 618 325 678 L 285 715 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 241 716 L 270 697 L 295 663 L 336 461 L 362 387\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"489 978\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 628 430 Q 646 399 664 388 Q 674 378 694 402 Q 716 436 768 626 Q 781 662 809 689 Q 825 702 812 719 Q 796 740 748 772 Q 726 785 706 778 Q 663 768 604 761 Q 528 751 430 736 Q 351 723 285 715 L 325 678 Q 377 693 453 703 L 507 711 Q 568 721 644 729 Q 690 735 703 718 Q 719 696 715 675 Q 664 477 643 461 L 628 430 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 292 713 L 330 700 L 662 750 L 706 750 L 727 744 L 760 705 L 710 535 L 669 431 L 672 398\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"943 1886\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 396 570 Q 378 566 400 550 Q 407 546 479 553 L 533 561 Q 579 568 621 574 Q 646 578 637 592 Q 627 608 599 613 Q 575 616 535 606 L 479 591 Q 436 581 396 570 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 398 560 L 561 589 L 602 592 L 626 586\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"359 718\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 530 422 Q 573 426 628 430 L 643 461 Q 618 486 531 464 L 478 453 Q 421 444 372 437 L 377 401 Q 383 401 390 402 Q 423 409 478 416 L 530 422 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 380 432 L 392 421 L 635 458\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"390 780\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 523 119 Q 524 183 526 242 L 527 293 Q 528 360 530 422 L 531 464 Q 532 515 533 561 L 535 606 Q 538 682 536 687 Q 523 700 507 711 L 453 703 Q 477 651 479 609 Q 479 600 479 591 L 479 553 Q 479 517 478 453 L 478 416 Q 477 359 475 282 L 474 234 Q 473 179 472 113 L 523 119 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 461 698 L 501 674 L 508 618 L 498 142 L 478 121\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"736 1472\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 526 242 Q 691 273 697 277 Q 707 286 703 295 Q 696 308 665 317 Q 632 324 599 314 Q 563 304 527 293 L 475 282 Q 411 272 336 267 Q 296 263 324 243 Q 369 216 443 230 Q 456 233 474 234 L 526 242 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 327 257 L 399 248 L 536 267 L 633 292 L 667 294 L 691 288\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"498 996\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 472 113 Q 309 97 121 79 Q 94 78 113 55 Q 131 37 152 30 Q 179 23 199 28 Q 503 101 919 80 Q 920 81 923 80 Q 948 79 955 90 Q 962 105 942 122 Q 873 179 798 158 Q 690 140 523 119 L 472 113 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 117 67 L 178 55 L 409 87 L 836 124 L 891 116 L 942 97\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"962 1924\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 726;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8408203125s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1561;\n            stroke-width: 128;\n          }\n          84% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.5203450520833333s both;\n          animation-delay: 0.8408203125s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 346 360 Q 506 403 693 547 Q 714 566 743 579 Q 759 589 756 600 Q 750 610 728 622 Q 676 644 647 641 Q 634 640 636 625 Q 627 544 362 389 Q 353 386 347 381 L 346 360 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 900 123 Q 878 190 867 308 Q 864 327 857 336 Q 848 343 844 326 Q 831 256 816 202 Q 810 165 779 142 Q 730 94 515 96 Q 431 103 401 121 Q 374 137 357 170 Q 339 213 346 360 L 347 381 Q 353 556 369 614 Q 378 636 345 660 Q 318 678 295 690 Q 276 703 257 691 Q 244 684 267 654 Q 294 617 295 567 Q 299 507 296 326 Q 289 158 330 111 Q 330 96 386 69 Q 462 32 669 40 Q 789 44 877 85 Q 913 95 900 123 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 346 360 Q 506 403 693 547 Q 714 566 743 579 Q 759 589 756 600 Q 750 610 728 622 Q 676 644 647 641 Q 634 640 636 625 Q 627 544 362 389 Q 353 386 347 381 L 346 360 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 745 596 L 677 593 L 622 535 L 542 474 L 437 412 L 357 375 L 352 365\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"598 1196\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 900 123 Q 878 190 867 308 Q 864 327 857 336 Q 848 343 844 326 Q 831 256 816 202 Q 810 165 779 142 Q 730 94 515 96 Q 431 103 401 121 Q 374 137 357 170 Q 339 213 346 360 L 347 381 Q 353 556 369 614 Q 378 636 345 660 Q 318 678 295 690 Q 276 703 257 691 Q 244 684 267 654 Q 294 617 295 567 Q 299 507 296 326 Q 289 158 330 111 Q 330 96 386 69 Q 462 32 669 40 Q 789 44 877 85 Q 913 95 900 123 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 265 681 L 309 646 L 328 617 L 318 291 L 322 214 L 329 172 L 341 143 L 361 115 L 387 97 L 476 72 L 594 67 L 726 79 L 793 99 L 842 129 L 852 329\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1433 2866\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 642;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.7724609375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1102;\n            stroke-width: 128;\n          }\n          78% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.1468098958333333s both;\n          animation-delay: 0.7724609375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 905;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.9864908854166666s both;\n          animation-delay: 1.9192708333333333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 429 712 Q 453 746 483 766 Q 493 773 491 787 Q 490 800 467 825 Q 445 846 427 849 Q 409 850 414 829 Q 421 805 410 788 Q 376 730 328 676 Q 283 625 223 571 Q 213 564 209 558 Q 205 548 217 548 Q 250 552 336 624 Q 340 628 347 633 L 365 649 Q 381 665 402 684 L 429 712 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 532 526 Q 575 575 625 643 Q 644 670 672 686 Q 688 693 689 702 Q 689 715 662 734 Q 628 761 613 762 Q 601 762 589 755 Q 526 733 429 712 L 402 684 Q 447 668 548 704 Q 567 708 574 701 Q 578 697 557 655 Q 529 606 486 556 L 463 531 Q 334 402 152 348 Q 142 345 142 340 Q 142 336 150 334 Q 297 319 471 467 Q 474 471 503 497 L 532 526 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 503 497 Q 692 337 735 329 Q 822 329 907 352 Q 926 356 928 362 Q 929 369 914 374 Q 847 396 768 417 Q 666 447 532 526 L 486 556 Q 467 571 447 585 Q 392 631 365 649 L 347 633 Q 375 605 463 531 L 503 497 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 429 712 Q 453 746 483 766 Q 493 773 491 787 Q 490 800 467 825 Q 445 846 427 849 Q 409 850 414 829 Q 421 805 410 788 Q 376 730 328 676 Q 283 625 223 571 Q 213 564 209 558 Q 205 548 217 548 Q 250 552 336 624 Q 340 628 347 633 L 365 649 Q 381 665 402 684 L 429 712 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 425 836 L 444 812 L 450 788 L 433 764 L 315 630 L 256 580 L 217 556\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"514 1028\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 532 526 Q 575 575 625 643 Q 644 670 672 686 Q 688 693 689 702 Q 689 715 662 734 Q 628 761 613 762 Q 601 762 589 755 Q 526 733 429 712 L 402 684 Q 447 668 548 704 Q 567 708 574 701 Q 578 697 557 655 Q 529 606 486 556 L 463 531 Q 334 402 152 348 Q 142 345 142 340 Q 142 336 150 334 Q 297 319 471 467 Q 474 471 503 497 L 532 526 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 408 687 L 564 726 L 610 720 L 621 707 L 586 641 L 542 580 L 499 530 L 432 467 L 316 390 L 222 353 L 149 341\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"974 1948\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 503 497 Q 692 337 735 329 Q 822 329 907 352 Q 926 356 928 362 Q 929 369 914 374 Q 847 396 768 417 Q 666 447 532 526 L 486 556 Q 467 571 447 585 Q 392 631 365 649 L 347 633 Q 375 605 463 531 L 503 497 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 354 634 L 371 630 L 447 563 L 547 488 L 718 386 L 743 376 L 787 370 L 922 363\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"777 1554\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 707;\n            stroke-width: 128;\n          }\n          70% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.8253580729166666s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 992;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0572916666666667s both;\n          animation-delay: 0.8253580729166666s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 433;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.6023763020833334s both;\n          animation-delay: 1.8826497395833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 431;\n            stroke-width: 128;\n          }\n          58% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.6007486979166666s both;\n          animation-delay: 2.485026041666667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 511;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.6658528645833334s both;\n          animation-delay: 3.0857747395833335s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes5 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 662;\n            stroke-width: 128;\n          }\n          68% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-5 {\n          animation: keyframes5 0.7887369791666666s both;\n          animation-delay: 3.751627604166667s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes6 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1155;\n            stroke-width: 128;\n          }\n          79% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-6 {\n          animation: keyframes6 1.18994140625s both;\n          animation-delay: 4.540364583333334s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 372 791 Q 353 810 318 807 Q 305 803 311 791 Q 366 679 329 485 Q 323 463 314 444 Q 299 404 332 362 L 334 360 Q 341 347 352 354 Q 356 358 363 369 L 375 404 Q 384 438 384 510 L 384 541 Q 383 592 383 631 L 383 654 Q 383 732 385 762 Q 385 763 386 763 L 372 791 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 618 393 Q 619 381 628 369 Q 644 336 654 338 Q 670 339 687 376 Q 705 404 702 428 Q 689 528 691 684 Q 690 729 715 767 Q 727 783 718 794 Q 690 819 641 841 Q 625 847 601 838 Q 519 805 372 791 L 386 763 Q 497 788 577 799 Q 605 803 614 789 Q 632 767 631 687 Q 632 467 621 421 L 618 393 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 383 631 Q 413 624 489 640 Q 514 646 544 653 Q 565 657 568 661 Q 575 668 571 675 Q 564 684 541 689 Q 529 692 443 666 Q 415 659 383 654 L 383 631 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 384 510 Q 450 510 566 539 Q 566 540 567 540 Q 574 547 571 554 Q 564 564 539 570 Q 518 573 438 550 Q 435 550 384 541 L 384 510 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 552 389 Q 582 392 618 393 L 621 421 Q 615 427 606 433 Q 590 442 559 436 Q 459 414 375 404 L 363 369 Q 370 369 379 370 Q 422 379 497 385 L 552 389 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 376 327 Q 372 225 261 131 Q 258 131 257 128 Q 226 100 150 54 Q 141 47 148 43 Q 175 33 266 81 Q 348 121 421 240 Q 434 259 449 277 Q 458 284 454 296 Q 450 308 421 330 Q 402 346 391 345 Q 378 344 376 327 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 497 385 Q 518 346 514 287 Q 508 110 531 73 Q 577 -27 824 -7 Q 912 3 947 24 Q 978 40 966 74 Q 945 132 936 232 Q 933 248 926 254 Q 917 260 913 238 Q 900 114 882 91 Q 872 72 834 64 Q 785 55 716 55 Q 637 58 605 71 Q 575 86 568 104 Q 547 159 567 263 Q 573 302 582 323 Q 597 362 552 389 L 497 385 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 372 791 Q 353 810 318 807 Q 305 803 311 791 Q 366 679 329 485 Q 323 463 314 444 Q 299 404 332 362 L 334 360 Q 341 347 352 354 Q 356 358 363 369 L 375 404 Q 384 438 384 510 L 384 541 Q 383 592 383 631 L 383 654 Q 383 732 385 762 Q 385 763 386 763 L 372 791 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 319 797 L 350 771 L 362 704 L 361 533 L 342 406 L 345 363\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"579 1158\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 618 393 Q 619 381 628 369 Q 644 336 654 338 Q 670 339 687 376 Q 705 404 702 428 Q 689 528 691 684 Q 690 729 715 767 Q 727 783 718 794 Q 690 819 641 841 Q 625 847 601 838 Q 519 805 372 791 L 386 763 Q 497 788 577 799 Q 605 803 614 789 Q 632 767 631 687 Q 632 467 621 421 L 618 393 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 382 787 L 394 778 L 615 818 L 636 810 L 668 776 L 660 698 L 663 429 L 654 350\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"864 1728\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 383 631 Q 413 624 489 640 Q 514 646 544 653 Q 565 657 568 661 Q 575 668 571 675 Q 564 684 541 689 Q 529 692 443 666 Q 415 659 383 654 L 383 631 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 389 637 L 397 643 L 439 647 L 526 669 L 561 670\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"305 610\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 384 510 Q 450 510 566 539 Q 566 540 567 540 Q 574 547 571 554 Q 564 564 539 570 Q 518 573 438 550 Q 435 550 384 541 L 384 510 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 390 518 L 401 526 L 474 541 L 542 552 L 560 549\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"303 606\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 552 389 Q 582 392 618 393 L 621 421 Q 615 427 606 433 Q 590 442 559 436 Q 459 414 375 404 L 363 369 Q 370 369 379 370 Q 422 379 497 385 L 552 389 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 367 374 L 388 389 L 555 413 L 593 415 L 611 401\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"383 766\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-5\">\n        <path d=\"M 376 327 Q 372 225 261 131 Q 258 131 257 128 Q 226 100 150 54 Q 141 47 148 43 Q 175 33 266 81 Q 348 121 421 240 Q 434 259 449 277 Q 458 284 454 296 Q 450 308 421 330 Q 402 346 391 345 Q 378 344 376 327 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-5)\" d=\"M 393 328 L 410 290 L 382 231 L 333 164 L 247 92 L 153 48\" fill=\"none\" id=\"make-me-a-hanzi-animation-5\" stroke-dasharray=\"534 1068\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-6\">\n        <path d=\"M 497 385 Q 518 346 514 287 Q 508 110 531 73 Q 577 -27 824 -7 Q 912 3 947 24 Q 978 40 966 74 Q 945 132 936 232 Q 933 248 926 254 Q 917 260 913 238 Q 900 114 882 91 Q 872 72 834 64 Q 785 55 716 55 Q 637 58 605 71 Q 575 86 568 104 Q 547 159 567 263 Q 573 302 582 323 Q 597 362 552 389 L 497 385 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-6)\" d=\"M 504 381 L 543 355 L 549 339 L 534 188 L 546 97 L 566 65 L 611 39 L 700 23 L 785 23 L 867 35 L 906 52 L 920 64 L 922 79 L 923 246\" fill=\"none\" id=\"make-me-a-hanzi-animation-6\" stroke-dasharray=\"1027 2054\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 941;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0157877604166667s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 976;\n            stroke-width: 128;\n          }\n          76% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0442708333333333s both;\n          animation-delay: 1.0157877604166667s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 462 624 Q 543 649 600 660 Q 613 661 616 658 Q 629 639 624 589 Q 617 448 586 386 Q 573 356 548 359 Q 520 366 495 377 Q 470 384 488 362 Q 537 319 560 284 Q 585 262 604 285 Q 635 313 655 361 Q 677 416 680 578 Q 680 636 697 666 Q 710 681 703 691 Q 693 703 637 723 Q 615 732 595 716 Q 567 697 443 669 L 462 624 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 394 584 Q 398 434 397 200 Q 397 -4 417 -33 Q 423 -40 431 -38 Q 440 -34 445 -17 Q 463 25 458 202 Q 455 265 454 565 Q 454 583 462 624 L 443 669 Q 415 688 400 689 Q 385 695 369 684 Q 359 675 367 664 Q 391 621 394 584 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 462 624 Q 543 649 600 660 Q 613 661 616 658 Q 629 639 624 589 Q 617 448 586 386 Q 573 356 548 359 Q 520 366 495 377 Q 470 384 488 362 Q 537 319 560 284 Q 585 262 604 285 Q 635 313 655 361 Q 677 416 680 578 Q 680 636 697 666 Q 710 681 703 691 Q 693 703 637 723 Q 615 732 595 716 Q 567 697 443 669 L 462 624 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 456 668 L 475 653 L 621 692 L 654 672 L 646 487 L 619 368 L 605 344 L 580 324 L 546 336 L 488 371\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"813 1626\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 394 584 Q 398 434 397 200 Q 397 -4 417 -33 Q 423 -40 431 -38 Q 440 -34 445 -17 Q 463 25 458 202 Q 455 265 454 565 Q 454 583 462 624 L 443 669 Q 415 688 400 689 Q 385 695 369 684 Q 359 675 367 664 Q 391 621 394 584 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 377 673 L 414 646 L 425 619 L 427 -26\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"848 1696\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 501;\n            stroke-width: 128;\n          }\n          62% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.65771484375s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 937;\n            stroke-width: 128;\n          }\n          75% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.0125325520833333s both;\n          animation-delay: 0.65771484375s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 392;\n            stroke-width: 128;\n          }\n          56% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.5690104166666666s both;\n          animation-delay: 1.6702473958333333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes3 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 408;\n            stroke-width: 128;\n          }\n          57% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-3 {\n          animation: keyframes3 0.58203125s both;\n          animation-delay: 2.2392578125s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes4 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 595;\n            stroke-width: 128;\n          }\n          66% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-4 {\n          animation: keyframes4 0.7342122395833334s both;\n          animation-delay: 2.8212890625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 295 729 Q 294 735 264 739 Q 229 744 225 737 L 224 735 Q 221 731 230 715 Q 267 651 294 563 Q 302 533 319 515 Q 339 497 343 512 Q 344 518 344 527 L 340 561 Q 339 564 337 571 Q 313 658 304 690 L 295 729 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 680 566 Q 680 565 682 563 Q 686 547 698 546 Q 720 549 759 621 Q 780 673 819 701 Q 841 715 825 733 Q 809 752 759 782 Q 741 795 667 778 Q 580 772 461 754 Q 310 730 295 729 L 304 690 Q 336 698 398 710 L 422 714 Q 474 725 551 733 L 584 737 Q 702 755 727 739 Q 733 733 727 709 Q 698 614 688 598 L 680 566 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 459 576 Q 459 577 460 577 Q 462 602 452 637 L 433 694 Q 431 706 422 714 L 398 710 Q 399 704 402 690 Q 412 601 433 572 L 459 576 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 575 598 L 612 694 Q 609 715 584 737 L 551 733 Q 557 702 533 589 L 575 598 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 344 527 Q 359 526 381 531 Q 490 552 680 566 L 688 598 Q 678 606 674 607 Q 655 615 575 598 L 533 589 L 459 576 L 433 572 Q 398 569 340 561 L 344 527 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 295 729 Q 294 735 264 739 Q 229 744 225 737 L 224 735 Q 221 731 230 715 Q 267 651 294 563 Q 302 533 319 515 Q 339 497 343 512 Q 344 518 344 527 L 340 561 Q 339 564 337 571 Q 313 658 304 690 L 295 729 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 231 733 L 271 703 L 332 518\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"373 746\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 680 566 Q 680 565 682 563 Q 686 547 698 546 Q 720 549 759 621 Q 780 673 819 701 Q 841 715 825 733 Q 809 752 759 782 Q 741 795 667 778 Q 580 772 461 754 Q 310 730 295 729 L 304 690 Q 336 698 398 710 L 422 714 Q 474 725 551 733 L 584 737 Q 702 755 727 739 Q 733 733 727 709 Q 698 614 688 598 L 680 566 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 298 723 L 316 713 L 558 752 L 703 766 L 744 760 L 773 720 L 698 558\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"809 1618\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 459 576 Q 459 577 460 577 Q 462 602 452 637 L 433 694 Q 431 706 422 714 L 398 710 Q 399 704 402 690 Q 412 601 433 572 L 459 576 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 405 707 L 417 695 L 442 592 L 452 584\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"264 528\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-3\">\n        <path d=\"M 575 598 L 612 694 Q 609 715 584 737 L 551 733 Q 557 702 533 589 L 575 598 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-3)\" d=\"M 557 730 L 576 711 L 581 695 L 559 617 L 538 599\" fill=\"none\" id=\"make-me-a-hanzi-animation-3\" stroke-dasharray=\"280 560\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-4\">\n        <path d=\"M 344 527 Q 359 526 381 531 Q 490 552 680 566 L 688 598 Q 678 606 674 607 Q 655 615 575 598 L 533 589 L 459 576 L 433 572 Q 398 569 340 561 L 344 527 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-4)\" d=\"M 349 533 L 370 548 L 649 585 L 679 595\" fill=\"none\" id=\"make-me-a-hanzi-animation-4\" stroke-dasharray=\"467 934\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1027;\n            stroke-width: 128;\n          }\n          77% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 1.0857747395833333s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 879;\n            stroke-width: 128;\n          }\n          74% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 0.96533203125s both;\n          animation-delay: 1.0857747395833333s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes2 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 737;\n            stroke-width: 128;\n          }\n          71% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-2 {\n          animation: keyframes2 0.8497721354166666s both;\n          animation-delay: 2.051106770833333s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 535 412 Q 718 436 872 423 Q 897 420 903 430 Q 910 443 898 456 Q 867 484 821 504 Q 806 510 779 501 Q 713 485 645 475 Q 581 468 536 461 L 482 454 Q 473 457 297 431 Q 231 421 132 418 Q 119 417 117 406 Q 116 393 136 378 Q 154 365 186 353 Q 198 349 216 358 Q 232 364 302 377 Q 383 396 482 407 L 535 412 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 530 159 Q 533 292 535 412 L 536 461 Q 536 650 554 701 Q 566 723 551 736 Q 514 764 484 773 Q 468 777 453 764 Q 447 757 454 745 Q 484 697 482 642 Q 482 551 482 454 L 482 407 Q 482 284 482 153 L 530 159 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 482 153 Q 386 141 274 128 Q 252 127 268 107 Q 284 91 303 85 Q 327 78 344 83 Q 443 108 704 108 Q 717 108 731 107 Q 753 106 759 116 Q 765 129 747 144 Q 684 192 614 174 Q 578 168 530 159 L 482 153 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 535 412 Q 718 436 872 423 Q 897 420 903 430 Q 910 443 898 456 Q 867 484 821 504 Q 806 510 779 501 Q 713 485 645 475 Q 581 468 536 461 L 482 454 Q 473 457 297 431 Q 231 421 132 418 Q 119 417 117 406 Q 116 393 136 378 Q 154 365 186 353 Q 198 349 216 358 Q 232 364 302 377 Q 383 396 482 407 L 535 412 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 131 404 L 197 387 L 388 420 L 805 467 L 890 439\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"899 1798\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 530 159 Q 533 292 535 412 L 536 461 Q 536 650 554 701 Q 566 723 551 736 Q 514 764 484 773 Q 468 777 453 764 Q 447 757 454 745 Q 484 697 482 642 Q 482 551 482 454 L 482 407 Q 482 284 482 153 L 530 159 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 466 755 L 482 747 L 514 710 L 507 201 L 506 181 L 487 161\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"751 1502\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-2\">\n        <path d=\"M 482 153 Q 386 141 274 128 Q 252 127 268 107 Q 284 91 303 85 Q 327 78 344 83 Q 443 108 704 108 Q 717 108 731 107 Q 753 106 759 116 Q 765 129 747 144 Q 684 192 614 174 Q 578 168 530 159 L 482 153 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-2)\" d=\"M 271 117 L 326 107 L 641 143 L 687 141 L 746 123\" fill=\"none\" id=\"make-me-a-hanzi-animation-2\" stroke-dasharray=\"609 1218\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>",
  "<svg version=\"1.1\" viewBox=\"0 0 1024 1024\" xmlns=\"http://www.w3.org/2000/svg\">\n  <g stroke=\"lightgray\" stroke-dasharray=\"1,1\" stroke-width=\"1\" transform=\"scale(4, 4)\">\n    <line x1=\"0\" y1=\"0\" x2=\"256\" y2=\"256\"></line>\n    <line x1=\"256\" y1=\"0\" x2=\"0\" y2=\"256\"></line>\n    <line x1=\"128\" y1=\"0\" x2=\"128\" y2=\"256\"></line>\n    <line x1=\"0\" y1=\"128\" x2=\"256\" y2=\"128\"></line>\n  </g>\n  <g transform=\"scale(1, -1) translate(0, -900)\">\n    <style scoped=\"true\" type=\"text/css\">\n      \n        @keyframes keyframes0 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 696;\n            stroke-width: 128;\n          }\n          69% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-0 {\n          animation: keyframes0 0.81640625s both;\n          animation-delay: 0s;\n          animation-timing-function: linear;\n        }\n      \n        @keyframes keyframes1 {\n          from {\n            stroke: blue;\n            stroke-dashoffset: 1474;\n            stroke-width: 128;\n          }\n          83% {\n            animation-timing-function: step-end;\n            stroke: blue;\n            stroke-dashoffset: 0;\n            stroke-width: 128;\n          }\n          to {\n            stroke: black;\n            stroke-width: 1024;\n          }\n        }\n        #make-me-a-hanzi-animation-1 {\n          animation: keyframes1 1.4495442708333333s both;\n          animation-delay: 0.81640625s;\n          animation-timing-function: linear;\n        }\n      \n    </style>\n    \n      <path d=\"M 343 588 Q 376 631 412 684 Q 434 721 453 740 Q 463 750 458 764 Q 454 777 426 800 Q 399 818 381 818 Q 362 817 370 794 Q 391 748 298 605 Q 255 539 195 466 Q 185 456 183 450 Q 179 440 193 442 Q 223 445 313 551 Q 317 557 324 564 L 343 588 Z\" fill=\"lightgray\"></path>\n    \n      <path d=\"M 618 69 Q 600 63 500 91 Q 490 92 491 88 Q 491 84 502 76 Q 557 33 585 1 Q 600 -20 614 -17 Q 636 -20 659 3 Q 741 66 768 228 Q 789 339 803 508 Q 804 547 830 575 Q 843 588 843 597 Q 842 606 822 620 Q 795 642 758 654 Q 737 663 667 643 Q 642 639 608 630 Q 460 599 343 588 L 324 564 Q 327 564 329 563 Q 366 553 409 561 Q 521 576 608 591 Q 726 609 739 593 Q 757 551 728 317 Q 707 185 661 107 Q 642 70 618 69 Z\" fill=\"lightgray\"></path>\n    \n    \n      <clipPath id=\"make-me-a-hanzi-clip-0\">\n        <path d=\"M 343 588 Q 376 631 412 684 Q 434 721 453 740 Q 463 750 458 764 Q 454 777 426 800 Q 399 818 381 818 Q 362 817 370 794 Q 391 748 298 605 Q 255 539 195 466 Q 185 456 183 450 Q 179 440 193 442 Q 223 445 313 551 Q 317 557 324 564 L 343 588 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-0)\" d=\"M 381 804 L 404 779 L 413 757 L 390 707 L 291 554 L 219 472 L 191 450\" fill=\"none\" id=\"make-me-a-hanzi-animation-0\" stroke-dasharray=\"568 1136\" stroke-linecap=\"round\"></path>\n    \n      <clipPath id=\"make-me-a-hanzi-clip-1\">\n        <path d=\"M 618 69 Q 600 63 500 91 Q 490 92 491 88 Q 491 84 502 76 Q 557 33 585 1 Q 600 -20 614 -17 Q 636 -20 659 3 Q 741 66 768 228 Q 789 339 803 508 Q 804 547 830 575 Q 843 588 843 597 Q 842 606 822 620 Q 795 642 758 654 Q 737 663 667 643 Q 642 639 608 630 Q 460 599 343 588 L 324 564 Q 327 564 329 563 Q 366 553 409 561 Q 521 576 608 591 Q 726 609 739 593 Q 757 551 728 317 Q 707 185 661 107 Q 642 70 618 69 Z\"></path>\n      </clipPath>\n      <path clip-path=\"url(#make-me-a-hanzi-clip-1)\" d=\"M 337 568 L 721 628 L 756 621 L 786 591 L 762 365 L 739 223 L 712 137 L 688 87 L 658 49 L 620 26 L 514 76 L 511 85 L 496 88\" fill=\"none\" id=\"make-me-a-hanzi-animation-1\" stroke-dasharray=\"1346 2692\" stroke-linecap=\"round\"></path>\n    \n  </g>\n</svg>"
]
},{}],13:[function(require,module,exports){

},{}],14:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":15,"ieee754":16,"isarray":17}],15:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],16:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],17:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}]},{},[1]);
