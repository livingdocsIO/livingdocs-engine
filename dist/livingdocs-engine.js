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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29uZmlndXJhdGlvbi9jb25maWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fc3R5bGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZG9jdW1lbnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvZGVmYXVsdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvcmVzcmNpdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2Fzc2VydC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvbG9nLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZW5kZXJlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvc25pcHBldF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvY3NzX2xvYWRlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9lZGl0YWJsZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9pbWFnZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2RpcmVjdGl2ZV9mYWN0b3J5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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UUFBQSxHQUFVLFNBQUEsR0FBQTtBQUNSLFFBQUEsR0FBQTtBQUFBLElBQUEsR0FBQSxHQUNFO0FBQUEsTUFBQSxVQUFBLEVBQVksSUFBQyxDQUFBLFVBQWI7S0FERixDQUFBO1dBS0EsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsR0FBbkIsRUFOUTtFQUFBLENBOUdWLENBQUE7O2tCQUFBOztJQW5CRixDQUFBOztBQUFBLFFBNklRLENBQUMsZUFBVCxHQUEyQixTQUFDLFVBQUQsR0FBQTtBQUN6QixNQUFBLEtBQUE7QUFBQSxFQUFBLElBQUEsQ0FBQSxVQUFBO0FBQUEsVUFBQSxDQUFBO0dBQUE7QUFBQSxFQUVBLEtBQUEsR0FBUSxVQUFVLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUZSLENBQUE7QUFHQSxFQUFBLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDRTtBQUFBLE1BQUUsU0FBQSxFQUFXLE1BQWI7QUFBQSxNQUF3QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBbEM7TUFERjtHQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNIO0FBQUEsTUFBRSxTQUFBLEVBQVcsS0FBTSxDQUFBLENBQUEsQ0FBbkI7QUFBQSxNQUF1QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBakM7TUFERztHQUFBLE1BQUE7V0FHSCxHQUFHLENBQUMsS0FBSixDQUFXLCtDQUFBLEdBQWQsVUFBRyxFQUhHO0dBTm9CO0FBQUEsQ0E3STNCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgb2JqZWN0S2V5cyA9IHJlcXVpcmUoJy4vbGliL2tleXMuanMnKTtcbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vbGliL2lzX2FyZ3VtZW50cy5qcycpO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWRPck51bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyICh4KSB7XG4gIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHgubGVuZ3RoICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIHguY29weSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeC5zbGljZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoeC5sZW5ndGggPiAwICYmIHR5cGVvZiB4WzBdICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgb3B0cykge1xuICB2YXIgaSwga2V5O1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gZGVlcEVxdWFsKGEsIGIsIG9wdHMpO1xuICB9XG4gIGlmIChpc0J1ZmZlcihhKSkge1xuICAgIGlmICghaXNCdWZmZXIoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBvcHRzKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuIiwidmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59O1xuXG5leHBvcnRzLnVuc3VwcG9ydGVkID0gdW5zdXBwb3J0ZWQ7XG5mdW5jdGlvbiB1bnN1cHBvcnRlZChvYmplY3Qpe1xuICByZXR1cm4gb2JqZWN0ICYmXG4gICAgdHlwZW9mIG9iamVjdCA9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiBvYmplY3QubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpICYmXG4gICAgIU9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmplY3QsICdjYWxsZWUnKSB8fFxuICAgIGZhbHNlO1xufTtcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJ1xuICA/IE9iamVjdC5rZXlzIDogc2hpbTtcblxuZXhwb3J0cy5zaGltID0gc2hpbTtcbmZ1bmN0aW9uIHNoaW0gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgcmV0dXJuIGtleXM7XG59XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjYgLSBnaXQuaW8vZWVcbiAqIE9saXZlciBDYWxkd2VsbFxuICogTUlUIGxpY2Vuc2VcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cblx0ICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuXHQvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuXHR2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuXHR2YXIgZXhwb3J0cyA9IHRoaXM7XG5cdHZhciBvcmlnaW5hbEdsb2JhbFZhbHVlID0gZXhwb3J0cy5FdmVudEVtaXR0ZXI7XG5cblx0LyoqXG5cdCAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdCdzIHN0b3JhZ2UgYXJyYXkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGxvb2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1ldGhvZC5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gYWxpYXNDbG9zdXJlKCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaWxsIGluaXRpYWxpc2UgdGhlIGV2ZW50IG9iamVjdCBhbmQgbGlzdGVuZXIgYXJyYXlzIGlmIHJlcXVpcmVkLlxuXHQgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG5cdCAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciByZXNwb25zZTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmV0dXJuIGEgY29uY2F0ZW5hdGVkIGFycmF5IG9mIGFsbCBtYXRjaGluZyBldmVudHMgaWZcblx0XHQvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0cmVzcG9uc2Vba2V5XSA9IGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBUYWtlcyBhIGxpc3Qgb2YgbGlzdGVuZXIgb2JqZWN0cyBhbmQgZmxhdHRlbnMgaXQgaW50byBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW119IEp1c3QgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICovXG5cdHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuXHRcdHZhciBmbGF0TGlzdGVuZXJzID0gW107XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmxhdExpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgcmVxdWVzdGVkIGxpc3RlbmVycyB2aWEgZ2V0TGlzdGVuZXJzIGJ1dCB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHJlc3VsdHMgaW5zaWRlIGFuIG9iamVjdC4gVGhpcyBpcyBtYWlubHkgZm9yIGludGVybmFsIHVzZSBidXQgb3RoZXJzIG1heSBmaW5kIGl0IHVzZWZ1bC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBpbiBhbiBvYmplY3QuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlIHx8IGxpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogQWRkcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cblx0ICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG5cdCAqIElmIHlvdSBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lIHRoZW4gdGhlIGxpc3RlbmVyIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuXHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5wdXNoKGxpc3RlbmVySXNXcmFwcGVkID8gbGlzdGVuZXIgOiB7XG5cdFx0XHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0XHRcdG9uY2U6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcblx0ICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0J3MgZmlyc3QgZXhlY3V0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRPbmNlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuXHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0b25jZTogdHJ1ZVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG5cdCAqL1xuXHRwcm90by5vbmNlID0gYWxpYXMoJ2FkZE9uY2VMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuXHQgKiBZb3UgbmVlZCB0byB0ZWxsIGl0IHdoYXQgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIG1hdGNoZWQgYnkgYSByZWdleC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcblx0XHR0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBVc2VzIGRlZmluZUV2ZW50IHRvIGRlZmluZSBtdWx0aXBsZSBldmVudHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2hlbiBwYXNzZWQgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUsIGl0IHdpbGwgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGluZGV4O1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpbmRleCA9IGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpO1xuXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogQWRkcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKiBZZWFoLCB0aGlzIGZ1bmN0aW9uIGRvZXMgcXVpdGUgYSBiaXQuIFRoYXQncyBwcm9iYWJseSBhIGJhZCB0aGluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZExpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG5cdCAqIFRoZSBmaXJzdCBhcmd1bWVudCB3aWxsIGRldGVybWluZSBpZiB0aGUgbGlzdGVuZXJzIGFyZSByZW1vdmVkICh0cnVlKSBvciBhZGRlZCAoZmFsc2UpLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gbWFuaXB1bGF0ZSB0aGUgbGlzdGVuZXJzIG9mIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuXHRcdHZhciBpO1xuXHRcdHZhciB2YWx1ZTtcblx0XHR2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG5cdFx0dmFyIG11bHRpcGxlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lcnMgOiB0aGlzLmFkZExpc3RlbmVycztcblxuXHRcdC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXQncyBwcm9wZXJ0aWVzIHRvIHRoaXMgbWV0aG9kXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuXHRcdFx0Zm9yIChpIGluIGV2dCkge1xuXHRcdFx0XHRpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpICYmICh2YWx1ZSA9IGV2dFtpXSkpIHtcblx0XHRcdFx0XHQvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG5cdFx0XHRcdFx0XHRtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBTbyBldnQgbXVzdCBiZSBhIHN0cmluZ1xuXHRcdFx0Ly8gQW5kIGxpc3RlbmVycyBtdXN0IGJlIGFuIGFycmF5IG9mIGxpc3RlbmVyc1xuXHRcdFx0Ly8gTG9vcCBvdmVyIGl0IGFuZCBwYXNzIGVhY2ggb25lIHRvIHRoZSBtdWx0aXBsZSBtZXRob2Rcblx0XHRcdGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBJZiB5b3UgZG8gbm90IHNwZWNpZnkgYW4gZXZlbnQgdGhlbiBhbGwgbGlzdGVuZXJzIHdpbGwgYmUgcmVtb3ZlZC5cblx0ICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuXHRcdHZhciB0eXBlID0gdHlwZW9mIGV2dDtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJlbW92ZSBkaWZmZXJlbnQgdGhpbmdzIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgZXZ0XG5cdFx0aWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuXHRcdFx0ZGVsZXRlIGV2ZW50c1tldnRdO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuXHRcdFx0ZGVsZXRlIHRoaXMuX2V2ZW50cztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG5cdCAqXG5cdCAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBhbGlhcygncmVtb3ZlRXZlbnQnKTtcblxuXHQvKipcblx0ICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG5cdCAqIFdoZW4gZW1pdHRlZCwgZXZlcnkgbGlzdGVuZXIgYXR0YWNoZWQgdG8gdGhhdCBldmVudCB3aWxsIGJlIGV4ZWN1dGVkLlxuXHQgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG5cdCAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cblx0ICogU28gdGhleSB3aWxsIG5vdCBhcnJpdmUgd2l0aGluIHRoZSBhcnJheSBvbiB0aGUgb3RoZXIgc2lkZSwgdGhleSB3aWxsIGJlIHNlcGFyYXRlLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcjtcblx0XHR2YXIgaTtcblx0XHR2YXIga2V5O1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cblx0XHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRcdC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG5cdFx0XHRcdFx0Ly8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG5cdFx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNba2V5XVtpXTtcblxuXHRcdFx0XHRcdGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc3BvbnNlID0gbGlzdGVuZXIubGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyB8fCBbXSk7XG5cblx0XHRcdFx0XHRpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBlbWl0RXZlbnRcblx0ICovXG5cdHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cblx0ICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiB0aGlzLmVtaXRFdmVudChldnQsIGFyZ3MpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZiBhXG5cdCAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG5cdCAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcblx0XHR0aGlzLl9vbmNlUmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcblx0ICogdGhlIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGlzIG9uZSB0aGVuIGl0IHNob3VsZCBiZSByZW1vdmVkXG5cdCAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cblx0ICpcblx0ICogQHJldHVybiB7KnxCb29sZWFufSBUaGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBmb3Igb3IgdGhlIGRlZmF1bHQsIHRydWUuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIF9nZXRPbmNlUmV0dXJuVmFsdWUoKSB7XG5cdFx0aWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXZlcnRzIHRoZSBnbG9iYWwge0BsaW5rIEV2ZW50RW1pdHRlcn0gdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgdmVyc2lvbi5cblx0ICpcblx0ICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG5cdCAqL1xuXHRFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG5cdFx0ZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBvcmlnaW5hbEdsb2JhbFZhbHVlO1xuXHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdH07XG5cblx0Ly8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHRcdH0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblx0fVxufS5jYWxsKHRoaXMpKTtcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuYXVnbWVudENvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9hdWdtZW50X2NvbmZpZycpXG5Eb2N1bWVudCA9IHJlcXVpcmUoJy4vZG9jdW1lbnQnKVxuU25pcHBldFRyZWUgPSByZXF1aXJlKCcuL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuXG4gICMgSW5zdGFudGlhdGlvbiBwcm9jZXNzOlxuICAjIGFzeW5jIG9yIHN5bmMgLT4gZ2V0IGRlc2lnbiAoaW5jbHVkZSBqcyBmb3Igc3luY2hyb25vdXMgbG9hZGluZylcbiAgIyBzeW5jIC0+IGNyZWF0ZSBkb2N1bWVudFxuICAjIGFzeW5jIC0+IGNyZWF0ZSB2aWV3IChpZnJhbWUpXG4gICMgYXN5bmMgLT4gbG9hZCByZXNvdXJjZXMgaW50byB2aWV3XG5cblxuICAjIExvYWQgYSBkb2N1bWVudCBmcm9tIHNlcmlhbGl6ZWQgZGF0YVxuICAjIGluIGEgc3luY2hyb25vdXMgd2F5LiBEZXNpZ24gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gIG5ldzogKHsgZGF0YSwgZGVzaWduIH0pIC0+XG4gICAgc25pcHBldFRyZWUgPSBpZiBkYXRhP1xuICAgICAgZGVzaWduTmFtZSA9IGRhdGEuZGVzaWduPy5uYW1lXG4gICAgICBhc3NlcnQgZGVzaWduTmFtZT8sICdFcnJvciBjcmVhdGluZyBkb2N1bWVudDogTm8gZGVzaWduIGlzIHNwZWNpZmllZC4nXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGNvbnRlbnQ6IGRhdGEsIGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIGRlc2lnbk5hbWUgPSBkZXNpZ25cbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoZGVzaWduOiBkZXNpZ24pXG5cbiAgICBAY3JlYXRlKHNuaXBwZXRUcmVlKVxuXG5cbiAgIyBUb2RvOiBhZGQgYXN5bmMgYXBpIChhc3luYyBiZWNhdXNlIG9mIHRoZSBsb2FkaW5nIG9mIHRoZSBkZXNpZ24pXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAoZG9jdW1lbnQpIC0+XG4gICMgICAgZG9jdW1lbnQuY3JlYXRlVmlldygnLmNvbnRhaW5lcicsIHsgaW50ZXJhY3RpdmU6IHRydWUgfSlcbiAgIyAgLnRoZW4gKHZpZXcpIC0+XG4gICMgICAgIyB2aWV3IGlzIHJlYWR5XG5cblxuICAjIERpcmVjdCBjcmVhdGlvbiB3aXRoIGFuIGV4aXN0aW5nIFNuaXBwZXRUcmVlXG4gIGNyZWF0ZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIG5ldyBEb2N1bWVudCh7IHNuaXBwZXRUcmVlIH0pXG5cblxuICAjIFNlZSBkZXNpZ25DYWNoZS5sb2FkIGZvciBleGFtcGxlcyBob3cgdG8gbG9hZCB5b3VyIGRlc2lnbi5cbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG4gICMgU3RhcnQgZHJhZyAmIGRyb3BcbiAgc3RhcnREcmFnOiAkLnByb3h5KGVkaXRvclBhZ2UsICdzdGFydERyYWcnKVxuXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG4iLCIjIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuI1xuIyBjb25maWcuZG9jRGlyZWN0aXZlXG4jICAgV2lsbCBwcmVmaXggdGhlIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggY29uZmlnLmF0dHJpYnV0ZVByZWZpeFxuIyAgIGUuZy4gY29uZmlnLmRvY0RpcmVjdGl2ZS5lZGl0YWJsZSA9PSAnZGF0YS1kb2MtZWRpdGFibGUnXG4jXG4jIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBcbiMgICBBIGxvb2t1cCBvYmplY3QgZm9yIGVhc2llciBsb29rdXBzIG9mIHRoZSBkaXJlY3RpdmUgbmFtZSBieSB0ZW1wbGF0ZSBhdHRyaWJ1dGUuXG4jICAgZS5nLiBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwWydkb2MtZWRpdGFibGUnXSA9PSAnZWRpdGFibGUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGNvbmZpZykgLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIGNvbmZpZy5kb2NEaXJlY3RpdmUgPSB7fVxuICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgY29uZmlnLmRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gaWYgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB0aGVuIFwiI3sgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB9LVwiIGVsc2UgJydcbiAgICB2YWx1ZS5yZW5kZXJlZEF0dHIgPSBcIiN7IHByZWZpeCB9I3sgdmFsdWUuYXR0ciB9XCJcblxuICAgIGNvbmZpZy5kb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG4iLCJhdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9hdWdtZW50X2NvbmZpZycpXG5cbiMgQ29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpZyA9IGRvIC0+XG5cbiAgIyBMb2FkIGNzcyBhbmQganMgcmVzb3VyY2VzIGluIHBhZ2VzIGFuZCBpbnRlcmFjdGl2ZSBwYWdlc1xuICBsb2FkUmVzb3VyY2VzOiB0cnVlXG5cbiAgIyBDU1Mgc2VsZWN0b3IgZm9yIGVsZW1lbnRzIChhbmQgdGhlaXIgY2hpbGRyZW4pIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcbiAgIyB3aGVuIGZvY3Vzc2luZyBvciBibHVycmluZyBhIHNuaXBwZXRcbiAgaWdub3JlSW50ZXJhY3Rpb246ICcubGQtY29udHJvbCdcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEVkaXRhYmxlIGNvbmZpZ3VyYXRpb25cbiAgZWRpdGFibGU6XG4gICAgYWxsb3dOZXdsaW5lOiB0cnVlICMgQWxsb3cgdG8gaW5zZXJ0IG5ld2xpbmVzIHdpdGggU2hpZnQrRW50ZXJcbiAgICBjaGFuZ2VEZWxheTogMCAjIERlbGF5IGZvciB1cGRhdGluZyB0aGUgc25pcHBldCBtb2RlbHMgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHVzZXIgY2hhbmdlcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgYnJvd3NlclNwZWxsY2hlY2s6IGZhbHNlICMgU2V0IHRoZSBzcGVsbGNoZWNrIGF0dHJpYnV0ZSBvbiBjb250ZW50ZWRpdGFibGVzIHRvICd0cnVlJyBvciAnZmFsc2UnXG4gICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogZmFsc2UgIyBXaGV0aGVyIHRvIGZpcmUgY3Vyc29yIGFuZCBzZWxjdGlvbiBjaGFuZ2VzIG9uIG1vdXNlbW92ZVxuXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBzbmlwcGV0IGNsYXNzZXNcbiAgICBzbmlwcGV0OiAnZG9jLXNuaXBwZXQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBzbmlwcGV0SGlnaGxpZ2h0OiAnZG9jLXNuaXBwZXQtaGlnaGxpZ2h0J1xuICAgIGNvbnRhaW5lckhpZ2hsaWdodDogJ2RvYy1jb250YWluZXItaGlnaGxpZ2h0J1xuXG4gICAgIyBkcmFnICYgZHJvcFxuICAgIGRyYWdnZWQ6ICdkb2MtZHJhZ2dlZCdcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXI6ICdkb2MtZHJhZ2dlZC1wbGFjZWhvbGRlcidcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyOiAnZG9jLWRyYWctY291bnRlcidcbiAgICBkcmFnQmxvY2tlcjogJ2RvYy1kcmFnLWJsb2NrZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG5hdWdtZW50Q29uZmlnKGNvbmZpZylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnblN0eWxlID0gcmVxdWlyZSgnLi9kZXNpZ25fc3R5bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gIGNvbnN0cnVjdG9yOiAoZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlcyA9IGRlc2lnbi50ZW1wbGF0ZXMgfHwgZGVzaWduLnNuaXBwZXRzXG4gICAgY29uZmlnID0gZGVzaWduLmNvbmZpZ1xuICAgIGdyb3VwcyA9IGRlc2lnbi5jb25maWcuZ3JvdXBzIHx8IGRlc2lnbi5ncm91cHNcblxuICAgIEBuYW1lc3BhY2UgPSBjb25maWc/Lm5hbWVzcGFjZSB8fCAnbGl2aW5nZG9jcy10ZW1wbGF0ZXMnXG4gICAgQHBhcmFncmFwaFNuaXBwZXQgPSBjb25maWc/LnBhcmFncmFwaCB8fCAndGV4dCdcbiAgICBAY3NzID0gY29uZmlnLmNzc1xuICAgIEBqcyA9IGNvbmZpZy5qc1xuICAgIEBmb250cyA9IGNvbmZpZy5mb250c1xuICAgIEB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBncm91cHMgPSB7fVxuICAgIEBzdHlsZXMgPSB7fVxuXG4gICAgQHN0b3JlVGVtcGxhdGVEZWZpbml0aW9ucyh0ZW1wbGF0ZXMpXG4gICAgQGdsb2JhbFN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZGVzaWduLmNvbmZpZy5zdHlsZXMpXG4gICAgQGFkZEdyb3Vwcyhncm91cHMpXG4gICAgQGFkZFRlbXBsYXRlc05vdEluR3JvdXBzKClcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZXNwYWNlID09IEBuYW1lc3BhY2VcblxuXG4gIHN0b3JlVGVtcGxhdGVEZWZpbml0aW9uczogKHRlbXBsYXRlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9ucyA9IHt9XG4gICAgZm9yIHRlbXBsYXRlIGluIHRlbXBsYXRlc1xuICAgICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcblxuXG4gICMgcGFzcyB0aGUgdGVtcGxhdGUgYXMgb2JqZWN0XG4gICMgZS5nIGFkZCh7aWQ6IFwidGl0bGVcIiwgbmFtZTpcIlRpdGxlXCIsIGh0bWw6IFwiPGgxIGRvYy1lZGl0YWJsZT5UaXRsZTwvaDE+XCJ9KVxuICBhZGQ6ICh0ZW1wbGF0ZURlZmluaXRpb24sIHN0eWxlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZURlZmluaXRpb24uaWRdID0gdW5kZWZpbmVkXG4gICAgdGVtcGxhdGVPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbih0ZW1wbGF0ZURlZmluaXRpb24uc3R5bGVzKVxuICAgIHRlbXBsYXRlU3R5bGVzID0gJC5leHRlbmQoe30sIHN0eWxlcywgdGVtcGxhdGVPbmx5U3R5bGVzKVxuXG4gICAgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGVcbiAgICAgIG5hbWVzcGFjZTogQG5hbWVzcGFjZVxuICAgICAgaWQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5pZFxuICAgICAgdGl0bGU6IHRlbXBsYXRlRGVmaW5pdGlvbi50aXRsZVxuICAgICAgc3R5bGVzOiB0ZW1wbGF0ZVN0eWxlc1xuICAgICAgaHRtbDogdGVtcGxhdGVEZWZpbml0aW9uLmh0bWxcbiAgICAgIHdlaWdodDogdGVtcGxhdGVEZWZpbml0aW9uLndlaWdodCB8fCAwXG5cbiAgICBAdGVtcGxhdGVzLnB1c2godGVtcGxhdGUpXG4gICAgdGVtcGxhdGVcblxuXG4gIGFkZEdyb3VwczogKGNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGdyb3VwTmFtZSwgZ3JvdXAgb2YgY29sbGVjdGlvblxuICAgICAgZ3JvdXBPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihncm91cC5zdHlsZXMpXG4gICAgICBncm91cFN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBAZ2xvYmFsU3R5bGVzLCBncm91cE9ubHlTdHlsZXMpXG5cbiAgICAgIHRlbXBsYXRlcyA9IHt9XG4gICAgICBmb3IgdGVtcGxhdGVJZCBpbiBncm91cC50ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGVEZWZpbml0aW9uID0gQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVJZF1cbiAgICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgICAgdGVtcGxhdGUgPSBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgZ3JvdXBTdHlsZXMpXG4gICAgICAgICAgdGVtcGxhdGVzW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cud2FybihcIlRoZSB0ZW1wbGF0ZSAnI3t0ZW1wbGF0ZUlkfScgcmVmZXJlbmNlZCBpbiB0aGUgZ3JvdXAgJyN7Z3JvdXBOYW1lfScgZG9lcyBub3QgZXhpc3QuXCIpXG5cbiAgICAgIEBhZGRHcm91cChncm91cE5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpXG5cblxuICBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwczogKGdsb2JhbFN0eWxlcykgLT5cbiAgICBmb3IgdGVtcGxhdGVJZCwgdGVtcGxhdGVEZWZpbml0aW9uIG9mIEB0ZW1wbGF0ZURlZmluaXRpb25zXG4gICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIEBnbG9iYWxTdHlsZXMpXG5cblxuICBhZGRHcm91cDogKG5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpIC0+XG4gICAgQGdyb3Vwc1tuYW1lXSA9XG4gICAgICB0aXRsZTogZ3JvdXAudGl0bGVcbiAgICAgIHRlbXBsYXRlczogdGVtcGxhdGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb246IChzdHlsZXMpIC0+XG4gICAgZGVzaWduU3R5bGVzID0ge31cbiAgICBpZiBzdHlsZXNcbiAgICAgIGZvciBzdHlsZURlZmluaXRpb24gaW4gc3R5bGVzXG4gICAgICAgIGRlc2lnblN0eWxlID0gQGNyZWF0ZURlc2lnblN0eWxlKHN0eWxlRGVmaW5pdGlvbilcbiAgICAgICAgZGVzaWduU3R5bGVzW2Rlc2lnblN0eWxlLm5hbWVdID0gZGVzaWduU3R5bGUgaWYgZGVzaWduU3R5bGVcblxuICAgIGRlc2lnblN0eWxlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGU6IChzdHlsZURlZmluaXRpb24pIC0+XG4gICAgaWYgc3R5bGVEZWZpbml0aW9uICYmIHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICBuZXcgRGVzaWduU3R5bGVcbiAgICAgICAgbmFtZTogc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgICAgdHlwZTogc3R5bGVEZWZpbml0aW9uLnR5cGVcbiAgICAgICAgb3B0aW9uczogc3R5bGVEZWZpbml0aW9uLm9wdGlvbnNcbiAgICAgICAgdmFsdWU6IHN0eWxlRGVmaW5pdGlvbi52YWx1ZVxuXG5cbiAgcmVtb3ZlOiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgQHRlbXBsYXRlcy5zcGxpY2UoQGdldEluZGV4KGlkKSwgMSlcblxuXG4gIGdldDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIHRlbXBsYXRlID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaW5kZXgpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICB0ZW1wbGF0ZSA9IHRcblxuICAgICAgdGVtcGxhdGVcblxuXG4gIGdldEluZGV4OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgaW5kZXggPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpKSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgaW5kZXggPSBpXG5cbiAgICAgIGluZGV4XG5cblxuICBjaGVja05hbWVzcGFjZTogKGlkZW50aWZpZXIsIGNhbGxiYWNrKSAtPlxuICAgIHsgbmFtZXNwYWNlLCBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgbm90IG5hbWVzcGFjZSBvciBAbmFtZXNwYWNlIGlzIG5hbWVzcGFjZSxcbiAgICAgIFwiZGVzaWduICN7IEBuYW1lc3BhY2UgfTogY2Fubm90IGdldCB0ZW1wbGF0ZSB3aXRoIGRpZmZlcmVudCBuYW1lc3BhY2UgI3sgbmFtZXNwYWNlIH0gXCJcblxuICAgIGNhbGxiYWNrKGlkKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciB0ZW1wbGF0ZSwgaW5kZXggaW4gQHRlbXBsYXRlc1xuICAgICAgY2FsbGJhY2sodGVtcGxhdGUsIGluZGV4KVxuXG5cbiAgIyBsaXN0IGF2YWlsYWJsZSBUZW1wbGF0ZXNcbiAgbGlzdDogLT5cbiAgICB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBlYWNoICh0ZW1wbGF0ZSkgLT5cbiAgICAgIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICB0ZW1wbGF0ZXNcblxuXG4gICMgcHJpbnQgZG9jdW1lbnRhdGlvbiBmb3IgYSB0ZW1wbGF0ZVxuICBpbmZvOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXQoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5wcmludERvYygpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlc2lnbnM6IHt9XG5cbiAgIyBDYW4gbG9hZCBhIGRlc2lnbiBzeW5jaHJvbm91c2x5IGlmIHlvdSBpbmNsdWRlIHRoZVxuICAjIGRlc2lnbi5qcyBmaWxlIGJlZm9yZSBsaXZpbmdkb2NzLlxuICAjIGRvYy5kZXNpZ24ubG9hZChkZXNpZ25zWyd5b3VyRGVzaWduJ10pXG4gICNcbiAgIyBXaWxsIGJlIGV4dGVuZGVkIHRvIGxvYWQgZGVzaWducyByZW1vdGVseSBmcm9tIGEgc2VydmVyOlxuICAjIExvYWQgZnJvbSB0aGUgZGVmYXVsdCBzb3VyY2U6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdnaGlibGknKVxuICAjXG4gICMgTG9hZCBmcm9tIGEgY3VzdG9tIHNlcnZlcjpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2h0dHA6Ly95b3Vyc2VydmVyLmlvL2Rlc2lnbnMvZ2hpYmxpL2Rlc2lnbi5qc29uJylcbiAgbG9hZDogKGRlc2lnblNwZWMpIC0+XG4gICAgaWYgdHlwZW9mIGRlc2lnblNwZWMgPT0gJ3N0cmluZydcbiAgICAgIGFzc2VydCBmYWxzZSwgJ0xvYWQgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkIHlldC4nXG4gICAgZWxzZVxuICAgICAgbmFtZSA9IGRlc2lnblNwZWMuY29uZmlnPy5uYW1lc3BhY2VcbiAgICAgIHJldHVybiBpZiBub3QgbmFtZT8gb3IgQGhhcyhuYW1lKVxuXG4gICAgICBkZXNpZ24gPSBuZXcgRGVzaWduKGRlc2lnblNwZWMpXG4gICAgICBAYWRkKGRlc2lnbilcblxuXG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBuYW1lID0gZGVzaWduLm5hbWVzcGFjZVxuICAgIEBkZXNpZ25zW25hbWVdID0gZGVzaWduXG5cblxuICBoYXM6IChuYW1lKSAtPlxuICAgIEBkZXNpZ25zW25hbWVdP1xuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGhhcyhuYW1lKSwgXCJFcnJvcjogZGVzaWduICcjeyBuYW1lIH0nIGlzIG5vdCBsb2FkZWQuXCJcbiAgICBAZGVzaWduc1tuYW1lXVxuXG5cbiAgcmVzZXRDYWNoZTogLT5cbiAgICBAZGVzaWducyA9IHt9XG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduU3R5bGVcblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgc25pcHBldCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBEZXNpZ25TdHlsZSN2YWxpZGF0ZVZhbHVlKCkgZm9yIHR5cGUgI3sgQHR5cGUgfVwiXG5cblxuICBjb250YWluc09wdGlvbjogKHZhbHVlKSAtPlxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIHJldHVybiB0cnVlIGlmIHZhbHVlIGlzIG9wdGlvbi52YWx1ZVxuXG4gICAgZmFsc2VcblxuXG4gIG90aGVyT3B0aW9uczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcblxuXG4gIG90aGVyQ2xhc3NlczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uLnZhbHVlIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5QYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZy9yZW5kZXJlcicpXG5WaWV3ID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvdmlldycpXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEb2N1bWVudCBleHRlbmRzIEV2ZW50RW1pdHRlclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHNuaXBwZXRUcmVlIH0pIC0+XG4gICAgQGRlc2lnbiA9IHNuaXBwZXRUcmVlLmRlc2lnblxuICAgIEBzZXRTbmlwcGV0VHJlZShzbmlwcGV0VHJlZSlcbiAgICBAdmlld3MgPSB7fVxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB1bmRlZmluZWRcblxuXG4gICMgR2V0IGEgZHJvcCB0YXJnZXQgZm9yIGFuIGV2ZW50XG4gIGdldERyb3BUYXJnZXQ6ICh7IGV2ZW50IH0pIC0+XG4gICAgZG9jdW1lbnQgPSBldmVudC50YXJnZXQub3duZXJEb2N1bWVudFxuICAgIHsgY2xpZW50WCwgY2xpZW50WSB9ID0gZXZlbnRcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuICAgIGlmIGVsZW0/XG4gICAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50LnBhZ2VYLCB0b3A6IGV2ZW50LnBhZ2VZIH1cbiAgICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcylcblxuXG4gIHNldFNuaXBwZXRUcmVlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXRUcmVlLmRlc2lnbiA9PSBAZGVzaWduLFxuICAgICAgJ1NuaXBwZXRUcmVlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZXNpZ24gYXMgdGhlIGRvY3VtZW50J1xuXG4gICAgQG1vZGVsID0gQHNuaXBwZXRUcmVlID0gc25pcHBldFRyZWVcbiAgICBAZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzKClcblxuXG4gIGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50czogLT5cbiAgICBAc25pcHBldFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBlbWl0ICdjaGFuZ2UnLCBhcmd1bWVudHNcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgb3B0aW9ucy5yZWFkT25seSA/PSB0cnVlXG5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcblxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQHNuaXBwZXRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHByb21pc2UgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG5cbiAgICBwcm9taXNlXG5cblxuICAjIEEgdmlldyBzb21ldGltZXMgaGFzIHRvIGJlIHdyYXBwZWQgaW4gYSBjb250YWluZXIuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIEhlcmUgdGhlIGRvY3VtZW50IGlzIHJlbmRlcmVkIGludG8gJCgnLmRvYy1zZWN0aW9uJylcbiAgIyA8ZGl2IGNsYXNzPVwiaWZyYW1lLWNvbnRhaW5lclwiPlxuICAjICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj48L3NlY3Rpb24+XG4gICMgPC9kaXY+XG4gIGZpbmRXcmFwcGVyOiAoJHBhcmVudCkgLT5cbiAgICBpZiAkcGFyZW50LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIikubGVuZ3RoID09IDFcbiAgICAgICR3cmFwcGVyID0gJCgkcGFyZW50Lmh0bWwoKSlcblxuICAgICR3cmFwcGVyXG5cblxuICBzZXRJbnRlcmFjdGl2ZVZpZXc6ICh2aWV3KSAtPlxuICAgIGFzc2VydCBub3QgQGludGVyYWN0aXZlVmlldz8sXG4gICAgICAnRXJyb3IgY3JlYXRpbmcgaW50ZXJhY3RpdmUgdmlldzogRG9jdW1lbnQgY2FuIGhhdmUgb25seSBvbmUgaW50ZXJhY3RpdmUgdmlldydcblxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB2aWV3XG5cblxuICB0b0h0bWw6IC0+XG4gICAgbmV3IFJlbmRlcmVyKFxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcbiAgICApLmh0bWwoKVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zZXJpYWxpemUoKVxuXG5cbiAgdG9Kc29uOiAocHJldHRpZnkpIC0+XG4gICAgZGF0YSA9IEBzZXJpYWxpemUoKVxuICAgIGlmIHByZXR0aWZ5P1xuICAgICAgcmVwbGFjZXIgPSBudWxsXG4gICAgICBzcGFjZSA9IDJcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEsIHJlcGxhY2VyLCBzcGFjZSlcbiAgICBlbHNlXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhKVxuXG5cbiAgIyBEZWJ1Z1xuICAjIC0tLS0tXG5cbiAgIyBQcmludCB0aGUgU25pcHBldFRyZWUuXG4gIHByaW50TW9kZWw6ICgpIC0+XG4gICAgQHNuaXBwZXRUcmVlLnByaW50KClcblxuXG4gIERvY3VtZW50LmRvbSA9IGRvbVxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID1cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAnZGVmYXVsdCdcblxuICAjIFNldCB2YWx1ZSB0byBhbiBpbWFnZSBvciBiYWNrZ3JvdW5kIGltYWdlIGVsZW1lbnQuXG4gICNcbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH0gTm9kZSB0byBzZXQgdGhlIGltYWdlIHRvLlxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEltYWdlIHVybFxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBkaW0gPSBAZ2V0SW1hZ2VEaW1lbnNpb25zKCRlbGVtKVxuICAgIGltYWdlVXJsID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7IGRpbS53aWR0aCB9eCN7IGRpbS5oZWlnaHQgfS9CRUY1NkYvQjJFNjY4XCJcblxuXG4gICMgVGhlIGRlZmF1bHQgc2VydmljZSBkb2VzIG5vdCB0cmFuc2ZvciB0aGUgZ2l2ZW4gdXJsXG4gIGdldFVybDogKHZhbHVlKSAtPlxuICAgIHZhbHVlXG5cblxuICAjIERlZmF1bHQgSW1hZ2UgU2VydmljZSBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgZ2V0SW1hZ2VEaW1lbnNpb25zOiAoJGVsZW0pIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICB3aWR0aDogJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0OiAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoOiAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0ub3V0ZXJIZWlnaHQoKVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMCBpZiB2YWx1ZT9cblxuXG4gIGlzSW5saW5lSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG5cblxuICBpc0JhY2tncm91bmRJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT0gJ2ltZydcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kZWZhdWx0SW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxucmVzcmNpdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQXZhaWxhYmxlIEltYWdlIFNlcnZpY2VzXG4gIHNlcnZpY2VzID1cbiAgICAncmVzcmMuaXQnOiByZXNyY2l0SW1hZ2VTZXJ2aWNlXG4gICAgJ2RlZmF1bHQnOiBkZWZhdWx0SW1hZ2VTZXJ2aWNlXG5cblxuICAjIFNlcnZpY2VcbiAgIyAtLS0tLS0tXG5cbiAgaGFzOiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdP1xuXG5cbiAgZ2V0OiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgYXNzZXJ0IEBoYXMoc2VydmljZU5hbWUpLCBcIkNvdWxkIG5vdCBsb2FkIGltYWdlIHNlcnZpY2UgI3sgc2VydmljZU5hbWUgfVwiXG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdXG5cblxuICBlYWNoU2VydmljZTogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzZXJ2aWNlIG9mIHNlcnZpY2VzXG4gICAgICBjYWxsYmFjayhuYW1lLCBzZXJ2aWNlKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICByZXNyY2l0VXJsOiAnaHR0cDovL2FwcC5yZXNyYy5pdC8nXG5cbiAgIyBJbWFnZSBTZXJ2aWNlIEludGVyZmFjZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbmFtZTogJ3Jlc3JjLml0J1xuXG4gICMgQHBhcmFtIHsgalF1ZXJ5IG9iamVjdCB9XG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gQSByZXNyYy5pdCB1cmwuIEUuZy4gaHR0cDovL2FwcC5yZXNyYy5pdC9odHRwOi8vaW1hZ2VzLmNvbS8xLmpwZ1xuICBzZXQ6ICgkZWxlbSwgdXJsKSAtPlxuICAgIGFzc2VydCB1cmw/ICYmIHVybCAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICByZXR1cm4gQHNldEJhc2U2NCgkZWxlbSwgdXJsKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KHVybClcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgaW1nU2VydmljZS5pc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgQHNldElubGluZUltYWdlKCRlbGVtLCB1cmwpXG4gICAgZWxzZVxuICAgICAgQHNldEJhY2tncm91bmRJbWFnZSgkZWxlbSwgdXJsKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBpbWdTZXJ2aWNlLnNldFBsYWNlaG9sZGVyKCRlbGVtKVxuXG5cbiAgZ2V0VXJsOiAodmFsdWUsIHsgY3JvcCB9KSAtPlxuICAgIGNyb3BQYXJhbSA9IFwiQz1XI3sgY3JvcC53aWR0aCB9LEgjeyBjcm9wLmhlaWdodCB9LFgjeyBjcm9wLnggfSxZI3sgY3JvcC55IH0vXCIgaWYgY3JvcD9cbiAgICBcIiN7IEByZXNyY2l0VXJsIH0jeyBjcm9wUGFyYW0gfHwgJycgfSN7IHZhbHVlIH1cIlxuXG5cbiAgIyBJbWFnZSBzcGVjaWZpYyBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGZvcm1hdENzc1VybDogKHVybCkgLT5cbiAgICB1cmwgPSBpbWdTZXJ2aWNlLmVzY2FwZUNzc1VyaSh1cmwpXG4gICAgXCJ1cmwoI3sgdXJsIH0pXCJcblxuXG4gIHNldElubGluZUltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICRlbGVtLmF0dHIoJ2RhdGEtc3JjJywgdXJsKVxuXG5cbiAgc2V0QmFja2dyb3VuZEltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBAZm9ybWF0Q3NzVXJsKHVybCkpXG5cblxuICAjIFNldCBzcmMgZGlyZWN0bHksIGRvbid0IGFkZCByZXNyYyBjbGFzc1xuICBzZXRCYXNlNjQ6ICgkZWxlbSwgYmFzZTY0U3RyaW5nKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0KCRlbGVtLCBiYXNlNjRTdHJpbmcpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBET00gaGVscGVyIG1ldGhvZHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE1ldGhvZHMgdG8gcGFyc2UgYW5kIHVwZGF0ZSB0aGUgRG9tIHRyZWUgaW4gYWNjb3JkYW5jZSB0b1xuIyB0aGUgU25pcHBldFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBzbmlwcGV0UmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zbmlwcGV0IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNlY3Rpb24gfSg/OiB8JClcIilcblxuICAjIEZpbmQgdGhlIHNuaXBwZXQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgU25pcHBldHMgYXJlIG1hcmtlZCBieSBhIGNsYXNzIGF0IHRoZSBtb21lbnQuXG4gIGZpbmRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRTbmlwcGV0Vmlldyhub2RlKVxuICAgICAgICByZXR1cm4gdmlld1xuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBmaW5kTm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgbm9kZUNvbnRleHQgPSBAZ2V0Tm9kZUNvbnRleHQobm9kZSlcbiAgICAgIHJldHVybiBub2RlQ29udGV4dCBpZiBub2RlQ29udGV4dFxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBnZXROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZVR5cGUsIG9iaiBvZiBjb25maWcuZGlyZWN0aXZlc1xuICAgICAgY29udGludWUgaWYgbm90IG9iai5lbGVtZW50RGlyZWN0aXZlXG5cbiAgICAgIGRpcmVjdGl2ZUF0dHIgPSBvYmoucmVuZGVyZWRBdHRyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRleHRBdHRyOiBkaXJlY3RpdmVBdHRyXG4gICAgICAgICAgYXR0ck5hbWU6IG5vZGUuZ2V0QXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICMgRmluZCB0aGUgY29udGFpbmVyIHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICBmaW5kQ29udGFpbmVyOiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICB2aWV3ID0gQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcbiAgICAgICAgICBzbmlwcGV0Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Q29udGFpbmVyVGFyZ2V0KG5vZGUpXG5cbiAgICAgICMgYWJvdmUgc25pcHBldFxuICAgICAgZWxzZSBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcmV0dXJuIEBnZXRTbmlwcGV0VGFyZ2V0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG5cbiAgICAgICMgYWJvdmUgcm9vdCBjb250YWluZXJcbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldFJvb3RUYXJnZXQobm9kZSlcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG5cbiAgZ2V0U25pcHBldFRhcmdldDogKGVsZW0sIHsgdG9wLCBsZWZ0LCBwb3NpdGlvbiB9KSAtPlxuICAgIHRhcmdldDogJ3NuaXBwZXQnXG4gICAgc25pcHBldFZpZXc6IEBnZXRTbmlwcGV0VmlldyhlbGVtKVxuICAgIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBAZ2V0UG9zaXRpb25PblNuaXBwZXQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0OiAoY2xvc2VzdFNuaXBwZXREYXRhKSAtPlxuICAgIGVsZW0gPSBjbG9zZXN0U25pcHBldERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RTbmlwcGV0RGF0YS5wb3NpdGlvblxuICAgIEBnZXRTbmlwcGV0VGFyZ2V0KGVsZW0sIHsgcG9zaXRpb24gfSlcblxuXG4gIGdldENvbnRhaW5lclRhcmdldDogKG5vZGUpIC0+XG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcbiAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcblxuICAgIHRhcmdldDogJ2NvbnRhaW5lcidcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFZpZXc6IEBmaW5kU25pcHBldFZpZXcobm9kZSlcbiAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG5cblxuICBnZXRSb290VGFyZ2V0OiAobm9kZSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9ICQobm9kZSkuZGF0YSgnc25pcHBldFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFRyZWU6IHNuaXBwZXRUcmVlXG5cblxuICAjIEZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgYSBzbmlwcGV0XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PblNuaXBwZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgaWYgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgJ2JlZm9yZSdcbiAgICBlbHNlXG4gICAgICAnYWZ0ZXInXG5cblxuICAjIEdldCB0aGUgY2xvc2VzdCBzbmlwcGV0IGluIGEgY29udGFpbmVyIGZvciBhIHRvcCBsZWZ0IHBvc2l0aW9uXG4gIGdldENsb3Nlc3RTbmlwcGV0OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRzbmlwcGV0cyA9ICQoY29udGFpbmVyKS5maW5kKFwiLiN7IGNzcy5zbmlwcGV0IH1cIilcbiAgICBjbG9zZXN0ID0gdW5kZWZpbmVkXG4gICAgY2xvc2VzdFNuaXBwZXQgPSB1bmRlZmluZWRcblxuICAgICRzbmlwcGV0cy5lYWNoIChpbmRleCwgZWxlbSkgPT5cbiAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYmVmb3JlJ31cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0U25pcHBldFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYSAtIGIgZWxzZSBiIC0gYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIHNuaXBwZXQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIFNuaXBwZXRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgIyBHZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCB3aXRoIHRvcCBhbmQgbGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnRcbiAgIyAoaWRlYWwgZm9yIGFic29sdXRlIHBvc2l0aW9uZWQgZWxlbWVudHMpXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAobm9kZSkgLT5cbiAgICB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICB7IHNjcm9sbFgsIHNjcm9sbFkgfSA9IEBnZXRTY3JvbGxQb3NpdGlvbih3aW4pXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiAgZ2V0U2Nyb2xsUG9zaXRpb246ICh3aW4pIC0+XG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYOiBpZiAod2luLnBhZ2VYT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVhPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWTogaWYgKHdpbi5wYWdlWU9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VZT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBEcmFnQmFzZVxuI1xuIyBTdXBwb3J0ZWQgZHJhZyBtb2RlczpcbiMgLSBEaXJlY3QgKHN0YXJ0IGltbWVkaWF0ZWx5KVxuIyAtIExvbmdwcmVzcyAoc3RhcnQgYWZ0ZXIgYSBkZWxheSBpZiB0aGUgY3Vyc29yIGRvZXMgbm90IG1vdmUgdG9vIG11Y2gpXG4jIC0gTW92ZSAoc3RhcnQgYWZ0ZXIgdGhlIGN1cnNvciBtb3ZlZCBhIG1pbnVtdW0gZGlzdGFuY2UpXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERyYWdCYXNlXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSwgb3B0aW9ucykgLT5cbiAgICBAbW9kZXMgPSBbJ2RpcmVjdCcsICdsb25ncHJlc3MnLCAnbW92ZSddXG5cbiAgICBkZWZhdWx0Q29uZmlnID1cbiAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuICAgICAgb25EcmFnU3RhcnQ6IHVuZGVmaW5lZFxuICAgICAgc2Nyb2xsQXJlYTogNTBcbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuICAgICAgbW92ZTpcbiAgICAgICAgZGlzdGFuY2U6IDBcblxuICAgIEBkZWZhdWx0Q29uZmlnID0gJC5leHRlbmQodHJ1ZSwgZGVmYXVsdENvbmZpZywgb3B0aW9ucylcblxuICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG5cblxuICBzZXRPcHRpb25zOiAob3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGVmYXVsdENvbmZpZywgb3B0aW9ucylcbiAgICBAbW9kZSA9IGlmIG9wdGlvbnMuZGlyZWN0P1xuICAgICAgJ2RpcmVjdCdcbiAgICBlbHNlIGlmIG9wdGlvbnMubG9uZ3ByZXNzP1xuICAgICAgJ2xvbmdwcmVzcydcbiAgICBlbHNlIGlmIG9wdGlvbnMubW92ZT9cbiAgICAgICdtb3ZlJ1xuICAgIGVsc2VcbiAgICAgICdsb25ncHJlc3MnXG5cblxuICBzZXREcmFnSGFuZGxlcjogKGRyYWdIYW5kbGVyKSAtPlxuICAgIEBkcmFnSGFuZGxlciA9IGRyYWdIYW5kbGVyXG4gICAgQGRyYWdIYW5kbGVyLnBhZ2UgPSBAcGFnZVxuXG5cbiAgIyBTdGFydCBhIHBvc3NpYmxlIGRyYWdcbiAgIyBUaGUgZHJhZyBpcyBvbmx5IHJlYWxseSBzdGFydGVkIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgdmlvbGF0ZWRcbiAgIyAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpLlxuICBpbml0OiAoZHJhZ0hhbmRsZXIsIGV2ZW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBzZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgQHNldERyYWdIYW5kbGVyKGRyYWdIYW5kbGVyKVxuICAgIEBzdGFydFBvaW50ID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG5cbiAgICBAYWRkU3RvcExpc3RlbmVycyhldmVudClcbiAgICBAYWRkTW92ZUxpc3RlbmVycyhldmVudClcblxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBAYWRkTG9uZ3ByZXNzSW5kaWNhdG9yKEBzdGFydFBvaW50KVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICAgICAgQHN0YXJ0KGV2ZW50KVxuICAgICAgICAsIEBvcHRpb25zLmxvbmdwcmVzcy5kZWxheVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ2RpcmVjdCdcbiAgICAgIEBzdGFydChldmVudClcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgbW92ZTogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KGV2ZW50KVxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBhZGRCbG9ja2VyKClcbiAgICBAcGFnZS4kYm9keS5hZGRDbGFzcyhjc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IChldmVudCkgLT5cbiAgICBAZHJhZ0hhbmRsZXIuZHJvcChldmVudCkgaWYgQHN0YXJ0ZWRcbiAgICBpZiAkLmlzRnVuY3Rpb24oQG9wdGlvbnMub25Ecm9wKVxuICAgICAgQG9wdGlvbnMub25Ecm9wKGV2ZW50LCBAZHJhZ0hhbmRsZXIpXG4gICAgQHJlc2V0KClcblxuXG4gIGNhbmNlbDogLT5cbiAgICBAcmVzZXQoKVxuXG5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcbiAgICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICAgIEBwYWdlLiRib2R5LnJlbW92ZUNsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG4gICAgaWYgQGluaXRpYWxpemVkXG4gICAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICAgIEBkcmFnSGFuZGxlci5yZXNldCgpXG4gICAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICAgIGlmIEB0aW1lb3V0P1xuICAgICAgICBjbGVhclRpbWVvdXQoQHRpbWVvdXQpXG4gICAgICAgIEB0aW1lb3V0ID0gdW5kZWZpbmVkXG5cbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICBAcmVtb3ZlQmxvY2tlcigpXG5cblxuICBhZGRCbG9ja2VyOiAtPlxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcmFnQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkYmxvY2tlcilcblxuXG4gIHJlbW92ZUJsb2NrZXI6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKS5yZW1vdmUoKVxuXG5cbiAgYWRkTG9uZ3ByZXNzSW5kaWNhdG9yOiAoeyBwYWdlWCwgcGFnZVkgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvcHRpb25zLmxvbmdwcmVzcy5zaG93SW5kaWNhdG9yXG4gICAgJGluZGljYXRvciA9ICQoXCI8ZGl2IGNsYXNzPVxcXCIjeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cXFwiPjxkaXY+PC9kaXY+PC9kaXY+XCIpXG4gICAgJGluZGljYXRvci5jc3MobGVmdDogcGFnZVgsIHRvcDogcGFnZVkpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRpbmRpY2F0b3IpXG5cblxuICByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3I6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgICAgJ2Ryb3AubGl2aW5nZG9jcy1kcmFnIGRyYWdlbmQubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgKGV2ZW50KSA9PlxuICAgICAgQGRyb3AoZXZlbnQpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIHNuaXBwZXREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ2VudGVyJyB8fCBldmVudC50eXBlID09ICdkcmFnYmV0dGVyZW50ZXInXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ2RyYWdvdmVyLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICAjIFNvIGZhciBJIGRvIG5vdCB1bmRlcnN0YW5kIHdoeSB0aGUgalF1ZXJ5IGV2ZW50IGRvZXMgbm90IGNvbnRhaW4gY2xpZW50WCBldGMuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnb3ZlcidcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuXG4gICAgY2xpZW50WDogZXZlbnQuY2xpZW50WFxuICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFlcbiAgICBwYWdlWDogZXZlbnQucGFnZVhcbiAgICBwYWdlWTogZXZlbnQucGFnZVlcblxuXG4gIGRpc3RhbmNlOiAocG9pbnRBLCBwb2ludEIpIC0+XG4gICAgcmV0dXJuIHVuZGVmaW5lZCBpZiAhcG9pbnRBIHx8ICFwb2ludEJcblxuICAgIGRpc3RYID0gcG9pbnRBLnBhZ2VYIC0gcG9pbnRCLnBhZ2VYXG4gICAgZGlzdFkgPSBwb2ludEEucGFnZVkgLSBwb2ludEIucGFnZVlcbiAgICBNYXRoLnNxcnQoIChkaXN0WCAqIGRpc3RYKSArIChkaXN0WSAqIGRpc3RZKSApXG5cblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgZWRpdGFibGUuanMgQ29udHJvbGxlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW50ZWdyYXRlIGVkaXRhYmxlLmpzIGludG8gTGl2aW5nZG9jc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZUNvbnRyb2xsZXJcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlKSAtPlxuXG4gICAgIyBJbml0aWFsaXplIGVkaXRhYmxlLmpzXG4gICAgQGVkaXRhYmxlID0gbmV3IEVkaXRhYmxlXG4gICAgICB3aW5kb3c6IEBwYWdlLndpbmRvd1xuICAgICAgYnJvd3NlclNwZWxsY2hlY2s6IGNvbmZpZy5lZGl0YWJsZS5icm93c2VyU3BlbGxjaGVja1xuICAgICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogY29uZmlnLmVkaXRhYmxlLm1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXNcblxuICAgIEBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBAc2VsZWN0aW9uID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGVkaXRhYmxlXG4gICAgICAuZm9jdXMoQHdpdGhDb250ZXh0KEBmb2N1cykpXG4gICAgICAuYmx1cihAd2l0aENvbnRleHQoQGJsdXIpKVxuICAgICAgLmluc2VydChAd2l0aENvbnRleHQoQGluc2VydCkpXG4gICAgICAubWVyZ2UoQHdpdGhDb250ZXh0KEBtZXJnZSkpXG4gICAgICAuc3BsaXQoQHdpdGhDb250ZXh0KEBzcGxpdCkpXG4gICAgICAuc2VsZWN0aW9uKEB3aXRoQ29udGV4dChAc2VsZWN0aW9uQ2hhbmdlZCkpXG4gICAgICAubmV3bGluZShAd2l0aENvbnRleHQoQG5ld2xpbmUpKVxuICAgICAgLmNoYW5nZShAd2l0aENvbnRleHQoQGNoYW5nZSkpXG5cblxuICAjIFJlZ2lzdGVyIERPTSBub2RlcyB3aXRoIGVkaXRhYmxlLmpzLlxuICAjIEFmdGVyIHRoYXQgRWRpdGFibGUgd2lsbCBmaXJlIGV2ZW50cyBmb3IgdGhhdCBub2RlLlxuICBhZGQ6IChub2RlcykgLT5cbiAgICBAZWRpdGFibGUuYWRkKG5vZGVzKVxuXG5cbiAgZGlzYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuc3VzcGVuZCgpXG5cblxuICByZWVuYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuY29udGludWUoKVxuXG5cbiAgIyBHZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lIGZyb20gdGhlIERPTSBlbGVtZW50IHBhc3NlZCBieSBlZGl0YWJsZS5qc1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIGV4dHJhY3RDb250ZW50OiAoZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KGVsZW1lbnQpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdW5kZWZpbmVkXG4gICAgZWxzZVxuICAgICAgdmFsdWVcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGV4dHJhY3RDb250ZW50KGVsZW1lbnQpXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudClcblxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcblxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgSW5zZXJ0IGEgbmV3IGJsb2NrLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGF0IHRoZSBlbmQgb2YgYSBibG9ja1xuICAjIG9yIGJ5IHByZXNzaW5nIGRlbGV0ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgYmxvY2suXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG5cbiAgICAgIHNuaXBwZXROYW1lID0gQHBhZ2UuZGVzaWduLnBhcmFncmFwaFNuaXBwZXRcbiAgICAgIHRlbXBsYXRlID0gQHBhZ2UuZGVzaWduLmdldChzbmlwcGV0TmFtZSlcbiAgICAgIGNvcHkgPSB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3VmlldyAmJiBkaXJlY3Rpb24gPT0gJ2FmdGVyJ1xuXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgTWVyZ2UgdHdvIGJsb2Nrcy4gV29ya3MgaW4gdHdvIGRpcmVjdGlvbnMuXG4gICMgRWl0aGVyIHRoZSBjdXJyZW50IGJsb2NrIGlzIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBwcmVjZWVkaW5nICgnYmVmb3JlJylcbiAgIyBvciB0aGUgZm9sbG93aW5nICgnYWZ0ZXInKSBibG9jay5cbiAgIyBBZnRlciB0aGUgbWVyZ2UgdGhlIGN1cnJlbnQgYmxvY2sgaXMgcmVtb3ZlZCBhbmQgdGhlIGZvY3VzIHNldCB0byB0aGVcbiAgIyBvdGhlciBibG9jayB0aGF0IHdhcyBtZXJnZWQgaW50by5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcbiAgICAgICAgdmlld0VsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBtZXJnZWRWaWV3RWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG5cbiAgICAgICAgIyBHYXRoZXIgdGhlIGNvbnRlbnQgdGhhdCBpcyBnb2luZyB0byBiZSBtZXJnZWRcbiAgICAgICAgY29udGVudFRvTWVyZ2UgPSBAZWRpdGFibGUuZ2V0Q29udGVudCh2aWV3RWxlbSlcblxuICAgICAgICBjdXJzb3IgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBAZWRpdGFibGUuYXBwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRhYmxlLnByZXBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZVNlbGVjdGlvbigpXG5cbiAgICAgICAgIyBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgYW5kIHRoZSBmb2N1cyBpcyBzZXQgdXBkYXRlIHRoZSBtb2RlbCB0b1xuICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgbW9kZWwgaXMgdXAgdG8gZGF0ZSBhbmQgY2hhbmdlcyBhcmUgbm90aWZpZWQuXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUsIG1lcmdlZFZpZXdFbGVtKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFNwbGl0IGEgYmxvY2sgaW4gdHdvLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGluIHRoZSBtaWRkbGUgb2YgYSBibG9jay5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2Ygc25pcHBldFxuICAgICAgY29weSA9IHZpZXcudGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYWZ0ZXIpKVxuICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgdmlldy5uZXh0KCk/LmZvY3VzKClcblxuICAgICAgIyBzZXQgY29udGVudCBvZiB0aGUgYmVmb3JlIGVsZW1lbnQgKGFmdGVyIGZvY3VzIGlzIHNldCB0byB0aGUgYWZ0ZXIgZWxlbWVudClcbiAgICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgQGV4dHJhY3RDb250ZW50KGJlZm9yZSkpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgT2NjdXJzIHdoZW5ldmVyIHRoZSB1c2VyIHNlbGVjdHMgb25lIG9yIG1vcmUgY2hhcmFjdGVycyBvciB3aGVuZXZlciB0aGVcbiAgIyBzZWxlY3Rpb24gaXMgY2hhbmdlZC5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICAjIEluc2VydCBhIG5ld2xpbmUgKFNoaWZ0ICsgRW50ZXIpXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGlmIGNvbmZpZy5lZGl0YWJsZS5hbGxvd05ld2xpbmVcbiAgICAgIHJldHVybiB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgZWxzZVxuICAgICByZXR1cm4gZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFRyaWdnZXJlZCB3aGVuZXZlciB0aGUgdXNlciBjaGFuZ2VzIHRoZSBjb250ZW50IG9mIGEgYmxvY2suXG4gICMgVGhlIGNoYW5nZSBldmVudCBkb2VzIG5vdCBhdXRvbWF0aWNhbGx5IGZpcmUgaWYgdGhlIGNvbnRlbnQgaGFzXG4gICMgYmVlbiBjaGFuZ2VkIHZpYSBqYXZhc2NyaXB0LlxuICBjaGFuZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG4gICAgcmV0dXJuIGlmIGNvbmZpZy5lZGl0YWJsZS5jaGFuZ2VEZWxheSA9PSBmYWxzZVxuXG4gICAgQGNoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICBlbGVtID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW0pXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuICAgICwgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5XG5cblxuICBjbGVhckNoYW5nZVRpbWVvdXQ6IC0+XG4gICAgaWYgQGNoYW5nZVRpbWVvdXQ/XG4gICAgICBjbGVhclRpbWVvdXQoQGNoYW5nZVRpbWVvdXQpXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuXG5cbiAgaGFzU2luZ2xlRWRpdGFibGU6ICh2aWV3KSAtPlxuICAgIHZpZXcuZGlyZWN0aXZlcy5sZW5ndGggPT0gMSAmJiB2aWV3LmRpcmVjdGl2ZXNbMF0udHlwZSA9PSAnZWRpdGFibGUnXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBEb2N1bWVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBNYW5hZ2UgdGhlIHNuaXBwZXQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcblxuICAgIEBzbmlwcGV0Rm9jdXMgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIGVkaXRhYmxlTm9kZSAhPSBAZWRpdGFibGVOb2RlXG4gICAgICBAcmVzZXRFZGl0YWJsZSgpXG4gICAgICBAZWRpdGFibGVOb2RlID0gZWRpdGFibGVOb2RlXG5cbiAgICBpZiBzbmlwcGV0VmlldyAhPSBAc25pcHBldFZpZXdcbiAgICAgIEByZXNldFNuaXBwZXRWaWV3KClcbiAgICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0VmlldyA9IHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0Rm9jdXMuZmlyZShAc25pcHBldFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlICE9IGVkaXRhYmxlTm9kZVxuICAgICAgc25pcHBldFZpZXcgfHw9IGRvbS5maW5kU25pcHBldFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVCbHVycmVkOiAoZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgPT0gZWRpdGFibGVOb2RlXG4gICAgICBAc2V0Rm9jdXMoQHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICAjIGNhbGwgYWZ0ZXIgY2xpY2tcbiAgc25pcHBldEZvY3VzZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAc25pcHBldFZpZXcgIT0gc25pcHBldFZpZXdcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgYmx1cjogLT5cbiAgICBAc2V0Rm9jdXModW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRFZGl0YWJsZTogLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlXG4gICAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldFNuaXBwZXRWaWV3OiAtPlxuICAgIGlmIEBzbmlwcGV0Vmlld1xuICAgICAgcHJldmlvdXMgPSBAc25pcHBldFZpZXdcbiAgICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuICAgICAgQHNuaXBwZXRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuaXNTdXBwb3J0ZWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldERyYWdcblxuICB3aWdnbGVTcGFjZSA9IDBcbiAgc3RhcnRBbmRFbmRPZmZzZXQgPSAwXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3IH0pIC0+XG4gICAgQCR2aWV3ID0gc25pcHBldFZpZXcuJGh0bWwgaWYgc25pcHBldFZpZXdcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIHN0YXJ0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuZGlzYWJsZUFsbCgpXG4gICAgQHBhZ2UuYmx1ckZvY3VzZWRFbGVtZW50KClcblxuICAgICMgcGxhY2Vob2xkZXIgYmVsb3cgY3Vyc29yXG4gICAgQCRwbGFjZWhvbGRlciA9IEBjcmVhdGVQbGFjZWhvbGRlcigpLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgQCRkcmFnQmxvY2tlciA9IEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIilcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBzbmlwcGV0XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5zbmlwcGV0Vmlldz8ubW9kZWwgIT0gQHNuaXBwZXRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgICMgICAkY29udGFpbmVyID0gdGFyZ2V0LnNuaXBwZXRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcbiAgICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG5cblxuICBzbmlwcGV0UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuc25pcHBldFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYWZ0ZXInXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKGJlZm9yZSwgdGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5zbmlwcGV0Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdiZWZvcmUnXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKHRhcmdldC5zbmlwcGV0VmlldywgbmV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5TbmlwcGV0czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBwYWRkaW5nVG9wID0gcGFyc2VJbnQoJChlbGVtKS5jc3MoJ3BhZGRpbmctdG9wJykpIHx8IDBcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0ICsgcGFkZGluZ1RvcFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdCb3R0b20gPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy1ib3R0b20nKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3guYm90dG9tIC0gc3RhcnRBbmRFbmRPZmZzZXQgLSBwYWRkaW5nQm90dG9tXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG5cbiAgICAgIGlmIGNsaWVudFg/ICYmIGNsaWVudFk/XG4gICAgICAgIGVsZW0gPSBAcGFnZS5kb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG5cbiAgICAgIGlmIGVsZW0/Lm5vZGVOYW1lID09ICdJRlJBTUUnXG4gICAgICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGZpbmRFbGVtSW5JZnJhbWUoZWxlbSwgZXZlbnRQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgQGlmcmFtZUJveCA9IHVuZGVmaW5lZFxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gIGZpbmRFbGVtSW5JZnJhbWU6IChpZnJhbWVFbGVtLCBldmVudFBvc2l0aW9uKSAtPlxuICAgIEBpZnJhbWVCb3ggPSBib3ggPSBpZnJhbWVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgQGlmcmFtZUJveC53aW5kb3cgPSBpZnJhbWVFbGVtLmNvbnRlbnRXaW5kb3dcbiAgICBkb2N1bWVudCA9IGlmcmFtZUVsZW0uY29udGVudERvY3VtZW50XG4gICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG5cbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFggLT0gYm94LmxlZnRcbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFkgLT0gYm94LnRvcFxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVggPSBldmVudFBvc2l0aW9uLmNsaWVudFggKyAkYm9keS5zY3JvbGxMZWZ0KClcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VZID0gZXZlbnRQb3NpdGlvbi5jbGllbnRZICsgJGJvZHkuc2Nyb2xsVG9wKClcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudFBvc2l0aW9uLmNsaWVudFgsIGV2ZW50UG9zaXRpb24uY2xpZW50WSlcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICAjIFJlbW92ZSBlbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yIHdoaWNoIGNvdWxkIGludGVyZmVyZVxuICAjIHdpdGggZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCgpXG4gIHVuYmxvY2tFbGVtZW50RnJvbVBvaW50OiAoY2FsbGJhY2spIC0+XG5cbiAgICAjIFBvaW50ZXIgRXZlbnRzIGFyZSBhIGxvdCBmYXN0ZXIgc2luY2UgdGhlIGJyb3dzZXIgZG9lcyBub3QgbmVlZFxuICAgICMgdG8gcmVwYWludCB0aGUgd2hvbGUgc2NyZWVuLiBJRSA5IGFuZCAxMCBkbyBub3Qgc3VwcG9ydCB0aGVtLlxuICAgIGlmIGlzU3VwcG9ydGVkKCdodG1sUG9pbnRlckV2ZW50cycpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnYXV0bycpXG4gICAgZWxzZVxuICAgICAgQCRkcmFnQmxvY2tlci5oaWRlKClcbiAgICAgIEAkcGxhY2Vob2xkZXIuaGlkZSgpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLnNob3coKVxuICAgICAgQCRwbGFjZWhvbGRlci5zaG93KClcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLnNuaXBwZXRXYXNEcm9wcGVkLmZpcmUoQHNuaXBwZXRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIHNuaXBwZXQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBzbmlwcGV0VmlldyA9IHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5iZWZvcmUoQHNuaXBwZXRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmFmdGVyKEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHRhcmdldC5zbmlwcGV0Vmlldy5tb2RlbFxuICAgICAgICBzbmlwcGV0TW9kZWwuYXBwZW5kKHRhcmdldC5jb250YWluZXJOYW1lLCBAc25pcHBldE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgc25pcHBldFRyZWUgPSB0YXJnZXQuc25pcHBldFRyZWVcbiAgICAgICAgc25pcHBldFRyZWUucHJlcGVuZChAc25pcHBldE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBzbmlwcGV0cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0VHJlZSwgQHJlbmRlcmluZ0NvbnRhaW5lciwgJHdyYXBwZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQHNuaXBwZXRWaWV3cyA9IHt9XG5cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAcmVuZGVyT25jZVBhZ2VSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIHNuaXBwZXRUcmVlIGluIHRoZSAkcm9vdCBub2RlLlxuICAgICMgU29tZSBkb20uY29mZmVlIG1ldGhvZHMgbmVlZCBpdCB0byBnZXQgaG9sZCBvZiB0aGUgc25pcHBldCB0cmVlXG4gICAgQCRyb290LmRhdGEoJ3NuaXBwZXRUcmVlJywgQHNuaXBwZXRUcmVlKVxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBTbmlwcGV0IFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0QWRkZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0QWRkZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldFJlbW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0TW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0TW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgc25pcHBldEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgc25pcHBldEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgc25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0U25pcHBldDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwpXG5cbiAgICBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignU25pcHBldCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIHNuaXBwZXRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcbiAgICBzbmlwcGV0Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5zbmlwcGV0Vmlld1dhc0luc2VydGVkKHNuaXBwZXRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZFNuaXBwZXRzKG1vZGVsKVxuXG5cbiAgaXNTbmlwcGV0QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkU25pcHBldHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNTbmlwcGV0QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydFNuaXBwZXQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydFNuaXBwZXRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yU25pcHBldChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvclNuaXBwZXQobW9kZWwpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQoY29udGFpbmVyLnBhcmVudFNuaXBwZXQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRWaWV3XG5cbiAgY29uc3RydWN0b3I6ICh7IEBtb2RlbCwgQCRodG1sLCBAZGlyZWN0aXZlcywgQGlzUmVhZE9ubHkgfSkgLT5cbiAgICBAJGVsZW0gPSBAJGh0bWxcbiAgICBAdGVtcGxhdGUgPSBAbW9kZWwudGVtcGxhdGVcbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gZmFsc2VcbiAgICBAd2FzQXR0YWNoZWRUb0RvbSA9ICQuQ2FsbGJhY2tzKCk7XG5cbiAgICB1bmxlc3MgQGlzUmVhZE9ubHlcbiAgICAgICMgYWRkIGF0dHJpYnV0ZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIGh0bWxcbiAgICAgIEAkaHRtbFxuICAgICAgICAuZGF0YSgnc25pcHBldCcsIHRoaXMpXG4gICAgICAgIC5hZGRDbGFzcyhjc3Muc25pcHBldClcbiAgICAgICAgLmF0dHIoYXR0ci50ZW1wbGF0ZSwgQHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICBAcmVuZGVyKClcblxuXG4gIHJlbmRlcjogKG1vZGUpIC0+XG4gICAgQHVwZGF0ZUNvbnRlbnQoKVxuICAgIEB1cGRhdGVIdG1sKClcblxuXG4gIHVwZGF0ZUNvbnRlbnQ6IC0+XG4gICAgQGNvbnRlbnQoQG1vZGVsLmNvbnRlbnQpXG5cbiAgICBpZiBub3QgQGhhc0ZvY3VzKClcbiAgICAgIEBkaXNwbGF5T3B0aW9uYWxzKClcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIHVwZGF0ZUh0bWw6IC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIEBtb2RlbC5zdHlsZXNcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIGRpc3BsYXlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgICRlbGVtID0gJChkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgaWYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJycpXG5cblxuICAjIFNob3cgYWxsIGRvYy1vcHRpb25hbHMgd2hldGhlciB0aGV5IGFyZSBlbXB0eSBvciBub3QuXG4gICMgVXNlIG9uIGZvY3VzLlxuICBzaG93T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuc2hvdygkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gICMgSGlkZSBhbGwgZW1wdHkgZG9jLW9wdGlvbmFsc1xuICAjIFVzZSBvbiBibHVyLlxuICBoaWRlRW1wdHlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsICYmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuaGlkZSgkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gIG5leHQ6IC0+XG4gICAgQCRodG1sLm5leHQoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIHByZXY6IC0+XG4gICAgQCRodG1sLnByZXYoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIGFmdGVyRm9jdXNlZDogKCkgLT5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAaGlkZUVtcHR5T3B0aW9uYWxzKClcblxuXG4gICMgQHBhcmFtIGN1cnNvcjogdW5kZWZpbmVkLCAnc3RhcnQnLCAnZW5kJ1xuICBmb2N1czogKGN1cnNvcikgLT5cbiAgICBmaXJzdCA9IEBkaXJlY3RpdmVzLmVkaXRhYmxlP1swXS5lbGVtXG4gICAgJChmaXJzdCkuZm9jdXMoKVxuXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgQCRodG1sLmhhc0NsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEAkaHRtbFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEAkaHRtbFswXSlcblxuXG4gIGNvbnRlbnQ6IChjb250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBkaXJlY3RpdmUgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICAgIGlmIGRpcmVjdGl2ZS5iYXNlNjRJbWFnZT9cbiAgICAgICAgICBAc2V0KG5hbWUsIGRpcmVjdGl2ZS5iYXNlNjRJbWFnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBzZXQobmFtZSwgZGlyZWN0aXZlLmdldEltYWdlVXJsKCkgKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0KG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAc2V0RWRpdGFibGUobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAc2V0SW1hZ2UobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBzZXRIdG1sKG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBnZXRFZGl0YWJsZShuYW1lKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQGdldEltYWdlKG5hbWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBnZXRIdG1sKG5hbWUpXG5cblxuICBnZXRFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0RWRpdGFibGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICByZXR1cm4gaWYgQGhhc0ZvY3VzKClcblxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS50b2dnbGVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlciwgQm9vbGVhbih2YWx1ZSkpXG4gICAgJGVsZW0uYXR0cihhdHRyLnBsYWNlaG9sZGVyLCBAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG5cbiAgICAkZWxlbS5odG1sKHZhbHVlIHx8ICcnKVxuXG5cbiAgZm9jdXNFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmFkZENsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuXG5cbiAgYmx1ckVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgaWYgQG1vZGVsLmlzRW1wdHkobmFtZSlcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuXG5cbiAgZ2V0SHRtbDogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0SHRtbDogKG5hbWUsIHZhbHVlKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKHZhbHVlIHx8ICcnKVxuXG4gICAgaWYgbm90IHZhbHVlXG4gICAgICAkZWxlbS5odG1sKEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcbiAgICBlbHNlIGlmIHZhbHVlIGFuZCBub3QgQGlzUmVhZE9ubHlcbiAgICAgIEBibG9ja0ludGVyYWN0aW9uKCRlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0IHx8PSB7fVxuICAgIEBkaXJlY3RpdmVzVG9SZXNldFtuYW1lXSA9IG5hbWVcblxuXG4gIGdldERpcmVjdGl2ZUVsZW1lbnQ6IChkaXJlY3RpdmVOYW1lKSAtPlxuICAgIEBkaXJlY3RpdmVzLmdldChkaXJlY3RpdmVOYW1lKT8uZWxlbVxuXG5cbiAgIyBSZXNldCBkaXJlY3RpdmVzIHRoYXQgY29udGFpbiBhcmJpdHJhcnkgaHRtbCBhZnRlciB0aGUgdmlldyBpcyBtb3ZlZCBpblxuICAjIHRoZSBET00gdG8gcmVjcmVhdGUgaWZyYW1lcy4gSW4gdGhlIGNhc2Ugb2YgdHdpdHRlciB3aGVyZSB0aGUgaWZyYW1lc1xuICAjIGRvbid0IGhhdmUgYSBzcmMgdGhlIHJlbG9hZGluZyB0aGF0IGhhcHBlbnMgd2hlbiBvbmUgbW92ZXMgYW4gaWZyYW1lIGNsZWFyc1xuICAjIGFsbCBjb250ZW50IChNYXliZSB3ZSBjb3VsZCBsaW1pdCByZXNldHRpbmcgdG8gaWZyYW1lcyB3aXRob3V0IGEgc3JjKS5cbiAgI1xuICAjIFNvbWUgbW9yZSBpbmZvIGFib3V0IHRoZSBpc3N1ZSBvbiBzdGFja292ZXJmbG93OlxuICAjIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODMxODI2NC9ob3ctdG8tbW92ZS1hbi1pZnJhbWUtaW4tdGhlLWRvbS13aXRob3V0LWxvc2luZy1pdHMtc3RhdGVcbiAgcmVzZXREaXJlY3RpdmVzOiAtPlxuICAgIGZvciBuYW1lIG9mIEBkaXJlY3RpdmVzVG9SZXNldFxuICAgICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICAgaWYgJGVsZW0uZmluZCgnaWZyYW1lJykubGVuZ3RoXG4gICAgICAgIEBzZXQobmFtZSwgQG1vZGVsLmNvbnRlbnRbbmFtZV0pXG5cblxuICBnZXRJbWFnZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmF0dHIoJ3NyYycpXG5cblxuICBzZXRJbWFnZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcblxuICAgIGlmIHZhbHVlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltYWdlU2VydmljZS5zZXQoJGVsZW0sIHZhbHVlKVxuXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0UGxhY2Vob2xkZXIgPSAkLnByb3h5KEBzZXRQbGFjZWhvbGRlckltYWdlLCB0aGlzLCAkZWxlbSwgbmFtZSlcbiAgICAgIEBkZWxheVVudGlsQXR0YWNoZWQobmFtZSwgc2V0UGxhY2Vob2xkZXIpICMgdG9kbzogcmVwbGFjZSB3aXRoIEBhZnRlckluc2VydGVkIC0+IC4uLiAoc29tZXRoaW5nIGxpa2UgJC5DYWxsYmFja3MoJ29uY2UgcmVtZW1iZXInKSlcblxuXG4gIHNldFBsYWNlaG9sZGVySW1hZ2U6ICgkZWxlbSwgbmFtZSkgLT5cbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgaWYgJGVsZW1bMF0ubm9kZU5hbWUgPT0gJ0lNRydcbiAgICAgIHdpZHRoID0gJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aCA9ICRlbGVtLm91dGVyV2lkdGgoKVxuICAgICAgaGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIHZhbHVlID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7d2lkdGh9eCN7aGVpZ2h0fS9CRUY1NkYvQjJFNjY4XCJcblxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgIGltYWdlU2VydmljZS5zZXQoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gICMgV2FpdCB0byBleGVjdXRlIGEgbWV0aG9kIHVudGlsIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBET01cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0VHJlZSwgQHBhcmVudCkgLT5cbiAgICBAcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgQGlzSW50ZXJhY3RpdmUgPSBmYWxzZVxuXG5cbiAgIyBBdmFpbGFibGUgT3B0aW9uczpcbiAgIyBSZWFkT25seSB2aWV3OiAoZGVmYXVsdCBpZiBub3RoaW5nIGlzIHNwZWNpZmllZClcbiAgIyBjcmVhdGUocmVhZE9ubHk6IHRydWUpXG4gICNcbiAgIyBJbmVyYWN0aXZlIHZpZXc6XG4gICMgY3JlYXRlKGludGVyYWN0aXZlOiB0cnVlKVxuICAjXG4gICMgV3JhcHBlcjogKERPTSBub2RlIHRoYXQgaGFzIHRvIGNvbnRhaW4gYSBub2RlIHdpdGggY2xhc3MgJy5kb2Mtc2VjdGlvbicpXG4gICMgY3JlYXRlKCAkd3JhcHBlcjogJCgnPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj4nKSApXG4gIGNyZWF0ZTogKG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZUlGcmFtZShAcGFyZW50KS50aGVuIChpZnJhbWUsIHJlbmRlck5vZGUpID0+XG4gICAgICBAaWZyYW1lID0gaWZyYW1lXG4gICAgICByZW5kZXJlciA9IEBjcmVhdGVJRnJhbWVSZW5kZXJlcihpZnJhbWUsIG9wdGlvbnMpXG5cbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICBob3N0V2luZG93OiBpZnJhbWUuY29udGVudFdpbmRvd1xuICAgICAgZGVzaWduOiBAc25pcHBldFRyZWUuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcbiAgICByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgJHdyYXBwZXI6IG9wdGlvbnMuJHdyYXBwZXJcblxuXG4gIGNyZWF0ZVBhZ2U6IChwYXJhbXMsIHsgaW50ZXJhY3RpdmUsIHJlYWRPbmx5IH09e30pIC0+XG4gICAgaWYgaW50ZXJhY3RpdmU/XG4gICAgICBAaXNJbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIG5ldyBJbnRlcmFjdGl2ZVBhZ2UocGFyYW1zKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQYWdlKHBhcmFtcylcblxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuICAgICAgbGluay5ocmVmID0gdXJsXG4gICAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgIEBtYXJrVXJsQXNMb2FkZWQodXJsKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBAcHJpdmF0ZVxuICBtYXJrVXJsQXNMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMucHVzaCh1cmwpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuRm9jdXMgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9mb2N1cycpXG5FZGl0YWJsZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyJylcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcblNuaXBwZXREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnJylcblxuIyBBbiBJbnRlcmFjdGl2ZVBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFsbG93cyBmb3IgbWFuaXB1bGF0aW9uIG9mIHRoZVxuIyByZW5kZXJlZCBTbmlwcGV0VHJlZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW50ZXJhY3RpdmVQYWdlIGV4dGVuZHMgUGFnZVxuXG4gIExFRlRfTU9VU0VfQlVUVE9OID0gMVxuXG4gIGlzUmVhZE9ubHk6IGZhbHNlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgaG9zdFdpbmRvdyB9PXt9KSAtPlxuICAgIHN1cGVyXG5cbiAgICBAZm9jdXMgPSBuZXcgRm9jdXMoKVxuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPSBuZXcgRWRpdGFibGVDb250cm9sbGVyKHRoaXMpXG5cbiAgICAjIGV2ZW50c1xuICAgIEBpbWFnZUNsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAaHRtbEVsZW1lbnRDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQHNuaXBwZXRXaWxsQmVEcmFnZ2VkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgQHNuaXBwZXRXYXNEcm9wcGVkID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG4gICAgQGZvY3VzLnNuaXBwZXRGb2N1cy5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEZvY3VzZWQsIHRoaXMpIClcbiAgICBAZm9jdXMuc25pcHBldEJsdXIuYWRkKCAkLnByb3h5KEBhZnRlclNuaXBwZXRCbHVycmVkLCB0aGlzKSApXG4gICAgQGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5KClcbiAgICBAJGRvY3VtZW50XG4gICAgICAub24oJ21vdXNlZG93bi5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbigndG91Y2hzdGFydC5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgJC5wcm94eShAYnJvd3NlckRyYWdTdGFydCwgdGhpcykpXG5cblxuICBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeTogLT5cbiAgICBpZiBjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGU/XG4gICAgICBAY3NzTG9hZGVyLmxvYWQoY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG5cbiAgICAjIElnbm9yZSBpbnRlcmFjdGlvbnMgb24gY2VydGFpbiBlbGVtZW50c1xuICAgIGlzQ29udHJvbCA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KGNvbmZpZy5pZ25vcmVJbnRlcmFjdGlvbikubGVuZ3RoXG4gICAgcmV0dXJuIGlmIGlzQ29udHJvbFxuXG4gICAgIyBJZGVudGlmeSB0aGUgY2xpY2tlZCBzbmlwcGV0XG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcblxuICAgICMgVGhpcyBpcyBjYWxsZWQgaW4gbW91c2Vkb3duIHNpbmNlIGVkaXRhYmxlcyBnZXQgZm9jdXMgb24gbW91c2Vkb3duXG4gICAgIyBhbmQgb25seSBiZWZvcmUgdGhlIGVkaXRhYmxlcyBjbGVhciB0aGVpciBwbGFjZWhvbGRlciBjYW4gd2Ugc2FmZWx5XG4gICAgIyBpZGVudGlmeSB3aGVyZSB0aGUgdXNlciBoYXMgY2xpY2tlZC5cbiAgICBAaGFuZGxlQ2xpY2tlZFNuaXBwZXQoZXZlbnQsIHNuaXBwZXRWaWV3KVxuXG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBzdGFydERyYWdcbiAgICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICAgIGV2ZW50OiBldmVudFxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNhbmNlbERyYWc6IC0+XG4gICAgQGRyYWdCYXNlLmNhbmNlbCgpXG5cblxuICBoYW5kbGVDbGlja2VkU25pcHBldDogKGV2ZW50LCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgQGZvY3VzLnNuaXBwZXRGb2N1c2VkKHNuaXBwZXRWaWV3KVxuXG4gICAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoc25pcHBldFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQGZvY3VzLmJsdXIoKVxuXG5cbiAgZ2V0Rm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhzbmlwcGV0VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlclNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyU25pcHBldEJsdXJyZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBzbmlwcGV0Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwiUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzX2xvYWRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIHNldFJlbmRlck5vZGU6IChyZW5kZXJOb2RlKSAtPlxuICAgIHJlbmRlck5vZGUgPz0gJChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiLCBAJGJvZHkpXG4gICAgaWYgcmVuZGVyTm9kZS5qcXVlcnlcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVswXVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgaWYgQGRlc2lnbj8gJiYgY29uZmlnLmxvYWRSZXNvdXJjZXNcbiAgICAgIGRlc2lnblBhdGggPSBcIiN7IGNvbmZpZy5kZXNpZ25QYXRoIH0vI3sgQGRlc2lnbi5uYW1lc3BhY2UgfVwiXG4gICAgICBjc3NMb2NhdGlvbiA9IGlmIEBkZXNpZ24uY3NzP1xuICAgICAgICBAZGVzaWduLmNzc1xuICAgICAgZWxzZVxuICAgICAgICAnL2Nzcy9zdHlsZS5jc3MnXG5cbiAgICAgIHBhdGggPSBcIiN7IGRlc2lnblBhdGggfSN7IGNzc0xvY2F0aW9uIH1cIlxuICAgICAgQGNzc0xvYWRlci5sb2FkKHBhdGgsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICBzZXRXaW5kb3c6IChob3N0V2luZG93KSAtPlxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93IHx8IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxuIyBBIFJlbmRlcmluZ0NvbnRhaW5lciBpcyB1c2VkIGJ5IHRoZSBSZW5kZXJlciB0byBnZW5lcmF0ZSBIVE1MLlxuI1xuIyBUaGUgUmVuZGVyZXIgaW5zZXJ0cyBTbmlwcGV0Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPSAkKCc8ZGl2Lz4nKVswXVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEBiZWZvcmVSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGh0bWw6IC0+XG4gICAgJChAcmVuZGVyTm9kZSkuaHRtbCgpXG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNFZGl0YWJsZTogdHJ1ZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSHRtbERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldCwgQHRlbXBsYXRlRGlyZWN0aXZlIH0pIC0+XG4gICAgQG5hbWUgPSBAdGVtcGxhdGVEaXJlY3RpdmUubmFtZVxuICAgIEB0eXBlID0gQHRlbXBsYXRlRGlyZWN0aXZlLnR5cGVcblxuXG4gIGlzSHRtbDogdHJ1ZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4uL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNJbWFnZTogdHJ1ZVxuXG5cbiAgc2V0Q29udGVudDogKHZhbHVlKSAtPlxuICAgIEBzZXRJbWFnZVVybCh2YWx1ZSlcblxuXG4gIGdldENvbnRlbnQ6IC0+XG4gICAgQGdldEltYWdlVXJsKClcblxuXG4gICMgSW1hZ2UgRGlyZWN0aXZlIE1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGlzQmFja2dyb3VuZEltYWdlOiAoZGlyZWN0aXZlKSAtPlxuICAgIEB0ZW1wbGF0ZURpcmVjdGl2ZS5nZXRUYWdOYW1lKCkgIT0gJ2ltZydcblxuXG4gIGlzSW5saW5lSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSA9PSAnaW1nJ1xuXG5cbiAgc2V0QmFzZTY0SW1hZ2U6IChiYXNlNjRTdHJpbmcpIC0+XG4gICAgQGJhc2U2NEltYWdlID0gYmFzZTY0U3RyaW5nXG4gICAgQHNuaXBwZXQuc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKEBzbmlwcGV0LCBAbmFtZSkgaWYgQHNuaXBwZXQuc25pcHBldFRyZWVcblxuXG4gIHNldEltYWdlVXJsOiAodmFsdWUpIC0+XG4gICAgQHNuaXBwZXQuY29udGVudFtAbmFtZV0gPz0ge31cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXS51cmwgPSB2YWx1ZVxuXG4gICAgQHJlc2V0Q3JvcCgpXG4gICAgQGJhc2U2NEltYWdlID0gdW5kZWZpbmVkXG4gICAgQHByb2Nlc3NJbWFnZVVybCh2YWx1ZSlcblxuXG4gIGdldEltYWdlVXJsOiAtPlxuICAgIGltYWdlID0gQHNuaXBwZXQuY29udGVudFtAbmFtZV1cbiAgICBpZiBpbWFnZVxuICAgICAgaW1hZ2UudXJsXG4gICAgZWxzZVxuICAgICAgdW5kZWZpbmVkXG5cblxuICBnZXRJbWFnZU9iamVjdDogLT5cbiAgICBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuXG5cbiAgZ2V0T3JpZ2luYWxVcmw6IC0+XG4gICAgQHNuaXBwZXQuY29udGVudFtAbmFtZV0ub3JpZ2luYWxVcmwgfHwgQGdldEltYWdlVXJsKClcblxuXG4gIHNldENyb3A6ICh7IHgsIHksIHdpZHRoLCBoZWlnaHQsIG5hbWUgfSkgLT5cbiAgICBjdXJyZW50VmFsdWUgPSBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuXG4gICAgaWYgY3VycmVudFZhbHVlPy51cmw/XG4gICAgICBjdXJyZW50VmFsdWUuY3JvcCA9XG4gICAgICAgIHg6IHhcbiAgICAgICAgeTogeVxuICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgbmFtZTogbmFtZVxuXG4gICAgICBAcHJvY2Vzc0ltYWdlVXJsKGN1cnJlbnRWYWx1ZS5vcmlnaW5hbFVybCB8fCBjdXJyZW50VmFsdWUudXJsKVxuICAgICAgQHNuaXBwZXQuc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKEBzbmlwcGV0LCBAbmFtZSkgaWYgQHNuaXBwZXQuc25pcHBldFRyZWVcblxuXG4gIHJlc2V0Q3JvcDogLT5cbiAgICBjdXJyZW50VmFsdWUgPSBAc25pcHBldC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGN1cnJlbnRWYWx1ZT9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID0gbnVsbFxuXG5cbiAgc2V0SW1hZ2VTZXJ2aWNlOiAoaW1hZ2VTZXJ2aWNlTmFtZSkgLT5cbiAgICBhc3NlcnQgaW1hZ2VTZXJ2aWNlLmhhcyhpbWFnZVNlcnZpY2VOYW1lKSwgXCJFcnJvcjogY291bGQgbm90IGxvYWQgaW1hZ2Ugc2VydmljZSAjeyBpbWFnZVNlcnZpY2VOYW1lIH1cIlxuXG4gICAgaW1hZ2VVcmwgPSBAZ2V0SW1hZ2VVcmwoKVxuICAgIEBzbmlwcGV0LmNvbnRlbnRbQG5hbWVdID1cbiAgICAgIHVybDogaW1hZ2VVcmxcbiAgICAgIGltYWdlU2VydmljZTogaW1hZ2VTZXJ2aWNlTmFtZSB8fCBudWxsXG5cblxuICBnZXRJbWFnZVNlcnZpY2VOYW1lOiAtPlxuICAgIEBnZXRJbWFnZVNlcnZpY2UoKS5uYW1lXG5cblxuICBoYXNEZWZhdWx0SW1hZ2VTZXJ2aWNlOiAtPlxuICAgIEBnZXRJbWFnZVNlcnZpY2VOYW1lKCkgPT0gJ2RlZmF1bHQnXG5cblxuICBnZXRJbWFnZVNlcnZpY2U6IC0+XG4gICAgc2VydmljZU5hbWUgPSBAc25pcHBldC5jb250ZW50W0BuYW1lXT8uaW1hZ2VTZXJ2aWNlXG4gICAgaW1hZ2VTZXJ2aWNlLmdldChzZXJ2aWNlTmFtZSB8fCB1bmRlZmluZWQpXG5cblxuICBwcm9jZXNzSW1hZ2VVcmw6ICh1cmwpIC0+XG4gICAgaWYgbm90IEBoYXNEZWZhdWx0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltZ1NlcnZpY2UgPSBAZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltZ09iaiA9IEBnZXRJbWFnZU9iamVjdCgpXG4gICAgICBpbWdPYmoudXJsID0gaW1nU2VydmljZS5nZXRVcmwodXJsLCBjcm9wOiBpbWdPYmouY3JvcClcbiAgICAgIGltZ09iai5vcmlnaW5hbFVybCA9IHVybFxuXG4iLCIjIGpRdWVyeSBsaWtlIHJlc3VsdHMgd2hlbiBzZWFyY2hpbmcgZm9yIHNuaXBwZXRzLlxuIyBgZG9jKFwiaGVyb1wiKWAgd2lsbCByZXR1cm4gYSBTbmlwcGV0QXJyYXkgdGhhdCB3b3JrcyBzaW1pbGFyIHRvIGEgalF1ZXJ5IG9iamVjdC5cbiMgRm9yIGV4dGVuc2liaWxpdHkgdmlhIHBsdWdpbnMgd2UgZXhwb3NlIHRoZSBwcm90b3R5cGUgb2YgU25pcHBldEFycmF5IHZpYSBgZG9jLmZuYC5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldEFycmF5XG5cblxuICAjIEBwYXJhbSBzbmlwcGV0czogYXJyYXkgb2Ygc25pcHBldHNcbiAgY29uc3RydWN0b3I6IChAc25pcHBldHMpIC0+XG4gICAgQHNuaXBwZXRzID0gW10gdW5sZXNzIEBzbmlwcGV0cz9cbiAgICBAY3JlYXRlUHNldWRvQXJyYXkoKVxuXG5cbiAgY3JlYXRlUHNldWRvQXJyYXk6ICgpIC0+XG4gICAgZm9yIHJlc3VsdCwgaW5kZXggaW4gQHNuaXBwZXRzXG4gICAgICBAW2luZGV4XSA9IHJlc3VsdFxuXG4gICAgQGxlbmd0aCA9IEBzbmlwcGV0cy5sZW5ndGhcbiAgICBpZiBAc25pcHBldHMubGVuZ3RoXG4gICAgICBAZmlyc3QgPSBAWzBdXG4gICAgICBAbGFzdCA9IEBbQHNuaXBwZXRzLmxlbmd0aCAtIDFdXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHNuaXBwZXQgaW4gQHNuaXBwZXRzXG4gICAgICBjYWxsYmFjayhzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5yZW1vdmUoKVxuXG4gICAgdGhpc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgU25pcHBldENvbnRhaW5lclxuIyAtLS0tLS0tLS0tLS0tLS0tXG4jIEEgU25pcHBldENvbnRhaW5lciBjb250YWlucyBhbmQgbWFuYWdlcyBhIGxpbmtlZCBsaXN0XG4jIG9mIHNuaXBwZXRzLlxuI1xuIyBUaGUgc25pcHBldENvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyBpdHMgc25pcHBldFRyZWVcbiMgaW5mb3JtZWQgYWJvdXQgY2hhbmdlcyAob25seSBpZiB0aGV5IGFyZSBhdHRhY2hlZCB0byBvbmUpLlxuI1xuIyBAcHJvcCBmaXJzdDogZmlyc3Qgc25pcHBldCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIGxhc3Q6IGxhc3Qgc25pcHBldCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIHBhcmVudFNuaXBwZXQ6IHBhcmVudCBTbmlwcGV0TW9kZWxcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldENvbnRhaW5lclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBwYXJlbnRTbmlwcGV0LCBAbmFtZSwgaXNSb290IH0pIC0+XG4gICAgQGlzUm9vdCA9IGlzUm9vdD9cbiAgICBAZmlyc3QgPSBAbGFzdCA9IHVuZGVmaW5lZFxuXG5cbiAgcHJlcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQGZpcnN0XG4gICAgICBAaW5zZXJ0QmVmb3JlKEBmaXJzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAcGFyZW50U25pcHBldFxuICAgICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBAcGFyZW50U25pcHBldCwgJ2Nhbm5vdCBhcHBlbmQgc25pcHBldCB0byBpdHNlbGYnXG5cbiAgICBpZiBAbGFzdFxuICAgICAgQGluc2VydEFmdGVyKEBsYXN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBpbnNlcnRCZWZvcmU6IChzbmlwcGV0LCBpbnNlcnRlZFNuaXBwZXQpIC0+XG4gICAgcmV0dXJuIGlmIHNuaXBwZXQucHJldmlvdXMgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYmVmb3JlIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBuZXh0OiBzbmlwcGV0XG4gICAgICBwYXJlbnRDb250YWluZXI6IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBAYXR0YWNoU25pcHBldChpbnNlcnRlZFNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgaW5zZXJ0QWZ0ZXI6IChzbmlwcGV0LCBpbnNlcnRlZFNuaXBwZXQpIC0+XG4gICAgcmV0dXJuIGlmIHNuaXBwZXQubmV4dCA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBhZnRlciBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldFxuICAgICAgbmV4dDogc25pcHBldC5uZXh0XG4gICAgICBwYXJlbnRDb250YWluZXI6IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG5cbiAgICBAYXR0YWNoU25pcHBldChpbnNlcnRlZFNuaXBwZXQsIHBvc2l0aW9uKVxuXG5cbiAgdXA6IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBAaW5zZXJ0QmVmb3JlKHNuaXBwZXQucHJldmlvdXMsIHNuaXBwZXQpXG5cblxuICBkb3duOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0Lm5leHQ/XG4gICAgICBAaW5zZXJ0QWZ0ZXIoc25pcHBldC5uZXh0LCBzbmlwcGV0KVxuXG5cbiAgZ2V0U25pcHBldFRyZWU6IC0+XG4gICAgQHNuaXBwZXRUcmVlIHx8IEBwYXJlbnRTbmlwcGV0Py5zbmlwcGV0VHJlZVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHNcbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXQgPSBAZmlyc3RcbiAgICB3aGlsZSAoc25pcHBldClcbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmKGNhbGxiYWNrKVxuICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzIGFuZCBjb250YWluZXJzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0KVxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICByZW1vdmU6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQuZGVzdHJveSgpXG4gICAgQF9kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4uL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UnKVxuXG5FZGl0YWJsZURpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZWRpdGFibGVfZGlyZWN0aXZlJylcbkltYWdlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9pbWFnZV9kaXJlY3RpdmUnKVxuSHRtbERpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vaHRtbF9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgY3JlYXRlOiAoeyBzbmlwcGV0LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIERpcmVjdGl2ZSA9IEBnZXREaXJlY3RpdmVDb25zdHJ1Y3Rvcih0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlKVxuICAgIG5ldyBEaXJlY3RpdmUoeyBzbmlwcGV0LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KVxuXG5cbiAgZ2V0RGlyZWN0aXZlQ29uc3RydWN0b3I6IChkaXJlY3RpdmVUeXBlKSAtPlxuICAgIHN3aXRjaCBkaXJlY3RpdmVUeXBlXG4gICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgRWRpdGFibGVEaXJlY3RpdmVcbiAgICAgIHdoZW4gJ2ltYWdlJ1xuICAgICAgICBJbWFnZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgSHRtbERpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBhc3NlcnQgZmFsc2UsIFwiVW5zdXBwb3J0ZWQgc25pcHBldCBkaXJlY3RpdmU6ICN7IGRpcmVjdGl2ZVR5cGUgfVwiXG5cbiIsImRlZXBFcXVhbCA9IHJlcXVpcmUoJ2RlZXAtZXF1YWwnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGlyZWN0aXZlRmFjdG9yeSA9IHJlcXVpcmUoJy4vc25pcHBldF9kaXJlY3RpdmVfZmFjdG9yeScpXG5EaXJlY3RpdmVDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuXG4jIFNuaXBwZXRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBTbmlwcGV0TW9kZWwgaGFzIGEgdGVtcGxhdGUgd2hpY2ggYWxsb3dzIHRvIGdlbmVyYXRlIGEgc25pcHBldFZpZXdcbiMgZnJvbSBhIHNuaXBwZXRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIFNuaXBwZXRUcmVlLlxuIyBFdmVyeSBTbmlwcGV0TW9kZWwgY2FuIGhhdmUgYSBwYXJlbnQgKFNuaXBwZXRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgc25pcHBldHMpIGFuZCBtdWx0aXBsZSBjb250YWluZXJzIChTbmlwcGV0Q29udGFpbmVycykuXG4jXG4jIFRoZSBjb250YWluZXJzIGFyZSB0aGUgcGFyZW50cyBvZiB0aGUgY2hpbGQgU25pcHBldE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgU25pcHBldENvbnRhaW5lclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0TW9kZWxcblxuICBjb25zdHJ1Y3RvcjogKHsgQHRlbXBsYXRlLCBpZCB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEB0ZW1wbGF0ZSwgJ2Nhbm5vdCBpbnN0YW50aWF0ZSBzbmlwcGV0IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAZGF0YVZhbHVlcyA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAaWRlbnRpZmllciA9IEB0ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAc25pcHBldFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIEBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY3JlYXRlU25pcHBldERpcmVjdGl2ZShkaXJlY3RpdmUpXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIFNuaXBwZXRNb2RlbFwiXG5cblxuICAjIENyZWF0ZSBhIGRpcmVjdGl2ZSBmb3IgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnIHRlbXBsYXRlIGRpcmVjdGl2ZXNcbiAgY3JlYXRlU25pcHBldERpcmVjdGl2ZTogKHRlbXBsYXRlRGlyZWN0aXZlKSAtPlxuICAgIEBkaXJlY3RpdmVzLmFkZCBkaXJlY3RpdmVGYWN0b3J5LmNyZWF0ZVxuICAgICAgc25pcHBldDogdGhpc1xuICAgICAgdGVtcGxhdGVEaXJlY3RpdmU6IHRlbXBsYXRlRGlyZWN0aXZlXG5cblxuICBjcmVhdGVWaWV3OiAoaXNSZWFkT25seSkgLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlVmlldyh0aGlzLCBpc1JlYWRPbmx5KVxuXG5cbiAgIyBTbmlwcGV0VHJlZSBvcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICMgSW5zZXJ0IGEgc25pcHBldCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRCZWZvcmUodGhpcywgc25pcHBldE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGFmdGVyIHRoaXMgb25lXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gICMgQXBwZW5kIGEgc25pcHBldCB0byBhIGNvbnRhaW5lciBvZiB0aGlzIHNuaXBwZXRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgc25pcHBldE1vZGVsID0gY29udGFpbmVyTmFtZVxuICAgICAgY29udGFpbmVyTmFtZSA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5kZWZhdWx0TmFtZVxuXG4gICAgQGNvbnRhaW5lcnNbY29udGFpbmVyTmFtZV0uYXBwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBzbmlwcGV0IHRvIGEgY29udGFpbmVyIG9mIHRoaXMgc25pcHBldFxuICBwcmVwZW5kOiAoY29udGFpbmVyTmFtZSwgc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgc25pcHBldE1vZGVsID0gY29udGFpbmVyTmFtZVxuICAgICAgY29udGFpbmVyTmFtZSA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5kZWZhdWx0TmFtZVxuXG4gICAgQGNvbnRhaW5lcnNbY29udGFpbmVyTmFtZV0ucHJlcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgIyBNb3ZlIHRoaXMgc25pcHBldCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBzbmlwcGV0IGRvd24gKG5leHQpXG4gIGRvd246IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5kb3duKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyBSZW1vdmUgdGhpcyBzbmlwcGV0IGZyb20gaXRzIGNvbnRhaW5lciBhbmQgU25pcHBldFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIFNuaXBwZXRUcmVlIEl0ZXJhdG9yc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgTmF2aWdhdGUgYW5kIHF1ZXJ5IHRoZSBzbmlwcGV0IHRyZWUgcmVsYXRpdmUgdG8gdGhpcyBzbmlwcGV0LlxuXG4gIGdldFBhcmVudDogLT5cbiAgICAgQHBhcmVudENvbnRhaW5lcj8ucGFyZW50U25pcHBldFxuXG5cbiAgcGFyZW50czogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLmdldFBhcmVudCgpKVxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwuZGVzY2VuZGFudHMoY2FsbGJhY2spXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIHNuaXBwZXRNb2RlbClcbiAgZGVzY2VuZGFudENvbnRhaW5lcnM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpID0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpIGlmIHNuaXBwZXRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IHNuaXBwZXRNb2RlbC5kaXJlY3RpdmVzLmdldCgnaW1hZ2UnKVxuXG4gIGhhc0NvbnRhaW5lcnM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2NvbnRhaW5lcicpID4gMFxuXG5cbiAgaGFzRWRpdGFibGVzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdlZGl0YWJsZScpID4gMFxuXG5cbiAgaGFzSHRtbDogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnaHRtbCcpID4gMFxuXG5cbiAgaGFzSW1hZ2VzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdpbWFnZScpID4gMFxuXG5cbiAgIyBzZXQgdGhlIGNvbnRlbnQgZGF0YSBmaWVsZCBvZiB0aGUgc25pcHBldFxuICBzZXRDb250ZW50OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICBpZiBAY29udGVudFtuYW1lXVxuICAgICAgICBAY29udGVudFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuICAgIGVsc2UgaWYgdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnXG4gICAgICBpZiBAY29udGVudFtuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAY29udGVudFtuYW1lXSA9IHZhbHVlXG4gICAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcInNldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgaWYgZGlyZWN0aXZlLmlzSW1hZ2VcbiAgICAgIGlmIGRpcmVjdGl2ZS5nZXRJbWFnZVVybCgpICE9IHZhbHVlXG4gICAgICAgIGRpcmVjdGl2ZS5zZXRJbWFnZVVybCh2YWx1ZSlcbiAgICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcbiAgICBlbHNlXG4gICAgICBAc2V0Q29udGVudChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwiZ2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBAZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0Q29udGVudCgpXG5cblxuICAjIENoZWNrIGlmIGEgZGlyZWN0aXZlIGhhcyBjb250ZW50XG4gIGlzRW1wdHk6IChuYW1lKSAtPlxuICAgIHZhbHVlID0gQGdldChuYW1lKVxuICAgIHZhbHVlID09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PSAnJ1xuXG5cbiAgIyBEYXRhIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIFNldCBhcmJpdHJhcnkgZGF0YSB0byBiZSBzdG9yZWQgd2l0aCB0aGlzIHNuaXBwZXRNb2RlbC5cblxuXG4gICMgY2FuIGJlIGNhbGxlZCB3aXRoIGEgc3RyaW5nIG9yIGEgaGFzaFxuICBkYXRhOiAoYXJnKSAtPlxuICAgIGlmIHR5cGVvZihhcmcpID09ICdvYmplY3QnXG4gICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIGFyZ1xuICAgICAgICBpZiBAY2hhbmdlRGF0YShuYW1lLCB2YWx1ZSlcbiAgICAgICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMucHVzaChuYW1lKVxuICAgICAgaWYgQHNuaXBwZXRUcmVlICYmIGNoYW5nZWREYXRhUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIEBzbmlwcGV0VHJlZS5kYXRhQ2hhbmdpbmcodGhpcywgY2hhbmdlZERhdGFQcm9wZXJ0aWVzKVxuICAgIGVsc2VcbiAgICAgIEBkYXRhVmFsdWVzW2FyZ11cblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGNoYW5nZURhdGE6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBub3QgZGVlcEVxdWFsKEBkYXRhVmFsdWVzW25hbWVdLCB2YWx1ZSlcbiAgICAgIEBkYXRhVmFsdWVzW25hbWVdID0gdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG5cbiAgIyBTdHlsZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldFN0eWxlOiAobmFtZSkgLT5cbiAgICBAc3R5bGVzW25hbWVdXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHN0eWxlID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXVxuICAgIGlmIG5vdCBzdHlsZVxuICAgICAgbG9nLndhcm4gXCJVbmtub3duIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBzbmlwcGV0VHJlZVxuICAgICAgICAgIEBzbmlwcGV0VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgIyBAZGVwcmVjYXRlZFxuICAjIEdldHRlciBhbmQgU2V0dGVyIGluIG9uZS5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBjb25zb2xlLmxvZyhcIlNuaXBwZXRNb2RlbCNzdHlsZSgpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgI2dldFN0eWxlKCkgYW5kICNzZXRTdHlsZSgpLlwiKVxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gICMgU25pcHBldE1vZGVsIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGNvcHk6IC0+XG4gICAgbG9nLndhcm4oXCJTbmlwcGV0TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiIsImRlZXBFcXVhbCA9IHJlcXVpcmUoJ2RlZXAtZXF1YWwnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBQdWJsaWMgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tXG5cbiAgIyBTZXJpYWxpemUgYSBTbmlwcGV0TW9kZWxcbiAgI1xuICAjIEV4dGVuZHMgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0TW9kZWxcbiAgI1xuICAjIEV4YW1wbGUgUmVzdWx0OlxuICAjIGlkOiAnYWtrN2hqdXVlMidcbiAgIyBpZGVudGlmaWVyOiAndGltZWxpbmUudGl0bGUnXG4gICMgY29udGVudDogeyAuLi4gfVxuICAjIHN0eWxlczogeyAuLi4gfVxuICAjIGRhdGE6IHsgLi4uIH1cbiAgIyBjb250YWluZXJzOiB7IC4uLiB9XG4gIFNuaXBwZXRNb2RlbDo6dG9Kc29uID0gKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA/PSB0aGlzXG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBzbmlwcGV0LmlkXG4gICAgICBpZGVudGlmaWVyOiBzbmlwcGV0LmlkZW50aWZpZXJcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoc25pcHBldC5jb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShzbmlwcGV0LmNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KHNuaXBwZXQuc3R5bGVzKVxuICAgICAganNvbi5zdHlsZXMgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KHNuaXBwZXQuc3R5bGVzKVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShzbmlwcGV0LmRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc25pcHBldC5kYXRhVmFsdWVzKVxuXG4gICAgIyBjcmVhdGUgYW4gYXJyYXkgZm9yIGV2ZXJ5IGNvbnRhaW5lclxuICAgIGZvciBuYW1lIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAganNvbi5jb250YWluZXJzIHx8PSB7fVxuICAgICAganNvbi5jb250YWluZXJzW25hbWVdID0gW11cblxuICAgIGpzb25cblxuXG4gIGZyb21Kc29uOiAoanNvbiwgZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biB0ZW1wbGF0ZSBpZGVudGlmaWVyICcjeyBqc29uLmlkZW50aWZpZXIgfSdcIlxuXG4gICAgbW9kZWwgPSBuZXcgU25pcHBldE1vZGVsKHsgdGVtcGxhdGUsIGlkOiBqc29uLmlkIH0pXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgICBhc3NlcnQgbW9kZWwuY29udGVudC5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGVudCAnI3sgbmFtZSB9J1wiXG5cbiAgICAgICMgVHJhbnNmb3JtIHN0cmluZyBpbnRvIG9iamVjdDogQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZm9yIG9sZCBpbWFnZSB2YWx1ZXMuXG4gICAgICBpZiBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS50eXBlID09ICdpbWFnZScgJiYgdHlwZW9mIHZhbHVlID09ICdzdHJpbmcnXG4gICAgICAgIG1vZGVsLmNvbnRlbnRbbmFtZV0gPVxuICAgICAgICAgIHVybDogdmFsdWVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9IHZhbHVlXG5cbiAgICBmb3Igc3R5bGVOYW1lLCB2YWx1ZSBvZiBqc29uLnN0eWxlc1xuICAgICAgbW9kZWwuc2V0U3R5bGUoc3R5bGVOYW1lLCB2YWx1ZSlcblxuICAgIG1vZGVsLmRhdGEoanNvbi5kYXRhKSBpZiBqc29uLmRhdGFcblxuICAgIGZvciBjb250YWluZXJOYW1lLCBzbmlwcGV0QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICAgIGlmIHNuaXBwZXRBcnJheVxuICAgICAgICBhc3NlcnQgJC5pc0FycmF5KHNuaXBwZXRBcnJheSksXG4gICAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgICAgZm9yIGNoaWxkIGluIHNuaXBwZXRBcnJheVxuICAgICAgICAgIG1vZGVsLmFwcGVuZCggY29udGFpbmVyTmFtZSwgQGZyb21Kc29uKGNoaWxkLCBkZXNpZ24pIClcblxuICAgIG1vZGVsXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2FycmF5JylcblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4vc25pcHBldF9tb2RlbCcpXG5zbmlwcGV0TW9kZWxTZXJpYWxpemVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsX3NlcmlhbGl6ZXInKVxuXG4jIFNuaXBwZXRUcmVlXG4jIC0tLS0tLS0tLS0tXG4jIExpdmluZ2RvY3MgZXF1aXZhbGVudCB0byB0aGUgRE9NIHRyZWUuXG4jIEEgc25pcHBldCB0cmVlIGNvbnRhaW5lcyBhbGwgdGhlIHNuaXBwZXRzIG9mIGEgcGFnZSBpbiBoaWVyYXJjaGljYWwgb3JkZXIuXG4jXG4jIFRoZSByb290IG9mIHRoZSBTbmlwcGV0VHJlZSBpcyBhIFNuaXBwZXRDb250YWluZXIuIEEgU25pcHBldENvbnRhaW5lclxuIyBjb250YWlucyBhIGxpc3Qgb2Ygc25pcHBldHMuXG4jXG4jIHNuaXBwZXRzIGNhbiBoYXZlIG11bHRpYmxlIFNuaXBwZXRDb250YWluZXJzIHRoZW1zZWx2ZXMuXG4jXG4jICMjIyBFeGFtcGxlOlxuIyAgICAgLSBTbmlwcGV0Q29udGFpbmVyIChyb290KVxuIyAgICAgICAtIFNuaXBwZXQgJ0hlcm8nXG4jICAgICAgIC0gU25pcHBldCAnMiBDb2x1bW5zJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnbWFpbidcbiMgICAgICAgICAgIC0gU25pcHBldCAnVGl0bGUnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdzaWRlYmFyJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdJbmZvLUJveCcnXG4jXG4jICMjIyBFdmVudHM6XG4jIFRoZSBmaXJzdCBzZXQgb2YgU25pcHBldFRyZWUgRXZlbnRzIGFyZSBjb25jZXJuZWQgd2l0aCBsYXlvdXQgY2hhbmdlcyBsaWtlXG4jIGFkZGluZywgcmVtb3Zpbmcgb3IgbW92aW5nIHNuaXBwZXRzLlxuI1xuIyBDb25zaWRlcjogSGF2ZSBhIGRvY3VtZW50RnJhZ21lbnQgYXMgdGhlIHJvb3ROb2RlIGlmIG5vIHJvb3ROb2RlIGlzIGdpdmVuXG4jIG1heWJlIHRoaXMgd291bGQgaGVscCBzaW1wbGlmeSBzb21lIGNvZGUgKHNpbmNlIHNuaXBwZXRzIGFyZSBhbHdheXNcbiMgYXR0YWNoZWQgdG8gdGhlIERPTSkuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRUcmVlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgY29udGVudCwgQGRlc2lnbiB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCBcIkVycm9yIGluc3RhbnRpYXRpbmcgU25pcHBldFRyZWU6IGRlc2lnbiBwYXJhbSBpcyBtaXNzc2luZy5cIlxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgc25pcHBldCB0cmVlIHRvIHRoZSByb290XG4gICAgIyBvdGhlcndpc2UgYWxsIHRoZSBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQgd2hpbGUgYnVpbGRpbmcgdGhlIHRyZWVcbiAgICBAZnJvbUpzb24oY29udGVudCwgQGRlc2lnbikgaWYgY29udGVudD9cblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgc25pcHBldCBhdCB0aGUgYmVnaW5uaW5nLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QucHJlcGVuZChzbmlwcGV0KSBpZiBzbmlwcGV0P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IHNuaXBwZXQgYXQgdGhlIGVuZC5cbiAgIyBAcGFyYW06IHNuaXBwZXRNb2RlbCBpbnN0YW5jZSBvciBzbmlwcGV0IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0U25pcHBldDogKHNuaXBwZXROYW1lKSAtPlxuICAgIGlmIHR5cGVvZiBzbmlwcGV0TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZU1vZGVsKHNuaXBwZXROYW1lKVxuICAgIGVsc2VcbiAgICAgIHNuaXBwZXROYW1lXG5cblxuICBjcmVhdGVNb2RlbDogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBjcmVhdGVTbmlwcGV0OiAtPlxuICAgIEBjcmVhdGVNb2RlbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICBnZXRUZW1wbGF0ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChpZGVudGlmaWVyKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBpZGVudGlmaWVyIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBzbmlwcGV0QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRSZW1vdmVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBzbmlwcGV0Q29udGVudENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRIdG1sQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldERhdGFDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cblxuICAjIFRyYXZlcnNlIHRoZSB3aG9sZSBzbmlwcGV0IHRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3Qgc25pcHBldFxuICBmaXJzdDogLT5cbiAgICBAcm9vdC5maXJzdFxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuYWxsKGNhbGxiYWNrKVxuXG5cbiAgZmluZDogKHNlYXJjaCkgLT5cbiAgICBpZiB0eXBlb2Ygc2VhcmNoID09ICdzdHJpbmcnXG4gICAgICByZXMgPSBbXVxuICAgICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICAgIGlmIHNuaXBwZXQuaWRlbnRpZmllciA9PSBzZWFyY2ggfHwgc25pcHBldC50ZW1wbGF0ZS5pZCA9PSBzZWFyY2hcbiAgICAgICAgICByZXMucHVzaChzbmlwcGV0KVxuXG4gICAgICBuZXcgU25pcHBldEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgU25pcHBldEFycmF5KClcblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgb2xkUm9vdCA9IEByb290XG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKHNuaXBwZXQsIHBhcmVudHMpIC0+XG4gICMgICBwYXJlbnRzIHx8PSBbXVxuXG4gICMgICAjIHRyYXZlcnNlXG4gICMgICBwYXJlbnRzID0gcGFyZW50cy5wdXNoKHNuaXBwZXQpXG4gICMgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgIyAgICAgc25pcHBldCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoc25pcHBldClcbiAgIyAgICAgICBAZWFjaFdpdGhQYXJlbnRzKHNuaXBwZXQsIHBhcmVudHMpXG4gICMgICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG4gICMgICBwYXJlbnRzLnNwbGljZSgtMSlcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnU25pcHBldFRyZWVcXG4tLS0tLS0tLS0tLVxcbidcblxuICAgIGFkZExpbmUgPSAodGV4dCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgb3V0cHV0ICs9IFwiI3sgQXJyYXkoaW5kZW50YXRpb24gKyAxKS5qb2luKFwiIFwiKSB9I3sgdGV4dCB9XFxuXCJcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IHNuaXBwZXQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLnRpdGxlIH0gKCN7IHRlbXBsYXRlLmlkZW50aWZpZXIgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgaW5kZW50YXRpb24pIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBzbmlwcGV0c1xuICAjIFRoZXNlIGZ1bmN0aW9ucyBzaG91bGQgb25seSBiZSBjYWxsZWQgYnkgc25pcHBldENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgYXR0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZSA9PSB0aGlzXG4gICAgICAjIG1vdmUgc25pcHBldFxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldE1vdmVkJywgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlP1xuICAgICAgICAjIHJlbW92ZSBmcm9tIG90aGVyIHNuaXBwZXQgdHJlZVxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRDb250YWluZXIuZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldEFkZGVkJywgc25pcHBldClcblxuXG4gIGZpcmVFdmVudDogKGV2ZW50LCBhcmdzLi4uKSAtPlxuICAgIHRoaXNbZXZlbnRdLmZpcmUuYXBwbHkoZXZlbnQsIGFyZ3MpXG4gICAgQGNoYW5nZWQuZmlyZSgpXG5cblxuICBkZXRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgZGV0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXQuc25pcHBldFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIHNuaXBwZXQgZnJvbSBhbm90aGVyIFNuaXBwZXRUcmVlJ1xuXG4gICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnRzKSAtPlxuICAgICAgZGVzY2VuZGFudHMuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGRldGFjaFNuaXBwZXRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0UmVtb3ZlZCcsIHNuaXBwZXQpXG5cblxuICBjb250ZW50Q2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRDb250ZW50Q2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBodG1sQ2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRIdG1sQ2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBkYXRhQ2hhbmdpbmc6IChzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcykgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0RGF0YUNoYW5nZWQnLCBzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICBwcmludEpzb246IC0+XG4gICAgd29yZHMucmVhZGFibGVKc29uKEB0b0pzb24oKSlcblxuXG4gICMgUmV0dXJucyBhIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgIyB0aGF0IGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIgYXMgSlNPTi5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGRhdGEgPSB7fVxuICAgIGRhdGFbJ2NvbnRlbnQnXSA9IFtdXG4gICAgZGF0YVsnZGVzaWduJ10gPSB7IG5hbWU6IEBkZXNpZ24ubmFtZXNwYWNlIH1cblxuICAgIHNuaXBwZXRUb0RhdGEgPSAoc25pcHBldCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0LnRvSnNvbigpXG4gICAgICBjb250YWluZXJBcnJheS5wdXNoIHNuaXBwZXREYXRhXG4gICAgICBzbmlwcGV0RGF0YVxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0VG9EYXRhKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBzbmlwcGV0RGF0YS5jb250YWluZXJzW3NuaXBwZXRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIHNuaXBwZXRUcmVlXG4gICMgVGhpcyBtZXRob2Qgc3VwcHJlc3NlcyBjaGFuZ2UgZXZlbnRzIGluIHRoZSBzbmlwcGV0VHJlZS5cbiAgI1xuICAjIENvbnNpZGVyIHRvIGNoYW5nZSBwYXJhbXM6XG4gICMgZnJvbURhdGEoeyBjb250ZW50LCBkZXNpZ24sIHNpbGVudCB9KSAjIHNpbGVudCBbYm9vbGVhbl06IHN1cHByZXNzIGNoYW5nZSBldmVudHNcbiAgZnJvbURhdGE6IChkYXRhLCBkZXNpZ24sIHNpbGVudD10cnVlKSAtPlxuICAgIGlmIGRlc2lnbj9cbiAgICAgIGFzc2VydCBub3QgQGRlc2lnbj8gfHwgZGVzaWduLmVxdWFscyhAZGVzaWduKSwgJ0Vycm9yIGxvYWRpbmcgZGF0YS4gU3BlY2lmaWVkIGRlc2lnbiBpcyBkaWZmZXJlbnQgZnJvbSBjdXJyZW50IHNuaXBwZXRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBpZiBkYXRhLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IHNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIuZnJvbUpzb24oc25pcHBldERhdGEsIGRlc2lnbilcbiAgICAgICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgICAgQHJvb3QuZWFjaCAoc25pcHBldCkgPT5cbiAgICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuXG4gICMgQXBwZW5kIGRhdGEgdG8gdGhpcyBzbmlwcGV0VHJlZVxuICAjIEZpcmVzIHNuaXBwZXRBZGRlZCBldmVudCBmb3IgZXZlcnkgc25pcHBldFxuICBhZGREYXRhOiAoZGF0YSwgZGVzaWduKSAtPlxuICAgIEBmcm9tRGF0YShkYXRhLCBkZXNpZ24sIGZhbHNlKVxuXG5cbiAgYWRkRGF0YVdpdGhBbmltYXRpb246IChkYXRhLCBkZWxheT0yMDApIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCAnRXJyb3IgYWRkaW5nIGRhdGEuIFNuaXBwZXRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgIGRvID0+XG4gICAgICAgIGNvbnRlbnQgPSBzbmlwcGV0RGF0YVxuICAgICAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgc25pcHBldCA9IHNuaXBwZXRNb2RlbFNlcmlhbGl6ZXIuZnJvbUpzb24oY29udGVudCwgQGRlc2lnbilcbiAgICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcbiAgICAgICAgLCB0aW1lb3V0XG5cbiAgICAgIHRpbWVvdXQgKz0gTnVtYmVyKGRlbGF5KVxuXG5cbiAgdG9EYXRhOiAtPlxuICAgIEBzZXJpYWxpemUoKVxuXG5cbiAgIyBBbGlhc2VzXG4gICMgLS0tLS0tLVxuXG4gIGZyb21Kc29uOiAoYXJncy4uLikgLT5cbiAgICBAZnJvbURhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHRvSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQHRvRGF0YS5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBSZXR1cm4gdGhlIG5vZGVOYW1lIGluIGxvd2VyIGNhc2VcbiAgZ2V0VGFnTmFtZTogLT5cbiAgICBAZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZCBmcm9tIHRoZVxuICAjIHRlbXBsYXRlIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXdcbiAgY2xvbmU6IC0+XG4gICAgbmV3RGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZShuYW1lOiBAbmFtZSwgdHlwZTogQHR5cGUpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQGVsZW0pXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuICAgIGRpcmVjdGl2ZVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cbiAgICB0aGlzW2RpcmVjdGl2ZS5pbmRleCArPSAxXVxuXG5cbiAgbmV4dE9mVHlwZTogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIG5hbWVzOiAodHlwZSkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgZGlyZWN0aXZlLm5hbWVcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGVhY2hPZlR5cGU6ICh0eXBlLCBjYWxsYmFjaykgLT5cbiAgICBpZiB0aGlzW3R5cGVdXG4gICAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNbdHlwZV1cbiAgICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaEVkaXRhYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2VkaXRhYmxlJywgY2FsbGJhY2spXG5cblxuICBlYWNoSW1hZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnaW1hZ2UnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnY29udGFpbmVyJywgY2FsbGJhY2spXG5cblxuICBlYWNoSHRtbDogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdodG1sJywgY2FsbGJhY2spXG5cblxuICBjbG9uZTogLT5cbiAgICBuZXdDb2xsZWN0aW9uID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICBuZXdDb2xsZWN0aW9uLmFkZChkaXJlY3RpdmUuY2xvbmUoKSlcblxuICAgIG5ld0NvbGxlY3Rpb25cblxuXG4gICMgaGVscGVyIHRvIGRpcmVjdGx5IGdldCBlbGVtZW50IHdyYXBwZWQgaW4gYSBqUXVlcnkgb2JqZWN0XG4gICMgdG9kbzogcmVuYW1lIG9yIGJldHRlciByZW1vdmVcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgcGFyc2U6IChlbGVtKSAtPlxuICAgIGVsZW1EaXJlY3RpdmUgPSB1bmRlZmluZWRcbiAgICBtb2RpZmljYXRpb25zID0gW11cbiAgICBAcGFyc2VEaXJlY3RpdmVzIGVsZW0sIChkaXJlY3RpdmUpIC0+XG4gICAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgICAgZWxlbURpcmVjdGl2ZSA9IGRpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RpZmljYXRpb25zLnB1c2goZGlyZWN0aXZlKVxuXG4gICAgQGFwcGx5TW9kaWZpY2F0aW9ucyhlbGVtRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSBpZiBlbGVtRGlyZWN0aXZlXG4gICAgcmV0dXJuIGVsZW1EaXJlY3RpdmVcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGVsZW0sIGZ1bmMpIC0+XG4gICAgZGlyZWN0aXZlRGF0YSA9IFtdXG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0ci5uYW1lXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHJpYnV0ZU5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZURhdGEucHVzaFxuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWVcbiAgICAgICAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVcbiAgICAgICAgICAgIG5hbWU6IGF0dHIudmFsdWVcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgICAgIGVsZW06IGVsZW1cblxuICAgICMgU2luY2Ugd2UgbW9kaWZ5IHRoZSBhdHRyaWJ1dGVzIHdlIGhhdmUgdG8gc3BsaXRcbiAgICAjIHRoaXMgaW50byB0d28gbG9vcHNcbiAgICBmb3IgZGF0YSBpbiBkaXJlY3RpdmVEYXRhXG4gICAgICBkaXJlY3RpdmUgPSBkYXRhLmRpcmVjdGl2ZVxuICAgICAgQHJld3JpdGVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBkYXRhLmF0dHJpYnV0ZU5hbWUpXG4gICAgICBmdW5jKGRpcmVjdGl2ZSlcblxuXG4gIGFwcGx5TW9kaWZpY2F0aW9uczogKG1haW5EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBtb2RpZmljYXRpb25zXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnb3B0aW9uYWwnXG4gICAgICAgICAgbWFpbkRpcmVjdGl2ZS5vcHRpb25hbCA9IHRydWVcblxuXG4gICMgTm9ybWFsaXplIG9yIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICMgZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgcmV3cml0ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgIGlmIGF0dHJpYnV0ZU5hbWUgIT0gZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgZWxzZSBpZiBub3QgZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUpXG4gICAgZWxzZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG5cblxuICAjIGZvcmNlIGF0dHJpYnV0ZSBzdHlsZSBhcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICMgZS5nLiBhdHRyaWJ1dGUgJ2RvYy1jb250YWluZXInIGJlY29tZXMgJ2RhdGEtZG9jLWNvbnRhaW5lcidcbiAgbm9ybWFsaXplQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGVsZW0gPSBkaXJlY3RpdmUuZWxlbVxuICAgIGlmIGF0dHJpYnV0ZU5hbWVcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgIGVsZW0uc2V0QXR0cmlidXRlKGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKSwgZGlyZWN0aXZlLm5hbWUpXG5cblxuICByZW1vdmVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZGlyZWN0aXZlLmVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIG91dHB1dCB0aGUgYWNjZXB0ZWQgY29udGVudCBvZiB0aGUgc25pcHBldFxuICAjIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBjcmVhdGVcbiAgIyBlLmc6IHsgdGl0bGU6IFwiSXRjaHkgYW5kIFNjcmF0Y2h5XCIgfVxuICBwcmludERvYzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcbiAgICAgICMgZWRpdGFibGVzOiBPYmplY3Qua2V5cyBAZWRpdGFibGVzIGlmIEBlZGl0YWJsZXNcbiAgICAgICMgY29udGFpbmVyczogT2JqZWN0LmtleXMgQGNvbnRhaW5lcnMgaWYgQGNvbnRhaW5lcnNcblxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihkb2MpXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgbmFtZXNwYWNlOiB1bmRlZmluZWQsIGlkOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IG5hbWVzcGFjZTogcGFydHNbMF0sIGlkOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2Ugc25pcHBldCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
