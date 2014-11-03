(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return true;
}

},{"./lib/is_arguments.js":2,"./lib/keys.js":3}],2:[function(require,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],3:[function(require,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],4:[function(require,module,exports){
/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var exports = this;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (type === 'object') {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

},{}],5:[function(require,module,exports){
var Design, EditorPage, Livingdoc, SnippetTree, assert, augmentConfig, config, designCache, designParser, doc;

assert = require('./modules/logging/assert');

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Livingdoc = require('./livingdoc');

SnippetTree = require('./snippet_tree/snippet_tree');

designParser = require('./design/design_parser');

Design = require('./design/design');

designCache = require('./design/design_cache');

EditorPage = require('./rendering_container/editor_page');

module.exports = doc = (function() {
  var editorPage;
  editorPage = new EditorPage();
  return {
    design: designCache,
    "new": function(_arg) {
      var data, design, designName, snippetTree, _ref;
      data = _arg.data, design = _arg.design;
      snippetTree = data != null ? (designName = (_ref = data.design) != null ? _ref.name : void 0, assert(designName != null, 'Error creating livingdoc: No design is specified.'), design = this.design.get(designName), new SnippetTree({
        content: data,
        design: design
      })) : (designName = design, design = this.design.get(designName), new SnippetTree({
        design: design
      }));
      return this.create(snippetTree);
    },
    create: function(snippetTree) {
      return new Livingdoc({
        snippetTree: snippetTree
      });
    },
    startDrag: $.proxy(editorPage, 'startDrag'),
    config: function(userConfig) {
      $.extend(true, config, userConfig);
      return augmentConfig(config);
    }
  };
})();

window.doc = doc;


},{"./configuration/augment_config":6,"./configuration/config":7,"./design/design":10,"./design/design_cache":11,"./design/design_parser":13,"./livingdoc":22,"./modules/logging/assert":27,"./rendering_container/editor_page":41,"./snippet_tree/snippet_tree":53}],6:[function(require,module,exports){
module.exports = function(config) {
  var name, prefix, value, _ref, _results;
  config.docDirective = {};
  config.templateAttrLookup = {};
  _ref = config.directives;
  _results = [];
  for (name in _ref) {
    value = _ref[name];
    prefix = config.attributePrefix ? "" + config.attributePrefix + "-" : '';
    value.renderedAttr = "" + prefix + value.attr;
    config.docDirective[name] = value.renderedAttr;
    _results.push(config.templateAttrLookup[value.attr] = name);
  }
  return _results;
};


},{}],7:[function(require,module,exports){
var augmentConfig, config;

augmentConfig = require('./augment_config');

module.exports = config = (function() {
  return {
    loadResources: true,
    ignoreInteraction: '.ld-control',
    designPath: '/designs',
    livingdocsCssFile: '/assets/css/livingdocs.css',
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?",
    singleLineBreak: /^<br\s*\/?>\s*$/,
    attributePrefix: 'data',
    editable: {
      allowNewline: true,
      changeDelay: 0,
      browserSpellcheck: false,
      mouseMoveSelectionChanges: false
    },
    css: {
      section: 'doc-section',
      snippet: 'doc-snippet',
      editable: 'doc-editable',
      noPlaceholder: 'doc-no-placeholder',
      emptyImage: 'doc-image-empty',
      "interface": 'doc-ui',
      snippetHighlight: 'doc-snippet-highlight',
      containerHighlight: 'doc-container-highlight',
      dragged: 'doc-dragged',
      draggedPlaceholder: 'doc-dragged-placeholder',
      draggedPlaceholderCounter: 'doc-drag-counter',
      dragBlocker: 'doc-drag-blocker',
      dropMarker: 'doc-drop-marker',
      beforeDrop: 'doc-before-drop',
      noDrop: 'doc-drag-no-drop',
      afterDrop: 'doc-after-drop',
      longpressIndicator: 'doc-longpress-indicator',
      preventSelection: 'doc-no-selection',
      maximizedContainer: 'doc-js-maximized-container',
      interactionBlocker: 'doc-interaction-blocker'
    },
    attr: {
      template: 'data-doc-template',
      placeholder: 'data-doc-placeholder'
    },
    directives: {
      container: {
        attr: 'doc-container',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      editable: {
        attr: 'doc-editable',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      image: {
        attr: 'doc-image',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'image'
      },
      html: {
        attr: 'doc-html',
        renderedAttr: 'calculated later',
        elementDirective: true,
        defaultName: 'default'
      },
      optional: {
        attr: 'doc-optional',
        renderedAttr: 'calculated later',
        elementDirective: false
      }
    },
    animations: {
      optionals: {
        show: function($elem) {
          return $elem.slideDown(250);
        },
        hide: function($elem) {
          return $elem.slideUp(250);
        }
      }
    }
  };
})();

augmentConfig(config);


},{"./augment_config":6}],8:[function(require,module,exports){
var Assets;

module.exports = Assets = (function() {
  function Assets() {}

  Assets.prototype.hasCss = function() {
    return this.css != null;
  };

  Assets.prototype.hasJs = function() {
    return this.js != null;
  };

  Assets.prototype.addCss = function(cssUrls) {
    return this.add('css', cssUrls);
  };

  Assets.prototype.addJs = function(jsUrls) {
    return this.add('js', jsUrls);
  };

  Assets.prototype.add = function(type, urls) {
    var url, _i, _len, _results;
    if (urls == null) {
      return;
    }
    if (this[type] == null) {
      this[type] = [];
    }
    if ($.type(urls) === 'string') {
      return this[type].push(urls);
    } else {
      _results = [];
      for (_i = 0, _len = urls.length; _i < _len; _i++) {
        url = urls[_i];
        _results.push(this[type].push(url));
      }
      return _results;
    }
  };

  return Assets;

})();


},{}],9:[function(require,module,exports){
var CssModificatorProperty, assert, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

module.exports = CssModificatorProperty = (function() {
  function CssModificatorProperty(_arg) {
    var options, value;
    this.name = _arg.name, this.type = _arg.type, value = _arg.value, options = _arg.options;
    switch (this.type) {
      case 'option':
        assert(value, "TemplateStyle error: no 'value' provided");
        this.value = value;
        break;
      case 'select':
        assert(options, "TemplateStyle error: no 'options' provided");
        this.options = options;
        break;
      default:
        log.error("TemplateStyle error: unknown type '" + this.type + "'");
    }
  }

  CssModificatorProperty.prototype.cssClassChanges = function(value) {
    if (this.validateValue(value)) {
      if (this.type === 'option') {
        return {
          remove: !value ? [this.value] : void 0,
          add: value
        };
      } else if (this.type === 'select') {
        return {
          remove: this.otherClasses(value),
          add: value
        };
      }
    } else {
      if (this.type === 'option') {
        return {
          remove: currentValue,
          add: void 0
        };
      } else if (this.type === 'select') {
        return {
          remove: this.otherClasses(void 0),
          add: void 0
        };
      }
    }
  };

  CssModificatorProperty.prototype.validateValue = function(value) {
    if (!value) {
      return true;
    } else if (this.type === 'option') {
      return value === this.value;
    } else if (this.type === 'select') {
      return this.containsOption(value);
    } else {
      return log.warn("Not implemented: CssModificatorProperty#validateValue() for type " + this.type);
    }
  };

  CssModificatorProperty.prototype.containsOption = function(value) {
    var option, _i, _len, _ref;
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (value === option.value) {
        return true;
      }
    }
    return false;
  };

  CssModificatorProperty.prototype.otherOptions = function(value) {
    var option, others, _i, _len, _ref;
    others = [];
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (option.value !== value) {
        others.push(option);
      }
    }
    return others;
  };

  CssModificatorProperty.prototype.otherClasses = function(value) {
    var option, others, _i, _len, _ref;
    others = [];
    _ref = this.options;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (option.value !== value) {
        others.push(option.value);
      }
    }
    return others;
  };

  return CssModificatorProperty;

})();


},{"../modules/logging/assert":27,"../modules/logging/log":28}],10:[function(require,module,exports){
var Assets, Design, OrderedHash, Template, assert, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Template = require('../template/template');

OrderedHash = require('../modules/ordered_hash');

Assets = require('./assets');

module.exports = Design = (function() {
  function Design(_arg) {
    this.name = _arg.name, this.version = _arg.version, this.author = _arg.author, this.description = _arg.description;
    assert(this.name != null, 'Design needs a name');
    this.identifier = Design.getIdentifier(this.name, this.version);
    this.groups = [];
    this.components = new OrderedHash();
    this.assets = new Assets();
    this.defaultParagraph = void 0;
    this.defaultImage = void 0;
  }

  Design.prototype.equals = function(design) {
    return design.name === this.name && design.version === this.version;
  };

  Design.prototype.get = function(identifier) {
    var componentName;
    componentName = this.getComponentNameFromIdentifier(identifier);
    return this.components.get(componentName);
  };

  Design.prototype.each = function(callback) {
    return this.components.each(callback);
  };

  Design.prototype.add = function(template) {
    template.setDesign(this);
    return this.components.push(template.id, template);
  };

  Design.prototype.getComponentNameFromIdentifier = function(identifier) {
    var id, namespace, _ref;
    _ref = Template.parseIdentifier(identifier), namespace = _ref.namespace, id = _ref.id;
    return id;
  };

  Design.getIdentifier = function(name, version) {
    if (version != null) {
      return "" + name + "@" + version;
    } else {
      return "" + name;
    }
  };

  return Design;

})();


},{"../modules/logging/assert":27,"../modules/logging/log":28,"../modules/ordered_hash":33,"../template/template":59,"./assets":8}],11:[function(require,module,exports){
var Design, assert;

assert = require('../modules/logging/assert');

Design = require('./design');

module.exports = (function() {
  return {
    designs: {},
    load: function(designSpec) {
      var design, _ref;
      if (typeof designSpec === 'string') {
        return assert(false, 'Load design by name is not implemented yet.');
      } else {
        if (this.has((_ref = designSpec.design) != null ? _ref.name : void 0)) {
          return;
        }
        design = Design.parser.parse(designSpec);
        if (design) {
          return this.add(design);
        } else {
          throw new Error(Design.parser.errors);
        }
      }
    },
    add: function(design) {
      return this.designs[design.name] = design;
    },
    has: function(name) {
      return this.designs[name] != null;
    },
    get: function(name) {
      assert(this.has(name), "Error: design '" + name + "' is not loaded.");
      return this.designs[name];
    },
    resetCache: function() {
      return this.designs = {};
    }
  };
})();


},{"../modules/logging/assert":27,"./design":10}],12:[function(require,module,exports){
var Scheme, validator;

Scheme = require('../modules/object_schema/scheme');

module.exports = validator = new Scheme();

validator.add('styleType', function(value) {
  return value === 'option' || value === 'select';
});

validator.add('semVer', function(value) {
  return /\d\.\d\.\d/.test(value);
});

validator.add('design', {
  design: {
    name: 'string',
    version: 'string, semVer',
    author: 'string, optional',
    description: 'string, optional'
  },
  assets: {
    __validate: 'optional',
    css: 'array of string',
    js: 'array of string, optional'
  },
  components: 'array of component',
  componentProperties: {
    __validate: 'optional',
    __additionalProperty: function(key, value) {
      return validator.validate('componentProperty', value);
    }
  },
  groups: 'array, optional',
  defaultComponents: {
    __validate: 'optional',
    paragraph: 'string, optional',
    image: 'string, optional'
  }
});

validator.add('component', {
  id: 'string',
  title: 'string, optional',
  html: 'string',
  properties: 'array of string, optional'
});

validator.add('componentProperty', {
  name: 'string',
  type: 'string, styleType',
  value: 'string, optional',
  options: 'array of styleOption, optional'
});

validator.add('styleOption', {
  caption: 'string',
  value: 'string'
});


},{"../modules/object_schema/scheme":30}],13:[function(require,module,exports){
var CssModificatorProperty, Design, Template, assert, designConfigSchema, designParser, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

designConfigSchema = require('./design_config_schema');

CssModificatorProperty = require('./css_modificator_property');

Template = require('../template/template');

Design = require('./design');

module.exports = designParser = {
  parse: function(designConfig) {
    var errors;
    this.design = void 0;
    if (designConfigSchema.validate('design', designConfig)) {
      return this.createDesign(designConfig);
    } else {
      errors = designConfigSchema.getErrorMessages();
      throw new Error(errors);
    }
  },
  createDesign: function(_arg) {
    var assets, componentProperties, components, defaultComponents, design, error, groups;
    design = _arg.design, assets = _arg.assets, components = _arg.components, componentProperties = _arg.componentProperties, groups = _arg.groups, defaultComponents = _arg.defaultComponents;
    try {
      this.design = this.parseDesign(design);
      this.parseAssets(assets);
      this.parseComponentProperties(componentProperties);
      this.parseComponents(components);
      this.parseGroups(groups);
      this.parseDefaults(defaultComponents);
    } catch (_error) {
      error = _error;
      throw new Error("Error creating the design: " + error);
    }
    return this.design;
  },
  parseDesign: function(design) {
    return new Design({
      name: design.name,
      version: design.version
    });
  },
  parseAssets: function(assets) {
    if (assets == null) {
      return;
    }
    this.design.assets.addCss(assets.css);
    return this.design.assets.addJs(assets.js);
  },
  parseComponentProperties: function(componentProperties) {
    var config, name, _results;
    this.componentProperties = {};
    _results = [];
    for (name in componentProperties) {
      config = componentProperties[name];
      _results.push(this.componentProperties[name] = this.createComponentProperty(config));
    }
    return _results;
  },
  parseComponents: function(components) {
    var component, html, id, properties, title, _i, _len, _ref, _results;
    if (components == null) {
      components = [];
    }
    _results = [];
    for (_i = 0, _len = components.length; _i < _len; _i++) {
      _ref = components[_i], id = _ref.id, title = _ref.title, html = _ref.html, properties = _ref.properties;
      properties = this.lookupComponentProperties(properties);
      component = new Template({
        id: id,
        title: title,
        html: html,
        properties: properties
      });
      _results.push(this.design.add(component));
    }
    return _results;
  },
  lookupComponentProperties: function(propertyNames) {
    var name, properties, property, _i, _len, _ref;
    properties = {};
    _ref = propertyNames || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (property = this.componentProperties[name]) {
        properties[name] = property;
      } else {
        log.warn("The componentProperty '" + name + "' was not found.");
      }
    }
    return properties;
  },
  parseGroups: function(groups) {
    var componentName, components, group, _i, _len, _results;
    if (groups == null) {
      groups = [];
    }
    _results = [];
    for (_i = 0, _len = groups.length; _i < _len; _i++) {
      group = groups[_i];
      components = (function() {
        var _j, _len1, _ref, _results1;
        _ref = group.components;
        _results1 = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          componentName = _ref[_j];
          _results1.push(this.design.get(componentName));
        }
        return _results1;
      }).call(this);
      _results.push(this.design.groups.push({
        name: group.name,
        components: components
      }));
    }
    return _results;
  },
  parseDefaults: function(defaultComponents) {
    var image, paragraph;
    if (defaultComponents == null) {
      return;
    }
    paragraph = defaultComponents.paragraph, image = defaultComponents.image;
    if (paragraph) {
      this.design.defaultParagraph = this.getComponent(paragraph);
    }
    if (image) {
      return this.design.defaultImage = this.getComponent(image);
    }
  },
  getComponent: function(name) {
    var component;
    component = this.design.get(name);
    assert(component, "Could not find component " + name);
    return component;
  },
  createComponentProperty: function(styleDefinition) {
    return new CssModificatorProperty(styleDefinition);
  }
};

Design.parser = designParser;


},{"../modules/logging/assert":27,"../modules/logging/log":28,"../template/template":59,"./css_modificator_property":9,"./design":10,"./design_config_schema":12}],14:[function(require,module,exports){
module.exports = {
  name: 'default',
  set: function($elem, value) {
    if (this.isInlineImage($elem)) {
      return this.setInlineImage($elem, value);
    } else {
      return this.setBackgroundImage($elem, value);
    }
  },
  setPlaceholder: function($elem) {
    var dim, imageUrl;
    dim = this.getImageDimensions($elem);
    return imageUrl = "http://placehold.it/" + dim.width + "x" + dim.height + "/BEF56F/B2E668";
  },
  getUrl: function(value) {
    return value;
  },
  setInlineImage: function($elem, value) {
    return $elem.attr('src', value);
  },
  setBackgroundImage: function($elem, value) {
    return $elem.css('background-image', "url(" + (this.escapeCssUri(value)) + ")");
  },
  escapeCssUri: function(uri) {
    if (/[()]/.test(uri)) {
      return "'" + uri + "'";
    } else {
      return uri;
    }
  },
  getImageDimensions: function($elem) {
    if (this.isInlineImage($elem)) {
      return {
        width: $elem.width(),
        height: $elem.height()
      };
    } else {
      return {
        width: $elem.outerWidth(),
        height: $elem.outerHeight()
      };
    }
  },
  isBase64: function(value) {
    if (value != null) {
      return value.indexOf('data:image') === 0;
    }
  },
  isInlineImage: function($elem) {
    return $elem[0].nodeName.toLowerCase() === 'img';
  },
  isBackgroundImage: function($elem) {
    return $elem[0].nodeName.toLowerCase() !== 'img';
  }
};


},{}],15:[function(require,module,exports){
var assert, defaultImageService, resrcitImageService;

assert = require('../modules/logging/assert');

defaultImageService = require('./default_image_service');

resrcitImageService = require('./resrcit_image_service');

module.exports = (function() {
  var services;
  services = {
    'resrc.it': resrcitImageService,
    'default': defaultImageService
  };
  return {
    has: function(serviceName) {
      if (serviceName == null) {
        serviceName = 'default';
      }
      return services[serviceName] != null;
    },
    get: function(serviceName) {
      if (serviceName == null) {
        serviceName = 'default';
      }
      assert(this.has(serviceName), "Could not load image service " + serviceName);
      return services[serviceName];
    },
    eachService: function(callback) {
      var name, service, _results;
      _results = [];
      for (name in services) {
        service = services[name];
        _results.push(callback(name, service));
      }
      return _results;
    }
  };
})();


},{"../modules/logging/assert":27,"./default_image_service":14,"./resrcit_image_service":16}],16:[function(require,module,exports){
var assert, imgService;

assert = require('../modules/logging/assert');

imgService = require('./default_image_service');

module.exports = (function() {
  return {
    resrcitUrl: 'http://app.resrc.it/',
    name: 'resrc.it',
    set: function($elem, url) {
      assert((url != null) && url !== '', 'Src value for an image has to be defined');
      if (imgService.isBase64(url)) {
        return this.setBase64($elem, url);
      }
      $elem.addClass('resrc');
      if (imgService.isInlineImage($elem)) {
        return this.setInlineImage($elem, url);
      } else {
        return this.setBackgroundImage($elem, url);
      }
    },
    setPlaceholder: function($elem) {
      return imgService.setPlaceholder($elem);
    },
    getUrl: function(value, _arg) {
      var crop, cropParam;
      crop = _arg.crop;
      if (crop != null) {
        cropParam = "C=W" + crop.width + ",H" + crop.height + ",X" + crop.x + ",Y" + crop.y + "/";
      }
      return "" + this.resrcitUrl + (cropParam || '') + value;
    },
    formatCssUrl: function(url) {
      url = imgService.escapeCssUri(url);
      return "url(" + url + ")";
    },
    setInlineImage: function($elem, url) {
      if (imgService.isBase64($elem.attr('src'))) {
        $elem.removeAttr('src');
      }
      return $elem.attr('data-src', url);
    },
    setBackgroundImage: function($elem, url) {
      return $elem.css('background-image', this.formatCssUrl(url));
    },
    setBase64: function($elem, base64String) {
      return imgService.set($elem, base64String);
    }
  };
})();


},{"../modules/logging/assert":27,"./default_image_service":14}],17:[function(require,module,exports){
var config, css;

config = require('../configuration/config');

css = config.css;

module.exports = (function() {
  var sectionRegex, snippetRegex;
  snippetRegex = new RegExp("(?: |^)" + css.snippet + "(?: |$)");
  sectionRegex = new RegExp("(?: |^)" + css.section + "(?: |$)");
  return {
    findSnippetView: function(node) {
      var view;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        if (snippetRegex.test(node.className)) {
          view = this.getSnippetView(node);
          return view;
        }
        node = node.parentNode;
      }
      return void 0;
    },
    findNodeContext: function(node) {
      var nodeContext;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        nodeContext = this.getNodeContext(node);
        if (nodeContext) {
          return nodeContext;
        }
        node = node.parentNode;
      }
      return void 0;
    },
    getNodeContext: function(node) {
      var directiveAttr, directiveType, obj, _ref;
      _ref = config.directives;
      for (directiveType in _ref) {
        obj = _ref[directiveType];
        if (!obj.elementDirective) {
          continue;
        }
        directiveAttr = obj.renderedAttr;
        if (node.hasAttribute(directiveAttr)) {
          return {
            contextAttr: directiveAttr,
            attrName: node.getAttribute(directiveAttr)
          };
        }
      }
      return void 0;
    },
    findContainer: function(node) {
      var containerAttr, containerName, view;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          containerName = node.getAttribute(containerAttr);
          if (!sectionRegex.test(node.className)) {
            view = this.findSnippetView(node);
          }
          return {
            node: node,
            containerName: containerName,
            snippetView: view
          };
        }
        node = node.parentNode;
      }
      return {};
    },
    getImageName: function(node) {
      var imageAttr, imageName;
      imageAttr = config.directives.image.renderedAttr;
      if (node.hasAttribute(imageAttr)) {
        imageName = node.getAttribute(imageAttr);
        return imageName;
      }
    },
    getHtmlElementName: function(node) {
      var htmlAttr, htmlElementName;
      htmlAttr = config.directives.html.renderedAttr;
      if (node.hasAttribute(htmlAttr)) {
        htmlElementName = node.getAttribute(htmlAttr);
        return htmlElementName;
      }
    },
    getEditableName: function(node) {
      var editableAttr, imageName;
      editableAttr = config.directives.editable.renderedAttr;
      if (node.hasAttribute(editableAttr)) {
        imageName = node.getAttribute(editableAttr);
        return editableName;
      }
    },
    dropTarget: function(node, _arg) {
      var closestSnippetData, containerAttr, left, top;
      top = _arg.top, left = _arg.left;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          closestSnippetData = this.getClosestSnippet(node, {
            top: top,
            left: left
          });
          if (closestSnippetData != null) {
            return this.getClosestSnippetTarget(closestSnippetData);
          } else {
            return this.getContainerTarget(node);
          }
        } else if (snippetRegex.test(node.className)) {
          return this.getSnippetTarget(node, {
            top: top,
            left: left
          });
        } else if (sectionRegex.test(node.className)) {
          closestSnippetData = this.getClosestSnippet(node, {
            top: top,
            left: left
          });
          if (closestSnippetData != null) {
            return this.getClosestSnippetTarget(closestSnippetData);
          } else {
            return this.getRootTarget(node);
          }
        }
        node = node.parentNode;
      }
    },
    getSnippetTarget: function(elem, _arg) {
      var left, position, top;
      top = _arg.top, left = _arg.left, position = _arg.position;
      return {
        target: 'snippet',
        snippetView: this.getSnippetView(elem),
        position: position || this.getPositionOnSnippet(elem, {
          top: top,
          left: left
        })
      };
    },
    getClosestSnippetTarget: function(closestSnippetData) {
      var elem, position;
      elem = closestSnippetData.$elem[0];
      position = closestSnippetData.position;
      return this.getSnippetTarget(elem, {
        position: position
      });
    },
    getContainerTarget: function(node) {
      var containerAttr, containerName;
      containerAttr = config.directives.container.renderedAttr;
      containerName = node.getAttribute(containerAttr);
      return {
        target: 'container',
        node: node,
        snippetView: this.findSnippetView(node),
        containerName: containerName
      };
    },
    getRootTarget: function(node) {
      var snippetTree;
      snippetTree = $(node).data('snippetTree');
      return {
        target: 'root',
        node: node,
        snippetTree: snippetTree
      };
    },
    getPositionOnSnippet: function(elem, _arg) {
      var $elem, elemBottom, elemHeight, elemTop, left, top;
      top = _arg.top, left = _arg.left;
      $elem = $(elem);
      elemTop = $elem.offset().top;
      elemHeight = $elem.outerHeight();
      elemBottom = elemTop + elemHeight;
      if (this.distance(top, elemTop) < this.distance(top, elemBottom)) {
        return 'before';
      } else {
        return 'after';
      }
    },
    getClosestSnippet: function(container, _arg) {
      var $snippets, closest, closestSnippet, left, top;
      top = _arg.top, left = _arg.left;
      $snippets = $(container).find("." + css.snippet);
      closest = void 0;
      closestSnippet = void 0;
      $snippets.each((function(_this) {
        return function(index, elem) {
          var $elem, elemBottom, elemHeight, elemTop;
          $elem = $(elem);
          elemTop = $elem.offset().top;
          elemHeight = $elem.outerHeight();
          elemBottom = elemTop + elemHeight;
          if ((closest == null) || _this.distance(top, elemTop) < closest) {
            closest = _this.distance(top, elemTop);
            closestSnippet = {
              $elem: $elem,
              position: 'before'
            };
          }
          if ((closest == null) || _this.distance(top, elemBottom) < closest) {
            closest = _this.distance(top, elemBottom);
            return closestSnippet = {
              $elem: $elem,
              position: 'after'
            };
          }
        };
      })(this));
      return closestSnippet;
    },
    distance: function(a, b) {
      if (a > b) {
        return a - b;
      } else {
        return b - a;
      }
    },
    maximizeContainerHeight: function(view) {
      var $elem, $parent, elem, name, outer, parentHeight, _ref, _results;
      if (view.template.containerCount > 1) {
        _ref = view.containers;
        _results = [];
        for (name in _ref) {
          elem = _ref[name];
          $elem = $(elem);
          if ($elem.hasClass(css.maximizedContainer)) {
            continue;
          }
          $parent = $elem.parent();
          parentHeight = $parent.height();
          outer = $elem.outerHeight(true) - $elem.height();
          $elem.height(parentHeight - outer);
          _results.push($elem.addClass(css.maximizedContainer));
        }
        return _results;
      }
    },
    restoreContainerHeight: function() {
      return $("." + css.maximizedContainer).css('height', '').removeClass(css.maximizedContainer);
    },
    getElementNode: function(node) {
      if (node != null ? node.jquery : void 0) {
        return node[0];
      } else if ((node != null ? node.nodeType : void 0) === 3) {
        return node.parentNode;
      } else {
        return node;
      }
    },
    getSnippetView: function(node) {
      return $(node).data('snippet');
    },
    getAbsoluteBoundingClientRect: function(node) {
      var coords, scrollX, scrollY, win, _ref;
      win = node.ownerDocument.defaultView;
      _ref = this.getScrollPosition(win), scrollX = _ref.scrollX, scrollY = _ref.scrollY;
      coords = node.getBoundingClientRect();
      coords = {
        top: coords.top + scrollY,
        bottom: coords.bottom + scrollY,
        left: coords.left + scrollX,
        right: coords.right + scrollX
      };
      coords.height = coords.bottom - coords.top;
      coords.width = coords.right - coords.left;
      return coords;
    },
    getScrollPosition: function(win) {
      return {
        scrollX: win.pageXOffset !== void 0 ? win.pageXOffset : (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollLeft,
        scrollY: win.pageYOffset !== void 0 ? win.pageYOffset : (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop
      };
    }
  };
})();


},{"../configuration/config":7}],18:[function(require,module,exports){
var DragBase, config, css;

config = require('../configuration/config');

css = config.css;

module.exports = DragBase = (function() {
  function DragBase(page, options) {
    var defaultConfig;
    this.page = page;
    this.modes = ['direct', 'longpress', 'move'];
    defaultConfig = {
      preventDefault: false,
      onDragStart: void 0,
      scrollArea: 50,
      longpress: {
        showIndicator: true,
        delay: 400,
        tolerance: 3
      },
      move: {
        distance: 0
      }
    };
    this.defaultConfig = $.extend(true, defaultConfig, options);
    this.startPoint = void 0;
    this.dragHandler = void 0;
    this.initialized = false;
    this.started = false;
  }

  DragBase.prototype.setOptions = function(options) {
    this.options = $.extend(true, {}, this.defaultConfig, options);
    return this.mode = options.direct != null ? 'direct' : options.longpress != null ? 'longpress' : options.move != null ? 'move' : 'longpress';
  };

  DragBase.prototype.setDragHandler = function(dragHandler) {
    this.dragHandler = dragHandler;
    return this.dragHandler.page = this.page;
  };

  DragBase.prototype.init = function(dragHandler, event, options) {
    this.reset();
    this.initialized = true;
    this.setOptions(options);
    this.setDragHandler(dragHandler);
    this.startPoint = this.getEventPosition(event);
    this.addStopListeners(event);
    this.addMoveListeners(event);
    if (this.mode === 'longpress') {
      this.addLongpressIndicator(this.startPoint);
      this.timeout = setTimeout((function(_this) {
        return function() {
          _this.removeLongpressIndicator();
          return _this.start(event);
        };
      })(this), this.options.longpress.delay);
    } else if (this.mode === 'direct') {
      this.start(event);
    }
    if (this.options.preventDefault) {
      return event.preventDefault();
    }
  };

  DragBase.prototype.move = function(event) {
    var eventPosition;
    eventPosition = this.getEventPosition(event);
    if (this.mode === 'longpress') {
      if (this.distance(eventPosition, this.startPoint) > this.options.longpress.tolerance) {
        return this.reset();
      }
    } else if (this.mode === 'move') {
      if (this.distance(eventPosition, this.startPoint) > this.options.move.distance) {
        return this.start(event);
      }
    }
  };

  DragBase.prototype.start = function(event) {
    var eventPosition;
    eventPosition = this.getEventPosition(event);
    this.started = true;
    this.addBlocker();
    this.page.$body.addClass(css.preventSelection);
    return this.dragHandler.start(eventPosition);
  };

  DragBase.prototype.drop = function(event) {
    if (this.started) {
      this.dragHandler.drop(event);
    }
    if ($.isFunction(this.options.onDrop)) {
      this.options.onDrop(event, this.dragHandler);
    }
    return this.reset();
  };

  DragBase.prototype.cancel = function() {
    return this.reset();
  };

  DragBase.prototype.reset = function() {
    if (this.started) {
      this.started = false;
      this.page.$body.removeClass(css.preventSelection);
    }
    if (this.initialized) {
      this.initialized = false;
      this.startPoint = void 0;
      this.dragHandler.reset();
      this.dragHandler = void 0;
      if (this.timeout != null) {
        clearTimeout(this.timeout);
        this.timeout = void 0;
      }
      this.page.$document.off('.livingdocs-drag');
      this.removeLongpressIndicator();
      return this.removeBlocker();
    }
  };

  DragBase.prototype.addBlocker = function() {
    var $blocker;
    $blocker = $("<div class='" + css.dragBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
    return this.page.$body.append($blocker);
  };

  DragBase.prototype.removeBlocker = function() {
    return this.page.$body.find("." + css.dragBlocker).remove();
  };

  DragBase.prototype.addLongpressIndicator = function(_arg) {
    var $indicator, pageX, pageY;
    pageX = _arg.pageX, pageY = _arg.pageY;
    if (!this.options.longpress.showIndicator) {
      return;
    }
    $indicator = $("<div class=\"" + css.longpressIndicator + "\"><div></div></div>");
    $indicator.css({
      left: pageX,
      top: pageY
    });
    return this.page.$body.append($indicator);
  };

  DragBase.prototype.removeLongpressIndicator = function() {
    return this.page.$body.find("." + css.longpressIndicator).remove();
  };

  DragBase.prototype.addStopListeners = function(event) {
    var eventNames;
    eventNames = event.type === 'touchstart' ? 'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag' : event.type === 'dragenter' || event.type === 'dragbetterenter' ? 'drop.livingdocs-drag dragend.livingdocs-drag' : 'mouseup.livingdocs-drag';
    return this.page.$document.on(eventNames, (function(_this) {
      return function(event) {
        return _this.drop(event);
      };
    })(this));
  };

  DragBase.prototype.addMoveListeners = function(event) {
    if (event.type === 'touchstart') {
      return this.page.$document.on('touchmove.livingdocs-drag', (function(_this) {
        return function(event) {
          event.preventDefault();
          if (_this.started) {
            return _this.dragHandler.move(_this.getEventPosition(event));
          } else {
            return _this.move(event);
          }
        };
      })(this));
    } else if (event.type === 'dragenter' || event.type === 'dragbetterenter') {
      return this.page.$document.on('dragover.livingdocs-drag', (function(_this) {
        return function(event) {
          if (_this.started) {
            return _this.dragHandler.move(_this.getEventPosition(event));
          } else {
            return _this.move(event);
          }
        };
      })(this));
    } else {
      return this.page.$document.on('mousemove.livingdocs-drag', (function(_this) {
        return function(event) {
          if (_this.started) {
            return _this.dragHandler.move(_this.getEventPosition(event));
          } else {
            return _this.move(event);
          }
        };
      })(this));
    }
  };

  DragBase.prototype.getEventPosition = function(event) {
    if (event.type === 'touchstart' || event.type === 'touchmove') {
      event = event.originalEvent.changedTouches[0];
    } else if (event.type === 'dragover') {
      event = event.originalEvent;
    }
    return {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    };
  };

  DragBase.prototype.distance = function(pointA, pointB) {
    var distX, distY;
    if (!pointA || !pointB) {
      return void 0;
    }
    distX = pointA.pageX - pointB.pageX;
    distY = pointA.pageY - pointB.pageY;
    return Math.sqrt((distX * distX) + (distY * distY));
  };

  return DragBase;

})();


},{"../configuration/config":7}],19:[function(require,module,exports){
var EditableController, config, dom,
  __slice = [].slice;

dom = require('./dom');

config = require('../configuration/config');

module.exports = EditableController = (function() {
  function EditableController(page) {
    this.page = page;
    this.editable = new Editable({
      window: this.page.window,
      browserSpellcheck: config.editable.browserSpellcheck,
      mouseMoveSelectionChanges: config.editable.mouseMoveSelectionChanges
    });
    this.editableAttr = config.directives.editable.renderedAttr;
    this.selection = $.Callbacks();
    this.editable.focus(this.withContext(this.focus)).blur(this.withContext(this.blur)).insert(this.withContext(this.insert)).merge(this.withContext(this.merge)).split(this.withContext(this.split)).selection(this.withContext(this.selectionChanged)).newline(this.withContext(this.newline)).change(this.withContext(this.change));
  }

  EditableController.prototype.add = function(nodes) {
    return this.editable.add(nodes);
  };

  EditableController.prototype.disableAll = function() {
    return this.editable.suspend();
  };

  EditableController.prototype.reenableAll = function() {
    return this.editable["continue"]();
  };

  EditableController.prototype.withContext = function(func) {
    return (function(_this) {
      return function() {
        var args, editableName, element, view;
        element = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        view = dom.findSnippetView(element);
        editableName = element.getAttribute(_this.editableAttr);
        args.unshift(view, editableName);
        return func.apply(_this, args);
      };
    })(this);
  };

  EditableController.prototype.extractContent = function(element) {
    var value;
    value = this.editable.getContent(element);
    if (config.singleLineBreak.test(value) || value === '') {
      return void 0;
    } else {
      return value;
    }
  };

  EditableController.prototype.updateModel = function(view, editableName, element) {
    var value;
    value = this.extractContent(element);
    return view.model.set(editableName, value);
  };

  EditableController.prototype.focus = function(view, editableName) {
    var element;
    view.focusEditable(editableName);
    element = view.getDirectiveElement(editableName);
    this.page.focus.editableFocused(element, view);
    return true;
  };

  EditableController.prototype.blur = function(view, editableName) {
    var element;
    this.clearChangeTimeout();
    element = view.getDirectiveElement(editableName);
    this.updateModel(view, editableName, element);
    view.blurEditable(editableName);
    this.page.focus.editableBlurred(element, view);
    return true;
  };

  EditableController.prototype.insert = function(view, editableName, direction, cursor) {
    var copy, defaultParagraph, newView;
    defaultParagraph = this.page.design.defaultParagraph;
    if (this.hasSingleEditable(view) && (defaultParagraph != null)) {
      copy = defaultParagraph.createModel();
      newView = direction === 'before' ? (view.model.before(copy), view.prev()) : (view.model.after(copy), view.next());
      if (newView && direction === 'after') {
        newView.focus();
      }
    }
    return false;
  };

  EditableController.prototype.merge = function(view, editableName, direction, cursor) {
    var contentToMerge, mergedView, mergedViewElem, viewElem;
    if (this.hasSingleEditable(view)) {
      mergedView = direction === 'before' ? view.prev() : view.next();
      if (mergedView && mergedView.template === view.template) {
        viewElem = view.getDirectiveElement(editableName);
        mergedViewElem = mergedView.getDirectiveElement(editableName);
        contentToMerge = this.editable.getContent(viewElem);
        cursor = direction === 'before' ? this.editable.appendTo(mergedViewElem, contentToMerge) : this.editable.prependTo(mergedViewElem, contentToMerge);
        view.model.remove();
        cursor.setVisibleSelection();
        this.updateModel(mergedView, editableName, mergedViewElem);
      }
    }
    return false;
  };

  EditableController.prototype.split = function(view, editableName, before, after, cursor) {
    var copy, _ref;
    if (this.hasSingleEditable(view)) {
      copy = view.template.createModel();
      copy.set(editableName, this.extractContent(after));
      view.model.after(copy);
      if ((_ref = view.next()) != null) {
        _ref.focus();
      }
      view.model.set(editableName, this.extractContent(before));
    }
    return false;
  };

  EditableController.prototype.selectionChanged = function(view, editableName, selection) {
    var element;
    element = view.getDirectiveElement(editableName);
    return this.selection.fire(view, element, selection);
  };

  EditableController.prototype.newline = function(view, editable, cursor) {
    if (config.editable.allowNewline) {
      return true;
    } else {
      return false;
    }
  };

  EditableController.prototype.change = function(view, editableName) {
    this.clearChangeTimeout();
    if (config.editable.changeDelay === false) {
      return;
    }
    return this.changeTimeout = setTimeout((function(_this) {
      return function() {
        var elem;
        elem = view.getDirectiveElement(editableName);
        _this.updateModel(view, editableName, elem);
        return _this.changeTimeout = void 0;
      };
    })(this), config.editable.changeDelay);
  };

  EditableController.prototype.clearChangeTimeout = function() {
    if (this.changeTimeout != null) {
      clearTimeout(this.changeTimeout);
      return this.changeTimeout = void 0;
    }
  };

  EditableController.prototype.hasSingleEditable = function(view) {
    return view.directives.length === 1 && view.directives[0].type === 'editable';
  };

  return EditableController;

})();


},{"../configuration/config":7,"./dom":17}],20:[function(require,module,exports){
var Focus, dom;

dom = require('./dom');

module.exports = Focus = (function() {
  function Focus() {
    this.editableNode = void 0;
    this.snippetView = void 0;
    this.snippetFocus = $.Callbacks();
    this.snippetBlur = $.Callbacks();
  }

  Focus.prototype.setFocus = function(snippetView, editableNode) {
    if (editableNode !== this.editableNode) {
      this.resetEditable();
      this.editableNode = editableNode;
    }
    if (snippetView !== this.snippetView) {
      this.resetSnippetView();
      if (snippetView) {
        this.snippetView = snippetView;
        return this.snippetFocus.fire(this.snippetView);
      }
    }
  };

  Focus.prototype.editableFocused = function(editableNode, snippetView) {
    if (this.editableNode !== editableNode) {
      snippetView || (snippetView = dom.findSnippetView(editableNode));
      return this.setFocus(snippetView, editableNode);
    }
  };

  Focus.prototype.editableBlurred = function(editableNode) {
    if (this.editableNode === editableNode) {
      return this.setFocus(this.snippetView, void 0);
    }
  };

  Focus.prototype.snippetFocused = function(snippetView) {
    if (this.snippetView !== snippetView) {
      return this.setFocus(snippetView, void 0);
    }
  };

  Focus.prototype.blur = function() {
    return this.setFocus(void 0, void 0);
  };

  Focus.prototype.resetEditable = function() {
    if (this.editableNode) {
      return this.editableNode = void 0;
    }
  };

  Focus.prototype.resetSnippetView = function() {
    var previous;
    if (this.snippetView) {
      previous = this.snippetView;
      this.snippetView = void 0;
      return this.snippetBlur.fire(previous);
    }
  };

  return Focus;

})();


},{"./dom":17}],21:[function(require,module,exports){
var SnippetDrag, config, css, dom, isSupported;

dom = require('./dom');

isSupported = require('../modules/feature_detection/is_supported');

config = require('../configuration/config');

css = config.css;

module.exports = SnippetDrag = (function() {
  var startAndEndOffset, wiggleSpace;

  wiggleSpace = 0;

  startAndEndOffset = 0;

  function SnippetDrag(_arg) {
    var snippetView;
    this.snippetModel = _arg.snippetModel, snippetView = _arg.snippetView;
    if (snippetView) {
      this.$view = snippetView.$html;
    }
    this.$highlightedContainer = {};
  }

  SnippetDrag.prototype.start = function(eventPosition) {
    this.started = true;
    this.page.editableController.disableAll();
    this.page.blurFocusedElement();
    this.$placeholder = this.createPlaceholder().css({
      'pointer-events': 'none'
    });
    this.$dragBlocker = this.page.$body.find("." + css.dragBlocker);
    this.$dropMarker = $("<div class='" + css.dropMarker + "'>");
    this.page.$body.append(this.$dropMarker).append(this.$placeholder).css('cursor', 'pointer');
    if (this.$view != null) {
      this.$view.addClass(css.dragged);
    }
    return this.move(eventPosition);
  };

  SnippetDrag.prototype.move = function(eventPosition) {
    this.$placeholder.css({
      left: "" + eventPosition.pageX + "px",
      top: "" + eventPosition.pageY + "px"
    });
    return this.target = this.findDropTarget(eventPosition);
  };

  SnippetDrag.prototype.findDropTarget = function(eventPosition) {
    var coords, elem, target, _ref, _ref1;
    _ref = this.getElemUnderCursor(eventPosition), eventPosition = _ref.eventPosition, elem = _ref.elem;
    if (elem == null) {
      return void 0;
    }
    if (elem === this.$dropMarker[0]) {
      return this.target;
    }
    coords = {
      left: eventPosition.pageX,
      top: eventPosition.pageY
    };
    if (elem != null) {
      target = dom.dropTarget(elem, coords);
    }
    this.undoMakeSpace();
    if ((target != null) && ((_ref1 = target.snippetView) != null ? _ref1.model : void 0) !== this.snippetModel) {
      this.$placeholder.removeClass(css.noDrop);
      this.markDropPosition(target);
      return target;
    } else {
      this.$dropMarker.hide();
      this.removeContainerHighlight();
      if (target == null) {
        this.$placeholder.addClass(css.noDrop);
      } else {
        this.$placeholder.removeClass(css.noDrop);
      }
      return void 0;
    }
  };

  SnippetDrag.prototype.markDropPosition = function(target) {
    switch (target.target) {
      case 'snippet':
        this.snippetPosition(target);
        return this.removeContainerHighlight();
      case 'container':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
      case 'root':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
    }
  };

  SnippetDrag.prototype.snippetPosition = function(target) {
    var before, next;
    if (target.position === 'before') {
      before = target.snippetView.prev();
      if (before != null) {
        if (before.model === this.snippetModel) {
          target.position = 'after';
          return this.snippetPosition(target);
        }
        return this.showMarkerBetweenSnippets(before, target.snippetView);
      } else {
        return this.showMarkerAtBeginningOfContainer(target.snippetView.$elem[0].parentNode);
      }
    } else {
      next = target.snippetView.next();
      if (next != null) {
        if (next.model === this.snippetModel) {
          target.position = 'before';
          return this.snippetPosition(target);
        }
        return this.showMarkerBetweenSnippets(target.snippetView, next);
      } else {
        return this.showMarkerAtEndOfContainer(target.snippetView.$elem[0].parentNode);
      }
    }
  };

  SnippetDrag.prototype.showMarkerBetweenSnippets = function(viewA, viewB) {
    var boxA, boxB, halfGap;
    boxA = dom.getAbsoluteBoundingClientRect(viewA.$elem[0]);
    boxB = dom.getAbsoluteBoundingClientRect(viewB.$elem[0]);
    halfGap = boxB.top > boxA.bottom ? (boxB.top - boxA.bottom) / 2 : 0;
    return this.showMarker({
      left: boxA.left,
      top: boxA.bottom + halfGap,
      width: boxA.width
    });
  };

  SnippetDrag.prototype.showMarkerAtBeginningOfContainer = function(elem) {
    var box, paddingTop;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.firstChild, 'top');
    box = dom.getAbsoluteBoundingClientRect(elem);
    paddingTop = parseInt($(elem).css('padding-top')) || 0;
    return this.showMarker({
      left: box.left,
      top: box.top + startAndEndOffset + paddingTop,
      width: box.width
    });
  };

  SnippetDrag.prototype.showMarkerAtEndOfContainer = function(elem) {
    var box, paddingBottom;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.lastChild, 'bottom');
    box = dom.getAbsoluteBoundingClientRect(elem);
    paddingBottom = parseInt($(elem).css('padding-bottom')) || 0;
    return this.showMarker({
      left: box.left,
      top: box.bottom - startAndEndOffset - paddingBottom,
      width: box.width
    });
  };

  SnippetDrag.prototype.showMarker = function(_arg) {
    var $body, left, top, width;
    left = _arg.left, top = _arg.top, width = _arg.width;
    if (this.iframeBox != null) {
      $body = $(this.iframeBox.window.document.body);
      top -= $body.scrollTop();
      left -= $body.scrollLeft();
      left += this.iframeBox.left;
      top += this.iframeBox.top;
      this.$dropMarker.css({
        position: 'fixed'
      });
    } else {
      this.$dropMarker.css({
        position: 'absolute'
      });
    }
    return this.$dropMarker.css({
      left: "" + left + "px",
      top: "" + top + "px",
      width: "" + width + "px"
    }).show();
  };

  SnippetDrag.prototype.makeSpace = function(node, position) {
    var $node;
    if (!(wiggleSpace && (node != null))) {
      return;
    }
    $node = $(node);
    this.lastTransform = $node;
    if (position === 'top') {
      return $node.css({
        transform: "translate(0, " + wiggleSpace + "px)"
      });
    } else {
      return $node.css({
        transform: "translate(0, -" + wiggleSpace + "px)"
      });
    }
  };

  SnippetDrag.prototype.undoMakeSpace = function(node) {
    if (this.lastTransform != null) {
      this.lastTransform.css({
        transform: ''
      });
      return this.lastTransform = void 0;
    }
  };

  SnippetDrag.prototype.highlighContainer = function($container) {
    var _base, _base1;
    if ($container[0] !== this.$highlightedContainer[0]) {
      if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
        _base.removeClass(css.containerHighlight);
      }
      this.$highlightedContainer = $container;
      return typeof (_base1 = this.$highlightedContainer).addClass === "function" ? _base1.addClass(css.containerHighlight) : void 0;
    }
  };

  SnippetDrag.prototype.removeContainerHighlight = function() {
    var _base;
    if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
      _base.removeClass(css.containerHighlight);
    }
    return this.$highlightedContainer = {};
  };

  SnippetDrag.prototype.getElemUnderCursor = function(eventPosition) {
    var elem;
    elem = void 0;
    this.unblockElementFromPoint((function(_this) {
      return function() {
        var clientX, clientY, _ref;
        clientX = eventPosition.clientX, clientY = eventPosition.clientY;
        if ((clientX != null) && (clientY != null)) {
          elem = _this.page.document.elementFromPoint(clientX, clientY);
        }
        if ((elem != null ? elem.nodeName : void 0) === 'IFRAME') {
          return _ref = _this.findElemInIframe(elem, eventPosition), eventPosition = _ref.eventPosition, elem = _ref.elem, _ref;
        } else {
          return _this.iframeBox = void 0;
        }
      };
    })(this));
    return {
      eventPosition: eventPosition,
      elem: elem
    };
  };

  SnippetDrag.prototype.findElemInIframe = function(iframeElem, eventPosition) {
    var $body, box, document, elem;
    this.iframeBox = box = iframeElem.getBoundingClientRect();
    this.iframeBox.window = iframeElem.contentWindow;
    document = iframeElem.contentDocument;
    $body = $(document.body);
    eventPosition.clientX -= box.left;
    eventPosition.clientY -= box.top;
    eventPosition.pageX = eventPosition.clientX + $body.scrollLeft();
    eventPosition.pageY = eventPosition.clientY + $body.scrollTop();
    elem = document.elementFromPoint(eventPosition.clientX, eventPosition.clientY);
    return {
      eventPosition: eventPosition,
      elem: elem
    };
  };

  SnippetDrag.prototype.unblockElementFromPoint = function(callback) {
    if (isSupported('htmlPointerEvents')) {
      this.$dragBlocker.css({
        'pointer-events': 'none'
      });
      callback();
      return this.$dragBlocker.css({
        'pointer-events': 'auto'
      });
    } else {
      this.$dragBlocker.hide();
      this.$placeholder.hide();
      callback();
      this.$dragBlocker.show();
      return this.$placeholder.show();
    }
  };

  SnippetDrag.prototype.drop = function() {
    if (this.target != null) {
      this.moveToTarget(this.target);
      return this.page.snippetWasDropped.fire(this.snippetModel);
    } else {

    }
  };

  SnippetDrag.prototype.moveToTarget = function(target) {
    var snippetModel, snippetTree, snippetView;
    switch (target.target) {
      case 'snippet':
        snippetView = target.snippetView;
        if (target.position === 'before') {
          return snippetView.model.before(this.snippetModel);
        } else {
          return snippetView.model.after(this.snippetModel);
        }
        break;
      case 'container':
        snippetModel = target.snippetView.model;
        return snippetModel.append(target.containerName, this.snippetModel);
      case 'root':
        snippetTree = target.snippetTree;
        return snippetTree.prepend(this.snippetModel);
    }
  };

  SnippetDrag.prototype.reset = function() {
    if (this.started) {
      this.undoMakeSpace();
      this.removeContainerHighlight();
      this.page.$body.css('cursor', '');
      this.page.editableController.reenableAll();
      if (this.$view != null) {
        this.$view.removeClass(css.dragged);
      }
      dom.restoreContainerHeight();
      this.$placeholder.remove();
      return this.$dropMarker.remove();
    }
  };

  SnippetDrag.prototype.createPlaceholder = function() {
    var $placeholder, numberOfDraggedElems, template;
    numberOfDraggedElems = 1;
    template = "<div class=\"" + css.draggedPlaceholder + "\">\n  <span class=\"" + css.draggedPlaceholderCounter + "\">\n    " + numberOfDraggedElems + "\n  </span>\n  Selected Item\n</div>";
    return $placeholder = $(template).css({
      position: "absolute"
    });
  };

  return SnippetDrag;

})();


},{"../configuration/config":7,"../modules/feature_detection/is_supported":25,"./dom":17}],22:[function(require,module,exports){
var EventEmitter, InteractivePage, Livingdoc, Page, Renderer, RenderingContainer, View, assert, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

assert = require('./modules/logging/assert');

RenderingContainer = require('./rendering_container/rendering_container');

Page = require('./rendering_container/page');

InteractivePage = require('./rendering_container/interactive_page');

Renderer = require('./rendering/renderer');

View = require('./rendering/view');

EventEmitter = require('wolfy87-eventemitter');

config = require('./configuration/config');

dom = require('./interaction/dom');

module.exports = Livingdoc = (function(_super) {
  __extends(Livingdoc, _super);

  function Livingdoc(_arg) {
    var snippetTree;
    snippetTree = _arg.snippetTree;
    this.design = snippetTree.design;
    this.setSnippetTree(snippetTree);
    this.views = {};
    this.interactiveView = void 0;
  }

  Livingdoc.prototype.getDropTarget = function(_arg) {
    var clientX, clientY, coords, document, elem, event, target;
    event = _arg.event;
    document = event.target.ownerDocument;
    clientX = event.clientX, clientY = event.clientY;
    elem = document.elementFromPoint(clientX, clientY);
    if (elem != null) {
      coords = {
        left: event.pageX,
        top: event.pageY
      };
      return target = dom.dropTarget(elem, coords);
    }
  };

  Livingdoc.prototype.setSnippetTree = function(snippetTree) {
    assert(snippetTree.design === this.design, 'SnippetTree must have the same design as the document');
    this.model = this.snippetTree = snippetTree;
    return this.forwardSnippetTreeEvents();
  };

  Livingdoc.prototype.forwardSnippetTreeEvents = function() {
    return this.snippetTree.changed.add((function(_this) {
      return function() {
        return _this.emit('change', arguments);
      };
    })(this));
  };

  Livingdoc.prototype.createView = function(parent, options) {
    var $parent, promise, view;
    if (options == null) {
      options = {};
    }
    if (parent == null) {
      parent = window.document.body;
    }
    if (options.readOnly == null) {
      options.readOnly = true;
    }
    $parent = $(parent).first();
    if (options.$wrapper == null) {
      options.$wrapper = this.findWrapper($parent);
    }
    $parent.html('');
    view = new View(this.snippetTree, $parent[0]);
    promise = view.create(options);
    if (view.isInteractive) {
      this.setInteractiveView(view);
    }
    return promise;
  };

  Livingdoc.prototype.appendTo = function(parent, options) {
    var $parent, view;
    if (options == null) {
      options = {};
    }
    $parent = $(parent).first();
    if (options.$wrapper == null) {
      options.$wrapper = this.findWrapper($parent);
    }
    $parent.html('');
    view = new View(this.snippetTree, $parent[0]);
    return view.createRenderer({
      options: options
    });
  };

  Livingdoc.prototype.findWrapper = function($parent) {
    var $wrapper;
    if ($parent.find("." + config.css.section).length === 1) {
      $wrapper = $($parent.html());
    }
    return $wrapper;
  };

  Livingdoc.prototype.setInteractiveView = function(view) {
    assert(this.interactiveView == null, 'Error creating interactive view: Livingdoc can have only one interactive view');
    return this.interactiveView = view;
  };

  Livingdoc.prototype.toHtml = function() {
    return new Renderer({
      snippetTree: this.snippetTree,
      renderingContainer: new RenderingContainer()
    }).html();
  };

  Livingdoc.prototype.serialize = function() {
    return this.snippetTree.serialize();
  };

  Livingdoc.prototype.toJson = function(prettify) {
    var data, indentation, replacer;
    data = this.serialize();
    if (prettify != null) {
      replacer = null;
      indentation = 2;
      return JSON.stringify(data, replacer, indentation);
    } else {
      return JSON.stringify(data);
    }
  };

  Livingdoc.prototype.printModel = function() {
    return this.snippetTree.print();
  };

  Livingdoc.dom = dom;

  return Livingdoc;

})(EventEmitter);


},{"./configuration/config":7,"./interaction/dom":17,"./modules/logging/assert":27,"./rendering/renderer":37,"./rendering/view":39,"./rendering_container/interactive_page":42,"./rendering_container/page":43,"./rendering_container/rendering_container":44,"wolfy87-eventemitter":4}],23:[function(require,module,exports){
var __slice = [].slice;

module.exports = (function() {
  return {
    callOnce: function(callbacks, listener) {
      var selfRemovingFunc;
      selfRemovingFunc = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callbacks.remove(selfRemovingFunc);
        return listener.apply(this, args);
      };
      callbacks.add(selfRemovingFunc);
      return selfRemovingFunc;
    }
  };
})();


},{}],24:[function(require,module,exports){
module.exports = (function() {
  return {
    htmlPointerEvents: function() {
      var element;
      element = document.createElement('x');
      element.style.cssText = 'pointer-events:auto';
      return element.style.pointerEvents === 'auto';
    }
  };
})();


},{}],25:[function(require,module,exports){
var detects, executedTests;

detects = require('./feature_detects');

executedTests = {};

module.exports = function(name) {
  var result;
  if ((result = executedTests[name]) === void 0) {
    return executedTests[name] = Boolean(detects[name]());
  } else {
    return result;
  }
};


},{"./feature_detects":24}],26:[function(require,module,exports){
module.exports = (function() {
  var idCounter, lastId;
  idCounter = lastId = void 0;
  return {
    next: function(user) {
      var nextId;
      if (user == null) {
        user = 'doc';
      }
      nextId = Date.now().toString(32);
      if (lastId === nextId) {
        idCounter += 1;
      } else {
        idCounter = 0;
        lastId = nextId;
      }
      return "" + user + "-" + nextId + idCounter;
    }
  };
})();


},{}],27:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":28}],28:[function(require,module,exports){
var log,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = log = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if (window.console != null) {
    if (args.length && args[args.length - 1] === 'trace') {
      args.pop();
      if (window.console.trace != null) {
        window.console.trace();
      }
    }
    window.console.log.apply(window.console, args);
    return void 0;
  }
};

(function() {
  var LivingdocsError, notify;
  LivingdocsError = (function(_super) {
    __extends(LivingdocsError, _super);

    function LivingdocsError(message) {
      LivingdocsError.__super__.constructor.apply(this, arguments);
      this.message = message;
      this.thrownByLivingdocs = true;
    }

    return LivingdocsError;

  })(Error);
  notify = function(message, level) {
    if (level == null) {
      level = 'error';
    }
    if (typeof _rollbar !== "undefined" && _rollbar !== null) {
      _rollbar.push(new Error(message), function() {
        var _ref;
        if ((level === 'critical' || level === 'error') && (((_ref = window.console) != null ? _ref.error : void 0) != null)) {
          return window.console.error.call(window.console, message);
        } else {
          return log.call(void 0, message);
        }
      });
    } else {
      if (level === 'critical' || level === 'error') {
        throw new LivingdocsError(message);
      } else {
        log.call(void 0, message);
      }
    }
    return void 0;
  };
  log.debug = function(message) {
    if (!log.debugDisabled) {
      return notify(message, 'debug');
    }
  };
  log.warn = function(message) {
    if (!log.warningsDisabled) {
      return notify(message, 'warning');
    }
  };
  return log.error = function(message) {
    return notify(message, 'error');
  };
})();


},{}],29:[function(require,module,exports){
var PropertyValidator;

module.exports = PropertyValidator = (function() {
  var termRegex;

  termRegex = /\w[\w ]*\w/g;

  function PropertyValidator(_arg) {
    this.inputString = _arg.inputString, this.property = _arg.property, this.schemaName = _arg.schemaName, this.parent = _arg.parent, this.scheme = _arg.scheme;
    this.validators = [];
    this.location = this.getLocation();
    if (this.parent != null) {
      this.parent.addRequiredProperty(this.property);
    }
    this.addValidations(this.inputString);
  }

  PropertyValidator.prototype.getLocation = function() {
    if (this.property == null) {
      return '';
    } else if (this.parent != null) {
      return this.parent.location + this.scheme.writeProperty(this.property);
    } else {
      return this.scheme.writeProperty(this.property);
    }
  };

  PropertyValidator.prototype.addValidations = function(configString) {
    var result, term, types;
    while (result = termRegex.exec(configString)) {
      term = result[0];
      if (term === 'optional') {
        this.isOptional = true;
        this.parent.removeRequiredProperty(this.property);
      } else if (term.indexOf('array of ') === 0) {
        this.validators.push('array');
        this.arrayValidator = term.slice(9);
      } else if (term.indexOf(' or ') !== -1) {
        types = term.split(' or ');
        console.log('todo');
      } else {
        this.validators.push(term);
      }
    }
    return void 0;
  };

  PropertyValidator.prototype.validate = function(value, errors) {
    var isValid, name, valid, validate, validators, _i, _len, _ref;
    isValid = true;
    validators = this.scheme.validators;
    _ref = this.validators || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      validate = validators[name];
      if (validate == null) {
        return errors.add("missing validator " + name, {
          location: this.location
        });
      }
      if (valid = validate(value) === true) {
        continue;
      }
      errors.add(valid, {
        location: this.location,
        defaultMessage: "" + name + " validator failed"
      });
      isValid = false;
    }
    if (!(isValid = this.validateArray(value, errors))) {
      return false;
    }
    if (!(isValid = this.validateRequiredProperties(value, errors))) {
      return false;
    }
    return isValid;
  };

  PropertyValidator.prototype.validateArray = function(arr, errors) {
    var entry, index, isValid, location, res, validate, _i, _len, _ref;
    if (this.arrayValidator == null) {
      return true;
    }
    isValid = true;
    validate = this.scheme.validators[this.arrayValidator];
    if (validate == null) {
      return errors.add("missing validator " + this.arrayValidator, {
        location: this.location
      });
    }
    _ref = arr || [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      entry = _ref[index];
      res = validate(entry);
      if (res === true) {
        continue;
      }
      location = "" + this.location + "[" + index + "]";
      errors.add(res, {
        location: location,
        defaultMessage: "" + this.arrayValidator + " validator failed"
      });
      isValid = false;
    }
    return isValid;
  };

  PropertyValidator.prototype.validateOtherProperty = function(key, value, errors) {
    var isValid;
    if (this.otherPropertyValidator == null) {
      return true;
    }
    this.scheme.errors = void 0;
    if (isValid = this.otherPropertyValidator.call(this, key, value)) {
      return true;
    }
    if (this.scheme.errors != null) {
      errors.join(this.scheme.errors, {
        location: "" + this.location + (this.scheme.writeProperty(key))
      });
    } else {
      errors.add("additional property check failed", {
        location: "" + this.location + (this.scheme.writeProperty(key))
      });
    }
    return false;
  };

  PropertyValidator.prototype.validateRequiredProperties = function(obj, errors) {
    var isRequired, isValid, key, _ref;
    isValid = true;
    _ref = this.requiredProperties;
    for (key in _ref) {
      isRequired = _ref[key];
      if ((obj[key] == null) && isRequired) {
        errors.add("required property missing", {
          location: "" + this.location + (this.scheme.writeProperty(key))
        });
        isValid = false;
      }
    }
    return isValid;
  };

  PropertyValidator.prototype.addRequiredProperty = function(key) {
    if (this.requiredProperties == null) {
      this.requiredProperties = {};
    }
    return this.requiredProperties[key] = true;
  };

  PropertyValidator.prototype.removeRequiredProperty = function(key) {
    return this.requiredProperties[key] = void 0;
  };

  return PropertyValidator;

})();


},{}],30:[function(require,module,exports){
var PropertyValidator, Scheme, ValidationErrors, validators;

ValidationErrors = require('./validation_errors');

PropertyValidator = require('./property_validator');

validators = require('./validators');

module.exports = Scheme = (function() {
  var jsVariableName;

  jsVariableName = /^[a-zA-Z]\w*$/;

  function Scheme() {
    this.validators = Object.create(validators);
    this.schemas = {};
  }

  Scheme.prototype.add = function(name, schema) {
    if ($.type(schema) === 'function') {
      return this.validators[name] = schema;
    } else {
      return this.addSchema(name, this.parseConfigObj(schema, void 0, name));
    }
  };

  Scheme.prototype.addSchema = function(name, schema) {
    if (this.validators[name] != null) {
      throw new Error("A validator is alredy registered under this name: " + name);
    }
    this.schemas[name] = schema;
    return this.validators[name] = (function(_this) {
      return function(value) {
        var errors;
        errors = _this.recursiveValidate(schema, value);
        if (errors.hasErrors()) {
          return errors;
        } else {
          return true;
        }
      };
    })(this);
  };

  Scheme.prototype.validate = function(schemaName, obj) {
    var schema;
    this.errors = void 0;
    schema = this.schemas[schemaName];
    if (schema == null) {
      return ["missing schema " + schemaName];
    }
    this.errors = this.recursiveValidate(schema, obj).setRoot(schemaName);
    return !this.errors.hasErrors();
  };

  Scheme.prototype.hasErrors = function() {
    var _ref;
    return (_ref = this.errors) != null ? _ref.hasErrors() : void 0;
  };

  Scheme.prototype.getErrorMessages = function() {
    var _ref;
    return (_ref = this.errors) != null ? _ref.getMessages() : void 0;
  };

  Scheme.prototype.recursiveValidate = function(schemaObj, obj) {
    var errors, isValid, key, parentValidator, propertyValidator, value;
    parentValidator = schemaObj['__validator'];
    errors = new ValidationErrors();
    parentValidator.validate(obj, errors);
    for (key in obj) {
      value = obj[key];
      if (schemaObj[key] != null) {
        propertyValidator = schemaObj[key]['__validator'];
        isValid = propertyValidator.validate(value, errors);
        if (isValid && (propertyValidator.childSchemaName == null) && $.type(value) === 'object') {
          errors.join(this.recursiveValidate(schemaObj[key], value));
        }
      } else {
        parentValidator.validateOtherProperty(key, value, errors);
      }
    }
    return errors;
  };

  Scheme.prototype.parseConfigObj = function(obj, parentValidator, schemaName) {
    var key, propValidator, value, valueType;
    if (parentValidator == null) {
      parentValidator = new PropertyValidator({
        inputString: 'object',
        schemaName: schemaName,
        scheme: this
      });
    }
    for (key in obj) {
      value = obj[key];
      if (this.addParentValidator(parentValidator, key, value)) {
        continue;
      }
      valueType = $.type(value);
      if (valueType === 'string') {
        propValidator = new PropertyValidator({
          inputString: value,
          property: key,
          parent: parentValidator,
          scheme: this
        });
        obj[key] = {
          '__validator': propValidator
        };
      } else if (valueType === 'object') {
        propValidator = new PropertyValidator({
          inputString: 'object',
          property: key,
          parent: parentValidator,
          scheme: this
        });
        obj[key] = this.parseConfigObj(value, propValidator);
      }
    }
    obj['__validator'] = parentValidator;
    return obj;
  };

  Scheme.prototype.addParentValidator = function(parentValidator, key, validator) {
    switch (key) {
      case '__validate':
        parentValidator.addValidations(validator);
        break;
      case '__additionalProperty':
        if ($.type(validator) === 'function') {
          parentValidator.otherPropertyValidator = validator;
        }
        break;
      default:
        return false;
    }
    return true;
  };

  Scheme.prototype.writeProperty = function(value) {
    if (jsVariableName.test(value)) {
      return "." + value;
    } else {
      return "['" + value + "']";
    }
  };

  return Scheme;

})();


},{"./property_validator":29,"./validation_errors":31,"./validators":32}],31:[function(require,module,exports){
var ValidationErrors;

module.exports = ValidationErrors = (function() {
  function ValidationErrors() {}

  ValidationErrors.prototype.hasErrors = function() {
    return this.errors != null;
  };

  ValidationErrors.prototype.setRoot = function(root) {
    this.root = root;
    return this;
  };

  ValidationErrors.prototype.add = function(message, _arg) {
    var defaultMessage, error, location, _ref;
    _ref = _arg != null ? _arg : {}, location = _ref.location, defaultMessage = _ref.defaultMessage;
    if (message === false) {
      message = defaultMessage;
    }
    if (this.errors == null) {
      this.errors = [];
    }
    if ($.type(message) === 'string') {
      this.errors.push({
        path: location,
        message: message
      });
    } else if (message instanceof ValidationErrors) {
      this.join(message, {
        location: location
      });
    } else if (message.path && message.message) {
      error = message;
      this.errors.push({
        path: location + error.path,
        message: error.message
      });
    } else {
      throw new Error('ValidationError.add() unknown error type');
    }
    return false;
  };

  ValidationErrors.prototype.join = function(_arg, _arg1) {
    var error, errors, location, _i, _len, _results;
    errors = _arg.errors;
    location = (_arg1 != null ? _arg1 : {}).location;
    if (errors == null) {
      return;
    }
    if (errors.length) {
      if (this.errors == null) {
        this.errors = [];
      }
      _results = [];
      for (_i = 0, _len = errors.length; _i < _len; _i++) {
        error = errors[_i];
        _results.push(this.errors.push({
          path: (location || '') + error.path,
          message: error.message
        }));
      }
      return _results;
    }
  };

  ValidationErrors.prototype.getMessages = function() {
    var error, messages, _i, _len, _ref;
    messages = [];
    _ref = this.errors || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      error = _ref[_i];
      messages.push("" + (this.root || '') + error.path + ": " + error.message);
    }
    return messages;
  };

  return ValidationErrors;

})();


},{}],32:[function(require,module,exports){
module.exports = {
  'object': function(value) {
    return $.type(value) === 'object';
  },
  'string': function(value) {
    return $.type(value) === 'string';
  },
  'boolean': function(value) {
    return $.type(value) === 'boolean';
  },
  'number': function(value) {
    return $.type(value) === 'number';
  },
  'function': function(value) {
    return $.type(value) === 'function';
  },
  'date': function(value) {
    return $.type(value) === 'date';
  },
  'regexp': function(value) {
    return $.type(value) === 'regexp';
  },
  'array': function(value) {
    return $.type(value) === 'array';
  },
  'falsy': function(value) {
    return !!value === false;
  },
  'truthy': function(value) {
    return !!value === true;
  },
  'not empty': function(value) {
    return !!value === true;
  },
  'deprecated': function(value) {
    return true;
  }
};


},{}],33:[function(require,module,exports){
var OrderedHash;

module.exports = OrderedHash = (function() {
  function OrderedHash() {
    this.obj = {};
    this.length = 0;
  }

  OrderedHash.prototype.push = function(key, value) {
    this.obj[key] = value;
    this[this.length] = value;
    return this.length += 1;
  };

  OrderedHash.prototype.get = function(key) {
    return this.obj[key];
  };

  OrderedHash.prototype.each = function(callback) {
    var value, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      value = this[_i];
      _results.push(callback(value));
    }
    return _results;
  };

  OrderedHash.prototype.toArray = function() {
    var value, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      value = this[_i];
      _results.push(value);
    }
    return _results;
  };

  return OrderedHash;

})();


},{}],34:[function(require,module,exports){
var Semaphore, assert;

assert = require('../modules/logging/assert');

module.exports = Semaphore = (function() {
  function Semaphore() {
    this.count = 0;
    this.started = false;
    this.wasFired = false;
    this.callbacks = [];
  }

  Semaphore.prototype.addCallback = function(callback) {
    if (this.wasFired) {
      return callback();
    } else {
      return this.callbacks.push(callback);
    }
  };

  Semaphore.prototype.isReady = function() {
    return this.wasFired;
  };

  Semaphore.prototype.start = function() {
    assert(!this.started, "Unable to start Semaphore once started.");
    this.started = true;
    return this.fireIfReady();
  };

  Semaphore.prototype.increment = function() {
    assert(!this.wasFired, "Unable to increment count once Semaphore is fired.");
    return this.count += 1;
  };

  Semaphore.prototype.decrement = function() {
    assert(this.count > 0, "Unable to decrement count resulting in negative count.");
    this.count -= 1;
    return this.fireIfReady();
  };

  Semaphore.prototype.wait = function() {
    this.increment();
    return (function(_this) {
      return function() {
        return _this.decrement();
      };
    })(this);
  };

  Semaphore.prototype.fireIfReady = function() {
    var callback, _i, _len, _ref, _results;
    if (this.count === 0 && this.started === true) {
      this.wasFired = true;
      _ref = this.callbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback());
      }
      return _results;
    }
  };

  return Semaphore;

})();


},{"../modules/logging/assert":27}],35:[function(require,module,exports){
module.exports = (function() {
  return {
    isEmpty: function(obj) {
      var name;
      if (obj == null) {
        return true;
      }
      for (name in obj) {
        if (obj.hasOwnProperty(name)) {
          return false;
        }
      }
      return true;
    },
    flatCopy: function(obj) {
      var copy, name, value;
      copy = void 0;
      for (name in obj) {
        value = obj[name];
        copy || (copy = {});
        copy[name] = value;
      }
      return copy;
    }
  };
})();


},{}],36:[function(require,module,exports){
module.exports = (function() {
  return {
    humanize: function(str) {
      var uncamelized;
      uncamelized = $.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1 $2').toLowerCase();
      return this.titleize(uncamelized);
    },
    capitalize: function(str) {
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    titleize: function(str) {
      if (str == null) {
        return '';
      } else {
        return String(str).replace(/(?:^|\s)\S/g, function(c) {
          return c.toUpperCase();
        });
      }
    },
    snakeCase: function(str) {
      return $.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },
    prefix: function(prefix, string) {
      if (string.indexOf(prefix) === 0) {
        return string;
      } else {
        return "" + prefix + string;
      }
    },
    readableJson: function(obj) {
      return JSON.stringify(obj, null, 2);
    },
    camelize: function(str) {
      return $.trim(str).replace(/[-_\s]+(.)?/g, function(match, c) {
        return c.toUpperCase();
      });
    },
    trim: function(str) {
      return str.replace(/^\s+|\s+$/g, '');
    }
  };
})();


},{}],37:[function(require,module,exports){
var Renderer, Semaphore, assert, config, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Semaphore = require('../modules/semaphore');

config = require('../configuration/config');

module.exports = Renderer = (function() {
  function Renderer(_arg) {
    var $wrapper;
    this.snippetTree = _arg.snippetTree, this.renderingContainer = _arg.renderingContainer, $wrapper = _arg.$wrapper;
    assert(this.snippetTree, 'no snippet tree specified');
    assert(this.renderingContainer, 'no rendering container specified');
    this.$root = $(this.renderingContainer.renderNode);
    this.$wrapperHtml = $wrapper;
    this.snippetViews = {};
    this.readySemaphore = new Semaphore();
    this.renderOncePageReady();
    this.readySemaphore.start();
  }

  Renderer.prototype.setRoot = function() {
    var $insert, selector, _ref;
    if (((_ref = this.$wrapperHtml) != null ? _ref.length : void 0) && this.$wrapperHtml.jquery) {
      selector = "." + config.css.section;
      $insert = this.$wrapperHtml.find(selector).add(this.$wrapperHtml.filter(selector));
      if ($insert.length) {
        this.$wrapper = this.$root;
        this.$wrapper.append(this.$wrapperHtml);
        this.$root = $insert;
      }
    }
    return this.$root.data('snippetTree', this.snippetTree);
  };

  Renderer.prototype.renderOncePageReady = function() {
    this.readySemaphore.increment();
    return this.renderingContainer.ready((function(_this) {
      return function() {
        _this.setRoot();
        _this.render();
        _this.setupSnippetTreeListeners();
        return _this.readySemaphore.decrement();
      };
    })(this));
  };

  Renderer.prototype.ready = function(callback) {
    return this.readySemaphore.addCallback(callback);
  };

  Renderer.prototype.isReady = function() {
    return this.readySemaphore.isReady();
  };

  Renderer.prototype.html = function() {
    assert(this.isReady(), 'Cannot generate html. Renderer is not ready.');
    return this.renderingContainer.html();
  };

  Renderer.prototype.setupSnippetTreeListeners = function() {
    this.snippetTree.snippetAdded.add($.proxy(this.snippetAdded, this));
    this.snippetTree.snippetRemoved.add($.proxy(this.snippetRemoved, this));
    this.snippetTree.snippetMoved.add($.proxy(this.snippetMoved, this));
    this.snippetTree.snippetContentChanged.add($.proxy(this.snippetContentChanged, this));
    return this.snippetTree.snippetHtmlChanged.add($.proxy(this.snippetHtmlChanged, this));
  };

  Renderer.prototype.snippetAdded = function(model) {
    return this.insertSnippet(model);
  };

  Renderer.prototype.snippetRemoved = function(model) {
    this.removeSnippet(model);
    return this.deleteCachedSnippetViewForSnippet(model);
  };

  Renderer.prototype.snippetMoved = function(model) {
    this.removeSnippet(model);
    return this.insertSnippet(model);
  };

  Renderer.prototype.snippetContentChanged = function(model) {
    return this.snippetViewForSnippet(model).updateContent();
  };

  Renderer.prototype.snippetHtmlChanged = function(model) {
    return this.snippetViewForSnippet(model).updateHtml();
  };

  Renderer.prototype.snippetViewForSnippet = function(model) {
    var _base, _name;
    return (_base = this.snippetViews)[_name = model.id] || (_base[_name] = model.createView(this.renderingContainer.isReadOnly));
  };

  Renderer.prototype.deleteCachedSnippetViewForSnippet = function(model) {
    return delete this.snippetViews[model.id];
  };

  Renderer.prototype.render = function() {
    return this.snippetTree.each((function(_this) {
      return function(model) {
        return _this.insertSnippet(model);
      };
    })(this));
  };

  Renderer.prototype.clear = function() {
    this.snippetTree.each((function(_this) {
      return function(model) {
        return _this.snippetViewForSnippet(model).setAttachedToDom(false);
      };
    })(this));
    return this.$root.empty();
  };

  Renderer.prototype.redraw = function() {
    this.clear();
    return this.render();
  };

  Renderer.prototype.insertSnippet = function(model) {
    var snippetView;
    if (this.isSnippetAttached(model)) {
      return;
    }
    if (this.isSnippetAttached(model.previous)) {
      this.insertSnippetAsSibling(model.previous, model);
    } else if (this.isSnippetAttached(model.next)) {
      this.insertSnippetAsSibling(model.next, model);
    } else if (model.parentContainer) {
      this.appendSnippetToParentContainer(model);
    } else {
      log.error('Snippet could not be inserted by renderer.');
    }
    snippetView = this.snippetViewForSnippet(model);
    snippetView.setAttachedToDom(true);
    this.renderingContainer.snippetViewWasInserted(snippetView);
    return this.attachChildSnippets(model);
  };

  Renderer.prototype.isSnippetAttached = function(model) {
    return model && this.snippetViewForSnippet(model).isAttachedToDom;
  };

  Renderer.prototype.attachChildSnippets = function(model) {
    return model.children((function(_this) {
      return function(childModel) {
        if (!_this.isSnippetAttached(childModel)) {
          return _this.insertSnippet(childModel);
        }
      };
    })(this));
  };

  Renderer.prototype.insertSnippetAsSibling = function(sibling, model) {
    var method;
    method = sibling === model.previous ? 'after' : 'before';
    return this.$nodeForSnippet(sibling)[method](this.$nodeForSnippet(model));
  };

  Renderer.prototype.appendSnippetToParentContainer = function(model) {
    return this.$nodeForSnippet(model).appendTo(this.$nodeForContainer(model.parentContainer));
  };

  Renderer.prototype.$nodeForSnippet = function(model) {
    return this.snippetViewForSnippet(model).$html;
  };

  Renderer.prototype.$nodeForContainer = function(container) {
    var parentView;
    if (container.isRoot) {
      return this.$root;
    } else {
      parentView = this.snippetViewForSnippet(container.parentSnippet);
      return $(parentView.getDirectiveElement(container.name));
    }
  };

  Renderer.prototype.removeSnippet = function(model) {
    this.snippetViewForSnippet(model).setAttachedToDom(false);
    return this.$nodeForSnippet(model).detach();
  };

  return Renderer;

})();


},{"../configuration/config":7,"../modules/logging/assert":27,"../modules/logging/log":28,"../modules/semaphore":34}],38:[function(require,module,exports){
var DirectiveIterator, SnippetView, attr, config, css, dom, eventing;

config = require('../configuration/config');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

module.exports = SnippetView = (function() {
  function SnippetView(_arg) {
    this.model = _arg.model, this.$html = _arg.$html, this.directives = _arg.directives, this.isReadOnly = _arg.isReadOnly;
    this.$elem = this.$html;
    this.template = this.model.template;
    this.isAttachedToDom = false;
    this.wasAttachedToDom = $.Callbacks();
    if (!this.isReadOnly) {
      this.$html.data('snippet', this).addClass(css.snippet).attr(attr.template, this.template.identifier);
    }
    this.render();
  }

  SnippetView.prototype.render = function(mode) {
    this.updateContent();
    return this.updateHtml();
  };

  SnippetView.prototype.updateContent = function() {
    this.content(this.model.content);
    if (!this.hasFocus()) {
      this.displayOptionals();
    }
    return this.stripHtmlIfReadOnly();
  };

  SnippetView.prototype.updateHtml = function() {
    var name, value, _ref;
    _ref = this.model.styles;
    for (name in _ref) {
      value = _ref[name];
      this.setStyle(name, value);
    }
    return this.stripHtmlIfReadOnly();
  };

  SnippetView.prototype.displayOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        var $elem;
        if (directive.optional) {
          $elem = $(directive.elem);
          if (_this.model.isEmpty(directive.name)) {
            return $elem.css('display', 'none');
          } else {
            return $elem.css('display', '');
          }
        }
      };
    })(this));
  };

  SnippetView.prototype.showOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional) {
          return config.animations.optionals.show($(directive.elem));
        }
      };
    })(this));
  };

  SnippetView.prototype.hideEmptyOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional && _this.model.isEmpty(directive.name)) {
          return config.animations.optionals.hide($(directive.elem));
        }
      };
    })(this));
  };

  SnippetView.prototype.next = function() {
    return this.$html.next().data('snippet');
  };

  SnippetView.prototype.prev = function() {
    return this.$html.prev().data('snippet');
  };

  SnippetView.prototype.afterFocused = function() {
    this.$html.addClass(css.snippetHighlight);
    return this.showOptionals();
  };

  SnippetView.prototype.afterBlurred = function() {
    this.$html.removeClass(css.snippetHighlight);
    return this.hideEmptyOptionals();
  };

  SnippetView.prototype.focus = function(cursor) {
    var first, _ref;
    first = (_ref = this.directives.editable) != null ? _ref[0].elem : void 0;
    return $(first).focus();
  };

  SnippetView.prototype.hasFocus = function() {
    return this.$html.hasClass(css.snippetHighlight);
  };

  SnippetView.prototype.getBoundingClientRect = function() {
    return this.$html[0].getBoundingClientRect();
  };

  SnippetView.prototype.getAbsoluteBoundingClientRect = function() {
    return dom.getAbsoluteBoundingClientRect(this.$html[0]);
  };

  SnippetView.prototype.content = function(content) {
    var directive, name, value, _results;
    _results = [];
    for (name in content) {
      value = content[name];
      directive = this.model.directives.get(name);
      if (directive.isImage) {
        if (directive.base64Image != null) {
          _results.push(this.set(name, directive.base64Image));
        } else {
          _results.push(this.set(name, directive.getImageUrl()));
        }
      } else {
        _results.push(this.set(name, value));
      }
    }
    return _results;
  };

  SnippetView.prototype.set = function(name, value) {
    var directive;
    directive = this.directives.get(name);
    switch (directive.type) {
      case 'editable':
        return this.setEditable(name, value);
      case 'image':
        return this.setImage(name, value);
      case 'html':
        return this.setHtml(name, value);
    }
  };

  SnippetView.prototype.get = function(name) {
    var directive;
    directive = this.directives.get(name);
    switch (directive.type) {
      case 'editable':
        return this.getEditable(name);
      case 'image':
        return this.getImage(name);
      case 'html':
        return this.getHtml(name);
    }
  };

  SnippetView.prototype.getEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  SnippetView.prototype.setEditable = function(name, value) {
    var $elem;
    if (this.hasFocus()) {
      return;
    }
    $elem = this.directives.$getElem(name);
    $elem.toggleClass(css.noPlaceholder, Boolean(value));
    $elem.attr(attr.placeholder, this.template.defaults[name]);
    return $elem.html(value || '');
  };

  SnippetView.prototype.focusEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.addClass(css.noPlaceholder);
  };

  SnippetView.prototype.blurEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    if (this.model.isEmpty(name)) {
      return $elem.removeClass(css.noPlaceholder);
    }
  };

  SnippetView.prototype.getHtml = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  SnippetView.prototype.setHtml = function(name, value) {
    var $elem;
    $elem = this.directives.$getElem(name);
    $elem.html(value || '');
    if (!value) {
      $elem.html(this.template.defaults[name]);
    } else if (value && !this.isReadOnly) {
      this.blockInteraction($elem);
    }
    this.directivesToReset || (this.directivesToReset = {});
    return this.directivesToReset[name] = name;
  };

  SnippetView.prototype.getDirectiveElement = function(directiveName) {
    var _ref;
    return (_ref = this.directives.get(directiveName)) != null ? _ref.elem : void 0;
  };

  SnippetView.prototype.resetDirectives = function() {
    var $elem, name, _results;
    _results = [];
    for (name in this.directivesToReset) {
      $elem = this.directives.$getElem(name);
      if ($elem.find('iframe').length) {
        _results.push(this.set(name, this.model.content[name]));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.getImage = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr('src');
  };

  SnippetView.prototype.setImage = function(name, value) {
    var $elem, imageService, setPlaceholder;
    $elem = this.directives.$getElem(name);
    if (value) {
      this.cancelDelayed(name);
      imageService = this.model.directives.get(name).getImageService();
      imageService.set($elem, value);
      return $elem.removeClass(config.css.emptyImage);
    } else {
      setPlaceholder = $.proxy(this.setPlaceholderImage, this, $elem, name);
      return this.delayUntilAttached(name, setPlaceholder);
    }
  };

  SnippetView.prototype.setPlaceholderImage = function($elem, name) {
    var height, imageService, value, width;
    $elem.addClass(config.css.emptyImage);
    if ($elem[0].nodeName === 'IMG') {
      width = $elem.width();
      height = $elem.height();
    } else {
      width = $elem.outerWidth();
      height = $elem.outerHeight();
    }
    value = "http://placehold.it/" + width + "x" + height + "/BEF56F/B2E668";
    imageService = this.model.directives.get(name).getImageService();
    return imageService.set($elem, value);
  };

  SnippetView.prototype.setStyle = function(name, className) {
    var changes, removeClass, _i, _len, _ref;
    changes = this.template.styles[name].cssClassChanges(className);
    if (changes.remove) {
      _ref = changes.remove;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        removeClass = _ref[_i];
        this.$html.removeClass(removeClass);
      }
    }
    return this.$html.addClass(changes.add);
  };

  SnippetView.prototype.disableTabbing = function($elem) {
    return setTimeout((function(_this) {
      return function() {
        return $elem.find('iframe').attr('tabindex', '-1');
      };
    })(this), 400);
  };

  SnippetView.prototype.blockInteraction = function($elem) {
    var $blocker;
    this.ensureRelativePosition($elem);
    $blocker = $("<div class='" + css.interactionBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
    $elem.append($blocker);
    return this.disableTabbing($elem);
  };

  SnippetView.prototype.ensureRelativePosition = function($elem) {
    var position;
    position = $elem.css('position');
    if (position !== 'absolute' && position !== 'fixed' && position !== 'relative') {
      return $elem.css('position', 'relative');
    }
  };

  SnippetView.prototype.get$container = function() {
    return $(dom.findContainer(this.$html[0]).node);
  };

  SnippetView.prototype.delayUntilAttached = function(name, func) {
    if (this.isAttachedToDom) {
      return func();
    } else {
      this.cancelDelayed(name);
      this.delayed || (this.delayed = {});
      return this.delayed[name] = eventing.callOnce(this.wasAttachedToDom, (function(_this) {
        return function() {
          _this.delayed[name] = void 0;
          return func();
        };
      })(this));
    }
  };

  SnippetView.prototype.cancelDelayed = function(name) {
    var _ref;
    if ((_ref = this.delayed) != null ? _ref[name] : void 0) {
      this.wasAttachedToDom.remove(this.delayed[name]);
      return this.delayed[name] = void 0;
    }
  };

  SnippetView.prototype.stripHtmlIfReadOnly = function() {
    var elem, iterator, _results;
    if (!this.isReadOnly) {
      return;
    }
    iterator = new DirectiveIterator(this.$html[0]);
    _results = [];
    while (elem = iterator.nextElement()) {
      this.stripDocClasses(elem);
      this.stripDocAttributes(elem);
      _results.push(this.stripEmptyAttributes(elem));
    }
    return _results;
  };

  SnippetView.prototype.stripDocClasses = function(elem) {
    var $elem, klass, _i, _len, _ref, _results;
    $elem = $(elem);
    _ref = elem.className.split(/\s+/);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      klass = _ref[_i];
      if (/doc\-.*/i.test(klass)) {
        _results.push($elem.removeClass(klass));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.stripDocAttributes = function(elem) {
    var $elem, attribute, name, _i, _len, _ref, _results;
    $elem = $(elem);
    _ref = Array.prototype.slice.apply(elem.attributes);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      name = attribute.name;
      if (/data\-doc\-.*/i.test(name)) {
        _results.push($elem.removeAttr(name));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.stripEmptyAttributes = function(elem) {
    var $elem, attribute, isEmptyAttribute, isStrippableAttribute, strippableAttributes, _i, _len, _ref, _results;
    $elem = $(elem);
    strippableAttributes = ['style', 'class'];
    _ref = Array.prototype.slice.apply(elem.attributes);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      isStrippableAttribute = strippableAttributes.indexOf(attribute.name) >= 0;
      isEmptyAttribute = attribute.value.trim() === '';
      if (isStrippableAttribute && isEmptyAttribute) {
        _results.push($elem.removeAttr(attribute.name));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SnippetView.prototype.setAttachedToDom = function(newVal) {
    if (newVal === this.isAttachedToDom) {
      return;
    }
    this.isAttachedToDom = newVal;
    if (newVal) {
      this.resetDirectives();
      return this.wasAttachedToDom.fire();
    }
  };

  return SnippetView;

})();


},{"../configuration/config":7,"../interaction/dom":17,"../modules/eventing":23,"../template/directive_iterator":58}],39:[function(require,module,exports){
var InteractivePage, Page, Renderer, View;

Renderer = require('./renderer');

Page = require('../rendering_container/page');

InteractivePage = require('../rendering_container/interactive_page');

module.exports = View = (function() {
  function View(snippetTree, parent) {
    this.snippetTree = snippetTree;
    this.parent = parent;
    if (this.parent == null) {
      this.parent = window.document.body;
    }
    this.isInteractive = false;
  }

  View.prototype.create = function(options) {
    return this.createIFrame(this.parent).then((function(_this) {
      return function(iframe, renderNode) {
        var renderer;
        _this.iframe = iframe;
        renderer = _this.createIFrameRenderer(iframe, options);
        return {
          iframe: iframe,
          renderer: renderer
        };
      };
    })(this));
  };

  View.prototype.createIFrame = function(parent) {
    var deferred, iframe;
    deferred = $.Deferred();
    iframe = parent.ownerDocument.createElement('iframe');
    iframe.src = 'about:blank';
    iframe.setAttribute('frameBorder', '0');
    iframe.onload = function() {
      return deferred.resolve(iframe);
    };
    parent.appendChild(iframe);
    return deferred.promise();
  };

  View.prototype.createIFrameRenderer = function(iframe, options) {
    return this.createRenderer({
      renderNode: iframe.contentDocument.body,
      options: options
    });
  };

  View.prototype.createRenderer = function(_arg) {
    var options, params, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, options = _ref.options;
    params = {
      renderNode: renderNode || this.parent,
      design: this.snippetTree.design
    };
    this.page = this.createPage(params, options);
    return new Renderer({
      renderingContainer: this.page,
      snippetTree: this.snippetTree,
      $wrapper: options.$wrapper
    });
  };

  View.prototype.createPage = function(params, _arg) {
    var interactive, loadResources, readOnly, _ref;
    _ref = _arg != null ? _arg : {}, interactive = _ref.interactive, readOnly = _ref.readOnly, loadResources = _ref.loadResources;
    if (params == null) {
      params = {};
    }
    params.loadResources = loadResources;
    if (interactive != null) {
      this.isInteractive = true;
      return new InteractivePage(params);
    } else {
      return new Page(params);
    }
  };

  return View;

})();


},{"../rendering_container/interactive_page":42,"../rendering_container/page":43,"./renderer":37}],40:[function(require,module,exports){
var CssLoader, Semaphore;

Semaphore = require('../modules/semaphore');

module.exports = CssLoader = (function() {
  function CssLoader(window) {
    this.window = window;
    this.loadedUrls = [];
  }

  CssLoader.prototype.load = function(urls, callback) {
    var semaphore, url, _i, _len;
    if (callback == null) {
      callback = $.noop;
    }
    if (this.isDisabled) {
      return callback();
    }
    if (!$.isArray(urls)) {
      urls = [urls];
    }
    semaphore = new Semaphore();
    semaphore.addCallback(callback);
    for (_i = 0, _len = urls.length; _i < _len; _i++) {
      url = urls[_i];
      this.loadSingleUrl(url, semaphore.wait());
    }
    return semaphore.start();
  };

  CssLoader.prototype.disable = function() {
    return this.isDisabled = true;
  };

  CssLoader.prototype.loadSingleUrl = function(url, callback) {
    var link;
    if (callback == null) {
      callback = $.noop;
    }
    if (this.isDisabled) {
      return callback();
    }
    if (this.isUrlLoaded(url)) {
      return callback();
    } else {
      link = $('<link rel="stylesheet" type="text/css" />')[0];
      link.onload = callback;
      link.onerror = function() {
        console.warn("Stylesheet could not be loaded: " + url);
        return callback();
      };
      link.href = url;
      this.window.document.head.appendChild(link);
      return this.markUrlAsLoaded(url);
    }
  };

  CssLoader.prototype.isUrlLoaded = function(url) {
    return this.loadedUrls.indexOf(url) >= 0;
  };

  CssLoader.prototype.markUrlAsLoaded = function(url) {
    return this.loadedUrls.push(url);
  };

  return CssLoader;

})();


},{"../modules/semaphore":34}],41:[function(require,module,exports){
var DragBase, EditorPage, SnippetDrag, config, css;

config = require('../configuration/config');

css = config.css;

DragBase = require('../interaction/drag_base');

SnippetDrag = require('../interaction/snippet_drag');

module.exports = EditorPage = (function() {
  function EditorPage() {
    this.setWindow();
    this.dragBase = new DragBase(this);
    this.editableController = {
      disableAll: function() {},
      reenableAll: function() {}
    };
    this.snippetWasDropped = {
      fire: function() {}
    };
    this.blurFocusedElement = function() {};
  }

  EditorPage.prototype.startDrag = function(_arg) {
    var config, event, snippetDrag, snippetModel, snippetView;
    snippetModel = _arg.snippetModel, snippetView = _arg.snippetView, event = _arg.event, config = _arg.config;
    if (!(snippetModel || snippetView)) {
      return;
    }
    if (snippetView) {
      snippetModel = snippetView.model;
    }
    snippetDrag = new SnippetDrag({
      snippetModel: snippetModel,
      snippetView: snippetView
    });
    if (config == null) {
      config = {
        longpress: {
          showIndicator: true,
          delay: 400,
          tolerance: 3
        }
      };
    }
    return this.dragBase.init(snippetDrag, event, config);
  };

  EditorPage.prototype.setWindow = function() {
    this.window = window;
    this.document = this.window.document;
    this.$document = $(this.document);
    return this.$body = $(this.document.body);
  };

  return EditorPage;

})();


},{"../configuration/config":7,"../interaction/drag_base":18,"../interaction/snippet_drag":21}],42:[function(require,module,exports){
var DragBase, EditableController, Focus, InteractivePage, Page, SnippetDrag, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

config = require('../configuration/config');

Page = require('./page');

dom = require('../interaction/dom');

Focus = require('../interaction/focus');

EditableController = require('../interaction/editable_controller');

DragBase = require('../interaction/drag_base');

SnippetDrag = require('../interaction/snippet_drag');

module.exports = InteractivePage = (function(_super) {
  var LEFT_MOUSE_BUTTON;

  __extends(InteractivePage, _super);

  LEFT_MOUSE_BUTTON = 1;

  InteractivePage.prototype.isReadOnly = false;

  function InteractivePage(_arg) {
    var hostWindow, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, hostWindow = _ref.hostWindow;
    InteractivePage.__super__.constructor.apply(this, arguments);
    this.focus = new Focus();
    this.editableController = new EditableController(this);
    this.imageClick = $.Callbacks();
    this.htmlElementClick = $.Callbacks();
    this.snippetWillBeDragged = $.Callbacks();
    this.snippetWasDropped = $.Callbacks();
    this.dragBase = new DragBase(this);
    this.focus.snippetFocus.add($.proxy(this.afterSnippetFocused, this));
    this.focus.snippetBlur.add($.proxy(this.afterSnippetBlurred, this));
    this.beforeInteractivePageReady();
    this.$document.on('mousedown.livingdocs', $.proxy(this.mousedown, this)).on('touchstart.livingdocs', $.proxy(this.mousedown, this)).on('dragstart', $.proxy(this.browserDragStart, this));
  }

  InteractivePage.prototype.beforeInteractivePageReady = function() {
    if (config.livingdocsCssFile) {
      return this.cssLoader.load(config.livingdocsCssFile, this.readySemaphore.wait());
    }
  };

  InteractivePage.prototype.browserDragStart = function(event) {
    event.preventDefault();
    return event.stopPropagation();
  };

  InteractivePage.prototype.removeListeners = function() {
    this.$document.off('.livingdocs');
    return this.$document.off('.livingdocs-drag');
  };

  InteractivePage.prototype.mousedown = function(event) {
    var isControl, snippetView;
    if (event.which !== LEFT_MOUSE_BUTTON && event.type === 'mousedown') {
      return;
    }
    isControl = $(event.target).closest(config.ignoreInteraction).length;
    if (isControl) {
      return;
    }
    snippetView = dom.findSnippetView(event.target);
    this.handleClickedSnippet(event, snippetView);
    if (snippetView) {
      return this.startDrag({
        snippetView: snippetView,
        event: event
      });
    }
  };

  InteractivePage.prototype.startDrag = function(_arg) {
    var config, event, snippetDrag, snippetModel, snippetView;
    snippetModel = _arg.snippetModel, snippetView = _arg.snippetView, event = _arg.event, config = _arg.config;
    if (!(snippetModel || snippetView)) {
      return;
    }
    if (snippetView) {
      snippetModel = snippetView.model;
    }
    snippetDrag = new SnippetDrag({
      snippetModel: snippetModel,
      snippetView: snippetView
    });
    if (config == null) {
      config = {
        longpress: {
          showIndicator: true,
          delay: 400,
          tolerance: 3
        }
      };
    }
    return this.dragBase.init(snippetDrag, event, config);
  };

  InteractivePage.prototype.cancelDrag = function() {
    return this.dragBase.cancel();
  };

  InteractivePage.prototype.handleClickedSnippet = function(event, snippetView) {
    var nodeContext;
    if (snippetView) {
      this.focus.snippetFocused(snippetView);
      nodeContext = dom.findNodeContext(event.target);
      if (nodeContext) {
        switch (nodeContext.contextAttr) {
          case config.directives.image.renderedAttr:
            return this.imageClick.fire(snippetView, nodeContext.attrName, event);
          case config.directives.html.renderedAttr:
            return this.htmlElementClick.fire(snippetView, nodeContext.attrName, event);
        }
      }
    } else {
      return this.focus.blur();
    }
  };

  InteractivePage.prototype.getFocusedElement = function() {
    return window.document.activeElement;
  };

  InteractivePage.prototype.blurFocusedElement = function() {
    var focusedElement;
    this.focus.setFocus(void 0);
    focusedElement = this.getFocusedElement();
    if (focusedElement) {
      return $(focusedElement).blur();
    }
  };

  InteractivePage.prototype.snippetViewWasInserted = function(snippetView) {
    return this.initializeEditables(snippetView);
  };

  InteractivePage.prototype.initializeEditables = function(snippetView) {
    var directive, editableNodes;
    if (snippetView.directives.editable) {
      editableNodes = (function() {
        var _i, _len, _ref, _results;
        _ref = snippetView.directives.editable;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          directive = _ref[_i];
          _results.push(directive.elem);
        }
        return _results;
      })();
      return this.editableController.add(editableNodes);
    }
  };

  InteractivePage.prototype.afterSnippetFocused = function(snippetView) {
    return snippetView.afterFocused();
  };

  InteractivePage.prototype.afterSnippetBlurred = function(snippetView) {
    return snippetView.afterBlurred();
  };

  return InteractivePage;

})(Page);


},{"../configuration/config":7,"../interaction/dom":17,"../interaction/drag_base":18,"../interaction/editable_controller":19,"../interaction/focus":20,"../interaction/snippet_drag":21,"./page":43}],43:[function(require,module,exports){
var CssLoader, Page, RenderingContainer, config,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RenderingContainer = require('./rendering_container');

CssLoader = require('./css_loader');

config = require('../configuration/config');

module.exports = Page = (function(_super) {
  __extends(Page, _super);

  function Page(_arg) {
    var hostWindow, readOnly, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design, this.snippetTree = _ref.snippetTree, this.loadResources = _ref.loadResources;
    this.beforePageReady = __bind(this.beforePageReady, this);
    if (readOnly != null) {
      this.isReadOnly = readOnly;
    }
    this.renderNode = (renderNode != null ? renderNode.jquery : void 0) ? renderNode[0] : renderNode;
    this.setWindow(hostWindow);
    if (this.renderNode == null) {
      this.renderNode = $("." + config.css.section, this.$body);
    }
    Page.__super__.constructor.call(this);
    this.cssLoader = new CssLoader(this.window);
    if (!this.shouldLoadResources()) {
      this.cssLoader.disable();
    }
    this.beforePageReady();
  }

  Page.prototype.beforeReady = function() {
    this.readySemaphore.wait();
    return setTimeout((function(_this) {
      return function() {
        return _this.readySemaphore.decrement();
      };
    })(this), 0);
  };

  Page.prototype.shouldLoadResources = function() {
    if (this.loadResources != null) {
      return Boolean(this.loadResources);
    } else {
      return Boolean(config.loadResources);
    }
  };

  Page.prototype.beforePageReady = function() {
    var cssLocation, designPath, path;
    if (this.design != null) {
      designPath = "" + config.designPath + "/" + this.design.name;
      cssLocation = this.design.css != null ? this.design.css : '/css/style.css';
      path = "" + designPath + cssLocation;
      return this.cssLoader.load(path, this.readySemaphore.wait());
    }
  };

  Page.prototype.setWindow = function(hostWindow) {
    if (hostWindow == null) {
      hostWindow = this.getParentWindow(this.renderNode);
    }
    this.window = hostWindow;
    this.document = this.window.document;
    this.$document = $(this.document);
    return this.$body = $(this.document.body);
  };

  Page.prototype.getParentWindow = function(elem) {
    if (elem != null) {
      return elem.ownerDocument.defaultView;
    } else {
      return window;
    }
  };

  return Page;

})(RenderingContainer);


},{"../configuration/config":7,"./css_loader":40,"./rendering_container":44}],44:[function(require,module,exports){
var RenderingContainer, Semaphore;

Semaphore = require('../modules/semaphore');

module.exports = RenderingContainer = (function() {
  RenderingContainer.prototype.isReadOnly = true;

  function RenderingContainer() {
    if (this.renderNode == null) {
      this.renderNode = $('<div/>')[0];
    }
    this.readySemaphore = new Semaphore();
    this.beforeReady();
    this.readySemaphore.start();
  }

  RenderingContainer.prototype.html = function() {
    return $(this.renderNode).html();
  };

  RenderingContainer.prototype.snippetViewWasInserted = function(snippetView) {};

  RenderingContainer.prototype.beforeReady = function() {};

  RenderingContainer.prototype.ready = function(callback) {
    return this.readySemaphore.addCallback(callback);
  };

  return RenderingContainer;

})();


},{"../modules/semaphore":34}],45:[function(require,module,exports){
var EditableDirective, assert;

assert = require('../modules/logging/assert');

module.exports = EditableDirective = (function() {
  function EditableDirective(_arg) {
    this.snippet = _arg.snippet, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  EditableDirective.prototype.isEditable = true;

  EditableDirective.prototype.getContent = function() {
    return this.snippet.content[this.name];
  };

  return EditableDirective;

})();


},{"../modules/logging/assert":27}],46:[function(require,module,exports){
var HtmlDirective, assert;

assert = require('../modules/logging/assert');

module.exports = HtmlDirective = (function() {
  function HtmlDirective(_arg) {
    this.snippet = _arg.snippet, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  HtmlDirective.prototype.isHtml = true;

  HtmlDirective.prototype.getContent = function() {
    return this.snippet.content[this.name];
  };

  return HtmlDirective;

})();


},{"../modules/logging/assert":27}],47:[function(require,module,exports){
var ImageDirective, assert, imageService;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

module.exports = ImageDirective = (function() {
  function ImageDirective(_arg) {
    this.snippet = _arg.snippet, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  ImageDirective.prototype.isImage = true;

  ImageDirective.prototype.setContent = function(value) {
    return this.setImageUrl(value);
  };

  ImageDirective.prototype.getContent = function() {
    return this.getImageUrl();
  };

  ImageDirective.prototype.isBackgroundImage = function(directive) {
    return this.templateDirective.getTagName() !== 'img';
  };

  ImageDirective.prototype.isInlineImage = function(directive) {
    return this.templateDirective.getTagName() === 'img';
  };

  ImageDirective.prototype.setBase64Image = function(base64String) {
    this.base64Image = base64String;
    if (this.snippet.snippetTree) {
      return this.snippet.snippetTree.contentChanging(this.snippet, this.name);
    }
  };

  ImageDirective.prototype.setImageUrl = function(value) {
    var _base, _name;
    if ((_base = this.snippet.content)[_name = this.name] == null) {
      _base[_name] = {};
    }
    this.snippet.content[this.name].url = value;
    this.resetCrop();
    this.base64Image = void 0;
    return this.processImageUrl(value);
  };

  ImageDirective.prototype.getImageUrl = function() {
    var image;
    image = this.snippet.content[this.name];
    if (image) {
      return image.url;
    } else {
      return void 0;
    }
  };

  ImageDirective.prototype.getImageObject = function() {
    return this.snippet.content[this.name];
  };

  ImageDirective.prototype.getOriginalUrl = function() {
    return this.snippet.content[this.name].originalUrl || this.getImageUrl();
  };

  ImageDirective.prototype.setCrop = function(_arg) {
    var currentValue, height, name, width, x, y;
    x = _arg.x, y = _arg.y, width = _arg.width, height = _arg.height, name = _arg.name;
    currentValue = this.snippet.content[this.name];
    if ((currentValue != null ? currentValue.url : void 0) != null) {
      currentValue.crop = {
        x: x,
        y: y,
        width: width,
        height: height,
        name: name
      };
      this.processImageUrl(currentValue.originalUrl || currentValue.url);
      if (this.snippet.snippetTree) {
        return this.snippet.snippetTree.contentChanging(this.snippet, this.name);
      }
    }
  };

  ImageDirective.prototype.resetCrop = function() {
    var currentValue;
    currentValue = this.snippet.content[this.name];
    if (currentValue != null) {
      return currentValue.crop = null;
    }
  };

  ImageDirective.prototype.setImageService = function(imageServiceName) {
    var imageUrl;
    assert(imageService.has(imageServiceName), "Error: could not load image service " + imageServiceName);
    imageUrl = this.getImageUrl();
    return this.snippet.content[this.name] = {
      url: imageUrl,
      imageService: imageServiceName || null
    };
  };

  ImageDirective.prototype.getImageServiceName = function() {
    return this.getImageService().name;
  };

  ImageDirective.prototype.hasDefaultImageService = function() {
    return this.getImageServiceName() === 'default';
  };

  ImageDirective.prototype.getImageService = function() {
    var serviceName, _ref;
    serviceName = (_ref = this.snippet.content[this.name]) != null ? _ref.imageService : void 0;
    return imageService.get(serviceName || void 0);
  };

  ImageDirective.prototype.processImageUrl = function(url) {
    var imgObj, imgService;
    if (!this.hasDefaultImageService()) {
      imgService = this.getImageService();
      imgObj = this.getImageObject();
      imgObj.url = imgService.getUrl(url, {
        crop: imgObj.crop
      });
      return imgObj.originalUrl = url;
    }
  };

  return ImageDirective;

})();


},{"../image_services/image_service":15,"../modules/logging/assert":27}],48:[function(require,module,exports){
var SnippetArray;

module.exports = SnippetArray = (function() {
  function SnippetArray(snippets) {
    this.snippets = snippets;
    if (this.snippets == null) {
      this.snippets = [];
    }
    this.createPseudoArray();
  }

  SnippetArray.prototype.createPseudoArray = function() {
    var index, result, _i, _len, _ref;
    _ref = this.snippets;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      result = _ref[index];
      this[index] = result;
    }
    this.length = this.snippets.length;
    if (this.snippets.length) {
      this.first = this[0];
      return this.last = this[this.snippets.length - 1];
    }
  };

  SnippetArray.prototype.each = function(callback) {
    var snippet, _i, _len, _ref;
    _ref = this.snippets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      snippet = _ref[_i];
      callback(snippet);
    }
    return this;
  };

  SnippetArray.prototype.remove = function() {
    this.each(function(snippet) {
      return snippet.remove();
    });
    return this;
  };

  return SnippetArray;

})();


},{}],49:[function(require,module,exports){
var SnippetContainer, assert;

assert = require('../modules/logging/assert');

module.exports = SnippetContainer = (function() {
  function SnippetContainer(_arg) {
    var isRoot;
    this.parentSnippet = _arg.parentSnippet, this.name = _arg.name, isRoot = _arg.isRoot;
    this.isRoot = isRoot != null;
    this.first = this.last = void 0;
  }

  SnippetContainer.prototype.prepend = function(snippet) {
    if (this.first) {
      this.insertBefore(this.first, snippet);
    } else {
      this.attachSnippet(snippet);
    }
    return this;
  };

  SnippetContainer.prototype.append = function(snippet) {
    if (this.parentSnippet) {
      assert(snippet !== this.parentSnippet, 'cannot append snippet to itself');
    }
    if (this.last) {
      this.insertAfter(this.last, snippet);
    } else {
      this.attachSnippet(snippet);
    }
    return this;
  };

  SnippetContainer.prototype.insertBefore = function(snippet, insertedSnippet) {
    var position;
    if (snippet.previous === insertedSnippet) {
      return;
    }
    assert(snippet !== insertedSnippet, 'cannot insert snippet before itself');
    position = {
      previous: snippet.previous,
      next: snippet,
      parentContainer: snippet.parentContainer
    };
    return this.attachSnippet(insertedSnippet, position);
  };

  SnippetContainer.prototype.insertAfter = function(snippet, insertedSnippet) {
    var position;
    if (snippet.next === insertedSnippet) {
      return;
    }
    assert(snippet !== insertedSnippet, 'cannot insert snippet after itself');
    position = {
      previous: snippet,
      next: snippet.next,
      parentContainer: snippet.parentContainer
    };
    return this.attachSnippet(insertedSnippet, position);
  };

  SnippetContainer.prototype.up = function(snippet) {
    if (snippet.previous != null) {
      return this.insertBefore(snippet.previous, snippet);
    }
  };

  SnippetContainer.prototype.down = function(snippet) {
    if (snippet.next != null) {
      return this.insertAfter(snippet.next, snippet);
    }
  };

  SnippetContainer.prototype.getSnippetTree = function() {
    var _ref;
    return this.snippetTree || ((_ref = this.parentSnippet) != null ? _ref.snippetTree : void 0);
  };

  SnippetContainer.prototype.each = function(callback) {
    var snippet, _results;
    snippet = this.first;
    _results = [];
    while (snippet) {
      snippet.descendantsAndSelf(callback);
      _results.push(snippet = snippet.next);
    }
    return _results;
  };

  SnippetContainer.prototype.eachContainer = function(callback) {
    callback(this);
    return this.each(function(snippet) {
      var name, snippetContainer, _ref, _results;
      _ref = snippet.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetContainer.prototype.all = function(callback) {
    callback(this);
    return this.each(function(snippet) {
      var name, snippetContainer, _ref, _results;
      callback(snippet);
      _ref = snippet.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetContainer.prototype.remove = function(snippet) {
    snippet.destroy();
    return this._detachSnippet(snippet);
  };

  SnippetContainer.prototype.attachSnippet = function(snippet, position) {
    var func, snippetTree;
    if (position == null) {
      position = {};
    }
    func = (function(_this) {
      return function() {
        return _this.link(snippet, position);
      };
    })(this);
    if (snippetTree = this.getSnippetTree()) {
      return snippetTree.attachingSnippet(snippet, func);
    } else {
      return func();
    }
  };

  SnippetContainer.prototype._detachSnippet = function(snippet) {
    var func, snippetTree;
    func = (function(_this) {
      return function() {
        return _this.unlink(snippet);
      };
    })(this);
    if (snippetTree = this.getSnippetTree()) {
      return snippetTree.detachingSnippet(snippet, func);
    } else {
      return func();
    }
  };

  SnippetContainer.prototype.link = function(snippet, position) {
    if (snippet.parentContainer) {
      this.unlink(snippet);
    }
    position.parentContainer || (position.parentContainer = this);
    return this.setSnippetPosition(snippet, position);
  };

  SnippetContainer.prototype.unlink = function(snippet) {
    var container, _ref, _ref1;
    container = snippet.parentContainer;
    if (container) {
      if (snippet.previous == null) {
        container.first = snippet.next;
      }
      if (snippet.next == null) {
        container.last = snippet.previous;
      }
      if ((_ref = snippet.next) != null) {
        _ref.previous = snippet.previous;
      }
      if ((_ref1 = snippet.previous) != null) {
        _ref1.next = snippet.next;
      }
      return this.setSnippetPosition(snippet, {});
    }
  };

  SnippetContainer.prototype.setSnippetPosition = function(snippet, _arg) {
    var next, parentContainer, previous;
    parentContainer = _arg.parentContainer, previous = _arg.previous, next = _arg.next;
    snippet.parentContainer = parentContainer;
    snippet.previous = previous;
    snippet.next = next;
    if (parentContainer) {
      if (previous) {
        previous.next = snippet;
      }
      if (next) {
        next.previous = snippet;
      }
      if (snippet.previous == null) {
        parentContainer.first = snippet;
      }
      if (snippet.next == null) {
        return parentContainer.last = snippet;
      }
    }
  };

  return SnippetContainer;

})();


},{"../modules/logging/assert":27}],50:[function(require,module,exports){
var EditableDirective, HtmlDirective, ImageDirective, assert, imageService;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

EditableDirective = require('./editable_directive');

ImageDirective = require('./image_directive');

HtmlDirective = require('./html_directive');

module.exports = {
  create: function(_arg) {
    var Directive, snippet, templateDirective;
    snippet = _arg.snippet, templateDirective = _arg.templateDirective;
    Directive = this.getDirectiveConstructor(templateDirective.type);
    return new Directive({
      snippet: snippet,
      templateDirective: templateDirective
    });
  },
  getDirectiveConstructor: function(directiveType) {
    switch (directiveType) {
      case 'editable':
        return EditableDirective;
      case 'image':
        return ImageDirective;
      case 'html':
        return HtmlDirective;
      default:
        return assert(false, "Unsupported snippet directive: " + directiveType);
    }
  }
};


},{"../image_services/image_service":15,"../modules/logging/assert":27,"./editable_directive":45,"./html_directive":46,"./image_directive":47}],51:[function(require,module,exports){
var DirectiveCollection, SnippetContainer, SnippetModel, assert, config, deepEqual, directiveFactory, guid, log;

deepEqual = require('deep-equal');

config = require('../configuration/config');

SnippetContainer = require('./snippet_container');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

directiveFactory = require('./snippet_directive_factory');

DirectiveCollection = require('../template/directive_collection');

module.exports = SnippetModel = (function() {
  function SnippetModel(_arg) {
    var id, _ref;
    _ref = _arg != null ? _arg : {}, this.template = _ref.template, id = _ref.id;
    assert(this.template, 'cannot instantiate snippet without template reference');
    this.initializeDirectives();
    this.styles = {};
    this.dataValues = {};
    this.id = id || guid.next();
    this.identifier = this.template.identifier;
    this.next = void 0;
    this.previous = void 0;
    this.snippetTree = void 0;
  }

  SnippetModel.prototype.initializeDirectives = function() {
    var directive, _i, _len, _ref, _results;
    this.directives = new DirectiveCollection();
    _ref = this.template.directives;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      directive = _ref[_i];
      switch (directive.type) {
        case 'container':
          this.containers || (this.containers = {});
          _results.push(this.containers[directive.name] = new SnippetContainer({
            name: directive.name,
            parentSnippet: this
          }));
          break;
        case 'editable':
        case 'image':
        case 'html':
          this.createSnippetDirective(directive);
          this.content || (this.content = {});
          _results.push(this.content[directive.name] = void 0);
          break;
        default:
          _results.push(log.error("Template directive type '" + directive.type + "' not implemented in SnippetModel"));
      }
    }
    return _results;
  };

  SnippetModel.prototype.createSnippetDirective = function(templateDirective) {
    return this.directives.add(directiveFactory.create({
      snippet: this,
      templateDirective: templateDirective
    }));
  };

  SnippetModel.prototype.createView = function(isReadOnly) {
    return this.template.createView(this, isReadOnly);
  };

  SnippetModel.prototype.before = function(snippetModel) {
    if (snippetModel) {
      this.parentContainer.insertBefore(this, snippetModel);
      return this;
    } else {
      return this.previous;
    }
  };

  SnippetModel.prototype.after = function(snippetModel) {
    if (snippetModel) {
      this.parentContainer.insertAfter(this, snippetModel);
      return this;
    } else {
      return this.next;
    }
  };

  SnippetModel.prototype.append = function(containerName, snippetModel) {
    if (arguments.length === 1) {
      snippetModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].append(snippetModel);
    return this;
  };

  SnippetModel.prototype.prepend = function(containerName, snippetModel) {
    if (arguments.length === 1) {
      snippetModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].prepend(snippetModel);
    return this;
  };

  SnippetModel.prototype.up = function() {
    this.parentContainer.up(this);
    return this;
  };

  SnippetModel.prototype.down = function() {
    this.parentContainer.down(this);
    return this;
  };

  SnippetModel.prototype.remove = function() {
    return this.parentContainer.remove(this);
  };

  SnippetModel.prototype.getParent = function() {
    var _ref;
    return (_ref = this.parentContainer) != null ? _ref.parentSnippet : void 0;
  };

  SnippetModel.prototype.parents = function(callback) {
    var snippetModel, _results;
    snippetModel = this;
    _results = [];
    while ((snippetModel = snippetModel.getParent())) {
      _results.push(callback(snippetModel));
    }
    return _results;
  };

  SnippetModel.prototype.children = function(callback) {
    var name, snippetContainer, snippetModel, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      snippetContainer = _ref[name];
      snippetModel = snippetContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (snippetModel) {
          callback(snippetModel);
          _results1.push(snippetModel = snippetModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  SnippetModel.prototype.descendants = function(callback) {
    var name, snippetContainer, snippetModel, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      snippetContainer = _ref[name];
      snippetModel = snippetContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (snippetModel) {
          callback(snippetModel);
          snippetModel.descendants(callback);
          _results1.push(snippetModel = snippetModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  SnippetModel.prototype.descendantsAndSelf = function(callback) {
    callback(this);
    return this.descendants(callback);
  };

  SnippetModel.prototype.descendantContainers = function(callback) {
    return this.descendantsAndSelf(function(snippetModel) {
      var name, snippetContainer, _ref, _results;
      _ref = snippetModel.containers;
      _results = [];
      for (name in _ref) {
        snippetContainer = _ref[name];
        _results.push(callback(snippetContainer));
      }
      return _results;
    });
  };

  SnippetModel.prototype.allDescendants = function(callback) {
    return this.descendantsAndSelf((function(_this) {
      return function(snippetModel) {
        var name, snippetContainer, _ref, _results;
        if (snippetModel !== _this) {
          callback(snippetModel);
        }
        _ref = snippetModel.containers;
        _results = [];
        for (name in _ref) {
          snippetContainer = _ref[name];
          _results.push(callback(snippetContainer));
        }
        return _results;
      };
    })(this));
  };

  SnippetModel.prototype.childrenAndSelf = function(callback) {
    callback(this);
    return this.children(callback);
  };

  SnippetModel.prototype.hasContainers = function() {
    return this.directives.count('container') > 0;
  };

  SnippetModel.prototype.hasEditables = function() {
    return this.directives.count('editable') > 0;
  };

  SnippetModel.prototype.hasHtml = function() {
    return this.directives.count('html') > 0;
  };

  SnippetModel.prototype.hasImages = function() {
    return this.directives.count('image') > 0;
  };

  SnippetModel.prototype.setContent = function(name, value) {
    if (!value) {
      if (this.content[name]) {
        this.content[name] = void 0;
        if (this.snippetTree) {
          return this.snippetTree.contentChanging(this, name);
        }
      }
    } else if (typeof value === 'string') {
      if (this.content[name] !== value) {
        this.content[name] = value;
        if (this.snippetTree) {
          return this.snippetTree.contentChanging(this, name);
        }
      }
    } else {
      if (!deepEqual(this.content[name], value)) {
        this.content[name] = value;
        if (this.snippetTree) {
          return this.snippetTree.contentChanging(this, name);
        }
      }
    }
  };

  SnippetModel.prototype.set = function(name, value) {
    var directive, _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "set error: " + this.identifier + " has no content named " + name);
    directive = this.directives.get(name);
    if (directive.isImage) {
      if (directive.getImageUrl() !== value) {
        directive.setImageUrl(value);
        if (this.snippetTree) {
          return this.snippetTree.contentChanging(this, name);
        }
      }
    } else {
      return this.setContent(name, value);
    }
  };

  SnippetModel.prototype.get = function(name) {
    var _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "get error: " + this.identifier + " has no content named " + name);
    return this.directives.get(name).getContent();
  };

  SnippetModel.prototype.isEmpty = function(name) {
    var value;
    value = this.get(name);
    return value === void 0 || value === '';
  };

  SnippetModel.prototype.data = function(arg) {
    var changedDataProperties, name, value;
    if (typeof arg === 'object') {
      changedDataProperties = [];
      for (name in arg) {
        value = arg[name];
        if (this.changeData(name, value)) {
          changedDataProperties.push(name);
        }
      }
      if (this.snippetTree && changedDataProperties.length > 0) {
        return this.snippetTree.dataChanging(this, changedDataProperties);
      }
    } else {
      return this.dataValues[arg];
    }
  };

  SnippetModel.prototype.changeData = function(name, value) {
    if (!deepEqual(this.dataValues[name], value)) {
      this.dataValues[name] = value;
      return true;
    } else {
      return false;
    }
  };

  SnippetModel.prototype.getStyle = function(name) {
    return this.styles[name];
  };

  SnippetModel.prototype.setStyle = function(name, value) {
    var style;
    style = this.template.styles[name];
    if (!style) {
      return log.warn("Unknown style '" + name + "' in SnippetModel " + this.identifier);
    } else if (!style.validateValue(value)) {
      return log.warn("Invalid value '" + value + "' for style '" + name + "' in SnippetModel " + this.identifier);
    } else {
      if (this.styles[name] !== value) {
        this.styles[name] = value;
        if (this.snippetTree) {
          return this.snippetTree.htmlChanging(this, 'style', {
            name: name,
            value: value
          });
        }
      }
    }
  };

  SnippetModel.prototype.style = function(name, value) {
    console.log("SnippetModel#style() is deprecated. Please use #getStyle() and #setStyle().");
    if (arguments.length === 1) {
      return this.styles[name];
    } else {
      return this.setStyle(name, value);
    }
  };

  SnippetModel.prototype.copy = function() {
    return log.warn("SnippetModel#copy() is not implemented yet.");
  };

  SnippetModel.prototype.copyWithoutContent = function() {
    return this.template.createModel();
  };

  SnippetModel.prototype.destroy = function() {};

  return SnippetModel;

})();


},{"../configuration/config":7,"../modules/guid":26,"../modules/logging/assert":27,"../modules/logging/log":28,"../template/directive_collection":55,"./snippet_container":49,"./snippet_directive_factory":50,"deep-equal":1}],52:[function(require,module,exports){
var SnippetModel, assert, config, deepEqual, guid, log, serialization;

deepEqual = require('deep-equal');

config = require('../configuration/config');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

SnippetModel = require('./snippet_model');

serialization = require('../modules/serialization');

module.exports = (function() {
  SnippetModel.prototype.toJson = function(snippet) {
    var json, name;
    if (snippet == null) {
      snippet = this;
    }
    json = {
      id: snippet.id,
      identifier: snippet.identifier
    };
    if (!serialization.isEmpty(snippet.content)) {
      json.content = serialization.flatCopy(snippet.content);
    }
    if (!serialization.isEmpty(snippet.styles)) {
      json.styles = serialization.flatCopy(snippet.styles);
    }
    if (!serialization.isEmpty(snippet.dataValues)) {
      json.data = $.extend(true, {}, snippet.dataValues);
    }
    for (name in snippet.containers) {
      json.containers || (json.containers = {});
      json.containers[name] = [];
    }
    return json;
  };
  return {
    fromJson: function(json, design) {
      var child, containerName, model, name, snippetArray, styleName, template, value, _i, _len, _ref, _ref1, _ref2;
      template = design.get(json.component || json.identifier);
      assert(template, "error while deserializing snippet: unknown template identifier '" + json.identifier + "'");
      model = new SnippetModel({
        template: template,
        id: json.id
      });
      _ref = json.content;
      for (name in _ref) {
        value = _ref[name];
        assert(model.content.hasOwnProperty(name), "error while deserializing snippet: unknown content '" + name + "'");
        if (model.directives.get(name).type === 'image' && typeof value === 'string') {
          model.content[name] = {
            url: value
          };
        } else {
          model.content[name] = value;
        }
      }
      _ref1 = json.styles;
      for (styleName in _ref1) {
        value = _ref1[styleName];
        model.setStyle(styleName, value);
      }
      if (json.data) {
        model.data(json.data);
      }
      _ref2 = json.containers;
      for (containerName in _ref2) {
        snippetArray = _ref2[containerName];
        assert(model.containers.hasOwnProperty(containerName), "error while deserializing snippet: unknown container " + containerName);
        if (snippetArray) {
          assert($.isArray(snippetArray), "error while deserializing snippet: container is not array " + containerName);
          for (_i = 0, _len = snippetArray.length; _i < _len; _i++) {
            child = snippetArray[_i];
            model.append(containerName, this.fromJson(child, design));
          }
        }
      }
      return model;
    }
  };
})();


},{"../configuration/config":7,"../modules/guid":26,"../modules/logging/assert":27,"../modules/logging/log":28,"../modules/serialization":35,"./snippet_model":51,"deep-equal":1}],53:[function(require,module,exports){
var SnippetArray, SnippetContainer, SnippetModel, SnippetTree, assert, snippetModelSerializer,
  __slice = [].slice;

assert = require('../modules/logging/assert');

SnippetContainer = require('./snippet_container');

SnippetArray = require('./snippet_array');

SnippetModel = require('./snippet_model');

snippetModelSerializer = require('./snippet_model_serializer');

module.exports = SnippetTree = (function() {
  function SnippetTree(_arg) {
    var content, _ref;
    _ref = _arg != null ? _arg : {}, content = _ref.content, this.design = _ref.design;
    assert(this.design != null, "Error instantiating SnippetTree: design param is misssing.");
    this.root = new SnippetContainer({
      isRoot: true
    });
    if (content != null) {
      this.fromJson(content, this.design);
    }
    this.root.snippetTree = this;
    this.initializeEvents();
  }

  SnippetTree.prototype.prepend = function(snippet) {
    snippet = this.getSnippet(snippet);
    if (snippet != null) {
      this.root.prepend(snippet);
    }
    return this;
  };

  SnippetTree.prototype.append = function(snippet) {
    snippet = this.getSnippet(snippet);
    if (snippet != null) {
      this.root.append(snippet);
    }
    return this;
  };

  SnippetTree.prototype.getSnippet = function(snippetName) {
    if (typeof snippetName === 'string') {
      return this.createModel(snippetName);
    } else {
      return snippetName;
    }
  };

  SnippetTree.prototype.createModel = function(identifier) {
    var template;
    template = this.getTemplate(identifier);
    if (template) {
      return template.createModel();
    }
  };

  SnippetTree.prototype.createSnippet = function() {
    return this.createModel.apply(this, arguments);
  };

  SnippetTree.prototype.getTemplate = function(identifier) {
    var template;
    template = this.design.get(identifier);
    assert(template, "Could not find template " + identifier);
    return template;
  };

  SnippetTree.prototype.initializeEvents = function() {
    this.snippetAdded = $.Callbacks();
    this.snippetRemoved = $.Callbacks();
    this.snippetMoved = $.Callbacks();
    this.snippetContentChanged = $.Callbacks();
    this.snippetHtmlChanged = $.Callbacks();
    this.snippetSettingsChanged = $.Callbacks();
    this.snippetDataChanged = $.Callbacks();
    return this.changed = $.Callbacks();
  };

  SnippetTree.prototype.each = function(callback) {
    return this.root.each(callback);
  };

  SnippetTree.prototype.eachContainer = function(callback) {
    return this.root.eachContainer(callback);
  };

  SnippetTree.prototype.first = function() {
    return this.root.first;
  };

  SnippetTree.prototype.all = function(callback) {
    return this.root.all(callback);
  };

  SnippetTree.prototype.find = function(search) {
    var res;
    if (typeof search === 'string') {
      res = [];
      this.each(function(snippet) {
        if (snippet.identifier === search || snippet.template.id === search) {
          return res.push(snippet);
        }
      });
      return new SnippetArray(res);
    } else {
      return new SnippetArray();
    }
  };

  SnippetTree.prototype.detach = function() {
    var oldRoot;
    this.root.snippetTree = void 0;
    this.each(function(snippet) {
      return snippet.snippetTree = void 0;
    });
    oldRoot = this.root;
    this.root = new SnippetContainer({
      isRoot: true
    });
    return oldRoot;
  };

  SnippetTree.prototype.print = function() {
    var addLine, output, walker;
    output = 'SnippetTree\n-----------\n';
    addLine = function(text, indentation) {
      if (indentation == null) {
        indentation = 0;
      }
      return output += "" + (Array(indentation + 1).join(" ")) + text + "\n";
    };
    walker = function(snippet, indentation) {
      var name, snippetContainer, template, _ref;
      if (indentation == null) {
        indentation = 0;
      }
      template = snippet.template;
      addLine("- " + template.title + " (" + template.identifier + ")", indentation);
      _ref = snippet.containers;
      for (name in _ref) {
        snippetContainer = _ref[name];
        addLine("" + name + ":", indentation + 2);
        if (snippetContainer.first) {
          walker(snippetContainer.first, indentation + 4);
        }
      }
      if (snippet.next) {
        return walker(snippet.next, indentation);
      }
    };
    if (this.root.first) {
      walker(this.root.first);
    }
    return output;
  };

  SnippetTree.prototype.attachingSnippet = function(snippet, attachSnippetFunc) {
    if (snippet.snippetTree === this) {
      attachSnippetFunc();
      return this.fireEvent('snippetMoved', snippet);
    } else {
      if (snippet.snippetTree != null) {
        snippet.snippetContainer.detachSnippet(snippet);
      }
      snippet.descendantsAndSelf((function(_this) {
        return function(descendant) {
          return descendant.snippetTree = _this;
        };
      })(this));
      attachSnippetFunc();
      return this.fireEvent('snippetAdded', snippet);
    }
  };

  SnippetTree.prototype.fireEvent = function() {
    var args, event;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this[event].fire.apply(event, args);
    return this.changed.fire();
  };

  SnippetTree.prototype.detachingSnippet = function(snippet, detachSnippetFunc) {
    assert(snippet.snippetTree === this, 'cannot remove snippet from another SnippetTree');
    snippet.descendantsAndSelf(function(descendants) {
      return descendants.snippetTree = void 0;
    });
    detachSnippetFunc();
    return this.fireEvent('snippetRemoved', snippet);
  };

  SnippetTree.prototype.contentChanging = function(snippet) {
    return this.fireEvent('snippetContentChanged', snippet);
  };

  SnippetTree.prototype.htmlChanging = function(snippet) {
    return this.fireEvent('snippetHtmlChanged', snippet);
  };

  SnippetTree.prototype.dataChanging = function(snippet, changedProperties) {
    return this.fireEvent('snippetDataChanged', snippet, changedProperties);
  };

  SnippetTree.prototype.printJson = function() {
    return words.readableJson(this.toJson());
  };

  SnippetTree.prototype.serialize = function() {
    var data, snippetToData, walker;
    data = {};
    data['content'] = [];
    data['design'] = {
      name: this.design.name
    };
    snippetToData = function(snippet, level, containerArray) {
      var snippetData;
      snippetData = snippet.toJson();
      containerArray.push(snippetData);
      return snippetData;
    };
    walker = function(snippet, level, dataObj) {
      var containerArray, name, snippetContainer, snippetData, _ref;
      snippetData = snippetToData(snippet, level, dataObj);
      _ref = snippet.containers;
      for (name in _ref) {
        snippetContainer = _ref[name];
        containerArray = snippetData.containers[snippetContainer.name] = [];
        if (snippetContainer.first) {
          walker(snippetContainer.first, level + 1, containerArray);
        }
      }
      if (snippet.next) {
        return walker(snippet.next, level, dataObj);
      }
    };
    if (this.root.first) {
      walker(this.root.first, 0, data['content']);
    }
    return data;
  };

  SnippetTree.prototype.fromData = function(data, design, silent) {
    var snippet, snippetData, _i, _len, _ref;
    if (silent == null) {
      silent = true;
    }
    if (design != null) {
      assert((this.design == null) || design.equals(this.design), 'Error loading data. Specified design is different from current snippetTree design');
    } else {
      design = this.design;
    }
    if (silent) {
      this.root.snippetTree = void 0;
    }
    if (data.content) {
      _ref = data.content;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        snippetData = _ref[_i];
        snippet = snippetModelSerializer.fromJson(snippetData, design);
        this.root.append(snippet);
      }
    }
    if (silent) {
      this.root.snippetTree = this;
      return this.root.each((function(_this) {
        return function(snippet) {
          return snippet.snippetTree = _this;
        };
      })(this));
    }
  };

  SnippetTree.prototype.addData = function(data, design) {
    return this.fromData(data, design, false);
  };

  SnippetTree.prototype.addDataWithAnimation = function(data, delay) {
    var snippetData, timeout, _fn, _i, _len, _ref, _results;
    if (delay == null) {
      delay = 200;
    }
    assert(this.design != null, 'Error adding data. SnippetTree has no design');
    timeout = Number(delay);
    _ref = data.content;
    _fn = (function(_this) {
      return function() {
        var content;
        content = snippetData;
        return setTimeout(function() {
          var snippet;
          snippet = snippetModelSerializer.fromJson(content, _this.design);
          return _this.root.append(snippet);
        }, timeout);
      };
    })(this);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      snippetData = _ref[_i];
      _fn();
      _results.push(timeout += Number(delay));
    }
    return _results;
  };

  SnippetTree.prototype.toData = function() {
    return this.serialize();
  };

  SnippetTree.prototype.fromJson = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.fromData.apply(this, args);
  };

  SnippetTree.prototype.toJson = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.toData.apply(this, args);
  };

  return SnippetTree;

})();


},{"../modules/logging/assert":27,"./snippet_array":48,"./snippet_container":49,"./snippet_model":51,"./snippet_model_serializer":52}],54:[function(require,module,exports){
var Directive, config, dom;

config = require('../configuration/config');

dom = require('../interaction/dom');

module.exports = Directive = (function() {
  function Directive(_arg) {
    var name;
    name = _arg.name, this.type = _arg.type, this.elem = _arg.elem;
    this.name = name || config.directives[this.type].defaultName;
    this.config = config.directives[this.type];
    this.optional = false;
  }

  Directive.prototype.renderedAttr = function() {
    return this.config.renderedAttr;
  };

  Directive.prototype.isElementDirective = function() {
    return this.config.elementDirective;
  };

  Directive.prototype.getTagName = function() {
    return this.elem.nodeName.toLowerCase();
  };

  Directive.prototype.clone = function() {
    var newDirective;
    newDirective = new Directive({
      name: this.name,
      type: this.type
    });
    newDirective.optional = this.optional;
    return newDirective;
  };

  Directive.prototype.getAbsoluteBoundingClientRect = function() {
    return dom.getAbsoluteBoundingClientRect(this.elem);
  };

  Directive.prototype.getBoundingClientRect = function() {
    return this.elem.getBoundingClientRect();
  };

  return Directive;

})();


},{"../configuration/config":7,"../interaction/dom":17}],55:[function(require,module,exports){
var Directive, DirectiveCollection, assert, config;

assert = require('../modules/logging/assert');

config = require('../configuration/config');

Directive = require('./directive');

module.exports = DirectiveCollection = (function() {
  function DirectiveCollection(all) {
    this.all = all != null ? all : {};
    this.length = 0;
  }

  DirectiveCollection.prototype.add = function(directive) {
    var _name;
    this.assertNameNotUsed(directive);
    this[this.length] = directive;
    directive.index = this.length;
    this.length += 1;
    this.all[directive.name] = directive;
    this[_name = directive.type] || (this[_name] = []);
    this[directive.type].push(directive);
    return directive;
  };

  DirectiveCollection.prototype.next = function(name) {
    var directive;
    if (name instanceof Directive) {
      directive = name;
    }
    if (directive == null) {
      directive = this.all[name];
    }
    return this[directive.index += 1];
  };

  DirectiveCollection.prototype.nextOfType = function(name) {
    var directive, requiredType;
    if (name instanceof Directive) {
      directive = name;
    }
    if (directive == null) {
      directive = this.all[name];
    }
    requiredType = directive.type;
    while (directive = this.next(directive)) {
      if (directive.type === requiredType) {
        return directive;
      }
    }
  };

  DirectiveCollection.prototype.get = function(name) {
    return this.all[name];
  };

  DirectiveCollection.prototype.count = function(type) {
    var _ref;
    if (type) {
      return (_ref = this[type]) != null ? _ref.length : void 0;
    } else {
      return this.length;
    }
  };

  DirectiveCollection.prototype.names = function(type) {
    var directive, _i, _len, _ref, _ref1, _results;
    if (!((_ref = this[type]) != null ? _ref.length : void 0)) {
      return [];
    }
    _ref1 = this[type];
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      directive = _ref1[_i];
      _results.push(directive.name);
    }
    return _results;
  };

  DirectiveCollection.prototype.each = function(callback) {
    var directive, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      directive = this[_i];
      _results.push(callback(directive));
    }
    return _results;
  };

  DirectiveCollection.prototype.eachOfType = function(type, callback) {
    var directive, _i, _len, _ref, _results;
    if (this[type]) {
      _ref = this[type];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        directive = _ref[_i];
        _results.push(callback(directive));
      }
      return _results;
    }
  };

  DirectiveCollection.prototype.eachEditable = function(callback) {
    return this.eachOfType('editable', callback);
  };

  DirectiveCollection.prototype.eachImage = function(callback) {
    return this.eachOfType('image', callback);
  };

  DirectiveCollection.prototype.eachContainer = function(callback) {
    return this.eachOfType('container', callback);
  };

  DirectiveCollection.prototype.eachHtml = function(callback) {
    return this.eachOfType('html', callback);
  };

  DirectiveCollection.prototype.clone = function() {
    var newCollection;
    newCollection = new DirectiveCollection();
    this.each(function(directive) {
      return newCollection.add(directive.clone());
    });
    return newCollection;
  };

  DirectiveCollection.prototype.$getElem = function(name) {
    return $(this.all[name].elem);
  };

  DirectiveCollection.prototype.assertAllLinked = function() {
    this.each(function(directive) {
      if (!directive.elem) {
        return false;
      }
    });
    return true;
  };

  DirectiveCollection.prototype.assertNameNotUsed = function(directive) {
    return assert(directive && !this.all[directive.name], "" + directive.type + " Template parsing error:\n" + config.directives[directive.type].renderedAttr + "=\"" + directive.name + "\".\n\"" + directive.name + "\" is a duplicate name.");
  };

  return DirectiveCollection;

})();


},{"../configuration/config":7,"../modules/logging/assert":27,"./directive":54}],56:[function(require,module,exports){
var Directive, config;

config = require('../configuration/config');

Directive = require('./directive');

module.exports = (function() {
  var attributePrefix;
  attributePrefix = /^(x-|data-)/;
  return {
    parse: function(elem) {
      var elemDirective, modifications;
      elemDirective = void 0;
      modifications = [];
      this.parseDirectives(elem, function(directive) {
        if (directive.isElementDirective()) {
          return elemDirective = directive;
        } else {
          return modifications.push(directive);
        }
      });
      if (elemDirective) {
        this.applyModifications(elemDirective, modifications);
      }
      return elemDirective;
    },
    parseDirectives: function(elem, func) {
      var attr, attributeName, data, directive, directiveData, normalizedName, type, _i, _j, _len, _len1, _ref, _results;
      directiveData = [];
      _ref = elem.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        attributeName = attr.name;
        normalizedName = attributeName.replace(attributePrefix, '');
        if (type = config.templateAttrLookup[normalizedName]) {
          directiveData.push({
            attributeName: attributeName,
            directive: new Directive({
              name: attr.value,
              type: type,
              elem: elem
            })
          });
        }
      }
      _results = [];
      for (_j = 0, _len1 = directiveData.length; _j < _len1; _j++) {
        data = directiveData[_j];
        directive = data.directive;
        this.rewriteAttribute(directive, data.attributeName);
        _results.push(func(directive));
      }
      return _results;
    },
    applyModifications: function(mainDirective, modifications) {
      var directive, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = modifications.length; _i < _len; _i++) {
        directive = modifications[_i];
        switch (directive.type) {
          case 'optional':
            _results.push(mainDirective.optional = true);
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    },
    rewriteAttribute: function(directive, attributeName) {
      if (directive.isElementDirective()) {
        if (attributeName !== directive.renderedAttr()) {
          return this.normalizeAttribute(directive, attributeName);
        } else if (!directive.name) {
          return this.normalizeAttribute(directive);
        }
      } else {
        return this.removeAttribute(directive, attributeName);
      }
    },
    normalizeAttribute: function(directive, attributeName) {
      var elem;
      elem = directive.elem;
      if (attributeName) {
        this.removeAttribute(directive, attributeName);
      }
      return elem.setAttribute(directive.renderedAttr(), directive.name);
    },
    removeAttribute: function(directive, attributeName) {
      return directive.elem.removeAttribute(attributeName);
    }
  };
})();


},{"../configuration/config":7,"./directive":54}],57:[function(require,module,exports){
var config, directiveFinder;

config = require('../configuration/config');

module.exports = directiveFinder = (function() {
  var attributePrefix;
  attributePrefix = /^(x-|data-)/;
  return {
    link: function(elem, directiveCollection) {
      var attr, directive, normalizedName, type, _i, _len, _ref;
      _ref = elem.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        normalizedName = attr.name.replace(attributePrefix, '');
        if (type = config.templateAttrLookup[normalizedName]) {
          directive = directiveCollection.get(attr.value);
          directive.elem = elem;
        }
      }
      return void 0;
    }
  };
})();


},{"../configuration/config":7}],58:[function(require,module,exports){
var DirectiveIterator, config;

config = require('../configuration/config');

module.exports = DirectiveIterator = (function() {
  function DirectiveIterator(root) {
    this.root = this._next = root;
    this.containerAttr = config.directives.container.renderedAttr;
  }

  DirectiveIterator.prototype.current = null;

  DirectiveIterator.prototype.hasNext = function() {
    return !!this._next;
  };

  DirectiveIterator.prototype.next = function() {
    var child, n, next;
    n = this.current = this._next;
    child = next = void 0;
    if (this.current) {
      child = n.firstChild;
      if (child && n.nodeType === 1 && !n.hasAttribute(this.containerAttr)) {
        this._next = child;
      } else {
        next = null;
        while ((n !== this.root) && !(next = n.nextSibling)) {
          n = n.parentNode;
        }
        this._next = next;
      }
    }
    return this.current;
  };

  DirectiveIterator.prototype.nextElement = function() {
    while (this.next()) {
      if (this.current.nodeType === 1) {
        break;
      }
    }
    return this.current;
  };

  DirectiveIterator.prototype.detach = function() {
    return this.current = this._next = this.root = null;
  };

  return DirectiveIterator;

})();


},{"../configuration/config":7}],59:[function(require,module,exports){
var DirectiveCollection, DirectiveIterator, SnippetModel, SnippetView, Template, assert, config, directiveCompiler, directiveFinder, log, sortByName, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

config = require('../configuration/config');

DirectiveIterator = require('./directive_iterator');

DirectiveCollection = require('./directive_collection');

directiveCompiler = require('./directive_compiler');

directiveFinder = require('./directive_finder');

SnippetModel = require('../snippet_tree/snippet_model');

SnippetView = require('../rendering/snippet_view');

sortByName = function(a, b) {
  if (a.name > b.name) {
    return 1;
  } else if (a.name < b.name) {
    return -1;
  } else {
    return 0;
  }
};

module.exports = Template = (function() {
  function Template(_arg) {
    var html, identifier, properties, title, _ref, _ref1;
    _ref = _arg != null ? _arg : {}, html = _ref.html, this.namespace = _ref.namespace, this.id = _ref.id, identifier = _ref.identifier, title = _ref.title, properties = _ref.properties;
    assert(html, 'Template: param html missing');
    if (identifier) {
      _ref1 = Template.parseIdentifier(identifier), this.namespace = _ref1.namespace, this.id = _ref1.id;
    }
    this.identifier = this.namespace && this.id ? "" + this.namespace + "." + this.id : void 0;
    this.$template = $(this.pruneHtml(html)).wrap('<div>');
    this.$wrap = this.$template.parent();
    this.title = title || words.humanize(this.id);
    this.styles = properties || {};
    this.defaults = {};
    this.parseTemplate();
  }

  Template.prototype.setDesign = function(design) {
    this.design = design;
    this.namespace = design.name;
    return this.identifier = "" + this.namespace + "." + this.id;
  };

  Template.prototype.createModel = function() {
    return new SnippetModel({
      template: this
    });
  };

  Template.prototype.createView = function(snippetModel, isReadOnly) {
    var $elem, directives, snippetView;
    snippetModel || (snippetModel = this.createModel());
    $elem = this.$template.clone();
    directives = this.linkDirectives($elem[0]);
    return snippetView = new SnippetView({
      model: snippetModel,
      $html: $elem,
      directives: directives,
      isReadOnly: isReadOnly
    });
  };

  Template.prototype.pruneHtml = function(html) {
    html = $(html).filter(function(index) {
      return this.nodeType !== 8;
    });
    assert(html.length === 1, "Templates must contain one root element. The Template \"" + this.identifier + "\" contains " + html.length);
    return html;
  };

  Template.prototype.parseTemplate = function() {
    var elem;
    elem = this.$template[0];
    this.directives = this.compileDirectives(elem);
    return this.directives.each((function(_this) {
      return function(directive) {
        switch (directive.type) {
          case 'editable':
            return _this.formatEditable(directive.name, directive.elem);
          case 'container':
            return _this.formatContainer(directive.name, directive.elem);
          case 'html':
            return _this.formatHtml(directive.name, directive.elem);
        }
      };
    })(this));
  };

  Template.prototype.compileDirectives = function(elem) {
    var directive, directives, iterator;
    iterator = new DirectiveIterator(elem);
    directives = new DirectiveCollection();
    while (elem = iterator.nextElement()) {
      directive = directiveCompiler.parse(elem);
      if (directive) {
        directives.add(directive);
      }
    }
    return directives;
  };

  Template.prototype.linkDirectives = function(elem) {
    var iterator, snippetDirectives;
    iterator = new DirectiveIterator(elem);
    snippetDirectives = this.directives.clone();
    while (elem = iterator.nextElement()) {
      directiveFinder.link(elem, snippetDirectives);
    }
    return snippetDirectives;
  };

  Template.prototype.formatEditable = function(name, elem) {
    var $elem, defaultValue;
    $elem = $(elem);
    $elem.addClass(config.css.editable);
    defaultValue = words.trim(elem.innerHTML);
    this.defaults[name] = defaultValue ? defaultValue : '';
    return elem.innerHTML = '';
  };

  Template.prototype.formatContainer = function(name, elem) {
    return elem.innerHTML = '';
  };

  Template.prototype.formatHtml = function(name, elem) {
    var defaultValue;
    defaultValue = words.trim(elem.innerHTML);
    if (defaultValue) {
      this.defaults[name] = defaultValue;
    }
    return elem.innerHTML = '';
  };

  Template.prototype.info = function() {
    var doc, name, style, _ref;
    doc = {
      name: this.id,
      design: this.namespace,
      directives: [],
      properties: []
    };
    this.directives.each((function(_this) {
      return function(directive) {
        var name, type;
        name = directive.name, type = directive.type;
        return doc.directives.push({
          name: name,
          type: type
        });
      };
    })(this));
    _ref = this.styles;
    for (name in _ref) {
      style = _ref[name];
      doc.properties.push({
        name: name,
        type: 'cssModificator'
      });
    }
    doc.directives.sort(sortByName);
    doc.properties.sort(sortByName);
    return doc;
  };

  return Template;

})();

Template.parseIdentifier = function(identifier) {
  var parts;
  if (!identifier) {
    return;
  }
  parts = identifier.split('.');
  if (parts.length === 1) {
    return {
      namespace: void 0,
      id: parts[0]
    };
  } else if (parts.length === 2) {
    return {
      namespace: parts[0],
      id: parts[1]
    };
  } else {
    return log.error("could not parse snippet template identifier: " + identifier);
  }
};


},{"../configuration/config":7,"../modules/logging/assert":27,"../modules/logging/log":28,"../modules/words":36,"../rendering/snippet_view":38,"../snippet_tree/snippet_model":51,"./directive_collection":55,"./directive_compiler":56,"./directive_finder":57,"./directive_iterator":58}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29uZmlndXJhdGlvbi9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Fzc2V0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vY3NzX21vZGlmaWNhdG9yX3Byb3BlcnR5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9jYWNoZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NvbmZpZ19zY2hlbWEuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9wYXJzZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvZGVmYXVsdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvcmVzcmNpdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbGl2aW5nZG9jLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZXZlbnRpbmcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9mZWF0dXJlX2RldGVjdHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ndWlkLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2xvZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL29iamVjdF9zY2hlbWEvcHJvcGVydHlfdmFsaWRhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb2JqZWN0X3NjaGVtYS9zY2hlbWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vYmplY3Rfc2NoZW1hL3ZhbGlkYXRpb25fZXJyb3JzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb2JqZWN0X3NjaGVtYS92YWxpZGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb3JkZXJlZF9oYXNoLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZW5kZXJlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvc25pcHBldF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvY3NzX2xvYWRlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9lZGl0YWJsZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9pbWFnZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2RpcmVjdGl2ZV9mYWN0b3J5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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d0IsRUFBQSxFQUFJLEtBQU0sQ0FBQSxDQUFBLENBQWxDO01BREY7R0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDSDtBQUFBLE1BQUUsU0FBQSxFQUFXLEtBQU0sQ0FBQSxDQUFBLENBQW5CO0FBQUEsTUFBdUIsRUFBQSxFQUFJLEtBQU0sQ0FBQSxDQUFBLENBQWpDO01BREc7R0FBQSxNQUFBO1dBR0gsR0FBRyxDQUFDLEtBQUosQ0FBVywrQ0FBQSxHQUFkLFVBQUcsRUFIRztHQU5vQjtBQUFBLENBdkszQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzLmpzJyk7XG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2xpYi9pc19hcmd1bWVudHMuanMnKTtcblxudmFyIGRlZXBFcXVhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRGF0ZSAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMy4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgYWN0dWFsICE9ICdvYmplY3QnICYmIHR5cGVvZiBleHBlY3RlZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcHRzLnN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy40LiBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID0gKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKVxufSkoKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA/IHN1cHBvcnRlZCA6IHVuc3VwcG9ydGVkO1xuXG5leHBvcnRzLnN1cHBvcnRlZCA9IHN1cHBvcnRlZDtcbmZ1bmN0aW9uIHN1cHBvcnRlZChvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuZnVuY3Rpb24gdW5zdXBwb3J0ZWQob2JqZWN0KXtcbiAgcmV0dXJuIG9iamVjdCAmJlxuICAgIHR5cGVvZiBvYmplY3QgPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdjYWxsZWUnKSAmJlxuICAgICFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCAnY2FsbGVlJykgfHxcbiAgICBmYWxzZTtcbn07XG4iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbidcbiAgPyBPYmplY3Qua2V5cyA6IHNoaW07XG5cbmV4cG9ydHMuc2hpbSA9IHNoaW07XG5mdW5jdGlvbiBzaGltIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gIHJldHVybiBrZXlzO1xufVxuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi42IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG5cdCAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cblx0ICpcblx0ICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cblx0ICovXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cblx0Ly8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblx0dmFyIGV4cG9ydHMgPSB0aGlzO1xuXHR2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXQncyBzdG9yYWdlIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cblx0ICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuXHRcdHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHQvKipcblx0ICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2Rcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcblx0XHRcdHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cblx0ICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuXHQgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG5cdFx0Ly8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fTtcblxuXHQvKipcblx0ICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcblx0XHR2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRyZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG5cdCAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuXHQgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcblx0XHRcdFx0bGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuXHRcdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdFx0XHRvbmNlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG5cdCAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGZpcnN0IGV4ZWN1dGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcblx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdG9uY2U6IHRydWVcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuXHQgKi9cblx0cHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cblx0ICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG5cdFx0dGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBpbmRleDtcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgdmFsdWU7XG5cdFx0dmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuXHRcdHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cblx0XHQvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0J3MgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcblx0XHRcdGZvciAoaSBpbiBldnQpIHtcblx0XHRcdFx0aWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG5cdFx0XHRcdFx0Ly8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuXHRcdFx0XHRcdFx0bXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcblx0XHRcdC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcblx0XHRcdC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG5cdFx0XHRpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cblx0ICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcblx0XHR2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuXHRcdGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcblx0XHRcdGRlbGV0ZSBldmVudHNbZXZ0XTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcblx0XHRcdGRlbGV0ZSB0aGlzLl9ldmVudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuXHQgKlxuXHQgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuXHQgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cblx0ICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuXHQgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG5cdCAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGtleTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuXHRcdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cblx0XHRcdFx0XHRpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgZW1pdEV2ZW50XG5cdCAqL1xuXHRwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG5cdCAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuXHQgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG5cdFx0dGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG5cdCAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuXHQgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuXHRcdGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcblx0fTtcblxuXHQvKipcblx0ICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuXHQgKi9cblx0RXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuXHRcdGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcblx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9O1xuXG5cdC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0XHR9KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhpcy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cdH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcnKVxuTGl2aW5nZG9jID0gcmVxdWlyZSgnLi9saXZpbmdkb2MnKVxuU25pcHBldFRyZWUgPSByZXF1aXJlKCcuL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUnKVxuZGVzaWduUGFyc2VyID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX3BhcnNlcicpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jID0gZG8gLT5cblxuICBlZGl0b3JQYWdlID0gbmV3IEVkaXRvclBhZ2UoKVxuXG5cbiAgIyBMb2FkIGFuZCBhY2Nlc3MgZGVzaWducy5cbiAgI1xuICAjIExvYWQgYSBkZXNpZ246XG4gICMgZGVzaWduLmxvYWQoeW91ckRlc2lnbkpzb24pXG4gICNcbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBhbHJlYWR5IGxvYWRlZDpcbiAgIyBkZXNpZ24uaGFzKG5hbWVPZllvdXJEZXNpZ24pXG4gICNcbiAgIyBHZXQgYW4gYWxyZWFkeSBsb2FkZWQgZGVzaWduOlxuICAjIGRlc2lnbi5nZXQobmFtZU9mWW91ckRlc2lnbilcbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG5cbiAgIyBMb2FkIGEgbGl2aW5nZG9jIGZyb20gc2VyaWFsaXplZCBkYXRhIGluIGEgc3luY2hyb25vdXMgd2F5LlxuICAjIFRoZSBkZXNpZ24gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gICNcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBuZXc6ICh7IGRhdGEsIGRlc2lnbiB9KSAtPlxuICAgIHNuaXBwZXRUcmVlID0gaWYgZGF0YT9cbiAgICAgIGRlc2lnbk5hbWUgPSBkYXRhLmRlc2lnbj8ubmFtZVxuICAgICAgYXNzZXJ0IGRlc2lnbk5hbWU/LCAnRXJyb3IgY3JlYXRpbmcgbGl2aW5nZG9jOiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgZGVzaWduTmFtZSA9IGRlc2lnblxuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShkZXNpZ246IGRlc2lnbilcblxuICAgIEBjcmVhdGUoc25pcHBldFRyZWUpXG5cblxuICAjIERpcmVjdCBjcmVhdGlvbiB3aXRoIGFuIGV4aXN0aW5nIFNuaXBwZXRUcmVlXG4gICMgQHJldHVybnMgeyBMaXZpbmdkb2Mgb2JqZWN0IH1cbiAgY3JlYXRlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgbmV3IExpdmluZ2RvYyh7IHNuaXBwZXRUcmVlIH0pXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgIyBNb3ZlIHRoZSBkZXNpZ24gbG9hZGluZyBjb2RlIGZyb20gdGhlIGVkaXRvciBpbnRvIHRoZSBlbmlnbmUuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAobGl2aW5nZG9jKSAtPlxuICAjICAgIGxpdmluZ2RvYy5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgU3RhcnQgZHJhZyAmIGRyb3BcbiAgc3RhcnREcmFnOiAkLnByb3h5KGVkaXRvclBhZ2UsICdzdGFydERyYWcnKVxuXG5cbiAgIyBDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb25cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG4gICAgYXVnbWVudENvbmZpZyhjb25maWcpXG5cblxuXG4jIEV4cG9ydCBnbG9iYWwgdmFyaWFibGVcbndpbmRvdy5kb2MgPSBkb2NcbiIsIiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuI1xuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb24gd2l0aCBzaG9ydGhhbmRzIGFuZCBjb21wdXRlZCB2YWx1ZXMuXG4jXG4jIGNvbmZpZy5kb2NEaXJlY3RpdmVcbiMgICBXaWxsIHByZWZpeCB0aGUgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCBjb25maWcuYXR0cmlidXRlUHJlZml4XG4jICAgZS5nLiBjb25maWcuZG9jRGlyZWN0aXZlLmVkaXRhYmxlID09ICdkYXRhLWRvYy1lZGl0YWJsZSdcbiNcbiMgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFxuIyAgIEEgbG9va3VwIG9iamVjdCBmb3IgZWFzaWVyIGxvb2t1cHMgb2YgdGhlIGRpcmVjdGl2ZSBuYW1lIGJ5IHRlbXBsYXRlIGF0dHJpYnV0ZS5cbiMgICBlLmcuIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbJ2RvYy1lZGl0YWJsZSddID09ICdlZGl0YWJsZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoY29uZmlnKSAtPlxuXG4gICMgU2hvcnRoYW5kcyBmb3Igc3R1ZmYgdGhhdCBpcyB1c2VkIGFsbCBvdmVyIHRoZSBwbGFjZSB0byBtYWtlXG4gICMgY29kZSBhbmQgc3BlY3MgbW9yZSByZWFkYWJsZS5cbiAgY29uZmlnLmRvY0RpcmVjdGl2ZSA9IHt9XG4gIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBjb25maWcuZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBpZiBjb25maWcuYXR0cmlidXRlUHJlZml4IHRoZW4gXCIjeyBjb25maWcuYXR0cmlidXRlUHJlZml4IH0tXCIgZWxzZSAnJ1xuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgY29uZmlnLmRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cbiIsImF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2F1Z21lbnRfY29uZmlnJylcblxuIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnID0gZG8gLT5cblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIENTUyBzZWxlY3RvciBmb3IgZWxlbWVudHMgKGFuZCB0aGVpciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxuICAjIHdoZW4gZm9jdXNzaW5nIG9yIGJsdXJyaW5nIGEgc25pcHBldFxuICBpZ25vcmVJbnRlcmFjdGlvbjogJy5sZC1jb250cm9sJ1xuXG4gICMgU2V0dXAgcGF0aHMgdG8gbG9hZCByZXNvdXJjZXMgZHluYW1pY2FsbHlcbiAgZGVzaWduUGF0aDogJy9kZXNpZ25zJ1xuICBsaXZpbmdkb2NzQ3NzRmlsZTogJy9hc3NldHMvY3NzL2xpdmluZ2RvY3MuY3NzJ1xuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgRWRpdGFibGUgY29uZmlndXJhdGlvblxuICBlZGl0YWJsZTpcbiAgICBhbGxvd05ld2xpbmU6IHRydWUgIyBBbGxvdyB0byBpbnNlcnQgbmV3bGluZXMgd2l0aCBTaGlmdCtFbnRlclxuICAgIGNoYW5nZURlbGF5OiAwICMgRGVsYXkgZm9yIHVwZGF0aW5nIHRoZSBzbmlwcGV0IG1vZGVscyBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgdXNlciBjaGFuZ2VzLiAwIEZvciBpbW1lZGlhdGUgdXBkYXRlcy4gZmFsc2UgdG8gZGlzYWJsZS5cbiAgICBicm93c2VyU3BlbGxjaGVjazogZmFsc2UgIyBTZXQgdGhlIHNwZWxsY2hlY2sgYXR0cmlidXRlIG9uIGNvbnRlbnRlZGl0YWJsZXMgdG8gJ3RydWUnIG9yICdmYWxzZSdcbiAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBmYWxzZSAjIFdoZXRoZXIgdG8gZmlyZSBjdXJzb3IgYW5kIHNlbGN0aW9uIGNoYW5nZXMgb24gbW91c2Vtb3ZlXG5cblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIHNuaXBwZXQgY2xhc3Nlc1xuICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyYWdCbG9ja2VyOiAnZG9jLWRyYWctYmxvY2tlcidcbiAgICBkcm9wTWFya2VyOiAnZG9jLWRyb3AtbWFya2VyJ1xuICAgIGJlZm9yZURyb3A6ICdkb2MtYmVmb3JlLWRyb3AnXG4gICAgbm9Ecm9wOiAnZG9jLWRyYWctbm8tZHJvcCdcbiAgICBhZnRlckRyb3A6ICdkb2MtYWZ0ZXItZHJvcCdcbiAgICBsb25ncHJlc3NJbmRpY2F0b3I6ICdkb2MtbG9uZ3ByZXNzLWluZGljYXRvcidcblxuICAgICMgdXRpbGl0eSBjbGFzc2VzXG4gICAgcHJldmVudFNlbGVjdGlvbjogJ2RvYy1uby1zZWxlY3Rpb24nXG4gICAgbWF4aW1pemVkQ29udGFpbmVyOiAnZG9jLWpzLW1heGltaXplZC1jb250YWluZXInXG4gICAgaW50ZXJhY3Rpb25CbG9ja2VyOiAnZG9jLWludGVyYWN0aW9uLWJsb2NrZXInXG5cbiAgIyBhdHRyaWJ1dGVzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgYXR0cjpcbiAgICB0ZW1wbGF0ZTogJ2RhdGEtZG9jLXRlbXBsYXRlJ1xuICAgIHBsYWNlaG9sZGVyOiAnZGF0YS1kb2MtcGxhY2Vob2xkZXInXG5cblxuICAjIERpcmVjdGl2ZSBkZWZpbml0aW9uc1xuICAjXG4gICMgYXR0cjogYXR0cmlidXRlIHVzZWQgaW4gdGVtcGxhdGVzIHRvIGRlZmluZSB0aGUgZGlyZWN0aXZlXG4gICMgcmVuZGVyZWRBdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiBvdXRwdXQgaHRtbFxuICAjIGVsZW1lbnREaXJlY3RpdmU6IGRpcmVjdGl2ZSB0aGF0IHRha2VzIGNvbnRyb2wgb3ZlciB0aGUgZWxlbWVudFxuICAjICAgKHRoZXJlIGNhbiBvbmx5IGJlIG9uZSBwZXIgZWxlbWVudClcbiAgIyBkZWZhdWx0TmFtZTogZGVmYXVsdCBuYW1lIGlmIG5vbmUgd2FzIHNwZWNpZmllZCBpbiB0aGUgdGVtcGxhdGVcbiAgZGlyZWN0aXZlczpcbiAgICBjb250YWluZXI6XG4gICAgICBhdHRyOiAnZG9jLWNvbnRhaW5lcidcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgZWRpdGFibGU6XG4gICAgICBhdHRyOiAnZG9jLWVkaXRhYmxlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBpbWFnZTpcbiAgICAgIGF0dHI6ICdkb2MtaW1hZ2UnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdpbWFnZSdcbiAgICBodG1sOlxuICAgICAgYXR0cjogJ2RvYy1odG1sJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBvcHRpb25hbDpcbiAgICAgIGF0dHI6ICdkb2Mtb3B0aW9uYWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogZmFsc2VcblxuXG4gIGFuaW1hdGlvbnM6XG4gICAgb3B0aW9uYWxzOlxuICAgICAgc2hvdzogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZURvd24oMjUwKVxuXG4gICAgICBoaWRlOiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlVXAoMjUwKVxuXG5cbmF1Z21lbnRDb25maWcoY29uZmlnKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBBc3NldHNcblxuXG4gIGhhc0NzczogLT5cbiAgICBAY3NzP1xuXG5cbiAgaGFzSnM6IC0+XG4gICAgQGpzP1xuXG5cbiAgIyBAcGFyYW0geyBTdHJpbmcgb3IgQXJyYXkgb2YgU3RyaW5ncyB9XG4gIGFkZENzczogKGNzc1VybHMpIC0+XG4gICAgQGFkZCgnY3NzJywgY3NzVXJscylcblxuXG4gICMgQHBhcmFtIHsgU3RyaW5nIG9yIEFycmF5IG9mIFN0cmluZ3MgfVxuICBhZGRKczogKGpzVXJscykgLT5cbiAgICBAYWRkKCdqcycsIGpzVXJscylcblxuXG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gYXNzZXQgdHlwZTogJ2pzJyBvciAnY3NzJ1xuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSBvZiBTdHJpbmdzIH1cbiAgYWRkOiAodHlwZSwgdXJscykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHVybHM/XG5cbiAgICB0aGlzW3R5cGVdID89IFtdXG4gICAgaWYgJC50eXBlKHVybHMpID09ICdzdHJpbmcnXG4gICAgICB0aGlzW3R5cGVdLnB1c2godXJscylcbiAgICBlbHNlXG4gICAgICBmb3IgdXJsIGluIHVybHNcbiAgICAgICAgdGhpc1t0eXBlXS5wdXNoKHVybClcbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgc3dpdGNoIEB0eXBlXG4gICAgICB3aGVuICdvcHRpb24nXG4gICAgICAgIGFzc2VydCB2YWx1ZSwgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAndmFsdWUnIHByb3ZpZGVkXCJcbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgIHdoZW4gJ3NlbGVjdCdcbiAgICAgICAgYXNzZXJ0IG9wdGlvbnMsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ29wdGlvbnMnIHByb3ZpZGVkXCJcbiAgICAgICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IHVua25vd24gdHlwZSAnI3sgQHR5cGUgfSdcIlxuXG5cbiAgIyBHZXQgaW5zdHJ1Y3Rpb25zIHdoaWNoIGNzcyBjbGFzc2VzIHRvIGFkZCBhbmQgcmVtb3ZlLlxuICAjIFdlIGRvIG5vdCBjb250cm9sIHRoZSBjbGFzcyBhdHRyaWJ1dGUgb2YgYSBzbmlwcGV0IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IENzc01vZGlmaWNhdG9yUHJvcGVydHkjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5PcmRlcmVkSGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvb3JkZXJlZF9oYXNoJylcbkFzc2V0cyA9IHJlcXVpcmUoJy4vYXNzZXRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB2ZXJzaW9uLCBAYXV0aG9yLCBAZGVzY3JpcHRpb24gfSkgLT5cbiAgICBhc3NlcnQgQG5hbWU/LCAnRGVzaWduIG5lZWRzIGEgbmFtZSdcbiAgICBAaWRlbnRpZmllciA9IERlc2lnbi5nZXRJZGVudGlmaWVyKEBuYW1lLCBAdmVyc2lvbilcblxuICAgICMgdGVtcGxhdGVzIGluIGEgc3RydWN0dXJlZCBmb3JtYXRcbiAgICBAZ3JvdXBzID0gW11cblxuICAgICMgdGVtcGxhdGVzIGJ5IGlkIGFuZCBzb3J0ZWRcbiAgICBAY29tcG9uZW50cyA9IG5ldyBPcmRlcmVkSGFzaCgpXG5cbiAgICAjIGFzc2V0cyByZXF1aXJlZCBieSB0aGUgZGVzaWduXG4gICAgQGFzc2V0cyA9IG5ldyBBc3NldHMoKVxuXG4gICAgIyBkZWZhdWx0IGNvbXBvbmVudHNcbiAgICBAZGVmYXVsdFBhcmFncmFwaCA9IHVuZGVmaW5lZFxuICAgIEBkZWZhdWx0SW1hZ2UgPSB1bmRlZmluZWRcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZSA9PSBAbmFtZSAmJiBkZXNpZ24udmVyc2lvbiA9PSBAdmVyc2lvblxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBjb21wb25lbnROYW1lID0gQGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcihpZGVudGlmaWVyKVxuICAgIEBjb21wb25lbnRzLmdldChjb21wb25lbnROYW1lKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEBjb21wb25lbnRzLmVhY2goY2FsbGJhY2spXG5cblxuICBhZGQ6ICh0ZW1wbGF0ZSkgLT5cbiAgICB0ZW1wbGF0ZS5zZXREZXNpZ24odGhpcylcbiAgICBAY29tcG9uZW50cy5wdXNoKHRlbXBsYXRlLmlkLCB0ZW1wbGF0ZSlcblxuXG4gIGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcjogKGlkZW50aWZpZXIpIC0+XG4gICAgeyBuYW1lc3BhY2UsIGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcbiAgICBpZFxuXG5cbiAgQGdldElkZW50aWZpZXI6IChuYW1lLCB2ZXJzaW9uKSAtPlxuICAgIGlmIHZlcnNpb24/XG4gICAgICBcIiN7IG5hbWUgfUAjeyB2ZXJzaW9uIH1cIlxuICAgIGVsc2VcbiAgICAgIFwiI3sgbmFtZSB9XCJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ25hbWVPZllvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFByb3Bvc2VkIGV4dGVuc2lvbnM6XG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gYSByZW1vdGUgc2VydmVyIGJ5IG5hbWUgKHNlcnZlciBoYXMgdG8gYmUgY29uZmlndXJlZCBhcyBkZWZhdWx0KVxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChkZXNpZ25TcGVjKSAtPlxuICAgIGlmIHR5cGVvZiBkZXNpZ25TcGVjID09ICdzdHJpbmcnXG4gICAgICBhc3NlcnQgZmFsc2UsICdMb2FkIGRlc2lnbiBieSBuYW1lIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuJ1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBpZiBAaGFzKGRlc2lnblNwZWMuZGVzaWduPy5uYW1lKVxuICAgICAgZGVzaWduID0gRGVzaWduLnBhcnNlci5wYXJzZShkZXNpZ25TcGVjKVxuICAgICAgaWYgZGVzaWduXG4gICAgICAgIEBhZGQoZGVzaWduKVxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoRGVzaWduLnBhcnNlci5lcnJvcnMpXG5cblxuICAjIEFkZCBhbiBhbHJlYWR5IHBhcnNlZCBkZXNpZ24uXG4gICMgQHBhcmFtIHsgRGVzaWduIG9iamVjdCB9XG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBAZGVzaWduc1tkZXNpZ24ubmFtZV0gPSBkZXNpZ25cblxuXG4gICMgQ2hlY2sgaWYgYSBkZXNpZ24gaXMgbG9hZGVkXG4gIGhhczogKG5hbWUpIC0+XG4gICAgQGRlc2lnbnNbbmFtZV0/XG5cblxuICAjIEdldCBhIGxvYWRlZCBkZXNpZ25cbiAgIyBAcmV0dXJuIHsgRGVzaWduIG9iamVjdCB9XG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBoYXMobmFtZSksIFwiRXJyb3I6IGRlc2lnbiAnI3sgbmFtZSB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbbmFtZV1cblxuXG4gICMgQ2xlYXIgdGhlIGNhY2hlIGlmIHlvdSB3YW50IHRvIHJlbG9hZCBkZXNpZ25zXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJTY2hlbWUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL29iamVjdF9zY2hlbWEvc2NoZW1lJylcbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yID0gbmV3IFNjaGVtZSgpXG5cbiMgQ3VzdG9tIFZhbGlkYXRvcnNcbiMgLS0tLS0tLS0tLS0tLS0tLS1cblxudmFsaWRhdG9yLmFkZCAnc3R5bGVUeXBlJywgKHZhbHVlKSAtPlxuICB2YWx1ZSA9PSAnb3B0aW9uJyBvciB2YWx1ZSA9PSAnc2VsZWN0J1xuXG5cbnZhbGlkYXRvci5hZGQgJ3NlbVZlcicsICh2YWx1ZSkgLT5cbiAgL1xcZFxcLlxcZFxcLlxcZC8udGVzdCh2YWx1ZSlcblxuXG4jIFNjaGVtYXNcbiMgLS0tLS0tLVxuXG52YWxpZGF0b3IuYWRkICdkZXNpZ24nLFxuICBkZXNpZ246XG4gICAgbmFtZTogJ3N0cmluZydcbiAgICB2ZXJzaW9uOiAnc3RyaW5nLCBzZW1WZXInXG4gICAgYXV0aG9yOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgICBkZXNjcmlwdGlvbjogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGFzc2V0czpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgY3NzOiAnYXJyYXkgb2Ygc3RyaW5nJ1xuICAgIGpzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgY29tcG9uZW50czogJ2FycmF5IG9mIGNvbXBvbmVudCdcbiAgY29tcG9uZW50UHJvcGVydGllczpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiB2YWxpZGF0b3IudmFsaWRhdGUoJ2NvbXBvbmVudFByb3BlcnR5JywgdmFsdWUpXG4gIGdyb3VwczogJ2FycmF5LCBvcHRpb25hbCdcbiAgZGVmYXVsdENvbXBvbmVudHM6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIHBhcmFncmFwaDogJ3N0cmluZywgb3B0aW9uYWwnXG4gICAgaW1hZ2U6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ2NvbXBvbmVudCcsXG4gIGlkOiAnc3RyaW5nJ1xuICB0aXRsZTogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGh0bWw6ICdzdHJpbmcnXG4gIHByb3BlcnRpZXM6ICdhcnJheSBvZiBzdHJpbmcsIG9wdGlvbmFsJ1xuXG5cbiMgdG9kbzogcmVuYW1lIHR5cGUgYW5kIHVzZSB0eXBlIHRvIGlkZW50aWZ5IHRoZSBjb21wb25lbnRQcm9wZXJ0eSB0eXBlIGxpa2UgY3NzQ2xhc3NcbnZhbGlkYXRvci5hZGQgJ2NvbXBvbmVudFByb3BlcnR5JyxcbiAgbmFtZTogJ3N0cmluZydcbiAgdHlwZTogJ3N0cmluZywgc3R5bGVUeXBlJ1xuICB2YWx1ZTogJ3N0cmluZywgb3B0aW9uYWwnXG4gIG9wdGlvbnM6ICdhcnJheSBvZiBzdHlsZU9wdGlvbiwgb3B0aW9uYWwnXG5cblxudmFsaWRhdG9yLmFkZCAnc3R5bGVPcHRpb24nLFxuICBjYXB0aW9uOiAnc3RyaW5nJ1xuICB2YWx1ZTogJ3N0cmluZydcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmRlc2lnbkNvbmZpZ1NjaGVtYSA9IHJlcXVpcmUoJy4vZGVzaWduX2NvbmZpZ19zY2hlbWEnKVxuQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vY3NzX21vZGlmaWNhdG9yX3Byb3BlcnR5JylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZGVzaWduUGFyc2VyID1cblxuICBwYXJzZTogKGRlc2lnbkNvbmZpZykgLT5cbiAgICBAZGVzaWduID0gdW5kZWZpbmVkXG4gICAgaWYgZGVzaWduQ29uZmlnU2NoZW1hLnZhbGlkYXRlKCdkZXNpZ24nLCBkZXNpZ25Db25maWcpXG4gICAgICBAY3JlYXRlRGVzaWduKGRlc2lnbkNvbmZpZylcbiAgICBlbHNlXG4gICAgICBlcnJvcnMgPSBkZXNpZ25Db25maWdTY2hlbWEuZ2V0RXJyb3JNZXNzYWdlcygpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JzKVxuXG5cbiAgY3JlYXRlRGVzaWduOiAoeyBkZXNpZ24sIGFzc2V0cywgY29tcG9uZW50cywgY29tcG9uZW50UHJvcGVydGllcywgZ3JvdXBzLCBkZWZhdWx0Q29tcG9uZW50cyB9KSAtPlxuICAgIHRyeVxuICAgICAgQGRlc2lnbiA9IEBwYXJzZURlc2lnbihkZXNpZ24pXG4gICAgICBAcGFyc2VBc3NldHMoYXNzZXRzKVxuICAgICAgQHBhcnNlQ29tcG9uZW50UHJvcGVydGllcyhjb21wb25lbnRQcm9wZXJ0aWVzKVxuICAgICAgQHBhcnNlQ29tcG9uZW50cyhjb21wb25lbnRzKVxuICAgICAgQHBhcnNlR3JvdXBzKGdyb3VwcylcbiAgICAgIEBwYXJzZURlZmF1bHRzKGRlZmF1bHRDb21wb25lbnRzKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciBjcmVhdGluZyB0aGUgZGVzaWduOiAjeyBlcnJvciB9XCIpXG5cbiAgICBAZGVzaWduXG5cblxuICBwYXJzZURlc2lnbjogKGRlc2lnbikgLT5cbiAgICBuZXcgRGVzaWduXG4gICAgICBuYW1lOiBkZXNpZ24ubmFtZVxuICAgICAgdmVyc2lvbjogZGVzaWduLnZlcnNpb25cblxuXG4gIHBhcnNlQXNzZXRzOiAoYXNzZXRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgYXNzZXRzP1xuICAgIEBkZXNpZ24uYXNzZXRzLmFkZENzcyhhc3NldHMuY3NzKVxuICAgIEBkZXNpZ24uYXNzZXRzLmFkZEpzKGFzc2V0cy5qcylcblxuXG4gICMgTm90ZTogQ3VycmVudGx5IGNvbXBvbmVudFByb3BlcnRpZXMgY29uc2lzdCBvbmx5IG9mIGRlc2lnbiBzdHlsZXNcbiAgcGFyc2VDb21wb25lbnRQcm9wZXJ0aWVzOiAoY29tcG9uZW50UHJvcGVydGllcykgLT5cbiAgICBAY29tcG9uZW50UHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUsIGNvbmZpZyBvZiBjb21wb25lbnRQcm9wZXJ0aWVzXG4gICAgICBAY29tcG9uZW50UHJvcGVydGllc1tuYW1lXSA9IEBjcmVhdGVDb21wb25lbnRQcm9wZXJ0eShjb25maWcpXG5cblxuICBwYXJzZUNvbXBvbmVudHM6IChjb21wb25lbnRzPVtdKSAtPlxuICAgIGZvciB7IGlkLCB0aXRsZSwgaHRtbCwgcHJvcGVydGllcyB9IGluIGNvbXBvbmVudHNcbiAgICAgIHByb3BlcnRpZXMgPSBAbG9va3VwQ29tcG9uZW50UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuXG4gICAgICBjb21wb25lbnQgPSBuZXcgVGVtcGxhdGVcbiAgICAgICAgaWQ6IGlkXG4gICAgICAgIHRpdGxlOiB0aXRsZVxuICAgICAgICBodG1sOiBodG1sXG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXNcblxuICAgICAgQGRlc2lnbi5hZGQoY29tcG9uZW50KVxuXG5cbiAgbG9va3VwQ29tcG9uZW50UHJvcGVydGllczogKHByb3BlcnR5TmFtZXMpIC0+XG4gICAgcHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUgaW4gcHJvcGVydHlOYW1lcyB8fCBbXVxuICAgICAgaWYgcHJvcGVydHkgPSBAY29tcG9uZW50UHJvcGVydGllc1tuYW1lXVxuICAgICAgICBwcm9wZXJ0aWVzW25hbWVdID0gcHJvcGVydHlcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLndhcm4oXCJUaGUgY29tcG9uZW50UHJvcGVydHkgJyN7IG5hbWUgfScgd2FzIG5vdCBmb3VuZC5cIilcblxuICAgIHByb3BlcnRpZXNcblxuXG4gIHBhcnNlR3JvdXBzOiAoZ3JvdXBzPVtdKSAtPlxuICAgIGZvciBncm91cCBpbiBncm91cHNcbiAgICAgIGNvbXBvbmVudHMgPSBmb3IgY29tcG9uZW50TmFtZSBpbiBncm91cC5jb21wb25lbnRzXG4gICAgICAgIEBkZXNpZ24uZ2V0KGNvbXBvbmVudE5hbWUpXG5cbiAgICAgIEBkZXNpZ24uZ3JvdXBzLnB1c2hcbiAgICAgICAgbmFtZTogZ3JvdXAubmFtZVxuICAgICAgICBjb21wb25lbnRzOiBjb21wb25lbnRzXG5cblxuICBwYXJzZURlZmF1bHRzOiAoZGVmYXVsdENvbXBvbmVudHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBkZWZhdWx0Q29tcG9uZW50cz9cbiAgICB7IHBhcmFncmFwaCwgaW1hZ2UgfSA9IGRlZmF1bHRDb21wb25lbnRzXG4gICAgQGRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoID0gQGdldENvbXBvbmVudChwYXJhZ3JhcGgpIGlmIHBhcmFncmFwaFxuICAgIEBkZXNpZ24uZGVmYXVsdEltYWdlID0gQGdldENvbXBvbmVudChpbWFnZSkgaWYgaW1hZ2VcblxuXG4gIGdldENvbXBvbmVudDogKG5hbWUpIC0+XG4gICAgY29tcG9uZW50ID0gQGRlc2lnbi5nZXQobmFtZSlcbiAgICBhc3NlcnQgY29tcG9uZW50LCBcIkNvdWxkIG5vdCBmaW5kIGNvbXBvbmVudCAjeyBuYW1lIH1cIlxuICAgIGNvbXBvbmVudFxuXG5cbiAgY3JlYXRlQ29tcG9uZW50UHJvcGVydHk6IChzdHlsZURlZmluaXRpb24pIC0+XG4gICAgbmV3IENzc01vZGlmaWNhdG9yUHJvcGVydHkoc3R5bGVEZWZpbml0aW9uKVxuXG5cbkRlc2lnbi5wYXJzZXIgPSBkZXNpZ25QYXJzZXJcbiIsIm1vZHVsZS5leHBvcnRzID1cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAnZGVmYXVsdCdcblxuICAjIFNldCB2YWx1ZSB0byBhbiBpbWFnZSBvciBiYWNrZ3JvdW5kIGltYWdlIGVsZW1lbnQuXG4gICNcbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH0gTm9kZSB0byBzZXQgdGhlIGltYWdlIHRvLlxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEltYWdlIHVybFxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBkaW0gPSBAZ2V0SW1hZ2VEaW1lbnNpb25zKCRlbGVtKVxuICAgIGltYWdlVXJsID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7IGRpbS53aWR0aCB9eCN7IGRpbS5oZWlnaHQgfS9CRUY1NkYvQjJFNjY4XCJcblxuXG4gICMgVGhlIGRlZmF1bHQgc2VydmljZSBkb2VzIG5vdCB0cmFuc2ZvciB0aGUgZ2l2ZW4gdXJsXG4gIGdldFVybDogKHZhbHVlKSAtPlxuICAgIHZhbHVlXG5cblxuICAjIERlZmF1bHQgSW1hZ2UgU2VydmljZSBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgZ2V0SW1hZ2VEaW1lbnNpb25zOiAoJGVsZW0pIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICB3aWR0aDogJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0OiAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoOiAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0ub3V0ZXJIZWlnaHQoKVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMCBpZiB2YWx1ZT9cblxuXG4gIGlzSW5saW5lSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG5cblxuICBpc0JhY2tncm91bmRJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT0gJ2ltZydcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kZWZhdWx0SW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxucmVzcmNpdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQXZhaWxhYmxlIEltYWdlIFNlcnZpY2VzXG4gIHNlcnZpY2VzID1cbiAgICAncmVzcmMuaXQnOiByZXNyY2l0SW1hZ2VTZXJ2aWNlXG4gICAgJ2RlZmF1bHQnOiBkZWZhdWx0SW1hZ2VTZXJ2aWNlXG5cblxuICAjIFNlcnZpY2VcbiAgIyAtLS0tLS0tXG5cbiAgaGFzOiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdP1xuXG5cbiAgZ2V0OiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgYXNzZXJ0IEBoYXMoc2VydmljZU5hbWUpLCBcIkNvdWxkIG5vdCBsb2FkIGltYWdlIHNlcnZpY2UgI3sgc2VydmljZU5hbWUgfVwiXG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdXG5cblxuICBlYWNoU2VydmljZTogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzZXJ2aWNlIG9mIHNlcnZpY2VzXG4gICAgICBjYWxsYmFjayhuYW1lLCBzZXJ2aWNlKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICByZXNyY2l0VXJsOiAnaHR0cDovL2FwcC5yZXNyYy5pdC8nXG5cbiAgIyBJbWFnZSBTZXJ2aWNlIEludGVyZmFjZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbmFtZTogJ3Jlc3JjLml0J1xuXG4gICMgQHBhcmFtIHsgalF1ZXJ5IG9iamVjdCB9XG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gQSByZXNyYy5pdCB1cmwuIEUuZy4gaHR0cDovL2FwcC5yZXNyYy5pdC9odHRwOi8vaW1hZ2VzLmNvbS8xLmpwZ1xuICBzZXQ6ICgkZWxlbSwgdXJsKSAtPlxuICAgIGFzc2VydCB1cmw/ICYmIHVybCAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICByZXR1cm4gQHNldEJhc2U2NCgkZWxlbSwgdXJsKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KHVybClcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgaW1nU2VydmljZS5pc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgQHNldElubGluZUltYWdlKCRlbGVtLCB1cmwpXG4gICAgZWxzZVxuICAgICAgQHNldEJhY2tncm91bmRJbWFnZSgkZWxlbSwgdXJsKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBpbWdTZXJ2aWNlLnNldFBsYWNlaG9sZGVyKCRlbGVtKVxuXG5cbiAgZ2V0VXJsOiAodmFsdWUsIHsgY3JvcCB9KSAtPlxuICAgIGNyb3BQYXJhbSA9IFwiQz1XI3sgY3JvcC53aWR0aCB9LEgjeyBjcm9wLmhlaWdodCB9LFgjeyBjcm9wLnggfSxZI3sgY3JvcC55IH0vXCIgaWYgY3JvcD9cbiAgICBcIiN7IEByZXNyY2l0VXJsIH0jeyBjcm9wUGFyYW0gfHwgJycgfSN7IHZhbHVlIH1cIlxuXG5cbiAgIyBJbWFnZSBzcGVjaWZpYyBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGZvcm1hdENzc1VybDogKHVybCkgLT5cbiAgICB1cmwgPSBpbWdTZXJ2aWNlLmVzY2FwZUNzc1VyaSh1cmwpXG4gICAgXCJ1cmwoI3sgdXJsIH0pXCJcblxuXG4gIHNldElubGluZUltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICRlbGVtLmF0dHIoJ2RhdGEtc3JjJywgdXJsKVxuXG5cbiAgc2V0QmFja2dyb3VuZEltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBAZm9ybWF0Q3NzVXJsKHVybCkpXG5cblxuICAjIFNldCBzcmMgZGlyZWN0bHksIGRvbid0IGFkZCByZXNyYyBjbGFzc1xuICBzZXRCYXNlNjQ6ICgkZWxlbSwgYmFzZTY0U3RyaW5nKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0KCRlbGVtLCBiYXNlNjRTdHJpbmcpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBET00gaGVscGVyIG1ldGhvZHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE1ldGhvZHMgdG8gcGFyc2UgYW5kIHVwZGF0ZSB0aGUgRG9tIHRyZWUgaW4gYWNjb3JkYW5jZSB0b1xuIyB0aGUgU25pcHBldFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBzbmlwcGV0UmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zbmlwcGV0IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNlY3Rpb24gfSg/OiB8JClcIilcblxuICAjIEZpbmQgdGhlIHNuaXBwZXQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgU25pcHBldHMgYXJlIG1hcmtlZCBieSBhIGNsYXNzIGF0IHRoZSBtb21lbnQuXG4gIGZpbmRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRTbmlwcGV0Vmlldyhub2RlKVxuICAgICAgICByZXR1cm4gdmlld1xuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBmaW5kTm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgbm9kZUNvbnRleHQgPSBAZ2V0Tm9kZUNvbnRleHQobm9kZSlcbiAgICAgIHJldHVybiBub2RlQ29udGV4dCBpZiBub2RlQ29udGV4dFxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBnZXROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZVR5cGUsIG9iaiBvZiBjb25maWcuZGlyZWN0aXZlc1xuICAgICAgY29udGludWUgaWYgbm90IG9iai5lbGVtZW50RGlyZWN0aXZlXG5cbiAgICAgIGRpcmVjdGl2ZUF0dHIgPSBvYmoucmVuZGVyZWRBdHRyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRleHRBdHRyOiBkaXJlY3RpdmVBdHRyXG4gICAgICAgICAgYXR0ck5hbWU6IG5vZGUuZ2V0QXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICMgRmluZCB0aGUgY29udGFpbmVyIHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICBmaW5kQ29udGFpbmVyOiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICB2aWV3ID0gQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcbiAgICAgICAgICBzbmlwcGV0Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Q29udGFpbmVyVGFyZ2V0KG5vZGUpXG5cbiAgICAgICMgYWJvdmUgc25pcHBldFxuICAgICAgZWxzZSBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcmV0dXJuIEBnZXRTbmlwcGV0VGFyZ2V0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG5cbiAgICAgICMgYWJvdmUgcm9vdCBjb250YWluZXJcbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldFJvb3RUYXJnZXQobm9kZSlcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG5cbiAgZ2V0U25pcHBldFRhcmdldDogKGVsZW0sIHsgdG9wLCBsZWZ0LCBwb3NpdGlvbiB9KSAtPlxuICAgIHRhcmdldDogJ3NuaXBwZXQnXG4gICAgc25pcHBldFZpZXc6IEBnZXRTbmlwcGV0VmlldyhlbGVtKVxuICAgIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBAZ2V0UG9zaXRpb25PblNuaXBwZXQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0OiAoY2xvc2VzdFNuaXBwZXREYXRhKSAtPlxuICAgIGVsZW0gPSBjbG9zZXN0U25pcHBldERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RTbmlwcGV0RGF0YS5wb3NpdGlvblxuICAgIEBnZXRTbmlwcGV0VGFyZ2V0KGVsZW0sIHsgcG9zaXRpb24gfSlcblxuXG4gIGdldENvbnRhaW5lclRhcmdldDogKG5vZGUpIC0+XG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcbiAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcblxuICAgIHRhcmdldDogJ2NvbnRhaW5lcidcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFZpZXc6IEBmaW5kU25pcHBldFZpZXcobm9kZSlcbiAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG5cblxuICBnZXRSb290VGFyZ2V0OiAobm9kZSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9ICQobm9kZSkuZGF0YSgnc25pcHBldFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFRyZWU6IHNuaXBwZXRUcmVlXG5cblxuICAjIEZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgYSBzbmlwcGV0XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PblNuaXBwZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgaWYgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgJ2JlZm9yZSdcbiAgICBlbHNlXG4gICAgICAnYWZ0ZXInXG5cblxuICAjIEdldCB0aGUgY2xvc2VzdCBzbmlwcGV0IGluIGEgY29udGFpbmVyIGZvciBhIHRvcCBsZWZ0IHBvc2l0aW9uXG4gIGdldENsb3Nlc3RTbmlwcGV0OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRzbmlwcGV0cyA9ICQoY29udGFpbmVyKS5maW5kKFwiLiN7IGNzcy5zbmlwcGV0IH1cIilcbiAgICBjbG9zZXN0ID0gdW5kZWZpbmVkXG4gICAgY2xvc2VzdFNuaXBwZXQgPSB1bmRlZmluZWRcblxuICAgICRzbmlwcGV0cy5lYWNoIChpbmRleCwgZWxlbSkgPT5cbiAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYmVmb3JlJ31cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0U25pcHBldFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYSAtIGIgZWxzZSBiIC0gYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIHNuaXBwZXQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIFNuaXBwZXRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgIyBHZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCB3aXRoIHRvcCBhbmQgbGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnRcbiAgIyAoaWRlYWwgZm9yIGFic29sdXRlIHBvc2l0aW9uZWQgZWxlbWVudHMpXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAobm9kZSkgLT5cbiAgICB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICB7IHNjcm9sbFgsIHNjcm9sbFkgfSA9IEBnZXRTY3JvbGxQb3NpdGlvbih3aW4pXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiAgZ2V0U2Nyb2xsUG9zaXRpb246ICh3aW4pIC0+XG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYOiBpZiAod2luLnBhZ2VYT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVhPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWTogaWYgKHdpbi5wYWdlWU9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VZT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBEcmFnQmFzZVxuI1xuIyBTdXBwb3J0ZWQgZHJhZyBtb2RlczpcbiMgLSBEaXJlY3QgKHN0YXJ0IGltbWVkaWF0ZWx5KVxuIyAtIExvbmdwcmVzcyAoc3RhcnQgYWZ0ZXIgYSBkZWxheSBpZiB0aGUgY3Vyc29yIGRvZXMgbm90IG1vdmUgdG9vIG11Y2gpXG4jIC0gTW92ZSAoc3RhcnQgYWZ0ZXIgdGhlIGN1cnNvciBtb3ZlZCBhIG1pbnVtdW0gZGlzdGFuY2UpXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERyYWdCYXNlXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSwgb3B0aW9ucykgLT5cbiAgICBAbW9kZXMgPSBbJ2RpcmVjdCcsICdsb25ncHJlc3MnLCAnbW92ZSddXG5cbiAgICBkZWZhdWx0Q29uZmlnID1cbiAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuICAgICAgb25EcmFnU3RhcnQ6IHVuZGVmaW5lZFxuICAgICAgc2Nyb2xsQXJlYTogNTBcbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuICAgICAgbW92ZTpcbiAgICAgICAgZGlzdGFuY2U6IDBcblxuICAgIEBkZWZhdWx0Q29uZmlnID0gJC5leHRlbmQodHJ1ZSwgZGVmYXVsdENvbmZpZywgb3B0aW9ucylcblxuICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG5cblxuICBzZXRPcHRpb25zOiAob3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGVmYXVsdENvbmZpZywgb3B0aW9ucylcbiAgICBAbW9kZSA9IGlmIG9wdGlvbnMuZGlyZWN0P1xuICAgICAgJ2RpcmVjdCdcbiAgICBlbHNlIGlmIG9wdGlvbnMubG9uZ3ByZXNzP1xuICAgICAgJ2xvbmdwcmVzcydcbiAgICBlbHNlIGlmIG9wdGlvbnMubW92ZT9cbiAgICAgICdtb3ZlJ1xuICAgIGVsc2VcbiAgICAgICdsb25ncHJlc3MnXG5cblxuICBzZXREcmFnSGFuZGxlcjogKGRyYWdIYW5kbGVyKSAtPlxuICAgIEBkcmFnSGFuZGxlciA9IGRyYWdIYW5kbGVyXG4gICAgQGRyYWdIYW5kbGVyLnBhZ2UgPSBAcGFnZVxuXG5cbiAgIyBTdGFydCBhIHBvc3NpYmxlIGRyYWdcbiAgIyBUaGUgZHJhZyBpcyBvbmx5IHJlYWxseSBzdGFydGVkIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgdmlvbGF0ZWRcbiAgIyAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpLlxuICBpbml0OiAoZHJhZ0hhbmRsZXIsIGV2ZW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBzZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgQHNldERyYWdIYW5kbGVyKGRyYWdIYW5kbGVyKVxuICAgIEBzdGFydFBvaW50ID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG5cbiAgICBAYWRkU3RvcExpc3RlbmVycyhldmVudClcbiAgICBAYWRkTW92ZUxpc3RlbmVycyhldmVudClcblxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBAYWRkTG9uZ3ByZXNzSW5kaWNhdG9yKEBzdGFydFBvaW50KVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICAgICAgQHN0YXJ0KGV2ZW50KVxuICAgICAgICAsIEBvcHRpb25zLmxvbmdwcmVzcy5kZWxheVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ2RpcmVjdCdcbiAgICAgIEBzdGFydChldmVudClcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgbW92ZTogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KGV2ZW50KVxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBhZGRCbG9ja2VyKClcbiAgICBAcGFnZS4kYm9keS5hZGRDbGFzcyhjc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IChldmVudCkgLT5cbiAgICBAZHJhZ0hhbmRsZXIuZHJvcChldmVudCkgaWYgQHN0YXJ0ZWRcbiAgICBpZiAkLmlzRnVuY3Rpb24oQG9wdGlvbnMub25Ecm9wKVxuICAgICAgQG9wdGlvbnMub25Ecm9wKGV2ZW50LCBAZHJhZ0hhbmRsZXIpXG4gICAgQHJlc2V0KClcblxuXG4gIGNhbmNlbDogLT5cbiAgICBAcmVzZXQoKVxuXG5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcbiAgICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICAgIEBwYWdlLiRib2R5LnJlbW92ZUNsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG4gICAgaWYgQGluaXRpYWxpemVkXG4gICAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICAgIEBkcmFnSGFuZGxlci5yZXNldCgpXG4gICAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICAgIGlmIEB0aW1lb3V0P1xuICAgICAgICBjbGVhclRpbWVvdXQoQHRpbWVvdXQpXG4gICAgICAgIEB0aW1lb3V0ID0gdW5kZWZpbmVkXG5cbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICBAcmVtb3ZlQmxvY2tlcigpXG5cblxuICBhZGRCbG9ja2VyOiAtPlxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcmFnQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkYmxvY2tlcilcblxuXG4gIHJlbW92ZUJsb2NrZXI6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKS5yZW1vdmUoKVxuXG5cbiAgYWRkTG9uZ3ByZXNzSW5kaWNhdG9yOiAoeyBwYWdlWCwgcGFnZVkgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvcHRpb25zLmxvbmdwcmVzcy5zaG93SW5kaWNhdG9yXG4gICAgJGluZGljYXRvciA9ICQoXCI8ZGl2IGNsYXNzPVxcXCIjeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cXFwiPjxkaXY+PC9kaXY+PC9kaXY+XCIpXG4gICAgJGluZGljYXRvci5jc3MobGVmdDogcGFnZVgsIHRvcDogcGFnZVkpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRpbmRpY2F0b3IpXG5cblxuICByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3I6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgICAgJ2Ryb3AubGl2aW5nZG9jcy1kcmFnIGRyYWdlbmQubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgKGV2ZW50KSA9PlxuICAgICAgQGRyb3AoZXZlbnQpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIHNuaXBwZXREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ2VudGVyJyB8fCBldmVudC50eXBlID09ICdkcmFnYmV0dGVyZW50ZXInXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ2RyYWdvdmVyLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICAjIFNvIGZhciBJIGRvIG5vdCB1bmRlcnN0YW5kIHdoeSB0aGUgalF1ZXJ5IGV2ZW50IGRvZXMgbm90IGNvbnRhaW4gY2xpZW50WCBldGMuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnb3ZlcidcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuXG4gICAgY2xpZW50WDogZXZlbnQuY2xpZW50WFxuICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFlcbiAgICBwYWdlWDogZXZlbnQucGFnZVhcbiAgICBwYWdlWTogZXZlbnQucGFnZVlcblxuXG4gIGRpc3RhbmNlOiAocG9pbnRBLCBwb2ludEIpIC0+XG4gICAgcmV0dXJuIHVuZGVmaW5lZCBpZiAhcG9pbnRBIHx8ICFwb2ludEJcblxuICAgIGRpc3RYID0gcG9pbnRBLnBhZ2VYIC0gcG9pbnRCLnBhZ2VYXG4gICAgZGlzdFkgPSBwb2ludEEucGFnZVkgLSBwb2ludEIucGFnZVlcbiAgICBNYXRoLnNxcnQoIChkaXN0WCAqIGRpc3RYKSArIChkaXN0WSAqIGRpc3RZKSApXG5cblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgZWRpdGFibGUuanMgQ29udHJvbGxlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW50ZWdyYXRlIGVkaXRhYmxlLmpzIGludG8gTGl2aW5nZG9jc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZUNvbnRyb2xsZXJcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlKSAtPlxuXG4gICAgIyBJbml0aWFsaXplIGVkaXRhYmxlLmpzXG4gICAgQGVkaXRhYmxlID0gbmV3IEVkaXRhYmxlXG4gICAgICB3aW5kb3c6IEBwYWdlLndpbmRvd1xuICAgICAgYnJvd3NlclNwZWxsY2hlY2s6IGNvbmZpZy5lZGl0YWJsZS5icm93c2VyU3BlbGxjaGVja1xuICAgICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogY29uZmlnLmVkaXRhYmxlLm1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXNcblxuICAgIEBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBAc2VsZWN0aW9uID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGVkaXRhYmxlXG4gICAgICAuZm9jdXMoQHdpdGhDb250ZXh0KEBmb2N1cykpXG4gICAgICAuYmx1cihAd2l0aENvbnRleHQoQGJsdXIpKVxuICAgICAgLmluc2VydChAd2l0aENvbnRleHQoQGluc2VydCkpXG4gICAgICAubWVyZ2UoQHdpdGhDb250ZXh0KEBtZXJnZSkpXG4gICAgICAuc3BsaXQoQHdpdGhDb250ZXh0KEBzcGxpdCkpXG4gICAgICAuc2VsZWN0aW9uKEB3aXRoQ29udGV4dChAc2VsZWN0aW9uQ2hhbmdlZCkpXG4gICAgICAubmV3bGluZShAd2l0aENvbnRleHQoQG5ld2xpbmUpKVxuICAgICAgLmNoYW5nZShAd2l0aENvbnRleHQoQGNoYW5nZSkpXG5cblxuICAjIFJlZ2lzdGVyIERPTSBub2RlcyB3aXRoIGVkaXRhYmxlLmpzLlxuICAjIEFmdGVyIHRoYXQgRWRpdGFibGUgd2lsbCBmaXJlIGV2ZW50cyBmb3IgdGhhdCBub2RlLlxuICBhZGQ6IChub2RlcykgLT5cbiAgICBAZWRpdGFibGUuYWRkKG5vZGVzKVxuXG5cbiAgZGlzYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuc3VzcGVuZCgpXG5cblxuICByZWVuYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuY29udGludWUoKVxuXG5cbiAgIyBHZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lIGZyb20gdGhlIERPTSBlbGVtZW50IHBhc3NlZCBieSBlZGl0YWJsZS5qc1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIGV4dHJhY3RDb250ZW50OiAoZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KGVsZW1lbnQpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdW5kZWZpbmVkXG4gICAgZWxzZVxuICAgICAgdmFsdWVcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGV4dHJhY3RDb250ZW50KGVsZW1lbnQpXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudClcblxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcblxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgSW5zZXJ0IGEgbmV3IGJsb2NrLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGF0IHRoZSBlbmQgb2YgYSBibG9ja1xuICAjIG9yIGJ5IHByZXNzaW5nIGRlbGV0ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgYmxvY2suXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgZGVmYXVsdFBhcmFncmFwaCA9IEBwYWdlLmRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoXG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpICYmIGRlZmF1bHRQYXJhZ3JhcGg/XG4gICAgICBjb3B5ID0gZGVmYXVsdFBhcmFncmFwaC5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3VmlldyAmJiBkaXJlY3Rpb24gPT0gJ2FmdGVyJ1xuXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgTWVyZ2UgdHdvIGJsb2Nrcy4gV29ya3MgaW4gdHdvIGRpcmVjdGlvbnMuXG4gICMgRWl0aGVyIHRoZSBjdXJyZW50IGJsb2NrIGlzIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBwcmVjZWVkaW5nICgnYmVmb3JlJylcbiAgIyBvciB0aGUgZm9sbG93aW5nICgnYWZ0ZXInKSBibG9jay5cbiAgIyBBZnRlciB0aGUgbWVyZ2UgdGhlIGN1cnJlbnQgYmxvY2sgaXMgcmVtb3ZlZCBhbmQgdGhlIGZvY3VzIHNldCB0byB0aGVcbiAgIyBvdGhlciBibG9jayB0aGF0IHdhcyBtZXJnZWQgaW50by5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcbiAgICAgICAgdmlld0VsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBtZXJnZWRWaWV3RWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG5cbiAgICAgICAgIyBHYXRoZXIgdGhlIGNvbnRlbnQgdGhhdCBpcyBnb2luZyB0byBiZSBtZXJnZWRcbiAgICAgICAgY29udGVudFRvTWVyZ2UgPSBAZWRpdGFibGUuZ2V0Q29udGVudCh2aWV3RWxlbSlcblxuICAgICAgICBjdXJzb3IgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBAZWRpdGFibGUuYXBwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRhYmxlLnByZXBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZVNlbGVjdGlvbigpXG5cbiAgICAgICAgIyBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgYW5kIHRoZSBmb2N1cyBpcyBzZXQgdXBkYXRlIHRoZSBtb2RlbCB0b1xuICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgbW9kZWwgaXMgdXAgdG8gZGF0ZSBhbmQgY2hhbmdlcyBhcmUgbm90aWZpZWQuXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUsIG1lcmdlZFZpZXdFbGVtKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFNwbGl0IGEgYmxvY2sgaW4gdHdvLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGluIHRoZSBtaWRkbGUgb2YgYSBibG9jay5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2Ygc25pcHBldFxuICAgICAgY29weSA9IHZpZXcudGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYWZ0ZXIpKVxuICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgdmlldy5uZXh0KCk/LmZvY3VzKClcblxuICAgICAgIyBzZXQgY29udGVudCBvZiB0aGUgYmVmb3JlIGVsZW1lbnQgKGFmdGVyIGZvY3VzIGlzIHNldCB0byB0aGUgYWZ0ZXIgZWxlbWVudClcbiAgICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgQGV4dHJhY3RDb250ZW50KGJlZm9yZSkpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgT2NjdXJzIHdoZW5ldmVyIHRoZSB1c2VyIHNlbGVjdHMgb25lIG9yIG1vcmUgY2hhcmFjdGVycyBvciB3aGVuZXZlciB0aGVcbiAgIyBzZWxlY3Rpb24gaXMgY2hhbmdlZC5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICAjIEluc2VydCBhIG5ld2xpbmUgKFNoaWZ0ICsgRW50ZXIpXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGlmIGNvbmZpZy5lZGl0YWJsZS5hbGxvd05ld2xpbmVcbiAgICAgIHJldHVybiB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgZWxzZVxuICAgICByZXR1cm4gZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFRyaWdnZXJlZCB3aGVuZXZlciB0aGUgdXNlciBjaGFuZ2VzIHRoZSBjb250ZW50IG9mIGEgYmxvY2suXG4gICMgVGhlIGNoYW5nZSBldmVudCBkb2VzIG5vdCBhdXRvbWF0aWNhbGx5IGZpcmUgaWYgdGhlIGNvbnRlbnQgaGFzXG4gICMgYmVlbiBjaGFuZ2VkIHZpYSBqYXZhc2NyaXB0LlxuICBjaGFuZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG4gICAgcmV0dXJuIGlmIGNvbmZpZy5lZGl0YWJsZS5jaGFuZ2VEZWxheSA9PSBmYWxzZVxuXG4gICAgQGNoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICBlbGVtID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW0pXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuICAgICwgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5XG5cblxuICBjbGVhckNoYW5nZVRpbWVvdXQ6IC0+XG4gICAgaWYgQGNoYW5nZVRpbWVvdXQ/XG4gICAgICBjbGVhclRpbWVvdXQoQGNoYW5nZVRpbWVvdXQpXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuXG5cbiAgaGFzU2luZ2xlRWRpdGFibGU6ICh2aWV3KSAtPlxuICAgIHZpZXcuZGlyZWN0aXZlcy5sZW5ndGggPT0gMSAmJiB2aWV3LmRpcmVjdGl2ZXNbMF0udHlwZSA9PSAnZWRpdGFibGUnXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBDb21wb25lbnQgRm9jdXNcbiMgLS0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgc25pcHBldCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQHNuaXBwZXRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIHNuaXBwZXRWaWV3ICE9IEBzbmlwcGV0Vmlld1xuICAgICAgQHJlc2V0U25pcHBldFZpZXcoKVxuICAgICAgaWYgc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRWaWV3ID0gc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRGb2N1cy5maXJlKEBzbmlwcGV0VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBzbmlwcGV0VmlldyB8fD0gZG9tLmZpbmRTbmlwcGV0VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBzbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBzbmlwcGV0VmlldyAhPSBzbmlwcGV0Vmlld1xuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0U25pcHBldFZpZXc6IC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBzbmlwcGV0Vmlld1xuICAgICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAc25pcHBldEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Py5tb2RlbCAhPSBAc25pcHBldE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuc25pcHBldFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIHNuaXBwZXRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5zbmlwcGV0Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHMoYmVmb3JlLCB0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHModGFyZ2V0LnNuaXBwZXRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdUb3AgPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy10b3AnKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXQgKyBwYWRkaW5nVG9wXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLWJvdHRvbScpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldCAtIHBhZGRpbmdCb3R0b21cbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cblxuICAgICAgaWYgY2xpZW50WD8gJiYgY2xpZW50WT9cbiAgICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcblxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuVmlldyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3ZpZXcnKVxuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5kb20gPSByZXF1aXJlKCcuL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGl2aW5nZG9jIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgc25pcHBldFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gc25pcHBldFRyZWUuZGVzaWduXG4gICAgQHNldFNuaXBwZXRUcmVlKHNuaXBwZXRUcmVlKVxuICAgIEB2aWV3cyA9IHt9XG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuXG5cbiAgIyBHZXQgYSBkcm9wIHRhcmdldCBmb3IgYW4gZXZlbnRcbiAgZ2V0RHJvcFRhcmdldDogKHsgZXZlbnQgfSkgLT5cbiAgICBkb2N1bWVudCA9IGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50XG4gICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG4gICAgaWYgZWxlbT9cbiAgICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnQucGFnZVgsIHRvcDogZXZlbnQucGFnZVkgfVxuICAgICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKVxuXG5cbiAgc2V0U25pcHBldFRyZWU6IChzbmlwcGV0VHJlZSkgLT5cbiAgICBhc3NlcnQgc25pcHBldFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnU25pcHBldFRyZWUgbXVzdCBoYXZlIHRoZSBzYW1lIGRlc2lnbiBhcyB0aGUgZG9jdW1lbnQnXG5cbiAgICBAbW9kZWwgPSBAc25pcHBldFRyZWUgPSBzbmlwcGV0VHJlZVxuICAgIEBmb3J3YXJkU25pcHBldFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zLnJlYWRPbmx5ID89IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQHNuaXBwZXRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHByb21pc2UgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG5cbiAgICBwcm9taXNlXG5cblxuICAjIEFwcGVuZCB0aGUgYXJ0aWNsZSB0byB0aGUgRE9NLlxuICAjXG4gICMgQHBhcmFtIHsgRE9NIE5vZGUsIGpRdWVyeSBvYmplY3Qgb3IgQ1NTIHNlbGVjdG9yIHN0cmluZyB9IFdoZXJlIHRvIGFwcGVuZCB0aGUgYXJ0aWNsZSBpbiB0aGUgZG9jdW1lbnQuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH0gb3B0aW9uczpcbiAgIyAgIGludGVyYWN0aXZlOiB7IEJvb2xlYW4gfSBXaGV0aGVyIHRoZSBkb2N1bWVudCBpcyBlZHRpYWJsZS5cbiAgIyAgIGxvYWRBc3NldHM6IHsgQm9vbGVhbiB9IExvYWQgQ1NTIGZpbGVzLiBPbmx5IGRpc2FibGUgdGhpcyBpZiB5b3UgYXJlIHN1cmUgeW91IGhhdmUgbG9hZGVkIGV2ZXJ5dGhpbmcgbWFudWFsbHkuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGFydGljbGUuYXBwZW5kVG8oJy5hcnRpY2xlJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSwgbG9hZEFzc2V0czogZmFsc2UgfSk7XG4gIGFwcGVuZFRvOiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KEBzbmlwcGV0VHJlZSwgJHBhcmVudFswXSlcbiAgICB2aWV3LmNyZWF0ZVJlbmRlcmVyKHsgb3B0aW9ucyB9KVxuXG5cblxuICAjIEEgdmlldyBzb21ldGltZXMgaGFzIHRvIGJlIHdyYXBwZWQgaW4gYSBjb250YWluZXIuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIEhlcmUgdGhlIGRvY3VtZW50IGlzIHJlbmRlcmVkIGludG8gJCgnLmRvYy1zZWN0aW9uJylcbiAgIyA8ZGl2IGNsYXNzPVwiaWZyYW1lLWNvbnRhaW5lclwiPlxuICAjICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj48L3NlY3Rpb24+XG4gICMgPC9kaXY+XG4gIGZpbmRXcmFwcGVyOiAoJHBhcmVudCkgLT5cbiAgICBpZiAkcGFyZW50LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIikubGVuZ3RoID09IDFcbiAgICAgICR3cmFwcGVyID0gJCgkcGFyZW50Lmh0bWwoKSlcblxuICAgICR3cmFwcGVyXG5cblxuICBzZXRJbnRlcmFjdGl2ZVZpZXc6ICh2aWV3KSAtPlxuICAgIGFzc2VydCBub3QgQGludGVyYWN0aXZlVmlldz8sXG4gICAgICAnRXJyb3IgY3JlYXRpbmcgaW50ZXJhY3RpdmUgdmlldzogTGl2aW5nZG9jIGNhbiBoYXZlIG9ubHkgb25lIGludGVyYWN0aXZlIHZpZXcnXG5cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdmlld1xuXG5cbiAgdG9IdG1sOiAtPlxuICAgIG5ldyBSZW5kZXJlcihcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgKS5odG1sKClcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAc25pcHBldFRyZWUuc2VyaWFsaXplKClcblxuXG4gIHRvSnNvbjogKHByZXR0aWZ5KSAtPlxuICAgIGRhdGEgPSBAc2VyaWFsaXplKClcbiAgICBpZiBwcmV0dGlmeT9cbiAgICAgIHJlcGxhY2VyID0gbnVsbFxuICAgICAgaW5kZW50YXRpb24gPSAyXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgaW5kZW50YXRpb24pXG4gICAgZWxzZVxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSlcblxuXG4gICMgRGVidWdcbiAgIyAtLS0tLVxuXG4gICMgUHJpbnQgdGhlIFNuaXBwZXRUcmVlLlxuICBwcmludE1vZGVsOiAoKSAtPlxuICAgIEBzbmlwcGV0VHJlZS5wcmludCgpXG5cblxuICBMaXZpbmdkb2MuZG9tID0gZG9tXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBzbmlwcGV0cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsIiMgUHJvcGVydHkgVmFsaWRhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFByb3BlcnR5VmFsaWRhdG9yXG4gIHRlcm1SZWdleCA9IC9cXHdbXFx3IF0qXFx3L2dcblxuICBjb25zdHJ1Y3RvcjogKHsgQGlucHV0U3RyaW5nLCBAcHJvcGVydHksIEBzY2hlbWFOYW1lLCBAcGFyZW50LCBAc2NoZW1lIH0pIC0+XG4gICAgQHZhbGlkYXRvcnMgPSBbXVxuICAgIEBsb2NhdGlvbiA9IEBnZXRMb2NhdGlvbigpXG4gICAgQHBhcmVudC5hZGRSZXF1aXJlZFByb3BlcnR5KEBwcm9wZXJ0eSkgaWYgQHBhcmVudD9cbiAgICBAYWRkVmFsaWRhdGlvbnMoQGlucHV0U3RyaW5nKVxuXG5cbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgaWYgbm90IEBwcm9wZXJ0eT9cbiAgICAgICcnXG4gICAgZWxzZSBpZiBAcGFyZW50P1xuICAgICAgQHBhcmVudC5sb2NhdGlvbiArIEBzY2hlbWUud3JpdGVQcm9wZXJ0eShAcHJvcGVydHkpXG4gICAgZWxzZVxuICAgICAgQHNjaGVtZS53cml0ZVByb3BlcnR5KEBwcm9wZXJ0eSlcblxuXG4gIGFkZFZhbGlkYXRpb25zOiAoY29uZmlnU3RyaW5nKSAtPlxuICAgIHdoaWxlIHJlc3VsdCA9IHRlcm1SZWdleC5leGVjKGNvbmZpZ1N0cmluZylcbiAgICAgIHRlcm0gPSByZXN1bHRbMF1cbiAgICAgIGlmIHRlcm0gPT0gJ29wdGlvbmFsJ1xuICAgICAgICBAaXNPcHRpb25hbCA9IHRydWVcbiAgICAgICAgQHBhcmVudC5yZW1vdmVSZXF1aXJlZFByb3BlcnR5KEBwcm9wZXJ0eSlcbiAgICAgIGVsc2UgaWYgdGVybS5pbmRleE9mKCdhcnJheSBvZiAnKSA9PSAwXG4gICAgICAgIEB2YWxpZGF0b3JzLnB1c2goJ2FycmF5JylcbiAgICAgICAgQGFycmF5VmFsaWRhdG9yID0gdGVybS5zbGljZSg5KVxuICAgICAgZWxzZSBpZiB0ZXJtLmluZGV4T2YoJyBvciAnKSAhPSAtMVxuICAgICAgICB0eXBlcyA9IHRlcm0uc3BsaXQoJyBvciAnKVxuICAgICAgICBjb25zb2xlLmxvZygndG9kbycpXG4gICAgICBlbHNlXG4gICAgICAgIEB2YWxpZGF0b3JzLnB1c2godGVybSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgdmFsaWRhdGU6ICh2YWx1ZSwgZXJyb3JzKSAtPlxuICAgIGlzVmFsaWQgPSB0cnVlXG4gICAgdmFsaWRhdG9ycyA9IEBzY2hlbWUudmFsaWRhdG9yc1xuICAgIGZvciBuYW1lIGluIEB2YWxpZGF0b3JzIHx8IFtdXG4gICAgICB2YWxpZGF0ZSA9IHZhbGlkYXRvcnNbbmFtZV1cbiAgICAgIHJldHVybiBlcnJvcnMuYWRkKFwibWlzc2luZyB2YWxpZGF0b3IgI3sgbmFtZSB9XCIsIGxvY2F0aW9uOiBAbG9jYXRpb24pIHVubGVzcyB2YWxpZGF0ZT9cblxuICAgICAgY29udGludWUgaWYgdmFsaWQgPSB2YWxpZGF0ZSh2YWx1ZSkgPT0gdHJ1ZVxuICAgICAgZXJyb3JzLmFkZCh2YWxpZCwgbG9jYXRpb246IEBsb2NhdGlvbiwgZGVmYXVsdE1lc3NhZ2U6IFwiI3sgbmFtZSB9IHZhbGlkYXRvciBmYWlsZWRcIilcbiAgICAgIGlzVmFsaWQgPSBmYWxzZVxuXG4gICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBpc1ZhbGlkID0gQHZhbGlkYXRlQXJyYXkodmFsdWUsIGVycm9ycylcbiAgICByZXR1cm4gZmFsc2UgaWYgbm90IGlzVmFsaWQgPSBAdmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXModmFsdWUsIGVycm9ycylcblxuICAgIGlzVmFsaWRcblxuXG4gIHZhbGlkYXRlQXJyYXk6IChhcnIsIGVycm9ycykgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgQGFycmF5VmFsaWRhdG9yP1xuICAgIGlzVmFsaWQgPSB0cnVlXG5cbiAgICB2YWxpZGF0ZSA9IEBzY2hlbWUudmFsaWRhdG9yc1tAYXJyYXlWYWxpZGF0b3JdXG4gICAgcmV0dXJuIGVycm9ycy5hZGQoXCJtaXNzaW5nIHZhbGlkYXRvciAjeyBAYXJyYXlWYWxpZGF0b3IgfVwiLCBsb2NhdGlvbjogQGxvY2F0aW9uKSB1bmxlc3MgdmFsaWRhdGU/XG5cbiAgICBmb3IgZW50cnksIGluZGV4IGluIGFyciB8fCBbXVxuICAgICAgcmVzID0gdmFsaWRhdGUoZW50cnkpXG4gICAgICBjb250aW51ZSBpZiByZXMgPT0gdHJ1ZVxuICAgICAgbG9jYXRpb24gPSBcIiN7IEBsb2NhdGlvbiB9WyN7IGluZGV4IH1dXCJcbiAgICAgIGVycm9ycy5hZGQocmVzLCBsb2NhdGlvbjogbG9jYXRpb24sIGRlZmF1bHRNZXNzYWdlOiBcIiN7IEBhcnJheVZhbGlkYXRvciB9IHZhbGlkYXRvciBmYWlsZWRcIilcbiAgICAgIGlzVmFsaWQgPSBmYWxzZVxuXG4gICAgaXNWYWxpZFxuXG5cbiAgdmFsaWRhdGVPdGhlclByb3BlcnR5OiAoa2V5LCB2YWx1ZSwgZXJyb3JzKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBAb3RoZXJQcm9wZXJ0eVZhbGlkYXRvcj9cbiAgICBAc2NoZW1lLmVycm9ycyA9IHVuZGVmaW5lZFxuICAgIHJldHVybiB0cnVlIGlmIGlzVmFsaWQgPSBAb3RoZXJQcm9wZXJ0eVZhbGlkYXRvci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpXG5cbiAgICBpZiBAc2NoZW1lLmVycm9ycz9cbiAgICAgIGVycm9ycy5qb2luKEBzY2hlbWUuZXJyb3JzLCBsb2NhdGlvbjogXCIjeyBAbG9jYXRpb24gfSN7IEBzY2hlbWUud3JpdGVQcm9wZXJ0eShrZXkpIH1cIilcbiAgICBlbHNlXG4gICAgICBlcnJvcnMuYWRkKFwiYWRkaXRpb25hbCBwcm9wZXJ0eSBjaGVjayBmYWlsZWRcIiwgbG9jYXRpb246IFwiI3sgQGxvY2F0aW9uIH0jeyBAc2NoZW1lLndyaXRlUHJvcGVydHkoa2V5KSB9XCIpXG5cbiAgICBmYWxzZVxuXG5cbiAgdmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXM6IChvYmosIGVycm9ycykgLT5cbiAgICBpc1ZhbGlkID0gdHJ1ZVxuICAgIGZvciBrZXksIGlzUmVxdWlyZWQgb2YgQHJlcXVpcmVkUHJvcGVydGllc1xuICAgICAgaWYgbm90IG9ialtrZXldPyAmJiBpc1JlcXVpcmVkXG4gICAgICAgIGVycm9ycy5hZGQoXCJyZXF1aXJlZCBwcm9wZXJ0eSBtaXNzaW5nXCIsIGxvY2F0aW9uOiBcIiN7IEBsb2NhdGlvbiB9I3sgQHNjaGVtZS53cml0ZVByb3BlcnR5KGtleSkgfVwiKVxuICAgICAgICBpc1ZhbGlkID0gZmFsc2VcblxuICAgIGlzVmFsaWRcblxuXG4gIGFkZFJlcXVpcmVkUHJvcGVydHk6IChrZXkpIC0+XG4gICAgQHJlcXVpcmVkUHJvcGVydGllcyA/PSB7fVxuICAgIEByZXF1aXJlZFByb3BlcnRpZXNba2V5XSA9IHRydWVcblxuXG4gIHJlbW92ZVJlcXVpcmVkUHJvcGVydHk6IChrZXkpIC0+XG4gICAgQHJlcXVpcmVkUHJvcGVydGllc1trZXldID0gdW5kZWZpbmVkXG5cbiIsIlZhbGlkYXRpb25FcnJvcnMgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25fZXJyb3JzJylcblByb3BlcnR5VmFsaWRhdG9yID0gcmVxdWlyZSgnLi9wcm9wZXJ0eV92YWxpZGF0b3InKVxudmFsaWRhdG9ycyA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpXG5cbiMgcHJvcGV5ZSwganNvbmppbW1teVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTY2hlbWVcbiAganNWYXJpYWJsZU5hbWUgPSAvXlthLXpBLVpdXFx3KiQvXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHZhbGlkYXRvcnMgPSBPYmplY3QuY3JlYXRlKHZhbGlkYXRvcnMpXG4gICAgQHNjaGVtYXMgPSB7fVxuXG5cbiAgYWRkOiAobmFtZSwgc2NoZW1hKSAtPlxuICAgIGlmICQudHlwZShzY2hlbWEpID09ICdmdW5jdGlvbidcbiAgICAgIEB2YWxpZGF0b3JzW25hbWVdID0gc2NoZW1hXG4gICAgZWxzZVxuICAgICAgQGFkZFNjaGVtYShuYW1lLCBAcGFyc2VDb25maWdPYmooc2NoZW1hLCB1bmRlZmluZWQsIG5hbWUpKVxuXG5cbiAgYWRkU2NoZW1hOiAobmFtZSwgc2NoZW1hKSAtPlxuICAgIGlmIEB2YWxpZGF0b3JzW25hbWVdP1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSB2YWxpZGF0b3IgaXMgYWxyZWR5IHJlZ2lzdGVyZWQgdW5kZXIgdGhpcyBuYW1lOiAjeyBuYW1lIH1cIilcblxuICAgIEBzY2hlbWFzW25hbWVdID0gc2NoZW1hXG4gICAgQHZhbGlkYXRvcnNbbmFtZV0gPSAodmFsdWUpID0+XG4gICAgICBlcnJvcnMgPSBAcmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hLCB2YWx1ZSlcbiAgICAgIHJldHVybiBpZiBlcnJvcnMuaGFzRXJyb3JzKCkgdGhlbiBlcnJvcnMgZWxzZSB0cnVlXG5cblxuICAjIEByZXR1cm5zIHsgQm9vbGVhbiB9IHJldHVybnMgaWYgdGhlIG9iamVjdCBpcyB2YWxpZCBvciBub3QuXG4gIHZhbGlkYXRlOiAoc2NoZW1hTmFtZSwgb2JqKSAtPlxuICAgIEBlcnJvcnMgPSB1bmRlZmluZWRcbiAgICBzY2hlbWEgPSBAc2NoZW1hc1tzY2hlbWFOYW1lXVxuICAgIHJldHVybiBbXCJtaXNzaW5nIHNjaGVtYSAjeyBzY2hlbWFOYW1lIH1cIl0gdW5sZXNzIHNjaGVtYT9cbiAgICBAZXJyb3JzID0gQHJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYSwgb2JqKS5zZXRSb290KHNjaGVtYU5hbWUpXG4gICAgcmV0dXJuIG5vdCBAZXJyb3JzLmhhc0Vycm9ycygpXG5cblxuICBoYXNFcnJvcnM6IC0+XG4gICAgQGVycm9ycz8uaGFzRXJyb3JzKClcblxuXG4gIGdldEVycm9yTWVzc2FnZXM6IC0+XG4gICAgQGVycm9ycz8uZ2V0TWVzc2FnZXMoKVxuXG5cbiAgIyBSZWN1cnNpdmUgdmFsaWRhdGVcbiAgIyBVc2VkIHRvIHRyYXZlbCB0aGUgaW5wdXQgb2JqZWN0IHJlY3Vyc2l2ZWx5LlxuICAjIEZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAgI1xuICAjIEByZXR1cm5zIHsgVmFsaWRhdGlvbkVycm9ycyBvYmogfSBBbiBvYmplY3Qgd2hpY2ggY29udGFpbnMgdmFsaWRhdGlvbiBlcnJvcnMuXG4gIHJlY3Vyc2l2ZVZhbGlkYXRlOiAoc2NoZW1hT2JqLCBvYmopIC0+XG4gICAgcGFyZW50VmFsaWRhdG9yID0gc2NoZW1hT2JqWydfX3ZhbGlkYXRvciddXG4gICAgZXJyb3JzID0gbmV3IFZhbGlkYXRpb25FcnJvcnMoKVxuICAgIHBhcmVudFZhbGlkYXRvci52YWxpZGF0ZShvYmosIGVycm9ycylcblxuICAgIGZvciBrZXksIHZhbHVlIG9mIG9ialxuICAgICAgaWYgc2NoZW1hT2JqW2tleV0/XG4gICAgICAgIHByb3BlcnR5VmFsaWRhdG9yID0gc2NoZW1hT2JqW2tleV1bJ19fdmFsaWRhdG9yJ11cbiAgICAgICAgaXNWYWxpZCA9IHByb3BlcnR5VmFsaWRhdG9yLnZhbGlkYXRlKHZhbHVlLCBlcnJvcnMpXG4gICAgICAgIGlmIGlzVmFsaWQgJiYgbm90IHByb3BlcnR5VmFsaWRhdG9yLmNoaWxkU2NoZW1hTmFtZT8gJiYgJC50eXBlKHZhbHVlKSA9PSAnb2JqZWN0J1xuICAgICAgICAgIGVycm9ycy5qb2luKEByZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWFPYmpba2V5XSwgdmFsdWUpKVxuICAgICAgZWxzZVxuICAgICAgICBwYXJlbnRWYWxpZGF0b3IudmFsaWRhdGVPdGhlclByb3BlcnR5KGtleSwgdmFsdWUsIGVycm9ycylcblxuICAgIGVycm9yc1xuXG5cbiAgcGFyc2VDb25maWdPYmo6IChvYmosIHBhcmVudFZhbGlkYXRvciwgc2NoZW1hTmFtZSkgLT5cbiAgICBwYXJlbnRWYWxpZGF0b3IgPz0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKGlucHV0U3RyaW5nOiAnb2JqZWN0Jywgc2NoZW1hTmFtZTogc2NoZW1hTmFtZSwgc2NoZW1lOiB0aGlzKVxuXG4gICAgZm9yIGtleSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb250aW51ZSBpZiBAYWRkUGFyZW50VmFsaWRhdG9yKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWx1ZSlcblxuICAgICAgdmFsdWVUeXBlID0gJC50eXBlKHZhbHVlKVxuICAgICAgaWYgdmFsdWVUeXBlID09ICdzdHJpbmcnXG4gICAgICAgIHByb3BWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3IoaW5wdXRTdHJpbmc6IHZhbHVlLCBwcm9wZXJ0eToga2V5LCBwYXJlbnQ6IHBhcmVudFZhbGlkYXRvciwgc2NoZW1lOiB0aGlzKVxuICAgICAgICBvYmpba2V5XSA9IHsgJ19fdmFsaWRhdG9yJzogcHJvcFZhbGlkYXRvciB9XG4gICAgICBlbHNlIGlmIHZhbHVlVHlwZSA9PSAnb2JqZWN0J1xuICAgICAgICBwcm9wVmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKGlucHV0U3RyaW5nOiAnb2JqZWN0JywgcHJvcGVydHk6IGtleSwgcGFyZW50OiBwYXJlbnRWYWxpZGF0b3IsIHNjaGVtZTogdGhpcylcbiAgICAgICAgb2JqW2tleV0gPSBAcGFyc2VDb25maWdPYmoodmFsdWUsIHByb3BWYWxpZGF0b3IpXG5cbiAgICBvYmpbJ19fdmFsaWRhdG9yJ10gPSBwYXJlbnRWYWxpZGF0b3JcbiAgICBvYmpcblxuXG4gIGFkZFBhcmVudFZhbGlkYXRvcjogKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWxpZGF0b3IpIC0+XG4gICAgc3dpdGNoIGtleVxuICAgICAgd2hlbiAnX192YWxpZGF0ZSdcbiAgICAgICAgcGFyZW50VmFsaWRhdG9yLmFkZFZhbGlkYXRpb25zKHZhbGlkYXRvcilcbiAgICAgIHdoZW4gJ19fYWRkaXRpb25hbFByb3BlcnR5J1xuICAgICAgICBpZiAkLnR5cGUodmFsaWRhdG9yKSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgcGFyZW50VmFsaWRhdG9yLm90aGVyUHJvcGVydHlWYWxpZGF0b3IgPSB2YWxpZGF0b3JcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgd3JpdGVQcm9wZXJ0eTogKHZhbHVlKSAtPlxuICAgIGlmIGpzVmFyaWFibGVOYW1lLnRlc3QodmFsdWUpIHRoZW4gXCIuI3sgdmFsdWUgfVwiIGVsc2UgXCJbJyN7IHZhbHVlIH0nXVwiXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmFsaWRhdGlvbkVycm9yc1xuXG5cbiAgaGFzRXJyb3JzOiAtPlxuICAgIEBlcnJvcnM/XG5cblxuICBzZXRSb290OiAoQHJvb3QpIC0+XG4gICAgdGhpc1xuXG5cbiAgIyBBZGQgYW4gZXJyb3IgbWVzc2FnZVxuICBhZGQ6IChtZXNzYWdlLCB7IGxvY2F0aW9uLCBkZWZhdWx0TWVzc2FnZSB9PXt9ICkgLT5cbiAgICBtZXNzYWdlID0gZGVmYXVsdE1lc3NhZ2UgaWYgbWVzc2FnZSA9PSBmYWxzZVxuICAgIEBlcnJvcnMgPz0gW11cbiAgICBpZiAkLnR5cGUobWVzc2FnZSkgPT0gJ3N0cmluZydcbiAgICAgIEBlcnJvcnMucHVzaFxuICAgICAgICBwYXRoOiBsb2NhdGlvblxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgZWxzZSBpZiBtZXNzYWdlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yc1xuICAgICAgQGpvaW4obWVzc2FnZSwgbG9jYXRpb246IGxvY2F0aW9uKVxuICAgIGVsc2UgaWYgbWVzc2FnZS5wYXRoIGFuZCBtZXNzYWdlLm1lc3NhZ2VcbiAgICAgIGVycm9yID0gbWVzc2FnZVxuICAgICAgQGVycm9ycy5wdXNoXG4gICAgICAgIHBhdGg6IGxvY2F0aW9uICsgZXJyb3IucGF0aFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWxpZGF0aW9uRXJyb3IuYWRkKCkgdW5rbm93biBlcnJvciB0eXBlJylcblxuICAgIGZhbHNlXG5cblxuICAjIEFwcGVuZCB0aGUgZXJyb3JzIGZyb20gYW5vdGhlciBWYWxpZGF0aW9uRXJyb3JzIGluc3RhbmNlXG4gICMgQHBhcmFtIHsgVmFsaWRhdGlvbkVycm9ycyBpbnN0YW5jZSB9XG4gIGpvaW46ICh7IGVycm9ycyB9LCB7IGxvY2F0aW9uIH09e30pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlcnJvcnM/XG5cbiAgICBpZiBlcnJvcnMubGVuZ3RoXG4gICAgICBAZXJyb3JzID89IFtdXG4gICAgICBmb3IgZXJyb3IgaW4gZXJyb3JzXG4gICAgICAgIEBlcnJvcnMucHVzaFxuICAgICAgICAgIHBhdGg6IChsb2NhdGlvbiB8fCAnJykgKyBlcnJvci5wYXRoXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuXG5cbiAgZ2V0TWVzc2FnZXM6IC0+XG4gICAgbWVzc2FnZXMgPSBbXVxuICAgIGZvciBlcnJvciBpbiBAZXJyb3JzIHx8IFtdXG4gICAgICBtZXNzYWdlcy5wdXNoKFwiI3sgQHJvb3QgfHwgJycgfSN7IGVycm9yLnBhdGggfTogI3sgZXJyb3IubWVzc2FnZSB9XCIpXG5cbiAgICBtZXNzYWdlc1xuXG4iLCIjIEV4dGVuZCBWYWxpZGF0b3IgaW50ZXJmYWNlXG4jXG4jIEV4YW1wbGUgVmFsaWRhdG9yIE1ldGhvZDpcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBAcGFyYW0geyBvYmplY3QgfSBWYWx1ZSB0byB2YWxpZGF0ZS4gQ2FuIGJlIGFuIG9iamVjdCBvciBhIHByaW1pdGl2ZSBkYXRhIHR5cGUuXG4jIEByZXR1cm5zIHsgdHJ1ZSwgZmFsc2UsIFN0cmluZyBvciBWYWxpZGF0aW9uRXJyb3JzIGluc3RhbmNlIH1cbiMgICAtIHRydWU6IHZhbGlkXG4jICAgLSBmYWxzZTogaW52YWxpZCB3aXRoIHN0YW5kYXJkIGVycm9yIG1lc3NhZ2VcbiMgICAtIFN0cmluZzogaW52YWxpZCB3aXRoIG9uZSBzaW5nbGUgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiMgICAtIFZhbGlkYXRpb25FcnJvcnM6IGludmFsaWQgd2l0aCBtdWx0aXBsZSBjb21wbGV0ZSBlcnJvciBtZXNzYWdlc1xuI1xuIyAodmFsdWUpIC0+XG4jICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgPT0gJ3ZhbGlkJ1xuI1xubW9kdWxlLmV4cG9ydHMgPVxuICAnb2JqZWN0JzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdvYmplY3QnXG4gICdzdHJpbmcnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ3N0cmluZydcbiAgJ2Jvb2xlYW4nOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ2Jvb2xlYW4nXG4gICdudW1iZXInOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ251bWJlcidcbiAgJ2Z1bmN0aW9uJzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdmdW5jdGlvbidcbiAgJ2RhdGUnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ2RhdGUnXG4gICdyZWdleHAnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ3JlZ2V4cCdcbiAgJ2FycmF5JzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdhcnJheSdcbiAgJ2ZhbHN5JzogKHZhbHVlKSAtPiAhIXZhbHVlID09IGZhbHNlXG4gICd0cnV0aHknOiAodmFsdWUpIC0+ICEhdmFsdWUgPT0gdHJ1ZVxuICAnbm90IGVtcHR5JzogKHZhbHVlKSAtPiAhIXZhbHVlID09IHRydWVcbiAgJ2RlcHJlY2F0ZWQnOiAodmFsdWUpIC0+IHRydWVcblxuXG4jIHN1Z2dlc3Rpb25zOlxuIyBhY2NvbXBhbmllZCBieSBhZGRyZXNzIC0+IG1ha2VzIGFkZHJlc3Mgb3B0aW9uYWwgdW5sZXNzIHRoaXMgZmllbGQgaXMgc3BlY2lmaWVkXG4jIGRlcGVuZHMgb24gYWRkcmVzcyAtPiBzYW1lIGFzIGFib3ZlXG4jIHZhbHVlKHRydWUpIC0+IHRydWUgaWYgdmFsdWUgaXMgYm9vbGVhbiB0cnVlXG4jIHZhbHVlKCdhZGRyZXNzJykgLT4gdHJ1ZSBpZiB2YWx1ZSBpcyBzdHJpbmcgJ2FkZHJlc3MnXG4jIHZhbHVlKFswLCAxXSkgLT4gdHJ1ZSBpZiB2YWx1ZSBpcyBhbiBhcnJheSB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWVzXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3JkZXJlZEhhc2hcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAb2JqID0ge31cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgcHVzaDogKGtleSwgdmFsdWUpIC0+XG4gICAgQG9ialtrZXldID0gdmFsdWVcbiAgICBAW0BsZW5ndGhdID0gdmFsdWVcbiAgICBAbGVuZ3RoICs9IDFcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAb2JqW2tleV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdmFsdWUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2sodmFsdWUpXG5cblxuICB0b0FycmF5OiAtPlxuICAgIHZhbHVlIGZvciB2YWx1ZSBpbiB0aGlzXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0VHJlZSwgQHJlbmRlcmluZ0NvbnRhaW5lciwgJHdyYXBwZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQHNuaXBwZXRWaWV3cyA9IHt9XG5cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAcmVuZGVyT25jZVBhZ2VSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIHNuaXBwZXRUcmVlIGluIHRoZSAkcm9vdCBub2RlLlxuICAgICMgU29tZSBkb20uY29mZmVlIG1ldGhvZHMgbmVlZCBpdCB0byBnZXQgaG9sZCBvZiB0aGUgc25pcHBldCB0cmVlXG4gICAgQCRyb290LmRhdGEoJ3NuaXBwZXRUcmVlJywgQHNuaXBwZXRUcmVlKVxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBTbmlwcGV0IFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0QWRkZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0QWRkZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldFJlbW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0TW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0TW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgc25pcHBldEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgc25pcHBldEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgc25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0U25pcHBldDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwpXG5cbiAgICBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignU25pcHBldCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIHNuaXBwZXRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcbiAgICBzbmlwcGV0Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5zbmlwcGV0Vmlld1dhc0luc2VydGVkKHNuaXBwZXRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZFNuaXBwZXRzKG1vZGVsKVxuXG5cbiAgaXNTbmlwcGV0QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkU25pcHBldHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNTbmlwcGV0QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydFNuaXBwZXQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydFNuaXBwZXRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yU25pcHBldChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvclNuaXBwZXQobW9kZWwpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQoY29udGFpbmVyLnBhcmVudFNuaXBwZXQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRWaWV3XG5cbiAgY29uc3RydWN0b3I6ICh7IEBtb2RlbCwgQCRodG1sLCBAZGlyZWN0aXZlcywgQGlzUmVhZE9ubHkgfSkgLT5cbiAgICBAJGVsZW0gPSBAJGh0bWxcbiAgICBAdGVtcGxhdGUgPSBAbW9kZWwudGVtcGxhdGVcbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gZmFsc2VcbiAgICBAd2FzQXR0YWNoZWRUb0RvbSA9ICQuQ2FsbGJhY2tzKCk7XG5cbiAgICB1bmxlc3MgQGlzUmVhZE9ubHlcbiAgICAgICMgYWRkIGF0dHJpYnV0ZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIGh0bWxcbiAgICAgIEAkaHRtbFxuICAgICAgICAuZGF0YSgnc25pcHBldCcsIHRoaXMpXG4gICAgICAgIC5hZGRDbGFzcyhjc3Muc25pcHBldClcbiAgICAgICAgLmF0dHIoYXR0ci50ZW1wbGF0ZSwgQHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICBAcmVuZGVyKClcblxuXG4gIHJlbmRlcjogKG1vZGUpIC0+XG4gICAgQHVwZGF0ZUNvbnRlbnQoKVxuICAgIEB1cGRhdGVIdG1sKClcblxuXG4gIHVwZGF0ZUNvbnRlbnQ6IC0+XG4gICAgQGNvbnRlbnQoQG1vZGVsLmNvbnRlbnQpXG5cbiAgICBpZiBub3QgQGhhc0ZvY3VzKClcbiAgICAgIEBkaXNwbGF5T3B0aW9uYWxzKClcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIHVwZGF0ZUh0bWw6IC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIEBtb2RlbC5zdHlsZXNcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIGRpc3BsYXlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgICRlbGVtID0gJChkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgaWYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJycpXG5cblxuICAjIFNob3cgYWxsIGRvYy1vcHRpb25hbHMgd2hldGhlciB0aGV5IGFyZSBlbXB0eSBvciBub3QuXG4gICMgVXNlIG9uIGZvY3VzLlxuICBzaG93T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuc2hvdygkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gICMgSGlkZSBhbGwgZW1wdHkgZG9jLW9wdGlvbmFsc1xuICAjIFVzZSBvbiBibHVyLlxuICBoaWRlRW1wdHlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsICYmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuaGlkZSgkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gIG5leHQ6IC0+XG4gICAgQCRodG1sLm5leHQoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIHByZXY6IC0+XG4gICAgQCRodG1sLnByZXYoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIGFmdGVyRm9jdXNlZDogKCkgLT5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAaGlkZUVtcHR5T3B0aW9uYWxzKClcblxuXG4gICMgQHBhcmFtIGN1cnNvcjogdW5kZWZpbmVkLCAnc3RhcnQnLCAnZW5kJ1xuICBmb2N1czogKGN1cnNvcikgLT5cbiAgICBmaXJzdCA9IEBkaXJlY3RpdmVzLmVkaXRhYmxlP1swXS5lbGVtXG4gICAgJChmaXJzdCkuZm9jdXMoKVxuXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgQCRodG1sLmhhc0NsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEAkaHRtbFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEAkaHRtbFswXSlcblxuXG4gIGNvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBkaXJlY3RpdmUgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICAgIGlmIGRpcmVjdGl2ZS5iYXNlNjRJbWFnZT9cbiAgICAgICAgICBAc2V0KG5hbWUsIGRpcmVjdGl2ZS5iYXNlNjRJbWFnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBzZXQobmFtZSwgZGlyZWN0aXZlLmdldEltYWdlVXJsKCkgKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0KG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAc2V0RWRpdGFibGUobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAc2V0SW1hZ2UobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBzZXRIdG1sKG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBnZXRFZGl0YWJsZShuYW1lKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQGdldEltYWdlKG5hbWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBnZXRIdG1sKG5hbWUpXG5cblxuICBnZXRFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0RWRpdGFibGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICByZXR1cm4gaWYgQGhhc0ZvY3VzKClcblxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS50b2dnbGVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlciwgQm9vbGVhbih2YWx1ZSkpXG4gICAgJGVsZW0uYXR0cihhdHRyLnBsYWNlaG9sZGVyLCBAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG5cbiAgICAkZWxlbS5odG1sKHZhbHVlIHx8ICcnKVxuXG5cbiAgZm9jdXNFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmFkZENsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuXG5cbiAgYmx1ckVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgaWYgQG1vZGVsLmlzRW1wdHkobmFtZSlcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuXG5cbiAgZ2V0SHRtbDogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0SHRtbDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKHZhbHVlIHx8ICcnKVxuXG4gICAgaWYgbm90IHZhbHVlXG4gICAgICAkZWxlbS5odG1sKEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcbiAgICBlbHNlIGlmIHZhbHVlIGFuZCBub3QgQGlzUmVhZE9ubHlcbiAgICAgIEBibG9ja0ludGVyYWN0aW9uKCRlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0IHx8PSB7fVxuICAgIEBkaXJlY3RpdmVzVG9SZXNldFtuYW1lXSA9IG5hbWVcblxuXG4gIGdldERpcmVjdGl2ZUVsZW1lbnQ6IChkaXJlY3RpdmVOYW1lKSAtPlxuICAgIEBkaXJlY3RpdmVzLmdldChkaXJlY3RpdmVOYW1lKT8uZWxlbVxuXG5cbiAgIyBSZXNldCBkaXJlY3RpdmVzIHRoYXQgY29udGFpbiBhcmJpdHJhcnkgaHRtbCBhZnRlciB0aGUgdmlldyBpcyBtb3ZlZCBpblxuICAjIHRoZSBET00gdG8gcmVjcmVhdGUgaWZyYW1lcy4gSW4gdGhlIGNhc2Ugb2YgdHdpdHRlciB3aGVyZSB0aGUgaWZyYW1lc1xuICAjIGRvbid0IGhhdmUgYSBzcmMgdGhlIHJlbG9hZGluZyB0aGF0IGhhcHBlbnMgd2hlbiBvbmUgbW92ZXMgYW4gaWZyYW1lIGNsZWFyc1xuICAjIGFsbCBjb250ZW50IChNYXliZSB3ZSBjb3VsZCBsaW1pdCByZXNldHRpbmcgdG8gaWZyYW1lcyB3aXRob3V0IGEgc3JjKS5cbiAgI1xuICAjIFNvbWUgbW9yZSBpbmZvIGFib3V0IHRoZSBpc3N1ZSBvbiBzdGFja292ZXJmbG93OlxuICAjIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODMxODI2NC9ob3ctdG8tbW92ZS1hbi1pZnJhbWUtaW4tdGhlLWRvbS13aXRob3V0LWxvc2luZy1pdHMtc3RhdGVcbiAgcmVzZXREaXJlY3RpdmVzOiAtPlxuICAgIGZvciBuYW1lIG9mIEBkaXJlY3RpdmVzVG9SZXNldFxuICAgICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICAgaWYgJGVsZW0uZmluZCgnaWZyYW1lJykubGVuZ3RoXG4gICAgICAgIEBzZXQobmFtZSwgQG1vZGVsLmNvbnRlbnRbbmFtZV0pXG5cblxuICBnZXRJbWFnZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmF0dHIoJ3NyYycpXG5cblxuICBzZXRJbWFnZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcblxuICAgIGlmIHZhbHVlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltYWdlU2VydmljZS5zZXQoJGVsZW0sIHZhbHVlKVxuXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0UGxhY2Vob2xkZXIgPSAkLnByb3h5KEBzZXRQbGFjZWhvbGRlckltYWdlLCB0aGlzLCAkZWxlbSwgbmFtZSlcbiAgICAgIEBkZWxheVVudGlsQXR0YWNoZWQobmFtZSwgc2V0UGxhY2Vob2xkZXIpICMgdG9kbzogcmVwbGFjZSB3aXRoIEBhZnRlckluc2VydGVkIC0+IC4uLiAoc29tZXRoaW5nIGxpa2UgJC5DYWxsYmFja3MoJ29uY2UgcmVtZW1iZXInKSlcblxuXG4gIHNldFBsYWNlaG9sZGVySW1hZ2U6ICgkZWxlbSwgbmFtZSkgLT5cbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgaWYgJGVsZW1bMF0ubm9kZU5hbWUgPT0gJ0lNRydcbiAgICAgIHdpZHRoID0gJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aCA9ICRlbGVtLm91dGVyV2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIHZhbHVlID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7d2lkdGh9eCN7aGVpZ2h0fS9CRUY1NkYvQjJFNjY4XCJcblxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgIGltYWdlU2VydmljZS5zZXQoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gICMgV2FpdCB0byBleGVjdXRlIGEgbWV0aG9kIHVudGlsIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBET01cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0VHJlZSwgQHBhcmVudCkgLT5cbiAgICBAcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgQGlzSW50ZXJhY3RpdmUgPSBmYWxzZVxuXG5cbiAgIyBBdmFpbGFibGUgT3B0aW9uczpcbiAgIyBSZWFkT25seSB2aWV3OiAoZGVmYXVsdCBpZiBub3RoaW5nIGlzIHNwZWNpZmllZClcbiAgIyBjcmVhdGUocmVhZE9ubHk6IHRydWUpXG4gICNcbiAgIyBJbmVyYWN0aXZlIHZpZXc6XG4gICMgY3JlYXRlKGludGVyYWN0aXZlOiB0cnVlKVxuICAjXG4gICMgV3JhcHBlcjogKERPTSBub2RlIHRoYXQgaGFzIHRvIGNvbnRhaW4gYSBub2RlIHdpdGggY2xhc3MgJy5kb2Mtc2VjdGlvbicpXG4gICMgY3JlYXRlKCAkd3JhcHBlcjogJCgnPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj4nKSApXG4gIGNyZWF0ZTogKG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZUlGcmFtZShAcGFyZW50KS50aGVuIChpZnJhbWUsIHJlbmRlck5vZGUpID0+XG4gICAgICBAaWZyYW1lID0gaWZyYW1lXG4gICAgICByZW5kZXJlciA9IEBjcmVhdGVJRnJhbWVSZW5kZXJlcihpZnJhbWUsIG9wdGlvbnMpXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZVJlbmRlcmVyXG4gICAgICByZW5kZXJOb2RlOiBpZnJhbWUuY29udGVudERvY3VtZW50LmJvZHlcbiAgICAgIG9wdGlvbnM6IG9wdGlvbnNcblxuXG4gIGNyZWF0ZVJlbmRlcmVyOiAoeyByZW5kZXJOb2RlLCBvcHRpb25zIH09e30pIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUgfHwgQHBhcmVudFxuICAgICAgZGVzaWduOiBAc25pcHBldFRyZWUuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcblxuICAgIG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgJHdyYXBwZXI6IG9wdGlvbnMuJHdyYXBwZXJcblxuXG4gIGNyZWF0ZVBhZ2U6IChwYXJhbXMsIHsgaW50ZXJhY3RpdmUsIHJlYWRPbmx5LCBsb2FkUmVzb3VyY2VzIH09e30pIC0+XG4gICAgcGFyYW1zID89IHt9XG4gICAgcGFyYW1zLmxvYWRSZXNvdXJjZXMgPSBsb2FkUmVzb3VyY2VzXG4gICAgaWYgaW50ZXJhY3RpdmU/XG4gICAgICBAaXNJbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIG5ldyBJbnRlcmFjdGl2ZVBhZ2UocGFyYW1zKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQYWdlKHBhcmFtcylcblxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc0Rpc2FibGVkXG5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgZGlzYWJsZTogLT5cbiAgICBAaXNEaXNhYmxlZCA9IHRydWVcblxuXG4gICMgQHByaXZhdGVcbiAgbG9hZFNpbmdsZVVybDogKHVybCwgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc0Rpc2FibGVkXG5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuXG4gICAgICAjIERvIG5vdCBwcmV2ZW50IHRoZSBwYWdlIGZyb20gbG9hZGluZyBiZWNhdXNlIG9mIGNzcyBlcnJvcnNcbiAgICAgICMgb25lcnJvciBpcyBub3Qgc3VwcG9ydGVkIGJ5IGV2ZXJ5IGJyb3dzZXIuXG4gICAgICAjIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC9saW5rXG4gICAgICBsaW5rLm9uZXJyb3IgPSAtPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJTdHlsZXNoZWV0IGNvdWxkIG5vdCBiZSBsb2FkZWQ6ICN7IHVybCB9XCJcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgICBsaW5rLmhyZWYgPSB1cmxcbiAgICAgIEB3aW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKVxuICAgICAgQG1hcmtVcmxBc0xvYWRlZCh1cmwpXG5cblxuICAjIEBwcml2YXRlXG4gIGlzVXJsTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLmluZGV4T2YodXJsKSA+PSAwXG5cblxuICAjIEBwcml2YXRlXG4gIG1hcmtVcmxBc0xvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5wdXNoKHVybClcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcblNuaXBwZXREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0b3JQYWdlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHNldFdpbmRvdygpXG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG5cbiAgICAjIFN0dWJzXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9XG4gICAgICBkaXNhYmxlQWxsOiAtPlxuICAgICAgcmVlbmFibGVBbGw6IC0+XG4gICAgQHNuaXBwZXRXYXNEcm9wcGVkID1cbiAgICAgIGZpcmU6IC0+XG4gICAgQGJsdXJGb2N1c2VkRWxlbWVudCA9IC0+XG5cblxuICBzdGFydERyYWc6ICh7IHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHNuaXBwZXRNb2RlbCB8fCBzbmlwcGV0Vmlld1xuICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRWaWV3Lm1vZGVsIGlmIHNuaXBwZXRWaWV3XG5cbiAgICBzbmlwcGV0RHJhZyA9IG5ldyBTbmlwcGV0RHJhZ1xuICAgICAgc25pcHBldE1vZGVsOiBzbmlwcGV0TW9kZWxcbiAgICAgIHNuaXBwZXRWaWV3OiBzbmlwcGV0Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KHNuaXBwZXREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgc2V0V2luZG93OiAtPlxuICAgIEB3aW5kb3cgPSB3aW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuICAgIEAkZG9jdW1lbnRcbiAgICAgIC5vbignbW91c2Vkb3duLmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCd0b3VjaHN0YXJ0LmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCdkcmFnc3RhcnQnLCAkLnByb3h5KEBicm93c2VyRHJhZ1N0YXJ0LCB0aGlzKSlcblxuXG4gIGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5OiAtPlxuICAgIGlmIGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZVxuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuXG4gICAgIyBJZ25vcmUgaW50ZXJhY3Rpb25zIG9uIGNlcnRhaW4gZWxlbWVudHNcbiAgICBpc0NvbnRyb2wgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChjb25maWcuaWdub3JlSW50ZXJhY3Rpb24pLmxlbmd0aFxuICAgIHJldHVybiBpZiBpc0NvbnRyb2xcblxuICAgICMgSWRlbnRpZnkgdGhlIGNsaWNrZWQgc25pcHBldFxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG5cbiAgICAjIFRoaXMgaXMgY2FsbGVkIGluIG1vdXNlZG93biBzaW5jZSBlZGl0YWJsZXMgZ2V0IGZvY3VzIG9uIG1vdXNlZG93blxuICAgICMgYW5kIG9ubHkgYmVmb3JlIHRoZSBlZGl0YWJsZXMgY2xlYXIgdGhlaXIgcGxhY2Vob2xkZXIgY2FuIHdlIHNhZmVseVxuICAgICMgaWRlbnRpZnkgd2hlcmUgdGhlIHVzZXIgaGFzIGNsaWNrZWQuXG4gICAgQGhhbmRsZUNsaWNrZWRTbmlwcGV0KGV2ZW50LCBzbmlwcGV0VmlldylcblxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAc3RhcnREcmFnXG4gICAgICAgIHNuaXBwZXRWaWV3OiBzbmlwcGV0Vmlld1xuICAgICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjYW5jZWxEcmFnOiAtPlxuICAgIEBkcmFnQmFzZS5jYW5jZWwoKVxuXG5cbiAgaGFuZGxlQ2xpY2tlZFNuaXBwZXQ6IChldmVudCwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXNlZChzbmlwcGV0VmlldylcblxuICAgICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIEEgUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFJlbmRlcmluZ0NvbnRhaW5lciB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSBzaG93biB0b1xuIyB0aGUgdXNlci4gSXQgaGFzIGEgTG9hZGVyIHdoaWNoIGFsbG93cyB5b3UgdG8gaW5qZWN0IENTUyBhbmQgSlMgZmlsZXMgaW50byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGFnZSBleHRlbmRzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCByZWFkT25seSwgaG9zdFdpbmRvdywgQGRlc2lnbiwgQHNuaXBwZXRUcmVlLCBAbG9hZFJlc291cmNlcyB9PXt9KSAtPlxuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHJlbmRlck5vZGUgPSBpZiByZW5kZXJOb2RlPy5qcXVlcnkgdGhlbiByZW5kZXJOb2RlWzBdIGVsc2UgcmVuZGVyTm9kZVxuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcbiAgICBAcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcblxuICAgIHN1cGVyKClcblxuICAgIEBjc3NMb2FkZXIgPSBuZXcgQ3NzTG9hZGVyKEB3aW5kb3cpXG4gICAgQGNzc0xvYWRlci5kaXNhYmxlKCkgaWYgbm90IEBzaG91bGRMb2FkUmVzb3VyY2VzKClcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIGJlZm9yZVJlYWR5OiAtPlxuICAgICMgYWx3YXlzIGluaXRpYWxpemUgYSBwYWdlIGFzeW5jaHJvbm91c2x5XG4gICAgQHJlYWR5U2VtYXBob3JlLndhaXQoKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuICAgICwgMFxuXG5cbiAgc2hvdWxkTG9hZFJlc291cmNlczogLT5cbiAgICBpZiBAbG9hZFJlc291cmNlcz9cbiAgICAgIEJvb2xlYW4oQGxvYWRSZXNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgQm9vbGVhbihjb25maWcubG9hZFJlc291cmNlcylcblxuXG4gICMgdG9kbzogbW92ZSBwYXRoIHJlc29sdXRpb25zIHRvIGRlc2lnbi5hc3NldHNcbiAgYmVmb3JlUGFnZVJlYWR5OiA9PlxuICAgIGlmIEBkZXNpZ24/XG4gICAgICBkZXNpZ25QYXRoID0gXCIjeyBjb25maWcuZGVzaWduUGF0aCB9LyN7IEBkZXNpZ24ubmFtZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgaG9zdFdpbmRvdyA/PSBAZ2V0UGFyZW50V2luZG93KEByZW5kZXJOb2RlKVxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cbiAgZ2V0UGFyZW50V2luZG93OiAoZWxlbSkgLT5cbiAgICBpZiBlbGVtP1xuICAgICAgZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgZWxzZVxuICAgICAgd2luZG93XG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbiMgQSBSZW5kZXJpbmdDb250YWluZXIgaXMgdXNlZCBieSB0aGUgUmVuZGVyZXIgdG8gZ2VuZXJhdGUgSFRNTC5cbiNcbiMgVGhlIFJlbmRlcmVyIGluc2VydHMgU25pcHBldFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID89ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0VkaXRhYmxlOiB0cnVlXG5cblxuICBnZXRDb250ZW50OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIdG1sRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNIdG1sOiB0cnVlXG5cblxuICBnZXRDb250ZW50OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAc25pcHBldC5zbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcoQHNuaXBwZXQsIEBuYW1lKSBpZiBAc25pcHBldC5zbmlwcGV0VHJlZVxuXG5cbiAgc2V0SW1hZ2VVcmw6ICh2YWx1ZSkgLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdLnVybCA9IHZhbHVlXG5cbiAgICBAcmVzZXRDcm9wKClcbiAgICBAYmFzZTY0SW1hZ2UgPSB1bmRlZmluZWRcbiAgICBAcHJvY2Vzc0ltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0SW1hZ2VVcmw6IC0+XG4gICAgaW1hZ2UgPSBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGltYWdlXG4gICAgICBpbWFnZS51cmxcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGdldEltYWdlT2JqZWN0OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXS5vcmlnaW5hbFVybCB8fCBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgc2V0Q3JvcDogKHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgbmFtZSB9KSAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cbiAgICBpZiBjdXJyZW50VmFsdWU/LnVybD9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID1cbiAgICAgICAgeDogeFxuICAgICAgICB5OiB5XG4gICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBuYW1lOiBuYW1lXG5cbiAgICAgIEBwcm9jZXNzSW1hZ2VVcmwoY3VycmVudFZhbHVlLm9yaWdpbmFsVXJsIHx8IGN1cnJlbnRWYWx1ZS51cmwpXG4gICAgICBAc25pcHBldC5zbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcoQHNuaXBwZXQsIEBuYW1lKSBpZiBAc25pcHBldC5zbmlwcGV0VHJlZVxuXG5cbiAgcmVzZXRDcm9wOiAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG4gICAgaWYgY3VycmVudFZhbHVlP1xuICAgICAgY3VycmVudFZhbHVlLmNyb3AgPSBudWxsXG5cblxuICBzZXRJbWFnZVNlcnZpY2U6IChpbWFnZVNlcnZpY2VOYW1lKSAtPlxuICAgIGFzc2VydCBpbWFnZVNlcnZpY2UuaGFzKGltYWdlU2VydmljZU5hbWUpLCBcIkVycm9yOiBjb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IGltYWdlU2VydmljZU5hbWUgfVwiXG5cbiAgICBpbWFnZVVybCA9IEBnZXRJbWFnZVVybCgpXG4gICAgQHNuaXBwZXQuY29udGVudFtAbmFtZV0gPVxuICAgICAgdXJsOiBpbWFnZVVybFxuICAgICAgaW1hZ2VTZXJ2aWNlOiBpbWFnZVNlcnZpY2VOYW1lIHx8IG51bGxcblxuXG4gIGdldEltYWdlU2VydmljZU5hbWU6IC0+XG4gICAgQGdldEltYWdlU2VydmljZSgpLm5hbWVcblxuXG4gIGhhc0RlZmF1bHRJbWFnZVNlcnZpY2U6IC0+XG4gICAgQGdldEltYWdlU2VydmljZU5hbWUoKSA9PSAnZGVmYXVsdCdcblxuXG4gIGdldEltYWdlU2VydmljZTogLT5cbiAgICBzZXJ2aWNlTmFtZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdPy5pbWFnZVNlcnZpY2VcbiAgICBpbWFnZVNlcnZpY2UuZ2V0KHNlcnZpY2VOYW1lIHx8IHVuZGVmaW5lZClcblxuXG4gIHByb2Nlc3NJbWFnZVVybDogKHVybCkgLT5cbiAgICBpZiBub3QgQGhhc0RlZmF1bHRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nU2VydmljZSA9IEBnZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nT2JqID0gQGdldEltYWdlT2JqZWN0KClcbiAgICAgIGltZ09iai51cmwgPSBpbWdTZXJ2aWNlLmdldFVybCh1cmwsIGNyb3A6IGltZ09iai5jcm9wKVxuICAgICAgaW1nT2JqLm9yaWdpbmFsVXJsID0gdXJsXG5cbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3Igc25pcHBldHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIFNuaXBwZXRBcnJheSB0aGF0IHdvcmtzIHNpbWlsYXIgdG8gYSBqUXVlcnkgb2JqZWN0LlxuIyBGb3IgZXh0ZW5zaWJpbGl0eSB2aWEgcGx1Z2lucyB3ZSBleHBvc2UgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0QXJyYXlcblxuXG4gICMgQHBhcmFtIHNuaXBwZXRzOiBhcnJheSBvZiBzbmlwcGV0c1xuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0cykgLT5cbiAgICBAc25pcHBldHMgPSBbXSB1bmxlc3MgQHNuaXBwZXRzP1xuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAc25pcHBldHNcbiAgICAgIEBbaW5kZXhdID0gcmVzdWx0XG5cbiAgICBAbGVuZ3RoID0gQHNuaXBwZXRzLmxlbmd0aFxuICAgIGlmIEBzbmlwcGV0cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAc25pcHBldHMubGVuZ3RoIC0gMV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3Igc25pcHBldCBpbiBAc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICByZW1vdmU6ICgpIC0+XG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBTbmlwcGV0Q29udGFpbmVyXG4jIC0tLS0tLS0tLS0tLS0tLS1cbiMgQSBTbmlwcGV0Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2Ygc25pcHBldHMuXG4jXG4jIFRoZSBzbmlwcGV0Q29udGFpbmVyIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIGl0cyBzbmlwcGV0VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgcGFyZW50U25pcHBldDogcGFyZW50IFNuaXBwZXRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Q29udGFpbmVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQHBhcmVudFNuaXBwZXQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBwYXJlbnRTbmlwcGV0XG4gICAgICBhc3NlcnQgc25pcHBldCBpc250IEBwYXJlbnRTbmlwcGV0LCAnY2Fubm90IGFwcGVuZCBzbmlwcGV0IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5wcmV2aW91cyA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIG5leHQ6IHNuaXBwZXRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5uZXh0ID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0XG4gICAgICBuZXh0OiBzbmlwcGV0Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICB1cDogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIEBpbnNlcnRCZWZvcmUoc25pcHBldC5wcmV2aW91cywgc25pcHBldClcblxuXG4gIGRvd246IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihzbmlwcGV0Lm5leHQsIHNuaXBwZXQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWUgfHwgQHBhcmVudFNuaXBwZXQ/LnNuaXBwZXRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldCA9IEBmaXJzdFxuICAgIHdoaWxlIChzbmlwcGV0KVxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHMgYW5kIGNvbnRhaW5lcnNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldC5kZXN0cm95KClcbiAgICBAX2RldGFjaFNuaXBwZXQoc25pcHBldClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEV2ZXJ5IHNuaXBwZXQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIEBhcGkgcHJpdmF0ZVxuICBhdHRhY2hTbmlwcGV0OiAoc25pcHBldCwgcG9zaXRpb24gPSB7fSkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEBsaW5rKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuYXR0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBFdmVyeSBzbmlwcGV0IHRoYXQgaXMgcmVtb3ZlZCBtdXN0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgU25pcHBldHMgdGhhdCBhcmUgbW92ZWQgaW5zaWRlIGEgc25pcHBldFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaFNuaXBwZXQgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBmaXJlXG4gICMgU25pcHBldFJlbW92ZWQgZXZlbnRzIG9uIHRoZSBzbmlwcGV0IHRyZWUsIGluIHRoZXNlXG4gICMgY2FzZXMgdW5saW5rIGNhbiBiZSB1c2VkXG4gICMgQGFwaSBwcml2YXRlXG4gIF9kZXRhY2hTbmlwcGV0OiAoc25pcHBldCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoc25pcHBldClcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmRldGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChzbmlwcGV0LCBwb3NpdGlvbikgLT5cbiAgICBAdW5saW5rKHNuaXBwZXQpIGlmIHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgdW5saW5rOiAoc25pcHBldCkgLT5cbiAgICBjb250YWluZXIgPSBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuICAgIGlmIGNvbnRhaW5lclxuXG4gICAgICAjIHVwZGF0ZSBwYXJlbnRDb250YWluZXIgbGlua3NcbiAgICAgIGNvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQubmV4dCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gc25pcHBldC5wcmV2aW91cyB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG4gICAgICAjIHVwZGF0ZSBwcmV2aW91cyBhbmQgbmV4dCBub2Rlc1xuICAgICAgc25pcHBldC5uZXh0Py5wcmV2aW91cyA9IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIHNuaXBwZXQucHJldmlvdXM/Lm5leHQgPSBzbmlwcGV0Lm5leHRcblxuICAgICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCB7fSlcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHNldFNuaXBwZXRQb3NpdGlvbjogKHNuaXBwZXQsIHsgcGFyZW50Q29udGFpbmVyLCBwcmV2aW91cywgbmV4dCB9KSAtPlxuICAgIHNuaXBwZXQucGFyZW50Q29udGFpbmVyID0gcGFyZW50Q29udGFpbmVyXG4gICAgc25pcHBldC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgc25pcHBldC5uZXh0ID0gbmV4dFxuXG4gICAgaWYgcGFyZW50Q29udGFpbmVyXG4gICAgICBwcmV2aW91cy5uZXh0ID0gc25pcHBldCBpZiBwcmV2aW91c1xuICAgICAgbmV4dC5wcmV2aW91cyA9IHNuaXBwZXQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIHBhcmVudENvbnRhaW5lci5sYXN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbkVkaXRhYmxlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9lZGl0YWJsZV9kaXJlY3RpdmUnKVxuSW1hZ2VEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2ltYWdlX2RpcmVjdGl2ZScpXG5IdG1sRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9odG1sX2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBjcmVhdGU6ICh7IHNuaXBwZXQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pIC0+XG4gICAgRGlyZWN0aXZlID0gQGdldERpcmVjdGl2ZUNvbnN0cnVjdG9yKHRlbXBsYXRlRGlyZWN0aXZlLnR5cGUpXG4gICAgbmV3IERpcmVjdGl2ZSh7IHNuaXBwZXQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pXG5cblxuICBnZXREaXJlY3RpdmVDb25zdHJ1Y3RvcjogKGRpcmVjdGl2ZVR5cGUpIC0+XG4gICAgc3dpdGNoIGRpcmVjdGl2ZVR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICBFZGl0YWJsZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaW1hZ2UnXG4gICAgICAgIEltYWdlRGlyZWN0aXZlXG4gICAgICB3aGVuICdodG1sJ1xuICAgICAgICBIdG1sRGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIGFzc2VydCBmYWxzZSwgXCJVbnN1cHBvcnRlZCBzbmlwcGV0IGRpcmVjdGl2ZTogI3sgZGlyZWN0aXZlVHlwZSB9XCJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kaXJlY3RpdmVGYWN0b3J5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2RpcmVjdGl2ZV9mYWN0b3J5JylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5cbiMgU25pcHBldE1vZGVsXG4jIC0tLS0tLS0tLS0tLVxuIyBFYWNoIFNuaXBwZXRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBzbmlwcGV0Vmlld1xuIyBmcm9tIGEgc25pcHBldE1vZGVsXG4jXG4jIFJlcHJlc2VudHMgYSBub2RlIGluIGEgU25pcHBldFRyZWUuXG4jIEV2ZXJ5IFNuaXBwZXRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoU25pcHBldENvbnRhaW5lciksXG4jIHNpYmxpbmdzIChvdGhlciBzbmlwcGV0cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKFNuaXBwZXRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBTbmlwcGV0TW9kZWxzLlxuIyBFLmcuIGEgZ3JpZCByb3cgd291bGQgaGF2ZSBhcyBtYW55IGNvbnRhaW5lcnMgYXMgaXQgaGFzXG4jIGNvbHVtbnNcbiNcbiMgIyBAcHJvcCBwYXJlbnRDb250YWluZXI6IHBhcmVudCBTbmlwcGV0Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIHNuaXBwZXQgd2l0aG91dCB0ZW1wbGF0ZSByZWZlcmVuY2UnXG5cbiAgICBAaW5pdGlhbGl6ZURpcmVjdGl2ZXMoKVxuICAgIEBzdHlsZXMgPSB7fVxuICAgIEBkYXRhVmFsdWVzID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBTbmlwcGV0Q29udGFpbmVyXG4gICAgICAgICAgICBuYW1lOiBkaXJlY3RpdmUubmFtZVxuICAgICAgICAgICAgcGFyZW50U25pcHBldDogdGhpc1xuICAgICAgICB3aGVuICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgICAgICAgIEBjcmVhdGVTbmlwcGV0RGlyZWN0aXZlKGRpcmVjdGl2ZSlcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gICMgQ3JlYXRlIGEgZGlyZWN0aXZlIGZvciAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCcgdGVtcGxhdGUgZGlyZWN0aXZlc1xuICBjcmVhdGVTbmlwcGV0RGlyZWN0aXZlOiAodGVtcGxhdGVEaXJlY3RpdmUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuYWRkIGRpcmVjdGl2ZUZhY3RvcnkuY3JlYXRlXG4gICAgICBzbmlwcGV0OiB0aGlzXG4gICAgICB0ZW1wbGF0ZURpcmVjdGl2ZTogdGVtcGxhdGVEaXJlY3RpdmVcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICAjIFNuaXBwZXRUcmVlIG9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGJlZm9yZSB0aGlzIG9uZVxuICBiZWZvcmU6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQHByZXZpb3VzXG5cblxuICAjIEluc2VydCBhIHNuaXBwZXQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEFmdGVyKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBzbmlwcGV0IHRvIGEgY29udGFpbmVyIG9mIHRoaXMgc25pcHBldFxuICBhcHBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5hcHBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgUHJlcGVuZCBhIHNuaXBwZXQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBzbmlwcGV0XG4gIHByZXBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBzbmlwcGV0IHVwIChwcmV2aW91cylcbiAgdXA6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci51cCh0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIHNuaXBwZXQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIHNuaXBwZXQgZnJvbSBpdHMgY29udGFpbmVyIGFuZCBTbmlwcGV0VHJlZVxuICByZW1vdmU6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5yZW1vdmUodGhpcylcblxuXG4gICMgU25pcHBldFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIHNuaXBwZXQgdHJlZSByZWxhdGl2ZSB0byB0aGlzIHNuaXBwZXQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRTbmlwcGV0XG5cblxuICBwYXJlbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldE1vZGVsID0gdGhpc1xuICAgIHdoaWxlIChzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwuZ2V0UGFyZW50KCkpXG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG5cblxuICBjaGlsZHJlbjogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyAoaW5jbHVkaW5nIHRob3NlIG9mIHRoaXMgc25pcHBldE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGxEZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbCkgaWYgc25pcHBldE1vZGVsICE9IHRoaXNcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICBjaGlsZHJlbkFuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBjaGlsZHJlbihjYWxsYmFjaylcblxuXG4gICMgRGlyZWN0aXZlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgRXhhbXBsZSBob3cgdG8gZ2V0IGFuIEltYWdlRGlyZWN0aXZlOlxuICAjIGltYWdlRGlyZWN0aXZlID0gc25pcHBldE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBzbmlwcGV0XG4gIHNldENvbnRlbnQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIGlmIEBjb250ZW50W25hbWVdXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcbiAgICBlbHNlXG4gICAgICBpZiBub3QgZGVlcEVxdWFsKEBjb250ZW50W25hbWVdLCB2YWx1ZSlcbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwic2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBpZiBkaXJlY3RpdmUuaXNJbWFnZVxuICAgICAgaWYgZGlyZWN0aXZlLmdldEltYWdlVXJsKCkgIT0gdmFsdWVcbiAgICAgICAgZGlyZWN0aXZlLnNldEltYWdlVXJsKHZhbHVlKVxuICAgICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgc25pcHBldE1vZGVsLlxuXG5cbiAgIyBjYW4gYmUgY2FsbGVkIHdpdGggYSBzdHJpbmcgb3IgYSBoYXNoXG4gIGRhdGE6IChhcmcpIC0+XG4gICAgaWYgdHlwZW9mKGFyZykgPT0gJ29iamVjdCdcbiAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgYXJnXG4gICAgICAgIGlmIEBjaGFuZ2VEYXRhKG5hbWUsIHZhbHVlKVxuICAgICAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcy5wdXNoKG5hbWUpXG4gICAgICBpZiBAc25pcHBldFRyZWUgJiYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQHNuaXBwZXRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICAjIFN0eWxlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0U3R5bGU6IChuYW1lKSAtPlxuICAgIEBzdHlsZXNbbmFtZV1cblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2UgaWYgbm90IHN0eWxlLnZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBsb2cud2FybiBcIkludmFsaWQgdmFsdWUgJyN7IHZhbHVlIH0nIGZvciBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQHNuaXBwZXRUcmVlXG4gICAgICAgICAgQHNuaXBwZXRUcmVlLmh0bWxDaGFuZ2luZyh0aGlzLCAnc3R5bGUnLCB7IG5hbWUsIHZhbHVlIH0pXG5cblxuICAjIEBkZXByZWNhdGVkXG4gICMgR2V0dGVyIGFuZCBTZXR0ZXIgaW4gb25lLlxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGNvbnNvbGUubG9nKFwiU25pcHBldE1vZGVsI3N0eWxlKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAjZ2V0U3R5bGUoKSBhbmQgI3NldFN0eWxlKCkuXCIpXG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgIyBTbmlwcGV0TW9kZWwgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIlNuaXBwZXRNb2RlbCNjb3B5KCkgaXMgbm90IGltcGxlbWVudGVkIHlldC5cIilcblxuICAgICMgc2VyaWFsaXppbmcvZGVzZXJpYWxpemluZyBzaG91bGQgd29yayBidXQgbmVlZHMgdG8gZ2V0IHNvbWUgdGVzdHMgZmlyc3RcbiAgICAjIGpzb24gPSBAdG9Kc29uKClcbiAgICAjIGpzb24uaWQgPSBndWlkLm5leHQoKVxuICAgICMgU25pcHBldE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWwnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIFB1YmxpYyBNZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS1cblxuICAjIFNlcmlhbGl6ZSBhIFNuaXBwZXRNb2RlbFxuICAjXG4gICMgRXh0ZW5kcyB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRNb2RlbFxuICAjXG4gICMgRXhhbXBsZSBSZXN1bHQ6XG4gICMgaWQ6ICdha2s3aGp1dWUyJ1xuICAjIGlkZW50aWZpZXI6ICd0aW1lbGluZS50aXRsZSdcbiAgIyBjb250ZW50OiB7IC4uLiB9XG4gICMgc3R5bGVzOiB7IC4uLiB9XG4gICMgZGF0YTogeyAuLi4gfVxuICAjIGNvbnRhaW5lcnM6IHsgLi4uIH1cbiAgU25pcHBldE1vZGVsOjp0b0pzb24gPSAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID89IHRoaXNcblxuICAgIGpzb24gPVxuICAgICAgaWQ6IHNuaXBwZXQuaWRcbiAgICAgIGlkZW50aWZpZXI6IHNuaXBwZXQuaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShzbmlwcGV0LmNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KHNuaXBwZXQuY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoc25pcHBldC5zdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoc25pcHBldC5zdHlsZXMpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KHNuaXBwZXQuZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzbmlwcGV0LmRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cbiAgZnJvbUpzb246IChqc29uLCBkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uY29tcG9uZW50IHx8IGpzb24uaWRlbnRpZmllcilcblxuICAgIGFzc2VydCB0ZW1wbGF0ZSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcblxuICAgICAgIyBUcmFuc2Zvcm0gc3RyaW5nIGludG8gb2JqZWN0OiBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igb2xkIGltYWdlIHZhbHVlcy5cbiAgICAgIGlmIG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLnR5cGUgPT0gJ2ltYWdlJyAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9XG4gICAgICAgICAgdXJsOiB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICAgIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgICBtb2RlbC5zZXRTdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gICAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gICAgZm9yIGNvbnRhaW5lck5hbWUsIHNuaXBwZXRBcnJheSBvZiBqc29uLmNvbnRhaW5lcnNcbiAgICAgIGFzc2VydCBtb2RlbC5jb250YWluZXJzLmhhc093blByb3BlcnR5KGNvbnRhaW5lck5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgICAgaWYgc25pcHBldEFycmF5XG4gICAgICAgIGFzc2VydCAkLmlzQXJyYXkoc25pcHBldEFycmF5KSxcbiAgICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgICBmb3IgY2hpbGQgaW4gc25pcHBldEFycmF5XG4gICAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBAZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gICAgbW9kZWxcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5TbmlwcGV0QXJyYXkgPSByZXF1aXJlKCcuL3NuaXBwZXRfYXJyYXknKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcbnNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWxfc2VyaWFsaXplcicpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBTbmlwcGV0VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgIyBJbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICBnZXRTbmlwcGV0OiAoc25pcHBldE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXROYW1lID09ICdzdHJpbmcnXG4gICAgICBAY3JlYXRlTW9kZWwoc25pcHBldE5hbWUpXG4gICAgZWxzZVxuICAgICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6IC0+XG4gICAgQGNyZWF0ZU1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuXG4gIGdldFRlbXBsYXRlOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBkZXNpZ24uZ2V0KGlkZW50aWZpZXIpXG4gICAgYXNzZXJ0IHRlbXBsYXRlLCBcIkNvdWxkIG5vdCBmaW5kIHRlbXBsYXRlICN7IGlkZW50aWZpZXIgfVwiXG4gICAgdGVtcGxhdGVcblxuXG4gIGluaXRpYWxpemVFdmVudHM6ICgpIC0+XG5cbiAgICAjIGxheW91dCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRNb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgICMgY29udGVudCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0U2V0dGluZ3NDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgR2V0IHRoZSBmaXJzdCBzbmlwcGV0XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgICAgaWYgc25pcHBldC5pZGVudGlmaWVyID09IHNlYXJjaCB8fCBzbmlwcGV0LnRlbXBsYXRlLmlkID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKHNuaXBwZXQpXG5cbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkocmVzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgIG9sZFJvb3RcblxuXG4gICMgZWFjaFdpdGhQYXJlbnRzOiAoc25pcHBldCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goc25pcHBldClcbiAgIyAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAjICAgICBzbmlwcGV0ID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICMgICAgIHdoaWxlIChzbmlwcGV0KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoc25pcHBldCwgcGFyZW50cylcbiAgIyAgICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdTbmlwcGV0VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIHRlbXBsYXRlID0gc25pcHBldC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUudGl0bGUgfSAoI3sgdGVtcGxhdGUuaWRlbnRpZmllciB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGFkZExpbmUoXCIjeyBuYW1lIH06XCIsIGluZGVudGF0aW9uICsgMilcbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBpbmRlbnRhdGlvbikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIHNuaXBwZXRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBzbmlwcGV0Q29udGFpbmVyc1xuXG4gIGF0dGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBhdHRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBzbmlwcGV0XG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0TW92ZWQnLCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWU/XG4gICAgICAgICMgcmVtb3ZlIGZyb20gb3RoZXIgc25pcHBldCB0cmVlXG4gICAgICAgIHNuaXBwZXQuc25pcHBldENvbnRhaW5lci5kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LnNuaXBwZXRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0QWRkZWQnLCBzbmlwcGV0KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBkZXRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBhc3NlcnQgc25pcHBldC5zbmlwcGV0VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgc25pcHBldCBmcm9tIGFub3RoZXIgU25pcHBldFRyZWUnXG5cbiAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoU25pcHBldEZ1bmMoKVxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRSZW1vdmVkJywgc25pcHBldClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldENvbnRlbnRDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGh0bWxDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldEh0bWxDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGRhdGFDaGFuZ2luZzogKHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXREYXRhQ2hhbmdlZCcsIHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lIH1cblxuICAgIHNuaXBwZXRUb0RhdGEgPSAoc25pcHBldCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0LnRvSnNvbigpXG4gICAgICBjb250YWluZXJBcnJheS5wdXNoIHNuaXBwZXREYXRhXG4gICAgICBzbmlwcGV0RGF0YVxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0VG9EYXRhKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBzbmlwcGV0RGF0YS5jb250YWluZXJzW3NuaXBwZXRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIHNuaXBwZXRUcmVlXG4gICMgVGhpcyBtZXRob2Qgc3VwcHJlc3NlcyBjaGFuZ2UgZXZlbnRzIGluIHRoZSBzbmlwcGV0VHJlZS5cbiAgI1xuICAjIENvbnNpZGVyIHRvIGNoYW5nZSBwYXJhbXM6XG4gICMgZnJvbURhdGEoeyBjb250ZW50LCBkZXNpZ24sIHNpbGVudCB9KSAjIHNpbGVudCBbYm9vbGVhbl06IHN1cHByZXNzIGNoYW5nZSBldmVudHNcbiAgZnJvbURhdGE6IChkYXRhLCBkZXNpZ24sIHNpbGVudD10cnVlKSAtPlxuICAgIGlmIGRlc2lnbj9cbiAgICAgIGFzc2VydCBub3QgQGRlc2lnbj8gfHwgZGVzaWduLmVxdWFscyhAZGVzaWduKSwgJ0Vycm9yIGxvYWRpbmcgZGF0YS4gU3BlY2lmaWVkIGRlc2lnbiBpcyBkaWZmZXJlbnQgZnJvbSBjdXJyZW50IHNuaXBwZXRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBpZiBkYXRhLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IHNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIuZnJvbUpzb24oc25pcHBldERhdGEsIGRlc2lnbilcbiAgICAgICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgICAgQHJvb3QuZWFjaCAoc25pcHBldCkgPT5cbiAgICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuXG4gICMgQXBwZW5kIGRhdGEgdG8gdGhpcyBzbmlwcGV0VHJlZVxuICAjIEZpcmVzIHNuaXBwZXRBZGRlZCBldmVudCBmb3IgZXZlcnkgc25pcHBldFxuICBhZGREYXRhOiAoZGF0YSwgZGVzaWduKSAtPlxuICAgIEBmcm9tRGF0YShkYXRhLCBkZXNpZ24sIGZhbHNlKVxuXG5cbiAgYWRkRGF0YVdpdGhBbmltYXRpb246IChkYXRhLCBkZWxheT0yMDApIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCAnRXJyb3IgYWRkaW5nIGRhdGEuIFNuaXBwZXRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgIGRvID0+XG4gICAgICAgIGNvbnRlbnQgPSBzbmlwcGV0RGF0YVxuICAgICAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgc25pcHBldCA9IHNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIuZnJvbUpzb24oY29udGVudCwgQGRlc2lnbilcbiAgICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcbiAgICAgICAgLCB0aW1lb3V0XG5cbiAgICAgIHRpbWVvdXQgKz0gTnVtYmVyKGRlbGF5KVxuXG5cbiAgdG9EYXRhOiAtPlxuICAgIEBzZXJpYWxpemUoKVxuXG5cbiAgIyBBbGlhc2VzXG4gICMgLS0tLS0tLVxuXG4gIGZyb21Kc29uOiAoYXJncy4uLikgLT5cbiAgICBAZnJvbURhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHRvSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQHRvRGF0YS5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBSZXR1cm4gdGhlIG5vZGVOYW1lIGluIGxvd2VyIGNhc2VcbiAgZ2V0VGFnTmFtZTogLT5cbiAgICBAZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZCBmcm9tIHRoZVxuICAjIHRlbXBsYXRlIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXdcbiAgY2xvbmU6IC0+XG4gICAgbmV3RGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZShuYW1lOiBAbmFtZSwgdHlwZTogQHR5cGUpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQGVsZW0pXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuICAgIGRpcmVjdGl2ZVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cbiAgICB0aGlzW2RpcmVjdGl2ZS5pbmRleCArPSAxXVxuXG5cbiAgbmV4dE9mVHlwZTogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIG5hbWVzOiAodHlwZSkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgZGlyZWN0aXZlLm5hbWVcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGVhY2hPZlR5cGU6ICh0eXBlLCBjYWxsYmFjaykgLT5cbiAgICBpZiB0aGlzW3R5cGVdXG4gICAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNbdHlwZV1cbiAgICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaEVkaXRhYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2VkaXRhYmxlJywgY2FsbGJhY2spXG5cblxuICBlYWNoSW1hZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnaW1hZ2UnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnY29udGFpbmVyJywgY2FsbGJhY2spXG5cblxuICBlYWNoSHRtbDogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdodG1sJywgY2FsbGJhY2spXG5cblxuICBjbG9uZTogLT5cbiAgICBuZXdDb2xsZWN0aW9uID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICBuZXdDb2xsZWN0aW9uLmFkZChkaXJlY3RpdmUuY2xvbmUoKSlcblxuICAgIG5ld0NvbGxlY3Rpb25cblxuXG4gICMgaGVscGVyIHRvIGRpcmVjdGx5IGdldCBlbGVtZW50IHdyYXBwZWQgaW4gYSBqUXVlcnkgb2JqZWN0XG4gICMgdG9kbzogcmVuYW1lIG9yIGJldHRlciByZW1vdmVcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgcGFyc2U6IChlbGVtKSAtPlxuICAgIGVsZW1EaXJlY3RpdmUgPSB1bmRlZmluZWRcbiAgICBtb2RpZmljYXRpb25zID0gW11cbiAgICBAcGFyc2VEaXJlY3RpdmVzIGVsZW0sIChkaXJlY3RpdmUpIC0+XG4gICAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgICAgZWxlbURpcmVjdGl2ZSA9IGRpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RpZmljYXRpb25zLnB1c2goZGlyZWN0aXZlKVxuXG4gICAgQGFwcGx5TW9kaWZpY2F0aW9ucyhlbGVtRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSBpZiBlbGVtRGlyZWN0aXZlXG4gICAgcmV0dXJuIGVsZW1EaXJlY3RpdmVcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGVsZW0sIGZ1bmMpIC0+XG4gICAgZGlyZWN0aXZlRGF0YSA9IFtdXG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0ci5uYW1lXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHJpYnV0ZU5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZURhdGEucHVzaFxuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWVcbiAgICAgICAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVcbiAgICAgICAgICAgIG5hbWU6IGF0dHIudmFsdWVcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgICAgIGVsZW06IGVsZW1cblxuICAgICMgU2luY2Ugd2UgbW9kaWZ5IHRoZSBhdHRyaWJ1dGVzIHdlIGhhdmUgdG8gc3BsaXRcbiAgICAjIHRoaXMgaW50byB0d28gbG9vcHNcbiAgICBmb3IgZGF0YSBpbiBkaXJlY3RpdmVEYXRhXG4gICAgICBkaXJlY3RpdmUgPSBkYXRhLmRpcmVjdGl2ZVxuICAgICAgQHJld3JpdGVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBkYXRhLmF0dHJpYnV0ZU5hbWUpXG4gICAgICBmdW5jKGRpcmVjdGl2ZSlcblxuXG4gIGFwcGx5TW9kaWZpY2F0aW9uczogKG1haW5EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBtb2RpZmljYXRpb25zXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnb3B0aW9uYWwnXG4gICAgICAgICAgbWFpbkRpcmVjdGl2ZS5vcHRpb25hbCA9IHRydWVcblxuXG4gICMgTm9ybWFsaXplIG9yIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICMgZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgcmV3cml0ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgIGlmIGF0dHJpYnV0ZU5hbWUgIT0gZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgZWxzZSBpZiBub3QgZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUpXG4gICAgZWxzZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG5cblxuICAjIGZvcmNlIGF0dHJpYnV0ZSBzdHlsZSBhcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICMgZS5nLiBhdHRyaWJ1dGUgJ2RvYy1jb250YWluZXInIGJlY29tZXMgJ2RhdGEtZG9jLWNvbnRhaW5lcidcbiAgbm9ybWFsaXplQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGVsZW0gPSBkaXJlY3RpdmUuZWxlbVxuICAgIGlmIGF0dHJpYnV0ZU5hbWVcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgIGVsZW0uc2V0QXR0cmlidXRlKGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKSwgZGlyZWN0aXZlLm5hbWUpXG5cblxuICByZW1vdmVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZGlyZWN0aXZlLmVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG5zb3J0QnlOYW1lID0gKGEsIGIpIC0+XG4gIGlmIChhLm5hbWUgPiBiLm5hbWUpXG4gICAgMVxuICBlbHNlIGlmIChhLm5hbWUgPCBiLm5hbWUpXG4gICAgLTFcbiAgZWxzZVxuICAgIDBcblxuIyBUZW1wbGF0ZVxuIyAtLS0tLS0tLVxuIyBQYXJzZXMgc25pcHBldCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgU25pcHBldE1vZGVscyBhbmQgU25pcHBldFZpZXdzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZW1wbGF0ZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGh0bWwsIEBuYW1lc3BhY2UsIEBpZCwgaWRlbnRpZmllciwgdGl0bGUsIHByb3BlcnRpZXMgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBwcm9wZXJ0aWVzIHx8IHt9XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gIHNldERlc2lnbjogKGRlc2lnbikgLT5cbiAgICBAZGVzaWduID0gZGVzaWduXG4gICAgQG5hbWVzcGFjZSA9IGRlc2lnbi5uYW1lXG4gICAgQGlkZW50aWZpZXIgPSBcIiN7IEBuYW1lc3BhY2UgfS4jeyBAaWQgfVwiXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBTbmlwcGV0TW9kZWwgaW5zdGFuY2UgZnJvbSB0aGlzIHRlbXBsYXRlXG4gIGNyZWF0ZU1vZGVsOiAoKSAtPlxuICAgIG5ldyBTbmlwcGV0TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoc25pcHBldE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIHNuaXBwZXRNb2RlbCB8fD0gQGNyZWF0ZU1vZGVsKClcbiAgICAkZWxlbSA9IEAkdGVtcGxhdGUuY2xvbmUoKVxuICAgIGRpcmVjdGl2ZXMgPSBAbGlua0RpcmVjdGl2ZXMoJGVsZW1bMF0pXG5cbiAgICBzbmlwcGV0VmlldyA9IG5ldyBTbmlwcGV0Vmlld1xuICAgICAgbW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgJGh0bWw6ICRlbGVtXG4gICAgICBkaXJlY3RpdmVzOiBkaXJlY3RpdmVzXG4gICAgICBpc1JlYWRPbmx5OiBpc1JlYWRPbmx5XG5cblxuICBwcnVuZUh0bWw6IChodG1sKSAtPlxuXG4gICAgIyByZW1vdmUgYWxsIGNvbW1lbnRzXG4gICAgaHRtbCA9ICQoaHRtbCkuZmlsdGVyIChpbmRleCkgLT5cbiAgICAgIEBub2RlVHlwZSAhPThcblxuICAgICMgb25seSBhbGxvdyBvbmUgcm9vdCBlbGVtZW50XG4gICAgYXNzZXJ0IGh0bWwubGVuZ3RoID09IDEsIFwiVGVtcGxhdGVzIG11c3QgY29udGFpbiBvbmUgcm9vdCBlbGVtZW50LiBUaGUgVGVtcGxhdGUgXFxcIiN7QGlkZW50aWZpZXJ9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgc25pcHBldERpcmVjdGl2ZXMgPSBAZGlyZWN0aXZlcy5jbG9uZSgpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlRmluZGVyLmxpbmsoZWxlbSwgc25pcHBldERpcmVjdGl2ZXMpXG5cbiAgICBzbmlwcGV0RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZWRpdGFibGUpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGlmIGRlZmF1bHRWYWx1ZSB0aGVuIGRlZmF1bHRWYWx1ZSBlbHNlICcnXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0Q29udGFpbmVyOiAobmFtZSwgZWxlbSkgLT5cbiAgICAjIHJlbW92ZSBhbGwgY29udGVudCBmcm9uIGEgY29udGFpbmVyIGZyb20gdGhlIHRlbXBsYXRlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0SHRtbDogKG5hbWUsIGVsZW0pIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgIyBSZXR1cm4gYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGludGVyZmFjZSBvZiB0aGlzIHRlbXBsYXRlXG4gICMgQHJldHVybnMgeyBPYmplY3QgfSBBbiBvYmplY3Qgd2ljaCBjb250YWlucyB0aGUgaW50ZXJmYWNlIGRlc2NyaXB0aW9uXG4gICMgICBvZiB0aGlzIHRlbXBsYXRlLiBUaGlzIG9iamVjdCB3aWxsIGJlIHRoZSBzYW1lIGlmIHRoZSBpbnRlcmZhY2UgZG9lc1xuICAjICAgbm90IGNoYW5nZSBzaW5jZSBkaXJlY3RpdmVzIGFuZCBwcm9wZXJ0aWVzIGFyZSBzb3J0ZWQuXG4gIGluZm86ICgpIC0+XG4gICAgZG9jID1cbiAgICAgIG5hbWU6IEBpZFxuICAgICAgZGVzaWduOiBAbmFtZXNwYWNlXG4gICAgICBkaXJlY3RpdmVzOiBbXVxuICAgICAgcHJvcGVydGllczogW11cblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHsgbmFtZSwgdHlwZSB9ID0gZGlyZWN0aXZlXG4gICAgICBkb2MuZGlyZWN0aXZlcy5wdXNoKHsgbmFtZSwgdHlwZSB9KVxuXG5cbiAgICBmb3IgbmFtZSwgc3R5bGUgb2YgQHN0eWxlc1xuICAgICAgZG9jLnByb3BlcnRpZXMucHVzaCh7IG5hbWUsIHR5cGU6ICdjc3NNb2RpZmljYXRvcicgfSlcblxuICAgIGRvYy5kaXJlY3RpdmVzLnNvcnQoc29ydEJ5TmFtZSlcbiAgICBkb2MucHJvcGVydGllcy5zb3J0KHNvcnRCeU5hbWUpXG4gICAgZG9jXG5cblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBuYW1lc3BhY2U6IHVuZGVmaW5lZCwgaWQ6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgbmFtZXNwYWNlOiBwYXJ0c1swXSwgaWQ6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBzbmlwcGV0IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIl19
