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
var DirectiveIterator, ImageManager, SnippetView, attr, config, css, dom, eventing, log;

config = require('../configuration/defaults');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

ImageManager = require('./image_manager');

log = require('../modules/logging/log');

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


},{"../configuration/defaults":6,"../interaction/dom":11,"../modules/eventing":18,"../modules/logging/log":23,"../template/directive_iterator":46,"./image_manager":28}],32:[function(require,module,exports){
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

log = require('../modules/logging/log');

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
    console.log(this.temporaryContent);
    console.log("RESETTING " + name + " from " + this.temporaryContent[name]);
    delete this.temporaryContent[name];
    console.log(this.temporaryContent);
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
    if (name === 'image') {
      log('here', 'trace');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvbGliL2tleXMuanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2RlZmF1bHRzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3N0eWxlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2tpY2tzdGFydC9icm93c2VyX3htbGRvbS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9mZWF0dXJlX2RldGVjdHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3NlcmlhbGl6YXRpb24uY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9pbWFnZV9tYW5hZ2VyLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2FycmF5LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QSxJQUFJLENBQUMsU0FBTCxHQUFpQixHQUhQO0VBQUEsQ0FyR1osQ0FBQTs7QUFBQSxxQkE4R0EsUUFBQSxHQUFVLFNBQUEsR0FBQTtBQUNSLFFBQUEsR0FBQTtBQUFBLElBQUEsR0FBQSxHQUNFO0FBQUEsTUFBQSxVQUFBLEVBQVksSUFBQyxDQUFBLFVBQWI7S0FERixDQUFBO1dBS0EsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsR0FBbkIsRUFOUTtFQUFBLENBOUdWLENBQUE7O2tCQUFBOztJQXBCRixDQUFBOztBQUFBLFFBOElRLENBQUMsZUFBVCxHQUEyQixTQUFDLFVBQUQsR0FBQTtBQUN6QixNQUFBLEtBQUE7QUFBQSxFQUFBLElBQUEsQ0FBQSxVQUFBO0FBQUEsVUFBQSxDQUFBO0dBQUE7QUFBQSxFQUVBLEtBQUEsR0FBUSxVQUFVLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUZSLENBQUE7QUFHQSxFQUFBLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDRTtBQUFBLE1BQUUsU0FBQSxFQUFXLE1BQWI7QUFBQSxNQUF3QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBbEM7TUFERjtHQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNIO0FBQUEsTUFBRSxTQUFBLEVBQVcsS0FBTSxDQUFBLENBQUEsQ0FBbkI7QUFBQSxNQUF1QixFQUFBLEVBQUksS0FBTSxDQUFBLENBQUEsQ0FBakM7TUFERztHQUFBLE1BQUE7V0FHSCxHQUFHLENBQUMsS0FBSixDQUFXLCtDQUFBLEdBQWQsVUFBRyxFQUhHO0dBTm9CO0FBQUEsQ0E5STNCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgb2JqZWN0S2V5cyA9IHJlcXVpcmUoJy4vbGliL2tleXMuanMnKTtcbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vbGliL2lzX2FyZ3VtZW50cy5qcycpO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWRPck51bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyICh4KSB7XG4gIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHgubGVuZ3RoICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIHguY29weSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeC5zbGljZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoeC5sZW5ndGggPiAwICYmIHR5cGVvZiB4WzBdICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgb3B0cykge1xuICB2YXIgaSwga2V5O1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gZGVlcEVxdWFsKGEsIGIsIG9wdHMpO1xuICB9XG4gIGlmIChpc0J1ZmZlcihhKSkge1xuICAgIGlmICghaXNCdWZmZXIoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBvcHRzKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuIiwidmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59O1xuXG5leHBvcnRzLnVuc3VwcG9ydGVkID0gdW5zdXBwb3J0ZWQ7XG5mdW5jdGlvbiB1bnN1cHBvcnRlZChvYmplY3Qpe1xuICByZXR1cm4gb2JqZWN0ICYmXG4gICAgdHlwZW9mIG9iamVjdCA9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiBvYmplY3QubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpICYmXG4gICAgIU9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmplY3QsICdjYWxsZWUnKSB8fFxuICAgIGZhbHNlO1xufTtcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJ1xuICA/IE9iamVjdC5rZXlzIDogc2hpbTtcblxuZXhwb3J0cy5zaGltID0gc2hpbTtcbmZ1bmN0aW9uIHNoaW0gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgcmV0dXJuIGtleXM7XG59XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjYgLSBnaXQuaW8vZWVcbiAqIE9saXZlciBDYWxkd2VsbFxuICogTUlUIGxpY2Vuc2VcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cblx0ICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuXHQvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuXHR2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuXHR2YXIgZXhwb3J0cyA9IHRoaXM7XG5cdHZhciBvcmlnaW5hbEdsb2JhbFZhbHVlID0gZXhwb3J0cy5FdmVudEVtaXR0ZXI7XG5cblx0LyoqXG5cdCAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdCdzIHN0b3JhZ2UgYXJyYXkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGxvb2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1ldGhvZC5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gYWxpYXNDbG9zdXJlKCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaWxsIGluaXRpYWxpc2UgdGhlIGV2ZW50IG9iamVjdCBhbmQgbGlzdGVuZXIgYXJyYXlzIGlmIHJlcXVpcmVkLlxuXHQgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG5cdCAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciByZXNwb25zZTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmV0dXJuIGEgY29uY2F0ZW5hdGVkIGFycmF5IG9mIGFsbCBtYXRjaGluZyBldmVudHMgaWZcblx0XHQvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0cmVzcG9uc2Vba2V5XSA9IGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBUYWtlcyBhIGxpc3Qgb2YgbGlzdGVuZXIgb2JqZWN0cyBhbmQgZmxhdHRlbnMgaXQgaW50byBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW119IEp1c3QgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICovXG5cdHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuXHRcdHZhciBmbGF0TGlzdGVuZXJzID0gW107XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmxhdExpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgcmVxdWVzdGVkIGxpc3RlbmVycyB2aWEgZ2V0TGlzdGVuZXJzIGJ1dCB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHJlc3VsdHMgaW5zaWRlIGFuIG9iamVjdC4gVGhpcyBpcyBtYWlubHkgZm9yIGludGVybmFsIHVzZSBidXQgb3RoZXJzIG1heSBmaW5kIGl0IHVzZWZ1bC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBpbiBhbiBvYmplY3QuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlIHx8IGxpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogQWRkcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cblx0ICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG5cdCAqIElmIHlvdSBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lIHRoZW4gdGhlIGxpc3RlbmVyIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuXHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5wdXNoKGxpc3RlbmVySXNXcmFwcGVkID8gbGlzdGVuZXIgOiB7XG5cdFx0XHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0XHRcdG9uY2U6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcblx0ICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0J3MgZmlyc3QgZXhlY3V0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRPbmNlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuXHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0b25jZTogdHJ1ZVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG5cdCAqL1xuXHRwcm90by5vbmNlID0gYWxpYXMoJ2FkZE9uY2VMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuXHQgKiBZb3UgbmVlZCB0byB0ZWxsIGl0IHdoYXQgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIG1hdGNoZWQgYnkgYSByZWdleC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcblx0XHR0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBVc2VzIGRlZmluZUV2ZW50IHRvIGRlZmluZSBtdWx0aXBsZSBldmVudHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2hlbiBwYXNzZWQgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUsIGl0IHdpbGwgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGluZGV4O1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpbmRleCA9IGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpO1xuXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogQWRkcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKiBZZWFoLCB0aGlzIGZ1bmN0aW9uIGRvZXMgcXVpdGUgYSBiaXQuIFRoYXQncyBwcm9iYWJseSBhIGJhZCB0aGluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZExpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG5cdCAqIFRoZSBmaXJzdCBhcmd1bWVudCB3aWxsIGRldGVybWluZSBpZiB0aGUgbGlzdGVuZXJzIGFyZSByZW1vdmVkICh0cnVlKSBvciBhZGRlZCAoZmFsc2UpLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gbWFuaXB1bGF0ZSB0aGUgbGlzdGVuZXJzIG9mIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuXHRcdHZhciBpO1xuXHRcdHZhciB2YWx1ZTtcblx0XHR2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG5cdFx0dmFyIG11bHRpcGxlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lcnMgOiB0aGlzLmFkZExpc3RlbmVycztcblxuXHRcdC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXQncyBwcm9wZXJ0aWVzIHRvIHRoaXMgbWV0aG9kXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuXHRcdFx0Zm9yIChpIGluIGV2dCkge1xuXHRcdFx0XHRpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpICYmICh2YWx1ZSA9IGV2dFtpXSkpIHtcblx0XHRcdFx0XHQvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG5cdFx0XHRcdFx0XHRtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBTbyBldnQgbXVzdCBiZSBhIHN0cmluZ1xuXHRcdFx0Ly8gQW5kIGxpc3RlbmVycyBtdXN0IGJlIGFuIGFycmF5IG9mIGxpc3RlbmVyc1xuXHRcdFx0Ly8gTG9vcCBvdmVyIGl0IGFuZCBwYXNzIGVhY2ggb25lIHRvIHRoZSBtdWx0aXBsZSBtZXRob2Rcblx0XHRcdGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBJZiB5b3UgZG8gbm90IHNwZWNpZnkgYW4gZXZlbnQgdGhlbiBhbGwgbGlzdGVuZXJzIHdpbGwgYmUgcmVtb3ZlZC5cblx0ICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuXHRcdHZhciB0eXBlID0gdHlwZW9mIGV2dDtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJlbW92ZSBkaWZmZXJlbnQgdGhpbmdzIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgZXZ0XG5cdFx0aWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuXHRcdFx0ZGVsZXRlIGV2ZW50c1tldnRdO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuXHRcdFx0ZGVsZXRlIHRoaXMuX2V2ZW50cztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG5cdCAqXG5cdCAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBhbGlhcygncmVtb3ZlRXZlbnQnKTtcblxuXHQvKipcblx0ICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG5cdCAqIFdoZW4gZW1pdHRlZCwgZXZlcnkgbGlzdGVuZXIgYXR0YWNoZWQgdG8gdGhhdCBldmVudCB3aWxsIGJlIGV4ZWN1dGVkLlxuXHQgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG5cdCAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cblx0ICogU28gdGhleSB3aWxsIG5vdCBhcnJpdmUgd2l0aGluIHRoZSBhcnJheSBvbiB0aGUgb3RoZXIgc2lkZSwgdGhleSB3aWxsIGJlIHNlcGFyYXRlLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcjtcblx0XHR2YXIgaTtcblx0XHR2YXIga2V5O1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cblx0XHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRcdC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG5cdFx0XHRcdFx0Ly8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG5cdFx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNba2V5XVtpXTtcblxuXHRcdFx0XHRcdGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc3BvbnNlID0gbGlzdGVuZXIubGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyB8fCBbXSk7XG5cblx0XHRcdFx0XHRpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBlbWl0RXZlbnRcblx0ICovXG5cdHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cblx0ICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiB0aGlzLmVtaXRFdmVudChldnQsIGFyZ3MpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZiBhXG5cdCAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG5cdCAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcblx0XHR0aGlzLl9vbmNlUmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcblx0ICogdGhlIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGlzIG9uZSB0aGVuIGl0IHNob3VsZCBiZSByZW1vdmVkXG5cdCAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cblx0ICpcblx0ICogQHJldHVybiB7KnxCb29sZWFufSBUaGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBmb3Igb3IgdGhlIGRlZmF1bHQsIHRydWUuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIF9nZXRPbmNlUmV0dXJuVmFsdWUoKSB7XG5cdFx0aWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXZlcnRzIHRoZSBnbG9iYWwge0BsaW5rIEV2ZW50RW1pdHRlcn0gdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgdmVyc2lvbi5cblx0ICpcblx0ICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG5cdCAqL1xuXHRFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG5cdFx0ZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBvcmlnaW5hbEdsb2JhbFZhbHVlO1xuXHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdH07XG5cblx0Ly8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHRcdH0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblx0fVxufS5jYWxsKHRoaXMpKTtcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5Eb2N1bWVudCA9IHJlcXVpcmUoJy4vZG9jdW1lbnQnKVxuU25pcHBldFRyZWUgPSByZXF1aXJlKCcuL3NuaXBwZXRfdHJlZS9zbmlwcGV0X3RyZWUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuXG4gICMgSW5zdGFudGlhdGlvbiBwcm9jZXNzOlxuICAjIGFzeW5jIG9yIHN5bmMgLT4gZ2V0IGRlc2lnbiAoaW5jbHVkZSBqcyBmb3Igc3luY2hyb25vdXMgbG9hZGluZylcbiAgIyBzeW5jIC0+IGNyZWF0ZSBkb2N1bWVudFxuICAjIGFzeW5jIC0+IGNyZWF0ZSB2aWV3IChpZnJhbWUpXG4gICMgYXN5bmMgLT4gbG9hZCByZXNvdXJjZXMgaW50byB2aWV3XG5cblxuICAjIExvYWQgYSBkb2N1bWVudCBmcm9tIHNlcmlhbGl6ZWQgZGF0YVxuICAjIGluIGEgc3luY2hyb25vdXMgd2F5LiBEZXNpZ24gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gIG5ldzogKHsgZGF0YSwgZGVzaWduIH0pIC0+XG4gICAgc25pcHBldFRyZWUgPSBpZiBkYXRhP1xuICAgICAgZGVzaWduTmFtZSA9IGRhdGEuZGVzaWduPy5uYW1lXG4gICAgICBhc3NlcnQgZGVzaWduTmFtZT8sICdFcnJvciBjcmVhdGluZyBkb2N1bWVudDogTm8gZGVzaWduIGlzIHNwZWNpZmllZC4nXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IFNuaXBwZXRUcmVlKGNvbnRlbnQ6IGRhdGEsIGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIGRlc2lnbk5hbWUgPSBkZXNpZ25cbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoZGVzaWduOiBkZXNpZ24pXG5cbiAgICBAY3JlYXRlKHNuaXBwZXRUcmVlKVxuXG5cbiAgIyBUb2RvOiBhZGQgYXN5bmMgYXBpIChhc3luYyBiZWNhdXNlIG9mIHRoZSBsb2FkaW5nIG9mIHRoZSBkZXNpZ24pXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAoZG9jdW1lbnQpIC0+XG4gICMgICAgZG9jdW1lbnQuY3JlYXRlVmlldygnLmNvbnRhaW5lcicsIHsgaW50ZXJhY3RpdmU6IHRydWUgfSlcbiAgIyAgLnRoZW4gKHZpZXcpIC0+XG4gICMgICAgIyB2aWV3IGlzIHJlYWR5XG5cblxuICAjIERpcmVjdCBjcmVhdGlvbiB3aXRoIGFuIGV4aXN0aW5nIFNuaXBwZXRUcmVlXG4gIGNyZWF0ZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIG5ldyBEb2N1bWVudCh7IHNuaXBwZXRUcmVlIH0pXG5cblxuICAjIFNlZSBkZXNpZ25DYWNoZS5sb2FkIGZvciBleGFtcGxlcyBob3cgdG8gbG9hZCB5b3VyIGRlc2lnbi5cbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG4gICMgU3RhcnQgZHJhZyAmIGRyb3BcbiAgc3RhcnREcmFnOiAkLnByb3h5KGVkaXRvclBhZ2UsICdzdGFydERyYWcnKVxuXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuXG5cbiMgRXhwb3J0IGdsb2JhbCB2YXJpYWJsZVxud2luZG93LmRvYyA9IGRvY1xuIiwiIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnID0gZG8gLT5cblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIHNuaXBwZXQgY2xhc3Nlc1xuICAgIHNuaXBwZXQ6ICdkb2Mtc25pcHBldCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIHNuaXBwZXRIaWdobGlnaHQ6ICdkb2Mtc25pcHBldC1oaWdobGlnaHQnXG4gICAgY29udGFpbmVySGlnaGxpZ2h0OiAnZG9jLWNvbnRhaW5lci1oaWdobGlnaHQnXG5cbiAgICAjIGRyYWcgJiBkcm9wXG4gICAgZHJhZ2dlZDogJ2RvYy1kcmFnZ2VkJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlcjogJ2RvYy1kcmFnZ2VkLXBsYWNlaG9sZGVyJ1xuICAgIGRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXI6ICdkb2MtZHJhZy1jb3VudGVyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgS2lja3N0YXJ0IGNvbmZpZ1xuICBraWNrc3RhcnQ6XG4gICAgYXR0cjpcbiAgICAgIHN0eWxlczogJ2RvYy1zdHlsZXMnXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuZW5yaWNoQ29uZmlnID0gLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIEBkb2NEaXJlY3RpdmUgPSB7fVxuICBAdGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgQGRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gXCIjeyBAYXR0cmlidXRlUHJlZml4IH0tXCIgaWYgQGF0dHJpYnV0ZVByZWZpeFxuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IHx8ICcnIH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgQGRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIEB0ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cblxuZW5yaWNoQ29uZmlnLmNhbGwoY29uZmlnKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduU3R5bGUgPSByZXF1aXJlKCcuL2Rlc2lnbl9zdHlsZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduXG5cbiAgY29uc3RydWN0b3I6IChkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGVzID0gZGVzaWduLnRlbXBsYXRlcyB8fCBkZXNpZ24uc25pcHBldHNcbiAgICBjb25maWcgPSBkZXNpZ24uY29uZmlnXG4gICAgZ3JvdXBzID0gZGVzaWduLmNvbmZpZy5ncm91cHMgfHwgZGVzaWduLmdyb3Vwc1xuXG4gICAgQG5hbWVzcGFjZSA9IGNvbmZpZz8ubmFtZXNwYWNlIHx8ICdsaXZpbmdkb2NzLXRlbXBsYXRlcydcbiAgICBAcGFyYWdyYXBoU25pcHBldCA9IGNvbmZpZz8ucGFyYWdyYXBoIHx8ICd0ZXh0J1xuICAgIEBjc3MgPSBjb25maWcuY3NzXG4gICAgQGpzID0gY29uZmlnLmpzXG4gICAgQGZvbnRzID0gY29uZmlnLmZvbnRzXG4gICAgQHRlbXBsYXRlcyA9IFtdXG4gICAgQGdyb3VwcyA9IHt9XG4gICAgQHN0eWxlcyA9IHt9XG5cbiAgICBAc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zKHRlbXBsYXRlcylcbiAgICBAZ2xvYmFsU3R5bGVzID0gQGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbihkZXNpZ24uY29uZmlnLnN0eWxlcylcbiAgICBAYWRkR3JvdXBzKGdyb3VwcylcbiAgICBAYWRkVGVtcGxhdGVzTm90SW5Hcm91cHMoKVxuXG5cbiAgc3RvcmVUZW1wbGF0ZURlZmluaXRpb25zOiAodGVtcGxhdGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zID0ge31cbiAgICBmb3IgdGVtcGxhdGUgaW4gdGVtcGxhdGVzXG4gICAgICBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuXG5cbiAgIyBwYXNzIHRoZSB0ZW1wbGF0ZSBhcyBvYmplY3RcbiAgIyBlLmcgYWRkKHtpZDogXCJ0aXRsZVwiLCBuYW1lOlwiVGl0bGVcIiwgaHRtbDogXCI8aDEgZG9jLWVkaXRhYmxlPlRpdGxlPC9oMT5cIn0pXG4gIGFkZDogKHRlbXBsYXRlRGVmaW5pdGlvbiwgc3R5bGVzKSAtPlxuICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlRGVmaW5pdGlvbi5pZF0gPSB1bmRlZmluZWRcbiAgICB0ZW1wbGF0ZU9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKHRlbXBsYXRlRGVmaW5pdGlvbi5zdHlsZXMpXG4gICAgdGVtcGxhdGVTdHlsZXMgPSAkLmV4dGVuZCh7fSwgc3R5bGVzLCB0ZW1wbGF0ZU9ubHlTdHlsZXMpXG5cbiAgICB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZVxuICAgICAgbmFtZXNwYWNlOiBAbmFtZXNwYWNlXG4gICAgICBpZDogdGVtcGxhdGVEZWZpbml0aW9uLmlkXG4gICAgICB0aXRsZTogdGVtcGxhdGVEZWZpbml0aW9uLnRpdGxlXG4gICAgICBzdHlsZXM6IHRlbXBsYXRlU3R5bGVzXG4gICAgICBodG1sOiB0ZW1wbGF0ZURlZmluaXRpb24uaHRtbFxuICAgICAgd2VpZ2h0OiB0ZW1wbGF0ZURlZmluaXRpb24uc29ydE9yZGVyIHx8IDBcblxuICAgIEB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZSlcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgYWRkR3JvdXBzOiAoY29sbGVjdGlvbikgLT5cbiAgICBmb3IgZ3JvdXBOYW1lLCBncm91cCBvZiBjb2xsZWN0aW9uXG4gICAgICBncm91cE9ubHlTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGdyb3VwLnN0eWxlcylcbiAgICAgIGdyb3VwU3R5bGVzID0gJC5leHRlbmQoe30sIEBnbG9iYWxTdHlsZXMsIGdyb3VwT25seVN0eWxlcylcblxuICAgICAgdGVtcGxhdGVzID0ge31cbiAgICAgIGZvciB0ZW1wbGF0ZUlkIGluIGdyb3VwLnRlbXBsYXRlc1xuICAgICAgICB0ZW1wbGF0ZURlZmluaXRpb24gPSBAdGVtcGxhdGVEZWZpbml0aW9uc1t0ZW1wbGF0ZUlkXVxuICAgICAgICBpZiB0ZW1wbGF0ZURlZmluaXRpb25cbiAgICAgICAgICB0ZW1wbGF0ZSA9IEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBncm91cFN0eWxlcylcbiAgICAgICAgICB0ZW1wbGF0ZXNbdGVtcGxhdGUuaWRdID0gdGVtcGxhdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy53YXJuKFwiVGhlIHRlbXBsYXRlICcje3RlbXBsYXRlSWR9JyByZWZlcmVuY2VkIGluIHRoZSBncm91cCAnI3tncm91cE5hbWV9JyBkb2VzIG5vdCBleGlzdC5cIilcblxuICAgICAgQGFkZEdyb3VwKGdyb3VwTmFtZSwgZ3JvdXAsIHRlbXBsYXRlcylcblxuXG4gIGFkZFRlbXBsYXRlc05vdEluR3JvdXBzOiAoZ2xvYmFsU3R5bGVzKSAtPlxuICAgIGZvciB0ZW1wbGF0ZUlkLCB0ZW1wbGF0ZURlZmluaXRpb24gb2YgQHRlbXBsYXRlRGVmaW5pdGlvbnNcbiAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICBAYWRkKHRlbXBsYXRlRGVmaW5pdGlvbiwgQGdsb2JhbFN0eWxlcylcblxuXG4gIGFkZEdyb3VwOiAobmFtZSwgZ3JvdXAsIHRlbXBsYXRlcykgLT5cbiAgICBAZ3JvdXBzW25hbWVdID1cbiAgICAgIHRpdGxlOiBncm91cC50aXRsZVxuICAgICAgdGVtcGxhdGVzOiB0ZW1wbGF0ZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlQ29sbGVjdGlvbjogKHN0eWxlcykgLT5cbiAgICBkZXNpZ25TdHlsZXMgPSB7fVxuICAgIGlmIHN0eWxlc1xuICAgICAgZm9yIHN0eWxlRGVmaW5pdGlvbiBpbiBzdHlsZXNcbiAgICAgICAgZGVzaWduU3R5bGUgPSBAY3JlYXRlRGVzaWduU3R5bGUoc3R5bGVEZWZpbml0aW9uKVxuICAgICAgICBkZXNpZ25TdHlsZXNbZGVzaWduU3R5bGUubmFtZV0gPSBkZXNpZ25TdHlsZSBpZiBkZXNpZ25TdHlsZVxuXG4gICAgZGVzaWduU3R5bGVzXG5cblxuICBjcmVhdGVEZXNpZ25TdHlsZTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBpZiBzdHlsZURlZmluaXRpb24gJiYgc3R5bGVEZWZpbml0aW9uLm5hbWVcbiAgICAgIG5ldyBEZXNpZ25TdHlsZVxuICAgICAgICBuYW1lOiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgICB0eXBlOiBzdHlsZURlZmluaXRpb24udHlwZVxuICAgICAgICBvcHRpb25zOiBzdHlsZURlZmluaXRpb24ub3B0aW9uc1xuICAgICAgICB2YWx1ZTogc3R5bGVEZWZpbml0aW9uLnZhbHVlXG5cblxuICByZW1vdmU6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBAdGVtcGxhdGVzLnNwbGljZShAZ2V0SW5kZXgoaWQpLCAxKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBAY2hlY2tOYW1lc3BhY2UgaWRlbnRpZmllciwgKGlkKSA9PlxuICAgICAgdGVtcGxhdGUgPSB1bmRlZmluZWRcbiAgICAgIEBlYWNoICh0LCBpbmRleCkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIHRlbXBsYXRlID0gdFxuXG4gICAgICB0ZW1wbGF0ZVxuXG5cbiAgZ2V0SW5kZXg6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICBpbmRleCA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGkpIC0+XG4gICAgICAgIGlmIHQuaWQgPT0gaWRcbiAgICAgICAgICBpbmRleCA9IGlcblxuICAgICAgaW5kZXhcblxuXG4gIGNoZWNrTmFtZXNwYWNlOiAoaWRlbnRpZmllciwgY2FsbGJhY2spIC0+XG4gICAgeyBuYW1lc3BhY2UsIGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIGFzc2VydCBub3QgbmFtZXNwYWNlIG9yIEBuYW1lc3BhY2UgaXMgbmFtZXNwYWNlLFxuICAgICAgXCJkZXNpZ24gI3sgQG5hbWVzcGFjZSB9OiBjYW5ub3QgZ2V0IHRlbXBsYXRlIHdpdGggZGlmZmVyZW50IG5hbWVzcGFjZSAjeyBuYW1lc3BhY2UgfSBcIlxuXG4gICAgY2FsbGJhY2soaWQpXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHRlbXBsYXRlLCBpbmRleCBpbiBAdGVtcGxhdGVzXG4gICAgICBjYWxsYmFjayh0ZW1wbGF0ZSwgaW5kZXgpXG5cblxuICAjIGxpc3QgYXZhaWxhYmxlIFRlbXBsYXRlc1xuICBsaXN0OiAtPlxuICAgIHRlbXBsYXRlcyA9IFtdXG4gICAgQGVhY2ggKHRlbXBsYXRlKSAtPlxuICAgICAgdGVtcGxhdGVzLnB1c2godGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIHRlbXBsYXRlc1xuXG5cbiAgIyBwcmludCBkb2N1bWVudGF0aW9uIGZvciBhIHRlbXBsYXRlXG4gIGluZm86IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldChpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLnByaW50RG9jKClcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ3lvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFdpbGwgYmUgZXh0ZW5kZWQgdG8gbG9hZCBkZXNpZ25zIHJlbW90ZWx5IGZyb20gYSBzZXJ2ZXI6XG4gICMgTG9hZCBmcm9tIHRoZSBkZWZhdWx0IHNvdXJjZTpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2doaWJsaScpXG4gICNcbiAgIyBMb2FkIGZyb20gYSBjdXN0b20gc2VydmVyOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnaHR0cDovL3lvdXJzZXJ2ZXIuaW8vZGVzaWducy9naGlibGkvZGVzaWduLmpzb24nKVxuICBsb2FkOiAobmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgYXNzZXJ0IGZhbHNlLCAnTG9hZCBkZXNpZ24gYnkgbmFtZSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LidcbiAgICBlbHNlXG4gICAgICBkZXNpZ25Db25maWcgPSBuYW1lXG4gICAgICBkZXNpZ24gPSBuZXcgRGVzaWduKGRlc2lnbkNvbmZpZylcbiAgICAgIEBhZGQoZGVzaWduKVxuXG5cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIG5hbWUgPSBkZXNpZ24ubmFtZXNwYWNlXG4gICAgQGRlc2lnbnNbbmFtZV0gPSBkZXNpZ25cblxuXG4gIGhhczogKG5hbWUpIC0+XG4gICAgQGRlc2lnbnNbbmFtZV0/XG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGFzc2VydCBAaGFzKG5hbWUpLCBcIkVycm9yOiBkZXNpZ24gJyN7IG5hbWUgfScgaXMgbm90IGxvYWRlZC5cIlxuICAgIEBkZXNpZ25zW25hbWVdXG5cblxuICByZXNldENhY2hlOiAtPlxuICAgIEBkZXNpZ25zID0ge31cblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25TdHlsZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgc3dpdGNoIEB0eXBlXG4gICAgICB3aGVuICdvcHRpb24nXG4gICAgICAgIGFzc2VydCB2YWx1ZSwgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAndmFsdWUnIHByb3ZpZGVkXCJcbiAgICAgICAgQHZhbHVlID0gdmFsdWVcbiAgICAgIHdoZW4gJ3NlbGVjdCdcbiAgICAgICAgYXNzZXJ0IG9wdGlvbnMsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ29wdGlvbnMnIHByb3ZpZGVkXCJcbiAgICAgICAgQG9wdGlvbnMgPSBvcHRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IHVua25vd24gdHlwZSAnI3sgQHR5cGUgfSdcIlxuXG5cbiAgIyBHZXQgaW5zdHJ1Y3Rpb25zIHdoaWNoIGNzcyBjbGFzc2VzIHRvIGFkZCBhbmQgcmVtb3ZlLlxuICAjIFdlIGRvIG5vdCBjb250cm9sIHRoZSBjbGFzcyBhdHRyaWJ1dGUgb2YgYSBzbmlwcGV0IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IERlc2lnblN0eWxlI3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRG9jdW1lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBzbmlwcGV0VHJlZSB9KSAtPlxuICAgIEBkZXNpZ24gPSBzbmlwcGV0VHJlZS5kZXNpZ25cbiAgICBAc2V0U25pcHBldFRyZWUoc25pcHBldFRyZWUpXG4gICAgQHZpZXdzID0ge31cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdW5kZWZpbmVkXG5cblxuICBzZXRTbmlwcGV0VHJlZTogKHNuaXBwZXRUcmVlKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0VHJlZS5kZXNpZ24gPT0gQGRlc2lnbixcbiAgICAgICdTbmlwcGV0VHJlZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVzaWduIGFzIHRoZSBkb2N1bWVudCdcblxuICAgIEBtb2RlbCA9IEBzbmlwcGV0VHJlZSA9IHNuaXBwZXRUcmVlXG4gICAgQGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50cygpXG5cblxuICBmb3J3YXJkU25pcHBldFRyZWVFdmVudHM6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmNoYW5nZWQuYWRkID0+XG4gICAgICBAZW1pdCAnY2hhbmdlJywgYXJndW1lbnRzXG5cblxuICBjcmVhdGVWaWV3OiAocGFyZW50LCBvcHRpb25zKSAtPlxuICAgIHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIG9wdGlvbnMgPz0gcmVhZE9ubHk6IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA9IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuICAgIHZpZXcgPSBuZXcgVmlldyhAc25pcHBldFRyZWUsICRwYXJlbnRbMF0pXG4gICAgcHJvbWlzZSA9IHZpZXcuY3JlYXRlKG9wdGlvbnMpXG5cbiAgICBpZiB2aWV3LmlzSW50ZXJhY3RpdmVcbiAgICAgIEBzZXRJbnRlcmFjdGl2ZVZpZXcodmlldylcblxuICAgIHByb21pc2VcblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBEb2N1bWVudCBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIHRvSHRtbDogLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBzbmlwcGV0VHJlZTogQHNuaXBwZXRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQHNuaXBwZXRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIHNwYWNlID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBTbmlwcGV0VHJlZS5cbiAgcHJpbnRNb2RlbDogKCkgLT5cbiAgICBAc25pcHBldFRyZWUucHJpbnQoKVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIFNuaXBwZXRUcmVlIGFuZCBMaXZpbmdkb2NzIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cbiAgc25pcHBldFJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc25pcHBldCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBzbmlwcGV0IHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICAjIFNuaXBwZXRzIGFyZSBtYXJrZWQgYnkgYSBjbGFzcyBhdCB0aGUgbW9tZW50LlxuICBmaW5kU25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHZpZXcgPSBAZ2V0U25pcHBldFZpZXcobm9kZSlcbiAgICAgICAgcmV0dXJuIHZpZXdcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZmluZE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIG5vZGVDb250ZXh0ID0gQGdldE5vZGVDb250ZXh0KG5vZGUpXG4gICAgICByZXR1cm4gbm9kZUNvbnRleHQgaWYgbm9kZUNvbnRleHRcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZ2V0Tm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIGZvciBkaXJlY3RpdmVUeXBlLCBvYmogb2YgY29uZmlnLmRpcmVjdGl2ZXNcbiAgICAgIGNvbnRpbnVlIGlmIG5vdCBvYmouZWxlbWVudERpcmVjdGl2ZVxuXG4gICAgICBkaXJlY3RpdmVBdHRyID0gb2JqLnJlbmRlcmVkQXR0clxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZXh0QXR0cjogZGlyZWN0aXZlQXR0clxuICAgICAgICAgIGF0dHJOYW1lOiBub2RlLmdldEF0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICAjIEZpbmQgdGhlIGNvbnRhaW5lciB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgZmluZENvbnRhaW5lcjogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBpZiBub3Qgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgICAgdmlldyA9IEBmaW5kU25pcHBldFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgc25pcHBldFZpZXc6IHZpZXdcbiAgICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICB7fVxuXG5cbiAgZ2V0SW1hZ2VOYW1lOiAobm9kZSkgLT5cbiAgICBpbWFnZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICByZXR1cm4gaW1hZ2VOYW1lXG5cblxuICBnZXRIdG1sRWxlbWVudE5hbWU6IChub2RlKSAtPlxuICAgIGh0bWxBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIGh0bWxFbGVtZW50TmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgcmV0dXJuIGh0bWxFbGVtZW50TmFtZVxuXG5cbiAgZ2V0RWRpdGFibGVOYW1lOiAobm9kZSkgLT5cbiAgICBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICByZXR1cm4gZWRpdGFibGVOYW1lXG5cblxuICBkcm9wVGFyZ2V0OiAobm9kZSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgIyBhYm92ZSBjb250YWluZXJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIHNuaXBwZXRcbiAgICAgIGVsc2UgaWYgc25pcHBldFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHJldHVybiBAZ2V0U25pcHBldFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRSb290VGFyZ2V0KG5vZGUpXG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuXG4gIGdldFNuaXBwZXRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdzbmlwcGV0J1xuICAgIHNuaXBwZXRWaWV3OiBAZ2V0U25pcHBldFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25TbmlwcGV0KGVsZW0sIHsgdG9wLCBsZWZ0IH0pXG5cblxuICBnZXRDbG9zZXN0U25pcHBldFRhcmdldDogKGNsb3Nlc3RTbmlwcGV0RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdFNuaXBwZXREYXRhLiRlbGVtWzBdXG4gICAgcG9zaXRpb24gPSBjbG9zZXN0U25pcHBldERhdGEucG9zaXRpb25cbiAgICBAZ2V0U25pcHBldFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRWaWV3OiBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuXG5cbiAgZ2V0Um9vdFRhcmdldDogKG5vZGUpIC0+XG4gICAgc25pcHBldFRyZWUgPSAkKG5vZGUpLmRhdGEoJ3NuaXBwZXRUcmVlJylcblxuICAgIHRhcmdldDogJ3Jvb3QnXG4gICAgbm9kZTogbm9kZVxuICAgIHNuaXBwZXRUcmVlOiBzbmlwcGV0VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgc25pcHBldFxuICAjIGJhc2VkIG9uIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gIGdldFBvc2l0aW9uT25TbmlwcGV0OiAoZWxlbSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgIGlmIEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICdiZWZvcmUnXG4gICAgZWxzZVxuICAgICAgJ2FmdGVyJ1xuXG5cbiAgIyBHZXQgdGhlIGNsb3Nlc3Qgc25pcHBldCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0U25pcHBldDogKGNvbnRhaW5lciwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkc25pcHBldHMgPSAkKGNvbnRhaW5lcikuZmluZChcIi4jeyBjc3Muc25pcHBldCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RTbmlwcGV0ID0gdW5kZWZpbmVkXG5cbiAgICAkc25pcHBldHMuZWFjaCAoaW5kZXgsIGVsZW0pID0+XG4gICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbVRvcClcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYWZ0ZXInfVxuXG4gICAgY2xvc2VzdFNuaXBwZXRcblxuXG4gIGRpc3RhbmNlOiAoYSwgYikgLT5cbiAgICBpZiBhID4gYiB0aGVuIGEgLSBiIGVsc2UgYiAtIGFcblxuXG4gICMgZm9yY2UgYWxsIGNvbnRhaW5lcnMgb2YgYSBzbmlwcGV0IHRvIGJlIGFzIGhpZ2ggYXMgdGhleSBjYW4gYmVcbiAgIyBzZXRzIGNzcyBzdHlsZSBoZWlnaHRcbiAgbWF4aW1pemVDb250YWluZXJIZWlnaHQ6ICh2aWV3KSAtPlxuICAgIGlmIHZpZXcudGVtcGxhdGUuY29udGFpbmVyQ291bnQgPiAxXG4gICAgICBmb3IgbmFtZSwgZWxlbSBvZiB2aWV3LmNvbnRhaW5lcnNcbiAgICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICAgIGNvbnRpbnVlIGlmICRlbGVtLmhhc0NsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICAjIHJlbW92ZSBhbGwgY3NzIHN0eWxlIGhlaWdodCBkZWNsYXJhdGlvbnMgYWRkZWQgYnlcbiAgIyBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodCgpXG4gIHJlc3RvcmVDb250YWluZXJIZWlnaHQ6ICgpIC0+XG4gICAgJChcIi4jeyBjc3MubWF4aW1pemVkQ29udGFpbmVyIH1cIilcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLnJlbW92ZUNsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBTbmlwcGV0cyBzdG9yZSBhIHJlZmVyZW5jZSBvZiB0aGVtc2VsdmVzIGluIHRoZWlyIERvbSBub2RlXG4gICMgY29uc2lkZXI6IHN0b3JlIHJlZmVyZW5jZSBkaXJlY3RseSB3aXRob3V0IGpRdWVyeVxuICBnZXRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgJChub2RlKS5kYXRhKCdzbmlwcGV0JylcblxuXG4gICMgR2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qgd2l0aCB0b3AgYW5kIGxlZnQgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50XG4gICMgKGlkZWFsIGZvciBhYnNvbHV0ZSBwb3NpdGlvbmVkIGVsZW1lbnRzKVxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogKG5vZGUpIC0+XG4gICAgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgeyBzY3JvbGxYLCBzY3JvbGxZIH0gPSBAZ2V0U2Nyb2xsUG9zaXRpb24od2luKVxuXG4gICAgIyB0cmFuc2xhdGUgaW50byBhYnNvbHV0ZSBwb3NpdGlvbnNcbiAgICBjb29yZHMgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgY29vcmRzID1cbiAgICAgIHRvcDogY29vcmRzLnRvcCArIHNjcm9sbFlcbiAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSArIHNjcm9sbFlcbiAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0ICsgc2Nyb2xsWFxuICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCArIHNjcm9sbFhcblxuICAgIGNvb3Jkcy5oZWlnaHQgPSBjb29yZHMuYm90dG9tIC0gY29vcmRzLnRvcFxuICAgIGNvb3Jkcy53aWR0aCA9IGNvb3Jkcy5yaWdodCAtIGNvb3Jkcy5sZWZ0XG5cbiAgICBjb29yZHNcblxuXG4gIGdldFNjcm9sbFBvc2l0aW9uOiAod2luKSAtPlxuICAgICMgY29kZSBmcm9tIG1kbjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy5zY3JvbGxYXG4gICAgc2Nyb2xsWDogaWYgKHdpbi5wYWdlWE9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VYT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdFxuICAgIHNjcm9sbFk6IGlmICh3aW4ucGFnZVlPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWU9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcFxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBEcmFnQmFzZVxuI1xuIyBTdXBwb3J0ZWQgZHJhZyBtb2RlczpcbiMgLSBEaXJlY3QgKHN0YXJ0IGltbWVkaWF0ZWx5KVxuIyAtIExvbmdwcmVzcyAoc3RhcnQgYWZ0ZXIgYSBkZWxheSBpZiB0aGUgY3Vyc29yIGRvZXMgbm90IG1vdmUgdG9vIG11Y2gpXG4jIC0gTW92ZSAoc3RhcnQgYWZ0ZXIgdGhlIGN1cnNvciBtb3ZlZCBhIG1pbnVtdW0gZGlzdGFuY2UpXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERyYWdCYXNlXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSwgb3B0aW9ucykgLT5cbiAgICBAbW9kZXMgPSBbJ2RpcmVjdCcsICdsb25ncHJlc3MnLCAnbW92ZSddXG5cbiAgICBkZWZhdWx0Q29uZmlnID1cbiAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuICAgICAgb25EcmFnU3RhcnQ6IHVuZGVmaW5lZFxuICAgICAgc2Nyb2xsQXJlYTogNTBcbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuICAgICAgbW92ZTpcbiAgICAgICAgZGlzdGFuY2U6IDBcblxuICAgIEBkZWZhdWx0Q29uZmlnID0gJC5leHRlbmQodHJ1ZSwgZGVmYXVsdENvbmZpZywgb3B0aW9ucylcblxuICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG5cblxuICBzZXRPcHRpb25zOiAob3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGVmYXVsdENvbmZpZywgb3B0aW9ucylcbiAgICBAbW9kZSA9IGlmIG9wdGlvbnMuZGlyZWN0P1xuICAgICAgJ2RpcmVjdCdcbiAgICBlbHNlIGlmIG9wdGlvbnMubG9uZ3ByZXNzP1xuICAgICAgJ2xvbmdwcmVzcydcbiAgICBlbHNlIGlmIG9wdGlvbnMubW92ZT9cbiAgICAgICdtb3ZlJ1xuICAgIGVsc2VcbiAgICAgICdsb25ncHJlc3MnXG5cblxuICBzZXREcmFnSGFuZGxlcjogKGRyYWdIYW5kbGVyKSAtPlxuICAgIEBkcmFnSGFuZGxlciA9IGRyYWdIYW5kbGVyXG4gICAgQGRyYWdIYW5kbGVyLnBhZ2UgPSBAcGFnZVxuXG5cbiAgIyBzdGFydCBhIHBvc3NpYmxlIGRyYWdcbiAgIyB0aGUgZHJhZyBpcyBvbmx5IHJlYWxseSBzdGFydGVkIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgdmlvbGF0ZWQgKGxvbmdwcmVzc0RlbGF5IGFuZCBsb25ncHJlc3NEaXN0YW5jZUxpbWl0IG9yIG1pbkRpc3RhbmNlKVxuICBpbml0OiAoZHJhZ0hhbmRsZXIsIGV2ZW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBzZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgQHNldERyYWdIYW5kbGVyKGRyYWdIYW5kbGVyKVxuICAgIEBzdGFydFBvaW50ID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG5cbiAgICBAYWRkU3RvcExpc3RlbmVycyhldmVudClcbiAgICBAYWRkTW92ZUxpc3RlbmVycyhldmVudClcblxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBAYWRkTG9uZ3ByZXNzSW5kaWNhdG9yKEBzdGFydFBvaW50KVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICAgICAgQHN0YXJ0KGV2ZW50KVxuICAgICAgICAsIEBvcHRpb25zLmxvbmdwcmVzcy5kZWxheVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ2RpcmVjdCdcbiAgICAgIEBzdGFydChldmVudClcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgbW92ZTogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KGV2ZW50KVxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBhZGRCbG9ja2VyKClcbiAgICBAcGFnZS4kYm9keS5hZGRDbGFzcyhjb25maWcuY3NzLnByZXZlbnRTZWxlY3Rpb24pXG4gICAgQGRyYWdIYW5kbGVyLnN0YXJ0KGV2ZW50UG9zaXRpb24pXG5cblxuICBkcm9wOiAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKCkgaWYgQHN0YXJ0ZWRcbiAgICBAcmVzZXQoKVxuXG5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcbiAgICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICAgIEBwYWdlLiRib2R5LnJlbW92ZUNsYXNzKGNvbmZpZy5jc3MucHJldmVudFNlbGVjdGlvbilcblxuXG4gICAgaWYgQGluaXRpYWxpemVkXG4gICAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICAgIEBkcmFnSGFuZGxlci5yZXNldCgpXG4gICAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICAgIGlmIEB0aW1lb3V0P1xuICAgICAgICBjbGVhclRpbWVvdXQoQHRpbWVvdXQpXG4gICAgICAgIEB0aW1lb3V0ID0gdW5kZWZpbmVkXG5cbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICBAcmVtb3ZlQmxvY2tlcigpXG5cblxuICBhZGRCbG9ja2VyOiAtPlxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9J2RyYWdCbG9ja2VyJz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkYmxvY2tlcilcblxuXG4gIHJlbW92ZUJsb2NrZXI6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZCgnLmRyYWdCbG9ja2VyJykucmVtb3ZlKClcblxuXG5cbiAgYWRkTG9uZ3ByZXNzSW5kaWNhdG9yOiAoeyBwYWdlWCwgcGFnZVkgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvcHRpb25zLmxvbmdwcmVzcy5zaG93SW5kaWNhdG9yXG4gICAgJGluZGljYXRvciA9ICQoXCI8ZGl2IGNsYXNzPVxcXCIjeyBjb25maWcuY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XFxcIj48ZGl2PjwvZGl2PjwvZGl2PlwiKVxuICAgICRpbmRpY2F0b3IuY3NzKGxlZnQ6IHBhZ2VYLCB0b3A6IHBhZ2VZKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkaW5kaWNhdG9yKVxuXG5cbiAgcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCA9PlxuICAgICAgQGRyb3AoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIHBvc3NpYmx5IGluaXRpYWxpemVkIHdpdGggYSBkZWxheSBpbiBzbmlwcGV0RHJhZyNvblN0YXJ0XG4gIGFkZE1vdmVMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICd0b3VjaG1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdtb3VzZW1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG5cbiAgZ2V0RXZlbnRQb3NpdGlvbjogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnIHx8IGV2ZW50LnR5cGUgPT0gJ3RvdWNobW92ZSdcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXVxuXG4gICAgY2xpZW50WDogZXZlbnQuY2xpZW50WFxuICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFlcbiAgICBwYWdlWDogZXZlbnQucGFnZVhcbiAgICBwYWdlWTogZXZlbnQucGFnZVlcblxuXG4gIGRpc3RhbmNlOiAocG9pbnRBLCBwb2ludEIpIC0+XG4gICAgcmV0dXJuIHVuZGVmaW5lZCBpZiAhcG9pbnRBIHx8ICFwb2ludEJcblxuICAgIGRpc3RYID0gcG9pbnRBLnBhZ2VYIC0gcG9pbnRCLnBhZ2VYXG4gICAgZGlzdFkgPSBwb2ludEEucGFnZVkgLSBwb2ludEIucGFnZVlcbiAgICBNYXRoLnNxcnQoIChkaXN0WCAqIGRpc3RYKSArIChkaXN0WSAqIGRpc3RZKSApXG5cblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBFZGl0YWJsZUpTIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBFZGl0YWJsZUpTIGludG8gTGl2aW5nZG9jc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZUNvbnRyb2xsZXJcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlKSAtPlxuICAgICMgSW5pdGlhbGl6ZSBFZGl0YWJsZUpTXG4gICAgQGVkaXRhYmxlID0gbmV3IEVkaXRhYmxlKHdpbmRvdzogQHBhZ2Uud2luZG93KTtcblxuICAgIEBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBAc2VsZWN0aW9uID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGVkaXRhYmxlXG4gICAgICAuZm9jdXMoQHdpdGhDb250ZXh0KEBmb2N1cykpXG4gICAgICAuYmx1cihAd2l0aENvbnRleHQoQGJsdXIpKVxuICAgICAgLmluc2VydChAd2l0aENvbnRleHQoQGluc2VydCkpXG4gICAgICAubWVyZ2UoQHdpdGhDb250ZXh0KEBtZXJnZSkpXG4gICAgICAuc3BsaXQoQHdpdGhDb250ZXh0KEBzcGxpdCkpXG4gICAgICAuc2VsZWN0aW9uKEB3aXRoQ29udGV4dChAc2VsZWN0aW9uQ2hhbmdlZCkpXG4gICAgICAubmV3bGluZShAd2l0aENvbnRleHQoQG5ld2xpbmUpKVxuXG5cbiAgIyBSZWdpc3RlciBET00gbm9kZXMgd2l0aCBFZGl0YWJsZUpTLlxuICAjIEFmdGVyIHRoYXQgRWRpdGFibGUgd2lsbCBmaXJlIGV2ZW50cyBmb3IgdGhhdCBub2RlLlxuICBhZGQ6IChub2RlcykgLT5cbiAgICBAZWRpdGFibGUuYWRkKG5vZGVzKVxuXG5cbiAgZGlzYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuc3VzcGVuZCgpXG5cblxuICByZWVuYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuY29udGludWUoKVxuXG5cbiAgIyBHZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lIGZyb20gdGhlIERPTSBlbGVtZW50IHBhc3NlZCBieSBFZGl0YWJsZUpTXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kU25pcHBldFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmFsdWUgPSB2aWV3LmdldChlZGl0YWJsZU5hbWUpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdmFsdWUgPSB1bmRlZmluZWRcblxuICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgdmFsdWUpXG5cblxuICBmb2N1czogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmZvY3VzRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVGb2N1c2VkKGVsZW1lbnQsIHZpZXcpXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBpbnNlcnQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuXG4gICAgICBzbmlwcGV0TmFtZSA9IEBwYWdlLmRlc2lnbi5wYXJhZ3JhcGhTbmlwcGV0XG4gICAgICB0ZW1wbGF0ZSA9IEBwYWdlLmRlc2lnbi5nZXQoc25pcHBldE5hbWUpXG4gICAgICBjb3B5ID0gdGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG4gICAgICBuZXdWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnXG4gICAgICAgIHZpZXcubW9kZWwuYmVmb3JlKGNvcHkpXG4gICAgICAgIHZpZXcucHJldigpXG4gICAgICBlbHNlXG4gICAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgICAgdmlldy5uZXh0KClcblxuICAgICAgbmV3Vmlldy5mb2N1cygpIGlmIG5ld1ZpZXdcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuXG4gICAgICAgICMgY3JlYXRlIGRvY3VtZW50IGZyYWdtZW50XG4gICAgICAgIGNvbnRlbnRzID0gdmlldy5kaXJlY3RpdmVzLiRnZXRFbGVtKGVkaXRhYmxlTmFtZSkuY29udGVudHMoKVxuICAgICAgICBmcmFnID0gQHBhZ2UuZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gICAgICAgIGZvciBlbCBpbiBjb250ZW50c1xuICAgICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoZWwpXG5cbiAgICAgICAgbWVyZ2VkVmlldy5mb2N1cygpXG4gICAgICAgIGVsZW0gPSBtZXJnZWRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBjdXJzb3IgPSBAZWRpdGFibGUuY3JlYXRlQ3Vyc29yKGVsZW0sIGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuICdlbmQnIGVsc2UgJ2JlZ2lubmluZycpXG4gICAgICAgIGN1cnNvclsgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2luc2VydEFmdGVyJyBlbHNlICdpbnNlcnRCZWZvcmUnIF0oZnJhZylcblxuICAgICAgICAjIE1ha2Ugc3VyZSB0aGUgbW9kZWwgb2YgdGhlIG1lcmdlZFZpZXcgaXMgdXAgdG8gZGF0ZVxuICAgICAgICAjIG90aGVyd2lzZSBidWdzIGxpa2UgaW4gaXNzdWUgIzU2IGNhbiBvY2N1ci5cbiAgICAgICAgY3Vyc29yLnNhdmUoKVxuICAgICAgICBAdXBkYXRlTW9kZWwobWVyZ2VkVmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgICBjdXJzb3IucmVzdG9yZSgpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0U2VsZWN0aW9uKClcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBzcGxpdDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgYmVmb3JlLCBhZnRlciwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgY29weSA9IHZpZXcudGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG4gICAgICAjIGdldCBjb250ZW50IG91dCBvZiAnYmVmb3JlJyBhbmQgJ2FmdGVyJ1xuICAgICAgYmVmb3JlQ29udGVudCA9IGJlZm9yZS5xdWVyeVNlbGVjdG9yKCcqJykuaW5uZXJIVE1MXG4gICAgICBhZnRlckNvbnRlbnQgPSBhZnRlci5xdWVyeVNlbGVjdG9yKCcqJykuaW5uZXJIVE1MXG5cbiAgICAgICMgc2V0IGVkaXRhYmxlIG9mIHNuaXBwZXRzIHRvIGlubmVySFRNTCBvZiBmcmFnbWVudHNcbiAgICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgYmVmb3JlQ29udGVudClcbiAgICAgIGNvcHkuc2V0KGVkaXRhYmxlTmFtZSwgYWZ0ZXJDb250ZW50KVxuXG4gICAgICAjIGFwcGVuZCBhbmQgZm9jdXMgY29weSBvZiBzbmlwcGV0XG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKS5mb2N1cygpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICBuZXdsaW5lOiAodmlldywgZWRpdGFibGUsIGN1cnNvcikgLT5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgaGFzU2luZ2xlRWRpdGFibGU6ICh2aWV3KSAtPlxuICAgIHZpZXcuZGlyZWN0aXZlcy5sZW5ndGggPT0gMSAmJiB2aWV3LmRpcmVjdGl2ZXNbMF0udHlwZSA9PSAnZWRpdGFibGUnXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5cbiMgRG9jdW1lbnQgRm9jdXNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBzbmlwcGV0IG9yIGVkaXRhYmxlIHRoYXQgaXMgY3VycmVudGx5IGZvY3VzZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRm9jdXNcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG4gICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG5cbiAgICBAc25pcHBldEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0Qmx1ciA9ICQuQ2FsbGJhY2tzKClcblxuXG4gIHNldEZvY3VzOiAoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBlZGl0YWJsZU5vZGUgIT0gQGVkaXRhYmxlTm9kZVxuICAgICAgQHJlc2V0RWRpdGFibGUoKVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IGVkaXRhYmxlTm9kZVxuXG4gICAgaWYgc25pcHBldFZpZXcgIT0gQHNuaXBwZXRWaWV3XG4gICAgICBAcmVzZXRTbmlwcGV0VmlldygpXG4gICAgICBpZiBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldFZpZXcgPSBzbmlwcGV0Vmlld1xuICAgICAgICBAc25pcHBldEZvY3VzLmZpcmUoQHNuaXBwZXRWaWV3KVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlRm9jdXNlZDogKGVkaXRhYmxlTm9kZSwgc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSAhPSBlZGl0YWJsZU5vZGVcbiAgICAgIHNuaXBwZXRWaWV3IHx8PSBkb20uZmluZFNuaXBwZXRWaWV3KGVkaXRhYmxlTm9kZSlcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlQmx1cnJlZDogKGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlID09IGVkaXRhYmxlTm9kZVxuICAgICAgQHNldEZvY3VzKEBzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIHNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3ICE9IHNuaXBwZXRWaWV3XG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gIGJsdXI6IC0+XG4gICAgQHNldEZvY3VzKHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0RWRpdGFibGU6IC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRTbmlwcGV0VmlldzogLT5cbiAgICBpZiBAc25pcHBldFZpZXdcbiAgICAgIHByZXZpb3VzID0gQHNuaXBwZXRWaWV3XG4gICAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBzbmlwcGV0Qmx1ci5maXJlKHByZXZpb3VzKVxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmlzU3VwcG9ydGVkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldERyYWdcblxuICB3aWdnbGVTcGFjZSA9IDBcbiAgc3RhcnRBbmRFbmRPZmZzZXQgPSAwXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3IH0pIC0+XG4gICAgQCR2aWV3ID0gc25pcHBldFZpZXcuJGh0bWwgaWYgc25pcHBldFZpZXdcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIHN0YXJ0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuZGlzYWJsZUFsbCgpXG4gICAgQHBhZ2UuYmx1ckZvY3VzZWRFbGVtZW50KClcblxuICAgICMgcGxhY2Vob2xkZXIgYmVsb3cgY3Vyc29yXG4gICAgQCRwbGFjZWhvbGRlciA9IEBjcmVhdGVQbGFjZWhvbGRlcigpLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgQCRkcmFnQmxvY2tlciA9IEBwYWdlLiRib2R5LmZpbmQoJy5kcmFnQmxvY2tlcicpXG5cbiAgICAjIGRyb3AgbWFya2VyXG4gICAgQCRkcm9wTWFya2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcm9wTWFya2VyIH0nPlwiKVxuXG4gICAgQHBhZ2UuJGJvZHlcbiAgICAgIC5hcHBlbmQoQCRkcm9wTWFya2VyKVxuICAgICAgLmFwcGVuZChAJHBsYWNlaG9sZGVyKVxuICAgICAgLmNzcygnY3Vyc29yJywgJ3BvaW50ZXInKVxuXG4gICAgIyBtYXJrIGRyYWdnZWQgc25pcHBldFxuICAgIEAkdmlldy5hZGRDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuXG4gICAgIyBwb3NpdGlvbiB0aGUgcGxhY2Vob2xkZXJcbiAgICBAbW92ZShldmVudFBvc2l0aW9uKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcblxuICBtb3ZlOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAJHBsYWNlaG9sZGVyLmNzc1xuICAgICAgbGVmdDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VYIH1weFwiXG4gICAgICB0b3A6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWSB9cHhcIlxuXG4gICAgQHRhcmdldCA9IEBmaW5kRHJvcFRhcmdldChldmVudFBvc2l0aW9uKVxuICAgICMgQHNjcm9sbEludG9WaWV3KHRvcCwgZXZlbnQpXG5cblxuICBmaW5kRHJvcFRhcmdldDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZ2V0RWxlbVVuZGVyQ3Vyc29yKGV2ZW50UG9zaXRpb24pXG4gICAgcmV0dXJuIHVuZGVmaW5lZCB1bmxlc3MgZWxlbT9cblxuICAgICMgcmV0dXJuIHRoZSBzYW1lIGFzIGxhc3QgdGltZSBpZiB0aGUgY3Vyc29yIGlzIGFib3ZlIHRoZSBkcm9wTWFya2VyXG4gICAgcmV0dXJuIEB0YXJnZXQgaWYgZWxlbSA9PSBAJGRyb3BNYXJrZXJbMF1cblxuICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnRQb3NpdGlvbi5wYWdlWCwgdG9wOiBldmVudFBvc2l0aW9uLnBhZ2VZIH1cbiAgICB0YXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCBjb29yZHMpIGlmIGVsZW0/XG4gICAgQHVuZG9NYWtlU3BhY2UoKVxuXG4gICAgaWYgdGFyZ2V0PyAmJiB0YXJnZXQuc25pcHBldFZpZXc/Lm1vZGVsICE9IEBzbmlwcGV0TW9kZWxcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIEBtYXJrRHJvcFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgIyBpZiB0YXJnZXQuY29udGFpbmVyTmFtZVxuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQucGFyZW50KVxuICAgICAgIyAgICRjb250YWluZXIgPSAkKHRhcmdldC5ub2RlKVxuICAgICAgIyBlbHNlIGlmIHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICAjICAgJGNvbnRhaW5lciA9IHRhcmdldC5zbmlwcGV0Vmlldy5nZXQkY29udGFpbmVyKClcblxuICAgICAgcmV0dXJuIHRhcmdldFxuICAgIGVsc2VcbiAgICAgIEAkZHJvcE1hcmtlci5oaWRlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuXG4gICAgICBpZiBub3QgdGFyZ2V0P1xuICAgICAgICBAJHBsYWNlaG9sZGVyLmFkZENsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBlbHNlXG4gICAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgbWFya0Ryb3BQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnc25pcHBldCdcbiAgICAgICAgQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG4gICAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuXG5cbiAgc25pcHBldFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgYmVmb3JlID0gdGFyZ2V0LnNuaXBwZXRWaWV3LnByZXYoKVxuXG4gICAgICBpZiBiZWZvcmU/XG4gICAgICAgIGlmIGJlZm9yZS5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2FmdGVyJ1xuICAgICAgICAgIHJldHVybiBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5TbmlwcGV0cyhiZWZvcmUsIHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuICAgIGVsc2VcbiAgICAgIG5leHQgPSB0YXJnZXQuc25pcHBldFZpZXcubmV4dCgpXG4gICAgICBpZiBuZXh0P1xuICAgICAgICBpZiBuZXh0Lm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYmVmb3JlJ1xuICAgICAgICAgIHJldHVybiBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5TbmlwcGV0cyh0YXJnZXQuc25pcHBldFZpZXcsIG5leHQpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcblxuXG4gIHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHM6ICh2aWV3QSwgdmlld0IpIC0+XG4gICAgYm94QSA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3QS4kZWxlbVswXSlcbiAgICBib3hCID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdCLiRlbGVtWzBdKVxuXG4gICAgaGFsZkdhcCA9IGlmIGJveEIudG9wID4gYm94QS5ib3R0b21cbiAgICAgIChib3hCLnRvcCAtIGJveEEuYm90dG9tKSAvIDJcbiAgICBlbHNlXG4gICAgICAwXG5cbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94QS5sZWZ0XG4gICAgICB0b3A6IGJveEEuYm90dG9tICsgaGFsZkdhcFxuICAgICAgd2lkdGg6IGJveEEud2lkdGhcblxuXG4gIHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyOiAoZWxlbSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW0/XG5cbiAgICBAbWFrZVNwYWNlKGVsZW0uZmlyc3RDaGlsZCwgJ3RvcCcpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC50b3AgKyBzdGFydEFuZEVuZE9mZnNldFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3guYm90dG9tIC0gc3RhcnRBbmRFbmRPZmZzZXRcbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cbiAgICAgIGVsZW0gPSBAcGFnZS5kb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG4gICAgICBpZiBlbGVtPy5ub2RlTmFtZSA9PSAnSUZSQU1FJ1xuICAgICAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBmaW5kRWxlbUluSWZyYW1lKGVsZW0sIGV2ZW50UG9zaXRpb24pXG4gICAgICBlbHNlXG4gICAgICAgIEBpZnJhbWVCb3ggPSB1bmRlZmluZWRcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICBmaW5kRWxlbUluSWZyYW1lOiAoaWZyYW1lRWxlbSwgZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAaWZyYW1lQm94ID0gYm94ID0gaWZyYW1lRWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIEBpZnJhbWVCb3gud2luZG93ID0gaWZyYW1lRWxlbS5jb250ZW50V2luZG93XG4gICAgZG9jdW1lbnQgPSBpZnJhbWVFbGVtLmNvbnRlbnREb2N1bWVudFxuICAgICRib2R5ID0gJChkb2N1bWVudC5ib2R5KVxuXG4gICAgZXZlbnRQb3NpdGlvbi5jbGllbnRYIC09IGJveC5sZWZ0XG4gICAgZXZlbnRQb3NpdGlvbi5jbGllbnRZIC09IGJveC50b3BcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VYID0gZXZlbnRQb3NpdGlvbi5jbGllbnRYICsgJGJvZHkuc2Nyb2xsTGVmdCgpXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWSA9IGV2ZW50UG9zaXRpb24uY2xpZW50WSArICRib2R5LnNjcm9sbFRvcCgpXG4gICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnRQb3NpdGlvbi5jbGllbnRYLCBldmVudFBvc2l0aW9uLmNsaWVudFkpXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgIyBSZW1vdmUgZWxlbWVudHMgdW5kZXIgdGhlIGN1cnNvciB3aGljaCBjb3VsZCBpbnRlcmZlcmVcbiAgIyB3aXRoIGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoKVxuICB1bmJsb2NrRWxlbWVudEZyb21Qb2ludDogKGNhbGxiYWNrKSAtPlxuXG4gICAgIyBQb2ludGVyIEV2ZW50cyBhcmUgYSBsb3QgZmFzdGVyIHNpbmNlIHRoZSBicm93c2VyIGRvZXMgbm90IG5lZWRcbiAgICAjIHRvIHJlcGFpbnQgdGhlIHdob2xlIHNjcmVlbi4gSUUgOSBhbmQgMTAgZG8gbm90IHN1cHBvcnQgdGhlbS5cbiAgICBpZiBpc1N1cHBvcnRlZCgnaHRtbFBvaW50ZXJFdmVudHMnKVxuICAgICAgQCRkcmFnQmxvY2tlci5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQCRkcmFnQmxvY2tlci5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ2F1dG8nKVxuICAgIGVsc2VcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuaGlkZSgpXG4gICAgICBAJHBsYWNlaG9sZGVyLmhpZGUoKVxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQCRkcmFnQmxvY2tlci5zaG93KClcbiAgICAgIEAkcGxhY2Vob2xkZXIuc2hvdygpXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBkcm9wOiAtPlxuICAgIGlmIEB0YXJnZXQ/XG4gICAgICBAbW92ZVRvVGFyZ2V0KEB0YXJnZXQpXG4gICAgICBAcGFnZS5zbmlwcGV0V2FzRHJvcHBlZC5maXJlKEBzbmlwcGV0TW9kZWwpXG4gICAgZWxzZVxuICAgICAgI2NvbnNpZGVyOiBtYXliZSBhZGQgYSAnZHJvcCBmYWlsZWQnIGVmZmVjdFxuXG5cbiAgIyBNb3ZlIHRoZSBzbmlwcGV0IGFmdGVyIGEgc3VjY2Vzc2Z1bCBkcm9wXG4gIG1vdmVUb1RhcmdldDogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnc25pcHBldCdcbiAgICAgICAgc25pcHBldFZpZXcgPSB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYmVmb3JlKEBzbmlwcGV0TW9kZWwpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5hZnRlcihAc25pcHBldE1vZGVsKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBzbmlwcGV0TW9kZWwgPSB0YXJnZXQuc25pcHBldFZpZXcubW9kZWxcbiAgICAgICAgc25pcHBldE1vZGVsLmFwcGVuZCh0YXJnZXQuY29udGFpbmVyTmFtZSwgQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIHNuaXBwZXRUcmVlID0gdGFyZ2V0LnNuaXBwZXRUcmVlXG4gICAgICAgIHNuaXBwZXRUcmVlLnByZXBlbmQoQHNuaXBwZXRNb2RlbClcblxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgIyBSZXNldCBpcyBhbHdheXMgY2FsbGVkIGFmdGVyIGEgZHJhZyBlbmRlZC5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcblxuICAgICAgIyB1bmRvIERPTSBjaGFuZ2VzXG4gICAgICBAdW5kb01ha2VTcGFjZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIEBwYWdlLiRib2R5LmNzcygnY3Vyc29yJywgJycpXG4gICAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIucmVlbmFibGVBbGwoKVxuICAgICAgQCR2aWV3LnJlbW92ZUNsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG4gICAgICBkb20ucmVzdG9yZUNvbnRhaW5lckhlaWdodCgpXG5cbiAgICAgICMgcmVtb3ZlIGVsZW1lbnRzXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZSgpXG4gICAgICBAJGRyb3BNYXJrZXIucmVtb3ZlKClcblxuXG4gIGNyZWF0ZVBsYWNlaG9sZGVyOiAtPlxuICAgIG51bWJlck9mRHJhZ2dlZEVsZW1zID0gMVxuICAgIHRlbXBsYXRlID0gXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiI3sgY3NzLmRyYWdnZWRQbGFjZWhvbGRlciB9XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiI3sgY3NzLmRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXIgfVwiPlxuICAgICAgICAgICN7IG51bWJlck9mRHJhZ2dlZEVsZW1zIH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICBTZWxlY3RlZCBJdGVtXG4gICAgICA8L2Rpdj5cbiAgICAgIFwiXCJcIlxuXG4gICAgJHBsYWNlaG9sZGVyID0gJCh0ZW1wbGF0ZSlcbiAgICAgIC5jc3MocG9zaXRpb246IFwiYWJzb2x1dGVcIilcbiIsIiMgQ2FuIHJlcGxhY2UgeG1sZG9tIGluIHRoZSBicm93c2VyLlxuIyBNb3JlIGFib3V0IHhtbGRvbTogaHR0cHM6Ly9naXRodWIuY29tL2ppbmR3L3htbGRvbVxuI1xuIyBPbiBub2RlIHhtbGRvbSBpcyByZXF1aXJlZC4gSW4gdGhlIGJyb3dzZXJcbiMgRE9NUGFyc2VyIGFuZCBYTUxTZXJpYWxpemVyIGFyZSBhbHJlYWR5IG5hdGl2ZSBvYmplY3RzLlxuXG4jIERPTVBhcnNlclxuZXhwb3J0cy5ET01QYXJzZXIgPSBjbGFzcyBET01QYXJzZXJTaGltXG5cbiAgcGFyc2VGcm9tU3RyaW5nOiAoeG1sVGVtcGxhdGUpIC0+XG4gICAgIyBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHhtbFRlbXBsYXRlKSBkb2VzIG5vdCB3b3JrIHRoZSBzYW1lXG4gICAgIyBpbiB0aGUgYnJvd3NlciBhcyB3aXRoIHhtbGRvbS4gU28gd2UgdXNlIGpRdWVyeSB0byBtYWtlIHRoaW5ncyB3b3JrLlxuICAgICQucGFyc2VYTUwoeG1sVGVtcGxhdGUpXG5cblxuIyBYTUxTZXJpYWxpemVyXG5leHBvcnRzLlhNTFNlcmlhbGl6ZXIgPSBYTUxTZXJpYWxpemVyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSAkLkNhbGxiYWNrcyBvYmplY3QgdGhhdCB3aWxsXG4gICMgcmVtb3ZlIGl0c2VsZiBmcm9tIGl0cyAkLkNhbGxiYWNrcyBhZnRlciB0aGUgZmlyc3QgY2FsbC5cbiAgY2FsbE9uY2U6IChjYWxsYmFja3MsIGxpc3RlbmVyKSAtPlxuICAgIHNlbGZSZW1vdmluZ0Z1bmMgPSAoYXJncy4uLikgLT5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmUoc2VsZlJlbW92aW5nRnVuYylcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjYWxsYmFja3MuYWRkKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgc2VsZlJlbW92aW5nRnVuY1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGh0bWxQb2ludGVyRXZlbnRzOiAtPlxuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4JylcbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSAncG9pbnRlci1ldmVudHM6YXV0bydcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID09ICdhdXRvJ1xuIiwiZGV0ZWN0cyA9IHJlcXVpcmUoJy4vZmVhdHVyZV9kZXRlY3RzJylcblxuZXhlY3V0ZWRUZXN0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG5hbWUpIC0+XG4gIGlmIChyZXN1bHQgPSBleGVjdXRlZFRlc3RzW25hbWVdKSA9PSB1bmRlZmluZWRcbiAgICBleGVjdXRlZFRlc3RzW25hbWVdID0gQm9vbGVhbihkZXRlY3RzW25hbWVdKCkpXG4gIGVsc2VcbiAgICByZXN1bHRcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlkQ291bnRlciA9IGxhc3RJZCA9IHVuZGVmaW5lZFxuXG4gICMgR2VuZXJhdGUgYSB1bmlxdWUgaWQuXG4gICMgR3VhcmFudGVlcyBhIHVuaXF1ZSBpZCBpbiB0aGlzIHJ1bnRpbWUuXG4gICMgQWNyb3NzIHJ1bnRpbWVzIGl0cyBsaWtlbHkgYnV0IG5vdCBndWFyYW50ZWVkIHRvIGJlIHVuaXF1ZVxuICAjIFVzZSB0aGUgdXNlciBwcmVmaXggdG8gYWxtb3N0IGd1YXJhbnRlZSB1bmlxdWVuZXNzLFxuICAjIGFzc3VtaW5nIHRoZSBzYW1lIHVzZXIgY2Fubm90IGdlbmVyYXRlIHNuaXBwZXRzIGluXG4gICMgbXVsdGlwbGUgcnVudGltZXMgYXQgdGhlIHNhbWUgdGltZSAoYW5kIHRoYXQgY2xvY2tzIGFyZSBpbiBzeW5jKVxuICBuZXh0OiAodXNlciA9ICdkb2MnKSAtPlxuXG4gICAgIyBnZW5lcmF0ZSA5LWRpZ2l0IHRpbWVzdGFtcFxuICAgIG5leHRJZCA9IERhdGUubm93KCkudG9TdHJpbmcoMzIpXG5cbiAgICAjIGFkZCBjb3VudGVyIGlmIG11bHRpcGxlIHRyZWVzIG5lZWQgaWRzIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kXG4gICAgaWYgbGFzdElkID09IG5leHRJZFxuICAgICAgaWRDb3VudGVyICs9IDFcbiAgICBlbHNlXG4gICAgICBpZENvdW50ZXIgPSAwXG4gICAgICBsYXN0SWQgPSBuZXh0SWRcblxuICAgIFwiI3sgdXNlciB9LSN7IG5leHRJZCB9I3sgaWRDb3VudGVyIH1cIlxuIiwibG9nID0gcmVxdWlyZSgnLi9sb2cnKVxuXG4jIEZ1bmN0aW9uIHRvIGFzc2VydCBhIGNvbmRpdGlvbi4gSWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LCBhbiBlcnJvciBpc1xuIyByYWlzZWQgd2l0aCB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgYXNzZXJ0IGEgaXNudCBiLCAnYSBjYW4gbm90IGJlIGInXG4jXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2VydCA9IChjb25kaXRpb24sIG1lc3NhZ2UpIC0+XG4gIGxvZy5lcnJvcihtZXNzYWdlKSB1bmxlc3MgY29uZGl0aW9uXG4iLCJcbiMgTG9nIEhlbHBlclxuIyAtLS0tLS0tLS0tXG4jIERlZmF1bHQgbG9nZ2luZyBoZWxwZXJcbiMgQHBhcmFtczogcGFzcyBgXCJ0cmFjZVwiYCBhcyBsYXN0IHBhcmFtZXRlciB0byBvdXRwdXQgdGhlIGNhbGwgc3RhY2tcbm1vZHVsZS5leHBvcnRzID0gbG9nID0gKGFyZ3MuLi4pIC0+XG4gIGlmIHdpbmRvdy5jb25zb2xlP1xuICAgIGlmIGFyZ3MubGVuZ3RoIGFuZCBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ3RyYWNlJ1xuICAgICAgYXJncy5wb3AoKVxuICAgICAgd2luZG93LmNvbnNvbGUudHJhY2UoKSBpZiB3aW5kb3cuY29uc29sZS50cmFjZT9cblxuICAgIHdpbmRvdy5jb25zb2xlLmxvZy5hcHBseSh3aW5kb3cuY29uc29sZSwgYXJncylcbiAgICB1bmRlZmluZWRcblxuXG5kbyAtPlxuXG4gICMgQ3VzdG9tIGVycm9yIHR5cGUgZm9yIGxpdmluZ2RvY3MuXG4gICMgV2UgY2FuIHVzZSB0aGlzIHRvIHRyYWNrIHRoZSBvcmlnaW4gb2YgYW4gZXhwZWN0aW9uIGluIHVuaXQgdGVzdHMuXG4gIGNsYXNzIExpdmluZ2RvY3NFcnJvciBleHRlbmRzIEVycm9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKG1lc3NhZ2UpIC0+XG4gICAgICBzdXBlclxuICAgICAgQG1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICBAdGhyb3duQnlMaXZpbmdkb2NzID0gdHJ1ZVxuXG5cbiAgIyBAcGFyYW0gbGV2ZWw6IG9uZSBvZiB0aGVzZSBzdHJpbmdzOlxuICAjICdjcml0aWNhbCcsICdlcnJvcicsICd3YXJuaW5nJywgJ2luZm8nLCAnZGVidWcnXG4gIG5vdGlmeSA9IChtZXNzYWdlLCBsZXZlbCA9ICdlcnJvcicpIC0+XG4gICAgaWYgX3JvbGxiYXI/XG4gICAgICBfcm9sbGJhci5wdXNoIG5ldyBFcnJvcihtZXNzYWdlKSwgLT5cbiAgICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJykgYW5kIHdpbmRvdy5jb25zb2xlPy5lcnJvcj9cbiAgICAgICAgICB3aW5kb3cuY29uc29sZS5lcnJvci5jYWxsKHdpbmRvdy5jb25zb2xlLCBtZXNzYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuICAgIGVsc2VcbiAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpXG4gICAgICAgIHRocm93IG5ldyBMaXZpbmdkb2NzRXJyb3IobWVzc2FnZSlcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuXG4gICAgdW5kZWZpbmVkXG5cblxuICBsb2cuZGVidWcgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2RlYnVnJykgdW5sZXNzIGxvZy5kZWJ1Z0Rpc2FibGVkXG5cblxuICBsb2cud2FybiA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnd2FybmluZycpIHVubGVzcyBsb2cud2FybmluZ3NEaXNhYmxlZFxuXG5cbiAgIyBMb2cgZXJyb3IgYW5kIHRocm93IGV4Y2VwdGlvblxuICBsb2cuZXJyb3IgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2Vycm9yJylcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgVGhpcyBjbGFzcyBjYW4gYmUgdXNlZCB0byB3YWl0IGZvciB0YXNrcyB0byBmaW5pc2ggYmVmb3JlIGZpcmluZyBhIHNlcmllcyBvZlxuIyBjYWxsYmFja3MuIE9uY2Ugc3RhcnQoKSBpcyBjYWxsZWQsIHRoZSBjYWxsYmFja3MgZmlyZSBhcyBzb29uIGFzIHRoZSBjb3VudFxuIyByZWFjaGVzIDAuIFRodXMsIHlvdSBzaG91bGQgaW5jcmVtZW50IHRoZSBjb3VudCBiZWZvcmUgc3RhcnRpbmcgaXQuIFdoZW5cbiMgYWRkaW5nIGEgY2FsbGJhY2sgYWZ0ZXIgaGF2aW5nIGZpcmVkIGNhdXNlcyB0aGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHJpZ2h0XG4jIGF3YXkuIEluY3JlbWVudGluZyB0aGUgY291bnQgYWZ0ZXIgaXQgZmlyZWQgcmVzdWx0cyBpbiBhbiBlcnJvci5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiNcbiMgICBzZW1hcGhvcmUuaW5jcmVtZW50KClcbiMgICBkb1NvbWV0aGluZygpLnRoZW4oc2VtYXBob3JlLmRlY3JlbWVudCgpKVxuI1xuIyAgIGRvQW5vdGhlclRoaW5nVGhhdFRha2VzQUNhbGxiYWNrKHNlbWFwaG9yZS53YWl0KCkpXG4jXG4jICAgc2VtYXBob3JlLnN0YXJ0KClcbiNcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ2hlbGxvJykpXG4jXG4jICAgIyBPbmNlIGNvdW50IHJlYWNoZXMgMCBjYWxsYmFjayBpcyBleGVjdXRlZDpcbiMgICAjID0+ICdoZWxsbydcbiNcbiMgICAjIEFzc3VtaW5nIHRoYXQgc2VtYXBob3JlIHdhcyBhbHJlYWR5IGZpcmVkOlxuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5JykpXG4jICAgIyA9PiAndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5J1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZW1hcGhvcmVcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY291bnQgPSAwXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgIEB3YXNGaXJlZCA9IGZhbHNlXG4gICAgQGNhbGxiYWNrcyA9IFtdXG5cblxuICBhZGRDYWxsYmFjazogKGNhbGxiYWNrKSAtPlxuICAgIGlmIEB3YXNGaXJlZFxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHdhc0ZpcmVkXG5cblxuICBzdGFydDogLT5cbiAgICBhc3NlcnQgbm90IEBzdGFydGVkLFxuICAgICAgXCJVbmFibGUgdG8gc3RhcnQgU2VtYXBob3JlIG9uY2Ugc3RhcnRlZC5cIlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICBpbmNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAd2FzRmlyZWQsXG4gICAgICBcIlVuYWJsZSB0byBpbmNyZW1lbnQgY291bnQgb25jZSBTZW1hcGhvcmUgaXMgZmlyZWQuXCJcbiAgICBAY291bnQgKz0gMVxuXG5cbiAgZGVjcmVtZW50OiAtPlxuICAgIGFzc2VydCBAY291bnQgPiAwLFxuICAgICAgXCJVbmFibGUgdG8gZGVjcmVtZW50IGNvdW50IHJlc3VsdGluZyBpbiBuZWdhdGl2ZSBjb3VudC5cIlxuICAgIEBjb3VudCAtPSAxXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIHdhaXQ6IC0+XG4gICAgQGluY3JlbWVudCgpXG4gICAgPT4gQGRlY3JlbWVudCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGZpcmVJZlJlYWR5OiAtPlxuICAgIGlmIEBjb3VudCA9PSAwICYmIEBzdGFydGVkID09IHRydWVcbiAgICAgIEB3YXNGaXJlZCA9IHRydWVcbiAgICAgIGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpc0VtcHR5OiAob2JqKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBvYmo/XG4gICAgZm9yIG5hbWUgb2Ygb2JqXG4gICAgICByZXR1cm4gZmFsc2UgaWYgb2JqLmhhc093blByb3BlcnR5KG5hbWUpXG5cbiAgICB0cnVlXG5cblxuICBmbGF0Q29weTogKG9iaikgLT5cbiAgICBjb3B5ID0gdW5kZWZpbmVkXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb3B5IHx8PSB7fVxuICAgICAgY29weVtuYW1lXSA9IHZhbHVlXG5cbiAgICBjb3B5XG4iLCIjIFN0cmluZyBIZWxwZXJzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIGluc3BpcmVkIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vZXBlbGkvdW5kZXJzY29yZS5zdHJpbmddKClcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnQ2FtZWwgQ2FzZSdcbiAgaHVtYW5pemU6IChzdHIpIC0+XG4gICAgdW5jYW1lbGl6ZWQgPSAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVpdKykvZywgJyQxICQyJykudG9Mb3dlckNhc2UoKVxuICAgIEB0aXRsZWl6ZSggdW5jYW1lbGl6ZWQgKVxuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgdG8gdXBwZXJjYXNlXG4gIGNhcGl0YWxpemUgOiAoc3RyKSAtPlxuICAgICAgc3RyID0gaWYgIXN0cj8gdGhlbiAnJyBlbHNlIFN0cmluZyhzdHIpXG4gICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgb2YgZXZlcnkgd29yZCB0byB1cHBlcmNhc2VcbiAgdGl0bGVpemU6IChzdHIpIC0+XG4gICAgaWYgIXN0cj9cbiAgICAgICcnXG4gICAgZWxzZVxuICAgICAgU3RyaW5nKHN0cikucmVwbGFjZSAvKD86XnxcXHMpXFxTL2csIChjKSAtPlxuICAgICAgICBjLnRvVXBwZXJDYXNlKClcblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnY2FtZWwtY2FzZSdcbiAgc25ha2VDYXNlOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpLnJlcGxhY2UoL1stX1xcc10rL2csICctJykudG9Mb3dlckNhc2UoKVxuXG5cbiAgIyBwcmVwZW5kIGEgcHJlZml4IHRvIGEgc3RyaW5nIGlmIGl0IGlzIG5vdCBhbHJlYWR5IHByZXNlbnRcbiAgcHJlZml4OiAocHJlZml4LCBzdHJpbmcpIC0+XG4gICAgaWYgc3RyaW5nLmluZGV4T2YocHJlZml4KSA9PSAwXG4gICAgICBzdHJpbmdcbiAgICBlbHNlXG4gICAgICBcIlwiICsgcHJlZml4ICsgc3RyaW5nXG5cblxuICAjIEpTT04uc3RyaW5naWZ5IHdpdGggcmVhZGFiaWxpdHkgaW4gbWluZFxuICAjIEBwYXJhbSBvYmplY3Q6IGphdmFzY3JpcHQgb2JqZWN0XG4gIHJlYWRhYmxlSnNvbjogKG9iaikgLT5cbiAgICBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIDIpICMgXCJcXHRcIlxuXG4gIGNhbWVsaXplOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICAgICBjLnRvVXBwZXJDYXNlKClcbiAgICApXG5cbiAgdHJpbTogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG5cblxuICAjIGNhbWVsaXplOiAoc3RyKSAtPlxuICAjICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgIyAgICAgYy50b1VwcGVyQ2FzZSgpXG5cbiAgIyBjbGFzc2lmeTogKHN0cikgLT5cbiAgIyAgICQudGl0bGVpemUoU3RyaW5nKHN0cikucmVwbGFjZSgvW1xcV19dL2csICcgJykpLnJlcGxhY2UoL1xccy9nLCAnJylcblxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVmYXVsdEltYWdlTWFuYWdlclxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgICMgZW1wdHlcblxuXG4gIHNldDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMFxuXG5cbiAgaXNJbWdUYWc6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG4iLCJEZWZhdWx0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX21hbmFnZXInKVxuUmVzcmNpdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlZmF1bHRJbWFnZU1hbmFnZXIgPSBuZXcgRGVmYXVsdEltYWdlTWFuYWdlcigpXG4gIHJlc3JjaXRJbWFnZU1hbmFnZXIgPSBuZXcgUmVzcmNpdEltYWdlTWFuYWdlcigpXG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUsIGltYWdlU2VydmljZSkgLT5cbiAgICBpbWFnZU1hbmFnZXIgPSBAX2dldEltYWdlTWFuYWdlcihpbWFnZVNlcnZpY2UpXG4gICAgaW1hZ2VNYW5hZ2VyLnNldCgkZWxlbSwgdmFsdWUpXG5cblxuICBfZ2V0SW1hZ2VNYW5hZ2VyOiAoaW1hZ2VTZXJ2aWNlKSAtPlxuICAgIHN3aXRjaCBpbWFnZVNlcnZpY2VcbiAgICAgIHdoZW4gJ3Jlc3JjLml0JyB0aGVuIHJlc3JjaXRJbWFnZU1hbmFnZXJcbiAgICAgIGVsc2VcbiAgICAgICAgZGVmYXVsdEltYWdlTWFuYWdlclxuXG5cbiAgZ2V0RGVmYXVsdEltYWdlTWFuYWdlcjogLT5cbiAgICBkZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cblxuICBnZXRSZXNyY2l0SW1hZ2VNYW5hZ2VyOiAtPlxuICAgIHJlc3JjaXRJbWFnZU1hbmFnZXJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldFRyZWUsIEByZW5kZXJpbmdDb250YWluZXIsICR3cmFwcGVyIH0pIC0+XG4gICAgYXNzZXJ0IEBzbmlwcGV0VHJlZSwgJ25vIHNuaXBwZXQgdHJlZSBzcGVjaWZpZWQnXG4gICAgYXNzZXJ0IEByZW5kZXJpbmdDb250YWluZXIsICdubyByZW5kZXJpbmcgY29udGFpbmVyIHNwZWNpZmllZCdcblxuICAgIEAkcm9vdCA9ICQoQHJlbmRlcmluZ0NvbnRhaW5lci5yZW5kZXJOb2RlKVxuICAgIEAkd3JhcHBlckh0bWwgPSAkd3JhcHBlclxuICAgIEBzbmlwcGV0Vmlld3MgPSB7fVxuXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBzZXRSb290OiAoKSAtPlxuICAgIGlmIEAkd3JhcHBlckh0bWw/Lmxlbmd0aCAmJiBAJHdyYXBwZXJIdG1sLmpxdWVyeVxuICAgICAgc2VsZWN0b3IgPSBcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiXG4gICAgICAkaW5zZXJ0ID0gQCR3cmFwcGVySHRtbC5maW5kKHNlbGVjdG9yKS5hZGQoIEAkd3JhcHBlckh0bWwuZmlsdGVyKHNlbGVjdG9yKSApXG4gICAgICByZXR1cm4gdW5sZXNzICRpbnNlcnQubGVuZ3RoXG5cbiAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgQCR3cmFwcGVyLmFwcGVuZChAJHdyYXBwZXJIdG1sKVxuICAgICAgQCRyb290ID0gJGluc2VydFxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBTbmlwcGV0IFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0QWRkZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0QWRkZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldFJlbW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0TW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0TW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgc25pcHBldEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgc25pcHBldEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgc25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0U25pcHBldDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwpXG5cbiAgICBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignU25pcHBldCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIHNuaXBwZXRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcbiAgICBzbmlwcGV0Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5zbmlwcGV0Vmlld1dhc0luc2VydGVkKHNuaXBwZXRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZFNuaXBwZXRzKG1vZGVsKVxuXG5cbiAgaXNTbmlwcGV0QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkU25pcHBldHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNTbmlwcGV0QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydFNuaXBwZXQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydFNuaXBwZXRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yU25pcHBldChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvclNuaXBwZXQobW9kZWwpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQoY29udGFpbmVyLnBhcmVudFNuaXBwZXQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJEZWZhdWx0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX21hbmFnZXInKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzY3JpdEltYWdlTWFuYWdlciBleHRlbmRzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBAcmVzcmNpdFVybDogJ2h0dHA6Ly90cmlhbC5yZXNyYy5pdC8nXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIEBzZXRCYXNlNjQoJGVsZW0sIHZhbHVlKSBpZiBAaXNCYXNlNjQodmFsdWUpXG5cbiAgICBhc3NlcnQgdmFsdWU/ICYmIHZhbHVlICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgQHJlc2V0U3JjQXR0cmlidXRlKCRlbGVtKSBpZiAkZWxlbS5hdHRyKCdzcmMnKSAmJiBAaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgICAkZWxlbS5hdHRyKCdkYXRhLXNyYycsIFwiI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3t2YWx1ZX1cIilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgje1Jlc2NyaXRJbWFnZU1hbmFnZXIucmVzcmNpdFVybH0jeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBTZXQgc3JjIGRpcmVjdGx5LCBkb24ndCBhZGQgcmVzcmMgY2xhc3NcbiAgc2V0QmFzZTY0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICByZXNldFNyY0F0dHJpYnV0ZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcbmF0dHIgPSBjb25maWcuYXR0clxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3InKVxuZXZlbnRpbmcgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2V2ZW50aW5nJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5JbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL2ltYWdlX21hbmFnZXInKVxuXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50LCBAbW9kZWwudGVtcG9yYXJ5Q29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQsIHNlc3Npb25Db250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBpZiBzZXNzaW9uQ29udGVudFtuYW1lXT9cbiAgICAgICAgQHNldChuYW1lLCBzZXNzaW9uQ29udGVudFtuYW1lXSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIHZhbHVlXG4gICAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylbbmFtZV0gaWYgQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpXG4gICAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAc25pcHBldFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgaG9zdFdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3dcbiAgICAgIGRlc2lnbjogQHNuaXBwZXRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG4gICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSB9PXt9KSAtPlxuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdjbGljay5saXZpbmdkb2NzJywgJC5wcm94eShAY2xpY2ssIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlP1xuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0Vmlld1xuXG4gICAgQHN0YXJ0RHJhZ1xuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjbGljazogKGV2ZW50KSAtPlxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcblxuICAgICMgdG9kbzogaWYgYSB1c2VyIGNsaWNrZWQgb24gYSBtYXJnaW4gb2YgYSBzbmlwcGV0IGl0IHNob3VsZFxuICAgICMgc3RpbGwgZ2V0IHNlbGVjdGVkLiAoaWYgYSBzbmlwcGV0IGlzIGZvdW5kIGJ5IHBhcmVudFNuaXBwZXRcbiAgICAjIGFuZCB0aGF0IHNuaXBwZXQgaGFzIG5vIGNoaWxkcmVuIHdlIGRvIG5vdCBuZWVkIHRvIHNlYXJjaClcblxuICAgICMgaWYgc25pcHBldCBoYXNDaGlsZHJlbiwgbWFrZSBzdXJlIHdlIGRpZG4ndCB3YW50IHRvIHNlbGVjdFxuICAgICMgYSBjaGlsZFxuXG4gICAgIyBpZiBubyBzbmlwcGV0IHdhcyBzZWxlY3RlZCBjaGVjayBpZiB0aGUgdXNlciB3YXMgbm90IGNsaWNraW5nXG4gICAgIyBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXRcblxuICAgICMgdG9kbzogY2hlY2sgaWYgdGhlIGNsaWNrIHdhcyBtZWFudCBmb3IgYSBzbmlwcGV0IGNvbnRhaW5lclxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAZm9jdXMuc25pcHBldEZvY3VzZWQoc25pcHBldFZpZXcpXG5cbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgIyBzdG9yZSByZWZlcmVuY2UgdG8gc25pcHBldFRyZWVcbiAgICAkKEByZW5kZXJOb2RlKS5kYXRhKCdzbmlwcGV0VHJlZScsIEBzbmlwcGV0VHJlZSlcbiAgICBAY3NzTG9hZGVyID0gbmV3IENzc0xvYWRlcihAd2luZG93KVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgc2V0UmVuZGVyTm9kZTogKHJlbmRlck5vZGUpIC0+XG4gICAgcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcbiAgICBpZiByZW5kZXJOb2RlLmpxdWVyeVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlWzBdXG4gICAgZWxzZVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlXG5cblxuICBiZWZvcmVSZWFkeTogLT5cbiAgICAjIGFsd2F5cyBpbml0aWFsaXplIGEgcGFnZSBhc3luY2hyb25vdXNseVxuICAgIEByZWFkeVNlbWFwaG9yZS53YWl0KClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcbiAgICAsIDBcblxuXG4gIGJlZm9yZVBhZ2VSZWFkeTogPT5cbiAgICBpZiBAZGVzaWduPyAmJiBjb25maWcubG9hZFJlc291cmNlc1xuICAgICAgZGVzaWduUGF0aCA9IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWVzcGFjZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3cgfHwgd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIFNuaXBwZXRWaWV3cyBpbnRvIHRoZSBSZW5kZXJpbmdDb250YWluZXIgYW5kIG5vdGlmaWVzIGl0XG4jIG9mIHRoZSBpbnNlcnRpb24uXG4jXG4jIFRoZSBSZW5kZXJpbmdDb250YWluZXIgaXMgaW50ZW5kZWQgZm9yIGdlbmVyYXRpbmcgSFRNTC4gUGFnZSBpcyBhIHN1YmNsYXNzIG9mXG4jIHRoaXMgYmFzZSBjbGFzcyB0aGF0IGlzIGludGVuZGVkIGZvciBkaXNwbGF5aW5nIHRvIHRoZSB1c2VyLiBJbnRlcmFjdGl2ZVBhZ2VcbiMgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFkZHMgaW50ZXJhY3Rpdml0eSwgYW5kIHRodXMgZWRpdGFiaWxpdHksIHRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBpc1JlYWRPbmx5OiB0cnVlXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVuZGVyTm9kZSA9ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiIyBqUXVlcnkgbGlrZSByZXN1bHRzIHdoZW4gc2VhcmNoaW5nIGZvciBzbmlwcGV0cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgU25pcHBldEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRBcnJheSB2aWEgYGRvYy5mbmAuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRBcnJheVxuXG5cbiAgIyBAcGFyYW0gc25pcHBldHM6IGFycmF5IG9mIHNuaXBwZXRzXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRzKSAtPlxuICAgIEBzbmlwcGV0cyA9IFtdIHVubGVzcyBAc25pcHBldHM/XG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBzbmlwcGV0c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAc25pcHBldHMubGVuZ3RoXG4gICAgaWYgQHNuaXBwZXRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0BzbmlwcGV0cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBzbmlwcGV0IGluIEBzbmlwcGV0c1xuICAgICAgY2FsbGJhY2soc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFNuaXBwZXRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIFNuaXBwZXRDb250YWluZXIgY29udGFpbnMgYW5kIG1hbmFnZXMgYSBsaW5rZWQgbGlzdFxuIyBvZiBzbmlwcGV0cy5cbiNcbiMgVGhlIHNuaXBwZXRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIHNuaXBwZXRUcmVlXG4jIGluZm9ybWVkIGFib3V0IGNoYW5nZXMgKG9ubHkgaWYgdGhleSBhcmUgYXR0YWNoZWQgdG8gb25lKS5cbiNcbiMgQHByb3AgZmlyc3Q6IGZpcnN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRTbmlwcGV0OiBwYXJlbnQgU25pcHBldE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50U25pcHBldCwgQG5hbWUsIGlzUm9vdCB9KSAtPlxuICAgIEBpc1Jvb3QgPSBpc1Jvb3Q/XG4gICAgQGZpcnN0ID0gQGxhc3QgPSB1bmRlZmluZWRcblxuXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQHBhcmVudFNuaXBwZXRcbiAgICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgQHBhcmVudFNuaXBwZXQsICdjYW5ub3QgYXBwZW5kIHNuaXBwZXQgdG8gaXRzZWxmJ1xuXG4gICAgaWYgQGxhc3RcbiAgICAgIEBpbnNlcnRBZnRlcihAbGFzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgaW5zZXJ0QmVmb3JlOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0LnByZXZpb3VzID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldC5wcmV2aW91c1xuICAgICAgbmV4dDogc25pcHBldFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIGluc2VydEFmdGVyOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0Lm5leHQgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXRcbiAgICAgIG5leHQ6IHNuaXBwZXQubmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIHVwOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShzbmlwcGV0LnByZXZpb3VzLCBzbmlwcGV0KVxuXG5cbiAgZG93bjogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5uZXh0P1xuICAgICAgQGluc2VydEFmdGVyKHNuaXBwZXQubmV4dCwgc25pcHBldClcblxuXG4gIGdldFNuaXBwZXRUcmVlOiAtPlxuICAgIEBzbmlwcGV0VHJlZSB8fCBAcGFyZW50U25pcHBldD8uc25pcHBldFRyZWVcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0ID0gQGZpcnN0XG4gICAgd2hpbGUgKHNuaXBwZXQpXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgY2FsbGJhY2soc25pcHBldClcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0LmRlc3Ryb3koKVxuICAgIEBfZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG4jIFNuaXBwZXRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBTbmlwcGV0TW9kZWwgaGFzIGEgdGVtcGxhdGUgd2hpY2ggYWxsb3dzIHRvIGdlbmVyYXRlIGEgc25pcHBldFZpZXdcbiMgZnJvbSBhIHNuaXBwZXRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIFNuaXBwZXRUcmVlLlxuIyBFdmVyeSBTbmlwcGV0TW9kZWwgY2FuIGhhdmUgYSBwYXJlbnQgKFNuaXBwZXRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgc25pcHBldHMpIGFuZCBtdWx0aXBsZSBjb250YWluZXJzIChTbmlwcGV0Q29udGFpbmVycykuXG4jXG4jIFRoZSBjb250YWluZXJzIGFyZSB0aGUgcGFyZW50cyBvZiB0aGUgY2hpbGQgU25pcHBldE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgU25pcHBldENvbnRhaW5lclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0TW9kZWxcblxuICBjb25zdHJ1Y3RvcjogKHsgQHRlbXBsYXRlLCBpZCB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEB0ZW1wbGF0ZSwgJ2Nhbm5vdCBpbnN0YW50aWF0ZSBzbmlwcGV0IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAZGF0YVZhbHVlcyA9IHt9XG4gICAgQHRlbXBvcmFyeUNvbnRlbnQgPSB7fVxuICAgIEBpZCA9IGlkIHx8IGd1aWQubmV4dCgpXG4gICAgQGlkZW50aWZpZXIgPSBAdGVtcGxhdGUuaWRlbnRpZmllclxuXG4gICAgQG5leHQgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBwcmV2aW91cyA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0Q29udGFpbmVyXG4gICAgQHNuaXBwZXRUcmVlID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRUcmVlXG5cblxuICBpbml0aWFsaXplRGlyZWN0aXZlczogLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBTbmlwcGV0Q29udGFpbmVyXG4gICAgICAgICAgICBuYW1lOiBkaXJlY3RpdmUubmFtZVxuICAgICAgICAgICAgcGFyZW50U25pcHBldDogdGhpc1xuICAgICAgICB3aGVuICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgICAgICAgIEBjb250ZW50IHx8PSB7fVxuICAgICAgICAgIEBjb250ZW50W2RpcmVjdGl2ZS5uYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGUgZGlyZWN0aXZlIHR5cGUgJyN7IGRpcmVjdGl2ZS50eXBlIH0nIG5vdCBpbXBsZW1lbnRlZCBpbiBTbmlwcGV0TW9kZWxcIlxuXG5cbiAgY3JlYXRlVmlldzogKGlzUmVhZE9ubHkpIC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZVZpZXcodGhpcywgaXNSZWFkT25seSlcblxuXG4gIGhhc0NvbnRhaW5lcnM6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2NvbnRhaW5lcicpID4gMFxuXG5cbiAgaGFzRWRpdGFibGVzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdlZGl0YWJsZScpID4gMFxuXG5cbiAgaGFzSHRtbDogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaHRtbCcpID4gMFxuXG5cbiAgaGFzSW1hZ2VzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdpbWFnZScpID4gMFxuXG5cbiAgYmVmb3JlOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRCZWZvcmUodGhpcywgc25pcHBldE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgYWZ0ZXI6IChzbmlwcGV0TW9kZWwpIC0+XG4gICAgaWYgc25pcHBldE1vZGVsXG4gICAgICBAcGFyZW50Q29udGFpbmVyLmluc2VydEFmdGVyKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgc25pcHBldE1vZGVsID0gY29udGFpbmVyTmFtZVxuICAgICAgY29udGFpbmVyTmFtZSA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5kZWZhdWx0TmFtZVxuXG4gICAgQGNvbnRhaW5lcnNbY29udGFpbmVyTmFtZV0uYXBwZW5kKHNuaXBwZXRNb2RlbClcbiAgICB0aGlzXG5cblxuICBwcmVwZW5kOiAoY29udGFpbmVyTmFtZSwgc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgc25pcHBldE1vZGVsID0gY29udGFpbmVyTmFtZVxuICAgICAgY29udGFpbmVyTmFtZSA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5kZWZhdWx0TmFtZVxuXG4gICAgQGNvbnRhaW5lcnNbY29udGFpbmVyTmFtZV0ucHJlcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcmVzZXRWb2xhdGlsZVZhbHVlOiAobmFtZSwgdHJpZ2dlckNoYW5nZUV2ZW50PXRydWUpIC0+XG4gICAgY29uc29sZS5sb2cgQHRlbXBvcmFyeUNvbnRlbnRcbiAgICBjb25zb2xlLmxvZyBcIlJFU0VUVElORyAje25hbWV9IGZyb20gI3tAdGVtcG9yYXJ5Q29udGVudFtuYW1lXX1cIlxuICAgIGRlbGV0ZSBAdGVtcG9yYXJ5Q29udGVudFtuYW1lXVxuICAgIGNvbnNvbGUubG9nIEB0ZW1wb3JhcnlDb250ZW50XG4gICAgaWYgdHJpZ2dlckNoYW5nZUV2ZW50XG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUsIGZsYWc9JycpIC0+XG4gICAgaWYgbmFtZSA9PSAnaW1hZ2UnXG4gICAgICBsb2cgJ2hlcmUnLCAndHJhY2UnXG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwic2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBpZiBmbGFnID09ICd0ZW1wb3JhcnlPdmVycmlkZSdcbiAgICAgIHN0b3JhZ2VDb250YWluZXIgPSBAdGVtcG9yYXJ5Q29udGVudFxuICAgIGVsc2VcbiAgICAgIEByZXNldFZvbGF0aWxlVmFsdWUobmFtZSwgZmFsc2UpICMgYXMgc29vbiBhcyB3ZSBnZXQgcmVhbCBjb250ZW50LCByZXNldCB0aGUgdGVtcG9yYXJ5Q29udGVudFxuICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IEBjb250ZW50XG5cbiAgICBpZiBzdG9yYWdlQ29udGFpbmVyW25hbWVdICE9IHZhbHVlXG4gICAgICBzdG9yYWdlQ29udGFpbmVyW25hbWVdID0gdmFsdWVcbiAgICAgIEBzbmlwcGV0VHJlZS5jb250ZW50Q2hhbmdpbmcodGhpcywgbmFtZSkgaWYgQHNuaXBwZXRUcmVlXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImdldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgQGNvbnRlbnRbbmFtZV1cblxuXG4gICMgY2FuIGJlIGNhbGxlZCB3aXRoIGEgc3RyaW5nIG9yIGEgaGFzaFxuICBkYXRhOiAoYXJnKSAtPlxuICAgIGlmIHR5cGVvZihhcmcpID09ICdvYmplY3QnXG4gICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIGFyZ1xuICAgICAgICBpZiBAY2hhbmdlRGF0YShuYW1lLCB2YWx1ZSlcbiAgICAgICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMucHVzaChuYW1lKVxuICAgICAgaWYgQHNuaXBwZXRUcmVlICYmIGNoYW5nZWREYXRhUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIEBzbmlwcGV0VHJlZS5kYXRhQ2hhbmdpbmcodGhpcywgY2hhbmdlZERhdGFQcm9wZXJ0aWVzKVxuICAgIGVsc2VcbiAgICAgIEBkYXRhVmFsdWVzW2FyZ11cblxuXG4gIGNoYW5nZURhdGE6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBpZiBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKSA9PSBmYWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICBpc0VtcHR5OiAobmFtZSkgLT5cbiAgICB2YWx1ZSA9IEBnZXQobmFtZSlcbiAgICB2YWx1ZSA9PSB1bmRlZmluZWQgfHwgdmFsdWUgPT0gJydcblxuXG4gIHN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBzdHlsZSA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV1cbiAgICBpZiBub3Qgc3R5bGVcbiAgICAgIGxvZy53YXJuIFwiVW5rbm93biBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIFNuaXBwZXRNb2RlbCAjeyBAaWRlbnRpZmllciB9XCJcbiAgICBlbHNlXG4gICAgICBpZiBAc3R5bGVzW25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBzdHlsZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBpZiBAc25pcHBldFRyZWVcbiAgICAgICAgICBAc25pcHBldFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gIGNvcHk6IC0+XG4gICAgbG9nLndhcm4oXCJTbmlwcGV0TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIG1vdmUgdXAgKHByZXZpb3VzKVxuICB1cDogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLnVwKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyBtb3ZlIGRvd24gKG5leHQpXG4gIGRvd246IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5kb3duKHRoaXMpXG4gICAgdGhpc1xuXG5cbiAgIyByZW1vdmUgVHJlZU5vZGUgZnJvbSBpdHMgY29udGFpbmVyIGFuZCBTbmlwcGV0VHJlZVxuICByZW1vdmU6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci5yZW1vdmUodGhpcylcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuICAgICMgcmVtb3ZlIHVzZXIgaW50ZXJmYWNlIGVsZW1lbnRzXG4gICAgQHVpSW5qZWN0b3IucmVtb3ZlKCkgaWYgQHVpSW5qZWN0b3JcblxuXG4gIGdldFBhcmVudDogLT5cbiAgICAgQHBhcmVudENvbnRhaW5lcj8ucGFyZW50U25pcHBldFxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBAc25pcHBldFRyZWUucmVuZGVyZXIuY3JlYXRlSW50ZXJmYWNlSW5qZWN0b3IodGhpcylcbiAgICBAdWlJbmplY3RvclxuXG5cbiAgIyBJdGVyYXRvcnNcbiAgIyAtLS0tLS0tLS1cblxuICBwYXJlbnRzOiAoY2FsbGJhY2spIC0+XG4gICAgc25pcHBldE1vZGVsID0gdGhpc1xuICAgIHdoaWxlIChzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwuZ2V0UGFyZW50KCkpXG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG5cblxuICBjaGlsZHJlbjogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoc25pcHBldE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpXG4gICAgICAgIHNuaXBwZXRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLm5leHRcblxuXG4gIGRlc2NlbmRhbnRzQW5kU2VsZjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGRlc2NlbmRhbnRzKGNhbGxiYWNrKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyAoaW5jbHVkaW5nIHRob3NlIG9mIHRoaXMgc25pcHBldE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIHJldHVybiBhbGwgZGVzY2VuZGFudCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGxEZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKHNuaXBwZXRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRNb2RlbCkgaWYgc25pcHBldE1vZGVsICE9IHRoaXNcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICBjaGlsZHJlbkFuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBjaGlsZHJlbihjYWxsYmFjaylcblxuXG4gICMgU2VyaWFsaXphdGlvblxuICAjIC0tLS0tLS0tLS0tLS1cblxuICB0b0pzb246IC0+XG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBAaWRcbiAgICAgIGlkZW50aWZpZXI6IEBpZGVudGlmaWVyXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBjb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQHN0eWxlcylcbiAgICAgIGpzb24uc3R5bGVzID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShAc3R5bGVzKVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGF0YVZhbHVlcylcblxuICAgICMgY3JlYXRlIGFuIGFycmF5IGZvciBldmVyeSBjb250YWluZXJcbiAgICBmb3IgbmFtZSBvZiBAY29udGFpbmVyc1xuICAgICAganNvbi5jb250YWluZXJzIHx8PSB7fVxuICAgICAganNvbi5jb250YWluZXJzW25hbWVdID0gW11cblxuICAgIGpzb25cblxuXG5TbmlwcGV0TW9kZWwuZnJvbUpzb24gPSAoanNvbiwgZGVzaWduKSAtPlxuICB0ZW1wbGF0ZSA9IGRlc2lnbi5nZXQoanNvbi5pZGVudGlmaWVyKVxuXG4gIGFzc2VydCB0ZW1wbGF0ZSxcbiAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biB0ZW1wbGF0ZSBpZGVudGlmaWVyICcjeyBqc29uLmlkZW50aWZpZXIgfSdcIlxuXG4gIG1vZGVsID0gbmV3IFNuaXBwZXRNb2RlbCh7IHRlbXBsYXRlLCBpZDoganNvbi5pZCB9KVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICBhc3NlcnQgbW9kZWwuY29udGVudC5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIGNvbnRlbnQgJyN7IG5hbWUgfSdcIlxuICAgIG1vZGVsLmNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuXG4gIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgbW9kZWwuc3R5bGUoc3R5bGVOYW1lLCB2YWx1ZSlcblxuICBtb2RlbC5kYXRhKGpzb24uZGF0YSkgaWYganNvbi5kYXRhXG5cbiAgZm9yIGNvbnRhaW5lck5hbWUsIHNuaXBwZXRBcnJheSBvZiBqc29uLmNvbnRhaW5lcnNcbiAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiB1bmtub3duIGNvbnRhaW5lciAjeyBjb250YWluZXJOYW1lIH1cIlxuXG4gICAgaWYgc25pcHBldEFycmF5XG4gICAgICBhc3NlcnQgJC5pc0FycmF5KHNuaXBwZXRBcnJheSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBzbmlwcGV0OiBjb250YWluZXIgaXMgbm90IGFycmF5ICN7IGNvbnRhaW5lck5hbWUgfVwiXG4gICAgICBmb3IgY2hpbGQgaW4gc25pcHBldEFycmF5XG4gICAgICAgIG1vZGVsLmFwcGVuZCggY29udGFpbmVyTmFtZSwgU25pcHBldE1vZGVsLmZyb21Kc29uKGNoaWxkLCBkZXNpZ24pIClcblxuICBtb2RlbFxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5TbmlwcGV0Q29udGFpbmVyID0gcmVxdWlyZSgnLi9zbmlwcGV0X2NvbnRhaW5lcicpXG5TbmlwcGV0QXJyYXkgPSByZXF1aXJlKCcuL3NuaXBwZXRfYXJyYXknKVxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi9zbmlwcGV0X21vZGVsJylcblxuIyBTbmlwcGV0VHJlZVxuIyAtLS0tLS0tLS0tLVxuIyBMaXZpbmdkb2NzIGVxdWl2YWxlbnQgdG8gdGhlIERPTSB0cmVlLlxuIyBBIHNuaXBwZXQgdHJlZSBjb250YWluZXMgYWxsIHRoZSBzbmlwcGV0cyBvZiBhIHBhZ2UgaW4gaGllcmFyY2hpY2FsIG9yZGVyLlxuI1xuIyBUaGUgcm9vdCBvZiB0aGUgU25pcHBldFRyZWUgaXMgYSBTbmlwcGV0Q29udGFpbmVyLiBBIFNuaXBwZXRDb250YWluZXJcbiMgY29udGFpbnMgYSBsaXN0IG9mIHNuaXBwZXRzLlxuI1xuIyBzbmlwcGV0cyBjYW4gaGF2ZSBtdWx0aWJsZSBTbmlwcGV0Q29udGFpbmVycyB0aGVtc2VsdmVzLlxuI1xuIyAjIyMgRXhhbXBsZTpcbiMgICAgIC0gU25pcHBldENvbnRhaW5lciAocm9vdClcbiMgICAgICAgLSBTbmlwcGV0ICdIZXJvJ1xuIyAgICAgICAtIFNuaXBwZXQgJzIgQ29sdW1ucydcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ21haW4nXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ1RpdGxlJ1xuIyAgICAgICAgIC0gU25pcHBldENvbnRhaW5lciAnc2lkZWJhcidcbiMgICAgICAgICAgIC0gU25pcHBldCAnSW5mby1Cb3gnJ1xuI1xuIyAjIyMgRXZlbnRzOlxuIyBUaGUgZmlyc3Qgc2V0IG9mIFNuaXBwZXRUcmVlIEV2ZW50cyBhcmUgY29uY2VybmVkIHdpdGggbGF5b3V0IGNoYW5nZXMgbGlrZVxuIyBhZGRpbmcsIHJlbW92aW5nIG9yIG1vdmluZyBzbmlwcGV0cy5cbiNcbiMgQ29uc2lkZXI6IEhhdmUgYSBkb2N1bWVudEZyYWdtZW50IGFzIHRoZSByb290Tm9kZSBpZiBubyByb290Tm9kZSBpcyBnaXZlblxuIyBtYXliZSB0aGlzIHdvdWxkIGhlbHAgc2ltcGxpZnkgc29tZSBjb2RlIChzaW5jZSBzbmlwcGV0cyBhcmUgYWx3YXlzXG4jIGF0dGFjaGVkIHRvIHRoZSBET00pLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0VHJlZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbnRlbnQsIEBkZXNpZ24gfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgXCJFcnJvciBpbnN0YW50aWF0aW5nIFNuaXBwZXRUcmVlOiBkZXNpZ24gcGFyYW0gaXMgbWlzc3NpbmcuXCJcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgICMgaW5pdGlhbGl6ZSBjb250ZW50IGJlZm9yZSB3ZSBzZXQgdGhlIHNuaXBwZXQgdHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHRoaXNcbiAgICBAaW5pdGlhbGl6ZUV2ZW50cygpXG5cblxuICAjIEluc2VydCBhIHNuaXBwZXQgYXQgdGhlIGJlZ2lubmluZy5cbiAgIyBAcGFyYW06IHNuaXBwZXRNb2RlbCBpbnN0YW5jZSBvciBzbmlwcGV0IG5hbWUgZS5nLiAndGl0bGUnXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQgPSBAZ2V0U25pcHBldChzbmlwcGV0KVxuICAgIEByb290LnByZXBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICAjIEluc2VydCBzbmlwcGV0IGF0IHRoZSBlbmQuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBhcHBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIHNuaXBwZXQgPSBAZ2V0U25pcHBldChzbmlwcGV0KVxuICAgIEByb290LmFwcGVuZChzbmlwcGV0KSBpZiBzbmlwcGV0P1xuICAgIHRoaXNcblxuXG4gIGdldFNuaXBwZXQ6IChzbmlwcGV0TmFtZSkgLT5cbiAgICBpZiB0eXBlb2Ygc25pcHBldE5hbWUgPT0gJ3N0cmluZydcbiAgICAgIEBjcmVhdGVNb2RlbChzbmlwcGV0TmFtZSlcbiAgICBlbHNlXG4gICAgICBzbmlwcGV0TmFtZVxuXG5cbiAgY3JlYXRlTW9kZWw6IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldFRlbXBsYXRlKGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUuY3JlYXRlTW9kZWwoKSBpZiB0ZW1wbGF0ZVxuXG5cbiAgY3JlYXRlU25pcHBldDogLT5cbiAgICBAY3JlYXRlTW9kZWwuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG5cbiAgZ2V0VGVtcGxhdGU6IChpZGVudGlmaWVyKSAtPlxuICAgIHRlbXBsYXRlID0gQGRlc2lnbi5nZXQoaWRlbnRpZmllcilcbiAgICBhc3NlcnQgdGVtcGxhdGUsIFwiQ291bGQgbm90IGZpbmQgdGVtcGxhdGUgI3sgaWRlbnRpZmllciB9XCJcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgaW5pdGlhbGl6ZUV2ZW50czogKCkgLT5cblxuICAgICMgbGF5b3V0IGNoYW5nZXNcbiAgICBAc25pcHBldEFkZGVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldE1vdmVkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgIyBjb250ZW50IGNoYW5nZXNcbiAgICBAc25pcHBldENvbnRlbnRDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRTZXR0aW5nc0NoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXREYXRhQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBjaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgIyBUcmF2ZXJzZSB0aGUgd2hvbGUgc25pcHBldCB0cmVlLlxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaChjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoQ29udGFpbmVyKGNhbGxiYWNrKVxuXG5cbiAgIyBHZXQgdGhlIGZpcnN0IHNuaXBwZXRcbiAgZmlyc3Q6IC0+XG4gICAgQHJvb3QuZmlyc3RcblxuXG4gICMgVHJhdmVyc2UgYWxsIGNvbnRhaW5lcnMgYW5kIHNuaXBwZXRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgICBpZiBzbmlwcGV0LmlkZW50aWZpZXIgPT0gc2VhcmNoIHx8IHNuaXBwZXQudGVtcGxhdGUuaWQgPT0gc2VhcmNoXG4gICAgICAgICAgcmVzLnB1c2goc25pcHBldClcblxuICAgICAgbmV3IFNuaXBwZXRBcnJheShyZXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFNuaXBwZXRBcnJheSgpXG5cblxuICBkZXRhY2g6IC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB1bmRlZmluZWRcblxuICAgIG9sZFJvb3QgPSBAcm9vdFxuICAgIEByb290ID0gbmV3IFNuaXBwZXRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBlYWNoV2l0aFBhcmVudHM6IChzbmlwcGV0LCBwYXJlbnRzKSAtPlxuICAjICAgcGFyZW50cyB8fD0gW11cblxuICAjICAgIyB0cmF2ZXJzZVxuICAjICAgcGFyZW50cyA9IHBhcmVudHMucHVzaChzbmlwcGV0KVxuICAjICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICMgICAgIHNuaXBwZXQgPSBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgIyAgICAgd2hpbGUgKHNuaXBwZXQpXG4gICMgICAgICAgQGVhY2hXaXRoUGFyZW50cyhzbmlwcGV0LCBwYXJlbnRzKVxuICAjICAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuICAjICAgcGFyZW50cy5zcGxpY2UoLTEpXG5cblxuICAjIHJldHVybnMgYSByZWFkYWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHdob2xlIHRyZWVcbiAgcHJpbnQ6ICgpIC0+XG4gICAgb3V0cHV0ID0gJ1NuaXBwZXRUcmVlXFxuLS0tLS0tLS0tLS1cXG4nXG5cbiAgICBhZGRMaW5lID0gKHRleHQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIG91dHB1dCArPSBcIiN7IEFycmF5KGluZGVudGF0aW9uICsgMSkuam9pbihcIiBcIikgfSN7IHRleHQgfVxcblwiXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBzbmlwcGV0LnRlbXBsYXRlXG4gICAgICBhZGRMaW5lKFwiLSAjeyB0ZW1wbGF0ZS50aXRsZSB9ICgjeyB0ZW1wbGF0ZS5pZGVudGlmaWVyIH0pXCIsIGluZGVudGF0aW9uKVxuXG4gICAgICAjIHRyYXZlcnNlIGNoaWxkcmVuXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoc25pcHBldENvbnRhaW5lci5maXJzdCwgaW5kZW50YXRpb24gKyA0KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGluZGVudGF0aW9uKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCkgaWYgQHJvb3QuZmlyc3RcbiAgICByZXR1cm4gb3V0cHV0XG5cblxuICAjIFRyZWUgQ2hhbmdlIEV2ZW50c1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIFJhaXNlIGV2ZW50cyBmb3IgQWRkLCBSZW1vdmUgYW5kIE1vdmUgb2Ygc25pcHBldHNcbiAgIyBUaGVzZSBmdW5jdGlvbnMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IHNuaXBwZXRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGF0dGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWUgPT0gdGhpc1xuICAgICAgIyBtb3ZlIHNuaXBwZXRcbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRNb3ZlZCcsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgaWYgc25pcHBldC5zbmlwcGV0VHJlZT9cbiAgICAgICAgIyByZW1vdmUgZnJvbSBvdGhlciBzbmlwcGV0IHRyZWVcbiAgICAgICAgc25pcHBldC5zbmlwcGV0Q29udGFpbmVyLmRldGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgICAgc25pcHBldC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnQpID0+XG4gICAgICAgIGRlc2NlbmRhbnQuc25pcHBldFRyZWUgPSB0aGlzXG5cbiAgICAgIGF0dGFjaFNuaXBwZXRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRBZGRlZCcsIHNuaXBwZXQpXG5cblxuICBmaXJlRXZlbnQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICB0aGlzW2V2ZW50XS5maXJlLmFwcGx5KGV2ZW50LCBhcmdzKVxuICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG5cbiAgZGV0YWNoaW5nU25pcHBldDogKHNuaXBwZXQsIGRldGFjaFNuaXBwZXRGdW5jKSAtPlxuICAgIGFzc2VydCBzbmlwcGV0LnNuaXBwZXRUcmVlIGlzIHRoaXMsXG4gICAgICAnY2Fubm90IHJlbW92ZSBzbmlwcGV0IGZyb20gYW5vdGhlciBTbmlwcGV0VHJlZSdcblxuICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50cykgLT5cbiAgICAgIGRlc2NlbmRhbnRzLnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hTbmlwcGV0RnVuYygpXG4gICAgQGZpcmVFdmVudCgnc25pcHBldFJlbW92ZWQnLCBzbmlwcGV0KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0Q29udGVudENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoc25pcHBldCkgLT5cbiAgICBAZmlyZUV2ZW50KCdzbmlwcGV0SHRtbENoYW5nZWQnLCBzbmlwcGV0KVxuXG5cbiAgZGF0YUNoYW5naW5nOiAoc25pcHBldCwgY2hhbmdlZFByb3BlcnRpZXMpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldERhdGFDaGFuZ2VkJywgc25pcHBldCwgY2hhbmdlZFByb3BlcnRpZXMpXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgcHJpbnRKc29uOiAtPlxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihAdG9Kc29uKCkpXG5cblxuICAjIFJldHVybnMgYSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gICMgdGhhdCBjYW4gYmUgc2VudCB0byB0aGUgc2VydmVyIGFzIEpTT04uXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkYXRhID0ge31cbiAgICBkYXRhWydjb250ZW50J10gPSBbXVxuICAgIGRhdGFbJ2Rlc2lnbiddID0geyBuYW1lOiBAZGVzaWduLm5hbWVzcGFjZSB9XG5cbiAgICBzbmlwcGV0VG9EYXRhID0gKHNuaXBwZXQsIGxldmVsLCBjb250YWluZXJBcnJheSkgLT5cbiAgICAgIHNuaXBwZXREYXRhID0gc25pcHBldC50b0pzb24oKVxuICAgICAgY29udGFpbmVyQXJyYXkucHVzaCBzbmlwcGV0RGF0YVxuICAgICAgc25pcHBldERhdGFcblxuICAgIHdhbGtlciA9IChzbmlwcGV0LCBsZXZlbCwgZGF0YU9iaikgLT5cbiAgICAgIHNuaXBwZXREYXRhID0gc25pcHBldFRvRGF0YShzbmlwcGV0LCBsZXZlbCwgZGF0YU9iailcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNvbnRhaW5lckFycmF5ID0gc25pcHBldERhdGEuY29udGFpbmVyc1tzbmlwcGV0Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGxldmVsICsgMSwgY29udGFpbmVyQXJyYXkpIGlmIHNuaXBwZXRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKHNuaXBwZXQubmV4dCwgbGV2ZWwsIGRhdGFPYmopIGlmIHNuaXBwZXQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0LCAwLCBkYXRhWydjb250ZW50J10pIGlmIEByb290LmZpcnN0XG5cbiAgICBkYXRhXG5cblxuICB0b0pzb246IC0+XG4gICAgQHNlcmlhbGl6ZSgpXG5cblxuICBmcm9tSnNvbjogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAcm9vdC5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIHNuaXBwZXREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgICBzbmlwcGV0ID0gU25pcHBldE1vZGVsLmZyb21Kc29uKHNuaXBwZXREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChzbmlwcGV0KVxuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQHJvb3QuZWFjaCAoc25pcHBldCkgPT5cbiAgICAgIHNuaXBwZXQuc25pcHBldFRyZWUgPSB0aGlzXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEBlbGVtKVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlIHx8PSBAYWxsW25hbWVdXG4gICAgdGhpc1tkaXJlY3RpdmUuaW5kZXggKz0gMV1cblxuXG4gIG5leHRPZlR5cGU6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICAjIGhlbHBlciB0byBkaXJlY3RseSBnZXQgZWxlbWVudCB3cmFwcGVkIGluIGEgalF1ZXJ5IG9iamVjdFxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgY2xvbmU6IC0+XG4gICAgbmV3Q29sbGVjdGlvbiA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgbmV3Q29sbGVjdGlvbi5hZGQoZGlyZWN0aXZlLmNsb25lKCkpXG5cbiAgICBuZXdDb2xsZWN0aW9uXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIHBhcnNlOiAoZWxlbSkgLT5cbiAgICBlbGVtRGlyZWN0aXZlID0gdW5kZWZpbmVkXG4gICAgbW9kaWZpY2F0aW9ucyA9IFtdXG4gICAgQHBhcnNlRGlyZWN0aXZlcyBlbGVtLCAoZGlyZWN0aXZlKSAtPlxuICAgICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICAgIGVsZW1EaXJlY3RpdmUgPSBkaXJlY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kaWZpY2F0aW9ucy5wdXNoKGRpcmVjdGl2ZSlcblxuICAgIEBhcHBseU1vZGlmaWNhdGlvbnMoZWxlbURpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgaWYgZWxlbURpcmVjdGl2ZVxuICAgIHJldHVybiBlbGVtRGlyZWN0aXZlXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChlbGVtLCBmdW5jKSAtPlxuICAgIGRpcmVjdGl2ZURhdGEgPSBbXVxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHIubmFtZVxuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyaWJ1dGVOYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmVEYXRhLnB1c2hcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBhdHRyaWJ1dGVOYW1lXG4gICAgICAgICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlXG4gICAgICAgICAgICBuYW1lOiBhdHRyLnZhbHVlXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICBlbGVtOiBlbGVtXG5cbiAgICAjIFNpbmNlIHdlIG1vZGlmeSB0aGUgYXR0cmlidXRlcyB3ZSBoYXZlIHRvIHNwbGl0XG4gICAgIyB0aGlzIGludG8gdHdvIGxvb3BzXG4gICAgZm9yIGRhdGEgaW4gZGlyZWN0aXZlRGF0YVxuICAgICAgZGlyZWN0aXZlID0gZGF0YS5kaXJlY3RpdmVcbiAgICAgIEByZXdyaXRlQXR0cmlidXRlKGRpcmVjdGl2ZSwgZGF0YS5hdHRyaWJ1dGVOYW1lKVxuICAgICAgZnVuYyhkaXJlY3RpdmUpXG5cblxuICBhcHBseU1vZGlmaWNhdGlvbnM6IChtYWluRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gbW9kaWZpY2F0aW9uc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ29wdGlvbmFsJ1xuICAgICAgICAgIG1haW5EaXJlY3RpdmUub3B0aW9uYWwgPSB0cnVlXG5cblxuICAjIE5vcm1hbGl6ZSBvciByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAjIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gIHJld3JpdGVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICBpZiBhdHRyaWJ1dGVOYW1lICE9IGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICAgIGVsc2UgaWYgbm90IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlKVxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuXG5cbiAgIyBmb3JjZSBhdHRyaWJ1dGUgc3R5bGUgYXMgc3BlY2lmaWVkIGluIGNvbmZpZ1xuICAjIGUuZy4gYXR0cmlidXRlICdkb2MtY29udGFpbmVyJyBiZWNvbWVzICdkYXRhLWRvYy1jb250YWluZXInXG4gIG5vcm1hbGl6ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBlbGVtID0gZGlyZWN0aXZlLmVsZW1cbiAgICBpZiBhdHRyaWJ1dGVOYW1lXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICBlbGVtLnNldEF0dHJpYnV0ZShkaXJlY3RpdmUucmVuZGVyZWRBdHRyKCksIGRpcmVjdGl2ZS5uYW1lKVxuXG5cbiAgcmVtb3ZlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGRpcmVjdGl2ZS5lbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3Igc25pcHBldCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5TbmlwcGV0TW9kZWwgPSByZXF1aXJlKCcuLi9zbmlwcGV0X3RyZWUvc25pcHBldF9tb2RlbCcpXG5TbmlwcGV0VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcnKVxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBzbmlwcGV0IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBTbmlwcGV0TW9kZWxzIGFuZCBTbmlwcGV0Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgaHRtbCwgQG5hbWVzcGFjZSwgQGlkLCBpZGVudGlmaWVyLCB0aXRsZSwgc3R5bGVzLCB3ZWlnaHQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIGlmIGlkZW50aWZpZXJcbiAgICAgIHsgQG5hbWVzcGFjZSwgQGlkIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcblxuICAgIEBpZGVudGlmaWVyID0gaWYgQG5hbWVzcGFjZSAmJiBAaWRcbiAgICAgIFwiI3sgQG5hbWVzcGFjZSB9LiN7IEBpZCB9XCJcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEB0aXRsZSA9IHRpdGxlIHx8IHdvcmRzLmh1bWFuaXplKCBAaWQgKVxuICAgIEBzdHlsZXMgPSBzdHlsZXMgfHwge31cbiAgICBAd2VpZ2h0ID0gd2VpZ2h0XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gICMgY3JlYXRlIGEgbmV3IFNuaXBwZXRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IFNuaXBwZXRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChzbmlwcGV0TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgc25pcHBldE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIHNuaXBwZXRWaWV3ID0gbmV3IFNuaXBwZXRWaWV3XG4gICAgICBtb2RlbDogc25pcHBldE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3tAaWRlbnRpZmllcn1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IFNuaXBwZXRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBzbmlwcGV0RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBzbmlwcGV0RGlyZWN0aXZlcylcblxuICAgIHNuaXBwZXREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIG91dHB1dCB0aGUgYWNjZXB0ZWQgY29udGVudCBvZiB0aGUgc25pcHBldFxuICAjIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBjcmVhdGVcbiAgIyBlLmc6IHsgdGl0bGU6IFwiSXRjaHkgYW5kIFNjcmF0Y2h5XCIgfVxuICBwcmludERvYzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgaWRlbnRpZmllcjogQGlkZW50aWZpZXJcbiAgICAgICMgZWRpdGFibGVzOiBPYmplY3Qua2V5cyBAZWRpdGFibGVzIGlmIEBlZGl0YWJsZXNcbiAgICAgICMgY29udGFpbmVyczogT2JqZWN0LmtleXMgQGNvbnRhaW5lcnMgaWYgQGNvbnRhaW5lcnNcblxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihkb2MpXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgbmFtZXNwYWNlOiB1bmRlZmluZWQsIGlkOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IG5hbWVzcGFjZTogcGFydHNbMF0sIGlkOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2Ugc25pcHBldCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
