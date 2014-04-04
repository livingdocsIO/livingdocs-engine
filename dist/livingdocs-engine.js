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
    if (parent == null) {
      parent = window.document.body;
    }
    if (options == null) {
      options = {
        readOnly: true
      };
    }
    $parent = $(parent).first();
    options.$wrapper = this.findWrapper($parent);
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
      if (!$insert.length) {
        return;
      }
      this.$wrapper = this.$root;
      this.$wrapper.append(this.$wrapperHtml);
      return this.$root = $insert;
    }
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

  RescritImageManager.resrcitUrl = 'http://trial.resrc.it/';

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
      if ((sessionContent[name] != null) && ((value == null) || value === '')) {
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
    $(this.renderNode).data('snippetTree', this.snippetTree);
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

  SnippetModel.prototype.resetVolatileValue = function(name) {
    return delete this.temporaryContent[name];
  };

  SnippetModel.prototype.set = function(name, value, volatile) {
    var storageContainer, _ref;
    if (volatile == null) {
      volatile = false;
    }
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "set error: " + this.identifier + " has no content named " + name);
    if (volatile) {
      storageContainer = this.temporaryContent;
    } else {
      this.resetVolatileValue(name);
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
      log(name, value, 'trace');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fc3R5bGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZG9jdW1lbnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RyYWdfYmFzZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9raWNrc3RhcnQvYnJvd3Nlcl94bWxkb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2Fzc2VydC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvbG9nLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3JlbmRlcmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3NuaXBwZXRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZEEsSUFBQSwyRUFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDBCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQUVBLEdBQVMsT0FBQSxDQUFRLDBCQUFSLENBRlQsQ0FBQTs7QUFBQSxRQUdBLEdBQVcsT0FBQSxDQUFRLFlBQVIsQ0FIWCxDQUFBOztBQUFBLFdBSUEsR0FBYyxPQUFBLENBQVEsNkJBQVIsQ0FKZCxDQUFBOztBQUFBLE1BS0EsR0FBUyxPQUFBLENBQVEsaUJBQVIsQ0FMVCxDQUFBOztBQUFBLFdBTUEsR0FBYyxPQUFBLENBQVEsdUJBQVIsQ0FOZCxDQUFBOztBQUFBLFVBT0EsR0FBYSxPQUFBLENBQVEsbUNBQVIsQ0FQYixDQUFBOztBQUFBLE1BU00sQ0FBQyxPQUFQLEdBQWlCLEdBQUEsR0FBUyxDQUFBLFNBQUEsR0FBQTtBQUV4QixNQUFBLFVBQUE7QUFBQSxFQUFBLFVBQUEsR0FBaUIsSUFBQSxVQUFBLENBQUEsQ0FBakIsQ0FBQTtTQVlBO0FBQUEsSUFBQSxLQUFBLEVBQUssU0FBQyxJQUFELEdBQUE7QUFDSCxVQUFBLDJDQUFBO0FBQUEsTUFETSxZQUFBLE1BQU0sY0FBQSxNQUNaLENBQUE7QUFBQSxNQUFBLFdBQUEsR0FBaUIsWUFBSCxHQUNaLENBQUEsVUFBQSxzQ0FBd0IsQ0FBRSxhQUExQixFQUNBLE1BQUEsQ0FBTyxrQkFBUCxFQUFvQixrREFBcEIsQ0FEQSxFQUVBLE1BQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsQ0FBWSxVQUFaLENBRlQsRUFHSSxJQUFBLFdBQUEsQ0FBWTtBQUFBLFFBQUEsT0FBQSxFQUFTLElBQVQ7QUFBQSxRQUFlLE1BQUEsRUFBUSxNQUF2QjtPQUFaLENBSEosQ0FEWSxHQU1aLENBQUEsVUFBQSxHQUFhLE1BQWIsRUFDQSxNQUFBLEdBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksVUFBWixDQURULEVBRUksSUFBQSxXQUFBLENBQVk7QUFBQSxRQUFBLE1BQUEsRUFBUSxNQUFSO09BQVosQ0FGSixDQU5GLENBQUE7YUFVQSxJQUFDLENBQUEsTUFBRCxDQUFRLFdBQVIsRUFYRztJQUFBLENBQUw7QUFBQSxJQXlCQSxNQUFBLEVBQVEsU0FBQyxXQUFELEdBQUE7YUFDRixJQUFBLFFBQUEsQ0FBUztBQUFBLFFBQUUsYUFBQSxXQUFGO09BQVQsRUFERTtJQUFBLENBekJSO0FBQUEsSUE4QkEsTUFBQSxFQUFRLFdBOUJSO0FBQUEsSUFpQ0EsU0FBQSxFQUFXLENBQUMsQ0FBQyxLQUFGLENBQVEsVUFBUixFQUFvQixXQUFwQixDQWpDWDtBQUFBLElBbUNBLE1BQUEsRUFBUSxTQUFDLFVBQUQsR0FBQTthQUNOLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLE1BQWYsRUFBdUIsVUFBdkIsRUFETTtJQUFBLENBbkNSO0lBZHdCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FUdkIsQ0FBQTs7QUFBQSxNQStETSxDQUFDLEdBQVAsR0FBYSxHQS9EYixDQUFBOzs7O0FDRUEsSUFBQSxvQkFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixNQUFBLEdBQVksQ0FBQSxTQUFBLEdBQUE7U0FHM0I7QUFBQSxJQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsSUFHQSxVQUFBLEVBQVksVUFIWjtBQUFBLElBSUEsaUJBQUEsRUFBbUIsNEJBSm5CO0FBQUEsSUFNQSxjQUFBLEVBQWdCLGtDQU5oQjtBQUFBLElBU0EsZUFBQSxFQUFpQixpQkFUakI7QUFBQSxJQVdBLGVBQUEsRUFBaUIsTUFYakI7QUFBQSxJQWlCQSxHQUFBLEVBRUU7QUFBQSxNQUFBLE9BQUEsRUFBUyxhQUFUO0FBQUEsTUFHQSxPQUFBLEVBQVMsYUFIVDtBQUFBLE1BSUEsUUFBQSxFQUFVLGNBSlY7QUFBQSxNQUtBLGFBQUEsRUFBZSxvQkFMZjtBQUFBLE1BTUEsVUFBQSxFQUFZLGlCQU5aO0FBQUEsTUFPQSxXQUFBLEVBQVcsUUFQWDtBQUFBLE1BVUEsZ0JBQUEsRUFBa0IsdUJBVmxCO0FBQUEsTUFXQSxrQkFBQSxFQUFvQix5QkFYcEI7QUFBQSxNQWNBLE9BQUEsRUFBUyxhQWRUO0FBQUEsTUFlQSxrQkFBQSxFQUFvQix5QkFmcEI7QUFBQSxNQWdCQSx5QkFBQSxFQUEyQixrQkFoQjNCO0FBQUEsTUFpQkEsVUFBQSxFQUFZLGlCQWpCWjtBQUFBLE1Ba0JBLFVBQUEsRUFBWSxpQkFsQlo7QUFBQSxNQW1CQSxNQUFBLEVBQVEsa0JBbkJSO0FBQUEsTUFvQkEsU0FBQSxFQUFXLGdCQXBCWDtBQUFBLE1BcUJBLGtCQUFBLEVBQW9CLHlCQXJCcEI7QUFBQSxNQXdCQSxnQkFBQSxFQUFrQixrQkF4QmxCO0FBQUEsTUF5QkEsa0JBQUEsRUFBb0IsNEJBekJwQjtBQUFBLE1BMEJBLGtCQUFBLEVBQW9CLHlCQTFCcEI7S0FuQkY7QUFBQSxJQWdEQSxJQUFBLEVBQ0U7QUFBQSxNQUFBLFFBQUEsRUFBVSxtQkFBVjtBQUFBLE1BQ0EsV0FBQSxFQUFhLHNCQURiO0tBakRGO0FBQUEsSUFzREEsU0FBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQ0U7QUFBQSxRQUFBLE1BQUEsRUFBUSxZQUFSO09BREY7S0F2REY7QUFBQSxJQWlFQSxVQUFBLEVBQ0U7QUFBQSxNQUFBLFNBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLGVBQU47QUFBQSxRQUNBLFlBQUEsRUFBYyxrQkFEZDtBQUFBLFFBRUEsZ0JBQUEsRUFBa0IsSUFGbEI7QUFBQSxRQUdBLFdBQUEsRUFBYSxTQUhiO09BREY7QUFBQSxNQUtBLFFBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLGNBQU47QUFBQSxRQUNBLFlBQUEsRUFBYyxrQkFEZDtBQUFBLFFBRUEsZ0JBQUEsRUFBa0IsSUFGbEI7QUFBQSxRQUdBLFdBQUEsRUFBYSxTQUhiO09BTkY7QUFBQSxNQVVBLEtBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLFdBQU47QUFBQSxRQUNBLFlBQUEsRUFBYyxrQkFEZDtBQUFBLFFBRUEsZ0JBQUEsRUFBa0IsSUFGbEI7QUFBQSxRQUdBLFdBQUEsRUFBYSxPQUhiO09BWEY7QUFBQSxNQWVBLElBQUEsRUFDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLFVBQU47QUFBQSxRQUNBLFlBQUEsRUFBYyxrQkFEZDtBQUFBLFFBRUEsZ0JBQUEsRUFBa0IsSUFGbEI7QUFBQSxRQUdBLFdBQUEsRUFBYSxTQUhiO09BaEJGO0FBQUEsTUFvQkEsUUFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sY0FBTjtBQUFBLFFBQ0EsWUFBQSxFQUFjLGtCQURkO0FBQUEsUUFFQSxnQkFBQSxFQUFrQixLQUZsQjtPQXJCRjtLQWxFRjtBQUFBLElBNEZBLFVBQUEsRUFDRTtBQUFBLE1BQUEsU0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sU0FBQyxLQUFELEdBQUE7aUJBQ0osS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsR0FBaEIsRUFESTtRQUFBLENBQU47QUFBQSxRQUdBLElBQUEsRUFBTSxTQUFDLEtBQUQsR0FBQTtpQkFDSixLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsRUFESTtRQUFBLENBSE47T0FERjtLQTdGRjtJQUgyQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBQTFCLENBQUE7O0FBQUEsWUE0R0EsR0FBZSxTQUFBLEdBQUE7QUFJYixNQUFBLG1DQUFBO0FBQUEsRUFBQSxJQUFDLENBQUEsWUFBRCxHQUFnQixFQUFoQixDQUFBO0FBQUEsRUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUdBO0FBQUE7T0FBQSxZQUFBO3VCQUFBO0FBSUUsSUFBQSxJQUFxQyxJQUFDLENBQUEsZUFBdEM7QUFBQSxNQUFBLE1BQUEsR0FBUyxFQUFBLEdBQVosSUFBQyxDQUFBLGVBQVcsR0FBc0IsR0FBL0IsQ0FBQTtLQUFBO0FBQUEsSUFDQSxLQUFLLENBQUMsWUFBTixHQUFxQixFQUFBLEdBQUUsQ0FBMUIsTUFBQSxJQUFVLEVBQWdCLENBQUYsR0FBeEIsS0FBSyxDQUFDLElBREgsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFlBQWEsQ0FBQSxJQUFBLENBQWQsR0FBc0IsS0FBSyxDQUFDLFlBSDVCLENBQUE7QUFBQSxrQkFJQSxJQUFDLENBQUEsa0JBQW1CLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBcEIsR0FBa0MsS0FKbEMsQ0FKRjtBQUFBO2tCQVBhO0FBQUEsQ0E1R2YsQ0FBQTs7QUFBQSxZQThIWSxDQUFDLElBQWIsQ0FBa0IsTUFBbEIsQ0E5SEEsQ0FBQTs7OztBQ0ZBLElBQUEsMENBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsR0FDQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUROLENBQUE7O0FBQUEsUUFFQSxHQUFXLE9BQUEsQ0FBUSxzQkFBUixDQUZYLENBQUE7O0FBQUEsV0FHQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUixDQUhkLENBQUE7O0FBQUEsTUFLTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLGdCQUFDLE1BQUQsR0FBQTtBQUNYLFFBQUEseUJBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxNQUFNLENBQUMsU0FBUCxJQUFvQixNQUFNLENBQUMsUUFBdkMsQ0FBQTtBQUFBLElBQ0EsTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQURoQixDQUFBO0FBQUEsSUFFQSxNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFkLElBQXdCLE1BQU0sQ0FBQyxNQUZ4QyxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsU0FBRCxxQkFBYSxNQUFNLENBQUUsbUJBQVIsSUFBcUIsc0JBSmxDLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxnQkFBRCxxQkFBb0IsTUFBTSxDQUFFLG1CQUFSLElBQXFCLE1BTHpDLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxHQUFELEdBQU8sTUFBTSxDQUFDLEdBTmQsQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLEVBQUQsR0FBTSxNQUFNLENBQUMsRUFQYixDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsS0FBRCxHQUFTLE1BQU0sQ0FBQyxLQVJoQixDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsU0FBRCxHQUFhLEVBVGIsQ0FBQTtBQUFBLElBVUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQVZWLENBQUE7QUFBQSxJQVdBLElBQUMsQ0FBQSxNQUFELEdBQVUsRUFYVixDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsU0FBMUIsQ0FiQSxDQUFBO0FBQUEsSUFjQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsMkJBQUQsQ0FBNkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUEzQyxDQWRoQixDQUFBO0FBQUEsSUFlQSxJQUFDLENBQUEsU0FBRCxDQUFXLE1BQVgsQ0FmQSxDQUFBO0FBQUEsSUFnQkEsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FoQkEsQ0FEVztFQUFBLENBQWI7O0FBQUEsbUJBb0JBLHdCQUFBLEdBQTBCLFNBQUMsU0FBRCxHQUFBO0FBQ3hCLFFBQUEsNEJBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixFQUF2QixDQUFBO0FBQ0E7U0FBQSxnREFBQTsrQkFBQTtBQUNFLG9CQUFBLElBQUMsQ0FBQSxtQkFBb0IsQ0FBQSxRQUFRLENBQUMsRUFBVCxDQUFyQixHQUFvQyxTQUFwQyxDQURGO0FBQUE7b0JBRndCO0VBQUEsQ0FwQjFCLENBQUE7O0FBQUEsbUJBNEJBLEdBQUEsR0FBSyxTQUFDLGtCQUFELEVBQXFCLE1BQXJCLEdBQUE7QUFDSCxRQUFBLDRDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsbUJBQW9CLENBQUEsa0JBQWtCLENBQUMsRUFBbkIsQ0FBckIsR0FBOEMsTUFBOUMsQ0FBQTtBQUFBLElBQ0Esa0JBQUEsR0FBcUIsSUFBQyxDQUFBLDJCQUFELENBQTZCLGtCQUFrQixDQUFDLE1BQWhELENBRHJCLENBQUE7QUFBQSxJQUVBLGNBQUEsR0FBaUIsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxFQUFULEVBQWEsTUFBYixFQUFxQixrQkFBckIsQ0FGakIsQ0FBQTtBQUFBLElBSUEsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUNiO0FBQUEsTUFBQSxTQUFBLEVBQVcsSUFBQyxDQUFBLFNBQVo7QUFBQSxNQUNBLEVBQUEsRUFBSSxrQkFBa0IsQ0FBQyxFQUR2QjtBQUFBLE1BRUEsS0FBQSxFQUFPLGtCQUFrQixDQUFDLEtBRjFCO0FBQUEsTUFHQSxNQUFBLEVBQVEsY0FIUjtBQUFBLE1BSUEsSUFBQSxFQUFNLGtCQUFrQixDQUFDLElBSnpCO0FBQUEsTUFLQSxNQUFBLEVBQVEsa0JBQWtCLENBQUMsU0FBbkIsSUFBZ0MsQ0FMeEM7S0FEYSxDQUpmLENBQUE7QUFBQSxJQVlBLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixRQUFoQixDQVpBLENBQUE7V0FhQSxTQWRHO0VBQUEsQ0E1QkwsQ0FBQTs7QUFBQSxtQkE2Q0EsU0FBQSxHQUFXLFNBQUMsVUFBRCxHQUFBO0FBQ1QsUUFBQSw2SEFBQTtBQUFBO1NBQUEsdUJBQUE7b0NBQUE7QUFDRSxNQUFBLGVBQUEsR0FBa0IsSUFBQyxDQUFBLDJCQUFELENBQTZCLEtBQUssQ0FBQyxNQUFuQyxDQUFsQixDQUFBO0FBQUEsTUFDQSxXQUFBLEdBQWMsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxFQUFULEVBQWEsSUFBQyxDQUFBLFlBQWQsRUFBNEIsZUFBNUIsQ0FEZCxDQUFBO0FBQUEsTUFHQSxTQUFBLEdBQVksRUFIWixDQUFBO0FBSUE7QUFBQSxXQUFBLDJDQUFBOzhCQUFBO0FBQ0UsUUFBQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsbUJBQW9CLENBQUEsVUFBQSxDQUExQyxDQUFBO0FBQ0EsUUFBQSxJQUFHLGtCQUFIO0FBQ0UsVUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLEdBQUQsQ0FBSyxrQkFBTCxFQUF5QixXQUF6QixDQUFYLENBQUE7QUFBQSxVQUNBLFNBQVUsQ0FBQSxRQUFRLENBQUMsRUFBVCxDQUFWLEdBQXlCLFFBRHpCLENBREY7U0FBQSxNQUFBO0FBSUUsVUFBQSxHQUFHLENBQUMsSUFBSixDQUFVLGdCQUFBLEdBQWUsVUFBZixHQUEyQiw2QkFBM0IsR0FBdUQsU0FBdkQsR0FBa0UsbUJBQTVFLENBQUEsQ0FKRjtTQUZGO0FBQUEsT0FKQTtBQUFBLG9CQVlBLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixLQUFyQixFQUE0QixTQUE1QixFQVpBLENBREY7QUFBQTtvQkFEUztFQUFBLENBN0NYLENBQUE7O0FBQUEsbUJBOERBLHVCQUFBLEdBQXlCLFNBQUMsWUFBRCxHQUFBO0FBQ3ZCLFFBQUEsOENBQUE7QUFBQTtBQUFBO1NBQUEsa0JBQUE7NENBQUE7QUFDRSxNQUFBLElBQUcsa0JBQUg7c0JBQ0UsSUFBQyxDQUFBLEdBQUQsQ0FBSyxrQkFBTCxFQUF5QixJQUFDLENBQUEsWUFBMUIsR0FERjtPQUFBLE1BQUE7OEJBQUE7T0FERjtBQUFBO29CQUR1QjtFQUFBLENBOUR6QixDQUFBOztBQUFBLG1CQW9FQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLFNBQWQsR0FBQTtXQUNSLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQSxDQUFSLEdBQ0U7QUFBQSxNQUFBLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FBYjtBQUFBLE1BQ0EsU0FBQSxFQUFXLFNBRFg7TUFGTTtFQUFBLENBcEVWLENBQUE7O0FBQUEsbUJBMEVBLDJCQUFBLEdBQTZCLFNBQUMsTUFBRCxHQUFBO0FBQzNCLFFBQUEsb0RBQUE7QUFBQSxJQUFBLFlBQUEsR0FBZSxFQUFmLENBQUE7QUFDQSxJQUFBLElBQUcsTUFBSDtBQUNFLFdBQUEsNkNBQUE7cUNBQUE7QUFDRSxRQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsZUFBbkIsQ0FBZCxDQUFBO0FBQ0EsUUFBQSxJQUFnRCxXQUFoRDtBQUFBLFVBQUEsWUFBYSxDQUFBLFdBQVcsQ0FBQyxJQUFaLENBQWIsR0FBaUMsV0FBakMsQ0FBQTtTQUZGO0FBQUEsT0FERjtLQURBO1dBTUEsYUFQMkI7RUFBQSxDQTFFN0IsQ0FBQTs7QUFBQSxtQkFvRkEsaUJBQUEsR0FBbUIsU0FBQyxlQUFELEdBQUE7QUFDakIsSUFBQSxJQUFHLGVBQUEsSUFBbUIsZUFBZSxDQUFDLElBQXRDO2FBQ00sSUFBQSxXQUFBLENBQ0Y7QUFBQSxRQUFBLElBQUEsRUFBTSxlQUFlLENBQUMsSUFBdEI7QUFBQSxRQUNBLElBQUEsRUFBTSxlQUFlLENBQUMsSUFEdEI7QUFBQSxRQUVBLE9BQUEsRUFBUyxlQUFlLENBQUMsT0FGekI7QUFBQSxRQUdBLEtBQUEsRUFBTyxlQUFlLENBQUMsS0FIdkI7T0FERSxFQUROO0tBRGlCO0VBQUEsQ0FwRm5CLENBQUE7O0FBQUEsbUJBNkZBLE1BQUEsR0FBUSxTQUFDLFVBQUQsR0FBQTtXQUNOLElBQUMsQ0FBQSxjQUFELENBQWdCLFVBQWhCLEVBQTRCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLEVBQUQsR0FBQTtlQUMxQixLQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBa0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxFQUFWLENBQWxCLEVBQWlDLENBQWpDLEVBRDBCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUIsRUFETTtFQUFBLENBN0ZSLENBQUE7O0FBQUEsbUJBa0dBLEdBQUEsR0FBSyxTQUFDLFVBQUQsR0FBQTtXQUNILElBQUMsQ0FBQSxjQUFELENBQWdCLFVBQWhCLEVBQTRCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLEVBQUQsR0FBQTtBQUMxQixZQUFBLFFBQUE7QUFBQSxRQUFBLFFBQUEsR0FBVyxNQUFYLENBQUE7QUFBQSxRQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxDQUFELEVBQUksS0FBSixHQUFBO0FBQ0osVUFBQSxJQUFHLENBQUMsQ0FBQyxFQUFGLEtBQVEsRUFBWDttQkFDRSxRQUFBLEdBQVcsRUFEYjtXQURJO1FBQUEsQ0FBTixDQURBLENBQUE7ZUFLQSxTQU4wQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVCLEVBREc7RUFBQSxDQWxHTCxDQUFBOztBQUFBLG1CQTRHQSxRQUFBLEdBQVUsU0FBQyxVQUFELEdBQUE7V0FDUixJQUFDLENBQUEsY0FBRCxDQUFnQixVQUFoQixFQUE0QixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxFQUFELEdBQUE7QUFDMUIsWUFBQSxLQUFBO0FBQUEsUUFBQSxLQUFBLEdBQVEsTUFBUixDQUFBO0FBQUEsUUFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNKLFVBQUEsSUFBRyxDQUFDLENBQUMsRUFBRixLQUFRLEVBQVg7bUJBQ0UsS0FBQSxHQUFRLEVBRFY7V0FESTtRQUFBLENBQU4sQ0FEQSxDQUFBO2VBS0EsTUFOMEI7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QixFQURRO0VBQUEsQ0E1R1YsQ0FBQTs7QUFBQSxtQkFzSEEsY0FBQSxHQUFnQixTQUFDLFVBQUQsRUFBYSxRQUFiLEdBQUE7QUFDZCxRQUFBLG1CQUFBO0FBQUEsSUFBQSxPQUFvQixRQUFRLENBQUMsZUFBVCxDQUF5QixVQUF6QixDQUFwQixFQUFFLGlCQUFBLFNBQUYsRUFBYSxVQUFBLEVBQWIsQ0FBQTtBQUFBLElBRUEsTUFBQSxDQUFPLENBQUEsU0FBQSxJQUFpQixJQUFDLENBQUEsU0FBRCxLQUFjLFNBQXRDLEVBQ0csU0FBQSxHQUFOLElBQUMsQ0FBQSxTQUFLLEdBQXNCLGlEQUF0QixHQUFOLFNBQU0sR0FBbUYsR0FEdEYsQ0FGQSxDQUFBO1dBS0EsUUFBQSxDQUFTLEVBQVQsRUFOYztFQUFBLENBdEhoQixDQUFBOztBQUFBLG1CQStIQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7QUFDSixRQUFBLHlDQUFBO0FBQUE7QUFBQTtTQUFBLDJEQUFBOzZCQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLFFBQVQsRUFBbUIsS0FBbkIsRUFBQSxDQURGO0FBQUE7b0JBREk7RUFBQSxDQS9ITixDQUFBOztBQUFBLG1CQXFJQSxJQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ0osUUFBQSxTQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksRUFBWixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsUUFBRCxHQUFBO2FBQ0osU0FBUyxDQUFDLElBQVYsQ0FBZSxRQUFRLENBQUMsVUFBeEIsRUFESTtJQUFBLENBQU4sQ0FEQSxDQUFBO1dBSUEsVUFMSTtFQUFBLENBcklOLENBQUE7O0FBQUEsbUJBOElBLElBQUEsR0FBTSxTQUFDLFVBQUQsR0FBQTtBQUNKLFFBQUEsUUFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxHQUFELENBQUssVUFBTCxDQUFYLENBQUE7V0FDQSxRQUFRLENBQUMsUUFBVCxDQUFBLEVBRkk7RUFBQSxDQTlJTixDQUFBOztnQkFBQTs7SUFQRixDQUFBOzs7O0FDQUEsSUFBQSxjQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEsVUFBUixDQURULENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FFbEI7QUFBQSxJQUFBLE9BQUEsRUFBUyxFQUFUO0FBQUEsSUFZQSxJQUFBLEVBQU0sU0FBQyxJQUFELEdBQUE7QUFDSixVQUFBLG9CQUFBO0FBQUEsTUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFBLEtBQWUsUUFBbEI7ZUFDRSxNQUFBLENBQU8sS0FBUCxFQUFjLDZDQUFkLEVBREY7T0FBQSxNQUFBO0FBR0UsUUFBQSxZQUFBLEdBQWUsSUFBZixDQUFBO0FBQUEsUUFDQSxNQUFBLEdBQWEsSUFBQSxNQUFBLENBQU8sWUFBUCxDQURiLENBQUE7ZUFFQSxJQUFDLENBQUEsR0FBRCxDQUFLLE1BQUwsRUFMRjtPQURJO0lBQUEsQ0FaTjtBQUFBLElBcUJBLEdBQUEsRUFBSyxTQUFDLE1BQUQsR0FBQTtBQUNILFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxTQUFkLENBQUE7YUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixPQUZkO0lBQUEsQ0FyQkw7QUFBQSxJQTBCQSxHQUFBLEVBQUssU0FBQyxJQUFELEdBQUE7YUFDSCwyQkFERztJQUFBLENBMUJMO0FBQUEsSUE4QkEsR0FBQSxFQUFLLFNBQUMsSUFBRCxHQUFBO0FBQ0gsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLENBQVAsRUFBb0IsaUJBQUEsR0FBdkIsSUFBdUIsR0FBd0Isa0JBQTVDLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxFQUZOO0lBQUEsQ0E5Qkw7QUFBQSxJQW1DQSxVQUFBLEVBQVksU0FBQSxHQUFBO2FBQ1YsSUFBQyxDQUFBLE9BQUQsR0FBVyxHQUREO0lBQUEsQ0FuQ1o7SUFGa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUhqQixDQUFBOzs7O0FDQUEsSUFBQSx3QkFBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBQU4sQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEscUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxjQUFBO0FBQUEsSUFEYyxJQUFDLENBQUEsWUFBQSxNQUFNLElBQUMsQ0FBQSxZQUFBLE1BQU0sYUFBQSxPQUFPLGVBQUEsT0FDbkMsQ0FBQTtBQUFBLFlBQU8sSUFBQyxDQUFBLElBQVI7QUFBQSxXQUNPLFFBRFA7QUFFSSxRQUFBLE1BQUEsQ0FBTyxLQUFQLEVBQWMsMENBQWQsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBRFQsQ0FGSjtBQUNPO0FBRFAsV0FJTyxRQUpQO0FBS0ksUUFBQSxNQUFBLENBQU8sT0FBUCxFQUFnQiw0Q0FBaEIsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLE9BRFgsQ0FMSjtBQUlPO0FBSlA7QUFRSSxRQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVcscUNBQUEsR0FBbEIsSUFBQyxDQUFBLElBQWlCLEdBQTZDLEdBQXhELENBQUEsQ0FSSjtBQUFBLEtBRFc7RUFBQSxDQUFiOztBQUFBLHdCQWlCQSxlQUFBLEdBQWlCLFNBQUMsS0FBRCxHQUFBO0FBQ2YsSUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixDQUFIO0FBQ0UsTUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtlQUNFO0FBQUEsVUFBQSxNQUFBLEVBQVcsQ0FBQSxLQUFILEdBQWtCLENBQUMsSUFBQyxDQUFBLEtBQUYsQ0FBbEIsR0FBZ0MsTUFBeEM7QUFBQSxVQUNBLEdBQUEsRUFBSyxLQURMO1VBREY7T0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2VBQ0g7QUFBQSxVQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsQ0FBUjtBQUFBLFVBQ0EsR0FBQSxFQUFLLEtBREw7VUFERztPQUpQO0tBQUEsTUFBQTtBQVFFLE1BQUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7ZUFDRTtBQUFBLFVBQUEsTUFBQSxFQUFRLFlBQVI7QUFBQSxVQUNBLEdBQUEsRUFBSyxNQURMO1VBREY7T0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2VBQ0g7QUFBQSxVQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsQ0FBUjtBQUFBLFVBQ0EsR0FBQSxFQUFLLE1BREw7VUFERztPQVhQO0tBRGU7RUFBQSxDQWpCakIsQ0FBQTs7QUFBQSx3QkFrQ0EsYUFBQSxHQUFlLFNBQUMsS0FBRCxHQUFBO0FBQ2IsSUFBQSxJQUFHLENBQUEsS0FBSDthQUNFLEtBREY7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2FBQ0gsS0FBQSxLQUFTLElBQUMsQ0FBQSxNQURQO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjthQUNILElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBREc7S0FBQSxNQUFBO2FBR0gsR0FBRyxDQUFDLElBQUosQ0FBVSx3REFBQSxHQUFmLElBQUMsQ0FBQSxJQUFJLEVBSEc7S0FMUTtFQUFBLENBbENmLENBQUE7O0FBQUEsd0JBNkNBLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxRQUFBLHNCQUFBO0FBQUE7QUFBQSxTQUFBLDJDQUFBO3dCQUFBO0FBQ0UsTUFBQSxJQUFlLEtBQUEsS0FBUyxNQUFNLENBQUMsS0FBL0I7QUFBQSxlQUFPLElBQVAsQ0FBQTtPQURGO0FBQUEsS0FBQTtXQUdBLE1BSmM7RUFBQSxDQTdDaEIsQ0FBQTs7QUFBQSx3QkFvREEsWUFBQSxHQUFjLFNBQUMsS0FBRCxHQUFBO0FBQ1osUUFBQSw4QkFBQTtBQUFBLElBQUEsTUFBQSxHQUFTLEVBQVQsQ0FBQTtBQUNBO0FBQUEsU0FBQSwyQ0FBQTt3QkFBQTtBQUNFLE1BQUEsSUFBc0IsTUFBTSxDQUFDLEtBQVAsS0FBa0IsS0FBeEM7QUFBQSxRQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBWixDQUFBLENBQUE7T0FERjtBQUFBLEtBREE7V0FJQSxPQUxZO0VBQUEsQ0FwRGQsQ0FBQTs7QUFBQSx3QkE0REEsWUFBQSxHQUFjLFNBQUMsS0FBRCxHQUFBO0FBQ1osUUFBQSw4QkFBQTtBQUFBLElBQUEsTUFBQSxHQUFTLEVBQVQsQ0FBQTtBQUNBO0FBQUEsU0FBQSwyQ0FBQTt3QkFBQTtBQUNFLE1BQUEsSUFBNEIsTUFBTSxDQUFDLEtBQVAsS0FBa0IsS0FBOUM7QUFBQSxRQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBTSxDQUFDLEtBQW5CLENBQUEsQ0FBQTtPQURGO0FBQUEsS0FEQTtXQUlBLE9BTFk7RUFBQSxDQTVEZCxDQUFBOztxQkFBQTs7SUFMRixDQUFBOzs7O0FDQUEsSUFBQSxpR0FBQTtFQUFBO2lTQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMEJBQVIsQ0FBVCxDQUFBOztBQUFBLGtCQUNBLEdBQXFCLE9BQUEsQ0FBUSwyQ0FBUixDQURyQixDQUFBOztBQUFBLElBRUEsR0FBTyxPQUFBLENBQVEsNEJBQVIsQ0FGUCxDQUFBOztBQUFBLGVBR0EsR0FBa0IsT0FBQSxDQUFRLHdDQUFSLENBSGxCLENBQUE7O0FBQUEsUUFJQSxHQUFXLE9BQUEsQ0FBUSxzQkFBUixDQUpYLENBQUE7O0FBQUEsSUFLQSxHQUFPLE9BQUEsQ0FBUSxrQkFBUixDQUxQLENBQUE7O0FBQUEsWUFNQSxHQUFlLE9BQUEsQ0FBUSxzQkFBUixDQU5mLENBQUE7O0FBQUEsTUFPQSxHQUFTLE9BQUEsQ0FBUSwwQkFBUixDQVBULENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBdUI7QUFHckIsNkJBQUEsQ0FBQTs7QUFBYSxFQUFBLGtCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsV0FBQTtBQUFBLElBRGMsY0FBRixLQUFFLFdBQ2QsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxXQUFXLENBQUMsTUFBdEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsQ0FEQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTLEVBRlQsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsTUFIbkIsQ0FEVztFQUFBLENBQWI7O0FBQUEscUJBT0EsY0FBQSxHQUFnQixTQUFDLFdBQUQsR0FBQTtBQUNkLElBQUEsTUFBQSxDQUFPLFdBQVcsQ0FBQyxNQUFaLEtBQXNCLElBQUMsQ0FBQSxNQUE5QixFQUNFLHVEQURGLENBQUEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsV0FBRCxHQUFlLFdBSHhCLENBQUE7V0FJQSxJQUFDLENBQUEsd0JBQUQsQ0FBQSxFQUxjO0VBQUEsQ0FQaEIsQ0FBQTs7QUFBQSxxQkFlQSx3QkFBQSxHQUEwQixTQUFBLEdBQUE7V0FDeEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBckIsQ0FBeUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUN2QixLQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sRUFBZ0IsU0FBaEIsRUFEdUI7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixFQUR3QjtFQUFBLENBZjFCLENBQUE7O0FBQUEscUJBb0JBLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxPQUFULEdBQUE7QUFDVixRQUFBLHNCQUFBOztNQUFBLFNBQVUsTUFBTSxDQUFDLFFBQVEsQ0FBQztLQUExQjs7TUFDQSxVQUFXO0FBQUEsUUFBQSxRQUFBLEVBQVUsSUFBVjs7S0FEWDtBQUFBLElBR0EsT0FBQSxHQUFVLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxLQUFWLENBQUEsQ0FIVixDQUFBO0FBQUEsSUFLQSxPQUFPLENBQUMsUUFBUixHQUFtQixJQUFDLENBQUEsV0FBRCxDQUFhLE9BQWIsQ0FMbkIsQ0FBQTtBQUFBLElBTUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFiLENBTkEsQ0FBQTtBQUFBLElBUUEsSUFBQSxHQUFXLElBQUEsSUFBQSxDQUFLLElBQUMsQ0FBQSxXQUFOLEVBQW1CLE9BQVEsQ0FBQSxDQUFBLENBQTNCLENBUlgsQ0FBQTtBQUFBLElBU0EsT0FBQSxHQUFVLElBQUksQ0FBQyxNQUFMLENBQVksT0FBWixDQVRWLENBQUE7QUFXQSxJQUFBLElBQUcsSUFBSSxDQUFDLGFBQVI7QUFDRSxNQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixDQUFBLENBREY7S0FYQTtXQWNBLFFBZlU7RUFBQSxDQXBCWixDQUFBOztBQUFBLHFCQTZDQSxXQUFBLEdBQWEsU0FBQyxPQUFELEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYyxHQUFBLEdBQXBCLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTCxDQUF3QyxDQUFDLE1BQXpDLEtBQW1ELENBQXREO0FBQ0UsTUFBQSxRQUFBLEdBQVcsQ0FBQSxDQUFFLE9BQU8sQ0FBQyxJQUFSLENBQUEsQ0FBRixDQUFYLENBREY7S0FBQTtXQUdBLFNBSlc7RUFBQSxDQTdDYixDQUFBOztBQUFBLHFCQW9EQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixJQUFBLE1BQUEsQ0FBVyw0QkFBWCxFQUNFLDhFQURGLENBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxlQUFELEdBQW1CLEtBSkQ7RUFBQSxDQXBEcEIsQ0FBQTs7QUFBQSxxQkEyREEsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNGLElBQUEsUUFBQSxDQUNGO0FBQUEsTUFBQSxXQUFBLEVBQWEsSUFBQyxDQUFBLFdBQWQ7QUFBQSxNQUNBLGtCQUFBLEVBQXdCLElBQUEsa0JBQUEsQ0FBQSxDQUR4QjtLQURFLENBR0gsQ0FBQyxJQUhFLENBQUEsRUFERTtFQUFBLENBM0RSLENBQUE7O0FBQUEscUJBa0VBLFNBQUEsR0FBVyxTQUFBLEdBQUE7V0FDVCxJQUFDLENBQUEsV0FBVyxDQUFDLFNBQWIsQ0FBQSxFQURTO0VBQUEsQ0FsRVgsQ0FBQTs7QUFBQSxxQkFzRUEsTUFBQSxHQUFRLFNBQUMsUUFBRCxHQUFBO0FBQ04sUUFBQSxxQkFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBUCxDQUFBO0FBQ0EsSUFBQSxJQUFHLGdCQUFIO0FBQ0UsTUFBQSxRQUFBLEdBQVcsSUFBWCxDQUFBO0FBQUEsTUFDQSxLQUFBLEdBQVEsQ0FEUixDQUFBO2FBRUEsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLFFBQXJCLEVBQStCLEtBQS9CLEVBSEY7S0FBQSxNQUFBO2FBS0UsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFmLEVBTEY7S0FGTTtFQUFBLENBdEVSLENBQUE7O0FBQUEscUJBb0ZBLFVBQUEsR0FBWSxTQUFBLEdBQUE7V0FDVixJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBQSxFQURVO0VBQUEsQ0FwRlosQ0FBQTs7a0JBQUE7O0dBSHNDLGFBVHhDLENBQUE7Ozs7QUNBQSxJQUFBLFdBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsR0FDQSxHQUFNLE1BQU0sQ0FBQyxHQURiLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFDbEIsTUFBQSwwQkFBQTtBQUFBLEVBQUEsWUFBQSxHQUFtQixJQUFBLE1BQUEsQ0FBUSxTQUFBLEdBQTVCLEdBQUcsQ0FBQyxPQUF3QixHQUF1QixTQUEvQixDQUFuQixDQUFBO0FBQUEsRUFDQSxZQUFBLEdBQW1CLElBQUEsTUFBQSxDQUFRLFNBQUEsR0FBNUIsR0FBRyxDQUFDLE9BQXdCLEdBQXVCLFNBQS9CLENBRG5CLENBQUE7U0FLQTtBQUFBLElBQUEsZUFBQSxFQUFpQixTQUFDLElBQUQsR0FBQTtBQUNmLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUVBLGFBQU0sSUFBQSxJQUFRLElBQUksQ0FBQyxRQUFMLEtBQWlCLENBQS9CLEdBQUE7QUFDRSxRQUFBLElBQUcsWUFBWSxDQUFDLElBQWIsQ0FBa0IsSUFBSSxDQUFDLFNBQXZCLENBQUg7QUFDRSxVQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFoQixDQUFQLENBQUE7QUFDQSxpQkFBTyxJQUFQLENBRkY7U0FBQTtBQUFBLFFBSUEsSUFBQSxHQUFPLElBQUksQ0FBQyxVQUpaLENBREY7TUFBQSxDQUZBO0FBU0EsYUFBTyxNQUFQLENBVmU7SUFBQSxDQUFqQjtBQUFBLElBYUEsZUFBQSxFQUFpQixTQUFDLElBQUQsR0FBQTtBQUNmLFVBQUEsV0FBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUVBLGFBQU0sSUFBQSxJQUFRLElBQUksQ0FBQyxRQUFMLEtBQWlCLENBQS9CLEdBQUE7QUFDRSxRQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFoQixDQUFkLENBQUE7QUFDQSxRQUFBLElBQXNCLFdBQXRCO0FBQUEsaUJBQU8sV0FBUCxDQUFBO1NBREE7QUFBQSxRQUdBLElBQUEsR0FBTyxJQUFJLENBQUMsVUFIWixDQURGO01BQUEsQ0FGQTtBQVFBLGFBQU8sTUFBUCxDQVRlO0lBQUEsQ0FiakI7QUFBQSxJQXlCQSxjQUFBLEVBQWdCLFNBQUMsSUFBRCxHQUFBO0FBQ2QsVUFBQSx1Q0FBQTtBQUFBO0FBQUEsV0FBQSxxQkFBQTtrQ0FBQTtBQUNFLFFBQUEsSUFBWSxDQUFBLEdBQU8sQ0FBQyxnQkFBcEI7QUFBQSxtQkFBQTtTQUFBO0FBQUEsUUFFQSxhQUFBLEdBQWdCLEdBQUcsQ0FBQyxZQUZwQixDQUFBO0FBR0EsUUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBQUg7QUFDRSxpQkFBTztBQUFBLFlBQ0wsV0FBQSxFQUFhLGFBRFI7QUFBQSxZQUVMLFFBQUEsRUFBVSxJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQUZMO1dBQVAsQ0FERjtTQUpGO0FBQUEsT0FBQTtBQVVBLGFBQU8sTUFBUCxDQVhjO0lBQUEsQ0F6QmhCO0FBQUEsSUF3Q0EsYUFBQSxFQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsVUFBQSxrQ0FBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUQ1QyxDQUFBO0FBR0EsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUNFLFFBQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQUFIO0FBQ0UsVUFBQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBQWhCLENBQUE7QUFDQSxVQUFBLElBQUcsQ0FBQSxZQUFnQixDQUFDLElBQWIsQ0FBa0IsSUFBSSxDQUFDLFNBQXZCLENBQVA7QUFDRSxZQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixDQUFQLENBREY7V0FEQTtBQUlBLGlCQUFPO0FBQUEsWUFDTCxJQUFBLEVBQU0sSUFERDtBQUFBLFlBRUwsYUFBQSxFQUFlLGFBRlY7QUFBQSxZQUdMLFdBQUEsRUFBYSxJQUhSO1dBQVAsQ0FMRjtTQUFBO0FBQUEsUUFXQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBWFosQ0FERjtNQUFBLENBSEE7YUFpQkEsR0FsQmE7SUFBQSxDQXhDZjtBQUFBLElBNkRBLFlBQUEsRUFBYyxTQUFDLElBQUQsR0FBQTtBQUNaLFVBQUEsb0JBQUE7QUFBQSxNQUFBLFNBQUEsR0FBWSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUFwQyxDQUFBO0FBQ0EsTUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQWxCLENBQUg7QUFDRSxRQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFsQixDQUFaLENBQUE7QUFDQSxlQUFPLFNBQVAsQ0FGRjtPQUZZO0lBQUEsQ0E3RGQ7QUFBQSxJQW9FQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixVQUFBLHlCQUFBO0FBQUEsTUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBbEMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixRQUFsQixDQUFIO0FBQ0UsUUFBQSxlQUFBLEdBQWtCLElBQUksQ0FBQyxZQUFMLENBQWtCLFFBQWxCLENBQWxCLENBQUE7QUFDQSxlQUFPLGVBQVAsQ0FGRjtPQUZrQjtJQUFBLENBcEVwQjtBQUFBLElBMkVBLGVBQUEsRUFBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixVQUFBLHVCQUFBO0FBQUEsTUFBQSxZQUFBLEdBQWUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBMUMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQixDQUFIO0FBQ0UsUUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFlBQUwsQ0FBa0IsWUFBbEIsQ0FBWixDQUFBO0FBQ0EsZUFBTyxZQUFQLENBRkY7T0FGZTtJQUFBLENBM0VqQjtBQUFBLElBa0ZBLFVBQUEsRUFBWSxTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDVixVQUFBLDRDQUFBO0FBQUEsTUFEbUIsV0FBQSxLQUFLLFlBQUEsSUFDeEIsQ0FBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUQ1QyxDQUFBO0FBR0EsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUVFLFFBQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQUFIO0FBQ0UsVUFBQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQXpCLENBQXJCLENBQUE7QUFDQSxVQUFBLElBQUcsMEJBQUg7QUFDRSxtQkFBTyxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsa0JBQXpCLENBQVAsQ0FERjtXQUFBLE1BQUE7QUFHRSxtQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsQ0FBUCxDQUhGO1dBRkY7U0FBQSxNQVFLLElBQUcsWUFBWSxDQUFDLElBQWIsQ0FBa0IsSUFBSSxDQUFDLFNBQXZCLENBQUg7QUFDSCxpQkFBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsRUFBd0I7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQXhCLENBQVAsQ0FERztTQUFBLE1BSUEsSUFBRyxZQUFZLENBQUMsSUFBYixDQUFrQixJQUFJLENBQUMsU0FBdkIsQ0FBSDtBQUNILFVBQUEsa0JBQUEsR0FBcUIsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLEVBQXlCO0FBQUEsWUFBRSxLQUFBLEdBQUY7QUFBQSxZQUFPLE1BQUEsSUFBUDtXQUF6QixDQUFyQixDQUFBO0FBQ0EsVUFBQSxJQUFHLDBCQUFIO0FBQ0UsbUJBQU8sSUFBQyxDQUFBLHVCQUFELENBQXlCLGtCQUF6QixDQUFQLENBREY7V0FBQSxNQUFBO0FBR0UsbUJBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmLENBQVAsQ0FIRjtXQUZHO1NBWkw7QUFBQSxRQW1CQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBbkJaLENBRkY7TUFBQSxDQUpVO0lBQUEsQ0FsRlo7QUFBQSxJQThHQSxnQkFBQSxFQUFrQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDaEIsVUFBQSxtQkFBQTtBQUFBLE1BRHlCLFdBQUEsS0FBSyxZQUFBLE1BQU0sZ0JBQUEsUUFDcEMsQ0FBQTthQUFBO0FBQUEsUUFBQSxNQUFBLEVBQVEsU0FBUjtBQUFBLFFBQ0EsV0FBQSxFQUFhLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBRGI7QUFBQSxRQUVBLFFBQUEsRUFBVSxRQUFBLElBQVksSUFBQyxDQUFBLG9CQUFELENBQXNCLElBQXRCLEVBQTRCO0FBQUEsVUFBRSxLQUFBLEdBQUY7QUFBQSxVQUFPLE1BQUEsSUFBUDtTQUE1QixDQUZ0QjtRQURnQjtJQUFBLENBOUdsQjtBQUFBLElBb0hBLHVCQUFBLEVBQXlCLFNBQUMsa0JBQUQsR0FBQTtBQUN2QixVQUFBLGNBQUE7QUFBQSxNQUFBLElBQUEsR0FBTyxrQkFBa0IsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFoQyxDQUFBO0FBQUEsTUFDQSxRQUFBLEdBQVcsa0JBQWtCLENBQUMsUUFEOUIsQ0FBQTthQUVBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixFQUF3QjtBQUFBLFFBQUUsVUFBQSxRQUFGO09BQXhCLEVBSHVCO0lBQUEsQ0FwSHpCO0FBQUEsSUEwSEEsa0JBQUEsRUFBb0IsU0FBQyxJQUFELEdBQUE7QUFDbEIsVUFBQSw0QkFBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUE1QyxDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBRGhCLENBQUE7YUFHQTtBQUFBLFFBQUEsTUFBQSxFQUFRLFdBQVI7QUFBQSxRQUNBLElBQUEsRUFBTSxJQUROO0FBQUEsUUFFQSxXQUFBLEVBQWEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsQ0FGYjtBQUFBLFFBR0EsYUFBQSxFQUFlLGFBSGY7UUFKa0I7SUFBQSxDQTFIcEI7QUFBQSxJQW9JQSxhQUFBLEVBQWUsU0FBQyxJQUFELEdBQUE7QUFDYixVQUFBLFdBQUE7QUFBQSxNQUFBLFdBQUEsR0FBYyxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsSUFBUixDQUFhLGFBQWIsQ0FBZCxDQUFBO2FBRUE7QUFBQSxRQUFBLE1BQUEsRUFBUSxNQUFSO0FBQUEsUUFDQSxJQUFBLEVBQU0sSUFETjtBQUFBLFFBRUEsV0FBQSxFQUFhLFdBRmI7UUFIYTtJQUFBLENBcElmO0FBQUEsSUE4SUEsb0JBQUEsRUFBc0IsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO0FBQ3BCLFVBQUEsaURBQUE7QUFBQSxNQUQ2QixXQUFBLEtBQUssWUFBQSxJQUNsQyxDQUFBO0FBQUEsTUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsTUFDQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUFjLENBQUMsR0FEekIsQ0FBQTtBQUFBLE1BRUEsVUFBQSxHQUFhLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FGYixDQUFBO0FBQUEsTUFHQSxVQUFBLEdBQWEsT0FBQSxHQUFVLFVBSHZCLENBQUE7QUFLQSxNQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFBLEdBQTBCLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixFQUFlLFVBQWYsQ0FBN0I7ZUFDRSxTQURGO09BQUEsTUFBQTtlQUdFLFFBSEY7T0FOb0I7SUFBQSxDQTlJdEI7QUFBQSxJQTJKQSxpQkFBQSxFQUFtQixTQUFDLFNBQUQsRUFBWSxJQUFaLEdBQUE7QUFDakIsVUFBQSw2Q0FBQTtBQUFBLE1BRCtCLFdBQUEsS0FBSyxZQUFBLElBQ3BDLENBQUE7QUFBQSxNQUFBLFNBQUEsR0FBWSxDQUFBLENBQUUsU0FBRixDQUFZLENBQUMsSUFBYixDQUFtQixHQUFBLEdBQWxDLEdBQUcsQ0FBQyxPQUFXLENBQVosQ0FBQTtBQUFBLE1BQ0EsT0FBQSxHQUFVLE1BRFYsQ0FBQTtBQUFBLE1BRUEsY0FBQSxHQUFpQixNQUZqQixDQUFBO0FBQUEsTUFJQSxTQUFTLENBQUMsSUFBVixDQUFlLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsRUFBUSxJQUFSLEdBQUE7QUFDYixjQUFBLHNDQUFBO0FBQUEsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsVUFDQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUFjLENBQUMsR0FEekIsQ0FBQTtBQUFBLFVBRUEsVUFBQSxHQUFhLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FGYixDQUFBO0FBQUEsVUFHQSxVQUFBLEdBQWEsT0FBQSxHQUFVLFVBSHZCLENBQUE7QUFLQSxVQUFBLElBQU8saUJBQUosSUFBZ0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFBLEdBQTBCLE9BQTdDO0FBQ0UsWUFBQSxPQUFBLEdBQVUsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFWLENBQUE7QUFBQSxZQUNBLGNBQUEsR0FBaUI7QUFBQSxjQUFFLE9BQUEsS0FBRjtBQUFBLGNBQVMsUUFBQSxFQUFVLFFBQW5CO2FBRGpCLENBREY7V0FMQTtBQVFBLFVBQUEsSUFBTyxpQkFBSixJQUFnQixLQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxVQUFmLENBQUEsR0FBNkIsT0FBaEQ7QUFDRSxZQUFBLE9BQUEsR0FBVSxLQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxVQUFmLENBQVYsQ0FBQTttQkFDQSxjQUFBLEdBQWlCO0FBQUEsY0FBRSxPQUFBLEtBQUY7QUFBQSxjQUFTLFFBQUEsRUFBVSxPQUFuQjtjQUZuQjtXQVRhO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZixDQUpBLENBQUE7YUFpQkEsZUFsQmlCO0lBQUEsQ0EzSm5CO0FBQUEsSUFnTEEsUUFBQSxFQUFVLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNSLE1BQUEsSUFBRyxDQUFBLEdBQUksQ0FBUDtlQUFjLENBQUEsR0FBSSxFQUFsQjtPQUFBLE1BQUE7ZUFBeUIsQ0FBQSxHQUFJLEVBQTdCO09BRFE7SUFBQSxDQWhMVjtBQUFBLElBc0xBLHVCQUFBLEVBQXlCLFNBQUMsSUFBRCxHQUFBO0FBQ3ZCLFVBQUEsK0RBQUE7QUFBQSxNQUFBLElBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFkLEdBQStCLENBQWxDO0FBQ0U7QUFBQTthQUFBLFlBQUE7NEJBQUE7QUFDRSxVQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFDQSxVQUFBLElBQVksS0FBSyxDQUFDLFFBQU4sQ0FBZSxHQUFHLENBQUMsa0JBQW5CLENBQVo7QUFBQSxxQkFBQTtXQURBO0FBQUEsVUFFQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUZWLENBQUE7QUFBQSxVQUdBLFlBQUEsR0FBZSxPQUFPLENBQUMsTUFBUixDQUFBLENBSGYsQ0FBQTtBQUFBLFVBSUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxXQUFOLENBQWtCLElBQWxCLENBQUEsR0FBMEIsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUpsQyxDQUFBO0FBQUEsVUFLQSxLQUFLLENBQUMsTUFBTixDQUFhLFlBQUEsR0FBZSxLQUE1QixDQUxBLENBQUE7QUFBQSx3QkFNQSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQUcsQ0FBQyxrQkFBbkIsRUFOQSxDQURGO0FBQUE7d0JBREY7T0FEdUI7SUFBQSxDQXRMekI7QUFBQSxJQW9NQSxzQkFBQSxFQUF3QixTQUFBLEdBQUE7YUFDdEIsQ0FBQSxDQUFHLEdBQUEsR0FBTixHQUFHLENBQUMsa0JBQUQsQ0FDRSxDQUFDLEdBREgsQ0FDTyxRQURQLEVBQ2lCLEVBRGpCLENBRUUsQ0FBQyxXQUZILENBRWUsR0FBRyxDQUFDLGtCQUZuQixFQURzQjtJQUFBLENBcE14QjtBQUFBLElBME1BLGNBQUEsRUFBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxNQUFBLG1CQUFHLElBQUksQ0FBRSxlQUFUO2VBQ0UsSUFBSyxDQUFBLENBQUEsRUFEUDtPQUFBLE1BRUssb0JBQUcsSUFBSSxDQUFFLGtCQUFOLEtBQWtCLENBQXJCO2VBQ0gsSUFBSSxDQUFDLFdBREY7T0FBQSxNQUFBO2VBR0gsS0FIRztPQUhTO0lBQUEsQ0ExTWhCO0FBQUEsSUFxTkEsY0FBQSxFQUFnQixTQUFDLElBQUQsR0FBQTthQUNkLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxJQUFSLENBQWEsU0FBYixFQURjO0lBQUEsQ0FyTmhCO0FBQUEsSUEyTkEsNkJBQUEsRUFBK0IsU0FBQyxJQUFELEdBQUE7QUFDN0IsVUFBQSxtQ0FBQTtBQUFBLE1BQUEsR0FBQSxHQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBekIsQ0FBQTtBQUFBLE1BQ0EsT0FBdUIsSUFBQyxDQUFBLGlCQUFELENBQW1CLEdBQW5CLENBQXZCLEVBQUUsZUFBQSxPQUFGLEVBQVcsZUFBQSxPQURYLENBQUE7QUFBQSxNQUlBLE1BQUEsR0FBUyxJQUFJLENBQUMscUJBQUwsQ0FBQSxDQUpULENBQUE7QUFBQSxNQUtBLE1BQUEsR0FDRTtBQUFBLFFBQUEsR0FBQSxFQUFLLE1BQU0sQ0FBQyxHQUFQLEdBQWEsT0FBbEI7QUFBQSxRQUNBLE1BQUEsRUFBUSxNQUFNLENBQUMsTUFBUCxHQUFnQixPQUR4QjtBQUFBLFFBRUEsSUFBQSxFQUFNLE1BQU0sQ0FBQyxJQUFQLEdBQWMsT0FGcEI7QUFBQSxRQUdBLEtBQUEsRUFBTyxNQUFNLENBQUMsS0FBUCxHQUFlLE9BSHRCO09BTkYsQ0FBQTtBQUFBLE1BV0EsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsTUFBTSxDQUFDLEdBWHZDLENBQUE7QUFBQSxNQVlBLE1BQU0sQ0FBQyxLQUFQLEdBQWUsTUFBTSxDQUFDLEtBQVAsR0FBZSxNQUFNLENBQUMsSUFackMsQ0FBQTthQWNBLE9BZjZCO0lBQUEsQ0EzTi9CO0FBQUEsSUE2T0EsaUJBQUEsRUFBbUIsU0FBQyxHQUFELEdBQUE7YUFFakI7QUFBQSxRQUFBLE9BQUEsRUFBYSxHQUFHLENBQUMsV0FBSixLQUFtQixNQUF2QixHQUF1QyxHQUFHLENBQUMsV0FBM0MsR0FBNEQsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWIsSUFBZ0MsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBbEQsSUFBZ0UsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUE5RSxDQUFtRixDQUFDLFVBQXpKO0FBQUEsUUFDQSxPQUFBLEVBQWEsR0FBRyxDQUFDLFdBQUosS0FBbUIsTUFBdkIsR0FBdUMsR0FBRyxDQUFDLFdBQTNDLEdBQTRELENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFiLElBQWdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQWxELElBQWdFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBOUUsQ0FBbUYsQ0FBQyxTQUR6SjtRQUZpQjtJQUFBLENBN09uQjtJQU5rQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBUGpCLENBQUE7Ozs7QUNBQSxJQUFBLGdCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BUU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxrQkFBRSxJQUFGLEVBQVEsT0FBUixHQUFBO0FBQ1gsUUFBQSxhQUFBO0FBQUEsSUFEWSxJQUFDLENBQUEsT0FBQSxJQUNiLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxRQUFELEVBQVcsV0FBWCxFQUF3QixNQUF4QixDQUFULENBQUE7QUFBQSxJQUVBLGFBQUEsR0FDRTtBQUFBLE1BQUEsY0FBQSxFQUFnQixLQUFoQjtBQUFBLE1BQ0EsV0FBQSxFQUFhLE1BRGI7QUFBQSxNQUVBLFVBQUEsRUFBWSxFQUZaO0FBQUEsTUFHQSxTQUFBLEVBQ0U7QUFBQSxRQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsUUFDQSxLQUFBLEVBQU8sR0FEUDtBQUFBLFFBRUEsU0FBQSxFQUFXLENBRlg7T0FKRjtBQUFBLE1BT0EsSUFBQSxFQUNFO0FBQUEsUUFBQSxRQUFBLEVBQVUsQ0FBVjtPQVJGO0tBSEYsQ0FBQTtBQUFBLElBYUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQWUsYUFBZixFQUE4QixPQUE5QixDQWJqQixDQUFBO0FBQUEsSUFlQSxJQUFDLENBQUEsVUFBRCxHQUFjLE1BZmQsQ0FBQTtBQUFBLElBZ0JBLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFoQmYsQ0FBQTtBQUFBLElBaUJBLElBQUMsQ0FBQSxXQUFELEdBQWUsS0FqQmYsQ0FBQTtBQUFBLElBa0JBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FsQlgsQ0FEVztFQUFBLENBQWI7O0FBQUEscUJBc0JBLFVBQUEsR0FBWSxTQUFDLE9BQUQsR0FBQTtBQUNWLElBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFBZSxFQUFmLEVBQW1CLElBQUMsQ0FBQSxhQUFwQixFQUFtQyxPQUFuQyxDQUFYLENBQUE7V0FDQSxJQUFDLENBQUEsSUFBRCxHQUFXLHNCQUFILEdBQ04sUUFETSxHQUVBLHlCQUFILEdBQ0gsV0FERyxHQUVHLG9CQUFILEdBQ0gsTUFERyxHQUdILFlBVFE7RUFBQSxDQXRCWixDQUFBOztBQUFBLHFCQWtDQSxjQUFBLEdBQWdCLFNBQUMsV0FBRCxHQUFBO0FBQ2QsSUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlLFdBQWYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixHQUFvQixJQUFDLENBQUEsS0FGUDtFQUFBLENBbENoQixDQUFBOztBQUFBLHFCQXlDQSxJQUFBLEdBQU0sU0FBQyxXQUFELEVBQWMsS0FBZCxFQUFxQixPQUFyQixHQUFBO0FBQ0osSUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQUEsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQURmLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxVQUFELENBQVksT0FBWixDQUZBLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxjQUFELENBQWdCLFdBQWhCLENBSEEsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FKZCxDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FOQSxDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FQQSxDQUFBO0FBU0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsV0FBWjtBQUNFLE1BQUEsSUFBQyxDQUFBLHFCQUFELENBQXVCLElBQUMsQ0FBQSxVQUF4QixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsVUFBQSxDQUFXLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFBLEdBQUE7QUFDbEIsVUFBQSxLQUFDLENBQUEsd0JBQUQsQ0FBQSxDQUFBLENBQUE7aUJBQ0EsS0FBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLEVBRmtCO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxFQUdQLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEtBSFosQ0FEWCxDQURGO0tBQUEsTUFNSyxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtBQUNILE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLENBQUEsQ0FERztLQWZMO0FBbUJBLElBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxjQUFuQzthQUFBLEtBQUssQ0FBQyxjQUFOLENBQUEsRUFBQTtLQXBCSTtFQUFBLENBekNOLENBQUE7O0FBQUEscUJBZ0VBLElBQUEsR0FBTSxTQUFDLEtBQUQsR0FBQTtBQUNKLFFBQUEsYUFBQTtBQUFBLElBQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FBaEIsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFdBQVo7QUFDRSxNQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBQXlCLElBQUMsQ0FBQSxVQUExQixDQUFBLEdBQXdDLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQTlEO2VBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQURGO09BREY7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxNQUFaO0FBQ0gsTUFBQSxJQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsYUFBVixFQUF5QixJQUFDLENBQUEsVUFBMUIsQ0FBQSxHQUF3QyxJQUFDLENBQUEsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUF6RDtlQUNFLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBUCxFQURGO09BREc7S0FMRDtFQUFBLENBaEVOLENBQUE7O0FBQUEscUJBMkVBLEtBQUEsR0FBTyxTQUFDLEtBQUQsR0FBQTtBQUNMLFFBQUEsYUFBQTtBQUFBLElBQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FBaEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQURYLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FKQSxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFaLENBQXFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWhDLENBTEEsQ0FBQTtXQU1BLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBYixDQUFtQixhQUFuQixFQVBLO0VBQUEsQ0EzRVAsQ0FBQTs7QUFBQSxxQkFxRkEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsSUFBdUIsSUFBQyxDQUFBLE9BQXhCO0FBQUEsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBQSxDQUFBLENBQUE7S0FBQTtXQUNBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFGSTtFQUFBLENBckZOLENBQUE7O0FBQUEscUJBMEZBLEtBQUEsR0FBTyxTQUFBLEdBQUE7QUFDTCxJQUFBLElBQUcsSUFBQyxDQUFBLE9BQUo7QUFDRSxNQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FBWCxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFaLENBQXdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQW5DLENBREEsQ0FERjtLQUFBO0FBS0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxXQUFKO0FBQ0UsTUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlLEtBQWYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxNQURkLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBYixDQUFBLENBRkEsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQUhmLENBQUE7QUFJQSxNQUFBLElBQUcsb0JBQUg7QUFDRSxRQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsT0FBZCxDQUFBLENBQUE7QUFBQSxRQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsTUFEWCxDQURGO09BSkE7QUFBQSxNQVFBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLGtCQUFwQixDQVJBLENBQUE7QUFBQSxNQVNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBLENBVEEsQ0FBQTthQVVBLElBQUMsQ0FBQSxhQUFELENBQUEsRUFYRjtLQU5LO0VBQUEsQ0ExRlAsQ0FBQTs7QUFBQSxxQkE4R0EsVUFBQSxHQUFZLFNBQUEsR0FBQTtBQUNWLFFBQUEsUUFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLENBQUEsQ0FBRSwyQkFBRixDQUNULENBQUMsSUFEUSxDQUNILE9BREcsRUFDTSwyREFETixDQUFYLENBQUE7V0FFQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLENBQW1CLFFBQW5CLEVBSFU7RUFBQSxDQTlHWixDQUFBOztBQUFBLHFCQW9IQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFpQixjQUFqQixDQUFnQyxDQUFDLE1BQWpDLENBQUEsRUFEYTtFQUFBLENBcEhmLENBQUE7O0FBQUEscUJBeUhBLHFCQUFBLEdBQXVCLFNBQUMsSUFBRCxHQUFBO0FBQ3JCLFFBQUEsd0JBQUE7QUFBQSxJQUR3QixhQUFBLE9BQU8sYUFBQSxLQUMvQixDQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsSUFBZSxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBakM7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBQ0EsVUFBQSxHQUFhLENBQUEsQ0FBRyxlQUFBLEdBQW5CLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQVEsR0FBK0Msc0JBQWxELENBRGIsQ0FBQTtBQUFBLElBRUEsVUFBVSxDQUFDLEdBQVgsQ0FBZTtBQUFBLE1BQUEsSUFBQSxFQUFNLEtBQU47QUFBQSxNQUFhLEdBQUEsRUFBSyxLQUFsQjtLQUFmLENBRkEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQVosQ0FBbUIsVUFBbkIsRUFKcUI7RUFBQSxDQXpIdkIsQ0FBQTs7QUFBQSxxQkFnSUEsd0JBQUEsR0FBMEIsU0FBQSxHQUFBO1dBQ3hCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosQ0FBa0IsR0FBQSxHQUFyQixNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFSLENBQXVELENBQUMsTUFBeEQsQ0FBQSxFQUR3QjtFQUFBLENBaEkxQixDQUFBOztBQUFBLHFCQXFJQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixRQUFBLFVBQUE7QUFBQSxJQUFBLFVBQUEsR0FDSyxLQUFLLENBQUMsSUFBTixLQUFjLFlBQWpCLEdBQ0UsaUZBREYsR0FHRSx5QkFKSixDQUFBO1dBTUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsVUFBbkIsRUFBK0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUM3QixLQUFDLENBQUEsSUFBRCxDQUFBLEVBRDZCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0IsRUFQZ0I7RUFBQSxDQXJJbEIsQ0FBQTs7QUFBQSxxQkFpSkEsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsSUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLEtBQWMsWUFBakI7YUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFoQixDQUFtQiwyQkFBbkIsRUFBZ0QsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsS0FBRCxHQUFBO0FBQzlDLFVBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUY4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBREY7S0FBQSxNQUFBO2FBU0UsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsMkJBQW5CLEVBQWdELENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUM5QyxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUQ4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBVEY7S0FEZ0I7RUFBQSxDQWpKbEIsQ0FBQTs7QUFBQSxxQkFrS0EsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsSUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLEtBQWMsWUFBZCxJQUE4QixLQUFLLENBQUMsSUFBTixLQUFjLFdBQS9DO0FBQ0UsTUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLGFBQWEsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUEzQyxDQURGO0tBQUE7V0FHQTtBQUFBLE1BQUEsT0FBQSxFQUFTLEtBQUssQ0FBQyxPQUFmO0FBQUEsTUFDQSxPQUFBLEVBQVMsS0FBSyxDQUFDLE9BRGY7QUFBQSxNQUVBLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FGYjtBQUFBLE1BR0EsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUhiO01BSmdCO0VBQUEsQ0FsS2xCLENBQUE7O0FBQUEscUJBNEtBLFFBQUEsR0FBVSxTQUFDLE1BQUQsRUFBUyxNQUFULEdBQUE7QUFDUixRQUFBLFlBQUE7QUFBQSxJQUFBLElBQW9CLENBQUEsTUFBQSxJQUFXLENBQUEsTUFBL0I7QUFBQSxhQUFPLE1BQVAsQ0FBQTtLQUFBO0FBQUEsSUFFQSxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsR0FBZSxNQUFNLENBQUMsS0FGOUIsQ0FBQTtBQUFBLElBR0EsS0FBQSxHQUFRLE1BQU0sQ0FBQyxLQUFQLEdBQWUsTUFBTSxDQUFDLEtBSDlCLENBQUE7V0FJQSxJQUFJLENBQUMsSUFBTCxDQUFXLENBQUMsS0FBQSxHQUFRLEtBQVQsQ0FBQSxHQUFrQixDQUFDLEtBQUEsR0FBUSxLQUFULENBQTdCLEVBTFE7RUFBQSxDQTVLVixDQUFBOztrQkFBQTs7SUFWRixDQUFBOzs7O0FDQUEsSUFBQSwrQkFBQTtFQUFBLGtCQUFBOztBQUFBLEdBQUEsR0FBTSxPQUFBLENBQVEsT0FBUixDQUFOLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsTUFNTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDRCQUFFLElBQUYsR0FBQTtBQUVYLElBRlksSUFBQyxDQUFBLE9BQUEsSUFFYixDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FBUztBQUFBLE1BQUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBZDtLQUFULENBQWhCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFlBRjNDLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUhiLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxRQUNDLENBQUMsS0FESCxDQUNTLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLEtBQWQsQ0FEVCxDQUVFLENBQUMsSUFGSCxDQUVRLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLElBQWQsQ0FGUixDQUdFLENBQUMsTUFISCxDQUdVLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE1BQWQsQ0FIVixDQUlFLENBQUMsS0FKSCxDQUlTLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLEtBQWQsQ0FKVCxDQUtFLENBQUMsS0FMSCxDQUtTLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLEtBQWQsQ0FMVCxDQU1FLENBQUMsU0FOSCxDQU1hLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLGdCQUFkLENBTmIsQ0FPRSxDQUFDLE9BUEgsQ0FPVyxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxPQUFkLENBUFgsQ0FMQSxDQUZXO0VBQUEsQ0FBYjs7QUFBQSwrQkFtQkEsR0FBQSxHQUFLLFNBQUMsS0FBRCxHQUFBO1dBQ0gsSUFBQyxDQUFBLFFBQVEsQ0FBQyxHQUFWLENBQWMsS0FBZCxFQURHO0VBQUEsQ0FuQkwsQ0FBQTs7QUFBQSwrQkF1QkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtXQUNWLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFBLEVBRFU7RUFBQSxDQXZCWixDQUFBOztBQUFBLCtCQTJCQSxXQUFBLEdBQWEsU0FBQSxHQUFBO1dBQ1gsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFELENBQVQsQ0FBQSxFQURXO0VBQUEsQ0EzQmIsQ0FBQTs7QUFBQSwrQkFxQ0EsV0FBQSxHQUFhLFNBQUMsSUFBRCxHQUFBO1dBQ1gsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUNFLFlBQUEsaUNBQUE7QUFBQSxRQURELHdCQUFTLDhEQUNSLENBQUE7QUFBQSxRQUFBLElBQUEsR0FBTyxHQUFHLENBQUMsZUFBSixDQUFvQixPQUFwQixDQUFQLENBQUE7QUFBQSxRQUNBLFlBQUEsR0FBZSxPQUFPLENBQUMsWUFBUixDQUFxQixLQUFDLENBQUEsWUFBdEIsQ0FEZixDQUFBO0FBQUEsUUFFQSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsRUFBbUIsWUFBbkIsQ0FGQSxDQUFBO2VBR0EsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFYLEVBQWlCLElBQWpCLEVBSkY7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxFQURXO0VBQUEsQ0FyQ2IsQ0FBQTs7QUFBQSwrQkE2Q0EsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLFlBQVAsR0FBQTtBQUNYLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsWUFBVCxDQUFSLENBQUE7QUFDQSxJQUFBLElBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUF2QixDQUE0QixLQUE1QixDQUFBLElBQXNDLEtBQUEsS0FBUyxFQUFsRDtBQUNFLE1BQUEsS0FBQSxHQUFRLE1BQVIsQ0FERjtLQURBO1dBSUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFYLENBQWUsWUFBZixFQUE2QixLQUE3QixFQUxXO0VBQUEsQ0E3Q2IsQ0FBQTs7QUFBQSwrQkFxREEsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLFlBQVAsR0FBQTtBQUNMLFFBQUEsT0FBQTtBQUFBLElBQUEsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsWUFBbkIsQ0FBQSxDQUFBO0FBQUEsSUFFQSxPQUFBLEdBQVUsSUFBSSxDQUFDLG1CQUFMLENBQXlCLFlBQXpCLENBRlYsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBWixDQUE0QixPQUE1QixFQUFxQyxJQUFyQyxDQUhBLENBQUE7V0FJQSxLQUxLO0VBQUEsQ0FyRFAsQ0FBQTs7QUFBQSwrQkE2REEsSUFBQSxHQUFNLFNBQUMsSUFBRCxFQUFPLFlBQVAsR0FBQTtBQUNKLFFBQUEsT0FBQTtBQUFBLElBQUEsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsWUFBbEIsQ0FBQSxDQUFBO0FBQUEsSUFFQSxPQUFBLEdBQVUsSUFBSSxDQUFDLG1CQUFMLENBQXlCLFlBQXpCLENBRlYsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBWixDQUE0QixPQUE1QixFQUFxQyxJQUFyQyxDQUhBLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixFQUFtQixZQUFuQixDQUpBLENBQUE7V0FLQSxLQU5JO0VBQUEsQ0E3RE4sQ0FBQTs7QUFBQSwrQkFzRUEsTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLFlBQVAsRUFBcUIsU0FBckIsRUFBZ0MsTUFBaEMsR0FBQTtBQUNOLFFBQUEsb0NBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFFRSxNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBM0IsQ0FBQTtBQUFBLE1BQ0EsUUFBQSxHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQWIsQ0FBaUIsV0FBakIsQ0FEWCxDQUFBO0FBQUEsTUFFQSxJQUFBLEdBQU8sUUFBUSxDQUFDLFdBQVQsQ0FBQSxDQUZQLENBQUE7QUFBQSxNQUlBLE9BQUEsR0FBYSxTQUFBLEtBQWEsUUFBaEIsR0FDUixDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBWCxDQUFrQixJQUFsQixDQUFBLEVBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBQSxDQURBLENBRFEsR0FJUixDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBWCxDQUFpQixJQUFqQixDQUFBLEVBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBQSxDQURBLENBUkYsQ0FBQTtBQVdBLE1BQUEsSUFBbUIsT0FBbkI7QUFBQSxRQUFBLE9BQU8sQ0FBQyxLQUFSLENBQUEsQ0FBQSxDQUFBO09BYkY7S0FBQTtXQWVBLE1BaEJNO0VBQUEsQ0F0RVIsQ0FBQTs7QUFBQSwrQkF5RkEsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLFlBQVAsRUFBcUIsU0FBckIsRUFBZ0MsTUFBaEMsR0FBQTtBQUNMLFFBQUEsOENBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFDRSxNQUFBLFVBQUEsR0FBZ0IsU0FBQSxLQUFhLFFBQWhCLEdBQThCLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBOUIsR0FBK0MsSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUE1RCxDQUFBO0FBRUEsTUFBQSxJQUFHLFVBQUEsSUFBYyxVQUFVLENBQUMsUUFBWCxLQUF1QixJQUFJLENBQUMsUUFBN0M7QUFHRSxRQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQWhCLENBQXlCLFlBQXpCLENBQXNDLENBQUMsUUFBdkMsQ0FBQSxDQUFYLENBQUE7QUFBQSxRQUNBLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBZixDQUFBLENBRFAsQ0FBQTtBQUVBLGFBQUEsK0NBQUE7NEJBQUE7QUFDRSxVQUFBLElBQUksQ0FBQyxXQUFMLENBQWlCLEVBQWpCLENBQUEsQ0FERjtBQUFBLFNBRkE7QUFBQSxRQUtBLFVBQVUsQ0FBQyxLQUFYLENBQUEsQ0FMQSxDQUFBO0FBQUEsUUFNQSxJQUFBLEdBQU8sVUFBVSxDQUFDLG1CQUFYLENBQStCLFlBQS9CLENBTlAsQ0FBQTtBQUFBLFFBT0EsTUFBQSxHQUFTLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixDQUF1QixJQUF2QixFQUFnQyxTQUFBLEtBQWEsUUFBaEIsR0FBOEIsS0FBOUIsR0FBeUMsV0FBdEUsQ0FQVCxDQUFBO0FBQUEsUUFRQSxNQUFRLENBQUcsU0FBQSxLQUFhLFFBQWhCLEdBQThCLGFBQTlCLEdBQWlELGNBQWpELENBQVIsQ0FBMEUsSUFBMUUsQ0FSQSxDQUFBO0FBQUEsUUFZQSxNQUFNLENBQUMsSUFBUCxDQUFBLENBWkEsQ0FBQTtBQUFBLFFBYUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxVQUFiLEVBQXlCLFlBQXpCLENBYkEsQ0FBQTtBQUFBLFFBY0EsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQWRBLENBQUE7QUFBQSxRQWdCQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQVgsQ0FBQSxDQWhCQSxDQUFBO0FBQUEsUUFpQkEsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQWpCQSxDQUhGO09BSEY7S0FBQTtXQXlCQSxNQTFCSztFQUFBLENBekZQLENBQUE7O0FBQUEsK0JBc0hBLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLE1BQXJCLEVBQTZCLEtBQTdCLEVBQW9DLE1BQXBDLEdBQUE7QUFDTCxRQUFBLGlDQUFBO0FBQUEsSUFBQSxJQUFHLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQUFIO0FBQ0UsTUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFkLENBQUEsQ0FBUCxDQUFBO0FBQUEsTUFHQSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxhQUFQLENBQXFCLEdBQXJCLENBQXlCLENBQUMsU0FIMUMsQ0FBQTtBQUFBLE1BSUEsWUFBQSxHQUFlLEtBQUssQ0FBQyxhQUFOLENBQW9CLEdBQXBCLENBQXdCLENBQUMsU0FKeEMsQ0FBQTtBQUFBLE1BT0EsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFYLENBQWUsWUFBZixFQUE2QixhQUE3QixDQVBBLENBQUE7QUFBQSxNQVFBLElBQUksQ0FBQyxHQUFMLENBQVMsWUFBVCxFQUF1QixZQUF2QixDQVJBLENBQUE7QUFBQSxNQVdBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBWCxDQUFpQixJQUFqQixDQVhBLENBQUE7QUFBQSxNQVlBLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBVyxDQUFDLEtBQVosQ0FBQSxDQVpBLENBREY7S0FBQTtXQWVBLE1BaEJLO0VBQUEsQ0F0SFAsQ0FBQTs7QUFBQSwrQkF5SUEsZ0JBQUEsR0FBa0IsU0FBQyxJQUFELEVBQU8sWUFBUCxFQUFxQixTQUFyQixHQUFBO0FBQ2hCLFFBQUEsT0FBQTtBQUFBLElBQUEsT0FBQSxHQUFVLElBQUksQ0FBQyxtQkFBTCxDQUF5QixZQUF6QixDQUFWLENBQUE7V0FDQSxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsSUFBaEIsRUFBc0IsT0FBdEIsRUFBK0IsU0FBL0IsRUFGZ0I7RUFBQSxDQXpJbEIsQ0FBQTs7QUFBQSwrQkE4SUEsT0FBQSxHQUFTLFNBQUMsSUFBRCxFQUFPLFFBQVAsRUFBaUIsTUFBakIsR0FBQTtXQUNQLE1BRE87RUFBQSxDQTlJVCxDQUFBOztBQUFBLCtCQWtKQSxpQkFBQSxHQUFtQixTQUFDLElBQUQsR0FBQTtXQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQWhCLEtBQTBCLENBQTFCLElBQStCLElBQUksQ0FBQyxVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBbkIsS0FBMkIsV0FEekM7RUFBQSxDQWxKbkIsQ0FBQTs7NEJBQUE7O0lBUkYsQ0FBQTs7OztBQ0FBLElBQUEsVUFBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxlQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLE1BQWhCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFEZixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLENBQUMsU0FBRixDQUFBLENBSGhCLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxXQUFELEdBQWUsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUpmLENBRFc7RUFBQSxDQUFiOztBQUFBLGtCQVFBLFFBQUEsR0FBVSxTQUFDLFdBQUQsRUFBYyxZQUFkLEdBQUE7QUFDUixJQUFBLElBQUcsWUFBQSxLQUFnQixJQUFDLENBQUEsWUFBcEI7QUFDRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQixZQURoQixDQURGO0tBQUE7QUFJQSxJQUFBLElBQUcsV0FBQSxLQUFlLElBQUMsQ0FBQSxXQUFuQjtBQUNFLE1BQUEsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0FBQSxDQUFBO0FBQ0EsTUFBQSxJQUFHLFdBQUg7QUFDRSxRQUFBLElBQUMsQ0FBQSxXQUFELEdBQWUsV0FBZixDQUFBO2VBQ0EsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLElBQUMsQ0FBQSxXQUFwQixFQUZGO09BRkY7S0FMUTtFQUFBLENBUlYsQ0FBQTs7QUFBQSxrQkFxQkEsZUFBQSxHQUFpQixTQUFDLFlBQUQsRUFBZSxXQUFmLEdBQUE7QUFDZixJQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsS0FBaUIsWUFBcEI7QUFDRSxNQUFBLGdCQUFBLGNBQWdCLEdBQUcsQ0FBQyxlQUFKLENBQW9CLFlBQXBCLEVBQWhCLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLFdBQVYsRUFBdUIsWUFBdkIsRUFGRjtLQURlO0VBQUEsQ0FyQmpCLENBQUE7O0FBQUEsa0JBNEJBLGVBQUEsR0FBaUIsU0FBQyxZQUFELEdBQUE7QUFDZixJQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsS0FBaUIsWUFBcEI7YUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxXQUFYLEVBQXdCLE1BQXhCLEVBREY7S0FEZTtFQUFBLENBNUJqQixDQUFBOztBQUFBLGtCQWtDQSxjQUFBLEdBQWdCLFNBQUMsV0FBRCxHQUFBO0FBQ2QsSUFBQSxJQUFHLElBQUMsQ0FBQSxXQUFELEtBQWdCLFdBQW5CO2FBQ0UsSUFBQyxDQUFBLFFBQUQsQ0FBVSxXQUFWLEVBQXVCLE1BQXZCLEVBREY7S0FEYztFQUFBLENBbENoQixDQUFBOztBQUFBLGtCQXVDQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBQXFCLE1BQXJCLEVBREk7RUFBQSxDQXZDTixDQUFBOztBQUFBLGtCQStDQSxhQUFBLEdBQWUsU0FBQSxHQUFBO0FBQ2IsSUFBQSxJQUFHLElBQUMsQ0FBQSxZQUFKO2FBQ0UsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsT0FEbEI7S0FEYTtFQUFBLENBL0NmLENBQUE7O0FBQUEsa0JBcURBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtBQUNoQixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLFdBQUo7QUFDRSxNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsV0FBWixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLE1BRGYsQ0FBQTthQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixRQUFsQixFQUhGO0tBRGdCO0VBQUEsQ0FyRGxCLENBQUE7O2VBQUE7O0lBUEYsQ0FBQTs7OztBQ0FBLElBQUEsMENBQUE7O0FBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxPQUFSLENBQU4sQ0FBQTs7QUFBQSxXQUNBLEdBQWMsT0FBQSxDQUFRLDJDQUFSLENBRGQsQ0FBQTs7QUFBQSxNQUVBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRlQsQ0FBQTs7QUFBQSxHQUdBLEdBQU0sTUFBTSxDQUFDLEdBSGIsQ0FBQTs7QUFBQSxNQUtNLENBQUMsT0FBUCxHQUF1QjtBQUVyQixNQUFBLDhCQUFBOztBQUFBLEVBQUEsV0FBQSxHQUFjLENBQWQsQ0FBQTs7QUFBQSxFQUNBLGlCQUFBLEdBQW9CLENBRHBCLENBQUE7O0FBR2EsRUFBQSxxQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLFdBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxvQkFBQSxjQUFjLG1CQUFBLFdBQzdCLENBQUE7QUFBQSxJQUFBLElBQThCLFdBQTlCO0FBQUEsTUFBQSxJQUFDLENBQUEsS0FBRCxHQUFTLFdBQVcsQ0FBQyxLQUFyQixDQUFBO0tBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixFQUR6QixDQURXO0VBQUEsQ0FIYjs7QUFBQSx3QkFTQSxLQUFBLEdBQU8sU0FBQyxhQUFELEdBQUE7QUFDTCxJQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBWCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQXpCLENBQUEsQ0FEQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLGtCQUFOLENBQUEsQ0FGQSxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFvQixDQUFDLEdBQXJCLENBQXlCO0FBQUEsTUFBQSxnQkFBQSxFQUFrQixNQUFsQjtLQUF6QixDQUxoQixDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLENBQWlCLGNBQWpCLENBTmhCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxXQUFELEdBQWUsQ0FBQSxDQUFHLGNBQUEsR0FBckIsR0FBRyxDQUFDLFVBQWlCLEdBQStCLElBQWxDLENBVGYsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUNKLENBQUMsTUFESCxDQUNVLElBQUMsQ0FBQSxXQURYLENBRUUsQ0FBQyxNQUZILENBRVUsSUFBQyxDQUFBLFlBRlgsQ0FHRSxDQUFDLEdBSEgsQ0FHTyxRQUhQLEVBR2lCLFNBSGpCLENBWEEsQ0FBQTtBQWlCQSxJQUFBLElBQWdDLGtCQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxPQUFwQixDQUFBLENBQUE7S0FqQkE7V0FvQkEsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBckJLO0VBQUEsQ0FUUCxDQUFBOztBQUFBLHdCQW1DQSxJQUFBLEdBQU0sU0FBQyxhQUFELEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sRUFBQSxHQUFYLGFBQWEsQ0FBQyxLQUFILEdBQXlCLElBQS9CO0FBQUEsTUFDQSxHQUFBLEVBQUssRUFBQSxHQUFWLGFBQWEsQ0FBQyxLQUFKLEdBQXlCLElBRDlCO0tBREYsQ0FBQSxDQUFBO1dBSUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsY0FBRCxDQUFnQixhQUFoQixFQUxOO0VBQUEsQ0FuQ04sQ0FBQTs7QUFBQSx3QkE0Q0EsY0FBQSxHQUFnQixTQUFDLGFBQUQsR0FBQTtBQUNkLFFBQUEsaUNBQUE7QUFBQSxJQUFBLE9BQTBCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixDQUExQixFQUFFLHFCQUFBLGFBQUYsRUFBaUIsWUFBQSxJQUFqQixDQUFBO0FBQ0EsSUFBQSxJQUF3QixZQUF4QjtBQUFBLGFBQU8sTUFBUCxDQUFBO0tBREE7QUFJQSxJQUFBLElBQWtCLElBQUEsS0FBUSxJQUFDLENBQUEsV0FBWSxDQUFBLENBQUEsQ0FBdkM7QUFBQSxhQUFPLElBQUMsQ0FBQSxNQUFSLENBQUE7S0FKQTtBQUFBLElBTUEsTUFBQSxHQUFTO0FBQUEsTUFBRSxJQUFBLEVBQU0sYUFBYSxDQUFDLEtBQXRCO0FBQUEsTUFBNkIsR0FBQSxFQUFLLGFBQWEsQ0FBQyxLQUFoRDtLQU5ULENBQUE7QUFPQSxJQUFBLElBQXlDLFlBQXpDO0FBQUEsTUFBQSxNQUFBLEdBQVMsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLENBQVQsQ0FBQTtLQVBBO0FBQUEsSUFRQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBUkEsQ0FBQTtBQVVBLElBQUEsSUFBRyxnQkFBQSxpREFBNkIsQ0FBRSxlQUFwQixLQUE2QixJQUFDLENBQUEsWUFBNUM7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsQ0FEQSxDQUFBO0FBVUEsYUFBTyxNQUFQLENBWEY7S0FBQSxNQUFBO0FBYUUsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBLENBREEsQ0FBQTtBQUdBLE1BQUEsSUFBTyxjQUFQO0FBQ0UsUUFBQSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBdUIsR0FBRyxDQUFDLE1BQTNCLENBQUEsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUhGO09BSEE7QUFRQSxhQUFPLE1BQVAsQ0FyQkY7S0FYYztFQUFBLENBNUNoQixDQUFBOztBQUFBLHdCQStFQSxnQkFBQSxHQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixZQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEsV0FDTyxTQURQO0FBRUksUUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixNQUFqQixDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsd0JBQUQsQ0FBQSxFQUhKO0FBQUEsV0FJTyxXQUpQO0FBS0ksUUFBQSxJQUFDLENBQUEsZ0NBQUQsQ0FBa0MsTUFBTSxDQUFDLElBQXpDLENBQUEsQ0FBQTtlQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFBLENBQUUsTUFBTSxDQUFDLElBQVQsQ0FBbkIsRUFOSjtBQUFBLFdBT08sTUFQUDtBQVFJLFFBQUEsSUFBQyxDQUFBLGdDQUFELENBQWtDLE1BQU0sQ0FBQyxJQUF6QyxDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxJQUFULENBQW5CLEVBVEo7QUFBQSxLQURnQjtFQUFBLENBL0VsQixDQUFBOztBQUFBLHdCQTRGQSxlQUFBLEdBQWlCLFNBQUMsTUFBRCxHQUFBO0FBQ2YsUUFBQSxZQUFBO0FBQUEsSUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLFFBQXRCO0FBQ0UsTUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFuQixDQUFBLENBQVQsQ0FBQTtBQUVBLE1BQUEsSUFBRyxjQUFIO0FBQ0UsUUFBQSxJQUFHLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLElBQUMsQ0FBQSxZQUFwQjtBQUNFLFVBQUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsT0FBbEIsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxlQUFELENBQWlCLE1BQWpCLENBQVAsQ0FGRjtTQUFBO2VBSUEsSUFBQyxDQUFBLHlCQUFELENBQTJCLE1BQTNCLEVBQW1DLE1BQU0sQ0FBQyxXQUExQyxFQUxGO09BQUEsTUFBQTtlQU9FLElBQUMsQ0FBQSxnQ0FBRCxDQUFrQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxVQUE5RCxFQVBGO09BSEY7S0FBQSxNQUFBO0FBWUUsTUFBQSxJQUFBLEdBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFuQixDQUFBLENBQVAsQ0FBQTtBQUNBLE1BQUEsSUFBRyxZQUFIO0FBQ0UsUUFBQSxJQUFHLElBQUksQ0FBQyxLQUFMLEtBQWMsSUFBQyxDQUFBLFlBQWxCO0FBQ0UsVUFBQSxNQUFNLENBQUMsUUFBUCxHQUFrQixRQUFsQixDQUFBO0FBQ0EsaUJBQU8sSUFBQyxDQUFBLGVBQUQsQ0FBaUIsTUFBakIsQ0FBUCxDQUZGO1NBQUE7ZUFJQSxJQUFDLENBQUEseUJBQUQsQ0FBMkIsTUFBTSxDQUFDLFdBQWxDLEVBQStDLElBQS9DLEVBTEY7T0FBQSxNQUFBO2VBT0UsSUFBQyxDQUFBLDBCQUFELENBQTRCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLFVBQXhELEVBUEY7T0FiRjtLQURlO0VBQUEsQ0E1RmpCLENBQUE7O0FBQUEsd0JBb0hBLHlCQUFBLEdBQTJCLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUN6QixRQUFBLG1CQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sR0FBRyxDQUFDLDZCQUFKLENBQWtDLEtBQUssQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUE5QyxDQUFQLENBQUE7QUFBQSxJQUNBLElBQUEsR0FBTyxHQUFHLENBQUMsNkJBQUosQ0FBa0MsS0FBSyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQTlDLENBRFAsQ0FBQTtBQUFBLElBR0EsT0FBQSxHQUFhLElBQUksQ0FBQyxHQUFMLEdBQVcsSUFBSSxDQUFDLE1BQW5CLEdBQ1IsQ0FBQyxJQUFJLENBQUMsR0FBTCxHQUFXLElBQUksQ0FBQyxNQUFqQixDQUFBLEdBQTJCLENBRG5CLEdBR1IsQ0FORixDQUFBO1dBUUEsSUFBQyxDQUFBLFVBQUQsQ0FDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLElBQUksQ0FBQyxJQUFYO0FBQUEsTUFDQSxHQUFBLEVBQUssSUFBSSxDQUFDLE1BQUwsR0FBYyxPQURuQjtBQUFBLE1BRUEsS0FBQSxFQUFPLElBQUksQ0FBQyxLQUZaO0tBREYsRUFUeUI7RUFBQSxDQXBIM0IsQ0FBQTs7QUFBQSx3QkFtSUEsZ0NBQUEsR0FBa0MsU0FBQyxJQUFELEdBQUE7QUFDaEMsUUFBQSxHQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsVUFBaEIsRUFBNEIsS0FBNUIsQ0FGQSxDQUFBO0FBQUEsSUFHQSxHQUFBLEdBQU0sR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQWxDLENBSE4sQ0FBQTtXQUlBLElBQUMsQ0FBQSxVQUFELENBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxHQUFHLENBQUMsSUFBVjtBQUFBLE1BQ0EsR0FBQSxFQUFLLEdBQUcsQ0FBQyxHQUFKLEdBQVUsaUJBRGY7QUFBQSxNQUVBLEtBQUEsRUFBTyxHQUFHLENBQUMsS0FGWDtLQURGLEVBTGdDO0VBQUEsQ0FuSWxDLENBQUE7O0FBQUEsd0JBOElBLDBCQUFBLEdBQTRCLFNBQUMsSUFBRCxHQUFBO0FBQzFCLFFBQUEsR0FBQTtBQUFBLElBQUEsSUFBYyxZQUFkO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBSSxDQUFDLFNBQWhCLEVBQTJCLFFBQTNCLENBRkEsQ0FBQTtBQUFBLElBR0EsR0FBQSxHQUFNLEdBQUcsQ0FBQyw2QkFBSixDQUFrQyxJQUFsQyxDQUhOLENBQUE7V0FJQSxJQUFDLENBQUEsVUFBRCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sR0FBRyxDQUFDLElBQVY7QUFBQSxNQUNBLEdBQUEsRUFBSyxHQUFHLENBQUMsTUFBSixHQUFhLGlCQURsQjtBQUFBLE1BRUEsS0FBQSxFQUFPLEdBQUcsQ0FBQyxLQUZYO0tBREYsRUFMMEI7RUFBQSxDQTlJNUIsQ0FBQTs7QUFBQSx3QkF5SkEsVUFBQSxHQUFZLFNBQUMsSUFBRCxHQUFBO0FBQ1YsUUFBQSx1QkFBQTtBQUFBLElBRGEsWUFBQSxNQUFNLFdBQUEsS0FBSyxhQUFBLEtBQ3hCLENBQUE7QUFBQSxJQUFBLElBQUcsc0JBQUg7QUFFRSxNQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQTdCLENBQVIsQ0FBQTtBQUFBLE1BQ0EsR0FBQSxJQUFPLEtBQUssQ0FBQyxTQUFOLENBQUEsQ0FEUCxDQUFBO0FBQUEsTUFFQSxJQUFBLElBQVEsS0FBSyxDQUFDLFVBQU4sQ0FBQSxDQUZSLENBQUE7QUFBQSxNQUtBLElBQUEsSUFBUSxJQUFDLENBQUEsU0FBUyxDQUFDLElBTG5CLENBQUE7QUFBQSxNQU1BLEdBQUEsSUFBTyxJQUFDLENBQUEsU0FBUyxDQUFDLEdBTmxCLENBQUE7QUFBQSxNQWNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQjtBQUFBLFFBQUEsUUFBQSxFQUFVLE9BQVY7T0FBakIsQ0FkQSxDQUZGO0tBQUEsTUFBQTtBQW9CRSxNQUFBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQjtBQUFBLFFBQUEsUUFBQSxFQUFVLFVBQVY7T0FBakIsQ0FBQSxDQXBCRjtLQUFBO1dBc0JBLElBQUMsQ0FBQSxXQUNELENBQUMsR0FERCxDQUVFO0FBQUEsTUFBQSxJQUFBLEVBQU8sRUFBQSxHQUFaLElBQVksR0FBVSxJQUFqQjtBQUFBLE1BQ0EsR0FBQSxFQUFPLEVBQUEsR0FBWixHQUFZLEdBQVMsSUFEaEI7QUFBQSxNQUVBLEtBQUEsRUFBTyxFQUFBLEdBQVosS0FBWSxHQUFXLElBRmxCO0tBRkYsQ0FLQSxDQUFDLElBTEQsQ0FBQSxFQXZCVTtFQUFBLENBekpaLENBQUE7O0FBQUEsd0JBd0xBLFNBQUEsR0FBVyxTQUFDLElBQUQsRUFBTyxRQUFQLEdBQUE7QUFDVCxRQUFBLEtBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxDQUFjLFdBQUEsSUFBZSxjQUE3QixDQUFBO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQURSLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxhQUFELEdBQWlCLEtBRmpCLENBQUE7QUFJQSxJQUFBLElBQUcsUUFBQSxLQUFZLEtBQWY7YUFDRSxLQUFLLENBQUMsR0FBTixDQUFVO0FBQUEsUUFBQSxTQUFBLEVBQVksZUFBQSxHQUEzQixXQUEyQixHQUE2QixLQUF6QztPQUFWLEVBREY7S0FBQSxNQUFBO2FBR0UsS0FBSyxDQUFDLEdBQU4sQ0FBVTtBQUFBLFFBQUEsU0FBQSxFQUFZLGdCQUFBLEdBQTNCLFdBQTJCLEdBQThCLEtBQTFDO09BQVYsRUFIRjtLQUxTO0VBQUEsQ0F4TFgsQ0FBQTs7QUFBQSx3QkFtTUEsYUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsSUFBQSxJQUFHLDBCQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUI7QUFBQSxRQUFBLFNBQUEsRUFBVyxFQUFYO09BQW5CLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE9BRm5CO0tBRGE7RUFBQSxDQW5NZixDQUFBOztBQUFBLHdCQXlNQSxpQkFBQSxHQUFtQixTQUFDLFVBQUQsR0FBQTtBQUNqQixRQUFBLGFBQUE7QUFBQSxJQUFBLElBQUcsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixJQUFDLENBQUEscUJBQXNCLENBQUEsQ0FBQSxDQUEzQzs7YUFDd0IsQ0FBQyxZQUFhLEdBQUcsQ0FBQztPQUF4QztBQUFBLE1BQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCLFVBRHpCLENBQUE7MEZBRXNCLENBQUMsU0FBVSxHQUFHLENBQUMsNkJBSHZDO0tBRGlCO0VBQUEsQ0F6TW5CLENBQUE7O0FBQUEsd0JBZ05BLHdCQUFBLEdBQTBCLFNBQUEsR0FBQTtBQUN4QixRQUFBLEtBQUE7O1dBQXNCLENBQUMsWUFBYSxHQUFHLENBQUM7S0FBeEM7V0FDQSxJQUFDLENBQUEscUJBQUQsR0FBeUIsR0FGRDtFQUFBLENBaE4xQixDQUFBOztBQUFBLHdCQXVOQSxrQkFBQSxHQUFvQixTQUFDLGFBQUQsR0FBQTtBQUNsQixRQUFBLElBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxNQUFQLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ3ZCLFlBQUEsc0JBQUE7QUFBQSxRQUFFLHdCQUFBLE9BQUYsRUFBVyx3QkFBQSxPQUFYLENBQUE7QUFBQSxRQUNBLElBQUEsR0FBTyxLQUFDLENBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZixDQUFnQyxPQUFoQyxFQUF5QyxPQUF6QyxDQURQLENBQUE7QUFFQSxRQUFBLG9CQUFHLElBQUksQ0FBRSxrQkFBTixLQUFrQixRQUFyQjtpQkFDRSxPQUEwQixLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsRUFBd0IsYUFBeEIsQ0FBMUIsRUFBRSxxQkFBQSxhQUFGLEVBQWlCLFlBQUEsSUFBakIsRUFBQSxLQURGO1NBQUEsTUFBQTtpQkFHRSxLQUFDLENBQUEsU0FBRCxHQUFhLE9BSGY7U0FIdUI7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixDQURBLENBQUE7V0FTQTtBQUFBLE1BQUUsZUFBQSxhQUFGO0FBQUEsTUFBaUIsTUFBQSxJQUFqQjtNQVZrQjtFQUFBLENBdk5wQixDQUFBOztBQUFBLHdCQW9PQSxnQkFBQSxHQUFrQixTQUFDLFVBQUQsRUFBYSxhQUFiLEdBQUE7QUFDaEIsUUFBQSwwQkFBQTtBQUFBLElBQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxHQUFBLEdBQU0sVUFBVSxDQUFDLHFCQUFYLENBQUEsQ0FBbkIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxNQUFYLEdBQW9CLFVBQVUsQ0FBQyxhQUQvQixDQUFBO0FBQUEsSUFFQSxRQUFBLEdBQVcsVUFBVSxDQUFDLGVBRnRCLENBQUE7QUFBQSxJQUdBLEtBQUEsR0FBUSxDQUFBLENBQUUsUUFBUSxDQUFDLElBQVgsQ0FIUixDQUFBO0FBQUEsSUFLQSxhQUFhLENBQUMsT0FBZCxJQUF5QixHQUFHLENBQUMsSUFMN0IsQ0FBQTtBQUFBLElBTUEsYUFBYSxDQUFDLE9BQWQsSUFBeUIsR0FBRyxDQUFDLEdBTjdCLENBQUE7QUFBQSxJQU9BLGFBQWEsQ0FBQyxLQUFkLEdBQXNCLGFBQWEsQ0FBQyxPQUFkLEdBQXdCLEtBQUssQ0FBQyxVQUFOLENBQUEsQ0FQOUMsQ0FBQTtBQUFBLElBUUEsYUFBYSxDQUFDLEtBQWQsR0FBc0IsYUFBYSxDQUFDLE9BQWQsR0FBd0IsS0FBSyxDQUFDLFNBQU4sQ0FBQSxDQVI5QyxDQUFBO0FBQUEsSUFTQSxJQUFBLEdBQU8sUUFBUSxDQUFDLGdCQUFULENBQTBCLGFBQWEsQ0FBQyxPQUF4QyxFQUFpRCxhQUFhLENBQUMsT0FBL0QsQ0FUUCxDQUFBO1dBV0E7QUFBQSxNQUFFLGVBQUEsYUFBRjtBQUFBLE1BQWlCLE1BQUEsSUFBakI7TUFaZ0I7RUFBQSxDQXBPbEIsQ0FBQTs7QUFBQSx3QkFxUEEsdUJBQUEsR0FBeUIsU0FBQyxRQUFELEdBQUE7QUFJdkIsSUFBQSxJQUFHLFdBQUEsQ0FBWSxtQkFBWixDQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsWUFBWSxDQUFDLEdBQWQsQ0FBa0I7QUFBQSxRQUFBLGdCQUFBLEVBQWtCLE1BQWxCO09BQWxCLENBQUEsQ0FBQTtBQUFBLE1BQ0EsUUFBQSxDQUFBLENBREEsQ0FBQTthQUVBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUFrQjtBQUFBLFFBQUEsZ0JBQUEsRUFBa0IsTUFBbEI7T0FBbEIsRUFIRjtLQUFBLE1BQUE7QUFLRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFBLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQUEsQ0FEQSxDQUFBO0FBQUEsTUFFQSxRQUFBLENBQUEsQ0FGQSxDQUFBO0FBQUEsTUFHQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQSxDQUhBLENBQUE7YUFJQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQSxFQVRGO0tBSnVCO0VBQUEsQ0FyUHpCLENBQUE7O0FBQUEsd0JBc1FBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixJQUFBLElBQUcsbUJBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLE1BQWYsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUF4QixDQUE2QixJQUFDLENBQUEsWUFBOUIsRUFGRjtLQUFBLE1BQUE7QUFBQTtLQURJO0VBQUEsQ0F0UU4sQ0FBQTs7QUFBQSx3QkErUUEsWUFBQSxHQUFjLFNBQUMsTUFBRCxHQUFBO0FBQ1osUUFBQSxzQ0FBQTtBQUFBLFlBQU8sTUFBTSxDQUFDLE1BQWQ7QUFBQSxXQUNPLFNBRFA7QUFFSSxRQUFBLFdBQUEsR0FBYyxNQUFNLENBQUMsV0FBckIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxNQUFNLENBQUMsUUFBUCxLQUFtQixRQUF0QjtpQkFDRSxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQWxCLENBQXlCLElBQUMsQ0FBQSxZQUExQixFQURGO1NBQUEsTUFBQTtpQkFHRSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQWxCLENBQXdCLElBQUMsQ0FBQSxZQUF6QixFQUhGO1NBSEo7QUFDTztBQURQLFdBT08sV0FQUDtBQVFJLFFBQUEsWUFBQSxHQUFlLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBbEMsQ0FBQTtlQUNBLFlBQVksQ0FBQyxNQUFiLENBQW9CLE1BQU0sQ0FBQyxhQUEzQixFQUEwQyxJQUFDLENBQUEsWUFBM0MsRUFUSjtBQUFBLFdBVU8sTUFWUDtBQVdJLFFBQUEsV0FBQSxHQUFjLE1BQU0sQ0FBQyxXQUFyQixDQUFBO2VBQ0EsV0FBVyxDQUFDLE9BQVosQ0FBb0IsSUFBQyxDQUFBLFlBQXJCLEVBWko7QUFBQSxLQURZO0VBQUEsQ0EvUWQsQ0FBQTs7QUFBQSx3QkFrU0EsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLElBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUdFLE1BQUEsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBLENBREEsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBWixDQUFnQixRQUFoQixFQUEwQixFQUExQixDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBekIsQ0FBQSxDQUhBLENBQUE7QUFJQSxNQUFBLElBQW1DLGtCQUFuQztBQUFBLFFBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQW1CLEdBQUcsQ0FBQyxPQUF2QixDQUFBLENBQUE7T0FKQTtBQUFBLE1BS0EsR0FBRyxDQUFDLHNCQUFKLENBQUEsQ0FMQSxDQUFBO0FBQUEsTUFRQSxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWQsQ0FBQSxDQVJBLENBQUE7YUFTQSxJQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsQ0FBQSxFQVpGO0tBREs7RUFBQSxDQWxTUCxDQUFBOztBQUFBLHdCQWtUQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7QUFDakIsUUFBQSw0Q0FBQTtBQUFBLElBQUEsb0JBQUEsR0FBdUIsQ0FBdkIsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFjLGVBQUEsR0FDakIsR0FBRyxDQUFDLGtCQURhLEdBQ29CLHVCQURwQixHQUVqQixHQUFHLENBQUMseUJBRmEsR0FFd0IsV0FGeEIsR0FFakIsb0JBRmlCLEdBR0Ysc0NBSlosQ0FBQTtXQVVBLFlBQUEsR0FBZSxDQUFBLENBQUUsUUFBRixDQUNiLENBQUMsR0FEWSxDQUNSO0FBQUEsTUFBQSxRQUFBLEVBQVUsVUFBVjtLQURRLEVBWEU7RUFBQSxDQWxUbkIsQ0FBQTs7cUJBQUE7O0lBUEYsQ0FBQTs7Ozs7O0FDT0EsSUFBQSxhQUFBOztBQUFBLE9BQU8sQ0FBQyxTQUFSLEdBQTBCOzZCQUV4Qjs7QUFBQSwwQkFBQSxlQUFBLEdBQWlCLFNBQUMsV0FBRCxHQUFBO1dBR2YsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLEVBSGU7RUFBQSxDQUFqQixDQUFBOzt1QkFBQTs7SUFGRixDQUFBOztBQUFBLE9BU08sQ0FBQyxhQUFSLEdBQXdCLGFBVHhCLENBQUE7Ozs7QUNQQSxJQUFBLGtCQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBSWxCO0FBQUEsSUFBQSxRQUFBLEVBQVUsU0FBQyxTQUFELEVBQVksUUFBWixHQUFBO0FBQ1IsVUFBQSxnQkFBQTtBQUFBLE1BQUEsZ0JBQUEsR0FBbUIsU0FBQSxHQUFBO0FBQ2pCLFlBQUEsSUFBQTtBQUFBLFFBRGtCLDhEQUNsQixDQUFBO0FBQUEsUUFBQSxTQUFTLENBQUMsTUFBVixDQUFpQixnQkFBakIsQ0FBQSxDQUFBO2VBQ0EsUUFBUSxDQUFDLEtBQVQsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBRmlCO01BQUEsQ0FBbkIsQ0FBQTtBQUFBLE1BSUEsU0FBUyxDQUFDLEdBQVYsQ0FBYyxnQkFBZCxDQUpBLENBQUE7YUFLQSxpQkFOUTtJQUFBLENBQVY7SUFKa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FFbEI7QUFBQSxJQUFBLGlCQUFBLEVBQW1CLFNBQUEsR0FBQTtBQUNqQixVQUFBLE9BQUE7QUFBQSxNQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixHQUF2QixDQUFWLENBQUE7QUFBQSxNQUNBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZCxHQUF3QixxQkFEeEIsQ0FBQTtBQUVBLGFBQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFkLEtBQStCLE1BQXRDLENBSGlCO0lBQUEsQ0FBbkI7SUFGa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7O0FDQUEsSUFBQSxzQkFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLG1CQUFSLENBQVYsQ0FBQTs7QUFBQSxhQUVBLEdBQWdCLEVBRmhCLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixNQUFBLE1BQUE7QUFBQSxFQUFBLElBQUcsQ0FBQyxNQUFBLEdBQVMsYUFBYyxDQUFBLElBQUEsQ0FBeEIsQ0FBQSxLQUFrQyxNQUFyQztXQUNFLGFBQWMsQ0FBQSxJQUFBLENBQWQsR0FBc0IsT0FBQSxDQUFRLE9BQVEsQ0FBQSxJQUFBLENBQVIsQ0FBQSxDQUFSLEVBRHhCO0dBQUEsTUFBQTtXQUdFLE9BSEY7R0FEZTtBQUFBLENBSmpCLENBQUE7Ozs7QUNBQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtBQUVsQixNQUFBLGlCQUFBO0FBQUEsRUFBQSxTQUFBLEdBQVksTUFBQSxHQUFTLE1BQXJCLENBQUE7U0FRQTtBQUFBLElBQUEsSUFBQSxFQUFNLFNBQUMsSUFBRCxHQUFBO0FBR0osVUFBQSxNQUFBOztRQUhLLE9BQU87T0FHWjtBQUFBLE1BQUEsTUFBQSxHQUFTLElBQUksQ0FBQyxHQUFMLENBQUEsQ0FBVSxDQUFDLFFBQVgsQ0FBb0IsRUFBcEIsQ0FBVCxDQUFBO0FBR0EsTUFBQSxJQUFHLE1BQUEsS0FBVSxNQUFiO0FBQ0UsUUFBQSxTQUFBLElBQWEsQ0FBYixDQURGO09BQUEsTUFBQTtBQUdFLFFBQUEsU0FBQSxHQUFZLENBQVosQ0FBQTtBQUFBLFFBQ0EsTUFBQSxHQUFTLE1BRFQsQ0FIRjtPQUhBO2FBU0EsRUFBQSxHQUFILElBQUcsR0FBVSxHQUFWLEdBQUgsTUFBRyxHQUFILFVBWk87SUFBQSxDQUFOO0lBVmtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FBakIsQ0FBQTs7OztBQ0FBLElBQUEsV0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BU00sQ0FBQyxPQUFQLEdBQWlCLE1BQUEsR0FBUyxTQUFDLFNBQUQsRUFBWSxPQUFaLEdBQUE7QUFDeEIsRUFBQSxJQUFBLENBQUEsU0FBQTtXQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsT0FBVixFQUFBO0dBRHdCO0FBQUEsQ0FUMUIsQ0FBQTs7OztBQ0tBLElBQUEsR0FBQTtFQUFBOztpU0FBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixHQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ3JCLE1BQUEsSUFBQTtBQUFBLEVBRHNCLDhEQUN0QixDQUFBO0FBQUEsRUFBQSxJQUFHLHNCQUFIO0FBQ0UsSUFBQSxJQUFHLElBQUksQ0FBQyxNQUFMLElBQWdCLElBQUssQ0FBQSxJQUFJLENBQUMsTUFBTCxHQUFjLENBQWQsQ0FBTCxLQUF5QixPQUE1QztBQUNFLE1BQUEsSUFBSSxDQUFDLEdBQUwsQ0FBQSxDQUFBLENBQUE7QUFDQSxNQUFBLElBQTBCLDRCQUExQjtBQUFBLFFBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFmLENBQUEsQ0FBQSxDQUFBO09BRkY7S0FBQTtBQUFBLElBSUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBbkIsQ0FBeUIsTUFBTSxDQUFDLE9BQWhDLEVBQXlDLElBQXpDLENBSkEsQ0FBQTtXQUtBLE9BTkY7R0FEcUI7QUFBQSxDQUF2QixDQUFBOztBQUFBLENBVUcsU0FBQSxHQUFBO0FBSUQsTUFBQSx1QkFBQTtBQUFBLEVBQU07QUFFSixzQ0FBQSxDQUFBOztBQUFhLElBQUEseUJBQUMsT0FBRCxHQUFBO0FBQ1gsTUFBQSxrREFBQSxTQUFBLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxPQURYLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixJQUZ0QixDQURXO0lBQUEsQ0FBYjs7MkJBQUE7O0tBRjRCLE1BQTlCLENBQUE7QUFBQSxFQVVBLE1BQUEsR0FBUyxTQUFDLE9BQUQsRUFBVSxLQUFWLEdBQUE7O01BQVUsUUFBUTtLQUN6QjtBQUFBLElBQUEsSUFBRyxvREFBSDtBQUNFLE1BQUEsUUFBUSxDQUFDLElBQVQsQ0FBa0IsSUFBQSxLQUFBLENBQU0sT0FBTixDQUFsQixFQUFrQyxTQUFBLEdBQUE7QUFDaEMsWUFBQSxJQUFBO0FBQUEsUUFBQSxJQUFHLENBQUMsS0FBQSxLQUFTLFVBQVQsSUFBdUIsS0FBQSxLQUFTLE9BQWpDLENBQUEsSUFBOEMsaUVBQWpEO2lCQUNFLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQXJCLENBQTBCLE1BQU0sQ0FBQyxPQUFqQyxFQUEwQyxPQUExQyxFQURGO1NBQUEsTUFBQTtpQkFHRSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQsRUFBb0IsT0FBcEIsRUFIRjtTQURnQztNQUFBLENBQWxDLENBQUEsQ0FERjtLQUFBLE1BQUE7QUFPRSxNQUFBLElBQUksS0FBQSxLQUFTLFVBQVQsSUFBdUIsS0FBQSxLQUFTLE9BQXBDO0FBQ0UsY0FBVSxJQUFBLGVBQUEsQ0FBZ0IsT0FBaEIsQ0FBVixDQURGO09BQUEsTUFBQTtBQUdFLFFBQUEsR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFULEVBQW9CLE9BQXBCLENBQUEsQ0FIRjtPQVBGO0tBQUE7V0FZQSxPQWJPO0VBQUEsQ0FWVCxDQUFBO0FBQUEsRUEwQkEsR0FBRyxDQUFDLEtBQUosR0FBWSxTQUFDLE9BQUQsR0FBQTtBQUNWLElBQUEsSUFBQSxDQUFBLEdBQW1DLENBQUMsYUFBcEM7YUFBQSxNQUFBLENBQU8sT0FBUCxFQUFnQixPQUFoQixFQUFBO0tBRFU7RUFBQSxDQTFCWixDQUFBO0FBQUEsRUE4QkEsR0FBRyxDQUFDLElBQUosR0FBVyxTQUFDLE9BQUQsR0FBQTtBQUNULElBQUEsSUFBQSxDQUFBLEdBQXFDLENBQUMsZ0JBQXRDO2FBQUEsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsU0FBaEIsRUFBQTtLQURTO0VBQUEsQ0E5QlgsQ0FBQTtTQW1DQSxHQUFHLENBQUMsS0FBSixHQUFZLFNBQUMsT0FBRCxHQUFBO1dBQ1YsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsT0FBaEIsRUFEVTtFQUFBLEVBdkNYO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FWQSxDQUFBOzs7O0FDTEEsSUFBQSxpQkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQTJCTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLG1CQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBVCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLEtBRFgsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUZaLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxTQUFELEdBQWEsRUFIYixDQURXO0VBQUEsQ0FBYjs7QUFBQSxzQkFPQSxXQUFBLEdBQWEsU0FBQyxRQUFELEdBQUE7QUFDWCxJQUFBLElBQUcsSUFBQyxDQUFBLFFBQUo7YUFDRSxRQUFBLENBQUEsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsUUFBaEIsRUFIRjtLQURXO0VBQUEsQ0FQYixDQUFBOztBQUFBLHNCQWNBLE9BQUEsR0FBUyxTQUFBLEdBQUE7V0FDUCxJQUFDLENBQUEsU0FETTtFQUFBLENBZFQsQ0FBQTs7QUFBQSxzQkFrQkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLElBQUEsTUFBQSxDQUFPLENBQUEsSUFBSyxDQUFBLE9BQVosRUFDRSx5Q0FERixDQUFBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFGWCxDQUFBO1dBR0EsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUpLO0VBQUEsQ0FsQlAsQ0FBQTs7QUFBQSxzQkF5QkEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNULElBQUEsTUFBQSxDQUFPLENBQUEsSUFBSyxDQUFBLFFBQVosRUFDRSxvREFERixDQUFBLENBQUE7V0FFQSxJQUFDLENBQUEsS0FBRCxJQUFVLEVBSEQ7RUFBQSxDQXpCWCxDQUFBOztBQUFBLHNCQStCQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsSUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFoQixFQUNFLHdEQURGLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLEtBQUQsSUFBVSxDQUZWLENBQUE7V0FHQSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBSlM7RUFBQSxDQS9CWCxDQUFBOztBQUFBLHNCQXNDQSxJQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ0osSUFBQSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsQ0FBQTtXQUNBLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFBLEdBQUE7ZUFBRyxLQUFDLENBQUEsU0FBRCxDQUFBLEVBQUg7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxFQUZJO0VBQUEsQ0F0Q04sQ0FBQTs7QUFBQSxzQkE0Q0EsV0FBQSxHQUFhLFNBQUEsR0FBQTtBQUNYLFFBQUEsa0NBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLEtBQUQsS0FBVSxDQUFWLElBQWUsSUFBQyxDQUFBLE9BQUQsS0FBWSxJQUE5QjtBQUNFLE1BQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFaLENBQUE7QUFDQTtBQUFBO1dBQUEsMkNBQUE7NEJBQUE7QUFBQSxzQkFBQSxRQUFBLENBQUEsRUFBQSxDQUFBO0FBQUE7c0JBRkY7S0FEVztFQUFBLENBNUNiLENBQUE7O21CQUFBOztJQTdCRixDQUFBOzs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FFbEI7QUFBQSxJQUFBLE9BQUEsRUFBUyxTQUFDLEdBQUQsR0FBQTtBQUNQLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBbUIsV0FBbkI7QUFBQSxlQUFPLElBQVAsQ0FBQTtPQUFBO0FBQ0EsV0FBQSxXQUFBLEdBQUE7QUFDRSxRQUFBLElBQWdCLEdBQUcsQ0FBQyxjQUFKLENBQW1CLElBQW5CLENBQWhCO0FBQUEsaUJBQU8sS0FBUCxDQUFBO1NBREY7QUFBQSxPQURBO2FBSUEsS0FMTztJQUFBLENBQVQ7QUFBQSxJQVFBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTtBQUNSLFVBQUEsaUJBQUE7QUFBQSxNQUFBLElBQUEsR0FBTyxNQUFQLENBQUE7QUFFQSxXQUFBLFdBQUE7MEJBQUE7QUFDRSxRQUFBLFNBQUEsT0FBUyxHQUFULENBQUE7QUFBQSxRQUNBLElBQUssQ0FBQSxJQUFBLENBQUwsR0FBYSxLQURiLENBREY7QUFBQSxPQUZBO2FBTUEsS0FQUTtJQUFBLENBUlY7SUFGa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7O0FDR0EsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FJbEI7QUFBQSxJQUFBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTtBQUNSLFVBQUEsV0FBQTtBQUFBLE1BQUEsV0FBQSxHQUFjLENBQUMsQ0FBQyxJQUFGLENBQU8sR0FBUCxDQUFXLENBQUMsT0FBWixDQUFvQixvQkFBcEIsRUFBMEMsT0FBMUMsQ0FBa0QsQ0FBQyxXQUFuRCxDQUFBLENBQWQsQ0FBQTthQUNBLElBQUMsQ0FBQSxRQUFELENBQVcsV0FBWCxFQUZRO0lBQUEsQ0FBVjtBQUFBLElBTUEsVUFBQSxFQUFhLFNBQUMsR0FBRCxHQUFBO0FBQ1QsTUFBQSxHQUFBLEdBQVUsV0FBSixHQUFjLEVBQWQsR0FBc0IsTUFBQSxDQUFPLEdBQVAsQ0FBNUIsQ0FBQTtBQUNBLGFBQU8sR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFYLENBQWEsQ0FBQyxXQUFkLENBQUEsQ0FBQSxHQUE4QixHQUFHLENBQUMsS0FBSixDQUFVLENBQVYsQ0FBckMsQ0FGUztJQUFBLENBTmI7QUFBQSxJQVlBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTtBQUNSLE1BQUEsSUFBSSxXQUFKO2VBQ0UsR0FERjtPQUFBLE1BQUE7ZUFHRSxNQUFBLENBQU8sR0FBUCxDQUFXLENBQUMsT0FBWixDQUFvQixhQUFwQixFQUFtQyxTQUFDLENBQUQsR0FBQTtpQkFDakMsQ0FBQyxDQUFDLFdBQUYsQ0FBQSxFQURpQztRQUFBLENBQW5DLEVBSEY7T0FEUTtJQUFBLENBWlY7QUFBQSxJQXFCQSxTQUFBLEVBQVcsU0FBQyxHQUFELEdBQUE7YUFDVCxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVAsQ0FBVyxDQUFDLE9BQVosQ0FBb0IsVUFBcEIsRUFBZ0MsS0FBaEMsQ0FBc0MsQ0FBQyxPQUF2QyxDQUErQyxVQUEvQyxFQUEyRCxHQUEzRCxDQUErRCxDQUFDLFdBQWhFLENBQUEsRUFEUztJQUFBLENBckJYO0FBQUEsSUEwQkEsTUFBQSxFQUFRLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNOLE1BQUEsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLE1BQWYsQ0FBQSxLQUEwQixDQUE3QjtlQUNFLE9BREY7T0FBQSxNQUFBO2VBR0UsRUFBQSxHQUFLLE1BQUwsR0FBYyxPQUhoQjtPQURNO0lBQUEsQ0ExQlI7QUFBQSxJQW1DQSxZQUFBLEVBQWMsU0FBQyxHQUFELEdBQUE7YUFDWixJQUFJLENBQUMsU0FBTCxDQUFlLEdBQWYsRUFBb0IsSUFBcEIsRUFBMEIsQ0FBMUIsRUFEWTtJQUFBLENBbkNkO0FBQUEsSUFzQ0EsUUFBQSxFQUFVLFNBQUMsR0FBRCxHQUFBO2FBQ1IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQVcsQ0FBQyxPQUFaLENBQW9CLGNBQXBCLEVBQW9DLFNBQUMsS0FBRCxFQUFRLENBQVIsR0FBQTtlQUNsQyxDQUFDLENBQUMsV0FBRixDQUFBLEVBRGtDO01BQUEsQ0FBcEMsRUFEUTtJQUFBLENBdENWO0FBQUEsSUEyQ0EsSUFBQSxFQUFNLFNBQUMsR0FBRCxHQUFBO2FBQ0osR0FBRyxDQUFDLE9BQUosQ0FBWSxZQUFaLEVBQTBCLEVBQTFCLEVBREk7SUFBQSxDQTNDTjtJQUprQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBQWpCLENBQUE7Ozs7QUNIQSxJQUFBLG1CQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSw2QkFBQSxHQUFBLENBQWI7O0FBQUEsZ0NBSUEsR0FBQSxHQUFLLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUNILElBQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FBSDthQUNFLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBWCxFQUFrQixLQUFsQixFQURGO0tBQUEsTUFBQTthQUdFLEtBQUssQ0FBQyxHQUFOLENBQVUsa0JBQVYsRUFBK0IsTUFBQSxHQUFLLENBQXpDLElBQUMsQ0FBQSxZQUFELENBQWMsS0FBZCxDQUF5QyxDQUFMLEdBQTZCLEdBQTVELEVBSEY7S0FERztFQUFBLENBSkwsQ0FBQTs7QUFBQSxnQ0FlQSxZQUFBLEdBQWMsU0FBQyxHQUFELEdBQUE7QUFDWixJQUFBLElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLENBQUg7YUFDRyxHQUFBLEdBQU4sR0FBTSxHQUFTLElBRFo7S0FBQSxNQUFBO2FBR0UsSUFIRjtLQURZO0VBQUEsQ0FmZCxDQUFBOztBQUFBLGdDQXNCQSxRQUFBLEdBQVUsU0FBQyxLQUFELEdBQUE7V0FDUixLQUFLLENBQUMsT0FBTixDQUFjLFlBQWQsQ0FBQSxLQUErQixFQUR2QjtFQUFBLENBdEJWLENBQUE7O0FBQUEsZ0NBMEJBLFFBQUEsR0FBVSxTQUFDLEtBQUQsR0FBQTtXQUNSLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFRLENBQUMsV0FBbEIsQ0FBQSxDQUFBLEtBQW1DLE1BRDNCO0VBQUEsQ0ExQlYsQ0FBQTs7NkJBQUE7O0lBRkYsQ0FBQTs7OztBQ0FBLElBQUEsd0NBQUE7O0FBQUEsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLHlCQUFSLENBQXRCLENBQUE7O0FBQUEsbUJBQ0EsR0FBc0IsT0FBQSxDQUFRLHlCQUFSLENBRHRCLENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFFbEIsTUFBQSx3Q0FBQTtBQUFBLEVBQUEsbUJBQUEsR0FBMEIsSUFBQSxtQkFBQSxDQUFBLENBQTFCLENBQUE7QUFBQSxFQUNBLG1CQUFBLEdBQTBCLElBQUEsbUJBQUEsQ0FBQSxDQUQxQixDQUFBO1NBSUE7QUFBQSxJQUFBLEdBQUEsRUFBSyxTQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsWUFBZixHQUFBO0FBQ0gsVUFBQSxZQUFBO0FBQUEsTUFBQSxZQUFBLEdBQWUsSUFBQyxDQUFBLGdCQUFELENBQWtCLFlBQWxCLENBQWYsQ0FBQTthQUNBLFlBQVksQ0FBQyxHQUFiLENBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBRkc7SUFBQSxDQUFMO0FBQUEsSUFLQSxnQkFBQSxFQUFrQixTQUFDLFlBQUQsR0FBQTtBQUNoQixjQUFPLFlBQVA7QUFBQSxhQUNPLFVBRFA7aUJBQ3VCLG9CQUR2QjtBQUFBO2lCQUdJLG9CQUhKO0FBQUEsT0FEZ0I7SUFBQSxDQUxsQjtBQUFBLElBWUEsc0JBQUEsRUFBd0IsU0FBQSxHQUFBO2FBQ3RCLG9CQURzQjtJQUFBLENBWnhCO0FBQUEsSUFnQkEsc0JBQUEsRUFBd0IsU0FBQSxHQUFBO2FBQ3RCLG9CQURzQjtJQUFBLENBaEJ4QjtJQU5rQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBSGpCLENBQUE7Ozs7QUNBQSxJQUFBLHdDQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLEdBQ0EsR0FBTSxPQUFBLENBQVEsd0JBQVIsQ0FETixDQUFBOztBQUFBLFNBRUEsR0FBWSxPQUFBLENBQVEsc0JBQVIsQ0FGWixDQUFBOztBQUFBLE1BR0EsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FIVCxDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxrQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxtQkFBQSxhQUFhLElBQUMsQ0FBQSwwQkFBQSxvQkFBb0IsZ0JBQUEsUUFDakQsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxXQUFSLEVBQXFCLDJCQUFyQixDQUFBLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxJQUFDLENBQUEsa0JBQVIsRUFBNEIsa0NBQTVCLENBREEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFBLENBQUUsSUFBQyxDQUFBLGtCQUFrQixDQUFDLFVBQXRCLENBSFQsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsUUFKaEIsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsRUFMaEIsQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLGNBQUQsR0FBc0IsSUFBQSxTQUFBLENBQUEsQ0FQdEIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FSQSxDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsY0FBYyxDQUFDLEtBQWhCLENBQUEsQ0FUQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSxxQkFhQSxPQUFBLEdBQVMsU0FBQSxHQUFBO0FBQ1AsUUFBQSx1QkFBQTtBQUFBLElBQUEsOENBQWdCLENBQUUsZ0JBQWYsSUFBeUIsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUExQztBQUNFLE1BQUEsUUFBQSxHQUFZLEdBQUEsR0FBakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFOLENBQUE7QUFBQSxNQUNBLE9BQUEsR0FBVSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBbUIsUUFBbkIsQ0FBNEIsQ0FBQyxHQUE3QixDQUFrQyxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWQsQ0FBcUIsUUFBckIsQ0FBbEMsQ0FEVixDQUFBO0FBRUEsTUFBQSxJQUFBLENBQUEsT0FBcUIsQ0FBQyxNQUF0QjtBQUFBLGNBQUEsQ0FBQTtPQUZBO0FBQUEsTUFJQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxLQUpiLENBQUE7QUFBQSxNQUtBLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFpQixJQUFDLENBQUEsWUFBbEIsQ0FMQSxDQUFBO2FBTUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxRQVBYO0tBRE87RUFBQSxDQWJULENBQUE7O0FBQUEscUJBd0JBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtBQUNuQixJQUFBLElBQUMsQ0FBQSxjQUFjLENBQUMsU0FBaEIsQ0FBQSxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsS0FBcEIsQ0FBMEIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUN4QixRQUFBLEtBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsUUFDQSxLQUFDLENBQUEsTUFBRCxDQUFBLENBREEsQ0FBQTtBQUFBLFFBRUEsS0FBQyxDQUFBLHlCQUFELENBQUEsQ0FGQSxDQUFBO2VBR0EsS0FBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLEVBSndCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUIsRUFGbUI7RUFBQSxDQXhCckIsQ0FBQTs7QUFBQSxxQkFpQ0EsS0FBQSxHQUFPLFNBQUMsUUFBRCxHQUFBO1dBQ0wsSUFBQyxDQUFBLGNBQWMsQ0FBQyxXQUFoQixDQUE0QixRQUE1QixFQURLO0VBQUEsQ0FqQ1AsQ0FBQTs7QUFBQSxxQkFxQ0EsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBaEIsQ0FBQSxFQURPO0VBQUEsQ0FyQ1QsQ0FBQTs7QUFBQSxxQkF5Q0EsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBUCxFQUFtQiw4Q0FBbkIsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQUEsRUFGSTtFQUFBLENBekNOLENBQUE7O0FBQUEscUJBaURBLHlCQUFBLEdBQTJCLFNBQUEsR0FBQTtBQUN6QixJQUFBLElBQUMsQ0FBQSxXQUFXLENBQUMsWUFBWSxDQUFDLEdBQTFCLENBQStCLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLFlBQVQsRUFBdUIsSUFBdkIsQ0FBL0IsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLGNBQWMsQ0FBQyxHQUE1QixDQUFpQyxDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxjQUFULEVBQXlCLElBQXpCLENBQWpDLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxZQUFZLENBQUMsR0FBMUIsQ0FBK0IsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsWUFBVCxFQUF1QixJQUF2QixDQUEvQixDQUZBLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxXQUFXLENBQUMscUJBQXFCLENBQUMsR0FBbkMsQ0FBd0MsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEscUJBQVQsRUFBZ0MsSUFBaEMsQ0FBeEMsQ0FIQSxDQUFBO1dBSUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFoQyxDQUFxQyxDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxrQkFBVCxFQUE2QixJQUE3QixDQUFyQyxFQUx5QjtFQUFBLENBakQzQixDQUFBOztBQUFBLHFCQXlEQSxZQUFBLEdBQWMsU0FBQyxLQUFELEdBQUE7V0FDWixJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWYsRUFEWTtFQUFBLENBekRkLENBQUE7O0FBQUEscUJBNkRBLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxJQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsaUNBQUQsQ0FBbUMsS0FBbkMsRUFGYztFQUFBLENBN0RoQixDQUFBOztBQUFBLHFCQWtFQSxZQUFBLEdBQWMsU0FBQyxLQUFELEdBQUE7QUFDWixJQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWYsRUFGWTtFQUFBLENBbEVkLENBQUE7O0FBQUEscUJBdUVBLHFCQUFBLEdBQXVCLFNBQUMsS0FBRCxHQUFBO1dBQ3JCLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QixDQUE2QixDQUFDLGFBQTlCLENBQUEsRUFEcUI7RUFBQSxDQXZFdkIsQ0FBQTs7QUFBQSxxQkEyRUEsa0JBQUEsR0FBb0IsU0FBQyxLQUFELEdBQUE7V0FDbEIsSUFBQyxDQUFBLHFCQUFELENBQXVCLEtBQXZCLENBQTZCLENBQUMsVUFBOUIsQ0FBQSxFQURrQjtFQUFBLENBM0VwQixDQUFBOztBQUFBLHFCQW1GQSxxQkFBQSxHQUF1QixTQUFDLEtBQUQsR0FBQTtBQUNyQixRQUFBLFlBQUE7b0JBQUEsSUFBQyxDQUFBLHNCQUFhLEtBQUssQ0FBQyx1QkFBUSxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFDLENBQUEsa0JBQWtCLENBQUMsVUFBckMsR0FEUDtFQUFBLENBbkZ2QixDQUFBOztBQUFBLHFCQXVGQSxpQ0FBQSxHQUFtQyxTQUFDLEtBQUQsR0FBQTtXQUNqQyxNQUFBLENBQUEsSUFBUSxDQUFBLFlBQWEsQ0FBQSxLQUFLLENBQUMsRUFBTixFQURZO0VBQUEsQ0F2Rm5DLENBQUE7O0FBQUEscUJBMkZBLE1BQUEsR0FBUSxTQUFBLEdBQUE7V0FDTixJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsS0FBRCxHQUFBO2VBQ2hCLEtBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixFQURnQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCLEVBRE07RUFBQSxDQTNGUixDQUFBOztBQUFBLHFCQWdHQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsSUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsS0FBRCxHQUFBO2VBQ2hCLEtBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QixDQUE2QixDQUFDLGdCQUE5QixDQUErQyxLQUEvQyxFQURnQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCLENBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFBLEVBSks7RUFBQSxDQWhHUCxDQUFBOztBQUFBLHFCQXVHQSxNQUFBLEdBQVEsU0FBQSxHQUFBO0FBQ04sSUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFELENBQUEsRUFGTTtFQUFBLENBdkdSLENBQUE7O0FBQUEscUJBNEdBLGFBQUEsR0FBZSxTQUFDLEtBQUQsR0FBQTtBQUNiLFFBQUEsV0FBQTtBQUFBLElBQUEsSUFBVSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBVjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBRUEsSUFBQSxJQUFHLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixLQUFLLENBQUMsUUFBekIsQ0FBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEtBQUssQ0FBQyxRQUE5QixFQUF3QyxLQUF4QyxDQUFBLENBREY7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLEtBQUssQ0FBQyxJQUF6QixDQUFIO0FBQ0gsTUFBQSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsS0FBSyxDQUFDLElBQTlCLEVBQW9DLEtBQXBDLENBQUEsQ0FERztLQUFBLE1BRUEsSUFBRyxLQUFLLENBQUMsZUFBVDtBQUNILE1BQUEsSUFBQyxDQUFBLDhCQUFELENBQWdDLEtBQWhDLENBQUEsQ0FERztLQUFBLE1BQUE7QUFHSCxNQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsNENBQVYsQ0FBQSxDQUhHO0tBTkw7QUFBQSxJQVdBLFdBQUEsR0FBYyxJQUFDLENBQUEscUJBQUQsQ0FBdUIsS0FBdkIsQ0FYZCxDQUFBO0FBQUEsSUFZQSxXQUFXLENBQUMsZ0JBQVosQ0FBNkIsSUFBN0IsQ0FaQSxDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsc0JBQXBCLENBQTJDLFdBQTNDLENBYkEsQ0FBQTtXQWNBLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQWZhO0VBQUEsQ0E1R2YsQ0FBQTs7QUFBQSxxQkE4SEEsaUJBQUEsR0FBbUIsU0FBQyxLQUFELEdBQUE7V0FDakIsS0FBQSxJQUFTLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QixDQUE2QixDQUFDLGdCQUR0QjtFQUFBLENBOUhuQixDQUFBOztBQUFBLHFCQWtJQSxtQkFBQSxHQUFxQixTQUFDLEtBQUQsR0FBQTtXQUNuQixLQUFLLENBQUMsUUFBTixDQUFlLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFVBQUQsR0FBQTtBQUNiLFFBQUEsSUFBRyxDQUFBLEtBQUssQ0FBQSxpQkFBRCxDQUFtQixVQUFuQixDQUFQO2lCQUNFLEtBQUMsQ0FBQSxhQUFELENBQWUsVUFBZixFQURGO1NBRGE7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmLEVBRG1CO0VBQUEsQ0FsSXJCLENBQUE7O0FBQUEscUJBd0lBLHNCQUFBLEdBQXdCLFNBQUMsT0FBRCxFQUFVLEtBQVYsR0FBQTtBQUN0QixRQUFBLE1BQUE7QUFBQSxJQUFBLE1BQUEsR0FBWSxPQUFBLEtBQVcsS0FBSyxDQUFDLFFBQXBCLEdBQWtDLE9BQWxDLEdBQStDLFFBQXhELENBQUE7V0FDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixPQUFqQixDQUEwQixDQUFBLE1BQUEsQ0FBMUIsQ0FBa0MsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsQ0FBbEMsRUFGc0I7RUFBQSxDQXhJeEIsQ0FBQTs7QUFBQSxxQkE2SUEsOEJBQUEsR0FBZ0MsU0FBQyxLQUFELEdBQUE7V0FDOUIsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsQ0FBdUIsQ0FBQyxRQUF4QixDQUFpQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBSyxDQUFDLGVBQXpCLENBQWpDLEVBRDhCO0VBQUEsQ0E3SWhDLENBQUE7O0FBQUEscUJBaUpBLGVBQUEsR0FBaUIsU0FBQyxLQUFELEdBQUE7V0FDZixJQUFDLENBQUEscUJBQUQsQ0FBdUIsS0FBdkIsQ0FBNkIsQ0FBQyxNQURmO0VBQUEsQ0FqSmpCLENBQUE7O0FBQUEscUJBcUpBLGlCQUFBLEdBQW1CLFNBQUMsU0FBRCxHQUFBO0FBQ2pCLFFBQUEsVUFBQTtBQUFBLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBYjthQUNFLElBQUMsQ0FBQSxNQURIO0tBQUEsTUFBQTtBQUdFLE1BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixTQUFTLENBQUMsYUFBakMsQ0FBYixDQUFBO2FBQ0EsQ0FBQSxDQUFFLFVBQVUsQ0FBQyxtQkFBWCxDQUErQixTQUFTLENBQUMsSUFBekMsQ0FBRixFQUpGO0tBRGlCO0VBQUEsQ0FySm5CLENBQUE7O0FBQUEscUJBNkpBLGFBQUEsR0FBZSxTQUFDLEtBQUQsR0FBQTtBQUNiLElBQUEsSUFBQyxDQUFBLHFCQUFELENBQXVCLEtBQXZCLENBQTZCLENBQUMsZ0JBQTlCLENBQStDLEtBQS9DLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLENBQXVCLENBQUMsTUFBeEIsQ0FBQSxFQUZhO0VBQUEsQ0E3SmYsQ0FBQTs7a0JBQUE7O0lBUEYsQ0FBQTs7OztBQ0FBLElBQUEsZ0RBQUE7RUFBQTtpU0FBQTs7QUFBQSxtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVIsQ0FBdEIsQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUF1QjtBQUVyQix3Q0FBQSxDQUFBOztBQUFBLEVBQUEsbUJBQUMsQ0FBQSxVQUFELEdBQWEsd0JBQWIsQ0FBQTs7QUFHYSxFQUFBLDZCQUFBLEdBQUEsQ0FIYjs7QUFBQSxnQ0FPQSxHQUFBLEdBQUssU0FBQyxLQUFELEVBQVEsS0FBUixHQUFBO0FBQ0gsSUFBQSxJQUFtQyxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FBbkM7QUFBQSxhQUFPLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBWCxFQUFrQixLQUFsQixDQUFQLENBQUE7S0FBQTtBQUFBLElBRUEsTUFBQSxDQUFPLGVBQUEsSUFBVSxLQUFBLEtBQVMsRUFBMUIsRUFBOEIsMENBQTlCLENBRkEsQ0FBQTtBQUFBLElBSUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxPQUFmLENBSkEsQ0FBQTtBQUtBLElBQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FBSDtBQUNFLE1BQUEsSUFBNkIsS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFYLENBQUEsSUFBcUIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsQ0FBVixDQUFsRDtBQUFBLFFBQUEsSUFBQyxDQUFBLGlCQUFELENBQW1CLEtBQW5CLENBQUEsQ0FBQTtPQUFBO2FBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxVQUFYLEVBQXVCLEVBQUEsR0FBRSxtQkFBbUIsQ0FBQyxVQUF0QixHQUFtQyxLQUExRCxFQUZGO0tBQUEsTUFBQTthQUlFLEtBQUssQ0FBQyxHQUFOLENBQVUsa0JBQVYsRUFBK0IsTUFBQSxHQUFLLG1CQUFtQixDQUFDLFVBQXpCLEdBQXNDLENBQTFFLElBQUMsQ0FBQSxZQUFELENBQWMsS0FBZCxDQUEwRSxDQUF0QyxHQUE4RCxHQUE3RixFQUpGO0tBTkc7RUFBQSxDQVBMLENBQUE7O0FBQUEsZ0NBcUJBLFNBQUEsR0FBVyxTQUFDLEtBQUQsRUFBUSxLQUFSLEdBQUE7QUFDVCxJQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQUg7YUFDRSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFBa0IsS0FBbEIsRUFERjtLQUFBLE1BQUE7YUFHRSxLQUFLLENBQUMsR0FBTixDQUFVLGtCQUFWLEVBQStCLE1BQUEsR0FBSyxDQUF6QyxJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsQ0FBeUMsQ0FBTCxHQUE2QixHQUE1RCxFQUhGO0tBRFM7RUFBQSxDQXJCWCxDQUFBOztBQUFBLGdDQTRCQSxpQkFBQSxHQUFtQixTQUFDLEtBQUQsR0FBQTtXQUNqQixLQUFLLENBQUMsVUFBTixDQUFpQixLQUFqQixFQURpQjtFQUFBLENBNUJuQixDQUFBOzs2QkFBQTs7R0FGaUQsb0JBSG5ELENBQUE7Ozs7QUNBQSxJQUFBLDhFQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLEdBQ0EsR0FBTSxNQUFNLENBQUMsR0FEYixDQUFBOztBQUFBLElBRUEsR0FBTyxNQUFNLENBQUMsSUFGZCxDQUFBOztBQUFBLGlCQUdBLEdBQW9CLE9BQUEsQ0FBUSxnQ0FBUixDQUhwQixDQUFBOztBQUFBLFFBSUEsR0FBVyxPQUFBLENBQVEscUJBQVIsQ0FKWCxDQUFBOztBQUFBLEdBS0EsR0FBTSxPQUFBLENBQVEsb0JBQVIsQ0FMTixDQUFBOztBQUFBLFlBTUEsR0FBZSxPQUFBLENBQVEsaUJBQVIsQ0FOZixDQUFBOztBQUFBLE1BUU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxxQkFBQyxJQUFELEdBQUE7QUFDWCxJQURjLElBQUMsQ0FBQSxhQUFBLE9BQU8sSUFBQyxDQUFBLGFBQUEsT0FBTyxJQUFDLENBQUEsa0JBQUEsWUFBWSxJQUFDLENBQUEsa0JBQUEsVUFDNUMsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsS0FBVixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFEbkIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGVBQUQsR0FBbUIsS0FGbkIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FIcEIsQ0FBQTtBQUtBLElBQUEsSUFBQSxDQUFBLElBQVEsQ0FBQSxVQUFSO0FBRUUsTUFBQSxJQUFDLENBQUEsS0FDQyxDQUFDLElBREgsQ0FDUSxTQURSLEVBQ21CLElBRG5CLENBRUUsQ0FBQyxRQUZILENBRVksR0FBRyxDQUFDLE9BRmhCLENBR0UsQ0FBQyxJQUhILENBR1EsSUFBSSxDQUFDLFFBSGIsRUFHdUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUhqQyxDQUFBLENBRkY7S0FMQTtBQUFBLElBWUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQVpBLENBRFc7RUFBQSxDQUFiOztBQUFBLHdCQWdCQSxNQUFBLEdBQVEsU0FBQyxJQUFELEdBQUE7QUFDTixJQUFBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUZNO0VBQUEsQ0FoQlIsQ0FBQTs7QUFBQSx3QkFxQkEsYUFBQSxHQUFlLFNBQUEsR0FBQTtBQUNiLElBQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQWhCLEVBQXlCLElBQUMsQ0FBQSxLQUFLLENBQUMsZ0JBQWhDLENBQUEsQ0FBQTtBQUVBLElBQUEsSUFBRyxDQUFBLElBQUssQ0FBQSxRQUFELENBQUEsQ0FBUDtBQUNFLE1BQUEsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0FBQSxDQURGO0tBRkE7V0FLQSxJQUFDLENBQUEsbUJBQUQsQ0FBQSxFQU5hO0VBQUEsQ0FyQmYsQ0FBQTs7QUFBQSx3QkE4QkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtBQUNWLFFBQUEsaUJBQUE7QUFBQTtBQUFBLFNBQUEsWUFBQTt5QkFBQTtBQUNFLE1BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQLEVBQWEsS0FBYixDQUFBLENBREY7QUFBQSxLQUFBO1dBR0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFKVTtFQUFBLENBOUJaLENBQUE7O0FBQUEsd0JBcUNBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtXQUNoQixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsU0FBRCxHQUFBO0FBQ2YsWUFBQSxLQUFBO0FBQUEsUUFBQSxJQUFHLFNBQVMsQ0FBQyxRQUFiO0FBQ0UsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQVIsQ0FBQTtBQUNBLFVBQUEsSUFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBSDttQkFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFNBQVYsRUFBcUIsTUFBckIsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLEVBQXFCLEVBQXJCLEVBSEY7V0FGRjtTQURlO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFEZ0I7RUFBQSxDQXJDbEIsQ0FBQTs7QUFBQSx3QkFpREEsYUFBQSxHQUFlLFNBQUEsR0FBQTtXQUNiLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDZixRQUFBLElBQUcsU0FBUyxDQUFDLFFBQWI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGE7RUFBQSxDQWpEZixDQUFBOztBQUFBLHdCQXlEQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7V0FDbEIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNmLFFBQUEsSUFBRyxTQUFTLENBQUMsUUFBVixJQUFzQixLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBekI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGtCO0VBQUEsQ0F6RHBCLENBQUE7O0FBQUEsd0JBK0RBLElBQUEsR0FBTSxTQUFBLEdBQUE7V0FDSixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxDQUFhLENBQUMsSUFBZCxDQUFtQixTQUFuQixFQURJO0VBQUEsQ0EvRE4sQ0FBQTs7QUFBQSx3QkFtRUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFBLENBQWEsQ0FBQyxJQUFkLENBQW1CLFNBQW5CLEVBREk7RUFBQSxDQW5FTixDQUFBOztBQUFBLHdCQXVFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBZ0IsR0FBRyxDQUFDLGdCQUFwQixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBRlk7RUFBQSxDQXZFZCxDQUFBOztBQUFBLHdCQTRFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsR0FBRyxDQUFDLGdCQUF2QixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUZZO0VBQUEsQ0E1RWQsQ0FBQTs7QUFBQSx3QkFrRkEsS0FBQSxHQUFPLFNBQUMsTUFBRCxHQUFBO0FBQ0wsUUFBQSxXQUFBO0FBQUEsSUFBQSxLQUFBLG1EQUE4QixDQUFBLENBQUEsQ0FBRSxDQUFDLGFBQWpDLENBQUE7V0FDQSxDQUFBLENBQUUsS0FBRixDQUFRLENBQUMsS0FBVCxDQUFBLEVBRks7RUFBQSxDQWxGUCxDQUFBOztBQUFBLHdCQXVGQSxRQUFBLEdBQVUsU0FBQSxHQUFBO1dBQ1IsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxnQkFBcEIsRUFEUTtFQUFBLENBdkZWLENBQUE7O0FBQUEsd0JBMkZBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTtXQUNyQixJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLHFCQUFWLENBQUEsRUFEcUI7RUFBQSxDQTNGdkIsQ0FBQTs7QUFBQSx3QkErRkEsNkJBQUEsR0FBK0IsU0FBQSxHQUFBO1dBQzdCLEdBQUcsQ0FBQyw2QkFBSixDQUFrQyxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBekMsRUFENkI7RUFBQSxDQS9GL0IsQ0FBQTs7QUFBQSx3QkFtR0EsT0FBQSxHQUFTLFNBQUMsT0FBRCxFQUFVLGNBQVYsR0FBQTtBQUNQLFFBQUEscUJBQUE7QUFBQTtTQUFBLGVBQUE7NEJBQUE7QUFDRSxNQUFBLElBQUcsOEJBQUEsSUFBeUIsQ0FBRyxlQUFELElBQVcsS0FBQSxLQUFTLEVBQXRCLENBQTVCO3NCQUNFLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxFQUFXLGNBQWUsQ0FBQSxJQUFBLENBQTFCLEdBREY7T0FBQSxNQUFBO3NCQUdFLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxFQUFXLEtBQVgsR0FIRjtPQURGO0FBQUE7b0JBRE87RUFBQSxDQW5HVCxDQUFBOztBQUFBLHdCQTJHQSxHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ0gsUUFBQSxTQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQWhCLENBQVosQ0FBQTtBQUNBLFlBQU8sU0FBUyxDQUFDLElBQWpCO0FBQUEsV0FDTyxVQURQO2VBQ3VCLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixFQUFtQixLQUFuQixFQUR2QjtBQUFBLFdBRU8sT0FGUDtlQUVvQixJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFGcEI7QUFBQSxXQUdPLE1BSFA7ZUFHbUIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEVBQWUsS0FBZixFQUhuQjtBQUFBLEtBRkc7RUFBQSxDQTNHTCxDQUFBOztBQUFBLHdCQW1IQSxHQUFBLEdBQUssU0FBQyxJQUFELEdBQUE7QUFDSCxRQUFBLFNBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBaEIsQ0FBWixDQUFBO0FBQ0EsWUFBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxXQUNPLFVBRFA7ZUFDdUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiLEVBRHZCO0FBQUEsV0FFTyxPQUZQO2VBRW9CLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUZwQjtBQUFBLFdBR08sTUFIUDtlQUdtQixJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsRUFIbkI7QUFBQSxLQUZHO0VBQUEsQ0FuSEwsQ0FBQTs7QUFBQSx3QkEySEEsV0FBQSxHQUFhLFNBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtXQUNBLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFGVztFQUFBLENBM0hiLENBQUE7O0FBQUEsd0JBZ0lBLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQ0EsSUFBQSxJQUFHLEtBQUg7QUFDRSxNQUFBLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBRyxDQUFDLGFBQW5CLENBQUEsQ0FERjtLQUFBLE1BQUE7QUFHRSxNQUFBLEtBQUssQ0FBQyxXQUFOLENBQWtCLEdBQUcsQ0FBQyxhQUF0QixDQUFBLENBSEY7S0FEQTtBQUFBLElBTUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsV0FBaEIsRUFBNkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFoRCxDQU5BLENBQUE7V0FPQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQUEsSUFBUyxFQUFwQixFQVJXO0VBQUEsQ0FoSWIsQ0FBQTs7QUFBQSx3QkEySUEsYUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtXQUNBLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBRyxDQUFDLGFBQW5CLEVBRmE7RUFBQSxDQTNJZixDQUFBOztBQUFBLHdCQWdKQSxZQUFBLEdBQWMsU0FBQyxJQUFELEdBQUE7QUFDWixRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQ0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBSDthQUNFLEtBQUssQ0FBQyxXQUFOLENBQWtCLEdBQUcsQ0FBQyxhQUF0QixFQURGO0tBRlk7RUFBQSxDQWhKZCxDQUFBOztBQUFBLHdCQXNKQSxPQUFBLEdBQVMsU0FBQyxJQUFELEdBQUE7QUFDUCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO1dBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBQSxFQUZPO0VBQUEsQ0F0SlQsQ0FBQTs7QUFBQSx3QkEySkEsT0FBQSxHQUFTLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNQLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7QUFBQSxJQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBQSxJQUFTLEVBQXBCLENBREEsQ0FBQTtBQUdBLElBQUEsSUFBRyxDQUFBLEtBQUg7QUFDRSxNQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUE5QixDQUFBLENBREY7S0FBQSxNQUVLLElBQUcsS0FBQSxJQUFVLENBQUEsSUFBSyxDQUFBLFVBQWxCO0FBQ0gsTUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FBQSxDQURHO0tBTEw7QUFBQSxJQVFBLElBQUMsQ0FBQSxzQkFBRCxJQUFDLENBQUEsb0JBQXNCLEdBUnZCLENBQUE7V0FTQSxJQUFDLENBQUEsaUJBQWtCLENBQUEsSUFBQSxDQUFuQixHQUEyQixLQVZwQjtFQUFBLENBM0pULENBQUE7O0FBQUEsd0JBd0tBLG1CQUFBLEdBQXFCLFNBQUMsYUFBRCxHQUFBO0FBQ25CLFFBQUEsSUFBQTtxRUFBOEIsQ0FBRSxjQURiO0VBQUEsQ0F4S3JCLENBQUE7O0FBQUEsd0JBbUxBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsUUFBQSxxQkFBQTtBQUFBO1NBQUEsOEJBQUEsR0FBQTtBQUNFLE1BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7QUFDQSxNQUFBLElBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLENBQW9CLENBQUMsTUFBeEI7c0JBQ0UsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFRLENBQUEsSUFBQSxDQUExQixHQURGO09BQUEsTUFBQTs4QkFBQTtPQUZGO0FBQUE7b0JBRGU7RUFBQSxDQW5MakIsQ0FBQTs7QUFBQSx3QkEwTEEsUUFBQSxHQUFVLFNBQUMsSUFBRCxHQUFBO0FBQ1IsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtXQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBWCxFQUZRO0VBQUEsQ0ExTFYsQ0FBQTs7QUFBQSx3QkErTEEsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNSLFFBQUEsbUNBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBRUEsSUFBQSxJQUFHLEtBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBZixDQUFBLENBQUE7QUFDQSxNQUFBLElBQW9ELElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLGNBQVosQ0FBcEQ7QUFBQSxRQUFBLFlBQUEsR0FBZSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBWSxjQUFaLENBQTRCLENBQUEsSUFBQSxDQUEzQyxDQUFBO09BREE7QUFBQSxNQUVBLFlBQVksQ0FBQyxHQUFiLENBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBQStCLFlBQS9CLENBRkEsQ0FBQTthQUdBLEtBQUssQ0FBQyxXQUFOLENBQWtCLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBN0IsRUFKRjtLQUFBLE1BQUE7QUFNRSxNQUFBLGNBQUEsR0FBaUIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsbUJBQVQsRUFBOEIsSUFBOUIsRUFBb0MsS0FBcEMsQ0FBakIsQ0FBQTthQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixFQUEwQixjQUExQixFQVBGO0tBSFE7RUFBQSxDQS9MVixDQUFBOztBQUFBLHdCQTRNQSxtQkFBQSxHQUFxQixTQUFDLEtBQUQsR0FBQTtBQUNuQixRQUFBLGtDQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsUUFBTixDQUFlLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBMUIsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFULEtBQXFCLEtBQXhCO0FBQ0UsTUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBQSxDQUFSLENBQUE7QUFBQSxNQUNBLE1BQUEsR0FBUyxLQUFLLENBQUMsTUFBTixDQUFBLENBRFQsQ0FERjtLQUFBLE1BQUE7QUFJRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsVUFBTixDQUFBLENBQVIsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxHQUFTLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FEVCxDQUpGO0tBREE7QUFBQSxJQU9BLEtBQUEsR0FBUyxzQkFBQSxHQUFxQixLQUFyQixHQUE0QixHQUE1QixHQUE4QixNQUE5QixHQUFzQyxnQkFQL0MsQ0FBQTtBQVFBLElBQUEsSUFBb0QsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksY0FBWixDQUFwRDtBQUFBLE1BQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLGNBQVosQ0FBNEIsQ0FBQSxJQUFBLENBQTNDLENBQUE7S0FSQTtXQVNBLFlBQVksQ0FBQyxHQUFiLENBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBQStCLFlBQS9CLEVBVm1CO0VBQUEsQ0E1TXJCLENBQUE7O0FBQUEsd0JBeU5BLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxTQUFQLEdBQUE7QUFDTCxRQUFBLG9DQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFPLENBQUEsSUFBQSxDQUFLLENBQUMsZUFBdkIsQ0FBdUMsU0FBdkMsQ0FBVixDQUFBO0FBQ0EsSUFBQSxJQUFHLE9BQU8sQ0FBQyxNQUFYO0FBQ0U7QUFBQSxXQUFBLDJDQUFBOytCQUFBO0FBQ0UsUUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsV0FBbkIsQ0FBQSxDQURGO0FBQUEsT0FERjtLQURBO1dBS0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLE9BQU8sQ0FBQyxHQUF4QixFQU5LO0VBQUEsQ0F6TlAsQ0FBQTs7QUFBQSx3QkFzT0EsY0FBQSxHQUFnQixTQUFDLEtBQUQsR0FBQTtXQUNkLFVBQUEsQ0FBWSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ1YsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLENBQW9CLENBQUMsSUFBckIsQ0FBMEIsVUFBMUIsRUFBc0MsSUFBdEMsRUFEVTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVosRUFFRSxHQUZGLEVBRGM7RUFBQSxDQXRPaEIsQ0FBQTs7QUFBQSx3QkErT0EsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsUUFBQSxRQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsS0FBeEIsQ0FBQSxDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQVcsQ0FBQSxDQUFHLGNBQUEsR0FBakIsR0FBRyxDQUFDLGtCQUFhLEdBQXVDLElBQTFDLENBQ1QsQ0FBQyxJQURRLENBQ0gsT0FERyxFQUNNLDJEQUROLENBRFgsQ0FBQTtBQUFBLElBR0EsS0FBSyxDQUFDLE1BQU4sQ0FBYSxRQUFiLENBSEEsQ0FBQTtXQUtBLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBTmdCO0VBQUEsQ0EvT2xCLENBQUE7O0FBQUEsd0JBMFBBLHNCQUFBLEdBQXdCLFNBQUMsS0FBRCxHQUFBO0FBQ3RCLFFBQUEsUUFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLEtBQUssQ0FBQyxHQUFOLENBQVUsVUFBVixDQUFYLENBQUE7QUFDQSxJQUFBLElBQUcsUUFBQSxLQUFZLFVBQVosSUFBMEIsUUFBQSxLQUFZLE9BQXRDLElBQWlELFFBQUEsS0FBWSxVQUFoRTthQUNFLEtBQUssQ0FBQyxHQUFOLENBQVUsVUFBVixFQUFzQixVQUF0QixFQURGO0tBRnNCO0VBQUEsQ0ExUHhCLENBQUE7O0FBQUEsd0JBZ1FBLGFBQUEsR0FBZSxTQUFBLEdBQUE7V0FDYixDQUFBLENBQUUsR0FBRyxDQUFDLGFBQUosQ0FBa0IsSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBQXpCLENBQTRCLENBQUMsSUFBL0IsRUFEYTtFQUFBLENBaFFmLENBQUE7O0FBQUEsd0JBb1FBLGtCQUFBLEdBQW9CLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUNsQixJQUFBLElBQUcsSUFBQyxDQUFBLGVBQUo7YUFDRSxJQUFBLENBQUEsRUFERjtLQUFBLE1BQUE7QUFHRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBZixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxZQUFELElBQUMsQ0FBQSxVQUFZLEdBRGIsQ0FBQTthQUVBLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFULEdBQWlCLFFBQVEsQ0FBQyxRQUFULENBQWtCLElBQUMsQ0FBQSxnQkFBbkIsRUFBcUMsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUEsR0FBQTtBQUNwRCxVQUFBLEtBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFULEdBQWlCLE1BQWpCLENBQUE7aUJBQ0EsSUFBQSxDQUFBLEVBRm9EO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckMsRUFMbkI7S0FEa0I7RUFBQSxDQXBRcEIsQ0FBQTs7QUFBQSx3QkErUUEsYUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsUUFBQSxJQUFBO0FBQUEsSUFBQSx3Q0FBYSxDQUFBLElBQUEsVUFBYjtBQUNFLE1BQUEsSUFBQyxDQUFBLGdCQUFnQixDQUFDLE1BQWxCLENBQXlCLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFsQyxDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixPQUZuQjtLQURhO0VBQUEsQ0EvUWYsQ0FBQTs7QUFBQSx3QkFxUkEsbUJBQUEsR0FBcUIsU0FBQSxHQUFBO0FBQ25CLFFBQUEsd0JBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxJQUFlLENBQUEsVUFBZjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxRQUFBLEdBQWUsSUFBQSxpQkFBQSxDQUFrQixJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBekIsQ0FGZixDQUFBO0FBR0E7V0FBTSxJQUFBLEdBQU8sUUFBUSxDQUFDLFdBQVQsQ0FBQSxDQUFiLEdBQUE7QUFDRSxNQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQWpCLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQXBCLENBREEsQ0FBQTtBQUFBLG9CQUVBLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixJQUF0QixFQUZBLENBREY7SUFBQSxDQUFBO29CQUptQjtFQUFBLENBclJyQixDQUFBOztBQUFBLHdCQStSQSxlQUFBLEdBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsUUFBQSxzQ0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUNBO0FBQUE7U0FBQSwyQ0FBQTt1QkFBQTtBQUNFLE1BQUEsSUFBNEIsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsS0FBaEIsQ0FBNUI7c0JBQUEsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsS0FBbEIsR0FBQTtPQUFBLE1BQUE7OEJBQUE7T0FERjtBQUFBO29CQUZlO0VBQUEsQ0EvUmpCLENBQUE7O0FBQUEsd0JBcVNBLGtCQUFBLEdBQW9CLFNBQUMsSUFBRCxHQUFBO0FBQ2xCLFFBQUEsZ0RBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFDQTtBQUFBO1NBQUEsMkNBQUE7MkJBQUE7QUFDRSxNQUFBLElBQUEsR0FBTyxTQUFTLENBQUMsSUFBakIsQ0FBQTtBQUNBLE1BQUEsSUFBMEIsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBMUI7c0JBQUEsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsR0FBQTtPQUFBLE1BQUE7OEJBQUE7T0FGRjtBQUFBO29CQUZrQjtFQUFBLENBclNwQixDQUFBOztBQUFBLHdCQTRTQSxvQkFBQSxHQUFzQixTQUFDLElBQUQsR0FBQTtBQUNwQixRQUFBLHlHQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsSUFDQSxvQkFBQSxHQUF1QixDQUFDLE9BQUQsRUFBVSxPQUFWLENBRHZCLENBQUE7QUFFQTtBQUFBO1NBQUEsMkNBQUE7MkJBQUE7QUFDRSxNQUFBLHFCQUFBLEdBQXdCLG9CQUFvQixDQUFDLE9BQXJCLENBQTZCLFNBQVMsQ0FBQyxJQUF2QyxDQUFBLElBQWdELENBQXhFLENBQUE7QUFBQSxNQUNBLGdCQUFBLEdBQW1CLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBaEIsQ0FBQSxDQUFBLEtBQTBCLEVBRDdDLENBQUE7QUFFQSxNQUFBLElBQUcscUJBQUEsSUFBMEIsZ0JBQTdCO3NCQUNFLEtBQUssQ0FBQyxVQUFOLENBQWlCLFNBQVMsQ0FBQyxJQUEzQixHQURGO09BQUEsTUFBQTs4QkFBQTtPQUhGO0FBQUE7b0JBSG9CO0VBQUEsQ0E1U3RCLENBQUE7O0FBQUEsd0JBc1RBLGdCQUFBLEdBQWtCLFNBQUMsTUFBRCxHQUFBO0FBQ2hCLElBQUEsSUFBVSxNQUFBLEtBQVUsSUFBQyxDQUFBLGVBQXJCO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxlQUFELEdBQW1CLE1BRm5CLENBQUE7QUFJQSxJQUFBLElBQUcsTUFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBQSxFQUZGO0tBTGdCO0VBQUEsQ0F0VGxCLENBQUE7O3FCQUFBOztJQVZGLENBQUE7Ozs7QUNBQSxJQUFBLHFDQUFBOztBQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUixDQUFYLENBQUE7O0FBQUEsSUFDQSxHQUFPLE9BQUEsQ0FBUSw2QkFBUixDQURQLENBQUE7O0FBQUEsZUFFQSxHQUFrQixPQUFBLENBQVEseUNBQVIsQ0FGbEIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsY0FBRSxXQUFGLEVBQWdCLE1BQWhCLEdBQUE7QUFDWCxJQURZLElBQUMsQ0FBQSxjQUFBLFdBQ2IsQ0FBQTtBQUFBLElBRDBCLElBQUMsQ0FBQSxTQUFBLE1BQzNCLENBQUE7O01BQUEsSUFBQyxDQUFBLFNBQVUsTUFBTSxDQUFDLFFBQVEsQ0FBQztLQUEzQjtBQUFBLElBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsS0FEakIsQ0FEVztFQUFBLENBQWI7O0FBQUEsaUJBY0EsTUFBQSxHQUFRLFNBQUMsT0FBRCxHQUFBO1dBQ04sSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsTUFBZixDQUFzQixDQUFDLElBQXZCLENBQTRCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLE1BQUQsRUFBUyxVQUFULEdBQUE7QUFDMUIsWUFBQSxRQUFBO0FBQUEsUUFBQSxRQUFBLEdBQVcsS0FBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLE9BQTlCLENBQVgsQ0FBQTtlQUVBO0FBQUEsVUFBQSxNQUFBLEVBQVEsTUFBUjtBQUFBLFVBQ0EsUUFBQSxFQUFVLFFBRFY7VUFIMEI7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QixFQURNO0VBQUEsQ0FkUixDQUFBOztBQUFBLGlCQXNCQSxZQUFBLEdBQWMsU0FBQyxNQUFELEdBQUE7QUFDWixRQUFBLGdCQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsQ0FBQyxDQUFDLFFBQUYsQ0FBQSxDQUFYLENBQUE7QUFBQSxJQUVBLE1BQUEsR0FBUyxNQUFNLENBQUMsYUFBYSxDQUFDLGFBQXJCLENBQW1DLFFBQW5DLENBRlQsQ0FBQTtBQUFBLElBR0EsTUFBTSxDQUFDLEdBQVAsR0FBYSxhQUhiLENBQUE7QUFBQSxJQUlBLE1BQU0sQ0FBQyxZQUFQLENBQW9CLGFBQXBCLEVBQW1DLEdBQW5DLENBSkEsQ0FBQTtBQUFBLElBS0EsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsU0FBQSxHQUFBO2FBQUcsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsTUFBakIsRUFBSDtJQUFBLENBTGhCLENBQUE7QUFBQSxJQU9BLE1BQU0sQ0FBQyxXQUFQLENBQW1CLE1BQW5CLENBUEEsQ0FBQTtXQVFBLFFBQVEsQ0FBQyxPQUFULENBQUEsRUFUWTtFQUFBLENBdEJkLENBQUE7O0FBQUEsaUJBa0NBLG9CQUFBLEdBQXNCLFNBQUMsTUFBRCxFQUFTLE9BQVQsR0FBQTtBQUNwQixRQUFBLGdCQUFBO0FBQUEsSUFBQSxNQUFBLEdBQ0U7QUFBQSxNQUFBLFVBQUEsRUFBWSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQW5DO0FBQUEsTUFDQSxVQUFBLEVBQVksTUFBTSxDQUFDLGFBRG5CO0FBQUEsTUFFQSxNQUFBLEVBQVEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUZyQjtLQURGLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLEVBQW9CLE9BQXBCLENBTFIsQ0FBQTtXQU1BLFFBQUEsR0FBZSxJQUFBLFFBQUEsQ0FDYjtBQUFBLE1BQUEsa0JBQUEsRUFBb0IsSUFBQyxDQUFBLElBQXJCO0FBQUEsTUFDQSxXQUFBLEVBQWEsSUFBQyxDQUFBLFdBRGQ7QUFBQSxNQUVBLFFBQUEsRUFBVSxPQUFPLENBQUMsUUFGbEI7S0FEYSxFQVBLO0VBQUEsQ0FsQ3RCLENBQUE7O0FBQUEsaUJBK0NBLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxJQUFULEdBQUE7QUFDVixRQUFBLDJCQUFBO0FBQUEsMEJBRG1CLE9BQTBCLElBQXhCLG1CQUFBLGFBQWEsZ0JBQUEsUUFDbEMsQ0FBQTtBQUFBLElBQUEsSUFBRyxtQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBakIsQ0FBQTthQUNJLElBQUEsZUFBQSxDQUFnQixNQUFoQixFQUZOO0tBQUEsTUFBQTthQUlNLElBQUEsSUFBQSxDQUFLLE1BQUwsRUFKTjtLQURVO0VBQUEsQ0EvQ1osQ0FBQTs7Y0FBQTs7SUFORixDQUFBOzs7O0FDQUEsSUFBQSxvQkFBQTs7QUFBQSxTQUFBLEdBQVksT0FBQSxDQUFRLHNCQUFSLENBQVosQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsbUJBQUUsTUFBRixHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsU0FBQSxNQUNiLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQURXO0VBQUEsQ0FBYjs7QUFBQSxzQkFJQSxJQUFBLEdBQU0sU0FBQyxJQUFELEVBQU8sUUFBUCxHQUFBO0FBQ0osUUFBQSx3QkFBQTs7TUFEVyxXQUFTLENBQUMsQ0FBQztLQUN0QjtBQUFBLElBQUEsSUFBQSxDQUFBLENBQXNCLENBQUMsT0FBRixDQUFVLElBQVYsQ0FBckI7QUFBQSxNQUFBLElBQUEsR0FBTyxDQUFDLElBQUQsQ0FBUCxDQUFBO0tBQUE7QUFBQSxJQUNBLFNBQUEsR0FBZ0IsSUFBQSxTQUFBLENBQUEsQ0FEaEIsQ0FBQTtBQUFBLElBRUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsUUFBdEIsQ0FGQSxDQUFBO0FBR0EsU0FBQSwyQ0FBQTtxQkFBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLEVBQW9CLFNBQVMsQ0FBQyxJQUFWLENBQUEsQ0FBcEIsQ0FBQSxDQUFBO0FBQUEsS0FIQTtXQUlBLFNBQVMsQ0FBQyxLQUFWLENBQUEsRUFMSTtFQUFBLENBSk4sQ0FBQTs7QUFBQSxzQkFhQSxhQUFBLEdBQWUsU0FBQyxHQUFELEVBQU0sUUFBTixHQUFBO0FBQ2IsUUFBQSxJQUFBOztNQURtQixXQUFTLENBQUMsQ0FBQztLQUM5QjtBQUFBLElBQUEsSUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLEdBQWIsQ0FBSDthQUNFLFFBQUEsQ0FBQSxFQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQSxHQUFPLENBQUEsQ0FBRSwyQ0FBRixDQUErQyxDQUFBLENBQUEsQ0FBdEQsQ0FBQTtBQUFBLE1BQ0EsSUFBSSxDQUFDLE1BQUwsR0FBYyxRQURkLENBQUE7QUFBQSxNQUVBLElBQUksQ0FBQyxJQUFMLEdBQVksR0FGWixDQUFBO0FBQUEsTUFHQSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBdEIsQ0FBa0MsSUFBbEMsQ0FIQSxDQUFBO2FBSUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsR0FBakIsRUFQRjtLQURhO0VBQUEsQ0FiZixDQUFBOztBQUFBLHNCQXlCQSxXQUFBLEdBQWEsU0FBQyxHQUFELEdBQUE7V0FDWCxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBb0IsR0FBcEIsQ0FBQSxJQUE0QixFQURqQjtFQUFBLENBekJiLENBQUE7O0FBQUEsc0JBOEJBLGVBQUEsR0FBaUIsU0FBQyxHQUFELEdBQUE7V0FDZixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsR0FBakIsRUFEZTtFQUFBLENBOUJqQixDQUFBOzttQkFBQTs7SUFKRixDQUFBOzs7O0FDQUEsSUFBQSw4Q0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxHQUNBLEdBQU0sTUFBTSxDQUFDLEdBRGIsQ0FBQTs7QUFBQSxRQUVBLEdBQVcsT0FBQSxDQUFRLDBCQUFSLENBRlgsQ0FBQTs7QUFBQSxXQUdBLEdBQWMsT0FBQSxDQUFRLDZCQUFSLENBSGQsQ0FBQTs7QUFBQSxNQUtNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsb0JBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFBLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FEaEIsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLGtCQUFELEdBQ0U7QUFBQSxNQUFBLFVBQUEsRUFBWSxTQUFBLEdBQUEsQ0FBWjtBQUFBLE1BQ0EsV0FBQSxFQUFhLFNBQUEsR0FBQSxDQURiO0tBTEYsQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLGlCQUFELEdBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxTQUFBLEdBQUEsQ0FBTjtLQVJGLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixTQUFBLEdBQUEsQ0FUdEIsQ0FEVztFQUFBLENBQWI7O0FBQUEsdUJBYUEsU0FBQSxHQUFXLFNBQUMsSUFBRCxHQUFBO0FBQ1QsUUFBQSxxREFBQTtBQUFBLElBRFksb0JBQUEsY0FBYyxtQkFBQSxhQUFhLGFBQUEsT0FBTyxjQUFBLE1BQzlDLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxDQUFjLFlBQUEsSUFBZ0IsV0FBOUIsQ0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQ0EsSUFBQSxJQUFvQyxXQUFwQztBQUFBLE1BQUEsWUFBQSxHQUFlLFdBQVcsQ0FBQyxLQUEzQixDQUFBO0tBREE7QUFBQSxJQUdBLFdBQUEsR0FBa0IsSUFBQSxXQUFBLENBQ2hCO0FBQUEsTUFBQSxZQUFBLEVBQWMsWUFBZDtBQUFBLE1BQ0EsV0FBQSxFQUFhLFdBRGI7S0FEZ0IsQ0FIbEIsQ0FBQTs7TUFPQSxTQUNFO0FBQUEsUUFBQSxTQUFBLEVBQ0U7QUFBQSxVQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsVUFDQSxLQUFBLEVBQU8sR0FEUDtBQUFBLFVBRUEsU0FBQSxFQUFXLENBRlg7U0FERjs7S0FSRjtXQWFBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLFdBQWYsRUFBNEIsS0FBNUIsRUFBbUMsTUFBbkMsRUFkUztFQUFBLENBYlgsQ0FBQTs7QUFBQSx1QkE4QkEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNULElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQURwQixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhLENBQUEsQ0FBRSxJQUFDLENBQUEsUUFBSCxDQUZiLENBQUE7V0FHQSxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsQ0FBRSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVosRUFKQTtFQUFBLENBOUJYLENBQUE7O29CQUFBOztJQVBGLENBQUE7Ozs7QUNBQSxJQUFBLG9GQUFBO0VBQUE7aVNBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsSUFDQSxHQUFPLE9BQUEsQ0FBUSxRQUFSLENBRFAsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sT0FBQSxDQUFRLG9CQUFSLENBRk4sQ0FBQTs7QUFBQSxLQUdBLEdBQVEsT0FBQSxDQUFRLHNCQUFSLENBSFIsQ0FBQTs7QUFBQSxrQkFJQSxHQUFxQixPQUFBLENBQVEsb0NBQVIsQ0FKckIsQ0FBQTs7QUFBQSxRQUtBLEdBQVcsT0FBQSxDQUFRLDBCQUFSLENBTFgsQ0FBQTs7QUFBQSxXQU1BLEdBQWMsT0FBQSxDQUFRLDZCQUFSLENBTmQsQ0FBQTs7QUFBQSxNQVVNLENBQUMsT0FBUCxHQUF1QjtBQUVyQixNQUFBLGlCQUFBOztBQUFBLG9DQUFBLENBQUE7O0FBQUEsRUFBQSxpQkFBQSxHQUFvQixDQUFwQixDQUFBOztBQUFBLDRCQUVBLFVBQUEsR0FBWSxLQUZaLENBQUE7O0FBS2EsRUFBQSx5QkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLDRCQUFBO0FBQUEsMEJBRFksT0FBMkIsSUFBekIsa0JBQUEsWUFBWSxrQkFBQSxVQUMxQixDQUFBO0FBQUEsSUFBQSxrREFBQSxTQUFBLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUEsQ0FBQSxDQUZiLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxrQkFBRCxHQUEwQixJQUFBLGtCQUFBLENBQW1CLElBQW5CLENBSDFCLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQU5kLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFDLENBQUMsU0FBRixDQUFBLENBUHBCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixDQUFDLENBQUMsU0FBRixDQUFBLENBUnhCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixDQUFDLENBQUMsU0FBRixDQUFBLENBVHJCLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FWaEIsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBcEIsQ0FBeUIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsbUJBQVQsRUFBOEIsSUFBOUIsQ0FBekIsQ0FYQSxDQUFBO0FBQUEsSUFZQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFuQixDQUF3QixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxtQkFBVCxFQUE4QixJQUE5QixDQUF4QixDQVpBLENBQUE7QUFBQSxJQWFBLElBQUMsQ0FBQSwwQkFBRCxDQUFBLENBYkEsQ0FBQTtBQUFBLElBZUEsSUFBQyxDQUFBLFNBQ0MsQ0FBQyxFQURILENBQ00sa0JBRE4sRUFDMEIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsS0FBVCxFQUFnQixJQUFoQixDQUQxQixDQUVFLENBQUMsRUFGSCxDQUVNLHNCQUZOLEVBRThCLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLFNBQVQsRUFBb0IsSUFBcEIsQ0FGOUIsQ0FHRSxDQUFDLEVBSEgsQ0FHTSx1QkFITixFQUcrQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxTQUFULEVBQW9CLElBQXBCLENBSC9CLENBSUUsQ0FBQyxFQUpILENBSU0sV0FKTixFQUltQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxnQkFBVCxFQUEyQixJQUEzQixDQUpuQixDQWZBLENBRFc7RUFBQSxDQUxiOztBQUFBLDRCQTRCQSwwQkFBQSxHQUE0QixTQUFBLEdBQUE7QUFDMUIsSUFBQSxJQUFHLGdDQUFIO2FBQ0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUFYLENBQWdCLE1BQU0sQ0FBQyxpQkFBdkIsRUFBMEMsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFBLENBQTFDLEVBREY7S0FEMEI7RUFBQSxDQTVCNUIsQ0FBQTs7QUFBQSw0QkFrQ0EsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFBLENBQUEsQ0FBQTtXQUNBLEtBQUssQ0FBQyxlQUFOLENBQUEsRUFGZ0I7RUFBQSxDQWxDbEIsQ0FBQTs7QUFBQSw0QkF1Q0EsZUFBQSxHQUFpQixTQUFBLEdBQUE7QUFDZixJQUFBLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLGFBQWYsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsa0JBQWYsRUFGZTtFQUFBLENBdkNqQixDQUFBOztBQUFBLDRCQTRDQSxTQUFBLEdBQVcsU0FBQyxLQUFELEdBQUE7QUFDVCxRQUFBLFdBQUE7QUFBQSxJQUFBLElBQVUsS0FBSyxDQUFDLEtBQU4sS0FBZSxpQkFBZixJQUFvQyxLQUFLLENBQUMsSUFBTixLQUFjLFdBQTVEO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLFdBQUEsR0FBYyxHQUFHLENBQUMsZUFBSixDQUFvQixLQUFLLENBQUMsTUFBMUIsQ0FEZCxDQUFBO0FBRUEsSUFBQSxJQUFBLENBQUEsV0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUZBO1dBSUEsSUFBQyxDQUFBLFNBQUQsQ0FDRTtBQUFBLE1BQUEsV0FBQSxFQUFhLFdBQWI7QUFBQSxNQUNBLEtBQUEsRUFBTyxLQURQO0tBREYsRUFMUztFQUFBLENBNUNYLENBQUE7O0FBQUEsNEJBc0RBLFNBQUEsR0FBVyxTQUFDLElBQUQsR0FBQTtBQUNULFFBQUEscURBQUE7QUFBQSxJQURZLG9CQUFBLGNBQWMsbUJBQUEsYUFBYSxhQUFBLE9BQU8sY0FBQSxNQUM5QyxDQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsQ0FBYyxZQUFBLElBQWdCLFdBQTlCLENBQUE7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUNBLElBQUEsSUFBb0MsV0FBcEM7QUFBQSxNQUFBLFlBQUEsR0FBZSxXQUFXLENBQUMsS0FBM0IsQ0FBQTtLQURBO0FBQUEsSUFHQSxXQUFBLEdBQWtCLElBQUEsV0FBQSxDQUNoQjtBQUFBLE1BQUEsWUFBQSxFQUFjLFlBQWQ7QUFBQSxNQUNBLFdBQUEsRUFBYSxXQURiO0tBRGdCLENBSGxCLENBQUE7O01BT0EsU0FDRTtBQUFBLFFBQUEsU0FBQSxFQUNFO0FBQUEsVUFBQSxhQUFBLEVBQWUsSUFBZjtBQUFBLFVBQ0EsS0FBQSxFQUFPLEdBRFA7QUFBQSxVQUVBLFNBQUEsRUFBVyxDQUZYO1NBREY7O0tBUkY7V0FhQSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxXQUFmLEVBQTRCLEtBQTVCLEVBQW1DLE1BQW5DLEVBZFM7RUFBQSxDQXREWCxDQUFBOztBQUFBLDRCQXVFQSxLQUFBLEdBQU8sU0FBQyxLQUFELEdBQUE7QUFDTCxRQUFBLHdCQUFBO0FBQUEsSUFBQSxXQUFBLEdBQWMsR0FBRyxDQUFDLGVBQUosQ0FBb0IsS0FBSyxDQUFDLE1BQTFCLENBQWQsQ0FBQTtBQUFBLElBQ0EsV0FBQSxHQUFjLEdBQUcsQ0FBQyxlQUFKLENBQW9CLEtBQUssQ0FBQyxNQUExQixDQURkLENBQUE7QUFjQSxJQUFBLElBQUcsV0FBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxjQUFQLENBQXNCLFdBQXRCLENBQUEsQ0FBQTtBQUVBLE1BQUEsSUFBRyxXQUFIO0FBQ0UsZ0JBQU8sV0FBVyxDQUFDLFdBQW5CO0FBQUEsZUFDTyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUQvQjttQkFFSSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsV0FBakIsRUFBOEIsV0FBVyxDQUFDLFFBQTFDLEVBQW9ELEtBQXBELEVBRko7QUFBQSxlQUdPLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBSDlCO21CQUlJLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxJQUFsQixDQUF1QixXQUF2QixFQUFvQyxXQUFXLENBQUMsUUFBaEQsRUFBMEQsS0FBMUQsRUFKSjtBQUFBLFNBREY7T0FIRjtLQUFBLE1BQUE7YUFVRSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxFQVZGO0tBZks7RUFBQSxDQXZFUCxDQUFBOztBQUFBLDRCQW1HQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7V0FDakIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQURDO0VBQUEsQ0FuR25CLENBQUE7O0FBQUEsNEJBdUdBLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTtBQUNsQixRQUFBLGNBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUCxDQUFnQixNQUFoQixDQUFBLENBQUE7QUFBQSxJQUNBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FEakIsQ0FBQTtBQUVBLElBQUEsSUFBNEIsY0FBNUI7YUFBQSxDQUFBLENBQUUsY0FBRixDQUFpQixDQUFDLElBQWxCLENBQUEsRUFBQTtLQUhrQjtFQUFBLENBdkdwQixDQUFBOztBQUFBLDRCQTZHQSxzQkFBQSxHQUF3QixTQUFDLFdBQUQsR0FBQTtXQUN0QixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsV0FBckIsRUFEc0I7RUFBQSxDQTdHeEIsQ0FBQTs7QUFBQSw0QkFpSEEsbUJBQUEsR0FBcUIsU0FBQyxXQUFELEdBQUE7QUFDbkIsUUFBQSx3QkFBQTtBQUFBLElBQUEsSUFBRyxXQUFXLENBQUMsVUFBVSxDQUFDLFFBQTFCO0FBQ0UsTUFBQSxhQUFBOztBQUFnQjtBQUFBO2FBQUEsMkNBQUE7K0JBQUE7QUFDZCx3QkFBQSxTQUFTLENBQUMsS0FBVixDQURjO0FBQUE7O1VBQWhCLENBQUE7YUFHQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsR0FBcEIsQ0FBd0IsYUFBeEIsRUFKRjtLQURtQjtFQUFBLENBakhyQixDQUFBOztBQUFBLDRCQXlIQSxtQkFBQSxHQUFxQixTQUFDLFdBQUQsR0FBQTtXQUNuQixXQUFXLENBQUMsWUFBWixDQUFBLEVBRG1CO0VBQUEsQ0F6SHJCLENBQUE7O0FBQUEsNEJBNkhBLG1CQUFBLEdBQXFCLFNBQUMsV0FBRCxHQUFBO1dBQ25CLFdBQVcsQ0FBQyxZQUFaLENBQUEsRUFEbUI7RUFBQSxDQTdIckIsQ0FBQTs7eUJBQUE7O0dBRjZDLEtBVi9DLENBQUE7Ozs7QUNBQSxJQUFBLDJDQUFBO0VBQUE7O2lTQUFBOztBQUFBLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx1QkFBUixDQUFyQixDQUFBOztBQUFBLFNBQ0EsR0FBWSxPQUFBLENBQVEsY0FBUixDQURaLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUZULENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FBdUI7QUFFckIseUJBQUEsQ0FBQTs7QUFBYSxFQUFBLGNBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxzQ0FBQTtBQUFBLDBCQURZLE9BQTRELElBQTFELGtCQUFBLFlBQVksZ0JBQUEsVUFBVSxrQkFBQSxZQUFZLElBQUMsQ0FBQSxjQUFBLFFBQVEsSUFBQyxDQUFBLG1CQUFBLFdBQzFELENBQUE7QUFBQSw2REFBQSxDQUFBO0FBQUEsSUFBQSxJQUEwQixnQkFBMUI7QUFBQSxNQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsUUFBZCxDQUFBO0tBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxTQUFELENBQVcsVUFBWCxDQURBLENBQUE7QUFBQSxJQUdBLG9DQUFBLENBSEEsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLGFBQUQsQ0FBZSxVQUFmLENBTEEsQ0FBQTtBQUFBLElBT0EsQ0FBQSxDQUFFLElBQUMsQ0FBQSxVQUFILENBQWMsQ0FBQyxJQUFmLENBQW9CLGFBQXBCLEVBQW1DLElBQUMsQ0FBQSxXQUFwQyxDQVBBLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxTQUFELEdBQWlCLElBQUEsU0FBQSxDQUFVLElBQUMsQ0FBQSxNQUFYLENBUmpCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FUQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSxpQkFhQSxhQUFBLEdBQWUsU0FBQyxVQUFELEdBQUE7O01BQ2IsYUFBYyxDQUFBLENBQUcsR0FBQSxHQUFwQixNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU0sRUFBOEIsSUFBQyxDQUFBLEtBQS9CO0tBQWQ7QUFDQSxJQUFBLElBQUcsVUFBVSxDQUFDLE1BQWQ7YUFDRSxJQUFDLENBQUEsVUFBRCxHQUFjLFVBQVcsQ0FBQSxDQUFBLEVBRDNCO0tBQUEsTUFBQTthQUdFLElBQUMsQ0FBQSxVQUFELEdBQWMsV0FIaEI7S0FGYTtFQUFBLENBYmYsQ0FBQTs7QUFBQSxpQkFxQkEsV0FBQSxHQUFhLFNBQUEsR0FBQTtBQUVYLElBQUEsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFBLENBQUEsQ0FBQTtXQUNBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ1QsS0FBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLEVBRFM7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLEVBRUUsQ0FGRixFQUhXO0VBQUEsQ0FyQmIsQ0FBQTs7QUFBQSxpQkE2QkEsZUFBQSxHQUFpQixTQUFBLEdBQUE7QUFDZixRQUFBLDZCQUFBO0FBQUEsSUFBQSxJQUFHLHFCQUFBLElBQVksTUFBTSxDQUFDLGFBQXRCO0FBQ0UsTUFBQSxVQUFBLEdBQWEsRUFBQSxHQUFsQixNQUFNLENBQUMsVUFBVyxHQUF1QixHQUF2QixHQUFsQixJQUFDLENBQUEsTUFBTSxDQUFDLFNBQUgsQ0FBQTtBQUFBLE1BQ0EsV0FBQSxHQUFpQix1QkFBSCxHQUNaLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FESSxHQUdaLGdCQUpGLENBQUE7QUFBQSxNQU1BLElBQUEsR0FBTyxFQUFBLEdBQVosVUFBWSxHQUFaLFdBTkssQ0FBQTthQU9BLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFzQixJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQUEsQ0FBdEIsRUFSRjtLQURlO0VBQUEsQ0E3QmpCLENBQUE7O0FBQUEsaUJBeUNBLFNBQUEsR0FBVyxTQUFDLFVBQUQsR0FBQTtBQUNULElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxVQUFBLElBQWMsTUFBeEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBRHBCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBQSxDQUFFLElBQUMsQ0FBQSxRQUFILENBRmIsQ0FBQTtXQUdBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQSxDQUFFLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBWixFQUpBO0VBQUEsQ0F6Q1gsQ0FBQTs7Y0FBQTs7R0FGa0MsbUJBUHBDLENBQUE7Ozs7QUNBQSxJQUFBLDZCQUFBOztBQUFBLFNBQUEsR0FBWSxPQUFBLENBQVEsc0JBQVIsQ0FBWixDQUFBOztBQUFBLE1BV00sQ0FBQyxPQUFQLEdBQXVCO0FBRXJCLCtCQUFBLFVBQUEsR0FBWSxJQUFaLENBQUE7O0FBR2EsRUFBQSw0QkFBQSxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUEsQ0FBRSxRQUFGLENBQVksQ0FBQSxDQUFBLENBQTFCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxjQUFELEdBQXNCLElBQUEsU0FBQSxDQUFBLENBRHRCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FGQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsY0FBYyxDQUFDLEtBQWhCLENBQUEsQ0FIQSxDQURXO0VBQUEsQ0FIYjs7QUFBQSwrQkFVQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osQ0FBQSxDQUFFLElBQUMsQ0FBQSxVQUFILENBQWMsQ0FBQyxJQUFmLENBQUEsRUFESTtFQUFBLENBVk4sQ0FBQTs7QUFBQSwrQkFjQSxzQkFBQSxHQUF3QixTQUFDLFdBQUQsR0FBQSxDQWR4QixDQUFBOztBQUFBLCtCQW1CQSxXQUFBLEdBQWEsU0FBQSxHQUFBLENBbkJiLENBQUE7O0FBQUEsK0JBc0JBLEtBQUEsR0FBTyxTQUFDLFFBQUQsR0FBQTtXQUNMLElBQUMsQ0FBQSxjQUFjLENBQUMsV0FBaEIsQ0FBNEIsUUFBNUIsRUFESztFQUFBLENBdEJQLENBQUE7OzRCQUFBOztJQWJGLENBQUE7Ozs7QUNHQSxJQUFBLFlBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFJUixFQUFBLHNCQUFFLFFBQUYsR0FBQTtBQUNYLElBRFksSUFBQyxDQUFBLFdBQUEsUUFDYixDQUFBO0FBQUEsSUFBQSxJQUFzQixxQkFBdEI7QUFBQSxNQUFBLElBQUMsQ0FBQSxRQUFELEdBQVksRUFBWixDQUFBO0tBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBLENBREEsQ0FEVztFQUFBLENBQWI7O0FBQUEseUJBS0EsaUJBQUEsR0FBbUIsU0FBQSxHQUFBO0FBQ2pCLFFBQUEsNkJBQUE7QUFBQTtBQUFBLFNBQUEsMkRBQUE7MkJBQUE7QUFDRSxNQUFBLElBQUUsQ0FBQSxLQUFBLENBQUYsR0FBVyxNQUFYLENBREY7QUFBQSxLQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFIcEIsQ0FBQTtBQUlBLElBQUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQWI7QUFDRSxNQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBRSxDQUFBLENBQUEsQ0FBWCxDQUFBO2FBQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFFLENBQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEdBQW1CLENBQW5CLEVBRlo7S0FMaUI7RUFBQSxDQUxuQixDQUFBOztBQUFBLHlCQWVBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtBQUNKLFFBQUEsdUJBQUE7QUFBQTtBQUFBLFNBQUEsMkNBQUE7eUJBQUE7QUFDRSxNQUFBLFFBQUEsQ0FBUyxPQUFULENBQUEsQ0FERjtBQUFBLEtBQUE7V0FHQSxLQUpJO0VBQUEsQ0FmTixDQUFBOztBQUFBLHlCQXNCQSxNQUFBLEdBQVEsU0FBQSxHQUFBO0FBQ04sSUFBQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsT0FBRCxHQUFBO2FBQ0osT0FBTyxDQUFDLE1BQVIsQ0FBQSxFQURJO0lBQUEsQ0FBTixDQUFBLENBQUE7V0FHQSxLQUpNO0VBQUEsQ0F0QlIsQ0FBQTs7c0JBQUE7O0lBSkYsQ0FBQTs7OztBQ0hBLElBQUEsd0JBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsTUFhTSxDQUFDLE9BQVAsR0FBdUI7QUFHUixFQUFBLDBCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsTUFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHFCQUFBLGVBQWUsSUFBQyxDQUFBLFlBQUEsTUFBTSxjQUFBLE1BQ3JDLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxNQUFELEdBQVUsY0FBVixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUMsQ0FBQSxJQUFELEdBQVEsTUFEakIsQ0FEVztFQUFBLENBQWI7O0FBQUEsNkJBS0EsT0FBQSxHQUFTLFNBQUMsT0FBRCxHQUFBO0FBQ1AsSUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFKO0FBQ0UsTUFBQSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQUMsQ0FBQSxLQUFmLEVBQXNCLE9BQXRCLENBQUEsQ0FERjtLQUFBLE1BQUE7QUFHRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQWUsT0FBZixDQUFBLENBSEY7S0FBQTtXQUtBLEtBTk87RUFBQSxDQUxULENBQUE7O0FBQUEsNkJBY0EsTUFBQSxHQUFRLFNBQUMsT0FBRCxHQUFBO0FBQ04sSUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFKO0FBQ0UsTUFBQSxNQUFBLENBQU8sT0FBQSxLQUFhLElBQUMsQ0FBQSxhQUFyQixFQUFvQyxpQ0FBcEMsQ0FBQSxDQURGO0tBQUE7QUFHQSxJQUFBLElBQUcsSUFBQyxDQUFBLElBQUo7QUFDRSxNQUFBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLElBQWQsRUFBb0IsT0FBcEIsQ0FBQSxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxPQUFmLENBQUEsQ0FIRjtLQUhBO1dBUUEsS0FUTTtFQUFBLENBZFIsQ0FBQTs7QUFBQSw2QkEwQkEsWUFBQSxHQUFjLFNBQUMsT0FBRCxFQUFVLGVBQVYsR0FBQTtBQUNaLFFBQUEsUUFBQTtBQUFBLElBQUEsSUFBVSxPQUFPLENBQUMsUUFBUixLQUFvQixlQUE5QjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxNQUFBLENBQU8sT0FBQSxLQUFhLGVBQXBCLEVBQXFDLHFDQUFyQyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLE9BQU8sQ0FBQyxRQUFsQjtBQUFBLE1BQ0EsSUFBQSxFQUFNLE9BRE47QUFBQSxNQUVBLGVBQUEsRUFBaUIsT0FBTyxDQUFDLGVBRnpCO0tBSkYsQ0FBQTtXQVFBLElBQUMsQ0FBQSxhQUFELENBQWUsZUFBZixFQUFnQyxRQUFoQyxFQVRZO0VBQUEsQ0ExQmQsQ0FBQTs7QUFBQSw2QkFzQ0EsV0FBQSxHQUFhLFNBQUMsT0FBRCxFQUFVLGVBQVYsR0FBQTtBQUNYLFFBQUEsUUFBQTtBQUFBLElBQUEsSUFBVSxPQUFPLENBQUMsSUFBUixLQUFnQixlQUExQjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxNQUFBLENBQU8sT0FBQSxLQUFhLGVBQXBCLEVBQXFDLG9DQUFyQyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLE9BQVY7QUFBQSxNQUNBLElBQUEsRUFBTSxPQUFPLENBQUMsSUFEZDtBQUFBLE1BRUEsZUFBQSxFQUFpQixPQUFPLENBQUMsZUFGekI7S0FKRixDQUFBO1dBUUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxlQUFmLEVBQWdDLFFBQWhDLEVBVFc7RUFBQSxDQXRDYixDQUFBOztBQUFBLDZCQWtEQSxFQUFBLEdBQUksU0FBQyxPQUFELEdBQUE7QUFDRixJQUFBLElBQUcsd0JBQUg7YUFDRSxJQUFDLENBQUEsWUFBRCxDQUFjLE9BQU8sQ0FBQyxRQUF0QixFQUFnQyxPQUFoQyxFQURGO0tBREU7RUFBQSxDQWxESixDQUFBOztBQUFBLDZCQXVEQSxJQUFBLEdBQU0sU0FBQyxPQUFELEdBQUE7QUFDSixJQUFBLElBQUcsb0JBQUg7YUFDRSxJQUFDLENBQUEsV0FBRCxDQUFhLE9BQU8sQ0FBQyxJQUFyQixFQUEyQixPQUEzQixFQURGO0tBREk7RUFBQSxDQXZETixDQUFBOztBQUFBLDZCQTREQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtBQUNkLFFBQUEsSUFBQTtXQUFBLElBQUMsQ0FBQSxXQUFELCtDQUE4QixDQUFFLHNCQURsQjtFQUFBLENBNURoQixDQUFBOztBQUFBLDZCQWlFQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7QUFDSixRQUFBLGlCQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLEtBQVgsQ0FBQTtBQUNBO1dBQU8sT0FBUCxHQUFBO0FBQ0UsTUFBQSxPQUFPLENBQUMsa0JBQVIsQ0FBMkIsUUFBM0IsQ0FBQSxDQUFBO0FBQUEsb0JBQ0EsT0FBQSxHQUFVLE9BQU8sQ0FBQyxLQURsQixDQURGO0lBQUEsQ0FBQTtvQkFGSTtFQUFBLENBakVOLENBQUE7O0FBQUEsNkJBd0VBLGFBQUEsR0FBZSxTQUFDLFFBQUQsR0FBQTtBQUNiLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLE9BQUQsR0FBQTtBQUNKLFVBQUEsc0NBQUE7QUFBQTtBQUFBO1dBQUEsWUFBQTtzQ0FBQTtBQUNFLHNCQUFBLFFBQUEsQ0FBUyxnQkFBVCxFQUFBLENBREY7QUFBQTtzQkFESTtJQUFBLENBQU4sRUFGYTtFQUFBLENBeEVmLENBQUE7O0FBQUEsNkJBZ0ZBLEdBQUEsR0FBSyxTQUFDLFFBQUQsR0FBQTtBQUNILElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLE9BQUQsR0FBQTtBQUNKLFVBQUEsc0NBQUE7QUFBQSxNQUFBLFFBQUEsQ0FBUyxPQUFULENBQUEsQ0FBQTtBQUNBO0FBQUE7V0FBQSxZQUFBO3NDQUFBO0FBQ0Usc0JBQUEsUUFBQSxDQUFTLGdCQUFULEVBQUEsQ0FERjtBQUFBO3NCQUZJO0lBQUEsQ0FBTixFQUZHO0VBQUEsQ0FoRkwsQ0FBQTs7QUFBQSw2QkF3RkEsTUFBQSxHQUFRLFNBQUMsT0FBRCxHQUFBO0FBQ04sSUFBQSxPQUFPLENBQUMsT0FBUixDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxjQUFELENBQWdCLE9BQWhCLEVBRk07RUFBQSxDQXhGUixDQUFBOztBQUFBLDZCQTZGQSxFQUFBLEdBQUksU0FBQSxHQUFBO0FBQ0YsUUFBQSxXQUFBO0FBQUEsSUFBQSxJQUFHLENBQUEsSUFBSyxDQUFBLFVBQVI7QUFDRSxNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQWQsQ0FBQTtBQUFBLE1BQ0EsV0FBVyxDQUFDLFFBQVEsQ0FBQyx1QkFBckIsQ0FBNkMsSUFBN0MsQ0FEQSxDQURGO0tBQUE7V0FHQSxJQUFDLENBQUEsV0FKQztFQUFBLENBN0ZKLENBQUE7O0FBQUEsNkJBMkdBLGFBQUEsR0FBZSxTQUFDLE9BQUQsRUFBVSxRQUFWLEdBQUE7QUFDYixRQUFBLGlCQUFBOztNQUR1QixXQUFXO0tBQ2xDO0FBQUEsSUFBQSxJQUFBLEdBQU8sQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNMLEtBQUMsQ0FBQSxJQUFELENBQU0sT0FBTixFQUFlLFFBQWYsRUFESztNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVAsQ0FBQTtBQUdBLElBQUEsSUFBRyxXQUFBLEdBQWMsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFqQjthQUNFLFdBQVcsQ0FBQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxJQUF0QyxFQURGO0tBQUEsTUFBQTthQUdFLElBQUEsQ0FBQSxFQUhGO0tBSmE7RUFBQSxDQTNHZixDQUFBOztBQUFBLDZCQTZIQSxjQUFBLEdBQWdCLFNBQUMsT0FBRCxHQUFBO0FBQ2QsUUFBQSxpQkFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFBLEdBQUE7ZUFDTCxLQUFDLENBQUEsTUFBRCxDQUFRLE9BQVIsRUFESztNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVAsQ0FBQTtBQUdBLElBQUEsSUFBRyxXQUFBLEdBQWMsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFqQjthQUNFLFdBQVcsQ0FBQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxJQUF0QyxFQURGO0tBQUEsTUFBQTthQUdFLElBQUEsQ0FBQSxFQUhGO0tBSmM7RUFBQSxDQTdIaEIsQ0FBQTs7QUFBQSw2QkF3SUEsSUFBQSxHQUFNLFNBQUMsT0FBRCxFQUFVLFFBQVYsR0FBQTtBQUNKLElBQUEsSUFBb0IsT0FBTyxDQUFDLGVBQTVCO0FBQUEsTUFBQSxJQUFDLENBQUEsTUFBRCxDQUFRLE9BQVIsQ0FBQSxDQUFBO0tBQUE7QUFBQSxJQUVBLFFBQVEsQ0FBQyxvQkFBVCxRQUFRLENBQUMsa0JBQW9CLEtBRjdCLENBQUE7V0FHQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsT0FBcEIsRUFBNkIsUUFBN0IsRUFKSTtFQUFBLENBeElOLENBQUE7O0FBQUEsNkJBZ0pBLE1BQUEsR0FBUSxTQUFDLE9BQUQsR0FBQTtBQUNOLFFBQUEsc0JBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxPQUFPLENBQUMsZUFBcEIsQ0FBQTtBQUNBLElBQUEsSUFBRyxTQUFIO0FBR0UsTUFBQSxJQUFzQyx3QkFBdEM7QUFBQSxRQUFBLFNBQVMsQ0FBQyxLQUFWLEdBQWtCLE9BQU8sQ0FBQyxJQUExQixDQUFBO09BQUE7QUFDQSxNQUFBLElBQXlDLG9CQUF6QztBQUFBLFFBQUEsU0FBUyxDQUFDLElBQVYsR0FBaUIsT0FBTyxDQUFDLFFBQXpCLENBQUE7T0FEQTs7WUFJWSxDQUFFLFFBQWQsR0FBeUIsT0FBTyxDQUFDO09BSmpDOzthQUtnQixDQUFFLElBQWxCLEdBQXlCLE9BQU8sQ0FBQztPQUxqQzthQU9BLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixPQUFwQixFQUE2QixFQUE3QixFQVZGO0tBRk07RUFBQSxDQWhKUixDQUFBOztBQUFBLDZCQWdLQSxrQkFBQSxHQUFvQixTQUFDLE9BQUQsRUFBVSxJQUFWLEdBQUE7QUFDbEIsUUFBQSwrQkFBQTtBQUFBLElBRDhCLHVCQUFBLGlCQUFpQixnQkFBQSxVQUFVLFlBQUEsSUFDekQsQ0FBQTtBQUFBLElBQUEsT0FBTyxDQUFDLGVBQVIsR0FBMEIsZUFBMUIsQ0FBQTtBQUFBLElBQ0EsT0FBTyxDQUFDLFFBQVIsR0FBbUIsUUFEbkIsQ0FBQTtBQUFBLElBRUEsT0FBTyxDQUFDLElBQVIsR0FBZSxJQUZmLENBQUE7QUFJQSxJQUFBLElBQUcsZUFBSDtBQUNFLE1BQUEsSUFBMkIsUUFBM0I7QUFBQSxRQUFBLFFBQVEsQ0FBQyxJQUFULEdBQWdCLE9BQWhCLENBQUE7T0FBQTtBQUNBLE1BQUEsSUFBMkIsSUFBM0I7QUFBQSxRQUFBLElBQUksQ0FBQyxRQUFMLEdBQWdCLE9BQWhCLENBQUE7T0FEQTtBQUVBLE1BQUEsSUFBdUMsd0JBQXZDO0FBQUEsUUFBQSxlQUFlLENBQUMsS0FBaEIsR0FBd0IsT0FBeEIsQ0FBQTtPQUZBO0FBR0EsTUFBQSxJQUFzQyxvQkFBdEM7ZUFBQSxlQUFlLENBQUMsSUFBaEIsR0FBdUIsUUFBdkI7T0FKRjtLQUxrQjtFQUFBLENBaEtwQixDQUFBOzswQkFBQTs7SUFoQkYsQ0FBQTs7OztBQ0FBLElBQUEsbUZBQUE7O0FBQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxZQUFSLENBQVosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxnQkFFQSxHQUFtQixPQUFBLENBQVEscUJBQVIsQ0FGbkIsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sT0FBQSxDQUFRLGlCQUFSLENBSFAsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBSk4sQ0FBQTs7QUFBQSxNQUtBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBTFQsQ0FBQTs7QUFBQSxhQU1BLEdBQWdCLE9BQUEsQ0FBUSwwQkFBUixDQU5oQixDQUFBOztBQUFBLE1BT0EsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FQVCxDQUFBOztBQUFBLE1BdUJNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsc0JBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxRQUFBO0FBQUEsMEJBRFksT0FBb0IsSUFBbEIsSUFBQyxDQUFBLGdCQUFBLFVBQVUsVUFBQSxFQUN6QixDQUFBO0FBQUEsSUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLFFBQVIsRUFBa0IsdURBQWxCLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLG9CQUFELENBQUEsQ0FGQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLEVBSFYsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUpkLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixFQUxwQixDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsRUFBRCxHQUFNLEVBQUEsSUFBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBTlosQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsUUFBUSxDQUFDLFVBUHhCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxJQUFELEdBQVEsTUFUUixDQUFBO0FBQUEsSUFVQSxJQUFDLENBQUEsUUFBRCxHQUFZLE1BVlosQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQVhmLENBRFc7RUFBQSxDQUFiOztBQUFBLHlCQWVBLG9CQUFBLEdBQXNCLFNBQUEsR0FBQTtBQUNwQixRQUFBLG1DQUFBO0FBQUE7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0UsY0FBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxhQUNPLFdBRFA7QUFFSSxVQUFBLElBQUMsQ0FBQSxlQUFELElBQUMsQ0FBQSxhQUFlLEdBQWhCLENBQUE7QUFBQSx3QkFDQSxJQUFDLENBQUEsVUFBVyxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQVosR0FBa0MsSUFBQSxnQkFBQSxDQUNoQztBQUFBLFlBQUEsSUFBQSxFQUFNLFNBQVMsQ0FBQyxJQUFoQjtBQUFBLFlBQ0EsYUFBQSxFQUFlLElBRGY7V0FEZ0MsRUFEbEMsQ0FGSjtBQUNPO0FBRFAsYUFNTyxVQU5QO0FBQUEsYUFNbUIsT0FObkI7QUFBQSxhQU00QixNQU41QjtBQU9JLFVBQUEsSUFBQyxDQUFBLFlBQUQsSUFBQyxDQUFBLFVBQVksR0FBYixDQUFBO0FBQUEsd0JBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFULEdBQTJCLE9BRDNCLENBUEo7QUFNNEI7QUFONUI7QUFVSSx3QkFBQSxHQUFHLENBQUMsS0FBSixDQUFXLDJCQUFBLEdBQXBCLFNBQVMsQ0FBQyxJQUFVLEdBQTRDLG1DQUF2RCxFQUFBLENBVko7QUFBQSxPQURGO0FBQUE7b0JBRG9CO0VBQUEsQ0FmdEIsQ0FBQTs7QUFBQSx5QkE4QkEsVUFBQSxHQUFZLFNBQUMsVUFBRCxHQUFBO1dBQ1YsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLElBQXJCLEVBQTJCLFVBQTNCLEVBRFU7RUFBQSxDQTlCWixDQUFBOztBQUFBLHlCQWtDQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBckIsQ0FBMkIsV0FBM0IsQ0FBQSxHQUEwQyxFQUQ3QjtFQUFBLENBbENmLENBQUE7O0FBQUEseUJBc0NBLFlBQUEsR0FBYyxTQUFBLEdBQUE7V0FDWixJQUFDLENBQUEsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFyQixDQUEyQixVQUEzQixDQUFBLEdBQXlDLEVBRDdCO0VBQUEsQ0F0Q2QsQ0FBQTs7QUFBQSx5QkEwQ0EsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQXJCLENBQTJCLE1BQTNCLENBQUEsR0FBcUMsRUFEOUI7RUFBQSxDQTFDVCxDQUFBOztBQUFBLHlCQThDQSxTQUFBLEdBQVcsU0FBQSxHQUFBO1dBQ1QsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBckIsQ0FBMkIsT0FBM0IsQ0FBQSxHQUFzQyxFQUQ3QjtFQUFBLENBOUNYLENBQUE7O0FBQUEseUJBa0RBLE1BQUEsR0FBUSxTQUFDLFlBQUQsR0FBQTtBQUNOLElBQUEsSUFBRyxZQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLFlBQWpCLENBQThCLElBQTlCLEVBQW9DLFlBQXBDLENBQUEsQ0FBQTthQUNBLEtBRkY7S0FBQSxNQUFBO2FBSUUsSUFBQyxDQUFBLFNBSkg7S0FETTtFQUFBLENBbERSLENBQUE7O0FBQUEseUJBMERBLEtBQUEsR0FBTyxTQUFDLFlBQUQsR0FBQTtBQUNMLElBQUEsSUFBRyxZQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLFdBQWpCLENBQTZCLElBQTdCLEVBQW1DLFlBQW5DLENBQUEsQ0FBQTthQUNBLEtBRkY7S0FBQSxNQUFBO2FBSUUsSUFBQyxDQUFBLEtBSkg7S0FESztFQUFBLENBMURQLENBQUE7O0FBQUEseUJBa0VBLE1BQUEsR0FBUSxTQUFDLGFBQUQsRUFBZ0IsWUFBaEIsR0FBQTtBQUNOLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixLQUFvQixDQUF2QjtBQUNFLE1BQUEsWUFBQSxHQUFlLGFBQWYsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxXQUQ1QyxDQURGO0tBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFXLENBQUEsYUFBQSxDQUFjLENBQUMsTUFBM0IsQ0FBa0MsWUFBbEMsQ0FKQSxDQUFBO1dBS0EsS0FOTTtFQUFBLENBbEVSLENBQUE7O0FBQUEseUJBMkVBLE9BQUEsR0FBUyxTQUFDLGFBQUQsRUFBZ0IsWUFBaEIsR0FBQTtBQUNQLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixLQUFvQixDQUF2QjtBQUNFLE1BQUEsWUFBQSxHQUFlLGFBQWYsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxXQUQ1QyxDQURGO0tBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFXLENBQUEsYUFBQSxDQUFjLENBQUMsT0FBM0IsQ0FBbUMsWUFBbkMsQ0FKQSxDQUFBO1dBS0EsS0FOTztFQUFBLENBM0VULENBQUE7O0FBQUEseUJBb0ZBLGtCQUFBLEdBQW9CLFNBQUMsSUFBRCxHQUFBO1dBQ2xCLE1BQUEsQ0FBQSxJQUFRLENBQUEsZ0JBQWlCLENBQUEsSUFBQSxFQURQO0VBQUEsQ0FwRnBCLENBQUE7O0FBQUEseUJBd0ZBLEdBQUEsR0FBSyxTQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsUUFBZCxHQUFBO0FBQ0gsUUFBQSxzQkFBQTs7TUFEaUIsV0FBUztLQUMxQjtBQUFBLElBQUEsTUFBQSxxQ0FBZSxDQUFFLGNBQVYsQ0FBeUIsSUFBekIsVUFBUCxFQUNHLGFBQUEsR0FBTixJQUFDLENBQUEsVUFBSyxHQUEyQix3QkFBM0IsR0FBTixJQURHLENBQUEsQ0FBQTtBQUdBLElBQUEsSUFBRyxRQUFIO0FBQ0UsTUFBQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsZ0JBQXBCLENBREY7S0FBQSxNQUFBO0FBR0UsTUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsT0FEcEIsQ0FIRjtLQUhBO0FBU0EsSUFBQSxJQUFHLGdCQUFpQixDQUFBLElBQUEsQ0FBakIsS0FBMEIsS0FBN0I7QUFDRSxNQUFBLGdCQUFpQixDQUFBLElBQUEsQ0FBakIsR0FBeUIsS0FBekIsQ0FBQTtBQUNBLE1BQUEsSUFBNEMsSUFBQyxDQUFBLFdBQTdDO2VBQUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxlQUFiLENBQTZCLElBQTdCLEVBQW1DLElBQW5DLEVBQUE7T0FGRjtLQVZHO0VBQUEsQ0F4RkwsQ0FBQTs7QUFBQSx5QkF1R0EsR0FBQSxHQUFLLFNBQUMsSUFBRCxHQUFBO0FBQ0gsUUFBQSxJQUFBO0FBQUEsSUFBQSxNQUFBLHFDQUFlLENBQUUsY0FBVixDQUF5QixJQUF6QixVQUFQLEVBQ0csYUFBQSxHQUFOLElBQUMsQ0FBQSxVQUFLLEdBQTJCLHdCQUEzQixHQUFOLElBREcsQ0FBQSxDQUFBO1dBR0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLEVBSk47RUFBQSxDQXZHTCxDQUFBOztBQUFBLHlCQStHQSxJQUFBLEdBQU0sU0FBQyxHQUFELEdBQUE7QUFDSixRQUFBLGtDQUFBO0FBQUEsSUFBQSxJQUFHLE1BQUEsQ0FBQSxHQUFBLEtBQWUsUUFBbEI7QUFDRSxNQUFBLHFCQUFBLEdBQXdCLEVBQXhCLENBQUE7QUFDQSxXQUFBLFdBQUE7MEJBQUE7QUFDRSxRQUFBLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLEtBQWxCLENBQUg7QUFDRSxVQUFBLHFCQUFxQixDQUFDLElBQXRCLENBQTJCLElBQTNCLENBQUEsQ0FERjtTQURGO0FBQUEsT0FEQTtBQUlBLE1BQUEsSUFBRyxJQUFDLENBQUEsV0FBRCxJQUFnQixxQkFBcUIsQ0FBQyxNQUF0QixHQUErQixDQUFsRDtlQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsWUFBYixDQUEwQixJQUExQixFQUFnQyxxQkFBaEMsRUFERjtPQUxGO0tBQUEsTUFBQTthQVFFLElBQUMsQ0FBQSxVQUFXLENBQUEsR0FBQSxFQVJkO0tBREk7RUFBQSxDQS9HTixDQUFBOztBQUFBLHlCQTJIQSxVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ1YsSUFBQSxJQUFHLFNBQUEsQ0FBVSxJQUFDLENBQUEsVUFBVyxDQUFBLElBQUEsQ0FBdEIsRUFBNkIsS0FBN0IsQ0FBQSxLQUF1QyxLQUExQztBQUNFLE1BQUEsSUFBQyxDQUFBLFVBQVcsQ0FBQSxJQUFBLENBQVosR0FBb0IsS0FBcEIsQ0FBQTthQUNBLEtBRkY7S0FBQSxNQUFBO2FBSUUsTUFKRjtLQURVO0VBQUEsQ0EzSFosQ0FBQTs7QUFBQSx5QkFtSUEsT0FBQSxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLENBQVIsQ0FBQTtXQUNBLEtBQUEsS0FBUyxNQUFULElBQXNCLEtBQUEsS0FBUyxHQUZ4QjtFQUFBLENBbklULENBQUE7O0FBQUEseUJBd0lBLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDTCxJQUFBLElBQUcsU0FBUyxDQUFDLE1BQVYsS0FBb0IsQ0FBdkI7YUFDRSxJQUFDLENBQUEsTUFBTyxDQUFBLElBQUEsRUFEVjtLQUFBLE1BQUE7YUFHRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFIRjtLQURLO0VBQUEsQ0F4SVAsQ0FBQTs7QUFBQSx5QkErSUEsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNSLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBTyxDQUFBLElBQUEsQ0FBekIsQ0FBQTtBQUNBLElBQUEsSUFBRyxDQUFBLEtBQUg7QUFDRSxNQUFBLEdBQUEsQ0FBSSxJQUFKLEVBQVUsS0FBVixFQUFpQixPQUFqQixDQUFBLENBQUE7YUFDQSxHQUFHLENBQUMsSUFBSixDQUFVLGlCQUFBLEdBQWYsSUFBZSxHQUF3QixvQkFBeEIsR0FBZixJQUFDLENBQUEsVUFBSSxFQUZGO0tBQUEsTUFHSyxJQUFHLENBQUEsS0FBUyxDQUFDLGFBQU4sQ0FBb0IsS0FBcEIsQ0FBUDthQUNILEdBQUcsQ0FBQyxJQUFKLENBQVUsaUJBQUEsR0FBZixLQUFlLEdBQXlCLGVBQXpCLEdBQWYsSUFBZSxHQUErQyxvQkFBL0MsR0FBZixJQUFDLENBQUEsVUFBSSxFQURHO0tBQUEsTUFBQTtBQUdILE1BQUEsSUFBRyxJQUFDLENBQUEsTUFBTyxDQUFBLElBQUEsQ0FBUixLQUFpQixLQUFwQjtBQUNFLFFBQUEsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFBLENBQVIsR0FBZ0IsS0FBaEIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxJQUFDLENBQUEsV0FBSjtpQkFDRSxJQUFDLENBQUEsV0FBVyxDQUFDLFlBQWIsQ0FBMEIsSUFBMUIsRUFBZ0MsT0FBaEMsRUFBeUM7QUFBQSxZQUFFLE1BQUEsSUFBRjtBQUFBLFlBQVEsT0FBQSxLQUFSO1dBQXpDLEVBREY7U0FGRjtPQUhHO0tBTEc7RUFBQSxDQS9JVixDQUFBOztBQUFBLHlCQTZKQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osR0FBRyxDQUFDLElBQUosQ0FBUyw2Q0FBVCxFQURJO0VBQUEsQ0E3Sk4sQ0FBQTs7QUFBQSx5QkFzS0Esa0JBQUEsR0FBb0IsU0FBQSxHQUFBO1dBQ2xCLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixDQUFBLEVBRGtCO0VBQUEsQ0F0S3BCLENBQUE7O0FBQUEseUJBMktBLEVBQUEsR0FBSSxTQUFBLEdBQUE7QUFDRixJQUFBLElBQUMsQ0FBQSxlQUFlLENBQUMsRUFBakIsQ0FBb0IsSUFBcEIsQ0FBQSxDQUFBO1dBQ0EsS0FGRTtFQUFBLENBM0tKLENBQUE7O0FBQUEseUJBaUxBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBQSxDQUFBO1dBQ0EsS0FGSTtFQUFBLENBakxOLENBQUE7O0FBQUEseUJBdUxBLE1BQUEsR0FBUSxTQUFBLEdBQUE7V0FDTixJQUFDLENBQUEsZUFBZSxDQUFDLE1BQWpCLENBQXdCLElBQXhCLEVBRE07RUFBQSxDQXZMUixDQUFBOztBQUFBLHlCQTRMQSxPQUFBLEdBQVMsU0FBQSxHQUFBO0FBSVAsSUFBQSxJQUF3QixJQUFDLENBQUEsVUFBekI7YUFBQSxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosQ0FBQSxFQUFBO0tBSk87RUFBQSxDQTVMVCxDQUFBOztBQUFBLHlCQW1NQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1IsUUFBQSxJQUFBO3VEQUFnQixDQUFFLHVCQURWO0VBQUEsQ0FuTVgsQ0FBQTs7QUFBQSx5QkF1TUEsRUFBQSxHQUFJLFNBQUEsR0FBQTtBQUNGLElBQUEsSUFBRyxDQUFBLElBQUssQ0FBQSxVQUFSO0FBQ0UsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLFFBQVEsQ0FBQyx1QkFBdEIsQ0FBOEMsSUFBOUMsQ0FBQSxDQURGO0tBQUE7V0FFQSxJQUFDLENBQUEsV0FIQztFQUFBLENBdk1KLENBQUE7O0FBQUEseUJBZ05BLE9BQUEsR0FBUyxTQUFDLFFBQUQsR0FBQTtBQUNQLFFBQUEsc0JBQUE7QUFBQSxJQUFBLFlBQUEsR0FBZSxJQUFmLENBQUE7QUFDQTtXQUFNLENBQUMsWUFBQSxHQUFlLFlBQVksQ0FBQyxTQUFiLENBQUEsQ0FBaEIsQ0FBTixHQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLFlBQVQsRUFBQSxDQURGO0lBQUEsQ0FBQTtvQkFGTztFQUFBLENBaE5ULENBQUE7O0FBQUEseUJBc05BLFFBQUEsR0FBVSxTQUFDLFFBQUQsR0FBQTtBQUNSLFFBQUEsb0RBQUE7QUFBQTtBQUFBO1NBQUEsWUFBQTtvQ0FBQTtBQUNFLE1BQUEsWUFBQSxHQUFlLGdCQUFnQixDQUFDLEtBQWhDLENBQUE7QUFBQTs7QUFDQTtlQUFPLFlBQVAsR0FBQTtBQUNFLFVBQUEsUUFBQSxDQUFTLFlBQVQsQ0FBQSxDQUFBO0FBQUEseUJBQ0EsWUFBQSxHQUFlLFlBQVksQ0FBQyxLQUQ1QixDQURGO1FBQUEsQ0FBQTs7V0FEQSxDQURGO0FBQUE7b0JBRFE7RUFBQSxDQXROVixDQUFBOztBQUFBLHlCQThOQSxXQUFBLEdBQWEsU0FBQyxRQUFELEdBQUE7QUFDWCxRQUFBLG9EQUFBO0FBQUE7QUFBQTtTQUFBLFlBQUE7b0NBQUE7QUFDRSxNQUFBLFlBQUEsR0FBZSxnQkFBZ0IsQ0FBQyxLQUFoQyxDQUFBO0FBQUE7O0FBQ0E7ZUFBTyxZQUFQLEdBQUE7QUFDRSxVQUFBLFFBQUEsQ0FBUyxZQUFULENBQUEsQ0FBQTtBQUFBLFVBQ0EsWUFBWSxDQUFDLFdBQWIsQ0FBeUIsUUFBekIsQ0FEQSxDQUFBO0FBQUEseUJBRUEsWUFBQSxHQUFlLFlBQVksQ0FBQyxLQUY1QixDQURGO1FBQUEsQ0FBQTs7V0FEQSxDQURGO0FBQUE7b0JBRFc7RUFBQSxDQTlOYixDQUFBOztBQUFBLHlCQXVPQSxrQkFBQSxHQUFvQixTQUFDLFFBQUQsR0FBQTtBQUNsQixJQUFBLFFBQUEsQ0FBUyxJQUFULENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsUUFBYixFQUZrQjtFQUFBLENBdk9wQixDQUFBOztBQUFBLHlCQTZPQSxvQkFBQSxHQUFzQixTQUFDLFFBQUQsR0FBQTtXQUNwQixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsU0FBQyxZQUFELEdBQUE7QUFDbEIsVUFBQSxzQ0FBQTtBQUFBO0FBQUE7V0FBQSxZQUFBO3NDQUFBO0FBQ0Usc0JBQUEsUUFBQSxDQUFTLGdCQUFULEVBQUEsQ0FERjtBQUFBO3NCQURrQjtJQUFBLENBQXBCLEVBRG9CO0VBQUEsQ0E3T3RCLENBQUE7O0FBQUEseUJBb1BBLGNBQUEsR0FBZ0IsU0FBQyxRQUFELEdBQUE7V0FDZCxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsWUFBRCxHQUFBO0FBQ2xCLFlBQUEsc0NBQUE7QUFBQSxRQUFBLElBQTBCLFlBQUEsS0FBZ0IsS0FBMUM7QUFBQSxVQUFBLFFBQUEsQ0FBUyxZQUFULENBQUEsQ0FBQTtTQUFBO0FBQ0E7QUFBQTthQUFBLFlBQUE7d0NBQUE7QUFDRSx3QkFBQSxRQUFBLENBQVMsZ0JBQVQsRUFBQSxDQURGO0FBQUE7d0JBRmtCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsRUFEYztFQUFBLENBcFBoQixDQUFBOztBQUFBLHlCQTJQQSxlQUFBLEdBQWlCLFNBQUMsUUFBRCxHQUFBO0FBQ2YsSUFBQSxRQUFBLENBQVMsSUFBVCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsUUFBRCxDQUFVLFFBQVYsRUFGZTtFQUFBLENBM1BqQixDQUFBOztBQUFBLHlCQW1RQSxNQUFBLEdBQVEsU0FBQSxHQUFBO0FBRU4sUUFBQSxVQUFBO0FBQUEsSUFBQSxJQUFBLEdBQ0U7QUFBQSxNQUFBLEVBQUEsRUFBSSxJQUFDLENBQUEsRUFBTDtBQUFBLE1BQ0EsVUFBQSxFQUFZLElBQUMsQ0FBQSxVQURiO0tBREYsQ0FBQTtBQUlBLElBQUEsSUFBQSxDQUFBLGFBQW9CLENBQUMsT0FBZCxDQUFzQixJQUFDLENBQUEsT0FBdkIsQ0FBUDtBQUNFLE1BQUEsSUFBSSxDQUFDLE9BQUwsR0FBZSxhQUFhLENBQUMsUUFBZCxDQUF1QixJQUFDLENBQUEsT0FBeEIsQ0FBZixDQURGO0tBSkE7QUFPQSxJQUFBLElBQUEsQ0FBQSxhQUFvQixDQUFDLE9BQWQsQ0FBc0IsSUFBQyxDQUFBLE1BQXZCLENBQVA7QUFDRSxNQUFBLElBQUksQ0FBQyxNQUFMLEdBQWMsYUFBYSxDQUFDLFFBQWQsQ0FBdUIsSUFBQyxDQUFBLE1BQXhCLENBQWQsQ0FERjtLQVBBO0FBVUEsSUFBQSxJQUFBLENBQUEsYUFBb0IsQ0FBQyxPQUFkLENBQXNCLElBQUMsQ0FBQSxVQUF2QixDQUFQO0FBQ0UsTUFBQSxJQUFJLENBQUMsSUFBTCxHQUFZLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUIsSUFBQyxDQUFBLFVBQXBCLENBQVosQ0FERjtLQVZBO0FBY0EsU0FBQSx1QkFBQSxHQUFBO0FBQ0UsTUFBQSxJQUFJLENBQUMsZUFBTCxJQUFJLENBQUMsYUFBZSxHQUFwQixDQUFBO0FBQUEsTUFDQSxJQUFJLENBQUMsVUFBVyxDQUFBLElBQUEsQ0FBaEIsR0FBd0IsRUFEeEIsQ0FERjtBQUFBLEtBZEE7V0FrQkEsS0FwQk07RUFBQSxDQW5RUixDQUFBOztzQkFBQTs7SUF6QkYsQ0FBQTs7QUFBQSxZQW1UWSxDQUFDLFFBQWIsR0FBd0IsU0FBQyxJQUFELEVBQU8sTUFBUCxHQUFBO0FBQ3RCLE1BQUEseUdBQUE7QUFBQSxFQUFBLFFBQUEsR0FBVyxNQUFNLENBQUMsR0FBUCxDQUFXLElBQUksQ0FBQyxVQUFoQixDQUFYLENBQUE7QUFBQSxFQUVBLE1BQUEsQ0FBTyxRQUFQLEVBQ0csa0VBQUEsR0FBSixJQUFJLENBQUMsVUFBRCxHQUFvRixHQUR2RixDQUZBLENBQUE7QUFBQSxFQUtBLEtBQUEsR0FBWSxJQUFBLFlBQUEsQ0FBYTtBQUFBLElBQUUsVUFBQSxRQUFGO0FBQUEsSUFBWSxFQUFBLEVBQUksSUFBSSxDQUFDLEVBQXJCO0dBQWIsQ0FMWixDQUFBO0FBT0E7QUFBQSxPQUFBLFlBQUE7dUJBQUE7QUFDRSxJQUFBLE1BQUEsQ0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWQsQ0FBNkIsSUFBN0IsQ0FBUCxFQUNHLHNEQUFBLEdBQU4sSUFBTSxHQUE2RCxHQURoRSxDQUFBLENBQUE7QUFBQSxJQUVBLEtBQUssQ0FBQyxPQUFRLENBQUEsSUFBQSxDQUFkLEdBQXNCLEtBRnRCLENBREY7QUFBQSxHQVBBO0FBWUE7QUFBQSxPQUFBLGtCQUFBOzZCQUFBO0FBQ0UsSUFBQSxLQUFLLENBQUMsS0FBTixDQUFZLFNBQVosRUFBdUIsS0FBdkIsQ0FBQSxDQURGO0FBQUEsR0FaQTtBQWVBLEVBQUEsSUFBeUIsSUFBSSxDQUFDLElBQTlCO0FBQUEsSUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxJQUFoQixDQUFBLENBQUE7R0FmQTtBQWlCQTtBQUFBLE9BQUEsc0JBQUE7d0NBQUE7QUFDRSxJQUFBLE1BQUEsQ0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLGNBQWpCLENBQWdDLGFBQWhDLENBQVAsRUFDRyx1REFBQSxHQUFOLGFBREcsQ0FBQSxDQUFBO0FBR0EsSUFBQSxJQUFHLFlBQUg7QUFDRSxNQUFBLE1BQUEsQ0FBTyxDQUFDLENBQUMsT0FBRixDQUFVLFlBQVYsQ0FBUCxFQUNHLDREQUFBLEdBQVIsYUFESyxDQUFBLENBQUE7QUFFQSxXQUFBLG1EQUFBO2lDQUFBO0FBQ0UsUUFBQSxLQUFLLENBQUMsTUFBTixDQUFjLGFBQWQsRUFBNkIsWUFBWSxDQUFDLFFBQWIsQ0FBc0IsS0FBdEIsRUFBNkIsTUFBN0IsQ0FBN0IsQ0FBQSxDQURGO0FBQUEsT0FIRjtLQUpGO0FBQUEsR0FqQkE7U0EyQkEsTUE1QnNCO0FBQUEsQ0FuVHhCLENBQUE7Ozs7QUNBQSxJQUFBLGlFQUFBO0VBQUEsa0JBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsZ0JBQ0EsR0FBbUIsT0FBQSxDQUFRLHFCQUFSLENBRG5CLENBQUE7O0FBQUEsWUFFQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUixDQUZmLENBQUE7O0FBQUEsWUFHQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUixDQUhmLENBQUE7O0FBQUEsTUErQk0sQ0FBQyxPQUFQLEdBQXVCO0FBR1IsRUFBQSxxQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLGFBQUE7QUFBQSwwQkFEWSxPQUF1QixJQUFyQixlQUFBLFNBQVMsSUFBQyxDQUFBLGNBQUEsTUFDeEIsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLG1CQUFQLEVBQWlCLDREQUFqQixDQUFBLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxJQUFELEdBQVksSUFBQSxnQkFBQSxDQUFpQjtBQUFBLE1BQUEsTUFBQSxFQUFRLElBQVI7S0FBakIsQ0FEWixDQUFBO0FBS0EsSUFBQSxJQUErQixlQUEvQjtBQUFBLE1BQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWLEVBQW1CLElBQUMsQ0FBQSxNQUFwQixDQUFBLENBQUE7S0FMQTtBQUFBLElBT0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLEdBQW9CLElBUHBCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLENBUkEsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBY0EsT0FBQSxHQUFTLFNBQUMsT0FBRCxHQUFBO0FBQ1AsSUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaLENBQVYsQ0FBQTtBQUNBLElBQUEsSUFBMEIsZUFBMUI7QUFBQSxNQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjLE9BQWQsQ0FBQSxDQUFBO0tBREE7V0FFQSxLQUhPO0VBQUEsQ0FkVCxDQUFBOztBQUFBLHdCQXNCQSxNQUFBLEdBQVEsU0FBQyxPQUFELEdBQUE7QUFDTixJQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsVUFBRCxDQUFZLE9BQVosQ0FBVixDQUFBO0FBQ0EsSUFBQSxJQUF5QixlQUF6QjtBQUFBLE1BQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsT0FBYixDQUFBLENBQUE7S0FEQTtXQUVBLEtBSE07RUFBQSxDQXRCUixDQUFBOztBQUFBLHdCQTRCQSxVQUFBLEdBQVksU0FBQyxXQUFELEdBQUE7QUFDVixJQUFBLElBQUcsTUFBQSxDQUFBLFdBQUEsS0FBc0IsUUFBekI7YUFDRSxJQUFDLENBQUEsV0FBRCxDQUFhLFdBQWIsRUFERjtLQUFBLE1BQUE7YUFHRSxZQUhGO0tBRFU7RUFBQSxDQTVCWixDQUFBOztBQUFBLHdCQW1DQSxXQUFBLEdBQWEsU0FBQyxVQUFELEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsV0FBRCxDQUFhLFVBQWIsQ0FBWCxDQUFBO0FBQ0EsSUFBQSxJQUEwQixRQUExQjthQUFBLFFBQVEsQ0FBQyxXQUFULENBQUEsRUFBQTtLQUZXO0VBQUEsQ0FuQ2IsQ0FBQTs7QUFBQSx3QkF3Q0EsYUFBQSxHQUFlLFNBQUEsR0FBQTtXQUNiLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBYixDQUFtQixJQUFuQixFQUF5QixTQUF6QixFQURhO0VBQUEsQ0F4Q2YsQ0FBQTs7QUFBQSx3QkE0Q0EsV0FBQSxHQUFhLFNBQUMsVUFBRCxHQUFBO0FBQ1gsUUFBQSxRQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksVUFBWixDQUFYLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQWtCLDBCQUFBLEdBQXJCLFVBQUcsQ0FEQSxDQUFBO1dBRUEsU0FIVztFQUFBLENBNUNiLENBQUE7O0FBQUEsd0JBa0RBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtBQUdoQixJQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FBaEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGNBQUQsR0FBa0IsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQURsQixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLENBQUMsU0FBRixDQUFBLENBRmhCLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixDQUFDLENBQUMsU0FBRixDQUFBLENBTHpCLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixDQUFDLENBQUMsU0FBRixDQUFBLENBTnRCLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxzQkFBRCxHQUEwQixDQUFDLENBQUMsU0FBRixDQUFBLENBUDFCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixDQUFDLENBQUMsU0FBRixDQUFBLENBUnRCLENBQUE7V0FVQSxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsQ0FBQyxTQUFGLENBQUEsRUFiSztFQUFBLENBbERsQixDQUFBOztBQUFBLHdCQW1FQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7V0FDSixJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBREk7RUFBQSxDQW5FTixDQUFBOztBQUFBLHdCQXVFQSxhQUFBLEdBQWUsU0FBQyxRQUFELEdBQUE7V0FDYixJQUFDLENBQUEsSUFBSSxDQUFDLGFBQU4sQ0FBb0IsUUFBcEIsRUFEYTtFQUFBLENBdkVmLENBQUE7O0FBQUEsd0JBNEVBLEtBQUEsR0FBTyxTQUFBLEdBQUE7V0FDTCxJQUFDLENBQUEsSUFBSSxDQUFDLE1BREQ7RUFBQSxDQTVFUCxDQUFBOztBQUFBLHdCQWlGQSxHQUFBLEdBQUssU0FBQyxRQUFELEdBQUE7V0FDSCxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxRQUFWLEVBREc7RUFBQSxDQWpGTCxDQUFBOztBQUFBLHdCQXFGQSxJQUFBLEdBQU0sU0FBQyxNQUFELEdBQUE7QUFDSixRQUFBLEdBQUE7QUFBQSxJQUFBLElBQUcsTUFBQSxDQUFBLE1BQUEsS0FBaUIsUUFBcEI7QUFDRSxNQUFBLEdBQUEsR0FBTSxFQUFOLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxPQUFELEdBQUE7QUFDSixRQUFBLElBQUcsT0FBTyxDQUFDLFVBQVIsS0FBc0IsTUFBdEIsSUFBZ0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFqQixLQUF1QixNQUExRDtpQkFDRSxHQUFHLENBQUMsSUFBSixDQUFTLE9BQVQsRUFERjtTQURJO01BQUEsQ0FBTixDQURBLENBQUE7YUFLSSxJQUFBLFlBQUEsQ0FBYSxHQUFiLEVBTk47S0FBQSxNQUFBO2FBUU0sSUFBQSxZQUFBLENBQUEsRUFSTjtLQURJO0VBQUEsQ0FyRk4sQ0FBQTs7QUFBQSx3QkFpR0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsT0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLEdBQW9CLE1BQXBCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxPQUFELEdBQUE7YUFDSixPQUFPLENBQUMsV0FBUixHQUFzQixPQURsQjtJQUFBLENBQU4sQ0FEQSxDQUFBO0FBQUEsSUFJQSxPQUFBLEdBQVUsSUFBQyxDQUFBLElBSlgsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLElBQUQsR0FBWSxJQUFBLGdCQUFBLENBQWlCO0FBQUEsTUFBQSxNQUFBLEVBQVEsSUFBUjtLQUFqQixDQUxaLENBQUE7V0FPQSxRQVJNO0VBQUEsQ0FqR1IsQ0FBQTs7QUFBQSx3QkE0SEEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLFFBQUEsdUJBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyw0QkFBVCxDQUFBO0FBQUEsSUFFQSxPQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sV0FBUCxHQUFBOztRQUFPLGNBQWM7T0FDN0I7YUFBQSxNQUFBLElBQVUsRUFBQSxHQUFFLENBQWpCLEtBQUEsQ0FBTSxXQUFBLEdBQWMsQ0FBcEIsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixHQUE1QixDQUFpQixDQUFGLEdBQWYsSUFBZSxHQUErQyxLQURqRDtJQUFBLENBRlYsQ0FBQTtBQUFBLElBS0EsTUFBQSxHQUFTLFNBQUMsT0FBRCxFQUFVLFdBQVYsR0FBQTtBQUNQLFVBQUEsc0NBQUE7O1FBRGlCLGNBQWM7T0FDL0I7QUFBQSxNQUFBLFFBQUEsR0FBVyxPQUFPLENBQUMsUUFBbkIsQ0FBQTtBQUFBLE1BQ0EsT0FBQSxDQUFTLElBQUEsR0FBZCxRQUFRLENBQUMsS0FBSyxHQUFxQixJQUFyQixHQUFkLFFBQVEsQ0FBQyxVQUFLLEdBQStDLEdBQXhELEVBQTRELFdBQTVELENBREEsQ0FBQTtBQUlBO0FBQUEsV0FBQSxZQUFBO3NDQUFBO0FBQ0UsUUFBQSxPQUFBLENBQVEsRUFBQSxHQUFmLElBQWUsR0FBVSxHQUFsQixFQUFzQixXQUFBLEdBQWMsQ0FBcEMsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxJQUFtRCxnQkFBZ0IsQ0FBQyxLQUFwRTtBQUFBLFVBQUEsTUFBQSxDQUFPLGdCQUFnQixDQUFDLEtBQXhCLEVBQStCLFdBQUEsR0FBYyxDQUE3QyxDQUFBLENBQUE7U0FGRjtBQUFBLE9BSkE7QUFTQSxNQUFBLElBQXFDLE9BQU8sQ0FBQyxJQUE3QztlQUFBLE1BQUEsQ0FBTyxPQUFPLENBQUMsSUFBZixFQUFxQixXQUFyQixFQUFBO09BVk87SUFBQSxDQUxULENBQUE7QUFpQkEsSUFBQSxJQUF1QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQTdCO0FBQUEsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFiLENBQUEsQ0FBQTtLQWpCQTtBQWtCQSxXQUFPLE1BQVAsQ0FuQks7RUFBQSxDQTVIUCxDQUFBOztBQUFBLHdCQXVKQSxnQkFBQSxHQUFrQixTQUFDLE9BQUQsRUFBVSxpQkFBVixHQUFBO0FBQ2hCLElBQUEsSUFBRyxPQUFPLENBQUMsV0FBUixLQUF1QixJQUExQjtBQUVFLE1BQUEsaUJBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLGNBQVgsRUFBMkIsT0FBM0IsRUFIRjtLQUFBLE1BQUE7QUFLRSxNQUFBLElBQUcsMkJBQUg7QUFFRSxRQUFBLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUF6QixDQUF1QyxPQUF2QyxDQUFBLENBRkY7T0FBQTtBQUFBLE1BSUEsT0FBTyxDQUFDLGtCQUFSLENBQTJCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLFVBQUQsR0FBQTtpQkFDekIsVUFBVSxDQUFDLFdBQVgsR0FBeUIsTUFEQTtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCLENBSkEsQ0FBQTtBQUFBLE1BT0EsaUJBQUEsQ0FBQSxDQVBBLENBQUE7YUFRQSxJQUFDLENBQUEsU0FBRCxDQUFXLGNBQVgsRUFBMkIsT0FBM0IsRUFiRjtLQURnQjtFQUFBLENBdkpsQixDQUFBOztBQUFBLHdCQXdLQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsUUFBQSxXQUFBO0FBQUEsSUFEVSxzQkFBTyw4REFDakIsQ0FBQTtBQUFBLElBQUEsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLElBQUksQ0FBQyxLQUFqQixDQUF1QixLQUF2QixFQUE4QixJQUE5QixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBQSxFQUZTO0VBQUEsQ0F4S1gsQ0FBQTs7QUFBQSx3QkE2S0EsZ0JBQUEsR0FBa0IsU0FBQyxPQUFELEVBQVUsaUJBQVYsR0FBQTtBQUNoQixJQUFBLE1BQUEsQ0FBTyxPQUFPLENBQUMsV0FBUixLQUF1QixJQUE5QixFQUNFLGdEQURGLENBQUEsQ0FBQTtBQUFBLElBR0EsT0FBTyxDQUFDLGtCQUFSLENBQTJCLFNBQUMsV0FBRCxHQUFBO2FBQ3pCLFdBQVcsQ0FBQyxXQUFaLEdBQTBCLE9BREQ7SUFBQSxDQUEzQixDQUhBLENBQUE7QUFBQSxJQU1BLGlCQUFBLENBQUEsQ0FOQSxDQUFBO1dBT0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxnQkFBWCxFQUE2QixPQUE3QixFQVJnQjtFQUFBLENBN0tsQixDQUFBOztBQUFBLHdCQXdMQSxlQUFBLEdBQWlCLFNBQUMsT0FBRCxHQUFBO1dBQ2YsSUFBQyxDQUFBLFNBQUQsQ0FBVyx1QkFBWCxFQUFvQyxPQUFwQyxFQURlO0VBQUEsQ0F4TGpCLENBQUE7O0FBQUEsd0JBNExBLFlBQUEsR0FBYyxTQUFDLE9BQUQsR0FBQTtXQUNaLElBQUMsQ0FBQSxTQUFELENBQVcsb0JBQVgsRUFBaUMsT0FBakMsRUFEWTtFQUFBLENBNUxkLENBQUE7O0FBQUEsd0JBZ01BLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxpQkFBVixHQUFBO1dBQ1osSUFBQyxDQUFBLFNBQUQsQ0FBVyxvQkFBWCxFQUFpQyxPQUFqQyxFQUEwQyxpQkFBMUMsRUFEWTtFQUFBLENBaE1kLENBQUE7O0FBQUEsd0JBdU1BLFNBQUEsR0FBVyxTQUFBLEdBQUE7V0FDVCxLQUFLLENBQUMsWUFBTixDQUFtQixJQUFDLENBQUEsTUFBRCxDQUFBLENBQW5CLEVBRFM7RUFBQSxDQXZNWCxDQUFBOztBQUFBLHdCQTZNQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsUUFBQSwyQkFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLEVBQVAsQ0FBQTtBQUFBLElBQ0EsSUFBSyxDQUFBLFNBQUEsQ0FBTCxHQUFrQixFQURsQixDQUFBO0FBQUEsSUFFQSxJQUFLLENBQUEsUUFBQSxDQUFMLEdBQWlCO0FBQUEsTUFBRSxJQUFBLEVBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFoQjtLQUZqQixDQUFBO0FBQUEsSUFJQSxhQUFBLEdBQWdCLFNBQUMsT0FBRCxFQUFVLEtBQVYsRUFBaUIsY0FBakIsR0FBQTtBQUNkLFVBQUEsV0FBQTtBQUFBLE1BQUEsV0FBQSxHQUFjLE9BQU8sQ0FBQyxNQUFSLENBQUEsQ0FBZCxDQUFBO0FBQUEsTUFDQSxjQUFjLENBQUMsSUFBZixDQUFvQixXQUFwQixDQURBLENBQUE7YUFFQSxZQUhjO0lBQUEsQ0FKaEIsQ0FBQTtBQUFBLElBU0EsTUFBQSxHQUFTLFNBQUMsT0FBRCxFQUFVLEtBQVYsRUFBaUIsT0FBakIsR0FBQTtBQUNQLFVBQUEseURBQUE7QUFBQSxNQUFBLFdBQUEsR0FBYyxhQUFBLENBQWMsT0FBZCxFQUF1QixLQUF2QixFQUE4QixPQUE5QixDQUFkLENBQUE7QUFHQTtBQUFBLFdBQUEsWUFBQTtzQ0FBQTtBQUNFLFFBQUEsY0FBQSxHQUFpQixXQUFXLENBQUMsVUFBVyxDQUFBLGdCQUFnQixDQUFDLElBQWpCLENBQXZCLEdBQWdELEVBQWpFLENBQUE7QUFDQSxRQUFBLElBQTZELGdCQUFnQixDQUFDLEtBQTlFO0FBQUEsVUFBQSxNQUFBLENBQU8sZ0JBQWdCLENBQUMsS0FBeEIsRUFBK0IsS0FBQSxHQUFRLENBQXZDLEVBQTBDLGNBQTFDLENBQUEsQ0FBQTtTQUZGO0FBQUEsT0FIQTtBQVFBLE1BQUEsSUFBd0MsT0FBTyxDQUFDLElBQWhEO2VBQUEsTUFBQSxDQUFPLE9BQU8sQ0FBQyxJQUFmLEVBQXFCLEtBQXJCLEVBQTRCLE9BQTVCLEVBQUE7T0FUTztJQUFBLENBVFQsQ0FBQTtBQW9CQSxJQUFBLElBQTJDLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBakQ7QUFBQSxNQUFBLE1BQUEsQ0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUIsSUFBSyxDQUFBLFNBQUEsQ0FBNUIsQ0FBQSxDQUFBO0tBcEJBO1dBc0JBLEtBdkJTO0VBQUEsQ0E3TVgsQ0FBQTs7QUFBQSx3QkF1T0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxTQUFELENBQUEsRUFETTtFQUFBLENBdk9SLENBQUE7O0FBQUEsd0JBMk9BLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxNQUFQLEdBQUE7QUFDUixRQUFBLG9DQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sR0FBb0IsTUFBcEIsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFJLENBQUMsT0FBUjtBQUNFO0FBQUEsV0FBQSwyQ0FBQTsrQkFBQTtBQUNFLFFBQUEsT0FBQSxHQUFVLFlBQVksQ0FBQyxRQUFiLENBQXNCLFdBQXRCLEVBQW1DLE1BQW5DLENBQVYsQ0FBQTtBQUFBLFFBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsT0FBYixDQURBLENBREY7QUFBQSxPQURGO0tBREE7QUFBQSxJQU1BLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixHQUFvQixJQU5wQixDQUFBO1dBT0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsT0FBRCxHQUFBO2VBQ1QsT0FBTyxDQUFDLFdBQVIsR0FBc0IsTUFEYjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVgsRUFSUTtFQUFBLENBM09WLENBQUE7O3FCQUFBOztJQWxDRixDQUFBOzs7O0FDQUEsSUFBQSxzQkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxHQUNBLEdBQU0sT0FBQSxDQUFRLG9CQUFSLENBRE4sQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsbUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxJQUFBO0FBQUEsSUFEYyxZQUFBLE1BQU0sSUFBQyxDQUFBLFlBQUEsTUFBTSxJQUFDLENBQUEsWUFBQSxJQUM1QixDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsSUFBUSxNQUFNLENBQUMsVUFBVyxDQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQyxXQUF6QyxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BQU0sQ0FBQyxVQUFXLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FENUIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUZaLENBRFc7RUFBQSxDQUFiOztBQUFBLHNCQU1BLFlBQUEsR0FBYyxTQUFBLEdBQUE7V0FDWixJQUFDLENBQUEsTUFBTSxDQUFDLGFBREk7RUFBQSxDQU5kLENBQUE7O0FBQUEsc0JBVUEsa0JBQUEsR0FBb0IsU0FBQSxHQUFBO1dBQ2xCLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBRFU7RUFBQSxDQVZwQixDQUFBOztBQUFBLHNCQWdCQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsUUFBQSxZQUFBO0FBQUEsSUFBQSxZQUFBLEdBQW1CLElBQUEsU0FBQSxDQUFVO0FBQUEsTUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQVA7QUFBQSxNQUFhLElBQUEsRUFBTSxJQUFDLENBQUEsSUFBcEI7S0FBVixDQUFuQixDQUFBO0FBQUEsSUFDQSxZQUFZLENBQUMsUUFBYixHQUF3QixJQUFDLENBQUEsUUFEekIsQ0FBQTtXQUVBLGFBSEs7RUFBQSxDQWhCUCxDQUFBOztBQUFBLHNCQXNCQSw2QkFBQSxHQUErQixTQUFBLEdBQUE7V0FDN0IsR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQUMsQ0FBQSxJQUFuQyxFQUQ2QjtFQUFBLENBdEIvQixDQUFBOztBQUFBLHNCQTBCQSxxQkFBQSxHQUF1QixTQUFBLEdBQUE7V0FDckIsSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLEVBRHFCO0VBQUEsQ0ExQnZCLENBQUE7O21CQUFBOztJQUxGLENBQUE7Ozs7QUNBQSxJQUFBLDhDQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FEVCxDQUFBOztBQUFBLFNBRUEsR0FBWSxPQUFBLENBQVEsYUFBUixDQUZaLENBQUE7O0FBQUEsTUFNTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDZCQUFFLEdBQUYsR0FBQTtBQUNYLElBRFksSUFBQyxDQUFBLG9CQUFBLE1BQUksRUFDakIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxDQUFWLENBRFc7RUFBQSxDQUFiOztBQUFBLGdDQUlBLEdBQUEsR0FBSyxTQUFDLFNBQUQsR0FBQTtBQUNILFFBQUEsS0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLGlCQUFELENBQW1CLFNBQW5CLENBQUEsQ0FBQTtBQUFBLElBR0EsSUFBSyxDQUFBLElBQUMsQ0FBQSxNQUFELENBQUwsR0FBZ0IsU0FIaEIsQ0FBQTtBQUFBLElBSUEsU0FBUyxDQUFDLEtBQVYsR0FBa0IsSUFBQyxDQUFBLE1BSm5CLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxNQUFELElBQVcsQ0FMWCxDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsR0FBSSxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQUwsR0FBdUIsU0FSdkIsQ0FBQTtBQUFBLElBWUEsYUFBSyxTQUFTLENBQUMsVUFBZixjQUF5QixHQVp6QixDQUFBO1dBYUEsSUFBSyxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsQ0FBQyxJQUFyQixDQUEwQixTQUExQixFQWRHO0VBQUEsQ0FKTCxDQUFBOztBQUFBLGdDQXFCQSxJQUFBLEdBQU0sU0FBQyxJQUFELEdBQUE7QUFDSixRQUFBLFNBQUE7QUFBQSxJQUFBLElBQW9CLElBQUEsWUFBZ0IsU0FBcEM7QUFBQSxNQUFBLFNBQUEsR0FBWSxJQUFaLENBQUE7S0FBQTtBQUFBLElBQ0EsY0FBQSxZQUFjLElBQUMsQ0FBQSxHQUFJLENBQUEsSUFBQSxFQURuQixDQUFBO1dBRUEsSUFBSyxDQUFBLFNBQVMsQ0FBQyxLQUFWLElBQW1CLENBQW5CLEVBSEQ7RUFBQSxDQXJCTixDQUFBOztBQUFBLGdDQTJCQSxVQUFBLEdBQVksU0FBQyxJQUFELEdBQUE7QUFDVixRQUFBLHVCQUFBO0FBQUEsSUFBQSxJQUFvQixJQUFBLFlBQWdCLFNBQXBDO0FBQUEsTUFBQSxTQUFBLEdBQVksSUFBWixDQUFBO0tBQUE7QUFBQSxJQUNBLGNBQUEsWUFBYyxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUEsRUFEbkIsQ0FBQTtBQUFBLElBR0EsWUFBQSxHQUFlLFNBQVMsQ0FBQyxJQUh6QixDQUFBO0FBSUEsV0FBTSxTQUFBLEdBQVksSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFOLENBQWxCLEdBQUE7QUFDRSxNQUFBLElBQW9CLFNBQVMsQ0FBQyxJQUFWLEtBQWtCLFlBQXRDO0FBQUEsZUFBTyxTQUFQLENBQUE7T0FERjtJQUFBLENBTFU7RUFBQSxDQTNCWixDQUFBOztBQUFBLGdDQW9DQSxHQUFBLEdBQUssU0FBQyxJQUFELEdBQUE7V0FDSCxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUEsRUFERjtFQUFBLENBcENMLENBQUE7O0FBQUEsZ0NBeUNBLFFBQUEsR0FBVSxTQUFDLElBQUQsR0FBQTtXQUNSLENBQUEsQ0FBRSxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUEsQ0FBSyxDQUFDLElBQWIsRUFEUTtFQUFBLENBekNWLENBQUE7O0FBQUEsZ0NBNkNBLEtBQUEsR0FBTyxTQUFDLElBQUQsR0FBQTtBQUNMLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBRyxJQUFIOytDQUNZLENBQUUsZ0JBRGQ7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLE9BSEg7S0FESztFQUFBLENBN0NQLENBQUE7O0FBQUEsZ0NBb0RBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtBQUNKLFFBQUEsNkJBQUE7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLFNBQVQsRUFBQSxDQURGO0FBQUE7b0JBREk7RUFBQSxDQXBETixDQUFBOztBQUFBLGdDQXlEQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQW9CLElBQUEsbUJBQUEsQ0FBQSxDQUFwQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsU0FBRCxHQUFBO2FBQ0osYUFBYSxDQUFDLEdBQWQsQ0FBa0IsU0FBUyxDQUFDLEtBQVYsQ0FBQSxDQUFsQixFQURJO0lBQUEsQ0FBTixDQURBLENBQUE7V0FJQSxjQUxLO0VBQUEsQ0F6RFAsQ0FBQTs7QUFBQSxnQ0FpRUEsZUFBQSxHQUFpQixTQUFBLEdBQUE7QUFDZixJQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxTQUFELEdBQUE7QUFDSixNQUFBLElBQWdCLENBQUEsU0FBYSxDQUFDLElBQTlCO0FBQUEsZUFBTyxLQUFQLENBQUE7T0FESTtJQUFBLENBQU4sQ0FBQSxDQUFBO0FBR0EsV0FBTyxJQUFQLENBSmU7RUFBQSxDQWpFakIsQ0FBQTs7QUFBQSxnQ0F5RUEsaUJBQUEsR0FBbUIsU0FBQyxTQUFELEdBQUE7V0FDakIsTUFBQSxDQUFPLFNBQUEsSUFBYSxDQUFBLElBQUssQ0FBQSxHQUFJLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBN0IsRUFDRSxFQUFBLEdBQ04sU0FBUyxDQUFDLElBREosR0FDVSw0QkFEVixHQUNMLE1BQU0sQ0FBQyxVQUFXLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxDQUFDLFlBRDdCLEdBRXNDLEtBRnRDLEdBRUwsU0FBUyxDQUFDLElBRkwsR0FFMkQsU0FGM0QsR0FFTCxTQUFTLENBQUMsSUFGTCxHQUdDLHlCQUpILEVBRGlCO0VBQUEsQ0F6RW5CLENBQUE7OzZCQUFBOztJQVJGLENBQUE7Ozs7QUNBQSxJQUFBLGlCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLFNBQ0EsR0FBWSxPQUFBLENBQVEsYUFBUixDQURaLENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFFbEIsTUFBQSxlQUFBO0FBQUEsRUFBQSxlQUFBLEdBQWtCLGFBQWxCLENBQUE7U0FFQTtBQUFBLElBQUEsS0FBQSxFQUFPLFNBQUMsSUFBRCxHQUFBO0FBQ0wsVUFBQSw0QkFBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixNQUFoQixDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLEVBRGhCLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQWpCLEVBQXVCLFNBQUMsU0FBRCxHQUFBO0FBQ3JCLFFBQUEsSUFBRyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFIO2lCQUNFLGFBQUEsR0FBZ0IsVUFEbEI7U0FBQSxNQUFBO2lCQUdFLGFBQWEsQ0FBQyxJQUFkLENBQW1CLFNBQW5CLEVBSEY7U0FEcUI7TUFBQSxDQUF2QixDQUZBLENBQUE7QUFRQSxNQUFBLElBQXFELGFBQXJEO0FBQUEsUUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsYUFBcEIsRUFBbUMsYUFBbkMsQ0FBQSxDQUFBO09BUkE7QUFTQSxhQUFPLGFBQVAsQ0FWSztJQUFBLENBQVA7QUFBQSxJQWFBLGVBQUEsRUFBaUIsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO0FBQ2YsVUFBQSw4R0FBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixFQUFoQixDQUFBO0FBQ0E7QUFBQSxXQUFBLDJDQUFBO3dCQUFBO0FBQ0UsUUFBQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxJQUFyQixDQUFBO0FBQUEsUUFDQSxjQUFBLEdBQWlCLGFBQWEsQ0FBQyxPQUFkLENBQXNCLGVBQXRCLEVBQXVDLEVBQXZDLENBRGpCLENBQUE7QUFFQSxRQUFBLElBQUcsSUFBQSxHQUFPLE1BQU0sQ0FBQyxrQkFBbUIsQ0FBQSxjQUFBLENBQXBDO0FBQ0UsVUFBQSxhQUFhLENBQUMsSUFBZCxDQUNFO0FBQUEsWUFBQSxhQUFBLEVBQWUsYUFBZjtBQUFBLFlBQ0EsU0FBQSxFQUFlLElBQUEsU0FBQSxDQUNiO0FBQUEsY0FBQSxJQUFBLEVBQU0sSUFBSSxDQUFDLEtBQVg7QUFBQSxjQUNBLElBQUEsRUFBTSxJQUROO0FBQUEsY0FFQSxJQUFBLEVBQU0sSUFGTjthQURhLENBRGY7V0FERixDQUFBLENBREY7U0FIRjtBQUFBLE9BREE7QUFjQTtXQUFBLHNEQUFBO2lDQUFBO0FBQ0UsUUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFNBQWpCLENBQUE7QUFBQSxRQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixTQUFsQixFQUE2QixJQUFJLENBQUMsYUFBbEMsQ0FEQSxDQUFBO0FBQUEsc0JBRUEsSUFBQSxDQUFLLFNBQUwsRUFGQSxDQURGO0FBQUE7c0JBZmU7SUFBQSxDQWJqQjtBQUFBLElBa0NBLGtCQUFBLEVBQW9CLFNBQUMsYUFBRCxFQUFnQixhQUFoQixHQUFBO0FBQ2xCLFVBQUEsNkJBQUE7QUFBQTtXQUFBLG9EQUFBO3NDQUFBO0FBQ0UsZ0JBQU8sU0FBUyxDQUFDLElBQWpCO0FBQUEsZUFDTyxVQURQO0FBRUksMEJBQUEsYUFBYSxDQUFDLFFBQWQsR0FBeUIsS0FBekIsQ0FGSjtBQUNPO0FBRFA7a0NBQUE7QUFBQSxTQURGO0FBQUE7c0JBRGtCO0lBQUEsQ0FsQ3BCO0FBQUEsSUEyQ0EsZ0JBQUEsRUFBa0IsU0FBQyxTQUFELEVBQVksYUFBWixHQUFBO0FBQ2hCLE1BQUEsSUFBRyxTQUFTLENBQUMsa0JBQVYsQ0FBQSxDQUFIO0FBQ0UsUUFBQSxJQUFHLGFBQUEsS0FBaUIsU0FBUyxDQUFDLFlBQVYsQ0FBQSxDQUFwQjtpQkFDRSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsU0FBcEIsRUFBK0IsYUFBL0IsRUFERjtTQUFBLE1BRUssSUFBRyxDQUFBLFNBQWEsQ0FBQyxJQUFqQjtpQkFDSCxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsU0FBcEIsRUFERztTQUhQO09BQUEsTUFBQTtlQU1FLElBQUMsQ0FBQSxlQUFELENBQWlCLFNBQWpCLEVBQTRCLGFBQTVCLEVBTkY7T0FEZ0I7SUFBQSxDQTNDbEI7QUFBQSxJQXVEQSxrQkFBQSxFQUFvQixTQUFDLFNBQUQsRUFBWSxhQUFaLEdBQUE7QUFDbEIsVUFBQSxJQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sU0FBUyxDQUFDLElBQWpCLENBQUE7QUFDQSxNQUFBLElBQUcsYUFBSDtBQUNFLFFBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBakIsRUFBNEIsYUFBNUIsQ0FBQSxDQURGO09BREE7YUFHQSxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFTLENBQUMsWUFBVixDQUFBLENBQWxCLEVBQTRDLFNBQVMsQ0FBQyxJQUF0RCxFQUprQjtJQUFBLENBdkRwQjtBQUFBLElBOERBLGVBQUEsRUFBaUIsU0FBQyxTQUFELEVBQVksYUFBWixHQUFBO2FBQ2YsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFmLENBQStCLGFBQS9CLEVBRGU7SUFBQSxDQTlEakI7SUFKa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUhqQixDQUFBOzs7O0FDQUEsSUFBQSx1QkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUFpQixlQUFBLEdBQXFCLENBQUEsU0FBQSxHQUFBO0FBRXBDLE1BQUEsZUFBQTtBQUFBLEVBQUEsZUFBQSxHQUFrQixhQUFsQixDQUFBO1NBRUE7QUFBQSxJQUFBLElBQUEsRUFBTSxTQUFDLElBQUQsRUFBTyxtQkFBUCxHQUFBO0FBQ0osVUFBQSxxREFBQTtBQUFBO0FBQUEsV0FBQSwyQ0FBQTt3QkFBQTtBQUNFLFFBQUEsY0FBQSxHQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQVYsQ0FBa0IsZUFBbEIsRUFBbUMsRUFBbkMsQ0FBakIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxJQUFBLEdBQU8sTUFBTSxDQUFDLGtCQUFtQixDQUFBLGNBQUEsQ0FBcEM7QUFDRSxVQUFBLFNBQUEsR0FBWSxtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixJQUFJLENBQUMsS0FBN0IsQ0FBWixDQUFBO0FBQUEsVUFDQSxTQUFTLENBQUMsSUFBVixHQUFpQixJQURqQixDQURGO1NBRkY7QUFBQSxPQUFBO2FBTUEsT0FQSTtJQUFBLENBQU47SUFKb0M7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUZuQyxDQUFBOzs7O0FDQUEsSUFBQSx5QkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQVNNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsMkJBQUMsSUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBakIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFEN0MsQ0FEVztFQUFBLENBQWI7O0FBQUEsOEJBS0EsT0FBQSxHQUFTLElBTFQsQ0FBQTs7QUFBQSw4QkFRQSxPQUFBLEdBQVMsU0FBQSxHQUFBO1dBQ1AsQ0FBQSxDQUFDLElBQUUsQ0FBQSxNQURJO0VBQUEsQ0FSVCxDQUFBOztBQUFBLDhCQVlBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixRQUFBLGNBQUE7QUFBQSxJQUFBLENBQUEsR0FBSSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxLQUFoQixDQUFBO0FBQUEsSUFDQSxLQUFBLEdBQVEsSUFBQSxHQUFPLE1BRGYsQ0FBQTtBQUVBLElBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUNFLE1BQUEsS0FBQSxHQUFRLENBQUMsQ0FBQyxVQUFWLENBQUE7QUFDQSxNQUFBLElBQUcsS0FBQSxJQUFTLENBQUMsQ0FBQyxRQUFGLEtBQWMsQ0FBdkIsSUFBNEIsQ0FBQSxDQUFFLENBQUMsWUFBRixDQUFlLElBQUMsQ0FBQSxhQUFoQixDQUFoQztBQUNFLFFBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFULENBREY7T0FBQSxNQUFBO0FBR0UsUUFBQSxJQUFBLEdBQU8sSUFBUCxDQUFBO0FBQ0EsZUFBTSxDQUFDLENBQUEsS0FBSyxJQUFDLENBQUEsSUFBUCxDQUFBLElBQWdCLENBQUEsQ0FBRSxJQUFBLEdBQU8sQ0FBQyxDQUFDLFdBQVYsQ0FBdkIsR0FBQTtBQUNFLFVBQUEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxVQUFOLENBREY7UUFBQSxDQURBO0FBQUEsUUFJQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBSlQsQ0FIRjtPQUZGO0tBRkE7V0FhQSxJQUFDLENBQUEsUUFkRztFQUFBLENBWk4sQ0FBQTs7QUFBQSw4QkE4QkEsV0FBQSxHQUFhLFNBQUEsR0FBQTtBQUNYLFdBQU0sSUFBQyxDQUFBLElBQUQsQ0FBQSxDQUFOLEdBQUE7QUFDRSxNQUFBLElBQVMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULEtBQXFCLENBQTlCO0FBQUEsY0FBQTtPQURGO0lBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxRQUpVO0VBQUEsQ0E5QmIsQ0FBQTs7QUFBQSw4QkFxQ0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsSUFBRCxHQUFRLEtBRHRCO0VBQUEsQ0FyQ1IsQ0FBQTs7MkJBQUE7O0lBWEYsQ0FBQTs7OztBQ0FBLElBQUEsMklBQUE7O0FBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUFOLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsS0FFQSxHQUFRLE9BQUEsQ0FBUSxrQkFBUixDQUZSLENBQUE7O0FBQUEsTUFJQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUpULENBQUE7O0FBQUEsaUJBTUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSLENBTnBCLENBQUE7O0FBQUEsbUJBT0EsR0FBc0IsT0FBQSxDQUFRLHdCQUFSLENBUHRCLENBQUE7O0FBQUEsaUJBUUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSLENBUnBCLENBQUE7O0FBQUEsZUFTQSxHQUFrQixPQUFBLENBQVEsb0JBQVIsQ0FUbEIsQ0FBQTs7QUFBQSxZQVdBLEdBQWUsT0FBQSxDQUFRLCtCQUFSLENBWGYsQ0FBQTs7QUFBQSxXQVlBLEdBQWMsT0FBQSxDQUFRLDJCQUFSLENBWmQsQ0FBQTs7QUFBQSxNQWlCTSxDQUFDLE9BQVAsR0FBdUI7QUFHUixFQUFBLGtCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsb0RBQUE7QUFBQSwwQkFEWSxPQUErRCxJQUE3RCxZQUFBLE1BQU0sSUFBQyxDQUFBLGlCQUFBLFdBQVcsSUFBQyxDQUFBLFVBQUEsSUFBSSxrQkFBQSxZQUFZLGFBQUEsT0FBTyxjQUFBLFFBQVEsY0FBQSxNQUNoRSxDQUFBO0FBQUEsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFhLDhCQUFiLENBQUEsQ0FBQTtBQUVBLElBQUEsSUFBRyxVQUFIO0FBQ0UsTUFBQSxRQUFzQixRQUFRLENBQUMsZUFBVCxDQUF5QixVQUF6QixDQUF0QixFQUFFLElBQUMsQ0FBQSxrQkFBQSxTQUFILEVBQWMsSUFBQyxDQUFBLFdBQUEsRUFBZixDQURGO0tBRkE7QUFBQSxJQUtBLElBQUMsQ0FBQSxVQUFELEdBQWlCLElBQUMsQ0FBQSxTQUFELElBQWMsSUFBQyxDQUFBLEVBQWxCLEdBQ1osRUFBQSxHQUFMLElBQUMsQ0FBQSxTQUFJLEdBQWdCLEdBQWhCLEdBQUwsSUFBQyxDQUFBLEVBRGdCLEdBQUEsTUFMZCxDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsU0FBRCxHQUFhLENBQUEsQ0FBRyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsQ0FBSCxDQUFxQixDQUFDLElBQXRCLENBQTJCLE9BQTNCLENBUmIsQ0FBQTtBQUFBLElBU0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBQSxDQVRULENBQUE7QUFBQSxJQVdBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBQSxJQUFTLEtBQUssQ0FBQyxRQUFOLENBQWdCLElBQUMsQ0FBQSxFQUFqQixDQVhsQixDQUFBO0FBQUEsSUFZQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BQUEsSUFBVSxFQVpwQixDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BYlYsQ0FBQTtBQUFBLElBY0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxFQWRaLENBQUE7QUFBQSxJQWdCQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBaEJBLENBRFc7RUFBQSxDQUFiOztBQUFBLHFCQXFCQSxXQUFBLEdBQWEsU0FBQSxHQUFBO1dBQ1AsSUFBQSxZQUFBLENBQWE7QUFBQSxNQUFBLFFBQUEsRUFBVSxJQUFWO0tBQWIsRUFETztFQUFBLENBckJiLENBQUE7O0FBQUEscUJBeUJBLFVBQUEsR0FBWSxTQUFDLFlBQUQsRUFBZSxVQUFmLEdBQUE7QUFDVixRQUFBLDhCQUFBO0FBQUEsSUFBQSxpQkFBQSxlQUFpQixJQUFDLENBQUEsV0FBRCxDQUFBLEVBQWpCLENBQUE7QUFBQSxJQUNBLEtBQUEsR0FBUSxJQUFDLENBQUEsU0FBUyxDQUFDLEtBQVgsQ0FBQSxDQURSLENBQUE7QUFBQSxJQUVBLFVBQUEsR0FBYSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFNLENBQUEsQ0FBQSxDQUF0QixDQUZiLENBQUE7V0FJQSxXQUFBLEdBQWtCLElBQUEsV0FBQSxDQUNoQjtBQUFBLE1BQUEsS0FBQSxFQUFPLFlBQVA7QUFBQSxNQUNBLEtBQUEsRUFBTyxLQURQO0FBQUEsTUFFQSxVQUFBLEVBQVksVUFGWjtBQUFBLE1BR0EsVUFBQSxFQUFZLFVBSFo7S0FEZ0IsRUFMUjtFQUFBLENBekJaLENBQUE7O0FBQUEscUJBcUNBLFNBQUEsR0FBVyxTQUFDLElBQUQsR0FBQTtBQUdULElBQUEsSUFBQSxHQUFPLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFSLENBQWUsU0FBQyxLQUFELEdBQUE7YUFDcEIsSUFBQyxDQUFBLFFBQUQsS0FBWSxFQURRO0lBQUEsQ0FBZixDQUFQLENBQUE7QUFBQSxJQUlBLE1BQUEsQ0FBTyxJQUFJLENBQUMsTUFBTCxLQUFlLENBQXRCLEVBQTBCLDBEQUFBLEdBQXlELElBQUMsQ0FBQSxVQUExRCxHQUFzRSxjQUF0RSxHQUE3QixJQUFJLENBQUMsTUFBRixDQUpBLENBQUE7V0FNQSxLQVRTO0VBQUEsQ0FyQ1gsQ0FBQTs7QUFBQSxxQkFnREEsYUFBQSxHQUFlLFNBQUEsR0FBQTtBQUNiLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFVLENBQUEsQ0FBQSxDQUFsQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQURkLENBQUE7V0FHQSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsU0FBRCxHQUFBO0FBQ2YsZ0JBQU8sU0FBUyxDQUFDLElBQWpCO0FBQUEsZUFDTyxVQURQO21CQUVJLEtBQUMsQ0FBQSxjQUFELENBQWdCLFNBQVMsQ0FBQyxJQUExQixFQUFnQyxTQUFTLENBQUMsSUFBMUMsRUFGSjtBQUFBLGVBR08sV0FIUDttQkFJSSxLQUFDLENBQUEsZUFBRCxDQUFpQixTQUFTLENBQUMsSUFBM0IsRUFBaUMsU0FBUyxDQUFDLElBQTNDLEVBSko7QUFBQSxlQUtPLE1BTFA7bUJBTUksS0FBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsSUFBdEIsRUFBNEIsU0FBUyxDQUFDLElBQXRDLEVBTko7QUFBQSxTQURlO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFKYTtFQUFBLENBaERmLENBQUE7O0FBQUEscUJBZ0VBLGlCQUFBLEdBQW1CLFNBQUMsSUFBRCxHQUFBO0FBQ2pCLFFBQUEsK0JBQUE7QUFBQSxJQUFBLFFBQUEsR0FBZSxJQUFBLGlCQUFBLENBQWtCLElBQWxCLENBQWYsQ0FBQTtBQUFBLElBQ0EsVUFBQSxHQUFpQixJQUFBLG1CQUFBLENBQUEsQ0FEakIsQ0FBQTtBQUdBLFdBQU0sSUFBQSxHQUFPLFFBQVEsQ0FBQyxXQUFULENBQUEsQ0FBYixHQUFBO0FBQ0UsTUFBQSxTQUFBLEdBQVksaUJBQWlCLENBQUMsS0FBbEIsQ0FBd0IsSUFBeEIsQ0FBWixDQUFBO0FBQ0EsTUFBQSxJQUE2QixTQUE3QjtBQUFBLFFBQUEsVUFBVSxDQUFDLEdBQVgsQ0FBZSxTQUFmLENBQUEsQ0FBQTtPQUZGO0lBQUEsQ0FIQTtXQU9BLFdBUmlCO0VBQUEsQ0FoRW5CLENBQUE7O0FBQUEscUJBNkVBLGNBQUEsR0FBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxRQUFBLDJCQUFBO0FBQUEsSUFBQSxRQUFBLEdBQWUsSUFBQSxpQkFBQSxDQUFrQixJQUFsQixDQUFmLENBQUE7QUFBQSxJQUNBLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFBLENBRHBCLENBQUE7QUFHQSxXQUFNLElBQUEsR0FBTyxRQUFRLENBQUMsV0FBVCxDQUFBLENBQWIsR0FBQTtBQUNFLE1BQUEsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQXJCLEVBQTJCLGlCQUEzQixDQUFBLENBREY7SUFBQSxDQUhBO1dBTUEsa0JBUGM7RUFBQSxDQTdFaEIsQ0FBQTs7QUFBQSxxQkF1RkEsY0FBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDZCxRQUFBLG1CQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsSUFDQSxLQUFLLENBQUMsUUFBTixDQUFlLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMUIsQ0FEQSxDQUFBO0FBQUEsSUFHQSxZQUFBLEdBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsU0FBaEIsQ0FIZixDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUEsQ0FBVixHQUFxQixZQUFILEdBQXFCLFlBQXJCLEdBQXVDLEVBSnpELENBQUE7V0FLQSxJQUFJLENBQUMsU0FBTCxHQUFpQixHQU5IO0VBQUEsQ0F2RmhCLENBQUE7O0FBQUEscUJBZ0dBLGVBQUEsR0FBaUIsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO1dBRWYsSUFBSSxDQUFDLFNBQUwsR0FBaUIsR0FGRjtFQUFBLENBaEdqQixDQUFBOztBQUFBLHFCQXFHQSxVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO0FBQ1YsUUFBQSxZQUFBO0FBQUEsSUFBQSxZQUFBLEdBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsU0FBaEIsQ0FBZixDQUFBO0FBQ0EsSUFBQSxJQUFrQyxZQUFsQztBQUFBLE1BQUEsSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFBLENBQVYsR0FBa0IsWUFBbEIsQ0FBQTtLQURBO1dBRUEsSUFBSSxDQUFDLFNBQUwsR0FBaUIsR0FIUDtFQUFBLENBckdaLENBQUE7O0FBQUEscUJBOEdBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUixRQUFBLEdBQUE7QUFBQSxJQUFBLEdBQUEsR0FDRTtBQUFBLE1BQUEsVUFBQSxFQUFZLElBQUMsQ0FBQSxVQUFiO0tBREYsQ0FBQTtXQUtBLEtBQUssQ0FBQyxZQUFOLENBQW1CLEdBQW5CLEVBTlE7RUFBQSxDQTlHVixDQUFBOztrQkFBQTs7SUFwQkYsQ0FBQTs7QUFBQSxRQThJUSxDQUFDLGVBQVQsR0FBMkIsU0FBQyxVQUFELEdBQUE7QUFDekIsTUFBQSxLQUFBO0FBQUEsRUFBQSxJQUFBLENBQUEsVUFBQTtBQUFBLFVBQUEsQ0FBQTtHQUFBO0FBQUEsRUFFQSxLQUFBLEdBQVEsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FGUixDQUFBO0FBR0EsRUFBQSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0U7QUFBQSxNQUFFLFNBQUEsRUFBVyxNQUFiO0FBQUEsTUFBd0IsRUFBQSxFQUFJLEtBQU0sQ0FBQSxDQUFBLENBQWxDO01BREY7R0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDSDtBQUFBLE1BQUUsU0FBQSxFQUFXLEtBQU0sQ0FBQSxDQUFBLENBQW5CO0FBQUEsTUFBdUIsRUFBQSxFQUFJLEtBQU0sQ0FBQSxDQUFBLENBQWpDO01BREc7R0FBQSxNQUFBO1dBR0gsR0FBRyxDQUFDLEtBQUosQ0FBVywrQ0FBQSxHQUFkLFVBQUcsRUFIRztHQU5vQjtBQUFBLENBOUkzQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzLmpzJyk7XG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2xpYi9pc19hcmd1bWVudHMuanMnKTtcblxudmFyIGRlZXBFcXVhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRGF0ZSAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMy4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgYWN0dWFsICE9ICdvYmplY3QnICYmIHR5cGVvZiBleHBlY3RlZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcHRzLnN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy40LiBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID0gKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKVxufSkoKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA/IHN1cHBvcnRlZCA6IHVuc3VwcG9ydGVkO1xuXG5leHBvcnRzLnN1cHBvcnRlZCA9IHN1cHBvcnRlZDtcbmZ1bmN0aW9uIHN1cHBvcnRlZChvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuZnVuY3Rpb24gdW5zdXBwb3J0ZWQob2JqZWN0KXtcbiAgcmV0dXJuIG9iamVjdCAmJlxuICAgIHR5cGVvZiBvYmplY3QgPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdjYWxsZWUnKSAmJlxuICAgICFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCAnY2FsbGVlJykgfHxcbiAgICBmYWxzZTtcbn07XG4iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbidcbiAgPyBPYmplY3Qua2V5cyA6IHNoaW07XG5cbmV4cG9ydHMuc2hpbSA9IHNoaW07XG5mdW5jdGlvbiBzaGltIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gIHJldHVybiBrZXlzO1xufVxuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi42IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG5cdCAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cblx0ICpcblx0ICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cblx0ICovXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cblx0Ly8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblx0dmFyIGV4cG9ydHMgPSB0aGlzO1xuXHR2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXQncyBzdG9yYWdlIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cblx0ICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuXHRcdHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHQvKipcblx0ICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2Rcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcblx0XHRcdHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cblx0ICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuXHQgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG5cdFx0Ly8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fTtcblxuXHQvKipcblx0ICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcblx0XHR2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRyZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG5cdCAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuXHQgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcblx0XHRcdFx0bGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuXHRcdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdFx0XHRvbmNlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG5cdCAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGZpcnN0IGV4ZWN1dGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcblx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdG9uY2U6IHRydWVcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuXHQgKi9cblx0cHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cblx0ICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG5cdFx0dGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBpbmRleDtcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgdmFsdWU7XG5cdFx0dmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuXHRcdHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cblx0XHQvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0J3MgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcblx0XHRcdGZvciAoaSBpbiBldnQpIHtcblx0XHRcdFx0aWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG5cdFx0XHRcdFx0Ly8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuXHRcdFx0XHRcdFx0bXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcblx0XHRcdC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcblx0XHRcdC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG5cdFx0XHRpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cblx0ICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcblx0XHR2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuXHRcdGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcblx0XHRcdGRlbGV0ZSBldmVudHNbZXZ0XTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcblx0XHRcdGRlbGV0ZSB0aGlzLl9ldmVudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuXHQgKlxuXHQgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuXHQgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cblx0ICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuXHQgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG5cdCAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGtleTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuXHRcdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cblx0XHRcdFx0XHRpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgZW1pdEV2ZW50XG5cdCAqL1xuXHRwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG5cdCAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuXHQgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG5cdFx0dGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG5cdCAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuXHQgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuXHRcdGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcblx0fTtcblxuXHQvKipcblx0ICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuXHQgKi9cblx0RXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuXHRcdGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcblx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9O1xuXG5cdC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0XHR9KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhpcy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cdH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRG9jdW1lbnQgPSByZXF1aXJlKCcuL2RvY3VtZW50JylcblNuaXBwZXRUcmVlID0gcmVxdWlyZSgnLi9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlJylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbicpXG5kZXNpZ25DYWNoZSA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbl9jYWNoZScpXG5FZGl0b3JQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkb2MgPSBkbyAtPlxuXG4gIGVkaXRvclBhZ2UgPSBuZXcgRWRpdG9yUGFnZSgpXG5cblxuICAjIEluc3RhbnRpYXRpb24gcHJvY2VzczpcbiAgIyBhc3luYyBvciBzeW5jIC0+IGdldCBkZXNpZ24gKGluY2x1ZGUganMgZm9yIHN5bmNocm9ub3VzIGxvYWRpbmcpXG4gICMgc3luYyAtPiBjcmVhdGUgZG9jdW1lbnRcbiAgIyBhc3luYyAtPiBjcmVhdGUgdmlldyAoaWZyYW1lKVxuICAjIGFzeW5jIC0+IGxvYWQgcmVzb3VyY2VzIGludG8gdmlld1xuXG5cbiAgIyBMb2FkIGEgZG9jdW1lbnQgZnJvbSBzZXJpYWxpemVkIGRhdGFcbiAgIyBpbiBhIHN5bmNocm9ub3VzIHdheS4gRGVzaWduIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICBuZXc6ICh7IGRhdGEsIGRlc2lnbiB9KSAtPlxuICAgIHNuaXBwZXRUcmVlID0gaWYgZGF0YT9cbiAgICAgIGRlc2lnbk5hbWUgPSBkYXRhLmRlc2lnbj8ubmFtZVxuICAgICAgYXNzZXJ0IGRlc2lnbk5hbWU/LCAnRXJyb3IgY3JlYXRpbmcgZG9jdW1lbnQ6IE5vIGRlc2lnbiBpcyBzcGVjaWZpZWQuJ1xuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShjb250ZW50OiBkYXRhLCBkZXNpZ246IGRlc2lnbilcbiAgICBlbHNlXG4gICAgICBkZXNpZ25OYW1lID0gZGVzaWduXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGRlc2lnbjogZGVzaWduKVxuXG4gICAgQGNyZWF0ZShzbmlwcGV0VHJlZSlcblxuXG4gICMgVG9kbzogYWRkIGFzeW5jIGFwaSAoYXN5bmMgYmVjYXVzZSBvZiB0aGUgbG9hZGluZyBvZiB0aGUgZGVzaWduKVxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBkb2MubG9hZChqc29uRnJvbVNlcnZlcilcbiAgIyAgLnRoZW4gKGRvY3VtZW50KSAtPlxuICAjICAgIGRvY3VtZW50LmNyZWF0ZVZpZXcoJy5jb250YWluZXInLCB7IGludGVyYWN0aXZlOiB0cnVlIH0pXG4gICMgIC50aGVuICh2aWV3KSAtPlxuICAjICAgICMgdmlldyBpcyByZWFkeVxuXG5cbiAgIyBEaXJlY3QgY3JlYXRpb24gd2l0aCBhbiBleGlzdGluZyBTbmlwcGV0VHJlZVxuICBjcmVhdGU6IChzbmlwcGV0VHJlZSkgLT5cbiAgICBuZXcgRG9jdW1lbnQoeyBzbmlwcGV0VHJlZSB9KVxuXG5cbiAgIyBTZWUgZGVzaWduQ2FjaGUubG9hZCBmb3IgZXhhbXBsZXMgaG93IHRvIGxvYWQgeW91ciBkZXNpZ24uXG4gIGRlc2lnbjogZGVzaWduQ2FjaGVcblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuICBjb25maWc6ICh1c2VyQ29uZmlnKSAtPlxuICAgICQuZXh0ZW5kKHRydWUsIGNvbmZpZywgdXNlckNvbmZpZylcblxuXG4jIEV4cG9ydCBnbG9iYWwgdmFyaWFibGVcbndpbmRvdy5kb2MgPSBkb2NcbiIsIiMgQ29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpZyA9IGRvIC0+XG5cbiAgIyBMb2FkIGNzcyBhbmQganMgcmVzb3VyY2VzIGluIHBhZ2VzIGFuZCBpbnRlcmFjdGl2ZSBwYWdlc1xuICBsb2FkUmVzb3VyY2VzOiB0cnVlXG5cbiAgIyBTZXR1cCBwYXRocyB0byBsb2FkIHJlc291cmNlcyBkeW5hbWljYWxseVxuICBkZXNpZ25QYXRoOiAnL2Rlc2lnbnMnXG4gIGxpdmluZ2RvY3NDc3NGaWxlOiAnL2Fzc2V0cy9jc3MvbGl2aW5nZG9jcy5jc3MnXG5cbiAgd29yZFNlcGFyYXRvcnM6IFwiLi9cXFxcKClcXFwiJzosLjs8Pn4hIyVeJip8Kz1bXXt9YH4/XCJcblxuICAjIHN0cmluZyBjb250YWlubmcgb25seSBhIDxicj4gZm9sbG93ZWQgYnkgd2hpdGVzcGFjZXNcbiAgc2luZ2xlTGluZUJyZWFrOiAvXjxiclxccypcXC8/PlxccyokL1xuXG4gIGF0dHJpYnV0ZVByZWZpeDogJ2RhdGEnXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBzbmlwcGV0IGNsYXNzZXNcbiAgICBzbmlwcGV0OiAnZG9jLXNuaXBwZXQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBzbmlwcGV0SGlnaGxpZ2h0OiAnZG9jLXNuaXBwZXQtaGlnaGxpZ2h0J1xuICAgIGNvbnRhaW5lckhpZ2hsaWdodDogJ2RvYy1jb250YWluZXItaGlnaGxpZ2h0J1xuXG4gICAgIyBkcmFnICYgZHJvcFxuICAgIGRyYWdnZWQ6ICdkb2MtZHJhZ2dlZCdcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXI6ICdkb2MtZHJhZ2dlZC1wbGFjZWhvbGRlcidcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyOiAnZG9jLWRyYWctY291bnRlcidcbiAgICBkcm9wTWFya2VyOiAnZG9jLWRyb3AtbWFya2VyJ1xuICAgIGJlZm9yZURyb3A6ICdkb2MtYmVmb3JlLWRyb3AnXG4gICAgbm9Ecm9wOiAnZG9jLWRyYWctbm8tZHJvcCdcbiAgICBhZnRlckRyb3A6ICdkb2MtYWZ0ZXItZHJvcCdcbiAgICBsb25ncHJlc3NJbmRpY2F0b3I6ICdkb2MtbG9uZ3ByZXNzLWluZGljYXRvcidcblxuICAgICMgdXRpbGl0eSBjbGFzc2VzXG4gICAgcHJldmVudFNlbGVjdGlvbjogJ2RvYy1uby1zZWxlY3Rpb24nXG4gICAgbWF4aW1pemVkQ29udGFpbmVyOiAnZG9jLWpzLW1heGltaXplZC1jb250YWluZXInXG4gICAgaW50ZXJhY3Rpb25CbG9ja2VyOiAnZG9jLWludGVyYWN0aW9uLWJsb2NrZXInXG5cbiAgIyBhdHRyaWJ1dGVzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgYXR0cjpcbiAgICB0ZW1wbGF0ZTogJ2RhdGEtZG9jLXRlbXBsYXRlJ1xuICAgIHBsYWNlaG9sZGVyOiAnZGF0YS1kb2MtcGxhY2Vob2xkZXInXG5cblxuICAjIEtpY2tzdGFydCBjb25maWdcbiAga2lja3N0YXJ0OlxuICAgIGF0dHI6XG4gICAgICBzdHlsZXM6ICdkb2Mtc3R5bGVzJ1xuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvbiB3aXRoIHNob3J0aGFuZHMgYW5kIGNvbXB1dGVkIHZhbHVlcy5cbmVucmljaENvbmZpZyA9IC0+XG5cbiAgIyBTaG9ydGhhbmRzIGZvciBzdHVmZiB0aGF0IGlzIHVzZWQgYWxsIG92ZXIgdGhlIHBsYWNlIHRvIG1ha2VcbiAgIyBjb2RlIGFuZCBzcGVjcyBtb3JlIHJlYWRhYmxlLlxuICBAZG9jRGlyZWN0aXZlID0ge31cbiAgQHRlbXBsYXRlQXR0ckxvb2t1cCA9IHt9XG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIEBkaXJlY3RpdmVzXG5cbiAgICAjIENyZWF0ZSB0aGUgcmVuZGVyZWRBdHRycyBmb3IgdGhlIGRpcmVjdGl2ZXNcbiAgICAjIChwcmVwZW5kIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggdGhlIGNvbmZpZ3VyZWQgcHJlZml4KVxuICAgIHByZWZpeCA9IFwiI3sgQGF0dHJpYnV0ZVByZWZpeCB9LVwiIGlmIEBhdHRyaWJ1dGVQcmVmaXhcbiAgICB2YWx1ZS5yZW5kZXJlZEF0dHIgPSBcIiN7IHByZWZpeCB8fCAnJyB9I3sgdmFsdWUuYXR0ciB9XCJcblxuICAgIEBkb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBAdGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG5cbmVucmljaENvbmZpZy5jYWxsKGNvbmZpZylcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnblN0eWxlID0gcmVxdWlyZSgnLi9kZXNpZ25fc3R5bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gIGNvbnN0cnVjdG9yOiAoZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlcyA9IGRlc2lnbi50ZW1wbGF0ZXMgfHwgZGVzaWduLnNuaXBwZXRzXG4gICAgY29uZmlnID0gZGVzaWduLmNvbmZpZ1xuICAgIGdyb3VwcyA9IGRlc2lnbi5jb25maWcuZ3JvdXBzIHx8IGRlc2lnbi5ncm91cHNcblxuICAgIEBuYW1lc3BhY2UgPSBjb25maWc/Lm5hbWVzcGFjZSB8fCAnbGl2aW5nZG9jcy10ZW1wbGF0ZXMnXG4gICAgQHBhcmFncmFwaFNuaXBwZXQgPSBjb25maWc/LnBhcmFncmFwaCB8fCAndGV4dCdcbiAgICBAY3NzID0gY29uZmlnLmNzc1xuICAgIEBqcyA9IGNvbmZpZy5qc1xuICAgIEBmb250cyA9IGNvbmZpZy5mb250c1xuICAgIEB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBncm91cHMgPSB7fVxuICAgIEBzdHlsZXMgPSB7fVxuXG4gICAgQHN0b3JlVGVtcGxhdGVEZWZpbml0aW9ucyh0ZW1wbGF0ZXMpXG4gICAgQGdsb2JhbFN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZGVzaWduLmNvbmZpZy5zdHlsZXMpXG4gICAgQGFkZEdyb3Vwcyhncm91cHMpXG4gICAgQGFkZFRlbXBsYXRlc05vdEluR3JvdXBzKClcblxuXG4gIHN0b3JlVGVtcGxhdGVEZWZpbml0aW9uczogKHRlbXBsYXRlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9ucyA9IHt9XG4gICAgZm9yIHRlbXBsYXRlIGluIHRlbXBsYXRlc1xuICAgICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcblxuXG4gICMgcGFzcyB0aGUgdGVtcGxhdGUgYXMgb2JqZWN0XG4gICMgZS5nIGFkZCh7aWQ6IFwidGl0bGVcIiwgbmFtZTpcIlRpdGxlXCIsIGh0bWw6IFwiPGgxIGRvYy1lZGl0YWJsZT5UaXRsZTwvaDE+XCJ9KVxuICBhZGQ6ICh0ZW1wbGF0ZURlZmluaXRpb24sIHN0eWxlcykgLT5cbiAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZURlZmluaXRpb24uaWRdID0gdW5kZWZpbmVkXG4gICAgdGVtcGxhdGVPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbih0ZW1wbGF0ZURlZmluaXRpb24uc3R5bGVzKVxuICAgIHRlbXBsYXRlU3R5bGVzID0gJC5leHRlbmQoe30sIHN0eWxlcywgdGVtcGxhdGVPbmx5U3R5bGVzKVxuXG4gICAgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGVcbiAgICAgIG5hbWVzcGFjZTogQG5hbWVzcGFjZVxuICAgICAgaWQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5pZFxuICAgICAgdGl0bGU6IHRlbXBsYXRlRGVmaW5pdGlvbi50aXRsZVxuICAgICAgc3R5bGVzOiB0ZW1wbGF0ZVN0eWxlc1xuICAgICAgaHRtbDogdGVtcGxhdGVEZWZpbml0aW9uLmh0bWxcbiAgICAgIHdlaWdodDogdGVtcGxhdGVEZWZpbml0aW9uLnNvcnRPcmRlciB8fCAwXG5cbiAgICBAdGVtcGxhdGVzLnB1c2godGVtcGxhdGUpXG4gICAgdGVtcGxhdGVcblxuXG4gIGFkZEdyb3VwczogKGNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGdyb3VwTmFtZSwgZ3JvdXAgb2YgY29sbGVjdGlvblxuICAgICAgZ3JvdXBPbmx5U3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihncm91cC5zdHlsZXMpXG4gICAgICBncm91cFN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBAZ2xvYmFsU3R5bGVzLCBncm91cE9ubHlTdHlsZXMpXG5cbiAgICAgIHRlbXBsYXRlcyA9IHt9XG4gICAgICBmb3IgdGVtcGxhdGVJZCBpbiBncm91cC50ZW1wbGF0ZXNcbiAgICAgICAgdGVtcGxhdGVEZWZpbml0aW9uID0gQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVJZF1cbiAgICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgICAgdGVtcGxhdGUgPSBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgZ3JvdXBTdHlsZXMpXG4gICAgICAgICAgdGVtcGxhdGVzW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cud2FybihcIlRoZSB0ZW1wbGF0ZSAnI3t0ZW1wbGF0ZUlkfScgcmVmZXJlbmNlZCBpbiB0aGUgZ3JvdXAgJyN7Z3JvdXBOYW1lfScgZG9lcyBub3QgZXhpc3QuXCIpXG5cbiAgICAgIEBhZGRHcm91cChncm91cE5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpXG5cblxuICBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwczogKGdsb2JhbFN0eWxlcykgLT5cbiAgICBmb3IgdGVtcGxhdGVJZCwgdGVtcGxhdGVEZWZpbml0aW9uIG9mIEB0ZW1wbGF0ZURlZmluaXRpb25zXG4gICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIEBnbG9iYWxTdHlsZXMpXG5cblxuICBhZGRHcm91cDogKG5hbWUsIGdyb3VwLCB0ZW1wbGF0ZXMpIC0+XG4gICAgQGdyb3Vwc1tuYW1lXSA9XG4gICAgICB0aXRsZTogZ3JvdXAudGl0bGVcbiAgICAgIHRlbXBsYXRlczogdGVtcGxhdGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb246IChzdHlsZXMpIC0+XG4gICAgZGVzaWduU3R5bGVzID0ge31cbiAgICBpZiBzdHlsZXNcbiAgICAgIGZvciBzdHlsZURlZmluaXRpb24gaW4gc3R5bGVzXG4gICAgICAgIGRlc2lnblN0eWxlID0gQGNyZWF0ZURlc2lnblN0eWxlKHN0eWxlRGVmaW5pdGlvbilcbiAgICAgICAgZGVzaWduU3R5bGVzW2Rlc2lnblN0eWxlLm5hbWVdID0gZGVzaWduU3R5bGUgaWYgZGVzaWduU3R5bGVcblxuICAgIGRlc2lnblN0eWxlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGU6IChzdHlsZURlZmluaXRpb24pIC0+XG4gICAgaWYgc3R5bGVEZWZpbml0aW9uICYmIHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICBuZXcgRGVzaWduU3R5bGVcbiAgICAgICAgbmFtZTogc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgICAgdHlwZTogc3R5bGVEZWZpbml0aW9uLnR5cGVcbiAgICAgICAgb3B0aW9uczogc3R5bGVEZWZpbml0aW9uLm9wdGlvbnNcbiAgICAgICAgdmFsdWU6IHN0eWxlRGVmaW5pdGlvbi52YWx1ZVxuXG5cbiAgcmVtb3ZlOiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgQHRlbXBsYXRlcy5zcGxpY2UoQGdldEluZGV4KGlkKSwgMSlcblxuXG4gIGdldDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIHRlbXBsYXRlID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaW5kZXgpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICB0ZW1wbGF0ZSA9IHRcblxuICAgICAgdGVtcGxhdGVcblxuXG4gIGdldEluZGV4OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgaW5kZXggPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpKSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgaW5kZXggPSBpXG5cbiAgICAgIGluZGV4XG5cblxuICBjaGVja05hbWVzcGFjZTogKGlkZW50aWZpZXIsIGNhbGxiYWNrKSAtPlxuICAgIHsgbmFtZXNwYWNlLCBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgbm90IG5hbWVzcGFjZSBvciBAbmFtZXNwYWNlIGlzIG5hbWVzcGFjZSxcbiAgICAgIFwiZGVzaWduICN7IEBuYW1lc3BhY2UgfTogY2Fubm90IGdldCB0ZW1wbGF0ZSB3aXRoIGRpZmZlcmVudCBuYW1lc3BhY2UgI3sgbmFtZXNwYWNlIH0gXCJcblxuICAgIGNhbGxiYWNrKGlkKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciB0ZW1wbGF0ZSwgaW5kZXggaW4gQHRlbXBsYXRlc1xuICAgICAgY2FsbGJhY2sodGVtcGxhdGUsIGluZGV4KVxuXG5cbiAgIyBsaXN0IGF2YWlsYWJsZSBUZW1wbGF0ZXNcbiAgbGlzdDogLT5cbiAgICB0ZW1wbGF0ZXMgPSBbXVxuICAgIEBlYWNoICh0ZW1wbGF0ZSkgLT5cbiAgICAgIHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICB0ZW1wbGF0ZXNcblxuXG4gICMgcHJpbnQgZG9jdW1lbnRhdGlvbiBmb3IgYSB0ZW1wbGF0ZVxuICBpbmZvOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXQoaWRlbnRpZmllcilcbiAgICB0ZW1wbGF0ZS5wcmludERvYygpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlc2lnbnM6IHt9XG5cbiAgIyBDYW4gbG9hZCBhIGRlc2lnbiBzeW5jaHJvbm91c2x5IGlmIHlvdSBpbmNsdWRlIHRoZVxuICAjIGRlc2lnbi5qcyBmaWxlIGJlZm9yZSBsaXZpbmdkb2NzLlxuICAjIGRvYy5kZXNpZ24ubG9hZChkZXNpZ25zWyd5b3VyRGVzaWduJ10pXG4gICNcbiAgIyBXaWxsIGJlIGV4dGVuZGVkIHRvIGxvYWQgZGVzaWducyByZW1vdGVseSBmcm9tIGEgc2VydmVyOlxuICAjIExvYWQgZnJvbSB0aGUgZGVmYXVsdCBzb3VyY2U6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdnaGlibGknKVxuICAjXG4gICMgTG9hZCBmcm9tIGEgY3VzdG9tIHNlcnZlcjpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2h0dHA6Ly95b3Vyc2VydmVyLmlvL2Rlc2lnbnMvZ2hpYmxpL2Rlc2lnbi5qc29uJylcbiAgbG9hZDogKG5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIG5hbWUgPT0gJ3N0cmluZydcbiAgICAgIGFzc2VydCBmYWxzZSwgJ0xvYWQgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkIHlldC4nXG4gICAgZWxzZVxuICAgICAgZGVzaWduQ29uZmlnID0gbmFtZVxuICAgICAgZGVzaWduID0gbmV3IERlc2lnbihkZXNpZ25Db25maWcpXG4gICAgICBAYWRkKGRlc2lnbilcblxuXG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBuYW1lID0gZGVzaWduLm5hbWVzcGFjZVxuICAgIEBkZXNpZ25zW25hbWVdID0gZGVzaWduXG5cblxuICBoYXM6IChuYW1lKSAtPlxuICAgIEBkZXNpZ25zW25hbWVdP1xuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGhhcyhuYW1lKSwgXCJFcnJvcjogZGVzaWduICcjeyBuYW1lIH0nIGlzIG5vdCBsb2FkZWQuXCJcbiAgICBAZGVzaWduc1tuYW1lXVxuXG5cbiAgcmVzZXRDYWNoZTogLT5cbiAgICBAZGVzaWducyA9IHt9XG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduU3R5bGVcblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgc25pcHBldCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBEZXNpZ25TdHlsZSN2YWxpZGF0ZVZhbHVlKCkgZm9yIHR5cGUgI3sgQHR5cGUgfVwiXG5cblxuICBjb250YWluc09wdGlvbjogKHZhbHVlKSAtPlxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIHJldHVybiB0cnVlIGlmIHZhbHVlIGlzIG9wdGlvbi52YWx1ZVxuXG4gICAgZmFsc2VcblxuXG4gIG90aGVyT3B0aW9uczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcblxuXG4gIG90aGVyQ2xhc3NlczogKHZhbHVlKSAtPlxuICAgIG90aGVycyA9IFtdXG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgb3RoZXJzLnB1c2ggb3B0aW9uLnZhbHVlIGlmIG9wdGlvbi52YWx1ZSBpc250IHZhbHVlXG5cbiAgICBvdGhlcnNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5QYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZy9yZW5kZXJlcicpXG5WaWV3ID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvdmlldycpXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERvY3VtZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgc25pcHBldFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gc25pcHBldFRyZWUuZGVzaWduXG4gICAgQHNldFNuaXBwZXRUcmVlKHNuaXBwZXRUcmVlKVxuICAgIEB2aWV3cyA9IHt9XG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuXG5cbiAgc2V0U25pcHBldFRyZWU6IChzbmlwcGV0VHJlZSkgLT5cbiAgICBhc3NlcnQgc25pcHBldFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnU25pcHBldFRyZWUgbXVzdCBoYXZlIHRoZSBzYW1lIGRlc2lnbiBhcyB0aGUgZG9jdW1lbnQnXG5cbiAgICBAbW9kZWwgPSBAc25pcHBldFRyZWUgPSBzbmlwcGV0VHJlZVxuICAgIEBmb3J3YXJkU25pcHBldFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucykgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zID89IHJlYWRPbmx5OiB0cnVlXG5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcblxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQHNuaXBwZXRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHByb21pc2UgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG5cbiAgICBwcm9taXNlXG5cblxuICAjIEEgdmlldyBzb21ldGltZXMgaGFzIHRvIGJlIHdyYXBwZWQgaW4gYSBjb250YWluZXIuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIEhlcmUgdGhlIGRvY3VtZW50IGlzIHJlbmRlcmVkIGludG8gJCgnLmRvYy1zZWN0aW9uJylcbiAgIyA8ZGl2IGNsYXNzPVwiaWZyYW1lLWNvbnRhaW5lclwiPlxuICAjICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj48L3NlY3Rpb24+XG4gICMgPC9kaXY+XG4gIGZpbmRXcmFwcGVyOiAoJHBhcmVudCkgLT5cbiAgICBpZiAkcGFyZW50LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIikubGVuZ3RoID09IDFcbiAgICAgICR3cmFwcGVyID0gJCgkcGFyZW50Lmh0bWwoKSlcblxuICAgICR3cmFwcGVyXG5cblxuICBzZXRJbnRlcmFjdGl2ZVZpZXc6ICh2aWV3KSAtPlxuICAgIGFzc2VydCBub3QgQGludGVyYWN0aXZlVmlldz8sXG4gICAgICAnRXJyb3IgY3JlYXRpbmcgaW50ZXJhY3RpdmUgdmlldzogRG9jdW1lbnQgY2FuIGhhdmUgb25seSBvbmUgaW50ZXJhY3RpdmUgdmlldydcblxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB2aWV3XG5cblxuICB0b0h0bWw6IC0+XG4gICAgbmV3IFJlbmRlcmVyKFxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcbiAgICApLmh0bWwoKVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zZXJpYWxpemUoKVxuXG5cbiAgdG9Kc29uOiAocHJldHRpZnkpIC0+XG4gICAgZGF0YSA9IEBzZXJpYWxpemUoKVxuICAgIGlmIHByZXR0aWZ5P1xuICAgICAgcmVwbGFjZXIgPSBudWxsXG4gICAgICBzcGFjZSA9IDJcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEsIHJlcGxhY2VyLCBzcGFjZSlcbiAgICBlbHNlXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhKVxuXG5cbiAgIyBEZWJ1Z1xuICAjIC0tLS0tXG5cbiAgIyBQcmludCB0aGUgU25pcHBldFRyZWUuXG4gIHByaW50TW9kZWw6ICgpIC0+XG4gICAgQHNuaXBwZXRUcmVlLnByaW50KClcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERPTSBoZWxwZXIgbWV0aG9kc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiMgTWV0aG9kcyB0byBwYXJzZSBhbmQgdXBkYXRlIHRoZSBEb20gdHJlZSBpbiBhY2NvcmRhbmNlIHRvXG4jIHRoZSBTbmlwcGV0VHJlZSBhbmQgTGl2aW5nZG9jcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG4gIHNuaXBwZXRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNuaXBwZXQgfSg/OiB8JClcIilcbiAgc2VjdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgc25pcHBldCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBTbmlwcGV0cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIHNuaXBwZXRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cbiAgZHJvcFRhcmdldDogKG5vZGUsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgICMgYWJvdmUgY29udGFpbmVyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRDb250YWluZXJUYXJnZXQobm9kZSlcblxuICAgICAgIyBhYm92ZSBzbmlwcGV0XG4gICAgICBlbHNlIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldFNuaXBwZXRUYXJnZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcblxuICAgICAgIyBhYm92ZSByb290IGNvbnRhaW5lclxuICAgICAgZWxzZSBpZiBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRTbmlwcGV0VGFyZ2V0OiAoZWxlbSwgeyB0b3AsIGxlZnQsIHBvc2l0aW9uIH0pIC0+XG4gICAgdGFyZ2V0OiAnc25pcHBldCdcbiAgICBzbmlwcGV0VmlldzogQGdldFNuaXBwZXRWaWV3KGVsZW0pXG4gICAgcG9zaXRpb246IHBvc2l0aW9uIHx8IEBnZXRQb3NpdGlvbk9uU25pcHBldChlbGVtLCB7IHRvcCwgbGVmdCB9KVxuXG5cbiAgZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQ6IChjbG9zZXN0U25pcHBldERhdGEpIC0+XG4gICAgZWxlbSA9IGNsb3Nlc3RTbmlwcGV0RGF0YS4kZWxlbVswXVxuICAgIHBvc2l0aW9uID0gY2xvc2VzdFNuaXBwZXREYXRhLnBvc2l0aW9uXG4gICAgQGdldFNuaXBwZXRUYXJnZXQoZWxlbSwgeyBwb3NpdGlvbiB9KVxuXG5cbiAgZ2V0Q29udGFpbmVyVGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuXG4gICAgdGFyZ2V0OiAnY29udGFpbmVyJ1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VmlldzogQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIHNuaXBwZXRUcmVlID0gJChub2RlKS5kYXRhKCdzbmlwcGV0VHJlZScpXG5cbiAgICB0YXJnZXQ6ICdyb290J1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VHJlZTogc25pcHBldFRyZWVcblxuXG4gICMgRmlndXJlIG91dCBpZiB3ZSBzaG91bGQgaW5zZXJ0IGJlZm9yZSBvciBhZnRlciBhIHNuaXBwZXRcbiAgIyBiYXNlZCBvbiB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICBnZXRQb3NpdGlvbk9uU25pcHBldDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IHNuaXBwZXQgaW4gYSBjb250YWluZXIgZm9yIGEgdG9wIGxlZnQgcG9zaXRpb25cbiAgZ2V0Q2xvc2VzdFNuaXBwZXQ6IChjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJHNuaXBwZXRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLnNuaXBwZXQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBjbG9zZXN0U25pcHBldCA9IHVuZGVmaW5lZFxuXG4gICAgJHNuaXBwZXRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2FmdGVyJ31cblxuICAgIGNsb3Nlc3RTbmlwcGV0XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgc25pcHBldCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuICAgICAgICAkcGFyZW50ID0gJGVsZW0ucGFyZW50KClcbiAgICAgICAgcGFyZW50SGVpZ2h0ID0gJHBhcmVudC5oZWlnaHQoKVxuICAgICAgICBvdXRlciA9ICRlbGVtLm91dGVySGVpZ2h0KHRydWUpIC0gJGVsZW0uaGVpZ2h0KClcbiAgICAgICAgJGVsZW0uaGVpZ2h0KHBhcmVudEhlaWdodCAtIG91dGVyKVxuICAgICAgICAkZWxlbS5hZGRDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgIyByZW1vdmUgYWxsIGNzcyBzdHlsZSBoZWlnaHQgZGVjbGFyYXRpb25zIGFkZGVkIGJ5XG4gICMgbWF4aW1pemVDb250YWluZXJIZWlnaHQoKVxuICByZXN0b3JlQ29udGFpbmVySGVpZ2h0OiAoKSAtPlxuICAgICQoXCIuI3sgY3NzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgZ2V0RWxlbWVudE5vZGU6IChub2RlKSAtPlxuICAgIGlmIG5vZGU/LmpxdWVyeVxuICAgICAgbm9kZVswXVxuICAgIGVsc2UgaWYgbm9kZT8ubm9kZVR5cGUgPT0gMyAjIE5vZGUuVEVYVF9OT0RFID09IDNcbiAgICAgIG5vZGUucGFyZW50Tm9kZVxuICAgIGVsc2VcbiAgICAgIG5vZGVcblxuXG4gICMgU25pcHBldHMgc3RvcmUgYSByZWZlcmVuY2Ugb2YgdGhlbXNlbHZlcyBpbiB0aGVpciBEb20gbm9kZVxuICAjIGNvbnNpZGVyOiBzdG9yZSByZWZlcmVuY2UgZGlyZWN0bHkgd2l0aG91dCBqUXVlcnlcbiAgZ2V0U25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnc25pcHBldCcpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRHJhZ0Jhc2VcbiNcbiMgU3VwcG9ydGVkIGRyYWcgbW9kZXM6XG4jIC0gRGlyZWN0IChzdGFydCBpbW1lZGlhdGVseSlcbiMgLSBMb25ncHJlc3MgKHN0YXJ0IGFmdGVyIGEgZGVsYXkgaWYgdGhlIGN1cnNvciBkb2VzIG5vdCBtb3ZlIHRvbyBtdWNoKVxuIyAtIE1vdmUgKHN0YXJ0IGFmdGVyIHRoZSBjdXJzb3IgbW92ZWQgYSBtaW51bXVtIGRpc3RhbmNlKVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnQmFzZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UsIG9wdGlvbnMpIC0+XG4gICAgQG1vZGVzID0gWydkaXJlY3QnLCAnbG9uZ3ByZXNzJywgJ21vdmUnXVxuXG4gICAgZGVmYXVsdENvbmZpZyA9XG4gICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcbiAgICAgIG9uRHJhZ1N0YXJ0OiB1bmRlZmluZWRcbiAgICAgIHNjcm9sbEFyZWE6IDUwXG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcbiAgICAgIG1vdmU6XG4gICAgICAgIGRpc3RhbmNlOiAwXG5cbiAgICBAZGVmYXVsdENvbmZpZyA9ICQuZXh0ZW5kKHRydWUsIGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG5cbiAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG4gICAgQG1vZGUgPSBpZiBvcHRpb25zLmRpcmVjdD9cbiAgICAgICdkaXJlY3QnXG4gICAgZWxzZSBpZiBvcHRpb25zLmxvbmdwcmVzcz9cbiAgICAgICdsb25ncHJlc3MnXG4gICAgZWxzZSBpZiBvcHRpb25zLm1vdmU/XG4gICAgICAnbW92ZSdcbiAgICBlbHNlXG4gICAgICAnbG9uZ3ByZXNzJ1xuXG5cbiAgc2V0RHJhZ0hhbmRsZXI6IChkcmFnSGFuZGxlcikgLT5cbiAgICBAZHJhZ0hhbmRsZXIgPSBkcmFnSGFuZGxlclxuICAgIEBkcmFnSGFuZGxlci5wYWdlID0gQHBhZ2VcblxuXG4gICMgc3RhcnQgYSBwb3NzaWJsZSBkcmFnXG4gICMgdGhlIGRyYWcgaXMgb25seSByZWFsbHkgc3RhcnRlZCBpZiBjb25zdHJhaW50cyBhcmUgbm90IHZpb2xhdGVkIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSlcbiAgaW5pdDogKGRyYWdIYW5kbGVyLCBldmVudCwgb3B0aW9ucykgLT5cbiAgICBAcmVzZXQoKVxuICAgIEBpbml0aWFsaXplZCA9IHRydWVcbiAgICBAc2V0T3B0aW9ucyhvcHRpb25zKVxuICAgIEBzZXREcmFnSGFuZGxlcihkcmFnSGFuZGxlcilcbiAgICBAc3RhcnRQb2ludCA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuXG4gICAgQGFkZFN0b3BMaXN0ZW5lcnMoZXZlbnQpXG4gICAgQGFkZE1vdmVMaXN0ZW5lcnMoZXZlbnQpXG5cbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgQGFkZExvbmdwcmVzc0luZGljYXRvcihAc3RhcnRQb2ludClcbiAgICAgIEB0aW1lb3V0ID0gc2V0VGltZW91dCA9PlxuICAgICAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgICAgIEBzdGFydChldmVudClcbiAgICAgICAgLCBAb3B0aW9ucy5sb25ncHJlc3MuZGVsYXlcbiAgICBlbHNlIGlmIEBtb2RlID09ICdkaXJlY3QnXG4gICAgICBAc3RhcnQoZXZlbnQpXG5cbiAgICAjIHByZXZlbnQgYnJvd3NlciBEcmFnICYgRHJvcFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgaWYgQG9wdGlvbnMucHJldmVudERlZmF1bHRcblxuXG4gIG1vdmU6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5sb25ncHJlc3MudG9sZXJhbmNlXG4gICAgICAgIEByZXNldCgpXG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnbW92ZSdcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5tb3ZlLmRpc3RhbmNlXG4gICAgICAgIEBzdGFydChldmVudClcblxuXG4gICMgc3RhcnQgdGhlIGRyYWcgcHJvY2Vzc1xuICBzdGFydDogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBAc3RhcnRlZCA9IHRydWVcblxuICAgICMgcHJldmVudCB0ZXh0LXNlbGVjdGlvbnMgd2hpbGUgZHJhZ2dpbmdcbiAgICBAYWRkQmxvY2tlcigpXG4gICAgQHBhZ2UuJGJvZHkuYWRkQ2xhc3MoY29uZmlnLmNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogLT5cbiAgICBAZHJhZ0hhbmRsZXIuZHJvcCgpIGlmIEBzdGFydGVkXG4gICAgQHJlc2V0KClcblxuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG4gICAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgICBAcGFnZS4kYm9keS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cblxuICAgIGlmIEBpbml0aWFsaXplZFxuICAgICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgICBAZHJhZ0hhbmRsZXIucmVzZXQoKVxuICAgICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgICBpZiBAdGltZW91dD9cbiAgICAgICAgY2xlYXJUaW1lb3V0KEB0aW1lb3V0KVxuICAgICAgICBAdGltZW91dCA9IHVuZGVmaW5lZFxuXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcbiAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgQHJlbW92ZUJsb2NrZXIoKVxuXG5cbiAgYWRkQmxvY2tlcjogLT5cbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPSdkcmFnQmxvY2tlcic+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGJsb2NrZXIpXG5cblxuICByZW1vdmVCbG9ja2VyOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoJy5kcmFnQmxvY2tlcicpLnJlbW92ZSgpXG5cblxuXG4gIGFkZExvbmdwcmVzc0luZGljYXRvcjogKHsgcGFnZVgsIHBhZ2VZIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAb3B0aW9ucy5sb25ncHJlc3Muc2hvd0luZGljYXRvclxuICAgICRpbmRpY2F0b3IgPSAkKFwiPGRpdiBjbGFzcz1cXFwiI3sgY29uZmlnLmNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNvbmZpZy5jc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgPT5cbiAgICAgIEBkcm9wKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSAjIGFsbCBvdGhlciBpbnB1dCBkZXZpY2VzIGJlaGF2ZSBsaWtlIGEgbW91c2VcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuXG4gIGdldEV2ZW50UG9zaXRpb246IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyB8fCBldmVudC50eXBlID09ICd0b3VjaG1vdmUnXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF1cblxuICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFhcbiAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgcGFnZVg6IGV2ZW50LnBhZ2VYXG4gICAgcGFnZVk6IGV2ZW50LnBhZ2VZXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5wYWdlWCAtIHBvaW50Qi5wYWdlWFxuICAgIGRpc3RZID0gcG9pbnRBLnBhZ2VZIC0gcG9pbnRCLnBhZ2VZXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRWRpdGFibGVKUyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgRWRpdGFibGVKUyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cbiAgICAjIEluaXRpYWxpemUgRWRpdGFibGVKU1xuICAgIEBlZGl0YWJsZSA9IG5ldyBFZGl0YWJsZSh3aW5kb3c6IEBwYWdlLndpbmRvdyk7XG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBlZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggRWRpdGFibGVKUy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgQGVkaXRhYmxlLmFkZChub2RlcylcblxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLnN1c3BlbmQoKVxuXG5cbiAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLmNvbnRpbnVlKClcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgRWRpdGFibGVKU1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZhbHVlID0gdmlldy5nZXQoZWRpdGFibGVOYW1lKVxuICAgIGlmIGNvbmZpZy5zaW5nbGVMaW5lQnJlYWsudGVzdCh2YWx1ZSkgfHwgdmFsdWUgPT0gJydcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkXG5cbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgYmx1cjogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmJsdXJFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lKVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3XG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcblxuICAgICAgICAjIGNyZWF0ZSBkb2N1bWVudCBmcmFnbWVudFxuICAgICAgICBjb250ZW50cyA9IHZpZXcuZGlyZWN0aXZlcy4kZ2V0RWxlbShlZGl0YWJsZU5hbWUpLmNvbnRlbnRzKClcbiAgICAgICAgZnJhZyA9IEBwYWdlLmRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICBmb3IgZWwgaW4gY29udGVudHNcbiAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKGVsKVxuXG4gICAgICAgIG1lcmdlZFZpZXcuZm9jdXMoKVxuICAgICAgICBlbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgICAgY3Vyc29yID0gQGVkaXRhYmxlLmNyZWF0ZUN1cnNvcihlbGVtLCBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnZW5kJyBlbHNlICdiZWdpbm5pbmcnKVxuICAgICAgICBjdXJzb3JbIGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuICdpbnNlcnRBZnRlcicgZWxzZSAnaW5zZXJ0QmVmb3JlJyBdKGZyYWcpXG5cbiAgICAgICAgIyBNYWtlIHN1cmUgdGhlIG1vZGVsIG9mIHRoZSBtZXJnZWRWaWV3IGlzIHVwIHRvIGRhdGVcbiAgICAgICAgIyBvdGhlcndpc2UgYnVncyBsaWtlIGluIGlzc3VlICM1NiBjYW4gb2NjdXIuXG4gICAgICAgIGN1cnNvci5zYXZlKClcbiAgICAgICAgQHVwZGF0ZU1vZGVsKG1lcmdlZFZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgICAgY3Vyc29yLnJlc3RvcmUoKVxuXG4gICAgICAgIHZpZXcubW9kZWwucmVtb3ZlKClcbiAgICAgICAgY3Vyc29yLnNldFNlbGVjdGlvbigpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcbiAgICAgIGNvcHkgPSB2aWV3LnRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgIyBnZXQgY29udGVudCBvdXQgb2YgJ2JlZm9yZScgYW5kICdhZnRlcidcbiAgICAgIGJlZm9yZUNvbnRlbnQgPSBiZWZvcmUucXVlcnlTZWxlY3RvcignKicpLmlubmVySFRNTFxuICAgICAgYWZ0ZXJDb250ZW50ID0gYWZ0ZXIucXVlcnlTZWxlY3RvcignKicpLmlubmVySFRNTFxuXG4gICAgICAjIHNldCBlZGl0YWJsZSBvZiBzbmlwcGV0cyB0byBpbm5lckhUTUwgb2YgZnJhZ21lbnRzXG4gICAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIGJlZm9yZUNvbnRlbnQpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIGFmdGVyQ29udGVudClcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2Ygc25pcHBldFxuICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgdmlldy5uZXh0KCkuZm9jdXMoKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIHNlbGVjdGlvbkNoYW5nZWQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIHNlbGVjdGlvbikgLT5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAc2VsZWN0aW9uLmZpcmUodmlldywgZWxlbWVudCwgc2VsZWN0aW9uKVxuXG5cbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGhhc1NpbmdsZUVkaXRhYmxlOiAodmlldykgLT5cbiAgICB2aWV3LmRpcmVjdGl2ZXMubGVuZ3RoID09IDEgJiYgdmlldy5kaXJlY3RpdmVzWzBdLnR5cGUgPT0gJ2VkaXRhYmxlJ1xuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIERvY3VtZW50IEZvY3VzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgc25pcHBldCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQHNuaXBwZXRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIHNuaXBwZXRWaWV3ICE9IEBzbmlwcGV0Vmlld1xuICAgICAgQHJlc2V0U25pcHBldFZpZXcoKVxuICAgICAgaWYgc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRWaWV3ID0gc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRGb2N1cy5maXJlKEBzbmlwcGV0VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBzbmlwcGV0VmlldyB8fD0gZG9tLmZpbmRTbmlwcGV0VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBzbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBzbmlwcGV0VmlldyAhPSBzbmlwcGV0Vmlld1xuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0U25pcHBldFZpZXc6IC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBzbmlwcGV0Vmlld1xuICAgICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAc25pcHBldEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXREcmFnXG5cbiAgd2lnZ2xlU3BhY2UgPSAwXG4gIHN0YXJ0QW5kRW5kT2Zmc2V0ID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldyB9KSAtPlxuICAgIEAkdmlldyA9IHNuaXBwZXRWaWV3LiRodG1sIGlmIHNuaXBwZXRWaWV3XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBzdGFydDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLmRpc2FibGVBbGwoKVxuICAgIEBwYWdlLmJsdXJGb2N1c2VkRWxlbWVudCgpXG5cbiAgICAjIHBsYWNlaG9sZGVyIGJlbG93IGN1cnNvclxuICAgIEAkcGxhY2Vob2xkZXIgPSBAY3JlYXRlUGxhY2Vob2xkZXIoKS5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgIEAkZHJhZ0Jsb2NrZXIgPSBAcGFnZS4kYm9keS5maW5kKCcuZHJhZ0Jsb2NrZXInKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Py5tb2RlbCAhPSBAc25pcHBldE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuc25pcHBldFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIHNuaXBwZXRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5zbmlwcGV0Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHMoYmVmb3JlLCB0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHModGFyZ2V0LnNuaXBwZXRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXRcbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyOiAoZWxlbSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW0/XG5cbiAgICBAbWFrZVNwYWNlKGVsZW0ubGFzdENoaWxkLCAnYm90dG9tJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LmJvdHRvbSAtIHN0YXJ0QW5kRW5kT2Zmc2V0XG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG4gICAgICBlbGVtID0gQHBhZ2UuZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCIjIENhbiByZXBsYWNlIHhtbGRvbSBpbiB0aGUgYnJvd3Nlci5cbiMgTW9yZSBhYm91dCB4bWxkb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qaW5kdy94bWxkb21cbiNcbiMgT24gbm9kZSB4bWxkb20gaXMgcmVxdWlyZWQuIEluIHRoZSBicm93c2VyXG4jIERPTVBhcnNlciBhbmQgWE1MU2VyaWFsaXplciBhcmUgYWxyZWFkeSBuYXRpdmUgb2JqZWN0cy5cblxuIyBET01QYXJzZXJcbmV4cG9ydHMuRE9NUGFyc2VyID0gY2xhc3MgRE9NUGFyc2VyU2hpbVxuXG4gIHBhcnNlRnJvbVN0cmluZzogKHhtbFRlbXBsYXRlKSAtPlxuICAgICMgbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyh4bWxUZW1wbGF0ZSkgZG9lcyBub3Qgd29yayB0aGUgc2FtZVxuICAgICMgaW4gdGhlIGJyb3dzZXIgYXMgd2l0aCB4bWxkb20uIFNvIHdlIHVzZSBqUXVlcnkgdG8gbWFrZSB0aGluZ3Mgd29yay5cbiAgICAkLnBhcnNlWE1MKHhtbFRlbXBsYXRlKVxuXG5cbiMgWE1MU2VyaWFsaXplclxuZXhwb3J0cy5YTUxTZXJpYWxpemVyID0gWE1MU2VyaWFsaXplclxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBzbmlwcGV0cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDBcblxuXG4gIGlzSW1nVGFnOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcblJlc3JjaXRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2VfbWFuYWdlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZWZhdWx0SW1hZ2VNYW5hZ2VyID0gbmV3IERlZmF1bHRJbWFnZU1hbmFnZXIoKVxuICByZXNyY2l0SW1hZ2VNYW5hZ2VyID0gbmV3IFJlc3JjaXRJbWFnZU1hbmFnZXIoKVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpIC0+XG4gICAgaW1hZ2VNYW5hZ2VyID0gQF9nZXRJbWFnZU1hbmFnZXIoaW1hZ2VTZXJ2aWNlKVxuICAgIGltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlKVxuXG5cbiAgX2dldEltYWdlTWFuYWdlcjogKGltYWdlU2VydmljZSkgLT5cbiAgICBzd2l0Y2ggaW1hZ2VTZXJ2aWNlXG4gICAgICB3aGVuICdyZXNyYy5pdCcgdGhlbiByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4gICAgICBlbHNlXG4gICAgICAgIGRlZmF1bHRJbWFnZU1hbmFnZXJcblxuXG4gIGdldERlZmF1bHRJbWFnZU1hbmFnZXI6IC0+XG4gICAgZGVmYXVsdEltYWdlTWFuYWdlclxuXG5cbiAgZ2V0UmVzcmNpdEltYWdlTWFuYWdlcjogLT5cbiAgICByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciB9KSAtPlxuICAgIGFzc2VydCBAc25pcHBldFRyZWUsICdubyBzbmlwcGV0IHRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAc25pcHBldFZpZXdzID0ge31cblxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgcmV0dXJuIHVubGVzcyAkaW5zZXJ0Lmxlbmd0aFxuXG4gICAgICBAJHdyYXBwZXIgPSBAJHJvb3RcbiAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuXG4gIHJlbmRlck9uY2VQYWdlUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmluY3JlbWVudCgpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5yZWFkeSA9PlxuICAgICAgQHNldFJvb3QoKVxuICAgICAgQHJlbmRlcigpXG4gICAgICBAc2V0dXBTbmlwcGV0VHJlZUxpc3RlbmVycygpXG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaXNSZWFkeSgpXG5cblxuICBodG1sOiAtPlxuICAgIGFzc2VydCBAaXNSZWFkeSgpLCAnQ2Fubm90IGdlbmVyYXRlIGh0bWwuIFJlbmRlcmVyIGlzIG5vdCByZWFkeS4nXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5odG1sKClcblxuXG4gICMgU25pcHBldCBUcmVlIEV2ZW50IEhhbmRsaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0dXBTbmlwcGV0VHJlZUxpc3RlbmVyczogLT5cbiAgICBAc25pcHBldFRyZWUuc25pcHBldEFkZGVkLmFkZCggJC5wcm94eShAc25pcHBldEFkZGVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRSZW1vdmVkLmFkZCggJC5wcm94eShAc25pcHBldFJlbW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldE1vdmVkLmFkZCggJC5wcm94eShAc25pcHBldE1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRDb250ZW50Q2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRDb250ZW50Q2hhbmdlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0SHRtbENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0SHRtbENoYW5nZWQsIHRoaXMpIClcblxuXG4gIHNuaXBwZXRBZGRlZDogKG1vZGVsKSAtPlxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldFJlbW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldE1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0Q29udGVudENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVDb250ZW50KClcblxuXG4gIHNuaXBwZXRIdG1sQ2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUh0bWwoKVxuXG5cbiAgIyBSZW5kZXJpbmdcbiAgIyAtLS0tLS0tLS1cblxuXG4gIHNuaXBwZXRWaWV3Rm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdIHx8PSBtb2RlbC5jcmVhdGVWaWV3KEByZW5kZXJpbmdDb250YWluZXIuaXNSZWFkT25seSlcblxuXG4gIGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIGRlbGV0ZSBAc25pcHBldFZpZXdzW21vZGVsLmlkXVxuXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgY2xlYXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcblxuICAgIEAkcm9vdC5lbXB0eSgpXG5cblxuICByZWRyYXc6IC0+XG4gICAgQGNsZWFyKClcbiAgICBAcmVuZGVyKClcblxuXG4gIGluc2VydFNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICByZXR1cm4gaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsKVxuXG4gICAgaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsLnByZXZpb3VzKVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwucHJldmlvdXMsIG1vZGVsKVxuICAgIGVsc2UgaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsLm5leHQpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5uZXh0LCBtb2RlbClcbiAgICBlbHNlIGlmIG1vZGVsLnBhcmVudENvbnRhaW5lclxuICAgICAgQGFwcGVuZFNuaXBwZXRUb1BhcmVudENvbnRhaW5lcihtb2RlbClcbiAgICBlbHNlXG4gICAgICBsb2cuZXJyb3IoJ1NuaXBwZXQgY291bGQgbm90IGJlIGluc2VydGVkIGJ5IHJlbmRlcmVyLicpXG5cbiAgICBzbmlwcGV0VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG4gICAgc25pcHBldFZpZXcuc2V0QXR0YWNoZWRUb0RvbSh0cnVlKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIuc25pcHBldFZpZXdXYXNJbnNlcnRlZChzbmlwcGV0VmlldylcbiAgICBAYXR0YWNoQ2hpbGRTbmlwcGV0cyhtb2RlbClcblxuXG4gIGlzU25pcHBldEF0dGFjaGVkOiAobW9kZWwpIC0+XG4gICAgbW9kZWwgJiYgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuaXNBdHRhY2hlZFRvRG9tXG5cblxuICBhdHRhY2hDaGlsZFNuaXBwZXRzOiAobW9kZWwpIC0+XG4gICAgbW9kZWwuY2hpbGRyZW4gKGNoaWxkTW9kZWwpID0+XG4gICAgICBpZiBub3QgQGlzU25pcHBldEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRTbmlwcGV0KGNoaWxkTW9kZWwpXG5cblxuICBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nOiAoc2libGluZywgbW9kZWwpIC0+XG4gICAgbWV0aG9kID0gaWYgc2libGluZyA9PSBtb2RlbC5wcmV2aW91cyB0aGVuICdhZnRlcicgZWxzZSAnYmVmb3JlJ1xuICAgIEAkbm9kZUZvclNuaXBwZXQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKSlcblxuXG4gIGFwcGVuZFNuaXBwZXRUb1BhcmVudENvbnRhaW5lcjogKG1vZGVsKSAtPlxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KGNvbnRhaW5lci5wYXJlbnRTbmlwcGV0KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuZGV0YWNoKClcblxuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc2NyaXRJbWFnZU1hbmFnZXIgZXh0ZW5kcyBEZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cbiAgQHJlc3JjaXRVcmw6ICdodHRwOi8vdHJpYWwucmVzcmMuaXQvJ1xuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBlbXB0eVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB2YWx1ZSkgaWYgQGlzQmFzZTY0KHZhbHVlKVxuXG4gICAgYXNzZXJ0IHZhbHVlPyAmJiB2YWx1ZSAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICAkZWxlbS5hZGRDbGFzcygncmVzcmMnKVxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgIEByZXNldFNyY0F0dHJpYnV0ZSgkZWxlbSkgaWYgJGVsZW0uYXR0cignc3JjJykgJiYgQGlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCBcIiN7UmVzY3JpdEltYWdlTWFuYWdlci5yZXNyY2l0VXJsfSN7dmFsdWV9XCIpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgcmVzZXRTcmNBdHRyaWJ1dGU6ICgkZWxlbSkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuSW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50LCBAbW9kZWwudGVtcG9yYXJ5Q29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQsIHNlc3Npb25Db250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBpZiBzZXNzaW9uQ29udGVudFtuYW1lXT8gJiYgKCAhdmFsdWU/IHx8IHZhbHVlID09ICcnIClcbiAgICAgICAgQHNldChuYW1lLCBzZXNzaW9uQ29udGVudFtuYW1lXSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIHZhbHVlXG4gICAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylbbmFtZV0gaWYgQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpXG4gICAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAc25pcHBldFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgaG9zdFdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3dcbiAgICAgIGRlc2lnbjogQHNuaXBwZXRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG4gICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSB9PXt9KSAtPlxuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdjbGljay5saXZpbmdkb2NzJywgJC5wcm94eShAY2xpY2ssIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlP1xuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0Vmlld1xuXG4gICAgQHN0YXJ0RHJhZ1xuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjbGljazogKGV2ZW50KSAtPlxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcblxuICAgICMgdG9kbzogaWYgYSB1c2VyIGNsaWNrZWQgb24gYSBtYXJnaW4gb2YgYSBzbmlwcGV0IGl0IHNob3VsZFxuICAgICMgc3RpbGwgZ2V0IHNlbGVjdGVkLiAoaWYgYSBzbmlwcGV0IGlzIGZvdW5kIGJ5IHBhcmVudFNuaXBwZXRcbiAgICAjIGFuZCB0aGF0IHNuaXBwZXQgaGFzIG5vIGNoaWxkcmVuIHdlIGRvIG5vdCBuZWVkIHRvIHNlYXJjaClcblxuICAgICMgaWYgc25pcHBldCBoYXNDaGlsZHJlbiwgbWFrZSBzdXJlIHdlIGRpZG4ndCB3YW50IHRvIHNlbGVjdFxuICAgICMgYSBjaGlsZFxuXG4gICAgIyBpZiBubyBzbmlwcGV0IHdhcyBzZWxlY3RlZCBjaGVjayBpZiB0aGUgdXNlciB3YXMgbm90IGNsaWNraW5nXG4gICAgIyBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXRcblxuICAgICMgdG9kbzogY2hlY2sgaWYgdGhlIGNsaWNrIHdhcyBtZWFudCBmb3IgYSBzbmlwcGV0IGNvbnRhaW5lclxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAZm9jdXMuc25pcHBldEZvY3VzZWQoc25pcHBldFZpZXcpXG5cbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgIyBzdG9yZSByZWZlcmVuY2UgdG8gc25pcHBldFRyZWVcbiAgICAkKEByZW5kZXJOb2RlKS5kYXRhKCdzbmlwcGV0VHJlZScsIEBzbmlwcGV0VHJlZSlcbiAgICBAY3NzTG9hZGVyID0gbmV3IENzc0xvYWRlcihAd2luZG93KVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgc2V0UmVuZGVyTm9kZTogKHJlbmRlck5vZGUpIC0+XG4gICAgcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcbiAgICBpZiByZW5kZXJOb2RlLmpxdWVyeVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlWzBdXG4gICAgZWxzZVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlXG5cblxuICBiZWZvcmVSZWFkeTogLT5cbiAgICAjIGFsd2F5cyBpbml0aWFsaXplIGEgcGFnZSBhc3luY2hyb25vdXNseVxuICAgIEByZWFkeVNlbWFwaG9yZS53YWl0KClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcbiAgICAsIDBcblxuXG4gIGJlZm9yZVBhZ2VSZWFkeTogPT5cbiAgICBpZiBAZGVzaWduPyAmJiBjb25maWcubG9hZFJlc291cmNlc1xuICAgICAgZGVzaWduUGF0aCA9IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWVzcGFjZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3cgfHwgd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIFNuaXBwZXRWaWV3cyBpbnRvIHRoZSBSZW5kZXJpbmdDb250YWluZXIgYW5kIG5vdGlmaWVzIGl0XG4jIG9mIHRoZSBpbnNlcnRpb24uXG4jXG4jIFRoZSBSZW5kZXJpbmdDb250YWluZXIgaXMgaW50ZW5kZWQgZm9yIGdlbmVyYXRpbmcgSFRNTC4gUGFnZSBpcyBhIHN1YmNsYXNzIG9mXG4jIHRoaXMgYmFzZSBjbGFzcyB0aGF0IGlzIGludGVuZGVkIGZvciBkaXNwbGF5aW5nIHRvIHRoZSB1c2VyLiBJbnRlcmFjdGl2ZVBhZ2VcbiMgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFkZHMgaW50ZXJhY3Rpdml0eSwgYW5kIHRodXMgZWRpdGFiaWxpdHksIHRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBpc1JlYWRPbmx5OiB0cnVlXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVuZGVyTm9kZSA9ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiIyBqUXVlcnkgbGlrZSByZXN1bHRzIHdoZW4gc2VhcmNoaW5nIGZvciBzbmlwcGV0cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgU25pcHBldEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRBcnJheSB2aWEgYGRvYy5mbmAuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRBcnJheVxuXG5cbiAgIyBAcGFyYW0gc25pcHBldHM6IGFycmF5IG9mIHNuaXBwZXRzXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRzKSAtPlxuICAgIEBzbmlwcGV0cyA9IFtdIHVubGVzcyBAc25pcHBldHM/XG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBzbmlwcGV0c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAc25pcHBldHMubGVuZ3RoXG4gICAgaWYgQHNuaXBwZXRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0BzbmlwcGV0cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBzbmlwcGV0IGluIEBzbmlwcGV0c1xuICAgICAgY2FsbGJhY2soc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFNuaXBwZXRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIFNuaXBwZXRDb250YWluZXIgY29udGFpbnMgYW5kIG1hbmFnZXMgYSBsaW5rZWQgbGlzdFxuIyBvZiBzbmlwcGV0cy5cbiNcbiMgVGhlIHNuaXBwZXRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIHNuaXBwZXRUcmVlXG4jIGluZm9ybWVkIGFib3V0IGNoYW5nZXMgKG9ubHkgaWYgdGhleSBhcmUgYXR0YWNoZWQgdG8gb25lKS5cbiNcbiMgQHByb3AgZmlyc3Q6IGZpcnN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRTbmlwcGV0OiBwYXJlbnQgU25pcHBldE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50U25pcHBldCwgQG5hbWUsIGlzUm9vdCB9KSAtPlxuICAgIEBpc1Jvb3QgPSBpc1Jvb3Q/XG4gICAgQGZpcnN0ID0gQGxhc3QgPSB1bmRlZmluZWRcblxuXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQHBhcmVudFNuaXBwZXRcbiAgICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgQHBhcmVudFNuaXBwZXQsICdjYW5ub3QgYXBwZW5kIHNuaXBwZXQgdG8gaXRzZWxmJ1xuXG4gICAgaWYgQGxhc3RcbiAgICAgIEBpbnNlcnRBZnRlcihAbGFzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgaW5zZXJ0QmVmb3JlOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0LnByZXZpb3VzID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldC5wcmV2aW91c1xuICAgICAgbmV4dDogc25pcHBldFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIGluc2VydEFmdGVyOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0Lm5leHQgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXRcbiAgICAgIG5leHQ6IHNuaXBwZXQubmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIHVwOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShzbmlwcGV0LnByZXZpb3VzLCBzbmlwcGV0KVxuXG5cbiAgZG93bjogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5uZXh0P1xuICAgICAgQGluc2VydEFmdGVyKHNuaXBwZXQubmV4dCwgc25pcHBldClcblxuXG4gIGdldFNuaXBwZXRUcmVlOiAtPlxuICAgIEBzbmlwcGV0VHJlZSB8fCBAcGFyZW50U25pcHBldD8uc25pcHBldFRyZWVcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0ID0gQGZpcnN0XG4gICAgd2hpbGUgKHNuaXBwZXQpXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgY2FsbGJhY2soc25pcHBldClcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0LmRlc3Ryb3koKVxuICAgIEBfZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBTbmlwcGV0TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggU25pcHBldE1vZGVsIGhhcyBhIHRlbXBsYXRlIHdoaWNoIGFsbG93cyB0byBnZW5lcmF0ZSBhIHNuaXBwZXRWaWV3XG4jIGZyb20gYSBzbmlwcGV0TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBTbmlwcGV0VHJlZS5cbiMgRXZlcnkgU25pcHBldE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChTbmlwcGV0Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIHNuaXBwZXRzKSBhbmQgbXVsdGlwbGUgY29udGFpbmVycyAoU25pcHBldENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIFNuaXBwZXRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IFNuaXBwZXRDb250YWluZXJcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgc25pcHBldCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEB0ZW1wb3JhcnlDb250ZW50ID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICBoYXNDb250YWluZXJzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdjb250YWluZXInKSA+IDBcblxuXG4gIGhhc0VkaXRhYmxlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnZWRpdGFibGUnKSA+IDBcblxuXG4gIGhhc0h0bWw6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2h0bWwnKSA+IDBcblxuXG4gIGhhc0ltYWdlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaW1hZ2UnKSA+IDBcblxuXG4gIGJlZm9yZTogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAcHJldmlvdXNcblxuXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gIGFwcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLnByZXBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHJlc2V0Vm9sYXRpbGVWYWx1ZTogKG5hbWUpIC0+XG4gICAgZGVsZXRlIEB0ZW1wb3JhcnlDb250ZW50W25hbWVdXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSwgdm9sYXRpbGU9ZmFsc2UpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwic2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBpZiB2b2xhdGlsZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IEB0ZW1wb3JhcnlDb250ZW50XG4gICAgZWxzZVxuICAgICAgQHJlc2V0Vm9sYXRpbGVWYWx1ZShuYW1lKSAjIGFzIHNvb24gYXMgd2UgZ2V0IHJlYWwgY29udGVudCwgcmVzZXQgdGhlIHRlbXBvcmFyeUNvbnRlbnRcbiAgICAgIHN0b3JhZ2VDb250YWluZXIgPSBAY29udGVudFxuXG4gICAgaWYgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSAhPSB2YWx1ZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSA9IHZhbHVlXG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBjb250ZW50W25hbWVdXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBzbmlwcGV0VHJlZSAmJiBjaGFuZ2VkRGF0YVByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBAc25pcHBldFRyZWUuZGF0YUNoYW5naW5nKHRoaXMsIGNoYW5nZWREYXRhUHJvcGVydGllcylcbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1thcmddXG5cblxuICBjaGFuZ2VEYXRhOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgZGVlcEVxdWFsKEBkYXRhVmFsdWVzW25hbWVdLCB2YWx1ZSkgPT0gZmFsc2VcbiAgICAgIEBkYXRhVmFsdWVzW25hbWVdID0gdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG5cbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cgbmFtZSwgdmFsdWUsICd0cmFjZSdcbiAgICAgIGxvZy53YXJuIFwiVW5rbm93biBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlXG4gICAgICBpZiBAc3R5bGVzW25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBzdHlsZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBpZiBAc25pcHBldFRyZWVcbiAgICAgICAgICBAc25pcHBldFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gIGNvcHk6IC0+XG4gICAgbG9nLndhcm4oXCJTbmlwcGV0TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIG1vdmUgdXAgKHByZXZpb3VzKVxuICB1cDogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnVwKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyBtb3ZlIGRvd24gKG5leHQpXG4gIGRvd246IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5kb3duKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyByZW1vdmUgVHJlZU5vZGUgZnJvbSBpdHMgY29udGFpbmVyIGFuZCBTbmlwcGV0VHJlZVxuICByZW1vdmU6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5yZW1vdmUodGhpcylcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuICAgICMgcmVtb3ZlIHVzZXIgaW50ZXJmYWNlIGVsZW1lbnRzXG4gICAgQHVpSW5qZWN0b3IucmVtb3ZlKCkgaWYgQHVpSW5qZWN0b3JcblxuXG4gIGdldFBhcmVudDogLT5cbiAgICAgQHBhcmVudENvbnRhaW5lcj8ucGFyZW50U25pcHBldFxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBAc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBJdGVyYXRvcnNcbiAgIyAtLS0tLS0tLS1cblxuICBwYXJlbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldE1vZGVsID0gdGhpc1xuICAgIHdoaWxlIChzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwuZ2V0UGFyZW50KCkpXG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG5cblxuICBjaGlsZHJlbjogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyAoaW5jbHVkaW5nIHRob3NlIG9mIHRoaXMgc25pcHBldE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGxEZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbCkgaWYgc25pcHBldE1vZGVsICE9IHRoaXNcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICBjaGlsZHJlbkFuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBjaGlsZHJlbihjYWxsYmFjaylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICB0b0pzb246IC0+XG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBAaWRcbiAgICAgIGlkZW50aWZpZXI6IEBpZGVudGlmaWVyXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBjb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQHN0eWxlcylcbiAgICAgIGpzb24uc3R5bGVzID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAc3R5bGVzKVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGF0YVZhbHVlcylcblxuICAgICMgY3JlYXRlIGFuIGFycmF5IGZvciBldmVyeSBjb250YWluZXJcbiAgICBmb3IgbmFtZSBvZiBAY29udGFpbmVyc1xuICAgICAganNvbi5jb250YWluZXJzIHx8PSB7fVxuICAgICAganNvbi5jb250YWluZXJzW25hbWVdID0gW11cblxuICAgIGpzb25cblxuXG5TbmlwcGV0TW9kZWwuZnJvbUpzb24gPSAoanNvbiwgZGVzaWduKSAtPlxuICB0ZW1wbGF0ZSA9IGRlc2lnbi5nZXQoanNvbi5pZGVudGlmaWVyKVxuXG4gIGFzc2VydCB0ZW1wbGF0ZSxcbiAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biB0ZW1wbGF0ZSBpZGVudGlmaWVyICcjeyBqc29uLmlkZW50aWZpZXIgfSdcIlxuXG4gIG1vZGVsID0gbmV3IFNuaXBwZXRNb2RlbCh7IHRlbXBsYXRlLCBpZDoganNvbi5pZCB9KVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICBhc3NlcnQgbW9kZWwuY29udGVudC5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIGNvbnRlbnQgJyN7IG5hbWUgfSdcIlxuICAgIG1vZGVsLmNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuXG4gIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgbW9kZWwuc3R5bGUoc3R5bGVOYW1lLCB2YWx1ZSlcblxuICBtb2RlbC5kYXRhKGpzb24uZGF0YSkgaWYganNvbi5kYXRhXG5cbiAgZm9yIGNvbnRhaW5lck5hbWUsIHNuaXBwZXRBcnJheSBvZiBqc29uLmNvbnRhaW5lcnNcbiAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIGNvbnRhaW5lciAjeyBjb250YWluZXJOYW1lIH1cIlxuXG4gICAgaWYgc25pcHBldEFycmF5XG4gICAgICBhc3NlcnQgJC5pc0FycmF5KHNuaXBwZXRBcnJheSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiBjb250YWluZXIgaXMgbm90IGFycmF5ICN7IGNvbnRhaW5lck5hbWUgfVwiXG4gICAgICBmb3IgY2hpbGQgaW4gc25pcHBldEFycmF5XG4gICAgICAgIG1vZGVsLmFwcGVuZCggY29udGFpbmVyTmFtZSwgU25pcHBldE1vZGVsLmZyb21Kc29uKGNoaWxkLCBkZXNpZ24pIClcblxuICBtb2RlbFxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5TbmlwcGV0QXJyYXkgPSByZXF1aXJlKCcuL3NuaXBwZXRfYXJyYXknKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcblxuIyBTbmlwcGV0VHJlZVxuIyAtLS0tLS0tLS0tLVxuIyBMaXZpbmdkb2NzIGVxdWl2YWxlbnQgdG8gdGhlIERPTSB0cmVlLlxuIyBBIHNuaXBwZXQgdHJlZSBjb250YWluZXMgYWxsIHRoZSBzbmlwcGV0cyBvZiBhIHBhZ2UgaW4gaGllcmFyY2hpY2FsIG9yZGVyLlxuI1xuIyBUaGUgcm9vdCBvZiB0aGUgU25pcHBldFRyZWUgaXMgYSBTbmlwcGV0Q29udGFpbmVyLiBBIFNuaXBwZXRDb250YWluZXJcbiMgY29udGFpbnMgYSBsaXN0IG9mIHNuaXBwZXRzLlxuI1xuIyBzbmlwcGV0cyBjYW4gaGF2ZSBtdWx0aWJsZSBTbmlwcGV0Q29udGFpbmVycyB0aGVtc2VsdmVzLlxuI1xuIyAjIyMgRXhhbXBsZTpcbiMgICAgIC0gU25pcHBldENvbnRhaW5lciAocm9vdClcbiMgICAgICAgLSBTbmlwcGV0ICdIZXJvJ1xuIyAgICAgICAtIFNuaXBwZXQgJzIgQ29sdW1ucydcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ21haW4nXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ1RpdGxlJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnc2lkZWJhcidcbiMgICAgICAgICAgIC0gU25pcHBldCAnSW5mby1Cb3gnJ1xuI1xuIyAjIyMgRXZlbnRzOlxuIyBUaGUgZmlyc3Qgc2V0IG9mIFNuaXBwZXRUcmVlIEV2ZW50cyBhcmUgY29uY2VybmVkIHdpdGggbGF5b3V0IGNoYW5nZXMgbGlrZVxuIyBhZGRpbmcsIHJlbW92aW5nIG9yIG1vdmluZyBzbmlwcGV0cy5cbiNcbiMgQ29uc2lkZXI6IEhhdmUgYSBkb2N1bWVudEZyYWdtZW50IGFzIHRoZSByb290Tm9kZSBpZiBubyByb290Tm9kZSBpcyBnaXZlblxuIyBtYXliZSB0aGlzIHdvdWxkIGhlbHAgc2ltcGxpZnkgc29tZSBjb2RlIChzaW5jZSBzbmlwcGV0cyBhcmUgYWx3YXlzXG4jIGF0dGFjaGVkIHRvIHRoZSBET00pLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0VHJlZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbnRlbnQsIEBkZXNpZ24gfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgXCJFcnJvciBpbnN0YW50aWF0aW5nIFNuaXBwZXRUcmVlOiBkZXNpZ24gcGFyYW0gaXMgbWlzc3NpbmcuXCJcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgICMgaW5pdGlhbGl6ZSBjb250ZW50IGJlZm9yZSB3ZSBzZXQgdGhlIHNuaXBwZXQgdHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHRoaXNcbiAgICBAaW5pdGlhbGl6ZUV2ZW50cygpXG5cblxuICAjIEluc2VydCBhIHNuaXBwZXQgYXQgdGhlIGJlZ2lubmluZy5cbiAgIyBAcGFyYW06IHNuaXBwZXRNb2RlbCBpbnN0YW5jZSBvciBzbmlwcGV0IG5hbWUgZS5nLiAndGl0bGUnXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQgPSBAZ2V0U25pcHBldChzbmlwcGV0KVxuICAgIEByb290LnByZXBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICAjIEluc2VydCBzbmlwcGV0IGF0IHRoZSBlbmQuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQgPSBAZ2V0U25pcHBldChzbmlwcGV0KVxuICAgIEByb290LmFwcGVuZChzbmlwcGV0KSBpZiBzbmlwcGV0P1xuICAgIHRoaXNcblxuXG4gIGdldFNuaXBwZXQ6IChzbmlwcGV0TmFtZSkgLT5cbiAgICBpZiB0eXBlb2Ygc25pcHBldE5hbWUgPT0gJ3N0cmluZydcbiAgICAgIEBjcmVhdGVNb2RlbChzbmlwcGV0TmFtZSlcbiAgICBlbHNlXG4gICAgICBzbmlwcGV0TmFtZVxuXG5cbiAgY3JlYXRlTW9kZWw6IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldFRlbXBsYXRlKGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUuY3JlYXRlTW9kZWwoKSBpZiB0ZW1wbGF0ZVxuXG5cbiAgY3JlYXRlU25pcHBldDogLT5cbiAgICBAY3JlYXRlTW9kZWwuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG5cbiAgZ2V0VGVtcGxhdGU6IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGRlc2lnbi5nZXQoaWRlbnRpZmllcilcbiAgICBhc3NlcnQgdGVtcGxhdGUsIFwiQ291bGQgbm90IGZpbmQgdGVtcGxhdGUgI3sgaWRlbnRpZmllciB9XCJcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgaW5pdGlhbGl6ZUV2ZW50czogKCkgLT5cblxuICAgICMgbGF5b3V0IGNoYW5nZXNcbiAgICBAc25pcHBldEFkZGVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldE1vdmVkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgIyBjb250ZW50IGNoYW5nZXNcbiAgICBAc25pcHBldENvbnRlbnRDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRTZXR0aW5nc0NoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXREYXRhQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBjaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgIyBUcmF2ZXJzZSB0aGUgd2hvbGUgc25pcHBldCB0cmVlLlxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaChjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoQ29udGFpbmVyKGNhbGxiYWNrKVxuXG5cbiAgIyBHZXQgdGhlIGZpcnN0IHNuaXBwZXRcbiAgZmlyc3Q6IC0+XG4gICAgQHJvb3QuZmlyc3RcblxuXG4gICMgVHJhdmVyc2UgYWxsIGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgICBpZiBzbmlwcGV0LmlkZW50aWZpZXIgPT0gc2VhcmNoIHx8IHNuaXBwZXQudGVtcGxhdGUuaWQgPT0gc2VhcmNoXG4gICAgICAgICAgcmVzLnB1c2goc25pcHBldClcblxuICAgICAgbmV3IFNuaXBwZXRBcnJheShyZXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFNuaXBwZXRBcnJheSgpXG5cblxuICBkZXRhY2g6IC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIG9sZFJvb3QgPSBAcm9vdFxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBlYWNoV2l0aFBhcmVudHM6IChzbmlwcGV0LCBwYXJlbnRzKSAtPlxuICAjICAgcGFyZW50cyB8fD0gW11cblxuICAjICAgIyB0cmF2ZXJzZVxuICAjICAgcGFyZW50cyA9IHBhcmVudHMucHVzaChzbmlwcGV0KVxuICAjICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICMgICAgIHNuaXBwZXQgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgIyAgICAgd2hpbGUgKHNuaXBwZXQpXG4gICMgICAgICAgQGVhY2hXaXRoUGFyZW50cyhzbmlwcGV0LCBwYXJlbnRzKVxuICAjICAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuICAjICAgcGFyZW50cy5zcGxpY2UoLTEpXG5cblxuICAjIHJldHVybnMgYSByZWFkYWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgcHJpbnQ6ICgpIC0+XG4gICAgb3V0cHV0ID0gJ1NuaXBwZXRUcmVlXFxuLS0tLS0tLS0tLS1cXG4nXG5cbiAgICBhZGRMaW5lID0gKHRleHQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIG91dHB1dCArPSBcIiN7IEFycmF5KGluZGVudGF0aW9uICsgMSkuam9pbihcIiBcIikgfSN7IHRleHQgfVxcblwiXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBzbmlwcGV0LnRlbXBsYXRlXG4gICAgICBhZGRMaW5lKFwiLSAjeyB0ZW1wbGF0ZS50aXRsZSB9ICgjeyB0ZW1wbGF0ZS5pZGVudGlmaWVyIH0pXCIsIGluZGVudGF0aW9uKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgaW5kZW50YXRpb24gKyA0KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGluZGVudGF0aW9uKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCkgaWYgQHJvb3QuZmlyc3RcbiAgICByZXR1cm4gb3V0cHV0XG5cblxuICAjIFRyZWUgQ2hhbmdlIEV2ZW50c1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIFJhaXNlIGV2ZW50cyBmb3IgQWRkLCBSZW1vdmUgYW5kIE1vdmUgb2Ygc25pcHBldHNcbiAgIyBUaGVzZSBmdW5jdGlvbnMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IHNuaXBwZXRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGF0dGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWUgPT0gdGhpc1xuICAgICAgIyBtb3ZlIHNuaXBwZXRcbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRNb3ZlZCcsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZT9cbiAgICAgICAgIyByZW1vdmUgZnJvbSBvdGhlciBzbmlwcGV0IHRyZWVcbiAgICAgICAgc25pcHBldC5zbmlwcGV0Q29udGFpbmVyLmRldGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnQpID0+XG4gICAgICAgIGRlc2NlbmRhbnQuc25pcHBldFRyZWUgPSB0aGlzXG5cbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRBZGRlZCcsIHNuaXBwZXQpXG5cblxuICBmaXJlRXZlbnQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICB0aGlzW2V2ZW50XS5maXJlLmFwcGx5KGV2ZW50LCBhcmdzKVxuICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG5cbiAgZGV0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGRldGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0LnNuaXBwZXRUcmVlIGlzIHRoaXMsXG4gICAgICAnY2Fubm90IHJlbW92ZSBzbmlwcGV0IGZyb20gYW5vdGhlciBTbmlwcGV0VHJlZSdcblxuICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50cykgLT5cbiAgICAgIGRlc2NlbmRhbnRzLnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hTbmlwcGV0RnVuYygpXG4gICAgQGZpcmVFdmVudCgnc25pcHBldFJlbW92ZWQnLCBzbmlwcGV0KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0Q29udGVudENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0SHRtbENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgZGF0YUNoYW5naW5nOiAoc25pcHBldCwgY2hhbmdlZFByb3BlcnRpZXMpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldERhdGFDaGFuZ2VkJywgc25pcHBldCwgY2hhbmdlZFByb3BlcnRpZXMpXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgcHJpbnRKc29uOiAtPlxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihAdG9Kc29uKCkpXG5cblxuICAjIFJldHVybnMgYSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gICMgdGhhdCBjYW4gYmUgc2VudCB0byB0aGUgc2VydmVyIGFzIEpTT04uXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkYXRhID0ge31cbiAgICBkYXRhWydjb250ZW50J10gPSBbXVxuICAgIGRhdGFbJ2Rlc2lnbiddID0geyBuYW1lOiBAZGVzaWduLm5hbWVzcGFjZSB9XG5cbiAgICBzbmlwcGV0VG9EYXRhID0gKHNuaXBwZXQsIGxldmVsLCBjb250YWluZXJBcnJheSkgLT5cbiAgICAgIHNuaXBwZXREYXRhID0gc25pcHBldC50b0pzb24oKVxuICAgICAgY29udGFpbmVyQXJyYXkucHVzaCBzbmlwcGV0RGF0YVxuICAgICAgc25pcHBldERhdGFcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBsZXZlbCwgZGF0YU9iaikgLT5cbiAgICAgIHNuaXBwZXREYXRhID0gc25pcHBldFRvRGF0YShzbmlwcGV0LCBsZXZlbCwgZGF0YU9iailcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNvbnRhaW5lckFycmF5ID0gc25pcHBldERhdGEuY29udGFpbmVyc1tzbmlwcGV0Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGxldmVsICsgMSwgY29udGFpbmVyQXJyYXkpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgbGV2ZWwsIGRhdGFPYmopIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0LCAwLCBkYXRhWydjb250ZW50J10pIGlmIEByb290LmZpcnN0XG5cbiAgICBkYXRhXG5cblxuICB0b0pzb246IC0+XG4gICAgQHNlcmlhbGl6ZSgpXG5cblxuICBmcm9tSnNvbjogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgICBzbmlwcGV0ID0gU25pcHBldE1vZGVsLmZyb21Kc29uKHNuaXBwZXREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChzbmlwcGV0KVxuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQHJvb3QuZWFjaCAoc25pcHBldCkgPT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB0aGlzXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEBlbGVtKVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlIHx8PSBAYWxsW25hbWVdXG4gICAgdGhpc1tkaXJlY3RpdmUuaW5kZXggKz0gMV1cblxuXG4gIG5leHRPZlR5cGU6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICAjIGhlbHBlciB0byBkaXJlY3RseSBnZXQgZWxlbWVudCB3cmFwcGVkIGluIGEgalF1ZXJ5IG9iamVjdFxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgY2xvbmU6IC0+XG4gICAgbmV3Q29sbGVjdGlvbiA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgbmV3Q29sbGVjdGlvbi5hZGQoZGlyZWN0aXZlLmNsb25lKCkpXG5cbiAgICBuZXdDb2xsZWN0aW9uXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIHBhcnNlOiAoZWxlbSkgLT5cbiAgICBlbGVtRGlyZWN0aXZlID0gdW5kZWZpbmVkXG4gICAgbW9kaWZpY2F0aW9ucyA9IFtdXG4gICAgQHBhcnNlRGlyZWN0aXZlcyBlbGVtLCAoZGlyZWN0aXZlKSAtPlxuICAgICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICAgIGVsZW1EaXJlY3RpdmUgPSBkaXJlY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kaWZpY2F0aW9ucy5wdXNoKGRpcmVjdGl2ZSlcblxuICAgIEBhcHBseU1vZGlmaWNhdGlvbnMoZWxlbURpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgaWYgZWxlbURpcmVjdGl2ZVxuICAgIHJldHVybiBlbGVtRGlyZWN0aXZlXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChlbGVtLCBmdW5jKSAtPlxuICAgIGRpcmVjdGl2ZURhdGEgPSBbXVxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHIubmFtZVxuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyaWJ1dGVOYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmVEYXRhLnB1c2hcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBhdHRyaWJ1dGVOYW1lXG4gICAgICAgICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlXG4gICAgICAgICAgICBuYW1lOiBhdHRyLnZhbHVlXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICBlbGVtOiBlbGVtXG5cbiAgICAjIFNpbmNlIHdlIG1vZGlmeSB0aGUgYXR0cmlidXRlcyB3ZSBoYXZlIHRvIHNwbGl0XG4gICAgIyB0aGlzIGludG8gdHdvIGxvb3BzXG4gICAgZm9yIGRhdGEgaW4gZGlyZWN0aXZlRGF0YVxuICAgICAgZGlyZWN0aXZlID0gZGF0YS5kaXJlY3RpdmVcbiAgICAgIEByZXdyaXRlQXR0cmlidXRlKGRpcmVjdGl2ZSwgZGF0YS5hdHRyaWJ1dGVOYW1lKVxuICAgICAgZnVuYyhkaXJlY3RpdmUpXG5cblxuICBhcHBseU1vZGlmaWNhdGlvbnM6IChtYWluRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gbW9kaWZpY2F0aW9uc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ29wdGlvbmFsJ1xuICAgICAgICAgIG1haW5EaXJlY3RpdmUub3B0aW9uYWwgPSB0cnVlXG5cblxuICAjIE5vcm1hbGl6ZSBvciByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAjIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gIHJld3JpdGVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICBpZiBhdHRyaWJ1dGVOYW1lICE9IGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICAgIGVsc2UgaWYgbm90IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlKVxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuXG5cbiAgIyBmb3JjZSBhdHRyaWJ1dGUgc3R5bGUgYXMgc3BlY2lmaWVkIGluIGNvbmZpZ1xuICAjIGUuZy4gYXR0cmlidXRlICdkb2MtY29udGFpbmVyJyBiZWNvbWVzICdkYXRhLWRvYy1jb250YWluZXInXG4gIG5vcm1hbGl6ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBlbGVtID0gZGlyZWN0aXZlLmVsZW1cbiAgICBpZiBhdHRyaWJ1dGVOYW1lXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICBlbGVtLnNldEF0dHJpYnV0ZShkaXJlY3RpdmUucmVuZGVyZWRBdHRyKCksIGRpcmVjdGl2ZS5uYW1lKVxuXG5cbiAgcmVtb3ZlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGRpcmVjdGl2ZS5lbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3Igc25pcHBldCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIG91dHB1dCB0aGUgYWNjZXB0ZWQgY29udGVudCBvZiB0aGUgc25pcHBldFxuICAjIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBjcmVhdGVcbiAgIyBlLmc6IHsgdGl0bGU6IFwiSXRjaHkgYW5kIFNjcmF0Y2h5XCIgfVxuICBwcmludERvYzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcbiAgICAgICMgZWRpdGFibGVzOiBPYmplY3Qua2V5cyBAZWRpdGFibGVzIGlmIEBlZGl0YWJsZXNcbiAgICAgICMgY29udGFpbmVyczogT2JqZWN0LmtleXMgQGNvbnRhaW5lcnMgaWYgQGNvbnRhaW5lcnNcblxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihkb2MpXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgbmFtZXNwYWNlOiB1bmRlZmluZWQsIGlkOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IG5hbWVzcGFjZTogcGFydHNbMF0sIGlkOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2Ugc25pcHBldCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
