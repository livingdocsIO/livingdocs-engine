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
var Design, Document, EditorPage, SnippetTree, assert, augmentConfig, config, designCache, doc;

assert = require('./modules/logging/assert');

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Document = require('./document');

SnippetTree = require('./snippet_tree/snippet_tree');

Design = require('./design/design');

designCache = require('./design/design_cache');

EditorPage = require('./rendering_container/editor_page');

module.exports = doc = (function() {
  var editorPage;
  editorPage = new EditorPage();
  return {
    "new": function(_arg) {
      var data, design, designName, snippetTree, _ref;
      data = _arg.data, design = _arg.design;
      snippetTree = data != null ? (designName = (_ref = data.design) != null ? _ref.name : void 0, assert(designName != null, 'Error creating document: No design is specified.'), design = this.design.get(designName), new SnippetTree({
        content: data,
        design: design
      })) : (designName = design, design = this.design.get(designName), new SnippetTree({
        design: design
      }));
      return this.create(snippetTree);
    },
    create: function(snippetTree) {
      return new Document({
        snippetTree: snippetTree
      });
    },
    design: designCache,
    startDrag: $.proxy(editorPage, 'startDrag'),
    config: function(userConfig) {
      $.extend(true, config, userConfig);
      return augmentConfig(config);
    }
  };
})();

window.doc = doc;


},{"./configuration/augment_config":6,"./configuration/config":7,"./design/design":8,"./design/design_cache":9,"./document":11,"./modules/logging/assert":21,"./rendering_container/editor_page":33,"./snippet_tree/snippet_tree":40}],6:[function(require,module,exports){
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
var Design, DesignStyle, Template, assert, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Template = require('../template/template');

DesignStyle = require('./design_style');

module.exports = Design = (function() {
  function Design(design) {
    var config, groups, templates;
    templates = design.templates || design.snippets;
    config = design.config;
    groups = design.config.groups || design.groups;
    this.namespace = (config != null ? config.namespace : void 0) || 'livingdocs-templates';
    this.paragraphSnippet = (config != null ? config.paragraph : void 0) || 'text';
    this.css = config.css;
    this.js = config.js;
    this.fonts = config.fonts;
    this.templates = [];
    this.groups = {};
    this.styles = {};
    this.storeTemplateDefinitions(templates);
    this.globalStyles = this.createDesignStyleCollection(design.config.styles);
    this.addGroups(groups);
    this.addTemplatesNotInGroups();
  }

  Design.prototype.equals = function(design) {
    return design.namespace === this.namespace;
  };

  Design.prototype.storeTemplateDefinitions = function(templates) {
    var template, _i, _len, _results;
    this.templateDefinitions = {};
    _results = [];
    for (_i = 0, _len = templates.length; _i < _len; _i++) {
      template = templates[_i];
      _results.push(this.templateDefinitions[template.id] = template);
    }
    return _results;
  };

  Design.prototype.add = function(templateDefinition, styles) {
    var template, templateOnlyStyles, templateStyles;
    this.templateDefinitions[templateDefinition.id] = void 0;
    templateOnlyStyles = this.createDesignStyleCollection(templateDefinition.styles);
    templateStyles = $.extend({}, styles, templateOnlyStyles);
    template = new Template({
      namespace: this.namespace,
      id: templateDefinition.id,
      title: templateDefinition.title,
      styles: templateStyles,
      html: templateDefinition.html,
      weight: templateDefinition.weight || 0
    });
    this.templates.push(template);
    return template;
  };

  Design.prototype.addGroups = function(collection) {
    var group, groupName, groupOnlyStyles, groupStyles, template, templateDefinition, templateId, templates, _i, _len, _ref, _results;
    _results = [];
    for (groupName in collection) {
      group = collection[groupName];
      groupOnlyStyles = this.createDesignStyleCollection(group.styles);
      groupStyles = $.extend({}, this.globalStyles, groupOnlyStyles);
      templates = {};
      _ref = group.templates;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        templateId = _ref[_i];
        templateDefinition = this.templateDefinitions[templateId];
        if (templateDefinition) {
          template = this.add(templateDefinition, groupStyles);
          templates[template.id] = template;
        } else {
          log.warn("The template '" + templateId + "' referenced in the group '" + groupName + "' does not exist.");
        }
      }
      _results.push(this.addGroup(groupName, group, templates));
    }
    return _results;
  };

  Design.prototype.addTemplatesNotInGroups = function(globalStyles) {
    var templateDefinition, templateId, _ref, _results;
    _ref = this.templateDefinitions;
    _results = [];
    for (templateId in _ref) {
      templateDefinition = _ref[templateId];
      if (templateDefinition) {
        _results.push(this.add(templateDefinition, this.globalStyles));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Design.prototype.addGroup = function(name, group, templates) {
    return this.groups[name] = {
      title: group.title,
      templates: templates
    };
  };

  Design.prototype.createDesignStyleCollection = function(styles) {
    var designStyle, designStyles, styleDefinition, _i, _len;
    designStyles = {};
    if (styles) {
      for (_i = 0, _len = styles.length; _i < _len; _i++) {
        styleDefinition = styles[_i];
        designStyle = this.createDesignStyle(styleDefinition);
        if (designStyle) {
          designStyles[designStyle.name] = designStyle;
        }
      }
    }
    return designStyles;
  };

  Design.prototype.createDesignStyle = function(styleDefinition) {
    if (styleDefinition && styleDefinition.name) {
      return new DesignStyle({
        name: styleDefinition.name,
        type: styleDefinition.type,
        options: styleDefinition.options,
        value: styleDefinition.value
      });
    }
  };

  Design.prototype.remove = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        return _this.templates.splice(_this.getIndex(id), 1);
      };
    })(this));
  };

  Design.prototype.get = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        var template;
        template = void 0;
        _this.each(function(t, index) {
          if (t.id === id) {
            return template = t;
          }
        });
        return template;
      };
    })(this));
  };

  Design.prototype.getIndex = function(identifier) {
    return this.checkNamespace(identifier, (function(_this) {
      return function(id) {
        var index;
        index = void 0;
        _this.each(function(t, i) {
          if (t.id === id) {
            return index = i;
          }
        });
        return index;
      };
    })(this));
  };

  Design.prototype.checkNamespace = function(identifier, callback) {
    var id, namespace, _ref;
    _ref = Template.parseIdentifier(identifier), namespace = _ref.namespace, id = _ref.id;
    assert(!namespace || this.namespace === namespace, "design " + this.namespace + ": cannot get template with different namespace " + namespace + " ");
    return callback(id);
  };

  Design.prototype.each = function(callback) {
    var index, template, _i, _len, _ref, _results;
    _ref = this.templates;
    _results = [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      template = _ref[index];
      _results.push(callback(template, index));
    }
    return _results;
  };

  Design.prototype.list = function() {
    var templates;
    templates = [];
    this.each(function(template) {
      return templates.push(template.identifier);
    });
    return templates;
  };

  Design.prototype.info = function(identifier) {
    var template;
    template = this.get(identifier);
    return template.printDoc();
  };

  return Design;

})();


},{"../modules/logging/assert":21,"../modules/logging/log":22,"../template/template":46,"./design_style":10}],9:[function(require,module,exports){
var Design, assert;

assert = require('../modules/logging/assert');

Design = require('./design');

module.exports = (function() {
  return {
    designs: {},
    load: function(designSpec) {
      var design, name, _ref;
      if (typeof designSpec === 'string') {
        return assert(false, 'Load design by name is not implemented yet.');
      } else {
        name = (_ref = designSpec.config) != null ? _ref.namespace : void 0;
        if ((name == null) || this.has(name)) {
          return;
        }
        design = new Design(designSpec);
        return this.add(design);
      }
    },
    add: function(design) {
      var name;
      name = design.namespace;
      return this.designs[name] = design;
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


},{"../modules/logging/assert":21,"./design":8}],10:[function(require,module,exports){
var DesignStyle, assert, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

module.exports = DesignStyle = (function() {
  function DesignStyle(_arg) {
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

  DesignStyle.prototype.cssClassChanges = function(value) {
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

  DesignStyle.prototype.validateValue = function(value) {
    if (!value) {
      return true;
    } else if (this.type === 'option') {
      return value === this.value;
    } else if (this.type === 'select') {
      return this.containsOption(value);
    } else {
      return log.warn("Not implemented: DesignStyle#validateValue() for type " + this.type);
    }
  };

  DesignStyle.prototype.containsOption = function(value) {
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

  DesignStyle.prototype.otherOptions = function(value) {
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

  DesignStyle.prototype.otherClasses = function(value) {
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

  return DesignStyle;

})();


},{"../modules/logging/assert":21,"../modules/logging/log":22}],11:[function(require,module,exports){
var Document, EventEmitter, InteractivePage, Page, Renderer, RenderingContainer, View, assert, config, dom,
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

module.exports = Document = (function(_super) {
  __extends(Document, _super);

  function Document(_arg) {
    var snippetTree;
    snippetTree = _arg.snippetTree;
    this.design = snippetTree.design;
    this.setSnippetTree(snippetTree);
    this.views = {};
    this.interactiveView = void 0;
  }

  Document.prototype.getDropTarget = function(_arg) {
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

  Document.prototype.setSnippetTree = function(snippetTree) {
    assert(snippetTree.design === this.design, 'SnippetTree must have the same design as the document');
    this.model = this.snippetTree = snippetTree;
    return this.forwardSnippetTreeEvents();
  };

  Document.prototype.forwardSnippetTreeEvents = function() {
    return this.snippetTree.changed.add((function(_this) {
      return function() {
        return _this.emit('change', arguments);
      };
    })(this));
  };

  Document.prototype.createView = function(parent, options) {
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

  Document.prototype.findWrapper = function($parent) {
    var $wrapper;
    if ($parent.find("." + config.css.section).length === 1) {
      $wrapper = $($parent.html());
    }
    return $wrapper;
  };

  Document.prototype.setInteractiveView = function(view) {
    assert(this.interactiveView == null, 'Error creating interactive view: Document can have only one interactive view');
    return this.interactiveView = view;
  };

  Document.prototype.toHtml = function() {
    return new Renderer({
      snippetTree: this.snippetTree,
      renderingContainer: new RenderingContainer()
    }).html();
  };

  Document.prototype.serialize = function() {
    return this.snippetTree.serialize();
  };

  Document.prototype.toJson = function(prettify) {
    var data, replacer, space;
    data = this.serialize();
    if (prettify != null) {
      replacer = null;
      space = 2;
      return JSON.stringify(data, replacer, space);
    } else {
      return JSON.stringify(data);
    }
  };

  Document.prototype.printModel = function() {
    return this.snippetTree.print();
  };

  Document.dom = dom;

  return Document;

})(EventEmitter);


},{"./configuration/config":7,"./interaction/dom":12,"./modules/logging/assert":21,"./rendering/renderer":28,"./rendering/view":31,"./rendering_container/interactive_page":34,"./rendering_container/page":35,"./rendering_container/rendering_container":36,"wolfy87-eventemitter":4}],12:[function(require,module,exports){
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


},{"../configuration/config":7}],13:[function(require,module,exports){
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


},{"../configuration/config":7}],14:[function(require,module,exports){
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
    var copy, newView, snippetName, template;
    if (this.hasSingleEditable(view)) {
      snippetName = this.page.design.paragraphSnippet;
      template = this.page.design.get(snippetName);
      copy = template.createModel();
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


},{"../configuration/config":7,"./dom":12}],15:[function(require,module,exports){
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


},{"./dom":12}],16:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/feature_detection/is_supported":19,"./dom":12}],17:[function(require,module,exports){
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


},{}],18:[function(require,module,exports){
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


},{}],19:[function(require,module,exports){
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


},{"./feature_detects":18}],20:[function(require,module,exports){
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


},{}],21:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":22}],22:[function(require,module,exports){
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


},{}],23:[function(require,module,exports){
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


},{"../modules/logging/assert":21}],24:[function(require,module,exports){
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


},{}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
var DefaultImageManager;

module.exports = DefaultImageManager = (function() {
  function DefaultImageManager() {}

  DefaultImageManager.prototype.set = function($elem, value) {
    if (this.isImgTag($elem)) {
      return $elem.attr('src', value);
    } else {
      return $elem.css('background-image', "url(" + (this.escapeCssUri(value)) + ")");
    }
  };

  DefaultImageManager.prototype.escapeCssUri = function(uri) {
    if (/[()]/.test(uri)) {
      return "'" + uri + "'";
    } else {
      return uri;
    }
  };

  DefaultImageManager.prototype.isBase64 = function(value) {
    return value.indexOf('data:image') === 0;
  };

  DefaultImageManager.prototype.isImgTag = function($elem) {
    return $elem[0].nodeName.toLowerCase() === 'img';
  };

  return DefaultImageManager;

})();


},{}],27:[function(require,module,exports){
var DefaultImageManager, ResrcitImageManager;

DefaultImageManager = require('./default_image_manager');

ResrcitImageManager = require('./resrcit_image_manager');

module.exports = (function() {
  var defaultImageManager, resrcitImageManager;
  defaultImageManager = new DefaultImageManager();
  resrcitImageManager = new ResrcitImageManager();
  return {
    set: function($elem, value, imageService) {
      var imageManager;
      imageManager = this._getImageManager(imageService);
      return imageManager.set($elem, value);
    },
    _getImageManager: function(imageService) {
      switch (imageService) {
        case 'resrc.it':
          return resrcitImageManager;
        default:
          return defaultImageManager;
      }
    },
    getDefaultImageManager: function() {
      return defaultImageManager;
    },
    getResrcitImageManager: function() {
      return resrcitImageManager;
    }
  };
})();


},{"./default_image_manager":26,"./resrcit_image_manager":29}],28:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/logging/assert":21,"../modules/logging/log":22,"../modules/semaphore":23}],29:[function(require,module,exports){
var DefaultImageManager, RescritImageManager, assert,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DefaultImageManager = require('./default_image_manager');

assert = require('../modules/logging/assert');

module.exports = RescritImageManager = (function(_super) {
  __extends(RescritImageManager, _super);

  RescritImageManager.resrcitUrl = 'http://app.resrc.it/';

  function RescritImageManager() {}

  RescritImageManager.prototype.set = function($elem, value) {
    if (this.isBase64(value)) {
      return this.setBase64($elem, value);
    }
    assert((value != null) && value !== '', 'Src value for an image has to be defined');
    $elem.addClass('resrc');
    if (this.isImgTag($elem)) {
      if ($elem.attr('src') && this.isBase64($elem.attr('src'))) {
        this.resetSrcAttribute($elem);
      }
      return $elem.attr('data-src', "" + RescritImageManager.resrcitUrl + value);
    } else {
      return $elem.css('background-image', "url(" + RescritImageManager.resrcitUrl + (this.escapeCssUri(value)) + ")");
    }
  };

  RescritImageManager.prototype.setBase64 = function($elem, value) {
    if (this.isImgTag($elem)) {
      return $elem.attr('src', value);
    } else {
      return $elem.css('background-image', "url(" + (this.escapeCssUri(value)) + ")");
    }
  };

  RescritImageManager.prototype.resetSrcAttribute = function($elem) {
    return $elem.removeAttr('src');
  };

  return RescritImageManager;

})(DefaultImageManager);


},{"../modules/logging/assert":21,"./default_image_manager":26}],30:[function(require,module,exports){
var DirectiveIterator, ImageManager, SnippetView, attr, config, css, dom, eventing;

config = require('../configuration/config');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

ImageManager = require('./image_manager');

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
    this.content(this.model.content, this.model.temporaryContent);
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
      this.style(name, value);
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

  SnippetView.prototype.content = function(content, sessionContent) {
    var name, value, _results;
    _results = [];
    for (name in content) {
      value = content[name];
      if (sessionContent[name] != null) {
        _results.push(this.set(name, sessionContent[name]));
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
      if (this.model.data('imageService')) {
        imageService = this.model.data('imageService')[name];
      }
      ImageManager.set($elem, value, imageService);
      return $elem.removeClass(config.css.emptyImage);
    } else {
      setPlaceholder = $.proxy(this.setPlaceholderImage, this, $elem);
      return this.delayUntilAttached(name, setPlaceholder);
    }
  };

  SnippetView.prototype.setPlaceholderImage = function($elem) {
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
    if (this.model.data('imageService')) {
      imageService = this.model.data('imageService')[name];
    }
    return ImageManager.set($elem, value, imageService);
  };

  SnippetView.prototype.style = function(name, className) {
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


},{"../configuration/config":7,"../interaction/dom":12,"../modules/eventing":17,"../template/directive_iterator":45,"./image_manager":27}],31:[function(require,module,exports){
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
    var params, renderer;
    params = {
      renderNode: iframe.contentDocument.body,
      hostWindow: iframe.contentWindow,
      design: this.snippetTree.design
    };
    this.page = this.createPage(params, options);
    return renderer = new Renderer({
      renderingContainer: this.page,
      snippetTree: this.snippetTree,
      $wrapper: options.$wrapper
    });
  };

  View.prototype.createPage = function(params, _arg) {
    var interactive, readOnly, _ref;
    _ref = _arg != null ? _arg : {}, interactive = _ref.interactive, readOnly = _ref.readOnly;
    if (interactive != null) {
      this.isInteractive = true;
      return new InteractivePage(params);
    } else {
      return new Page(params);
    }
  };

  return View;

})();


},{"../rendering_container/interactive_page":34,"../rendering_container/page":35,"./renderer":28}],32:[function(require,module,exports){
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

  CssLoader.prototype.loadSingleUrl = function(url, callback) {
    var link;
    if (callback == null) {
      callback = $.noop;
    }
    if (this.isUrlLoaded(url)) {
      return callback();
    } else {
      link = $('<link rel="stylesheet" type="text/css" />')[0];
      link.onload = callback;
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


},{"../modules/semaphore":23}],33:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/drag_base":13,"../interaction/snippet_drag":16}],34:[function(require,module,exports){
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
    if (config.livingdocsCssFile != null) {
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


},{"../configuration/config":7,"../interaction/dom":12,"../interaction/drag_base":13,"../interaction/editable_controller":14,"../interaction/focus":15,"../interaction/snippet_drag":16,"./page":35}],35:[function(require,module,exports){
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
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design, this.snippetTree = _ref.snippetTree;
    this.beforePageReady = __bind(this.beforePageReady, this);
    if (readOnly != null) {
      this.isReadOnly = readOnly;
    }
    this.setWindow(hostWindow);
    Page.__super__.constructor.call(this);
    this.setRenderNode(renderNode);
    this.cssLoader = new CssLoader(this.window);
    this.beforePageReady();
  }

  Page.prototype.setRenderNode = function(renderNode) {
    if (renderNode == null) {
      renderNode = $("." + config.css.section, this.$body);
    }
    if (renderNode.jquery) {
      return this.renderNode = renderNode[0];
    } else {
      return this.renderNode = renderNode;
    }
  };

  Page.prototype.beforeReady = function() {
    this.readySemaphore.wait();
    return setTimeout((function(_this) {
      return function() {
        return _this.readySemaphore.decrement();
      };
    })(this), 0);
  };

  Page.prototype.beforePageReady = function() {
    var cssLocation, designPath, path;
    if ((this.design != null) && config.loadResources) {
      designPath = "" + config.designPath + "/" + this.design.namespace;
      cssLocation = this.design.css != null ? this.design.css : '/css/style.css';
      path = "" + designPath + cssLocation;
      return this.cssLoader.load(path, this.readySemaphore.wait());
    }
  };

  Page.prototype.setWindow = function(hostWindow) {
    this.window = hostWindow || window;
    this.document = this.window.document;
    this.$document = $(this.document);
    return this.$body = $(this.document.body);
  };

  return Page;

})(RenderingContainer);


},{"../configuration/config":7,"./css_loader":32,"./rendering_container":36}],36:[function(require,module,exports){
var RenderingContainer, Semaphore;

Semaphore = require('../modules/semaphore');

module.exports = RenderingContainer = (function() {
  RenderingContainer.prototype.isReadOnly = true;

  function RenderingContainer() {
    this.renderNode = $('<div/>')[0];
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


},{"../modules/semaphore":23}],37:[function(require,module,exports){
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


},{}],38:[function(require,module,exports){
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

  SnippetContainer.prototype.ui = function() {
    var snippetTree;
    if (!this.uiInjector) {
      snippetTree = this.getSnippetTree();
      snippetTree.renderer.createInterfaceInjector(this);
    }
    return this.uiInjector;
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


},{"../modules/logging/assert":21}],39:[function(require,module,exports){
var SnippetContainer, SnippetModel, assert, config, deepEqual, guid, log, serialization;

deepEqual = require('deep-equal');

config = require('../configuration/config');

SnippetContainer = require('./snippet_container');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

serialization = require('../modules/serialization');

module.exports = SnippetModel = (function() {
  function SnippetModel(_arg) {
    var id, _ref;
    _ref = _arg != null ? _arg : {}, this.template = _ref.template, id = _ref.id;
    assert(this.template, 'cannot instantiate snippet without template reference');
    this.initializeDirectives();
    this.styles = {};
    this.dataValues = {};
    this.temporaryContent = {};
    this.id = id || guid.next();
    this.identifier = this.template.identifier;
    this.next = void 0;
    this.previous = void 0;
    this.snippetTree = void 0;
  }

  SnippetModel.prototype.initializeDirectives = function() {
    var directive, _i, _len, _ref, _results;
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
          this.content || (this.content = {});
          _results.push(this.content[directive.name] = void 0);
          break;
        default:
          _results.push(log.error("Template directive type '" + directive.type + "' not implemented in SnippetModel"));
      }
    }
    return _results;
  };

  SnippetModel.prototype.createView = function(isReadOnly) {
    return this.template.createView(this, isReadOnly);
  };

  SnippetModel.prototype.hasContainers = function() {
    return this.template.directives.count('container') > 0;
  };

  SnippetModel.prototype.hasEditables = function() {
    return this.template.directives.count('editable') > 0;
  };

  SnippetModel.prototype.hasHtml = function() {
    return this.template.directives.count('html') > 0;
  };

  SnippetModel.prototype.hasImages = function() {
    return this.template.directives.count('image') > 0;
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

  SnippetModel.prototype.resetVolatileValue = function(name, triggerChangeEvent) {
    if (triggerChangeEvent == null) {
      triggerChangeEvent = true;
    }
    delete this.temporaryContent[name];
    if (triggerChangeEvent) {
      if (this.snippetTree) {
        return this.snippetTree.contentChanging(this, name);
      }
    }
  };

  SnippetModel.prototype.set = function(name, value, flag) {
    var storageContainer, _ref;
    if (flag == null) {
      flag = '';
    }
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "set error: " + this.identifier + " has no content named " + name);
    if (flag === 'temporaryOverride') {
      storageContainer = this.temporaryContent;
    } else {
      this.resetVolatileValue(name, false);
      storageContainer = this.content;
    }
    if (storageContainer[name] !== value) {
      storageContainer[name] = value;
      if (this.snippetTree) {
        return this.snippetTree.contentChanging(this, name);
      }
    }
  };

  SnippetModel.prototype.get = function(name) {
    var _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "get error: " + this.identifier + " has no content named " + name);
    return this.content[name];
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
    if (deepEqual(this.dataValues[name], value) === false) {
      this.dataValues[name] = value;
      return true;
    } else {
      return false;
    }
  };

  SnippetModel.prototype.isEmpty = function(name) {
    var value;
    value = this.get(name);
    return value === void 0 || value === '';
  };

  SnippetModel.prototype.style = function(name, value) {
    if (arguments.length === 1) {
      return this.styles[name];
    } else {
      return this.setStyle(name, value);
    }
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

  SnippetModel.prototype.copy = function() {
    return log.warn("SnippetModel#copy() is not implemented yet.");
  };

  SnippetModel.prototype.copyWithoutContent = function() {
    return this.template.createModel();
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

  SnippetModel.prototype.destroy = function() {
    if (this.uiInjector) {
      return this.uiInjector.remove();
    }
  };

  SnippetModel.prototype.getParent = function() {
    var _ref;
    return (_ref = this.parentContainer) != null ? _ref.parentSnippet : void 0;
  };

  SnippetModel.prototype.ui = function() {
    if (!this.uiInjector) {
      this.snippetTree.renderer.createInterfaceInjector(this);
    }
    return this.uiInjector;
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

  SnippetModel.prototype.toJson = function() {
    var json, name;
    json = {
      id: this.id,
      identifier: this.identifier
    };
    if (!serialization.isEmpty(this.content)) {
      json.content = serialization.flatCopy(this.content);
    }
    if (!serialization.isEmpty(this.styles)) {
      json.styles = serialization.flatCopy(this.styles);
    }
    if (!serialization.isEmpty(this.dataValues)) {
      json.data = $.extend(true, {}, this.dataValues);
    }
    for (name in this.containers) {
      json.containers || (json.containers = {});
      json.containers[name] = [];
    }
    return json;
  };

  return SnippetModel;

})();

SnippetModel.fromJson = function(json, design) {
  var child, containerName, model, name, snippetArray, styleName, template, value, _i, _len, _ref, _ref1, _ref2;
  template = design.get(json.identifier);
  assert(template, "error while deserializing snippet: unknown template identifier '" + json.identifier + "'");
  model = new SnippetModel({
    template: template,
    id: json.id
  });
  _ref = json.content;
  for (name in _ref) {
    value = _ref[name];
    assert(model.content.hasOwnProperty(name), "error while deserializing snippet: unknown content '" + name + "'");
    model.content[name] = value;
  }
  _ref1 = json.styles;
  for (styleName in _ref1) {
    value = _ref1[styleName];
    model.style(styleName, value);
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
        model.append(containerName, SnippetModel.fromJson(child, design));
      }
    }
  }
  return model;
};


},{"../configuration/config":7,"../modules/guid":20,"../modules/logging/assert":21,"../modules/logging/log":22,"../modules/serialization":24,"./snippet_container":38,"deep-equal":1}],40:[function(require,module,exports){
var SnippetArray, SnippetContainer, SnippetModel, SnippetTree, assert,
  __slice = [].slice;

assert = require('../modules/logging/assert');

SnippetContainer = require('./snippet_container');

SnippetArray = require('./snippet_array');

SnippetModel = require('./snippet_model');

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
      name: this.design.namespace
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
        snippet = SnippetModel.fromJson(snippetData, design);
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
          snippet = SnippetModel.fromJson(content, _this.design);
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


},{"../modules/logging/assert":21,"./snippet_array":37,"./snippet_container":38,"./snippet_model":39}],41:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/dom":12}],42:[function(require,module,exports){
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
    return this[directive.type].push(directive);
  };

  DirectiveCollection.prototype.next = function(name) {
    var directive;
    if (name instanceof Directive) {
      directive = name;
    }
    directive || (directive = this.all[name]);
    return this[directive.index += 1];
  };

  DirectiveCollection.prototype.nextOfType = function(name) {
    var directive, requiredType;
    if (name instanceof Directive) {
      directive = name;
    }
    directive || (directive = this.all[name]);
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

  DirectiveCollection.prototype.$getElem = function(name) {
    return $(this.all[name].elem);
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

  DirectiveCollection.prototype.clone = function() {
    var newCollection;
    newCollection = new DirectiveCollection();
    this.each(function(directive) {
      return newCollection.add(directive.clone());
    });
    return newCollection;
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


},{"../configuration/config":7,"../modules/logging/assert":21,"./directive":41}],43:[function(require,module,exports){
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


},{"../configuration/config":7,"./directive":41}],44:[function(require,module,exports){
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


},{"../configuration/config":7}],45:[function(require,module,exports){
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


},{"../configuration/config":7}],46:[function(require,module,exports){
var DirectiveCollection, DirectiveIterator, SnippetModel, SnippetView, Template, assert, config, directiveCompiler, directiveFinder, log, words;

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

module.exports = Template = (function() {
  function Template(_arg) {
    var html, identifier, styles, title, weight, _ref, _ref1;
    _ref = _arg != null ? _arg : {}, html = _ref.html, this.namespace = _ref.namespace, this.id = _ref.id, identifier = _ref.identifier, title = _ref.title, styles = _ref.styles, weight = _ref.weight;
    assert(html, 'Template: param html missing');
    if (identifier) {
      _ref1 = Template.parseIdentifier(identifier), this.namespace = _ref1.namespace, this.id = _ref1.id;
    }
    this.identifier = this.namespace && this.id ? "" + this.namespace + "." + this.id : void 0;
    this.$template = $(this.pruneHtml(html)).wrap('<div>');
    this.$wrap = this.$template.parent();
    this.title = title || words.humanize(this.id);
    this.styles = styles || {};
    this.weight = weight;
    this.defaults = {};
    this.parseTemplate();
  }

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

  Template.prototype.printDoc = function() {
    var doc;
    doc = {
      identifier: this.identifier
    };
    return words.readableJson(doc);
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


},{"../configuration/config":7,"../modules/logging/assert":21,"../modules/logging/log":22,"../modules/words":25,"../rendering/snippet_view":30,"../snippet_tree/snippet_model":39,"./directive_collection":42,"./directive_compiler":43,"./directive_finder":44,"./directive_iterator":45}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29uZmlndXJhdGlvbi9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fc3R5bGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZG9jdW1lbnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RyYWdfYmFzZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2V2ZW50aW5nLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vZmVhdHVyZV9kZXRlY3RzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZ3VpZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2RlZmF1bHRfaW1hZ2VfbWFuYWdlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvaW1hZ2VfbWFuYWdlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3Jlc3JjaXRfaW1hZ2VfbWFuYWdlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvc25pcHBldF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvY3NzX2xvYWRlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2FycmF5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2ZpbmRlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3IuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LEVBSEc7R0FOb0I7QUFBQSxDQTdJM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5hdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnJylcbkRvY3VtZW50ID0gcmVxdWlyZSgnLi9kb2N1bWVudCcpXG5TbmlwcGV0VHJlZSA9IHJlcXVpcmUoJy4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jID0gZG8gLT5cblxuICBlZGl0b3JQYWdlID0gbmV3IEVkaXRvclBhZ2UoKVxuXG5cbiAgIyBJbnN0YW50aWF0aW9uIHByb2Nlc3M6XG4gICMgYXN5bmMgb3Igc3luYyAtPiBnZXQgZGVzaWduIChpbmNsdWRlIGpzIGZvciBzeW5jaHJvbm91cyBsb2FkaW5nKVxuICAjIHN5bmMgLT4gY3JlYXRlIGRvY3VtZW50XG4gICMgYXN5bmMgLT4gY3JlYXRlIHZpZXcgKGlmcmFtZSlcbiAgIyBhc3luYyAtPiBsb2FkIHJlc291cmNlcyBpbnRvIHZpZXdcblxuXG4gICMgTG9hZCBhIGRvY3VtZW50IGZyb20gc2VyaWFsaXplZCBkYXRhXG4gICMgaW4gYSBzeW5jaHJvbm91cyB3YXkuIERlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgbmV3OiAoeyBkYXRhLCBkZXNpZ24gfSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGRvY3VtZW50OiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgZGVzaWduTmFtZSA9IGRlc2lnblxuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShkZXNpZ246IGRlc2lnbilcblxuICAgIEBjcmVhdGUoc25pcHBldFRyZWUpXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgZG9jLmxvYWQoanNvbkZyb21TZXJ2ZXIpXG4gICMgIC50aGVuIChkb2N1bWVudCkgLT5cbiAgIyAgICBkb2N1bWVudC5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgRGlyZWN0IGNyZWF0aW9uIHdpdGggYW4gZXhpc3RpbmcgU25pcHBldFRyZWVcbiAgY3JlYXRlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgbmV3IERvY3VtZW50KHsgc25pcHBldFRyZWUgfSlcblxuXG4gICMgU2VlIGRlc2lnbkNhY2hlLmxvYWQgZm9yIGV4YW1wbGVzIGhvdyB0byBsb2FkIHlvdXIgZGVzaWduLlxuICBkZXNpZ246IGRlc2lnbkNhY2hlXG5cbiAgIyBTdGFydCBkcmFnICYgZHJvcFxuICBzdGFydERyYWc6ICQucHJveHkoZWRpdG9yUGFnZSwgJ3N0YXJ0RHJhZycpXG5cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG4gICAgYXVnbWVudENvbmZpZyhjb25maWcpXG5cblxuXG4jIEV4cG9ydCBnbG9iYWwgdmFyaWFibGVcbndpbmRvdy5kb2MgPSBkb2NcbiIsIiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuI1xuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb24gd2l0aCBzaG9ydGhhbmRzIGFuZCBjb21wdXRlZCB2YWx1ZXMuXG4jXG4jIGNvbmZpZy5kb2NEaXJlY3RpdmVcbiMgICBXaWxsIHByZWZpeCB0aGUgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCBjb25maWcuYXR0cmlidXRlUHJlZml4XG4jICAgZS5nLiBjb25maWcuZG9jRGlyZWN0aXZlLmVkaXRhYmxlID09ICdkYXRhLWRvYy1lZGl0YWJsZSdcbiNcbiMgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFxuIyAgIEEgbG9va3VwIG9iamVjdCBmb3IgZWFzaWVyIGxvb2t1cHMgb2YgdGhlIGRpcmVjdGl2ZSBuYW1lIGJ5IHRlbXBsYXRlIGF0dHJpYnV0ZS5cbiMgICBlLmcuIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbJ2RvYy1lZGl0YWJsZSddID09ICdlZGl0YWJsZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoY29uZmlnKSAtPlxuXG4gICMgU2hvcnRoYW5kcyBmb3Igc3R1ZmYgdGhhdCBpcyB1c2VkIGFsbCBvdmVyIHRoZSBwbGFjZSB0byBtYWtlXG4gICMgY29kZSBhbmQgc3BlY3MgbW9yZSByZWFkYWJsZS5cbiAgY29uZmlnLmRvY0RpcmVjdGl2ZSA9IHt9XG4gIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBjb25maWcuZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBpZiBjb25maWcuYXR0cmlidXRlUHJlZml4IHRoZW4gXCIjeyBjb25maWcuYXR0cmlidXRlUHJlZml4IH0tXCIgZWxzZSAnJ1xuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgY29uZmlnLmRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cbiIsImF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2F1Z21lbnRfY29uZmlnJylcblxuIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnID0gZG8gLT5cblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIENTUyBzZWxlY3RvciBmb3IgZWxlbWVudHMgKGFuZCB0aGVpciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxuICAjIHdoZW4gZm9jdXNzaW5nIG9yIGJsdXJyaW5nIGEgc25pcHBldFxuICBpZ25vcmVJbnRlcmFjdGlvbjogJy5sZC1jb250cm9sJ1xuXG4gICMgU2V0dXAgcGF0aHMgdG8gbG9hZCByZXNvdXJjZXMgZHluYW1pY2FsbHlcbiAgZGVzaWduUGF0aDogJy9kZXNpZ25zJ1xuICBsaXZpbmdkb2NzQ3NzRmlsZTogJy9hc3NldHMvY3NzL2xpdmluZ2RvY3MuY3NzJ1xuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgRWRpdGFibGUgY29uZmlndXJhdGlvblxuICBlZGl0YWJsZTpcbiAgICBhbGxvd05ld2xpbmU6IHRydWUgIyBBbGxvdyB0byBpbnNlcnQgbmV3bGluZXMgd2l0aCBTaGlmdCtFbnRlclxuICAgIGNoYW5nZURlbGF5OiAwICMgRGVsYXkgZm9yIHVwZGF0aW5nIHRoZSBzbmlwcGV0IG1vZGVscyBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgdXNlciBjaGFuZ2VzLiAwIEZvciBpbW1lZGlhdGUgdXBkYXRlcy4gZmFsc2UgdG8gZGlzYWJsZS5cbiAgICBicm93c2VyU3BlbGxjaGVjazogZmFsc2UgIyBTZXQgdGhlIHNwZWxsY2hlY2sgYXR0cmlidXRlIG9uIGNvbnRlbnRlZGl0YWJsZXMgdG8gJ3RydWUnIG9yICdmYWxzZSdcbiAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBmYWxzZSAjIFdoZXRoZXIgdG8gZmlyZSBjdXJzb3IgYW5kIHNlbGN0aW9uIGNoYW5nZXMgb24gbW91c2Vtb3ZlXG5cblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIHNuaXBwZXQgY2xhc3Nlc1xuICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyYWdCbG9ja2VyOiAnZG9jLWRyYWctYmxvY2tlcidcbiAgICBkcm9wTWFya2VyOiAnZG9jLWRyb3AtbWFya2VyJ1xuICAgIGJlZm9yZURyb3A6ICdkb2MtYmVmb3JlLWRyb3AnXG4gICAgbm9Ecm9wOiAnZG9jLWRyYWctbm8tZHJvcCdcbiAgICBhZnRlckRyb3A6ICdkb2MtYWZ0ZXItZHJvcCdcbiAgICBsb25ncHJlc3NJbmRpY2F0b3I6ICdkb2MtbG9uZ3ByZXNzLWluZGljYXRvcidcblxuICAgICMgdXRpbGl0eSBjbGFzc2VzXG4gICAgcHJldmVudFNlbGVjdGlvbjogJ2RvYy1uby1zZWxlY3Rpb24nXG4gICAgbWF4aW1pemVkQ29udGFpbmVyOiAnZG9jLWpzLW1heGltaXplZC1jb250YWluZXInXG4gICAgaW50ZXJhY3Rpb25CbG9ja2VyOiAnZG9jLWludGVyYWN0aW9uLWJsb2NrZXInXG5cbiAgIyBhdHRyaWJ1dGVzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgYXR0cjpcbiAgICB0ZW1wbGF0ZTogJ2RhdGEtZG9jLXRlbXBsYXRlJ1xuICAgIHBsYWNlaG9sZGVyOiAnZGF0YS1kb2MtcGxhY2Vob2xkZXInXG5cblxuICAjIERpcmVjdGl2ZSBkZWZpbml0aW9uc1xuICAjXG4gICMgYXR0cjogYXR0cmlidXRlIHVzZWQgaW4gdGVtcGxhdGVzIHRvIGRlZmluZSB0aGUgZGlyZWN0aXZlXG4gICMgcmVuZGVyZWRBdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiBvdXRwdXQgaHRtbFxuICAjIGVsZW1lbnREaXJlY3RpdmU6IGRpcmVjdGl2ZSB0aGF0IHRha2VzIGNvbnRyb2wgb3ZlciB0aGUgZWxlbWVudFxuICAjICAgKHRoZXJlIGNhbiBvbmx5IGJlIG9uZSBwZXIgZWxlbWVudClcbiAgIyBkZWZhdWx0TmFtZTogZGVmYXVsdCBuYW1lIGlmIG5vbmUgd2FzIHNwZWNpZmllZCBpbiB0aGUgdGVtcGxhdGVcbiAgZGlyZWN0aXZlczpcbiAgICBjb250YWluZXI6XG4gICAgICBhdHRyOiAnZG9jLWNvbnRhaW5lcidcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgZWRpdGFibGU6XG4gICAgICBhdHRyOiAnZG9jLWVkaXRhYmxlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBpbWFnZTpcbiAgICAgIGF0dHI6ICdkb2MtaW1hZ2UnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdpbWFnZSdcbiAgICBodG1sOlxuICAgICAgYXR0cjogJ2RvYy1odG1sJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBvcHRpb25hbDpcbiAgICAgIGF0dHI6ICdkb2Mtb3B0aW9uYWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogZmFsc2VcblxuXG4gIGFuaW1hdGlvbnM6XG4gICAgb3B0aW9uYWxzOlxuICAgICAgc2hvdzogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZURvd24oMjUwKVxuXG4gICAgICBoaWRlOiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlVXAoMjUwKVxuXG5cbmF1Z21lbnRDb25maWcoY29uZmlnKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduU3R5bGUgPSByZXF1aXJlKCcuL2Rlc2lnbl9zdHlsZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduXG5cbiAgY29uc3RydWN0b3I6IChkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGVzID0gZGVzaWduLnRlbXBsYXRlcyB8fCBkZXNpZ24uc25pcHBldHNcbiAgICBjb25maWcgPSBkZXNpZ24uY29uZmlnXG4gICAgZ3JvdXBzID0gZGVzaWduLmNvbmZpZy5ncm91cHMgfHwgZGVzaWduLmdyb3Vwc1xuXG4gICAgQG5hbWVzcGFjZSA9IGNvbmZpZz8ubmFtZXNwYWNlIHx8ICdsaXZpbmdkb2NzLXRlbXBsYXRlcydcbiAgICBAcGFyYWdyYXBoU25pcHBldCA9IGNvbmZpZz8ucGFyYWdyYXBoIHx8ICd0ZXh0J1xuICAgIEBjc3MgPSBjb25maWcuY3NzXG4gICAgQGpzID0gY29uZmlnLmpzXG4gICAgQGZvbnRzID0gY29uZmlnLmZvbnRzXG4gICAgQHRlbXBsYXRlcyA9IFtdXG4gICAgQGdyb3VwcyA9IHt9XG4gICAgQHN0eWxlcyA9IHt9XG5cbiAgICBAc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zKHRlbXBsYXRlcylcbiAgICBAZ2xvYmFsU3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihkZXNpZ24uY29uZmlnLnN0eWxlcylcbiAgICBAYWRkR3JvdXBzKGdyb3VwcylcbiAgICBAYWRkVGVtcGxhdGVzTm90SW5Hcm91cHMoKVxuXG5cbiAgZXF1YWxzOiAoZGVzaWduKSAtPlxuICAgIGRlc2lnbi5uYW1lc3BhY2UgPT0gQG5hbWVzcGFjZVxuXG5cbiAgc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zOiAodGVtcGxhdGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zID0ge31cbiAgICBmb3IgdGVtcGxhdGUgaW4gdGVtcGxhdGVzXG4gICAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuXG5cbiAgIyBwYXNzIHRoZSB0ZW1wbGF0ZSBhcyBvYmplY3RcbiAgIyBlLmcgYWRkKHtpZDogXCJ0aXRsZVwiLCBuYW1lOlwiVGl0bGVcIiwgaHRtbDogXCI8aDEgZG9jLWVkaXRhYmxlPlRpdGxlPC9oMT5cIn0pXG4gIGFkZDogKHRlbXBsYXRlRGVmaW5pdGlvbiwgc3R5bGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlRGVmaW5pdGlvbi5pZF0gPSB1bmRlZmluZWRcbiAgICB0ZW1wbGF0ZU9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKHRlbXBsYXRlRGVmaW5pdGlvbi5zdHlsZXMpXG4gICAgdGVtcGxhdGVTdHlsZXMgPSAkLmV4dGVuZCh7fSwgc3R5bGVzLCB0ZW1wbGF0ZU9ubHlTdHlsZXMpXG5cbiAgICB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZVxuICAgICAgbmFtZXNwYWNlOiBAbmFtZXNwYWNlXG4gICAgICBpZDogdGVtcGxhdGVEZWZpbml0aW9uLmlkXG4gICAgICB0aXRsZTogdGVtcGxhdGVEZWZpbml0aW9uLnRpdGxlXG4gICAgICBzdHlsZXM6IHRlbXBsYXRlU3R5bGVzXG4gICAgICBodG1sOiB0ZW1wbGF0ZURlZmluaXRpb24uaHRtbFxuICAgICAgd2VpZ2h0OiB0ZW1wbGF0ZURlZmluaXRpb24ud2VpZ2h0IHx8IDBcblxuICAgIEB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSlcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgYWRkR3JvdXBzOiAoY29sbGVjdGlvbikgLT5cbiAgICBmb3IgZ3JvdXBOYW1lLCBncm91cCBvZiBjb2xsZWN0aW9uXG4gICAgICBncm91cE9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGdyb3VwLnN0eWxlcylcbiAgICAgIGdyb3VwU3R5bGVzID0gJC5leHRlbmQoe30sIEBnbG9iYWxTdHlsZXMsIGdyb3VwT25seVN0eWxlcylcblxuICAgICAgdGVtcGxhdGVzID0ge31cbiAgICAgIGZvciB0ZW1wbGF0ZUlkIGluIGdyb3VwLnRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZURlZmluaXRpb24gPSBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZUlkXVxuICAgICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgICB0ZW1wbGF0ZSA9IEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBncm91cFN0eWxlcylcbiAgICAgICAgICB0ZW1wbGF0ZXNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy53YXJuKFwiVGhlIHRlbXBsYXRlICcje3RlbXBsYXRlSWR9JyByZWZlcmVuY2VkIGluIHRoZSBncm91cCAnI3tncm91cE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIilcblxuICAgICAgQGFkZEdyb3VwKGdyb3VwTmFtZSwgZ3JvdXAsIHRlbXBsYXRlcylcblxuXG4gIGFkZFRlbXBsYXRlc05vdEluR3JvdXBzOiAoZ2xvYmFsU3R5bGVzKSAtPlxuICAgIGZvciB0ZW1wbGF0ZUlkLCB0ZW1wbGF0ZURlZmluaXRpb24gb2YgQHRlbXBsYXRlRGVmaW5pdGlvbnNcbiAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgQGdsb2JhbFN0eWxlcylcblxuXG4gIGFkZEdyb3VwOiAobmFtZSwgZ3JvdXAsIHRlbXBsYXRlcykgLT5cbiAgICBAZ3JvdXBzW25hbWVdID1cbiAgICAgIHRpdGxlOiBncm91cC50aXRsZVxuICAgICAgdGVtcGxhdGVzOiB0ZW1wbGF0ZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbjogKHN0eWxlcykgLT5cbiAgICBkZXNpZ25TdHlsZXMgPSB7fVxuICAgIGlmIHN0eWxlc1xuICAgICAgZm9yIHN0eWxlRGVmaW5pdGlvbiBpbiBzdHlsZXNcbiAgICAgICAgZGVzaWduU3R5bGUgPSBAY3JlYXRlRGVzaWduU3R5bGUoc3R5bGVEZWZpbml0aW9uKVxuICAgICAgICBkZXNpZ25TdHlsZXNbZGVzaWduU3R5bGUubmFtZV0gPSBkZXNpZ25TdHlsZSBpZiBkZXNpZ25TdHlsZVxuXG4gICAgZGVzaWduU3R5bGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBpZiBzdHlsZURlZmluaXRpb24gJiYgc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgIG5ldyBEZXNpZ25TdHlsZVxuICAgICAgICBuYW1lOiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgICB0eXBlOiBzdHlsZURlZmluaXRpb24udHlwZVxuICAgICAgICBvcHRpb25zOiBzdHlsZURlZmluaXRpb24ub3B0aW9uc1xuICAgICAgICB2YWx1ZTogc3R5bGVEZWZpbml0aW9uLnZhbHVlXG5cblxuICByZW1vdmU6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBAdGVtcGxhdGVzLnNwbGljZShAZ2V0SW5kZXgoaWQpLCAxKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgdGVtcGxhdGUgPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpbmRleCkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIHRlbXBsYXRlID0gdFxuXG4gICAgICB0ZW1wbGF0ZVxuXG5cbiAgZ2V0SW5kZXg6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBpbmRleCA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGkpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICBpbmRleCA9IGlcblxuICAgICAgaW5kZXhcblxuXG4gIGNoZWNrTmFtZXNwYWNlOiAoaWRlbnRpZmllciwgY2FsbGJhY2spIC0+XG4gICAgeyBuYW1lc3BhY2UsIGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIGFzc2VydCBub3QgbmFtZXNwYWNlIG9yIEBuYW1lc3BhY2UgaXMgbmFtZXNwYWNlLFxuICAgICAgXCJkZXNpZ24gI3sgQG5hbWVzcGFjZSB9OiBjYW5ub3QgZ2V0IHRlbXBsYXRlIHdpdGggZGlmZmVyZW50IG5hbWVzcGFjZSAjeyBuYW1lc3BhY2UgfSBcIlxuXG4gICAgY2FsbGJhY2soaWQpXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHRlbXBsYXRlLCBpbmRleCBpbiBAdGVtcGxhdGVzXG4gICAgICBjYWxsYmFjayh0ZW1wbGF0ZSwgaW5kZXgpXG5cblxuICAjIGxpc3QgYXZhaWxhYmxlIFRlbXBsYXRlc1xuICBsaXN0OiAtPlxuICAgIHRlbXBsYXRlcyA9IFtdXG4gICAgQGVhY2ggKHRlbXBsYXRlKSAtPlxuICAgICAgdGVtcGxhdGVzLnB1c2godGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIHRlbXBsYXRlc1xuXG5cbiAgIyBwcmludCBkb2N1bWVudGF0aW9uIGZvciBhIHRlbXBsYXRlXG4gIGluZm86IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldChpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLnByaW50RG9jKClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ3lvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFdpbGwgYmUgZXh0ZW5kZWQgdG8gbG9hZCBkZXNpZ25zIHJlbW90ZWx5IGZyb20gYSBzZXJ2ZXI6XG4gICMgTG9hZCBmcm9tIHRoZSBkZWZhdWx0IHNvdXJjZTpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2doaWJsaScpXG4gICNcbiAgIyBMb2FkIGZyb20gYSBjdXN0b20gc2VydmVyOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnaHR0cDovL3lvdXJzZXJ2ZXIuaW8vZGVzaWducy9naGlibGkvZGVzaWduLmpzb24nKVxuICBsb2FkOiAoZGVzaWduU3BlYykgLT5cbiAgICBpZiB0eXBlb2YgZGVzaWduU3BlYyA9PSAnc3RyaW5nJ1xuICAgICAgYXNzZXJ0IGZhbHNlLCAnTG9hZCBkZXNpZ24gYnkgbmFtZSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LidcbiAgICBlbHNlXG4gICAgICBuYW1lID0gZGVzaWduU3BlYy5jb25maWc/Lm5hbWVzcGFjZVxuICAgICAgcmV0dXJuIGlmIG5vdCBuYW1lPyBvciBAaGFzKG5hbWUpXG5cbiAgICAgIGRlc2lnbiA9IG5ldyBEZXNpZ24oZGVzaWduU3BlYylcbiAgICAgIEBhZGQoZGVzaWduKVxuXG5cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIG5hbWUgPSBkZXNpZ24ubmFtZXNwYWNlXG4gICAgQGRlc2lnbnNbbmFtZV0gPSBkZXNpZ25cblxuXG4gIGhhczogKG5hbWUpIC0+XG4gICAgQGRlc2lnbnNbbmFtZV0/XG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGFzc2VydCBAaGFzKG5hbWUpLCBcIkVycm9yOiBkZXNpZ24gJyN7IG5hbWUgfScgaXMgbm90IGxvYWRlZC5cIlxuICAgIEBkZXNpZ25zW25hbWVdXG5cblxuICByZXNldENhY2hlOiAtPlxuICAgIEBkZXNpZ25zID0ge31cblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25TdHlsZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgc3dpdGNoIEB0eXBlXG4gICAgICB3aGVuICdvcHRpb24nXG4gICAgICAgIGFzc2VydCB2YWx1ZSwgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAndmFsdWUnIHByb3ZpZGVkXCJcbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgIHdoZW4gJ3NlbGVjdCdcbiAgICAgICAgYXNzZXJ0IG9wdGlvbnMsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ29wdGlvbnMnIHByb3ZpZGVkXCJcbiAgICAgICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IHVua25vd24gdHlwZSAnI3sgQHR5cGUgfSdcIlxuXG5cbiAgIyBHZXQgaW5zdHJ1Y3Rpb25zIHdoaWNoIGNzcyBjbGFzc2VzIHRvIGFkZCBhbmQgcmVtb3ZlLlxuICAjIFdlIGRvIG5vdCBjb250cm9sIHRoZSBjbGFzcyBhdHRyaWJ1dGUgb2YgYSBzbmlwcGV0IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IERlc2lnblN0eWxlI3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERvY3VtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgc25pcHBldFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gc25pcHBldFRyZWUuZGVzaWduXG4gICAgQHNldFNuaXBwZXRUcmVlKHNuaXBwZXRUcmVlKVxuICAgIEB2aWV3cyA9IHt9XG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuXG5cbiAgIyBHZXQgYSBkcm9wIHRhcmdldCBmb3IgYW4gZXZlbnRcbiAgZ2V0RHJvcFRhcmdldDogKHsgZXZlbnQgfSkgLT5cbiAgICBkb2N1bWVudCA9IGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50XG4gICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG4gICAgaWYgZWxlbT9cbiAgICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnQucGFnZVgsIHRvcDogZXZlbnQucGFnZVkgfVxuICAgICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKVxuXG5cbiAgc2V0U25pcHBldFRyZWU6IChzbmlwcGV0VHJlZSkgLT5cbiAgICBhc3NlcnQgc25pcHBldFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnU25pcHBldFRyZWUgbXVzdCBoYXZlIHRoZSBzYW1lIGRlc2lnbiBhcyB0aGUgZG9jdW1lbnQnXG5cbiAgICBAbW9kZWwgPSBAc25pcHBldFRyZWUgPSBzbmlwcGV0VHJlZVxuICAgIEBmb3J3YXJkU25pcHBldFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zLnJlYWRPbmx5ID89IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cblxuICAgIHZpZXcgPSBuZXcgVmlldyhAc25pcHBldFRyZWUsICRwYXJlbnRbMF0pXG4gICAgcHJvbWlzZSA9IHZpZXcuY3JlYXRlKG9wdGlvbnMpXG5cbiAgICBpZiB2aWV3LmlzSW50ZXJhY3RpdmVcbiAgICAgIEBzZXRJbnRlcmFjdGl2ZVZpZXcodmlldylcblxuICAgIHByb21pc2VcblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBEb2N1bWVudCBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIHRvSHRtbDogLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIHNwYWNlID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBTbmlwcGV0VHJlZS5cbiAgcHJpbnRNb2RlbDogKCkgLT5cbiAgICBAc25pcHBldFRyZWUucHJpbnQoKVxuXG5cbiAgRG9jdW1lbnQuZG9tID0gZG9tXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERPTSBoZWxwZXIgbWV0aG9kc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiMgTWV0aG9kcyB0byBwYXJzZSBhbmQgdXBkYXRlIHRoZSBEb20gdHJlZSBpbiBhY2NvcmRhbmNlIHRvXG4jIHRoZSBTbmlwcGV0VHJlZSBhbmQgTGl2aW5nZG9jcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG4gIHNuaXBwZXRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNuaXBwZXQgfSg/OiB8JClcIilcbiAgc2VjdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgc25pcHBldCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBTbmlwcGV0cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIHNuaXBwZXRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cbiAgZHJvcFRhcmdldDogKG5vZGUsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgICMgYWJvdmUgY29udGFpbmVyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRDb250YWluZXJUYXJnZXQobm9kZSlcblxuICAgICAgIyBhYm92ZSBzbmlwcGV0XG4gICAgICBlbHNlIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldFNuaXBwZXRUYXJnZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcblxuICAgICAgIyBhYm92ZSByb290IGNvbnRhaW5lclxuICAgICAgZWxzZSBpZiBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRTbmlwcGV0VGFyZ2V0OiAoZWxlbSwgeyB0b3AsIGxlZnQsIHBvc2l0aW9uIH0pIC0+XG4gICAgdGFyZ2V0OiAnc25pcHBldCdcbiAgICBzbmlwcGV0VmlldzogQGdldFNuaXBwZXRWaWV3KGVsZW0pXG4gICAgcG9zaXRpb246IHBvc2l0aW9uIHx8IEBnZXRQb3NpdGlvbk9uU25pcHBldChlbGVtLCB7IHRvcCwgbGVmdCB9KVxuXG5cbiAgZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQ6IChjbG9zZXN0U25pcHBldERhdGEpIC0+XG4gICAgZWxlbSA9IGNsb3Nlc3RTbmlwcGV0RGF0YS4kZWxlbVswXVxuICAgIHBvc2l0aW9uID0gY2xvc2VzdFNuaXBwZXREYXRhLnBvc2l0aW9uXG4gICAgQGdldFNuaXBwZXRUYXJnZXQoZWxlbSwgeyBwb3NpdGlvbiB9KVxuXG5cbiAgZ2V0Q29udGFpbmVyVGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuXG4gICAgdGFyZ2V0OiAnY29udGFpbmVyJ1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VmlldzogQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIHNuaXBwZXRUcmVlID0gJChub2RlKS5kYXRhKCdzbmlwcGV0VHJlZScpXG5cbiAgICB0YXJnZXQ6ICdyb290J1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VHJlZTogc25pcHBldFRyZWVcblxuXG4gICMgRmlndXJlIG91dCBpZiB3ZSBzaG91bGQgaW5zZXJ0IGJlZm9yZSBvciBhZnRlciBhIHNuaXBwZXRcbiAgIyBiYXNlZCBvbiB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICBnZXRQb3NpdGlvbk9uU25pcHBldDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IHNuaXBwZXQgaW4gYSBjb250YWluZXIgZm9yIGEgdG9wIGxlZnQgcG9zaXRpb25cbiAgZ2V0Q2xvc2VzdFNuaXBwZXQ6IChjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJHNuaXBwZXRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLnNuaXBwZXQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBjbG9zZXN0U25pcHBldCA9IHVuZGVmaW5lZFxuXG4gICAgJHNuaXBwZXRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2FmdGVyJ31cblxuICAgIGNsb3Nlc3RTbmlwcGV0XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgc25pcHBldCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuICAgICAgICAkcGFyZW50ID0gJGVsZW0ucGFyZW50KClcbiAgICAgICAgcGFyZW50SGVpZ2h0ID0gJHBhcmVudC5oZWlnaHQoKVxuICAgICAgICBvdXRlciA9ICRlbGVtLm91dGVySGVpZ2h0KHRydWUpIC0gJGVsZW0uaGVpZ2h0KClcbiAgICAgICAgJGVsZW0uaGVpZ2h0KHBhcmVudEhlaWdodCAtIG91dGVyKVxuICAgICAgICAkZWxlbS5hZGRDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgIyByZW1vdmUgYWxsIGNzcyBzdHlsZSBoZWlnaHQgZGVjbGFyYXRpb25zIGFkZGVkIGJ5XG4gICMgbWF4aW1pemVDb250YWluZXJIZWlnaHQoKVxuICByZXN0b3JlQ29udGFpbmVySGVpZ2h0OiAoKSAtPlxuICAgICQoXCIuI3sgY3NzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgZ2V0RWxlbWVudE5vZGU6IChub2RlKSAtPlxuICAgIGlmIG5vZGU/LmpxdWVyeVxuICAgICAgbm9kZVswXVxuICAgIGVsc2UgaWYgbm9kZT8ubm9kZVR5cGUgPT0gMyAjIE5vZGUuVEVYVF9OT0RFID09IDNcbiAgICAgIG5vZGUucGFyZW50Tm9kZVxuICAgIGVsc2VcbiAgICAgIG5vZGVcblxuXG4gICMgU25pcHBldHMgc3RvcmUgYSByZWZlcmVuY2Ugb2YgdGhlbXNlbHZlcyBpbiB0aGVpciBEb20gbm9kZVxuICAjIGNvbnNpZGVyOiBzdG9yZSByZWZlcmVuY2UgZGlyZWN0bHkgd2l0aG91dCBqUXVlcnlcbiAgZ2V0U25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnc25pcHBldCcpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIFN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIFRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZFxuICAjIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSkuXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogKGV2ZW50KSAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKGV2ZW50KSBpZiBAc3RhcnRlZFxuICAgIGlmICQuaXNGdW5jdGlvbihAb3B0aW9ucy5vbkRyb3ApXG4gICAgICBAb3B0aW9ucy5vbkRyb3AoZXZlbnQsIEBkcmFnSGFuZGxlcilcbiAgICBAcmVzZXQoKVxuXG5cbiAgY2FuY2VsOiAtPlxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyYWdCbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpLnJlbW92ZSgpXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgICAnZHJvcC5saXZpbmdkb2NzLWRyYWcgZHJhZ2VuZC5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCAoZXZlbnQpID0+XG4gICAgICBAZHJvcChldmVudClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnZHJhZ292ZXIubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSAjIGFsbCBvdGhlciBpbnB1dCBkZXZpY2VzIGJlaGF2ZSBsaWtlIGEgbW91c2VcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuXG4gIGdldEV2ZW50UG9zaXRpb246IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyB8fCBldmVudC50eXBlID09ICd0b3VjaG1vdmUnXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF1cblxuICAgICMgU28gZmFyIEkgZG8gbm90IHVuZGVyc3RhbmQgd2h5IHRoZSBqUXVlcnkgZXZlbnQgZG9lcyBub3QgY29udGFpbiBjbGllbnRYIGV0Yy5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdvdmVyJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50XG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBlZGl0YWJsZS5qcyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgZWRpdGFibGUuanMgaW50byBMaXZpbmdkb2NzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlQ29udHJvbGxlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UpIC0+XG5cbiAgICAjIEluaXRpYWxpemUgZWRpdGFibGUuanNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGVcbiAgICAgIHdpbmRvdzogQHBhZ2Uud2luZG93XG4gICAgICBicm93c2VyU3BlbGxjaGVjazogY29uZmlnLmVkaXRhYmxlLmJyb3dzZXJTcGVsbGNoZWNrXG4gICAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBjb25maWcuZWRpdGFibGUubW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlc1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG4gICAgICAuY2hhbmdlKEB3aXRoQ29udGV4dChAY2hhbmdlKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggZWRpdGFibGUuanMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IGVkaXRhYmxlLmpzXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgZXh0cmFjdENvbnRlbnQ6IChlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGVkaXRhYmxlLmdldENvbnRlbnQoZWxlbWVudClcbiAgICBpZiBjb25maWcuc2luZ2xlTGluZUJyZWFrLnRlc3QodmFsdWUpIHx8IHZhbHVlID09ICcnXG4gICAgICB1bmRlZmluZWRcbiAgICBlbHNlXG4gICAgICB2YWx1ZVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW1lbnQpIC0+XG4gICAgdmFsdWUgPSBAZXh0cmFjdENvbnRlbnQoZWxlbWVudClcbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KVxuXG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBJbnNlcnQgYSBuZXcgYmxvY2suXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgYXQgdGhlIGVuZCBvZiBhIGJsb2NrXG4gICMgb3IgYnkgcHJlc3NpbmcgZGVsZXRlIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBibG9jay5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3ICYmIGRpcmVjdGlvbiA9PSAnYWZ0ZXInXG5cblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBNZXJnZSB0d28gYmxvY2tzLiBXb3JrcyBpbiB0d28gZGlyZWN0aW9ucy5cbiAgIyBFaXRoZXIgdGhlIGN1cnJlbnQgYmxvY2sgaXMgYmVpbmcgbWVyZ2VkIGludG8gdGhlIHByZWNlZWRpbmcgKCdiZWZvcmUnKVxuICAjIG9yIHRoZSBmb2xsb3dpbmcgKCdhZnRlcicpIGJsb2NrLlxuICAjIEFmdGVyIHRoZSBtZXJnZSB0aGUgY3VycmVudCBibG9jayBpcyByZW1vdmVkIGFuZCB0aGUgZm9jdXMgc2V0IHRvIHRoZVxuICAjIG90aGVyIGJsb2NrIHRoYXQgd2FzIG1lcmdlZCBpbnRvLlxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuICAgICAgICB2aWV3RWxlbSA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIG1lcmdlZFZpZXdFbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcblxuICAgICAgICAjIEdhdGhlciB0aGUgY29udGVudCB0aGF0IGlzIGdvaW5nIHRvIGJlIG1lcmdlZFxuICAgICAgICBjb250ZW50VG9NZXJnZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KHZpZXdFbGVtKVxuXG4gICAgICAgIGN1cnNvciA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIEBlZGl0YWJsZS5hcHBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZWRpdGFibGUucHJlcGVuZFRvKG1lcmdlZFZpZXdFbGVtLCBjb250ZW50VG9NZXJnZSlcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRWaXNpYmxlU2VsZWN0aW9uKClcblxuICAgICAgICAjIEFmdGVyIGV2ZXJ5dGhpbmcgaXMgZG9uZSBhbmQgdGhlIGZvY3VzIGlzIHNldCB1cGRhdGUgdGhlIG1vZGVsIHRvXG4gICAgICAgICMgbWFrZSBzdXJlIHRoZSBtb2RlbCBpcyB1cCB0byBkYXRlIGFuZCBjaGFuZ2VzIGFyZSBub3RpZmllZC5cbiAgICAgICAgQHVwZGF0ZU1vZGVsKG1lcmdlZFZpZXcsIGVkaXRhYmxlTmFtZSwgbWVyZ2VkVmlld0VsZW0pXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgU3BsaXQgYSBibG9jayBpbiB0d28uXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgaW4gdGhlIG1pZGRsZSBvZiBhIGJsb2NrLlxuICBzcGxpdDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgYmVmb3JlLCBhZnRlciwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuXG4gICAgICAjIGFwcGVuZCBhbmQgZm9jdXMgY29weSBvZiBzbmlwcGV0XG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChhZnRlcikpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKT8uZm9jdXMoKVxuXG4gICAgICAjIHNldCBjb250ZW50IG9mIHRoZSBiZWZvcmUgZWxlbWVudCAoYWZ0ZXIgZm9jdXMgaXMgc2V0IHRvIHRoZSBhZnRlciBlbGVtZW50KVxuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYmVmb3JlKSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBPY2N1cnMgd2hlbmV2ZXIgdGhlIHVzZXIgc2VsZWN0cyBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJzIG9yIHdoZW5ldmVyIHRoZVxuICAjIHNlbGVjdGlvbiBpcyBjaGFuZ2VkLlxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gICMgSW5zZXJ0IGEgbmV3bGluZSAoU2hpZnQgKyBFbnRlcilcbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgaWYgY29uZmlnLmVkaXRhYmxlLmFsbG93TmV3bGluZVxuICAgICAgcmV0dXJuIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBlbHNlXG4gICAgIHJldHVybiBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgVHJpZ2dlcmVkIHdoZW5ldmVyIHRoZSB1c2VyIGNoYW5nZXMgdGhlIGNvbnRlbnQgb2YgYSBibG9jay5cbiAgIyBUaGUgY2hhbmdlIGV2ZW50IGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgZmlyZSBpZiB0aGUgY29udGVudCBoYXNcbiAgIyBiZWVuIGNoYW5nZWQgdmlhIGphdmFzY3JpcHQuXG4gIGNoYW5nZTogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcbiAgICByZXR1cm4gaWYgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXlcblxuXG4gIGNsZWFyQ2hhbmdlVGltZW91dDogLT5cbiAgICBpZiBAY2hhbmdlVGltZW91dD9cbiAgICAgIGNsZWFyVGltZW91dChAY2hhbmdlVGltZW91dClcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIERvY3VtZW50IEZvY3VzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgc25pcHBldCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQHNuaXBwZXRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIHNuaXBwZXRWaWV3ICE9IEBzbmlwcGV0Vmlld1xuICAgICAgQHJlc2V0U25pcHBldFZpZXcoKVxuICAgICAgaWYgc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRWaWV3ID0gc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRGb2N1cy5maXJlKEBzbmlwcGV0VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBzbmlwcGV0VmlldyB8fD0gZG9tLmZpbmRTbmlwcGV0VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBzbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBzbmlwcGV0VmlldyAhPSBzbmlwcGV0Vmlld1xuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0U25pcHBldFZpZXc6IC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBzbmlwcGV0Vmlld1xuICAgICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAc25pcHBldEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Py5tb2RlbCAhPSBAc25pcHBldE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuc25pcHBldFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIHNuaXBwZXRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5zbmlwcGV0Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHMoYmVmb3JlLCB0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHModGFyZ2V0LnNuaXBwZXRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdUb3AgPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy10b3AnKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXQgKyBwYWRkaW5nVG9wXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLWJvdHRvbScpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldCAtIHBhZGRpbmdCb3R0b21cbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cblxuICAgICAgaWYgY2xpZW50WD8gJiYgY2xpZW50WT9cbiAgICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcblxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSAkLkNhbGxiYWNrcyBvYmplY3QgdGhhdCB3aWxsXG4gICMgcmVtb3ZlIGl0c2VsZiBmcm9tIGl0cyAkLkNhbGxiYWNrcyBhZnRlciB0aGUgZmlyc3QgY2FsbC5cbiAgY2FsbE9uY2U6IChjYWxsYmFja3MsIGxpc3RlbmVyKSAtPlxuICAgIHNlbGZSZW1vdmluZ0Z1bmMgPSAoYXJncy4uLikgLT5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmUoc2VsZlJlbW92aW5nRnVuYylcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjYWxsYmFja3MuYWRkKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgc2VsZlJlbW92aW5nRnVuY1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGh0bWxQb2ludGVyRXZlbnRzOiAtPlxuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4JylcbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSAncG9pbnRlci1ldmVudHM6YXV0bydcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID09ICdhdXRvJ1xuIiwiZGV0ZWN0cyA9IHJlcXVpcmUoJy4vZmVhdHVyZV9kZXRlY3RzJylcblxuZXhlY3V0ZWRUZXN0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG5hbWUpIC0+XG4gIGlmIChyZXN1bHQgPSBleGVjdXRlZFRlc3RzW25hbWVdKSA9PSB1bmRlZmluZWRcbiAgICBleGVjdXRlZFRlc3RzW25hbWVdID0gQm9vbGVhbihkZXRlY3RzW25hbWVdKCkpXG4gIGVsc2VcbiAgICByZXN1bHRcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlkQ291bnRlciA9IGxhc3RJZCA9IHVuZGVmaW5lZFxuXG4gICMgR2VuZXJhdGUgYSB1bmlxdWUgaWQuXG4gICMgR3VhcmFudGVlcyBhIHVuaXF1ZSBpZCBpbiB0aGlzIHJ1bnRpbWUuXG4gICMgQWNyb3NzIHJ1bnRpbWVzIGl0cyBsaWtlbHkgYnV0IG5vdCBndWFyYW50ZWVkIHRvIGJlIHVuaXF1ZVxuICAjIFVzZSB0aGUgdXNlciBwcmVmaXggdG8gYWxtb3N0IGd1YXJhbnRlZSB1bmlxdWVuZXNzLFxuICAjIGFzc3VtaW5nIHRoZSBzYW1lIHVzZXIgY2Fubm90IGdlbmVyYXRlIHNuaXBwZXRzIGluXG4gICMgbXVsdGlwbGUgcnVudGltZXMgYXQgdGhlIHNhbWUgdGltZSAoYW5kIHRoYXQgY2xvY2tzIGFyZSBpbiBzeW5jKVxuICBuZXh0OiAodXNlciA9ICdkb2MnKSAtPlxuXG4gICAgIyBnZW5lcmF0ZSA5LWRpZ2l0IHRpbWVzdGFtcFxuICAgIG5leHRJZCA9IERhdGUubm93KCkudG9TdHJpbmcoMzIpXG5cbiAgICAjIGFkZCBjb3VudGVyIGlmIG11bHRpcGxlIHRyZWVzIG5lZWQgaWRzIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kXG4gICAgaWYgbGFzdElkID09IG5leHRJZFxuICAgICAgaWRDb3VudGVyICs9IDFcbiAgICBlbHNlXG4gICAgICBpZENvdW50ZXIgPSAwXG4gICAgICBsYXN0SWQgPSBuZXh0SWRcblxuICAgIFwiI3sgdXNlciB9LSN7IG5leHRJZCB9I3sgaWRDb3VudGVyIH1cIlxuIiwibG9nID0gcmVxdWlyZSgnLi9sb2cnKVxuXG4jIEZ1bmN0aW9uIHRvIGFzc2VydCBhIGNvbmRpdGlvbi4gSWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LCBhbiBlcnJvciBpc1xuIyByYWlzZWQgd2l0aCB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgYXNzZXJ0IGEgaXNudCBiLCAnYSBjYW4gbm90IGJlIGInXG4jXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2VydCA9IChjb25kaXRpb24sIG1lc3NhZ2UpIC0+XG4gIGxvZy5lcnJvcihtZXNzYWdlKSB1bmxlc3MgY29uZGl0aW9uXG4iLCJcbiMgTG9nIEhlbHBlclxuIyAtLS0tLS0tLS0tXG4jIERlZmF1bHQgbG9nZ2luZyBoZWxwZXJcbiMgQHBhcmFtczogcGFzcyBgXCJ0cmFjZVwiYCBhcyBsYXN0IHBhcmFtZXRlciB0byBvdXRwdXQgdGhlIGNhbGwgc3RhY2tcbm1vZHVsZS5leHBvcnRzID0gbG9nID0gKGFyZ3MuLi4pIC0+XG4gIGlmIHdpbmRvdy5jb25zb2xlP1xuICAgIGlmIGFyZ3MubGVuZ3RoIGFuZCBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ3RyYWNlJ1xuICAgICAgYXJncy5wb3AoKVxuICAgICAgd2luZG93LmNvbnNvbGUudHJhY2UoKSBpZiB3aW5kb3cuY29uc29sZS50cmFjZT9cblxuICAgIHdpbmRvdy5jb25zb2xlLmxvZy5hcHBseSh3aW5kb3cuY29uc29sZSwgYXJncylcbiAgICB1bmRlZmluZWRcblxuXG5kbyAtPlxuXG4gICMgQ3VzdG9tIGVycm9yIHR5cGUgZm9yIGxpdmluZ2RvY3MuXG4gICMgV2UgY2FuIHVzZSB0aGlzIHRvIHRyYWNrIHRoZSBvcmlnaW4gb2YgYW4gZXhwZWN0aW9uIGluIHVuaXQgdGVzdHMuXG4gIGNsYXNzIExpdmluZ2RvY3NFcnJvciBleHRlbmRzIEVycm9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKG1lc3NhZ2UpIC0+XG4gICAgICBzdXBlclxuICAgICAgQG1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICBAdGhyb3duQnlMaXZpbmdkb2NzID0gdHJ1ZVxuXG5cbiAgIyBAcGFyYW0gbGV2ZWw6IG9uZSBvZiB0aGVzZSBzdHJpbmdzOlxuICAjICdjcml0aWNhbCcsICdlcnJvcicsICd3YXJuaW5nJywgJ2luZm8nLCAnZGVidWcnXG4gIG5vdGlmeSA9IChtZXNzYWdlLCBsZXZlbCA9ICdlcnJvcicpIC0+XG4gICAgaWYgX3JvbGxiYXI/XG4gICAgICBfcm9sbGJhci5wdXNoIG5ldyBFcnJvcihtZXNzYWdlKSwgLT5cbiAgICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJykgYW5kIHdpbmRvdy5jb25zb2xlPy5lcnJvcj9cbiAgICAgICAgICB3aW5kb3cuY29uc29sZS5lcnJvci5jYWxsKHdpbmRvdy5jb25zb2xlLCBtZXNzYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuICAgIGVsc2VcbiAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpXG4gICAgICAgIHRocm93IG5ldyBMaXZpbmdkb2NzRXJyb3IobWVzc2FnZSlcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuXG4gICAgdW5kZWZpbmVkXG5cblxuICBsb2cuZGVidWcgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2RlYnVnJykgdW5sZXNzIGxvZy5kZWJ1Z0Rpc2FibGVkXG5cblxuICBsb2cud2FybiA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnd2FybmluZycpIHVubGVzcyBsb2cud2FybmluZ3NEaXNhYmxlZFxuXG5cbiAgIyBMb2cgZXJyb3IgYW5kIHRocm93IGV4Y2VwdGlvblxuICBsb2cuZXJyb3IgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2Vycm9yJylcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgVGhpcyBjbGFzcyBjYW4gYmUgdXNlZCB0byB3YWl0IGZvciB0YXNrcyB0byBmaW5pc2ggYmVmb3JlIGZpcmluZyBhIHNlcmllcyBvZlxuIyBjYWxsYmFja3MuIE9uY2Ugc3RhcnQoKSBpcyBjYWxsZWQsIHRoZSBjYWxsYmFja3MgZmlyZSBhcyBzb29uIGFzIHRoZSBjb3VudFxuIyByZWFjaGVzIDAuIFRodXMsIHlvdSBzaG91bGQgaW5jcmVtZW50IHRoZSBjb3VudCBiZWZvcmUgc3RhcnRpbmcgaXQuIFdoZW5cbiMgYWRkaW5nIGEgY2FsbGJhY2sgYWZ0ZXIgaGF2aW5nIGZpcmVkIGNhdXNlcyB0aGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHJpZ2h0XG4jIGF3YXkuIEluY3JlbWVudGluZyB0aGUgY291bnQgYWZ0ZXIgaXQgZmlyZWQgcmVzdWx0cyBpbiBhbiBlcnJvci5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiNcbiMgICBzZW1hcGhvcmUuaW5jcmVtZW50KClcbiMgICBkb1NvbWV0aGluZygpLnRoZW4oc2VtYXBob3JlLmRlY3JlbWVudCgpKVxuI1xuIyAgIGRvQW5vdGhlclRoaW5nVGhhdFRha2VzQUNhbGxiYWNrKHNlbWFwaG9yZS53YWl0KCkpXG4jXG4jICAgc2VtYXBob3JlLnN0YXJ0KClcbiNcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ2hlbGxvJykpXG4jXG4jICAgIyBPbmNlIGNvdW50IHJlYWNoZXMgMCBjYWxsYmFjayBpcyBleGVjdXRlZDpcbiMgICAjID0+ICdoZWxsbydcbiNcbiMgICAjIEFzc3VtaW5nIHRoYXQgc2VtYXBob3JlIHdhcyBhbHJlYWR5IGZpcmVkOlxuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5JykpXG4jICAgIyA9PiAndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5J1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZW1hcGhvcmVcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY291bnQgPSAwXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgIEB3YXNGaXJlZCA9IGZhbHNlXG4gICAgQGNhbGxiYWNrcyA9IFtdXG5cblxuICBhZGRDYWxsYmFjazogKGNhbGxiYWNrKSAtPlxuICAgIGlmIEB3YXNGaXJlZFxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHdhc0ZpcmVkXG5cblxuICBzdGFydDogLT5cbiAgICBhc3NlcnQgbm90IEBzdGFydGVkLFxuICAgICAgXCJVbmFibGUgdG8gc3RhcnQgU2VtYXBob3JlIG9uY2Ugc3RhcnRlZC5cIlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICBpbmNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAd2FzRmlyZWQsXG4gICAgICBcIlVuYWJsZSB0byBpbmNyZW1lbnQgY291bnQgb25jZSBTZW1hcGhvcmUgaXMgZmlyZWQuXCJcbiAgICBAY291bnQgKz0gMVxuXG5cbiAgZGVjcmVtZW50OiAtPlxuICAgIGFzc2VydCBAY291bnQgPiAwLFxuICAgICAgXCJVbmFibGUgdG8gZGVjcmVtZW50IGNvdW50IHJlc3VsdGluZyBpbiBuZWdhdGl2ZSBjb3VudC5cIlxuICAgIEBjb3VudCAtPSAxXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIHdhaXQ6IC0+XG4gICAgQGluY3JlbWVudCgpXG4gICAgPT4gQGRlY3JlbWVudCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGZpcmVJZlJlYWR5OiAtPlxuICAgIGlmIEBjb3VudCA9PSAwICYmIEBzdGFydGVkID09IHRydWVcbiAgICAgIEB3YXNGaXJlZCA9IHRydWVcbiAgICAgIGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpc0VtcHR5OiAob2JqKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBvYmo/XG4gICAgZm9yIG5hbWUgb2Ygb2JqXG4gICAgICByZXR1cm4gZmFsc2UgaWYgb2JqLmhhc093blByb3BlcnR5KG5hbWUpXG5cbiAgICB0cnVlXG5cblxuICBmbGF0Q29weTogKG9iaikgLT5cbiAgICBjb3B5ID0gdW5kZWZpbmVkXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb3B5IHx8PSB7fVxuICAgICAgY29weVtuYW1lXSA9IHZhbHVlXG5cbiAgICBjb3B5XG4iLCIjIFN0cmluZyBIZWxwZXJzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIGluc3BpcmVkIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vZXBlbGkvdW5kZXJzY29yZS5zdHJpbmddKClcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnQ2FtZWwgQ2FzZSdcbiAgaHVtYW5pemU6IChzdHIpIC0+XG4gICAgdW5jYW1lbGl6ZWQgPSAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVpdKykvZywgJyQxICQyJykudG9Mb3dlckNhc2UoKVxuICAgIEB0aXRsZWl6ZSggdW5jYW1lbGl6ZWQgKVxuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgdG8gdXBwZXJjYXNlXG4gIGNhcGl0YWxpemUgOiAoc3RyKSAtPlxuICAgICAgc3RyID0gaWYgIXN0cj8gdGhlbiAnJyBlbHNlIFN0cmluZyhzdHIpXG4gICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgb2YgZXZlcnkgd29yZCB0byB1cHBlcmNhc2VcbiAgdGl0bGVpemU6IChzdHIpIC0+XG4gICAgaWYgIXN0cj9cbiAgICAgICcnXG4gICAgZWxzZVxuICAgICAgU3RyaW5nKHN0cikucmVwbGFjZSAvKD86XnxcXHMpXFxTL2csIChjKSAtPlxuICAgICAgICBjLnRvVXBwZXJDYXNlKClcblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnY2FtZWwtY2FzZSdcbiAgc25ha2VDYXNlOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpLnJlcGxhY2UoL1stX1xcc10rL2csICctJykudG9Mb3dlckNhc2UoKVxuXG5cbiAgIyBwcmVwZW5kIGEgcHJlZml4IHRvIGEgc3RyaW5nIGlmIGl0IGlzIG5vdCBhbHJlYWR5IHByZXNlbnRcbiAgcHJlZml4OiAocHJlZml4LCBzdHJpbmcpIC0+XG4gICAgaWYgc3RyaW5nLmluZGV4T2YocHJlZml4KSA9PSAwXG4gICAgICBzdHJpbmdcbiAgICBlbHNlXG4gICAgICBcIlwiICsgcHJlZml4ICsgc3RyaW5nXG5cblxuICAjIEpTT04uc3RyaW5naWZ5IHdpdGggcmVhZGFiaWxpdHkgaW4gbWluZFxuICAjIEBwYXJhbSBvYmplY3Q6IGphdmFzY3JpcHQgb2JqZWN0XG4gIHJlYWRhYmxlSnNvbjogKG9iaikgLT5cbiAgICBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIDIpICMgXCJcXHRcIlxuXG4gIGNhbWVsaXplOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICAgICBjLnRvVXBwZXJDYXNlKClcbiAgICApXG5cbiAgdHJpbTogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG5cblxuICAjIGNhbWVsaXplOiAoc3RyKSAtPlxuICAjICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgIyAgICAgYy50b1VwcGVyQ2FzZSgpXG5cbiAgIyBjbGFzc2lmeTogKHN0cikgLT5cbiAgIyAgICQudGl0bGVpemUoU3RyaW5nKHN0cikucmVwbGFjZSgvW1xcV19dL2csICcgJykpLnJlcGxhY2UoL1xccy9nLCAnJylcblxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVmYXVsdEltYWdlTWFuYWdlclxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgICMgZW1wdHlcblxuXG4gIHNldDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMFxuXG5cbiAgaXNJbWdUYWc6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG4iLCJEZWZhdWx0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX21hbmFnZXInKVxuUmVzcmNpdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlZmF1bHRJbWFnZU1hbmFnZXIgPSBuZXcgRGVmYXVsdEltYWdlTWFuYWdlcigpXG4gIHJlc3JjaXRJbWFnZU1hbmFnZXIgPSBuZXcgUmVzcmNpdEltYWdlTWFuYWdlcigpXG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUsIGltYWdlU2VydmljZSkgLT5cbiAgICBpbWFnZU1hbmFnZXIgPSBAX2dldEltYWdlTWFuYWdlcihpbWFnZVNlcnZpY2UpXG4gICAgaW1hZ2VNYW5hZ2VyLnNldCgkZWxlbSwgdmFsdWUpXG5cblxuICBfZ2V0SW1hZ2VNYW5hZ2VyOiAoaW1hZ2VTZXJ2aWNlKSAtPlxuICAgIHN3aXRjaCBpbWFnZVNlcnZpY2VcbiAgICAgIHdoZW4gJ3Jlc3JjLml0JyB0aGVuIHJlc3JjaXRJbWFnZU1hbmFnZXJcbiAgICAgIGVsc2VcbiAgICAgICAgZGVmYXVsdEltYWdlTWFuYWdlclxuXG5cbiAgZ2V0RGVmYXVsdEltYWdlTWFuYWdlcjogLT5cbiAgICBkZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cblxuICBnZXRSZXNyY2l0SW1hZ2VNYW5hZ2VyOiAtPlxuICAgIHJlc3JjaXRJbWFnZU1hbmFnZXJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciB9KSAtPlxuICAgIGFzc2VydCBAc25pcHBldFRyZWUsICdubyBzbmlwcGV0IHRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAc25pcHBldFZpZXdzID0ge31cblxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgaWYgJGluc2VydC5sZW5ndGhcbiAgICAgICAgQCR3cmFwcGVyID0gQCRyb290XG4gICAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgICAgQCRyb290ID0gJGluc2VydFxuXG4gICAgIyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgc25pcHBldFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBzbmlwcGV0IHRyZWVcbiAgICBAJHJvb3QuZGF0YSgnc25pcHBldFRyZWUnLCBAc25pcHBldFRyZWUpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEBzZXRSb290KClcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnMoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIFNuaXBwZXQgVHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRBZGRlZC5hZGQoICQucHJveHkoQHNuaXBwZXRBZGRlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0UmVtb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRSZW1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRNb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRNb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBzbmlwcGV0QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBzbmlwcGV0SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cblxuICBzbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbClcblxuICAgIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdTbmlwcGV0IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlci4nKVxuXG4gICAgc25pcHBldFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuICAgIHNuaXBwZXRWaWV3LnNldEF0dGFjaGVkVG9Eb20odHJ1ZSlcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQoc25pcHBldFZpZXcpXG4gICAgQGF0dGFjaENoaWxkU25pcHBldHMobW9kZWwpXG5cblxuICBpc1NuaXBwZXRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLmlzQXR0YWNoZWRUb0RvbVxuXG5cbiAgYXR0YWNoQ2hpbGRTbmlwcGV0czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc1NuaXBwZXRBdHRhY2hlZChjaGlsZE1vZGVsKVxuICAgICAgICBAaW5zZXJ0U25pcHBldChjaGlsZE1vZGVsKVxuXG5cbiAgaW5zZXJ0U25pcHBldEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JTbmlwcGV0KHNpYmxpbmcpW21ldGhvZF0oQCRub2RlRm9yU25pcHBldChtb2RlbCkpXG5cblxuICBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5hcHBlbmRUbyhAJG5vZGVGb3JDb250YWluZXIobW9kZWwucGFyZW50Q29udGFpbmVyKSlcblxuXG4gICRub2RlRm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLiRodG1sXG5cblxuICAkbm9kZUZvckNvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIuaXNSb290XG4gICAgICBAJHJvb3RcbiAgICBlbHNlXG4gICAgICBwYXJlbnRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChjb250YWluZXIucGFyZW50U25pcHBldClcbiAgICAgICQocGFyZW50Vmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGNvbnRhaW5lci5uYW1lKSlcblxuXG4gIHJlbW92ZVNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmRldGFjaCgpXG5cbiIsIkRlZmF1bHRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2VfbWFuYWdlcicpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNjcml0SW1hZ2VNYW5hZ2VyIGV4dGVuZHMgRGVmYXVsdEltYWdlTWFuYWdlclxuXG4gIEByZXNyY2l0VXJsOiAnaHR0cDovL2FwcC5yZXNyYy5pdC8nXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIEBzZXRCYXNlNjQoJGVsZW0sIHZhbHVlKSBpZiBAaXNCYXNlNjQodmFsdWUpXG5cbiAgICBhc3NlcnQgdmFsdWU/ICYmIHZhbHVlICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgQHJlc2V0U3JjQXR0cmlidXRlKCRlbGVtKSBpZiAkZWxlbS5hdHRyKCdzcmMnKSAmJiBAaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgICAkZWxlbS5hdHRyKCdkYXRhLXNyYycsIFwiI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3t2YWx1ZX1cIilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgje1Jlc2NyaXRJbWFnZU1hbmFnZXIucmVzcmNpdFVybH0jeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBTZXQgc3JjIGRpcmVjdGx5LCBkb24ndCBhZGQgcmVzcmMgY2xhc3NcbiAgc2V0QmFzZTY0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICByZXNldFNyY0F0dHJpYnV0ZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuSW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50LCBAbW9kZWwudGVtcG9yYXJ5Q29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQsIHNlc3Npb25Db250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBpZiBzZXNzaW9uQ29udGVudFtuYW1lXT9cbiAgICAgICAgQHNldChuYW1lLCBzZXNzaW9uQ29udGVudFtuYW1lXSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIGlmIEBoYXNGb2N1cygpXG5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0udG9nZ2xlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIsIEJvb2xlYW4odmFsdWUpKVxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICAgIEltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0UGxhY2Vob2xkZXIgPSAkLnByb3h5KEBzZXRQbGFjZWhvbGRlckltYWdlLCB0aGlzLCAkZWxlbSlcbiAgICAgIEBkZWxheVVudGlsQXR0YWNoZWQobmFtZSwgc2V0UGxhY2Vob2xkZXIpXG5cblxuICBzZXRQbGFjZWhvbGRlckltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGlmICRlbGVtWzBdLm5vZGVOYW1lID09ICdJTUcnXG4gICAgICB3aWR0aCA9ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGggPSAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICB2YWx1ZSA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8je3dpZHRofXgje2hlaWdodH0vQkVGNTZGL0IyRTY2OFwiXG4gICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpW25hbWVdIGlmIEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVxuICAgIEltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpXG5cblxuICBzdHlsZTogKG5hbWUsIGNsYXNzTmFtZSkgLT5cbiAgICBjaGFuZ2VzID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXS5jc3NDbGFzc0NoYW5nZXMoY2xhc3NOYW1lKVxuICAgIGlmIGNoYW5nZXMucmVtb3ZlXG4gICAgICBmb3IgcmVtb3ZlQ2xhc3MgaW4gY2hhbmdlcy5yZW1vdmVcbiAgICAgICAgQCRodG1sLnJlbW92ZUNsYXNzKHJlbW92ZUNsYXNzKVxuXG4gICAgQCRodG1sLmFkZENsYXNzKGNoYW5nZXMuYWRkKVxuXG5cbiAgIyBEaXNhYmxlIHRhYmJpbmcgZm9yIHRoZSBjaGlsZHJlbiBvZiBhbiBlbGVtZW50LlxuICAjIFRoaXMgaXMgdXNlZCBmb3IgaHRtbCBjb250ZW50IHNvIGl0IGRvZXMgbm90IGRpc3J1cHQgdGhlIHVzZXJcbiAgIyBleHBlcmllbmNlLiBUaGUgdGltZW91dCBpcyB1c2VkIGZvciBjYXNlcyBsaWtlIHR3ZWV0cyB3aGVyZSB0aGVcbiAgIyBpZnJhbWUgaXMgZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IHdpdGggYSBkZWxheS5cbiAgZGlzYWJsZVRhYmJpbmc6ICgkZWxlbSkgLT5cbiAgICBzZXRUaW1lb3V0KCA9PlxuICAgICAgJGVsZW0uZmluZCgnaWZyYW1lJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICwgNDAwKVxuXG5cbiAgIyBBcHBlbmQgYSBjaGlsZCB0byB0aGUgZWxlbWVudCB3aGljaCB3aWxsIGJsb2NrIHVzZXIgaW50ZXJhY3Rpb25cbiAgIyBsaWtlIGNsaWNrIG9yIHRvdWNoIGV2ZW50cy4gQWxzbyB0cnkgdG8gcHJldmVudCB0aGUgdXNlciBmcm9tIGdldHRpbmdcbiAgIyBmb2N1cyBvbiBhIGNoaWxkIGVsZW1udCB0aHJvdWdoIHRhYmJpbmcuXG4gIGJsb2NrSW50ZXJhY3Rpb246ICgkZWxlbSkgLT5cbiAgICBAZW5zdXJlUmVsYXRpdmVQb3NpdGlvbigkZWxlbSlcbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuaW50ZXJhY3Rpb25CbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgJGVsZW0uYXBwZW5kKCRibG9ja2VyKVxuXG4gICAgQGRpc2FibGVUYWJiaW5nKCRlbGVtKVxuXG5cbiAgIyBNYWtlIHN1cmUgdGhhdCBhbGwgYWJzb2x1dGUgcG9zaXRpb25lZCBjaGlsZHJlbiBhcmUgcG9zaXRpb25lZFxuICAjIHJlbGF0aXZlIHRvICRlbGVtLlxuICBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uOiAoJGVsZW0pIC0+XG4gICAgcG9zaXRpb24gPSAkZWxlbS5jc3MoJ3Bvc2l0aW9uJylcbiAgICBpZiBwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdmaXhlZCcgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJ1xuICAgICAgJGVsZW0uY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXG5cblxuICBnZXQkY29udGFpbmVyOiAtPlxuICAgICQoZG9tLmZpbmRDb250YWluZXIoQCRodG1sWzBdKS5ub2RlKVxuXG5cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0VHJlZSwgQHBhcmVudCkgLT5cbiAgICBAcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgQGlzSW50ZXJhY3RpdmUgPSBmYWxzZVxuXG5cbiAgIyBBdmFpbGFibGUgT3B0aW9uczpcbiAgIyBSZWFkT25seSB2aWV3OiAoZGVmYXVsdCBpZiBub3RoaW5nIGlzIHNwZWNpZmllZClcbiAgIyBjcmVhdGUocmVhZE9ubHk6IHRydWUpXG4gICNcbiAgIyBJbmVyYWN0aXZlIHZpZXc6XG4gICMgY3JlYXRlKGludGVyYWN0aXZlOiB0cnVlKVxuICAjXG4gICMgV3JhcHBlcjogKERPTSBub2RlIHRoYXQgaGFzIHRvIGNvbnRhaW4gYSBub2RlIHdpdGggY2xhc3MgJy5kb2Mtc2VjdGlvbicpXG4gICMgY3JlYXRlKCAkd3JhcHBlcjogJCgnPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj4nKSApXG4gIGNyZWF0ZTogKG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZUlGcmFtZShAcGFyZW50KS50aGVuIChpZnJhbWUsIHJlbmRlck5vZGUpID0+XG4gICAgICBAaWZyYW1lID0gaWZyYW1lXG4gICAgICByZW5kZXJlciA9IEBjcmVhdGVJRnJhbWVSZW5kZXJlcihpZnJhbWUsIG9wdGlvbnMpXG5cbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICBob3N0V2luZG93OiBpZnJhbWUuY29udGVudFdpbmRvd1xuICAgICAgZGVzaWduOiBAc25pcHBldFRyZWUuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcbiAgICByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgJHdyYXBwZXI6IG9wdGlvbnMuJHdyYXBwZXJcblxuXG4gIGNyZWF0ZVBhZ2U6IChwYXJhbXMsIHsgaW50ZXJhY3RpdmUsIHJlYWRPbmx5IH09e30pIC0+XG4gICAgaWYgaW50ZXJhY3RpdmU/XG4gICAgICBAaXNJbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIG5ldyBJbnRlcmFjdGl2ZVBhZ2UocGFyYW1zKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQYWdlKHBhcmFtcylcblxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuICAgICAgbGluay5ocmVmID0gdXJsXG4gICAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgIEBtYXJrVXJsQXNMb2FkZWQodXJsKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBAcHJpdmF0ZVxuICBtYXJrVXJsQXNMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMucHVzaCh1cmwpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuRm9jdXMgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9mb2N1cycpXG5FZGl0YWJsZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyJylcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcblNuaXBwZXREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnJylcblxuIyBBbiBJbnRlcmFjdGl2ZVBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFsbG93cyBmb3IgbWFuaXB1bGF0aW9uIG9mIHRoZVxuIyByZW5kZXJlZCBTbmlwcGV0VHJlZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW50ZXJhY3RpdmVQYWdlIGV4dGVuZHMgUGFnZVxuXG4gIExFRlRfTU9VU0VfQlVUVE9OID0gMVxuXG4gIGlzUmVhZE9ubHk6IGZhbHNlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgaG9zdFdpbmRvdyB9PXt9KSAtPlxuICAgIHN1cGVyXG5cbiAgICBAZm9jdXMgPSBuZXcgRm9jdXMoKVxuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPSBuZXcgRWRpdGFibGVDb250cm9sbGVyKHRoaXMpXG5cbiAgICAjIGV2ZW50c1xuICAgIEBpbWFnZUNsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAaHRtbEVsZW1lbnRDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgQHNuaXBwZXRXYXNEcm9wcGVkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG4gICAgQGZvY3VzLnNuaXBwZXRGb2N1cy5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEZvY3VzZWQsIHRoaXMpIClcbiAgICBAZm9jdXMuc25pcHBldEJsdXIuYWRkKCAkLnByb3h5KEBhZnRlclNuaXBwZXRCbHVycmVkLCB0aGlzKSApXG4gICAgQGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5KClcbiAgICBAJGRvY3VtZW50XG4gICAgICAub24oJ21vdXNlZG93bi5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbigndG91Y2hzdGFydC5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgJC5wcm94eShAYnJvd3NlckRyYWdTdGFydCwgdGhpcykpXG5cblxuICBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeTogLT5cbiAgICBpZiBjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGU/XG4gICAgICBAY3NzTG9hZGVyLmxvYWQoY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG5cbiAgICAjIElnbm9yZSBpbnRlcmFjdGlvbnMgb24gY2VydGFpbiBlbGVtZW50c1xuICAgIGlzQ29udHJvbCA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KGNvbmZpZy5pZ25vcmVJbnRlcmFjdGlvbikubGVuZ3RoXG4gICAgcmV0dXJuIGlmIGlzQ29udHJvbFxuXG4gICAgIyBJZGVudGlmeSB0aGUgY2xpY2tlZCBzbmlwcGV0XG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcblxuICAgICMgVGhpcyBpcyBjYWxsZWQgaW4gbW91c2Vkb3duIHNpbmNlIGVkaXRhYmxlcyBnZXQgZm9jdXMgb24gbW91c2Vkb3duXG4gICAgIyBhbmQgb25seSBiZWZvcmUgdGhlIGVkaXRhYmxlcyBjbGVhciB0aGVpciBwbGFjZWhvbGRlciBjYW4gd2Ugc2FmZWx5XG4gICAgIyBpZGVudGlmeSB3aGVyZSB0aGUgdXNlciBoYXMgY2xpY2tlZC5cbiAgICBAaGFuZGxlQ2xpY2tlZFNuaXBwZXQoZXZlbnQsIHNuaXBwZXRWaWV3KVxuXG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBzdGFydERyYWdcbiAgICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICAgIGV2ZW50OiBldmVudFxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNhbmNlbERyYWc6IC0+XG4gICAgQGRyYWdCYXNlLmNhbmNlbCgpXG5cblxuICBoYW5kbGVDbGlja2VkU25pcHBldDogKGV2ZW50LCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgQGZvY3VzLnNuaXBwZXRGb2N1c2VkKHNuaXBwZXRWaWV3KVxuXG4gICAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoc25pcHBldFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQGZvY3VzLmJsdXIoKVxuXG5cbiAgZ2V0Rm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhzbmlwcGV0VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlclNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyU25pcHBldEJsdXJyZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBzbmlwcGV0Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwiUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzX2xvYWRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIHNldFJlbmRlck5vZGU6IChyZW5kZXJOb2RlKSAtPlxuICAgIHJlbmRlck5vZGUgPz0gJChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiLCBAJGJvZHkpXG4gICAgaWYgcmVuZGVyTm9kZS5qcXVlcnlcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVswXVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgaWYgQGRlc2lnbj8gJiYgY29uZmlnLmxvYWRSZXNvdXJjZXNcbiAgICAgIGRlc2lnblBhdGggPSBcIiN7IGNvbmZpZy5kZXNpZ25QYXRoIH0vI3sgQGRlc2lnbi5uYW1lc3BhY2UgfVwiXG4gICAgICBjc3NMb2NhdGlvbiA9IGlmIEBkZXNpZ24uY3NzP1xuICAgICAgICBAZGVzaWduLmNzc1xuICAgICAgZWxzZVxuICAgICAgICAnL2Nzcy9zdHlsZS5jc3MnXG5cbiAgICAgIHBhdGggPSBcIiN7IGRlc2lnblBhdGggfSN7IGNzc0xvY2F0aW9uIH1cIlxuICAgICAgQGNzc0xvYWRlci5sb2FkKHBhdGgsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICBzZXRXaW5kb3c6IChob3N0V2luZG93KSAtPlxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93IHx8IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxuIyBBIFJlbmRlcmluZ0NvbnRhaW5lciBpcyB1c2VkIGJ5IHRoZSBSZW5kZXJlciB0byBnZW5lcmF0ZSBIVE1MLlxuI1xuIyBUaGUgUmVuZGVyZXIgaW5zZXJ0cyBTbmlwcGV0Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPSAkKCc8ZGl2Lz4nKVswXVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEBiZWZvcmVSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGh0bWw6IC0+XG4gICAgJChAcmVuZGVyTm9kZSkuaHRtbCgpXG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3Igc25pcHBldHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIFNuaXBwZXRBcnJheSB0aGF0IHdvcmtzIHNpbWlsYXIgdG8gYSBqUXVlcnkgb2JqZWN0LlxuIyBGb3IgZXh0ZW5zaWJpbGl0eSB2aWEgcGx1Z2lucyB3ZSBleHBvc2UgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0QXJyYXlcblxuXG4gICMgQHBhcmFtIHNuaXBwZXRzOiBhcnJheSBvZiBzbmlwcGV0c1xuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0cykgLT5cbiAgICBAc25pcHBldHMgPSBbXSB1bmxlc3MgQHNuaXBwZXRzP1xuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAc25pcHBldHNcbiAgICAgIEBbaW5kZXhdID0gcmVzdWx0XG5cbiAgICBAbGVuZ3RoID0gQHNuaXBwZXRzLmxlbmd0aFxuICAgIGlmIEBzbmlwcGV0cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAc25pcHBldHMubGVuZ3RoIC0gMV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3Igc25pcHBldCBpbiBAc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICByZW1vdmU6ICgpIC0+XG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBTbmlwcGV0Q29udGFpbmVyXG4jIC0tLS0tLS0tLS0tLS0tLS1cbiMgQSBTbmlwcGV0Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2Ygc25pcHBldHMuXG4jXG4jIFRoZSBzbmlwcGV0Q29udGFpbmVyIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIGl0cyBzbmlwcGV0VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgcGFyZW50U25pcHBldDogcGFyZW50IFNuaXBwZXRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Q29udGFpbmVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQHBhcmVudFNuaXBwZXQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBwYXJlbnRTbmlwcGV0XG4gICAgICBhc3NlcnQgc25pcHBldCBpc250IEBwYXJlbnRTbmlwcGV0LCAnY2Fubm90IGFwcGVuZCBzbmlwcGV0IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5wcmV2aW91cyA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIG5leHQ6IHNuaXBwZXRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5uZXh0ID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0XG4gICAgICBuZXh0OiBzbmlwcGV0Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICB1cDogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIEBpbnNlcnRCZWZvcmUoc25pcHBldC5wcmV2aW91cywgc25pcHBldClcblxuXG4gIGRvd246IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihzbmlwcGV0Lm5leHQsIHNuaXBwZXQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWUgfHwgQHBhcmVudFNuaXBwZXQ/LnNuaXBwZXRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldCA9IEBmaXJzdFxuICAgIHdoaWxlIChzbmlwcGV0KVxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHMgYW5kIGNvbnRhaW5lcnNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldC5kZXN0cm95KClcbiAgICBAX2RldGFjaFNuaXBwZXQoc25pcHBldClcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgRXZlcnkgc25pcHBldCBhZGRlZCBvciBtb3ZlZCBtb3N0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQGFwaSBwcml2YXRlXG4gIGF0dGFjaFNuaXBwZXQ6IChzbmlwcGV0LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoc25pcHBldCwgcG9zaXRpb24pXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5hdHRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IHNuaXBwZXQgdGhhdCBpcyByZW1vdmVkIG11c3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBTbmlwcGV0cyB0aGF0IGFyZSBtb3ZlZCBpbnNpZGUgYSBzbmlwcGV0VHJlZSBzaG91bGQgbm90XG4gICMgY2FsbCBfZGV0YWNoU25pcHBldCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBTbmlwcGV0UmVtb3ZlZCBldmVudHMgb24gdGhlIHNuaXBwZXQgdHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaFNuaXBwZXQ6IChzbmlwcGV0KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQHVubGluayhzbmlwcGV0KVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuZGV0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgbGluazogKHNuaXBwZXQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoc25pcHBldCkgaWYgc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIHBvc2l0aW9uLnBhcmVudENvbnRhaW5lciB8fD0gdGhpc1xuICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwgcG9zaXRpb24pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICB1bmxpbms6IChzbmlwcGV0KSAtPlxuICAgIGNvbnRhaW5lciA9IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gc25pcHBldC5uZXh0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgY29udGFpbmVyLmxhc3QgPSBzbmlwcGV0LnByZXZpb3VzIHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cbiAgICAgICMgdXBkYXRlIHByZXZpb3VzIGFuZCBuZXh0IG5vZGVzXG4gICAgICBzbmlwcGV0Lm5leHQ/LnByZXZpb3VzID0gc25pcHBldC5wcmV2aW91c1xuICAgICAgc25pcHBldC5wcmV2aW91cz8ubmV4dCA9IHNuaXBwZXQubmV4dFxuXG4gICAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHt9KVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgc2V0U25pcHBldFBvc2l0aW9uOiAoc25pcHBldCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgc25pcHBldC5wYXJlbnRDb250YWluZXIgPSBwYXJlbnRDb250YWluZXJcbiAgICBzbmlwcGV0LnByZXZpb3VzID0gcHJldmlvdXNcbiAgICBzbmlwcGV0Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBzbmlwcGV0IGlmIHByZXZpb3VzXG4gICAgICBuZXh0LnByZXZpb3VzID0gc25pcHBldCBpZiBuZXh0XG4gICAgICBwYXJlbnRDb250YWluZXIuZmlyc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgcGFyZW50Q29udGFpbmVyLmxhc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5zZXJpYWxpemF0aW9uID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZXJpYWxpemF0aW9uJylcblxuIyBTbmlwcGV0TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggU25pcHBldE1vZGVsIGhhcyBhIHRlbXBsYXRlIHdoaWNoIGFsbG93cyB0byBnZW5lcmF0ZSBhIHNuaXBwZXRWaWV3XG4jIGZyb20gYSBzbmlwcGV0TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBTbmlwcGV0VHJlZS5cbiMgRXZlcnkgU25pcHBldE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChTbmlwcGV0Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIHNuaXBwZXRzKSBhbmQgbXVsdGlwbGUgY29udGFpbmVycyAoU25pcHBldENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIFNuaXBwZXRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IFNuaXBwZXRDb250YWluZXJcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgc25pcHBldCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEB0ZW1wb3JhcnlDb250ZW50ID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICBoYXNDb250YWluZXJzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdjb250YWluZXInKSA+IDBcblxuXG4gIGhhc0VkaXRhYmxlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnZWRpdGFibGUnKSA+IDBcblxuXG4gIGhhc0h0bWw6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2h0bWwnKSA+IDBcblxuXG4gIGhhc0ltYWdlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaW1hZ2UnKSA+IDBcblxuXG4gIGJlZm9yZTogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAcHJldmlvdXNcblxuXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gIGFwcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLnByZXBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHJlc2V0Vm9sYXRpbGVWYWx1ZTogKG5hbWUsIHRyaWdnZXJDaGFuZ2VFdmVudD10cnVlKSAtPlxuICAgIGRlbGV0ZSBAdGVtcG9yYXJ5Q29udGVudFtuYW1lXVxuICAgIGlmIHRyaWdnZXJDaGFuZ2VFdmVudFxuICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlLCBmbGFnPScnKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcInNldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgaWYgZmxhZyA9PSAndGVtcG9yYXJ5T3ZlcnJpZGUnXG4gICAgICBzdG9yYWdlQ29udGFpbmVyID0gQHRlbXBvcmFyeUNvbnRlbnRcbiAgICBlbHNlXG4gICAgICBAcmVzZXRWb2xhdGlsZVZhbHVlKG5hbWUsIGZhbHNlKSAjIGFzIHNvb24gYXMgd2UgZ2V0IHJlYWwgY29udGVudCwgcmVzZXQgdGhlIHRlbXBvcmFyeUNvbnRlbnRcbiAgICAgIHN0b3JhZ2VDb250YWluZXIgPSBAY29udGVudFxuXG4gICAgaWYgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSAhPSB2YWx1ZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSA9IHZhbHVlXG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBjb250ZW50W25hbWVdXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBzbmlwcGV0VHJlZSAmJiBjaGFuZ2VkRGF0YVByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBAc25pcHBldFRyZWUuZGF0YUNoYW5naW5nKHRoaXMsIGNoYW5nZWREYXRhUHJvcGVydGllcylcbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1thcmddXG5cblxuICBjaGFuZ2VEYXRhOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgZGVlcEVxdWFsKEBkYXRhVmFsdWVzW25hbWVdLCB2YWx1ZSkgPT0gZmFsc2VcbiAgICAgIEBkYXRhVmFsdWVzW25hbWVdID0gdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG5cbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2UgaWYgbm90IHN0eWxlLnZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBsb2cud2FybiBcIkludmFsaWQgdmFsdWUgJyN7IHZhbHVlIH0nIGZvciBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQHNuaXBwZXRUcmVlXG4gICAgICAgICAgQHNuaXBwZXRUcmVlLmh0bWxDaGFuZ2luZyh0aGlzLCAnc3R5bGUnLCB7IG5hbWUsIHZhbHVlIH0pXG5cblxuICBjb3B5OiAtPlxuICAgIGxvZy53YXJuKFwiU25pcHBldE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBTbmlwcGV0TW9kZWwuZnJvbUpzb24oanNvbilcblxuXG4gIGNvcHlXaXRob3V0Q29udGVudDogLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG5cbiAgIyBtb3ZlIHVwIChwcmV2aW91cylcbiAgdXA6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci51cCh0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgbW92ZSBkb3duIChuZXh0KVxuICBkb3duOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIuZG93bih0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgcmVtb3ZlIFRyZWVOb2RlIGZyb20gaXRzIGNvbnRhaW5lciBhbmQgU25pcHBldFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiAgICAjIHJlbW92ZSB1c2VyIGludGVyZmFjZSBlbGVtZW50c1xuICAgIEB1aUluamVjdG9yLnJlbW92ZSgpIGlmIEB1aUluamVjdG9yXG5cblxuICBnZXRQYXJlbnQ6IC0+XG4gICAgIEBwYXJlbnRDb250YWluZXI/LnBhcmVudFNuaXBwZXRcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgQHNuaXBwZXRUcmVlLnJlbmRlcmVyLmNyZWF0ZUludGVyZmFjZUluamVjdG9yKHRoaXMpXG4gICAgQHVpSW5qZWN0b3JcblxuXG4gICMgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tXG5cbiAgcGFyZW50czogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLmdldFBhcmVudCgpKVxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwuZGVzY2VuZGFudHMoY2FsbGJhY2spXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIHNuaXBwZXRNb2RlbClcbiAgZGVzY2VuZGFudENvbnRhaW5lcnM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpID0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpIGlmIHNuaXBwZXRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgdG9Kc29uOiAtPlxuXG4gICAganNvbiA9XG4gICAgICBpZDogQGlkXG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAY29udGVudClcbiAgICAgIGpzb24uY29udGVudCA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQGNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBzdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQHN0eWxlcylcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuU25pcHBldE1vZGVsLmZyb21Kc29uID0gKGpzb24sIGRlc2lnbikgLT5cbiAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uaWRlbnRpZmllcilcblxuICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gdGVtcGxhdGUgaWRlbnRpZmllciAnI3sganNvbi5pZGVudGlmaWVyIH0nXCJcblxuICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcbiAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICBmb3Igc3R5bGVOYW1lLCB2YWx1ZSBvZiBqc29uLnN0eWxlc1xuICAgIG1vZGVsLnN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gIGZvciBjb250YWluZXJOYW1lLCBzbmlwcGV0QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgIGlmIHNuaXBwZXRBcnJheVxuICAgICAgYXNzZXJ0ICQuaXNBcnJheShzbmlwcGV0QXJyYXkpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgZm9yIGNoaWxkIGluIHNuaXBwZXRBcnJheVxuICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgbW9kZWxcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2FycmF5JylcblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4vc25pcHBldF9tb2RlbCcpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBTbmlwcGV0VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgIyBJbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICBnZXRTbmlwcGV0OiAoc25pcHBldE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXROYW1lID09ICdzdHJpbmcnXG4gICAgICBAY3JlYXRlTW9kZWwoc25pcHBldE5hbWUpXG4gICAgZWxzZVxuICAgICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6IC0+XG4gICAgQGNyZWF0ZU1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuXG4gIGdldFRlbXBsYXRlOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBkZXNpZ24uZ2V0KGlkZW50aWZpZXIpXG4gICAgYXNzZXJ0IHRlbXBsYXRlLCBcIkNvdWxkIG5vdCBmaW5kIHRlbXBsYXRlICN7IGlkZW50aWZpZXIgfVwiXG4gICAgdGVtcGxhdGVcblxuXG4gIGluaXRpYWxpemVFdmVudHM6ICgpIC0+XG5cbiAgICAjIGxheW91dCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRNb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgICMgY29udGVudCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0U2V0dGluZ3NDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgR2V0IHRoZSBmaXJzdCBzbmlwcGV0XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgICAgaWYgc25pcHBldC5pZGVudGlmaWVyID09IHNlYXJjaCB8fCBzbmlwcGV0LnRlbXBsYXRlLmlkID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKHNuaXBwZXQpXG5cbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkocmVzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgIG9sZFJvb3RcblxuXG4gICMgZWFjaFdpdGhQYXJlbnRzOiAoc25pcHBldCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goc25pcHBldClcbiAgIyAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAjICAgICBzbmlwcGV0ID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICMgICAgIHdoaWxlIChzbmlwcGV0KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoc25pcHBldCwgcGFyZW50cylcbiAgIyAgICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdTbmlwcGV0VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIHRlbXBsYXRlID0gc25pcHBldC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUudGl0bGUgfSAoI3sgdGVtcGxhdGUuaWRlbnRpZmllciB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGFkZExpbmUoXCIjeyBuYW1lIH06XCIsIGluZGVudGF0aW9uICsgMilcbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBpbmRlbnRhdGlvbikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIHNuaXBwZXRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBzbmlwcGV0Q29udGFpbmVyc1xuXG4gIGF0dGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBhdHRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBzbmlwcGV0XG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0TW92ZWQnLCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWU/XG4gICAgICAgICMgcmVtb3ZlIGZyb20gb3RoZXIgc25pcHBldCB0cmVlXG4gICAgICAgIHNuaXBwZXQuc25pcHBldENvbnRhaW5lci5kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LnNuaXBwZXRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0QWRkZWQnLCBzbmlwcGV0KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBkZXRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBhc3NlcnQgc25pcHBldC5zbmlwcGV0VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgc25pcHBldCBmcm9tIGFub3RoZXIgU25pcHBldFRyZWUnXG5cbiAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoU25pcHBldEZ1bmMoKVxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRSZW1vdmVkJywgc25pcHBldClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldENvbnRlbnRDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGh0bWxDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldEh0bWxDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGRhdGFDaGFuZ2luZzogKHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXREYXRhQ2hhbmdlZCcsIHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lc3BhY2UgfVxuXG4gICAgc25pcHBldFRvRGF0YSA9IChzbmlwcGV0LCBsZXZlbCwgY29udGFpbmVyQXJyYXkpIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggc25pcHBldERhdGFcbiAgICAgIHNuaXBwZXREYXRhXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXRUb0RhdGEoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IHNuaXBwZXREYXRhLmNvbnRhaW5lcnNbc25pcHBldENvbnRhaW5lci5uYW1lXSA9IFtdXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGxldmVsLCBkYXRhT2JqKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgIyBJbml0aWFsaXplIGEgc25pcHBldFRyZWVcbiAgIyBUaGlzIG1ldGhvZCBzdXBwcmVzc2VzIGNoYW5nZSBldmVudHMgaW4gdGhlIHNuaXBwZXRUcmVlLlxuICAjXG4gICMgQ29uc2lkZXIgdG8gY2hhbmdlIHBhcmFtczpcbiAgIyBmcm9tRGF0YSh7IGNvbnRlbnQsIGRlc2lnbiwgc2lsZW50IH0pICMgc2lsZW50IFtib29sZWFuXTogc3VwcHJlc3MgY2hhbmdlIGV2ZW50c1xuICBmcm9tRGF0YTogKGRhdGEsIGRlc2lnbiwgc2lsZW50PXRydWUpIC0+XG4gICAgaWYgZGVzaWduP1xuICAgICAgYXNzZXJ0IG5vdCBAZGVzaWduPyB8fCBkZXNpZ24uZXF1YWxzKEBkZXNpZ24pLCAnRXJyb3IgbG9hZGluZyBkYXRhLiBTcGVjaWZpZWQgZGVzaWduIGlzIGRpZmZlcmVudCBmcm9tIGN1cnJlbnQgc25pcHBldFRyZWUgZGVzaWduJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ25cblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgICBzbmlwcGV0ID0gU25pcHBldE1vZGVsLmZyb21Kc29uKHNuaXBwZXREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChzbmlwcGV0KVxuXG4gICAgaWYgc2lsZW50XG4gICAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHRoaXNcbiAgICAgIEByb290LmVhY2ggKHNuaXBwZXQpID0+XG4gICAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB0aGlzXG5cblxuICAjIEFwcGVuZCBkYXRhIHRvIHRoaXMgc25pcHBldFRyZWVcbiAgIyBGaXJlcyBzbmlwcGV0QWRkZWQgZXZlbnQgZm9yIGV2ZXJ5IHNuaXBwZXRcbiAgYWRkRGF0YTogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAZnJvbURhdGEoZGF0YSwgZGVzaWduLCBmYWxzZSlcblxuXG4gIGFkZERhdGFXaXRoQW5pbWF0aW9uOiAoZGF0YSwgZGVsYXk9MjAwKSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgJ0Vycm9yIGFkZGluZyBkYXRhLiBTbmlwcGV0VHJlZSBoYXMgbm8gZGVzaWduJ1xuXG4gICAgdGltZW91dCA9IE51bWJlcihkZWxheSlcbiAgICBmb3Igc25pcHBldERhdGEgaW4gZGF0YS5jb250ZW50XG4gICAgICBkbyA9PlxuICAgICAgICBjb250ZW50ID0gc25pcHBldERhdGFcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIHNuaXBwZXQgPSBTbmlwcGV0TW9kZWwuZnJvbUpzb24oY29udGVudCwgQGRlc2lnbilcbiAgICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcbiAgICAgICAgLCB0aW1lb3V0XG5cbiAgICAgIHRpbWVvdXQgKz0gTnVtYmVyKGRlbGF5KVxuXG5cbiAgdG9EYXRhOiAtPlxuICAgIEBzZXJpYWxpemUoKVxuXG5cbiAgIyBBbGlhc2VzXG4gICMgLS0tLS0tLVxuXG4gIGZyb21Kc29uOiAoYXJncy4uLikgLT5cbiAgICBAZnJvbURhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHRvSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQHRvRGF0YS5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEBlbGVtKVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxuIyBBIGxpc3Qgb2YgYWxsIGRpcmVjdGl2ZXMgb2YgYSB0ZW1wbGF0ZVxuIyBFdmVyeSBub2RlIHdpdGggYW4gZG9jLSBhdHRyaWJ1dGUgd2lsbCBiZSBzdG9yZWQgYnkgaXRzIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlQ29sbGVjdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGFsbD17fSkgLT5cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgYWRkOiAoZGlyZWN0aXZlKSAtPlxuICAgIEBhc3NlcnROYW1lTm90VXNlZChkaXJlY3RpdmUpXG5cbiAgICAjIGNyZWF0ZSBwc2V1ZG8gYXJyYXlcbiAgICB0aGlzW0BsZW5ndGhdID0gZGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlLmluZGV4ID0gQGxlbmd0aFxuICAgIEBsZW5ndGggKz0gMVxuXG4gICAgIyBpbmRleCBieSBuYW1lXG4gICAgQGFsbFtkaXJlY3RpdmUubmFtZV0gPSBkaXJlY3RpdmVcblxuICAgICMgaW5kZXggYnkgdHlwZVxuICAgICMgZGlyZWN0aXZlLnR5cGUgaXMgb25lIG9mIHRob3NlICdjb250YWluZXInLCAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXSB8fD0gW11cbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXS5wdXNoKGRpcmVjdGl2ZSlcblxuXG4gIG5leHQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgfHw9IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIG5hbWVzOiAodHlwZSkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgZGlyZWN0aXZlLm5hbWVcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgcGFyc2U6IChlbGVtKSAtPlxuICAgIGVsZW1EaXJlY3RpdmUgPSB1bmRlZmluZWRcbiAgICBtb2RpZmljYXRpb25zID0gW11cbiAgICBAcGFyc2VEaXJlY3RpdmVzIGVsZW0sIChkaXJlY3RpdmUpIC0+XG4gICAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgICAgZWxlbURpcmVjdGl2ZSA9IGRpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RpZmljYXRpb25zLnB1c2goZGlyZWN0aXZlKVxuXG4gICAgQGFwcGx5TW9kaWZpY2F0aW9ucyhlbGVtRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSBpZiBlbGVtRGlyZWN0aXZlXG4gICAgcmV0dXJuIGVsZW1EaXJlY3RpdmVcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGVsZW0sIGZ1bmMpIC0+XG4gICAgZGlyZWN0aXZlRGF0YSA9IFtdXG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0ci5uYW1lXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHJpYnV0ZU5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZURhdGEucHVzaFxuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWVcbiAgICAgICAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVcbiAgICAgICAgICAgIG5hbWU6IGF0dHIudmFsdWVcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgICAgIGVsZW06IGVsZW1cblxuICAgICMgU2luY2Ugd2UgbW9kaWZ5IHRoZSBhdHRyaWJ1dGVzIHdlIGhhdmUgdG8gc3BsaXRcbiAgICAjIHRoaXMgaW50byB0d28gbG9vcHNcbiAgICBmb3IgZGF0YSBpbiBkaXJlY3RpdmVEYXRhXG4gICAgICBkaXJlY3RpdmUgPSBkYXRhLmRpcmVjdGl2ZVxuICAgICAgQHJld3JpdGVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBkYXRhLmF0dHJpYnV0ZU5hbWUpXG4gICAgICBmdW5jKGRpcmVjdGl2ZSlcblxuXG4gIGFwcGx5TW9kaWZpY2F0aW9uczogKG1haW5EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBtb2RpZmljYXRpb25zXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnb3B0aW9uYWwnXG4gICAgICAgICAgbWFpbkRpcmVjdGl2ZS5vcHRpb25hbCA9IHRydWVcblxuXG4gICMgTm9ybWFsaXplIG9yIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICMgZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgcmV3cml0ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgIGlmIGF0dHJpYnV0ZU5hbWUgIT0gZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgZWxzZSBpZiBub3QgZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUpXG4gICAgZWxzZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG5cblxuICAjIGZvcmNlIGF0dHJpYnV0ZSBzdHlsZSBhcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICMgZS5nLiBhdHRyaWJ1dGUgJ2RvYy1jb250YWluZXInIGJlY29tZXMgJ2RhdGEtZG9jLWNvbnRhaW5lcidcbiAgbm9ybWFsaXplQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGVsZW0gPSBkaXJlY3RpdmUuZWxlbVxuICAgIGlmIGF0dHJpYnV0ZU5hbWVcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgIGVsZW0uc2V0QXR0cmlidXRlKGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKSwgZGlyZWN0aXZlLm5hbWUpXG5cblxuICByZW1vdmVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZGlyZWN0aXZlLmVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIG91dHB1dCB0aGUgYWNjZXB0ZWQgY29udGVudCBvZiB0aGUgc25pcHBldFxuICAjIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBjcmVhdGVcbiAgIyBlLmc6IHsgdGl0bGU6IFwiSXRjaHkgYW5kIFNjcmF0Y2h5XCIgfVxuICBwcmludERvYzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcbiAgICAgICMgZWRpdGFibGVzOiBPYmplY3Qua2V5cyBAZWRpdGFibGVzIGlmIEBlZGl0YWJsZXNcbiAgICAgICMgY29udGFpbmVyczogT2JqZWN0LmtleXMgQGNvbnRhaW5lcnMgaWYgQGNvbnRhaW5lcnNcblxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihkb2MpXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgbmFtZXNwYWNlOiB1bmRlZmluZWQsIGlkOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IG5hbWVzcGFjZTogcGFydHNbMF0sIGlkOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2Ugc25pcHBldCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
