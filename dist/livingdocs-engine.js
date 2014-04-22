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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fc3R5bGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZG9jdW1lbnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZG9tLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RyYWdfYmFzZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2ZvY3VzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9raWNrc3RhcnQvYnJvd3Nlcl94bWxkb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2Fzc2VydC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvbG9nLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZWZhdWx0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3JlbmRlcmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZXNyY2l0X2ltYWdlX21hbmFnZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3NuaXBwZXRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9zbmlwcGV0X3RyZWUvc25pcHBldF9jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFsQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFNBQUEsRUFBVyxLQUFNLENBQUEsQ0FBQSxDQUFuQjtBQUFBLE1BQXVCLEVBQUEsRUFBSSxLQUFNLENBQUEsQ0FBQSxDQUFqQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsK0NBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQTlJM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRvY3VtZW50ID0gcmVxdWlyZSgnLi9kb2N1bWVudCcpXG5TbmlwcGV0VHJlZSA9IHJlcXVpcmUoJy4vc25pcHBldF90cmVlL3NuaXBwZXRfdHJlZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ24nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jID0gZG8gLT5cblxuICBlZGl0b3JQYWdlID0gbmV3IEVkaXRvclBhZ2UoKVxuXG5cbiAgIyBJbnN0YW50aWF0aW9uIHByb2Nlc3M6XG4gICMgYXN5bmMgb3Igc3luYyAtPiBnZXQgZGVzaWduIChpbmNsdWRlIGpzIGZvciBzeW5jaHJvbm91cyBsb2FkaW5nKVxuICAjIHN5bmMgLT4gY3JlYXRlIGRvY3VtZW50XG4gICMgYXN5bmMgLT4gY3JlYXRlIHZpZXcgKGlmcmFtZSlcbiAgIyBhc3luYyAtPiBsb2FkIHJlc291cmNlcyBpbnRvIHZpZXdcblxuXG4gICMgTG9hZCBhIGRvY3VtZW50IGZyb20gc2VyaWFsaXplZCBkYXRhXG4gICMgaW4gYSBzeW5jaHJvbm91cyB3YXkuIERlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgbmV3OiAoeyBkYXRhLCBkZXNpZ24gfSkgLT5cbiAgICBzbmlwcGV0VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGRvY3VtZW50OiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgU25pcHBldFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgZGVzaWduTmFtZSA9IGRlc2lnblxuICAgICAgZGVzaWduID0gQGRlc2lnbi5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBTbmlwcGV0VHJlZShkZXNpZ246IGRlc2lnbilcblxuICAgIEBjcmVhdGUoc25pcHBldFRyZWUpXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgZG9jLmxvYWQoanNvbkZyb21TZXJ2ZXIpXG4gICMgIC50aGVuIChkb2N1bWVudCkgLT5cbiAgIyAgICBkb2N1bWVudC5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgRGlyZWN0IGNyZWF0aW9uIHdpdGggYW4gZXhpc3RpbmcgU25pcHBldFRyZWVcbiAgY3JlYXRlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgbmV3IERvY3VtZW50KHsgc25pcHBldFRyZWUgfSlcblxuXG4gICMgU2VlIGRlc2lnbkNhY2hlLmxvYWQgZm9yIGV4YW1wbGVzIGhvdyB0byBsb2FkIHlvdXIgZGVzaWduLlxuICBkZXNpZ246IGRlc2lnbkNhY2hlXG5cbiAgIyBTdGFydCBkcmFnICYgZHJvcFxuICBzdGFydERyYWc6ICQucHJveHkoZWRpdG9yUGFnZSwgJ3N0YXJ0RHJhZycpXG5cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG4iLCIjIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gICMgTG9hZCBjc3MgYW5kIGpzIHJlc291cmNlcyBpbiBwYWdlcyBhbmQgaW50ZXJhY3RpdmUgcGFnZXNcbiAgbG9hZFJlc291cmNlczogdHJ1ZVxuXG4gICMgU2V0dXAgcGF0aHMgdG8gbG9hZCByZXNvdXJjZXMgZHluYW1pY2FsbHlcbiAgZGVzaWduUGF0aDogJy9kZXNpZ25zJ1xuICBsaXZpbmdkb2NzQ3NzRmlsZTogJy9hc3NldHMvY3NzL2xpdmluZ2RvY3MuY3NzJ1xuXG4gIHdvcmRTZXBhcmF0b3JzOiBcIi4vXFxcXCgpXFxcIic6LC47PD5+ISMlXiYqfCs9W117fWB+P1wiXG5cbiAgIyBzdHJpbmcgY29udGFpbm5nIG9ubHkgYSA8YnI+IGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2VzXG4gIHNpbmdsZUxpbmVCcmVhazogL148YnJcXHMqXFwvPz5cXHMqJC9cblxuICBhdHRyaWJ1dGVQcmVmaXg6ICdkYXRhJ1xuXG4gICMgSW4gY3NzIGFuZCBhdHRyIHlvdSBmaW5kIGV2ZXJ5dGhpbmcgdGhhdCBjYW4gZW5kIHVwIGluIHRoZSBodG1sXG4gICMgdGhlIGVuZ2luZSBzcGl0cyBvdXQgb3Igd29ya3Mgd2l0aC5cblxuICAjIGNzcyBjbGFzc2VzIGluamVjdGVkIGJ5IHRoZSBlbmdpbmVcbiAgY3NzOlxuICAgICMgZG9jdW1lbnQgY2xhc3Nlc1xuICAgIHNlY3Rpb246ICdkb2Mtc2VjdGlvbidcblxuICAgICMgc25pcHBldCBjbGFzc2VzXG4gICAgc25pcHBldDogJ2RvYy1zbmlwcGV0J1xuICAgIGVkaXRhYmxlOiAnZG9jLWVkaXRhYmxlJ1xuICAgIG5vUGxhY2Vob2xkZXI6ICdkb2Mtbm8tcGxhY2Vob2xkZXInXG4gICAgZW1wdHlJbWFnZTogJ2RvYy1pbWFnZS1lbXB0eSdcbiAgICBpbnRlcmZhY2U6ICdkb2MtdWknXG5cbiAgICAjIGhpZ2hsaWdodCBjbGFzc2VzXG4gICAgc25pcHBldEhpZ2hsaWdodDogJ2RvYy1zbmlwcGV0LWhpZ2hsaWdodCdcbiAgICBjb250YWluZXJIaWdobGlnaHQ6ICdkb2MtY29udGFpbmVyLWhpZ2hsaWdodCdcblxuICAgICMgZHJhZyAmIGRyb3BcbiAgICBkcmFnZ2VkOiAnZG9jLWRyYWdnZWQnXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyOiAnZG9jLWRyYWdnZWQtcGxhY2Vob2xkZXInXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlcjogJ2RvYy1kcmFnLWNvdW50ZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBLaWNrc3RhcnQgY29uZmlnXG4gIGtpY2tzdGFydDpcbiAgICBhdHRyOlxuICAgICAgc3R5bGVzOiAnZG9jLXN0eWxlcydcblxuICAjIERpcmVjdGl2ZSBkZWZpbml0aW9uc1xuICAjXG4gICMgYXR0cjogYXR0cmlidXRlIHVzZWQgaW4gdGVtcGxhdGVzIHRvIGRlZmluZSB0aGUgZGlyZWN0aXZlXG4gICMgcmVuZGVyZWRBdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiBvdXRwdXQgaHRtbFxuICAjIGVsZW1lbnREaXJlY3RpdmU6IGRpcmVjdGl2ZSB0aGF0IHRha2VzIGNvbnRyb2wgb3ZlciB0aGUgZWxlbWVudFxuICAjICAgKHRoZXJlIGNhbiBvbmx5IGJlIG9uZSBwZXIgZWxlbWVudClcbiAgIyBkZWZhdWx0TmFtZTogZGVmYXVsdCBuYW1lIGlmIG5vbmUgd2FzIHNwZWNpZmllZCBpbiB0aGUgdGVtcGxhdGVcbiAgZGlyZWN0aXZlczpcbiAgICBjb250YWluZXI6XG4gICAgICBhdHRyOiAnZG9jLWNvbnRhaW5lcidcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgZWRpdGFibGU6XG4gICAgICBhdHRyOiAnZG9jLWVkaXRhYmxlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBpbWFnZTpcbiAgICAgIGF0dHI6ICdkb2MtaW1hZ2UnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdpbWFnZSdcbiAgICBodG1sOlxuICAgICAgYXR0cjogJ2RvYy1odG1sJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBvcHRpb25hbDpcbiAgICAgIGF0dHI6ICdkb2Mtb3B0aW9uYWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogZmFsc2VcblxuXG4gIGFuaW1hdGlvbnM6XG4gICAgb3B0aW9uYWxzOlxuICAgICAgc2hvdzogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZURvd24oMjUwKVxuXG4gICAgICBoaWRlOiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlVXAoMjUwKVxuXG5cbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuI1xuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb24gd2l0aCBzaG9ydGhhbmRzIGFuZCBjb21wdXRlZCB2YWx1ZXMuXG5lbnJpY2hDb25maWcgPSAtPlxuXG4gICMgU2hvcnRoYW5kcyBmb3Igc3R1ZmYgdGhhdCBpcyB1c2VkIGFsbCBvdmVyIHRoZSBwbGFjZSB0byBtYWtlXG4gICMgY29kZSBhbmQgc3BlY3MgbW9yZSByZWFkYWJsZS5cbiAgQGRvY0RpcmVjdGl2ZSA9IHt9XG4gIEB0ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBAZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBcIiN7IEBhdHRyaWJ1dGVQcmVmaXggfS1cIiBpZiBAYXR0cmlidXRlUHJlZml4XG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfHwgJycgfSN7IHZhbHVlLmF0dHIgfVwiXG5cbiAgICBAZG9jRGlyZWN0aXZlW25hbWVdID0gdmFsdWUucmVuZGVyZWRBdHRyXG4gICAgQHRlbXBsYXRlQXR0ckxvb2t1cFt2YWx1ZS5hdHRyXSA9IG5hbWVcblxuXG5lbnJpY2hDb25maWcuY2FsbChjb25maWcpXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5EZXNpZ25TdHlsZSA9IHJlcXVpcmUoJy4vZGVzaWduX3N0eWxlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICBjb25zdHJ1Y3RvcjogKGRlc2lnbikgLT5cbiAgICB0ZW1wbGF0ZXMgPSBkZXNpZ24udGVtcGxhdGVzIHx8IGRlc2lnbi5zbmlwcGV0c1xuICAgIGNvbmZpZyA9IGRlc2lnbi5jb25maWdcbiAgICBncm91cHMgPSBkZXNpZ24uY29uZmlnLmdyb3VwcyB8fCBkZXNpZ24uZ3JvdXBzXG5cbiAgICBAbmFtZXNwYWNlID0gY29uZmlnPy5uYW1lc3BhY2UgfHwgJ2xpdmluZ2RvY3MtdGVtcGxhdGVzJ1xuICAgIEBwYXJhZ3JhcGhTbmlwcGV0ID0gY29uZmlnPy5wYXJhZ3JhcGggfHwgJ3RleHQnXG4gICAgQGNzcyA9IGNvbmZpZy5jc3NcbiAgICBAanMgPSBjb25maWcuanNcbiAgICBAZm9udHMgPSBjb25maWcuZm9udHNcbiAgICBAdGVtcGxhdGVzID0gW11cbiAgICBAZ3JvdXBzID0ge31cbiAgICBAc3R5bGVzID0ge31cblxuICAgIEBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnModGVtcGxhdGVzKVxuICAgIEBnbG9iYWxTdHlsZXMgPSBAY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uKGRlc2lnbi5jb25maWcuc3R5bGVzKVxuICAgIEBhZGRHcm91cHMoZ3JvdXBzKVxuICAgIEBhZGRUZW1wbGF0ZXNOb3RJbkdyb3VwcygpXG5cblxuICBzdG9yZVRlbXBsYXRlRGVmaW5pdGlvbnM6ICh0ZW1wbGF0ZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnMgPSB7fVxuICAgIGZvciB0ZW1wbGF0ZSBpbiB0ZW1wbGF0ZXNcbiAgICAgIEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlLmlkXSA9IHRlbXBsYXRlXG5cblxuICAjIHBhc3MgdGhlIHRlbXBsYXRlIGFzIG9iamVjdFxuICAjIGUuZyBhZGQoe2lkOiBcInRpdGxlXCIsIG5hbWU6XCJUaXRsZVwiLCBodG1sOiBcIjxoMSBkb2MtZWRpdGFibGU+VGl0bGU8L2gxPlwifSlcbiAgYWRkOiAodGVtcGxhdGVEZWZpbml0aW9uLCBzdHlsZXMpIC0+XG4gICAgQHRlbXBsYXRlRGVmaW5pdGlvbnNbdGVtcGxhdGVEZWZpbml0aW9uLmlkXSA9IHVuZGVmaW5lZFxuICAgIHRlbXBsYXRlT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24odGVtcGxhdGVEZWZpbml0aW9uLnN0eWxlcylcbiAgICB0ZW1wbGF0ZVN0eWxlcyA9ICQuZXh0ZW5kKHt9LCBzdHlsZXMsIHRlbXBsYXRlT25seVN0eWxlcylcblxuICAgIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlXG4gICAgICBuYW1lc3BhY2U6IEBuYW1lc3BhY2VcbiAgICAgIGlkOiB0ZW1wbGF0ZURlZmluaXRpb24uaWRcbiAgICAgIHRpdGxlOiB0ZW1wbGF0ZURlZmluaXRpb24udGl0bGVcbiAgICAgIHN0eWxlczogdGVtcGxhdGVTdHlsZXNcbiAgICAgIGh0bWw6IHRlbXBsYXRlRGVmaW5pdGlvbi5odG1sXG4gICAgICB3ZWlnaHQ6IHRlbXBsYXRlRGVmaW5pdGlvbi5zb3J0T3JkZXIgfHwgMFxuXG4gICAgQHRlbXBsYXRlcy5wdXNoKHRlbXBsYXRlKVxuICAgIHRlbXBsYXRlXG5cblxuICBhZGRHcm91cHM6IChjb2xsZWN0aW9uKSAtPlxuICAgIGZvciBncm91cE5hbWUsIGdyb3VwIG9mIGNvbGxlY3Rpb25cbiAgICAgIGdyb3VwT25seVN0eWxlcyA9IEBjcmVhdGVEZXNpZ25TdHlsZUNvbGxlY3Rpb24oZ3JvdXAuc3R5bGVzKVxuICAgICAgZ3JvdXBTdHlsZXMgPSAkLmV4dGVuZCh7fSwgQGdsb2JhbFN0eWxlcywgZ3JvdXBPbmx5U3R5bGVzKVxuXG4gICAgICB0ZW1wbGF0ZXMgPSB7fVxuICAgICAgZm9yIHRlbXBsYXRlSWQgaW4gZ3JvdXAudGVtcGxhdGVzXG4gICAgICAgIHRlbXBsYXRlRGVmaW5pdGlvbiA9IEB0ZW1wbGF0ZURlZmluaXRpb25zW3RlbXBsYXRlSWRdXG4gICAgICAgIGlmIHRlbXBsYXRlRGVmaW5pdGlvblxuICAgICAgICAgIHRlbXBsYXRlID0gQGFkZCh0ZW1wbGF0ZURlZmluaXRpb24sIGdyb3VwU3R5bGVzKVxuICAgICAgICAgIHRlbXBsYXRlc1t0ZW1wbGF0ZS5pZF0gPSB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLndhcm4oXCJUaGUgdGVtcGxhdGUgJyN7dGVtcGxhdGVJZH0nIHJlZmVyZW5jZWQgaW4gdGhlIGdyb3VwICcje2dyb3VwTmFtZX0nIGRvZXMgbm90IGV4aXN0LlwiKVxuXG4gICAgICBAYWRkR3JvdXAoZ3JvdXBOYW1lLCBncm91cCwgdGVtcGxhdGVzKVxuXG5cbiAgYWRkVGVtcGxhdGVzTm90SW5Hcm91cHM6IChnbG9iYWxTdHlsZXMpIC0+XG4gICAgZm9yIHRlbXBsYXRlSWQsIHRlbXBsYXRlRGVmaW5pdGlvbiBvZiBAdGVtcGxhdGVEZWZpbml0aW9uc1xuICAgICAgaWYgdGVtcGxhdGVEZWZpbml0aW9uXG4gICAgICAgIEBhZGQodGVtcGxhdGVEZWZpbml0aW9uLCBAZ2xvYmFsU3R5bGVzKVxuXG5cbiAgYWRkR3JvdXA6IChuYW1lLCBncm91cCwgdGVtcGxhdGVzKSAtPlxuICAgIEBncm91cHNbbmFtZV0gPVxuICAgICAgdGl0bGU6IGdyb3VwLnRpdGxlXG4gICAgICB0ZW1wbGF0ZXM6IHRlbXBsYXRlc1xuXG5cbiAgY3JlYXRlRGVzaWduU3R5bGVDb2xsZWN0aW9uOiAoc3R5bGVzKSAtPlxuICAgIGRlc2lnblN0eWxlcyA9IHt9XG4gICAgaWYgc3R5bGVzXG4gICAgICBmb3Igc3R5bGVEZWZpbml0aW9uIGluIHN0eWxlc1xuICAgICAgICBkZXNpZ25TdHlsZSA9IEBjcmVhdGVEZXNpZ25TdHlsZShzdHlsZURlZmluaXRpb24pXG4gICAgICAgIGRlc2lnblN0eWxlc1tkZXNpZ25TdHlsZS5uYW1lXSA9IGRlc2lnblN0eWxlIGlmIGRlc2lnblN0eWxlXG5cbiAgICBkZXNpZ25TdHlsZXNcblxuXG4gIGNyZWF0ZURlc2lnblN0eWxlOiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIGlmIHN0eWxlRGVmaW5pdGlvbiAmJiBzdHlsZURlZmluaXRpb24ubmFtZVxuICAgICAgbmV3IERlc2lnblN0eWxlXG4gICAgICAgIG5hbWU6IHN0eWxlRGVmaW5pdGlvbi5uYW1lXG4gICAgICAgIHR5cGU6IHN0eWxlRGVmaW5pdGlvbi50eXBlXG4gICAgICAgIG9wdGlvbnM6IHN0eWxlRGVmaW5pdGlvbi5vcHRpb25zXG4gICAgICAgIHZhbHVlOiBzdHlsZURlZmluaXRpb24udmFsdWVcblxuXG4gIHJlbW92ZTogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIEB0ZW1wbGF0ZXMuc3BsaWNlKEBnZXRJbmRleChpZCksIDEpXG5cblxuICBnZXQ6IChpZGVudGlmaWVyKSAtPlxuICAgIEBjaGVja05hbWVzcGFjZSBpZGVudGlmaWVyLCAoaWQpID0+XG4gICAgICB0ZW1wbGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgQGVhY2ggKHQsIGluZGV4KSAtPlxuICAgICAgICBpZiB0LmlkID09IGlkXG4gICAgICAgICAgdGVtcGxhdGUgPSB0XG5cbiAgICAgIHRlbXBsYXRlXG5cblxuICBnZXRJbmRleDogKGlkZW50aWZpZXIpIC0+XG4gICAgQGNoZWNrTmFtZXNwYWNlIGlkZW50aWZpZXIsIChpZCkgPT5cbiAgICAgIGluZGV4ID0gdW5kZWZpbmVkXG4gICAgICBAZWFjaCAodCwgaSkgLT5cbiAgICAgICAgaWYgdC5pZCA9PSBpZFxuICAgICAgICAgIGluZGV4ID0gaVxuXG4gICAgICBpbmRleFxuXG5cbiAgY2hlY2tOYW1lc3BhY2U6IChpZGVudGlmaWVyLCBjYWxsYmFjaykgLT5cbiAgICB7IG5hbWVzcGFjZSwgaWQgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IG5vdCBuYW1lc3BhY2Ugb3IgQG5hbWVzcGFjZSBpcyBuYW1lc3BhY2UsXG4gICAgICBcImRlc2lnbiAjeyBAbmFtZXNwYWNlIH06IGNhbm5vdCBnZXQgdGVtcGxhdGUgd2l0aCBkaWZmZXJlbnQgbmFtZXNwYWNlICN7IG5hbWVzcGFjZSB9IFwiXG5cbiAgICBjYWxsYmFjayhpZClcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdGVtcGxhdGUsIGluZGV4IGluIEB0ZW1wbGF0ZXNcbiAgICAgIGNhbGxiYWNrKHRlbXBsYXRlLCBpbmRleClcblxuXG4gICMgbGlzdCBhdmFpbGFibGUgVGVtcGxhdGVzXG4gIGxpc3Q6IC0+XG4gICAgdGVtcGxhdGVzID0gW11cbiAgICBAZWFjaCAodGVtcGxhdGUpIC0+XG4gICAgICB0ZW1wbGF0ZXMucHVzaCh0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgdGVtcGxhdGVzXG5cblxuICAjIHByaW50IGRvY3VtZW50YXRpb24gZm9yIGEgdGVtcGxhdGVcbiAgaW5mbzogKGlkZW50aWZpZXIpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0KGlkZW50aWZpZXIpXG4gICAgdGVtcGxhdGUucHJpbnREb2MoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZXNpZ25zOiB7fVxuXG4gICMgQ2FuIGxvYWQgYSBkZXNpZ24gc3luY2hyb25vdXNseSBpZiB5b3UgaW5jbHVkZSB0aGVcbiAgIyBkZXNpZ24uanMgZmlsZSBiZWZvcmUgbGl2aW5nZG9jcy5cbiAgIyBkb2MuZGVzaWduLmxvYWQoZGVzaWduc1sneW91ckRlc2lnbiddKVxuICAjXG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gdGhlIGRlZmF1bHQgc291cmNlOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChuYW1lKSAtPlxuICAgIGlmIHR5cGVvZiBuYW1lID09ICdzdHJpbmcnXG4gICAgICBhc3NlcnQgZmFsc2UsICdMb2FkIGRlc2lnbiBieSBuYW1lIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbkNvbmZpZyA9IG5hbWVcbiAgICAgIGRlc2lnbiA9IG5ldyBEZXNpZ24oZGVzaWduQ29uZmlnKVxuICAgICAgQGFkZChkZXNpZ24pXG5cblxuICBhZGQ6IChkZXNpZ24pIC0+XG4gICAgbmFtZSA9IGRlc2lnbi5uYW1lc3BhY2VcbiAgICBAZGVzaWduc1tuYW1lXSA9IGRlc2lnblxuXG5cbiAgaGFzOiAobmFtZSkgLT5cbiAgICBAZGVzaWduc1tuYW1lXT9cblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgYXNzZXJ0IEBoYXMobmFtZSksIFwiRXJyb3I6IGRlc2lnbiAnI3sgbmFtZSB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbbmFtZV1cblxuXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblN0eWxlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdHlwZSwgdmFsdWUsIG9wdGlvbnMgfSkgLT5cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ29wdGlvbidcbiAgICAgICAgYXNzZXJ0IHZhbHVlLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICd2YWx1ZScgcHJvdmlkZWRcIlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgd2hlbiAnc2VsZWN0J1xuICAgICAgICBhc3NlcnQgb3B0aW9ucywgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAnb3B0aW9ucycgcHJvdmlkZWRcIlxuICAgICAgICBAb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogdW5rbm93biB0eXBlICcjeyBAdHlwZSB9J1wiXG5cblxuICAjIEdldCBpbnN0cnVjdGlvbnMgd2hpY2ggY3NzIGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUuXG4gICMgV2UgZG8gbm90IGNvbnRyb2wgdGhlIGNsYXNzIGF0dHJpYnV0ZSBvZiBhIHNuaXBwZXQgRE9NIGVsZW1lbnRcbiAgIyBzaW5jZSB0aGUgVUkgb3Igb3RoZXIgc2NyaXB0cyBjYW4gbWVzcyB3aXRoIGl0IGFueSB0aW1lLiBTbyB0aGVcbiAgIyBpbnN0cnVjdGlvbnMgYXJlIGRlc2lnbmVkIG5vdCB0byBpbnRlcmZlcmUgd2l0aCBvdGhlciBjc3MgY2xhc3Nlc1xuICAjIHByZXNlbnQgaW4gYW4gZWxlbWVudHMgY2xhc3MgYXR0cmlidXRlLlxuICBjc3NDbGFzc0NoYW5nZXM6ICh2YWx1ZSkgLT5cbiAgICBpZiBAdmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogaWYgbm90IHZhbHVlIHRoZW4gW0B2YWx1ZV0gZWxzZSB1bmRlZmluZWRcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModmFsdWUpXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICBlbHNlXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGN1cnJlbnRWYWx1ZVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuICAgICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgICByZW1vdmU6IEBvdGhlckNsYXNzZXModW5kZWZpbmVkKVxuICAgICAgICBhZGQ6IHVuZGVmaW5lZFxuXG5cbiAgdmFsaWRhdGVWYWx1ZTogKHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgIHZhbHVlID09IEB2YWx1ZVxuICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgIEBjb250YWluc09wdGlvbih2YWx1ZSlcbiAgICBlbHNlXG4gICAgICBsb2cud2FybiBcIk5vdCBpbXBsZW1lbnRlZDogRGVzaWduU3R5bGUjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuVmlldyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3ZpZXcnKVxuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEb2N1bWVudCBleHRlbmRzIEV2ZW50RW1pdHRlclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHNuaXBwZXRUcmVlIH0pIC0+XG4gICAgQGRlc2lnbiA9IHNuaXBwZXRUcmVlLmRlc2lnblxuICAgIEBzZXRTbmlwcGV0VHJlZShzbmlwcGV0VHJlZSlcbiAgICBAdmlld3MgPSB7fVxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB1bmRlZmluZWRcblxuXG4gIHNldFNuaXBwZXRUcmVlOiAoc25pcHBldFRyZWUpIC0+XG4gICAgYXNzZXJ0IHNuaXBwZXRUcmVlLmRlc2lnbiA9PSBAZGVzaWduLFxuICAgICAgJ1NuaXBwZXRUcmVlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZXNpZ24gYXMgdGhlIGRvY3VtZW50J1xuXG4gICAgQG1vZGVsID0gQHNuaXBwZXRUcmVlID0gc25pcHBldFRyZWVcbiAgICBAZm9yd2FyZFNuaXBwZXRUcmVlRXZlbnRzKClcblxuXG4gIGZvcndhcmRTbmlwcGV0VHJlZUV2ZW50czogLT5cbiAgICBAc25pcHBldFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBlbWl0ICdjaGFuZ2UnLCBhcmd1bWVudHNcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgb3B0aW9ucy5yZWFkT25seSA/PSB0cnVlXG5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcblxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQHNuaXBwZXRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHByb21pc2UgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG5cbiAgICBwcm9taXNlXG5cblxuICAjIEEgdmlldyBzb21ldGltZXMgaGFzIHRvIGJlIHdyYXBwZWQgaW4gYSBjb250YWluZXIuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIEhlcmUgdGhlIGRvY3VtZW50IGlzIHJlbmRlcmVkIGludG8gJCgnLmRvYy1zZWN0aW9uJylcbiAgIyA8ZGl2IGNsYXNzPVwiaWZyYW1lLWNvbnRhaW5lclwiPlxuICAjICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj48L3NlY3Rpb24+XG4gICMgPC9kaXY+XG4gIGZpbmRXcmFwcGVyOiAoJHBhcmVudCkgLT5cbiAgICBpZiAkcGFyZW50LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIikubGVuZ3RoID09IDFcbiAgICAgICR3cmFwcGVyID0gJCgkcGFyZW50Lmh0bWwoKSlcblxuICAgICR3cmFwcGVyXG5cblxuICBzZXRJbnRlcmFjdGl2ZVZpZXc6ICh2aWV3KSAtPlxuICAgIGFzc2VydCBub3QgQGludGVyYWN0aXZlVmlldz8sXG4gICAgICAnRXJyb3IgY3JlYXRpbmcgaW50ZXJhY3RpdmUgdmlldzogRG9jdW1lbnQgY2FuIGhhdmUgb25seSBvbmUgaW50ZXJhY3RpdmUgdmlldydcblxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB2aWV3XG5cblxuICB0b0h0bWw6IC0+XG4gICAgbmV3IFJlbmRlcmVyKFxuICAgICAgc25pcHBldFRyZWU6IEBzbmlwcGV0VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcbiAgICApLmh0bWwoKVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5zZXJpYWxpemUoKVxuXG5cbiAgdG9Kc29uOiAocHJldHRpZnkpIC0+XG4gICAgZGF0YSA9IEBzZXJpYWxpemUoKVxuICAgIGlmIHByZXR0aWZ5P1xuICAgICAgcmVwbGFjZXIgPSBudWxsXG4gICAgICBzcGFjZSA9IDJcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEsIHJlcGxhY2VyLCBzcGFjZSlcbiAgICBlbHNlXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhKVxuXG5cbiAgIyBEZWJ1Z1xuICAjIC0tLS0tXG5cbiAgIyBQcmludCB0aGUgU25pcHBldFRyZWUuXG4gIHByaW50TW9kZWw6ICgpIC0+XG4gICAgQHNuaXBwZXRUcmVlLnByaW50KClcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERPTSBoZWxwZXIgbWV0aG9kc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiMgTWV0aG9kcyB0byBwYXJzZSBhbmQgdXBkYXRlIHRoZSBEb20gdHJlZSBpbiBhY2NvcmRhbmNlIHRvXG4jIHRoZSBTbmlwcGV0VHJlZSBhbmQgTGl2aW5nZG9jcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG4gIHNuaXBwZXRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNuaXBwZXQgfSg/OiB8JClcIilcbiAgc2VjdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgc25pcHBldCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBTbmlwcGV0cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZFNuaXBwZXRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldFNuaXBwZXRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZFNuaXBwZXRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIHNuaXBwZXRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cbiAgZHJvcFRhcmdldDogKG5vZGUsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgICMgYWJvdmUgY29udGFpbmVyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjbG9zZXN0U25pcHBldERhdGEgPSBAZ2V0Q2xvc2VzdFNuaXBwZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdFNuaXBwZXREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQoY2xvc2VzdFNuaXBwZXREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRDb250YWluZXJUYXJnZXQobm9kZSlcblxuICAgICAgIyBhYm92ZSBzbmlwcGV0XG4gICAgICBlbHNlIGlmIHNuaXBwZXRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldFNuaXBwZXRUYXJnZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcblxuICAgICAgIyBhYm92ZSByb290IGNvbnRhaW5lclxuICAgICAgZWxzZSBpZiBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXREYXRhID0gQGdldENsb3Nlc3RTbmlwcGV0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RTbmlwcGV0RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RTbmlwcGV0VGFyZ2V0KGNsb3Nlc3RTbmlwcGV0RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRTbmlwcGV0VGFyZ2V0OiAoZWxlbSwgeyB0b3AsIGxlZnQsIHBvc2l0aW9uIH0pIC0+XG4gICAgdGFyZ2V0OiAnc25pcHBldCdcbiAgICBzbmlwcGV0VmlldzogQGdldFNuaXBwZXRWaWV3KGVsZW0pXG4gICAgcG9zaXRpb246IHBvc2l0aW9uIHx8IEBnZXRQb3NpdGlvbk9uU25pcHBldChlbGVtLCB7IHRvcCwgbGVmdCB9KVxuXG5cbiAgZ2V0Q2xvc2VzdFNuaXBwZXRUYXJnZXQ6IChjbG9zZXN0U25pcHBldERhdGEpIC0+XG4gICAgZWxlbSA9IGNsb3Nlc3RTbmlwcGV0RGF0YS4kZWxlbVswXVxuICAgIHBvc2l0aW9uID0gY2xvc2VzdFNuaXBwZXREYXRhLnBvc2l0aW9uXG4gICAgQGdldFNuaXBwZXRUYXJnZXQoZWxlbSwgeyBwb3NpdGlvbiB9KVxuXG5cbiAgZ2V0Q29udGFpbmVyVGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuXG4gICAgdGFyZ2V0OiAnY29udGFpbmVyJ1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VmlldzogQGZpbmRTbmlwcGV0Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIHNuaXBwZXRUcmVlID0gJChub2RlKS5kYXRhKCdzbmlwcGV0VHJlZScpXG5cbiAgICB0YXJnZXQ6ICdyb290J1xuICAgIG5vZGU6IG5vZGVcbiAgICBzbmlwcGV0VHJlZTogc25pcHBldFRyZWVcblxuXG4gICMgRmlndXJlIG91dCBpZiB3ZSBzaG91bGQgaW5zZXJ0IGJlZm9yZSBvciBhZnRlciBhIHNuaXBwZXRcbiAgIyBiYXNlZCBvbiB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICBnZXRQb3NpdGlvbk9uU25pcHBldDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IHNuaXBwZXQgaW4gYSBjb250YWluZXIgZm9yIGEgdG9wIGxlZnQgcG9zaXRpb25cbiAgZ2V0Q2xvc2VzdFNuaXBwZXQ6IChjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJHNuaXBwZXRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLnNuaXBwZXQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBjbG9zZXN0U25pcHBldCA9IHVuZGVmaW5lZFxuXG4gICAgJHNuaXBwZXRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RTbmlwcGV0ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICAgY2xvc2VzdFNuaXBwZXQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2FmdGVyJ31cblxuICAgIGNsb3Nlc3RTbmlwcGV0XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgc25pcHBldCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuICAgICAgICAkcGFyZW50ID0gJGVsZW0ucGFyZW50KClcbiAgICAgICAgcGFyZW50SGVpZ2h0ID0gJHBhcmVudC5oZWlnaHQoKVxuICAgICAgICBvdXRlciA9ICRlbGVtLm91dGVySGVpZ2h0KHRydWUpIC0gJGVsZW0uaGVpZ2h0KClcbiAgICAgICAgJGVsZW0uaGVpZ2h0KHBhcmVudEhlaWdodCAtIG91dGVyKVxuICAgICAgICAkZWxlbS5hZGRDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgIyByZW1vdmUgYWxsIGNzcyBzdHlsZSBoZWlnaHQgZGVjbGFyYXRpb25zIGFkZGVkIGJ5XG4gICMgbWF4aW1pemVDb250YWluZXJIZWlnaHQoKVxuICByZXN0b3JlQ29udGFpbmVySGVpZ2h0OiAoKSAtPlxuICAgICQoXCIuI3sgY3NzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgZ2V0RWxlbWVudE5vZGU6IChub2RlKSAtPlxuICAgIGlmIG5vZGU/LmpxdWVyeVxuICAgICAgbm9kZVswXVxuICAgIGVsc2UgaWYgbm9kZT8ubm9kZVR5cGUgPT0gMyAjIE5vZGUuVEVYVF9OT0RFID09IDNcbiAgICAgIG5vZGUucGFyZW50Tm9kZVxuICAgIGVsc2VcbiAgICAgIG5vZGVcblxuXG4gICMgU25pcHBldHMgc3RvcmUgYSByZWZlcmVuY2Ugb2YgdGhlbXNlbHZlcyBpbiB0aGVpciBEb20gbm9kZVxuICAjIGNvbnNpZGVyOiBzdG9yZSByZWZlcmVuY2UgZGlyZWN0bHkgd2l0aG91dCBqUXVlcnlcbiAgZ2V0U25pcHBldFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnc25pcHBldCcpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRHJhZ0Jhc2VcbiNcbiMgU3VwcG9ydGVkIGRyYWcgbW9kZXM6XG4jIC0gRGlyZWN0IChzdGFydCBpbW1lZGlhdGVseSlcbiMgLSBMb25ncHJlc3MgKHN0YXJ0IGFmdGVyIGEgZGVsYXkgaWYgdGhlIGN1cnNvciBkb2VzIG5vdCBtb3ZlIHRvbyBtdWNoKVxuIyAtIE1vdmUgKHN0YXJ0IGFmdGVyIHRoZSBjdXJzb3IgbW92ZWQgYSBtaW51bXVtIGRpc3RhbmNlKVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnQmFzZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UsIG9wdGlvbnMpIC0+XG4gICAgQG1vZGVzID0gWydkaXJlY3QnLCAnbG9uZ3ByZXNzJywgJ21vdmUnXVxuXG4gICAgZGVmYXVsdENvbmZpZyA9XG4gICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcbiAgICAgIG9uRHJhZ1N0YXJ0OiB1bmRlZmluZWRcbiAgICAgIHNjcm9sbEFyZWE6IDUwXG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcbiAgICAgIG1vdmU6XG4gICAgICAgIGRpc3RhbmNlOiAwXG5cbiAgICBAZGVmYXVsdENvbmZpZyA9ICQuZXh0ZW5kKHRydWUsIGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG5cbiAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG4gICAgQG1vZGUgPSBpZiBvcHRpb25zLmRpcmVjdD9cbiAgICAgICdkaXJlY3QnXG4gICAgZWxzZSBpZiBvcHRpb25zLmxvbmdwcmVzcz9cbiAgICAgICdsb25ncHJlc3MnXG4gICAgZWxzZSBpZiBvcHRpb25zLm1vdmU/XG4gICAgICAnbW92ZSdcbiAgICBlbHNlXG4gICAgICAnbG9uZ3ByZXNzJ1xuXG5cbiAgc2V0RHJhZ0hhbmRsZXI6IChkcmFnSGFuZGxlcikgLT5cbiAgICBAZHJhZ0hhbmRsZXIgPSBkcmFnSGFuZGxlclxuICAgIEBkcmFnSGFuZGxlci5wYWdlID0gQHBhZ2VcblxuXG4gICMgc3RhcnQgYSBwb3NzaWJsZSBkcmFnXG4gICMgdGhlIGRyYWcgaXMgb25seSByZWFsbHkgc3RhcnRlZCBpZiBjb25zdHJhaW50cyBhcmUgbm90IHZpb2xhdGVkIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSlcbiAgaW5pdDogKGRyYWdIYW5kbGVyLCBldmVudCwgb3B0aW9ucykgLT5cbiAgICBAcmVzZXQoKVxuICAgIEBpbml0aWFsaXplZCA9IHRydWVcbiAgICBAc2V0T3B0aW9ucyhvcHRpb25zKVxuICAgIEBzZXREcmFnSGFuZGxlcihkcmFnSGFuZGxlcilcbiAgICBAc3RhcnRQb2ludCA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuXG4gICAgQGFkZFN0b3BMaXN0ZW5lcnMoZXZlbnQpXG4gICAgQGFkZE1vdmVMaXN0ZW5lcnMoZXZlbnQpXG5cbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgQGFkZExvbmdwcmVzc0luZGljYXRvcihAc3RhcnRQb2ludClcbiAgICAgIEB0aW1lb3V0ID0gc2V0VGltZW91dCA9PlxuICAgICAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgICAgIEBzdGFydChldmVudClcbiAgICAgICAgLCBAb3B0aW9ucy5sb25ncHJlc3MuZGVsYXlcbiAgICBlbHNlIGlmIEBtb2RlID09ICdkaXJlY3QnXG4gICAgICBAc3RhcnQoZXZlbnQpXG5cbiAgICAjIHByZXZlbnQgYnJvd3NlciBEcmFnICYgRHJvcFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgaWYgQG9wdGlvbnMucHJldmVudERlZmF1bHRcblxuXG4gIG1vdmU6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5sb25ncHJlc3MudG9sZXJhbmNlXG4gICAgICAgIEByZXNldCgpXG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnbW92ZSdcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5tb3ZlLmRpc3RhbmNlXG4gICAgICAgIEBzdGFydChldmVudClcblxuXG4gICMgc3RhcnQgdGhlIGRyYWcgcHJvY2Vzc1xuICBzdGFydDogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBAc3RhcnRlZCA9IHRydWVcblxuICAgICMgcHJldmVudCB0ZXh0LXNlbGVjdGlvbnMgd2hpbGUgZHJhZ2dpbmdcbiAgICBAYWRkQmxvY2tlcigpXG4gICAgQHBhZ2UuJGJvZHkuYWRkQ2xhc3MoY29uZmlnLmNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogLT5cbiAgICBAZHJhZ0hhbmRsZXIuZHJvcCgpIGlmIEBzdGFydGVkXG4gICAgQHJlc2V0KClcblxuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG4gICAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgICBAcGFnZS4kYm9keS5yZW1vdmVDbGFzcyhjb25maWcuY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cblxuICAgIGlmIEBpbml0aWFsaXplZFxuICAgICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgICBAZHJhZ0hhbmRsZXIucmVzZXQoKVxuICAgICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgICBpZiBAdGltZW91dD9cbiAgICAgICAgY2xlYXJUaW1lb3V0KEB0aW1lb3V0KVxuICAgICAgICBAdGltZW91dCA9IHVuZGVmaW5lZFxuXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcbiAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgQHJlbW92ZUJsb2NrZXIoKVxuXG5cbiAgYWRkQmxvY2tlcjogLT5cbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPSdkcmFnQmxvY2tlcic+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGJsb2NrZXIpXG5cblxuICByZW1vdmVCbG9ja2VyOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoJy5kcmFnQmxvY2tlcicpLnJlbW92ZSgpXG5cblxuXG4gIGFkZExvbmdwcmVzc0luZGljYXRvcjogKHsgcGFnZVgsIHBhZ2VZIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAb3B0aW9ucy5sb25ncHJlc3Muc2hvd0luZGljYXRvclxuICAgICRpbmRpY2F0b3IgPSAkKFwiPGRpdiBjbGFzcz1cXFwiI3sgY29uZmlnLmNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNvbmZpZy5jc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgPT5cbiAgICAgIEBkcm9wKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gc25pcHBldERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSAjIGFsbCBvdGhlciBpbnB1dCBkZXZpY2VzIGJlaGF2ZSBsaWtlIGEgbW91c2VcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuXG4gIGdldEV2ZW50UG9zaXRpb246IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyB8fCBldmVudC50eXBlID09ICd0b3VjaG1vdmUnXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF1cblxuICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFhcbiAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgcGFnZVg6IGV2ZW50LnBhZ2VYXG4gICAgcGFnZVk6IGV2ZW50LnBhZ2VZXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5wYWdlWCAtIHBvaW50Qi5wYWdlWFxuICAgIGRpc3RZID0gcG9pbnRBLnBhZ2VZIC0gcG9pbnRCLnBhZ2VZXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgRWRpdGFibGVKUyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgRWRpdGFibGVKUyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cbiAgICAjIEluaXRpYWxpemUgRWRpdGFibGVKU1xuICAgIEBlZGl0YWJsZSA9IG5ldyBFZGl0YWJsZSh3aW5kb3c6IEBwYWdlLndpbmRvdyk7XG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBlZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggRWRpdGFibGVKUy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgQGVkaXRhYmxlLmFkZChub2RlcylcblxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLnN1c3BlbmQoKVxuXG5cbiAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLmNvbnRpbnVlKClcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgRWRpdGFibGVKU1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZFNuaXBwZXRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZhbHVlID0gdmlldy5nZXQoZWRpdGFibGVOYW1lKVxuICAgIGlmIGNvbmZpZy5zaW5nbGVMaW5lQnJlYWsudGVzdCh2YWx1ZSkgfHwgdmFsdWUgPT0gJydcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkXG5cbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgYmx1cjogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmJsdXJFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lKVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgc25pcHBldE5hbWUgPSBAcGFnZS5kZXNpZ24ucGFyYWdyYXBoU25pcHBldFxuICAgICAgdGVtcGxhdGUgPSBAcGFnZS5kZXNpZ24uZ2V0KHNuaXBwZXROYW1lKVxuICAgICAgY29weSA9IHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3XG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcblxuICAgICAgICAjIGNyZWF0ZSBkb2N1bWVudCBmcmFnbWVudFxuICAgICAgICBjb250ZW50cyA9IHZpZXcuZGlyZWN0aXZlcy4kZ2V0RWxlbShlZGl0YWJsZU5hbWUpLmNvbnRlbnRzKClcbiAgICAgICAgZnJhZyA9IEBwYWdlLmRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICAgICAgICBmb3IgZWwgaW4gY29udGVudHNcbiAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKGVsKVxuXG4gICAgICAgIG1lcmdlZFZpZXcuZm9jdXMoKVxuICAgICAgICBlbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgICAgY3Vyc29yID0gQGVkaXRhYmxlLmNyZWF0ZUN1cnNvcihlbGVtLCBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiAnZW5kJyBlbHNlICdiZWdpbm5pbmcnKVxuICAgICAgICBjdXJzb3JbIGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuICdpbnNlcnRBZnRlcicgZWxzZSAnaW5zZXJ0QmVmb3JlJyBdKGZyYWcpXG5cbiAgICAgICAgIyBNYWtlIHN1cmUgdGhlIG1vZGVsIG9mIHRoZSBtZXJnZWRWaWV3IGlzIHVwIHRvIGRhdGVcbiAgICAgICAgIyBvdGhlcndpc2UgYnVncyBsaWtlIGluIGlzc3VlICM1NiBjYW4gb2NjdXIuXG4gICAgICAgIGN1cnNvci5zYXZlKClcbiAgICAgICAgQHVwZGF0ZU1vZGVsKG1lcmdlZFZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgICAgY3Vyc29yLnJlc3RvcmUoKVxuXG4gICAgICAgIHZpZXcubW9kZWwucmVtb3ZlKClcbiAgICAgICAgY3Vyc29yLnNldFNlbGVjdGlvbigpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGVKUyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcbiAgICAgIGNvcHkgPSB2aWV3LnRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuICAgICAgIyBnZXQgY29udGVudCBvdXQgb2YgJ2JlZm9yZScgYW5kICdhZnRlcidcbiAgICAgIGJlZm9yZUNvbnRlbnQgPSBiZWZvcmUucXVlcnlTZWxlY3RvcignKicpLmlubmVySFRNTFxuICAgICAgYWZ0ZXJDb250ZW50ID0gYWZ0ZXIucXVlcnlTZWxlY3RvcignKicpLmlubmVySFRNTFxuXG4gICAgICAjIHNldCBlZGl0YWJsZSBvZiBzbmlwcGV0cyB0byBpbm5lckhUTUwgb2YgZnJhZ21lbnRzXG4gICAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIGJlZm9yZUNvbnRlbnQpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIGFmdGVyQ29udGVudClcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2Ygc25pcHBldFxuICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgdmlldy5uZXh0KCkuZm9jdXMoKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIHNlbGVjdGlvbkNoYW5nZWQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIHNlbGVjdGlvbikgLT5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAc2VsZWN0aW9uLmZpcmUodmlldywgZWxlbWVudCwgc2VsZWN0aW9uKVxuXG5cbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlSlMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGhhc1NpbmdsZUVkaXRhYmxlOiAodmlldykgLT5cbiAgICB2aWV3LmRpcmVjdGl2ZXMubGVuZ3RoID09IDEgJiYgdmlldy5kaXJlY3RpdmVzWzBdLnR5cGUgPT0gJ2VkaXRhYmxlJ1xuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIERvY3VtZW50IEZvY3VzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgc25pcHBldCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBzbmlwcGV0VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQHNuaXBwZXRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKHNuaXBwZXRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIHNuaXBwZXRWaWV3ICE9IEBzbmlwcGV0Vmlld1xuICAgICAgQHJlc2V0U25pcHBldFZpZXcoKVxuICAgICAgaWYgc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRWaWV3ID0gc25pcHBldFZpZXdcbiAgICAgICAgQHNuaXBwZXRGb2N1cy5maXJlKEBzbmlwcGV0VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBzbmlwcGV0VmlldyB8fD0gZG9tLmZpbmRTbmlwcGV0VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoc25pcHBldFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAc25pcHBldFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBzbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIGlmIEBzbmlwcGV0VmlldyAhPSBzbmlwcGV0Vmlld1xuICAgICAgQHNldEZvY3VzKHNuaXBwZXRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0U25pcHBldFZpZXc6IC0+XG4gICAgaWYgQHNuaXBwZXRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBzbmlwcGV0Vmlld1xuICAgICAgQHNuaXBwZXRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAc25pcHBldEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuY3NzID0gY29uZmlnLmNzc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXREcmFnXG5cbiAgd2lnZ2xlU3BhY2UgPSAwXG4gIHN0YXJ0QW5kRW5kT2Zmc2V0ID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldyB9KSAtPlxuICAgIEAkdmlldyA9IHNuaXBwZXRWaWV3LiRodG1sIGlmIHNuaXBwZXRWaWV3XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBzdGFydDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLmRpc2FibGVBbGwoKVxuICAgIEBwYWdlLmJsdXJGb2N1c2VkRWxlbWVudCgpXG5cbiAgICAjIHBsYWNlaG9sZGVyIGJlbG93IGN1cnNvclxuICAgIEAkcGxhY2Vob2xkZXIgPSBAY3JlYXRlUGxhY2Vob2xkZXIoKS5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgIEAkZHJhZ0Jsb2NrZXIgPSBAcGFnZS4kYm9keS5maW5kKCcuZHJhZ0Jsb2NrZXInKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIHNuaXBwZXRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LnNuaXBwZXRWaWV3Py5tb2RlbCAhPSBAc25pcHBldE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuc25pcHBldFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnNuaXBwZXRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuc25pcHBldFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIEBzbmlwcGV0UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIHNuaXBwZXRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5zbmlwcGV0Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQHNuaXBwZXRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHMoYmVmb3JlLCB0YXJnZXQuc25pcHBldFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuc25pcHBldFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAc25pcHBldE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQHNuaXBwZXRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuU25pcHBldHModGFyZ2V0LnNuaXBwZXRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LnNuaXBwZXRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlblNuaXBwZXRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXRcbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyOiAoZWxlbSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW0/XG5cbiAgICBAbWFrZVNwYWNlKGVsZW0ubGFzdENoaWxkLCAnYm90dG9tJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LmJvdHRvbSAtIHN0YXJ0QW5kRW5kT2Zmc2V0XG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG4gICAgICBlbGVtID0gQHBhZ2UuZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2Uuc25pcHBldFdhc0Ryb3BwZWQuZmlyZShAc25pcHBldE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgc25pcHBldCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ3NuaXBwZXQnXG4gICAgICAgIHNuaXBwZXRWaWV3ID0gdGFyZ2V0LnNuaXBwZXRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIHNuaXBwZXRWaWV3Lm1vZGVsLmJlZm9yZShAc25pcHBldE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc25pcHBldFZpZXcubW9kZWwuYWZ0ZXIoQHNuaXBwZXRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgc25pcHBldE1vZGVsID0gdGFyZ2V0LnNuaXBwZXRWaWV3Lm1vZGVsXG4gICAgICAgIHNuaXBwZXRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBzbmlwcGV0TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBzbmlwcGV0VHJlZSA9IHRhcmdldC5zbmlwcGV0VHJlZVxuICAgICAgICBzbmlwcGV0VHJlZS5wcmVwZW5kKEBzbmlwcGV0TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCIjIENhbiByZXBsYWNlIHhtbGRvbSBpbiB0aGUgYnJvd3Nlci5cbiMgTW9yZSBhYm91dCB4bWxkb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qaW5kdy94bWxkb21cbiNcbiMgT24gbm9kZSB4bWxkb20gaXMgcmVxdWlyZWQuIEluIHRoZSBicm93c2VyXG4jIERPTVBhcnNlciBhbmQgWE1MU2VyaWFsaXplciBhcmUgYWxyZWFkeSBuYXRpdmUgb2JqZWN0cy5cblxuIyBET01QYXJzZXJcbmV4cG9ydHMuRE9NUGFyc2VyID0gY2xhc3MgRE9NUGFyc2VyU2hpbVxuXG4gIHBhcnNlRnJvbVN0cmluZzogKHhtbFRlbXBsYXRlKSAtPlxuICAgICMgbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyh4bWxUZW1wbGF0ZSkgZG9lcyBub3Qgd29yayB0aGUgc2FtZVxuICAgICMgaW4gdGhlIGJyb3dzZXIgYXMgd2l0aCB4bWxkb20uIFNvIHdlIHVzZSBqUXVlcnkgdG8gbWFrZSB0aGluZ3Mgd29yay5cbiAgICAkLnBhcnNlWE1MKHhtbFRlbXBsYXRlKVxuXG5cbiMgWE1MU2VyaWFsaXplclxuZXhwb3J0cy5YTUxTZXJpYWxpemVyID0gWE1MU2VyaWFsaXplclxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBzbmlwcGV0cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlZmF1bHRJbWFnZU1hbmFnZXJcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICAjIGVtcHR5XG5cblxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW1nVGFnKCRlbGVtKVxuICAgICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDBcblxuXG4gIGlzSW1nVGFnOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcblJlc3JjaXRJbWFnZU1hbmFnZXIgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2VfbWFuYWdlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZWZhdWx0SW1hZ2VNYW5hZ2VyID0gbmV3IERlZmF1bHRJbWFnZU1hbmFnZXIoKVxuICByZXNyY2l0SW1hZ2VNYW5hZ2VyID0gbmV3IFJlc3JjaXRJbWFnZU1hbmFnZXIoKVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlLCBpbWFnZVNlcnZpY2UpIC0+XG4gICAgaW1hZ2VNYW5hZ2VyID0gQF9nZXRJbWFnZU1hbmFnZXIoaW1hZ2VTZXJ2aWNlKVxuICAgIGltYWdlTWFuYWdlci5zZXQoJGVsZW0sIHZhbHVlKVxuXG5cbiAgX2dldEltYWdlTWFuYWdlcjogKGltYWdlU2VydmljZSkgLT5cbiAgICBzd2l0Y2ggaW1hZ2VTZXJ2aWNlXG4gICAgICB3aGVuICdyZXNyYy5pdCcgdGhlbiByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4gICAgICBlbHNlXG4gICAgICAgIGRlZmF1bHRJbWFnZU1hbmFnZXJcblxuXG4gIGdldERlZmF1bHRJbWFnZU1hbmFnZXI6IC0+XG4gICAgZGVmYXVsdEltYWdlTWFuYWdlclxuXG5cbiAgZ2V0UmVzcmNpdEltYWdlTWFuYWdlcjogLT5cbiAgICByZXNyY2l0SW1hZ2VNYW5hZ2VyXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgQHNuaXBwZXRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciB9KSAtPlxuICAgIGFzc2VydCBAc25pcHBldFRyZWUsICdubyBzbmlwcGV0IHRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAc25pcHBldFZpZXdzID0ge31cblxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgcmV0dXJuIHVubGVzcyAkaW5zZXJ0Lmxlbmd0aFxuXG4gICAgICBAJHdyYXBwZXIgPSBAJHJvb3RcbiAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuXG4gIHJlbmRlck9uY2VQYWdlUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmluY3JlbWVudCgpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5yZWFkeSA9PlxuICAgICAgQHNldFJvb3QoKVxuICAgICAgQHJlbmRlcigpXG4gICAgICBAc2V0dXBTbmlwcGV0VHJlZUxpc3RlbmVycygpXG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaXNSZWFkeSgpXG5cblxuICBodG1sOiAtPlxuICAgIGFzc2VydCBAaXNSZWFkeSgpLCAnQ2Fubm90IGdlbmVyYXRlIGh0bWwuIFJlbmRlcmVyIGlzIG5vdCByZWFkeS4nXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5odG1sKClcblxuXG4gICMgU25pcHBldCBUcmVlIEV2ZW50IEhhbmRsaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0dXBTbmlwcGV0VHJlZUxpc3RlbmVyczogLT5cbiAgICBAc25pcHBldFRyZWUuc25pcHBldEFkZGVkLmFkZCggJC5wcm94eShAc25pcHBldEFkZGVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRSZW1vdmVkLmFkZCggJC5wcm94eShAc25pcHBldFJlbW92ZWQsIHRoaXMpIClcbiAgICBAc25pcHBldFRyZWUuc25pcHBldE1vdmVkLmFkZCggJC5wcm94eShAc25pcHBldE1vdmVkLCB0aGlzKSApXG4gICAgQHNuaXBwZXRUcmVlLnNuaXBwZXRDb250ZW50Q2hhbmdlZC5hZGQoICQucHJveHkoQHNuaXBwZXRDb250ZW50Q2hhbmdlZCwgdGhpcykgKVxuICAgIEBzbmlwcGV0VHJlZS5zbmlwcGV0SHRtbENoYW5nZWQuYWRkKCAkLnByb3h5KEBzbmlwcGV0SHRtbENoYW5nZWQsIHRoaXMpIClcblxuXG4gIHNuaXBwZXRBZGRlZDogKG1vZGVsKSAtPlxuICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldFJlbW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlU25pcHBldChtb2RlbClcbiAgICBAZGVsZXRlQ2FjaGVkU25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKVxuXG5cbiAgc25pcHBldE1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZVNuaXBwZXQobW9kZWwpXG4gICAgQGluc2VydFNuaXBwZXQobW9kZWwpXG5cblxuICBzbmlwcGV0Q29udGVudENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAc25pcHBldFZpZXdGb3JTbmlwcGV0KG1vZGVsKS51cGRhdGVDb250ZW50KClcblxuXG4gIHNuaXBwZXRIdG1sQ2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnVwZGF0ZUh0bWwoKVxuXG5cbiAgIyBSZW5kZXJpbmdcbiAgIyAtLS0tLS0tLS1cblxuXG4gIHNuaXBwZXRWaWV3Rm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld3NbbW9kZWwuaWRdIHx8PSBtb2RlbC5jcmVhdGVWaWV3KEByZW5kZXJpbmdDb250YWluZXIuaXNSZWFkT25seSlcblxuXG4gIGRlbGV0ZUNhY2hlZFNuaXBwZXRWaWV3Rm9yU25pcHBldDogKG1vZGVsKSAtPlxuICAgIGRlbGV0ZSBAc25pcHBldFZpZXdzW21vZGVsLmlkXVxuXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzbmlwcGV0VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBpbnNlcnRTbmlwcGV0KG1vZGVsKVxuXG5cbiAgY2xlYXI6IC0+XG4gICAgQHNuaXBwZXRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcblxuICAgIEAkcm9vdC5lbXB0eSgpXG5cblxuICByZWRyYXc6IC0+XG4gICAgQGNsZWFyKClcbiAgICBAcmVuZGVyKClcblxuXG4gIGluc2VydFNuaXBwZXQ6IChtb2RlbCkgLT5cbiAgICByZXR1cm4gaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsKVxuXG4gICAgaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsLnByZXZpb3VzKVxuICAgICAgQGluc2VydFNuaXBwZXRBc1NpYmxpbmcobW9kZWwucHJldmlvdXMsIG1vZGVsKVxuICAgIGVsc2UgaWYgQGlzU25pcHBldEF0dGFjaGVkKG1vZGVsLm5leHQpXG4gICAgICBAaW5zZXJ0U25pcHBldEFzU2libGluZyhtb2RlbC5uZXh0LCBtb2RlbClcbiAgICBlbHNlIGlmIG1vZGVsLnBhcmVudENvbnRhaW5lclxuICAgICAgQGFwcGVuZFNuaXBwZXRUb1BhcmVudENvbnRhaW5lcihtb2RlbClcbiAgICBlbHNlXG4gICAgICBsb2cuZXJyb3IoJ1NuaXBwZXQgY291bGQgbm90IGJlIGluc2VydGVkIGJ5IHJlbmRlcmVyLicpXG5cbiAgICBzbmlwcGV0VmlldyA9IEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpXG4gICAgc25pcHBldFZpZXcuc2V0QXR0YWNoZWRUb0RvbSh0cnVlKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIuc25pcHBldFZpZXdXYXNJbnNlcnRlZChzbmlwcGV0VmlldylcbiAgICBAYXR0YWNoQ2hpbGRTbmlwcGV0cyhtb2RlbClcblxuXG4gIGlzU25pcHBldEF0dGFjaGVkOiAobW9kZWwpIC0+XG4gICAgbW9kZWwgJiYgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuaXNBdHRhY2hlZFRvRG9tXG5cblxuICBhdHRhY2hDaGlsZFNuaXBwZXRzOiAobW9kZWwpIC0+XG4gICAgbW9kZWwuY2hpbGRyZW4gKGNoaWxkTW9kZWwpID0+XG4gICAgICBpZiBub3QgQGlzU25pcHBldEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRTbmlwcGV0KGNoaWxkTW9kZWwpXG5cblxuICBpbnNlcnRTbmlwcGV0QXNTaWJsaW5nOiAoc2libGluZywgbW9kZWwpIC0+XG4gICAgbWV0aG9kID0gaWYgc2libGluZyA9PSBtb2RlbC5wcmV2aW91cyB0aGVuICdhZnRlcicgZWxzZSAnYmVmb3JlJ1xuICAgIEAkbm9kZUZvclNuaXBwZXQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JTbmlwcGV0KG1vZGVsKSlcblxuXG4gIGFwcGVuZFNuaXBwZXRUb1BhcmVudENvbnRhaW5lcjogKG1vZGVsKSAtPlxuICAgIEAkbm9kZUZvclNuaXBwZXQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JTbmlwcGV0OiAobW9kZWwpIC0+XG4gICAgQHNuaXBwZXRWaWV3Rm9yU25pcHBldChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAc25pcHBldFZpZXdGb3JTbmlwcGV0KGNvbnRhaW5lci5wYXJlbnRTbmlwcGV0KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlU25pcHBldDogKG1vZGVsKSAtPlxuICAgIEBzbmlwcGV0Vmlld0ZvclNuaXBwZXQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yU25pcHBldChtb2RlbCkuZGV0YWNoKClcblxuIiwiRGVmYXVsdEltYWdlTWFuYWdlciA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9tYW5hZ2VyJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc2NyaXRJbWFnZU1hbmFnZXIgZXh0ZW5kcyBEZWZhdWx0SW1hZ2VNYW5hZ2VyXG5cbiAgQHJlc3JjaXRVcmw6ICdodHRwOi8vdHJpYWwucmVzcmMuaXQvJ1xuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgIyBlbXB0eVxuXG5cbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB2YWx1ZSkgaWYgQGlzQmFzZTY0KHZhbHVlKVxuXG4gICAgYXNzZXJ0IHZhbHVlPyAmJiB2YWx1ZSAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICAkZWxlbS5hZGRDbGFzcygncmVzcmMnKVxuICAgIGlmIEBpc0ltZ1RhZygkZWxlbSlcbiAgICAgIEByZXNldFNyY0F0dHJpYnV0ZSgkZWxlbSkgaWYgJGVsZW0uYXR0cignc3JjJykgJiYgQGlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCBcIiN7UmVzY3JpdEltYWdlTWFuYWdlci5yZXNyY2l0VXJsfSN7dmFsdWV9XCIpXG4gICAgZWxzZVxuICAgICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3tSZXNjcml0SW1hZ2VNYW5hZ2VyLnJlc3JjaXRVcmx9I3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbWdUYWcoJGVsZW0pXG4gICAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgcmVzZXRTcmNBdHRyaWJ1dGU6ICgkZWxlbSkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuSW1hZ2VNYW5hZ2VyID0gcmVxdWlyZSgnLi9pbWFnZV9tYW5hZ2VyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmlwcGV0Vmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbW9kZWwsIEAkaHRtbCwgQGRpcmVjdGl2ZXMsIEBpc1JlYWRPbmx5IH0pIC0+XG4gICAgQCRlbGVtID0gQCRodG1sXG4gICAgQHRlbXBsYXRlID0gQG1vZGVsLnRlbXBsYXRlXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IGZhbHNlXG4gICAgQHdhc0F0dGFjaGVkVG9Eb20gPSAkLkNhbGxiYWNrcygpO1xuXG4gICAgdW5sZXNzIEBpc1JlYWRPbmx5XG4gICAgICAjIGFkZCBhdHRyaWJ1dGVzIGFuZCByZWZlcmVuY2VzIHRvIHRoZSBodG1sXG4gICAgICBAJGh0bWxcbiAgICAgICAgLmRhdGEoJ3NuaXBwZXQnLCB0aGlzKVxuICAgICAgICAuYWRkQ2xhc3MoY3NzLnNuaXBwZXQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50LCBAbW9kZWwudGVtcG9yYXJ5Q29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ3NuaXBwZXQnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3Muc25pcHBldEhpZ2hsaWdodClcbiAgICBAc2hvd09wdGlvbmFscygpXG5cblxuICBhZnRlckJsdXJyZWQ6ICgpIC0+XG4gICAgQCRodG1sLnJlbW92ZUNsYXNzKGNzcy5zbmlwcGV0SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLnNuaXBwZXRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQsIHNlc3Npb25Db250ZW50KSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBjb250ZW50XG4gICAgICBpZiBzZXNzaW9uQ29udGVudFtuYW1lXT8gJiYgKCAhdmFsdWU/IHx8IHZhbHVlID09ICcnIClcbiAgICAgICAgQHNldChuYW1lLCBzZXNzaW9uQ29udGVudFtuYW1lXSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIHZhbHVlXG4gICAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcbiAgICBlbHNlXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylbbmFtZV0gaWYgQG1vZGVsLmRhdGEoJ2ltYWdlU2VydmljZScpXG4gICAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0pXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kYXRhKCdpbWFnZVNlcnZpY2UnKVtuYW1lXSBpZiBAbW9kZWwuZGF0YSgnaW1hZ2VTZXJ2aWNlJylcbiAgICBJbWFnZU1hbmFnZXIuc2V0KCRlbGVtLCB2YWx1ZSwgaW1hZ2VTZXJ2aWNlKVxuXG5cbiAgc3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAc25pcHBldFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgaG9zdFdpbmRvdzogaWZyYW1lLmNvbnRlbnRXaW5kb3dcbiAgICAgIGRlc2lnbjogQHNuaXBwZXRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG4gICAgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIHNuaXBwZXRUcmVlOiBAc25pcHBldFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSB9PXt9KSAtPlxuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIlNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5TbmlwcGV0RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL3NuaXBwZXRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBzbmlwcGV0V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBzbmlwcGV0TW9kZWwsIHNuaXBwZXRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0TW9kZWwgfHwgc25pcHBldFZpZXdcbiAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0Vmlldy5tb2RlbCBpZiBzbmlwcGV0Vmlld1xuXG4gICAgc25pcHBldERyYWcgPSBuZXcgU25pcHBldERyYWdcbiAgICAgIHNuaXBwZXRNb2RlbDogc25pcHBldE1vZGVsXG4gICAgICBzbmlwcGV0Vmlldzogc25pcHBldFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChzbmlwcGV0RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuU25pcHBldERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9zbmlwcGV0X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIFNuaXBwZXRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChzbmlwcGV0VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAc25pcHBldFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAc25pcHBldFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuc25pcHBldEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJTbmlwcGV0Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5zbmlwcGV0Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyU25pcHBldEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdjbGljay5saXZpbmdkb2NzJywgJC5wcm94eShAY2xpY2ssIHRoaXMpKVxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlP1xuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgcmV0dXJuIHVubGVzcyBzbmlwcGV0Vmlld1xuXG4gICAgQHN0YXJ0RHJhZ1xuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG4gICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgc25pcHBldE1vZGVsLCBzbmlwcGV0VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc25pcHBldE1vZGVsIHx8IHNuaXBwZXRWaWV3XG4gICAgc25pcHBldE1vZGVsID0gc25pcHBldFZpZXcubW9kZWwgaWYgc25pcHBldFZpZXdcblxuICAgIHNuaXBwZXREcmFnID0gbmV3IFNuaXBwZXREcmFnXG4gICAgICBzbmlwcGV0TW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgc25pcHBldFZpZXc6IHNuaXBwZXRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoc25pcHBldERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjbGljazogKGV2ZW50KSAtPlxuICAgIHNuaXBwZXRWaWV3ID0gZG9tLmZpbmRTbmlwcGV0VmlldyhldmVudC50YXJnZXQpXG4gICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcblxuICAgICMgdG9kbzogaWYgYSB1c2VyIGNsaWNrZWQgb24gYSBtYXJnaW4gb2YgYSBzbmlwcGV0IGl0IHNob3VsZFxuICAgICMgc3RpbGwgZ2V0IHNlbGVjdGVkLiAoaWYgYSBzbmlwcGV0IGlzIGZvdW5kIGJ5IHBhcmVudFNuaXBwZXRcbiAgICAjIGFuZCB0aGF0IHNuaXBwZXQgaGFzIG5vIGNoaWxkcmVuIHdlIGRvIG5vdCBuZWVkIHRvIHNlYXJjaClcblxuICAgICMgaWYgc25pcHBldCBoYXNDaGlsZHJlbiwgbWFrZSBzdXJlIHdlIGRpZG4ndCB3YW50IHRvIHNlbGVjdFxuICAgICMgYSBjaGlsZFxuXG4gICAgIyBpZiBubyBzbmlwcGV0IHdhcyBzZWxlY3RlZCBjaGVjayBpZiB0aGUgdXNlciB3YXMgbm90IGNsaWNraW5nXG4gICAgIyBvbiBhIG1hcmdpbiBvZiBhIHNuaXBwZXRcblxuICAgICMgdG9kbzogY2hlY2sgaWYgdGhlIGNsaWNrIHdhcyBtZWFudCBmb3IgYSBzbmlwcGV0IGNvbnRhaW5lclxuICAgIGlmIHNuaXBwZXRWaWV3XG4gICAgICBAZm9jdXMuc25pcHBldEZvY3VzZWQoc25pcHBldFZpZXcpXG5cbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKHNuaXBwZXRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShzbmlwcGV0Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBzbmlwcGV0Vmlld1dhc0luc2VydGVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoc25pcHBldFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoc25pcHBldFZpZXcpIC0+XG4gICAgaWYgc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gc25pcHBldFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJTbmlwcGV0Rm9jdXNlZDogKHNuaXBwZXRWaWV3KSAtPlxuICAgIHNuaXBwZXRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlclNuaXBwZXRCbHVycmVkOiAoc25pcHBldFZpZXcpIC0+XG4gICAgc25pcHBldFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbiMgQSBQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUmVuZGVyaW5nQ29udGFpbmVyIHdoaWNoIGlzIGludGVuZGVkIHRvIGJlIHNob3duIHRvXG4jIHRoZSB1c2VyLiBJdCBoYXMgYSBMb2FkZXIgd2hpY2ggYWxsb3dzIHlvdSB0byBpbmplY3QgQ1NTIGFuZCBKUyBmaWxlcyBpbnRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBQYWdlIGV4dGVuZHMgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIHJlYWRPbmx5LCBob3N0V2luZG93LCBAZGVzaWduLCBAc25pcHBldFRyZWUgfT17fSkgLT5cbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcblxuICAgIHN1cGVyKClcblxuICAgIEBzZXRSZW5kZXJOb2RlKHJlbmRlck5vZGUpXG4gICAgIyBzdG9yZSByZWZlcmVuY2UgdG8gc25pcHBldFRyZWVcbiAgICAkKEByZW5kZXJOb2RlKS5kYXRhKCdzbmlwcGV0VHJlZScsIEBzbmlwcGV0VHJlZSlcbiAgICBAY3NzTG9hZGVyID0gbmV3IENzc0xvYWRlcihAd2luZG93KVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgc2V0UmVuZGVyTm9kZTogKHJlbmRlck5vZGUpIC0+XG4gICAgcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcbiAgICBpZiByZW5kZXJOb2RlLmpxdWVyeVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlWzBdXG4gICAgZWxzZVxuICAgICAgQHJlbmRlck5vZGUgPSByZW5kZXJOb2RlXG5cblxuICBiZWZvcmVSZWFkeTogLT5cbiAgICAjIGFsd2F5cyBpbml0aWFsaXplIGEgcGFnZSBhc3luY2hyb25vdXNseVxuICAgIEByZWFkeVNlbWFwaG9yZS53YWl0KClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcbiAgICAsIDBcblxuXG4gIGJlZm9yZVBhZ2VSZWFkeTogPT5cbiAgICBpZiBAZGVzaWduPyAmJiBjb25maWcubG9hZFJlc291cmNlc1xuICAgICAgZGVzaWduUGF0aCA9IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWVzcGFjZSB9XCJcbiAgICAgIGNzc0xvY2F0aW9uID0gaWYgQGRlc2lnbi5jc3M/XG4gICAgICAgIEBkZXNpZ24uY3NzXG4gICAgICBlbHNlXG4gICAgICAgICcvY3NzL3N0eWxlLmNzcydcblxuICAgICAgcGF0aCA9IFwiI3sgZGVzaWduUGF0aCB9I3sgY3NzTG9jYXRpb24gfVwiXG4gICAgICBAY3NzTG9hZGVyLmxvYWQocGF0aCwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3cgfHwgd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIFNuaXBwZXRWaWV3cyBpbnRvIHRoZSBSZW5kZXJpbmdDb250YWluZXIgYW5kIG5vdGlmaWVzIGl0XG4jIG9mIHRoZSBpbnNlcnRpb24uXG4jXG4jIFRoZSBSZW5kZXJpbmdDb250YWluZXIgaXMgaW50ZW5kZWQgZm9yIGdlbmVyYXRpbmcgSFRNTC4gUGFnZSBpcyBhIHN1YmNsYXNzIG9mXG4jIHRoaXMgYmFzZSBjbGFzcyB0aGF0IGlzIGludGVuZGVkIGZvciBkaXNwbGF5aW5nIHRvIHRoZSB1c2VyLiBJbnRlcmFjdGl2ZVBhZ2VcbiMgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFkZHMgaW50ZXJhY3Rpdml0eSwgYW5kIHRodXMgZWRpdGFiaWxpdHksIHRvIHRoZVxuIyBwYWdlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBpc1JlYWRPbmx5OiB0cnVlXG5cblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcmVuZGVyTm9kZSA9ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIHNuaXBwZXRWaWV3V2FzSW5zZXJ0ZWQ6IChzbmlwcGV0VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiIyBqUXVlcnkgbGlrZSByZXN1bHRzIHdoZW4gc2VhcmNoaW5nIGZvciBzbmlwcGV0cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgU25pcHBldEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIFNuaXBwZXRBcnJheSB2aWEgYGRvYy5mbmAuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRBcnJheVxuXG5cbiAgIyBAcGFyYW0gc25pcHBldHM6IGFycmF5IG9mIHNuaXBwZXRzXG4gIGNvbnN0cnVjdG9yOiAoQHNuaXBwZXRzKSAtPlxuICAgIEBzbmlwcGV0cyA9IFtdIHVubGVzcyBAc25pcHBldHM/XG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBzbmlwcGV0c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAc25pcHBldHMubGVuZ3RoXG4gICAgaWYgQHNuaXBwZXRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0BzbmlwcGV0cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBzbmlwcGV0IGluIEBzbmlwcGV0c1xuICAgICAgY2FsbGJhY2soc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgIHNuaXBwZXQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFNuaXBwZXRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIFNuaXBwZXRDb250YWluZXIgY29udGFpbnMgYW5kIG1hbmFnZXMgYSBsaW5rZWQgbGlzdFxuIyBvZiBzbmlwcGV0cy5cbiNcbiMgVGhlIHNuaXBwZXRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIHNuaXBwZXRUcmVlXG4jIGluZm9ybWVkIGFib3V0IGNoYW5nZXMgKG9ubHkgaWYgdGhleSBhcmUgYXR0YWNoZWQgdG8gb25lKS5cbiNcbiMgQHByb3AgZmlyc3Q6IGZpcnN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IHNuaXBwZXQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRTbmlwcGV0OiBwYXJlbnQgU25pcHBldE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuaXBwZXRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50U25pcHBldCwgQG5hbWUsIGlzUm9vdCB9KSAtPlxuICAgIEBpc1Jvb3QgPSBpc1Jvb3Q/XG4gICAgQGZpcnN0ID0gQGxhc3QgPSB1bmRlZmluZWRcblxuXG4gIHByZXBlbmQ6IChzbmlwcGV0KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIHNuaXBwZXQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaFNuaXBwZXQoc25pcHBldClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKHNuaXBwZXQpIC0+XG4gICAgaWYgQHBhcmVudFNuaXBwZXRcbiAgICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgQHBhcmVudFNuaXBwZXQsICdjYW5ub3QgYXBwZW5kIHNuaXBwZXQgdG8gaXRzZWxmJ1xuXG4gICAgaWYgQGxhc3RcbiAgICAgIEBpbnNlcnRBZnRlcihAbGFzdCwgc25pcHBldClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoU25pcHBldChzbmlwcGV0KVxuXG4gICAgdGhpc1xuXG5cbiAgaW5zZXJ0QmVmb3JlOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0LnByZXZpb3VzID09IGluc2VydGVkU25pcHBldFxuICAgIGFzc2VydCBzbmlwcGV0IGlzbnQgaW5zZXJ0ZWRTbmlwcGV0LCAnY2Fubm90IGluc2VydCBzbmlwcGV0IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogc25pcHBldC5wcmV2aW91c1xuICAgICAgbmV4dDogc25pcHBldFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIGluc2VydEFmdGVyOiAoc25pcHBldCwgaW5zZXJ0ZWRTbmlwcGV0KSAtPlxuICAgIHJldHVybiBpZiBzbmlwcGV0Lm5leHQgPT0gaW5zZXJ0ZWRTbmlwcGV0XG4gICAgYXNzZXJ0IHNuaXBwZXQgaXNudCBpbnNlcnRlZFNuaXBwZXQsICdjYW5ub3QgaW5zZXJ0IHNuaXBwZXQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IHNuaXBwZXRcbiAgICAgIG5leHQ6IHNuaXBwZXQubmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyOiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaFNuaXBwZXQoaW5zZXJ0ZWRTbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gIHVwOiAoc25pcHBldCkgLT5cbiAgICBpZiBzbmlwcGV0LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShzbmlwcGV0LnByZXZpb3VzLCBzbmlwcGV0KVxuXG5cbiAgZG93bjogKHNuaXBwZXQpIC0+XG4gICAgaWYgc25pcHBldC5uZXh0P1xuICAgICAgQGluc2VydEFmdGVyKHNuaXBwZXQubmV4dCwgc25pcHBldClcblxuXG4gIGdldFNuaXBwZXRUcmVlOiAtPlxuICAgIEBzbmlwcGV0VHJlZSB8fCBAcGFyZW50U25pcHBldD8uc25pcHBldFRyZWVcblxuXG4gICMgVHJhdmVyc2UgYWxsIHNuaXBwZXRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBzbmlwcGV0ID0gQGZpcnN0XG4gICAgd2hpbGUgKHNuaXBwZXQpXG4gICAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0Lm5leHRcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKHNuaXBwZXRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBzbmlwcGV0cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChzbmlwcGV0KSAtPlxuICAgICAgY2FsbGJhY2soc25pcHBldClcbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0LmRlc3Ryb3koKVxuICAgIEBfZGV0YWNoU25pcHBldChzbmlwcGV0KVxuXG5cbiAgdWk6IC0+XG4gICAgaWYgbm90IEB1aUluamVjdG9yXG4gICAgICBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5yZW5kZXJlci5jcmVhdGVJbnRlcmZhY2VJbmplY3Rvcih0aGlzKVxuICAgIEB1aUluamVjdG9yXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBzbmlwcGV0IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIHNuaXBwZXRUcmVlIGlmIHRoZSBwYXJlbnQgc25pcHBldCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoU25pcHBldDogKHNuaXBwZXQsIHBvc2l0aW9uID0ge30pIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAbGluayhzbmlwcGV0LCBwb3NpdGlvbilcblxuICAgIGlmIHNuaXBwZXRUcmVlID0gQGdldFNuaXBwZXRUcmVlKClcbiAgICAgIHNuaXBwZXRUcmVlLmF0dGFjaGluZ1NuaXBwZXQoc25pcHBldCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgRXZlcnkgc25pcHBldCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgc25pcHBldFRyZWUgaWYgdGhlIHBhcmVudCBzbmlwcGV0IGlzXG4gICMgYXR0YWNoZWQgdG8gb25lLlxuICAjIFNuaXBwZXRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIHNuaXBwZXRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hTbmlwcGV0IHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gZmlyZVxuICAjIFNuaXBwZXRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgc25pcHBldCB0cmVlLCBpbiB0aGVzZVxuICAjIGNhc2VzIHVubGluayBjYW4gYmUgdXNlZFxuICAjIEBhcGkgcHJpdmF0ZVxuICBfZGV0YWNoU25pcHBldDogKHNuaXBwZXQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKHNuaXBwZXQpXG5cbiAgICBpZiBzbmlwcGV0VHJlZSA9IEBnZXRTbmlwcGV0VHJlZSgpXG4gICAgICBzbmlwcGV0VHJlZS5kZXRhY2hpbmdTbmlwcGV0KHNuaXBwZXQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoc25pcHBldCwgcG9zaXRpb24pIC0+XG4gICAgQHVubGluayhzbmlwcGV0KSBpZiBzbmlwcGV0LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldFNuaXBwZXRQb3NpdGlvbihzbmlwcGV0LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKHNuaXBwZXQpIC0+XG4gICAgY29udGFpbmVyID0gc25pcHBldC5wYXJlbnRDb250YWluZXJcbiAgICBpZiBjb250YWluZXJcblxuICAgICAgIyB1cGRhdGUgcGFyZW50Q29udGFpbmVyIGxpbmtzXG4gICAgICBjb250YWluZXIuZmlyc3QgPSBzbmlwcGV0Lm5leHQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IHNuaXBwZXQucHJldmlvdXMgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIHNuaXBwZXQubmV4dD8ucHJldmlvdXMgPSBzbmlwcGV0LnByZXZpb3VzXG4gICAgICBzbmlwcGV0LnByZXZpb3VzPy5uZXh0ID0gc25pcHBldC5uZXh0XG5cbiAgICAgIEBzZXRTbmlwcGV0UG9zaXRpb24oc25pcHBldCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRTbmlwcGV0UG9zaXRpb246IChzbmlwcGV0LCB7IHBhcmVudENvbnRhaW5lciwgcHJldmlvdXMsIG5leHQgfSkgLT5cbiAgICBzbmlwcGV0LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIHNuaXBwZXQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIHNuaXBwZXQubmV4dCA9IG5leHRcblxuICAgIGlmIHBhcmVudENvbnRhaW5lclxuICAgICAgcHJldmlvdXMubmV4dCA9IHNuaXBwZXQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBzbmlwcGV0IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IHNuaXBwZXQgdW5sZXNzIHNuaXBwZXQubmV4dD9cblxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcblxuIyBTbmlwcGV0TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggU25pcHBldE1vZGVsIGhhcyBhIHRlbXBsYXRlIHdoaWNoIGFsbG93cyB0byBnZW5lcmF0ZSBhIHNuaXBwZXRWaWV3XG4jIGZyb20gYSBzbmlwcGV0TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBTbmlwcGV0VHJlZS5cbiMgRXZlcnkgU25pcHBldE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChTbmlwcGV0Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIHNuaXBwZXRzKSBhbmQgbXVsdGlwbGUgY29udGFpbmVycyAoU25pcHBldENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIFNuaXBwZXRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IFNuaXBwZXRDb250YWluZXJcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgc25pcHBldCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEB0ZW1wb3JhcnlDb250ZW50ID0ge31cbiAgICBAaWQgPSBpZCB8fCBndWlkLm5leHQoKVxuICAgIEBpZGVudGlmaWVyID0gQHRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIEBuZXh0ID0gdW5kZWZpbmVkICMgc2V0IGJ5IFNuaXBwZXRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgU25pcHBldENvbnRhaW5lclxuICAgIEBzbmlwcGV0VHJlZSA9IHVuZGVmaW5lZCAjIHNldCBieSBTbmlwcGV0VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgU25pcHBldENvbnRhaW5lclxuICAgICAgICAgICAgbmFtZTogZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgICAgIHBhcmVudFNuaXBwZXQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gU25pcHBldE1vZGVsXCJcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICBoYXNDb250YWluZXJzOiAtPlxuICAgIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzLmNvdW50KCdjb250YWluZXInKSA+IDBcblxuXG4gIGhhc0VkaXRhYmxlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnZWRpdGFibGUnKSA+IDBcblxuXG4gIGhhc0h0bWw6IC0+XG4gICAgQHRlbXBsYXRlLmRpcmVjdGl2ZXMuY291bnQoJ2h0bWwnKSA+IDBcblxuXG4gIGhhc0ltYWdlczogLT5cbiAgICBAdGVtcGxhdGUuZGlyZWN0aXZlcy5jb3VudCgnaW1hZ2UnKSA+IDBcblxuXG4gIGJlZm9yZTogKHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBzbmlwcGV0TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIHNuaXBwZXRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAcHJldmlvdXNcblxuXG4gIGFmdGVyOiAoc25pcHBldE1vZGVsKSAtPlxuICAgIGlmIHNuaXBwZXRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBzbmlwcGV0TW9kZWwpXG4gICAgICB0aGlzXG4gICAgZWxzZVxuICAgICAgQG5leHRcblxuXG4gIGFwcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChzbmlwcGV0TW9kZWwpXG4gICAgdGhpc1xuXG5cbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIHNuaXBwZXRNb2RlbCkgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgIHNuaXBwZXRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLnByZXBlbmQoc25pcHBldE1vZGVsKVxuICAgIHRoaXNcblxuXG4gIHJlc2V0Vm9sYXRpbGVWYWx1ZTogKG5hbWUpIC0+XG4gICAgZGVsZXRlIEB0ZW1wb3JhcnlDb250ZW50W25hbWVdXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSwgdm9sYXRpbGU9ZmFsc2UpIC0+XG4gICAgYXNzZXJ0IEBjb250ZW50Py5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgIFwic2V0IGVycm9yOiAjeyBAaWRlbnRpZmllciB9IGhhcyBubyBjb250ZW50IG5hbWVkICN7IG5hbWUgfVwiXG5cbiAgICBpZiB2b2xhdGlsZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lciA9IEB0ZW1wb3JhcnlDb250ZW50XG4gICAgZWxzZVxuICAgICAgQHJlc2V0Vm9sYXRpbGVWYWx1ZShuYW1lKSAjIGFzIHNvb24gYXMgd2UgZ2V0IHJlYWwgY29udGVudCwgcmVzZXQgdGhlIHRlbXBvcmFyeUNvbnRlbnRcbiAgICAgIHN0b3JhZ2VDb250YWluZXIgPSBAY29udGVudFxuXG4gICAgaWYgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSAhPSB2YWx1ZVxuICAgICAgc3RvcmFnZUNvbnRhaW5lcltuYW1lXSA9IHZhbHVlXG4gICAgICBAc25pcHBldFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBzbmlwcGV0VHJlZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBpZGVudGlmaWVyIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBjb250ZW50W25hbWVdXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBzbmlwcGV0VHJlZSAmJiBjaGFuZ2VkRGF0YVByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBAc25pcHBldFRyZWUuZGF0YUNoYW5naW5nKHRoaXMsIGNoYW5nZWREYXRhUHJvcGVydGllcylcbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1thcmddXG5cblxuICBjaGFuZ2VEYXRhOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgZGVlcEVxdWFsKEBkYXRhVmFsdWVzW25hbWVdLCB2YWx1ZSkgPT0gZmFsc2VcbiAgICAgIEBkYXRhVmFsdWVzW25hbWVdID0gdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG5cbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICBzdHlsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gU25pcHBldE1vZGVsICN7IEBpZGVudGlmaWVyIH1cIlxuICAgIGVsc2UgaWYgbm90IHN0eWxlLnZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBsb2cud2FybiBcIkludmFsaWQgdmFsdWUgJyN7IHZhbHVlIH0nIGZvciBzdHlsZSAnI3sgbmFtZSB9JyBpbiBTbmlwcGV0TW9kZWwgI3sgQGlkZW50aWZpZXIgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQHNuaXBwZXRUcmVlXG4gICAgICAgICAgQHNuaXBwZXRUcmVlLmh0bWxDaGFuZ2luZyh0aGlzLCAnc3R5bGUnLCB7IG5hbWUsIHZhbHVlIH0pXG5cblxuICBjb3B5OiAtPlxuICAgIGxvZy53YXJuKFwiU25pcHBldE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBTbmlwcGV0TW9kZWwuZnJvbUpzb24oanNvbilcblxuXG4gIGNvcHlXaXRob3V0Q29udGVudDogLT5cbiAgICBAdGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuXG5cbiAgIyBtb3ZlIHVwIChwcmV2aW91cylcbiAgdXA6IC0+XG4gICAgQHBhcmVudENvbnRhaW5lci51cCh0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgbW92ZSBkb3duIChuZXh0KVxuICBkb3duOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIuZG93bih0aGlzKVxuICAgIHRoaXNcblxuXG4gICMgcmVtb3ZlIFRyZWVOb2RlIGZyb20gaXRzIGNvbnRhaW5lciBhbmQgU25pcHBldFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiAgICAjIHJlbW92ZSB1c2VyIGludGVyZmFjZSBlbGVtZW50c1xuICAgIEB1aUluamVjdG9yLnJlbW92ZSgpIGlmIEB1aUluamVjdG9yXG5cblxuICBnZXRQYXJlbnQ6IC0+XG4gICAgIEBwYXJlbnRDb250YWluZXI/LnBhcmVudFNuaXBwZXRcblxuXG4gIHVpOiAtPlxuICAgIGlmIG5vdCBAdWlJbmplY3RvclxuICAgICAgQHNuaXBwZXRUcmVlLnJlbmRlcmVyLmNyZWF0ZUludGVyZmFjZUluamVjdG9yKHRoaXMpXG4gICAgQHVpSW5qZWN0b3JcblxuXG4gICMgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tXG5cbiAgcGFyZW50czogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoc25pcHBldE1vZGVsID0gc25pcHBldE1vZGVsLmdldFBhcmVudCgpKVxuICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwgPSBzbmlwcGV0TW9kZWwubmV4dFxuXG5cbiAgZGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBAY29udGFpbmVyc1xuICAgICAgc25pcHBldE1vZGVsID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKHNuaXBwZXRNb2RlbClcbiAgICAgICAgY2FsbGJhY2soc25pcHBldE1vZGVsKVxuICAgICAgICBzbmlwcGV0TW9kZWwuZGVzY2VuZGFudHMoY2FsbGJhY2spXG4gICAgICAgIHNuaXBwZXRNb2RlbCA9IHNuaXBwZXRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIHNuaXBwZXRNb2RlbClcbiAgZGVzY2VuZGFudENvbnRhaW5lcnM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpIC0+XG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgIyByZXR1cm4gYWxsIGRlc2NlbmRhbnQgY29udGFpbmVycyBhbmQgc25pcHBldHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChzbmlwcGV0TW9kZWwpID0+XG4gICAgICBjYWxsYmFjayhzbmlwcGV0TW9kZWwpIGlmIHNuaXBwZXRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgc25pcHBldENvbnRhaW5lciBvZiBzbmlwcGV0TW9kZWwuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhzbmlwcGV0Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgdG9Kc29uOiAtPlxuXG4gICAganNvbiA9XG4gICAgICBpZDogQGlkXG4gICAgICBpZGVudGlmaWVyOiBAaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShAY29udGVudClcbiAgICAgIGpzb24uY29udGVudCA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQGNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KEBzdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoQHN0eWxlcylcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoQGRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuU25pcHBldE1vZGVsLmZyb21Kc29uID0gKGpzb24sIGRlc2lnbikgLT5cbiAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uaWRlbnRpZmllcilcblxuICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIHNuaXBwZXQ6IHVua25vd24gdGVtcGxhdGUgaWRlbnRpZmllciAnI3sganNvbi5pZGVudGlmaWVyIH0nXCJcblxuICBtb2RlbCA9IG5ldyBTbmlwcGV0TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcbiAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICBmb3Igc3R5bGVOYW1lLCB2YWx1ZSBvZiBqc29uLnN0eWxlc1xuICAgIG1vZGVsLnN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gIGZvciBjb250YWluZXJOYW1lLCBzbmlwcGV0QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgIGlmIHNuaXBwZXRBcnJheVxuICAgICAgYXNzZXJ0ICQuaXNBcnJheShzbmlwcGV0QXJyYXkpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgc25pcHBldDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgZm9yIGNoaWxkIGluIHNuaXBwZXRBcnJheVxuICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIFNuaXBwZXRNb2RlbC5mcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgbW9kZWxcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuU25pcHBldENvbnRhaW5lciA9IHJlcXVpcmUoJy4vc25pcHBldF9jb250YWluZXInKVxuU25pcHBldEFycmF5ID0gcmVxdWlyZSgnLi9zbmlwcGV0X2FycmF5JylcblNuaXBwZXRNb2RlbCA9IHJlcXVpcmUoJy4vc25pcHBldF9tb2RlbCcpXG5cbiMgU25pcHBldFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBzbmlwcGV0IHRyZWUgY29udGFpbmVzIGFsbCB0aGUgc25pcHBldHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIFNuaXBwZXRUcmVlIGlzIGEgU25pcHBldENvbnRhaW5lci4gQSBTbmlwcGV0Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBzbmlwcGV0cy5cbiNcbiMgc25pcHBldHMgY2FuIGhhdmUgbXVsdGlibGUgU25pcHBldENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIFNuaXBwZXRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gU25pcHBldCAnSGVybydcbiMgICAgICAgLSBTbmlwcGV0ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBTbmlwcGV0Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBTbmlwcGV0ICdUaXRsZSdcbiMgICAgICAgICAtIFNuaXBwZXRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIFNuaXBwZXQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBTbmlwcGV0VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3Zpbmcgc25pcHBldHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2Ugc25pcHBldHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU25pcHBldFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBTbmlwcGV0VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgU25pcHBldENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICAjIGluaXRpYWxpemUgY29udGVudCBiZWZvcmUgd2Ugc2V0IHRoZSBzbmlwcGV0IHRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB0aGlzXG4gICAgQGluaXRpYWxpemVFdmVudHMoKVxuXG5cbiAgIyBJbnNlcnQgYSBzbmlwcGV0IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBzbmlwcGV0TW9kZWwgaW5zdGFuY2Ugb3Igc25pcHBldCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBwcmVwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5wcmVwZW5kKHNuaXBwZXQpIGlmIHNuaXBwZXQ/XG4gICAgdGhpc1xuXG5cbiAgIyBJbnNlcnQgc25pcHBldCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogc25pcHBldE1vZGVsIGluc3RhbmNlIG9yIHNuaXBwZXQgbmFtZSBlLmcuICd0aXRsZSdcbiAgYXBwZW5kOiAoc25pcHBldCkgLT5cbiAgICBzbmlwcGV0ID0gQGdldFNuaXBwZXQoc25pcHBldClcbiAgICBAcm9vdC5hcHBlbmQoc25pcHBldCkgaWYgc25pcHBldD9cbiAgICB0aGlzXG5cblxuICBnZXRTbmlwcGV0OiAoc25pcHBldE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXROYW1lID09ICdzdHJpbmcnXG4gICAgICBAY3JlYXRlTW9kZWwoc25pcHBldE5hbWUpXG4gICAgZWxzZVxuICAgICAgc25pcHBldE5hbWVcblxuXG4gIGNyZWF0ZU1vZGVsOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBnZXRUZW1wbGF0ZShpZGVudGlmaWVyKVxuICAgIHRlbXBsYXRlLmNyZWF0ZU1vZGVsKCkgaWYgdGVtcGxhdGVcblxuXG4gIGNyZWF0ZVNuaXBwZXQ6IC0+XG4gICAgQGNyZWF0ZU1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuXG4gIGdldFRlbXBsYXRlOiAoaWRlbnRpZmllcikgLT5cbiAgICB0ZW1wbGF0ZSA9IEBkZXNpZ24uZ2V0KGlkZW50aWZpZXIpXG4gICAgYXNzZXJ0IHRlbXBsYXRlLCBcIkNvdWxkIG5vdCBmaW5kIHRlbXBsYXRlICN7IGlkZW50aWZpZXIgfVwiXG4gICAgdGVtcGxhdGVcblxuXG4gIGluaXRpYWxpemVFdmVudHM6ICgpIC0+XG5cbiAgICAjIGxheW91dCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQHNuaXBwZXRNb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgICMgY29udGVudCBjaGFuZ2VzXG4gICAgQHNuaXBwZXRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAc25pcHBldEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0U2V0dGluZ3NDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBzbmlwcGV0RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIHNuaXBwZXQgdHJlZS5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2goY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaENvbnRhaW5lcihjYWxsYmFjaylcblxuXG4gICMgR2V0IHRoZSBmaXJzdCBzbmlwcGV0XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBzbmlwcGV0c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoc25pcHBldCkgLT5cbiAgICAgICAgaWYgc25pcHBldC5pZGVudGlmaWVyID09IHNlYXJjaCB8fCBzbmlwcGV0LnRlbXBsYXRlLmlkID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKHNuaXBwZXQpXG5cbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkocmVzKVxuICAgIGVsc2VcbiAgICAgIG5ldyBTbmlwcGV0QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKHNuaXBwZXQpIC0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBTbmlwcGV0Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgIG9sZFJvb3RcblxuXG4gICMgZWFjaFdpdGhQYXJlbnRzOiAoc25pcHBldCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goc25pcHBldClcbiAgIyAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAjICAgICBzbmlwcGV0ID0gc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICMgICAgIHdoaWxlIChzbmlwcGV0KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoc25pcHBldCwgcGFyZW50cylcbiAgIyAgICAgICBzbmlwcGV0ID0gc25pcHBldC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdTbmlwcGV0VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKHNuaXBwZXQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIHRlbXBsYXRlID0gc25pcHBldC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUudGl0bGUgfSAoI3sgdGVtcGxhdGUuaWRlbnRpZmllciB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXRDb250YWluZXIgb2Ygc25pcHBldC5jb250YWluZXJzXG4gICAgICAgIGFkZExpbmUoXCIjeyBuYW1lIH06XCIsIGluZGVudGF0aW9uICsgMilcbiAgICAgICAgd2Fsa2VyKHNuaXBwZXRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgc25pcHBldENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoc25pcHBldC5uZXh0LCBpbmRlbnRhdGlvbikgaWYgc25pcHBldC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIHNuaXBwZXRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBzbmlwcGV0Q29udGFpbmVyc1xuXG4gIGF0dGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBhdHRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBpZiBzbmlwcGV0LnNuaXBwZXRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBzbmlwcGV0XG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0TW92ZWQnLCBzbmlwcGV0KVxuICAgIGVsc2VcbiAgICAgIGlmIHNuaXBwZXQuc25pcHBldFRyZWU/XG4gICAgICAgICMgcmVtb3ZlIGZyb20gb3RoZXIgc25pcHBldCB0cmVlXG4gICAgICAgIHNuaXBwZXQuc25pcHBldENvbnRhaW5lci5kZXRhY2hTbmlwcGV0KHNuaXBwZXQpXG5cbiAgICAgIHNuaXBwZXQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LnNuaXBwZXRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hTbmlwcGV0RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdzbmlwcGV0QWRkZWQnLCBzbmlwcGV0KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ1NuaXBwZXQ6IChzbmlwcGV0LCBkZXRhY2hTbmlwcGV0RnVuYykgLT5cbiAgICBhc3NlcnQgc25pcHBldC5zbmlwcGV0VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgc25pcHBldCBmcm9tIGFub3RoZXIgU25pcHBldFRyZWUnXG5cbiAgICBzbmlwcGV0LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5zbmlwcGV0VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoU25pcHBldEZ1bmMoKVxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXRSZW1vdmVkJywgc25pcHBldClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldENvbnRlbnRDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGh0bWxDaGFuZ2luZzogKHNuaXBwZXQpIC0+XG4gICAgQGZpcmVFdmVudCgnc25pcHBldEh0bWxDaGFuZ2VkJywgc25pcHBldClcblxuXG4gIGRhdGFDaGFuZ2luZzogKHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKSAtPlxuICAgIEBmaXJlRXZlbnQoJ3NuaXBwZXREYXRhQ2hhbmdlZCcsIHNuaXBwZXQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lc3BhY2UgfVxuXG4gICAgc25pcHBldFRvRGF0YSA9IChzbmlwcGV0LCBsZXZlbCwgY29udGFpbmVyQXJyYXkpIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggc25pcHBldERhdGFcbiAgICAgIHNuaXBwZXREYXRhXG5cbiAgICB3YWxrZXIgPSAoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBzbmlwcGV0RGF0YSA9IHNuaXBwZXRUb0RhdGEoc25pcHBldCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBzbmlwcGV0Q29udGFpbmVyIG9mIHNuaXBwZXQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IHNuaXBwZXREYXRhLmNvbnRhaW5lcnNbc25pcHBldENvbnRhaW5lci5uYW1lXSA9IFtdXG4gICAgICAgIHdhbGtlcihzbmlwcGV0Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBzbmlwcGV0Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihzbmlwcGV0Lm5leHQsIGxldmVsLCBkYXRhT2JqKSBpZiBzbmlwcGV0Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgdG9Kc29uOiAtPlxuICAgIEBzZXJpYWxpemUoKVxuXG5cbiAgZnJvbUpzb246IChkYXRhLCBkZXNpZ24pIC0+XG4gICAgQHJvb3Quc25pcHBldFRyZWUgPSB1bmRlZmluZWRcbiAgICBpZiBkYXRhLmNvbnRlbnRcbiAgICAgIGZvciBzbmlwcGV0RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgc25pcHBldCA9IFNuaXBwZXRNb2RlbC5mcm9tSnNvbihzbmlwcGV0RGF0YSwgZGVzaWduKVxuICAgICAgICBAcm9vdC5hcHBlbmQoc25pcHBldClcblxuICAgIEByb290LnNuaXBwZXRUcmVlID0gdGhpc1xuICAgIEByb290LmVhY2ggKHNuaXBwZXQpID0+XG4gICAgICBzbmlwcGV0LnNuaXBwZXRUcmVlID0gdGhpc1xuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBuYW1lLCBAdHlwZSwgQGVsZW0gfSkgLT5cbiAgICBAbmFtZSA9IG5hbWUgfHwgY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdLmRlZmF1bHROYW1lXG4gICAgQGNvbmZpZyA9IGNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXVxuICAgIEBvcHRpb25hbCA9IGZhbHNlXG5cblxuICByZW5kZXJlZEF0dHI6IC0+XG4gICAgQGNvbmZpZy5yZW5kZXJlZEF0dHJcblxuXG4gIGlzRWxlbWVudERpcmVjdGl2ZTogLT5cbiAgICBAY29uZmlnLmVsZW1lbnREaXJlY3RpdmVcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkIGZyb20gdGhlXG4gICMgdGVtcGxhdGUgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlld1xuICBjbG9uZTogLT5cbiAgICBuZXdEaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlKG5hbWU6IEBuYW1lLCB0eXBlOiBAdHlwZSlcbiAgICBuZXdEaXJlY3RpdmUub3B0aW9uYWwgPSBAb3B0aW9uYWxcbiAgICBuZXdEaXJlY3RpdmVcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAZWxlbSlcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxuIyBBIGxpc3Qgb2YgYWxsIGRpcmVjdGl2ZXMgb2YgYSB0ZW1wbGF0ZVxuIyBFdmVyeSBub2RlIHdpdGggYW4gZG9jLSBhdHRyaWJ1dGUgd2lsbCBiZSBzdG9yZWQgYnkgaXRzIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlQ29sbGVjdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGFsbD17fSkgLT5cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgYWRkOiAoZGlyZWN0aXZlKSAtPlxuICAgIEBhc3NlcnROYW1lTm90VXNlZChkaXJlY3RpdmUpXG5cbiAgICAjIGNyZWF0ZSBwc2V1ZG8gYXJyYXlcbiAgICB0aGlzW0BsZW5ndGhdID0gZGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlLmluZGV4ID0gQGxlbmd0aFxuICAgIEBsZW5ndGggKz0gMVxuXG4gICAgIyBpbmRleCBieSBuYW1lXG4gICAgQGFsbFtkaXJlY3RpdmUubmFtZV0gPSBkaXJlY3RpdmVcblxuICAgICMgaW5kZXggYnkgdHlwZVxuICAgICMgZGlyZWN0aXZlLnR5cGUgaXMgb25lIG9mIHRob3NlICdjb250YWluZXInLCAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXSB8fD0gW11cbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXS5wdXNoKGRpcmVjdGl2ZSlcblxuXG4gIG5leHQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSB8fD0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgfHw9IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2RlZmF1bHRzJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9kZWZhdWx0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlyZWN0aXZlRmluZGVyID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgbGluazogKGVsZW0sIGRpcmVjdGl2ZUNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHIubmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29sbGVjdGlvbi5nZXQoYXR0ci52YWx1ZSlcbiAgICAgICAgZGlyZWN0aXZlLmVsZW0gPSBlbGVtXG5cbiAgICB1bmRlZmluZWRcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIHNuaXBwZXQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5cbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vZGVmYXVsdHMnKVxuXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2l0ZXJhdG9yJylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcbmRpcmVjdGl2ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29tcGlsZXInKVxuZGlyZWN0aXZlRmluZGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfZmluZGVyJylcblxuU25pcHBldE1vZGVsID0gcmVxdWlyZSgnLi4vc25pcHBldF90cmVlL3NuaXBwZXRfbW9kZWwnKVxuU25pcHBldFZpZXcgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvc25pcHBldF92aWV3JylcblxuIyBUZW1wbGF0ZVxuIyAtLS0tLS0tLVxuIyBQYXJzZXMgc25pcHBldCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgU25pcHBldE1vZGVscyBhbmQgU25pcHBldFZpZXdzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZW1wbGF0ZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGh0bWwsIEBuYW1lc3BhY2UsIEBpZCwgaWRlbnRpZmllciwgdGl0bGUsIHN0eWxlcywgd2VpZ2h0IH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgaHRtbCwgJ1RlbXBsYXRlOiBwYXJhbSBodG1sIG1pc3NpbmcnXG5cbiAgICBpZiBpZGVudGlmaWVyXG4gICAgICB7IEBuYW1lc3BhY2UsIEBpZCB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG5cbiAgICBAaWRlbnRpZmllciA9IGlmIEBuYW1lc3BhY2UgJiYgQGlkXG4gICAgICBcIiN7IEBuYW1lc3BhY2UgfS4jeyBAaWQgfVwiXG5cbiAgICBAJHRlbXBsYXRlID0gJCggQHBydW5lSHRtbChodG1sKSApLndyYXAoJzxkaXY+JylcbiAgICBAJHdyYXAgPSBAJHRlbXBsYXRlLnBhcmVudCgpXG5cbiAgICBAdGl0bGUgPSB0aXRsZSB8fCB3b3Jkcy5odW1hbml6ZSggQGlkIClcbiAgICBAc3R5bGVzID0gc3R5bGVzIHx8IHt9XG4gICAgQHdlaWdodCA9IHdlaWdodFxuICAgIEBkZWZhdWx0cyA9IHt9XG5cbiAgICBAcGFyc2VUZW1wbGF0ZSgpXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBTbmlwcGV0TW9kZWwgaW5zdGFuY2UgZnJvbSB0aGlzIHRlbXBsYXRlXG4gIGNyZWF0ZU1vZGVsOiAoKSAtPlxuICAgIG5ldyBTbmlwcGV0TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoc25pcHBldE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIHNuaXBwZXRNb2RlbCB8fD0gQGNyZWF0ZU1vZGVsKClcbiAgICAkZWxlbSA9IEAkdGVtcGxhdGUuY2xvbmUoKVxuICAgIGRpcmVjdGl2ZXMgPSBAbGlua0RpcmVjdGl2ZXMoJGVsZW1bMF0pXG5cbiAgICBzbmlwcGV0VmlldyA9IG5ldyBTbmlwcGV0Vmlld1xuICAgICAgbW9kZWw6IHNuaXBwZXRNb2RlbFxuICAgICAgJGh0bWw6ICRlbGVtXG4gICAgICBkaXJlY3RpdmVzOiBkaXJlY3RpdmVzXG4gICAgICBpc1JlYWRPbmx5OiBpc1JlYWRPbmx5XG5cblxuICBwcnVuZUh0bWw6IChodG1sKSAtPlxuXG4gICAgIyByZW1vdmUgYWxsIGNvbW1lbnRzXG4gICAgaHRtbCA9ICQoaHRtbCkuZmlsdGVyIChpbmRleCkgLT5cbiAgICAgIEBub2RlVHlwZSAhPThcblxuICAgICMgb25seSBhbGxvdyBvbmUgcm9vdCBlbGVtZW50XG4gICAgYXNzZXJ0IGh0bWwubGVuZ3RoID09IDEsIFwiVGVtcGxhdGVzIG11c3QgY29udGFpbiBvbmUgcm9vdCBlbGVtZW50LiBUaGUgVGVtcGxhdGUgXFxcIiN7QGlkZW50aWZpZXJ9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBTbmlwcGV0VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgc25pcHBldERpcmVjdGl2ZXMgPSBAZGlyZWN0aXZlcy5jbG9uZSgpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlRmluZGVyLmxpbmsoZWxlbSwgc25pcHBldERpcmVjdGl2ZXMpXG5cbiAgICBzbmlwcGV0RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZWRpdGFibGUpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGlmIGRlZmF1bHRWYWx1ZSB0aGVuIGRlZmF1bHRWYWx1ZSBlbHNlICcnXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0Q29udGFpbmVyOiAobmFtZSwgZWxlbSkgLT5cbiAgICAjIHJlbW92ZSBhbGwgY29udGVudCBmcm9uIGEgY29udGFpbmVyIGZyb20gdGhlIHRlbXBsYXRlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0SHRtbDogKG5hbWUsIGVsZW0pIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgIyBvdXRwdXQgdGhlIGFjY2VwdGVkIGNvbnRlbnQgb2YgdGhlIHNuaXBwZXRcbiAgIyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gY3JlYXRlXG4gICMgZS5nOiB7IHRpdGxlOiBcIkl0Y2h5IGFuZCBTY3JhdGNoeVwiIH1cbiAgcHJpbnREb2M6ICgpIC0+XG4gICAgZG9jID1cbiAgICAgIGlkZW50aWZpZXI6IEBpZGVudGlmaWVyXG4gICAgICAjIGVkaXRhYmxlczogT2JqZWN0LmtleXMgQGVkaXRhYmxlcyBpZiBAZWRpdGFibGVzXG4gICAgICAjIGNvbnRhaW5lcnM6IE9iamVjdC5rZXlzIEBjb250YWluZXJzIGlmIEBjb250YWluZXJzXG5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oZG9jKVxuXG5cbiMgU3RhdGljIGZ1bmN0aW9uc1xuIyAtLS0tLS0tLS0tLS0tLS0tXG5cblRlbXBsYXRlLnBhcnNlSWRlbnRpZmllciA9IChpZGVudGlmaWVyKSAtPlxuICByZXR1cm4gdW5sZXNzIGlkZW50aWZpZXIgIyBzaWxlbnRseSBmYWlsIG9uIHVuZGVmaW5lZCBvciBlbXB0eSBzdHJpbmdzXG5cbiAgcGFydHMgPSBpZGVudGlmaWVyLnNwbGl0KCcuJylcbiAgaWYgcGFydHMubGVuZ3RoID09IDFcbiAgICB7IG5hbWVzcGFjZTogdW5kZWZpbmVkLCBpZDogcGFydHNbMF0gfVxuICBlbHNlIGlmIHBhcnRzLmxlbmd0aCA9PSAyXG4gICAgeyBuYW1lc3BhY2U6IHBhcnRzWzBdLCBpZDogcGFydHNbMV0gfVxuICBlbHNlXG4gICAgbG9nLmVycm9yKFwiY291bGQgbm90IHBhcnNlIHNuaXBwZXQgdGVtcGxhdGUgaWRlbnRpZmllcjogI3sgaWRlbnRpZmllciB9XCIpXG4iXX0=
