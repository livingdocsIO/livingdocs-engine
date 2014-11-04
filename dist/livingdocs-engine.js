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
var ComponentTree, Design, EditorPage, Livingdoc, assert, augmentConfig, config, designCache, designParser, doc;

assert = require('./modules/logging/assert');

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Livingdoc = require('./livingdoc');

ComponentTree = require('./component_tree/component_tree');

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
      var componentTree, data, design, designName, _ref;
      data = _arg.data, design = _arg.design;
      componentTree = data != null ? (designName = (_ref = data.design) != null ? _ref.name : void 0, assert(designName != null, 'Error creating livingdoc: No design is specified.'), design = this.design.get(designName), new ComponentTree({
        content: data,
        design: design
      })) : (designName = design, design = this.design.get(designName), new ComponentTree({
        design: design
      }));
      return this.create(componentTree);
    },
    create: function(componentTree) {
      return new Livingdoc({
        componentTree: componentTree
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


},{"./component_tree/component_tree":11,"./configuration/augment_config":15,"./configuration/config":16,"./design/design":19,"./design/design_cache":20,"./design/design_parser":22,"./livingdoc":32,"./modules/logging/assert":37,"./rendering_container/editor_page":51}],6:[function(require,module,exports){
var ComponentArray;

module.exports = ComponentArray = (function() {
  function ComponentArray(components) {
    this.components = components;
    if (this.components == null) {
      this.components = [];
    }
    this.createPseudoArray();
  }

  ComponentArray.prototype.createPseudoArray = function() {
    var index, result, _i, _len, _ref;
    _ref = this.components;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      result = _ref[index];
      this[index] = result;
    }
    this.length = this.components.length;
    if (this.components.length) {
      this.first = this[0];
      return this.last = this[this.components.length - 1];
    }
  };

  ComponentArray.prototype.each = function(callback) {
    var component, _i, _len, _ref;
    _ref = this.components;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      component = _ref[_i];
      callback(component);
    }
    return this;
  };

  ComponentArray.prototype.remove = function() {
    this.each(function(component) {
      return component.remove();
    });
    return this;
  };

  return ComponentArray;

})();


},{}],7:[function(require,module,exports){
var ComponentContainer, assert;

assert = require('../modules/logging/assert');

module.exports = ComponentContainer = (function() {
  function ComponentContainer(_arg) {
    var isRoot;
    this.parentComponent = _arg.parentComponent, this.name = _arg.name, isRoot = _arg.isRoot;
    this.isRoot = isRoot != null;
    this.first = this.last = void 0;
  }

  ComponentContainer.prototype.prepend = function(component) {
    if (this.first) {
      this.insertBefore(this.first, component);
    } else {
      this.attachComponent(component);
    }
    return this;
  };

  ComponentContainer.prototype.append = function(component) {
    if (this.parentComponent) {
      assert(component !== this.parentComponent, 'cannot append component to itself');
    }
    if (this.last) {
      this.insertAfter(this.last, component);
    } else {
      this.attachComponent(component);
    }
    return this;
  };

  ComponentContainer.prototype.insertBefore = function(component, insertedComponent) {
    var position;
    if (component.previous === insertedComponent) {
      return;
    }
    assert(component !== insertedComponent, 'cannot insert component before itself');
    position = {
      previous: component.previous,
      next: component,
      parentContainer: component.parentContainer
    };
    return this.attachComponent(insertedComponent, position);
  };

  ComponentContainer.prototype.insertAfter = function(component, insertedComponent) {
    var position;
    if (component.next === insertedComponent) {
      return;
    }
    assert(component !== insertedComponent, 'cannot insert component after itself');
    position = {
      previous: component,
      next: component.next,
      parentContainer: component.parentContainer
    };
    return this.attachComponent(insertedComponent, position);
  };

  ComponentContainer.prototype.up = function(component) {
    if (component.previous != null) {
      return this.insertBefore(component.previous, component);
    }
  };

  ComponentContainer.prototype.down = function(component) {
    if (component.next != null) {
      return this.insertAfter(component.next, component);
    }
  };

  ComponentContainer.prototype.getComponentTree = function() {
    var _ref;
    return this.componentTree || ((_ref = this.parentComponent) != null ? _ref.componentTree : void 0);
  };

  ComponentContainer.prototype.each = function(callback) {
    var component, _results;
    component = this.first;
    _results = [];
    while (component) {
      component.descendantsAndSelf(callback);
      _results.push(component = component.next);
    }
    return _results;
  };

  ComponentContainer.prototype.eachContainer = function(callback) {
    callback(this);
    return this.each(function(component) {
      var componentContainer, name, _ref, _results;
      _ref = component.containers;
      _results = [];
      for (name in _ref) {
        componentContainer = _ref[name];
        _results.push(callback(componentContainer));
      }
      return _results;
    });
  };

  ComponentContainer.prototype.all = function(callback) {
    callback(this);
    return this.each(function(component) {
      var componentContainer, name, _ref, _results;
      callback(component);
      _ref = component.containers;
      _results = [];
      for (name in _ref) {
        componentContainer = _ref[name];
        _results.push(callback(componentContainer));
      }
      return _results;
    });
  };

  ComponentContainer.prototype.remove = function(component) {
    component.destroy();
    return this._detachComponent(component);
  };

  ComponentContainer.prototype.attachComponent = function(component, position) {
    var componentTree, func;
    if (position == null) {
      position = {};
    }
    func = (function(_this) {
      return function() {
        return _this.link(component, position);
      };
    })(this);
    if (componentTree = this.getComponentTree()) {
      return componentTree.attachingComponent(component, func);
    } else {
      return func();
    }
  };

  ComponentContainer.prototype._detachComponent = function(component) {
    var componentTree, func;
    func = (function(_this) {
      return function() {
        return _this.unlink(component);
      };
    })(this);
    if (componentTree = this.getComponentTree()) {
      return componentTree.detachingComponent(component, func);
    } else {
      return func();
    }
  };

  ComponentContainer.prototype.link = function(component, position) {
    if (component.parentContainer) {
      this.unlink(component);
    }
    position.parentContainer || (position.parentContainer = this);
    return this.setComponentPosition(component, position);
  };

  ComponentContainer.prototype.unlink = function(component) {
    var container, _ref, _ref1;
    container = component.parentContainer;
    if (container) {
      if (component.previous == null) {
        container.first = component.next;
      }
      if (component.next == null) {
        container.last = component.previous;
      }
      if ((_ref = component.next) != null) {
        _ref.previous = component.previous;
      }
      if ((_ref1 = component.previous) != null) {
        _ref1.next = component.next;
      }
      return this.setComponentPosition(component, {});
    }
  };

  ComponentContainer.prototype.setComponentPosition = function(component, _arg) {
    var next, parentContainer, previous;
    parentContainer = _arg.parentContainer, previous = _arg.previous, next = _arg.next;
    component.parentContainer = parentContainer;
    component.previous = previous;
    component.next = next;
    if (parentContainer) {
      if (previous) {
        previous.next = component;
      }
      if (next) {
        next.previous = component;
      }
      if (component.previous == null) {
        parentContainer.first = component;
      }
      if (component.next == null) {
        return parentContainer.last = component;
      }
    }
  };

  return ComponentContainer;

})();


},{"../modules/logging/assert":37}],8:[function(require,module,exports){
var EditableDirective, HtmlDirective, ImageDirective, assert, imageService;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

EditableDirective = require('./editable_directive');

ImageDirective = require('./image_directive');

HtmlDirective = require('./html_directive');

module.exports = {
  create: function(_arg) {
    var Directive, component, templateDirective;
    component = _arg.component, templateDirective = _arg.templateDirective;
    Directive = this.getDirectiveConstructor(templateDirective.type);
    return new Directive({
      component: component,
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
        return assert(false, "Unsupported component directive: " + directiveType);
    }
  }
};


},{"../image_services/image_service":25,"../modules/logging/assert":37,"./editable_directive":12,"./html_directive":13,"./image_directive":14}],9:[function(require,module,exports){
var ComponentContainer, ComponentModel, DirectiveCollection, assert, config, deepEqual, directiveFactory, guid, log;

deepEqual = require('deep-equal');

config = require('../configuration/config');

ComponentContainer = require('./component_container');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

directiveFactory = require('./component_directive_factory');

DirectiveCollection = require('../template/directive_collection');

module.exports = ComponentModel = (function() {
  function ComponentModel(_arg) {
    var id, _ref;
    _ref = _arg != null ? _arg : {}, this.template = _ref.template, id = _ref.id;
    assert(this.template, 'cannot instantiate component without template reference');
    this.initializeDirectives();
    this.styles = {};
    this.dataValues = {};
    this.id = id || guid.next();
    this.componentName = this.template.name;
    this.next = void 0;
    this.previous = void 0;
    this.componentTree = void 0;
  }

  ComponentModel.prototype.initializeDirectives = function() {
    var directive, _i, _len, _ref, _results;
    this.directives = new DirectiveCollection();
    _ref = this.template.directives;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      directive = _ref[_i];
      switch (directive.type) {
        case 'container':
          this.containers || (this.containers = {});
          _results.push(this.containers[directive.name] = new ComponentContainer({
            name: directive.name,
            parentComponent: this
          }));
          break;
        case 'editable':
        case 'image':
        case 'html':
          this.createComponentDirective(directive);
          this.content || (this.content = {});
          _results.push(this.content[directive.name] = void 0);
          break;
        default:
          _results.push(log.error("Template directive type '" + directive.type + "' not implemented in ComponentModel"));
      }
    }
    return _results;
  };

  ComponentModel.prototype.createComponentDirective = function(templateDirective) {
    return this.directives.add(directiveFactory.create({
      component: this,
      templateDirective: templateDirective
    }));
  };

  ComponentModel.prototype.createView = function(isReadOnly) {
    return this.template.createView(this, isReadOnly);
  };

  ComponentModel.prototype.before = function(componentModel) {
    if (componentModel) {
      this.parentContainer.insertBefore(this, componentModel);
      return this;
    } else {
      return this.previous;
    }
  };

  ComponentModel.prototype.after = function(componentModel) {
    if (componentModel) {
      this.parentContainer.insertAfter(this, componentModel);
      return this;
    } else {
      return this.next;
    }
  };

  ComponentModel.prototype.append = function(containerName, componentModel) {
    if (arguments.length === 1) {
      componentModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].append(componentModel);
    return this;
  };

  ComponentModel.prototype.prepend = function(containerName, componentModel) {
    if (arguments.length === 1) {
      componentModel = containerName;
      containerName = config.directives.container.defaultName;
    }
    this.containers[containerName].prepend(componentModel);
    return this;
  };

  ComponentModel.prototype.up = function() {
    this.parentContainer.up(this);
    return this;
  };

  ComponentModel.prototype.down = function() {
    this.parentContainer.down(this);
    return this;
  };

  ComponentModel.prototype.remove = function() {
    return this.parentContainer.remove(this);
  };

  ComponentModel.prototype.getParent = function() {
    var _ref;
    return (_ref = this.parentContainer) != null ? _ref.parentComponent : void 0;
  };

  ComponentModel.prototype.parents = function(callback) {
    var componentModel, _results;
    componentModel = this;
    _results = [];
    while ((componentModel = componentModel.getParent())) {
      _results.push(callback(componentModel));
    }
    return _results;
  };

  ComponentModel.prototype.children = function(callback) {
    var componentContainer, componentModel, name, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      componentContainer = _ref[name];
      componentModel = componentContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (componentModel) {
          callback(componentModel);
          _results1.push(componentModel = componentModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  ComponentModel.prototype.descendants = function(callback) {
    var componentContainer, componentModel, name, _ref, _results;
    _ref = this.containers;
    _results = [];
    for (name in _ref) {
      componentContainer = _ref[name];
      componentModel = componentContainer.first;
      _results.push((function() {
        var _results1;
        _results1 = [];
        while (componentModel) {
          callback(componentModel);
          componentModel.descendants(callback);
          _results1.push(componentModel = componentModel.next);
        }
        return _results1;
      })());
    }
    return _results;
  };

  ComponentModel.prototype.descendantsAndSelf = function(callback) {
    callback(this);
    return this.descendants(callback);
  };

  ComponentModel.prototype.descendantContainers = function(callback) {
    return this.descendantsAndSelf(function(componentModel) {
      var componentContainer, name, _ref, _results;
      _ref = componentModel.containers;
      _results = [];
      for (name in _ref) {
        componentContainer = _ref[name];
        _results.push(callback(componentContainer));
      }
      return _results;
    });
  };

  ComponentModel.prototype.allDescendants = function(callback) {
    return this.descendantsAndSelf((function(_this) {
      return function(componentModel) {
        var componentContainer, name, _ref, _results;
        if (componentModel !== _this) {
          callback(componentModel);
        }
        _ref = componentModel.containers;
        _results = [];
        for (name in _ref) {
          componentContainer = _ref[name];
          _results.push(callback(componentContainer));
        }
        return _results;
      };
    })(this));
  };

  ComponentModel.prototype.childrenAndSelf = function(callback) {
    callback(this);
    return this.children(callback);
  };

  ComponentModel.prototype.hasContainers = function() {
    return this.directives.count('container') > 0;
  };

  ComponentModel.prototype.hasEditables = function() {
    return this.directives.count('editable') > 0;
  };

  ComponentModel.prototype.hasHtml = function() {
    return this.directives.count('html') > 0;
  };

  ComponentModel.prototype.hasImages = function() {
    return this.directives.count('image') > 0;
  };

  ComponentModel.prototype.setContent = function(name, value) {
    if (!value) {
      if (this.content[name]) {
        this.content[name] = void 0;
        if (this.componentTree) {
          return this.componentTree.contentChanging(this, name);
        }
      }
    } else if (typeof value === 'string') {
      if (this.content[name] !== value) {
        this.content[name] = value;
        if (this.componentTree) {
          return this.componentTree.contentChanging(this, name);
        }
      }
    } else {
      if (!deepEqual(this.content[name], value)) {
        this.content[name] = value;
        if (this.componentTree) {
          return this.componentTree.contentChanging(this, name);
        }
      }
    }
  };

  ComponentModel.prototype.set = function(name, value) {
    var directive, _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "set error: " + this.componentName + " has no content named " + name);
    directive = this.directives.get(name);
    if (directive.isImage) {
      if (directive.getImageUrl() !== value) {
        directive.setImageUrl(value);
        if (this.componentTree) {
          return this.componentTree.contentChanging(this, name);
        }
      }
    } else {
      return this.setContent(name, value);
    }
  };

  ComponentModel.prototype.get = function(name) {
    var _ref;
    assert((_ref = this.content) != null ? _ref.hasOwnProperty(name) : void 0, "get error: " + this.componentName + " has no content named " + name);
    return this.directives.get(name).getContent();
  };

  ComponentModel.prototype.isEmpty = function(name) {
    var value;
    value = this.get(name);
    return value === void 0 || value === '';
  };

  ComponentModel.prototype.data = function(arg) {
    var changedDataProperties, name, value;
    if (typeof arg === 'object') {
      changedDataProperties = [];
      for (name in arg) {
        value = arg[name];
        if (this.changeData(name, value)) {
          changedDataProperties.push(name);
        }
      }
      if (this.componentTree && changedDataProperties.length > 0) {
        return this.componentTree.dataChanging(this, changedDataProperties);
      }
    } else {
      return this.dataValues[arg];
    }
  };

  ComponentModel.prototype.changeData = function(name, value) {
    if (!deepEqual(this.dataValues[name], value)) {
      this.dataValues[name] = value;
      return true;
    } else {
      return false;
    }
  };

  ComponentModel.prototype.getStyle = function(name) {
    return this.styles[name];
  };

  ComponentModel.prototype.setStyle = function(name, value) {
    var style;
    style = this.template.styles[name];
    if (!style) {
      return log.warn("Unknown style '" + name + "' in ComponentModel " + this.componentName);
    } else if (!style.validateValue(value)) {
      return log.warn("Invalid value '" + value + "' for style '" + name + "' in ComponentModel " + this.componentName);
    } else {
      if (this.styles[name] !== value) {
        this.styles[name] = value;
        if (this.componentTree) {
          return this.componentTree.htmlChanging(this, 'style', {
            name: name,
            value: value
          });
        }
      }
    }
  };

  ComponentModel.prototype.style = function(name, value) {
    console.log("ComponentModel#style() is deprecated. Please use #getStyle() and #setStyle().");
    if (arguments.length === 1) {
      return this.styles[name];
    } else {
      return this.setStyle(name, value);
    }
  };

  ComponentModel.prototype.copy = function() {
    return log.warn("ComponentModel#copy() is not implemented yet.");
  };

  ComponentModel.prototype.copyWithoutContent = function() {
    return this.template.createModel();
  };

  ComponentModel.prototype.destroy = function() {};

  return ComponentModel;

})();


},{"../configuration/config":16,"../modules/guid":36,"../modules/logging/assert":37,"../modules/logging/log":38,"../template/directive_collection":56,"./component_container":7,"./component_directive_factory":8,"deep-equal":1}],10:[function(require,module,exports){
var ComponentModel, assert, config, deepEqual, guid, log, serialization;

deepEqual = require('deep-equal');

config = require('../configuration/config');

guid = require('../modules/guid');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

ComponentModel = require('./component_model');

serialization = require('../modules/serialization');

module.exports = (function() {
  ComponentModel.prototype.toJson = function(component) {
    var json, name;
    if (component == null) {
      component = this;
    }
    json = {
      id: component.id,
      identifier: component.template.identifier
    };
    if (!serialization.isEmpty(component.content)) {
      json.content = serialization.flatCopy(component.content);
    }
    if (!serialization.isEmpty(component.styles)) {
      json.styles = serialization.flatCopy(component.styles);
    }
    if (!serialization.isEmpty(component.dataValues)) {
      json.data = $.extend(true, {}, component.dataValues);
    }
    for (name in component.containers) {
      json.containers || (json.containers = {});
      json.containers[name] = [];
    }
    return json;
  };
  return {
    fromJson: function(json, design) {
      var child, componentArray, containerName, model, name, styleName, template, value, _i, _len, _ref, _ref1, _ref2;
      template = design.get(json.component || json.identifier);
      assert(template, "error while deserializing component: unknown template identifier '" + json.identifier + "'");
      model = new ComponentModel({
        template: template,
        id: json.id
      });
      _ref = json.content;
      for (name in _ref) {
        value = _ref[name];
        assert(model.content.hasOwnProperty(name), "error while deserializing component: unknown content '" + name + "'");
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
        componentArray = _ref2[containerName];
        assert(model.containers.hasOwnProperty(containerName), "error while deserializing component: unknown container " + containerName);
        if (componentArray) {
          assert($.isArray(componentArray), "error while deserializing component: container is not array " + containerName);
          for (_i = 0, _len = componentArray.length; _i < _len; _i++) {
            child = componentArray[_i];
            model.append(containerName, this.fromJson(child, design));
          }
        }
      }
      return model;
    }
  };
})();


},{"../configuration/config":16,"../modules/guid":36,"../modules/logging/assert":37,"../modules/logging/log":38,"../modules/serialization":45,"./component_model":9,"deep-equal":1}],11:[function(require,module,exports){
var ComponentArray, ComponentContainer, ComponentModel, ComponentTree, assert, componentModelSerializer,
  __slice = [].slice;

assert = require('../modules/logging/assert');

ComponentContainer = require('./component_container');

ComponentArray = require('./component_array');

ComponentModel = require('./component_model');

componentModelSerializer = require('./component_model_serializer');

module.exports = ComponentTree = (function() {
  function ComponentTree(_arg) {
    var content, _ref;
    _ref = _arg != null ? _arg : {}, content = _ref.content, this.design = _ref.design;
    assert(this.design != null, "Error instantiating ComponentTree: design param is misssing.");
    this.root = new ComponentContainer({
      isRoot: true
    });
    if (content != null) {
      this.fromJson(content, this.design);
    }
    this.root.componentTree = this;
    this.initializeEvents();
  }

  ComponentTree.prototype.prepend = function(component) {
    component = this.getComponent(component);
    if (component != null) {
      this.root.prepend(component);
    }
    return this;
  };

  ComponentTree.prototype.append = function(component) {
    component = this.getComponent(component);
    if (component != null) {
      this.root.append(component);
    }
    return this;
  };

  ComponentTree.prototype.getComponent = function(componentName) {
    if (typeof componentName === 'string') {
      return this.createComponent(componentName);
    } else {
      return componentName;
    }
  };

  ComponentTree.prototype.createComponent = function(componentName) {
    var template;
    template = this.getTemplate(componentName);
    if (template) {
      return template.createModel();
    }
  };

  ComponentTree.prototype.getTemplate = function(componentName) {
    var template;
    template = this.design.get(componentName);
    assert(template, "Could not find template " + componentName);
    return template;
  };

  ComponentTree.prototype.initializeEvents = function() {
    this.componentAdded = $.Callbacks();
    this.componentRemoved = $.Callbacks();
    this.componentMoved = $.Callbacks();
    this.componentContentChanged = $.Callbacks();
    this.componentHtmlChanged = $.Callbacks();
    this.componentSettingsChanged = $.Callbacks();
    this.componentDataChanged = $.Callbacks();
    return this.changed = $.Callbacks();
  };

  ComponentTree.prototype.each = function(callback) {
    return this.root.each(callback);
  };

  ComponentTree.prototype.eachContainer = function(callback) {
    return this.root.eachContainer(callback);
  };

  ComponentTree.prototype.first = function() {
    return this.root.first;
  };

  ComponentTree.prototype.all = function(callback) {
    return this.root.all(callback);
  };

  ComponentTree.prototype.find = function(search) {
    var res;
    if (typeof search === 'string') {
      res = [];
      this.each(function(component) {
        if (component.componentName === search) {
          return res.push(component);
        }
      });
      return new ComponentArray(res);
    } else {
      return new ComponentArray();
    }
  };

  ComponentTree.prototype.detach = function() {
    var oldRoot;
    this.root.componentTree = void 0;
    this.each(function(component) {
      return component.componentTree = void 0;
    });
    oldRoot = this.root;
    this.root = new ComponentContainer({
      isRoot: true
    });
    return oldRoot;
  };

  ComponentTree.prototype.print = function() {
    var addLine, output, walker;
    output = 'ComponentTree\n-----------\n';
    addLine = function(text, indentation) {
      if (indentation == null) {
        indentation = 0;
      }
      return output += "" + (Array(indentation + 1).join(" ")) + text + "\n";
    };
    walker = function(component, indentation) {
      var componentContainer, name, template, _ref;
      if (indentation == null) {
        indentation = 0;
      }
      template = component.template;
      addLine("- " + template.label + " (" + template.name + ")", indentation);
      _ref = component.containers;
      for (name in _ref) {
        componentContainer = _ref[name];
        addLine("" + name + ":", indentation + 2);
        if (componentContainer.first) {
          walker(componentContainer.first, indentation + 4);
        }
      }
      if (component.next) {
        return walker(component.next, indentation);
      }
    };
    if (this.root.first) {
      walker(this.root.first);
    }
    return output;
  };

  ComponentTree.prototype.attachingComponent = function(component, attachComponentFunc) {
    if (component.componentTree === this) {
      attachComponentFunc();
      return this.fireEvent('componentMoved', component);
    } else {
      if (component.componentTree != null) {
        component.remove();
      }
      component.descendantsAndSelf((function(_this) {
        return function(descendant) {
          return descendant.componentTree = _this;
        };
      })(this));
      attachComponentFunc();
      return this.fireEvent('componentAdded', component);
    }
  };

  ComponentTree.prototype.fireEvent = function() {
    var args, event;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this[event].fire.apply(event, args);
    return this.changed.fire();
  };

  ComponentTree.prototype.detachingComponent = function(component, detachComponentFunc) {
    assert(component.componentTree === this, 'cannot remove component from another ComponentTree');
    component.descendantsAndSelf(function(descendants) {
      return descendants.componentTree = void 0;
    });
    detachComponentFunc();
    return this.fireEvent('componentRemoved', component);
  };

  ComponentTree.prototype.contentChanging = function(component) {
    return this.fireEvent('componentContentChanged', component);
  };

  ComponentTree.prototype.htmlChanging = function(component) {
    return this.fireEvent('componentHtmlChanged', component);
  };

  ComponentTree.prototype.dataChanging = function(component, changedProperties) {
    return this.fireEvent('componentDataChanged', component, changedProperties);
  };

  ComponentTree.prototype.printJson = function() {
    return words.readableJson(this.toJson());
  };

  ComponentTree.prototype.serialize = function() {
    var componentToData, data, walker;
    data = {};
    data['content'] = [];
    data['design'] = {
      name: this.design.name
    };
    componentToData = function(component, level, containerArray) {
      var componentData;
      componentData = component.toJson();
      containerArray.push(componentData);
      return componentData;
    };
    walker = function(component, level, dataObj) {
      var componentContainer, componentData, containerArray, name, _ref;
      componentData = componentToData(component, level, dataObj);
      _ref = component.containers;
      for (name in _ref) {
        componentContainer = _ref[name];
        containerArray = componentData.containers[componentContainer.name] = [];
        if (componentContainer.first) {
          walker(componentContainer.first, level + 1, containerArray);
        }
      }
      if (component.next) {
        return walker(component.next, level, dataObj);
      }
    };
    if (this.root.first) {
      walker(this.root.first, 0, data['content']);
    }
    return data;
  };

  ComponentTree.prototype.fromData = function(data, design, silent) {
    var component, componentData, _i, _len, _ref;
    if (silent == null) {
      silent = true;
    }
    if (design != null) {
      assert((this.design == null) || design.equals(this.design), 'Error loading data. Specified design is different from current componentTree design');
    } else {
      design = this.design;
    }
    if (silent) {
      this.root.componentTree = void 0;
    }
    if (data.content) {
      _ref = data.content;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        componentData = _ref[_i];
        component = componentModelSerializer.fromJson(componentData, design);
        this.root.append(component);
      }
    }
    if (silent) {
      this.root.componentTree = this;
      return this.root.each((function(_this) {
        return function(component) {
          return component.componentTree = _this;
        };
      })(this));
    }
  };

  ComponentTree.prototype.addData = function(data, design) {
    return this.fromData(data, design, false);
  };

  ComponentTree.prototype.addDataWithAnimation = function(data, delay) {
    var componentData, timeout, _fn, _i, _len, _ref, _results;
    if (delay == null) {
      delay = 200;
    }
    assert(this.design != null, 'Error adding data. ComponentTree has no design');
    timeout = Number(delay);
    _ref = data.content;
    _fn = (function(_this) {
      return function() {
        var content;
        content = componentData;
        return setTimeout(function() {
          var component;
          component = componentModelSerializer.fromJson(content, _this.design);
          return _this.root.append(component);
        }, timeout);
      };
    })(this);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      componentData = _ref[_i];
      _fn();
      _results.push(timeout += Number(delay));
    }
    return _results;
  };

  ComponentTree.prototype.toData = function() {
    return this.serialize();
  };

  ComponentTree.prototype.fromJson = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.fromData.apply(this, args);
  };

  ComponentTree.prototype.toJson = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.toData.apply(this, args);
  };

  return ComponentTree;

})();


},{"../modules/logging/assert":37,"./component_array":6,"./component_container":7,"./component_model":9,"./component_model_serializer":10}],12:[function(require,module,exports){
var EditableDirective, assert;

assert = require('../modules/logging/assert');

module.exports = EditableDirective = (function() {
  function EditableDirective(_arg) {
    this.component = _arg.component, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  EditableDirective.prototype.isEditable = true;

  EditableDirective.prototype.getContent = function() {
    return this.component.content[this.name];
  };

  return EditableDirective;

})();


},{"../modules/logging/assert":37}],13:[function(require,module,exports){
var HtmlDirective, assert;

assert = require('../modules/logging/assert');

module.exports = HtmlDirective = (function() {
  function HtmlDirective(_arg) {
    this.component = _arg.component, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  HtmlDirective.prototype.isHtml = true;

  HtmlDirective.prototype.getContent = function() {
    return this.component.content[this.name];
  };

  return HtmlDirective;

})();


},{"../modules/logging/assert":37}],14:[function(require,module,exports){
var ImageDirective, assert, imageService;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

module.exports = ImageDirective = (function() {
  function ImageDirective(_arg) {
    this.component = _arg.component, this.templateDirective = _arg.templateDirective;
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
    if (this.component.componentTree) {
      return this.component.componentTree.contentChanging(this.component, this.name);
    }
  };

  ImageDirective.prototype.setImageUrl = function(value) {
    var _base, _name;
    if ((_base = this.component.content)[_name = this.name] == null) {
      _base[_name] = {};
    }
    this.component.content[this.name].url = value;
    this.resetCrop();
    this.base64Image = void 0;
    return this.processImageUrl(value);
  };

  ImageDirective.prototype.getImageUrl = function() {
    var image;
    image = this.component.content[this.name];
    if (image) {
      return image.url;
    } else {
      return void 0;
    }
  };

  ImageDirective.prototype.getImageObject = function() {
    return this.component.content[this.name];
  };

  ImageDirective.prototype.getOriginalUrl = function() {
    return this.component.content[this.name].originalUrl || this.getImageUrl();
  };

  ImageDirective.prototype.setCrop = function(_arg) {
    var currentValue, height, name, width, x, y;
    x = _arg.x, y = _arg.y, width = _arg.width, height = _arg.height, name = _arg.name;
    currentValue = this.component.content[this.name];
    if ((currentValue != null ? currentValue.url : void 0) != null) {
      currentValue.crop = {
        x: x,
        y: y,
        width: width,
        height: height,
        name: name
      };
      this.processImageUrl(currentValue.originalUrl || currentValue.url);
      if (this.component.componentTree) {
        return this.component.componentTree.contentChanging(this.component, this.name);
      }
    }
  };

  ImageDirective.prototype.resetCrop = function() {
    var currentValue;
    currentValue = this.component.content[this.name];
    if (currentValue != null) {
      return currentValue.crop = null;
    }
  };

  ImageDirective.prototype.setImageService = function(imageServiceName) {
    var imageUrl;
    assert(imageService.has(imageServiceName), "Error: could not load image service " + imageServiceName);
    imageUrl = this.getImageUrl();
    return this.component.content[this.name] = {
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
    serviceName = (_ref = this.component.content[this.name]) != null ? _ref.imageService : void 0;
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


},{"../image_services/image_service":25,"../modules/logging/assert":37}],15:[function(require,module,exports){
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


},{}],16:[function(require,module,exports){
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
      component: 'doc-component',
      editable: 'doc-editable',
      noPlaceholder: 'doc-no-placeholder',
      emptyImage: 'doc-image-empty',
      "interface": 'doc-ui',
      componentHighlight: 'doc-component-highlight',
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


},{"./augment_config":15}],17:[function(require,module,exports){
var Assets, config;

config = require('../configuration/config');

module.exports = Assets = (function() {
  function Assets(_arg) {
    this.design = _arg.design;
  }

  Assets.prototype.loadCss = function(cssLoader, cb) {
    var cssUrls;
    if (this.css == null) {
      return cb();
    }
    cssUrls = this.convertToAbsolutePaths(this.css);
    return cssLoader.load(cssUrls, cb);
  };

  Assets.prototype.getAssetPath = function() {
    return "" + config.designPath + "/" + this.design.name;
  };

  Assets.prototype.convertToAbsolutePaths = function(urls) {
    return $.map(urls, (function(_this) {
      return function(path) {
        if (/\/\//.test(path) || /^\//.test(path)) {
          return path;
        }
        path = path.replace(/^[\.\/]*/, '');
        return "" + (_this.getAssetPath()) + "/" + path;
      };
    })(this));
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

  Assets.prototype.hasCss = function() {
    return this.css != null;
  };

  Assets.prototype.hasJs = function() {
    return this.js != null;
  };

  return Assets;

})();


},{"../configuration/config":16}],18:[function(require,module,exports){
var CssModificatorProperty, assert, log, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

module.exports = CssModificatorProperty = (function() {
  function CssModificatorProperty(_arg) {
    var label, options, value;
    this.name = _arg.name, label = _arg.label, this.type = _arg.type, value = _arg.value, options = _arg.options;
    this.label = label || words.humanize(this.name);
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


},{"../modules/logging/assert":37,"../modules/logging/log":38,"../modules/words":46}],19:[function(require,module,exports){
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
    this.assets = new Assets({
      design: this
    });
    this.defaultParagraph = void 0;
    this.defaultImage = void 0;
  }

  Design.prototype.equals = function(design) {
    return design.name === this.name && design.version === this.version;
  };

  Design.prototype.isNewerThan = function(design) {
    if (design == null) {
      return true;
    }
    return this.version > (design.version || '');
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
    return this.components.push(template.name, template);
  };

  Design.prototype.getComponentNameFromIdentifier = function(identifier) {
    var name;
    name = Template.parseIdentifier(identifier).name;
    return name;
  };

  Design.getIdentifier = function(name, version) {
    if (version) {
      return "" + name + "@" + version;
    } else {
      return "" + name;
    }
  };

  return Design;

})();


},{"../modules/logging/assert":37,"../modules/logging/log":38,"../modules/ordered_hash":43,"../template/template":60,"./assets":17}],20:[function(require,module,exports){
var Design, Version, assert;

assert = require('../modules/logging/assert');

Design = require('./design');

Version = require('./version');

module.exports = (function() {
  return {
    designs: {},
    load: function(designSpec) {
      var design, designIdentifier, version;
      assert(designSpec != null, 'design.load() was called with undefined.');
      assert(!(typeof designSpec === 'string'), 'design.load() loading a design by name is not implemented.');
      version = Version.parse(designSpec.version);
      designIdentifier = Design.getIdentifier(designSpec.name, version);
      if (this.has(designIdentifier)) {
        return;
      }
      design = Design.parser.parse(designSpec);
      if (design) {
        return this.add(design);
      } else {
        throw new Error(Design.parser.errors);
      }
    },
    add: function(design) {
      if (design.isNewerThan(this.designs[design.name])) {
        this.designs[design.name] = design;
      }
      return this.designs[design.identifier] = design;
    },
    has: function(designIdentifier) {
      return this.designs[designIdentifier] != null;
    },
    get: function(designIdentifier) {
      assert(this.has(designIdentifier), "Error: design '" + designIdentifier + "' is not loaded.");
      return this.designs[designIdentifier];
    },
    resetCache: function() {
      return this.designs = {};
    }
  };
})();


},{"../modules/logging/assert":37,"./design":19,"./version":23}],21:[function(require,module,exports){
var Scheme, Version, config, validator;

config = require('../configuration/config');

Scheme = require('../modules/object_schema/scheme');

Version = require('./version');

module.exports = validator = new Scheme();

validator.add('styleType', function(value) {
  return value === 'option' || value === 'select';
});

validator.add('semVer', function(value) {
  return Version.semVer.test(value);
});

validator.add('one empty option', function(value) {
  var emptyCount, entry, _i, _len;
  emptyCount = 0;
  for (_i = 0, _len = value.length; _i < _len; _i++) {
    entry = value[_i];
    if (!entry.value) {
      emptyCount += 1;
    }
  }
  return emptyCount === 1;
});

validator.add('design', {
  name: 'string',
  version: 'string, semVer',
  author: 'string, optional',
  description: 'string, optional',
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
  groups: 'array of group, optional',
  defaultComponents: {
    __validate: 'optional',
    paragraph: 'string, optional',
    image: 'string, optional'
  }
});

validator.add('component', {
  name: 'string',
  label: 'string, optional',
  html: 'string',
  properties: 'array of string, optional',
  __additionalProperty: function(key, value) {
    return false;
  }
});

validator.add('group', {
  label: 'string',
  components: 'array of string'
});

validator.add('componentProperty', {
  label: 'string, optional',
  type: 'string, styleType',
  value: 'string, optional',
  options: 'array of styleOption, one empty option, optional'
});

validator.add('styleOption', {
  caption: 'string',
  value: 'string, optional'
});


},{"../configuration/config":16,"../modules/object_schema/scheme":40,"./version":23}],22:[function(require,module,exports){
var CssModificatorProperty, Design, Template, Version, assert, designConfigSchema, designParser, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

designConfigSchema = require('./design_config_schema');

CssModificatorProperty = require('./css_modificator_property');

Template = require('../template/template');

Design = require('./design');

Version = require('./version');

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
  createDesign: function(designConfig) {
    var assets, componentProperties, components, defaultComponents, error, groups;
    assets = designConfig.assets, components = designConfig.components, componentProperties = designConfig.componentProperties, groups = designConfig.groups, defaultComponents = designConfig.defaultComponents;
    try {
      this.design = this.parseDesignInfo(designConfig);
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
  parseDesignInfo: function(design) {
    var version;
    version = new Version(design.version);
    return new Design({
      name: design.name,
      version: version.toString()
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
      config.name = name;
      _results.push(this.componentProperties[name] = this.createComponentProperty(config));
    }
    return _results;
  },
  parseComponents: function(components) {
    var component, html, label, name, properties, _i, _len, _ref, _results;
    if (components == null) {
      components = [];
    }
    _results = [];
    for (_i = 0, _len = components.length; _i < _len; _i++) {
      _ref = components[_i], name = _ref.name, label = _ref.label, html = _ref.html, properties = _ref.properties;
      properties = this.lookupComponentProperties(properties);
      component = new Template({
        name: name,
        label: label,
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
        label: group.label,
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


},{"../modules/logging/assert":37,"../modules/logging/log":38,"../template/template":60,"./css_modificator_property":18,"./design":19,"./design_config_schema":21,"./version":23}],23:[function(require,module,exports){
var Version;

module.exports = Version = (function() {
  Version.semVer = /(\d+)\.(\d+)\.(\d+)(.+)?/;

  function Version(versionString) {
    this.parseVersion(versionString);
  }

  Version.prototype.parseVersion = function(versionString) {
    var res;
    res = Version.semVer.exec(versionString);
    if (res) {
      this.major = res[1];
      this.minor = res[2];
      this.patch = res[3];
      return this.addendum = res[4];
    }
  };

  Version.prototype.isValid = function() {
    return this.major != null;
  };

  Version.prototype.toString = function() {
    return "" + this.major + "." + this.minor + "." + this.patch + (this.addendum || '');
  };

  Version.parse = function(versionString) {
    var v;
    v = new Version(versionString);
    if (v.isValid()) {
      return v.toString();
    } else {
      return '';
    }
  };

  return Version;

})();


},{}],24:[function(require,module,exports){
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


},{}],25:[function(require,module,exports){
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


},{"../modules/logging/assert":37,"./default_image_service":24,"./resrcit_image_service":26}],26:[function(require,module,exports){
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


},{"../modules/logging/assert":37,"./default_image_service":24}],27:[function(require,module,exports){
var ComponentDrag, config, css, dom, isSupported;

dom = require('./dom');

isSupported = require('../modules/feature_detection/is_supported');

config = require('../configuration/config');

css = config.css;

module.exports = ComponentDrag = (function() {
  var startAndEndOffset, wiggleSpace;

  wiggleSpace = 0;

  startAndEndOffset = 0;

  function ComponentDrag(_arg) {
    var componentView;
    this.componentModel = _arg.componentModel, componentView = _arg.componentView;
    if (componentView) {
      this.$view = componentView.$html;
    }
    this.$highlightedContainer = {};
  }

  ComponentDrag.prototype.start = function(eventPosition) {
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

  ComponentDrag.prototype.move = function(eventPosition) {
    this.$placeholder.css({
      left: "" + eventPosition.pageX + "px",
      top: "" + eventPosition.pageY + "px"
    });
    return this.target = this.findDropTarget(eventPosition);
  };

  ComponentDrag.prototype.findDropTarget = function(eventPosition) {
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
    if ((target != null) && ((_ref1 = target.componentView) != null ? _ref1.model : void 0) !== this.componentModel) {
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

  ComponentDrag.prototype.markDropPosition = function(target) {
    switch (target.target) {
      case 'component':
        this.componentPosition(target);
        return this.removeContainerHighlight();
      case 'container':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
      case 'root':
        this.showMarkerAtBeginningOfContainer(target.node);
        return this.highlighContainer($(target.node));
    }
  };

  ComponentDrag.prototype.componentPosition = function(target) {
    var before, next;
    if (target.position === 'before') {
      before = target.componentView.prev();
      if (before != null) {
        if (before.model === this.componentModel) {
          target.position = 'after';
          return this.componentPosition(target);
        }
        return this.showMarkerBetweenComponents(before, target.componentView);
      } else {
        return this.showMarkerAtBeginningOfContainer(target.componentView.$elem[0].parentNode);
      }
    } else {
      next = target.componentView.next();
      if (next != null) {
        if (next.model === this.componentModel) {
          target.position = 'before';
          return this.componentPosition(target);
        }
        return this.showMarkerBetweenComponents(target.componentView, next);
      } else {
        return this.showMarkerAtEndOfContainer(target.componentView.$elem[0].parentNode);
      }
    }
  };

  ComponentDrag.prototype.showMarkerBetweenComponents = function(viewA, viewB) {
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

  ComponentDrag.prototype.showMarkerAtBeginningOfContainer = function(elem) {
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

  ComponentDrag.prototype.showMarkerAtEndOfContainer = function(elem) {
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

  ComponentDrag.prototype.showMarker = function(_arg) {
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

  ComponentDrag.prototype.makeSpace = function(node, position) {
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

  ComponentDrag.prototype.undoMakeSpace = function(node) {
    if (this.lastTransform != null) {
      this.lastTransform.css({
        transform: ''
      });
      return this.lastTransform = void 0;
    }
  };

  ComponentDrag.prototype.highlighContainer = function($container) {
    var _base, _base1;
    if ($container[0] !== this.$highlightedContainer[0]) {
      if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
        _base.removeClass(css.containerHighlight);
      }
      this.$highlightedContainer = $container;
      return typeof (_base1 = this.$highlightedContainer).addClass === "function" ? _base1.addClass(css.containerHighlight) : void 0;
    }
  };

  ComponentDrag.prototype.removeContainerHighlight = function() {
    var _base;
    if (typeof (_base = this.$highlightedContainer).removeClass === "function") {
      _base.removeClass(css.containerHighlight);
    }
    return this.$highlightedContainer = {};
  };

  ComponentDrag.prototype.getElemUnderCursor = function(eventPosition) {
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

  ComponentDrag.prototype.findElemInIframe = function(iframeElem, eventPosition) {
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

  ComponentDrag.prototype.unblockElementFromPoint = function(callback) {
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

  ComponentDrag.prototype.drop = function() {
    if (this.target != null) {
      this.moveToTarget(this.target);
      return this.page.componentWasDropped.fire(this.componentModel);
    } else {

    }
  };

  ComponentDrag.prototype.moveToTarget = function(target) {
    var componentModel, componentTree, componentView;
    switch (target.target) {
      case 'component':
        componentView = target.componentView;
        if (target.position === 'before') {
          return componentView.model.before(this.componentModel);
        } else {
          return componentView.model.after(this.componentModel);
        }
        break;
      case 'container':
        componentModel = target.componentView.model;
        return componentModel.append(target.containerName, this.componentModel);
      case 'root':
        componentTree = target.componentTree;
        return componentTree.prepend(this.componentModel);
    }
  };

  ComponentDrag.prototype.reset = function() {
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

  ComponentDrag.prototype.createPlaceholder = function() {
    var $placeholder, numberOfDraggedElems, template;
    numberOfDraggedElems = 1;
    template = "<div class=\"" + css.draggedPlaceholder + "\">\n  <span class=\"" + css.draggedPlaceholderCounter + "\">\n    " + numberOfDraggedElems + "\n  </span>\n  Selected Item\n</div>";
    return $placeholder = $(template).css({
      position: "absolute"
    });
  };

  return ComponentDrag;

})();


},{"../configuration/config":16,"../modules/feature_detection/is_supported":35,"./dom":28}],28:[function(require,module,exports){
var config, css;

config = require('../configuration/config');

css = config.css;

module.exports = (function() {
  var componentRegex, sectionRegex;
  componentRegex = new RegExp("(?: |^)" + css.component + "(?: |$)");
  sectionRegex = new RegExp("(?: |^)" + css.section + "(?: |$)");
  return {
    findComponentView: function(node) {
      var view;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        if (componentRegex.test(node.className)) {
          view = this.getComponentView(node);
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
            view = this.findComponentView(node);
          }
          return {
            node: node,
            containerName: containerName,
            componentView: view
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
      var closestComponentData, containerAttr, left, top;
      top = _arg.top, left = _arg.left;
      node = this.getElementNode(node);
      containerAttr = config.directives.container.renderedAttr;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute(containerAttr)) {
          closestComponentData = this.getClosestComponent(node, {
            top: top,
            left: left
          });
          if (closestComponentData != null) {
            return this.getClosestComponentTarget(closestComponentData);
          } else {
            return this.getContainerTarget(node);
          }
        } else if (componentRegex.test(node.className)) {
          return this.getComponentTarget(node, {
            top: top,
            left: left
          });
        } else if (sectionRegex.test(node.className)) {
          closestComponentData = this.getClosestComponent(node, {
            top: top,
            left: left
          });
          if (closestComponentData != null) {
            return this.getClosestComponentTarget(closestComponentData);
          } else {
            return this.getRootTarget(node);
          }
        }
        node = node.parentNode;
      }
    },
    getComponentTarget: function(elem, _arg) {
      var left, position, top;
      top = _arg.top, left = _arg.left, position = _arg.position;
      return {
        target: 'component',
        componentView: this.getComponentView(elem),
        position: position || this.getPositionOnComponent(elem, {
          top: top,
          left: left
        })
      };
    },
    getClosestComponentTarget: function(closestComponentData) {
      var elem, position;
      elem = closestComponentData.$elem[0];
      position = closestComponentData.position;
      return this.getComponentTarget(elem, {
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
        componentView: this.findComponentView(node),
        containerName: containerName
      };
    },
    getRootTarget: function(node) {
      var componentTree;
      componentTree = $(node).data('componentTree');
      return {
        target: 'root',
        node: node,
        componentTree: componentTree
      };
    },
    getPositionOnComponent: function(elem, _arg) {
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
    getClosestComponent: function(container, _arg) {
      var $components, closest, closestComponent, left, top;
      top = _arg.top, left = _arg.left;
      $components = $(container).find("." + css.component);
      closest = void 0;
      closestComponent = void 0;
      $components.each((function(_this) {
        return function(index, elem) {
          var $elem, elemBottom, elemHeight, elemTop;
          $elem = $(elem);
          elemTop = $elem.offset().top;
          elemHeight = $elem.outerHeight();
          elemBottom = elemTop + elemHeight;
          if ((closest == null) || _this.distance(top, elemTop) < closest) {
            closest = _this.distance(top, elemTop);
            closestComponent = {
              $elem: $elem,
              position: 'before'
            };
          }
          if ((closest == null) || _this.distance(top, elemBottom) < closest) {
            closest = _this.distance(top, elemBottom);
            return closestComponent = {
              $elem: $elem,
              position: 'after'
            };
          }
        };
      })(this));
      return closestComponent;
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
    getComponentView: function(node) {
      return $(node).data('componentView');
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


},{"../configuration/config":16}],29:[function(require,module,exports){
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


},{"../configuration/config":16}],30:[function(require,module,exports){
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
        view = dom.findComponentView(element);
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


},{"../configuration/config":16,"./dom":28}],31:[function(require,module,exports){
var Focus, dom;

dom = require('./dom');

module.exports = Focus = (function() {
  function Focus() {
    this.editableNode = void 0;
    this.componentView = void 0;
    this.componentFocus = $.Callbacks();
    this.componentBlur = $.Callbacks();
  }

  Focus.prototype.setFocus = function(componentView, editableNode) {
    if (editableNode !== this.editableNode) {
      this.resetEditable();
      this.editableNode = editableNode;
    }
    if (componentView !== this.componentView) {
      this.resetComponentView();
      if (componentView) {
        this.componentView = componentView;
        return this.componentFocus.fire(this.componentView);
      }
    }
  };

  Focus.prototype.editableFocused = function(editableNode, componentView) {
    if (this.editableNode !== editableNode) {
      componentView || (componentView = dom.findComponentView(editableNode));
      return this.setFocus(componentView, editableNode);
    }
  };

  Focus.prototype.editableBlurred = function(editableNode) {
    if (this.editableNode === editableNode) {
      return this.setFocus(this.componentView, void 0);
    }
  };

  Focus.prototype.componentFocused = function(componentView) {
    if (this.componentView !== componentView) {
      return this.setFocus(componentView, void 0);
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

  Focus.prototype.resetComponentView = function() {
    var previous;
    if (this.componentView) {
      previous = this.componentView;
      this.componentView = void 0;
      return this.componentBlur.fire(previous);
    }
  };

  return Focus;

})();


},{"./dom":28}],32:[function(require,module,exports){
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
    var componentTree;
    componentTree = _arg.componentTree;
    this.design = componentTree.design;
    this.setComponentTree(componentTree);
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

  Livingdoc.prototype.setComponentTree = function(componentTree) {
    assert(componentTree.design === this.design, 'ComponentTree must have the same design as the document');
    this.model = this.componentTree = componentTree;
    return this.forwardComponentTreeEvents();
  };

  Livingdoc.prototype.forwardComponentTreeEvents = function() {
    return this.componentTree.changed.add((function(_this) {
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
    view = new View(this.componentTree, $parent[0]);
    promise = view.create(options);
    if (view.isInteractive) {
      this.setInteractiveView(view);
    }
    return promise;
  };

  Livingdoc.prototype.createComponent = function() {
    return this.componentTree.createComponent.apply(this.componentTree, arguments);
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
    view = new View(this.componentTree, $parent[0]);
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

  Livingdoc.prototype.toHtml = function(_arg) {
    var excludeComponents;
    excludeComponents = (_arg != null ? _arg : {}).excludeComponents;
    return new Renderer({
      componentTree: this.componentTree,
      renderingContainer: new RenderingContainer(),
      excludeComponents: excludeComponents
    }).html();
  };

  Livingdoc.prototype.serialize = function() {
    return this.componentTree.serialize();
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
    return this.componentTree.print();
  };

  Livingdoc.dom = dom;

  return Livingdoc;

})(EventEmitter);


},{"./configuration/config":16,"./interaction/dom":28,"./modules/logging/assert":37,"./rendering/renderer":48,"./rendering/view":49,"./rendering_container/interactive_page":52,"./rendering_container/page":53,"./rendering_container/rendering_container":54,"wolfy87-eventemitter":4}],33:[function(require,module,exports){
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


},{}],34:[function(require,module,exports){
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


},{}],35:[function(require,module,exports){
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


},{"./feature_detects":34}],36:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};


},{"./log":38}],38:[function(require,module,exports){
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


},{}],39:[function(require,module,exports){
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


},{}],40:[function(require,module,exports){
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


},{"./property_validator":39,"./validation_errors":41,"./validators":42}],41:[function(require,module,exports){
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


},{}],42:[function(require,module,exports){
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


},{}],43:[function(require,module,exports){
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


},{}],44:[function(require,module,exports){
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


},{"../modules/logging/assert":37}],45:[function(require,module,exports){
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


},{}],46:[function(require,module,exports){
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


},{}],47:[function(require,module,exports){
var ComponentView, DirectiveIterator, attr, config, css, dom, eventing;

config = require('../configuration/config');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

module.exports = ComponentView = (function() {
  function ComponentView(_arg) {
    this.model = _arg.model, this.$html = _arg.$html, this.directives = _arg.directives, this.isReadOnly = _arg.isReadOnly;
    this.$elem = this.$html;
    this.template = this.model.template;
    this.isAttachedToDom = false;
    this.wasAttachedToDom = $.Callbacks();
    if (!this.isReadOnly) {
      this.$html.data('componentView', this).addClass(css.component).attr(attr.template, this.template.identifier);
    }
    this.render();
  }

  ComponentView.prototype.render = function(mode) {
    this.updateContent();
    return this.updateHtml();
  };

  ComponentView.prototype.updateContent = function() {
    this.content(this.model.content);
    if (!this.hasFocus()) {
      this.displayOptionals();
    }
    return this.stripHtmlIfReadOnly();
  };

  ComponentView.prototype.updateHtml = function() {
    var name, value, _ref;
    _ref = this.model.styles;
    for (name in _ref) {
      value = _ref[name];
      this.setStyle(name, value);
    }
    return this.stripHtmlIfReadOnly();
  };

  ComponentView.prototype.displayOptionals = function() {
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

  ComponentView.prototype.showOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional) {
          return config.animations.optionals.show($(directive.elem));
        }
      };
    })(this));
  };

  ComponentView.prototype.hideEmptyOptionals = function() {
    return this.directives.each((function(_this) {
      return function(directive) {
        if (directive.optional && _this.model.isEmpty(directive.name)) {
          return config.animations.optionals.hide($(directive.elem));
        }
      };
    })(this));
  };

  ComponentView.prototype.next = function() {
    return this.$html.next().data('componentView');
  };

  ComponentView.prototype.prev = function() {
    return this.$html.prev().data('componentView');
  };

  ComponentView.prototype.afterFocused = function() {
    this.$html.addClass(css.componentHighlight);
    return this.showOptionals();
  };

  ComponentView.prototype.afterBlurred = function() {
    this.$html.removeClass(css.componentHighlight);
    return this.hideEmptyOptionals();
  };

  ComponentView.prototype.focus = function(cursor) {
    var first, _ref;
    first = (_ref = this.directives.editable) != null ? _ref[0].elem : void 0;
    return $(first).focus();
  };

  ComponentView.prototype.hasFocus = function() {
    return this.$html.hasClass(css.componentHighlight);
  };

  ComponentView.prototype.getBoundingClientRect = function() {
    return this.$html[0].getBoundingClientRect();
  };

  ComponentView.prototype.getAbsoluteBoundingClientRect = function() {
    return dom.getAbsoluteBoundingClientRect(this.$html[0]);
  };

  ComponentView.prototype.content = function(content) {
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

  ComponentView.prototype.set = function(name, value) {
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

  ComponentView.prototype.get = function(name) {
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

  ComponentView.prototype.getEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  ComponentView.prototype.setEditable = function(name, value) {
    var $elem;
    if (this.hasFocus()) {
      return;
    }
    $elem = this.directives.$getElem(name);
    $elem.toggleClass(css.noPlaceholder, Boolean(value));
    $elem.attr(attr.placeholder, this.template.defaults[name]);
    return $elem.html(value || '');
  };

  ComponentView.prototype.focusEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.addClass(css.noPlaceholder);
  };

  ComponentView.prototype.blurEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    if (this.model.isEmpty(name)) {
      return $elem.removeClass(css.noPlaceholder);
    }
  };

  ComponentView.prototype.getHtml = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  ComponentView.prototype.setHtml = function(name, value) {
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

  ComponentView.prototype.getDirectiveElement = function(directiveName) {
    var _ref;
    return (_ref = this.directives.get(directiveName)) != null ? _ref.elem : void 0;
  };

  ComponentView.prototype.resetDirectives = function() {
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

  ComponentView.prototype.getImage = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr('src');
  };

  ComponentView.prototype.setImage = function(name, value) {
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

  ComponentView.prototype.setPlaceholderImage = function($elem, name) {
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

  ComponentView.prototype.setStyle = function(name, className) {
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

  ComponentView.prototype.disableTabbing = function($elem) {
    return setTimeout((function(_this) {
      return function() {
        return $elem.find('iframe').attr('tabindex', '-1');
      };
    })(this), 400);
  };

  ComponentView.prototype.blockInteraction = function($elem) {
    var $blocker;
    this.ensureRelativePosition($elem);
    $blocker = $("<div class='" + css.interactionBlocker + "'>").attr('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0;');
    $elem.append($blocker);
    return this.disableTabbing($elem);
  };

  ComponentView.prototype.ensureRelativePosition = function($elem) {
    var position;
    position = $elem.css('position');
    if (position !== 'absolute' && position !== 'fixed' && position !== 'relative') {
      return $elem.css('position', 'relative');
    }
  };

  ComponentView.prototype.get$container = function() {
    return $(dom.findContainer(this.$html[0]).node);
  };

  ComponentView.prototype.delayUntilAttached = function(name, func) {
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

  ComponentView.prototype.cancelDelayed = function(name) {
    var _ref;
    if ((_ref = this.delayed) != null ? _ref[name] : void 0) {
      this.wasAttachedToDom.remove(this.delayed[name]);
      return this.delayed[name] = void 0;
    }
  };

  ComponentView.prototype.stripHtmlIfReadOnly = function() {
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

  ComponentView.prototype.stripDocClasses = function(elem) {
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

  ComponentView.prototype.stripDocAttributes = function(elem) {
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

  ComponentView.prototype.stripEmptyAttributes = function(elem) {
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

  ComponentView.prototype.setAttachedToDom = function(newVal) {
    if (newVal === this.isAttachedToDom) {
      return;
    }
    this.isAttachedToDom = newVal;
    if (newVal) {
      this.resetDirectives();
      return this.wasAttachedToDom.fire();
    }
  };

  return ComponentView;

})();


},{"../configuration/config":16,"../interaction/dom":28,"../modules/eventing":33,"../template/directive_iterator":59}],48:[function(require,module,exports){
var Renderer, Semaphore, assert, config, log;

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Semaphore = require('../modules/semaphore');

config = require('../configuration/config');

module.exports = Renderer = (function() {
  function Renderer(_arg) {
    var $wrapper, excludeComponents;
    this.componentTree = _arg.componentTree, this.renderingContainer = _arg.renderingContainer, $wrapper = _arg.$wrapper, excludeComponents = _arg.excludeComponents;
    assert(this.componentTree, 'no componentTree specified');
    assert(this.renderingContainer, 'no rendering container specified');
    this.$root = $(this.renderingContainer.renderNode);
    this.$wrapperHtml = $wrapper;
    this.componentViews = {};
    this.excludedComponentIds = {};
    this.excludeComponent(excludeComponents);
    this.readySemaphore = new Semaphore();
    this.renderOncePageReady();
    this.readySemaphore.start();
  }

  Renderer.prototype.excludeComponent = function(componentId) {
    var compId, view, _i, _len, _results;
    if (componentId == null) {
      return;
    }
    if ($.isArray(componentId)) {
      _results = [];
      for (_i = 0, _len = componentId.length; _i < _len; _i++) {
        compId = componentId[_i];
        _results.push(this.excludeComponent(compId));
      }
      return _results;
    } else {
      this.excludedComponentIds[componentId] = true;
      view = this.componentViews[componentId];
      if ((view != null) && view.isAttachedToDom) {
        return this.removeComponent(view.model);
      }
    }
  };

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
    return this.$root.data('componentTree', this.componentTree);
  };

  Renderer.prototype.renderOncePageReady = function() {
    this.readySemaphore.increment();
    return this.renderingContainer.ready((function(_this) {
      return function() {
        _this.setRoot();
        _this.render();
        _this.setupComponentTreeListeners();
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

  Renderer.prototype.setupComponentTreeListeners = function() {
    this.componentTree.componentAdded.add($.proxy(this.componentAdded, this));
    this.componentTree.componentRemoved.add($.proxy(this.componentRemoved, this));
    this.componentTree.componentMoved.add($.proxy(this.componentMoved, this));
    this.componentTree.componentContentChanged.add($.proxy(this.componentContentChanged, this));
    return this.componentTree.componentHtmlChanged.add($.proxy(this.componentHtmlChanged, this));
  };

  Renderer.prototype.componentAdded = function(model) {
    return this.insertComponent(model);
  };

  Renderer.prototype.componentRemoved = function(model) {
    this.removeComponent(model);
    return this.deleteCachedComponentViewForComponent(model);
  };

  Renderer.prototype.componentMoved = function(model) {
    this.removeComponent(model);
    return this.insertComponent(model);
  };

  Renderer.prototype.componentContentChanged = function(model) {
    return this.componentViewForComponent(model).updateContent();
  };

  Renderer.prototype.componentHtmlChanged = function(model) {
    return this.componentViewForComponent(model).updateHtml();
  };

  Renderer.prototype.componentViewForComponent = function(model) {
    var _base, _name;
    return (_base = this.componentViews)[_name = model.id] || (_base[_name] = model.createView(this.renderingContainer.isReadOnly));
  };

  Renderer.prototype.deleteCachedComponentViewForComponent = function(model) {
    return delete this.componentViews[model.id];
  };

  Renderer.prototype.render = function() {
    return this.componentTree.each((function(_this) {
      return function(model) {
        return _this.insertComponent(model);
      };
    })(this));
  };

  Renderer.prototype.clear = function() {
    this.componentTree.each((function(_this) {
      return function(model) {
        return _this.componentViewForComponent(model).setAttachedToDom(false);
      };
    })(this));
    return this.$root.empty();
  };

  Renderer.prototype.redraw = function() {
    this.clear();
    return this.render();
  };

  Renderer.prototype.insertComponent = function(model) {
    var componentView;
    if (this.isComponentAttached(model) || this.excludedComponentIds[model.id] === true) {
      return;
    }
    if (this.isComponentAttached(model.previous)) {
      this.insertComponentAsSibling(model.previous, model);
    } else if (this.isComponentAttached(model.next)) {
      this.insertComponentAsSibling(model.next, model);
    } else if (model.parentContainer) {
      this.appendComponentToParentContainer(model);
    } else {
      log.error('Component could not be inserted by renderer.');
    }
    componentView = this.componentViewForComponent(model);
    componentView.setAttachedToDom(true);
    this.renderingContainer.componentViewWasInserted(componentView);
    return this.attachChildComponents(model);
  };

  Renderer.prototype.isComponentAttached = function(model) {
    return model && this.componentViewForComponent(model).isAttachedToDom;
  };

  Renderer.prototype.attachChildComponents = function(model) {
    return model.children((function(_this) {
      return function(childModel) {
        if (!_this.isComponentAttached(childModel)) {
          return _this.insertComponent(childModel);
        }
      };
    })(this));
  };

  Renderer.prototype.insertComponentAsSibling = function(sibling, model) {
    var method;
    method = sibling === model.previous ? 'after' : 'before';
    return this.$nodeForComponent(sibling)[method](this.$nodeForComponent(model));
  };

  Renderer.prototype.appendComponentToParentContainer = function(model) {
    return this.$nodeForComponent(model).appendTo(this.$nodeForContainer(model.parentContainer));
  };

  Renderer.prototype.$nodeForComponent = function(model) {
    return this.componentViewForComponent(model).$html;
  };

  Renderer.prototype.$nodeForContainer = function(container) {
    var parentView;
    if (container.isRoot) {
      return this.$root;
    } else {
      parentView = this.componentViewForComponent(container.parentComponent);
      return $(parentView.getDirectiveElement(container.name));
    }
  };

  Renderer.prototype.removeComponent = function(model) {
    this.componentViewForComponent(model).setAttachedToDom(false);
    return this.$nodeForComponent(model).detach();
  };

  return Renderer;

})();


},{"../configuration/config":16,"../modules/logging/assert":37,"../modules/logging/log":38,"../modules/semaphore":44}],49:[function(require,module,exports){
var InteractivePage, Page, Renderer, View;

Renderer = require('./renderer');

Page = require('../rendering_container/page');

InteractivePage = require('../rendering_container/interactive_page');

module.exports = View = (function() {
  function View(componentTree, parent) {
    this.componentTree = componentTree;
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
      design: this.componentTree.design
    };
    this.page = this.createPage(params, options);
    return new Renderer({
      renderingContainer: this.page,
      componentTree: this.componentTree,
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


},{"../rendering_container/interactive_page":52,"../rendering_container/page":53,"./renderer":48}],50:[function(require,module,exports){
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


},{"../modules/semaphore":44}],51:[function(require,module,exports){
var ComponentDrag, DragBase, EditorPage, config, css;

config = require('../configuration/config');

css = config.css;

DragBase = require('../interaction/drag_base');

ComponentDrag = require('../interaction/component_drag');

module.exports = EditorPage = (function() {
  function EditorPage() {
    this.setWindow();
    this.dragBase = new DragBase(this);
    this.editableController = {
      disableAll: function() {},
      reenableAll: function() {}
    };
    this.componentWasDropped = {
      fire: function() {}
    };
    this.blurFocusedElement = function() {};
  }

  EditorPage.prototype.startDrag = function(_arg) {
    var componentDrag, componentModel, componentView, config, event;
    componentModel = _arg.componentModel, componentView = _arg.componentView, event = _arg.event, config = _arg.config;
    if (!(componentModel || componentView)) {
      return;
    }
    if (componentView) {
      componentModel = componentView.model;
    }
    componentDrag = new ComponentDrag({
      componentModel: componentModel,
      componentView: componentView
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
    return this.dragBase.init(componentDrag, event, config);
  };

  EditorPage.prototype.setWindow = function() {
    this.window = window;
    this.document = this.window.document;
    this.$document = $(this.document);
    return this.$body = $(this.document.body);
  };

  return EditorPage;

})();


},{"../configuration/config":16,"../interaction/component_drag":27,"../interaction/drag_base":29}],52:[function(require,module,exports){
var ComponentDrag, DragBase, EditableController, Focus, InteractivePage, Page, config, dom,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

config = require('../configuration/config');

Page = require('./page');

dom = require('../interaction/dom');

Focus = require('../interaction/focus');

EditableController = require('../interaction/editable_controller');

DragBase = require('../interaction/drag_base');

ComponentDrag = require('../interaction/component_drag');

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
    this.componentWillBeDragged = $.Callbacks();
    this.componentWasDropped = $.Callbacks();
    this.dragBase = new DragBase(this);
    this.focus.componentFocus.add($.proxy(this.afterComponentFocused, this));
    this.focus.componentBlur.add($.proxy(this.afterComponentBlurred, this));
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
    var componentView, isControl;
    if (event.which !== LEFT_MOUSE_BUTTON && event.type === 'mousedown') {
      return;
    }
    isControl = $(event.target).closest(config.ignoreInteraction).length;
    if (isControl) {
      return;
    }
    componentView = dom.findComponentView(event.target);
    this.handleClickedComponent(event, componentView);
    if (componentView) {
      return this.startDrag({
        componentView: componentView,
        event: event
      });
    }
  };

  InteractivePage.prototype.startDrag = function(_arg) {
    var componentDrag, componentModel, componentView, config, event;
    componentModel = _arg.componentModel, componentView = _arg.componentView, event = _arg.event, config = _arg.config;
    if (!(componentModel || componentView)) {
      return;
    }
    if (componentView) {
      componentModel = componentView.model;
    }
    componentDrag = new ComponentDrag({
      componentModel: componentModel,
      componentView: componentView
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
    return this.dragBase.init(componentDrag, event, config);
  };

  InteractivePage.prototype.cancelDrag = function() {
    return this.dragBase.cancel();
  };

  InteractivePage.prototype.handleClickedComponent = function(event, componentView) {
    var nodeContext;
    if (componentView) {
      this.focus.componentFocused(componentView);
      nodeContext = dom.findNodeContext(event.target);
      if (nodeContext) {
        switch (nodeContext.contextAttr) {
          case config.directives.image.renderedAttr:
            return this.imageClick.fire(componentView, nodeContext.attrName, event);
          case config.directives.html.renderedAttr:
            return this.htmlElementClick.fire(componentView, nodeContext.attrName, event);
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

  InteractivePage.prototype.componentViewWasInserted = function(componentView) {
    return this.initializeEditables(componentView);
  };

  InteractivePage.prototype.initializeEditables = function(componentView) {
    var directive, editableNodes;
    if (componentView.directives.editable) {
      editableNodes = (function() {
        var _i, _len, _ref, _results;
        _ref = componentView.directives.editable;
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

  InteractivePage.prototype.afterComponentFocused = function(componentView) {
    return componentView.afterFocused();
  };

  InteractivePage.prototype.afterComponentBlurred = function(componentView) {
    return componentView.afterBlurred();
  };

  return InteractivePage;

})(Page);


},{"../configuration/config":16,"../interaction/component_drag":27,"../interaction/dom":28,"../interaction/drag_base":29,"../interaction/editable_controller":30,"../interaction/focus":31,"./page":53}],53:[function(require,module,exports){
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
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.design = _ref.design, this.componentTree = _ref.componentTree, this.loadResources = _ref.loadResources;
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
    if (!this.design) {
      return;
    }
    return this.design.assets.loadCss(this.cssLoader, this.readySemaphore.wait());
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


},{"../configuration/config":16,"./css_loader":50,"./rendering_container":54}],54:[function(require,module,exports){
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

  RenderingContainer.prototype.componentViewWasInserted = function(componentView) {};

  RenderingContainer.prototype.beforeReady = function() {};

  RenderingContainer.prototype.ready = function(callback) {
    return this.readySemaphore.addCallback(callback);
  };

  return RenderingContainer;

})();


},{"../modules/semaphore":44}],55:[function(require,module,exports){
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


},{"../configuration/config":16,"../interaction/dom":28}],56:[function(require,module,exports){
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


},{"../configuration/config":16,"../modules/logging/assert":37,"./directive":55}],57:[function(require,module,exports){
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


},{"../configuration/config":16,"./directive":55}],58:[function(require,module,exports){
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


},{"../configuration/config":16}],59:[function(require,module,exports){
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


},{"../configuration/config":16}],60:[function(require,module,exports){
var ComponentModel, ComponentView, DirectiveCollection, DirectiveIterator, Template, assert, config, directiveCompiler, directiveFinder, log, sortByName, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

config = require('../configuration/config');

DirectiveIterator = require('./directive_iterator');

DirectiveCollection = require('./directive_collection');

directiveCompiler = require('./directive_compiler');

directiveFinder = require('./directive_finder');

ComponentModel = require('../component_tree/component_model');

ComponentView = require('../rendering/component_view');

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
    var html, label, properties, _ref;
    _ref = _arg != null ? _arg : {}, this.name = _ref.name, html = _ref.html, label = _ref.label, properties = _ref.properties;
    assert(html, 'Template: param html missing');
    this.$template = $(this.pruneHtml(html)).wrap('<div>');
    this.$wrap = this.$template.parent();
    this.label = label || words.humanize(this.name);
    this.styles = properties || {};
    this.defaults = {};
    this.parseTemplate();
  }

  Template.prototype.setDesign = function(design) {
    this.design = design;
    return this.identifier = "" + design.name + "." + this.name;
  };

  Template.prototype.createModel = function() {
    return new ComponentModel({
      template: this
    });
  };

  Template.prototype.createView = function(componentModel, isReadOnly) {
    var $elem, componentView, directives;
    componentModel || (componentModel = this.createModel());
    $elem = this.$template.clone();
    directives = this.linkDirectives($elem[0]);
    return componentView = new ComponentView({
      model: componentModel,
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
    var componentDirectives, iterator;
    iterator = new DirectiveIterator(elem);
    componentDirectives = this.directives.clone();
    while (elem = iterator.nextElement()) {
      directiveFinder.link(elem, componentDirectives);
    }
    return componentDirectives;
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
    var doc, name, style, _ref, _ref1;
    doc = {
      name: this.name,
      design: (_ref = this.design) != null ? _ref.name : void 0,
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
    _ref1 = this.styles;
    for (name in _ref1) {
      style = _ref1[name];
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
      designName: void 0,
      name: parts[0]
    };
  } else if (parts.length === 2) {
    return {
      designName: parts[0],
      name: parts[1]
    };
  } else {
    return log.error("could not parse component template identifier: " + identifier);
  }
};


},{"../component_tree/component_model":9,"../configuration/config":16,"../modules/logging/assert":37,"../modules/logging/log":38,"../modules/words":46,"../rendering/component_view":47,"./directive_collection":56,"./directive_compiler":57,"./directive_finder":58,"./directive_iterator":59}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIvaXNfYXJndW1lbnRzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Jyb3dzZXJfYXBpLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9hcnJheS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9kaXJlY3RpdmVfZmFjdG9yeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvZWRpdGFibGVfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2ltYWdlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9hc3NldHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Nzc19tb2RpZmljYXRvcl9wcm9wZXJ0eS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fY2FjaGUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbl9jb25maWdfc2NoZW1hLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fcGFyc2VyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi92ZXJzaW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2RlZmF1bHRfaW1hZ2Vfc2VydmljZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL3Jlc3JjaXRfaW1hZ2Vfc2VydmljZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9jb21wb25lbnRfZHJhZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kb20uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZHJhZ19iYXNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZm9jdXMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbGl2aW5nZG9jLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZXZlbnRpbmcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9mZWF0dXJlX2RldGVjdHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ndWlkLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2xvZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL29iamVjdF9zY2hlbWEvcHJvcGVydHlfdmFsaWRhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb2JqZWN0X3NjaGVtYS9zY2hlbWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vYmplY3Rfc2NoZW1hL3ZhbGlkYXRpb25fZXJyb3JzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb2JqZWN0X3NjaGVtYS92YWxpZGF0b3JzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvb3JkZXJlZF9oYXNoLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VyaWFsaXphdGlvbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3dvcmRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9jb21wb25lbnRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvcmVuZGVyZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3ZpZXcuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9jc3NfbG9hZGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb21waWxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfZmluZGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS90ZW1wbGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LENBQWlCLEdBQWpCLENBRlIsQ0FBQTtBQUdBLEVBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNFO0FBQUEsTUFBRSxVQUFBLEVBQVksTUFBZDtBQUFBLE1BQXlCLElBQUEsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQUFyQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFVBQUEsRUFBWSxLQUFNLENBQUEsQ0FBQSxDQUFwQjtBQUFBLE1BQXdCLElBQUEsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQUFwQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsaURBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQWhLM0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5hdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnJylcbkxpdmluZ2RvYyA9IHJlcXVpcmUoJy4vbGl2aW5nZG9jJylcbkNvbXBvbmVudFRyZWUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlJylcbmRlc2lnblBhcnNlciA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbl9wYXJzZXInKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuXG4gICMgTG9hZCBhbmQgYWNjZXNzIGRlc2lnbnMuXG4gICNcbiAgIyBMb2FkIGEgZGVzaWduOlxuICAjIGRlc2lnbi5sb2FkKHlvdXJEZXNpZ25Kc29uKVxuICAjXG4gICMgQ2hlY2sgaWYgYSBkZXNpZ24gaXMgYWxyZWFkeSBsb2FkZWQ6XG4gICMgZGVzaWduLmhhcyhuYW1lT2ZZb3VyRGVzaWduKVxuICAjXG4gICMgR2V0IGFuIGFscmVhZHkgbG9hZGVkIGRlc2lnbjpcbiAgIyBkZXNpZ24uZ2V0KG5hbWVPZllvdXJEZXNpZ24pXG4gIGRlc2lnbjogZGVzaWduQ2FjaGVcblxuXG4gICMgTG9hZCBhIGxpdmluZ2RvYyBmcm9tIHNlcmlhbGl6ZWQgZGF0YSBpbiBhIHN5bmNocm9ub3VzIHdheS5cbiAgIyBUaGUgZGVzaWduIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICAjXG4gICMgQHJldHVybnMgeyBMaXZpbmdkb2Mgb2JqZWN0IH1cbiAgbmV3OiAoeyBkYXRhLCBkZXNpZ24gfSkgLT5cbiAgICBjb21wb25lbnRUcmVlID0gaWYgZGF0YT9cbiAgICAgIGRlc2lnbk5hbWUgPSBkYXRhLmRlc2lnbj8ubmFtZVxuICAgICAgYXNzZXJ0IGRlc2lnbk5hbWU/LCAnRXJyb3IgY3JlYXRpbmcgbGl2aW5nZG9jOiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ24uZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgQ29tcG9uZW50VHJlZShjb250ZW50OiBkYXRhLCBkZXNpZ246IGRlc2lnbilcbiAgICBlbHNlXG4gICAgICBkZXNpZ25OYW1lID0gZGVzaWduXG4gICAgICBkZXNpZ24gPSBAZGVzaWduLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IENvbXBvbmVudFRyZWUoZGVzaWduOiBkZXNpZ24pXG5cbiAgICBAY3JlYXRlKGNvbXBvbmVudFRyZWUpXG5cblxuICAjIERpcmVjdCBjcmVhdGlvbiB3aXRoIGFuIGV4aXN0aW5nIENvbXBvbmVudFRyZWVcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBjcmVhdGU6IChjb21wb25lbnRUcmVlKSAtPlxuICAgIG5ldyBMaXZpbmdkb2MoeyBjb21wb25lbnRUcmVlIH0pXG5cblxuICAjIFRvZG86IGFkZCBhc3luYyBhcGkgKGFzeW5jIGJlY2F1c2Ugb2YgdGhlIGxvYWRpbmcgb2YgdGhlIGRlc2lnbilcbiAgIyBNb3ZlIHRoZSBkZXNpZ24gbG9hZGluZyBjb2RlIGZyb20gdGhlIGVkaXRvciBpbnRvIHRoZSBlbmlnbmUuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGRvYy5sb2FkKGpzb25Gcm9tU2VydmVyKVxuICAjICAudGhlbiAobGl2aW5nZG9jKSAtPlxuICAjICAgIGxpdmluZ2RvYy5jcmVhdGVWaWV3KCcuY29udGFpbmVyJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSB9KVxuICAjICAudGhlbiAodmlldykgLT5cbiAgIyAgICAjIHZpZXcgaXMgcmVhZHlcblxuXG4gICMgU3RhcnQgZHJhZyAmIGRyb3BcbiAgc3RhcnREcmFnOiAkLnByb3h5KGVkaXRvclBhZ2UsICdzdGFydERyYWcnKVxuXG5cbiAgIyBDaGFuZ2UgdGhlIGNvbmZpZ3VyYXRpb25cbiAgY29uZmlnOiAodXNlckNvbmZpZykgLT5cbiAgICAkLmV4dGVuZCh0cnVlLCBjb25maWcsIHVzZXJDb25maWcpXG4gICAgYXVnbWVudENvbmZpZyhjb25maWcpXG5cblxuXG4jIEV4cG9ydCBnbG9iYWwgdmFyaWFibGVcbndpbmRvdy5kb2MgPSBkb2NcbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3IgY29tcG9uZW50cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgQ29tcG9uZW50QXJyYXkgdGhhdCB3b3JrcyBzaW1pbGFyIHRvIGEgalF1ZXJ5IG9iamVjdC5cbiMgRm9yIGV4dGVuc2liaWxpdHkgdmlhIHBsdWdpbnMgd2UgZXhwb3NlIHRoZSBwcm90b3R5cGUgb2YgQ29tcG9uZW50QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRBcnJheVxuXG5cbiAgIyBAcGFyYW0gY29tcG9uZW50czogYXJyYXkgb2YgY29tcG9uZW50c1xuICBjb25zdHJ1Y3RvcjogKEBjb21wb25lbnRzKSAtPlxuICAgIEBjb21wb25lbnRzID89IFtdXG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBjb21wb25lbnRzXG4gICAgICBAW2luZGV4XSA9IHJlc3VsdFxuXG4gICAgQGxlbmd0aCA9IEBjb21wb25lbnRzLmxlbmd0aFxuICAgIGlmIEBjb21wb25lbnRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0Bjb21wb25lbnRzLmxlbmd0aCAtIDFdXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGNvbXBvbmVudCBpbiBAY29tcG9uZW50c1xuICAgICAgY2FsbGJhY2soY29tcG9uZW50KVxuXG4gICAgdGhpc1xuXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICBjb21wb25lbnQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIENvbXBvbmVudENvbnRhaW5lclxuIyAtLS0tLS0tLS0tLS0tLS0tXG4jIEEgQ29tcG9uZW50Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2YgY29tcG9uZW50cy5cbiNcbiMgVGhlIGNvbXBvbmVudENvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyBpdHMgY29tcG9uZW50VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBjb21wb25lbnQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IGNvbXBvbmVudCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIHBhcmVudENvbXBvbmVudDogcGFyZW50IENvbXBvbmVudE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudENvbnRhaW5lclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBwYXJlbnRDb21wb25lbnQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoY29tcG9uZW50KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAcGFyZW50Q29tcG9uZW50XG4gICAgICBhc3NlcnQgY29tcG9uZW50IGlzbnQgQHBhcmVudENvbXBvbmVudCwgJ2Nhbm5vdCBhcHBlbmQgY29tcG9uZW50IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5wcmV2aW91cyA9PSBpbnNlcnRlZENvbXBvbmVudFxuICAgIGFzc2VydCBjb21wb25lbnQgaXNudCBpbnNlcnRlZENvbXBvbmVudCwgJ2Nhbm5vdCBpbnNlcnQgY29tcG9uZW50IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogY29tcG9uZW50LnByZXZpb3VzXG4gICAgICBuZXh0OiBjb21wb25lbnRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5uZXh0ID09IGluc2VydGVkQ29tcG9uZW50XG4gICAgYXNzZXJ0IGNvbXBvbmVudCBpc250IGluc2VydGVkQ29tcG9uZW50LCAnY2Fubm90IGluc2VydCBjb21wb25lbnQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IGNvbXBvbmVudFxuICAgICAgbmV4dDogY29tcG9uZW50Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICB1cDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBAaW5zZXJ0QmVmb3JlKGNvbXBvbmVudC5wcmV2aW91cywgY29tcG9uZW50KVxuXG5cbiAgZG93bjogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihjb21wb25lbnQubmV4dCwgY29tcG9uZW50KVxuXG5cbiAgZ2V0Q29tcG9uZW50VHJlZTogLT5cbiAgICBAY29tcG9uZW50VHJlZSB8fCBAcGFyZW50Q29tcG9uZW50Py5jb21wb25lbnRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnQgPSBAZmlyc3RcbiAgICB3aGlsZSAoY29tcG9uZW50KVxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzIGFuZCBjb250YWluZXJzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudClcbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoY29tcG9uZW50KSAtPlxuICAgIGNvbXBvbmVudC5kZXN0cm95KClcbiAgICBAX2RldGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBjb21wb25lbnQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoQ29tcG9uZW50OiAoY29tcG9uZW50LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoY29tcG9uZW50LCBwb3NpdGlvbilcblxuICAgIGlmIGNvbXBvbmVudFRyZWUgPSBAZ2V0Q29tcG9uZW50VHJlZSgpXG4gICAgICBjb21wb25lbnRUcmVlLmF0dGFjaGluZ0NvbXBvbmVudChjb21wb25lbnQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IGNvbXBvbmVudCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBDb21wb25lbnRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIGNvbXBvbmVudFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaENvbXBvbmVudCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBDb21wb25lbnRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgY29tcG9uZW50VHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaENvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoY29tcG9uZW50KVxuXG4gICAgaWYgY29tcG9uZW50VHJlZSA9IEBnZXRDb21wb25lbnRUcmVlKClcbiAgICAgIGNvbXBvbmVudFRyZWUuZGV0YWNoaW5nQ29tcG9uZW50KGNvbXBvbmVudCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChjb21wb25lbnQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoY29tcG9uZW50KSBpZiBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0Q29tcG9uZW50UG9zaXRpb24oY29tcG9uZW50LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKGNvbXBvbmVudCkgLT5cbiAgICBjb250YWluZXIgPSBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50Lm5leHQgdW5sZXNzIGNvbXBvbmVudC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gY29tcG9uZW50LnByZXZpb3VzIHVubGVzcyBjb21wb25lbnQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIGNvbXBvbmVudC5uZXh0Py5wcmV2aW91cyA9IGNvbXBvbmVudC5wcmV2aW91c1xuICAgICAgY29tcG9uZW50LnByZXZpb3VzPy5uZXh0ID0gY29tcG9uZW50Lm5leHRcblxuICAgICAgQHNldENvbXBvbmVudFBvc2l0aW9uKGNvbXBvbmVudCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRDb21wb25lbnRQb3NpdGlvbjogKGNvbXBvbmVudCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgY29tcG9uZW50LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIGNvbXBvbmVudC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgY29tcG9uZW50Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBjb21wb25lbnQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBjb21wb25lbnQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50IHVubGVzcyBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IGNvbXBvbmVudCB1bmxlc3MgY29tcG9uZW50Lm5leHQ/XG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcblxuRWRpdGFibGVEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2VkaXRhYmxlX2RpcmVjdGl2ZScpXG5JbWFnZURpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vaW1hZ2VfZGlyZWN0aXZlJylcbkh0bWxEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2h0bWxfZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gIGNyZWF0ZTogKHsgY29tcG9uZW50LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIERpcmVjdGl2ZSA9IEBnZXREaXJlY3RpdmVDb25zdHJ1Y3Rvcih0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlKVxuICAgIG5ldyBEaXJlY3RpdmUoeyBjb21wb25lbnQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pXG5cblxuICBnZXREaXJlY3RpdmVDb25zdHJ1Y3RvcjogKGRpcmVjdGl2ZVR5cGUpIC0+XG4gICAgc3dpdGNoIGRpcmVjdGl2ZVR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICBFZGl0YWJsZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaW1hZ2UnXG4gICAgICAgIEltYWdlRGlyZWN0aXZlXG4gICAgICB3aGVuICdodG1sJ1xuICAgICAgICBIdG1sRGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIGFzc2VydCBmYWxzZSwgXCJVbnN1cHBvcnRlZCBjb21wb25lbnQgZGlyZWN0aXZlOiAjeyBkaXJlY3RpdmVUeXBlIH1cIlxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkNvbXBvbmVudENvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kaXJlY3RpdmVGYWN0b3J5ID0gcmVxdWlyZSgnLi9jb21wb25lbnRfZGlyZWN0aXZlX2ZhY3RvcnknKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcblxuIyBDb21wb25lbnRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBDb21wb25lbnRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBjb21wb25lbnRWaWV3XG4jIGZyb20gYSBjb21wb25lbnRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIENvbXBvbmVudFRyZWUuXG4jIEV2ZXJ5IENvbXBvbmVudE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChDb21wb25lbnRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgY29tcG9uZW50cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKENvbXBvbmVudENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIENvbXBvbmVudE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgQ29tcG9uZW50Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgY29tcG9uZW50IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAZGF0YVZhbHVlcyA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAY29tcG9uZW50TmFtZSA9IEB0ZW1wbGF0ZS5uYW1lXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBDb21wb25lbnRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgQGNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBDb21wb25lbnRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY3JlYXRlQ29tcG9uZW50RGlyZWN0aXZlKGRpcmVjdGl2ZSlcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gQ29tcG9uZW50TW9kZWxcIlxuXG5cbiAgIyBDcmVhdGUgYSBkaXJlY3RpdmUgZm9yICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJyB0ZW1wbGF0ZSBkaXJlY3RpdmVzXG4gIGNyZWF0ZUNvbXBvbmVudERpcmVjdGl2ZTogKHRlbXBsYXRlRGlyZWN0aXZlKSAtPlxuICAgIEBkaXJlY3RpdmVzLmFkZCBkaXJlY3RpdmVGYWN0b3J5LmNyZWF0ZVxuICAgICAgY29tcG9uZW50OiB0aGlzXG4gICAgICB0ZW1wbGF0ZURpcmVjdGl2ZTogdGVtcGxhdGVEaXJlY3RpdmVcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICAjIENvbXBvbmVudFRyZWUgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgY29tcG9uZW50TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIGNvbXBvbmVudE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBjb21wb25lbnQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBpZiBjb21wb25lbnRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBjb21wb25lbnRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChjb21wb25lbnRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgY29tcG9uZW50TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKGNvbXBvbmVudE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIGNvbXBvbmVudCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBjb21wb25lbnQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIGNvbXBvbmVudCBmcm9tIGl0cyBjb250YWluZXIgYW5kIENvbXBvbmVudFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIENvbXBvbmVudFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIGNvbXBvbmVudFRyZWUgcmVsYXRpdmUgdG8gdGhpcyBjb21wb25lbnQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRDb21wb25lbnRcblxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRNb2RlbClcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjb21wb25lbnRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIGNvbXBvbmVudE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIGNvbXBvbmVudHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChjb21wb25lbnRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKSBpZiBjb21wb25lbnRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IGNvbXBvbmVudE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBjb21wb25lbnRcbiAgc2V0Q29udGVudDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgaWYgQGNvbnRlbnRbbmFtZV1cbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICBpZiBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSAhPSB2YWx1ZVxuICAgICAgICBkaXJlY3RpdmUuc2V0SW1hZ2VVcmwodmFsdWUpXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAY29tcG9uZW50VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgY29tcG9uZW50TW9kZWwuXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBjb21wb25lbnRUcmVlICYmIGNoYW5nZWREYXRhUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICAjIFN0eWxlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0U3R5bGU6IChuYW1lKSAtPlxuICAgIEBzdHlsZXNbbmFtZV1cblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gQ29tcG9uZW50TW9kZWwgI3sgQGNvbXBvbmVudE5hbWUgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIENvbXBvbmVudE1vZGVsICN7IEBjb21wb25lbnROYW1lIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBjb21wb25lbnRUcmVlXG4gICAgICAgICAgQGNvbXBvbmVudFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gICMgQGRlcHJlY2F0ZWRcbiAgIyBHZXR0ZXIgYW5kIFNldHRlciBpbiBvbmUuXG4gIHN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgY29uc29sZS5sb2coXCJDb21wb25lbnRNb2RlbCNzdHlsZSgpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgI2dldFN0eWxlKCkgYW5kICNzZXRTdHlsZSgpLlwiKVxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gICMgQ29tcG9uZW50TW9kZWwgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIkNvbXBvbmVudE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBDb21wb25lbnRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiIsImRlZXBFcXVhbCA9IHJlcXVpcmUoJ2RlZXAtZXF1YWwnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuQ29tcG9uZW50TW9kZWwgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9tb2RlbCcpXG5zZXJpYWxpemF0aW9uID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZXJpYWxpemF0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgUHVibGljIE1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLVxuXG4gICMgU2VyaWFsaXplIGEgQ29tcG9uZW50TW9kZWxcbiAgI1xuICAjIEV4dGVuZHMgdGhlIHByb3RvdHlwZSBvZiBDb21wb25lbnRNb2RlbFxuICAjXG4gICMgRXhhbXBsZSBSZXN1bHQ6XG4gICMgaWQ6ICdha2s3aGp1dWUyJ1xuICAjIGlkZW50aWZpZXI6ICd0aW1lbGluZS50aXRsZSdcbiAgIyBjb250ZW50OiB7IC4uLiB9XG4gICMgc3R5bGVzOiB7IC4uLiB9XG4gICMgZGF0YTogeyAuLi4gfVxuICAjIGNvbnRhaW5lcnM6IHsgLi4uIH1cbiAgQ29tcG9uZW50TW9kZWw6OnRvSnNvbiA9IChjb21wb25lbnQpIC0+XG4gICAgY29tcG9uZW50ID89IHRoaXNcblxuICAgIGpzb24gPVxuICAgICAgaWQ6IGNvbXBvbmVudC5pZFxuICAgICAgaWRlbnRpZmllcjogY29tcG9uZW50LnRlbXBsYXRlLmlkZW50aWZpZXJcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoY29tcG9uZW50LmNvbnRlbnQpXG4gICAgICBqc29uLmNvbnRlbnQgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KGNvbXBvbmVudC5jb250ZW50KVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShjb21wb25lbnQuc3R5bGVzKVxuICAgICAganNvbi5zdHlsZXMgPSBzZXJpYWxpemF0aW9uLmZsYXRDb3B5KGNvbXBvbmVudC5zdHlsZXMpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KGNvbXBvbmVudC5kYXRhVmFsdWVzKVxuICAgICAganNvbi5kYXRhID0gJC5leHRlbmQodHJ1ZSwge30sIGNvbXBvbmVudC5kYXRhVmFsdWVzKVxuXG4gICAgIyBjcmVhdGUgYW4gYXJyYXkgZm9yIGV2ZXJ5IGNvbnRhaW5lclxuICAgIGZvciBuYW1lIG9mIGNvbXBvbmVudC5jb250YWluZXJzXG4gICAgICBqc29uLmNvbnRhaW5lcnMgfHw9IHt9XG4gICAgICBqc29uLmNvbnRhaW5lcnNbbmFtZV0gPSBbXVxuXG4gICAganNvblxuXG5cbiAgZnJvbUpzb246IChqc29uLCBkZXNpZ24pIC0+XG4gICAgdGVtcGxhdGUgPSBkZXNpZ24uZ2V0KGpzb24uY29tcG9uZW50IHx8IGpzb24uaWRlbnRpZmllcilcblxuICAgIGFzc2VydCB0ZW1wbGF0ZSxcbiAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IHVua25vd24gdGVtcGxhdGUgaWRlbnRpZmllciAnI3sganNvbi5pZGVudGlmaWVyIH0nXCJcblxuICAgIG1vZGVsID0gbmV3IENvbXBvbmVudE1vZGVsKHsgdGVtcGxhdGUsIGlkOiBqc29uLmlkIH0pXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YganNvbi5jb250ZW50XG4gICAgICBhc3NlcnQgbW9kZWwuY29udGVudC5oYXNPd25Qcm9wZXJ0eShuYW1lKSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcblxuICAgICAgIyBUcmFuc2Zvcm0gc3RyaW5nIGludG8gb2JqZWN0OiBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igb2xkIGltYWdlIHZhbHVlcy5cbiAgICAgIGlmIG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLnR5cGUgPT0gJ2ltYWdlJyAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9XG4gICAgICAgICAgdXJsOiB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICAgIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgICBtb2RlbC5zZXRTdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gICAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gICAgZm9yIGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudEFycmF5IG9mIGpzb24uY29udGFpbmVyc1xuICAgICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICAgIGlmIGNvbXBvbmVudEFycmF5XG4gICAgICAgIGFzc2VydCAkLmlzQXJyYXkoY29tcG9uZW50QXJyYXkpLFxuICAgICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgICAgZm9yIGNoaWxkIGluIGNvbXBvbmVudEFycmF5XG4gICAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBAZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gICAgbW9kZWxcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5Db21wb25lbnRDb250YWluZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9jb250YWluZXInKVxuQ29tcG9uZW50QXJyYXkgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9hcnJheScpXG5Db21wb25lbnRNb2RlbCA9IHJlcXVpcmUoJy4vY29tcG9uZW50X21vZGVsJylcbmNvbXBvbmVudE1vZGVsU2VyaWFsaXplciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X21vZGVsX3NlcmlhbGl6ZXInKVxuXG4jIENvbXBvbmVudFRyZWVcbiMgLS0tLS0tLS0tLS1cbiMgTGl2aW5nZG9jcyBlcXVpdmFsZW50IHRvIHRoZSBET00gdHJlZS5cbiMgQSBjb21wb25lbnRUcmVlIGNvbnRhaW5lcyBhbGwgdGhlIGNvbXBvbmVudHMgb2YgYSBwYWdlIGluIGhpZXJhcmNoaWNhbCBvcmRlci5cbiNcbiMgVGhlIHJvb3Qgb2YgdGhlIENvbXBvbmVudFRyZWUgaXMgYSBDb21wb25lbnRDb250YWluZXIuIEEgQ29tcG9uZW50Q29udGFpbmVyXG4jIGNvbnRhaW5zIGEgbGlzdCBvZiBjb21wb25lbnRzLlxuI1xuIyBjb21wb25lbnRzIGNhbiBoYXZlIG11bHRpYmxlIENvbXBvbmVudENvbnRhaW5lcnMgdGhlbXNlbHZlcy5cbiNcbiMgIyMjIEV4YW1wbGU6XG4jICAgICAtIENvbXBvbmVudENvbnRhaW5lciAocm9vdClcbiMgICAgICAgLSBDb21wb25lbnQgJ0hlcm8nXG4jICAgICAgIC0gQ29tcG9uZW50ICcyIENvbHVtbnMnXG4jICAgICAgICAgLSBDb21wb25lbnRDb250YWluZXIgJ21haW4nXG4jICAgICAgICAgICAtIENvbXBvbmVudCAnVGl0bGUnXG4jICAgICAgICAgLSBDb21wb25lbnRDb250YWluZXIgJ3NpZGViYXInXG4jICAgICAgICAgICAtIENvbXBvbmVudCAnSW5mby1Cb3gnJ1xuI1xuIyAjIyMgRXZlbnRzOlxuIyBUaGUgZmlyc3Qgc2V0IG9mIENvbXBvbmVudFRyZWUgRXZlbnRzIGFyZSBjb25jZXJuZWQgd2l0aCBsYXlvdXQgY2hhbmdlcyBsaWtlXG4jIGFkZGluZywgcmVtb3Zpbmcgb3IgbW92aW5nIGNvbXBvbmVudHMuXG4jXG4jIENvbnNpZGVyOiBIYXZlIGEgZG9jdW1lbnRGcmFnbWVudCBhcyB0aGUgcm9vdE5vZGUgaWYgbm8gcm9vdE5vZGUgaXMgZ2l2ZW5cbiMgbWF5YmUgdGhpcyB3b3VsZCBoZWxwIHNpbXBsaWZ5IHNvbWUgY29kZSAoc2luY2UgY29tcG9uZW50cyBhcmUgYWx3YXlzXG4jIGF0dGFjaGVkIHRvIHRoZSBET00pLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRUcmVlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgY29udGVudCwgQGRlc2lnbiB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IEBkZXNpZ24/LCBcIkVycm9yIGluc3RhbnRpYXRpbmcgQ29tcG9uZW50VHJlZTogZGVzaWduIHBhcmFtIGlzIG1pc3NzaW5nLlwiXG4gICAgQHJvb3QgPSBuZXcgQ29tcG9uZW50Q29udGFpbmVyKGlzUm9vdDogdHJ1ZSlcblxuICAgICMgaW5pdGlhbGl6ZSBjb250ZW50IGJlZm9yZSB3ZSBzZXQgdGhlIGNvbXBvbmVudFRyZWUgdG8gdGhlIHJvb3RcbiAgICAjIG90aGVyd2lzZSBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZCB3aGlsZSBidWlsZGluZyB0aGUgdHJlZVxuICAgIEBmcm9tSnNvbihjb250ZW50LCBAZGVzaWduKSBpZiBjb250ZW50P1xuXG4gICAgQHJvb3QuY29tcG9uZW50VHJlZSA9IHRoaXNcbiAgICBAaW5pdGlhbGl6ZUV2ZW50cygpXG5cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBhdCB0aGUgYmVnaW5uaW5nLlxuICAjIEBwYXJhbTogY29tcG9uZW50TW9kZWwgaW5zdGFuY2Ugb3IgY29tcG9uZW50IG5hbWUgZS5nLiAndGl0bGUnXG4gIHByZXBlbmQ6IChjb21wb25lbnQpIC0+XG4gICAgY29tcG9uZW50ID0gQGdldENvbXBvbmVudChjb21wb25lbnQpXG4gICAgQHJvb3QucHJlcGVuZChjb21wb25lbnQpIGlmIGNvbXBvbmVudD9cbiAgICB0aGlzXG5cblxuICAjIEluc2VydCBjb21wb25lbnQgYXQgdGhlIGVuZC5cbiAgIyBAcGFyYW06IGNvbXBvbmVudE1vZGVsIGluc3RhbmNlIG9yIGNvbXBvbmVudCBuYW1lIGUuZy4gJ3RpdGxlJ1xuICBhcHBlbmQ6IChjb21wb25lbnQpIC0+XG4gICAgY29tcG9uZW50ID0gQGdldENvbXBvbmVudChjb21wb25lbnQpXG4gICAgQHJvb3QuYXBwZW5kKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuICAgIHRoaXNcblxuXG4gIGdldENvbXBvbmVudDogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgaWYgdHlwZW9mIGNvbXBvbmVudE5hbWUgPT0gJ3N0cmluZydcbiAgICAgIEBjcmVhdGVDb21wb25lbnQoY29tcG9uZW50TmFtZSlcbiAgICBlbHNlXG4gICAgICBjb21wb25lbnROYW1lXG5cblxuICBjcmVhdGVDb21wb25lbnQ6IChjb21wb25lbnROYW1lKSAtPlxuICAgIHRlbXBsYXRlID0gQGdldFRlbXBsYXRlKGNvbXBvbmVudE5hbWUpXG4gICAgdGVtcGxhdGUuY3JlYXRlTW9kZWwoKSBpZiB0ZW1wbGF0ZVxuXG5cbiAgZ2V0VGVtcGxhdGU6IChjb21wb25lbnROYW1lKSAtPlxuICAgIHRlbXBsYXRlID0gQGRlc2lnbi5nZXQoY29tcG9uZW50TmFtZSlcbiAgICBhc3NlcnQgdGVtcGxhdGUsIFwiQ291bGQgbm90IGZpbmQgdGVtcGxhdGUgI3sgY29tcG9uZW50TmFtZSB9XCJcbiAgICB0ZW1wbGF0ZVxuXG5cbiAgaW5pdGlhbGl6ZUV2ZW50czogKCkgLT5cblxuICAgICMgbGF5b3V0IGNoYW5nZXNcbiAgICBAY29tcG9uZW50QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudFJlbW92ZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudE1vdmVkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgIyBjb250ZW50IGNoYW5nZXNcbiAgICBAY29tcG9uZW50Q29udGVudENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudEh0bWxDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuICAgIEBjb21wb25lbnRTZXR0aW5nc0NoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudERhdGFDaGFuZ2VkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cblxuICAjIFRyYXZlcnNlIHRoZSB3aG9sZSBjb21wb25lbnRUcmVlLlxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQHJvb3QuZWFjaChjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoQ29udGFpbmVyKGNhbGxiYWNrKVxuXG5cbiAgIyBHZXQgdGhlIGZpcnN0IGNvbXBvbmVudFxuICBmaXJzdDogLT5cbiAgICBAcm9vdC5maXJzdFxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29udGFpbmVycyBhbmQgY29tcG9uZW50c1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5hbGwoY2FsbGJhY2spXG5cblxuICBmaW5kOiAoc2VhcmNoKSAtPlxuICAgIGlmIHR5cGVvZiBzZWFyY2ggPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IFtdXG4gICAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgICBpZiBjb21wb25lbnQuY29tcG9uZW50TmFtZSA9PSBzZWFyY2hcbiAgICAgICAgICByZXMucHVzaChjb21wb25lbnQpXG5cbiAgICAgIG5ldyBDb21wb25lbnRBcnJheShyZXMpXG4gICAgZWxzZVxuICAgICAgbmV3IENvbXBvbmVudEFycmF5KClcblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBlYWNoV2l0aFBhcmVudHM6IChjb21wb25lbnQsIHBhcmVudHMpIC0+XG4gICMgICBwYXJlbnRzIHx8PSBbXVxuXG4gICMgICAjIHRyYXZlcnNlXG4gICMgICBwYXJlbnRzID0gcGFyZW50cy5wdXNoKGNvbXBvbmVudClcbiAgIyAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgIyAgICAgY29tcG9uZW50ID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgIyAgICAgd2hpbGUgKGNvbXBvbmVudClcbiAgIyAgICAgICBAZWFjaFdpdGhQYXJlbnRzKGNvbXBvbmVudCwgcGFyZW50cylcbiAgIyAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnQubmV4dFxuXG4gICMgICBwYXJlbnRzLnNwbGljZSgtMSlcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnQ29tcG9uZW50VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBjb21wb25lbnQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLmxhYmVsIH0gKCN7IHRlbXBsYXRlLm5hbWUgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoY29tcG9uZW50Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoY29tcG9uZW50Lm5leHQsIGluZGVudGF0aW9uKSBpZiBjb21wb25lbnQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBjb21wb25lbnRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBjb21wb25lbnRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nQ29tcG9uZW50OiAoY29tcG9uZW50LCBhdHRhY2hDb21wb25lbnRGdW5jKSAtPlxuICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBjb21wb25lbnRcbiAgICAgIGF0dGFjaENvbXBvbmVudEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnY29tcG9uZW50TW92ZWQnLCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgaWYgY29tcG9uZW50LmNvbXBvbmVudFRyZWU/XG4gICAgICAgIGNvbXBvbmVudC5yZW1vdmUoKSAjIHJlbW92ZSBmcm9tIG90aGVyIGNvbXBvbmVudFRyZWVcblxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5jb21wb25lbnRUcmVlID0gdGhpc1xuXG4gICAgICBhdHRhY2hDb21wb25lbnRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEFkZGVkJywgY29tcG9uZW50KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ0NvbXBvbmVudDogKGNvbXBvbmVudCwgZGV0YWNoQ29tcG9uZW50RnVuYykgLT5cbiAgICBhc3NlcnQgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIGNvbXBvbmVudCBmcm9tIGFub3RoZXIgQ29tcG9uZW50VHJlZSdcblxuICAgIGNvbXBvbmVudC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnRzKSAtPlxuICAgICAgZGVzY2VuZGFudHMuY29tcG9uZW50VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgZGV0YWNoQ29tcG9uZW50RnVuYygpXG4gICAgQGZpcmVFdmVudCgnY29tcG9uZW50UmVtb3ZlZCcsIGNvbXBvbmVudClcblxuXG4gIGNvbnRlbnRDaGFuZ2luZzogKGNvbXBvbmVudCkgLT5cbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRDb250ZW50Q2hhbmdlZCcsIGNvbXBvbmVudClcblxuXG4gIGh0bWxDaGFuZ2luZzogKGNvbXBvbmVudCkgLT5cbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRIdG1sQ2hhbmdlZCcsIGNvbXBvbmVudClcblxuXG4gIGRhdGFDaGFuZ2luZzogKGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpIC0+XG4gICAgQGZpcmVFdmVudCgnY29tcG9uZW50RGF0YUNoYW5nZWQnLCBjb21wb25lbnQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lIH1cblxuICAgIGNvbXBvbmVudFRvRGF0YSA9IChjb21wb25lbnQsIGxldmVsLCBjb250YWluZXJBcnJheSkgLT5cbiAgICAgIGNvbXBvbmVudERhdGEgPSBjb21wb25lbnQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggY29tcG9uZW50RGF0YVxuICAgICAgY29tcG9uZW50RGF0YVxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBjb21wb25lbnREYXRhID0gY29tcG9uZW50VG9EYXRhKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBjb21wb25lbnREYXRhLmNvbnRhaW5lcnNbY29tcG9uZW50Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKGNvbXBvbmVudENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihjb21wb25lbnQubmV4dCwgbGV2ZWwsIGRhdGFPYmopIGlmIGNvbXBvbmVudC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIGNvbXBvbmVudFRyZWVcbiAgIyBUaGlzIG1ldGhvZCBzdXBwcmVzc2VzIGNoYW5nZSBldmVudHMgaW4gdGhlIGNvbXBvbmVudFRyZWUuXG4gICNcbiAgIyBDb25zaWRlciB0byBjaGFuZ2UgcGFyYW1zOlxuICAjIGZyb21EYXRhKHsgY29udGVudCwgZGVzaWduLCBzaWxlbnQgfSkgIyBzaWxlbnQgW2Jvb2xlYW5dOiBzdXBwcmVzcyBjaGFuZ2UgZXZlbnRzXG4gIGZyb21EYXRhOiAoZGF0YSwgZGVzaWduLCBzaWxlbnQ9dHJ1ZSkgLT5cbiAgICBpZiBkZXNpZ24/XG4gICAgICBhc3NlcnQgbm90IEBkZXNpZ24/IHx8IGRlc2lnbi5lcXVhbHMoQGRlc2lnbiksICdFcnJvciBsb2FkaW5nIGRhdGEuIFNwZWNpZmllZCBkZXNpZ24gaXMgZGlmZmVyZW50IGZyb20gY3VycmVudCBjb21wb25lbnRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIGNvbXBvbmVudERhdGEgaW4gZGF0YS5jb250ZW50XG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb21wb25lbnREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB0aGlzXG4gICAgICBAcm9vdC5lYWNoIChjb21wb25lbnQpID0+XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdGhpc1xuXG5cbiAgIyBBcHBlbmQgZGF0YSB0byB0aGlzIGNvbXBvbmVudFRyZWVcbiAgIyBGaXJlcyBjb21wb25lbnRBZGRlZCBldmVudCBmb3IgZXZlcnkgY29tcG9uZW50XG4gIGFkZERhdGE6IChkYXRhLCBkZXNpZ24pIC0+XG4gICAgQGZyb21EYXRhKGRhdGEsIGRlc2lnbiwgZmFsc2UpXG5cblxuICBhZGREYXRhV2l0aEFuaW1hdGlvbjogKGRhdGEsIGRlbGF5PTIwMCkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sICdFcnJvciBhZGRpbmcgZGF0YS4gQ29tcG9uZW50VHJlZSBoYXMgbm8gZGVzaWduJ1xuXG4gICAgdGltZW91dCA9IE51bWJlcihkZWxheSlcbiAgICBmb3IgY29tcG9uZW50RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgIGRvID0+XG4gICAgICAgIGNvbnRlbnQgPSBjb21wb25lbnREYXRhXG4gICAgICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRNb2RlbFNlcmlhbGl6ZXIuZnJvbUpzb24oY29udGVudCwgQGRlc2lnbilcbiAgICAgICAgICBAcm9vdC5hcHBlbmQoY29tcG9uZW50KVxuICAgICAgICAsIHRpbWVvdXRcblxuICAgICAgdGltZW91dCArPSBOdW1iZXIoZGVsYXkpXG5cblxuICB0b0RhdGE6IC0+XG4gICAgQHNlcmlhbGl6ZSgpXG5cblxuICAjIEFsaWFzZXNcbiAgIyAtLS0tLS0tXG5cbiAgZnJvbUpzb246IChhcmdzLi4uKSAtPlxuICAgIEBmcm9tRGF0YS5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgdG9Kc29uOiAoYXJncy4uLikgLT5cbiAgICBAdG9EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgQGNvbXBvbmVudCwgQHRlbXBsYXRlRGlyZWN0aXZlIH0pIC0+XG4gICAgQG5hbWUgPSBAdGVtcGxhdGVEaXJlY3RpdmUubmFtZVxuICAgIEB0eXBlID0gQHRlbXBsYXRlRGlyZWN0aXZlLnR5cGVcblxuXG4gIGlzRWRpdGFibGU6IHRydWVcblxuXG4gIGdldENvbnRlbnQ6IC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSHRtbERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNIdG1sOiB0cnVlXG5cblxuICBnZXRDb250ZW50OiAtPlxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZURpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNJbWFnZTogdHJ1ZVxuXG5cbiAgc2V0Q29udGVudDogKHZhbHVlKSAtPlxuICAgIEBzZXRJbWFnZVVybCh2YWx1ZSlcblxuXG4gIGdldENvbnRlbnQ6IC0+XG4gICAgQGdldEltYWdlVXJsKClcblxuXG4gICMgSW1hZ2UgRGlyZWN0aXZlIE1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGlzQmFja2dyb3VuZEltYWdlOiAoZGlyZWN0aXZlKSAtPlxuICAgIEB0ZW1wbGF0ZURpcmVjdGl2ZS5nZXRUYWdOYW1lKCkgIT0gJ2ltZydcblxuXG4gIGlzSW5saW5lSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSA9PSAnaW1nJ1xuXG5cbiAgc2V0QmFzZTY0SW1hZ2U6IChiYXNlNjRTdHJpbmcpIC0+XG4gICAgQGJhc2U2NEltYWdlID0gYmFzZTY0U3RyaW5nXG4gICAgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyhAY29tcG9uZW50LCBAbmFtZSkgaWYgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlXG5cblxuICBzZXRJbWFnZVVybDogKHZhbHVlKSAtPlxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0gPz0ge31cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdLnVybCA9IHZhbHVlXG5cbiAgICBAcmVzZXRDcm9wKClcbiAgICBAYmFzZTY0SW1hZ2UgPSB1bmRlZmluZWRcbiAgICBAcHJvY2Vzc0ltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0SW1hZ2VVcmw6IC0+XG4gICAgaW1hZ2UgPSBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG4gICAgaWYgaW1hZ2VcbiAgICAgIGltYWdlLnVybFxuICAgIGVsc2VcbiAgICAgIHVuZGVmaW5lZFxuXG5cbiAgZ2V0SW1hZ2VPYmplY3Q6IC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG5cbiAgZ2V0T3JpZ2luYWxVcmw6IC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXS5vcmlnaW5hbFVybCB8fCBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgc2V0Q3JvcDogKHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgbmFtZSB9KSAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cblxuICAgIGlmIGN1cnJlbnRWYWx1ZT8udXJsP1xuICAgICAgY3VycmVudFZhbHVlLmNyb3AgPVxuICAgICAgICB4OiB4XG4gICAgICAgIHk6IHlcbiAgICAgICAgd2lkdGg6IHdpZHRoXG4gICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIG5hbWU6IG5hbWVcblxuICAgICAgQHByb2Nlc3NJbWFnZVVybChjdXJyZW50VmFsdWUub3JpZ2luYWxVcmwgfHwgY3VycmVudFZhbHVlLnVybClcbiAgICAgIEBjb21wb25lbnQuY29tcG9uZW50VHJlZS5jb250ZW50Q2hhbmdpbmcoQGNvbXBvbmVudCwgQG5hbWUpIGlmIEBjb21wb25lbnQuY29tcG9uZW50VHJlZVxuXG5cbiAgcmVzZXRDcm9wOiAtPlxuICAgIGN1cnJlbnRWYWx1ZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBpZiBjdXJyZW50VmFsdWU/XG4gICAgICBjdXJyZW50VmFsdWUuY3JvcCA9IG51bGxcblxuXG4gIHNldEltYWdlU2VydmljZTogKGltYWdlU2VydmljZU5hbWUpIC0+XG4gICAgYXNzZXJ0IGltYWdlU2VydmljZS5oYXMoaW1hZ2VTZXJ2aWNlTmFtZSksIFwiRXJyb3I6IGNvdWxkIG5vdCBsb2FkIGltYWdlIHNlcnZpY2UgI3sgaW1hZ2VTZXJ2aWNlTmFtZSB9XCJcblxuICAgIGltYWdlVXJsID0gQGdldEltYWdlVXJsKClcbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdID1cbiAgICAgIHVybDogaW1hZ2VVcmxcbiAgICAgIGltYWdlU2VydmljZTogaW1hZ2VTZXJ2aWNlTmFtZSB8fCBudWxsXG5cblxuICBnZXRJbWFnZVNlcnZpY2VOYW1lOiAtPlxuICAgIEBnZXRJbWFnZVNlcnZpY2UoKS5uYW1lXG5cblxuICBoYXNEZWZhdWx0SW1hZ2VTZXJ2aWNlOiAtPlxuICAgIEBnZXRJbWFnZVNlcnZpY2VOYW1lKCkgPT0gJ2RlZmF1bHQnXG5cblxuICBnZXRJbWFnZVNlcnZpY2U6IC0+XG4gICAgc2VydmljZU5hbWUgPSBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdPy5pbWFnZVNlcnZpY2VcbiAgICBpbWFnZVNlcnZpY2UuZ2V0KHNlcnZpY2VOYW1lIHx8IHVuZGVmaW5lZClcblxuXG4gIHByb2Nlc3NJbWFnZVVybDogKHVybCkgLT5cbiAgICBpZiBub3QgQGhhc0RlZmF1bHRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nU2VydmljZSA9IEBnZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1nT2JqID0gQGdldEltYWdlT2JqZWN0KClcbiAgICAgIGltZ09iai51cmwgPSBpbWdTZXJ2aWNlLmdldFVybCh1cmwsIGNyb3A6IGltZ09iai5jcm9wKVxuICAgICAgaW1nT2JqLm9yaWdpbmFsVXJsID0gdXJsXG5cbiIsIiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuI1xuIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb24gd2l0aCBzaG9ydGhhbmRzIGFuZCBjb21wdXRlZCB2YWx1ZXMuXG4jXG4jIGNvbmZpZy5kb2NEaXJlY3RpdmVcbiMgICBXaWxsIHByZWZpeCB0aGUgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCBjb25maWcuYXR0cmlidXRlUHJlZml4XG4jICAgZS5nLiBjb25maWcuZG9jRGlyZWN0aXZlLmVkaXRhYmxlID09ICdkYXRhLWRvYy1lZGl0YWJsZSdcbiNcbiMgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFxuIyAgIEEgbG9va3VwIG9iamVjdCBmb3IgZWFzaWVyIGxvb2t1cHMgb2YgdGhlIGRpcmVjdGl2ZSBuYW1lIGJ5IHRlbXBsYXRlIGF0dHJpYnV0ZS5cbiMgICBlLmcuIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbJ2RvYy1lZGl0YWJsZSddID09ICdlZGl0YWJsZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoY29uZmlnKSAtPlxuXG4gICMgU2hvcnRoYW5kcyBmb3Igc3R1ZmYgdGhhdCBpcyB1c2VkIGFsbCBvdmVyIHRoZSBwbGFjZSB0byBtYWtlXG4gICMgY29kZSBhbmQgc3BlY3MgbW9yZSByZWFkYWJsZS5cbiAgY29uZmlnLmRvY0RpcmVjdGl2ZSA9IHt9XG4gIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXAgPSB7fVxuXG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBjb25maWcuZGlyZWN0aXZlc1xuXG4gICAgIyBDcmVhdGUgdGhlIHJlbmRlcmVkQXR0cnMgZm9yIHRoZSBkaXJlY3RpdmVzXG4gICAgIyAocHJlcGVuZCBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIHRoZSBjb25maWd1cmVkIHByZWZpeClcbiAgICBwcmVmaXggPSBpZiBjb25maWcuYXR0cmlidXRlUHJlZml4IHRoZW4gXCIjeyBjb25maWcuYXR0cmlidXRlUHJlZml4IH0tXCIgZWxzZSAnJ1xuICAgIHZhbHVlLnJlbmRlcmVkQXR0ciA9IFwiI3sgcHJlZml4IH0jeyB2YWx1ZS5hdHRyIH1cIlxuXG4gICAgY29uZmlnLmRvY0RpcmVjdGl2ZVtuYW1lXSA9IHZhbHVlLnJlbmRlcmVkQXR0clxuICAgIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbdmFsdWUuYXR0cl0gPSBuYW1lXG5cbiIsImF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2F1Z21lbnRfY29uZmlnJylcblxuIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnID0gZG8gLT5cblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIENTUyBzZWxlY3RvciBmb3IgZWxlbWVudHMgKGFuZCB0aGVpciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxuICAjIHdoZW4gZm9jdXNzaW5nIG9yIGJsdXJyaW5nIGEgY29tcG9uZW50XG4gIGlnbm9yZUludGVyYWN0aW9uOiAnLmxkLWNvbnRyb2wnXG5cbiAgIyBTZXR1cCBwYXRocyB0byBsb2FkIHJlc291cmNlcyBkeW5hbWljYWxseVxuICBkZXNpZ25QYXRoOiAnL2Rlc2lnbnMnXG4gIGxpdmluZ2RvY3NDc3NGaWxlOiAnL2Fzc2V0cy9jc3MvbGl2aW5nZG9jcy5jc3MnXG5cbiAgd29yZFNlcGFyYXRvcnM6IFwiLi9cXFxcKClcXFwiJzosLjs8Pn4hIyVeJip8Kz1bXXt9YH4/XCJcblxuICAjIHN0cmluZyBjb250YWlubmcgb25seSBhIDxicj4gZm9sbG93ZWQgYnkgd2hpdGVzcGFjZXNcbiAgc2luZ2xlTGluZUJyZWFrOiAvXjxiclxccypcXC8/PlxccyokL1xuXG4gIGF0dHJpYnV0ZVByZWZpeDogJ2RhdGEnXG5cbiAgIyBFZGl0YWJsZSBjb25maWd1cmF0aW9uXG4gIGVkaXRhYmxlOlxuICAgIGFsbG93TmV3bGluZTogdHJ1ZSAjIEFsbG93IHRvIGluc2VydCBuZXdsaW5lcyB3aXRoIFNoaWZ0K0VudGVyXG4gICAgY2hhbmdlRGVsYXk6IDAgIyBEZWxheSBmb3IgdXBkYXRpbmcgdGhlIGNvbXBvbmVudCBtb2RlbHMgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHVzZXIgY2hhbmdlcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgYnJvd3NlclNwZWxsY2hlY2s6IGZhbHNlICMgU2V0IHRoZSBzcGVsbGNoZWNrIGF0dHJpYnV0ZSBvbiBjb250ZW50ZWRpdGFibGVzIHRvICd0cnVlJyBvciAnZmFsc2UnXG4gICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogZmFsc2UgIyBXaGV0aGVyIHRvIGZpcmUgY3Vyc29yIGFuZCBzZWxjdGlvbiBjaGFuZ2VzIG9uIG1vdXNlbW92ZVxuXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBjb21wb25lbnQgY2xhc3Nlc1xuICAgIGNvbXBvbmVudDogJ2RvYy1jb21wb25lbnQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBjb21wb25lbnRIaWdobGlnaHQ6ICdkb2MtY29tcG9uZW50LWhpZ2hsaWdodCdcbiAgICBjb250YWluZXJIaWdobGlnaHQ6ICdkb2MtY29udGFpbmVyLWhpZ2hsaWdodCdcblxuICAgICMgZHJhZyAmIGRyb3BcbiAgICBkcmFnZ2VkOiAnZG9jLWRyYWdnZWQnXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyOiAnZG9jLWRyYWdnZWQtcGxhY2Vob2xkZXInXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlcjogJ2RvYy1kcmFnLWNvdW50ZXInXG4gICAgZHJhZ0Jsb2NrZXI6ICdkb2MtZHJhZy1ibG9ja2VyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuYXVnbWVudENvbmZpZyhjb25maWcpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXNzZXRzXG5cbiAgY29uc3RydWN0b3I6ICh7IEBkZXNpZ24gfSkgLT5cblxuXG4gIGxvYWRDc3M6IChjc3NMb2FkZXIsIGNiKSAtPlxuICAgIHJldHVybiBjYigpIHVubGVzcyBAY3NzP1xuICAgIGNzc1VybHMgPSBAY29udmVydFRvQWJzb2x1dGVQYXRocyhAY3NzKVxuICAgIGNzc0xvYWRlci5sb2FkKGNzc1VybHMsIGNiKVxuXG5cbiAgZ2V0QXNzZXRQYXRoOiAtPlxuICAgIFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWUgfVwiXG5cblxuICBjb252ZXJ0VG9BYnNvbHV0ZVBhdGhzOiAodXJscykgLT5cbiAgICAkLm1hcCB1cmxzLCAocGF0aCkgPT5cbiAgICAgICMgVVJMcyBhcmUgYWJzb2x1dGUgd2hlbiB0aGV5IGNvbnRhaW4gdHdvIGAvL2Agb3IgYmVnaW4gd2l0aCBhIGAvYFxuICAgICAgcmV0dXJuIHBhdGggaWYgL1xcL1xcLy8udGVzdChwYXRoKSB8fCAvXlxcLy8udGVzdChwYXRoKVxuXG4gICAgICAjIE5vcm1hbGl6ZSBwYXRocyB0aGF0IGJlZ2luIHdpdGggYSBgLi9cbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15bXFwuXFwvXSovLCAnJylcbiAgICAgIFwiI3sgQGdldEFzc2V0UGF0aCgpIH0vI3sgcGF0aCB9XCJcblxuXG4gICMgQHBhcmFtIHsgU3RyaW5nIG9yIEFycmF5IG9mIFN0cmluZ3MgfVxuICBhZGRDc3M6IChjc3NVcmxzKSAtPlxuICAgIEBhZGQoJ2NzcycsIGNzc1VybHMpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSBvZiBTdHJpbmdzIH1cbiAgYWRkSnM6IChqc1VybHMpIC0+XG4gICAgQGFkZCgnanMnLCBqc1VybHMpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyB9IGFzc2V0IHR5cGU6ICdqcycgb3IgJ2NzcydcbiAgIyBAcGFyYW0geyBTdHJpbmcgb3IgQXJyYXkgb2YgU3RyaW5ncyB9XG4gIGFkZDogKHR5cGUsIHVybHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyB1cmxzP1xuXG4gICAgdGhpc1t0eXBlXSA/PSBbXVxuICAgIGlmICQudHlwZSh1cmxzKSA9PSAnc3RyaW5nJ1xuICAgICAgdGhpc1t0eXBlXS5wdXNoKHVybHMpXG4gICAgZWxzZVxuICAgICAgZm9yIHVybCBpbiB1cmxzXG4gICAgICAgIHRoaXNbdHlwZV0ucHVzaCh1cmwpXG5cblxuICBoYXNDc3M6IC0+XG4gICAgQGNzcz9cblxuXG4gIGhhc0pzOiAtPlxuICAgIEBqcz9cblxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NNb2RpZmljYXRvclByb3BlcnR5XG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBsYWJlbCwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcblxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgY29tcG9uZW50IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IENzc01vZGlmaWNhdG9yUHJvcGVydHkjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5PcmRlcmVkSGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvb3JkZXJlZF9oYXNoJylcbkFzc2V0cyA9IHJlcXVpcmUoJy4vYXNzZXRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICAjIEBwYXJhbVxuICAjICAtIG5hbWUgeyBTdHJpbmcgfSBUaGUgbmFtZSBvZiB0aGUgZGVzaWduLlxuICAjICAtIHZlcnNpb24geyBTdHJpbmcgfSBlLmcuICcxLjAuMCdcbiAgIyAgLSBhdXRob3IgeyBTdHJpbmcgfVxuICAjICAtIGRlc2NyaXB0aW9uIHsgU3RyaW5nIH1cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdmVyc2lvbiwgQGF1dGhvciwgQGRlc2NyaXB0aW9uIH0pIC0+XG4gICAgYXNzZXJ0IEBuYW1lPywgJ0Rlc2lnbiBuZWVkcyBhIG5hbWUnXG4gICAgQGlkZW50aWZpZXIgPSBEZXNpZ24uZ2V0SWRlbnRpZmllcihAbmFtZSwgQHZlcnNpb24pXG5cbiAgICAjIHRlbXBsYXRlcyBpbiBhIHN0cnVjdHVyZWQgZm9ybWF0XG4gICAgQGdyb3VwcyA9IFtdXG5cbiAgICAjIHRlbXBsYXRlcyBieSBpZCBhbmQgc29ydGVkXG4gICAgQGNvbXBvbmVudHMgPSBuZXcgT3JkZXJlZEhhc2goKVxuXG4gICAgIyBhc3NldHMgcmVxdWlyZWQgYnkgdGhlIGRlc2lnblxuICAgIEBhc3NldHMgPSBuZXcgQXNzZXRzKGRlc2lnbjogdGhpcylcblxuICAgICMgZGVmYXVsdCBjb21wb25lbnRzXG4gICAgQGRlZmF1bHRQYXJhZ3JhcGggPSB1bmRlZmluZWRcbiAgICBAZGVmYXVsdEltYWdlID0gdW5kZWZpbmVkXG5cblxuICBlcXVhbHM6IChkZXNpZ24pIC0+XG4gICAgZGVzaWduLm5hbWUgPT0gQG5hbWUgJiYgZGVzaWduLnZlcnNpb24gPT0gQHZlcnNpb25cblxuXG4gICMgU2ltcGxlIGltcGxlbWVudGF0aW9uIHdpdGggc3RyaW5nIGNvbXBhcmlzb25cbiAgIyBDYXV0aW9uOiB3b24ndCB3b3JrIGZvciAnMS4xMC4wJyA+ICcxLjkuMCdcbiAgaXNOZXdlclRoYW46IChkZXNpZ24pIC0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIGRlc2lnbj9cbiAgICBAdmVyc2lvbiA+IChkZXNpZ24udmVyc2lvbiB8fCAnJylcblxuXG4gIGdldDogKGlkZW50aWZpZXIpIC0+XG4gICAgY29tcG9uZW50TmFtZSA9IEBnZXRDb21wb25lbnROYW1lRnJvbUlkZW50aWZpZXIoaWRlbnRpZmllcilcbiAgICBAY29tcG9uZW50cy5nZXQoY29tcG9uZW50TmFtZSlcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAY29tcG9uZW50cy5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgYWRkOiAodGVtcGxhdGUpIC0+XG4gICAgdGVtcGxhdGUuc2V0RGVzaWduKHRoaXMpXG4gICAgQGNvbXBvbmVudHMucHVzaCh0ZW1wbGF0ZS5uYW1lLCB0ZW1wbGF0ZSlcblxuXG4gIGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcjogKGlkZW50aWZpZXIpIC0+XG4gICAgeyBuYW1lIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcbiAgICBuYW1lXG5cblxuICBAZ2V0SWRlbnRpZmllcjogKG5hbWUsIHZlcnNpb24pIC0+XG4gICAgaWYgdmVyc2lvblxuICAgICAgXCIjeyBuYW1lIH1AI3sgdmVyc2lvbiB9XCJcbiAgICBlbHNlXG4gICAgICBcIiN7IG5hbWUgfVwiXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcblZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ25hbWVPZllvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFByb3Bvc2VkIGV4dGVuc2lvbnM6XG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gYSByZW1vdGUgc2VydmVyIGJ5IG5hbWUgKHNlcnZlciBoYXMgdG8gYmUgY29uZmlndXJlZCBhcyBkZWZhdWx0KVxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChkZXNpZ25TcGVjKSAtPlxuICAgIGFzc2VydCBkZXNpZ25TcGVjPywgJ2Rlc2lnbi5sb2FkKCkgd2FzIGNhbGxlZCB3aXRoIHVuZGVmaW5lZC4nXG4gICAgYXNzZXJ0IG5vdCAodHlwZW9mIGRlc2lnblNwZWMgPT0gJ3N0cmluZycpLCAnZGVzaWduLmxvYWQoKSBsb2FkaW5nIGEgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkLidcblxuICAgIHZlcnNpb24gPSBWZXJzaW9uLnBhcnNlKGRlc2lnblNwZWMudmVyc2lvbilcbiAgICBkZXNpZ25JZGVudGlmaWVyID0gRGVzaWduLmdldElkZW50aWZpZXIoZGVzaWduU3BlYy5uYW1lLCB2ZXJzaW9uKVxuICAgIHJldHVybiBpZiBAaGFzKGRlc2lnbklkZW50aWZpZXIpXG5cbiAgICBkZXNpZ24gPSBEZXNpZ24ucGFyc2VyLnBhcnNlKGRlc2lnblNwZWMpXG4gICAgaWYgZGVzaWduXG4gICAgICBAYWRkKGRlc2lnbilcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRGVzaWduLnBhcnNlci5lcnJvcnMpXG5cblxuICAjIEFkZCBhbiBhbHJlYWR5IHBhcnNlZCBkZXNpZ24uXG4gICMgQHBhcmFtIHsgRGVzaWduIG9iamVjdCB9XG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBpZiBkZXNpZ24uaXNOZXdlclRoYW4oQGRlc2lnbnNbZGVzaWduLm5hbWVdKVxuICAgICAgQGRlc2lnbnNbZGVzaWduLm5hbWVdID0gZGVzaWduXG4gICAgQGRlc2lnbnNbZGVzaWduLmlkZW50aWZpZXJdID0gZGVzaWduXG5cblxuICAjIENoZWNrIGlmIGEgZGVzaWduIGlzIGxvYWRlZFxuICBoYXM6IChkZXNpZ25JZGVudGlmaWVyKSAtPlxuICAgIEBkZXNpZ25zW2Rlc2lnbklkZW50aWZpZXJdP1xuXG5cbiAgIyBHZXQgYSBsb2FkZWQgZGVzaWduXG4gICMgQHJldHVybiB7IERlc2lnbiBvYmplY3QgfVxuICBnZXQ6IChkZXNpZ25JZGVudGlmaWVyKSAtPlxuICAgIGFzc2VydCBAaGFzKGRlc2lnbklkZW50aWZpZXIpLCBcIkVycm9yOiBkZXNpZ24gJyN7IGRlc2lnbklkZW50aWZpZXIgfScgaXMgbm90IGxvYWRlZC5cIlxuICAgIEBkZXNpZ25zW2Rlc2lnbklkZW50aWZpZXJdXG5cblxuICAjIENsZWFyIHRoZSBjYWNoZSBpZiB5b3Ugd2FudCB0byByZWxvYWQgZGVzaWduc1xuICByZXNldENhY2hlOiAtPlxuICAgIEBkZXNpZ25zID0ge31cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuU2NoZW1lID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9vYmplY3Rfc2NoZW1hL3NjaGVtZScpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yID0gbmV3IFNjaGVtZSgpXG5cbiMgQ3VzdG9tIFZhbGlkYXRvcnNcbiMgLS0tLS0tLS0tLS0tLS0tLS1cblxudmFsaWRhdG9yLmFkZCAnc3R5bGVUeXBlJywgKHZhbHVlKSAtPlxuICB2YWx1ZSA9PSAnb3B0aW9uJyBvciB2YWx1ZSA9PSAnc2VsZWN0J1xuXG5cbnZhbGlkYXRvci5hZGQgJ3NlbVZlcicsICh2YWx1ZSkgLT5cbiAgVmVyc2lvbi5zZW1WZXIudGVzdCh2YWx1ZSlcblxuXG4jIGNzc0NsYXNzTW9kaWZpY2F0b3IgcHJvcGVydGllcyBuZWVkIG9uZSAnRGVmYXVsdCcgb3B0aW9uXG4jIHdpdGggYW4gdW5kZWZpbmVkIHZhbHVlLiBPdGhlcndpc2UgdXNlcnMgY2Fubm90IHJlc2V0IHRoZVxuIyBzdHlsZSB2aWEgdGhlIGRyb3Bkb3duIGluIHRoZSBVSS5cbnZhbGlkYXRvci5hZGQgJ29uZSBlbXB0eSBvcHRpb24nLCAodmFsdWUpIC0+XG4gIGVtcHR5Q291bnQgPSAwXG4gIGZvciBlbnRyeSBpbiB2YWx1ZVxuICAgIGVtcHR5Q291bnQgKz0gMSBpZiBub3QgZW50cnkudmFsdWVcblxuICBlbXB0eUNvdW50ID09IDFcblxuXG4jIFNjaGVtYXNcbiMgLS0tLS0tLVxuXG52YWxpZGF0b3IuYWRkICdkZXNpZ24nLFxuICBuYW1lOiAnc3RyaW5nJ1xuICB2ZXJzaW9uOiAnc3RyaW5nLCBzZW1WZXInXG4gIGF1dGhvcjogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGRlc2NyaXB0aW9uOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgYXNzZXRzOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBjc3M6ICdhcnJheSBvZiBzdHJpbmcnXG4gICAganM6ICdhcnJheSBvZiBzdHJpbmcsIG9wdGlvbmFsJ1xuICBjb21wb25lbnRzOiAnYXJyYXkgb2YgY29tcG9uZW50J1xuICBjb21wb25lbnRQcm9wZXJ0aWVzOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBfX2FkZGl0aW9uYWxQcm9wZXJ0eTogKGtleSwgdmFsdWUpIC0+IHZhbGlkYXRvci52YWxpZGF0ZSgnY29tcG9uZW50UHJvcGVydHknLCB2YWx1ZSlcbiAgZ3JvdXBzOiAnYXJyYXkgb2YgZ3JvdXAsIG9wdGlvbmFsJ1xuICBkZWZhdWx0Q29tcG9uZW50czpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgcGFyYWdyYXBoOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgICBpbWFnZTogJ3N0cmluZywgb3B0aW9uYWwnXG5cblxudmFsaWRhdG9yLmFkZCAnY29tcG9uZW50JyxcbiAgbmFtZTogJ3N0cmluZydcbiAgbGFiZWw6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBodG1sOiAnc3RyaW5nJ1xuICBwcm9wZXJ0aWVzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiBmYWxzZVxuXG5cbnZhbGlkYXRvci5hZGQgJ2dyb3VwJyxcbiAgbGFiZWw6ICdzdHJpbmcnXG4gIGNvbXBvbmVudHM6ICdhcnJheSBvZiBzdHJpbmcnXG5cblxuIyB0b2RvOiByZW5hbWUgdHlwZSBhbmQgdXNlIHR5cGUgdG8gaWRlbnRpZnkgdGhlIGNvbXBvbmVudFByb3BlcnR5IHR5cGUgbGlrZSBjc3NDbGFzc1xudmFsaWRhdG9yLmFkZCAnY29tcG9uZW50UHJvcGVydHknLFxuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIHR5cGU6ICdzdHJpbmcsIHN0eWxlVHlwZSdcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBvcHRpb25zOiAnYXJyYXkgb2Ygc3R5bGVPcHRpb24sIG9uZSBlbXB0eSBvcHRpb24sIG9wdGlvbmFsJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ3N0eWxlT3B0aW9uJyxcbiAgY2FwdGlvbjogJ3N0cmluZydcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGVzaWduQ29uZmlnU2NoZW1hID0gcmVxdWlyZSgnLi9kZXNpZ25fY29uZmlnX3NjaGVtYScpXG5Dc3NNb2RpZmljYXRvclByb3BlcnR5ID0gcmVxdWlyZSgnLi9jc3NfbW9kaWZpY2F0b3JfcHJvcGVydHknKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlc2lnblBhcnNlciA9XG5cbiAgcGFyc2U6IChkZXNpZ25Db25maWcpIC0+XG4gICAgQGRlc2lnbiA9IHVuZGVmaW5lZFxuICAgIGlmIGRlc2lnbkNvbmZpZ1NjaGVtYS52YWxpZGF0ZSgnZGVzaWduJywgZGVzaWduQ29uZmlnKVxuICAgICAgQGNyZWF0ZURlc2lnbihkZXNpZ25Db25maWcpXG4gICAgZWxzZVxuICAgICAgZXJyb3JzID0gZGVzaWduQ29uZmlnU2NoZW1hLmdldEVycm9yTWVzc2FnZXMoKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycylcblxuXG4gIGNyZWF0ZURlc2lnbjogKGRlc2lnbkNvbmZpZykgLT5cbiAgICB7IGFzc2V0cywgY29tcG9uZW50cywgY29tcG9uZW50UHJvcGVydGllcywgZ3JvdXBzLCBkZWZhdWx0Q29tcG9uZW50cyB9ID0gZGVzaWduQ29uZmlnXG4gICAgdHJ5XG4gICAgICBAZGVzaWduID0gQHBhcnNlRGVzaWduSW5mbyhkZXNpZ25Db25maWcpXG4gICAgICBAcGFyc2VBc3NldHMoYXNzZXRzKVxuICAgICAgQHBhcnNlQ29tcG9uZW50UHJvcGVydGllcyhjb21wb25lbnRQcm9wZXJ0aWVzKVxuICAgICAgQHBhcnNlQ29tcG9uZW50cyhjb21wb25lbnRzKVxuICAgICAgQHBhcnNlR3JvdXBzKGdyb3VwcylcbiAgICAgIEBwYXJzZURlZmF1bHRzKGRlZmF1bHRDb21wb25lbnRzKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciBjcmVhdGluZyB0aGUgZGVzaWduOiAjeyBlcnJvciB9XCIpXG5cbiAgICBAZGVzaWduXG5cblxuICBwYXJzZURlc2lnbkluZm86IChkZXNpZ24pIC0+XG4gICAgdmVyc2lvbiA9IG5ldyBWZXJzaW9uKGRlc2lnbi52ZXJzaW9uKVxuICAgIG5ldyBEZXNpZ25cbiAgICAgIG5hbWU6IGRlc2lnbi5uYW1lXG4gICAgICB2ZXJzaW9uOiB2ZXJzaW9uLnRvU3RyaW5nKClcblxuXG4gIHBhcnNlQXNzZXRzOiAoYXNzZXRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgYXNzZXRzP1xuICAgIEBkZXNpZ24uYXNzZXRzLmFkZENzcyhhc3NldHMuY3NzKVxuICAgIEBkZXNpZ24uYXNzZXRzLmFkZEpzKGFzc2V0cy5qcylcblxuXG4gICMgTm90ZTogQ3VycmVudGx5IGNvbXBvbmVudFByb3BlcnRpZXMgY29uc2lzdCBvbmx5IG9mIGRlc2lnbiBzdHlsZXNcbiAgcGFyc2VDb21wb25lbnRQcm9wZXJ0aWVzOiAoY29tcG9uZW50UHJvcGVydGllcykgLT5cbiAgICBAY29tcG9uZW50UHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUsIGNvbmZpZyBvZiBjb21wb25lbnRQcm9wZXJ0aWVzXG4gICAgICBjb25maWcubmFtZSA9IG5hbWVcbiAgICAgIEBjb21wb25lbnRQcm9wZXJ0aWVzW25hbWVdID0gQGNyZWF0ZUNvbXBvbmVudFByb3BlcnR5KGNvbmZpZylcblxuXG4gIHBhcnNlQ29tcG9uZW50czogKGNvbXBvbmVudHM9W10pIC0+XG4gICAgZm9yIHsgbmFtZSwgbGFiZWwsIGh0bWwsIHByb3BlcnRpZXMgfSBpbiBjb21wb25lbnRzXG4gICAgICBwcm9wZXJ0aWVzID0gQGxvb2t1cENvbXBvbmVudFByb3BlcnRpZXMocHJvcGVydGllcylcblxuICAgICAgY29tcG9uZW50ID0gbmV3IFRlbXBsYXRlXG4gICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgIGh0bWw6IGh0bWxcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllc1xuXG4gICAgICBAZGVzaWduLmFkZChjb21wb25lbnQpXG5cblxuICBsb29rdXBDb21wb25lbnRQcm9wZXJ0aWVzOiAocHJvcGVydHlOYW1lcykgLT5cbiAgICBwcm9wZXJ0aWVzID0ge31cbiAgICBmb3IgbmFtZSBpbiBwcm9wZXJ0eU5hbWVzIHx8IFtdXG4gICAgICBpZiBwcm9wZXJ0eSA9IEBjb21wb25lbnRQcm9wZXJ0aWVzW25hbWVdXG4gICAgICAgIHByb3BlcnRpZXNbbmFtZV0gPSBwcm9wZXJ0eVxuICAgICAgZWxzZVxuICAgICAgICBsb2cud2FybihcIlRoZSBjb21wb25lbnRQcm9wZXJ0eSAnI3sgbmFtZSB9JyB3YXMgbm90IGZvdW5kLlwiKVxuXG4gICAgcHJvcGVydGllc1xuXG5cbiAgcGFyc2VHcm91cHM6IChncm91cHM9W10pIC0+XG4gICAgZm9yIGdyb3VwIGluIGdyb3Vwc1xuICAgICAgY29tcG9uZW50cyA9IGZvciBjb21wb25lbnROYW1lIGluIGdyb3VwLmNvbXBvbmVudHNcbiAgICAgICAgQGRlc2lnbi5nZXQoY29tcG9uZW50TmFtZSlcblxuICAgICAgQGRlc2lnbi5ncm91cHMucHVzaFxuICAgICAgICBsYWJlbDogZ3JvdXAubGFiZWxcbiAgICAgICAgY29tcG9uZW50czogY29tcG9uZW50c1xuXG5cbiAgcGFyc2VEZWZhdWx0czogKGRlZmF1bHRDb21wb25lbnRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZGVmYXVsdENvbXBvbmVudHM/XG4gICAgeyBwYXJhZ3JhcGgsIGltYWdlIH0gPSBkZWZhdWx0Q29tcG9uZW50c1xuICAgIEBkZXNpZ24uZGVmYXVsdFBhcmFncmFwaCA9IEBnZXRDb21wb25lbnQocGFyYWdyYXBoKSBpZiBwYXJhZ3JhcGhcbiAgICBAZGVzaWduLmRlZmF1bHRJbWFnZSA9IEBnZXRDb21wb25lbnQoaW1hZ2UpIGlmIGltYWdlXG5cblxuICBnZXRDb21wb25lbnQ6IChuYW1lKSAtPlxuICAgIGNvbXBvbmVudCA9IEBkZXNpZ24uZ2V0KG5hbWUpXG4gICAgYXNzZXJ0IGNvbXBvbmVudCwgXCJDb3VsZCBub3QgZmluZCBjb21wb25lbnQgI3sgbmFtZSB9XCJcbiAgICBjb21wb25lbnRcblxuXG4gIGNyZWF0ZUNvbXBvbmVudFByb3BlcnR5OiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIG5ldyBDc3NNb2RpZmljYXRvclByb3BlcnR5KHN0eWxlRGVmaW5pdGlvbilcblxuXG5EZXNpZ24ucGFyc2VyID0gZGVzaWduUGFyc2VyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZlcnNpb25cbiAgQHNlbVZlcjogIC8oXFxkKylcXC4oXFxkKylcXC4oXFxkKykoLispPy9cblxuICBjb25zdHJ1Y3RvcjogKHZlcnNpb25TdHJpbmcpIC0+XG4gICAgQHBhcnNlVmVyc2lvbih2ZXJzaW9uU3RyaW5nKVxuXG5cbiAgcGFyc2VWZXJzaW9uOiAodmVyc2lvblN0cmluZykgLT5cbiAgICByZXMgPSBWZXJzaW9uLnNlbVZlci5leGVjKHZlcnNpb25TdHJpbmcpXG4gICAgaWYgcmVzXG4gICAgICBAbWFqb3IgPSByZXNbMV1cbiAgICAgIEBtaW5vciA9IHJlc1syXVxuICAgICAgQHBhdGNoID0gcmVzWzNdXG4gICAgICBAYWRkZW5kdW0gPSByZXNbNF1cblxuXG4gIGlzVmFsaWQ6IC0+XG4gICAgQG1ham9yP1xuXG5cbiAgdG9TdHJpbmc6IC0+XG4gICAgXCIjeyBAbWFqb3IgfS4jeyBAbWlub3IgfS4jeyBAcGF0Y2ggfSN7IEBhZGRlbmR1bSB8fCAnJyB9XCJcblxuXG4gIEBwYXJzZTogKHZlcnNpb25TdHJpbmcpIC0+XG4gICAgdiA9IG5ldyBWZXJzaW9uKHZlcnNpb25TdHJpbmcpXG4gICAgaWYgdi5pc1ZhbGlkKCkgdGhlbiB2LnRvU3RyaW5nKCkgZWxzZSAnJ1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG5cbiAgIyBJbWFnZSBTZXJ2aWNlIEludGVyZmFjZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbmFtZTogJ2RlZmF1bHQnXG5cbiAgIyBTZXQgdmFsdWUgdG8gYW4gaW1hZ2Ugb3IgYmFja2dyb3VuZCBpbWFnZSBlbGVtZW50LlxuICAjXG4gICMgQHBhcmFtIHsgalF1ZXJ5IG9iamVjdCB9IE5vZGUgdG8gc2V0IHRoZSBpbWFnZSB0by5cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBJbWFnZSB1cmxcbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgQHNldElubGluZUltYWdlKCRlbGVtLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICBAc2V0QmFja2dyb3VuZEltYWdlKCRlbGVtLCB2YWx1ZSlcblxuXG4gIHNldFBsYWNlaG9sZGVyOiAoJGVsZW0pIC0+XG4gICAgZGltID0gQGdldEltYWdlRGltZW5zaW9ucygkZWxlbSlcbiAgICBpbWFnZVVybCA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8jeyBkaW0ud2lkdGggfXgjeyBkaW0uaGVpZ2h0IH0vQkVGNTZGL0IyRTY2OFwiXG5cblxuICAjIFRoZSBkZWZhdWx0IHNlcnZpY2UgZG9lcyBub3QgdHJhbnNmb3IgdGhlIGdpdmVuIHVybFxuICBnZXRVcmw6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZVxuXG5cbiAgIyBEZWZhdWx0IEltYWdlIFNlcnZpY2UgbWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGdldEltYWdlRGltZW5zaW9uczogKCRlbGVtKSAtPlxuICAgIGlmIEBpc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgd2lkdGg6ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aDogJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQ6ICRlbGVtLm91dGVySGVpZ2h0KClcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDAgaWYgdmFsdWU/XG5cblxuICBpc0lubGluZUltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9ICdpbWcnXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGVmYXVsdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9zZXJ2aWNlJylcbnJlc3JjaXRJbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEF2YWlsYWJsZSBJbWFnZSBTZXJ2aWNlc1xuICBzZXJ2aWNlcyA9XG4gICAgJ3Jlc3JjLml0JzogcmVzcmNpdEltYWdlU2VydmljZVxuICAgICdkZWZhdWx0JzogZGVmYXVsdEltYWdlU2VydmljZVxuXG5cbiAgIyBTZXJ2aWNlXG4gICMgLS0tLS0tLVxuXG4gIGhhczogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXT9cblxuXG4gIGdldDogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIGFzc2VydCBAaGFzKHNlcnZpY2VOYW1lKSwgXCJDb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IHNlcnZpY2VOYW1lIH1cIlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXVxuXG5cbiAgZWFjaFNlcnZpY2U6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc2VydmljZSBvZiBzZXJ2aWNlc1xuICAgICAgY2FsbGJhY2sobmFtZSwgc2VydmljZSlcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgcmVzcmNpdFVybDogJ2h0dHA6Ly9hcHAucmVzcmMuaXQvJ1xuXG4gICMgSW1hZ2UgU2VydmljZSBJbnRlcmZhY2VcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIG5hbWU6ICdyZXNyYy5pdCdcblxuICAjIEBwYXJhbSB7IGpRdWVyeSBvYmplY3QgfVxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEEgcmVzcmMuaXQgdXJsLiBFLmcuIGh0dHA6Ly9hcHAucmVzcmMuaXQvaHR0cDovL2ltYWdlcy5jb20vMS5qcGdcbiAgc2V0OiAoJGVsZW0sIHVybCkgLT5cbiAgICBhc3NlcnQgdXJsPyAmJiB1cmwgIT0gJycsICdTcmMgdmFsdWUgZm9yIGFuIGltYWdlIGhhcyB0byBiZSBkZWZpbmVkJ1xuXG4gICAgcmV0dXJuIEBzZXRCYXNlNjQoJGVsZW0sIHVybCkgaWYgaW1nU2VydmljZS5pc0Jhc2U2NCh1cmwpXG5cbiAgICAkZWxlbS5hZGRDbGFzcygncmVzcmMnKVxuICAgIGlmIGltZ1NlcnZpY2UuaXNJbmxpbmVJbWFnZSgkZWxlbSlcbiAgICAgIEBzZXRJbmxpbmVJbWFnZSgkZWxlbSwgdXJsKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHVybClcblxuXG4gIHNldFBsYWNlaG9sZGVyOiAoJGVsZW0pIC0+XG4gICAgaW1nU2VydmljZS5zZXRQbGFjZWhvbGRlcigkZWxlbSlcblxuXG4gIGdldFVybDogKHZhbHVlLCB7IGNyb3AgfSkgLT5cbiAgICBjcm9wUGFyYW0gPSBcIkM9VyN7IGNyb3Aud2lkdGggfSxII3sgY3JvcC5oZWlnaHQgfSxYI3sgY3JvcC54IH0sWSN7IGNyb3AueSB9L1wiIGlmIGNyb3A/XG4gICAgXCIjeyBAcmVzcmNpdFVybCB9I3sgY3JvcFBhcmFtIHx8ICcnIH0jeyB2YWx1ZSB9XCJcblxuXG4gICMgSW1hZ2Ugc3BlY2lmaWMgbWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBmb3JtYXRDc3NVcmw6ICh1cmwpIC0+XG4gICAgdXJsID0gaW1nU2VydmljZS5lc2NhcGVDc3NVcmkodXJsKVxuICAgIFwidXJsKCN7IHVybCB9KVwiXG5cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB1cmwpIC0+XG4gICAgJGVsZW0ucmVtb3ZlQXR0cignc3JjJykgaWYgaW1nU2VydmljZS5pc0Jhc2U2NCgkZWxlbS5hdHRyKCdzcmMnKSlcbiAgICAkZWxlbS5hdHRyKCdkYXRhLXNyYycsIHVybClcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB1cmwpIC0+XG4gICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgQGZvcm1hdENzc1VybCh1cmwpKVxuXG5cbiAgIyBTZXQgc3JjIGRpcmVjdGx5LCBkb24ndCBhZGQgcmVzcmMgY2xhc3NcbiAgc2V0QmFzZTY0OiAoJGVsZW0sIGJhc2U2NFN0cmluZykgLT5cbiAgICBpbWdTZXJ2aWNlLnNldCgkZWxlbSwgYmFzZTY0U3RyaW5nKVxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnREcmFnXG5cbiAgd2lnZ2xlU3BhY2UgPSAwXG4gIHN0YXJ0QW5kRW5kT2Zmc2V0ID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBjb21wb25lbnRWaWV3LiRodG1sIGlmIGNvbXBvbmVudFZpZXdcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIHN0YXJ0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuZGlzYWJsZUFsbCgpXG4gICAgQHBhZ2UuYmx1ckZvY3VzZWRFbGVtZW50KClcblxuICAgICMgcGxhY2Vob2xkZXIgYmVsb3cgY3Vyc29yXG4gICAgQCRwbGFjZWhvbGRlciA9IEBjcmVhdGVQbGFjZWhvbGRlcigpLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgQCRkcmFnQmxvY2tlciA9IEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIilcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBjb21wb25lbnRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LmNvbXBvbmVudFZpZXc/Lm1vZGVsICE9IEBjb21wb25lbnRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LmNvbXBvbmVudFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LmNvbXBvbmVudFZpZXcpXG4gICAgICAjICAgJGNvbnRhaW5lciA9IHRhcmdldC5jb21wb25lbnRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdjb21wb25lbnQnXG4gICAgICAgIEBjb21wb25lbnRQb3NpdGlvbih0YXJnZXQpXG4gICAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuXG5cbiAgY29tcG9uZW50UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQGNvbXBvbmVudE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2FmdGVyJ1xuICAgICAgICAgIHJldHVybiBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlbkNvbXBvbmVudHMoYmVmb3JlLCB0YXJnZXQuY29tcG9uZW50VmlldylcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5jb21wb25lbnRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5jb21wb25lbnRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAY29tcG9uZW50TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYmVmb3JlJ1xuICAgICAgICAgIHJldHVybiBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlbkNvbXBvbmVudHModGFyZ2V0LmNvbXBvbmVudFZpZXcsIG5leHQpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcih0YXJnZXQuY29tcG9uZW50Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdUb3AgPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy10b3AnKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXQgKyBwYWRkaW5nVG9wXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLWJvdHRvbScpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldCAtIHBhZGRpbmdCb3R0b21cbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cblxuICAgICAgaWYgY2xpZW50WD8gJiYgY2xpZW50WT9cbiAgICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcblxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2UuY29tcG9uZW50V2FzRHJvcHBlZC5maXJlKEBjb21wb25lbnRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIGNvbXBvbmVudCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ2NvbXBvbmVudCdcbiAgICAgICAgY29tcG9uZW50VmlldyA9IHRhcmdldC5jb21wb25lbnRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIGNvbXBvbmVudFZpZXcubW9kZWwuYmVmb3JlKEBjb21wb25lbnRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbXBvbmVudFZpZXcubW9kZWwuYWZ0ZXIoQGNvbXBvbmVudE1vZGVsKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBjb21wb25lbnRNb2RlbCA9IHRhcmdldC5jb21wb25lbnRWaWV3Lm1vZGVsXG4gICAgICAgIGNvbXBvbmVudE1vZGVsLmFwcGVuZCh0YXJnZXQuY29udGFpbmVyTmFtZSwgQGNvbXBvbmVudE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgY29tcG9uZW50VHJlZSA9IHRhcmdldC5jb21wb25lbnRUcmVlXG4gICAgICAgIGNvbXBvbmVudFRyZWUucHJlcGVuZChAY29tcG9uZW50TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIENvbXBvbmVudFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBjb21wb25lbnRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLmNvbXBvbmVudCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBjb21wb25lbnQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgQ29tcG9uZW50cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgY29tcG9uZW50UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRDb21wb25lbnRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZENvbXBvbmVudFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgY29tcG9uZW50Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudERhdGEgPSBAZ2V0Q2xvc2VzdENvbXBvbmVudChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0Q29tcG9uZW50RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQoY2xvc2VzdENvbXBvbmVudERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIGNvbXBvbmVudFxuICAgICAgZWxzZSBpZiBjb21wb25lbnRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldENvbXBvbmVudFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50RGF0YSA9IEBnZXRDbG9zZXN0Q29tcG9uZW50KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RDb21wb25lbnREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdENvbXBvbmVudFRhcmdldChjbG9zZXN0Q29tcG9uZW50RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRDb21wb25lbnRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdjb21wb25lbnQnXG4gICAgY29tcG9uZW50VmlldzogQGdldENvbXBvbmVudFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25Db21wb25lbnQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQ6IChjbG9zZXN0Q29tcG9uZW50RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdENvbXBvbmVudERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RDb21wb25lbnREYXRhLnBvc2l0aW9uXG4gICAgQGdldENvbXBvbmVudFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIGNvbXBvbmVudFZpZXc6IEBmaW5kQ29tcG9uZW50Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbXBvbmVudFRyZWUgPSAkKG5vZGUpLmRhdGEoJ2NvbXBvbmVudFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgY29tcG9uZW50VHJlZTogY29tcG9uZW50VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgY29tcG9uZW50XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PbkNvbXBvbmVudDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IGNvbXBvbmVudCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0Q29tcG9uZW50OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRjb21wb25lbnRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLmNvbXBvbmVudCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RDb21wb25lbnQgPSB1bmRlZmluZWRcblxuICAgICRjb21wb25lbnRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0Q29tcG9uZW50XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgY29tcG9uZW50IHRvIGJlIGFzIGhpZ2ggYXMgdGhleSBjYW4gYmVcbiAgIyBzZXRzIGNzcyBzdHlsZSBoZWlnaHRcbiAgbWF4aW1pemVDb250YWluZXJIZWlnaHQ6ICh2aWV3KSAtPlxuICAgIGlmIHZpZXcudGVtcGxhdGUuY29udGFpbmVyQ291bnQgPiAxXG4gICAgICBmb3IgbmFtZSwgZWxlbSBvZiB2aWV3LmNvbnRhaW5lcnNcbiAgICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICAgIGNvbnRpbnVlIGlmICRlbGVtLmhhc0NsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICAjIHJlbW92ZSBhbGwgY3NzIHN0eWxlIGhlaWdodCBkZWNsYXJhdGlvbnMgYWRkZWQgYnlcbiAgIyBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodCgpXG4gIHJlc3RvcmVDb250YWluZXJIZWlnaHQ6ICgpIC0+XG4gICAgJChcIi4jeyBjc3MubWF4aW1pemVkQ29udGFpbmVyIH1cIilcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLnJlbW92ZUNsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBDb21wb25lbnRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIFN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIFRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZFxuICAjIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSkuXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogKGV2ZW50KSAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKGV2ZW50KSBpZiBAc3RhcnRlZFxuICAgIGlmICQuaXNGdW5jdGlvbihAb3B0aW9ucy5vbkRyb3ApXG4gICAgICBAb3B0aW9ucy5vbkRyb3AoZXZlbnQsIEBkcmFnSGFuZGxlcilcbiAgICBAcmVzZXQoKVxuXG5cbiAgY2FuY2VsOiAtPlxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyYWdCbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpLnJlbW92ZSgpXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgICAnZHJvcC5saXZpbmdkb2NzLWRyYWcgZHJhZ2VuZC5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCAoZXZlbnQpID0+XG4gICAgICBAZHJvcChldmVudClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gY29tcG9uZW50RHJhZyNvblN0YXJ0XG4gIGFkZE1vdmVMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICd0b3VjaG1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdkcmFnb3Zlci5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdtb3VzZW1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG5cbiAgZ2V0RXZlbnRQb3NpdGlvbjogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnIHx8IGV2ZW50LnR5cGUgPT0gJ3RvdWNobW92ZSdcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXVxuXG4gICAgIyBTbyBmYXIgSSBkbyBub3QgdW5kZXJzdGFuZCB3aHkgdGhlIGpRdWVyeSBldmVudCBkb2VzIG5vdCBjb250YWluIGNsaWVudFggZXRjLlxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ292ZXInXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnRcblxuICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFhcbiAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgcGFnZVg6IGV2ZW50LnBhZ2VYXG4gICAgcGFnZVk6IGV2ZW50LnBhZ2VZXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5wYWdlWCAtIHBvaW50Qi5wYWdlWFxuICAgIGRpc3RZID0gcG9pbnRBLnBhZ2VZIC0gcG9pbnRCLnBhZ2VZXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIGVkaXRhYmxlLmpzIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBlZGl0YWJsZS5qcyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cblxuICAgICMgSW5pdGlhbGl6ZSBlZGl0YWJsZS5qc1xuICAgIEBlZGl0YWJsZSA9IG5ldyBFZGl0YWJsZVxuICAgICAgd2luZG93OiBAcGFnZS53aW5kb3dcbiAgICAgIGJyb3dzZXJTcGVsbGNoZWNrOiBjb25maWcuZWRpdGFibGUuYnJvd3NlclNwZWxsY2hlY2tcbiAgICAgIG1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXM6IGNvbmZpZy5lZGl0YWJsZS5tb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzXG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBlZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcbiAgICAgIC5jaGFuZ2UoQHdpdGhDb250ZXh0KEBjaGFuZ2UpKVxuXG5cbiAgIyBSZWdpc3RlciBET00gbm9kZXMgd2l0aCBlZGl0YWJsZS5qcy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgQGVkaXRhYmxlLmFkZChub2RlcylcblxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLnN1c3BlbmQoKVxuXG5cbiAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLmNvbnRpbnVlKClcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgZWRpdGFibGUuanNcbiAgI1xuICAjIEFsbCBsaXN0ZW5lcnMgcGFyYW1zIGdldCB0cmFuc2Zvcm1lZCBzbyB0aGV5IGdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWVcbiAgIyBpbnN0ZWFkIG9mIGVsZW1lbnQ6XG4gICNcbiAgIyBFeGFtcGxlOiBsaXN0ZW5lcih2aWV3LCBlZGl0YWJsZU5hbWUsIG90aGVyUGFyYW1zLi4uKVxuICB3aXRoQ29udGV4dDogKGZ1bmMpIC0+XG4gICAgKGVsZW1lbnQsIGFyZ3MuLi4pID0+XG4gICAgICB2aWV3ID0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIGV4dHJhY3RDb250ZW50OiAoZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KGVsZW1lbnQpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdW5kZWZpbmVkXG4gICAgZWxzZVxuICAgICAgdmFsdWVcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGV4dHJhY3RDb250ZW50KGVsZW1lbnQpXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudClcblxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcblxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgSW5zZXJ0IGEgbmV3IGJsb2NrLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGF0IHRoZSBlbmQgb2YgYSBibG9ja1xuICAjIG9yIGJ5IHByZXNzaW5nIGRlbGV0ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgYmxvY2suXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgZGVmYXVsdFBhcmFncmFwaCA9IEBwYWdlLmRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoXG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpICYmIGRlZmF1bHRQYXJhZ3JhcGg/XG4gICAgICBjb3B5ID0gZGVmYXVsdFBhcmFncmFwaC5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3VmlldyAmJiBkaXJlY3Rpb24gPT0gJ2FmdGVyJ1xuXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgTWVyZ2UgdHdvIGJsb2Nrcy4gV29ya3MgaW4gdHdvIGRpcmVjdGlvbnMuXG4gICMgRWl0aGVyIHRoZSBjdXJyZW50IGJsb2NrIGlzIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBwcmVjZWVkaW5nICgnYmVmb3JlJylcbiAgIyBvciB0aGUgZm9sbG93aW5nICgnYWZ0ZXInKSBibG9jay5cbiAgIyBBZnRlciB0aGUgbWVyZ2UgdGhlIGN1cnJlbnQgYmxvY2sgaXMgcmVtb3ZlZCBhbmQgdGhlIGZvY3VzIHNldCB0byB0aGVcbiAgIyBvdGhlciBibG9jayB0aGF0IHdhcyBtZXJnZWQgaW50by5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcbiAgICAgICAgdmlld0VsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBtZXJnZWRWaWV3RWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG5cbiAgICAgICAgIyBHYXRoZXIgdGhlIGNvbnRlbnQgdGhhdCBpcyBnb2luZyB0byBiZSBtZXJnZWRcbiAgICAgICAgY29udGVudFRvTWVyZ2UgPSBAZWRpdGFibGUuZ2V0Q29udGVudCh2aWV3RWxlbSlcblxuICAgICAgICBjdXJzb3IgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBAZWRpdGFibGUuYXBwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRhYmxlLnByZXBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZVNlbGVjdGlvbigpXG5cbiAgICAgICAgIyBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgYW5kIHRoZSBmb2N1cyBpcyBzZXQgdXBkYXRlIHRoZSBtb2RlbCB0b1xuICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgbW9kZWwgaXMgdXAgdG8gZGF0ZSBhbmQgY2hhbmdlcyBhcmUgbm90aWZpZWQuXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUsIG1lcmdlZFZpZXdFbGVtKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFNwbGl0IGEgYmxvY2sgaW4gdHdvLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGluIHRoZSBtaWRkbGUgb2YgYSBibG9jay5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2YgY29tcG9uZW50XG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChhZnRlcikpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKT8uZm9jdXMoKVxuXG4gICAgICAjIHNldCBjb250ZW50IG9mIHRoZSBiZWZvcmUgZWxlbWVudCAoYWZ0ZXIgZm9jdXMgaXMgc2V0IHRvIHRoZSBhZnRlciBlbGVtZW50KVxuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYmVmb3JlKSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBPY2N1cnMgd2hlbmV2ZXIgdGhlIHVzZXIgc2VsZWN0cyBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJzIG9yIHdoZW5ldmVyIHRoZVxuICAjIHNlbGVjdGlvbiBpcyBjaGFuZ2VkLlxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gICMgSW5zZXJ0IGEgbmV3bGluZSAoU2hpZnQgKyBFbnRlcilcbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgaWYgY29uZmlnLmVkaXRhYmxlLmFsbG93TmV3bGluZVxuICAgICAgcmV0dXJuIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBlbHNlXG4gICAgIHJldHVybiBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgVHJpZ2dlcmVkIHdoZW5ldmVyIHRoZSB1c2VyIGNoYW5nZXMgdGhlIGNvbnRlbnQgb2YgYSBibG9jay5cbiAgIyBUaGUgY2hhbmdlIGV2ZW50IGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgZmlyZSBpZiB0aGUgY29udGVudCBoYXNcbiAgIyBiZWVuIGNoYW5nZWQgdmlhIGphdmFzY3JpcHQuXG4gIGNoYW5nZTogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcbiAgICByZXR1cm4gaWYgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXlcblxuXG4gIGNsZWFyQ2hhbmdlVGltZW91dDogLT5cbiAgICBpZiBAY2hhbmdlVGltZW91dD9cbiAgICAgIGNsZWFyVGltZW91dChAY2hhbmdlVGltZW91dClcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIENvbXBvbmVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBjb21wb25lbnQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAY29tcG9uZW50VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQGNvbXBvbmVudEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBjb21wb25lbnRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChjb21wb25lbnRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIGNvbXBvbmVudFZpZXcgIT0gQGNvbXBvbmVudFZpZXdcbiAgICAgIEByZXNldENvbXBvbmVudFZpZXcoKVxuICAgICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgICBAY29tcG9uZW50VmlldyA9IGNvbXBvbmVudFZpZXdcbiAgICAgICAgQGNvbXBvbmVudEZvY3VzLmZpcmUoQGNvbXBvbmVudFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBjb21wb25lbnRWaWV3IHx8PSBkb20uZmluZENvbXBvbmVudFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKGNvbXBvbmVudFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAY29tcG9uZW50VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIGNvbXBvbmVudEZvY3VzZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBjb21wb25lbnRWaWV3ICE9IGNvbXBvbmVudFZpZXdcbiAgICAgIEBzZXRGb2N1cyhjb21wb25lbnRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0Q29tcG9uZW50VmlldzogLT5cbiAgICBpZiBAY29tcG9uZW50Vmlld1xuICAgICAgcHJldmlvdXMgPSBAY29tcG9uZW50Vmlld1xuICAgICAgQGNvbXBvbmVudFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBjb21wb25lbnRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExpdmluZ2RvYyBleHRlbmRzIEV2ZW50RW1pdHRlclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbXBvbmVudFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gY29tcG9uZW50VHJlZS5kZXNpZ25cbiAgICBAc2V0Q29tcG9uZW50VHJlZShjb21wb25lbnRUcmVlKVxuICAgIEB2aWV3cyA9IHt9XG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuXG5cbiAgIyBHZXQgYSBkcm9wIHRhcmdldCBmb3IgYW4gZXZlbnRcbiAgZ2V0RHJvcFRhcmdldDogKHsgZXZlbnQgfSkgLT5cbiAgICBkb2N1bWVudCA9IGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50XG4gICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG4gICAgaWYgZWxlbT9cbiAgICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnQucGFnZVgsIHRvcDogZXZlbnQucGFnZVkgfVxuICAgICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKVxuXG5cbiAgc2V0Q29tcG9uZW50VHJlZTogKGNvbXBvbmVudFRyZWUpIC0+XG4gICAgYXNzZXJ0IGNvbXBvbmVudFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnQ29tcG9uZW50VHJlZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVzaWduIGFzIHRoZSBkb2N1bWVudCdcblxuICAgIEBtb2RlbCA9IEBjb21wb25lbnRUcmVlID0gY29tcG9uZW50VHJlZVxuICAgIEBmb3J3YXJkQ29tcG9uZW50VHJlZUV2ZW50cygpXG5cblxuICBmb3J3YXJkQ29tcG9uZW50VHJlZUV2ZW50czogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zLnJlYWRPbmx5ID89IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQGNvbXBvbmVudFRyZWUsICRwYXJlbnRbMF0pXG4gICAgcHJvbWlzZSA9IHZpZXcuY3JlYXRlKG9wdGlvbnMpXG5cbiAgICBpZiB2aWV3LmlzSW50ZXJhY3RpdmVcbiAgICAgIEBzZXRJbnRlcmFjdGl2ZVZpZXcodmlldylcblxuICAgIHByb21pc2VcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jcmVhdGVDb21wb25lbnQuYXBwbHkoQGNvbXBvbmVudFRyZWUsIGFyZ3VtZW50cylcblxuXG4gICMgQXBwZW5kIHRoZSBhcnRpY2xlIHRvIHRoZSBET00uXG4gICNcbiAgIyBAcGFyYW0geyBET00gTm9kZSwgalF1ZXJ5IG9iamVjdCBvciBDU1Mgc2VsZWN0b3Igc3RyaW5nIH0gV2hlcmUgdG8gYXBwZW5kIHRoZSBhcnRpY2xlIGluIHRoZSBkb2N1bWVudC5cbiAgIyBAcGFyYW0geyBPYmplY3QgfSBvcHRpb25zOlxuICAjICAgaW50ZXJhY3RpdmU6IHsgQm9vbGVhbiB9IFdoZXRoZXIgdGhlIGRvY3VtZW50IGlzIGVkdGlhYmxlLlxuICAjICAgbG9hZEFzc2V0czogeyBCb29sZWFuIH0gTG9hZCBDU1MgZmlsZXMuIE9ubHkgZGlzYWJsZSB0aGlzIGlmIHlvdSBhcmUgc3VyZSB5b3UgaGF2ZSBsb2FkZWQgZXZlcnl0aGluZyBtYW51YWxseS5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgYXJ0aWNsZS5hcHBlbmRUbygnLmFydGljbGUnLCB7IGludGVyYWN0aXZlOiB0cnVlLCBsb2FkQXNzZXRzOiBmYWxzZSB9KTtcbiAgYXBwZW5kVG86IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcoQGNvbXBvbmVudFRyZWUsICRwYXJlbnRbMF0pXG4gICAgdmlldy5jcmVhdGVSZW5kZXJlcih7IG9wdGlvbnMgfSlcblxuXG5cbiAgIyBBIHZpZXcgc29tZXRpbWVzIGhhcyB0byBiZSB3cmFwcGVkIGluIGEgY29udGFpbmVyLlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBIZXJlIHRoZSBkb2N1bWVudCBpcyByZW5kZXJlZCBpbnRvICQoJy5kb2Mtc2VjdGlvbicpXG4gICMgPGRpdiBjbGFzcz1cImlmcmFtZS1jb250YWluZXJcIj5cbiAgIyAgIDxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+PC9zZWN0aW9uPlxuICAjIDwvZGl2PlxuICBmaW5kV3JhcHBlcjogKCRwYXJlbnQpIC0+XG4gICAgaWYgJHBhcmVudC5maW5kKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIpLmxlbmd0aCA9PSAxXG4gICAgICAkd3JhcHBlciA9ICQoJHBhcmVudC5odG1sKCkpXG5cbiAgICAkd3JhcHBlclxuXG5cbiAgc2V0SW50ZXJhY3RpdmVWaWV3OiAodmlldykgLT5cbiAgICBhc3NlcnQgbm90IEBpbnRlcmFjdGl2ZVZpZXc/LFxuICAgICAgJ0Vycm9yIGNyZWF0aW5nIGludGVyYWN0aXZlIHZpZXc6IExpdmluZ2RvYyBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIHRvSHRtbDogKHsgZXhjbHVkZUNvbXBvbmVudHMgfT17fSkgLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBjb21wb25lbnRUcmVlOiBAY29tcG9uZW50VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcbiAgICAgIGV4Y2x1ZGVDb21wb25lbnRzOiBleGNsdWRlQ29tcG9uZW50c1xuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuc2VyaWFsaXplKClcblxuXG4gIHRvSnNvbjogKHByZXR0aWZ5KSAtPlxuICAgIGRhdGEgPSBAc2VyaWFsaXplKClcbiAgICBpZiBwcmV0dGlmeT9cbiAgICAgIHJlcGxhY2VyID0gbnVsbFxuICAgICAgaW5kZW50YXRpb24gPSAyXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgaW5kZW50YXRpb24pXG4gICAgZWxzZVxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSlcblxuXG4gICMgRGVidWdcbiAgIyAtLS0tLVxuXG4gICMgUHJpbnQgdGhlIENvbXBvbmVudFRyZWUuXG4gIHByaW50TW9kZWw6ICgpIC0+XG4gICAgQGNvbXBvbmVudFRyZWUucHJpbnQoKVxuXG5cbiAgTGl2aW5nZG9jLmRvbSA9IGRvbVxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaHRtbFBvaW50ZXJFdmVudHM6IC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gnKVxuICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJ1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPT0gJ2F1dG8nXG4iLCJkZXRlY3RzID0gcmVxdWlyZSgnLi9mZWF0dXJlX2RldGVjdHMnKVxuXG5leGVjdXRlZFRlc3RzID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSAobmFtZSkgLT5cbiAgaWYgKHJlc3VsdCA9IGV4ZWN1dGVkVGVzdHNbbmFtZV0pID09IHVuZGVmaW5lZFxuICAgIGV4ZWN1dGVkVGVzdHNbbmFtZV0gPSBCb29sZWFuKGRldGVjdHNbbmFtZV0oKSlcbiAgZWxzZVxuICAgIHJlc3VsdFxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgY29tcG9uZW50cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsIiMgUHJvcGVydHkgVmFsaWRhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFByb3BlcnR5VmFsaWRhdG9yXG4gIHRlcm1SZWdleCA9IC9cXHdbXFx3IF0qXFx3L2dcblxuICBjb25zdHJ1Y3RvcjogKHsgQGlucHV0U3RyaW5nLCBAcHJvcGVydHksIEBzY2hlbWFOYW1lLCBAcGFyZW50LCBAc2NoZW1lIH0pIC0+XG4gICAgQHZhbGlkYXRvcnMgPSBbXVxuICAgIEBsb2NhdGlvbiA9IEBnZXRMb2NhdGlvbigpXG4gICAgQHBhcmVudC5hZGRSZXF1aXJlZFByb3BlcnR5KEBwcm9wZXJ0eSkgaWYgQHBhcmVudD9cbiAgICBAYWRkVmFsaWRhdGlvbnMoQGlucHV0U3RyaW5nKVxuXG5cbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgaWYgbm90IEBwcm9wZXJ0eT9cbiAgICAgICcnXG4gICAgZWxzZSBpZiBAcGFyZW50P1xuICAgICAgQHBhcmVudC5sb2NhdGlvbiArIEBzY2hlbWUud3JpdGVQcm9wZXJ0eShAcHJvcGVydHkpXG4gICAgZWxzZVxuICAgICAgQHNjaGVtZS53cml0ZVByb3BlcnR5KEBwcm9wZXJ0eSlcblxuXG4gIGFkZFZhbGlkYXRpb25zOiAoY29uZmlnU3RyaW5nKSAtPlxuICAgIHdoaWxlIHJlc3VsdCA9IHRlcm1SZWdleC5leGVjKGNvbmZpZ1N0cmluZylcbiAgICAgIHRlcm0gPSByZXN1bHRbMF1cbiAgICAgIGlmIHRlcm0gPT0gJ29wdGlvbmFsJ1xuICAgICAgICBAaXNPcHRpb25hbCA9IHRydWVcbiAgICAgICAgQHBhcmVudC5yZW1vdmVSZXF1aXJlZFByb3BlcnR5KEBwcm9wZXJ0eSlcbiAgICAgIGVsc2UgaWYgdGVybS5pbmRleE9mKCdhcnJheSBvZiAnKSA9PSAwXG4gICAgICAgIEB2YWxpZGF0b3JzLnB1c2goJ2FycmF5JylcbiAgICAgICAgQGFycmF5VmFsaWRhdG9yID0gdGVybS5zbGljZSg5KVxuICAgICAgZWxzZSBpZiB0ZXJtLmluZGV4T2YoJyBvciAnKSAhPSAtMVxuICAgICAgICB0eXBlcyA9IHRlcm0uc3BsaXQoJyBvciAnKVxuICAgICAgICBjb25zb2xlLmxvZygndG9kbycpXG4gICAgICBlbHNlXG4gICAgICAgIEB2YWxpZGF0b3JzLnB1c2godGVybSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgdmFsaWRhdGU6ICh2YWx1ZSwgZXJyb3JzKSAtPlxuICAgIGlzVmFsaWQgPSB0cnVlXG4gICAgdmFsaWRhdG9ycyA9IEBzY2hlbWUudmFsaWRhdG9yc1xuICAgIGZvciBuYW1lIGluIEB2YWxpZGF0b3JzIHx8IFtdXG4gICAgICB2YWxpZGF0ZSA9IHZhbGlkYXRvcnNbbmFtZV1cbiAgICAgIHJldHVybiBlcnJvcnMuYWRkKFwibWlzc2luZyB2YWxpZGF0b3IgI3sgbmFtZSB9XCIsIGxvY2F0aW9uOiBAbG9jYXRpb24pIHVubGVzcyB2YWxpZGF0ZT9cblxuICAgICAgY29udGludWUgaWYgdmFsaWQgPSB2YWxpZGF0ZSh2YWx1ZSkgPT0gdHJ1ZVxuICAgICAgZXJyb3JzLmFkZCh2YWxpZCwgbG9jYXRpb246IEBsb2NhdGlvbiwgZGVmYXVsdE1lc3NhZ2U6IFwiI3sgbmFtZSB9IHZhbGlkYXRvciBmYWlsZWRcIilcbiAgICAgIGlzVmFsaWQgPSBmYWxzZVxuXG4gICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBpc1ZhbGlkID0gQHZhbGlkYXRlQXJyYXkodmFsdWUsIGVycm9ycylcbiAgICByZXR1cm4gZmFsc2UgaWYgbm90IGlzVmFsaWQgPSBAdmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXModmFsdWUsIGVycm9ycylcblxuICAgIGlzVmFsaWRcblxuXG4gIHZhbGlkYXRlQXJyYXk6IChhcnIsIGVycm9ycykgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgQGFycmF5VmFsaWRhdG9yP1xuICAgIGlzVmFsaWQgPSB0cnVlXG5cbiAgICB2YWxpZGF0ZSA9IEBzY2hlbWUudmFsaWRhdG9yc1tAYXJyYXlWYWxpZGF0b3JdXG4gICAgcmV0dXJuIGVycm9ycy5hZGQoXCJtaXNzaW5nIHZhbGlkYXRvciAjeyBAYXJyYXlWYWxpZGF0b3IgfVwiLCBsb2NhdGlvbjogQGxvY2F0aW9uKSB1bmxlc3MgdmFsaWRhdGU/XG5cbiAgICBmb3IgZW50cnksIGluZGV4IGluIGFyciB8fCBbXVxuICAgICAgcmVzID0gdmFsaWRhdGUoZW50cnkpXG4gICAgICBjb250aW51ZSBpZiByZXMgPT0gdHJ1ZVxuICAgICAgbG9jYXRpb24gPSBcIiN7IEBsb2NhdGlvbiB9WyN7IGluZGV4IH1dXCJcbiAgICAgIGVycm9ycy5hZGQocmVzLCBsb2NhdGlvbjogbG9jYXRpb24sIGRlZmF1bHRNZXNzYWdlOiBcIiN7IEBhcnJheVZhbGlkYXRvciB9IHZhbGlkYXRvciBmYWlsZWRcIilcbiAgICAgIGlzVmFsaWQgPSBmYWxzZVxuXG4gICAgaXNWYWxpZFxuXG5cbiAgdmFsaWRhdGVPdGhlclByb3BlcnR5OiAoa2V5LCB2YWx1ZSwgZXJyb3JzKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBAb3RoZXJQcm9wZXJ0eVZhbGlkYXRvcj9cbiAgICBAc2NoZW1lLmVycm9ycyA9IHVuZGVmaW5lZFxuICAgIHJldHVybiB0cnVlIGlmIGlzVmFsaWQgPSBAb3RoZXJQcm9wZXJ0eVZhbGlkYXRvci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpXG5cbiAgICBpZiBAc2NoZW1lLmVycm9ycz9cbiAgICAgIGVycm9ycy5qb2luKEBzY2hlbWUuZXJyb3JzLCBsb2NhdGlvbjogXCIjeyBAbG9jYXRpb24gfSN7IEBzY2hlbWUud3JpdGVQcm9wZXJ0eShrZXkpIH1cIilcbiAgICBlbHNlXG4gICAgICBlcnJvcnMuYWRkKFwiYWRkaXRpb25hbCBwcm9wZXJ0eSBjaGVjayBmYWlsZWRcIiwgbG9jYXRpb246IFwiI3sgQGxvY2F0aW9uIH0jeyBAc2NoZW1lLndyaXRlUHJvcGVydHkoa2V5KSB9XCIpXG5cbiAgICBmYWxzZVxuXG5cbiAgdmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXM6IChvYmosIGVycm9ycykgLT5cbiAgICBpc1ZhbGlkID0gdHJ1ZVxuICAgIGZvciBrZXksIGlzUmVxdWlyZWQgb2YgQHJlcXVpcmVkUHJvcGVydGllc1xuICAgICAgaWYgbm90IG9ialtrZXldPyAmJiBpc1JlcXVpcmVkXG4gICAgICAgIGVycm9ycy5hZGQoXCJyZXF1aXJlZCBwcm9wZXJ0eSBtaXNzaW5nXCIsIGxvY2F0aW9uOiBcIiN7IEBsb2NhdGlvbiB9I3sgQHNjaGVtZS53cml0ZVByb3BlcnR5KGtleSkgfVwiKVxuICAgICAgICBpc1ZhbGlkID0gZmFsc2VcblxuICAgIGlzVmFsaWRcblxuXG4gIGFkZFJlcXVpcmVkUHJvcGVydHk6IChrZXkpIC0+XG4gICAgQHJlcXVpcmVkUHJvcGVydGllcyA/PSB7fVxuICAgIEByZXF1aXJlZFByb3BlcnRpZXNba2V5XSA9IHRydWVcblxuXG4gIHJlbW92ZVJlcXVpcmVkUHJvcGVydHk6IChrZXkpIC0+XG4gICAgQHJlcXVpcmVkUHJvcGVydGllc1trZXldID0gdW5kZWZpbmVkXG5cbiIsIlZhbGlkYXRpb25FcnJvcnMgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25fZXJyb3JzJylcblByb3BlcnR5VmFsaWRhdG9yID0gcmVxdWlyZSgnLi9wcm9wZXJ0eV92YWxpZGF0b3InKVxudmFsaWRhdG9ycyA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpXG5cbiMgcHJvcGV5ZSwganNvbmppbW1teVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTY2hlbWVcbiAganNWYXJpYWJsZU5hbWUgPSAvXlthLXpBLVpdXFx3KiQvXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHZhbGlkYXRvcnMgPSBPYmplY3QuY3JlYXRlKHZhbGlkYXRvcnMpXG4gICAgQHNjaGVtYXMgPSB7fVxuXG5cbiAgYWRkOiAobmFtZSwgc2NoZW1hKSAtPlxuICAgIGlmICQudHlwZShzY2hlbWEpID09ICdmdW5jdGlvbidcbiAgICAgIEB2YWxpZGF0b3JzW25hbWVdID0gc2NoZW1hXG4gICAgZWxzZVxuICAgICAgQGFkZFNjaGVtYShuYW1lLCBAcGFyc2VDb25maWdPYmooc2NoZW1hLCB1bmRlZmluZWQsIG5hbWUpKVxuXG5cbiAgYWRkU2NoZW1hOiAobmFtZSwgc2NoZW1hKSAtPlxuICAgIGlmIEB2YWxpZGF0b3JzW25hbWVdP1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSB2YWxpZGF0b3IgaXMgYWxyZWR5IHJlZ2lzdGVyZWQgdW5kZXIgdGhpcyBuYW1lOiAjeyBuYW1lIH1cIilcblxuICAgIEBzY2hlbWFzW25hbWVdID0gc2NoZW1hXG4gICAgQHZhbGlkYXRvcnNbbmFtZV0gPSAodmFsdWUpID0+XG4gICAgICBlcnJvcnMgPSBAcmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hLCB2YWx1ZSlcbiAgICAgIHJldHVybiBpZiBlcnJvcnMuaGFzRXJyb3JzKCkgdGhlbiBlcnJvcnMgZWxzZSB0cnVlXG5cblxuICAjIEByZXR1cm5zIHsgQm9vbGVhbiB9IHJldHVybnMgaWYgdGhlIG9iamVjdCBpcyB2YWxpZCBvciBub3QuXG4gIHZhbGlkYXRlOiAoc2NoZW1hTmFtZSwgb2JqKSAtPlxuICAgIEBlcnJvcnMgPSB1bmRlZmluZWRcbiAgICBzY2hlbWEgPSBAc2NoZW1hc1tzY2hlbWFOYW1lXVxuICAgIHJldHVybiBbXCJtaXNzaW5nIHNjaGVtYSAjeyBzY2hlbWFOYW1lIH1cIl0gdW5sZXNzIHNjaGVtYT9cbiAgICBAZXJyb3JzID0gQHJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYSwgb2JqKS5zZXRSb290KHNjaGVtYU5hbWUpXG4gICAgcmV0dXJuIG5vdCBAZXJyb3JzLmhhc0Vycm9ycygpXG5cblxuICBoYXNFcnJvcnM6IC0+XG4gICAgQGVycm9ycz8uaGFzRXJyb3JzKClcblxuXG4gIGdldEVycm9yTWVzc2FnZXM6IC0+XG4gICAgQGVycm9ycz8uZ2V0TWVzc2FnZXMoKVxuXG5cbiAgIyBSZWN1cnNpdmUgdmFsaWRhdGVcbiAgIyBVc2VkIHRvIHRyYXZlbCB0aGUgaW5wdXQgb2JqZWN0IHJlY3Vyc2l2ZWx5LlxuICAjIEZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAgI1xuICAjIEByZXR1cm5zIHsgVmFsaWRhdGlvbkVycm9ycyBvYmogfSBBbiBvYmplY3Qgd2hpY2ggY29udGFpbnMgdmFsaWRhdGlvbiBlcnJvcnMuXG4gIHJlY3Vyc2l2ZVZhbGlkYXRlOiAoc2NoZW1hT2JqLCBvYmopIC0+XG4gICAgcGFyZW50VmFsaWRhdG9yID0gc2NoZW1hT2JqWydfX3ZhbGlkYXRvciddXG4gICAgZXJyb3JzID0gbmV3IFZhbGlkYXRpb25FcnJvcnMoKVxuICAgIHBhcmVudFZhbGlkYXRvci52YWxpZGF0ZShvYmosIGVycm9ycylcblxuICAgIGZvciBrZXksIHZhbHVlIG9mIG9ialxuICAgICAgaWYgc2NoZW1hT2JqW2tleV0/XG4gICAgICAgIHByb3BlcnR5VmFsaWRhdG9yID0gc2NoZW1hT2JqW2tleV1bJ19fdmFsaWRhdG9yJ11cbiAgICAgICAgaXNWYWxpZCA9IHByb3BlcnR5VmFsaWRhdG9yLnZhbGlkYXRlKHZhbHVlLCBlcnJvcnMpXG4gICAgICAgIGlmIGlzVmFsaWQgJiYgbm90IHByb3BlcnR5VmFsaWRhdG9yLmNoaWxkU2NoZW1hTmFtZT8gJiYgJC50eXBlKHZhbHVlKSA9PSAnb2JqZWN0J1xuICAgICAgICAgIGVycm9ycy5qb2luKEByZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWFPYmpba2V5XSwgdmFsdWUpKVxuICAgICAgZWxzZVxuICAgICAgICBwYXJlbnRWYWxpZGF0b3IudmFsaWRhdGVPdGhlclByb3BlcnR5KGtleSwgdmFsdWUsIGVycm9ycylcblxuICAgIGVycm9yc1xuXG5cbiAgcGFyc2VDb25maWdPYmo6IChvYmosIHBhcmVudFZhbGlkYXRvciwgc2NoZW1hTmFtZSkgLT5cbiAgICBwYXJlbnRWYWxpZGF0b3IgPz0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKGlucHV0U3RyaW5nOiAnb2JqZWN0Jywgc2NoZW1hTmFtZTogc2NoZW1hTmFtZSwgc2NoZW1lOiB0aGlzKVxuXG4gICAgZm9yIGtleSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb250aW51ZSBpZiBAYWRkUGFyZW50VmFsaWRhdG9yKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWx1ZSlcblxuICAgICAgdmFsdWVUeXBlID0gJC50eXBlKHZhbHVlKVxuICAgICAgaWYgdmFsdWVUeXBlID09ICdzdHJpbmcnXG4gICAgICAgIHByb3BWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3IoaW5wdXRTdHJpbmc6IHZhbHVlLCBwcm9wZXJ0eToga2V5LCBwYXJlbnQ6IHBhcmVudFZhbGlkYXRvciwgc2NoZW1lOiB0aGlzKVxuICAgICAgICBvYmpba2V5XSA9IHsgJ19fdmFsaWRhdG9yJzogcHJvcFZhbGlkYXRvciB9XG4gICAgICBlbHNlIGlmIHZhbHVlVHlwZSA9PSAnb2JqZWN0J1xuICAgICAgICBwcm9wVmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKGlucHV0U3RyaW5nOiAnb2JqZWN0JywgcHJvcGVydHk6IGtleSwgcGFyZW50OiBwYXJlbnRWYWxpZGF0b3IsIHNjaGVtZTogdGhpcylcbiAgICAgICAgb2JqW2tleV0gPSBAcGFyc2VDb25maWdPYmoodmFsdWUsIHByb3BWYWxpZGF0b3IpXG5cbiAgICBvYmpbJ19fdmFsaWRhdG9yJ10gPSBwYXJlbnRWYWxpZGF0b3JcbiAgICBvYmpcblxuXG4gIGFkZFBhcmVudFZhbGlkYXRvcjogKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWxpZGF0b3IpIC0+XG4gICAgc3dpdGNoIGtleVxuICAgICAgd2hlbiAnX192YWxpZGF0ZSdcbiAgICAgICAgcGFyZW50VmFsaWRhdG9yLmFkZFZhbGlkYXRpb25zKHZhbGlkYXRvcilcbiAgICAgIHdoZW4gJ19fYWRkaXRpb25hbFByb3BlcnR5J1xuICAgICAgICBpZiAkLnR5cGUodmFsaWRhdG9yKSA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgcGFyZW50VmFsaWRhdG9yLm90aGVyUHJvcGVydHlWYWxpZGF0b3IgPSB2YWxpZGF0b3JcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgd3JpdGVQcm9wZXJ0eTogKHZhbHVlKSAtPlxuICAgIGlmIGpzVmFyaWFibGVOYW1lLnRlc3QodmFsdWUpIHRoZW4gXCIuI3sgdmFsdWUgfVwiIGVsc2UgXCJbJyN7IHZhbHVlIH0nXVwiXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmFsaWRhdGlvbkVycm9yc1xuXG5cbiAgaGFzRXJyb3JzOiAtPlxuICAgIEBlcnJvcnM/XG5cblxuICBzZXRSb290OiAoQHJvb3QpIC0+XG4gICAgdGhpc1xuXG5cbiAgIyBBZGQgYW4gZXJyb3IgbWVzc2FnZVxuICBhZGQ6IChtZXNzYWdlLCB7IGxvY2F0aW9uLCBkZWZhdWx0TWVzc2FnZSB9PXt9ICkgLT5cbiAgICBtZXNzYWdlID0gZGVmYXVsdE1lc3NhZ2UgaWYgbWVzc2FnZSA9PSBmYWxzZVxuICAgIEBlcnJvcnMgPz0gW11cbiAgICBpZiAkLnR5cGUobWVzc2FnZSkgPT0gJ3N0cmluZydcbiAgICAgIEBlcnJvcnMucHVzaFxuICAgICAgICBwYXRoOiBsb2NhdGlvblxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgZWxzZSBpZiBtZXNzYWdlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yc1xuICAgICAgQGpvaW4obWVzc2FnZSwgbG9jYXRpb246IGxvY2F0aW9uKVxuICAgIGVsc2UgaWYgbWVzc2FnZS5wYXRoIGFuZCBtZXNzYWdlLm1lc3NhZ2VcbiAgICAgIGVycm9yID0gbWVzc2FnZVxuICAgICAgQGVycm9ycy5wdXNoXG4gICAgICAgIHBhdGg6IGxvY2F0aW9uICsgZXJyb3IucGF0aFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWxpZGF0aW9uRXJyb3IuYWRkKCkgdW5rbm93biBlcnJvciB0eXBlJylcblxuICAgIGZhbHNlXG5cblxuICAjIEFwcGVuZCB0aGUgZXJyb3JzIGZyb20gYW5vdGhlciBWYWxpZGF0aW9uRXJyb3JzIGluc3RhbmNlXG4gICMgQHBhcmFtIHsgVmFsaWRhdGlvbkVycm9ycyBpbnN0YW5jZSB9XG4gIGpvaW46ICh7IGVycm9ycyB9LCB7IGxvY2F0aW9uIH09e30pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlcnJvcnM/XG5cbiAgICBpZiBlcnJvcnMubGVuZ3RoXG4gICAgICBAZXJyb3JzID89IFtdXG4gICAgICBmb3IgZXJyb3IgaW4gZXJyb3JzXG4gICAgICAgIEBlcnJvcnMucHVzaFxuICAgICAgICAgIHBhdGg6IChsb2NhdGlvbiB8fCAnJykgKyBlcnJvci5wYXRoXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuXG5cbiAgZ2V0TWVzc2FnZXM6IC0+XG4gICAgbWVzc2FnZXMgPSBbXVxuICAgIGZvciBlcnJvciBpbiBAZXJyb3JzIHx8IFtdXG4gICAgICBtZXNzYWdlcy5wdXNoKFwiI3sgQHJvb3QgfHwgJycgfSN7IGVycm9yLnBhdGggfTogI3sgZXJyb3IubWVzc2FnZSB9XCIpXG5cbiAgICBtZXNzYWdlc1xuXG4iLCIjIEV4dGVuZCBWYWxpZGF0b3IgaW50ZXJmYWNlXG4jXG4jIEV4YW1wbGUgVmFsaWRhdG9yIE1ldGhvZDpcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBAcGFyYW0geyBvYmplY3QgfSBWYWx1ZSB0byB2YWxpZGF0ZS4gQ2FuIGJlIGFuIG9iamVjdCBvciBhIHByaW1pdGl2ZSBkYXRhIHR5cGUuXG4jIEByZXR1cm5zIHsgdHJ1ZSwgZmFsc2UsIFN0cmluZyBvciBWYWxpZGF0aW9uRXJyb3JzIGluc3RhbmNlIH1cbiMgICAtIHRydWU6IHZhbGlkXG4jICAgLSBmYWxzZTogaW52YWxpZCB3aXRoIHN0YW5kYXJkIGVycm9yIG1lc3NhZ2VcbiMgICAtIFN0cmluZzogaW52YWxpZCB3aXRoIG9uZSBzaW5nbGUgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiMgICAtIFZhbGlkYXRpb25FcnJvcnM6IGludmFsaWQgd2l0aCBtdWx0aXBsZSBjb21wbGV0ZSBlcnJvciBtZXNzYWdlc1xuI1xuIyAodmFsdWUpIC0+XG4jICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgPT0gJ3ZhbGlkJ1xuI1xubW9kdWxlLmV4cG9ydHMgPVxuICAnb2JqZWN0JzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdvYmplY3QnXG4gICdzdHJpbmcnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ3N0cmluZydcbiAgJ2Jvb2xlYW4nOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ2Jvb2xlYW4nXG4gICdudW1iZXInOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ251bWJlcidcbiAgJ2Z1bmN0aW9uJzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdmdW5jdGlvbidcbiAgJ2RhdGUnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ2RhdGUnXG4gICdyZWdleHAnOiAodmFsdWUpIC0+ICQudHlwZSh2YWx1ZSkgPT0gJ3JlZ2V4cCdcbiAgJ2FycmF5JzogKHZhbHVlKSAtPiAkLnR5cGUodmFsdWUpID09ICdhcnJheSdcbiAgJ2ZhbHN5JzogKHZhbHVlKSAtPiAhIXZhbHVlID09IGZhbHNlXG4gICd0cnV0aHknOiAodmFsdWUpIC0+ICEhdmFsdWUgPT0gdHJ1ZVxuICAnbm90IGVtcHR5JzogKHZhbHVlKSAtPiAhIXZhbHVlID09IHRydWVcbiAgJ2RlcHJlY2F0ZWQnOiAodmFsdWUpIC0+IHRydWVcblxuXG4jIHN1Z2dlc3Rpb25zOlxuIyBhY2NvbXBhbmllZCBieSBhZGRyZXNzIC0+IG1ha2VzIGFkZHJlc3Mgb3B0aW9uYWwgdW5sZXNzIHRoaXMgZmllbGQgaXMgc3BlY2lmaWVkXG4jIGRlcGVuZHMgb24gYWRkcmVzcyAtPiBzYW1lIGFzIGFib3ZlXG4jIHZhbHVlKHRydWUpIC0+IHRydWUgaWYgdmFsdWUgaXMgYm9vbGVhbiB0cnVlXG4jIHZhbHVlKCdhZGRyZXNzJykgLT4gdHJ1ZSBpZiB2YWx1ZSBpcyBzdHJpbmcgJ2FkZHJlc3MnXG4jIHZhbHVlKFswLCAxXSkgLT4gdHJ1ZSBpZiB2YWx1ZSBpcyBhbiBhcnJheSB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWVzXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3JkZXJlZEhhc2hcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAb2JqID0ge31cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgcHVzaDogKGtleSwgdmFsdWUpIC0+XG4gICAgQG9ialtrZXldID0gdmFsdWVcbiAgICBAW0BsZW5ndGhdID0gdmFsdWVcbiAgICBAbGVuZ3RoICs9IDFcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAb2JqW2tleV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdmFsdWUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2sodmFsdWUpXG5cblxuICB0b0FycmF5OiAtPlxuICAgIHZhbHVlIGZvciB2YWx1ZSBpbiB0aGlzXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBjYW1lbGl6ZTogKHN0cikgLT5cbiAgIyAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICMgICAgIGMudG9VcHBlckNhc2UoKVxuXG4gICMgY2xhc3NpZnk6IChzdHIpIC0+XG4gICMgICAkLnRpdGxlaXplKFN0cmluZyhzdHIpLnJlcGxhY2UoL1tcXFdfXS9nLCAnICcpKS5yZXBsYWNlKC9cXHMvZywgJycpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEAkZWxlbSA9IEAkaHRtbFxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdjb21wb25lbnRWaWV3JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNzcy5jb21wb25lbnQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50KVxuXG4gICAgaWYgbm90IEBoYXNGb2N1cygpXG4gICAgICBAZGlzcGxheU9wdGlvbmFscygpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICB1cGRhdGVIdG1sOiAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBAbW9kZWwuc3R5bGVzXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICBkaXNwbGF5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICAkZWxlbSA9ICQoZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIGlmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICcnKVxuXG5cbiAgIyBTaG93IGFsbCBkb2Mtb3B0aW9uYWxzIHdoZXRoZXIgdGhleSBhcmUgZW1wdHkgb3Igbm90LlxuICAjIFVzZSBvbiBmb2N1cy5cbiAgc2hvd09wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLnNob3coJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICAjIEhpZGUgYWxsIGVtcHR5IGRvYy1vcHRpb25hbHNcbiAgIyBVc2Ugb24gYmx1ci5cbiAgaGlkZUVtcHR5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbCAmJiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLmhpZGUoJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICBuZXh0OiAtPlxuICAgIEAkaHRtbC5uZXh0KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBwcmV2OiAtPlxuICAgIEAkaHRtbC5wcmV2KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBhZnRlckZvY3VzZWQ6ICgpIC0+XG4gICAgQCRodG1sLmFkZENsYXNzKGNzcy5jb21wb25lbnRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3MuY29tcG9uZW50SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLmNvbXBvbmVudEhpZ2hsaWdodClcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAJGh0bWxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAJGh0bWxbMF0pXG5cblxuICBjb250ZW50OiAoY29udGVudCkgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgY29udGVudFxuICAgICAgZGlyZWN0aXZlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgICBpZiBkaXJlY3RpdmUuaXNJbWFnZVxuICAgICAgICBpZiBkaXJlY3RpdmUuYmFzZTY0SW1hZ2U/XG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuYmFzZTY0SW1hZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc2V0KG5hbWUsIGRpcmVjdGl2ZS5nZXRJbWFnZVVybCgpIClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIGlmIEBoYXNGb2N1cygpXG5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0udG9nZ2xlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIsIEJvb2xlYW4odmFsdWUpKVxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcblxuICAgICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLmdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0sIG5hbWUpXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKSAjIHRvZG86IHJlcGxhY2Ugd2l0aCBAYWZ0ZXJJbnNlcnRlZCAtPiAuLi4gKHNvbWV0aGluZyBsaWtlICQuQ2FsbGJhY2tzKCdvbmNlIHJlbWVtYmVyJykpXG5cblxuICBzZXRQbGFjZWhvbGRlckltYWdlOiAoJGVsZW0sIG5hbWUpIC0+XG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGlmICRlbGVtWzBdLm5vZGVOYW1lID09ICdJTUcnXG4gICAgICB3aWR0aCA9ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGggPSAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICB2YWx1ZSA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8je3dpZHRofXgje2hlaWdodH0vQkVGNTZGL0IyRTY2OFwiXG5cbiAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgY2xhc3NOYW1lKSAtPlxuICAgIGNoYW5nZXMgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdLmNzc0NsYXNzQ2hhbmdlcyhjbGFzc05hbWUpXG4gICAgaWYgY2hhbmdlcy5yZW1vdmVcbiAgICAgIGZvciByZW1vdmVDbGFzcyBpbiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgICBAJGh0bWwucmVtb3ZlQ2xhc3MocmVtb3ZlQ2xhc3MpXG5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY2hhbmdlcy5hZGQpXG5cblxuICAjIERpc2FibGUgdGFiYmluZyBmb3IgdGhlIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQuXG4gICMgVGhpcyBpcyB1c2VkIGZvciBodG1sIGNvbnRlbnQgc28gaXQgZG9lcyBub3QgZGlzcnVwdCB0aGUgdXNlclxuICAjIGV4cGVyaWVuY2UuIFRoZSB0aW1lb3V0IGlzIHVzZWQgZm9yIGNhc2VzIGxpa2UgdHdlZXRzIHdoZXJlIHRoZVxuICAjIGlmcmFtZSBpcyBnZW5lcmF0ZWQgYnkgYSBzY3JpcHQgd2l0aCBhIGRlbGF5LlxuICBkaXNhYmxlVGFiYmluZzogKCRlbGVtKSAtPlxuICAgIHNldFRpbWVvdXQoID0+XG4gICAgICAkZWxlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgLCA0MDApXG5cblxuICAjIEFwcGVuZCBhIGNoaWxkIHRvIHRoZSBlbGVtZW50IHdoaWNoIHdpbGwgYmxvY2sgdXNlciBpbnRlcmFjdGlvblxuICAjIGxpa2UgY2xpY2sgb3IgdG91Y2ggZXZlbnRzLiBBbHNvIHRyeSB0byBwcmV2ZW50IHRoZSB1c2VyIGZyb20gZ2V0dGluZ1xuICAjIGZvY3VzIG9uIGEgY2hpbGQgZWxlbW50IHRocm91Z2ggdGFiYmluZy5cbiAgYmxvY2tJbnRlcmFjdGlvbjogKCRlbGVtKSAtPlxuICAgIEBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uKCRlbGVtKVxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5pbnRlcmFjdGlvbkJsb2NrZXIgfSc+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICAkZWxlbS5hcHBlbmQoJGJsb2NrZXIpXG5cbiAgICBAZGlzYWJsZVRhYmJpbmcoJGVsZW0pXG5cblxuICAjIE1ha2Ugc3VyZSB0aGF0IGFsbCBhYnNvbHV0ZSBwb3NpdGlvbmVkIGNoaWxkcmVuIGFyZSBwb3NpdGlvbmVkXG4gICMgcmVsYXRpdmUgdG8gJGVsZW0uXG4gIGVuc3VyZVJlbGF0aXZlUG9zaXRpb246ICgkZWxlbSkgLT5cbiAgICBwb3NpdGlvbiA9ICRlbGVtLmNzcygncG9zaXRpb24nKVxuICAgIGlmIHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ2ZpeGVkJyAmJiBwb3NpdGlvbiAhPSAncmVsYXRpdmUnXG4gICAgICAkZWxlbS5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJylcblxuXG4gIGdldCRjb250YWluZXI6IC0+XG4gICAgJChkb20uZmluZENvbnRhaW5lcihAJGh0bWxbMF0pLm5vZGUpXG5cblxuICAjIFdhaXQgdG8gZXhlY3V0ZSBhIG1ldGhvZCB1bnRpbCB0aGUgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgRE9NXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH1cbiAgIyAtIGNvbXBvbmVudFRyZWUgeyBDb21wb25lbnRUcmVlIH1cbiAgIyAtIHJlbmRlcmluZ0NvbnRhaW5lciB7IFJlbmRlcmluZ0NvbnRhaW5lciB9XG4gICMgLSAkd3JhcHBlciB7IGpRdWVyeSBvYmplY3QgfSBBIHdyYXBwZXIgd2l0aCBhIG5vZGUgd2l0aCBhICdkb2Mtc2VjdGlvbicgY3NzIGNsYXNzIHdoZXJlIHRvIGluc2VydCB0aGUgY29udGVudC5cbiAgIyAtIGV4Y2x1ZGVDb21wb25lbnRzIHsgU3RyaW5nIG9yIEFycmF5IH0gY29tcG9uZW50TW9kZWwuaWQgb3IgYW4gYXJyYXkgb2Ygc3VjaC5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciwgZXhjbHVkZUNvbXBvbmVudHMgfSkgLT5cbiAgICBhc3NlcnQgQGNvbXBvbmVudFRyZWUsICdubyBjb21wb25lbnRUcmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQGNvbXBvbmVudFZpZXdzID0ge31cblxuICAgIEBleGNsdWRlZENvbXBvbmVudElkcyA9IHt9XG4gICAgQGV4Y2x1ZGVDb21wb25lbnQoZXhjbHVkZUNvbXBvbmVudHMpXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSB9IGNvbXBvbmVudE1vZGVsLmlkIG9yIGFuIGFycmF5IG9mIHN1Y2guXG4gIGV4Y2x1ZGVDb21wb25lbnQ6IChjb21wb25lbnRJZCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudElkP1xuICAgIGlmICQuaXNBcnJheShjb21wb25lbnRJZClcbiAgICAgIGZvciBjb21wSWQgaW4gY29tcG9uZW50SWRcbiAgICAgICAgQGV4Y2x1ZGVDb21wb25lbnQoY29tcElkKVxuICAgIGVsc2VcbiAgICAgIEBleGNsdWRlZENvbXBvbmVudElkc1tjb21wb25lbnRJZF0gPSB0cnVlXG4gICAgICB2aWV3ID0gQGNvbXBvbmVudFZpZXdzW2NvbXBvbmVudElkXVxuICAgICAgaWYgdmlldz8gYW5kIHZpZXcuaXNBdHRhY2hlZFRvRG9tXG4gICAgICAgIEByZW1vdmVDb21wb25lbnQodmlldy5tb2RlbClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBjb21wb25lbnRUcmVlXG4gICAgQCRyb290LmRhdGEoJ2NvbXBvbmVudFRyZWUnLCBAY29tcG9uZW50VHJlZSlcblxuXG4gIHJlbmRlck9uY2VQYWdlUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmluY3JlbWVudCgpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5yZWFkeSA9PlxuICAgICAgQHNldFJvb3QoKVxuICAgICAgQHJlbmRlcigpXG4gICAgICBAc2V0dXBDb21wb25lbnRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBDb21wb25lbnRUcmVlIEV2ZW50IEhhbmRsaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwQ29tcG9uZW50VHJlZUxpc3RlbmVyczogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRBZGRlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudEFkZGVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50UmVtb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudFJlbW92ZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRNb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudE1vdmVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAY29tcG9uZW50SHRtbENoYW5nZWQsIHRoaXMpIClcblxuXG4gIGNvbXBvbmVudEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNvbXBvbmVudFJlbW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRDb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY29tcG9uZW50TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBpbnNlcnRDb21wb25lbnQobW9kZWwpXG5cblxuICBjb21wb25lbnRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS51cGRhdGVDb250ZW50KClcblxuXG4gIGNvbXBvbmVudEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnVwZGF0ZUh0bWwoKVxuXG5cbiAgIyBSZW5kZXJpbmdcbiAgIyAtLS0tLS0tLS1cblxuXG4gIGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld3NbbW9kZWwuaWRdIHx8PSBtb2RlbC5jcmVhdGVWaWV3KEByZW5kZXJpbmdDb250YWluZXIuaXNSZWFkT25seSlcblxuXG4gIGRlbGV0ZUNhY2hlZENvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQGNvbXBvbmVudFZpZXdzW21vZGVsLmlkXVxuXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICByZXR1cm4gaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwpIHx8IEBleGNsdWRlZENvbXBvbmVudElkc1ttb2RlbC5pZF0gPT0gdHJ1ZVxuXG4gICAgaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc0NvbXBvbmVudEF0dGFjaGVkKG1vZGVsLm5leHQpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdDb21wb25lbnQgY291bGQgbm90IGJlIGluc2VydGVkIGJ5IHJlbmRlcmVyLicpXG5cbiAgICBjb21wb25lbnRWaWV3ID0gQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpXG4gICAgY29tcG9uZW50Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5jb21wb25lbnRWaWV3V2FzSW5zZXJ0ZWQoY29tcG9uZW50VmlldylcbiAgICBAYXR0YWNoQ2hpbGRDb21wb25lbnRzKG1vZGVsKVxuXG5cbiAgaXNDb21wb25lbnRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkQ29tcG9uZW50czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc0NvbXBvbmVudEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRDb21wb25lbnQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydENvbXBvbmVudEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JDb21wb25lbnQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpKVxuXG5cbiAgYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChjb250YWluZXIucGFyZW50Q29tcG9uZW50KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yQ29tcG9uZW50KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBjb21wb25lbnRUcmVlLCBAcGFyZW50KSAtPlxuICAgIEBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBAaXNJbnRlcmFjdGl2ZSA9IGZhbHNlXG5cblxuICAjIEF2YWlsYWJsZSBPcHRpb25zOlxuICAjIFJlYWRPbmx5IHZpZXc6IChkZWZhdWx0IGlmIG5vdGhpbmcgaXMgc3BlY2lmaWVkKVxuICAjIGNyZWF0ZShyZWFkT25seTogdHJ1ZSlcbiAgI1xuICAjIEluZXJhY3RpdmUgdmlldzpcbiAgIyBjcmVhdGUoaW50ZXJhY3RpdmU6IHRydWUpXG4gICNcbiAgIyBXcmFwcGVyOiAoRE9NIG5vZGUgdGhhdCBoYXMgdG8gY29udGFpbiBhIG5vZGUgd2l0aCBjbGFzcyAnLmRvYy1zZWN0aW9uJylcbiAgIyBjcmVhdGUoICR3cmFwcGVyOiAkKCc8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPicpIClcbiAgY3JlYXRlOiAob3B0aW9ucykgLT5cbiAgICBAY3JlYXRlSUZyYW1lKEBwYXJlbnQpLnRoZW4gKGlmcmFtZSwgcmVuZGVyTm9kZSkgPT5cbiAgICAgIEBpZnJhbWUgPSBpZnJhbWVcbiAgICAgIHJlbmRlcmVyID0gQGNyZWF0ZUlGcmFtZVJlbmRlcmVyKGlmcmFtZSwgb3B0aW9ucylcbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBAY3JlYXRlUmVuZGVyZXJcbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgb3B0aW9uczogb3B0aW9uc1xuXG5cbiAgY3JlYXRlUmVuZGVyZXI6ICh7IHJlbmRlck5vZGUsIG9wdGlvbnMgfT17fSkgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSB8fCBAcGFyZW50XG4gICAgICBkZXNpZ246IEBjb21wb25lbnRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG5cbiAgICBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIGNvbXBvbmVudFRyZWU6IEBjb21wb25lbnRUcmVlXG4gICAgICAkd3JhcHBlcjogb3B0aW9ucy4kd3JhcHBlclxuXG5cbiAgY3JlYXRlUGFnZTogKHBhcmFtcywgeyBpbnRlcmFjdGl2ZSwgcmVhZE9ubHksIGxvYWRSZXNvdXJjZXMgfT17fSkgLT5cbiAgICBwYXJhbXMgPz0ge31cbiAgICBwYXJhbXMubG9hZFJlc291cmNlcyA9IGxvYWRSZXNvdXJjZXNcbiAgICBpZiBpbnRlcmFjdGl2ZT9cbiAgICAgIEBpc0ludGVyYWN0aXZlID0gdHJ1ZVxuICAgICAgbmV3IEludGVyYWN0aXZlUGFnZShwYXJhbXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFBhZ2UocGFyYW1zKVxuXG4iLCJTZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTG9hZGVyXG5cbiAgY29uc3RydWN0b3I6IChAd2luZG93KSAtPlxuICAgIEBsb2FkZWRVcmxzID0gW11cblxuXG4gIGxvYWQ6ICh1cmxzLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzRGlzYWJsZWRcblxuICAgIHVybHMgPSBbdXJsc10gdW5sZXNzICQuaXNBcnJheSh1cmxzKVxuICAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiAgICBAbG9hZFNpbmdsZVVybCh1cmwsIHNlbWFwaG9yZS53YWl0KCkpIGZvciB1cmwgaW4gdXJsc1xuICAgIHNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBkaXNhYmxlOiAtPlxuICAgIEBpc0Rpc2FibGVkID0gdHJ1ZVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjaz0kLm5vb3ApIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzRGlzYWJsZWRcblxuICAgIGlmIEBpc1VybExvYWRlZCh1cmwpXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgbGluayA9ICQoJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiAvPicpWzBdXG4gICAgICBsaW5rLm9ubG9hZCA9IGNhbGxiYWNrXG5cbiAgICAgICMgRG8gbm90IHByZXZlbnQgdGhlIHBhZ2UgZnJvbSBsb2FkaW5nIGJlY2F1c2Ugb2YgY3NzIGVycm9yc1xuICAgICAgIyBvbmVycm9yIGlzIG5vdCBzdXBwb3J0ZWQgYnkgZXZlcnkgYnJvd3Nlci5cbiAgICAgICMgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2xpbmtcbiAgICAgIGxpbmsub25lcnJvciA9IC0+XG4gICAgICAgIGNvbnNvbGUud2FybiBcIlN0eWxlc2hlZXQgY291bGQgbm90IGJlIGxvYWRlZDogI3sgdXJsIH1cIlxuICAgICAgICBjYWxsYmFjaygpXG5cbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgQHdpbmRvdy5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBAbWFya1VybEFzTG9hZGVkKHVybClcblxuXG4gICMgQHByaXZhdGVcbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgQHByaXZhdGVcbiAgbWFya1VybEFzTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuQ29tcG9uZW50RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0b3JQYWdlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHNldFdpbmRvdygpXG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG5cbiAgICAjIFN0dWJzXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9XG4gICAgICBkaXNhYmxlQWxsOiAtPlxuICAgICAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGNvbXBvbmVudFdhc0Ryb3BwZWQgPVxuICAgICAgZmlyZTogLT5cbiAgICBAYmx1ckZvY3VzZWRFbGVtZW50ID0gLT5cblxuXG4gIHN0YXJ0RHJhZzogKHsgY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudE1vZGVsIHx8IGNvbXBvbmVudFZpZXdcbiAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudFZpZXcubW9kZWwgaWYgY29tcG9uZW50Vmlld1xuXG4gICAgY29tcG9uZW50RHJhZyA9IG5ldyBDb21wb25lbnREcmFnXG4gICAgICBjb21wb25lbnRNb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChjb21wb25lbnREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgc2V0V2luZG93OiAtPlxuICAgIEB3aW5kb3cgPSB3aW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuQ29tcG9uZW50RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnJylcblxuIyBBbiBJbnRlcmFjdGl2ZVBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFsbG93cyBmb3IgbWFuaXB1bGF0aW9uIG9mIHRoZVxuIyByZW5kZXJlZCBDb21wb25lbnRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGh0bWxFbGVtZW50Q2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGNvbXBvbmVudFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRXYXNEcm9wcGVkID0gJC5DYWxsYmFja3MoKSAjIChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuY29tcG9uZW50Rm9jdXMuYWRkKCAkLnByb3h5KEBhZnRlckNvbXBvbmVudEZvY3VzZWQsIHRoaXMpIClcbiAgICBAZm9jdXMuY29tcG9uZW50Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyQ29tcG9uZW50Qmx1cnJlZCwgdGhpcykgKVxuICAgIEBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeSgpXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlXG4gICAgICBAY3NzTG9hZGVyLmxvYWQoY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG5cbiAgICAjIElnbm9yZSBpbnRlcmFjdGlvbnMgb24gY2VydGFpbiBlbGVtZW50c1xuICAgIGlzQ29udHJvbCA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KGNvbmZpZy5pZ25vcmVJbnRlcmFjdGlvbikubGVuZ3RoXG4gICAgcmV0dXJuIGlmIGlzQ29udHJvbFxuXG4gICAgIyBJZGVudGlmeSB0aGUgY2xpY2tlZCBjb21wb25lbnRcbiAgICBjb21wb25lbnRWaWV3ID0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGV2ZW50LnRhcmdldClcblxuICAgICMgVGhpcyBpcyBjYWxsZWQgaW4gbW91c2Vkb3duIHNpbmNlIGVkaXRhYmxlcyBnZXQgZm9jdXMgb24gbW91c2Vkb3duXG4gICAgIyBhbmQgb25seSBiZWZvcmUgdGhlIGVkaXRhYmxlcyBjbGVhciB0aGVpciBwbGFjZWhvbGRlciBjYW4gd2Ugc2FmZWx5XG4gICAgIyBpZGVudGlmeSB3aGVyZSB0aGUgdXNlciBoYXMgY2xpY2tlZC5cbiAgICBAaGFuZGxlQ2xpY2tlZENvbXBvbmVudChldmVudCwgY29tcG9uZW50VmlldylcblxuICAgIGlmIGNvbXBvbmVudFZpZXdcbiAgICAgIEBzdGFydERyYWdcbiAgICAgICAgY29tcG9uZW50VmlldzogY29tcG9uZW50Vmlld1xuICAgICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudE1vZGVsIHx8IGNvbXBvbmVudFZpZXdcbiAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudFZpZXcubW9kZWwgaWYgY29tcG9uZW50Vmlld1xuXG4gICAgY29tcG9uZW50RHJhZyA9IG5ldyBDb21wb25lbnREcmFnXG4gICAgICBjb21wb25lbnRNb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChjb21wb25lbnREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgY2FuY2VsRHJhZzogLT5cbiAgICBAZHJhZ0Jhc2UuY2FuY2VsKClcblxuXG4gIGhhbmRsZUNsaWNrZWRDb21wb25lbnQ6IChldmVudCwgY29tcG9uZW50VmlldykgLT5cbiAgICBpZiBjb21wb25lbnRWaWV3XG4gICAgICBAZm9jdXMuY29tcG9uZW50Rm9jdXNlZChjb21wb25lbnRWaWV3KVxuXG4gICAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoY29tcG9uZW50Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBodG1sRWxlbWVudENsaWNrLmZpcmUoY29tcG9uZW50Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIHdpbmRvdy5kb2N1bWVudC5hY3RpdmVFbGVtZW50XG5cblxuICBibHVyRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQGZvY3VzLnNldEZvY3VzKHVuZGVmaW5lZClcbiAgICBmb2N1c2VkRWxlbWVudCA9IEBnZXRGb2N1c2VkRWxlbWVudCgpXG4gICAgJChmb2N1c2VkRWxlbWVudCkuYmx1cigpIGlmIGZvY3VzZWRFbGVtZW50XG5cblxuICBjb21wb25lbnRWaWV3V2FzSW5zZXJ0ZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIEBpbml0aWFsaXplRWRpdGFibGVzKGNvbXBvbmVudFZpZXcpXG5cblxuICBpbml0aWFsaXplRWRpdGFibGVzOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBpZiBjb21wb25lbnRWaWV3LmRpcmVjdGl2ZXMuZWRpdGFibGVcbiAgICAgIGVkaXRhYmxlTm9kZXMgPSBmb3IgZGlyZWN0aXZlIGluIGNvbXBvbmVudFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgICBkaXJlY3RpdmUuZWxlbVxuXG4gICAgICBAZWRpdGFibGVDb250cm9sbGVyLmFkZChlZGl0YWJsZU5vZGVzKVxuXG5cbiAgYWZ0ZXJDb21wb25lbnRGb2N1c2VkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBjb21wb25lbnRWaWV3LmFmdGVyRm9jdXNlZCgpXG5cblxuICBhZnRlckNvbXBvbmVudEJsdXJyZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGNvbXBvbmVudFZpZXcuYWZ0ZXJCbHVycmVkKClcbiIsIlJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIEEgUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFJlbmRlcmluZ0NvbnRhaW5lciB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSBzaG93biB0b1xuIyB0aGUgdXNlci4gSXQgaGFzIGEgTG9hZGVyIHdoaWNoIGFsbG93cyB5b3UgdG8gaW5qZWN0IENTUyBhbmQgSlMgZmlsZXMgaW50byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGFnZSBleHRlbmRzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCByZWFkT25seSwgaG9zdFdpbmRvdywgQGRlc2lnbiwgQGNvbXBvbmVudFRyZWUsIEBsb2FkUmVzb3VyY2VzIH09e30pIC0+XG4gICAgQGlzUmVhZE9ubHkgPSByZWFkT25seSBpZiByZWFkT25seT9cbiAgICBAcmVuZGVyTm9kZSA9IGlmIHJlbmRlck5vZGU/LmpxdWVyeSB0aGVuIHJlbmRlck5vZGVbMF0gZWxzZSByZW5kZXJOb2RlXG4gICAgQHNldFdpbmRvdyhob3N0V2luZG93KVxuICAgIEByZW5kZXJOb2RlID89ICQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIiwgQCRib2R5KVxuXG4gICAgc3VwZXIoKVxuXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAY3NzTG9hZGVyLmRpc2FibGUoKSBpZiBub3QgQHNob3VsZExvYWRSZXNvdXJjZXMoKVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBzaG91bGRMb2FkUmVzb3VyY2VzOiAtPlxuICAgIGlmIEBsb2FkUmVzb3VyY2VzP1xuICAgICAgQm9vbGVhbihAbG9hZFJlc291cmNlcylcbiAgICBlbHNlXG4gICAgICBCb29sZWFuKGNvbmZpZy5sb2FkUmVzb3VyY2VzKVxuXG5cbiAgIyB0b2RvOiBtb3ZlIHBhdGggcmVzb2x1dGlvbnMgdG8gZGVzaWduLmFzc2V0c1xuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAZGVzaWduXG4gICAgQGRlc2lnbi5hc3NldHMubG9hZENzcyhAY3NzTG9hZGVyLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgc2V0V2luZG93OiAoaG9zdFdpbmRvdykgLT5cbiAgICBob3N0V2luZG93ID89IEBnZXRQYXJlbnRXaW5kb3coQHJlbmRlck5vZGUpXG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuICBnZXRQYXJlbnRXaW5kb3c6IChlbGVtKSAtPlxuICAgIGlmIGVsZW0/XG4gICAgICBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICBlbHNlXG4gICAgICB3aW5kb3dcblxuIiwiU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIENvbXBvbmVudFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID89ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIGNvbXBvbmVudFZpZXdXYXNJbnNlcnRlZDogKGNvbXBvbmVudFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSB9KSAtPlxuICAgIEBuYW1lID0gbmFtZSB8fCBjb25maWcuZGlyZWN0aXZlc1tAdHlwZV0uZGVmYXVsdE5hbWVcbiAgICBAY29uZmlnID0gY29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBSZXR1cm4gdGhlIG5vZGVOYW1lIGluIGxvd2VyIGNhc2VcbiAgZ2V0VGFnTmFtZTogLT5cbiAgICBAZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIEZvciBldmVyeSBuZXcgQ29tcG9uZW50VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkIGZyb20gdGhlXG4gICMgdGVtcGxhdGUgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlld1xuICBjbG9uZTogLT5cbiAgICBuZXdEaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlKG5hbWU6IEBuYW1lLCB0eXBlOiBAdHlwZSlcbiAgICBuZXdEaXJlY3RpdmUub3B0aW9uYWwgPSBAb3B0aW9uYWxcbiAgICBuZXdEaXJlY3RpdmVcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAZWxlbSlcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbiMgQSBsaXN0IG9mIGFsbCBkaXJlY3RpdmVzIG9mIGEgdGVtcGxhdGVcbiMgRXZlcnkgbm9kZSB3aXRoIGFuIGRvYy0gYXR0cmlidXRlIHdpbGwgYmUgc3RvcmVkIGJ5IGl0cyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUNvbGxlY3Rpb25cblxuICBjb25zdHJ1Y3RvcjogKEBhbGw9e30pIC0+XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIGFkZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBAYXNzZXJ0TmFtZU5vdFVzZWQoZGlyZWN0aXZlKVxuXG4gICAgIyBjcmVhdGUgcHNldWRvIGFycmF5XG4gICAgdGhpc1tAbGVuZ3RoXSA9IGRpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZS5pbmRleCA9IEBsZW5ndGhcbiAgICBAbGVuZ3RoICs9IDFcblxuICAgICMgaW5kZXggYnkgbmFtZVxuICAgIEBhbGxbZGlyZWN0aXZlLm5hbWVdID0gZGlyZWN0aXZlXG5cbiAgICAjIGluZGV4IGJ5IHR5cGVcbiAgICAjIGRpcmVjdGl2ZS50eXBlIGlzIG9uZSBvZiB0aG9zZSAnY29udGFpbmVyJywgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0gfHw9IFtdXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0ucHVzaChkaXJlY3RpdmUpXG4gICAgZGlyZWN0aXZlXG5cblxuICBuZXh0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgbmFtZXM6ICh0eXBlKSAtPlxuICAgIHJldHVybiBbXSB1bmxlc3MgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICBkaXJlY3RpdmUubmFtZVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaE9mVHlwZTogKHR5cGUsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHRoaXNbdHlwZV1cbiAgICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBlYWNoRWRpdGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnZWRpdGFibGUnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hJbWFnZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdpbWFnZScsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdjb250YWluZXInLCBjYWxsYmFjaylcblxuXG4gIGVhY2hIdG1sOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2h0bWwnLCBjYWxsYmFjaylcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgIyB0b2RvOiByZW5hbWUgb3IgYmV0dGVyIHJlbW92ZVxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpcmVjdGl2ZUZpbmRlciA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIGxpbms6IChlbGVtLCBkaXJlY3RpdmVDb2xsZWN0aW9uKSAtPlxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbGxlY3Rpb24uZ2V0KGF0dHIudmFsdWUpXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtID0gZWxlbVxuXG4gICAgdW5kZWZpbmVkXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3IgY29tcG9uZW50IHRlbXBsYXRlc1xuIyBzbyBpdCBkb2VzIG5vdCB0cmF2ZXJzZSBpbnRvIGNvbnRhaW5lcnMuXG4jXG4jIFVzZSB0byB0cmF2ZXJzZSBhbGwgbm9kZXMgb2YgYSB0ZW1wbGF0ZS4gVGhlIGl0ZXJhdG9yIGRvZXMgbm90IGdvIGludG9cbiMgY29udGFpbmVycyBhbmQgaXMgc2FmZSB0byB1c2UgZXZlbiBpZiB0aGVyZSBpcyBjb250ZW50IGluIHRoZXNlIGNvbnRhaW5lcnMuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUl0ZXJhdG9yXG5cbiAgY29uc3RydWN0b3I6IChyb290KSAtPlxuICAgIEByb290ID0gQF9uZXh0ID0gcm9vdFxuICAgIEBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG5cbiAgY3VycmVudDogbnVsbFxuXG5cbiAgaGFzTmV4dDogLT5cbiAgICAhIUBfbmV4dFxuXG5cbiAgbmV4dDogKCkgLT5cbiAgICBuID0gQGN1cnJlbnQgPSBAX25leHRcbiAgICBjaGlsZCA9IG5leHQgPSB1bmRlZmluZWRcbiAgICBpZiBAY3VycmVudFxuICAgICAgY2hpbGQgPSBuLmZpcnN0Q2hpbGRcbiAgICAgIGlmIGNoaWxkICYmIG4ubm9kZVR5cGUgPT0gMSAmJiAhbi5oYXNBdHRyaWJ1dGUoQGNvbnRhaW5lckF0dHIpXG4gICAgICAgIEBfbmV4dCA9IGNoaWxkXG4gICAgICBlbHNlXG4gICAgICAgIG5leHQgPSBudWxsXG4gICAgICAgIHdoaWxlIChuICE9IEByb290KSAmJiAhKG5leHQgPSBuLm5leHRTaWJsaW5nKVxuICAgICAgICAgIG4gPSBuLnBhcmVudE5vZGVcblxuICAgICAgICBAX25leHQgPSBuZXh0XG5cbiAgICBAY3VycmVudFxuXG5cbiAgIyBvbmx5IGl0ZXJhdGUgb3ZlciBlbGVtZW50IG5vZGVzIChOb2RlLkVMRU1FTlRfTk9ERSA9PSAxKVxuICBuZXh0RWxlbWVudDogKCkgLT5cbiAgICB3aGlsZSBAbmV4dCgpXG4gICAgICBicmVhayBpZiBAY3VycmVudC5ub2RlVHlwZSA9PSAxXG5cbiAgICBAY3VycmVudFxuXG5cbiAgZGV0YWNoOiAoKSAtPlxuICAgIEBjdXJyZW50ID0gQF9uZXh0ID0gQHJvb3QgPSBudWxsXG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2l0ZXJhdG9yJylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcbmRpcmVjdGl2ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29tcGlsZXInKVxuZGlyZWN0aXZlRmluZGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfZmluZGVyJylcblxuQ29tcG9uZW50TW9kZWwgPSByZXF1aXJlKCcuLi9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfbW9kZWwnKVxuQ29tcG9uZW50VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9jb21wb25lbnRfdmlldycpXG5cbnNvcnRCeU5hbWUgPSAoYSwgYikgLT5cbiAgaWYgKGEubmFtZSA+IGIubmFtZSlcbiAgICAxXG4gIGVsc2UgaWYgKGEubmFtZSA8IGIubmFtZSlcbiAgICAtMVxuICBlbHNlXG4gICAgMFxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBjb21wb25lbnQgdGVtcGxhdGVzIGFuZCBjcmVhdGVzIENvbXBvbmVudE1vZGVscyBhbmQgQ29tcG9uZW50Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIGh0bWwsIGxhYmVsLCBwcm9wZXJ0aWVzIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgaHRtbCwgJ1RlbXBsYXRlOiBwYXJhbSBodG1sIG1pc3NpbmcnXG5cbiAgICBAJHRlbXBsYXRlID0gJCggQHBydW5lSHRtbChodG1sKSApLndyYXAoJzxkaXY+JylcbiAgICBAJHdyYXAgPSBAJHRlbXBsYXRlLnBhcmVudCgpXG5cbiAgICBAbGFiZWwgPSBsYWJlbCB8fCB3b3Jkcy5odW1hbml6ZSggQG5hbWUgKVxuICAgIEBzdHlsZXMgPSBwcm9wZXJ0aWVzIHx8IHt9XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gIHNldERlc2lnbjogKGRlc2lnbikgLT5cbiAgICBAZGVzaWduID0gZGVzaWduXG4gICAgQGlkZW50aWZpZXIgPSBcIiN7IGRlc2lnbi5uYW1lIH0uI3sgQG5hbWUgfVwiXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBDb21wb25lbnRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IENvbXBvbmVudE1vZGVsKHRlbXBsYXRlOiB0aGlzKVxuXG5cbiAgY3JlYXRlVmlldzogKGNvbXBvbmVudE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIGNvbXBvbmVudE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIGNvbXBvbmVudFZpZXcgPSBuZXcgQ29tcG9uZW50Vmlld1xuICAgICAgbW9kZWw6IGNvbXBvbmVudE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3sgQGlkZW50aWZpZXIgfVxcXCIgY29udGFpbnMgI3sgaHRtbC5sZW5ndGggfVwiXG5cbiAgICBodG1sXG5cbiAgcGFyc2VUZW1wbGF0ZTogKCkgLT5cbiAgICBlbGVtID0gQCR0ZW1wbGF0ZVswXVxuICAgIEBkaXJlY3RpdmVzID0gQGNvbXBpbGVEaXJlY3RpdmVzKGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnXG4gICAgICAgICAgQGZvcm1hdEVkaXRhYmxlKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBmb3JtYXRDb250YWluZXIoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdodG1sJ1xuICAgICAgICAgIEBmb3JtYXRIdG1sKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcblxuXG4gICMgSW4gdGhlIGh0bWwgb2YgdGhlIHRlbXBsYXRlIGZpbmQgYW5kIHN0b3JlIGFsbCBET00gbm9kZXNcbiAgIyB3aGljaCBhcmUgZGlyZWN0aXZlcyAoZS5nLiBlZGl0YWJsZXMgb3IgY29udGFpbmVycykuXG4gIGNvbXBpbGVEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29tcGlsZXIucGFyc2UoZWxlbSlcbiAgICAgIGRpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSkgaWYgZGlyZWN0aXZlXG5cbiAgICBkaXJlY3RpdmVzXG5cblxuICAjIEZvciBldmVyeSBuZXcgQ29tcG9uZW50VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgY29tcG9uZW50RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBjb21wb25lbnREaXJlY3RpdmVzKVxuXG4gICAgY29tcG9uZW50RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZWRpdGFibGUpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGlmIGRlZmF1bHRWYWx1ZSB0aGVuIGRlZmF1bHRWYWx1ZSBlbHNlICcnXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0Q29udGFpbmVyOiAobmFtZSwgZWxlbSkgLT5cbiAgICAjIHJlbW92ZSBhbGwgY29udGVudCBmcm9uIGEgY29udGFpbmVyIGZyb20gdGhlIHRlbXBsYXRlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0SHRtbDogKG5hbWUsIGVsZW0pIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgIyBSZXR1cm4gYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGludGVyZmFjZSBvZiB0aGlzIHRlbXBsYXRlXG4gICMgQHJldHVybnMgeyBPYmplY3QgfSBBbiBvYmplY3Qgd2ljaCBjb250YWlucyB0aGUgaW50ZXJmYWNlIGRlc2NyaXB0aW9uXG4gICMgICBvZiB0aGlzIHRlbXBsYXRlLiBUaGlzIG9iamVjdCB3aWxsIGJlIHRoZSBzYW1lIGlmIHRoZSBpbnRlcmZhY2UgZG9lc1xuICAjICAgbm90IGNoYW5nZSBzaW5jZSBkaXJlY3RpdmVzIGFuZCBwcm9wZXJ0aWVzIGFyZSBzb3J0ZWQuXG4gIGluZm86ICgpIC0+XG4gICAgZG9jID1cbiAgICAgIG5hbWU6IEBuYW1lXG4gICAgICBkZXNpZ246IEBkZXNpZ24/Lm5hbWVcbiAgICAgIGRpcmVjdGl2ZXM6IFtdXG4gICAgICBwcm9wZXJ0aWVzOiBbXVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgeyBuYW1lLCB0eXBlIH0gPSBkaXJlY3RpdmVcbiAgICAgIGRvYy5kaXJlY3RpdmVzLnB1c2goeyBuYW1lLCB0eXBlIH0pXG5cblxuICAgIGZvciBuYW1lLCBzdHlsZSBvZiBAc3R5bGVzXG4gICAgICBkb2MucHJvcGVydGllcy5wdXNoKHsgbmFtZSwgdHlwZTogJ2Nzc01vZGlmaWNhdG9yJyB9KVxuXG4gICAgZG9jLmRpcmVjdGl2ZXMuc29ydChzb3J0QnlOYW1lKVxuICAgIGRvYy5wcm9wZXJ0aWVzLnNvcnQoc29ydEJ5TmFtZSlcbiAgICBkb2NcblxuXG5cbiMgU3RhdGljIGZ1bmN0aW9uc1xuIyAtLS0tLS0tLS0tLS0tLS0tXG5cblRlbXBsYXRlLnBhcnNlSWRlbnRpZmllciA9IChpZGVudGlmaWVyKSAtPlxuICByZXR1cm4gdW5sZXNzIGlkZW50aWZpZXIgIyBzaWxlbnRseSBmYWlsIG9uIHVuZGVmaW5lZCBvciBlbXB0eSBzdHJpbmdzXG5cbiAgcGFydHMgPSBpZGVudGlmaWVyLnNwbGl0KCcuJylcbiAgaWYgcGFydHMubGVuZ3RoID09IDFcbiAgICB7IGRlc2lnbk5hbWU6IHVuZGVmaW5lZCwgbmFtZTogcGFydHNbMF0gfVxuICBlbHNlIGlmIHBhcnRzLmxlbmd0aCA9PSAyXG4gICAgeyBkZXNpZ25OYW1lOiBwYXJ0c1swXSwgbmFtZTogcGFydHNbMV0gfVxuICBlbHNlXG4gICAgbG9nLmVycm9yKFwiY291bGQgbm90IHBhcnNlIGNvbXBvbmVudCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiJdfQ==
