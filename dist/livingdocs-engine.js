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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvbGliL2tleXMuanMiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2RlZmF1bHRzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3N0eWxlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kb2N1bWVudC5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2tpY2tzdGFydC9icm93c2VyX3htbGRvbS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9mZWF0dXJlX2RldGVjdHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3NlcmlhbGl6YXRpb24uY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9pbWFnZV9tYW5hZ2VyLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9zbmlwcGV0X3ZpZXcuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy92aWV3LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X2FycmF5LmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3NuaXBwZXRfdHJlZS9zbmlwcGV0X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9nYWJyaWVsaGFzZS9wcm9qZWN0cy91cGZyb250L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL2dhYnJpZWxoYXNlL3Byb2plY3RzL3VwZnJvbnQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvZ2FicmllbGhhc2UvcHJvamVjdHMvdXBmcm9udC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFnQixDQUFuQjtXQUNFO0FBQUEsTUFBRSxTQUFBLEVBQVcsTUFBYjtBQUFBLE1BQXdCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFsQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFNBQUEsRUFBVyxLQUFNLENBQUEsQ0FBQSxDQUFuQjtBQUFBLE1BQXVCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFqQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsK0NBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQTlJM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRvY3VtZW50ID0gcmVxdWlyZSgnLi9kb2N1bWVudCcpXG5TbmlwcGV0VHJlZSA9IHJlcXVpcmUoJy4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jID0gZG8gLT5cblxuICBlZGl0b3JQYWdlID0gbmV3IEVkaXRvclBhZ2UoKVxuXG5cbiAgIyBJbnN0YW50aWF0aW9uIHByb2Nlc3M6XG4gICMgYXN5bmMgb3Igc3luYyAtPiBnZXQgZGVzaWduIChpbmNsdWRlIGpzIGZvciBzeW5jaHJvbm91cyBsb2FkaW5nKVxuICAjIHN5bmMgLT4gY3JlYXRlIGRvY3VtZW50XG4gICMgYXN5bmMgLT4gY3JlYXRlIHZpZXcgKGlmcmFtZSlcbiAgIyBhc3luYyAtPiBsb2FkIHJlc291cmNlcyBpbnRvIHZpZXdcblxuXG4gICMgTG9hZCBhIGRvY3VtZW50IGZyb20gc2VyaWFsaXplZCBkYXRhXG4gICMgaW4gYSBzeW5jaHJvbm91cyB3YXkuIERlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgbmV3OiAoeyBkYXRhLCBkZXNpZ24gfSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGRvY3VtZW50OiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgZGVzaWduTmFtZSA9IGRlc2lnblxuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShkZXNpZ246IGRlc2lnbilcblxuICAgIEBjcmVhdGUoc25pcHBldFRyZWUpXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgZG9jLmxvYWQoanNvbkZyb21TZXJ2ZXIpXG4gICMgIC50aGVuIChkb2N1bWVudCkgLT5cbiAgIyAgICBkb2N1bWVudC5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgRGlyZWN0IGNyZWF0aW9uIHdpdGggYW4gZXhpc3RpbmcgU25pcHBldFRyZWVcbiAgY3JlYXRlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgbmV3IERvY3VtZW50KHsgc25pcHBldFRyZWUgfSlcblxuXG4gICMgU2VlIGRlc2lnbkNhY2hlLmxvYWQgZm9yIGV4YW1wbGVzIGhvdyB0byBsb2FkIHlvdXIgZGVzaWduLlxuICBkZXNpZ246IGRlc2lnbkNhY2hlXG5cbiAgIyBTdGFydCBkcmFnICYgZHJvcFxuICBzdGFydERyYWc6ICQucHJveHkoZWRpdG9yUGFnZSwgJ3N0YXJ0RHJhZycpXG5cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG4iLCIjIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gICMgTG9hZCBjc3MgYW5kIGpzIHJlc291cmNlcyBpbiBwYWdlcyBhbmQgaW50ZXJhY3RpdmUgcGFnZXNcbiAgbG9hZFJlc291cmNlczogdHJ1ZVxuXG4gICMgU2V0dXAgcGF0aHMgdG8gbG9hZCByZXNvdXJjZXMgZHluYW1pY2FsbHlcbiAgZGVzaWduUGF0aDogJy9kZXNpZ25zJ1xuICBsaXZpbmdkb2NzQ3NzRmlsZTogJy9hc3NldHMvY3NzL2xpdmluZ2RvY3MuY3NzJ1xuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgSW4gY3NzIGFuZCBhdHRyIHlvdSBmaW5kIGV2ZXJ5dGhpbmcgdGhhdCBjYW4gZW5kIHVwIGluIHRoZSBodG1sXG4gICMgdGhlIGVuZ2luZSBzcGl0cyBvdXQgb3Igd29ya3Mgd2l0aC5cblxuICAjIGNzcyBjbGFzc2VzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgY3NzOlxuICAgICMgZG9jdW1lbnQgY2xhc3Nlc1xuICAgIHNlY3Rpb246ICdkb2Mtc2VjdGlvbidcblxuICAgICMgc25pcHBldCBjbGFzc2VzXG4gICAgc25pcHBldDogJ2RvYy1zbmlwcGV0J1xuICAgIGVkaXRhYmxlOiAnZG9jLWVkaXRhYmxlJ1xuICAgIG5vUGxhY2Vob2xkZXI6ICdkb2Mtbm8tcGxhY2Vob2xkZXInXG4gICAgZW1wdHlJbWFnZTogJ2RvYy1pbWFnZS1lbXB0eSdcbiAgICBpbnRlcmZhY2U6ICdkb2MtdWknXG5cbiAgICAjIGhpZ2hsaWdodCBjbGFzc2VzXG4gICAgc25pcHBldEhpZ2hsaWdodDogJ2RvYy1zbmlwcGV0LWhpZ2hsaWdodCdcbiAgICBjb250YWluZXJIaWdobGlnaHQ6ICdkb2MtY29udGFpbmVyLWhpZ2hsaWdodCdcblxuICAgICMgZHJhZyAmIGRyb3BcbiAgICBkcmFnZ2VkOiAnZG9jLWRyYWdnZWQnXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyOiAnZG9jLWRyYWdnZWQtcGxhY2Vob2xkZXInXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlcjogJ2RvYy1kcmFnLWNvdW50ZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBLaWNrc3RhcnQgY29uZmlnXG4gIGtpY2tzdGFydDpcbiAgICBhdHRyOlxuICAgICAgc3R5bGVzOiAnZG9jLXN0eWxlcydcblxuICAjIERpcmVjdGl2ZSBkZWZpbml0aW9uc1xuICAjXG4gICMgYXR0cjogYXR0cmlidXRlIHVzZWQgaW4gdGVtcGxhdGVzIHRvIGRlZmluZSB0aGUgZGlyZWN0aXZlXG4gICMgcmVuZGVyZWRBdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiBvdXRwdXQgaHRtbFxuICAjIGVsZW1lbnREaXJlY3RpdmU6IGRpcmVjdGl2ZSB0aGF0IHRha2VzIGNvbnRyb2wgb3ZlciB0aGUgZWxlbWVudFxuICAjICAgKHRoZXJlIGNhbiBvbmx5IGJlIG9uZSBwZXIgZWxlbWVudClcbiAgIyBkZWZhdWx0TmFtZTogZGVmYXVsdCBuYW1lIGlmIG5vbmUgd2FzIHNwZWNpZmllZCBpbiB0aGUgdGVtcGxhdGVcbiAgZGlyZWN0aXZlczpcbiAgICBjb250YWluZXI6XG4gICAgICBhdHRyOiAnZG9jLWNvbnRhaW5lcidcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgZWRpdGFibGU6XG4gICAgICBhdHRyOiAnZG9jLWVkaXRhYmxlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBpbWFnZTpcbiAgICAgIGF0dHI6ICdkb2MtaW1hZ2UnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdpbWFnZSdcbiAgICBodG1sOlxuICAgICAgYXR0cjogJ2RvYy1odG1sJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBvcHRpb25hbDpcbiAgICAgIGF0dHI6ICdkb2Mtb3B0aW9uYWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogZmFsc2VcblxuXG4gIGFuaW1hdGlvbnM6XG4gICAgb3B0aW9uYWxzOlxuICAgICAgc2hvdzogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZURvd24oMjUwKVxuXG4gICAgICBoaWRlOiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlVXAoMjUwKVxuXG5cbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuI1xuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb24gd2l0aCBzaG9ydGhhbmRzIGFuZCBjb21wdXRlZCB2YWx1ZXMuXG5lbnJpY2hDb25maWcgPSAtPlxuXG4gICMgU2hvcnRoYW5kcyBmb3Igc3R1ZmYgdGhhdCBpcyB1c2VkIGFsbCBvdmVyIHRoZSBwbGFjZSB0byBtYWtlXG4gICMgY29kZSBhbmQgc3BlY3MgbW9yZSByZWFkYWJsZS5cbiAgQGRvY0RpcmVjdGl2ZSA9IHt9XG4gIEB0ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBAZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBcIiN7IEBhdHRyaWJ1dGVQcmVmaXggfS1cIiBpZiBAYXR0cmlidXRlUHJlZml4XG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfHwgJycgfSN7IHZhbHVlLmF0dHIgfVwiXG5cbiAgICBAZG9jRGlyZWN0aXZlW25hbWVdID0gdmFsdWUucmVuZGVyZWRBdHRyXG4gICAgQHRlbXBsYXRlQXR0ckxvb2t1cFt2YWx1ZS5hdHRyXSA9IG5hbWVcblxuXG5lbnJpY2hDb25maWcuY2FsbChjb25maWcpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5EZXNpZ25TdHlsZSA9IHJlcXVpcmUoJy4vZGVzaWduX3N0eWxlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICBjb25zdHJ1Y3RvcjogKGRlc2lnbikgLT5cbiAgICB0ZW1wbGF0ZXMgPSBkZXNpZ24udGVtcGxhdGVzIHx8IGRlc2lnbi5zbmlwcGV0c1xuICAgIGNvbmZpZyA9IGRlc2lnbi5jb25maWdcbiAgICBncm91cHMgPSBkZXNpZ24uY29uZmlnLmdyb3VwcyB8fCBkZXNpZ24uZ3JvdXBzXG5cbiAgICBAbmFtZXNwYWNlID0gY29uZmlnPy5uYW1lc3BhY2UgfHwgJ2xpdmluZ2RvY3MtdGVtcGxhdGVzJ1xuICAgIEBwYXJhZ3JhcGhTbmlwcGV0ID0gY29uZmlnPy5wYXJhZ3JhcGggfHwgJ3RleHQnXG4gICAgQGNzcyA9IGNvbmZpZy5jc3NcbiAgICBAanMgPSBjb25maWcuanNcbiAgICBAZm9udHMgPSBjb25maWcuZm9udHNcbiAgICBAdGVtcGxhdGVzID0gW11cbiAgICBAZ3JvdXBzID0ge31cbiAgICBAc3R5bGVzID0ge31cblxuICAgIEBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnModGVtcGxhdGVzKVxuICAgIEBnbG9iYWxTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGRlc2lnbi5jb25maWcuc3R5bGVzKVxuICAgIEBhZGRHcm91cHMoZ3JvdXBzKVxuICAgIEBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwcygpXG5cblxuICBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnM6ICh0ZW1wbGF0ZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnMgPSB7fVxuICAgIGZvciB0ZW1wbGF0ZSBpbiB0ZW1wbGF0ZXNcbiAgICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG5cblxuICAjIHBhc3MgdGhlIHRlbXBsYXRlIGFzIG9iamVjdFxuICAjIGUuZyBhZGQoe2lkOiBcInRpdGxlXCIsIG5hbWU6XCJUaXRsZVwiLCBodG1sOiBcIjxoMSBkb2MtZWRpdGFibGU+VGl0bGU8L2gxPlwifSlcbiAgYWRkOiAodGVtcGxhdGVEZWZpbml0aW9uLCBzdHlsZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVEZWZpbml0aW9uLmlkXSA9IHVuZGVmaW5lZFxuICAgIHRlbXBsYXRlT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24odGVtcGxhdGVEZWZpbml0aW9uLnN0eWxlcylcbiAgICB0ZW1wbGF0ZVN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBzdHlsZXMsIHRlbXBsYXRlT25seVN0eWxlcylcblxuICAgIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlXG4gICAgICBuYW1lc3BhY2U6IEBuYW1lc3BhY2VcbiAgICAgIGlkOiB0ZW1wbGF0ZURlZmluaXRpb24uaWRcbiAgICAgIHRpdGxlOiB0ZW1wbGF0ZURlZmluaXRpb24udGl0bGVcbiAgICAgIHN0eWxlczogdGVtcGxhdGVTdHlsZXNcbiAgICAgIGh0bWw6IHRlbXBsYXRlRGVmaW5pdGlvbi5odG1sXG4gICAgICB3ZWlnaHQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5zb3J0T3JkZXIgfHwgMFxuXG4gICAgQHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlKVxuICAgIHRlbXBsYXRlXG5cblxuICBhZGRHcm91cHM6IChjb2xsZWN0aW9uKSAtPlxuICAgIGZvciBncm91cE5hbWUsIGdyb3VwIG9mIGNvbGxlY3Rpb25cbiAgICAgIGdyb3VwT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZ3JvdXAuc3R5bGVzKVxuICAgICAgZ3JvdXBTdHlsZXMgPSAkLmV4dGVuZCh7fSwgQGdsb2JhbFN0eWxlcywgZ3JvdXBPbmx5U3R5bGVzKVxuXG4gICAgICB0ZW1wbGF0ZXMgPSB7fVxuICAgICAgZm9yIHRlbXBsYXRlSWQgaW4gZ3JvdXAudGVtcGxhdGVzXG4gICAgICAgIHRlbXBsYXRlRGVmaW5pdGlvbiA9IEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlSWRdXG4gICAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICAgIHRlbXBsYXRlID0gQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIGdyb3VwU3R5bGVzKVxuICAgICAgICAgIHRlbXBsYXRlc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLndhcm4oXCJUaGUgdGVtcGxhdGUgJyN7dGVtcGxhdGVJZH0nIHJlZmVyZW5jZWQgaW4gdGhlIGdyb3VwICcje2dyb3VwTmFtZX0nIGRvZXMgbm90IGV4aXN0LlwiKVxuXG4gICAgICBAYWRkR3JvdXAoZ3JvdXBOYW1lLCBncm91cCwgdGVtcGxhdGVzKVxuXG5cbiAgYWRkVGVtcGxhdGVzTm90SW5Hcm91cHM6IChnbG9iYWxTdHlsZXMpIC0+XG4gICAgZm9yIHRlbXBsYXRlSWQsIHRlbXBsYXRlRGVmaW5pdGlvbiBvZiBAdGVtcGxhdGVEZWZpbml0aW9uc1xuICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgIEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBAZ2xvYmFsU3R5bGVzKVxuXG5cbiAgYWRkR3JvdXA6IChuYW1lLCBncm91cCwgdGVtcGxhdGVzKSAtPlxuICAgIEBncm91cHNbbmFtZV0gPVxuICAgICAgdGl0bGU6IGdyb3VwLnRpdGxlXG4gICAgICB0ZW1wbGF0ZXM6IHRlbXBsYXRlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uOiAoc3R5bGVzKSAtPlxuICAgIGRlc2lnblN0eWxlcyA9IHt9XG4gICAgaWYgc3R5bGVzXG4gICAgICBmb3Igc3R5bGVEZWZpbml0aW9uIGluIHN0eWxlc1xuICAgICAgICBkZXNpZ25TdHlsZSA9IEBjcmVhdGVEZXNpZ25TdHlsZShzdHlsZURlZmluaXRpb24pXG4gICAgICAgIGRlc2lnblN0eWxlc1tkZXNpZ25TdHlsZS5uYW1lXSA9IGRlc2lnblN0eWxlIGlmIGRlc2lnblN0eWxlXG5cbiAgICBkZXNpZ25TdHlsZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlOiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIGlmIHN0eWxlRGVmaW5pdGlvbiAmJiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgbmV3IERlc2lnblN0eWxlXG4gICAgICAgIG5hbWU6IHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICAgIHR5cGU6IHN0eWxlRGVmaW5pdGlvbi50eXBlXG4gICAgICAgIG9wdGlvbnM6IHN0eWxlRGVmaW5pdGlvbi5vcHRpb25zXG4gICAgICAgIHZhbHVlOiBzdHlsZURlZmluaXRpb24udmFsdWVcblxuXG4gIHJlbW92ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIEB0ZW1wbGF0ZXMuc3BsaWNlKEBnZXRJbmRleChpZCksIDEpXG5cblxuICBnZXQ6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICB0ZW1wbGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGluZGV4KSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgdGVtcGxhdGUgPSB0XG5cbiAgICAgIHRlbXBsYXRlXG5cblxuICBnZXRJbmRleDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIGluZGV4ID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaSkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIGluZGV4ID0gaVxuXG4gICAgICBpbmRleFxuXG5cbiAgY2hlY2tOYW1lc3BhY2U6IChpZGVudGlmaWVyLCBjYWxsYmFjaykgLT5cbiAgICB7IG5hbWVzcGFjZSwgaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IG5vdCBuYW1lc3BhY2Ugb3IgQG5hbWVzcGFjZSBpcyBuYW1lc3BhY2UsXG4gICAgICBcImRlc2lnbiAjeyBAbmFtZXNwYWNlIH06IGNhbm5vdCBnZXQgdGVtcGxhdGUgd2l0aCBkaWZmZXJlbnQgbmFtZXNwYWNlICN7IG5hbWVzcGFjZSB9IFwiXG5cbiAgICBjYWxsYmFjayhpZClcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdGVtcGxhdGUsIGluZGV4IGluIEB0ZW1wbGF0ZXNcbiAgICAgIGNhbGxiYWNrKHRlbXBsYXRlLCBpbmRleClcblxuXG4gICMgbGlzdCBhdmFpbGFibGUgVGVtcGxhdGVzXG4gIGxpc3Q6IC0+XG4gICAgdGVtcGxhdGVzID0gW11cbiAgICBAZWFjaCAodGVtcGxhdGUpIC0+XG4gICAgICB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgdGVtcGxhdGVzXG5cblxuICAjIHByaW50IGRvY3VtZW50YXRpb24gZm9yIGEgdGVtcGxhdGVcbiAgaW5mbzogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0KGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUucHJpbnREb2MoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZXNpZ25zOiB7fVxuXG4gICMgQ2FuIGxvYWQgYSBkZXNpZ24gc3luY2hyb25vdXNseSBpZiB5b3UgaW5jbHVkZSB0aGVcbiAgIyBkZXNpZ24uanMgZmlsZSBiZWZvcmUgbGl2aW5nZG9jcy5cbiAgIyBkb2MuZGVzaWduLmxvYWQoZGVzaWduc1sneW91ckRlc2lnbiddKVxuICAjXG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gdGhlIGRlZmF1bHQgc291cmNlOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChuYW1lKSAtPlxuICAgIGlmIHR5cGVvZiBuYW1lID09ICdzdHJpbmcnXG4gICAgICBhc3NlcnQgZmFsc2UsICdMb2FkIGRlc2lnbiBieSBuYW1lIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbkNvbmZpZyA9IG5hbWVcbiAgICAgIGRlc2lnbiA9IG5ldyBEZXNpZ24oZGVzaWduQ29uZmlnKVxuICAgICAgQGFkZChkZXNpZ24pXG5cblxuICBhZGQ6IChkZXNpZ24pIC0+XG4gICAgbmFtZSA9IGRlc2lnbi5uYW1lc3BhY2VcbiAgICBAZGVzaWduc1tuYW1lXSA9IGRlc2lnblxuXG5cbiAgaGFzOiAobmFtZSkgLT5cbiAgICBAZGVzaWduc1tuYW1lXT9cblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBoYXMobmFtZSksIFwiRXJyb3I6IGRlc2lnbiAnI3sgbmFtZSB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbbmFtZV1cblxuXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblN0eWxlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdHlwZSwgdmFsdWUsIG9wdGlvbnMgfSkgLT5cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ29wdGlvbidcbiAgICAgICAgYXNzZXJ0IHZhbHVlLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICd2YWx1ZScgcHJvdmlkZWRcIlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgd2hlbiAnc2VsZWN0J1xuICAgICAgICBhc3NlcnQgb3B0aW9ucywgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAnb3B0aW9ucycgcHJvdmlkZWRcIlxuICAgICAgICBAb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogdW5rbm93biB0eXBlICcjeyBAdHlwZSB9J1wiXG5cblxuICAjIEdldCBpbnN0cnVjdGlvbnMgd2hpY2ggY3NzIGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUuXG4gICMgV2UgZG8gbm90IGNvbnRyb2wgdGhlIGNsYXNzIGF0dHJpYnV0ZSBvZiBhIHNuaXBwZXQgRE9NIGVsZW1lbnRcbiAgIyBzaW5jZSB0aGUgVUkgb3Igb3RoZXIgc2NyaXB0cyBjYW4gbWVzcyB3aXRoIGl0IGFueSB0aW1lLiBTbyB0aGVcbiAgIyBpbnN0cnVjdGlvbnMgYXJlIGRlc2lnbmVkIG5vdCB0byBpbnRlcmZlcmUgd2l0aCBvdGhlciBjc3MgY2xhc3Nlc1xuICAjIHByZXNlbnQgaW4gYW4gZWxlbWVudHMgY2xhc3MgYXR0cmlidXRlLlxuICBjc3NDbGFzc0NoYW5nZXM6ICh2YWx1ZSkgLT5cbiAgICBpZiBAdmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogaWYgbm90IHZhbHVlIHRoZW4gW0B2YWx1ZV0gZWxzZSB1bmRlZmluZWRcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModmFsdWUpXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICBlbHNlXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGN1cnJlbnRWYWx1ZVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModW5kZWZpbmVkKVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuXG5cbiAgdmFsaWRhdGVWYWx1ZTogKHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgIHZhbHVlID09IEB2YWx1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgIEBjb250YWluc09wdGlvbih2YWx1ZSlcbiAgICBlbHNlXG4gICAgICBsb2cud2FybiBcIk5vdCBpbXBsZW1lbnRlZDogRGVzaWduU3R5bGUjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuVmlldyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3ZpZXcnKVxuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEb2N1bWVudCBleHRlbmRzIEV2ZW50RW1pdHRlclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHNuaXBwZXRUcmVlIH0pIC0+XG4gICAgQGRlc2lnbiA9IHNuaXBwZXRUcmVlLmRlc2lnblxuICAgIEBzZXRTbmlwcGV0VHJlZShzbmlwcGV0VHJlZSlcbiAgICBAdmlld3MgPSB7fVxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB1bmRlZmluZWRcblxuXG4gIHNldFNuaXBwZXRUcmVlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXRUcmVlLmRlc2lnbiA9PSBAZGVzaWduLFxuICAgICAgJ1NuaXBwZXRUcmVlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZXNpZ24gYXMgdGhlIGRvY3VtZW50J1xuXG4gICAgQG1vZGVsID0gQHNuaXBwZXRUcmVlID0gc25pcHBldFRyZWVcbiAgICBAZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzKClcblxuXG4gIGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50czogLT5cbiAgICBAc25pcHBldFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBlbWl0ICdjaGFuZ2UnLCBhcmd1bWVudHNcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQsIG9wdGlvbnMpIC0+XG4gICAgcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgb3B0aW9ucyA/PSByZWFkT25seTogdHJ1ZVxuXG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG5cbiAgICBvcHRpb25zLiR3cmFwcGVyID0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KEBzbmlwcGV0VHJlZSwgJHBhcmVudFswXSlcbiAgICBwcm9taXNlID0gdmlldy5jcmVhdGUob3B0aW9ucylcblxuICAgIGlmIHZpZXcuaXNJbnRlcmFjdGl2ZVxuICAgICAgQHNldEludGVyYWN0aXZlVmlldyh2aWV3KVxuXG4gICAgcHJvbWlzZVxuXG5cbiAgIyBBIHZpZXcgc29tZXRpbWVzIGhhcyB0byBiZSB3cmFwcGVkIGluIGEgY29udGFpbmVyLlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBIZXJlIHRoZSBkb2N1bWVudCBpcyByZW5kZXJlZCBpbnRvICQoJy5kb2Mtc2VjdGlvbicpXG4gICMgPGRpdiBjbGFzcz1cImlmcmFtZS1jb250YWluZXJcIj5cbiAgIyAgIDxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+PC9zZWN0aW9uPlxuICAjIDwvZGl2PlxuICBmaW5kV3JhcHBlcjogKCRwYXJlbnQpIC0+XG4gICAgaWYgJHBhcmVudC5maW5kKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIpLmxlbmd0aCA9PSAxXG4gICAgICAkd3JhcHBlciA9ICQoJHBhcmVudC5odG1sKCkpXG5cbiAgICAkd3JhcHBlclxuXG5cbiAgc2V0SW50ZXJhY3RpdmVWaWV3OiAodmlldykgLT5cbiAgICBhc3NlcnQgbm90IEBpbnRlcmFjdGl2ZVZpZXc/LFxuICAgICAgJ0Vycm9yIGNyZWF0aW5nIGludGVyYWN0aXZlIHZpZXc6IERvY3VtZW50IGNhbiBoYXZlIG9ubHkgb25lIGludGVyYWN0aXZlIHZpZXcnXG5cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdmlld1xuXG5cbiAgdG9IdG1sOiAtPlxuICAgIG5ldyBSZW5kZXJlcihcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgKS5odG1sKClcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAc25pcHBldFRyZWUuc2VyaWFsaXplKClcblxuXG4gIHRvSnNvbjogKHByZXR0aWZ5KSAtPlxuICAgIGRhdGEgPSBAc2VyaWFsaXplKClcbiAgICBpZiBwcmV0dGlmeT9cbiAgICAgIHJlcGxhY2VyID0gbnVsbFxuICAgICAgc3BhY2UgPSAyXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgc3BhY2UpXG4gICAgZWxzZVxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSlcblxuXG4gICMgRGVidWdcbiAgIyAtLS0tLVxuXG4gICMgUHJpbnQgdGhlIFNuaXBwZXRUcmVlLlxuICBwcmludE1vZGVsOiAoKSAtPlxuICAgIEBzbmlwcGV0VHJlZS5wcmludCgpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBET00gaGVscGVyIG1ldGhvZHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE1ldGhvZHMgdG8gcGFyc2UgYW5kIHVwZGF0ZSB0aGUgRG9tIHRyZWUgaW4gYWNjb3JkYW5jZSB0b1xuIyB0aGUgU25pcHBldFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBzbmlwcGV0UmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zbmlwcGV0IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNlY3Rpb24gfSg/OiB8JClcIilcblxuICAjIEZpbmQgdGhlIHNuaXBwZXQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgU25pcHBldHMgYXJlIG1hcmtlZCBieSBhIGNsYXNzIGF0IHRoZSBtb21lbnQuXG4gIGZpbmRTbmlwcGV0VmlldzogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRTbmlwcGV0Vmlldyhub2RlKVxuICAgICAgICByZXR1cm4gdmlld1xuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBmaW5kTm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgbm9kZUNvbnRleHQgPSBAZ2V0Tm9kZUNvbnRleHQobm9kZSlcbiAgICAgIHJldHVybiBub2RlQ29udGV4dCBpZiBub2RlQ29udGV4dFxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBnZXROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZVR5cGUsIG9iaiBvZiBjb25maWcuZGlyZWN0aXZlc1xuICAgICAgY29udGludWUgaWYgbm90IG9iai5lbGVtZW50RGlyZWN0aXZlXG5cbiAgICAgIGRpcmVjdGl2ZUF0dHIgPSBvYmoucmVuZGVyZWRBdHRyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRleHRBdHRyOiBkaXJlY3RpdmVBdHRyXG4gICAgICAgICAgYXR0ck5hbWU6IG5vZGUuZ2V0QXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICMgRmluZCB0aGUgY29udGFpbmVyIHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICBmaW5kQ29udGFpbmVyOiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICB2aWV3ID0gQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcbiAgICAgICAgICBzbmlwcGV0Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Q29udGFpbmVyVGFyZ2V0KG5vZGUpXG5cbiAgICAgICMgYWJvdmUgc25pcHBldFxuICAgICAgZWxzZSBpZiBzbmlwcGV0UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcmV0dXJuIEBnZXRTbmlwcGV0VGFyZ2V0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG5cbiAgICAgICMgYWJvdmUgcm9vdCBjb250YWluZXJcbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0RGF0YSA9IEBnZXRDbG9zZXN0U25pcHBldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0U25pcHBldERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0U25pcHBldFRhcmdldChjbG9zZXN0U25pcHBldERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldFJvb3RUYXJnZXQobm9kZSlcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG5cbiAgZ2V0U25pcHBldFRhcmdldDogKGVsZW0sIHsgdG9wLCBsZWZ0LCBwb3NpdGlvbiB9KSAtPlxuICAgIHRhcmdldDogJ3NuaXBwZXQnXG4gICAgc25pcHBldFZpZXc6IEBnZXRTbmlwcGV0VmlldyhlbGVtKVxuICAgIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBAZ2V0UG9zaXRpb25PblNuaXBwZXQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0OiAoY2xvc2VzdFNuaXBwZXREYXRhKSAtPlxuICAgIGVsZW0gPSBjbG9zZXN0U25pcHBldERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RTbmlwcGV0RGF0YS5wb3NpdGlvblxuICAgIEBnZXRTbmlwcGV0VGFyZ2V0KGVsZW0sIHsgcG9zaXRpb24gfSlcblxuXG4gIGdldENvbnRhaW5lclRhcmdldDogKG5vZGUpIC0+XG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcbiAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcblxuICAgIHRhcmdldDogJ2NvbnRhaW5lcidcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFZpZXc6IEBmaW5kU25pcHBldFZpZXcobm9kZSlcbiAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG5cblxuICBnZXRSb290VGFyZ2V0OiAobm9kZSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9ICQobm9kZSkuZGF0YSgnc25pcHBldFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgc25pcHBldFRyZWU6IHNuaXBwZXRUcmVlXG5cblxuICAjIEZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgYSBzbmlwcGV0XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PblNuaXBwZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgaWYgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgJ2JlZm9yZSdcbiAgICBlbHNlXG4gICAgICAnYWZ0ZXInXG5cblxuICAjIEdldCB0aGUgY2xvc2VzdCBzbmlwcGV0IGluIGEgY29udGFpbmVyIGZvciBhIHRvcCBsZWZ0IHBvc2l0aW9uXG4gIGdldENsb3Nlc3RTbmlwcGV0OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRzbmlwcGV0cyA9ICQoY29udGFpbmVyKS5maW5kKFwiLiN7IGNzcy5zbmlwcGV0IH1cIilcbiAgICBjbG9zZXN0ID0gdW5kZWZpbmVkXG4gICAgY2xvc2VzdFNuaXBwZXQgPSB1bmRlZmluZWRcblxuICAgICRzbmlwcGV0cy5lYWNoIChpbmRleCwgZWxlbSkgPT5cbiAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBjbG9zZXN0U25pcHBldCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYmVmb3JlJ31cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0U25pcHBldFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYSAtIGIgZWxzZSBiIC0gYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIHNuaXBwZXQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIFNuaXBwZXRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgIyBHZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCB3aXRoIHRvcCBhbmQgbGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnRcbiAgIyAoaWRlYWwgZm9yIGFic29sdXRlIHBvc2l0aW9uZWQgZWxlbWVudHMpXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAobm9kZSkgLT5cbiAgICB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICB7IHNjcm9sbFgsIHNjcm9sbFkgfSA9IEBnZXRTY3JvbGxQb3NpdGlvbih3aW4pXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiAgZ2V0U2Nyb2xsUG9zaXRpb246ICh3aW4pIC0+XG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYOiBpZiAod2luLnBhZ2VYT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVhPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWTogaWYgKHdpbi5wYWdlWU9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VZT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIHN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIHRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZCAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNvbmZpZy5jc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IC0+XG4gICAgQGRyYWdIYW5kbGVyLmRyb3AoKSBpZiBAc3RhcnRlZFxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nZHJhZ0Jsb2NrZXInPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKCcuZHJhZ0Jsb2NrZXInKS5yZW1vdmUoKVxuXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNvbmZpZy5jc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cXFwiPjxkaXY+PC9kaXY+PC9kaXY+XCIpXG4gICAgJGluZGljYXRvci5jc3MobGVmdDogcGFnZVgsIHRvcDogcGFnZVkpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRpbmRpY2F0b3IpXG5cblxuICByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3I6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjb25maWcuY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XCIpLnJlbW92ZSgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgaW5pdGlhbGl6ZWQgaW1tZWRpYXRlbHkgdG8gYWxsb3cgYSBsb25nLXByZXNzIGZpbmlzaFxuICBhZGRTdG9wTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgZXZlbnROYW1lcyA9XG4gICAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgICAndG91Y2hlbmQubGl2aW5nZG9jcy1kcmFnIHRvdWNoY2FuY2VsLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGxlYXZlLmxpdmluZ2RvY3MtZHJhZydcbiAgICAgIGVsc2VcbiAgICAgICAgJ21vdXNldXAubGl2aW5nZG9jcy1kcmFnJ1xuXG4gICAgQHBhZ2UuJGRvY3VtZW50Lm9uIGV2ZW50TmFtZXMsID0+XG4gICAgICBAZHJvcCgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIHNuaXBwZXREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIEVkaXRhYmxlSlMgQ29udHJvbGxlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW50ZWdyYXRlIEVkaXRhYmxlSlMgaW50byBMaXZpbmdkb2NzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlQ29udHJvbGxlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UpIC0+XG4gICAgIyBJbml0aWFsaXplIEVkaXRhYmxlSlNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGUod2luZG93OiBAcGFnZS53aW5kb3cpO1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG5cblxuICAjIFJlZ2lzdGVyIERPTSBub2RlcyB3aXRoIEVkaXRhYmxlSlMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IEVkaXRhYmxlSlNcbiAgI1xuICAjIEFsbCBsaXN0ZW5lcnMgcGFyYW1zIGdldCB0cmFuc2Zvcm1lZCBzbyB0aGV5IGdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWVcbiAgIyBpbnN0ZWFkIG9mIGVsZW1lbnQ6XG4gICNcbiAgIyBFeGFtcGxlOiBsaXN0ZW5lcih2aWV3LCBlZGl0YWJsZU5hbWUsIG90aGVyUGFyYW1zLi4uKVxuICB3aXRoQ29udGV4dDogKGZ1bmMpIC0+XG4gICAgKGVsZW1lbnQsIGFyZ3MuLi4pID0+XG4gICAgICB2aWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhlbGVtZW50KVxuICAgICAgZWRpdGFibGVOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoQGVkaXRhYmxlQXR0cilcbiAgICAgIGFyZ3MudW5zaGlmdCh2aWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB1cGRhdGVNb2RlbDogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2YWx1ZSA9IHZpZXcuZ2V0KGVkaXRhYmxlTmFtZSlcbiAgICBpZiBjb25maWcuc2luZ2xlTGluZUJyZWFrLnRlc3QodmFsdWUpIHx8IHZhbHVlID09ICcnXG4gICAgICB2YWx1ZSA9IHVuZGVmaW5lZFxuXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVCbHVycmVkKGVsZW1lbnQsIHZpZXcpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG5cbiAgICAgIHNuaXBwZXROYW1lID0gQHBhZ2UuZGVzaWduLnBhcmFncmFwaFNuaXBwZXRcbiAgICAgIHRlbXBsYXRlID0gQHBhZ2UuZGVzaWduLmdldChzbmlwcGV0TmFtZSlcbiAgICAgIGNvcHkgPSB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3Vmlld1xuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIG1lcmdlOiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcbiAgICAgIG1lcmdlZFZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiB2aWV3LnByZXYoKSBlbHNlIHZpZXcubmV4dCgpXG5cbiAgICAgIGlmIG1lcmdlZFZpZXcgJiYgbWVyZ2VkVmlldy50ZW1wbGF0ZSA9PSB2aWV3LnRlbXBsYXRlXG5cbiAgICAgICAgIyBjcmVhdGUgZG9jdW1lbnQgZnJhZ21lbnRcbiAgICAgICAgY29udGVudHMgPSB2aWV3LmRpcmVjdGl2ZXMuJGdldEVsZW0oZWRpdGFibGVOYW1lKS5jb250ZW50cygpXG4gICAgICAgIGZyYWcgPSBAcGFnZS5kb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcbiAgICAgICAgZm9yIGVsIGluIGNvbnRlbnRzXG4gICAgICAgICAgZnJhZy5hcHBlbmRDaGlsZChlbClcblxuICAgICAgICBtZXJnZWRWaWV3LmZvY3VzKClcbiAgICAgICAgZWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIGN1cnNvciA9IEBlZGl0YWJsZS5jcmVhdGVDdXJzb3IoZWxlbSwgaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gJ2VuZCcgZWxzZSAnYmVnaW5uaW5nJylcbiAgICAgICAgY3Vyc29yWyBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnaW5zZXJ0QWZ0ZXInIGVsc2UgJ2luc2VydEJlZm9yZScgXShmcmFnKVxuXG4gICAgICAgICMgTWFrZSBzdXJlIHRoZSBtb2RlbCBvZiB0aGUgbWVyZ2VkVmlldyBpcyB1cCB0byBkYXRlXG4gICAgICAgICMgb3RoZXJ3aXNlIGJ1Z3MgbGlrZSBpbiBpc3N1ZSAjNTYgY2FuIG9jY3VyLlxuICAgICAgICBjdXJzb3Iuc2F2ZSgpXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICAgIGN1cnNvci5yZXN0b3JlKClcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRTZWxlY3Rpb24oKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIHNwbGl0OiAodmlldywgZWRpdGFibGVOYW1lLCBiZWZvcmUsIGFmdGVyLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cbiAgICAgICMgZ2V0IGNvbnRlbnQgb3V0IG9mICdiZWZvcmUnIGFuZCAnYWZ0ZXInXG4gICAgICBiZWZvcmVDb250ZW50ID0gYmVmb3JlLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcbiAgICAgIGFmdGVyQ29udGVudCA9IGFmdGVyLnF1ZXJ5U2VsZWN0b3IoJyonKS5pbm5lckhUTUxcblxuICAgICAgIyBzZXQgZWRpdGFibGUgb2Ygc25pcHBldHMgdG8gaW5uZXJIVE1MIG9mIGZyYWdtZW50c1xuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBiZWZvcmVDb250ZW50KVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBhZnRlckNvbnRlbnQpXG5cbiAgICAgICMgYXBwZW5kIGFuZCBmb2N1cyBjb3B5IG9mIHNuaXBwZXRcbiAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgIHZpZXcubmV4dCgpLmZvY3VzKClcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZUpTIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBEb2N1bWVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBNYW5hZ2UgdGhlIHNuaXBwZXQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAc25pcHBldFZpZXcgPSB1bmRlZmluZWRcblxuICAgIEBzbmlwcGV0Rm9jdXMgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChzbmlwcGV0VmlldywgZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIGVkaXRhYmxlTm9kZSAhPSBAZWRpdGFibGVOb2RlXG4gICAgICBAcmVzZXRFZGl0YWJsZSgpXG4gICAgICBAZWRpdGFibGVOb2RlID0gZWRpdGFibGVOb2RlXG5cbiAgICBpZiBzbmlwcGV0VmlldyAhPSBAc25pcHBldFZpZXdcbiAgICAgIEByZXNldFNuaXBwZXRWaWV3KClcbiAgICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0VmlldyA9IHNuaXBwZXRWaWV3XG4gICAgICAgIEBzbmlwcGV0Rm9jdXMuZmlyZShAc25pcHBldFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlICE9IGVkaXRhYmxlTm9kZVxuICAgICAgc25pcHBldFZpZXcgfHw9IGRvbS5maW5kU25pcHBldFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVCbHVycmVkOiAoZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgPT0gZWRpdGFibGVOb2RlXG4gICAgICBAc2V0Rm9jdXMoQHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICAjIGNhbGwgYWZ0ZXIgY2xpY2tcbiAgc25pcHBldEZvY3VzZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBAc25pcHBldFZpZXcgIT0gc25pcHBldFZpZXdcbiAgICAgIEBzZXRGb2N1cyhzbmlwcGV0VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgYmx1cjogLT5cbiAgICBAc2V0Rm9jdXModW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRFZGl0YWJsZTogLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlXG4gICAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldFNuaXBwZXRWaWV3OiAtPlxuICAgIGlmIEBzbmlwcGV0Vmlld1xuICAgICAgcHJldmlvdXMgPSBAc25pcHBldFZpZXdcbiAgICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuICAgICAgQHNuaXBwZXRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuaXNTdXBwb3J0ZWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBzbmlwcGV0Vmlldy4kaHRtbCBpZiBzbmlwcGV0Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZCgnLmRyYWdCbG9ja2VyJylcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBzbmlwcGV0XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5zbmlwcGV0Vmlldz8ubW9kZWwgIT0gQHNuaXBwZXRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5zbmlwcGV0VmlldylcbiAgICAgICMgICAkY29udGFpbmVyID0gdGFyZ2V0LnNuaXBwZXRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBAc25pcHBldFBvc2l0aW9uKHRhcmdldClcbiAgICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG5cblxuICBzbmlwcGV0UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuc25pcHBldFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBzbmlwcGV0TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYWZ0ZXInXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKGJlZm9yZSwgdGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5zbmlwcGV0Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdiZWZvcmUnXG4gICAgICAgICAgcmV0dXJuIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzKHRhcmdldC5zbmlwcGV0VmlldywgbmV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyKHRhcmdldC5zbmlwcGV0Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5TbmlwcGV0czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0XG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlcjogKHsgbGVmdCwgdG9wLCB3aWR0aCB9KSAtPlxuICAgIGlmIEBpZnJhbWVCb3g/XG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBpZnJhbWUgdmlld3BvcnRcbiAgICAgICRib2R5ID0gJChAaWZyYW1lQm94LndpbmRvdy5kb2N1bWVudC5ib2R5KVxuICAgICAgdG9wIC09ICRib2R5LnNjcm9sbFRvcCgpXG4gICAgICBsZWZ0IC09ICRib2R5LnNjcm9sbExlZnQoKVxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICBsZWZ0ICs9IEBpZnJhbWVCb3gubGVmdFxuICAgICAgdG9wICs9IEBpZnJhbWVCb3gudG9wXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGRvY3VtZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZylcbiAgICAgICMgdG9wICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wKClcbiAgICAgICMgbGVmdCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnQoKVxuXG4gICAgICAjIFdpdGggcG9zaXRpb24gZml4ZWQgd2UgZG9uJ3QgbmVlZCB0byB0YWtlIHNjcm9sbGluZyBpbnRvIGFjY291bnRcbiAgICAgICMgaW4gYW4gaWZyYW1lIHNjZW5hcmlvXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnZml4ZWQnKVxuICAgIGVsc2VcbiAgICAgICMgSWYgd2UncmUgbm90IGluIGFuIGlmcmFtZSBsZWZ0IGFuZCB0b3AgYXJlIGFscmVhZHlcbiAgICAgICMgdGhlIGFic29sdXRlIGNvb3JkaW5hdGVzXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnYWJzb2x1dGUnKVxuXG4gICAgQCRkcm9wTWFya2VyXG4gICAgLmNzc1xuICAgICAgbGVmdDogIFwiI3sgbGVmdCB9cHhcIlxuICAgICAgdG9wOiAgIFwiI3sgdG9wIH1weFwiXG4gICAgICB3aWR0aDogXCIjeyB3aWR0aCB9cHhcIlxuICAgIC5zaG93KClcblxuXG4gIG1ha2VTcGFjZTogKG5vZGUsIHBvc2l0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgd2lnZ2xlU3BhY2UgJiYgbm9kZT9cbiAgICAkbm9kZSA9ICQobm9kZSlcbiAgICBAbGFzdFRyYW5zZm9ybSA9ICRub2RlXG5cbiAgICBpZiBwb3NpdGlvbiA9PSAndG9wJ1xuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuICAgIGVsc2VcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC0jeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG5cblxuICB1bmRvTWFrZVNwYWNlOiAobm9kZSkgLT5cbiAgICBpZiBAbGFzdFRyYW5zZm9ybT9cbiAgICAgIEBsYXN0VHJhbnNmb3JtLmNzcyh0cmFuc2Zvcm06ICcnKVxuICAgICAgQGxhc3RUcmFuc2Zvcm0gPSB1bmRlZmluZWRcblxuXG4gIGhpZ2hsaWdoQ29udGFpbmVyOiAoJGNvbnRhaW5lcikgLT5cbiAgICBpZiAkY29udGFpbmVyWzBdICE9IEAkaGlnaGxpZ2h0ZWRDb250YWluZXJbMF1cbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0gJGNvbnRhaW5lclxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5hZGRDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcblxuXG4gIHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodDogLT5cbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBwYWdlWCwgcGFnZVk6IGFic29sdXRlIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50KVxuICAjIGNsaWVudFgsIGNsaWVudFk6IGZpeGVkIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0KVxuICBnZXRFbGVtVW5kZXJDdXJzb3I6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIGVsZW0gPSB1bmRlZmluZWRcbiAgICBAdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQgPT5cbiAgICAgIHsgY2xpZW50WCwgY2xpZW50WSB9ID0gZXZlbnRQb3NpdGlvblxuICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcbiAgICAgIGlmIGVsZW0/Lm5vZGVOYW1lID09ICdJRlJBTUUnXG4gICAgICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGZpbmRFbGVtSW5JZnJhbWUoZWxlbSwgZXZlbnRQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgQGlmcmFtZUJveCA9IHVuZGVmaW5lZFxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gIGZpbmRFbGVtSW5JZnJhbWU6IChpZnJhbWVFbGVtLCBldmVudFBvc2l0aW9uKSAtPlxuICAgIEBpZnJhbWVCb3ggPSBib3ggPSBpZnJhbWVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgQGlmcmFtZUJveC53aW5kb3cgPSBpZnJhbWVFbGVtLmNvbnRlbnRXaW5kb3dcbiAgICBkb2N1bWVudCA9IGlmcmFtZUVsZW0uY29udGVudERvY3VtZW50XG4gICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG5cbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFggLT0gYm94LmxlZnRcbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFkgLT0gYm94LnRvcFxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVggPSBldmVudFBvc2l0aW9uLmNsaWVudFggKyAkYm9keS5zY3JvbGxMZWZ0KClcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VZID0gZXZlbnRQb3NpdGlvbi5jbGllbnRZICsgJGJvZHkuc2Nyb2xsVG9wKClcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudFBvc2l0aW9uLmNsaWVudFgsIGV2ZW50UG9zaXRpb24uY2xpZW50WSlcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICAjIFJlbW92ZSBlbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yIHdoaWNoIGNvdWxkIGludGVyZmVyZVxuICAjIHdpdGggZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCgpXG4gIHVuYmxvY2tFbGVtZW50RnJvbVBvaW50OiAoY2FsbGJhY2spIC0+XG5cbiAgICAjIFBvaW50ZXIgRXZlbnRzIGFyZSBhIGxvdCBmYXN0ZXIgc2luY2UgdGhlIGJyb3dzZXIgZG9lcyBub3QgbmVlZFxuICAgICMgdG8gcmVwYWludCB0aGUgd2hvbGUgc2NyZWVuLiBJRSA5IGFuZCAxMCBkbyBub3Qgc3VwcG9ydCB0aGVtLlxuICAgIGlmIGlzU3VwcG9ydGVkKCdodG1sUG9pbnRlckV2ZW50cycpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnYXV0bycpXG4gICAgZWxzZVxuICAgICAgQCRkcmFnQmxvY2tlci5oaWRlKClcbiAgICAgIEAkcGxhY2Vob2xkZXIuaGlkZSgpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLnNob3coKVxuICAgICAgQCRwbGFjZWhvbGRlci5zaG93KClcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLnNuaXBwZXRXYXNEcm9wcGVkLmZpcmUoQHNuaXBwZXRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIHNuaXBwZXQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdzbmlwcGV0J1xuICAgICAgICBzbmlwcGV0VmlldyA9IHRhcmdldC5zbmlwcGV0Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBzbmlwcGV0Vmlldy5tb2RlbC5iZWZvcmUoQHNuaXBwZXRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmFmdGVyKEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHRhcmdldC5zbmlwcGV0Vmlldy5tb2RlbFxuICAgICAgICBzbmlwcGV0TW9kZWwuYXBwZW5kKHRhcmdldC5jb250YWluZXJOYW1lLCBAc25pcHBldE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgc25pcHBldFRyZWUgPSB0YXJnZXQuc25pcHBldFRyZWVcbiAgICAgICAgc25pcHBldFRyZWUucHJlcGVuZChAc25pcHBldE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwiIyBDYW4gcmVwbGFjZSB4bWxkb20gaW4gdGhlIGJyb3dzZXIuXG4jIE1vcmUgYWJvdXQgeG1sZG9tOiBodHRwczovL2dpdGh1Yi5jb20vamluZHcveG1sZG9tXG4jXG4jIE9uIG5vZGUgeG1sZG9tIGlzIHJlcXVpcmVkLiBJbiB0aGUgYnJvd3NlclxuIyBET01QYXJzZXIgYW5kIFhNTFNlcmlhbGl6ZXIgYXJlIGFscmVhZHkgbmF0aXZlIG9iamVjdHMuXG5cbiMgRE9NUGFyc2VyXG5leHBvcnRzLkRPTVBhcnNlciA9IGNsYXNzIERPTVBhcnNlclNoaW1cblxuICBwYXJzZUZyb21TdHJpbmc6ICh4bWxUZW1wbGF0ZSkgLT5cbiAgICAjIG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoeG1sVGVtcGxhdGUpIGRvZXMgbm90IHdvcmsgdGhlIHNhbWVcbiAgICAjIGluIHRoZSBicm93c2VyIGFzIHdpdGggeG1sZG9tLiBTbyB3ZSB1c2UgalF1ZXJ5IHRvIG1ha2UgdGhpbmdzIHdvcmsuXG4gICAgJC5wYXJzZVhNTCh4bWxUZW1wbGF0ZSlcblxuXG4jIFhNTFNlcmlhbGl6ZXJcbmV4cG9ydHMuWE1MU2VyaWFsaXplciA9IFhNTFNlcmlhbGl6ZXJcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaHRtbFBvaW50ZXJFdmVudHM6IC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gnKVxuICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJ1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPT0gJ2F1dG8nXG4iLCJkZXRlY3RzID0gcmVxdWlyZSgnLi9mZWF0dXJlX2RldGVjdHMnKVxuXG5leGVjdXRlZFRlc3RzID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSAobmFtZSkgLT5cbiAgaWYgKHJlc3VsdCA9IGV4ZWN1dGVkVGVzdHNbbmFtZV0pID09IHVuZGVmaW5lZFxuICAgIGV4ZWN1dGVkVGVzdHNbbmFtZV0gPSBCb29sZWFuKGRldGVjdHNbbmFtZV0oKSlcbiAgZWxzZVxuICAgIHJlc3VsdFxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgc25pcHBldHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJsb2cgPSByZXF1aXJlKCcuL2xvZycpXG5cbiMgRnVuY3Rpb24gdG8gYXNzZXJ0IGEgY29uZGl0aW9uLiBJZiB0aGUgY29uZGl0aW9uIGlzIG5vdCBtZXQsIGFuIGVycm9yIGlzXG4jIHJhaXNlZCB3aXRoIHRoZSBzcGVjaWZpZWQgbWVzc2FnZS5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBhc3NlcnQgYSBpc250IGIsICdhIGNhbiBub3QgYmUgYidcbiNcbm1vZHVsZS5leHBvcnRzID0gYXNzZXJ0ID0gKGNvbmRpdGlvbiwgbWVzc2FnZSkgLT5cbiAgbG9nLmVycm9yKG1lc3NhZ2UpIHVubGVzcyBjb25kaXRpb25cbiIsIlxuIyBMb2cgSGVscGVyXG4jIC0tLS0tLS0tLS1cbiMgRGVmYXVsdCBsb2dnaW5nIGhlbHBlclxuIyBAcGFyYW1zOiBwYXNzIGBcInRyYWNlXCJgIGFzIGxhc3QgcGFyYW1ldGVyIHRvIG91dHB1dCB0aGUgY2FsbCBzdGFja1xubW9kdWxlLmV4cG9ydHMgPSBsb2cgPSAoYXJncy4uLikgLT5cbiAgaWYgd2luZG93LmNvbnNvbGU/XG4gICAgaWYgYXJncy5sZW5ndGggYW5kIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAndHJhY2UnXG4gICAgICBhcmdzLnBvcCgpXG4gICAgICB3aW5kb3cuY29uc29sZS50cmFjZSgpIGlmIHdpbmRvdy5jb25zb2xlLnRyYWNlP1xuXG4gICAgd2luZG93LmNvbnNvbGUubG9nLmFwcGx5KHdpbmRvdy5jb25zb2xlLCBhcmdzKVxuICAgIHVuZGVmaW5lZFxuXG5cbmRvIC0+XG5cbiAgIyBDdXN0b20gZXJyb3IgdHlwZSBmb3IgbGl2aW5nZG9jcy5cbiAgIyBXZSBjYW4gdXNlIHRoaXMgdG8gdHJhY2sgdGhlIG9yaWdpbiBvZiBhbiBleHBlY3Rpb24gaW4gdW5pdCB0ZXN0cy5cbiAgY2xhc3MgTGl2aW5nZG9jc0Vycm9yIGV4dGVuZHMgRXJyb3JcblxuICAgIGNvbnN0cnVjdG9yOiAobWVzc2FnZSkgLT5cbiAgICAgIHN1cGVyXG4gICAgICBAbWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgIEB0aHJvd25CeUxpdmluZ2RvY3MgPSB0cnVlXG5cblxuICAjIEBwYXJhbSBsZXZlbDogb25lIG9mIHRoZXNlIHN0cmluZ3M6XG4gICMgJ2NyaXRpY2FsJywgJ2Vycm9yJywgJ3dhcm5pbmcnLCAnaW5mbycsICdkZWJ1ZydcbiAgbm90aWZ5ID0gKG1lc3NhZ2UsIGxldmVsID0gJ2Vycm9yJykgLT5cbiAgICBpZiBfcm9sbGJhcj9cbiAgICAgIF9yb2xsYmFyLnB1c2ggbmV3IEVycm9yKG1lc3NhZ2UpLCAtPlxuICAgICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKSBhbmQgd2luZG93LmNvbnNvbGU/LmVycm9yP1xuICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmVycm9yLmNhbGwod2luZG93LmNvbnNvbGUsIG1lc3NhZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG4gICAgZWxzZVxuICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJylcbiAgICAgICAgdGhyb3cgbmV3IExpdmluZ2RvY3NFcnJvcihtZXNzYWdlKVxuICAgICAgZWxzZVxuICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG5cbiAgICB1bmRlZmluZWRcblxuXG4gIGxvZy5kZWJ1ZyA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZGVidWcnKSB1bmxlc3MgbG9nLmRlYnVnRGlzYWJsZWRcblxuXG4gIGxvZy53YXJuID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICd3YXJuaW5nJykgdW5sZXNzIGxvZy53YXJuaW5nc0Rpc2FibGVkXG5cblxuICAjIExvZyBlcnJvciBhbmQgdGhyb3cgZXhjZXB0aW9uXG4gIGxvZy5lcnJvciA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZXJyb3InKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBUaGlzIGNsYXNzIGNhbiBiZSB1c2VkIHRvIHdhaXQgZm9yIHRhc2tzIHRvIGZpbmlzaCBiZWZvcmUgZmlyaW5nIGEgc2VyaWVzIG9mXG4jIGNhbGxiYWNrcy4gT25jZSBzdGFydCgpIGlzIGNhbGxlZCwgdGhlIGNhbGxiYWNrcyBmaXJlIGFzIHNvb24gYXMgdGhlIGNvdW50XG4jIHJlYWNoZXMgMC4gVGh1cywgeW91IHNob3VsZCBpbmNyZW1lbnQgdGhlIGNvdW50IGJlZm9yZSBzdGFydGluZyBpdC4gV2hlblxuIyBhZGRpbmcgYSBjYWxsYmFjayBhZnRlciBoYXZpbmcgZmlyZWQgY2F1c2VzIHRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgcmlnaHRcbiMgYXdheS4gSW5jcmVtZW50aW5nIHRoZSBjb3VudCBhZnRlciBpdCBmaXJlZCByZXN1bHRzIGluIGFuIGVycm9yLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuI1xuIyAgIHNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuIyAgIGRvU29tZXRoaW5nKCkudGhlbihzZW1hcGhvcmUuZGVjcmVtZW50KCkpXG4jXG4jICAgZG9Bbm90aGVyVGhpbmdUaGF0VGFrZXNBQ2FsbGJhY2soc2VtYXBob3JlLndhaXQoKSlcbiNcbiMgICBzZW1hcGhvcmUuc3RhcnQoKVxuI1xuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgnaGVsbG8nKSlcbiNcbiMgICAjIE9uY2UgY291bnQgcmVhY2hlcyAwIGNhbGxiYWNrIGlzIGV4ZWN1dGVkOlxuIyAgICMgPT4gJ2hlbGxvJ1xuI1xuIyAgICMgQXNzdW1pbmcgdGhhdCBzZW1hcGhvcmUgd2FzIGFscmVhZHkgZmlyZWQ6XG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknKSlcbiMgICAjID0+ICd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlbWFwaG9yZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb3VudCA9IDBcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgQHdhc0ZpcmVkID0gZmFsc2VcbiAgICBAY2FsbGJhY2tzID0gW11cblxuXG4gIGFkZENhbGxiYWNrOiAoY2FsbGJhY2spIC0+XG4gICAgaWYgQHdhc0ZpcmVkXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgQGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAd2FzRmlyZWRcblxuXG4gIHN0YXJ0OiAtPlxuICAgIGFzc2VydCBub3QgQHN0YXJ0ZWQsXG4gICAgICBcIlVuYWJsZSB0byBzdGFydCBTZW1hcGhvcmUgb25jZSBzdGFydGVkLlwiXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIGluY3JlbWVudDogLT5cbiAgICBhc3NlcnQgbm90IEB3YXNGaXJlZCxcbiAgICAgIFwiVW5hYmxlIHRvIGluY3JlbWVudCBjb3VudCBvbmNlIFNlbWFwaG9yZSBpcyBmaXJlZC5cIlxuICAgIEBjb3VudCArPSAxXG5cblxuICBkZWNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IEBjb3VudCA+IDAsXG4gICAgICBcIlVuYWJsZSB0byBkZWNyZW1lbnQgY291bnQgcmVzdWx0aW5nIGluIG5lZ2F0aXZlIGNvdW50LlwiXG4gICAgQGNvdW50IC09IDFcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgd2FpdDogLT5cbiAgICBAaW5jcmVtZW50KClcbiAgICA9PiBAZGVjcmVtZW50KClcblxuXG4gICMgQHByaXZhdGVcbiAgZmlyZUlmUmVhZHk6IC0+XG4gICAgaWYgQGNvdW50ID09IDAgJiYgQHN0YXJ0ZWQgPT0gdHJ1ZVxuICAgICAgQHdhc0ZpcmVkID0gdHJ1ZVxuICAgICAgY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gQGNhbGxiYWNrc1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlzRW1wdHk6IChvYmopIC0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIG9iaj9cbiAgICBmb3IgbmFtZSBvZiBvYmpcbiAgICAgIHJldHVybiBmYWxzZSBpZiBvYmouaGFzT3duUHJvcGVydHkobmFtZSlcblxuICAgIHRydWVcblxuXG4gIGZsYXRDb3B5OiAob2JqKSAtPlxuICAgIGNvcHkgPSB1bmRlZmluZWRcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBvYmpcbiAgICAgIGNvcHkgfHw9IHt9XG4gICAgICBjb3B5W25hbWVdID0gdmFsdWVcblxuICAgIGNvcHlcbiIsIiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cbiAgY2FtZWxpemU6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgICAgIGMudG9VcHBlckNhc2UoKVxuICAgIClcblxuICB0cmltOiAoc3RyKSAtPlxuICAgIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblxuXG4gICMgY2FtZWxpemU6IChzdHIpIC0+XG4gICMgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAjICAgICBjLnRvVXBwZXJDYXNlKClcblxuICAjIGNsYXNzaWZ5OiAoc3RyKSAtPlxuICAjICAgJC50aXRsZWl6ZShTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXFxXX10vZywgJyAnKSkucmVwbGFjZSgvXFxzL2csICcnKVxuXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBlbXB0eVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICAjIEVzY2FwZSB0aGUgVVJJIGluIGNhc2UgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgJygnIG9yICcpJyBhcmUgcHJlc2VudC5cbiAgIyBUaGUgZXNjYXBpbmcgb25seSBoYXBwZW5zIGlmIGl0IGlzIG5lZWRlZCBzaW5jZSB0aGlzIGRvZXMgbm90IHdvcmsgaW4gbm9kZS5cbiAgIyBXaGVuIHRoZSBVUkkgaXMgZXNjYXBlZCBpbiBub2RlIHRoZSBiYWNrZ3JvdW5kLWltYWdlIGlzIG5vdCB3cml0dGVuIHRvIHRoZVxuICAjIHN0eWxlIGF0dHJpYnV0ZS5cbiAgZXNjYXBlQ3NzVXJpOiAodXJpKSAtPlxuICAgIGlmIC9bKCldLy50ZXN0KHVyaSlcbiAgICAgIFwiJyN7IHVyaSB9J1wiXG4gICAgZWxzZVxuICAgICAgdXJpXG5cblxuICBpc0Jhc2U2NDogKHZhbHVlKSAtPlxuICAgIHZhbHVlLmluZGV4T2YoJ2RhdGE6aW1hZ2UnKSA9PSAwXG5cblxuICBpc0ltZ1RhZzogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2ltZydcbiIsIkRlZmF1bHRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2VfbWFuYWdlcicpXG5SZXNyY2l0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9yZXNyY2l0X2ltYWdlX21hbmFnZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVmYXVsdEltYWdlTWFuYWdlciA9IG5ldyBEZWZhdWx0SW1hZ2VNYW5hZ2VyKClcbiAgcmVzcmNpdEltYWdlTWFuYWdlciA9IG5ldyBSZXNyY2l0SW1hZ2VNYW5hZ2VyKClcblxuXG4gIHNldDogKCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKSAtPlxuICAgIGltYWdlTWFuYWdlciA9IEBfZ2V0SW1hZ2VNYW5hZ2VyKGltYWdlU2VydmljZSlcbiAgICBpbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSlcblxuXG4gIF9nZXRJbWFnZU1hbmFnZXI6IChpbWFnZVNlcnZpY2UpIC0+XG4gICAgc3dpdGNoIGltYWdlU2VydmljZVxuICAgICAgd2hlbiAncmVzcmMuaXQnIHRoZW4gcmVzcmNpdEltYWdlTWFuYWdlclxuICAgICAgZWxzZVxuICAgICAgICBkZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cblxuICBnZXREZWZhdWx0SW1hZ2VNYW5hZ2VyOiAtPlxuICAgIGRlZmF1bHRJbWFnZU1hbmFnZXJcblxuXG4gIGdldFJlc3JjaXRJbWFnZU1hbmFnZXI6IC0+XG4gICAgcmVzcmNpdEltYWdlTWFuYWdlclxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IEBzbmlwcGV0VHJlZSwgQHJlbmRlcmluZ0NvbnRhaW5lciwgJHdyYXBwZXIgfSkgLT5cbiAgICBhc3NlcnQgQHNuaXBwZXRUcmVlLCAnbm8gc25pcHBldCB0cmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQHNuaXBwZXRWaWV3cyA9IHt9XG5cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAcmVuZGVyT25jZVBhZ2VSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIHNuaXBwZXRUcmVlIGluIHRoZSAkcm9vdCBub2RlLlxuICAgICMgU29tZSBkb20uY29mZmVlIG1ldGhvZHMgbmVlZCBpdCB0byBnZXQgaG9sZCBvZiB0aGUgc25pcHBldCB0cmVlXG4gICAgQCRyb290LmRhdGEoJ3NuaXBwZXRUcmVlJywgQHNuaXBwZXRUcmVlKVxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBTbmlwcGV0IFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cFNuaXBwZXRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0QWRkZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0QWRkZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldFJlbW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0TW92ZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0TW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAc25pcHBldENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgc25pcHBldEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVTbmlwcGV0KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRTbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAaW5zZXJ0U25pcHBldChtb2RlbClcblxuXG4gIHNuaXBwZXRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgc25pcHBldEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgc25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAc25pcHBldFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0U25pcHBldDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwpXG5cbiAgICBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNTbmlwcGV0QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignU25pcHBldCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIHNuaXBwZXRWaWV3ID0gQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbClcbiAgICBzbmlwcGV0Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5zbmlwcGV0Vmlld1dhc0luc2VydGVkKHNuaXBwZXRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZFNuaXBwZXRzKG1vZGVsKVxuXG5cbiAgaXNTbmlwcGV0QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkU25pcHBldHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNTbmlwcGV0QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydFNuaXBwZXQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydFNuaXBwZXRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yU25pcHBldChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvclNuaXBwZXQobW9kZWwpKVxuXG5cbiAgYXBwZW5kU25pcHBldFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvclNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQoY29udGFpbmVyLnBhcmVudFNuaXBwZXQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJEZWZhdWx0SW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX21hbmFnZXInKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzY3JpdEltYWdlTWFuYWdlciBleHRlbmRzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBAcmVzcmNpdFVybDogJ2h0dHA6Ly90cmlhbC5yZXNyYy5pdC8nXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIEBzZXRCYXNlNjQoJGVsZW0sIHZhbHVlKSBpZiBAaXNCYXNlNjQodmFsdWUpXG5cbiAgICBhc3NlcnQgdmFsdWU/ICYmIHZhbHVlICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgQHJlc2V0U3JjQXR0cmlidXRlKCRlbGVtKSBpZiAkZWxlbS5hdHRyKCdzcmMnKSAmJiBAaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgICAkZWxlbS5hdHRyKCdkYXRhLXNyYycsIFwiI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3t2YWx1ZX1cIilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgje1Jlc2NyaXRJbWFnZU1hbmFnZXIucmVzcmNpdFVybH0jeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBTZXQgc3JjIGRpcmVjdGx5LCBkb24ndCBhZGQgcmVzcmMgY2xhc3NcbiAgc2V0QmFzZTY0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgICRlbGVtLmF0dHIoJ3NyYycsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIFwidXJsKCN7IEBlc2NhcGVDc3NVcmkodmFsdWUpIH0pXCIpXG5cblxuICByZXNldFNyY0F0dHJpYnV0ZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcbmF0dHIgPSBjb25maWcuYXR0clxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfaXRlcmF0b3InKVxuZXZlbnRpbmcgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2V2ZW50aW5nJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5JbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL2ltYWdlX21hbmFnZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRWaWV3XG5cbiAgY29uc3RydWN0b3I6ICh7IEBtb2RlbCwgQCRodG1sLCBAZGlyZWN0aXZlcywgQGlzUmVhZE9ubHkgfSkgLT5cbiAgICBAJGVsZW0gPSBAJGh0bWxcbiAgICBAdGVtcGxhdGUgPSBAbW9kZWwudGVtcGxhdGVcbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gZmFsc2VcbiAgICBAd2FzQXR0YWNoZWRUb0RvbSA9ICQuQ2FsbGJhY2tzKCk7XG5cbiAgICB1bmxlc3MgQGlzUmVhZE9ubHlcbiAgICAgICMgYWRkIGF0dHJpYnV0ZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIGh0bWxcbiAgICAgIEAkaHRtbFxuICAgICAgICAuZGF0YSgnc25pcHBldCcsIHRoaXMpXG4gICAgICAgIC5hZGRDbGFzcyhjc3Muc25pcHBldClcbiAgICAgICAgLmF0dHIoYXR0ci50ZW1wbGF0ZSwgQHRlbXBsYXRlLmlkZW50aWZpZXIpXG5cbiAgICBAcmVuZGVyKClcblxuXG4gIHJlbmRlcjogKG1vZGUpIC0+XG4gICAgQHVwZGF0ZUNvbnRlbnQoKVxuICAgIEB1cGRhdGVIdG1sKClcblxuXG4gIHVwZGF0ZUNvbnRlbnQ6IC0+XG4gICAgQGNvbnRlbnQoQG1vZGVsLmNvbnRlbnQsIEBtb2RlbC50ZW1wb3JhcnlDb250ZW50KVxuXG4gICAgaWYgbm90IEBoYXNGb2N1cygpXG4gICAgICBAZGlzcGxheU9wdGlvbmFscygpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICB1cGRhdGVIdG1sOiAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBAbW9kZWwuc3R5bGVzXG4gICAgICBAc3R5bGUobmFtZSwgdmFsdWUpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICBkaXNwbGF5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICAkZWxlbSA9ICQoZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIGlmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICcnKVxuXG5cbiAgIyBTaG93IGFsbCBkb2Mtb3B0aW9uYWxzIHdoZXRoZXIgdGhleSBhcmUgZW1wdHkgb3Igbm90LlxuICAjIFVzZSBvbiBmb2N1cy5cbiAgc2hvd09wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLnNob3coJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICAjIEhpZGUgYWxsIGVtcHR5IGRvYy1vcHRpb25hbHNcbiAgIyBVc2Ugb24gYmx1ci5cbiAgaGlkZUVtcHR5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbCAmJiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLmhpZGUoJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICBuZXh0OiAtPlxuICAgIEAkaHRtbC5uZXh0KCkuZGF0YSgnc25pcHBldCcpXG5cblxuICBwcmV2OiAtPlxuICAgIEAkaHRtbC5wcmV2KCkuZGF0YSgnc25pcHBldCcpXG5cblxuICBhZnRlckZvY3VzZWQ6ICgpIC0+XG4gICAgQCRodG1sLmFkZENsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBzaG93T3B0aW9uYWxzKClcblxuXG4gIGFmdGVyQmx1cnJlZDogKCkgLT5cbiAgICBAJGh0bWwucmVtb3ZlQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG4gICAgQGhpZGVFbXB0eU9wdGlvbmFscygpXG5cblxuICAjIEBwYXJhbSBjdXJzb3I6IHVuZGVmaW5lZCwgJ3N0YXJ0JywgJ2VuZCdcbiAgZm9jdXM6IChjdXJzb3IpIC0+XG4gICAgZmlyc3QgPSBAZGlyZWN0aXZlcy5lZGl0YWJsZT9bMF0uZWxlbVxuICAgICQoZmlyc3QpLmZvY3VzKClcblxuXG4gIGhhc0ZvY3VzOiAtPlxuICAgIEAkaHRtbC5oYXNDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAJGh0bWxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAJGh0bWxbMF0pXG5cblxuICBjb250ZW50OiAoY29udGVudCwgc2Vzc2lvbkNvbnRlbnQpIC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbnRlbnRcbiAgICAgIGlmIHNlc3Npb25Db250ZW50W25hbWVdP1xuICAgICAgICBAc2V0KG5hbWUsIHNlc3Npb25Db250ZW50W25hbWVdKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0KG5hbWUsIHZhbHVlKVxuXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAc2V0RWRpdGFibGUobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAc2V0SW1hZ2UobmFtZSwgdmFsdWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBzZXRIdG1sKG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBnZXRFZGl0YWJsZShuYW1lKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQGdldEltYWdlKG5hbWUpXG4gICAgICB3aGVuICdodG1sJyB0aGVuIEBnZXRIdG1sKG5hbWUpXG5cblxuICBnZXRFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwoKVxuXG5cbiAgc2V0RWRpdGFibGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgaWYgdmFsdWVcbiAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuICAgIGVsc2VcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyKVxuXG4gICAgJGVsZW0uYXR0cihhdHRyLnBsYWNlaG9sZGVyLCBAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICAgIEltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLmVtcHR5SW1hZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0UGxhY2Vob2xkZXIgPSAkLnByb3h5KEBzZXRQbGFjZWhvbGRlckltYWdlLCB0aGlzLCAkZWxlbSlcbiAgICAgIEBkZWxheVVudGlsQXR0YWNoZWQobmFtZSwgc2V0UGxhY2Vob2xkZXIpXG5cblxuICBzZXRQbGFjZWhvbGRlckltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGlmICRlbGVtWzBdLm5vZGVOYW1lID09ICdJTUcnXG4gICAgICB3aWR0aCA9ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGggPSAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICB2YWx1ZSA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8je3dpZHRofXgje2hlaWdodH0vQkVGNTZGL0IyRTY2OFwiXG4gICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpW25hbWVdIGlmIEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVxuICAgIEltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpXG5cblxuICBzdHlsZTogKG5hbWUsIGNsYXNzTmFtZSkgLT5cbiAgICBjaGFuZ2VzID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXS5jc3NDbGFzc0NoYW5nZXMoY2xhc3NOYW1lKVxuICAgIGlmIGNoYW5nZXMucmVtb3ZlXG4gICAgICBmb3IgcmVtb3ZlQ2xhc3MgaW4gY2hhbmdlcy5yZW1vdmVcbiAgICAgICAgQCRodG1sLnJlbW92ZUNsYXNzKHJlbW92ZUNsYXNzKVxuXG4gICAgQCRodG1sLmFkZENsYXNzKGNoYW5nZXMuYWRkKVxuXG5cbiAgIyBEaXNhYmxlIHRhYmJpbmcgZm9yIHRoZSBjaGlsZHJlbiBvZiBhbiBlbGVtZW50LlxuICAjIFRoaXMgaXMgdXNlZCBmb3IgaHRtbCBjb250ZW50IHNvIGl0IGRvZXMgbm90IGRpc3J1cHQgdGhlIHVzZXJcbiAgIyBleHBlcmllbmNlLiBUaGUgdGltZW91dCBpcyB1c2VkIGZvciBjYXNlcyBsaWtlIHR3ZWV0cyB3aGVyZSB0aGVcbiAgIyBpZnJhbWUgaXMgZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IHdpdGggYSBkZWxheS5cbiAgZGlzYWJsZVRhYmJpbmc6ICgkZWxlbSkgLT5cbiAgICBzZXRUaW1lb3V0KCA9PlxuICAgICAgJGVsZW0uZmluZCgnaWZyYW1lJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICwgNDAwKVxuXG5cbiAgIyBBcHBlbmQgYSBjaGlsZCB0byB0aGUgZWxlbWVudCB3aGljaCB3aWxsIGJsb2NrIHVzZXIgaW50ZXJhY3Rpb25cbiAgIyBsaWtlIGNsaWNrIG9yIHRvdWNoIGV2ZW50cy4gQWxzbyB0cnkgdG8gcHJldmVudCB0aGUgdXNlciBmcm9tIGdldHRpbmdcbiAgIyBmb2N1cyBvbiBhIGNoaWxkIGVsZW1udCB0aHJvdWdoIHRhYmJpbmcuXG4gIGJsb2NrSW50ZXJhY3Rpb246ICgkZWxlbSkgLT5cbiAgICBAZW5zdXJlUmVsYXRpdmVQb3NpdGlvbigkZWxlbSlcbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuaW50ZXJhY3Rpb25CbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgJGVsZW0uYXBwZW5kKCRibG9ja2VyKVxuXG4gICAgQGRpc2FibGVUYWJiaW5nKCRlbGVtKVxuXG5cbiAgIyBNYWtlIHN1cmUgdGhhdCBhbGwgYWJzb2x1dGUgcG9zaXRpb25lZCBjaGlsZHJlbiBhcmUgcG9zaXRpb25lZFxuICAjIHJlbGF0aXZlIHRvICRlbGVtLlxuICBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uOiAoJGVsZW0pIC0+XG4gICAgcG9zaXRpb24gPSAkZWxlbS5jc3MoJ3Bvc2l0aW9uJylcbiAgICBpZiBwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdmaXhlZCcgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJ1xuICAgICAgJGVsZW0uY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXG5cblxuICBnZXQkY29udGFpbmVyOiAtPlxuICAgICQoZG9tLmZpbmRDb250YWluZXIoQCRodG1sWzBdKS5ub2RlKVxuXG5cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0VHJlZSwgQHBhcmVudCkgLT5cbiAgICBAcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgQGlzSW50ZXJhY3RpdmUgPSBmYWxzZVxuXG5cbiAgIyBBdmFpbGFibGUgT3B0aW9uczpcbiAgIyBSZWFkT25seSB2aWV3OiAoZGVmYXVsdCBpZiBub3RoaW5nIGlzIHNwZWNpZmllZClcbiAgIyBjcmVhdGUocmVhZE9ubHk6IHRydWUpXG4gICNcbiAgIyBJbmVyYWN0aXZlIHZpZXc6XG4gICMgY3JlYXRlKGludGVyYWN0aXZlOiB0cnVlKVxuICAjXG4gICMgV3JhcHBlcjogKERPTSBub2RlIHRoYXQgaGFzIHRvIGNvbnRhaW4gYSBub2RlIHdpdGggY2xhc3MgJy5kb2Mtc2VjdGlvbicpXG4gICMgY3JlYXRlKCAkd3JhcHBlcjogJCgnPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj4nKSApXG4gIGNyZWF0ZTogKG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZUlGcmFtZShAcGFyZW50KS50aGVuIChpZnJhbWUsIHJlbmRlck5vZGUpID0+XG4gICAgICByZW5kZXJlciA9IEBjcmVhdGVJRnJhbWVSZW5kZXJlcihpZnJhbWUsIG9wdGlvbnMpXG5cbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICBob3N0V2luZG93OiBpZnJhbWUuY29udGVudFdpbmRvd1xuICAgICAgZGVzaWduOiBAc25pcHBldFRyZWUuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcbiAgICByZW5kZXJlciA9IG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgJHdyYXBwZXI6IG9wdGlvbnMuJHdyYXBwZXJcblxuXG4gIGNyZWF0ZVBhZ2U6IChwYXJhbXMsIHsgaW50ZXJhY3RpdmUsIHJlYWRPbmx5IH09e30pIC0+XG4gICAgaWYgaW50ZXJhY3RpdmU/XG4gICAgICBAaXNJbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIG5ldyBJbnRlcmFjdGl2ZVBhZ2UocGFyYW1zKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQYWdlKHBhcmFtcylcblxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuICAgICAgbGluay5ocmVmID0gdXJsXG4gICAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgIEBtYXJrVXJsQXNMb2FkZWQodXJsKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBAcHJpdmF0ZVxuICBtYXJrVXJsQXNMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMucHVzaCh1cmwpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbmNzcyA9IGNvbmZpZy5jc3NcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcblNuaXBwZXREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vc25pcHBldF9kcmFnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0b3JQYWdlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHNldFdpbmRvdygpXG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG5cbiAgICAjIFN0dWJzXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9XG4gICAgICBkaXNhYmxlQWxsOiAtPlxuICAgICAgcmVlbmFibGVBbGw6IC0+XG4gICAgQHNuaXBwZXRXYXNEcm9wcGVkID1cbiAgICAgIGZpcmU6IC0+XG4gICAgQGJsdXJGb2N1c2VkRWxlbWVudCA9IC0+XG5cblxuICBzdGFydERyYWc6ICh7IHNuaXBwZXRNb2RlbCwgc25pcHBldFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHNuaXBwZXRNb2RlbCB8fCBzbmlwcGV0Vmlld1xuICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRWaWV3Lm1vZGVsIGlmIHNuaXBwZXRWaWV3XG5cbiAgICBzbmlwcGV0RHJhZyA9IG5ldyBTbmlwcGV0RHJhZ1xuICAgICAgc25pcHBldE1vZGVsOiBzbmlwcGV0TW9kZWxcbiAgICAgIHNuaXBwZXRWaWV3OiBzbmlwcGV0Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KHNuaXBwZXREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgc2V0V2luZG93OiAtPlxuICAgIEB3aW5kb3cgPSB3aW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkZvY3VzID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZm9jdXMnKVxuRWRpdGFibGVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlcicpXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbiMgQW4gSW50ZXJhY3RpdmVQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhbGxvd3MgZm9yIG1hbmlwdWxhdGlvbiBvZiB0aGVcbiMgcmVuZGVyZWQgU25pcHBldFRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEludGVyYWN0aXZlUGFnZSBleHRlbmRzIFBhZ2VcblxuICBMRUZUX01PVVNFX0JVVFRPTiA9IDFcblxuICBpc1JlYWRPbmx5OiBmYWxzZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIGhvc3RXaW5kb3cgfT17fSkgLT5cbiAgICBzdXBlclxuXG4gICAgQGZvY3VzID0gbmV3IEZvY3VzKClcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID0gbmV3IEVkaXRhYmxlQ29udHJvbGxlcih0aGlzKVxuXG4gICAgIyBldmVudHNcbiAgICBAaW1hZ2VDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGh0bWxFbGVtZW50Q2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBzbmlwcGV0V2lsbEJlRHJhZ2dlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoc25pcHBldE1vZGVsKSAtPlxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXMuYWRkKCAkLnByb3h5KEBhZnRlclNuaXBwZXRGb2N1c2VkLCB0aGlzKSApXG4gICAgQGZvY3VzLnNuaXBwZXRCbHVyLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Qmx1cnJlZCwgdGhpcykgKVxuICAgIEBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeSgpXG5cbiAgICBAJGRvY3VtZW50XG4gICAgICAub24oJ2NsaWNrLmxpdmluZ2RvY3MnLCAkLnByb3h5KEBjbGljaywgdGhpcykpXG4gICAgICAub24oJ21vdXNlZG93bi5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbigndG91Y2hzdGFydC5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgJC5wcm94eShAYnJvd3NlckRyYWdTdGFydCwgdGhpcykpXG5cblxuICBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeTogLT5cbiAgICBpZiBjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGU/XG4gICAgICBAY3NzTG9hZGVyLmxvYWQoY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcbiAgICByZXR1cm4gdW5sZXNzIHNuaXBwZXRWaWV3XG5cbiAgICBAc3RhcnREcmFnXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcbiAgICAgIGV2ZW50OiBldmVudFxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNsaWNrOiAoZXZlbnQpIC0+XG4gICAgc25pcHBldFZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGV2ZW50LnRhcmdldClcbiAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuXG4gICAgIyB0b2RvOiBpZiBhIHVzZXIgY2xpY2tlZCBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXQgaXQgc2hvdWxkXG4gICAgIyBzdGlsbCBnZXQgc2VsZWN0ZWQuIChpZiBhIHNuaXBwZXQgaXMgZm91bmQgYnkgcGFyZW50U25pcHBldFxuICAgICMgYW5kIHRoYXQgc25pcHBldCBoYXMgbm8gY2hpbGRyZW4gd2UgZG8gbm90IG5lZWQgdG8gc2VhcmNoKVxuXG4gICAgIyBpZiBzbmlwcGV0IGhhc0NoaWxkcmVuLCBtYWtlIHN1cmUgd2UgZGlkbid0IHdhbnQgdG8gc2VsZWN0XG4gICAgIyBhIGNoaWxkXG5cbiAgICAjIGlmIG5vIHNuaXBwZXQgd2FzIHNlbGVjdGVkIGNoZWNrIGlmIHRoZSB1c2VyIHdhcyBub3QgY2xpY2tpbmdcbiAgICAjIG9uIGEgbWFyZ2luIG9mIGEgc25pcHBldFxuXG4gICAgIyB0b2RvOiBjaGVjayBpZiB0aGUgY2xpY2sgd2FzIG1lYW50IGZvciBhIHNuaXBwZXQgY29udGFpbmVyXG4gICAgaWYgc25pcHBldFZpZXdcbiAgICAgIEBmb2N1cy5zbmlwcGV0Rm9jdXNlZChzbmlwcGV0VmlldylcblxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoc25pcHBldFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQGZvY3VzLmJsdXIoKVxuXG5cbiAgZ2V0Rm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhzbmlwcGV0VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChzbmlwcGV0VmlldykgLT5cbiAgICBpZiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBzbmlwcGV0Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlclNuaXBwZXRGb2N1c2VkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyU25pcHBldEJsdXJyZWQ6IChzbmlwcGV0VmlldykgLT5cbiAgICBzbmlwcGV0Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwiUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzX2xvYWRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBBIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBSZW5kZXJpbmdDb250YWluZXIgd2hpY2ggaXMgaW50ZW5kZWQgdG8gYmUgc2hvd24gdG9cbiMgdGhlIHVzZXIuIEl0IGhhcyBhIExvYWRlciB3aGljaCBhbGxvd3MgeW91IHRvIGluamVjdCBDU1MgYW5kIEpTIGZpbGVzIGludG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBhZ2UgZXh0ZW5kcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgcmVhZE9ubHksIGhvc3RXaW5kb3csIEBkZXNpZ24sIEBzbmlwcGV0VHJlZSB9PXt9KSAtPlxuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHNldFdpbmRvdyhob3N0V2luZG93KVxuXG4gICAgc3VwZXIoKVxuXG4gICAgQHNldFJlbmRlck5vZGUocmVuZGVyTm9kZSlcbiAgICBAY3NzTG9hZGVyID0gbmV3IENzc0xvYWRlcihAd2luZG93KVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgc2V0UmVuZGVyTm9kZTogKHJlbmRlck5vZGUpIC0+XG4gICAgcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcbiAgICBpZiByZW5kZXJOb2RlLmpxdWVyeVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlWzBdXG4gICAgZWxzZVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlXG5cblxuICBiZWZvcmVSZWFkeTogLT5cbiAgICAjIGFsd2F5cyBpbml0aWFsaXplIGEgcGFnZSBhc3luY2hyb25vdXNseVxuICAgIEByZWFkeVNlbWFwaG9yZS53YWl0KClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcbiAgICAsIDBcblxuXG4gIGJlZm9yZVBhZ2VSZWFkeTogPT5cbiAgICBpZiBAZGVzaWduPyAmJiBjb25maWcubG9hZFJlc291cmNlc1xuICAgICAgZGVzaWduUGF0aCA9IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWVzcGFjZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3cgfHwgd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIFNuaXBwZXRWaWV3cyBpbnRvIHRoZSBSZW5kZXJpbmdDb250YWluZXIgYW5kIG5vdGlmaWVzIGl0XG4jIG9mIHRoZSBpbnNlcnRpb24uXG4jXG4jIFRoZSBSZW5kZXJpbmdDb250YWluZXIgaXMgaW50ZW5kZWQgZm9yIGdlbmVyYXRpbmcgSFRNTC4gUGFnZSBpcyBhIHN1YmNsYXNzIG9mXG4jIHRoaXMgYmFzZSBjbGFzcyB0aGF0IGlzIGludGVuZGVkIGZvciBkaXNwbGF5aW5nIHRvIHRoZSB1c2VyLiBJbnRlcmFjdGl2ZVBhZ2VcbiMgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFkZHMgaW50ZXJhY3Rpdml0eSwgYW5kIHRodXMgZWRpdGFiaWxpdHksIHRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBpc1JlYWRPbmx5OiB0cnVlXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVuZGVyTm9kZSA9ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiIyBqUXVlcnkgbGlrZSByZXN1bHRzIHdoZW4gc2VhcmNoaW5nIGZvciBzbmlwcGV0cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgU25pcHBldEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRBcnJheSB2aWEgYGRvYy5mbmAuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRBcnJheVxuXG5cbiAgIyBAcGFyYW0gc25pcHBldHM6IGFycmF5IG9mIHNuaXBwZXRzXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRzKSAtPlxuICAgIEBzbmlwcGV0cyA9IFtdIHVubGVzcyBAc25pcHBldHM/XG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBzbmlwcGV0c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAc25pcHBldHMubGVuZ3RoXG4gICAgaWYgQHNuaXBwZXRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0BzbmlwcGV0cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBzbmlwcGV0IGluIEBzbmlwcGV0c1xuICAgICAgY2FsbGJhY2soc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFNuaXBwZXRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIFNuaXBwZXRDb250YWluZXIgY29udGFpbnMgYW5kIG1hbmFnZXMgYSBsaW5rZWQgbGlzdFxuIyBvZiBzbmlwcGV0cy5cbiNcbiMgVGhlIHNuaXBwZXRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIHNuaXBwZXRUcmVlXG4jIGluZm9ybWVkIGFib3V0IGNoYW5nZXMgKG9ubHkgaWYgdGhleSBhcmUgYXR0YWNoZWQgdG8gb25lKS5cbiNcbiMgQHByb3AgZmlyc3Q6IGZpcnN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRTbmlwcGV0OiBwYXJlbnQgU25pcHBldE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50U25pcHBldCwgQG5hbWUsIGlzUm9vdCB9KSAtPlxuICAgIEBpc1Jvb3QgPSBpc1Jvb3Q/XG4gICAgQGZpcnN0ID0gQGxhc3QgPSB1bmRlZmluZWRcblxuXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQHBhcmVudFNuaXBwZXRcbiAgICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgQHBhcmVudFNuaXBwZXQsICdjYW5ub3QgYXBwZW5kIHNuaXBwZXQgdG8gaXRzZWxmJ1xuXG4gICAgaWYgQGxhc3RcbiAgICAgIEBpbnNlcnRBZnRlcihAbGFzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgaW5zZXJ0QmVmb3JlOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0LnByZXZpb3VzID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldC5wcmV2aW91c1xuICAgICAgbmV4dDogc25pcHBldFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIGluc2VydEFmdGVyOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0Lm5leHQgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXRcbiAgICAgIG5leHQ6IHNuaXBwZXQubmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIHVwOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShzbmlwcGV0LnByZXZpb3VzLCBzbmlwcGV0KVxuXG5cbiAgZG93bjogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5uZXh0P1xuICAgICAgQGluc2VydEFmdGVyKHNuaXBwZXQubmV4dCwgc25pcHBldClcblxuXG4gIGdldFNuaXBwZXRUcmVlOiAtPlxuICAgIEBzbmlwcGV0VHJlZSB8fCBAcGFyZW50U25pcHBldD8uc25pcHBldFRyZWVcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0ID0gQGZpcnN0XG4gICAgd2hpbGUgKHNuaXBwZXQpXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgY2FsbGJhY2soc25pcHBldClcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0LmRlc3Ryb3koKVxuICAgIEBfZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBTbmlwcGV0TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggU25pcHBldE1vZGVsIGhhcyBhIHRlbXBsYXRlIHdoaWNoIGFsbG93cyB0byBnZW5lcmF0ZSBhIHNuaXBwZXRWaWV3XG4jIGZyb20gYSBzbmlwcGV0TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBTbmlwcGV0VHJlZS5cbiMgRXZlcnkgU25pcHBldE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChTbmlwcGV0Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIHNuaXBwZXRzKSBhbmQgbXVsdGlwbGUgY29udGFpbmVycyAoU25pcHBldENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIFNuaXBwZXRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IFNuaXBwZXRDb250YWluZXJcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgc25pcHBldCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEB0ZW1wb3JhcnlDb250ZW50ID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICBoYXNDb250YWluZXJzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdjb250YWluZXInKSA+IDBcblxuXG4gIGhhc0VkaXRhYmxlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnZWRpdGFibGUnKSA+IDBcblxuXG4gIGhhc0h0bWw6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2h0bWwnKSA+IDBcblxuXG4gIGhhc0ltYWdlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaW1hZ2UnKSA+IDBcblxuXG4gIGJlZm9yZTogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAcHJldmlvdXNcblxuXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gIGFwcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLnByZXBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHJlc2V0Vm9sYXRpbGVWYWx1ZTogKG5hbWUsIHRyaWdnZXJDaGFuZ2VFdmVudD10cnVlKSAtPlxuICAgIGRlbGV0ZSBAdGVtcG9yYXJ5Q29udGVudFtuYW1lXVxuICAgIGlmIHRyaWdnZXJDaGFuZ2VFdmVudFxuICAgICAgQHNuaXBwZXRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAc25pcHBldFRyZWVcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlLCBmbGFnPScnKSAtPlxuICAgIGFzc2VydCBAY29udGVudD8uaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcInNldCBlcnJvcjogI3sgQGlkZW50aWZpZXIgfSBoYXMgbm8gY29udGVudCBuYW1lZCAjeyBuYW1lIH1cIlxuXG4gICAgaWYgZmxhZyA9PSAndGVtcG9yYXJ5T3ZlcnJpZGUnXG4gICAgICBzdG9yYWdlQ29udGFpbmVyID0gQHRlbXBvcmFyeUNvbnRlbnRcbiAgICBlbHNlXG4gICAgICBAcmVzZXRWb2xhdGlsZVZhbHVlKG5hbWUsIGZhbHNlKSAjIGFzIHNvb24gYXMgd2UgZ2V0IHJlYWwgY29udGVudCwgcmVzZXQgdGhlIHRlbXBvcmFyeUNvbnRlbnRcbiAgICAgIHN0b3JhZ2VDb250YWluZXIgPSBAY29udGVudFxuXG4gICAgaWYgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSAhPSB2YWx1ZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSA9IHZhbHVlXG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBjb250ZW50W25hbWVdXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBzbmlwcGV0VHJlZSAmJiBjaGFuZ2VkRGF0YVByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBAc25pcHBldFRyZWUuZGF0YUNoYW5naW5nKHRoaXMsIGNoYW5nZWREYXRhUHJvcGVydGllcylcbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1thcmddXG5cblxuICBjaGFuZ2VEYXRhOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgZGVlcEVxdWFsKEBkYXRhVmFsdWVzW25hbWVdLCB2YWx1ZSkgPT0gZmFsc2VcbiAgICAgIEBkYXRhVmFsdWVzW25hbWVdID0gdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG5cbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2UgaWYgbm90IHN0eWxlLnZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBsb2cud2FybiBcIkludmFsaWQgdmFsdWUgJyN7IHZhbHVlIH0nIGZvciBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQHNuaXBwZXRUcmVlXG4gICAgICAgICAgQHNuaXBwZXRUcmVlLmh0bWxDaGFuZ2luZyh0aGlzLCAnc3R5bGUnLCB7IG5hbWUsIHZhbHVlIH0pXG5cblxuICBjb3B5OiAtPlxuICAgIGxvZy53YXJuKFwiU25pcHBldE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBTbmlwcGV0TW9kZWwuZnJvbUpzb24oanNvbilcblxuXG4gIGNvcHlXaXRob3V0Q29udGVudDogLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG5cbiAgIyBtb3ZlIHVwIChwcmV2aW91cylcbiAgdXA6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci51cCh0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgbW92ZSBkb3duIChuZXh0KVxuICBkb3duOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIuZG93bih0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgcmVtb3ZlIFRyZWVOb2RlIGZyb20gaXRzIGNvbnRhaW5lciBhbmQgU25pcHBldFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiAgICAjIHJlbW92ZSB1c2VyIGludGVyZmFjZSBlbGVtZW50c1xuICAgIEB1aUluamVjdG9yLnJlbW92ZSgpIGlmIEB1aUluamVjdG9yXG5cblxuICBnZXRQYXJlbnQ6IC0+XG4gICAgIEBwYXJlbnRDb250YWluZXI/LnBhcmVudFNuaXBwZXRcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgQHNuaXBwZXRUcmVlLnJlbmRlcmVyLmNyZWF0ZUludGVyZmFjZUluamVjdG9yKHRoaXMpXG4gICAgQHVpSW5qZWN0b3JcblxuXG4gICMgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tXG5cbiAgcGFyZW50czogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLmdldFBhcmVudCgpKVxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwuZGVzY2VuZGFudHMoY2FsbGJhY2spXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIHNuaXBwZXRNb2RlbClcbiAgZGVzY2VuZGFudENvbnRhaW5lcnM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpID0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpIGlmIHNuaXBwZXRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgdG9Kc29uOiAtPlxuXG4gICAganNvbiA9XG4gICAgICBpZDogQGlkXG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAY29udGVudClcbiAgICAgIGpzb24uY29udGVudCA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQGNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBzdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQHN0eWxlcylcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuU25pcHBldE1vZGVsLmZyb21Kc29uID0gKGpzb24sIGRlc2lnbikgLT5cbiAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uaWRlbnRpZmllcilcblxuICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gdGVtcGxhdGUgaWRlbnRpZmllciAnI3sganNvbi5pZGVudGlmaWVyIH0nXCJcblxuICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcbiAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICBmb3Igc3R5bGVOYW1lLCB2YWx1ZSBvZiBqc29uLnN0eWxlc1xuICAgIG1vZGVsLnN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gIGZvciBjb250YWluZXJOYW1lLCBzbmlwcGV0QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgIGlmIHNuaXBwZXRBcnJheVxuICAgICAgYXNzZXJ0ICQuaXNBcnJheShzbmlwcGV0QXJyYXkpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgZm9yIGNoaWxkIGluIHNuaXBwZXRBcnJheVxuICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgbW9kZWxcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2FycmF5JylcblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4vc25pcHBldF9tb2RlbCcpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBTbmlwcGV0VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgIyBJbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICBnZXRTbmlwcGV0OiAoc25pcHBldE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXROYW1lID09ICdzdHJpbmcnXG4gICAgICBAY3JlYXRlTW9kZWwoc25pcHBldE5hbWUpXG4gICAgZWxzZVxuICAgICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6IC0+XG4gICAgQGNyZWF0ZU1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuXG4gIGdldFRlbXBsYXRlOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBkZXNpZ24uZ2V0KGlkZW50aWZpZXIpXG4gICAgYXNzZXJ0IHRlbXBsYXRlLCBcIkNvdWxkIG5vdCBmaW5kIHRlbXBsYXRlICN7IGlkZW50aWZpZXIgfVwiXG4gICAgdGVtcGxhdGVcblxuXG4gIGluaXRpYWxpemVFdmVudHM6ICgpIC0+XG5cbiAgICAjIGxheW91dCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRNb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgICMgY29udGVudCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0U2V0dGluZ3NDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgR2V0IHRoZSBmaXJzdCBzbmlwcGV0XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgICAgaWYgc25pcHBldC5pZGVudGlmaWVyID09IHNlYXJjaCB8fCBzbmlwcGV0LnRlbXBsYXRlLmlkID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKHNuaXBwZXQpXG5cbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkocmVzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgIG9sZFJvb3RcblxuXG4gICMgZWFjaFdpdGhQYXJlbnRzOiAoc25pcHBldCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goc25pcHBldClcbiAgIyAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAjICAgICBzbmlwcGV0ID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICMgICAgIHdoaWxlIChzbmlwcGV0KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoc25pcHBldCwgcGFyZW50cylcbiAgIyAgICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdTbmlwcGV0VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIHRlbXBsYXRlID0gc25pcHBldC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUudGl0bGUgfSAoI3sgdGVtcGxhdGUuaWRlbnRpZmllciB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGFkZExpbmUoXCIjeyBuYW1lIH06XCIsIGluZGVudGF0aW9uICsgMilcbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBpbmRlbnRhdGlvbikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIHNuaXBwZXRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBzbmlwcGV0Q29udGFpbmVyc1xuXG4gIGF0dGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBhdHRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBzbmlwcGV0XG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0TW92ZWQnLCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWU/XG4gICAgICAgICMgcmVtb3ZlIGZyb20gb3RoZXIgc25pcHBldCB0cmVlXG4gICAgICAgIHNuaXBwZXQuc25pcHBldENvbnRhaW5lci5kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LnNuaXBwZXRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0QWRkZWQnLCBzbmlwcGV0KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBkZXRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBhc3NlcnQgc25pcHBldC5zbmlwcGV0VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgc25pcHBldCBmcm9tIGFub3RoZXIgU25pcHBldFRyZWUnXG5cbiAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoU25pcHBldEZ1bmMoKVxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRSZW1vdmVkJywgc25pcHBldClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldENvbnRlbnRDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGh0bWxDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldEh0bWxDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGRhdGFDaGFuZ2luZzogKHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXREYXRhQ2hhbmdlZCcsIHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lc3BhY2UgfVxuXG4gICAgc25pcHBldFRvRGF0YSA9IChzbmlwcGV0LCBsZXZlbCwgY29udGFpbmVyQXJyYXkpIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggc25pcHBldERhdGFcbiAgICAgIHNuaXBwZXREYXRhXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXRUb0RhdGEoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IHNuaXBwZXREYXRhLmNvbnRhaW5lcnNbc25pcHBldENvbnRhaW5lci5uYW1lXSA9IFtdXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGxldmVsLCBkYXRhT2JqKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgdG9Kc29uOiAtPlxuICAgIEBzZXJpYWxpemUoKVxuXG5cbiAgZnJvbUpzb246IChkYXRhLCBkZXNpZ24pIC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBpZiBkYXRhLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IFNuaXBwZXRNb2RlbC5mcm9tSnNvbihzbmlwcGV0RGF0YSwgZGVzaWduKVxuICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEByb290LmVhY2ggKHNuaXBwZXQpID0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdGhpc1xuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBuYW1lLCBAdHlwZSwgQGVsZW0gfSkgLT5cbiAgICBAbmFtZSA9IG5hbWUgfHwgY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdLmRlZmF1bHROYW1lXG4gICAgQGNvbmZpZyA9IGNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXVxuICAgIEBvcHRpb25hbCA9IGZhbHNlXG5cblxuICByZW5kZXJlZEF0dHI6IC0+XG4gICAgQGNvbmZpZy5yZW5kZXJlZEF0dHJcblxuXG4gIGlzRWxlbWVudERpcmVjdGl2ZTogLT5cbiAgICBAY29uZmlnLmVsZW1lbnREaXJlY3RpdmVcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkIGZyb20gdGhlXG4gICMgdGVtcGxhdGUgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlld1xuICBjbG9uZTogLT5cbiAgICBuZXdEaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlKG5hbWU6IEBuYW1lLCB0eXBlOiBAdHlwZSlcbiAgICBuZXdEaXJlY3RpdmUub3B0aW9uYWwgPSBAb3B0aW9uYWxcbiAgICBuZXdEaXJlY3RpdmVcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAZWxlbSlcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxuIyBBIGxpc3Qgb2YgYWxsIGRpcmVjdGl2ZXMgb2YgYSB0ZW1wbGF0ZVxuIyBFdmVyeSBub2RlIHdpdGggYW4gZG9jLSBhdHRyaWJ1dGUgd2lsbCBiZSBzdG9yZWQgYnkgaXRzIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlQ29sbGVjdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGFsbD17fSkgLT5cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgYWRkOiAoZGlyZWN0aXZlKSAtPlxuICAgIEBhc3NlcnROYW1lTm90VXNlZChkaXJlY3RpdmUpXG5cbiAgICAjIGNyZWF0ZSBwc2V1ZG8gYXJyYXlcbiAgICB0aGlzW0BsZW5ndGhdID0gZGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlLmluZGV4ID0gQGxlbmd0aFxuICAgIEBsZW5ndGggKz0gMVxuXG4gICAgIyBpbmRleCBieSBuYW1lXG4gICAgQGFsbFtkaXJlY3RpdmUubmFtZV0gPSBkaXJlY3RpdmVcblxuICAgICMgaW5kZXggYnkgdHlwZVxuICAgICMgZGlyZWN0aXZlLnR5cGUgaXMgb25lIG9mIHRob3NlICdjb250YWluZXInLCAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXSB8fD0gW11cbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXS5wdXNoKGRpcmVjdGl2ZSlcblxuXG4gIG5leHQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgfHw9IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlyZWN0aXZlRmluZGVyID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgbGluazogKGVsZW0sIGRpcmVjdGl2ZUNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHIubmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29sbGVjdGlvbi5nZXQoYXR0ci52YWx1ZSlcbiAgICAgICAgZGlyZWN0aXZlLmVsZW0gPSBlbGVtXG5cbiAgICB1bmRlZmluZWRcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2l0ZXJhdG9yJylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcbmRpcmVjdGl2ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29tcGlsZXInKVxuZGlyZWN0aXZlRmluZGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfZmluZGVyJylcblxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi4vc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwnKVxuU25pcHBldFZpZXcgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvc25pcHBldF92aWV3JylcblxuIyBUZW1wbGF0ZVxuIyAtLS0tLS0tLVxuIyBQYXJzZXMgc25pcHBldCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgU25pcHBldE1vZGVscyBhbmQgU25pcHBldFZpZXdzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZW1wbGF0ZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGh0bWwsIEBuYW1lc3BhY2UsIEBpZCwgaWRlbnRpZmllciwgdGl0bGUsIHN0eWxlcywgd2VpZ2h0IH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgaHRtbCwgJ1RlbXBsYXRlOiBwYXJhbSBodG1sIG1pc3NpbmcnXG5cbiAgICBpZiBpZGVudGlmaWVyXG4gICAgICB7IEBuYW1lc3BhY2UsIEBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBAaWRlbnRpZmllciA9IGlmIEBuYW1lc3BhY2UgJiYgQGlkXG4gICAgICBcIiN7IEBuYW1lc3BhY2UgfS4jeyBAaWQgfVwiXG5cbiAgICBAJHRlbXBsYXRlID0gJCggQHBydW5lSHRtbChodG1sKSApLndyYXAoJzxkaXY+JylcbiAgICBAJHdyYXAgPSBAJHRlbXBsYXRlLnBhcmVudCgpXG5cbiAgICBAdGl0bGUgPSB0aXRsZSB8fCB3b3Jkcy5odW1hbml6ZSggQGlkIClcbiAgICBAc3R5bGVzID0gc3R5bGVzIHx8IHt9XG4gICAgQHdlaWdodCA9IHdlaWdodFxuICAgIEBkZWZhdWx0cyA9IHt9XG5cbiAgICBAcGFyc2VUZW1wbGF0ZSgpXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBTbmlwcGV0TW9kZWwgaW5zdGFuY2UgZnJvbSB0aGlzIHRlbXBsYXRlXG4gIGNyZWF0ZU1vZGVsOiAoKSAtPlxuICAgIG5ldyBTbmlwcGV0TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoc25pcHBldE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIHNuaXBwZXRNb2RlbCB8fD0gQGNyZWF0ZU1vZGVsKClcbiAgICAkZWxlbSA9IEAkdGVtcGxhdGUuY2xvbmUoKVxuICAgIGRpcmVjdGl2ZXMgPSBAbGlua0RpcmVjdGl2ZXMoJGVsZW1bMF0pXG5cbiAgICBzbmlwcGV0VmlldyA9IG5ldyBTbmlwcGV0Vmlld1xuICAgICAgbW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgJGh0bWw6ICRlbGVtXG4gICAgICBkaXJlY3RpdmVzOiBkaXJlY3RpdmVzXG4gICAgICBpc1JlYWRPbmx5OiBpc1JlYWRPbmx5XG5cblxuICBwcnVuZUh0bWw6IChodG1sKSAtPlxuXG4gICAgIyByZW1vdmUgYWxsIGNvbW1lbnRzXG4gICAgaHRtbCA9ICQoaHRtbCkuZmlsdGVyIChpbmRleCkgLT5cbiAgICAgIEBub2RlVHlwZSAhPThcblxuICAgICMgb25seSBhbGxvdyBvbmUgcm9vdCBlbGVtZW50XG4gICAgYXNzZXJ0IGh0bWwubGVuZ3RoID09IDEsIFwiVGVtcGxhdGVzIG11c3QgY29udGFpbiBvbmUgcm9vdCBlbGVtZW50LiBUaGUgVGVtcGxhdGUgXFxcIiN7QGlkZW50aWZpZXJ9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgc25pcHBldERpcmVjdGl2ZXMgPSBAZGlyZWN0aXZlcy5jbG9uZSgpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlRmluZGVyLmxpbmsoZWxlbSwgc25pcHBldERpcmVjdGl2ZXMpXG5cbiAgICBzbmlwcGV0RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZWRpdGFibGUpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGlmIGRlZmF1bHRWYWx1ZSB0aGVuIGRlZmF1bHRWYWx1ZSBlbHNlICcnXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0Q29udGFpbmVyOiAobmFtZSwgZWxlbSkgLT5cbiAgICAjIHJlbW92ZSBhbGwgY29udGVudCBmcm9uIGEgY29udGFpbmVyIGZyb20gdGhlIHRlbXBsYXRlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0SHRtbDogKG5hbWUsIGVsZW0pIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgIyBvdXRwdXQgdGhlIGFjY2VwdGVkIGNvbnRlbnQgb2YgdGhlIHNuaXBwZXRcbiAgIyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gY3JlYXRlXG4gICMgZS5nOiB7IHRpdGxlOiBcIkl0Y2h5IGFuZCBTY3JhdGNoeVwiIH1cbiAgcHJpbnREb2M6ICgpIC0+XG4gICAgZG9jID1cbiAgICAgIGlkZW50aWZpZXI6IEBpZGVudGlmaWVyXG4gICAgICAjIGVkaXRhYmxlczogT2JqZWN0LmtleXMgQGVkaXRhYmxlcyBpZiBAZWRpdGFibGVzXG4gICAgICAjIGNvbnRhaW5lcnM6IE9iamVjdC5rZXlzIEBjb250YWluZXJzIGlmIEBjb250YWluZXJzXG5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oZG9jKVxuXG5cbiMgU3RhdGljIGZ1bmN0aW9uc1xuIyAtLS0tLS0tLS0tLS0tLS0tXG5cblRlbXBsYXRlLnBhcnNlSWRlbnRpZmllciA9IChpZGVudGlmaWVyKSAtPlxuICByZXR1cm4gdW5sZXNzIGlkZW50aWZpZXIgIyBzaWxlbnRseSBmYWlsIG9uIHVuZGVmaW5lZCBvciBlbXB0eSBzdHJpbmdzXG5cbiAgcGFydHMgPSBpZGVudGlmaWVyLnNwbGl0KCcuJylcbiAgaWYgcGFydHMubGVuZ3RoID09IDFcbiAgICB7IG5hbWVzcGFjZTogdW5kZWZpbmVkLCBpZDogcGFydHNbMF0gfVxuICBlbHNlIGlmIHBhcnRzLmxlbmd0aCA9PSAyXG4gICAgeyBuYW1lc3BhY2U6IHBhcnRzWzBdLCBpZDogcGFydHNbMV0gfVxuICBlbHNlXG4gICAgbG9nLmVycm9yKFwiY291bGQgbm90IHBhcnNlIHNuaXBwZXQgdGVtcGxhdGUgaWRlbnRpZmllcjogI3sgaWRlbnRpZmllciB9XCIpXG4iXX0=
