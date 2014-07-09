require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
var Design, Document, EditorPage, SnippetTree, assert, config, designCache, doc;

assert = require('./modules/logging/assert');

config = require('./configuration/defaults');

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
      return $.extend(true, config, userConfig);
    }
  };
})();

window.doc = doc;


},{"./configuration/defaults":6,"./design/design":7,"./design/design_cache":8,"./document":10,"./modules/logging/assert":22,"./rendering_container/editor_page":34,"./snippet_tree/snippet_tree":41}],6:[function(require,module,exports){
var config, enrichConfig;

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
      changeTimeout: 0
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
    kickstart: {
      attr: {
        styles: 'doc-styles'
      }
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

enrichConfig = function() {
  var name, prefix, value, _ref, _results;
  this.docDirective = {};
  this.templateAttrLookup = {};
  _ref = this.directives;
  _results = [];
  for (name in _ref) {
    value = _ref[name];
    if (this.attributePrefix) {
      prefix = "" + this.attributePrefix + "-";
    }
    value.renderedAttr = "" + (prefix || '') + value.attr;
    this.docDirective[name] = value.renderedAttr;
    _results.push(this.templateAttrLookup[value.attr] = name);
  }
  return _results;
};

enrichConfig.call(config);


},{}],7:[function(require,module,exports){
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
      weight: templateDefinition.sortOrder || 0
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


},{"../modules/logging/assert":22,"../modules/logging/log":23,"../template/template":47,"./design_style":9}],8:[function(require,module,exports){
var Design, assert;

assert = require('../modules/logging/assert');

Design = require('./design');

module.exports = (function() {
  return {
    designs: {},
    load: function(name) {
      var design, designConfig;
      if (typeof name === 'string') {
        return assert(false, 'Load design by name is not implemented yet.');
      } else {
        designConfig = name;
        design = new Design(designConfig);
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


},{"../modules/logging/assert":22,"./design":7}],9:[function(require,module,exports){
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


},{"../modules/logging/assert":22,"../modules/logging/log":23}],10:[function(require,module,exports){
var Document, EventEmitter, InteractivePage, Page, Renderer, RenderingContainer, View, assert, config,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

assert = require('./modules/logging/assert');

RenderingContainer = require('./rendering_container/rendering_container');

Page = require('./rendering_container/page');

InteractivePage = require('./rendering_container/interactive_page');

Renderer = require('./rendering/renderer');

View = require('./rendering/view');

EventEmitter = require('wolfy87-eventemitter');

config = require('./configuration/defaults');

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

  return Document;

})(EventEmitter);


},{"./configuration/defaults":6,"./modules/logging/assert":22,"./rendering/renderer":29,"./rendering/view":32,"./rendering_container/interactive_page":35,"./rendering_container/page":36,"./rendering_container/rendering_container":37,"wolfy87-eventemitter":4}],11:[function(require,module,exports){
var config, css;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6}],12:[function(require,module,exports){
var DragBase, config, css;

config = require('../configuration/defaults');

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

  DragBase.prototype.drop = function() {
    if (this.started) {
      this.dragHandler.drop();
    }
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
    eventNames = event.type === 'touchstart' ? 'touchend.livingdocs-drag touchcancel.livingdocs-drag touchleave.livingdocs-drag' : 'mouseup.livingdocs-drag';
    return this.page.$document.on(eventNames, (function(_this) {
      return function() {
        return _this.drop();
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


},{"../configuration/defaults":6}],13:[function(require,module,exports){
var EditableController, config, dom,
  __slice = [].slice;

dom = require('./dom');

config = require('../configuration/defaults');

module.exports = EditableController = (function() {
  function EditableController(page) {
    this.page = page;
    this.editable = new Editable({
      window: this.page.window
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

  EditableController.prototype.updateModel = function(view, editableName, element) {
    var value;
    value = this.editable.getContent(element);
    if (config.singleLineBreak.test(value) || value === '') {
      value = void 0;
    }
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
    var contentToMerge, contents, el, frag, mergedView, mergedViewElem, viewElem, _i, _len;
    if (this.hasSingleEditable(view)) {
      mergedView = direction === 'before' ? view.prev() : view.next();
      if (mergedView && mergedView.template === view.template) {
        viewElem = view.getDirectiveElement(editableName);
        mergedViewElem = mergedView.getDirectiveElement(editableName);
        contentToMerge = this.editable.getContent(viewElem);
        frag = this.page.document.createDocumentFragment();
        contents = $('<div>').html(contentToMerge).contents();
        for (_i = 0, _len = contents.length; _i < _len; _i++) {
          el = contents[_i];
          frag.appendChild(el);
        }
        cursor = this.editable.createCursor(mergedViewElem, direction === 'before' ? 'end' : 'beginning');
        cursor[direction === 'before' ? 'insertAfter' : 'insertBefore'](frag);
        view.model.remove();
        cursor.setVisibleSelection();
        this.updateModel(mergedView, editableName, mergedViewElem);
      }
    }
    return false;
  };

  EditableController.prototype.split = function(view, editableName, before, after, cursor) {
    var afterContent, beforeContent, copy;
    if (this.hasSingleEditable(view)) {
      copy = view.template.createModel();
      beforeContent = before.querySelector('*').innerHTML;
      afterContent = after.querySelector('*').innerHTML;
      copy.set(editableName, afterContent);
      view.model.after(copy);
      view.next().focus();
      view.model.set(editableName, beforeContent);
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
    if (config.editable.changeTimeout === false) {
      return;
    }
    return this.changeTimeout = setTimeout((function(_this) {
      return function() {
        var elem;
        elem = view.getDirectiveElement(editableName);
        _this.updateModel(view, editableName, elem);
        return _this.changeTimeout = void 0;
      };
    })(this), config.editable.changeTimeout);
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


},{"../configuration/defaults":6,"./dom":11}],14:[function(require,module,exports){
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


},{"./dom":11}],15:[function(require,module,exports){
var SnippetDrag, config, css, dom, isSupported;

dom = require('./dom');

isSupported = require('../modules/feature_detection/is_supported');

config = require('../configuration/defaults');

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
        elem = _this.page.document.elementFromPoint(clientX, clientY);
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


},{"../configuration/defaults":6,"../modules/feature_detection/is_supported":20,"./dom":11}],"xmldom":[function(require,module,exports){
module.exports=require('BBz8zn');
},{}],"BBz8zn":[function(require,module,exports){
var DOMParserShim;

exports.DOMParser = DOMParserShim = (function() {
  function DOMParserShim() {}

  DOMParserShim.prototype.parseFromString = function(xmlTemplate) {
    return $.parseXML(xmlTemplate);
  };

  return DOMParserShim;

})();

exports.XMLSerializer = XMLSerializer;


},{}],18:[function(require,module,exports){
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


},{}],19:[function(require,module,exports){
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


},{}],20:[function(require,module,exports){
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


},{"./feature_detects":19}],21:[function(require,module,exports){
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


},{}],22:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":23}],23:[function(require,module,exports){
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


},{}],24:[function(require,module,exports){
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


},{"../modules/logging/assert":22}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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


},{}],27:[function(require,module,exports){
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


},{}],28:[function(require,module,exports){
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


},{"./default_image_manager":27,"./resrcit_image_manager":30}],29:[function(require,module,exports){
var Renderer, Semaphore, assert, config, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Semaphore = require('../modules/semaphore');

config = require('../configuration/defaults');

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
      log.error('Snippet could not be inserted by renderer: Snippet is not in a snippetTree');
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


},{"../configuration/defaults":6,"../modules/logging/assert":22,"../modules/logging/log":23,"../modules/semaphore":24}],30:[function(require,module,exports){
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


},{"../modules/logging/assert":22,"./default_image_manager":27}],31:[function(require,module,exports){
var DirectiveIterator, ImageManager, SnippetView, attr, config, css, dom, eventing;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../interaction/dom":11,"../modules/eventing":18,"../template/directive_iterator":46,"./image_manager":28}],32:[function(require,module,exports){
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


},{"../rendering_container/interactive_page":35,"../rendering_container/page":36,"./renderer":29}],33:[function(require,module,exports){
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


},{"../modules/semaphore":24}],34:[function(require,module,exports){
var DragBase, EditorPage, SnippetDrag, config, css;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../interaction/drag_base":12,"../interaction/snippet_drag":15}],35:[function(require,module,exports){
var DragBase, EditableController, Focus, InteractivePage, Page, SnippetDrag, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../interaction/dom":11,"../interaction/drag_base":12,"../interaction/editable_controller":13,"../interaction/focus":14,"../interaction/snippet_drag":15,"./page":36}],36:[function(require,module,exports){
var CssLoader, Page, RenderingContainer, config,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RenderingContainer = require('./rendering_container');

CssLoader = require('./css_loader');

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"./css_loader":33,"./rendering_container":37}],37:[function(require,module,exports){
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


},{"../modules/semaphore":24}],38:[function(require,module,exports){
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


},{}],39:[function(require,module,exports){
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


},{"../modules/logging/assert":22}],40:[function(require,module,exports){
var SnippetContainer, SnippetModel, assert, config, deepEqual, guid, log, serialization;

deepEqual = require('deep-equal');

config = require('../configuration/defaults');

SnippetContainer = require('./snippet_container');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

serialization = require('../modules/serialization');

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../modules/guid":21,"../modules/logging/assert":22,"../modules/logging/log":23,"../modules/serialization":25,"./snippet_container":39,"deep-equal":1}],41:[function(require,module,exports){
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


},{"../modules/logging/assert":22,"./snippet_array":38,"./snippet_container":39,"./snippet_model":40}],42:[function(require,module,exports){
var Directive, config, dom;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../interaction/dom":11}],43:[function(require,module,exports){
var Directive, DirectiveCollection, assert, config;

assert = require('../modules/logging/assert');

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../modules/logging/assert":22,"./directive":42}],44:[function(require,module,exports){
var Directive, config;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"./directive":42}],45:[function(require,module,exports){
var config, directiveFinder;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6}],46:[function(require,module,exports){
var DirectiveIterator, config;

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6}],47:[function(require,module,exports){
var DirectiveCollection, DirectiveIterator, SnippetModel, SnippetView, Template, assert, config, directiveCompiler, directiveFinder, log, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

config = require('../configuration/defaults');

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


},{"../configuration/defaults":6,"../modules/logging/assert":22,"../modules/logging/log":23,"../modules/words":26,"../rendering/snippet_view":31,"../snippet_tree/snippet_model":40,"./directive_collection":43,"./directive_compiler":44,"./directive_finder":45,"./directive_iterator":46}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fc3R5bGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZG9jdW1lbnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RyYWdfYmFzZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9raWNrc3RhcnQvYnJvd3Nlcl94bWxkb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2Fzc2VydC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvbG9nLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3JlbmRlcmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3NuaXBwZXRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDLENBQUEsVUFBYjtLQURGLENBQUE7V0FLQSxLQUFLLENBQUMsWUFBTixDQUFtQixHQUFuQixFQU5RO0VBQUEsQ0E5R1YsQ0FBQTs7a0JBQUE7O0lBcEJGLENBQUE7O0FBQUEsUUE4SVEsQ0FBQyxlQUFULEdBQTJCLFNBQUMsVUFBRCxHQUFBO0FBQ3pCLE1BQUEsS0FBQTtBQUFBLEVBQUEsSUFBQSxDQUFBLFVBQUE7QUFBQSxVQUFBLENBQUE7R0FBQTtBQUFBLEVBRUEsS0FBQSxHQUFRLFVBQVUsQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBRlIsQ0FBQTtBQUdBLEVBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNFO0FBQUEsTUFBRSxTQUFBLEVBQVcsTUFBYjtBQUFBLE1BQXdCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFsQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFNBQUEsRUFBVyxLQUFNLENBQUEsQ0FBQSxDQUFuQjtBQUFBLE1BQXVCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFqQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsK0NBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQTlJM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRvY3VtZW50ID0gcmVxdWlyZSgnLi9kb2N1bWVudCcpXG5TbmlwcGV0VHJlZSA9IHJlcXVpcmUoJy4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jID0gZG8gLT5cblxuICBlZGl0b3JQYWdlID0gbmV3IEVkaXRvclBhZ2UoKVxuXG5cbiAgIyBJbnN0YW50aWF0aW9uIHByb2Nlc3M6XG4gICMgYXN5bmMgb3Igc3luYyAtPiBnZXQgZGVzaWduIChpbmNsdWRlIGpzIGZvciBzeW5jaHJvbm91cyBsb2FkaW5nKVxuICAjIHN5bmMgLT4gY3JlYXRlIGRvY3VtZW50XG4gICMgYXN5bmMgLT4gY3JlYXRlIHZpZXcgKGlmcmFtZSlcbiAgIyBhc3luYyAtPiBsb2FkIHJlc291cmNlcyBpbnRvIHZpZXdcblxuXG4gICMgTG9hZCBhIGRvY3VtZW50IGZyb20gc2VyaWFsaXplZCBkYXRhXG4gICMgaW4gYSBzeW5jaHJvbm91cyB3YXkuIERlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgbmV3OiAoeyBkYXRhLCBkZXNpZ24gfSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGRvY3VtZW50OiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgZGVzaWduTmFtZSA9IGRlc2lnblxuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShkZXNpZ246IGRlc2lnbilcblxuICAgIEBjcmVhdGUoc25pcHBldFRyZWUpXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgZG9jLmxvYWQoanNvbkZyb21TZXJ2ZXIpXG4gICMgIC50aGVuIChkb2N1bWVudCkgLT5cbiAgIyAgICBkb2N1bWVudC5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgRGlyZWN0IGNyZWF0aW9uIHdpdGggYW4gZXhpc3RpbmcgU25pcHBldFRyZWVcbiAgY3JlYXRlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgbmV3IERvY3VtZW50KHsgc25pcHBldFRyZWUgfSlcblxuXG4gICMgU2VlIGRlc2lnbkNhY2hlLmxvYWQgZm9yIGV4YW1wbGVzIGhvdyB0byBsb2FkIHlvdXIgZGVzaWduLlxuICBkZXNpZ246IGRlc2lnbkNhY2hlXG5cbiAgIyBTdGFydCBkcmFnICYgZHJvcFxuICBzdGFydERyYWc6ICQucHJveHkoZWRpdG9yUGFnZSwgJ3N0YXJ0RHJhZycpXG5cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG4iLCIjIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gICMgTG9hZCBjc3MgYW5kIGpzIHJlc291cmNlcyBpbiBwYWdlcyBhbmQgaW50ZXJhY3RpdmUgcGFnZXNcbiAgbG9hZFJlc291cmNlczogdHJ1ZVxuXG4gICMgQ1NTIHNlbGVjdG9yIGZvciBlbGVtZW50cyAoYW5kIHRoZWlyIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBpZ25vcmVkXG4gICMgd2hlbiBmb2N1c3Npbmcgb3IgYmx1cnJpbmcgYSBzbmlwcGV0XG4gIGlnbm9yZUludGVyYWN0aW9uOiAnLmxkLWNvbnRyb2wnXG5cbiAgIyBTZXR1cCBwYXRocyB0byBsb2FkIHJlc291cmNlcyBkeW5hbWljYWxseVxuICBkZXNpZ25QYXRoOiAnL2Rlc2lnbnMnXG4gIGxpdmluZ2RvY3NDc3NGaWxlOiAnL2Fzc2V0cy9jc3MvbGl2aW5nZG9jcy5jc3MnXG5cbiAgd29yZFNlcGFyYXRvcnM6IFwiLi9cXFxcKClcXFwiJzosLjs8Pn4hIyVeJip8Kz1bXXt9YH4/XCJcblxuICAjIHN0cmluZyBjb250YWlubmcgb25seSBhIDxicj4gZm9sbG93ZWQgYnkgd2hpdGVzcGFjZXNcbiAgc2luZ2xlTGluZUJyZWFrOiAvXjxiclxccypcXC8/PlxccyokL1xuXG4gIGF0dHJpYnV0ZVByZWZpeDogJ2RhdGEnXG5cbiAgIyBFZGl0YWJsZSBjb25maWd1cmF0aW9uXG4gIGVkaXRhYmxlOlxuICAgIGFsbG93TmV3bGluZTogdHJ1ZSAjIEFsbG93IHRvIGluc2VydCBuZXdsaW5lcyB3aXRoIFNoaWZ0K0VudGVyXG4gICAgY2hhbmdlVGltZW91dDogMCAjIERlbGF5IGluIG1pbGxpc2Vjb25kcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG5cblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIHNuaXBwZXQgY2xhc3Nlc1xuICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyYWdCbG9ja2VyOiAnZG9jLWRyYWctYmxvY2tlcidcbiAgICBkcm9wTWFya2VyOiAnZG9jLWRyb3AtbWFya2VyJ1xuICAgIGJlZm9yZURyb3A6ICdkb2MtYmVmb3JlLWRyb3AnXG4gICAgbm9Ecm9wOiAnZG9jLWRyYWctbm8tZHJvcCdcbiAgICBhZnRlckRyb3A6ICdkb2MtYWZ0ZXItZHJvcCdcbiAgICBsb25ncHJlc3NJbmRpY2F0b3I6ICdkb2MtbG9uZ3ByZXNzLWluZGljYXRvcidcblxuICAgICMgdXRpbGl0eSBjbGFzc2VzXG4gICAgcHJldmVudFNlbGVjdGlvbjogJ2RvYy1uby1zZWxlY3Rpb24nXG4gICAgbWF4aW1pemVkQ29udGFpbmVyOiAnZG9jLWpzLW1heGltaXplZC1jb250YWluZXInXG4gICAgaW50ZXJhY3Rpb25CbG9ja2VyOiAnZG9jLWludGVyYWN0aW9uLWJsb2NrZXInXG5cbiAgIyBhdHRyaWJ1dGVzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgYXR0cjpcbiAgICB0ZW1wbGF0ZTogJ2RhdGEtZG9jLXRlbXBsYXRlJ1xuICAgIHBsYWNlaG9sZGVyOiAnZGF0YS1kb2MtcGxhY2Vob2xkZXInXG5cblxuICAjIEtpY2tzdGFydCBjb25maWdcbiAga2lja3N0YXJ0OlxuICAgIGF0dHI6XG4gICAgICBzdHlsZXM6ICdkb2Mtc3R5bGVzJ1xuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvbiB3aXRoIHNob3J0aGFuZHMgYW5kIGNvbXB1dGVkIHZhbHVlcy5cbmVucmljaENvbmZpZyA9IC0+XG5cbiAgIyBTaG9ydGhhbmRzIGZvciBzdHVmZiB0aGF0IGlzIHVzZWQgYWxsIG92ZXIgdGhlIHBsYWNlIHRvIG1ha2VcbiAgIyBjb2RlIGFuZCBzcGVjcyBtb3JlIHJlYWRhYmxlLlxuICBAZG9jRGlyZWN0aXZlID0ge31cbiAgQHRlbXBsYXRlQXR0ckxvb2t1cCA9IHt9XG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIEBkaXJlY3RpdmVzXG5cbiAgICAjIENyZWF0ZSB0aGUgcmVuZGVyZWRBdHRycyBmb3IgdGhlIGRpcmVjdGl2ZXNcbiAgICAjIChwcmVwZW5kIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggdGhlIGNvbmZpZ3VyZWQgcHJlZml4KVxuICAgIHByZWZpeCA9IFwiI3sgQGF0dHJpYnV0ZVByZWZpeCB9LVwiIGlmIEBhdHRyaWJ1dGVQcmVmaXhcbiAgICB2YWx1ZS5yZW5kZXJlZEF0dHIgPSBcIiN7IHByZWZpeCB8fCAnJyB9I3sgdmFsdWUuYXR0ciB9XCJcblxuICAgIEBkb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBAdGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG5cbmVucmljaENvbmZpZy5jYWxsKGNvbmZpZylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnblN0eWxlID0gcmVxdWlyZSgnLi9kZXNpZ25fc3R5bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gIGNvbnN0cnVjdG9yOiAoZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlcyA9IGRlc2lnbi50ZW1wbGF0ZXMgfHwgZGVzaWduLnNuaXBwZXRzXG4gICAgY29uZmlnID0gZGVzaWduLmNvbmZpZ1xuICAgIGdyb3VwcyA9IGRlc2lnbi5jb25maWcuZ3JvdXBzIHx8IGRlc2lnbi5ncm91cHNcblxuICAgIEBuYW1lc3BhY2UgPSBjb25maWc/Lm5hbWVzcGFjZSB8fCAnbGl2aW5nZG9jcy10ZW1wbGF0ZXMnXG4gICAgQHBhcmFncmFwaFNuaXBwZXQgPSBjb25maWc/LnBhcmFncmFwaCB8fCAndGV4dCdcbiAgICBAY3NzID0gY29uZmlnLmNzc1xuICAgIEBqcyA9IGNvbmZpZy5qc1xuICAgIEBmb250cyA9IGNvbmZpZy5mb250c1xuICAgIEB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBncm91cHMgPSB7fVxuICAgIEBzdHlsZXMgPSB7fVxuXG4gICAgQHN0b3JlVGVtcGxhdGVEZWZpbml0aW9ucyh0ZW1wbGF0ZXMpXG4gICAgQGdsb2JhbFN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZGVzaWduLmNvbmZpZy5zdHlsZXMpXG4gICAgQGFkZEdyb3Vwcyhncm91cHMpXG4gICAgQGFkZFRlbXBsYXRlc05vdEluR3JvdXBzKClcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZXNwYWNlID09IEBuYW1lc3BhY2VcblxuXG4gIHN0b3JlVGVtcGxhdGVEZWZpbml0aW9uczogKHRlbXBsYXRlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9ucyA9IHt9XG4gICAgZm9yIHRlbXBsYXRlIGluIHRlbXBsYXRlc1xuICAgICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcblxuXG4gICMgcGFzcyB0aGUgdGVtcGxhdGUgYXMgb2JqZWN0XG4gICMgZS5nIGFkZCh7aWQ6IFwidGl0bGVcIiwgbmFtZTpcIlRpdGxlXCIsIGh0bWw6IFwiPGgxIGRvYy1lZGl0YWJsZT5UaXRsZTwvaDE+XCJ9KVxuICBhZGQ6ICh0ZW1wbGF0ZURlZmluaXRpb24sIHN0eWxlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZURlZmluaXRpb24uaWRdID0gdW5kZWZpbmVkXG4gICAgdGVtcGxhdGVPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbih0ZW1wbGF0ZURlZmluaXRpb24uc3R5bGVzKVxuICAgIHRlbXBsYXRlU3R5bGVzID0gJC5leHRlbmQoe30sIHN0eWxlcywgdGVtcGxhdGVPbmx5U3R5bGVzKVxuXG4gICAgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGVcbiAgICAgIG5hbWVzcGFjZTogQG5hbWVzcGFjZVxuICAgICAgaWQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5pZFxuICAgICAgdGl0bGU6IHRlbXBsYXRlRGVmaW5pdGlvbi50aXRsZVxuICAgICAgc3R5bGVzOiB0ZW1wbGF0ZVN0eWxlc1xuICAgICAgaHRtbDogdGVtcGxhdGVEZWZpbml0aW9uLmh0bWxcbiAgICAgIHdlaWdodDogdGVtcGxhdGVEZWZpbml0aW9uLnNvcnRPcmRlciB8fCAwXG5cbiAgICBAdGVtcGxhdGVzLnB1c2godGVtcGxhdGUpXG4gICAgdGVtcGxhdGVcblxuXG4gIGFkZEdyb3VwczogKGNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGdyb3VwTmFtZSwgZ3JvdXAgb2YgY29sbGVjdGlvblxuICAgICAgZ3JvdXBPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihncm91cC5zdHlsZXMpXG4gICAgICBncm91cFN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBAZ2xvYmFsU3R5bGVzLCBncm91cE9ubHlTdHlsZXMpXG5cbiAgICAgIHRlbXBsYXRlcyA9IHt9XG4gICAgICBmb3IgdGVtcGxhdGVJZCBpbiBncm91cC50ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGVEZWZpbml0aW9uID0gQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVJZF1cbiAgICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgICAgdGVtcGxhdGUgPSBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgZ3JvdXBTdHlsZXMpXG4gICAgICAgICAgdGVtcGxhdGVzW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cud2FybihcIlRoZSB0ZW1wbGF0ZSAnI3t0ZW1wbGF0ZUlkfScgcmVmZXJlbmNlZCBpbiB0aGUgZ3JvdXAgJyN7Z3JvdXBOYW1lfScgZG9lcyBub3QgZXhpc3QuXCIpXG5cbiAgICAgIEBhZGRHcm91cChncm91cE5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpXG5cblxuICBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwczogKGdsb2JhbFN0eWxlcykgLT5cbiAgICBmb3IgdGVtcGxhdGVJZCwgdGVtcGxhdGVEZWZpbml0aW9uIG9mIEB0ZW1wbGF0ZURlZmluaXRpb25zXG4gICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIEBnbG9iYWxTdHlsZXMpXG5cblxuICBhZGRHcm91cDogKG5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpIC0+XG4gICAgQGdyb3Vwc1tuYW1lXSA9XG4gICAgICB0aXRsZTogZ3JvdXAudGl0bGVcbiAgICAgIHRlbXBsYXRlczogdGVtcGxhdGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb246IChzdHlsZXMpIC0+XG4gICAgZGVzaWduU3R5bGVzID0ge31cbiAgICBpZiBzdHlsZXNcbiAgICAgIGZvciBzdHlsZURlZmluaXRpb24gaW4gc3R5bGVzXG4gICAgICAgIGRlc2lnblN0eWxlID0gQGNyZWF0ZURlc2lnblN0eWxlKHN0eWxlRGVmaW5pdGlvbilcbiAgICAgICAgZGVzaWduU3R5bGVzW2Rlc2lnblN0eWxlLm5hbWVdID0gZGVzaWduU3R5bGUgaWYgZGVzaWduU3R5bGVcblxuICAgIGRlc2lnblN0eWxlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGU6IChzdHlsZURlZmluaXRpb24pIC0+XG4gICAgaWYgc3R5bGVEZWZpbml0aW9uICYmIHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICBuZXcgRGVzaWduU3R5bGVcbiAgICAgICAgbmFtZTogc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgICAgdHlwZTogc3R5bGVEZWZpbml0aW9uLnR5cGVcbiAgICAgICAgb3B0aW9uczogc3R5bGVEZWZpbml0aW9uLm9wdGlvbnNcbiAgICAgICAgdmFsdWU6IHN0eWxlRGVmaW5pdGlvbi52YWx1ZVxuXG5cbiAgcmVtb3ZlOiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgQHRlbXBsYXRlcy5zcGxpY2UoQGdldEluZGV4KGlkKSwgMSlcblxuXG4gIGdldDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIHRlbXBsYXRlID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaW5kZXgpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICB0ZW1wbGF0ZSA9IHRcblxuICAgICAgdGVtcGxhdGVcblxuXG4gIGdldEluZGV4OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgaW5kZXggPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpKSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgaW5kZXggPSBpXG5cbiAgICAgIGluZGV4XG5cblxuICBjaGVja05hbWVzcGFjZTogKGlkZW50aWZpZXIsIGNhbGxiYWNrKSAtPlxuICAgIHsgbmFtZXNwYWNlLCBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgbm90IG5hbWVzcGFjZSBvciBAbmFtZXNwYWNlIGlzIG5hbWVzcGFjZSxcbiAgICAgIFwiZGVzaWduICN7IEBuYW1lc3BhY2UgfTogY2Fubm90IGdldCB0ZW1wbGF0ZSB3aXRoIGRpZmZlcmVudCBuYW1lc3BhY2UgI3sgbmFtZXNwYWNlIH0gXCJcblxuICAgIGNhbGxiYWNrKGlkKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciB0ZW1wbGF0ZSwgaW5kZXggaW4gQHRlbXBsYXRlc1xuICAgICAgY2FsbGJhY2sodGVtcGxhdGUsIGluZGV4KVxuXG5cbiAgIyBsaXN0IGF2YWlsYWJsZSBUZW1wbGF0ZXNcbiAgbGlzdDogLT5cbiAgICB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBlYWNoICh0ZW1wbGF0ZSkgLT5cbiAgICAgIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICB0ZW1wbGF0ZXNcblxuXG4gICMgcHJpbnQgZG9jdW1lbnRhdGlvbiBmb3IgYSB0ZW1wbGF0ZVxuICBpbmZvOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXQoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5wcmludERvYygpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlc2lnbnM6IHt9XG5cbiAgIyBDYW4gbG9hZCBhIGRlc2lnbiBzeW5jaHJvbm91c2x5IGlmIHlvdSBpbmNsdWRlIHRoZVxuICAjIGRlc2lnbi5qcyBmaWxlIGJlZm9yZSBsaXZpbmdkb2NzLlxuICAjIGRvYy5kZXNpZ24ubG9hZChkZXNpZ25zWyd5b3VyRGVzaWduJ10pXG4gICNcbiAgIyBXaWxsIGJlIGV4dGVuZGVkIHRvIGxvYWQgZGVzaWducyByZW1vdGVseSBmcm9tIGEgc2VydmVyOlxuICAjIExvYWQgZnJvbSB0aGUgZGVmYXVsdCBzb3VyY2U6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdnaGlibGknKVxuICAjXG4gICMgTG9hZCBmcm9tIGEgY3VzdG9tIHNlcnZlcjpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2h0dHA6Ly95b3Vyc2VydmVyLmlvL2Rlc2lnbnMvZ2hpYmxpL2Rlc2lnbi5qc29uJylcbiAgbG9hZDogKG5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIG5hbWUgPT0gJ3N0cmluZydcbiAgICAgIGFzc2VydCBmYWxzZSwgJ0xvYWQgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkIHlldC4nXG4gICAgZWxzZVxuICAgICAgZGVzaWduQ29uZmlnID0gbmFtZVxuICAgICAgZGVzaWduID0gbmV3IERlc2lnbihkZXNpZ25Db25maWcpXG4gICAgICBAYWRkKGRlc2lnbilcblxuXG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBuYW1lID0gZGVzaWduLm5hbWVzcGFjZVxuICAgIEBkZXNpZ25zW25hbWVdID0gZGVzaWduXG5cblxuICBoYXM6IChuYW1lKSAtPlxuICAgIEBkZXNpZ25zW25hbWVdP1xuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGhhcyhuYW1lKSwgXCJFcnJvcjogZGVzaWduICcjeyBuYW1lIH0nIGlzIG5vdCBsb2FkZWQuXCJcbiAgICBAZGVzaWduc1tuYW1lXVxuXG5cbiAgcmVzZXRDYWNoZTogLT5cbiAgICBAZGVzaWducyA9IHt9XG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduU3R5bGVcblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgc25pcHBldCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBEZXNpZ25TdHlsZSN2YWxpZGF0ZVZhbHVlKCkgZm9yIHR5cGUgI3sgQHR5cGUgfVwiXG5cblxuICBjb250YWluc09wdGlvbjogKHZhbHVlKSAtPlxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIHJldHVybiB0cnVlIGlmIHZhbHVlIGlzIG9wdGlvbi52YWx1ZVxuXG4gICAgZmFsc2VcblxuXG4gIG90aGVyT3B0aW9uczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcblxuXG4gIG90aGVyQ2xhc3NlczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uLnZhbHVlIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5QYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZy9yZW5kZXJlcicpXG5WaWV3ID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvdmlldycpXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERvY3VtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgc25pcHBldFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gc25pcHBldFRyZWUuZGVzaWduXG4gICAgQHNldFNuaXBwZXRUcmVlKHNuaXBwZXRUcmVlKVxuICAgIEB2aWV3cyA9IHt9XG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuXG5cbiAgc2V0U25pcHBldFRyZWU6IChzbmlwcGV0VHJlZSkgLT5cbiAgICBhc3NlcnQgc25pcHBldFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnU25pcHBldFRyZWUgbXVzdCBoYXZlIHRoZSBzYW1lIGRlc2lnbiBhcyB0aGUgZG9jdW1lbnQnXG5cbiAgICBAbW9kZWwgPSBAc25pcHBldFRyZWUgPSBzbmlwcGV0VHJlZVxuICAgIEBmb3J3YXJkU25pcHBldFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zLnJlYWRPbmx5ID89IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cblxuICAgIHZpZXcgPSBuZXcgVmlldyhAc25pcHBldFRyZWUsICRwYXJlbnRbMF0pXG4gICAgcHJvbWlzZSA9IHZpZXcuY3JlYXRlKG9wdGlvbnMpXG5cbiAgICBpZiB2aWV3LmlzSW50ZXJhY3RpdmVcbiAgICAgIEBzZXRJbnRlcmFjdGl2ZVZpZXcodmlldylcblxuICAgIHByb21pc2VcblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBEb2N1bWVudCBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIHRvSHRtbDogLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIHNwYWNlID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBTbmlwcGV0VHJlZS5cbiAgcHJpbnRNb2RlbDogKCkgLT5cbiAgICBAc25pcHBldFRyZWUucHJpbnQoKVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIFNuaXBwZXRUcmVlIGFuZCBMaXZpbmdkb2NzIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cbiAgc25pcHBldFJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc25pcHBldCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBzbmlwcGV0IHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICAjIFNuaXBwZXRzIGFyZSBtYXJrZWQgYnkgYSBjbGFzcyBhdCB0aGUgbW9tZW50LlxuICBmaW5kU25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHZpZXcgPSBAZ2V0U25pcHBldFZpZXcobm9kZSlcbiAgICAgICAgcmV0dXJuIHZpZXdcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZmluZE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIG5vZGVDb250ZXh0ID0gQGdldE5vZGVDb250ZXh0KG5vZGUpXG4gICAgICByZXR1cm4gbm9kZUNvbnRleHQgaWYgbm9kZUNvbnRleHRcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZ2V0Tm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIGZvciBkaXJlY3RpdmVUeXBlLCBvYmogb2YgY29uZmlnLmRpcmVjdGl2ZXNcbiAgICAgIGNvbnRpbnVlIGlmIG5vdCBvYmouZWxlbWVudERpcmVjdGl2ZVxuXG4gICAgICBkaXJlY3RpdmVBdHRyID0gb2JqLnJlbmRlcmVkQXR0clxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZXh0QXR0cjogZGlyZWN0aXZlQXR0clxuICAgICAgICAgIGF0dHJOYW1lOiBub2RlLmdldEF0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICAjIEZpbmQgdGhlIGNvbnRhaW5lciB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgZmluZENvbnRhaW5lcjogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBpZiBub3Qgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgICAgdmlldyA9IEBmaW5kU25pcHBldFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgc25pcHBldFZpZXc6IHZpZXdcbiAgICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICB7fVxuXG5cbiAgZ2V0SW1hZ2VOYW1lOiAobm9kZSkgLT5cbiAgICBpbWFnZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICByZXR1cm4gaW1hZ2VOYW1lXG5cblxuICBnZXRIdG1sRWxlbWVudE5hbWU6IChub2RlKSAtPlxuICAgIGh0bWxBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIGh0bWxFbGVtZW50TmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgcmV0dXJuIGh0bWxFbGVtZW50TmFtZVxuXG5cbiAgZ2V0RWRpdGFibGVOYW1lOiAobm9kZSkgLT5cbiAgICBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICByZXR1cm4gZWRpdGFibGVOYW1lXG5cblxuICBkcm9wVGFyZ2V0OiAobm9kZSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgIyBhYm92ZSBjb250YWluZXJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIHNuaXBwZXRcbiAgICAgIGVsc2UgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHJldHVybiBAZ2V0U25pcHBldFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRSb290VGFyZ2V0KG5vZGUpXG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuXG4gIGdldFNuaXBwZXRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdzbmlwcGV0J1xuICAgIHNuaXBwZXRWaWV3OiBAZ2V0U25pcHBldFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25TbmlwcGV0KGVsZW0sIHsgdG9wLCBsZWZ0IH0pXG5cblxuICBnZXRDbG9zZXN0U25pcHBldFRhcmdldDogKGNsb3Nlc3RTbmlwcGV0RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdFNuaXBwZXREYXRhLiRlbGVtWzBdXG4gICAgcG9zaXRpb24gPSBjbG9zZXN0U25pcHBldERhdGEucG9zaXRpb25cbiAgICBAZ2V0U25pcHBldFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRWaWV3OiBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuXG5cbiAgZ2V0Um9vdFRhcmdldDogKG5vZGUpIC0+XG4gICAgc25pcHBldFRyZWUgPSAkKG5vZGUpLmRhdGEoJ3NuaXBwZXRUcmVlJylcblxuICAgIHRhcmdldDogJ3Jvb3QnXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRUcmVlOiBzbmlwcGV0VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgc25pcHBldFxuICAjIGJhc2VkIG9uIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gIGdldFBvc2l0aW9uT25TbmlwcGV0OiAoZWxlbSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgIGlmIEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICdiZWZvcmUnXG4gICAgZWxzZVxuICAgICAgJ2FmdGVyJ1xuXG5cbiAgIyBHZXQgdGhlIGNsb3Nlc3Qgc25pcHBldCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0U25pcHBldDogKGNvbnRhaW5lciwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkc25pcHBldHMgPSAkKGNvbnRhaW5lcikuZmluZChcIi4jeyBjc3Muc25pcHBldCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RTbmlwcGV0ID0gdW5kZWZpbmVkXG5cbiAgICAkc25pcHBldHMuZWFjaCAoaW5kZXgsIGVsZW0pID0+XG4gICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbVRvcClcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYWZ0ZXInfVxuXG4gICAgY2xvc2VzdFNuaXBwZXRcblxuXG4gIGRpc3RhbmNlOiAoYSwgYikgLT5cbiAgICBpZiBhID4gYiB0aGVuIGEgLSBiIGVsc2UgYiAtIGFcblxuXG4gICMgZm9yY2UgYWxsIGNvbnRhaW5lcnMgb2YgYSBzbmlwcGV0IHRvIGJlIGFzIGhpZ2ggYXMgdGhleSBjYW4gYmVcbiAgIyBzZXRzIGNzcyBzdHlsZSBoZWlnaHRcbiAgbWF4aW1pemVDb250YWluZXJIZWlnaHQ6ICh2aWV3KSAtPlxuICAgIGlmIHZpZXcudGVtcGxhdGUuY29udGFpbmVyQ291bnQgPiAxXG4gICAgICBmb3IgbmFtZSwgZWxlbSBvZiB2aWV3LmNvbnRhaW5lcnNcbiAgICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICAgIGNvbnRpbnVlIGlmICRlbGVtLmhhc0NsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICAjIHJlbW92ZSBhbGwgY3NzIHN0eWxlIGhlaWdodCBkZWNsYXJhdGlvbnMgYWRkZWQgYnlcbiAgIyBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodCgpXG4gIHJlc3RvcmVDb250YWluZXJIZWlnaHQ6ICgpIC0+XG4gICAgJChcIi4jeyBjc3MubWF4aW1pemVkQ29udGFpbmVyIH1cIilcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLnJlbW92ZUNsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBTbmlwcGV0cyBzdG9yZSBhIHJlZmVyZW5jZSBvZiB0aGVtc2VsdmVzIGluIHRoZWlyIERvbSBub2RlXG4gICMgY29uc2lkZXI6IHN0b3JlIHJlZmVyZW5jZSBkaXJlY3RseSB3aXRob3V0IGpRdWVyeVxuICBnZXRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgJChub2RlKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gICMgR2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qgd2l0aCB0b3AgYW5kIGxlZnQgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50XG4gICMgKGlkZWFsIGZvciBhYnNvbHV0ZSBwb3NpdGlvbmVkIGVsZW1lbnRzKVxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogKG5vZGUpIC0+XG4gICAgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgeyBzY3JvbGxYLCBzY3JvbGxZIH0gPSBAZ2V0U2Nyb2xsUG9zaXRpb24od2luKVxuXG4gICAgIyB0cmFuc2xhdGUgaW50byBhYnNvbHV0ZSBwb3NpdGlvbnNcbiAgICBjb29yZHMgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgY29vcmRzID1cbiAgICAgIHRvcDogY29vcmRzLnRvcCArIHNjcm9sbFlcbiAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSArIHNjcm9sbFlcbiAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0ICsgc2Nyb2xsWFxuICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCArIHNjcm9sbFhcblxuICAgIGNvb3Jkcy5oZWlnaHQgPSBjb29yZHMuYm90dG9tIC0gY29vcmRzLnRvcFxuICAgIGNvb3Jkcy53aWR0aCA9IGNvb3Jkcy5yaWdodCAtIGNvb3Jkcy5sZWZ0XG5cbiAgICBjb29yZHNcblxuXG4gIGdldFNjcm9sbFBvc2l0aW9uOiAod2luKSAtPlxuICAgICMgY29kZSBmcm9tIG1kbjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy5zY3JvbGxYXG4gICAgc2Nyb2xsWDogaWYgKHdpbi5wYWdlWE9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VYT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdFxuICAgIHNjcm9sbFk6IGlmICh3aW4ucGFnZVlPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWU9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcFxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBEcmFnQmFzZVxuI1xuIyBTdXBwb3J0ZWQgZHJhZyBtb2RlczpcbiMgLSBEaXJlY3QgKHN0YXJ0IGltbWVkaWF0ZWx5KVxuIyAtIExvbmdwcmVzcyAoc3RhcnQgYWZ0ZXIgYSBkZWxheSBpZiB0aGUgY3Vyc29yIGRvZXMgbm90IG1vdmUgdG9vIG11Y2gpXG4jIC0gTW92ZSAoc3RhcnQgYWZ0ZXIgdGhlIGN1cnNvciBtb3ZlZCBhIG1pbnVtdW0gZGlzdGFuY2UpXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERyYWdCYXNlXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSwgb3B0aW9ucykgLT5cbiAgICBAbW9kZXMgPSBbJ2RpcmVjdCcsICdsb25ncHJlc3MnLCAnbW92ZSddXG5cbiAgICBkZWZhdWx0Q29uZmlnID1cbiAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuICAgICAgb25EcmFnU3RhcnQ6IHVuZGVmaW5lZFxuICAgICAgc2Nyb2xsQXJlYTogNTBcbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuICAgICAgbW92ZTpcbiAgICAgICAgZGlzdGFuY2U6IDBcblxuICAgIEBkZWZhdWx0Q29uZmlnID0gJC5leHRlbmQodHJ1ZSwgZGVmYXVsdENvbmZpZywgb3B0aW9ucylcblxuICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG5cblxuICBzZXRPcHRpb25zOiAob3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGVmYXVsdENvbmZpZywgb3B0aW9ucylcbiAgICBAbW9kZSA9IGlmIG9wdGlvbnMuZGlyZWN0P1xuICAgICAgJ2RpcmVjdCdcbiAgICBlbHNlIGlmIG9wdGlvbnMubG9uZ3ByZXNzP1xuICAgICAgJ2xvbmdwcmVzcydcbiAgICBlbHNlIGlmIG9wdGlvbnMubW92ZT9cbiAgICAgICdtb3ZlJ1xuICAgIGVsc2VcbiAgICAgICdsb25ncHJlc3MnXG5cblxuICBzZXREcmFnSGFuZGxlcjogKGRyYWdIYW5kbGVyKSAtPlxuICAgIEBkcmFnSGFuZGxlciA9IGRyYWdIYW5kbGVyXG4gICAgQGRyYWdIYW5kbGVyLnBhZ2UgPSBAcGFnZVxuXG5cbiAgIyBTdGFydCBhIHBvc3NpYmxlIGRyYWdcbiAgIyBUaGUgZHJhZyBpcyBvbmx5IHJlYWxseSBzdGFydGVkIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgdmlvbGF0ZWRcbiAgIyAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpLlxuICBpbml0OiAoZHJhZ0hhbmRsZXIsIGV2ZW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBzZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgQHNldERyYWdIYW5kbGVyKGRyYWdIYW5kbGVyKVxuICAgIEBzdGFydFBvaW50ID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG5cbiAgICBAYWRkU3RvcExpc3RlbmVycyhldmVudClcbiAgICBAYWRkTW92ZUxpc3RlbmVycyhldmVudClcblxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBAYWRkTG9uZ3ByZXNzSW5kaWNhdG9yKEBzdGFydFBvaW50KVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICAgICAgQHN0YXJ0KGV2ZW50KVxuICAgICAgICAsIEBvcHRpb25zLmxvbmdwcmVzcy5kZWxheVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ2RpcmVjdCdcbiAgICAgIEBzdGFydChldmVudClcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgbW92ZTogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KGV2ZW50KVxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBhZGRCbG9ja2VyKClcbiAgICBAcGFnZS4kYm9keS5hZGRDbGFzcyhjc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IC0+XG4gICAgQGRyYWdIYW5kbGVyLmRyb3AoKSBpZiBAc3RhcnRlZFxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cblxuICAgIGlmIEBpbml0aWFsaXplZFxuICAgICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgICBAZHJhZ0hhbmRsZXIucmVzZXQoKVxuICAgICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgICBpZiBAdGltZW91dD9cbiAgICAgICAgY2xlYXJUaW1lb3V0KEB0aW1lb3V0KVxuICAgICAgICBAdGltZW91dCA9IHVuZGVmaW5lZFxuXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcbiAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgQHJlbW92ZUJsb2NrZXIoKVxuXG5cbiAgYWRkQmxvY2tlcjogLT5cbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJhZ0Jsb2NrZXIgfSc+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGJsb2NrZXIpXG5cblxuICByZW1vdmVCbG9ja2VyOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIikucmVtb3ZlKClcblxuXG4gIGFkZExvbmdwcmVzc0luZGljYXRvcjogKHsgcGFnZVgsIHBhZ2VZIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAb3B0aW9ucy5sb25ncHJlc3Muc2hvd0luZGljYXRvclxuICAgICRpbmRpY2F0b3IgPSAkKFwiPGRpdiBjbGFzcz1cXFwiI3sgY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XFxcIj48ZGl2PjwvZGl2PjwvZGl2PlwiKVxuICAgICRpbmRpY2F0b3IuY3NzKGxlZnQ6IHBhZ2VYLCB0b3A6IHBhZ2VZKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkaW5kaWNhdG9yKVxuXG5cbiAgcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XCIpLnJlbW92ZSgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgaW5pdGlhbGl6ZWQgaW1tZWRpYXRlbHkgdG8gYWxsb3cgYSBsb25nLXByZXNzIGZpbmlzaFxuICBhZGRTdG9wTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgZXZlbnROYW1lcyA9XG4gICAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgICAndG91Y2hlbmQubGl2aW5nZG9jcy1kcmFnIHRvdWNoY2FuY2VsLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGxlYXZlLmxpdmluZ2RvY3MtZHJhZydcbiAgICAgIGVsc2VcbiAgICAgICAgJ21vdXNldXAubGl2aW5nZG9jcy1kcmFnJ1xuXG4gICAgQHBhZ2UuJGRvY3VtZW50Lm9uIGV2ZW50TmFtZXMsID0+XG4gICAgICBAZHJvcCgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIHNuaXBwZXREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIGVkaXRhYmxlLmpzIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBlZGl0YWJsZS5qcyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cbiAgICAjIEluaXRpYWxpemUgZWRpdGFibGUuanNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGUod2luZG93OiBAcGFnZS53aW5kb3cpO1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG4gICAgICAuY2hhbmdlKEB3aXRoQ29udGV4dChAY2hhbmdlKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggZWRpdGFibGUuanMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IGVkaXRhYmxlLmpzXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW1lbnQpIC0+XG4gICAgdmFsdWUgPSBAZWRpdGFibGUuZ2V0Q29udGVudChlbGVtZW50KVxuICAgIGlmIGNvbmZpZy5zaW5nbGVMaW5lQnJlYWsudGVzdCh2YWx1ZSkgfHwgdmFsdWUgPT0gJydcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkXG5cbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KVxuXG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBJbnNlcnQgYSBuZXcgYmxvY2suXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgYXQgdGhlIGVuZCBvZiBhIGJsb2NrXG4gICMgb3IgYnkgcHJlc3NpbmcgZGVsZXRlIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBibG9jay5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3ICYmIGRpcmVjdGlvbiA9PSAnYWZ0ZXInXG5cblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBNZXJnZSB0d28gYmxvY2tzLiBXb3JrcyBpbiB0d28gZGlyZWN0aW9ucy5cbiAgIyBFaXRoZXIgdGhlIGN1cnJlbnQgYmxvY2sgaXMgYmVpbmcgbWVyZ2VkIGludG8gdGhlIHByZWNlZWRpbmcgKCdiZWZvcmUnKVxuICAjIG9yIHRoZSBmb2xsb3dpbmcgKCdhZnRlcicpIGJsb2NrLlxuICAjIEFmdGVyIHRoZSBtZXJnZSB0aGUgY3VycmVudCBibG9jayBpcyByZW1vdmVkIGFuZCB0aGUgZm9jdXMgc2V0IHRvIHRoZVxuICAjIG90aGVyIGJsb2NrIHRoYXQgd2FzIG1lcmdlZCBpbnRvLlxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuICAgICAgICB2aWV3RWxlbSA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIG1lcmdlZFZpZXdFbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcblxuICAgICAgICAjIEdhdGhlciB0aGUgY29udGVudCB0aGF0IGlzIGdvaW5nIHRvIGJlIG1lcmdlZFxuICAgICAgICBjb250ZW50VG9NZXJnZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KHZpZXdFbGVtKVxuICAgICAgICBmcmFnID0gQHBhZ2UuZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICAgIGNvbnRlbnRzID0gJCgnPGRpdj4nKS5odG1sKGNvbnRlbnRUb01lcmdlKS5jb250ZW50cygpXG4gICAgICAgIGZvciBlbCBpbiBjb250ZW50c1xuICAgICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoZWwpXG5cbiAgICAgICAgY3Vyc29yID0gQGVkaXRhYmxlLmNyZWF0ZUN1cnNvcihtZXJnZWRWaWV3RWxlbSwgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2VuZCcgZWxzZSAnYmVnaW5uaW5nJylcbiAgICAgICAgY3Vyc29yWyBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnaW5zZXJ0QWZ0ZXInIGVsc2UgJ2luc2VydEJlZm9yZScgXShmcmFnKVxuXG4gICAgICAgIHZpZXcubW9kZWwucmVtb3ZlKClcbiAgICAgICAgY3Vyc29yLnNldFZpc2libGVTZWxlY3Rpb24oKVxuXG4gICAgICAgICMgQWZ0ZXIgZXZlcnl0aGluZyBpcyBkb25lIGFuZCB0aGUgZm9jdXMgaXMgc2V0IHVwZGF0ZSB0aGUgbW9kZWwgdG9cbiAgICAgICAgIyBtYWtlIHN1cmUgdGhlIG1vZGVsIGlzIHVwIHRvIGRhdGUgYW5kIGNoYW5nZXMgYXJlIG5vdGlmaWVkLlxuICAgICAgICBAdXBkYXRlTW9kZWwobWVyZ2VkVmlldywgZWRpdGFibGVOYW1lLCBtZXJnZWRWaWV3RWxlbSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBTcGxpdCBhIGJsb2NrIGluIHR3by5cbiAgIyBVc3VhbGx5IHRyaWdnZXJlZCBieSBwcmVzc2luZyBlbnRlciBpbiB0aGUgbWlkZGxlIG9mIGEgYmxvY2suXG4gIHNwbGl0OiAodmlldywgZWRpdGFibGVOYW1lLCBiZWZvcmUsIGFmdGVyLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgICMgZ2V0IGNvbnRlbnQgb3V0IG9mICdiZWZvcmUnIGFuZCAnYWZ0ZXInXG4gICAgICBiZWZvcmVDb250ZW50ID0gYmVmb3JlLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcbiAgICAgIGFmdGVyQ29udGVudCA9IGFmdGVyLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2Ygc25pcHBldFxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBhZnRlckNvbnRlbnQpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKS5mb2N1cygpXG5cbiAgICAgICMgc2V0IGNvbnRlbnQgb2YgdGhlIGJlZm9yZSBlbGVtZW50IChhZnRlciBmb2N1cyBpcyBzZXQgdG8gdGhlIGFmdGVyIGVsZW1lbnQpXG4gICAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIGJlZm9yZUNvbnRlbnQpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgT2NjdXJzIHdoZW5ldmVyIHRoZSB1c2VyIHNlbGVjdHMgb25lIG9yIG1vcmUgY2hhcmFjdGVycyBvciB3aGVuZXZlciB0aGVcbiAgIyBzZWxlY3Rpb24gaXMgY2hhbmdlZC5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICAjIEluc2VydCBhIG5ld2xpbmUgKFNoaWZ0ICsgRW50ZXIpXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGlmIGNvbmZpZy5lZGl0YWJsZS5hbGxvd05ld2xpbmVcbiAgICAgIHJldHVybiB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgZWxzZVxuICAgICByZXR1cm4gZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFRyaWdnZXJlZCB3aGVuZXZlciB0aGUgdXNlciBjaGFuZ2VzIHRoZSBjb250ZW50IG9mIGEgYmxvY2suXG4gICMgVGhlIGNoYW5nZSBldmVudCBkb2VzIG5vdCBhdXRvbWF0aWNhbGx5IGZpcmUgaWYgdGhlIGNvbnRlbnQgaGFzXG4gICMgYmVlbiBjaGFuZ2VkIHZpYSBqYXZhc2NyaXB0LlxuICBjaGFuZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG4gICAgcmV0dXJuIGlmIGNvbmZpZy5lZGl0YWJsZS5jaGFuZ2VUaW1lb3V0ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlVGltZW91dFxuXG5cbiAgY2xlYXJDaGFuZ2VUaW1lb3V0OiAtPlxuICAgIGlmIEBjaGFuZ2VUaW1lb3V0P1xuICAgICAgY2xlYXJUaW1lb3V0KEBjaGFuZ2VUaW1lb3V0KVxuICAgICAgQGNoYW5nZVRpbWVvdXQgPSB1bmRlZmluZWRcblxuXG4gIGhhc1NpbmdsZUVkaXRhYmxlOiAodmlldykgLT5cbiAgICB2aWV3LmRpcmVjdGl2ZXMubGVuZ3RoID09IDEgJiYgdmlldy5kaXJlY3RpdmVzWzBdLnR5cGUgPT0gJ2VkaXRhYmxlJ1xuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5cbiMgRG9jdW1lbnQgRm9jdXNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBzbmlwcGV0IG9yIGVkaXRhYmxlIHRoYXQgaXMgY3VycmVudGx5IGZvY3VzZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRm9jdXNcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG4gICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG5cbiAgICBAc25pcHBldEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0Qmx1ciA9ICQuQ2FsbGJhY2tzKClcblxuXG4gIHNldEZvY3VzOiAoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBlZGl0YWJsZU5vZGUgIT0gQGVkaXRhYmxlTm9kZVxuICAgICAgQHJlc2V0RWRpdGFibGUoKVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IGVkaXRhYmxlTm9kZVxuXG4gICAgaWYgc25pcHBldFZpZXcgIT0gQHNuaXBwZXRWaWV3XG4gICAgICBAcmVzZXRTbmlwcGV0VmlldygpXG4gICAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldFZpZXcgPSBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldEZvY3VzLmZpcmUoQHNuaXBwZXRWaWV3KVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlRm9jdXNlZDogKGVkaXRhYmxlTm9kZSwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSAhPSBlZGl0YWJsZU5vZGVcbiAgICAgIHNuaXBwZXRWaWV3IHx8PSBkb20uZmluZFNuaXBwZXRWaWV3KGVkaXRhYmxlTm9kZSlcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlQmx1cnJlZDogKGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlID09IGVkaXRhYmxlTm9kZVxuICAgICAgQHNldEZvY3VzKEBzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIHNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3ICE9IHNuaXBwZXRWaWV3XG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gIGJsdXI6IC0+XG4gICAgQHNldEZvY3VzKHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0RWRpdGFibGU6IC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRTbmlwcGV0VmlldzogLT5cbiAgICBpZiBAc25pcHBldFZpZXdcbiAgICAgIHByZXZpb3VzID0gQHNuaXBwZXRWaWV3XG4gICAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBzbmlwcGV0Qmx1ci5maXJlKHByZXZpb3VzKVxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmlzU3VwcG9ydGVkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldERyYWdcblxuICB3aWdnbGVTcGFjZSA9IDBcbiAgc3RhcnRBbmRFbmRPZmZzZXQgPSAwXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3IH0pIC0+XG4gICAgQCR2aWV3ID0gc25pcHBldFZpZXcuJGh0bWwgaWYgc25pcHBldFZpZXdcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIHN0YXJ0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuZGlzYWJsZUFsbCgpXG4gICAgQHBhZ2UuYmx1ckZvY3VzZWRFbGVtZW50KClcblxuICAgICMgcGxhY2Vob2xkZXIgYmVsb3cgY3Vyc29yXG4gICAgQCRwbGFjZWhvbGRlciA9IEBjcmVhdGVQbGFjZWhvbGRlcigpLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgQCRkcmFnQmxvY2tlciA9IEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIilcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBzbmlwcGV0XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5zbmlwcGV0Vmlldz8ubW9kZWwgIT0gQHNuaXBwZXRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgICMgICAkY29udGFpbmVyID0gdGFyZ2V0LnNuaXBwZXRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcbiAgICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG5cblxuICBzbmlwcGV0UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuc25pcHBldFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYWZ0ZXInXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKGJlZm9yZSwgdGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5zbmlwcGV0Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdiZWZvcmUnXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKHRhcmdldC5zbmlwcGV0VmlldywgbmV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5TbmlwcGV0czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBwYWRkaW5nVG9wID0gcGFyc2VJbnQoJChlbGVtKS5jc3MoJ3BhZGRpbmctdG9wJykpIHx8IDBcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0ICsgcGFkZGluZ1RvcFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdCb3R0b20gPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy1ib3R0b20nKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3guYm90dG9tIC0gc3RhcnRBbmRFbmRPZmZzZXQgLSBwYWRkaW5nQm90dG9tXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG4gICAgICBlbGVtID0gQHBhZ2UuZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCIjIENhbiByZXBsYWNlIHhtbGRvbSBpbiB0aGUgYnJvd3Nlci5cbiMgTW9yZSBhYm91dCB4bWxkb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qaW5kdy94bWxkb21cbiNcbiMgT24gbm9kZSB4bWxkb20gaXMgcmVxdWlyZWQuIEluIHRoZSBicm93c2VyXG4jIERPTVBhcnNlciBhbmQgWE1MU2VyaWFsaXplciBhcmUgYWxyZWFkeSBuYXRpdmUgb2JqZWN0cy5cblxuIyBET01QYXJzZXJcbmV4cG9ydHMuRE9NUGFyc2VyID0gY2xhc3MgRE9NUGFyc2VyU2hpbVxuXG4gIHBhcnNlRnJvbVN0cmluZzogKHhtbFRlbXBsYXRlKSAtPlxuICAgICMgbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyh4bWxUZW1wbGF0ZSkgZG9lcyBub3Qgd29yayB0aGUgc2FtZVxuICAgICMgaW4gdGhlIGJyb3dzZXIgYXMgd2l0aCB4bWxkb20uIFNvIHdlIHVzZSBqUXVlcnkgdG8gbWFrZSB0aGluZ3Mgd29yay5cbiAgICAkLnBhcnNlWE1MKHhtbFRlbXBsYXRlKVxuXG5cbiMgWE1MU2VyaWFsaXplclxuZXhwb3J0cy5YTUxTZXJpYWxpemVyID0gWE1MU2VyaWFsaXplclxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBzbmlwcGV0cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDBcblxuXG4gIGlzSW1nVGFnOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcblJlc3JjaXRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2VfbWFuYWdlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZWZhdWx0SW1hZ2VNYW5hZ2VyID0gbmV3IERlZmF1bHRJbWFnZU1hbmFnZXIoKVxuICByZXNyY2l0SW1hZ2VNYW5hZ2VyID0gbmV3IFJlc3JjaXRJbWFnZU1hbmFnZXIoKVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpIC0+XG4gICAgaW1hZ2VNYW5hZ2VyID0gQF9nZXRJbWFnZU1hbmFnZXIoaW1hZ2VTZXJ2aWNlKVxuICAgIGltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlKVxuXG5cbiAgX2dldEltYWdlTWFuYWdlcjogKGltYWdlU2VydmljZSkgLT5cbiAgICBzd2l0Y2ggaW1hZ2VTZXJ2aWNlXG4gICAgICB3aGVuICdyZXNyYy5pdCcgdGhlbiByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4gICAgICBlbHNlXG4gICAgICAgIGRlZmF1bHRJbWFnZU1hbmFnZXJcblxuXG4gIGdldERlZmF1bHRJbWFnZU1hbmFnZXI6IC0+XG4gICAgZGVmYXVsdEltYWdlTWFuYWdlclxuXG5cbiAgZ2V0UmVzcmNpdEltYWdlTWFuYWdlcjogLT5cbiAgICByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciB9KSAtPlxuICAgIGFzc2VydCBAc25pcHBldFRyZWUsICdubyBzbmlwcGV0IHRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAc25pcHBldFZpZXdzID0ge31cblxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgaWYgJGluc2VydC5sZW5ndGhcbiAgICAgICAgQCR3cmFwcGVyID0gQCRyb290XG4gICAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgICAgQCRyb290ID0gJGluc2VydFxuXG4gICAgIyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgc25pcHBldFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBzbmlwcGV0IHRyZWVcbiAgICBAJHJvb3QuZGF0YSgnc25pcHBldFRyZWUnLCBAc25pcHBldFRyZWUpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEBzZXRSb290KClcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnMoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIFNuaXBwZXQgVHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwU25pcHBldFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRBZGRlZC5hZGQoICQucHJveHkoQHNuaXBwZXRBZGRlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0UmVtb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRSZW1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRNb3ZlZC5hZGQoICQucHJveHkoQHNuaXBwZXRNb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBzbmlwcGV0QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBzbmlwcGV0SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cblxuICBzbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbClcblxuICAgIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc1NuaXBwZXRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRTbmlwcGV0VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdTbmlwcGV0IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlcjogU25pcHBldCBpcyBub3QgaW4gYSBzbmlwcGV0VHJlZScpXG5cbiAgICBzbmlwcGV0VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG4gICAgc25pcHBldFZpZXcuc2V0QXR0YWNoZWRUb0RvbSh0cnVlKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIuc25pcHBldFZpZXdXYXNJbnNlcnRlZChzbmlwcGV0VmlldylcbiAgICBAYXR0YWNoQ2hpbGRTbmlwcGV0cyhtb2RlbClcblxuXG4gIGlzU25pcHBldEF0dGFjaGVkOiAobW9kZWwpIC0+XG4gICAgbW9kZWwgJiYgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuaXNBdHRhY2hlZFRvRG9tXG5cblxuICBhdHRhY2hDaGlsZFNuaXBwZXRzOiAobW9kZWwpIC0+XG4gICAgbW9kZWwuY2hpbGRyZW4gKGNoaWxkTW9kZWwpID0+XG4gICAgICBpZiBub3QgQGlzU25pcHBldEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRTbmlwcGV0KGNoaWxkTW9kZWwpXG5cblxuICBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nOiAoc2libGluZywgbW9kZWwpIC0+XG4gICAgbWV0aG9kID0gaWYgc2libGluZyA9PSBtb2RlbC5wcmV2aW91cyB0aGVuICdhZnRlcicgZWxzZSAnYmVmb3JlJ1xuICAgIEAkbm9kZUZvclNuaXBwZXQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKSlcblxuXG4gIGFwcGVuZFNuaXBwZXRUb1BhcmVudENvbnRhaW5lcjogKG1vZGVsKSAtPlxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KGNvbnRhaW5lci5wYXJlbnRTbmlwcGV0KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuZGV0YWNoKClcblxuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc2NyaXRJbWFnZU1hbmFnZXIgZXh0ZW5kcyBEZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cbiAgQHJlc3JjaXRVcmw6ICdodHRwOi8vYXBwLnJlc3JjLml0LydcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgICMgZW1wdHlcblxuXG4gIHNldDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICByZXR1cm4gQHNldEJhc2U2NCgkZWxlbSwgdmFsdWUpIGlmIEBpc0Jhc2U2NCh2YWx1ZSlcblxuICAgIGFzc2VydCB2YWx1ZT8gJiYgdmFsdWUgIT0gJycsICdTcmMgdmFsdWUgZm9yIGFuIGltYWdlIGhhcyB0byBiZSBkZWZpbmVkJ1xuXG4gICAgJGVsZW0uYWRkQ2xhc3MoJ3Jlc3JjJylcbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICBAcmVzZXRTcmNBdHRyaWJ1dGUoJGVsZW0pIGlmICRlbGVtLmF0dHIoJ3NyYycpICYmIEBpc0Jhc2U2NCgkZWxlbS5hdHRyKCdzcmMnKSlcbiAgICAgICRlbGVtLmF0dHIoJ2RhdGEtc3JjJywgXCIje1Jlc2NyaXRJbWFnZU1hbmFnZXIucmVzcmNpdFVybH0je3ZhbHVlfVwiKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7UmVzY3JpdEltYWdlTWFuYWdlci5yZXNyY2l0VXJsfSN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICAjIFNldCBzcmMgZGlyZWN0bHksIGRvbid0IGFkZCByZXNyYyBjbGFzc1xuICBzZXRCYXNlNjQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gIHJlc2V0U3JjQXR0cmlidXRlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW0ucmVtb3ZlQXR0cignc3JjJylcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuYXR0ciA9IGNvbmZpZy5hdHRyXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5ldmVudGluZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZXZlbnRpbmcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vaW1hZ2VfbWFuYWdlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEAkZWxlbSA9IEAkaHRtbFxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdzbmlwcGV0JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNzcy5zbmlwcGV0KVxuICAgICAgICAuYXR0cihhdHRyLnRlbXBsYXRlLCBAdGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIEByZW5kZXIoKVxuXG5cbiAgcmVuZGVyOiAobW9kZSkgLT5cbiAgICBAdXBkYXRlQ29udGVudCgpXG4gICAgQHVwZGF0ZUh0bWwoKVxuXG5cbiAgdXBkYXRlQ29udGVudDogLT5cbiAgICBAY29udGVudChAbW9kZWwuY29udGVudCwgQG1vZGVsLnRlbXBvcmFyeUNvbnRlbnQpXG5cbiAgICBpZiBub3QgQGhhc0ZvY3VzKClcbiAgICAgIEBkaXNwbGF5T3B0aW9uYWxzKClcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIHVwZGF0ZUh0bWw6IC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIEBtb2RlbC5zdHlsZXNcbiAgICAgIEBzdHlsZShuYW1lLCB2YWx1ZSlcblxuICAgIEBzdHJpcEh0bWxJZlJlYWRPbmx5KClcblxuXG4gIGRpc3BsYXlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgICRlbGVtID0gJChkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgaWYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJGVsZW0uY3NzKCdkaXNwbGF5JywgJycpXG5cblxuICAjIFNob3cgYWxsIGRvYy1vcHRpb25hbHMgd2hldGhlciB0aGV5IGFyZSBlbXB0eSBvciBub3QuXG4gICMgVXNlIG9uIGZvY3VzLlxuICBzaG93T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuc2hvdygkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gICMgSGlkZSBhbGwgZW1wdHkgZG9jLW9wdGlvbmFsc1xuICAjIFVzZSBvbiBibHVyLlxuICBoaWRlRW1wdHlPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsICYmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICBjb25maWcuYW5pbWF0aW9ucy5vcHRpb25hbHMuaGlkZSgkKGRpcmVjdGl2ZS5lbGVtKSlcblxuXG4gIG5leHQ6IC0+XG4gICAgQCRodG1sLm5leHQoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIHByZXY6IC0+XG4gICAgQCRodG1sLnByZXYoKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gIGFmdGVyRm9jdXNlZDogKCkgLT5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAaGlkZUVtcHR5T3B0aW9uYWxzKClcblxuXG4gICMgQHBhcmFtIGN1cnNvcjogdW5kZWZpbmVkLCAnc3RhcnQnLCAnZW5kJ1xuICBmb2N1czogKGN1cnNvcikgLT5cbiAgICBmaXJzdCA9IEBkaXJlY3RpdmVzLmVkaXRhYmxlP1swXS5lbGVtXG4gICAgJChmaXJzdCkuZm9jdXMoKVxuXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgQCRodG1sLmhhc0NsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEAkaHRtbFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEAkaHRtbFswXSlcblxuXG4gIGNvbnRlbnQ6IChjb250ZW50LCBzZXNzaW9uQ29udGVudCkgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgY29udGVudFxuICAgICAgaWYgc2Vzc2lvbkNvbnRlbnRbbmFtZV0/XG4gICAgICAgIEBzZXQobmFtZSwgc2Vzc2lvbkNvbnRlbnRbbmFtZV0pXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXQobmFtZSwgdmFsdWUpXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBzZXRFZGl0YWJsZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBzZXRJbWFnZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQHNldEh0bWwobmFtZSwgdmFsdWUpXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQGdldEVkaXRhYmxlKG5hbWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAZ2V0SW1hZ2UobmFtZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGdldEh0bWwobmFtZSlcblxuXG4gIGdldEVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRFZGl0YWJsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBpZiBAaGFzRm9jdXMoKVxuXG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLnRvZ2dsZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyLCBCb29sZWFuKHZhbHVlKSlcbiAgICAkZWxlbS5hdHRyKGF0dHIucGxhY2Vob2xkZXIsIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcblxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylbbmFtZV0gaWYgQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpXG4gICAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAc25pcHBldFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgaG9zdFdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3dcbiAgICAgIGRlc2lnbjogQHNuaXBwZXRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG4gICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSB9PXt9KSAtPlxuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuICAgIEAkZG9jdW1lbnRcbiAgICAgIC5vbignbW91c2Vkb3duLmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCd0b3VjaHN0YXJ0LmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCdkcmFnc3RhcnQnLCAkLnByb3h5KEBicm93c2VyRHJhZ1N0YXJ0LCB0aGlzKSlcblxuXG4gIGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5OiAtPlxuICAgIGlmIGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZT9cbiAgICAgIEBjc3NMb2FkZXIubG9hZChjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGUsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICAjIHByZXZlbnQgdGhlIGJyb3dzZXIgRHJhZyZEcm9wIGZyb20gaW50ZXJmZXJpbmdcbiAgYnJvd3NlckRyYWdTdGFydDogKGV2ZW50KSAtPlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG5cbiAgcmVtb3ZlTGlzdGVuZXJzOiAtPlxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcycpXG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuXG5cbiAgbW91c2Vkb3duOiAoZXZlbnQpIC0+XG4gICAgcmV0dXJuIGlmIGV2ZW50LndoaWNoICE9IExFRlRfTU9VU0VfQlVUVE9OICYmIGV2ZW50LnR5cGUgPT0gJ21vdXNlZG93bicgIyBvbmx5IHJlc3BvbmQgdG8gbGVmdCBtb3VzZSBidXR0b25cblxuICAgICMgSWdub3JlIGludGVyYWN0aW9ucyBvbiBjZXJ0YWluIGVsZW1lbnRzXG4gICAgaXNDb250cm9sID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoY29uZmlnLmlnbm9yZUludGVyYWN0aW9uKS5sZW5ndGhcbiAgICByZXR1cm4gaWYgaXNDb250cm9sXG5cbiAgICAjIElkZW50aWZ5IHRoZSBjbGlja2VkIHNuaXBwZXRcbiAgICBzbmlwcGV0VmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZXZlbnQudGFyZ2V0KVxuXG4gICAgIyBUaGlzIGlzIGNhbGxlZCBpbiBtb3VzZWRvd24gc2luY2UgZWRpdGFibGVzIGdldCBmb2N1cyBvbiBtb3VzZWRvd25cbiAgICAjIGFuZCBvbmx5IGJlZm9yZSB0aGUgZWRpdGFibGVzIGNsZWFyIHRoZWlyIHBsYWNlaG9sZGVyIGNhbiB3ZSBzYWZlbHlcbiAgICAjIGlkZW50aWZ5IHdoZXJlIHRoZSB1c2VyIGhhcyBjbGlja2VkLlxuICAgIEBoYW5kbGVDbGlja2VkU25pcHBldChldmVudCwgc25pcHBldFZpZXcpXG5cbiAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgQHN0YXJ0RHJhZ1xuICAgICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcbiAgICAgICAgZXZlbnQ6IGV2ZW50XG5cblxuICBzdGFydERyYWc6ICh7IHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHNuaXBwZXRNb2RlbCB8fCBzbmlwcGV0Vmlld1xuICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRWaWV3Lm1vZGVsIGlmIHNuaXBwZXRWaWV3XG5cbiAgICBzbmlwcGV0RHJhZyA9IG5ldyBTbmlwcGV0RHJhZ1xuICAgICAgc25pcHBldE1vZGVsOiBzbmlwcGV0TW9kZWxcbiAgICAgIHNuaXBwZXRWaWV3OiBzbmlwcGV0Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KHNuaXBwZXREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgaGFuZGxlQ2xpY2tlZFNuaXBwZXQ6IChldmVudCwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXNlZChzbmlwcGV0VmlldylcblxuICAgICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIHNldFJlbmRlck5vZGU6IChyZW5kZXJOb2RlKSAtPlxuICAgIHJlbmRlck5vZGUgPz0gJChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiLCBAJGJvZHkpXG4gICAgaWYgcmVuZGVyTm9kZS5qcXVlcnlcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVswXVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgaWYgQGRlc2lnbj8gJiYgY29uZmlnLmxvYWRSZXNvdXJjZXNcbiAgICAgIGRlc2lnblBhdGggPSBcIiN7IGNvbmZpZy5kZXNpZ25QYXRoIH0vI3sgQGRlc2lnbi5uYW1lc3BhY2UgfVwiXG4gICAgICBjc3NMb2NhdGlvbiA9IGlmIEBkZXNpZ24uY3NzP1xuICAgICAgICBAZGVzaWduLmNzc1xuICAgICAgZWxzZVxuICAgICAgICAnL2Nzcy9zdHlsZS5jc3MnXG5cbiAgICAgIHBhdGggPSBcIiN7IGRlc2lnblBhdGggfSN7IGNzc0xvY2F0aW9uIH1cIlxuICAgICAgQGNzc0xvYWRlci5sb2FkKHBhdGgsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICBzZXRXaW5kb3c6IChob3N0V2luZG93KSAtPlxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93IHx8IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxuIyBBIFJlbmRlcmluZ0NvbnRhaW5lciBpcyB1c2VkIGJ5IHRoZSBSZW5kZXJlciB0byBnZW5lcmF0ZSBIVE1MLlxuI1xuIyBUaGUgUmVuZGVyZXIgaW5zZXJ0cyBTbmlwcGV0Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPSAkKCc8ZGl2Lz4nKVswXVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEBiZWZvcmVSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGh0bWw6IC0+XG4gICAgJChAcmVuZGVyTm9kZSkuaHRtbCgpXG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3Igc25pcHBldHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIFNuaXBwZXRBcnJheSB0aGF0IHdvcmtzIHNpbWlsYXIgdG8gYSBqUXVlcnkgb2JqZWN0LlxuIyBGb3IgZXh0ZW5zaWJpbGl0eSB2aWEgcGx1Z2lucyB3ZSBleHBvc2UgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0QXJyYXlcblxuXG4gICMgQHBhcmFtIHNuaXBwZXRzOiBhcnJheSBvZiBzbmlwcGV0c1xuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0cykgLT5cbiAgICBAc25pcHBldHMgPSBbXSB1bmxlc3MgQHNuaXBwZXRzP1xuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAc25pcHBldHNcbiAgICAgIEBbaW5kZXhdID0gcmVzdWx0XG5cbiAgICBAbGVuZ3RoID0gQHNuaXBwZXRzLmxlbmd0aFxuICAgIGlmIEBzbmlwcGV0cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAc25pcHBldHMubGVuZ3RoIC0gMV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3Igc25pcHBldCBpbiBAc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICByZW1vdmU6ICgpIC0+XG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBTbmlwcGV0Q29udGFpbmVyXG4jIC0tLS0tLS0tLS0tLS0tLS1cbiMgQSBTbmlwcGV0Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2Ygc25pcHBldHMuXG4jXG4jIFRoZSBzbmlwcGV0Q29udGFpbmVyIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIGl0cyBzbmlwcGV0VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgcGFyZW50U25pcHBldDogcGFyZW50IFNuaXBwZXRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Q29udGFpbmVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQHBhcmVudFNuaXBwZXQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBwYXJlbnRTbmlwcGV0XG4gICAgICBhc3NlcnQgc25pcHBldCBpc250IEBwYXJlbnRTbmlwcGV0LCAnY2Fubm90IGFwcGVuZCBzbmlwcGV0IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5wcmV2aW91cyA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIG5leHQ6IHNuaXBwZXRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5uZXh0ID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0XG4gICAgICBuZXh0OiBzbmlwcGV0Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICB1cDogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIEBpbnNlcnRCZWZvcmUoc25pcHBldC5wcmV2aW91cywgc25pcHBldClcblxuXG4gIGRvd246IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihzbmlwcGV0Lm5leHQsIHNuaXBwZXQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWUgfHwgQHBhcmVudFNuaXBwZXQ/LnNuaXBwZXRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldCA9IEBmaXJzdFxuICAgIHdoaWxlIChzbmlwcGV0KVxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHMgYW5kIGNvbnRhaW5lcnNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldC5kZXN0cm95KClcbiAgICBAX2RldGFjaFNuaXBwZXQoc25pcHBldClcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgRXZlcnkgc25pcHBldCBhZGRlZCBvciBtb3ZlZCBtb3N0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQGFwaSBwcml2YXRlXG4gIGF0dGFjaFNuaXBwZXQ6IChzbmlwcGV0LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoc25pcHBldCwgcG9zaXRpb24pXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5hdHRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IHNuaXBwZXQgdGhhdCBpcyByZW1vdmVkIG11c3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBTbmlwcGV0cyB0aGF0IGFyZSBtb3ZlZCBpbnNpZGUgYSBzbmlwcGV0VHJlZSBzaG91bGQgbm90XG4gICMgY2FsbCBfZGV0YWNoU25pcHBldCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBTbmlwcGV0UmVtb3ZlZCBldmVudHMgb24gdGhlIHNuaXBwZXQgdHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaFNuaXBwZXQ6IChzbmlwcGV0KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQHVubGluayhzbmlwcGV0KVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuZGV0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgbGluazogKHNuaXBwZXQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoc25pcHBldCkgaWYgc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIHBvc2l0aW9uLnBhcmVudENvbnRhaW5lciB8fD0gdGhpc1xuICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwgcG9zaXRpb24pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICB1bmxpbms6IChzbmlwcGV0KSAtPlxuICAgIGNvbnRhaW5lciA9IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gc25pcHBldC5uZXh0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgY29udGFpbmVyLmxhc3QgPSBzbmlwcGV0LnByZXZpb3VzIHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cbiAgICAgICMgdXBkYXRlIHByZXZpb3VzIGFuZCBuZXh0IG5vZGVzXG4gICAgICBzbmlwcGV0Lm5leHQ/LnByZXZpb3VzID0gc25pcHBldC5wcmV2aW91c1xuICAgICAgc25pcHBldC5wcmV2aW91cz8ubmV4dCA9IHNuaXBwZXQubmV4dFxuXG4gICAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHt9KVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgc2V0U25pcHBldFBvc2l0aW9uOiAoc25pcHBldCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgc25pcHBldC5wYXJlbnRDb250YWluZXIgPSBwYXJlbnRDb250YWluZXJcbiAgICBzbmlwcGV0LnByZXZpb3VzID0gcHJldmlvdXNcbiAgICBzbmlwcGV0Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBzbmlwcGV0IGlmIHByZXZpb3VzXG4gICAgICBuZXh0LnByZXZpb3VzID0gc25pcHBldCBpZiBuZXh0XG4gICAgICBwYXJlbnRDb250YWluZXIuZmlyc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgcGFyZW50Q29udGFpbmVyLmxhc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblNuaXBwZXRDb250YWluZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfY29udGFpbmVyJylcbmd1aWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2d1aWQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgU25pcHBldE1vZGVsXG4jIC0tLS0tLS0tLS0tLVxuIyBFYWNoIFNuaXBwZXRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBzbmlwcGV0Vmlld1xuIyBmcm9tIGEgc25pcHBldE1vZGVsXG4jXG4jIFJlcHJlc2VudHMgYSBub2RlIGluIGEgU25pcHBldFRyZWUuXG4jIEV2ZXJ5IFNuaXBwZXRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoU25pcHBldENvbnRhaW5lciksXG4jIHNpYmxpbmdzIChvdGhlciBzbmlwcGV0cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKFNuaXBwZXRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBTbmlwcGV0TW9kZWxzLlxuIyBFLmcuIGEgZ3JpZCByb3cgd291bGQgaGF2ZSBhcyBtYW55IGNvbnRhaW5lcnMgYXMgaXQgaGFzXG4jIGNvbHVtbnNcbiNcbiMgIyBAcHJvcCBwYXJlbnRDb250YWluZXI6IHBhcmVudCBTbmlwcGV0Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIHNuaXBwZXQgd2l0aG91dCB0ZW1wbGF0ZSByZWZlcmVuY2UnXG5cbiAgICBAaW5pdGlhbGl6ZURpcmVjdGl2ZXMoKVxuICAgIEBzdHlsZXMgPSB7fVxuICAgIEBkYXRhVmFsdWVzID0ge31cbiAgICBAdGVtcG9yYXJ5Q29udGVudCA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAaWRlbnRpZmllciA9IEB0ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAc25pcHBldFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gQHRlbXBsYXRlLmRpcmVjdGl2ZXNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICAgICAgQGNvbnRhaW5lcnNbZGlyZWN0aXZlLm5hbWVdID0gbmV3IFNuaXBwZXRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRTbmlwcGV0OiB0aGlzXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIFNuaXBwZXRNb2RlbFwiXG5cblxuICBjcmVhdGVWaWV3OiAoaXNSZWFkT25seSkgLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlVmlldyh0aGlzLCBpc1JlYWRPbmx5KVxuXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICBiZWZvcmU6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQHByZXZpb3VzXG5cblxuICBhZnRlcjogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QWZ0ZXIodGhpcywgc25pcHBldE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBuZXh0XG5cblxuICBhcHBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5hcHBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHByZXBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICByZXNldFZvbGF0aWxlVmFsdWU6IChuYW1lLCB0cmlnZ2VyQ2hhbmdlRXZlbnQ9dHJ1ZSkgLT5cbiAgICBkZWxldGUgQHRlbXBvcmFyeUNvbnRlbnRbbmFtZV1cbiAgICBpZiB0cmlnZ2VyQ2hhbmdlRXZlbnRcbiAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSwgZmxhZz0nJykgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGlmIGZsYWcgPT0gJ3RlbXBvcmFyeU92ZXJyaWRlJ1xuICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IEB0ZW1wb3JhcnlDb250ZW50XG4gICAgZWxzZVxuICAgICAgQHJlc2V0Vm9sYXRpbGVWYWx1ZShuYW1lLCBmYWxzZSkgIyBhcyBzb29uIGFzIHdlIGdldCByZWFsIGNvbnRlbnQsIHJlc2V0IHRoZSB0ZW1wb3JhcnlDb250ZW50XG4gICAgICBzdG9yYWdlQ29udGFpbmVyID0gQGNvbnRlbnRcblxuICAgIGlmIHN0b3JhZ2VDb250YWluZXJbbmFtZV0gIT0gdmFsdWVcbiAgICAgIHN0b3JhZ2VDb250YWluZXJbbmFtZV0gPSB2YWx1ZVxuICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwiZ2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBAY29udGVudFtuYW1lXVxuXG5cbiAgIyBjYW4gYmUgY2FsbGVkIHdpdGggYSBzdHJpbmcgb3IgYSBoYXNoXG4gIGRhdGE6IChhcmcpIC0+XG4gICAgaWYgdHlwZW9mKGFyZykgPT0gJ29iamVjdCdcbiAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgYXJnXG4gICAgICAgIGlmIEBjaGFuZ2VEYXRhKG5hbWUsIHZhbHVlKVxuICAgICAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcy5wdXNoKG5hbWUpXG4gICAgICBpZiBAc25pcHBldFRyZWUgJiYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQHNuaXBwZXRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGRlZXBFcXVhbChAZGF0YVZhbHVlc1tuYW1lXSwgdmFsdWUpID09IGZhbHNlXG4gICAgICBAZGF0YVZhbHVlc1tuYW1lXSA9IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuXG4gIGlzRW1wdHk6IChuYW1lKSAtPlxuICAgIHZhbHVlID0gQGdldChuYW1lKVxuICAgIHZhbHVlID09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PSAnJ1xuXG5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIEBzdHlsZXNbbmFtZV1cbiAgICBlbHNlXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHN0eWxlID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXVxuICAgIGlmIG5vdCBzdHlsZVxuICAgICAgbG9nLndhcm4gXCJVbmtub3duIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBzbmlwcGV0VHJlZVxuICAgICAgICAgIEBzbmlwcGV0VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIlNuaXBwZXRNb2RlbCNjb3B5KCkgaXMgbm90IGltcGxlbWVudGVkIHlldC5cIilcblxuICAgICMgc2VyaWFsaXppbmcvZGVzZXJpYWxpemluZyBzaG91bGQgd29yayBidXQgbmVlZHMgdG8gZ2V0IHNvbWUgdGVzdHMgZmlyc3RcbiAgICAjIGpzb24gPSBAdG9Kc29uKClcbiAgICAjIGpzb24uaWQgPSBndWlkLm5leHQoKVxuICAgICMgU25pcHBldE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgbW92ZSB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIG1vdmUgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIHJlbW92ZSBUcmVlTm9kZSBmcm9tIGl0cyBjb250YWluZXIgYW5kIFNuaXBwZXRUcmVlXG4gIHJlbW92ZTogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnJlbW92ZSh0aGlzKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgZGVzdHJveTogLT5cbiAgICAjIHRvZG86IG1vdmUgaW50byB0byByZW5kZXJlclxuXG4gICAgIyByZW1vdmUgdXNlciBpbnRlcmZhY2UgZWxlbWVudHNcbiAgICBAdWlJbmplY3Rvci5yZW1vdmUoKSBpZiBAdWlJbmplY3RvclxuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRTbmlwcGV0XG5cblxuICB1aTogLT5cbiAgICBpZiBub3QgQHVpSW5qZWN0b3JcbiAgICAgIEBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIEl0ZXJhdG9yc1xuICAjIC0tLS0tLS0tLVxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0TW9kZWwgPSB0aGlzXG4gICAgd2hpbGUgKHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcblxuXG4gIGNoaWxkcmVuOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsLmRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHNBbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZGVzY2VuZGFudHMoY2FsbGJhY2spXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIChpbmNsdWRpbmcgdGhvc2Ugb2YgdGhpcyBzbmlwcGV0TW9kZWwpXG4gIGRlc2NlbmRhbnRDb250YWluZXJzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbERlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSA9PlxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKSBpZiBzbmlwcGV0TW9kZWwgIT0gdGhpc1xuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIGNoaWxkcmVuQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGNoaWxkcmVuKGNhbGxiYWNrKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHRvSnNvbjogLT5cblxuICAgIGpzb24gPVxuICAgICAgaWQ6IEBpZFxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBjb250ZW50KVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAc3R5bGVzKVxuICAgICAganNvbi5zdHlsZXMgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBzdHlsZXMpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBkYXRhVmFsdWVzKVxuICAgICAganNvbi5kYXRhID0gJC5leHRlbmQodHJ1ZSwge30sIEBkYXRhVmFsdWVzKVxuXG4gICAgIyBjcmVhdGUgYW4gYXJyYXkgZm9yIGV2ZXJ5IGNvbnRhaW5lclxuICAgIGZvciBuYW1lIG9mIEBjb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cblNuaXBwZXRNb2RlbC5mcm9tSnNvbiA9IChqc29uLCBkZXNpZ24pIC0+XG4gIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmlkZW50aWZpZXIpXG5cbiAgYXNzZXJ0IHRlbXBsYXRlLFxuICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgbW9kZWwgPSBuZXcgU25pcHBldE1vZGVsKHsgdGVtcGxhdGUsIGlkOiBqc29uLmlkIH0pXG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGpzb24uY29udGVudFxuICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGVudCAnI3sgbmFtZSB9J1wiXG4gICAgbW9kZWwuY29udGVudFtuYW1lXSA9IHZhbHVlXG5cbiAgZm9yIHN0eWxlTmFtZSwgdmFsdWUgb2YganNvbi5zdHlsZXNcbiAgICBtb2RlbC5zdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gIG1vZGVsLmRhdGEoanNvbi5kYXRhKSBpZiBqc29uLmRhdGFcblxuICBmb3IgY29udGFpbmVyTmFtZSwgc25pcHBldEFycmF5IG9mIGpzb24uY29udGFpbmVyc1xuICAgIGFzc2VydCBtb2RlbC5jb250YWluZXJzLmhhc093blByb3BlcnR5KGNvbnRhaW5lck5hbWUpLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICBpZiBzbmlwcGV0QXJyYXlcbiAgICAgIGFzc2VydCAkLmlzQXJyYXkoc25pcHBldEFycmF5KSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgIGZvciBjaGlsZCBpbiBzbmlwcGV0QXJyYXlcbiAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBTbmlwcGV0TW9kZWwuZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gIG1vZGVsXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblNuaXBwZXRDb250YWluZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfY29udGFpbmVyJylcblNuaXBwZXRBcnJheSA9IHJlcXVpcmUoJy4vc25pcHBldF9hcnJheScpXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWwnKVxuXG4jIFNuaXBwZXRUcmVlXG4jIC0tLS0tLS0tLS0tXG4jIExpdmluZ2RvY3MgZXF1aXZhbGVudCB0byB0aGUgRE9NIHRyZWUuXG4jIEEgc25pcHBldCB0cmVlIGNvbnRhaW5lcyBhbGwgdGhlIHNuaXBwZXRzIG9mIGEgcGFnZSBpbiBoaWVyYXJjaGljYWwgb3JkZXIuXG4jXG4jIFRoZSByb290IG9mIHRoZSBTbmlwcGV0VHJlZSBpcyBhIFNuaXBwZXRDb250YWluZXIuIEEgU25pcHBldENvbnRhaW5lclxuIyBjb250YWlucyBhIGxpc3Qgb2Ygc25pcHBldHMuXG4jXG4jIHNuaXBwZXRzIGNhbiBoYXZlIG11bHRpYmxlIFNuaXBwZXRDb250YWluZXJzIHRoZW1zZWx2ZXMuXG4jXG4jICMjIyBFeGFtcGxlOlxuIyAgICAgLSBTbmlwcGV0Q29udGFpbmVyIChyb290KVxuIyAgICAgICAtIFNuaXBwZXQgJ0hlcm8nXG4jICAgICAgIC0gU25pcHBldCAnMiBDb2x1bW5zJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnbWFpbidcbiMgICAgICAgICAgIC0gU25pcHBldCAnVGl0bGUnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdzaWRlYmFyJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdJbmZvLUJveCcnXG4jXG4jICMjIyBFdmVudHM6XG4jIFRoZSBmaXJzdCBzZXQgb2YgU25pcHBldFRyZWUgRXZlbnRzIGFyZSBjb25jZXJuZWQgd2l0aCBsYXlvdXQgY2hhbmdlcyBsaWtlXG4jIGFkZGluZywgcmVtb3Zpbmcgb3IgbW92aW5nIHNuaXBwZXRzLlxuI1xuIyBDb25zaWRlcjogSGF2ZSBhIGRvY3VtZW50RnJhZ21lbnQgYXMgdGhlIHJvb3ROb2RlIGlmIG5vIHJvb3ROb2RlIGlzIGdpdmVuXG4jIG1heWJlIHRoaXMgd291bGQgaGVscCBzaW1wbGlmeSBzb21lIGNvZGUgKHNpbmNlIHNuaXBwZXRzIGFyZSBhbHdheXNcbiMgYXR0YWNoZWQgdG8gdGhlIERPTSkuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRUcmVlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgY29udGVudCwgQGRlc2lnbiB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCBcIkVycm9yIGluc3RhbnRpYXRpbmcgU25pcHBldFRyZWU6IGRlc2lnbiBwYXJhbSBpcyBtaXNzc2luZy5cIlxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgc25pcHBldCB0cmVlIHRvIHRoZSByb290XG4gICAgIyBvdGhlcndpc2UgYWxsIHRoZSBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQgd2hpbGUgYnVpbGRpbmcgdGhlIHRyZWVcbiAgICBAZnJvbUpzb24oY29udGVudCwgQGRlc2lnbikgaWYgY29udGVudD9cblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgc25pcHBldCBhdCB0aGUgYmVnaW5uaW5nLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QucHJlcGVuZChzbmlwcGV0KSBpZiBzbmlwcGV0P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IHNuaXBwZXQgYXQgdGhlIGVuZC5cbiAgIyBAcGFyYW06IHNuaXBwZXRNb2RlbCBpbnN0YW5jZSBvciBzbmlwcGV0IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0U25pcHBldDogKHNuaXBwZXROYW1lKSAtPlxuICAgIGlmIHR5cGVvZiBzbmlwcGV0TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZU1vZGVsKHNuaXBwZXROYW1lKVxuICAgIGVsc2VcbiAgICAgIHNuaXBwZXROYW1lXG5cblxuICBjcmVhdGVNb2RlbDogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBjcmVhdGVTbmlwcGV0OiAtPlxuICAgIEBjcmVhdGVNb2RlbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICBnZXRUZW1wbGF0ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChpZGVudGlmaWVyKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBpZGVudGlmaWVyIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBzbmlwcGV0QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRSZW1vdmVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBzbmlwcGV0Q29udGVudENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRIdG1sQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldERhdGFDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cblxuICAjIFRyYXZlcnNlIHRoZSB3aG9sZSBzbmlwcGV0IHRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3Qgc25pcHBldFxuICBmaXJzdDogLT5cbiAgICBAcm9vdC5maXJzdFxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuYWxsKGNhbGxiYWNrKVxuXG5cbiAgZmluZDogKHNlYXJjaCkgLT5cbiAgICBpZiB0eXBlb2Ygc2VhcmNoID09ICdzdHJpbmcnXG4gICAgICByZXMgPSBbXVxuICAgICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICAgIGlmIHNuaXBwZXQuaWRlbnRpZmllciA9PSBzZWFyY2ggfHwgc25pcHBldC50ZW1wbGF0ZS5pZCA9PSBzZWFyY2hcbiAgICAgICAgICByZXMucHVzaChzbmlwcGV0KVxuXG4gICAgICBuZXcgU25pcHBldEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgU25pcHBldEFycmF5KClcblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgb2xkUm9vdCA9IEByb290XG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKHNuaXBwZXQsIHBhcmVudHMpIC0+XG4gICMgICBwYXJlbnRzIHx8PSBbXVxuXG4gICMgICAjIHRyYXZlcnNlXG4gICMgICBwYXJlbnRzID0gcGFyZW50cy5wdXNoKHNuaXBwZXQpXG4gICMgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgIyAgICAgc25pcHBldCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoc25pcHBldClcbiAgIyAgICAgICBAZWFjaFdpdGhQYXJlbnRzKHNuaXBwZXQsIHBhcmVudHMpXG4gICMgICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG4gICMgICBwYXJlbnRzLnNwbGljZSgtMSlcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnU25pcHBldFRyZWVcXG4tLS0tLS0tLS0tLVxcbidcblxuICAgIGFkZExpbmUgPSAodGV4dCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgb3V0cHV0ICs9IFwiI3sgQXJyYXkoaW5kZW50YXRpb24gKyAxKS5qb2luKFwiIFwiKSB9I3sgdGV4dCB9XFxuXCJcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IHNuaXBwZXQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLnRpdGxlIH0gKCN7IHRlbXBsYXRlLmlkZW50aWZpZXIgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgaW5kZW50YXRpb24pIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBzbmlwcGV0c1xuICAjIFRoZXNlIGZ1bmN0aW9ucyBzaG91bGQgb25seSBiZSBjYWxsZWQgYnkgc25pcHBldENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgYXR0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZSA9PSB0aGlzXG4gICAgICAjIG1vdmUgc25pcHBldFxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldE1vdmVkJywgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlP1xuICAgICAgICAjIHJlbW92ZSBmcm9tIG90aGVyIHNuaXBwZXQgdHJlZVxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRDb250YWluZXIuZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldEFkZGVkJywgc25pcHBldClcblxuXG4gIGZpcmVFdmVudDogKGV2ZW50LCBhcmdzLi4uKSAtPlxuICAgIHRoaXNbZXZlbnRdLmZpcmUuYXBwbHkoZXZlbnQsIGFyZ3MpXG4gICAgQGNoYW5nZWQuZmlyZSgpXG5cblxuICBkZXRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgZGV0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXQuc25pcHBldFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIHNuaXBwZXQgZnJvbSBhbm90aGVyIFNuaXBwZXRUcmVlJ1xuXG4gICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnRzKSAtPlxuICAgICAgZGVzY2VuZGFudHMuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGRldGFjaFNuaXBwZXRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0UmVtb3ZlZCcsIHNuaXBwZXQpXG5cblxuICBjb250ZW50Q2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRDb250ZW50Q2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBodG1sQ2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRIdG1sQ2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBkYXRhQ2hhbmdpbmc6IChzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcykgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0RGF0YUNoYW5nZWQnLCBzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICBwcmludEpzb246IC0+XG4gICAgd29yZHMucmVhZGFibGVKc29uKEB0b0pzb24oKSlcblxuXG4gICMgUmV0dXJucyBhIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgIyB0aGF0IGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIgYXMgSlNPTi5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGRhdGEgPSB7fVxuICAgIGRhdGFbJ2NvbnRlbnQnXSA9IFtdXG4gICAgZGF0YVsnZGVzaWduJ10gPSB7IG5hbWU6IEBkZXNpZ24ubmFtZXNwYWNlIH1cblxuICAgIHNuaXBwZXRUb0RhdGEgPSAoc25pcHBldCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0LnRvSnNvbigpXG4gICAgICBjb250YWluZXJBcnJheS5wdXNoIHNuaXBwZXREYXRhXG4gICAgICBzbmlwcGV0RGF0YVxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0VG9EYXRhKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBzbmlwcGV0RGF0YS5jb250YWluZXJzW3NuaXBwZXRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIHNuaXBwZXRUcmVlXG4gICMgVGhpcyBtZXRob2Qgc3VwcHJlc3NlcyBjaGFuZ2UgZXZlbnRzIGluIHRoZSBzbmlwcGV0VHJlZS5cbiAgI1xuICAjIENvbnNpZGVyIHRvIGNoYW5nZSBwYXJhbXM6XG4gICMgZnJvbURhdGEoeyBjb250ZW50LCBkZXNpZ24sIHNpbGVudCB9KSAjIHNpbGVudCBbYm9vbGVhbl06IHN1cHByZXNzIGNoYW5nZSBldmVudHNcbiAgZnJvbURhdGE6IChkYXRhLCBkZXNpZ24sIHNpbGVudD10cnVlKSAtPlxuICAgIGlmIGRlc2lnbj9cbiAgICAgIGFzc2VydCBub3QgQGRlc2lnbj8gfHwgZGVzaWduLmVxdWFscyhAZGVzaWduKSwgJ0Vycm9yIGxvYWRpbmcgZGF0YS4gU3BlY2lmaWVkIGRlc2lnbiBpcyBkaWZmZXJlbnQgZnJvbSBjdXJyZW50IHNuaXBwZXRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBpZiBkYXRhLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IFNuaXBwZXRNb2RlbC5mcm9tSnNvbihzbmlwcGV0RGF0YSwgZGVzaWduKVxuICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgICBAcm9vdC5lYWNoIChzbmlwcGV0KSA9PlxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdGhpc1xuXG5cbiAgIyBBcHBlbmQgZGF0YSB0byB0aGlzIHNuaXBwZXRUcmVlXG4gICMgRmlyZXMgc25pcHBldEFkZGVkIGV2ZW50IGZvciBldmVyeSBzbmlwcGV0XG4gIGFkZERhdGE6IChkYXRhLCBkZXNpZ24pIC0+XG4gICAgQGZyb21EYXRhKGRhdGEsIGRlc2lnbiwgZmFsc2UpXG5cblxuICBhZGREYXRhV2l0aEFuaW1hdGlvbjogKGRhdGEsIGRlbGF5PTIwMCkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sICdFcnJvciBhZGRpbmcgZGF0YS4gU25pcHBldFRyZWUgaGFzIG5vIGRlc2lnbidcblxuICAgIHRpbWVvdXQgPSBOdW1iZXIoZGVsYXkpXG4gICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IHNuaXBwZXREYXRhXG4gICAgICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBzbmlwcGV0ID0gU25pcHBldE1vZGVsLmZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pXG4gICAgICAgICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpXG4gICAgICAgICwgdGltZW91dFxuXG4gICAgICB0aW1lb3V0ICs9IE51bWJlcihkZWxheSlcblxuXG4gIHRvRGF0YTogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gICMgQWxpYXNlc1xuICAjIC0tLS0tLS1cblxuICBmcm9tSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQGZyb21EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB0b0pzb246IChhcmdzLi4uKSAtPlxuICAgIEB0b0RhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEBlbGVtKVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlIHx8PSBAYWxsW25hbWVdXG4gICAgdGhpc1tkaXJlY3RpdmUuaW5kZXggKz0gMV1cblxuXG4gIG5leHRPZlR5cGU6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICAjIGhlbHBlciB0byBkaXJlY3RseSBnZXQgZWxlbWVudCB3cmFwcGVkIGluIGEgalF1ZXJ5IG9iamVjdFxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgbmFtZXM6ICh0eXBlKSAtPlxuICAgIHJldHVybiBbXSB1bmxlc3MgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICBkaXJlY3RpdmUubmFtZVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgY2xvbmU6IC0+XG4gICAgbmV3Q29sbGVjdGlvbiA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgbmV3Q29sbGVjdGlvbi5hZGQoZGlyZWN0aXZlLmNsb25lKCkpXG5cbiAgICBuZXdDb2xsZWN0aW9uXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIHBhcnNlOiAoZWxlbSkgLT5cbiAgICBlbGVtRGlyZWN0aXZlID0gdW5kZWZpbmVkXG4gICAgbW9kaWZpY2F0aW9ucyA9IFtdXG4gICAgQHBhcnNlRGlyZWN0aXZlcyBlbGVtLCAoZGlyZWN0aXZlKSAtPlxuICAgICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICAgIGVsZW1EaXJlY3RpdmUgPSBkaXJlY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kaWZpY2F0aW9ucy5wdXNoKGRpcmVjdGl2ZSlcblxuICAgIEBhcHBseU1vZGlmaWNhdGlvbnMoZWxlbURpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgaWYgZWxlbURpcmVjdGl2ZVxuICAgIHJldHVybiBlbGVtRGlyZWN0aXZlXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChlbGVtLCBmdW5jKSAtPlxuICAgIGRpcmVjdGl2ZURhdGEgPSBbXVxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHIubmFtZVxuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyaWJ1dGVOYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmVEYXRhLnB1c2hcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBhdHRyaWJ1dGVOYW1lXG4gICAgICAgICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlXG4gICAgICAgICAgICBuYW1lOiBhdHRyLnZhbHVlXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICBlbGVtOiBlbGVtXG5cbiAgICAjIFNpbmNlIHdlIG1vZGlmeSB0aGUgYXR0cmlidXRlcyB3ZSBoYXZlIHRvIHNwbGl0XG4gICAgIyB0aGlzIGludG8gdHdvIGxvb3BzXG4gICAgZm9yIGRhdGEgaW4gZGlyZWN0aXZlRGF0YVxuICAgICAgZGlyZWN0aXZlID0gZGF0YS5kaXJlY3RpdmVcbiAgICAgIEByZXdyaXRlQXR0cmlidXRlKGRpcmVjdGl2ZSwgZGF0YS5hdHRyaWJ1dGVOYW1lKVxuICAgICAgZnVuYyhkaXJlY3RpdmUpXG5cblxuICBhcHBseU1vZGlmaWNhdGlvbnM6IChtYWluRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gbW9kaWZpY2F0aW9uc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ29wdGlvbmFsJ1xuICAgICAgICAgIG1haW5EaXJlY3RpdmUub3B0aW9uYWwgPSB0cnVlXG5cblxuICAjIE5vcm1hbGl6ZSBvciByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAjIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gIHJld3JpdGVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICBpZiBhdHRyaWJ1dGVOYW1lICE9IGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICAgIGVsc2UgaWYgbm90IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlKVxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuXG5cbiAgIyBmb3JjZSBhdHRyaWJ1dGUgc3R5bGUgYXMgc3BlY2lmaWVkIGluIGNvbmZpZ1xuICAjIGUuZy4gYXR0cmlidXRlICdkb2MtY29udGFpbmVyJyBiZWNvbWVzICdkYXRhLWRvYy1jb250YWluZXInXG4gIG5vcm1hbGl6ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBlbGVtID0gZGlyZWN0aXZlLmVsZW1cbiAgICBpZiBhdHRyaWJ1dGVOYW1lXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICBlbGVtLnNldEF0dHJpYnV0ZShkaXJlY3RpdmUucmVuZGVyZWRBdHRyKCksIGRpcmVjdGl2ZS5uYW1lKVxuXG5cbiAgcmVtb3ZlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGRpcmVjdGl2ZS5lbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3Igc25pcHBldCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIG91dHB1dCB0aGUgYWNjZXB0ZWQgY29udGVudCBvZiB0aGUgc25pcHBldFxuICAjIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBjcmVhdGVcbiAgIyBlLmc6IHsgdGl0bGU6IFwiSXRjaHkgYW5kIFNjcmF0Y2h5XCIgfVxuICBwcmludERvYzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcbiAgICAgICMgZWRpdGFibGVzOiBPYmplY3Qua2V5cyBAZWRpdGFibGVzIGlmIEBlZGl0YWJsZXNcbiAgICAgICMgY29udGFpbmVyczogT2JqZWN0LmtleXMgQGNvbnRhaW5lcnMgaWYgQGNvbnRhaW5lcnNcblxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihkb2MpXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgbmFtZXNwYWNlOiB1bmRlZmluZWQsIGlkOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IG5hbWVzcGFjZTogcGFydHNbMF0sIGlkOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2Ugc25pcHBldCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
