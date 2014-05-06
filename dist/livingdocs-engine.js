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
    designPath: '/designs',
    livingdocsCssFile: '/assets/css/livingdocs.css',
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?",
    singleLineBreak: /^<br\s*\/?>\s*$/,
    attributePrefix: 'data',
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
var DragBase, config;

config = require('../configuration/defaults');

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
    this.page.$body.addClass(config.css.preventSelection);
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
      this.page.$body.removeClass(config.css.preventSelection);
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
    $blocker = $("<div class='dragBlocker'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
    return this.page.$body.append($blocker);
  };

  DragBase.prototype.removeBlocker = function() {
    return this.page.$body.find('.dragBlocker').remove();
  };

  DragBase.prototype.addLongpressIndicator = function(_arg) {
    var $indicator, pageX, pageY;
    pageX = _arg.pageX, pageY = _arg.pageY;
    if (!this.options.longpress.showIndicator) {
      return;
    }
    $indicator = $("<div class=\"" + config.css.longpressIndicator + "\"><div></div></div>");
    $indicator.css({
      left: pageX,
      top: pageY
    });
    return this.page.$body.append($indicator);
  };

  DragBase.prototype.removeLongpressIndicator = function() {
    return this.page.$body.find("." + config.css.longpressIndicator).remove();
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
    this.editable.focus(this.withContext(this.focus)).blur(this.withContext(this.blur)).insert(this.withContext(this.insert)).merge(this.withContext(this.merge)).split(this.withContext(this.split)).selection(this.withContext(this.selectionChanged)).newline(this.withContext(this.newline));
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

  EditableController.prototype.updateModel = function(view, editableName) {
    var value;
    value = view.get(editableName);
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
    view.blurEditable(editableName);
    element = view.getDirectiveElement(editableName);
    this.page.focus.editableBlurred(element, view);
    this.updateModel(view, editableName);
    return true;
  };

  EditableController.prototype.insert = function(view, editableName, direction, cursor) {
    var copy, newView, snippetName, template;
    if (this.hasSingleEditable(view)) {
      snippetName = this.page.design.paragraphSnippet;
      template = this.page.design.get(snippetName);
      copy = template.createModel();
      newView = direction === 'before' ? (view.model.before(copy), view.prev()) : (view.model.after(copy), view.next());
      if (newView) {
        newView.focus();
      }
    }
    return false;
  };

  EditableController.prototype.merge = function(view, editableName, direction, cursor) {
    var contents, el, elem, frag, mergedView, _i, _len;
    if (this.hasSingleEditable(view)) {
      mergedView = direction === 'before' ? view.prev() : view.next();
      if (mergedView && mergedView.template === view.template) {
        contents = view.directives.$getElem(editableName).contents();
        frag = this.page.document.createDocumentFragment();
        for (_i = 0, _len = contents.length; _i < _len; _i++) {
          el = contents[_i];
          frag.appendChild(el);
        }
        mergedView.focus();
        elem = mergedView.getDirectiveElement(editableName);
        cursor = this.editable.createCursor(elem, direction === 'before' ? 'end' : 'beginning');
        cursor[direction === 'before' ? 'insertAfter' : 'insertBefore'](frag);
        cursor.save();
        this.updateModel(mergedView, editableName);
        cursor.restore();
        view.model.remove();
        cursor.setSelection();
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
      view.model.set(editableName, beforeContent);
      copy.set(editableName, afterContent);
      view.model.after(copy);
      view.next().focus();
    }
    return false;
  };

  EditableController.prototype.selectionChanged = function(view, editableName, selection) {
    var element;
    element = view.getDirectiveElement(editableName);
    return this.selection.fire(view, element, selection);
  };

  EditableController.prototype.newline = function(view, editable, cursor) {
    return false;
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
    this.$dragBlocker = this.page.$body.find('.dragBlocker');
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
    var box;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.firstChild, 'top');
    box = dom.getAbsoluteBoundingClientRect(elem);
    return this.showMarker({
      left: box.left,
      top: box.top + startAndEndOffset,
      width: box.width
    });
  };

  SnippetDrag.prototype.showMarkerAtEndOfContainer = function(elem) {
    var box;
    if (elem == null) {
      return;
    }
    this.makeSpace(elem.lastChild, 'bottom');
    box = dom.getAbsoluteBoundingClientRect(elem);
    return this.showMarker({
      left: box.left,
      top: box.bottom - startAndEndOffset,
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
module.exports=require('5Hlb1L');
},{}],"5Hlb1L":[function(require,module,exports){
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
    $elem = this.directives.$getElem(name);
    if (value) {
      $elem.addClass(css.noPlaceholder);
    } else {
      $elem.removeClass(css.noPlaceholder);
    }
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
    this.$document.on('click.livingdocs', $.proxy(this.click, this)).on('mousedown.livingdocs', $.proxy(this.mousedown, this)).on('touchstart.livingdocs', $.proxy(this.mousedown, this)).on('dragstart', $.proxy(this.browserDragStart, this));
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
    var snippetView;
    if (event.which !== LEFT_MOUSE_BUTTON && event.type === 'mousedown') {
      return;
    }
    snippetView = dom.findSnippetView(event.target);
    if (!snippetView) {
      return;
    }
    return this.startDrag({
      snippetView: snippetView,
      event: event
    });
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

  InteractivePage.prototype.click = function(event) {
    var nodeContext, snippetView;
    snippetView = dom.findSnippetView(event.target);
    nodeContext = dom.findNodeContext(event.target);
    if (snippetView) {
      this.focus.snippetFocused(snippetView);
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

  SnippetTree.prototype.toJson = function() {
    return this.serialize();
  };

  SnippetTree.prototype.fromJson = function(data, design) {
    var snippet, snippetData, _i, _len, _ref;
    this.root.snippetTree = void 0;
    if (data.content) {
      _ref = data.content;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        snippetData = _ref[_i];
        snippet = SnippetModel.fromJson(snippetData, design);
        this.root.append(snippet);
      }
    }
    this.root.snippetTree = this;
    return this.root.each((function(_this) {
      return function(snippet) {
        return snippet.snippetTree = _this;
      };
    })(this));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvbGliL2tleXMuanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2RlZmF1bHRzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3N0eWxlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2tpY2tzdGFydC9icm93c2VyX3htbGRvbS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9mZWF0dXJlX2RldGVjdHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3NlcmlhbGl6YXRpb24uY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9pbWFnZV9tYW5hZ2VyLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2FycmF5LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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V0FDRTtBQUFBLE1BQUUsU0FBQSxFQUFXLE1BQWI7QUFBQSxNQUF3QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBbEM7TUFERjtHQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNIO0FBQUEsTUFBRSxTQUFBLEVBQVcsS0FBTSxDQUFBLENBQUEsQ0FBbkI7QUFBQSxNQUF1QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBakM7TUFERztHQUFBLE1BQUE7V0FHSCxHQUFHLENBQUMsS0FBSixDQUFXLCtDQUFBLEdBQWQsVUFBRyxFQUhHO0dBTm9CO0FBQUEsQ0E5STNCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgb2JqZWN0S2V5cyA9IHJlcXVpcmUoJy4vbGliL2tleXMuanMnKTtcbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vbGliL2lzX2FyZ3VtZW50cy5qcycpO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWRPck51bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyICh4KSB7XG4gIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHgubGVuZ3RoICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIHguY29weSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeC5zbGljZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoeC5sZW5ndGggPiAwICYmIHR5cGVvZiB4WzBdICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgb3B0cykge1xuICB2YXIgaSwga2V5O1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gZGVlcEVxdWFsKGEsIGIsIG9wdHMpO1xuICB9XG4gIGlmIChpc0J1ZmZlcihhKSkge1xuICAgIGlmICghaXNCdWZmZXIoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBvcHRzKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuIiwidmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59O1xuXG5leHBvcnRzLnVuc3VwcG9ydGVkID0gdW5zdXBwb3J0ZWQ7XG5mdW5jdGlvbiB1bnN1cHBvcnRlZChvYmplY3Qpe1xuICByZXR1cm4gb2JqZWN0ICYmXG4gICAgdHlwZW9mIG9iamVjdCA9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiBvYmplY3QubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpICYmXG4gICAgIU9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmplY3QsICdjYWxsZWUnKSB8fFxuICAgIGZhbHNlO1xufTtcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJ1xuICA/IE9iamVjdC5rZXlzIDogc2hpbTtcblxuZXhwb3J0cy5zaGltID0gc2hpbTtcbmZ1bmN0aW9uIHNoaW0gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgcmV0dXJuIGtleXM7XG59XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjYgLSBnaXQuaW8vZWVcbiAqIE9saXZlciBDYWxkd2VsbFxuICogTUlUIGxpY2Vuc2VcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cblx0ICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuXHQvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuXHR2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuXHR2YXIgZXhwb3J0cyA9IHRoaXM7XG5cdHZhciBvcmlnaW5hbEdsb2JhbFZhbHVlID0gZXhwb3J0cy5FdmVudEVtaXR0ZXI7XG5cblx0LyoqXG5cdCAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdCdzIHN0b3JhZ2UgYXJyYXkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGxvb2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1ldGhvZC5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gYWxpYXNDbG9zdXJlKCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaWxsIGluaXRpYWxpc2UgdGhlIGV2ZW50IG9iamVjdCBhbmQgbGlzdGVuZXIgYXJyYXlzIGlmIHJlcXVpcmVkLlxuXHQgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG5cdCAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciByZXNwb25zZTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmV0dXJuIGEgY29uY2F0ZW5hdGVkIGFycmF5IG9mIGFsbCBtYXRjaGluZyBldmVudHMgaWZcblx0XHQvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0cmVzcG9uc2Vba2V5XSA9IGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBUYWtlcyBhIGxpc3Qgb2YgbGlzdGVuZXIgb2JqZWN0cyBhbmQgZmxhdHRlbnMgaXQgaW50byBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW119IEp1c3QgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICovXG5cdHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuXHRcdHZhciBmbGF0TGlzdGVuZXJzID0gW107XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmxhdExpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgcmVxdWVzdGVkIGxpc3RlbmVycyB2aWEgZ2V0TGlzdGVuZXJzIGJ1dCB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHJlc3VsdHMgaW5zaWRlIGFuIG9iamVjdC4gVGhpcyBpcyBtYWlubHkgZm9yIGludGVybmFsIHVzZSBidXQgb3RoZXJzIG1heSBmaW5kIGl0IHVzZWZ1bC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBpbiBhbiBvYmplY3QuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlIHx8IGxpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogQWRkcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cblx0ICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG5cdCAqIElmIHlvdSBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lIHRoZW4gdGhlIGxpc3RlbmVyIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuXHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5wdXNoKGxpc3RlbmVySXNXcmFwcGVkID8gbGlzdGVuZXIgOiB7XG5cdFx0XHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0XHRcdG9uY2U6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcblx0ICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0J3MgZmlyc3QgZXhlY3V0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRPbmNlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuXHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0b25jZTogdHJ1ZVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG5cdCAqL1xuXHRwcm90by5vbmNlID0gYWxpYXMoJ2FkZE9uY2VMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuXHQgKiBZb3UgbmVlZCB0byB0ZWxsIGl0IHdoYXQgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIG1hdGNoZWQgYnkgYSByZWdleC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcblx0XHR0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBVc2VzIGRlZmluZUV2ZW50IHRvIGRlZmluZSBtdWx0aXBsZSBldmVudHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2hlbiBwYXNzZWQgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUsIGl0IHdpbGwgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGluZGV4O1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpbmRleCA9IGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpO1xuXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogQWRkcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKiBZZWFoLCB0aGlzIGZ1bmN0aW9uIGRvZXMgcXVpdGUgYSBiaXQuIFRoYXQncyBwcm9iYWJseSBhIGJhZCB0aGluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZExpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG5cdCAqIFRoZSBmaXJzdCBhcmd1bWVudCB3aWxsIGRldGVybWluZSBpZiB0aGUgbGlzdGVuZXJzIGFyZSByZW1vdmVkICh0cnVlKSBvciBhZGRlZCAoZmFsc2UpLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gbWFuaXB1bGF0ZSB0aGUgbGlzdGVuZXJzIG9mIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuXHRcdHZhciBpO1xuXHRcdHZhciB2YWx1ZTtcblx0XHR2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG5cdFx0dmFyIG11bHRpcGxlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lcnMgOiB0aGlzLmFkZExpc3RlbmVycztcblxuXHRcdC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXQncyBwcm9wZXJ0aWVzIHRvIHRoaXMgbWV0aG9kXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuXHRcdFx0Zm9yIChpIGluIGV2dCkge1xuXHRcdFx0XHRpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpICYmICh2YWx1ZSA9IGV2dFtpXSkpIHtcblx0XHRcdFx0XHQvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG5cdFx0XHRcdFx0XHRtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBTbyBldnQgbXVzdCBiZSBhIHN0cmluZ1xuXHRcdFx0Ly8gQW5kIGxpc3RlbmVycyBtdXN0IGJlIGFuIGFycmF5IG9mIGxpc3RlbmVyc1xuXHRcdFx0Ly8gTG9vcCBvdmVyIGl0IGFuZCBwYXNzIGVhY2ggb25lIHRvIHRoZSBtdWx0aXBsZSBtZXRob2Rcblx0XHRcdGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBJZiB5b3UgZG8gbm90IHNwZWNpZnkgYW4gZXZlbnQgdGhlbiBhbGwgbGlzdGVuZXJzIHdpbGwgYmUgcmVtb3ZlZC5cblx0ICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuXHRcdHZhciB0eXBlID0gdHlwZW9mIGV2dDtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJlbW92ZSBkaWZmZXJlbnQgdGhpbmdzIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgZXZ0XG5cdFx0aWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuXHRcdFx0ZGVsZXRlIGV2ZW50c1tldnRdO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuXHRcdFx0ZGVsZXRlIHRoaXMuX2V2ZW50cztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG5cdCAqXG5cdCAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBhbGlhcygncmVtb3ZlRXZlbnQnKTtcblxuXHQvKipcblx0ICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG5cdCAqIFdoZW4gZW1pdHRlZCwgZXZlcnkgbGlzdGVuZXIgYXR0YWNoZWQgdG8gdGhhdCBldmVudCB3aWxsIGJlIGV4ZWN1dGVkLlxuXHQgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG5cdCAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cblx0ICogU28gdGhleSB3aWxsIG5vdCBhcnJpdmUgd2l0aGluIHRoZSBhcnJheSBvbiB0aGUgb3RoZXIgc2lkZSwgdGhleSB3aWxsIGJlIHNlcGFyYXRlLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcjtcblx0XHR2YXIgaTtcblx0XHR2YXIga2V5O1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cblx0XHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRcdC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG5cdFx0XHRcdFx0Ly8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG5cdFx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNba2V5XVtpXTtcblxuXHRcdFx0XHRcdGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc3BvbnNlID0gbGlzdGVuZXIubGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyB8fCBbXSk7XG5cblx0XHRcdFx0XHRpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBlbWl0RXZlbnRcblx0ICovXG5cdHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cblx0ICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiB0aGlzLmVtaXRFdmVudChldnQsIGFyZ3MpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZiBhXG5cdCAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG5cdCAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcblx0XHR0aGlzLl9vbmNlUmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcblx0ICogdGhlIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGlzIG9uZSB0aGVuIGl0IHNob3VsZCBiZSByZW1vdmVkXG5cdCAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cblx0ICpcblx0ICogQHJldHVybiB7KnxCb29sZWFufSBUaGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBmb3Igb3IgdGhlIGRlZmF1bHQsIHRydWUuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIF9nZXRPbmNlUmV0dXJuVmFsdWUoKSB7XG5cdFx0aWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXZlcnRzIHRoZSBnbG9iYWwge0BsaW5rIEV2ZW50RW1pdHRlcn0gdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgdmVyc2lvbi5cblx0ICpcblx0ICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG5cdCAqL1xuXHRFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG5cdFx0ZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBvcmlnaW5hbEdsb2JhbFZhbHVlO1xuXHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdH07XG5cblx0Ly8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHRcdH0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblx0fVxufS5jYWxsKHRoaXMpKTtcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5Eb2N1bWVudCA9IHJlcXVpcmUoJy4vZG9jdW1lbnQnKVxuU25pcHBldFRyZWUgPSByZXF1aXJlKCcuL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuXG4gICMgSW5zdGFudGlhdGlvbiBwcm9jZXNzOlxuICAjIGFzeW5jIG9yIHN5bmMgLT4gZ2V0IGRlc2lnbiAoaW5jbHVkZSBqcyBmb3Igc3luY2hyb25vdXMgbG9hZGluZylcbiAgIyBzeW5jIC0+IGNyZWF0ZSBkb2N1bWVudFxuICAjIGFzeW5jIC0+IGNyZWF0ZSB2aWV3IChpZnJhbWUpXG4gICMgYXN5bmMgLT4gbG9hZCByZXNvdXJjZXMgaW50byB2aWV3XG5cblxuICAjIExvYWQgYSBkb2N1bWVudCBmcm9tIHNlcmlhbGl6ZWQgZGF0YVxuICAjIGluIGEgc3luY2hyb25vdXMgd2F5LiBEZXNpZ24gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gIG5ldzogKHsgZGF0YSwgZGVzaWduIH0pIC0+XG4gICAgc25pcHBldFRyZWUgPSBpZiBkYXRhP1xuICAgICAgZGVzaWduTmFtZSA9IGRhdGEuZGVzaWduPy5uYW1lXG4gICAgICBhc3NlcnQgZGVzaWduTmFtZT8sICdFcnJvciBjcmVhdGluZyBkb2N1bWVudDogTm8gZGVzaWduIGlzIHNwZWNpZmllZC4nXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGNvbnRlbnQ6IGRhdGEsIGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIGRlc2lnbk5hbWUgPSBkZXNpZ25cbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoZGVzaWduOiBkZXNpZ24pXG5cbiAgICBAY3JlYXRlKHNuaXBwZXRUcmVlKVxuXG5cbiAgIyBUb2RvOiBhZGQgYXN5bmMgYXBpIChhc3luYyBiZWNhdXNlIG9mIHRoZSBsb2FkaW5nIG9mIHRoZSBkZXNpZ24pXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAoZG9jdW1lbnQpIC0+XG4gICMgICAgZG9jdW1lbnQuY3JlYXRlVmlldygnLmNvbnRhaW5lcicsIHsgaW50ZXJhY3RpdmU6IHRydWUgfSlcbiAgIyAgLnRoZW4gKHZpZXcpIC0+XG4gICMgICAgIyB2aWV3IGlzIHJlYWR5XG5cblxuICAjIERpcmVjdCBjcmVhdGlvbiB3aXRoIGFuIGV4aXN0aW5nIFNuaXBwZXRUcmVlXG4gIGNyZWF0ZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIG5ldyBEb2N1bWVudCh7IHNuaXBwZXRUcmVlIH0pXG5cblxuICAjIFNlZSBkZXNpZ25DYWNoZS5sb2FkIGZvciBleGFtcGxlcyBob3cgdG8gbG9hZCB5b3VyIGRlc2lnbi5cbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG4gICMgU3RhcnQgZHJhZyAmIGRyb3BcbiAgc3RhcnREcmFnOiAkLnByb3h5KGVkaXRvclBhZ2UsICdzdGFydERyYWcnKVxuXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuXG5cbiMgRXhwb3J0IGdsb2JhbCB2YXJpYWJsZVxud2luZG93LmRvYyA9IGRvY1xuIiwiIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnID0gZG8gLT5cblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIHNuaXBwZXQgY2xhc3Nlc1xuICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgS2lja3N0YXJ0IGNvbmZpZ1xuICBraWNrc3RhcnQ6XG4gICAgYXR0cjpcbiAgICAgIHN0eWxlczogJ2RvYy1zdHlsZXMnXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuZW5yaWNoQ29uZmlnID0gLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIEBkb2NEaXJlY3RpdmUgPSB7fVxuICBAdGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgQGRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gXCIjeyBAYXR0cmlidXRlUHJlZml4IH0tXCIgaWYgQGF0dHJpYnV0ZVByZWZpeFxuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IHx8ICcnIH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgQGRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIEB0ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cblxuZW5yaWNoQ29uZmlnLmNhbGwoY29uZmlnKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduU3R5bGUgPSByZXF1aXJlKCcuL2Rlc2lnbl9zdHlsZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduXG5cbiAgY29uc3RydWN0b3I6IChkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGVzID0gZGVzaWduLnRlbXBsYXRlcyB8fCBkZXNpZ24uc25pcHBldHNcbiAgICBjb25maWcgPSBkZXNpZ24uY29uZmlnXG4gICAgZ3JvdXBzID0gZGVzaWduLmNvbmZpZy5ncm91cHMgfHwgZGVzaWduLmdyb3Vwc1xuXG4gICAgQG5hbWVzcGFjZSA9IGNvbmZpZz8ubmFtZXNwYWNlIHx8ICdsaXZpbmdkb2NzLXRlbXBsYXRlcydcbiAgICBAcGFyYWdyYXBoU25pcHBldCA9IGNvbmZpZz8ucGFyYWdyYXBoIHx8ICd0ZXh0J1xuICAgIEBjc3MgPSBjb25maWcuY3NzXG4gICAgQGpzID0gY29uZmlnLmpzXG4gICAgQGZvbnRzID0gY29uZmlnLmZvbnRzXG4gICAgQHRlbXBsYXRlcyA9IFtdXG4gICAgQGdyb3VwcyA9IHt9XG4gICAgQHN0eWxlcyA9IHt9XG5cbiAgICBAc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zKHRlbXBsYXRlcylcbiAgICBAZ2xvYmFsU3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihkZXNpZ24uY29uZmlnLnN0eWxlcylcbiAgICBAYWRkR3JvdXBzKGdyb3VwcylcbiAgICBAYWRkVGVtcGxhdGVzTm90SW5Hcm91cHMoKVxuXG5cbiAgc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zOiAodGVtcGxhdGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zID0ge31cbiAgICBmb3IgdGVtcGxhdGUgaW4gdGVtcGxhdGVzXG4gICAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuXG5cbiAgIyBwYXNzIHRoZSB0ZW1wbGF0ZSBhcyBvYmplY3RcbiAgIyBlLmcgYWRkKHtpZDogXCJ0aXRsZVwiLCBuYW1lOlwiVGl0bGVcIiwgaHRtbDogXCI8aDEgZG9jLWVkaXRhYmxlPlRpdGxlPC9oMT5cIn0pXG4gIGFkZDogKHRlbXBsYXRlRGVmaW5pdGlvbiwgc3R5bGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlRGVmaW5pdGlvbi5pZF0gPSB1bmRlZmluZWRcbiAgICB0ZW1wbGF0ZU9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKHRlbXBsYXRlRGVmaW5pdGlvbi5zdHlsZXMpXG4gICAgdGVtcGxhdGVTdHlsZXMgPSAkLmV4dGVuZCh7fSwgc3R5bGVzLCB0ZW1wbGF0ZU9ubHlTdHlsZXMpXG5cbiAgICB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZVxuICAgICAgbmFtZXNwYWNlOiBAbmFtZXNwYWNlXG4gICAgICBpZDogdGVtcGxhdGVEZWZpbml0aW9uLmlkXG4gICAgICB0aXRsZTogdGVtcGxhdGVEZWZpbml0aW9uLnRpdGxlXG4gICAgICBzdHlsZXM6IHRlbXBsYXRlU3R5bGVzXG4gICAgICBodG1sOiB0ZW1wbGF0ZURlZmluaXRpb24uaHRtbFxuICAgICAgd2VpZ2h0OiB0ZW1wbGF0ZURlZmluaXRpb24uc29ydE9yZGVyIHx8IDBcblxuICAgIEB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSlcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgYWRkR3JvdXBzOiAoY29sbGVjdGlvbikgLT5cbiAgICBmb3IgZ3JvdXBOYW1lLCBncm91cCBvZiBjb2xsZWN0aW9uXG4gICAgICBncm91cE9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGdyb3VwLnN0eWxlcylcbiAgICAgIGdyb3VwU3R5bGVzID0gJC5leHRlbmQoe30sIEBnbG9iYWxTdHlsZXMsIGdyb3VwT25seVN0eWxlcylcblxuICAgICAgdGVtcGxhdGVzID0ge31cbiAgICAgIGZvciB0ZW1wbGF0ZUlkIGluIGdyb3VwLnRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZURlZmluaXRpb24gPSBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZUlkXVxuICAgICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgICB0ZW1wbGF0ZSA9IEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBncm91cFN0eWxlcylcbiAgICAgICAgICB0ZW1wbGF0ZXNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy53YXJuKFwiVGhlIHRlbXBsYXRlICcje3RlbXBsYXRlSWR9JyByZWZlcmVuY2VkIGluIHRoZSBncm91cCAnI3tncm91cE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIilcblxuICAgICAgQGFkZEdyb3VwKGdyb3VwTmFtZSwgZ3JvdXAsIHRlbXBsYXRlcylcblxuXG4gIGFkZFRlbXBsYXRlc05vdEluR3JvdXBzOiAoZ2xvYmFsU3R5bGVzKSAtPlxuICAgIGZvciB0ZW1wbGF0ZUlkLCB0ZW1wbGF0ZURlZmluaXRpb24gb2YgQHRlbXBsYXRlRGVmaW5pdGlvbnNcbiAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgQGdsb2JhbFN0eWxlcylcblxuXG4gIGFkZEdyb3VwOiAobmFtZSwgZ3JvdXAsIHRlbXBsYXRlcykgLT5cbiAgICBAZ3JvdXBzW25hbWVdID1cbiAgICAgIHRpdGxlOiBncm91cC50aXRsZVxuICAgICAgdGVtcGxhdGVzOiB0ZW1wbGF0ZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbjogKHN0eWxlcykgLT5cbiAgICBkZXNpZ25TdHlsZXMgPSB7fVxuICAgIGlmIHN0eWxlc1xuICAgICAgZm9yIHN0eWxlRGVmaW5pdGlvbiBpbiBzdHlsZXNcbiAgICAgICAgZGVzaWduU3R5bGUgPSBAY3JlYXRlRGVzaWduU3R5bGUoc3R5bGVEZWZpbml0aW9uKVxuICAgICAgICBkZXNpZ25TdHlsZXNbZGVzaWduU3R5bGUubmFtZV0gPSBkZXNpZ25TdHlsZSBpZiBkZXNpZ25TdHlsZVxuXG4gICAgZGVzaWduU3R5bGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBpZiBzdHlsZURlZmluaXRpb24gJiYgc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgIG5ldyBEZXNpZ25TdHlsZVxuICAgICAgICBuYW1lOiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgICB0eXBlOiBzdHlsZURlZmluaXRpb24udHlwZVxuICAgICAgICBvcHRpb25zOiBzdHlsZURlZmluaXRpb24ub3B0aW9uc1xuICAgICAgICB2YWx1ZTogc3R5bGVEZWZpbml0aW9uLnZhbHVlXG5cblxuICByZW1vdmU6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBAdGVtcGxhdGVzLnNwbGljZShAZ2V0SW5kZXgoaWQpLCAxKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgdGVtcGxhdGUgPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpbmRleCkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIHRlbXBsYXRlID0gdFxuXG4gICAgICB0ZW1wbGF0ZVxuXG5cbiAgZ2V0SW5kZXg6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBpbmRleCA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGkpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICBpbmRleCA9IGlcblxuICAgICAgaW5kZXhcblxuXG4gIGNoZWNrTmFtZXNwYWNlOiAoaWRlbnRpZmllciwgY2FsbGJhY2spIC0+XG4gICAgeyBuYW1lc3BhY2UsIGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIGFzc2VydCBub3QgbmFtZXNwYWNlIG9yIEBuYW1lc3BhY2UgaXMgbmFtZXNwYWNlLFxuICAgICAgXCJkZXNpZ24gI3sgQG5hbWVzcGFjZSB9OiBjYW5ub3QgZ2V0IHRlbXBsYXRlIHdpdGggZGlmZmVyZW50IG5hbWVzcGFjZSAjeyBuYW1lc3BhY2UgfSBcIlxuXG4gICAgY2FsbGJhY2soaWQpXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHRlbXBsYXRlLCBpbmRleCBpbiBAdGVtcGxhdGVzXG4gICAgICBjYWxsYmFjayh0ZW1wbGF0ZSwgaW5kZXgpXG5cblxuICAjIGxpc3QgYXZhaWxhYmxlIFRlbXBsYXRlc1xuICBsaXN0OiAtPlxuICAgIHRlbXBsYXRlcyA9IFtdXG4gICAgQGVhY2ggKHRlbXBsYXRlKSAtPlxuICAgICAgdGVtcGxhdGVzLnB1c2godGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIHRlbXBsYXRlc1xuXG5cbiAgIyBwcmludCBkb2N1bWVudGF0aW9uIGZvciBhIHRlbXBsYXRlXG4gIGluZm86IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldChpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLnByaW50RG9jKClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ3lvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFdpbGwgYmUgZXh0ZW5kZWQgdG8gbG9hZCBkZXNpZ25zIHJlbW90ZWx5IGZyb20gYSBzZXJ2ZXI6XG4gICMgTG9hZCBmcm9tIHRoZSBkZWZhdWx0IHNvdXJjZTpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2doaWJsaScpXG4gICNcbiAgIyBMb2FkIGZyb20gYSBjdXN0b20gc2VydmVyOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnaHR0cDovL3lvdXJzZXJ2ZXIuaW8vZGVzaWducy9naGlibGkvZGVzaWduLmpzb24nKVxuICBsb2FkOiAobmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgYXNzZXJ0IGZhbHNlLCAnTG9hZCBkZXNpZ24gYnkgbmFtZSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LidcbiAgICBlbHNlXG4gICAgICBkZXNpZ25Db25maWcgPSBuYW1lXG4gICAgICBkZXNpZ24gPSBuZXcgRGVzaWduKGRlc2lnbkNvbmZpZylcbiAgICAgIEBhZGQoZGVzaWduKVxuXG5cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIG5hbWUgPSBkZXNpZ24ubmFtZXNwYWNlXG4gICAgQGRlc2lnbnNbbmFtZV0gPSBkZXNpZ25cblxuXG4gIGhhczogKG5hbWUpIC0+XG4gICAgQGRlc2lnbnNbbmFtZV0/XG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGFzc2VydCBAaGFzKG5hbWUpLCBcIkVycm9yOiBkZXNpZ24gJyN7IG5hbWUgfScgaXMgbm90IGxvYWRlZC5cIlxuICAgIEBkZXNpZ25zW25hbWVdXG5cblxuICByZXNldENhY2hlOiAtPlxuICAgIEBkZXNpZ25zID0ge31cblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25TdHlsZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgc3dpdGNoIEB0eXBlXG4gICAgICB3aGVuICdvcHRpb24nXG4gICAgICAgIGFzc2VydCB2YWx1ZSwgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAndmFsdWUnIHByb3ZpZGVkXCJcbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgIHdoZW4gJ3NlbGVjdCdcbiAgICAgICAgYXNzZXJ0IG9wdGlvbnMsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ29wdGlvbnMnIHByb3ZpZGVkXCJcbiAgICAgICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IHVua25vd24gdHlwZSAnI3sgQHR5cGUgfSdcIlxuXG5cbiAgIyBHZXQgaW5zdHJ1Y3Rpb25zIHdoaWNoIGNzcyBjbGFzc2VzIHRvIGFkZCBhbmQgcmVtb3ZlLlxuICAjIFdlIGRvIG5vdCBjb250cm9sIHRoZSBjbGFzcyBhdHRyaWJ1dGUgb2YgYSBzbmlwcGV0IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IERlc2lnblN0eWxlI3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRG9jdW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBzbmlwcGV0VHJlZSB9KSAtPlxuICAgIEBkZXNpZ24gPSBzbmlwcGV0VHJlZS5kZXNpZ25cbiAgICBAc2V0U25pcHBldFRyZWUoc25pcHBldFRyZWUpXG4gICAgQHZpZXdzID0ge31cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdW5kZWZpbmVkXG5cblxuICBzZXRTbmlwcGV0VHJlZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0VHJlZS5kZXNpZ24gPT0gQGRlc2lnbixcbiAgICAgICdTbmlwcGV0VHJlZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVzaWduIGFzIHRoZSBkb2N1bWVudCdcblxuICAgIEBtb2RlbCA9IEBzbmlwcGV0VHJlZSA9IHNuaXBwZXRUcmVlXG4gICAgQGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50cygpXG5cblxuICBmb3J3YXJkU25pcHBldFRyZWVFdmVudHM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmNoYW5nZWQuYWRkID0+XG4gICAgICBAZW1pdCAnY2hhbmdlJywgYXJndW1lbnRzXG5cblxuICBjcmVhdGVWaWV3OiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgIHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIG9wdGlvbnMucmVhZE9ubHkgPz0gdHJ1ZVxuXG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG5cbiAgICBvcHRpb25zLiR3cmFwcGVyID89IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuXG4gICAgdmlldyA9IG5ldyBWaWV3KEBzbmlwcGV0VHJlZSwgJHBhcmVudFswXSlcbiAgICBwcm9taXNlID0gdmlldy5jcmVhdGUob3B0aW9ucylcblxuICAgIGlmIHZpZXcuaXNJbnRlcmFjdGl2ZVxuICAgICAgQHNldEludGVyYWN0aXZlVmlldyh2aWV3KVxuXG4gICAgcHJvbWlzZVxuXG5cbiAgIyBBIHZpZXcgc29tZXRpbWVzIGhhcyB0byBiZSB3cmFwcGVkIGluIGEgY29udGFpbmVyLlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBIZXJlIHRoZSBkb2N1bWVudCBpcyByZW5kZXJlZCBpbnRvICQoJy5kb2Mtc2VjdGlvbicpXG4gICMgPGRpdiBjbGFzcz1cImlmcmFtZS1jb250YWluZXJcIj5cbiAgIyAgIDxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+PC9zZWN0aW9uPlxuICAjIDwvZGl2PlxuICBmaW5kV3JhcHBlcjogKCRwYXJlbnQpIC0+XG4gICAgaWYgJHBhcmVudC5maW5kKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIpLmxlbmd0aCA9PSAxXG4gICAgICAkd3JhcHBlciA9ICQoJHBhcmVudC5odG1sKCkpXG5cbiAgICAkd3JhcHBlclxuXG5cbiAgc2V0SW50ZXJhY3RpdmVWaWV3OiAodmlldykgLT5cbiAgICBhc3NlcnQgbm90IEBpbnRlcmFjdGl2ZVZpZXc/LFxuICAgICAgJ0Vycm9yIGNyZWF0aW5nIGludGVyYWN0aXZlIHZpZXc6IERvY3VtZW50IGNhbiBoYXZlIG9ubHkgb25lIGludGVyYWN0aXZlIHZpZXcnXG5cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdmlld1xuXG5cbiAgdG9IdG1sOiAtPlxuICAgIG5ldyBSZW5kZXJlcihcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgKS5odG1sKClcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAc25pcHBldFRyZWUuc2VyaWFsaXplKClcblxuXG4gIHRvSnNvbjogKHByZXR0aWZ5KSAtPlxuICAgIGRhdGEgPSBAc2VyaWFsaXplKClcbiAgICBpZiBwcmV0dGlmeT9cbiAgICAgIHJlcGxhY2VyID0gbnVsbFxuICAgICAgc3BhY2UgPSAyXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgc3BhY2UpXG4gICAgZWxzZVxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSlcblxuXG4gICMgRGVidWdcbiAgIyAtLS0tLVxuXG4gICMgUHJpbnQgdGhlIFNuaXBwZXRUcmVlLlxuICBwcmludE1vZGVsOiAoKSAtPlxuICAgIEBzbmlwcGV0VHJlZS5wcmludCgpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBET00gaGVscGVyIG1ldGhvZHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE1ldGhvZHMgdG8gcGFyc2UgYW5kIHVwZGF0ZSB0aGUgRG9tIHRyZWUgaW4gYWNjb3JkYW5jZSB0b1xuIyB0aGUgU25pcHBldFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBzbmlwcGV0UmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zbmlwcGV0IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNlY3Rpb24gfSg/OiB8JClcIilcblxuICAjIEZpbmQgdGhlIHNuaXBwZXQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgU25pcHBldHMgYXJlIG1hcmtlZCBieSBhIGNsYXNzIGF0IHRoZSBtb21lbnQuXG4gIGZpbmRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRTbmlwcGV0Vmlldyhub2RlKVxuICAgICAgICByZXR1cm4gdmlld1xuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBmaW5kTm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgbm9kZUNvbnRleHQgPSBAZ2V0Tm9kZUNvbnRleHQobm9kZSlcbiAgICAgIHJldHVybiBub2RlQ29udGV4dCBpZiBub2RlQ29udGV4dFxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBnZXROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZVR5cGUsIG9iaiBvZiBjb25maWcuZGlyZWN0aXZlc1xuICAgICAgY29udGludWUgaWYgbm90IG9iai5lbGVtZW50RGlyZWN0aXZlXG5cbiAgICAgIGRpcmVjdGl2ZUF0dHIgPSBvYmoucmVuZGVyZWRBdHRyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRleHRBdHRyOiBkaXJlY3RpdmVBdHRyXG4gICAgICAgICAgYXR0ck5hbWU6IG5vZGUuZ2V0QXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICMgRmluZCB0aGUgY29udGFpbmVyIHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICBmaW5kQ29udGFpbmVyOiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICB2aWV3ID0gQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcbiAgICAgICAgICBzbmlwcGV0Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Q29udGFpbmVyVGFyZ2V0KG5vZGUpXG5cbiAgICAgICMgYWJvdmUgc25pcHBldFxuICAgICAgZWxzZSBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcmV0dXJuIEBnZXRTbmlwcGV0VGFyZ2V0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG5cbiAgICAgICMgYWJvdmUgcm9vdCBjb250YWluZXJcbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldFJvb3RUYXJnZXQobm9kZSlcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG5cbiAgZ2V0U25pcHBldFRhcmdldDogKGVsZW0sIHsgdG9wLCBsZWZ0LCBwb3NpdGlvbiB9KSAtPlxuICAgIHRhcmdldDogJ3NuaXBwZXQnXG4gICAgc25pcHBldFZpZXc6IEBnZXRTbmlwcGV0VmlldyhlbGVtKVxuICAgIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBAZ2V0UG9zaXRpb25PblNuaXBwZXQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0OiAoY2xvc2VzdFNuaXBwZXREYXRhKSAtPlxuICAgIGVsZW0gPSBjbG9zZXN0U25pcHBldERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RTbmlwcGV0RGF0YS5wb3NpdGlvblxuICAgIEBnZXRTbmlwcGV0VGFyZ2V0KGVsZW0sIHsgcG9zaXRpb24gfSlcblxuXG4gIGdldENvbnRhaW5lclRhcmdldDogKG5vZGUpIC0+XG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcbiAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcblxuICAgIHRhcmdldDogJ2NvbnRhaW5lcidcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFZpZXc6IEBmaW5kU25pcHBldFZpZXcobm9kZSlcbiAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG5cblxuICBnZXRSb290VGFyZ2V0OiAobm9kZSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9ICQobm9kZSkuZGF0YSgnc25pcHBldFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFRyZWU6IHNuaXBwZXRUcmVlXG5cblxuICAjIEZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgYSBzbmlwcGV0XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PblNuaXBwZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgaWYgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgJ2JlZm9yZSdcbiAgICBlbHNlXG4gICAgICAnYWZ0ZXInXG5cblxuICAjIEdldCB0aGUgY2xvc2VzdCBzbmlwcGV0IGluIGEgY29udGFpbmVyIGZvciBhIHRvcCBsZWZ0IHBvc2l0aW9uXG4gIGdldENsb3Nlc3RTbmlwcGV0OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRzbmlwcGV0cyA9ICQoY29udGFpbmVyKS5maW5kKFwiLiN7IGNzcy5zbmlwcGV0IH1cIilcbiAgICBjbG9zZXN0ID0gdW5kZWZpbmVkXG4gICAgY2xvc2VzdFNuaXBwZXQgPSB1bmRlZmluZWRcblxuICAgICRzbmlwcGV0cy5lYWNoIChpbmRleCwgZWxlbSkgPT5cbiAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYmVmb3JlJ31cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0U25pcHBldFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYSAtIGIgZWxzZSBiIC0gYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIHNuaXBwZXQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIFNuaXBwZXRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgIyBHZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCB3aXRoIHRvcCBhbmQgbGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnRcbiAgIyAoaWRlYWwgZm9yIGFic29sdXRlIHBvc2l0aW9uZWQgZWxlbWVudHMpXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAobm9kZSkgLT5cbiAgICB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICB7IHNjcm9sbFgsIHNjcm9sbFkgfSA9IEBnZXRTY3JvbGxQb3NpdGlvbih3aW4pXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiAgZ2V0U2Nyb2xsUG9zaXRpb246ICh3aW4pIC0+XG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYOiBpZiAod2luLnBhZ2VYT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVhPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWTogaWYgKHdpbi5wYWdlWU9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VZT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIHN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIHRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZCAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNvbmZpZy5jc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IC0+XG4gICAgQGRyYWdIYW5kbGVyLmRyb3AoKSBpZiBAc3RhcnRlZFxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nZHJhZ0Jsb2NrZXInPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKCcuZHJhZ0Jsb2NrZXInKS5yZW1vdmUoKVxuXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNvbmZpZy5jc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cXFwiPjxkaXY+PC9kaXY+PC9kaXY+XCIpXG4gICAgJGluZGljYXRvci5jc3MobGVmdDogcGFnZVgsIHRvcDogcGFnZVkpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRpbmRpY2F0b3IpXG5cblxuICByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3I6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjb25maWcuY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XCIpLnJlbW92ZSgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgaW5pdGlhbGl6ZWQgaW1tZWRpYXRlbHkgdG8gYWxsb3cgYSBsb25nLXByZXNzIGZpbmlzaFxuICBhZGRTdG9wTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgZXZlbnROYW1lcyA9XG4gICAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgICAndG91Y2hlbmQubGl2aW5nZG9jcy1kcmFnIHRvdWNoY2FuY2VsLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGxlYXZlLmxpdmluZ2RvY3MtZHJhZydcbiAgICAgIGVsc2VcbiAgICAgICAgJ21vdXNldXAubGl2aW5nZG9jcy1kcmFnJ1xuXG4gICAgQHBhZ2UuJGRvY3VtZW50Lm9uIGV2ZW50TmFtZXMsID0+XG4gICAgICBAZHJvcCgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIHNuaXBwZXREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIEVkaXRhYmxlSlMgQ29udHJvbGxlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW50ZWdyYXRlIEVkaXRhYmxlSlMgaW50byBMaXZpbmdkb2NzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlQ29udHJvbGxlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UpIC0+XG4gICAgIyBJbml0aWFsaXplIEVkaXRhYmxlSlNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGUod2luZG93OiBAcGFnZS53aW5kb3cpO1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG5cblxuICAjIFJlZ2lzdGVyIERPTSBub2RlcyB3aXRoIEVkaXRhYmxlSlMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IEVkaXRhYmxlSlNcbiAgI1xuICAjIEFsbCBsaXN0ZW5lcnMgcGFyYW1zIGdldCB0cmFuc2Zvcm1lZCBzbyB0aGV5IGdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWVcbiAgIyBpbnN0ZWFkIG9mIGVsZW1lbnQ6XG4gICNcbiAgIyBFeGFtcGxlOiBsaXN0ZW5lcih2aWV3LCBlZGl0YWJsZU5hbWUsIG90aGVyUGFyYW1zLi4uKVxuICB3aXRoQ29udGV4dDogKGZ1bmMpIC0+XG4gICAgKGVsZW1lbnQsIGFyZ3MuLi4pID0+XG4gICAgICB2aWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhlbGVtZW50KVxuICAgICAgZWRpdGFibGVOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoQGVkaXRhYmxlQXR0cilcbiAgICAgIGFyZ3MudW5zaGlmdCh2aWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB1cGRhdGVNb2RlbDogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2YWx1ZSA9IHZpZXcuZ2V0KGVkaXRhYmxlTmFtZSlcbiAgICBpZiBjb25maWcuc2luZ2xlTGluZUJyZWFrLnRlc3QodmFsdWUpIHx8IHZhbHVlID09ICcnXG4gICAgICB2YWx1ZSA9IHVuZGVmaW5lZFxuXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVCbHVycmVkKGVsZW1lbnQsIHZpZXcpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG5cbiAgICAgIHNuaXBwZXROYW1lID0gQHBhZ2UuZGVzaWduLnBhcmFncmFwaFNuaXBwZXRcbiAgICAgIHRlbXBsYXRlID0gQHBhZ2UuZGVzaWduLmdldChzbmlwcGV0TmFtZSlcbiAgICAgIGNvcHkgPSB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3Vmlld1xuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIG1lcmdlOiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcbiAgICAgIG1lcmdlZFZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiB2aWV3LnByZXYoKSBlbHNlIHZpZXcubmV4dCgpXG5cbiAgICAgIGlmIG1lcmdlZFZpZXcgJiYgbWVyZ2VkVmlldy50ZW1wbGF0ZSA9PSB2aWV3LnRlbXBsYXRlXG5cbiAgICAgICAgIyBjcmVhdGUgZG9jdW1lbnQgZnJhZ21lbnRcbiAgICAgICAgY29udGVudHMgPSB2aWV3LmRpcmVjdGl2ZXMuJGdldEVsZW0oZWRpdGFibGVOYW1lKS5jb250ZW50cygpXG4gICAgICAgIGZyYWcgPSBAcGFnZS5kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICAgICAgZm9yIGVsIGluIGNvbnRlbnRzXG4gICAgICAgICAgZnJhZy5hcHBlbmRDaGlsZChlbClcblxuICAgICAgICBtZXJnZWRWaWV3LmZvY3VzKClcbiAgICAgICAgZWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIGN1cnNvciA9IEBlZGl0YWJsZS5jcmVhdGVDdXJzb3IoZWxlbSwgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2VuZCcgZWxzZSAnYmVnaW5uaW5nJylcbiAgICAgICAgY3Vyc29yWyBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnaW5zZXJ0QWZ0ZXInIGVsc2UgJ2luc2VydEJlZm9yZScgXShmcmFnKVxuXG4gICAgICAgICMgTWFrZSBzdXJlIHRoZSBtb2RlbCBvZiB0aGUgbWVyZ2VkVmlldyBpcyB1cCB0byBkYXRlXG4gICAgICAgICMgb3RoZXJ3aXNlIGJ1Z3MgbGlrZSBpbiBpc3N1ZSAjNTYgY2FuIG9jY3VyLlxuICAgICAgICBjdXJzb3Iuc2F2ZSgpXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICAgIGN1cnNvci5yZXN0b3JlKClcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRTZWxlY3Rpb24oKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIHNwbGl0OiAodmlldywgZWRpdGFibGVOYW1lLCBiZWZvcmUsIGFmdGVyLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgICMgZ2V0IGNvbnRlbnQgb3V0IG9mICdiZWZvcmUnIGFuZCAnYWZ0ZXInXG4gICAgICBiZWZvcmVDb250ZW50ID0gYmVmb3JlLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcbiAgICAgIGFmdGVyQ29udGVudCA9IGFmdGVyLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcblxuICAgICAgIyBzZXQgZWRpdGFibGUgb2Ygc25pcHBldHMgdG8gaW5uZXJIVE1MIG9mIGZyYWdtZW50c1xuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBiZWZvcmVDb250ZW50KVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBhZnRlckNvbnRlbnQpXG5cbiAgICAgICMgYXBwZW5kIGFuZCBmb2N1cyBjb3B5IG9mIHNuaXBwZXRcbiAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgIHZpZXcubmV4dCgpLmZvY3VzKClcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBEb2N1bWVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBNYW5hZ2UgdGhlIHNuaXBwZXQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcblxuICAgIEBzbmlwcGV0Rm9jdXMgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIGVkaXRhYmxlTm9kZSAhPSBAZWRpdGFibGVOb2RlXG4gICAgICBAcmVzZXRFZGl0YWJsZSgpXG4gICAgICBAZWRpdGFibGVOb2RlID0gZWRpdGFibGVOb2RlXG5cbiAgICBpZiBzbmlwcGV0VmlldyAhPSBAc25pcHBldFZpZXdcbiAgICAgIEByZXNldFNuaXBwZXRWaWV3KClcbiAgICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0VmlldyA9IHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0Rm9jdXMuZmlyZShAc25pcHBldFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlICE9IGVkaXRhYmxlTm9kZVxuICAgICAgc25pcHBldFZpZXcgfHw9IGRvbS5maW5kU25pcHBldFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVCbHVycmVkOiAoZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgPT0gZWRpdGFibGVOb2RlXG4gICAgICBAc2V0Rm9jdXMoQHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICAjIGNhbGwgYWZ0ZXIgY2xpY2tcbiAgc25pcHBldEZvY3VzZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAc25pcHBldFZpZXcgIT0gc25pcHBldFZpZXdcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgYmx1cjogLT5cbiAgICBAc2V0Rm9jdXModW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRFZGl0YWJsZTogLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlXG4gICAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldFNuaXBwZXRWaWV3OiAtPlxuICAgIGlmIEBzbmlwcGV0Vmlld1xuICAgICAgcHJldmlvdXMgPSBAc25pcHBldFZpZXdcbiAgICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuICAgICAgQHNuaXBwZXRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuaXNTdXBwb3J0ZWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZCgnLmRyYWdCbG9ja2VyJylcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBzbmlwcGV0XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5zbmlwcGV0Vmlldz8ubW9kZWwgIT0gQHNuaXBwZXRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgICMgICAkY29udGFpbmVyID0gdGFyZ2V0LnNuaXBwZXRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcbiAgICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG5cblxuICBzbmlwcGV0UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuc25pcHBldFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYWZ0ZXInXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKGJlZm9yZSwgdGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5zbmlwcGV0Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdiZWZvcmUnXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKHRhcmdldC5zbmlwcGV0VmlldywgbmV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5TbmlwcGV0czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0XG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlcjogKHsgbGVmdCwgdG9wLCB3aWR0aCB9KSAtPlxuICAgIGlmIEBpZnJhbWVCb3g/XG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBpZnJhbWUgdmlld3BvcnRcbiAgICAgICRib2R5ID0gJChAaWZyYW1lQm94LndpbmRvdy5kb2N1bWVudC5ib2R5KVxuICAgICAgdG9wIC09ICRib2R5LnNjcm9sbFRvcCgpXG4gICAgICBsZWZ0IC09ICRib2R5LnNjcm9sbExlZnQoKVxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICBsZWZ0ICs9IEBpZnJhbWVCb3gubGVmdFxuICAgICAgdG9wICs9IEBpZnJhbWVCb3gudG9wXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGRvY3VtZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZylcbiAgICAgICMgdG9wICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wKClcbiAgICAgICMgbGVmdCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnQoKVxuXG4gICAgICAjIFdpdGggcG9zaXRpb24gZml4ZWQgd2UgZG9uJ3QgbmVlZCB0byB0YWtlIHNjcm9sbGluZyBpbnRvIGFjY291bnRcbiAgICAgICMgaW4gYW4gaWZyYW1lIHNjZW5hcmlvXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnZml4ZWQnKVxuICAgIGVsc2VcbiAgICAgICMgSWYgd2UncmUgbm90IGluIGFuIGlmcmFtZSBsZWZ0IGFuZCB0b3AgYXJlIGFscmVhZHlcbiAgICAgICMgdGhlIGFic29sdXRlIGNvb3JkaW5hdGVzXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnYWJzb2x1dGUnKVxuXG4gICAgQCRkcm9wTWFya2VyXG4gICAgLmNzc1xuICAgICAgbGVmdDogIFwiI3sgbGVmdCB9cHhcIlxuICAgICAgdG9wOiAgIFwiI3sgdG9wIH1weFwiXG4gICAgICB3aWR0aDogXCIjeyB3aWR0aCB9cHhcIlxuICAgIC5zaG93KClcblxuXG4gIG1ha2VTcGFjZTogKG5vZGUsIHBvc2l0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgd2lnZ2xlU3BhY2UgJiYgbm9kZT9cbiAgICAkbm9kZSA9ICQobm9kZSlcbiAgICBAbGFzdFRyYW5zZm9ybSA9ICRub2RlXG5cbiAgICBpZiBwb3NpdGlvbiA9PSAndG9wJ1xuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuICAgIGVsc2VcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC0jeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG5cblxuICB1bmRvTWFrZVNwYWNlOiAobm9kZSkgLT5cbiAgICBpZiBAbGFzdFRyYW5zZm9ybT9cbiAgICAgIEBsYXN0VHJhbnNmb3JtLmNzcyh0cmFuc2Zvcm06ICcnKVxuICAgICAgQGxhc3RUcmFuc2Zvcm0gPSB1bmRlZmluZWRcblxuXG4gIGhpZ2hsaWdoQ29udGFpbmVyOiAoJGNvbnRhaW5lcikgLT5cbiAgICBpZiAkY29udGFpbmVyWzBdICE9IEAkaGlnaGxpZ2h0ZWRDb250YWluZXJbMF1cbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0gJGNvbnRhaW5lclxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5hZGRDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcblxuXG4gIHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodDogLT5cbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBwYWdlWCwgcGFnZVk6IGFic29sdXRlIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50KVxuICAjIGNsaWVudFgsIGNsaWVudFk6IGZpeGVkIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0KVxuICBnZXRFbGVtVW5kZXJDdXJzb3I6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIGVsZW0gPSB1bmRlZmluZWRcbiAgICBAdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQgPT5cbiAgICAgIHsgY2xpZW50WCwgY2xpZW50WSB9ID0gZXZlbnRQb3NpdGlvblxuICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcbiAgICAgIGlmIGVsZW0/Lm5vZGVOYW1lID09ICdJRlJBTUUnXG4gICAgICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGZpbmRFbGVtSW5JZnJhbWUoZWxlbSwgZXZlbnRQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgQGlmcmFtZUJveCA9IHVuZGVmaW5lZFxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gIGZpbmRFbGVtSW5JZnJhbWU6IChpZnJhbWVFbGVtLCBldmVudFBvc2l0aW9uKSAtPlxuICAgIEBpZnJhbWVCb3ggPSBib3ggPSBpZnJhbWVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgQGlmcmFtZUJveC53aW5kb3cgPSBpZnJhbWVFbGVtLmNvbnRlbnRXaW5kb3dcbiAgICBkb2N1bWVudCA9IGlmcmFtZUVsZW0uY29udGVudERvY3VtZW50XG4gICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG5cbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFggLT0gYm94LmxlZnRcbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFkgLT0gYm94LnRvcFxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVggPSBldmVudFBvc2l0aW9uLmNsaWVudFggKyAkYm9keS5zY3JvbGxMZWZ0KClcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VZID0gZXZlbnRQb3NpdGlvbi5jbGllbnRZICsgJGJvZHkuc2Nyb2xsVG9wKClcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudFBvc2l0aW9uLmNsaWVudFgsIGV2ZW50UG9zaXRpb24uY2xpZW50WSlcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICAjIFJlbW92ZSBlbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yIHdoaWNoIGNvdWxkIGludGVyZmVyZVxuICAjIHdpdGggZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCgpXG4gIHVuYmxvY2tFbGVtZW50RnJvbVBvaW50OiAoY2FsbGJhY2spIC0+XG5cbiAgICAjIFBvaW50ZXIgRXZlbnRzIGFyZSBhIGxvdCBmYXN0ZXIgc2luY2UgdGhlIGJyb3dzZXIgZG9lcyBub3QgbmVlZFxuICAgICMgdG8gcmVwYWludCB0aGUgd2hvbGUgc2NyZWVuLiBJRSA5IGFuZCAxMCBkbyBub3Qgc3VwcG9ydCB0aGVtLlxuICAgIGlmIGlzU3VwcG9ydGVkKCdodG1sUG9pbnRlckV2ZW50cycpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnYXV0bycpXG4gICAgZWxzZVxuICAgICAgQCRkcmFnQmxvY2tlci5oaWRlKClcbiAgICAgIEAkcGxhY2Vob2xkZXIuaGlkZSgpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLnNob3coKVxuICAgICAgQCRwbGFjZWhvbGRlci5zaG93KClcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLnNuaXBwZXRXYXNEcm9wcGVkLmZpcmUoQHNuaXBwZXRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIHNuaXBwZXQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBzbmlwcGV0VmlldyA9IHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5iZWZvcmUoQHNuaXBwZXRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmFmdGVyKEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHRhcmdldC5zbmlwcGV0Vmlldy5tb2RlbFxuICAgICAgICBzbmlwcGV0TW9kZWwuYXBwZW5kKHRhcmdldC5jb250YWluZXJOYW1lLCBAc25pcHBldE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgc25pcHBldFRyZWUgPSB0YXJnZXQuc25pcHBldFRyZWVcbiAgICAgICAgc25pcHBldFRyZWUucHJlcGVuZChAc25pcHBldE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwiIyBDYW4gcmVwbGFjZSB4bWxkb20gaW4gdGhlIGJyb3dzZXIuXG4jIE1vcmUgYWJvdXQgeG1sZG9tOiBodHRwczovL2dpdGh1Yi5jb20vamluZHcveG1sZG9tXG4jXG4jIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuIyBET01QYXJzZXIgYW5kIFhNTFNlcmlhbGl6ZXIgYXJlIGFscmVhZHkgbmF0aXZlIG9iamVjdHMuXG5cbiMgRE9NUGFyc2VyXG5leHBvcnRzLkRPTVBhcnNlciA9IGNsYXNzIERPTVBhcnNlclNoaW1cblxuICBwYXJzZUZyb21TdHJpbmc6ICh4bWxUZW1wbGF0ZSkgLT5cbiAgICAjIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpIGRvZXMgbm90IHdvcmsgdGhlIHNhbWVcbiAgICAjIGluIHRoZSBicm93c2VyIGFzIHdpdGggeG1sZG9tLiBTbyB3ZSB1c2UgalF1ZXJ5IHRvIG1ha2UgdGhpbmdzIHdvcmsuXG4gICAgJC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcblxuXG4jIFhNTFNlcmlhbGl6ZXJcbmV4cG9ydHMuWE1MU2VyaWFsaXplciA9IFhNTFNlcmlhbGl6ZXJcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaHRtbFBvaW50ZXJFdmVudHM6IC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gnKVxuICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJ1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPT0gJ2F1dG8nXG4iLCJkZXRlY3RzID0gcmVxdWlyZSgnLi9mZWF0dXJlX2RldGVjdHMnKVxuXG5leGVjdXRlZFRlc3RzID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSAobmFtZSkgLT5cbiAgaWYgKHJlc3VsdCA9IGV4ZWN1dGVkVGVzdHNbbmFtZV0pID09IHVuZGVmaW5lZFxuICAgIGV4ZWN1dGVkVGVzdHNbbmFtZV0gPSBCb29sZWFuKGRldGVjdHNbbmFtZV0oKSlcbiAgZWxzZVxuICAgIHJlc3VsdFxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgc25pcHBldHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJsb2cgPSByZXF1aXJlKCcuL2xvZycpXG5cbiMgRnVuY3Rpb24gdG8gYXNzZXJ0IGEgY29uZGl0aW9uLiBJZiB0aGUgY29uZGl0aW9uIGlzIG5vdCBtZXQsIGFuIGVycm9yIGlzXG4jIHJhaXNlZCB3aXRoIHRoZSBzcGVjaWZpZWQgbWVzc2FnZS5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBhc3NlcnQgYSBpc250IGIsICdhIGNhbiBub3QgYmUgYidcbiNcbm1vZHVsZS5leHBvcnRzID0gYXNzZXJ0ID0gKGNvbmRpdGlvbiwgbWVzc2FnZSkgLT5cbiAgbG9nLmVycm9yKG1lc3NhZ2UpIHVubGVzcyBjb25kaXRpb25cbiIsIlxuIyBMb2cgSGVscGVyXG4jIC0tLS0tLS0tLS1cbiMgRGVmYXVsdCBsb2dnaW5nIGhlbHBlclxuIyBAcGFyYW1zOiBwYXNzIGBcInRyYWNlXCJgIGFzIGxhc3QgcGFyYW1ldGVyIHRvIG91dHB1dCB0aGUgY2FsbCBzdGFja1xubW9kdWxlLmV4cG9ydHMgPSBsb2cgPSAoYXJncy4uLikgLT5cbiAgaWYgd2luZG93LmNvbnNvbGU/XG4gICAgaWYgYXJncy5sZW5ndGggYW5kIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAndHJhY2UnXG4gICAgICBhcmdzLnBvcCgpXG4gICAgICB3aW5kb3cuY29uc29sZS50cmFjZSgpIGlmIHdpbmRvdy5jb25zb2xlLnRyYWNlP1xuXG4gICAgd2luZG93LmNvbnNvbGUubG9nLmFwcGx5KHdpbmRvdy5jb25zb2xlLCBhcmdzKVxuICAgIHVuZGVmaW5lZFxuXG5cbmRvIC0+XG5cbiAgIyBDdXN0b20gZXJyb3IgdHlwZSBmb3IgbGl2aW5nZG9jcy5cbiAgIyBXZSBjYW4gdXNlIHRoaXMgdG8gdHJhY2sgdGhlIG9yaWdpbiBvZiBhbiBleHBlY3Rpb24gaW4gdW5pdCB0ZXN0cy5cbiAgY2xhc3MgTGl2aW5nZG9jc0Vycm9yIGV4dGVuZHMgRXJyb3JcblxuICAgIGNvbnN0cnVjdG9yOiAobWVzc2FnZSkgLT5cbiAgICAgIHN1cGVyXG4gICAgICBAbWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgIEB0aHJvd25CeUxpdmluZ2RvY3MgPSB0cnVlXG5cblxuICAjIEBwYXJhbSBsZXZlbDogb25lIG9mIHRoZXNlIHN0cmluZ3M6XG4gICMgJ2NyaXRpY2FsJywgJ2Vycm9yJywgJ3dhcm5pbmcnLCAnaW5mbycsICdkZWJ1ZydcbiAgbm90aWZ5ID0gKG1lc3NhZ2UsIGxldmVsID0gJ2Vycm9yJykgLT5cbiAgICBpZiBfcm9sbGJhcj9cbiAgICAgIF9yb2xsYmFyLnB1c2ggbmV3IEVycm9yKG1lc3NhZ2UpLCAtPlxuICAgICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKSBhbmQgd2luZG93LmNvbnNvbGU/LmVycm9yP1xuICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmVycm9yLmNhbGwod2luZG93LmNvbnNvbGUsIG1lc3NhZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG4gICAgZWxzZVxuICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJylcbiAgICAgICAgdGhyb3cgbmV3IExpdmluZ2RvY3NFcnJvcihtZXNzYWdlKVxuICAgICAgZWxzZVxuICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG5cbiAgICB1bmRlZmluZWRcblxuXG4gIGxvZy5kZWJ1ZyA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZGVidWcnKSB1bmxlc3MgbG9nLmRlYnVnRGlzYWJsZWRcblxuXG4gIGxvZy53YXJuID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICd3YXJuaW5nJykgdW5sZXNzIGxvZy53YXJuaW5nc0Rpc2FibGVkXG5cblxuICAjIExvZyBlcnJvciBhbmQgdGhyb3cgZXhjZXB0aW9uXG4gIGxvZy5lcnJvciA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZXJyb3InKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBUaGlzIGNsYXNzIGNhbiBiZSB1c2VkIHRvIHdhaXQgZm9yIHRhc2tzIHRvIGZpbmlzaCBiZWZvcmUgZmlyaW5nIGEgc2VyaWVzIG9mXG4jIGNhbGxiYWNrcy4gT25jZSBzdGFydCgpIGlzIGNhbGxlZCwgdGhlIGNhbGxiYWNrcyBmaXJlIGFzIHNvb24gYXMgdGhlIGNvdW50XG4jIHJlYWNoZXMgMC4gVGh1cywgeW91IHNob3VsZCBpbmNyZW1lbnQgdGhlIGNvdW50IGJlZm9yZSBzdGFydGluZyBpdC4gV2hlblxuIyBhZGRpbmcgYSBjYWxsYmFjayBhZnRlciBoYXZpbmcgZmlyZWQgY2F1c2VzIHRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgcmlnaHRcbiMgYXdheS4gSW5jcmVtZW50aW5nIHRoZSBjb3VudCBhZnRlciBpdCBmaXJlZCByZXN1bHRzIGluIGFuIGVycm9yLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuI1xuIyAgIHNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuIyAgIGRvU29tZXRoaW5nKCkudGhlbihzZW1hcGhvcmUuZGVjcmVtZW50KCkpXG4jXG4jICAgZG9Bbm90aGVyVGhpbmdUaGF0VGFrZXNBQ2FsbGJhY2soc2VtYXBob3JlLndhaXQoKSlcbiNcbiMgICBzZW1hcGhvcmUuc3RhcnQoKVxuI1xuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgnaGVsbG8nKSlcbiNcbiMgICAjIE9uY2UgY291bnQgcmVhY2hlcyAwIGNhbGxiYWNrIGlzIGV4ZWN1dGVkOlxuIyAgICMgPT4gJ2hlbGxvJ1xuI1xuIyAgICMgQXNzdW1pbmcgdGhhdCBzZW1hcGhvcmUgd2FzIGFscmVhZHkgZmlyZWQ6XG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknKSlcbiMgICAjID0+ICd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlbWFwaG9yZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb3VudCA9IDBcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgQHdhc0ZpcmVkID0gZmFsc2VcbiAgICBAY2FsbGJhY2tzID0gW11cblxuXG4gIGFkZENhbGxiYWNrOiAoY2FsbGJhY2spIC0+XG4gICAgaWYgQHdhc0ZpcmVkXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgQGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAd2FzRmlyZWRcblxuXG4gIHN0YXJ0OiAtPlxuICAgIGFzc2VydCBub3QgQHN0YXJ0ZWQsXG4gICAgICBcIlVuYWJsZSB0byBzdGFydCBTZW1hcGhvcmUgb25jZSBzdGFydGVkLlwiXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIGluY3JlbWVudDogLT5cbiAgICBhc3NlcnQgbm90IEB3YXNGaXJlZCxcbiAgICAgIFwiVW5hYmxlIHRvIGluY3JlbWVudCBjb3VudCBvbmNlIFNlbWFwaG9yZSBpcyBmaXJlZC5cIlxuICAgIEBjb3VudCArPSAxXG5cblxuICBkZWNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IEBjb3VudCA+IDAsXG4gICAgICBcIlVuYWJsZSB0byBkZWNyZW1lbnQgY291bnQgcmVzdWx0aW5nIGluIG5lZ2F0aXZlIGNvdW50LlwiXG4gICAgQGNvdW50IC09IDFcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgd2FpdDogLT5cbiAgICBAaW5jcmVtZW50KClcbiAgICA9PiBAZGVjcmVtZW50KClcblxuXG4gICMgQHByaXZhdGVcbiAgZmlyZUlmUmVhZHk6IC0+XG4gICAgaWYgQGNvdW50ID09IDAgJiYgQHN0YXJ0ZWQgPT0gdHJ1ZVxuICAgICAgQHdhc0ZpcmVkID0gdHJ1ZVxuICAgICAgY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gQGNhbGxiYWNrc1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlzRW1wdHk6IChvYmopIC0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIG9iaj9cbiAgICBmb3IgbmFtZSBvZiBvYmpcbiAgICAgIHJldHVybiBmYWxzZSBpZiBvYmouaGFzT3duUHJvcGVydHkobmFtZSlcblxuICAgIHRydWVcblxuXG4gIGZsYXRDb3B5OiAob2JqKSAtPlxuICAgIGNvcHkgPSB1bmRlZmluZWRcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBvYmpcbiAgICAgIGNvcHkgfHw9IHt9XG4gICAgICBjb3B5W25hbWVdID0gdmFsdWVcblxuICAgIGNvcHlcbiIsIiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cbiAgY2FtZWxpemU6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgICAgIGMudG9VcHBlckNhc2UoKVxuICAgIClcblxuICB0cmltOiAoc3RyKSAtPlxuICAgIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblxuXG4gICMgY2FtZWxpemU6IChzdHIpIC0+XG4gICMgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAjICAgICBjLnRvVXBwZXJDYXNlKClcblxuICAjIGNsYXNzaWZ5OiAoc3RyKSAtPlxuICAjICAgJC50aXRsZWl6ZShTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXFxXX10vZywgJyAnKSkucmVwbGFjZSgvXFxzL2csICcnKVxuXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBlbXB0eVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICAjIEVzY2FwZSB0aGUgVVJJIGluIGNhc2UgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgJygnIG9yICcpJyBhcmUgcHJlc2VudC5cbiAgIyBUaGUgZXNjYXBpbmcgb25seSBoYXBwZW5zIGlmIGl0IGlzIG5lZWRlZCBzaW5jZSB0aGlzIGRvZXMgbm90IHdvcmsgaW4gbm9kZS5cbiAgIyBXaGVuIHRoZSBVUkkgaXMgZXNjYXBlZCBpbiBub2RlIHRoZSBiYWNrZ3JvdW5kLWltYWdlIGlzIG5vdCB3cml0dGVuIHRvIHRoZVxuICAjIHN0eWxlIGF0dHJpYnV0ZS5cbiAgZXNjYXBlQ3NzVXJpOiAodXJpKSAtPlxuICAgIGlmIC9bKCldLy50ZXN0KHVyaSlcbiAgICAgIFwiJyN7IHVyaSB9J1wiXG4gICAgZWxzZVxuICAgICAgdXJpXG5cblxuICBpc0Jhc2U2NDogKHZhbHVlKSAtPlxuICAgIHZhbHVlLmluZGV4T2YoJ2RhdGE6aW1hZ2UnKSA9PSAwXG5cblxuICBpc0ltZ1RhZzogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2ltZydcbiIsIkRlZmF1bHRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2VfbWFuYWdlcicpXG5SZXNyY2l0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9yZXNyY2l0X2ltYWdlX21hbmFnZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVmYXVsdEltYWdlTWFuYWdlciA9IG5ldyBEZWZhdWx0SW1hZ2VNYW5hZ2VyKClcbiAgcmVzcmNpdEltYWdlTWFuYWdlciA9IG5ldyBSZXNyY2l0SW1hZ2VNYW5hZ2VyKClcblxuXG4gIHNldDogKCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKSAtPlxuICAgIGltYWdlTWFuYWdlciA9IEBfZ2V0SW1hZ2VNYW5hZ2VyKGltYWdlU2VydmljZSlcbiAgICBpbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSlcblxuXG4gIF9nZXRJbWFnZU1hbmFnZXI6IChpbWFnZVNlcnZpY2UpIC0+XG4gICAgc3dpdGNoIGltYWdlU2VydmljZVxuICAgICAgd2hlbiAncmVzcmMuaXQnIHRoZW4gcmVzcmNpdEltYWdlTWFuYWdlclxuICAgICAgZWxzZVxuICAgICAgICBkZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cblxuICBnZXREZWZhdWx0SW1hZ2VNYW5hZ2VyOiAtPlxuICAgIGRlZmF1bHRJbWFnZU1hbmFnZXJcblxuXG4gIGdldFJlc3JjaXRJbWFnZU1hbmFnZXI6IC0+XG4gICAgcmVzcmNpdEltYWdlTWFuYWdlclxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0VHJlZSwgQHJlbmRlcmluZ0NvbnRhaW5lciwgJHdyYXBwZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQHNuaXBwZXRWaWV3cyA9IHt9XG5cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAcmVuZGVyT25jZVBhZ2VSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIHNuaXBwZXRUcmVlIGluIHRoZSAkcm9vdCBub2RlLlxuICAgICMgU29tZSBkb20uY29mZmVlIG1ldGhvZHMgbmVlZCBpdCB0byBnZXQgaG9sZCBvZiB0aGUgc25pcHBldCB0cmVlXG4gICAgQCRyb290LmRhdGEoJ3NuaXBwZXRUcmVlJywgQHNuaXBwZXRUcmVlKVxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBTbmlwcGV0IFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0QWRkZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0QWRkZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldFJlbW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0TW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0TW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgc25pcHBldEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgc25pcHBldEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgc25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0U25pcHBldDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwpXG5cbiAgICBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignU25pcHBldCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIHNuaXBwZXRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcbiAgICBzbmlwcGV0Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5zbmlwcGV0Vmlld1dhc0luc2VydGVkKHNuaXBwZXRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZFNuaXBwZXRzKG1vZGVsKVxuXG5cbiAgaXNTbmlwcGV0QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkU25pcHBldHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNTbmlwcGV0QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydFNuaXBwZXQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydFNuaXBwZXRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yU25pcHBldChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvclNuaXBwZXQobW9kZWwpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQoY29udGFpbmVyLnBhcmVudFNuaXBwZXQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJEZWZhdWx0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX21hbmFnZXInKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzY3JpdEltYWdlTWFuYWdlciBleHRlbmRzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBAcmVzcmNpdFVybDogJ2h0dHA6Ly9hcHAucmVzcmMuaXQvJ1xuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBlbXB0eVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB2YWx1ZSkgaWYgQGlzQmFzZTY0KHZhbHVlKVxuXG4gICAgYXNzZXJ0IHZhbHVlPyAmJiB2YWx1ZSAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICAkZWxlbS5hZGRDbGFzcygncmVzcmMnKVxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgIEByZXNldFNyY0F0dHJpYnV0ZSgkZWxlbSkgaWYgJGVsZW0uYXR0cignc3JjJykgJiYgQGlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCBcIiN7UmVzY3JpdEltYWdlTWFuYWdlci5yZXNyY2l0VXJsfSN7dmFsdWV9XCIpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgcmVzZXRTcmNBdHRyaWJ1dGU6ICgkZWxlbSkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuSW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50LCBAbW9kZWwudGVtcG9yYXJ5Q29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQsIHNlc3Npb25Db250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBpZiBzZXNzaW9uQ29udGVudFtuYW1lXT9cbiAgICAgICAgQHNldChuYW1lLCBzZXNzaW9uQ29udGVudFtuYW1lXSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIHZhbHVlXG4gICAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylbbmFtZV0gaWYgQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpXG4gICAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAc25pcHBldFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgaG9zdFdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3dcbiAgICAgIGRlc2lnbjogQHNuaXBwZXRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG4gICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSB9PXt9KSAtPlxuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdjbGljay5saXZpbmdkb2NzJywgJC5wcm94eShAY2xpY2ssIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlP1xuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0Vmlld1xuXG4gICAgQHN0YXJ0RHJhZ1xuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjbGljazogKGV2ZW50KSAtPlxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcblxuICAgICMgdG9kbzogaWYgYSB1c2VyIGNsaWNrZWQgb24gYSBtYXJnaW4gb2YgYSBzbmlwcGV0IGl0IHNob3VsZFxuICAgICMgc3RpbGwgZ2V0IHNlbGVjdGVkLiAoaWYgYSBzbmlwcGV0IGlzIGZvdW5kIGJ5IHBhcmVudFNuaXBwZXRcbiAgICAjIGFuZCB0aGF0IHNuaXBwZXQgaGFzIG5vIGNoaWxkcmVuIHdlIGRvIG5vdCBuZWVkIHRvIHNlYXJjaClcblxuICAgICMgaWYgc25pcHBldCBoYXNDaGlsZHJlbiwgbWFrZSBzdXJlIHdlIGRpZG4ndCB3YW50IHRvIHNlbGVjdFxuICAgICMgYSBjaGlsZFxuXG4gICAgIyBpZiBubyBzbmlwcGV0IHdhcyBzZWxlY3RlZCBjaGVjayBpZiB0aGUgdXNlciB3YXMgbm90IGNsaWNraW5nXG4gICAgIyBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXRcblxuICAgICMgdG9kbzogY2hlY2sgaWYgdGhlIGNsaWNrIHdhcyBtZWFudCBmb3IgYSBzbmlwcGV0IGNvbnRhaW5lclxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAZm9jdXMuc25pcHBldEZvY3VzZWQoc25pcHBldFZpZXcpXG5cbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIHNldFJlbmRlck5vZGU6IChyZW5kZXJOb2RlKSAtPlxuICAgIHJlbmRlck5vZGUgPz0gJChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiLCBAJGJvZHkpXG4gICAgaWYgcmVuZGVyTm9kZS5qcXVlcnlcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVswXVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJOb2RlID0gcmVuZGVyTm9kZVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgaWYgQGRlc2lnbj8gJiYgY29uZmlnLmxvYWRSZXNvdXJjZXNcbiAgICAgIGRlc2lnblBhdGggPSBcIiN7IGNvbmZpZy5kZXNpZ25QYXRoIH0vI3sgQGRlc2lnbi5uYW1lc3BhY2UgfVwiXG4gICAgICBjc3NMb2NhdGlvbiA9IGlmIEBkZXNpZ24uY3NzP1xuICAgICAgICBAZGVzaWduLmNzc1xuICAgICAgZWxzZVxuICAgICAgICAnL2Nzcy9zdHlsZS5jc3MnXG5cbiAgICAgIHBhdGggPSBcIiN7IGRlc2lnblBhdGggfSN7IGNzc0xvY2F0aW9uIH1cIlxuICAgICAgQGNzc0xvYWRlci5sb2FkKHBhdGgsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICBzZXRXaW5kb3c6IChob3N0V2luZG93KSAtPlxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93IHx8IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxuIyBBIFJlbmRlcmluZ0NvbnRhaW5lciBpcyB1c2VkIGJ5IHRoZSBSZW5kZXJlciB0byBnZW5lcmF0ZSBIVE1MLlxuI1xuIyBUaGUgUmVuZGVyZXIgaW5zZXJ0cyBTbmlwcGV0Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPSAkKCc8ZGl2Lz4nKVswXVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEBiZWZvcmVSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGh0bWw6IC0+XG4gICAgJChAcmVuZGVyTm9kZSkuaHRtbCgpXG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3Igc25pcHBldHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIFNuaXBwZXRBcnJheSB0aGF0IHdvcmtzIHNpbWlsYXIgdG8gYSBqUXVlcnkgb2JqZWN0LlxuIyBGb3IgZXh0ZW5zaWJpbGl0eSB2aWEgcGx1Z2lucyB3ZSBleHBvc2UgdGhlIHByb3RvdHlwZSBvZiBTbmlwcGV0QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0QXJyYXlcblxuXG4gICMgQHBhcmFtIHNuaXBwZXRzOiBhcnJheSBvZiBzbmlwcGV0c1xuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0cykgLT5cbiAgICBAc25pcHBldHMgPSBbXSB1bmxlc3MgQHNuaXBwZXRzP1xuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAc25pcHBldHNcbiAgICAgIEBbaW5kZXhdID0gcmVzdWx0XG5cbiAgICBAbGVuZ3RoID0gQHNuaXBwZXRzLmxlbmd0aFxuICAgIGlmIEBzbmlwcGV0cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAc25pcHBldHMubGVuZ3RoIC0gMV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3Igc25pcHBldCBpbiBAc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICByZW1vdmU6ICgpIC0+XG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBTbmlwcGV0Q29udGFpbmVyXG4jIC0tLS0tLS0tLS0tLS0tLS1cbiMgQSBTbmlwcGV0Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2Ygc25pcHBldHMuXG4jXG4jIFRoZSBzbmlwcGV0Q29udGFpbmVyIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIGl0cyBzbmlwcGV0VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBzbmlwcGV0IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgcGFyZW50U25pcHBldDogcGFyZW50IFNuaXBwZXRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Q29udGFpbmVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQHBhcmVudFNuaXBwZXQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIEBhdHRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBwYXJlbnRTbmlwcGV0XG4gICAgICBhc3NlcnQgc25pcHBldCBpc250IEBwYXJlbnRTbmlwcGV0LCAnY2Fubm90IGFwcGVuZCBzbmlwcGV0IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5wcmV2aW91cyA9PSBpbnNlcnRlZFNuaXBwZXRcbiAgICBhc3NlcnQgc25pcHBldCBpc250IGluc2VydGVkU25pcHBldCwgJ2Nhbm5vdCBpbnNlcnQgc25pcHBldCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXQucHJldmlvdXNcbiAgICAgIG5leHQ6IHNuaXBwZXRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKHNuaXBwZXQsIGluc2VydGVkU25pcHBldCkgLT5cbiAgICByZXR1cm4gaWYgc25pcHBldC5uZXh0ID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBzbmlwcGV0XG4gICAgICBuZXh0OiBzbmlwcGV0Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hTbmlwcGV0KGluc2VydGVkU25pcHBldCwgcG9zaXRpb24pXG5cblxuICB1cDogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5wcmV2aW91cz9cbiAgICAgIEBpbnNlcnRCZWZvcmUoc25pcHBldC5wcmV2aW91cywgc25pcHBldClcblxuXG4gIGRvd246IChzbmlwcGV0KSAtPlxuICAgIGlmIHNuaXBwZXQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihzbmlwcGV0Lm5leHQsIHNuaXBwZXQpXG5cblxuICBnZXRTbmlwcGV0VHJlZTogLT5cbiAgICBAc25pcHBldFRyZWUgfHwgQHBhcmVudFNuaXBwZXQ/LnNuaXBwZXRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldCA9IEBmaXJzdFxuICAgIHdoaWxlIChzbmlwcGV0KVxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgc25pcHBldHMgYW5kIGNvbnRhaW5lcnNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXQpXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldC5kZXN0cm95KClcbiAgICBAX2RldGFjaFNuaXBwZXQoc25pcHBldClcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgRXZlcnkgc25pcHBldCBhZGRlZCBvciBtb3ZlZCBtb3N0IGNvbWUgdGhyb3VnaCBoZXJlLlxuICAjIE5vdGlmaWVzIHRoZSBzbmlwcGV0VHJlZSBpZiB0aGUgcGFyZW50IHNuaXBwZXQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQGFwaSBwcml2YXRlXG4gIGF0dGFjaFNuaXBwZXQ6IChzbmlwcGV0LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoc25pcHBldCwgcG9zaXRpb24pXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5hdHRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IHNuaXBwZXQgdGhhdCBpcyByZW1vdmVkIG11c3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBTbmlwcGV0cyB0aGF0IGFyZSBtb3ZlZCBpbnNpZGUgYSBzbmlwcGV0VHJlZSBzaG91bGQgbm90XG4gICMgY2FsbCBfZGV0YWNoU25pcHBldCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBTbmlwcGV0UmVtb3ZlZCBldmVudHMgb24gdGhlIHNuaXBwZXQgdHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaFNuaXBwZXQ6IChzbmlwcGV0KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQHVubGluayhzbmlwcGV0KVxuXG4gICAgaWYgc25pcHBldFRyZWUgPSBAZ2V0U25pcHBldFRyZWUoKVxuICAgICAgc25pcHBldFRyZWUuZGV0YWNoaW5nU25pcHBldChzbmlwcGV0LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgbGluazogKHNuaXBwZXQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoc25pcHBldCkgaWYgc25pcHBldC5wYXJlbnRDb250YWluZXJcblxuICAgIHBvc2l0aW9uLnBhcmVudENvbnRhaW5lciB8fD0gdGhpc1xuICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwgcG9zaXRpb24pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICB1bmxpbms6IChzbmlwcGV0KSAtPlxuICAgIGNvbnRhaW5lciA9IHNuaXBwZXQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gc25pcHBldC5uZXh0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgY29udGFpbmVyLmxhc3QgPSBzbmlwcGV0LnByZXZpb3VzIHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cbiAgICAgICMgdXBkYXRlIHByZXZpb3VzIGFuZCBuZXh0IG5vZGVzXG4gICAgICBzbmlwcGV0Lm5leHQ/LnByZXZpb3VzID0gc25pcHBldC5wcmV2aW91c1xuICAgICAgc25pcHBldC5wcmV2aW91cz8ubmV4dCA9IHNuaXBwZXQubmV4dFxuXG4gICAgICBAc2V0U25pcHBldFBvc2l0aW9uKHNuaXBwZXQsIHt9KVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgc2V0U25pcHBldFBvc2l0aW9uOiAoc25pcHBldCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgc25pcHBldC5wYXJlbnRDb250YWluZXIgPSBwYXJlbnRDb250YWluZXJcbiAgICBzbmlwcGV0LnByZXZpb3VzID0gcHJldmlvdXNcbiAgICBzbmlwcGV0Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBzbmlwcGV0IGlmIHByZXZpb3VzXG4gICAgICBuZXh0LnByZXZpb3VzID0gc25pcHBldCBpZiBuZXh0XG4gICAgICBwYXJlbnRDb250YWluZXIuZmlyc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgcGFyZW50Q29udGFpbmVyLmxhc3QgPSBzbmlwcGV0IHVubGVzcyBzbmlwcGV0Lm5leHQ/XG5cblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblNuaXBwZXRDb250YWluZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfY29udGFpbmVyJylcbmd1aWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2d1aWQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgU25pcHBldE1vZGVsXG4jIC0tLS0tLS0tLS0tLVxuIyBFYWNoIFNuaXBwZXRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBzbmlwcGV0Vmlld1xuIyBmcm9tIGEgc25pcHBldE1vZGVsXG4jXG4jIFJlcHJlc2VudHMgYSBub2RlIGluIGEgU25pcHBldFRyZWUuXG4jIEV2ZXJ5IFNuaXBwZXRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoU25pcHBldENvbnRhaW5lciksXG4jIHNpYmxpbmdzIChvdGhlciBzbmlwcGV0cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKFNuaXBwZXRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBTbmlwcGV0TW9kZWxzLlxuIyBFLmcuIGEgZ3JpZCByb3cgd291bGQgaGF2ZSBhcyBtYW55IGNvbnRhaW5lcnMgYXMgaXQgaGFzXG4jIGNvbHVtbnNcbiNcbiMgIyBAcHJvcCBwYXJlbnRDb250YWluZXI6IHBhcmVudCBTbmlwcGV0Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIHNuaXBwZXQgd2l0aG91dCB0ZW1wbGF0ZSByZWZlcmVuY2UnXG5cbiAgICBAaW5pdGlhbGl6ZURpcmVjdGl2ZXMoKVxuICAgIEBzdHlsZXMgPSB7fVxuICAgIEBkYXRhVmFsdWVzID0ge31cbiAgICBAdGVtcG9yYXJ5Q29udGVudCA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAaWRlbnRpZmllciA9IEB0ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAc25pcHBldFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gQHRlbXBsYXRlLmRpcmVjdGl2ZXNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICAgICAgQGNvbnRhaW5lcnNbZGlyZWN0aXZlLm5hbWVdID0gbmV3IFNuaXBwZXRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRTbmlwcGV0OiB0aGlzXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIFNuaXBwZXRNb2RlbFwiXG5cblxuICBjcmVhdGVWaWV3OiAoaXNSZWFkT25seSkgLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlVmlldyh0aGlzLCBpc1JlYWRPbmx5KVxuXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICBiZWZvcmU6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQHByZXZpb3VzXG5cblxuICBhZnRlcjogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QWZ0ZXIodGhpcywgc25pcHBldE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBuZXh0XG5cblxuICBhcHBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5hcHBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHByZXBlbmQ6IChjb250YWluZXJOYW1lLCBzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBzbmlwcGV0TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICByZXNldFZvbGF0aWxlVmFsdWU6IChuYW1lLCB0cmlnZ2VyQ2hhbmdlRXZlbnQ9dHJ1ZSkgLT5cbiAgICBkZWxldGUgQHRlbXBvcmFyeUNvbnRlbnRbbmFtZV1cbiAgICBpZiB0cmlnZ2VyQ2hhbmdlRXZlbnRcbiAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSwgZmxhZz0nJykgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGlmIGZsYWcgPT0gJ3RlbXBvcmFyeU92ZXJyaWRlJ1xuICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IEB0ZW1wb3JhcnlDb250ZW50XG4gICAgZWxzZVxuICAgICAgQHJlc2V0Vm9sYXRpbGVWYWx1ZShuYW1lLCBmYWxzZSkgIyBhcyBzb29uIGFzIHdlIGdldCByZWFsIGNvbnRlbnQsIHJlc2V0IHRoZSB0ZW1wb3JhcnlDb250ZW50XG4gICAgICBzdG9yYWdlQ29udGFpbmVyID0gQGNvbnRlbnRcblxuICAgIGlmIHN0b3JhZ2VDb250YWluZXJbbmFtZV0gIT0gdmFsdWVcbiAgICAgIHN0b3JhZ2VDb250YWluZXJbbmFtZV0gPSB2YWx1ZVxuICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwiZ2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBAY29udGVudFtuYW1lXVxuXG5cbiAgIyBjYW4gYmUgY2FsbGVkIHdpdGggYSBzdHJpbmcgb3IgYSBoYXNoXG4gIGRhdGE6IChhcmcpIC0+XG4gICAgaWYgdHlwZW9mKGFyZykgPT0gJ29iamVjdCdcbiAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcyA9IFtdXG4gICAgICBmb3IgbmFtZSwgdmFsdWUgb2YgYXJnXG4gICAgICAgIGlmIEBjaGFuZ2VEYXRhKG5hbWUsIHZhbHVlKVxuICAgICAgICAgIGNoYW5nZWREYXRhUHJvcGVydGllcy5wdXNoKG5hbWUpXG4gICAgICBpZiBAc25pcHBldFRyZWUgJiYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQHNuaXBwZXRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGRlZXBFcXVhbChAZGF0YVZhbHVlc1tuYW1lXSwgdmFsdWUpID09IGZhbHNlXG4gICAgICBAZGF0YVZhbHVlc1tuYW1lXSA9IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuXG4gIGlzRW1wdHk6IChuYW1lKSAtPlxuICAgIHZhbHVlID0gQGdldChuYW1lKVxuICAgIHZhbHVlID09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PSAnJ1xuXG5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIEBzdHlsZXNbbmFtZV1cbiAgICBlbHNlXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHN0eWxlID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXVxuICAgIGlmIG5vdCBzdHlsZVxuICAgICAgbG9nLndhcm4gXCJVbmtub3duIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBzbmlwcGV0VHJlZVxuICAgICAgICAgIEBzbmlwcGV0VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIlNuaXBwZXRNb2RlbCNjb3B5KCkgaXMgbm90IGltcGxlbWVudGVkIHlldC5cIilcblxuICAgICMgc2VyaWFsaXppbmcvZGVzZXJpYWxpemluZyBzaG91bGQgd29yayBidXQgbmVlZHMgdG8gZ2V0IHNvbWUgdGVzdHMgZmlyc3RcbiAgICAjIGpzb24gPSBAdG9Kc29uKClcbiAgICAjIGpzb24uaWQgPSBndWlkLm5leHQoKVxuICAgICMgU25pcHBldE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgbW92ZSB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIG1vdmUgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIHJlbW92ZSBUcmVlTm9kZSBmcm9tIGl0cyBjb250YWluZXIgYW5kIFNuaXBwZXRUcmVlXG4gIHJlbW92ZTogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnJlbW92ZSh0aGlzKVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgZGVzdHJveTogLT5cbiAgICAjIHRvZG86IG1vdmUgaW50byB0byByZW5kZXJlclxuXG4gICAgIyByZW1vdmUgdXNlciBpbnRlcmZhY2UgZWxlbWVudHNcbiAgICBAdWlJbmplY3Rvci5yZW1vdmUoKSBpZiBAdWlJbmplY3RvclxuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRTbmlwcGV0XG5cblxuICB1aTogLT5cbiAgICBpZiBub3QgQHVpSW5qZWN0b3JcbiAgICAgIEBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIEl0ZXJhdG9yc1xuICAjIC0tLS0tLS0tLVxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0TW9kZWwgPSB0aGlzXG4gICAgd2hpbGUgKHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcblxuXG4gIGNoaWxkcmVuOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcbiAgICAgIHdoaWxlIChzbmlwcGV0TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbClcbiAgICAgICAgc25pcHBldE1vZGVsLmRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHNBbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZGVzY2VuZGFudHMoY2FsbGJhY2spXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIChpbmNsdWRpbmcgdGhvc2Ugb2YgdGhpcyBzbmlwcGV0TW9kZWwpXG4gIGRlc2NlbmRhbnRDb250YWluZXJzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbERlc2NlbmRhbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgQGRlc2NlbmRhbnRzQW5kU2VsZiAoc25pcHBldE1vZGVsKSA9PlxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKSBpZiBzbmlwcGV0TW9kZWwgIT0gdGhpc1xuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soc25pcHBldENvbnRhaW5lcilcblxuXG4gIGNoaWxkcmVuQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGNoaWxkcmVuKGNhbGxiYWNrKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHRvSnNvbjogLT5cblxuICAgIGpzb24gPVxuICAgICAgaWQ6IEBpZFxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBjb250ZW50KVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAc3R5bGVzKVxuICAgICAganNvbi5zdHlsZXMgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KEBzdHlsZXMpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBkYXRhVmFsdWVzKVxuICAgICAganNvbi5kYXRhID0gJC5leHRlbmQodHJ1ZSwge30sIEBkYXRhVmFsdWVzKVxuXG4gICAgIyBjcmVhdGUgYW4gYXJyYXkgZm9yIGV2ZXJ5IGNvbnRhaW5lclxuICAgIGZvciBuYW1lIG9mIEBjb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cblNuaXBwZXRNb2RlbC5mcm9tSnNvbiA9IChqc29uLCBkZXNpZ24pIC0+XG4gIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmlkZW50aWZpZXIpXG5cbiAgYXNzZXJ0IHRlbXBsYXRlLFxuICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgbW9kZWwgPSBuZXcgU25pcHBldE1vZGVsKHsgdGVtcGxhdGUsIGlkOiBqc29uLmlkIH0pXG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGpzb24uY29udGVudFxuICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGVudCAnI3sgbmFtZSB9J1wiXG4gICAgbW9kZWwuY29udGVudFtuYW1lXSA9IHZhbHVlXG5cbiAgZm9yIHN0eWxlTmFtZSwgdmFsdWUgb2YganNvbi5zdHlsZXNcbiAgICBtb2RlbC5zdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gIG1vZGVsLmRhdGEoanNvbi5kYXRhKSBpZiBqc29uLmRhdGFcblxuICBmb3IgY29udGFpbmVyTmFtZSwgc25pcHBldEFycmF5IG9mIGpzb24uY29udGFpbmVyc1xuICAgIGFzc2VydCBtb2RlbC5jb250YWluZXJzLmhhc093blByb3BlcnR5KGNvbnRhaW5lck5hbWUpLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICBpZiBzbmlwcGV0QXJyYXlcbiAgICAgIGFzc2VydCAkLmlzQXJyYXkoc25pcHBldEFycmF5KSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgIGZvciBjaGlsZCBpbiBzbmlwcGV0QXJyYXlcbiAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBTbmlwcGV0TW9kZWwuZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gIG1vZGVsXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblNuaXBwZXRDb250YWluZXIgPSByZXF1aXJlKCcuL3NuaXBwZXRfY29udGFpbmVyJylcblNuaXBwZXRBcnJheSA9IHJlcXVpcmUoJy4vc25pcHBldF9hcnJheScpXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuL3NuaXBwZXRfbW9kZWwnKVxuXG4jIFNuaXBwZXRUcmVlXG4jIC0tLS0tLS0tLS0tXG4jIExpdmluZ2RvY3MgZXF1aXZhbGVudCB0byB0aGUgRE9NIHRyZWUuXG4jIEEgc25pcHBldCB0cmVlIGNvbnRhaW5lcyBhbGwgdGhlIHNuaXBwZXRzIG9mIGEgcGFnZSBpbiBoaWVyYXJjaGljYWwgb3JkZXIuXG4jXG4jIFRoZSByb290IG9mIHRoZSBTbmlwcGV0VHJlZSBpcyBhIFNuaXBwZXRDb250YWluZXIuIEEgU25pcHBldENvbnRhaW5lclxuIyBjb250YWlucyBhIGxpc3Qgb2Ygc25pcHBldHMuXG4jXG4jIHNuaXBwZXRzIGNhbiBoYXZlIG11bHRpYmxlIFNuaXBwZXRDb250YWluZXJzIHRoZW1zZWx2ZXMuXG4jXG4jICMjIyBFeGFtcGxlOlxuIyAgICAgLSBTbmlwcGV0Q29udGFpbmVyIChyb290KVxuIyAgICAgICAtIFNuaXBwZXQgJ0hlcm8nXG4jICAgICAgIC0gU25pcHBldCAnMiBDb2x1bW5zJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnbWFpbidcbiMgICAgICAgICAgIC0gU25pcHBldCAnVGl0bGUnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdzaWRlYmFyJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdJbmZvLUJveCcnXG4jXG4jICMjIyBFdmVudHM6XG4jIFRoZSBmaXJzdCBzZXQgb2YgU25pcHBldFRyZWUgRXZlbnRzIGFyZSBjb25jZXJuZWQgd2l0aCBsYXlvdXQgY2hhbmdlcyBsaWtlXG4jIGFkZGluZywgcmVtb3Zpbmcgb3IgbW92aW5nIHNuaXBwZXRzLlxuI1xuIyBDb25zaWRlcjogSGF2ZSBhIGRvY3VtZW50RnJhZ21lbnQgYXMgdGhlIHJvb3ROb2RlIGlmIG5vIHJvb3ROb2RlIGlzIGdpdmVuXG4jIG1heWJlIHRoaXMgd291bGQgaGVscCBzaW1wbGlmeSBzb21lIGNvZGUgKHNpbmNlIHNuaXBwZXRzIGFyZSBhbHdheXNcbiMgYXR0YWNoZWQgdG8gdGhlIERPTSkuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRUcmVlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgY29udGVudCwgQGRlc2lnbiB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCBcIkVycm9yIGluc3RhbnRpYXRpbmcgU25pcHBldFRyZWU6IGRlc2lnbiBwYXJhbSBpcyBtaXNzc2luZy5cIlxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgc25pcHBldCB0cmVlIHRvIHRoZSByb290XG4gICAgIyBvdGhlcndpc2UgYWxsIHRoZSBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQgd2hpbGUgYnVpbGRpbmcgdGhlIHRyZWVcbiAgICBAZnJvbUpzb24oY29udGVudCwgQGRlc2lnbikgaWYgY29udGVudD9cblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgc25pcHBldCBhdCB0aGUgYmVnaW5uaW5nLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QucHJlcGVuZChzbmlwcGV0KSBpZiBzbmlwcGV0P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IHNuaXBwZXQgYXQgdGhlIGVuZC5cbiAgIyBAcGFyYW06IHNuaXBwZXRNb2RlbCBpbnN0YW5jZSBvciBzbmlwcGV0IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgc25pcHBldCA9IEBnZXRTbmlwcGV0KHNuaXBwZXQpXG4gICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0U25pcHBldDogKHNuaXBwZXROYW1lKSAtPlxuICAgIGlmIHR5cGVvZiBzbmlwcGV0TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZU1vZGVsKHNuaXBwZXROYW1lKVxuICAgIGVsc2VcbiAgICAgIHNuaXBwZXROYW1lXG5cblxuICBjcmVhdGVNb2RlbDogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBjcmVhdGVTbmlwcGV0OiAtPlxuICAgIEBjcmVhdGVNb2RlbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICBnZXRUZW1wbGF0ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChpZGVudGlmaWVyKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBpZGVudGlmaWVyIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBzbmlwcGV0QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRSZW1vdmVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBzbmlwcGV0Q29udGVudENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRIdG1sQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldERhdGFDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cblxuICAjIFRyYXZlcnNlIHRoZSB3aG9sZSBzbmlwcGV0IHRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3Qgc25pcHBldFxuICBmaXJzdDogLT5cbiAgICBAcm9vdC5maXJzdFxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuYWxsKGNhbGxiYWNrKVxuXG5cbiAgZmluZDogKHNlYXJjaCkgLT5cbiAgICBpZiB0eXBlb2Ygc2VhcmNoID09ICdzdHJpbmcnXG4gICAgICByZXMgPSBbXVxuICAgICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICAgIGlmIHNuaXBwZXQuaWRlbnRpZmllciA9PSBzZWFyY2ggfHwgc25pcHBldC50ZW1wbGF0ZS5pZCA9PSBzZWFyY2hcbiAgICAgICAgICByZXMucHVzaChzbmlwcGV0KVxuXG4gICAgICBuZXcgU25pcHBldEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgU25pcHBldEFycmF5KClcblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgb2xkUm9vdCA9IEByb290XG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKHNuaXBwZXQsIHBhcmVudHMpIC0+XG4gICMgICBwYXJlbnRzIHx8PSBbXVxuXG4gICMgICAjIHRyYXZlcnNlXG4gICMgICBwYXJlbnRzID0gcGFyZW50cy5wdXNoKHNuaXBwZXQpXG4gICMgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgIyAgICAgc25pcHBldCA9IHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoc25pcHBldClcbiAgIyAgICAgICBAZWFjaFdpdGhQYXJlbnRzKHNuaXBwZXQsIHBhcmVudHMpXG4gICMgICAgICAgc25pcHBldCA9IHNuaXBwZXQubmV4dFxuXG4gICMgICBwYXJlbnRzLnNwbGljZSgtMSlcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnU25pcHBldFRyZWVcXG4tLS0tLS0tLS0tLVxcbidcblxuICAgIGFkZExpbmUgPSAodGV4dCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgb3V0cHV0ICs9IFwiI3sgQXJyYXkoaW5kZW50YXRpb24gKyAxKS5qb2luKFwiIFwiKSB9I3sgdGV4dCB9XFxuXCJcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IHNuaXBwZXQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLnRpdGxlIH0gKCN7IHRlbXBsYXRlLmlkZW50aWZpZXIgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgaW5kZW50YXRpb24pIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBzbmlwcGV0c1xuICAjIFRoZXNlIGZ1bmN0aW9ucyBzaG91bGQgb25seSBiZSBjYWxsZWQgYnkgc25pcHBldENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgYXR0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZSA9PSB0aGlzXG4gICAgICAjIG1vdmUgc25pcHBldFxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldE1vdmVkJywgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlP1xuICAgICAgICAjIHJlbW92ZSBmcm9tIG90aGVyIHNuaXBwZXQgdHJlZVxuICAgICAgICBzbmlwcGV0LnNuaXBwZXRDb250YWluZXIuZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuICAgICAgYXR0YWNoU25pcHBldEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnc25pcHBldEFkZGVkJywgc25pcHBldClcblxuXG4gIGZpcmVFdmVudDogKGV2ZW50LCBhcmdzLi4uKSAtPlxuICAgIHRoaXNbZXZlbnRdLmZpcmUuYXBwbHkoZXZlbnQsIGFyZ3MpXG4gICAgQGNoYW5nZWQuZmlyZSgpXG5cblxuICBkZXRhY2hpbmdTbmlwcGV0OiAoc25pcHBldCwgZGV0YWNoU25pcHBldEZ1bmMpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXQuc25pcHBldFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIHNuaXBwZXQgZnJvbSBhbm90aGVyIFNuaXBwZXRUcmVlJ1xuXG4gICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnRzKSAtPlxuICAgICAgZGVzY2VuZGFudHMuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGRldGFjaFNuaXBwZXRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0UmVtb3ZlZCcsIHNuaXBwZXQpXG5cblxuICBjb250ZW50Q2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRDb250ZW50Q2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBodG1sQ2hhbmdpbmc6IChzbmlwcGV0KSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRIdG1sQ2hhbmdlZCcsIHNuaXBwZXQpXG5cblxuICBkYXRhQ2hhbmdpbmc6IChzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcykgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0RGF0YUNoYW5nZWQnLCBzbmlwcGV0LCBjaGFuZ2VkUHJvcGVydGllcylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICBwcmludEpzb246IC0+XG4gICAgd29yZHMucmVhZGFibGVKc29uKEB0b0pzb24oKSlcblxuXG4gICMgUmV0dXJucyBhIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgIyB0aGF0IGNhbiBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIgYXMgSlNPTi5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGRhdGEgPSB7fVxuICAgIGRhdGFbJ2NvbnRlbnQnXSA9IFtdXG4gICAgZGF0YVsnZGVzaWduJ10gPSB7IG5hbWU6IEBkZXNpZ24ubmFtZXNwYWNlIH1cblxuICAgIHNuaXBwZXRUb0RhdGEgPSAoc25pcHBldCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0LnRvSnNvbigpXG4gICAgICBjb250YWluZXJBcnJheS5wdXNoIHNuaXBwZXREYXRhXG4gICAgICBzbmlwcGV0RGF0YVxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKSAtPlxuICAgICAgc25pcHBldERhdGEgPSBzbmlwcGV0VG9EYXRhKHNuaXBwZXQsIGxldmVsLCBkYXRhT2JqKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBzbmlwcGV0RGF0YS5jb250YWluZXJzW3NuaXBwZXRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gIHRvSnNvbjogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gIGZyb21Kc29uOiAoZGF0YSwgZGVzaWduKSAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgaWYgZGF0YS5jb250ZW50XG4gICAgICBmb3Igc25pcHBldERhdGEgaW4gZGF0YS5jb250ZW50XG4gICAgICAgIHNuaXBwZXQgPSBTbmlwcGV0TW9kZWwuZnJvbUpzb24oc25pcHBldERhdGEsIGRlc2lnbilcbiAgICAgICAgQHJvb3QuYXBwZW5kKHNuaXBwZXQpXG5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHRoaXNcbiAgICBAcm9vdC5lYWNoIChzbmlwcGV0KSA9PlxuICAgICAgc25pcHBldC5zbmlwcGV0VHJlZSA9IHRoaXNcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgbmFtZSwgQHR5cGUsIEBlbGVtIH0pIC0+XG4gICAgQG5hbWUgPSBuYW1lIHx8IGNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXS5kZWZhdWx0TmFtZVxuICAgIEBjb25maWcgPSBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV1cbiAgICBAb3B0aW9uYWwgPSBmYWxzZVxuXG5cbiAgcmVuZGVyZWRBdHRyOiAtPlxuICAgIEBjb25maWcucmVuZGVyZWRBdHRyXG5cblxuICBpc0VsZW1lbnREaXJlY3RpdmU6IC0+XG4gICAgQGNvbmZpZy5lbGVtZW50RGlyZWN0aXZlXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZCBmcm9tIHRoZVxuICAjIHRlbXBsYXRlIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXdcbiAgY2xvbmU6IC0+XG4gICAgbmV3RGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZShuYW1lOiBAbmFtZSwgdHlwZTogQHR5cGUpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQGVsZW0pXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbiMgQSBsaXN0IG9mIGFsbCBkaXJlY3RpdmVzIG9mIGEgdGVtcGxhdGVcbiMgRXZlcnkgbm9kZSB3aXRoIGFuIGRvYy0gYXR0cmlidXRlIHdpbGwgYmUgc3RvcmVkIGJ5IGl0cyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUNvbGxlY3Rpb25cblxuICBjb25zdHJ1Y3RvcjogKEBhbGw9e30pIC0+XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIGFkZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBAYXNzZXJ0TmFtZU5vdFVzZWQoZGlyZWN0aXZlKVxuXG4gICAgIyBjcmVhdGUgcHNldWRvIGFycmF5XG4gICAgdGhpc1tAbGVuZ3RoXSA9IGRpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZS5pbmRleCA9IEBsZW5ndGhcbiAgICBAbGVuZ3RoICs9IDFcblxuICAgICMgaW5kZXggYnkgbmFtZVxuICAgIEBhbGxbZGlyZWN0aXZlLm5hbWVdID0gZGlyZWN0aXZlXG5cbiAgICAjIGluZGV4IGJ5IHR5cGVcbiAgICAjIGRpcmVjdGl2ZS50eXBlIGlzIG9uZSBvZiB0aG9zZSAnY29udGFpbmVyJywgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0gfHw9IFtdXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0ucHVzaChkaXJlY3RpdmUpXG5cblxuICBuZXh0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgfHw9IEBhbGxbbmFtZV1cbiAgICB0aGlzW2RpcmVjdGl2ZS5pbmRleCArPSAxXVxuXG5cbiAgbmV4dE9mVHlwZTogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlIHx8PSBAYWxsW25hbWVdXG5cbiAgICByZXF1aXJlZFR5cGUgPSBkaXJlY3RpdmUudHlwZVxuICAgIHdoaWxlIGRpcmVjdGl2ZSA9IEBuZXh0KGRpcmVjdGl2ZSlcbiAgICAgIHJldHVybiBkaXJlY3RpdmUgaWYgZGlyZWN0aXZlLnR5cGUgaXMgcmVxdWlyZWRUeXBlXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIEBhbGxbbmFtZV1cblxuXG4gICMgaGVscGVyIHRvIGRpcmVjdGx5IGdldCBlbGVtZW50IHdyYXBwZWQgaW4gYSBqUXVlcnkgb2JqZWN0XG4gICRnZXRFbGVtOiAobmFtZSkgLT5cbiAgICAkKEBhbGxbbmFtZV0uZWxlbSlcblxuXG4gIGNvdW50OiAodHlwZSkgLT5cbiAgICBpZiB0eXBlXG4gICAgICB0aGlzW3R5cGVdPy5sZW5ndGhcbiAgICBlbHNlXG4gICAgICBAbGVuZ3RoXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzXG4gICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBjbG9uZTogLT5cbiAgICBuZXdDb2xsZWN0aW9uID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICBuZXdDb2xsZWN0aW9uLmFkZChkaXJlY3RpdmUuY2xvbmUoKSlcblxuICAgIG5ld0NvbGxlY3Rpb25cblxuXG4gIGFzc2VydEFsbExpbmtlZDogLT5cbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBkaXJlY3RpdmUuZWxlbVxuXG4gICAgcmV0dXJuIHRydWVcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGFzc2VydE5hbWVOb3RVc2VkOiAoZGlyZWN0aXZlKSAtPlxuICAgIGFzc2VydCBkaXJlY3RpdmUgJiYgbm90IEBhbGxbZGlyZWN0aXZlLm5hbWVdLFxuICAgICAgXCJcIlwiXG4gICAgICAje2RpcmVjdGl2ZS50eXBlfSBUZW1wbGF0ZSBwYXJzaW5nIGVycm9yOlxuICAgICAgI3sgY29uZmlnLmRpcmVjdGl2ZXNbZGlyZWN0aXZlLnR5cGVdLnJlbmRlcmVkQXR0ciB9PVwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiLlxuICAgICAgXCIjeyBkaXJlY3RpdmUubmFtZSB9XCIgaXMgYSBkdXBsaWNhdGUgbmFtZS5cbiAgICAgIFwiXCJcIlxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgcGFyc2U6IChlbGVtKSAtPlxuICAgIGVsZW1EaXJlY3RpdmUgPSB1bmRlZmluZWRcbiAgICBtb2RpZmljYXRpb25zID0gW11cbiAgICBAcGFyc2VEaXJlY3RpdmVzIGVsZW0sIChkaXJlY3RpdmUpIC0+XG4gICAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgICAgZWxlbURpcmVjdGl2ZSA9IGRpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RpZmljYXRpb25zLnB1c2goZGlyZWN0aXZlKVxuXG4gICAgQGFwcGx5TW9kaWZpY2F0aW9ucyhlbGVtRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSBpZiBlbGVtRGlyZWN0aXZlXG4gICAgcmV0dXJuIGVsZW1EaXJlY3RpdmVcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGVsZW0sIGZ1bmMpIC0+XG4gICAgZGlyZWN0aXZlRGF0YSA9IFtdXG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0ci5uYW1lXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHJpYnV0ZU5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZURhdGEucHVzaFxuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWVcbiAgICAgICAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVcbiAgICAgICAgICAgIG5hbWU6IGF0dHIudmFsdWVcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgICAgIGVsZW06IGVsZW1cblxuICAgICMgU2luY2Ugd2UgbW9kaWZ5IHRoZSBhdHRyaWJ1dGVzIHdlIGhhdmUgdG8gc3BsaXRcbiAgICAjIHRoaXMgaW50byB0d28gbG9vcHNcbiAgICBmb3IgZGF0YSBpbiBkaXJlY3RpdmVEYXRhXG4gICAgICBkaXJlY3RpdmUgPSBkYXRhLmRpcmVjdGl2ZVxuICAgICAgQHJld3JpdGVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBkYXRhLmF0dHJpYnV0ZU5hbWUpXG4gICAgICBmdW5jKGRpcmVjdGl2ZSlcblxuXG4gIGFwcGx5TW9kaWZpY2F0aW9uczogKG1haW5EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBtb2RpZmljYXRpb25zXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnb3B0aW9uYWwnXG4gICAgICAgICAgbWFpbkRpcmVjdGl2ZS5vcHRpb25hbCA9IHRydWVcblxuXG4gICMgTm9ybWFsaXplIG9yIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICMgZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgcmV3cml0ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgIGlmIGF0dHJpYnV0ZU5hbWUgIT0gZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgZWxzZSBpZiBub3QgZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUpXG4gICAgZWxzZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG5cblxuICAjIGZvcmNlIGF0dHJpYnV0ZSBzdHlsZSBhcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICMgZS5nLiBhdHRyaWJ1dGUgJ2RvYy1jb250YWluZXInIGJlY29tZXMgJ2RhdGEtZG9jLWNvbnRhaW5lcidcbiAgbm9ybWFsaXplQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGVsZW0gPSBkaXJlY3RpdmUuZWxlbVxuICAgIGlmIGF0dHJpYnV0ZU5hbWVcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgIGVsZW0uc2V0QXR0cmlidXRlKGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKSwgZGlyZWN0aXZlLm5hbWUpXG5cblxuICByZW1vdmVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZGlyZWN0aXZlLmVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpcmVjdGl2ZUZpbmRlciA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIGxpbms6IChlbGVtLCBkaXJlY3RpdmVDb2xsZWN0aW9uKSAtPlxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbGxlY3Rpb24uZ2V0KGF0dHIudmFsdWUpXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtID0gZWxlbVxuXG4gICAgdW5kZWZpbmVkXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBEaXJlY3RpdmUgSXRlcmF0b3JcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIENvZGUgaXMgcG9ydGVkIGZyb20gcmFuZ3kgTm9kZUl0ZXJhdG9yIGFuZCBhZGFwdGVkIGZvciBzbmlwcGV0IHRlbXBsYXRlc1xuIyBzbyBpdCBkb2VzIG5vdCB0cmF2ZXJzZSBpbnRvIGNvbnRhaW5lcnMuXG4jXG4jIFVzZSB0byB0cmF2ZXJzZSBhbGwgbm9kZXMgb2YgYSB0ZW1wbGF0ZS4gVGhlIGl0ZXJhdG9yIGRvZXMgbm90IGdvIGludG9cbiMgY29udGFpbmVycyBhbmQgaXMgc2FmZSB0byB1c2UgZXZlbiBpZiB0aGVyZSBpcyBjb250ZW50IGluIHRoZXNlIGNvbnRhaW5lcnMuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUl0ZXJhdG9yXG5cbiAgY29uc3RydWN0b3I6IChyb290KSAtPlxuICAgIEByb290ID0gQF9uZXh0ID0gcm9vdFxuICAgIEBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG5cbiAgY3VycmVudDogbnVsbFxuXG5cbiAgaGFzTmV4dDogLT5cbiAgICAhIUBfbmV4dFxuXG5cbiAgbmV4dDogKCkgLT5cbiAgICBuID0gQGN1cnJlbnQgPSBAX25leHRcbiAgICBjaGlsZCA9IG5leHQgPSB1bmRlZmluZWRcbiAgICBpZiBAY3VycmVudFxuICAgICAgY2hpbGQgPSBuLmZpcnN0Q2hpbGRcbiAgICAgIGlmIGNoaWxkICYmIG4ubm9kZVR5cGUgPT0gMSAmJiAhbi5oYXNBdHRyaWJ1dGUoQGNvbnRhaW5lckF0dHIpXG4gICAgICAgIEBfbmV4dCA9IGNoaWxkXG4gICAgICBlbHNlXG4gICAgICAgIG5leHQgPSBudWxsXG4gICAgICAgIHdoaWxlIChuICE9IEByb290KSAmJiAhKG5leHQgPSBuLm5leHRTaWJsaW5nKVxuICAgICAgICAgIG4gPSBuLnBhcmVudE5vZGVcblxuICAgICAgICBAX25leHQgPSBuZXh0XG5cbiAgICBAY3VycmVudFxuXG5cbiAgIyBvbmx5IGl0ZXJhdGUgb3ZlciBlbGVtZW50IG5vZGVzIChOb2RlLkVMRU1FTlRfTk9ERSA9PSAxKVxuICBuZXh0RWxlbWVudDogKCkgLT5cbiAgICB3aGlsZSBAbmV4dCgpXG4gICAgICBicmVhayBpZiBAY3VycmVudC5ub2RlVHlwZSA9PSAxXG5cbiAgICBAY3VycmVudFxuXG5cbiAgZGV0YWNoOiAoKSAtPlxuICAgIEBjdXJyZW50ID0gQF9uZXh0ID0gQHJvb3QgPSBudWxsXG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5EaXJlY3RpdmVDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5kaXJlY3RpdmVDb21waWxlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbXBpbGVyJylcbmRpcmVjdGl2ZUZpbmRlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2ZpbmRlcicpXG5cblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4uL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsJylcblNuaXBwZXRWaWV3ID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nL3NuaXBwZXRfdmlldycpXG5cbiMgVGVtcGxhdGVcbiMgLS0tLS0tLS1cbiMgUGFyc2VzIHNuaXBwZXQgdGVtcGxhdGVzIGFuZCBjcmVhdGVzIFNuaXBwZXRNb2RlbHMgYW5kIFNuaXBwZXRWaWV3cy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGVtcGxhdGVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBodG1sLCBAbmFtZXNwYWNlLCBAaWQsIGlkZW50aWZpZXIsIHRpdGxlLCBzdHlsZXMsIHdlaWdodCB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IGh0bWwsICdUZW1wbGF0ZTogcGFyYW0gaHRtbCBtaXNzaW5nJ1xuXG4gICAgaWYgaWRlbnRpZmllclxuICAgICAgeyBAbmFtZXNwYWNlLCBAaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgQGlkZW50aWZpZXIgPSBpZiBAbmFtZXNwYWNlICYmIEBpZFxuICAgICAgXCIjeyBAbmFtZXNwYWNlIH0uI3sgQGlkIH1cIlxuXG4gICAgQCR0ZW1wbGF0ZSA9ICQoIEBwcnVuZUh0bWwoaHRtbCkgKS53cmFwKCc8ZGl2PicpXG4gICAgQCR3cmFwID0gQCR0ZW1wbGF0ZS5wYXJlbnQoKVxuXG4gICAgQHRpdGxlID0gdGl0bGUgfHwgd29yZHMuaHVtYW5pemUoIEBpZCApXG4gICAgQHN0eWxlcyA9IHN0eWxlcyB8fCB7fVxuICAgIEB3ZWlnaHQgPSB3ZWlnaHRcbiAgICBAZGVmYXVsdHMgPSB7fVxuXG4gICAgQHBhcnNlVGVtcGxhdGUoKVxuXG5cbiAgIyBjcmVhdGUgYSBuZXcgU25pcHBldE1vZGVsIGluc3RhbmNlIGZyb20gdGhpcyB0ZW1wbGF0ZVxuICBjcmVhdGVNb2RlbDogKCkgLT5cbiAgICBuZXcgU25pcHBldE1vZGVsKHRlbXBsYXRlOiB0aGlzKVxuXG5cbiAgY3JlYXRlVmlldzogKHNuaXBwZXRNb2RlbCwgaXNSZWFkT25seSkgLT5cbiAgICBzbmlwcGV0TW9kZWwgfHw9IEBjcmVhdGVNb2RlbCgpXG4gICAgJGVsZW0gPSBAJHRlbXBsYXRlLmNsb25lKClcbiAgICBkaXJlY3RpdmVzID0gQGxpbmtEaXJlY3RpdmVzKCRlbGVtWzBdKVxuXG4gICAgc25pcHBldFZpZXcgPSBuZXcgU25pcHBldFZpZXdcbiAgICAgIG1vZGVsOiBzbmlwcGV0TW9kZWxcbiAgICAgICRodG1sOiAkZWxlbVxuICAgICAgZGlyZWN0aXZlczogZGlyZWN0aXZlc1xuICAgICAgaXNSZWFkT25seTogaXNSZWFkT25seVxuXG5cbiAgcHJ1bmVIdG1sOiAoaHRtbCkgLT5cblxuICAgICMgcmVtb3ZlIGFsbCBjb21tZW50c1xuICAgIGh0bWwgPSAkKGh0bWwpLmZpbHRlciAoaW5kZXgpIC0+XG4gICAgICBAbm9kZVR5cGUgIT04XG5cbiAgICAjIG9ubHkgYWxsb3cgb25lIHJvb3QgZWxlbWVudFxuICAgIGFzc2VydCBodG1sLmxlbmd0aCA9PSAxLCBcIlRlbXBsYXRlcyBtdXN0IGNvbnRhaW4gb25lIHJvb3QgZWxlbWVudC4gVGhlIFRlbXBsYXRlIFxcXCIje0BpZGVudGlmaWVyfVxcXCIgY29udGFpbnMgI3sgaHRtbC5sZW5ndGggfVwiXG5cbiAgICBodG1sXG5cbiAgcGFyc2VUZW1wbGF0ZTogKCkgLT5cbiAgICBlbGVtID0gQCR0ZW1wbGF0ZVswXVxuICAgIEBkaXJlY3RpdmVzID0gQGNvbXBpbGVEaXJlY3RpdmVzKGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnXG4gICAgICAgICAgQGZvcm1hdEVkaXRhYmxlKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBmb3JtYXRDb250YWluZXIoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdodG1sJ1xuICAgICAgICAgIEBmb3JtYXRIdG1sKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcblxuXG4gICMgSW4gdGhlIGh0bWwgb2YgdGhlIHRlbXBsYXRlIGZpbmQgYW5kIHN0b3JlIGFsbCBET00gbm9kZXNcbiAgIyB3aGljaCBhcmUgZGlyZWN0aXZlcyAoZS5nLiBlZGl0YWJsZXMgb3IgY29udGFpbmVycykuXG4gIGNvbXBpbGVEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29tcGlsZXIucGFyc2UoZWxlbSlcbiAgICAgIGRpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSkgaWYgZGlyZWN0aXZlXG5cbiAgICBkaXJlY3RpdmVzXG5cblxuICAjIEZvciBldmVyeSBuZXcgU25pcHBldFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZFxuICAjIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXcuXG4gIGxpbmtEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIHNuaXBwZXREaXJlY3RpdmVzID0gQGRpcmVjdGl2ZXMuY2xvbmUoKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZUZpbmRlci5saW5rKGVsZW0sIHNuaXBwZXREaXJlY3RpdmVzKVxuXG4gICAgc25pcHBldERpcmVjdGl2ZXNcblxuXG4gIGZvcm1hdEVkaXRhYmxlOiAobmFtZSwgZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVkaXRhYmxlKVxuXG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBpZiBkZWZhdWx0VmFsdWUgdGhlbiBkZWZhdWx0VmFsdWUgZWxzZSAnJ1xuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdENvbnRhaW5lcjogKG5hbWUsIGVsZW0pIC0+XG4gICAgIyByZW1vdmUgYWxsIGNvbnRlbnQgZnJvbiBhIGNvbnRhaW5lciBmcm9tIHRoZSB0ZW1wbGF0ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdEh0bWw6IChuYW1lLCBlbGVtKSAtPlxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gICMgb3V0cHV0IHRoZSBhY2NlcHRlZCBjb250ZW50IG9mIHRoZSBzbmlwcGV0XG4gICMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGNyZWF0ZVxuICAjIGUuZzogeyB0aXRsZTogXCJJdGNoeSBhbmQgU2NyYXRjaHlcIiB9XG4gIHByaW50RG9jOiAoKSAtPlxuICAgIGRvYyA9XG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuICAgICAgIyBlZGl0YWJsZXM6IE9iamVjdC5rZXlzIEBlZGl0YWJsZXMgaWYgQGVkaXRhYmxlc1xuICAgICAgIyBjb250YWluZXJzOiBPYmplY3Qua2V5cyBAY29udGFpbmVycyBpZiBAY29udGFpbmVyc1xuXG4gICAgd29yZHMucmVhZGFibGVKc29uKGRvYylcblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBuYW1lc3BhY2U6IHVuZGVmaW5lZCwgaWQ6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgbmFtZXNwYWNlOiBwYXJ0c1swXSwgaWQ6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBzbmlwcGV0IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIl19
