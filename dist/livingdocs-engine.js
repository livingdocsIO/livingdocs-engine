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
var Scheme, jScheme;

Scheme = require('./scheme');

jScheme = new Scheme();

jScheme["new"] = function() {
  return new Scheme();
};

module.exports = jScheme;

if (typeof window !== "undefined" && window !== null) {
  window.jScheme = jScheme;
}

},{"./scheme":6}],5:[function(require,module,exports){
var PropertyValidator;

module.exports = PropertyValidator = (function() {
  var termRegex;

  termRegex = /\w[\w ]*\w/g;

  function PropertyValidator(_arg) {
    var _ref;
    this.inputString = _arg.inputString, this.scheme = _arg.scheme, this.property = _arg.property, this.parent = _arg.parent;
    this.validators = [];
    this.location = this.getLocation();
    if (this.scheme.propertiesRequired) {
      if ((_ref = this.parent) != null) {
        _ref.addRequiredProperty(this.property);
      }
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

  PropertyValidator.prototype.getPropLocation = function(key) {
    return "" + this.location + (this.scheme.writeProperty(key));
  };

  PropertyValidator.prototype.addValidations = function(configString) {
    var result, term, types;
    while (result = termRegex.exec(configString)) {
      term = result[0];
      if (term === 'optional') {
        this.parent.removeRequiredProperty(this.property);
      } else if (term === 'required') {
        this.parent.addRequiredProperty(this.property);
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
    var isValid, name, valid, validator, validators, _i, _len, _ref;
    isValid = true;
    if ((value == null) && this.isOptional()) {
      return isValid;
    }
    validators = this.scheme.validators;
    _ref = this.validators || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      validator = validators[name];
      if (validator == null) {
        return errors.add("missing validator " + name, {
          location: this.location
        });
      }
      if (valid = validator(value) === true) {
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
    var entry, index, isValid, location, res, validator, _i, _len, _ref;
    if (this.arrayValidator == null) {
      return true;
    }
    isValid = true;
    validator = this.scheme.validators[this.arrayValidator];
    if (validator == null) {
      return errors.add("missing validator " + this.arrayValidator, {
        location: this.location
      });
    }
    _ref = arr || [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      entry = _ref[index];
      res = validator(entry);
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
    if (this.otherPropertyValidator != null) {
      this.scheme.errors = void 0;
      if (isValid = this.otherPropertyValidator.call(this, key, value)) {
        return true;
      }
      if (this.scheme.errors != null) {
        errors.join(this.scheme.errors, {
          location: this.getPropLocation(key)
        });
      } else {
        errors.add("additional property check failed", {
          location: this.getPropLocation(key)
        });
      }
      return false;
    } else {
      if (this.scheme.allowAdditionalProperties) {
        return true;
      } else {
        errors.add("unspecified additional property", {
          location: this.getPropLocation(key)
        });
        return false;
      }
    }
  };

  PropertyValidator.prototype.validateRequiredProperties = function(obj, errors) {
    var isRequired, isValid, key, _ref;
    isValid = true;
    _ref = this.requiredProperties;
    for (key in _ref) {
      isRequired = _ref[key];
      if ((obj[key] == null) && isRequired) {
        errors.add("required property missing", {
          location: this.getPropLocation(key)
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
    var _ref;
    return (_ref = this.requiredProperties) != null ? _ref[key] = void 0 : void 0;
  };

  PropertyValidator.prototype.isOptional = function() {
    if (this.parent != null) {
      return !this.parent.requiredProperties[this.property] === true;
    }
  };

  return PropertyValidator;

})();

},{}],6:[function(require,module,exports){
var PropertyValidator, Scheme, ValidationErrors, type, validators;

ValidationErrors = require('./validation_errors');

PropertyValidator = require('./property_validator');

validators = require('./validators');

type = require('./type');

module.exports = Scheme = (function() {
  var jsVariableName;

  jsVariableName = /^[a-zA-Z]\w*$/;

  function Scheme() {
    this.validators = Object.create(validators);
    this.schemas = {};
    this.propertiesRequired = true;
    this.allowAdditionalProperties = true;
  }

  Scheme.prototype.configure = function(_arg) {
    this.propertiesRequired = _arg.propertiesRequired, this.allowAdditionalProperties = _arg.allowAdditionalProperties;
  };

  Scheme.prototype.add = function(name, schema) {
    if (type.isFunction(schema)) {
      this.addValidator(name, schema);
    } else {
      this.addSchema(name, this.parseConfigObj(schema, void 0, name));
    }
    return this;
  };

  Scheme.prototype.addSchema = function(name, schema) {
    if (this.validators[name] != null) {
      throw new Error("A validator is alredy registered under this name: " + name);
    }
    this.schemas[name] = schema;
    this.validators[name] = (function(_this) {
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
    return this;
  };

  Scheme.prototype.addValidator = function(name, func) {
    this.validators[name] = func;
    return this;
  };

  Scheme.prototype.validate = function(schemaName, obj) {
    var schema;
    this.errors = void 0;
    schema = this.schemas[schemaName];
    if (schema == null) {
      this.errors = new ValidationErrors();
      this.errors.add("missing schema", {
        location: schemaName
      });
      return false;
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
        if (isValid && (propertyValidator.childSchemaName == null) && type.isObject(value)) {
          errors.join(this.recursiveValidate(schemaObj[key], value));
        }
      } else {
        parentValidator.validateOtherProperty(key, value, errors);
      }
    }
    return errors;
  };

  Scheme.prototype.parseConfigObj = function(obj, parentValidator) {
    var key, propValidator, value;
    if (parentValidator == null) {
      parentValidator = new PropertyValidator({
        inputString: 'object',
        scheme: this
      });
    }
    for (key in obj) {
      value = obj[key];
      if (this.addParentValidator(parentValidator, key, value)) {
        continue;
      }
      if (type.isString(value)) {
        propValidator = new PropertyValidator({
          inputString: value,
          property: key,
          parent: parentValidator,
          scheme: this
        });
        obj[key] = {
          '__validator': propValidator
        };
      } else if (type.isObject(value)) {
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
        if (type.isFunction(validator)) {
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

},{"./property_validator":5,"./type":7,"./validation_errors":8,"./validators":9}],7:[function(require,module,exports){
var toString, type;

toString = Object.prototype.toString;

module.exports = type = {
  isObject: function(obj) {
    var t;
    t = typeof obj;
    return t === 'object' && !!obj && !this.isArray(obj);
  },
  isBoolean: function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  }
};

['Function', 'String', 'Number', 'Date', 'RegExp', 'Array'].forEach(function(name) {
  return type["is" + name] = function(obj) {
    return toString.call(obj) === ("[object " + name + "]");
  };
});

if (Array.isArray) {
  type.isArray = Array.isArray;
}

},{}],8:[function(require,module,exports){
var ValidationErrors, type;

type = require('./type');

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
    if (type.isString(message)) {
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

},{"./type":7}],9:[function(require,module,exports){
var type;

type = require('./type');

module.exports = {
  'object': function(value) {
    return type.isObject(value);
  },
  'string': function(value) {
    return type.isString(value);
  },
  'boolean': function(value) {
    return type.isBoolean(value);
  },
  'number': function(value) {
    return type.isNumber(value);
  },
  'function': function(value) {
    return type.isFunction(value);
  },
  'date': function(value) {
    return type.isDate(value);
  },
  'regexp': function(value) {
    return type.isRegExp(value);
  },
  'array': function(value) {
    return type.isArray(value);
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

},{"./type":7}],10:[function(require,module,exports){
/*!
 * EventEmitter v4.2.9 - git.io/ee
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
     * Finds the index of the listener for the event in its storage array.
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
        if (evt instanceof RegExp) {
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
     * automatically removed after its first execution.
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

        // If evt is an object then pass each of its properties to this method
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
        else if (evt instanceof RegExp) {
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
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

},{}],11:[function(require,module,exports){
var ComponentTree, CssLoader, EditorPage, JsLoader, Livingdoc, augmentConfig, config, designCache, doc, version;

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Livingdoc = require('./livingdoc');

ComponentTree = require('./component_tree/component_tree');

designCache = require('./design/design_cache');

EditorPage = require('./rendering_container/editor_page');

JsLoader = require('./rendering_container/js_loader');

CssLoader = require('./rendering_container/css_loader');

version = require('../version');

module.exports = doc = (function() {
  var editorPage;
  editorPage = new EditorPage();
  return {
    version: version.version,
    revision: version.revision,
    design: designCache,
    Livingdoc: Livingdoc,
    ComponentTree: ComponentTree,
    createLivingdoc: function(_arg) {
      var componentTree, data, design;
      data = _arg.data, design = _arg.design, componentTree = _arg.componentTree;
      return Livingdoc.create({
        data: data,
        designName: design,
        componentTree: componentTree
      });
    },
    "new": function() {
      return this.createLivingdoc.apply(this, arguments);
    },
    create: function() {
      return this.createLivingdoc.apply(this, arguments);
    },
    startDrag: $.proxy(editorPage, 'startDrag'),
    config: function(userConfig) {
      $.extend(true, config, userConfig);
      return augmentConfig(config);
    },
    JsLoader: JsLoader,
    CssLoader: CssLoader
  };
})();

window.doc = doc;



},{"../version":71,"./component_tree/component_tree":18,"./configuration/augment_config":22,"./configuration/config":23,"./design/design_cache":26,"./livingdoc":39,"./rendering_container/css_loader":59,"./rendering_container/editor_page":60,"./rendering_container/js_loader":62}],12:[function(require,module,exports){
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



},{}],13:[function(require,module,exports){
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



},{"../modules/logging/assert":46}],14:[function(require,module,exports){
var ComponentDirective;

module.exports = ComponentDirective = (function() {
  function ComponentDirective(_arg) {
    this.component = _arg.component, this.templateDirective = _arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  ComponentDirective.prototype.getContent = function() {
    return this.component.content[this.name];
  };

  ComponentDirective.prototype.setContent = function(value) {
    return this.component.setContent(this.name, value);
  };

  ComponentDirective.prototype.setData = function(key, value) {
    var dataStore, directiveData;
    dataStore = "_" + this.name + "Directive";
    directiveData = this.component.getData(dataStore);
    if (directiveData == null) {
      directiveData = {};
    }
    directiveData[key] = value;
    return this.component.setData(dataStore, directiveData);
  };

  ComponentDirective.prototype.getData = function(key) {
    var _ref;
    if (key) {
      return (_ref = this.component.dataValues["_" + this.name + "Directive"]) != null ? _ref[key] : void 0;
    } else {
      return this.component.dataValues["_" + this.name + "Directive"];
    }
  };

  ComponentDirective.prototype.setTmp = function(key, value) {
    this.tmp = {};
    return this.tmp[key] = value;
  };

  ComponentDirective.prototype.getTmp = function(key) {
    var _ref;
    return (_ref = this.tmp) != null ? _ref[key] : void 0;
  };

  return ComponentDirective;

})();



},{}],15:[function(require,module,exports){
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



},{"../image_services/image_service":32,"../modules/logging/assert":46,"./editable_directive":19,"./html_directive":20,"./image_directive":21}],16:[function(require,module,exports){
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

  ComponentModel.prototype.getMainView = function() {
    return this.componentTree.getMainComponentView(this.id);
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
    var changedDataProperties, name, value, _ref;
    if (typeof arg === 'object') {
      changedDataProperties = [];
      for (name in arg) {
        value = arg[name];
        if (this.changeData(name, value)) {
          changedDataProperties.push(name);
        }
      }
      if (changedDataProperties.length > 0) {
        return (_ref = this.componentTree) != null ? _ref.dataChanging(this, changedDataProperties) : void 0;
      }
    } else if (arg) {
      return this.dataValues[arg];
    } else {
      return this.dataValues;
    }
  };

  ComponentModel.prototype.setData = function(key, value) {
    var _ref;
    if (key && this.changeData(key, value)) {
      return (_ref = this.componentTree) != null ? _ref.dataChanging(this, [key]) : void 0;
    }
  };

  ComponentModel.prototype.getData = function(key) {
    if (key) {
      return this.dataValues[key];
    } else {
      return this.dataValues;
    }
  };

  ComponentModel.prototype.changeData = function(name, value) {
    if (deepEqual(this.dataValues[name], value)) {
      return false;
    }
    this.dataValues[name] = value;
    return true;
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



},{"../configuration/config":23,"../modules/guid":43,"../modules/logging/assert":46,"../modules/logging/log":47,"../template/directive_collection":66,"./component_container":13,"./component_directive_factory":15,"deep-equal":1}],17:[function(require,module,exports){
var $, ComponentModel, assert, config, deepEqual, guid, log, serialization;

$ = require('jquery');

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
        assert(model.content.hasOwnProperty(name), "error while deserializing component " + model.componentName + ": unknown content '" + name + "'");
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



},{"../configuration/config":23,"../modules/guid":43,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/serialization":50,"./component_model":16,"deep-equal":1,"jquery":"cqNDv+"}],18:[function(require,module,exports){
var $, ComponentArray, ComponentContainer, ComponentModel, ComponentTree, assert, componentModelSerializer,
  __slice = [].slice;

$ = require('jquery');

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
    this.componentById = {};
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

  ComponentTree.prototype.findById = function(id) {
    return this.componentById[id];
  };

  ComponentTree.prototype.detach = function() {
    var oldRoot;
    this.root.componentTree = void 0;
    this.each((function(_this) {
      return function(component) {
        component.componentTree = void 0;
        return _this.componentById[component.id] = void 0;
      };
    })(this));
    oldRoot = this.root;
    this.root = new ComponentContainer({
      isRoot: true
    });
    return oldRoot;
  };

  ComponentTree.prototype.setMainView = function(view) {
    assert(view.renderer, 'componentTree.setMainView: view does not have an initialized renderer');
    assert(view.renderer.componentTree === this, 'componentTree.setMainView: Cannot set renderer from different componentTree');
    return this.mainRenderer = view.renderer;
  };

  ComponentTree.prototype.getMainComponentView = function(componentId) {
    var _ref;
    return (_ref = this.mainRenderer) != null ? _ref.getComponentViewById(componentId) : void 0;
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
          descendant.componentTree = _this;
          return _this.componentById[descendant.id] = component;
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
    component.descendantsAndSelf((function(_this) {
      return function(descendant) {
        descendant.componentTree = void 0;
        return _this.componentById[descendant.id] = void 0;
      };
    })(this));
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
          component.componentTree = _this;
          return _this.componentById[component.id] = component;
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



},{"../modules/logging/assert":46,"./component_array":12,"./component_container":13,"./component_model":16,"./component_model_serializer":17,"jquery":"cqNDv+"}],19:[function(require,module,exports){
var ComponentDirective, EditableDirective, assert, words,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

assert = require('../modules/logging/assert');

words = require('../modules/words');

ComponentDirective = require('./component_directive');

module.exports = EditableDirective = (function(_super) {
  __extends(EditableDirective, _super);

  function EditableDirective() {
    return EditableDirective.__super__.constructor.apply(this, arguments);
  }

  EditableDirective.prototype.isEditable = true;

  EditableDirective.prototype.getText = function() {
    var content;
    content = this.getContent();
    if (!content) {
      return '';
    }
    return words.extractTextFromHtml(content);
  };

  return EditableDirective;

})(ComponentDirective);



},{"../modules/logging/assert":46,"../modules/words":51,"./component_directive":14}],20:[function(require,module,exports){
var ComponentDirective, HtmlDirective, assert,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

assert = require('../modules/logging/assert');

ComponentDirective = require('./component_directive');

module.exports = HtmlDirective = (function(_super) {
  __extends(HtmlDirective, _super);

  function HtmlDirective() {
    return HtmlDirective.__super__.constructor.apply(this, arguments);
  }

  HtmlDirective.prototype.isHtml = true;

  HtmlDirective.prototype.setEmbedHandler = function(embedHandlerName) {
    return this.setData('_embedHandler', embedHandlerName);
  };

  HtmlDirective.prototype.getEmbedHandler = function() {
    return this.getData('_embedHandler');
  };

  return HtmlDirective;

})(ComponentDirective);



},{"../modules/logging/assert":46,"./component_directive":14}],21:[function(require,module,exports){
var ComponentDirective, ImageDirective, assert, imageService,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

ComponentDirective = require('./component_directive');

module.exports = ImageDirective = (function(_super) {
  __extends(ImageDirective, _super);

  function ImageDirective() {
    return ImageDirective.__super__.constructor.apply(this, arguments);
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

})(ComponentDirective);



},{"../image_services/image_service":32,"../modules/logging/assert":46,"./component_directive":14}],22:[function(require,module,exports){
module.exports = function(config) {
  var name, prefix, value, _ref;
  config.docDirective = {};
  config.templateAttrLookup = {};
  _ref = config.directives;
  for (name in _ref) {
    value = _ref[name];
    prefix = config.attributePrefix ? "" + config.attributePrefix + "-" : '';
    value.renderedAttr = "" + prefix + value.attr;
    config.docDirective[name] = value.renderedAttr;
    config.templateAttrLookup[value.attr] = name;
  }
  return config;
};



},{}],23:[function(require,module,exports){
var augmentConfig;

augmentConfig = require('./augment_config');

module.exports = augmentConfig({
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
  },
  imageServices: {
    'resrc.it': {
      quality: 75,
      host: 'https://app.resrc.it'
    }
  }
});



},{"./augment_config":22}],24:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/words":51}],25:[function(require,module,exports){
var Dependencies, Design, OrderedHash, Template, assert, config, log;

config = require('../configuration/config');

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Template = require('../template/template');

OrderedHash = require('../modules/ordered_hash');

Dependencies = require('../rendering/dependencies');

module.exports = Design = (function() {
  function Design(_arg) {
    this.name = _arg.name, this.version = _arg.version, this.author = _arg.author, this.description = _arg.description;
    assert(this.name != null, 'Design: param "name" is required');
    this.identifier = Design.getIdentifier(this.name, this.version);
    this.groups = [];
    this.components = new OrderedHash();
    this.imageRatios = {};
    this.dependencies = new Dependencies({
      prefix: "" + config.designPath + "/" + this.name
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



},{"../configuration/config":23,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/ordered_hash":48,"../rendering/dependencies":53,"../template/template":70}],26:[function(require,module,exports){
var Design, Version, assert, designParser;

assert = require('../modules/logging/assert');

Design = require('./design');

designParser = require('./design_parser');

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
      design = designParser.parse(designSpec);
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



},{"../modules/logging/assert":46,"./design":25,"./design_parser":28,"./version":30}],27:[function(require,module,exports){
var Version, config, jScheme, validator;

config = require('../configuration/config');

jScheme = require('jscheme');

Version = require('./version');

module.exports = validator = jScheme["new"]();

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
  },
  imageRatios: {
    __validate: 'optional',
    __additionalProperty: function(key, value) {
      return validator.validate('imageRatio', value);
    }
  }
});

validator.add('component', {
  name: 'string',
  label: 'string, optional',
  html: 'string',
  directives: 'object, optional',
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

validator.add('imageRatio', {
  label: 'string, optional',
  ratio: 'string'
});

validator.add('styleOption', {
  caption: 'string',
  value: 'string, optional'
});



},{"../configuration/config":23,"./version":30,"jscheme":4}],28:[function(require,module,exports){
var $, CssModificatorProperty, Design, ImageRatio, Template, Version, assert, designConfigSchema, designParser, log;

log = require('../modules/logging/log');

$ = require('jquery');

assert = require('../modules/logging/assert');

designConfigSchema = require('./design_config_schema');

CssModificatorProperty = require('./css_modificator_property');

Template = require('../template/template');

Design = require('./design');

Version = require('./version');

ImageRatio = require('./image_ratio');

$ = require('jquery');

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
    var assets, componentProperties, components, defaultComponents, error, groups, imageRatios;
    assets = designConfig.assets, components = designConfig.components, componentProperties = designConfig.componentProperties, groups = designConfig.groups, defaultComponents = designConfig.defaultComponents, imageRatios = designConfig.imageRatios;
    try {
      this.design = this.parseDesignInfo(designConfig);
      this.parseAssets(assets);
      this.parseComponentProperties(componentProperties);
      this.parseImageRatios(imageRatios);
      this.parseComponents(components);
      this.parseGroups(groups);
      this.parseDefaults(defaultComponents);
    } catch (_error) {
      error = _error;
      error.message = "Error creating the design: " + error.message;
      throw error;
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
    this.eachAsset(assets.js, (function(_this) {
      return function(assetUrl) {
        return _this.design.dependencies.addJs({
          src: assetUrl
        });
      };
    })(this));
    return this.eachAsset(assets.css, (function(_this) {
      return function(assetUrl) {
        return _this.design.dependencies.addCss({
          src: assetUrl
        });
      };
    })(this));
  },
  eachAsset: function(data, callback) {
    var entry, _i, _len, _results;
    if (data == null) {
      return;
    }
    if ($.type(data) === 'string') {
      return callback(data);
    } else {
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        entry = data[_i];
        _results.push(callback(entry));
      }
      return _results;
    }
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
  parseImageRatios: function(ratios) {
    var name, ratio, _results;
    _results = [];
    for (name in ratios) {
      ratio = ratios[name];
      _results.push(this.design.imageRatios[name] = new ImageRatio({
        name: name,
        label: ratio.label,
        ratio: ratio.ratio
      }));
    }
    return _results;
  },
  parseComponents: function(components) {
    var component, directives, html, label, name, properties, _i, _len, _ref, _results;
    if (components == null) {
      components = [];
    }
    _results = [];
    for (_i = 0, _len = components.length; _i < _len; _i++) {
      _ref = components[_i], name = _ref.name, label = _ref.label, html = _ref.html, properties = _ref.properties, directives = _ref.directives;
      properties = this.lookupComponentProperties(properties);
      component = new Template({
        name: name,
        label: label,
        html: html,
        properties: properties
      });
      this.parseDirectives(component, directives);
      _results.push(this.design.add(component));
    }
    return _results;
  },
  parseDirectives: function(component, directives) {
    var conf, directive, directiveConfig, name, _results;
    _results = [];
    for (name in directives) {
      conf = directives[name];
      directive = component.directives.get(name);
      assert(directive, "Could not find directive " + name + " in " + component.name + " component.");
      directiveConfig = $.extend({}, conf);
      if (conf.imageRatios) {
        directiveConfig.imageRatios = this.lookupImageRatios(conf.imageRatios);
      }
      _results.push(directive.setConfig(directiveConfig));
    }
    return _results;
  },
  lookupComponentProperties: function(propertyNames) {
    var name, properties, property, _i, _len, _ref;
    properties = {};
    _ref = propertyNames || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      property = this.componentProperties[name];
      assert(property, "The componentProperty '" + name + "' was not found.");
      properties[name] = property;
    }
    return properties;
  },
  lookupImageRatios: function(ratioNames) {
    if (ratioNames == null) {
      return;
    }
    return this.mapArray(ratioNames, (function(_this) {
      return function(name) {
        var ratio;
        ratio = _this.design.imageRatios[name];
        assert(ratio, "The imageRatio '" + name + "' was not found.");
        return ratio;
      };
    })(this));
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
  },
  mapArray: function(entries, lookup) {
    var entry, newArray, val, _i, _len;
    newArray = [];
    for (_i = 0, _len = entries.length; _i < _len; _i++) {
      entry = entries[_i];
      val = lookup(entry);
      if (val != null) {
        newArray.push(val);
      }
    }
    return newArray;
  }
};

Design.parser = designParser;



},{"../modules/logging/assert":46,"../modules/logging/log":47,"../template/template":70,"./css_modificator_property":24,"./design":25,"./design_config_schema":27,"./image_ratio":29,"./version":30,"jquery":"cqNDv+"}],29:[function(require,module,exports){
var $, ImageRatio, assert, words;

$ = require('jquery');

words = require('../modules/words');

assert = require('../modules/logging/assert');

module.exports = ImageRatio = (function() {
  var ratioString;

  ratioString = /(\d+)[\/:x](\d+)/;

  function ImageRatio(_arg) {
    var label, ratio;
    this.name = _arg.name, label = _arg.label, ratio = _arg.ratio;
    this.label = label || words.humanize(this.name);
    this.ratio = this.parseRatio(ratio);
  }

  ImageRatio.prototype.parseRatio = function(ratio) {
    var res;
    if ($.type(ratio) === 'string') {
      res = ratioString.exec(ratio);
      ratio = Number(res[1]) / Number(res[2]);
    }
    assert($.type(ratio) === 'number', "Could not parse image ratio " + ratio);
    return ratio;
  };

  return ImageRatio;

})();



},{"../modules/logging/assert":46,"../modules/words":51,"jquery":"cqNDv+"}],30:[function(require,module,exports){
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



},{}],31:[function(require,module,exports){
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



},{}],32:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"./default_image_service":31,"./resrcit_image_service":33}],33:[function(require,module,exports){
var assert, imgService, resrcitConfig;

assert = require('../modules/logging/assert');

imgService = require('./default_image_service');

resrcitConfig = require('../configuration/config').imageServices['resrc.it'];

module.exports = (function() {
  return {
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
      var crop, q, quality, style, _ref;
      _ref = _arg != null ? _arg : {}, crop = _ref.crop, quality = _ref.quality;
      style = "";
      if (crop != null) {
        style += "/C=W" + crop.width + ",H" + crop.height + ",X" + crop.x + ",Y" + crop.y;
      }
      if (q = quality || resrcitConfig.quality) {
        style += "/O=" + q;
      }
      return "" + resrcitConfig.host + style + "/" + value;
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



},{"../configuration/config":23,"../modules/logging/assert":46,"./default_image_service":31}],34:[function(require,module,exports){
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



},{"../configuration/config":23,"../modules/feature_detection/is_supported":42,"./dom":35}],35:[function(require,module,exports){
var $, config, css;

$ = require('jquery');

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



},{"../configuration/config":23,"jquery":"cqNDv+"}],36:[function(require,module,exports){
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



},{"../configuration/config":23}],37:[function(require,module,exports){
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



},{"../configuration/config":23,"./dom":35}],38:[function(require,module,exports){
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



},{"./dom":35}],39:[function(require,module,exports){
var ComponentTree, Dependencies, EventEmitter, InteractivePage, Livingdoc, Page, Renderer, RenderingContainer, View, assert, config, designCache, dom,
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

designCache = require('./design/design_cache');

ComponentTree = require('./component_tree/component_tree');

Dependencies = require('./rendering/dependencies');

module.exports = Livingdoc = (function(_super) {
  __extends(Livingdoc, _super);

  Livingdoc.create = function(_arg) {
    var componentTree, data, design, designName, _ref;
    data = _arg.data, designName = _arg.designName, componentTree = _arg.componentTree;
    componentTree = data != null ? (designName = (_ref = data.design) != null ? _ref.name : void 0, assert(designName != null, 'Error creating livingdoc: No design is specified.'), design = designCache.get(designName), new ComponentTree({
      content: data,
      design: design
    })) : designName != null ? (design = designCache.get(designName), new ComponentTree({
      design: design
    })) : componentTree;
    return new Livingdoc({
      componentTree: componentTree
    });
  };

  function Livingdoc(_arg) {
    var componentTree;
    componentTree = _arg.componentTree;
    this.design = componentTree.design;
    this.componentTree = void 0;
    this.dependencies = void 0;
    this.setComponentTree(componentTree);
    this.interactiveView = void 0;
    this.additionalViews = [];
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
    this.dependencies = new Dependencies({
      componentTree: this.componentTree
    });
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
    var $parent, view, whenViewIsReady;
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
    view = new View(this, $parent[0]);
    whenViewIsReady = view.create(options);
    if (view.isInteractive) {
      this.setInteractiveView(view);
      whenViewIsReady.then((function(_this) {
        return function(_arg) {
          var iframe, renderer;
          iframe = _arg.iframe, renderer = _arg.renderer;
          return _this.componentTree.setMainView(view);
        };
      })(this));
    }
    return whenViewIsReady;
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
    view = new View(this, $parent[0]);
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

  Livingdoc.prototype.addJsDependency = function(obj) {
    return this.dependencies.addJs(obj);
  };

  Livingdoc.prototype.addCssDependency = function(obj) {
    return this.dependencies.addCss(obj);
  };

  Livingdoc.prototype.hasDependencies = function() {
    var _ref, _ref1;
    return ((_ref = this.dependencies) != null ? _ref.hasJs() : void 0) || ((_ref1 = this.dependencies) != null ? _ref1.hasCss() : void 0);
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



},{"./component_tree/component_tree":18,"./configuration/config":23,"./design/design_cache":26,"./interaction/dom":35,"./modules/logging/assert":46,"./rendering/dependencies":53,"./rendering/renderer":56,"./rendering/view":57,"./rendering_container/interactive_page":61,"./rendering_container/page":63,"./rendering_container/rendering_container":64,"wolfy87-eventemitter":10}],40:[function(require,module,exports){
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



},{}],41:[function(require,module,exports){
var $;

$ = require('jquery');

module.exports = (function() {
  return {
    htmlPointerEvents: function() {
      var element;
      element = $('<x>')[0];
      element.style.cssText = 'pointer-events:auto';
      return element.style.pointerEvents === 'auto';
    }
  };
})();



},{"jquery":"cqNDv+"}],42:[function(require,module,exports){
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



},{"./feature_detects":41}],43:[function(require,module,exports){
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



},{}],"cqNDv+":[function(require,module,exports){
module.exports = $;



},{}],"jquery":[function(require,module,exports){
module.exports=require('cqNDv+');
},{}],46:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};



},{"./log":47}],47:[function(require,module,exports){
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



},{}],48:[function(require,module,exports){
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



},{}],49:[function(require,module,exports){
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



},{"../modules/logging/assert":46}],50:[function(require,module,exports){
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



},{}],51:[function(require,module,exports){
var $;

$ = require('jquery');

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
    },
    extractTextFromHtml: function(str) {
      var div;
      div = $('<div>')[0];
      div.innerHTML = str;
      return div.textContent;
    }
  };
})();



},{"jquery":"cqNDv+"}],52:[function(require,module,exports){
var $, ComponentView, DirectiveIterator, attr, config, css, dom, eventing;

$ = require('jquery');

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

  ComponentView.prototype.getOwnerWindow = function() {
    return this.$elem[0].ownerDocument.defaultView;
  };

  return ComponentView;

})();



},{"../configuration/config":23,"../interaction/dom":35,"../modules/eventing":40,"../template/directive_iterator":69,"jquery":"cqNDv+"}],53:[function(require,module,exports){
var $, Dependencies, Dependency, assert, dependenciesToHtml, log,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require('jquery');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

Dependency = require('./dependency');

dependenciesToHtml = require('./dependencies_to_html');

module.exports = Dependencies = (function() {
  function Dependencies(_arg) {
    var allowRelativeUrls, _ref;
    _ref = _arg != null ? _arg : {}, this.componentTree = _ref.componentTree, this.prefix = _ref.prefix, allowRelativeUrls = _ref.allowRelativeUrls;
    this.onComponentRemoved = __bind(this.onComponentRemoved, this);
    this.allowRelativeUrls = this.prefix ? true : allowRelativeUrls || false;
    if (this.prefix == null) {
      this.prefix = '';
    }
    this.js = [];
    this.css = [];
    this.namespaces = {};
    this.dependencyAdded = $.Callbacks();
    this.dependencyRemoved = $.Callbacks();
    if (this.componentTree != null) {
      this.componentTree.componentRemoved.add(this.onComponentRemoved);
    }
  }

  Dependencies.prototype.add = function(obj) {
    var dep, existing;
    this.convertToAbsolutePaths(obj);
    dep = new Dependency(obj);
    if (existing = this.getExisting(dep)) {
      if (typeof component !== "undefined" && component !== null) {
        return existing.addComponent(component);
      }
    } else {
      return this.addDependency(dep);
    }
  };

  Dependencies.prototype.addJs = function(obj) {
    obj.type = 'js';
    return this.add(obj);
  };

  Dependencies.prototype.addCss = function(obj) {
    obj.type = 'css';
    return this.add(obj);
  };

  Dependencies.prototype.convertToAbsolutePaths = function(obj) {
    var src;
    if (!obj.src) {
      return;
    }
    src = obj.src;
    if (!this.isAbsoluteUrl(src)) {
      assert(this.allowRelativeUrls, "Dependencies: relative urls are not allowed: " + src);
      src = src.replace(/^[\.\/]*/, '');
      return obj.src = "" + this.prefix + "/" + src;
    }
  };

  Dependencies.prototype.isAbsoluteUrl = function(src) {
    return /(^\/\/|[a-z]*:\/\/)/.test(src) || /^\//.test(src);
  };

  Dependencies.prototype.addDependency = function(dependency) {
    var collection;
    if (dependency.namespace) {
      this.addToNamespace(dependency);
    }
    collection = dependency.isJs() ? this.js : this.css;
    collection.push(dependency);
    this.dependencyAdded.fire(dependency);
    return dependency;
  };

  Dependencies.prototype.addToNamespace = function(dependency) {
    var namespace, _base, _name;
    if (dependency.namespace) {
      if ((_base = this.namespaces)[_name = dependency.namespace] == null) {
        _base[_name] = [];
      }
      namespace = this.namespaces[dependency.namespace];
      return namespace.push(dependency);
    }
  };

  Dependencies.prototype.removeFromNamespace = function(dependency) {
    var index, namespace;
    if (namespace = this.getNamespace(dependency.namespace)) {
      index = namespace.indexOf(dependency);
      if (index > -1) {
        return namespace.splice(index, 1);
      }
    }
  };

  Dependencies.prototype.getNamespaces = function() {
    var array, name, _ref, _results;
    _ref = this.namespaces;
    _results = [];
    for (name in _ref) {
      array = _ref[name];
      _results.push(name);
    }
    return _results;
  };

  Dependencies.prototype.getNamespace = function(name) {
    var namespace;
    namespace = this.namespaces[name];
    if (namespace != null ? namespace.length : void 0) {
      return namespace;
    } else {
      return void 0;
    }
  };

  Dependencies.prototype.getExisting = function(dep) {
    var collection, entry, _i, _len;
    collection = dep.isJs() ? this.js : this.css;
    for (_i = 0, _len = collection.length; _i < _len; _i++) {
      entry = collection[_i];
      if (entry.isSameAs(dep)) {
        return entry;
      }
    }
    return void 0;
  };

  Dependencies.prototype.hasCss = function() {
    return this.css.length > 0;
  };

  Dependencies.prototype.hasJs = function() {
    return this.js.length > 0;
  };

  Dependencies.prototype.onComponentRemoved = function(component) {
    var dependency, needed, toBeRemoved, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
    toBeRemoved = [];
    _ref = this.js;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependency = _ref[_i];
      needed = dependency.removeComponent(component);
      if (!needed) {
        toBeRemoved.push(dependency);
      }
    }
    _ref1 = this.css;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      dependency = _ref1[_j];
      needed = dependency.removeComponent(component);
      if (!needed) {
        toBeRemoved.push(dependency);
      }
    }
    _results = [];
    for (_k = 0, _len2 = toBeRemoved.length; _k < _len2; _k++) {
      dependency = toBeRemoved[_k];
      _results.push(this.removeDependency(dependency));
    }
    return _results;
  };

  Dependencies.prototype.removeDependency = function(dependency) {
    var collection, index;
    if (dependency.namespace) {
      this.removeFromNamespace(dependency);
    }
    collection = dependency.isJs() ? this.js : this.css;
    index = collection.indexOf(dependency);
    if (index > -1) {
      collection.splice(index, 1);
    }
    return this.dependencyRemoved.fire(dependency);
  };

  Dependencies.prototype.serialize = function() {
    var data, dependency, _i, _j, _len, _len1, _ref, _ref1;
    data = {};
    _ref = this.js;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependency = _ref[_i];
      if (data['js'] == null) {
        data['js'] = [];
      }
      data['js'].push(dependency.serialize());
    }
    _ref1 = this.css;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      dependency = _ref1[_j];
      if (data['css'] == null) {
        data['css'] = [];
      }
      data['css'].push(dependency.serialize());
    }
    return data;
  };

  Dependencies.prototype.deserialize = function(data) {
    var entry, obj, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (data == null) {
      return;
    }
    _ref = data.js || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      obj = {
        type: 'js',
        src: entry.src,
        code: entry.code,
        namespace: entry.namespace,
        name: entry.name
      };
      this.addDeserialzedObj(obj, entry);
    }
    _ref1 = data.css || [];
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      entry = _ref1[_j];
      obj = {
        type: 'css',
        src: entry.src,
        code: entry.code,
        namespace: entry.namespace,
        name: entry.name
      };
      _results.push(this.addDeserialzedObj(obj, entry));
    }
    return _results;
  };

  Dependencies.prototype.addDeserialzedObj = function(obj, entry) {
    var component, components, dependency, id, _i, _j, _len, _len1, _ref, _ref1, _results;
    if ((_ref = entry.componentIds) != null ? _ref.length : void 0) {
      components = [];
      _ref1 = entry.componentIds;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        id = _ref1[_i];
        component = this.componentTree.findById(id);
        if (component != null) {
          components.push(component);
        }
      }
      if (components.length) {
        dependency = this.add(obj);
        _results = [];
        for (_j = 0, _len1 = components.length; _j < _len1; _j++) {
          component = components[_j];
          _results.push(dependency.addComponent(component));
        }
        return _results;
      } else {
        return log.warn('Dropped dependency: could not find components that depend on it', entry);
      }
    } else {
      return this.add(obj);
    }
  };

  Dependencies.prototype.printJs = function() {
    return dependenciesToHtml.printJs(this);
  };

  Dependencies.prototype.printCss = function() {
    return dependenciesToHtml.printCss(this);
  };

  return Dependencies;

})();



},{"../modules/logging/assert":46,"../modules/logging/log":47,"./dependencies_to_html":54,"./dependency":55,"jquery":"cqNDv+"}],54:[function(require,module,exports){
var CssLoader, JsLoader;

JsLoader = require('../rendering_container/js_loader');

CssLoader = require('../rendering_container/css_loader');

module.exports = {
  printJs: function(dependencies) {
    var dependency, html, _i, _len, _ref;
    html = '';
    _ref = dependencies.js;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependency = _ref[_i];
      if (dependency.inline) {
        html += this.printInlineScript({
          codeBlock: dependency.code
        });
      } else {
        html += this.printScriptTag({
          src: dependency.src
        });
      }
      html += '\n';
    }
    return html;
  },
  printCss: function(dependencies) {
    var dependency, html, _i, _len, _ref;
    html = '';
    _ref = dependencies.css;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dependency = _ref[_i];
      if (dependency.inline) {
        html += this.printInlineCss({
          styles: dependency.code
        });
      } else {
        html += this.printCssLink({
          src: dependency.src
        });
      }
      html += '\n';
    }
    return html;
  },
  printScriptTag: function(_arg) {
    var src;
    src = _arg.src;
    return "<script src=\"" + src + "\"></script>";
  },
  printInlineScript: function(_arg) {
    var codeBlock;
    codeBlock = _arg.codeBlock;
    codeBlock = JsLoader.prototype.prepareInlineCode(codeBlock);
    return "<script> " + codeBlock + " </script>";
  },
  printCssLink: function(_arg) {
    var head, src;
    src = _arg.src, head = _arg.head;
    if (head == null) {
      head = true;
    }
    if (head) {
      return "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + src + "\">";
    } else {
      return "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + src + "\">";
    }
  },
  printInlineCss: function(_arg) {
    var styles;
    styles = _arg.styles;
    styles = CssLoader.prototype.prepareInlineStyles(styles);
    return "<style> " + styles + " </style>";
  },
  printComment: function(text) {
    return "<!-- " + text + " -->";
  }
};



},{"../rendering_container/css_loader":59,"../rendering_container/js_loader":62}],55:[function(require,module,exports){
var Dependency, assert;

assert = require('../modules/logging/assert');

module.exports = Dependency = (function() {
  function Dependency(_arg) {
    var component, _ref;
    this.name = _arg.name, this.namespace = _arg.namespace, this.src = _arg.src, this.code = _arg.code, this.type = _arg.type, component = _arg.component;
    assert(this.src || this.code, 'Dependency: No "src" or "code" param provided');
    assert(!(this.src && this.code), 'Dependency: Only provide one of "src" or "code" params');
    assert(this.type, "Dependency: Param type must be specified");
    assert((_ref = this.type) === 'js' || _ref === 'css', "Dependency: Unrecognized type: " + this.type);
    if (this.code != null) {
      this.inline = true;
    }
    this.components = {};
    this.componentCount = 0;
    if (component != null) {
      this.addComponent(component);
    }
  }

  Dependency.prototype.isJs = function() {
    return this.type === 'js';
  };

  Dependency.prototype.isCss = function() {
    return this.type === 'css';
  };

  Dependency.prototype.hasComponent = function(component) {
    return this.components[component.id] != null;
  };

  Dependency.prototype.addComponent = function(component) {
    if (!this.hasComponent(component)) {
      this.componentCount += 1;
      return this.components[component.id] = true;
    }
  };

  Dependency.prototype.removeComponent = function(component) {
    if (this.hasComponent(component)) {
      this.componentCount -= 1;
      this.components[component.id] = void 0;
    }
    return this.componentCount !== 0;
  };

  Dependency.prototype.isSameAs = function(otherDependency) {
    if (this.type !== otherDependency.type) {
      return false;
    }
    if (this.namespace !== otherDependency.namespace) {
      return false;
    }
    if (otherDependency.src) {
      return this.src === otherDependency.src;
    } else {
      return this.code === otherDependency.code;
    }
  };

  Dependency.prototype.serialize = function() {
    var componentId, key, obj, _i, _len, _ref;
    obj = {};
    _ref = ['src', 'code', 'inline', 'name', 'namespace'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (this[key] != null) {
        obj[key] = this[key];
      }
    }
    for (componentId in this.components) {
      if (obj.componentIds == null) {
        obj.componentIds = [];
      }
      obj.componentIds.push(componentId);
    }
    return obj;
  };

  return Dependency;

})();



},{"../modules/logging/assert":46}],56:[function(require,module,exports){
var $, Renderer, Semaphore, assert, config, log;

$ = require('jquery');

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

  Renderer.prototype.getComponentViewById = function(componentId) {
    return this.componentViews[componentId];
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



},{"../configuration/config":23,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/semaphore":49,"jquery":"cqNDv+"}],57:[function(require,module,exports){
var InteractivePage, Page, Renderer, View;

Renderer = require('./renderer');

Page = require('../rendering_container/page');

InteractivePage = require('../rendering_container/interactive_page');

module.exports = View = (function() {
  function View(livingdoc, parent) {
    this.livingdoc = livingdoc;
    this.parent = parent;
    if (this.parent == null) {
      this.parent = window.document.body;
    }
    this.isInteractive = false;
  }

  View.prototype.create = function(options) {
    return this.createIFrame(this.parent).then((function(_this) {
      return function(iframe, renderNode) {
        _this.iframe = iframe;
        _this.renderer = _this.createIFrameRenderer(iframe, options);
        return {
          iframe: iframe,
          renderer: _this.renderer
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
      documentDependencies: this.livingdoc.dependencies,
      design: this.livingdoc.design
    };
    this.page = this.createPage(params, options);
    return new Renderer({
      renderingContainer: this.page,
      componentTree: this.livingdoc.componentTree,
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



},{"../rendering_container/interactive_page":61,"../rendering_container/page":63,"./renderer":56}],58:[function(require,module,exports){
var $, Assets, CssLoader, JsLoader, Semaphore;

$ = require('jquery');

JsLoader = require('./js_loader');

CssLoader = require('./css_loader');

Semaphore = require('../modules/semaphore');

module.exports = Assets = (function() {
  function Assets(_arg) {
    var disable;
    this.window = _arg.window, disable = _arg.disable;
    this.isDisabled = disable || false;
    this.cssLoader = new CssLoader(this.window);
    this.jsLoader = new JsLoader(this.window);
  }

  Assets.prototype.loadDependencies = function(dependencies, callback) {
    var dep, semaphore, _i, _j, _len, _len1, _ref, _ref1;
    semaphore = new Semaphore();
    semaphore.addCallback(callback);
    _ref = dependencies.js;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dep = _ref[_i];
      this.loadJs(dep, semaphore.wait());
    }
    _ref1 = dependencies.css;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      dep = _ref1[_j];
      this.loadCss(dep, semaphore.wait());
    }
    return semaphore.start();
  };

  Assets.prototype.loadDependency = function(dependency, callback) {
    if (dependency.isJs()) {
      return this.loadJs(dependency, callback);
    } else if (dependency.isCss()) {
      return this.loadCss(dependency, callback);
    }
  };

  Assets.prototype.loadJs = function(dependency, callback) {
    if (this.isDisabled) {
      return callback();
    }
    if (dependency.inline) {
      return this.jsLoader.loadInlineScript(dependency.code, callback);
    } else {
      return this.jsLoader.loadSingleUrl(dependency.src, callback);
    }
  };

  Assets.prototype.loadCss = function(dependency, callback) {
    if (this.isDisabled) {
      return callback();
    }
    if (dependency.inline) {
      return this.cssLoader.loadInlineStyles(dependency.code, callback);
    } else {
      return this.cssLoader.loadSingleUrl(dependency.src, callback);
    }
  };

  return Assets;

})();



},{"../modules/semaphore":49,"./css_loader":59,"./js_loader":62,"jquery":"cqNDv+"}],59:[function(require,module,exports){
var $, CssLoader;

$ = require('jquery');

module.exports = CssLoader = (function() {
  function CssLoader(window) {
    this.window = window;
    this.loadedUrls = [];
    this.loadedInlineStyles = [];
  }

  CssLoader.prototype.loadSingleUrl = function(url, callback) {
    var link;
    if (callback == null) {
      callback = function() {};
    }
    if (this.isUrlLoaded(url)) {
      return callback();
    }
    link = $('<link rel="stylesheet" type="text/css" />')[0];
    link.onload = callback;
    link.onerror = function() {
      console.warn("Stylesheet could not be loaded: " + url);
      return callback();
    };
    link.href = url;
    this.window.document.head.appendChild(link);
    return this.loadedUrls.push(url);
  };

  CssLoader.prototype.isUrlLoaded = function(url) {
    return this.loadedUrls.indexOf(url) >= 0;
  };

  CssLoader.prototype.loadInlineStyles = function(inlineStyles, callback) {
    var doc, styles;
    if (callback == null) {
      callback = function() {};
    }
    inlineStyles = this.prepareInlineStyles(inlineStyles);
    if (this.areInlineStylesLoaded(inlineStyles)) {
      return callback();
    }
    doc = this.window.document;
    styles = doc.createElement('style');
    styles.innerHTML = inlineStyles;
    doc.body.appendChild(styles);
    this.loadedInlineStyles.push(inlineStyles);
    return callback();
  };

  CssLoader.prototype.prepareInlineStyles = function(inlineStyles) {
    return inlineStyles.replace(/<style[^>]*>|<\/style>/gi, '');
  };

  CssLoader.prototype.areInlineStylesLoaded = function(inlineStyles) {
    return this.loadedInlineStyles.indexOf(inlineStyles) >= 0;
  };

  return CssLoader;

})();



},{"jquery":"cqNDv+"}],60:[function(require,module,exports){
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



},{"../configuration/config":23,"../interaction/component_drag":34,"../interaction/drag_base":36}],61:[function(require,module,exports){
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
      return this.assets.cssLoader.loadSingleUrl(config.livingdocsCssFile, this.readySemaphore.wait());
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
    return this.window.document.activeElement;
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



},{"../configuration/config":23,"../interaction/component_drag":34,"../interaction/dom":35,"../interaction/drag_base":36,"../interaction/editable_controller":37,"../interaction/focus":38,"./page":63}],62:[function(require,module,exports){
var JsLoader;

module.exports = JsLoader = (function() {
  function JsLoader(window) {
    this.window = window;
    this.loadedUrls = [];
    this.loadedScripts = [];
  }

  JsLoader.prototype.loadSingleUrl = function(path, callback) {
    var doc, el, head, loaded, onreadystatechange, readyState;
    if (callback == null) {
      callback = function() {};
    }
    if (this.isUrlLoaded(path)) {
      return callback();
    }
    doc = this.window.document;
    readyState = 'readyState';
    onreadystatechange = 'onreadystatechange';
    head = doc.getElementsByTagName('head')[0];
    el = doc.createElement('script');
    loaded = void 0;
    el.onload = el.onerror = el[onreadystatechange] = (function(_this) {
      return function() {
        if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) {
          return;
        }
        el.onload = el[onreadystatechange] = null;
        loaded = true;
        _this.loadedUrls.push(path);
        return callback();
      };
    })(this);
    el.async = true;
    el.src = path;
    return head.insertBefore(el, head.lastChild);
  };

  JsLoader.prototype.isUrlLoaded = function(url) {
    return this.loadedUrls.indexOf(url) >= 0;
  };

  JsLoader.prototype.loadInlineScript = function(codeBlock, callback) {
    var doc, script;
    if (callback == null) {
      callback = function() {};
    }
    codeBlock = this.prepareInlineCode(codeBlock);
    if (this.isInlineBlockLoaded(codeBlock)) {
      return callback();
    }
    doc = this.window.document;
    script = doc.createElement('script');
    script.innerHTML = codeBlock;
    doc.body.appendChild(script);
    this.loadedScripts.push(codeBlock);
    return callback();
  };

  JsLoader.prototype.prepareInlineCode = function(codeBlock) {
    return codeBlock.replace(/<script[^>]*>|<\/script>/gi, '');
  };

  JsLoader.prototype.isInlineBlockLoaded = function(codeBlock) {
    return this.loadedScripts.indexOf(codeBlock) >= 0;
  };

  return JsLoader;

})();



},{}],63:[function(require,module,exports){
var $, Assets, Page, RenderingContainer, config,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

$ = require('jquery');

RenderingContainer = require('./rendering_container');

Assets = require('./assets');

config = require('../configuration/config');

module.exports = Page = (function(_super) {
  __extends(Page, _super);

  function Page(_arg) {
    var hostWindow, preventAssetLoading, readOnly, renderNode, _ref;
    _ref = _arg != null ? _arg : {}, renderNode = _ref.renderNode, readOnly = _ref.readOnly, hostWindow = _ref.hostWindow, this.documentDependencies = _ref.documentDependencies, this.design = _ref.design, this.componentTree = _ref.componentTree, this.loadResources = _ref.loadResources;
    this.loadAssets = __bind(this.loadAssets, this);
    if (this.loadResources == null) {
      this.loadResources = config.loadResources;
    }
    if (readOnly != null) {
      this.isReadOnly = readOnly;
    }
    this.renderNode = (renderNode != null ? renderNode.jquery : void 0) ? renderNode[0] : renderNode;
    this.setWindow(hostWindow);
    if (this.renderNode == null) {
      this.renderNode = $("." + config.css.section, this.$body);
    }
    Page.__super__.constructor.call(this);
    preventAssetLoading = !this.loadResources;
    this.assets = new Assets({
      window: this.window,
      disable: preventAssetLoading
    });
    this.loadAssets();
  }

  Page.prototype.beforeReady = function() {
    this.readySemaphore.wait();
    return setTimeout((function(_this) {
      return function() {
        return _this.readySemaphore.decrement();
      };
    })(this), 0);
  };

  Page.prototype.loadAssets = function() {
    if (this.design != null) {
      this.assets.loadDependencies(this.design.dependencies, this.readySemaphore.wait());
    }
    if (this.documentDependencies != null) {
      this.assets.loadDependencies(this.documentDependencies, this.readySemaphore.wait());
      return this.documentDependencies.dependencyAdded.add((function(_this) {
        return function(dependency) {
          return _this.assets.loadDependency(dependency);
        };
      })(this));
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



},{"../configuration/config":23,"./assets":58,"./rendering_container":64,"jquery":"cqNDv+"}],64:[function(require,module,exports){
var $, RenderingContainer, Semaphore;

$ = require('jquery');

Semaphore = require('../modules/semaphore');

module.exports = RenderingContainer = (function() {
  RenderingContainer.prototype.isReadOnly = true;

  function RenderingContainer() {
    if (this.renderNode == null) {
      this.renderNode = $('<div>')[0];
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



},{"../modules/semaphore":49,"jquery":"cqNDv+"}],65:[function(require,module,exports){
var $, Directive, dom, editorConfig;

$ = require('jquery');

editorConfig = require('../configuration/config');

dom = require('../interaction/dom');

module.exports = Directive = (function() {
  function Directive(_arg) {
    var config, name;
    name = _arg.name, this.type = _arg.type, this.elem = _arg.elem, config = _arg.config;
    this.config = Object.create(editorConfig.directives[this.type]);
    this.name = name || this.config.defaultName;
    this.setConfig(config);
    this.optional = false;
  }

  Directive.prototype.setConfig = function(config) {
    return $.extend(this.config, config);
  };

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
      type: this.type,
      config: this.config
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



},{"../configuration/config":23,"../interaction/dom":35,"jquery":"cqNDv+"}],66:[function(require,module,exports){
var $, Directive, DirectiveCollection, assert, config;

$ = require('jquery');

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



},{"../configuration/config":23,"../modules/logging/assert":46,"./directive":65,"jquery":"cqNDv+"}],67:[function(require,module,exports){
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



},{"../configuration/config":23,"./directive":65}],68:[function(require,module,exports){
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



},{"../configuration/config":23}],69:[function(require,module,exports){
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



},{"../configuration/config":23}],70:[function(require,module,exports){
var $, ComponentModel, ComponentView, DirectiveCollection, DirectiveIterator, Template, assert, config, directiveCompiler, directiveFinder, log, sortByName, words;

$ = require('jquery');

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



},{"../component_tree/component_model":16,"../configuration/config":23,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/words":51,"../rendering/component_view":52,"./directive_collection":66,"./directive_compiler":67,"./directive_finder":68,"./directive_iterator":69,"jquery":"cqNDv+"}],71:[function(require,module,exports){
module.exports={
  "version": "0.4.4",
  "revision": "b01f225"
}

},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9rZXlzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvanNjaGVtZS9saWIvanNjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3Byb3BlcnR5X3ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3NjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3R5cGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi92YWxpZGF0aW9uX2Vycm9ycy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3ZhbGlkYXRvcnMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy93b2xmeTg3LWV2ZW50ZW1pdHRlci9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9kaXJlY3RpdmVfZmFjdG9yeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvZWRpdGFibGVfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2ltYWdlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9jc3NfbW9kaWZpY2F0b3JfcHJvcGVydHkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fY29uZmlnX3NjaGVtYS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3BhcnNlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vaW1hZ2VfcmF0aW8uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL3ZlcnNpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvZGVmYXVsdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvcmVzcmNpdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9saXZpbmdkb2MuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9qcXVlcnlfYnJvd3NlcmlmeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vcmRlcmVkX2hhc2guY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2NvbXBvbmVudF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZXBlbmRlbmNpZXMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2RlcGVuZGVuY2llc190b19odG1sLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZXBlbmRlbmN5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZW5kZXJlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Fzc2V0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9qc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvdmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGRBLElBQUEsMkdBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx3QkFBUixDQUFULENBQUE7O0FBQUEsYUFDQSxHQUFnQixPQUFBLENBQVEsZ0NBQVIsQ0FEaEIsQ0FBQTs7QUFBQSxTQUVBLEdBQVksT0FBQSxDQUFRLGFBQVIsQ0FGWixDQUFBOztBQUFBLGFBR0EsR0FBZ0IsT0FBQSxDQUFRLGlDQUFSLENBSGhCLENBQUE7O0FBQUEsV0FJQSxHQUFjLE9BQUEsQ0FBUSx1QkFBUixDQUpkLENBQUE7O0FBQUEsVUFLQSxHQUFhLE9BQUEsQ0FBUSxtQ0FBUixDQUxiLENBQUE7O0FBQUEsUUFNQSxHQUFXLE9BQUEsQ0FBUSxpQ0FBUixDQU5YLENBQUE7O0FBQUEsU0FPQSxHQUFZLE9BQUEsQ0FBUSxrQ0FBUixDQVBaLENBQUE7O0FBQUEsT0FRQSxHQUFVLE9BQUEsQ0FBUSxZQUFSLENBUlYsQ0FBQTs7QUFBQSxNQVVNLENBQUMsT0FBUCxHQUFpQixHQUFBLEdBQVMsQ0FBQSxTQUFBLEdBQUE7QUFFeEIsTUFBQSxVQUFBO0FBQUEsRUFBQSxVQUFBLEdBQWlCLElBQUEsVUFBQSxDQUFBLENBQWpCLENBQUE7U0FHQTtBQUFBLElBQUEsT0FBQSxFQUFTLE9BQU8sQ0FBQyxPQUFqQjtBQUFBLElBQ0EsUUFBQSxFQUFVLE9BQU8sQ0FBQyxRQURsQjtBQUFBLElBY0EsTUFBQSxFQUFRLFdBZFI7QUFBQSxJQWtCQSxTQUFBLEVBQVcsU0FsQlg7QUFBQSxJQW1CQSxhQUFBLEVBQWUsYUFuQmY7QUFBQSxJQXlDQSxlQUFBLEVBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsVUFBQSwyQkFBQTtBQUFBLE1BRGtCLFlBQUEsTUFBTSxjQUFBLFFBQVEscUJBQUEsYUFDaEMsQ0FBQTthQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCO0FBQUEsUUFBRSxNQUFBLElBQUY7QUFBQSxRQUFRLFVBQUEsRUFBWSxNQUFwQjtBQUFBLFFBQTRCLGVBQUEsYUFBNUI7T0FBakIsRUFEZTtJQUFBLENBekNqQjtBQUFBLElBOENBLEtBQUEsRUFBSyxTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsZUFBZSxDQUFDLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLFNBQTdCLEVBQUg7SUFBQSxDQTlDTDtBQUFBLElBK0NBLE1BQUEsRUFBUSxTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsZUFBZSxDQUFDLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLFNBQTdCLEVBQUg7SUFBQSxDQS9DUjtBQUFBLElBbURBLFNBQUEsRUFBVyxDQUFDLENBQUMsS0FBRixDQUFRLFVBQVIsRUFBb0IsV0FBcEIsQ0FuRFg7QUFBQSxJQXVEQSxNQUFBLEVBQVEsU0FBQyxVQUFELEdBQUE7QUFDTixNQUFBLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLE1BQWYsRUFBdUIsVUFBdkIsQ0FBQSxDQUFBO2FBQ0EsYUFBQSxDQUFjLE1BQWQsRUFGTTtJQUFBLENBdkRSO0FBQUEsSUE2REEsUUFBQSxFQUFVLFFBN0RWO0FBQUEsSUE4REEsU0FBQSxFQUFXLFNBOURYO0lBTHdCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FWdkIsQ0FBQTs7QUFBQSxNQW1GTSxDQUFDLEdBQVAsR0FBYSxHQW5GYixDQUFBOzs7OztBQ0dBLElBQUEsY0FBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUlSLEVBQUEsd0JBQUUsVUFBRixHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsYUFBQSxVQUNiLENBQUE7O01BQUEsSUFBQyxDQUFBLGFBQWM7S0FBZjtBQUFBLElBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FEQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSwyQkFLQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7QUFDakIsUUFBQSw2QkFBQTtBQUFBO0FBQUEsU0FBQSwyREFBQTsyQkFBQTtBQUNFLE1BQUEsSUFBRSxDQUFBLEtBQUEsQ0FBRixHQUFXLE1BQVgsQ0FERjtBQUFBLEtBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUh0QixDQUFBO0FBSUEsSUFBQSxJQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBZjtBQUNFLE1BQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFFLENBQUEsQ0FBQSxDQUFYLENBQUE7YUFDQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUUsQ0FBQSxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosR0FBcUIsQ0FBckIsRUFGWjtLQUxpQjtFQUFBLENBTG5CLENBQUE7O0FBQUEsMkJBZUEsSUFBQSxHQUFNLFNBQUMsUUFBRCxHQUFBO0FBQ0osUUFBQSx5QkFBQTtBQUFBO0FBQUEsU0FBQSwyQ0FBQTsyQkFBQTtBQUNFLE1BQUEsUUFBQSxDQUFTLFNBQVQsQ0FBQSxDQURGO0FBQUEsS0FBQTtXQUdBLEtBSkk7RUFBQSxDQWZOLENBQUE7O0FBQUEsMkJBc0JBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixJQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxTQUFELEdBQUE7YUFDSixTQUFTLENBQUMsTUFBVixDQUFBLEVBREk7SUFBQSxDQUFOLENBQUEsQ0FBQTtXQUdBLEtBSk07RUFBQSxDQXRCUixDQUFBOzt3QkFBQTs7SUFKRixDQUFBOzs7OztBQ0hBLElBQUEsMEJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsTUFhTSxDQUFDLE9BQVAsR0FBdUI7QUFHUixFQUFBLDRCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsTUFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHVCQUFBLGlCQUFpQixJQUFDLENBQUEsWUFBQSxNQUFNLGNBQUEsTUFDdkMsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxjQUFWLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLElBQUQsR0FBUSxNQURqQixDQURXO0VBQUEsQ0FBYjs7QUFBQSwrQkFLQSxPQUFBLEdBQVMsU0FBQyxTQUFELEdBQUE7QUFDUCxJQUFBLElBQUcsSUFBQyxDQUFBLEtBQUo7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLEtBQWYsRUFBc0IsU0FBdEIsQ0FBQSxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBakIsQ0FBQSxDQUhGO0tBQUE7V0FLQSxLQU5PO0VBQUEsQ0FMVCxDQUFBOztBQUFBLCtCQWNBLE1BQUEsR0FBUSxTQUFDLFNBQUQsR0FBQTtBQUNOLElBQUEsSUFBRyxJQUFDLENBQUEsZUFBSjtBQUNFLE1BQUEsTUFBQSxDQUFPLFNBQUEsS0FBZSxJQUFDLENBQUEsZUFBdkIsRUFBd0MsbUNBQXhDLENBQUEsQ0FERjtLQUFBO0FBR0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFKO0FBQ0UsTUFBQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLFNBQXBCLENBQUEsQ0FERjtLQUFBLE1BQUE7QUFHRSxNQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLFNBQWpCLENBQUEsQ0FIRjtLQUhBO1dBUUEsS0FUTTtFQUFBLENBZFIsQ0FBQTs7QUFBQSwrQkEwQkEsWUFBQSxHQUFjLFNBQUMsU0FBRCxFQUFZLGlCQUFaLEdBQUE7QUFDWixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQVUsU0FBUyxDQUFDLFFBQVYsS0FBc0IsaUJBQWhDO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFBLEtBQWUsaUJBQXRCLEVBQXlDLHVDQUF6QyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLFNBQVMsQ0FBQyxRQUFwQjtBQUFBLE1BQ0EsSUFBQSxFQUFNLFNBRE47QUFBQSxNQUVBLGVBQUEsRUFBaUIsU0FBUyxDQUFDLGVBRjNCO0tBSkYsQ0FBQTtXQVFBLElBQUMsQ0FBQSxlQUFELENBQWlCLGlCQUFqQixFQUFvQyxRQUFwQyxFQVRZO0VBQUEsQ0ExQmQsQ0FBQTs7QUFBQSwrQkFzQ0EsV0FBQSxHQUFhLFNBQUMsU0FBRCxFQUFZLGlCQUFaLEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQUFBLElBQVUsU0FBUyxDQUFDLElBQVYsS0FBa0IsaUJBQTVCO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFBLEtBQWUsaUJBQXRCLEVBQXlDLHNDQUF6QyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLFNBQVY7QUFBQSxNQUNBLElBQUEsRUFBTSxTQUFTLENBQUMsSUFEaEI7QUFBQSxNQUVBLGVBQUEsRUFBaUIsU0FBUyxDQUFDLGVBRjNCO0tBSkYsQ0FBQTtXQVFBLElBQUMsQ0FBQSxlQUFELENBQWlCLGlCQUFqQixFQUFvQyxRQUFwQyxFQVRXO0VBQUEsQ0F0Q2IsQ0FBQTs7QUFBQSwrQkFrREEsRUFBQSxHQUFJLFNBQUMsU0FBRCxHQUFBO0FBQ0YsSUFBQSxJQUFHLDBCQUFIO2FBQ0UsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFTLENBQUMsUUFBeEIsRUFBa0MsU0FBbEMsRUFERjtLQURFO0VBQUEsQ0FsREosQ0FBQTs7QUFBQSwrQkF1REEsSUFBQSxHQUFNLFNBQUMsU0FBRCxHQUFBO0FBQ0osSUFBQSxJQUFHLHNCQUFIO2FBQ0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxTQUFTLENBQUMsSUFBdkIsRUFBNkIsU0FBN0IsRUFERjtLQURJO0VBQUEsQ0F2RE4sQ0FBQTs7QUFBQSwrQkE0REEsZ0JBQUEsR0FBa0IsU0FBQSxHQUFBO0FBQ2hCLFFBQUEsSUFBQTtXQUFBLElBQUMsQ0FBQSxhQUFELGlEQUFrQyxDQUFFLHdCQURwQjtFQUFBLENBNURsQixDQUFBOztBQUFBLCtCQWlFQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7QUFDSixRQUFBLG1CQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLEtBQWIsQ0FBQTtBQUNBO1dBQU8sU0FBUCxHQUFBO0FBQ0UsTUFBQSxTQUFTLENBQUMsa0JBQVYsQ0FBNkIsUUFBN0IsQ0FBQSxDQUFBO0FBQUEsb0JBQ0EsU0FBQSxHQUFZLFNBQVMsQ0FBQyxLQUR0QixDQURGO0lBQUEsQ0FBQTtvQkFGSTtFQUFBLENBakVOLENBQUE7O0FBQUEsK0JBd0VBLGFBQUEsR0FBZSxTQUFDLFFBQUQsR0FBQTtBQUNiLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTtBQUNKLFVBQUEsd0NBQUE7QUFBQTtBQUFBO1dBQUEsWUFBQTt3Q0FBQTtBQUNFLHNCQUFBLFFBQUEsQ0FBUyxrQkFBVCxFQUFBLENBREY7QUFBQTtzQkFESTtJQUFBLENBQU4sRUFGYTtFQUFBLENBeEVmLENBQUE7O0FBQUEsK0JBZ0ZBLEdBQUEsR0FBSyxTQUFDLFFBQUQsR0FBQTtBQUNILElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTtBQUNKLFVBQUEsd0NBQUE7QUFBQSxNQUFBLFFBQUEsQ0FBUyxTQUFULENBQUEsQ0FBQTtBQUNBO0FBQUE7V0FBQSxZQUFBO3dDQUFBO0FBQ0Usc0JBQUEsUUFBQSxDQUFTLGtCQUFULEVBQUEsQ0FERjtBQUFBO3NCQUZJO0lBQUEsQ0FBTixFQUZHO0VBQUEsQ0FoRkwsQ0FBQTs7QUFBQSwrQkF3RkEsTUFBQSxHQUFRLFNBQUMsU0FBRCxHQUFBO0FBQ04sSUFBQSxTQUFTLENBQUMsT0FBVixDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixTQUFsQixFQUZNO0VBQUEsQ0F4RlIsQ0FBQTs7QUFBQSwrQkFvR0EsZUFBQSxHQUFpQixTQUFDLFNBQUQsRUFBWSxRQUFaLEdBQUE7QUFDZixRQUFBLG1CQUFBOztNQUQyQixXQUFXO0tBQ3RDO0FBQUEsSUFBQSxJQUFBLEdBQU8sQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNMLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBTixFQUFpQixRQUFqQixFQURLO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUCxDQUFBO0FBR0EsSUFBQSxJQUFHLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0FBbkI7YUFDRSxhQUFhLENBQUMsa0JBQWQsQ0FBaUMsU0FBakMsRUFBNEMsSUFBNUMsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFBLENBQUEsRUFIRjtLQUplO0VBQUEsQ0FwR2pCLENBQUE7O0FBQUEsK0JBc0hBLGdCQUFBLEdBQWtCLFNBQUMsU0FBRCxHQUFBO0FBQ2hCLFFBQUEsbUJBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ0wsS0FBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBREs7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFQLENBQUE7QUFHQSxJQUFBLElBQUcsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFuQjthQUNFLGFBQWEsQ0FBQyxrQkFBZCxDQUFpQyxTQUFqQyxFQUE0QyxJQUE1QyxFQURGO0tBQUEsTUFBQTthQUdFLElBQUEsQ0FBQSxFQUhGO0tBSmdCO0VBQUEsQ0F0SGxCLENBQUE7O0FBQUEsK0JBaUlBLElBQUEsR0FBTSxTQUFDLFNBQUQsRUFBWSxRQUFaLEdBQUE7QUFDSixJQUFBLElBQXNCLFNBQVMsQ0FBQyxlQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLENBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxRQUFRLENBQUMsb0JBQVQsUUFBUSxDQUFDLGtCQUFvQixLQUY3QixDQUFBO1dBR0EsSUFBQyxDQUFBLG9CQUFELENBQXNCLFNBQXRCLEVBQWlDLFFBQWpDLEVBSkk7RUFBQSxDQWpJTixDQUFBOztBQUFBLCtCQXlJQSxNQUFBLEdBQVEsU0FBQyxTQUFELEdBQUE7QUFDTixRQUFBLHNCQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksU0FBUyxDQUFDLGVBQXRCLENBQUE7QUFDQSxJQUFBLElBQUcsU0FBSDtBQUdFLE1BQUEsSUFBd0MsMEJBQXhDO0FBQUEsUUFBQSxTQUFTLENBQUMsS0FBVixHQUFrQixTQUFTLENBQUMsSUFBNUIsQ0FBQTtPQUFBO0FBQ0EsTUFBQSxJQUEyQyxzQkFBM0M7QUFBQSxRQUFBLFNBQVMsQ0FBQyxJQUFWLEdBQWlCLFNBQVMsQ0FBQyxRQUEzQixDQUFBO09BREE7O1lBSWMsQ0FBRSxRQUFoQixHQUEyQixTQUFTLENBQUM7T0FKckM7O2FBS2tCLENBQUUsSUFBcEIsR0FBMkIsU0FBUyxDQUFDO09BTHJDO2FBT0EsSUFBQyxDQUFBLG9CQUFELENBQXNCLFNBQXRCLEVBQWlDLEVBQWpDLEVBVkY7S0FGTTtFQUFBLENBeklSLENBQUE7O0FBQUEsK0JBeUpBLG9CQUFBLEdBQXNCLFNBQUMsU0FBRCxFQUFZLElBQVosR0FBQTtBQUNwQixRQUFBLCtCQUFBO0FBQUEsSUFEa0MsdUJBQUEsaUJBQWlCLGdCQUFBLFVBQVUsWUFBQSxJQUM3RCxDQUFBO0FBQUEsSUFBQSxTQUFTLENBQUMsZUFBVixHQUE0QixlQUE1QixDQUFBO0FBQUEsSUFDQSxTQUFTLENBQUMsUUFBVixHQUFxQixRQURyQixDQUFBO0FBQUEsSUFFQSxTQUFTLENBQUMsSUFBVixHQUFpQixJQUZqQixDQUFBO0FBSUEsSUFBQSxJQUFHLGVBQUg7QUFDRSxNQUFBLElBQTZCLFFBQTdCO0FBQUEsUUFBQSxRQUFRLENBQUMsSUFBVCxHQUFnQixTQUFoQixDQUFBO09BQUE7QUFDQSxNQUFBLElBQTZCLElBQTdCO0FBQUEsUUFBQSxJQUFJLENBQUMsUUFBTCxHQUFnQixTQUFoQixDQUFBO09BREE7QUFFQSxNQUFBLElBQXlDLDBCQUF6QztBQUFBLFFBQUEsZUFBZSxDQUFDLEtBQWhCLEdBQXdCLFNBQXhCLENBQUE7T0FGQTtBQUdBLE1BQUEsSUFBd0Msc0JBQXhDO2VBQUEsZUFBZSxDQUFDLElBQWhCLEdBQXVCLFVBQXZCO09BSkY7S0FMb0I7RUFBQSxDQXpKdEIsQ0FBQTs7NEJBQUE7O0lBaEJGLENBQUE7Ozs7O0FDR0EsSUFBQSxrQkFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUdSLEVBQUEsNEJBQUMsSUFBRCxHQUFBO0FBQ1gsSUFEYyxJQUFDLENBQUEsaUJBQUEsV0FBVyxJQUFDLENBQUEseUJBQUEsaUJBQzNCLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQTNCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBRDNCLENBRFc7RUFBQSxDQUFiOztBQUFBLCtCQUtBLFVBQUEsR0FBWSxTQUFBLEdBQUE7V0FDVixJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsSUFBRCxFQURUO0VBQUEsQ0FMWixDQUFBOztBQUFBLCtCQVNBLFVBQUEsR0FBWSxTQUFDLEtBQUQsR0FBQTtXQUNWLElBQUMsQ0FBQSxTQUFTLENBQUMsVUFBWCxDQUFzQixJQUFDLENBQUEsSUFBdkIsRUFBNkIsS0FBN0IsRUFEVTtFQUFBLENBVFosQ0FBQTs7QUFBQSwrQkFlQSxPQUFBLEdBQVMsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO0FBQ1AsUUFBQSx3QkFBQTtBQUFBLElBQUEsU0FBQSxHQUFhLEdBQUEsR0FBaEIsSUFBQyxDQUFBLElBQWUsR0FBVyxXQUF4QixDQUFBO0FBQUEsSUFDQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBWCxDQUFtQixTQUFuQixDQURoQixDQUFBOztNQUVBLGdCQUFpQjtLQUZqQjtBQUFBLElBR0EsYUFBYyxDQUFBLEdBQUEsQ0FBZCxHQUFxQixLQUhyQixDQUFBO1dBSUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFYLENBQW1CLFNBQW5CLEVBQThCLGFBQTlCLEVBTE87RUFBQSxDQWZULENBQUE7O0FBQUEsK0JBdUJBLE9BQUEsR0FBUyxTQUFDLEdBQUQsR0FBQTtBQUNQLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBRyxHQUFIOzZGQUNpRCxDQUFBLEdBQUEsV0FEakQ7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFXLENBQUMsR0FBQSxHQUE1QixJQUFDLENBQUEsSUFBMkIsR0FBVyxXQUFaLEVBSHhCO0tBRE87RUFBQSxDQXZCVCxDQUFBOztBQUFBLCtCQStCQSxNQUFBLEdBQVEsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO0FBQ04sSUFBQSxJQUFDLENBQUEsR0FBRCxHQUFPLEVBQVAsQ0FBQTtXQUNBLElBQUMsQ0FBQSxHQUFJLENBQUEsR0FBQSxDQUFMLEdBQVksTUFGTjtFQUFBLENBL0JSLENBQUE7O0FBQUEsK0JBb0NBLE1BQUEsR0FBUSxTQUFDLEdBQUQsR0FBQTtBQUNOLFFBQUEsSUFBQTsyQ0FBTSxDQUFBLEdBQUEsV0FEQTtFQUFBLENBcENSLENBQUE7OzRCQUFBOztJQUhGLENBQUE7Ozs7O0FDSEEsSUFBQSxzRUFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxZQUNBLEdBQWUsT0FBQSxDQUFRLGlDQUFSLENBRGYsQ0FBQTs7QUFBQSxpQkFHQSxHQUFvQixPQUFBLENBQVEsc0JBQVIsQ0FIcEIsQ0FBQTs7QUFBQSxjQUlBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUixDQUpqQixDQUFBOztBQUFBLGFBS0EsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSLENBTGhCLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FFRTtBQUFBLEVBQUEsTUFBQSxFQUFRLFNBQUMsSUFBRCxHQUFBO0FBQ04sUUFBQSx1Q0FBQTtBQUFBLElBRFMsaUJBQUEsV0FBVyx5QkFBQSxpQkFDcEIsQ0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixpQkFBaUIsQ0FBQyxJQUEzQyxDQUFaLENBQUE7V0FDSSxJQUFBLFNBQUEsQ0FBVTtBQUFBLE1BQUUsV0FBQSxTQUFGO0FBQUEsTUFBYSxtQkFBQSxpQkFBYjtLQUFWLEVBRkU7RUFBQSxDQUFSO0FBQUEsRUFLQSx1QkFBQSxFQUF5QixTQUFDLGFBQUQsR0FBQTtBQUN2QixZQUFPLGFBQVA7QUFBQSxXQUNPLFVBRFA7ZUFFSSxrQkFGSjtBQUFBLFdBR08sT0FIUDtlQUlJLGVBSko7QUFBQSxXQUtPLE1BTFA7ZUFNSSxjQU5KO0FBQUE7ZUFRSSxNQUFBLENBQU8sS0FBUCxFQUFlLG1DQUFBLEdBQXRCLGFBQU8sRUFSSjtBQUFBLEtBRHVCO0VBQUEsQ0FMekI7Q0FURixDQUFBOzs7OztBQ0FBLElBQUEsK0dBQUE7O0FBQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxZQUFSLENBQVosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBRFQsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsdUJBQVIsQ0FGckIsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sT0FBQSxDQUFRLGlCQUFSLENBSFAsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBSk4sQ0FBQTs7QUFBQSxNQUtBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBTFQsQ0FBQTs7QUFBQSxnQkFNQSxHQUFtQixPQUFBLENBQVEsK0JBQVIsQ0FObkIsQ0FBQTs7QUFBQSxtQkFPQSxHQUFzQixPQUFBLENBQVEsa0NBQVIsQ0FQdEIsQ0FBQTs7QUFBQSxNQXVCTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLHdCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsUUFBQTtBQUFBLDBCQURZLE9BQW9CLElBQWxCLElBQUMsQ0FBQSxnQkFBQSxVQUFVLFVBQUEsRUFDekIsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFSLEVBQWtCLHlEQUFsQixDQUFBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxvQkFBRCxDQUFBLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFKZCxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsRUFBRCxHQUFNLEVBQUEsSUFBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBTFosQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQU4zQixDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsSUFBRCxHQUFRLE1BUlIsQ0FBQTtBQUFBLElBU0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxNQVRaLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE1BVmpCLENBRFc7RUFBQSxDQUFiOztBQUFBLDJCQWNBLG9CQUFBLEdBQXNCLFNBQUEsR0FBQTtBQUNwQixRQUFBLG1DQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsVUFBRCxHQUFrQixJQUFBLG1CQUFBLENBQUEsQ0FBbEIsQ0FBQTtBQUVBO0FBQUE7U0FBQSwyQ0FBQTsyQkFBQTtBQUNFLGNBQU8sU0FBUyxDQUFDLElBQWpCO0FBQUEsYUFDTyxXQURQO0FBRUksVUFBQSxJQUFDLENBQUEsZUFBRCxJQUFDLENBQUEsYUFBZSxHQUFoQixDQUFBO0FBQUEsd0JBQ0EsSUFBQyxDQUFBLFVBQVcsQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFaLEdBQWtDLElBQUEsa0JBQUEsQ0FDaEM7QUFBQSxZQUFBLElBQUEsRUFBTSxTQUFTLENBQUMsSUFBaEI7QUFBQSxZQUNBLGVBQUEsRUFBaUIsSUFEakI7V0FEZ0MsRUFEbEMsQ0FGSjtBQUNPO0FBRFAsYUFNTyxVQU5QO0FBQUEsYUFNbUIsT0FObkI7QUFBQSxhQU00QixNQU41QjtBQU9JLFVBQUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLFNBQTFCLENBQUEsQ0FBQTtBQUFBLFVBQ0EsSUFBQyxDQUFBLFlBQUQsSUFBQyxDQUFBLFVBQVksR0FEYixDQUFBO0FBQUEsd0JBRUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFULEdBQTJCLE9BRjNCLENBUEo7QUFNNEI7QUFONUI7QUFXSSx3QkFBQSxHQUFHLENBQUMsS0FBSixDQUFXLDJCQUFBLEdBQXBCLFNBQVMsQ0FBQyxJQUFVLEdBQTRDLHFDQUF2RCxFQUFBLENBWEo7QUFBQSxPQURGO0FBQUE7b0JBSG9CO0VBQUEsQ0FkdEIsQ0FBQTs7QUFBQSwyQkFpQ0Esd0JBQUEsR0FBMEIsU0FBQyxpQkFBRCxHQUFBO1dBQ3hCLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixnQkFBZ0IsQ0FBQyxNQUFqQixDQUNkO0FBQUEsTUFBQSxTQUFBLEVBQVcsSUFBWDtBQUFBLE1BQ0EsaUJBQUEsRUFBbUIsaUJBRG5CO0tBRGMsQ0FBaEIsRUFEd0I7RUFBQSxDQWpDMUIsQ0FBQTs7QUFBQSwyQkEyQ0EsVUFBQSxHQUFZLFNBQUMsVUFBRCxHQUFBO1dBQ1YsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLElBQXJCLEVBQTJCLFVBQTNCLEVBRFU7RUFBQSxDQTNDWixDQUFBOztBQUFBLDJCQStDQSxXQUFBLEdBQWEsU0FBQSxHQUFBO1dBQ1gsSUFBQyxDQUFBLGFBQWEsQ0FBQyxvQkFBZixDQUFvQyxJQUFJLENBQUMsRUFBekMsRUFEVztFQUFBLENBL0NiLENBQUE7O0FBQUEsMkJBdURBLE1BQUEsR0FBUSxTQUFDLGNBQUQsR0FBQTtBQUNOLElBQUEsSUFBRyxjQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLFlBQWpCLENBQThCLElBQTlCLEVBQW9DLGNBQXBDLENBQUEsQ0FBQTthQUNBLEtBRkY7S0FBQSxNQUFBO2FBSUUsSUFBQyxDQUFBLFNBSkg7S0FETTtFQUFBLENBdkRSLENBQUE7O0FBQUEsMkJBZ0VBLEtBQUEsR0FBTyxTQUFDLGNBQUQsR0FBQTtBQUNMLElBQUEsSUFBRyxjQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLFdBQWpCLENBQTZCLElBQTdCLEVBQW1DLGNBQW5DLENBQUEsQ0FBQTthQUNBLEtBRkY7S0FBQSxNQUFBO2FBSUUsSUFBQyxDQUFBLEtBSkg7S0FESztFQUFBLENBaEVQLENBQUE7O0FBQUEsMkJBeUVBLE1BQUEsR0FBUSxTQUFDLGFBQUQsRUFBZ0IsY0FBaEIsR0FBQTtBQUNOLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixLQUFvQixDQUF2QjtBQUNFLE1BQUEsY0FBQSxHQUFpQixhQUFqQixDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFdBRDVDLENBREY7S0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQVcsQ0FBQSxhQUFBLENBQWMsQ0FBQyxNQUEzQixDQUFrQyxjQUFsQyxDQUpBLENBQUE7V0FLQSxLQU5NO0VBQUEsQ0F6RVIsQ0FBQTs7QUFBQSwyQkFtRkEsT0FBQSxHQUFTLFNBQUMsYUFBRCxFQUFnQixjQUFoQixHQUFBO0FBQ1AsSUFBQSxJQUFHLFNBQVMsQ0FBQyxNQUFWLEtBQW9CLENBQXZCO0FBQ0UsTUFBQSxjQUFBLEdBQWlCLGFBQWpCLENBQUE7QUFBQSxNQUNBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsV0FENUMsQ0FERjtLQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsVUFBVyxDQUFBLGFBQUEsQ0FBYyxDQUFDLE9BQTNCLENBQW1DLGNBQW5DLENBSkEsQ0FBQTtXQUtBLEtBTk87RUFBQSxDQW5GVCxDQUFBOztBQUFBLDJCQTZGQSxFQUFBLEdBQUksU0FBQSxHQUFBO0FBQ0YsSUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLEVBQWpCLENBQW9CLElBQXBCLENBQUEsQ0FBQTtXQUNBLEtBRkU7RUFBQSxDQTdGSixDQUFBOztBQUFBLDJCQW1HQSxJQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ0osSUFBQSxJQUFDLENBQUEsZUFBZSxDQUFDLElBQWpCLENBQXNCLElBQXRCLENBQUEsQ0FBQTtXQUNBLEtBRkk7RUFBQSxDQW5HTixDQUFBOztBQUFBLDJCQXlHQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sSUFBQyxDQUFBLGVBQWUsQ0FBQyxNQUFqQixDQUF3QixJQUF4QixFQURNO0VBQUEsQ0F6R1IsQ0FBQTs7QUFBQSwyQkFrSEEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNSLFFBQUEsSUFBQTt1REFBZ0IsQ0FBRSx5QkFEVjtFQUFBLENBbEhYLENBQUE7O0FBQUEsMkJBc0hBLE9BQUEsR0FBUyxTQUFDLFFBQUQsR0FBQTtBQUNQLFFBQUEsd0JBQUE7QUFBQSxJQUFBLGNBQUEsR0FBaUIsSUFBakIsQ0FBQTtBQUNBO1dBQU0sQ0FBQyxjQUFBLEdBQWlCLGNBQWMsQ0FBQyxTQUFmLENBQUEsQ0FBbEIsQ0FBTixHQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLGNBQVQsRUFBQSxDQURGO0lBQUEsQ0FBQTtvQkFGTztFQUFBLENBdEhULENBQUE7O0FBQUEsMkJBNEhBLFFBQUEsR0FBVSxTQUFDLFFBQUQsR0FBQTtBQUNSLFFBQUEsd0RBQUE7QUFBQTtBQUFBO1NBQUEsWUFBQTtzQ0FBQTtBQUNFLE1BQUEsY0FBQSxHQUFpQixrQkFBa0IsQ0FBQyxLQUFwQyxDQUFBO0FBQUE7O0FBQ0E7ZUFBTyxjQUFQLEdBQUE7QUFDRSxVQUFBLFFBQUEsQ0FBUyxjQUFULENBQUEsQ0FBQTtBQUFBLHlCQUNBLGNBQUEsR0FBaUIsY0FBYyxDQUFDLEtBRGhDLENBREY7UUFBQSxDQUFBOztXQURBLENBREY7QUFBQTtvQkFEUTtFQUFBLENBNUhWLENBQUE7O0FBQUEsMkJBb0lBLFdBQUEsR0FBYSxTQUFDLFFBQUQsR0FBQTtBQUNYLFFBQUEsd0RBQUE7QUFBQTtBQUFBO1NBQUEsWUFBQTtzQ0FBQTtBQUNFLE1BQUEsY0FBQSxHQUFpQixrQkFBa0IsQ0FBQyxLQUFwQyxDQUFBO0FBQUE7O0FBQ0E7ZUFBTyxjQUFQLEdBQUE7QUFDRSxVQUFBLFFBQUEsQ0FBUyxjQUFULENBQUEsQ0FBQTtBQUFBLFVBQ0EsY0FBYyxDQUFDLFdBQWYsQ0FBMkIsUUFBM0IsQ0FEQSxDQUFBO0FBQUEseUJBRUEsY0FBQSxHQUFpQixjQUFjLENBQUMsS0FGaEMsQ0FERjtRQUFBLENBQUE7O1dBREEsQ0FERjtBQUFBO29CQURXO0VBQUEsQ0FwSWIsQ0FBQTs7QUFBQSwyQkE2SUEsa0JBQUEsR0FBb0IsU0FBQyxRQUFELEdBQUE7QUFDbEIsSUFBQSxRQUFBLENBQVMsSUFBVCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsV0FBRCxDQUFhLFFBQWIsRUFGa0I7RUFBQSxDQTdJcEIsQ0FBQTs7QUFBQSwyQkFtSkEsb0JBQUEsR0FBc0IsU0FBQyxRQUFELEdBQUE7V0FDcEIsSUFBQyxDQUFBLGtCQUFELENBQW9CLFNBQUMsY0FBRCxHQUFBO0FBQ2xCLFVBQUEsd0NBQUE7QUFBQTtBQUFBO1dBQUEsWUFBQTt3Q0FBQTtBQUNFLHNCQUFBLFFBQUEsQ0FBUyxrQkFBVCxFQUFBLENBREY7QUFBQTtzQkFEa0I7SUFBQSxDQUFwQixFQURvQjtFQUFBLENBbkp0QixDQUFBOztBQUFBLDJCQTBKQSxjQUFBLEdBQWdCLFNBQUMsUUFBRCxHQUFBO1dBQ2QsSUFBQyxDQUFBLGtCQUFELENBQW9CLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLGNBQUQsR0FBQTtBQUNsQixZQUFBLHdDQUFBO0FBQUEsUUFBQSxJQUE0QixjQUFBLEtBQWtCLEtBQTlDO0FBQUEsVUFBQSxRQUFBLENBQVMsY0FBVCxDQUFBLENBQUE7U0FBQTtBQUNBO0FBQUE7YUFBQSxZQUFBOzBDQUFBO0FBQ0Usd0JBQUEsUUFBQSxDQUFTLGtCQUFULEVBQUEsQ0FERjtBQUFBO3dCQUZrQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBCLEVBRGM7RUFBQSxDQTFKaEIsQ0FBQTs7QUFBQSwyQkFpS0EsZUFBQSxHQUFpQixTQUFDLFFBQUQsR0FBQTtBQUNmLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFWLEVBRmU7RUFBQSxDQWpLakIsQ0FBQTs7QUFBQSwyQkE0S0EsYUFBQSxHQUFlLFNBQUEsR0FBQTtXQUNiLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFrQixXQUFsQixDQUFBLEdBQWlDLEVBRHBCO0VBQUEsQ0E1S2YsQ0FBQTs7QUFBQSwyQkFnTEEsWUFBQSxHQUFjLFNBQUEsR0FBQTtXQUNaLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFrQixVQUFsQixDQUFBLEdBQWdDLEVBRHBCO0VBQUEsQ0FoTGQsQ0FBQTs7QUFBQSwyQkFvTEEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFrQixNQUFsQixDQUFBLEdBQTRCLEVBRHJCO0VBQUEsQ0FwTFQsQ0FBQTs7QUFBQSwyQkF3TEEsU0FBQSxHQUFXLFNBQUEsR0FBQTtXQUNULElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFrQixPQUFsQixDQUFBLEdBQTZCLEVBRHBCO0VBQUEsQ0F4TFgsQ0FBQTs7QUFBQSwyQkE2TEEsVUFBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNWLElBQUEsSUFBRyxDQUFBLEtBQUg7QUFDRSxNQUFBLElBQUcsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLENBQVo7QUFDRSxRQUFBLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFULEdBQWlCLE1BQWpCLENBQUE7QUFDQSxRQUFBLElBQThDLElBQUMsQ0FBQSxhQUEvQztpQkFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLGVBQWYsQ0FBK0IsSUFBL0IsRUFBcUMsSUFBckMsRUFBQTtTQUZGO09BREY7S0FBQSxNQUlLLElBQUcsTUFBQSxDQUFBLEtBQUEsS0FBZ0IsUUFBbkI7QUFDSCxNQUFBLElBQUcsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLENBQVQsS0FBa0IsS0FBckI7QUFDRSxRQUFBLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFULEdBQWlCLEtBQWpCLENBQUE7QUFDQSxRQUFBLElBQThDLElBQUMsQ0FBQSxhQUEvQztpQkFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLGVBQWYsQ0FBK0IsSUFBL0IsRUFBcUMsSUFBckMsRUFBQTtTQUZGO09BREc7S0FBQSxNQUFBO0FBS0gsTUFBQSxJQUFHLENBQUEsU0FBSSxDQUFVLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFuQixFQUEwQixLQUExQixDQUFQO0FBQ0UsUUFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixLQUFqQixDQUFBO0FBQ0EsUUFBQSxJQUE4QyxJQUFDLENBQUEsYUFBL0M7aUJBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxlQUFmLENBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBQUE7U0FGRjtPQUxHO0tBTEs7RUFBQSxDQTdMWixDQUFBOztBQUFBLDJCQTRNQSxHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ0gsUUFBQSxlQUFBO0FBQUEsSUFBQSxNQUFBLHFDQUFlLENBQUUsY0FBVixDQUF5QixJQUF6QixVQUFQLEVBQ0csYUFBQSxHQUFOLElBQUMsQ0FBQSxhQUFLLEdBQThCLHdCQUE5QixHQUFOLElBREcsQ0FBQSxDQUFBO0FBQUEsSUFHQSxTQUFBLEdBQVksSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQWhCLENBSFosQ0FBQTtBQUlBLElBQUEsSUFBRyxTQUFTLENBQUMsT0FBYjtBQUNFLE1BQUEsSUFBRyxTQUFTLENBQUMsV0FBVixDQUFBLENBQUEsS0FBMkIsS0FBOUI7QUFDRSxRQUFBLFNBQVMsQ0FBQyxXQUFWLENBQXNCLEtBQXRCLENBQUEsQ0FBQTtBQUNBLFFBQUEsSUFBOEMsSUFBQyxDQUFBLGFBQS9DO2lCQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsZUFBZixDQUErQixJQUEvQixFQUFxQyxJQUFyQyxFQUFBO1NBRkY7T0FERjtLQUFBLE1BQUE7YUFLRSxJQUFDLENBQUEsVUFBRCxDQUFZLElBQVosRUFBa0IsS0FBbEIsRUFMRjtLQUxHO0VBQUEsQ0E1TUwsQ0FBQTs7QUFBQSwyQkF5TkEsR0FBQSxHQUFLLFNBQUMsSUFBRCxHQUFBO0FBQ0gsUUFBQSxJQUFBO0FBQUEsSUFBQSxNQUFBLHFDQUFlLENBQUUsY0FBVixDQUF5QixJQUF6QixVQUFQLEVBQ0csYUFBQSxHQUFOLElBQUMsQ0FBQSxhQUFLLEdBQThCLHdCQUE5QixHQUFOLElBREcsQ0FBQSxDQUFBO1dBR0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQWhCLENBQXFCLENBQUMsVUFBdEIsQ0FBQSxFQUpHO0VBQUEsQ0F6TkwsQ0FBQTs7QUFBQSwyQkFpT0EsT0FBQSxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLENBQVIsQ0FBQTtXQUNBLEtBQUEsS0FBUyxNQUFULElBQXNCLEtBQUEsS0FBUyxHQUZ4QjtFQUFBLENBak9ULENBQUE7O0FBQUEsMkJBa1BBLElBQUEsR0FBTSxTQUFDLEdBQUQsR0FBQTtBQUNKLFFBQUEsd0NBQUE7QUFBQSxJQUFBLElBQUcsTUFBQSxDQUFBLEdBQUEsS0FBZSxRQUFsQjtBQUNFLE1BQUEscUJBQUEsR0FBd0IsRUFBeEIsQ0FBQTtBQUNBLFdBQUEsV0FBQTswQkFBQTtBQUNFLFFBQUEsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFZLElBQVosRUFBa0IsS0FBbEIsQ0FBSDtBQUNFLFVBQUEscUJBQXFCLENBQUMsSUFBdEIsQ0FBMkIsSUFBM0IsQ0FBQSxDQURGO1NBREY7QUFBQSxPQURBO0FBSUEsTUFBQSxJQUFHLHFCQUFxQixDQUFDLE1BQXRCLEdBQStCLENBQWxDO3lEQUNnQixDQUFFLFlBQWhCLENBQTZCLElBQTdCLEVBQW1DLHFCQUFuQyxXQURGO09BTEY7S0FBQSxNQU9LLElBQUcsR0FBSDthQUNILElBQUMsQ0FBQSxVQUFXLENBQUEsR0FBQSxFQURUO0tBQUEsTUFBQTthQUdILElBQUMsQ0FBQSxXQUhFO0tBUkQ7RUFBQSxDQWxQTixDQUFBOztBQUFBLDJCQWdRQSxPQUFBLEdBQVMsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO0FBQ1AsUUFBQSxJQUFBO0FBQUEsSUFBQSxJQUFHLEdBQUEsSUFBTyxJQUFDLENBQUEsVUFBRCxDQUFZLEdBQVosRUFBaUIsS0FBakIsQ0FBVjt1REFDZ0IsQ0FBRSxZQUFoQixDQUE2QixJQUE3QixFQUFtQyxDQUFDLEdBQUQsQ0FBbkMsV0FERjtLQURPO0VBQUEsQ0FoUVQsQ0FBQTs7QUFBQSwyQkFxUUEsT0FBQSxHQUFTLFNBQUMsR0FBRCxHQUFBO0FBQ1AsSUFBQSxJQUFHLEdBQUg7YUFDRSxJQUFDLENBQUEsVUFBVyxDQUFBLEdBQUEsRUFEZDtLQUFBLE1BQUE7YUFHRSxJQUFDLENBQUEsV0FISDtLQURPO0VBQUEsQ0FyUVQsQ0FBQTs7QUFBQSwyQkE2UUEsVUFBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNWLElBQUEsSUFBZ0IsU0FBQSxDQUFVLElBQUMsQ0FBQSxVQUFXLENBQUEsSUFBQSxDQUF0QixFQUE2QixLQUE3QixDQUFoQjtBQUFBLGFBQU8sS0FBUCxDQUFBO0tBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxVQUFXLENBQUEsSUFBQSxDQUFaLEdBQW9CLEtBRnBCLENBQUE7V0FHQSxLQUpVO0VBQUEsQ0E3UVosQ0FBQTs7QUFBQSwyQkF1UkEsUUFBQSxHQUFVLFNBQUMsSUFBRCxHQUFBO1dBQ1IsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFBLEVBREE7RUFBQSxDQXZSVixDQUFBOztBQUFBLDJCQTJSQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ1IsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFPLENBQUEsSUFBQSxDQUF6QixDQUFBO0FBQ0EsSUFBQSxJQUFHLENBQUEsS0FBSDthQUNFLEdBQUcsQ0FBQyxJQUFKLENBQVUsaUJBQUEsR0FBZixJQUFlLEdBQXdCLHNCQUF4QixHQUFmLElBQUMsQ0FBQSxhQUFJLEVBREY7S0FBQSxNQUVLLElBQUcsQ0FBQSxLQUFTLENBQUMsYUFBTixDQUFvQixLQUFwQixDQUFQO2FBQ0gsR0FBRyxDQUFDLElBQUosQ0FBVSxpQkFBQSxHQUFmLEtBQWUsR0FBeUIsZUFBekIsR0FBZixJQUFlLEdBQStDLHNCQUEvQyxHQUFmLElBQUMsQ0FBQSxhQUFJLEVBREc7S0FBQSxNQUFBO0FBR0gsTUFBQSxJQUFHLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQSxDQUFSLEtBQWlCLEtBQXBCO0FBQ0UsUUFBQSxJQUFDLENBQUEsTUFBTyxDQUFBLElBQUEsQ0FBUixHQUFnQixLQUFoQixDQUFBO0FBQ0EsUUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFKO2lCQUNFLElBQUMsQ0FBQSxhQUFhLENBQUMsWUFBZixDQUE0QixJQUE1QixFQUFrQyxPQUFsQyxFQUEyQztBQUFBLFlBQUUsTUFBQSxJQUFGO0FBQUEsWUFBUSxPQUFBLEtBQVI7V0FBM0MsRUFERjtTQUZGO09BSEc7S0FKRztFQUFBLENBM1JWLENBQUE7O0FBQUEsMkJBMFNBLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDTCxJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksK0VBQVosQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFHLFNBQVMsQ0FBQyxNQUFWLEtBQW9CLENBQXZCO2FBQ0UsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFBLEVBRFY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCLEVBSEY7S0FGSztFQUFBLENBMVNQLENBQUE7O0FBQUEsMkJBcVRBLElBQUEsR0FBTSxTQUFBLEdBQUE7V0FDSixHQUFHLENBQUMsSUFBSixDQUFTLCtDQUFULEVBREk7RUFBQSxDQXJUTixDQUFBOztBQUFBLDJCQThUQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7V0FDbEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFWLENBQUEsRUFEa0I7RUFBQSxDQTlUcEIsQ0FBQTs7QUFBQSwyQkFtVUEsT0FBQSxHQUFTLFNBQUEsR0FBQSxDQW5VVCxDQUFBOzt3QkFBQTs7SUF6QkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLHNFQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsU0FDQSxHQUFZLE9BQUEsQ0FBUSxZQUFSLENBRFosQ0FBQTs7QUFBQSxNQUVBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBRlQsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sT0FBQSxDQUFRLGlCQUFSLENBSFAsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBSk4sQ0FBQTs7QUFBQSxNQUtBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBTFQsQ0FBQTs7QUFBQSxjQU1BLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUixDQU5qQixDQUFBOztBQUFBLGFBT0EsR0FBZ0IsT0FBQSxDQUFRLDBCQUFSLENBUGhCLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFnQmxCLEVBQUEsY0FBYyxDQUFBLFNBQUUsQ0FBQSxNQUFoQixHQUF5QixTQUFDLFNBQUQsR0FBQTtBQUN2QixRQUFBLFVBQUE7O01BQUEsWUFBYTtLQUFiO0FBQUEsSUFFQSxJQUFBLEdBQ0U7QUFBQSxNQUFBLEVBQUEsRUFBSSxTQUFTLENBQUMsRUFBZDtBQUFBLE1BQ0EsVUFBQSxFQUFZLFNBQVMsQ0FBQyxRQUFRLENBQUMsVUFEL0I7S0FIRixDQUFBO0FBTUEsSUFBQSxJQUFBLENBQUEsYUFBb0IsQ0FBQyxPQUFkLENBQXNCLFNBQVMsQ0FBQyxPQUFoQyxDQUFQO0FBQ0UsTUFBQSxJQUFJLENBQUMsT0FBTCxHQUFlLGFBQWEsQ0FBQyxRQUFkLENBQXVCLFNBQVMsQ0FBQyxPQUFqQyxDQUFmLENBREY7S0FOQTtBQVNBLElBQUEsSUFBQSxDQUFBLGFBQW9CLENBQUMsT0FBZCxDQUFzQixTQUFTLENBQUMsTUFBaEMsQ0FBUDtBQUNFLE1BQUEsSUFBSSxDQUFDLE1BQUwsR0FBYyxhQUFhLENBQUMsUUFBZCxDQUF1QixTQUFTLENBQUMsTUFBakMsQ0FBZCxDQURGO0tBVEE7QUFZQSxJQUFBLElBQUEsQ0FBQSxhQUFvQixDQUFDLE9BQWQsQ0FBc0IsU0FBUyxDQUFDLFVBQWhDLENBQVA7QUFDRSxNQUFBLElBQUksQ0FBQyxJQUFMLEdBQVksQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQWUsRUFBZixFQUFtQixTQUFTLENBQUMsVUFBN0IsQ0FBWixDQURGO0tBWkE7QUFnQkEsU0FBQSw0QkFBQSxHQUFBO0FBQ0UsTUFBQSxJQUFJLENBQUMsZUFBTCxJQUFJLENBQUMsYUFBZSxHQUFwQixDQUFBO0FBQUEsTUFDQSxJQUFJLENBQUMsVUFBVyxDQUFBLElBQUEsQ0FBaEIsR0FBd0IsRUFEeEIsQ0FERjtBQUFBLEtBaEJBO1dBb0JBLEtBckJ1QjtFQUFBLENBQXpCLENBQUE7U0F3QkE7QUFBQSxJQUFBLFFBQUEsRUFBVSxTQUFDLElBQUQsRUFBTyxNQUFQLEdBQUE7QUFDUixVQUFBLDJHQUFBO0FBQUEsTUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLEdBQVAsQ0FBVyxJQUFJLENBQUMsU0FBTCxJQUFrQixJQUFJLENBQUMsVUFBbEMsQ0FBWCxDQUFBO0FBQUEsTUFFQSxNQUFBLENBQU8sUUFBUCxFQUNHLG9FQUFBLEdBQU4sSUFBSSxDQUFDLFVBQUMsR0FBc0YsR0FEekYsQ0FGQSxDQUFBO0FBQUEsTUFLQSxLQUFBLEdBQVksSUFBQSxjQUFBLENBQWU7QUFBQSxRQUFFLFVBQUEsUUFBRjtBQUFBLFFBQVksRUFBQSxFQUFJLElBQUksQ0FBQyxFQUFyQjtPQUFmLENBTFosQ0FBQTtBQU9BO0FBQUEsV0FBQSxZQUFBOzJCQUFBO0FBQ0UsUUFBQSxNQUFBLENBQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFkLENBQTZCLElBQTdCLENBQVAsRUFDRyxzQ0FBQSxHQUFSLEtBQUssQ0FBQyxhQUFFLEdBQTRELHFCQUE1RCxHQUFSLElBQVEsR0FBd0YsR0FEM0YsQ0FBQSxDQUFBO0FBSUEsUUFBQSxJQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBakIsQ0FBcUIsSUFBckIsQ0FBMEIsQ0FBQyxJQUEzQixLQUFtQyxPQUFuQyxJQUE4QyxNQUFBLENBQUEsS0FBQSxLQUFnQixRQUFqRTtBQUNFLFVBQUEsS0FBSyxDQUFDLE9BQVEsQ0FBQSxJQUFBLENBQWQsR0FDRTtBQUFBLFlBQUEsR0FBQSxFQUFLLEtBQUw7V0FERixDQURGO1NBQUEsTUFBQTtBQUlFLFVBQUEsS0FBSyxDQUFDLE9BQVEsQ0FBQSxJQUFBLENBQWQsR0FBc0IsS0FBdEIsQ0FKRjtTQUxGO0FBQUEsT0FQQTtBQWtCQTtBQUFBLFdBQUEsa0JBQUE7aUNBQUE7QUFDRSxRQUFBLEtBQUssQ0FBQyxRQUFOLENBQWUsU0FBZixFQUEwQixLQUExQixDQUFBLENBREY7QUFBQSxPQWxCQTtBQXFCQSxNQUFBLElBQXlCLElBQUksQ0FBQyxJQUE5QjtBQUFBLFFBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsSUFBaEIsQ0FBQSxDQUFBO09BckJBO0FBdUJBO0FBQUEsV0FBQSxzQkFBQTs4Q0FBQTtBQUNFLFFBQUEsTUFBQSxDQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsY0FBakIsQ0FBZ0MsYUFBaEMsQ0FBUCxFQUNHLHlEQUFBLEdBQVIsYUFESyxDQUFBLENBQUE7QUFHQSxRQUFBLElBQUcsY0FBSDtBQUNFLFVBQUEsTUFBQSxDQUFPLENBQUMsQ0FBQyxPQUFGLENBQVUsY0FBVixDQUFQLEVBQ0csOERBQUEsR0FBVixhQURPLENBQUEsQ0FBQTtBQUVBLGVBQUEscURBQUE7dUNBQUE7QUFDRSxZQUFBLEtBQUssQ0FBQyxNQUFOLENBQWMsYUFBZCxFQUE2QixJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsRUFBaUIsTUFBakIsQ0FBN0IsQ0FBQSxDQURGO0FBQUEsV0FIRjtTQUpGO0FBQUEsT0F2QkE7YUFpQ0EsTUFsQ1E7SUFBQSxDQUFWO0lBeENrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBVGpCLENBQUE7Ozs7O0FDQUEsSUFBQSxzR0FBQTtFQUFBLGtCQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsa0JBRUEsR0FBcUIsT0FBQSxDQUFRLHVCQUFSLENBRnJCLENBQUE7O0FBQUEsY0FHQSxHQUFpQixPQUFBLENBQVEsbUJBQVIsQ0FIakIsQ0FBQTs7QUFBQSxjQUlBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUixDQUpqQixDQUFBOztBQUFBLHdCQUtBLEdBQTJCLE9BQUEsQ0FBUSw4QkFBUixDQUwzQixDQUFBOztBQUFBLE1BaUNNLENBQUMsT0FBUCxHQUF1QjtBQUdSLEVBQUEsdUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxhQUFBO0FBQUEsMEJBRFksT0FBdUIsSUFBckIsZUFBQSxTQUFTLElBQUMsQ0FBQSxjQUFBLE1BQ3hCLENBQUE7QUFBQSxJQUFBLE1BQUEsQ0FBTyxtQkFBUCxFQUFpQiw4REFBakIsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixFQURqQixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsSUFBRCxHQUFZLElBQUEsa0JBQUEsQ0FBbUI7QUFBQSxNQUFBLE1BQUEsRUFBUSxJQUFSO0tBQW5CLENBRlosQ0FBQTtBQU1BLElBQUEsSUFBK0IsZUFBL0I7QUFBQSxNQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixFQUFtQixJQUFDLENBQUEsTUFBcEIsQ0FBQSxDQUFBO0tBTkE7QUFBQSxJQVFBLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBTixHQUFzQixJQVJ0QixDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQVRBLENBRFc7RUFBQSxDQUFiOztBQUFBLDBCQWVBLE9BQUEsR0FBUyxTQUFDLFNBQUQsR0FBQTtBQUNQLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxDQUFaLENBQUE7QUFDQSxJQUFBLElBQTRCLGlCQUE1QjtBQUFBLE1BQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsU0FBZCxDQUFBLENBQUE7S0FEQTtXQUVBLEtBSE87RUFBQSxDQWZULENBQUE7O0FBQUEsMEJBdUJBLE1BQUEsR0FBUSxTQUFDLFNBQUQsR0FBQTtBQUNOLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxDQUFaLENBQUE7QUFDQSxJQUFBLElBQTJCLGlCQUEzQjtBQUFBLE1BQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsU0FBYixDQUFBLENBQUE7S0FEQTtXQUVBLEtBSE07RUFBQSxDQXZCUixDQUFBOztBQUFBLDBCQTZCQSxZQUFBLEdBQWMsU0FBQyxhQUFELEdBQUE7QUFDWixJQUFBLElBQUcsTUFBQSxDQUFBLGFBQUEsS0FBd0IsUUFBM0I7YUFDRSxJQUFDLENBQUEsZUFBRCxDQUFpQixhQUFqQixFQURGO0tBQUEsTUFBQTthQUdFLGNBSEY7S0FEWTtFQUFBLENBN0JkLENBQUE7O0FBQUEsMEJBb0NBLGVBQUEsR0FBaUIsU0FBQyxhQUFELEdBQUE7QUFDZixRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsV0FBRCxDQUFhLGFBQWIsQ0FBWCxDQUFBO0FBQ0EsSUFBQSxJQUEwQixRQUExQjthQUFBLFFBQVEsQ0FBQyxXQUFULENBQUEsRUFBQTtLQUZlO0VBQUEsQ0FwQ2pCLENBQUE7O0FBQUEsMEJBeUNBLFdBQUEsR0FBYSxTQUFDLGFBQUQsR0FBQTtBQUNYLFFBQUEsUUFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFZLGFBQVosQ0FBWCxDQUFBO0FBQUEsSUFDQSxNQUFBLENBQU8sUUFBUCxFQUFrQiwwQkFBQSxHQUFyQixhQUFHLENBREEsQ0FBQTtXQUVBLFNBSFc7RUFBQSxDQXpDYixDQUFBOztBQUFBLDBCQStDQSxnQkFBQSxHQUFrQixTQUFBLEdBQUE7QUFHaEIsSUFBQSxJQUFDLENBQUEsY0FBRCxHQUFrQixDQUFDLENBQUMsU0FBRixDQUFBLENBQWxCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFDLENBQUMsU0FBRixDQUFBLENBRHBCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxjQUFELEdBQWtCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FGbEIsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLHVCQUFELEdBQTJCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FMM0IsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FOeEIsQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLHdCQUFELEdBQTRCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FQNUIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FSeEIsQ0FBQTtXQVVBLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxFQWJLO0VBQUEsQ0EvQ2xCLENBQUE7O0FBQUEsMEJBZ0VBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtXQUNKLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLFFBQVgsRUFESTtFQUFBLENBaEVOLENBQUE7O0FBQUEsMEJBb0VBLGFBQUEsR0FBZSxTQUFDLFFBQUQsR0FBQTtXQUNiLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBTixDQUFvQixRQUFwQixFQURhO0VBQUEsQ0FwRWYsQ0FBQTs7QUFBQSwwQkF5RUEsS0FBQSxHQUFPLFNBQUEsR0FBQTtXQUNMLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFERDtFQUFBLENBekVQLENBQUE7O0FBQUEsMEJBOEVBLEdBQUEsR0FBSyxTQUFDLFFBQUQsR0FBQTtXQUNILElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLFFBQVYsRUFERztFQUFBLENBOUVMLENBQUE7O0FBQUEsMEJBa0ZBLElBQUEsR0FBTSxTQUFDLE1BQUQsR0FBQTtBQUNKLFFBQUEsR0FBQTtBQUFBLElBQUEsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixRQUFwQjtBQUNFLE1BQUEsR0FBQSxHQUFNLEVBQU4sQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTtBQUNKLFFBQUEsSUFBRyxTQUFTLENBQUMsYUFBVixLQUEyQixNQUE5QjtpQkFDRSxHQUFHLENBQUMsSUFBSixDQUFTLFNBQVQsRUFERjtTQURJO01BQUEsQ0FBTixDQURBLENBQUE7YUFLSSxJQUFBLGNBQUEsQ0FBZSxHQUFmLEVBTk47S0FBQSxNQUFBO2FBUU0sSUFBQSxjQUFBLENBQUEsRUFSTjtLQURJO0VBQUEsQ0FsRk4sQ0FBQTs7QUFBQSwwQkE4RkEsUUFBQSxHQUFVLFNBQUMsRUFBRCxHQUFBO1dBQ1IsSUFBQyxDQUFBLGFBQWMsQ0FBQSxFQUFBLEVBRFA7RUFBQSxDQTlGVixDQUFBOztBQUFBLDBCQWtHQSxNQUFBLEdBQVEsU0FBQSxHQUFBO0FBQ04sUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQU4sR0FBc0IsTUFBdEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDSixRQUFBLFNBQVMsQ0FBQyxhQUFWLEdBQTBCLE1BQTFCLENBQUE7ZUFDQSxLQUFDLENBQUEsYUFBYyxDQUFBLFNBQVMsQ0FBQyxFQUFWLENBQWYsR0FBK0IsT0FGM0I7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLENBREEsQ0FBQTtBQUFBLElBS0EsT0FBQSxHQUFVLElBQUMsQ0FBQSxJQUxYLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxJQUFELEdBQVksSUFBQSxrQkFBQSxDQUFtQjtBQUFBLE1BQUEsTUFBQSxFQUFRLElBQVI7S0FBbkIsQ0FOWixDQUFBO1dBUUEsUUFUTTtFQUFBLENBbEdSLENBQUE7O0FBQUEsMEJBa0hBLFdBQUEsR0FBYSxTQUFDLElBQUQsR0FBQTtBQUNYLElBQUEsTUFBQSxDQUFPLElBQUksQ0FBQyxRQUFaLEVBQXNCLHVFQUF0QixDQUFBLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWQsS0FBK0IsSUFBdEMsRUFBNEMsNkVBQTVDLENBREEsQ0FBQTtXQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUksQ0FBQyxTQUhWO0VBQUEsQ0FsSGIsQ0FBQTs7QUFBQSwwQkEwSEEsb0JBQUEsR0FBc0IsU0FBQyxXQUFELEdBQUE7QUFDcEIsUUFBQSxJQUFBO29EQUFhLENBQUUsb0JBQWYsQ0FBb0MsV0FBcEMsV0FEb0I7RUFBQSxDQTFIdEIsQ0FBQTs7QUFBQSwwQkErSEEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLFFBQUEsdUJBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyw4QkFBVCxDQUFBO0FBQUEsSUFFQSxPQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sV0FBUCxHQUFBOztRQUFPLGNBQWM7T0FDN0I7YUFBQSxNQUFBLElBQVUsRUFBQSxHQUFFLENBQWpCLEtBQUEsQ0FBTSxXQUFBLEdBQWMsQ0FBcEIsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixHQUE1QixDQUFpQixDQUFGLEdBQWYsSUFBZSxHQUErQyxLQURqRDtJQUFBLENBRlYsQ0FBQTtBQUFBLElBS0EsTUFBQSxHQUFTLFNBQUMsU0FBRCxFQUFZLFdBQVosR0FBQTtBQUNQLFVBQUEsd0NBQUE7O1FBRG1CLGNBQWM7T0FDakM7QUFBQSxNQUFBLFFBQUEsR0FBVyxTQUFTLENBQUMsUUFBckIsQ0FBQTtBQUFBLE1BQ0EsT0FBQSxDQUFTLElBQUEsR0FBZCxRQUFRLENBQUMsS0FBSyxHQUFxQixJQUFyQixHQUFkLFFBQVEsQ0FBQyxJQUFLLEdBQXlDLEdBQWxELEVBQXNELFdBQXRELENBREEsQ0FBQTtBQUlBO0FBQUEsV0FBQSxZQUFBO3dDQUFBO0FBQ0UsUUFBQSxPQUFBLENBQVEsRUFBQSxHQUFmLElBQWUsR0FBVSxHQUFsQixFQUFzQixXQUFBLEdBQWMsQ0FBcEMsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxJQUFxRCxrQkFBa0IsQ0FBQyxLQUF4RTtBQUFBLFVBQUEsTUFBQSxDQUFPLGtCQUFrQixDQUFDLEtBQTFCLEVBQWlDLFdBQUEsR0FBYyxDQUEvQyxDQUFBLENBQUE7U0FGRjtBQUFBLE9BSkE7QUFTQSxNQUFBLElBQXVDLFNBQVMsQ0FBQyxJQUFqRDtlQUFBLE1BQUEsQ0FBTyxTQUFTLENBQUMsSUFBakIsRUFBdUIsV0FBdkIsRUFBQTtPQVZPO0lBQUEsQ0FMVCxDQUFBO0FBaUJBLElBQUEsSUFBdUIsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUE3QjtBQUFBLE1BQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBYixDQUFBLENBQUE7S0FqQkE7QUFrQkEsV0FBTyxNQUFQLENBbkJLO0VBQUEsQ0EvSFAsQ0FBQTs7QUFBQSwwQkEwSkEsa0JBQUEsR0FBb0IsU0FBQyxTQUFELEVBQVksbUJBQVosR0FBQTtBQUNsQixJQUFBLElBQUcsU0FBUyxDQUFDLGFBQVYsS0FBMkIsSUFBOUI7QUFFRSxNQUFBLG1CQUFBLENBQUEsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxnQkFBWCxFQUE2QixTQUE3QixFQUhGO0tBQUEsTUFBQTtBQUtFLE1BQUEsSUFBRywrQkFBSDtBQUNFLFFBQUEsU0FBUyxDQUFDLE1BQVYsQ0FBQSxDQUFBLENBREY7T0FBQTtBQUFBLE1BR0EsU0FBUyxDQUFDLGtCQUFWLENBQTZCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLFVBQUQsR0FBQTtBQUMzQixVQUFBLFVBQVUsQ0FBQyxhQUFYLEdBQTJCLEtBQTNCLENBQUE7aUJBQ0EsS0FBQyxDQUFBLGFBQWMsQ0FBQSxVQUFVLENBQUMsRUFBWCxDQUFmLEdBQWdDLFVBRkw7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QixDQUhBLENBQUE7QUFBQSxNQU9BLG1CQUFBLENBQUEsQ0FQQSxDQUFBO2FBUUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxnQkFBWCxFQUE2QixTQUE3QixFQWJGO0tBRGtCO0VBQUEsQ0ExSnBCLENBQUE7O0FBQUEsMEJBMktBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxRQUFBLFdBQUE7QUFBQSxJQURVLHNCQUFPLDhEQUNqQixDQUFBO0FBQUEsSUFBQSxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsSUFBSSxDQUFDLEtBQWpCLENBQXVCLEtBQXZCLEVBQThCLElBQTlCLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFBLEVBRlM7RUFBQSxDQTNLWCxDQUFBOztBQUFBLDBCQWdMQSxrQkFBQSxHQUFvQixTQUFDLFNBQUQsRUFBWSxtQkFBWixHQUFBO0FBQ2xCLElBQUEsTUFBQSxDQUFPLFNBQVMsQ0FBQyxhQUFWLEtBQTJCLElBQWxDLEVBQ0Usb0RBREYsQ0FBQSxDQUFBO0FBQUEsSUFHQSxTQUFTLENBQUMsa0JBQVYsQ0FBNkIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsVUFBRCxHQUFBO0FBQzNCLFFBQUEsVUFBVSxDQUFDLGFBQVgsR0FBMkIsTUFBM0IsQ0FBQTtlQUNBLEtBQUMsQ0FBQSxhQUFjLENBQUEsVUFBVSxDQUFDLEVBQVgsQ0FBZixHQUFnQyxPQUZMO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0IsQ0FIQSxDQUFBO0FBQUEsSUFPQSxtQkFBQSxDQUFBLENBUEEsQ0FBQTtXQVFBLElBQUMsQ0FBQSxTQUFELENBQVcsa0JBQVgsRUFBK0IsU0FBL0IsRUFUa0I7RUFBQSxDQWhMcEIsQ0FBQTs7QUFBQSwwQkE0TEEsZUFBQSxHQUFpQixTQUFDLFNBQUQsR0FBQTtXQUNmLElBQUMsQ0FBQSxTQUFELENBQVcseUJBQVgsRUFBc0MsU0FBdEMsRUFEZTtFQUFBLENBNUxqQixDQUFBOztBQUFBLDBCQWdNQSxZQUFBLEdBQWMsU0FBQyxTQUFELEdBQUE7V0FDWixJQUFDLENBQUEsU0FBRCxDQUFXLHNCQUFYLEVBQW1DLFNBQW5DLEVBRFk7RUFBQSxDQWhNZCxDQUFBOztBQUFBLDBCQXlNQSxZQUFBLEdBQWMsU0FBQyxTQUFELEVBQVksaUJBQVosR0FBQTtXQUNaLElBQUMsQ0FBQSxTQUFELENBQVcsc0JBQVgsRUFBbUMsU0FBbkMsRUFBOEMsaUJBQTlDLEVBRFk7RUFBQSxDQXpNZCxDQUFBOztBQUFBLDBCQWdOQSxTQUFBLEdBQVcsU0FBQSxHQUFBO1dBQ1QsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUFuQixFQURTO0VBQUEsQ0FoTlgsQ0FBQTs7QUFBQSwwQkFzTkEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNULFFBQUEsNkJBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxFQUFQLENBQUE7QUFBQSxJQUNBLElBQUssQ0FBQSxTQUFBLENBQUwsR0FBa0IsRUFEbEIsQ0FBQTtBQUFBLElBRUEsSUFBSyxDQUFBLFFBQUEsQ0FBTCxHQUFpQjtBQUFBLE1BQUUsSUFBQSxFQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBaEI7S0FGakIsQ0FBQTtBQUFBLElBSUEsZUFBQSxHQUFrQixTQUFDLFNBQUQsRUFBWSxLQUFaLEVBQW1CLGNBQW5CLEdBQUE7QUFDaEIsVUFBQSxhQUFBO0FBQUEsTUFBQSxhQUFBLEdBQWdCLFNBQVMsQ0FBQyxNQUFWLENBQUEsQ0FBaEIsQ0FBQTtBQUFBLE1BQ0EsY0FBYyxDQUFDLElBQWYsQ0FBb0IsYUFBcEIsQ0FEQSxDQUFBO2FBRUEsY0FIZ0I7SUFBQSxDQUpsQixDQUFBO0FBQUEsSUFTQSxNQUFBLEdBQVMsU0FBQyxTQUFELEVBQVksS0FBWixFQUFtQixPQUFuQixHQUFBO0FBQ1AsVUFBQSw2REFBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixlQUFBLENBQWdCLFNBQWhCLEVBQTJCLEtBQTNCLEVBQWtDLE9BQWxDLENBQWhCLENBQUE7QUFHQTtBQUFBLFdBQUEsWUFBQTt3Q0FBQTtBQUNFLFFBQUEsY0FBQSxHQUFpQixhQUFhLENBQUMsVUFBVyxDQUFBLGtCQUFrQixDQUFDLElBQW5CLENBQXpCLEdBQW9ELEVBQXJFLENBQUE7QUFDQSxRQUFBLElBQStELGtCQUFrQixDQUFDLEtBQWxGO0FBQUEsVUFBQSxNQUFBLENBQU8sa0JBQWtCLENBQUMsS0FBMUIsRUFBaUMsS0FBQSxHQUFRLENBQXpDLEVBQTRDLGNBQTVDLENBQUEsQ0FBQTtTQUZGO0FBQUEsT0FIQTtBQVFBLE1BQUEsSUFBMEMsU0FBUyxDQUFDLElBQXBEO2VBQUEsTUFBQSxDQUFPLFNBQVMsQ0FBQyxJQUFqQixFQUF1QixLQUF2QixFQUE4QixPQUE5QixFQUFBO09BVE87SUFBQSxDQVRULENBQUE7QUFvQkEsSUFBQSxJQUEyQyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQWpEO0FBQUEsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFiLEVBQW9CLENBQXBCLEVBQXVCLElBQUssQ0FBQSxTQUFBLENBQTVCLENBQUEsQ0FBQTtLQXBCQTtXQXNCQSxLQXZCUztFQUFBLENBdE5YLENBQUE7O0FBQUEsMEJBcVBBLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxNQUFQLEVBQWUsTUFBZixHQUFBO0FBQ1IsUUFBQSx3Q0FBQTs7TUFEdUIsU0FBTztLQUM5QjtBQUFBLElBQUEsSUFBRyxjQUFIO0FBQ0UsTUFBQSxNQUFBLENBQVcscUJBQUosSUFBZ0IsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsTUFBZixDQUF2QixFQUErQyxxRkFBL0MsQ0FBQSxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxNQUFWLENBSEY7S0FBQTtBQUtBLElBQUEsSUFBRyxNQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQU4sR0FBc0IsTUFBdEIsQ0FERjtLQUxBO0FBUUEsSUFBQSxJQUFHLElBQUksQ0FBQyxPQUFSO0FBQ0U7QUFBQSxXQUFBLDJDQUFBO2lDQUFBO0FBQ0UsUUFBQSxTQUFBLEdBQVksd0JBQXdCLENBQUMsUUFBekIsQ0FBa0MsYUFBbEMsRUFBaUQsTUFBakQsQ0FBWixDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxTQUFiLENBREEsQ0FERjtBQUFBLE9BREY7S0FSQTtBQWFBLElBQUEsSUFBRyxNQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQU4sR0FBc0IsSUFBdEIsQ0FBQTthQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNULFVBQUEsU0FBUyxDQUFDLGFBQVYsR0FBMEIsS0FBMUIsQ0FBQTtpQkFDQSxLQUFDLENBQUEsYUFBYyxDQUFBLFNBQVMsQ0FBQyxFQUFWLENBQWYsR0FBK0IsVUFGdEI7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLEVBRkY7S0FkUTtFQUFBLENBclBWLENBQUE7O0FBQUEsMEJBNFFBLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxNQUFQLEdBQUE7V0FDUCxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsTUFBaEIsRUFBd0IsS0FBeEIsRUFETztFQUFBLENBNVFULENBQUE7O0FBQUEsMEJBZ1JBLG9CQUFBLEdBQXNCLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNwQixRQUFBLHFEQUFBOztNQUQyQixRQUFNO0tBQ2pDO0FBQUEsSUFBQSxNQUFBLENBQU8sbUJBQVAsRUFBaUIsZ0RBQWpCLENBQUEsQ0FBQTtBQUFBLElBRUEsT0FBQSxHQUFVLE1BQUEsQ0FBTyxLQUFQLENBRlYsQ0FBQTtBQUdBO0FBQUEsVUFDSyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ0QsWUFBQSxPQUFBO0FBQUEsUUFBQSxPQUFBLEdBQVUsYUFBVixDQUFBO2VBQ0EsVUFBQSxDQUFXLFNBQUEsR0FBQTtBQUNULGNBQUEsU0FBQTtBQUFBLFVBQUEsU0FBQSxHQUFZLHdCQUF3QixDQUFDLFFBQXpCLENBQWtDLE9BQWxDLEVBQTJDLEtBQUMsQ0FBQSxNQUE1QyxDQUFaLENBQUE7aUJBQ0EsS0FBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsU0FBYixFQUZTO1FBQUEsQ0FBWCxFQUdFLE9BSEYsRUFGQztNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBREw7QUFBQTtTQUFBLDJDQUFBOytCQUFBO0FBQ0UsV0FBQSxDQUFBO0FBQUEsb0JBT0EsT0FBQSxJQUFXLE1BQUEsQ0FBTyxLQUFQLEVBUFgsQ0FERjtBQUFBO29CQUpvQjtFQUFBLENBaFJ0QixDQUFBOztBQUFBLDBCQStSQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sSUFBQyxDQUFBLFNBQUQsQ0FBQSxFQURNO0VBQUEsQ0EvUlIsQ0FBQTs7QUFBQSwwQkFzU0EsUUFBQSxHQUFVLFNBQUEsR0FBQTtBQUNSLFFBQUEsSUFBQTtBQUFBLElBRFMsOERBQ1QsQ0FBQTtXQUFBLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixDQUFnQixJQUFoQixFQUFzQixJQUF0QixFQURRO0VBQUEsQ0F0U1YsQ0FBQTs7QUFBQSwwQkEwU0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsSUFBQTtBQUFBLElBRE8sOERBQ1AsQ0FBQTtXQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLElBQWQsRUFBb0IsSUFBcEIsRUFETTtFQUFBLENBMVNSLENBQUE7O3VCQUFBOztJQXBDRixDQUFBOzs7OztBQ0FBLElBQUEsb0RBQUE7RUFBQTtpU0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxLQUNBLEdBQVEsT0FBQSxDQUFRLGtCQUFSLENBRFIsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsdUJBQVIsQ0FGckIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVyQixzQ0FBQSxDQUFBOzs7O0dBQUE7O0FBQUEsOEJBQUEsVUFBQSxHQUFZLElBQVosQ0FBQTs7QUFBQSw4QkFHQSxPQUFBLEdBQVMsU0FBQSxHQUFBO0FBQ1AsUUFBQSxPQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFWLENBQUE7QUFDQSxJQUFBLElBQUEsQ0FBQSxPQUFBO0FBQUEsYUFBTyxFQUFQLENBQUE7S0FEQTtXQUVBLEtBQUssQ0FBQyxtQkFBTixDQUEwQixPQUExQixFQUhPO0VBQUEsQ0FIVCxDQUFBOzsyQkFBQTs7R0FGK0MsbUJBSmpELENBQUE7Ozs7O0FDQUEsSUFBQSx5Q0FBQTtFQUFBO2lTQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLGtCQUNBLEdBQXFCLE9BQUEsQ0FBUSx1QkFBUixDQURyQixDQUFBOztBQUFBLE1BR00sQ0FBQyxPQUFQLEdBQXVCO0FBRXJCLGtDQUFBLENBQUE7Ozs7R0FBQTs7QUFBQSwwQkFBQSxNQUFBLEdBQVEsSUFBUixDQUFBOztBQUFBLDBCQUdBLGVBQUEsR0FBaUIsU0FBQyxnQkFBRCxHQUFBO1dBQ2YsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULEVBQTBCLGdCQUExQixFQURlO0VBQUEsQ0FIakIsQ0FBQTs7QUFBQSwwQkFPQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtXQUNmLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxFQURlO0VBQUEsQ0FQakIsQ0FBQTs7dUJBQUE7O0dBRjJDLG1CQUg3QyxDQUFBOzs7OztBQ0FBLElBQUEsd0RBQUE7RUFBQTtpU0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxZQUNBLEdBQWUsT0FBQSxDQUFRLGlDQUFSLENBRGYsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsdUJBQVIsQ0FGckIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVyQixtQ0FBQSxDQUFBOzs7O0dBQUE7O0FBQUEsMkJBQUEsT0FBQSxHQUFTLElBQVQsQ0FBQTs7QUFBQSwyQkFHQSxVQUFBLEdBQVksU0FBQyxLQUFELEdBQUE7V0FDVixJQUFDLENBQUEsV0FBRCxDQUFhLEtBQWIsRUFEVTtFQUFBLENBSFosQ0FBQTs7QUFBQSwyQkFPQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQURVO0VBQUEsQ0FQWixDQUFBOztBQUFBLDJCQWNBLGlCQUFBLEdBQW1CLFNBQUMsU0FBRCxHQUFBO1dBQ2pCLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxVQUFuQixDQUFBLENBQUEsS0FBbUMsTUFEbEI7RUFBQSxDQWRuQixDQUFBOztBQUFBLDJCQWtCQSxhQUFBLEdBQWUsU0FBQyxTQUFELEdBQUE7V0FDYixJQUFDLENBQUEsaUJBQWlCLENBQUMsVUFBbkIsQ0FBQSxDQUFBLEtBQW1DLE1BRHRCO0VBQUEsQ0FsQmYsQ0FBQTs7QUFBQSwyQkFzQkEsY0FBQSxHQUFnQixTQUFDLFlBQUQsR0FBQTtBQUNkLElBQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxZQUFmLENBQUE7QUFDQSxJQUFBLElBQStELElBQUMsQ0FBQSxTQUFTLENBQUMsYUFBMUU7YUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLGFBQWEsQ0FBQyxlQUF6QixDQUF5QyxJQUFDLENBQUEsU0FBMUMsRUFBcUQsSUFBQyxDQUFBLElBQXRELEVBQUE7S0FGYztFQUFBLENBdEJoQixDQUFBOztBQUFBLDJCQTJCQSxXQUFBLEdBQWEsU0FBQyxLQUFELEdBQUE7QUFDWCxRQUFBLFlBQUE7O3FCQUE2QjtLQUE3QjtBQUFBLElBQ0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFDLEdBQTFCLEdBQWdDLEtBRGhDLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FIQSxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsV0FBRCxHQUFlLE1BSmYsQ0FBQTtXQUtBLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBTlc7RUFBQSxDQTNCYixDQUFBOztBQUFBLDJCQW9DQSxXQUFBLEdBQWEsU0FBQSxHQUFBO0FBQ1gsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBM0IsQ0FBQTtBQUNBLElBQUEsSUFBRyxLQUFIO2FBQ0UsS0FBSyxDQUFDLElBRFI7S0FBQSxNQUFBO2FBR0UsT0FIRjtLQUZXO0VBQUEsQ0FwQ2IsQ0FBQTs7QUFBQSwyQkE0Q0EsY0FBQSxHQUFnQixTQUFBLEdBQUE7V0FDZCxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsSUFBRCxFQURMO0VBQUEsQ0E1Q2hCLENBQUE7O0FBQUEsMkJBZ0RBLGNBQUEsR0FBZ0IsU0FBQSxHQUFBO1dBQ2QsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFDLFdBQTFCLElBQXlDLElBQUMsQ0FBQSxXQUFELENBQUEsRUFEM0I7RUFBQSxDQWhEaEIsQ0FBQTs7QUFBQSwyQkFvREEsT0FBQSxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSx1Q0FBQTtBQUFBLElBRFUsU0FBQSxHQUFHLFNBQUEsR0FBRyxhQUFBLE9BQU8sY0FBQSxRQUFRLFlBQUEsSUFDL0IsQ0FBQTtBQUFBLElBQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBUSxDQUFBLElBQUMsQ0FBQSxJQUFELENBQWxDLENBQUE7QUFFQSxJQUFBLElBQUcsMERBQUg7QUFDRSxNQUFBLFlBQVksQ0FBQyxJQUFiLEdBQ0U7QUFBQSxRQUFBLENBQUEsRUFBRyxDQUFIO0FBQUEsUUFDQSxDQUFBLEVBQUcsQ0FESDtBQUFBLFFBRUEsS0FBQSxFQUFPLEtBRlA7QUFBQSxRQUdBLE1BQUEsRUFBUSxNQUhSO0FBQUEsUUFJQSxJQUFBLEVBQU0sSUFKTjtPQURGLENBQUE7QUFBQSxNQU9BLElBQUMsQ0FBQSxlQUFELENBQWlCLFlBQVksQ0FBQyxXQUFiLElBQTRCLFlBQVksQ0FBQyxHQUExRCxDQVBBLENBQUE7QUFRQSxNQUFBLElBQStELElBQUMsQ0FBQSxTQUFTLENBQUMsYUFBMUU7ZUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLGFBQWEsQ0FBQyxlQUF6QixDQUF5QyxJQUFDLENBQUEsU0FBMUMsRUFBcUQsSUFBQyxDQUFBLElBQXRELEVBQUE7T0FURjtLQUhPO0VBQUEsQ0FwRFQsQ0FBQTs7QUFBQSwyQkFtRUEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNULFFBQUEsWUFBQTtBQUFBLElBQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBUSxDQUFBLElBQUMsQ0FBQSxJQUFELENBQWxDLENBQUE7QUFDQSxJQUFBLElBQUcsb0JBQUg7YUFDRSxZQUFZLENBQUMsSUFBYixHQUFvQixLQUR0QjtLQUZTO0VBQUEsQ0FuRVgsQ0FBQTs7QUFBQSwyQkF5RUEsZUFBQSxHQUFpQixTQUFDLGdCQUFELEdBQUE7QUFDZixRQUFBLFFBQUE7QUFBQSxJQUFBLE1BQUEsQ0FBTyxZQUFZLENBQUMsR0FBYixDQUFpQixnQkFBakIsQ0FBUCxFQUE0QyxzQ0FBQSxHQUEvQyxnQkFBRyxDQUFBLENBQUE7QUFBQSxJQUVBLFFBQUEsR0FBVyxJQUFDLENBQUEsV0FBRCxDQUFBLENBRlgsQ0FBQTtXQUdBLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBUSxDQUFBLElBQUMsQ0FBQSxJQUFELENBQW5CLEdBQ0U7QUFBQSxNQUFBLEdBQUEsRUFBSyxRQUFMO0FBQUEsTUFDQSxZQUFBLEVBQWMsZ0JBQUEsSUFBb0IsSUFEbEM7TUFMYTtFQUFBLENBekVqQixDQUFBOztBQUFBLDJCQWtGQSxtQkFBQSxHQUFxQixTQUFBLEdBQUE7V0FDbkIsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFrQixDQUFDLEtBREE7RUFBQSxDQWxGckIsQ0FBQTs7QUFBQSwyQkFzRkEsc0JBQUEsR0FBd0IsU0FBQSxHQUFBO1dBQ3RCLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUEsS0FBMEIsVUFESjtFQUFBLENBdEZ4QixDQUFBOztBQUFBLDJCQTBGQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFFBQUEsaUJBQUE7QUFBQSxJQUFBLFdBQUEsNERBQXVDLENBQUUscUJBQXpDLENBQUE7V0FDQSxZQUFZLENBQUMsR0FBYixDQUFpQixXQUFBLElBQWUsTUFBaEMsRUFGZTtFQUFBLENBMUZqQixDQUFBOztBQUFBLDJCQStGQSxlQUFBLEdBQWlCLFNBQUMsR0FBRCxHQUFBO0FBQ2YsUUFBQSxrQkFBQTtBQUFBLElBQUEsSUFBRyxDQUFBLElBQUssQ0FBQSxzQkFBRCxDQUFBLENBQVA7QUFDRSxNQUFBLFVBQUEsR0FBYSxJQUFDLENBQUEsZUFBRCxDQUFBLENBQWIsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxHQUFTLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FEVCxDQUFBO0FBQUEsTUFFQSxNQUFNLENBQUMsR0FBUCxHQUFhLFVBQVUsQ0FBQyxNQUFYLENBQWtCLEdBQWxCLEVBQXVCO0FBQUEsUUFBQSxJQUFBLEVBQU0sTUFBTSxDQUFDLElBQWI7T0FBdkIsQ0FGYixDQUFBO2FBR0EsTUFBTSxDQUFDLFdBQVAsR0FBcUIsSUFKdkI7S0FEZTtFQUFBLENBL0ZqQixDQUFBOzt3QkFBQTs7R0FGNEMsbUJBSjlDLENBQUE7Ozs7O0FDYUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxNQUFELEdBQUE7QUFJZixNQUFBLHlCQUFBO0FBQUEsRUFBQSxNQUFNLENBQUMsWUFBUCxHQUFzQixFQUF0QixDQUFBO0FBQUEsRUFDQSxNQUFNLENBQUMsa0JBQVAsR0FBNEIsRUFENUIsQ0FBQTtBQUdBO0FBQUEsT0FBQSxZQUFBO3VCQUFBO0FBSUUsSUFBQSxNQUFBLEdBQVksTUFBTSxDQUFDLGVBQVYsR0FBK0IsRUFBQSxHQUEzQyxNQUFNLENBQUMsZUFBb0MsR0FBNEIsR0FBM0QsR0FBbUUsRUFBNUUsQ0FBQTtBQUFBLElBQ0EsS0FBSyxDQUFDLFlBQU4sR0FBcUIsRUFBQSxHQUF4QixNQUF3QixHQUF4QixLQUFLLENBQUMsSUFESCxDQUFBO0FBQUEsSUFHQSxNQUFNLENBQUMsWUFBYSxDQUFBLElBQUEsQ0FBcEIsR0FBNEIsS0FBSyxDQUFDLFlBSGxDLENBQUE7QUFBQSxJQUlBLE1BQU0sQ0FBQyxrQkFBbUIsQ0FBQSxLQUFLLENBQUMsSUFBTixDQUExQixHQUF3QyxJQUp4QyxDQUpGO0FBQUEsR0FIQTtTQWFBLE9BakJlO0FBQUEsQ0FBakIsQ0FBQTs7Ozs7QUNiQSxJQUFBLGFBQUE7O0FBQUEsYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVIsQ0FBaEIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUFpQixhQUFBLENBR2Y7QUFBQSxFQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsRUFJQSxpQkFBQSxFQUFtQixhQUpuQjtBQUFBLEVBT0EsVUFBQSxFQUFZLFVBUFo7QUFBQSxFQVFBLGlCQUFBLEVBQW1CLDRCQVJuQjtBQUFBLEVBVUEsY0FBQSxFQUFnQixrQ0FWaEI7QUFBQSxFQWFBLGVBQUEsRUFBaUIsaUJBYmpCO0FBQUEsRUFlQSxlQUFBLEVBQWlCLE1BZmpCO0FBQUEsRUFrQkEsUUFBQSxFQUNFO0FBQUEsSUFBQSxZQUFBLEVBQWMsSUFBZDtBQUFBLElBQ0EsV0FBQSxFQUFhLENBRGI7QUFBQSxJQUVBLGlCQUFBLEVBQW1CLEtBRm5CO0FBQUEsSUFHQSx5QkFBQSxFQUEyQixLQUgzQjtHQW5CRjtBQUFBLEVBNkJBLEdBQUEsRUFFRTtBQUFBLElBQUEsT0FBQSxFQUFTLGFBQVQ7QUFBQSxJQUdBLFNBQUEsRUFBVyxlQUhYO0FBQUEsSUFJQSxRQUFBLEVBQVUsY0FKVjtBQUFBLElBS0EsYUFBQSxFQUFlLG9CQUxmO0FBQUEsSUFNQSxVQUFBLEVBQVksaUJBTlo7QUFBQSxJQU9BLFdBQUEsRUFBVyxRQVBYO0FBQUEsSUFVQSxrQkFBQSxFQUFvQix5QkFWcEI7QUFBQSxJQVdBLGtCQUFBLEVBQW9CLHlCQVhwQjtBQUFBLElBY0EsT0FBQSxFQUFTLGFBZFQ7QUFBQSxJQWVBLGtCQUFBLEVBQW9CLHlCQWZwQjtBQUFBLElBZ0JBLHlCQUFBLEVBQTJCLGtCQWhCM0I7QUFBQSxJQWlCQSxXQUFBLEVBQWEsa0JBakJiO0FBQUEsSUFrQkEsVUFBQSxFQUFZLGlCQWxCWjtBQUFBLElBbUJBLFVBQUEsRUFBWSxpQkFuQlo7QUFBQSxJQW9CQSxNQUFBLEVBQVEsa0JBcEJSO0FBQUEsSUFxQkEsU0FBQSxFQUFXLGdCQXJCWDtBQUFBLElBc0JBLGtCQUFBLEVBQW9CLHlCQXRCcEI7QUFBQSxJQXlCQSxnQkFBQSxFQUFrQixrQkF6QmxCO0FBQUEsSUEwQkEsa0JBQUEsRUFBb0IsNEJBMUJwQjtBQUFBLElBMkJBLGtCQUFBLEVBQW9CLHlCQTNCcEI7R0EvQkY7QUFBQSxFQTZEQSxJQUFBLEVBQ0U7QUFBQSxJQUFBLFFBQUEsRUFBVSxtQkFBVjtBQUFBLElBQ0EsV0FBQSxFQUFhLHNCQURiO0dBOURGO0FBQUEsRUF5RUEsVUFBQSxFQUNFO0FBQUEsSUFBQSxTQUFBLEVBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxlQUFOO0FBQUEsTUFDQSxZQUFBLEVBQWMsa0JBRGQ7QUFBQSxNQUVBLGdCQUFBLEVBQWtCLElBRmxCO0FBQUEsTUFHQSxXQUFBLEVBQWEsU0FIYjtLQURGO0FBQUEsSUFLQSxRQUFBLEVBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxjQUFOO0FBQUEsTUFDQSxZQUFBLEVBQWMsa0JBRGQ7QUFBQSxNQUVBLGdCQUFBLEVBQWtCLElBRmxCO0FBQUEsTUFHQSxXQUFBLEVBQWEsU0FIYjtLQU5GO0FBQUEsSUFVQSxLQUFBLEVBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxXQUFOO0FBQUEsTUFDQSxZQUFBLEVBQWMsa0JBRGQ7QUFBQSxNQUVBLGdCQUFBLEVBQWtCLElBRmxCO0FBQUEsTUFHQSxXQUFBLEVBQWEsT0FIYjtLQVhGO0FBQUEsSUFlQSxJQUFBLEVBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxVQUFOO0FBQUEsTUFDQSxZQUFBLEVBQWMsa0JBRGQ7QUFBQSxNQUVBLGdCQUFBLEVBQWtCLElBRmxCO0FBQUEsTUFHQSxXQUFBLEVBQWEsU0FIYjtLQWhCRjtBQUFBLElBb0JBLFFBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLGNBQU47QUFBQSxNQUNBLFlBQUEsRUFBYyxrQkFEZDtBQUFBLE1BRUEsZ0JBQUEsRUFBa0IsS0FGbEI7S0FyQkY7R0ExRUY7QUFBQSxFQW9HQSxVQUFBLEVBQ0U7QUFBQSxJQUFBLFNBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFNBQUMsS0FBRCxHQUFBO2VBQ0osS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsR0FBaEIsRUFESTtNQUFBLENBQU47QUFBQSxNQUdBLElBQUEsRUFBTSxTQUFDLEtBQUQsR0FBQTtlQUNKLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBZCxFQURJO01BQUEsQ0FITjtLQURGO0dBckdGO0FBQUEsRUE2R0EsYUFBQSxFQUNFO0FBQUEsSUFBQSxVQUFBLEVBQ0U7QUFBQSxNQUFBLE9BQUEsRUFBUyxFQUFUO0FBQUEsTUFDQSxJQUFBLEVBQU0sc0JBRE47S0FERjtHQTlHRjtDQUhlLENBSmpCLENBQUE7Ozs7O0FDQUEsSUFBQSwwQ0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBQU4sQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxLQUVBLEdBQVEsT0FBQSxDQUFRLGtCQUFSLENBRlIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsZ0NBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxxQkFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLFlBQUEsTUFBTSxhQUFBLE9BQU8sSUFBQyxDQUFBLFlBQUEsTUFBTSxhQUFBLE9BQU8sZUFBQSxPQUMxQyxDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBQUEsSUFBUyxLQUFLLENBQUMsUUFBTixDQUFnQixJQUFDLENBQUEsSUFBakIsQ0FBbEIsQ0FBQTtBQUVBLFlBQU8sSUFBQyxDQUFBLElBQVI7QUFBQSxXQUNPLFFBRFA7QUFFSSxRQUFBLE1BQUEsQ0FBTyxLQUFQLEVBQWMsMENBQWQsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBRFQsQ0FGSjtBQUNPO0FBRFAsV0FJTyxRQUpQO0FBS0ksUUFBQSxNQUFBLENBQU8sT0FBUCxFQUFnQiw0Q0FBaEIsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLE9BRFgsQ0FMSjtBQUlPO0FBSlA7QUFRSSxRQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVcscUNBQUEsR0FBbEIsSUFBQyxDQUFBLElBQWlCLEdBQTZDLEdBQXhELENBQUEsQ0FSSjtBQUFBLEtBSFc7RUFBQSxDQUFiOztBQUFBLG1DQW1CQSxlQUFBLEdBQWlCLFNBQUMsS0FBRCxHQUFBO0FBQ2YsSUFBQSxJQUFHLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixDQUFIO0FBQ0UsTUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtlQUNFO0FBQUEsVUFBQSxNQUFBLEVBQVcsQ0FBQSxLQUFILEdBQWtCLENBQUMsSUFBQyxDQUFBLEtBQUYsQ0FBbEIsR0FBZ0MsTUFBeEM7QUFBQSxVQUNBLEdBQUEsRUFBSyxLQURMO1VBREY7T0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2VBQ0g7QUFBQSxVQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsQ0FBUjtBQUFBLFVBQ0EsR0FBQSxFQUFLLEtBREw7VUFERztPQUpQO0tBQUEsTUFBQTtBQVFFLE1BQUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7ZUFDRTtBQUFBLFVBQUEsTUFBQSxFQUFRLFlBQVI7QUFBQSxVQUNBLEdBQUEsRUFBSyxNQURMO1VBREY7T0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2VBQ0g7QUFBQSxVQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsQ0FBUjtBQUFBLFVBQ0EsR0FBQSxFQUFLLE1BREw7VUFERztPQVhQO0tBRGU7RUFBQSxDQW5CakIsQ0FBQTs7QUFBQSxtQ0FvQ0EsYUFBQSxHQUFlLFNBQUMsS0FBRCxHQUFBO0FBQ2IsSUFBQSxJQUFHLENBQUEsS0FBSDthQUNFLEtBREY7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2FBQ0gsS0FBQSxLQUFTLElBQUMsQ0FBQSxNQURQO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjthQUNILElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBREc7S0FBQSxNQUFBO2FBR0gsR0FBRyxDQUFDLElBQUosQ0FBVSxtRUFBQSxHQUFmLElBQUMsQ0FBQSxJQUFJLEVBSEc7S0FMUTtFQUFBLENBcENmLENBQUE7O0FBQUEsbUNBK0NBLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxRQUFBLHNCQUFBO0FBQUE7QUFBQSxTQUFBLDJDQUFBO3dCQUFBO0FBQ0UsTUFBQSxJQUFlLEtBQUEsS0FBUyxNQUFNLENBQUMsS0FBL0I7QUFBQSxlQUFPLElBQVAsQ0FBQTtPQURGO0FBQUEsS0FBQTtXQUdBLE1BSmM7RUFBQSxDQS9DaEIsQ0FBQTs7QUFBQSxtQ0FzREEsWUFBQSxHQUFjLFNBQUMsS0FBRCxHQUFBO0FBQ1osUUFBQSw4QkFBQTtBQUFBLElBQUEsTUFBQSxHQUFTLEVBQVQsQ0FBQTtBQUNBO0FBQUEsU0FBQSwyQ0FBQTt3QkFBQTtBQUNFLE1BQUEsSUFBc0IsTUFBTSxDQUFDLEtBQVAsS0FBa0IsS0FBeEM7QUFBQSxRQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBWixDQUFBLENBQUE7T0FERjtBQUFBLEtBREE7V0FJQSxPQUxZO0VBQUEsQ0F0RGQsQ0FBQTs7QUFBQSxtQ0E4REEsWUFBQSxHQUFjLFNBQUMsS0FBRCxHQUFBO0FBQ1osUUFBQSw4QkFBQTtBQUFBLElBQUEsTUFBQSxHQUFTLEVBQVQsQ0FBQTtBQUNBO0FBQUEsU0FBQSwyQ0FBQTt3QkFBQTtBQUNFLE1BQUEsSUFBNEIsTUFBTSxDQUFDLEtBQVAsS0FBa0IsS0FBOUM7QUFBQSxRQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBTSxDQUFDLEtBQW5CLENBQUEsQ0FBQTtPQURGO0FBQUEsS0FEQTtXQUlBLE9BTFk7RUFBQSxDQTlEZCxDQUFBOztnQ0FBQTs7SUFORixDQUFBOzs7OztBQ0FBLElBQUEsZ0VBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUFULENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsR0FFQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUZOLENBQUE7O0FBQUEsUUFHQSxHQUFXLE9BQUEsQ0FBUSxzQkFBUixDQUhYLENBQUE7O0FBQUEsV0FJQSxHQUFjLE9BQUEsQ0FBUSx5QkFBUixDQUpkLENBQUE7O0FBQUEsWUFLQSxHQUFlLE9BQUEsQ0FBUSwyQkFBUixDQUxmLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FBdUI7QUFPUixFQUFBLGdCQUFDLElBQUQsR0FBQTtBQUNYLElBRGMsSUFBQyxDQUFBLFlBQUEsTUFBTSxJQUFDLENBQUEsZUFBQSxTQUFTLElBQUMsQ0FBQSxjQUFBLFFBQVEsSUFBQyxDQUFBLG1CQUFBLFdBQ3pDLENBQUE7QUFBQSxJQUFBLE1BQUEsQ0FBTyxpQkFBUCxFQUFlLGtDQUFmLENBQUEsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxNQUFNLENBQUMsYUFBUCxDQUFxQixJQUFDLENBQUEsSUFBdEIsRUFBNEIsSUFBQyxDQUFBLE9BQTdCLENBRGQsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUpWLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxVQUFELEdBQWtCLElBQUEsV0FBQSxDQUFBLENBUGxCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxXQUFELEdBQWUsRUFSZixDQUFBO0FBQUEsSUFXQSxJQUFDLENBQUEsWUFBRCxHQUFvQixJQUFBLFlBQUEsQ0FBYTtBQUFBLE1BQUEsTUFBQSxFQUFRLEVBQUEsR0FBNUMsTUFBTSxDQUFDLFVBQXFDLEdBQXVCLEdBQXZCLEdBQTVDLElBQUksQ0FBQyxJQUErQjtLQUFiLENBWHBCLENBQUE7QUFBQSxJQWNBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixNQWRwQixDQUFBO0FBQUEsSUFlQSxJQUFDLENBQUEsWUFBRCxHQUFnQixNQWZoQixDQURXO0VBQUEsQ0FBYjs7QUFBQSxtQkFtQkEsTUFBQSxHQUFRLFNBQUMsTUFBRCxHQUFBO1dBQ04sTUFBTSxDQUFDLElBQVAsS0FBZSxJQUFDLENBQUEsSUFBaEIsSUFBd0IsTUFBTSxDQUFDLE9BQVAsS0FBa0IsSUFBQyxDQUFBLFFBRHJDO0VBQUEsQ0FuQlIsQ0FBQTs7QUFBQSxtQkF5QkEsV0FBQSxHQUFhLFNBQUMsTUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFtQixjQUFuQjtBQUFBLGFBQU8sSUFBUCxDQUFBO0tBQUE7V0FDQSxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsTUFBTSxDQUFDLE9BQVAsSUFBa0IsRUFBbkIsRUFGQTtFQUFBLENBekJiLENBQUE7O0FBQUEsbUJBOEJBLEdBQUEsR0FBSyxTQUFDLFVBQUQsR0FBQTtBQUNILFFBQUEsYUFBQTtBQUFBLElBQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsOEJBQUQsQ0FBZ0MsVUFBaEMsQ0FBaEIsQ0FBQTtXQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixhQUFoQixFQUZHO0VBQUEsQ0E5QkwsQ0FBQTs7QUFBQSxtQkFtQ0EsSUFBQSxHQUFNLFNBQUMsUUFBRCxHQUFBO1dBQ0osSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLFFBQWpCLEVBREk7RUFBQSxDQW5DTixDQUFBOztBQUFBLG1CQXVDQSxHQUFBLEdBQUssU0FBQyxRQUFELEdBQUE7QUFDSCxJQUFBLFFBQVEsQ0FBQyxTQUFULENBQW1CLElBQW5CLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixRQUFRLENBQUMsSUFBMUIsRUFBZ0MsUUFBaEMsRUFGRztFQUFBLENBdkNMLENBQUE7O0FBQUEsbUJBNENBLDhCQUFBLEdBQWdDLFNBQUMsVUFBRCxHQUFBO0FBQzlCLFFBQUEsSUFBQTtBQUFBLElBQUUsT0FBUyxRQUFRLENBQUMsZUFBVCxDQUF5QixVQUF6QixFQUFULElBQUYsQ0FBQTtXQUNBLEtBRjhCO0VBQUEsQ0E1Q2hDLENBQUE7O0FBQUEsRUFpREEsTUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFELEVBQU8sT0FBUCxHQUFBO0FBQ2QsSUFBQSxJQUFHLE9BQUg7YUFDRSxFQUFBLEdBQUwsSUFBSyxHQUFVLEdBQVYsR0FBTCxRQURHO0tBQUEsTUFBQTthQUdFLEVBQUEsR0FBTCxLQUhHO0tBRGM7RUFBQSxDQWpEaEIsQ0FBQTs7Z0JBQUE7O0lBZEYsQ0FBQTs7Ozs7QUNBQSxJQUFBLHFDQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEsVUFBUixDQURULENBQUE7O0FBQUEsWUFFQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUixDQUZmLENBQUE7O0FBQUEsT0FHQSxHQUFVLE9BQUEsQ0FBUSxXQUFSLENBSFYsQ0FBQTs7QUFBQSxNQUtNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtTQUVsQjtBQUFBLElBQUEsT0FBQSxFQUFTLEVBQVQ7QUFBQSxJQWFBLElBQUEsRUFBTSxTQUFDLFVBQUQsR0FBQTtBQUNKLFVBQUEsaUNBQUE7QUFBQSxNQUFBLE1BQUEsQ0FBTyxrQkFBUCxFQUFvQiwwQ0FBcEIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxNQUFBLENBQU8sQ0FBQSxDQUFLLE1BQUEsQ0FBQSxVQUFBLEtBQXFCLFFBQXRCLENBQVgsRUFBNEMsNERBQTVDLENBREEsQ0FBQTtBQUFBLE1BR0EsT0FBQSxHQUFVLE9BQU8sQ0FBQyxLQUFSLENBQWMsVUFBVSxDQUFDLE9BQXpCLENBSFYsQ0FBQTtBQUFBLE1BSUEsZ0JBQUEsR0FBbUIsTUFBTSxDQUFDLGFBQVAsQ0FBcUIsVUFBVSxDQUFDLElBQWhDLEVBQXNDLE9BQXRDLENBSm5CLENBQUE7QUFLQSxNQUFBLElBQVUsSUFBQyxDQUFBLEdBQUQsQ0FBSyxnQkFBTCxDQUFWO0FBQUEsY0FBQSxDQUFBO09BTEE7QUFBQSxNQU9BLE1BQUEsR0FBUyxZQUFZLENBQUMsS0FBYixDQUFtQixVQUFuQixDQVBULENBQUE7QUFRQSxNQUFBLElBQUcsTUFBSDtlQUNFLElBQUMsQ0FBQSxHQUFELENBQUssTUFBTCxFQURGO09BQUEsTUFBQTtBQUdFLGNBQVUsSUFBQSxLQUFBLENBQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFwQixDQUFWLENBSEY7T0FUSTtJQUFBLENBYk47QUFBQSxJQThCQSxHQUFBLEVBQUssU0FBQyxNQUFELEdBQUE7QUFDSCxNQUFBLElBQUcsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFNLENBQUMsSUFBUCxDQUE1QixDQUFIO0FBQ0UsUUFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVQsR0FBd0IsTUFBeEIsQ0FERjtPQUFBO2FBRUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFNLENBQUMsVUFBUCxDQUFULEdBQThCLE9BSDNCO0lBQUEsQ0E5Qkw7QUFBQSxJQXFDQSxHQUFBLEVBQUssU0FBQyxnQkFBRCxHQUFBO2FBQ0gsdUNBREc7SUFBQSxDQXJDTDtBQUFBLElBMkNBLEdBQUEsRUFBSyxTQUFDLGdCQUFELEdBQUE7QUFDSCxNQUFBLE1BQUEsQ0FBTyxJQUFDLENBQUEsR0FBRCxDQUFLLGdCQUFMLENBQVAsRUFBZ0MsaUJBQUEsR0FBbkMsZ0JBQW1DLEdBQW9DLGtCQUFwRSxDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLGdCQUFBLEVBRk47SUFBQSxDQTNDTDtBQUFBLElBaURBLFVBQUEsRUFBWSxTQUFBLEdBQUE7YUFDVixJQUFDLENBQUEsT0FBRCxHQUFXLEdBREQ7SUFBQSxDQWpEWjtJQUZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBTGpCLENBQUE7Ozs7O0FDQUEsSUFBQSxtQ0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxPQUNBLEdBQVUsT0FBQSxDQUFRLFNBQVIsQ0FEVixDQUFBOztBQUFBLE9BRUEsR0FBVSxPQUFBLENBQVEsV0FBUixDQUZWLENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FBaUIsU0FBQSxHQUFZLE9BQU8sQ0FBQyxLQUFELENBQVAsQ0FBQSxDQUg3QixDQUFBOztBQUFBLFNBUVMsQ0FBQyxHQUFWLENBQWMsV0FBZCxFQUEyQixTQUFDLEtBQUQsR0FBQTtTQUN6QixLQUFBLEtBQVMsUUFBVCxJQUFxQixLQUFBLEtBQVMsU0FETDtBQUFBLENBQTNCLENBUkEsQ0FBQTs7QUFBQSxTQVlTLENBQUMsR0FBVixDQUFjLFFBQWQsRUFBd0IsU0FBQyxLQUFELEdBQUE7U0FDdEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFmLENBQW9CLEtBQXBCLEVBRHNCO0FBQUEsQ0FBeEIsQ0FaQSxDQUFBOztBQUFBLFNBbUJTLENBQUMsR0FBVixDQUFjLGtCQUFkLEVBQWtDLFNBQUMsS0FBRCxHQUFBO0FBQ2hDLE1BQUEsMkJBQUE7QUFBQSxFQUFBLFVBQUEsR0FBYSxDQUFiLENBQUE7QUFDQSxPQUFBLDRDQUFBO3NCQUFBO0FBQ0UsSUFBQSxJQUFtQixDQUFBLEtBQVMsQ0FBQyxLQUE3QjtBQUFBLE1BQUEsVUFBQSxJQUFjLENBQWQsQ0FBQTtLQURGO0FBQUEsR0FEQTtTQUlBLFVBQUEsS0FBYyxFQUxrQjtBQUFBLENBQWxDLENBbkJBLENBQUE7O0FBQUEsU0E4QlMsQ0FBQyxHQUFWLENBQWMsUUFBZCxFQUNFO0FBQUEsRUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLEVBQ0EsT0FBQSxFQUFTLGdCQURUO0FBQUEsRUFFQSxNQUFBLEVBQVEsa0JBRlI7QUFBQSxFQUdBLFdBQUEsRUFBYSxrQkFIYjtBQUFBLEVBSUEsTUFBQSxFQUNFO0FBQUEsSUFBQSxVQUFBLEVBQVksVUFBWjtBQUFBLElBQ0EsR0FBQSxFQUFLLGlCQURMO0FBQUEsSUFFQSxFQUFBLEVBQUksMkJBRko7R0FMRjtBQUFBLEVBUUEsVUFBQSxFQUFZLG9CQVJaO0FBQUEsRUFTQSxtQkFBQSxFQUNFO0FBQUEsSUFBQSxVQUFBLEVBQVksVUFBWjtBQUFBLElBQ0Esb0JBQUEsRUFBc0IsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO2FBQWdCLFNBQVMsQ0FBQyxRQUFWLENBQW1CLG1CQUFuQixFQUF3QyxLQUF4QyxFQUFoQjtJQUFBLENBRHRCO0dBVkY7QUFBQSxFQVlBLE1BQUEsRUFBUSwwQkFaUjtBQUFBLEVBYUEsaUJBQUEsRUFDRTtBQUFBLElBQUEsVUFBQSxFQUFZLFVBQVo7QUFBQSxJQUNBLFNBQUEsRUFBVyxrQkFEWDtBQUFBLElBRUEsS0FBQSxFQUFPLGtCQUZQO0dBZEY7QUFBQSxFQWlCQSxXQUFBLEVBQ0U7QUFBQSxJQUFBLFVBQUEsRUFBWSxVQUFaO0FBQUEsSUFDQSxvQkFBQSxFQUFzQixTQUFDLEdBQUQsRUFBTSxLQUFOLEdBQUE7YUFBZ0IsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsWUFBbkIsRUFBaUMsS0FBakMsRUFBaEI7SUFBQSxDQUR0QjtHQWxCRjtDQURGLENBOUJBLENBQUE7O0FBQUEsU0FxRFMsQ0FBQyxHQUFWLENBQWMsV0FBZCxFQUNFO0FBQUEsRUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLEVBQ0EsS0FBQSxFQUFPLGtCQURQO0FBQUEsRUFFQSxJQUFBLEVBQU0sUUFGTjtBQUFBLEVBR0EsVUFBQSxFQUFZLGtCQUhaO0FBQUEsRUFJQSxVQUFBLEVBQVksMkJBSlo7QUFBQSxFQUtBLG9CQUFBLEVBQXNCLFNBQUMsR0FBRCxFQUFNLEtBQU4sR0FBQTtXQUFnQixNQUFoQjtFQUFBLENBTHRCO0NBREYsQ0FyREEsQ0FBQTs7QUFBQSxTQThEUyxDQUFDLEdBQVYsQ0FBYyxPQUFkLEVBQ0U7QUFBQSxFQUFBLEtBQUEsRUFBTyxRQUFQO0FBQUEsRUFDQSxVQUFBLEVBQVksaUJBRFo7Q0FERixDQTlEQSxDQUFBOztBQUFBLFNBb0VTLENBQUMsR0FBVixDQUFjLG1CQUFkLEVBQ0U7QUFBQSxFQUFBLEtBQUEsRUFBTyxrQkFBUDtBQUFBLEVBQ0EsSUFBQSxFQUFNLG1CQUROO0FBQUEsRUFFQSxLQUFBLEVBQU8sa0JBRlA7QUFBQSxFQUdBLE9BQUEsRUFBUyxrREFIVDtDQURGLENBcEVBLENBQUE7O0FBQUEsU0EyRVMsQ0FBQyxHQUFWLENBQWMsWUFBZCxFQUNFO0FBQUEsRUFBQSxLQUFBLEVBQU8sa0JBQVA7QUFBQSxFQUNBLEtBQUEsRUFBTyxRQURQO0NBREYsQ0EzRUEsQ0FBQTs7QUFBQSxTQWdGUyxDQUFDLEdBQVYsQ0FBYyxhQUFkLEVBQ0U7QUFBQSxFQUFBLE9BQUEsRUFBUyxRQUFUO0FBQUEsRUFDQSxLQUFBLEVBQU8sa0JBRFA7Q0FERixDQWhGQSxDQUFBOzs7OztBQ0FBLElBQUEsK0dBQUE7O0FBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUFOLENBQUE7O0FBQUEsQ0FDQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBREosQ0FBQTs7QUFBQSxNQUVBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRlQsQ0FBQTs7QUFBQSxrQkFHQSxHQUFxQixPQUFBLENBQVEsd0JBQVIsQ0FIckIsQ0FBQTs7QUFBQSxzQkFJQSxHQUF5QixPQUFBLENBQVEsNEJBQVIsQ0FKekIsQ0FBQTs7QUFBQSxRQUtBLEdBQVcsT0FBQSxDQUFRLHNCQUFSLENBTFgsQ0FBQTs7QUFBQSxNQU1BLEdBQVMsT0FBQSxDQUFRLFVBQVIsQ0FOVCxDQUFBOztBQUFBLE9BT0EsR0FBVSxPQUFBLENBQVEsV0FBUixDQVBWLENBQUE7O0FBQUEsVUFRQSxHQUFhLE9BQUEsQ0FBUSxlQUFSLENBUmIsQ0FBQTs7QUFBQSxDQVNBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FUSixDQUFBOztBQUFBLE1BV00sQ0FBQyxPQUFQLEdBQWlCLFlBQUEsR0FFZjtBQUFBLEVBQUEsS0FBQSxFQUFPLFNBQUMsWUFBRCxHQUFBO0FBQ0wsUUFBQSxNQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BQVYsQ0FBQTtBQUNBLElBQUEsSUFBRyxrQkFBa0IsQ0FBQyxRQUFuQixDQUE0QixRQUE1QixFQUFzQyxZQUF0QyxDQUFIO2FBQ0UsSUFBQyxDQUFBLFlBQUQsQ0FBYyxZQUFkLEVBREY7S0FBQSxNQUFBO0FBR0UsTUFBQSxNQUFBLEdBQVMsa0JBQWtCLENBQUMsZ0JBQW5CLENBQUEsQ0FBVCxDQUFBO0FBQ0EsWUFBVSxJQUFBLEtBQUEsQ0FBTSxNQUFOLENBQVYsQ0FKRjtLQUZLO0VBQUEsQ0FBUDtBQUFBLEVBU0EsWUFBQSxFQUFjLFNBQUMsWUFBRCxHQUFBO0FBQ1osUUFBQSxzRkFBQTtBQUFBLElBQUUsc0JBQUEsTUFBRixFQUFVLDBCQUFBLFVBQVYsRUFBc0IsbUNBQUEsbUJBQXRCLEVBQTJDLHNCQUFBLE1BQTNDLEVBQW1ELGlDQUFBLGlCQUFuRCxFQUFzRSwyQkFBQSxXQUF0RSxDQUFBO0FBQ0E7QUFDRSxNQUFBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsWUFBakIsQ0FBVixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLE1BQWIsQ0FEQSxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsbUJBQTFCLENBRkEsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLFdBQWxCLENBSEEsQ0FBQTtBQUFBLE1BSUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsVUFBakIsQ0FKQSxDQUFBO0FBQUEsTUFLQSxJQUFDLENBQUEsV0FBRCxDQUFhLE1BQWIsQ0FMQSxDQUFBO0FBQUEsTUFNQSxJQUFDLENBQUEsYUFBRCxDQUFlLGlCQUFmLENBTkEsQ0FERjtLQUFBLGNBQUE7QUFTRSxNQURJLGNBQ0osQ0FBQTtBQUFBLE1BQUEsS0FBSyxDQUFDLE9BQU4sR0FBaUIsNkJBQUEsR0FBdEIsS0FBSyxDQUFDLE9BQUQsQ0FBQTtBQUNBLFlBQU0sS0FBTixDQVZGO0tBREE7V0FhQSxJQUFDLENBQUEsT0FkVztFQUFBLENBVGQ7QUFBQSxFQTBCQSxlQUFBLEVBQWlCLFNBQUMsTUFBRCxHQUFBO0FBQ2YsUUFBQSxPQUFBO0FBQUEsSUFBQSxPQUFBLEdBQWMsSUFBQSxPQUFBLENBQVEsTUFBTSxDQUFDLE9BQWYsQ0FBZCxDQUFBO1dBQ0ksSUFBQSxNQUFBLENBQ0Y7QUFBQSxNQUFBLElBQUEsRUFBTSxNQUFNLENBQUMsSUFBYjtBQUFBLE1BQ0EsT0FBQSxFQUFTLE9BQU8sQ0FBQyxRQUFSLENBQUEsQ0FEVDtLQURFLEVBRlc7RUFBQSxDQTFCakI7QUFBQSxFQW9DQSxXQUFBLEVBQWEsU0FBQyxNQUFELEdBQUE7QUFDWCxJQUFBLElBQWMsY0FBZDtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsU0FBRCxDQUFXLE1BQU0sQ0FBQyxFQUFsQixFQUFzQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxRQUFELEdBQUE7ZUFDcEIsS0FBQyxDQUFBLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBckIsQ0FBMkI7QUFBQSxVQUFBLEdBQUEsRUFBSyxRQUFMO1NBQTNCLEVBRG9CO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEIsQ0FGQSxDQUFBO1dBS0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxNQUFNLENBQUMsR0FBbEIsRUFBdUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsUUFBRCxHQUFBO2VBQ3JCLEtBQUMsQ0FBQSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQXJCLENBQTRCO0FBQUEsVUFBQSxHQUFBLEVBQUssUUFBTDtTQUE1QixFQURxQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCLEVBTlc7RUFBQSxDQXBDYjtBQUFBLEVBaURBLFNBQUEsRUFBVyxTQUFDLElBQUQsRUFBTyxRQUFQLEdBQUE7QUFDVCxRQUFBLHlCQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBRyxDQUFDLENBQUMsSUFBRixDQUFPLElBQVAsQ0FBQSxLQUFnQixRQUFuQjthQUNFLFFBQUEsQ0FBUyxJQUFULEVBREY7S0FBQSxNQUFBO0FBR0U7V0FBQSwyQ0FBQTt5QkFBQTtBQUNFLHNCQUFBLFFBQUEsQ0FBUyxLQUFULEVBQUEsQ0FERjtBQUFBO3NCQUhGO0tBSFM7RUFBQSxDQWpEWDtBQUFBLEVBK0RBLHdCQUFBLEVBQTBCLFNBQUMsbUJBQUQsR0FBQTtBQUN4QixRQUFBLHNCQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsbUJBQUQsR0FBdUIsRUFBdkIsQ0FBQTtBQUNBO1NBQUEsMkJBQUE7eUNBQUE7QUFDRSxNQUFBLE1BQU0sQ0FBQyxJQUFQLEdBQWMsSUFBZCxDQUFBO0FBQUEsb0JBQ0EsSUFBQyxDQUFBLG1CQUFvQixDQUFBLElBQUEsQ0FBckIsR0FBNkIsSUFBQyxDQUFBLHVCQUFELENBQXlCLE1BQXpCLEVBRDdCLENBREY7QUFBQTtvQkFGd0I7RUFBQSxDQS9EMUI7QUFBQSxFQXNFQSxnQkFBQSxFQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixRQUFBLHFCQUFBO0FBQUE7U0FBQSxjQUFBOzJCQUFBO0FBQ0Usb0JBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFZLENBQUEsSUFBQSxDQUFwQixHQUFnQyxJQUFBLFVBQUEsQ0FDOUI7QUFBQSxRQUFBLElBQUEsRUFBTSxJQUFOO0FBQUEsUUFDQSxLQUFBLEVBQU8sS0FBSyxDQUFDLEtBRGI7QUFBQSxRQUVBLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FGYjtPQUQ4QixFQUFoQyxDQURGO0FBQUE7b0JBRGdCO0VBQUEsQ0F0RWxCO0FBQUEsRUE4RUEsZUFBQSxFQUFpQixTQUFDLFVBQUQsR0FBQTtBQUNmLFFBQUEsOEVBQUE7O01BRGdCLGFBQVc7S0FDM0I7QUFBQTtTQUFBLGlEQUFBLEdBQUE7QUFDRSw2QkFESSxZQUFBLE1BQU0sYUFBQSxPQUFPLFlBQUEsTUFBTSxrQkFBQSxZQUFZLGtCQUFBLFVBQ25DLENBQUE7QUFBQSxNQUFBLFVBQUEsR0FBYSxJQUFDLENBQUEseUJBQUQsQ0FBMkIsVUFBM0IsQ0FBYixDQUFBO0FBQUEsTUFFQSxTQUFBLEdBQWdCLElBQUEsUUFBQSxDQUNkO0FBQUEsUUFBQSxJQUFBLEVBQU0sSUFBTjtBQUFBLFFBQ0EsS0FBQSxFQUFPLEtBRFA7QUFBQSxRQUVBLElBQUEsRUFBTSxJQUZOO0FBQUEsUUFHQSxVQUFBLEVBQVksVUFIWjtPQURjLENBRmhCLENBQUE7QUFBQSxNQVFBLElBQUMsQ0FBQSxlQUFELENBQWlCLFNBQWpCLEVBQTRCLFVBQTVCLENBUkEsQ0FBQTtBQUFBLG9CQVNBLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFZLFNBQVosRUFUQSxDQURGO0FBQUE7b0JBRGU7RUFBQSxDQTlFakI7QUFBQSxFQTRGQSxlQUFBLEVBQWlCLFNBQUMsU0FBRCxFQUFZLFVBQVosR0FBQTtBQUNmLFFBQUEsZ0RBQUE7QUFBQTtTQUFBLGtCQUFBOzhCQUFBO0FBQ0UsTUFBQSxTQUFBLEdBQVksU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFyQixDQUF5QixJQUF6QixDQUFaLENBQUE7QUFBQSxNQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQW1CLDJCQUFBLEdBQXhCLElBQXdCLEdBQWtDLE1BQWxDLEdBQXhCLFNBQVMsQ0FBQyxJQUFjLEdBQXlELGFBQTVFLENBREEsQ0FBQTtBQUFBLE1BRUEsZUFBQSxHQUFrQixDQUFDLENBQUMsTUFBRixDQUFTLEVBQVQsRUFBYSxJQUFiLENBRmxCLENBQUE7QUFHQSxNQUFBLElBQXNFLElBQUksQ0FBQyxXQUEzRTtBQUFBLFFBQUEsZUFBZSxDQUFDLFdBQWhCLEdBQThCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFJLENBQUMsV0FBeEIsQ0FBOUIsQ0FBQTtPQUhBO0FBQUEsb0JBSUEsU0FBUyxDQUFDLFNBQVYsQ0FBb0IsZUFBcEIsRUFKQSxDQURGO0FBQUE7b0JBRGU7RUFBQSxDQTVGakI7QUFBQSxFQXFHQSx5QkFBQSxFQUEyQixTQUFDLGFBQUQsR0FBQTtBQUN6QixRQUFBLDBDQUFBO0FBQUEsSUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBQ0E7QUFBQSxTQUFBLDJDQUFBO3NCQUFBO0FBQ0UsTUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLG1CQUFvQixDQUFBLElBQUEsQ0FBaEMsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxDQUFPLFFBQVAsRUFBa0IseUJBQUEsR0FBdkIsSUFBdUIsR0FBZ0Msa0JBQWxELENBREEsQ0FBQTtBQUFBLE1BRUEsVUFBVyxDQUFBLElBQUEsQ0FBWCxHQUFtQixRQUZuQixDQURGO0FBQUEsS0FEQTtXQU1BLFdBUHlCO0VBQUEsQ0FyRzNCO0FBQUEsRUErR0EsaUJBQUEsRUFBbUIsU0FBQyxVQUFELEdBQUE7QUFDakIsSUFBQSxJQUFjLGtCQUFkO0FBQUEsWUFBQSxDQUFBO0tBQUE7V0FDQSxJQUFDLENBQUEsUUFBRCxDQUFVLFVBQVYsRUFBc0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsSUFBRCxHQUFBO0FBQ3BCLFlBQUEsS0FBQTtBQUFBLFFBQUEsS0FBQSxHQUFRLEtBQUMsQ0FBQSxNQUFNLENBQUMsV0FBWSxDQUFBLElBQUEsQ0FBNUIsQ0FBQTtBQUFBLFFBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBZSxrQkFBQSxHQUFwQixJQUFvQixHQUF5QixrQkFBeEMsQ0FEQSxDQUFBO2VBRUEsTUFIb0I7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QixFQUZpQjtFQUFBLENBL0duQjtBQUFBLEVBdUhBLFdBQUEsRUFBYSxTQUFDLE1BQUQsR0FBQTtBQUNYLFFBQUEsb0RBQUE7O01BRFksU0FBTztLQUNuQjtBQUFBO1NBQUEsNkNBQUE7eUJBQUE7QUFDRSxNQUFBLFVBQUE7O0FBQWE7QUFBQTthQUFBLDZDQUFBO21DQUFBO0FBQ1gseUJBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksYUFBWixFQUFBLENBRFc7QUFBQTs7bUJBQWIsQ0FBQTtBQUFBLG9CQUdBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQWYsQ0FDRTtBQUFBLFFBQUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUFiO0FBQUEsUUFDQSxVQUFBLEVBQVksVUFEWjtPQURGLEVBSEEsQ0FERjtBQUFBO29CQURXO0VBQUEsQ0F2SGI7QUFBQSxFQWlJQSxhQUFBLEVBQWUsU0FBQyxpQkFBRCxHQUFBO0FBQ2IsUUFBQSxnQkFBQTtBQUFBLElBQUEsSUFBYyx5QkFBZDtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDRSw4QkFBQSxTQUFGLEVBQWEsMEJBQUEsS0FEYixDQUFBO0FBRUEsSUFBQSxJQUF1RCxTQUF2RDtBQUFBLE1BQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixHQUEyQixJQUFDLENBQUEsWUFBRCxDQUFjLFNBQWQsQ0FBM0IsQ0FBQTtLQUZBO0FBR0EsSUFBQSxJQUErQyxLQUEvQzthQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixHQUF1QixJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsRUFBdkI7S0FKYTtFQUFBLENBaklmO0FBQUEsRUF3SUEsWUFBQSxFQUFjLFNBQUMsSUFBRCxHQUFBO0FBQ1osUUFBQSxTQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksSUFBWixDQUFaLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQW1CLDJCQUFBLEdBQXRCLElBQUcsQ0FEQSxDQUFBO1dBRUEsVUFIWTtFQUFBLENBeElkO0FBQUEsRUE4SUEsdUJBQUEsRUFBeUIsU0FBQyxlQUFELEdBQUE7V0FDbkIsSUFBQSxzQkFBQSxDQUF1QixlQUF2QixFQURtQjtFQUFBLENBOUl6QjtBQUFBLEVBa0pBLFFBQUEsRUFBVSxTQUFDLE9BQUQsRUFBVSxNQUFWLEdBQUE7QUFDUixRQUFBLDhCQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsRUFBWCxDQUFBO0FBQ0EsU0FBQSw4Q0FBQTswQkFBQTtBQUNFLE1BQUEsR0FBQSxHQUFNLE1BQUEsQ0FBTyxLQUFQLENBQU4sQ0FBQTtBQUNBLE1BQUEsSUFBc0IsV0FBdEI7QUFBQSxRQUFBLFFBQVEsQ0FBQyxJQUFULENBQWMsR0FBZCxDQUFBLENBQUE7T0FGRjtBQUFBLEtBREE7V0FLQSxTQU5RO0VBQUEsQ0FsSlY7Q0FiRixDQUFBOztBQUFBLE1Bd0tNLENBQUMsTUFBUCxHQUFnQixZQXhLaEIsQ0FBQTs7Ozs7QUNBQSxJQUFBLDRCQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsS0FDQSxHQUFRLE9BQUEsQ0FBUSxrQkFBUixDQURSLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUZULENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBdUI7QUFFckIsTUFBQSxXQUFBOztBQUFBLEVBQUEsV0FBQSxHQUFjLGtCQUFkLENBQUE7O0FBRWEsRUFBQSxvQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLFlBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxZQUFBLE1BQU0sYUFBQSxPQUFPLGFBQUEsS0FDNUIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFBLElBQVMsS0FBSyxDQUFDLFFBQU4sQ0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBQWxCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaLENBRFQsQ0FEVztFQUFBLENBRmI7O0FBQUEsdUJBT0EsVUFBQSxHQUFZLFNBQUMsS0FBRCxHQUFBO0FBQ1YsUUFBQSxHQUFBO0FBQUEsSUFBQSxJQUFHLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUCxDQUFBLEtBQWlCLFFBQXBCO0FBQ0UsTUFBQSxHQUFBLEdBQU0sV0FBVyxDQUFDLElBQVosQ0FBaUIsS0FBakIsQ0FBTixDQUFBO0FBQUEsTUFDQSxLQUFBLEdBQVEsTUFBQSxDQUFPLEdBQUksQ0FBQSxDQUFBLENBQVgsQ0FBQSxHQUFpQixNQUFBLENBQU8sR0FBSSxDQUFBLENBQUEsQ0FBWCxDQUR6QixDQURGO0tBQUE7QUFBQSxJQUlBLE1BQUEsQ0FBTyxDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsQ0FBQSxLQUFpQixRQUF4QixFQUFtQyw4QkFBQSxHQUF0QyxLQUFHLENBSkEsQ0FBQTtXQUtBLE1BTlU7RUFBQSxDQVBaLENBQUE7O29CQUFBOztJQU5GLENBQUE7Ozs7O0FDQUEsSUFBQSxPQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQXVCO0FBQ3JCLEVBQUEsT0FBQyxDQUFBLE1BQUQsR0FBVSwwQkFBVixDQUFBOztBQUVhLEVBQUEsaUJBQUMsYUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsWUFBRCxDQUFjLGFBQWQsQ0FBQSxDQURXO0VBQUEsQ0FGYjs7QUFBQSxvQkFNQSxZQUFBLEdBQWMsU0FBQyxhQUFELEdBQUE7QUFDWixRQUFBLEdBQUE7QUFBQSxJQUFBLEdBQUEsR0FBTSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQWYsQ0FBb0IsYUFBcEIsQ0FBTixDQUFBO0FBQ0EsSUFBQSxJQUFHLEdBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsR0FBSSxDQUFBLENBQUEsQ0FBYixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEdBQUksQ0FBQSxDQUFBLENBRGIsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxHQUFJLENBQUEsQ0FBQSxDQUZiLENBQUE7YUFHQSxJQUFDLENBQUEsUUFBRCxHQUFZLEdBQUksQ0FBQSxDQUFBLEVBSmxCO0tBRlk7RUFBQSxDQU5kLENBQUE7O0FBQUEsb0JBZUEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLG1CQURPO0VBQUEsQ0FmVCxDQUFBOztBQUFBLG9CQW1CQSxRQUFBLEdBQVUsU0FBQSxHQUFBO1dBQ1IsRUFBQSxHQUFILElBQUMsQ0FBQSxLQUFFLEdBQVksR0FBWixHQUFILElBQUMsQ0FBQSxLQUFFLEdBQXdCLEdBQXhCLEdBQUgsSUFBQyxDQUFBLEtBQUUsR0FBcUMsQ0FBeEMsSUFBQyxDQUFBLFFBQUQsSUFBYSxFQUEyQixFQUQ3QjtFQUFBLENBbkJWLENBQUE7O0FBQUEsRUF1QkEsT0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLGFBQUQsR0FBQTtBQUNOLFFBQUEsQ0FBQTtBQUFBLElBQUEsQ0FBQSxHQUFRLElBQUEsT0FBQSxDQUFRLGFBQVIsQ0FBUixDQUFBO0FBQ0EsSUFBQSxJQUFHLENBQUMsQ0FBQyxPQUFGLENBQUEsQ0FBSDthQUFvQixDQUFDLENBQUMsUUFBRixDQUFBLEVBQXBCO0tBQUEsTUFBQTthQUFzQyxHQUF0QztLQUZNO0VBQUEsQ0F2QlIsQ0FBQTs7aUJBQUE7O0lBREYsQ0FBQTs7Ozs7QUNBQSxNQUFNLENBQUMsT0FBUCxHQUtFO0FBQUEsRUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLEVBTUEsR0FBQSxFQUFLLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUNILElBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWYsQ0FBSDthQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBQXVCLEtBQXZCLEVBREY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLEtBQXBCLEVBQTJCLEtBQTNCLEVBSEY7S0FERztFQUFBLENBTkw7QUFBQSxFQWFBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxRQUFBLGFBQUE7QUFBQSxJQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsS0FBcEIsQ0FBTixDQUFBO1dBQ0EsUUFBQSxHQUFZLHNCQUFBLEdBQWYsR0FBRyxDQUFDLEtBQVcsR0FBa0MsR0FBbEMsR0FBZixHQUFHLENBQUMsTUFBVyxHQUFrRCxpQkFGaEQ7RUFBQSxDQWJoQjtBQUFBLEVBbUJBLE1BQUEsRUFBUSxTQUFDLEtBQUQsR0FBQTtXQUNOLE1BRE07RUFBQSxDQW5CUjtBQUFBLEVBMEJBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEVBQVEsS0FBUixHQUFBO1dBQ2QsS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFYLEVBQWtCLEtBQWxCLEVBRGM7RUFBQSxDQTFCaEI7QUFBQSxFQThCQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsRUFBUSxLQUFSLEdBQUE7V0FDbEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUErQixNQUFBLEdBQUssQ0FBdkMsSUFBQyxDQUFBLFlBQUQsQ0FBYyxLQUFkLENBQXVDLENBQUwsR0FBNkIsR0FBNUQsRUFEa0I7RUFBQSxDQTlCcEI7QUFBQSxFQXNDQSxZQUFBLEVBQWMsU0FBQyxHQUFELEdBQUE7QUFDWixJQUFBLElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLENBQUg7YUFDRyxHQUFBLEdBQU4sR0FBTSxHQUFTLElBRFo7S0FBQSxNQUFBO2FBR0UsSUFIRjtLQURZO0VBQUEsQ0F0Q2Q7QUFBQSxFQTZDQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsR0FBQTtBQUNsQixJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBZSxLQUFmLENBQUg7YUFDRTtBQUFBLFFBQUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUFOLENBQUEsQ0FBUDtBQUFBLFFBQ0EsTUFBQSxFQUFRLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FEUjtRQURGO0tBQUEsTUFBQTthQUlFO0FBQUEsUUFBQSxLQUFBLEVBQU8sS0FBSyxDQUFDLFVBQU4sQ0FBQSxDQUFQO0FBQUEsUUFDQSxNQUFBLEVBQVEsS0FBSyxDQUFDLFdBQU4sQ0FBQSxDQURSO1FBSkY7S0FEa0I7RUFBQSxDQTdDcEI7QUFBQSxFQXNEQSxRQUFBLEVBQVUsU0FBQyxLQUFELEdBQUE7QUFDUixJQUFBLElBQW9DLGFBQXBDO2FBQUEsS0FBSyxDQUFDLE9BQU4sQ0FBYyxZQUFkLENBQUEsS0FBK0IsRUFBL0I7S0FEUTtFQUFBLENBdERWO0FBQUEsRUEwREEsYUFBQSxFQUFlLFNBQUMsS0FBRCxHQUFBO1dBQ2IsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFsQixDQUFBLENBQUEsS0FBbUMsTUFEdEI7RUFBQSxDQTFEZjtBQUFBLEVBOERBLGlCQUFBLEVBQW1CLFNBQUMsS0FBRCxHQUFBO1dBQ2pCLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFRLENBQUMsV0FBbEIsQ0FBQSxDQUFBLEtBQW1DLE1BRGxCO0VBQUEsQ0E5RG5CO0NBTEYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGdEQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLG1CQUNBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUixDQUR0QixDQUFBOztBQUFBLG1CQUVBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUixDQUZ0QixDQUFBOztBQUFBLE1BSU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO0FBR2xCLE1BQUEsUUFBQTtBQUFBLEVBQUEsUUFBQSxHQUNFO0FBQUEsSUFBQSxVQUFBLEVBQVksbUJBQVo7QUFBQSxJQUNBLFNBQUEsRUFBVyxtQkFEWDtHQURGLENBQUE7U0FRQTtBQUFBLElBQUEsR0FBQSxFQUFLLFNBQUMsV0FBRCxHQUFBOztRQUFDLGNBQWM7T0FDbEI7YUFBQSw4QkFERztJQUFBLENBQUw7QUFBQSxJQUlBLEdBQUEsRUFBSyxTQUFDLFdBQUQsR0FBQTs7UUFBQyxjQUFjO09BQ2xCO0FBQUEsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLEdBQUQsQ0FBSyxXQUFMLENBQVAsRUFBMkIsK0JBQUEsR0FBOUIsV0FBRyxDQUFBLENBQUE7YUFDQSxRQUFTLENBQUEsV0FBQSxFQUZOO0lBQUEsQ0FKTDtBQUFBLElBU0EsV0FBQSxFQUFhLFNBQUMsUUFBRCxHQUFBO0FBQ1gsVUFBQSx1QkFBQTtBQUFBO1dBQUEsZ0JBQUE7aUNBQUE7QUFDRSxzQkFBQSxRQUFBLENBQVMsSUFBVCxFQUFlLE9BQWYsRUFBQSxDQURGO0FBQUE7c0JBRFc7SUFBQSxDQVRiO0lBWGtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FKakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLGlDQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLFVBQ0EsR0FBYSxPQUFBLENBQVEseUJBQVIsQ0FEYixDQUFBOztBQUFBLGFBRUEsR0FBZ0IsT0FBQSxDQUFRLHlCQUFSLENBQWtDLENBQUMsYUFBYyxDQUFBLFVBQUEsQ0FGakUsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtTQUtsQjtBQUFBLElBQUEsSUFBQSxFQUFNLFVBQU47QUFBQSxJQUlBLEdBQUEsRUFBSyxTQUFDLEtBQUQsRUFBUSxHQUFSLEdBQUE7QUFDSCxNQUFBLE1BQUEsQ0FBTyxhQUFBLElBQVEsR0FBQSxLQUFPLEVBQXRCLEVBQTBCLDBDQUExQixDQUFBLENBQUE7QUFFQSxNQUFBLElBQWlDLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEdBQXBCLENBQWpDO0FBQUEsZUFBTyxJQUFDLENBQUEsU0FBRCxDQUFXLEtBQVgsRUFBa0IsR0FBbEIsQ0FBUCxDQUFBO09BRkE7QUFBQSxNQUlBLEtBQUssQ0FBQyxRQUFOLENBQWUsT0FBZixDQUpBLENBQUE7QUFLQSxNQUFBLElBQUcsVUFBVSxDQUFDLGFBQVgsQ0FBeUIsS0FBekIsQ0FBSDtlQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBQXVCLEdBQXZCLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLEtBQXBCLEVBQTJCLEdBQTNCLEVBSEY7T0FORztJQUFBLENBSkw7QUFBQSxJQWdCQSxjQUFBLEVBQWdCLFNBQUMsS0FBRCxHQUFBO2FBQ2QsVUFBVSxDQUFDLGNBQVgsQ0FBMEIsS0FBMUIsRUFEYztJQUFBLENBaEJoQjtBQUFBLElBb0JBLE1BQUEsRUFBUSxTQUFDLEtBQUQsRUFBUSxJQUFSLEdBQUE7QUFDTixVQUFBLDZCQUFBO0FBQUEsNEJBRGMsT0FBa0IsSUFBaEIsWUFBQSxNQUFNLGVBQUEsT0FDdEIsQ0FBQTtBQUFBLE1BQUEsS0FBQSxHQUFRLEVBQVIsQ0FBQTtBQUNBLE1BQUEsSUFBOEUsWUFBOUU7QUFBQSxRQUFBLEtBQUEsSUFBVSxNQUFBLEdBQWIsSUFBSSxDQUFDLEtBQVEsR0FBbUIsSUFBbkIsR0FBYixJQUFJLENBQUMsTUFBUSxHQUFxQyxJQUFyQyxHQUFiLElBQUksQ0FBQyxDQUFRLEdBQWtELElBQWxELEdBQWIsSUFBSSxDQUFDLENBQUYsQ0FBQTtPQURBO0FBRUEsTUFBQSxJQUF3QixDQUFBLEdBQUksT0FBQSxJQUFXLGFBQWEsQ0FBQyxPQUFyRDtBQUFBLFFBQUEsS0FBQSxJQUFVLEtBQUEsR0FBYixDQUFHLENBQUE7T0FGQTthQUdBLEVBQUEsR0FBSCxhQUFhLENBQUMsSUFBWCxHQUFILEtBQUcsR0FBa0MsR0FBbEMsR0FBSCxNQUpTO0lBQUEsQ0FwQlI7QUFBQSxJQThCQSxZQUFBLEVBQWMsU0FBQyxHQUFELEdBQUE7QUFDWixNQUFBLEdBQUEsR0FBTSxVQUFVLENBQUMsWUFBWCxDQUF3QixHQUF4QixDQUFOLENBQUE7YUFDQyxNQUFBLEdBQUosR0FBSSxHQUFZLElBRkQ7SUFBQSxDQTlCZDtBQUFBLElBbUNBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEVBQVEsR0FBUixHQUFBO0FBQ2QsTUFBQSxJQUEyQixVQUFVLENBQUMsUUFBWCxDQUFvQixLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsQ0FBcEIsQ0FBM0I7QUFBQSxRQUFBLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQWpCLENBQUEsQ0FBQTtPQUFBO2FBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxVQUFYLEVBQXVCLEdBQXZCLEVBRmM7SUFBQSxDQW5DaEI7QUFBQSxJQXdDQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsRUFBUSxHQUFSLEdBQUE7YUFDbEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUE4QixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBOUIsRUFEa0I7SUFBQSxDQXhDcEI7QUFBQSxJQTZDQSxTQUFBLEVBQVcsU0FBQyxLQUFELEVBQVEsWUFBUixHQUFBO2FBQ1QsVUFBVSxDQUFDLEdBQVgsQ0FBZSxLQUFmLEVBQXNCLFlBQXRCLEVBRFM7SUFBQSxDQTdDWDtJQUxrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBSmpCLENBQUE7Ozs7O0FDQUEsSUFBQSw0Q0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLFdBQ0EsR0FBYyxPQUFBLENBQVEsMkNBQVIsQ0FEZCxDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FGVCxDQUFBOztBQUFBLEdBR0EsR0FBTSxNQUFNLENBQUMsR0FIYixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRXJCLE1BQUEsOEJBQUE7O0FBQUEsRUFBQSxXQUFBLEdBQWMsQ0FBZCxDQUFBOztBQUFBLEVBQ0EsaUJBQUEsR0FBb0IsQ0FEcEIsQ0FBQTs7QUFHYSxFQUFBLHVCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsYUFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHNCQUFBLGdCQUFnQixxQkFBQSxhQUMvQixDQUFBO0FBQUEsSUFBQSxJQUFnQyxhQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxhQUFhLENBQUMsS0FBdkIsQ0FBQTtLQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEscUJBQUQsR0FBeUIsRUFEekIsQ0FEVztFQUFBLENBSGI7O0FBQUEsMEJBU0EsS0FBQSxHQUFPLFNBQUMsYUFBRCxHQUFBO0FBQ0wsSUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQVgsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUF6QixDQUFBLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBTixDQUFBLENBRkEsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FBb0IsQ0FBQyxHQUFyQixDQUF5QjtBQUFBLE1BQUEsZ0JBQUEsRUFBa0IsTUFBbEI7S0FBekIsQ0FMaEIsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFrQixHQUFBLEdBQXJDLEdBQUcsQ0FBQyxXQUFlLENBTmhCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxXQUFELEdBQWUsQ0FBQSxDQUFHLGNBQUEsR0FBckIsR0FBRyxDQUFDLFVBQWlCLEdBQStCLElBQWxDLENBVGYsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUNKLENBQUMsTUFESCxDQUNVLElBQUMsQ0FBQSxXQURYLENBRUUsQ0FBQyxNQUZILENBRVUsSUFBQyxDQUFBLFlBRlgsQ0FHRSxDQUFDLEdBSEgsQ0FHTyxRQUhQLEVBR2lCLFNBSGpCLENBWEEsQ0FBQTtBQWlCQSxJQUFBLElBQWdDLGtCQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxPQUFwQixDQUFBLENBQUE7S0FqQkE7V0FvQkEsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBckJLO0VBQUEsQ0FUUCxDQUFBOztBQUFBLDBCQW1DQSxJQUFBLEdBQU0sU0FBQyxhQUFELEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sRUFBQSxHQUFYLGFBQWEsQ0FBQyxLQUFILEdBQXlCLElBQS9CO0FBQUEsTUFDQSxHQUFBLEVBQUssRUFBQSxHQUFWLGFBQWEsQ0FBQyxLQUFKLEdBQXlCLElBRDlCO0tBREYsQ0FBQSxDQUFBO1dBSUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsY0FBRCxDQUFnQixhQUFoQixFQUxOO0VBQUEsQ0FuQ04sQ0FBQTs7QUFBQSwwQkE0Q0EsY0FBQSxHQUFnQixTQUFDLGFBQUQsR0FBQTtBQUNkLFFBQUEsaUNBQUE7QUFBQSxJQUFBLE9BQTBCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixDQUExQixFQUFFLHFCQUFBLGFBQUYsRUFBaUIsWUFBQSxJQUFqQixDQUFBO0FBQ0EsSUFBQSxJQUF3QixZQUF4QjtBQUFBLGFBQU8sTUFBUCxDQUFBO0tBREE7QUFJQSxJQUFBLElBQWtCLElBQUEsS0FBUSxJQUFDLENBQUEsV0FBWSxDQUFBLENBQUEsQ0FBdkM7QUFBQSxhQUFPLElBQUMsQ0FBQSxNQUFSLENBQUE7S0FKQTtBQUFBLElBTUEsTUFBQSxHQUFTO0FBQUEsTUFBRSxJQUFBLEVBQU0sYUFBYSxDQUFDLEtBQXRCO0FBQUEsTUFBNkIsR0FBQSxFQUFLLGFBQWEsQ0FBQyxLQUFoRDtLQU5ULENBQUE7QUFPQSxJQUFBLElBQXlDLFlBQXpDO0FBQUEsTUFBQSxNQUFBLEdBQVMsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLENBQVQsQ0FBQTtLQVBBO0FBQUEsSUFRQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBUkEsQ0FBQTtBQVVBLElBQUEsSUFBRyxnQkFBQSxtREFBK0IsQ0FBRSxlQUF0QixLQUErQixJQUFDLENBQUEsY0FBOUM7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsQ0FEQSxDQUFBO0FBVUEsYUFBTyxNQUFQLENBWEY7S0FBQSxNQUFBO0FBYUUsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBLENBREEsQ0FBQTtBQUdBLE1BQUEsSUFBTyxjQUFQO0FBQ0UsUUFBQSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBdUIsR0FBRyxDQUFDLE1BQTNCLENBQUEsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUhGO09BSEE7QUFRQSxhQUFPLE1BQVAsQ0FyQkY7S0FYYztFQUFBLENBNUNoQixDQUFBOztBQUFBLDBCQStFQSxnQkFBQSxHQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixZQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEsV0FDTyxXQURQO0FBRUksUUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkIsQ0FBQSxDQUFBO2VBQ0EsSUFBQyxDQUFBLHdCQUFELENBQUEsRUFISjtBQUFBLFdBSU8sV0FKUDtBQUtJLFFBQUEsSUFBQyxDQUFBLGdDQUFELENBQWtDLE1BQU0sQ0FBQyxJQUF6QyxDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxJQUFULENBQW5CLEVBTko7QUFBQSxXQU9PLE1BUFA7QUFRSSxRQUFBLElBQUMsQ0FBQSxnQ0FBRCxDQUFrQyxNQUFNLENBQUMsSUFBekMsQ0FBQSxDQUFBO2VBQ0EsSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQUEsQ0FBRSxNQUFNLENBQUMsSUFBVCxDQUFuQixFQVRKO0FBQUEsS0FEZ0I7RUFBQSxDQS9FbEIsQ0FBQTs7QUFBQSwwQkE0RkEsaUJBQUEsR0FBbUIsU0FBQyxNQUFELEdBQUE7QUFDakIsUUFBQSxZQUFBO0FBQUEsSUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLFFBQXRCO0FBQ0UsTUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFyQixDQUFBLENBQVQsQ0FBQTtBQUVBLE1BQUEsSUFBRyxjQUFIO0FBQ0UsUUFBQSxJQUFHLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLElBQUMsQ0FBQSxjQUFwQjtBQUNFLFVBQUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsT0FBbEIsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQixDQUFQLENBRkY7U0FBQTtlQUlBLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixNQUE3QixFQUFxQyxNQUFNLENBQUMsYUFBNUMsRUFMRjtPQUFBLE1BQUE7ZUFPRSxJQUFDLENBQUEsZ0NBQUQsQ0FBa0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBaEUsRUFQRjtPQUhGO0tBQUEsTUFBQTtBQVlFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBckIsQ0FBQSxDQUFQLENBQUE7QUFDQSxNQUFBLElBQUcsWUFBSDtBQUNFLFFBQUEsSUFBRyxJQUFJLENBQUMsS0FBTCxLQUFjLElBQUMsQ0FBQSxjQUFsQjtBQUNFLFVBQUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsUUFBbEIsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQixDQUFQLENBRkY7U0FBQTtlQUlBLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixNQUFNLENBQUMsYUFBcEMsRUFBbUQsSUFBbkQsRUFMRjtPQUFBLE1BQUE7ZUFPRSxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBMUQsRUFQRjtPQWJGO0tBRGlCO0VBQUEsQ0E1Rm5CLENBQUE7O0FBQUEsMEJBb0hBLDJCQUFBLEdBQTZCLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUMzQixRQUFBLG1CQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sR0FBRyxDQUFDLDZCQUFKLENBQWtDLEtBQUssQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUE5QyxDQUFQLENBQUE7QUFBQSxJQUNBLElBQUEsR0FBTyxHQUFHLENBQUMsNkJBQUosQ0FBa0MsS0FBSyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQTlDLENBRFAsQ0FBQTtBQUFBLElBR0EsT0FBQSxHQUFhLElBQUksQ0FBQyxHQUFMLEdBQVcsSUFBSSxDQUFDLE1BQW5CLEdBQ1IsQ0FBQyxJQUFJLENBQUMsR0FBTCxHQUFXLElBQUksQ0FBQyxNQUFqQixDQUFBLEdBQTJCLENBRG5CLEdBR1IsQ0FORixDQUFBO1dBUUEsSUFBQyxDQUFBLFVBQUQsQ0FDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLElBQUksQ0FBQyxJQUFYO0FBQUEsTUFDQSxHQUFBLEVBQUssSUFBSSxDQUFDLE1BQUwsR0FBYyxPQURuQjtBQUFBLE1BRUEsS0FBQSxFQUFPLElBQUksQ0FBQyxLQUZaO0tBREYsRUFUMkI7RUFBQSxDQXBIN0IsQ0FBQTs7QUFBQSwwQkFtSUEsZ0NBQUEsR0FBa0MsU0FBQyxJQUFELEdBQUE7QUFDaEMsUUFBQSxlQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsVUFBaEIsRUFBNEIsS0FBNUIsQ0FGQSxDQUFBO0FBQUEsSUFHQSxHQUFBLEdBQU0sR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQWxDLENBSE4sQ0FBQTtBQUFBLElBSUEsVUFBQSxHQUFhLFFBQUEsQ0FBUyxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsR0FBUixDQUFZLGFBQVosQ0FBVCxDQUFBLElBQXdDLENBSnJELENBQUE7V0FLQSxJQUFDLENBQUEsVUFBRCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sR0FBRyxDQUFDLElBQVY7QUFBQSxNQUNBLEdBQUEsRUFBSyxHQUFHLENBQUMsR0FBSixHQUFVLGlCQUFWLEdBQThCLFVBRG5DO0FBQUEsTUFFQSxLQUFBLEVBQU8sR0FBRyxDQUFDLEtBRlg7S0FERixFQU5nQztFQUFBLENBbklsQyxDQUFBOztBQUFBLDBCQStJQSwwQkFBQSxHQUE0QixTQUFDLElBQUQsR0FBQTtBQUMxQixRQUFBLGtCQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsU0FBaEIsRUFBMkIsUUFBM0IsQ0FGQSxDQUFBO0FBQUEsSUFHQSxHQUFBLEdBQU0sR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQWxDLENBSE4sQ0FBQTtBQUFBLElBSUEsYUFBQSxHQUFnQixRQUFBLENBQVMsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLEdBQVIsQ0FBWSxnQkFBWixDQUFULENBQUEsSUFBMkMsQ0FKM0QsQ0FBQTtXQUtBLElBQUMsQ0FBQSxVQUFELENBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxHQUFHLENBQUMsSUFBVjtBQUFBLE1BQ0EsR0FBQSxFQUFLLEdBQUcsQ0FBQyxNQUFKLEdBQWEsaUJBQWIsR0FBaUMsYUFEdEM7QUFBQSxNQUVBLEtBQUEsRUFBTyxHQUFHLENBQUMsS0FGWDtLQURGLEVBTjBCO0VBQUEsQ0EvSTVCLENBQUE7O0FBQUEsMEJBMkpBLFVBQUEsR0FBWSxTQUFDLElBQUQsR0FBQTtBQUNWLFFBQUEsdUJBQUE7QUFBQSxJQURhLFlBQUEsTUFBTSxXQUFBLEtBQUssYUFBQSxLQUN4QixDQUFBO0FBQUEsSUFBQSxJQUFHLHNCQUFIO0FBRUUsTUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUE3QixDQUFSLENBQUE7QUFBQSxNQUNBLEdBQUEsSUFBTyxLQUFLLENBQUMsU0FBTixDQUFBLENBRFAsQ0FBQTtBQUFBLE1BRUEsSUFBQSxJQUFRLEtBQUssQ0FBQyxVQUFOLENBQUEsQ0FGUixDQUFBO0FBQUEsTUFLQSxJQUFBLElBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUxuQixDQUFBO0FBQUEsTUFNQSxHQUFBLElBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQU5sQixDQUFBO0FBQUEsTUFjQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUI7QUFBQSxRQUFBLFFBQUEsRUFBVSxPQUFWO09BQWpCLENBZEEsQ0FGRjtLQUFBLE1BQUE7QUFvQkUsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUI7QUFBQSxRQUFBLFFBQUEsRUFBVSxVQUFWO09BQWpCLENBQUEsQ0FwQkY7S0FBQTtXQXNCQSxJQUFDLENBQUEsV0FDRCxDQUFDLEdBREQsQ0FFRTtBQUFBLE1BQUEsSUFBQSxFQUFPLEVBQUEsR0FBWixJQUFZLEdBQVUsSUFBakI7QUFBQSxNQUNBLEdBQUEsRUFBTyxFQUFBLEdBQVosR0FBWSxHQUFTLElBRGhCO0FBQUEsTUFFQSxLQUFBLEVBQU8sRUFBQSxHQUFaLEtBQVksR0FBVyxJQUZsQjtLQUZGLENBS0EsQ0FBQyxJQUxELENBQUEsRUF2QlU7RUFBQSxDQTNKWixDQUFBOztBQUFBLDBCQTBMQSxTQUFBLEdBQVcsU0FBQyxJQUFELEVBQU8sUUFBUCxHQUFBO0FBQ1QsUUFBQSxLQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsQ0FBYyxXQUFBLElBQWUsY0FBN0IsQ0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FEUixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsYUFBRCxHQUFpQixLQUZqQixDQUFBO0FBSUEsSUFBQSxJQUFHLFFBQUEsS0FBWSxLQUFmO2FBQ0UsS0FBSyxDQUFDLEdBQU4sQ0FBVTtBQUFBLFFBQUEsU0FBQSxFQUFZLGVBQUEsR0FBM0IsV0FBMkIsR0FBNkIsS0FBekM7T0FBVixFQURGO0tBQUEsTUFBQTthQUdFLEtBQUssQ0FBQyxHQUFOLENBQVU7QUFBQSxRQUFBLFNBQUEsRUFBWSxnQkFBQSxHQUEzQixXQUEyQixHQUE4QixLQUExQztPQUFWLEVBSEY7S0FMUztFQUFBLENBMUxYLENBQUE7O0FBQUEsMEJBcU1BLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLElBQUEsSUFBRywwQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CO0FBQUEsUUFBQSxTQUFBLEVBQVcsRUFBWDtPQUFuQixDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixPQUZuQjtLQURhO0VBQUEsQ0FyTWYsQ0FBQTs7QUFBQSwwQkEyTUEsaUJBQUEsR0FBbUIsU0FBQyxVQUFELEdBQUE7QUFDakIsUUFBQSxhQUFBO0FBQUEsSUFBQSxJQUFHLFVBQVcsQ0FBQSxDQUFBLENBQVgsS0FBaUIsSUFBQyxDQUFBLHFCQUFzQixDQUFBLENBQUEsQ0FBM0M7O2FBQ3dCLENBQUMsWUFBYSxHQUFHLENBQUM7T0FBeEM7QUFBQSxNQUNBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixVQUR6QixDQUFBOzBGQUVzQixDQUFDLFNBQVUsR0FBRyxDQUFDLDZCQUh2QztLQURpQjtFQUFBLENBM01uQixDQUFBOztBQUFBLDBCQWtOQSx3QkFBQSxHQUEwQixTQUFBLEdBQUE7QUFDeEIsUUFBQSxLQUFBOztXQUFzQixDQUFDLFlBQWEsR0FBRyxDQUFDO0tBQXhDO1dBQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCLEdBRkQ7RUFBQSxDQWxOMUIsQ0FBQTs7QUFBQSwwQkF5TkEsa0JBQUEsR0FBb0IsU0FBQyxhQUFELEdBQUE7QUFDbEIsUUFBQSxJQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sTUFBUCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUN2QixZQUFBLHNCQUFBO0FBQUEsUUFBRSx3QkFBQSxPQUFGLEVBQVcsd0JBQUEsT0FBWCxDQUFBO0FBRUEsUUFBQSxJQUFHLGlCQUFBLElBQVksaUJBQWY7QUFDRSxVQUFBLElBQUEsR0FBTyxLQUFDLENBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZixDQUFnQyxPQUFoQyxFQUF5QyxPQUF6QyxDQUFQLENBREY7U0FGQTtBQUtBLFFBQUEsb0JBQUcsSUFBSSxDQUFFLGtCQUFOLEtBQWtCLFFBQXJCO2lCQUNFLE9BQTBCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixFQUF3QixhQUF4QixDQUExQixFQUFFLHFCQUFBLGFBQUYsRUFBaUIsWUFBQSxJQUFqQixFQUFBLEtBREY7U0FBQSxNQUFBO2lCQUdFLEtBQUMsQ0FBQSxTQUFELEdBQWEsT0FIZjtTQU51QjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCLENBREEsQ0FBQTtXQVlBO0FBQUEsTUFBRSxlQUFBLGFBQUY7QUFBQSxNQUFpQixNQUFBLElBQWpCO01BYmtCO0VBQUEsQ0F6TnBCLENBQUE7O0FBQUEsMEJBeU9BLGdCQUFBLEdBQWtCLFNBQUMsVUFBRCxFQUFhLGFBQWIsR0FBQTtBQUNoQixRQUFBLDBCQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhLEdBQUEsR0FBTSxVQUFVLENBQUMscUJBQVgsQ0FBQSxDQUFuQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsR0FBb0IsVUFBVSxDQUFDLGFBRC9CLENBQUE7QUFBQSxJQUVBLFFBQUEsR0FBVyxVQUFVLENBQUMsZUFGdEIsQ0FBQTtBQUFBLElBR0EsS0FBQSxHQUFRLENBQUEsQ0FBRSxRQUFRLENBQUMsSUFBWCxDQUhSLENBQUE7QUFBQSxJQUtBLGFBQWEsQ0FBQyxPQUFkLElBQXlCLEdBQUcsQ0FBQyxJQUw3QixDQUFBO0FBQUEsSUFNQSxhQUFhLENBQUMsT0FBZCxJQUF5QixHQUFHLENBQUMsR0FON0IsQ0FBQTtBQUFBLElBT0EsYUFBYSxDQUFDLEtBQWQsR0FBc0IsYUFBYSxDQUFDLE9BQWQsR0FBd0IsS0FBSyxDQUFDLFVBQU4sQ0FBQSxDQVA5QyxDQUFBO0FBQUEsSUFRQSxhQUFhLENBQUMsS0FBZCxHQUFzQixhQUFhLENBQUMsT0FBZCxHQUF3QixLQUFLLENBQUMsU0FBTixDQUFBLENBUjlDLENBQUE7QUFBQSxJQVNBLElBQUEsR0FBTyxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsYUFBYSxDQUFDLE9BQXhDLEVBQWlELGFBQWEsQ0FBQyxPQUEvRCxDQVRQLENBQUE7V0FXQTtBQUFBLE1BQUUsZUFBQSxhQUFGO0FBQUEsTUFBaUIsTUFBQSxJQUFqQjtNQVpnQjtFQUFBLENBek9sQixDQUFBOztBQUFBLDBCQTBQQSx1QkFBQSxHQUF5QixTQUFDLFFBQUQsR0FBQTtBQUl2QixJQUFBLElBQUcsV0FBQSxDQUFZLG1CQUFaLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUFrQjtBQUFBLFFBQUEsZ0JBQUEsRUFBa0IsTUFBbEI7T0FBbEIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxRQUFBLENBQUEsQ0FEQSxDQUFBO2FBRUEsSUFBQyxDQUFBLFlBQVksQ0FBQyxHQUFkLENBQWtCO0FBQUEsUUFBQSxnQkFBQSxFQUFrQixNQUFsQjtPQUFsQixFQUhGO0tBQUEsTUFBQTtBQUtFLE1BQUEsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQSxDQURBLENBQUE7QUFBQSxNQUVBLFFBQUEsQ0FBQSxDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFBLENBSEEsQ0FBQTthQUlBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFBLEVBVEY7S0FKdUI7RUFBQSxDQTFQekIsQ0FBQTs7QUFBQSwwQkEyUUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsSUFBRyxtQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsTUFBZixDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQTFCLENBQStCLElBQUMsQ0FBQSxjQUFoQyxFQUZGO0tBQUEsTUFBQTtBQUFBO0tBREk7RUFBQSxDQTNRTixDQUFBOztBQUFBLDBCQW9SQSxZQUFBLEdBQWMsU0FBQyxNQUFELEdBQUE7QUFDWixRQUFBLDRDQUFBO0FBQUEsWUFBTyxNQUFNLENBQUMsTUFBZDtBQUFBLFdBQ08sV0FEUDtBQUVJLFFBQUEsYUFBQSxHQUFnQixNQUFNLENBQUMsYUFBdkIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxNQUFNLENBQUMsUUFBUCxLQUFtQixRQUF0QjtpQkFDRSxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQXBCLENBQTJCLElBQUMsQ0FBQSxjQUE1QixFQURGO1NBQUEsTUFBQTtpQkFHRSxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQXBCLENBQTBCLElBQUMsQ0FBQSxjQUEzQixFQUhGO1NBSEo7QUFDTztBQURQLFdBT08sV0FQUDtBQVFJLFFBQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsYUFBYSxDQUFDLEtBQXRDLENBQUE7ZUFDQSxjQUFjLENBQUMsTUFBZixDQUFzQixNQUFNLENBQUMsYUFBN0IsRUFBNEMsSUFBQyxDQUFBLGNBQTdDLEVBVEo7QUFBQSxXQVVPLE1BVlA7QUFXSSxRQUFBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLGFBQXZCLENBQUE7ZUFDQSxhQUFhLENBQUMsT0FBZCxDQUFzQixJQUFDLENBQUEsY0FBdkIsRUFaSjtBQUFBLEtBRFk7RUFBQSxDQXBSZCxDQUFBOztBQUFBLDBCQXVTQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsSUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFKO0FBR0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLHdCQUFELENBQUEsQ0FEQSxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFaLENBQWdCLFFBQWhCLEVBQTBCLEVBQTFCLENBRkEsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUF6QixDQUFBLENBSEEsQ0FBQTtBQUlBLE1BQUEsSUFBbUMsa0JBQW5DO0FBQUEsUUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsR0FBRyxDQUFDLE9BQXZCLENBQUEsQ0FBQTtPQUpBO0FBQUEsTUFLQSxHQUFHLENBQUMsc0JBQUosQ0FBQSxDQUxBLENBQUE7QUFBQSxNQVFBLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBZCxDQUFBLENBUkEsQ0FBQTthQVNBLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixDQUFBLEVBWkY7S0FESztFQUFBLENBdlNQLENBQUE7O0FBQUEsMEJBdVRBLGlCQUFBLEdBQW1CLFNBQUEsR0FBQTtBQUNqQixRQUFBLDRDQUFBO0FBQUEsSUFBQSxvQkFBQSxHQUF1QixDQUF2QixDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQ0osZUFBQSxHQUFDLEdBQUcsQ0FBQyxrQkFBTCxHQUF1Qyx1QkFBdkMsR0FDQyxHQUFHLENBQUMseUJBREwsR0FDMkMsV0FEM0MsR0FDQyxvQkFERCxHQUVpQixzQ0FKYixDQUFBO1dBVUEsWUFBQSxHQUFlLENBQUEsQ0FBRSxRQUFGLENBQ2IsQ0FBQyxHQURZLENBQ1I7QUFBQSxNQUFBLFFBQUEsRUFBVSxVQUFWO0tBRFEsRUFYRTtFQUFBLENBdlRuQixDQUFBOzt1QkFBQTs7SUFQRixDQUFBOzs7OztBQ0FBLElBQUEsY0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FEVCxDQUFBOztBQUFBLEdBRUEsR0FBTSxNQUFNLENBQUMsR0FGYixDQUFBOztBQUFBLE1BUU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO0FBQ2xCLE1BQUEsNEJBQUE7QUFBQSxFQUFBLGNBQUEsR0FBcUIsSUFBQSxNQUFBLENBQVEsU0FBQSxHQUE5QixHQUFHLENBQUMsU0FBMEIsR0FBeUIsU0FBakMsQ0FBckIsQ0FBQTtBQUFBLEVBQ0EsWUFBQSxHQUFtQixJQUFBLE1BQUEsQ0FBUSxTQUFBLEdBQTVCLEdBQUcsQ0FBQyxPQUF3QixHQUF1QixTQUEvQixDQURuQixDQUFBO1NBS0E7QUFBQSxJQUFBLGlCQUFBLEVBQW1CLFNBQUMsSUFBRCxHQUFBO0FBQ2pCLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUVBLGFBQU0sSUFBQSxJQUFRLElBQUksQ0FBQyxRQUFMLEtBQWlCLENBQS9CLEdBQUE7QUFDRSxRQUFBLElBQUcsY0FBYyxDQUFDLElBQWYsQ0FBb0IsSUFBSSxDQUFDLFNBQXpCLENBQUg7QUFDRSxVQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsQ0FBUCxDQUFBO0FBQ0EsaUJBQU8sSUFBUCxDQUZGO1NBQUE7QUFBQSxRQUlBLElBQUEsR0FBTyxJQUFJLENBQUMsVUFKWixDQURGO01BQUEsQ0FGQTtBQVNBLGFBQU8sTUFBUCxDQVZpQjtJQUFBLENBQW5CO0FBQUEsSUFhQSxlQUFBLEVBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsVUFBQSxXQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsQ0FBUCxDQUFBO0FBRUEsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUNFLFFBQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQWQsQ0FBQTtBQUNBLFFBQUEsSUFBc0IsV0FBdEI7QUFBQSxpQkFBTyxXQUFQLENBQUE7U0FEQTtBQUFBLFFBR0EsSUFBQSxHQUFPLElBQUksQ0FBQyxVQUhaLENBREY7TUFBQSxDQUZBO0FBUUEsYUFBTyxNQUFQLENBVGU7SUFBQSxDQWJqQjtBQUFBLElBeUJBLGNBQUEsRUFBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxVQUFBLHVDQUFBO0FBQUE7QUFBQSxXQUFBLHFCQUFBO2tDQUFBO0FBQ0UsUUFBQSxJQUFZLENBQUEsR0FBTyxDQUFDLGdCQUFwQjtBQUFBLG1CQUFBO1NBQUE7QUFBQSxRQUVBLGFBQUEsR0FBZ0IsR0FBRyxDQUFDLFlBRnBCLENBQUE7QUFHQSxRQUFBLElBQUcsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsYUFBbEIsQ0FBSDtBQUNFLGlCQUFPO0FBQUEsWUFDTCxXQUFBLEVBQWEsYUFEUjtBQUFBLFlBRUwsUUFBQSxFQUFVLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBRkw7V0FBUCxDQURGO1NBSkY7QUFBQSxPQUFBO0FBVUEsYUFBTyxNQUFQLENBWGM7SUFBQSxDQXpCaEI7QUFBQSxJQXdDQSxhQUFBLEVBQWUsU0FBQyxJQUFELEdBQUE7QUFDYixVQUFBLGtDQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsQ0FBUCxDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFlBRDVDLENBQUE7QUFHQSxhQUFNLElBQUEsSUFBUSxJQUFJLENBQUMsUUFBTCxLQUFpQixDQUEvQixHQUFBO0FBQ0UsUUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBQUg7QUFDRSxVQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsYUFBbEIsQ0FBaEIsQ0FBQTtBQUNBLFVBQUEsSUFBRyxDQUFBLFlBQWdCLENBQUMsSUFBYixDQUFrQixJQUFJLENBQUMsU0FBdkIsQ0FBUDtBQUNFLFlBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQUFQLENBREY7V0FEQTtBQUlBLGlCQUFPO0FBQUEsWUFDTCxJQUFBLEVBQU0sSUFERDtBQUFBLFlBRUwsYUFBQSxFQUFlLGFBRlY7QUFBQSxZQUdMLGFBQUEsRUFBZSxJQUhWO1dBQVAsQ0FMRjtTQUFBO0FBQUEsUUFXQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBWFosQ0FERjtNQUFBLENBSEE7YUFpQkEsR0FsQmE7SUFBQSxDQXhDZjtBQUFBLElBNkRBLFlBQUEsRUFBYyxTQUFDLElBQUQsR0FBQTtBQUNaLFVBQUEsb0JBQUE7QUFBQSxNQUFBLFNBQUEsR0FBWSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUFwQyxDQUFBO0FBQ0EsTUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQWxCLENBQUg7QUFDRSxRQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFsQixDQUFaLENBQUE7QUFDQSxlQUFPLFNBQVAsQ0FGRjtPQUZZO0lBQUEsQ0E3RGQ7QUFBQSxJQW9FQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixVQUFBLHlCQUFBO0FBQUEsTUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBbEMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixRQUFsQixDQUFIO0FBQ0UsUUFBQSxlQUFBLEdBQWtCLElBQUksQ0FBQyxZQUFMLENBQWtCLFFBQWxCLENBQWxCLENBQUE7QUFDQSxlQUFPLGVBQVAsQ0FGRjtPQUZrQjtJQUFBLENBcEVwQjtBQUFBLElBMkVBLGVBQUEsRUFBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixVQUFBLHVCQUFBO0FBQUEsTUFBQSxZQUFBLEdBQWUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBMUMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQixDQUFIO0FBQ0UsUUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFlBQUwsQ0FBa0IsWUFBbEIsQ0FBWixDQUFBO0FBQ0EsZUFBTyxZQUFQLENBRkY7T0FGZTtJQUFBLENBM0VqQjtBQUFBLElBa0ZBLFVBQUEsRUFBWSxTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDVixVQUFBLDhDQUFBO0FBQUEsTUFEbUIsV0FBQSxLQUFLLFlBQUEsSUFDeEIsQ0FBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUQ1QyxDQUFBO0FBR0EsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUVFLFFBQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQUFIO0FBQ0UsVUFBQSxvQkFBQSxHQUF1QixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBckIsRUFBMkI7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQTNCLENBQXZCLENBQUE7QUFDQSxVQUFBLElBQUcsNEJBQUg7QUFDRSxtQkFBTyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsb0JBQTNCLENBQVAsQ0FERjtXQUFBLE1BQUE7QUFHRSxtQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsQ0FBUCxDQUhGO1dBRkY7U0FBQSxNQVFLLElBQUcsY0FBYyxDQUFDLElBQWYsQ0FBb0IsSUFBSSxDQUFDLFNBQXpCLENBQUg7QUFDSCxpQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQTFCLENBQVAsQ0FERztTQUFBLE1BSUEsSUFBRyxZQUFZLENBQUMsSUFBYixDQUFrQixJQUFJLENBQUMsU0FBdkIsQ0FBSDtBQUNILFVBQUEsb0JBQUEsR0FBdUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQXJCLEVBQTJCO0FBQUEsWUFBRSxLQUFBLEdBQUY7QUFBQSxZQUFPLE1BQUEsSUFBUDtXQUEzQixDQUF2QixDQUFBO0FBQ0EsVUFBQSxJQUFHLDRCQUFIO0FBQ0UsbUJBQU8sSUFBQyxDQUFBLHlCQUFELENBQTJCLG9CQUEzQixDQUFQLENBREY7V0FBQSxNQUFBO0FBR0UsbUJBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmLENBQVAsQ0FIRjtXQUZHO1NBWkw7QUFBQSxRQW1CQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBbkJaLENBRkY7TUFBQSxDQUpVO0lBQUEsQ0FsRlo7QUFBQSxJQThHQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDbEIsVUFBQSxtQkFBQTtBQUFBLE1BRDJCLFdBQUEsS0FBSyxZQUFBLE1BQU0sZ0JBQUEsUUFDdEMsQ0FBQTthQUFBO0FBQUEsUUFBQSxNQUFBLEVBQVEsV0FBUjtBQUFBLFFBQ0EsYUFBQSxFQUFlLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixDQURmO0FBQUEsUUFFQSxRQUFBLEVBQVUsUUFBQSxJQUFZLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixJQUF4QixFQUE4QjtBQUFBLFVBQUUsS0FBQSxHQUFGO0FBQUEsVUFBTyxNQUFBLElBQVA7U0FBOUIsQ0FGdEI7UUFEa0I7SUFBQSxDQTlHcEI7QUFBQSxJQW9IQSx5QkFBQSxFQUEyQixTQUFDLG9CQUFELEdBQUE7QUFDekIsVUFBQSxjQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sb0JBQW9CLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBbEMsQ0FBQTtBQUFBLE1BQ0EsUUFBQSxHQUFXLG9CQUFvQixDQUFDLFFBRGhDLENBQUE7YUFFQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFBQSxRQUFFLFVBQUEsUUFBRjtPQUExQixFQUh5QjtJQUFBLENBcEgzQjtBQUFBLElBMEhBLGtCQUFBLEVBQW9CLFNBQUMsSUFBRCxHQUFBO0FBQ2xCLFVBQUEsNEJBQUE7QUFBQSxNQUFBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFBNUMsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQURoQixDQUFBO2FBR0E7QUFBQSxRQUFBLE1BQUEsRUFBUSxXQUFSO0FBQUEsUUFDQSxJQUFBLEVBQU0sSUFETjtBQUFBLFFBRUEsYUFBQSxFQUFlLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQUZmO0FBQUEsUUFHQSxhQUFBLEVBQWUsYUFIZjtRQUprQjtJQUFBLENBMUhwQjtBQUFBLElBb0lBLGFBQUEsRUFBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFVBQUEsYUFBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsSUFBUixDQUFhLGVBQWIsQ0FBaEIsQ0FBQTthQUVBO0FBQUEsUUFBQSxNQUFBLEVBQVEsTUFBUjtBQUFBLFFBQ0EsSUFBQSxFQUFNLElBRE47QUFBQSxRQUVBLGFBQUEsRUFBZSxhQUZmO1FBSGE7SUFBQSxDQXBJZjtBQUFBLElBOElBLHNCQUFBLEVBQXdCLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUN0QixVQUFBLGlEQUFBO0FBQUEsTUFEK0IsV0FBQSxLQUFLLFlBQUEsSUFDcEMsQ0FBQTtBQUFBLE1BQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLE1BQ0EsT0FBQSxHQUFVLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FBYyxDQUFDLEdBRHpCLENBQUE7QUFBQSxNQUVBLFVBQUEsR0FBYSxLQUFLLENBQUMsV0FBTixDQUFBLENBRmIsQ0FBQTtBQUFBLE1BR0EsVUFBQSxHQUFhLE9BQUEsR0FBVSxVQUh2QixDQUFBO0FBS0EsTUFBQSxJQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixFQUFlLE9BQWYsQ0FBQSxHQUEwQixJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxVQUFmLENBQTdCO2VBQ0UsU0FERjtPQUFBLE1BQUE7ZUFHRSxRQUhGO09BTnNCO0lBQUEsQ0E5SXhCO0FBQUEsSUEySkEsbUJBQUEsRUFBcUIsU0FBQyxTQUFELEVBQVksSUFBWixHQUFBO0FBQ25CLFVBQUEsaURBQUE7QUFBQSxNQURpQyxXQUFBLEtBQUssWUFBQSxJQUN0QyxDQUFBO0FBQUEsTUFBQSxXQUFBLEdBQWMsQ0FBQSxDQUFFLFNBQUYsQ0FBWSxDQUFDLElBQWIsQ0FBbUIsR0FBQSxHQUFwQyxHQUFHLENBQUMsU0FBYSxDQUFkLENBQUE7QUFBQSxNQUNBLE9BQUEsR0FBVSxNQURWLENBQUE7QUFBQSxNQUVBLGdCQUFBLEdBQW1CLE1BRm5CLENBQUE7QUFBQSxNQUlBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsRUFBUSxJQUFSLEdBQUE7QUFDZixjQUFBLHNDQUFBO0FBQUEsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsVUFDQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUFjLENBQUMsR0FEekIsQ0FBQTtBQUFBLFVBRUEsVUFBQSxHQUFhLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FGYixDQUFBO0FBQUEsVUFHQSxVQUFBLEdBQWEsT0FBQSxHQUFVLFVBSHZCLENBQUE7QUFLQSxVQUFBLElBQU8saUJBQUosSUFBZ0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFBLEdBQTBCLE9BQTdDO0FBQ0UsWUFBQSxPQUFBLEdBQVUsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFWLENBQUE7QUFBQSxZQUNBLGdCQUFBLEdBQW1CO0FBQUEsY0FBRSxPQUFBLEtBQUY7QUFBQSxjQUFTLFFBQUEsRUFBVSxRQUFuQjthQURuQixDQURGO1dBTEE7QUFRQSxVQUFBLElBQU8saUJBQUosSUFBZ0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsVUFBZixDQUFBLEdBQTZCLE9BQWhEO0FBQ0UsWUFBQSxPQUFBLEdBQVUsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsVUFBZixDQUFWLENBQUE7bUJBQ0EsZ0JBQUEsR0FBbUI7QUFBQSxjQUFFLE9BQUEsS0FBRjtBQUFBLGNBQVMsUUFBQSxFQUFVLE9BQW5CO2NBRnJCO1dBVGU7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQixDQUpBLENBQUE7YUFpQkEsaUJBbEJtQjtJQUFBLENBM0pyQjtBQUFBLElBZ0xBLFFBQUEsRUFBVSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDUixNQUFBLElBQUcsQ0FBQSxHQUFJLENBQVA7ZUFBYyxDQUFBLEdBQUksRUFBbEI7T0FBQSxNQUFBO2VBQXlCLENBQUEsR0FBSSxFQUE3QjtPQURRO0lBQUEsQ0FoTFY7QUFBQSxJQXNMQSx1QkFBQSxFQUF5QixTQUFDLElBQUQsR0FBQTtBQUN2QixVQUFBLCtEQUFBO0FBQUEsTUFBQSxJQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBZCxHQUErQixDQUFsQztBQUNFO0FBQUE7YUFBQSxZQUFBOzRCQUFBO0FBQ0UsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQ0EsVUFBQSxJQUFZLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBRyxDQUFDLGtCQUFuQixDQUFaO0FBQUEscUJBQUE7V0FEQTtBQUFBLFVBRUEsT0FBQSxHQUFVLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FGVixDQUFBO0FBQUEsVUFHQSxZQUFBLEdBQWUsT0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUhmLENBQUE7QUFBQSxVQUlBLEtBQUEsR0FBUSxLQUFLLENBQUMsV0FBTixDQUFrQixJQUFsQixDQUFBLEdBQTBCLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FKbEMsQ0FBQTtBQUFBLFVBS0EsS0FBSyxDQUFDLE1BQU4sQ0FBYSxZQUFBLEdBQWUsS0FBNUIsQ0FMQSxDQUFBO0FBQUEsd0JBTUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxHQUFHLENBQUMsa0JBQW5CLEVBTkEsQ0FERjtBQUFBO3dCQURGO09BRHVCO0lBQUEsQ0F0THpCO0FBQUEsSUFvTUEsc0JBQUEsRUFBd0IsU0FBQSxHQUFBO2FBQ3RCLENBQUEsQ0FBRyxHQUFBLEdBQU4sR0FBRyxDQUFDLGtCQUFELENBQ0UsQ0FBQyxHQURILENBQ08sUUFEUCxFQUNpQixFQURqQixDQUVFLENBQUMsV0FGSCxDQUVlLEdBQUcsQ0FBQyxrQkFGbkIsRUFEc0I7SUFBQSxDQXBNeEI7QUFBQSxJQTBNQSxjQUFBLEVBQWdCLFNBQUMsSUFBRCxHQUFBO0FBQ2QsTUFBQSxtQkFBRyxJQUFJLENBQUUsZUFBVDtlQUNFLElBQUssQ0FBQSxDQUFBLEVBRFA7T0FBQSxNQUVLLG9CQUFHLElBQUksQ0FBRSxrQkFBTixLQUFrQixDQUFyQjtlQUNILElBQUksQ0FBQyxXQURGO09BQUEsTUFBQTtlQUdILEtBSEc7T0FIUztJQUFBLENBMU1oQjtBQUFBLElBcU5BLGdCQUFBLEVBQWtCLFNBQUMsSUFBRCxHQUFBO2FBQ2hCLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxJQUFSLENBQWEsZUFBYixFQURnQjtJQUFBLENBck5sQjtBQUFBLElBMk5BLDZCQUFBLEVBQStCLFNBQUMsSUFBRCxHQUFBO0FBQzdCLFVBQUEsbUNBQUE7QUFBQSxNQUFBLEdBQUEsR0FBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQXpCLENBQUE7QUFBQSxNQUNBLE9BQXVCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixHQUFuQixDQUF2QixFQUFFLGVBQUEsT0FBRixFQUFXLGVBQUEsT0FEWCxDQUFBO0FBQUEsTUFJQSxNQUFBLEdBQVMsSUFBSSxDQUFDLHFCQUFMLENBQUEsQ0FKVCxDQUFBO0FBQUEsTUFLQSxNQUFBLEdBQ0U7QUFBQSxRQUFBLEdBQUEsRUFBSyxNQUFNLENBQUMsR0FBUCxHQUFhLE9BQWxCO0FBQUEsUUFDQSxNQUFBLEVBQVEsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsT0FEeEI7QUFBQSxRQUVBLElBQUEsRUFBTSxNQUFNLENBQUMsSUFBUCxHQUFjLE9BRnBCO0FBQUEsUUFHQSxLQUFBLEVBQU8sTUFBTSxDQUFDLEtBQVAsR0FBZSxPQUh0QjtPQU5GLENBQUE7QUFBQSxNQVdBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE1BQU0sQ0FBQyxHQVh2QyxDQUFBO0FBQUEsTUFZQSxNQUFNLENBQUMsS0FBUCxHQUFlLE1BQU0sQ0FBQyxLQUFQLEdBQWUsTUFBTSxDQUFDLElBWnJDLENBQUE7YUFjQSxPQWY2QjtJQUFBLENBM04vQjtBQUFBLElBNk9BLGlCQUFBLEVBQW1CLFNBQUMsR0FBRCxHQUFBO2FBRWpCO0FBQUEsUUFBQSxPQUFBLEVBQWEsR0FBRyxDQUFDLFdBQUosS0FBbUIsTUFBdkIsR0FBdUMsR0FBRyxDQUFDLFdBQTNDLEdBQTRELENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFiLElBQWdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQWxELElBQWdFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBOUUsQ0FBbUYsQ0FBQyxVQUF6SjtBQUFBLFFBQ0EsT0FBQSxFQUFhLEdBQUcsQ0FBQyxXQUFKLEtBQW1CLE1BQXZCLEdBQXVDLEdBQUcsQ0FBQyxXQUEzQyxHQUE0RCxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBYixJQUFnQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFsRCxJQUFnRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQTlFLENBQW1GLENBQUMsU0FEeko7UUFGaUI7SUFBQSxDQTdPbkI7SUFOa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQVJqQixDQUFBOzs7OztBQ0FBLElBQUEscUJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUFULENBQUE7O0FBQUEsR0FDQSxHQUFNLE1BQU0sQ0FBQyxHQURiLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLGtCQUFFLElBQUYsRUFBUSxPQUFSLEdBQUE7QUFDWCxRQUFBLGFBQUE7QUFBQSxJQURZLElBQUMsQ0FBQSxPQUFBLElBQ2IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLFFBQUQsRUFBVyxXQUFYLEVBQXdCLE1BQXhCLENBQVQsQ0FBQTtBQUFBLElBRUEsYUFBQSxHQUNFO0FBQUEsTUFBQSxjQUFBLEVBQWdCLEtBQWhCO0FBQUEsTUFDQSxXQUFBLEVBQWEsTUFEYjtBQUFBLE1BRUEsVUFBQSxFQUFZLEVBRlo7QUFBQSxNQUdBLFNBQUEsRUFDRTtBQUFBLFFBQUEsYUFBQSxFQUFlLElBQWY7QUFBQSxRQUNBLEtBQUEsRUFBTyxHQURQO0FBQUEsUUFFQSxTQUFBLEVBQVcsQ0FGWDtPQUpGO0FBQUEsTUFPQSxJQUFBLEVBQ0U7QUFBQSxRQUFBLFFBQUEsRUFBVSxDQUFWO09BUkY7S0FIRixDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFBZSxhQUFmLEVBQThCLE9BQTlCLENBYmpCLENBQUE7QUFBQSxJQWVBLElBQUMsQ0FBQSxVQUFELEdBQWMsTUFmZCxDQUFBO0FBQUEsSUFnQkEsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQWhCZixDQUFBO0FBQUEsSUFpQkEsSUFBQyxDQUFBLFdBQUQsR0FBZSxLQWpCZixDQUFBO0FBQUEsSUFrQkEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQWxCWCxDQURXO0VBQUEsQ0FBYjs7QUFBQSxxQkFzQkEsVUFBQSxHQUFZLFNBQUMsT0FBRCxHQUFBO0FBQ1YsSUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUIsSUFBQyxDQUFBLGFBQXBCLEVBQW1DLE9BQW5DLENBQVgsQ0FBQTtXQUNBLElBQUMsQ0FBQSxJQUFELEdBQVcsc0JBQUgsR0FDTixRQURNLEdBRUEseUJBQUgsR0FDSCxXQURHLEdBRUcsb0JBQUgsR0FDSCxNQURHLEdBR0gsWUFUUTtFQUFBLENBdEJaLENBQUE7O0FBQUEscUJBa0NBLGNBQUEsR0FBZ0IsU0FBQyxXQUFELEdBQUE7QUFDZCxJQUFBLElBQUMsQ0FBQSxXQUFELEdBQWUsV0FBZixDQUFBO1dBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLEdBQW9CLElBQUMsQ0FBQSxLQUZQO0VBQUEsQ0FsQ2hCLENBQUE7O0FBQUEscUJBMENBLElBQUEsR0FBTSxTQUFDLFdBQUQsRUFBYyxLQUFkLEVBQXFCLE9BQXJCLEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBRGYsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsQ0FIQSxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUpkLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQU5BLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQVBBLENBQUE7QUFTQSxJQUFBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxXQUFaO0FBQ0UsTUFBQSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsSUFBQyxDQUFBLFVBQXhCLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUEsR0FBQTtBQUNsQixVQUFBLEtBQUMsQ0FBQSx3QkFBRCxDQUFBLENBQUEsQ0FBQTtpQkFDQSxLQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsRUFGa0I7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLEVBR1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FIWixDQURYLENBREY7S0FBQSxNQU1LLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO0FBQ0gsTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURHO0tBZkw7QUFtQkEsSUFBQSxJQUEwQixJQUFDLENBQUEsT0FBTyxDQUFDLGNBQW5DO2FBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxFQUFBO0tBcEJJO0VBQUEsQ0ExQ04sQ0FBQTs7QUFBQSxxQkFpRUEsSUFBQSxHQUFNLFNBQUMsS0FBRCxHQUFBO0FBQ0osUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFoQixDQUFBO0FBQ0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsV0FBWjtBQUNFLE1BQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsSUFBQyxDQUFBLFVBQTFCLENBQUEsR0FBd0MsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBOUQ7ZUFDRSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBREY7T0FERjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLE1BQVo7QUFDSCxNQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBQXlCLElBQUMsQ0FBQSxVQUExQixDQUFBLEdBQXdDLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQXpEO2VBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLEVBREY7T0FERztLQUxEO0VBQUEsQ0FqRU4sQ0FBQTs7QUFBQSxxQkE0RUEsS0FBQSxHQUFPLFNBQUMsS0FBRCxHQUFBO0FBQ0wsUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFoQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBRFgsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUpBLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVosQ0FBcUIsR0FBRyxDQUFDLGdCQUF6QixDQUxBLENBQUE7V0FNQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBbUIsYUFBbkIsRUFQSztFQUFBLENBNUVQLENBQUE7O0FBQUEscUJBc0ZBLElBQUEsR0FBTSxTQUFDLEtBQUQsR0FBQTtBQUNKLElBQUEsSUFBNEIsSUFBQyxDQUFBLE9BQTdCO0FBQUEsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsS0FBbEIsQ0FBQSxDQUFBO0tBQUE7QUFDQSxJQUFBLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXRCLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixLQUFoQixFQUF1QixJQUFDLENBQUEsV0FBeEIsQ0FBQSxDQURGO0tBREE7V0FHQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBSkk7RUFBQSxDQXRGTixDQUFBOztBQUFBLHFCQTZGQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQURNO0VBQUEsQ0E3RlIsQ0FBQTs7QUFBQSxxQkFpR0EsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLElBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUNFLE1BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFYLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVosQ0FBd0IsR0FBRyxDQUFDLGdCQUE1QixDQURBLENBREY7S0FBQTtBQUlBLElBQUEsSUFBRyxJQUFDLENBQUEsV0FBSjtBQUNFLE1BQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxLQUFmLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsTUFEZCxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBQSxDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFIZixDQUFBO0FBSUEsTUFBQSxJQUFHLG9CQUFIO0FBQ0UsUUFBQSxZQUFBLENBQWEsSUFBQyxDQUFBLE9BQWQsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLE1BRFgsQ0FERjtPQUpBO0FBQUEsTUFRQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFoQixDQUFvQixrQkFBcEIsQ0FSQSxDQUFBO0FBQUEsTUFTQSxJQUFDLENBQUEsd0JBQUQsQ0FBQSxDQVRBLENBQUE7YUFVQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBWEY7S0FMSztFQUFBLENBakdQLENBQUE7O0FBQUEscUJBb0hBLFVBQUEsR0FBWSxTQUFBLEdBQUE7QUFDVixRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxDQUFBLENBQUcsY0FBQSxHQUFqQixHQUFHLENBQUMsV0FBYSxHQUFnQyxJQUFuQyxDQUNULENBQUMsSUFEUSxDQUNILE9BREcsRUFDTSwyREFETixDQUFYLENBQUE7V0FFQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLENBQW1CLFFBQW5CLEVBSFU7RUFBQSxDQXBIWixDQUFBOztBQUFBLHFCQTBIQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFrQixHQUFBLEdBQXJCLEdBQUcsQ0FBQyxXQUFELENBQXlDLENBQUMsTUFBMUMsQ0FBQSxFQURhO0VBQUEsQ0ExSGYsQ0FBQTs7QUFBQSxxQkE4SEEscUJBQUEsR0FBdUIsU0FBQyxJQUFELEdBQUE7QUFDckIsUUFBQSx3QkFBQTtBQUFBLElBRHdCLGFBQUEsT0FBTyxhQUFBLEtBQy9CLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxJQUFlLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFqQztBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxVQUFBLEdBQWEsQ0FBQSxDQUFHLGVBQUEsR0FBbkIsR0FBRyxDQUFDLGtCQUFlLEdBQXdDLHNCQUEzQyxDQURiLENBQUE7QUFBQSxJQUVBLFVBQVUsQ0FBQyxHQUFYLENBQWU7QUFBQSxNQUFBLElBQUEsRUFBTSxLQUFOO0FBQUEsTUFBYSxHQUFBLEVBQUssS0FBbEI7S0FBZixDQUZBLENBQUE7V0FHQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLENBQW1CLFVBQW5CLEVBSnFCO0VBQUEsQ0E5SHZCLENBQUE7O0FBQUEscUJBcUlBLHdCQUFBLEdBQTBCLFNBQUEsR0FBQTtXQUN4QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLENBQWtCLEdBQUEsR0FBckIsR0FBRyxDQUFDLGtCQUFELENBQWdELENBQUMsTUFBakQsQ0FBQSxFQUR3QjtFQUFBLENBckkxQixDQUFBOztBQUFBLHFCQTBJQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixRQUFBLFVBQUE7QUFBQSxJQUFBLFVBQUEsR0FDSyxLQUFLLENBQUMsSUFBTixLQUFjLFlBQWpCLEdBQ0UsaUZBREYsR0FFUSxLQUFLLENBQUMsSUFBTixLQUFjLFdBQWQsSUFBNkIsS0FBSyxDQUFDLElBQU4sS0FBYyxpQkFBOUMsR0FDSCw4Q0FERyxHQUdILHlCQU5KLENBQUE7V0FRQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFoQixDQUFtQixVQUFuQixFQUErQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxLQUFELEdBQUE7ZUFDN0IsS0FBQyxDQUFBLElBQUQsQ0FBTSxLQUFOLEVBRDZCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0IsRUFUZ0I7RUFBQSxDQTFJbEIsQ0FBQTs7QUFBQSxxQkF3SkEsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsSUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLEtBQWMsWUFBakI7YUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFoQixDQUFtQiwyQkFBbkIsRUFBZ0QsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsS0FBRCxHQUFBO0FBQzlDLFVBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUY4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBREY7S0FBQSxNQVFLLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxXQUFkLElBQTZCLEtBQUssQ0FBQyxJQUFOLEtBQWMsaUJBQTlDO2FBQ0gsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsMEJBQW5CLEVBQStDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUM3QyxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUQ2QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9DLEVBREc7S0FBQSxNQUFBO2FBUUgsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsMkJBQW5CLEVBQWdELENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUM5QyxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUQ4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBUkc7S0FUVztFQUFBLENBeEpsQixDQUFBOztBQUFBLHFCQWdMQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixJQUFBLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFkLElBQThCLEtBQUssQ0FBQyxJQUFOLEtBQWMsV0FBL0M7QUFDRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsYUFBYSxDQUFDLGNBQWUsQ0FBQSxDQUFBLENBQTNDLENBREY7S0FBQSxNQUlLLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxVQUFqQjtBQUNILE1BQUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxhQUFkLENBREc7S0FKTDtXQU9BO0FBQUEsTUFBQSxPQUFBLEVBQVMsS0FBSyxDQUFDLE9BQWY7QUFBQSxNQUNBLE9BQUEsRUFBUyxLQUFLLENBQUMsT0FEZjtBQUFBLE1BRUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUZiO0FBQUEsTUFHQSxLQUFBLEVBQU8sS0FBSyxDQUFDLEtBSGI7TUFSZ0I7RUFBQSxDQWhMbEIsQ0FBQTs7QUFBQSxxQkE4TEEsUUFBQSxHQUFVLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNSLFFBQUEsWUFBQTtBQUFBLElBQUEsSUFBb0IsQ0FBQSxNQUFBLElBQVcsQ0FBQSxNQUEvQjtBQUFBLGFBQU8sTUFBUCxDQUFBO0tBQUE7QUFBQSxJQUVBLEtBQUEsR0FBUSxNQUFNLENBQUMsS0FBUCxHQUFlLE1BQU0sQ0FBQyxLQUY5QixDQUFBO0FBQUEsSUFHQSxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsR0FBZSxNQUFNLENBQUMsS0FIOUIsQ0FBQTtXQUlBLElBQUksQ0FBQyxJQUFMLENBQVcsQ0FBQyxLQUFBLEdBQVEsS0FBVCxDQUFBLEdBQWtCLENBQUMsS0FBQSxHQUFRLEtBQVQsQ0FBN0IsRUFMUTtFQUFBLENBOUxWLENBQUE7O2tCQUFBOztJQVhGLENBQUE7Ozs7O0FDQUEsSUFBQSwrQkFBQTtFQUFBLGtCQUFBOztBQUFBLEdBQUEsR0FBTSxPQUFBLENBQVEsT0FBUixDQUFOLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQURULENBQUE7O0FBQUEsTUFNTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDRCQUFFLElBQUYsR0FBQTtBQUdYLElBSFksSUFBQyxDQUFBLE9BQUEsSUFHYixDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FDZDtBQUFBLE1BQUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBZDtBQUFBLE1BQ0EsaUJBQUEsRUFBbUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFEbkM7QUFBQSxNQUVBLHlCQUFBLEVBQTJCLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBRjNDO0tBRGMsQ0FBaEIsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFMM0MsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLENBQUMsU0FBRixDQUFBLENBTmIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLFFBQ0MsQ0FBQyxLQURILENBQ1MsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQURULENBRUUsQ0FBQyxJQUZILENBRVEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsSUFBZCxDQUZSLENBR0UsQ0FBQyxNQUhILENBR1UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsTUFBZCxDQUhWLENBSUUsQ0FBQyxLQUpILENBSVMsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQUpULENBS0UsQ0FBQyxLQUxILENBS1MsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQUxULENBTUUsQ0FBQyxTQU5ILENBTWEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsZ0JBQWQsQ0FOYixDQU9FLENBQUMsT0FQSCxDQU9XLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE9BQWQsQ0FQWCxDQVFFLENBQUMsTUFSSCxDQVFVLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE1BQWQsQ0FSVixDQVJBLENBSFc7RUFBQSxDQUFiOztBQUFBLCtCQXdCQSxHQUFBLEdBQUssU0FBQyxLQUFELEdBQUE7V0FDSCxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQVYsQ0FBYyxLQUFkLEVBREc7RUFBQSxDQXhCTCxDQUFBOztBQUFBLCtCQTRCQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQUEsRUFEVTtFQUFBLENBNUJaLENBQUE7O0FBQUEsK0JBZ0NBLFdBQUEsR0FBYSxTQUFBLEdBQUE7V0FDWCxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQUQsQ0FBVCxDQUFBLEVBRFc7RUFBQSxDQWhDYixDQUFBOztBQUFBLCtCQTBDQSxXQUFBLEdBQWEsU0FBQyxJQUFELEdBQUE7V0FDWCxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ0UsWUFBQSxpQ0FBQTtBQUFBLFFBREQsd0JBQVMsOERBQ1IsQ0FBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLEdBQUcsQ0FBQyxpQkFBSixDQUFzQixPQUF0QixDQUFQLENBQUE7QUFBQSxRQUNBLFlBQUEsR0FBZSxPQUFPLENBQUMsWUFBUixDQUFxQixLQUFDLENBQUEsWUFBdEIsQ0FEZixDQUFBO0FBQUEsUUFFQSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsRUFBbUIsWUFBbkIsQ0FGQSxDQUFBO2VBR0EsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFYLEVBQWlCLElBQWpCLEVBSkY7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxFQURXO0VBQUEsQ0ExQ2IsQ0FBQTs7QUFBQSwrQkFrREEsY0FBQSxHQUFnQixTQUFDLE9BQUQsR0FBQTtBQUNkLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixDQUFxQixPQUFyQixDQUFSLENBQUE7QUFDQSxJQUFBLElBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUF2QixDQUE0QixLQUE1QixDQUFBLElBQXNDLEtBQUEsS0FBUyxFQUFsRDthQUNFLE9BREY7S0FBQSxNQUFBO2FBR0UsTUFIRjtLQUZjO0VBQUEsQ0FsRGhCLENBQUE7O0FBQUEsK0JBMERBLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLE9BQXJCLEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsY0FBRCxDQUFnQixPQUFoQixDQUFSLENBQUE7V0FDQSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQVgsQ0FBZSxZQUFmLEVBQTZCLEtBQTdCLEVBRlc7RUFBQSxDQTFEYixDQUFBOztBQUFBLCtCQStEQSxLQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sWUFBUCxHQUFBO0FBQ0wsUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFJLENBQUMsYUFBTCxDQUFtQixZQUFuQixDQUFBLENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FGVixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFaLENBQTRCLE9BQTVCLEVBQXFDLElBQXJDLENBSEEsQ0FBQTtXQUlBLEtBTEs7RUFBQSxDQS9EUCxDQUFBOztBQUFBLCtCQXVFQSxJQUFBLEdBQU0sU0FBQyxJQUFELEVBQU8sWUFBUCxHQUFBO0FBQ0osUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFBLENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FGVixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsWUFBbkIsRUFBaUMsT0FBakMsQ0FIQSxDQUFBO0FBQUEsSUFLQSxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQixDQUxBLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQVosQ0FBNEIsT0FBNUIsRUFBcUMsSUFBckMsQ0FOQSxDQUFBO1dBUUEsS0FUSTtFQUFBLENBdkVOLENBQUE7O0FBQUEsK0JBc0ZBLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLFNBQXJCLEVBQWdDLE1BQWhDLEdBQUE7QUFDTixRQUFBLCtCQUFBO0FBQUEsSUFBQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBaEMsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBbkIsQ0FBQSxJQUE0QiwwQkFBL0I7QUFDRSxNQUFBLElBQUEsR0FBTyxnQkFBZ0IsQ0FBQyxXQUFqQixDQUFBLENBQVAsQ0FBQTtBQUFBLE1BRUEsT0FBQSxHQUFhLFNBQUEsS0FBYSxRQUFoQixHQUNSLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFYLENBQWtCLElBQWxCLENBQUEsRUFDQSxJQUFJLENBQUMsSUFBTCxDQUFBLENBREEsQ0FEUSxHQUlSLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFYLENBQWlCLElBQWpCLENBQUEsRUFDQSxJQUFJLENBQUMsSUFBTCxDQUFBLENBREEsQ0FORixDQUFBO0FBU0EsTUFBQSxJQUFtQixPQUFBLElBQVcsU0FBQSxLQUFhLE9BQTNDO0FBQUEsUUFBQSxPQUFPLENBQUMsS0FBUixDQUFBLENBQUEsQ0FBQTtPQVZGO0tBREE7V0FjQSxNQWZNO0VBQUEsQ0F0RlIsQ0FBQTs7QUFBQSwrQkE2R0EsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLFlBQVAsRUFBcUIsU0FBckIsRUFBZ0MsTUFBaEMsR0FBQTtBQUNMLFFBQUEsb0RBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFDRSxNQUFBLFVBQUEsR0FBZ0IsU0FBQSxLQUFhLFFBQWhCLEdBQThCLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBOUIsR0FBK0MsSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUE1RCxDQUFBO0FBRUEsTUFBQSxJQUFHLFVBQUEsSUFBYyxVQUFVLENBQUMsUUFBWCxLQUF1QixJQUFJLENBQUMsUUFBN0M7QUFDRSxRQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FBWCxDQUFBO0FBQUEsUUFDQSxjQUFBLEdBQWlCLFVBQVUsQ0FBQyxtQkFBWCxDQUErQixZQUEvQixDQURqQixDQUFBO0FBQUEsUUFJQSxjQUFBLEdBQWlCLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixDQUFxQixRQUFyQixDQUpqQixDQUFBO0FBQUEsUUFNQSxNQUFBLEdBQVksU0FBQSxLQUFhLFFBQWhCLEdBQ1AsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFWLENBQW1CLGNBQW5CLEVBQW1DLGNBQW5DLENBRE8sR0FHUCxJQUFDLENBQUEsUUFBUSxDQUFDLFNBQVYsQ0FBb0IsY0FBcEIsRUFBb0MsY0FBcEMsQ0FURixDQUFBO0FBQUEsUUFXQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQVgsQ0FBQSxDQVhBLENBQUE7QUFBQSxRQVlBLE1BQU0sQ0FBQyxtQkFBUCxDQUFBLENBWkEsQ0FBQTtBQUFBLFFBZ0JBLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUF5QixZQUF6QixFQUF1QyxjQUF2QyxDQWhCQSxDQURGO09BSEY7S0FBQTtXQXNCQSxNQXZCSztFQUFBLENBN0dQLENBQUE7O0FBQUEsK0JBeUlBLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLE1BQXJCLEVBQTZCLEtBQTdCLEVBQW9DLE1BQXBDLEdBQUE7QUFDTCxRQUFBLFVBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFHRSxNQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWQsQ0FBQSxDQUFQLENBQUE7QUFBQSxNQUNBLElBQUksQ0FBQyxHQUFMLENBQVMsWUFBVCxFQUF1QixJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixDQUF2QixDQURBLENBQUE7QUFBQSxNQUVBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBWCxDQUFpQixJQUFqQixDQUZBLENBQUE7O1lBR1csQ0FBRSxLQUFiLENBQUE7T0FIQTtBQUFBLE1BTUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFYLENBQWUsWUFBZixFQUE2QixJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUE3QixDQU5BLENBSEY7S0FBQTtXQVdBLE1BWks7RUFBQSxDQXpJUCxDQUFBOztBQUFBLCtCQTBKQSxnQkFBQSxHQUFrQixTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLFNBQXJCLEdBQUE7QUFDaEIsUUFBQSxPQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsSUFBSSxDQUFDLG1CQUFMLENBQXlCLFlBQXpCLENBQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFzQixPQUF0QixFQUErQixTQUEvQixFQUZnQjtFQUFBLENBMUpsQixDQUFBOztBQUFBLCtCQWdLQSxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sUUFBUCxFQUFpQixNQUFqQixHQUFBO0FBQ1AsSUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBbkI7QUFDRSxhQUFPLElBQVAsQ0FERjtLQUFBLE1BQUE7QUFHQyxhQUFPLEtBQVAsQ0FIRDtLQURPO0VBQUEsQ0FoS1QsQ0FBQTs7QUFBQSwrQkEwS0EsTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLFlBQVAsR0FBQTtBQUNOLElBQUEsSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFVLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsS0FBK0IsS0FBekM7QUFBQSxZQUFBLENBQUE7S0FEQTtXQUdBLElBQUMsQ0FBQSxhQUFELEdBQWlCLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQzFCLFlBQUEsSUFBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxtQkFBTCxDQUF5QixZQUF6QixDQUFQLENBQUE7QUFBQSxRQUNBLEtBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixFQUFtQixZQUFuQixFQUFpQyxJQUFqQyxDQURBLENBQUE7ZUFFQSxLQUFDLENBQUEsYUFBRCxHQUFpQixPQUhTO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxFQUlmLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FKRCxFQUpYO0VBQUEsQ0ExS1IsQ0FBQTs7QUFBQSwrQkFxTEEsa0JBQUEsR0FBb0IsU0FBQSxHQUFBO0FBQ2xCLElBQUEsSUFBRywwQkFBSDtBQUNFLE1BQUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxhQUFkLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE9BRm5CO0tBRGtCO0VBQUEsQ0FyTHBCLENBQUE7O0FBQUEsK0JBMkxBLGlCQUFBLEdBQW1CLFNBQUMsSUFBRCxHQUFBO1dBQ2pCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBaEIsS0FBMEIsQ0FBMUIsSUFBK0IsSUFBSSxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFuQixLQUEyQixXQUR6QztFQUFBLENBM0xuQixDQUFBOzs0QkFBQTs7SUFSRixDQUFBOzs7OztBQ0FBLElBQUEsVUFBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxlQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLE1BQWhCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE1BRGpCLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxjQUFELEdBQWtCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FIbEIsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUpqQixDQURXO0VBQUEsQ0FBYjs7QUFBQSxrQkFRQSxRQUFBLEdBQVUsU0FBQyxhQUFELEVBQWdCLFlBQWhCLEdBQUE7QUFDUixJQUFBLElBQUcsWUFBQSxLQUFnQixJQUFDLENBQUEsWUFBcEI7QUFDRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQixZQURoQixDQURGO0tBQUE7QUFJQSxJQUFBLElBQUcsYUFBQSxLQUFpQixJQUFDLENBQUEsYUFBckI7QUFDRSxNQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFBLENBQUEsQ0FBQTtBQUNBLE1BQUEsSUFBRyxhQUFIO0FBQ0UsUUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixhQUFqQixDQUFBO2VBQ0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixJQUFDLENBQUEsYUFBdEIsRUFGRjtPQUZGO0tBTFE7RUFBQSxDQVJWLENBQUE7O0FBQUEsa0JBcUJBLGVBQUEsR0FBaUIsU0FBQyxZQUFELEVBQWUsYUFBZixHQUFBO0FBQ2YsSUFBQSxJQUFHLElBQUMsQ0FBQSxZQUFELEtBQWlCLFlBQXBCO0FBQ0UsTUFBQSxrQkFBQSxnQkFBa0IsR0FBRyxDQUFDLGlCQUFKLENBQXNCLFlBQXRCLEVBQWxCLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsWUFBekIsRUFGRjtLQURlO0VBQUEsQ0FyQmpCLENBQUE7O0FBQUEsa0JBNEJBLGVBQUEsR0FBaUIsU0FBQyxZQUFELEdBQUE7QUFDZixJQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsS0FBaUIsWUFBcEI7YUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxhQUFYLEVBQTBCLE1BQTFCLEVBREY7S0FEZTtFQUFBLENBNUJqQixDQUFBOztBQUFBLGtCQWtDQSxnQkFBQSxHQUFrQixTQUFDLGFBQUQsR0FBQTtBQUNoQixJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsS0FBa0IsYUFBckI7YUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsTUFBekIsRUFERjtLQURnQjtFQUFBLENBbENsQixDQUFBOztBQUFBLGtCQXVDQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBQXFCLE1BQXJCLEVBREk7RUFBQSxDQXZDTixDQUFBOztBQUFBLGtCQStDQSxhQUFBLEdBQWUsU0FBQSxHQUFBO0FBQ2IsSUFBQSxJQUFHLElBQUMsQ0FBQSxZQUFKO2FBQ0UsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsT0FEbEI7S0FEYTtFQUFBLENBL0NmLENBQUE7O0FBQUEsa0JBcURBLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTtBQUNsQixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUo7QUFDRSxNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsYUFBWixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixNQURqQixDQUFBO2FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQW9CLFFBQXBCLEVBSEY7S0FEa0I7RUFBQSxDQXJEcEIsQ0FBQTs7ZUFBQTs7SUFQRixDQUFBOzs7OztBQ0FBLElBQUEsaUpBQUE7RUFBQTtpU0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDBCQUFSLENBQVQsQ0FBQTs7QUFBQSxrQkFDQSxHQUFxQixPQUFBLENBQVEsMkNBQVIsQ0FEckIsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLDRCQUFSLENBRlAsQ0FBQTs7QUFBQSxlQUdBLEdBQWtCLE9BQUEsQ0FBUSx3Q0FBUixDQUhsQixDQUFBOztBQUFBLFFBSUEsR0FBVyxPQUFBLENBQVEsc0JBQVIsQ0FKWCxDQUFBOztBQUFBLElBS0EsR0FBTyxPQUFBLENBQVEsa0JBQVIsQ0FMUCxDQUFBOztBQUFBLFlBTUEsR0FBZSxPQUFBLENBQVEsc0JBQVIsQ0FOZixDQUFBOztBQUFBLE1BT0EsR0FBUyxPQUFBLENBQVEsd0JBQVIsQ0FQVCxDQUFBOztBQUFBLEdBUUEsR0FBTSxPQUFBLENBQVEsbUJBQVIsQ0FSTixDQUFBOztBQUFBLFdBU0EsR0FBYyxPQUFBLENBQVEsdUJBQVIsQ0FUZCxDQUFBOztBQUFBLGFBVUEsR0FBZ0IsT0FBQSxDQUFRLGlDQUFSLENBVmhCLENBQUE7O0FBQUEsWUFXQSxHQUFlLE9BQUEsQ0FBUSwwQkFBUixDQVhmLENBQUE7O0FBQUEsTUFhTSxDQUFDLE9BQVAsR0FBdUI7QUFzQnJCLDhCQUFBLENBQUE7O0FBQUEsRUFBQSxTQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSw2Q0FBQTtBQUFBLElBRFUsWUFBQSxNQUFNLGtCQUFBLFlBQVkscUJBQUEsYUFDNUIsQ0FBQTtBQUFBLElBQUEsYUFBQSxHQUFtQixZQUFILEdBQ2QsQ0FBQSxVQUFBLHNDQUF3QixDQUFFLGFBQTFCLEVBQ0EsTUFBQSxDQUFPLGtCQUFQLEVBQW9CLG1EQUFwQixDQURBLEVBRUEsTUFBQSxHQUFTLFdBQVcsQ0FBQyxHQUFaLENBQWdCLFVBQWhCLENBRlQsRUFHSSxJQUFBLGFBQUEsQ0FBYztBQUFBLE1BQUEsT0FBQSxFQUFTLElBQVQ7QUFBQSxNQUFlLE1BQUEsRUFBUSxNQUF2QjtLQUFkLENBSEosQ0FEYyxHQUtSLGtCQUFILEdBQ0gsQ0FBQSxNQUFBLEdBQVMsV0FBVyxDQUFDLEdBQVosQ0FBZ0IsVUFBaEIsQ0FBVCxFQUNJLElBQUEsYUFBQSxDQUFjO0FBQUEsTUFBQSxNQUFBLEVBQVEsTUFBUjtLQUFkLENBREosQ0FERyxHQUlILGFBVEYsQ0FBQTtXQVdJLElBQUEsU0FBQSxDQUFVO0FBQUEsTUFBRSxlQUFBLGFBQUY7S0FBVixFQVpHO0VBQUEsQ0FBVCxDQUFBOztBQWVhLEVBQUEsbUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxhQUFBO0FBQUEsSUFEYyxnQkFBRixLQUFFLGFBQ2QsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxhQUFhLENBQUMsTUFBeEIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsTUFGakIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsTUFIaEIsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLGFBQWxCLENBSkEsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLGVBQUQsR0FBbUIsTUFObkIsQ0FBQTtBQUFBLElBT0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsRUFQbkIsQ0FEVztFQUFBLENBZmI7O0FBQUEsc0JBMkJBLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFFBQUEsdURBQUE7QUFBQSxJQURnQixRQUFGLEtBQUUsS0FDaEIsQ0FBQTtBQUFBLElBQUEsUUFBQSxHQUFXLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBeEIsQ0FBQTtBQUFBLElBQ0UsZ0JBQUEsT0FBRixFQUFXLGdCQUFBLE9BRFgsQ0FBQTtBQUFBLElBRUEsSUFBQSxHQUFPLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixPQUExQixFQUFtQyxPQUFuQyxDQUZQLENBQUE7QUFHQSxJQUFBLElBQUcsWUFBSDtBQUNFLE1BQUEsTUFBQSxHQUFTO0FBQUEsUUFBRSxJQUFBLEVBQU0sS0FBSyxDQUFDLEtBQWQ7QUFBQSxRQUFxQixHQUFBLEVBQUssS0FBSyxDQUFDLEtBQWhDO09BQVQsQ0FBQTthQUNBLE1BQUEsR0FBUyxHQUFHLENBQUMsVUFBSixDQUFlLElBQWYsRUFBcUIsTUFBckIsRUFGWDtLQUphO0VBQUEsQ0EzQmYsQ0FBQTs7QUFBQSxzQkFvQ0EsZ0JBQUEsR0FBa0IsU0FBQyxhQUFELEdBQUE7QUFDaEIsSUFBQSxNQUFBLENBQU8sYUFBYSxDQUFDLE1BQWQsS0FBd0IsSUFBQyxDQUFBLE1BQWhDLEVBQ0UseURBREYsQ0FBQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUMsQ0FBQSxhQUFELEdBQWlCLGFBSDFCLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxZQUFELEdBQW9CLElBQUEsWUFBQSxDQUFhO0FBQUEsTUFBRyxlQUFELElBQUMsQ0FBQSxhQUFIO0tBQWIsQ0FKcEIsQ0FBQTtXQUtBLElBQUMsQ0FBQSwwQkFBRCxDQUFBLEVBTmdCO0VBQUEsQ0FwQ2xCLENBQUE7O0FBQUEsc0JBNkNBLDBCQUFBLEdBQTRCLFNBQUEsR0FBQTtXQUMxQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUF2QixDQUEyQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ3pCLEtBQUMsQ0FBQSxJQUFELENBQU0sUUFBTixFQUFnQixTQUFoQixFQUR5QjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCLEVBRDBCO0VBQUEsQ0E3QzVCLENBQUE7O0FBQUEsc0JBa0RBLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxPQUFULEdBQUE7QUFDVixRQUFBLDhCQUFBOztNQURtQixVQUFRO0tBQzNCOztNQUFBLFNBQVUsTUFBTSxDQUFDLFFBQVEsQ0FBQztLQUExQjs7TUFDQSxPQUFPLENBQUMsV0FBWTtLQURwQjtBQUFBLElBR0EsT0FBQSxHQUFVLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxLQUFWLENBQUEsQ0FIVixDQUFBOztNQUtBLE9BQU8sQ0FBQyxXQUFZLElBQUMsQ0FBQSxXQUFELENBQWEsT0FBYjtLQUxwQjtBQUFBLElBTUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFiLENBTkEsQ0FBQTtBQUFBLElBUUEsSUFBQSxHQUFXLElBQUEsSUFBQSxDQUFLLElBQUwsRUFBVyxPQUFRLENBQUEsQ0FBQSxDQUFuQixDQVJYLENBQUE7QUFBQSxJQVNBLGVBQUEsR0FBa0IsSUFBSSxDQUFDLE1BQUwsQ0FBWSxPQUFaLENBVGxCLENBQUE7QUFXQSxJQUFBLElBQUcsSUFBSSxDQUFDLGFBQVI7QUFDRSxNQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixDQUFBLENBQUE7QUFBQSxNQUNBLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixDQUFBLFNBQUEsS0FBQSxHQUFBO2VBQUEsU0FBQyxJQUFELEdBQUE7QUFDbkIsY0FBQSxnQkFBQTtBQUFBLFVBRHNCLGNBQUEsUUFBUSxnQkFBQSxRQUM5QixDQUFBO2lCQUFBLEtBQUMsQ0FBQSxhQUFhLENBQUMsV0FBZixDQUEyQixJQUEzQixFQURtQjtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCLENBREEsQ0FERjtLQVhBO1dBZ0JBLGdCQWpCVTtFQUFBLENBbERaLENBQUE7O0FBQUEsc0JBc0VBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO1dBQ2YsSUFBQyxDQUFBLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBL0IsQ0FBcUMsSUFBQyxDQUFBLGFBQXRDLEVBQXFELFNBQXJELEVBRGU7RUFBQSxDQXRFakIsQ0FBQTs7QUFBQSxzQkFvRkEsUUFBQSxHQUFVLFNBQUMsTUFBRCxFQUFTLE9BQVQsR0FBQTtBQUNSLFFBQUEsYUFBQTs7TUFEaUIsVUFBUTtLQUN6QjtBQUFBLElBQUEsT0FBQSxHQUFVLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxLQUFWLENBQUEsQ0FBVixDQUFBOztNQUNBLE9BQU8sQ0FBQyxXQUFZLElBQUMsQ0FBQSxXQUFELENBQWEsT0FBYjtLQURwQjtBQUFBLElBRUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFiLENBRkEsQ0FBQTtBQUFBLElBSUEsSUFBQSxHQUFXLElBQUEsSUFBQSxDQUFLLElBQUwsRUFBVyxPQUFRLENBQUEsQ0FBQSxDQUFuQixDQUpYLENBQUE7V0FLQSxJQUFJLENBQUMsY0FBTCxDQUFvQjtBQUFBLE1BQUUsU0FBQSxPQUFGO0tBQXBCLEVBTlE7RUFBQSxDQXBGVixDQUFBOztBQUFBLHNCQXFHQSxXQUFBLEdBQWEsU0FBQyxPQUFELEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYyxHQUFBLEdBQXBCLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTCxDQUF3QyxDQUFDLE1BQXpDLEtBQW1ELENBQXREO0FBQ0UsTUFBQSxRQUFBLEdBQVcsQ0FBQSxDQUFFLE9BQU8sQ0FBQyxJQUFSLENBQUEsQ0FBRixDQUFYLENBREY7S0FBQTtXQUdBLFNBSlc7RUFBQSxDQXJHYixDQUFBOztBQUFBLHNCQTRHQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixJQUFBLE1BQUEsQ0FBVyw0QkFBWCxFQUNFLCtFQURGLENBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxlQUFELEdBQW1CLEtBSkQ7RUFBQSxDQTVHcEIsQ0FBQTs7QUFBQSxzQkFtSEEsZUFBQSxHQUFpQixTQUFDLEdBQUQsR0FBQTtXQUNmLElBQUMsQ0FBQSxZQUFZLENBQUMsS0FBZCxDQUFvQixHQUFwQixFQURlO0VBQUEsQ0FuSGpCLENBQUE7O0FBQUEsc0JBdUhBLGdCQUFBLEdBQWtCLFNBQUMsR0FBRCxHQUFBO1dBQ2hCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBZCxDQUFxQixHQUFyQixFQURnQjtFQUFBLENBdkhsQixDQUFBOztBQUFBLHNCQTJIQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFFBQUEsV0FBQTtxREFBYSxDQUFFLEtBQWYsQ0FBQSxXQUFBLGdEQUF1QyxDQUFFLE1BQWYsQ0FBQSxZQURYO0VBQUEsQ0EzSGpCLENBQUE7O0FBQUEsc0JBK0hBLE1BQUEsR0FBUSxTQUFDLElBQUQsR0FBQTtBQUNOLFFBQUEsaUJBQUE7QUFBQSxJQURTLG9DQUFGLE9BQXNCLElBQXBCLGlCQUNULENBQUE7V0FBSSxJQUFBLFFBQUEsQ0FDRjtBQUFBLE1BQUEsYUFBQSxFQUFlLElBQUMsQ0FBQSxhQUFoQjtBQUFBLE1BQ0Esa0JBQUEsRUFBd0IsSUFBQSxrQkFBQSxDQUFBLENBRHhCO0FBQUEsTUFFQSxpQkFBQSxFQUFtQixpQkFGbkI7S0FERSxDQUlILENBQUMsSUFKRSxDQUFBLEVBREU7RUFBQSxDQS9IUixDQUFBOztBQUFBLHNCQXVJQSxTQUFBLEdBQVcsU0FBQSxHQUFBO1dBQ1QsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFmLENBQUEsRUFEUztFQUFBLENBdklYLENBQUE7O0FBQUEsc0JBMklBLE1BQUEsR0FBUSxTQUFDLFFBQUQsR0FBQTtBQUNOLFFBQUEsMkJBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBRCxDQUFBLENBQVAsQ0FBQTtBQUNBLElBQUEsSUFBRyxnQkFBSDtBQUNFLE1BQUEsUUFBQSxHQUFXLElBQVgsQ0FBQTtBQUFBLE1BQ0EsV0FBQSxHQUFjLENBRGQsQ0FBQTthQUVBLElBQUksQ0FBQyxTQUFMLENBQWUsSUFBZixFQUFxQixRQUFyQixFQUErQixXQUEvQixFQUhGO0tBQUEsTUFBQTthQUtFLElBQUksQ0FBQyxTQUFMLENBQWUsSUFBZixFQUxGO0tBRk07RUFBQSxDQTNJUixDQUFBOztBQUFBLHNCQXlKQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLGFBQWEsQ0FBQyxLQUFmLENBQUEsRUFEVTtFQUFBLENBekpaLENBQUE7O0FBQUEsRUE2SkEsU0FBUyxDQUFDLEdBQVYsR0FBZ0IsR0E3SmhCLENBQUE7O21CQUFBOztHQXRCdUMsYUFiekMsQ0FBQTs7Ozs7QUNBQSxJQUFBLGtCQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBSWxCO0FBQUEsSUFBQSxRQUFBLEVBQVUsU0FBQyxTQUFELEVBQVksUUFBWixHQUFBO0FBQ1IsVUFBQSxnQkFBQTtBQUFBLE1BQUEsZ0JBQUEsR0FBbUIsU0FBQSxHQUFBO0FBQ2pCLFlBQUEsSUFBQTtBQUFBLFFBRGtCLDhEQUNsQixDQUFBO0FBQUEsUUFBQSxTQUFTLENBQUMsTUFBVixDQUFpQixnQkFBakIsQ0FBQSxDQUFBO2VBQ0EsUUFBUSxDQUFDLEtBQVQsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBRmlCO01BQUEsQ0FBbkIsQ0FBQTtBQUFBLE1BSUEsU0FBUyxDQUFDLEdBQVYsQ0FBYyxnQkFBZCxDQUpBLENBQUE7YUFLQSxpQkFOUTtJQUFBLENBQVY7SUFKa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7OztBQ0FBLElBQUEsQ0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBRWxCO0FBQUEsSUFBQSxpQkFBQSxFQUFtQixTQUFBLEdBQUE7QUFDakIsVUFBQSxPQUFBO0FBQUEsTUFBQSxPQUFBLEdBQVUsQ0FBQSxDQUFFLEtBQUYsQ0FBUyxDQUFBLENBQUEsQ0FBbkIsQ0FBQTtBQUFBLE1BQ0EsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFkLEdBQXdCLHFCQUR4QixDQUFBO0FBRUEsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWQsS0FBK0IsTUFBdEMsQ0FIaUI7SUFBQSxDQUFuQjtJQUZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBRmpCLENBQUE7Ozs7O0FDQUEsSUFBQSxzQkFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLG1CQUFSLENBQVYsQ0FBQTs7QUFBQSxhQUVBLEdBQWdCLEVBRmhCLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixNQUFBLE1BQUE7QUFBQSxFQUFBLElBQUcsQ0FBQyxNQUFBLEdBQVMsYUFBYyxDQUFBLElBQUEsQ0FBeEIsQ0FBQSxLQUFrQyxNQUFyQztXQUNFLGFBQWMsQ0FBQSxJQUFBLENBQWQsR0FBc0IsT0FBQSxDQUFRLE9BQVEsQ0FBQSxJQUFBLENBQVIsQ0FBQSxDQUFSLEVBRHhCO0dBQUEsTUFBQTtXQUdFLE9BSEY7R0FEZTtBQUFBLENBSmpCLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFFbEIsTUFBQSxpQkFBQTtBQUFBLEVBQUEsU0FBQSxHQUFZLE1BQUEsR0FBUyxNQUFyQixDQUFBO1NBUUE7QUFBQSxJQUFBLElBQUEsRUFBTSxTQUFDLElBQUQsR0FBQTtBQUdKLFVBQUEsTUFBQTs7UUFISyxPQUFPO09BR1o7QUFBQSxNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsR0FBTCxDQUFBLENBQVUsQ0FBQyxRQUFYLENBQW9CLEVBQXBCLENBQVQsQ0FBQTtBQUdBLE1BQUEsSUFBRyxNQUFBLEtBQVUsTUFBYjtBQUNFLFFBQUEsU0FBQSxJQUFhLENBQWIsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLFNBQUEsR0FBWSxDQUFaLENBQUE7QUFBQSxRQUNBLE1BQUEsR0FBUyxNQURULENBSEY7T0FIQTthQVNBLEVBQUEsR0FBSCxJQUFHLEdBQVUsR0FBVixHQUFILE1BQUcsR0FBSCxVQVpPO0lBQUEsQ0FBTjtJQVZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBQWpCLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBakIsQ0FBQTs7Ozs7OztBQ0FBLElBQUEsV0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BU00sQ0FBQyxPQUFQLEdBQWlCLE1BQUEsR0FBUyxTQUFDLFNBQUQsRUFBWSxPQUFaLEdBQUE7QUFDeEIsRUFBQSxJQUFBLENBQUEsU0FBQTtXQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsT0FBVixFQUFBO0dBRHdCO0FBQUEsQ0FUMUIsQ0FBQTs7Ozs7QUNLQSxJQUFBLEdBQUE7RUFBQTs7aVNBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsR0FBQSxHQUFNLFNBQUEsR0FBQTtBQUNyQixNQUFBLElBQUE7QUFBQSxFQURzQiw4REFDdEIsQ0FBQTtBQUFBLEVBQUEsSUFBRyxzQkFBSDtBQUNFLElBQUEsSUFBRyxJQUFJLENBQUMsTUFBTCxJQUFnQixJQUFLLENBQUEsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUFkLENBQUwsS0FBeUIsT0FBNUM7QUFDRSxNQUFBLElBQUksQ0FBQyxHQUFMLENBQUEsQ0FBQSxDQUFBO0FBQ0EsTUFBQSxJQUEwQiw0QkFBMUI7QUFBQSxRQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBZixDQUFBLENBQUEsQ0FBQTtPQUZGO0tBQUE7QUFBQSxJQUlBLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQW5CLENBQXlCLE1BQU0sQ0FBQyxPQUFoQyxFQUF5QyxJQUF6QyxDQUpBLENBQUE7V0FLQSxPQU5GO0dBRHFCO0FBQUEsQ0FBdkIsQ0FBQTs7QUFBQSxDQVVHLFNBQUEsR0FBQTtBQUlELE1BQUEsdUJBQUE7QUFBQSxFQUFNO0FBRUosc0NBQUEsQ0FBQTs7QUFBYSxJQUFBLHlCQUFDLE9BQUQsR0FBQTtBQUNYLE1BQUEsa0RBQUEsU0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsT0FEWCxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsSUFGdEIsQ0FEVztJQUFBLENBQWI7OzJCQUFBOztLQUY0QixNQUE5QixDQUFBO0FBQUEsRUFVQSxNQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsS0FBVixHQUFBOztNQUFVLFFBQVE7S0FDekI7QUFBQSxJQUFBLElBQUcsb0RBQUg7QUFDRSxNQUFBLFFBQVEsQ0FBQyxJQUFULENBQWtCLElBQUEsS0FBQSxDQUFNLE9BQU4sQ0FBbEIsRUFBa0MsU0FBQSxHQUFBO0FBQ2hDLFlBQUEsSUFBQTtBQUFBLFFBQUEsSUFBRyxDQUFDLEtBQUEsS0FBUyxVQUFULElBQXVCLEtBQUEsS0FBUyxPQUFqQyxDQUFBLElBQThDLGlFQUFqRDtpQkFDRSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFyQixDQUEwQixNQUFNLENBQUMsT0FBakMsRUFBMEMsT0FBMUMsRUFERjtTQUFBLE1BQUE7aUJBR0UsR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFULEVBQW9CLE9BQXBCLEVBSEY7U0FEZ0M7TUFBQSxDQUFsQyxDQUFBLENBREY7S0FBQSxNQUFBO0FBT0UsTUFBQSxJQUFJLEtBQUEsS0FBUyxVQUFULElBQXVCLEtBQUEsS0FBUyxPQUFwQztBQUNFLGNBQVUsSUFBQSxlQUFBLENBQWdCLE9BQWhCLENBQVYsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLEdBQUcsQ0FBQyxJQUFKLENBQVMsTUFBVCxFQUFvQixPQUFwQixDQUFBLENBSEY7T0FQRjtLQUFBO1dBWUEsT0FiTztFQUFBLENBVlQsQ0FBQTtBQUFBLEVBMEJBLEdBQUcsQ0FBQyxLQUFKLEdBQVksU0FBQyxPQUFELEdBQUE7QUFDVixJQUFBLElBQUEsQ0FBQSxHQUFtQyxDQUFDLGFBQXBDO2FBQUEsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsT0FBaEIsRUFBQTtLQURVO0VBQUEsQ0ExQlosQ0FBQTtBQUFBLEVBOEJBLEdBQUcsQ0FBQyxJQUFKLEdBQVcsU0FBQyxPQUFELEdBQUE7QUFDVCxJQUFBLElBQUEsQ0FBQSxHQUFxQyxDQUFDLGdCQUF0QzthQUFBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLFNBQWhCLEVBQUE7S0FEUztFQUFBLENBOUJYLENBQUE7U0FtQ0EsR0FBRyxDQUFDLEtBQUosR0FBWSxTQUFDLE9BQUQsR0FBQTtXQUNWLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLE9BQWhCLEVBRFU7RUFBQSxFQXZDWDtBQUFBLENBQUEsQ0FBSCxDQUFBLENBVkEsQ0FBQTs7Ozs7QUNMQSxJQUFBLFdBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxHQUFELEdBQU8sRUFBUCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLENBRFYsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBS0EsSUFBQSxHQUFNLFNBQUMsR0FBRCxFQUFNLEtBQU4sR0FBQTtBQUNKLElBQUEsSUFBQyxDQUFBLEdBQUksQ0FBQSxHQUFBLENBQUwsR0FBWSxLQUFaLENBQUE7QUFBQSxJQUNBLElBQUUsQ0FBQSxJQUFDLENBQUEsTUFBRCxDQUFGLEdBQWEsS0FEYixDQUFBO1dBRUEsSUFBQyxDQUFBLE1BQUQsSUFBVyxFQUhQO0VBQUEsQ0FMTixDQUFBOztBQUFBLHdCQVdBLEdBQUEsR0FBSyxTQUFDLEdBQUQsR0FBQTtXQUNILElBQUMsQ0FBQSxHQUFJLENBQUEsR0FBQSxFQURGO0VBQUEsQ0FYTCxDQUFBOztBQUFBLHdCQWVBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtBQUNKLFFBQUEseUJBQUE7QUFBQTtTQUFBLDJDQUFBO3VCQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLEtBQVQsRUFBQSxDQURGO0FBQUE7b0JBREk7RUFBQSxDQWZOLENBQUE7O0FBQUEsd0JBb0JBLE9BQUEsR0FBUyxTQUFBLEdBQUE7QUFDUCxRQUFBLHlCQUFBO0FBQUE7U0FBQSwyQ0FBQTt1QkFBQTtBQUFBLG9CQUFBLE1BQUEsQ0FBQTtBQUFBO29CQURPO0VBQUEsQ0FwQlQsQ0FBQTs7cUJBQUE7O0lBRkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGlCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BMkJNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsbUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFULENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FEWCxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZLEtBRlosQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFNBQUQsR0FBYSxFQUhiLENBRFc7RUFBQSxDQUFiOztBQUFBLHNCQU9BLFdBQUEsR0FBYSxTQUFDLFFBQUQsR0FBQTtBQUNYLElBQUEsSUFBRyxJQUFDLENBQUEsUUFBSjthQUNFLFFBQUEsQ0FBQSxFQURGO0tBQUEsTUFBQTthQUdFLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixRQUFoQixFQUhGO0tBRFc7RUFBQSxDQVBiLENBQUE7O0FBQUEsc0JBY0EsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxTQURNO0VBQUEsQ0FkVCxDQUFBOztBQUFBLHNCQWtCQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsSUFBQSxNQUFBLENBQU8sQ0FBQSxJQUFLLENBQUEsT0FBWixFQUNFLHlDQURGLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUZYLENBQUE7V0FHQSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBSks7RUFBQSxDQWxCUCxDQUFBOztBQUFBLHNCQXlCQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsSUFBQSxNQUFBLENBQU8sQ0FBQSxJQUFLLENBQUEsUUFBWixFQUNFLG9EQURGLENBQUEsQ0FBQTtXQUVBLElBQUMsQ0FBQSxLQUFELElBQVUsRUFIRDtFQUFBLENBekJYLENBQUE7O0FBQUEsc0JBK0JBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxJQUFBLE1BQUEsQ0FBTyxJQUFDLENBQUEsS0FBRCxHQUFTLENBQWhCLEVBQ0Usd0RBREYsQ0FBQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsS0FBRCxJQUFVLENBRlYsQ0FBQTtXQUdBLElBQUMsQ0FBQSxXQUFELENBQUEsRUFKUztFQUFBLENBL0JYLENBQUE7O0FBQUEsc0JBc0NBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBQSxDQUFBO1dBQ0EsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUFHLEtBQUMsQ0FBQSxTQUFELENBQUEsRUFBSDtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLEVBRkk7RUFBQSxDQXRDTixDQUFBOztBQUFBLHNCQTRDQSxXQUFBLEdBQWEsU0FBQSxHQUFBO0FBQ1gsUUFBQSxrQ0FBQTtBQUFBLElBQUEsSUFBRyxJQUFDLENBQUEsS0FBRCxLQUFVLENBQVYsSUFBZSxJQUFDLENBQUEsT0FBRCxLQUFZLElBQTlCO0FBQ0UsTUFBQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQVosQ0FBQTtBQUNBO0FBQUE7V0FBQSwyQ0FBQTs0QkFBQTtBQUFBLHNCQUFBLFFBQUEsQ0FBQSxFQUFBLENBQUE7QUFBQTtzQkFGRjtLQURXO0VBQUEsQ0E1Q2IsQ0FBQTs7bUJBQUE7O0lBN0JGLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FFbEI7QUFBQSxJQUFBLE9BQUEsRUFBUyxTQUFDLEdBQUQsR0FBQTtBQUNQLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBbUIsV0FBbkI7QUFBQSxlQUFPLElBQVAsQ0FBQTtPQUFBO0FBQ0EsV0FBQSxXQUFBLEdBQUE7QUFDRSxRQUFBLElBQWdCLEdBQUcsQ0FBQyxjQUFKLENBQW1CLElBQW5CLENBQWhCO0FBQUEsaUJBQU8sS0FBUCxDQUFBO1NBREY7QUFBQSxPQURBO2FBSUEsS0FMTztJQUFBLENBQVQ7QUFBQSxJQVFBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTtBQUNSLFVBQUEsaUJBQUE7QUFBQSxNQUFBLElBQUEsR0FBTyxNQUFQLENBQUE7QUFFQSxXQUFBLFdBQUE7MEJBQUE7QUFDRSxRQUFBLFNBQUEsT0FBUyxHQUFULENBQUE7QUFBQSxRQUNBLElBQUssQ0FBQSxJQUFBLENBQUwsR0FBYSxLQURiLENBREY7QUFBQSxPQUZBO2FBTUEsS0FQUTtJQUFBLENBUlY7SUFGa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7OztBQ0FBLElBQUEsQ0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBSWxCO0FBQUEsSUFBQSxRQUFBLEVBQVUsU0FBQyxHQUFELEdBQUE7QUFDUixVQUFBLFdBQUE7QUFBQSxNQUFBLFdBQUEsR0FBYyxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVAsQ0FBVyxDQUFDLE9BQVosQ0FBb0Isb0JBQXBCLEVBQTBDLE9BQTFDLENBQWtELENBQUMsV0FBbkQsQ0FBQSxDQUFkLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFXLFdBQVgsRUFGUTtJQUFBLENBQVY7QUFBQSxJQU1BLFVBQUEsRUFBYSxTQUFDLEdBQUQsR0FBQTtBQUNULE1BQUEsR0FBQSxHQUFVLFdBQUosR0FBYyxFQUFkLEdBQXNCLE1BQUEsQ0FBTyxHQUFQLENBQTVCLENBQUE7QUFDQSxhQUFPLEdBQUcsQ0FBQyxNQUFKLENBQVcsQ0FBWCxDQUFhLENBQUMsV0FBZCxDQUFBLENBQUEsR0FBOEIsR0FBRyxDQUFDLEtBQUosQ0FBVSxDQUFWLENBQXJDLENBRlM7SUFBQSxDQU5iO0FBQUEsSUFZQSxRQUFBLEVBQVUsU0FBQyxHQUFELEdBQUE7QUFDUixNQUFBLElBQUksV0FBSjtlQUNFLEdBREY7T0FBQSxNQUFBO2VBR0UsTUFBQSxDQUFPLEdBQVAsQ0FBVyxDQUFDLE9BQVosQ0FBb0IsYUFBcEIsRUFBbUMsU0FBQyxDQUFELEdBQUE7aUJBQ2pDLENBQUMsQ0FBQyxXQUFGLENBQUEsRUFEaUM7UUFBQSxDQUFuQyxFQUhGO09BRFE7SUFBQSxDQVpWO0FBQUEsSUFxQkEsU0FBQSxFQUFXLFNBQUMsR0FBRCxHQUFBO2FBQ1QsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQVcsQ0FBQyxPQUFaLENBQW9CLFVBQXBCLEVBQWdDLEtBQWhDLENBQXNDLENBQUMsT0FBdkMsQ0FBK0MsVUFBL0MsRUFBMkQsR0FBM0QsQ0FBK0QsQ0FBQyxXQUFoRSxDQUFBLEVBRFM7SUFBQSxDQXJCWDtBQUFBLElBMEJBLE1BQUEsRUFBUSxTQUFDLE1BQUQsRUFBUyxNQUFULEdBQUE7QUFDTixNQUFBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxNQUFmLENBQUEsS0FBMEIsQ0FBN0I7ZUFDRSxPQURGO09BQUEsTUFBQTtlQUdFLEVBQUEsR0FBSyxNQUFMLEdBQWMsT0FIaEI7T0FETTtJQUFBLENBMUJSO0FBQUEsSUFtQ0EsWUFBQSxFQUFjLFNBQUMsR0FBRCxHQUFBO2FBQ1osSUFBSSxDQUFDLFNBQUwsQ0FBZSxHQUFmLEVBQW9CLElBQXBCLEVBQTBCLENBQTFCLEVBRFk7SUFBQSxDQW5DZDtBQUFBLElBdUNBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTthQUNSLENBQUMsQ0FBQyxJQUFGLENBQU8sR0FBUCxDQUFXLENBQUMsT0FBWixDQUFvQixjQUFwQixFQUFvQyxTQUFDLEtBQUQsRUFBUSxDQUFSLEdBQUE7ZUFDbEMsQ0FBQyxDQUFDLFdBQUYsQ0FBQSxFQURrQztNQUFBLENBQXBDLEVBRFE7SUFBQSxDQXZDVjtBQUFBLElBNENBLElBQUEsRUFBTSxTQUFDLEdBQUQsR0FBQTthQUNKLEdBQUcsQ0FBQyxPQUFKLENBQVksWUFBWixFQUEwQixFQUExQixFQURJO0lBQUEsQ0E1Q047QUFBQSxJQWtEQSxtQkFBQSxFQUFxQixTQUFDLEdBQUQsR0FBQTtBQUNuQixVQUFBLEdBQUE7QUFBQSxNQUFBLEdBQUEsR0FBTSxDQUFBLENBQUUsT0FBRixDQUFXLENBQUEsQ0FBQSxDQUFqQixDQUFBO0FBQUEsTUFDQSxHQUFHLENBQUMsU0FBSixHQUFnQixHQURoQixDQUFBO2FBRUEsR0FBRyxDQUFDLFlBSGU7SUFBQSxDQWxEckI7SUFKa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUxqQixDQUFBOzs7OztBQ0FBLElBQUEscUVBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBRFQsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sTUFBTSxDQUFDLEdBRmIsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sTUFBTSxDQUFDLElBSGQsQ0FBQTs7QUFBQSxpQkFJQSxHQUFvQixPQUFBLENBQVEsZ0NBQVIsQ0FKcEIsQ0FBQTs7QUFBQSxRQUtBLEdBQVcsT0FBQSxDQUFRLHFCQUFSLENBTFgsQ0FBQTs7QUFBQSxHQU1BLEdBQU0sT0FBQSxDQUFRLG9CQUFSLENBTk4sQ0FBQTs7QUFBQSxNQVFNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsdUJBQUMsSUFBRCxHQUFBO0FBQ1gsSUFEYyxJQUFDLENBQUEsYUFBQSxPQUFPLElBQUMsQ0FBQSxhQUFBLE9BQU8sSUFBQyxDQUFBLGtCQUFBLFlBQVksSUFBQyxDQUFBLGtCQUFBLFVBQzVDLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLEtBQVYsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBRG5CLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxlQUFELEdBQW1CLEtBRm5CLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFDLENBQUMsU0FBRixDQUFBLENBSHBCLENBQUE7QUFLQSxJQUFBLElBQUEsQ0FBQSxJQUFRLENBQUEsVUFBUjtBQUVFLE1BQUEsSUFBQyxDQUFBLEtBQ0MsQ0FBQyxJQURILENBQ1EsZUFEUixFQUN5QixJQUR6QixDQUVFLENBQUMsUUFGSCxDQUVZLEdBQUcsQ0FBQyxTQUZoQixDQUdFLENBQUMsSUFISCxDQUdRLElBQUksQ0FBQyxRQUhiLEVBR3VCLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFIakMsQ0FBQSxDQUZGO0tBTEE7QUFBQSxJQVlBLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FaQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSwwQkFnQkEsTUFBQSxHQUFRLFNBQUMsSUFBRCxHQUFBO0FBQ04sSUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFGTTtFQUFBLENBaEJSLENBQUE7O0FBQUEsMEJBcUJBLGFBQUEsR0FBZSxTQUFBLEdBQUE7QUFDYixJQUFBLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFoQixDQUFBLENBQUE7QUFFQSxJQUFBLElBQUcsQ0FBQSxJQUFLLENBQUEsUUFBRCxDQUFBLENBQVA7QUFDRSxNQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLENBQUEsQ0FERjtLQUZBO1dBS0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFOYTtFQUFBLENBckJmLENBQUE7O0FBQUEsMEJBOEJBLFVBQUEsR0FBWSxTQUFBLEdBQUE7QUFDVixRQUFBLGlCQUFBO0FBQUE7QUFBQSxTQUFBLFlBQUE7eUJBQUE7QUFDRSxNQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFnQixLQUFoQixDQUFBLENBREY7QUFBQSxLQUFBO1dBR0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFKVTtFQUFBLENBOUJaLENBQUE7O0FBQUEsMEJBcUNBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtXQUNoQixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsU0FBRCxHQUFBO0FBQ2YsWUFBQSxLQUFBO0FBQUEsUUFBQSxJQUFHLFNBQVMsQ0FBQyxRQUFiO0FBQ0UsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQVIsQ0FBQTtBQUNBLFVBQUEsSUFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBSDttQkFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFNBQVYsRUFBcUIsTUFBckIsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLEVBQXFCLEVBQXJCLEVBSEY7V0FGRjtTQURlO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFEZ0I7RUFBQSxDQXJDbEIsQ0FBQTs7QUFBQSwwQkFpREEsYUFBQSxHQUFlLFNBQUEsR0FBQTtXQUNiLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDZixRQUFBLElBQUcsU0FBUyxDQUFDLFFBQWI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGE7RUFBQSxDQWpEZixDQUFBOztBQUFBLDBCQXlEQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7V0FDbEIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNmLFFBQUEsSUFBRyxTQUFTLENBQUMsUUFBVixJQUFzQixLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBekI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGtCO0VBQUEsQ0F6RHBCLENBQUE7O0FBQUEsMEJBK0RBLElBQUEsR0FBTSxTQUFBLEdBQUE7V0FDSixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxDQUFhLENBQUMsSUFBZCxDQUFtQixlQUFuQixFQURJO0VBQUEsQ0EvRE4sQ0FBQTs7QUFBQSwwQkFtRUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFBLENBQWEsQ0FBQyxJQUFkLENBQW1CLGVBQW5CLEVBREk7RUFBQSxDQW5FTixDQUFBOztBQUFBLDBCQXVFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBZ0IsR0FBRyxDQUFDLGtCQUFwQixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBRlk7RUFBQSxDQXZFZCxDQUFBOztBQUFBLDBCQTRFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsR0FBRyxDQUFDLGtCQUF2QixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUZZO0VBQUEsQ0E1RWQsQ0FBQTs7QUFBQSwwQkFrRkEsS0FBQSxHQUFPLFNBQUMsTUFBRCxHQUFBO0FBQ0wsUUFBQSxXQUFBO0FBQUEsSUFBQSxLQUFBLG1EQUE4QixDQUFBLENBQUEsQ0FBRSxDQUFDLGFBQWpDLENBQUE7V0FDQSxDQUFBLENBQUUsS0FBRixDQUFRLENBQUMsS0FBVCxDQUFBLEVBRks7RUFBQSxDQWxGUCxDQUFBOztBQUFBLDBCQXVGQSxRQUFBLEdBQVUsU0FBQSxHQUFBO1dBQ1IsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxrQkFBcEIsRUFEUTtFQUFBLENBdkZWLENBQUE7O0FBQUEsMEJBMkZBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTtXQUNyQixJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLHFCQUFWLENBQUEsRUFEcUI7RUFBQSxDQTNGdkIsQ0FBQTs7QUFBQSwwQkErRkEsNkJBQUEsR0FBK0IsU0FBQSxHQUFBO1dBQzdCLEdBQUcsQ0FBQyw2QkFBSixDQUFrQyxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBekMsRUFENkI7RUFBQSxDQS9GL0IsQ0FBQTs7QUFBQSwwQkFtR0EsT0FBQSxHQUFTLFNBQUMsT0FBRCxHQUFBO0FBQ1AsUUFBQSxnQ0FBQTtBQUFBO1NBQUEsZUFBQTs0QkFBQTtBQUNFLE1BQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQVosQ0FBQTtBQUNBLE1BQUEsSUFBRyxTQUFTLENBQUMsT0FBYjtBQUNFLFFBQUEsSUFBRyw2QkFBSDt3QkFDRSxJQUFDLENBQUEsR0FBRCxDQUFLLElBQUwsRUFBVyxTQUFTLENBQUMsV0FBckIsR0FERjtTQUFBLE1BQUE7d0JBR0UsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsU0FBUyxDQUFDLFdBQVYsQ0FBQSxDQUFYLEdBSEY7U0FERjtPQUFBLE1BQUE7c0JBTUUsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsS0FBWCxHQU5GO09BRkY7QUFBQTtvQkFETztFQUFBLENBbkdULENBQUE7O0FBQUEsMEJBK0dBLEdBQUEsR0FBSyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDSCxRQUFBLFNBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBaEIsQ0FBWixDQUFBO0FBQ0EsWUFBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxXQUNPLFVBRFA7ZUFDdUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiLEVBQW1CLEtBQW5CLEVBRHZCO0FBQUEsV0FFTyxPQUZQO2VBRW9CLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFnQixLQUFoQixFQUZwQjtBQUFBLFdBR08sTUFIUDtlQUdtQixJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsRUFBZSxLQUFmLEVBSG5CO0FBQUEsS0FGRztFQUFBLENBL0dMLENBQUE7O0FBQUEsMEJBdUhBLEdBQUEsR0FBSyxTQUFDLElBQUQsR0FBQTtBQUNILFFBQUEsU0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFoQixDQUFaLENBQUE7QUFDQSxZQUFPLFNBQVMsQ0FBQyxJQUFqQjtBQUFBLFdBQ08sVUFEUDtlQUN1QixJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFEdkI7QUFBQSxXQUVPLE9BRlA7ZUFFb0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBRnBCO0FBQUEsV0FHTyxNQUhQO2VBR21CLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUhuQjtBQUFBLEtBRkc7RUFBQSxDQXZITCxDQUFBOztBQUFBLDBCQStIQSxXQUFBLEdBQWEsU0FBQyxJQUFELEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO1dBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBQSxFQUZXO0VBQUEsQ0EvSGIsQ0FBQTs7QUFBQSwwQkFvSUEsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNYLFFBQUEsS0FBQTtBQUFBLElBQUEsSUFBVSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVY7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUZSLENBQUE7QUFBQSxJQUdBLEtBQUssQ0FBQyxXQUFOLENBQWtCLEdBQUcsQ0FBQyxhQUF0QixFQUFxQyxPQUFBLENBQVEsS0FBUixDQUFyQyxDQUhBLENBQUE7QUFBQSxJQUlBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxDQUFDLFdBQWhCLEVBQTZCLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBaEQsQ0FKQSxDQUFBO1dBTUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFBLElBQVMsRUFBcEIsRUFQVztFQUFBLENBcEliLENBQUE7O0FBQUEsMEJBOElBLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7V0FDQSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQUcsQ0FBQyxhQUFuQixFQUZhO0VBQUEsQ0E5SWYsQ0FBQTs7QUFBQSwwQkFtSkEsWUFBQSxHQUFjLFNBQUMsSUFBRCxHQUFBO0FBQ1osUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxJQUFmLENBQUg7YUFDRSxLQUFLLENBQUMsV0FBTixDQUFrQixHQUFHLENBQUMsYUFBdEIsRUFERjtLQUZZO0VBQUEsQ0FuSmQsQ0FBQTs7QUFBQSwwQkF5SkEsT0FBQSxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtXQUNBLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFGTztFQUFBLENBekpULENBQUE7O0FBQUEsMEJBOEpBLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQUEsSUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQUEsSUFBUyxFQUFwQixDQURBLENBQUE7QUFHQSxJQUFBLElBQUcsQ0FBQSxLQUFIO0FBQ0UsTUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBOUIsQ0FBQSxDQURGO0tBQUEsTUFFSyxJQUFHLEtBQUEsSUFBVSxDQUFBLElBQUssQ0FBQSxVQUFsQjtBQUNILE1BQUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLENBQUEsQ0FERztLQUxMO0FBQUEsSUFRQSxJQUFDLENBQUEsc0JBQUQsSUFBQyxDQUFBLG9CQUFzQixHQVJ2QixDQUFBO1dBU0EsSUFBQyxDQUFBLGlCQUFrQixDQUFBLElBQUEsQ0FBbkIsR0FBMkIsS0FWcEI7RUFBQSxDQTlKVCxDQUFBOztBQUFBLDBCQTJLQSxtQkFBQSxHQUFxQixTQUFDLGFBQUQsR0FBQTtBQUNuQixRQUFBLElBQUE7cUVBQThCLENBQUUsY0FEYjtFQUFBLENBM0tyQixDQUFBOztBQUFBLDBCQXNMQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFFBQUEscUJBQUE7QUFBQTtTQUFBLDhCQUFBLEdBQUE7QUFDRSxNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQ0EsTUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQUFvQixDQUFDLE1BQXhCO3NCQUNFLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxFQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUSxDQUFBLElBQUEsQ0FBMUIsR0FERjtPQUFBLE1BQUE7OEJBQUE7T0FGRjtBQUFBO29CQURlO0VBQUEsQ0F0TGpCLENBQUE7O0FBQUEsMEJBNkxBLFFBQUEsR0FBVSxTQUFDLElBQUQsR0FBQTtBQUNSLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7V0FDQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFGUTtFQUFBLENBN0xWLENBQUE7O0FBQUEsMEJBa01BLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUixRQUFBLG1DQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtBQUVBLElBQUEsSUFBRyxLQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWYsQ0FBQSxDQUFBO0FBQUEsTUFFQSxZQUFBLEdBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBbEIsQ0FBc0IsSUFBdEIsQ0FBMkIsQ0FBQyxlQUE1QixDQUFBLENBRmYsQ0FBQTtBQUFBLE1BR0EsWUFBWSxDQUFDLEdBQWIsQ0FBaUIsS0FBakIsRUFBd0IsS0FBeEIsQ0FIQSxDQUFBO2FBS0EsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUE3QixFQU5GO0tBQUEsTUFBQTtBQVFFLE1BQUEsY0FBQSxHQUFpQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxtQkFBVCxFQUE4QixJQUE5QixFQUFvQyxLQUFwQyxFQUEyQyxJQUEzQyxDQUFqQixDQUFBO2FBQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQXBCLEVBQTBCLGNBQTFCLEVBVEY7S0FIUTtFQUFBLENBbE1WLENBQUE7O0FBQUEsMEJBaU5BLG1CQUFBLEdBQXFCLFNBQUMsS0FBRCxFQUFRLElBQVIsR0FBQTtBQUNuQixRQUFBLGtDQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsUUFBTixDQUFlLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBMUIsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFULEtBQXFCLEtBQXhCO0FBQ0UsTUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBQSxDQUFSLENBQUE7QUFBQSxNQUNBLE1BQUEsR0FBUyxLQUFLLENBQUMsTUFBTixDQUFBLENBRFQsQ0FERjtLQUFBLE1BQUE7QUFJRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsVUFBTixDQUFBLENBQVIsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxHQUFTLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FEVCxDQUpGO0tBREE7QUFBQSxJQU9BLEtBQUEsR0FBUyxzQkFBQSxHQUFzQixLQUF0QixHQUE0QixHQUE1QixHQUErQixNQUEvQixHQUFzQyxnQkFQL0MsQ0FBQTtBQUFBLElBU0EsWUFBQSxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQTJCLENBQUMsZUFBNUIsQ0FBQSxDQVRmLENBQUE7V0FVQSxZQUFZLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF3QixLQUF4QixFQVhtQjtFQUFBLENBak5yQixDQUFBOztBQUFBLDBCQStOQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sU0FBUCxHQUFBO0FBQ1IsUUFBQSxvQ0FBQTtBQUFBLElBQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBTyxDQUFBLElBQUEsQ0FBSyxDQUFDLGVBQXZCLENBQXVDLFNBQXZDLENBQVYsQ0FBQTtBQUNBLElBQUEsSUFBRyxPQUFPLENBQUMsTUFBWDtBQUNFO0FBQUEsV0FBQSwyQ0FBQTsrQkFBQTtBQUNFLFFBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQW1CLFdBQW5CLENBQUEsQ0FERjtBQUFBLE9BREY7S0FEQTtXQUtBLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUCxDQUFnQixPQUFPLENBQUMsR0FBeEIsRUFOUTtFQUFBLENBL05WLENBQUE7O0FBQUEsMEJBNE9BLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7V0FDZCxVQUFBLENBQVksQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNWLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQUFvQixDQUFDLElBQXJCLENBQTBCLFVBQTFCLEVBQXNDLElBQXRDLEVBRFU7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaLEVBRUUsR0FGRixFQURjO0VBQUEsQ0E1T2hCLENBQUE7O0FBQUEsMEJBcVBBLGdCQUFBLEdBQWtCLFNBQUMsS0FBRCxHQUFBO0FBQ2hCLFFBQUEsUUFBQTtBQUFBLElBQUEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEtBQXhCLENBQUEsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFXLENBQUEsQ0FBRyxjQUFBLEdBQWpCLEdBQUcsQ0FBQyxrQkFBYSxHQUF1QyxJQUExQyxDQUNULENBQUMsSUFEUSxDQUNILE9BREcsRUFDTSwyREFETixDQURYLENBQUE7QUFBQSxJQUdBLEtBQUssQ0FBQyxNQUFOLENBQWEsUUFBYixDQUhBLENBQUE7V0FLQSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixFQU5nQjtFQUFBLENBclBsQixDQUFBOztBQUFBLDBCQWdRQSxzQkFBQSxHQUF3QixTQUFDLEtBQUQsR0FBQTtBQUN0QixRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsQ0FBWCxDQUFBO0FBQ0EsSUFBQSxJQUFHLFFBQUEsS0FBWSxVQUFaLElBQTBCLFFBQUEsS0FBWSxPQUF0QyxJQUFpRCxRQUFBLEtBQVksVUFBaEU7YUFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsRUFBc0IsVUFBdEIsRUFERjtLQUZzQjtFQUFBLENBaFF4QixDQUFBOztBQUFBLDBCQXNRQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsQ0FBQSxDQUFFLEdBQUcsQ0FBQyxhQUFKLENBQWtCLElBQUMsQ0FBQSxLQUFNLENBQUEsQ0FBQSxDQUF6QixDQUE0QixDQUFDLElBQS9CLEVBRGE7RUFBQSxDQXRRZixDQUFBOztBQUFBLDBCQTJRQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDbEIsSUFBQSxJQUFHLElBQUMsQ0FBQSxlQUFKO2FBQ0UsSUFBQSxDQUFBLEVBREY7S0FBQSxNQUFBO0FBR0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWYsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBRCxJQUFDLENBQUEsVUFBWSxHQURiLENBQUE7YUFFQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixRQUFRLENBQUMsUUFBVCxDQUFrQixJQUFDLENBQUEsZ0JBQW5CLEVBQXFDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFBLEdBQUE7QUFDcEQsVUFBQSxLQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixNQUFqQixDQUFBO2lCQUNBLElBQUEsQ0FBQSxFQUZvRDtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDLEVBTG5CO0tBRGtCO0VBQUEsQ0EzUXBCLENBQUE7O0FBQUEsMEJBc1JBLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFFBQUEsSUFBQTtBQUFBLElBQUEsd0NBQWEsQ0FBQSxJQUFBLFVBQWI7QUFDRSxNQUFBLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxNQUFsQixDQUF5QixJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBbEMsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLENBQVQsR0FBaUIsT0FGbkI7S0FEYTtFQUFBLENBdFJmLENBQUE7O0FBQUEsMEJBNFJBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtBQUNuQixRQUFBLHdCQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsSUFBZSxDQUFBLFVBQWY7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsUUFBQSxHQUFlLElBQUEsaUJBQUEsQ0FBa0IsSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBQXpCLENBRmYsQ0FBQTtBQUdBO1dBQU0sSUFBQSxHQUFPLFFBQVEsQ0FBQyxXQUFULENBQUEsQ0FBYixHQUFBO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixDQURBLENBQUE7QUFBQSxvQkFFQSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsSUFBdEIsRUFGQSxDQURGO0lBQUEsQ0FBQTtvQkFKbUI7RUFBQSxDQTVSckIsQ0FBQTs7QUFBQSwwQkFzU0EsZUFBQSxHQUFpQixTQUFDLElBQUQsR0FBQTtBQUNmLFFBQUEsc0NBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFDQTtBQUFBO1NBQUEsMkNBQUE7dUJBQUE7QUFDRSxNQUFBLElBQTRCLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEtBQWhCLENBQTVCO3NCQUFBLEtBQUssQ0FBQyxXQUFOLENBQWtCLEtBQWxCLEdBQUE7T0FBQSxNQUFBOzhCQUFBO09BREY7QUFBQTtvQkFGZTtFQUFBLENBdFNqQixDQUFBOztBQUFBLDBCQTRTQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixRQUFBLGdEQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQ0E7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0UsTUFBQSxJQUFBLEdBQU8sU0FBUyxDQUFDLElBQWpCLENBQUE7QUFDQSxNQUFBLElBQTBCLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLElBQXRCLENBQTFCO3NCQUFBLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEdBQUE7T0FBQSxNQUFBOzhCQUFBO09BRkY7QUFBQTtvQkFGa0I7RUFBQSxDQTVTcEIsQ0FBQTs7QUFBQSwwQkFtVEEsb0JBQUEsR0FBc0IsU0FBQyxJQUFELEdBQUE7QUFDcEIsUUFBQSx5R0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLElBQ0Esb0JBQUEsR0FBdUIsQ0FBQyxPQUFELEVBQVUsT0FBVixDQUR2QixDQUFBO0FBRUE7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0UsTUFBQSxxQkFBQSxHQUF3QixvQkFBb0IsQ0FBQyxPQUFyQixDQUE2QixTQUFTLENBQUMsSUFBdkMsQ0FBQSxJQUFnRCxDQUF4RSxDQUFBO0FBQUEsTUFDQSxnQkFBQSxHQUFtQixTQUFTLENBQUMsS0FBSyxDQUFDLElBQWhCLENBQUEsQ0FBQSxLQUEwQixFQUQ3QyxDQUFBO0FBRUEsTUFBQSxJQUFHLHFCQUFBLElBQTBCLGdCQUE3QjtzQkFDRSxLQUFLLENBQUMsVUFBTixDQUFpQixTQUFTLENBQUMsSUFBM0IsR0FERjtPQUFBLE1BQUE7OEJBQUE7T0FIRjtBQUFBO29CQUhvQjtFQUFBLENBblR0QixDQUFBOztBQUFBLDBCQTZUQSxnQkFBQSxHQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixJQUFBLElBQVUsTUFBQSxLQUFVLElBQUMsQ0FBQSxlQUFyQjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsZUFBRCxHQUFtQixNQUZuQixDQUFBO0FBSUEsSUFBQSxJQUFHLE1BQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLElBQWxCLENBQUEsRUFGRjtLQUxnQjtFQUFBLENBN1RsQixDQUFBOztBQUFBLDBCQXVVQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtXQUNkLElBQUMsQ0FBQSxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsYUFBYSxDQUFDLFlBRFY7RUFBQSxDQXZVaEIsQ0FBQTs7dUJBQUE7O0lBVkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLDREQUFBO0VBQUEsa0ZBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxHQUNBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBRE4sQ0FBQTs7QUFBQSxNQUVBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRlQsQ0FBQTs7QUFBQSxVQUdBLEdBQWEsT0FBQSxDQUFRLGNBQVIsQ0FIYixDQUFBOztBQUFBLGtCQUlBLEdBQXFCLE9BQUEsQ0FBUSx3QkFBUixDQUpyQixDQUFBOztBQUFBLE1BTU0sQ0FBQyxPQUFQLEdBQXVCO0FBUVIsRUFBQSxzQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLHVCQUFBO0FBQUEsMEJBRFksT0FBK0MsSUFBN0MsSUFBQyxDQUFBLHFCQUFBLGVBQWUsSUFBQyxDQUFBLGNBQUEsUUFBUSx5QkFBQSxpQkFDdkMsQ0FBQTtBQUFBLG1FQUFBLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxpQkFBRCxHQUF3QixJQUFDLENBQUEsTUFBSixHQUFnQixJQUFoQixHQUEwQixpQkFBQSxJQUFxQixLQUFwRSxDQUFBOztNQUNBLElBQUMsQ0FBQSxTQUFVO0tBRFg7QUFBQSxJQUdBLElBQUMsQ0FBQSxFQUFELEdBQU0sRUFITixDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsR0FBRCxHQUFPLEVBSlAsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUxkLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxlQUFELEdBQW1CLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FQbkIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLGlCQUFELEdBQXFCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FSckIsQ0FBQTtBQVVBLElBQUEsSUFBRywwQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFoQyxDQUFvQyxJQUFDLENBQUEsa0JBQXJDLENBQUEsQ0FERjtLQVhXO0VBQUEsQ0FBYjs7QUFBQSx5QkFnQkEsR0FBQSxHQUFLLFNBQUMsR0FBRCxHQUFBO0FBQ0gsUUFBQSxhQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsR0FBeEIsQ0FBQSxDQUFBO0FBQUEsSUFDQSxHQUFBLEdBQVUsSUFBQSxVQUFBLENBQVcsR0FBWCxDQURWLENBQUE7QUFFQSxJQUFBLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxXQUFELENBQWEsR0FBYixDQUFkO0FBQ0UsTUFBQSxJQUFvQyxzREFBcEM7ZUFBQSxRQUFRLENBQUMsWUFBVCxDQUFzQixTQUF0QixFQUFBO09BREY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLEVBSEY7S0FIRztFQUFBLENBaEJMLENBQUE7O0FBQUEseUJBeUJBLEtBQUEsR0FBTyxTQUFDLEdBQUQsR0FBQTtBQUNMLElBQUEsR0FBRyxDQUFDLElBQUosR0FBVyxJQUFYLENBQUE7V0FDQSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUwsRUFGSztFQUFBLENBekJQLENBQUE7O0FBQUEseUJBOEJBLE1BQUEsR0FBUSxTQUFDLEdBQUQsR0FBQTtBQUNOLElBQUEsR0FBRyxDQUFDLElBQUosR0FBVyxLQUFYLENBQUE7V0FDQSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUwsRUFGTTtFQUFBLENBOUJSLENBQUE7O0FBQUEseUJBMkNBLHNCQUFBLEdBQXdCLFNBQUMsR0FBRCxHQUFBO0FBQ3RCLFFBQUEsR0FBQTtBQUFBLElBQUEsSUFBQSxDQUFBLEdBQWlCLENBQUMsR0FBbEI7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBQ0EsR0FBQSxHQUFNLEdBQUcsQ0FBQyxHQURWLENBQUE7QUFHQSxJQUFBLElBQUcsQ0FBQSxJQUFLLENBQUEsYUFBRCxDQUFlLEdBQWYsQ0FBUDtBQUNFLE1BQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxpQkFBUixFQUE0QiwrQ0FBQSxHQUFqQyxHQUFLLENBQUEsQ0FBQTtBQUFBLE1BQ0EsR0FBQSxHQUFNLEdBQUcsQ0FBQyxPQUFKLENBQVksVUFBWixFQUF3QixFQUF4QixDQUROLENBQUE7YUFFQSxHQUFHLENBQUMsR0FBSixHQUFVLEVBQUEsR0FBZixJQUFDLENBQUEsTUFBYyxHQUFhLEdBQWIsR0FBZixJQUhHO0tBSnNCO0VBQUEsQ0EzQ3hCLENBQUE7O0FBQUEseUJBcURBLGFBQUEsR0FBZSxTQUFDLEdBQUQsR0FBQTtXQUViLHFCQUFxQixDQUFDLElBQXRCLENBQTJCLEdBQTNCLENBQUEsSUFBbUMsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYLEVBRnRCO0VBQUEsQ0FyRGYsQ0FBQTs7QUFBQSx5QkEwREEsYUFBQSxHQUFlLFNBQUMsVUFBRCxHQUFBO0FBQ2IsUUFBQSxVQUFBO0FBQUEsSUFBQSxJQUErQixVQUFVLENBQUMsU0FBMUM7QUFBQSxNQUFBLElBQUMsQ0FBQSxjQUFELENBQWdCLFVBQWhCLENBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxVQUFBLEdBQWdCLFVBQVUsQ0FBQyxJQUFYLENBQUEsQ0FBSCxHQUEwQixJQUFDLENBQUEsRUFBM0IsR0FBbUMsSUFBQyxDQUFBLEdBRmpELENBQUE7QUFBQSxJQUdBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLFVBQWhCLENBSEEsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixVQUF0QixDQUxBLENBQUE7V0FPQSxXQVJhO0VBQUEsQ0ExRGYsQ0FBQTs7QUFBQSx5QkF3RUEsY0FBQSxHQUFnQixTQUFDLFVBQUQsR0FBQTtBQUNkLFFBQUEsdUJBQUE7QUFBQSxJQUFBLElBQUcsVUFBVSxDQUFDLFNBQWQ7O3VCQUN1QztPQUFyQztBQUFBLE1BQ0EsU0FBQSxHQUFZLElBQUMsQ0FBQSxVQUFXLENBQUEsVUFBVSxDQUFDLFNBQVgsQ0FEeEIsQ0FBQTthQUVBLFNBQVMsQ0FBQyxJQUFWLENBQWUsVUFBZixFQUhGO0tBRGM7RUFBQSxDQXhFaEIsQ0FBQTs7QUFBQSx5QkErRUEsbUJBQUEsR0FBcUIsU0FBQyxVQUFELEdBQUE7QUFDbkIsUUFBQSxnQkFBQTtBQUFBLElBQUEsSUFBRyxTQUFBLEdBQVksSUFBQyxDQUFBLFlBQUQsQ0FBYyxVQUFVLENBQUMsU0FBekIsQ0FBZjtBQUNFLE1BQUEsS0FBQSxHQUFRLFNBQVMsQ0FBQyxPQUFWLENBQWtCLFVBQWxCLENBQVIsQ0FBQTtBQUNBLE1BQUEsSUFBOEIsS0FBQSxHQUFRLENBQUEsQ0FBdEM7ZUFBQSxTQUFTLENBQUMsTUFBVixDQUFpQixLQUFqQixFQUF3QixDQUF4QixFQUFBO09BRkY7S0FEbUI7RUFBQSxDQS9FckIsQ0FBQTs7QUFBQSx5QkFxRkEsYUFBQSxHQUFlLFNBQUEsR0FBQTtBQUNiLFFBQUEsMkJBQUE7QUFBQTtBQUFBO1NBQUEsWUFBQTt5QkFBQTtBQUNFLG9CQUFBLEtBQUEsQ0FERjtBQUFBO29CQURhO0VBQUEsQ0FyRmYsQ0FBQTs7QUFBQSx5QkEwRkEsWUFBQSxHQUFjLFNBQUMsSUFBRCxHQUFBO0FBQ1osUUFBQSxTQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFVBQVcsQ0FBQSxJQUFBLENBQXhCLENBQUE7QUFDQSxJQUFBLHdCQUFHLFNBQVMsQ0FBRSxlQUFkO2FBQTBCLFVBQTFCO0tBQUEsTUFBQTthQUF5QyxPQUF6QztLQUZZO0VBQUEsQ0ExRmQsQ0FBQTs7QUFBQSx5QkErRkEsV0FBQSxHQUFhLFNBQUMsR0FBRCxHQUFBO0FBQ1gsUUFBQSwyQkFBQTtBQUFBLElBQUEsVUFBQSxHQUFnQixHQUFHLENBQUMsSUFBSixDQUFBLENBQUgsR0FBbUIsSUFBQyxDQUFBLEVBQXBCLEdBQTRCLElBQUMsQ0FBQSxHQUExQyxDQUFBO0FBQ0EsU0FBQSxpREFBQTs2QkFBQTtBQUNFLE1BQUEsSUFBZ0IsS0FBSyxDQUFDLFFBQU4sQ0FBZSxHQUFmLENBQWhCO0FBQUEsZUFBTyxLQUFQLENBQUE7T0FERjtBQUFBLEtBREE7V0FJQSxPQUxXO0VBQUEsQ0EvRmIsQ0FBQTs7QUFBQSx5QkF1R0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxHQUFjLEVBRFI7RUFBQSxDQXZHUixDQUFBOztBQUFBLHlCQTJHQSxLQUFBLEdBQU8sU0FBQSxHQUFBO1dBQ0wsSUFBQyxDQUFBLEVBQUUsQ0FBQyxNQUFKLEdBQWEsRUFEUjtFQUFBLENBM0dQLENBQUE7O0FBQUEseUJBK0dBLGtCQUFBLEdBQW9CLFNBQUMsU0FBRCxHQUFBO0FBQ2xCLFFBQUEsc0ZBQUE7QUFBQSxJQUFBLFdBQUEsR0FBYyxFQUFkLENBQUE7QUFDQTtBQUFBLFNBQUEsMkNBQUE7NEJBQUE7QUFDRSxNQUFBLE1BQUEsR0FBUyxVQUFVLENBQUMsZUFBWCxDQUEyQixTQUEzQixDQUFULENBQUE7QUFDQSxNQUFBLElBQWdDLENBQUEsTUFBaEM7QUFBQSxRQUFBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLFVBQWpCLENBQUEsQ0FBQTtPQUZGO0FBQUEsS0FEQTtBQUtBO0FBQUEsU0FBQSw4Q0FBQTs2QkFBQTtBQUNFLE1BQUEsTUFBQSxHQUFTLFVBQVUsQ0FBQyxlQUFYLENBQTJCLFNBQTNCLENBQVQsQ0FBQTtBQUNBLE1BQUEsSUFBZ0MsQ0FBQSxNQUFoQztBQUFBLFFBQUEsV0FBVyxDQUFDLElBQVosQ0FBaUIsVUFBakIsQ0FBQSxDQUFBO09BRkY7QUFBQSxLQUxBO0FBU0E7U0FBQSxvREFBQTttQ0FBQTtBQUNFLG9CQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixVQUFsQixFQUFBLENBREY7QUFBQTtvQkFWa0I7RUFBQSxDQS9HcEIsQ0FBQTs7QUFBQSx5QkE2SEEsZ0JBQUEsR0FBa0IsU0FBQyxVQUFELEdBQUE7QUFDaEIsUUFBQSxpQkFBQTtBQUFBLElBQUEsSUFBb0MsVUFBVSxDQUFDLFNBQS9DO0FBQUEsTUFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsVUFBckIsQ0FBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLFVBQUEsR0FBZ0IsVUFBVSxDQUFDLElBQVgsQ0FBQSxDQUFILEdBQTBCLElBQUMsQ0FBQSxFQUEzQixHQUFtQyxJQUFDLENBQUEsR0FEakQsQ0FBQTtBQUFBLElBRUEsS0FBQSxHQUFRLFVBQVUsQ0FBQyxPQUFYLENBQW1CLFVBQW5CLENBRlIsQ0FBQTtBQUdBLElBQUEsSUFBK0IsS0FBQSxHQUFRLENBQUEsQ0FBdkM7QUFBQSxNQUFBLFVBQVUsQ0FBQyxNQUFYLENBQWtCLEtBQWxCLEVBQXlCLENBQXpCLENBQUEsQ0FBQTtLQUhBO1dBS0EsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQW5CLENBQXdCLFVBQXhCLEVBTmdCO0VBQUEsQ0E3SGxCLENBQUE7O0FBQUEseUJBc0lBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxRQUFBLGtEQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sRUFBUCxDQUFBO0FBQ0E7QUFBQSxTQUFBLDJDQUFBOzRCQUFBOztRQUNFLElBQUssQ0FBQSxJQUFBLElBQVM7T0FBZDtBQUFBLE1BQ0EsSUFBSyxDQUFBLElBQUEsQ0FBSyxDQUFDLElBQVgsQ0FBaUIsVUFBVSxDQUFDLFNBQVgsQ0FBQSxDQUFqQixDQURBLENBREY7QUFBQSxLQURBO0FBS0E7QUFBQSxTQUFBLDhDQUFBOzZCQUFBOztRQUNFLElBQUssQ0FBQSxLQUFBLElBQVU7T0FBZjtBQUFBLE1BQ0EsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLElBQVosQ0FBa0IsVUFBVSxDQUFDLFNBQVgsQ0FBQSxDQUFsQixDQURBLENBREY7QUFBQSxLQUxBO1dBU0EsS0FWUztFQUFBLENBdElYLENBQUE7O0FBQUEseUJBbUpBLFdBQUEsR0FBYSxTQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsc0RBQUE7QUFBQSxJQUFBLElBQWMsWUFBZDtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBR0E7QUFBQSxTQUFBLDJDQUFBO3VCQUFBO0FBQ0UsTUFBQSxHQUFBLEdBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxJQUFOO0FBQUEsUUFDQSxHQUFBLEVBQUssS0FBSyxDQUFDLEdBRFg7QUFBQSxRQUVBLElBQUEsRUFBTSxLQUFLLENBQUMsSUFGWjtBQUFBLFFBR0EsU0FBQSxFQUFXLEtBQUssQ0FBQyxTQUhqQjtBQUFBLFFBSUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUpaO09BREYsQ0FBQTtBQUFBLE1BT0EsSUFBQyxDQUFBLGlCQUFELENBQW1CLEdBQW5CLEVBQXdCLEtBQXhCLENBUEEsQ0FERjtBQUFBLEtBSEE7QUFjQTtBQUFBO1NBQUEsOENBQUE7d0JBQUE7QUFDRSxNQUFBLEdBQUEsR0FDRTtBQUFBLFFBQUEsSUFBQSxFQUFNLEtBQU47QUFBQSxRQUNBLEdBQUEsRUFBSyxLQUFLLENBQUMsR0FEWDtBQUFBLFFBRUEsSUFBQSxFQUFNLEtBQUssQ0FBQyxJQUZaO0FBQUEsUUFHQSxTQUFBLEVBQVcsS0FBSyxDQUFDLFNBSGpCO0FBQUEsUUFJQSxJQUFBLEVBQU0sS0FBSyxDQUFDLElBSlo7T0FERixDQUFBO0FBQUEsb0JBT0EsSUFBQyxDQUFBLGlCQUFELENBQW1CLEdBQW5CLEVBQXdCLEtBQXhCLEVBUEEsQ0FERjtBQUFBO29CQWZXO0VBQUEsQ0FuSmIsQ0FBQTs7QUFBQSx5QkE2S0EsaUJBQUEsR0FBbUIsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO0FBQ2pCLFFBQUEsaUZBQUE7QUFBQSxJQUFBLDhDQUFxQixDQUFFLGVBQXZCO0FBQ0UsTUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBQ0E7QUFBQSxXQUFBLDRDQUFBO3VCQUFBO0FBQ0UsUUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFmLENBQXdCLEVBQXhCLENBQVosQ0FBQTtBQUNBLFFBQUEsSUFBOEIsaUJBQTlCO0FBQUEsVUFBQSxVQUFVLENBQUMsSUFBWCxDQUFnQixTQUFoQixDQUFBLENBQUE7U0FGRjtBQUFBLE9BREE7QUFPQSxNQUFBLElBQUcsVUFBVSxDQUFDLE1BQWQ7QUFDRSxRQUFBLFVBQUEsR0FBYSxJQUFDLENBQUEsR0FBRCxDQUFLLEdBQUwsQ0FBYixDQUFBO0FBQ0E7YUFBQSxtREFBQTtxQ0FBQTtBQUNFLHdCQUFBLFVBQVUsQ0FBQyxZQUFYLENBQXdCLFNBQXhCLEVBQUEsQ0FERjtBQUFBO3dCQUZGO09BQUEsTUFBQTtlQUtFLEdBQUcsQ0FBQyxJQUFKLENBQVMsaUVBQVQsRUFBNEUsS0FBNUUsRUFMRjtPQVJGO0tBQUEsTUFBQTthQWVFLElBQUMsQ0FBQSxHQUFELENBQUssR0FBTCxFQWZGO0tBRGlCO0VBQUEsQ0E3S25CLENBQUE7O0FBQUEseUJBZ01BLE9BQUEsR0FBUyxTQUFBLEdBQUE7V0FDUCxrQkFBa0IsQ0FBQyxPQUFuQixDQUEyQixJQUEzQixFQURPO0VBQUEsQ0FoTVQsQ0FBQTs7QUFBQSx5QkFvTUEsUUFBQSxHQUFVLFNBQUEsR0FBQTtXQUNSLGtCQUFrQixDQUFDLFFBQW5CLENBQTRCLElBQTVCLEVBRFE7RUFBQSxDQXBNVixDQUFBOztzQkFBQTs7SUFkRixDQUFBOzs7OztBQ0FBLElBQUEsbUJBQUE7O0FBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxrQ0FBUixDQUFYLENBQUE7O0FBQUEsU0FDQSxHQUFZLE9BQUEsQ0FBUSxtQ0FBUixDQURaLENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FFRTtBQUFBLEVBQUEsT0FBQSxFQUFTLFNBQUMsWUFBRCxHQUFBO0FBQ1AsUUFBQSxnQ0FBQTtBQUFBLElBQUEsSUFBQSxHQUFPLEVBQVAsQ0FBQTtBQUNBO0FBQUEsU0FBQSwyQ0FBQTs0QkFBQTtBQUNFLE1BQUEsSUFBRyxVQUFVLENBQUMsTUFBZDtBQUNFLFFBQUEsSUFBQSxJQUFRLElBQUMsQ0FBQSxpQkFBRCxDQUFtQjtBQUFBLFVBQUEsU0FBQSxFQUFXLFVBQVUsQ0FBQyxJQUF0QjtTQUFuQixDQUFSLENBREY7T0FBQSxNQUFBO0FBR0UsUUFBQSxJQUFBLElBQVEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0I7QUFBQSxVQUFBLEdBQUEsRUFBSyxVQUFVLENBQUMsR0FBaEI7U0FBaEIsQ0FBUixDQUhGO09BQUE7QUFBQSxNQUtBLElBQUEsSUFBUSxJQUxSLENBREY7QUFBQSxLQURBO1dBU0EsS0FWTztFQUFBLENBQVQ7QUFBQSxFQWFBLFFBQUEsRUFBVSxTQUFDLFlBQUQsR0FBQTtBQUNSLFFBQUEsZ0NBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxFQUFQLENBQUE7QUFDQTtBQUFBLFNBQUEsMkNBQUE7NEJBQUE7QUFDRSxNQUFBLElBQUcsVUFBVSxDQUFDLE1BQWQ7QUFDRSxRQUFBLElBQUEsSUFBUSxJQUFDLENBQUEsY0FBRCxDQUFnQjtBQUFBLFVBQUEsTUFBQSxFQUFRLFVBQVUsQ0FBQyxJQUFuQjtTQUFoQixDQUFSLENBREY7T0FBQSxNQUFBO0FBR0UsUUFBQSxJQUFBLElBQVEsSUFBQyxDQUFBLFlBQUQsQ0FBYztBQUFBLFVBQUEsR0FBQSxFQUFLLFVBQVUsQ0FBQyxHQUFoQjtTQUFkLENBQVIsQ0FIRjtPQUFBO0FBQUEsTUFLQSxJQUFBLElBQVEsSUFMUixDQURGO0FBQUEsS0FEQTtXQVNBLEtBVlE7RUFBQSxDQWJWO0FBQUEsRUEwQkEsY0FBQSxFQUFnQixTQUFDLElBQUQsR0FBQTtBQUNkLFFBQUEsR0FBQTtBQUFBLElBRGlCLE1BQUYsS0FBRSxHQUNqQixDQUFBO1dBQUMsZ0JBQUEsR0FBSixHQUFJLEdBQXNCLGVBRFQ7RUFBQSxDQTFCaEI7QUFBQSxFQThCQSxpQkFBQSxFQUFtQixTQUFDLElBQUQsR0FBQTtBQUNqQixRQUFBLFNBQUE7QUFBQSxJQURvQixZQUFGLEtBQUUsU0FDcEIsQ0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLFFBQVEsQ0FBQyxTQUFTLENBQUMsaUJBQW5CLENBQXFDLFNBQXJDLENBQVosQ0FBQTtXQUdKLFdBQUEsR0FDQyxTQURELEdBQ2dCLGFBTEs7RUFBQSxDQTlCbkI7QUFBQSxFQXVDQSxZQUFBLEVBQWMsU0FBQyxJQUFELEdBQUE7QUFDWixRQUFBLFNBQUE7QUFBQSxJQURlLFdBQUEsS0FBSyxZQUFBLElBQ3BCLENBQUE7O01BQUEsT0FBUTtLQUFSO0FBQ0EsSUFBQSxJQUFHLElBQUg7YUFDRyxvREFBQSxHQUFOLEdBQU0sR0FBMEQsTUFEN0Q7S0FBQSxNQUFBO2FBS0csb0RBQUEsR0FBTixHQUFNLEdBQTBELE1BTDdEO0tBRlk7RUFBQSxDQXZDZDtBQUFBLEVBaURBLGNBQUEsRUFBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxRQUFBLE1BQUE7QUFBQSxJQURpQixTQUFGLEtBQUUsTUFDakIsQ0FBQTtBQUFBLElBQUEsTUFBQSxHQUFTLFNBQVMsQ0FBQyxTQUFTLENBQUMsbUJBQXBCLENBQXdDLE1BQXhDLENBQVQsQ0FBQTtXQUdKLFVBQUEsR0FDQyxNQURELEdBQ2EsWUFMSztFQUFBLENBakRoQjtBQUFBLEVBMkRBLFlBQUEsRUFBYyxTQUFDLElBQUQsR0FBQTtXQUNYLE9BQUEsR0FBSixJQUFJLEdBQWMsT0FESDtFQUFBLENBM0RkO0NBTEYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGtCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQXVCO0FBY1IsRUFBQSxvQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLGVBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxZQUFBLE1BQU0sSUFBQyxDQUFBLGlCQUFBLFdBQVcsSUFBQyxDQUFBLFdBQUEsS0FBSyxJQUFDLENBQUEsWUFBQSxNQUFNLElBQUMsQ0FBQSxZQUFBLE1BQU0saUJBQUEsU0FDckQsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxHQUFELElBQVEsSUFBQyxDQUFBLElBQWhCLEVBQXNCLCtDQUF0QixDQUFBLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxDQUFBLENBQUssSUFBQyxDQUFBLEdBQUQsSUFBUSxJQUFDLENBQUEsSUFBVixDQUFYLEVBQTRCLHdEQUE1QixDQURBLENBQUE7QUFBQSxJQUVBLE1BQUEsQ0FBTyxJQUFDLENBQUEsSUFBUixFQUFjLDBDQUFkLENBRkEsQ0FBQTtBQUFBLElBR0EsTUFBQSxTQUFPLElBQUMsQ0FBQSxLQUFELEtBQVUsSUFBVixJQUFBLElBQUEsS0FBZ0IsS0FBdkIsRUFBZ0MsaUNBQUEsR0FBbkMsSUFBQyxDQUFBLElBQUUsQ0FIQSxDQUFBO0FBS0EsSUFBQSxJQUFrQixpQkFBbEI7QUFBQSxNQUFBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBVixDQUFBO0tBTEE7QUFBQSxJQU9BLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFQZCxDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsY0FBRCxHQUFrQixDQVJsQixDQUFBO0FBU0EsSUFBQSxJQUE0QixpQkFBNUI7QUFBQSxNQUFBLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxDQUFBLENBQUE7S0FWVztFQUFBLENBQWI7O0FBQUEsdUJBYUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLElBQUMsQ0FBQSxJQUFELEtBQVMsS0FETDtFQUFBLENBYk4sQ0FBQTs7QUFBQSx1QkFpQkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtXQUNMLElBQUMsQ0FBQSxJQUFELEtBQVMsTUFESjtFQUFBLENBakJQLENBQUE7O0FBQUEsdUJBc0JBLFlBQUEsR0FBYyxTQUFDLFNBQUQsR0FBQTtXQUNaLHNDQURZO0VBQUEsQ0F0QmQsQ0FBQTs7QUFBQSx1QkEwQkEsWUFBQSxHQUFjLFNBQUMsU0FBRCxHQUFBO0FBQ1osSUFBQSxJQUFHLENBQUEsSUFBSyxDQUFBLFlBQUQsQ0FBYyxTQUFkLENBQVA7QUFDRSxNQUFBLElBQUMsQ0FBQSxjQUFELElBQW1CLENBQW5CLENBQUE7YUFDQSxJQUFDLENBQUEsVUFBVyxDQUFBLFNBQVMsQ0FBQyxFQUFWLENBQVosR0FBNEIsS0FGOUI7S0FEWTtFQUFBLENBMUJkLENBQUE7O0FBQUEsdUJBbUNBLGVBQUEsR0FBaUIsU0FBQyxTQUFELEdBQUE7QUFDZixJQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxjQUFELElBQW1CLENBQW5CLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxVQUFXLENBQUEsU0FBUyxDQUFDLEVBQVYsQ0FBWixHQUE0QixNQUQ1QixDQURGO0tBQUE7V0FJQSxJQUFDLENBQUEsY0FBRCxLQUFtQixFQUxKO0VBQUEsQ0FuQ2pCLENBQUE7O0FBQUEsdUJBMkNBLFFBQUEsR0FBVSxTQUFDLGVBQUQsR0FBQTtBQUNSLElBQUEsSUFBZ0IsSUFBQyxDQUFBLElBQUQsS0FBUyxlQUFlLENBQUMsSUFBekM7QUFBQSxhQUFPLEtBQVAsQ0FBQTtLQUFBO0FBQ0EsSUFBQSxJQUFnQixJQUFDLENBQUEsU0FBRCxLQUFjLGVBQWUsQ0FBQyxTQUE5QztBQUFBLGFBQU8sS0FBUCxDQUFBO0tBREE7QUFHQSxJQUFBLElBQUcsZUFBZSxDQUFDLEdBQW5CO2FBQ0UsSUFBQyxDQUFBLEdBQUQsS0FBUSxlQUFlLENBQUMsSUFEMUI7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLElBQUQsS0FBUyxlQUFlLENBQUMsS0FIM0I7S0FKUTtFQUFBLENBM0NWLENBQUE7O0FBQUEsdUJBcURBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxRQUFBLHFDQUFBO0FBQUEsSUFBQSxHQUFBLEdBQU0sRUFBTixDQUFBO0FBRUE7QUFBQSxTQUFBLDJDQUFBO3FCQUFBO0FBQ0UsTUFBQSxJQUF3QixpQkFBeEI7QUFBQSxRQUFBLEdBQUksQ0FBQSxHQUFBLENBQUosR0FBVyxJQUFLLENBQUEsR0FBQSxDQUFoQixDQUFBO09BREY7QUFBQSxLQUZBO0FBS0EsU0FBQSw4QkFBQSxHQUFBOztRQUNFLEdBQUcsQ0FBQyxlQUFnQjtPQUFwQjtBQUFBLE1BQ0EsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFqQixDQUFzQixXQUF0QixDQURBLENBREY7QUFBQSxLQUxBO1dBU0EsSUFWUztFQUFBLENBckRYLENBQUE7O29CQUFBOztJQWhCRixDQUFBOzs7OztBQ0FBLElBQUEsMkNBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBRk4sQ0FBQTs7QUFBQSxTQUdBLEdBQVksT0FBQSxDQUFRLHNCQUFSLENBSFosQ0FBQTs7QUFBQSxNQUlBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBSlQsQ0FBQTs7QUFBQSxNQU1NLENBQUMsT0FBUCxHQUF1QjtBQU9SLEVBQUEsa0JBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSwyQkFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHFCQUFBLGVBQWUsSUFBQyxDQUFBLDBCQUFBLG9CQUFvQixnQkFBQSxVQUFVLHlCQUFBLGlCQUM3RCxDQUFBO0FBQUEsSUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLGFBQVIsRUFBdUIsNEJBQXZCLENBQUEsQ0FBQTtBQUFBLElBQ0EsTUFBQSxDQUFPLElBQUMsQ0FBQSxrQkFBUixFQUE0QixrQ0FBNUIsQ0FEQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsQ0FBRSxJQUFDLENBQUEsa0JBQWtCLENBQUMsVUFBdEIsQ0FIVCxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsWUFBRCxHQUFnQixRQUpoQixDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsY0FBRCxHQUFrQixFQUxsQixDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsRUFQeEIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLGlCQUFsQixDQVJBLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxjQUFELEdBQXNCLElBQUEsU0FBQSxDQUFBLENBVHRCLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBVkEsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxLQUFoQixDQUFBLENBWEEsQ0FEVztFQUFBLENBQWI7O0FBQUEscUJBZ0JBLGdCQUFBLEdBQWtCLFNBQUMsV0FBRCxHQUFBO0FBQ2hCLFFBQUEsZ0NBQUE7QUFBQSxJQUFBLElBQWMsbUJBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUNBLElBQUEsSUFBRyxDQUFDLENBQUMsT0FBRixDQUFVLFdBQVYsQ0FBSDtBQUNFO1dBQUEsa0RBQUE7aUNBQUE7QUFDRSxzQkFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsRUFBQSxDQURGO0FBQUE7c0JBREY7S0FBQSxNQUFBO0FBSUUsTUFBQSxJQUFDLENBQUEsb0JBQXFCLENBQUEsV0FBQSxDQUF0QixHQUFxQyxJQUFyQyxDQUFBO0FBQUEsTUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQWUsQ0FBQSxXQUFBLENBRHZCLENBQUE7QUFFQSxNQUFBLElBQUcsY0FBQSxJQUFVLElBQUksQ0FBQyxlQUFsQjtlQUNFLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUksQ0FBQyxLQUF0QixFQURGO09BTkY7S0FGZ0I7RUFBQSxDQWhCbEIsQ0FBQTs7QUFBQSxxQkE0QkEsT0FBQSxHQUFTLFNBQUEsR0FBQTtBQUNQLFFBQUEsdUJBQUE7QUFBQSxJQUFBLDhDQUFnQixDQUFFLGdCQUFmLElBQXlCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBMUM7QUFDRSxNQUFBLFFBQUEsR0FBWSxHQUFBLEdBQWpCLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTixDQUFBO0FBQUEsTUFDQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLFFBQW5CLENBQTRCLENBQUMsR0FBN0IsQ0FBa0MsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLENBQXFCLFFBQXJCLENBQWxDLENBRFYsQ0FBQTtBQUVBLE1BQUEsSUFBRyxPQUFPLENBQUMsTUFBWDtBQUNFLFFBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsS0FBYixDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLFlBQWxCLENBREEsQ0FBQTtBQUFBLFFBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxPQUZULENBREY7T0FIRjtLQUFBO1dBVUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksZUFBWixFQUE2QixJQUFDLENBQUEsYUFBOUIsRUFYTztFQUFBLENBNUJULENBQUE7O0FBQUEscUJBMENBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtBQUNuQixJQUFBLElBQUMsQ0FBQSxjQUFjLENBQUMsU0FBaEIsQ0FBQSxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsS0FBcEIsQ0FBMEIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUN4QixRQUFBLEtBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsUUFDQSxLQUFDLENBQUEsTUFBRCxDQUFBLENBREEsQ0FBQTtBQUFBLFFBRUEsS0FBQyxDQUFBLDJCQUFELENBQUEsQ0FGQSxDQUFBO2VBR0EsS0FBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLEVBSndCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUIsRUFGbUI7RUFBQSxDQTFDckIsQ0FBQTs7QUFBQSxxQkFtREEsS0FBQSxHQUFPLFNBQUMsUUFBRCxHQUFBO1dBQ0wsSUFBQyxDQUFBLGNBQWMsQ0FBQyxXQUFoQixDQUE0QixRQUE1QixFQURLO0VBQUEsQ0FuRFAsQ0FBQTs7QUFBQSxxQkF1REEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBaEIsQ0FBQSxFQURPO0VBQUEsQ0F2RFQsQ0FBQTs7QUFBQSxxQkEyREEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBUCxFQUFtQiw4Q0FBbkIsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQUEsRUFGSTtFQUFBLENBM0ROLENBQUE7O0FBQUEscUJBbUVBLDJCQUFBLEdBQTZCLFNBQUEsR0FBQTtBQUMzQixJQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsY0FBYyxDQUFDLEdBQTlCLENBQW1DLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLGNBQVQsRUFBeUIsSUFBekIsQ0FBbkMsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEdBQWhDLENBQXFDLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLGdCQUFULEVBQTJCLElBQTNCLENBQXJDLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxjQUFjLENBQUMsR0FBOUIsQ0FBbUMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsY0FBVCxFQUF5QixJQUF6QixDQUFuQyxDQUZBLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxhQUFhLENBQUMsdUJBQXVCLENBQUMsR0FBdkMsQ0FBNEMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsdUJBQVQsRUFBa0MsSUFBbEMsQ0FBNUMsQ0FIQSxDQUFBO1dBSUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFwQyxDQUF5QyxDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxvQkFBVCxFQUErQixJQUEvQixDQUF6QyxFQUwyQjtFQUFBLENBbkU3QixDQUFBOztBQUFBLHFCQTJFQSxjQUFBLEdBQWdCLFNBQUMsS0FBRCxHQUFBO1dBQ2QsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsRUFEYztFQUFBLENBM0VoQixDQUFBOztBQUFBLHFCQStFQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixJQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxxQ0FBRCxDQUF1QyxLQUF2QyxFQUZnQjtFQUFBLENBL0VsQixDQUFBOztBQUFBLHFCQW9GQSxjQUFBLEdBQWdCLFNBQUMsS0FBRCxHQUFBO0FBQ2QsSUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixLQUFqQixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixLQUFqQixFQUZjO0VBQUEsQ0FwRmhCLENBQUE7O0FBQUEscUJBeUZBLHVCQUFBLEdBQXlCLFNBQUMsS0FBRCxHQUFBO1dBQ3ZCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLGFBQWxDLENBQUEsRUFEdUI7RUFBQSxDQXpGekIsQ0FBQTs7QUFBQSxxQkE2RkEsb0JBQUEsR0FBc0IsU0FBQyxLQUFELEdBQUE7V0FDcEIsSUFBQyxDQUFBLHlCQUFELENBQTJCLEtBQTNCLENBQWlDLENBQUMsVUFBbEMsQ0FBQSxFQURvQjtFQUFBLENBN0Z0QixDQUFBOztBQUFBLHFCQW9HQSxvQkFBQSxHQUFzQixTQUFDLFdBQUQsR0FBQTtXQUNwQixJQUFDLENBQUEsY0FBZSxDQUFBLFdBQUEsRUFESTtFQUFBLENBcEd0QixDQUFBOztBQUFBLHFCQXdHQSx5QkFBQSxHQUEyQixTQUFDLEtBQUQsR0FBQTtBQUN6QixRQUFBLFlBQUE7b0JBQUEsSUFBQyxDQUFBLHdCQUFlLEtBQUssQ0FBQyx1QkFBUSxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFDLENBQUEsa0JBQWtCLENBQUMsVUFBckMsR0FETDtFQUFBLENBeEczQixDQUFBOztBQUFBLHFCQTRHQSxxQ0FBQSxHQUF1QyxTQUFDLEtBQUQsR0FBQTtXQUNyQyxNQUFBLENBQUEsSUFBUSxDQUFBLGNBQWUsQ0FBQSxLQUFLLENBQUMsRUFBTixFQURjO0VBQUEsQ0E1R3ZDLENBQUE7O0FBQUEscUJBZ0hBLE1BQUEsR0FBUSxTQUFBLEdBQUE7V0FDTixJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBb0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsS0FBRCxHQUFBO2VBQ2xCLEtBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBRGtCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsRUFETTtFQUFBLENBaEhSLENBQUE7O0FBQUEscUJBcUhBLEtBQUEsR0FBTyxTQUFBLEdBQUE7QUFDTCxJQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsSUFBZixDQUFvQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxLQUFELEdBQUE7ZUFDbEIsS0FBQyxDQUFBLHlCQUFELENBQTJCLEtBQTNCLENBQWlDLENBQUMsZ0JBQWxDLENBQW1ELEtBQW5ELEVBRGtCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsQ0FBQSxDQUFBO1dBR0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUEsRUFKSztFQUFBLENBckhQLENBQUE7O0FBQUEscUJBNEhBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixJQUFBLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUZNO0VBQUEsQ0E1SFIsQ0FBQTs7QUFBQSxxQkFpSUEsZUFBQSxHQUFpQixTQUFDLEtBQUQsR0FBQTtBQUNmLFFBQUEsYUFBQTtBQUFBLElBQUEsSUFBVSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsQ0FBQSxJQUErQixJQUFDLENBQUEsb0JBQXFCLENBQUEsS0FBSyxDQUFDLEVBQU4sQ0FBdEIsS0FBbUMsSUFBNUU7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBSyxDQUFDLFFBQTNCLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSx3QkFBRCxDQUEwQixLQUFLLENBQUMsUUFBaEMsRUFBMEMsS0FBMUMsQ0FBQSxDQURGO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFLLENBQUMsSUFBM0IsQ0FBSDtBQUNILE1BQUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLEtBQUssQ0FBQyxJQUFoQyxFQUFzQyxLQUF0QyxDQUFBLENBREc7S0FBQSxNQUVBLElBQUcsS0FBSyxDQUFDLGVBQVQ7QUFDSCxNQUFBLElBQUMsQ0FBQSxnQ0FBRCxDQUFrQyxLQUFsQyxDQUFBLENBREc7S0FBQSxNQUFBO0FBR0gsTUFBQSxHQUFHLENBQUMsS0FBSixDQUFVLDhDQUFWLENBQUEsQ0FIRztLQU5MO0FBQUEsSUFXQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQVhoQixDQUFBO0FBQUEsSUFZQSxhQUFhLENBQUMsZ0JBQWQsQ0FBK0IsSUFBL0IsQ0FaQSxDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsd0JBQXBCLENBQTZDLGFBQTdDLENBYkEsQ0FBQTtXQWNBLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QixFQWZlO0VBQUEsQ0FqSWpCLENBQUE7O0FBQUEscUJBbUpBLG1CQUFBLEdBQXFCLFNBQUMsS0FBRCxHQUFBO1dBQ25CLEtBQUEsSUFBUyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsS0FBM0IsQ0FBaUMsQ0FBQyxnQkFEeEI7RUFBQSxDQW5KckIsQ0FBQTs7QUFBQSxxQkF1SkEscUJBQUEsR0FBdUIsU0FBQyxLQUFELEdBQUE7V0FDckIsS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxVQUFELEdBQUE7QUFDYixRQUFBLElBQUcsQ0FBQSxLQUFLLENBQUEsbUJBQUQsQ0FBcUIsVUFBckIsQ0FBUDtpQkFDRSxLQUFDLENBQUEsZUFBRCxDQUFpQixVQUFqQixFQURGO1NBRGE7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmLEVBRHFCO0VBQUEsQ0F2SnZCLENBQUE7O0FBQUEscUJBNkpBLHdCQUFBLEdBQTBCLFNBQUMsT0FBRCxFQUFVLEtBQVYsR0FBQTtBQUN4QixRQUFBLE1BQUE7QUFBQSxJQUFBLE1BQUEsR0FBWSxPQUFBLEtBQVcsS0FBSyxDQUFDLFFBQXBCLEdBQWtDLE9BQWxDLEdBQStDLFFBQXhELENBQUE7V0FDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsT0FBbkIsQ0FBNEIsQ0FBQSxNQUFBLENBQTVCLENBQW9DLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixLQUFuQixDQUFwQyxFQUZ3QjtFQUFBLENBN0oxQixDQUFBOztBQUFBLHFCQWtLQSxnQ0FBQSxHQUFrQyxTQUFDLEtBQUQsR0FBQTtXQUNoQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBeUIsQ0FBQyxRQUExQixDQUFtQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBSyxDQUFDLGVBQXpCLENBQW5DLEVBRGdDO0VBQUEsQ0FsS2xDLENBQUE7O0FBQUEscUJBc0tBLGlCQUFBLEdBQW1CLFNBQUMsS0FBRCxHQUFBO1dBQ2pCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLE1BRGpCO0VBQUEsQ0F0S25CLENBQUE7O0FBQUEscUJBMEtBLGlCQUFBLEdBQW1CLFNBQUMsU0FBRCxHQUFBO0FBQ2pCLFFBQUEsVUFBQTtBQUFBLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBYjthQUNFLElBQUMsQ0FBQSxNQURIO0tBQUEsTUFBQTtBQUdFLE1BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixTQUFTLENBQUMsZUFBckMsQ0FBYixDQUFBO2FBQ0EsQ0FBQSxDQUFFLFVBQVUsQ0FBQyxtQkFBWCxDQUErQixTQUFTLENBQUMsSUFBekMsQ0FBRixFQUpGO0tBRGlCO0VBQUEsQ0ExS25CLENBQUE7O0FBQUEscUJBa0xBLGVBQUEsR0FBaUIsU0FBQyxLQUFELEdBQUE7QUFDZixJQUFBLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLGdCQUFsQyxDQUFtRCxLQUFuRCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBeUIsQ0FBQyxNQUExQixDQUFBLEVBRmU7RUFBQSxDQWxMakIsQ0FBQTs7a0JBQUE7O0lBYkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLHFDQUFBOztBQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUixDQUFYLENBQUE7O0FBQUEsSUFDQSxHQUFPLE9BQUEsQ0FBUSw2QkFBUixDQURQLENBQUE7O0FBQUEsZUFFQSxHQUFrQixPQUFBLENBQVEseUNBQVIsQ0FGbEIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsY0FBRSxTQUFGLEVBQWMsTUFBZCxHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsWUFBQSxTQUNiLENBQUE7QUFBQSxJQUR3QixJQUFDLENBQUEsU0FBQSxNQUN6QixDQUFBOztNQUFBLElBQUMsQ0FBQSxTQUFVLE1BQU0sQ0FBQyxRQUFRLENBQUM7S0FBM0I7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLEtBRGpCLENBRFc7RUFBQSxDQUFiOztBQUFBLGlCQWNBLE1BQUEsR0FBUSxTQUFDLE9BQUQsR0FBQTtXQUNOLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLE1BQWYsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxNQUFELEVBQVMsVUFBVCxHQUFBO0FBQzFCLFFBQUEsS0FBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7QUFBQSxRQUNBLEtBQUMsQ0FBQSxRQUFELEdBQVksS0FBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLE9BQTlCLENBRFosQ0FBQTtlQUVBO0FBQUEsVUFBQSxNQUFBLEVBQVEsTUFBUjtBQUFBLFVBQ0EsUUFBQSxFQUFVLEtBQUMsQ0FBQSxRQURYO1VBSDBCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUIsRUFETTtFQUFBLENBZFIsQ0FBQTs7QUFBQSxpQkFzQkEsWUFBQSxHQUFjLFNBQUMsTUFBRCxHQUFBO0FBQ1osUUFBQSxnQkFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLENBQUMsQ0FBQyxRQUFGLENBQUEsQ0FBWCxDQUFBO0FBQUEsSUFFQSxNQUFBLEdBQVMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxhQUFyQixDQUFtQyxRQUFuQyxDQUZULENBQUE7QUFBQSxJQUdBLE1BQU0sQ0FBQyxHQUFQLEdBQWEsYUFIYixDQUFBO0FBQUEsSUFJQSxNQUFNLENBQUMsWUFBUCxDQUFvQixhQUFwQixFQUFtQyxHQUFuQyxDQUpBLENBQUE7QUFBQSxJQUtBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLFNBQUEsR0FBQTthQUFHLFFBQVEsQ0FBQyxPQUFULENBQWlCLE1BQWpCLEVBQUg7SUFBQSxDQUxoQixDQUFBO0FBQUEsSUFPQSxNQUFNLENBQUMsV0FBUCxDQUFtQixNQUFuQixDQVBBLENBQUE7V0FRQSxRQUFRLENBQUMsT0FBVCxDQUFBLEVBVFk7RUFBQSxDQXRCZCxDQUFBOztBQUFBLGlCQWtDQSxvQkFBQSxHQUFzQixTQUFDLE1BQUQsRUFBUyxPQUFULEdBQUE7V0FDcEIsSUFBQyxDQUFBLGNBQUQsQ0FDRTtBQUFBLE1BQUEsVUFBQSxFQUFZLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBbkM7QUFBQSxNQUNBLE9BQUEsRUFBUyxPQURUO0tBREYsRUFEb0I7RUFBQSxDQWxDdEIsQ0FBQTs7QUFBQSxpQkF3Q0EsY0FBQSxHQUFnQixTQUFDLElBQUQsR0FBQTtBQUNkLFFBQUEsaUNBQUE7QUFBQSwwQkFEZSxPQUF3QixJQUF0QixrQkFBQSxZQUFZLGVBQUEsT0FDN0IsQ0FBQTtBQUFBLElBQUEsTUFBQSxHQUNFO0FBQUEsTUFBQSxVQUFBLEVBQVksVUFBQSxJQUFjLElBQUMsQ0FBQSxNQUEzQjtBQUFBLE1BQ0Esb0JBQUEsRUFBc0IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxZQURqQztBQUFBLE1BRUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFGbkI7S0FERixDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWixFQUFvQixPQUFwQixDQUxSLENBQUE7V0FPSSxJQUFBLFFBQUEsQ0FDRjtBQUFBLE1BQUEsa0JBQUEsRUFBb0IsSUFBQyxDQUFBLElBQXJCO0FBQUEsTUFDQSxhQUFBLEVBQWUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxhQUQxQjtBQUFBLE1BRUEsUUFBQSxFQUFVLE9BQU8sQ0FBQyxRQUZsQjtLQURFLEVBUlU7RUFBQSxDQXhDaEIsQ0FBQTs7QUFBQSxpQkFzREEsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLElBQVQsR0FBQTtBQUNWLFFBQUEsMENBQUE7QUFBQSwwQkFEbUIsT0FBeUMsSUFBdkMsbUJBQUEsYUFBYSxnQkFBQSxVQUFVLHFCQUFBLGFBQzVDLENBQUE7O01BQUEsU0FBVTtLQUFWO0FBQUEsSUFDQSxNQUFNLENBQUMsYUFBUCxHQUF1QixhQUR2QixDQUFBO0FBRUEsSUFBQSxJQUFHLG1CQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFqQixDQUFBO2FBQ0ksSUFBQSxlQUFBLENBQWdCLE1BQWhCLEVBRk47S0FBQSxNQUFBO2FBSU0sSUFBQSxJQUFBLENBQUssTUFBTCxFQUpOO0tBSFU7RUFBQSxDQXREWixDQUFBOztjQUFBOztJQU5GLENBQUE7Ozs7O0FDQUEsSUFBQSx5Q0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLFFBQ0EsR0FBVyxPQUFBLENBQVEsYUFBUixDQURYLENBQUE7O0FBQUEsU0FFQSxHQUFZLE9BQUEsQ0FBUSxjQUFSLENBRlosQ0FBQTs7QUFBQSxTQUdBLEdBQVksT0FBQSxDQUFRLHNCQUFSLENBSFosQ0FBQTs7QUFBQSxNQUtNLENBQUMsT0FBUCxHQUF1QjtBQUlSLEVBQUEsZ0JBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxPQUFBO0FBQUEsSUFEYyxJQUFDLENBQUEsY0FBQSxRQUFRLGVBQUEsT0FDdkIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxPQUFBLElBQVcsS0FBekIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxTQUFBLENBQVUsSUFBQyxDQUFBLE1BQVgsQ0FGakIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxRQUFBLENBQVMsSUFBQyxDQUFBLE1BQVYsQ0FIaEIsQ0FEVztFQUFBLENBQWI7O0FBQUEsbUJBT0EsZ0JBQUEsR0FBa0IsU0FBQyxZQUFELEVBQWUsUUFBZixHQUFBO0FBQ2hCLFFBQUEsZ0RBQUE7QUFBQSxJQUFBLFNBQUEsR0FBZ0IsSUFBQSxTQUFBLENBQUEsQ0FBaEIsQ0FBQTtBQUFBLElBQ0EsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsUUFBdEIsQ0FEQSxDQUFBO0FBRUE7QUFBQSxTQUFBLDJDQUFBO3FCQUFBO0FBQ0UsTUFBQSxJQUFDLENBQUEsTUFBRCxDQUFRLEdBQVIsRUFBYSxTQUFTLENBQUMsSUFBVixDQUFBLENBQWIsQ0FBQSxDQURGO0FBQUEsS0FGQTtBQUtBO0FBQUEsU0FBQSw4Q0FBQTtzQkFBQTtBQUNFLE1BQUEsSUFBQyxDQUFBLE9BQUQsQ0FBUyxHQUFULEVBQWMsU0FBUyxDQUFDLElBQVYsQ0FBQSxDQUFkLENBQUEsQ0FERjtBQUFBLEtBTEE7V0FRQSxTQUFTLENBQUMsS0FBVixDQUFBLEVBVGdCO0VBQUEsQ0FQbEIsQ0FBQTs7QUFBQSxtQkFtQkEsY0FBQSxHQUFnQixTQUFDLFVBQUQsRUFBYSxRQUFiLEdBQUE7QUFDZCxJQUFBLElBQUcsVUFBVSxDQUFDLElBQVgsQ0FBQSxDQUFIO2FBQ0UsSUFBQyxDQUFBLE1BQUQsQ0FBUSxVQUFSLEVBQW9CLFFBQXBCLEVBREY7S0FBQSxNQUVLLElBQUcsVUFBVSxDQUFDLEtBQVgsQ0FBQSxDQUFIO2FBQ0gsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULEVBQXFCLFFBQXJCLEVBREc7S0FIUztFQUFBLENBbkJoQixDQUFBOztBQUFBLG1CQTBCQSxNQUFBLEdBQVEsU0FBQyxVQUFELEVBQWEsUUFBYixHQUFBO0FBQ04sSUFBQSxJQUFzQixJQUFDLENBQUEsVUFBdkI7QUFBQSxhQUFPLFFBQUEsQ0FBQSxDQUFQLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBRyxVQUFVLENBQUMsTUFBZDthQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsZ0JBQVYsQ0FBMkIsVUFBVSxDQUFDLElBQXRDLEVBQTRDLFFBQTVDLEVBREY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxhQUFWLENBQXdCLFVBQVUsQ0FBQyxHQUFuQyxFQUF3QyxRQUF4QyxFQUhGO0tBSE07RUFBQSxDQTFCUixDQUFBOztBQUFBLG1CQW1DQSxPQUFBLEdBQVMsU0FBQyxVQUFELEVBQWEsUUFBYixHQUFBO0FBQ1AsSUFBQSxJQUFzQixJQUFDLENBQUEsVUFBdkI7QUFBQSxhQUFPLFFBQUEsQ0FBQSxDQUFQLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBRyxVQUFVLENBQUMsTUFBZDthQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsZ0JBQVgsQ0FBNEIsVUFBVSxDQUFDLElBQXZDLEVBQTZDLFFBQTdDLEVBREY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxhQUFYLENBQXlCLFVBQVUsQ0FBQyxHQUFwQyxFQUF5QyxRQUF6QyxFQUhGO0tBSE87RUFBQSxDQW5DVCxDQUFBOztnQkFBQTs7SUFURixDQUFBOzs7OztBQ0FBLElBQUEsWUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxtQkFBRSxNQUFGLEdBQUE7QUFDWCxJQURZLElBQUMsQ0FBQSxTQUFBLE1BQ2IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixFQUR0QixDQURXO0VBQUEsQ0FBYjs7QUFBQSxzQkFLQSxhQUFBLEdBQWUsU0FBQyxHQUFELEVBQU0sUUFBTixHQUFBO0FBQ2IsUUFBQSxJQUFBOztNQURtQixXQUFXLFNBQUEsR0FBQTtLQUM5QjtBQUFBLElBQUEsSUFBcUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiLENBQXJCO0FBQUEsYUFBTyxRQUFBLENBQUEsQ0FBUCxDQUFBO0tBQUE7QUFBQSxJQUVBLElBQUEsR0FBTyxDQUFBLENBQUUsMkNBQUYsQ0FBK0MsQ0FBQSxDQUFBLENBRnRELENBQUE7QUFBQSxJQUdBLElBQUksQ0FBQyxNQUFMLEdBQWMsUUFIZCxDQUFBO0FBQUEsSUFRQSxJQUFJLENBQUMsT0FBTCxHQUFlLFNBQUEsR0FBQTtBQUNiLE1BQUEsT0FBTyxDQUFDLElBQVIsQ0FBYyxrQ0FBQSxHQUFuQixHQUFLLENBQUEsQ0FBQTthQUNBLFFBQUEsQ0FBQSxFQUZhO0lBQUEsQ0FSZixDQUFBO0FBQUEsSUFZQSxJQUFJLENBQUMsSUFBTCxHQUFZLEdBWlosQ0FBQTtBQUFBLElBYUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQXRCLENBQWtDLElBQWxDLENBYkEsQ0FBQTtXQWNBLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixHQUFqQixFQWZhO0VBQUEsQ0FMZixDQUFBOztBQUFBLHNCQXVCQSxXQUFBLEdBQWEsU0FBQyxHQUFELEdBQUE7V0FDWCxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBb0IsR0FBcEIsQ0FBQSxJQUE0QixFQURqQjtFQUFBLENBdkJiLENBQUE7O0FBQUEsc0JBOEJBLGdCQUFBLEdBQWtCLFNBQUMsWUFBRCxFQUFlLFFBQWYsR0FBQTtBQUNoQixRQUFBLFdBQUE7O01BRCtCLFdBQVcsU0FBQSxHQUFBO0tBQzFDO0FBQUEsSUFBQSxZQUFBLEdBQWUsSUFBQyxDQUFBLG1CQUFELENBQXFCLFlBQXJCLENBQWYsQ0FBQTtBQUNBLElBQUEsSUFBcUIsSUFBQyxDQUFBLHFCQUFELENBQXVCLFlBQXZCLENBQXJCO0FBQUEsYUFBTyxRQUFBLENBQUEsQ0FBUCxDQUFBO0tBREE7QUFBQSxJQUlBLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBSmQsQ0FBQTtBQUFBLElBS0EsTUFBQSxHQUFTLEdBQUcsQ0FBQyxhQUFKLENBQWtCLE9BQWxCLENBTFQsQ0FBQTtBQUFBLElBTUEsTUFBTSxDQUFDLFNBQVAsR0FBbUIsWUFObkIsQ0FBQTtBQUFBLElBT0EsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFULENBQXFCLE1BQXJCLENBUEEsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLFlBQXpCLENBUkEsQ0FBQTtXQVVBLFFBQUEsQ0FBQSxFQVhnQjtFQUFBLENBOUJsQixDQUFBOztBQUFBLHNCQTRDQSxtQkFBQSxHQUFxQixTQUFDLFlBQUQsR0FBQTtXQUVuQixZQUFZLENBQUMsT0FBYixDQUFxQiwwQkFBckIsRUFBaUQsRUFBakQsRUFGbUI7RUFBQSxDQTVDckIsQ0FBQTs7QUFBQSxzQkFpREEscUJBQUEsR0FBdUIsU0FBQyxZQUFELEdBQUE7V0FDckIsSUFBQyxDQUFBLGtCQUFrQixDQUFDLE9BQXBCLENBQTRCLFlBQTVCLENBQUEsSUFBNkMsRUFEeEI7RUFBQSxDQWpEdkIsQ0FBQTs7bUJBQUE7O0lBSkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGdEQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FBVCxDQUFBOztBQUFBLEdBQ0EsR0FBTSxNQUFNLENBQUMsR0FEYixDQUFBOztBQUFBLFFBRUEsR0FBVyxPQUFBLENBQVEsMEJBQVIsQ0FGWCxDQUFBOztBQUFBLGFBR0EsR0FBZ0IsT0FBQSxDQUFRLCtCQUFSLENBSGhCLENBQUE7O0FBQUEsTUFLTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLG9CQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FBUyxJQUFULENBRGhCLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxrQkFBRCxHQUNFO0FBQUEsTUFBQSxVQUFBLEVBQVksU0FBQSxHQUFBLENBQVo7QUFBQSxNQUNBLFdBQUEsRUFBYSxTQUFBLEdBQUEsQ0FEYjtLQUxGLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxtQkFBRCxHQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sU0FBQSxHQUFBLENBQU47S0FSRixDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsU0FBQSxHQUFBLENBVHRCLENBRFc7RUFBQSxDQUFiOztBQUFBLHVCQWFBLFNBQUEsR0FBVyxTQUFDLElBQUQsR0FBQTtBQUNULFFBQUEsMkRBQUE7QUFBQSxJQURZLHNCQUFBLGdCQUFnQixxQkFBQSxlQUFlLGFBQUEsT0FBTyxjQUFBLE1BQ2xELENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxDQUFjLGNBQUEsSUFBa0IsYUFBaEMsQ0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQ0EsSUFBQSxJQUF3QyxhQUF4QztBQUFBLE1BQUEsY0FBQSxHQUFpQixhQUFhLENBQUMsS0FBL0IsQ0FBQTtLQURBO0FBQUEsSUFHQSxhQUFBLEdBQW9CLElBQUEsYUFBQSxDQUNsQjtBQUFBLE1BQUEsY0FBQSxFQUFnQixjQUFoQjtBQUFBLE1BQ0EsYUFBQSxFQUFlLGFBRGY7S0FEa0IsQ0FIcEIsQ0FBQTs7TUFPQSxTQUNFO0FBQUEsUUFBQSxTQUFBLEVBQ0U7QUFBQSxVQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsVUFDQSxLQUFBLEVBQU8sR0FEUDtBQUFBLFVBRUEsU0FBQSxFQUFXLENBRlg7U0FERjs7S0FSRjtXQWFBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLGFBQWYsRUFBOEIsS0FBOUIsRUFBcUMsTUFBckMsRUFkUztFQUFBLENBYlgsQ0FBQTs7QUFBQSx1QkE4QkEsU0FBQSxHQUFXLFNBQUEsR0FBQTtBQUNULElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQURwQixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhLENBQUEsQ0FBRSxJQUFDLENBQUEsUUFBSCxDQUZiLENBQUE7V0FHQSxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsQ0FBRSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVosRUFKQTtFQUFBLENBOUJYLENBQUE7O29CQUFBOztJQVBGLENBQUE7Ozs7O0FDQUEsSUFBQSxzRkFBQTtFQUFBO2lTQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FBVCxDQUFBOztBQUFBLElBQ0EsR0FBTyxPQUFBLENBQVEsUUFBUixDQURQLENBQUE7O0FBQUEsR0FFQSxHQUFNLE9BQUEsQ0FBUSxvQkFBUixDQUZOLENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxzQkFBUixDQUhSLENBQUE7O0FBQUEsa0JBSUEsR0FBcUIsT0FBQSxDQUFRLG9DQUFSLENBSnJCLENBQUE7O0FBQUEsUUFLQSxHQUFXLE9BQUEsQ0FBUSwwQkFBUixDQUxYLENBQUE7O0FBQUEsYUFNQSxHQUFnQixPQUFBLENBQVEsK0JBQVIsQ0FOaEIsQ0FBQTs7QUFBQSxNQVVNLENBQUMsT0FBUCxHQUF1QjtBQUVyQixNQUFBLGlCQUFBOztBQUFBLG9DQUFBLENBQUE7O0FBQUEsRUFBQSxpQkFBQSxHQUFvQixDQUFwQixDQUFBOztBQUFBLDRCQUVBLFVBQUEsR0FBWSxLQUZaLENBQUE7O0FBS2EsRUFBQSx5QkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLDRCQUFBO0FBQUEsMEJBRFksT0FBMkIsSUFBekIsa0JBQUEsWUFBWSxrQkFBQSxVQUMxQixDQUFBO0FBQUEsSUFBQSxrREFBQSxTQUFBLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUEsQ0FBQSxDQUZiLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxrQkFBRCxHQUEwQixJQUFBLGtCQUFBLENBQW1CLElBQW5CLENBSDFCLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQU5kLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFDLENBQUMsU0FBRixDQUFBLENBUHBCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxzQkFBRCxHQUEwQixDQUFDLENBQUMsU0FBRixDQUFBLENBUjFCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixDQUFDLENBQUMsU0FBRixDQUFBLENBVHZCLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FWaEIsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBdEIsQ0FBMkIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEscUJBQVQsRUFBZ0MsSUFBaEMsQ0FBM0IsQ0FYQSxDQUFBO0FBQUEsSUFZQSxJQUFDLENBQUEsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFyQixDQUEwQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxxQkFBVCxFQUFnQyxJQUFoQyxDQUExQixDQVpBLENBQUE7QUFBQSxJQWFBLElBQUMsQ0FBQSwwQkFBRCxDQUFBLENBYkEsQ0FBQTtBQUFBLElBY0EsSUFBQyxDQUFBLFNBQ0MsQ0FBQyxFQURILENBQ00sc0JBRE4sRUFDOEIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsU0FBVCxFQUFvQixJQUFwQixDQUQ5QixDQUVFLENBQUMsRUFGSCxDQUVNLHVCQUZOLEVBRStCLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLFNBQVQsRUFBb0IsSUFBcEIsQ0FGL0IsQ0FHRSxDQUFDLEVBSEgsQ0FHTSxXQUhOLEVBR21CLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLGdCQUFULEVBQTJCLElBQTNCLENBSG5CLENBZEEsQ0FEVztFQUFBLENBTGI7O0FBQUEsNEJBMEJBLDBCQUFBLEdBQTRCLFNBQUEsR0FBQTtBQUMxQixJQUFBLElBQUcsTUFBTSxDQUFDLGlCQUFWO2FBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBbEIsQ0FBZ0MsTUFBTSxDQUFDLGlCQUF2QyxFQUEwRCxJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQUEsQ0FBMUQsRUFERjtLQUQwQjtFQUFBLENBMUI1QixDQUFBOztBQUFBLDRCQWdDQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUEsQ0FBQSxDQUFBO1dBQ0EsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQUZnQjtFQUFBLENBaENsQixDQUFBOztBQUFBLDRCQXFDQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLElBQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsYUFBZixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxrQkFBZixFQUZlO0VBQUEsQ0FyQ2pCLENBQUE7O0FBQUEsNEJBMENBLFNBQUEsR0FBVyxTQUFDLEtBQUQsR0FBQTtBQUNULFFBQUEsd0JBQUE7QUFBQSxJQUFBLElBQVUsS0FBSyxDQUFDLEtBQU4sS0FBZSxpQkFBZixJQUFvQyxLQUFLLENBQUMsSUFBTixLQUFjLFdBQTVEO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUdBLFNBQUEsR0FBWSxDQUFBLENBQUUsS0FBSyxDQUFDLE1BQVIsQ0FBZSxDQUFDLE9BQWhCLENBQXdCLE1BQU0sQ0FBQyxpQkFBL0IsQ0FBaUQsQ0FBQyxNQUg5RCxDQUFBO0FBSUEsSUFBQSxJQUFVLFNBQVY7QUFBQSxZQUFBLENBQUE7S0FKQTtBQUFBLElBT0EsYUFBQSxHQUFnQixHQUFHLENBQUMsaUJBQUosQ0FBc0IsS0FBSyxDQUFDLE1BQTVCLENBUGhCLENBQUE7QUFBQSxJQVlBLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixLQUF4QixFQUErQixhQUEvQixDQVpBLENBQUE7QUFjQSxJQUFBLElBQUcsYUFBSDthQUNFLElBQUMsQ0FBQSxTQUFELENBQ0U7QUFBQSxRQUFBLGFBQUEsRUFBZSxhQUFmO0FBQUEsUUFDQSxLQUFBLEVBQU8sS0FEUDtPQURGLEVBREY7S0FmUztFQUFBLENBMUNYLENBQUE7O0FBQUEsNEJBK0RBLFNBQUEsR0FBVyxTQUFDLElBQUQsR0FBQTtBQUNULFFBQUEsMkRBQUE7QUFBQSxJQURZLHNCQUFBLGdCQUFnQixxQkFBQSxlQUFlLGFBQUEsT0FBTyxjQUFBLE1BQ2xELENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxDQUFjLGNBQUEsSUFBa0IsYUFBaEMsQ0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQ0EsSUFBQSxJQUF3QyxhQUF4QztBQUFBLE1BQUEsY0FBQSxHQUFpQixhQUFhLENBQUMsS0FBL0IsQ0FBQTtLQURBO0FBQUEsSUFHQSxhQUFBLEdBQW9CLElBQUEsYUFBQSxDQUNsQjtBQUFBLE1BQUEsY0FBQSxFQUFnQixjQUFoQjtBQUFBLE1BQ0EsYUFBQSxFQUFlLGFBRGY7S0FEa0IsQ0FIcEIsQ0FBQTs7TUFPQSxTQUNFO0FBQUEsUUFBQSxTQUFBLEVBQ0U7QUFBQSxVQUFBLGFBQUEsRUFBZSxJQUFmO0FBQUEsVUFDQSxLQUFBLEVBQU8sR0FEUDtBQUFBLFVBRUEsU0FBQSxFQUFXLENBRlg7U0FERjs7S0FSRjtXQWFBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLGFBQWYsRUFBOEIsS0FBOUIsRUFBcUMsTUFBckMsRUFkUztFQUFBLENBL0RYLENBQUE7O0FBQUEsNEJBZ0ZBLFVBQUEsR0FBWSxTQUFBLEdBQUE7V0FDVixJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQSxFQURVO0VBQUEsQ0FoRlosQ0FBQTs7QUFBQSw0QkFvRkEsc0JBQUEsR0FBd0IsU0FBQyxLQUFELEVBQVEsYUFBUixHQUFBO0FBQ3RCLFFBQUEsV0FBQTtBQUFBLElBQUEsSUFBRyxhQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLGdCQUFQLENBQXdCLGFBQXhCLENBQUEsQ0FBQTtBQUFBLE1BRUEsV0FBQSxHQUFjLEdBQUcsQ0FBQyxlQUFKLENBQW9CLEtBQUssQ0FBQyxNQUExQixDQUZkLENBQUE7QUFHQSxNQUFBLElBQUcsV0FBSDtBQUNFLGdCQUFPLFdBQVcsQ0FBQyxXQUFuQjtBQUFBLGVBQ08sTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsWUFEL0I7bUJBRUksSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLGFBQWpCLEVBQWdDLFdBQVcsQ0FBQyxRQUE1QyxFQUFzRCxLQUF0RCxFQUZKO0FBQUEsZUFHTyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUg5QjttQkFJSSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsYUFBdkIsRUFBc0MsV0FBVyxDQUFDLFFBQWxELEVBQTRELEtBQTVELEVBSko7QUFBQSxTQURGO09BSkY7S0FBQSxNQUFBO2FBV0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUEsRUFYRjtLQURzQjtFQUFBLENBcEZ4QixDQUFBOztBQUFBLDRCQW1HQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7V0FDakIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FEQTtFQUFBLENBbkduQixDQUFBOztBQUFBLDRCQXVHQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7QUFDbEIsUUFBQSxjQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBZ0IsTUFBaEIsQ0FBQSxDQUFBO0FBQUEsSUFDQSxjQUFBLEdBQWlCLElBQUMsQ0FBQSxpQkFBRCxDQUFBLENBRGpCLENBQUE7QUFFQSxJQUFBLElBQTRCLGNBQTVCO2FBQUEsQ0FBQSxDQUFFLGNBQUYsQ0FBaUIsQ0FBQyxJQUFsQixDQUFBLEVBQUE7S0FIa0I7RUFBQSxDQXZHcEIsQ0FBQTs7QUFBQSw0QkE2R0Esd0JBQUEsR0FBMEIsU0FBQyxhQUFELEdBQUE7V0FDeEIsSUFBQyxDQUFBLG1CQUFELENBQXFCLGFBQXJCLEVBRHdCO0VBQUEsQ0E3RzFCLENBQUE7O0FBQUEsNEJBaUhBLG1CQUFBLEdBQXFCLFNBQUMsYUFBRCxHQUFBO0FBQ25CLFFBQUEsd0JBQUE7QUFBQSxJQUFBLElBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxRQUE1QjtBQUNFLE1BQUEsYUFBQTs7QUFBZ0I7QUFBQTthQUFBLDJDQUFBOytCQUFBO0FBQ2Qsd0JBQUEsU0FBUyxDQUFDLEtBQVYsQ0FEYztBQUFBOztVQUFoQixDQUFBO2FBR0EsSUFBQyxDQUFBLGtCQUFrQixDQUFDLEdBQXBCLENBQXdCLGFBQXhCLEVBSkY7S0FEbUI7RUFBQSxDQWpIckIsQ0FBQTs7QUFBQSw0QkF5SEEscUJBQUEsR0FBdUIsU0FBQyxhQUFELEdBQUE7V0FDckIsYUFBYSxDQUFDLFlBQWQsQ0FBQSxFQURxQjtFQUFBLENBekh2QixDQUFBOztBQUFBLDRCQTZIQSxxQkFBQSxHQUF1QixTQUFDLGFBQUQsR0FBQTtXQUNyQixhQUFhLENBQUMsWUFBZCxDQUFBLEVBRHFCO0VBQUEsQ0E3SHZCLENBQUE7O3lCQUFBOztHQUY2QyxLQVYvQyxDQUFBOzs7OztBQ0FBLElBQUEsUUFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsa0JBQUUsTUFBRixHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsU0FBQSxNQUNiLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixFQURqQixDQURXO0VBQUEsQ0FBYjs7QUFBQSxxQkFXQSxhQUFBLEdBQWUsU0FBQyxJQUFELEVBQU8sUUFBUCxHQUFBO0FBQ2IsUUFBQSxxREFBQTs7TUFEb0IsV0FBVyxTQUFBLEdBQUE7S0FDL0I7QUFBQSxJQUFBLElBQXFCLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixDQUFyQjtBQUFBLGFBQU8sUUFBQSxDQUFBLENBQVAsQ0FBQTtLQUFBO0FBQUEsSUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUZkLENBQUE7QUFBQSxJQUdBLFVBQUEsR0FBYSxZQUhiLENBQUE7QUFBQSxJQUlBLGtCQUFBLEdBQXFCLG9CQUpyQixDQUFBO0FBQUEsSUFLQSxJQUFBLEdBQU8sR0FBRyxDQUFDLG9CQUFKLENBQXlCLE1BQXpCLENBQWlDLENBQUEsQ0FBQSxDQUx4QyxDQUFBO0FBQUEsSUFPQSxFQUFBLEdBQUssR0FBRyxDQUFDLGFBQUosQ0FBa0IsUUFBbEIsQ0FQTCxDQUFBO0FBQUEsSUFRQSxNQUFBLEdBQVMsTUFSVCxDQUFBO0FBQUEsSUFVQSxFQUFFLENBQUMsTUFBSCxHQUFZLEVBQUUsQ0FBQyxPQUFILEdBQWEsRUFBRyxDQUFBLGtCQUFBLENBQUgsR0FBeUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUNoRCxRQUFBLElBQVcsQ0FBQyxFQUFHLENBQUEsVUFBQSxDQUFILElBQWtCLENBQUEsQ0FBRSxVQUFVLENBQUMsSUFBWCxDQUFnQixFQUFHLENBQUEsVUFBQSxDQUFuQixDQUFELENBQXBCLENBQUEsSUFBMEQsTUFBckU7QUFBQSxnQkFBQSxDQUFBO1NBQUE7QUFBQSxRQUNBLEVBQUUsQ0FBQyxNQUFILEdBQVksRUFBRyxDQUFBLGtCQUFBLENBQUgsR0FBeUIsSUFEckMsQ0FBQTtBQUFBLFFBRUEsTUFBQSxHQUFTLElBRlQsQ0FBQTtBQUFBLFFBR0EsS0FBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBSEEsQ0FBQTtlQUlBLFFBQUEsQ0FBQSxFQUxnRDtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBVmxELENBQUE7QUFBQSxJQWlCQSxFQUFFLENBQUMsS0FBSCxHQUFXLElBakJYLENBQUE7QUFBQSxJQWtCQSxFQUFFLENBQUMsR0FBSCxHQUFTLElBbEJULENBQUE7V0FtQkEsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsRUFBbEIsRUFBc0IsSUFBSSxDQUFDLFNBQTNCLEVBcEJhO0VBQUEsQ0FYZixDQUFBOztBQUFBLHFCQWtDQSxXQUFBLEdBQWEsU0FBQyxHQUFELEdBQUE7V0FDWCxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBb0IsR0FBcEIsQ0FBQSxJQUE0QixFQURqQjtFQUFBLENBbENiLENBQUE7O0FBQUEscUJBeUNBLGdCQUFBLEdBQWtCLFNBQUMsU0FBRCxFQUFZLFFBQVosR0FBQTtBQUNoQixRQUFBLFdBQUE7O01BRDRCLFdBQVcsU0FBQSxHQUFBO0tBQ3ZDO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLGlCQUFELENBQW1CLFNBQW5CLENBQVosQ0FBQTtBQUNBLElBQUEsSUFBcUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLFNBQXJCLENBQXJCO0FBQUEsYUFBTyxRQUFBLENBQUEsQ0FBUCxDQUFBO0tBREE7QUFBQSxJQUlBLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBSmQsQ0FBQTtBQUFBLElBS0EsTUFBQSxHQUFTLEdBQUcsQ0FBQyxhQUFKLENBQWtCLFFBQWxCLENBTFQsQ0FBQTtBQUFBLElBTUEsTUFBTSxDQUFDLFNBQVAsR0FBbUIsU0FObkIsQ0FBQTtBQUFBLElBT0EsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFULENBQXFCLE1BQXJCLENBUEEsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQW9CLFNBQXBCLENBUkEsQ0FBQTtXQVVBLFFBQUEsQ0FBQSxFQVhnQjtFQUFBLENBekNsQixDQUFBOztBQUFBLHFCQXVEQSxpQkFBQSxHQUFtQixTQUFDLFNBQUQsR0FBQTtXQUVqQixTQUFTLENBQUMsT0FBVixDQUFrQiw0QkFBbEIsRUFBZ0QsRUFBaEQsRUFGaUI7RUFBQSxDQXZEbkIsQ0FBQTs7QUFBQSxxQkE0REEsbUJBQUEsR0FBcUIsU0FBQyxTQUFELEdBQUE7V0FDbkIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQXVCLFNBQXZCLENBQUEsSUFBcUMsRUFEbEI7RUFBQSxDQTVEckIsQ0FBQTs7a0JBQUE7O0lBRkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLDJDQUFBO0VBQUE7O2lTQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsa0JBQ0EsR0FBcUIsT0FBQSxDQUFRLHVCQUFSLENBRHJCLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSxVQUFSLENBRlQsQ0FBQTs7QUFBQSxNQUdBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBSFQsQ0FBQTs7QUFBQSxNQVFNLENBQUMsT0FBUCxHQUF1QjtBQUVyQix5QkFBQSxDQUFBOztBQUFhLEVBQUEsY0FBQyxJQUFELEdBQUE7QUFDWCxRQUFBLDJEQUFBO0FBQUEsMEJBRFksT0FBcUcsSUFBbkcsa0JBQUEsWUFBWSxnQkFBQSxVQUFVLGtCQUFBLFlBQVksSUFBQyxDQUFBLDRCQUFBLHNCQUFzQixJQUFDLENBQUEsY0FBQSxRQUFRLElBQUMsQ0FBQSxxQkFBQSxlQUFlLElBQUMsQ0FBQSxxQkFBQSxhQUNqRyxDQUFBO0FBQUEsbURBQUEsQ0FBQTs7TUFBQSxJQUFDLENBQUEsZ0JBQWlCLE1BQU0sQ0FBQztLQUF6QjtBQUNBLElBQUEsSUFBMEIsZ0JBQTFCO0FBQUEsTUFBQSxJQUFDLENBQUEsVUFBRCxHQUFjLFFBQWQsQ0FBQTtLQURBO0FBQUEsSUFFQSxJQUFDLENBQUEsVUFBRCx5QkFBaUIsVUFBVSxDQUFFLGdCQUFmLEdBQTJCLFVBQVcsQ0FBQSxDQUFBLENBQXRDLEdBQThDLFVBRjVELENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxTQUFELENBQVcsVUFBWCxDQUhBLENBQUE7O01BSUEsSUFBQyxDQUFBLGFBQWMsQ0FBQSxDQUFHLEdBQUEsR0FBckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQThCLElBQUMsQ0FBQSxLQUEvQjtLQUpmO0FBQUEsSUFNQSxvQ0FBQSxDQU5BLENBQUE7QUFBQSxJQVNBLG1CQUFBLEdBQXNCLENBQUEsSUFBSyxDQUFBLGFBVDNCLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxNQUFELEdBQWMsSUFBQSxNQUFBLENBQU87QUFBQSxNQUFBLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBVDtBQUFBLE1BQWlCLE9BQUEsRUFBUyxtQkFBMUI7S0FBUCxDQVZkLENBQUE7QUFBQSxJQVlBLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FaQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSxpQkFnQkEsV0FBQSxHQUFhLFNBQUEsR0FBQTtBQUVYLElBQUEsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFBLENBQUEsQ0FBQTtXQUNBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ1QsS0FBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLEVBRFM7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLEVBRUUsQ0FGRixFQUhXO0VBQUEsQ0FoQmIsQ0FBQTs7QUFBQSxpQkF3QkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtBQUVWLElBQUEsSUFBRyxtQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQWpDLEVBQStDLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxDQUEvQyxDQUFBLENBREY7S0FBQTtBQUlBLElBQUEsSUFBRyxpQ0FBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixJQUFDLENBQUEsb0JBQTFCLEVBQWdELElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxDQUFoRCxDQUFBLENBQUE7YUFHQSxJQUFDLENBQUEsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEdBQXRDLENBQTBDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLFVBQUQsR0FBQTtpQkFDeEMsS0FBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLFVBQXZCLEVBRHdDO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUMsRUFKRjtLQU5VO0VBQUEsQ0F4QlosQ0FBQTs7QUFBQSxpQkFzQ0EsU0FBQSxHQUFXLFNBQUMsVUFBRCxHQUFBOztNQUNULGFBQWMsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBQyxDQUFBLFVBQWxCO0tBQWQ7QUFBQSxJQUNBLElBQUMsQ0FBQSxNQUFELEdBQVUsVUFEVixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFGcEIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFBLENBQUUsSUFBQyxDQUFBLFFBQUgsQ0FIYixDQUFBO1dBSUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFBLENBQUUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFaLEVBTEE7RUFBQSxDQXRDWCxDQUFBOztBQUFBLGlCQThDQSxlQUFBLEdBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsSUFBQSxJQUFHLFlBQUg7YUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBRHJCO0tBQUEsTUFBQTthQUdFLE9BSEY7S0FEZTtFQUFBLENBOUNqQixDQUFBOztjQUFBOztHQUZrQyxtQkFScEMsQ0FBQTs7Ozs7QUNBQSxJQUFBLGdDQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsU0FDQSxHQUFZLE9BQUEsQ0FBUSxzQkFBUixDQURaLENBQUE7O0FBQUEsTUFZTSxDQUFDLE9BQVAsR0FBdUI7QUFFckIsK0JBQUEsVUFBQSxHQUFZLElBQVosQ0FBQTs7QUFHYSxFQUFBLDRCQUFBLEdBQUE7O01BQ1gsSUFBQyxDQUFBLGFBQWMsQ0FBQSxDQUFFLE9BQUYsQ0FBVyxDQUFBLENBQUE7S0FBMUI7QUFBQSxJQUNBLElBQUMsQ0FBQSxjQUFELEdBQXNCLElBQUEsU0FBQSxDQUFBLENBRHRCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FGQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsY0FBYyxDQUFDLEtBQWhCLENBQUEsQ0FIQSxDQURXO0VBQUEsQ0FIYjs7QUFBQSwrQkFVQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osQ0FBQSxDQUFFLElBQUMsQ0FBQSxVQUFILENBQWMsQ0FBQyxJQUFmLENBQUEsRUFESTtFQUFBLENBVk4sQ0FBQTs7QUFBQSwrQkFjQSx3QkFBQSxHQUEwQixTQUFDLGFBQUQsR0FBQSxDQWQxQixDQUFBOztBQUFBLCtCQW1CQSxXQUFBLEdBQWEsU0FBQSxHQUFBLENBbkJiLENBQUE7O0FBQUEsK0JBc0JBLEtBQUEsR0FBTyxTQUFDLFFBQUQsR0FBQTtXQUNMLElBQUMsQ0FBQSxjQUFjLENBQUMsV0FBaEIsQ0FBNEIsUUFBNUIsRUFESztFQUFBLENBdEJQLENBQUE7OzRCQUFBOztJQWRGLENBQUE7Ozs7O0FDQUEsSUFBQSwrQkFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLFlBQ0EsR0FBZSxPQUFBLENBQVEseUJBQVIsQ0FEZixDQUFBOztBQUFBLEdBRUEsR0FBTSxPQUFBLENBQVEsb0JBQVIsQ0FGTixDQUFBOztBQUFBLE1BSU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxtQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLFlBQUE7QUFBQSxJQURjLFlBQUEsTUFBTSxJQUFDLENBQUEsWUFBQSxNQUFNLElBQUMsQ0FBQSxZQUFBLE1BQU0sY0FBQSxNQUNsQyxDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BQU0sQ0FBQyxNQUFQLENBQWMsWUFBWSxDQUFDLFVBQVcsQ0FBQSxJQUFDLENBQUEsSUFBRCxDQUF0QyxDQUFWLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxJQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FEeEIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxNQUFYLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUhaLENBRFc7RUFBQSxDQUFiOztBQUFBLHNCQU9BLFNBQUEsR0FBVyxTQUFDLE1BQUQsR0FBQTtXQUNULENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBQyxDQUFBLE1BQVYsRUFBa0IsTUFBbEIsRUFEUztFQUFBLENBUFgsQ0FBQTs7QUFBQSxzQkFXQSxZQUFBLEdBQWMsU0FBQSxHQUFBO1dBQ1osSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQURJO0VBQUEsQ0FYZCxDQUFBOztBQUFBLHNCQWVBLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTtXQUNsQixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQURVO0VBQUEsQ0FmcEIsQ0FBQTs7QUFBQSxzQkFvQkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtXQUNWLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWYsQ0FBQSxFQURVO0VBQUEsQ0FwQlosQ0FBQTs7QUFBQSxzQkEwQkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLFFBQUEsWUFBQTtBQUFBLElBQUEsWUFBQSxHQUFtQixJQUFBLFNBQUEsQ0FBVTtBQUFBLE1BQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFQO0FBQUEsTUFBYSxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQXBCO0FBQUEsTUFBMEIsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuQztLQUFWLENBQW5CLENBQUE7QUFBQSxJQUNBLFlBQVksQ0FBQyxRQUFiLEdBQXdCLElBQUMsQ0FBQSxRQUR6QixDQUFBO1dBRUEsYUFISztFQUFBLENBMUJQLENBQUE7O0FBQUEsc0JBZ0NBLDZCQUFBLEdBQStCLFNBQUEsR0FBQTtXQUM3QixHQUFHLENBQUMsNkJBQUosQ0FBa0MsSUFBQyxDQUFBLElBQW5DLEVBRDZCO0VBQUEsQ0FoQy9CLENBQUE7O0FBQUEsc0JBb0NBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTtXQUNyQixJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUEsRUFEcUI7RUFBQSxDQXBDdkIsQ0FBQTs7bUJBQUE7O0lBTkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGlEQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUZULENBQUE7O0FBQUEsU0FHQSxHQUFZLE9BQUEsQ0FBUSxhQUFSLENBSFosQ0FBQTs7QUFBQSxNQU9NLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsNkJBQUUsR0FBRixHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsb0JBQUEsTUFBSSxFQUNqQixDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLENBQVYsQ0FEVztFQUFBLENBQWI7O0FBQUEsZ0NBSUEsR0FBQSxHQUFLLFNBQUMsU0FBRCxHQUFBO0FBQ0gsUUFBQSxLQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsU0FBbkIsQ0FBQSxDQUFBO0FBQUEsSUFHQSxJQUFLLENBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBTCxHQUFnQixTQUhoQixDQUFBO0FBQUEsSUFJQSxTQUFTLENBQUMsS0FBVixHQUFrQixJQUFDLENBQUEsTUFKbkIsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLE1BQUQsSUFBVyxDQUxYLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxHQUFJLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBTCxHQUF1QixTQVJ2QixDQUFBO0FBQUEsSUFZQSxhQUFLLFNBQVMsQ0FBQyxVQUFmLGNBQXlCLEdBWnpCLENBQUE7QUFBQSxJQWFBLElBQUssQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFlLENBQUMsSUFBckIsQ0FBMEIsU0FBMUIsQ0FiQSxDQUFBO1dBY0EsVUFmRztFQUFBLENBSkwsQ0FBQTs7QUFBQSxnQ0FzQkEsSUFBQSxHQUFNLFNBQUMsSUFBRCxHQUFBO0FBQ0osUUFBQSxTQUFBO0FBQUEsSUFBQSxJQUFvQixJQUFBLFlBQWdCLFNBQXBDO0FBQUEsTUFBQSxTQUFBLEdBQVksSUFBWixDQUFBO0tBQUE7O01BQ0EsWUFBYSxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUE7S0FEbEI7V0FFQSxJQUFLLENBQUEsU0FBUyxDQUFDLEtBQVYsSUFBbUIsQ0FBbkIsRUFIRDtFQUFBLENBdEJOLENBQUE7O0FBQUEsZ0NBNEJBLFVBQUEsR0FBWSxTQUFDLElBQUQsR0FBQTtBQUNWLFFBQUEsdUJBQUE7QUFBQSxJQUFBLElBQW9CLElBQUEsWUFBZ0IsU0FBcEM7QUFBQSxNQUFBLFNBQUEsR0FBWSxJQUFaLENBQUE7S0FBQTs7TUFDQSxZQUFhLElBQUMsQ0FBQSxHQUFJLENBQUEsSUFBQTtLQURsQjtBQUFBLElBR0EsWUFBQSxHQUFlLFNBQVMsQ0FBQyxJQUh6QixDQUFBO0FBSUEsV0FBTSxTQUFBLEdBQVksSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFOLENBQWxCLEdBQUE7QUFDRSxNQUFBLElBQW9CLFNBQVMsQ0FBQyxJQUFWLEtBQWtCLFlBQXRDO0FBQUEsZUFBTyxTQUFQLENBQUE7T0FERjtJQUFBLENBTFU7RUFBQSxDQTVCWixDQUFBOztBQUFBLGdDQXFDQSxHQUFBLEdBQUssU0FBQyxJQUFELEdBQUE7V0FDSCxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUEsRUFERjtFQUFBLENBckNMLENBQUE7O0FBQUEsZ0NBeUNBLEtBQUEsR0FBTyxTQUFDLElBQUQsR0FBQTtBQUNMLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBRyxJQUFIOytDQUNZLENBQUUsZ0JBRGQ7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLE9BSEg7S0FESztFQUFBLENBekNQLENBQUE7O0FBQUEsZ0NBZ0RBLEtBQUEsR0FBTyxTQUFDLElBQUQsR0FBQTtBQUNMLFFBQUEsMENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxtQ0FBMkIsQ0FBRSxnQkFBN0I7QUFBQSxhQUFPLEVBQVAsQ0FBQTtLQUFBO0FBQ0E7QUFBQTtTQUFBLDRDQUFBOzRCQUFBO0FBQ0Usb0JBQUEsU0FBUyxDQUFDLEtBQVYsQ0FERjtBQUFBO29CQUZLO0VBQUEsQ0FoRFAsQ0FBQTs7QUFBQSxnQ0FzREEsSUFBQSxHQUFNLFNBQUMsUUFBRCxHQUFBO0FBQ0osUUFBQSw2QkFBQTtBQUFBO1NBQUEsMkNBQUE7MkJBQUE7QUFDRSxvQkFBQSxRQUFBLENBQVMsU0FBVCxFQUFBLENBREY7QUFBQTtvQkFESTtFQUFBLENBdEROLENBQUE7O0FBQUEsZ0NBMkRBLFVBQUEsR0FBWSxTQUFDLElBQUQsRUFBTyxRQUFQLEdBQUE7QUFDVixRQUFBLG1DQUFBO0FBQUEsSUFBQSxJQUFHLElBQUssQ0FBQSxJQUFBLENBQVI7QUFDRTtBQUFBO1dBQUEsMkNBQUE7NkJBQUE7QUFDRSxzQkFBQSxRQUFBLENBQVMsU0FBVCxFQUFBLENBREY7QUFBQTtzQkFERjtLQURVO0VBQUEsQ0EzRFosQ0FBQTs7QUFBQSxnQ0FpRUEsWUFBQSxHQUFjLFNBQUMsUUFBRCxHQUFBO1dBQ1osSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaLEVBQXdCLFFBQXhCLEVBRFk7RUFBQSxDQWpFZCxDQUFBOztBQUFBLGdDQXFFQSxTQUFBLEdBQVcsU0FBQyxRQUFELEdBQUE7V0FDVCxJQUFDLENBQUEsVUFBRCxDQUFZLE9BQVosRUFBcUIsUUFBckIsRUFEUztFQUFBLENBckVYLENBQUE7O0FBQUEsZ0NBeUVBLGFBQUEsR0FBZSxTQUFDLFFBQUQsR0FBQTtXQUNiLElBQUMsQ0FBQSxVQUFELENBQVksV0FBWixFQUF5QixRQUF6QixFQURhO0VBQUEsQ0F6RWYsQ0FBQTs7QUFBQSxnQ0E2RUEsUUFBQSxHQUFVLFNBQUMsUUFBRCxHQUFBO1dBQ1IsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLEVBQW9CLFFBQXBCLEVBRFE7RUFBQSxDQTdFVixDQUFBOztBQUFBLGdDQWlGQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQW9CLElBQUEsbUJBQUEsQ0FBQSxDQUFwQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsU0FBRCxHQUFBO2FBQ0osYUFBYSxDQUFDLEdBQWQsQ0FBa0IsU0FBUyxDQUFDLEtBQVYsQ0FBQSxDQUFsQixFQURJO0lBQUEsQ0FBTixDQURBLENBQUE7V0FJQSxjQUxLO0VBQUEsQ0FqRlAsQ0FBQTs7QUFBQSxnQ0EyRkEsUUFBQSxHQUFVLFNBQUMsSUFBRCxHQUFBO1dBQ1IsQ0FBQSxDQUFFLElBQUMsQ0FBQSxHQUFJLENBQUEsSUFBQSxDQUFLLENBQUMsSUFBYixFQURRO0VBQUEsQ0EzRlYsQ0FBQTs7QUFBQSxnQ0ErRkEsZUFBQSxHQUFpQixTQUFBLEdBQUE7QUFDZixJQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxTQUFELEdBQUE7QUFDSixNQUFBLElBQWdCLENBQUEsU0FBYSxDQUFDLElBQTlCO0FBQUEsZUFBTyxLQUFQLENBQUE7T0FESTtJQUFBLENBQU4sQ0FBQSxDQUFBO0FBR0EsV0FBTyxJQUFQLENBSmU7RUFBQSxDQS9GakIsQ0FBQTs7QUFBQSxnQ0F1R0EsaUJBQUEsR0FBbUIsU0FBQyxTQUFELEdBQUE7V0FDakIsTUFBQSxDQUFPLFNBQUEsSUFBYSxDQUFBLElBQUssQ0FBQSxHQUFJLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBN0IsRUFDRSxFQUFBLEdBQ0osU0FBUyxDQUFDLElBRE4sR0FDVyw0QkFEWCxHQUNMLE1BQU0sQ0FBQyxVQUFXLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxDQUFDLFlBRDdCLEdBRXVDLEtBRnZDLEdBRUwsU0FBUyxDQUFDLElBRkwsR0FFNEQsU0FGNUQsR0FFTCxTQUFTLENBQUMsSUFGTCxHQUdFLHlCQUpKLEVBRGlCO0VBQUEsQ0F2R25CLENBQUE7OzZCQUFBOztJQVRGLENBQUE7Ozs7O0FDQUEsSUFBQSxpQkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxTQUNBLEdBQVksT0FBQSxDQUFRLGFBQVIsQ0FEWixDQUFBOztBQUFBLE1BR00sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO0FBRWxCLE1BQUEsZUFBQTtBQUFBLEVBQUEsZUFBQSxHQUFrQixhQUFsQixDQUFBO1NBRUE7QUFBQSxJQUFBLEtBQUEsRUFBTyxTQUFDLElBQUQsR0FBQTtBQUNMLFVBQUEsNEJBQUE7QUFBQSxNQUFBLGFBQUEsR0FBZ0IsTUFBaEIsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixFQURoQixDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixFQUF1QixTQUFDLFNBQUQsR0FBQTtBQUNyQixRQUFBLElBQUcsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBSDtpQkFDRSxhQUFBLEdBQWdCLFVBRGxCO1NBQUEsTUFBQTtpQkFHRSxhQUFhLENBQUMsSUFBZCxDQUFtQixTQUFuQixFQUhGO1NBRHFCO01BQUEsQ0FBdkIsQ0FGQSxDQUFBO0FBUUEsTUFBQSxJQUFxRCxhQUFyRDtBQUFBLFFBQUEsSUFBQyxDQUFBLGtCQUFELENBQW9CLGFBQXBCLEVBQW1DLGFBQW5DLENBQUEsQ0FBQTtPQVJBO0FBU0EsYUFBTyxhQUFQLENBVks7SUFBQSxDQUFQO0FBQUEsSUFhQSxlQUFBLEVBQWlCLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUNmLFVBQUEsOEdBQUE7QUFBQSxNQUFBLGFBQUEsR0FBZ0IsRUFBaEIsQ0FBQTtBQUNBO0FBQUEsV0FBQSwyQ0FBQTt3QkFBQTtBQUNFLFFBQUEsYUFBQSxHQUFnQixJQUFJLENBQUMsSUFBckIsQ0FBQTtBQUFBLFFBQ0EsY0FBQSxHQUFpQixhQUFhLENBQUMsT0FBZCxDQUFzQixlQUF0QixFQUF1QyxFQUF2QyxDQURqQixDQUFBO0FBRUEsUUFBQSxJQUFHLElBQUEsR0FBTyxNQUFNLENBQUMsa0JBQW1CLENBQUEsY0FBQSxDQUFwQztBQUNFLFVBQUEsYUFBYSxDQUFDLElBQWQsQ0FDRTtBQUFBLFlBQUEsYUFBQSxFQUFlLGFBQWY7QUFBQSxZQUNBLFNBQUEsRUFBZSxJQUFBLFNBQUEsQ0FDYjtBQUFBLGNBQUEsSUFBQSxFQUFNLElBQUksQ0FBQyxLQUFYO0FBQUEsY0FDQSxJQUFBLEVBQU0sSUFETjtBQUFBLGNBRUEsSUFBQSxFQUFNLElBRk47YUFEYSxDQURmO1dBREYsQ0FBQSxDQURGO1NBSEY7QUFBQSxPQURBO0FBY0E7V0FBQSxzREFBQTtpQ0FBQTtBQUNFLFFBQUEsU0FBQSxHQUFZLElBQUksQ0FBQyxTQUFqQixDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsU0FBbEIsRUFBNkIsSUFBSSxDQUFDLGFBQWxDLENBREEsQ0FBQTtBQUFBLHNCQUVBLElBQUEsQ0FBSyxTQUFMLEVBRkEsQ0FERjtBQUFBO3NCQWZlO0lBQUEsQ0FiakI7QUFBQSxJQWtDQSxrQkFBQSxFQUFvQixTQUFDLGFBQUQsRUFBZ0IsYUFBaEIsR0FBQTtBQUNsQixVQUFBLDZCQUFBO0FBQUE7V0FBQSxvREFBQTtzQ0FBQTtBQUNFLGdCQUFPLFNBQVMsQ0FBQyxJQUFqQjtBQUFBLGVBQ08sVUFEUDtBQUVJLDBCQUFBLGFBQWEsQ0FBQyxRQUFkLEdBQXlCLEtBQXpCLENBRko7QUFDTztBQURQO2tDQUFBO0FBQUEsU0FERjtBQUFBO3NCQURrQjtJQUFBLENBbENwQjtBQUFBLElBMkNBLGdCQUFBLEVBQWtCLFNBQUMsU0FBRCxFQUFZLGFBQVosR0FBQTtBQUNoQixNQUFBLElBQUcsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBSDtBQUNFLFFBQUEsSUFBRyxhQUFBLEtBQWlCLFNBQVMsQ0FBQyxZQUFWLENBQUEsQ0FBcEI7aUJBQ0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLFNBQXBCLEVBQStCLGFBQS9CLEVBREY7U0FBQSxNQUVLLElBQUcsQ0FBQSxTQUFhLENBQUMsSUFBakI7aUJBQ0gsSUFBQyxDQUFBLGtCQUFELENBQW9CLFNBQXBCLEVBREc7U0FIUDtPQUFBLE1BQUE7ZUFNRSxJQUFDLENBQUEsZUFBRCxDQUFpQixTQUFqQixFQUE0QixhQUE1QixFQU5GO09BRGdCO0lBQUEsQ0EzQ2xCO0FBQUEsSUF1REEsa0JBQUEsRUFBb0IsU0FBQyxTQUFELEVBQVksYUFBWixHQUFBO0FBQ2xCLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLFNBQVMsQ0FBQyxJQUFqQixDQUFBO0FBQ0EsTUFBQSxJQUFHLGFBQUg7QUFDRSxRQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLFNBQWpCLEVBQTRCLGFBQTVCLENBQUEsQ0FERjtPQURBO2FBR0EsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsU0FBUyxDQUFDLFlBQVYsQ0FBQSxDQUFsQixFQUE0QyxTQUFTLENBQUMsSUFBdEQsRUFKa0I7SUFBQSxDQXZEcEI7QUFBQSxJQThEQSxlQUFBLEVBQWlCLFNBQUMsU0FBRCxFQUFZLGFBQVosR0FBQTthQUNmLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZixDQUErQixhQUEvQixFQURlO0lBQUEsQ0E5RGpCO0lBSmtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FIakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLHVCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQWlCLGVBQUEsR0FBcUIsQ0FBQSxTQUFBLEdBQUE7QUFFcEMsTUFBQSxlQUFBO0FBQUEsRUFBQSxlQUFBLEdBQWtCLGFBQWxCLENBQUE7U0FFQTtBQUFBLElBQUEsSUFBQSxFQUFNLFNBQUMsSUFBRCxFQUFPLG1CQUFQLEdBQUE7QUFDSixVQUFBLHFEQUFBO0FBQUE7QUFBQSxXQUFBLDJDQUFBO3dCQUFBO0FBQ0UsUUFBQSxjQUFBLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBVixDQUFrQixlQUFsQixFQUFtQyxFQUFuQyxDQUFqQixDQUFBO0FBQ0EsUUFBQSxJQUFHLElBQUEsR0FBTyxNQUFNLENBQUMsa0JBQW1CLENBQUEsY0FBQSxDQUFwQztBQUNFLFVBQUEsU0FBQSxHQUFZLG1CQUFtQixDQUFDLEdBQXBCLENBQXdCLElBQUksQ0FBQyxLQUE3QixDQUFaLENBQUE7QUFBQSxVQUNBLFNBQVMsQ0FBQyxJQUFWLEdBQWlCLElBRGpCLENBREY7U0FGRjtBQUFBLE9BQUE7YUFNQSxPQVBJO0lBQUEsQ0FBTjtJQUpvQztBQUFBLENBQUEsQ0FBSCxDQUFBLENBRm5DLENBQUE7Ozs7O0FDQUEsSUFBQSx5QkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQVNNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsMkJBQUMsSUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBakIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFEN0MsQ0FEVztFQUFBLENBQWI7O0FBQUEsOEJBS0EsT0FBQSxHQUFTLElBTFQsQ0FBQTs7QUFBQSw4QkFRQSxPQUFBLEdBQVMsU0FBQSxHQUFBO1dBQ1AsQ0FBQSxDQUFDLElBQUUsQ0FBQSxNQURJO0VBQUEsQ0FSVCxDQUFBOztBQUFBLDhCQVlBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixRQUFBLGNBQUE7QUFBQSxJQUFBLENBQUEsR0FBSSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxLQUFoQixDQUFBO0FBQUEsSUFDQSxLQUFBLEdBQVEsSUFBQSxHQUFPLE1BRGYsQ0FBQTtBQUVBLElBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUNFLE1BQUEsS0FBQSxHQUFRLENBQUMsQ0FBQyxVQUFWLENBQUE7QUFDQSxNQUFBLElBQUcsS0FBQSxJQUFTLENBQUMsQ0FBQyxRQUFGLEtBQWMsQ0FBdkIsSUFBNEIsQ0FBQSxDQUFFLENBQUMsWUFBRixDQUFlLElBQUMsQ0FBQSxhQUFoQixDQUFoQztBQUNFLFFBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFULENBREY7T0FBQSxNQUFBO0FBR0UsUUFBQSxJQUFBLEdBQU8sSUFBUCxDQUFBO0FBQ0EsZUFBTSxDQUFDLENBQUEsS0FBSyxJQUFDLENBQUEsSUFBUCxDQUFBLElBQWdCLENBQUEsQ0FBRSxJQUFBLEdBQU8sQ0FBQyxDQUFDLFdBQVYsQ0FBdkIsR0FBQTtBQUNFLFVBQUEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxVQUFOLENBREY7UUFBQSxDQURBO0FBQUEsUUFJQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBSlQsQ0FIRjtPQUZGO0tBRkE7V0FhQSxJQUFDLENBQUEsUUFkRztFQUFBLENBWk4sQ0FBQTs7QUFBQSw4QkE4QkEsV0FBQSxHQUFhLFNBQUEsR0FBQTtBQUNYLFdBQU0sSUFBQyxDQUFBLElBQUQsQ0FBQSxDQUFOLEdBQUE7QUFDRSxNQUFBLElBQVMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULEtBQXFCLENBQTlCO0FBQUEsY0FBQTtPQURGO0lBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxRQUpVO0VBQUEsQ0E5QmIsQ0FBQTs7QUFBQSw4QkFxQ0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsSUFBRCxHQUFRLEtBRHRCO0VBQUEsQ0FyQ1IsQ0FBQTs7MkJBQUE7O0lBWEYsQ0FBQTs7Ozs7QUNBQSxJQUFBLDhKQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsR0FDQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUROLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUZULENBQUE7O0FBQUEsS0FHQSxHQUFRLE9BQUEsQ0FBUSxrQkFBUixDQUhSLENBQUE7O0FBQUEsTUFJQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUpULENBQUE7O0FBQUEsaUJBTUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSLENBTnBCLENBQUE7O0FBQUEsbUJBT0EsR0FBc0IsT0FBQSxDQUFRLHdCQUFSLENBUHRCLENBQUE7O0FBQUEsaUJBUUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSLENBUnBCLENBQUE7O0FBQUEsZUFTQSxHQUFrQixPQUFBLENBQVEsb0JBQVIsQ0FUbEIsQ0FBQTs7QUFBQSxjQVdBLEdBQWlCLE9BQUEsQ0FBUSxtQ0FBUixDQVhqQixDQUFBOztBQUFBLGFBWUEsR0FBZ0IsT0FBQSxDQUFRLDZCQUFSLENBWmhCLENBQUE7O0FBQUEsVUFjQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLENBQUosR0FBQTtBQUNYLEVBQUEsSUFBSSxDQUFDLENBQUMsSUFBRixHQUFTLENBQUMsQ0FBQyxJQUFmO1dBQ0UsRUFERjtHQUFBLE1BRUssSUFBSSxDQUFDLENBQUMsSUFBRixHQUFTLENBQUMsQ0FBQyxJQUFmO1dBQ0gsQ0FBQSxFQURHO0dBQUEsTUFBQTtXQUdILEVBSEc7R0FITTtBQUFBLENBZGIsQ0FBQTs7QUFBQSxNQXlCTSxDQUFDLE9BQVAsR0FBdUI7QUFHUixFQUFBLGtCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsNkJBQUE7QUFBQSwwQkFEWSxPQUFxQyxJQUFuQyxJQUFDLENBQUEsWUFBQSxNQUFNLFlBQUEsTUFBTSxhQUFBLE9BQU8sa0JBQUEsVUFDbEMsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLElBQVAsRUFBYSw4QkFBYixDQUFBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBQSxDQUFHLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBWCxDQUFILENBQXFCLENBQUMsSUFBdEIsQ0FBMkIsT0FBM0IsQ0FGYixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBWCxDQUFBLENBSFQsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFBLElBQVMsS0FBSyxDQUFDLFFBQU4sQ0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBTGxCLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxNQUFELEdBQVUsVUFBQSxJQUFjLEVBTnhCLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxRQUFELEdBQVksRUFQWixDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBVEEsQ0FEVztFQUFBLENBQWI7O0FBQUEscUJBYUEsU0FBQSxHQUFXLFNBQUMsTUFBRCxHQUFBO0FBQ1QsSUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLE1BQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBQSxHQUFqQixNQUFNLENBQUMsSUFBVSxHQUFpQixHQUFqQixHQUFqQixJQUFDLENBQUEsS0FGVztFQUFBLENBYlgsQ0FBQTs7QUFBQSxxQkFtQkEsV0FBQSxHQUFhLFNBQUEsR0FBQTtXQUNQLElBQUEsY0FBQSxDQUFlO0FBQUEsTUFBQSxRQUFBLEVBQVUsSUFBVjtLQUFmLEVBRE87RUFBQSxDQW5CYixDQUFBOztBQUFBLHFCQXVCQSxVQUFBLEdBQVksU0FBQyxjQUFELEVBQWlCLFVBQWpCLEdBQUE7QUFDVixRQUFBLGdDQUFBO0FBQUEsSUFBQSxtQkFBQSxpQkFBbUIsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUFuQixDQUFBO0FBQUEsSUFDQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQUEsQ0FEUixDQUFBO0FBQUEsSUFFQSxVQUFBLEdBQWEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsS0FBTSxDQUFBLENBQUEsQ0FBdEIsQ0FGYixDQUFBO1dBSUEsYUFBQSxHQUFvQixJQUFBLGFBQUEsQ0FDbEI7QUFBQSxNQUFBLEtBQUEsRUFBTyxjQUFQO0FBQUEsTUFDQSxLQUFBLEVBQU8sS0FEUDtBQUFBLE1BRUEsVUFBQSxFQUFZLFVBRlo7QUFBQSxNQUdBLFVBQUEsRUFBWSxVQUhaO0tBRGtCLEVBTFY7RUFBQSxDQXZCWixDQUFBOztBQUFBLHFCQW1DQSxTQUFBLEdBQVcsU0FBQyxJQUFELEdBQUE7QUFHVCxJQUFBLElBQUEsR0FBTyxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsTUFBUixDQUFlLFNBQUMsS0FBRCxHQUFBO2FBQ3BCLElBQUMsQ0FBQSxRQUFELEtBQVksRUFEUTtJQUFBLENBQWYsQ0FBUCxDQUFBO0FBQUEsSUFJQSxNQUFBLENBQU8sSUFBSSxDQUFDLE1BQUwsS0FBZSxDQUF0QixFQUEwQiwwREFBQSxHQUE3QixJQUFDLENBQUEsVUFBNEIsR0FBd0UsY0FBeEUsR0FBN0IsSUFBSSxDQUFDLE1BQUYsQ0FKQSxDQUFBO1dBTUEsS0FUUztFQUFBLENBbkNYLENBQUE7O0FBQUEscUJBOENBLGFBQUEsR0FBZSxTQUFBLEdBQUE7QUFDYixRQUFBLElBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBVSxDQUFBLENBQUEsQ0FBbEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBbkIsQ0FEZCxDQUFBO1dBR0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNmLGdCQUFPLFNBQVMsQ0FBQyxJQUFqQjtBQUFBLGVBQ08sVUFEUDttQkFFSSxLQUFDLENBQUEsY0FBRCxDQUFnQixTQUFTLENBQUMsSUFBMUIsRUFBZ0MsU0FBUyxDQUFDLElBQTFDLEVBRko7QUFBQSxlQUdPLFdBSFA7bUJBSUksS0FBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBUyxDQUFDLElBQTNCLEVBQWlDLFNBQVMsQ0FBQyxJQUEzQyxFQUpKO0FBQUEsZUFLTyxNQUxQO21CQU1JLEtBQUMsQ0FBQSxVQUFELENBQVksU0FBUyxDQUFDLElBQXRCLEVBQTRCLFNBQVMsQ0FBQyxJQUF0QyxFQU5KO0FBQUEsU0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBSmE7RUFBQSxDQTlDZixDQUFBOztBQUFBLHFCQThEQSxpQkFBQSxHQUFtQixTQUFDLElBQUQsR0FBQTtBQUNqQixRQUFBLCtCQUFBO0FBQUEsSUFBQSxRQUFBLEdBQWUsSUFBQSxpQkFBQSxDQUFrQixJQUFsQixDQUFmLENBQUE7QUFBQSxJQUNBLFVBQUEsR0FBaUIsSUFBQSxtQkFBQSxDQUFBLENBRGpCLENBQUE7QUFHQSxXQUFNLElBQUEsR0FBTyxRQUFRLENBQUMsV0FBVCxDQUFBLENBQWIsR0FBQTtBQUNFLE1BQUEsU0FBQSxHQUFZLGlCQUFpQixDQUFDLEtBQWxCLENBQXdCLElBQXhCLENBQVosQ0FBQTtBQUNBLE1BQUEsSUFBNkIsU0FBN0I7QUFBQSxRQUFBLFVBQVUsQ0FBQyxHQUFYLENBQWUsU0FBZixDQUFBLENBQUE7T0FGRjtJQUFBLENBSEE7V0FPQSxXQVJpQjtFQUFBLENBOURuQixDQUFBOztBQUFBLHFCQTJFQSxjQUFBLEdBQWdCLFNBQUMsSUFBRCxHQUFBO0FBQ2QsUUFBQSw2QkFBQTtBQUFBLElBQUEsUUFBQSxHQUFlLElBQUEsaUJBQUEsQ0FBa0IsSUFBbEIsQ0FBZixDQUFBO0FBQUEsSUFDQSxtQkFBQSxHQUFzQixJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBQSxDQUR0QixDQUFBO0FBR0EsV0FBTSxJQUFBLEdBQU8sUUFBUSxDQUFDLFdBQVQsQ0FBQSxDQUFiLEdBQUE7QUFDRSxNQUFBLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixJQUFyQixFQUEyQixtQkFBM0IsQ0FBQSxDQURGO0lBQUEsQ0FIQTtXQU1BLG9CQVBjO0VBQUEsQ0EzRWhCLENBQUE7O0FBQUEscUJBcUZBLGNBQUEsR0FBZ0IsU0FBQyxJQUFELEVBQU8sSUFBUCxHQUFBO0FBQ2QsUUFBQSxtQkFBQTtBQUFBLElBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLElBQ0EsS0FBSyxDQUFDLFFBQU4sQ0FBZSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQTFCLENBREEsQ0FBQTtBQUFBLElBR0EsWUFBQSxHQUFlLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxDQUFDLFNBQWhCLENBSGYsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFBLENBQVYsR0FBcUIsWUFBSCxHQUFxQixZQUFyQixHQUF1QyxFQUp6RCxDQUFBO1dBS0EsSUFBSSxDQUFDLFNBQUwsR0FBaUIsR0FOSDtFQUFBLENBckZoQixDQUFBOztBQUFBLHFCQThGQSxlQUFBLEdBQWlCLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtXQUVmLElBQUksQ0FBQyxTQUFMLEdBQWlCLEdBRkY7RUFBQSxDQTlGakIsQ0FBQTs7QUFBQSxxQkFtR0EsVUFBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUNWLFFBQUEsWUFBQTtBQUFBLElBQUEsWUFBQSxHQUFlLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxDQUFDLFNBQWhCLENBQWYsQ0FBQTtBQUNBLElBQUEsSUFBa0MsWUFBbEM7QUFBQSxNQUFBLElBQUMsQ0FBQSxRQUFTLENBQUEsSUFBQSxDQUFWLEdBQWtCLFlBQWxCLENBQUE7S0FEQTtXQUVBLElBQUksQ0FBQyxTQUFMLEdBQWlCLEdBSFA7RUFBQSxDQW5HWixDQUFBOztBQUFBLHFCQTZHQSxJQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ0osUUFBQSw2QkFBQTtBQUFBLElBQUEsR0FBQSxHQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQVA7QUFBQSxNQUNBLE1BQUEscUNBQWUsQ0FBRSxhQURqQjtBQUFBLE1BRUEsVUFBQSxFQUFZLEVBRlo7QUFBQSxNQUdBLFVBQUEsRUFBWSxFQUhaO0tBREYsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNmLFlBQUEsVUFBQTtBQUFBLFFBQUUsaUJBQUEsSUFBRixFQUFRLGlCQUFBLElBQVIsQ0FBQTtlQUNBLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBZixDQUFvQjtBQUFBLFVBQUUsTUFBQSxJQUFGO0FBQUEsVUFBUSxNQUFBLElBQVI7U0FBcEIsRUFGZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLENBTkEsQ0FBQTtBQVdBO0FBQUEsU0FBQSxhQUFBOzBCQUFBO0FBQ0UsTUFBQSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQWYsQ0FBb0I7QUFBQSxRQUFFLE1BQUEsSUFBRjtBQUFBLFFBQVEsSUFBQSxFQUFNLGdCQUFkO09BQXBCLENBQUEsQ0FERjtBQUFBLEtBWEE7QUFBQSxJQWNBLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBZixDQUFvQixVQUFwQixDQWRBLENBQUE7QUFBQSxJQWVBLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBZixDQUFvQixVQUFwQixDQWZBLENBQUE7V0FnQkEsSUFqQkk7RUFBQSxDQTdHTixDQUFBOztrQkFBQTs7SUE1QkYsQ0FBQTs7QUFBQSxRQWlLUSxDQUFDLGVBQVQsR0FBMkIsU0FBQyxVQUFELEdBQUE7QUFDekIsTUFBQSxLQUFBO0FBQUEsRUFBQSxJQUFBLENBQUEsVUFBQTtBQUFBLFVBQUEsQ0FBQTtHQUFBO0FBQUEsRUFFQSxLQUFBLEdBQVEsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FGUixDQUFBO0FBR0EsRUFBQSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0U7QUFBQSxNQUFFLFVBQUEsRUFBWSxNQUFkO0FBQUEsTUFBeUIsSUFBQSxFQUFNLEtBQU0sQ0FBQSxDQUFBLENBQXJDO01BREY7R0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDSDtBQUFBLE1BQUUsVUFBQSxFQUFZLEtBQU0sQ0FBQSxDQUFBLENBQXBCO0FBQUEsTUFBd0IsSUFBQSxFQUFNLEtBQU0sQ0FBQSxDQUFBLENBQXBDO01BREc7R0FBQSxNQUFBO1dBR0gsR0FBRyxDQUFDLEtBQUosQ0FBVyxpREFBQSxHQUFkLFVBQUcsRUFIRztHQU5vQjtBQUFBLENBakszQixDQUFBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsInZhciBTY2hlbWUsIGpTY2hlbWU7XG5cblNjaGVtZSA9IHJlcXVpcmUoJy4vc2NoZW1lJyk7XG5cbmpTY2hlbWUgPSBuZXcgU2NoZW1lKCk7XG5cbmpTY2hlbWVbXCJuZXdcIl0gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBTY2hlbWUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0galNjaGVtZTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93ICE9PSBudWxsKSB7XG4gIHdpbmRvdy5qU2NoZW1lID0galNjaGVtZTtcbn1cbiIsInZhciBQcm9wZXJ0eVZhbGlkYXRvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wZXJ0eVZhbGlkYXRvciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHRlcm1SZWdleDtcblxuICB0ZXJtUmVnZXggPSAvXFx3W1xcdyBdKlxcdy9nO1xuXG4gIGZ1bmN0aW9uIFByb3BlcnR5VmFsaWRhdG9yKF9hcmcpIHtcbiAgICB2YXIgX3JlZjtcbiAgICB0aGlzLmlucHV0U3RyaW5nID0gX2FyZy5pbnB1dFN0cmluZywgdGhpcy5zY2hlbWUgPSBfYXJnLnNjaGVtZSwgdGhpcy5wcm9wZXJ0eSA9IF9hcmcucHJvcGVydHksIHRoaXMucGFyZW50ID0gX2FyZy5wYXJlbnQ7XG4gICAgdGhpcy52YWxpZGF0b3JzID0gW107XG4gICAgdGhpcy5sb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zY2hlbWUucHJvcGVydGllc1JlcXVpcmVkKSB7XG4gICAgICBpZiAoKF9yZWYgPSB0aGlzLnBhcmVudCkgIT0gbnVsbCkge1xuICAgICAgICBfcmVmLmFkZFJlcXVpcmVkUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWRkVmFsaWRhdGlvbnModGhpcy5pbnB1dFN0cmluZyk7XG4gIH1cblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuZ2V0TG9jYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5wcm9wZXJ0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQubG9jYXRpb24gKyB0aGlzLnNjaGVtZS53cml0ZVByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zY2hlbWUud3JpdGVQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICB9XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmdldFByb3BMb2NhdGlvbiA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBcIlwiICsgdGhpcy5sb2NhdGlvbiArICh0aGlzLnNjaGVtZS53cml0ZVByb3BlcnR5KGtleSkpO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5hZGRWYWxpZGF0aW9ucyA9IGZ1bmN0aW9uKGNvbmZpZ1N0cmluZykge1xuICAgIHZhciByZXN1bHQsIHRlcm0sIHR5cGVzO1xuICAgIHdoaWxlIChyZXN1bHQgPSB0ZXJtUmVnZXguZXhlYyhjb25maWdTdHJpbmcpKSB7XG4gICAgICB0ZXJtID0gcmVzdWx0WzBdO1xuICAgICAgaWYgKHRlcm0gPT09ICdvcHRpb25hbCcpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQucmVtb3ZlUmVxdWlyZWRQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICAgIH0gZWxzZSBpZiAodGVybSA9PT0gJ3JlcXVpcmVkJykge1xuICAgICAgICB0aGlzLnBhcmVudC5hZGRSZXF1aXJlZFByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgICAgfSBlbHNlIGlmICh0ZXJtLmluZGV4T2YoJ2FycmF5IG9mICcpID09PSAwKSB7XG4gICAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKCdhcnJheScpO1xuICAgICAgICB0aGlzLmFycmF5VmFsaWRhdG9yID0gdGVybS5zbGljZSg5KTtcbiAgICAgIH0gZWxzZSBpZiAodGVybS5pbmRleE9mKCcgb3IgJykgIT09IC0xKSB7XG4gICAgICAgIHR5cGVzID0gdGVybS5zcGxpdCgnIG9yICcpO1xuICAgICAgICBjb25zb2xlLmxvZygndG9kbycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godGVybSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2b2lkIDA7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24odmFsdWUsIGVycm9ycykge1xuICAgIHZhciBpc1ZhbGlkLCBuYW1lLCB2YWxpZCwgdmFsaWRhdG9yLCB2YWxpZGF0b3JzLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICBpZiAoKHZhbHVlID09IG51bGwpICYmIHRoaXMuaXNPcHRpb25hbCgpKSB7XG4gICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICB9XG4gICAgdmFsaWRhdG9ycyA9IHRoaXMuc2NoZW1lLnZhbGlkYXRvcnM7XG4gICAgX3JlZiA9IHRoaXMudmFsaWRhdG9ycyB8fCBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG5hbWUgPSBfcmVmW19pXTtcbiAgICAgIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbbmFtZV07XG4gICAgICBpZiAodmFsaWRhdG9yID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycy5hZGQoXCJtaXNzaW5nIHZhbGlkYXRvciBcIiArIG5hbWUsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5sb2NhdGlvblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWxpZCA9IHZhbGlkYXRvcih2YWx1ZSkgPT09IHRydWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlcnJvcnMuYWRkKHZhbGlkLCB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLmxvY2F0aW9uLFxuICAgICAgICBkZWZhdWx0TWVzc2FnZTogXCJcIiArIG5hbWUgKyBcIiB2YWxpZGF0b3IgZmFpbGVkXCJcbiAgICAgIH0pO1xuICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIShpc1ZhbGlkID0gdGhpcy52YWxpZGF0ZUFycmF5KHZhbHVlLCBlcnJvcnMpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIShpc1ZhbGlkID0gdGhpcy52YWxpZGF0ZVJlcXVpcmVkUHJvcGVydGllcyh2YWx1ZSwgZXJyb3JzKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVycm9ycykge1xuICAgIHZhciBlbnRyeSwgaW5kZXgsIGlzVmFsaWQsIGxvY2F0aW9uLCByZXMsIHZhbGlkYXRvciwgX2ksIF9sZW4sIF9yZWY7XG4gICAgaWYgKHRoaXMuYXJyYXlWYWxpZGF0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgIHZhbGlkYXRvciA9IHRoaXMuc2NoZW1lLnZhbGlkYXRvcnNbdGhpcy5hcnJheVZhbGlkYXRvcl07XG4gICAgaWYgKHZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZXJyb3JzLmFkZChcIm1pc3NpbmcgdmFsaWRhdG9yIFwiICsgdGhpcy5hcnJheVZhbGlkYXRvciwge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5sb2NhdGlvblxuICAgICAgfSk7XG4gICAgfVxuICAgIF9yZWYgPSBhcnIgfHwgW107XG4gICAgZm9yIChpbmRleCA9IF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IGluZGV4ID0gKytfaSkge1xuICAgICAgZW50cnkgPSBfcmVmW2luZGV4XTtcbiAgICAgIHJlcyA9IHZhbGlkYXRvcihlbnRyeSk7XG4gICAgICBpZiAocmVzID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbG9jYXRpb24gPSBcIlwiICsgdGhpcy5sb2NhdGlvbiArIFwiW1wiICsgaW5kZXggKyBcIl1cIjtcbiAgICAgIGVycm9ycy5hZGQocmVzLCB7XG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgZGVmYXVsdE1lc3NhZ2U6IFwiXCIgKyB0aGlzLmFycmF5VmFsaWRhdG9yICsgXCIgdmFsaWRhdG9yIGZhaWxlZFwiXG4gICAgICB9KTtcbiAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlT3RoZXJQcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGVycm9ycykge1xuICAgIHZhciBpc1ZhbGlkO1xuICAgIGlmICh0aGlzLm90aGVyUHJvcGVydHlWYWxpZGF0b3IgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zY2hlbWUuZXJyb3JzID0gdm9pZCAwO1xuICAgICAgaWYgKGlzVmFsaWQgPSB0aGlzLm90aGVyUHJvcGVydHlWYWxpZGF0b3IuY2FsbCh0aGlzLCBrZXksIHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNjaGVtZS5lcnJvcnMgIT0gbnVsbCkge1xuICAgICAgICBlcnJvcnMuam9pbih0aGlzLnNjaGVtZS5lcnJvcnMsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5nZXRQcm9wTG9jYXRpb24oa2V5KVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9ycy5hZGQoXCJhZGRpdGlvbmFsIHByb3BlcnR5IGNoZWNrIGZhaWxlZFwiLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnNjaGVtZS5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLmFkZChcInVuc3BlY2lmaWVkIGFkZGl0aW9uYWwgcHJvcGVydHlcIiwge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmdldFByb3BMb2NhdGlvbihrZXkpXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS52YWxpZGF0ZVJlcXVpcmVkUHJvcGVydGllcyA9IGZ1bmN0aW9uKG9iaiwgZXJyb3JzKSB7XG4gICAgdmFyIGlzUmVxdWlyZWQsIGlzVmFsaWQsIGtleSwgX3JlZjtcbiAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICBfcmVmID0gdGhpcy5yZXF1aXJlZFByb3BlcnRpZXM7XG4gICAgZm9yIChrZXkgaW4gX3JlZikge1xuICAgICAgaXNSZXF1aXJlZCA9IF9yZWZba2V5XTtcbiAgICAgIGlmICgob2JqW2tleV0gPT0gbnVsbCkgJiYgaXNSZXF1aXJlZCkge1xuICAgICAgICBlcnJvcnMuYWRkKFwicmVxdWlyZWQgcHJvcGVydHkgbWlzc2luZ1wiLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmFkZFJlcXVpcmVkUHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAodGhpcy5yZXF1aXJlZFByb3BlcnRpZXMgPT0gbnVsbCkge1xuICAgICAgdGhpcy5yZXF1aXJlZFByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzW2tleV0gPSB0cnVlO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5yZW1vdmVSZXF1aXJlZFByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdGhpcy5yZXF1aXJlZFByb3BlcnRpZXMpICE9IG51bGwgPyBfcmVmW2tleV0gPSB2b2lkIDAgOiB2b2lkIDA7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmlzT3B0aW9uYWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuICF0aGlzLnBhcmVudC5yZXF1aXJlZFByb3BlcnRpZXNbdGhpcy5wcm9wZXJ0eV0gPT09IHRydWU7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBQcm9wZXJ0eVZhbGlkYXRvcjtcblxufSkoKTtcbiIsInZhciBQcm9wZXJ0eVZhbGlkYXRvciwgU2NoZW1lLCBWYWxpZGF0aW9uRXJyb3JzLCB0eXBlLCB2YWxpZGF0b3JzO1xuXG5WYWxpZGF0aW9uRXJyb3JzID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uX2Vycm9ycycpO1xuXG5Qcm9wZXJ0eVZhbGlkYXRvciA9IHJlcXVpcmUoJy4vcHJvcGVydHlfdmFsaWRhdG9yJyk7XG5cbnZhbGlkYXRvcnMgPSByZXF1aXJlKCcuL3ZhbGlkYXRvcnMnKTtcblxudHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVtZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGpzVmFyaWFibGVOYW1lO1xuXG4gIGpzVmFyaWFibGVOYW1lID0gL15bYS16QS1aXVxcdyokLztcblxuICBmdW5jdGlvbiBTY2hlbWUoKSB7XG4gICAgdGhpcy52YWxpZGF0b3JzID0gT2JqZWN0LmNyZWF0ZSh2YWxpZGF0b3JzKTtcbiAgICB0aGlzLnNjaGVtYXMgPSB7fTtcbiAgICB0aGlzLnByb3BlcnRpZXNSZXF1aXJlZCA9IHRydWU7XG4gICAgdGhpcy5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzID0gdHJ1ZTtcbiAgfVxuXG4gIFNjaGVtZS5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHRoaXMucHJvcGVydGllc1JlcXVpcmVkID0gX2FyZy5wcm9wZXJ0aWVzUmVxdWlyZWQsIHRoaXMuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcyA9IF9hcmcuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG5hbWUsIHNjaGVtYSkge1xuICAgIGlmICh0eXBlLmlzRnVuY3Rpb24oc2NoZW1hKSkge1xuICAgICAgdGhpcy5hZGRWYWxpZGF0b3IobmFtZSwgc2NoZW1hKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRTY2hlbWEobmFtZSwgdGhpcy5wYXJzZUNvbmZpZ09iaihzY2hlbWEsIHZvaWQgMCwgbmFtZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZFNjaGVtYSA9IGZ1bmN0aW9uKG5hbWUsIHNjaGVtYSkge1xuICAgIGlmICh0aGlzLnZhbGlkYXRvcnNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSB2YWxpZGF0b3IgaXMgYWxyZWR5IHJlZ2lzdGVyZWQgdW5kZXIgdGhpcyBuYW1lOiBcIiArIG5hbWUpO1xuICAgIH1cbiAgICB0aGlzLnNjaGVtYXNbbmFtZV0gPSBzY2hlbWE7XG4gICAgdGhpcy52YWxpZGF0b3JzW25hbWVdID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIGVycm9ycztcbiAgICAgICAgZXJyb3JzID0gX3RoaXMucmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hLCB2YWx1ZSk7XG4gICAgICAgIGlmIChlcnJvcnMuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkVmFsaWRhdG9yID0gZnVuY3Rpb24obmFtZSwgZnVuYykge1xuICAgIHRoaXMudmFsaWRhdG9yc1tuYW1lXSA9IGZ1bmM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHNjaGVtYU5hbWUsIG9iaikge1xuICAgIHZhciBzY2hlbWE7XG4gICAgdGhpcy5lcnJvcnMgPSB2b2lkIDA7XG4gICAgc2NoZW1hID0gdGhpcy5zY2hlbWFzW3NjaGVtYU5hbWVdO1xuICAgIGlmIChzY2hlbWEgPT0gbnVsbCkge1xuICAgICAgdGhpcy5lcnJvcnMgPSBuZXcgVmFsaWRhdGlvbkVycm9ycygpO1xuICAgICAgdGhpcy5lcnJvcnMuYWRkKFwibWlzc2luZyBzY2hlbWFcIiwge1xuICAgICAgICBsb2NhdGlvbjogc2NoZW1hTmFtZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXJyb3JzID0gdGhpcy5yZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWEsIG9iaikuc2V0Um9vdChzY2hlbWFOYW1lKTtcbiAgICByZXR1cm4gIXRoaXMuZXJyb3JzLmhhc0Vycm9ycygpO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuaGFzRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdGhpcy5lcnJvcnMpICE9IG51bGwgPyBfcmVmLmhhc0Vycm9ycygpIDogdm9pZCAwO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuZ2V0RXJyb3JNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHRoaXMuZXJyb3JzKSAhPSBudWxsID8gX3JlZi5nZXRNZXNzYWdlcygpIDogdm9pZCAwO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUucmVjdXJzaXZlVmFsaWRhdGUgPSBmdW5jdGlvbihzY2hlbWFPYmosIG9iaikge1xuICAgIHZhciBlcnJvcnMsIGlzVmFsaWQsIGtleSwgcGFyZW50VmFsaWRhdG9yLCBwcm9wZXJ0eVZhbGlkYXRvciwgdmFsdWU7XG4gICAgcGFyZW50VmFsaWRhdG9yID0gc2NoZW1hT2JqWydfX3ZhbGlkYXRvciddO1xuICAgIGVycm9ycyA9IG5ldyBWYWxpZGF0aW9uRXJyb3JzKCk7XG4gICAgcGFyZW50VmFsaWRhdG9yLnZhbGlkYXRlKG9iaiwgZXJyb3JzKTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAoc2NoZW1hT2JqW2tleV0gIT0gbnVsbCkge1xuICAgICAgICBwcm9wZXJ0eVZhbGlkYXRvciA9IHNjaGVtYU9ialtrZXldWydfX3ZhbGlkYXRvciddO1xuICAgICAgICBpc1ZhbGlkID0gcHJvcGVydHlWYWxpZGF0b3IudmFsaWRhdGUodmFsdWUsIGVycm9ycyk7XG4gICAgICAgIGlmIChpc1ZhbGlkICYmIChwcm9wZXJ0eVZhbGlkYXRvci5jaGlsZFNjaGVtYU5hbWUgPT0gbnVsbCkgJiYgdHlwZS5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICBlcnJvcnMuam9pbih0aGlzLnJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYU9ialtrZXldLCB2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnRWYWxpZGF0b3IudmFsaWRhdGVPdGhlclByb3BlcnR5KGtleSwgdmFsdWUsIGVycm9ycyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvcnM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5wYXJzZUNvbmZpZ09iaiA9IGZ1bmN0aW9uKG9iaiwgcGFyZW50VmFsaWRhdG9yKSB7XG4gICAgdmFyIGtleSwgcHJvcFZhbGlkYXRvciwgdmFsdWU7XG4gICAgaWYgKHBhcmVudFZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICBwYXJlbnRWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3Ioe1xuICAgICAgICBpbnB1dFN0cmluZzogJ29iamVjdCcsXG4gICAgICAgIHNjaGVtZTogdGhpc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmICh0aGlzLmFkZFBhcmVudFZhbGlkYXRvcihwYXJlbnRWYWxpZGF0b3IsIGtleSwgdmFsdWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHByb3BWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3Ioe1xuICAgICAgICAgIGlucHV0U3RyaW5nOiB2YWx1ZSxcbiAgICAgICAgICBwcm9wZXJ0eToga2V5LFxuICAgICAgICAgIHBhcmVudDogcGFyZW50VmFsaWRhdG9yLFxuICAgICAgICAgIHNjaGVtZTogdGhpc1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqW2tleV0gPSB7XG4gICAgICAgICAgJ19fdmFsaWRhdG9yJzogcHJvcFZhbGlkYXRvclxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICh0eXBlLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICBwcm9wVmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKHtcbiAgICAgICAgICBpbnB1dFN0cmluZzogJ29iamVjdCcsXG4gICAgICAgICAgcHJvcGVydHk6IGtleSxcbiAgICAgICAgICBwYXJlbnQ6IHBhcmVudFZhbGlkYXRvcixcbiAgICAgICAgICBzY2hlbWU6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgICAgIG9ialtrZXldID0gdGhpcy5wYXJzZUNvbmZpZ09iaih2YWx1ZSwgcHJvcFZhbGlkYXRvcik7XG4gICAgICB9XG4gICAgfVxuICAgIG9ialsnX192YWxpZGF0b3InXSA9IHBhcmVudFZhbGlkYXRvcjtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkUGFyZW50VmFsaWRhdG9yID0gZnVuY3Rpb24ocGFyZW50VmFsaWRhdG9yLCBrZXksIHZhbGlkYXRvcikge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlICdfX3ZhbGlkYXRlJzpcbiAgICAgICAgcGFyZW50VmFsaWRhdG9yLmFkZFZhbGlkYXRpb25zKHZhbGlkYXRvcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnX19hZGRpdGlvbmFsUHJvcGVydHknOlxuICAgICAgICBpZiAodHlwZS5pc0Z1bmN0aW9uKHZhbGlkYXRvcikpIHtcbiAgICAgICAgICBwYXJlbnRWYWxpZGF0b3Iub3RoZXJQcm9wZXJ0eVZhbGlkYXRvciA9IHZhbGlkYXRvcjtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS53cml0ZVByb3BlcnR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAoanNWYXJpYWJsZU5hbWUudGVzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBcIi5cIiArIHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJbJ1wiICsgdmFsdWUgKyBcIiddXCI7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBTY2hlbWU7XG5cbn0pKCk7XG4iLCJ2YXIgdG9TdHJpbmcsIHR5cGU7XG5cbnRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSB0eXBlID0ge1xuICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHQ7XG4gICAgdCA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHQgPT09ICdvYmplY3QnICYmICEhb2JqICYmICF0aGlzLmlzQXJyYXkob2JqKTtcbiAgfSxcbiAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH1cbn07XG5cblsnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCcsICdBcnJheSddLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gdHlwZVtcImlzXCIgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09IChcIltvYmplY3QgXCIgKyBuYW1lICsgXCJdXCIpO1xuICB9O1xufSk7XG5cbmlmIChBcnJheS5pc0FycmF5KSB7XG4gIHR5cGUuaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG59XG4iLCJ2YXIgVmFsaWRhdGlvbkVycm9ycywgdHlwZTtcblxudHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRpb25FcnJvcnMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFZhbGlkYXRpb25FcnJvcnMoKSB7fVxuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmhhc0Vycm9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVycm9ycyAhPSBudWxsO1xuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLnNldFJvb3QgPSBmdW5jdGlvbihyb290KSB7XG4gICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihtZXNzYWdlLCBfYXJnKSB7XG4gICAgdmFyIGRlZmF1bHRNZXNzYWdlLCBlcnJvciwgbG9jYXRpb24sIF9yZWY7XG4gICAgX3JlZiA9IF9hcmcgIT0gbnVsbCA/IF9hcmcgOiB7fSwgbG9jYXRpb24gPSBfcmVmLmxvY2F0aW9uLCBkZWZhdWx0TWVzc2FnZSA9IF9yZWYuZGVmYXVsdE1lc3NhZ2U7XG4gICAgaWYgKG1lc3NhZ2UgPT09IGZhbHNlKSB7XG4gICAgICBtZXNzYWdlID0gZGVmYXVsdE1lc3NhZ2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmVycm9ycyA9PSBudWxsKSB7XG4gICAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgIH1cbiAgICBpZiAodHlwZS5pc1N0cmluZyhtZXNzYWdlKSkge1xuICAgICAgdGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgIHBhdGg6IGxvY2F0aW9uLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3JzKSB7XG4gICAgICB0aGlzLmpvaW4obWVzc2FnZSwge1xuICAgICAgICBsb2NhdGlvbjogbG9jYXRpb25cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5wYXRoICYmIG1lc3NhZ2UubWVzc2FnZSkge1xuICAgICAgZXJyb3IgPSBtZXNzYWdlO1xuICAgICAgdGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgIHBhdGg6IGxvY2F0aW9uICsgZXJyb3IucGF0aCxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVmFsaWRhdGlvbkVycm9yLmFkZCgpIHVua25vd24gZXJyb3IgdHlwZScpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uKF9hcmcsIF9hcmcxKSB7XG4gICAgdmFyIGVycm9yLCBlcnJvcnMsIGxvY2F0aW9uLCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgZXJyb3JzID0gX2FyZy5lcnJvcnM7XG4gICAgbG9jYXRpb24gPSAoX2FyZzEgIT0gbnVsbCA/IF9hcmcxIDoge30pLmxvY2F0aW9uO1xuICAgIGlmIChlcnJvcnMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuZXJyb3JzID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGVycm9ycy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBlcnJvciA9IGVycm9yc1tfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2godGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgICAgcGF0aDogKGxvY2F0aW9uIHx8ICcnKSArIGVycm9yLnBhdGgsXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfVxuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmdldE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVycm9yLCBtZXNzYWdlcywgX2ksIF9sZW4sIF9yZWY7XG4gICAgbWVzc2FnZXMgPSBbXTtcbiAgICBfcmVmID0gdGhpcy5lcnJvcnMgfHwgW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBlcnJvciA9IF9yZWZbX2ldO1xuICAgICAgbWVzc2FnZXMucHVzaChcIlwiICsgKHRoaXMucm9vdCB8fCAnJykgKyBlcnJvci5wYXRoICsgXCI6IFwiICsgZXJyb3IubWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlcztcbiAgfTtcblxuICByZXR1cm4gVmFsaWRhdGlvbkVycm9ycztcblxufSkoKTtcbiIsInZhciB0eXBlO1xuXG50eXBlID0gcmVxdWlyZSgnLi90eXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnb2JqZWN0JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc09iamVjdCh2YWx1ZSk7XG4gIH0sXG4gICdzdHJpbmcnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzU3RyaW5nKHZhbHVlKTtcbiAgfSxcbiAgJ2Jvb2xlYW4nOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzQm9vbGVhbih2YWx1ZSk7XG4gIH0sXG4gICdudW1iZXInOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzTnVtYmVyKHZhbHVlKTtcbiAgfSxcbiAgJ2Z1bmN0aW9uJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0Z1bmN0aW9uKHZhbHVlKTtcbiAgfSxcbiAgJ2RhdGUnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzRGF0ZSh2YWx1ZSk7XG4gIH0sXG4gICdyZWdleHAnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzUmVnRXhwKHZhbHVlKTtcbiAgfSxcbiAgJ2FycmF5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0FycmF5KHZhbHVlKTtcbiAgfSxcbiAgJ2ZhbHN5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gISF2YWx1ZSA9PT0gZmFsc2U7XG4gIH0sXG4gICd0cnV0aHknOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlID09PSB0cnVlO1xuICB9LFxuICAnbm90IGVtcHR5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gISF2YWx1ZSA9PT0gdHJ1ZTtcbiAgfSxcbiAgJ2RlcHJlY2F0ZWQnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi45IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG4gICAgICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuICAgICAqXG4gICAgICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG4gICAgLy8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcbiAgICB2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuICAgIHZhciBleHBvcnRzID0gdGhpcztcbiAgICB2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0cyBzdG9yYWdlIGFycmF5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cbiAgICAgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG4gICAgICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG4gICAgICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG4gICAgICAgIC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgICAgaWYgKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICovXG4gICAgcHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG4gICAgICAgIHZhciBmbGF0TGlzdGVuZXJzID0gW107XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuICAgICAqL1xuICAgIHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAgICAgaWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IHt9O1xuICAgICAgICAgICAgcmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cbiAgICAgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG4gICAgLyoqXG4gICAgICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcbiAgICAgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXRzIGZpcnN0IGV4ZWN1dGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG4gICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICBvbmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG4gICAgICovXG4gICAgcHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG4gICAgICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuICAgICAgICB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGluZGV4O1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuICAgICAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuICAgICAgICAvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuICAgICAgICByZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cbiAgICAgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICB2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG4gICAgICAgIHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cbiAgICAgICAgLy8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdHMgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuICAgICAgICBpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2RcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcbiAgICAgICAgICAgIC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcbiAgICAgICAgICAgIC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG4gICAgICAgICAgICBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICAvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuICAgICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW2V2dF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cbiAgICAgKlxuICAgICAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cbiAgICAgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG4gICAgICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuICAgICAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGxpc3RlbmVyO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgZW1pdEV2ZW50XG4gICAgICovXG4gICAgcHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuICAgIC8qKlxuICAgICAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cbiAgICAgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG4gICAgICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuICAgICAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG4gICAgICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuICAgICAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuICAgICAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cbiAgICAgKi9cbiAgICBFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcbiAgICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICB9O1xuXG4gICAgLy8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3RcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuICAgIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcnKVxuTGl2aW5nZG9jID0gcmVxdWlyZSgnLi9saXZpbmdkb2MnKVxuQ29tcG9uZW50VHJlZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUnKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5Kc0xvYWRlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9qc19sb2FkZXInKVxuQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXInKVxudmVyc2lvbiA9IHJlcXVpcmUoJy4uL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuICAjIFNldCB0aGUgY3VycmVudCB2ZXJzaW9uXG4gIHZlcnNpb246IHZlcnNpb24udmVyc2lvblxuICByZXZpc2lvbjogdmVyc2lvbi5yZXZpc2lvblxuXG5cbiAgIyBMb2FkIGFuZCBhY2Nlc3MgZGVzaWducy5cbiAgI1xuICAjIExvYWQgYSBkZXNpZ246XG4gICMgZGVzaWduLmxvYWQoeW91ckRlc2lnbkpzb24pXG4gICNcbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBhbHJlYWR5IGxvYWRlZDpcbiAgIyBkZXNpZ24uaGFzKG5hbWVPZllvdXJEZXNpZ24pXG4gICNcbiAgIyBHZXQgYW4gYWxyZWFkeSBsb2FkZWQgZGVzaWduOlxuICAjIGRlc2lnbi5nZXQobmFtZU9mWW91ckRlc2lnbilcbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG5cbiAgIyBEaXJlY3QgYWNjZXNzIHRvIG1vZGVsc1xuICBMaXZpbmdkb2M6IExpdmluZ2RvY1xuICBDb21wb25lbnRUcmVlOiBDb21wb25lbnRUcmVlXG5cblxuICAjIExvYWQgYSBsaXZpbmdkb2MgZnJvbSBzZXJpYWxpemVkIGRhdGEgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBjcmVhdGVMaXZpbmdkb2M6ICh7IGRhdGEsIGRlc2lnbiwgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIExpdmluZ2RvYy5jcmVhdGUoeyBkYXRhLCBkZXNpZ25OYW1lOiBkZXNpZ24sIGNvbXBvbmVudFRyZWUgfSlcblxuXG4gICMgQWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIG5ldzogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIGNyZWF0ZTogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuXG4gICMgQ2hhbmdlIHRoZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cbiAgIyBFeHBvc2UgbW9kdWxlcyBhbmQgY2xhc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBlZGl0b3JcbiAgSnNMb2FkZXI6IEpzTG9hZGVyXG4gIENzc0xvYWRlcjogQ3NzTG9hZGVyXG5cblxuXG5cbiMgRXhwb3J0IGdsb2JhbCB2YXJpYWJsZVxud2luZG93LmRvYyA9IGRvY1xuXG4iLCIjIGpRdWVyeSBsaWtlIHJlc3VsdHMgd2hlbiBzZWFyY2hpbmcgZm9yIGNvbXBvbmVudHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIENvbXBvbmVudEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIENvbXBvbmVudEFycmF5IHZpYSBgZG9jLmZuYC5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50QXJyYXlcblxuXG4gICMgQHBhcmFtIGNvbXBvbmVudHM6IGFycmF5IG9mIGNvbXBvbmVudHNcbiAgY29uc3RydWN0b3I6IChAY29tcG9uZW50cykgLT5cbiAgICBAY29tcG9uZW50cyA/PSBbXVxuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAY29tcG9uZW50c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAY29tcG9uZW50cy5sZW5ndGhcbiAgICBpZiBAY29tcG9uZW50cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAY29tcG9uZW50cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBjb21wb25lbnQgaW4gQGNvbXBvbmVudHNcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgY29tcG9uZW50LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBDb21wb25lbnRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIENvbXBvbmVudENvbnRhaW5lciBjb250YWlucyBhbmQgbWFuYWdlcyBhIGxpbmtlZCBsaXN0XG4jIG9mIGNvbXBvbmVudHMuXG4jXG4jIFRoZSBjb21wb25lbnRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIGNvbXBvbmVudFRyZWVcbiMgaW5mb3JtZWQgYWJvdXQgY2hhbmdlcyAob25seSBpZiB0aGV5IGFyZSBhdHRhY2hlZCB0byBvbmUpLlxuI1xuIyBAcHJvcCBmaXJzdDogZmlyc3QgY29tcG9uZW50IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBjb21wb25lbnQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRDb21wb25lbnQ6IHBhcmVudCBDb21wb25lbnRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50Q29tcG9uZW50LCBAbmFtZSwgaXNSb290IH0pIC0+XG4gICAgQGlzUm9vdCA9IGlzUm9vdD9cbiAgICBAZmlyc3QgPSBAbGFzdCA9IHVuZGVmaW5lZFxuXG5cbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChjb21wb25lbnQpIC0+XG4gICAgaWYgQHBhcmVudENvbXBvbmVudFxuICAgICAgYXNzZXJ0IGNvbXBvbmVudCBpc250IEBwYXJlbnRDb21wb25lbnQsICdjYW5ub3QgYXBwZW5kIGNvbXBvbmVudCB0byBpdHNlbGYnXG5cbiAgICBpZiBAbGFzdFxuICAgICAgQGluc2VydEFmdGVyKEBsYXN0LCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cbiAgICB0aGlzXG5cblxuICBpbnNlcnRCZWZvcmU6IChjb21wb25lbnQsIGluc2VydGVkQ29tcG9uZW50KSAtPlxuICAgIHJldHVybiBpZiBjb21wb25lbnQucHJldmlvdXMgPT0gaW5zZXJ0ZWRDb21wb25lbnRcbiAgICBhc3NlcnQgY29tcG9uZW50IGlzbnQgaW5zZXJ0ZWRDb21wb25lbnQsICdjYW5ub3QgaW5zZXJ0IGNvbXBvbmVudCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IGNvbXBvbmVudC5wcmV2aW91c1xuICAgICAgbmV4dDogY29tcG9uZW50XG4gICAgICBwYXJlbnRDb250YWluZXI6IGNvbXBvbmVudC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hDb21wb25lbnQoaW5zZXJ0ZWRDb21wb25lbnQsIHBvc2l0aW9uKVxuXG5cbiAgaW5zZXJ0QWZ0ZXI6IChjb21wb25lbnQsIGluc2VydGVkQ29tcG9uZW50KSAtPlxuICAgIHJldHVybiBpZiBjb21wb25lbnQubmV4dCA9PSBpbnNlcnRlZENvbXBvbmVudFxuICAgIGFzc2VydCBjb21wb25lbnQgaXNudCBpbnNlcnRlZENvbXBvbmVudCwgJ2Nhbm5vdCBpbnNlcnQgY29tcG9uZW50IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBjb21wb25lbnRcbiAgICAgIG5leHQ6IGNvbXBvbmVudC5uZXh0XG4gICAgICBwYXJlbnRDb250YWluZXI6IGNvbXBvbmVudC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hDb21wb25lbnQoaW5zZXJ0ZWRDb21wb25lbnQsIHBvc2l0aW9uKVxuXG5cbiAgdXA6IChjb21wb25lbnQpIC0+XG4gICAgaWYgY29tcG9uZW50LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShjb21wb25lbnQucHJldmlvdXMsIGNvbXBvbmVudClcblxuXG4gIGRvd246IChjb21wb25lbnQpIC0+XG4gICAgaWYgY29tcG9uZW50Lm5leHQ/XG4gICAgICBAaW5zZXJ0QWZ0ZXIoY29tcG9uZW50Lm5leHQsIGNvbXBvbmVudClcblxuXG4gIGdldENvbXBvbmVudFRyZWU6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUgfHwgQHBhcmVudENvbXBvbmVudD8uY29tcG9uZW50VHJlZVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29tcG9uZW50c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgY29tcG9uZW50ID0gQGZpcnN0XG4gICAgd2hpbGUgKGNvbXBvbmVudClcbiAgICAgIGNvbXBvbmVudC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBjb21wb25lbnQgPSBjb21wb25lbnQubmV4dFxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29tcG9uZW50cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICBjYWxsYmFjayhjb21wb25lbnQpXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQuZGVzdHJveSgpXG4gICAgQF9kZXRhY2hDb21wb25lbnQoY29tcG9uZW50KVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgRXZlcnkgY29tcG9uZW50IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIGNvbXBvbmVudFRyZWUgaWYgdGhlIHBhcmVudCBjb21wb25lbnQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQGFwaSBwcml2YXRlXG4gIGF0dGFjaENvbXBvbmVudDogKGNvbXBvbmVudCwgcG9zaXRpb24gPSB7fSkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEBsaW5rKGNvbXBvbmVudCwgcG9zaXRpb24pXG5cbiAgICBpZiBjb21wb25lbnRUcmVlID0gQGdldENvbXBvbmVudFRyZWUoKVxuICAgICAgY29tcG9uZW50VHJlZS5hdHRhY2hpbmdDb21wb25lbnQoY29tcG9uZW50LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBFdmVyeSBjb21wb25lbnQgdGhhdCBpcyByZW1vdmVkIG11c3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIGNvbXBvbmVudFRyZWUgaWYgdGhlIHBhcmVudCBjb21wb25lbnQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQ29tcG9uZW50cyB0aGF0IGFyZSBtb3ZlZCBpbnNpZGUgYSBjb21wb25lbnRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hDb21wb25lbnQgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBmaXJlXG4gICMgQ29tcG9uZW50UmVtb3ZlZCBldmVudHMgb24gdGhlIGNvbXBvbmVudFRyZWUsIGluIHRoZXNlXG4gICMgY2FzZXMgdW5saW5rIGNhbiBiZSB1c2VkXG4gICMgQGFwaSBwcml2YXRlXG4gIF9kZXRhY2hDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKGNvbXBvbmVudClcblxuICAgIGlmIGNvbXBvbmVudFRyZWUgPSBAZ2V0Q29tcG9uZW50VHJlZSgpXG4gICAgICBjb21wb25lbnRUcmVlLmRldGFjaGluZ0NvbXBvbmVudChjb21wb25lbnQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoY29tcG9uZW50LCBwb3NpdGlvbikgLT5cbiAgICBAdW5saW5rKGNvbXBvbmVudCkgaWYgY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldENvbXBvbmVudFBvc2l0aW9uKGNvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICB1bmxpbms6IChjb21wb25lbnQpIC0+XG4gICAgY29udGFpbmVyID0gY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuICAgIGlmIGNvbnRhaW5lclxuXG4gICAgICAjIHVwZGF0ZSBwYXJlbnRDb250YWluZXIgbGlua3NcbiAgICAgIGNvbnRhaW5lci5maXJzdCA9IGNvbXBvbmVudC5uZXh0IHVubGVzcyBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IGNvbXBvbmVudC5wcmV2aW91cyB1bmxlc3MgY29tcG9uZW50Lm5leHQ/XG5cbiAgICAgICMgdXBkYXRlIHByZXZpb3VzIGFuZCBuZXh0IG5vZGVzXG4gICAgICBjb21wb25lbnQubmV4dD8ucHJldmlvdXMgPSBjb21wb25lbnQucHJldmlvdXNcbiAgICAgIGNvbXBvbmVudC5wcmV2aW91cz8ubmV4dCA9IGNvbXBvbmVudC5uZXh0XG5cbiAgICAgIEBzZXRDb21wb25lbnRQb3NpdGlvbihjb21wb25lbnQsIHt9KVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgc2V0Q29tcG9uZW50UG9zaXRpb246IChjb21wb25lbnQsIHsgcGFyZW50Q29udGFpbmVyLCBwcmV2aW91cywgbmV4dCB9KSAtPlxuICAgIGNvbXBvbmVudC5wYXJlbnRDb250YWluZXIgPSBwYXJlbnRDb250YWluZXJcbiAgICBjb21wb25lbnQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIGNvbXBvbmVudC5uZXh0ID0gbmV4dFxuXG4gICAgaWYgcGFyZW50Q29udGFpbmVyXG4gICAgICBwcmV2aW91cy5uZXh0ID0gY29tcG9uZW50IGlmIHByZXZpb3VzXG4gICAgICBuZXh0LnByZXZpb3VzID0gY29tcG9uZW50IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IGNvbXBvbmVudCB1bmxlc3MgY29tcG9uZW50LnByZXZpb3VzP1xuICAgICAgcGFyZW50Q29udGFpbmVyLmxhc3QgPSBjb21wb25lbnQgdW5sZXNzIGNvbXBvbmVudC5uZXh0P1xuXG5cbiIsIiMgUHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgYXZhaWxhYmxlOlxuIyBAbmFtZVxuIyBAdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnREaXJlY3RpdmVcblxuICAjXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5zZXRDb250ZW50KEBuYW1lLCB2YWx1ZSlcblxuXG4gICMgU2V0IGRhdGEgdGhhdCB3aWxsIGJlIHBlcnNpc3RlZCBhbG9uZ1xuICAjIHdpdGggdGhlIGNvbXBvbmVudE1vZGVsXG4gIHNldERhdGE6IChrZXksIHZhbHVlKSAtPlxuICAgIGRhdGFTdG9yZSA9IFwiXyN7IEBuYW1lIH1EaXJlY3RpdmVcIlxuICAgIGRpcmVjdGl2ZURhdGEgPSBAY29tcG9uZW50LmdldERhdGEoZGF0YVN0b3JlKVxuICAgIGRpcmVjdGl2ZURhdGEgPz0ge31cbiAgICBkaXJlY3RpdmVEYXRhW2tleV0gPSB2YWx1ZVxuICAgIEBjb21wb25lbnQuc2V0RGF0YShkYXRhU3RvcmUsIGRpcmVjdGl2ZURhdGEpXG5cblxuICBnZXREYXRhOiAoa2V5KSAtPlxuICAgIGlmIGtleVxuICAgICAgQGNvbXBvbmVudC5kYXRhVmFsdWVzW1wiXyN7IEBuYW1lIH1EaXJlY3RpdmVcIl0/W2tleV1cbiAgICBlbHNlXG4gICAgICBAY29tcG9uZW50LmRhdGFWYWx1ZXNbXCJfI3sgQG5hbWUgfURpcmVjdGl2ZVwiXVxuXG5cbiAgIyBTZXQgYSB0ZW1wb3JhcnkgdmFsdWUgdGhhdCB3aWxsIG5vdCBiZSBwZXJzaXN0ZWRcbiAgc2V0VG1wOiAoa2V5LCB2YWx1ZSkgLT5cbiAgICBAdG1wID0ge31cbiAgICBAdG1wW2tleV0gPSB2YWx1ZVxuXG5cbiAgZ2V0VG1wOiAoa2V5KSAtPlxuICAgIEB0bXA/W2tleV1cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbkVkaXRhYmxlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9lZGl0YWJsZV9kaXJlY3RpdmUnKVxuSW1hZ2VEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2ltYWdlX2RpcmVjdGl2ZScpXG5IdG1sRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9odG1sX2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBjcmVhdGU6ICh7IGNvbXBvbmVudCwgdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBEaXJlY3RpdmUgPSBAZ2V0RGlyZWN0aXZlQ29uc3RydWN0b3IodGVtcGxhdGVEaXJlY3RpdmUudHlwZSlcbiAgICBuZXcgRGlyZWN0aXZlKHsgY29tcG9uZW50LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KVxuXG5cbiAgZ2V0RGlyZWN0aXZlQ29uc3RydWN0b3I6IChkaXJlY3RpdmVUeXBlKSAtPlxuICAgIHN3aXRjaCBkaXJlY3RpdmVUeXBlXG4gICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgRWRpdGFibGVEaXJlY3RpdmVcbiAgICAgIHdoZW4gJ2ltYWdlJ1xuICAgICAgICBJbWFnZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgSHRtbERpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBhc3NlcnQgZmFsc2UsIFwiVW5zdXBwb3J0ZWQgY29tcG9uZW50IGRpcmVjdGl2ZTogI3sgZGlyZWN0aXZlVHlwZSB9XCJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5Db21wb25lbnRDb250YWluZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGlyZWN0aXZlRmFjdG9yeSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2RpcmVjdGl2ZV9mYWN0b3J5JylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5cbiMgQ29tcG9uZW50TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggQ29tcG9uZW50TW9kZWwgaGFzIGEgdGVtcGxhdGUgd2hpY2ggYWxsb3dzIHRvIGdlbmVyYXRlIGEgY29tcG9uZW50Vmlld1xuIyBmcm9tIGEgY29tcG9uZW50TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBDb21wb25lbnRUcmVlLlxuIyBFdmVyeSBDb21wb25lbnRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoQ29tcG9uZW50Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIGNvbXBvbmVudHMpIGFuZCBtdWx0aXBsZSBjb250YWluZXJzIChDb21wb25lbnRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBDb21wb25lbnRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IENvbXBvbmVudENvbnRhaW5lclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIGNvbXBvbmVudCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEBpZCA9IGlkIHx8IGd1aWQubmV4dCgpXG4gICAgQGNvbXBvbmVudE5hbWUgPSBAdGVtcGxhdGUubmFtZVxuXG4gICAgQG5leHQgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IENvbXBvbmVudENvbnRhaW5lclxuICAgIEBjb21wb25lbnRUcmVlID0gdW5kZWZpbmVkICMgc2V0IGJ5IENvbXBvbmVudFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIEBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgICAgICAgICBuYW1lOiBkaXJlY3RpdmUubmFtZVxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50OiB0aGlzXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgICAgICAgQGNyZWF0ZUNvbXBvbmVudERpcmVjdGl2ZShkaXJlY3RpdmUpXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIENvbXBvbmVudE1vZGVsXCJcblxuXG4gICMgQ3JlYXRlIGEgZGlyZWN0aXZlIGZvciAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCcgdGVtcGxhdGUgZGlyZWN0aXZlc1xuICBjcmVhdGVDb21wb25lbnREaXJlY3RpdmU6ICh0ZW1wbGF0ZURpcmVjdGl2ZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5hZGQgZGlyZWN0aXZlRmFjdG9yeS5jcmVhdGVcbiAgICAgIGNvbXBvbmVudDogdGhpc1xuICAgICAgdGVtcGxhdGVEaXJlY3RpdmU6IHRlbXBsYXRlRGlyZWN0aXZlXG5cblxuICAjIFZpZXcgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgY3JlYXRlVmlldzogKGlzUmVhZE9ubHkpIC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZVZpZXcodGhpcywgaXNSZWFkT25seSlcblxuXG4gIGdldE1haW5WaWV3OiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmdldE1haW5Db21wb25lbnRWaWV3KHRoaXMuaWQpXG5cblxuICAjIENvbXBvbmVudFRyZWUgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgY29tcG9uZW50TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIGNvbXBvbmVudE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBjb21wb25lbnQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBpZiBjb21wb25lbnRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBjb21wb25lbnRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChjb21wb25lbnRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgY29tcG9uZW50TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKGNvbXBvbmVudE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIGNvbXBvbmVudCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBjb21wb25lbnQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIGNvbXBvbmVudCBmcm9tIGl0cyBjb250YWluZXIgYW5kIENvbXBvbmVudFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIENvbXBvbmVudFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIGNvbXBvbmVudFRyZWUgcmVsYXRpdmUgdG8gdGhpcyBjb21wb25lbnQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRDb21wb25lbnRcblxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRNb2RlbClcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjb21wb25lbnRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIGNvbXBvbmVudE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIGNvbXBvbmVudHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChjb21wb25lbnRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKSBpZiBjb21wb25lbnRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IGNvbXBvbmVudE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBjb21wb25lbnRcbiAgc2V0Q29udGVudDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgaWYgQGNvbnRlbnRbbmFtZV1cbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICBpZiBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSAhPSB2YWx1ZVxuICAgICAgICBkaXJlY3RpdmUuc2V0SW1hZ2VVcmwodmFsdWUpXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAY29tcG9uZW50VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgY29tcG9uZW50TW9kZWwuXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgIyBnZXR0ZXI6XG4gICMgICBkYXRhKCkgb3JcbiAgIyAgIGRhdGEoJ215LWtleScpXG4gICMgc2V0dGVyOlxuICAjICAgZGF0YSgnbXkta2V5JzogJ2F3ZXNvbWUnKVxuICBkYXRhOiAoYXJnKSAtPlxuICAgIGlmIHR5cGVvZihhcmcpID09ICdvYmplY3QnXG4gICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIGFyZ1xuICAgICAgICBpZiBAY2hhbmdlRGF0YShuYW1lLCB2YWx1ZSlcbiAgICAgICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMucHVzaChuYW1lKVxuICAgICAgaWYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQGNvbXBvbmVudFRyZWU/LmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZSBpZiBhcmdcbiAgICAgIEBkYXRhVmFsdWVzW2FyZ11cbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1xuXG5cbiAgc2V0RGF0YTogKGtleSwgdmFsdWUpIC0+XG4gICAgaWYga2V5ICYmIEBjaGFuZ2VEYXRhKGtleSwgdmFsdWUpXG4gICAgICBAY29tcG9uZW50VHJlZT8uZGF0YUNoYW5naW5nKHRoaXMsIFtrZXldKVxuXG5cbiAgZ2V0RGF0YTogKGtleSkgLT5cbiAgICBpZiBrZXlcbiAgICAgIEBkYXRhVmFsdWVzW2tleV1cbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1xuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBmYWxzZSBpZiBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuXG4gICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgIHRydWVcblxuXG4gICMgU3R5bGUgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS1cblxuICBnZXRTdHlsZTogKG5hbWUpIC0+XG4gICAgQHN0eWxlc1tuYW1lXVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBzdHlsZSA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV1cbiAgICBpZiBub3Qgc3R5bGVcbiAgICAgIGxvZy53YXJuIFwiVW5rbm93biBzdHlsZSAnI3sgbmFtZSB9JyBpbiBDb21wb25lbnRNb2RlbCAjeyBAY29tcG9uZW50TmFtZSB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gQ29tcG9uZW50TW9kZWwgI3sgQGNvbXBvbmVudE5hbWUgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQGNvbXBvbmVudFRyZWVcbiAgICAgICAgICBAY29tcG9uZW50VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgIyBAZGVwcmVjYXRlZFxuICAjIEdldHRlciBhbmQgU2V0dGVyIGluIG9uZS5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBjb25zb2xlLmxvZyhcIkNvbXBvbmVudE1vZGVsI3N0eWxlKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAjZ2V0U3R5bGUoKSBhbmQgI3NldFN0eWxlKCkuXCIpXG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgIyBDb21wb25lbnRNb2RlbCBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb3B5OiAtPlxuICAgIGxvZy53YXJuKFwiQ29tcG9uZW50TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIENvbXBvbmVudE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5kZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmd1aWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2d1aWQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkNvbXBvbmVudE1vZGVsID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWwnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIFB1YmxpYyBNZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS1cblxuICAjIFNlcmlhbGl6ZSBhIENvbXBvbmVudE1vZGVsXG4gICNcbiAgIyBFeHRlbmRzIHRoZSBwcm90b3R5cGUgb2YgQ29tcG9uZW50TW9kZWxcbiAgI1xuICAjIEV4YW1wbGUgUmVzdWx0OlxuICAjIGlkOiAnYWtrN2hqdXVlMidcbiAgIyBpZGVudGlmaWVyOiAndGltZWxpbmUudGl0bGUnXG4gICMgY29udGVudDogeyAuLi4gfVxuICAjIHN0eWxlczogeyAuLi4gfVxuICAjIGRhdGE6IHsgLi4uIH1cbiAgIyBjb250YWluZXJzOiB7IC4uLiB9XG4gIENvbXBvbmVudE1vZGVsOjp0b0pzb24gPSAoY29tcG9uZW50KSAtPlxuICAgIGNvbXBvbmVudCA/PSB0aGlzXG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBjb21wb25lbnQuaWRcbiAgICAgIGlkZW50aWZpZXI6IGNvbXBvbmVudC50ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KGNvbXBvbmVudC5jb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShjb21wb25lbnQuY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoY29tcG9uZW50LnN0eWxlcylcbiAgICAgIGpzb24uc3R5bGVzID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShjb21wb25lbnQuc3R5bGVzKVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShjb21wb25lbnQuZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBjb21wb25lbnQuZGF0YVZhbHVlcylcblxuICAgICMgY3JlYXRlIGFuIGFycmF5IGZvciBldmVyeSBjb250YWluZXJcbiAgICBmb3IgbmFtZSBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAganNvbi5jb250YWluZXJzIHx8PSB7fVxuICAgICAganNvbi5jb250YWluZXJzW25hbWVdID0gW11cblxuICAgIGpzb25cblxuXG4gIGZyb21Kc29uOiAoanNvbiwgZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmNvbXBvbmVudCB8fCBqc29uLmlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgY29tcG9uZW50OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgICBtb2RlbCA9IG5ldyBDb21wb25lbnRNb2RlbCh7IHRlbXBsYXRlLCBpZDoganNvbi5pZCB9KVxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGpzb24uY29udGVudFxuICAgICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQgI3sgbW9kZWwuY29tcG9uZW50TmFtZSB9OiB1bmtub3duIGNvbnRlbnQgJyN7IG5hbWUgfSdcIlxuXG4gICAgICAjIFRyYW5zZm9ybSBzdHJpbmcgaW50byBvYmplY3Q6IEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBvbGQgaW1hZ2UgdmFsdWVzLlxuICAgICAgaWYgbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkudHlwZSA9PSAnaW1hZ2UnICYmIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJ1xuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID1cbiAgICAgICAgICB1cmw6IHZhbHVlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGVsLmNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuXG4gICAgZm9yIHN0eWxlTmFtZSwgdmFsdWUgb2YganNvbi5zdHlsZXNcbiAgICAgIG1vZGVsLnNldFN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgICBtb2RlbC5kYXRhKGpzb24uZGF0YSkgaWYganNvbi5kYXRhXG5cbiAgICBmb3IgY29udGFpbmVyTmFtZSwgY29tcG9uZW50QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgICAgaWYgY29tcG9uZW50QXJyYXlcbiAgICAgICAgYXNzZXJ0ICQuaXNBcnJheShjb21wb25lbnRBcnJheSksXG4gICAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgICBmb3IgY2hpbGQgaW4gY29tcG9uZW50QXJyYXlcbiAgICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIEBmcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgICBtb2RlbFxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuQ29tcG9uZW50Q29udGFpbmVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRfY29udGFpbmVyJylcbkNvbXBvbmVudEFycmF5ID0gcmVxdWlyZSgnLi9jb21wb25lbnRfYXJyYXknKVxuQ29tcG9uZW50TW9kZWwgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9tb2RlbCcpXG5jb21wb25lbnRNb2RlbFNlcmlhbGl6ZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9tb2RlbF9zZXJpYWxpemVyJylcblxuIyBDb21wb25lbnRUcmVlXG4jIC0tLS0tLS0tLS0tXG4jIExpdmluZ2RvY3MgZXF1aXZhbGVudCB0byB0aGUgRE9NIHRyZWUuXG4jIEEgY29tcG9uZW50VHJlZSBjb250YWluZXMgYWxsIHRoZSBjb21wb25lbnRzIG9mIGEgcGFnZSBpbiBoaWVyYXJjaGljYWwgb3JkZXIuXG4jXG4jIFRoZSByb290IG9mIHRoZSBDb21wb25lbnRUcmVlIGlzIGEgQ29tcG9uZW50Q29udGFpbmVyLiBBIENvbXBvbmVudENvbnRhaW5lclxuIyBjb250YWlucyBhIGxpc3Qgb2YgY29tcG9uZW50cy5cbiNcbiMgY29tcG9uZW50cyBjYW4gaGF2ZSBtdWx0aWJsZSBDb21wb25lbnRDb250YWluZXJzIHRoZW1zZWx2ZXMuXG4jXG4jICMjIyBFeGFtcGxlOlxuIyAgICAgLSBDb21wb25lbnRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gQ29tcG9uZW50ICdIZXJvJ1xuIyAgICAgICAtIENvbXBvbmVudCAnMiBDb2x1bW5zJ1xuIyAgICAgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBDb21wb25lbnQgJ1RpdGxlJ1xuIyAgICAgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyICdzaWRlYmFyJ1xuIyAgICAgICAgICAgLSBDb21wb25lbnQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBDb21wb25lbnRUcmVlIEV2ZW50cyBhcmUgY29uY2VybmVkIHdpdGggbGF5b3V0IGNoYW5nZXMgbGlrZVxuIyBhZGRpbmcsIHJlbW92aW5nIG9yIG1vdmluZyBjb21wb25lbnRzLlxuI1xuIyBDb25zaWRlcjogSGF2ZSBhIGRvY3VtZW50RnJhZ21lbnQgYXMgdGhlIHJvb3ROb2RlIGlmIG5vIHJvb3ROb2RlIGlzIGdpdmVuXG4jIG1heWJlIHRoaXMgd291bGQgaGVscCBzaW1wbGlmeSBzb21lIGNvZGUgKHNpbmNlIGNvbXBvbmVudHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50VHJlZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbnRlbnQsIEBkZXNpZ24gfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgXCJFcnJvciBpbnN0YW50aWF0aW5nIENvbXBvbmVudFRyZWU6IGRlc2lnbiBwYXJhbSBpcyBtaXNzc2luZy5cIlxuICAgIEBjb21wb25lbnRCeUlkID0ge31cbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgY29tcG9uZW50VHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgY29tcG9uZW50IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBjb21wb25lbnRNb2RlbCBpbnN0YW5jZSBvciBjb21wb25lbnQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5wcmVwZW5kKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IGNvbXBvbmVudCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogY29tcG9uZW50TW9kZWwgaW5zdGFuY2Ugb3IgY29tcG9uZW50IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5hcHBlbmQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0Q29tcG9uZW50OiAoY29tcG9uZW50TmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgY29tcG9uZW50TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZUNvbXBvbmVudChjb21wb25lbnROYW1lKVxuICAgIGVsc2VcbiAgICAgIGNvbXBvbmVudE5hbWVcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoY29tcG9uZW50TmFtZSlcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBnZXRUZW1wbGF0ZTogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChjb21wb25lbnROYW1lKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBjb21wb25lbnROYW1lIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIGNvbXBvbmVudFRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3QgY29tcG9uZW50XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBjb21wb25lbnRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnROYW1lID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKGNvbXBvbmVudClcblxuICAgICAgbmV3IENvbXBvbmVudEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgQ29tcG9uZW50QXJyYXkoKVxuXG5cbiAgZmluZEJ5SWQ6IChpZCkgLT5cbiAgICBAY29tcG9uZW50QnlJZFtpZF1cblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgPT5cbiAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgICBAY29tcG9uZW50QnlJZFtjb21wb25lbnQuaWRdID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBTZXQgYSBtYWluIHZpZXcgZm9yIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIE5vdGU6IFRoZXJlIGNhbiBiZSBtdWx0aXBsZSB2aWV3cyBmb3IgYSBjb21wb25lbnRUcmVlLiBXaXRoIHRoaXNcbiAgIyBtZXRob2Qgd2UgY2FuIHNldCBhIG1haW4gdmlldyBzbyBpdCBiZWNvbWVzIHBvc3NpYmxlIHRvIGdldCBhIHZpZXdcbiAgIyBkaXJlY3RseSBmcm9tIHRoZSBjb21wb25lbnRUcmVlIGZvciBjb252ZW5pZW5jZVxuICBzZXRNYWluVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IHZpZXcucmVuZGVyZXIsICdjb21wb25lbnRUcmVlLnNldE1haW5WaWV3OiB2aWV3IGRvZXMgbm90IGhhdmUgYW4gaW5pdGlhbGl6ZWQgcmVuZGVyZXInXG4gICAgYXNzZXJ0IHZpZXcucmVuZGVyZXIuY29tcG9uZW50VHJlZSA9PSB0aGlzLCAnY29tcG9uZW50VHJlZS5zZXRNYWluVmlldzogQ2Fubm90IHNldCByZW5kZXJlciBmcm9tIGRpZmZlcmVudCBjb21wb25lbnRUcmVlJ1xuICAgIEBtYWluUmVuZGVyZXIgPSB2aWV3LnJlbmRlcmVyXG5cblxuICAjIEdldCB0aGUgY29tcG9uZW50VmlldyBmb3IgYSBtb2RlbFxuICAjIFRoaXMgb25seSB3b3JrcyBpZiBzZXRNYWluVmlldygpIGhhcyBiZWVuIGNhbGxlZC5cbiAgZ2V0TWFpbkNvbXBvbmVudFZpZXc6IChjb21wb25lbnRJZCkgLT5cbiAgICBAbWFpblJlbmRlcmVyPy5nZXRDb21wb25lbnRWaWV3QnlJZChjb21wb25lbnRJZClcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnQ29tcG9uZW50VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBjb21wb25lbnQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLmxhYmVsIH0gKCN7IHRlbXBsYXRlLm5hbWUgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoY29tcG9uZW50Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoY29tcG9uZW50Lm5leHQsIGluZGVudGF0aW9uKSBpZiBjb21wb25lbnQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBjb21wb25lbnRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBjb21wb25lbnRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nQ29tcG9uZW50OiAoY29tcG9uZW50LCBhdHRhY2hDb21wb25lbnRGdW5jKSAtPlxuICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBjb21wb25lbnRcbiAgICAgIGF0dGFjaENvbXBvbmVudEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnY29tcG9uZW50TW92ZWQnLCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgaWYgY29tcG9uZW50LmNvbXBvbmVudFRyZWU/XG4gICAgICAgIGNvbXBvbmVudC5yZW1vdmUoKSAjIHJlbW92ZSBmcm9tIG90aGVyIGNvbXBvbmVudFRyZWVcblxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgICAgICBAY29tcG9uZW50QnlJZFtkZXNjZW5kYW50LmlkXSA9IGNvbXBvbmVudFxuXG4gICAgICBhdHRhY2hDb21wb25lbnRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEFkZGVkJywgY29tcG9uZW50KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ0NvbXBvbmVudDogKGNvbXBvbmVudCwgZGV0YWNoQ29tcG9uZW50RnVuYykgLT5cbiAgICBhc3NlcnQgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIGNvbXBvbmVudCBmcm9tIGFub3RoZXIgQ29tcG9uZW50VHJlZSdcblxuICAgIGNvbXBvbmVudC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnQpID0+XG4gICAgICBkZXNjZW5kYW50LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcbiAgICAgIEBjb21wb25lbnRCeUlkW2Rlc2NlbmRhbnQuaWRdID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hDb21wb25lbnRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRSZW1vdmVkJywgY29tcG9uZW50KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudENvbnRlbnRDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEh0bWxDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgIyBEaXNwYXRjaGVkIGV2ZW50IGRlc2NyaXB0aW9uOlxuICAjIGNvbXBvbmVudERhdGFDaGFuZ2VkKGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpXG4gICMgQHBhcmFtIGNvbXBvbmVudCB7Q29tcG9uZW50TW9kZWx9XG4gICMgQHBhcmFtIGNoYW5nZWRQcm9wZXJ0aWVzIHtBcnJheSBvZiBTdHJpbmdzfSBUb3AgbGV2ZWwgZGF0YSBwcm9wZXJ0aWVzXG4gICMgICB0aGF0IGhhdmUgYmVlbiBjaGFuZ2VkXG4gIGRhdGFDaGFuZ2luZzogKGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpIC0+XG4gICAgQGZpcmVFdmVudCgnY29tcG9uZW50RGF0YUNoYW5nZWQnLCBjb21wb25lbnQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lIH1cblxuICAgIGNvbXBvbmVudFRvRGF0YSA9IChjb21wb25lbnQsIGxldmVsLCBjb250YWluZXJBcnJheSkgLT5cbiAgICAgIGNvbXBvbmVudERhdGEgPSBjb21wb25lbnQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggY29tcG9uZW50RGF0YVxuICAgICAgY29tcG9uZW50RGF0YVxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBjb21wb25lbnREYXRhID0gY29tcG9uZW50VG9EYXRhKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBjb21wb25lbnREYXRhLmNvbnRhaW5lcnNbY29tcG9uZW50Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKGNvbXBvbmVudENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihjb21wb25lbnQubmV4dCwgbGV2ZWwsIGRhdGFPYmopIGlmIGNvbXBvbmVudC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIGNvbXBvbmVudFRyZWVcbiAgIyBUaGlzIG1ldGhvZCBzdXBwcmVzc2VzIGNoYW5nZSBldmVudHMgaW4gdGhlIGNvbXBvbmVudFRyZWUuXG4gICNcbiAgIyBDb25zaWRlciB0byBjaGFuZ2UgcGFyYW1zOlxuICAjIGZyb21EYXRhKHsgY29udGVudCwgZGVzaWduLCBzaWxlbnQgfSkgIyBzaWxlbnQgW2Jvb2xlYW5dOiBzdXBwcmVzcyBjaGFuZ2UgZXZlbnRzXG4gIGZyb21EYXRhOiAoZGF0YSwgZGVzaWduLCBzaWxlbnQ9dHJ1ZSkgLT5cbiAgICBpZiBkZXNpZ24/XG4gICAgICBhc3NlcnQgbm90IEBkZXNpZ24/IHx8IGRlc2lnbi5lcXVhbHMoQGRlc2lnbiksICdFcnJvciBsb2FkaW5nIGRhdGEuIFNwZWNpZmllZCBkZXNpZ24gaXMgZGlmZmVyZW50IGZyb20gY3VycmVudCBjb21wb25lbnRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIGNvbXBvbmVudERhdGEgaW4gZGF0YS5jb250ZW50XG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb21wb25lbnREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB0aGlzXG4gICAgICBAcm9vdC5lYWNoIChjb21wb25lbnQpID0+XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgICAgICBAY29tcG9uZW50QnlJZFtjb21wb25lbnQuaWRdID0gY29tcG9uZW50XG5cblxuICAjIEFwcGVuZCBkYXRhIHRvIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIEZpcmVzIGNvbXBvbmVudEFkZGVkIGV2ZW50IGZvciBldmVyeSBjb21wb25lbnRcbiAgYWRkRGF0YTogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAZnJvbURhdGEoZGF0YSwgZGVzaWduLCBmYWxzZSlcblxuXG4gIGFkZERhdGFXaXRoQW5pbWF0aW9uOiAoZGF0YSwgZGVsYXk9MjAwKSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgJ0Vycm9yIGFkZGluZyBkYXRhLiBDb21wb25lbnRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBjb21wb25lbnREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IGNvbXBvbmVudERhdGFcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb250ZW50LCBAZGVzaWduKVxuICAgICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG4gICAgICAgICwgdGltZW91dFxuXG4gICAgICB0aW1lb3V0ICs9IE51bWJlcihkZWxheSlcblxuXG4gIHRvRGF0YTogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gICMgQWxpYXNlc1xuICAjIC0tLS0tLS1cblxuICBmcm9tSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQGZyb21EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB0b0pzb246IChhcmdzLi4uKSAtPlxuICAgIEB0b0RhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5Db21wb25lbnREaXJlY3RpdmUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlRGlyZWN0aXZlIGV4dGVuZHMgQ29tcG9uZW50RGlyZWN0aXZlXG5cbiAgaXNFZGl0YWJsZTogdHJ1ZVxuXG5cbiAgZ2V0VGV4dDogLT5cbiAgICBjb250ZW50ID0gQGdldENvbnRlbnQoKVxuICAgIHJldHVybiAnJyB1bmxlc3MgY29udGVudFxuICAgIHdvcmRzLmV4dHJhY3RUZXh0RnJvbUh0bWwoY29udGVudClcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5Db21wb25lbnREaXJlY3RpdmUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEh0bWxEaXJlY3RpdmUgZXh0ZW5kcyBDb21wb25lbnREaXJlY3RpdmVcblxuICBpc0h0bWw6IHRydWVcblxuXG4gIHNldEVtYmVkSGFuZGxlcjogKGVtYmVkSGFuZGxlck5hbWUpIC0+XG4gICAgQHNldERhdGEoJ19lbWJlZEhhbmRsZXInLCBlbWJlZEhhbmRsZXJOYW1lKVxuXG5cbiAgZ2V0RW1iZWRIYW5kbGVyOiAtPlxuICAgIEBnZXREYXRhKCdfZW1iZWRIYW5kbGVyJylcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcbkNvbXBvbmVudERpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VEaXJlY3RpdmUgZXh0ZW5kcyBDb21wb25lbnREaXJlY3RpdmVcblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAY29tcG9uZW50LmNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKEBjb21wb25lbnQsIEBuYW1lKSBpZiBAY29tcG9uZW50LmNvbXBvbmVudFRyZWVcblxuXG4gIHNldEltYWdlVXJsOiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0udXJsID0gdmFsdWVcblxuICAgIEByZXNldENyb3AoKVxuICAgIEBiYXNlNjRJbWFnZSA9IHVuZGVmaW5lZFxuICAgIEBwcm9jZXNzSW1hZ2VVcmwodmFsdWUpXG5cblxuICBnZXRJbWFnZVVybDogLT5cbiAgICBpbWFnZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBpZiBpbWFnZVxuICAgICAgaW1hZ2UudXJsXG4gICAgZWxzZVxuICAgICAgdW5kZWZpbmVkXG5cblxuICBnZXRJbWFnZU9iamVjdDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdLm9yaWdpbmFsVXJsIHx8IEBnZXRJbWFnZVVybCgpXG5cblxuICBzZXRDcm9wOiAoeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBuYW1lIH0pIC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG4gICAgaWYgY3VycmVudFZhbHVlPy51cmw/XG4gICAgICBjdXJyZW50VmFsdWUuY3JvcCA9XG4gICAgICAgIHg6IHhcbiAgICAgICAgeTogeVxuICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgbmFtZTogbmFtZVxuXG4gICAgICBAcHJvY2Vzc0ltYWdlVXJsKGN1cnJlbnRWYWx1ZS5vcmlnaW5hbFVybCB8fCBjdXJyZW50VmFsdWUudXJsKVxuICAgICAgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyhAY29tcG9uZW50LCBAbmFtZSkgaWYgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlXG5cblxuICByZXNldENyb3A6IC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGN1cnJlbnRWYWx1ZT9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID0gbnVsbFxuXG5cbiAgc2V0SW1hZ2VTZXJ2aWNlOiAoaW1hZ2VTZXJ2aWNlTmFtZSkgLT5cbiAgICBhc3NlcnQgaW1hZ2VTZXJ2aWNlLmhhcyhpbWFnZVNlcnZpY2VOYW1lKSwgXCJFcnJvcjogY291bGQgbm90IGxvYWQgaW1hZ2Ugc2VydmljZSAjeyBpbWFnZVNlcnZpY2VOYW1lIH1cIlxuXG4gICAgaW1hZ2VVcmwgPSBAZ2V0SW1hZ2VVcmwoKVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0gPVxuICAgICAgdXJsOiBpbWFnZVVybFxuICAgICAgaW1hZ2VTZXJ2aWNlOiBpbWFnZVNlcnZpY2VOYW1lIHx8IG51bGxcblxuXG4gIGdldEltYWdlU2VydmljZU5hbWU6IC0+XG4gICAgQGdldEltYWdlU2VydmljZSgpLm5hbWVcblxuXG4gIGhhc0RlZmF1bHRJbWFnZVNlcnZpY2U6IC0+XG4gICAgQGdldEltYWdlU2VydmljZU5hbWUoKSA9PSAnZGVmYXVsdCdcblxuXG4gIGdldEltYWdlU2VydmljZTogLT5cbiAgICBzZXJ2aWNlTmFtZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV0/LmltYWdlU2VydmljZVxuICAgIGltYWdlU2VydmljZS5nZXQoc2VydmljZU5hbWUgfHwgdW5kZWZpbmVkKVxuXG5cbiAgcHJvY2Vzc0ltYWdlVXJsOiAodXJsKSAtPlxuICAgIGlmIG5vdCBAaGFzRGVmYXVsdEltYWdlU2VydmljZSgpXG4gICAgICBpbWdTZXJ2aWNlID0gQGdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWdPYmogPSBAZ2V0SW1hZ2VPYmplY3QoKVxuICAgICAgaW1nT2JqLnVybCA9IGltZ1NlcnZpY2UuZ2V0VXJsKHVybCwgY3JvcDogaW1nT2JqLmNyb3ApXG4gICAgICBpbWdPYmoub3JpZ2luYWxVcmwgPSB1cmxcblxuIiwiIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvbiB3aXRoIHNob3J0aGFuZHMgYW5kIGNvbXB1dGVkIHZhbHVlcy5cbiNcbiMgY29uZmlnLmRvY0RpcmVjdGl2ZVxuIyAgIFdpbGwgcHJlZml4IHRoZSBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXhcbiMgICBlLmcuIGNvbmZpZy5kb2NEaXJlY3RpdmUuZWRpdGFibGUgPT0gJ2RhdGEtZG9jLWVkaXRhYmxlJ1xuI1xuIyBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwXG4jICAgQSBsb29rdXAgb2JqZWN0IGZvciBlYXNpZXIgbG9va3VwcyBvZiB0aGUgZGlyZWN0aXZlIG5hbWUgYnkgdGVtcGxhdGUgYXR0cmlidXRlLlxuIyAgIGUuZy4gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFsnZG9jLWVkaXRhYmxlJ10gPT0gJ2VkaXRhYmxlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChjb25maWcpIC0+XG5cbiAgIyBTaG9ydGhhbmRzIGZvciBzdHVmZiB0aGF0IGlzIHVzZWQgYWxsIG92ZXIgdGhlIHBsYWNlIHRvIG1ha2VcbiAgIyBjb2RlIGFuZCBzcGVjcyBtb3JlIHJlYWRhYmxlLlxuICBjb25maWcuZG9jRGlyZWN0aXZlID0ge31cbiAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cCA9IHt9XG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG5cbiAgICAjIENyZWF0ZSB0aGUgcmVuZGVyZWRBdHRycyBmb3IgdGhlIGRpcmVjdGl2ZXNcbiAgICAjIChwcmVwZW5kIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggdGhlIGNvbmZpZ3VyZWQgcHJlZml4KVxuICAgIHByZWZpeCA9IGlmIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggdGhlbiBcIiN7IGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggfS1cIiBlbHNlICcnXG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfSN7IHZhbHVlLmF0dHIgfVwiXG5cbiAgICBjb25maWcuZG9jRGlyZWN0aXZlW25hbWVdID0gdmFsdWUucmVuZGVyZWRBdHRyXG4gICAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFt2YWx1ZS5hdHRyXSA9IG5hbWVcblxuICBjb25maWdcbiIsImF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2F1Z21lbnRfY29uZmlnJylcblxuIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gYXVnbWVudENvbmZpZyhcblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIENTUyBzZWxlY3RvciBmb3IgZWxlbWVudHMgKGFuZCB0aGVpciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxuICAjIHdoZW4gZm9jdXNzaW5nIG9yIGJsdXJyaW5nIGEgY29tcG9uZW50XG4gIGlnbm9yZUludGVyYWN0aW9uOiAnLmxkLWNvbnRyb2wnXG5cbiAgIyBTZXR1cCBwYXRocyB0byBsb2FkIHJlc291cmNlcyBkeW5hbWljYWxseVxuICBkZXNpZ25QYXRoOiAnL2Rlc2lnbnMnXG4gIGxpdmluZ2RvY3NDc3NGaWxlOiAnL2Fzc2V0cy9jc3MvbGl2aW5nZG9jcy5jc3MnXG5cbiAgd29yZFNlcGFyYXRvcnM6IFwiLi9cXFxcKClcXFwiJzosLjs8Pn4hIyVeJip8Kz1bXXt9YH4/XCJcblxuICAjIHN0cmluZyBjb250YWlubmcgb25seSBhIDxicj4gZm9sbG93ZWQgYnkgd2hpdGVzcGFjZXNcbiAgc2luZ2xlTGluZUJyZWFrOiAvXjxiclxccypcXC8/PlxccyokL1xuXG4gIGF0dHJpYnV0ZVByZWZpeDogJ2RhdGEnXG5cbiAgIyBFZGl0YWJsZSBjb25maWd1cmF0aW9uXG4gIGVkaXRhYmxlOlxuICAgIGFsbG93TmV3bGluZTogdHJ1ZSAjIEFsbG93IHRvIGluc2VydCBuZXdsaW5lcyB3aXRoIFNoaWZ0K0VudGVyXG4gICAgY2hhbmdlRGVsYXk6IDAgIyBEZWxheSBmb3IgdXBkYXRpbmcgdGhlIGNvbXBvbmVudCBtb2RlbHMgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHVzZXIgY2hhbmdlcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgYnJvd3NlclNwZWxsY2hlY2s6IGZhbHNlICMgU2V0IHRoZSBzcGVsbGNoZWNrIGF0dHJpYnV0ZSBvbiBjb250ZW50ZWRpdGFibGVzIHRvICd0cnVlJyBvciAnZmFsc2UnXG4gICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogZmFsc2UgIyBXaGV0aGVyIHRvIGZpcmUgY3Vyc29yIGFuZCBzZWxjdGlvbiBjaGFuZ2VzIG9uIG1vdXNlbW92ZVxuXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBjb21wb25lbnQgY2xhc3Nlc1xuICAgIGNvbXBvbmVudDogJ2RvYy1jb21wb25lbnQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBjb21wb25lbnRIaWdobGlnaHQ6ICdkb2MtY29tcG9uZW50LWhpZ2hsaWdodCdcbiAgICBjb250YWluZXJIaWdobGlnaHQ6ICdkb2MtY29udGFpbmVyLWhpZ2hsaWdodCdcblxuICAgICMgZHJhZyAmIGRyb3BcbiAgICBkcmFnZ2VkOiAnZG9jLWRyYWdnZWQnXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyOiAnZG9jLWRyYWdnZWQtcGxhY2Vob2xkZXInXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlcjogJ2RvYy1kcmFnLWNvdW50ZXInXG4gICAgZHJhZ0Jsb2NrZXI6ICdkb2MtZHJhZy1ibG9ja2VyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuICBpbWFnZVNlcnZpY2VzOlxuICAgICdyZXNyYy5pdCc6XG4gICAgICBxdWFsaXR5OiA3NVxuICAgICAgaG9zdDogJ2h0dHBzOi8vYXBwLnJlc3JjLml0J1xuKVxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgbGFiZWwsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIEBsYWJlbCA9IGxhYmVsIHx8IHdvcmRzLmh1bWFuaXplKCBAbmFtZSApXG5cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ29wdGlvbidcbiAgICAgICAgYXNzZXJ0IHZhbHVlLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICd2YWx1ZScgcHJvdmlkZWRcIlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgd2hlbiAnc2VsZWN0J1xuICAgICAgICBhc3NlcnQgb3B0aW9ucywgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAnb3B0aW9ucycgcHJvdmlkZWRcIlxuICAgICAgICBAb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogdW5rbm93biB0eXBlICcjeyBAdHlwZSB9J1wiXG5cblxuICAjIEdldCBpbnN0cnVjdGlvbnMgd2hpY2ggY3NzIGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUuXG4gICMgV2UgZG8gbm90IGNvbnRyb2wgdGhlIGNsYXNzIGF0dHJpYnV0ZSBvZiBhIGNvbXBvbmVudCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBDc3NNb2RpZmljYXRvclByb3BlcnR5I3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuT3JkZXJlZEhhc2ggPSByZXF1aXJlKCcuLi9tb2R1bGVzL29yZGVyZWRfaGFzaCcpXG5EZXBlbmRlbmNpZXMgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvZGVwZW5kZW5jaWVzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICAjIEBwYXJhbVxuICAjICAtIG5hbWUgeyBTdHJpbmcgfSBUaGUgbmFtZSBvZiB0aGUgZGVzaWduLlxuICAjICAtIHZlcnNpb24geyBTdHJpbmcgfSBlLmcuICcxLjAuMCdcbiAgIyAgLSBhdXRob3IgeyBTdHJpbmcgfVxuICAjICAtIGRlc2NyaXB0aW9uIHsgU3RyaW5nIH1cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdmVyc2lvbiwgQGF1dGhvciwgQGRlc2NyaXB0aW9uIH0pIC0+XG4gICAgYXNzZXJ0IEBuYW1lPywgJ0Rlc2lnbjogcGFyYW0gXCJuYW1lXCIgaXMgcmVxdWlyZWQnXG4gICAgQGlkZW50aWZpZXIgPSBEZXNpZ24uZ2V0SWRlbnRpZmllcihAbmFtZSwgQHZlcnNpb24pXG5cbiAgICAjIHRlbXBsYXRlcyBpbiBhIHN0cnVjdHVyZWQgZm9ybWF0XG4gICAgQGdyb3VwcyA9IFtdXG5cbiAgICAjIHRlbXBsYXRlcyBieSBpZCBhbmQgc29ydGVkXG4gICAgQGNvbXBvbmVudHMgPSBuZXcgT3JkZXJlZEhhc2goKVxuICAgIEBpbWFnZVJhdGlvcyA9IHt9XG5cbiAgICAjIGpzIGFuZCBjc3MgZGVwZW5kZW5jaWVzIHJlcXVpcmVkIGJ5IHRoZSBkZXNpZ25cbiAgICBAZGVwZW5kZW5jaWVzID0gbmV3IERlcGVuZGVuY2llcyhwcmVmaXg6IFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyB0aGlzLm5hbWUgfVwiKVxuXG4gICAgIyBkZWZhdWx0IGNvbXBvbmVudHNcbiAgICBAZGVmYXVsdFBhcmFncmFwaCA9IHVuZGVmaW5lZFxuICAgIEBkZWZhdWx0SW1hZ2UgPSB1bmRlZmluZWRcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZSA9PSBAbmFtZSAmJiBkZXNpZ24udmVyc2lvbiA9PSBAdmVyc2lvblxuXG5cbiAgIyBTaW1wbGUgaW1wbGVtZW50YXRpb24gd2l0aCBzdHJpbmcgY29tcGFyaXNvblxuICAjIENhdXRpb246IHdvbid0IHdvcmsgZm9yICcxLjEwLjAnID4gJzEuOS4wJ1xuICBpc05ld2VyVGhhbjogKGRlc2lnbikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgZGVzaWduP1xuICAgIEB2ZXJzaW9uID4gKGRlc2lnbi52ZXJzaW9uIHx8ICcnKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBjb21wb25lbnROYW1lID0gQGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcihpZGVudGlmaWVyKVxuICAgIEBjb21wb25lbnRzLmdldChjb21wb25lbnROYW1lKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEBjb21wb25lbnRzLmVhY2goY2FsbGJhY2spXG5cblxuICBhZGQ6ICh0ZW1wbGF0ZSkgLT5cbiAgICB0ZW1wbGF0ZS5zZXREZXNpZ24odGhpcylcbiAgICBAY29tcG9uZW50cy5wdXNoKHRlbXBsYXRlLm5hbWUsIHRlbXBsYXRlKVxuXG5cbiAgZ2V0Q29tcG9uZW50TmFtZUZyb21JZGVudGlmaWVyOiAoaWRlbnRpZmllcikgLT5cbiAgICB7IG5hbWUgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuICAgIG5hbWVcblxuXG4gIEBnZXRJZGVudGlmaWVyOiAobmFtZSwgdmVyc2lvbikgLT5cbiAgICBpZiB2ZXJzaW9uXG4gICAgICBcIiN7IG5hbWUgfUAjeyB2ZXJzaW9uIH1cIlxuICAgIGVsc2VcbiAgICAgIFwiI3sgbmFtZSB9XCJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuZGVzaWduUGFyc2VyID0gcmVxdWlyZSgnLi9kZXNpZ25fcGFyc2VyJylcblZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ25hbWVPZllvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFByb3Bvc2VkIGV4dGVuc2lvbnM6XG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gYSByZW1vdGUgc2VydmVyIGJ5IG5hbWUgKHNlcnZlciBoYXMgdG8gYmUgY29uZmlndXJlZCBhcyBkZWZhdWx0KVxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChkZXNpZ25TcGVjKSAtPlxuICAgIGFzc2VydCBkZXNpZ25TcGVjPywgJ2Rlc2lnbi5sb2FkKCkgd2FzIGNhbGxlZCB3aXRoIHVuZGVmaW5lZC4nXG4gICAgYXNzZXJ0IG5vdCAodHlwZW9mIGRlc2lnblNwZWMgPT0gJ3N0cmluZycpLCAnZGVzaWduLmxvYWQoKSBsb2FkaW5nIGEgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkLidcblxuICAgIHZlcnNpb24gPSBWZXJzaW9uLnBhcnNlKGRlc2lnblNwZWMudmVyc2lvbilcbiAgICBkZXNpZ25JZGVudGlmaWVyID0gRGVzaWduLmdldElkZW50aWZpZXIoZGVzaWduU3BlYy5uYW1lLCB2ZXJzaW9uKVxuICAgIHJldHVybiBpZiBAaGFzKGRlc2lnbklkZW50aWZpZXIpXG5cbiAgICBkZXNpZ24gPSBkZXNpZ25QYXJzZXIucGFyc2UoZGVzaWduU3BlYylcbiAgICBpZiBkZXNpZ25cbiAgICAgIEBhZGQoZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihEZXNpZ24ucGFyc2VyLmVycm9ycylcblxuXG4gICMgQWRkIGFuIGFscmVhZHkgcGFyc2VkIGRlc2lnbi5cbiAgIyBAcGFyYW0geyBEZXNpZ24gb2JqZWN0IH1cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIGlmIGRlc2lnbi5pc05ld2VyVGhhbihAZGVzaWduc1tkZXNpZ24ubmFtZV0pXG4gICAgICBAZGVzaWduc1tkZXNpZ24ubmFtZV0gPSBkZXNpZ25cbiAgICBAZGVzaWduc1tkZXNpZ24uaWRlbnRpZmllcl0gPSBkZXNpZ25cblxuXG4gICMgQ2hlY2sgaWYgYSBkZXNpZ24gaXMgbG9hZGVkXG4gIGhhczogKGRlc2lnbklkZW50aWZpZXIpIC0+XG4gICAgQGRlc2lnbnNbZGVzaWduSWRlbnRpZmllcl0/XG5cblxuICAjIEdldCBhIGxvYWRlZCBkZXNpZ25cbiAgIyBAcmV0dXJuIHsgRGVzaWduIG9iamVjdCB9XG4gIGdldDogKGRlc2lnbklkZW50aWZpZXIpIC0+XG4gICAgYXNzZXJ0IEBoYXMoZGVzaWduSWRlbnRpZmllciksIFwiRXJyb3I6IGRlc2lnbiAnI3sgZGVzaWduSWRlbnRpZmllciB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbZGVzaWduSWRlbnRpZmllcl1cblxuXG4gICMgQ2xlYXIgdGhlIGNhY2hlIGlmIHlvdSB3YW50IHRvIHJlbG9hZCBkZXNpZ25zXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5qU2NoZW1lID0gcmVxdWlyZSgnanNjaGVtZScpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yID0galNjaGVtZS5uZXcoKVxuXG4jIEN1c3RvbSBWYWxpZGF0b3JzXG4jIC0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhbGlkYXRvci5hZGQgJ3N0eWxlVHlwZScsICh2YWx1ZSkgLT5cbiAgdmFsdWUgPT0gJ29wdGlvbicgb3IgdmFsdWUgPT0gJ3NlbGVjdCdcblxuXG52YWxpZGF0b3IuYWRkICdzZW1WZXInLCAodmFsdWUpIC0+XG4gIFZlcnNpb24uc2VtVmVyLnRlc3QodmFsdWUpXG5cblxuIyBjc3NDbGFzc01vZGlmaWNhdG9yIHByb3BlcnRpZXMgbmVlZCBvbmUgJ0RlZmF1bHQnIG9wdGlvblxuIyB3aXRoIGFuIHVuZGVmaW5lZCB2YWx1ZS4gT3RoZXJ3aXNlIHVzZXJzIGNhbm5vdCByZXNldCB0aGVcbiMgc3R5bGUgdmlhIHRoZSBkcm9wZG93biBpbiB0aGUgVUkuXG52YWxpZGF0b3IuYWRkICdvbmUgZW1wdHkgb3B0aW9uJywgKHZhbHVlKSAtPlxuICBlbXB0eUNvdW50ID0gMFxuICBmb3IgZW50cnkgaW4gdmFsdWVcbiAgICBlbXB0eUNvdW50ICs9IDEgaWYgbm90IGVudHJ5LnZhbHVlXG5cbiAgZW1wdHlDb3VudCA9PSAxXG5cblxuIyBTY2hlbWFzXG4jIC0tLS0tLS1cblxudmFsaWRhdG9yLmFkZCAnZGVzaWduJyxcbiAgbmFtZTogJ3N0cmluZydcbiAgdmVyc2lvbjogJ3N0cmluZywgc2VtVmVyJ1xuICBhdXRob3I6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBkZXNjcmlwdGlvbjogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGFzc2V0czpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgY3NzOiAnYXJyYXkgb2Ygc3RyaW5nJ1xuICAgIGpzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgY29tcG9uZW50czogJ2FycmF5IG9mIGNvbXBvbmVudCdcbiAgY29tcG9uZW50UHJvcGVydGllczpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiB2YWxpZGF0b3IudmFsaWRhdGUoJ2NvbXBvbmVudFByb3BlcnR5JywgdmFsdWUpXG4gIGdyb3VwczogJ2FycmF5IG9mIGdyb3VwLCBvcHRpb25hbCdcbiAgZGVmYXVsdENvbXBvbmVudHM6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIHBhcmFncmFwaDogJ3N0cmluZywgb3B0aW9uYWwnXG4gICAgaW1hZ2U6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBpbWFnZVJhdGlvczpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiB2YWxpZGF0b3IudmFsaWRhdGUoJ2ltYWdlUmF0aW8nLCB2YWx1ZSlcblxuXG52YWxpZGF0b3IuYWRkICdjb21wb25lbnQnLFxuICBuYW1lOiAnc3RyaW5nJ1xuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGh0bWw6ICdzdHJpbmcnXG4gIGRpcmVjdGl2ZXM6ICdvYmplY3QsIG9wdGlvbmFsJ1xuICBwcm9wZXJ0aWVzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiBmYWxzZVxuXG5cbnZhbGlkYXRvci5hZGQgJ2dyb3VwJyxcbiAgbGFiZWw6ICdzdHJpbmcnXG4gIGNvbXBvbmVudHM6ICdhcnJheSBvZiBzdHJpbmcnXG5cblxuIyB0b2RvOiByZW5hbWUgdHlwZSBhbmQgdXNlIHR5cGUgdG8gaWRlbnRpZnkgdGhlIGNvbXBvbmVudFByb3BlcnR5IHR5cGUgbGlrZSBjc3NDbGFzc1xudmFsaWRhdG9yLmFkZCAnY29tcG9uZW50UHJvcGVydHknLFxuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIHR5cGU6ICdzdHJpbmcsIHN0eWxlVHlwZSdcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBvcHRpb25zOiAnYXJyYXkgb2Ygc3R5bGVPcHRpb24sIG9uZSBlbXB0eSBvcHRpb24sIG9wdGlvbmFsJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ2ltYWdlUmF0aW8nLFxuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIHJhdGlvOiAnc3RyaW5nJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ3N0eWxlT3B0aW9uJyxcbiAgY2FwdGlvbjogJ3N0cmluZydcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbiQgPSByZXF1aXJlKCdqcXVlcnknKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kZXNpZ25Db25maWdTY2hlbWEgPSByZXF1aXJlKCcuL2Rlc2lnbl9jb25maWdfc2NoZW1hJylcbkNzc01vZGlmaWNhdG9yUHJvcGVydHkgPSByZXF1aXJlKCcuL2Nzc19tb2RpZmljYXRvcl9wcm9wZXJ0eScpXG5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL3RlbXBsYXRlJylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcblZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKVxuSW1hZ2VSYXRpbyA9IHJlcXVpcmUoJy4vaW1hZ2VfcmF0aW8nKVxuJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gZGVzaWduUGFyc2VyID1cblxuICBwYXJzZTogKGRlc2lnbkNvbmZpZykgLT5cbiAgICBAZGVzaWduID0gdW5kZWZpbmVkXG4gICAgaWYgZGVzaWduQ29uZmlnU2NoZW1hLnZhbGlkYXRlKCdkZXNpZ24nLCBkZXNpZ25Db25maWcpXG4gICAgICBAY3JlYXRlRGVzaWduKGRlc2lnbkNvbmZpZylcbiAgICBlbHNlXG4gICAgICBlcnJvcnMgPSBkZXNpZ25Db25maWdTY2hlbWEuZ2V0RXJyb3JNZXNzYWdlcygpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JzKVxuXG5cbiAgY3JlYXRlRGVzaWduOiAoZGVzaWduQ29uZmlnKSAtPlxuICAgIHsgYXNzZXRzLCBjb21wb25lbnRzLCBjb21wb25lbnRQcm9wZXJ0aWVzLCBncm91cHMsIGRlZmF1bHRDb21wb25lbnRzLCBpbWFnZVJhdGlvcyB9ID0gZGVzaWduQ29uZmlnXG4gICAgdHJ5XG4gICAgICBAZGVzaWduID0gQHBhcnNlRGVzaWduSW5mbyhkZXNpZ25Db25maWcpXG4gICAgICBAcGFyc2VBc3NldHMoYXNzZXRzKVxuICAgICAgQHBhcnNlQ29tcG9uZW50UHJvcGVydGllcyhjb21wb25lbnRQcm9wZXJ0aWVzKVxuICAgICAgQHBhcnNlSW1hZ2VSYXRpb3MoaW1hZ2VSYXRpb3MpXG4gICAgICBAcGFyc2VDb21wb25lbnRzKGNvbXBvbmVudHMpXG4gICAgICBAcGFyc2VHcm91cHMoZ3JvdXBzKVxuICAgICAgQHBhcnNlRGVmYXVsdHMoZGVmYXVsdENvbXBvbmVudHMpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGVycm9yLm1lc3NhZ2UgPSBcIkVycm9yIGNyZWF0aW5nIHRoZSBkZXNpZ246ICN7IGVycm9yLm1lc3NhZ2UgfVwiXG4gICAgICB0aHJvdyBlcnJvclxuXG4gICAgQGRlc2lnblxuXG5cbiAgcGFyc2VEZXNpZ25JbmZvOiAoZGVzaWduKSAtPlxuICAgIHZlcnNpb24gPSBuZXcgVmVyc2lvbihkZXNpZ24udmVyc2lvbilcbiAgICBuZXcgRGVzaWduXG4gICAgICBuYW1lOiBkZXNpZ24ubmFtZVxuICAgICAgdmVyc2lvbjogdmVyc2lvbi50b1N0cmluZygpXG5cblxuICAjIEFzc2V0c1xuICAjIC0tLS0tLVxuXG4gIHBhcnNlQXNzZXRzOiAoYXNzZXRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgYXNzZXRzP1xuXG4gICAgQGVhY2hBc3NldCBhc3NldHMuanMsIChhc3NldFVybCkgPT5cbiAgICAgIEBkZXNpZ24uZGVwZW5kZW5jaWVzLmFkZEpzKHNyYzogYXNzZXRVcmwpXG5cbiAgICBAZWFjaEFzc2V0IGFzc2V0cy5jc3MsIChhc3NldFVybCkgPT5cbiAgICAgIEBkZXNpZ24uZGVwZW5kZW5jaWVzLmFkZENzcyhzcmM6IGFzc2V0VXJsKVxuXG5cbiAgIyBJdGVyYXRlIHRocm91Z2ggYXNzZXRzXG4gICMgQHBhcmFtIHtTdHJpbmcgb3IgQXJyYXkgb2YgU3RyaW5ncyBvciB1bmRlZmluZWR9XG4gICMgQHBhcmFtIHtGdW5jdGlvbn1cbiAgZWFjaEFzc2V0OiAoZGF0YSwgY2FsbGJhY2spIC0+XG4gICAgcmV0dXJuIHVubGVzcyBkYXRhP1xuXG4gICAgaWYgJC50eXBlKGRhdGEpID09ICdzdHJpbmcnXG4gICAgICBjYWxsYmFjayhkYXRhKVxuICAgIGVsc2VcbiAgICAgIGZvciBlbnRyeSBpbiBkYXRhXG4gICAgICAgIGNhbGxiYWNrKGVudHJ5KVxuXG5cbiAgIyBDb21wb25lbnQgUHJvcGVydGllc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgIyBOb3RlOiBDdXJyZW50bHkgY29tcG9uZW50UHJvcGVydGllcyBjb25zaXN0IG9ubHkgb2YgZGVzaWduIHN0eWxlc1xuICBwYXJzZUNvbXBvbmVudFByb3BlcnRpZXM6IChjb21wb25lbnRQcm9wZXJ0aWVzKSAtPlxuICAgIEBjb21wb25lbnRQcm9wZXJ0aWVzID0ge31cbiAgICBmb3IgbmFtZSwgY29uZmlnIG9mIGNvbXBvbmVudFByb3BlcnRpZXNcbiAgICAgIGNvbmZpZy5uYW1lID0gbmFtZVxuICAgICAgQGNvbXBvbmVudFByb3BlcnRpZXNbbmFtZV0gPSBAY3JlYXRlQ29tcG9uZW50UHJvcGVydHkoY29uZmlnKVxuXG5cbiAgcGFyc2VJbWFnZVJhdGlvczogKHJhdGlvcykgLT5cbiAgICBmb3IgbmFtZSwgcmF0aW8gb2YgcmF0aW9zXG4gICAgICBAZGVzaWduLmltYWdlUmF0aW9zW25hbWVdID0gbmV3IEltYWdlUmF0aW9cbiAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICBsYWJlbDogcmF0aW8ubGFiZWxcbiAgICAgICAgcmF0aW86IHJhdGlvLnJhdGlvXG5cblxuICBwYXJzZUNvbXBvbmVudHM6IChjb21wb25lbnRzPVtdKSAtPlxuICAgIGZvciB7IG5hbWUsIGxhYmVsLCBodG1sLCBwcm9wZXJ0aWVzLCBkaXJlY3RpdmVzIH0gaW4gY29tcG9uZW50c1xuICAgICAgcHJvcGVydGllcyA9IEBsb29rdXBDb21wb25lbnRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG5cbiAgICAgIGNvbXBvbmVudCA9IG5ldyBUZW1wbGF0ZVxuICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgIGxhYmVsOiBsYWJlbFxuICAgICAgICBodG1sOiBodG1sXG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXNcblxuICAgICAgQHBhcnNlRGlyZWN0aXZlcyhjb21wb25lbnQsIGRpcmVjdGl2ZXMpXG4gICAgICBAZGVzaWduLmFkZChjb21wb25lbnQpXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChjb21wb25lbnQsIGRpcmVjdGl2ZXMpIC0+XG4gICAgZm9yIG5hbWUsIGNvbmYgb2YgZGlyZWN0aXZlc1xuICAgICAgZGlyZWN0aXZlID0gY29tcG9uZW50LmRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgICBhc3NlcnQgZGlyZWN0aXZlLCBcIkNvdWxkIG5vdCBmaW5kIGRpcmVjdGl2ZSAjeyBuYW1lIH0gaW4gI3sgY29tcG9uZW50Lm5hbWUgfSBjb21wb25lbnQuXCJcbiAgICAgIGRpcmVjdGl2ZUNvbmZpZyA9ICQuZXh0ZW5kKHt9LCBjb25mKVxuICAgICAgZGlyZWN0aXZlQ29uZmlnLmltYWdlUmF0aW9zID0gQGxvb2t1cEltYWdlUmF0aW9zKGNvbmYuaW1hZ2VSYXRpb3MpIGlmIGNvbmYuaW1hZ2VSYXRpb3NcbiAgICAgIGRpcmVjdGl2ZS5zZXRDb25maWcoZGlyZWN0aXZlQ29uZmlnKVxuXG5cbiAgbG9va3VwQ29tcG9uZW50UHJvcGVydGllczogKHByb3BlcnR5TmFtZXMpIC0+XG4gICAgcHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUgaW4gcHJvcGVydHlOYW1lcyB8fCBbXVxuICAgICAgcHJvcGVydHkgPSBAY29tcG9uZW50UHJvcGVydGllc1tuYW1lXVxuICAgICAgYXNzZXJ0IHByb3BlcnR5LCBcIlRoZSBjb21wb25lbnRQcm9wZXJ0eSAnI3sgbmFtZSB9JyB3YXMgbm90IGZvdW5kLlwiXG4gICAgICBwcm9wZXJ0aWVzW25hbWVdID0gcHJvcGVydHlcblxuICAgIHByb3BlcnRpZXNcblxuXG4gIGxvb2t1cEltYWdlUmF0aW9zOiAocmF0aW9OYW1lcykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJhdGlvTmFtZXM/XG4gICAgQG1hcEFycmF5IHJhdGlvTmFtZXMsIChuYW1lKSA9PlxuICAgICAgcmF0aW8gPSBAZGVzaWduLmltYWdlUmF0aW9zW25hbWVdXG4gICAgICBhc3NlcnQgcmF0aW8sIFwiVGhlIGltYWdlUmF0aW8gJyN7IG5hbWUgfScgd2FzIG5vdCBmb3VuZC5cIlxuICAgICAgcmF0aW9cblxuXG4gIHBhcnNlR3JvdXBzOiAoZ3JvdXBzPVtdKSAtPlxuICAgIGZvciBncm91cCBpbiBncm91cHNcbiAgICAgIGNvbXBvbmVudHMgPSBmb3IgY29tcG9uZW50TmFtZSBpbiBncm91cC5jb21wb25lbnRzXG4gICAgICAgIEBkZXNpZ24uZ2V0KGNvbXBvbmVudE5hbWUpXG5cbiAgICAgIEBkZXNpZ24uZ3JvdXBzLnB1c2hcbiAgICAgICAgbGFiZWw6IGdyb3VwLmxhYmVsXG4gICAgICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHNcblxuXG4gIHBhcnNlRGVmYXVsdHM6IChkZWZhdWx0Q29tcG9uZW50cykgLT5cbiAgICByZXR1cm4gdW5sZXNzIGRlZmF1bHRDb21wb25lbnRzP1xuICAgIHsgcGFyYWdyYXBoLCBpbWFnZSB9ID0gZGVmYXVsdENvbXBvbmVudHNcbiAgICBAZGVzaWduLmRlZmF1bHRQYXJhZ3JhcGggPSBAZ2V0Q29tcG9uZW50KHBhcmFncmFwaCkgaWYgcGFyYWdyYXBoXG4gICAgQGRlc2lnbi5kZWZhdWx0SW1hZ2UgPSBAZ2V0Q29tcG9uZW50KGltYWdlKSBpZiBpbWFnZVxuXG5cbiAgZ2V0Q29tcG9uZW50OiAobmFtZSkgLT5cbiAgICBjb21wb25lbnQgPSBAZGVzaWduLmdldChuYW1lKVxuICAgIGFzc2VydCBjb21wb25lbnQsIFwiQ291bGQgbm90IGZpbmQgY29tcG9uZW50ICN7IG5hbWUgfVwiXG4gICAgY29tcG9uZW50XG5cblxuICBjcmVhdGVDb21wb25lbnRQcm9wZXJ0eTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBuZXcgQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eShzdHlsZURlZmluaXRpb24pXG5cblxuICBtYXBBcnJheTogKGVudHJpZXMsIGxvb2t1cCkgLT5cbiAgICBuZXdBcnJheSA9IFtdXG4gICAgZm9yIGVudHJ5IGluIGVudHJpZXNcbiAgICAgIHZhbCA9IGxvb2t1cChlbnRyeSlcbiAgICAgIG5ld0FycmF5LnB1c2godmFsKSBpZiB2YWw/XG5cbiAgICBuZXdBcnJheVxuXG5cbkRlc2lnbi5wYXJzZXIgPSBkZXNpZ25QYXJzZXJcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUmF0aW9cblxuICByYXRpb1N0cmluZyA9IC8oXFxkKylbXFwvOnhdKFxcZCspL1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgbGFiZWwsIHJhdGlvIH0pIC0+XG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcbiAgICBAcmF0aW8gPSBAcGFyc2VSYXRpbyhyYXRpbylcblxuXG4gIHBhcnNlUmF0aW86IChyYXRpbykgLT5cbiAgICBpZiAkLnR5cGUocmF0aW8pID09ICdzdHJpbmcnXG4gICAgICByZXMgPSByYXRpb1N0cmluZy5leGVjKHJhdGlvKVxuICAgICAgcmF0aW8gPSBOdW1iZXIocmVzWzFdKSAvIE51bWJlcihyZXNbMl0pXG5cbiAgICBhc3NlcnQgJC50eXBlKHJhdGlvKSA9PSAnbnVtYmVyJywgXCJDb3VsZCBub3QgcGFyc2UgaW1hZ2UgcmF0aW8gI3sgcmF0aW8gfVwiXG4gICAgcmF0aW9cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmVyc2lvblxuICBAc2VtVmVyOiAgLyhcXGQrKVxcLihcXGQrKVxcLihcXGQrKSguKyk/L1xuXG4gIGNvbnN0cnVjdG9yOiAodmVyc2lvblN0cmluZykgLT5cbiAgICBAcGFyc2VWZXJzaW9uKHZlcnNpb25TdHJpbmcpXG5cblxuICBwYXJzZVZlcnNpb246ICh2ZXJzaW9uU3RyaW5nKSAtPlxuICAgIHJlcyA9IFZlcnNpb24uc2VtVmVyLmV4ZWModmVyc2lvblN0cmluZylcbiAgICBpZiByZXNcbiAgICAgIEBtYWpvciA9IHJlc1sxXVxuICAgICAgQG1pbm9yID0gcmVzWzJdXG4gICAgICBAcGF0Y2ggPSByZXNbM11cbiAgICAgIEBhZGRlbmR1bSA9IHJlc1s0XVxuXG5cbiAgaXNWYWxpZDogLT5cbiAgICBAbWFqb3I/XG5cblxuICB0b1N0cmluZzogLT5cbiAgICBcIiN7IEBtYWpvciB9LiN7IEBtaW5vciB9LiN7IEBwYXRjaCB9I3sgQGFkZGVuZHVtIHx8ICcnIH1cIlxuXG5cbiAgQHBhcnNlOiAodmVyc2lvblN0cmluZykgLT5cbiAgICB2ID0gbmV3IFZlcnNpb24odmVyc2lvblN0cmluZylcbiAgICBpZiB2LmlzVmFsaWQoKSB0aGVuIHYudG9TdHJpbmcoKSBlbHNlICcnXG5cbiIsIm1vZHVsZS5leHBvcnRzID1cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAnZGVmYXVsdCdcblxuICAjIFNldCB2YWx1ZSB0byBhbiBpbWFnZSBvciBiYWNrZ3JvdW5kIGltYWdlIGVsZW1lbnQuXG4gICNcbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH0gTm9kZSB0byBzZXQgdGhlIGltYWdlIHRvLlxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEltYWdlIHVybFxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBkaW0gPSBAZ2V0SW1hZ2VEaW1lbnNpb25zKCRlbGVtKVxuICAgIGltYWdlVXJsID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7IGRpbS53aWR0aCB9eCN7IGRpbS5oZWlnaHQgfS9CRUY1NkYvQjJFNjY4XCJcblxuXG4gICMgVGhlIGRlZmF1bHQgc2VydmljZSBkb2VzIG5vdCB0cmFuc2ZvciB0aGUgZ2l2ZW4gdXJsXG4gIGdldFVybDogKHZhbHVlKSAtPlxuICAgIHZhbHVlXG5cblxuICAjIERlZmF1bHQgSW1hZ2UgU2VydmljZSBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgZ2V0SW1hZ2VEaW1lbnNpb25zOiAoJGVsZW0pIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICB3aWR0aDogJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0OiAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoOiAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0ub3V0ZXJIZWlnaHQoKVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMCBpZiB2YWx1ZT9cblxuXG4gIGlzSW5saW5lSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG5cblxuICBpc0JhY2tncm91bmRJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT0gJ2ltZydcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kZWZhdWx0SW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxucmVzcmNpdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQXZhaWxhYmxlIEltYWdlIFNlcnZpY2VzXG4gIHNlcnZpY2VzID1cbiAgICAncmVzcmMuaXQnOiByZXNyY2l0SW1hZ2VTZXJ2aWNlXG4gICAgJ2RlZmF1bHQnOiBkZWZhdWx0SW1hZ2VTZXJ2aWNlXG5cblxuICAjIFNlcnZpY2VcbiAgIyAtLS0tLS0tXG5cbiAgaGFzOiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdP1xuXG5cbiAgZ2V0OiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgYXNzZXJ0IEBoYXMoc2VydmljZU5hbWUpLCBcIkNvdWxkIG5vdCBsb2FkIGltYWdlIHNlcnZpY2UgI3sgc2VydmljZU5hbWUgfVwiXG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdXG5cblxuICBlYWNoU2VydmljZTogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzZXJ2aWNlIG9mIHNlcnZpY2VzXG4gICAgICBjYWxsYmFjayhuYW1lLCBzZXJ2aWNlKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2Vfc2VydmljZScpXG5yZXNyY2l0Q29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKS5pbWFnZVNlcnZpY2VzWydyZXNyYy5pdCddXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAncmVzcmMuaXQnXG5cbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH1cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBBIHJlc3JjLml0IHVybC4gRS5nLiBodHRwOi8vYXBwLnJlc3JjLml0L2h0dHA6Ly9pbWFnZXMuY29tLzEuanBnXG4gIHNldDogKCRlbGVtLCB1cmwpIC0+XG4gICAgYXNzZXJ0IHVybD8gJiYgdXJsICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB1cmwpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQodXJsKVxuXG4gICAgJGVsZW0uYWRkQ2xhc3MoJ3Jlc3JjJylcbiAgICBpZiBpbWdTZXJ2aWNlLmlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHVybClcbiAgICBlbHNlXG4gICAgICBAc2V0QmFja2dyb3VuZEltYWdlKCRlbGVtLCB1cmwpXG5cblxuICBzZXRQbGFjZWhvbGRlcjogKCRlbGVtKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0UGxhY2Vob2xkZXIoJGVsZW0pXG5cblxuICBnZXRVcmw6ICh2YWx1ZSwgeyBjcm9wLCBxdWFsaXR5IH09e30pIC0+XG4gICAgc3R5bGUgPSBcIlwiXG4gICAgc3R5bGUgKz0gXCIvQz1XI3sgY3JvcC53aWR0aCB9LEgjeyBjcm9wLmhlaWdodCB9LFgjeyBjcm9wLnggfSxZI3sgY3JvcC55IH1cIiBpZiBjcm9wP1xuICAgIHN0eWxlICs9IFwiL089I3sgcSB9XCIgaWYgcSA9IHF1YWxpdHkgfHwgcmVzcmNpdENvbmZpZy5xdWFsaXR5XG4gICAgXCIjeyByZXNyY2l0Q29uZmlnLmhvc3QgfSN7IHN0eWxlIH0vI3sgdmFsdWUgfVwiXG5cblxuICAjIEltYWdlIHNwZWNpZmljIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZm9ybWF0Q3NzVXJsOiAodXJsKSAtPlxuICAgIHVybCA9IGltZ1NlcnZpY2UuZXNjYXBlQ3NzVXJpKHVybClcbiAgICBcInVybCgjeyB1cmwgfSlcIlxuXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCB1cmwpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIEBmb3JtYXRDc3NVcmwodXJsKSlcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCBiYXNlNjRTdHJpbmcpIC0+XG4gICAgaW1nU2VydmljZS5zZXQoJGVsZW0sIGJhc2U2NFN0cmluZylcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuaXNTdXBwb3J0ZWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQGNvbXBvbmVudE1vZGVsLCBjb21wb25lbnRWaWV3IH0pIC0+XG4gICAgQCR2aWV3ID0gY29tcG9uZW50Vmlldy4kaHRtbCBpZiBjb21wb25lbnRWaWV3XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBzdGFydDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLmRpc2FibGVBbGwoKVxuICAgIEBwYWdlLmJsdXJGb2N1c2VkRWxlbWVudCgpXG5cbiAgICAjIHBsYWNlaG9sZGVyIGJlbG93IGN1cnNvclxuICAgIEAkcGxhY2Vob2xkZXIgPSBAY3JlYXRlUGxhY2Vob2xkZXIoKS5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgIEAkZHJhZ0Jsb2NrZXIgPSBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpXG5cbiAgICAjIGRyb3AgbWFya2VyXG4gICAgQCRkcm9wTWFya2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcm9wTWFya2VyIH0nPlwiKVxuXG4gICAgQHBhZ2UuJGJvZHlcbiAgICAgIC5hcHBlbmQoQCRkcm9wTWFya2VyKVxuICAgICAgLmFwcGVuZChAJHBsYWNlaG9sZGVyKVxuICAgICAgLmNzcygnY3Vyc29yJywgJ3BvaW50ZXInKVxuXG4gICAgIyBtYXJrIGRyYWdnZWQgY29tcG9uZW50XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5jb21wb25lbnRWaWV3Py5tb2RlbCAhPSBAY29tcG9uZW50TW9kZWxcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIEBtYXJrRHJvcFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgIyBpZiB0YXJnZXQuY29udGFpbmVyTmFtZVxuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQucGFyZW50KVxuICAgICAgIyAgICRjb250YWluZXIgPSAkKHRhcmdldC5ub2RlKVxuICAgICAgIyBlbHNlIGlmIHRhcmdldC5jb21wb25lbnRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5jb21wb25lbnRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5nZXQkY29udGFpbmVyKClcblxuICAgICAgcmV0dXJuIHRhcmdldFxuICAgIGVsc2VcbiAgICAgIEAkZHJvcE1hcmtlci5oaWRlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuXG4gICAgICBpZiBub3QgdGFyZ2V0P1xuICAgICAgICBAJHBsYWNlaG9sZGVyLmFkZENsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBlbHNlXG4gICAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgbWFya0Ryb3BQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnY29tcG9uZW50J1xuICAgICAgICBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIGNvbXBvbmVudFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgYmVmb3JlID0gdGFyZ2V0LmNvbXBvbmVudFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBjb21wb25lbnRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQGNvbXBvbmVudFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzKGJlZm9yZSwgdGFyZ2V0LmNvbXBvbmVudFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuY29tcG9uZW50Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuICAgIGVsc2VcbiAgICAgIG5leHQgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQGNvbXBvbmVudE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQGNvbXBvbmVudFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzKHRhcmdldC5jb21wb25lbnRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LmNvbXBvbmVudFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcblxuXG4gIHNob3dNYXJrZXJCZXR3ZWVuQ29tcG9uZW50czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBwYWRkaW5nVG9wID0gcGFyc2VJbnQoJChlbGVtKS5jc3MoJ3BhZGRpbmctdG9wJykpIHx8IDBcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0ICsgcGFkZGluZ1RvcFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdCb3R0b20gPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy1ib3R0b20nKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3guYm90dG9tIC0gc3RhcnRBbmRFbmRPZmZzZXQgLSBwYWRkaW5nQm90dG9tXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG5cbiAgICAgIGlmIGNsaWVudFg/ICYmIGNsaWVudFk/XG4gICAgICAgIGVsZW0gPSBAcGFnZS5kb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG5cbiAgICAgIGlmIGVsZW0/Lm5vZGVOYW1lID09ICdJRlJBTUUnXG4gICAgICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGZpbmRFbGVtSW5JZnJhbWUoZWxlbSwgZXZlbnRQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgQGlmcmFtZUJveCA9IHVuZGVmaW5lZFxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gIGZpbmRFbGVtSW5JZnJhbWU6IChpZnJhbWVFbGVtLCBldmVudFBvc2l0aW9uKSAtPlxuICAgIEBpZnJhbWVCb3ggPSBib3ggPSBpZnJhbWVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgQGlmcmFtZUJveC53aW5kb3cgPSBpZnJhbWVFbGVtLmNvbnRlbnRXaW5kb3dcbiAgICBkb2N1bWVudCA9IGlmcmFtZUVsZW0uY29udGVudERvY3VtZW50XG4gICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG5cbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFggLT0gYm94LmxlZnRcbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFkgLT0gYm94LnRvcFxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVggPSBldmVudFBvc2l0aW9uLmNsaWVudFggKyAkYm9keS5zY3JvbGxMZWZ0KClcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VZID0gZXZlbnRQb3NpdGlvbi5jbGllbnRZICsgJGJvZHkuc2Nyb2xsVG9wKClcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudFBvc2l0aW9uLmNsaWVudFgsIGV2ZW50UG9zaXRpb24uY2xpZW50WSlcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICAjIFJlbW92ZSBlbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yIHdoaWNoIGNvdWxkIGludGVyZmVyZVxuICAjIHdpdGggZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCgpXG4gIHVuYmxvY2tFbGVtZW50RnJvbVBvaW50OiAoY2FsbGJhY2spIC0+XG5cbiAgICAjIFBvaW50ZXIgRXZlbnRzIGFyZSBhIGxvdCBmYXN0ZXIgc2luY2UgdGhlIGJyb3dzZXIgZG9lcyBub3QgbmVlZFxuICAgICMgdG8gcmVwYWludCB0aGUgd2hvbGUgc2NyZWVuLiBJRSA5IGFuZCAxMCBkbyBub3Qgc3VwcG9ydCB0aGVtLlxuICAgIGlmIGlzU3VwcG9ydGVkKCdodG1sUG9pbnRlckV2ZW50cycpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnYXV0bycpXG4gICAgZWxzZVxuICAgICAgQCRkcmFnQmxvY2tlci5oaWRlKClcbiAgICAgIEAkcGxhY2Vob2xkZXIuaGlkZSgpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLnNob3coKVxuICAgICAgQCRwbGFjZWhvbGRlci5zaG93KClcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLmNvbXBvbmVudFdhc0Ryb3BwZWQuZmlyZShAY29tcG9uZW50TW9kZWwpXG4gICAgZWxzZVxuICAgICAgI2NvbnNpZGVyOiBtYXliZSBhZGQgYSAnZHJvcCBmYWlsZWQnIGVmZmVjdFxuXG5cbiAgIyBNb3ZlIHRoZSBjb21wb25lbnQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdjb21wb25lbnQnXG4gICAgICAgIGNvbXBvbmVudFZpZXcgPSB0YXJnZXQuY29tcG9uZW50Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBjb21wb25lbnRWaWV3Lm1vZGVsLmJlZm9yZShAY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb21wb25lbnRWaWV3Lm1vZGVsLmFmdGVyKEBjb21wb25lbnRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5tb2RlbFxuICAgICAgICBjb21wb25lbnRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBjb21wb25lbnRNb2RlbClcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIGNvbXBvbmVudFRyZWUgPSB0YXJnZXQuY29tcG9uZW50VHJlZVxuICAgICAgICBjb21wb25lbnRUcmVlLnByZXBlbmQoQGNvbXBvbmVudE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIENvbXBvbmVudFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBjb21wb25lbnRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLmNvbXBvbmVudCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBjb21wb25lbnQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgQ29tcG9uZW50cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgY29tcG9uZW50UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRDb21wb25lbnRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZENvbXBvbmVudFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgY29tcG9uZW50Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudERhdGEgPSBAZ2V0Q2xvc2VzdENvbXBvbmVudChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0Q29tcG9uZW50RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQoY2xvc2VzdENvbXBvbmVudERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIGNvbXBvbmVudFxuICAgICAgZWxzZSBpZiBjb21wb25lbnRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldENvbXBvbmVudFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50RGF0YSA9IEBnZXRDbG9zZXN0Q29tcG9uZW50KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RDb21wb25lbnREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdENvbXBvbmVudFRhcmdldChjbG9zZXN0Q29tcG9uZW50RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRDb21wb25lbnRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdjb21wb25lbnQnXG4gICAgY29tcG9uZW50VmlldzogQGdldENvbXBvbmVudFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25Db21wb25lbnQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQ6IChjbG9zZXN0Q29tcG9uZW50RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdENvbXBvbmVudERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RDb21wb25lbnREYXRhLnBvc2l0aW9uXG4gICAgQGdldENvbXBvbmVudFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIGNvbXBvbmVudFZpZXc6IEBmaW5kQ29tcG9uZW50Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbXBvbmVudFRyZWUgPSAkKG5vZGUpLmRhdGEoJ2NvbXBvbmVudFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgY29tcG9uZW50VHJlZTogY29tcG9uZW50VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgY29tcG9uZW50XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PbkNvbXBvbmVudDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IGNvbXBvbmVudCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0Q29tcG9uZW50OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRjb21wb25lbnRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLmNvbXBvbmVudCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RDb21wb25lbnQgPSB1bmRlZmluZWRcblxuICAgICRjb21wb25lbnRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0Q29tcG9uZW50XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgY29tcG9uZW50IHRvIGJlIGFzIGhpZ2ggYXMgdGhleSBjYW4gYmVcbiAgIyBzZXRzIGNzcyBzdHlsZSBoZWlnaHRcbiAgbWF4aW1pemVDb250YWluZXJIZWlnaHQ6ICh2aWV3KSAtPlxuICAgIGlmIHZpZXcudGVtcGxhdGUuY29udGFpbmVyQ291bnQgPiAxXG4gICAgICBmb3IgbmFtZSwgZWxlbSBvZiB2aWV3LmNvbnRhaW5lcnNcbiAgICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICAgIGNvbnRpbnVlIGlmICRlbGVtLmhhc0NsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICAjIHJlbW92ZSBhbGwgY3NzIHN0eWxlIGhlaWdodCBkZWNsYXJhdGlvbnMgYWRkZWQgYnlcbiAgIyBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodCgpXG4gIHJlc3RvcmVDb250YWluZXJIZWlnaHQ6ICgpIC0+XG4gICAgJChcIi4jeyBjc3MubWF4aW1pemVkQ29udGFpbmVyIH1cIilcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLnJlbW92ZUNsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBDb21wb25lbnRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIFN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIFRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZFxuICAjIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSkuXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogKGV2ZW50KSAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKGV2ZW50KSBpZiBAc3RhcnRlZFxuICAgIGlmICQuaXNGdW5jdGlvbihAb3B0aW9ucy5vbkRyb3ApXG4gICAgICBAb3B0aW9ucy5vbkRyb3AoZXZlbnQsIEBkcmFnSGFuZGxlcilcbiAgICBAcmVzZXQoKVxuXG5cbiAgY2FuY2VsOiAtPlxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyYWdCbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpLnJlbW92ZSgpXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgICAnZHJvcC5saXZpbmdkb2NzLWRyYWcgZHJhZ2VuZC5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCAoZXZlbnQpID0+XG4gICAgICBAZHJvcChldmVudClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gY29tcG9uZW50RHJhZyNvblN0YXJ0XG4gIGFkZE1vdmVMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICd0b3VjaG1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdkcmFnb3Zlci5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdtb3VzZW1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG5cbiAgZ2V0RXZlbnRQb3NpdGlvbjogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnIHx8IGV2ZW50LnR5cGUgPT0gJ3RvdWNobW92ZSdcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXVxuXG4gICAgIyBTbyBmYXIgSSBkbyBub3QgdW5kZXJzdGFuZCB3aHkgdGhlIGpRdWVyeSBldmVudCBkb2VzIG5vdCBjb250YWluIGNsaWVudFggZXRjLlxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ292ZXInXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnRcblxuICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFhcbiAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgcGFnZVg6IGV2ZW50LnBhZ2VYXG4gICAgcGFnZVk6IGV2ZW50LnBhZ2VZXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5wYWdlWCAtIHBvaW50Qi5wYWdlWFxuICAgIGRpc3RZID0gcG9pbnRBLnBhZ2VZIC0gcG9pbnRCLnBhZ2VZXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIGVkaXRhYmxlLmpzIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBlZGl0YWJsZS5qcyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cblxuICAgICMgSW5pdGlhbGl6ZSBlZGl0YWJsZS5qc1xuICAgIEBlZGl0YWJsZSA9IG5ldyBFZGl0YWJsZVxuICAgICAgd2luZG93OiBAcGFnZS53aW5kb3dcbiAgICAgIGJyb3dzZXJTcGVsbGNoZWNrOiBjb25maWcuZWRpdGFibGUuYnJvd3NlclNwZWxsY2hlY2tcbiAgICAgIG1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXM6IGNvbmZpZy5lZGl0YWJsZS5tb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzXG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBlZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcbiAgICAgIC5jaGFuZ2UoQHdpdGhDb250ZXh0KEBjaGFuZ2UpKVxuXG5cbiAgIyBSZWdpc3RlciBET00gbm9kZXMgd2l0aCBlZGl0YWJsZS5qcy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgQGVkaXRhYmxlLmFkZChub2RlcylcblxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLnN1c3BlbmQoKVxuXG5cbiAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLmNvbnRpbnVlKClcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgZWRpdGFibGUuanNcbiAgI1xuICAjIEFsbCBsaXN0ZW5lcnMgcGFyYW1zIGdldCB0cmFuc2Zvcm1lZCBzbyB0aGV5IGdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWVcbiAgIyBpbnN0ZWFkIG9mIGVsZW1lbnQ6XG4gICNcbiAgIyBFeGFtcGxlOiBsaXN0ZW5lcih2aWV3LCBlZGl0YWJsZU5hbWUsIG90aGVyUGFyYW1zLi4uKVxuICB3aXRoQ29udGV4dDogKGZ1bmMpIC0+XG4gICAgKGVsZW1lbnQsIGFyZ3MuLi4pID0+XG4gICAgICB2aWV3ID0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIGV4dHJhY3RDb250ZW50OiAoZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KGVsZW1lbnQpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdW5kZWZpbmVkXG4gICAgZWxzZVxuICAgICAgdmFsdWVcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGV4dHJhY3RDb250ZW50KGVsZW1lbnQpXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudClcblxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcblxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgSW5zZXJ0IGEgbmV3IGJsb2NrLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGF0IHRoZSBlbmQgb2YgYSBibG9ja1xuICAjIG9yIGJ5IHByZXNzaW5nIGRlbGV0ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgYmxvY2suXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgZGVmYXVsdFBhcmFncmFwaCA9IEBwYWdlLmRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoXG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpICYmIGRlZmF1bHRQYXJhZ3JhcGg/XG4gICAgICBjb3B5ID0gZGVmYXVsdFBhcmFncmFwaC5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3VmlldyAmJiBkaXJlY3Rpb24gPT0gJ2FmdGVyJ1xuXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgTWVyZ2UgdHdvIGJsb2Nrcy4gV29ya3MgaW4gdHdvIGRpcmVjdGlvbnMuXG4gICMgRWl0aGVyIHRoZSBjdXJyZW50IGJsb2NrIGlzIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBwcmVjZWVkaW5nICgnYmVmb3JlJylcbiAgIyBvciB0aGUgZm9sbG93aW5nICgnYWZ0ZXInKSBibG9jay5cbiAgIyBBZnRlciB0aGUgbWVyZ2UgdGhlIGN1cnJlbnQgYmxvY2sgaXMgcmVtb3ZlZCBhbmQgdGhlIGZvY3VzIHNldCB0byB0aGVcbiAgIyBvdGhlciBibG9jayB0aGF0IHdhcyBtZXJnZWQgaW50by5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcbiAgICAgICAgdmlld0VsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBtZXJnZWRWaWV3RWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG5cbiAgICAgICAgIyBHYXRoZXIgdGhlIGNvbnRlbnQgdGhhdCBpcyBnb2luZyB0byBiZSBtZXJnZWRcbiAgICAgICAgY29udGVudFRvTWVyZ2UgPSBAZWRpdGFibGUuZ2V0Q29udGVudCh2aWV3RWxlbSlcblxuICAgICAgICBjdXJzb3IgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBAZWRpdGFibGUuYXBwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRhYmxlLnByZXBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZVNlbGVjdGlvbigpXG5cbiAgICAgICAgIyBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgYW5kIHRoZSBmb2N1cyBpcyBzZXQgdXBkYXRlIHRoZSBtb2RlbCB0b1xuICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgbW9kZWwgaXMgdXAgdG8gZGF0ZSBhbmQgY2hhbmdlcyBhcmUgbm90aWZpZWQuXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUsIG1lcmdlZFZpZXdFbGVtKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFNwbGl0IGEgYmxvY2sgaW4gdHdvLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGluIHRoZSBtaWRkbGUgb2YgYSBibG9jay5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2YgY29tcG9uZW50XG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChhZnRlcikpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKT8uZm9jdXMoKVxuXG4gICAgICAjIHNldCBjb250ZW50IG9mIHRoZSBiZWZvcmUgZWxlbWVudCAoYWZ0ZXIgZm9jdXMgaXMgc2V0IHRvIHRoZSBhZnRlciBlbGVtZW50KVxuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYmVmb3JlKSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBPY2N1cnMgd2hlbmV2ZXIgdGhlIHVzZXIgc2VsZWN0cyBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJzIG9yIHdoZW5ldmVyIHRoZVxuICAjIHNlbGVjdGlvbiBpcyBjaGFuZ2VkLlxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gICMgSW5zZXJ0IGEgbmV3bGluZSAoU2hpZnQgKyBFbnRlcilcbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgaWYgY29uZmlnLmVkaXRhYmxlLmFsbG93TmV3bGluZVxuICAgICAgcmV0dXJuIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBlbHNlXG4gICAgIHJldHVybiBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgVHJpZ2dlcmVkIHdoZW5ldmVyIHRoZSB1c2VyIGNoYW5nZXMgdGhlIGNvbnRlbnQgb2YgYSBibG9jay5cbiAgIyBUaGUgY2hhbmdlIGV2ZW50IGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgZmlyZSBpZiB0aGUgY29udGVudCBoYXNcbiAgIyBiZWVuIGNoYW5nZWQgdmlhIGphdmFzY3JpcHQuXG4gIGNoYW5nZTogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcbiAgICByZXR1cm4gaWYgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXlcblxuXG4gIGNsZWFyQ2hhbmdlVGltZW91dDogLT5cbiAgICBpZiBAY2hhbmdlVGltZW91dD9cbiAgICAgIGNsZWFyVGltZW91dChAY2hhbmdlVGltZW91dClcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIENvbXBvbmVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBjb21wb25lbnQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAY29tcG9uZW50VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQGNvbXBvbmVudEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBjb21wb25lbnRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChjb21wb25lbnRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIGNvbXBvbmVudFZpZXcgIT0gQGNvbXBvbmVudFZpZXdcbiAgICAgIEByZXNldENvbXBvbmVudFZpZXcoKVxuICAgICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgICBAY29tcG9uZW50VmlldyA9IGNvbXBvbmVudFZpZXdcbiAgICAgICAgQGNvbXBvbmVudEZvY3VzLmZpcmUoQGNvbXBvbmVudFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBjb21wb25lbnRWaWV3IHx8PSBkb20uZmluZENvbXBvbmVudFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKGNvbXBvbmVudFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAY29tcG9uZW50VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIGNvbXBvbmVudEZvY3VzZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBjb21wb25lbnRWaWV3ICE9IGNvbXBvbmVudFZpZXdcbiAgICAgIEBzZXRGb2N1cyhjb21wb25lbnRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0Q29tcG9uZW50VmlldzogLT5cbiAgICBpZiBAY29tcG9uZW50Vmlld1xuICAgICAgcHJldmlvdXMgPSBAY29tcG9uZW50Vmlld1xuICAgICAgQGNvbXBvbmVudFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBjb21wb25lbnRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi9pbnRlcmFjdGlvbi9kb20nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuQ29tcG9uZW50VHJlZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUnKVxuRGVwZW5kZW5jaWVzID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvZGVwZW5kZW5jaWVzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBMaXZpbmdkb2MgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblxuXG4gICMgQ3JlYXRlIGEgbmV3IGxpdmluZ2RvYyBpbiBhIHN5bmNocm9ub3VzIHdheS5cbiAgIyBUaGUgZGVzaWduIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICAjXG4gICMgQ2FsbCBPcHRpb25zOlxuICAjIC0gbmV3KHsgZGF0YSB9KVxuICAjICAgTG9hZCBhIGxpdmluZ2RvYyB3aXRoIEpTT04gZGF0YVxuICAjXG4gICMgLSBuZXcoeyBkZXNpZ24gfSlcbiAgIyAgIFRoaXMgd2lsbCBjcmVhdGUgYSBuZXcgZW1wdHkgbGl2aW5nZG9jIHdpdGggeW91clxuICAjICAgc3BlY2lmaWVkIGRlc2lnblxuICAjXG4gICMgLSBuZXcoeyBjb21wb25lbnRUcmVlIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGxpdmluZ2RvYyBmcm9tIGFcbiAgIyAgIGNvbXBvbmVudFRyZWVcbiAgI1xuICAjIEBwYXJhbSBkYXRhIHsganNvbiBzdHJpbmcgfSBTZXJpYWxpemVkIExpdmluZ2RvY1xuICAjIEBwYXJhbSBkZXNpZ25OYW1lIHsgc3RyaW5nIH0gTmFtZSBvZiBhIGRlc2lnblxuICAjIEBwYXJhbSBjb21wb25lbnRUcmVlIHsgQ29tcG9uZW50VHJlZSB9IEEgY29tcG9uZW50VHJlZSBpbnN0YW5jZVxuICAjIEByZXR1cm5zIHsgTGl2aW5nZG9jIG9iamVjdCB9XG4gIEBjcmVhdGU6ICh7IGRhdGEsIGRlc2lnbk5hbWUsIGNvbXBvbmVudFRyZWUgfSkgLT5cbiAgICBjb21wb25lbnRUcmVlID0gaWYgZGF0YT9cbiAgICAgIGRlc2lnbk5hbWUgPSBkYXRhLmRlc2lnbj8ubmFtZVxuICAgICAgYXNzZXJ0IGRlc2lnbk5hbWU/LCAnRXJyb3IgY3JlYXRpbmcgbGl2aW5nZG9jOiBObyBkZXNpZ24gaXMgc3BlY2lmaWVkLidcbiAgICAgIGRlc2lnbiA9IGRlc2lnbkNhY2hlLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IENvbXBvbmVudFRyZWUoY29udGVudDogZGF0YSwgZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZSBpZiBkZXNpZ25OYW1lP1xuICAgICAgZGVzaWduID0gZGVzaWduQ2FjaGUuZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgQ29tcG9uZW50VHJlZShkZXNpZ246IGRlc2lnbilcbiAgICBlbHNlXG4gICAgICBjb21wb25lbnRUcmVlXG5cbiAgICBuZXcgTGl2aW5nZG9jKHsgY29tcG9uZW50VHJlZSB9KVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbXBvbmVudFRyZWUgfSkgLT5cbiAgICBAZGVzaWduID0gY29tcG9uZW50VHJlZS5kZXNpZ25cblxuICAgIEBjb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGRlcGVuZGVuY2llcyA9IHVuZGVmaW5lZFxuICAgIEBzZXRDb21wb25lbnRUcmVlKGNvbXBvbmVudFRyZWUpXG5cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdW5kZWZpbmVkXG4gICAgQGFkZGl0aW9uYWxWaWV3cyA9IFtdXG5cblxuICAjIEdldCBhIGRyb3AgdGFyZ2V0IGZvciBhbiBldmVudFxuICBnZXREcm9wVGFyZ2V0OiAoeyBldmVudCB9KSAtPlxuICAgIGRvY3VtZW50ID0gZXZlbnQudGFyZ2V0Lm93bmVyRG9jdW1lbnRcbiAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50XG4gICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcbiAgICBpZiBlbGVtP1xuICAgICAgY29vcmRzID0geyBsZWZ0OiBldmVudC5wYWdlWCwgdG9wOiBldmVudC5wYWdlWSB9XG4gICAgICB0YXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCBjb29yZHMpXG5cblxuICBzZXRDb21wb25lbnRUcmVlOiAoY29tcG9uZW50VHJlZSkgLT5cbiAgICBhc3NlcnQgY29tcG9uZW50VHJlZS5kZXNpZ24gPT0gQGRlc2lnbixcbiAgICAgICdDb21wb25lbnRUcmVlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZXNpZ24gYXMgdGhlIGRvY3VtZW50J1xuXG4gICAgQG1vZGVsID0gQGNvbXBvbmVudFRyZWUgPSBjb21wb25lbnRUcmVlXG4gICAgQGRlcGVuZGVuY2llcyA9IG5ldyBEZXBlbmRlbmNpZXMoeyBAY29tcG9uZW50VHJlZSB9KVxuICAgIEBmb3J3YXJkQ29tcG9uZW50VHJlZUV2ZW50cygpXG5cblxuICBmb3J3YXJkQ29tcG9uZW50VHJlZUV2ZW50czogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jaGFuZ2VkLmFkZCA9PlxuICAgICAgQGVtaXQgJ2NoYW5nZScsIGFyZ3VtZW50c1xuXG5cbiAgY3JlYXRlVmlldzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBvcHRpb25zLnJlYWRPbmx5ID89IHRydWVcblxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuXG4gICAgb3B0aW9ucy4kd3JhcHBlciA/PSBAZmluZFdyYXBwZXIoJHBhcmVudClcbiAgICAkcGFyZW50Lmh0bWwoJycpICMgZW1wdHkgY29udGFpbmVyXG5cbiAgICB2aWV3ID0gbmV3IFZpZXcodGhpcywgJHBhcmVudFswXSlcbiAgICB3aGVuVmlld0lzUmVhZHkgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG4gICAgICB3aGVuVmlld0lzUmVhZHkudGhlbiAoeyBpZnJhbWUsIHJlbmRlcmVyIH0pID0+XG4gICAgICAgIEBjb21wb25lbnRUcmVlLnNldE1haW5WaWV3KHZpZXcpXG5cbiAgICB3aGVuVmlld0lzUmVhZHlcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jcmVhdGVDb21wb25lbnQuYXBwbHkoQGNvbXBvbmVudFRyZWUsIGFyZ3VtZW50cylcblxuXG4gICMgQXBwZW5kIHRoZSBhcnRpY2xlIHRvIHRoZSBET00uXG4gICNcbiAgIyBAcGFyYW0geyBET00gTm9kZSwgalF1ZXJ5IG9iamVjdCBvciBDU1Mgc2VsZWN0b3Igc3RyaW5nIH0gV2hlcmUgdG8gYXBwZW5kIHRoZSBhcnRpY2xlIGluIHRoZSBkb2N1bWVudC5cbiAgIyBAcGFyYW0geyBPYmplY3QgfSBvcHRpb25zOlxuICAjICAgaW50ZXJhY3RpdmU6IHsgQm9vbGVhbiB9IFdoZXRoZXIgdGhlIGRvY3VtZW50IGlzIGVkdGlhYmxlLlxuICAjICAgbG9hZEFzc2V0czogeyBCb29sZWFuIH0gTG9hZCBKcyBhbmQgQ1NTIGZpbGVzLlxuICAjICAgICBPbmx5IGRpc2FibGUgdGhpcyBpZiB5b3UgYXJlIHN1cmUgeW91IGhhdmUgbG9hZGVkIGV2ZXJ5dGhpbmcgbWFudWFsbHkuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGFydGljbGUuYXBwZW5kVG8oJy5hcnRpY2xlJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSwgbG9hZEFzc2V0czogZmFsc2UgfSk7XG4gIGFwcGVuZFRvOiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KHRoaXMsICRwYXJlbnRbMF0pXG4gICAgdmlldy5jcmVhdGVSZW5kZXJlcih7IG9wdGlvbnMgfSlcblxuXG5cbiAgIyBBIHZpZXcgc29tZXRpbWVzIGhhcyB0byBiZSB3cmFwcGVkIGluIGEgY29udGFpbmVyLlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBIZXJlIHRoZSBkb2N1bWVudCBpcyByZW5kZXJlZCBpbnRvICQoJy5kb2Mtc2VjdGlvbicpXG4gICMgPGRpdiBjbGFzcz1cImlmcmFtZS1jb250YWluZXJcIj5cbiAgIyAgIDxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+PC9zZWN0aW9uPlxuICAjIDwvZGl2PlxuICBmaW5kV3JhcHBlcjogKCRwYXJlbnQpIC0+XG4gICAgaWYgJHBhcmVudC5maW5kKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIpLmxlbmd0aCA9PSAxXG4gICAgICAkd3JhcHBlciA9ICQoJHBhcmVudC5odG1sKCkpXG5cbiAgICAkd3JhcHBlclxuXG5cbiAgc2V0SW50ZXJhY3RpdmVWaWV3OiAodmlldykgLT5cbiAgICBhc3NlcnQgbm90IEBpbnRlcmFjdGl2ZVZpZXc/LFxuICAgICAgJ0Vycm9yIGNyZWF0aW5nIGludGVyYWN0aXZlIHZpZXc6IExpdmluZ2RvYyBjYW4gaGF2ZSBvbmx5IG9uZSBpbnRlcmFjdGl2ZSB2aWV3J1xuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHZpZXdcblxuXG4gIGFkZEpzRGVwZW5kZW5jeTogKG9iaikgLT5cbiAgICBAZGVwZW5kZW5jaWVzLmFkZEpzKG9iailcblxuXG4gIGFkZENzc0RlcGVuZGVuY3k6IChvYmopIC0+XG4gICAgQGRlcGVuZGVuY2llcy5hZGRDc3Mob2JqKVxuXG5cbiAgaGFzRGVwZW5kZW5jaWVzOiAtPlxuICAgIEBkZXBlbmRlbmNpZXM/Lmhhc0pzKCkgfHwgQGRlcGVuZGVuY2llcz8uaGFzQ3NzKClcblxuXG4gIHRvSHRtbDogKHsgZXhjbHVkZUNvbXBvbmVudHMgfT17fSkgLT5cbiAgICBuZXcgUmVuZGVyZXIoXG4gICAgICBjb21wb25lbnRUcmVlOiBAY29tcG9uZW50VHJlZVxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBuZXcgUmVuZGVyaW5nQ29udGFpbmVyKClcbiAgICAgIGV4Y2x1ZGVDb21wb25lbnRzOiBleGNsdWRlQ29tcG9uZW50c1xuICAgICkuaHRtbCgpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuc2VyaWFsaXplKClcblxuXG4gIHRvSnNvbjogKHByZXR0aWZ5KSAtPlxuICAgIGRhdGEgPSBAc2VyaWFsaXplKClcbiAgICBpZiBwcmV0dGlmeT9cbiAgICAgIHJlcGxhY2VyID0gbnVsbFxuICAgICAgaW5kZW50YXRpb24gPSAyXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgaW5kZW50YXRpb24pXG4gICAgZWxzZVxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSlcblxuXG4gICMgRGVidWdcbiAgIyAtLS0tLVxuXG4gICMgUHJpbnQgdGhlIENvbXBvbmVudFRyZWUuXG4gIHByaW50TW9kZWw6ICgpIC0+XG4gICAgQGNvbXBvbmVudFRyZWUucHJpbnQoKVxuXG5cbiAgTGl2aW5nZG9jLmRvbSA9IGRvbVxuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEFkZCBhbiBldmVudCBsaXN0ZW5lciB0byBhICQuQ2FsbGJhY2tzIG9iamVjdCB0aGF0IHdpbGxcbiAgIyByZW1vdmUgaXRzZWxmIGZyb20gaXRzICQuQ2FsbGJhY2tzIGFmdGVyIHRoZSBmaXJzdCBjYWxsLlxuICBjYWxsT25jZTogKGNhbGxiYWNrcywgbGlzdGVuZXIpIC0+XG4gICAgc2VsZlJlbW92aW5nRnVuYyA9IChhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2tzLnJlbW92ZShzZWxmUmVtb3ZpbmdGdW5jKVxuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncylcblxuICAgIGNhbGxiYWNrcy5hZGQoc2VsZlJlbW92aW5nRnVuYylcbiAgICBzZWxmUmVtb3ZpbmdGdW5jXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGh0bWxQb2ludGVyRXZlbnRzOiAtPlxuICAgIGVsZW1lbnQgPSAkKCc8eD4nKVswXVxuICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJ1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPT0gJ2F1dG8nXG4iLCJkZXRlY3RzID0gcmVxdWlyZSgnLi9mZWF0dXJlX2RldGVjdHMnKVxuXG5leGVjdXRlZFRlc3RzID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSAobmFtZSkgLT5cbiAgaWYgKHJlc3VsdCA9IGV4ZWN1dGVkVGVzdHNbbmFtZV0pID09IHVuZGVmaW5lZFxuICAgIGV4ZWN1dGVkVGVzdHNbbmFtZV0gPSBCb29sZWFuKGRldGVjdHNbbmFtZV0oKSlcbiAgZWxzZVxuICAgIHJlc3VsdFxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaWRDb3VudGVyID0gbGFzdElkID0gdW5kZWZpbmVkXG5cbiAgIyBHZW5lcmF0ZSBhIHVuaXF1ZSBpZC5cbiAgIyBHdWFyYW50ZWVzIGEgdW5pcXVlIGlkIGluIHRoaXMgcnVudGltZS5cbiAgIyBBY3Jvc3MgcnVudGltZXMgaXRzIGxpa2VseSBidXQgbm90IGd1YXJhbnRlZWQgdG8gYmUgdW5pcXVlXG4gICMgVXNlIHRoZSB1c2VyIHByZWZpeCB0byBhbG1vc3QgZ3VhcmFudGVlIHVuaXF1ZW5lc3MsXG4gICMgYXNzdW1pbmcgdGhlIHNhbWUgdXNlciBjYW5ub3QgZ2VuZXJhdGUgY29tcG9uZW50cyBpblxuICAjIG11bHRpcGxlIHJ1bnRpbWVzIGF0IHRoZSBzYW1lIHRpbWUgKGFuZCB0aGF0IGNsb2NrcyBhcmUgaW4gc3luYylcbiAgbmV4dDogKHVzZXIgPSAnZG9jJykgLT5cblxuICAgICMgZ2VuZXJhdGUgOS1kaWdpdCB0aW1lc3RhbXBcbiAgICBuZXh0SWQgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDMyKVxuXG4gICAgIyBhZGQgY291bnRlciBpZiBtdWx0aXBsZSB0cmVlcyBuZWVkIGlkcyBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZFxuICAgIGlmIGxhc3RJZCA9PSBuZXh0SWRcbiAgICAgIGlkQ291bnRlciArPSAxXG4gICAgZWxzZVxuICAgICAgaWRDb3VudGVyID0gMFxuICAgICAgbGFzdElkID0gbmV4dElkXG5cbiAgICBcIiN7IHVzZXIgfS0jeyBuZXh0SWQgfSN7IGlkQ291bnRlciB9XCJcbiIsIm1vZHVsZS5leHBvcnRzID0gJFxuIiwibG9nID0gcmVxdWlyZSgnLi9sb2cnKVxuXG4jIEZ1bmN0aW9uIHRvIGFzc2VydCBhIGNvbmRpdGlvbi4gSWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LCBhbiBlcnJvciBpc1xuIyByYWlzZWQgd2l0aCB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgYXNzZXJ0IGEgaXNudCBiLCAnYSBjYW4gbm90IGJlIGInXG4jXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2VydCA9IChjb25kaXRpb24sIG1lc3NhZ2UpIC0+XG4gIGxvZy5lcnJvcihtZXNzYWdlKSB1bmxlc3MgY29uZGl0aW9uXG4iLCJcbiMgTG9nIEhlbHBlclxuIyAtLS0tLS0tLS0tXG4jIERlZmF1bHQgbG9nZ2luZyBoZWxwZXJcbiMgQHBhcmFtczogcGFzcyBgXCJ0cmFjZVwiYCBhcyBsYXN0IHBhcmFtZXRlciB0byBvdXRwdXQgdGhlIGNhbGwgc3RhY2tcbm1vZHVsZS5leHBvcnRzID0gbG9nID0gKGFyZ3MuLi4pIC0+XG4gIGlmIHdpbmRvdy5jb25zb2xlP1xuICAgIGlmIGFyZ3MubGVuZ3RoIGFuZCBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ3RyYWNlJ1xuICAgICAgYXJncy5wb3AoKVxuICAgICAgd2luZG93LmNvbnNvbGUudHJhY2UoKSBpZiB3aW5kb3cuY29uc29sZS50cmFjZT9cblxuICAgIHdpbmRvdy5jb25zb2xlLmxvZy5hcHBseSh3aW5kb3cuY29uc29sZSwgYXJncylcbiAgICB1bmRlZmluZWRcblxuXG5kbyAtPlxuXG4gICMgQ3VzdG9tIGVycm9yIHR5cGUgZm9yIGxpdmluZ2RvY3MuXG4gICMgV2UgY2FuIHVzZSB0aGlzIHRvIHRyYWNrIHRoZSBvcmlnaW4gb2YgYW4gZXhwZWN0aW9uIGluIHVuaXQgdGVzdHMuXG4gIGNsYXNzIExpdmluZ2RvY3NFcnJvciBleHRlbmRzIEVycm9yXG5cbiAgICBjb25zdHJ1Y3RvcjogKG1lc3NhZ2UpIC0+XG4gICAgICBzdXBlclxuICAgICAgQG1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICBAdGhyb3duQnlMaXZpbmdkb2NzID0gdHJ1ZVxuXG5cbiAgIyBAcGFyYW0gbGV2ZWw6IG9uZSBvZiB0aGVzZSBzdHJpbmdzOlxuICAjICdjcml0aWNhbCcsICdlcnJvcicsICd3YXJuaW5nJywgJ2luZm8nLCAnZGVidWcnXG4gIG5vdGlmeSA9IChtZXNzYWdlLCBsZXZlbCA9ICdlcnJvcicpIC0+XG4gICAgaWYgX3JvbGxiYXI/XG4gICAgICBfcm9sbGJhci5wdXNoIG5ldyBFcnJvcihtZXNzYWdlKSwgLT5cbiAgICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJykgYW5kIHdpbmRvdy5jb25zb2xlPy5lcnJvcj9cbiAgICAgICAgICB3aW5kb3cuY29uc29sZS5lcnJvci5jYWxsKHdpbmRvdy5jb25zb2xlLCBtZXNzYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuICAgIGVsc2VcbiAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpXG4gICAgICAgIHRocm93IG5ldyBMaXZpbmdkb2NzRXJyb3IobWVzc2FnZSlcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmNhbGwodW5kZWZpbmVkLCBtZXNzYWdlKVxuXG4gICAgdW5kZWZpbmVkXG5cblxuICBsb2cuZGVidWcgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2RlYnVnJykgdW5sZXNzIGxvZy5kZWJ1Z0Rpc2FibGVkXG5cblxuICBsb2cud2FybiA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnd2FybmluZycpIHVubGVzcyBsb2cud2FybmluZ3NEaXNhYmxlZFxuXG5cbiAgIyBMb2cgZXJyb3IgYW5kIHRocm93IGV4Y2VwdGlvblxuICBsb2cuZXJyb3IgPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ2Vycm9yJylcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBPcmRlcmVkSGFzaFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBvYmogPSB7fVxuICAgIEBsZW5ndGggPSAwXG5cblxuICBwdXNoOiAoa2V5LCB2YWx1ZSkgLT5cbiAgICBAb2JqW2tleV0gPSB2YWx1ZVxuICAgIEBbQGxlbmd0aF0gPSB2YWx1ZVxuICAgIEBsZW5ndGggKz0gMVxuXG5cbiAgZ2V0OiAoa2V5KSAtPlxuICAgIEBvYmpba2V5XVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciB2YWx1ZSBpbiB0aGlzXG4gICAgICBjYWxsYmFjayh2YWx1ZSlcblxuXG4gIHRvQXJyYXk6IC0+XG4gICAgdmFsdWUgZm9yIHZhbHVlIGluIHRoaXNcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbiMgVGhpcyBjbGFzcyBjYW4gYmUgdXNlZCB0byB3YWl0IGZvciB0YXNrcyB0byBmaW5pc2ggYmVmb3JlIGZpcmluZyBhIHNlcmllcyBvZlxuIyBjYWxsYmFja3MuIE9uY2Ugc3RhcnQoKSBpcyBjYWxsZWQsIHRoZSBjYWxsYmFja3MgZmlyZSBhcyBzb29uIGFzIHRoZSBjb3VudFxuIyByZWFjaGVzIDAuIFRodXMsIHlvdSBzaG91bGQgaW5jcmVtZW50IHRoZSBjb3VudCBiZWZvcmUgc3RhcnRpbmcgaXQuIFdoZW5cbiMgYWRkaW5nIGEgY2FsbGJhY2sgYWZ0ZXIgaGF2aW5nIGZpcmVkIGNhdXNlcyB0aGUgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHJpZ2h0XG4jIGF3YXkuIEluY3JlbWVudGluZyB0aGUgY291bnQgYWZ0ZXIgaXQgZmlyZWQgcmVzdWx0cyBpbiBhbiBlcnJvci5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiNcbiMgICBzZW1hcGhvcmUuaW5jcmVtZW50KClcbiMgICBkb1NvbWV0aGluZygpLnRoZW4oc2VtYXBob3JlLmRlY3JlbWVudCgpKVxuI1xuIyAgIGRvQW5vdGhlclRoaW5nVGhhdFRha2VzQUNhbGxiYWNrKHNlbWFwaG9yZS53YWl0KCkpXG4jXG4jICAgc2VtYXBob3JlLnN0YXJ0KClcbiNcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ2hlbGxvJykpXG4jXG4jICAgIyBPbmNlIGNvdW50IHJlYWNoZXMgMCBjYWxsYmFjayBpcyBleGVjdXRlZDpcbiMgICAjID0+ICdoZWxsbydcbiNcbiMgICAjIEFzc3VtaW5nIHRoYXQgc2VtYXBob3JlIHdhcyBhbHJlYWR5IGZpcmVkOlxuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5JykpXG4jICAgIyA9PiAndGhpcyB3aWxsIHByaW50IGltbWVkaWF0ZWx5J1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTZW1hcGhvcmVcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY291bnQgPSAwXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgIEB3YXNGaXJlZCA9IGZhbHNlXG4gICAgQGNhbGxiYWNrcyA9IFtdXG5cblxuICBhZGRDYWxsYmFjazogKGNhbGxiYWNrKSAtPlxuICAgIGlmIEB3YXNGaXJlZFxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHdhc0ZpcmVkXG5cblxuICBzdGFydDogLT5cbiAgICBhc3NlcnQgbm90IEBzdGFydGVkLFxuICAgICAgXCJVbmFibGUgdG8gc3RhcnQgU2VtYXBob3JlIG9uY2Ugc3RhcnRlZC5cIlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICBpbmNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAd2FzRmlyZWQsXG4gICAgICBcIlVuYWJsZSB0byBpbmNyZW1lbnQgY291bnQgb25jZSBTZW1hcGhvcmUgaXMgZmlyZWQuXCJcbiAgICBAY291bnQgKz0gMVxuXG5cbiAgZGVjcmVtZW50OiAtPlxuICAgIGFzc2VydCBAY291bnQgPiAwLFxuICAgICAgXCJVbmFibGUgdG8gZGVjcmVtZW50IGNvdW50IHJlc3VsdGluZyBpbiBuZWdhdGl2ZSBjb3VudC5cIlxuICAgIEBjb3VudCAtPSAxXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIHdhaXQ6IC0+XG4gICAgQGluY3JlbWVudCgpXG4gICAgPT4gQGRlY3JlbWVudCgpXG5cblxuICAjIEBwcml2YXRlXG4gIGZpcmVJZlJlYWR5OiAtPlxuICAgIGlmIEBjb3VudCA9PSAwICYmIEBzdGFydGVkID09IHRydWVcbiAgICAgIEB3YXNGaXJlZCA9IHRydWVcbiAgICAgIGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpc0VtcHR5OiAob2JqKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBvYmo/XG4gICAgZm9yIG5hbWUgb2Ygb2JqXG4gICAgICByZXR1cm4gZmFsc2UgaWYgb2JqLmhhc093blByb3BlcnR5KG5hbWUpXG5cbiAgICB0cnVlXG5cblxuICBmbGF0Q29weTogKG9iaikgLT5cbiAgICBjb3B5ID0gdW5kZWZpbmVkXG5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2Ygb2JqXG4gICAgICBjb3B5IHx8PSB7fVxuICAgICAgY29weVtuYW1lXSA9IHZhbHVlXG5cbiAgICBjb3B5XG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcblxuIyBTdHJpbmcgSGVscGVyc1xuIyAtLS0tLS0tLS0tLS0tLVxuIyBpbnNwaXJlZCBieSBbaHR0cHM6Ly9naXRodWIuY29tL2VwZWxpL3VuZGVyc2NvcmUuc3RyaW5nXSgpXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ0NhbWVsIENhc2UnXG4gIGh1bWFuaXplOiAoc3RyKSAtPlxuICAgIHVuY2FtZWxpemVkID0gJC50cmltKHN0cikucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSspL2csICckMSAkMicpLnRvTG93ZXJDYXNlKClcbiAgICBAdGl0bGVpemUoIHVuY2FtZWxpemVkIClcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIHRvIHVwcGVyY2FzZVxuICBjYXBpdGFsaXplIDogKHN0cikgLT5cbiAgICAgIHN0ciA9IGlmICFzdHI/IHRoZW4gJycgZWxzZSBTdHJpbmcoc3RyKVxuICAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcblxuXG4gICMgY29udmVydCB0aGUgZmlyc3QgbGV0dGVyIG9mIGV2ZXJ5IHdvcmQgdG8gdXBwZXJjYXNlXG4gIHRpdGxlaXplOiAoc3RyKSAtPlxuICAgIGlmICFzdHI/XG4gICAgICAnJ1xuICAgIGVsc2VcbiAgICAgIFN0cmluZyhzdHIpLnJlcGxhY2UgLyg/Ol58XFxzKVxcUy9nLCAoYykgLT5cbiAgICAgICAgYy50b1VwcGVyQ2FzZSgpXG5cblxuICAjIGNvbnZlcnQgJ2NhbWVsQ2FzZScgdG8gJ2NhbWVsLWNhc2UnXG4gIHNuYWtlQ2FzZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW0EtWl0pL2csICctJDEnKS5yZXBsYWNlKC9bLV9cXHNdKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcblxuXG4gICMgcHJlcGVuZCBhIHByZWZpeCB0byBhIHN0cmluZyBpZiBpdCBpcyBub3QgYWxyZWFkeSBwcmVzZW50XG4gIHByZWZpeDogKHByZWZpeCwgc3RyaW5nKSAtPlxuICAgIGlmIHN0cmluZy5pbmRleE9mKHByZWZpeCkgPT0gMFxuICAgICAgc3RyaW5nXG4gICAgZWxzZVxuICAgICAgXCJcIiArIHByZWZpeCArIHN0cmluZ1xuXG5cbiAgIyBKU09OLnN0cmluZ2lmeSB3aXRoIHJlYWRhYmlsaXR5IGluIG1pbmRcbiAgIyBAcGFyYW0gb2JqZWN0OiBqYXZhc2NyaXB0IG9iamVjdFxuICByZWFkYWJsZUpzb246IChvYmopIC0+XG4gICAgSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKSAjIFwiXFx0XCJcblxuXG4gIGNhbWVsaXplOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICAgICBjLnRvVXBwZXJDYXNlKClcbiAgICApXG5cbiAgdHJpbTogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG5cblxuICAjIEV4dHJhY3Qgb25seSB0aGUgdGV4dCBmcm9tIGFuIEhUTUwgc3RyaW5nXG4gICMgJzxkaXY+QSAmYW1wOyBCPC9kaXY+JyAtPiAnQSAmIEInXG4gIGV4dHJhY3RUZXh0RnJvbUh0bWw6IChzdHIpIC0+XG4gICAgZGl2ID0gJCgnPGRpdj4nKVswXVxuICAgIGRpdi5pbm5lckhUTUwgPSBzdHJcbiAgICBkaXYudGV4dENvbnRlbnRcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEAkZWxlbSA9IEAkaHRtbFxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdjb21wb25lbnRWaWV3JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNzcy5jb21wb25lbnQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50KVxuXG4gICAgaWYgbm90IEBoYXNGb2N1cygpXG4gICAgICBAZGlzcGxheU9wdGlvbmFscygpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICB1cGRhdGVIdG1sOiAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBAbW9kZWwuc3R5bGVzXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICBkaXNwbGF5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICAkZWxlbSA9ICQoZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIGlmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICcnKVxuXG5cbiAgIyBTaG93IGFsbCBkb2Mtb3B0aW9uYWxzIHdoZXRoZXIgdGhleSBhcmUgZW1wdHkgb3Igbm90LlxuICAjIFVzZSBvbiBmb2N1cy5cbiAgc2hvd09wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLnNob3coJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICAjIEhpZGUgYWxsIGVtcHR5IGRvYy1vcHRpb25hbHNcbiAgIyBVc2Ugb24gYmx1ci5cbiAgaGlkZUVtcHR5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbCAmJiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLmhpZGUoJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICBuZXh0OiAtPlxuICAgIEAkaHRtbC5uZXh0KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBwcmV2OiAtPlxuICAgIEAkaHRtbC5wcmV2KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBhZnRlckZvY3VzZWQ6ICgpIC0+XG4gICAgQCRodG1sLmFkZENsYXNzKGNzcy5jb21wb25lbnRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3MuY29tcG9uZW50SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLmNvbXBvbmVudEhpZ2hsaWdodClcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAJGh0bWxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAJGh0bWxbMF0pXG5cblxuICBjb250ZW50OiAoY29udGVudCkgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgY29udGVudFxuICAgICAgZGlyZWN0aXZlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgICBpZiBkaXJlY3RpdmUuaXNJbWFnZVxuICAgICAgICBpZiBkaXJlY3RpdmUuYmFzZTY0SW1hZ2U/XG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuYmFzZTY0SW1hZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc2V0KG5hbWUsIGRpcmVjdGl2ZS5nZXRJbWFnZVVybCgpIClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIGlmIEBoYXNGb2N1cygpXG5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0udG9nZ2xlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIsIEJvb2xlYW4odmFsdWUpKVxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcblxuICAgICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLmdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0sIG5hbWUpXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKSAjIHRvZG86IHJlcGxhY2Ugd2l0aCBAYWZ0ZXJJbnNlcnRlZCAtPiAuLi4gKHNvbWV0aGluZyBsaWtlICQuQ2FsbGJhY2tzKCdvbmNlIHJlbWVtYmVyJykpXG5cblxuICBzZXRQbGFjZWhvbGRlckltYWdlOiAoJGVsZW0sIG5hbWUpIC0+XG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGlmICRlbGVtWzBdLm5vZGVOYW1lID09ICdJTUcnXG4gICAgICB3aWR0aCA9ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGggPSAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICB2YWx1ZSA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8je3dpZHRofXgje2hlaWdodH0vQkVGNTZGL0IyRTY2OFwiXG5cbiAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgY2xhc3NOYW1lKSAtPlxuICAgIGNoYW5nZXMgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdLmNzc0NsYXNzQ2hhbmdlcyhjbGFzc05hbWUpXG4gICAgaWYgY2hhbmdlcy5yZW1vdmVcbiAgICAgIGZvciByZW1vdmVDbGFzcyBpbiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgICBAJGh0bWwucmVtb3ZlQ2xhc3MocmVtb3ZlQ2xhc3MpXG5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY2hhbmdlcy5hZGQpXG5cblxuICAjIERpc2FibGUgdGFiYmluZyBmb3IgdGhlIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQuXG4gICMgVGhpcyBpcyB1c2VkIGZvciBodG1sIGNvbnRlbnQgc28gaXQgZG9lcyBub3QgZGlzcnVwdCB0aGUgdXNlclxuICAjIGV4cGVyaWVuY2UuIFRoZSB0aW1lb3V0IGlzIHVzZWQgZm9yIGNhc2VzIGxpa2UgdHdlZXRzIHdoZXJlIHRoZVxuICAjIGlmcmFtZSBpcyBnZW5lcmF0ZWQgYnkgYSBzY3JpcHQgd2l0aCBhIGRlbGF5LlxuICBkaXNhYmxlVGFiYmluZzogKCRlbGVtKSAtPlxuICAgIHNldFRpbWVvdXQoID0+XG4gICAgICAkZWxlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgLCA0MDApXG5cblxuICAjIEFwcGVuZCBhIGNoaWxkIHRvIHRoZSBlbGVtZW50IHdoaWNoIHdpbGwgYmxvY2sgdXNlciBpbnRlcmFjdGlvblxuICAjIGxpa2UgY2xpY2sgb3IgdG91Y2ggZXZlbnRzLiBBbHNvIHRyeSB0byBwcmV2ZW50IHRoZSB1c2VyIGZyb20gZ2V0dGluZ1xuICAjIGZvY3VzIG9uIGEgY2hpbGQgZWxlbW50IHRocm91Z2ggdGFiYmluZy5cbiAgYmxvY2tJbnRlcmFjdGlvbjogKCRlbGVtKSAtPlxuICAgIEBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uKCRlbGVtKVxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5pbnRlcmFjdGlvbkJsb2NrZXIgfSc+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICAkZWxlbS5hcHBlbmQoJGJsb2NrZXIpXG5cbiAgICBAZGlzYWJsZVRhYmJpbmcoJGVsZW0pXG5cblxuICAjIE1ha2Ugc3VyZSB0aGF0IGFsbCBhYnNvbHV0ZSBwb3NpdGlvbmVkIGNoaWxkcmVuIGFyZSBwb3NpdGlvbmVkXG4gICMgcmVsYXRpdmUgdG8gJGVsZW0uXG4gIGVuc3VyZVJlbGF0aXZlUG9zaXRpb246ICgkZWxlbSkgLT5cbiAgICBwb3NpdGlvbiA9ICRlbGVtLmNzcygncG9zaXRpb24nKVxuICAgIGlmIHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ2ZpeGVkJyAmJiBwb3NpdGlvbiAhPSAncmVsYXRpdmUnXG4gICAgICAkZWxlbS5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJylcblxuXG4gIGdldCRjb250YWluZXI6IC0+XG4gICAgJChkb20uZmluZENvbnRhaW5lcihAJGh0bWxbMF0pLm5vZGUpXG5cblxuICAjIFdhaXQgdG8gZXhlY3V0ZSBhIG1ldGhvZCB1bnRpbCB0aGUgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgRE9NXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuXG5cbiAgZ2V0T3duZXJXaW5kb3c6IC0+XG4gICAgQCRlbGVtWzBdLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVwZW5kZW5jeSA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jeScpXG5kZXBlbmRlbmNpZXNUb0h0bWwgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llc190b19odG1sJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXBlbmRlbmNpZXNcblxuICAjIEBwYXJhbSB7Q29tcG9uZW50VHJlZX0gb3B0aW9uYWwuIFJlcXVpcmVkIGlmIHlvdSB3YW50IHRvXG4gICMgICB0cmFjayB3aGljaCBjb21wb25lbnRzIHVzZSBhIGRlcGVuZGVuY3kuXG4gICMgQHBhcmFtIHtTdHJpbmd9IG9wdGlvbmFsLiBQcmVmaXggcmVsYXRpdmUgdXJscyB3aXRoIHRoaXMgc3RyaW5nXG4gICMgICAodGhlIHN0cmluZyBzaG91bGQgbm90IGhhdmUgYSBzbGFzaCBhdCB0aGUgZW5kKS5cbiAgIyBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbmFsLiBXaGV0aGVyIHRvIGFsbG93IHJlbGF0aXZlIHVybHMgb3Igbm90LlxuICAjICAgRGVmYXVsdHMgdG8gZmFsc2UuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50VHJlZSwgQHByZWZpeCwgYWxsb3dSZWxhdGl2ZVVybHMgfT17fSkgLT5cbiAgICBAYWxsb3dSZWxhdGl2ZVVybHMgPSBpZiBAcHJlZml4IHRoZW4gdHJ1ZSBlbHNlIGFsbG93UmVsYXRpdmVVcmxzIHx8IGZhbHNlXG4gICAgQHByZWZpeCA/PSAnJ1xuXG4gICAgQGpzID0gW11cbiAgICBAY3NzID0gW11cbiAgICBAbmFtZXNwYWNlcyA9IHt9XG5cbiAgICBAZGVwZW5kZW5jeUFkZGVkID0gJC5DYWxsYmFja3MoKVxuICAgIEBkZXBlbmRlbmN5UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcblxuICAgIGlmIEBjb21wb25lbnRUcmVlP1xuICAgICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50UmVtb3ZlZC5hZGQoQG9uQ29tcG9uZW50UmVtb3ZlZClcblxuXG4gICMgQWRkIGEgZGVwZW5kZW5jeVxuICBhZGQ6IChvYmopIC0+XG4gICAgQGNvbnZlcnRUb0Fic29sdXRlUGF0aHMob2JqKVxuICAgIGRlcCA9IG5ldyBEZXBlbmRlbmN5KG9iailcbiAgICBpZiBleGlzdGluZyA9IEBnZXRFeGlzdGluZyhkZXApXG4gICAgICBleGlzdGluZy5hZGRDb21wb25lbnQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG4gICAgZWxzZVxuICAgICAgQGFkZERlcGVuZGVuY3koZGVwKVxuXG5cbiAgYWRkSnM6IChvYmopIC0+XG4gICAgb2JqLnR5cGUgPSAnanMnXG4gICAgQGFkZChvYmopXG5cblxuICBhZGRDc3M6IChvYmopIC0+XG4gICAgb2JqLnR5cGUgPSAnY3NzJ1xuICAgIEBhZGQob2JqKVxuXG5cbiAgIyBBYnNvbHV0ZSBwYXRoczpcbiAgIyAvL1xuICAjIC9cbiAgIyBodHRwOi8vZ29vZ2xlLmNvbVxuICAjIGh0dHBzOi8vZ29vZ2xlLmNvbVxuICAjXG4gICMgRXZlcnl0aGluZyBlbHNlIGlzIHByZWZpeGVkIGlmIGEgcHJlZml4IGlzIHByb3ZpZGVkLlxuICAjIFRvIGV4cGxpY2l0bHkgcGFzcyBhIHJlbGF0aXZlIFVSTCBzdGFydCBpdCB3aXRoICcuLydcbiAgY29udmVydFRvQWJzb2x1dGVQYXRoczogKG9iaikgLT5cbiAgICByZXR1cm4gdW5sZXNzIG9iai5zcmNcbiAgICBzcmMgPSBvYmouc3JjXG5cbiAgICBpZiBub3QgQGlzQWJzb2x1dGVVcmwoc3JjKVxuICAgICAgYXNzZXJ0IEBhbGxvd1JlbGF0aXZlVXJscywgXCJEZXBlbmRlbmNpZXM6IHJlbGF0aXZlIHVybHMgYXJlIG5vdCBhbGxvd2VkOiAjeyBzcmMgfVwiXG4gICAgICBzcmMgPSBzcmMucmVwbGFjZSgvXltcXC5cXC9dKi8sICcnKVxuICAgICAgb2JqLnNyYyA9IFwiI3sgQHByZWZpeCB9LyN7IHNyYyB9XCJcblxuXG4gIGlzQWJzb2x1dGVVcmw6IChzcmMpIC0+XG4gICAgIyBVUkxzIGFyZSBhYnNvbHV0ZSB3aGVuIHRoZXkgY29udGFpbiB0d28gYC8vYCBvciBiZWdpbiB3aXRoIGEgYC9gXG4gICAgLyheXFwvXFwvfFthLXpdKjpcXC9cXC8pLy50ZXN0KHNyYykgfHwgL15cXC8vLnRlc3Qoc3JjKVxuXG5cbiAgYWRkRGVwZW5kZW5jeTogKGRlcGVuZGVuY3kpIC0+XG4gICAgQGFkZFRvTmFtZXNwYWNlKGRlcGVuZGVuY3kpIGlmIGRlcGVuZGVuY3kubmFtZXNwYWNlXG5cbiAgICBjb2xsZWN0aW9uID0gaWYgZGVwZW5kZW5jeS5pc0pzKCkgdGhlbiBAanMgZWxzZSBAY3NzXG4gICAgY29sbGVjdGlvbi5wdXNoKGRlcGVuZGVuY3kpXG5cbiAgICBAZGVwZW5kZW5jeUFkZGVkLmZpcmUoZGVwZW5kZW5jeSlcblxuICAgIGRlcGVuZGVuY3lcblxuXG4gICMgTmFtZXNwYWNlc1xuICAjIC0tLS0tLS0tLS1cblxuICBhZGRUb05hbWVzcGFjZTogKGRlcGVuZGVuY3kpIC0+XG4gICAgaWYgZGVwZW5kZW5jeS5uYW1lc3BhY2VcbiAgICAgIEBuYW1lc3BhY2VzW2RlcGVuZGVuY3kubmFtZXNwYWNlXSA/PSBbXVxuICAgICAgbmFtZXNwYWNlID0gQG5hbWVzcGFjZXNbZGVwZW5kZW5jeS5uYW1lc3BhY2VdXG4gICAgICBuYW1lc3BhY2UucHVzaChkZXBlbmRlbmN5KVxuXG5cbiAgcmVtb3ZlRnJvbU5hbWVzcGFjZTogKGRlcGVuZGVuY3kpIC0+XG4gICAgaWYgbmFtZXNwYWNlID0gQGdldE5hbWVzcGFjZShkZXBlbmRlbmN5Lm5hbWVzcGFjZSlcbiAgICAgIGluZGV4ID0gbmFtZXNwYWNlLmluZGV4T2YoZGVwZW5kZW5jeSlcbiAgICAgIG5hbWVzcGFjZS5zcGxpY2UoaW5kZXgsIDEpIGlmIGluZGV4ID4gLTFcblxuXG4gIGdldE5hbWVzcGFjZXM6IC0+XG4gICAgZm9yIG5hbWUsIGFycmF5IG9mIEBuYW1lc3BhY2VzXG4gICAgICBuYW1lXG5cblxuICBnZXROYW1lc3BhY2U6IChuYW1lKSAtPlxuICAgIG5hbWVzcGFjZSA9IEBuYW1lc3BhY2VzW25hbWVdXG4gICAgaWYgbmFtZXNwYWNlPy5sZW5ndGggdGhlbiBuYW1lc3BhY2UgZWxzZSB1bmRlZmluZWRcblxuXG4gIGdldEV4aXN0aW5nOiAoZGVwKSAtPlxuICAgIGNvbGxlY3Rpb24gPSBpZiBkZXAuaXNKcygpIHRoZW4gQGpzIGVsc2UgQGNzc1xuICAgIGZvciBlbnRyeSBpbiBjb2xsZWN0aW9uXG4gICAgICByZXR1cm4gZW50cnkgaWYgZW50cnkuaXNTYW1lQXMoZGVwKVxuXG4gICAgdW5kZWZpbmVkXG5cblxuICBoYXNDc3M6IC0+XG4gICAgQGNzcy5sZW5ndGggPiAwXG5cblxuICBoYXNKczogLT5cbiAgICBAanMubGVuZ3RoID4gMFxuXG5cbiAgb25Db21wb25lbnRSZW1vdmVkOiAoY29tcG9uZW50KSA9PlxuICAgIHRvQmVSZW1vdmVkID0gW11cbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBAanNcbiAgICAgIG5lZWRlZCA9IGRlcGVuZGVuY3kucmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgIHRvQmVSZW1vdmVkLnB1c2goZGVwZW5kZW5jeSkgaWYgbm90IG5lZWRlZFxuXG4gICAgZm9yIGRlcGVuZGVuY3kgaW4gQGNzc1xuICAgICAgbmVlZGVkID0gZGVwZW5kZW5jeS5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgdG9CZVJlbW92ZWQucHVzaChkZXBlbmRlbmN5KSBpZiBub3QgbmVlZGVkXG5cbiAgICBmb3IgZGVwZW5kZW5jeSBpbiB0b0JlUmVtb3ZlZFxuICAgICAgQHJlbW92ZURlcGVuZGVuY3koZGVwZW5kZW5jeSlcblxuXG4gIHJlbW92ZURlcGVuZGVuY3k6IChkZXBlbmRlbmN5KSAtPlxuICAgIEByZW1vdmVGcm9tTmFtZXNwYWNlKGRlcGVuZGVuY3kpIGlmIGRlcGVuZGVuY3kubmFtZXNwYWNlXG4gICAgY29sbGVjdGlvbiA9IGlmIGRlcGVuZGVuY3kuaXNKcygpIHRoZW4gQGpzIGVsc2UgQGNzc1xuICAgIGluZGV4ID0gY29sbGVjdGlvbi5pbmRleE9mKGRlcGVuZGVuY3kpXG4gICAgY29sbGVjdGlvbi5zcGxpY2UoaW5kZXgsIDEpIGlmIGluZGV4ID4gLTFcblxuICAgIEBkZXBlbmRlbmN5UmVtb3ZlZC5maXJlKGRlcGVuZGVuY3kpXG5cblxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZm9yIGRlcGVuZGVuY3kgaW4gQGpzXG4gICAgICBkYXRhWydqcyddID89IFtdXG4gICAgICBkYXRhWydqcyddLnB1c2goIGRlcGVuZGVuY3kuc2VyaWFsaXplKCkgKVxuXG4gICAgZm9yIGRlcGVuZGVuY3kgaW4gQGNzc1xuICAgICAgZGF0YVsnY3NzJ10gPz0gW11cbiAgICAgIGRhdGFbJ2NzcyddLnB1c2goIGRlcGVuZGVuY3kuc2VyaWFsaXplKCkgKVxuXG4gICAgZGF0YVxuXG5cbiAgZGVzZXJpYWxpemU6IChkYXRhKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZGF0YT9cblxuICAgICMganNcbiAgICBmb3IgZW50cnkgaW4gZGF0YS5qcyB8fCBbXVxuICAgICAgb2JqID1cbiAgICAgICAgdHlwZTogJ2pzJ1xuICAgICAgICBzcmM6IGVudHJ5LnNyY1xuICAgICAgICBjb2RlOiBlbnRyeS5jb2RlXG4gICAgICAgIG5hbWVzcGFjZTogZW50cnkubmFtZXNwYWNlXG4gICAgICAgIG5hbWU6IGVudHJ5Lm5hbWVcblxuICAgICAgQGFkZERlc2VyaWFsemVkT2JqKG9iaiwgZW50cnkpXG5cbiAgICAjIGNzc1xuICAgIGZvciBlbnRyeSBpbiBkYXRhLmNzcyB8fCBbXVxuICAgICAgb2JqID1cbiAgICAgICAgdHlwZTogJ2NzcydcbiAgICAgICAgc3JjOiBlbnRyeS5zcmNcbiAgICAgICAgY29kZTogZW50cnkuY29kZVxuICAgICAgICBuYW1lc3BhY2U6IGVudHJ5Lm5hbWVzcGFjZVxuICAgICAgICBuYW1lOiBlbnRyeS5uYW1lXG5cbiAgICAgIEBhZGREZXNlcmlhbHplZE9iaihvYmosIGVudHJ5KVxuXG5cbiAgYWRkRGVzZXJpYWx6ZWRPYmo6IChvYmosIGVudHJ5KSAtPlxuICAgIGlmIGVudHJ5LmNvbXBvbmVudElkcz8ubGVuZ3RoXG4gICAgICBjb21wb25lbnRzID0gW11cbiAgICAgIGZvciBpZCBpbiBlbnRyeS5jb21wb25lbnRJZHNcbiAgICAgICAgY29tcG9uZW50ID0gQGNvbXBvbmVudFRyZWUuZmluZEJ5SWQoaWQpXG4gICAgICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQpIGlmIGNvbXBvbmVudD9cblxuICAgICAgIyBvbmx5IGFkZCB0aGUgZGVwZW5kZW5jeSBpZiB0aGVyZSBhcmUgc3RpbGwgY29tcG9uZW50c1xuICAgICAgIyBkZXBlbmRpbmcgb24gaXRcbiAgICAgIGlmIGNvbXBvbmVudHMubGVuZ3RoXG4gICAgICAgIGRlcGVuZGVuY3kgPSBAYWRkKG9iailcbiAgICAgICAgZm9yIGNvbXBvbmVudCBpbiBjb21wb25lbnRzXG4gICAgICAgICAgZGVwZW5kZW5jeS5hZGRDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgZWxzZVxuICAgICAgICBsb2cud2FybignRHJvcHBlZCBkZXBlbmRlbmN5OiBjb3VsZCBub3QgZmluZCBjb21wb25lbnRzIHRoYXQgZGVwZW5kIG9uIGl0JywgZW50cnkpXG4gICAgZWxzZVxuICAgICAgQGFkZChvYmopXG5cblxuICBwcmludEpzOiAtPlxuICAgIGRlcGVuZGVuY2llc1RvSHRtbC5wcmludEpzKHRoaXMpXG5cblxuICBwcmludENzczogLT5cbiAgICBkZXBlbmRlbmNpZXNUb0h0bWwucHJpbnRDc3ModGhpcylcblxuIiwiSnNMb2FkZXIgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2pzX2xvYWRlcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgcHJpbnRKczogKGRlcGVuZGVuY2llcykgLT5cbiAgICBodG1sID0gJydcbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBkZXBlbmRlbmNpZXMuanNcbiAgICAgIGlmIGRlcGVuZGVuY3kuaW5saW5lXG4gICAgICAgIGh0bWwgKz0gQHByaW50SW5saW5lU2NyaXB0KGNvZGVCbG9jazogZGVwZW5kZW5jeS5jb2RlKVxuICAgICAgZWxzZVxuICAgICAgICBodG1sICs9IEBwcmludFNjcmlwdFRhZyhzcmM6IGRlcGVuZGVuY3kuc3JjKVxuXG4gICAgICBodG1sICs9ICdcXG4nXG5cbiAgICBodG1sXG5cblxuICBwcmludENzczogKGRlcGVuZGVuY2llcykgLT5cbiAgICBodG1sID0gJydcbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBkZXBlbmRlbmNpZXMuY3NzXG4gICAgICBpZiBkZXBlbmRlbmN5LmlubGluZVxuICAgICAgICBodG1sICs9IEBwcmludElubGluZUNzcyhzdHlsZXM6IGRlcGVuZGVuY3kuY29kZSlcbiAgICAgIGVsc2VcbiAgICAgICAgaHRtbCArPSBAcHJpbnRDc3NMaW5rKHNyYzogZGVwZW5kZW5jeS5zcmMpXG5cbiAgICAgIGh0bWwgKz0gJ1xcbidcblxuICAgIGh0bWxcblxuXG4gIHByaW50U2NyaXB0VGFnOiAoeyBzcmMgfSApIC0+XG4gICAgXCI8c2NyaXB0IHNyYz1cXFwiI3sgc3JjIH1cXFwiPjwvc2NyaXB0PlwiXG5cblxuICBwcmludElubGluZVNjcmlwdDogKHsgY29kZUJsb2NrIH0pIC0+XG4gICAgY29kZUJsb2NrID0gSnNMb2FkZXIucHJvdG90eXBlLnByZXBhcmVJbmxpbmVDb2RlKGNvZGVCbG9jaylcblxuICAgIFwiXG4gICAgPHNjcmlwdD5cbiAgICAgICN7IGNvZGVCbG9jayB9XG4gICAgPC9zY3JpcHQ+XG4gICAgXCJcblxuICBwcmludENzc0xpbms6ICh7IHNyYywgaGVhZCB9KSAtPlxuICAgIGhlYWQgPz0gdHJ1ZVxuICAgIGlmIGhlYWRcbiAgICAgIFwiPGxpbmsgcmVsPVxcXCJzdHlsZXNoZWV0XFxcIiB0eXBlPVxcXCJ0ZXh0L2Nzc1xcXCIgaHJlZj1cXFwiI3sgc3JjIH1cXFwiPlwiXG4gICAgZWxzZVxuICAgICAgIyBMaW5rIHRhZ3Mgd29yayBpbiBib2R5IGJ1dCB0aGlzIGlzIG5vdCByZWNvbW1lbmRlZC5cbiAgICAgICMgVGhleSBzaG91bGQgb25seSBhcHBlYXIgaW4gdGhlIDxoZWFkPlxuICAgICAgXCI8bGluayByZWw9XFxcInN0eWxlc2hlZXRcXFwiIHR5cGU9XFxcInRleHQvY3NzXFxcIiBocmVmPVxcXCIjeyBzcmMgfVxcXCI+XCJcblxuXG4gIHByaW50SW5saW5lQ3NzOiAoeyBzdHlsZXMgfSkgLT5cbiAgICBzdHlsZXMgPSBDc3NMb2FkZXIucHJvdG90eXBlLnByZXBhcmVJbmxpbmVTdHlsZXMoc3R5bGVzKVxuXG4gICAgXCJcbiAgICA8c3R5bGU+XG4gICAgICAjeyBzdHlsZXMgfVxuICAgIDwvc3R5bGU+XG4gICAgXCJcblxuXG4gIHByaW50Q29tbWVudDogKHRleHQpIC0+XG4gICAgXCI8IS0tICN7IHRleHQgfSAtLT5cIlxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXBlbmRlbmN5XG5cblxuICAjIEBwYXJhbSB7T2JqZWN0fVxuICAjICAgLSB0eXBlIHtTdHJpbmd9IEVpdGhlciAnanMnIG9yICdjc3MnXG4gICNcbiAgIyAgIE9uZSBvZiB0aGUgZm9sbG93aW5nIG5lZWRzIHRvIGJlIHByb3ZpZGVkOlxuICAjICAgLSBzcmMge1N0cmluZ30gVVJMIHRvIGEgamF2YXNjcmlwdCBvciBjc3MgZmlsZVxuICAjICAgLSBjb2RlIHtTdHJpbmd9IEpTIG9yIENTUyBjb2RlXG4gICNcbiAgIyAgIEFsbCBvZiB0aGUgZm9sbG93aW5nIGFyZSBvcHRpb25hbDpcbiAgIyAgIC0gbmFtZXNwYWNlIHtTdHJpbmd9IE9wdGlvbmFsLiBBIG5hbWUgdG8gaWRlbnRpZnkgYSBkZXBlbmRlbmN5IG1vcmUgZWFzaWx5LlxuICAjICAgLSBuYW1lc3BhY2Uge1N0cmluZ30gT3B0aW9uYWwuIEEgTmFtZXNwYWNlIHRvIGdyb3VwIGRlcGVuZGVuY2llcyB0b2dldGhlci5cbiAgIyAgIC0gY29tcG9uZW50IHtDb21wb25lbnRNb2RlbH0gVGhlIGNvbXBvbmVudE1vZGVsIHRoYXQgaXMgZGVwZW5kaW5nIG9uIHRoaXMgcmVzb3VyY2VcbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAbmFtZXNwYWNlLCBAc3JjLCBAY29kZSwgQHR5cGUsIGNvbXBvbmVudCB9KSAtPlxuICAgIGFzc2VydCBAc3JjIHx8IEBjb2RlLCAnRGVwZW5kZW5jeTogTm8gXCJzcmNcIiBvciBcImNvZGVcIiBwYXJhbSBwcm92aWRlZCdcbiAgICBhc3NlcnQgbm90IChAc3JjICYmIEBjb2RlKSwgJ0RlcGVuZGVuY3k6IE9ubHkgcHJvdmlkZSBvbmUgb2YgXCJzcmNcIiBvciBcImNvZGVcIiBwYXJhbXMnXG4gICAgYXNzZXJ0IEB0eXBlLCBcIkRlcGVuZGVuY3k6IFBhcmFtIHR5cGUgbXVzdCBiZSBzcGVjaWZpZWRcIlxuICAgIGFzc2VydCBAdHlwZSBpbiBbJ2pzJywgJ2NzcyddLCBcIkRlcGVuZGVuY3k6IFVucmVjb2duaXplZCB0eXBlOiAjeyBAdHlwZSB9XCJcblxuICAgIEBpbmxpbmUgPSB0cnVlIGlmIEBjb2RlP1xuXG4gICAgQGNvbXBvbmVudHMgPSB7fSAjIGNvbXBvbmVudHMgd2hpY2ggZGVwZW5kIHVwb24gdGhpcyByZXNvdXJjZVxuICAgIEBjb21wb25lbnRDb3VudCA9IDBcbiAgICBAYWRkQ29tcG9uZW50KGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuXG5cbiAgaXNKczogLT5cbiAgICBAdHlwZSA9PSAnanMnXG5cblxuICBpc0NzczogLT5cbiAgICBAdHlwZSA9PSAnY3NzJ1xuXG5cbiAgIyBDaGVjayBpZiB0aGlzIGlzIGEgZGVwZW5kZW5jeSBvZiBhIGNlcnRhaW4gY29tcG9uZW50XG4gIGhhc0NvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBAY29tcG9uZW50c1tjb21wb25lbnQuaWRdP1xuXG5cbiAgYWRkQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIGlmIG5vdCBAaGFzQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgIEBjb21wb25lbnRDb3VudCArPSAxXG4gICAgICBAY29tcG9uZW50c1tjb21wb25lbnQuaWRdID0gdHJ1ZVxuXG5cbiAgIyBSZW1vdmUgYSBjb21wb25lbnQgZnJvbSB0aGlzIGRlcGVuZGVuY3kuXG4gICMgQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSBhcmUgc3RpbGwgY29tcG9uZW50c1xuICAjICAgZGVwZW5kaW5nIG9uIHRoaXMgZGVwZW5kZW5jeSwgb3RoZXJ3aXNlIGZhbHNlXG4gIHJlbW92ZUNvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAaGFzQ29tcG9uZW50KGNvbXBvbmVudClcbiAgICAgIEBjb21wb25lbnRDb3VudCAtPSAxXG4gICAgICBAY29tcG9uZW50c1tjb21wb25lbnQuaWRdID0gdW5kZWZpbmVkXG5cbiAgICBAY29tcG9uZW50Q291bnQgIT0gMFxuXG5cbiAgaXNTYW1lQXM6IChvdGhlckRlcGVuZGVuY3kpIC0+XG4gICAgcmV0dXJuIGZhbHNlIGlmIEB0eXBlICE9IG90aGVyRGVwZW5kZW5jeS50eXBlXG4gICAgcmV0dXJuIGZhbHNlIGlmIEBuYW1lc3BhY2UgIT0gb3RoZXJEZXBlbmRlbmN5Lm5hbWVzcGFjZVxuXG4gICAgaWYgb3RoZXJEZXBlbmRlbmN5LnNyY1xuICAgICAgQHNyYyA9PSBvdGhlckRlcGVuZGVuY3kuc3JjXG4gICAgZWxzZVxuICAgICAgQGNvZGUgPT0gb3RoZXJEZXBlbmRlbmN5LmNvZGVcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBvYmogPSB7fVxuXG4gICAgZm9yIGtleSBpbiBbJ3NyYycsICdjb2RlJywgJ2lubGluZScsICduYW1lJywgJ25hbWVzcGFjZSddXG4gICAgICBvYmpba2V5XSA9IHRoaXNba2V5XSBpZiB0aGlzW2tleV0/XG5cbiAgICBmb3IgY29tcG9uZW50SWQgb2YgQGNvbXBvbmVudHNcbiAgICAgIG9iai5jb21wb25lbnRJZHMgPz0gW11cbiAgICAgIG9iai5jb21wb25lbnRJZHMucHVzaChjb21wb25lbnRJZClcblxuICAgIG9ialxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyZXJcblxuICAjIEBwYXJhbSB7IE9iamVjdCB9XG4gICMgLSBjb21wb25lbnRUcmVlIHsgQ29tcG9uZW50VHJlZSB9XG4gICMgLSByZW5kZXJpbmdDb250YWluZXIgeyBSZW5kZXJpbmdDb250YWluZXIgfVxuICAjIC0gJHdyYXBwZXIgeyBqUXVlcnkgb2JqZWN0IH0gQSB3cmFwcGVyIHdpdGggYSBub2RlIHdpdGggYSAnZG9jLXNlY3Rpb24nIGNzcyBjbGFzcyB3aGVyZSB0byBpbnNlcnQgdGhlIGNvbnRlbnQuXG4gICMgLSBleGNsdWRlQ29tcG9uZW50cyB7IFN0cmluZyBvciBBcnJheSB9IGNvbXBvbmVudE1vZGVsLmlkIG9yIGFuIGFycmF5IG9mIHN1Y2guXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50VHJlZSwgQHJlbmRlcmluZ0NvbnRhaW5lciwgJHdyYXBwZXIsIGV4Y2x1ZGVDb21wb25lbnRzIH0pIC0+XG4gICAgYXNzZXJ0IEBjb21wb25lbnRUcmVlLCAnbm8gY29tcG9uZW50VHJlZSBzcGVjaWZpZWQnXG4gICAgYXNzZXJ0IEByZW5kZXJpbmdDb250YWluZXIsICdubyByZW5kZXJpbmcgY29udGFpbmVyIHNwZWNpZmllZCdcblxuICAgIEAkcm9vdCA9ICQoQHJlbmRlcmluZ0NvbnRhaW5lci5yZW5kZXJOb2RlKVxuICAgIEAkd3JhcHBlckh0bWwgPSAkd3JhcHBlclxuICAgIEBjb21wb25lbnRWaWV3cyA9IHt9XG5cbiAgICBAZXhjbHVkZWRDb21wb25lbnRJZHMgPSB7fVxuICAgIEBleGNsdWRlQ29tcG9uZW50KGV4Y2x1ZGVDb21wb25lbnRzKVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEByZW5kZXJPbmNlUGFnZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgIyBAcGFyYW0geyBTdHJpbmcgb3IgQXJyYXkgfSBjb21wb25lbnRNb2RlbC5pZCBvciBhbiBhcnJheSBvZiBzdWNoLlxuICBleGNsdWRlQ29tcG9uZW50OiAoY29tcG9uZW50SWQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb21wb25lbnRJZD9cbiAgICBpZiAkLmlzQXJyYXkoY29tcG9uZW50SWQpXG4gICAgICBmb3IgY29tcElkIGluIGNvbXBvbmVudElkXG4gICAgICAgIEBleGNsdWRlQ29tcG9uZW50KGNvbXBJZClcbiAgICBlbHNlXG4gICAgICBAZXhjbHVkZWRDb21wb25lbnRJZHNbY29tcG9uZW50SWRdID0gdHJ1ZVxuICAgICAgdmlldyA9IEBjb21wb25lbnRWaWV3c1tjb21wb25lbnRJZF1cbiAgICAgIGlmIHZpZXc/IGFuZCB2aWV3LmlzQXR0YWNoZWRUb0RvbVxuICAgICAgICBAcmVtb3ZlQ29tcG9uZW50KHZpZXcubW9kZWwpXG5cblxuICBzZXRSb290OiAoKSAtPlxuICAgIGlmIEAkd3JhcHBlckh0bWw/Lmxlbmd0aCAmJiBAJHdyYXBwZXJIdG1sLmpxdWVyeVxuICAgICAgc2VsZWN0b3IgPSBcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiXG4gICAgICAkaW5zZXJ0ID0gQCR3cmFwcGVySHRtbC5maW5kKHNlbGVjdG9yKS5hZGQoIEAkd3JhcHBlckh0bWwuZmlsdGVyKHNlbGVjdG9yKSApXG4gICAgICBpZiAkaW5zZXJ0Lmxlbmd0aFxuICAgICAgICBAJHdyYXBwZXIgPSBAJHJvb3RcbiAgICAgICAgQCR3cmFwcGVyLmFwcGVuZChAJHdyYXBwZXJIdG1sKVxuICAgICAgICBAJHJvb3QgPSAkaW5zZXJ0XG5cbiAgICAjIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnRUcmVlIGluIHRoZSAkcm9vdCBub2RlLlxuICAgICMgU29tZSBkb20uY29mZmVlIG1ldGhvZHMgbmVlZCBpdCB0byBnZXQgaG9sZCBvZiB0aGUgY29tcG9uZW50VHJlZVxuICAgIEAkcm9vdC5kYXRhKCdjb21wb25lbnRUcmVlJywgQGNvbXBvbmVudFRyZWUpXG5cblxuICByZW5kZXJPbmNlUGFnZVJlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIucmVhZHkgPT5cbiAgICAgIEBzZXRSb290KClcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQHNldHVwQ29tcG9uZW50VHJlZUxpc3RlbmVycygpXG4gICAgICBAcmVhZHlTZW1hcGhvcmUuZGVjcmVtZW50KClcblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaXNSZWFkeSgpXG5cblxuICBodG1sOiAtPlxuICAgIGFzc2VydCBAaXNSZWFkeSgpLCAnQ2Fubm90IGdlbmVyYXRlIGh0bWwuIFJlbmRlcmVyIGlzIG5vdCByZWFkeS4nXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5odG1sKClcblxuXG4gICMgQ29tcG9uZW50VHJlZSBFdmVudCBIYW5kbGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXR1cENvbXBvbmVudFRyZWVMaXN0ZW5lcnM6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50QWRkZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRBZGRlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudFJlbW92ZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRSZW1vdmVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50TW92ZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRNb3ZlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudENvbnRlbnRDaGFuZ2VkLmFkZCggJC5wcm94eShAY29tcG9uZW50Q29udGVudENoYW5nZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRIdG1sQ2hhbmdlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudEh0bWxDaGFuZ2VkLCB0aGlzKSApXG5cblxuICBjb21wb25lbnRBZGRlZDogKG1vZGVsKSAtPlxuICAgIEBpbnNlcnRDb21wb25lbnQobW9kZWwpXG5cblxuICBjb21wb25lbnRSZW1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZUNvbXBvbmVudChtb2RlbClcbiAgICBAZGVsZXRlQ2FjaGVkQ29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbClcblxuXG4gIGNvbXBvbmVudE1vdmVkOiAobW9kZWwpIC0+XG4gICAgQHJlbW92ZUNvbXBvbmVudChtb2RlbClcbiAgICBAaW5zZXJ0Q29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY29tcG9uZW50Q29udGVudENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkudXBkYXRlQ29udGVudCgpXG5cblxuICBjb21wb25lbnRIdG1sQ2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS51cGRhdGVIdG1sKClcblxuXG4gICMgUmVuZGVyaW5nXG4gICMgLS0tLS0tLS0tXG5cbiAgZ2V0Q29tcG9uZW50Vmlld0J5SWQ6IChjb21wb25lbnRJZCkgLT5cbiAgICBAY29tcG9uZW50Vmlld3NbY29tcG9uZW50SWRdXG5cblxuICBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdzW21vZGVsLmlkXSB8fD0gbW9kZWwuY3JlYXRlVmlldyhAcmVuZGVyaW5nQ29udGFpbmVyLmlzUmVhZE9ubHkpXG5cblxuICBkZWxldGVDYWNoZWRDb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgZGVsZXRlIEBjb21wb25lbnRWaWV3c1ttb2RlbC5pZF1cblxuXG4gIHJlbmRlcjogLT5cbiAgICBAY29tcG9uZW50VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBpbnNlcnRDb21wb25lbnQobW9kZWwpXG5cblxuICBjbGVhcjogLT5cbiAgICBAY29tcG9uZW50VHJlZS5lYWNoIChtb2RlbCkgPT5cbiAgICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuXG4gICAgQCRyb290LmVtcHR5KClcblxuXG4gIHJlZHJhdzogLT5cbiAgICBAY2xlYXIoKVxuICAgIEByZW5kZXIoKVxuXG5cbiAgaW5zZXJ0Q29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgcmV0dXJuIGlmIEBpc0NvbXBvbmVudEF0dGFjaGVkKG1vZGVsKSB8fCBAZXhjbHVkZWRDb21wb25lbnRJZHNbbW9kZWwuaWRdID09IHRydWVcblxuICAgIGlmIEBpc0NvbXBvbmVudEF0dGFjaGVkKG1vZGVsLnByZXZpb3VzKVxuICAgICAgQGluc2VydENvbXBvbmVudEFzU2libGluZyhtb2RlbC5wcmV2aW91cywgbW9kZWwpXG4gICAgZWxzZSBpZiBAaXNDb21wb25lbnRBdHRhY2hlZChtb2RlbC5uZXh0KVxuICAgICAgQGluc2VydENvbXBvbmVudEFzU2libGluZyhtb2RlbC5uZXh0LCBtb2RlbClcbiAgICBlbHNlIGlmIG1vZGVsLnBhcmVudENvbnRhaW5lclxuICAgICAgQGFwcGVuZENvbXBvbmVudFRvUGFyZW50Q29udGFpbmVyKG1vZGVsKVxuICAgIGVsc2VcbiAgICAgIGxvZy5lcnJvcignQ29tcG9uZW50IGNvdWxkIG5vdCBiZSBpbnNlcnRlZCBieSByZW5kZXJlci4nKVxuXG4gICAgY29tcG9uZW50VmlldyA9IEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKVxuICAgIGNvbXBvbmVudFZpZXcuc2V0QXR0YWNoZWRUb0RvbSh0cnVlKVxuICAgIEByZW5kZXJpbmdDb250YWluZXIuY29tcG9uZW50Vmlld1dhc0luc2VydGVkKGNvbXBvbmVudFZpZXcpXG4gICAgQGF0dGFjaENoaWxkQ29tcG9uZW50cyhtb2RlbClcblxuXG4gIGlzQ29tcG9uZW50QXR0YWNoZWQ6IChtb2RlbCkgLT5cbiAgICBtb2RlbCAmJiBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuaXNBdHRhY2hlZFRvRG9tXG5cblxuICBhdHRhY2hDaGlsZENvbXBvbmVudHM6IChtb2RlbCkgLT5cbiAgICBtb2RlbC5jaGlsZHJlbiAoY2hpbGRNb2RlbCkgPT5cbiAgICAgIGlmIG5vdCBAaXNDb21wb25lbnRBdHRhY2hlZChjaGlsZE1vZGVsKVxuICAgICAgICBAaW5zZXJ0Q29tcG9uZW50KGNoaWxkTW9kZWwpXG5cblxuICBpbnNlcnRDb21wb25lbnRBc1NpYmxpbmc6IChzaWJsaW5nLCBtb2RlbCkgLT5cbiAgICBtZXRob2QgPSBpZiBzaWJsaW5nID09IG1vZGVsLnByZXZpb3VzIHRoZW4gJ2FmdGVyJyBlbHNlICdiZWZvcmUnXG4gICAgQCRub2RlRm9yQ29tcG9uZW50KHNpYmxpbmcpW21ldGhvZF0oQCRub2RlRm9yQ29tcG9uZW50KG1vZGVsKSlcblxuXG4gIGFwcGVuZENvbXBvbmVudFRvUGFyZW50Q29udGFpbmVyOiAobW9kZWwpIC0+XG4gICAgQCRub2RlRm9yQ29tcG9uZW50KG1vZGVsKS5hcHBlbmRUbyhAJG5vZGVGb3JDb250YWluZXIobW9kZWwucGFyZW50Q29udGFpbmVyKSlcblxuXG4gICRub2RlRm9yQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLiRodG1sXG5cblxuICAkbm9kZUZvckNvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIuaXNSb290XG4gICAgICBAJHJvb3RcbiAgICBlbHNlXG4gICAgICBwYXJlbnRWaWV3ID0gQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQoY29udGFpbmVyLnBhcmVudENvbXBvbmVudClcbiAgICAgICQocGFyZW50Vmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGNvbnRhaW5lci5uYW1lKSlcblxuXG4gIHJlbW92ZUNvbXBvbmVudDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS5zZXRBdHRhY2hlZFRvRG9tKGZhbHNlKVxuICAgIEAkbm9kZUZvckNvbXBvbmVudChtb2RlbCkuZGV0YWNoKClcblxuIiwiUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJylcblBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWaWV3XG5cbiAgY29uc3RydWN0b3I6IChAbGl2aW5nZG9jLCBAcGFyZW50KSAtPlxuICAgIEBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBAaXNJbnRlcmFjdGl2ZSA9IGZhbHNlXG5cblxuICAjIEF2YWlsYWJsZSBPcHRpb25zOlxuICAjIFJlYWRPbmx5IHZpZXc6IChkZWZhdWx0IGlmIG5vdGhpbmcgaXMgc3BlY2lmaWVkKVxuICAjIGNyZWF0ZShyZWFkT25seTogdHJ1ZSlcbiAgI1xuICAjIEluZXJhY3RpdmUgdmlldzpcbiAgIyBjcmVhdGUoaW50ZXJhY3RpdmU6IHRydWUpXG4gICNcbiAgIyBXcmFwcGVyOiAoRE9NIG5vZGUgdGhhdCBoYXMgdG8gY29udGFpbiBhIG5vZGUgd2l0aCBjbGFzcyAnLmRvYy1zZWN0aW9uJylcbiAgIyBjcmVhdGUoICR3cmFwcGVyOiAkKCc8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPicpIClcbiAgY3JlYXRlOiAob3B0aW9ucykgLT5cbiAgICBAY3JlYXRlSUZyYW1lKEBwYXJlbnQpLnRoZW4gKGlmcmFtZSwgcmVuZGVyTm9kZSkgPT5cbiAgICAgIEBpZnJhbWUgPSBpZnJhbWVcbiAgICAgIEByZW5kZXJlciA9IEBjcmVhdGVJRnJhbWVSZW5kZXJlcihpZnJhbWUsIG9wdGlvbnMpXG4gICAgICBpZnJhbWU6IGlmcmFtZVxuICAgICAgcmVuZGVyZXI6IEByZW5kZXJlclxuXG5cbiAgY3JlYXRlSUZyYW1lOiAocGFyZW50KSAtPlxuICAgIGRlZmVycmVkID0gJC5EZWZlcnJlZCgpXG5cbiAgICBpZnJhbWUgPSBwYXJlbnQub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKVxuICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnXG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVCb3JkZXInLCAnMCcpXG4gICAgaWZyYW1lLm9ubG9hZCA9IC0+IGRlZmVycmVkLnJlc29sdmUoaWZyYW1lKVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGlmcmFtZSlcbiAgICBkZWZlcnJlZC5wcm9taXNlKClcblxuXG4gIGNyZWF0ZUlGcmFtZVJlbmRlcmVyOiAoaWZyYW1lLCBvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVSZW5kZXJlclxuICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICBvcHRpb25zOiBvcHRpb25zXG5cblxuICBjcmVhdGVSZW5kZXJlcjogKHsgcmVuZGVyTm9kZSwgb3B0aW9ucyB9PXt9KSAtPlxuICAgIHBhcmFtcyA9XG4gICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlIHx8IEBwYXJlbnRcbiAgICAgIGRvY3VtZW50RGVwZW5kZW5jaWVzOiBAbGl2aW5nZG9jLmRlcGVuZGVuY2llc1xuICAgICAgZGVzaWduOiBAbGl2aW5nZG9jLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG5cbiAgICBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIGNvbXBvbmVudFRyZWU6IEBsaXZpbmdkb2MuY29tcG9uZW50VHJlZVxuICAgICAgJHdyYXBwZXI6IG9wdGlvbnMuJHdyYXBwZXJcblxuXG4gIGNyZWF0ZVBhZ2U6IChwYXJhbXMsIHsgaW50ZXJhY3RpdmUsIHJlYWRPbmx5LCBsb2FkUmVzb3VyY2VzIH09e30pIC0+XG4gICAgcGFyYW1zID89IHt9XG4gICAgcGFyYW1zLmxvYWRSZXNvdXJjZXMgPSBsb2FkUmVzb3VyY2VzXG4gICAgaWYgaW50ZXJhY3RpdmU/XG4gICAgICBAaXNJbnRlcmFjdGl2ZSA9IHRydWVcbiAgICAgIG5ldyBJbnRlcmFjdGl2ZVBhZ2UocGFyYW1zKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQYWdlKHBhcmFtcylcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5Kc0xvYWRlciA9IHJlcXVpcmUoJy4vanNfbG9hZGVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzX2xvYWRlcicpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXNzZXRzXG5cbiAgIyBAcGFyYW0ge1dpbmRvd31cbiAgIyBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbmFsLiBJZiBzZXQgdG8gdHJ1ZSBubyBhc3NldHMgd2lsbCBiZSBsb2FkZWQuXG4gIGNvbnN0cnVjdG9yOiAoeyBAd2luZG93LCBkaXNhYmxlIH0pIC0+XG4gICAgQGlzRGlzYWJsZWQgPSBkaXNhYmxlIHx8IGZhbHNlXG5cbiAgICBAY3NzTG9hZGVyID0gbmV3IENzc0xvYWRlcihAd2luZG93KVxuICAgIEBqc0xvYWRlciA9IG5ldyBKc0xvYWRlcihAd2luZG93KVxuXG5cbiAgbG9hZERlcGVuZGVuY2llczogKGRlcGVuZGVuY2llcywgY2FsbGJhY2spIC0+XG4gICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuICAgIGZvciBkZXAgaW4gZGVwZW5kZW5jaWVzLmpzXG4gICAgICBAbG9hZEpzKGRlcCwgc2VtYXBob3JlLndhaXQoKSlcblxuICAgIGZvciBkZXAgaW4gZGVwZW5kZW5jaWVzLmNzc1xuICAgICAgQGxvYWRDc3MoZGVwLCBzZW1hcGhvcmUud2FpdCgpKVxuXG4gICAgc2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGxvYWREZXBlbmRlbmN5OiAoZGVwZW5kZW5jeSwgY2FsbGJhY2spIC0+XG4gICAgaWYgZGVwZW5kZW5jeS5pc0pzKClcbiAgICAgIEBsb2FkSnMoZGVwZW5kZW5jeSwgY2FsbGJhY2spXG4gICAgZWxzZSBpZiBkZXBlbmRlbmN5LmlzQ3NzKClcbiAgICAgIEBsb2FkQ3NzKGRlcGVuZGVuY3ksIGNhbGxiYWNrKVxuXG5cbiAgbG9hZEpzOiAoZGVwZW5kZW5jeSwgY2FsbGJhY2spIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgIGlmIEBpc0Rpc2FibGVkXG5cbiAgICBpZiBkZXBlbmRlbmN5LmlubGluZVxuICAgICAgQGpzTG9hZGVyLmxvYWRJbmxpbmVTY3JpcHQoZGVwZW5kZW5jeS5jb2RlLCBjYWxsYmFjaylcbiAgICBlbHNlXG4gICAgICBAanNMb2FkZXIubG9hZFNpbmdsZVVybChkZXBlbmRlbmN5LnNyYywgY2FsbGJhY2spXG5cblxuICBsb2FkQ3NzOiAoZGVwZW5kZW5jeSwgY2FsbGJhY2spIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgIGlmIEBpc0Rpc2FibGVkXG5cbiAgICBpZiBkZXBlbmRlbmN5LmlubGluZVxuICAgICAgQGNzc0xvYWRlci5sb2FkSW5saW5lU3R5bGVzKGRlcGVuZGVuY3kuY29kZSwgY2FsbGJhY2spXG4gICAgZWxzZVxuICAgICAgQGNzc0xvYWRlci5sb2FkU2luZ2xlVXJsKGRlcGVuZGVuY3kuc3JjLCBjYWxsYmFjaylcblxuXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG4gICAgQGxvYWRlZElubGluZVN0eWxlcyA9IFtdXG5cblxuICBsb2FkU2luZ2xlVXJsOiAodXJsLCBjYWxsYmFjayA9IC0+KSAtPlxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc1VybExvYWRlZCh1cmwpXG5cbiAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICBsaW5rLm9ubG9hZCA9IGNhbGxiYWNrXG5cbiAgICAjIERvIG5vdCBwcmV2ZW50IHRoZSBwYWdlIGZyb20gbG9hZGluZyBiZWNhdXNlIG9mIGNzcyBlcnJvcnNcbiAgICAjIG9uZXJyb3IgaXMgbm90IHN1cHBvcnRlZCBieSBldmVyeSBicm93c2VyLlxuICAgICMgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9FbGVtZW50L2xpbmtcbiAgICBsaW5rLm9uZXJyb3IgPSAtPlxuICAgICAgY29uc29sZS53YXJuIFwiU3R5bGVzaGVldCBjb3VsZCBub3QgYmUgbG9hZGVkOiAjeyB1cmwgfVwiXG4gICAgICBjYWxsYmFjaygpXG5cbiAgICBsaW5rLmhyZWYgPSB1cmxcbiAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICBAbG9hZGVkVXJscy5wdXNoKHVybClcblxuXG4gIGlzVXJsTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLmluZGV4T2YodXJsKSA+PSAwXG5cblxuICAjIElubGluZSBTdHlsZXNcbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgbG9hZElubGluZVN0eWxlczogKGlubGluZVN0eWxlcywgY2FsbGJhY2sgPSAtPikgLT5cbiAgICBpbmxpbmVTdHlsZXMgPSBAcHJlcGFyZUlubGluZVN0eWxlcyhpbmxpbmVTdHlsZXMpXG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGFyZUlubGluZVN0eWxlc0xvYWRlZChpbmxpbmVTdHlsZXMpXG5cbiAgICAjIEluamVjdCBhbiBpbmxpbmUgc2NyaXB0IGVsZW1lbnQgdG8gdGhlIGRvY3VtZW50XG4gICAgZG9jID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIHN0eWxlcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlcy5pbm5lckhUTUwgPSBpbmxpbmVTdHlsZXM7XG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQoc3R5bGVzKTtcbiAgICBAbG9hZGVkSW5saW5lU3R5bGVzLnB1c2goaW5saW5lU3R5bGVzKVxuXG4gICAgY2FsbGJhY2soKVxuXG5cbiAgcHJlcGFyZUlubGluZVN0eWxlczogKGlubGluZVN0eWxlcykgLT5cbiAgICAjIFJlbW92ZSA8c3R5bGU+IHRhZ3MgYXJvdW5kIHRoZSBpbmxpbmUgc3R5bGVzXG4gICAgaW5saW5lU3R5bGVzLnJlcGxhY2UoLzxzdHlsZVtePl0qPnw8XFwvc3R5bGU+L2dpLCAnJylcblxuXG4gIGFyZUlubGluZVN0eWxlc0xvYWRlZDogKGlubGluZVN0eWxlcykgLT5cbiAgICBAbG9hZGVkSW5saW5lU3R5bGVzLmluZGV4T2YoaW5saW5lU3R5bGVzKSA+PSAwXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuQ29tcG9uZW50RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0b3JQYWdlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHNldFdpbmRvdygpXG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG5cbiAgICAjIFN0dWJzXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9XG4gICAgICBkaXNhYmxlQWxsOiAtPlxuICAgICAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGNvbXBvbmVudFdhc0Ryb3BwZWQgPVxuICAgICAgZmlyZTogLT5cbiAgICBAYmx1ckZvY3VzZWRFbGVtZW50ID0gLT5cblxuXG4gIHN0YXJ0RHJhZzogKHsgY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudE1vZGVsIHx8IGNvbXBvbmVudFZpZXdcbiAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudFZpZXcubW9kZWwgaWYgY29tcG9uZW50Vmlld1xuXG4gICAgY29tcG9uZW50RHJhZyA9IG5ldyBDb21wb25lbnREcmFnXG4gICAgICBjb21wb25lbnRNb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChjb21wb25lbnREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgc2V0V2luZG93OiAtPlxuICAgIEB3aW5kb3cgPSB3aW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5QYWdlID0gcmVxdWlyZSgnLi9wYWdlJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5Gb2N1cyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2ZvY3VzJylcbkVkaXRhYmxlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2VkaXRhYmxlX2NvbnRyb2xsZXInKVxuRHJhZ0Jhc2UgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UnKVxuQ29tcG9uZW50RHJhZyA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnJylcblxuIyBBbiBJbnRlcmFjdGl2ZVBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBQYWdlIHdoaWNoIGFsbG93cyBmb3IgbWFuaXB1bGF0aW9uIG9mIHRoZVxuIyByZW5kZXJlZCBDb21wb25lbnRUcmVlLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbnRlcmFjdGl2ZVBhZ2UgZXh0ZW5kcyBQYWdlXG5cbiAgTEVGVF9NT1VTRV9CVVRUT04gPSAxXG5cbiAgaXNSZWFkT25seTogZmFsc2VcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCBob3N0V2luZG93IH09e30pIC0+XG4gICAgc3VwZXJcblxuICAgIEBmb2N1cyA9IG5ldyBGb2N1cygpXG4gICAgQGVkaXRhYmxlQ29udHJvbGxlciA9IG5ldyBFZGl0YWJsZUNvbnRyb2xsZXIodGhpcylcblxuICAgICMgZXZlbnRzXG4gICAgQGltYWdlQ2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGh0bWxFbGVtZW50Q2xpY2sgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudFZpZXcsIGZpZWxkTmFtZSwgZXZlbnQpIC0+XG4gICAgQGNvbXBvbmVudFdpbGxCZURyYWdnZWQgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRXYXNEcm9wcGVkID0gJC5DYWxsYmFja3MoKSAjIChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcbiAgICBAZm9jdXMuY29tcG9uZW50Rm9jdXMuYWRkKCAkLnByb3h5KEBhZnRlckNvbXBvbmVudEZvY3VzZWQsIHRoaXMpIClcbiAgICBAZm9jdXMuY29tcG9uZW50Qmx1ci5hZGQoICQucHJveHkoQGFmdGVyQ29tcG9uZW50Qmx1cnJlZCwgdGhpcykgKVxuICAgIEBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeSgpXG4gICAgQCRkb2N1bWVudFxuICAgICAgLm9uKCdtb3VzZWRvd24ubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ3RvdWNoc3RhcnQubGl2aW5nZG9jcycsICQucHJveHkoQG1vdXNlZG93biwgdGhpcykpXG4gICAgICAub24oJ2RyYWdzdGFydCcsICQucHJveHkoQGJyb3dzZXJEcmFnU3RhcnQsIHRoaXMpKVxuXG5cbiAgYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHk6IC0+XG4gICAgaWYgY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlXG4gICAgICBAYXNzZXRzLmNzc0xvYWRlci5sb2FkU2luZ2xlVXJsKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuXG4gICAgIyBJZ25vcmUgaW50ZXJhY3Rpb25zIG9uIGNlcnRhaW4gZWxlbWVudHNcbiAgICBpc0NvbnRyb2wgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChjb25maWcuaWdub3JlSW50ZXJhY3Rpb24pLmxlbmd0aFxuICAgIHJldHVybiBpZiBpc0NvbnRyb2xcblxuICAgICMgSWRlbnRpZnkgdGhlIGNsaWNrZWQgY29tcG9uZW50XG4gICAgY29tcG9uZW50VmlldyA9IGRvbS5maW5kQ29tcG9uZW50VmlldyhldmVudC50YXJnZXQpXG5cbiAgICAjIFRoaXMgaXMgY2FsbGVkIGluIG1vdXNlZG93biBzaW5jZSBlZGl0YWJsZXMgZ2V0IGZvY3VzIG9uIG1vdXNlZG93blxuICAgICMgYW5kIG9ubHkgYmVmb3JlIHRoZSBlZGl0YWJsZXMgY2xlYXIgdGhlaXIgcGxhY2Vob2xkZXIgY2FuIHdlIHNhZmVseVxuICAgICMgaWRlbnRpZnkgd2hlcmUgdGhlIHVzZXIgaGFzIGNsaWNrZWQuXG4gICAgQGhhbmRsZUNsaWNrZWRDb21wb25lbnQoZXZlbnQsIGNvbXBvbmVudFZpZXcpXG5cbiAgICBpZiBjb21wb25lbnRWaWV3XG4gICAgICBAc3RhcnREcmFnXG4gICAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcbiAgICAgICAgZXZlbnQ6IGV2ZW50XG5cblxuICBzdGFydERyYWc6ICh7IGNvbXBvbmVudE1vZGVsLCBjb21wb25lbnRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb21wb25lbnRNb2RlbCB8fCBjb21wb25lbnRWaWV3XG4gICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRWaWV3Lm1vZGVsIGlmIGNvbXBvbmVudFZpZXdcblxuICAgIGNvbXBvbmVudERyYWcgPSBuZXcgQ29tcG9uZW50RHJhZ1xuICAgICAgY29tcG9uZW50TW9kZWw6IGNvbXBvbmVudE1vZGVsXG4gICAgICBjb21wb25lbnRWaWV3OiBjb21wb25lbnRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoY29tcG9uZW50RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNhbmNlbERyYWc6IC0+XG4gICAgQGRyYWdCYXNlLmNhbmNlbCgpXG5cblxuICBoYW5kbGVDbGlja2VkQ29tcG9uZW50OiAoZXZlbnQsIGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgQGZvY3VzLmNvbXBvbmVudEZvY3VzZWQoY29tcG9uZW50VmlldylcblxuICAgICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKGNvbXBvbmVudFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKGNvbXBvbmVudFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICBlbHNlXG4gICAgICBAZm9jdXMuYmx1cigpXG5cblxuICBnZXRGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIGNvbXBvbmVudFZpZXdXYXNJbnNlcnRlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoY29tcG9uZW50VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIGNvbXBvbmVudFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gY29tcG9uZW50Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlckNvbXBvbmVudEZvY3VzZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGNvbXBvbmVudFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyQ29tcG9uZW50Qmx1cnJlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgY29tcG9uZW50Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG4gICAgQGxvYWRlZFNjcmlwdHMgPSBbXVxuXG5cbiAgIyBDb3JlIG1ldGhvZCBleHRyYWN0ZWQgZnJvbSAkc2NyaXB0IChodHRwczovL2dpdGh1Yi5jb20vZGVkL3NjcmlwdC5qcykuXG4gICMgTG9hZHMgaW5kaXZpZHVhbCBzY3JpcHRzIGFzeW5jaHJvbm91c2x5LlxuICAjXG4gICMgQHBhcmFtIHt3aW5kb3cuZG9jdW1lbnR9IFRoZSBkb2N1bWVudCB5b3Ugd2FudCB0aGUgc2NyaXB0IHRvIGxvYWQgaW5cbiAgIyBAcGFyYW0ge1N0cmluZ30gUGF0aCB0byB0aGUganMgZmlsZVxuICAjIEBwYXJhbSB7RnVuY3Rpb259IENhbGxiYWNrIHdoZW4gdGhlIHNjcmlwdCBpcyBsb2FkZWQgb3IgYW4gZXJyb3Igb2NjdXJlZC5cbiAgbG9hZFNpbmdsZVVybDogKHBhdGgsIGNhbGxiYWNrID0gLT4pIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzVXJsTG9hZGVkKHBhdGgpXG5cbiAgICBkb2MgPSBAd2luZG93LmRvY3VtZW50XG4gICAgcmVhZHlTdGF0ZSA9ICdyZWFkeVN0YXRlJ1xuICAgIG9ucmVhZHlzdGF0ZWNoYW5nZSA9ICdvbnJlYWR5c3RhdGVjaGFuZ2UnXG4gICAgaGVhZCA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdXG5cbiAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIGxvYWRlZCA9IHVuZGVmaW5lZFxuXG4gICAgZWwub25sb2FkID0gZWwub25lcnJvciA9IGVsW29ucmVhZHlzdGF0ZWNoYW5nZV0gPSA9PlxuICAgICAgcmV0dXJuIGlmICgoZWxbcmVhZHlTdGF0ZV0gJiYgISgvXmN8bG9hZGUvLnRlc3QoZWxbcmVhZHlTdGF0ZV0pKSkgfHwgbG9hZGVkKVxuICAgICAgZWwub25sb2FkID0gZWxbb25yZWFkeXN0YXRlY2hhbmdlXSA9IG51bGxcbiAgICAgIGxvYWRlZCA9IHRydWVcbiAgICAgIEBsb2FkZWRVcmxzLnB1c2gocGF0aClcbiAgICAgIGNhbGxiYWNrKClcblxuICAgIGVsLmFzeW5jID0gdHJ1ZVxuICAgIGVsLnNyYyA9IHBhdGhcbiAgICBoZWFkLmluc2VydEJlZm9yZShlbCwgaGVhZC5sYXN0Q2hpbGQpXG5cblxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBJbmxpbmUgU2NyaXB0XG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIGxvYWRJbmxpbmVTY3JpcHQ6IChjb2RlQmxvY2ssIGNhbGxiYWNrID0gLT4pIC0+XG4gICAgY29kZUJsb2NrID0gQHByZXBhcmVJbmxpbmVDb2RlKGNvZGVCbG9jaylcbiAgICByZXR1cm4gY2FsbGJhY2soKSBpZiBAaXNJbmxpbmVCbG9ja0xvYWRlZChjb2RlQmxvY2spXG5cbiAgICAjIEluamVjdCBhbiBpbmxpbmUgc2NyaXB0IGVsZW1lbnQgdG8gdGhlIGRvY3VtZW50XG4gICAgZG9jID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuaW5uZXJIVE1MID0gY29kZUJsb2NrO1xuICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgQGxvYWRlZFNjcmlwdHMucHVzaChjb2RlQmxvY2spXG5cbiAgICBjYWxsYmFjaygpXG5cblxuICBwcmVwYXJlSW5saW5lQ29kZTogKGNvZGVCbG9jaykgLT5cbiAgICAjIFJlbW92ZSA8c2NyaXB0PiB0YWdzIGFyb3VuZCB0aGUgc2NyaXB0XG4gICAgY29kZUJsb2NrLnJlcGxhY2UoLzxzY3JpcHRbXj5dKj58PFxcL3NjcmlwdD4vZ2ksICcnKVxuXG5cbiAgaXNJbmxpbmVCbG9ja0xvYWRlZDogKGNvZGVCbG9jaykgLT5cbiAgICBAbG9hZGVkU2NyaXB0cy5pbmRleE9mKGNvZGVCbG9jaykgPj0gMFxuXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyJylcbkFzc2V0cyA9IHJlcXVpcmUoJy4vYXNzZXRzJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBBIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBSZW5kZXJpbmdDb250YWluZXIgd2hpY2ggaXMgaW50ZW5kZWQgdG8gYmUgc2hvd24gdG9cbiMgdGhlIHVzZXIuIEl0IGhhcyBhIExvYWRlciB3aGljaCBhbGxvd3MgeW91IHRvIGluamVjdCBDU1MgYW5kIEpTIGZpbGVzIGludG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBhZ2UgZXh0ZW5kcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgcmVhZE9ubHksIGhvc3RXaW5kb3csIEBkb2N1bWVudERlcGVuZGVuY2llcywgQGRlc2lnbiwgQGNvbXBvbmVudFRyZWUsIEBsb2FkUmVzb3VyY2VzIH09e30pIC0+XG4gICAgQGxvYWRSZXNvdXJjZXMgPz0gY29uZmlnLmxvYWRSZXNvdXJjZXNcbiAgICBAaXNSZWFkT25seSA9IHJlYWRPbmx5IGlmIHJlYWRPbmx5P1xuICAgIEByZW5kZXJOb2RlID0gaWYgcmVuZGVyTm9kZT8uanF1ZXJ5IHRoZW4gcmVuZGVyTm9kZVswXSBlbHNlIHJlbmRlck5vZGVcbiAgICBAc2V0V2luZG93KGhvc3RXaW5kb3cpXG4gICAgQHJlbmRlck5vZGUgPz0gJChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiLCBAJGJvZHkpXG5cbiAgICBzdXBlcigpXG5cbiAgICAjIFByZXBhcmUgYXNzZXRzXG4gICAgcHJldmVudEFzc2V0TG9hZGluZyA9IG5vdCBAbG9hZFJlc291cmNlc1xuICAgIEBhc3NldHMgPSBuZXcgQXNzZXRzKHdpbmRvdzogQHdpbmRvdywgZGlzYWJsZTogcHJldmVudEFzc2V0TG9hZGluZylcblxuICAgIEBsb2FkQXNzZXRzKClcblxuXG4gIGJlZm9yZVJlYWR5OiAtPlxuICAgICMgYWx3YXlzIGluaXRpYWxpemUgYSBwYWdlIGFzeW5jaHJvbm91c2x5XG4gICAgQHJlYWR5U2VtYXBob3JlLndhaXQoKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuICAgICwgMFxuXG5cbiAgbG9hZEFzc2V0czogPT5cbiAgICAjIEZpcnN0IGxvYWQgZGVzaWduIGRlcGVuZGVuY2llc1xuICAgIGlmIEBkZXNpZ24/XG4gICAgICBAYXNzZXRzLmxvYWREZXBlbmRlbmNpZXMoQGRlc2lnbi5kZXBlbmRlbmNpZXMsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cbiAgICAjIFRoZW4gbG9hZCBkb2N1bWVudCBzcGVjaWZpYyBkZXBlbmRlbmNpZXNcbiAgICBpZiBAZG9jdW1lbnREZXBlbmRlbmNpZXM/XG4gICAgICBAYXNzZXRzLmxvYWREZXBlbmRlbmNpZXMoQGRvY3VtZW50RGVwZW5kZW5jaWVzLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG4gICAgICAjIGxpc3RlbiBmb3IgbmV3IGRlcGVuZGVuY2llc1xuICAgICAgQGRvY3VtZW50RGVwZW5kZW5jaWVzLmRlcGVuZGVuY3lBZGRlZC5hZGQgKGRlcGVuZGVuY3kpID0+XG4gICAgICAgIEBhc3NldHMubG9hZERlcGVuZGVuY3koZGVwZW5kZW5jeSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgaG9zdFdpbmRvdyA/PSBAZ2V0UGFyZW50V2luZG93KEByZW5kZXJOb2RlKVxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cbiAgZ2V0UGFyZW50V2luZG93OiAoZWxlbSkgLT5cbiAgICBpZiBlbGVtP1xuICAgICAgZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgZWxzZVxuICAgICAgd2luZG93XG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIENvbXBvbmVudFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID89ICQoJzxkaXY+JylbMF1cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAYmVmb3JlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBodG1sOiAtPlxuICAgICQoQHJlbmRlck5vZGUpLmh0bWwoKVxuXG5cbiAgY29tcG9uZW50Vmlld1dhc0luc2VydGVkOiAoY29tcG9uZW50VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5lZGl0b3JDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBuYW1lLCBAdHlwZSwgQGVsZW0sIGNvbmZpZyB9KSAtPlxuICAgIEBjb25maWcgPSBPYmplY3QuY3JlYXRlKGVkaXRvckNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXSlcbiAgICBAbmFtZSA9IG5hbWUgfHwgQGNvbmZpZy5kZWZhdWx0TmFtZVxuICAgIEBzZXRDb25maWcoY29uZmlnKVxuICAgIEBvcHRpb25hbCA9IGZhbHNlXG5cblxuICBzZXRDb25maWc6IChjb25maWcpIC0+XG4gICAgJC5leHRlbmQoQGNvbmZpZywgY29uZmlnKVxuXG5cbiAgcmVuZGVyZWRBdHRyOiAtPlxuICAgIEBjb25maWcucmVuZGVyZWRBdHRyXG5cblxuICBpc0VsZW1lbnREaXJlY3RpdmU6IC0+XG4gICAgQGNvbmZpZy5lbGVtZW50RGlyZWN0aXZlXG5cblxuICAjIFJldHVybiB0aGUgbm9kZU5hbWUgaW4gbG93ZXIgY2FzZVxuICBnZXRUYWdOYW1lOiAtPlxuICAgIEBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBDb21wb25lbnRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlLCBjb25maWc6IEBjb25maWcpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQGVsZW0pXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbiMgQSBsaXN0IG9mIGFsbCBkaXJlY3RpdmVzIG9mIGEgdGVtcGxhdGVcbiMgRXZlcnkgbm9kZSB3aXRoIGFuIGRvYy0gYXR0cmlidXRlIHdpbGwgYmUgc3RvcmVkIGJ5IGl0cyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUNvbGxlY3Rpb25cblxuICBjb25zdHJ1Y3RvcjogKEBhbGw9e30pIC0+XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIGFkZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBAYXNzZXJ0TmFtZU5vdFVzZWQoZGlyZWN0aXZlKVxuXG4gICAgIyBjcmVhdGUgcHNldWRvIGFycmF5XG4gICAgdGhpc1tAbGVuZ3RoXSA9IGRpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZS5pbmRleCA9IEBsZW5ndGhcbiAgICBAbGVuZ3RoICs9IDFcblxuICAgICMgaW5kZXggYnkgbmFtZVxuICAgIEBhbGxbZGlyZWN0aXZlLm5hbWVdID0gZGlyZWN0aXZlXG5cbiAgICAjIGluZGV4IGJ5IHR5cGVcbiAgICAjIGRpcmVjdGl2ZS50eXBlIGlzIG9uZSBvZiB0aG9zZSAnY29udGFpbmVyJywgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0gfHw9IFtdXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0ucHVzaChkaXJlY3RpdmUpXG4gICAgZGlyZWN0aXZlXG5cblxuICBuZXh0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgbmFtZXM6ICh0eXBlKSAtPlxuICAgIHJldHVybiBbXSB1bmxlc3MgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICBkaXJlY3RpdmUubmFtZVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaE9mVHlwZTogKHR5cGUsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHRoaXNbdHlwZV1cbiAgICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBlYWNoRWRpdGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnZWRpdGFibGUnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hJbWFnZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdpbWFnZScsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdjb250YWluZXInLCBjYWxsYmFjaylcblxuXG4gIGVhY2hIdG1sOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2h0bWwnLCBjYWxsYmFjaylcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgIyB0b2RvOiByZW5hbWUgb3IgYmV0dGVyIHJlbW92ZVxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpcmVjdGl2ZUZpbmRlciA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIGxpbms6IChlbGVtLCBkaXJlY3RpdmVDb2xsZWN0aW9uKSAtPlxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbGxlY3Rpb24uZ2V0KGF0dHIudmFsdWUpXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtID0gZWxlbVxuXG4gICAgdW5kZWZpbmVkXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3IgY29tcG9uZW50IHRlbXBsYXRlc1xuIyBzbyBpdCBkb2VzIG5vdCB0cmF2ZXJzZSBpbnRvIGNvbnRhaW5lcnMuXG4jXG4jIFVzZSB0byB0cmF2ZXJzZSBhbGwgbm9kZXMgb2YgYSB0ZW1wbGF0ZS4gVGhlIGl0ZXJhdG9yIGRvZXMgbm90IGdvIGludG9cbiMgY29udGFpbmVycyBhbmQgaXMgc2FmZSB0byB1c2UgZXZlbiBpZiB0aGVyZSBpcyBjb250ZW50IGluIHRoZXNlIGNvbnRhaW5lcnMuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUl0ZXJhdG9yXG5cbiAgY29uc3RydWN0b3I6IChyb290KSAtPlxuICAgIEByb290ID0gQF9uZXh0ID0gcm9vdFxuICAgIEBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG5cbiAgY3VycmVudDogbnVsbFxuXG5cbiAgaGFzTmV4dDogLT5cbiAgICAhIUBfbmV4dFxuXG5cbiAgbmV4dDogKCkgLT5cbiAgICBuID0gQGN1cnJlbnQgPSBAX25leHRcbiAgICBjaGlsZCA9IG5leHQgPSB1bmRlZmluZWRcbiAgICBpZiBAY3VycmVudFxuICAgICAgY2hpbGQgPSBuLmZpcnN0Q2hpbGRcbiAgICAgIGlmIGNoaWxkICYmIG4ubm9kZVR5cGUgPT0gMSAmJiAhbi5oYXNBdHRyaWJ1dGUoQGNvbnRhaW5lckF0dHIpXG4gICAgICAgIEBfbmV4dCA9IGNoaWxkXG4gICAgICBlbHNlXG4gICAgICAgIG5leHQgPSBudWxsXG4gICAgICAgIHdoaWxlIChuICE9IEByb290KSAmJiAhKG5leHQgPSBuLm5leHRTaWJsaW5nKVxuICAgICAgICAgIG4gPSBuLnBhcmVudE5vZGVcblxuICAgICAgICBAX25leHQgPSBuZXh0XG5cbiAgICBAY3VycmVudFxuXG5cbiAgIyBvbmx5IGl0ZXJhdGUgb3ZlciBlbGVtZW50IG5vZGVzIChOb2RlLkVMRU1FTlRfTk9ERSA9PSAxKVxuICBuZXh0RWxlbWVudDogKCkgLT5cbiAgICB3aGlsZSBAbmV4dCgpXG4gICAgICBicmVhayBpZiBAY3VycmVudC5ub2RlVHlwZSA9PSAxXG5cbiAgICBAY3VycmVudFxuXG5cbiAgZGV0YWNoOiAoKSAtPlxuICAgIEBjdXJyZW50ID0gQF9uZXh0ID0gQHJvb3QgPSBudWxsXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5Db21wb25lbnRNb2RlbCA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9tb2RlbCcpXG5Db21wb25lbnRWaWV3ID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nL2NvbXBvbmVudF92aWV3Jylcblxuc29ydEJ5TmFtZSA9IChhLCBiKSAtPlxuICBpZiAoYS5uYW1lID4gYi5uYW1lKVxuICAgIDFcbiAgZWxzZSBpZiAoYS5uYW1lIDwgYi5uYW1lKVxuICAgIC0xXG4gIGVsc2VcbiAgICAwXG5cbiMgVGVtcGxhdGVcbiMgLS0tLS0tLS1cbiMgUGFyc2VzIGNvbXBvbmVudCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgQ29tcG9uZW50TW9kZWxzIGFuZCBDb21wb25lbnRWaWV3cy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGVtcGxhdGVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgaHRtbCwgbGFiZWwsIHByb3BlcnRpZXMgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEBsYWJlbCA9IGxhYmVsIHx8IHdvcmRzLmh1bWFuaXplKCBAbmFtZSApXG4gICAgQHN0eWxlcyA9IHByb3BlcnRpZXMgfHwge31cbiAgICBAZGVmYXVsdHMgPSB7fVxuXG4gICAgQHBhcnNlVGVtcGxhdGUoKVxuXG5cbiAgc2V0RGVzaWduOiAoZGVzaWduKSAtPlxuICAgIEBkZXNpZ24gPSBkZXNpZ25cbiAgICBAaWRlbnRpZmllciA9IFwiI3sgZGVzaWduLm5hbWUgfS4jeyBAbmFtZSB9XCJcblxuXG4gICMgY3JlYXRlIGEgbmV3IENvbXBvbmVudE1vZGVsIGluc3RhbmNlIGZyb20gdGhpcyB0ZW1wbGF0ZVxuICBjcmVhdGVNb2RlbDogKCkgLT5cbiAgICBuZXcgQ29tcG9uZW50TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoY29tcG9uZW50TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgY29tcG9uZW50TW9kZWwgfHw9IEBjcmVhdGVNb2RlbCgpXG4gICAgJGVsZW0gPSBAJHRlbXBsYXRlLmNsb25lKClcbiAgICBkaXJlY3RpdmVzID0gQGxpbmtEaXJlY3RpdmVzKCRlbGVtWzBdKVxuXG4gICAgY29tcG9uZW50VmlldyA9IG5ldyBDb21wb25lbnRWaWV3XG4gICAgICBtb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgICRodG1sOiAkZWxlbVxuICAgICAgZGlyZWN0aXZlczogZGlyZWN0aXZlc1xuICAgICAgaXNSZWFkT25seTogaXNSZWFkT25seVxuXG5cbiAgcHJ1bmVIdG1sOiAoaHRtbCkgLT5cblxuICAgICMgcmVtb3ZlIGFsbCBjb21tZW50c1xuICAgIGh0bWwgPSAkKGh0bWwpLmZpbHRlciAoaW5kZXgpIC0+XG4gICAgICBAbm9kZVR5cGUgIT04XG5cbiAgICAjIG9ubHkgYWxsb3cgb25lIHJvb3QgZWxlbWVudFxuICAgIGFzc2VydCBodG1sLmxlbmd0aCA9PSAxLCBcIlRlbXBsYXRlcyBtdXN0IGNvbnRhaW4gb25lIHJvb3QgZWxlbWVudC4gVGhlIFRlbXBsYXRlIFxcXCIjeyBAaWRlbnRpZmllciB9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBDb21wb25lbnRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBjb21wb25lbnREaXJlY3RpdmVzID0gQGRpcmVjdGl2ZXMuY2xvbmUoKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZUZpbmRlci5saW5rKGVsZW0sIGNvbXBvbmVudERpcmVjdGl2ZXMpXG5cbiAgICBjb21wb25lbnREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIFJldHVybiBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgaW50ZXJmYWNlIG9mIHRoaXMgdGVtcGxhdGVcbiAgIyBAcmV0dXJucyB7IE9iamVjdCB9IEFuIG9iamVjdCB3aWNoIGNvbnRhaW5zIHRoZSBpbnRlcmZhY2UgZGVzY3JpcHRpb25cbiAgIyAgIG9mIHRoaXMgdGVtcGxhdGUuIFRoaXMgb2JqZWN0IHdpbGwgYmUgdGhlIHNhbWUgaWYgdGhlIGludGVyZmFjZSBkb2VzXG4gICMgICBub3QgY2hhbmdlIHNpbmNlIGRpcmVjdGl2ZXMgYW5kIHByb3BlcnRpZXMgYXJlIHNvcnRlZC5cbiAgaW5mbzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgbmFtZTogQG5hbWVcbiAgICAgIGRlc2lnbjogQGRlc2lnbj8ubmFtZVxuICAgICAgZGlyZWN0aXZlczogW11cbiAgICAgIHByb3BlcnRpZXM6IFtdXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICB7IG5hbWUsIHR5cGUgfSA9IGRpcmVjdGl2ZVxuICAgICAgZG9jLmRpcmVjdGl2ZXMucHVzaCh7IG5hbWUsIHR5cGUgfSlcblxuXG4gICAgZm9yIG5hbWUsIHN0eWxlIG9mIEBzdHlsZXNcbiAgICAgIGRvYy5wcm9wZXJ0aWVzLnB1c2goeyBuYW1lLCB0eXBlOiAnY3NzTW9kaWZpY2F0b3InIH0pXG5cbiAgICBkb2MuZGlyZWN0aXZlcy5zb3J0KHNvcnRCeU5hbWUpXG4gICAgZG9jLnByb3BlcnRpZXMuc29ydChzb3J0QnlOYW1lKVxuICAgIGRvY1xuXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgZGVzaWduTmFtZTogdW5kZWZpbmVkLCBuYW1lOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IGRlc2lnbk5hbWU6IHBhcnRzWzBdLCBuYW1lOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2UgY29tcG9uZW50IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcInZlcnNpb25cIjogXCIwLjQuNFwiLFxuICBcInJldmlzaW9uXCI6IFwiYjAxZjIyNVwiXG59XG4iXX0=
