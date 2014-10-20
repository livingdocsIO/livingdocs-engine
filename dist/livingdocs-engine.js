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
    design: designCache,
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
    startDrag: $.proxy(editorPage, 'startDrag'),
    config: function(userConfig) {
      $.extend(true, config, userConfig);
      return augmentConfig(config);
    }
  };
})();

window.doc = doc;


},{"./configuration/augment_config":6,"./configuration/config":7,"./design/design":8,"./design/design_cache":9,"./document":11,"./modules/logging/assert":24,"./rendering_container/editor_page":33,"./snippet_tree/snippet_tree":45}],6:[function(require,module,exports){
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
      templates: templates,
      weight: group.weight
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


},{"../modules/logging/assert":24,"../modules/logging/log":25,"../template/template":51,"./design_style":10}],9:[function(require,module,exports){
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


},{"../modules/logging/assert":24,"./design":8}],10:[function(require,module,exports){
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


},{"../modules/logging/assert":24,"../modules/logging/log":25}],11:[function(require,module,exports){
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

  Document.prototype.appendTo = function(parent, options) {
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


},{"./configuration/config":7,"./interaction/dom":15,"./modules/logging/assert":24,"./rendering/renderer":29,"./rendering/view":31,"./rendering_container/interactive_page":34,"./rendering_container/page":35,"./rendering_container/rendering_container":36,"wolfy87-eventemitter":4}],12:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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


},{"../modules/logging/assert":24,"./default_image_service":12,"./resrcit_image_service":14}],14:[function(require,module,exports){
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


},{"../modules/logging/assert":24,"./default_image_service":12}],15:[function(require,module,exports){
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


},{"../configuration/config":7}],16:[function(require,module,exports){
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


},{"../configuration/config":7}],17:[function(require,module,exports){
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


},{"../configuration/config":7,"./dom":15}],18:[function(require,module,exports){
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


},{"./dom":15}],19:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/feature_detection/is_supported":22,"./dom":15}],20:[function(require,module,exports){
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


},{}],21:[function(require,module,exports){
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


},{}],22:[function(require,module,exports){
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


},{"./feature_detects":21}],23:[function(require,module,exports){
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


},{}],24:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":25}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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


},{"../modules/logging/assert":24}],27:[function(require,module,exports){
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


},{}],28:[function(require,module,exports){
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


},{}],29:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/logging/assert":24,"../modules/logging/log":25,"../modules/semaphore":26}],30:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/dom":15,"../modules/eventing":20,"../template/directive_iterator":50}],31:[function(require,module,exports){
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


},{"../rendering_container/interactive_page":34,"../rendering_container/page":35,"./renderer":29}],32:[function(require,module,exports){
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


},{"../modules/semaphore":26}],33:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/drag_base":16,"../interaction/snippet_drag":19}],34:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/dom":15,"../interaction/drag_base":16,"../interaction/editable_controller":17,"../interaction/focus":18,"../interaction/snippet_drag":19,"./page":35}],35:[function(require,module,exports){
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
      designPath = "" + config.designPath + "/" + this.design.namespace;
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


},{"../configuration/config":7,"./css_loader":32,"./rendering_container":36}],36:[function(require,module,exports){
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


},{"../modules/semaphore":26}],37:[function(require,module,exports){
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


},{"../modules/logging/assert":24}],38:[function(require,module,exports){
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


},{"../modules/logging/assert":24}],39:[function(require,module,exports){
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


},{"../image_services/image_service":13,"../modules/logging/assert":24}],40:[function(require,module,exports){
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


},{}],41:[function(require,module,exports){
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


},{"../modules/logging/assert":24}],42:[function(require,module,exports){
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


},{"../image_services/image_service":13,"../modules/logging/assert":24,"./editable_directive":37,"./html_directive":38,"./image_directive":39}],43:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/guid":23,"../modules/logging/assert":24,"../modules/logging/log":25,"../template/directive_collection":47,"./snippet_container":41,"./snippet_directive_factory":42,"deep-equal":1}],44:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/guid":23,"../modules/logging/assert":24,"../modules/logging/log":25,"../modules/serialization":27,"./snippet_model":43,"deep-equal":1}],45:[function(require,module,exports){
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


},{"../modules/logging/assert":24,"./snippet_array":40,"./snippet_container":41,"./snippet_model":43,"./snippet_model_serializer":44}],46:[function(require,module,exports){
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


},{"../configuration/config":7,"../interaction/dom":15}],47:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/logging/assert":24,"./directive":46}],48:[function(require,module,exports){
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


},{"../configuration/config":7,"./directive":46}],49:[function(require,module,exports){
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


},{"../configuration/config":7}],50:[function(require,module,exports){
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


},{"../configuration/config":7}],51:[function(require,module,exports){
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


},{"../configuration/config":7,"../modules/logging/assert":24,"../modules/logging/log":25,"../modules/words":28,"../rendering/snippet_view":30,"../snippet_tree/snippet_model":43,"./directive_collection":47,"./directive_compiler":48,"./directive_finder":49,"./directive_iterator":50}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9rZXlzLmpzIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvYnJvd3Nlcl9hcGkuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29uZmlndXJhdGlvbi9hdWdtZW50X2NvbmZpZy5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2NvbmZpZy5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fY2FjaGUuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9zdHlsZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbWFnZV9zZXJ2aWNlcy9kZWZhdWx0X2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbWFnZV9zZXJ2aWNlcy9yZXNyY2l0X2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RyYWdfYmFzZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2V2ZW50aW5nLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vZmVhdHVyZV9kZXRlY3RzLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZ3VpZC5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3JlbmRlcmVyLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3ZpZXcuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9jc3NfbG9hZGVyLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcGFnZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL2VkaXRhYmxlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvaHRtbF9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL2ltYWdlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfZGlyZWN0aXZlX2ZhY3RvcnkuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWxfc2VyaWFsaXplci5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9ncmVnb3IvRG9jdW1lbnRzL1VwZnJvbnQvcmVwb3MvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbi5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2ZpbmRlci5jb2ZmZWUiLCIvVXNlcnMvZ3JlZ29yL0RvY3VtZW50cy9VcGZyb250L3JlcG9zL2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3IuY29mZmVlIiwiL1VzZXJzL2dyZWdvci9Eb2N1bWVudHMvVXBmcm9udC9yZXBvcy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hkQSxJQUFBLDBGQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMEJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEsd0JBQVIs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QWpCLENBRlIsQ0FBQTtBQUdBLEVBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNFO0FBQUEsTUFBRSxTQUFBLEVBQVcsTUFBYjtBQUFBLE1BQXdCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFsQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFNBQUEsRUFBVyxLQUFNLENBQUEsQ0FBQSxDQUFuQjtBQUFBLE1BQXVCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFqQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsK0NBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQTdJM0IsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzLmpzJyk7XG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2xpYi9pc19hcmd1bWVudHMuanMnKTtcblxudmFyIGRlZXBFcXVhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRGF0ZSAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMy4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgYWN0dWFsICE9ICdvYmplY3QnICYmIHR5cGVvZiBleHBlY3RlZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcHRzLnN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy40LiBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID0gKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKVxufSkoKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA/IHN1cHBvcnRlZCA6IHVuc3VwcG9ydGVkO1xuXG5leHBvcnRzLnN1cHBvcnRlZCA9IHN1cHBvcnRlZDtcbmZ1bmN0aW9uIHN1cHBvcnRlZChvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuZnVuY3Rpb24gdW5zdXBwb3J0ZWQob2JqZWN0KXtcbiAgcmV0dXJuIG9iamVjdCAmJlxuICAgIHR5cGVvZiBvYmplY3QgPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdjYWxsZWUnKSAmJlxuICAgICFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCAnY2FsbGVlJykgfHxcbiAgICBmYWxzZTtcbn07XG4iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbidcbiAgPyBPYmplY3Qua2V5cyA6IHNoaW07XG5cbmV4cG9ydHMuc2hpbSA9IHNoaW07XG5mdW5jdGlvbiBzaGltIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gIHJldHVybiBrZXlzO1xufVxuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi42IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG5cdCAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cblx0ICpcblx0ICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cblx0ICovXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cblx0Ly8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblx0dmFyIGV4cG9ydHMgPSB0aGlzO1xuXHR2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXQncyBzdG9yYWdlIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cblx0ICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuXHRcdHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHQvKipcblx0ICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2Rcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcblx0XHRcdHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cblx0ICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuXHQgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG5cdFx0Ly8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fTtcblxuXHQvKipcblx0ICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcblx0XHR2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRyZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG5cdCAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuXHQgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcblx0XHRcdFx0bGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuXHRcdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdFx0XHRvbmNlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG5cdCAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGZpcnN0IGV4ZWN1dGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcblx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdG9uY2U6IHRydWVcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuXHQgKi9cblx0cHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cblx0ICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG5cdFx0dGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBpbmRleDtcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgdmFsdWU7XG5cdFx0dmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuXHRcdHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cblx0XHQvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0J3MgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcblx0XHRcdGZvciAoaSBpbiBldnQpIHtcblx0XHRcdFx0aWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG5cdFx0XHRcdFx0Ly8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuXHRcdFx0XHRcdFx0bXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcblx0XHRcdC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcblx0XHRcdC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG5cdFx0XHRpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cblx0ICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcblx0XHR2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuXHRcdGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcblx0XHRcdGRlbGV0ZSBldmVudHNbZXZ0XTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcblx0XHRcdGRlbGV0ZSB0aGlzLl9ldmVudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuXHQgKlxuXHQgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuXHQgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cblx0ICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuXHQgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG5cdCAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGtleTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuXHRcdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cblx0XHRcdFx0XHRpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgZW1pdEV2ZW50XG5cdCAqL1xuXHRwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG5cdCAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuXHQgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG5cdFx0dGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG5cdCAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuXHQgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuXHRcdGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcblx0fTtcblxuXHQvKipcblx0ICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuXHQgKi9cblx0RXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuXHRcdGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcblx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9O1xuXG5cdC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0XHR9KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhpcy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cdH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcnKVxuRG9jdW1lbnQgPSByZXF1aXJlKCcuL2RvY3VtZW50JylcblNuaXBwZXRUcmVlID0gcmVxdWlyZSgnLi9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlJylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbicpXG5kZXNpZ25DYWNoZSA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbl9jYWNoZScpXG5FZGl0b3JQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkb2MgPSBkbyAtPlxuXG4gIGVkaXRvclBhZ2UgPSBuZXcgRWRpdG9yUGFnZSgpXG5cblxuICAjIExvYWQgYW5kIGFjY2VzcyBkZXNpZ25zLlxuICAjXG4gICMgTG9hZCBhIGRlc2lnbjpcbiAgIyBkZXNpZ24ubG9hZCh5b3VyRGVzaWduSnNvbilcbiAgI1xuICAjIENoZWNrIGlmIGEgZGVzaWduIGlzIGFscmVhZHkgbG9hZGVkOlxuICAjIGRlc2lnbi5oYXMobmFtZU9mWW91ckRlc2lnbilcbiAgI1xuICAjIEdldCBhbiBhbHJlYWR5IGxvYWRlZCBkZXNpZ246XG4gICMgZGVzaWduLmdldChuYW1lT2ZZb3VyRGVzaWduKVxuICBkZXNpZ246IGRlc2lnbkNhY2hlXG5cblxuICAjIExvYWQgYSBkb2N1bWVudCBmcm9tIHNlcmlhbGl6ZWQgZGF0YSBpbiBhIHN5bmNocm9ub3VzIHdheS5cbiAgIyBUaGUgZGVzaWduIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICAjXG4gICMgQHJldHVybnMgeyBEb2N1bWVudCBvYmplY3QgfVxuICBuZXc6ICh7IGRhdGEsIGRlc2lnbiB9KSAtPlxuICAgIHNuaXBwZXRUcmVlID0gaWYgZGF0YT9cbiAgICAgIGRlc2lnbk5hbWUgPSBkYXRhLmRlc2lnbj8ubmFtZVxuICAgICAgYXNzZXJ0IGRlc2lnbk5hbWU/LCAnRXJyb3IgY3JlYXRpbmcgZG9jdW1lbnQ6IE5vIGRlc2lnbiBpcyBzcGVjaWZpZWQuJ1xuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShjb250ZW50OiBkYXRhLCBkZXNpZ246IGRlc2lnbilcbiAgICBlbHNlXG4gICAgICBkZXNpZ25OYW1lID0gZGVzaWduXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGRlc2lnbjogZGVzaWduKVxuXG4gICAgQGNyZWF0ZShzbmlwcGV0VHJlZSlcblxuXG4gICMgRGlyZWN0IGNyZWF0aW9uIHdpdGggYW4gZXhpc3RpbmcgU25pcHBldFRyZWVcbiAgIyBAcmV0dXJucyB7IERvY3VtZW50IG9iamVjdCB9XG4gIGNyZWF0ZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIG5ldyBEb2N1bWVudCh7IHNuaXBwZXRUcmVlIH0pXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgIyBNb3ZlIHRoZSBkZXNpZ24gbG9hZGluZyBjb2RlIGZyb20gdGhlIGVkaXRvciBpbnRvIHRoZSBlbmlnbmUuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAoZG9jdW1lbnQpIC0+XG4gICMgICAgZG9jdW1lbnQuY3JlYXRlVmlldygnLmNvbnRhaW5lcicsIHsgaW50ZXJhY3RpdmU6IHRydWUgfSlcbiAgIyAgLnRoZW4gKHZpZXcpIC0+XG4gICMgICAgIyB2aWV3IGlzIHJlYWR5XG5cblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuXG4gICMgQ2hhbmdlIHRoZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG4iLCIjIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuI1xuIyBjb25maWcuZG9jRGlyZWN0aXZlXG4jICAgV2lsbCBwcmVmaXggdGhlIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggY29uZmlnLmF0dHJpYnV0ZVByZWZpeFxuIyAgIGUuZy4gY29uZmlnLmRvY0RpcmVjdGl2ZS5lZGl0YWJsZSA9PSAnZGF0YS1kb2MtZWRpdGFibGUnXG4jXG4jIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBcbiMgICBBIGxvb2t1cCBvYmplY3QgZm9yIGVhc2llciBsb29rdXBzIG9mIHRoZSBkaXJlY3RpdmUgbmFtZSBieSB0ZW1wbGF0ZSBhdHRyaWJ1dGUuXG4jICAgZS5nLiBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwWydkb2MtZWRpdGFibGUnXSA9PSAnZWRpdGFibGUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGNvbmZpZykgLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIGNvbmZpZy5kb2NEaXJlY3RpdmUgPSB7fVxuICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgY29uZmlnLmRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gaWYgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB0aGVuIFwiI3sgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB9LVwiIGVsc2UgJydcbiAgICB2YWx1ZS5yZW5kZXJlZEF0dHIgPSBcIiN7IHByZWZpeCB9I3sgdmFsdWUuYXR0ciB9XCJcblxuICAgIGNvbmZpZy5kb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG4iLCJhdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9hdWdtZW50X2NvbmZpZycpXG5cbiMgQ29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpZyA9IGRvIC0+XG5cbiAgIyBMb2FkIGNzcyBhbmQganMgcmVzb3VyY2VzIGluIHBhZ2VzIGFuZCBpbnRlcmFjdGl2ZSBwYWdlc1xuICBsb2FkUmVzb3VyY2VzOiB0cnVlXG5cbiAgIyBDU1Mgc2VsZWN0b3IgZm9yIGVsZW1lbnRzIChhbmQgdGhlaXIgY2hpbGRyZW4pIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcbiAgIyB3aGVuIGZvY3Vzc2luZyBvciBibHVycmluZyBhIHNuaXBwZXRcbiAgaWdub3JlSW50ZXJhY3Rpb246ICcubGQtY29udHJvbCdcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEVkaXRhYmxlIGNvbmZpZ3VyYXRpb25cbiAgZWRpdGFibGU6XG4gICAgYWxsb3dOZXdsaW5lOiB0cnVlICMgQWxsb3cgdG8gaW5zZXJ0IG5ld2xpbmVzIHdpdGggU2hpZnQrRW50ZXJcbiAgICBjaGFuZ2VEZWxheTogMCAjIERlbGF5IGZvciB1cGRhdGluZyB0aGUgc25pcHBldCBtb2RlbHMgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHVzZXIgY2hhbmdlcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgYnJvd3NlclNwZWxsY2hlY2s6IGZhbHNlICMgU2V0IHRoZSBzcGVsbGNoZWNrIGF0dHJpYnV0ZSBvbiBjb250ZW50ZWRpdGFibGVzIHRvICd0cnVlJyBvciAnZmFsc2UnXG4gICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogZmFsc2UgIyBXaGV0aGVyIHRvIGZpcmUgY3Vyc29yIGFuZCBzZWxjdGlvbiBjaGFuZ2VzIG9uIG1vdXNlbW92ZVxuXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBzbmlwcGV0IGNsYXNzZXNcbiAgICBzbmlwcGV0OiAnZG9jLXNuaXBwZXQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBzbmlwcGV0SGlnaGxpZ2h0OiAnZG9jLXNuaXBwZXQtaGlnaGxpZ2h0J1xuICAgIGNvbnRhaW5lckhpZ2hsaWdodDogJ2RvYy1jb250YWluZXItaGlnaGxpZ2h0J1xuXG4gICAgIyBkcmFnICYgZHJvcFxuICAgIGRyYWdnZWQ6ICdkb2MtZHJhZ2dlZCdcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXI6ICdkb2MtZHJhZ2dlZC1wbGFjZWhvbGRlcidcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyOiAnZG9jLWRyYWctY291bnRlcidcbiAgICBkcmFnQmxvY2tlcjogJ2RvYy1kcmFnLWJsb2NrZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG5hdWdtZW50Q29uZmlnKGNvbmZpZylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnblN0eWxlID0gcmVxdWlyZSgnLi9kZXNpZ25fc3R5bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gIGNvbnN0cnVjdG9yOiAoZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlcyA9IGRlc2lnbi50ZW1wbGF0ZXMgfHwgZGVzaWduLnNuaXBwZXRzXG4gICAgY29uZmlnID0gZGVzaWduLmNvbmZpZ1xuICAgIGdyb3VwcyA9IGRlc2lnbi5jb25maWcuZ3JvdXBzIHx8IGRlc2lnbi5ncm91cHNcblxuICAgIEBuYW1lc3BhY2UgPSBjb25maWc/Lm5hbWVzcGFjZSB8fCAnbGl2aW5nZG9jcy10ZW1wbGF0ZXMnXG4gICAgQHBhcmFncmFwaFNuaXBwZXQgPSBjb25maWc/LnBhcmFncmFwaCB8fCAndGV4dCdcbiAgICBAY3NzID0gY29uZmlnLmNzc1xuICAgIEBqcyA9IGNvbmZpZy5qc1xuICAgIEBmb250cyA9IGNvbmZpZy5mb250c1xuICAgIEB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBncm91cHMgPSB7fVxuICAgIEBzdHlsZXMgPSB7fVxuXG4gICAgQHN0b3JlVGVtcGxhdGVEZWZpbml0aW9ucyh0ZW1wbGF0ZXMpXG4gICAgQGdsb2JhbFN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZGVzaWduLmNvbmZpZy5zdHlsZXMpXG4gICAgQGFkZEdyb3Vwcyhncm91cHMpXG4gICAgQGFkZFRlbXBsYXRlc05vdEluR3JvdXBzKClcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZXNwYWNlID09IEBuYW1lc3BhY2VcblxuXG4gIHN0b3JlVGVtcGxhdGVEZWZpbml0aW9uczogKHRlbXBsYXRlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9ucyA9IHt9XG4gICAgZm9yIHRlbXBsYXRlIGluIHRlbXBsYXRlc1xuICAgICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcblxuXG4gICMgcGFzcyB0aGUgdGVtcGxhdGUgYXMgb2JqZWN0XG4gICMgZS5nIGFkZCh7aWQ6IFwidGl0bGVcIiwgbmFtZTpcIlRpdGxlXCIsIGh0bWw6IFwiPGgxIGRvYy1lZGl0YWJsZT5UaXRsZTwvaDE+XCJ9KVxuICBhZGQ6ICh0ZW1wbGF0ZURlZmluaXRpb24sIHN0eWxlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZURlZmluaXRpb24uaWRdID0gdW5kZWZpbmVkXG4gICAgdGVtcGxhdGVPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbih0ZW1wbGF0ZURlZmluaXRpb24uc3R5bGVzKVxuICAgIHRlbXBsYXRlU3R5bGVzID0gJC5leHRlbmQoe30sIHN0eWxlcywgdGVtcGxhdGVPbmx5U3R5bGVzKVxuXG4gICAgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGVcbiAgICAgIG5hbWVzcGFjZTogQG5hbWVzcGFjZVxuICAgICAgaWQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5pZFxuICAgICAgdGl0bGU6IHRlbXBsYXRlRGVmaW5pdGlvbi50aXRsZVxuICAgICAgc3R5bGVzOiB0ZW1wbGF0ZVN0eWxlc1xuICAgICAgaHRtbDogdGVtcGxhdGVEZWZpbml0aW9uLmh0bWxcbiAgICAgIHdlaWdodDogdGVtcGxhdGVEZWZpbml0aW9uLndlaWdodCB8fCAwXG5cbiAgICBAdGVtcGxhdGVzLnB1c2godGVtcGxhdGUpXG4gICAgdGVtcGxhdGVcblxuXG4gIGFkZEdyb3VwczogKGNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGdyb3VwTmFtZSwgZ3JvdXAgb2YgY29sbGVjdGlvblxuICAgICAgZ3JvdXBPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihncm91cC5zdHlsZXMpXG4gICAgICBncm91cFN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBAZ2xvYmFsU3R5bGVzLCBncm91cE9ubHlTdHlsZXMpXG5cbiAgICAgIHRlbXBsYXRlcyA9IHt9XG4gICAgICBmb3IgdGVtcGxhdGVJZCBpbiBncm91cC50ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGVEZWZpbml0aW9uID0gQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVJZF1cbiAgICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgICAgdGVtcGxhdGUgPSBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgZ3JvdXBTdHlsZXMpXG4gICAgICAgICAgdGVtcGxhdGVzW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cud2FybihcIlRoZSB0ZW1wbGF0ZSAnI3t0ZW1wbGF0ZUlkfScgcmVmZXJlbmNlZCBpbiB0aGUgZ3JvdXAgJyN7Z3JvdXBOYW1lfScgZG9lcyBub3QgZXhpc3QuXCIpXG5cbiAgICAgIEBhZGRHcm91cChncm91cE5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpXG5cblxuICBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwczogKGdsb2JhbFN0eWxlcykgLT5cbiAgICBmb3IgdGVtcGxhdGVJZCwgdGVtcGxhdGVEZWZpbml0aW9uIG9mIEB0ZW1wbGF0ZURlZmluaXRpb25zXG4gICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIEBnbG9iYWxTdHlsZXMpXG5cblxuICBhZGRHcm91cDogKG5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpIC0+XG4gICAgQGdyb3Vwc1tuYW1lXSA9XG4gICAgICB0aXRsZTogZ3JvdXAudGl0bGVcbiAgICAgIHRlbXBsYXRlczogdGVtcGxhdGVzXG4gICAgICB3ZWlnaHQ6IGdyb3VwLndlaWdodFxuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uOiAoc3R5bGVzKSAtPlxuICAgIGRlc2lnblN0eWxlcyA9IHt9XG4gICAgaWYgc3R5bGVzXG4gICAgICBmb3Igc3R5bGVEZWZpbml0aW9uIGluIHN0eWxlc1xuICAgICAgICBkZXNpZ25TdHlsZSA9IEBjcmVhdGVEZXNpZ25TdHlsZShzdHlsZURlZmluaXRpb24pXG4gICAgICAgIGRlc2lnblN0eWxlc1tkZXNpZ25TdHlsZS5uYW1lXSA9IGRlc2lnblN0eWxlIGlmIGRlc2lnblN0eWxlXG5cbiAgICBkZXNpZ25TdHlsZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlOiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIGlmIHN0eWxlRGVmaW5pdGlvbiAmJiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgbmV3IERlc2lnblN0eWxlXG4gICAgICAgIG5hbWU6IHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICAgIHR5cGU6IHN0eWxlRGVmaW5pdGlvbi50eXBlXG4gICAgICAgIG9wdGlvbnM6IHN0eWxlRGVmaW5pdGlvbi5vcHRpb25zXG4gICAgICAgIHZhbHVlOiBzdHlsZURlZmluaXRpb24udmFsdWVcblxuXG4gIHJlbW92ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIEB0ZW1wbGF0ZXMuc3BsaWNlKEBnZXRJbmRleChpZCksIDEpXG5cblxuICBnZXQ6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICB0ZW1wbGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGluZGV4KSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgdGVtcGxhdGUgPSB0XG5cbiAgICAgIHRlbXBsYXRlXG5cblxuICBnZXRJbmRleDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIGluZGV4ID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaSkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIGluZGV4ID0gaVxuXG4gICAgICBpbmRleFxuXG5cbiAgY2hlY2tOYW1lc3BhY2U6IChpZGVudGlmaWVyLCBjYWxsYmFjaykgLT5cbiAgICB7IG5hbWVzcGFjZSwgaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IG5vdCBuYW1lc3BhY2Ugb3IgQG5hbWVzcGFjZSBpcyBuYW1lc3BhY2UsXG4gICAgICBcImRlc2lnbiAjeyBAbmFtZXNwYWNlIH06IGNhbm5vdCBnZXQgdGVtcGxhdGUgd2l0aCBkaWZmZXJlbnQgbmFtZXNwYWNlICN7IG5hbWVzcGFjZSB9IFwiXG5cbiAgICBjYWxsYmFjayhpZClcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdGVtcGxhdGUsIGluZGV4IGluIEB0ZW1wbGF0ZXNcbiAgICAgIGNhbGxiYWNrKHRlbXBsYXRlLCBpbmRleClcblxuXG4gICMgbGlzdCBhdmFpbGFibGUgVGVtcGxhdGVzXG4gIGxpc3Q6IC0+XG4gICAgdGVtcGxhdGVzID0gW11cbiAgICBAZWFjaCAodGVtcGxhdGUpIC0+XG4gICAgICB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgdGVtcGxhdGVzXG5cblxuICAjIHByaW50IGRvY3VtZW50YXRpb24gZm9yIGEgdGVtcGxhdGVcbiAgaW5mbzogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0KGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUucHJpbnREb2MoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZXNpZ25zOiB7fVxuXG4gICMgQ2FuIGxvYWQgYSBkZXNpZ24gc3luY2hyb25vdXNseSBpZiB5b3UgaW5jbHVkZSB0aGVcbiAgIyBkZXNpZ24uanMgZmlsZSBiZWZvcmUgbGl2aW5nZG9jcy5cbiAgIyBkb2MuZGVzaWduLmxvYWQoZGVzaWduc1snbmFtZU9mWW91ckRlc2lnbiddKVxuICAjXG4gICMgUHJvcG9zZWQgZXh0ZW5zaW9uczpcbiAgIyBXaWxsIGJlIGV4dGVuZGVkIHRvIGxvYWQgZGVzaWducyByZW1vdGVseSBmcm9tIGEgc2VydmVyOlxuICAjIExvYWQgZnJvbSBhIHJlbW90ZSBzZXJ2ZXIgYnkgbmFtZSAoc2VydmVyIGhhcyB0byBiZSBjb25maWd1cmVkIGFzIGRlZmF1bHQpXG4gICMgZG9jLmRlc2lnbi5sb2FkKCdnaGlibGknKVxuICAjXG4gICMgTG9hZCBmcm9tIGEgY3VzdG9tIHNlcnZlcjpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2h0dHA6Ly95b3Vyc2VydmVyLmlvL2Rlc2lnbnMvZ2hpYmxpL2Rlc2lnbi5qc29uJylcbiAgbG9hZDogKGRlc2lnblNwZWMpIC0+XG4gICAgaWYgdHlwZW9mIGRlc2lnblNwZWMgPT0gJ3N0cmluZydcbiAgICAgIGFzc2VydCBmYWxzZSwgJ0xvYWQgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkIHlldC4nXG4gICAgZWxzZVxuICAgICAgbmFtZSA9IGRlc2lnblNwZWMuY29uZmlnPy5uYW1lc3BhY2VcbiAgICAgIHJldHVybiBpZiBub3QgbmFtZT8gb3IgQGhhcyhuYW1lKVxuXG4gICAgICBkZXNpZ24gPSBuZXcgRGVzaWduKGRlc2lnblNwZWMpXG4gICAgICBAYWRkKGRlc2lnbilcblxuXG4gICMgQWRkIGFuIGFscmVhZHkgcGFyc2VkIGRlc2lnbi5cbiAgIyBAcGFyYW0geyBEZXNpZ24gb2JqZWN0IH1cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIG5hbWUgPSBkZXNpZ24ubmFtZXNwYWNlXG4gICAgQGRlc2lnbnNbbmFtZV0gPSBkZXNpZ25cblxuXG4gICMgQ2hlY2sgaWYgYSBkZXNpZ24gaXMgbG9hZGVkXG4gIGhhczogKG5hbWUpIC0+XG4gICAgQGRlc2lnbnNbbmFtZV0/XG5cblxuICAjIEdldCBhIGxvYWRlZCBkZXNpZ25cbiAgIyBAcmV0dXJuIHsgRGVzaWduIG9iamVjdCB9XG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBoYXMobmFtZSksIFwiRXJyb3I6IGRlc2lnbiAnI3sgbmFtZSB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbbmFtZV1cblxuXG4gICMgQ2xlYXIgdGhlIGNhY2hlIGlmIHlvdSB3YW50IHRvIHJlbG9hZCBkZXNpZ25zXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblN0eWxlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdHlwZSwgdmFsdWUsIG9wdGlvbnMgfSkgLT5cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ29wdGlvbidcbiAgICAgICAgYXNzZXJ0IHZhbHVlLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICd2YWx1ZScgcHJvdmlkZWRcIlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgd2hlbiAnc2VsZWN0J1xuICAgICAgICBhc3NlcnQgb3B0aW9ucywgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAnb3B0aW9ucycgcHJvdmlkZWRcIlxuICAgICAgICBAb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogdW5rbm93biB0eXBlICcjeyBAdHlwZSB9J1wiXG5cblxuICAjIEdldCBpbnN0cnVjdGlvbnMgd2hpY2ggY3NzIGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUuXG4gICMgV2UgZG8gbm90IGNvbnRyb2wgdGhlIGNsYXNzIGF0dHJpYnV0ZSBvZiBhIHNuaXBwZXQgRE9NIGVsZW1lbnRcbiAgIyBzaW5jZSB0aGUgVUkgb3Igb3RoZXIgc2NyaXB0cyBjYW4gbWVzcyB3aXRoIGl0IGFueSB0aW1lLiBTbyB0aGVcbiAgIyBpbnN0cnVjdGlvbnMgYXJlIGRlc2lnbmVkIG5vdCB0byBpbnRlcmZlcmUgd2l0aCBvdGhlciBjc3MgY2xhc3Nlc1xuICAjIHByZXNlbnQgaW4gYW4gZWxlbWVudHMgY2xhc3MgYXR0cmlidXRlLlxuICBjc3NDbGFzc0NoYW5nZXM6ICh2YWx1ZSkgLT5cbiAgICBpZiBAdmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogaWYgbm90IHZhbHVlIHRoZW4gW0B2YWx1ZV0gZWxzZSB1bmRlZmluZWRcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModmFsdWUpXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICBlbHNlXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGN1cnJlbnRWYWx1ZVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModW5kZWZpbmVkKVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuXG5cbiAgdmFsaWRhdGVWYWx1ZTogKHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgIHZhbHVlID09IEB2YWx1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgIEBjb250YWluc09wdGlvbih2YWx1ZSlcbiAgICBlbHNlXG4gICAgICBsb2cud2FybiBcIk5vdCBpbXBsZW1lbnRlZDogRGVzaWduU3R5bGUjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuVmlldyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3ZpZXcnKVxuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5kb20gPSByZXF1aXJlKCcuL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRG9jdW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBzbmlwcGV0VHJlZSB9KSAtPlxuICAgIEBkZXNpZ24gPSBzbmlwcGV0VHJlZS5kZXNpZ25cbiAgICBAc2V0U25pcHBldFRyZWUoc25pcHBldFRyZWUpXG4gICAgQHZpZXdzID0ge31cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdW5kZWZpbmVkXG5cblxuICAjIEdldCBhIGRyb3AgdGFyZ2V0IGZvciBhbiBldmVudFxuICBnZXREcm9wVGFyZ2V0OiAoeyBldmVudCB9KSAtPlxuICAgIGRvY3VtZW50ID0gZXZlbnQudGFyZ2V0Lm93bmVyRG9jdW1lbnRcbiAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50XG4gICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcbiAgICBpZiBlbGVtP1xuICAgICAgY29vcmRzID0geyBsZWZ0OiBldmVudC5wYWdlWCwgdG9wOiBldmVudC5wYWdlWSB9XG4gICAgICB0YXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCBjb29yZHMpXG5cblxuICBzZXRTbmlwcGV0VHJlZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0VHJlZS5kZXNpZ24gPT0gQGRlc2lnbixcbiAgICAgICdTbmlwcGV0VHJlZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVzaWduIGFzIHRoZSBkb2N1bWVudCdcblxuICAgIEBtb2RlbCA9IEBzbmlwcGV0VHJlZSA9IHNuaXBwZXRUcmVlXG4gICAgQGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50cygpXG5cblxuICBmb3J3YXJkU25pcHBldFRyZWVFdmVudHM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmNoYW5nZWQuYWRkID0+XG4gICAgICBAZW1pdCAnY2hhbmdlJywgYXJndW1lbnRzXG5cblxuICBjcmVhdGVWaWV3OiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgIHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIG9wdGlvbnMucmVhZE9ubHkgPz0gdHJ1ZVxuXG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG5cbiAgICBvcHRpb25zLiR3cmFwcGVyID89IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuICAgIHZpZXcgPSBuZXcgVmlldyhAc25pcHBldFRyZWUsICRwYXJlbnRbMF0pXG4gICAgcHJvbWlzZSA9IHZpZXcuY3JlYXRlKG9wdGlvbnMpXG5cbiAgICBpZiB2aWV3LmlzSW50ZXJhY3RpdmVcbiAgICAgIEBzZXRJbnRlcmFjdGl2ZVZpZXcodmlldylcblxuICAgIHByb21pc2VcblxuXG4gICMgQXBwZW5kIHRoZSBhcnRpY2xlIHRvIHRoZSBET00uXG4gICNcbiAgIyBAcGFyYW0geyBET00gTm9kZSwgalF1ZXJ5IG9iamVjdCBvciBDU1Mgc2VsZWN0b3Igc3RyaW5nIH0gV2hlcmUgdG8gYXBwZW5kIHRoZSBhcnRpY2xlIGluIHRoZSBkb2N1bWVudC5cbiAgIyBAcGFyYW0geyBPYmplY3QgfSBvcHRpb25zOlxuICAjICAgaW50ZXJhY3RpdmU6IHsgQm9vbGVhbiB9IFdoZXRoZXIgdGhlIGRvY3VtZW50IGlzIGVkdGlhYmxlLlxuICAjICAgbG9hZEFzc2V0czogeyBCb29sZWFuIH0gTG9hZCBDU1MgZmlsZXMuIE9ubHkgZGlzYWJsZSB0aGlzIGlmIHlvdSBhcmUgc3VyZSB5b3UgaGF2ZSBsb2FkZWQgZXZlcnl0aGluZyBtYW51YWxseS5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgYXJ0aWNsZS5hcHBlbmRUbygnLmFydGljbGUnLCB7IGludGVyYWN0aXZlOiB0cnVlLCBsb2FkQXNzZXRzOiBmYWxzZSB9KTtcbiAgYXBwZW5kVG86IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQHNuaXBwZXRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHZpZXcuY3JlYXRlUmVuZGVyZXIoeyBvcHRpb25zIH0pXG5cblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBEb2N1bWVudCBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIHRvSHRtbDogLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIHNwYWNlID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBTbmlwcGV0VHJlZS5cbiAgcHJpbnRNb2RlbDogKCkgLT5cbiAgICBAc25pcHBldFRyZWUucHJpbnQoKVxuXG5cbiAgRG9jdW1lbnQuZG9tID0gZG9tXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPVxuXG4gICMgSW1hZ2UgU2VydmljZSBJbnRlcmZhY2VcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIG5hbWU6ICdkZWZhdWx0J1xuXG4gICMgU2V0IHZhbHVlIHRvIGFuIGltYWdlIG9yIGJhY2tncm91bmQgaW1hZ2UgZWxlbWVudC5cbiAgI1xuICAjIEBwYXJhbSB7IGpRdWVyeSBvYmplY3QgfSBOb2RlIHRvIHNldCB0aGUgaW1hZ2UgdG8uXG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gSW1hZ2UgdXJsXG4gIHNldDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbmxpbmVJbWFnZSgkZWxlbSlcbiAgICAgIEBzZXRJbmxpbmVJbWFnZSgkZWxlbSwgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgQHNldEJhY2tncm91bmRJbWFnZSgkZWxlbSwgdmFsdWUpXG5cblxuICBzZXRQbGFjZWhvbGRlcjogKCRlbGVtKSAtPlxuICAgIGRpbSA9IEBnZXRJbWFnZURpbWVuc2lvbnMoJGVsZW0pXG4gICAgaW1hZ2VVcmwgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3sgZGltLndpZHRoIH14I3sgZGltLmhlaWdodCB9L0JFRjU2Ri9CMkU2NjhcIlxuXG5cbiAgIyBUaGUgZGVmYXVsdCBzZXJ2aWNlIGRvZXMgbm90IHRyYW5zZm9yIHRoZSBnaXZlbiB1cmxcbiAgZ2V0VXJsOiAodmFsdWUpIC0+XG4gICAgdmFsdWVcblxuXG4gICMgRGVmYXVsdCBJbWFnZSBTZXJ2aWNlIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldElubGluZUltYWdlOiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuXG5cbiAgc2V0QmFja2dyb3VuZEltYWdlOiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICAjIEVzY2FwZSB0aGUgVVJJIGluIGNhc2UgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgJygnIG9yICcpJyBhcmUgcHJlc2VudC5cbiAgIyBUaGUgZXNjYXBpbmcgb25seSBoYXBwZW5zIGlmIGl0IGlzIG5lZWRlZCBzaW5jZSB0aGlzIGRvZXMgbm90IHdvcmsgaW4gbm9kZS5cbiAgIyBXaGVuIHRoZSBVUkkgaXMgZXNjYXBlZCBpbiBub2RlIHRoZSBiYWNrZ3JvdW5kLWltYWdlIGlzIG5vdCB3cml0dGVuIHRvIHRoZVxuICAjIHN0eWxlIGF0dHJpYnV0ZS5cbiAgZXNjYXBlQ3NzVXJpOiAodXJpKSAtPlxuICAgIGlmIC9bKCldLy50ZXN0KHVyaSlcbiAgICAgIFwiJyN7IHVyaSB9J1wiXG4gICAgZWxzZVxuICAgICAgdXJpXG5cblxuICBnZXRJbWFnZURpbWVuc2lvbnM6ICgkZWxlbSkgLT5cbiAgICBpZiBAaXNJbmxpbmVJbWFnZSgkZWxlbSlcbiAgICAgIHdpZHRoOiAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQ6ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGg6ICRlbGVtLm91dGVyV2lkdGgoKVxuICAgICAgaGVpZ2h0OiAkZWxlbS5vdXRlckhlaWdodCgpXG5cblxuICBpc0Jhc2U2NDogKHZhbHVlKSAtPlxuICAgIHZhbHVlLmluZGV4T2YoJ2RhdGE6aW1hZ2UnKSA9PSAwIGlmIHZhbHVlP1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2ltZydcblxuXG4gIGlzQmFja2dyb3VuZEltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAhPSAnaW1nJ1xuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmRlZmF1bHRJbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2Vfc2VydmljZScpXG5yZXNyY2l0SW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi9yZXNyY2l0X2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBdmFpbGFibGUgSW1hZ2UgU2VydmljZXNcbiAgc2VydmljZXMgPVxuICAgICdyZXNyYy5pdCc6IHJlc3JjaXRJbWFnZVNlcnZpY2VcbiAgICAnZGVmYXVsdCc6IGRlZmF1bHRJbWFnZVNlcnZpY2VcblxuXG4gICMgU2VydmljZVxuICAjIC0tLS0tLS1cblxuICBoYXM6IChzZXJ2aWNlTmFtZSA9ICdkZWZhdWx0JykgLT5cbiAgICBzZXJ2aWNlc1tzZXJ2aWNlTmFtZV0/XG5cblxuICBnZXQ6IChzZXJ2aWNlTmFtZSA9ICdkZWZhdWx0JykgLT5cbiAgICBhc3NlcnQgQGhhcyhzZXJ2aWNlTmFtZSksIFwiQ291bGQgbm90IGxvYWQgaW1hZ2Ugc2VydmljZSAjeyBzZXJ2aWNlTmFtZSB9XCJcbiAgICBzZXJ2aWNlc1tzZXJ2aWNlTmFtZV1cblxuXG4gIGVhY2hTZXJ2aWNlOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNlcnZpY2Ugb2Ygc2VydmljZXNcbiAgICAgIGNhbGxiYWNrKG5hbWUsIHNlcnZpY2UpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1nU2VydmljZSA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIHJlc3JjaXRVcmw6ICdodHRwOi8vYXBwLnJlc3JjLml0LydcblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAncmVzcmMuaXQnXG5cbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH1cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBBIHJlc3JjLml0IHVybC4gRS5nLiBodHRwOi8vYXBwLnJlc3JjLml0L2h0dHA6Ly9pbWFnZXMuY29tLzEuanBnXG4gIHNldDogKCRlbGVtLCB1cmwpIC0+XG4gICAgYXNzZXJ0IHVybD8gJiYgdXJsICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB1cmwpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQodXJsKVxuXG4gICAgJGVsZW0uYWRkQ2xhc3MoJ3Jlc3JjJylcbiAgICBpZiBpbWdTZXJ2aWNlLmlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHVybClcbiAgICBlbHNlXG4gICAgICBAc2V0QmFja2dyb3VuZEltYWdlKCRlbGVtLCB1cmwpXG5cblxuICBzZXRQbGFjZWhvbGRlcjogKCRlbGVtKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0UGxhY2Vob2xkZXIoJGVsZW0pXG5cblxuICBnZXRVcmw6ICh2YWx1ZSwgeyBjcm9wIH0pIC0+XG4gICAgY3JvcFBhcmFtID0gXCJDPVcjeyBjcm9wLndpZHRoIH0sSCN7IGNyb3AuaGVpZ2h0IH0sWCN7IGNyb3AueCB9LFkjeyBjcm9wLnkgfS9cIiBpZiBjcm9wP1xuICAgIFwiI3sgQHJlc3JjaXRVcmwgfSN7IGNyb3BQYXJhbSB8fCAnJyB9I3sgdmFsdWUgfVwiXG5cblxuICAjIEltYWdlIHNwZWNpZmljIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZm9ybWF0Q3NzVXJsOiAodXJsKSAtPlxuICAgIHVybCA9IGltZ1NlcnZpY2UuZXNjYXBlQ3NzVXJpKHVybClcbiAgICBcInVybCgjeyB1cmwgfSlcIlxuXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCB1cmwpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIEBmb3JtYXRDc3NVcmwodXJsKSlcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCBiYXNlNjRTdHJpbmcpIC0+XG4gICAgaW1nU2VydmljZS5zZXQoJGVsZW0sIGJhc2U2NFN0cmluZylcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERPTSBoZWxwZXIgbWV0aG9kc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiMgTWV0aG9kcyB0byBwYXJzZSBhbmQgdXBkYXRlIHRoZSBEb20gdHJlZSBpbiBhY2NvcmRhbmNlIHRvXG4jIHRoZSBTbmlwcGV0VHJlZSBhbmQgTGl2aW5nZG9jcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG4gIHNuaXBwZXRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNuaXBwZXQgfSg/OiB8JClcIilcbiAgc2VjdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgc25pcHBldCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBTbmlwcGV0cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIHNuaXBwZXRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cbiAgZHJvcFRhcmdldDogKG5vZGUsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgICMgYWJvdmUgY29udGFpbmVyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRDb250YWluZXJUYXJnZXQobm9kZSlcblxuICAgICAgIyBhYm92ZSBzbmlwcGV0XG4gICAgICBlbHNlIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldFNuaXBwZXRUYXJnZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcblxuICAgICAgIyBhYm92ZSByb290IGNvbnRhaW5lclxuICAgICAgZWxzZSBpZiBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRTbmlwcGV0VGFyZ2V0OiAoZWxlbSwgeyB0b3AsIGxlZnQsIHBvc2l0aW9uIH0pIC0+XG4gICAgdGFyZ2V0OiAnc25pcHBldCdcbiAgICBzbmlwcGV0VmlldzogQGdldFNuaXBwZXRWaWV3KGVsZW0pXG4gICAgcG9zaXRpb246IHBvc2l0aW9uIHx8IEBnZXRQb3NpdGlvbk9uU25pcHBldChlbGVtLCB7IHRvcCwgbGVmdCB9KVxuXG5cbiAgZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQ6IChjbG9zZXN0U25pcHBldERhdGEpIC0+XG4gICAgZWxlbSA9IGNsb3Nlc3RTbmlwcGV0RGF0YS4kZWxlbVswXVxuICAgIHBvc2l0aW9uID0gY2xvc2VzdFNuaXBwZXREYXRhLnBvc2l0aW9uXG4gICAgQGdldFNuaXBwZXRUYXJnZXQoZWxlbSwgeyBwb3NpdGlvbiB9KVxuXG5cbiAgZ2V0Q29udGFpbmVyVGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuXG4gICAgdGFyZ2V0OiAnY29udGFpbmVyJ1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VmlldzogQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIHNuaXBwZXRUcmVlID0gJChub2RlKS5kYXRhKCdzbmlwcGV0VHJlZScpXG5cbiAgICB0YXJnZXQ6ICdyb290J1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VHJlZTogc25pcHBldFRyZWVcblxuXG4gICMgRmlndXJlIG91dCBpZiB3ZSBzaG91bGQgaW5zZXJ0IGJlZm9yZSBvciBhZnRlciBhIHNuaXBwZXRcbiAgIyBiYXNlZCBvbiB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICBnZXRQb3NpdGlvbk9uU25pcHBldDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IHNuaXBwZXQgaW4gYSBjb250YWluZXIgZm9yIGEgdG9wIGxlZnQgcG9zaXRpb25cbiAgZ2V0Q2xvc2VzdFNuaXBwZXQ6IChjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJHNuaXBwZXRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLnNuaXBwZXQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBjbG9zZXN0U25pcHBldCA9IHVuZGVmaW5lZFxuXG4gICAgJHNuaXBwZXRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2FmdGVyJ31cblxuICAgIGNsb3Nlc3RTbmlwcGV0XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgc25pcHBldCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuICAgICAgICAkcGFyZW50ID0gJGVsZW0ucGFyZW50KClcbiAgICAgICAgcGFyZW50SGVpZ2h0ID0gJHBhcmVudC5oZWlnaHQoKVxuICAgICAgICBvdXRlciA9ICRlbGVtLm91dGVySGVpZ2h0KHRydWUpIC0gJGVsZW0uaGVpZ2h0KClcbiAgICAgICAgJGVsZW0uaGVpZ2h0KHBhcmVudEhlaWdodCAtIG91dGVyKVxuICAgICAgICAkZWxlbS5hZGRDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgIyByZW1vdmUgYWxsIGNzcyBzdHlsZSBoZWlnaHQgZGVjbGFyYXRpb25zIGFkZGVkIGJ5XG4gICMgbWF4aW1pemVDb250YWluZXJIZWlnaHQoKVxuICByZXN0b3JlQ29udGFpbmVySGVpZ2h0OiAoKSAtPlxuICAgICQoXCIuI3sgY3NzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgZ2V0RWxlbWVudE5vZGU6IChub2RlKSAtPlxuICAgIGlmIG5vZGU/LmpxdWVyeVxuICAgICAgbm9kZVswXVxuICAgIGVsc2UgaWYgbm9kZT8ubm9kZVR5cGUgPT0gMyAjIE5vZGUuVEVYVF9OT0RFID09IDNcbiAgICAgIG5vZGUucGFyZW50Tm9kZVxuICAgIGVsc2VcbiAgICAgIG5vZGVcblxuXG4gICMgU25pcHBldHMgc3RvcmUgYSByZWZlcmVuY2Ugb2YgdGhlbXNlbHZlcyBpbiB0aGVpciBEb20gbm9kZVxuICAjIGNvbnNpZGVyOiBzdG9yZSByZWZlcmVuY2UgZGlyZWN0bHkgd2l0aG91dCBqUXVlcnlcbiAgZ2V0U25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnc25pcHBldCcpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIFN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIFRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZFxuICAjIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSkuXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogKGV2ZW50KSAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKGV2ZW50KSBpZiBAc3RhcnRlZFxuICAgIGlmICQuaXNGdW5jdGlvbihAb3B0aW9ucy5vbkRyb3ApXG4gICAgICBAb3B0aW9ucy5vbkRyb3AoZXZlbnQsIEBkcmFnSGFuZGxlcilcbiAgICBAcmVzZXQoKVxuXG5cbiAgY2FuY2VsOiAtPlxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyYWdCbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpLnJlbW92ZSgpXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgICAnZHJvcC5saXZpbmdkb2NzLWRyYWcgZHJhZ2VuZC5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCAoZXZlbnQpID0+XG4gICAgICBAZHJvcChldmVudClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnZHJhZ292ZXIubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSAjIGFsbCBvdGhlciBpbnB1dCBkZXZpY2VzIGJlaGF2ZSBsaWtlIGEgbW91c2VcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuXG4gIGdldEV2ZW50UG9zaXRpb246IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyB8fCBldmVudC50eXBlID09ICd0b3VjaG1vdmUnXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF1cblxuICAgICMgU28gZmFyIEkgZG8gbm90IHVuZGVyc3RhbmQgd2h5IHRoZSBqUXVlcnkgZXZlbnQgZG9lcyBub3QgY29udGFpbiBjbGllbnRYIGV0Yy5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdvdmVyJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50XG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBlZGl0YWJsZS5qcyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgZWRpdGFibGUuanMgaW50byBMaXZpbmdkb2NzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlQ29udHJvbGxlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UpIC0+XG5cbiAgICAjIEluaXRpYWxpemUgZWRpdGFibGUuanNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGVcbiAgICAgIHdpbmRvdzogQHBhZ2Uud2luZG93XG4gICAgICBicm93c2VyU3BlbGxjaGVjazogY29uZmlnLmVkaXRhYmxlLmJyb3dzZXJTcGVsbGNoZWNrXG4gICAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBjb25maWcuZWRpdGFibGUubW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlc1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG4gICAgICAuY2hhbmdlKEB3aXRoQ29udGV4dChAY2hhbmdlKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggZWRpdGFibGUuanMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IGVkaXRhYmxlLmpzXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgZXh0cmFjdENvbnRlbnQ6IChlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGVkaXRhYmxlLmdldENvbnRlbnQoZWxlbWVudClcbiAgICBpZiBjb25maWcuc2luZ2xlTGluZUJyZWFrLnRlc3QodmFsdWUpIHx8IHZhbHVlID09ICcnXG4gICAgICB1bmRlZmluZWRcbiAgICBlbHNlXG4gICAgICB2YWx1ZVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW1lbnQpIC0+XG4gICAgdmFsdWUgPSBAZXh0cmFjdENvbnRlbnQoZWxlbWVudClcbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KVxuXG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBJbnNlcnQgYSBuZXcgYmxvY2suXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgYXQgdGhlIGVuZCBvZiBhIGJsb2NrXG4gICMgb3IgYnkgcHJlc3NpbmcgZGVsZXRlIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBibG9jay5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3ICYmIGRpcmVjdGlvbiA9PSAnYWZ0ZXInXG5cblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBNZXJnZSB0d28gYmxvY2tzLiBXb3JrcyBpbiB0d28gZGlyZWN0aW9ucy5cbiAgIyBFaXRoZXIgdGhlIGN1cnJlbnQgYmxvY2sgaXMgYmVpbmcgbWVyZ2VkIGludG8gdGhlIHByZWNlZWRpbmcgKCdiZWZvcmUnKVxuICAjIG9yIHRoZSBmb2xsb3dpbmcgKCdhZnRlcicpIGJsb2NrLlxuICAjIEFmdGVyIHRoZSBtZXJnZSB0aGUgY3VycmVudCBibG9jayBpcyByZW1vdmVkIGFuZCB0aGUgZm9jdXMgc2V0IHRvIHRoZVxuICAjIG90aGVyIGJsb2NrIHRoYXQgd2FzIG1lcmdlZCBpbnRvLlxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuICAgICAgICB2aWV3RWxlbSA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIG1lcmdlZFZpZXdFbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcblxuICAgICAgICAjIEdhdGhlciB0aGUgY29udGVudCB0aGF0IGlzIGdvaW5nIHRvIGJlIG1lcmdlZFxuICAgICAgICBjb250ZW50VG9NZXJnZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KHZpZXdFbGVtKVxuXG4gICAgICAgIGN1cnNvciA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIEBlZGl0YWJsZS5hcHBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZWRpdGFibGUucHJlcGVuZFRvKG1lcmdlZFZpZXdFbGVtLCBjb250ZW50VG9NZXJnZSlcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRWaXNpYmxlU2VsZWN0aW9uKClcblxuICAgICAgICAjIEFmdGVyIGV2ZXJ5dGhpbmcgaXMgZG9uZSBhbmQgdGhlIGZvY3VzIGlzIHNldCB1cGRhdGUgdGhlIG1vZGVsIHRvXG4gICAgICAgICMgbWFrZSBzdXJlIHRoZSBtb2RlbCBpcyB1cCB0byBkYXRlIGFuZCBjaGFuZ2VzIGFyZSBub3RpZmllZC5cbiAgICAgICAgQHVwZGF0ZU1vZGVsKG1lcmdlZFZpZXcsIGVkaXRhYmxlTmFtZSwgbWVyZ2VkVmlld0VsZW0pXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgU3BsaXQgYSBibG9jayBpbiB0d28uXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgaW4gdGhlIG1pZGRsZSBvZiBhIGJsb2NrLlxuICBzcGxpdDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgYmVmb3JlLCBhZnRlciwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuXG4gICAgICAjIGFwcGVuZCBhbmQgZm9jdXMgY29weSBvZiBzbmlwcGV0XG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChhZnRlcikpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKT8uZm9jdXMoKVxuXG4gICAgICAjIHNldCBjb250ZW50IG9mIHRoZSBiZWZvcmUgZWxlbWVudCAoYWZ0ZXIgZm9jdXMgaXMgc2V0IHRvIHRoZSBhZnRlciBlbGVtZW50KVxuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYmVmb3JlKSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBPY2N1cnMgd2hlbmV2ZXIgdGhlIHVzZXIgc2VsZWN0cyBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJzIG9yIHdoZW5ldmVyIHRoZVxuICAjIHNlbGVjdGlvbiBpcyBjaGFuZ2VkLlxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gICMgSW5zZXJ0IGEgbmV3bGluZSAoU2hpZnQgKyBFbnRlcilcbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgaWYgY29uZmlnLmVkaXRhYmxlLmFsbG93TmV3bGluZVxuICAgICAgcmV0dXJuIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBlbHNlXG4gICAgIHJldHVybiBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgVHJpZ2dlcmVkIHdoZW5ldmVyIHRoZSB1c2VyIGNoYW5nZXMgdGhlIGNvbnRlbnQgb2YgYSBibG9jay5cbiAgIyBUaGUgY2hhbmdlIGV2ZW50IGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgZmlyZSBpZiB0aGUgY29udGVudCBoYXNcbiAgIyBiZWVuIGNoYW5nZWQgdmlhIGphdmFzY3JpcHQuXG4gIGNoYW5nZTogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcbiAgICByZXR1cm4gaWYgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXlcblxuXG4gIGNsZWFyQ2hhbmdlVGltZW91dDogLT5cbiAgICBpZiBAY2hhbmdlVGltZW91dD9cbiAgICAgIGNsZWFyVGltZW91dChAY2hhbmdlVGltZW91dClcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIERvY3VtZW50IEZvY3VzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgc25pcHBldCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQHNuaXBwZXRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIHNuaXBwZXRWaWV3ICE9IEBzbmlwcGV0Vmlld1xuICAgICAgQHJlc2V0U25pcHBldFZpZXcoKVxuICAgICAgaWYgc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRWaWV3ID0gc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRGb2N1cy5maXJlKEBzbmlwcGV0VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBzbmlwcGV0VmlldyB8fD0gZG9tLmZpbmRTbmlwcGV0VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBzbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBzbmlwcGV0VmlldyAhPSBzbmlwcGV0Vmlld1xuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0U25pcHBldFZpZXc6IC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBzbmlwcGV0Vmlld1xuICAgICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAc25pcHBldEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Py5tb2RlbCAhPSBAc25pcHBldE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuc25pcHBldFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIHNuaXBwZXRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5zbmlwcGV0Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHMoYmVmb3JlLCB0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHModGFyZ2V0LnNuaXBwZXRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdUb3AgPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy10b3AnKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXQgKyBwYWRkaW5nVG9wXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLWJvdHRvbScpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldCAtIHBhZGRpbmdCb3R0b21cbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cblxuICAgICAgaWYgY2xpZW50WD8gJiYgY2xpZW50WT9cbiAgICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcblxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSAkLkNhbGxiYWNrcyBvYmplY3QgdGhhdCB3aWxsXG4gICMgcmVtb3ZlIGl0c2VsZiBmcm9tIGl0cyAkLkNhbGxiYWNrcyBhZnRlciB0aGUgZmlyc3QgY2FsbC5cbiAgY2FsbE9uY2U6IChjYWxsYmFja3MsIGxpc3RlbmVyKSAtPlxuICAgIHNlbGZSZW1vdmluZ0Z1bmMgPSAoYXJncy4uLikgLT5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmUoc2VsZlJlbW92aW5nRnVuYylcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjYWxsYmFja3MuYWRkKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgc2VsZlJlbW92aW5nRnVuY1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGh0bWxQb2ludGVyRXZlbnRzOiAtPlxuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4JylcbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSAncG9pbnRlci1ldmVudHM6YXV0bydcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID09ICdhdXRvJ1xuIiwiZGV0ZWN0cyA9IHJlcXVpcmUoJy4vZmVhdHVyZV9kZXRlY3RzJylcblxuZXhlY3V0ZWRUZXN0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG5hbWUpIC0+XG4gIGlmIChyZXN1bHQgPSBleGVjdXRlZFRlc3RzW25hbWVdKSA9PSB1bmRlZmluZWRcbiAgICBleGVjdXRlZFRlc3RzW25hbWVdID0gQm9vbGVhbihkZXRlY3RzW25hbWVdKCkpXG4gIGVsc2VcbiAgICByZXN1bHRcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlkQ291bnRlciA9IGxhc3RJZCA9IHVuZGVmaW5lZFxuXG4gICMgR2VuZXJhdGUgYSB1bmlxdWUgaWQuXG4gICMgR3VhcmFudGVlcyBhIHVuaXF1ZSBpZCBpbiB0aGlzIHJ1bnRpbWUuXG4gICMgQWNyb3NzIHJ1bnRpbWVzIGl0cyBsaWtlbHkgYnV0IG5vdCBndWFyYW50ZWVkIHRvIGJlIHVuaXF1ZVxuICAjIFVzZSB0aGUgdXNlciBwcmVmaXggdG8gYWxtb3N0IGd1YXJhbnRlZSB1bmlxdWVuZXNzLFxuICAjIGFzc3VtaW5nIHRoZSBzYW1lIHVzZXIgY2Fubm90IGdlbmVyYXRlIHNuaXBwZXRzIGluXG4gICMgbXVsdGlwbGUgcnVudGltZXMgYXQgdGhlIHNhbWUgdGltZSAoYW5kIHRoYXQgY2xvY2tzIGFyZSBpbiBzeW5jKVxuICBuZXh0OiAodXNlciA9ICdkb2MnKSAtPlxuXG4gICAgIyBnZW5lcmF0ZSA5LWRpZ2l0IHRpbWVzdGFtcFxuICAgIG5leHRJZCA9IERhdGUubm93KCkudG9TdHJpbmcoMzIpXG5cbiAgICAjIGFkZCBjb3VudGVyIGlmIG11bHRpcGxlIHRyZWVzIG5lZWQgaWRzIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kXG4gICAgaWYgbGFzdElkID09IG5leHRJZFxuICAgICAgaWRDb3VudGVyICs9IDFcbiAgICBlbHNlXG4gICAgICBpZENvdW50ZXIgPSAwXG4gICAgICBsYXN0SWQgPSBuZXh0SWRcblxuICAgIFwiI3sgdXNlciB9LSN7IG5leHRJZCB9I3sgaWRDb3VudGVyIH1cIlxuIiwibG9nID0gcmVxdWlyZSgnLi9sb2cnKVxuXG4jIEZ1bmN0aW9uIHRvIGFzc2VydCBhIGNvbmRpdGlvbi4gSWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LCBhbiBlcnJvciBpc1xuIyByYWlzZWQgd2l0aCB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgYXNzZXJ0IGEgaXNudCBiLCAnYSBjYW4gbm90IGJlIGInXG4jXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2VydCA9IChjb25kaXRpb24sIG1lc3NhZ2UpIC0+XG4gIGxvZy5lcnJvcihtZXNzYWdlKSB1bmxlc3MgY29uZGl0aW9uXG4iLCJcbiMgTG9nIEhlbHBlclxuIyAtLS0tLS0tLS0tXG4jIERlZmF1bHQgbG9nZ2luZyBoZWxwZXJcbiMgQHBhcmFtczogcGFzcyBgXCJ0cmFjZVwiYCBhcyBsYXN0IHBhcmFtZXRlciB0byBvdXRwdXQgdGhlIGNhbGwgc3RhY2tcbm1vZHVsZS5leHBvcnRzID0gbG9nID0gKGFyZ3MuLi4pIC0+XG4gIGlmIHdpbmRvdy5jb25zb2xlP1xuICAgIGlmIGFyZ3MubGVuZ3RoIGFuZCBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ3RyYWNlJ1xuICAgICAgYXJncy5wb3AoKVxuICAgICAgd2luZG93LmNvbnNvbGUudHJhY2UoKSBpZiB3aW5kb3cuY29uc29sZS50cmFjZT9cblxuICAgIHdpbmRvdy5jb25zb2xlLmxvZy5hcHBseSh3aW5kb3cuY29uc29sZSwgYXJncylcbiAgICB1bmRlZmluZWRcblxuXG5kbyAtPlxuXG4gICMgQ3VzdG9tIGVycm9yIHR5cGUgZm9yIGxpdmluZ2RvY3MuXG4gICMgV2UgY2FuIHVzZSB0aGlzIHRvIHRyYWNrIHRoZSBvcmlnaW4gb2YgYW4gZXhwZWN0aW9uIGluIHVuaXQgdGVzdHMuXG4gIGNsYXNzIExpdmluZ2RvY3NFcnJvciBleHRlbmRzIEVycm9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKG1lc3NhZ2UpIC0+XG4gICAgICBzdXBlclxuICAgICAgQG1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICBAdGhyb3duQnlMaXZpbmdkb2NzID0gdHJ1ZVxuXG5cbiAgIyBAcGFyYW0gbGV2ZWw6IG9uZSBvZiB0aGVzZSBzdHJpbmdzOlxuICAjICdjcml0aWNhbCcsICdlcnJvcicsICd3YXJuaW5nJywgJ2luZm8nLCAnZGVidWcnXG4gIG5vdGlmeSA9IChtZXNzYWdlLCBsZXZlbCA9ICdlcnJvcicpIC0+XG4gICAgaWYgX3JvbGxiYXI/XG4gICAgICBfcm9sbGJhci5wdXNoIG5ldyBFcnJvcihtZXNzYWdlKSwgLT5cbiAgICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJykgYW5kIHdpbmRvdy5jb25zb2xlPy5lcnJvcj9cbiAgICAgICAgICB3aW5kb3cuY29uc29sZS5lcnJvci5jYWxsKHdpbmRvdy5jb25zb2xlLCBtZXNzYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuICAgIGVsc2VcbiAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpXG4gICAgICAgIHRocm93IG5ldyBMaXZpbmdkb2NzRXJyb3IobWVzc2FnZSlcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuXG4gICAgdW5kZWZpbmVkXG5cblxuICBsb2cuZGVidWcgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2RlYnVnJykgdW5sZXNzIGxvZy5kZWJ1Z0Rpc2FibGVkXG5cblxuICBsb2cud2FybiA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnd2FybmluZycpIHVubGVzcyBsb2cud2FybmluZ3NEaXNhYmxlZFxuXG5cbiAgIyBMb2cgZXJyb3IgYW5kIHRocm93IGV4Y2VwdGlvblxuICBsb2cuZXJyb3IgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2Vycm9yJylcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgVGhpcyBjbGFzcyBjYW4gYmUgdXNlZCB0byB3YWl0IGZvciB0YXNrcyB0byBmaW5pc2ggYmVmb3JlIGZpcmluZyBhIHNlcmllcyBvZlxuIyBjYWxsYmFja3MuIE9uY2Ugc3RhcnQoKSBpcyBjYWxsZWQsIHRoZSBjYWxsYmFja3MgZmlyZSBhcyBzb29uIGFzIHRoZSBjb3VudFxuIyByZWFjaGVzIDAuIFRodXMsIHlvdSBzaG91bGQgaW5jcmVtZW50IHRoZSBjb3VudCBiZWZvcmUgc3RhcnRpbmcgaXQuIFdoZW5cbiMgYWRkaW5nIGEgY2FsbGJhY2sgYWZ0ZXIgaGF2aW5nIGZpcmVkIGNhdXNlcyB0aGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHJpZ2h0XG4jIGF3YXkuIEluY3JlbWVudGluZyB0aGUgY291bnQgYWZ0ZXIgaXQgZmlyZWQgcmVzdWx0cyBpbiBhbiBlcnJvci5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiNcbiMgICBzZW1hcGhvcmUuaW5jcmVtZW50KClcbiMgICBkb1NvbWV0aGluZygpLnRoZW4oc2VtYXBob3JlLmRlY3JlbWVudCgpKVxuI1xuIyAgIGRvQW5vdGhlclRoaW5nVGhhdFRha2VzQUNhbGxiYWNrKHNlbWFwaG9yZS53YWl0KCkpXG4jXG4jICAgc2VtYXBob3JlLnN0YXJ0KClcbiNcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ2hlbGxvJykpXG4jXG4jICAgIyBPbmNlIGNvdW50IHJlYWNoZXMgMCBjYWxsYmFjayBpcyBleGVjdXRlZDpcbiMgICAjID0+ICdoZWxsbydcbiNcbiMgICAjIEFzc3VtaW5nIHRoYXQgc2VtYXBob3JlIHdhcyBhbHJlYWR5IGZpcmVkOlxuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5JykpXG4jICAgIyA9PiAndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5J1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZW1hcGhvcmVcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY291bnQgPSAwXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgIEB3YXNGaXJlZCA9IGZhbHNlXG4gICAgQGNhbGxiYWNrcyA9IFtdXG5cblxuICBhZGRDYWxsYmFjazogKGNhbGxiYWNrKSAtPlxuICAgIGlmIEB3YXNGaXJlZFxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHdhc0ZpcmVkXG5cblxuICBzdGFydDogLT5cbiAgICBhc3NlcnQgbm90IEBzdGFydGVkLFxuICAgICAgXCJVbmFibGUgdG8gc3RhcnQgU2VtYXBob3JlIG9uY2Ugc3RhcnRlZC5cIlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICBpbmNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAd2FzRmlyZWQsXG4gICAgICBcIlVuYWJsZSB0byBpbmNyZW1lbnQgY291bnQgb25jZSBTZW1hcGhvcmUgaXMgZmlyZWQuXCJcbiAgICBAY291bnQgKz0gMVxuXG5cbiAgZGVjcmVtZW50OiAtPlxuICAgIGFzc2VydCBAY291bnQgPiAwLFxuICAgICAgXCJVbmFibGUgdG8gZGVjcmVtZW50IGNvdW50IHJlc3VsdGluZyBpbiBuZWdhdGl2ZSBjb3VudC5cIlxuICAgIEBjb3VudCAtPSAxXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIHdhaXQ6IC0+XG4gICAgQGluY3JlbWVudCgpXG4gICAgPT4gQGRlY3JlbWVudCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGZpcmVJZlJlYWR5OiAtPlxuICAgIGlmIEBjb3VudCA9PSAwICYmIEBzdGFydGVkID09IHRydWVcbiAgICAgIEB3YXNGaXJlZCA9IHRydWVcbiAgICAgIGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpc0VtcHR5OiAob2JqKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBvYmo/XG4gICAgZm9yIG5hbWUgb2Ygb2JqXG4gICAgICByZXR1cm4gZmFsc2UgaWYgb2JqLmhhc093blByb3BlcnR5KG5hbWUpXG5cbiAgICB0cnVlXG5cblxuICBmbGF0Q29weTogKG9iaikgLT5cbiAgICBjb3B5ID0gdW5kZWZpbmVkXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb3B5IHx8PSB7fVxuICAgICAgY29weVtuYW1lXSA9IHZhbHVlXG5cbiAgICBjb3B5XG4iLCIjIFN0cmluZyBIZWxwZXJzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIGluc3BpcmVkIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vZXBlbGkvdW5kZXJzY29yZS5zdHJpbmddKClcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnQ2FtZWwgQ2FzZSdcbiAgaHVtYW5pemU6IChzdHIpIC0+XG4gICAgdW5jYW1lbGl6ZWQgPSAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVpdKykvZywgJyQxICQyJykudG9Mb3dlckNhc2UoKVxuICAgIEB0aXRsZWl6ZSggdW5jYW1lbGl6ZWQgKVxuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgdG8gdXBwZXJjYXNlXG4gIGNhcGl0YWxpemUgOiAoc3RyKSAtPlxuICAgICAgc3RyID0gaWYgIXN0cj8gdGhlbiAnJyBlbHNlIFN0cmluZyhzdHIpXG4gICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgb2YgZXZlcnkgd29yZCB0byB1cHBlcmNhc2VcbiAgdGl0bGVpemU6IChzdHIpIC0+XG4gICAgaWYgIXN0cj9cbiAgICAgICcnXG4gICAgZWxzZVxuICAgICAgU3RyaW5nKHN0cikucmVwbGFjZSAvKD86XnxcXHMpXFxTL2csIChjKSAtPlxuICAgICAgICBjLnRvVXBwZXJDYXNlKClcblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnY2FtZWwtY2FzZSdcbiAgc25ha2VDYXNlOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpLnJlcGxhY2UoL1stX1xcc10rL2csICctJykudG9Mb3dlckNhc2UoKVxuXG5cbiAgIyBwcmVwZW5kIGEgcHJlZml4IHRvIGEgc3RyaW5nIGlmIGl0IGlzIG5vdCBhbHJlYWR5IHByZXNlbnRcbiAgcHJlZml4OiAocHJlZml4LCBzdHJpbmcpIC0+XG4gICAgaWYgc3RyaW5nLmluZGV4T2YocHJlZml4KSA9PSAwXG4gICAgICBzdHJpbmdcbiAgICBlbHNlXG4gICAgICBcIlwiICsgcHJlZml4ICsgc3RyaW5nXG5cblxuICAjIEpTT04uc3RyaW5naWZ5IHdpdGggcmVhZGFiaWxpdHkgaW4gbWluZFxuICAjIEBwYXJhbSBvYmplY3Q6IGphdmFzY3JpcHQgb2JqZWN0XG4gIHJlYWRhYmxlSnNvbjogKG9iaikgLT5cbiAgICBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIDIpICMgXCJcXHRcIlxuXG4gIGNhbWVsaXplOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICAgICBjLnRvVXBwZXJDYXNlKClcbiAgICApXG5cbiAgdHJpbTogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG5cblxuICAjIGNhbWVsaXplOiAoc3RyKSAtPlxuICAjICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgIyAgICAgYy50b1VwcGVyQ2FzZSgpXG5cbiAgIyBjbGFzc2lmeTogKHN0cikgLT5cbiAgIyAgICQudGl0bGVpemUoU3RyaW5nKHN0cikucmVwbGFjZSgvW1xcV19dL2csICcgJykpLnJlcGxhY2UoL1xccy9nLCAnJylcblxuXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciB9KSAtPlxuICAgIGFzc2VydCBAc25pcHBldFRyZWUsICdubyBzbmlwcGV0IHRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAc25pcHBldFZpZXdzID0ge31cblxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgaWYgJGluc2VydC5sZW5ndGhcbiAgICAgICAgQCR3cmFwcGVyID0gQCRyb290XG4gICAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgICAgQCRyb290ID0gJGluc2VydFxuXG4gICAgIyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgc25pcHBldFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBzbmlwcGV0IHRyZWVcbiAgICBAJHJvb3QuZGF0YSgnc25pcHBldFRyZWUnLCBAc25pcHBldFRyZWUpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEBzZXRSb290KClcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnMoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIFNuaXBwZXQgVHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRBZGRlZC5hZGQoICQucHJveHkoQHNuaXBwZXRBZGRlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0UmVtb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRSZW1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRNb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRNb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBzbmlwcGV0QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBzbmlwcGV0SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cblxuICBzbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbClcblxuICAgIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdTbmlwcGV0IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlci4nKVxuXG4gICAgc25pcHBldFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuICAgIHNuaXBwZXRWaWV3LnNldEF0dGFjaGVkVG9Eb20odHJ1ZSlcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQoc25pcHBldFZpZXcpXG4gICAgQGF0dGFjaENoaWxkU25pcHBldHMobW9kZWwpXG5cblxuICBpc1NuaXBwZXRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLmlzQXR0YWNoZWRUb0RvbVxuXG5cbiAgYXR0YWNoQ2hpbGRTbmlwcGV0czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc1NuaXBwZXRBdHRhY2hlZChjaGlsZE1vZGVsKVxuICAgICAgICBAaW5zZXJ0U25pcHBldChjaGlsZE1vZGVsKVxuXG5cbiAgaW5zZXJ0U25pcHBldEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JTbmlwcGV0KHNpYmxpbmcpW21ldGhvZF0oQCRub2RlRm9yU25pcHBldChtb2RlbCkpXG5cblxuICBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5hcHBlbmRUbyhAJG5vZGVGb3JDb250YWluZXIobW9kZWwucGFyZW50Q29udGFpbmVyKSlcblxuXG4gICRub2RlRm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLiRodG1sXG5cblxuICAkbm9kZUZvckNvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIuaXNSb290XG4gICAgICBAJHJvb3RcbiAgICBlbHNlXG4gICAgICBwYXJlbnRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChjb250YWluZXIucGFyZW50U25pcHBldClcbiAgICAgICQocGFyZW50Vmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGNvbnRhaW5lci5uYW1lKSlcblxuXG4gIHJlbW92ZVNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmRldGFjaCgpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcbmF0dHIgPSBjb25maWcuYXR0clxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3InKVxuZXZlbnRpbmcgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2V2ZW50aW5nJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEAkZWxlbSA9IEAkaHRtbFxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdzbmlwcGV0JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNzcy5zbmlwcGV0KVxuICAgICAgICAuYXR0cihhdHRyLnRlbXBsYXRlLCBAdGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIEByZW5kZXIoKVxuXG5cbiAgcmVuZGVyOiAobW9kZSkgLT5cbiAgICBAdXBkYXRlQ29udGVudCgpXG4gICAgQHVwZGF0ZUh0bWwoKVxuXG5cbiAgdXBkYXRlQ29udGVudDogLT5cbiAgICBAY29udGVudChAbW9kZWwuY29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbnRlbnRcbiAgICAgIGRpcmVjdGl2ZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKVxuICAgICAgaWYgZGlyZWN0aXZlLmlzSW1hZ2VcbiAgICAgICAgaWYgZGlyZWN0aXZlLmJhc2U2NEltYWdlP1xuICAgICAgICAgIEBzZXQobmFtZSwgZGlyZWN0aXZlLmJhc2U2NEltYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSApXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXQobmFtZSwgdmFsdWUpXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBzZXRFZGl0YWJsZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBzZXRJbWFnZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQHNldEh0bWwobmFtZSwgdmFsdWUpXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQGdldEVkaXRhYmxlKG5hbWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAZ2V0SW1hZ2UobmFtZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGdldEh0bWwobmFtZSlcblxuXG4gIGdldEVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRFZGl0YWJsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBpZiBAaGFzRm9jdXMoKVxuXG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLnRvZ2dsZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyLCBCb29sZWFuKHZhbHVlKSlcbiAgICAkZWxlbS5hdHRyKGF0dHIucGxhY2Vob2xkZXIsIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcblxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG5cbiAgICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1hZ2VTZXJ2aWNlLnNldCgkZWxlbSwgdmFsdWUpXG5cbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBlbHNlXG4gICAgICBzZXRQbGFjZWhvbGRlciA9ICQucHJveHkoQHNldFBsYWNlaG9sZGVySW1hZ2UsIHRoaXMsICRlbGVtLCBuYW1lKVxuICAgICAgQGRlbGF5VW50aWxBdHRhY2hlZChuYW1lLCBzZXRQbGFjZWhvbGRlcikgIyB0b2RvOiByZXBsYWNlIHdpdGggQGFmdGVySW5zZXJ0ZWQgLT4gLi4uIChzb21ldGhpbmcgbGlrZSAkLkNhbGxiYWNrcygnb25jZSByZW1lbWJlcicpKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtLCBuYW1lKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuXG4gICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLmdldEltYWdlU2VydmljZSgpXG4gICAgaW1hZ2VTZXJ2aWNlLnNldCgkZWxlbSwgdmFsdWUpXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIGNsYXNzTmFtZSkgLT5cbiAgICBjaGFuZ2VzID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXS5jc3NDbGFzc0NoYW5nZXMoY2xhc3NOYW1lKVxuICAgIGlmIGNoYW5nZXMucmVtb3ZlXG4gICAgICBmb3IgcmVtb3ZlQ2xhc3MgaW4gY2hhbmdlcy5yZW1vdmVcbiAgICAgICAgQCRodG1sLnJlbW92ZUNsYXNzKHJlbW92ZUNsYXNzKVxuXG4gICAgQCRodG1sLmFkZENsYXNzKGNoYW5nZXMuYWRkKVxuXG5cbiAgIyBEaXNhYmxlIHRhYmJpbmcgZm9yIHRoZSBjaGlsZHJlbiBvZiBhbiBlbGVtZW50LlxuICAjIFRoaXMgaXMgdXNlZCBmb3IgaHRtbCBjb250ZW50IHNvIGl0IGRvZXMgbm90IGRpc3J1cHQgdGhlIHVzZXJcbiAgIyBleHBlcmllbmNlLiBUaGUgdGltZW91dCBpcyB1c2VkIGZvciBjYXNlcyBsaWtlIHR3ZWV0cyB3aGVyZSB0aGVcbiAgIyBpZnJhbWUgaXMgZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IHdpdGggYSBkZWxheS5cbiAgZGlzYWJsZVRhYmJpbmc6ICgkZWxlbSkgLT5cbiAgICBzZXRUaW1lb3V0KCA9PlxuICAgICAgJGVsZW0uZmluZCgnaWZyYW1lJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICwgNDAwKVxuXG5cbiAgIyBBcHBlbmQgYSBjaGlsZCB0byB0aGUgZWxlbWVudCB3aGljaCB3aWxsIGJsb2NrIHVzZXIgaW50ZXJhY3Rpb25cbiAgIyBsaWtlIGNsaWNrIG9yIHRvdWNoIGV2ZW50cy4gQWxzbyB0cnkgdG8gcHJldmVudCB0aGUgdXNlciBmcm9tIGdldHRpbmdcbiAgIyBmb2N1cyBvbiBhIGNoaWxkIGVsZW1udCB0aHJvdWdoIHRhYmJpbmcuXG4gIGJsb2NrSW50ZXJhY3Rpb246ICgkZWxlbSkgLT5cbiAgICBAZW5zdXJlUmVsYXRpdmVQb3NpdGlvbigkZWxlbSlcbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuaW50ZXJhY3Rpb25CbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgJGVsZW0uYXBwZW5kKCRibG9ja2VyKVxuXG4gICAgQGRpc2FibGVUYWJiaW5nKCRlbGVtKVxuXG5cbiAgIyBNYWtlIHN1cmUgdGhhdCBhbGwgYWJzb2x1dGUgcG9zaXRpb25lZCBjaGlsZHJlbiBhcmUgcG9zaXRpb25lZFxuICAjIHJlbGF0aXZlIHRvICRlbGVtLlxuICBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uOiAoJGVsZW0pIC0+XG4gICAgcG9zaXRpb24gPSAkZWxlbS5jc3MoJ3Bvc2l0aW9uJylcbiAgICBpZiBwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdmaXhlZCcgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJ1xuICAgICAgJGVsZW0uY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXG5cblxuICBnZXQkY29udGFpbmVyOiAtPlxuICAgICQoZG9tLmZpbmRDb250YWluZXIoQCRodG1sWzBdKS5ub2RlKVxuXG5cbiAgIyBXYWl0IHRvIGV4ZWN1dGUgYSBtZXRob2QgdW50aWwgdGhlIHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIERPTVxuICBkZWxheVVudGlsQXR0YWNoZWQ6IChuYW1lLCBmdW5jKSAtPlxuICAgIGlmIEBpc0F0dGFjaGVkVG9Eb21cbiAgICAgIGZ1bmMoKVxuICAgIGVsc2VcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBAZGVsYXllZCB8fD0ge31cbiAgICAgIEBkZWxheWVkW25hbWVdID0gZXZlbnRpbmcuY2FsbE9uY2UgQHdhc0F0dGFjaGVkVG9Eb20sID0+XG4gICAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGZ1bmMoKVxuXG5cbiAgY2FuY2VsRGVsYXllZDogKG5hbWUpIC0+XG4gICAgaWYgQGRlbGF5ZWQ/W25hbWVdXG4gICAgICBAd2FzQXR0YWNoZWRUb0RvbS5yZW1vdmUoQGRlbGF5ZWRbbmFtZV0pXG4gICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuXG5cbiAgc3RyaXBIdG1sSWZSZWFkT25seTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc1JlYWRPbmx5XG5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihAJGh0bWxbMF0pXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIEBzdHJpcERvY0NsYXNzZXMoZWxlbSlcbiAgICAgIEBzdHJpcERvY0F0dHJpYnV0ZXMoZWxlbSlcbiAgICAgIEBzdHJpcEVtcHR5QXR0cmlidXRlcyhlbGVtKVxuXG5cbiAgc3RyaXBEb2NDbGFzc2VzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3Iga2xhc3MgaW4gZWxlbS5jbGFzc05hbWUuc3BsaXQoL1xccysvKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3Moa2xhc3MpIGlmIC9kb2NcXC0uKi9pLnRlc3Qoa2xhc3MpXG5cblxuICBzdHJpcERvY0F0dHJpYnV0ZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIG5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgICAgJGVsZW0ucmVtb3ZlQXR0cihuYW1lKSBpZiAvZGF0YVxcLWRvY1xcLS4qL2kudGVzdChuYW1lKVxuXG5cbiAgc3RyaXBFbXB0eUF0dHJpYnV0ZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIHN0cmlwcGFibGVBdHRyaWJ1dGVzID0gWydzdHlsZScsICdjbGFzcyddXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgaXNTdHJpcHBhYmxlQXR0cmlidXRlID0gc3RyaXBwYWJsZUF0dHJpYnV0ZXMuaW5kZXhPZihhdHRyaWJ1dGUubmFtZSkgPj0gMFxuICAgICAgaXNFbXB0eUF0dHJpYnV0ZSA9IGF0dHJpYnV0ZS52YWx1ZS50cmltKCkgPT0gJydcbiAgICAgIGlmIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSBhbmQgaXNFbXB0eUF0dHJpYnV0ZVxuICAgICAgICAkZWxlbS5yZW1vdmVBdHRyKGF0dHJpYnV0ZS5uYW1lKVxuXG5cbiAgc2V0QXR0YWNoZWRUb0RvbTogKG5ld1ZhbCkgLT5cbiAgICByZXR1cm4gaWYgbmV3VmFsID09IEBpc0F0dGFjaGVkVG9Eb21cblxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBuZXdWYWxcblxuICAgIGlmIG5ld1ZhbFxuICAgICAgQHJlc2V0RGlyZWN0aXZlcygpXG4gICAgICBAd2FzQXR0YWNoZWRUb0RvbS5maXJlKClcbiIsIlJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlcicpXG5QYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRUcmVlLCBAcGFyZW50KSAtPlxuICAgIEBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBAaXNJbnRlcmFjdGl2ZSA9IGZhbHNlXG5cblxuICAjIEF2YWlsYWJsZSBPcHRpb25zOlxuICAjIFJlYWRPbmx5IHZpZXc6IChkZWZhdWx0IGlmIG5vdGhpbmcgaXMgc3BlY2lmaWVkKVxuICAjIGNyZWF0ZShyZWFkT25seTogdHJ1ZSlcbiAgI1xuICAjIEluZXJhY3RpdmUgdmlldzpcbiAgIyBjcmVhdGUoaW50ZXJhY3RpdmU6IHRydWUpXG4gICNcbiAgIyBXcmFwcGVyOiAoRE9NIG5vZGUgdGhhdCBoYXMgdG8gY29udGFpbiBhIG5vZGUgd2l0aCBjbGFzcyAnLmRvYy1zZWN0aW9uJylcbiAgIyBjcmVhdGUoICR3cmFwcGVyOiAkKCc8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPicpIClcbiAgY3JlYXRlOiAob3B0aW9ucykgLT5cbiAgICBAY3JlYXRlSUZyYW1lKEBwYXJlbnQpLnRoZW4gKGlmcmFtZSwgcmVuZGVyTm9kZSkgPT5cbiAgICAgIEBpZnJhbWUgPSBpZnJhbWVcbiAgICAgIHJlbmRlcmVyID0gQGNyZWF0ZUlGcmFtZVJlbmRlcmVyKGlmcmFtZSwgb3B0aW9ucylcbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBAY3JlYXRlUmVuZGVyZXJcbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgb3B0aW9uczogb3B0aW9uc1xuXG5cbiAgY3JlYXRlUmVuZGVyZXI6ICh7IHJlbmRlck5vZGUsIG9wdGlvbnMgfT17fSkgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSB8fCBAcGFyZW50XG4gICAgICBkZXNpZ246IEBzbmlwcGV0VHJlZS5kZXNpZ25cblxuICAgIEBwYWdlID0gQGNyZWF0ZVBhZ2UocGFyYW1zLCBvcHRpb25zKVxuXG4gICAgbmV3IFJlbmRlcmVyXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IEBwYWdlXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICAkd3JhcHBlcjogb3B0aW9ucy4kd3JhcHBlclxuXG5cbiAgY3JlYXRlUGFnZTogKHBhcmFtcywgeyBpbnRlcmFjdGl2ZSwgcmVhZE9ubHksIGxvYWRSZXNvdXJjZXMgfT17fSkgLT5cbiAgICBwYXJhbXMgPz0ge31cbiAgICBwYXJhbXMubG9hZFJlc291cmNlcyA9IGxvYWRSZXNvdXJjZXNcbiAgICBpZiBpbnRlcmFjdGl2ZT9cbiAgICAgIEBpc0ludGVyYWN0aXZlID0gdHJ1ZVxuICAgICAgbmV3IEludGVyYWN0aXZlUGFnZShwYXJhbXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFBhZ2UocGFyYW1zKVxuXG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTG9hZGVyXG5cbiAgY29uc3RydWN0b3I6IChAd2luZG93KSAtPlxuICAgIEBsb2FkZWRVcmxzID0gW11cblxuXG4gIGxvYWQ6ICh1cmxzLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzRGlzYWJsZWRcblxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBkaXNhYmxlOiAtPlxuICAgIEBpc0Rpc2FibGVkID0gdHJ1ZVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzRGlzYWJsZWRcblxuICAgIGlmIEBpc1VybExvYWRlZCh1cmwpXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgbGluayA9ICQoJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiAvPicpWzBdXG4gICAgICBsaW5rLm9ubG9hZCA9IGNhbGxiYWNrXG5cbiAgICAgICMgRG8gbm90IHByZXZlbnQgdGhlIHBhZ2UgZnJvbSBsb2FkaW5nIGJlY2F1c2Ugb2YgY3NzIGVycm9yc1xuICAgICAgIyBvbmVycm9yIGlzIG5vdCBzdXBwb3J0ZWQgYnkgZXZlcnkgYnJvd3Nlci5cbiAgICAgICMgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2xpbmtcbiAgICAgIGxpbmsub25lcnJvciA9IC0+XG4gICAgICAgIGNvbnNvbGUud2FybiBcIlN0eWxlc2hlZXQgY291bGQgbm90IGJlIGxvYWRlZDogI3sgdXJsIH1cIlxuICAgICAgICBjYWxsYmFjaygpXG5cbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRvclBhZ2VcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAc2V0V2luZG93KClcbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcblxuICAgICMgU3R1YnNcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID1cbiAgICAgIGRpc2FibGVBbGw6IC0+XG4gICAgICByZWVuYWJsZUFsbDogLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPVxuICAgICAgZmlyZTogLT5cbiAgICBAYmx1ckZvY3VzZWRFbGVtZW50ID0gLT5cblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBzZXRXaW5kb3c6IC0+XG4gICAgQHdpbmRvdyA9IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkZvY3VzID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZm9jdXMnKVxuRWRpdGFibGVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlcicpXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbiMgQW4gSW50ZXJhY3RpdmVQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhbGxvd3MgZm9yIG1hbmlwdWxhdGlvbiBvZiB0aGVcbiMgcmVuZGVyZWQgU25pcHBldFRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEludGVyYWN0aXZlUGFnZSBleHRlbmRzIFBhZ2VcblxuICBMRUZUX01PVVNFX0JVVFRPTiA9IDFcblxuICBpc1JlYWRPbmx5OiBmYWxzZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIGhvc3RXaW5kb3cgfT17fSkgLT5cbiAgICBzdXBlclxuXG4gICAgQGZvY3VzID0gbmV3IEZvY3VzKClcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID0gbmV3IEVkaXRhYmxlQ29udHJvbGxlcih0aGlzKVxuXG4gICAgIyBldmVudHNcbiAgICBAaW1hZ2VDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGh0bWxFbGVtZW50Q2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBzbmlwcGV0V2lsbEJlRHJhZ2dlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXMuYWRkKCAkLnByb3h5KEBhZnRlclNuaXBwZXRGb2N1c2VkLCB0aGlzKSApXG4gICAgQGZvY3VzLnNuaXBwZXRCbHVyLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Qmx1cnJlZCwgdGhpcykgKVxuICAgIEBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeSgpXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlP1xuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuXG4gICAgIyBJZ25vcmUgaW50ZXJhY3Rpb25zIG9uIGNlcnRhaW4gZWxlbWVudHNcbiAgICBpc0NvbnRyb2wgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChjb25maWcuaWdub3JlSW50ZXJhY3Rpb24pLmxlbmd0aFxuICAgIHJldHVybiBpZiBpc0NvbnRyb2xcblxuICAgICMgSWRlbnRpZnkgdGhlIGNsaWNrZWQgc25pcHBldFxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG5cbiAgICAjIFRoaXMgaXMgY2FsbGVkIGluIG1vdXNlZG93biBzaW5jZSBlZGl0YWJsZXMgZ2V0IGZvY3VzIG9uIG1vdXNlZG93blxuICAgICMgYW5kIG9ubHkgYmVmb3JlIHRoZSBlZGl0YWJsZXMgY2xlYXIgdGhlaXIgcGxhY2Vob2xkZXIgY2FuIHdlIHNhZmVseVxuICAgICMgaWRlbnRpZnkgd2hlcmUgdGhlIHVzZXIgaGFzIGNsaWNrZWQuXG4gICAgQGhhbmRsZUNsaWNrZWRTbmlwcGV0KGV2ZW50LCBzbmlwcGV0VmlldylcblxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAc3RhcnREcmFnXG4gICAgICAgIHNuaXBwZXRWaWV3OiBzbmlwcGV0Vmlld1xuICAgICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjYW5jZWxEcmFnOiAtPlxuICAgIEBkcmFnQmFzZS5jYW5jZWwoKVxuXG5cbiAgaGFuZGxlQ2xpY2tlZFNuaXBwZXQ6IChldmVudCwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXNlZChzbmlwcGV0VmlldylcblxuICAgICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIEEgUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFJlbmRlcmluZ0NvbnRhaW5lciB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSBzaG93biB0b1xuIyB0aGUgdXNlci4gSXQgaGFzIGEgTG9hZGVyIHdoaWNoIGFsbG93cyB5b3UgdG8gaW5qZWN0IENTUyBhbmQgSlMgZmlsZXMgaW50byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGFnZSBleHRlbmRzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCByZWFkT25seSwgaG9zdFdpbmRvdywgQGRlc2lnbiwgQHNuaXBwZXRUcmVlLCBAbG9hZFJlc291cmNlcyB9PXt9KSAtPlxuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHJlbmRlck5vZGUgPSBpZiByZW5kZXJOb2RlPy5qcXVlcnkgdGhlbiByZW5kZXJOb2RlWzBdIGVsc2UgcmVuZGVyTm9kZVxuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcbiAgICBAcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcblxuICAgIHN1cGVyKClcblxuICAgIEBjc3NMb2FkZXIgPSBuZXcgQ3NzTG9hZGVyKEB3aW5kb3cpXG4gICAgQGNzc0xvYWRlci5kaXNhYmxlKCkgaWYgbm90IEBzaG91bGRMb2FkUmVzb3VyY2VzKClcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIGJlZm9yZVJlYWR5OiAtPlxuICAgICMgYWx3YXlzIGluaXRpYWxpemUgYSBwYWdlIGFzeW5jaHJvbm91c2x5XG4gICAgQHJlYWR5U2VtYXBob3JlLndhaXQoKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuICAgICwgMFxuXG5cbiAgc2hvdWxkTG9hZFJlc291cmNlczogLT5cbiAgICBpZiBAbG9hZFJlc291cmNlcz9cbiAgICAgIEJvb2xlYW4oQGxvYWRSZXNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgQm9vbGVhbihjb25maWcubG9hZFJlc291cmNlcylcblxuXG4gIGJlZm9yZVBhZ2VSZWFkeTogPT5cbiAgICBpZiBAZGVzaWduP1xuICAgICAgZGVzaWduUGF0aCA9IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWVzcGFjZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgaG9zdFdpbmRvdyA/PSBAZ2V0UGFyZW50V2luZG93KEByZW5kZXJOb2RlKVxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cbiAgZ2V0UGFyZW50V2luZG93OiAoZWxlbSkgLT5cbiAgICBpZiBlbGVtP1xuICAgICAgZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgZWxzZVxuICAgICAgd2luZG93XG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbiMgQSBSZW5kZXJpbmdDb250YWluZXIgaXMgdXNlZCBieSB0aGUgUmVuZGVyZXIgdG8gZ2VuZXJhdGUgSFRNTC5cbiNcbiMgVGhlIFJlbmRlcmVyIGluc2VydHMgU25pcHBldFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID89ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0VkaXRhYmxlOiB0cnVlXG5cblxuICBnZXRDb250ZW50OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIdG1sRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNIdG1sOiB0cnVlXG5cblxuICBnZXRDb250ZW50OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAc25pcHBldC5zbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcoQHNuaXBwZXQsIEBuYW1lKSBpZiBAc25pcHBldC5zbmlwcGV0VHJlZVxuXG5cbiAgc2V0SW1hZ2VVcmw6ICh2YWx1ZSkgLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdLnVybCA9IHZhbHVlXG5cbiAgICBAcmVzZXRDcm9wKClcbiAgICBAYmFzZTY0SW1hZ2UgPSB1bmRlZmluZWRcbiAgICBAcHJvY2Vzc0ltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0SW1hZ2VVcmw6IC0+XG4gICAgaW1hZ2UgPSBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGltYWdlXG4gICAgICBpbWFnZS51cmxcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuXG4gIGdldEltYWdlT2JqZWN0OiAtPlxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXS5vcmlnaW5hbFVybCB8fCBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgc2V0Q3JvcDogKHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgbmFtZSB9KSAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG5cbiAgICBpZiBjdXJyZW50VmFsdWU/LnVybD9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID1cbiAgICAgICAgeDogeFxuICAgICAgICB5OiB5XG4gICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBuYW1lOiBuYW1lXG5cbiAgICAgIEBwcm9jZXNzSW1hZ2VVcmwoY3VycmVudFZhbHVlLm9yaWdpbmFsVXJsIHx8IGN1cnJlbnRWYWx1ZS51cmwpXG4gICAgICBAc25pcHBldC5zbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcoQHNuaXBwZXQsIEBuYW1lKSBpZiBAc25pcHBldC5zbmlwcGV0VHJlZVxuXG5cbiAgcmVzZXRDcm9wOiAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdXG4gICAgaWYgY3VycmVudFZhbHVlP1xuICAgICAgY3VycmVudFZhbHVlLmNyb3AgPSBudWxsXG5cblxuICBzZXRJbWFnZVNlcnZpY2U6IChpbWFnZVNlcnZpY2VOYW1lKSAtPlxuICAgIGFzc2VydCBpbWFnZVNlcnZpY2UuaGFzKGltYWdlU2VydmljZU5hbWUpLCBcIkVycm9yOiBjb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IGltYWdlU2VydmljZU5hbWUgfVwiXG5cbiAgICBpbWFnZVVybCA9IEBnZXRJbWFnZVVybCgpXG4gICAgQHNuaXBwZXQuY29udGVudFtAbmFtZV0gPVxuICAgICAgdXJsOiBpbWFnZVVybFxuICAgICAgaW1hZ2VTZXJ2aWNlOiBpbWFnZVNlcnZpY2VOYW1lIHx8IG51bGxcblxuXG4gIGdldEltYWdlU2VydmljZU5hbWU6IC0+XG4gICAgQGdldEltYWdlU2VydmljZSgpLm5hbWVcblxuXG4gIGhhc0RlZmF1bHRJbWFnZVNlcnZpY2U6IC0+XG4gICAgQGdldEltYWdlU2VydmljZU5hbWUoKSA9PSAnZGVmYXVsdCdcblxuXG4gIGdldEltYWdlU2VydmljZTogLT5cbiAgICBzZXJ2aWNlTmFtZSA9IEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdPy5pbWFnZVNlcnZpY2VcbiAgICBpbWFnZVNlcnZpY2UuZ2V0KHNlcnZpY2VOYW1lIHx8IHVuZGVmaW5lZClcblxuXG4gIHByb2Nlc3NJbWFnZVVybDogKHVybCkgLT5cbiAgICBpZiBub3QgQGhhc0RlZmF1bHRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nU2VydmljZSA9IEBnZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nT2JqID0gQGdldEltYWdlT2JqZWN0KClcbiAgICAgIGltZ09iai51cmwgPSBpbWdTZXJ2aWNlLmdldFVybCh1cmwsIGNyb3A6IGltZ09iai5jcm9wKVxuICAgICAgaW1nT2JqLm9yaWdpbmFsVXJsID0gdXJsXG5cbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3Igc25pcHBldHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIFNuaXBwZXRBcnJheSB0aGF0IHdvcmtzIHNpbWlsYXIgdG8gYSBqUXVlcnkgb2JqZWN0LlxuIyBGb3IgZXh0ZW5zaWJpbGl0eSB2aWEgcGx1Z2lucyB3ZSBleHBvc2UgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0QXJyYXlcblxuXG4gICMgQHBhcmFtIHNuaXBwZXRzOiBhcnJheSBvZiBzbmlwcGV0c1xuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0cykgLT5cbiAgICBAc25pcHBldHMgPSBbXSB1bmxlc3MgQHNuaXBwZXRzP1xuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAc25pcHBldHNcbiAgICAgIEBbaW5kZXhdID0gcmVzdWx0XG5cbiAgICBAbGVuZ3RoID0gQHNuaXBwZXRzLmxlbmd0aFxuICAgIGlmIEBzbmlwcGV0cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAc25pcHBldHMubGVuZ3RoIC0gMV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3Igc25pcHBldCBpbiBAc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICByZW1vdmU6ICgpIC0+XG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBTbmlwcGV0Q29udGFpbmVyXG4jIC0tLS0tLS0tLS0tLS0tLS1cbiMgQSBTbmlwcGV0Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2Ygc25pcHBldHMuXG4jXG4jIFRoZSBzbmlwcGV0Q29udGFpbmVyIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIGl0cyBzbmlwcGV0VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgcGFyZW50U25pcHBldDogcGFyZW50IFNuaXBwZXRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Q29udGFpbmVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQHBhcmVudFNuaXBwZXQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBwYXJlbnRTbmlwcGV0XG4gICAgICBhc3NlcnQgc25pcHBldCBpc250IEBwYXJlbnRTbmlwcGV0LCAnY2Fubm90IGFwcGVuZCBzbmlwcGV0IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5wcmV2aW91cyA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIG5leHQ6IHNuaXBwZXRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5uZXh0ID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0XG4gICAgICBuZXh0OiBzbmlwcGV0Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICB1cDogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIEBpbnNlcnRCZWZvcmUoc25pcHBldC5wcmV2aW91cywgc25pcHBldClcblxuXG4gIGRvd246IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihzbmlwcGV0Lm5leHQsIHNuaXBwZXQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWUgfHwgQHBhcmVudFNuaXBwZXQ/LnNuaXBwZXRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldCA9IEBmaXJzdFxuICAgIHdoaWxlIChzbmlwcGV0KVxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHMgYW5kIGNvbnRhaW5lcnNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldC5kZXN0cm95KClcbiAgICBAX2RldGFjaFNuaXBwZXQoc25pcHBldClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEV2ZXJ5IHNuaXBwZXQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIEBhcGkgcHJpdmF0ZVxuICBhdHRhY2hTbmlwcGV0OiAoc25pcHBldCwgcG9zaXRpb24gPSB7fSkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEBsaW5rKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuYXR0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBFdmVyeSBzbmlwcGV0IHRoYXQgaXMgcmVtb3ZlZCBtdXN0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgU25pcHBldHMgdGhhdCBhcmUgbW92ZWQgaW5zaWRlIGEgc25pcHBldFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaFNuaXBwZXQgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBmaXJlXG4gICMgU25pcHBldFJlbW92ZWQgZXZlbnRzIG9uIHRoZSBzbmlwcGV0IHRyZWUsIGluIHRoZXNlXG4gICMgY2FzZXMgdW5saW5rIGNhbiBiZSB1c2VkXG4gICMgQGFwaSBwcml2YXRlXG4gIF9kZXRhY2hTbmlwcGV0OiAoc25pcHBldCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoc25pcHBldClcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmRldGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChzbmlwcGV0LCBwb3NpdGlvbikgLT5cbiAgICBAdW5saW5rKHNuaXBwZXQpIGlmIHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgdW5saW5rOiAoc25pcHBldCkgLT5cbiAgICBjb250YWluZXIgPSBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuICAgIGlmIGNvbnRhaW5lclxuXG4gICAgICAjIHVwZGF0ZSBwYXJlbnRDb250YWluZXIgbGlua3NcbiAgICAgIGNvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQubmV4dCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gc25pcHBldC5wcmV2aW91cyB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG4gICAgICAjIHVwZGF0ZSBwcmV2aW91cyBhbmQgbmV4dCBub2Rlc1xuICAgICAgc25pcHBldC5uZXh0Py5wcmV2aW91cyA9IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIHNuaXBwZXQucHJldmlvdXM/Lm5leHQgPSBzbmlwcGV0Lm5leHRcblxuICAgICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCB7fSlcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHNldFNuaXBwZXRQb3NpdGlvbjogKHNuaXBwZXQsIHsgcGFyZW50Q29udGFpbmVyLCBwcmV2aW91cywgbmV4dCB9KSAtPlxuICAgIHNuaXBwZXQucGFyZW50Q29udGFpbmVyID0gcGFyZW50Q29udGFpbmVyXG4gICAgc25pcHBldC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgc25pcHBldC5uZXh0ID0gbmV4dFxuXG4gICAgaWYgcGFyZW50Q29udGFpbmVyXG4gICAgICBwcmV2aW91cy5uZXh0ID0gc25pcHBldCBpZiBwcmV2aW91c1xuICAgICAgbmV4dC5wcmV2aW91cyA9IHNuaXBwZXQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIHBhcmVudENvbnRhaW5lci5sYXN0ID0gc25pcHBldCB1bmxlc3Mgc25pcHBldC5uZXh0P1xuXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbkVkaXRhYmxlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9lZGl0YWJsZV9kaXJlY3RpdmUnKVxuSW1hZ2VEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2ltYWdlX2RpcmVjdGl2ZScpXG5IdG1sRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9odG1sX2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBjcmVhdGU6ICh7IHNuaXBwZXQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pIC0+XG4gICAgRGlyZWN0aXZlID0gQGdldERpcmVjdGl2ZUNvbnN0cnVjdG9yKHRlbXBsYXRlRGlyZWN0aXZlLnR5cGUpXG4gICAgbmV3IERpcmVjdGl2ZSh7IHNuaXBwZXQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pXG5cblxuICBnZXREaXJlY3RpdmVDb25zdHJ1Y3RvcjogKGRpcmVjdGl2ZVR5cGUpIC0+XG4gICAgc3dpdGNoIGRpcmVjdGl2ZVR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICBFZGl0YWJsZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaW1hZ2UnXG4gICAgICAgIEltYWdlRGlyZWN0aXZlXG4gICAgICB3aGVuICdodG1sJ1xuICAgICAgICBIdG1sRGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIGFzc2VydCBmYWxzZSwgXCJVbnN1cHBvcnRlZCBzbmlwcGV0IGRpcmVjdGl2ZTogI3sgZGlyZWN0aXZlVHlwZSB9XCJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kaXJlY3RpdmVGYWN0b3J5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2RpcmVjdGl2ZV9mYWN0b3J5JylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5cbiMgU25pcHBldE1vZGVsXG4jIC0tLS0tLS0tLS0tLVxuIyBFYWNoIFNuaXBwZXRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBzbmlwcGV0Vmlld1xuIyBmcm9tIGEgc25pcHBldE1vZGVsXG4jXG4jIFJlcHJlc2VudHMgYSBub2RlIGluIGEgU25pcHBldFRyZWUuXG4jIEV2ZXJ5IFNuaXBwZXRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoU25pcHBldENvbnRhaW5lciksXG4jIHNpYmxpbmdzIChvdGhlciBzbmlwcGV0cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKFNuaXBwZXRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBTbmlwcGV0TW9kZWxzLlxuIyBFLmcuIGEgZ3JpZCByb3cgd291bGQgaGF2ZSBhcyBtYW55IGNvbnRhaW5lcnMgYXMgaXQgaGFzXG4jIGNvbHVtbnNcbiNcbiMgIyBAcHJvcCBwYXJlbnRDb250YWluZXI6IHBhcmVudCBTbmlwcGV0Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIHNuaXBwZXQgd2l0aG91dCB0ZW1wbGF0ZSByZWZlcmVuY2UnXG5cbiAgICBAaW5pdGlhbGl6ZURpcmVjdGl2ZXMoKVxuICAgIEBzdHlsZXMgPSB7fVxuICAgIEBkYXRhVmFsdWVzID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBTbmlwcGV0Q29udGFpbmVyXG4gICAgICAgICAgICBuYW1lOiBkaXJlY3RpdmUubmFtZVxuICAgICAgICAgICAgcGFyZW50U25pcHBldDogdGhpc1xuICAgICAgICB3aGVuICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgICAgICAgIEBjcmVhdGVTbmlwcGV0RGlyZWN0aXZlKGRpcmVjdGl2ZSlcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gICMgQ3JlYXRlIGEgZGlyZWN0aXZlIGZvciAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCcgdGVtcGxhdGUgZGlyZWN0aXZlc1xuICBjcmVhdGVTbmlwcGV0RGlyZWN0aXZlOiAodGVtcGxhdGVEaXJlY3RpdmUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuYWRkIGRpcmVjdGl2ZUZhY3RvcnkuY3JlYXRlXG4gICAgICBzbmlwcGV0OiB0aGlzXG4gICAgICB0ZW1wbGF0ZURpcmVjdGl2ZTogdGVtcGxhdGVEaXJlY3RpdmVcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICAjIFNuaXBwZXRUcmVlIG9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGJlZm9yZSB0aGlzIG9uZVxuICBiZWZvcmU6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQHByZXZpb3VzXG5cblxuICAjIEluc2VydCBhIHNuaXBwZXQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEFmdGVyKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBzbmlwcGV0IHRvIGEgY29udGFpbmVyIG9mIHRoaXMgc25pcHBldFxuICBhcHBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5hcHBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgUHJlcGVuZCBhIHNuaXBwZXQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBzbmlwcGV0XG4gIHByZXBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBzbmlwcGV0IHVwIChwcmV2aW91cylcbiAgdXA6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci51cCh0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIHNuaXBwZXQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIHNuaXBwZXQgZnJvbSBpdHMgY29udGFpbmVyIGFuZCBTbmlwcGV0VHJlZVxuICByZW1vdmU6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5yZW1vdmUodGhpcylcblxuXG4gICMgU25pcHBldFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIHNuaXBwZXQgdHJlZSByZWxhdGl2ZSB0byB0aGlzIHNuaXBwZXQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRTbmlwcGV0XG5cblxuICBwYXJlbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldE1vZGVsID0gdGhpc1xuICAgIHdoaWxlIChzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwuZ2V0UGFyZW50KCkpXG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG5cblxuICBjaGlsZHJlbjogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyAoaW5jbHVkaW5nIHRob3NlIG9mIHRoaXMgc25pcHBldE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGxEZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbCkgaWYgc25pcHBldE1vZGVsICE9IHRoaXNcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICBjaGlsZHJlbkFuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBjaGlsZHJlbihjYWxsYmFjaylcblxuXG4gICMgRGlyZWN0aXZlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgRXhhbXBsZSBob3cgdG8gZ2V0IGFuIEltYWdlRGlyZWN0aXZlOlxuICAjIGltYWdlRGlyZWN0aXZlID0gc25pcHBldE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBzbmlwcGV0XG4gIHNldENvbnRlbnQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIGlmIEBjb250ZW50W25hbWVdXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcbiAgICBlbHNlXG4gICAgICBpZiBub3QgZGVlcEVxdWFsKEBjb250ZW50W25hbWVdLCB2YWx1ZSlcbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwic2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBpZiBkaXJlY3RpdmUuaXNJbWFnZVxuICAgICAgaWYgZGlyZWN0aXZlLmdldEltYWdlVXJsKCkgIT0gdmFsdWVcbiAgICAgICAgZGlyZWN0aXZlLnNldEltYWdlVXJsKHZhbHVlKVxuICAgICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgc25pcHBldE1vZGVsLlxuXG5cbiAgIyBjYW4gYmUgY2FsbGVkIHdpdGggYSBzdHJpbmcgb3IgYSBoYXNoXG4gIGRhdGE6IChhcmcpIC0+XG4gICAgaWYgdHlwZW9mKGFyZykgPT0gJ29iamVjdCdcbiAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgYXJnXG4gICAgICAgIGlmIEBjaGFuZ2VEYXRhKG5hbWUsIHZhbHVlKVxuICAgICAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcy5wdXNoKG5hbWUpXG4gICAgICBpZiBAc25pcHBldFRyZWUgJiYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQHNuaXBwZXRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICAjIFN0eWxlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0U3R5bGU6IChuYW1lKSAtPlxuICAgIEBzdHlsZXNbbmFtZV1cblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2UgaWYgbm90IHN0eWxlLnZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBsb2cud2FybiBcIkludmFsaWQgdmFsdWUgJyN7IHZhbHVlIH0nIGZvciBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQHNuaXBwZXRUcmVlXG4gICAgICAgICAgQHNuaXBwZXRUcmVlLmh0bWxDaGFuZ2luZyh0aGlzLCAnc3R5bGUnLCB7IG5hbWUsIHZhbHVlIH0pXG5cblxuICAjIEBkZXByZWNhdGVkXG4gICMgR2V0dGVyIGFuZCBTZXR0ZXIgaW4gb25lLlxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGNvbnNvbGUubG9nKFwiU25pcHBldE1vZGVsI3N0eWxlKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAjZ2V0U3R5bGUoKSBhbmQgI3NldFN0eWxlKCkuXCIpXG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgIyBTbmlwcGV0TW9kZWwgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIlNuaXBwZXRNb2RlbCNjb3B5KCkgaXMgbm90IGltcGxlbWVudGVkIHlldC5cIilcblxuICAgICMgc2VyaWFsaXppbmcvZGVzZXJpYWxpemluZyBzaG91bGQgd29yayBidXQgbmVlZHMgdG8gZ2V0IHNvbWUgdGVzdHMgZmlyc3RcbiAgICAjIGpzb24gPSBAdG9Kc29uKClcbiAgICAjIGpzb24uaWQgPSBndWlkLm5leHQoKVxuICAgICMgU25pcHBldE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWwnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIFB1YmxpYyBNZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS1cblxuICAjIFNlcmlhbGl6ZSBhIFNuaXBwZXRNb2RlbFxuICAjXG4gICMgRXh0ZW5kcyB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRNb2RlbFxuICAjXG4gICMgRXhhbXBsZSBSZXN1bHQ6XG4gICMgaWQ6ICdha2s3aGp1dWUyJ1xuICAjIGlkZW50aWZpZXI6ICd0aW1lbGluZS50aXRsZSdcbiAgIyBjb250ZW50OiB7IC4uLiB9XG4gICMgc3R5bGVzOiB7IC4uLiB9XG4gICMgZGF0YTogeyAuLi4gfVxuICAjIGNvbnRhaW5lcnM6IHsgLi4uIH1cbiAgU25pcHBldE1vZGVsOjp0b0pzb24gPSAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID89IHRoaXNcblxuICAgIGpzb24gPVxuICAgICAgaWQ6IHNuaXBwZXQuaWRcbiAgICAgIGlkZW50aWZpZXI6IHNuaXBwZXQuaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShzbmlwcGV0LmNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KHNuaXBwZXQuY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoc25pcHBldC5zdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoc25pcHBldC5zdHlsZXMpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KHNuaXBwZXQuZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzbmlwcGV0LmRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cbiAgZnJvbUpzb246IChqc29uLCBkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uY29tcG9uZW50IHx8IGpzb24uaWRlbnRpZmllcilcblxuICAgIGFzc2VydCB0ZW1wbGF0ZSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcblxuICAgICAgIyBUcmFuc2Zvcm0gc3RyaW5nIGludG8gb2JqZWN0OiBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igb2xkIGltYWdlIHZhbHVlcy5cbiAgICAgIGlmIG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLnR5cGUgPT0gJ2ltYWdlJyAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9XG4gICAgICAgICAgdXJsOiB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICAgIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgICBtb2RlbC5zZXRTdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gICAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gICAgZm9yIGNvbnRhaW5lck5hbWUsIHNuaXBwZXRBcnJheSBvZiBqc29uLmNvbnRhaW5lcnNcbiAgICAgIGFzc2VydCBtb2RlbC5jb250YWluZXJzLmhhc093blByb3BlcnR5KGNvbnRhaW5lck5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgICAgaWYgc25pcHBldEFycmF5XG4gICAgICAgIGFzc2VydCAkLmlzQXJyYXkoc25pcHBldEFycmF5KSxcbiAgICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgICBmb3IgY2hpbGQgaW4gc25pcHBldEFycmF5XG4gICAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBAZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gICAgbW9kZWxcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5TbmlwcGV0QXJyYXkgPSByZXF1aXJlKCcuL3NuaXBwZXRfYXJyYXknKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcbnNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWxfc2VyaWFsaXplcicpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBTbmlwcGV0VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgIyBJbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICBnZXRTbmlwcGV0OiAoc25pcHBldE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXROYW1lID09ICdzdHJpbmcnXG4gICAgICBAY3JlYXRlTW9kZWwoc25pcHBldE5hbWUpXG4gICAgZWxzZVxuICAgICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6IC0+XG4gICAgQGNyZWF0ZU1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuXG4gIGdldFRlbXBsYXRlOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBkZXNpZ24uZ2V0KGlkZW50aWZpZXIpXG4gICAgYXNzZXJ0IHRlbXBsYXRlLCBcIkNvdWxkIG5vdCBmaW5kIHRlbXBsYXRlICN7IGlkZW50aWZpZXIgfVwiXG4gICAgdGVtcGxhdGVcblxuXG4gIGluaXRpYWxpemVFdmVudHM6ICgpIC0+XG5cbiAgICAjIGxheW91dCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRNb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgICMgY29udGVudCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0U2V0dGluZ3NDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgR2V0IHRoZSBmaXJzdCBzbmlwcGV0XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgICAgaWYgc25pcHBldC5pZGVudGlmaWVyID09IHNlYXJjaCB8fCBzbmlwcGV0LnRlbXBsYXRlLmlkID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKHNuaXBwZXQpXG5cbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkocmVzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgIG9sZFJvb3RcblxuXG4gICMgZWFjaFdpdGhQYXJlbnRzOiAoc25pcHBldCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goc25pcHBldClcbiAgIyAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAjICAgICBzbmlwcGV0ID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICMgICAgIHdoaWxlIChzbmlwcGV0KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoc25pcHBldCwgcGFyZW50cylcbiAgIyAgICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdTbmlwcGV0VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIHRlbXBsYXRlID0gc25pcHBldC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUudGl0bGUgfSAoI3sgdGVtcGxhdGUuaWRlbnRpZmllciB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGFkZExpbmUoXCIjeyBuYW1lIH06XCIsIGluZGVudGF0aW9uICsgMilcbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBpbmRlbnRhdGlvbikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIHNuaXBwZXRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBzbmlwcGV0Q29udGFpbmVyc1xuXG4gIGF0dGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBhdHRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBzbmlwcGV0XG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0TW92ZWQnLCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWU/XG4gICAgICAgICMgcmVtb3ZlIGZyb20gb3RoZXIgc25pcHBldCB0cmVlXG4gICAgICAgIHNuaXBwZXQuc25pcHBldENvbnRhaW5lci5kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LnNuaXBwZXRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0QWRkZWQnLCBzbmlwcGV0KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBkZXRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBhc3NlcnQgc25pcHBldC5zbmlwcGV0VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgc25pcHBldCBmcm9tIGFub3RoZXIgU25pcHBldFRyZWUnXG5cbiAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoU25pcHBldEZ1bmMoKVxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRSZW1vdmVkJywgc25pcHBldClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldENvbnRlbnRDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGh0bWxDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldEh0bWxDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGRhdGFDaGFuZ2luZzogKHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXREYXRhQ2hhbmdlZCcsIHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lc3BhY2UgfVxuXG4gICAgc25pcHBldFRvRGF0YSA9IChzbmlwcGV0LCBsZXZlbCwgY29udGFpbmVyQXJyYXkpIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggc25pcHBldERhdGFcbiAgICAgIHNuaXBwZXREYXRhXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXRUb0RhdGEoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IHNuaXBwZXREYXRhLmNvbnRhaW5lcnNbc25pcHBldENvbnRhaW5lci5uYW1lXSA9IFtdXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGxldmVsLCBkYXRhT2JqKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgIyBJbml0aWFsaXplIGEgc25pcHBldFRyZWVcbiAgIyBUaGlzIG1ldGhvZCBzdXBwcmVzc2VzIGNoYW5nZSBldmVudHMgaW4gdGhlIHNuaXBwZXRUcmVlLlxuICAjXG4gICMgQ29uc2lkZXIgdG8gY2hhbmdlIHBhcmFtczpcbiAgIyBmcm9tRGF0YSh7IGNvbnRlbnQsIGRlc2lnbiwgc2lsZW50IH0pICMgc2lsZW50IFtib29sZWFuXTogc3VwcHJlc3MgY2hhbmdlIGV2ZW50c1xuICBmcm9tRGF0YTogKGRhdGEsIGRlc2lnbiwgc2lsZW50PXRydWUpIC0+XG4gICAgaWYgZGVzaWduP1xuICAgICAgYXNzZXJ0IG5vdCBAZGVzaWduPyB8fCBkZXNpZ24uZXF1YWxzKEBkZXNpZ24pLCAnRXJyb3IgbG9hZGluZyBkYXRhLiBTcGVjaWZpZWQgZGVzaWduIGlzIGRpZmZlcmVudCBmcm9tIGN1cnJlbnQgc25pcHBldFRyZWUgZGVzaWduJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ25cblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgICBzbmlwcGV0ID0gc25pcHBldE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihzbmlwcGV0RGF0YSwgZGVzaWduKVxuICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgICBAcm9vdC5lYWNoIChzbmlwcGV0KSA9PlxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdGhpc1xuXG5cbiAgIyBBcHBlbmQgZGF0YSB0byB0aGlzIHNuaXBwZXRUcmVlXG4gICMgRmlyZXMgc25pcHBldEFkZGVkIGV2ZW50IGZvciBldmVyeSBzbmlwcGV0XG4gIGFkZERhdGE6IChkYXRhLCBkZXNpZ24pIC0+XG4gICAgQGZyb21EYXRhKGRhdGEsIGRlc2lnbiwgZmFsc2UpXG5cblxuICBhZGREYXRhV2l0aEFuaW1hdGlvbjogKGRhdGEsIGRlbGF5PTIwMCkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sICdFcnJvciBhZGRpbmcgZGF0YS4gU25pcHBldFRyZWUgaGFzIG5vIGRlc2lnbidcblxuICAgIHRpbWVvdXQgPSBOdW1iZXIoZGVsYXkpXG4gICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IHNuaXBwZXREYXRhXG4gICAgICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBzbmlwcGV0ID0gc25pcHBldE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb250ZW50LCBAZGVzaWduKVxuICAgICAgICAgIEByb290LmFwcGVuZChzbmlwcGV0KVxuICAgICAgICAsIHRpbWVvdXRcblxuICAgICAgdGltZW91dCArPSBOdW1iZXIoZGVsYXkpXG5cblxuICB0b0RhdGE6IC0+XG4gICAgQHNlcmlhbGl6ZSgpXG5cblxuICAjIEFsaWFzZXNcbiAgIyAtLS0tLS0tXG5cbiAgZnJvbUpzb246IChhcmdzLi4uKSAtPlxuICAgIEBmcm9tRGF0YS5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgdG9Kc29uOiAoYXJncy4uLikgLT5cbiAgICBAdG9EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgbmFtZSwgQHR5cGUsIEBlbGVtIH0pIC0+XG4gICAgQG5hbWUgPSBuYW1lIHx8IGNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXS5kZWZhdWx0TmFtZVxuICAgIEBjb25maWcgPSBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV1cbiAgICBAb3B0aW9uYWwgPSBmYWxzZVxuXG5cbiAgcmVuZGVyZWRBdHRyOiAtPlxuICAgIEBjb25maWcucmVuZGVyZWRBdHRyXG5cblxuICBpc0VsZW1lbnREaXJlY3RpdmU6IC0+XG4gICAgQGNvbmZpZy5lbGVtZW50RGlyZWN0aXZlXG5cblxuICAjIFJldHVybiB0aGUgbm9kZU5hbWUgaW4gbG93ZXIgY2FzZVxuICBnZXRUYWdOYW1lOiAtPlxuICAgIEBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkIGZyb20gdGhlXG4gICMgdGVtcGxhdGUgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlld1xuICBjbG9uZTogLT5cbiAgICBuZXdEaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlKG5hbWU6IEBuYW1lLCB0eXBlOiBAdHlwZSlcbiAgICBuZXdEaXJlY3RpdmUub3B0aW9uYWwgPSBAb3B0aW9uYWxcbiAgICBuZXdEaXJlY3RpdmVcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAZWxlbSlcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbiMgQSBsaXN0IG9mIGFsbCBkaXJlY3RpdmVzIG9mIGEgdGVtcGxhdGVcbiMgRXZlcnkgbm9kZSB3aXRoIGFuIGRvYy0gYXR0cmlidXRlIHdpbGwgYmUgc3RvcmVkIGJ5IGl0cyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUNvbGxlY3Rpb25cblxuICBjb25zdHJ1Y3RvcjogKEBhbGw9e30pIC0+XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIGFkZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBAYXNzZXJ0TmFtZU5vdFVzZWQoZGlyZWN0aXZlKVxuXG4gICAgIyBjcmVhdGUgcHNldWRvIGFycmF5XG4gICAgdGhpc1tAbGVuZ3RoXSA9IGRpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZS5pbmRleCA9IEBsZW5ndGhcbiAgICBAbGVuZ3RoICs9IDFcblxuICAgICMgaW5kZXggYnkgbmFtZVxuICAgIEBhbGxbZGlyZWN0aXZlLm5hbWVdID0gZGlyZWN0aXZlXG5cbiAgICAjIGluZGV4IGJ5IHR5cGVcbiAgICAjIGRpcmVjdGl2ZS50eXBlIGlzIG9uZSBvZiB0aG9zZSAnY29udGFpbmVyJywgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0gfHw9IFtdXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0ucHVzaChkaXJlY3RpdmUpXG4gICAgZGlyZWN0aXZlXG5cblxuICBuZXh0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgbmFtZXM6ICh0eXBlKSAtPlxuICAgIHJldHVybiBbXSB1bmxlc3MgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICBkaXJlY3RpdmUubmFtZVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaE9mVHlwZTogKHR5cGUsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHRoaXNbdHlwZV1cbiAgICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBlYWNoRWRpdGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnZWRpdGFibGUnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hJbWFnZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdpbWFnZScsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdjb250YWluZXInLCBjYWxsYmFjaylcblxuXG4gIGVhY2hIdG1sOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2h0bWwnLCBjYWxsYmFjaylcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgIyB0b2RvOiByZW5hbWUgb3IgYmV0dGVyIHJlbW92ZVxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpcmVjdGl2ZUZpbmRlciA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIGxpbms6IChlbGVtLCBkaXJlY3RpdmVDb2xsZWN0aW9uKSAtPlxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbGxlY3Rpb24uZ2V0KGF0dHIudmFsdWUpXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtID0gZWxlbVxuXG4gICAgdW5kZWZpbmVkXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3Igc25pcHBldCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5EaXJlY3RpdmVDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5kaXJlY3RpdmVDb21waWxlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbXBpbGVyJylcbmRpcmVjdGl2ZUZpbmRlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2ZpbmRlcicpXG5cblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4uL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsJylcblNuaXBwZXRWaWV3ID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nL3NuaXBwZXRfdmlldycpXG5cbiMgVGVtcGxhdGVcbiMgLS0tLS0tLS1cbiMgUGFyc2VzIHNuaXBwZXQgdGVtcGxhdGVzIGFuZCBjcmVhdGVzIFNuaXBwZXRNb2RlbHMgYW5kIFNuaXBwZXRWaWV3cy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGVtcGxhdGVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBodG1sLCBAbmFtZXNwYWNlLCBAaWQsIGlkZW50aWZpZXIsIHRpdGxlLCBzdHlsZXMsIHdlaWdodCB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IGh0bWwsICdUZW1wbGF0ZTogcGFyYW0gaHRtbCBtaXNzaW5nJ1xuXG4gICAgaWYgaWRlbnRpZmllclxuICAgICAgeyBAbmFtZXNwYWNlLCBAaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgQGlkZW50aWZpZXIgPSBpZiBAbmFtZXNwYWNlICYmIEBpZFxuICAgICAgXCIjeyBAbmFtZXNwYWNlIH0uI3sgQGlkIH1cIlxuXG4gICAgQCR0ZW1wbGF0ZSA9ICQoIEBwcnVuZUh0bWwoaHRtbCkgKS53cmFwKCc8ZGl2PicpXG4gICAgQCR3cmFwID0gQCR0ZW1wbGF0ZS5wYXJlbnQoKVxuXG4gICAgQHRpdGxlID0gdGl0bGUgfHwgd29yZHMuaHVtYW5pemUoIEBpZCApXG4gICAgQHN0eWxlcyA9IHN0eWxlcyB8fCB7fVxuICAgIEB3ZWlnaHQgPSB3ZWlnaHRcbiAgICBAZGVmYXVsdHMgPSB7fVxuXG4gICAgQHBhcnNlVGVtcGxhdGUoKVxuXG5cbiAgIyBjcmVhdGUgYSBuZXcgU25pcHBldE1vZGVsIGluc3RhbmNlIGZyb20gdGhpcyB0ZW1wbGF0ZVxuICBjcmVhdGVNb2RlbDogKCkgLT5cbiAgICBuZXcgU25pcHBldE1vZGVsKHRlbXBsYXRlOiB0aGlzKVxuXG5cbiAgY3JlYXRlVmlldzogKHNuaXBwZXRNb2RlbCwgaXNSZWFkT25seSkgLT5cbiAgICBzbmlwcGV0TW9kZWwgfHw9IEBjcmVhdGVNb2RlbCgpXG4gICAgJGVsZW0gPSBAJHRlbXBsYXRlLmNsb25lKClcbiAgICBkaXJlY3RpdmVzID0gQGxpbmtEaXJlY3RpdmVzKCRlbGVtWzBdKVxuXG4gICAgc25pcHBldFZpZXcgPSBuZXcgU25pcHBldFZpZXdcbiAgICAgIG1vZGVsOiBzbmlwcGV0TW9kZWxcbiAgICAgICRodG1sOiAkZWxlbVxuICAgICAgZGlyZWN0aXZlczogZGlyZWN0aXZlc1xuICAgICAgaXNSZWFkT25seTogaXNSZWFkT25seVxuXG5cbiAgcHJ1bmVIdG1sOiAoaHRtbCkgLT5cblxuICAgICMgcmVtb3ZlIGFsbCBjb21tZW50c1xuICAgIGh0bWwgPSAkKGh0bWwpLmZpbHRlciAoaW5kZXgpIC0+XG4gICAgICBAbm9kZVR5cGUgIT04XG5cbiAgICAjIG9ubHkgYWxsb3cgb25lIHJvb3QgZWxlbWVudFxuICAgIGFzc2VydCBodG1sLmxlbmd0aCA9PSAxLCBcIlRlbXBsYXRlcyBtdXN0IGNvbnRhaW4gb25lIHJvb3QgZWxlbWVudC4gVGhlIFRlbXBsYXRlIFxcXCIje0BpZGVudGlmaWVyfVxcXCIgY29udGFpbnMgI3sgaHRtbC5sZW5ndGggfVwiXG5cbiAgICBodG1sXG5cbiAgcGFyc2VUZW1wbGF0ZTogKCkgLT5cbiAgICBlbGVtID0gQCR0ZW1wbGF0ZVswXVxuICAgIEBkaXJlY3RpdmVzID0gQGNvbXBpbGVEaXJlY3RpdmVzKGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnXG4gICAgICAgICAgQGZvcm1hdEVkaXRhYmxlKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBmb3JtYXRDb250YWluZXIoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdodG1sJ1xuICAgICAgICAgIEBmb3JtYXRIdG1sKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcblxuXG4gICMgSW4gdGhlIGh0bWwgb2YgdGhlIHRlbXBsYXRlIGZpbmQgYW5kIHN0b3JlIGFsbCBET00gbm9kZXNcbiAgIyB3aGljaCBhcmUgZGlyZWN0aXZlcyAoZS5nLiBlZGl0YWJsZXMgb3IgY29udGFpbmVycykuXG4gIGNvbXBpbGVEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29tcGlsZXIucGFyc2UoZWxlbSlcbiAgICAgIGRpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSkgaWYgZGlyZWN0aXZlXG5cbiAgICBkaXJlY3RpdmVzXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZFxuICAjIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXcuXG4gIGxpbmtEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIHNuaXBwZXREaXJlY3RpdmVzID0gQGRpcmVjdGl2ZXMuY2xvbmUoKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZUZpbmRlci5saW5rKGVsZW0sIHNuaXBwZXREaXJlY3RpdmVzKVxuXG4gICAgc25pcHBldERpcmVjdGl2ZXNcblxuXG4gIGZvcm1hdEVkaXRhYmxlOiAobmFtZSwgZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVkaXRhYmxlKVxuXG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBpZiBkZWZhdWx0VmFsdWUgdGhlbiBkZWZhdWx0VmFsdWUgZWxzZSAnJ1xuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdENvbnRhaW5lcjogKG5hbWUsIGVsZW0pIC0+XG4gICAgIyByZW1vdmUgYWxsIGNvbnRlbnQgZnJvbiBhIGNvbnRhaW5lciBmcm9tIHRoZSB0ZW1wbGF0ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdEh0bWw6IChuYW1lLCBlbGVtKSAtPlxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gICMgb3V0cHV0IHRoZSBhY2NlcHRlZCBjb250ZW50IG9mIHRoZSBzbmlwcGV0XG4gICMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGNyZWF0ZVxuICAjIGUuZzogeyB0aXRsZTogXCJJdGNoeSBhbmQgU2NyYXRjaHlcIiB9XG4gIHByaW50RG9jOiAoKSAtPlxuICAgIGRvYyA9XG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuICAgICAgIyBlZGl0YWJsZXM6IE9iamVjdC5rZXlzIEBlZGl0YWJsZXMgaWYgQGVkaXRhYmxlc1xuICAgICAgIyBjb250YWluZXJzOiBPYmplY3Qua2V5cyBAY29udGFpbmVycyBpZiBAY29udGFpbmVyc1xuXG4gICAgd29yZHMucmVhZGFibGVKc29uKGRvYylcblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBuYW1lc3BhY2U6IHVuZGVmaW5lZCwgaWQ6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgbmFtZXNwYWNlOiBwYXJ0c1swXSwgaWQ6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBzbmlwcGV0IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIl19
