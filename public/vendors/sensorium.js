(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
"use strict";
var layouts = require('../layouts')
, consoleLog = console.log.bind(console);

function consoleAppender (layout, timezoneOffset) {
  layout = layout || layouts.colouredLayout;
  return function(loggingEvent) {
    consoleLog(layout(loggingEvent, timezoneOffset));
  };
}

function configure(config) {
  var layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return consoleAppender(layout, config.timezoneOffset);
}

exports.appender = consoleAppender;
exports.configure = configure;

},{"../layouts":8}],6:[function(require,module,exports){
"use strict";
var levels = require("./levels");
var DEFAULT_FORMAT = ':remote-addr - -' +
  ' ":method :url HTTP/:http-version"' +
  ' :status :content-length ":referrer"' +
  ' ":user-agent"';
/**
 * Log requests with the given `options` or a `format` string.
 *
 * Options:
 *
 *   - `format`        Format string, see below for tokens
 *   - `level`         A log4js levels instance. Supports also 'auto'
 *
 * Tokens:
 *
 *   - `:req[header]` ex: `:req[Accept]`
 *   - `:res[header]` ex: `:res[Content-Length]`
 *   - `:http-version`
 *   - `:response-time`
 *   - `:remote-addr`
 *   - `:date`
 *   - `:method`
 *   - `:url`
 *   - `:referrer`
 *   - `:user-agent`
 *   - `:status`
 *
 * @param {String|Function|Object} format or options
 * @return {Function}
 * @api public
 */

function getLogger(logger4js, options) {
	if ('object' == typeof options) {
		options = options || {};
	} else if (options) {
		options = { format: options };
	} else {
		options = {};
	}

	var thislogger = logger4js
  , level = levels.toLevel(options.level, levels.INFO)
  , fmt = options.format || DEFAULT_FORMAT
  , nolog = options.nolog ? createNoLogCondition(options.nolog) : null;

  return function (req, res, next) {
    // mount safety
    if (req._logging) return next();

		// nologs
		if (nolog && nolog.test(req.originalUrl)) return next();
		if (thislogger.isLevelEnabled(level) || options.level === 'auto') {

			var start = new Date()
			, statusCode
			, writeHead = res.writeHead
			, url = req.originalUrl;

			// flag as logging
			req._logging = true;

			// proxy for statusCode.
			res.writeHead = function(code, headers){
				res.writeHead = writeHead;
				res.writeHead(code, headers);
				res.__statusCode = statusCode = code;
				res.__headers = headers || {};

				//status code response level handling
				if(options.level === 'auto'){
					level = levels.INFO;
					if(code >= 300) level = levels.WARN;
					if(code >= 400) level = levels.ERROR;
				} else {
					level = levels.toLevel(options.level, levels.INFO);
				}
			};

			//hook on end request to emit the log entry of the HTTP request.
			res.on('finish', function() {
				res.responseTime = new Date() - start;
				//status code response level handling
				if(res.statusCode && options.level === 'auto'){
					level = levels.INFO;
					if(res.statusCode >= 300) level = levels.WARN;
					if(res.statusCode >= 400) level = levels.ERROR;
				}
				if (thislogger.isLevelEnabled(level)) {
          var combined_tokens = assemble_tokens(req, res, options.tokens || []);
					if (typeof fmt === 'function') {
						var line = fmt(req, res, function(str){ return format(str, combined_tokens); });
						if (line) thislogger.log(level, line);
					} else {
						thislogger.log(level, format(fmt, combined_tokens));
					}
				}
			});
		}

    //ensure next gets always called
    next();
  };
}

/**
 * Adds custom {token, replacement} objects to defaults,
 * overwriting the defaults if any tokens clash
 *
 * @param  {IncomingMessage} req
 * @param  {ServerResponse} res
 * @param  {Array} custom_tokens
 *    [{ token: string-or-regexp, replacement: string-or-replace-function }]
 * @return {Array}
 */
function assemble_tokens(req, res, custom_tokens) {
  var array_unique_tokens = function(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
      for(var j=i+1; j<a.length; ++j) {
        if(a[i].token == a[j].token) { // not === because token can be regexp object
          a.splice(j--, 1);
        }
      }
    }
    return a;
  };

  var default_tokens = [];
  default_tokens.push({ token: ':url', replacement: req.originalUrl });
  default_tokens.push({ token: ':protocol', replacement: req.protocol });
  default_tokens.push({ token: ':hostname', replacement: req.hostname });
  default_tokens.push({ token: ':method', replacement: req.method });
  default_tokens.push({ token: ':status', replacement: res.__statusCode || res.statusCode });
  default_tokens.push({ token: ':response-time', replacement: res.responseTime });
  default_tokens.push({ token: ':date', replacement: new Date().toUTCString() });
  default_tokens.push({
    token: ':referrer',
    replacement: req.headers.referer || req.headers.referrer || ''
  });
  default_tokens.push({
    token: ':http-version',
    replacement: req.httpVersionMajor + '.' + req.httpVersionMinor
  });
  default_tokens.push({
    token: ':remote-addr',
    replacement:
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req._remoteAddress ||
      (req.socket &&
        (req.socket.remoteAddress ||
          (req.socket.socket && req.socket.socket.remoteAddress)
        )
      )
    }
  );
  default_tokens.push({ token: ':user-agent', replacement: req.headers['user-agent'] });
  default_tokens.push({
    token: ':content-length',
    replacement:
      (res._headers && res._headers['content-length']) ||
      (res.__headers && res.__headers['Content-Length']) ||
      '-'
    }
  );
  default_tokens.push({ token: /:req\[([^\]]+)\]/g, replacement: function(_, field) {
    return req.headers[field.toLowerCase()];
  } });
  default_tokens.push({ token: /:res\[([^\]]+)\]/g, replacement: function(_, field) {
    return res._headers ?
      (res._headers[field.toLowerCase()] || res.__headers[field])
      : (res.__headers && res.__headers[field]);
  } });

  return array_unique_tokens(custom_tokens.concat(default_tokens));
}

/**
 * Return formatted log line.
 *
 * @param  {String} str
 * @param  {IncomingMessage} req
 * @param  {ServerResponse} res
 * @return {String}
 * @api private
 */

function format(str, tokens) {
  for (var i = 0; i < tokens.length; i++) {
    str = str.replace(tokens[i].token, tokens[i].replacement);
  }
  return str;
}

/**
 * Return RegExp Object about nolog
 *
 * @param  {String} nolog
 * @return {RegExp}
 * @api private
 *
 * syntax
 *  1. String
 *   1.1 "\\.gif"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.gif?fuga
 *         LOGGING http://example.com/hoge.agif
 *   1.2 in "\\.gif|\\.jpg$"
 *         NOT LOGGING http://example.com/hoge.gif and
 *           http://example.com/hoge.gif?fuga and http://example.com/hoge.jpg?fuga
 *         LOGGING http://example.com/hoge.agif,
 *           http://example.com/hoge.ajpg and http://example.com/hoge.jpg?hoge
 *   1.3 in "\\.(gif|jpe?g|png)$"
 *         NOT LOGGING http://example.com/hoge.gif and http://example.com/hoge.jpeg
 *         LOGGING http://example.com/hoge.gif?uid=2 and http://example.com/hoge.jpg?pid=3
 *  2. RegExp
 *   2.1 in /\.(gif|jpe?g|png)$/
 *         SAME AS 1.3
 *  3. Array
 *   3.1 ["\\.jpg$", "\\.png", "\\.gif"]
 *         SAME AS "\\.jpg|\\.png|\\.gif"
 */
function createNoLogCondition(nolog) {
  var regexp = null;

	if (nolog) {
    if (nolog instanceof RegExp) {
      regexp = nolog;
    }

    if (typeof nolog === 'string') {
      regexp = new RegExp(nolog);
    }

    if (Array.isArray(nolog)) {
      var regexpsAsStrings = nolog.map(
        function convertToStrings(o) {
          return o.source ? o.source : o;
        }
      );
      regexp = new RegExp(regexpsAsStrings.join('|'));
    }
  }

  return regexp;
}

exports.connectLogger = getLogger;

},{"./levels":9}],7:[function(require,module,exports){
"use strict";
exports.ISO8601_FORMAT = "yyyy-MM-dd hh:mm:ss.SSS";
exports.ISO8601_WITH_TZ_OFFSET_FORMAT = "yyyy-MM-ddThh:mm:ssO";
exports.DATETIME_FORMAT = "dd MM yyyy hh:mm:ss.SSS";
exports.ABSOLUTETIME_FORMAT = "hh:mm:ss.SSS";

function padWithZeros(vNumber, width) {
  var numAsString = vNumber + "";
  while (numAsString.length < width) {
    numAsString = "0" + numAsString;
  }
  return numAsString;
}

function addZero(vNumber) {
  return padWithZeros(vNumber, 2);
}

/**
 * Formats the TimeOffest
 * Thanks to http://www.svendtofte.com/code/date_format/
 * @private
 */
function offset(timezoneOffset) {
  // Difference to Greenwich time (GMT) in hours
  var os = Math.abs(timezoneOffset);
  var h = String(Math.floor(os/60));
  var m = String(os%60);
  if (h.length == 1) {
    h = "0" + h;
  }
  if (m.length == 1) {
    m = "0" + m;
  }
  return timezoneOffset < 0 ? "+"+h+m : "-"+h+m;
}

exports.asString = function(/*format,*/ date, timezoneOffset) {
  /*jshint -W071 */
  var format = exports.ISO8601_FORMAT;
  if (typeof(date) === "string") {
    format = arguments[0];
    date = arguments[1];
    timezoneOffset = arguments[2];
  }
  // make the date independent of the system timezone by working with UTC
  if (timezoneOffset === undefined) {
    timezoneOffset = date.getTimezoneOffset();
  }
  date.setUTCMinutes(date.getUTCMinutes() - timezoneOffset);
  var vDay = addZero(date.getUTCDate());
  var vMonth = addZero(date.getUTCMonth()+1);
  var vYearLong = addZero(date.getUTCFullYear());
  var vYearShort = addZero(date.getUTCFullYear().toString().substring(2,4));
  var vYear = (format.indexOf("yyyy") > -1 ? vYearLong : vYearShort);
  var vHour  = addZero(date.getUTCHours());
  var vMinute = addZero(date.getUTCMinutes());
  var vSecond = addZero(date.getUTCSeconds());
  var vMillisecond = padWithZeros(date.getUTCMilliseconds(), 3);
  var vTimeZone = offset(timezoneOffset);
  date.setUTCMinutes(date.getUTCMinutes() + timezoneOffset);
  var formatted = format
    .replace(/dd/g, vDay)
    .replace(/MM/g, vMonth)
    .replace(/y{1,4}/g, vYear)
    .replace(/hh/g, vHour)
    .replace(/mm/g, vMinute)
    .replace(/ss/g, vSecond)
    .replace(/SSS/g, vMillisecond)
    .replace(/O/g, vTimeZone);
  return formatted;

};
/*jshint +W071 */

},{}],8:[function(require,module,exports){
(function (process){
"use strict";
var dateFormat = require('./date_format')
, os = require('os')
, eol = os.EOL || '\n'
, util = require('util')
, semver = require('semver')
, replacementRegExp = /%[sdj]/g
, layoutMakers = {
  "messagePassThrough": function() { return messagePassThroughLayout; },
  "basic": function() { return basicLayout; },
  "colored": function() { return colouredLayout; },
  "coloured": function() { return colouredLayout; },
  "pattern": function (config) {
    return patternLayout(config && config.pattern, config && config.tokens);
	},
  "dummy": function() { return dummyLayout; }
}
, colours = {
  ALL: "grey",
  TRACE: "blue",
  DEBUG: "cyan",
  INFO: "green",
  WARN: "yellow",
  ERROR: "red",
  FATAL: "magenta",
  OFF: "grey"
};

function wrapErrorsWithInspect(items) {
  return items.map(function(item) {
    if ((item instanceof Error) && item.stack) {
      return { inspect: function() {
        if (semver.satisfies(process.version, '>=6')) {
          return util.format(item);
        } else {
          return util.format(item) + '\n' + item.stack;           
        }
      } };
    } else {
      return item;
    }
  });
}

function formatLogData(logData) {
  var data = Array.isArray(logData) ? logData : Array.prototype.slice.call(arguments);
  return util.format.apply(util, wrapErrorsWithInspect(data));
}

var styles = {
    //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
};

function colorizeStart(style) {
  return style ? '\x1B[' + styles[style][0] + 'm' : '';
}
function colorizeEnd(style) {
  return style ? '\x1B[' + styles[style][1] + 'm' : '';
}
/**
 * Taken from masylum's fork (https://github.com/masylum/log4js-node)
 */
function colorize (str, style) {
  return colorizeStart(style) + str + colorizeEnd(style);
}

function timestampLevelAndCategory(loggingEvent, colour, timezoneOffest) {
  var output = colorize(
    formatLogData(
      '[%s] [%s] %s - '
      , dateFormat.asString(loggingEvent.startTime, timezoneOffest)
      , loggingEvent.level
      , loggingEvent.categoryName
    )
    , colour
  );
  return output;
}

/**
 * BasicLayout is a simple layout for storing the logs. The logs are stored
 * in following format:
 * <pre>
 * [startTime] [logLevel] categoryName - message\n
 * </pre>
 *
 * @author Stephan Strittmatter
 */
function basicLayout (loggingEvent, timezoneOffset) {
  return timestampLevelAndCategory(
    loggingEvent,
    undefined,
    timezoneOffset
  ) + formatLogData(loggingEvent.data);
}

/**
 * colouredLayout - taken from masylum's fork.
 * same as basicLayout, but with colours.
 */
function colouredLayout (loggingEvent, timezoneOffset) {
  return timestampLevelAndCategory(
    loggingEvent,
    colours[loggingEvent.level.toString()],
    timezoneOffset
  ) + formatLogData(loggingEvent.data);
}

function messagePassThroughLayout (loggingEvent) {
  return formatLogData(loggingEvent.data);
}

function dummyLayout(loggingEvent) {
  return loggingEvent.data[0];
}

/**
 * PatternLayout
 * Format for specifiers is %[padding].[truncation][field]{[format]}
 * e.g. %5.10p - left pad the log level by 5 characters, up to a max of 10
 * Fields can be any of:
 *  - %r time in toLocaleTimeString format
 *  - %p log level
 *  - %c log category
 *  - %h hostname
 *  - %m log data
 *  - %d date in various formats
 *  - %% %
 *  - %n newline
 *  - %z pid
 *  - %x{<tokenname>} add dynamic tokens to your log. Tokens are specified in the tokens parameter
 * You can use %[ and %] to define a colored block.
 *
 * Tokens are specified as simple key:value objects.
 * The key represents the token name whereas the value can be a string or function
 * which is called to extract the value to put in the log message. If token is not
 * found, it doesn't replace the field.
 *
 * A sample token would be: { "pid" : function() { return process.pid; } }
 *
 * Takes a pattern string, array of tokens and returns a layout function.
 * @param {String} Log format pattern String
 * @param {object} map object of different tokens
 * @param {number} timezone offset in minutes
 * @return {Function}
 * @author Stephan Strittmatter
 * @author Jan Schmidle
 */
function patternLayout (pattern, tokens, timezoneOffset) {
  // jshint maxstatements:22
  var TTCC_CONVERSION_PATTERN  = "%r %p %c - %m%n";
  var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([\[\]cdhmnprzxy%])(\{([^\}]+)\})?|([^%]+)/;

  pattern = pattern || TTCC_CONVERSION_PATTERN;

  function categoryName(loggingEvent, specifier) {
    var loggerName = loggingEvent.categoryName;
    if (specifier) {
      var precision = parseInt(specifier, 10);
      var loggerNameBits = loggerName.split(".");
      if (precision < loggerNameBits.length) {
        loggerName = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
      }
    }
    return loggerName;
  }

  function formatAsDate(loggingEvent, specifier) {
    var format = dateFormat.ISO8601_FORMAT;
    if (specifier) {
      format = specifier;
      // Pick up special cases
      if (format == "ISO8601") {
        format = dateFormat.ISO8601_FORMAT;
      } else if (format == "ISO8601_WITH_TZ_OFFSET") {
        format = dateFormat.ISO8601_WITH_TZ_OFFSET_FORMAT;
      } else if (format == "ABSOLUTE") {
        format = dateFormat.ABSOLUTETIME_FORMAT;
      } else if (format == "DATE") {
        format = dateFormat.DATETIME_FORMAT;
      }
    }
    // Format the date
    return dateFormat.asString(format, loggingEvent.startTime, timezoneOffset);
  }

  function hostname() {
    return os.hostname().toString();
  }

  function formatMessage(loggingEvent) {
    return formatLogData(loggingEvent.data);
  }

  function endOfLine() {
    return eol;
  }

  function logLevel(loggingEvent) {
    return loggingEvent.level.toString();
  }

  function startTime(loggingEvent) {
    return dateFormat.asString('hh:mm:ss', loggingEvent.startTime, timezoneOffset);
  }

  function startColour(loggingEvent) {
    return colorizeStart(colours[loggingEvent.level.toString()]);
  }

  function endColour(loggingEvent) {
    return colorizeEnd(colours[loggingEvent.level.toString()]);
  }

  function percent() {
    return '%';
  }

  function pid(loggingEvent) {
    if (loggingEvent && loggingEvent.pid) {
      return loggingEvent.pid;
    } else {
      return process.pid;
    }
  }

  function clusterInfo(loggingEvent, specifier) {
    if (loggingEvent.cluster && specifier) {
      return specifier
        .replace('%m', loggingEvent.cluster.master)
        .replace('%w', loggingEvent.cluster.worker)
        .replace('%i', loggingEvent.cluster.workerId);
    } else if (loggingEvent.cluster) {
      return loggingEvent.cluster.worker+'@'+loggingEvent.cluster.master;
    } else {
      return pid();
    }
  }

  function userDefined(loggingEvent, specifier) {
    if (typeof(tokens[specifier]) !== 'undefined') {
      if (typeof(tokens[specifier]) === 'function') {
        return tokens[specifier](loggingEvent);
      } else {
        return tokens[specifier];
      }
    }
    return null;
  }

  var replacers = {
    'c': categoryName,
    'd': formatAsDate,
    'h': hostname,
    'm': formatMessage,
    'n': endOfLine,
    'p': logLevel,
    'r': startTime,
    '[': startColour,
    ']': endColour,
    'y': clusterInfo,
    'z': pid,
    '%': percent,
    'x': userDefined
  };

  function replaceToken(conversionCharacter, loggingEvent, specifier) {
    return replacers[conversionCharacter](loggingEvent, specifier);
  }

  function truncate(truncation, toTruncate) {
    var len;
    if (truncation) {
      len = parseInt(truncation.substr(1), 10);
      return toTruncate.substring(0, len);
    }

    return toTruncate;
  }

  function pad(padding, toPad) {
    var len;
    if (padding) {
      if (padding.charAt(0) == "-") {
        len = parseInt(padding.substr(1), 10);
        // Right pad with spaces
        while (toPad.length < len) {
          toPad += " ";
        }
      } else {
        len = parseInt(padding, 10);
        // Left pad with spaces
        while (toPad.length < len) {
          toPad = " " + toPad;
        }
      }
    }
    return toPad;
  }

  function truncateAndPad(toTruncAndPad, truncation, padding) {
    var replacement = toTruncAndPad;
    replacement = truncate(truncation, replacement);
    replacement = pad(padding, replacement);
    return replacement;
  }

  return function(loggingEvent) {
    var formattedString = "";
    var result;
    var searchString = pattern;

    while ((result = regex.exec(searchString))) {
      var matchedString = result[0];
      var padding = result[1];
      var truncation = result[2];
      var conversionCharacter = result[3];
      var specifier = result[5];
      var text = result[6];

      // Check if the pattern matched was just normal text
      if (text) {
        formattedString += "" + text;
      } else {
        // Create a raw replacement string based on the conversion
        // character and specifier
        var replacement = replaceToken(conversionCharacter, loggingEvent, specifier);
        formattedString += truncateAndPad(replacement, truncation, padding);
      }
      searchString = searchString.substr(result.index + result[0].length);
    }
    return formattedString;
  };

}

module.exports = {
  basicLayout: basicLayout,
  messagePassThroughLayout: messagePassThroughLayout,
  patternLayout: patternLayout,
  colouredLayout: colouredLayout,
  coloredLayout: colouredLayout,
  dummyLayout: dummyLayout,
  addLayout: function(name, serializerGenerator) {
    layoutMakers[name] = serializerGenerator;
  },
  layout: function(name, config) {
    return layoutMakers[name] && layoutMakers[name](config);
  }
};

}).call(this,require('_process'))
},{"./date_format":7,"_process":13,"os":1,"semver":14,"util":17}],9:[function(require,module,exports){
"use strict";

function Level(level, levelStr) {
  this.level = level;
  this.levelStr = levelStr;
}

/**
 * converts given String to corresponding Level
 * @param {String} sArg String value of Level OR Log4js.Level
 * @param {Log4js.Level} defaultLevel default Level, if no String representation
 * @return Level object
 * @type Log4js.Level
 */
function toLevel(sArg, defaultLevel) {
  if (!sArg) {
    return defaultLevel;
  }
  if (sArg instanceof Level) {
    module.exports[sArg.toString()] = sArg;
    return sArg;
  }
  if (typeof sArg === "string") {
    return module.exports[sArg.toUpperCase()] || defaultLevel;
  }
  return toLevel(sArg.toString());
}

Level.prototype.toString = function() {
  return this.levelStr;
};

Level.prototype.isLessThanOrEqualTo = function(otherLevel) {
  if (typeof otherLevel === "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level <= otherLevel.level;
};

Level.prototype.isGreaterThanOrEqualTo = function(otherLevel) {
  if (typeof otherLevel === "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level >= otherLevel.level;
};

Level.prototype.isEqualTo = function(otherLevel) {
  if (typeof otherLevel === "string") {
    otherLevel = toLevel(otherLevel);
  }
  return this.level === otherLevel.level;
};

module.exports = {
  ALL: new Level(Number.MIN_VALUE, "ALL"),
  TRACE: new Level(5000, "TRACE"),
  DEBUG: new Level(10000, "DEBUG"),
  INFO: new Level(20000, "INFO"),
  WARN: new Level(30000, "WARN"),
  ERROR: new Level(40000, "ERROR"),
  FATAL: new Level(50000, "FATAL"),
  MARK: new Level(9007199254740992, "MARK"), // 2^53
  OFF: new Level(Number.MAX_VALUE, "OFF"),
  toLevel: toLevel,
  Level: Level
};

},{}],10:[function(require,module,exports){
(function (process){
"use strict";
/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview log4js is a library to log in JavaScript in similar manner
 * than in log4j for Java. The API should be nearly the same.
 *
 * <h3>Example:</h3>
 * <pre>
 *  var logging = require('log4js');
 *  //add an appender that logs all messages to stdout.
 *  logging.addAppender(logging.consoleAppender());
 *  //add an appender that logs "some-category" to a file
 *  logging.addAppender(logging.fileAppender("file.log"), "some-category");
 *  //get a logger
 *  var log = logging.getLogger("some-category");
 *  log.setLevel(logging.levels.TRACE); //set the Level
 *
 *  ...
 *
 *  //call the log
 *  log.trace("trace me" );
 * </pre>
 *
 * NOTE: the authors below are the original browser-based log4js authors
 * don't try to contact them about bugs in this version :)
 * @version 1.0
 * @author Stephan Strittmatter - http://jroller.com/page/stritti
 * @author Seth Chisamore - http://www.chisamore.com
 * @since 2005-05-20
 * @static
 * Website: http://log4js.berlios.de
 */
var events = require('events')
, fs = require('fs')
, path = require('path')
, util = require('util')
, layouts = require('./layouts')
, levels = require('./levels')
, loggerModule = require('./logger')
, LoggingEvent = loggerModule.LoggingEvent
, Logger = loggerModule.Logger
, ALL_CATEGORIES = '[all]'
, appenders = {}
, loggers = {}
, appenderMakers = {}
, appenderShutdowns = {}
, defaultConfig =   {
  appenders: [
    { type: "console" }
  ],
  replaceConsole: false
};

require('./appenders/console');

function hasLogger(logger) {
  return loggers.hasOwnProperty(logger);
}

levels.forName = function(levelStr, levelVal) {
  var level;
  if (typeof levelStr === "string" && typeof levelVal === "number") {
    var levelUpper = levelStr.toUpperCase();
    level = new levels.Level(levelVal, levelUpper);
    loggerModule.addLevelMethods(level);
  }
  return level;
};

levels.getLevel = function(levelStr) {
  var level;
  if (typeof levelStr === "string") {
    var levelUpper = levelStr.toUpperCase();
    level = levels.toLevel(levelStr);
  }
  return level;
};

function getBufferedLogger(categoryName) {
    var base_logger = getLogger(categoryName);
    var logger = {};
    logger.temp = [];
    logger.target = base_logger;
    logger.flush = function () {
        for (var i = 0; i < logger.temp.length; i++) {
            var log = logger.temp[i];
            logger.target[log.level](log.message);
            delete logger.temp[i];
        }
    };
    logger.trace = function (message) { logger.temp.push({level: 'trace', message: message}); };
    logger.debug = function (message) { logger.temp.push({level: 'debug', message: message}); };
    logger.info = function (message) { logger.temp.push({level: 'info', message: message}); };
    logger.warn = function (message) { logger.temp.push({level: 'warn', message: message}); };
    logger.error = function (message) { logger.temp.push({level: 'error', message: message}); };
    logger.fatal = function (message) { logger.temp.push({level: 'fatal', message: message}); };

    return logger;
}

function normalizeCategory (category) {
  return  category + '.';
}

function doesLevelEntryContainsLogger (levelCategory, loggerCategory) {  
  var normalizedLevelCategory = normalizeCategory(levelCategory);
  var normalizedLoggerCategory = normalizeCategory(loggerCategory);
  return normalizedLoggerCategory.substring(0, normalizedLevelCategory.length) == normalizedLevelCategory; //jshint ignore:line
}

function doesAppenderContainsLogger (appenderCategory, loggerCategory) {
  var normalizedAppenderCategory = normalizeCategory(appenderCategory);
  var normalizedLoggerCategory = normalizeCategory(loggerCategory);
  return normalizedLoggerCategory.substring(0, normalizedAppenderCategory.length) == normalizedAppenderCategory; //jshint ignore:line
}


/**
 * Get a logger instance. Instance is cached on categoryName level.
 * @param  {String} categoryName name of category to log to.
 * @return {Logger} instance of logger for the category
 * @static
 */
function getLogger (loggerCategoryName) {

  // Use default logger if categoryName is not specified or invalid
  if (typeof loggerCategoryName !== "string") {
    loggerCategoryName = Logger.DEFAULT_CATEGORY;
  }

  if (!hasLogger(loggerCategoryName)) {

    var level;

    /* jshint -W073 */
    // If there's a "levels" entry in the configuration
    if (levels.config) {
      // Goes through the categories in the levels configuration entry,
      // starting with the "higher" ones.
      var keys = Object.keys(levels.config).sort();
      for (var idx = 0; idx < keys.length; idx++) {
        var levelCategory = keys[idx];
        if (doesLevelEntryContainsLogger(levelCategory, loggerCategoryName)) {
          // level for the logger
          level = levels.config[levelCategory];
        }
      }
    }
    /* jshint +W073 */
  
    // Create the logger for this name if it doesn't already exist
    loggers[loggerCategoryName] = new Logger(loggerCategoryName, level);

    /* jshint -W083 */
    var appenderList;
    for(var appenderCategory in appenders) {
      if (doesAppenderContainsLogger(appenderCategory, loggerCategoryName)) {
        appenderList = appenders[appenderCategory];
        appenderList.forEach(function(appender) {
          loggers[loggerCategoryName].addListener("log", appender);
        });
      }
    }
    /* jshint +W083 */

    if (appenders[ALL_CATEGORIES]) {
      appenderList = appenders[ALL_CATEGORIES];
      appenderList.forEach(function(appender) {
        loggers[loggerCategoryName].addListener("log", appender);
      });
    }
  }
  
  return loggers[loggerCategoryName];
}

/**
 * args are appender, then zero or more categories
 */
function addAppender () {
  var args = Array.prototype.slice.call(arguments);
  var appender = args.shift();
  if (args.length === 0 || args[0] === undefined) {
    args = [ ALL_CATEGORIES ];
  }
  //argument may already be an array
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  
  args.forEach(function(appenderCategory) {
    addAppenderToCategory(appender, appenderCategory);
    
    if (appenderCategory === ALL_CATEGORIES) {
      addAppenderToAllLoggers(appender);
    } else {

      for(var loggerCategory in loggers) {
        if (doesAppenderContainsLogger(appenderCategory,loggerCategory)) {
          loggers[loggerCategory].addListener("log", appender);
        }
      }
      
    }
  });
}

function addAppenderToAllLoggers(appender) {
  for (var logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].addListener("log", appender);
    }
  }
}

function addAppenderToCategory(appender, category) {
  if (!appenders[category]) {
    appenders[category] = [];
  }
  appenders[category].push(appender);
}

function clearAppenders () {
  appenders = {};
  for (var logger in loggers) {
    if (hasLogger(logger)) {
      loggers[logger].removeAllListeners("log");
    }
  }
}

function configureAppenders(appenderList, options) {
  clearAppenders();
  if (appenderList) {
    appenderList.forEach(function(appenderConfig) {
      loadAppender(appenderConfig.type);
      var appender;
      appenderConfig.makers = appenderMakers;
      try {
        appender = appenderMakers[appenderConfig.type](appenderConfig, options);
        addAppender(appender, appenderConfig.category);
      } catch(e) {
        throw new Error("log4js configuration problem for " + util.inspect(appenderConfig), e);
      }
    });
  }
}

function configureLevels(_levels) {
  levels.config = _levels; // Keep it so we can create loggers later using this cfg
  if (_levels) {
    var keys = Object.keys(levels.config).sort();
    for (var idx in keys) {
      var category = keys[idx];
      if(category === ALL_CATEGORIES) {
        setGlobalLogLevel(_levels[category]);
      }
      /* jshint -W073 */
      for(var loggerCategory in loggers) {
        if (doesLevelEntryContainsLogger(category, loggerCategory)) {
          loggers[loggerCategory].setLevel(_levels[category]);
        }
      }
      /* jshint +W073 */
    }
  }
}

function setGlobalLogLevel(level) {
  Logger.prototype.level = levels.toLevel(level, levels.TRACE);
}

/**
 * Get the default logger instance.
 * @return {Logger} instance of default logger
 * @static
 */
function getDefaultLogger () {
  return getLogger(Logger.DEFAULT_CATEGORY);
}

var configState = {};

function loadConfigurationFile(filename) {
  if (filename) {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  }
  return undefined;
}

function configureOnceOff(config, options) {
  if (config) {
    try {
      configureLevels(config.levels);
      configureAppenders(config.appenders, options);
      
      if (config.replaceConsole) {
        replaceConsole();
      } else {
        restoreConsole();
      }
    } catch (e) {
      throw new Error(
        "Problem reading log4js config " + util.inspect(config) + 
          ". Error was \"" + e.message + "\" (" + e.stack + ")"
      );
    }
  }
}

function reloadConfiguration(options) {
  var mtime = getMTime(configState.filename);
  if (!mtime) return;
  
  if (configState.lastMTime && (mtime.getTime() > configState.lastMTime.getTime())) {
    configureOnceOff(loadConfigurationFile(configState.filename), options);
  }
  configState.lastMTime = mtime;
}

function getMTime(filename) {
  var mtime;
  try {
    mtime = fs.statSync(configState.filename).mtime;
  } catch (e) {
    getLogger('log4js').warn('Failed to load configuration file ' + filename);
  }
  return mtime;
}

function initReloadConfiguration(filename, options) {
  if (configState.timerId) {
    clearInterval(configState.timerId);
    delete configState.timerId;
  }
  configState.filename = filename;
  configState.lastMTime = getMTime(filename);
  configState.timerId = setInterval(reloadConfiguration, options.reloadSecs*1000, options);
}

function configure(configurationFileOrObject, options) {
  var config = configurationFileOrObject;
  config = config || process.env.LOG4JS_CONFIG;
  options = options || {};
  
  if (config === undefined || config === null || typeof(config) === 'string') {
    if (options.reloadSecs) {
      initReloadConfiguration(config, options);
    }
    config = loadConfigurationFile(config) || defaultConfig;
  } else {
    if (options.reloadSecs) {
      getLogger('log4js').warn(
        'Ignoring configuration reload parameter for "object" configuration.'
      );
    }
  }
  configureOnceOff(config, options);
}

var originalConsoleFunctions = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

function replaceConsole(logger) {
  function replaceWith(fn) {
    return function() {
      fn.apply(logger, arguments);
    };
  }
  logger = logger || getLogger("console");
  ['log','debug','info','warn','error'].forEach(function (item) {
    console[item] = replaceWith(item === 'log' ? logger.info : logger[item]);
  });
}

function restoreConsole() {
  ['log', 'debug', 'info', 'warn', 'error'].forEach(function (item) {
    console[item] = originalConsoleFunctions[item];
  });
}

/**
 * Load an appenderModule based on the provided appender filepath. Will first
 * check if the appender path is a subpath of the log4js "lib/appenders" directory.
 * If not, it will attempt to load the the appender as complete path.
 *
 * @param {string} appender The filepath for the appender.
 * @returns {Object|null} The required appender or null if appender could not be loaded.
 * @private
 */
function requireAppender(appender) {
  var appenderModule;
  try {
    appenderModule = require('./appenders/' + appender);
  } catch (e) {
    appenderModule = require(appender);
  }
  return appenderModule;
}

/**
 * Load an appender. Provided the appender path to be loaded. If appenderModule is defined,
 * it will be used in place of requiring the appender module.
 *
 * @param {string} appender The path to the appender module.
 * @param {Object|void} [appenderModule] The pre-required appender module. When provided,
 * instead of requiring the appender by its path, this object will be used.
 * @returns {void}
 * @private
 */
function loadAppender(appender, appenderModule) {
  appenderModule = appenderModule || requireAppender(appender);

  if (!appenderModule) {
    throw new Error("Invalid log4js appender: " + util.inspect(appender));
  }

  module.exports.appenders[appender] = appenderModule.appender.bind(appenderModule);
  if (appenderModule.shutdown) {
    appenderShutdowns[appender] = appenderModule.shutdown.bind(appenderModule);
  }
  appenderMakers[appender] = appenderModule.configure.bind(appenderModule);
}

/**
 * Shutdown all log appenders. This will first disable all writing to appenders
 * and then call the shutdown function each appender.
 *
 * @params {Function} cb - The callback to be invoked once all appenders have
 *  shutdown. If an error occurs, the callback will be given the error object
 *  as the first argument.
 * @returns {void}
 */
function shutdown(cb) {
  // First, disable all writing to appenders. This prevents appenders from
  // not being able to be drained because of run-away log writes.
  loggerModule.disableAllLogWrites();

  // Call each of the shutdown functions in parallel
  var completed = 0;
  var error;
  var shutdownFcts = [];
  var complete = function(err) {
    error = error || err;
    completed++;
    if (completed >= shutdownFcts.length) {
      cb(error);
    }
  };
  for (var category in appenderShutdowns) {
    if (appenderShutdowns.hasOwnProperty(category)) {
      shutdownFcts.push(appenderShutdowns[category]);
    }
  }
  if (!shutdownFcts.length) {
    return cb();
  }
  shutdownFcts.forEach(function(shutdownFct) { shutdownFct(complete); });
}

module.exports = {
  getBufferedLogger: getBufferedLogger,
  getLogger: getLogger,
  getDefaultLogger: getDefaultLogger,
  hasLogger: hasLogger,
  
  addAppender: addAppender,
  loadAppender: loadAppender,
  clearAppenders: clearAppenders,
  configure: configure,
  shutdown: shutdown,
  
  replaceConsole: replaceConsole,
  restoreConsole: restoreConsole,
  
  levels: levels,
  setGlobalLogLevel: setGlobalLogLevel,
  
  layouts: layouts,
  appenders: {},
  appenderMakers: appenderMakers,
  connectLogger: require('./connect-logger').connectLogger
};

//set ourselves up
configure();

}).call(this,require('_process'))
},{"./appenders/console":5,"./connect-logger":6,"./layouts":8,"./levels":9,"./logger":11,"_process":13,"events":3,"fs":2,"path":12,"util":17}],11:[function(require,module,exports){
"use strict";
var levels = require('./levels')
, util = require('util')
, events = require('events')
, DEFAULT_CATEGORY = '[default]';

var logWritesEnabled = true;

/**
 * Models a logging event.
 * @constructor
 * @param {String} categoryName name of category
 * @param {Log4js.Level} level level of message
 * @param {Array} data objects to log
 * @param {Log4js.Logger} logger the associated logger
 * @author Seth Chisamore
 */
function LoggingEvent (categoryName, level, data, logger) {
  this.startTime = new Date();
  this.categoryName = categoryName;
  this.data = data;
  this.level = level;
  this.logger = logger;
}

/**
 * Logger to log messages.
 * use {@see Log4js#getLogger(String)} to get an instance.
 * @constructor
 * @param name name of category to log to
 * @author Stephan Strittmatter
 */
function Logger (name, level) {
  this.category = name || DEFAULT_CATEGORY;

  if (level) {
    this.setLevel(level);
  }
}
util.inherits(Logger, events.EventEmitter);
Logger.DEFAULT_CATEGORY = DEFAULT_CATEGORY;
Logger.prototype.level = levels.TRACE;

Logger.prototype.setLevel = function(level) {
  this.level = levels.toLevel(level, this.level || levels.TRACE);
};

Logger.prototype.removeLevel = function() {
  delete this.level;
};

Logger.prototype.log = function() {
  var logLevel = levels.toLevel(arguments[0], levels.INFO);
  if (!this.isLevelEnabled(logLevel)) {
    return;
  }
  var numArgs = arguments.length - 1;
  var args = new Array(numArgs);
  for (var i = 0; i < numArgs; i++) {
    args[i] = arguments[i + 1];
  }
  this._log(logLevel, args);
};

Logger.prototype.isLevelEnabled = function(otherLevel) {
  return this.level.isLessThanOrEqualTo(otherLevel);
};

['Trace','Debug','Info','Warn','Error','Fatal', 'Mark'].forEach(
  function(levelString) {
    addLevelMethods(levelString);
  }
);

function addLevelMethods(level) {
  level = levels.toLevel(level);

  var levelStrLower = level.toString().toLowerCase();
  var levelMethod = levelStrLower.replace(/_([a-z])/g, function(g) { return g[1].toUpperCase(); } );
  var isLevelMethod = levelMethod[0].toUpperCase() + levelMethod.slice(1);

  Logger.prototype['is'+isLevelMethod+'Enabled'] = function() {
    return this.isLevelEnabled(level.toString());
  };

  Logger.prototype[levelMethod] = function () {
    if (logWritesEnabled && this.isLevelEnabled(level)) {
      var numArgs = arguments.length;
      var args = new Array(numArgs);
      for (var i = 0; i < numArgs; i++) {
        args[i] = arguments[i];
      }
      this._log(level, args);
    }
  };
}

Logger.prototype._log = function(level, data) {
  var loggingEvent = new LoggingEvent(this.category, level, data, this);
  this.emit('log', loggingEvent);
};

/**
 * Disable all log writes.
 * @returns {void}
 */
function disableAllLogWrites() {
  logWritesEnabled = false;
}

/**
 * Enable log writes.
 * @returns {void}
 */
function enableAllLogWrites() {
  logWritesEnabled = true;
}

exports.LoggingEvent = LoggingEvent;
exports.Logger = Logger;
exports.disableAllLogWrites = disableAllLogWrites;
exports.enableAllLogWrites = enableAllLogWrites;
exports.addLevelMethods = addLevelMethods;
},{"./levels":9,"events":3,"util":17}],12:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":13}],13:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],14:[function(require,module,exports){
;(function(exports) {

// export the class if we are in a Node-like system.
if (typeof module === 'object' && module.exports === exports)
  exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[PRERELEASE] + ')?' +
                   src[BUILD] + '?' +
                   ')?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[PRERELEASELOOSE] + ')?' +
                        src[BUILD] + '?' +
                        ')?)?';

var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';


// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  ;
  if (!re[i])
    re[i] = new RegExp(src[i]);
}

exports.parse = parse;
function parse(version, loose) {
  if (version instanceof SemVer)
    return version;

  if (typeof version !== 'string')
    return null;

  if (version.length > MAX_LENGTH)
    return null;

  var r = loose ? re[LOOSE] : re[FULL];
  if (!r.test(version))
    return null;

  try {
    return new SemVer(version, loose);
  } catch (er) {
    return null;
  }
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      return version;
    else
      version = version.version;
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (version.length > MAX_LENGTH)
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')

  if (!(this instanceof SemVer))
    return new SemVer(version, loose);

  ;
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    throw new TypeError('Invalid Version: ' + version);

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
    throw new TypeError('Invalid major version')

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
    throw new TypeError('Invalid minor version')

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
    throw new TypeError('Invalid patch version')

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id
        if (num >= 0 && num < MAX_SAFE_INTEGER)
          return num
      }
      return id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    this.version += '-' + this.prerelease.join('.');
  return this.version;
};

SemVer.prototype.inspect = function() {
  return '<SemVer "' + this + '">';
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  ;
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    return -1;
  else if (!this.prerelease.length && other.prerelease.length)
    return 1;
  else if (!this.prerelease.length && !other.prerelease.length)
    return 0;

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    ;
    if (a === undefined && b === undefined)
      return 0;
    else if (b === undefined)
      return 1;
    else if (a === undefined)
      return -1;
    else if (a === b)
      continue;
    else
      return compareIdentifiers(a, b);
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break;
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break;
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0)
        this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
        this.major++;
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0)
        this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        this.patch++;
      this.prerelease = [];
      break;
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        this.prerelease = [0];
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          this.prerelease.push(0);
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1]))
            this.prerelease = [identifier, 0];
        } else
          this.prerelease = [identifier, 0];
      }
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  return this;
};

exports.inc = inc;
function inc(version, release, loose, identifier) {
  if (typeof(loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (er) {
    return null;
  }
}

exports.diff = diff;
function diff(version1, version2) {
  if (eq(version1, version2)) {
    return null;
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    if (v1.prerelease.length || v2.prerelease.length) {
      for (var key in v1) {
        if (key === 'major' || key === 'minor' || key === 'patch') {
          if (v1[key] !== v2[key]) {
            return 'pre'+key;
          }
        }
      }
      return 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return key;
        }
      }
    }
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return (anum && !bnum) ? -1 :
         (bnum && !anum) ? 1 :
         a < b ? -1 :
         a > b ? 1 :
         0;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

exports.major = major;
function major(a, loose) {
  return new SemVer(a, loose).major;
}

exports.minor = minor;
function minor(a, loose) {
  return new SemVer(a, loose).minor;
}

exports.patch = patch;
function patch(a, loose) {
  return new SemVer(a, loose).patch;
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(b);
}

exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}

exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

exports.sort = sort;
function sort(list, loose) {
  return list.sort(function(a, b) {
    return exports.compare(a, b, loose);
  });
}

exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort(function(a, b) {
    return exports.rcompare(a, b, loose);
  });
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.neq = neq;
function neq(a, b, loose) {
  return compare(a, b, loose) !== 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case '===':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a === b;
      break;
    case '!==':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a !== b;
      break;
    case '': case '=': case '==': ret = eq(a, b, loose); break;
    case '!=': ret = neq(a, b, loose); break;
    case '>': ret = gt(a, b, loose); break;
    case '>=': ret = gte(a, b, loose); break;
    case '<': ret = lt(a, b, loose); break;
    case '<=': ret = lte(a, b, loose); break;
    default: throw new TypeError('Invalid operator: ' + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, loose) {
  if (comp instanceof Comparator) {
    if (comp.loose === loose)
      return comp;
    else
      comp = comp.value;
  }

  if (!(this instanceof Comparator))
    return new Comparator(comp, loose);

  ;
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    this.value = '';
  else
    this.value = this.operator + this.semver.version;

  ;
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  if (this.operator === '=')
    this.operator = '';

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else
    this.semver = new SemVer(m[2], this.loose);
};

Comparator.prototype.inspect = function() {
  return '<SemVer Comparator "' + this + '">';
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  ;

  if (this.semver === ANY)
    return true;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  return cmp(version, this.operator, this.semver, this.loose);
};


exports.Range = Range;
function Range(range, loose) {
  if ((range instanceof Range) && range.loose === loose)
    return range;

  if (!(this instanceof Range))
    return new Range(range, loose);

  this.loose = loose;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
    return this.parseRange(range.trim());
  }, this).filter(function(c) {
    // throw out any that are not relevant for whatever reason
    return c.length;
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range);
  }

  this.format();
}

Range.prototype.inspect = function() {
  return '<SemVer Range "' + this.range + '">';
};

Range.prototype.format = function() {
  this.range = this.set.map(function(comps) {
    return comps.join(' ').trim();
  }).join('||').trim();
  return this.range;
};

Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.loose;
  range = range.trim();
  ;
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  ;
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  ;

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function(comp) {
    return parseComparator(comp, loose);
  }).join(' ').split(/\s+/);
  if (this.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, loose);
  });

  return set;
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators(range, loose) {
  return new Range(range, loose).set.map(function(comp) {
    return comp.map(function(c) {
      return c.value;
    }).join(' ').trim().split(' ');
  });
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, loose) {
  ;
  comp = replaceCarets(comp, loose);
  ;
  comp = replaceTildes(comp, loose);
  ;
  comp = replaceXRanges(comp, loose);
  ;
  comp = replaceStars(comp, loose);
  ;
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === 'x' || id === '*';
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceTilde(comp, loose);
  }).join(' ');
}

function replaceTilde(comp, loose) {
  var r = loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p))
      // ~1.2 == >=1.2.0- <1.3.0-
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';

    ;
    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceCaret(comp, loose);
  }).join(' ');
}

function replaceCaret(comp, loose) {
  ;
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      else
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
    } else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0';
    } else {
      ;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
    }

    ;
    return ret;
  });
}

function replaceXRanges(comp, loose) {
  ;
  return comp.split(/\s+/).map(function(comp) {
    return replaceXRange(comp, loose);
  }).join(' ');
}

function replaceXRange(comp, loose) {
  comp = comp.trim();
  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    ;
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX)
      gtlt = '';

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // replace X with 0
      if (xm)
        m = 0;
      if (xp)
        p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<'
        if (xm)
          M = +M + 1
        else
          m = +m + 1
      }

      ret = gtlt + M + '.' + m + '.' + p;
    } else if (xm) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    }

    ;

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, loose) {
  ;
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '');
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  else if (tpr)
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  else
    to = '<=' + to;

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version)
    return false;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version))
      return true;
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      return false;
  }

  if (version.prerelease.length) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (var i = 0; i < set.length; i++) {
      ;
      if (set[i].semver === ANY)
        continue;

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch)
          return true;
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, loose) {
  try {
    range = new Range(range, loose);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, loose) {
  return versions.filter(function(version) {
    return satisfies(version, range, loose);
  }).sort(function(a, b) {
    return rcompare(a, b, loose);
  })[0] || null;
}

exports.validRange = validRange;
function validRange(range, loose) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, loose).range || '*';
  } catch (er) {
    return null;
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr(version, range, loose) {
  return outside(version, range, '<', loose);
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr(version, range, loose) {
  return outside(version, range, '>', loose);
}

exports.outside = outside;
function outside(version, range, hilo, loose) {
  version = new SemVer(version, loose);
  range = new Range(range, loose);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, loose)) {
    return false;
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function(comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0')
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, loose)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, loose)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
}

// Use the define() function if we're in AMD land
if (typeof define === 'function' && define.amd)
  define(exports);

})(
  typeof exports === 'object' ? exports :
  typeof define === 'function' && define.amd ? {} :
  semver = {}
);

},{}],15:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],16:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],17:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":16,"_process":13,"inherits":4}],18:[function(require,module,exports){
/**
 * @fileOverview board用做通信基类，被其他几大主板继承, 例如 orion, mcore, auriga, megaPi.
 * @author Hyman (hujinhong@makelbock.cc)
 */

var createDriver = require("../driver/index.js").create;
var CONFIG = require("./config");
var ValueWrapper = require("../core/value_wrapper");
var PromiseList = require("../core/promise");
var logger = require('../log/log4js').logger;
var utils = require("../core/utils");


function Board() {

}

Board.prototype.init = function(conf) {
    this.setDriver(conf.driver);
    logger.warn("Driver: " + conf.driver);
};

Board.prototype.setDriver = function(driver) {
    var that = this;
    this.driver = createDriver(driver);

    // get data from parse.
    this.driver.on('data', function(index, result) {
        that.sensorCallback(index, result);
    });

    this.driver.on('error', function(err) {
        logger.warn(err);
    });
};

/**
 * Get sensor's value.
 * @param  {String}   deviceType the sensor's type.
 * @param  {Object}   options    config options, such as port, slot etc.
 * @param  {Function} callback   the function to be excuted.
 */
Board.prototype.getSensorValue = function(deviceType, options, callback) {
    var params = {};
    params.deviceType = deviceType;
    params.callback = callback;
    params.port = options.port;
    params.slot = options.slot;
    var valueWrapper = new ValueWrapper();
    var index = PromiseList.add(deviceType, callback, valueWrapper);
    params.index = index;

    // 发送读取指令
    this._doGetSensorValue(params);

    if(CONFIG.OPEN_RESNET_MODE) {
        // 执行超时检测
        this._handlerCommandSendTimeout(params);
    }
    return valueWrapper;
};

Board.prototype._doGetSensorValue = function(params) {
    var that = this;
    this._readBlockStatus(params);

    // 模拟回复指令
    // setTimeout(function() {
    //     var result = 1000;
    //     that.sensorCallback(params.index, result);
    // }, 200);
};

/**
 * Read module's value.
 * @param  {object} params command params.
 */
Board.prototype._readBlockStatus = function(params) {
    var deviceType = params.deviceType;
    var index = params.index;
    var port = params.port;
    var slot = params.slot || null;
    var funcName = 'this.read' + utils.upperCaseFirstLetter(deviceType);
    var paramsStr = '(' + index + ',' + port + ',' + slot + ')';
    var func = funcName + paramsStr;
    eval(func);
};

/**
 * Command sending timeout handler.
 * @param  {Object} params params.
 */
Board.prototype._handlerCommandSendTimeout = function(params) {
    var that = this;
    var promiseItem = PromiseList.requestList[params.index];
    setTimeout(function() {
        if(promiseItem.hasReceivedValue) {
            // 成功拿到数据，不进行处理
            return;
        } else {
            // 超过规定的时间，还没有拿到数据，需要进行超时重发处理
            if(promiseItem.resentCount >= CONFIG.RESENT_COUNT) {
                // 如果重发的次数大于规定次数,则终止重发
                console.log("【resend ends】");
                return;
            } else {
                console.log('【resend】:' + params.index);
                promiseItem.resentCount  = promiseItem.resentCount || 0;
                promiseItem.resentCount++;
                that._doGetSensorValue(params);
                that._handlerCommandSendTimeout(params);
            }
        }
    }, CONFIG.COMMAND_SEND_TIMEOUT);
};

/**
 * Send sensor's data.
 * @param  {[type]} command [description]
 */
Board.prototype.send = function(command) {
    console.log(utils.intStrToHexStr(command));
    this.driver.send(command);
};

/**
 * Get value form sensor and put the value to user's callback.
 * @param  {Number} index  the index of sensor's request command in promiseList
 * @param  {Number} result the value of sensor.
 */
Board.prototype.sensorCallback = function(index, result) {
    var deviceType = PromiseList.getType(index);
    logger.warn(deviceType + ": " + result);
    PromiseList.receiveValue(index, result);
};


module.exports = Board;
},{"../core/promise":21,"../core/utils":22,"../core/value_wrapper":23,"../driver/index.js":26,"../log/log4js":29,"./config":19}],19:[function(require,module,exports){
var Config = {
    // whether open console.log
    OPEN_LOG: false,
    // 开启超时重发
    OPEN_RESNET_MODE: false,
    // 超时重发的次数
    RESENT_COUNT : 3,
    // 读值指令超时的设定
    COMMAND_SEND_TIMEOUT : 2000,
};

module.exports = Config;
},{}],20:[function(require,module,exports){
/**
 * @fileOverview 负责实际的数据解析
 */

var SETTINGS = require("../protocol/settings");
var PromiseList = require("./promise");
var logger = require('../log/log4js').logger;

function Parse() {
    this.buffer = [];

    // 解析从硬件传递过来的数据
    this.doParse = function(bufData, driver) {
        logger.debug(bufData);

        var bytes = bufData;
        for (var i = 0; i < bytes.length; i++) {
            this.buffer.push(bytes[i]);
            var length = this.buffer.length;
            // 过滤无效数据
            if (length > 1 && this.buffer[length - 2] == SETTINGS.COMMAND_END[0] && this.buffer[length - 1] == SETTINGS.COMMAND_END[1]) {
                if (this.buffer.length != 10) {
                    this.buffer = [];
                } else {
                    /* 以下为有效数据 */

                    // 获取返回字节流中的索引位
                    var dataIndex = this.buffer[SETTINGS.READ_BYTES_INDEX];
                    var result = this.getResult(this.buffer);
                    logger.debug(result);

                    // 接收到数据后，启用回调
                    if (driver._on_data) {
                        driver._on_data(dataIndex, result);
                    } else {
                        logger.warn("driver data callback not found!");
                    }
                    this.buffer = [];
                }
            }
        }
    };

    /**
     * Get result from buffer data.
     * @param  {Array} bufArray buffer data
     * @return {Float}         value of sensor's callback
     * 回复数据数值解析, 从左到右第四位数据：
     *     1: 单字符(1 byte)
     *     2： float(4 byte)
     *     3： short(2 byte)，16个长度
     *     4： 字符串
     *     5： double(4 byte)
     *     6: long(4 byte)
     */
    this.getResult = function(bufArray) {
        var value = null;
        var len = bufArray.length;
        var dataType = bufArray[3];

        if(bufArray[len - 1] == SETTINGS.COMMAND_END[1] && (bufArray[len - 2] == SETTINGS.COMMAND_END[0])) {

            if(dataType == 3) {
                // 2byte
                var a = bufArray.slice(len - 4, len - 2).join(" ");
                value = this.calculate(a);
            } else if(dataType == 1) {
                // 1byte
                var a = bufArray.slice(len - 3, len - 2).join(" ");
                value = this.calculate(a);
            } else if( dataType == 4) {
                // chart
                var endIndex = 5 + parseInt(bufArray[4]);
                value = bufArray.toString('utf8', 5, endIndex);

            } else {
                // 4byte
                var a = bufArray.slice(len - 6, len - 2).join(" ");
                value = this.calculate(a);
            }
        }
        return value;
    };

    /**
     * Calcute result form buffer segment.
     * @param  {[type]} bufferPart [description]
     * @return {float}            [description]
     */
    this.calculate = function(bufSegment) {
        var result = this.intArray2float(bufSegment);
        return result;
    };

     /**
     * Transfer short type data to float number.
     * @param  {array} intArray decimal array
     * @return {float} the calculate result
     */
    this.intArray2float = function(intArray) {
        // FIXME: n个byte转成int值
        var bytesToInt = function(intArray) {
            var val = 0;
            for(var i = intArray.length - 1; i >= 0; i--) {
                val += (intArray[intArray.length - i - 1] << (i * 8) );
            }
            return val;
        };
        // FIXME: int字节转浮点型
        var intBitsToFloat = function(num) {
            /* s 为符号（sign）；e 为指数（exponent）；m 为有效位数（mantissa）*/
            s = (num >> 31) == 0 ? 1 : -1,
                e = (num >> 23) & 0xff,
                m = (e == 0) ?
                (num & 0x7fffff) << 1 :
                (num & 0x7fffff) | 0x800000;
            return s * m * Math.pow(2, e - 150);
        };
        var intValue = bytesToInt(intArray);
        var result = parseFloat(intBitsToFloat(intValue).toFixed(2));
        return result;
    };
}

module.exports = Parse;
},{"../log/log4js":29,"../protocol/settings":35,"./promise":21}],21:[function(require,module,exports){
/**
 * @fileOverview PromiveList is sensor data's transfer station.
 * 用于处理传感器数据分发
 */

var logger = require('../log/log4js').logger;

var PromiseList = {
    requestList: new Array(255),
    index: 1,

    add: function(type, callback, valueWrapper) {
        this.index++;
        if (this.index > 254) {
            this.index = 1;
        }
        this.requestList[this.index] = {
            type: type,
            callback: callback,
            valueWrapper: valueWrapper,
            hasReceivedValue: false,
            resentCount: 0
        };
        return this.index;
    },

    // 将值写到对应请求的值对象中，并且启动回调
    receiveValue: function(index, value) {
        var that = this;
        if (this.requestList[index]) {
            this.requestList[index].callback(value);
            this.requestList[index].valueWrapper.setValue(value);
            this.requestList[index].hasReceivedValue = true;
        }
    },

    getType: function(index) {
        if(this.requestList[index]) {
            return this.requestList[index].type;
        } else {
            logger.debug("返回字节的索引值无法匹配");
            return 0;
        }
    }
};


module.exports = PromiseList;
},{"../log/log4js":29}],22:[function(require,module,exports){
/**
 * @fileOverview 工具类函数
 */

var Utils = {
    /**
     * Convert array of int to ArrayBuffer.
     * @param  {[int]} data array of int
     * @return {ArrayBuffer}      result array buffer
     * @private
     */
    arrayBufferFromArray : function(data){
      var buffer = new ArrayBuffer(data.length);
      var result = new Int8Array(buffer);
      for (var i=0; i < data.length; i++){
        result[i] = data[i];
      }
      return buffer;
    },

    /**
     * Convert ArrayBuffer from array of int
     * @param  {ArrayBuffer} buffer the source arraybuffer
     * @return {[int]}        int array as the result;
     * @private
     */
    arrayFromArrayBuffer : function(buffer){
        var dataView = new Uint8Array(buffer);
        var result = [];
        for(var i=0;i<dataView.length;i++){
            result.push(dataView[i]);
        }
        return result;
    },

    /**
     * [buffer2string converts array buffer to string format]
     * @param  {ArrayBuffer} buf [the input array buffer]
     * @return {String}     [the output string]
     */
    buffer2string: function(buf) {
      var buffer = new Uint8Array(buf);
      return Array.prototype.join.call(buffer, " ");
    },

    /**
     * [string2buffer converts string to array buffer format]
     * @param  {String} str [the input string]
     * @return {Uint8Array}     [the output uint8 array buffer]
     */
    string2buffer: function(str) {
      var buffer = new Uint8Array(str.split(" "));
      return buffer;
    },

    // 将十进制字符串数组转为16进制
    intStrToHexStr: function(data) {
        var temp = [];
        for(var i = 0; i < data.length; i++) {
            if(data[i] != null) {
                var item =  parseInt(data[i]).toString(16);
                if(item.length == 1) {
                    item = "0" + item;
                }
                temp.push(item);
            }
        }
        return temp.join(" ");
    },

    // 十六进制字符串转成十进制
    hexStr2IntArray: function(str) {
        var a = str.split(" ");
        var arr = [];
        for(var i in a) {
            var num = parseInt(a[i], 16);
            arr.push(num);
        }
        arr.reverse();
        console.log(arr);
        return arr;
    },

    /**
     * Float to bytes.
     * 现将float转成整形，再将整形转成字节表示
     * @param  {float} float number
     * @return {bytes}
     */
    float32ToBytes: function(value) {
        // TOFIX: hack
        if(value == 0) {
            return [0,0,0,0];
        }
        var bytesInt = 0;
        switch (value) {
            case Number.POSITIVE_INFINITY: bytesInt = 0x7F800000; break;
            case Number.NEGATIVE_INFINITY: bytesInt = 0xFF800000; break;
            case +0.0: bytesInt = 0x40000000; break;
            case -0.0: bytesInt = 0xC0000000; break;
            default:
                // if (Number.isNaN(value)) { bytesInt = 0x7FC00000; break; }

                if (value <= -0.0) {
                    bytesInt = 0x80000000;
                    value = -value;
                }

                var exponent = Math.floor(Math.log(value) / Math.log(2));
                var significand = ((value / Math.pow(2, exponent)) * 0x00800000) | 0;

                exponent += 127;
                if (exponent >= 0xFF) {
                    exponent = 0xFF;
                    significand = 0;
                } else if (exponent < 0) exponent = 0;

                bytesInt = bytesInt | (exponent << 23);
                bytesInt = bytesInt | (significand & ~(-1 << 23));
            break;
        }
        var bytesArray = this.int2BytesArray(bytesInt);
        return bytesArray;
    },

    /**
     * 整形转换成字节数组
     * @param  {number} value 整形
     * @return {array}  array数组
     */
    int2BytesArray: function(value) {
        var bytesArray = [];
        var b1 = (value & 0xff).toString(16);
        var b2 = ((value >> 8) & 0xff).toString(16);
        var b3 = ((value >> 16) & 0xff).toString(16);
        var b4 = ((value >> 24) & 0xff).toString(16);
        bytesArray.push(b1);
        bytesArray.push(b2);
        bytesArray.push(b3);
        bytesArray.push(b4);
        return bytesArray;
    },

    /**
     * 将单词的第一个字母转成大写
     * @param  {string} str string.
     * @return {string}     target string.
     */
    upperCaseFirstLetter: function(str) {
        var reg = /\b(\w)|\s(\w)/g;
        str = str.toLowerCase();
        return str.replace(reg, function(m){
            return m.toUpperCase();
        })
    }

}


module.exports = Utils;

},{}],23:[function(require,module,exports){
/**
 * 用来存值、取值
 * valueWrapper是一个拥有存值、取值的类，每一个对象都将拥有这两个方法。
 *
 * 用来储存“读取数据”block对数据的请求，使用valueWrapper来完成程序变量的临时替代
 * 在蓝牙返回数据之后设置真实的值，然后继续程序执行。
 * 最终目的：取到程序块中请求的值
 *
 * 该技巧利用了对象的引用类型的原理，对象的属性值存在内存的某一个位置，后面值改变，内存
 * 中的值即跟着改变。
 */
ValueWrapper = function() {

},
ValueWrapper.prototype.toString = function() {
    return this.val;
};

ValueWrapper.prototype.setValue = function(value) {
    this.val = value;
};


module.exports = ValueWrapper;
},{}],24:[function(require,module,exports){
/**
 * driver for makeblockHD APP(cordova ble bridge)
 */

var Driver = require('./driver');
var logger = require('../log/log4js').logger;

var utils = require('../core/utils');
var Parse = require('../core/parse');
var parse = new Parse();

var bufferToArrayBuffer = function(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
};

var driver = new Driver();

function CordovaBle() {
  'use strict';

  var self = this;
  var isConnected = false;
  var commServiceID = 'FFE1';
  var writeCharacteristicID = 'FFE3';
  var readCharacteristicID = 'FFE2';

  this._init = function() {
    if (ble && ble.connectedDeviceID) {
      ble.startNotification(ble.connectedDeviceID, commServiceID, readCharacteristicID, function(data) {
        var bufArray = utils.arrayFromArrayBuffer(data);
        // read success
        parse.doParse(bufArray, driver);

      }, function(err) {
        // read failure
        logger.warn('read error, ', err);
      });
    } else {
      // connection may lost
    }
  };

  /**
   * [_send sends array buffer to driver]
   * @param  {[Array]} buf [the buffer to send]
   * @return {[integer]}     [the actual byte length sent. -1 if send fails.]
   */
  this._send = function(buf) {

    if (ble && ble.connectedDeviceID) {
      ble.writeWithoutResponse(ble.connectedDeviceID, commServiceID,
        writeCharacteristicID, utils.arrayBufferFromArray(buf),
        function() {
          if(!isConnected) {
            self._init();
          }
          isConnected = true;
        },
        function(err) {
          logger.warn('write error, ', err);
          ble.stopNotification(ble.connectedDeviceID, commServiceID, readCharacteristicID);
          isConnected = false;
        }
      );
    }
  };
}

CordovaBle.prototype = driver;

module.exports = CordovaBle;
},{"../core/parse":20,"../core/utils":22,"../log/log4js":29,"./driver":25}],25:[function(require,module,exports){
/**
 * @fileOverview The driver base class.
 * 用于数据通信
 */
var logger = require('../log/log4js').logger;

function Driver() {
  var self = this;

  this._on_data = null;
  this._on_error = null;

  /**
   * [send interface]
   * @param  {[ArrayBuffer]} buf [the buffer to send]
   * @return {[integer]}     [the actual byte length sent. -1 if send fails.]
   */
  this.send = function(buf) {
    if (this._send) {
      return this._send(buf);
    }
  };

  /**
   * [event register]
   * @param  {String}   event    event type
   * @param  {Function} callback functino to be excuted.
   */
  this.on = function(event, callback) {
    switch (event) {
      case 'data':
        self._on_data = callback;
        break;
      case 'error':
        self._on_error = callback;
        break;
      default:
        logger.warn('unsupported event: ', event);
        break;
    }
  };
}

module.exports = Driver;

},{"../log/log4js":29}],26:[function(require,module,exports){
/**
 * package driver implements a variety of communicate drivers, eg serial, bluetooth ...
 */
var MakeBlockHD = require('./makeblock_hd');
var CordovaBle = require('./cordova');
// var Serial = require('./serial');
var mtester = require('./mtester');
var logger = require('../log/log4js').logger;
/**
 * [create the the driver factory method]
 * @param  {[string]} type [the driver type, 'serial', 'bluetooth', 'mock'] ('mock is only used for test')
 * @return {[driver object]}      [the driver object]
 */
function create(type) {
  'use strict';

  var driver = null;

  switch (type) {
    case 'serial':
      driver = new Serial();
      break;
    case 'mtester':
      driver = new Mtester();
      break;
    case 'makeblockhd':
      driver = new MakeBlockHD();
      break;
    case 'cordova':
      driver = new CordovaBle();
      break;
    default:
      logger.warn('unsupported driver: ', type);
      break;
  }
  if (driver._init) {
    driver._init();
  }

  return driver;
}

exports.create = create;

},{"../log/log4js":29,"./cordova":24,"./makeblock_hd":27,"./mtester":28}],27:[function(require,module,exports){
/**
 * driver for makeblockHD APP( js bridge)
 */

var Driver = require('./driver');
var driver = new Driver();

var Parse = require('../core/parse');
var parse = new Parse();

/**
 * [buffer2string converts array buffer to string format]
 * @param  {ArrayBuffer} buf [the input array buffer]
 * @return {String}     [the output string]
 */
function buffer2string(buf) {
  var buffer = new Uint8Array(buf);
  return Array.prototype.join.call(buffer, " ");
}

/**
 * [string2buffer converts string to array buffer format]
 * @param  {String} str [the input string]
 * @return {Uint8Array}     [the output uint8 array buffer]
 */
function string2buffer(str) {
  var buffer = new Uint8Array(str.split(" "));
  return buffer;
}

function MakeblockHD() {
  'use strict';

  var self = this;

  this._init = function() {

    // Read data
    if (window) {
      window.receiveBluetoothData = function(str) {
        var data = string2buffer(str);
        // parse buffer data
        parse.doParse(data, driver);
      };
    }
  };

  /**
   * [_send sends array buffer to driver]
   * @param  {[ArrayBuffer]} buf [the buffer to send]
   * @return {[integer]}     [the actual byte length sent. -1 if send fails.]
   */
  this._send = function(buf) {
    // Send data
    if(typeof TellNative != "undefined") {
        return TellNative.sendViaBluetooth(buffer2string(buf));
    }
  };


}

MakeblockHD.prototype = driver;

module.exports = MakeblockHD;

},{"../core/parse":20,"./driver":25}],28:[function(require,module,exports){
/**
 * driver for makeblockHD APP( js bridge)
 */

var Driver = require('./driver');
var driver = new Driver();

var Parse = require('../core/parse');
var parse = new Parse();

/**
 * [buffer2string converts array buffer to string format]
 * @param  {ArrayBuffer} buf [the input array buffer]
 * @return {String}     [the output string]
 */
function buffer2string(buf) {
  var buffer = new Uint8Array(buf);
  return Array.prototype.join.call(buffer, " ");
}

/**
 * [string2buffer converts string to array buffer format]
 * @param  {String} str [the input string]
 * @return {Uint8Array}     [the output uint8 array buffer]
 */
function string2buffer(str) {
  var buffer = new Uint8Array(str.split(" "));
  return buffer;
}

function Mtester() {
  'use strict';

  var self = this;

  this._init = function() {

    // Read data
    if (window) {
      window.receiveBluetoothData = function(str) {
        var data = string2buffer(str);
        // parse buffer data
        parse.doParse(data, driver);
      };
    }
  };

  /**
   * [_send sends array buffer to driver]
   * @param  {[ArrayBuffer]} buf [the buffer to send]
   * @return {[integer]}     [the actual byte length sent. -1 if send fails.]
   */
  this._send = function(buf) {
    // Send data
    if(Mtester && socket) {
      var mtest = new Mtester(socket);
      var bufStr = buffer2string(buf);
      mtest._sendRequest(bufStr);
    }
  };

}

MakeblockHD.prototype = driver;

module.exports = MakeblockHD;

},{"../core/parse":20,"./driver":25}],29:[function(require,module,exports){
var log4js = require('log4js');


log4js.configure({
  appenders: [
    { type: 'console' } //控制台输出
    ],
    replaceConsole: true
});

var logger = log4js.getLogger('engineLog');

function setLoglevel(level){
  logger.setLevel(level);
}

exports.setLoglevel = setLoglevel;
exports.logger = logger;

},{"log4js":10}],30:[function(require,module,exports){
var Board = require("../core/board");
var utils = require("../core/utils");
var SETTINGS = require("./settings");
var _ = require('underscore');

var board = new Board();

function Auriga(conf) {
    this._config = _.extend(SETTINGS.DEFAULT_CONF, conf || {});
    board.init(this._config);

    /**
     * Set dc motor speed.
     * @param {number} port  port number, vailable is: 1,2,3,4
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 06 00 02 0a 01 ff 00
     */
    this.setDcMotor = function(port, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06, 0,
            SETTINGS.WRITE_MODE,
            0x0a,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    },

    /**
     * Set encoder motor speed.
     * @param {number} slot  slot number, vailable is: 1,2
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 3d 00 01 64 00
     */
    this.setEncoderMotorBoard = function(slot, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x3d,
            0,
            slot,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set both left speed and right speed with one command.
     * @param {number} leftSpeed  left speed, the range is -255 ~ 255
     * @param {number} rightSpeed right speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 05 64 00 64 00
     */
    this.setVirtualJoystick = function(leftSpeed, rightSpeed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x05,
            leftSpeed & 0xff,
            (leftSpeed >> 8) & 0xff,
            rightSpeed & 0xff,
            (rightSpeed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set speed for balance mode.
     * @param {number} port       port number, the port on board id default 0
     * @param {number} turnDegree turn extend, -255 ~ 255
     * @param {number} speed      speed, -255 ~ 255
     * @example
     *     ff 55 08 00 02 34 00 64 00 64 00
     */
    this.setVirtualJoystickForBalance = function(port, turnExtent, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08, 0,
            SETTINGS.WRITE_MODE,
            0x34,
            turnExtent & 0xff,
            (turnExtent >> 8) & 0xff,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set stepper motor speed.
     * @param {[type]} port     port number, vailable is: 1,2,3,4
     * @param {[type]} speed    speed, the range is 0 ~ 3000
     * @param {[type]} distance distance, the range is -2147483648 ~ 2147483647
     * @example
     *     ff 55 0a 00 02 28 01 b8 0b e8 03 00 00
     */
    this.setStepperMotor = function(port, speed, distance) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x28,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff,
            distance & 0xff,
            (distance >> 8) & 0xff
        ];
        board.send(a);
    };

     /**
      * Set RgbFourLed electronic module color.
      * @param {number} port     port number, vailable is: 0(on board), 6,7,8,9,10
      * @param {number} slot     slot number, vailable is: 1,2
      * @param {number} position led position, 0 signify all leds.
      * @param {number} r        red, the range is 0 ~ 255
      * @param {number} g        green, the range is 0 ~ 255
      * @param {number} b        blue, the range is 0 ~ 255
      * @example
      *     ff 55 09 00 02 08 06 02 00 ff 00 00
      */
    this.setLed = function(port, slot, position, r, g, b) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x08,
            port,
            slot,
            position,red,green,blue
        ];
        board.send(a);
    };

    /**
     * Set board mode.
     * @param {number} mode board mode,
     *     0: bluetooth mode
     *     1: ultrasonic mode
     *     2: balance mode
     *     3: infrared mode
     *     4: linefollow mode
     * @example
     *     ff 55 05 00 02 3c 11 00
     */
    this.setFirmwareMode = function(mode) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x3c,
            0x11, // 0x11 means auriga
            mode
        ];
        board.send(a);
    };

    /**
     * Set Servo speed.
     * @param {[type]} port   port number, vailable is 6,7,8,9,10
     * @param {[type]} slot   slot number, vailable is 1,2
     * @param {[type]} degree servo degree, the range is 0 ~ 180
     */
    this.setServoMotor = function(port, slot, degree) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06,0,
            SETTINGS.WRITE_MODE,
            0x0b,
            port,
            slot,
            degree
        ];
        board.send(a);
    };

    /**
     * Set Seven-segment digital tube number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number  the number to be displayed
     * @exmpa
     *     ff 55 08 00 02 09 06 00 00 c8 42
     */
    this.setSevenSegment = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x09,
            port,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    /**
     * Set led matrix chart.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis  x position
     * @param {number} yAxis  y position
     * @param {number} length chart length
     * @param {string} chart  chart
     * @exmaple
     *     ff 55 0a 00 02 29 06 01 00 07 02 48 69
     */
    this.setLedMatrixChart = function(port, xAxis, yAxis, length, chart) {

    };


    /**
     * Set led matrix emotion.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis      x position
     * @param {number} yAxis      y position
     * @param {?} motionData emotion data to be displayed
     * @example
     *     ff 55 17 00 02 29 06 02 00 00 00 00 40 48 44 42 02 02 02 02 42 44 48 40 00 00
     */
    this.setLedMatrixEmotion = function(port, xAxis, yAxis, motionData) {

    };

    /**
     * Set led matrix time.
     * @param {number} separator time separator, 01 signify `:`, 02 signify ` `
     * @param {number} hour      hour number
     * @param {number} minute    minute number
     * @example
     *     ff 55 08 00 02 29 06 03 01 0a 14
     */
    this.setLedMatrixTime = function(separator, hour, minute) {

    };

    /**
     * Set led matrix number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number the number to be displayed
     * @exmaple
        ff 55 09 00 02 29 06 04 00 00 00 00
     */
    this.setLedMatrixNumber = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x29,
            port,
            0x04,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    this.readUltrasonic = function(index, port) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x01,
            port
        ];
        board.send(a);
    };
}


// clone method and attributes from board to Auriga.
Auriga.prototype = board;

if (typeof window !== "undefined") {
    window.Auriga = Auriga;
}

module.exports = Auriga;
},{"../core/board":18,"../core/utils":22,"./settings":35,"underscore":15}],31:[function(require,module,exports){
var Auriga = require("./auriga");
var Mcore = require("./mcore");
var Orion = require("./orion");
var MegaPi = require("./megapi");

window.Auriga = Auriga;
window.Mcore = Mcore;
window.Orion = Orion;
window.MegaPi = MegaPi;
},{"./auriga":30,"./mcore":32,"./megapi":33,"./orion":34}],32:[function(require,module,exports){
var Board = require("../core/board");
var utils = require("../core/utils");
var SETTINGS = require("./settings");
var _ = require('underscore');

var board = new Board();

function Mcore(conf) {
    this._config = _.extend(SETTINGS.DEFAULT_CONF, conf || {});
    board.init(this._config);

    /**
     * Set dc motor speed.
     * @param {number} port  port number, vailable is: 1,2,3,4
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 06 00 02 0a 01 ff 00
     */
    this.setDcMotor = function(port, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06, 0,
            SETTINGS.WRITE_MODE,
            0x0a,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set RgbFourLed electronic module color.
     * @param {number} port     port number, vailable is: 0(on board), 6,7,8,9,10
     * @param {number} slot     slot number, vailable is: 1,2
     * @param {number} position led position, 0 signify all leds.
     * @param {number} r        red, the range is 0 ~ 255
     * @param {number} g        green, the range is 0 ~ 255
     * @param {number} b        blue, the range is 0 ~ 255
     * @example
     *     ff 55 09 00 02 08 06 02 00 ff 00 00
     */
    this.setLed = function(port, slot, position, r, g, b) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x08,
            port,
            slot,
            position,red,green,blue
        ];
        board.send(a);
    };


    /**
     * Set Servo speed.
     * @param {[type]} port   port number, vailable is 6,7,8,9,10
     * @param {[type]} slot   slot number, vailable is 1,2
     * @param {[type]} degree servo degree, the range is 0 ~ 180
     */
    this.setServoMotor = function(port, slot, degree) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06,0,
            SETTINGS.WRITE_MODE,
            0x0b,
            port,
            slot,
            degree
        ];
        board.send(a);
    };

    /**
     * Set Seven-segment digital tube number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number  the number to be displayed
     * @exmpa
     *     ff 55 08 00 02 09 06 00 00 c8 42
     */
    this.setSevenSegment = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x09,
            port,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    /**
     * Set led matrix chart.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis  x position
     * @param {number} yAxis  y position
     * @param {number} length chart length
     * @param {string} chart  chart
     * @exmaple
     *     ff 55 0a 00 02 29 06 01 00 07 02 48 69
     */
    this.setLedMatrixChart = function(port, xAxis, yAxis, length, chart) {

    };


    /**
     * Set led matrix emotion.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis      x position
     * @param {number} yAxis      y position
     * @param {?} motionData emotion data to be displayed
     * @example
     *     ff 55 17 00 02 29 06 02 00 00 00 00 40 48 44 42 02 02 02 02 42 44 48 40 00 00
     */
    this.setLedMatrixEmotion = function(port, xAxis, yAxis, motionData) {

    };

    /**
     * Set led matrix time.
     * @param {number} separator time separator, 01 signify `:`, 02 signify ` `
     * @param {number} hour      hour number
     * @param {number} minute    minute number
     * @example
     *     ff 55 08 00 02 29 06 03 01 0a 14
     */
    this.setLedMatrixTime = function(separator, hour, minute) {

    };

    /**
     * Set led matrix number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number the number to be displayed
     * @exmaple
        ff 55 09 00 02 29 06 04 00 00 00 00
     */
    this.setLedMatrixNumber = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x29,
            port,
            0x04,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };
    /**
     * set Shutter action.
     * @param {[type]} port    number   vailable is 09
     * @param {[type]} actionType number vailable is: Shutter down(00)
        Shutter up(01)
        Begin to focus(02)
        stop focus(03)
        @example
          ff 55 05 00 02 14 06 02
     */
    this.setShutter = function(port,actionType){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x14,
            port,
            actionType
        ];
        board.send(a);
    };
    /**
     * set arduino Digital level.
     * @param {[type]} port  number   vailable is 09
     * @param {[type]} level number vailable is:low level(00)  high level(01)
     * @example
     *   ff 55 05 00 02 1e 09 01
     */
    this.setDigital = function(port,level ){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x1e,
            port,
            level
        ];
        board.send(a);
    };

    /**
     * set arduino pwm output
     * @param {[type]} port [description]
     * @param {[type]} pwm  number vailable is:0 ~ 255
     * @example
     *   ff 55 05 00 02 20 05 32
     */
    this.setPwm = function(port,pwm){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x20,
            port,
            pwm
        ];
        board.send(a);
    };

    /**
     * set buzzer play.
     * @param {[type]} port     vailable:  GPIO9
     * @param {[type]} tone     vailable: C2(65) ~ D8(4699)
     * @param {[type]} rhythmTime vailable:1/8(125)  ~  1/2(2000)
     * @example
     *  ff 55 08 00 02 22 09 41 00 f4 01
     */
    this.setTone = function(port,tone,rhythmTime){
        var byteTone= utils.int2BytesArray(tone);
        var byteRhythm= utils.int2BytesArray(rhythmTime);
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x22,
            port,
            byteTone[0],
            byteTone[1],
            byteRhythm[0],
            byteRhythm[1]
        ];
        board.send(a);
    };


    /**
     * set Servo.
     * @param {[type]} port  vailable:GPIO9
     * @param {[type]} angle vailable:0 ~ 180
     * @example
     * ff 55 05 00 02 21 09 5a
     */
    this.setServoPin = function(port,angle){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x21,
            port,
            angle
        ];
        board.send(a);
    };
    /**
     * reset firmware run time.
     */
    this.setTimer = function(){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x03,0,
            SETTINGS.WRITE_MODE,
            0x50
        ];
    };
    /*********************************************/
    /**
     * read firmware vresion.
     * @param  {[type]} index [description]
     * @return {[type]}       [description]
     * @example
     * ff 55 03 00 01 00
     */
    this.readVersion = function(index){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x03,index,
            SETTINGS.READ_MODE,
            0x00
        ];
        board.send(a);
    };
    /**
     * mainly used for distance measurement, the measurement range is 0 to 500 cm,
     * the execution of the command will have more than 100 milliseconds latency.
     * So the frequency of the host to send this instruction shoulds not be too high.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 01 01
     */
    this.readUltrasonic = function(index, port) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x01,
            port
        ];
        board.send(a);
    };


    /**
     * read temperature, Each port can connect two road temperature sensor.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @param  {[type]} slot  vailable: slot1(1), slot2(2)
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 02 01 02
     */
    this.readTemperature = function (index,port,slot){
          var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x02,
            port,
            slot
        ];
        board.send(a);
    };

    /**
     * The light sensor module or onboard (lamp) light sensors numerical reading.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 3, 4, onbord(06)
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 03 06
     */
    this.readLight = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x03,
            port
        ];
        board.send(a);
    };

    /**
     * read Potentionmeter
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 04 03
     */
    this.readPotentionmeter = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x04,
            port
        ];
        board.send(a);
    };

    /**
     * there are two axis, so the command has a parameter is used to
     * set need to get the value of the axial direction.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 3,4
     * @param  {[type]} axis  vailable: X-axis(01)  Y-axis(02)
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 05 03 01
     */
    this.readVirtualJoystick = function(index,port,axis){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x05,
            port,
            axis
        ];
        board.send(a);
    };

    /**
     * Mbot no onboard gyro, so attitude sensor can only use an external,
     * but don't need to choose the Port in the set parameters.
     * Attitude sensor using the I2C interface, so the sensor can be connected at any port of the 1, 2, 3, 4.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @param  {[type]} axis  vailable: X-axis(01)  Y-axis(02)  Z-axis(03)
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 06 00 01
     */
    this.readGyro = function(index,port,axis){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x06,
            port,
            axis
        ];
        board.send(a);
    };

    /**
     * read volume testing MIC module parameters
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 03
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 07 03
     */
    this.readSound = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x07,
            port
        ];
        board.send(a);
    };

    /**
     * read ir for send
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: onboard(00)
     * @param  {[type]} key   ASCII value,   example: `A`:45
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 0c 00 45
     */
    this.readIrSend = function(index,port,key){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x0c,
            port,
            key
        ];
        board.send(a);
    };

    /**
     * read ir for receive
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4，onbord(00)
     * @param  {[type]} key   ASCII value,   example: `A`:45
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 0e 00 45
     */
    this.readIrReceive = function(index,port,key){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x0e,
            port,
            key
        ];
        board.send(a);
    };

    /**
     * read pyroelectric infrared sensor
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 0f 02
     */
    this.readPirmotion = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x0f,
            port
        ];
        board.send(a);
    };

    /**
     * read LineFollower sensor
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]} number,
     *  00   0
        01   1
        10   2
        11   3
        when 0 said has a black line
      * @example
      * ff 55 04 00 01 11 02
     */
    this.readLineFollower = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x11,
            port
        ];
        board.send(a);
    };

    /**
     * read limitSwitch
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @param  {[type]} slot  vailable: SLOT1(01)   SLOT2(02)
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 15 01 01
     */
    this.readLimitSwitch = function(index,port,slot){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x15,
            port,
            slot
        ];
        board.send(a);
    };

    /**
     * read compass.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 1a 01
     */
    this.readCompass = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x1a,
            port
        ];
        board.send(a);
    };

    /**
     * read humiture
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 17 01 00
     */
    this.readHumiture = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x17,
            port
        ];
        board.send(a);
    };

    /**
     * read flame
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 18 03
     */
    this.readFlame = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x18,
            port
        ];
        board.send(a);
    };

    /**
     * Used to get the harmful gas density
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 19 03
     */
    this.readGas = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x19,
            port
        ];
        board.send(a);
    };

    /**
     * read the value of the digital tube feet
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: GPIO  9
     * @param  {[type]} level vailable: 00(low)、01(high)
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 02 1e 09 01
     */
    this.readDigital = function(index,port,level){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x1e,
            port,
            level
        ];
        board.send(a);
    };

    /**
     * read the value of the analog tube feet
     * @param  {[type]} index [description]
     * @param  {[type]} port  GPIO A0
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 1f 00
     */
    this.readAnalog = function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x1f,
            port
        ];
        board.send(a);
    };

    /**
     * read the firmware running time, the unit is the second (s)
     * @param  {[type]} index [description]
     * @return {[type]}       [description]
     * @example
     * ff 55 03 00 01 32
     */
    this.readTimer= function(index){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x03,index,
            SETTINGS.READ_MODE,
            0x32
        ];
        board.send(a);
    };

    /**
     * read touch sensor
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 04 00 01 33 06
     */
    this.readTouch= function(index,port){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x33,
            port
        ];
        board.send(a);
    };

    /**
     * To determine whether onboard button is pressed.
     * @param  {[type]} index     [description]
     * @param  {[type]} port      vailable: 07
     * @param  {[type]} keyStatus vailable: 01(release)
00(press)

     * @return {[type]}           [description]
     * @example
     * ff 55 05 00 01 23 07 00
     */
    this.readButtonInner= function(index,port,keyStatus){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x23,
            port,
            keyStatus
        ];
        board.send(a);
    };

    /**
     * To determine whether the corresponding button is pressed.
     * @param  {[type]} index [description]
     * @param  {[type]} port  vailable: 1,2,3,4
     * @param  {[type]} key   vailable:1,2,3,4
     * @return {[type]}       [description]
     * @example
     * ff 55 05 00 01 16 03 01
     */
    this.readButton= function(index,port,key){
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,index,
            SETTINGS.READ_MODE,
            0x16,
            port,
            key
        ];
        board.send(a);
    };
}


// clone method and attributes from board to Mcore.
Mcore.prototype = board;

if (typeof window !== "undefined") {
    window.Mcore = Mcore;
}

module.exports = Mcore;
},{"../core/board":18,"../core/utils":22,"./settings":35,"underscore":15}],33:[function(require,module,exports){
var Board = require("../core/board");
var utils = require("../core/utils");
var SETTINGS = require("./settings");
var _ = require('underscore');

var board = new Board();

function MegaPi(conf) {
    this._config = _.extend(SETTINGS.DEFAULT_CONF, conf || {});
    board.init(this._config);

    /**
     * Set dc motor speed.
     * @param {number} port  port number, vailable is: 1,2,3,4
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 06 00 02 0a 01 ff 00
     */
    this.setDcMotor = function(port, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06, 0,
            SETTINGS.WRITE_MODE,
            0x0a,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    },

    /**
     * Set encoder motor speed.
     * @param {number} slot  slot number, vailable is: 1,2
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 3d 00 01 64 00
     */
    this.setEncoderMotorBoard = function(slot, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x3d,
            0,
            slot,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set both left speed and right speed with one command.
     * @param {number} leftSpeed  left speed, the range is -255 ~ 255
     * @param {number} rightSpeed right speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 05 64 00 64 00
     */
    this.setVirtualJoystick = function(leftSpeed, rightSpeed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x05,
            leftSpeed & 0xff,
            (leftSpeed >> 8) & 0xff,
            rightSpeed & 0xff,
            (rightSpeed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set speed for balance mode.
     * @param {number} port       port number, the port on board id default 0
     * @param {number} turnDegree turn extend, -255 ~ 255
     * @param {number} speed      speed, -255 ~ 255
     * @example
     *     ff 55 08 00 02 34 00 64 00 64 00
     */
    this.setVirtualJoystickForBalance = function(port, turnExtent, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08, 0,
            SETTINGS.WRITE_MODE,
            0x34,
            turnExtent & 0xff,
            (turnExtent >> 8) & 0xff,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set stepper motor speed.
     * @param {[type]} port     port number, vailable is: 1,2,3,4
     * @param {[type]} speed    speed, the range is 0 ~ 3000
     * @param {[type]} distance distance, the range is -2147483648 ~ 2147483647
     * @example
     *     ff 55 0a 00 02 28 01 b8 0b e8 03 00 00
     */
    this.setStepperMotor = function(port, speed, distance) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x28,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff,
            distance & 0xff,
            (distance >> 8) & 0xff
        ];
        board.send(a);
    };

     /**
      * Set RgbFourLed electronic module color.
      * @param {number} port     port number, vailable is: 0(on board), 6,7,8,9,10
      * @param {number} slot     slot number, vailable is: 1,2
      * @param {number} position led position, 0 signify all leds.
      * @param {number} r        red, the range is 0 ~ 255
      * @param {number} g        green, the range is 0 ~ 255
      * @param {number} b        blue, the range is 0 ~ 255
      * @example
      *     ff 55 09 00 02 08 06 02 00 ff 00 00
      */
    this.setLed = function(port, slot, position, r, g, b) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x08,
            port,
            slot,
            position,red,green,blue
        ];
        board.send(a);
    };

    /**
     * Set board mode.
     * @param {number} mode board mode,
     *     0: bluetooth mode
     *     1: ultrasonic mode
     *     2: balance mode
     *     3: infrared mode
     *     4: linefollow mode
     * @example
     *     ff 55 05 00 02 3c 11 00
     */
    this.setFirmwareMode = function(mode) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x3c,
            0x11, // 0x11 means auriga
            mode
        ];
        board.send(a);
    };

    /**
     * Set Servo speed.
     * @param {[type]} port   port number, vailable is 6,7,8,9,10
     * @param {[type]} slot   slot number, vailable is 1,2
     * @param {[type]} degree servo degree, the range is 0 ~ 180
     */
    this.setServoMotor = function(port, slot, degree) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06,0,
            SETTINGS.WRITE_MODE,
            0x0b,
            port,
            slot,
            degree
        ];
        board.send(a);
    };

    /**
     * Set Seven-segment digital tube number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number  the number to be displayed
     * @exmpa
     *     ff 55 08 00 02 09 06 00 00 c8 42
     */
    this.setSevenSegment = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x09,
            port,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    /**
     * Set led matrix chart.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis  x position
     * @param {number} yAxis  y position
     * @param {number} length chart length
     * @param {string} chart  chart
     * @exmaple
     *     ff 55 0a 00 02 29 06 01 00 07 02 48 69
     */
    this.setLedMatrixChart = function(port, xAxis, yAxis, length, chart) {

    };


    /**
     * Set led matrix emotion.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis      x position
     * @param {number} yAxis      y position
     * @param {?} motionData emotion data to be displayed
     * @example
     *     ff 55 17 00 02 29 06 02 00 00 00 00 40 48 44 42 02 02 02 02 42 44 48 40 00 00
     */
    this.setLedMatrixEmotion = function(port, xAxis, yAxis, motionData) {

    };

    /**
     * Set led matrix time.
     * @param {number} separator time separator, 01 signify `:`, 02 signify ` `
     * @param {number} hour      hour number
     * @param {number} minute    minute number
     * @example
     *     ff 55 08 00 02 29 06 03 01 0a 14
     */
    this.setLedMatrixTime = function(separator, hour, minute) {

    };

    /**
     * Set led matrix number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number the number to be displayed
     * @exmaple
        ff 55 09 00 02 29 06 04 00 00 00 00
     */
    this.setLedMatrixNumber = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x29,
            port,
            0x04,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    this.readUltrasonic = function(index, port) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x01,
            port
        ];
        board.send(a);
    };
}


// clone method and attributes from board to MegaPi.
MegaPi.prototype = board;

if (typeof window !== "undefined") {
    window.MegaPi = MegaPi;
}

module.exports = MegaPi;
},{"../core/board":18,"../core/utils":22,"./settings":35,"underscore":15}],34:[function(require,module,exports){
var Board = require("../core/board");
var utils = require("../core/utils");
var SETTINGS = require("./settings");
var _ = require('underscore');

var board = new Board();

function Orion(conf) {
    this._config = _.extend(SETTINGS.DEFAULT_CONF, conf || {});
    board.init(this._config);

    /**
     * Set dc motor speed.
     * @param {number} port  port number, vailable is: 1,2,3,4
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 06 00 02 0a 01 ff 00
     */
    this.setDcMotor = function(port, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06, 0,
            SETTINGS.WRITE_MODE,
            0x0a,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    },

    /**
     * Set encoder motor speed.
     * @param {number} slot  slot number, vailable is: 1,2
     * @param {number} speed speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 3d 00 01 64 00
     */
    this.setEncoderMotorBoard = function(slot, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x3d,
            0,
            slot,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set both left speed and right speed with one command.
     * @param {number} leftSpeed  left speed, the range is -255 ~ 255
     * @param {number} rightSpeed right speed, the range is -255 ~ 255
     * @example
     *     ff 55 07 00 02 05 64 00 64 00
     */
    this.setVirtualJoystick = function(leftSpeed, rightSpeed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x07, 0,
            SETTINGS.WRITE_MODE,
            0x05,
            leftSpeed & 0xff,
            (leftSpeed >> 8) & 0xff,
            rightSpeed & 0xff,
            (rightSpeed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set speed for balance mode.
     * @param {number} port       port number, the port on board id default 0
     * @param {number} turnDegree turn extend, -255 ~ 255
     * @param {number} speed      speed, -255 ~ 255
     * @example
     *     ff 55 08 00 02 34 00 64 00 64 00
     */
    this.setVirtualJoystickForBalance = function(port, turnExtent, speed) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08, 0,
            SETTINGS.WRITE_MODE,
            0x34,
            turnExtent & 0xff,
            (turnExtent >> 8) & 0xff,
            speed & 0xff,
            (speed >> 8) & 0xff
        ];
        board.send(a);
    };

    /**
     * Set stepper motor speed.
     * @param {[type]} port     port number, vailable is: 1,2,3,4
     * @param {[type]} speed    speed, the range is 0 ~ 3000
     * @param {[type]} distance distance, the range is -2147483648 ~ 2147483647
     * @example
     *     ff 55 0a 00 02 28 01 b8 0b e8 03 00 00
     */
    this.setStepperMotor = function(port, speed, distance) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x28,
            port,
            speed & 0xff,
            (speed >> 8) & 0xff,
            distance & 0xff,
            (distance >> 8) & 0xff
        ];
        board.send(a);
    };

     /**
      * Set RgbFourLed electronic module color.
      * @param {number} port     port number, vailable is: 0(on board), 6,7,8,9,10
      * @param {number} slot     slot number, vailable is: 1,2
      * @param {number} position led position, 0 signify all leds.
      * @param {number} r        red, the range is 0 ~ 255
      * @param {number} g        green, the range is 0 ~ 255
      * @param {number} b        blue, the range is 0 ~ 255
      * @example
      *     ff 55 09 00 02 08 06 02 00 ff 00 00
      */
    this.setLed = function(port, slot, position, r, g, b) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x08,
            port,
            slot,
            position,red,green,blue
        ];
        board.send(a);
    };

    /**
     * Set board mode.
     * @param {number} mode board mode,
     *     0: bluetooth mode
     *     1: ultrasonic mode
     *     2: balance mode
     *     3: infrared mode
     *     4: linefollow mode
     * @example
     *     ff 55 05 00 02 3c 11 00
     */
    this.setFirmwareMode = function(mode) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x05,0,
            SETTINGS.WRITE_MODE,
            0x3c,
            0x11, // 0x11 means auriga
            mode
        ];
        board.send(a);
    };

    /**
     * Set Servo speed.
     * @param {[type]} port   port number, vailable is 6,7,8,9,10
     * @param {[type]} slot   slot number, vailable is 1,2
     * @param {[type]} degree servo degree, the range is 0 ~ 180
     */
    this.setServoMotor = function(port, slot, degree) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x06,0,
            SETTINGS.WRITE_MODE,
            0x0b,
            port,
            slot,
            degree
        ];
        board.send(a);
    };

    /**
     * Set Seven-segment digital tube number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number  the number to be displayed
     * @exmpa
     *     ff 55 08 00 02 09 06 00 00 c8 42
     */
    this.setSevenSegment = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x08,0,
            SETTINGS.WRITE_MODE,
            0x09,
            port,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    /**
     * Set led matrix chart.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis  x position
     * @param {number} yAxis  y position
     * @param {number} length chart length
     * @param {string} chart  chart
     * @exmaple
     *     ff 55 0a 00 02 29 06 01 00 07 02 48 69
     */
    this.setLedMatrixChart = function(port, xAxis, yAxis, length, chart) {

    };


    /**
     * Set led matrix emotion.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {number} xAxis      x position
     * @param {number} yAxis      y position
     * @param {?} motionData emotion data to be displayed
     * @example
     *     ff 55 17 00 02 29 06 02 00 00 00 00 40 48 44 42 02 02 02 02 42 44 48 40 00 00
     */
    this.setLedMatrixEmotion = function(port, xAxis, yAxis, motionData) {

    };

    /**
     * Set led matrix time.
     * @param {number} separator time separator, 01 signify `:`, 02 signify ` `
     * @param {number} hour      hour number
     * @param {number} minute    minute number
     * @example
     *     ff 55 08 00 02 29 06 03 01 0a 14
     */
    this.setLedMatrixTime = function(separator, hour, minute) {

    };

    /**
     * Set led matrix number.
     * @param {number} port   port number, vailable is 6,7,8,9,10
     * @param {float} number the number to be displayed
     * @exmaple
        ff 55 09 00 02 29 06 04 00 00 00 00
     */
    this.setLedMatrixNumber = function(port, number) {
        var byte4Array = utils.float32ToBytes(number);
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x09,0,
            SETTINGS.WRITE_MODE,
            0x29,
            port,
            0x04,
            parseInt(byte4Array[0], 16),
            parseInt(byte4Array[1], 16),
            parseInt(byte4Array[2], 16),
            parseInt(byte4Array[3], 16)
        ];
        board.send(a);
    };

    this.readUltrasonic = function(index, port) {
        var a = [
            SETTINGS.COMMAND_HEAD[0],
            SETTINGS.COMMAND_HEAD[1],
            0x04,index,
            SETTINGS.READ_MODE,
            0x01,
            port
        ];
        board.send(a);
    };
}


// clone method and attributes from board to Orion.
Orion.prototype = board;

if (typeof window !== "undefined") {
    window.Orion = Orion;
}

module.exports = Orion;
},{"../core/board":18,"../core/utils":22,"./settings":35,"underscore":15}],35:[function(require,module,exports){
var settings = {
    // 数据发送与接收相关
    COMMAND_HEAD: [0xff, 0x55],
    COMMAND_END: [0x0d, 0x0a],
    // 回复数据的index位置
    READ_BYTES_INDEX: 2,
    // 发送数据中表示“读”的值
    READ_MODE: 1,
    // 发送数据中表示“写”的值
    WRITE_MODE: 2,
    // 数据发送默认的驱动driver: makeblockhd, cordova
    DEFAULT_CONF : {
        driver: 'cordova'
    }
};

module.exports = settings;


},{}]},{},[31]);
