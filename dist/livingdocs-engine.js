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
var ComponentTree, EditorPage, Livingdoc, augmentConfig, config, designCache, doc, version;

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Livingdoc = require('./livingdoc');

ComponentTree = require('./component_tree/component_tree');

designCache = require('./design/design_cache');

EditorPage = require('./rendering_container/editor_page');

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
    }
  };
})();

window.doc = doc;



},{"../version":66,"./component_tree/component_tree":17,"./configuration/augment_config":21,"./configuration/config":22,"./design/design_cache":26,"./livingdoc":39,"./rendering_container/editor_page":56}],12:[function(require,module,exports){
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



},{"../image_services/image_service":32,"../modules/logging/assert":46,"./editable_directive":18,"./html_directive":19,"./image_directive":20}],15:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/guid":43,"../modules/logging/assert":46,"../modules/logging/log":47,"../template/directive_collection":61,"./component_container":13,"./component_directive_factory":14,"deep-equal":1}],16:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/guid":43,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/serialization":50,"./component_model":15,"deep-equal":1,"jquery":"cqNDv+"}],17:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"./component_array":12,"./component_container":13,"./component_model":15,"./component_model_serializer":16,"jquery":"cqNDv+"}],18:[function(require,module,exports){
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



},{"../modules/logging/assert":46}],19:[function(require,module,exports){
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



},{"../modules/logging/assert":46}],20:[function(require,module,exports){
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



},{"../image_services/image_service":32,"../modules/logging/assert":46}],21:[function(require,module,exports){
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



},{}],22:[function(require,module,exports){
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



},{"./augment_config":21}],23:[function(require,module,exports){
var $, Assets, config;

$ = require('jquery');

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



},{"../configuration/config":22,"jquery":"cqNDv+"}],24:[function(require,module,exports){
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
    this.imageRatios = {};
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



},{"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/ordered_hash":48,"../template/template":65,"./assets":23}],26:[function(require,module,exports){
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



},{"../configuration/config":22,"./version":30,"jscheme":4}],28:[function(require,module,exports){
var CssModificatorProperty, Design, ImageRatio, Template, Version, assert, designConfigSchema, designParser, log;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

designConfigSchema = require('./design_config_schema');

CssModificatorProperty = require('./css_modificator_property');

Template = require('../template/template');

Design = require('./design');

Version = require('./version');

ImageRatio = require('./image_ratio');

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
      directiveConfig = {
        imageRatios: this.lookupImageRatios(conf.imageRatios)
      };
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



},{"../modules/logging/assert":46,"../modules/logging/log":47,"../template/template":65,"./css_modificator_property":24,"./design":25,"./design_config_schema":27,"./image_ratio":29,"./version":30}],29:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"./default_image_service":31}],34:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/feature_detection/is_supported":42,"./dom":35}],35:[function(require,module,exports){
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



},{"../configuration/config":22,"jquery":"cqNDv+"}],36:[function(require,module,exports){
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



},{"../configuration/config":22}],37:[function(require,module,exports){
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



},{"../configuration/config":22,"./dom":35}],38:[function(require,module,exports){
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
var ComponentTree, EventEmitter, InteractivePage, Livingdoc, Page, Renderer, RenderingContainer, View, assert, config, designCache, dom,
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



},{"./component_tree/component_tree":17,"./configuration/config":22,"./design/design_cache":26,"./interaction/dom":35,"./modules/logging/assert":46,"./rendering/renderer":53,"./rendering/view":54,"./rendering_container/interactive_page":57,"./rendering_container/page":58,"./rendering_container/rendering_container":59,"wolfy87-eventemitter":10}],40:[function(require,module,exports){
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



},{}],42:[function(require,module,exports){
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

  return ComponentView;

})();



},{"../configuration/config":22,"../interaction/dom":35,"../modules/eventing":40,"../template/directive_iterator":64,"jquery":"cqNDv+"}],53:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/semaphore":49,"jquery":"cqNDv+"}],54:[function(require,module,exports){
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



},{"../rendering_container/interactive_page":57,"../rendering_container/page":58,"./renderer":53}],55:[function(require,module,exports){
var $, CssLoader, Semaphore;

$ = require('jquery');

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



},{"../modules/semaphore":49,"jquery":"cqNDv+"}],56:[function(require,module,exports){
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



},{"../configuration/config":22,"../interaction/component_drag":34,"../interaction/drag_base":36}],57:[function(require,module,exports){
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



},{"../configuration/config":22,"../interaction/component_drag":34,"../interaction/dom":35,"../interaction/drag_base":36,"../interaction/editable_controller":37,"../interaction/focus":38,"./page":58}],58:[function(require,module,exports){
var $, CssLoader, Page, RenderingContainer, config,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

$ = require('jquery');

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



},{"../configuration/config":22,"./css_loader":55,"./rendering_container":59,"jquery":"cqNDv+"}],59:[function(require,module,exports){
var $, RenderingContainer, Semaphore;

$ = require('jquery');

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



},{"../modules/semaphore":49,"jquery":"cqNDv+"}],60:[function(require,module,exports){
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



},{"../configuration/config":22,"../interaction/dom":35,"jquery":"cqNDv+"}],61:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/logging/assert":46,"./directive":60,"jquery":"cqNDv+"}],62:[function(require,module,exports){
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



},{"../configuration/config":22,"./directive":60}],63:[function(require,module,exports){
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



},{"../configuration/config":22}],64:[function(require,module,exports){
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



},{"../configuration/config":22}],65:[function(require,module,exports){
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



},{"../component_tree/component_model":15,"../configuration/config":22,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/words":51,"../rendering/component_view":52,"./directive_collection":61,"./directive_compiler":62,"./directive_finder":63,"./directive_iterator":64,"jquery":"cqNDv+"}],66:[function(require,module,exports){
module.exports={
  "version": "0.4.1",
  "revision": "bd25870"
}

},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9rZXlzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvanNjaGVtZS9saWIvanNjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3Byb3BlcnR5X3ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3NjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3R5cGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi92YWxpZGF0aW9uX2Vycm9ycy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3ZhbGlkYXRvcnMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy93b2xmeTg3LWV2ZW50ZW1pdHRlci9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfZGlyZWN0aXZlX2ZhY3RvcnkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9tb2RlbF9zZXJpYWxpemVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2VkaXRhYmxlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9odG1sX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9pbWFnZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29uZmlndXJhdGlvbi9hdWdtZW50X2NvbmZpZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2NvbmZpZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vYXNzZXRzLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9jc3NfbW9kaWZpY2F0b3JfcHJvcGVydHkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fY29uZmlnX3NjaGVtYS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3BhcnNlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vaW1hZ2VfcmF0aW8uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL3ZlcnNpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvZGVmYXVsdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvcmVzcmNpdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9saXZpbmdkb2MuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9qcXVlcnlfYnJvd3NlcmlmeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vcmRlcmVkX2hhc2guY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2NvbXBvbmVudF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZW5kZXJlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvdmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGRBLElBQUEsc0ZBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx3QkFBUixDQUFULENBQUE7O0FBQUEsYUFDQSxHQUFnQixPQUFBLENBQVEsZ0NBQVIsQ0FEaEIsQ0FBQTs7QUFBQSxTQUVBLEdBQVksT0FBQSxDQUFRLGFBQVIsQ0FGWixDQUFBOztBQUFBLGFBR0EsR0FBZ0IsT0FBQSxDQUFRLGlDQUFSLENBSGhCLENBQUE7O0FBQUEsV0FJQSxHQUFjLE9BQUEsQ0FBUSx1QkFBUixDQUpkLENBQUE7O0FBQUEsVUFLQSxHQUFhLE9BQUEsQ0FBUSxtQ0FBUixDQUxiLENBQUE7O0FBQUEsT0FNQSxHQUFVLE9BQUEsQ0FBUSxZQUFSLENBTlYsQ0FBQTs7QUFBQSxNQVFNLENBQUMsT0FBUCxHQUFpQixHQUFBLEdBQVMsQ0FBQSxTQUFBLEdBQUE7QUFFeEIsTUFBQSxVQUFBO0FBQUEsRUFBQSxVQUFBLEdBQWlCLElBQUEsVUFBQSxDQUFBLENBQWpCLENBQUE7U0FHQTtBQUFBLElBQUEsT0FBQSxFQUFTLE9BQU8sQ0FBQyxPQUFqQjtBQUFBLElBQ0EsUUFBQSxFQUFVLE9BQU8sQ0FBQyxRQURsQjtBQUFBLElBY0EsTUFBQSxFQUFRLFdBZFI7QUFBQSxJQWtCQSxTQUFBLEVBQVcsU0FsQlg7QUFBQSxJQW1CQSxhQUFBLEVBQWUsYUFuQmY7QUFBQSxJQXlDQSxlQUFBLEVBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsVUFBQSwyQkFBQTtBQUFBLE1BRGtCLFlBQUEsTUFBTSxjQUFBLFFBQVEscUJBQUEsYUFDaEMsQ0FBQTthQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCO0FBQUEsUUFBRSxNQUFBLElBQUY7QUFBQSxRQUFRLFVBQUEsRUFBWSxNQUFwQjtBQUFBLFFBQTRCLGVBQUEsYUFBNUI7T0FBakIsRUFEZTtJQUFBLENBekNqQjtBQUFBLElBOENBLEtBQUEsRUFBSyxTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsZUFBZSxDQUFDLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLFNBQTdCLEVBQUg7SUFBQSxDQTlDTDtBQUFBLElBK0NBLE1BQUEsRUFBUSxTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsZUFBZSxDQUFDLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLFNBQTdCLEVBQUg7SUFBQSxDQS9DUjtBQUFBLElBbURBLFNBQUEsRUFBVyxDQUFDLENBQUMsS0FBRixDQUFRLFVBQVIsRUFBb0IsV0FBcEIsQ0FuRFg7QUFBQSxJQXVEQSxNQUFBLEVBQVEsU0FBQyxVQUFELEdBQUE7QUFDTixNQUFBLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLE1BQWYsRUFBdUIsVUFBdkIsQ0FBQSxDQUFBO2FBQ0EsYUFBQSxDQUFjLE1BQWQsRUFGTTtJQUFBLENBdkRSO0lBTHdCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FSdkIsQ0FBQTs7QUFBQSxNQTJFTSxDQUFDLEdBQVAsR0FBYSxHQTNFYixDQUFBOzs7OztBQ0dBLElBQUEsY0FBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUlSLEVBQUEsd0JBQUUsVUFBRixHQUFBO0FBQ1gsSUFEWSxJQUFDLENBQUEsYUFBQSxVQUNiLENBQUE7O01BQUEsSUFBQyxDQUFBLGFBQWM7S0FBZjtBQUFBLElBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FEQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSwyQkFLQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7QUFDakIsUUFBQSw2QkFBQTtBQUFBO0FBQUEsU0FBQSwyREFBQTsyQkFBQTtBQUNFLE1BQUEsSUFBRSxDQUFBLEtBQUEsQ0FBRixHQUFXLE1BQVgsQ0FERjtBQUFBLEtBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUh0QixDQUFBO0FBSUEsSUFBQSxJQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBZjtBQUNFLE1BQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFFLENBQUEsQ0FBQSxDQUFYLENBQUE7YUFDQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUUsQ0FBQSxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosR0FBcUIsQ0FBckIsRUFGWjtLQUxpQjtFQUFBLENBTG5CLENBQUE7O0FBQUEsMkJBZUEsSUFBQSxHQUFNLFNBQUMsUUFBRCxHQUFBO0FBQ0osUUFBQSx5QkFBQTtBQUFBO0FBQUEsU0FBQSwyQ0FBQTsyQkFBQTtBQUNFLE1BQUEsUUFBQSxDQUFTLFNBQVQsQ0FBQSxDQURGO0FBQUEsS0FBQTtXQUdBLEtBSkk7RUFBQSxDQWZOLENBQUE7O0FBQUEsMkJBc0JBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixJQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxTQUFELEdBQUE7YUFDSixTQUFTLENBQUMsTUFBVixDQUFBLEVBREk7SUFBQSxDQUFOLENBQUEsQ0FBQTtXQUdBLEtBSk07RUFBQSxDQXRCUixDQUFBOzt3QkFBQTs7SUFKRixDQUFBOzs7OztBQ0hBLElBQUEsMEJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsTUFhTSxDQUFDLE9BQVAsR0FBdUI7QUFHUixFQUFBLDRCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsTUFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHVCQUFBLGlCQUFpQixJQUFDLENBQUEsWUFBQSxNQUFNLGNBQUEsTUFDdkMsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxjQUFWLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLElBQUQsR0FBUSxNQURqQixDQURXO0VBQUEsQ0FBYjs7QUFBQSwrQkFLQSxPQUFBLEdBQVMsU0FBQyxTQUFELEdBQUE7QUFDUCxJQUFBLElBQUcsSUFBQyxDQUFBLEtBQUo7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLEtBQWYsRUFBc0IsU0FBdEIsQ0FBQSxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBakIsQ0FBQSxDQUhGO0tBQUE7V0FLQSxLQU5PO0VBQUEsQ0FMVCxDQUFBOztBQUFBLCtCQWNBLE1BQUEsR0FBUSxTQUFDLFNBQUQsR0FBQTtBQUNOLElBQUEsSUFBRyxJQUFDLENBQUEsZUFBSjtBQUNFLE1BQUEsTUFBQSxDQUFPLFNBQUEsS0FBZSxJQUFDLENBQUEsZUFBdkIsRUFBd0MsbUNBQXhDLENBQUEsQ0FERjtLQUFBO0FBR0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFKO0FBQ0UsTUFBQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQW9CLFNBQXBCLENBQUEsQ0FERjtLQUFBLE1BQUE7QUFHRSxNQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLFNBQWpCLENBQUEsQ0FIRjtLQUhBO1dBUUEsS0FUTTtFQUFBLENBZFIsQ0FBQTs7QUFBQSwrQkEwQkEsWUFBQSxHQUFjLFNBQUMsU0FBRCxFQUFZLGlCQUFaLEdBQUE7QUFDWixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQVUsU0FBUyxDQUFDLFFBQVYsS0FBc0IsaUJBQWhDO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFBLEtBQWUsaUJBQXRCLEVBQXlDLHVDQUF6QyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLFNBQVMsQ0FBQyxRQUFwQjtBQUFBLE1BQ0EsSUFBQSxFQUFNLFNBRE47QUFBQSxNQUVBLGVBQUEsRUFBaUIsU0FBUyxDQUFDLGVBRjNCO0tBSkYsQ0FBQTtXQVFBLElBQUMsQ0FBQSxlQUFELENBQWlCLGlCQUFqQixFQUFvQyxRQUFwQyxFQVRZO0VBQUEsQ0ExQmQsQ0FBQTs7QUFBQSwrQkFzQ0EsV0FBQSxHQUFhLFNBQUMsU0FBRCxFQUFZLGlCQUFaLEdBQUE7QUFDWCxRQUFBLFFBQUE7QUFBQSxJQUFBLElBQVUsU0FBUyxDQUFDLElBQVYsS0FBa0IsaUJBQTVCO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFBLEtBQWUsaUJBQXRCLEVBQXlDLHNDQUF6QyxDQURBLENBQUE7QUFBQSxJQUdBLFFBQUEsR0FDRTtBQUFBLE1BQUEsUUFBQSxFQUFVLFNBQVY7QUFBQSxNQUNBLElBQUEsRUFBTSxTQUFTLENBQUMsSUFEaEI7QUFBQSxNQUVBLGVBQUEsRUFBaUIsU0FBUyxDQUFDLGVBRjNCO0tBSkYsQ0FBQTtXQVFBLElBQUMsQ0FBQSxlQUFELENBQWlCLGlCQUFqQixFQUFvQyxRQUFwQyxFQVRXO0VBQUEsQ0F0Q2IsQ0FBQTs7QUFBQSwrQkFrREEsRUFBQSxHQUFJLFNBQUMsU0FBRCxHQUFBO0FBQ0YsSUFBQSxJQUFHLDBCQUFIO2FBQ0UsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFTLENBQUMsUUFBeEIsRUFBa0MsU0FBbEMsRUFERjtLQURFO0VBQUEsQ0FsREosQ0FBQTs7QUFBQSwrQkF1REEsSUFBQSxHQUFNLFNBQUMsU0FBRCxHQUFBO0FBQ0osSUFBQSxJQUFHLHNCQUFIO2FBQ0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxTQUFTLENBQUMsSUFBdkIsRUFBNkIsU0FBN0IsRUFERjtLQURJO0VBQUEsQ0F2RE4sQ0FBQTs7QUFBQSwrQkE0REEsZ0JBQUEsR0FBa0IsU0FBQSxHQUFBO0FBQ2hCLFFBQUEsSUFBQTtXQUFBLElBQUMsQ0FBQSxhQUFELGlEQUFrQyxDQUFFLHdCQURwQjtFQUFBLENBNURsQixDQUFBOztBQUFBLCtCQWlFQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7QUFDSixRQUFBLG1CQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLEtBQWIsQ0FBQTtBQUNBO1dBQU8sU0FBUCxHQUFBO0FBQ0UsTUFBQSxTQUFTLENBQUMsa0JBQVYsQ0FBNkIsUUFBN0IsQ0FBQSxDQUFBO0FBQUEsb0JBQ0EsU0FBQSxHQUFZLFNBQVMsQ0FBQyxLQUR0QixDQURGO0lBQUEsQ0FBQTtvQkFGSTtFQUFBLENBakVOLENBQUE7O0FBQUEsK0JBd0VBLGFBQUEsR0FBZSxTQUFDLFFBQUQsR0FBQTtBQUNiLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTtBQUNKLFVBQUEsd0NBQUE7QUFBQTtBQUFBO1dBQUEsWUFBQTt3Q0FBQTtBQUNFLHNCQUFBLFFBQUEsQ0FBUyxrQkFBVCxFQUFBLENBREY7QUFBQTtzQkFESTtJQUFBLENBQU4sRUFGYTtFQUFBLENBeEVmLENBQUE7O0FBQUEsK0JBZ0ZBLEdBQUEsR0FBSyxTQUFDLFFBQUQsR0FBQTtBQUNILElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTtBQUNKLFVBQUEsd0NBQUE7QUFBQSxNQUFBLFFBQUEsQ0FBUyxTQUFULENBQUEsQ0FBQTtBQUNBO0FBQUE7V0FBQSxZQUFBO3dDQUFBO0FBQ0Usc0JBQUEsUUFBQSxDQUFTLGtCQUFULEVBQUEsQ0FERjtBQUFBO3NCQUZJO0lBQUEsQ0FBTixFQUZHO0VBQUEsQ0FoRkwsQ0FBQTs7QUFBQSwrQkF3RkEsTUFBQSxHQUFRLFNBQUMsU0FBRCxHQUFBO0FBQ04sSUFBQSxTQUFTLENBQUMsT0FBVixDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixTQUFsQixFQUZNO0VBQUEsQ0F4RlIsQ0FBQTs7QUFBQSwrQkFvR0EsZUFBQSxHQUFpQixTQUFDLFNBQUQsRUFBWSxRQUFaLEdBQUE7QUFDZixRQUFBLG1CQUFBOztNQUQyQixXQUFXO0tBQ3RDO0FBQUEsSUFBQSxJQUFBLEdBQU8sQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNMLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBTixFQUFpQixRQUFqQixFQURLO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUCxDQUFBO0FBR0EsSUFBQSxJQUFHLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0FBbkI7YUFDRSxhQUFhLENBQUMsa0JBQWQsQ0FBaUMsU0FBakMsRUFBNEMsSUFBNUMsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFBLENBQUEsRUFIRjtLQUplO0VBQUEsQ0FwR2pCLENBQUE7O0FBQUEsK0JBc0hBLGdCQUFBLEdBQWtCLFNBQUMsU0FBRCxHQUFBO0FBQ2hCLFFBQUEsbUJBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO2VBQ0wsS0FBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBREs7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFQLENBQUE7QUFHQSxJQUFBLElBQUcsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFuQjthQUNFLGFBQWEsQ0FBQyxrQkFBZCxDQUFpQyxTQUFqQyxFQUE0QyxJQUE1QyxFQURGO0tBQUEsTUFBQTthQUdFLElBQUEsQ0FBQSxFQUhGO0tBSmdCO0VBQUEsQ0F0SGxCLENBQUE7O0FBQUEsK0JBaUlBLElBQUEsR0FBTSxTQUFDLFNBQUQsRUFBWSxRQUFaLEdBQUE7QUFDSixJQUFBLElBQXNCLFNBQVMsQ0FBQyxlQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLENBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxRQUFRLENBQUMsb0JBQVQsUUFBUSxDQUFDLGtCQUFvQixLQUY3QixDQUFBO1dBR0EsSUFBQyxDQUFBLG9CQUFELENBQXNCLFNBQXRCLEVBQWlDLFFBQWpDLEVBSkk7RUFBQSxDQWpJTixDQUFBOztBQUFBLCtCQXlJQSxNQUFBLEdBQVEsU0FBQyxTQUFELEdBQUE7QUFDTixRQUFBLHNCQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksU0FBUyxDQUFDLGVBQXRCLENBQUE7QUFDQSxJQUFBLElBQUcsU0FBSDtBQUdFLE1BQUEsSUFBd0MsMEJBQXhDO0FBQUEsUUFBQSxTQUFTLENBQUMsS0FBVixHQUFrQixTQUFTLENBQUMsSUFBNUIsQ0FBQTtPQUFBO0FBQ0EsTUFBQSxJQUEyQyxzQkFBM0M7QUFBQSxRQUFBLFNBQVMsQ0FBQyxJQUFWLEdBQWlCLFNBQVMsQ0FBQyxRQUEzQixDQUFBO09BREE7O1lBSWMsQ0FBRSxRQUFoQixHQUEyQixTQUFTLENBQUM7T0FKckM7O2FBS2tCLENBQUUsSUFBcEIsR0FBMkIsU0FBUyxDQUFDO09BTHJDO2FBT0EsSUFBQyxDQUFBLG9CQUFELENBQXNCLFNBQXRCLEVBQWlDLEVBQWpDLEVBVkY7S0FGTTtFQUFBLENBeklSLENBQUE7O0FBQUEsK0JBeUpBLG9CQUFBLEdBQXNCLFNBQUMsU0FBRCxFQUFZLElBQVosR0FBQTtBQUNwQixRQUFBLCtCQUFBO0FBQUEsSUFEa0MsdUJBQUEsaUJBQWlCLGdCQUFBLFVBQVUsWUFBQSxJQUM3RCxDQUFBO0FBQUEsSUFBQSxTQUFTLENBQUMsZUFBVixHQUE0QixlQUE1QixDQUFBO0FBQUEsSUFDQSxTQUFTLENBQUMsUUFBVixHQUFxQixRQURyQixDQUFBO0FBQUEsSUFFQSxTQUFTLENBQUMsSUFBVixHQUFpQixJQUZqQixDQUFBO0FBSUEsSUFBQSxJQUFHLGVBQUg7QUFDRSxNQUFBLElBQTZCLFFBQTdCO0FBQUEsUUFBQSxRQUFRLENBQUMsSUFBVCxHQUFnQixTQUFoQixDQUFBO09BQUE7QUFDQSxNQUFBLElBQTZCLElBQTdCO0FBQUEsUUFBQSxJQUFJLENBQUMsUUFBTCxHQUFnQixTQUFoQixDQUFBO09BREE7QUFFQSxNQUFBLElBQXlDLDBCQUF6QztBQUFBLFFBQUEsZUFBZSxDQUFDLEtBQWhCLEdBQXdCLFNBQXhCLENBQUE7T0FGQTtBQUdBLE1BQUEsSUFBd0Msc0JBQXhDO2VBQUEsZUFBZSxDQUFDLElBQWhCLEdBQXVCLFVBQXZCO09BSkY7S0FMb0I7RUFBQSxDQXpKdEIsQ0FBQTs7NEJBQUE7O0lBaEJGLENBQUE7Ozs7O0FDQUEsSUFBQSxzRUFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBQVQsQ0FBQTs7QUFBQSxZQUNBLEdBQWUsT0FBQSxDQUFRLGlDQUFSLENBRGYsQ0FBQTs7QUFBQSxpQkFHQSxHQUFvQixPQUFBLENBQVEsc0JBQVIsQ0FIcEIsQ0FBQTs7QUFBQSxjQUlBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUixDQUpqQixDQUFBOztBQUFBLGFBS0EsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSLENBTGhCLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FFRTtBQUFBLEVBQUEsTUFBQSxFQUFRLFNBQUMsSUFBRCxHQUFBO0FBQ04sUUFBQSx1Q0FBQTtBQUFBLElBRFMsaUJBQUEsV0FBVyx5QkFBQSxpQkFDcEIsQ0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixpQkFBaUIsQ0FBQyxJQUEzQyxDQUFaLENBQUE7V0FDSSxJQUFBLFNBQUEsQ0FBVTtBQUFBLE1BQUUsV0FBQSxTQUFGO0FBQUEsTUFBYSxtQkFBQSxpQkFBYjtLQUFWLEVBRkU7RUFBQSxDQUFSO0FBQUEsRUFLQSx1QkFBQSxFQUF5QixTQUFDLGFBQUQsR0FBQTtBQUN2QixZQUFPLGFBQVA7QUFBQSxXQUNPLFVBRFA7ZUFFSSxrQkFGSjtBQUFBLFdBR08sT0FIUDtlQUlJLGVBSko7QUFBQSxXQUtPLE1BTFA7ZUFNSSxjQU5KO0FBQUE7ZUFRSSxNQUFBLENBQU8sS0FBUCxFQUFlLG1DQUFBLEdBQXRCLGFBQU8sRUFSSjtBQUFBLEtBRHVCO0VBQUEsQ0FMekI7Q0FURixDQUFBOzs7OztBQ0FBLElBQUEsK0dBQUE7O0FBQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxZQUFSLENBQVosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBRFQsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsdUJBQVIsQ0FGckIsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sT0FBQSxDQUFRLGlCQUFSLENBSFAsQ0FBQTs7QUFBQSxHQUlBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBSk4sQ0FBQTs7QUFBQSxNQUtBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBTFQsQ0FBQTs7QUFBQSxnQkFNQSxHQUFtQixPQUFBLENBQVEsK0JBQVIsQ0FObkIsQ0FBQTs7QUFBQSxtQkFPQSxHQUFzQixPQUFBLENBQVEsa0NBQVIsQ0FQdEIsQ0FBQTs7QUFBQSxNQXVCTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLHdCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsUUFBQTtBQUFBLDBCQURZLE9BQW9CLElBQWxCLElBQUMsQ0FBQSxnQkFBQSxVQUFVLFVBQUEsRUFDekIsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFSLEVBQWtCLHlEQUFsQixDQUFBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxvQkFBRCxDQUFBLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFKZCxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsRUFBRCxHQUFNLEVBQUEsSUFBTSxJQUFJLENBQUMsSUFBTCxDQUFBLENBTFosQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQU4zQixDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsSUFBRCxHQUFRLE1BUlIsQ0FBQTtBQUFBLElBU0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxNQVRaLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE1BVmpCLENBRFc7RUFBQSxDQUFiOztBQUFBLDJCQWNBLG9CQUFBLEdBQXNCLFNBQUEsR0FBQTtBQUNwQixRQUFBLG1DQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsVUFBRCxHQUFrQixJQUFBLG1CQUFBLENBQUEsQ0FBbEIsQ0FBQTtBQUVBO0FBQUE7U0FBQSwyQ0FBQTsyQkFBQTtBQUNFLGNBQU8sU0FBUyxDQUFDLElBQWpCO0FBQUEsYUFDTyxXQURQO0FBRUksVUFBQSxJQUFDLENBQUEsZUFBRCxJQUFDLENBQUEsYUFBZSxHQUFoQixDQUFBO0FBQUEsd0JBQ0EsSUFBQyxDQUFBLFVBQVcsQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFaLEdBQWtDLElBQUEsa0JBQUEsQ0FDaEM7QUFBQSxZQUFBLElBQUEsRUFBTSxTQUFTLENBQUMsSUFBaEI7QUFBQSxZQUNBLGVBQUEsRUFBaUIsSUFEakI7V0FEZ0MsRUFEbEMsQ0FGSjtBQUNPO0FBRFAsYUFNTyxVQU5QO0FBQUEsYUFNbUIsT0FObkI7QUFBQSxhQU00QixNQU41QjtBQU9JLFVBQUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLFNBQTFCLENBQUEsQ0FBQTtBQUFBLFVBQ0EsSUFBQyxDQUFBLFlBQUQsSUFBQyxDQUFBLFVBQVksR0FEYixDQUFBO0FBQUEsd0JBRUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxTQUFTLENBQUMsSUFBVixDQUFULEdBQTJCLE9BRjNCLENBUEo7QUFNNEI7QUFONUI7QUFXSSx3QkFBQSxHQUFHLENBQUMsS0FBSixDQUFXLDJCQUFBLEdBQXBCLFNBQVMsQ0FBQyxJQUFVLEdBQTRDLHFDQUF2RCxFQUFBLENBWEo7QUFBQSxPQURGO0FBQUE7b0JBSG9CO0VBQUEsQ0FkdEIsQ0FBQTs7QUFBQSwyQkFpQ0Esd0JBQUEsR0FBMEIsU0FBQyxpQkFBRCxHQUFBO1dBQ3hCLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixnQkFBZ0IsQ0FBQyxNQUFqQixDQUNkO0FBQUEsTUFBQSxTQUFBLEVBQVcsSUFBWDtBQUFBLE1BQ0EsaUJBQUEsRUFBbUIsaUJBRG5CO0tBRGMsQ0FBaEIsRUFEd0I7RUFBQSxDQWpDMUIsQ0FBQTs7QUFBQSwyQkF1Q0EsVUFBQSxHQUFZLFNBQUMsVUFBRCxHQUFBO1dBQ1YsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLElBQXJCLEVBQTJCLFVBQTNCLEVBRFU7RUFBQSxDQXZDWixDQUFBOztBQUFBLDJCQStDQSxNQUFBLEdBQVEsU0FBQyxjQUFELEdBQUE7QUFDTixJQUFBLElBQUcsY0FBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGVBQWUsQ0FBQyxZQUFqQixDQUE4QixJQUE5QixFQUFvQyxjQUFwQyxDQUFBLENBQUE7YUFDQSxLQUZGO0tBQUEsTUFBQTthQUlFLElBQUMsQ0FBQSxTQUpIO0tBRE07RUFBQSxDQS9DUixDQUFBOztBQUFBLDJCQXdEQSxLQUFBLEdBQU8sU0FBQyxjQUFELEdBQUE7QUFDTCxJQUFBLElBQUcsY0FBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGVBQWUsQ0FBQyxXQUFqQixDQUE2QixJQUE3QixFQUFtQyxjQUFuQyxDQUFBLENBQUE7YUFDQSxLQUZGO0tBQUEsTUFBQTthQUlFLElBQUMsQ0FBQSxLQUpIO0tBREs7RUFBQSxDQXhEUCxDQUFBOztBQUFBLDJCQWlFQSxNQUFBLEdBQVEsU0FBQyxhQUFELEVBQWdCLGNBQWhCLEdBQUE7QUFDTixJQUFBLElBQUcsU0FBUyxDQUFDLE1BQVYsS0FBb0IsQ0FBdkI7QUFDRSxNQUFBLGNBQUEsR0FBaUIsYUFBakIsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxXQUQ1QyxDQURGO0tBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxVQUFXLENBQUEsYUFBQSxDQUFjLENBQUMsTUFBM0IsQ0FBa0MsY0FBbEMsQ0FKQSxDQUFBO1dBS0EsS0FOTTtFQUFBLENBakVSLENBQUE7O0FBQUEsMkJBMkVBLE9BQUEsR0FBUyxTQUFDLGFBQUQsRUFBZ0IsY0FBaEIsR0FBQTtBQUNQLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixLQUFvQixDQUF2QjtBQUNFLE1BQUEsY0FBQSxHQUFpQixhQUFqQixDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFdBRDVDLENBREY7S0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQVcsQ0FBQSxhQUFBLENBQWMsQ0FBQyxPQUEzQixDQUFtQyxjQUFuQyxDQUpBLENBQUE7V0FLQSxLQU5PO0VBQUEsQ0EzRVQsQ0FBQTs7QUFBQSwyQkFxRkEsRUFBQSxHQUFJLFNBQUEsR0FBQTtBQUNGLElBQUEsSUFBQyxDQUFBLGVBQWUsQ0FBQyxFQUFqQixDQUFvQixJQUFwQixDQUFBLENBQUE7V0FDQSxLQUZFO0VBQUEsQ0FyRkosQ0FBQTs7QUFBQSwyQkEyRkEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixJQUF0QixDQUFBLENBQUE7V0FDQSxLQUZJO0VBQUEsQ0EzRk4sQ0FBQTs7QUFBQSwyQkFpR0EsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxlQUFlLENBQUMsTUFBakIsQ0FBd0IsSUFBeEIsRUFETTtFQUFBLENBakdSLENBQUE7O0FBQUEsMkJBMEdBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDUixRQUFBLElBQUE7dURBQWdCLENBQUUseUJBRFY7RUFBQSxDQTFHWCxDQUFBOztBQUFBLDJCQThHQSxPQUFBLEdBQVMsU0FBQyxRQUFELEdBQUE7QUFDUCxRQUFBLHdCQUFBO0FBQUEsSUFBQSxjQUFBLEdBQWlCLElBQWpCLENBQUE7QUFDQTtXQUFNLENBQUMsY0FBQSxHQUFpQixjQUFjLENBQUMsU0FBZixDQUFBLENBQWxCLENBQU4sR0FBQTtBQUNFLG9CQUFBLFFBQUEsQ0FBUyxjQUFULEVBQUEsQ0FERjtJQUFBLENBQUE7b0JBRk87RUFBQSxDQTlHVCxDQUFBOztBQUFBLDJCQW9IQSxRQUFBLEdBQVUsU0FBQyxRQUFELEdBQUE7QUFDUixRQUFBLHdEQUFBO0FBQUE7QUFBQTtTQUFBLFlBQUE7c0NBQUE7QUFDRSxNQUFBLGNBQUEsR0FBaUIsa0JBQWtCLENBQUMsS0FBcEMsQ0FBQTtBQUFBOztBQUNBO2VBQU8sY0FBUCxHQUFBO0FBQ0UsVUFBQSxRQUFBLENBQVMsY0FBVCxDQUFBLENBQUE7QUFBQSx5QkFDQSxjQUFBLEdBQWlCLGNBQWMsQ0FBQyxLQURoQyxDQURGO1FBQUEsQ0FBQTs7V0FEQSxDQURGO0FBQUE7b0JBRFE7RUFBQSxDQXBIVixDQUFBOztBQUFBLDJCQTRIQSxXQUFBLEdBQWEsU0FBQyxRQUFELEdBQUE7QUFDWCxRQUFBLHdEQUFBO0FBQUE7QUFBQTtTQUFBLFlBQUE7c0NBQUE7QUFDRSxNQUFBLGNBQUEsR0FBaUIsa0JBQWtCLENBQUMsS0FBcEMsQ0FBQTtBQUFBOztBQUNBO2VBQU8sY0FBUCxHQUFBO0FBQ0UsVUFBQSxRQUFBLENBQVMsY0FBVCxDQUFBLENBQUE7QUFBQSxVQUNBLGNBQWMsQ0FBQyxXQUFmLENBQTJCLFFBQTNCLENBREEsQ0FBQTtBQUFBLHlCQUVBLGNBQUEsR0FBaUIsY0FBYyxDQUFDLEtBRmhDLENBREY7UUFBQSxDQUFBOztXQURBLENBREY7QUFBQTtvQkFEVztFQUFBLENBNUhiLENBQUE7O0FBQUEsMkJBcUlBLGtCQUFBLEdBQW9CLFNBQUMsUUFBRCxHQUFBO0FBQ2xCLElBQUEsUUFBQSxDQUFTLElBQVQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxRQUFiLEVBRmtCO0VBQUEsQ0FySXBCLENBQUE7O0FBQUEsMkJBMklBLG9CQUFBLEdBQXNCLFNBQUMsUUFBRCxHQUFBO1dBQ3BCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFDLGNBQUQsR0FBQTtBQUNsQixVQUFBLHdDQUFBO0FBQUE7QUFBQTtXQUFBLFlBQUE7d0NBQUE7QUFDRSxzQkFBQSxRQUFBLENBQVMsa0JBQVQsRUFBQSxDQURGO0FBQUE7c0JBRGtCO0lBQUEsQ0FBcEIsRUFEb0I7RUFBQSxDQTNJdEIsQ0FBQTs7QUFBQSwyQkFrSkEsY0FBQSxHQUFnQixTQUFDLFFBQUQsR0FBQTtXQUNkLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxjQUFELEdBQUE7QUFDbEIsWUFBQSx3Q0FBQTtBQUFBLFFBQUEsSUFBNEIsY0FBQSxLQUFrQixLQUE5QztBQUFBLFVBQUEsUUFBQSxDQUFTLGNBQVQsQ0FBQSxDQUFBO1NBQUE7QUFDQTtBQUFBO2FBQUEsWUFBQTswQ0FBQTtBQUNFLHdCQUFBLFFBQUEsQ0FBUyxrQkFBVCxFQUFBLENBREY7QUFBQTt3QkFGa0I7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFwQixFQURjO0VBQUEsQ0FsSmhCLENBQUE7O0FBQUEsMkJBeUpBLGVBQUEsR0FBaUIsU0FBQyxRQUFELEdBQUE7QUFDZixJQUFBLFFBQUEsQ0FBUyxJQUFULENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsUUFBVixFQUZlO0VBQUEsQ0F6SmpCLENBQUE7O0FBQUEsMkJBb0tBLGFBQUEsR0FBZSxTQUFBLEdBQUE7V0FDYixJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBa0IsV0FBbEIsQ0FBQSxHQUFpQyxFQURwQjtFQUFBLENBcEtmLENBQUE7O0FBQUEsMkJBd0tBLFlBQUEsR0FBYyxTQUFBLEdBQUE7V0FDWixJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBa0IsVUFBbEIsQ0FBQSxHQUFnQyxFQURwQjtFQUFBLENBeEtkLENBQUE7O0FBQUEsMkJBNEtBLE9BQUEsR0FBUyxTQUFBLEdBQUE7V0FDUCxJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBa0IsTUFBbEIsQ0FBQSxHQUE0QixFQURyQjtFQUFBLENBNUtULENBQUE7O0FBQUEsMkJBZ0xBLFNBQUEsR0FBVyxTQUFBLEdBQUE7V0FDVCxJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBa0IsT0FBbEIsQ0FBQSxHQUE2QixFQURwQjtFQUFBLENBaExYLENBQUE7O0FBQUEsMkJBcUxBLFVBQUEsR0FBWSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDVixJQUFBLElBQUcsQ0FBQSxLQUFIO0FBQ0UsTUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFaO0FBQ0UsUUFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixNQUFqQixDQUFBO0FBQ0EsUUFBQSxJQUE4QyxJQUFDLENBQUEsYUFBL0M7aUJBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxlQUFmLENBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBQUE7U0FGRjtPQURGO0tBQUEsTUFJSyxJQUFHLE1BQUEsQ0FBQSxLQUFBLEtBQWdCLFFBQW5CO0FBQ0gsTUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQSxDQUFULEtBQWtCLEtBQXJCO0FBQ0UsUUFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixLQUFqQixDQUFBO0FBQ0EsUUFBQSxJQUE4QyxJQUFDLENBQUEsYUFBL0M7aUJBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxlQUFmLENBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBQUE7U0FGRjtPQURHO0tBQUEsTUFBQTtBQUtILE1BQUEsSUFBRyxDQUFBLFNBQUksQ0FBVSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBbkIsRUFBMEIsS0FBMUIsQ0FBUDtBQUNFLFFBQUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLENBQVQsR0FBaUIsS0FBakIsQ0FBQTtBQUNBLFFBQUEsSUFBOEMsSUFBQyxDQUFBLGFBQS9DO2lCQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsZUFBZixDQUErQixJQUEvQixFQUFxQyxJQUFyQyxFQUFBO1NBRkY7T0FMRztLQUxLO0VBQUEsQ0FyTFosQ0FBQTs7QUFBQSwyQkFvTUEsR0FBQSxHQUFLLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNILFFBQUEsZUFBQTtBQUFBLElBQUEsTUFBQSxxQ0FBZSxDQUFFLGNBQVYsQ0FBeUIsSUFBekIsVUFBUCxFQUNHLGFBQUEsR0FBTixJQUFDLENBQUEsYUFBSyxHQUE4Qix3QkFBOUIsR0FBTixJQURHLENBQUEsQ0FBQTtBQUFBLElBR0EsU0FBQSxHQUFZLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFoQixDQUhaLENBQUE7QUFJQSxJQUFBLElBQUcsU0FBUyxDQUFDLE9BQWI7QUFDRSxNQUFBLElBQUcsU0FBUyxDQUFDLFdBQVYsQ0FBQSxDQUFBLEtBQTJCLEtBQTlCO0FBQ0UsUUFBQSxTQUFTLENBQUMsV0FBVixDQUFzQixLQUF0QixDQUFBLENBQUE7QUFDQSxRQUFBLElBQThDLElBQUMsQ0FBQSxhQUEvQztpQkFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLGVBQWYsQ0FBK0IsSUFBL0IsRUFBcUMsSUFBckMsRUFBQTtTQUZGO09BREY7S0FBQSxNQUFBO2FBS0UsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLEtBQWxCLEVBTEY7S0FMRztFQUFBLENBcE1MLENBQUE7O0FBQUEsMkJBaU5BLEdBQUEsR0FBSyxTQUFDLElBQUQsR0FBQTtBQUNILFFBQUEsSUFBQTtBQUFBLElBQUEsTUFBQSxxQ0FBZSxDQUFFLGNBQVYsQ0FBeUIsSUFBekIsVUFBUCxFQUNHLGFBQUEsR0FBTixJQUFDLENBQUEsYUFBSyxHQUE4Qix3QkFBOUIsR0FBTixJQURHLENBQUEsQ0FBQTtXQUdBLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFoQixDQUFxQixDQUFDLFVBQXRCLENBQUEsRUFKRztFQUFBLENBak5MLENBQUE7O0FBQUEsMkJBeU5BLE9BQUEsR0FBUyxTQUFDLElBQUQsR0FBQTtBQUNQLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxDQUFSLENBQUE7V0FDQSxLQUFBLEtBQVMsTUFBVCxJQUFzQixLQUFBLEtBQVMsR0FGeEI7RUFBQSxDQXpOVCxDQUFBOztBQUFBLDJCQXFPQSxJQUFBLEdBQU0sU0FBQyxHQUFELEdBQUE7QUFDSixRQUFBLGtDQUFBO0FBQUEsSUFBQSxJQUFHLE1BQUEsQ0FBQSxHQUFBLEtBQWUsUUFBbEI7QUFDRSxNQUFBLHFCQUFBLEdBQXdCLEVBQXhCLENBQUE7QUFDQSxXQUFBLFdBQUE7MEJBQUE7QUFDRSxRQUFBLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLEtBQWxCLENBQUg7QUFDRSxVQUFBLHFCQUFxQixDQUFDLElBQXRCLENBQTJCLElBQTNCLENBQUEsQ0FERjtTQURGO0FBQUEsT0FEQTtBQUlBLE1BQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxJQUFrQixxQkFBcUIsQ0FBQyxNQUF0QixHQUErQixDQUFwRDtlQUNFLElBQUMsQ0FBQSxhQUFhLENBQUMsWUFBZixDQUE0QixJQUE1QixFQUFrQyxxQkFBbEMsRUFERjtPQUxGO0tBQUEsTUFBQTthQVFFLElBQUMsQ0FBQSxVQUFXLENBQUEsR0FBQSxFQVJkO0tBREk7RUFBQSxDQXJPTixDQUFBOztBQUFBLDJCQWtQQSxVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sS0FBUCxHQUFBO0FBQ1YsSUFBQSxJQUFHLENBQUEsU0FBSSxDQUFVLElBQUMsQ0FBQSxVQUFXLENBQUEsSUFBQSxDQUF0QixFQUE2QixLQUE3QixDQUFQO0FBQ0UsTUFBQSxJQUFDLENBQUEsVUFBVyxDQUFBLElBQUEsQ0FBWixHQUFvQixLQUFwQixDQUFBO2FBQ0EsS0FGRjtLQUFBLE1BQUE7YUFJRSxNQUpGO0tBRFU7RUFBQSxDQWxQWixDQUFBOztBQUFBLDJCQTZQQSxRQUFBLEdBQVUsU0FBQyxJQUFELEdBQUE7V0FDUixJQUFDLENBQUEsTUFBTyxDQUFBLElBQUEsRUFEQTtFQUFBLENBN1BWLENBQUE7O0FBQUEsMkJBaVFBLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUixRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQU8sQ0FBQSxJQUFBLENBQXpCLENBQUE7QUFDQSxJQUFBLElBQUcsQ0FBQSxLQUFIO2FBQ0UsR0FBRyxDQUFDLElBQUosQ0FBVSxpQkFBQSxHQUFmLElBQWUsR0FBd0Isc0JBQXhCLEdBQWYsSUFBQyxDQUFBLGFBQUksRUFERjtLQUFBLE1BRUssSUFBRyxDQUFBLEtBQVMsQ0FBQyxhQUFOLENBQW9CLEtBQXBCLENBQVA7YUFDSCxHQUFHLENBQUMsSUFBSixDQUFVLGlCQUFBLEdBQWYsS0FBZSxHQUF5QixlQUF6QixHQUFmLElBQWUsR0FBK0Msc0JBQS9DLEdBQWYsSUFBQyxDQUFBLGFBQUksRUFERztLQUFBLE1BQUE7QUFHSCxNQUFBLElBQUcsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFBLENBQVIsS0FBaUIsS0FBcEI7QUFDRSxRQUFBLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQSxDQUFSLEdBQWdCLEtBQWhCLENBQUE7QUFDQSxRQUFBLElBQUcsSUFBQyxDQUFBLGFBQUo7aUJBQ0UsSUFBQyxDQUFBLGFBQWEsQ0FBQyxZQUFmLENBQTRCLElBQTVCLEVBQWtDLE9BQWxDLEVBQTJDO0FBQUEsWUFBRSxNQUFBLElBQUY7QUFBQSxZQUFRLE9BQUEsS0FBUjtXQUEzQyxFQURGO1NBRkY7T0FIRztLQUpHO0VBQUEsQ0FqUVYsQ0FBQTs7QUFBQSwyQkFnUkEsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNMLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSwrRUFBWixDQUFBLENBQUE7QUFDQSxJQUFBLElBQUcsU0FBUyxDQUFDLE1BQVYsS0FBb0IsQ0FBdkI7YUFDRSxJQUFDLENBQUEsTUFBTyxDQUFBLElBQUEsRUFEVjtLQUFBLE1BQUE7YUFHRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFIRjtLQUZLO0VBQUEsQ0FoUlAsQ0FBQTs7QUFBQSwyQkEyUkEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLEdBQUcsQ0FBQyxJQUFKLENBQVMsK0NBQVQsRUFESTtFQUFBLENBM1JOLENBQUE7O0FBQUEsMkJBb1NBLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTtXQUNsQixJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVYsQ0FBQSxFQURrQjtFQUFBLENBcFNwQixDQUFBOztBQUFBLDJCQXlTQSxPQUFBLEdBQVMsU0FBQSxHQUFBLENBelNULENBQUE7O3dCQUFBOztJQXpCRixDQUFBOzs7OztBQ0FBLElBQUEsc0VBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxTQUNBLEdBQVksT0FBQSxDQUFRLFlBQVIsQ0FEWixDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FGVCxDQUFBOztBQUFBLElBR0EsR0FBTyxPQUFBLENBQVEsaUJBQVIsQ0FIUCxDQUFBOztBQUFBLEdBSUEsR0FBTSxPQUFBLENBQVEsd0JBQVIsQ0FKTixDQUFBOztBQUFBLE1BS0EsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FMVCxDQUFBOztBQUFBLGNBTUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSLENBTmpCLENBQUE7O0FBQUEsYUFPQSxHQUFnQixPQUFBLENBQVEsMEJBQVIsQ0FQaEIsQ0FBQTs7QUFBQSxNQVNNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtBQWdCbEIsRUFBQSxjQUFjLENBQUEsU0FBRSxDQUFBLE1BQWhCLEdBQXlCLFNBQUMsU0FBRCxHQUFBO0FBQ3ZCLFFBQUEsVUFBQTs7TUFBQSxZQUFhO0tBQWI7QUFBQSxJQUVBLElBQUEsR0FDRTtBQUFBLE1BQUEsRUFBQSxFQUFJLFNBQVMsQ0FBQyxFQUFkO0FBQUEsTUFDQSxVQUFBLEVBQVksU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUQvQjtLQUhGLENBQUE7QUFNQSxJQUFBLElBQUEsQ0FBQSxhQUFvQixDQUFDLE9BQWQsQ0FBc0IsU0FBUyxDQUFDLE9BQWhDLENBQVA7QUFDRSxNQUFBLElBQUksQ0FBQyxPQUFMLEdBQWUsYUFBYSxDQUFDLFFBQWQsQ0FBdUIsU0FBUyxDQUFDLE9BQWpDLENBQWYsQ0FERjtLQU5BO0FBU0EsSUFBQSxJQUFBLENBQUEsYUFBb0IsQ0FBQyxPQUFkLENBQXNCLFNBQVMsQ0FBQyxNQUFoQyxDQUFQO0FBQ0UsTUFBQSxJQUFJLENBQUMsTUFBTCxHQUFjLGFBQWEsQ0FBQyxRQUFkLENBQXVCLFNBQVMsQ0FBQyxNQUFqQyxDQUFkLENBREY7S0FUQTtBQVlBLElBQUEsSUFBQSxDQUFBLGFBQW9CLENBQUMsT0FBZCxDQUFzQixTQUFTLENBQUMsVUFBaEMsQ0FBUDtBQUNFLE1BQUEsSUFBSSxDQUFDLElBQUwsR0FBWSxDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFBZSxFQUFmLEVBQW1CLFNBQVMsQ0FBQyxVQUE3QixDQUFaLENBREY7S0FaQTtBQWdCQSxTQUFBLDRCQUFBLEdBQUE7QUFDRSxNQUFBLElBQUksQ0FBQyxlQUFMLElBQUksQ0FBQyxhQUFlLEdBQXBCLENBQUE7QUFBQSxNQUNBLElBQUksQ0FBQyxVQUFXLENBQUEsSUFBQSxDQUFoQixHQUF3QixFQUR4QixDQURGO0FBQUEsS0FoQkE7V0FvQkEsS0FyQnVCO0VBQUEsQ0FBekIsQ0FBQTtTQXdCQTtBQUFBLElBQUEsUUFBQSxFQUFVLFNBQUMsSUFBRCxFQUFPLE1BQVAsR0FBQTtBQUNSLFVBQUEsMkdBQUE7QUFBQSxNQUFBLFFBQUEsR0FBVyxNQUFNLENBQUMsR0FBUCxDQUFXLElBQUksQ0FBQyxTQUFMLElBQWtCLElBQUksQ0FBQyxVQUFsQyxDQUFYLENBQUE7QUFBQSxNQUVBLE1BQUEsQ0FBTyxRQUFQLEVBQ0csb0VBQUEsR0FBTixJQUFJLENBQUMsVUFBQyxHQUFzRixHQUR6RixDQUZBLENBQUE7QUFBQSxNQUtBLEtBQUEsR0FBWSxJQUFBLGNBQUEsQ0FBZTtBQUFBLFFBQUUsVUFBQSxRQUFGO0FBQUEsUUFBWSxFQUFBLEVBQUksSUFBSSxDQUFDLEVBQXJCO09BQWYsQ0FMWixDQUFBO0FBT0E7QUFBQSxXQUFBLFlBQUE7MkJBQUE7QUFDRSxRQUFBLE1BQUEsQ0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWQsQ0FBNkIsSUFBN0IsQ0FBUCxFQUNHLHNDQUFBLEdBQVIsS0FBSyxDQUFDLGFBQUUsR0FBNEQscUJBQTVELEdBQVIsSUFBUSxHQUF3RixHQUQzRixDQUFBLENBQUE7QUFJQSxRQUFBLElBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFqQixDQUFxQixJQUFyQixDQUEwQixDQUFDLElBQTNCLEtBQW1DLE9BQW5DLElBQThDLE1BQUEsQ0FBQSxLQUFBLEtBQWdCLFFBQWpFO0FBQ0UsVUFBQSxLQUFLLENBQUMsT0FBUSxDQUFBLElBQUEsQ0FBZCxHQUNFO0FBQUEsWUFBQSxHQUFBLEVBQUssS0FBTDtXQURGLENBREY7U0FBQSxNQUFBO0FBSUUsVUFBQSxLQUFLLENBQUMsT0FBUSxDQUFBLElBQUEsQ0FBZCxHQUFzQixLQUF0QixDQUpGO1NBTEY7QUFBQSxPQVBBO0FBa0JBO0FBQUEsV0FBQSxrQkFBQTtpQ0FBQTtBQUNFLFFBQUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxTQUFmLEVBQTBCLEtBQTFCLENBQUEsQ0FERjtBQUFBLE9BbEJBO0FBcUJBLE1BQUEsSUFBeUIsSUFBSSxDQUFDLElBQTlCO0FBQUEsUUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxJQUFoQixDQUFBLENBQUE7T0FyQkE7QUF1QkE7QUFBQSxXQUFBLHNCQUFBOzhDQUFBO0FBQ0UsUUFBQSxNQUFBLENBQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxjQUFqQixDQUFnQyxhQUFoQyxDQUFQLEVBQ0cseURBQUEsR0FBUixhQURLLENBQUEsQ0FBQTtBQUdBLFFBQUEsSUFBRyxjQUFIO0FBQ0UsVUFBQSxNQUFBLENBQU8sQ0FBQyxDQUFDLE9BQUYsQ0FBVSxjQUFWLENBQVAsRUFDRyw4REFBQSxHQUFWLGFBRE8sQ0FBQSxDQUFBO0FBRUEsZUFBQSxxREFBQTt1Q0FBQTtBQUNFLFlBQUEsS0FBSyxDQUFDLE1BQU4sQ0FBYyxhQUFkLEVBQTZCLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixFQUFpQixNQUFqQixDQUE3QixDQUFBLENBREY7QUFBQSxXQUhGO1NBSkY7QUFBQSxPQXZCQTthQWlDQSxNQWxDUTtJQUFBLENBQVY7SUF4Q2tCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FUakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLHNHQUFBO0VBQUEsa0JBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsdUJBQVIsQ0FGckIsQ0FBQTs7QUFBQSxjQUdBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUixDQUhqQixDQUFBOztBQUFBLGNBSUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSLENBSmpCLENBQUE7O0FBQUEsd0JBS0EsR0FBMkIsT0FBQSxDQUFRLDhCQUFSLENBTDNCLENBQUE7O0FBQUEsTUFpQ00sQ0FBQyxPQUFQLEdBQXVCO0FBR1IsRUFBQSx1QkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLGFBQUE7QUFBQSwwQkFEWSxPQUF1QixJQUFyQixlQUFBLFNBQVMsSUFBQyxDQUFBLGNBQUEsTUFDeEIsQ0FBQTtBQUFBLElBQUEsTUFBQSxDQUFPLG1CQUFQLEVBQWlCLDhEQUFqQixDQUFBLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxJQUFELEdBQVksSUFBQSxrQkFBQSxDQUFtQjtBQUFBLE1BQUEsTUFBQSxFQUFRLElBQVI7S0FBbkIsQ0FEWixDQUFBO0FBS0EsSUFBQSxJQUErQixlQUEvQjtBQUFBLE1BQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWLEVBQW1CLElBQUMsQ0FBQSxNQUFwQixDQUFBLENBQUE7S0FMQTtBQUFBLElBT0EsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFOLEdBQXNCLElBUHRCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLENBUkEsQ0FEVztFQUFBLENBQWI7O0FBQUEsMEJBY0EsT0FBQSxHQUFTLFNBQUMsU0FBRCxHQUFBO0FBQ1AsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLENBQVosQ0FBQTtBQUNBLElBQUEsSUFBNEIsaUJBQTVCO0FBQUEsTUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYyxTQUFkLENBQUEsQ0FBQTtLQURBO1dBRUEsS0FITztFQUFBLENBZFQsQ0FBQTs7QUFBQSwwQkFzQkEsTUFBQSxHQUFRLFNBQUMsU0FBRCxHQUFBO0FBQ04sSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLENBQVosQ0FBQTtBQUNBLElBQUEsSUFBMkIsaUJBQTNCO0FBQUEsTUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxTQUFiLENBQUEsQ0FBQTtLQURBO1dBRUEsS0FITTtFQUFBLENBdEJSLENBQUE7O0FBQUEsMEJBNEJBLFlBQUEsR0FBYyxTQUFDLGFBQUQsR0FBQTtBQUNaLElBQUEsSUFBRyxNQUFBLENBQUEsYUFBQSxLQUF3QixRQUEzQjthQUNFLElBQUMsQ0FBQSxlQUFELENBQWlCLGFBQWpCLEVBREY7S0FBQSxNQUFBO2FBR0UsY0FIRjtLQURZO0VBQUEsQ0E1QmQsQ0FBQTs7QUFBQSwwQkFtQ0EsZUFBQSxHQUFpQixTQUFDLGFBQUQsR0FBQTtBQUNmLFFBQUEsUUFBQTtBQUFBLElBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxXQUFELENBQWEsYUFBYixDQUFYLENBQUE7QUFDQSxJQUFBLElBQTBCLFFBQTFCO2FBQUEsUUFBUSxDQUFDLFdBQVQsQ0FBQSxFQUFBO0tBRmU7RUFBQSxDQW5DakIsQ0FBQTs7QUFBQSwwQkF3Q0EsV0FBQSxHQUFhLFNBQUMsYUFBRCxHQUFBO0FBQ1gsUUFBQSxRQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksYUFBWixDQUFYLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQWtCLDBCQUFBLEdBQXJCLGFBQUcsQ0FEQSxDQUFBO1dBRUEsU0FIVztFQUFBLENBeENiLENBQUE7O0FBQUEsMEJBOENBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtBQUdoQixJQUFBLElBQUMsQ0FBQSxjQUFELEdBQWtCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FBbEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FEcEIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGNBQUQsR0FBa0IsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUZsQixDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsdUJBQUQsR0FBMkIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUwzQixDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQU54QixDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsd0JBQUQsR0FBNEIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQVA1QixDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQVJ4QixDQUFBO1dBVUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLENBQUMsU0FBRixDQUFBLEVBYks7RUFBQSxDQTlDbEIsQ0FBQTs7QUFBQSwwQkErREEsSUFBQSxHQUFNLFNBQUMsUUFBRCxHQUFBO1dBQ0osSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsUUFBWCxFQURJO0VBQUEsQ0EvRE4sQ0FBQTs7QUFBQSwwQkFtRUEsYUFBQSxHQUFlLFNBQUMsUUFBRCxHQUFBO1dBQ2IsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFOLENBQW9CLFFBQXBCLEVBRGE7RUFBQSxDQW5FZixDQUFBOztBQUFBLDBCQXdFQSxLQUFBLEdBQU8sU0FBQSxHQUFBO1dBQ0wsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUREO0VBQUEsQ0F4RVAsQ0FBQTs7QUFBQSwwQkE2RUEsR0FBQSxHQUFLLFNBQUMsUUFBRCxHQUFBO1dBQ0gsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENBQVUsUUFBVixFQURHO0VBQUEsQ0E3RUwsQ0FBQTs7QUFBQSwwQkFpRkEsSUFBQSxHQUFNLFNBQUMsTUFBRCxHQUFBO0FBQ0osUUFBQSxHQUFBO0FBQUEsSUFBQSxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBQ0UsTUFBQSxHQUFBLEdBQU0sRUFBTixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsU0FBRCxHQUFBO0FBQ0osUUFBQSxJQUFHLFNBQVMsQ0FBQyxhQUFWLEtBQTJCLE1BQTlCO2lCQUNFLEdBQUcsQ0FBQyxJQUFKLENBQVMsU0FBVCxFQURGO1NBREk7TUFBQSxDQUFOLENBREEsQ0FBQTthQUtJLElBQUEsY0FBQSxDQUFlLEdBQWYsRUFOTjtLQUFBLE1BQUE7YUFRTSxJQUFBLGNBQUEsQ0FBQSxFQVJOO0tBREk7RUFBQSxDQWpGTixDQUFBOztBQUFBLDBCQTZGQSxNQUFBLEdBQVEsU0FBQSxHQUFBO0FBQ04sUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQU4sR0FBc0IsTUFBdEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTthQUNKLFNBQVMsQ0FBQyxhQUFWLEdBQTBCLE9BRHRCO0lBQUEsQ0FBTixDQURBLENBQUE7QUFBQSxJQUlBLE9BQUEsR0FBVSxJQUFDLENBQUEsSUFKWCxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsSUFBRCxHQUFZLElBQUEsa0JBQUEsQ0FBbUI7QUFBQSxNQUFBLE1BQUEsRUFBUSxJQUFSO0tBQW5CLENBTFosQ0FBQTtXQU9BLFFBUk07RUFBQSxDQTdGUixDQUFBOztBQUFBLDBCQXdIQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsUUFBQSx1QkFBQTtBQUFBLElBQUEsTUFBQSxHQUFTLDhCQUFULENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxXQUFQLEdBQUE7O1FBQU8sY0FBYztPQUM3QjthQUFBLE1BQUEsSUFBVSxFQUFBLEdBQUUsQ0FBakIsS0FBQSxDQUFNLFdBQUEsR0FBYyxDQUFwQixDQUFzQixDQUFDLElBQXZCLENBQTRCLEdBQTVCLENBQWlCLENBQUYsR0FBZixJQUFlLEdBQStDLEtBRGpEO0lBQUEsQ0FGVixDQUFBO0FBQUEsSUFLQSxNQUFBLEdBQVMsU0FBQyxTQUFELEVBQVksV0FBWixHQUFBO0FBQ1AsVUFBQSx3Q0FBQTs7UUFEbUIsY0FBYztPQUNqQztBQUFBLE1BQUEsUUFBQSxHQUFXLFNBQVMsQ0FBQyxRQUFyQixDQUFBO0FBQUEsTUFDQSxPQUFBLENBQVMsSUFBQSxHQUFkLFFBQVEsQ0FBQyxLQUFLLEdBQXFCLElBQXJCLEdBQWQsUUFBUSxDQUFDLElBQUssR0FBeUMsR0FBbEQsRUFBc0QsV0FBdEQsQ0FEQSxDQUFBO0FBSUE7QUFBQSxXQUFBLFlBQUE7d0NBQUE7QUFDRSxRQUFBLE9BQUEsQ0FBUSxFQUFBLEdBQWYsSUFBZSxHQUFVLEdBQWxCLEVBQXNCLFdBQUEsR0FBYyxDQUFwQyxDQUFBLENBQUE7QUFDQSxRQUFBLElBQXFELGtCQUFrQixDQUFDLEtBQXhFO0FBQUEsVUFBQSxNQUFBLENBQU8sa0JBQWtCLENBQUMsS0FBMUIsRUFBaUMsV0FBQSxHQUFjLENBQS9DLENBQUEsQ0FBQTtTQUZGO0FBQUEsT0FKQTtBQVNBLE1BQUEsSUFBdUMsU0FBUyxDQUFDLElBQWpEO2VBQUEsTUFBQSxDQUFPLFNBQVMsQ0FBQyxJQUFqQixFQUF1QixXQUF2QixFQUFBO09BVk87SUFBQSxDQUxULENBQUE7QUFpQkEsSUFBQSxJQUF1QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQTdCO0FBQUEsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFiLENBQUEsQ0FBQTtLQWpCQTtBQWtCQSxXQUFPLE1BQVAsQ0FuQks7RUFBQSxDQXhIUCxDQUFBOztBQUFBLDBCQW1KQSxrQkFBQSxHQUFvQixTQUFDLFNBQUQsRUFBWSxtQkFBWixHQUFBO0FBQ2xCLElBQUEsSUFBRyxTQUFTLENBQUMsYUFBVixLQUEyQixJQUE5QjtBQUVFLE1BQUEsbUJBQUEsQ0FBQSxDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLGdCQUFYLEVBQTZCLFNBQTdCLEVBSEY7S0FBQSxNQUFBO0FBS0UsTUFBQSxJQUFHLCtCQUFIO0FBQ0UsUUFBQSxTQUFTLENBQUMsTUFBVixDQUFBLENBQUEsQ0FERjtPQUFBO0FBQUEsTUFHQSxTQUFTLENBQUMsa0JBQVYsQ0FBNkIsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsVUFBRCxHQUFBO2lCQUMzQixVQUFVLENBQUMsYUFBWCxHQUEyQixNQURBO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0IsQ0FIQSxDQUFBO0FBQUEsTUFNQSxtQkFBQSxDQUFBLENBTkEsQ0FBQTthQU9BLElBQUMsQ0FBQSxTQUFELENBQVcsZ0JBQVgsRUFBNkIsU0FBN0IsRUFaRjtLQURrQjtFQUFBLENBbkpwQixDQUFBOztBQUFBLDBCQW1LQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsUUFBQSxXQUFBO0FBQUEsSUFEVSxzQkFBTyw4REFDakIsQ0FBQTtBQUFBLElBQUEsSUFBSyxDQUFBLEtBQUEsQ0FBTSxDQUFDLElBQUksQ0FBQyxLQUFqQixDQUF1QixLQUF2QixFQUE4QixJQUE5QixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBQSxFQUZTO0VBQUEsQ0FuS1gsQ0FBQTs7QUFBQSwwQkF3S0Esa0JBQUEsR0FBb0IsU0FBQyxTQUFELEVBQVksbUJBQVosR0FBQTtBQUNsQixJQUFBLE1BQUEsQ0FBTyxTQUFTLENBQUMsYUFBVixLQUEyQixJQUFsQyxFQUNFLG9EQURGLENBQUEsQ0FBQTtBQUFBLElBR0EsU0FBUyxDQUFDLGtCQUFWLENBQTZCLFNBQUMsV0FBRCxHQUFBO2FBQzNCLFdBQVcsQ0FBQyxhQUFaLEdBQTRCLE9BREQ7SUFBQSxDQUE3QixDQUhBLENBQUE7QUFBQSxJQU1BLG1CQUFBLENBQUEsQ0FOQSxDQUFBO1dBT0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxrQkFBWCxFQUErQixTQUEvQixFQVJrQjtFQUFBLENBeEtwQixDQUFBOztBQUFBLDBCQW1MQSxlQUFBLEdBQWlCLFNBQUMsU0FBRCxHQUFBO1dBQ2YsSUFBQyxDQUFBLFNBQUQsQ0FBVyx5QkFBWCxFQUFzQyxTQUF0QyxFQURlO0VBQUEsQ0FuTGpCLENBQUE7O0FBQUEsMEJBdUxBLFlBQUEsR0FBYyxTQUFDLFNBQUQsR0FBQTtXQUNaLElBQUMsQ0FBQSxTQUFELENBQVcsc0JBQVgsRUFBbUMsU0FBbkMsRUFEWTtFQUFBLENBdkxkLENBQUE7O0FBQUEsMEJBMkxBLFlBQUEsR0FBYyxTQUFDLFNBQUQsRUFBWSxpQkFBWixHQUFBO1dBQ1osSUFBQyxDQUFBLFNBQUQsQ0FBVyxzQkFBWCxFQUFtQyxTQUFuQyxFQUE4QyxpQkFBOUMsRUFEWTtFQUFBLENBM0xkLENBQUE7O0FBQUEsMEJBa01BLFNBQUEsR0FBVyxTQUFBLEdBQUE7V0FDVCxLQUFLLENBQUMsWUFBTixDQUFtQixJQUFDLENBQUEsTUFBRCxDQUFBLENBQW5CLEVBRFM7RUFBQSxDQWxNWCxDQUFBOztBQUFBLDBCQXdNQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsUUFBQSw2QkFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLEVBQVAsQ0FBQTtBQUFBLElBQ0EsSUFBSyxDQUFBLFNBQUEsQ0FBTCxHQUFrQixFQURsQixDQUFBO0FBQUEsSUFFQSxJQUFLLENBQUEsUUFBQSxDQUFMLEdBQWlCO0FBQUEsTUFBRSxJQUFBLEVBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFoQjtLQUZqQixDQUFBO0FBQUEsSUFJQSxlQUFBLEdBQWtCLFNBQUMsU0FBRCxFQUFZLEtBQVosRUFBbUIsY0FBbkIsR0FBQTtBQUNoQixVQUFBLGFBQUE7QUFBQSxNQUFBLGFBQUEsR0FBZ0IsU0FBUyxDQUFDLE1BQVYsQ0FBQSxDQUFoQixDQUFBO0FBQUEsTUFDQSxjQUFjLENBQUMsSUFBZixDQUFvQixhQUFwQixDQURBLENBQUE7YUFFQSxjQUhnQjtJQUFBLENBSmxCLENBQUE7QUFBQSxJQVNBLE1BQUEsR0FBUyxTQUFDLFNBQUQsRUFBWSxLQUFaLEVBQW1CLE9BQW5CLEdBQUE7QUFDUCxVQUFBLDZEQUFBO0FBQUEsTUFBQSxhQUFBLEdBQWdCLGVBQUEsQ0FBZ0IsU0FBaEIsRUFBMkIsS0FBM0IsRUFBa0MsT0FBbEMsQ0FBaEIsQ0FBQTtBQUdBO0FBQUEsV0FBQSxZQUFBO3dDQUFBO0FBQ0UsUUFBQSxjQUFBLEdBQWlCLGFBQWEsQ0FBQyxVQUFXLENBQUEsa0JBQWtCLENBQUMsSUFBbkIsQ0FBekIsR0FBb0QsRUFBckUsQ0FBQTtBQUNBLFFBQUEsSUFBK0Qsa0JBQWtCLENBQUMsS0FBbEY7QUFBQSxVQUFBLE1BQUEsQ0FBTyxrQkFBa0IsQ0FBQyxLQUExQixFQUFpQyxLQUFBLEdBQVEsQ0FBekMsRUFBNEMsY0FBNUMsQ0FBQSxDQUFBO1NBRkY7QUFBQSxPQUhBO0FBUUEsTUFBQSxJQUEwQyxTQUFTLENBQUMsSUFBcEQ7ZUFBQSxNQUFBLENBQU8sU0FBUyxDQUFDLElBQWpCLEVBQXVCLEtBQXZCLEVBQThCLE9BQTlCLEVBQUE7T0FUTztJQUFBLENBVFQsQ0FBQTtBQW9CQSxJQUFBLElBQTJDLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBakQ7QUFBQSxNQUFBLE1BQUEsQ0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUIsSUFBSyxDQUFBLFNBQUEsQ0FBNUIsQ0FBQSxDQUFBO0tBcEJBO1dBc0JBLEtBdkJTO0VBQUEsQ0F4TVgsQ0FBQTs7QUFBQSwwQkF1T0EsUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLE1BQVAsRUFBZSxNQUFmLEdBQUE7QUFDUixRQUFBLHdDQUFBOztNQUR1QixTQUFPO0tBQzlCO0FBQUEsSUFBQSxJQUFHLGNBQUg7QUFDRSxNQUFBLE1BQUEsQ0FBVyxxQkFBSixJQUFnQixNQUFNLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxNQUFmLENBQXZCLEVBQStDLHFGQUEvQyxDQUFBLENBREY7S0FBQSxNQUFBO0FBR0UsTUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLE1BQVYsQ0FIRjtLQUFBO0FBS0EsSUFBQSxJQUFHLE1BQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBTixHQUFzQixNQUF0QixDQURGO0tBTEE7QUFRQSxJQUFBLElBQUcsSUFBSSxDQUFDLE9BQVI7QUFDRTtBQUFBLFdBQUEsMkNBQUE7aUNBQUE7QUFDRSxRQUFBLFNBQUEsR0FBWSx3QkFBd0IsQ0FBQyxRQUF6QixDQUFrQyxhQUFsQyxFQUFpRCxNQUFqRCxDQUFaLENBQUE7QUFBQSxRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQWIsQ0FEQSxDQURGO0FBQUEsT0FERjtLQVJBO0FBYUEsSUFBQSxJQUFHLE1BQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBTixHQUFzQixJQUF0QixDQUFBO2FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsU0FBRCxHQUFBO2lCQUNULFNBQVMsQ0FBQyxhQUFWLEdBQTBCLE1BRGpCO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxFQUZGO0tBZFE7RUFBQSxDQXZPVixDQUFBOztBQUFBLDBCQTZQQSxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sTUFBUCxHQUFBO1dBQ1AsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBQWdCLE1BQWhCLEVBQXdCLEtBQXhCLEVBRE87RUFBQSxDQTdQVCxDQUFBOztBQUFBLDBCQWlRQSxvQkFBQSxHQUFzQixTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDcEIsUUFBQSxxREFBQTs7TUFEMkIsUUFBTTtLQUNqQztBQUFBLElBQUEsTUFBQSxDQUFPLG1CQUFQLEVBQWlCLGdEQUFqQixDQUFBLENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxNQUFBLENBQU8sS0FBUCxDQUZWLENBQUE7QUFHQTtBQUFBLFVBQ0ssQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUNELFlBQUEsT0FBQTtBQUFBLFFBQUEsT0FBQSxHQUFVLGFBQVYsQ0FBQTtlQUNBLFVBQUEsQ0FBVyxTQUFBLEdBQUE7QUFDVCxjQUFBLFNBQUE7QUFBQSxVQUFBLFNBQUEsR0FBWSx3QkFBd0IsQ0FBQyxRQUF6QixDQUFrQyxPQUFsQyxFQUEyQyxLQUFDLENBQUEsTUFBNUMsQ0FBWixDQUFBO2lCQUNBLEtBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLFNBQWIsRUFGUztRQUFBLENBQVgsRUFHRSxPQUhGLEVBRkM7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURMO0FBQUE7U0FBQSwyQ0FBQTsrQkFBQTtBQUNFLFdBQUEsQ0FBQTtBQUFBLG9CQU9BLE9BQUEsSUFBVyxNQUFBLENBQU8sS0FBUCxFQVBYLENBREY7QUFBQTtvQkFKb0I7RUFBQSxDQWpRdEIsQ0FBQTs7QUFBQSwwQkFnUkEsTUFBQSxHQUFRLFNBQUEsR0FBQTtXQUNOLElBQUMsQ0FBQSxTQUFELENBQUEsRUFETTtFQUFBLENBaFJSLENBQUE7O0FBQUEsMEJBdVJBLFFBQUEsR0FBVSxTQUFBLEdBQUE7QUFDUixRQUFBLElBQUE7QUFBQSxJQURTLDhEQUNULENBQUE7V0FBQSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsRUFEUTtFQUFBLENBdlJWLENBQUE7O0FBQUEsMEJBMlJBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixRQUFBLElBQUE7QUFBQSxJQURPLDhEQUNQLENBQUE7V0FBQSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYyxJQUFkLEVBQW9CLElBQXBCLEVBRE07RUFBQSxDQTNSUixDQUFBOzt1QkFBQTs7SUFwQ0YsQ0FBQTs7Ozs7QUNBQSxJQUFBLHlCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSwyQkFBQyxJQUFELEdBQUE7QUFDWCxJQURjLElBQUMsQ0FBQSxpQkFBQSxXQUFXLElBQUMsQ0FBQSx5QkFBQSxpQkFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBM0IsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFEM0IsQ0FEVztFQUFBLENBQWI7O0FBQUEsOEJBS0EsVUFBQSxHQUFZLElBTFosQ0FBQTs7QUFBQSw4QkFRQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsRUFEVDtFQUFBLENBUlosQ0FBQTs7MkJBQUE7O0lBSkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLHFCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BRU0sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSx1QkFBQyxJQUFELEdBQUE7QUFDWCxJQURjLElBQUMsQ0FBQSxpQkFBQSxXQUFXLElBQUMsQ0FBQSx5QkFBQSxpQkFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBM0IsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFEM0IsQ0FEVztFQUFBLENBQWI7O0FBQUEsMEJBS0EsTUFBQSxHQUFRLElBTFIsQ0FBQTs7QUFBQSwwQkFRQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsRUFEVDtFQUFBLENBUlosQ0FBQTs7dUJBQUE7O0lBSkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLG9DQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLFlBQ0EsR0FBZSxPQUFBLENBQVEsaUNBQVIsQ0FEZixDQUFBOztBQUFBLE1BR00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSx3QkFBQyxJQUFELEdBQUE7QUFDWCxJQURjLElBQUMsQ0FBQSxpQkFBQSxXQUFXLElBQUMsQ0FBQSx5QkFBQSxpQkFDM0IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBM0IsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFEM0IsQ0FEVztFQUFBLENBQWI7O0FBQUEsMkJBS0EsT0FBQSxHQUFTLElBTFQsQ0FBQTs7QUFBQSwyQkFRQSxVQUFBLEdBQVksU0FBQyxLQUFELEdBQUE7V0FDVixJQUFDLENBQUEsV0FBRCxDQUFhLEtBQWIsRUFEVTtFQUFBLENBUlosQ0FBQTs7QUFBQSwyQkFZQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQURVO0VBQUEsQ0FaWixDQUFBOztBQUFBLDJCQW1CQSxpQkFBQSxHQUFtQixTQUFDLFNBQUQsR0FBQTtXQUNqQixJQUFDLENBQUEsaUJBQWlCLENBQUMsVUFBbkIsQ0FBQSxDQUFBLEtBQW1DLE1BRGxCO0VBQUEsQ0FuQm5CLENBQUE7O0FBQUEsMkJBdUJBLGFBQUEsR0FBZSxTQUFDLFNBQUQsR0FBQTtXQUNiLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxVQUFuQixDQUFBLENBQUEsS0FBbUMsTUFEdEI7RUFBQSxDQXZCZixDQUFBOztBQUFBLDJCQTJCQSxjQUFBLEdBQWdCLFNBQUMsWUFBRCxHQUFBO0FBQ2QsSUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlLFlBQWYsQ0FBQTtBQUNBLElBQUEsSUFBK0QsSUFBQyxDQUFBLFNBQVMsQ0FBQyxhQUExRTthQUFBLElBQUMsQ0FBQSxTQUFTLENBQUMsYUFBYSxDQUFDLGVBQXpCLENBQXlDLElBQUMsQ0FBQSxTQUExQyxFQUFxRCxJQUFDLENBQUEsSUFBdEQsRUFBQTtLQUZjO0VBQUEsQ0EzQmhCLENBQUE7O0FBQUEsMkJBZ0NBLFdBQUEsR0FBYSxTQUFDLEtBQUQsR0FBQTtBQUNYLFFBQUEsWUFBQTs7cUJBQTZCO0tBQTdCO0FBQUEsSUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUMsR0FBMUIsR0FBZ0MsS0FEaEMsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUhBLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFKZixDQUFBO1dBS0EsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsRUFOVztFQUFBLENBaENiLENBQUE7O0FBQUEsMkJBeUNBLFdBQUEsR0FBYSxTQUFBLEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsSUFBRCxDQUEzQixDQUFBO0FBQ0EsSUFBQSxJQUFHLEtBQUg7YUFDRSxLQUFLLENBQUMsSUFEUjtLQUFBLE1BQUE7YUFHRSxPQUhGO0tBRlc7RUFBQSxDQXpDYixDQUFBOztBQUFBLDJCQWlEQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtXQUNkLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBUSxDQUFBLElBQUMsQ0FBQSxJQUFELEVBREw7RUFBQSxDQWpEaEIsQ0FBQTs7QUFBQSwyQkFxREEsY0FBQSxHQUFnQixTQUFBLEdBQUE7V0FDZCxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVEsQ0FBQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUMsV0FBMUIsSUFBeUMsSUFBQyxDQUFBLFdBQUQsQ0FBQSxFQUQzQjtFQUFBLENBckRoQixDQUFBOztBQUFBLDJCQXlEQSxPQUFBLEdBQVMsU0FBQyxJQUFELEdBQUE7QUFDUCxRQUFBLHVDQUFBO0FBQUEsSUFEVSxTQUFBLEdBQUcsU0FBQSxHQUFHLGFBQUEsT0FBTyxjQUFBLFFBQVEsWUFBQSxJQUMvQixDQUFBO0FBQUEsSUFBQSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBbEMsQ0FBQTtBQUVBLElBQUEsSUFBRywwREFBSDtBQUNFLE1BQUEsWUFBWSxDQUFDLElBQWIsR0FDRTtBQUFBLFFBQUEsQ0FBQSxFQUFHLENBQUg7QUFBQSxRQUNBLENBQUEsRUFBRyxDQURIO0FBQUEsUUFFQSxLQUFBLEVBQU8sS0FGUDtBQUFBLFFBR0EsTUFBQSxFQUFRLE1BSFI7QUFBQSxRQUlBLElBQUEsRUFBTSxJQUpOO09BREYsQ0FBQTtBQUFBLE1BT0EsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsWUFBWSxDQUFDLFdBQWIsSUFBNEIsWUFBWSxDQUFDLEdBQTFELENBUEEsQ0FBQTtBQVFBLE1BQUEsSUFBK0QsSUFBQyxDQUFBLFNBQVMsQ0FBQyxhQUExRTtlQUFBLElBQUMsQ0FBQSxTQUFTLENBQUMsYUFBYSxDQUFDLGVBQXpCLENBQXlDLElBQUMsQ0FBQSxTQUExQyxFQUFxRCxJQUFDLENBQUEsSUFBdEQsRUFBQTtPQVRGO0tBSE87RUFBQSxDQXpEVCxDQUFBOztBQUFBLDJCQXdFQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsUUFBQSxZQUFBO0FBQUEsSUFBQSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBbEMsQ0FBQTtBQUNBLElBQUEsSUFBRyxvQkFBSDthQUNFLFlBQVksQ0FBQyxJQUFiLEdBQW9CLEtBRHRCO0tBRlM7RUFBQSxDQXhFWCxDQUFBOztBQUFBLDJCQThFQSxlQUFBLEdBQWlCLFNBQUMsZ0JBQUQsR0FBQTtBQUNmLFFBQUEsUUFBQTtBQUFBLElBQUEsTUFBQSxDQUFPLFlBQVksQ0FBQyxHQUFiLENBQWlCLGdCQUFqQixDQUFQLEVBQTRDLHNDQUFBLEdBQS9DLGdCQUFHLENBQUEsQ0FBQTtBQUFBLElBRUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FGWCxDQUFBO1dBR0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBbkIsR0FDRTtBQUFBLE1BQUEsR0FBQSxFQUFLLFFBQUw7QUFBQSxNQUNBLFlBQUEsRUFBYyxnQkFBQSxJQUFvQixJQURsQztNQUxhO0VBQUEsQ0E5RWpCLENBQUE7O0FBQUEsMkJBdUZBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtXQUNuQixJQUFDLENBQUEsZUFBRCxDQUFBLENBQWtCLENBQUMsS0FEQTtFQUFBLENBdkZyQixDQUFBOztBQUFBLDJCQTJGQSxzQkFBQSxHQUF3QixTQUFBLEdBQUE7V0FDdEIsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBQSxLQUEwQixVQURKO0VBQUEsQ0EzRnhCLENBQUE7O0FBQUEsMkJBK0ZBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsUUFBQSxpQkFBQTtBQUFBLElBQUEsV0FBQSw0REFBdUMsQ0FBRSxxQkFBekMsQ0FBQTtXQUNBLFlBQVksQ0FBQyxHQUFiLENBQWlCLFdBQUEsSUFBZSxNQUFoQyxFQUZlO0VBQUEsQ0EvRmpCLENBQUE7O0FBQUEsMkJBb0dBLGVBQUEsR0FBaUIsU0FBQyxHQUFELEdBQUE7QUFDZixRQUFBLGtCQUFBO0FBQUEsSUFBQSxJQUFHLENBQUEsSUFBSyxDQUFBLHNCQUFELENBQUEsQ0FBUDtBQUNFLE1BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBYixDQUFBO0FBQUEsTUFDQSxNQUFBLEdBQVMsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQURULENBQUE7QUFBQSxNQUVBLE1BQU0sQ0FBQyxHQUFQLEdBQWEsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsR0FBbEIsRUFBdUI7QUFBQSxRQUFBLElBQUEsRUFBTSxNQUFNLENBQUMsSUFBYjtPQUF2QixDQUZiLENBQUE7YUFHQSxNQUFNLENBQUMsV0FBUCxHQUFxQixJQUp2QjtLQURlO0VBQUEsQ0FwR2pCLENBQUE7O3dCQUFBOztJQUxGLENBQUE7Ozs7O0FDYUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxNQUFELEdBQUE7QUFJZixNQUFBLG1DQUFBO0FBQUEsRUFBQSxNQUFNLENBQUMsWUFBUCxHQUFzQixFQUF0QixDQUFBO0FBQUEsRUFDQSxNQUFNLENBQUMsa0JBQVAsR0FBNEIsRUFENUIsQ0FBQTtBQUdBO0FBQUE7T0FBQSxZQUFBO3VCQUFBO0FBSUUsSUFBQSxNQUFBLEdBQVksTUFBTSxDQUFDLGVBQVYsR0FBK0IsRUFBQSxHQUEzQyxNQUFNLENBQUMsZUFBb0MsR0FBNEIsR0FBM0QsR0FBbUUsRUFBNUUsQ0FBQTtBQUFBLElBQ0EsS0FBSyxDQUFDLFlBQU4sR0FBcUIsRUFBQSxHQUF4QixNQUF3QixHQUF4QixLQUFLLENBQUMsSUFESCxDQUFBO0FBQUEsSUFHQSxNQUFNLENBQUMsWUFBYSxDQUFBLElBQUEsQ0FBcEIsR0FBNEIsS0FBSyxDQUFDLFlBSGxDLENBQUE7QUFBQSxrQkFJQSxNQUFNLENBQUMsa0JBQW1CLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBMUIsR0FBd0MsS0FKeEMsQ0FKRjtBQUFBO2tCQVBlO0FBQUEsQ0FBakIsQ0FBQTs7Ozs7QUNiQSxJQUFBLHFCQUFBOztBQUFBLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSLENBQWhCLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBaUIsTUFBQSxHQUFZLENBQUEsU0FBQSxHQUFBO1NBRzNCO0FBQUEsSUFBQSxhQUFBLEVBQWUsSUFBZjtBQUFBLElBSUEsaUJBQUEsRUFBbUIsYUFKbkI7QUFBQSxJQU9BLFVBQUEsRUFBWSxVQVBaO0FBQUEsSUFRQSxpQkFBQSxFQUFtQiw0QkFSbkI7QUFBQSxJQVVBLGNBQUEsRUFBZ0Isa0NBVmhCO0FBQUEsSUFhQSxlQUFBLEVBQWlCLGlCQWJqQjtBQUFBLElBZUEsZUFBQSxFQUFpQixNQWZqQjtBQUFBLElBa0JBLFFBQUEsRUFDRTtBQUFBLE1BQUEsWUFBQSxFQUFjLElBQWQ7QUFBQSxNQUNBLFdBQUEsRUFBYSxDQURiO0FBQUEsTUFFQSxpQkFBQSxFQUFtQixLQUZuQjtBQUFBLE1BR0EseUJBQUEsRUFBMkIsS0FIM0I7S0FuQkY7QUFBQSxJQTZCQSxHQUFBLEVBRUU7QUFBQSxNQUFBLE9BQUEsRUFBUyxhQUFUO0FBQUEsTUFHQSxTQUFBLEVBQVcsZUFIWDtBQUFBLE1BSUEsUUFBQSxFQUFVLGNBSlY7QUFBQSxNQUtBLGFBQUEsRUFBZSxvQkFMZjtBQUFBLE1BTUEsVUFBQSxFQUFZLGlCQU5aO0FBQUEsTUFPQSxXQUFBLEVBQVcsUUFQWDtBQUFBLE1BVUEsa0JBQUEsRUFBb0IseUJBVnBCO0FBQUEsTUFXQSxrQkFBQSxFQUFvQix5QkFYcEI7QUFBQSxNQWNBLE9BQUEsRUFBUyxhQWRUO0FBQUEsTUFlQSxrQkFBQSxFQUFvQix5QkFmcEI7QUFBQSxNQWdCQSx5QkFBQSxFQUEyQixrQkFoQjNCO0FBQUEsTUFpQkEsV0FBQSxFQUFhLGtCQWpCYjtBQUFBLE1Ba0JBLFVBQUEsRUFBWSxpQkFsQlo7QUFBQSxNQW1CQSxVQUFBLEVBQVksaUJBbkJaO0FBQUEsTUFvQkEsTUFBQSxFQUFRLGtCQXBCUjtBQUFBLE1BcUJBLFNBQUEsRUFBVyxnQkFyQlg7QUFBQSxNQXNCQSxrQkFBQSxFQUFvQix5QkF0QnBCO0FBQUEsTUF5QkEsZ0JBQUEsRUFBa0Isa0JBekJsQjtBQUFBLE1BMEJBLGtCQUFBLEVBQW9CLDRCQTFCcEI7QUFBQSxNQTJCQSxrQkFBQSxFQUFvQix5QkEzQnBCO0tBL0JGO0FBQUEsSUE2REEsSUFBQSxFQUNFO0FBQUEsTUFBQSxRQUFBLEVBQVUsbUJBQVY7QUFBQSxNQUNBLFdBQUEsRUFBYSxzQkFEYjtLQTlERjtBQUFBLElBeUVBLFVBQUEsRUFDRTtBQUFBLE1BQUEsU0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sZUFBTjtBQUFBLFFBQ0EsWUFBQSxFQUFjLGtCQURkO0FBQUEsUUFFQSxnQkFBQSxFQUFrQixJQUZsQjtBQUFBLFFBR0EsV0FBQSxFQUFhLFNBSGI7T0FERjtBQUFBLE1BS0EsUUFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sY0FBTjtBQUFBLFFBQ0EsWUFBQSxFQUFjLGtCQURkO0FBQUEsUUFFQSxnQkFBQSxFQUFrQixJQUZsQjtBQUFBLFFBR0EsV0FBQSxFQUFhLFNBSGI7T0FORjtBQUFBLE1BVUEsS0FBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sV0FBTjtBQUFBLFFBQ0EsWUFBQSxFQUFjLGtCQURkO0FBQUEsUUFFQSxnQkFBQSxFQUFrQixJQUZsQjtBQUFBLFFBR0EsV0FBQSxFQUFhLE9BSGI7T0FYRjtBQUFBLE1BZUEsSUFBQSxFQUNFO0FBQUEsUUFBQSxJQUFBLEVBQU0sVUFBTjtBQUFBLFFBQ0EsWUFBQSxFQUFjLGtCQURkO0FBQUEsUUFFQSxnQkFBQSxFQUFrQixJQUZsQjtBQUFBLFFBR0EsV0FBQSxFQUFhLFNBSGI7T0FoQkY7QUFBQSxNQW9CQSxRQUFBLEVBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxjQUFOO0FBQUEsUUFDQSxZQUFBLEVBQWMsa0JBRGQ7QUFBQSxRQUVBLGdCQUFBLEVBQWtCLEtBRmxCO09BckJGO0tBMUVGO0FBQUEsSUFvR0EsVUFBQSxFQUNFO0FBQUEsTUFBQSxTQUFBLEVBQ0U7QUFBQSxRQUFBLElBQUEsRUFBTSxTQUFDLEtBQUQsR0FBQTtpQkFDSixLQUFLLENBQUMsU0FBTixDQUFnQixHQUFoQixFQURJO1FBQUEsQ0FBTjtBQUFBLFFBR0EsSUFBQSxFQUFNLFNBQUMsS0FBRCxHQUFBO2lCQUNKLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBZCxFQURJO1FBQUEsQ0FITjtPQURGO0tBckdGO0lBSDJCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FKMUIsQ0FBQTs7QUFBQSxhQW9IQSxDQUFjLE1BQWQsQ0FwSEEsQ0FBQTs7Ozs7QUNBQSxJQUFBLGlCQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQURULENBQUE7O0FBQUEsTUFHTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLGdCQUFDLElBQUQsR0FBQTtBQUFlLElBQVosSUFBQyxDQUFBLFNBQUgsS0FBRyxNQUFXLENBQWY7RUFBQSxDQUFiOztBQUFBLG1CQUdBLE9BQUEsR0FBUyxTQUFDLFNBQUQsRUFBWSxFQUFaLEdBQUE7QUFDUCxRQUFBLE9BQUE7QUFBQSxJQUFBLElBQW1CLGdCQUFuQjtBQUFBLGFBQU8sRUFBQSxDQUFBLENBQVAsQ0FBQTtLQUFBO0FBQUEsSUFDQSxPQUFBLEdBQVUsSUFBQyxDQUFBLHNCQUFELENBQXdCLElBQUMsQ0FBQSxHQUF6QixDQURWLENBQUE7V0FFQSxTQUFTLENBQUMsSUFBVixDQUFlLE9BQWYsRUFBd0IsRUFBeEIsRUFITztFQUFBLENBSFQsQ0FBQTs7QUFBQSxtQkFTQSxZQUFBLEdBQWMsU0FBQSxHQUFBO1dBQ1osRUFBQSxHQUFILE1BQU0sQ0FBQyxVQUFKLEdBQXVCLEdBQXZCLEdBQUgsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQURPO0VBQUEsQ0FUZCxDQUFBOztBQUFBLG1CQWFBLHNCQUFBLEdBQXdCLFNBQUMsSUFBRCxHQUFBO1dBQ3RCLENBQUMsQ0FBQyxHQUFGLENBQU0sSUFBTixFQUFZLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLElBQUQsR0FBQTtBQUVWLFFBQUEsSUFBZSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBQSxJQUFxQixLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBcEM7QUFBQSxpQkFBTyxJQUFQLENBQUE7U0FBQTtBQUFBLFFBR0EsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsVUFBYixFQUF5QixFQUF6QixDQUhQLENBQUE7ZUFJQSxFQUFBLEdBQUUsQ0FBUCxLQUFDLENBQUEsWUFBRCxDQUFBLENBQU8sQ0FBRixHQUFxQixHQUFyQixHQUFMLEtBTmU7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaLEVBRHNCO0VBQUEsQ0FieEIsQ0FBQTs7QUFBQSxtQkF3QkEsTUFBQSxHQUFRLFNBQUMsT0FBRCxHQUFBO1dBQ04sSUFBQyxDQUFBLEdBQUQsQ0FBSyxLQUFMLEVBQVksT0FBWixFQURNO0VBQUEsQ0F4QlIsQ0FBQTs7QUFBQSxtQkE2QkEsS0FBQSxHQUFPLFNBQUMsTUFBRCxHQUFBO1dBQ0wsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsTUFBWCxFQURLO0VBQUEsQ0E3QlAsQ0FBQTs7QUFBQSxtQkFtQ0EsR0FBQSxHQUFLLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUNILFFBQUEsdUJBQUE7QUFBQSxJQUFBLElBQWMsWUFBZDtBQUFBLFlBQUEsQ0FBQTtLQUFBOztNQUVBLElBQUssQ0FBQSxJQUFBLElBQVM7S0FGZDtBQUdBLElBQUEsSUFBRyxDQUFDLENBQUMsSUFBRixDQUFPLElBQVAsQ0FBQSxLQUFnQixRQUFuQjthQUNFLElBQUssQ0FBQSxJQUFBLENBQUssQ0FBQyxJQUFYLENBQWdCLElBQWhCLEVBREY7S0FBQSxNQUFBO0FBR0U7V0FBQSwyQ0FBQTt1QkFBQTtBQUNFLHNCQUFBLElBQUssQ0FBQSxJQUFBLENBQUssQ0FBQyxJQUFYLENBQWdCLEdBQWhCLEVBQUEsQ0FERjtBQUFBO3NCQUhGO0tBSkc7RUFBQSxDQW5DTCxDQUFBOztBQUFBLG1CQThDQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04saUJBRE07RUFBQSxDQTlDUixDQUFBOztBQUFBLG1CQWtEQSxLQUFBLEdBQU8sU0FBQSxHQUFBO1dBQ0wsZ0JBREs7RUFBQSxDQWxEUCxDQUFBOztnQkFBQTs7SUFMRixDQUFBOzs7OztBQ0FBLElBQUEsMENBQUE7O0FBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSx3QkFBUixDQUFOLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQURULENBQUE7O0FBQUEsS0FFQSxHQUFRLE9BQUEsQ0FBUSxrQkFBUixDQUZSLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLGdDQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEscUJBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxZQUFBLE1BQU0sYUFBQSxPQUFPLElBQUMsQ0FBQSxZQUFBLE1BQU0sYUFBQSxPQUFPLGVBQUEsT0FDMUMsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFBLElBQVMsS0FBSyxDQUFDLFFBQU4sQ0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBQWxCLENBQUE7QUFFQSxZQUFPLElBQUMsQ0FBQSxJQUFSO0FBQUEsV0FDTyxRQURQO0FBRUksUUFBQSxNQUFBLENBQU8sS0FBUCxFQUFjLDBDQUFkLENBQUEsQ0FBQTtBQUFBLFFBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQURULENBRko7QUFDTztBQURQLFdBSU8sUUFKUDtBQUtJLFFBQUEsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsNENBQWhCLENBQUEsQ0FBQTtBQUFBLFFBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxPQURYLENBTEo7QUFJTztBQUpQO0FBUUksUUFBQSxHQUFHLENBQUMsS0FBSixDQUFXLHFDQUFBLEdBQWxCLElBQUMsQ0FBQSxJQUFpQixHQUE2QyxHQUF4RCxDQUFBLENBUko7QUFBQSxLQUhXO0VBQUEsQ0FBYjs7QUFBQSxtQ0FtQkEsZUFBQSxHQUFpQixTQUFDLEtBQUQsR0FBQTtBQUNmLElBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWYsQ0FBSDtBQUNFLE1BQUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7ZUFDRTtBQUFBLFVBQUEsTUFBQSxFQUFXLENBQUEsS0FBSCxHQUFrQixDQUFDLElBQUMsQ0FBQSxLQUFGLENBQWxCLEdBQWdDLE1BQXhDO0FBQUEsVUFDQSxHQUFBLEVBQUssS0FETDtVQURGO09BQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtlQUNIO0FBQUEsVUFBQSxNQUFBLEVBQVEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxLQUFkLENBQVI7QUFBQSxVQUNBLEdBQUEsRUFBSyxLQURMO1VBREc7T0FKUDtLQUFBLE1BQUE7QUFRRSxNQUFBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO2VBQ0U7QUFBQSxVQUFBLE1BQUEsRUFBUSxZQUFSO0FBQUEsVUFDQSxHQUFBLEVBQUssTUFETDtVQURGO09BQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtlQUNIO0FBQUEsVUFBQSxNQUFBLEVBQVEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkLENBQVI7QUFBQSxVQUNBLEdBQUEsRUFBSyxNQURMO1VBREc7T0FYUDtLQURlO0VBQUEsQ0FuQmpCLENBQUE7O0FBQUEsbUNBb0NBLGFBQUEsR0FBZSxTQUFDLEtBQUQsR0FBQTtBQUNiLElBQUEsSUFBRyxDQUFBLEtBQUg7YUFDRSxLQURGO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjthQUNILEtBQUEsS0FBUyxJQUFDLENBQUEsTUFEUDtLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7YUFDSCxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixFQURHO0tBQUEsTUFBQTthQUdILEdBQUcsQ0FBQyxJQUFKLENBQVUsbUVBQUEsR0FBZixJQUFDLENBQUEsSUFBSSxFQUhHO0tBTFE7RUFBQSxDQXBDZixDQUFBOztBQUFBLG1DQStDQSxjQUFBLEdBQWdCLFNBQUMsS0FBRCxHQUFBO0FBQ2QsUUFBQSxzQkFBQTtBQUFBO0FBQUEsU0FBQSwyQ0FBQTt3QkFBQTtBQUNFLE1BQUEsSUFBZSxLQUFBLEtBQVMsTUFBTSxDQUFDLEtBQS9CO0FBQUEsZUFBTyxJQUFQLENBQUE7T0FERjtBQUFBLEtBQUE7V0FHQSxNQUpjO0VBQUEsQ0EvQ2hCLENBQUE7O0FBQUEsbUNBc0RBLFlBQUEsR0FBYyxTQUFDLEtBQUQsR0FBQTtBQUNaLFFBQUEsOEJBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyxFQUFULENBQUE7QUFDQTtBQUFBLFNBQUEsMkNBQUE7d0JBQUE7QUFDRSxNQUFBLElBQXNCLE1BQU0sQ0FBQyxLQUFQLEtBQWtCLEtBQXhDO0FBQUEsUUFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosQ0FBQSxDQUFBO09BREY7QUFBQSxLQURBO1dBSUEsT0FMWTtFQUFBLENBdERkLENBQUE7O0FBQUEsbUNBOERBLFlBQUEsR0FBYyxTQUFDLEtBQUQsR0FBQTtBQUNaLFFBQUEsOEJBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyxFQUFULENBQUE7QUFDQTtBQUFBLFNBQUEsMkNBQUE7d0JBQUE7QUFDRSxNQUFBLElBQTRCLE1BQU0sQ0FBQyxLQUFQLEtBQWtCLEtBQTlDO0FBQUEsUUFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQU0sQ0FBQyxLQUFuQixDQUFBLENBQUE7T0FERjtBQUFBLEtBREE7V0FJQSxPQUxZO0VBQUEsQ0E5RGQsQ0FBQTs7Z0NBQUE7O0lBTkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGtEQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLEdBQ0EsR0FBTSxPQUFBLENBQVEsd0JBQVIsQ0FETixDQUFBOztBQUFBLFFBRUEsR0FBVyxPQUFBLENBQVEsc0JBQVIsQ0FGWCxDQUFBOztBQUFBLFdBR0EsR0FBYyxPQUFBLENBQVEseUJBQVIsQ0FIZCxDQUFBOztBQUFBLE1BSUEsR0FBUyxPQUFBLENBQVEsVUFBUixDQUpULENBQUE7O0FBQUEsTUFNTSxDQUFDLE9BQVAsR0FBdUI7QUFPUixFQUFBLGdCQUFDLElBQUQsR0FBQTtBQUNYLElBRGMsSUFBQyxDQUFBLFlBQUEsTUFBTSxJQUFDLENBQUEsZUFBQSxTQUFTLElBQUMsQ0FBQSxjQUFBLFFBQVEsSUFBQyxDQUFBLG1CQUFBLFdBQ3pDLENBQUE7QUFBQSxJQUFBLE1BQUEsQ0FBTyxpQkFBUCxFQUFlLHFCQUFmLENBQUEsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxNQUFNLENBQUMsYUFBUCxDQUFxQixJQUFDLENBQUEsSUFBdEIsRUFBNEIsSUFBQyxDQUFBLE9BQTdCLENBRGQsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUpWLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxVQUFELEdBQWtCLElBQUEsV0FBQSxDQUFBLENBUGxCLENBQUE7QUFBQSxJQVFBLElBQUMsQ0FBQSxXQUFELEdBQWUsRUFSZixDQUFBO0FBQUEsSUFXQSxJQUFDLENBQUEsTUFBRCxHQUFjLElBQUEsTUFBQSxDQUFPO0FBQUEsTUFBQSxNQUFBLEVBQVEsSUFBUjtLQUFQLENBWGQsQ0FBQTtBQUFBLElBY0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLE1BZHBCLENBQUE7QUFBQSxJQWVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLE1BZmhCLENBRFc7RUFBQSxDQUFiOztBQUFBLG1CQW1CQSxNQUFBLEdBQVEsU0FBQyxNQUFELEdBQUE7V0FDTixNQUFNLENBQUMsSUFBUCxLQUFlLElBQUMsQ0FBQSxJQUFoQixJQUF3QixNQUFNLENBQUMsT0FBUCxLQUFrQixJQUFDLENBQUEsUUFEckM7RUFBQSxDQW5CUixDQUFBOztBQUFBLG1CQXlCQSxXQUFBLEdBQWEsU0FBQyxNQUFELEdBQUE7QUFDWCxJQUFBLElBQW1CLGNBQW5CO0FBQUEsYUFBTyxJQUFQLENBQUE7S0FBQTtXQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBUCxJQUFrQixFQUFuQixFQUZBO0VBQUEsQ0F6QmIsQ0FBQTs7QUFBQSxtQkE4QkEsR0FBQSxHQUFLLFNBQUMsVUFBRCxHQUFBO0FBQ0gsUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSw4QkFBRCxDQUFnQyxVQUFoQyxDQUFoQixDQUFBO1dBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLGFBQWhCLEVBRkc7RUFBQSxDQTlCTCxDQUFBOztBQUFBLG1CQW1DQSxJQUFBLEdBQU0sU0FBQyxRQUFELEdBQUE7V0FDSixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsUUFBakIsRUFESTtFQUFBLENBbkNOLENBQUE7O0FBQUEsbUJBdUNBLEdBQUEsR0FBSyxTQUFDLFFBQUQsR0FBQTtBQUNILElBQUEsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsSUFBbkIsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLFFBQVEsQ0FBQyxJQUExQixFQUFnQyxRQUFoQyxFQUZHO0VBQUEsQ0F2Q0wsQ0FBQTs7QUFBQSxtQkE0Q0EsOEJBQUEsR0FBZ0MsU0FBQyxVQUFELEdBQUE7QUFDOUIsUUFBQSxJQUFBO0FBQUEsSUFBRSxPQUFTLFFBQVEsQ0FBQyxlQUFULENBQXlCLFVBQXpCLEVBQVQsSUFBRixDQUFBO1dBQ0EsS0FGOEI7RUFBQSxDQTVDaEMsQ0FBQTs7QUFBQSxFQWlEQSxNQUFDLENBQUEsYUFBRCxHQUFnQixTQUFDLElBQUQsRUFBTyxPQUFQLEdBQUE7QUFDZCxJQUFBLElBQUcsT0FBSDthQUNFLEVBQUEsR0FBTCxJQUFLLEdBQVUsR0FBVixHQUFMLFFBREc7S0FBQSxNQUFBO2FBR0UsRUFBQSxHQUFMLEtBSEc7S0FEYztFQUFBLENBakRoQixDQUFBOztnQkFBQTs7SUFiRixDQUFBOzs7OztBQ0FBLElBQUEscUNBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUFULENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSxVQUFSLENBRFQsQ0FBQTs7QUFBQSxZQUVBLEdBQWUsT0FBQSxDQUFRLGlCQUFSLENBRmYsQ0FBQTs7QUFBQSxPQUdBLEdBQVUsT0FBQSxDQUFRLFdBQVIsQ0FIVixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBRWxCO0FBQUEsSUFBQSxPQUFBLEVBQVMsRUFBVDtBQUFBLElBYUEsSUFBQSxFQUFNLFNBQUMsVUFBRCxHQUFBO0FBQ0osVUFBQSxpQ0FBQTtBQUFBLE1BQUEsTUFBQSxDQUFPLGtCQUFQLEVBQW9CLDBDQUFwQixDQUFBLENBQUE7QUFBQSxNQUNBLE1BQUEsQ0FBTyxDQUFBLENBQUssTUFBQSxDQUFBLFVBQUEsS0FBcUIsUUFBdEIsQ0FBWCxFQUE0Qyw0REFBNUMsQ0FEQSxDQUFBO0FBQUEsTUFHQSxPQUFBLEdBQVUsT0FBTyxDQUFDLEtBQVIsQ0FBYyxVQUFVLENBQUMsT0FBekIsQ0FIVixDQUFBO0FBQUEsTUFJQSxnQkFBQSxHQUFtQixNQUFNLENBQUMsYUFBUCxDQUFxQixVQUFVLENBQUMsSUFBaEMsRUFBc0MsT0FBdEMsQ0FKbkIsQ0FBQTtBQUtBLE1BQUEsSUFBVSxJQUFDLENBQUEsR0FBRCxDQUFLLGdCQUFMLENBQVY7QUFBQSxjQUFBLENBQUE7T0FMQTtBQUFBLE1BT0EsTUFBQSxHQUFTLFlBQVksQ0FBQyxLQUFiLENBQW1CLFVBQW5CLENBUFQsQ0FBQTtBQVFBLE1BQUEsSUFBRyxNQUFIO2VBQ0UsSUFBQyxDQUFBLEdBQUQsQ0FBSyxNQUFMLEVBREY7T0FBQSxNQUFBO0FBR0UsY0FBVSxJQUFBLEtBQUEsQ0FBTSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQXBCLENBQVYsQ0FIRjtPQVRJO0lBQUEsQ0FiTjtBQUFBLElBOEJBLEdBQUEsRUFBSyxTQUFDLE1BQUQsR0FBQTtBQUNILE1BQUEsSUFBRyxNQUFNLENBQUMsV0FBUCxDQUFtQixJQUFDLENBQUEsT0FBUSxDQUFBLE1BQU0sQ0FBQyxJQUFQLENBQTVCLENBQUg7QUFDRSxRQUFBLElBQUMsQ0FBQSxPQUFRLENBQUEsTUFBTSxDQUFDLElBQVAsQ0FBVCxHQUF3QixNQUF4QixDQURGO09BQUE7YUFFQSxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQU0sQ0FBQyxVQUFQLENBQVQsR0FBOEIsT0FIM0I7SUFBQSxDQTlCTDtBQUFBLElBcUNBLEdBQUEsRUFBSyxTQUFDLGdCQUFELEdBQUE7YUFDSCx1Q0FERztJQUFBLENBckNMO0FBQUEsSUEyQ0EsR0FBQSxFQUFLLFNBQUMsZ0JBQUQsR0FBQTtBQUNILE1BQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxHQUFELENBQUssZ0JBQUwsQ0FBUCxFQUFnQyxpQkFBQSxHQUFuQyxnQkFBbUMsR0FBb0Msa0JBQXBFLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxPQUFRLENBQUEsZ0JBQUEsRUFGTjtJQUFBLENBM0NMO0FBQUEsSUFpREEsVUFBQSxFQUFZLFNBQUEsR0FBQTthQUNWLElBQUMsQ0FBQSxPQUFELEdBQVcsR0FERDtJQUFBLENBakRaO0lBRmtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FMakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLG1DQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FBVCxDQUFBOztBQUFBLE9BQ0EsR0FBVSxPQUFBLENBQVEsU0FBUixDQURWLENBQUE7O0FBQUEsT0FFQSxHQUFVLE9BQUEsQ0FBUSxXQUFSLENBRlYsQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUFpQixTQUFBLEdBQVksT0FBTyxDQUFDLEtBQUQsQ0FBUCxDQUFBLENBSDdCLENBQUE7O0FBQUEsU0FRUyxDQUFDLEdBQVYsQ0FBYyxXQUFkLEVBQTJCLFNBQUMsS0FBRCxHQUFBO1NBQ3pCLEtBQUEsS0FBUyxRQUFULElBQXFCLEtBQUEsS0FBUyxTQURMO0FBQUEsQ0FBM0IsQ0FSQSxDQUFBOztBQUFBLFNBWVMsQ0FBQyxHQUFWLENBQWMsUUFBZCxFQUF3QixTQUFDLEtBQUQsR0FBQTtTQUN0QixPQUFPLENBQUMsTUFBTSxDQUFDLElBQWYsQ0FBb0IsS0FBcEIsRUFEc0I7QUFBQSxDQUF4QixDQVpBLENBQUE7O0FBQUEsU0FtQlMsQ0FBQyxHQUFWLENBQWMsa0JBQWQsRUFBa0MsU0FBQyxLQUFELEdBQUE7QUFDaEMsTUFBQSwyQkFBQTtBQUFBLEVBQUEsVUFBQSxHQUFhLENBQWIsQ0FBQTtBQUNBLE9BQUEsNENBQUE7c0JBQUE7QUFDRSxJQUFBLElBQW1CLENBQUEsS0FBUyxDQUFDLEtBQTdCO0FBQUEsTUFBQSxVQUFBLElBQWMsQ0FBZCxDQUFBO0tBREY7QUFBQSxHQURBO1NBSUEsVUFBQSxLQUFjLEVBTGtCO0FBQUEsQ0FBbEMsQ0FuQkEsQ0FBQTs7QUFBQSxTQThCUyxDQUFDLEdBQVYsQ0FBYyxRQUFkLEVBQ0U7QUFBQSxFQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsRUFDQSxPQUFBLEVBQVMsZ0JBRFQ7QUFBQSxFQUVBLE1BQUEsRUFBUSxrQkFGUjtBQUFBLEVBR0EsV0FBQSxFQUFhLGtCQUhiO0FBQUEsRUFJQSxNQUFBLEVBQ0U7QUFBQSxJQUFBLFVBQUEsRUFBWSxVQUFaO0FBQUEsSUFDQSxHQUFBLEVBQUssaUJBREw7QUFBQSxJQUVBLEVBQUEsRUFBSSwyQkFGSjtHQUxGO0FBQUEsRUFRQSxVQUFBLEVBQVksb0JBUlo7QUFBQSxFQVNBLG1CQUFBLEVBQ0U7QUFBQSxJQUFBLFVBQUEsRUFBWSxVQUFaO0FBQUEsSUFDQSxvQkFBQSxFQUFzQixTQUFDLEdBQUQsRUFBTSxLQUFOLEdBQUE7YUFBZ0IsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsbUJBQW5CLEVBQXdDLEtBQXhDLEVBQWhCO0lBQUEsQ0FEdEI7R0FWRjtBQUFBLEVBWUEsTUFBQSxFQUFRLDBCQVpSO0FBQUEsRUFhQSxpQkFBQSxFQUNFO0FBQUEsSUFBQSxVQUFBLEVBQVksVUFBWjtBQUFBLElBQ0EsU0FBQSxFQUFXLGtCQURYO0FBQUEsSUFFQSxLQUFBLEVBQU8sa0JBRlA7R0FkRjtBQUFBLEVBaUJBLFdBQUEsRUFDRTtBQUFBLElBQUEsVUFBQSxFQUFZLFVBQVo7QUFBQSxJQUNBLG9CQUFBLEVBQXNCLFNBQUMsR0FBRCxFQUFNLEtBQU4sR0FBQTthQUFnQixTQUFTLENBQUMsUUFBVixDQUFtQixZQUFuQixFQUFpQyxLQUFqQyxFQUFoQjtJQUFBLENBRHRCO0dBbEJGO0NBREYsQ0E5QkEsQ0FBQTs7QUFBQSxTQXFEUyxDQUFDLEdBQVYsQ0FBYyxXQUFkLEVBQ0U7QUFBQSxFQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsRUFDQSxLQUFBLEVBQU8sa0JBRFA7QUFBQSxFQUVBLElBQUEsRUFBTSxRQUZOO0FBQUEsRUFHQSxVQUFBLEVBQVksa0JBSFo7QUFBQSxFQUlBLFVBQUEsRUFBWSwyQkFKWjtBQUFBLEVBS0Esb0JBQUEsRUFBc0IsU0FBQyxHQUFELEVBQU0sS0FBTixHQUFBO1dBQWdCLE1BQWhCO0VBQUEsQ0FMdEI7Q0FERixDQXJEQSxDQUFBOztBQUFBLFNBOERTLENBQUMsR0FBVixDQUFjLE9BQWQsRUFDRTtBQUFBLEVBQUEsS0FBQSxFQUFPLFFBQVA7QUFBQSxFQUNBLFVBQUEsRUFBWSxpQkFEWjtDQURGLENBOURBLENBQUE7O0FBQUEsU0FvRVMsQ0FBQyxHQUFWLENBQWMsbUJBQWQsRUFDRTtBQUFBLEVBQUEsS0FBQSxFQUFPLGtCQUFQO0FBQUEsRUFDQSxJQUFBLEVBQU0sbUJBRE47QUFBQSxFQUVBLEtBQUEsRUFBTyxrQkFGUDtBQUFBLEVBR0EsT0FBQSxFQUFTLGtEQUhUO0NBREYsQ0FwRUEsQ0FBQTs7QUFBQSxTQTJFUyxDQUFDLEdBQVYsQ0FBYyxZQUFkLEVBQ0U7QUFBQSxFQUFBLEtBQUEsRUFBTyxrQkFBUDtBQUFBLEVBQ0EsS0FBQSxFQUFPLFFBRFA7Q0FERixDQTNFQSxDQUFBOztBQUFBLFNBZ0ZTLENBQUMsR0FBVixDQUFjLGFBQWQsRUFDRTtBQUFBLEVBQUEsT0FBQSxFQUFTLFFBQVQ7QUFBQSxFQUNBLEtBQUEsRUFBTyxrQkFEUDtDQURGLENBaEZBLENBQUE7Ozs7O0FDQUEsSUFBQSw0R0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBQU4sQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxrQkFFQSxHQUFxQixPQUFBLENBQVEsd0JBQVIsQ0FGckIsQ0FBQTs7QUFBQSxzQkFHQSxHQUF5QixPQUFBLENBQVEsNEJBQVIsQ0FIekIsQ0FBQTs7QUFBQSxRQUlBLEdBQVcsT0FBQSxDQUFRLHNCQUFSLENBSlgsQ0FBQTs7QUFBQSxNQUtBLEdBQVMsT0FBQSxDQUFRLFVBQVIsQ0FMVCxDQUFBOztBQUFBLE9BTUEsR0FBVSxPQUFBLENBQVEsV0FBUixDQU5WLENBQUE7O0FBQUEsVUFPQSxHQUFhLE9BQUEsQ0FBUSxlQUFSLENBUGIsQ0FBQTs7QUFBQSxNQVVNLENBQUMsT0FBUCxHQUFpQixZQUFBLEdBRWY7QUFBQSxFQUFBLEtBQUEsRUFBTyxTQUFDLFlBQUQsR0FBQTtBQUNMLFFBQUEsTUFBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7QUFDQSxJQUFBLElBQUcsa0JBQWtCLENBQUMsUUFBbkIsQ0FBNEIsUUFBNUIsRUFBc0MsWUFBdEMsQ0FBSDthQUNFLElBQUMsQ0FBQSxZQUFELENBQWMsWUFBZCxFQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsTUFBQSxHQUFTLGtCQUFrQixDQUFDLGdCQUFuQixDQUFBLENBQVQsQ0FBQTtBQUNBLFlBQVUsSUFBQSxLQUFBLENBQU0sTUFBTixDQUFWLENBSkY7S0FGSztFQUFBLENBQVA7QUFBQSxFQVNBLFlBQUEsRUFBYyxTQUFDLFlBQUQsR0FBQTtBQUNaLFFBQUEsc0ZBQUE7QUFBQSxJQUFFLHNCQUFBLE1BQUYsRUFBVSwwQkFBQSxVQUFWLEVBQXNCLG1DQUFBLG1CQUF0QixFQUEyQyxzQkFBQSxNQUEzQyxFQUFtRCxpQ0FBQSxpQkFBbkQsRUFBc0UsMkJBQUEsV0FBdEUsQ0FBQTtBQUNBO0FBQ0UsTUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxlQUFELENBQWlCLFlBQWpCLENBQVYsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBREEsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLG1CQUExQixDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixXQUFsQixDQUhBLENBQUE7QUFBQSxNQUlBLElBQUMsQ0FBQSxlQUFELENBQWlCLFVBQWpCLENBSkEsQ0FBQTtBQUFBLE1BS0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBTEEsQ0FBQTtBQUFBLE1BTUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxpQkFBZixDQU5BLENBREY7S0FBQSxjQUFBO0FBU0UsTUFESSxjQUNKLENBQUE7QUFBQSxNQUFBLEtBQUssQ0FBQyxPQUFOLEdBQWlCLDZCQUFBLEdBQXRCLEtBQUssQ0FBQyxPQUFELENBQUE7QUFDQSxZQUFNLEtBQU4sQ0FWRjtLQURBO1dBYUEsSUFBQyxDQUFBLE9BZFc7RUFBQSxDQVRkO0FBQUEsRUEwQkEsZUFBQSxFQUFpQixTQUFDLE1BQUQsR0FBQTtBQUNmLFFBQUEsT0FBQTtBQUFBLElBQUEsT0FBQSxHQUFjLElBQUEsT0FBQSxDQUFRLE1BQU0sQ0FBQyxPQUFmLENBQWQsQ0FBQTtXQUNJLElBQUEsTUFBQSxDQUNGO0FBQUEsTUFBQSxJQUFBLEVBQU0sTUFBTSxDQUFDLElBQWI7QUFBQSxNQUNBLE9BQUEsRUFBUyxPQUFPLENBQUMsUUFBUixDQUFBLENBRFQ7S0FERSxFQUZXO0VBQUEsQ0ExQmpCO0FBQUEsRUFpQ0EsV0FBQSxFQUFhLFNBQUMsTUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFjLGNBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZixDQUFzQixNQUFNLENBQUMsR0FBN0IsQ0FEQSxDQUFBO1dBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixNQUFNLENBQUMsRUFBNUIsRUFIVztFQUFBLENBakNiO0FBQUEsRUF3Q0Esd0JBQUEsRUFBMEIsU0FBQyxtQkFBRCxHQUFBO0FBQ3hCLFFBQUEsc0JBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixFQUF2QixDQUFBO0FBQ0E7U0FBQSwyQkFBQTt5Q0FBQTtBQUNFLE1BQUEsTUFBTSxDQUFDLElBQVAsR0FBYyxJQUFkLENBQUE7QUFBQSxvQkFDQSxJQUFDLENBQUEsbUJBQW9CLENBQUEsSUFBQSxDQUFyQixHQUE2QixJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFEN0IsQ0FERjtBQUFBO29CQUZ3QjtFQUFBLENBeEMxQjtBQUFBLEVBK0NBLGdCQUFBLEVBQWtCLFNBQUMsTUFBRCxHQUFBO0FBQ2hCLFFBQUEscUJBQUE7QUFBQTtTQUFBLGNBQUE7MkJBQUE7QUFDRSxvQkFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVksQ0FBQSxJQUFBLENBQXBCLEdBQWdDLElBQUEsVUFBQSxDQUM5QjtBQUFBLFFBQUEsSUFBQSxFQUFNLElBQU47QUFBQSxRQUNBLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FEYjtBQUFBLFFBRUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUZiO09BRDhCLEVBQWhDLENBREY7QUFBQTtvQkFEZ0I7RUFBQSxDQS9DbEI7QUFBQSxFQXVEQSxlQUFBLEVBQWlCLFNBQUMsVUFBRCxHQUFBO0FBQ2YsUUFBQSw4RUFBQTs7TUFEZ0IsYUFBVztLQUMzQjtBQUFBO1NBQUEsaURBQUEsR0FBQTtBQUNFLDZCQURJLFlBQUEsTUFBTSxhQUFBLE9BQU8sWUFBQSxNQUFNLGtCQUFBLFlBQVksa0JBQUEsVUFDbkMsQ0FBQTtBQUFBLE1BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixVQUEzQixDQUFiLENBQUE7QUFBQSxNQUVBLFNBQUEsR0FBZ0IsSUFBQSxRQUFBLENBQ2Q7QUFBQSxRQUFBLElBQUEsRUFBTSxJQUFOO0FBQUEsUUFDQSxLQUFBLEVBQU8sS0FEUDtBQUFBLFFBRUEsSUFBQSxFQUFNLElBRk47QUFBQSxRQUdBLFVBQUEsRUFBWSxVQUhaO09BRGMsQ0FGaEIsQ0FBQTtBQUFBLE1BUUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBakIsRUFBNEIsVUFBNUIsQ0FSQSxDQUFBO0FBQUEsb0JBU0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksU0FBWixFQVRBLENBREY7QUFBQTtvQkFEZTtFQUFBLENBdkRqQjtBQUFBLEVBcUVBLGVBQUEsRUFBaUIsU0FBQyxTQUFELEVBQVksVUFBWixHQUFBO0FBQ2YsUUFBQSxnREFBQTtBQUFBO1NBQUEsa0JBQUE7OEJBQUE7QUFDRSxNQUFBLFNBQUEsR0FBWSxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQXJCLENBQXlCLElBQXpCLENBQVosQ0FBQTtBQUFBLE1BQ0EsTUFBQSxDQUFPLFNBQVAsRUFBbUIsMkJBQUEsR0FBeEIsSUFBd0IsR0FBa0MsTUFBbEMsR0FBeEIsU0FBUyxDQUFDLElBQWMsR0FBeUQsYUFBNUUsQ0FEQSxDQUFBO0FBQUEsTUFFQSxlQUFBLEdBQ0U7QUFBQSxRQUFBLFdBQUEsRUFBYSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBSSxDQUFDLFdBQXhCLENBQWI7T0FIRixDQUFBO0FBQUEsb0JBSUEsU0FBUyxDQUFDLFNBQVYsQ0FBb0IsZUFBcEIsRUFKQSxDQURGO0FBQUE7b0JBRGU7RUFBQSxDQXJFakI7QUFBQSxFQThFQSx5QkFBQSxFQUEyQixTQUFDLGFBQUQsR0FBQTtBQUN6QixRQUFBLDBDQUFBO0FBQUEsSUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBQ0E7QUFBQSxTQUFBLDJDQUFBO3NCQUFBO0FBQ0UsTUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLG1CQUFvQixDQUFBLElBQUEsQ0FBaEMsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxDQUFPLFFBQVAsRUFBa0IseUJBQUEsR0FBdkIsSUFBdUIsR0FBZ0Msa0JBQWxELENBREEsQ0FBQTtBQUFBLE1BRUEsVUFBVyxDQUFBLElBQUEsQ0FBWCxHQUFtQixRQUZuQixDQURGO0FBQUEsS0FEQTtXQU1BLFdBUHlCO0VBQUEsQ0E5RTNCO0FBQUEsRUF3RkEsaUJBQUEsRUFBbUIsU0FBQyxVQUFELEdBQUE7QUFDakIsSUFBQSxJQUFjLGtCQUFkO0FBQUEsWUFBQSxDQUFBO0tBQUE7V0FDQSxJQUFDLENBQUEsUUFBRCxDQUFVLFVBQVYsRUFBc0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsSUFBRCxHQUFBO0FBQ3BCLFlBQUEsS0FBQTtBQUFBLFFBQUEsS0FBQSxHQUFRLEtBQUMsQ0FBQSxNQUFNLENBQUMsV0FBWSxDQUFBLElBQUEsQ0FBNUIsQ0FBQTtBQUFBLFFBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBZSxrQkFBQSxHQUFwQixJQUFvQixHQUF5QixrQkFBeEMsQ0FEQSxDQUFBO2VBRUEsTUFIb0I7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QixFQUZpQjtFQUFBLENBeEZuQjtBQUFBLEVBZ0dBLFdBQUEsRUFBYSxTQUFDLE1BQUQsR0FBQTtBQUNYLFFBQUEsb0RBQUE7O01BRFksU0FBTztLQUNuQjtBQUFBO1NBQUEsNkNBQUE7eUJBQUE7QUFDRSxNQUFBLFVBQUE7O0FBQWE7QUFBQTthQUFBLDZDQUFBO21DQUFBO0FBQ1gseUJBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksYUFBWixFQUFBLENBRFc7QUFBQTs7bUJBQWIsQ0FBQTtBQUFBLG9CQUdBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQWYsQ0FDRTtBQUFBLFFBQUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUFiO0FBQUEsUUFDQSxVQUFBLEVBQVksVUFEWjtPQURGLEVBSEEsQ0FERjtBQUFBO29CQURXO0VBQUEsQ0FoR2I7QUFBQSxFQTBHQSxhQUFBLEVBQWUsU0FBQyxpQkFBRCxHQUFBO0FBQ2IsUUFBQSxnQkFBQTtBQUFBLElBQUEsSUFBYyx5QkFBZDtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDRSw4QkFBQSxTQUFGLEVBQWEsMEJBQUEsS0FEYixDQUFBO0FBRUEsSUFBQSxJQUF1RCxTQUF2RDtBQUFBLE1BQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixHQUEyQixJQUFDLENBQUEsWUFBRCxDQUFjLFNBQWQsQ0FBM0IsQ0FBQTtLQUZBO0FBR0EsSUFBQSxJQUErQyxLQUEvQzthQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixHQUF1QixJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsRUFBdkI7S0FKYTtFQUFBLENBMUdmO0FBQUEsRUFpSEEsWUFBQSxFQUFjLFNBQUMsSUFBRCxHQUFBO0FBQ1osUUFBQSxTQUFBO0FBQUEsSUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksSUFBWixDQUFaLENBQUE7QUFBQSxJQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQW1CLDJCQUFBLEdBQXRCLElBQUcsQ0FEQSxDQUFBO1dBRUEsVUFIWTtFQUFBLENBakhkO0FBQUEsRUF1SEEsdUJBQUEsRUFBeUIsU0FBQyxlQUFELEdBQUE7V0FDbkIsSUFBQSxzQkFBQSxDQUF1QixlQUF2QixFQURtQjtFQUFBLENBdkh6QjtBQUFBLEVBMkhBLFFBQUEsRUFBVSxTQUFDLE9BQUQsRUFBVSxNQUFWLEdBQUE7QUFDUixRQUFBLDhCQUFBO0FBQUEsSUFBQSxRQUFBLEdBQVcsRUFBWCxDQUFBO0FBQ0EsU0FBQSw4Q0FBQTswQkFBQTtBQUNFLE1BQUEsR0FBQSxHQUFNLE1BQUEsQ0FBTyxLQUFQLENBQU4sQ0FBQTtBQUNBLE1BQUEsSUFBc0IsV0FBdEI7QUFBQSxRQUFBLFFBQVEsQ0FBQyxJQUFULENBQWMsR0FBZCxDQUFBLENBQUE7T0FGRjtBQUFBLEtBREE7V0FLQSxTQU5RO0VBQUEsQ0EzSFY7Q0FaRixDQUFBOztBQUFBLE1BZ0pNLENBQUMsTUFBUCxHQUFnQixZQWhKaEIsQ0FBQTs7Ozs7QUNBQSxJQUFBLDRCQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsS0FDQSxHQUFRLE9BQUEsQ0FBUSxrQkFBUixDQURSLENBQUE7O0FBQUEsTUFFQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUixDQUZULENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBdUI7QUFFckIsTUFBQSxXQUFBOztBQUFBLEVBQUEsV0FBQSxHQUFjLGtCQUFkLENBQUE7O0FBRWEsRUFBQSxvQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLFlBQUE7QUFBQSxJQURjLElBQUMsQ0FBQSxZQUFBLE1BQU0sYUFBQSxPQUFPLGFBQUEsS0FDNUIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFBLElBQVMsS0FBSyxDQUFDLFFBQU4sQ0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBQWxCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaLENBRFQsQ0FEVztFQUFBLENBRmI7O0FBQUEsdUJBT0EsVUFBQSxHQUFZLFNBQUMsS0FBRCxHQUFBO0FBQ1YsUUFBQSxHQUFBO0FBQUEsSUFBQSxJQUFHLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBUCxDQUFBLEtBQWlCLFFBQXBCO0FBQ0UsTUFBQSxHQUFBLEdBQU0sV0FBVyxDQUFDLElBQVosQ0FBaUIsS0FBakIsQ0FBTixDQUFBO0FBQUEsTUFDQSxLQUFBLEdBQVEsTUFBQSxDQUFPLEdBQUksQ0FBQSxDQUFBLENBQVgsQ0FBQSxHQUFpQixNQUFBLENBQU8sR0FBSSxDQUFBLENBQUEsQ0FBWCxDQUR6QixDQURGO0tBQUE7QUFBQSxJQUlBLE1BQUEsQ0FBTyxDQUFDLENBQUMsSUFBRixDQUFPLEtBQVAsQ0FBQSxLQUFpQixRQUF4QixFQUFtQyw4QkFBQSxHQUF0QyxLQUFHLENBSkEsQ0FBQTtXQUtBLE1BTlU7RUFBQSxDQVBaLENBQUE7O29CQUFBOztJQU5GLENBQUE7Ozs7O0FDQUEsSUFBQSxPQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQXVCO0FBQ3JCLEVBQUEsT0FBQyxDQUFBLE1BQUQsR0FBVSwwQkFBVixDQUFBOztBQUVhLEVBQUEsaUJBQUMsYUFBRCxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsWUFBRCxDQUFjLGFBQWQsQ0FBQSxDQURXO0VBQUEsQ0FGYjs7QUFBQSxvQkFNQSxZQUFBLEdBQWMsU0FBQyxhQUFELEdBQUE7QUFDWixRQUFBLEdBQUE7QUFBQSxJQUFBLEdBQUEsR0FBTSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQWYsQ0FBb0IsYUFBcEIsQ0FBTixDQUFBO0FBQ0EsSUFBQSxJQUFHLEdBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsR0FBSSxDQUFBLENBQUEsQ0FBYixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEdBQUksQ0FBQSxDQUFBLENBRGIsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxHQUFJLENBQUEsQ0FBQSxDQUZiLENBQUE7YUFHQSxJQUFDLENBQUEsUUFBRCxHQUFZLEdBQUksQ0FBQSxDQUFBLEVBSmxCO0tBRlk7RUFBQSxDQU5kLENBQUE7O0FBQUEsb0JBZUEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLG1CQURPO0VBQUEsQ0FmVCxDQUFBOztBQUFBLG9CQW1CQSxRQUFBLEdBQVUsU0FBQSxHQUFBO1dBQ1IsRUFBQSxHQUFILElBQUMsQ0FBQSxLQUFFLEdBQVksR0FBWixHQUFILElBQUMsQ0FBQSxLQUFFLEdBQXdCLEdBQXhCLEdBQUgsSUFBQyxDQUFBLEtBQUUsR0FBcUMsQ0FBeEMsSUFBQyxDQUFBLFFBQUQsSUFBYSxFQUEyQixFQUQ3QjtFQUFBLENBbkJWLENBQUE7O0FBQUEsRUF1QkEsT0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLGFBQUQsR0FBQTtBQUNOLFFBQUEsQ0FBQTtBQUFBLElBQUEsQ0FBQSxHQUFRLElBQUEsT0FBQSxDQUFRLGFBQVIsQ0FBUixDQUFBO0FBQ0EsSUFBQSxJQUFHLENBQUMsQ0FBQyxPQUFGLENBQUEsQ0FBSDthQUFvQixDQUFDLENBQUMsUUFBRixDQUFBLEVBQXBCO0tBQUEsTUFBQTthQUFzQyxHQUF0QztLQUZNO0VBQUEsQ0F2QlIsQ0FBQTs7aUJBQUE7O0lBREYsQ0FBQTs7Ozs7QUNBQSxNQUFNLENBQUMsT0FBUCxHQUtFO0FBQUEsRUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLEVBTUEsR0FBQSxFQUFLLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUNILElBQUEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWYsQ0FBSDthQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBQXVCLEtBQXZCLEVBREY7S0FBQSxNQUFBO2FBR0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLEtBQXBCLEVBQTJCLEtBQTNCLEVBSEY7S0FERztFQUFBLENBTkw7QUFBQSxFQWFBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEdBQUE7QUFDZCxRQUFBLGFBQUE7QUFBQSxJQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsS0FBcEIsQ0FBTixDQUFBO1dBQ0EsUUFBQSxHQUFZLHNCQUFBLEdBQWYsR0FBRyxDQUFDLEtBQVcsR0FBa0MsR0FBbEMsR0FBZixHQUFHLENBQUMsTUFBVyxHQUFrRCxpQkFGaEQ7RUFBQSxDQWJoQjtBQUFBLEVBbUJBLE1BQUEsRUFBUSxTQUFDLEtBQUQsR0FBQTtXQUNOLE1BRE07RUFBQSxDQW5CUjtBQUFBLEVBMEJBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEVBQVEsS0FBUixHQUFBO1dBQ2QsS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFYLEVBQWtCLEtBQWxCLEVBRGM7RUFBQSxDQTFCaEI7QUFBQSxFQThCQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsRUFBUSxLQUFSLEdBQUE7V0FDbEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUErQixNQUFBLEdBQUssQ0FBdkMsSUFBQyxDQUFBLFlBQUQsQ0FBYyxLQUFkLENBQXVDLENBQUwsR0FBNkIsR0FBNUQsRUFEa0I7RUFBQSxDQTlCcEI7QUFBQSxFQXNDQSxZQUFBLEVBQWMsU0FBQyxHQUFELEdBQUE7QUFDWixJQUFBLElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLENBQUg7YUFDRyxHQUFBLEdBQU4sR0FBTSxHQUFTLElBRFo7S0FBQSxNQUFBO2FBR0UsSUFIRjtLQURZO0VBQUEsQ0F0Q2Q7QUFBQSxFQTZDQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsR0FBQTtBQUNsQixJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBZSxLQUFmLENBQUg7YUFDRTtBQUFBLFFBQUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUFOLENBQUEsQ0FBUDtBQUFBLFFBQ0EsTUFBQSxFQUFRLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FEUjtRQURGO0tBQUEsTUFBQTthQUlFO0FBQUEsUUFBQSxLQUFBLEVBQU8sS0FBSyxDQUFDLFVBQU4sQ0FBQSxDQUFQO0FBQUEsUUFDQSxNQUFBLEVBQVEsS0FBSyxDQUFDLFdBQU4sQ0FBQSxDQURSO1FBSkY7S0FEa0I7RUFBQSxDQTdDcEI7QUFBQSxFQXNEQSxRQUFBLEVBQVUsU0FBQyxLQUFELEdBQUE7QUFDUixJQUFBLElBQW9DLGFBQXBDO2FBQUEsS0FBSyxDQUFDLE9BQU4sQ0FBYyxZQUFkLENBQUEsS0FBK0IsRUFBL0I7S0FEUTtFQUFBLENBdERWO0FBQUEsRUEwREEsYUFBQSxFQUFlLFNBQUMsS0FBRCxHQUFBO1dBQ2IsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFsQixDQUFBLENBQUEsS0FBbUMsTUFEdEI7RUFBQSxDQTFEZjtBQUFBLEVBOERBLGlCQUFBLEVBQW1CLFNBQUMsS0FBRCxHQUFBO1dBQ2pCLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFRLENBQUMsV0FBbEIsQ0FBQSxDQUFBLEtBQW1DLE1BRGxCO0VBQUEsQ0E5RG5CO0NBTEYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGdEQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLG1CQUNBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUixDQUR0QixDQUFBOztBQUFBLG1CQUVBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUixDQUZ0QixDQUFBOztBQUFBLE1BSU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO0FBR2xCLE1BQUEsUUFBQTtBQUFBLEVBQUEsUUFBQSxHQUNFO0FBQUEsSUFBQSxVQUFBLEVBQVksbUJBQVo7QUFBQSxJQUNBLFNBQUEsRUFBVyxtQkFEWDtHQURGLENBQUE7U0FRQTtBQUFBLElBQUEsR0FBQSxFQUFLLFNBQUMsV0FBRCxHQUFBOztRQUFDLGNBQWM7T0FDbEI7YUFBQSw4QkFERztJQUFBLENBQUw7QUFBQSxJQUlBLEdBQUEsRUFBSyxTQUFDLFdBQUQsR0FBQTs7UUFBQyxjQUFjO09BQ2xCO0FBQUEsTUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLEdBQUQsQ0FBSyxXQUFMLENBQVAsRUFBMkIsK0JBQUEsR0FBOUIsV0FBRyxDQUFBLENBQUE7YUFDQSxRQUFTLENBQUEsV0FBQSxFQUZOO0lBQUEsQ0FKTDtBQUFBLElBU0EsV0FBQSxFQUFhLFNBQUMsUUFBRCxHQUFBO0FBQ1gsVUFBQSx1QkFBQTtBQUFBO1dBQUEsZ0JBQUE7aUNBQUE7QUFDRSxzQkFBQSxRQUFBLENBQVMsSUFBVCxFQUFlLE9BQWYsRUFBQSxDQURGO0FBQUE7c0JBRFc7SUFBQSxDQVRiO0lBWGtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FKakIsQ0FBQTs7Ozs7QUNBQSxJQUFBLGtCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLFVBQ0EsR0FBYSxPQUFBLENBQVEseUJBQVIsQ0FEYixDQUFBOztBQUFBLE1BR00sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBRWxCO0FBQUEsSUFBQSxVQUFBLEVBQVksc0JBQVo7QUFBQSxJQUtBLElBQUEsRUFBTSxVQUxOO0FBQUEsSUFTQSxHQUFBLEVBQUssU0FBQyxLQUFELEVBQVEsR0FBUixHQUFBO0FBQ0gsTUFBQSxNQUFBLENBQU8sYUFBQSxJQUFRLEdBQUEsS0FBTyxFQUF0QixFQUEwQiwwQ0FBMUIsQ0FBQSxDQUFBO0FBRUEsTUFBQSxJQUFpQyxVQUFVLENBQUMsUUFBWCxDQUFvQixHQUFwQixDQUFqQztBQUFBLGVBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBVyxLQUFYLEVBQWtCLEdBQWxCLENBQVAsQ0FBQTtPQUZBO0FBQUEsTUFJQSxLQUFLLENBQUMsUUFBTixDQUFlLE9BQWYsQ0FKQSxDQUFBO0FBS0EsTUFBQSxJQUFHLFVBQVUsQ0FBQyxhQUFYLENBQXlCLEtBQXpCLENBQUg7ZUFDRSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixFQUF1QixHQUF2QixFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixLQUFwQixFQUEyQixHQUEzQixFQUhGO09BTkc7SUFBQSxDQVRMO0FBQUEsSUFxQkEsY0FBQSxFQUFnQixTQUFDLEtBQUQsR0FBQTthQUNkLFVBQVUsQ0FBQyxjQUFYLENBQTBCLEtBQTFCLEVBRGM7SUFBQSxDQXJCaEI7QUFBQSxJQXlCQSxNQUFBLEVBQVEsU0FBQyxLQUFELEVBQVEsSUFBUixHQUFBO0FBQ04sVUFBQSxlQUFBO0FBQUEsTUFEZ0IsT0FBRixLQUFFLElBQ2hCLENBQUE7QUFBQSxNQUFBLElBQWlGLFlBQWpGO0FBQUEsUUFBQSxTQUFBLEdBQWEsS0FBQSxHQUFoQixJQUFJLENBQUMsS0FBVyxHQUFrQixJQUFsQixHQUFoQixJQUFJLENBQUMsTUFBVyxHQUFvQyxJQUFwQyxHQUFoQixJQUFJLENBQUMsQ0FBVyxHQUFpRCxJQUFqRCxHQUFoQixJQUFJLENBQUMsQ0FBVyxHQUE4RCxHQUEzRSxDQUFBO09BQUE7YUFDQSxFQUFBLEdBQUgsSUFBQyxDQUFBLFVBQUUsR0FBa0IsQ0FBckIsU0FBQSxJQUFhLEVBQVEsQ0FBbEIsR0FBSCxNQUZTO0lBQUEsQ0F6QlI7QUFBQSxJQWlDQSxZQUFBLEVBQWMsU0FBQyxHQUFELEdBQUE7QUFDWixNQUFBLEdBQUEsR0FBTSxVQUFVLENBQUMsWUFBWCxDQUF3QixHQUF4QixDQUFOLENBQUE7YUFDQyxNQUFBLEdBQUosR0FBSSxHQUFZLElBRkQ7SUFBQSxDQWpDZDtBQUFBLElBc0NBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEVBQVEsR0FBUixHQUFBO0FBQ2QsTUFBQSxJQUEyQixVQUFVLENBQUMsUUFBWCxDQUFvQixLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsQ0FBcEIsQ0FBM0I7QUFBQSxRQUFBLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQWpCLENBQUEsQ0FBQTtPQUFBO2FBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxVQUFYLEVBQXVCLEdBQXZCLEVBRmM7SUFBQSxDQXRDaEI7QUFBQSxJQTJDQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQsRUFBUSxHQUFSLEdBQUE7YUFDbEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxrQkFBVixFQUE4QixJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsQ0FBOUIsRUFEa0I7SUFBQSxDQTNDcEI7QUFBQSxJQWdEQSxTQUFBLEVBQVcsU0FBQyxLQUFELEVBQVEsWUFBUixHQUFBO2FBQ1QsVUFBVSxDQUFDLEdBQVgsQ0FBZSxLQUFmLEVBQXNCLFlBQXRCLEVBRFM7SUFBQSxDQWhEWDtJQUZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBSGpCLENBQUE7Ozs7O0FDQUEsSUFBQSw0Q0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLFdBQ0EsR0FBYyxPQUFBLENBQVEsMkNBQVIsQ0FEZCxDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FGVCxDQUFBOztBQUFBLEdBR0EsR0FBTSxNQUFNLENBQUMsR0FIYixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRXJCLE1BQUEsOEJBQUE7O0FBQUEsRUFBQSxXQUFBLEdBQWMsQ0FBZCxDQUFBOztBQUFBLEVBQ0EsaUJBQUEsR0FBb0IsQ0FEcEIsQ0FBQTs7QUFHYSxFQUFBLHVCQUFDLElBQUQsR0FBQTtBQUNYLFFBQUEsYUFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHNCQUFBLGdCQUFnQixxQkFBQSxhQUMvQixDQUFBO0FBQUEsSUFBQSxJQUFnQyxhQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxhQUFhLENBQUMsS0FBdkIsQ0FBQTtLQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEscUJBQUQsR0FBeUIsRUFEekIsQ0FEVztFQUFBLENBSGI7O0FBQUEsMEJBU0EsS0FBQSxHQUFPLFNBQUMsYUFBRCxHQUFBO0FBQ0wsSUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQVgsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUF6QixDQUFBLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBTixDQUFBLENBRkEsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FBb0IsQ0FBQyxHQUFyQixDQUF5QjtBQUFBLE1BQUEsZ0JBQUEsRUFBa0IsTUFBbEI7S0FBekIsQ0FMaEIsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFrQixHQUFBLEdBQXJDLEdBQUcsQ0FBQyxXQUFlLENBTmhCLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxXQUFELEdBQWUsQ0FBQSxDQUFHLGNBQUEsR0FBckIsR0FBRyxDQUFDLFVBQWlCLEdBQStCLElBQWxDLENBVGYsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUNKLENBQUMsTUFESCxDQUNVLElBQUMsQ0FBQSxXQURYLENBRUUsQ0FBQyxNQUZILENBRVUsSUFBQyxDQUFBLFlBRlgsQ0FHRSxDQUFDLEdBSEgsQ0FHTyxRQUhQLEVBR2lCLFNBSGpCLENBWEEsQ0FBQTtBQWlCQSxJQUFBLElBQWdDLGtCQUFoQztBQUFBLE1BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxPQUFwQixDQUFBLENBQUE7S0FqQkE7V0FvQkEsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBckJLO0VBQUEsQ0FUUCxDQUFBOztBQUFBLDBCQW1DQSxJQUFBLEdBQU0sU0FBQyxhQUFELEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sRUFBQSxHQUFYLGFBQWEsQ0FBQyxLQUFILEdBQXlCLElBQS9CO0FBQUEsTUFDQSxHQUFBLEVBQUssRUFBQSxHQUFWLGFBQWEsQ0FBQyxLQUFKLEdBQXlCLElBRDlCO0tBREYsQ0FBQSxDQUFBO1dBSUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsY0FBRCxDQUFnQixhQUFoQixFQUxOO0VBQUEsQ0FuQ04sQ0FBQTs7QUFBQSwwQkE0Q0EsY0FBQSxHQUFnQixTQUFDLGFBQUQsR0FBQTtBQUNkLFFBQUEsaUNBQUE7QUFBQSxJQUFBLE9BQTBCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixDQUExQixFQUFFLHFCQUFBLGFBQUYsRUFBaUIsWUFBQSxJQUFqQixDQUFBO0FBQ0EsSUFBQSxJQUF3QixZQUF4QjtBQUFBLGFBQU8sTUFBUCxDQUFBO0tBREE7QUFJQSxJQUFBLElBQWtCLElBQUEsS0FBUSxJQUFDLENBQUEsV0FBWSxDQUFBLENBQUEsQ0FBdkM7QUFBQSxhQUFPLElBQUMsQ0FBQSxNQUFSLENBQUE7S0FKQTtBQUFBLElBTUEsTUFBQSxHQUFTO0FBQUEsTUFBRSxJQUFBLEVBQU0sYUFBYSxDQUFDLEtBQXRCO0FBQUEsTUFBNkIsR0FBQSxFQUFLLGFBQWEsQ0FBQyxLQUFoRDtLQU5ULENBQUE7QUFPQSxJQUFBLElBQXlDLFlBQXpDO0FBQUEsTUFBQSxNQUFBLEdBQVMsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLENBQVQsQ0FBQTtLQVBBO0FBQUEsSUFRQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBUkEsQ0FBQTtBQVVBLElBQUEsSUFBRyxnQkFBQSxtREFBK0IsQ0FBRSxlQUF0QixLQUErQixJQUFDLENBQUEsY0FBOUM7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsQ0FEQSxDQUFBO0FBVUEsYUFBTyxNQUFQLENBWEY7S0FBQSxNQUFBO0FBYUUsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBLENBREEsQ0FBQTtBQUdBLE1BQUEsSUFBTyxjQUFQO0FBQ0UsUUFBQSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBdUIsR0FBRyxDQUFDLE1BQTNCLENBQUEsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixHQUFHLENBQUMsTUFBOUIsQ0FBQSxDQUhGO09BSEE7QUFRQSxhQUFPLE1BQVAsQ0FyQkY7S0FYYztFQUFBLENBNUNoQixDQUFBOztBQUFBLDBCQStFQSxnQkFBQSxHQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixZQUFPLE1BQU0sQ0FBQyxNQUFkO0FBQUEsV0FDTyxXQURQO0FBRUksUUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkIsQ0FBQSxDQUFBO2VBQ0EsSUFBQyxDQUFBLHdCQUFELENBQUEsRUFISjtBQUFBLFdBSU8sV0FKUDtBQUtJLFFBQUEsSUFBQyxDQUFBLGdDQUFELENBQWtDLE1BQU0sQ0FBQyxJQUF6QyxDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBQSxDQUFFLE1BQU0sQ0FBQyxJQUFULENBQW5CLEVBTko7QUFBQSxXQU9PLE1BUFA7QUFRSSxRQUFBLElBQUMsQ0FBQSxnQ0FBRCxDQUFrQyxNQUFNLENBQUMsSUFBekMsQ0FBQSxDQUFBO2VBQ0EsSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQUEsQ0FBRSxNQUFNLENBQUMsSUFBVCxDQUFuQixFQVRKO0FBQUEsS0FEZ0I7RUFBQSxDQS9FbEIsQ0FBQTs7QUFBQSwwQkE0RkEsaUJBQUEsR0FBbUIsU0FBQyxNQUFELEdBQUE7QUFDakIsUUFBQSxZQUFBO0FBQUEsSUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLEtBQW1CLFFBQXRCO0FBQ0UsTUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFyQixDQUFBLENBQVQsQ0FBQTtBQUVBLE1BQUEsSUFBRyxjQUFIO0FBQ0UsUUFBQSxJQUFHLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLElBQUMsQ0FBQSxjQUFwQjtBQUNFLFVBQUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsT0FBbEIsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQixDQUFQLENBRkY7U0FBQTtlQUlBLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixNQUE3QixFQUFxQyxNQUFNLENBQUMsYUFBNUMsRUFMRjtPQUFBLE1BQUE7ZUFPRSxJQUFDLENBQUEsZ0NBQUQsQ0FBa0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBaEUsRUFQRjtPQUhGO0tBQUEsTUFBQTtBQVlFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBckIsQ0FBQSxDQUFQLENBQUE7QUFDQSxNQUFBLElBQUcsWUFBSDtBQUNFLFFBQUEsSUFBRyxJQUFJLENBQUMsS0FBTCxLQUFjLElBQUMsQ0FBQSxjQUFsQjtBQUNFLFVBQUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsUUFBbEIsQ0FBQTtBQUNBLGlCQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQixDQUFQLENBRkY7U0FBQTtlQUlBLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixNQUFNLENBQUMsYUFBcEMsRUFBbUQsSUFBbkQsRUFMRjtPQUFBLE1BQUE7ZUFPRSxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBMUQsRUFQRjtPQWJGO0tBRGlCO0VBQUEsQ0E1Rm5CLENBQUE7O0FBQUEsMEJBb0hBLDJCQUFBLEdBQTZCLFNBQUMsS0FBRCxFQUFRLEtBQVIsR0FBQTtBQUMzQixRQUFBLG1CQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sR0FBRyxDQUFDLDZCQUFKLENBQWtDLEtBQUssQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUE5QyxDQUFQLENBQUE7QUFBQSxJQUNBLElBQUEsR0FBTyxHQUFHLENBQUMsNkJBQUosQ0FBa0MsS0FBSyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQTlDLENBRFAsQ0FBQTtBQUFBLElBR0EsT0FBQSxHQUFhLElBQUksQ0FBQyxHQUFMLEdBQVcsSUFBSSxDQUFDLE1BQW5CLEdBQ1IsQ0FBQyxJQUFJLENBQUMsR0FBTCxHQUFXLElBQUksQ0FBQyxNQUFqQixDQUFBLEdBQTJCLENBRG5CLEdBR1IsQ0FORixDQUFBO1dBUUEsSUFBQyxDQUFBLFVBQUQsQ0FDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLElBQUksQ0FBQyxJQUFYO0FBQUEsTUFDQSxHQUFBLEVBQUssSUFBSSxDQUFDLE1BQUwsR0FBYyxPQURuQjtBQUFBLE1BRUEsS0FBQSxFQUFPLElBQUksQ0FBQyxLQUZaO0tBREYsRUFUMkI7RUFBQSxDQXBIN0IsQ0FBQTs7QUFBQSwwQkFtSUEsZ0NBQUEsR0FBa0MsU0FBQyxJQUFELEdBQUE7QUFDaEMsUUFBQSxlQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsVUFBaEIsRUFBNEIsS0FBNUIsQ0FGQSxDQUFBO0FBQUEsSUFHQSxHQUFBLEdBQU0sR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQWxDLENBSE4sQ0FBQTtBQUFBLElBSUEsVUFBQSxHQUFhLFFBQUEsQ0FBUyxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsR0FBUixDQUFZLGFBQVosQ0FBVCxDQUFBLElBQXdDLENBSnJELENBQUE7V0FLQSxJQUFDLENBQUEsVUFBRCxDQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sR0FBRyxDQUFDLElBQVY7QUFBQSxNQUNBLEdBQUEsRUFBSyxHQUFHLENBQUMsR0FBSixHQUFVLGlCQUFWLEdBQThCLFVBRG5DO0FBQUEsTUFFQSxLQUFBLEVBQU8sR0FBRyxDQUFDLEtBRlg7S0FERixFQU5nQztFQUFBLENBbklsQyxDQUFBOztBQUFBLDBCQStJQSwwQkFBQSxHQUE0QixTQUFDLElBQUQsR0FBQTtBQUMxQixRQUFBLGtCQUFBO0FBQUEsSUFBQSxJQUFjLFlBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsU0FBaEIsRUFBMkIsUUFBM0IsQ0FGQSxDQUFBO0FBQUEsSUFHQSxHQUFBLEdBQU0sR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQWxDLENBSE4sQ0FBQTtBQUFBLElBSUEsYUFBQSxHQUFnQixRQUFBLENBQVMsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLEdBQVIsQ0FBWSxnQkFBWixDQUFULENBQUEsSUFBMkMsQ0FKM0QsQ0FBQTtXQUtBLElBQUMsQ0FBQSxVQUFELENBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxHQUFHLENBQUMsSUFBVjtBQUFBLE1BQ0EsR0FBQSxFQUFLLEdBQUcsQ0FBQyxNQUFKLEdBQWEsaUJBQWIsR0FBaUMsYUFEdEM7QUFBQSxNQUVBLEtBQUEsRUFBTyxHQUFHLENBQUMsS0FGWDtLQURGLEVBTjBCO0VBQUEsQ0EvSTVCLENBQUE7O0FBQUEsMEJBMkpBLFVBQUEsR0FBWSxTQUFDLElBQUQsR0FBQTtBQUNWLFFBQUEsdUJBQUE7QUFBQSxJQURhLFlBQUEsTUFBTSxXQUFBLEtBQUssYUFBQSxLQUN4QixDQUFBO0FBQUEsSUFBQSxJQUFHLHNCQUFIO0FBRUUsTUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUE3QixDQUFSLENBQUE7QUFBQSxNQUNBLEdBQUEsSUFBTyxLQUFLLENBQUMsU0FBTixDQUFBLENBRFAsQ0FBQTtBQUFBLE1BRUEsSUFBQSxJQUFRLEtBQUssQ0FBQyxVQUFOLENBQUEsQ0FGUixDQUFBO0FBQUEsTUFLQSxJQUFBLElBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUxuQixDQUFBO0FBQUEsTUFNQSxHQUFBLElBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQU5sQixDQUFBO0FBQUEsTUFjQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUI7QUFBQSxRQUFBLFFBQUEsRUFBVSxPQUFWO09BQWpCLENBZEEsQ0FGRjtLQUFBLE1BQUE7QUFvQkUsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUI7QUFBQSxRQUFBLFFBQUEsRUFBVSxVQUFWO09BQWpCLENBQUEsQ0FwQkY7S0FBQTtXQXNCQSxJQUFDLENBQUEsV0FDRCxDQUFDLEdBREQsQ0FFRTtBQUFBLE1BQUEsSUFBQSxFQUFPLEVBQUEsR0FBWixJQUFZLEdBQVUsSUFBakI7QUFBQSxNQUNBLEdBQUEsRUFBTyxFQUFBLEdBQVosR0FBWSxHQUFTLElBRGhCO0FBQUEsTUFFQSxLQUFBLEVBQU8sRUFBQSxHQUFaLEtBQVksR0FBVyxJQUZsQjtLQUZGLENBS0EsQ0FBQyxJQUxELENBQUEsRUF2QlU7RUFBQSxDQTNKWixDQUFBOztBQUFBLDBCQTBMQSxTQUFBLEdBQVcsU0FBQyxJQUFELEVBQU8sUUFBUCxHQUFBO0FBQ1QsUUFBQSxLQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsQ0FBYyxXQUFBLElBQWUsY0FBN0IsQ0FBQTtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FEUixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsYUFBRCxHQUFpQixLQUZqQixDQUFBO0FBSUEsSUFBQSxJQUFHLFFBQUEsS0FBWSxLQUFmO2FBQ0UsS0FBSyxDQUFDLEdBQU4sQ0FBVTtBQUFBLFFBQUEsU0FBQSxFQUFZLGVBQUEsR0FBM0IsV0FBMkIsR0FBNkIsS0FBekM7T0FBVixFQURGO0tBQUEsTUFBQTthQUdFLEtBQUssQ0FBQyxHQUFOLENBQVU7QUFBQSxRQUFBLFNBQUEsRUFBWSxnQkFBQSxHQUEzQixXQUEyQixHQUE4QixLQUExQztPQUFWLEVBSEY7S0FMUztFQUFBLENBMUxYLENBQUE7O0FBQUEsMEJBcU1BLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLElBQUEsSUFBRywwQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CO0FBQUEsUUFBQSxTQUFBLEVBQVcsRUFBWDtPQUFuQixDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixPQUZuQjtLQURhO0VBQUEsQ0FyTWYsQ0FBQTs7QUFBQSwwQkEyTUEsaUJBQUEsR0FBbUIsU0FBQyxVQUFELEdBQUE7QUFDakIsUUFBQSxhQUFBO0FBQUEsSUFBQSxJQUFHLFVBQVcsQ0FBQSxDQUFBLENBQVgsS0FBaUIsSUFBQyxDQUFBLHFCQUFzQixDQUFBLENBQUEsQ0FBM0M7O2FBQ3dCLENBQUMsWUFBYSxHQUFHLENBQUM7T0FBeEM7QUFBQSxNQUNBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixVQUR6QixDQUFBOzBGQUVzQixDQUFDLFNBQVUsR0FBRyxDQUFDLDZCQUh2QztLQURpQjtFQUFBLENBM01uQixDQUFBOztBQUFBLDBCQWtOQSx3QkFBQSxHQUEwQixTQUFBLEdBQUE7QUFDeEIsUUFBQSxLQUFBOztXQUFzQixDQUFDLFlBQWEsR0FBRyxDQUFDO0tBQXhDO1dBQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCLEdBRkQ7RUFBQSxDQWxOMUIsQ0FBQTs7QUFBQSwwQkF5TkEsa0JBQUEsR0FBb0IsU0FBQyxhQUFELEdBQUE7QUFDbEIsUUFBQSxJQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sTUFBUCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUN2QixZQUFBLHNCQUFBO0FBQUEsUUFBRSx3QkFBQSxPQUFGLEVBQVcsd0JBQUEsT0FBWCxDQUFBO0FBRUEsUUFBQSxJQUFHLGlCQUFBLElBQVksaUJBQWY7QUFDRSxVQUFBLElBQUEsR0FBTyxLQUFDLENBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZixDQUFnQyxPQUFoQyxFQUF5QyxPQUF6QyxDQUFQLENBREY7U0FGQTtBQUtBLFFBQUEsb0JBQUcsSUFBSSxDQUFFLGtCQUFOLEtBQWtCLFFBQXJCO2lCQUNFLE9BQTBCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixFQUF3QixhQUF4QixDQUExQixFQUFFLHFCQUFBLGFBQUYsRUFBaUIsWUFBQSxJQUFqQixFQUFBLEtBREY7U0FBQSxNQUFBO2lCQUdFLEtBQUMsQ0FBQSxTQUFELEdBQWEsT0FIZjtTQU51QjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCLENBREEsQ0FBQTtXQVlBO0FBQUEsTUFBRSxlQUFBLGFBQUY7QUFBQSxNQUFpQixNQUFBLElBQWpCO01BYmtCO0VBQUEsQ0F6TnBCLENBQUE7O0FBQUEsMEJBeU9BLGdCQUFBLEdBQWtCLFNBQUMsVUFBRCxFQUFhLGFBQWIsR0FBQTtBQUNoQixRQUFBLDBCQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhLEdBQUEsR0FBTSxVQUFVLENBQUMscUJBQVgsQ0FBQSxDQUFuQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsR0FBb0IsVUFBVSxDQUFDLGFBRC9CLENBQUE7QUFBQSxJQUVBLFFBQUEsR0FBVyxVQUFVLENBQUMsZUFGdEIsQ0FBQTtBQUFBLElBR0EsS0FBQSxHQUFRLENBQUEsQ0FBRSxRQUFRLENBQUMsSUFBWCxDQUhSLENBQUE7QUFBQSxJQUtBLGFBQWEsQ0FBQyxPQUFkLElBQXlCLEdBQUcsQ0FBQyxJQUw3QixDQUFBO0FBQUEsSUFNQSxhQUFhLENBQUMsT0FBZCxJQUF5QixHQUFHLENBQUMsR0FON0IsQ0FBQTtBQUFBLElBT0EsYUFBYSxDQUFDLEtBQWQsR0FBc0IsYUFBYSxDQUFDLE9BQWQsR0FBd0IsS0FBSyxDQUFDLFVBQU4sQ0FBQSxDQVA5QyxDQUFBO0FBQUEsSUFRQSxhQUFhLENBQUMsS0FBZCxHQUFzQixhQUFhLENBQUMsT0FBZCxHQUF3QixLQUFLLENBQUMsU0FBTixDQUFBLENBUjlDLENBQUE7QUFBQSxJQVNBLElBQUEsR0FBTyxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsYUFBYSxDQUFDLE9BQXhDLEVBQWlELGFBQWEsQ0FBQyxPQUEvRCxDQVRQLENBQUE7V0FXQTtBQUFBLE1BQUUsZUFBQSxhQUFGO0FBQUEsTUFBaUIsTUFBQSxJQUFqQjtNQVpnQjtFQUFBLENBek9sQixDQUFBOztBQUFBLDBCQTBQQSx1QkFBQSxHQUF5QixTQUFDLFFBQUQsR0FBQTtBQUl2QixJQUFBLElBQUcsV0FBQSxDQUFZLG1CQUFaLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUFrQjtBQUFBLFFBQUEsZ0JBQUEsRUFBa0IsTUFBbEI7T0FBbEIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxRQUFBLENBQUEsQ0FEQSxDQUFBO2FBRUEsSUFBQyxDQUFBLFlBQVksQ0FBQyxHQUFkLENBQWtCO0FBQUEsUUFBQSxnQkFBQSxFQUFrQixNQUFsQjtPQUFsQixFQUhGO0tBQUEsTUFBQTtBQUtFLE1BQUEsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQSxDQURBLENBQUE7QUFBQSxNQUVBLFFBQUEsQ0FBQSxDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFBLENBSEEsQ0FBQTthQUlBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFBLEVBVEY7S0FKdUI7RUFBQSxDQTFQekIsQ0FBQTs7QUFBQSwwQkEyUUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsSUFBRyxtQkFBSDtBQUNFLE1BQUEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsTUFBZixDQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQTFCLENBQStCLElBQUMsQ0FBQSxjQUFoQyxFQUZGO0tBQUEsTUFBQTtBQUFBO0tBREk7RUFBQSxDQTNRTixDQUFBOztBQUFBLDBCQW9SQSxZQUFBLEdBQWMsU0FBQyxNQUFELEdBQUE7QUFDWixRQUFBLDRDQUFBO0FBQUEsWUFBTyxNQUFNLENBQUMsTUFBZDtBQUFBLFdBQ08sV0FEUDtBQUVJLFFBQUEsYUFBQSxHQUFnQixNQUFNLENBQUMsYUFBdkIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxNQUFNLENBQUMsUUFBUCxLQUFtQixRQUF0QjtpQkFDRSxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQXBCLENBQTJCLElBQUMsQ0FBQSxjQUE1QixFQURGO1NBQUEsTUFBQTtpQkFHRSxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQXBCLENBQTBCLElBQUMsQ0FBQSxjQUEzQixFQUhGO1NBSEo7QUFDTztBQURQLFdBT08sV0FQUDtBQVFJLFFBQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsYUFBYSxDQUFDLEtBQXRDLENBQUE7ZUFDQSxjQUFjLENBQUMsTUFBZixDQUFzQixNQUFNLENBQUMsYUFBN0IsRUFBNEMsSUFBQyxDQUFBLGNBQTdDLEVBVEo7QUFBQSxXQVVPLE1BVlA7QUFXSSxRQUFBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLGFBQXZCLENBQUE7ZUFDQSxhQUFhLENBQUMsT0FBZCxDQUFzQixJQUFDLENBQUEsY0FBdkIsRUFaSjtBQUFBLEtBRFk7RUFBQSxDQXBSZCxDQUFBOztBQUFBLDBCQXVTQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsSUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFKO0FBR0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLHdCQUFELENBQUEsQ0FEQSxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFaLENBQWdCLFFBQWhCLEVBQTBCLEVBQTFCLENBRkEsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUF6QixDQUFBLENBSEEsQ0FBQTtBQUlBLE1BQUEsSUFBbUMsa0JBQW5DO0FBQUEsUUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsR0FBRyxDQUFDLE9BQXZCLENBQUEsQ0FBQTtPQUpBO0FBQUEsTUFLQSxHQUFHLENBQUMsc0JBQUosQ0FBQSxDQUxBLENBQUE7QUFBQSxNQVFBLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBZCxDQUFBLENBUkEsQ0FBQTthQVNBLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixDQUFBLEVBWkY7S0FESztFQUFBLENBdlNQLENBQUE7O0FBQUEsMEJBdVRBLGlCQUFBLEdBQW1CLFNBQUEsR0FBQTtBQUNqQixRQUFBLDRDQUFBO0FBQUEsSUFBQSxvQkFBQSxHQUF1QixDQUF2QixDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQ0osZUFBQSxHQUFDLEdBQUcsQ0FBQyxrQkFBTCxHQUF1Qyx1QkFBdkMsR0FDQyxHQUFHLENBQUMseUJBREwsR0FDMkMsV0FEM0MsR0FDQyxvQkFERCxHQUVpQixzQ0FKYixDQUFBO1dBVUEsWUFBQSxHQUFlLENBQUEsQ0FBRSxRQUFGLENBQ2IsQ0FBQyxHQURZLENBQ1I7QUFBQSxNQUFBLFFBQUEsRUFBVSxVQUFWO0tBRFEsRUFYRTtFQUFBLENBdlRuQixDQUFBOzt1QkFBQTs7SUFQRixDQUFBOzs7OztBQ0FBLElBQUEsY0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FEVCxDQUFBOztBQUFBLEdBRUEsR0FBTSxNQUFNLENBQUMsR0FGYixDQUFBOztBQUFBLE1BUU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO0FBQ2xCLE1BQUEsNEJBQUE7QUFBQSxFQUFBLGNBQUEsR0FBcUIsSUFBQSxNQUFBLENBQVEsU0FBQSxHQUE5QixHQUFHLENBQUMsU0FBMEIsR0FBeUIsU0FBakMsQ0FBckIsQ0FBQTtBQUFBLEVBQ0EsWUFBQSxHQUFtQixJQUFBLE1BQUEsQ0FBUSxTQUFBLEdBQTVCLEdBQUcsQ0FBQyxPQUF3QixHQUF1QixTQUEvQixDQURuQixDQUFBO1NBS0E7QUFBQSxJQUFBLGlCQUFBLEVBQW1CLFNBQUMsSUFBRCxHQUFBO0FBQ2pCLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUVBLGFBQU0sSUFBQSxJQUFRLElBQUksQ0FBQyxRQUFMLEtBQWlCLENBQS9CLEdBQUE7QUFDRSxRQUFBLElBQUcsY0FBYyxDQUFDLElBQWYsQ0FBb0IsSUFBSSxDQUFDLFNBQXpCLENBQUg7QUFDRSxVQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsQ0FBUCxDQUFBO0FBQ0EsaUJBQU8sSUFBUCxDQUZGO1NBQUE7QUFBQSxRQUlBLElBQUEsR0FBTyxJQUFJLENBQUMsVUFKWixDQURGO01BQUEsQ0FGQTtBQVNBLGFBQU8sTUFBUCxDQVZpQjtJQUFBLENBQW5CO0FBQUEsSUFhQSxlQUFBLEVBQWlCLFNBQUMsSUFBRCxHQUFBO0FBQ2YsVUFBQSxXQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsQ0FBUCxDQUFBO0FBRUEsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUNFLFFBQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQWQsQ0FBQTtBQUNBLFFBQUEsSUFBc0IsV0FBdEI7QUFBQSxpQkFBTyxXQUFQLENBQUE7U0FEQTtBQUFBLFFBR0EsSUFBQSxHQUFPLElBQUksQ0FBQyxVQUhaLENBREY7TUFBQSxDQUZBO0FBUUEsYUFBTyxNQUFQLENBVGU7SUFBQSxDQWJqQjtBQUFBLElBeUJBLGNBQUEsRUFBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxVQUFBLHVDQUFBO0FBQUE7QUFBQSxXQUFBLHFCQUFBO2tDQUFBO0FBQ0UsUUFBQSxJQUFZLENBQUEsR0FBTyxDQUFDLGdCQUFwQjtBQUFBLG1CQUFBO1NBQUE7QUFBQSxRQUVBLGFBQUEsR0FBZ0IsR0FBRyxDQUFDLFlBRnBCLENBQUE7QUFHQSxRQUFBLElBQUcsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsYUFBbEIsQ0FBSDtBQUNFLGlCQUFPO0FBQUEsWUFDTCxXQUFBLEVBQWEsYUFEUjtBQUFBLFlBRUwsUUFBQSxFQUFVLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBRkw7V0FBUCxDQURGO1NBSkY7QUFBQSxPQUFBO0FBVUEsYUFBTyxNQUFQLENBWGM7SUFBQSxDQXpCaEI7QUFBQSxJQXdDQSxhQUFBLEVBQWUsU0FBQyxJQUFELEdBQUE7QUFDYixVQUFBLGtDQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsQ0FBUCxDQUFBO0FBQUEsTUFDQSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFlBRDVDLENBQUE7QUFHQSxhQUFNLElBQUEsSUFBUSxJQUFJLENBQUMsUUFBTCxLQUFpQixDQUEvQixHQUFBO0FBQ0UsUUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLGFBQWxCLENBQUg7QUFDRSxVQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsYUFBbEIsQ0FBaEIsQ0FBQTtBQUNBLFVBQUEsSUFBRyxDQUFBLFlBQWdCLENBQUMsSUFBYixDQUFrQixJQUFJLENBQUMsU0FBdkIsQ0FBUDtBQUNFLFlBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQUFQLENBREY7V0FEQTtBQUlBLGlCQUFPO0FBQUEsWUFDTCxJQUFBLEVBQU0sSUFERDtBQUFBLFlBRUwsYUFBQSxFQUFlLGFBRlY7QUFBQSxZQUdMLGFBQUEsRUFBZSxJQUhWO1dBQVAsQ0FMRjtTQUFBO0FBQUEsUUFXQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBWFosQ0FERjtNQUFBLENBSEE7YUFpQkEsR0FsQmE7SUFBQSxDQXhDZjtBQUFBLElBNkRBLFlBQUEsRUFBYyxTQUFDLElBQUQsR0FBQTtBQUNaLFVBQUEsb0JBQUE7QUFBQSxNQUFBLFNBQUEsR0FBWSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUFwQyxDQUFBO0FBQ0EsTUFBQSxJQUFHLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQWxCLENBQUg7QUFDRSxRQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFsQixDQUFaLENBQUE7QUFDQSxlQUFPLFNBQVAsQ0FGRjtPQUZZO0lBQUEsQ0E3RGQ7QUFBQSxJQW9FQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixVQUFBLHlCQUFBO0FBQUEsTUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBbEMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixRQUFsQixDQUFIO0FBQ0UsUUFBQSxlQUFBLEdBQWtCLElBQUksQ0FBQyxZQUFMLENBQWtCLFFBQWxCLENBQWxCLENBQUE7QUFDQSxlQUFPLGVBQVAsQ0FGRjtPQUZrQjtJQUFBLENBcEVwQjtBQUFBLElBMkVBLGVBQUEsRUFBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixVQUFBLHVCQUFBO0FBQUEsTUFBQSxZQUFBLEdBQWUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFBMUMsQ0FBQTtBQUNBLE1BQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQixDQUFIO0FBQ0UsUUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFlBQUwsQ0FBa0IsWUFBbEIsQ0FBWixDQUFBO0FBQ0EsZUFBTyxZQUFQLENBRkY7T0FGZTtJQUFBLENBM0VqQjtBQUFBLElBa0ZBLFVBQUEsRUFBWSxTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDVixVQUFBLDhDQUFBO0FBQUEsTUFEbUIsV0FBQSxLQUFLLFlBQUEsSUFDeEIsQ0FBQTtBQUFBLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLENBQVAsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxZQUQ1QyxDQUFBO0FBR0EsYUFBTSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsS0FBaUIsQ0FBL0IsR0FBQTtBQUVFLFFBQUEsSUFBRyxJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQUFIO0FBQ0UsVUFBQSxvQkFBQSxHQUF1QixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBckIsRUFBMkI7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQTNCLENBQXZCLENBQUE7QUFDQSxVQUFBLElBQUcsNEJBQUg7QUFDRSxtQkFBTyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsb0JBQTNCLENBQVAsQ0FERjtXQUFBLE1BQUE7QUFHRSxtQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsQ0FBUCxDQUhGO1dBRkY7U0FBQSxNQVFLLElBQUcsY0FBYyxDQUFDLElBQWYsQ0FBb0IsSUFBSSxDQUFDLFNBQXpCLENBQUg7QUFDSCxpQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFBQSxZQUFFLEtBQUEsR0FBRjtBQUFBLFlBQU8sTUFBQSxJQUFQO1dBQTFCLENBQVAsQ0FERztTQUFBLE1BSUEsSUFBRyxZQUFZLENBQUMsSUFBYixDQUFrQixJQUFJLENBQUMsU0FBdkIsQ0FBSDtBQUNILFVBQUEsb0JBQUEsR0FBdUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQXJCLEVBQTJCO0FBQUEsWUFBRSxLQUFBLEdBQUY7QUFBQSxZQUFPLE1BQUEsSUFBUDtXQUEzQixDQUF2QixDQUFBO0FBQ0EsVUFBQSxJQUFHLDRCQUFIO0FBQ0UsbUJBQU8sSUFBQyxDQUFBLHlCQUFELENBQTJCLG9CQUEzQixDQUFQLENBREY7V0FBQSxNQUFBO0FBR0UsbUJBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmLENBQVAsQ0FIRjtXQUZHO1NBWkw7QUFBQSxRQW1CQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBbkJaLENBRkY7TUFBQSxDQUpVO0lBQUEsQ0FsRlo7QUFBQSxJQThHQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDbEIsVUFBQSxtQkFBQTtBQUFBLE1BRDJCLFdBQUEsS0FBSyxZQUFBLE1BQU0sZ0JBQUEsUUFDdEMsQ0FBQTthQUFBO0FBQUEsUUFBQSxNQUFBLEVBQVEsV0FBUjtBQUFBLFFBQ0EsYUFBQSxFQUFlLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixDQURmO0FBQUEsUUFFQSxRQUFBLEVBQVUsUUFBQSxJQUFZLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixJQUF4QixFQUE4QjtBQUFBLFVBQUUsS0FBQSxHQUFGO0FBQUEsVUFBTyxNQUFBLElBQVA7U0FBOUIsQ0FGdEI7UUFEa0I7SUFBQSxDQTlHcEI7QUFBQSxJQW9IQSx5QkFBQSxFQUEyQixTQUFDLG9CQUFELEdBQUE7QUFDekIsVUFBQSxjQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sb0JBQW9CLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBbEMsQ0FBQTtBQUFBLE1BQ0EsUUFBQSxHQUFXLG9CQUFvQixDQUFDLFFBRGhDLENBQUE7YUFFQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFBQSxRQUFFLFVBQUEsUUFBRjtPQUExQixFQUh5QjtJQUFBLENBcEgzQjtBQUFBLElBMEhBLGtCQUFBLEVBQW9CLFNBQUMsSUFBRCxHQUFBO0FBQ2xCLFVBQUEsNEJBQUE7QUFBQSxNQUFBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFBNUMsQ0FBQTtBQUFBLE1BQ0EsYUFBQSxHQUFnQixJQUFJLENBQUMsWUFBTCxDQUFrQixhQUFsQixDQURoQixDQUFBO2FBR0E7QUFBQSxRQUFBLE1BQUEsRUFBUSxXQUFSO0FBQUEsUUFDQSxJQUFBLEVBQU0sSUFETjtBQUFBLFFBRUEsYUFBQSxFQUFlLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixDQUZmO0FBQUEsUUFHQSxhQUFBLEVBQWUsYUFIZjtRQUprQjtJQUFBLENBMUhwQjtBQUFBLElBb0lBLGFBQUEsRUFBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFVBQUEsYUFBQTtBQUFBLE1BQUEsYUFBQSxHQUFnQixDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsSUFBUixDQUFhLGVBQWIsQ0FBaEIsQ0FBQTthQUVBO0FBQUEsUUFBQSxNQUFBLEVBQVEsTUFBUjtBQUFBLFFBQ0EsSUFBQSxFQUFNLElBRE47QUFBQSxRQUVBLGFBQUEsRUFBZSxhQUZmO1FBSGE7SUFBQSxDQXBJZjtBQUFBLElBOElBLHNCQUFBLEVBQXdCLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUN0QixVQUFBLGlEQUFBO0FBQUEsTUFEK0IsV0FBQSxLQUFLLFlBQUEsSUFDcEMsQ0FBQTtBQUFBLE1BQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLE1BQ0EsT0FBQSxHQUFVLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FBYyxDQUFDLEdBRHpCLENBQUE7QUFBQSxNQUVBLFVBQUEsR0FBYSxLQUFLLENBQUMsV0FBTixDQUFBLENBRmIsQ0FBQTtBQUFBLE1BR0EsVUFBQSxHQUFhLE9BQUEsR0FBVSxVQUh2QixDQUFBO0FBS0EsTUFBQSxJQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixFQUFlLE9BQWYsQ0FBQSxHQUEwQixJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxVQUFmLENBQTdCO2VBQ0UsU0FERjtPQUFBLE1BQUE7ZUFHRSxRQUhGO09BTnNCO0lBQUEsQ0E5SXhCO0FBQUEsSUEySkEsbUJBQUEsRUFBcUIsU0FBQyxTQUFELEVBQVksSUFBWixHQUFBO0FBQ25CLFVBQUEsaURBQUE7QUFBQSxNQURpQyxXQUFBLEtBQUssWUFBQSxJQUN0QyxDQUFBO0FBQUEsTUFBQSxXQUFBLEdBQWMsQ0FBQSxDQUFFLFNBQUYsQ0FBWSxDQUFDLElBQWIsQ0FBbUIsR0FBQSxHQUFwQyxHQUFHLENBQUMsU0FBYSxDQUFkLENBQUE7QUFBQSxNQUNBLE9BQUEsR0FBVSxNQURWLENBQUE7QUFBQSxNQUVBLGdCQUFBLEdBQW1CLE1BRm5CLENBQUE7QUFBQSxNQUlBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsRUFBUSxJQUFSLEdBQUE7QUFDZixjQUFBLHNDQUFBO0FBQUEsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsVUFDQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBQSxDQUFjLENBQUMsR0FEekIsQ0FBQTtBQUFBLFVBRUEsVUFBQSxHQUFhLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FGYixDQUFBO0FBQUEsVUFHQSxVQUFBLEdBQWEsT0FBQSxHQUFVLFVBSHZCLENBQUE7QUFLQSxVQUFBLElBQU8saUJBQUosSUFBZ0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFBLEdBQTBCLE9BQTdDO0FBQ0UsWUFBQSxPQUFBLEdBQVUsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsT0FBZixDQUFWLENBQUE7QUFBQSxZQUNBLGdCQUFBLEdBQW1CO0FBQUEsY0FBRSxPQUFBLEtBQUY7QUFBQSxjQUFTLFFBQUEsRUFBVSxRQUFuQjthQURuQixDQURGO1dBTEE7QUFRQSxVQUFBLElBQU8saUJBQUosSUFBZ0IsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsVUFBZixDQUFBLEdBQTZCLE9BQWhEO0FBQ0UsWUFBQSxPQUFBLEdBQVUsS0FBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLEVBQWUsVUFBZixDQUFWLENBQUE7bUJBQ0EsZ0JBQUEsR0FBbUI7QUFBQSxjQUFFLE9BQUEsS0FBRjtBQUFBLGNBQVMsUUFBQSxFQUFVLE9BQW5CO2NBRnJCO1dBVGU7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQixDQUpBLENBQUE7YUFpQkEsaUJBbEJtQjtJQUFBLENBM0pyQjtBQUFBLElBZ0xBLFFBQUEsRUFBVSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDUixNQUFBLElBQUcsQ0FBQSxHQUFJLENBQVA7ZUFBYyxDQUFBLEdBQUksRUFBbEI7T0FBQSxNQUFBO2VBQXlCLENBQUEsR0FBSSxFQUE3QjtPQURRO0lBQUEsQ0FoTFY7QUFBQSxJQXNMQSx1QkFBQSxFQUF5QixTQUFDLElBQUQsR0FBQTtBQUN2QixVQUFBLCtEQUFBO0FBQUEsTUFBQSxJQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBZCxHQUErQixDQUFsQztBQUNFO0FBQUE7YUFBQSxZQUFBOzRCQUFBO0FBQ0UsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQ0EsVUFBQSxJQUFZLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBRyxDQUFDLGtCQUFuQixDQUFaO0FBQUEscUJBQUE7V0FEQTtBQUFBLFVBRUEsT0FBQSxHQUFVLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FGVixDQUFBO0FBQUEsVUFHQSxZQUFBLEdBQWUsT0FBTyxDQUFDLE1BQVIsQ0FBQSxDQUhmLENBQUE7QUFBQSxVQUlBLEtBQUEsR0FBUSxLQUFLLENBQUMsV0FBTixDQUFrQixJQUFsQixDQUFBLEdBQTBCLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FKbEMsQ0FBQTtBQUFBLFVBS0EsS0FBSyxDQUFDLE1BQU4sQ0FBYSxZQUFBLEdBQWUsS0FBNUIsQ0FMQSxDQUFBO0FBQUEsd0JBTUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxHQUFHLENBQUMsa0JBQW5CLEVBTkEsQ0FERjtBQUFBO3dCQURGO09BRHVCO0lBQUEsQ0F0THpCO0FBQUEsSUFvTUEsc0JBQUEsRUFBd0IsU0FBQSxHQUFBO2FBQ3RCLENBQUEsQ0FBRyxHQUFBLEdBQU4sR0FBRyxDQUFDLGtCQUFELENBQ0UsQ0FBQyxHQURILENBQ08sUUFEUCxFQUNpQixFQURqQixDQUVFLENBQUMsV0FGSCxDQUVlLEdBQUcsQ0FBQyxrQkFGbkIsRUFEc0I7SUFBQSxDQXBNeEI7QUFBQSxJQTBNQSxjQUFBLEVBQWdCLFNBQUMsSUFBRCxHQUFBO0FBQ2QsTUFBQSxtQkFBRyxJQUFJLENBQUUsZUFBVDtlQUNFLElBQUssQ0FBQSxDQUFBLEVBRFA7T0FBQSxNQUVLLG9CQUFHLElBQUksQ0FBRSxrQkFBTixLQUFrQixDQUFyQjtlQUNILElBQUksQ0FBQyxXQURGO09BQUEsTUFBQTtlQUdILEtBSEc7T0FIUztJQUFBLENBMU1oQjtBQUFBLElBcU5BLGdCQUFBLEVBQWtCLFNBQUMsSUFBRCxHQUFBO2FBQ2hCLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxJQUFSLENBQWEsZUFBYixFQURnQjtJQUFBLENBck5sQjtBQUFBLElBMk5BLDZCQUFBLEVBQStCLFNBQUMsSUFBRCxHQUFBO0FBQzdCLFVBQUEsbUNBQUE7QUFBQSxNQUFBLEdBQUEsR0FBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQXpCLENBQUE7QUFBQSxNQUNBLE9BQXVCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixHQUFuQixDQUF2QixFQUFFLGVBQUEsT0FBRixFQUFXLGVBQUEsT0FEWCxDQUFBO0FBQUEsTUFJQSxNQUFBLEdBQVMsSUFBSSxDQUFDLHFCQUFMLENBQUEsQ0FKVCxDQUFBO0FBQUEsTUFLQSxNQUFBLEdBQ0U7QUFBQSxRQUFBLEdBQUEsRUFBSyxNQUFNLENBQUMsR0FBUCxHQUFhLE9BQWxCO0FBQUEsUUFDQSxNQUFBLEVBQVEsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsT0FEeEI7QUFBQSxRQUVBLElBQUEsRUFBTSxNQUFNLENBQUMsSUFBUCxHQUFjLE9BRnBCO0FBQUEsUUFHQSxLQUFBLEVBQU8sTUFBTSxDQUFDLEtBQVAsR0FBZSxPQUh0QjtPQU5GLENBQUE7QUFBQSxNQVdBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE1BQU0sQ0FBQyxHQVh2QyxDQUFBO0FBQUEsTUFZQSxNQUFNLENBQUMsS0FBUCxHQUFlLE1BQU0sQ0FBQyxLQUFQLEdBQWUsTUFBTSxDQUFDLElBWnJDLENBQUE7YUFjQSxPQWY2QjtJQUFBLENBM04vQjtBQUFBLElBNk9BLGlCQUFBLEVBQW1CLFNBQUMsR0FBRCxHQUFBO2FBRWpCO0FBQUEsUUFBQSxPQUFBLEVBQWEsR0FBRyxDQUFDLFdBQUosS0FBbUIsTUFBdkIsR0FBdUMsR0FBRyxDQUFDLFdBQTNDLEdBQTRELENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFiLElBQWdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQWxELElBQWdFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBOUUsQ0FBbUYsQ0FBQyxVQUF6SjtBQUFBLFFBQ0EsT0FBQSxFQUFhLEdBQUcsQ0FBQyxXQUFKLEtBQW1CLE1BQXZCLEdBQXVDLEdBQUcsQ0FBQyxXQUEzQyxHQUE0RCxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBYixJQUFnQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFsRCxJQUFnRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQTlFLENBQW1GLENBQUMsU0FEeko7UUFGaUI7SUFBQSxDQTdPbkI7SUFOa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQVJqQixDQUFBOzs7OztBQ0FBLElBQUEscUJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUFULENBQUE7O0FBQUEsR0FDQSxHQUFNLE1BQU0sQ0FBQyxHQURiLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLGtCQUFFLElBQUYsRUFBUSxPQUFSLEdBQUE7QUFDWCxRQUFBLGFBQUE7QUFBQSxJQURZLElBQUMsQ0FBQSxPQUFBLElBQ2IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLFFBQUQsRUFBVyxXQUFYLEVBQXdCLE1BQXhCLENBQVQsQ0FBQTtBQUFBLElBRUEsYUFBQSxHQUNFO0FBQUEsTUFBQSxjQUFBLEVBQWdCLEtBQWhCO0FBQUEsTUFDQSxXQUFBLEVBQWEsTUFEYjtBQUFBLE1BRUEsVUFBQSxFQUFZLEVBRlo7QUFBQSxNQUdBLFNBQUEsRUFDRTtBQUFBLFFBQUEsYUFBQSxFQUFlLElBQWY7QUFBQSxRQUNBLEtBQUEsRUFBTyxHQURQO0FBQUEsUUFFQSxTQUFBLEVBQVcsQ0FGWDtPQUpGO0FBQUEsTUFPQSxJQUFBLEVBQ0U7QUFBQSxRQUFBLFFBQUEsRUFBVSxDQUFWO09BUkY7S0FIRixDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFBZSxhQUFmLEVBQThCLE9BQTlCLENBYmpCLENBQUE7QUFBQSxJQWVBLElBQUMsQ0FBQSxVQUFELEdBQWMsTUFmZCxDQUFBO0FBQUEsSUFnQkEsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQWhCZixDQUFBO0FBQUEsSUFpQkEsSUFBQyxDQUFBLFdBQUQsR0FBZSxLQWpCZixDQUFBO0FBQUEsSUFrQkEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQWxCWCxDQURXO0VBQUEsQ0FBYjs7QUFBQSxxQkFzQkEsVUFBQSxHQUFZLFNBQUMsT0FBRCxHQUFBO0FBQ1YsSUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUIsSUFBQyxDQUFBLGFBQXBCLEVBQW1DLE9BQW5DLENBQVgsQ0FBQTtXQUNBLElBQUMsQ0FBQSxJQUFELEdBQVcsc0JBQUgsR0FDTixRQURNLEdBRUEseUJBQUgsR0FDSCxXQURHLEdBRUcsb0JBQUgsR0FDSCxNQURHLEdBR0gsWUFUUTtFQUFBLENBdEJaLENBQUE7O0FBQUEscUJBa0NBLGNBQUEsR0FBZ0IsU0FBQyxXQUFELEdBQUE7QUFDZCxJQUFBLElBQUMsQ0FBQSxXQUFELEdBQWUsV0FBZixDQUFBO1dBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLEdBQW9CLElBQUMsQ0FBQSxLQUZQO0VBQUEsQ0FsQ2hCLENBQUE7O0FBQUEscUJBMENBLElBQUEsR0FBTSxTQUFDLFdBQUQsRUFBYyxLQUFkLEVBQXFCLE9BQXJCLEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBRGYsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsQ0FIQSxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUpkLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQU5BLENBQUE7QUFBQSxJQU9BLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQVBBLENBQUE7QUFTQSxJQUFBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxXQUFaO0FBQ0UsTUFBQSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsSUFBQyxDQUFBLFVBQXhCLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUEsR0FBQTtBQUNsQixVQUFBLEtBQUMsQ0FBQSx3QkFBRCxDQUFBLENBQUEsQ0FBQTtpQkFDQSxLQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsRUFGa0I7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLEVBR1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FIWixDQURYLENBREY7S0FBQSxNQU1LLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO0FBQ0gsTUFBQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsQ0FBQSxDQURHO0tBZkw7QUFtQkEsSUFBQSxJQUEwQixJQUFDLENBQUEsT0FBTyxDQUFDLGNBQW5DO2FBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxFQUFBO0tBcEJJO0VBQUEsQ0ExQ04sQ0FBQTs7QUFBQSxxQkFpRUEsSUFBQSxHQUFNLFNBQUMsS0FBRCxHQUFBO0FBQ0osUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFoQixDQUFBO0FBQ0EsSUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsV0FBWjtBQUNFLE1BQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsSUFBQyxDQUFBLFVBQTFCLENBQUEsR0FBd0MsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBOUQ7ZUFDRSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBREY7T0FERjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLE1BQVo7QUFDSCxNQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBQXlCLElBQUMsQ0FBQSxVQUExQixDQUFBLEdBQXdDLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQXpEO2VBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLEVBREY7T0FERztLQUxEO0VBQUEsQ0FqRU4sQ0FBQTs7QUFBQSxxQkE0RUEsS0FBQSxHQUFPLFNBQUMsS0FBRCxHQUFBO0FBQ0wsUUFBQSxhQUFBO0FBQUEsSUFBQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFoQixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBRFgsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUpBLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVosQ0FBcUIsR0FBRyxDQUFDLGdCQUF6QixDQUxBLENBQUE7V0FNQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBbUIsYUFBbkIsRUFQSztFQUFBLENBNUVQLENBQUE7O0FBQUEscUJBc0ZBLElBQUEsR0FBTSxTQUFDLEtBQUQsR0FBQTtBQUNKLElBQUEsSUFBNEIsSUFBQyxDQUFBLE9BQTdCO0FBQUEsTUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsS0FBbEIsQ0FBQSxDQUFBO0tBQUE7QUFDQSxJQUFBLElBQUcsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXRCLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixLQUFoQixFQUF1QixJQUFDLENBQUEsV0FBeEIsQ0FBQSxDQURGO0tBREE7V0FHQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBSkk7RUFBQSxDQXRGTixDQUFBOztBQUFBLHFCQTZGQSxNQUFBLEdBQVEsU0FBQSxHQUFBO1dBQ04sSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQURNO0VBQUEsQ0E3RlIsQ0FBQTs7QUFBQSxxQkFpR0EsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLElBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtBQUNFLE1BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxLQUFYLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVosQ0FBd0IsR0FBRyxDQUFDLGdCQUE1QixDQURBLENBREY7S0FBQTtBQUlBLElBQUEsSUFBRyxJQUFDLENBQUEsV0FBSjtBQUNFLE1BQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxLQUFmLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsTUFEZCxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBQSxDQUZBLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFIZixDQUFBO0FBSUEsTUFBQSxJQUFHLG9CQUFIO0FBQ0UsUUFBQSxZQUFBLENBQWEsSUFBQyxDQUFBLE9BQWQsQ0FBQSxDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLE1BRFgsQ0FERjtPQUpBO0FBQUEsTUFRQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFoQixDQUFvQixrQkFBcEIsQ0FSQSxDQUFBO0FBQUEsTUFTQSxJQUFDLENBQUEsd0JBQUQsQ0FBQSxDQVRBLENBQUE7YUFVQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBWEY7S0FMSztFQUFBLENBakdQLENBQUE7O0FBQUEscUJBb0hBLFVBQUEsR0FBWSxTQUFBLEdBQUE7QUFDVixRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxDQUFBLENBQUcsY0FBQSxHQUFqQixHQUFHLENBQUMsV0FBYSxHQUFnQyxJQUFuQyxDQUNULENBQUMsSUFEUSxDQUNILE9BREcsRUFDTSwyREFETixDQUFYLENBQUE7V0FFQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLENBQW1CLFFBQW5CLEVBSFU7RUFBQSxDQXBIWixDQUFBOztBQUFBLHFCQTBIQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBWixDQUFrQixHQUFBLEdBQXJCLEdBQUcsQ0FBQyxXQUFELENBQXlDLENBQUMsTUFBMUMsQ0FBQSxFQURhO0VBQUEsQ0ExSGYsQ0FBQTs7QUFBQSxxQkE4SEEscUJBQUEsR0FBdUIsU0FBQyxJQUFELEdBQUE7QUFDckIsUUFBQSx3QkFBQTtBQUFBLElBRHdCLGFBQUEsT0FBTyxhQUFBLEtBQy9CLENBQUE7QUFBQSxJQUFBLElBQUEsQ0FBQSxJQUFlLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFqQztBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFDQSxVQUFBLEdBQWEsQ0FBQSxDQUFHLGVBQUEsR0FBbkIsR0FBRyxDQUFDLGtCQUFlLEdBQXdDLHNCQUEzQyxDQURiLENBQUE7QUFBQSxJQUVBLFVBQVUsQ0FBQyxHQUFYLENBQWU7QUFBQSxNQUFBLElBQUEsRUFBTSxLQUFOO0FBQUEsTUFBYSxHQUFBLEVBQUssS0FBbEI7S0FBZixDQUZBLENBQUE7V0FHQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFaLENBQW1CLFVBQW5CLEVBSnFCO0VBQUEsQ0E5SHZCLENBQUE7O0FBQUEscUJBcUlBLHdCQUFBLEdBQTBCLFNBQUEsR0FBQTtXQUN4QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFaLENBQWtCLEdBQUEsR0FBckIsR0FBRyxDQUFDLGtCQUFELENBQWdELENBQUMsTUFBakQsQ0FBQSxFQUR3QjtFQUFBLENBckkxQixDQUFBOztBQUFBLHFCQTBJQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixRQUFBLFVBQUE7QUFBQSxJQUFBLFVBQUEsR0FDSyxLQUFLLENBQUMsSUFBTixLQUFjLFlBQWpCLEdBQ0UsaUZBREYsR0FFUSxLQUFLLENBQUMsSUFBTixLQUFjLFdBQWQsSUFBNkIsS0FBSyxDQUFDLElBQU4sS0FBYyxpQkFBOUMsR0FDSCw4Q0FERyxHQUdILHlCQU5KLENBQUE7V0FRQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFoQixDQUFtQixVQUFuQixFQUErQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxLQUFELEdBQUE7ZUFDN0IsS0FBQyxDQUFBLElBQUQsQ0FBTSxLQUFOLEVBRDZCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0IsRUFUZ0I7RUFBQSxDQTFJbEIsQ0FBQTs7QUFBQSxxQkF3SkEsZ0JBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsSUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLEtBQWMsWUFBakI7YUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFoQixDQUFtQiwyQkFBbkIsRUFBZ0QsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsS0FBRCxHQUFBO0FBQzlDLFVBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUY4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBREY7S0FBQSxNQVFLLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxXQUFkLElBQTZCLEtBQUssQ0FBQyxJQUFOLEtBQWMsaUJBQTlDO2FBQ0gsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsMEJBQW5CLEVBQStDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUM3QyxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUQ2QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9DLEVBREc7S0FBQSxNQUFBO2FBUUgsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBaEIsQ0FBbUIsMkJBQW5CLEVBQWdELENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUM5QyxVQUFBLElBQUcsS0FBQyxDQUFBLE9BQUo7bUJBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFsQixFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFIRjtXQUQ4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBUkc7S0FUVztFQUFBLENBeEpsQixDQUFBOztBQUFBLHFCQWdMQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixJQUFBLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxZQUFkLElBQThCLEtBQUssQ0FBQyxJQUFOLEtBQWMsV0FBL0M7QUFDRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsYUFBYSxDQUFDLGNBQWUsQ0FBQSxDQUFBLENBQTNDLENBREY7S0FBQSxNQUlLLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxVQUFqQjtBQUNILE1BQUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxhQUFkLENBREc7S0FKTDtXQU9BO0FBQUEsTUFBQSxPQUFBLEVBQVMsS0FBSyxDQUFDLE9BQWY7QUFBQSxNQUNBLE9BQUEsRUFBUyxLQUFLLENBQUMsT0FEZjtBQUFBLE1BRUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxLQUZiO0FBQUEsTUFHQSxLQUFBLEVBQU8sS0FBSyxDQUFDLEtBSGI7TUFSZ0I7RUFBQSxDQWhMbEIsQ0FBQTs7QUFBQSxxQkE4TEEsUUFBQSxHQUFVLFNBQUMsTUFBRCxFQUFTLE1BQVQsR0FBQTtBQUNSLFFBQUEsWUFBQTtBQUFBLElBQUEsSUFBb0IsQ0FBQSxNQUFBLElBQVcsQ0FBQSxNQUEvQjtBQUFBLGFBQU8sTUFBUCxDQUFBO0tBQUE7QUFBQSxJQUVBLEtBQUEsR0FBUSxNQUFNLENBQUMsS0FBUCxHQUFlLE1BQU0sQ0FBQyxLQUY5QixDQUFBO0FBQUEsSUFHQSxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsR0FBZSxNQUFNLENBQUMsS0FIOUIsQ0FBQTtXQUlBLElBQUksQ0FBQyxJQUFMLENBQVcsQ0FBQyxLQUFBLEdBQVEsS0FBVCxDQUFBLEdBQWtCLENBQUMsS0FBQSxHQUFRLEtBQVQsQ0FBN0IsRUFMUTtFQUFBLENBOUxWLENBQUE7O2tCQUFBOztJQVhGLENBQUE7Ozs7O0FDQUEsSUFBQSwrQkFBQTtFQUFBLGtCQUFBOztBQUFBLEdBQUEsR0FBTSxPQUFBLENBQVEsT0FBUixDQUFOLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQURULENBQUE7O0FBQUEsTUFNTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDRCQUFFLElBQUYsR0FBQTtBQUdYLElBSFksSUFBQyxDQUFBLE9BQUEsSUFHYixDQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FDZDtBQUFBLE1BQUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBZDtBQUFBLE1BQ0EsaUJBQUEsRUFBbUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFEbkM7QUFBQSxNQUVBLHlCQUFBLEVBQTJCLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBRjNDO0tBRGMsQ0FBaEIsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsWUFMM0MsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLENBQUMsU0FBRixDQUFBLENBTmIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLFFBQ0MsQ0FBQyxLQURILENBQ1MsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQURULENBRUUsQ0FBQyxJQUZILENBRVEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsSUFBZCxDQUZSLENBR0UsQ0FBQyxNQUhILENBR1UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsTUFBZCxDQUhWLENBSUUsQ0FBQyxLQUpILENBSVMsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQUpULENBS0UsQ0FBQyxLQUxILENBS1MsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBZCxDQUxULENBTUUsQ0FBQyxTQU5ILENBTWEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsZ0JBQWQsQ0FOYixDQU9FLENBQUMsT0FQSCxDQU9XLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE9BQWQsQ0FQWCxDQVFFLENBQUMsTUFSSCxDQVFVLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLE1BQWQsQ0FSVixDQVJBLENBSFc7RUFBQSxDQUFiOztBQUFBLCtCQXdCQSxHQUFBLEdBQUssU0FBQyxLQUFELEdBQUE7V0FDSCxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQVYsQ0FBYyxLQUFkLEVBREc7RUFBQSxDQXhCTCxDQUFBOztBQUFBLCtCQTRCQSxVQUFBLEdBQVksU0FBQSxHQUFBO1dBQ1YsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQUEsRUFEVTtFQUFBLENBNUJaLENBQUE7O0FBQUEsK0JBZ0NBLFdBQUEsR0FBYSxTQUFBLEdBQUE7V0FDWCxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQUQsQ0FBVCxDQUFBLEVBRFc7RUFBQSxDQWhDYixDQUFBOztBQUFBLCtCQTBDQSxXQUFBLEdBQWEsU0FBQyxJQUFELEdBQUE7V0FDWCxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ0UsWUFBQSxpQ0FBQTtBQUFBLFFBREQsd0JBQVMsOERBQ1IsQ0FBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLEdBQUcsQ0FBQyxpQkFBSixDQUFzQixPQUF0QixDQUFQLENBQUE7QUFBQSxRQUNBLFlBQUEsR0FBZSxPQUFPLENBQUMsWUFBUixDQUFxQixLQUFDLENBQUEsWUFBdEIsQ0FEZixDQUFBO0FBQUEsUUFFQSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsRUFBbUIsWUFBbkIsQ0FGQSxDQUFBO2VBR0EsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFYLEVBQWlCLElBQWpCLEVBSkY7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxFQURXO0VBQUEsQ0ExQ2IsQ0FBQTs7QUFBQSwrQkFrREEsY0FBQSxHQUFnQixTQUFDLE9BQUQsR0FBQTtBQUNkLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixDQUFxQixPQUFyQixDQUFSLENBQUE7QUFDQSxJQUFBLElBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUF2QixDQUE0QixLQUE1QixDQUFBLElBQXNDLEtBQUEsS0FBUyxFQUFsRDthQUNFLE9BREY7S0FBQSxNQUFBO2FBR0UsTUFIRjtLQUZjO0VBQUEsQ0FsRGhCLENBQUE7O0FBQUEsK0JBMERBLFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLE9BQXJCLEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsY0FBRCxDQUFnQixPQUFoQixDQUFSLENBQUE7V0FDQSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQVgsQ0FBZSxZQUFmLEVBQTZCLEtBQTdCLEVBRlc7RUFBQSxDQTFEYixDQUFBOztBQUFBLCtCQStEQSxLQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sWUFBUCxHQUFBO0FBQ0wsUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFJLENBQUMsYUFBTCxDQUFtQixZQUFuQixDQUFBLENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FGVixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFaLENBQTRCLE9BQTVCLEVBQXFDLElBQXJDLENBSEEsQ0FBQTtXQUlBLEtBTEs7RUFBQSxDQS9EUCxDQUFBOztBQUFBLCtCQXVFQSxJQUFBLEdBQU0sU0FBQyxJQUFELEVBQU8sWUFBUCxHQUFBO0FBQ0osUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFBLENBQUE7QUFBQSxJQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FGVixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsWUFBbkIsRUFBaUMsT0FBakMsQ0FIQSxDQUFBO0FBQUEsSUFLQSxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQixDQUxBLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQVosQ0FBNEIsT0FBNUIsRUFBcUMsSUFBckMsQ0FOQSxDQUFBO1dBUUEsS0FUSTtFQUFBLENBdkVOLENBQUE7O0FBQUEsK0JBc0ZBLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLFNBQXJCLEVBQWdDLE1BQWhDLEdBQUE7QUFDTixRQUFBLCtCQUFBO0FBQUEsSUFBQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBaEMsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBbkIsQ0FBQSxJQUE0QiwwQkFBL0I7QUFDRSxNQUFBLElBQUEsR0FBTyxnQkFBZ0IsQ0FBQyxXQUFqQixDQUFBLENBQVAsQ0FBQTtBQUFBLE1BRUEsT0FBQSxHQUFhLFNBQUEsS0FBYSxRQUFoQixHQUNSLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFYLENBQWtCLElBQWxCLENBQUEsRUFDQSxJQUFJLENBQUMsSUFBTCxDQUFBLENBREEsQ0FEUSxHQUlSLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFYLENBQWlCLElBQWpCLENBQUEsRUFDQSxJQUFJLENBQUMsSUFBTCxDQUFBLENBREEsQ0FORixDQUFBO0FBU0EsTUFBQSxJQUFtQixPQUFBLElBQVcsU0FBQSxLQUFhLE9BQTNDO0FBQUEsUUFBQSxPQUFPLENBQUMsS0FBUixDQUFBLENBQUEsQ0FBQTtPQVZGO0tBREE7V0FjQSxNQWZNO0VBQUEsQ0F0RlIsQ0FBQTs7QUFBQSwrQkE2R0EsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLFlBQVAsRUFBcUIsU0FBckIsRUFBZ0MsTUFBaEMsR0FBQTtBQUNMLFFBQUEsb0RBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFDRSxNQUFBLFVBQUEsR0FBZ0IsU0FBQSxLQUFhLFFBQWhCLEdBQThCLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBOUIsR0FBK0MsSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUE1RCxDQUFBO0FBRUEsTUFBQSxJQUFHLFVBQUEsSUFBYyxVQUFVLENBQUMsUUFBWCxLQUF1QixJQUFJLENBQUMsUUFBN0M7QUFDRSxRQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsbUJBQUwsQ0FBeUIsWUFBekIsQ0FBWCxDQUFBO0FBQUEsUUFDQSxjQUFBLEdBQWlCLFVBQVUsQ0FBQyxtQkFBWCxDQUErQixZQUEvQixDQURqQixDQUFBO0FBQUEsUUFJQSxjQUFBLEdBQWlCLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixDQUFxQixRQUFyQixDQUpqQixDQUFBO0FBQUEsUUFNQSxNQUFBLEdBQVksU0FBQSxLQUFhLFFBQWhCLEdBQ1AsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFWLENBQW1CLGNBQW5CLEVBQW1DLGNBQW5DLENBRE8sR0FHUCxJQUFDLENBQUEsUUFBUSxDQUFDLFNBQVYsQ0FBb0IsY0FBcEIsRUFBb0MsY0FBcEMsQ0FURixDQUFBO0FBQUEsUUFXQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQVgsQ0FBQSxDQVhBLENBQUE7QUFBQSxRQVlBLE1BQU0sQ0FBQyxtQkFBUCxDQUFBLENBWkEsQ0FBQTtBQUFBLFFBZ0JBLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUF5QixZQUF6QixFQUF1QyxjQUF2QyxDQWhCQSxDQURGO09BSEY7S0FBQTtXQXNCQSxNQXZCSztFQUFBLENBN0dQLENBQUE7O0FBQUEsK0JBeUlBLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLE1BQXJCLEVBQTZCLEtBQTdCLEVBQW9DLE1BQXBDLEdBQUE7QUFDTCxRQUFBLFVBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBQUg7QUFHRSxNQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWQsQ0FBQSxDQUFQLENBQUE7QUFBQSxNQUNBLElBQUksQ0FBQyxHQUFMLENBQVMsWUFBVCxFQUF1QixJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixDQUF2QixDQURBLENBQUE7QUFBQSxNQUVBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBWCxDQUFpQixJQUFqQixDQUZBLENBQUE7O1lBR1csQ0FBRSxLQUFiLENBQUE7T0FIQTtBQUFBLE1BTUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFYLENBQWUsWUFBZixFQUE2QixJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUE3QixDQU5BLENBSEY7S0FBQTtXQVdBLE1BWks7RUFBQSxDQXpJUCxDQUFBOztBQUFBLCtCQTBKQSxnQkFBQSxHQUFrQixTQUFDLElBQUQsRUFBTyxZQUFQLEVBQXFCLFNBQXJCLEdBQUE7QUFDaEIsUUFBQSxPQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsSUFBSSxDQUFDLG1CQUFMLENBQXlCLFlBQXpCLENBQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFzQixPQUF0QixFQUErQixTQUEvQixFQUZnQjtFQUFBLENBMUpsQixDQUFBOztBQUFBLCtCQWdLQSxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sUUFBUCxFQUFpQixNQUFqQixHQUFBO0FBQ1AsSUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBbkI7QUFDRSxhQUFPLElBQVAsQ0FERjtLQUFBLE1BQUE7QUFHQyxhQUFPLEtBQVAsQ0FIRDtLQURPO0VBQUEsQ0FoS1QsQ0FBQTs7QUFBQSwrQkEwS0EsTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLFlBQVAsR0FBQTtBQUNOLElBQUEsSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFVLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsS0FBK0IsS0FBekM7QUFBQSxZQUFBLENBQUE7S0FEQTtXQUdBLElBQUMsQ0FBQSxhQUFELEdBQWlCLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQzFCLFlBQUEsSUFBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxtQkFBTCxDQUF5QixZQUF6QixDQUFQLENBQUE7QUFBQSxRQUNBLEtBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixFQUFtQixZQUFuQixFQUFpQyxJQUFqQyxDQURBLENBQUE7ZUFFQSxLQUFDLENBQUEsYUFBRCxHQUFpQixPQUhTO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxFQUlmLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FKRCxFQUpYO0VBQUEsQ0ExS1IsQ0FBQTs7QUFBQSwrQkFxTEEsa0JBQUEsR0FBb0IsU0FBQSxHQUFBO0FBQ2xCLElBQUEsSUFBRywwQkFBSDtBQUNFLE1BQUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxhQUFkLENBQUEsQ0FBQTthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE9BRm5CO0tBRGtCO0VBQUEsQ0FyTHBCLENBQUE7O0FBQUEsK0JBMkxBLGlCQUFBLEdBQW1CLFNBQUMsSUFBRCxHQUFBO1dBQ2pCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBaEIsS0FBMEIsQ0FBMUIsSUFBK0IsSUFBSSxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFuQixLQUEyQixXQUR6QztFQUFBLENBM0xuQixDQUFBOzs0QkFBQTs7SUFSRixDQUFBOzs7OztBQ0FBLElBQUEsVUFBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxlQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLE1BQWhCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE1BRGpCLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxjQUFELEdBQWtCLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FIbEIsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQUpqQixDQURXO0VBQUEsQ0FBYjs7QUFBQSxrQkFRQSxRQUFBLEdBQVUsU0FBQyxhQUFELEVBQWdCLFlBQWhCLEdBQUE7QUFDUixJQUFBLElBQUcsWUFBQSxLQUFnQixJQUFDLENBQUEsWUFBcEI7QUFDRSxNQUFBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQixZQURoQixDQURGO0tBQUE7QUFJQSxJQUFBLElBQUcsYUFBQSxLQUFpQixJQUFDLENBQUEsYUFBckI7QUFDRSxNQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFBLENBQUEsQ0FBQTtBQUNBLE1BQUEsSUFBRyxhQUFIO0FBQ0UsUUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixhQUFqQixDQUFBO2VBQ0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixJQUFDLENBQUEsYUFBdEIsRUFGRjtPQUZGO0tBTFE7RUFBQSxDQVJWLENBQUE7O0FBQUEsa0JBcUJBLGVBQUEsR0FBaUIsU0FBQyxZQUFELEVBQWUsYUFBZixHQUFBO0FBQ2YsSUFBQSxJQUFHLElBQUMsQ0FBQSxZQUFELEtBQWlCLFlBQXBCO0FBQ0UsTUFBQSxrQkFBQSxnQkFBa0IsR0FBRyxDQUFDLGlCQUFKLENBQXNCLFlBQXRCLEVBQWxCLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsWUFBekIsRUFGRjtLQURlO0VBQUEsQ0FyQmpCLENBQUE7O0FBQUEsa0JBNEJBLGVBQUEsR0FBaUIsU0FBQyxZQUFELEdBQUE7QUFDZixJQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsS0FBaUIsWUFBcEI7YUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxhQUFYLEVBQTBCLE1BQTFCLEVBREY7S0FEZTtFQUFBLENBNUJqQixDQUFBOztBQUFBLGtCQWtDQSxnQkFBQSxHQUFrQixTQUFDLGFBQUQsR0FBQTtBQUNoQixJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsS0FBa0IsYUFBckI7YUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFBeUIsTUFBekIsRUFERjtLQURnQjtFQUFBLENBbENsQixDQUFBOztBQUFBLGtCQXVDQSxJQUFBLEdBQU0sU0FBQSxHQUFBO1dBQ0osSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBQXFCLE1BQXJCLEVBREk7RUFBQSxDQXZDTixDQUFBOztBQUFBLGtCQStDQSxhQUFBLEdBQWUsU0FBQSxHQUFBO0FBQ2IsSUFBQSxJQUFHLElBQUMsQ0FBQSxZQUFKO2FBQ0UsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsT0FEbEI7S0FEYTtFQUFBLENBL0NmLENBQUE7O0FBQUEsa0JBcURBLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTtBQUNsQixRQUFBLFFBQUE7QUFBQSxJQUFBLElBQUcsSUFBQyxDQUFBLGFBQUo7QUFDRSxNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsYUFBWixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixNQURqQixDQUFBO2FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQW9CLFFBQXBCLEVBSEY7S0FEa0I7RUFBQSxDQXJEcEIsQ0FBQTs7ZUFBQTs7SUFQRixDQUFBOzs7OztBQ0FBLElBQUEsbUlBQUE7RUFBQTtpU0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLDBCQUFSLENBQVQsQ0FBQTs7QUFBQSxrQkFDQSxHQUFxQixPQUFBLENBQVEsMkNBQVIsQ0FEckIsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLDRCQUFSLENBRlAsQ0FBQTs7QUFBQSxlQUdBLEdBQWtCLE9BQUEsQ0FBUSx3Q0FBUixDQUhsQixDQUFBOztBQUFBLFFBSUEsR0FBVyxPQUFBLENBQVEsc0JBQVIsQ0FKWCxDQUFBOztBQUFBLElBS0EsR0FBTyxPQUFBLENBQVEsa0JBQVIsQ0FMUCxDQUFBOztBQUFBLFlBTUEsR0FBZSxPQUFBLENBQVEsc0JBQVIsQ0FOZixDQUFBOztBQUFBLE1BT0EsR0FBUyxPQUFBLENBQVEsd0JBQVIsQ0FQVCxDQUFBOztBQUFBLEdBUUEsR0FBTSxPQUFBLENBQVEsbUJBQVIsQ0FSTixDQUFBOztBQUFBLFdBU0EsR0FBYyxPQUFBLENBQVEsdUJBQVIsQ0FUZCxDQUFBOztBQUFBLGFBVUEsR0FBZ0IsT0FBQSxDQUFRLGlDQUFSLENBVmhCLENBQUE7O0FBQUEsTUFZTSxDQUFDLE9BQVAsR0FBdUI7QUFzQnJCLDhCQUFBLENBQUE7O0FBQUEsRUFBQSxTQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSw2Q0FBQTtBQUFBLElBRFUsWUFBQSxNQUFNLGtCQUFBLFlBQVkscUJBQUEsYUFDNUIsQ0FBQTtBQUFBLElBQUEsYUFBQSxHQUFtQixZQUFILEdBQ2QsQ0FBQSxVQUFBLHNDQUF3QixDQUFFLGFBQTFCLEVBQ0EsTUFBQSxDQUFPLGtCQUFQLEVBQW9CLG1EQUFwQixDQURBLEVBRUEsTUFBQSxHQUFTLFdBQVcsQ0FBQyxHQUFaLENBQWdCLFVBQWhCLENBRlQsRUFHSSxJQUFBLGFBQUEsQ0FBYztBQUFBLE1BQUEsT0FBQSxFQUFTLElBQVQ7QUFBQSxNQUFlLE1BQUEsRUFBUSxNQUF2QjtLQUFkLENBSEosQ0FEYyxHQUtSLGtCQUFILEdBQ0gsQ0FBQSxNQUFBLEdBQVMsV0FBVyxDQUFDLEdBQVosQ0FBZ0IsVUFBaEIsQ0FBVCxFQUNJLElBQUEsYUFBQSxDQUFjO0FBQUEsTUFBQSxNQUFBLEVBQVEsTUFBUjtLQUFkLENBREosQ0FERyxHQUlILGFBVEYsQ0FBQTtXQVdJLElBQUEsU0FBQSxDQUFVO0FBQUEsTUFBRSxlQUFBLGFBQUY7S0FBVixFQVpHO0VBQUEsQ0FBVCxDQUFBOztBQWVhLEVBQUEsbUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxhQUFBO0FBQUEsSUFEYyxnQkFBRixLQUFFLGFBQ2QsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxhQUFhLENBQUMsTUFBeEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLGFBQWxCLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxFQUZULENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxlQUFELEdBQW1CLE1BSG5CLENBRFc7RUFBQSxDQWZiOztBQUFBLHNCQXVCQSxhQUFBLEdBQWUsU0FBQyxJQUFELEdBQUE7QUFDYixRQUFBLHVEQUFBO0FBQUEsSUFEZ0IsUUFBRixLQUFFLEtBQ2hCLENBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQXhCLENBQUE7QUFBQSxJQUNFLGdCQUFBLE9BQUYsRUFBVyxnQkFBQSxPQURYLENBQUE7QUFBQSxJQUVBLElBQUEsR0FBTyxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUMsT0FBbkMsQ0FGUCxDQUFBO0FBR0EsSUFBQSxJQUFHLFlBQUg7QUFDRSxNQUFBLE1BQUEsR0FBUztBQUFBLFFBQUUsSUFBQSxFQUFNLEtBQUssQ0FBQyxLQUFkO0FBQUEsUUFBcUIsR0FBQSxFQUFLLEtBQUssQ0FBQyxLQUFoQztPQUFULENBQUE7YUFDQSxNQUFBLEdBQVMsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLEVBRlg7S0FKYTtFQUFBLENBdkJmLENBQUE7O0FBQUEsc0JBZ0NBLGdCQUFBLEdBQWtCLFNBQUMsYUFBRCxHQUFBO0FBQ2hCLElBQUEsTUFBQSxDQUFPLGFBQWEsQ0FBQyxNQUFkLEtBQXdCLElBQUMsQ0FBQSxNQUFoQyxFQUNFLHlEQURGLENBQUEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsYUFBRCxHQUFpQixhQUgxQixDQUFBO1dBSUEsSUFBQyxDQUFBLDBCQUFELENBQUEsRUFMZ0I7RUFBQSxDQWhDbEIsQ0FBQTs7QUFBQSxzQkF3Q0EsMEJBQUEsR0FBNEIsU0FBQSxHQUFBO1dBQzFCLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQXZCLENBQTJCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFBLEdBQUE7ZUFDekIsS0FBQyxDQUFBLElBQUQsQ0FBTSxRQUFOLEVBQWdCLFNBQWhCLEVBRHlCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0IsRUFEMEI7RUFBQSxDQXhDNUIsQ0FBQTs7QUFBQSxzQkE2Q0EsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLE9BQVQsR0FBQTtBQUNWLFFBQUEsc0JBQUE7O01BRG1CLFVBQVE7S0FDM0I7O01BQUEsU0FBVSxNQUFNLENBQUMsUUFBUSxDQUFDO0tBQTFCOztNQUNBLE9BQU8sQ0FBQyxXQUFZO0tBRHBCO0FBQUEsSUFHQSxPQUFBLEdBQVUsQ0FBQSxDQUFFLE1BQUYsQ0FBUyxDQUFDLEtBQVYsQ0FBQSxDQUhWLENBQUE7O01BS0EsT0FBTyxDQUFDLFdBQVksSUFBQyxDQUFBLFdBQUQsQ0FBYSxPQUFiO0tBTHBCO0FBQUEsSUFNQSxPQUFPLENBQUMsSUFBUixDQUFhLEVBQWIsQ0FOQSxDQUFBO0FBQUEsSUFRQSxJQUFBLEdBQVcsSUFBQSxJQUFBLENBQUssSUFBQyxDQUFBLGFBQU4sRUFBcUIsT0FBUSxDQUFBLENBQUEsQ0FBN0IsQ0FSWCxDQUFBO0FBQUEsSUFTQSxPQUFBLEdBQVUsSUFBSSxDQUFDLE1BQUwsQ0FBWSxPQUFaLENBVFYsQ0FBQTtBQVdBLElBQUEsSUFBRyxJQUFJLENBQUMsYUFBUjtBQUNFLE1BQUEsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQXBCLENBQUEsQ0FERjtLQVhBO1dBY0EsUUFmVTtFQUFBLENBN0NaLENBQUE7O0FBQUEsc0JBK0RBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO1dBQ2YsSUFBQyxDQUFBLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBL0IsQ0FBcUMsSUFBQyxDQUFBLGFBQXRDLEVBQXFELFNBQXJELEVBRGU7RUFBQSxDQS9EakIsQ0FBQTs7QUFBQSxzQkE0RUEsUUFBQSxHQUFVLFNBQUMsTUFBRCxFQUFTLE9BQVQsR0FBQTtBQUNSLFFBQUEsYUFBQTs7TUFEaUIsVUFBUTtLQUN6QjtBQUFBLElBQUEsT0FBQSxHQUFVLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxLQUFWLENBQUEsQ0FBVixDQUFBOztNQUNBLE9BQU8sQ0FBQyxXQUFZLElBQUMsQ0FBQSxXQUFELENBQWEsT0FBYjtLQURwQjtBQUFBLElBRUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFiLENBRkEsQ0FBQTtBQUFBLElBSUEsSUFBQSxHQUFXLElBQUEsSUFBQSxDQUFLLElBQUMsQ0FBQSxhQUFOLEVBQXFCLE9BQVEsQ0FBQSxDQUFBLENBQTdCLENBSlgsQ0FBQTtXQUtBLElBQUksQ0FBQyxjQUFMLENBQW9CO0FBQUEsTUFBRSxTQUFBLE9BQUY7S0FBcEIsRUFOUTtFQUFBLENBNUVWLENBQUE7O0FBQUEsc0JBNkZBLFdBQUEsR0FBYSxTQUFDLE9BQUQsR0FBQTtBQUNYLFFBQUEsUUFBQTtBQUFBLElBQUEsSUFBRyxPQUFPLENBQUMsSUFBUixDQUFjLEdBQUEsR0FBcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFMLENBQXdDLENBQUMsTUFBekMsS0FBbUQsQ0FBdEQ7QUFDRSxNQUFBLFFBQUEsR0FBVyxDQUFBLENBQUUsT0FBTyxDQUFDLElBQVIsQ0FBQSxDQUFGLENBQVgsQ0FERjtLQUFBO1dBR0EsU0FKVztFQUFBLENBN0ZiLENBQUE7O0FBQUEsc0JBb0dBLGtCQUFBLEdBQW9CLFNBQUMsSUFBRCxHQUFBO0FBQ2xCLElBQUEsTUFBQSxDQUFXLDRCQUFYLEVBQ0UsK0VBREYsQ0FBQSxDQUFBO1dBR0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsS0FKRDtFQUFBLENBcEdwQixDQUFBOztBQUFBLHNCQTJHQSxNQUFBLEdBQVEsU0FBQyxJQUFELEdBQUE7QUFDTixRQUFBLGlCQUFBO0FBQUEsSUFEUyxvQ0FBRixPQUFzQixJQUFwQixpQkFDVCxDQUFBO1dBQUksSUFBQSxRQUFBLENBQ0Y7QUFBQSxNQUFBLGFBQUEsRUFBZSxJQUFDLENBQUEsYUFBaEI7QUFBQSxNQUNBLGtCQUFBLEVBQXdCLElBQUEsa0JBQUEsQ0FBQSxDQUR4QjtBQUFBLE1BRUEsaUJBQUEsRUFBbUIsaUJBRm5CO0tBREUsQ0FJSCxDQUFDLElBSkUsQ0FBQSxFQURFO0VBQUEsQ0EzR1IsQ0FBQTs7QUFBQSxzQkFtSEEsU0FBQSxHQUFXLFNBQUEsR0FBQTtXQUNULElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBZixDQUFBLEVBRFM7RUFBQSxDQW5IWCxDQUFBOztBQUFBLHNCQXVIQSxNQUFBLEdBQVEsU0FBQyxRQUFELEdBQUE7QUFDTixRQUFBLDJCQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFQLENBQUE7QUFDQSxJQUFBLElBQUcsZ0JBQUg7QUFDRSxNQUFBLFFBQUEsR0FBVyxJQUFYLENBQUE7QUFBQSxNQUNBLFdBQUEsR0FBYyxDQURkLENBQUE7YUFFQSxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsRUFBcUIsUUFBckIsRUFBK0IsV0FBL0IsRUFIRjtLQUFBLE1BQUE7YUFLRSxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsRUFMRjtLQUZNO0VBQUEsQ0F2SFIsQ0FBQTs7QUFBQSxzQkFxSUEsVUFBQSxHQUFZLFNBQUEsR0FBQTtXQUNWLElBQUMsQ0FBQSxhQUFhLENBQUMsS0FBZixDQUFBLEVBRFU7RUFBQSxDQXJJWixDQUFBOztBQUFBLEVBeUlBLFNBQVMsQ0FBQyxHQUFWLEdBQWdCLEdBekloQixDQUFBOzttQkFBQTs7R0F0QnVDLGFBWnpDLENBQUE7Ozs7O0FDQUEsSUFBQSxrQkFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtTQUlsQjtBQUFBLElBQUEsUUFBQSxFQUFVLFNBQUMsU0FBRCxFQUFZLFFBQVosR0FBQTtBQUNSLFVBQUEsZ0JBQUE7QUFBQSxNQUFBLGdCQUFBLEdBQW1CLFNBQUEsR0FBQTtBQUNqQixZQUFBLElBQUE7QUFBQSxRQURrQiw4REFDbEIsQ0FBQTtBQUFBLFFBQUEsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsZ0JBQWpCLENBQUEsQ0FBQTtlQUNBLFFBQVEsQ0FBQyxLQUFULENBQWUsSUFBZixFQUFxQixJQUFyQixFQUZpQjtNQUFBLENBQW5CLENBQUE7QUFBQSxNQUlBLFNBQVMsQ0FBQyxHQUFWLENBQWMsZ0JBQWQsQ0FKQSxDQUFBO2FBS0EsaUJBTlE7SUFBQSxDQUFWO0lBSmtCO0FBQUEsQ0FBQSxDQUFILENBQUEsQ0FBakIsQ0FBQTs7Ozs7QUNBQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtTQUVsQjtBQUFBLElBQUEsaUJBQUEsRUFBbUIsU0FBQSxHQUFBO0FBQ2pCLFVBQUEsT0FBQTtBQUFBLE1BQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLEdBQXZCLENBQVYsQ0FBQTtBQUFBLE1BQ0EsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFkLEdBQXdCLHFCQUR4QixDQUFBO0FBRUEsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWQsS0FBK0IsTUFBdEMsQ0FIaUI7SUFBQSxDQUFuQjtJQUZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBQWpCLENBQUE7Ozs7O0FDQUEsSUFBQSxzQkFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLG1CQUFSLENBQVYsQ0FBQTs7QUFBQSxhQUVBLEdBQWdCLEVBRmhCLENBQUE7O0FBQUEsTUFJTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxJQUFELEdBQUE7QUFDZixNQUFBLE1BQUE7QUFBQSxFQUFBLElBQUcsQ0FBQyxNQUFBLEdBQVMsYUFBYyxDQUFBLElBQUEsQ0FBeEIsQ0FBQSxLQUFrQyxNQUFyQztXQUNFLGFBQWMsQ0FBQSxJQUFBLENBQWQsR0FBc0IsT0FBQSxDQUFRLE9BQVEsQ0FBQSxJQUFBLENBQVIsQ0FBQSxDQUFSLEVBRHhCO0dBQUEsTUFBQTtXQUdFLE9BSEY7R0FEZTtBQUFBLENBSmpCLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7QUFFbEIsTUFBQSxpQkFBQTtBQUFBLEVBQUEsU0FBQSxHQUFZLE1BQUEsR0FBUyxNQUFyQixDQUFBO1NBUUE7QUFBQSxJQUFBLElBQUEsRUFBTSxTQUFDLElBQUQsR0FBQTtBQUdKLFVBQUEsTUFBQTs7UUFISyxPQUFPO09BR1o7QUFBQSxNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsR0FBTCxDQUFBLENBQVUsQ0FBQyxRQUFYLENBQW9CLEVBQXBCLENBQVQsQ0FBQTtBQUdBLE1BQUEsSUFBRyxNQUFBLEtBQVUsTUFBYjtBQUNFLFFBQUEsU0FBQSxJQUFhLENBQWIsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLFNBQUEsR0FBWSxDQUFaLENBQUE7QUFBQSxRQUNBLE1BQUEsR0FBUyxNQURULENBSEY7T0FIQTthQVNBLEVBQUEsR0FBSCxJQUFHLEdBQVUsR0FBVixHQUFILE1BQUcsR0FBSCxVQVpPO0lBQUEsQ0FBTjtJQVZrQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBQWpCLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsQ0FBakIsQ0FBQTs7Ozs7OztBQ0FBLElBQUEsV0FBQTs7QUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVIsQ0FBTixDQUFBOztBQUFBLE1BU00sQ0FBQyxPQUFQLEdBQWlCLE1BQUEsR0FBUyxTQUFDLFNBQUQsRUFBWSxPQUFaLEdBQUE7QUFDeEIsRUFBQSxJQUFBLENBQUEsU0FBQTtXQUFBLEdBQUcsQ0FBQyxLQUFKLENBQVUsT0FBVixFQUFBO0dBRHdCO0FBQUEsQ0FUMUIsQ0FBQTs7Ozs7QUNLQSxJQUFBLEdBQUE7RUFBQTs7aVNBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsR0FBQSxHQUFNLFNBQUEsR0FBQTtBQUNyQixNQUFBLElBQUE7QUFBQSxFQURzQiw4REFDdEIsQ0FBQTtBQUFBLEVBQUEsSUFBRyxzQkFBSDtBQUNFLElBQUEsSUFBRyxJQUFJLENBQUMsTUFBTCxJQUFnQixJQUFLLENBQUEsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUFkLENBQUwsS0FBeUIsT0FBNUM7QUFDRSxNQUFBLElBQUksQ0FBQyxHQUFMLENBQUEsQ0FBQSxDQUFBO0FBQ0EsTUFBQSxJQUEwQiw0QkFBMUI7QUFBQSxRQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBZixDQUFBLENBQUEsQ0FBQTtPQUZGO0tBQUE7QUFBQSxJQUlBLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQW5CLENBQXlCLE1BQU0sQ0FBQyxPQUFoQyxFQUF5QyxJQUF6QyxDQUpBLENBQUE7V0FLQSxPQU5GO0dBRHFCO0FBQUEsQ0FBdkIsQ0FBQTs7QUFBQSxDQVVHLFNBQUEsR0FBQTtBQUlELE1BQUEsdUJBQUE7QUFBQSxFQUFNO0FBRUosc0NBQUEsQ0FBQTs7QUFBYSxJQUFBLHlCQUFDLE9BQUQsR0FBQTtBQUNYLE1BQUEsa0RBQUEsU0FBQSxDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsT0FEWCxDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsSUFGdEIsQ0FEVztJQUFBLENBQWI7OzJCQUFBOztLQUY0QixNQUE5QixDQUFBO0FBQUEsRUFVQSxNQUFBLEdBQVMsU0FBQyxPQUFELEVBQVUsS0FBVixHQUFBOztNQUFVLFFBQVE7S0FDekI7QUFBQSxJQUFBLElBQUcsb0RBQUg7QUFDRSxNQUFBLFFBQVEsQ0FBQyxJQUFULENBQWtCLElBQUEsS0FBQSxDQUFNLE9BQU4sQ0FBbEIsRUFBa0MsU0FBQSxHQUFBO0FBQ2hDLFlBQUEsSUFBQTtBQUFBLFFBQUEsSUFBRyxDQUFDLEtBQUEsS0FBUyxVQUFULElBQXVCLEtBQUEsS0FBUyxPQUFqQyxDQUFBLElBQThDLGlFQUFqRDtpQkFDRSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFyQixDQUEwQixNQUFNLENBQUMsT0FBakMsRUFBMEMsT0FBMUMsRUFERjtTQUFBLE1BQUE7aUJBR0UsR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFULEVBQW9CLE9BQXBCLEVBSEY7U0FEZ0M7TUFBQSxDQUFsQyxDQUFBLENBREY7S0FBQSxNQUFBO0FBT0UsTUFBQSxJQUFJLEtBQUEsS0FBUyxVQUFULElBQXVCLEtBQUEsS0FBUyxPQUFwQztBQUNFLGNBQVUsSUFBQSxlQUFBLENBQWdCLE9BQWhCLENBQVYsQ0FERjtPQUFBLE1BQUE7QUFHRSxRQUFBLEdBQUcsQ0FBQyxJQUFKLENBQVMsTUFBVCxFQUFvQixPQUFwQixDQUFBLENBSEY7T0FQRjtLQUFBO1dBWUEsT0FiTztFQUFBLENBVlQsQ0FBQTtBQUFBLEVBMEJBLEdBQUcsQ0FBQyxLQUFKLEdBQVksU0FBQyxPQUFELEdBQUE7QUFDVixJQUFBLElBQUEsQ0FBQSxHQUFtQyxDQUFDLGFBQXBDO2FBQUEsTUFBQSxDQUFPLE9BQVAsRUFBZ0IsT0FBaEIsRUFBQTtLQURVO0VBQUEsQ0ExQlosQ0FBQTtBQUFBLEVBOEJBLEdBQUcsQ0FBQyxJQUFKLEdBQVcsU0FBQyxPQUFELEdBQUE7QUFDVCxJQUFBLElBQUEsQ0FBQSxHQUFxQyxDQUFDLGdCQUF0QzthQUFBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLFNBQWhCLEVBQUE7S0FEUztFQUFBLENBOUJYLENBQUE7U0FtQ0EsR0FBRyxDQUFDLEtBQUosR0FBWSxTQUFDLE9BQUQsR0FBQTtXQUNWLE1BQUEsQ0FBTyxPQUFQLEVBQWdCLE9BQWhCLEVBRFU7RUFBQSxFQXZDWDtBQUFBLENBQUEsQ0FBSCxDQUFBLENBVkEsQ0FBQTs7Ozs7QUNMQSxJQUFBLFdBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxHQUFELEdBQU8sRUFBUCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLENBRFYsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBS0EsSUFBQSxHQUFNLFNBQUMsR0FBRCxFQUFNLEtBQU4sR0FBQTtBQUNKLElBQUEsSUFBQyxDQUFBLEdBQUksQ0FBQSxHQUFBLENBQUwsR0FBWSxLQUFaLENBQUE7QUFBQSxJQUNBLElBQUUsQ0FBQSxJQUFDLENBQUEsTUFBRCxDQUFGLEdBQWEsS0FEYixDQUFBO1dBRUEsSUFBQyxDQUFBLE1BQUQsSUFBVyxFQUhQO0VBQUEsQ0FMTixDQUFBOztBQUFBLHdCQVdBLEdBQUEsR0FBSyxTQUFDLEdBQUQsR0FBQTtXQUNILElBQUMsQ0FBQSxHQUFJLENBQUEsR0FBQSxFQURGO0VBQUEsQ0FYTCxDQUFBOztBQUFBLHdCQWVBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtBQUNKLFFBQUEseUJBQUE7QUFBQTtTQUFBLDJDQUFBO3VCQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLEtBQVQsRUFBQSxDQURGO0FBQUE7b0JBREk7RUFBQSxDQWZOLENBQUE7O0FBQUEsd0JBb0JBLE9BQUEsR0FBUyxTQUFBLEdBQUE7QUFDUCxRQUFBLHlCQUFBO0FBQUE7U0FBQSwyQ0FBQTt1QkFBQTtBQUFBLG9CQUFBLE1BQUEsQ0FBQTtBQUFBO29CQURPO0VBQUEsQ0FwQlQsQ0FBQTs7cUJBQUE7O0lBRkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLGlCQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FBVCxDQUFBOztBQUFBLE1BMkJNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsbUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFULENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FEWCxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZLEtBRlosQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLFNBQUQsR0FBYSxFQUhiLENBRFc7RUFBQSxDQUFiOztBQUFBLHNCQU9BLFdBQUEsR0FBYSxTQUFDLFFBQUQsR0FBQTtBQUNYLElBQUEsSUFBRyxJQUFDLENBQUEsUUFBSjthQUNFLFFBQUEsQ0FBQSxFQURGO0tBQUEsTUFBQTthQUdFLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixRQUFoQixFQUhGO0tBRFc7RUFBQSxDQVBiLENBQUE7O0FBQUEsc0JBY0EsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxTQURNO0VBQUEsQ0FkVCxDQUFBOztBQUFBLHNCQWtCQSxLQUFBLEdBQU8sU0FBQSxHQUFBO0FBQ0wsSUFBQSxNQUFBLENBQU8sQ0FBQSxJQUFLLENBQUEsT0FBWixFQUNFLHlDQURGLENBQUEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUZYLENBQUE7V0FHQSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBSks7RUFBQSxDQWxCUCxDQUFBOztBQUFBLHNCQXlCQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBQ1QsSUFBQSxNQUFBLENBQU8sQ0FBQSxJQUFLLENBQUEsUUFBWixFQUNFLG9EQURGLENBQUEsQ0FBQTtXQUVBLElBQUMsQ0FBQSxLQUFELElBQVUsRUFIRDtFQUFBLENBekJYLENBQUE7O0FBQUEsc0JBK0JBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxJQUFBLE1BQUEsQ0FBTyxJQUFDLENBQUEsS0FBRCxHQUFTLENBQWhCLEVBQ0Usd0RBREYsQ0FBQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsS0FBRCxJQUFVLENBRlYsQ0FBQTtXQUdBLElBQUMsQ0FBQSxXQUFELENBQUEsRUFKUztFQUFBLENBL0JYLENBQUE7O0FBQUEsc0JBc0NBLElBQUEsR0FBTSxTQUFBLEdBQUE7QUFDSixJQUFBLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBQSxDQUFBO1dBQ0EsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUFHLEtBQUMsQ0FBQSxTQUFELENBQUEsRUFBSDtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLEVBRkk7RUFBQSxDQXRDTixDQUFBOztBQUFBLHNCQTRDQSxXQUFBLEdBQWEsU0FBQSxHQUFBO0FBQ1gsUUFBQSxrQ0FBQTtBQUFBLElBQUEsSUFBRyxJQUFDLENBQUEsS0FBRCxLQUFVLENBQVYsSUFBZSxJQUFDLENBQUEsT0FBRCxLQUFZLElBQTlCO0FBQ0UsTUFBQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQVosQ0FBQTtBQUNBO0FBQUE7V0FBQSwyQ0FBQTs0QkFBQTtBQUFBLHNCQUFBLFFBQUEsQ0FBQSxFQUFBLENBQUE7QUFBQTtzQkFGRjtLQURXO0VBQUEsQ0E1Q2IsQ0FBQTs7bUJBQUE7O0lBN0JGLENBQUE7Ozs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxTQUFBLEdBQUE7U0FFbEI7QUFBQSxJQUFBLE9BQUEsRUFBUyxTQUFDLEdBQUQsR0FBQTtBQUNQLFVBQUEsSUFBQTtBQUFBLE1BQUEsSUFBbUIsV0FBbkI7QUFBQSxlQUFPLElBQVAsQ0FBQTtPQUFBO0FBQ0EsV0FBQSxXQUFBLEdBQUE7QUFDRSxRQUFBLElBQWdCLEdBQUcsQ0FBQyxjQUFKLENBQW1CLElBQW5CLENBQWhCO0FBQUEsaUJBQU8sS0FBUCxDQUFBO1NBREY7QUFBQSxPQURBO2FBSUEsS0FMTztJQUFBLENBQVQ7QUFBQSxJQVFBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTtBQUNSLFVBQUEsaUJBQUE7QUFBQSxNQUFBLElBQUEsR0FBTyxNQUFQLENBQUE7QUFFQSxXQUFBLFdBQUE7MEJBQUE7QUFDRSxRQUFBLFNBQUEsT0FBUyxHQUFULENBQUE7QUFBQSxRQUNBLElBQUssQ0FBQSxJQUFBLENBQUwsR0FBYSxLQURiLENBREY7QUFBQSxPQUZBO2FBTUEsS0FQUTtJQUFBLENBUlY7SUFGa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUFqQixDQUFBOzs7OztBQ0FBLElBQUEsQ0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQW9CLENBQUEsU0FBQSxHQUFBO1NBSWxCO0FBQUEsSUFBQSxRQUFBLEVBQVUsU0FBQyxHQUFELEdBQUE7QUFDUixVQUFBLFdBQUE7QUFBQSxNQUFBLFdBQUEsR0FBYyxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVAsQ0FBVyxDQUFDLE9BQVosQ0FBb0Isb0JBQXBCLEVBQTBDLE9BQTFDLENBQWtELENBQUMsV0FBbkQsQ0FBQSxDQUFkLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFXLFdBQVgsRUFGUTtJQUFBLENBQVY7QUFBQSxJQU1BLFVBQUEsRUFBYSxTQUFDLEdBQUQsR0FBQTtBQUNULE1BQUEsR0FBQSxHQUFVLFdBQUosR0FBYyxFQUFkLEdBQXNCLE1BQUEsQ0FBTyxHQUFQLENBQTVCLENBQUE7QUFDQSxhQUFPLEdBQUcsQ0FBQyxNQUFKLENBQVcsQ0FBWCxDQUFhLENBQUMsV0FBZCxDQUFBLENBQUEsR0FBOEIsR0FBRyxDQUFDLEtBQUosQ0FBVSxDQUFWLENBQXJDLENBRlM7SUFBQSxDQU5iO0FBQUEsSUFZQSxRQUFBLEVBQVUsU0FBQyxHQUFELEdBQUE7QUFDUixNQUFBLElBQUksV0FBSjtlQUNFLEdBREY7T0FBQSxNQUFBO2VBR0UsTUFBQSxDQUFPLEdBQVAsQ0FBVyxDQUFDLE9BQVosQ0FBb0IsYUFBcEIsRUFBbUMsU0FBQyxDQUFELEdBQUE7aUJBQ2pDLENBQUMsQ0FBQyxXQUFGLENBQUEsRUFEaUM7UUFBQSxDQUFuQyxFQUhGO09BRFE7SUFBQSxDQVpWO0FBQUEsSUFxQkEsU0FBQSxFQUFXLFNBQUMsR0FBRCxHQUFBO2FBQ1QsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQVcsQ0FBQyxPQUFaLENBQW9CLFVBQXBCLEVBQWdDLEtBQWhDLENBQXNDLENBQUMsT0FBdkMsQ0FBK0MsVUFBL0MsRUFBMkQsR0FBM0QsQ0FBK0QsQ0FBQyxXQUFoRSxDQUFBLEVBRFM7SUFBQSxDQXJCWDtBQUFBLElBMEJBLE1BQUEsRUFBUSxTQUFDLE1BQUQsRUFBUyxNQUFULEdBQUE7QUFDTixNQUFBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxNQUFmLENBQUEsS0FBMEIsQ0FBN0I7ZUFDRSxPQURGO09BQUEsTUFBQTtlQUdFLEVBQUEsR0FBSyxNQUFMLEdBQWMsT0FIaEI7T0FETTtJQUFBLENBMUJSO0FBQUEsSUFtQ0EsWUFBQSxFQUFjLFNBQUMsR0FBRCxHQUFBO2FBQ1osSUFBSSxDQUFDLFNBQUwsQ0FBZSxHQUFmLEVBQW9CLElBQXBCLEVBQTBCLENBQTFCLEVBRFk7SUFBQSxDQW5DZDtBQUFBLElBc0NBLFFBQUEsRUFBVSxTQUFDLEdBQUQsR0FBQTthQUNSLENBQUMsQ0FBQyxJQUFGLENBQU8sR0FBUCxDQUFXLENBQUMsT0FBWixDQUFvQixjQUFwQixFQUFvQyxTQUFDLEtBQUQsRUFBUSxDQUFSLEdBQUE7ZUFDbEMsQ0FBQyxDQUFDLFdBQUYsQ0FBQSxFQURrQztNQUFBLENBQXBDLEVBRFE7SUFBQSxDQXRDVjtBQUFBLElBMkNBLElBQUEsRUFBTSxTQUFDLEdBQUQsR0FBQTthQUNKLEdBQUcsQ0FBQyxPQUFKLENBQVksWUFBWixFQUEwQixFQUExQixFQURJO0lBQUEsQ0EzQ047SUFKa0I7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUxqQixDQUFBOzs7OztBQ0FBLElBQUEscUVBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBRFQsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sTUFBTSxDQUFDLEdBRmIsQ0FBQTs7QUFBQSxJQUdBLEdBQU8sTUFBTSxDQUFDLElBSGQsQ0FBQTs7QUFBQSxpQkFJQSxHQUFvQixPQUFBLENBQVEsZ0NBQVIsQ0FKcEIsQ0FBQTs7QUFBQSxRQUtBLEdBQVcsT0FBQSxDQUFRLHFCQUFSLENBTFgsQ0FBQTs7QUFBQSxHQU1BLEdBQU0sT0FBQSxDQUFRLG9CQUFSLENBTk4sQ0FBQTs7QUFBQSxNQVFNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsdUJBQUMsSUFBRCxHQUFBO0FBQ1gsSUFEYyxJQUFDLENBQUEsYUFBQSxPQUFPLElBQUMsQ0FBQSxhQUFBLE9BQU8sSUFBQyxDQUFBLGtCQUFBLFlBQVksSUFBQyxDQUFBLGtCQUFBLFVBQzVDLENBQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLEtBQVYsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBRG5CLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxlQUFELEdBQW1CLEtBRm5CLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixDQUFDLENBQUMsU0FBRixDQUFBLENBSHBCLENBQUE7QUFLQSxJQUFBLElBQUEsQ0FBQSxJQUFRLENBQUEsVUFBUjtBQUVFLE1BQUEsSUFBQyxDQUFBLEtBQ0MsQ0FBQyxJQURILENBQ1EsZUFEUixFQUN5QixJQUR6QixDQUVFLENBQUMsUUFGSCxDQUVZLEdBQUcsQ0FBQyxTQUZoQixDQUdFLENBQUMsSUFISCxDQUdRLElBQUksQ0FBQyxRQUhiLEVBR3VCLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFIakMsQ0FBQSxDQUZGO0tBTEE7QUFBQSxJQVlBLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FaQSxDQURXO0VBQUEsQ0FBYjs7QUFBQSwwQkFnQkEsTUFBQSxHQUFRLFNBQUMsSUFBRCxHQUFBO0FBQ04sSUFBQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFGTTtFQUFBLENBaEJSLENBQUE7O0FBQUEsMEJBcUJBLGFBQUEsR0FBZSxTQUFBLEdBQUE7QUFDYixJQUFBLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFoQixDQUFBLENBQUE7QUFFQSxJQUFBLElBQUcsQ0FBQSxJQUFLLENBQUEsUUFBRCxDQUFBLENBQVA7QUFDRSxNQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLENBQUEsQ0FERjtLQUZBO1dBS0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFOYTtFQUFBLENBckJmLENBQUE7O0FBQUEsMEJBOEJBLFVBQUEsR0FBWSxTQUFBLEdBQUE7QUFDVixRQUFBLGlCQUFBO0FBQUE7QUFBQSxTQUFBLFlBQUE7eUJBQUE7QUFDRSxNQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFnQixLQUFoQixDQUFBLENBREY7QUFBQSxLQUFBO1dBR0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFKVTtFQUFBLENBOUJaLENBQUE7O0FBQUEsMEJBcUNBLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtXQUNoQixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsU0FBRCxHQUFBO0FBQ2YsWUFBQSxLQUFBO0FBQUEsUUFBQSxJQUFHLFNBQVMsQ0FBQyxRQUFiO0FBQ0UsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQVIsQ0FBQTtBQUNBLFVBQUEsSUFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBSDttQkFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFNBQVYsRUFBcUIsTUFBckIsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLEVBQXFCLEVBQXJCLEVBSEY7V0FGRjtTQURlO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFEZ0I7RUFBQSxDQXJDbEIsQ0FBQTs7QUFBQSwwQkFpREEsYUFBQSxHQUFlLFNBQUEsR0FBQTtXQUNiLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDZixRQUFBLElBQUcsU0FBUyxDQUFDLFFBQWI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGE7RUFBQSxDQWpEZixDQUFBOztBQUFBLDBCQXlEQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7V0FDbEIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLFNBQUQsR0FBQTtBQUNmLFFBQUEsSUFBRyxTQUFTLENBQUMsUUFBVixJQUFzQixLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxTQUFTLENBQUMsSUFBekIsQ0FBekI7aUJBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBNUIsQ0FBaUMsQ0FBQSxDQUFFLFNBQVMsQ0FBQyxJQUFaLENBQWpDLEVBREY7U0FEZTtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBRGtCO0VBQUEsQ0F6RHBCLENBQUE7O0FBQUEsMEJBK0RBLElBQUEsR0FBTSxTQUFBLEdBQUE7V0FDSixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxDQUFhLENBQUMsSUFBZCxDQUFtQixlQUFuQixFQURJO0VBQUEsQ0EvRE4sQ0FBQTs7QUFBQSwwQkFtRUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFBLENBQWEsQ0FBQyxJQUFkLENBQW1CLGVBQW5CLEVBREk7RUFBQSxDQW5FTixDQUFBOztBQUFBLDBCQXVFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBZ0IsR0FBRyxDQUFDLGtCQUFwQixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBRlk7RUFBQSxDQXZFZCxDQUFBOztBQUFBLDBCQTRFQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1osSUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsR0FBRyxDQUFDLGtCQUF2QixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUZZO0VBQUEsQ0E1RWQsQ0FBQTs7QUFBQSwwQkFrRkEsS0FBQSxHQUFPLFNBQUMsTUFBRCxHQUFBO0FBQ0wsUUFBQSxXQUFBO0FBQUEsSUFBQSxLQUFBLG1EQUE4QixDQUFBLENBQUEsQ0FBRSxDQUFDLGFBQWpDLENBQUE7V0FDQSxDQUFBLENBQUUsS0FBRixDQUFRLENBQUMsS0FBVCxDQUFBLEVBRks7RUFBQSxDQWxGUCxDQUFBOztBQUFBLDBCQXVGQSxRQUFBLEdBQVUsU0FBQSxHQUFBO1dBQ1IsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLEdBQUcsQ0FBQyxrQkFBcEIsRUFEUTtFQUFBLENBdkZWLENBQUE7O0FBQUEsMEJBMkZBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTtXQUNyQixJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLHFCQUFWLENBQUEsRUFEcUI7RUFBQSxDQTNGdkIsQ0FBQTs7QUFBQSwwQkErRkEsNkJBQUEsR0FBK0IsU0FBQSxHQUFBO1dBQzdCLEdBQUcsQ0FBQyw2QkFBSixDQUFrQyxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBekMsRUFENkI7RUFBQSxDQS9GL0IsQ0FBQTs7QUFBQSwwQkFtR0EsT0FBQSxHQUFTLFNBQUMsT0FBRCxHQUFBO0FBQ1AsUUFBQSxnQ0FBQTtBQUFBO1NBQUEsZUFBQTs0QkFBQTtBQUNFLE1BQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQVosQ0FBQTtBQUNBLE1BQUEsSUFBRyxTQUFTLENBQUMsT0FBYjtBQUNFLFFBQUEsSUFBRyw2QkFBSDt3QkFDRSxJQUFDLENBQUEsR0FBRCxDQUFLLElBQUwsRUFBVyxTQUFTLENBQUMsV0FBckIsR0FERjtTQUFBLE1BQUE7d0JBR0UsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsU0FBUyxDQUFDLFdBQVYsQ0FBQSxDQUFYLEdBSEY7U0FERjtPQUFBLE1BQUE7c0JBTUUsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMLEVBQVcsS0FBWCxHQU5GO09BRkY7QUFBQTtvQkFETztFQUFBLENBbkdULENBQUE7O0FBQUEsMEJBK0dBLEdBQUEsR0FBSyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDSCxRQUFBLFNBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBaEIsQ0FBWixDQUFBO0FBQ0EsWUFBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxXQUNPLFVBRFA7ZUFDdUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiLEVBQW1CLEtBQW5CLEVBRHZCO0FBQUEsV0FFTyxPQUZQO2VBRW9CLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFnQixLQUFoQixFQUZwQjtBQUFBLFdBR08sTUFIUDtlQUdtQixJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsRUFBZSxLQUFmLEVBSG5CO0FBQUEsS0FGRztFQUFBLENBL0dMLENBQUE7O0FBQUEsMEJBdUhBLEdBQUEsR0FBSyxTQUFDLElBQUQsR0FBQTtBQUNILFFBQUEsU0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFoQixDQUFaLENBQUE7QUFDQSxZQUFPLFNBQVMsQ0FBQyxJQUFqQjtBQUFBLFdBQ08sVUFEUDtlQUN1QixJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFEdkI7QUFBQSxXQUVPLE9BRlA7ZUFFb0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLEVBRnBCO0FBQUEsV0FHTyxNQUhQO2VBR21CLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUhuQjtBQUFBLEtBRkc7RUFBQSxDQXZITCxDQUFBOztBQUFBLDBCQStIQSxXQUFBLEdBQWEsU0FBQyxJQUFELEdBQUE7QUFDWCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO1dBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBQSxFQUZXO0VBQUEsQ0EvSGIsQ0FBQTs7QUFBQSwwQkFvSUEsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTtBQUNYLFFBQUEsS0FBQTtBQUFBLElBQUEsSUFBVSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVY7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUZSLENBQUE7QUFBQSxJQUdBLEtBQUssQ0FBQyxXQUFOLENBQWtCLEdBQUcsQ0FBQyxhQUF0QixFQUFxQyxPQUFBLENBQVEsS0FBUixDQUFyQyxDQUhBLENBQUE7QUFBQSxJQUlBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxDQUFDLFdBQWhCLEVBQTZCLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBaEQsQ0FKQSxDQUFBO1dBTUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFBLElBQVMsRUFBcEIsRUFQVztFQUFBLENBcEliLENBQUE7O0FBQUEsMEJBOElBLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7V0FDQSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQUcsQ0FBQyxhQUFuQixFQUZhO0VBQUEsQ0E5SWYsQ0FBQTs7QUFBQSwwQkFtSkEsWUFBQSxHQUFjLFNBQUMsSUFBRCxHQUFBO0FBQ1osUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtBQUNBLElBQUEsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxJQUFmLENBQUg7YUFDRSxLQUFLLENBQUMsV0FBTixDQUFrQixHQUFHLENBQUMsYUFBdEIsRUFERjtLQUZZO0VBQUEsQ0FuSmQsQ0FBQTs7QUFBQSwwQkF5SkEsT0FBQSxHQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1AsUUFBQSxLQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtXQUNBLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFGTztFQUFBLENBekpULENBQUE7O0FBQUEsMEJBOEpBLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUCxRQUFBLEtBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQUEsSUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQUEsSUFBUyxFQUFwQixDQURBLENBQUE7QUFHQSxJQUFBLElBQUcsQ0FBQSxLQUFIO0FBQ0UsTUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBOUIsQ0FBQSxDQURGO0tBQUEsTUFFSyxJQUFHLEtBQUEsSUFBVSxDQUFBLElBQUssQ0FBQSxVQUFsQjtBQUNILE1BQUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLENBQUEsQ0FERztLQUxMO0FBQUEsSUFRQSxJQUFDLENBQUEsc0JBQUQsSUFBQyxDQUFBLG9CQUFzQixHQVJ2QixDQUFBO1dBU0EsSUFBQyxDQUFBLGlCQUFrQixDQUFBLElBQUEsQ0FBbkIsR0FBMkIsS0FWcEI7RUFBQSxDQTlKVCxDQUFBOztBQUFBLDBCQTJLQSxtQkFBQSxHQUFxQixTQUFDLGFBQUQsR0FBQTtBQUNuQixRQUFBLElBQUE7cUVBQThCLENBQUUsY0FEYjtFQUFBLENBM0tyQixDQUFBOztBQUFBLDBCQXNMQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFFBQUEscUJBQUE7QUFBQTtTQUFBLDhCQUFBLEdBQUE7QUFDRSxNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBcUIsSUFBckIsQ0FBUixDQUFBO0FBQ0EsTUFBQSxJQUFHLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQUFvQixDQUFDLE1BQXhCO3NCQUNFLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxFQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUSxDQUFBLElBQUEsQ0FBMUIsR0FERjtPQUFBLE1BQUE7OEJBQUE7T0FGRjtBQUFBO29CQURlO0VBQUEsQ0F0TGpCLENBQUE7O0FBQUEsMEJBNkxBLFFBQUEsR0FBVSxTQUFDLElBQUQsR0FBQTtBQUNSLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixJQUFyQixDQUFSLENBQUE7V0FDQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFGUTtFQUFBLENBN0xWLENBQUE7O0FBQUEsMEJBa01BLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUixRQUFBLG1DQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLElBQXJCLENBQVIsQ0FBQTtBQUVBLElBQUEsSUFBRyxLQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWYsQ0FBQSxDQUFBO0FBQUEsTUFFQSxZQUFBLEdBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBbEIsQ0FBc0IsSUFBdEIsQ0FBMkIsQ0FBQyxlQUE1QixDQUFBLENBRmYsQ0FBQTtBQUFBLE1BR0EsWUFBWSxDQUFDLEdBQWIsQ0FBaUIsS0FBakIsRUFBd0IsS0FBeEIsQ0FIQSxDQUFBO2FBS0EsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUE3QixFQU5GO0tBQUEsTUFBQTtBQVFFLE1BQUEsY0FBQSxHQUFpQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxtQkFBVCxFQUE4QixJQUE5QixFQUFvQyxLQUFwQyxFQUEyQyxJQUEzQyxDQUFqQixDQUFBO2FBQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQXBCLEVBQTBCLGNBQTFCLEVBVEY7S0FIUTtFQUFBLENBbE1WLENBQUE7O0FBQUEsMEJBaU5BLG1CQUFBLEdBQXFCLFNBQUMsS0FBRCxFQUFRLElBQVIsR0FBQTtBQUNuQixRQUFBLGtDQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsUUFBTixDQUFlLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBMUIsQ0FBQSxDQUFBO0FBQ0EsSUFBQSxJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFULEtBQXFCLEtBQXhCO0FBQ0UsTUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBQSxDQUFSLENBQUE7QUFBQSxNQUNBLE1BQUEsR0FBUyxLQUFLLENBQUMsTUFBTixDQUFBLENBRFQsQ0FERjtLQUFBLE1BQUE7QUFJRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsVUFBTixDQUFBLENBQVIsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxHQUFTLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FEVCxDQUpGO0tBREE7QUFBQSxJQU9BLEtBQUEsR0FBUyxzQkFBQSxHQUFzQixLQUF0QixHQUE0QixHQUE1QixHQUErQixNQUEvQixHQUFzQyxnQkFQL0MsQ0FBQTtBQUFBLElBU0EsWUFBQSxHQUFlLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWxCLENBQXNCLElBQXRCLENBQTJCLENBQUMsZUFBNUIsQ0FBQSxDQVRmLENBQUE7V0FVQSxZQUFZLENBQUMsR0FBYixDQUFpQixLQUFqQixFQUF3QixLQUF4QixFQVhtQjtFQUFBLENBak5yQixDQUFBOztBQUFBLDBCQStOQSxRQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sU0FBUCxHQUFBO0FBQ1IsUUFBQSxvQ0FBQTtBQUFBLElBQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBTyxDQUFBLElBQUEsQ0FBSyxDQUFDLGVBQXZCLENBQXVDLFNBQXZDLENBQVYsQ0FBQTtBQUNBLElBQUEsSUFBRyxPQUFPLENBQUMsTUFBWDtBQUNFO0FBQUEsV0FBQSwyQ0FBQTsrQkFBQTtBQUNFLFFBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQW1CLFdBQW5CLENBQUEsQ0FERjtBQUFBLE9BREY7S0FEQTtXQUtBLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBUCxDQUFnQixPQUFPLENBQUMsR0FBeEIsRUFOUTtFQUFBLENBL05WLENBQUE7O0FBQUEsMEJBNE9BLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7V0FDZCxVQUFBLENBQVksQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNWLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQUFvQixDQUFDLElBQXJCLENBQTBCLFVBQTFCLEVBQXNDLElBQXRDLEVBRFU7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaLEVBRUUsR0FGRixFQURjO0VBQUEsQ0E1T2hCLENBQUE7O0FBQUEsMEJBcVBBLGdCQUFBLEdBQWtCLFNBQUMsS0FBRCxHQUFBO0FBQ2hCLFFBQUEsUUFBQTtBQUFBLElBQUEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEtBQXhCLENBQUEsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFXLENBQUEsQ0FBRyxjQUFBLEdBQWpCLEdBQUcsQ0FBQyxrQkFBYSxHQUF1QyxJQUExQyxDQUNULENBQUMsSUFEUSxDQUNILE9BREcsRUFDTSwyREFETixDQURYLENBQUE7QUFBQSxJQUdBLEtBQUssQ0FBQyxNQUFOLENBQWEsUUFBYixDQUhBLENBQUE7V0FLQSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQixFQU5nQjtFQUFBLENBclBsQixDQUFBOztBQUFBLDBCQWdRQSxzQkFBQSxHQUF3QixTQUFDLEtBQUQsR0FBQTtBQUN0QixRQUFBLFFBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsQ0FBWCxDQUFBO0FBQ0EsSUFBQSxJQUFHLFFBQUEsS0FBWSxVQUFaLElBQTBCLFFBQUEsS0FBWSxPQUF0QyxJQUFpRCxRQUFBLEtBQVksVUFBaEU7YUFDRSxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsRUFBc0IsVUFBdEIsRUFERjtLQUZzQjtFQUFBLENBaFF4QixDQUFBOztBQUFBLDBCQXNRQSxhQUFBLEdBQWUsU0FBQSxHQUFBO1dBQ2IsQ0FBQSxDQUFFLEdBQUcsQ0FBQyxhQUFKLENBQWtCLElBQUMsQ0FBQSxLQUFNLENBQUEsQ0FBQSxDQUF6QixDQUE0QixDQUFDLElBQS9CLEVBRGE7RUFBQSxDQXRRZixDQUFBOztBQUFBLDBCQTJRQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDbEIsSUFBQSxJQUFHLElBQUMsQ0FBQSxlQUFKO2FBQ0UsSUFBQSxDQUFBLEVBREY7S0FBQSxNQUFBO0FBR0UsTUFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWYsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsWUFBRCxJQUFDLENBQUEsVUFBWSxHQURiLENBQUE7YUFFQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixRQUFRLENBQUMsUUFBVCxDQUFrQixJQUFDLENBQUEsZ0JBQW5CLEVBQXFDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFBLEdBQUE7QUFDcEQsVUFBQSxLQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBVCxHQUFpQixNQUFqQixDQUFBO2lCQUNBLElBQUEsQ0FBQSxFQUZvRDtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDLEVBTG5CO0tBRGtCO0VBQUEsQ0EzUXBCLENBQUE7O0FBQUEsMEJBc1JBLGFBQUEsR0FBZSxTQUFDLElBQUQsR0FBQTtBQUNiLFFBQUEsSUFBQTtBQUFBLElBQUEsd0NBQWEsQ0FBQSxJQUFBLFVBQWI7QUFDRSxNQUFBLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxNQUFsQixDQUF5QixJQUFDLENBQUEsT0FBUSxDQUFBLElBQUEsQ0FBbEMsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFBLENBQVQsR0FBaUIsT0FGbkI7S0FEYTtFQUFBLENBdFJmLENBQUE7O0FBQUEsMEJBNFJBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtBQUNuQixRQUFBLHdCQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsSUFBZSxDQUFBLFVBQWY7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBRUEsUUFBQSxHQUFlLElBQUEsaUJBQUEsQ0FBa0IsSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBQXpCLENBRmYsQ0FBQTtBQUdBO1dBQU0sSUFBQSxHQUFPLFFBQVEsQ0FBQyxXQUFULENBQUEsQ0FBYixHQUFBO0FBQ0UsTUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFwQixDQURBLENBQUE7QUFBQSxvQkFFQSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsSUFBdEIsRUFGQSxDQURGO0lBQUEsQ0FBQTtvQkFKbUI7RUFBQSxDQTVSckIsQ0FBQTs7QUFBQSwwQkFzU0EsZUFBQSxHQUFpQixTQUFDLElBQUQsR0FBQTtBQUNmLFFBQUEsc0NBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFDQTtBQUFBO1NBQUEsMkNBQUE7dUJBQUE7QUFDRSxNQUFBLElBQTRCLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEtBQWhCLENBQTVCO3NCQUFBLEtBQUssQ0FBQyxXQUFOLENBQWtCLEtBQWxCLEdBQUE7T0FBQSxNQUFBOzhCQUFBO09BREY7QUFBQTtvQkFGZTtFQUFBLENBdFNqQixDQUFBOztBQUFBLDBCQTRTQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsR0FBQTtBQUNsQixRQUFBLGdEQUFBO0FBQUEsSUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQ0E7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0UsTUFBQSxJQUFBLEdBQU8sU0FBUyxDQUFDLElBQWpCLENBQUE7QUFDQSxNQUFBLElBQTBCLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLElBQXRCLENBQTFCO3NCQUFBLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCLEdBQUE7T0FBQSxNQUFBOzhCQUFBO09BRkY7QUFBQTtvQkFGa0I7RUFBQSxDQTVTcEIsQ0FBQTs7QUFBQSwwQkFtVEEsb0JBQUEsR0FBc0IsU0FBQyxJQUFELEdBQUE7QUFDcEIsUUFBQSx5R0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLElBQ0Esb0JBQUEsR0FBdUIsQ0FBQyxPQUFELEVBQVUsT0FBVixDQUR2QixDQUFBO0FBRUE7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0UsTUFBQSxxQkFBQSxHQUF3QixvQkFBb0IsQ0FBQyxPQUFyQixDQUE2QixTQUFTLENBQUMsSUFBdkMsQ0FBQSxJQUFnRCxDQUF4RSxDQUFBO0FBQUEsTUFDQSxnQkFBQSxHQUFtQixTQUFTLENBQUMsS0FBSyxDQUFDLElBQWhCLENBQUEsQ0FBQSxLQUEwQixFQUQ3QyxDQUFBO0FBRUEsTUFBQSxJQUFHLHFCQUFBLElBQTBCLGdCQUE3QjtzQkFDRSxLQUFLLENBQUMsVUFBTixDQUFpQixTQUFTLENBQUMsSUFBM0IsR0FERjtPQUFBLE1BQUE7OEJBQUE7T0FIRjtBQUFBO29CQUhvQjtFQUFBLENBblR0QixDQUFBOztBQUFBLDBCQTZUQSxnQkFBQSxHQUFrQixTQUFDLE1BQUQsR0FBQTtBQUNoQixJQUFBLElBQVUsTUFBQSxLQUFVLElBQUMsQ0FBQSxlQUFyQjtBQUFBLFlBQUEsQ0FBQTtLQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsZUFBRCxHQUFtQixNQUZuQixDQUFBO0FBSUEsSUFBQSxJQUFHLE1BQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBQSxDQUFBO2FBQ0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLElBQWxCLENBQUEsRUFGRjtLQUxnQjtFQUFBLENBN1RsQixDQUFBOzt1QkFBQTs7SUFWRixDQUFBOzs7OztBQ0FBLElBQUEsMkNBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxNQUNBLEdBQVMsT0FBQSxDQUFRLDJCQUFSLENBRFQsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sT0FBQSxDQUFRLHdCQUFSLENBRk4sQ0FBQTs7QUFBQSxTQUdBLEdBQVksT0FBQSxDQUFRLHNCQUFSLENBSFosQ0FBQTs7QUFBQSxNQUlBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBSlQsQ0FBQTs7QUFBQSxNQU1NLENBQUMsT0FBUCxHQUF1QjtBQU9SLEVBQUEsa0JBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSwyQkFBQTtBQUFBLElBRGMsSUFBQyxDQUFBLHFCQUFBLGVBQWUsSUFBQyxDQUFBLDBCQUFBLG9CQUFvQixnQkFBQSxVQUFVLHlCQUFBLGlCQUM3RCxDQUFBO0FBQUEsSUFBQSxNQUFBLENBQU8sSUFBQyxDQUFBLGFBQVIsRUFBdUIsNEJBQXZCLENBQUEsQ0FBQTtBQUFBLElBQ0EsTUFBQSxDQUFPLElBQUMsQ0FBQSxrQkFBUixFQUE0QixrQ0FBNUIsQ0FEQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsQ0FBRSxJQUFDLENBQUEsa0JBQWtCLENBQUMsVUFBdEIsQ0FIVCxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsWUFBRCxHQUFnQixRQUpoQixDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsY0FBRCxHQUFrQixFQUxsQixDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsRUFQeEIsQ0FBQTtBQUFBLElBUUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLGlCQUFsQixDQVJBLENBQUE7QUFBQSxJQVNBLElBQUMsQ0FBQSxjQUFELEdBQXNCLElBQUEsU0FBQSxDQUFBLENBVHRCLENBQUE7QUFBQSxJQVVBLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBVkEsQ0FBQTtBQUFBLElBV0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxLQUFoQixDQUFBLENBWEEsQ0FEVztFQUFBLENBQWI7O0FBQUEscUJBZ0JBLGdCQUFBLEdBQWtCLFNBQUMsV0FBRCxHQUFBO0FBQ2hCLFFBQUEsZ0NBQUE7QUFBQSxJQUFBLElBQWMsbUJBQWQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUNBLElBQUEsSUFBRyxDQUFDLENBQUMsT0FBRixDQUFVLFdBQVYsQ0FBSDtBQUNFO1dBQUEsa0RBQUE7aUNBQUE7QUFDRSxzQkFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsRUFBQSxDQURGO0FBQUE7c0JBREY7S0FBQSxNQUFBO0FBSUUsTUFBQSxJQUFDLENBQUEsb0JBQXFCLENBQUEsV0FBQSxDQUF0QixHQUFxQyxJQUFyQyxDQUFBO0FBQUEsTUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQWUsQ0FBQSxXQUFBLENBRHZCLENBQUE7QUFFQSxNQUFBLElBQUcsY0FBQSxJQUFVLElBQUksQ0FBQyxlQUFsQjtlQUNFLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUksQ0FBQyxLQUF0QixFQURGO09BTkY7S0FGZ0I7RUFBQSxDQWhCbEIsQ0FBQTs7QUFBQSxxQkE0QkEsT0FBQSxHQUFTLFNBQUEsR0FBQTtBQUNQLFFBQUEsdUJBQUE7QUFBQSxJQUFBLDhDQUFnQixDQUFFLGdCQUFmLElBQXlCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBMUM7QUFDRSxNQUFBLFFBQUEsR0FBWSxHQUFBLEdBQWpCLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTixDQUFBO0FBQUEsTUFDQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLFFBQW5CLENBQTRCLENBQUMsR0FBN0IsQ0FBa0MsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLENBQXFCLFFBQXJCLENBQWxDLENBRFYsQ0FBQTtBQUVBLE1BQUEsSUFBRyxPQUFPLENBQUMsTUFBWDtBQUNFLFFBQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsS0FBYixDQUFBO0FBQUEsUUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLFlBQWxCLENBREEsQ0FBQTtBQUFBLFFBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxPQUZULENBREY7T0FIRjtLQUFBO1dBVUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksZUFBWixFQUE2QixJQUFDLENBQUEsYUFBOUIsRUFYTztFQUFBLENBNUJULENBQUE7O0FBQUEscUJBMENBLG1CQUFBLEdBQXFCLFNBQUEsR0FBQTtBQUNuQixJQUFBLElBQUMsQ0FBQSxjQUFjLENBQUMsU0FBaEIsQ0FBQSxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsS0FBcEIsQ0FBMEIsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtBQUN4QixRQUFBLEtBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxDQUFBO0FBQUEsUUFDQSxLQUFDLENBQUEsTUFBRCxDQUFBLENBREEsQ0FBQTtBQUFBLFFBRUEsS0FBQyxDQUFBLDJCQUFELENBQUEsQ0FGQSxDQUFBO2VBR0EsS0FBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLEVBSndCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUIsRUFGbUI7RUFBQSxDQTFDckIsQ0FBQTs7QUFBQSxxQkFtREEsS0FBQSxHQUFPLFNBQUMsUUFBRCxHQUFBO1dBQ0wsSUFBQyxDQUFBLGNBQWMsQ0FBQyxXQUFoQixDQUE0QixRQUE1QixFQURLO0VBQUEsQ0FuRFAsQ0FBQTs7QUFBQSxxQkF1REEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBaEIsQ0FBQSxFQURPO0VBQUEsQ0F2RFQsQ0FBQTs7QUFBQSxxQkEyREEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBUCxFQUFtQiw4Q0FBbkIsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQUEsRUFGSTtFQUFBLENBM0ROLENBQUE7O0FBQUEscUJBbUVBLDJCQUFBLEdBQTZCLFNBQUEsR0FBQTtBQUMzQixJQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsY0FBYyxDQUFDLEdBQTlCLENBQW1DLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLGNBQVQsRUFBeUIsSUFBekIsQ0FBbkMsQ0FBQSxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEdBQWhDLENBQXFDLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLGdCQUFULEVBQTJCLElBQTNCLENBQXJDLENBREEsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxjQUFjLENBQUMsR0FBOUIsQ0FBbUMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsY0FBVCxFQUF5QixJQUF6QixDQUFuQyxDQUZBLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxhQUFhLENBQUMsdUJBQXVCLENBQUMsR0FBdkMsQ0FBNEMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsdUJBQVQsRUFBa0MsSUFBbEMsQ0FBNUMsQ0FIQSxDQUFBO1dBSUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFwQyxDQUF5QyxDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxvQkFBVCxFQUErQixJQUEvQixDQUF6QyxFQUwyQjtFQUFBLENBbkU3QixDQUFBOztBQUFBLHFCQTJFQSxjQUFBLEdBQWdCLFNBQUMsS0FBRCxHQUFBO1dBQ2QsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBakIsRUFEYztFQUFBLENBM0VoQixDQUFBOztBQUFBLHFCQStFQSxnQkFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixJQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxxQ0FBRCxDQUF1QyxLQUF2QyxFQUZnQjtFQUFBLENBL0VsQixDQUFBOztBQUFBLHFCQW9GQSxjQUFBLEdBQWdCLFNBQUMsS0FBRCxHQUFBO0FBQ2QsSUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixLQUFqQixDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixLQUFqQixFQUZjO0VBQUEsQ0FwRmhCLENBQUE7O0FBQUEscUJBeUZBLHVCQUFBLEdBQXlCLFNBQUMsS0FBRCxHQUFBO1dBQ3ZCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLGFBQWxDLENBQUEsRUFEdUI7RUFBQSxDQXpGekIsQ0FBQTs7QUFBQSxxQkE2RkEsb0JBQUEsR0FBc0IsU0FBQyxLQUFELEdBQUE7V0FDcEIsSUFBQyxDQUFBLHlCQUFELENBQTJCLEtBQTNCLENBQWlDLENBQUMsVUFBbEMsQ0FBQSxFQURvQjtFQUFBLENBN0Z0QixDQUFBOztBQUFBLHFCQXFHQSx5QkFBQSxHQUEyQixTQUFDLEtBQUQsR0FBQTtBQUN6QixRQUFBLFlBQUE7b0JBQUEsSUFBQyxDQUFBLHdCQUFlLEtBQUssQ0FBQyx1QkFBUSxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFDLENBQUEsa0JBQWtCLENBQUMsVUFBckMsR0FETDtFQUFBLENBckczQixDQUFBOztBQUFBLHFCQXlHQSxxQ0FBQSxHQUF1QyxTQUFDLEtBQUQsR0FBQTtXQUNyQyxNQUFBLENBQUEsSUFBUSxDQUFBLGNBQWUsQ0FBQSxLQUFLLENBQUMsRUFBTixFQURjO0VBQUEsQ0F6R3ZDLENBQUE7O0FBQUEscUJBNkdBLE1BQUEsR0FBUSxTQUFBLEdBQUE7V0FDTixJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBb0IsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUMsS0FBRCxHQUFBO2VBQ2xCLEtBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBRGtCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsRUFETTtFQUFBLENBN0dSLENBQUE7O0FBQUEscUJBa0hBLEtBQUEsR0FBTyxTQUFBLEdBQUE7QUFDTCxJQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsSUFBZixDQUFvQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxLQUFELEdBQUE7ZUFDbEIsS0FBQyxDQUFBLHlCQUFELENBQTJCLEtBQTNCLENBQWlDLENBQUMsZ0JBQWxDLENBQW1ELEtBQW5ELEVBRGtCO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsQ0FBQSxDQUFBO1dBR0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUEsRUFKSztFQUFBLENBbEhQLENBQUE7O0FBQUEscUJBeUhBLE1BQUEsR0FBUSxTQUFBLEdBQUE7QUFDTixJQUFBLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUZNO0VBQUEsQ0F6SFIsQ0FBQTs7QUFBQSxxQkE4SEEsZUFBQSxHQUFpQixTQUFDLEtBQUQsR0FBQTtBQUNmLFFBQUEsYUFBQTtBQUFBLElBQUEsSUFBVSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsQ0FBQSxJQUErQixJQUFDLENBQUEsb0JBQXFCLENBQUEsS0FBSyxDQUFDLEVBQU4sQ0FBdEIsS0FBbUMsSUFBNUU7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBSyxDQUFDLFFBQTNCLENBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSx3QkFBRCxDQUEwQixLQUFLLENBQUMsUUFBaEMsRUFBMEMsS0FBMUMsQ0FBQSxDQURGO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFLLENBQUMsSUFBM0IsQ0FBSDtBQUNILE1BQUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLEtBQUssQ0FBQyxJQUFoQyxFQUFzQyxLQUF0QyxDQUFBLENBREc7S0FBQSxNQUVBLElBQUcsS0FBSyxDQUFDLGVBQVQ7QUFDSCxNQUFBLElBQUMsQ0FBQSxnQ0FBRCxDQUFrQyxLQUFsQyxDQUFBLENBREc7S0FBQSxNQUFBO0FBR0gsTUFBQSxHQUFHLENBQUMsS0FBSixDQUFVLDhDQUFWLENBQUEsQ0FIRztLQU5MO0FBQUEsSUFXQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQVhoQixDQUFBO0FBQUEsSUFZQSxhQUFhLENBQUMsZ0JBQWQsQ0FBK0IsSUFBL0IsQ0FaQSxDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsa0JBQWtCLENBQUMsd0JBQXBCLENBQTZDLGFBQTdDLENBYkEsQ0FBQTtXQWNBLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QixFQWZlO0VBQUEsQ0E5SGpCLENBQUE7O0FBQUEscUJBZ0pBLG1CQUFBLEdBQXFCLFNBQUMsS0FBRCxHQUFBO1dBQ25CLEtBQUEsSUFBUyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsS0FBM0IsQ0FBaUMsQ0FBQyxnQkFEeEI7RUFBQSxDQWhKckIsQ0FBQTs7QUFBQSxxQkFvSkEscUJBQUEsR0FBdUIsU0FBQyxLQUFELEdBQUE7V0FDckIsS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxVQUFELEdBQUE7QUFDYixRQUFBLElBQUcsQ0FBQSxLQUFLLENBQUEsbUJBQUQsQ0FBcUIsVUFBckIsQ0FBUDtpQkFDRSxLQUFDLENBQUEsZUFBRCxDQUFpQixVQUFqQixFQURGO1NBRGE7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmLEVBRHFCO0VBQUEsQ0FwSnZCLENBQUE7O0FBQUEscUJBMEpBLHdCQUFBLEdBQTBCLFNBQUMsT0FBRCxFQUFVLEtBQVYsR0FBQTtBQUN4QixRQUFBLE1BQUE7QUFBQSxJQUFBLE1BQUEsR0FBWSxPQUFBLEtBQVcsS0FBSyxDQUFDLFFBQXBCLEdBQWtDLE9BQWxDLEdBQStDLFFBQXhELENBQUE7V0FDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsT0FBbkIsQ0FBNEIsQ0FBQSxNQUFBLENBQTVCLENBQW9DLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixLQUFuQixDQUFwQyxFQUZ3QjtFQUFBLENBMUoxQixDQUFBOztBQUFBLHFCQStKQSxnQ0FBQSxHQUFrQyxTQUFDLEtBQUQsR0FBQTtXQUNoQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBeUIsQ0FBQyxRQUExQixDQUFtQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBSyxDQUFDLGVBQXpCLENBQW5DLEVBRGdDO0VBQUEsQ0EvSmxDLENBQUE7O0FBQUEscUJBbUtBLGlCQUFBLEdBQW1CLFNBQUMsS0FBRCxHQUFBO1dBQ2pCLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLE1BRGpCO0VBQUEsQ0FuS25CLENBQUE7O0FBQUEscUJBdUtBLGlCQUFBLEdBQW1CLFNBQUMsU0FBRCxHQUFBO0FBQ2pCLFFBQUEsVUFBQTtBQUFBLElBQUEsSUFBRyxTQUFTLENBQUMsTUFBYjthQUNFLElBQUMsQ0FBQSxNQURIO0tBQUEsTUFBQTtBQUdFLE1BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixTQUFTLENBQUMsZUFBckMsQ0FBYixDQUFBO2FBQ0EsQ0FBQSxDQUFFLFVBQVUsQ0FBQyxtQkFBWCxDQUErQixTQUFTLENBQUMsSUFBekMsQ0FBRixFQUpGO0tBRGlCO0VBQUEsQ0F2S25CLENBQUE7O0FBQUEscUJBK0tBLGVBQUEsR0FBaUIsU0FBQyxLQUFELEdBQUE7QUFDZixJQUFBLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQixDQUFpQyxDQUFDLGdCQUFsQyxDQUFtRCxLQUFuRCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBeUIsQ0FBQyxNQUExQixDQUFBLEVBRmU7RUFBQSxDQS9LakIsQ0FBQTs7a0JBQUE7O0lBYkYsQ0FBQTs7Ozs7QUNBQSxJQUFBLHFDQUFBOztBQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUixDQUFYLENBQUE7O0FBQUEsSUFDQSxHQUFPLE9BQUEsQ0FBUSw2QkFBUixDQURQLENBQUE7O0FBQUEsZUFFQSxHQUFrQixPQUFBLENBQVEseUNBQVIsQ0FGbEIsQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsY0FBRSxhQUFGLEVBQWtCLE1BQWxCLEdBQUE7QUFDWCxJQURZLElBQUMsQ0FBQSxnQkFBQSxhQUNiLENBQUE7QUFBQSxJQUQ0QixJQUFDLENBQUEsU0FBQSxNQUM3QixDQUFBOztNQUFBLElBQUMsQ0FBQSxTQUFVLE1BQU0sQ0FBQyxRQUFRLENBQUM7S0FBM0I7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLEtBRGpCLENBRFc7RUFBQSxDQUFiOztBQUFBLGlCQWNBLE1BQUEsR0FBUSxTQUFDLE9BQUQsR0FBQTtXQUNOLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLE1BQWYsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxNQUFELEVBQVMsVUFBVCxHQUFBO0FBQzFCLFlBQUEsUUFBQTtBQUFBLFFBQUEsS0FBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7QUFBQSxRQUNBLFFBQUEsR0FBVyxLQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsT0FBOUIsQ0FEWCxDQUFBO2VBRUE7QUFBQSxVQUFBLE1BQUEsRUFBUSxNQUFSO0FBQUEsVUFDQSxRQUFBLEVBQVUsUUFEVjtVQUgwQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVCLEVBRE07RUFBQSxDQWRSLENBQUE7O0FBQUEsaUJBc0JBLFlBQUEsR0FBYyxTQUFDLE1BQUQsR0FBQTtBQUNaLFFBQUEsZ0JBQUE7QUFBQSxJQUFBLFFBQUEsR0FBVyxDQUFDLENBQUMsUUFBRixDQUFBLENBQVgsQ0FBQTtBQUFBLElBRUEsTUFBQSxHQUFTLE1BQU0sQ0FBQyxhQUFhLENBQUMsYUFBckIsQ0FBbUMsUUFBbkMsQ0FGVCxDQUFBO0FBQUEsSUFHQSxNQUFNLENBQUMsR0FBUCxHQUFhLGFBSGIsQ0FBQTtBQUFBLElBSUEsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsYUFBcEIsRUFBbUMsR0FBbkMsQ0FKQSxDQUFBO0FBQUEsSUFLQSxNQUFNLENBQUMsTUFBUCxHQUFnQixTQUFBLEdBQUE7YUFBRyxRQUFRLENBQUMsT0FBVCxDQUFpQixNQUFqQixFQUFIO0lBQUEsQ0FMaEIsQ0FBQTtBQUFBLElBT0EsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsTUFBbkIsQ0FQQSxDQUFBO1dBUUEsUUFBUSxDQUFDLE9BQVQsQ0FBQSxFQVRZO0VBQUEsQ0F0QmQsQ0FBQTs7QUFBQSxpQkFrQ0Esb0JBQUEsR0FBc0IsU0FBQyxNQUFELEVBQVMsT0FBVCxHQUFBO1dBQ3BCLElBQUMsQ0FBQSxjQUFELENBQ0U7QUFBQSxNQUFBLFVBQUEsRUFBWSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQW5DO0FBQUEsTUFDQSxPQUFBLEVBQVMsT0FEVDtLQURGLEVBRG9CO0VBQUEsQ0FsQ3RCLENBQUE7O0FBQUEsaUJBd0NBLGNBQUEsR0FBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxRQUFBLGlDQUFBO0FBQUEsMEJBRGUsT0FBd0IsSUFBdEIsa0JBQUEsWUFBWSxlQUFBLE9BQzdCLENBQUE7QUFBQSxJQUFBLE1BQUEsR0FDRTtBQUFBLE1BQUEsVUFBQSxFQUFZLFVBQUEsSUFBYyxJQUFDLENBQUEsTUFBM0I7QUFBQSxNQUNBLE1BQUEsRUFBUSxJQUFDLENBQUEsYUFBYSxDQUFDLE1BRHZCO0tBREYsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVosRUFBb0IsT0FBcEIsQ0FKUixDQUFBO1dBTUksSUFBQSxRQUFBLENBQ0Y7QUFBQSxNQUFBLGtCQUFBLEVBQW9CLElBQUMsQ0FBQSxJQUFyQjtBQUFBLE1BQ0EsYUFBQSxFQUFlLElBQUMsQ0FBQSxhQURoQjtBQUFBLE1BRUEsUUFBQSxFQUFVLE9BQU8sQ0FBQyxRQUZsQjtLQURFLEVBUFU7RUFBQSxDQXhDaEIsQ0FBQTs7QUFBQSxpQkFxREEsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLElBQVQsR0FBQTtBQUNWLFFBQUEsMENBQUE7QUFBQSwwQkFEbUIsT0FBeUMsSUFBdkMsbUJBQUEsYUFBYSxnQkFBQSxVQUFVLHFCQUFBLGFBQzVDLENBQUE7O01BQUEsU0FBVTtLQUFWO0FBQUEsSUFDQSxNQUFNLENBQUMsYUFBUCxHQUF1QixhQUR2QixDQUFBO0FBRUEsSUFBQSxJQUFHLG1CQUFIO0FBQ0UsTUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFqQixDQUFBO2FBQ0ksSUFBQSxlQUFBLENBQWdCLE1BQWhCLEVBRk47S0FBQSxNQUFBO2FBSU0sSUFBQSxJQUFBLENBQUssTUFBTCxFQUpOO0tBSFU7RUFBQSxDQXJEWixDQUFBOztjQUFBOztJQU5GLENBQUE7Ozs7O0FDQUEsSUFBQSx1QkFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLFNBQ0EsR0FBWSxPQUFBLENBQVEsc0JBQVIsQ0FEWixDQUFBOztBQUFBLE1BR00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxtQkFBRSxNQUFGLEdBQUE7QUFDWCxJQURZLElBQUMsQ0FBQSxTQUFBLE1BQ2IsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUFiOztBQUFBLHNCQUlBLElBQUEsR0FBTSxTQUFDLElBQUQsRUFBTyxRQUFQLEdBQUE7QUFDSixRQUFBLHdCQUFBOztNQURXLFdBQVMsQ0FBQyxDQUFDO0tBQ3RCO0FBQUEsSUFBQSxJQUFxQixJQUFDLENBQUEsVUFBdEI7QUFBQSxhQUFPLFFBQUEsQ0FBQSxDQUFQLENBQUE7S0FBQTtBQUVBLElBQUEsSUFBQSxDQUFBLENBQXNCLENBQUMsT0FBRixDQUFVLElBQVYsQ0FBckI7QUFBQSxNQUFBLElBQUEsR0FBTyxDQUFDLElBQUQsQ0FBUCxDQUFBO0tBRkE7QUFBQSxJQUdBLFNBQUEsR0FBZ0IsSUFBQSxTQUFBLENBQUEsQ0FIaEIsQ0FBQTtBQUFBLElBSUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsUUFBdEIsQ0FKQSxDQUFBO0FBS0EsU0FBQSwyQ0FBQTtxQkFBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLEVBQW9CLFNBQVMsQ0FBQyxJQUFWLENBQUEsQ0FBcEIsQ0FBQSxDQUFBO0FBQUEsS0FMQTtXQU1BLFNBQVMsQ0FBQyxLQUFWLENBQUEsRUFQSTtFQUFBLENBSk4sQ0FBQTs7QUFBQSxzQkFjQSxPQUFBLEdBQVMsU0FBQSxHQUFBO1dBQ1AsSUFBQyxDQUFBLFVBQUQsR0FBYyxLQURQO0VBQUEsQ0FkVCxDQUFBOztBQUFBLHNCQW1CQSxhQUFBLEdBQWUsU0FBQyxHQUFELEVBQU0sUUFBTixHQUFBO0FBQ2IsUUFBQSxJQUFBOztNQURtQixXQUFTLENBQUMsQ0FBQztLQUM5QjtBQUFBLElBQUEsSUFBcUIsSUFBQyxDQUFBLFVBQXRCO0FBQUEsYUFBTyxRQUFBLENBQUEsQ0FBUCxDQUFBO0tBQUE7QUFFQSxJQUFBLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiLENBQUg7YUFDRSxRQUFBLENBQUEsRUFERjtLQUFBLE1BQUE7QUFHRSxNQUFBLElBQUEsR0FBTyxDQUFBLENBQUUsMkNBQUYsQ0FBK0MsQ0FBQSxDQUFBLENBQXRELENBQUE7QUFBQSxNQUNBLElBQUksQ0FBQyxNQUFMLEdBQWMsUUFEZCxDQUFBO0FBQUEsTUFNQSxJQUFJLENBQUMsT0FBTCxHQUFlLFNBQUEsR0FBQTtBQUNiLFFBQUEsT0FBTyxDQUFDLElBQVIsQ0FBYyxrQ0FBQSxHQUFyQixHQUFPLENBQUEsQ0FBQTtlQUNBLFFBQUEsQ0FBQSxFQUZhO01BQUEsQ0FOZixDQUFBO0FBQUEsTUFVQSxJQUFJLENBQUMsSUFBTCxHQUFZLEdBVlosQ0FBQTtBQUFBLE1BV0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQXRCLENBQWtDLElBQWxDLENBWEEsQ0FBQTthQVlBLElBQUMsQ0FBQSxlQUFELENBQWlCLEdBQWpCLEVBZkY7S0FIYTtFQUFBLENBbkJmLENBQUE7O0FBQUEsc0JBeUNBLFdBQUEsR0FBYSxTQUFDLEdBQUQsR0FBQTtXQUNYLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFvQixHQUFwQixDQUFBLElBQTRCLEVBRGpCO0VBQUEsQ0F6Q2IsQ0FBQTs7QUFBQSxzQkE4Q0EsZUFBQSxHQUFpQixTQUFDLEdBQUQsR0FBQTtXQUNmLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixHQUFqQixFQURlO0VBQUEsQ0E5Q2pCLENBQUE7O21CQUFBOztJQUxGLENBQUE7Ozs7O0FDQUEsSUFBQSxnREFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxHQUNBLEdBQU0sTUFBTSxDQUFDLEdBRGIsQ0FBQTs7QUFBQSxRQUVBLEdBQVcsT0FBQSxDQUFRLDBCQUFSLENBRlgsQ0FBQTs7QUFBQSxhQUdBLEdBQWdCLE9BQUEsQ0FBUSwrQkFBUixDQUhoQixDQUFBOztBQUFBLE1BS00sQ0FBQyxPQUFQLEdBQXVCO0FBRVIsRUFBQSxvQkFBQSxHQUFBO0FBQ1gsSUFBQSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQUEsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxRQUFBLENBQVMsSUFBVCxDQURoQixDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsa0JBQUQsR0FDRTtBQUFBLE1BQUEsVUFBQSxFQUFZLFNBQUEsR0FBQSxDQUFaO0FBQUEsTUFDQSxXQUFBLEVBQWEsU0FBQSxHQUFBLENBRGI7S0FMRixDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsbUJBQUQsR0FDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFNBQUEsR0FBQSxDQUFOO0tBUkYsQ0FBQTtBQUFBLElBU0EsSUFBQyxDQUFBLGtCQUFELEdBQXNCLFNBQUEsR0FBQSxDQVR0QixDQURXO0VBQUEsQ0FBYjs7QUFBQSx1QkFhQSxTQUFBLEdBQVcsU0FBQyxJQUFELEdBQUE7QUFDVCxRQUFBLDJEQUFBO0FBQUEsSUFEWSxzQkFBQSxnQkFBZ0IscUJBQUEsZUFBZSxhQUFBLE9BQU8sY0FBQSxNQUNsRCxDQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsQ0FBYyxjQUFBLElBQWtCLGFBQWhDLENBQUE7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUNBLElBQUEsSUFBd0MsYUFBeEM7QUFBQSxNQUFBLGNBQUEsR0FBaUIsYUFBYSxDQUFDLEtBQS9CLENBQUE7S0FEQTtBQUFBLElBR0EsYUFBQSxHQUFvQixJQUFBLGFBQUEsQ0FDbEI7QUFBQSxNQUFBLGNBQUEsRUFBZ0IsY0FBaEI7QUFBQSxNQUNBLGFBQUEsRUFBZSxhQURmO0tBRGtCLENBSHBCLENBQUE7O01BT0EsU0FDRTtBQUFBLFFBQUEsU0FBQSxFQUNFO0FBQUEsVUFBQSxhQUFBLEVBQWUsSUFBZjtBQUFBLFVBQ0EsS0FBQSxFQUFPLEdBRFA7QUFBQSxVQUVBLFNBQUEsRUFBVyxDQUZYO1NBREY7O0tBUkY7V0FhQSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxhQUFmLEVBQThCLEtBQTlCLEVBQXFDLE1BQXJDLEVBZFM7RUFBQSxDQWJYLENBQUE7O0FBQUEsdUJBOEJBLFNBQUEsR0FBVyxTQUFBLEdBQUE7QUFDVCxJQUFBLElBQUMsQ0FBQSxNQUFELEdBQVUsTUFBVixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFEcEIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFBLENBQUUsSUFBQyxDQUFBLFFBQUgsQ0FGYixDQUFBO1dBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFBLENBQUUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFaLEVBSkE7RUFBQSxDQTlCWCxDQUFBOztvQkFBQTs7SUFQRixDQUFBOzs7OztBQ0FBLElBQUEsc0ZBQUE7RUFBQTtpU0FBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxJQUNBLEdBQU8sT0FBQSxDQUFRLFFBQVIsQ0FEUCxDQUFBOztBQUFBLEdBRUEsR0FBTSxPQUFBLENBQVEsb0JBQVIsQ0FGTixDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsc0JBQVIsQ0FIUixDQUFBOztBQUFBLGtCQUlBLEdBQXFCLE9BQUEsQ0FBUSxvQ0FBUixDQUpyQixDQUFBOztBQUFBLFFBS0EsR0FBVyxPQUFBLENBQVEsMEJBQVIsQ0FMWCxDQUFBOztBQUFBLGFBTUEsR0FBZ0IsT0FBQSxDQUFRLCtCQUFSLENBTmhCLENBQUE7O0FBQUEsTUFVTSxDQUFDLE9BQVAsR0FBdUI7QUFFckIsTUFBQSxpQkFBQTs7QUFBQSxvQ0FBQSxDQUFBOztBQUFBLEVBQUEsaUJBQUEsR0FBb0IsQ0FBcEIsQ0FBQTs7QUFBQSw0QkFFQSxVQUFBLEdBQVksS0FGWixDQUFBOztBQUthLEVBQUEseUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSw0QkFBQTtBQUFBLDBCQURZLE9BQTJCLElBQXpCLGtCQUFBLFlBQVksa0JBQUEsVUFDMUIsQ0FBQTtBQUFBLElBQUEsa0RBQUEsU0FBQSxDQUFBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxLQUFELEdBQWEsSUFBQSxLQUFBLENBQUEsQ0FGYixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsa0JBQUQsR0FBMEIsSUFBQSxrQkFBQSxDQUFtQixJQUFuQixDQUgxQixDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUMsQ0FBQyxTQUFGLENBQUEsQ0FOZCxDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsZ0JBQUQsR0FBb0IsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQVBwQixDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsc0JBQUQsR0FBMEIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQVIxQixDQUFBO0FBQUEsSUFTQSxJQUFDLENBQUEsbUJBQUQsR0FBdUIsQ0FBQyxDQUFDLFNBQUYsQ0FBQSxDQVR2QixDQUFBO0FBQUEsSUFVQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FBUyxJQUFULENBVmhCLENBQUE7QUFBQSxJQVdBLElBQUMsQ0FBQSxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQXRCLENBQTJCLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLHFCQUFULEVBQWdDLElBQWhDLENBQTNCLENBWEEsQ0FBQTtBQUFBLElBWUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBckIsQ0FBMEIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEscUJBQVQsRUFBZ0MsSUFBaEMsQ0FBMUIsQ0FaQSxDQUFBO0FBQUEsSUFhQSxJQUFDLENBQUEsMEJBQUQsQ0FBQSxDQWJBLENBQUE7QUFBQSxJQWNBLElBQUMsQ0FBQSxTQUNDLENBQUMsRUFESCxDQUNNLHNCQUROLEVBQzhCLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBQyxDQUFBLFNBQVQsRUFBb0IsSUFBcEIsQ0FEOUIsQ0FFRSxDQUFDLEVBRkgsQ0FFTSx1QkFGTixFQUUrQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxTQUFULEVBQW9CLElBQXBCLENBRi9CLENBR0UsQ0FBQyxFQUhILENBR00sV0FITixFQUdtQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxnQkFBVCxFQUEyQixJQUEzQixDQUhuQixDQWRBLENBRFc7RUFBQSxDQUxiOztBQUFBLDRCQTBCQSwwQkFBQSxHQUE0QixTQUFBLEdBQUE7QUFDMUIsSUFBQSxJQUFHLE1BQU0sQ0FBQyxpQkFBVjthQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixNQUFNLENBQUMsaUJBQXZCLEVBQTBDLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxDQUExQyxFQURGO0tBRDBCO0VBQUEsQ0ExQjVCLENBQUE7O0FBQUEsNEJBZ0NBLGdCQUFBLEdBQWtCLFNBQUMsS0FBRCxHQUFBO0FBQ2hCLElBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBQSxDQUFBLENBQUE7V0FDQSxLQUFLLENBQUMsZUFBTixDQUFBLEVBRmdCO0VBQUEsQ0FoQ2xCLENBQUE7O0FBQUEsNEJBcUNBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsSUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxhQUFmLENBQUEsQ0FBQTtXQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLGtCQUFmLEVBRmU7RUFBQSxDQXJDakIsQ0FBQTs7QUFBQSw0QkEwQ0EsU0FBQSxHQUFXLFNBQUMsS0FBRCxHQUFBO0FBQ1QsUUFBQSx3QkFBQTtBQUFBLElBQUEsSUFBVSxLQUFLLENBQUMsS0FBTixLQUFlLGlCQUFmLElBQW9DLEtBQUssQ0FBQyxJQUFOLEtBQWMsV0FBNUQ7QUFBQSxZQUFBLENBQUE7S0FBQTtBQUFBLElBR0EsU0FBQSxHQUFZLENBQUEsQ0FBRSxLQUFLLENBQUMsTUFBUixDQUFlLENBQUMsT0FBaEIsQ0FBd0IsTUFBTSxDQUFDLGlCQUEvQixDQUFpRCxDQUFDLE1BSDlELENBQUE7QUFJQSxJQUFBLElBQVUsU0FBVjtBQUFBLFlBQUEsQ0FBQTtLQUpBO0FBQUEsSUFPQSxhQUFBLEdBQWdCLEdBQUcsQ0FBQyxpQkFBSixDQUFzQixLQUFLLENBQUMsTUFBNUIsQ0FQaEIsQ0FBQTtBQUFBLElBWUEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEtBQXhCLEVBQStCLGFBQS9CLENBWkEsQ0FBQTtBQWNBLElBQUEsSUFBRyxhQUFIO2FBQ0UsSUFBQyxDQUFBLFNBQUQsQ0FDRTtBQUFBLFFBQUEsYUFBQSxFQUFlLGFBQWY7QUFBQSxRQUNBLEtBQUEsRUFBTyxLQURQO09BREYsRUFERjtLQWZTO0VBQUEsQ0ExQ1gsQ0FBQTs7QUFBQSw0QkErREEsU0FBQSxHQUFXLFNBQUMsSUFBRCxHQUFBO0FBQ1QsUUFBQSwyREFBQTtBQUFBLElBRFksc0JBQUEsZ0JBQWdCLHFCQUFBLGVBQWUsYUFBQSxPQUFPLGNBQUEsTUFDbEQsQ0FBQTtBQUFBLElBQUEsSUFBQSxDQUFBLENBQWMsY0FBQSxJQUFrQixhQUFoQyxDQUFBO0FBQUEsWUFBQSxDQUFBO0tBQUE7QUFDQSxJQUFBLElBQXdDLGFBQXhDO0FBQUEsTUFBQSxjQUFBLEdBQWlCLGFBQWEsQ0FBQyxLQUEvQixDQUFBO0tBREE7QUFBQSxJQUdBLGFBQUEsR0FBb0IsSUFBQSxhQUFBLENBQ2xCO0FBQUEsTUFBQSxjQUFBLEVBQWdCLGNBQWhCO0FBQUEsTUFDQSxhQUFBLEVBQWUsYUFEZjtLQURrQixDQUhwQixDQUFBOztNQU9BLFNBQ0U7QUFBQSxRQUFBLFNBQUEsRUFDRTtBQUFBLFVBQUEsYUFBQSxFQUFlLElBQWY7QUFBQSxVQUNBLEtBQUEsRUFBTyxHQURQO0FBQUEsVUFFQSxTQUFBLEVBQVcsQ0FGWDtTQURGOztLQVJGO1dBYUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFWLENBQWUsYUFBZixFQUE4QixLQUE5QixFQUFxQyxNQUFyQyxFQWRTO0VBQUEsQ0EvRFgsQ0FBQTs7QUFBQSw0QkFnRkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtXQUNWLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFBLEVBRFU7RUFBQSxDQWhGWixDQUFBOztBQUFBLDRCQW9GQSxzQkFBQSxHQUF3QixTQUFDLEtBQUQsRUFBUSxhQUFSLEdBQUE7QUFDdEIsUUFBQSxXQUFBO0FBQUEsSUFBQSxJQUFHLGFBQUg7QUFDRSxNQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsZ0JBQVAsQ0FBd0IsYUFBeEIsQ0FBQSxDQUFBO0FBQUEsTUFFQSxXQUFBLEdBQWMsR0FBRyxDQUFDLGVBQUosQ0FBb0IsS0FBSyxDQUFDLE1BQTFCLENBRmQsQ0FBQTtBQUdBLE1BQUEsSUFBRyxXQUFIO0FBQ0UsZ0JBQU8sV0FBVyxDQUFDLFdBQW5CO0FBQUEsZUFDTyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUQvQjttQkFFSSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsYUFBakIsRUFBZ0MsV0FBVyxDQUFDLFFBQTVDLEVBQXNELEtBQXRELEVBRko7QUFBQSxlQUdPLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBSDlCO21CQUlJLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxJQUFsQixDQUF1QixhQUF2QixFQUFzQyxXQUFXLENBQUMsUUFBbEQsRUFBNEQsS0FBNUQsRUFKSjtBQUFBLFNBREY7T0FKRjtLQUFBLE1BQUE7YUFXRSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxFQVhGO0tBRHNCO0VBQUEsQ0FwRnhCLENBQUE7O0FBQUEsNEJBbUdBLGlCQUFBLEdBQW1CLFNBQUEsR0FBQTtXQUNqQixNQUFNLENBQUMsUUFBUSxDQUFDLGNBREM7RUFBQSxDQW5HbkIsQ0FBQTs7QUFBQSw0QkF1R0Esa0JBQUEsR0FBb0IsU0FBQSxHQUFBO0FBQ2xCLFFBQUEsY0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLE1BQWhCLENBQUEsQ0FBQTtBQUFBLElBQ0EsY0FBQSxHQUFpQixJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQURqQixDQUFBO0FBRUEsSUFBQSxJQUE0QixjQUE1QjthQUFBLENBQUEsQ0FBRSxjQUFGLENBQWlCLENBQUMsSUFBbEIsQ0FBQSxFQUFBO0tBSGtCO0VBQUEsQ0F2R3BCLENBQUE7O0FBQUEsNEJBNkdBLHdCQUFBLEdBQTBCLFNBQUMsYUFBRCxHQUFBO1dBQ3hCLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixhQUFyQixFQUR3QjtFQUFBLENBN0cxQixDQUFBOztBQUFBLDRCQWlIQSxtQkFBQSxHQUFxQixTQUFDLGFBQUQsR0FBQTtBQUNuQixRQUFBLHdCQUFBO0FBQUEsSUFBQSxJQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsUUFBNUI7QUFDRSxNQUFBLGFBQUE7O0FBQWdCO0FBQUE7YUFBQSwyQ0FBQTsrQkFBQTtBQUNkLHdCQUFBLFNBQVMsQ0FBQyxLQUFWLENBRGM7QUFBQTs7VUFBaEIsQ0FBQTthQUdBLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxHQUFwQixDQUF3QixhQUF4QixFQUpGO0tBRG1CO0VBQUEsQ0FqSHJCLENBQUE7O0FBQUEsNEJBeUhBLHFCQUFBLEdBQXVCLFNBQUMsYUFBRCxHQUFBO1dBQ3JCLGFBQWEsQ0FBQyxZQUFkLENBQUEsRUFEcUI7RUFBQSxDQXpIdkIsQ0FBQTs7QUFBQSw0QkE2SEEscUJBQUEsR0FBdUIsU0FBQyxhQUFELEdBQUE7V0FDckIsYUFBYSxDQUFDLFlBQWQsQ0FBQSxFQURxQjtFQUFBLENBN0h2QixDQUFBOzt5QkFBQTs7R0FGNkMsS0FWL0MsQ0FBQTs7Ozs7QUNBQSxJQUFBLDhDQUFBO0VBQUE7O2lTQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUixDQUFKLENBQUE7O0FBQUEsa0JBQ0EsR0FBcUIsT0FBQSxDQUFRLHVCQUFSLENBRHJCLENBQUE7O0FBQUEsU0FFQSxHQUFZLE9BQUEsQ0FBUSxjQUFSLENBRlosQ0FBQTs7QUFBQSxNQUdBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBSFQsQ0FBQTs7QUFBQSxNQVFNLENBQUMsT0FBUCxHQUF1QjtBQUVyQix5QkFBQSxDQUFBOztBQUFhLEVBQUEsY0FBQyxJQUFELEdBQUE7QUFDWCxRQUFBLHNDQUFBO0FBQUEsMEJBRFksT0FBOEUsSUFBNUUsa0JBQUEsWUFBWSxnQkFBQSxVQUFVLGtCQUFBLFlBQVksSUFBQyxDQUFBLGNBQUEsUUFBUSxJQUFDLENBQUEscUJBQUEsZUFBZSxJQUFDLENBQUEscUJBQUEsYUFDMUUsQ0FBQTtBQUFBLDZEQUFBLENBQUE7QUFBQSxJQUFBLElBQTBCLGdCQUExQjtBQUFBLE1BQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxRQUFkLENBQUE7S0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLFVBQUQseUJBQWlCLFVBQVUsQ0FBRSxnQkFBZixHQUEyQixVQUFXLENBQUEsQ0FBQSxDQUF0QyxHQUE4QyxVQUQ1RCxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsU0FBRCxDQUFXLFVBQVgsQ0FGQSxDQUFBOztNQUdBLElBQUMsQ0FBQSxhQUFjLENBQUEsQ0FBRyxHQUFBLEdBQXJCLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUE4QixJQUFDLENBQUEsS0FBL0I7S0FIZjtBQUFBLElBS0Esb0NBQUEsQ0FMQSxDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsU0FBRCxHQUFpQixJQUFBLFNBQUEsQ0FBVSxJQUFDLENBQUEsTUFBWCxDQVBqQixDQUFBO0FBUUEsSUFBQSxJQUF3QixDQUFBLElBQUssQ0FBQSxtQkFBRCxDQUFBLENBQTVCO0FBQUEsTUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLE9BQVgsQ0FBQSxDQUFBLENBQUE7S0FSQTtBQUFBLElBU0EsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQVRBLENBRFc7RUFBQSxDQUFiOztBQUFBLGlCQWFBLFdBQUEsR0FBYSxTQUFBLEdBQUE7QUFFWCxJQUFBLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxDQUFBLENBQUE7V0FDQSxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUEsR0FBQTthQUFBLFNBQUEsR0FBQTtlQUNULEtBQUMsQ0FBQSxjQUFjLENBQUMsU0FBaEIsQ0FBQSxFQURTO01BQUEsRUFBQTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxFQUVFLENBRkYsRUFIVztFQUFBLENBYmIsQ0FBQTs7QUFBQSxpQkFxQkEsbUJBQUEsR0FBcUIsU0FBQSxHQUFBO0FBQ25CLElBQUEsSUFBRywwQkFBSDthQUNFLE9BQUEsQ0FBUSxJQUFDLENBQUEsYUFBVCxFQURGO0tBQUEsTUFBQTthQUdFLE9BQUEsQ0FBUSxNQUFNLENBQUMsYUFBZixFQUhGO0tBRG1CO0VBQUEsQ0FyQnJCLENBQUE7O0FBQUEsaUJBNkJBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsSUFBQSxJQUFBLENBQUEsSUFBZSxDQUFBLE1BQWY7QUFBQSxZQUFBLENBQUE7S0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQWYsQ0FBdUIsSUFBQyxDQUFBLFNBQXhCLEVBQW1DLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxDQUFuQyxFQUZlO0VBQUEsQ0E3QmpCLENBQUE7O0FBQUEsaUJBa0NBLFNBQUEsR0FBVyxTQUFDLFVBQUQsR0FBQTs7TUFDVCxhQUFjLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUMsQ0FBQSxVQUFsQjtLQUFkO0FBQUEsSUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLFVBRFYsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBRnBCLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBQSxDQUFFLElBQUMsQ0FBQSxRQUFILENBSGIsQ0FBQTtXQUlBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQSxDQUFFLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBWixFQUxBO0VBQUEsQ0FsQ1gsQ0FBQTs7QUFBQSxpQkEwQ0EsZUFBQSxHQUFpQixTQUFDLElBQUQsR0FBQTtBQUNmLElBQUEsSUFBRyxZQUFIO2FBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQURyQjtLQUFBLE1BQUE7YUFHRSxPQUhGO0tBRGU7RUFBQSxDQTFDakIsQ0FBQTs7Y0FBQTs7R0FGa0MsbUJBUnBDLENBQUE7Ozs7O0FDQUEsSUFBQSxnQ0FBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLFNBQ0EsR0FBWSxPQUFBLENBQVEsc0JBQVIsQ0FEWixDQUFBOztBQUFBLE1BWU0sQ0FBQyxPQUFQLEdBQXVCO0FBRXJCLCtCQUFBLFVBQUEsR0FBWSxJQUFaLENBQUE7O0FBR2EsRUFBQSw0QkFBQSxHQUFBOztNQUNYLElBQUMsQ0FBQSxhQUFjLENBQUEsQ0FBRSxRQUFGLENBQVksQ0FBQSxDQUFBO0tBQTNCO0FBQUEsSUFDQSxJQUFDLENBQUEsY0FBRCxHQUFzQixJQUFBLFNBQUEsQ0FBQSxDQUR0QixDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsV0FBRCxDQUFBLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxLQUFoQixDQUFBLENBSEEsQ0FEVztFQUFBLENBSGI7O0FBQUEsK0JBVUEsSUFBQSxHQUFNLFNBQUEsR0FBQTtXQUNKLENBQUEsQ0FBRSxJQUFDLENBQUEsVUFBSCxDQUFjLENBQUMsSUFBZixDQUFBLEVBREk7RUFBQSxDQVZOLENBQUE7O0FBQUEsK0JBY0Esd0JBQUEsR0FBMEIsU0FBQyxhQUFELEdBQUEsQ0FkMUIsQ0FBQTs7QUFBQSwrQkFtQkEsV0FBQSxHQUFhLFNBQUEsR0FBQSxDQW5CYixDQUFBOztBQUFBLCtCQXNCQSxLQUFBLEdBQU8sU0FBQyxRQUFELEdBQUE7V0FDTCxJQUFDLENBQUEsY0FBYyxDQUFDLFdBQWhCLENBQTRCLFFBQTVCLEVBREs7RUFBQSxDQXRCUCxDQUFBOzs0QkFBQTs7SUFkRixDQUFBOzs7OztBQ0FBLElBQUEsK0JBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBQUosQ0FBQTs7QUFBQSxZQUNBLEdBQWUsT0FBQSxDQUFRLHlCQUFSLENBRGYsQ0FBQTs7QUFBQSxHQUVBLEdBQU0sT0FBQSxDQUFRLG9CQUFSLENBRk4sQ0FBQTs7QUFBQSxNQUlNLENBQUMsT0FBUCxHQUF1QjtBQUVSLEVBQUEsbUJBQUMsSUFBRCxHQUFBO0FBQ1gsUUFBQSxZQUFBO0FBQUEsSUFEYyxZQUFBLE1BQU0sSUFBQyxDQUFBLFlBQUEsTUFBTSxJQUFDLENBQUEsWUFBQSxNQUFNLGNBQUEsTUFDbEMsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFNLENBQUMsTUFBUCxDQUFjLFlBQVksQ0FBQyxVQUFXLENBQUEsSUFBQyxDQUFBLElBQUQsQ0FBdEMsQ0FBVixDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsSUFBUSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBRHhCLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsTUFBWCxDQUZBLENBQUE7QUFBQSxJQUdBLElBQUMsQ0FBQSxRQUFELEdBQVksS0FIWixDQURXO0VBQUEsQ0FBYjs7QUFBQSxzQkFPQSxTQUFBLEdBQVcsU0FBQyxNQUFELEdBQUE7V0FDVCxDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxNQUFWLEVBQWtCLE1BQWxCLEVBRFM7RUFBQSxDQVBYLENBQUE7O0FBQUEsc0JBV0EsWUFBQSxHQUFjLFNBQUEsR0FBQTtXQUNaLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFESTtFQUFBLENBWGQsQ0FBQTs7QUFBQSxzQkFlQSxrQkFBQSxHQUFvQixTQUFBLEdBQUE7V0FDbEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFEVTtFQUFBLENBZnBCLENBQUE7O0FBQUEsc0JBb0JBLFVBQUEsR0FBWSxTQUFBLEdBQUE7V0FDVixJQUFDLENBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFmLENBQUEsRUFEVTtFQUFBLENBcEJaLENBQUE7O0FBQUEsc0JBMEJBLEtBQUEsR0FBTyxTQUFBLEdBQUE7QUFDTCxRQUFBLFlBQUE7QUFBQSxJQUFBLFlBQUEsR0FBbUIsSUFBQSxTQUFBLENBQVU7QUFBQSxNQUFBLElBQUEsRUFBTSxJQUFDLENBQUEsSUFBUDtBQUFBLE1BQWEsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFwQjtBQUFBLE1BQTBCLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBbkM7S0FBVixDQUFuQixDQUFBO0FBQUEsSUFDQSxZQUFZLENBQUMsUUFBYixHQUF3QixJQUFDLENBQUEsUUFEekIsQ0FBQTtXQUVBLGFBSEs7RUFBQSxDQTFCUCxDQUFBOztBQUFBLHNCQWdDQSw2QkFBQSxHQUErQixTQUFBLEdBQUE7V0FDN0IsR0FBRyxDQUFDLDZCQUFKLENBQWtDLElBQUMsQ0FBQSxJQUFuQyxFQUQ2QjtFQUFBLENBaEMvQixDQUFBOztBQUFBLHNCQW9DQSxxQkFBQSxHQUF1QixTQUFBLEdBQUE7V0FDckIsSUFBQyxDQUFBLElBQUksQ0FBQyxxQkFBTixDQUFBLEVBRHFCO0VBQUEsQ0FwQ3ZCLENBQUE7O21CQUFBOztJQU5GLENBQUE7Ozs7O0FDQUEsSUFBQSxpREFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLE1BQ0EsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FEVCxDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FGVCxDQUFBOztBQUFBLFNBR0EsR0FBWSxPQUFBLENBQVEsYUFBUixDQUhaLENBQUE7O0FBQUEsTUFPTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDZCQUFFLEdBQUYsR0FBQTtBQUNYLElBRFksSUFBQyxDQUFBLG9CQUFBLE1BQUksRUFDakIsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxDQUFWLENBRFc7RUFBQSxDQUFiOztBQUFBLGdDQUlBLEdBQUEsR0FBSyxTQUFDLFNBQUQsR0FBQTtBQUNILFFBQUEsS0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLGlCQUFELENBQW1CLFNBQW5CLENBQUEsQ0FBQTtBQUFBLElBR0EsSUFBSyxDQUFBLElBQUMsQ0FBQSxNQUFELENBQUwsR0FBZ0IsU0FIaEIsQ0FBQTtBQUFBLElBSUEsU0FBUyxDQUFDLEtBQVYsR0FBa0IsSUFBQyxDQUFBLE1BSm5CLENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxNQUFELElBQVcsQ0FMWCxDQUFBO0FBQUEsSUFRQSxJQUFDLENBQUEsR0FBSSxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQUwsR0FBdUIsU0FSdkIsQ0FBQTtBQUFBLElBWUEsYUFBSyxTQUFTLENBQUMsVUFBZixjQUF5QixHQVp6QixDQUFBO0FBQUEsSUFhQSxJQUFLLENBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxDQUFDLElBQXJCLENBQTBCLFNBQTFCLENBYkEsQ0FBQTtXQWNBLFVBZkc7RUFBQSxDQUpMLENBQUE7O0FBQUEsZ0NBc0JBLElBQUEsR0FBTSxTQUFDLElBQUQsR0FBQTtBQUNKLFFBQUEsU0FBQTtBQUFBLElBQUEsSUFBb0IsSUFBQSxZQUFnQixTQUFwQztBQUFBLE1BQUEsU0FBQSxHQUFZLElBQVosQ0FBQTtLQUFBOztNQUNBLFlBQWEsSUFBQyxDQUFBLEdBQUksQ0FBQSxJQUFBO0tBRGxCO1dBRUEsSUFBSyxDQUFBLFNBQVMsQ0FBQyxLQUFWLElBQW1CLENBQW5CLEVBSEQ7RUFBQSxDQXRCTixDQUFBOztBQUFBLGdDQTRCQSxVQUFBLEdBQVksU0FBQyxJQUFELEdBQUE7QUFDVixRQUFBLHVCQUFBO0FBQUEsSUFBQSxJQUFvQixJQUFBLFlBQWdCLFNBQXBDO0FBQUEsTUFBQSxTQUFBLEdBQVksSUFBWixDQUFBO0tBQUE7O01BQ0EsWUFBYSxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUE7S0FEbEI7QUFBQSxJQUdBLFlBQUEsR0FBZSxTQUFTLENBQUMsSUFIekIsQ0FBQTtBQUlBLFdBQU0sU0FBQSxHQUFZLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBTixDQUFsQixHQUFBO0FBQ0UsTUFBQSxJQUFvQixTQUFTLENBQUMsSUFBVixLQUFrQixZQUF0QztBQUFBLGVBQU8sU0FBUCxDQUFBO09BREY7SUFBQSxDQUxVO0VBQUEsQ0E1QlosQ0FBQTs7QUFBQSxnQ0FxQ0EsR0FBQSxHQUFLLFNBQUMsSUFBRCxHQUFBO1dBQ0gsSUFBQyxDQUFBLEdBQUksQ0FBQSxJQUFBLEVBREY7RUFBQSxDQXJDTCxDQUFBOztBQUFBLGdDQXlDQSxLQUFBLEdBQU8sU0FBQyxJQUFELEdBQUE7QUFDTCxRQUFBLElBQUE7QUFBQSxJQUFBLElBQUcsSUFBSDsrQ0FDWSxDQUFFLGdCQURkO0tBQUEsTUFBQTthQUdFLElBQUMsQ0FBQSxPQUhIO0tBREs7RUFBQSxDQXpDUCxDQUFBOztBQUFBLGdDQWdEQSxLQUFBLEdBQU8sU0FBQyxJQUFELEdBQUE7QUFDTCxRQUFBLDBDQUFBO0FBQUEsSUFBQSxJQUFBLENBQUEsbUNBQTJCLENBQUUsZ0JBQTdCO0FBQUEsYUFBTyxFQUFQLENBQUE7S0FBQTtBQUNBO0FBQUE7U0FBQSw0Q0FBQTs0QkFBQTtBQUNFLG9CQUFBLFNBQVMsQ0FBQyxLQUFWLENBREY7QUFBQTtvQkFGSztFQUFBLENBaERQLENBQUE7O0FBQUEsZ0NBc0RBLElBQUEsR0FBTSxTQUFDLFFBQUQsR0FBQTtBQUNKLFFBQUEsNkJBQUE7QUFBQTtTQUFBLDJDQUFBOzJCQUFBO0FBQ0Usb0JBQUEsUUFBQSxDQUFTLFNBQVQsRUFBQSxDQURGO0FBQUE7b0JBREk7RUFBQSxDQXRETixDQUFBOztBQUFBLGdDQTJEQSxVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sUUFBUCxHQUFBO0FBQ1YsUUFBQSxtQ0FBQTtBQUFBLElBQUEsSUFBRyxJQUFLLENBQUEsSUFBQSxDQUFSO0FBQ0U7QUFBQTtXQUFBLDJDQUFBOzZCQUFBO0FBQ0Usc0JBQUEsUUFBQSxDQUFTLFNBQVQsRUFBQSxDQURGO0FBQUE7c0JBREY7S0FEVTtFQUFBLENBM0RaLENBQUE7O0FBQUEsZ0NBaUVBLFlBQUEsR0FBYyxTQUFDLFFBQUQsR0FBQTtXQUNaLElBQUMsQ0FBQSxVQUFELENBQVksVUFBWixFQUF3QixRQUF4QixFQURZO0VBQUEsQ0FqRWQsQ0FBQTs7QUFBQSxnQ0FxRUEsU0FBQSxHQUFXLFNBQUMsUUFBRCxHQUFBO1dBQ1QsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaLEVBQXFCLFFBQXJCLEVBRFM7RUFBQSxDQXJFWCxDQUFBOztBQUFBLGdDQXlFQSxhQUFBLEdBQWUsU0FBQyxRQUFELEdBQUE7V0FDYixJQUFDLENBQUEsVUFBRCxDQUFZLFdBQVosRUFBeUIsUUFBekIsRUFEYTtFQUFBLENBekVmLENBQUE7O0FBQUEsZ0NBNkVBLFFBQUEsR0FBVSxTQUFDLFFBQUQsR0FBQTtXQUNSLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWixFQUFvQixRQUFwQixFQURRO0VBQUEsQ0E3RVYsQ0FBQTs7QUFBQSxnQ0FpRkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUNMLFFBQUEsYUFBQTtBQUFBLElBQUEsYUFBQSxHQUFvQixJQUFBLG1CQUFBLENBQUEsQ0FBcEIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLFNBQUQsR0FBQTthQUNKLGFBQWEsQ0FBQyxHQUFkLENBQWtCLFNBQVMsQ0FBQyxLQUFWLENBQUEsQ0FBbEIsRUFESTtJQUFBLENBQU4sQ0FEQSxDQUFBO1dBSUEsY0FMSztFQUFBLENBakZQLENBQUE7O0FBQUEsZ0NBMkZBLFFBQUEsR0FBVSxTQUFDLElBQUQsR0FBQTtXQUNSLENBQUEsQ0FBRSxJQUFDLENBQUEsR0FBSSxDQUFBLElBQUEsQ0FBSyxDQUFDLElBQWIsRUFEUTtFQUFBLENBM0ZWLENBQUE7O0FBQUEsZ0NBK0ZBLGVBQUEsR0FBaUIsU0FBQSxHQUFBO0FBQ2YsSUFBQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsU0FBRCxHQUFBO0FBQ0osTUFBQSxJQUFnQixDQUFBLFNBQWEsQ0FBQyxJQUE5QjtBQUFBLGVBQU8sS0FBUCxDQUFBO09BREk7SUFBQSxDQUFOLENBQUEsQ0FBQTtBQUdBLFdBQU8sSUFBUCxDQUplO0VBQUEsQ0EvRmpCLENBQUE7O0FBQUEsZ0NBdUdBLGlCQUFBLEdBQW1CLFNBQUMsU0FBRCxHQUFBO1dBQ2pCLE1BQUEsQ0FBTyxTQUFBLElBQWEsQ0FBQSxJQUFLLENBQUEsR0FBSSxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQTdCLEVBQ0UsRUFBQSxHQUNKLFNBQVMsQ0FBQyxJQUROLEdBQ1csNEJBRFgsR0FDTCxNQUFNLENBQUMsVUFBVyxDQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsQ0FBQyxZQUQ3QixHQUV1QyxLQUZ2QyxHQUVMLFNBQVMsQ0FBQyxJQUZMLEdBRTRELFNBRjVELEdBRUwsU0FBUyxDQUFDLElBRkwsR0FHRSx5QkFKSixFQURpQjtFQUFBLENBdkduQixDQUFBOzs2QkFBQTs7SUFURixDQUFBOzs7OztBQ0FBLElBQUEsaUJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUFULENBQUE7O0FBQUEsU0FDQSxHQUFZLE9BQUEsQ0FBUSxhQUFSLENBRFosQ0FBQTs7QUFBQSxNQUdNLENBQUMsT0FBUCxHQUFvQixDQUFBLFNBQUEsR0FBQTtBQUVsQixNQUFBLGVBQUE7QUFBQSxFQUFBLGVBQUEsR0FBa0IsYUFBbEIsQ0FBQTtTQUVBO0FBQUEsSUFBQSxLQUFBLEVBQU8sU0FBQyxJQUFELEdBQUE7QUFDTCxVQUFBLDRCQUFBO0FBQUEsTUFBQSxhQUFBLEdBQWdCLE1BQWhCLENBQUE7QUFBQSxNQUNBLGFBQUEsR0FBZ0IsRUFEaEIsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsRUFBdUIsU0FBQyxTQUFELEdBQUE7QUFDckIsUUFBQSxJQUFHLFNBQVMsQ0FBQyxrQkFBVixDQUFBLENBQUg7aUJBQ0UsYUFBQSxHQUFnQixVQURsQjtTQUFBLE1BQUE7aUJBR0UsYUFBYSxDQUFDLElBQWQsQ0FBbUIsU0FBbkIsRUFIRjtTQURxQjtNQUFBLENBQXZCLENBRkEsQ0FBQTtBQVFBLE1BQUEsSUFBcUQsYUFBckQ7QUFBQSxRQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixFQUFtQyxhQUFuQyxDQUFBLENBQUE7T0FSQTtBQVNBLGFBQU8sYUFBUCxDQVZLO0lBQUEsQ0FBUDtBQUFBLElBYUEsZUFBQSxFQUFpQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDZixVQUFBLDhHQUFBO0FBQUEsTUFBQSxhQUFBLEdBQWdCLEVBQWhCLENBQUE7QUFDQTtBQUFBLFdBQUEsMkNBQUE7d0JBQUE7QUFDRSxRQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLElBQXJCLENBQUE7QUFBQSxRQUNBLGNBQUEsR0FBaUIsYUFBYSxDQUFDLE9BQWQsQ0FBc0IsZUFBdEIsRUFBdUMsRUFBdkMsQ0FEakIsQ0FBQTtBQUVBLFFBQUEsSUFBRyxJQUFBLEdBQU8sTUFBTSxDQUFDLGtCQUFtQixDQUFBLGNBQUEsQ0FBcEM7QUFDRSxVQUFBLGFBQWEsQ0FBQyxJQUFkLENBQ0U7QUFBQSxZQUFBLGFBQUEsRUFBZSxhQUFmO0FBQUEsWUFDQSxTQUFBLEVBQWUsSUFBQSxTQUFBLENBQ2I7QUFBQSxjQUFBLElBQUEsRUFBTSxJQUFJLENBQUMsS0FBWDtBQUFBLGNBQ0EsSUFBQSxFQUFNLElBRE47QUFBQSxjQUVBLElBQUEsRUFBTSxJQUZOO2FBRGEsQ0FEZjtXQURGLENBQUEsQ0FERjtTQUhGO0FBQUEsT0FEQTtBQWNBO1dBQUEsc0RBQUE7aUNBQUE7QUFDRSxRQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsU0FBakIsQ0FBQTtBQUFBLFFBQ0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLFNBQWxCLEVBQTZCLElBQUksQ0FBQyxhQUFsQyxDQURBLENBQUE7QUFBQSxzQkFFQSxJQUFBLENBQUssU0FBTCxFQUZBLENBREY7QUFBQTtzQkFmZTtJQUFBLENBYmpCO0FBQUEsSUFrQ0Esa0JBQUEsRUFBb0IsU0FBQyxhQUFELEVBQWdCLGFBQWhCLEdBQUE7QUFDbEIsVUFBQSw2QkFBQTtBQUFBO1dBQUEsb0RBQUE7c0NBQUE7QUFDRSxnQkFBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxlQUNPLFVBRFA7QUFFSSwwQkFBQSxhQUFhLENBQUMsUUFBZCxHQUF5QixLQUF6QixDQUZKO0FBQ087QUFEUDtrQ0FBQTtBQUFBLFNBREY7QUFBQTtzQkFEa0I7SUFBQSxDQWxDcEI7QUFBQSxJQTJDQSxnQkFBQSxFQUFrQixTQUFDLFNBQUQsRUFBWSxhQUFaLEdBQUE7QUFDaEIsTUFBQSxJQUFHLFNBQVMsQ0FBQyxrQkFBVixDQUFBLENBQUg7QUFDRSxRQUFBLElBQUcsYUFBQSxLQUFpQixTQUFTLENBQUMsWUFBVixDQUFBLENBQXBCO2lCQUNFLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFwQixFQUErQixhQUEvQixFQURGO1NBQUEsTUFFSyxJQUFHLENBQUEsU0FBYSxDQUFDLElBQWpCO2lCQUNILElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFwQixFQURHO1NBSFA7T0FBQSxNQUFBO2VBTUUsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBakIsRUFBNEIsYUFBNUIsRUFORjtPQURnQjtJQUFBLENBM0NsQjtBQUFBLElBdURBLGtCQUFBLEVBQW9CLFNBQUMsU0FBRCxFQUFZLGFBQVosR0FBQTtBQUNsQixVQUFBLElBQUE7QUFBQSxNQUFBLElBQUEsR0FBTyxTQUFTLENBQUMsSUFBakIsQ0FBQTtBQUNBLE1BQUEsSUFBRyxhQUFIO0FBQ0UsUUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixTQUFqQixFQUE0QixhQUE1QixDQUFBLENBREY7T0FEQTthQUdBLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQVMsQ0FBQyxZQUFWLENBQUEsQ0FBbEIsRUFBNEMsU0FBUyxDQUFDLElBQXRELEVBSmtCO0lBQUEsQ0F2RHBCO0FBQUEsSUE4REEsZUFBQSxFQUFpQixTQUFDLFNBQUQsRUFBWSxhQUFaLEdBQUE7YUFDZixTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWYsQ0FBK0IsYUFBL0IsRUFEZTtJQUFBLENBOURqQjtJQUprQjtBQUFBLENBQUEsQ0FBSCxDQUFBLENBSGpCLENBQUE7Ozs7O0FDQUEsSUFBQSx1QkFBQTs7QUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSLENBQVQsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUFpQixlQUFBLEdBQXFCLENBQUEsU0FBQSxHQUFBO0FBRXBDLE1BQUEsZUFBQTtBQUFBLEVBQUEsZUFBQSxHQUFrQixhQUFsQixDQUFBO1NBRUE7QUFBQSxJQUFBLElBQUEsRUFBTSxTQUFDLElBQUQsRUFBTyxtQkFBUCxHQUFBO0FBQ0osVUFBQSxxREFBQTtBQUFBO0FBQUEsV0FBQSwyQ0FBQTt3QkFBQTtBQUNFLFFBQUEsY0FBQSxHQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQVYsQ0FBa0IsZUFBbEIsRUFBbUMsRUFBbkMsQ0FBakIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxJQUFBLEdBQU8sTUFBTSxDQUFDLGtCQUFtQixDQUFBLGNBQUEsQ0FBcEM7QUFDRSxVQUFBLFNBQUEsR0FBWSxtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixJQUFJLENBQUMsS0FBN0IsQ0FBWixDQUFBO0FBQUEsVUFDQSxTQUFTLENBQUMsSUFBVixHQUFpQixJQURqQixDQURGO1NBRkY7QUFBQSxPQUFBO2FBTUEsT0FQSTtJQUFBLENBQU47SUFKb0M7QUFBQSxDQUFBLENBQUgsQ0FBQSxDQUZuQyxDQUFBOzs7OztBQ0FBLElBQUEseUJBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSx5QkFBUixDQUFULENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBdUI7QUFFUixFQUFBLDJCQUFDLElBQUQsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQWpCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFlBRDdDLENBRFc7RUFBQSxDQUFiOztBQUFBLDhCQUtBLE9BQUEsR0FBUyxJQUxULENBQUE7O0FBQUEsOEJBUUEsT0FBQSxHQUFTLFNBQUEsR0FBQTtXQUNQLENBQUEsQ0FBQyxJQUFFLENBQUEsTUFESTtFQUFBLENBUlQsQ0FBQTs7QUFBQSw4QkFZQSxJQUFBLEdBQU0sU0FBQSxHQUFBO0FBQ0osUUFBQSxjQUFBO0FBQUEsSUFBQSxDQUFBLEdBQUksSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFDLENBQUEsS0FBaEIsQ0FBQTtBQUFBLElBQ0EsS0FBQSxHQUFRLElBQUEsR0FBTyxNQURmLENBQUE7QUFFQSxJQUFBLElBQUcsSUFBQyxDQUFBLE9BQUo7QUFDRSxNQUFBLEtBQUEsR0FBUSxDQUFDLENBQUMsVUFBVixDQUFBO0FBQ0EsTUFBQSxJQUFHLEtBQUEsSUFBUyxDQUFDLENBQUMsUUFBRixLQUFjLENBQXZCLElBQTRCLENBQUEsQ0FBRSxDQUFDLFlBQUYsQ0FBZSxJQUFDLENBQUEsYUFBaEIsQ0FBaEM7QUFDRSxRQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBVCxDQURGO09BQUEsTUFBQTtBQUdFLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUNBLGVBQU0sQ0FBQyxDQUFBLEtBQUssSUFBQyxDQUFBLElBQVAsQ0FBQSxJQUFnQixDQUFBLENBQUUsSUFBQSxHQUFPLENBQUMsQ0FBQyxXQUFWLENBQXZCLEdBQUE7QUFDRSxVQUFBLENBQUEsR0FBSSxDQUFDLENBQUMsVUFBTixDQURGO1FBQUEsQ0FEQTtBQUFBLFFBSUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUpULENBSEY7T0FGRjtLQUZBO1dBYUEsSUFBQyxDQUFBLFFBZEc7RUFBQSxDQVpOLENBQUE7O0FBQUEsOEJBOEJBLFdBQUEsR0FBYSxTQUFBLEdBQUE7QUFDWCxXQUFNLElBQUMsQ0FBQSxJQUFELENBQUEsQ0FBTixHQUFBO0FBQ0UsTUFBQSxJQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBVCxLQUFxQixDQUE5QjtBQUFBLGNBQUE7T0FERjtJQUFBLENBQUE7V0FHQSxJQUFDLENBQUEsUUFKVTtFQUFBLENBOUJiLENBQUE7O0FBQUEsOEJBcUNBLE1BQUEsR0FBUSxTQUFBLEdBQUE7V0FDTixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLElBQUQsR0FBUSxLQUR0QjtFQUFBLENBckNSLENBQUE7OzJCQUFBOztJQVhGLENBQUE7Ozs7O0FDQUEsSUFBQSw4SkFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FBSixDQUFBOztBQUFBLEdBQ0EsR0FBTSxPQUFBLENBQVEsd0JBQVIsQ0FETixDQUFBOztBQUFBLE1BRUEsR0FBUyxPQUFBLENBQVEsMkJBQVIsQ0FGVCxDQUFBOztBQUFBLEtBR0EsR0FBUSxPQUFBLENBQVEsa0JBQVIsQ0FIUixDQUFBOztBQUFBLE1BSUEsR0FBUyxPQUFBLENBQVEseUJBQVIsQ0FKVCxDQUFBOztBQUFBLGlCQU1BLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUixDQU5wQixDQUFBOztBQUFBLG1CQU9BLEdBQXNCLE9BQUEsQ0FBUSx3QkFBUixDQVB0QixDQUFBOztBQUFBLGlCQVFBLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUixDQVJwQixDQUFBOztBQUFBLGVBU0EsR0FBa0IsT0FBQSxDQUFRLG9CQUFSLENBVGxCLENBQUE7O0FBQUEsY0FXQSxHQUFpQixPQUFBLENBQVEsbUNBQVIsQ0FYakIsQ0FBQTs7QUFBQSxhQVlBLEdBQWdCLE9BQUEsQ0FBUSw2QkFBUixDQVpoQixDQUFBOztBQUFBLFVBY0EsR0FBYSxTQUFDLENBQUQsRUFBSSxDQUFKLEdBQUE7QUFDWCxFQUFBLElBQUksQ0FBQyxDQUFDLElBQUYsR0FBUyxDQUFDLENBQUMsSUFBZjtXQUNFLEVBREY7R0FBQSxNQUVLLElBQUksQ0FBQyxDQUFDLElBQUYsR0FBUyxDQUFDLENBQUMsSUFBZjtXQUNILENBQUEsRUFERztHQUFBLE1BQUE7V0FHSCxFQUhHO0dBSE07QUFBQSxDQWRiLENBQUE7O0FBQUEsTUF5Qk0sQ0FBQyxPQUFQLEdBQXVCO0FBR1IsRUFBQSxrQkFBQyxJQUFELEdBQUE7QUFDWCxRQUFBLDZCQUFBO0FBQUEsMEJBRFksT0FBcUMsSUFBbkMsSUFBQyxDQUFBLFlBQUEsTUFBTSxZQUFBLE1BQU0sYUFBQSxPQUFPLGtCQUFBLFVBQ2xDLENBQUE7QUFBQSxJQUFBLE1BQUEsQ0FBTyxJQUFQLEVBQWEsOEJBQWIsQ0FBQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhLENBQUEsQ0FBRyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQVgsQ0FBSCxDQUFxQixDQUFDLElBQXRCLENBQTJCLE9BQTNCLENBRmIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBQSxDQUhULENBQUE7QUFBQSxJQUtBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBQSxJQUFTLEtBQUssQ0FBQyxRQUFOLENBQWdCLElBQUMsQ0FBQSxJQUFqQixDQUxsQixDQUFBO0FBQUEsSUFNQSxJQUFDLENBQUEsTUFBRCxHQUFVLFVBQUEsSUFBYyxFQU54QixDQUFBO0FBQUEsSUFPQSxJQUFDLENBQUEsUUFBRCxHQUFZLEVBUFosQ0FBQTtBQUFBLElBU0EsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQVRBLENBRFc7RUFBQSxDQUFiOztBQUFBLHFCQWFBLFNBQUEsR0FBVyxTQUFDLE1BQUQsR0FBQTtBQUNULElBQUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFWLENBQUE7V0FDQSxJQUFDLENBQUEsVUFBRCxHQUFjLEVBQUEsR0FBakIsTUFBTSxDQUFDLElBQVUsR0FBaUIsR0FBakIsR0FBakIsSUFBQyxDQUFBLEtBRlc7RUFBQSxDQWJYLENBQUE7O0FBQUEscUJBbUJBLFdBQUEsR0FBYSxTQUFBLEdBQUE7V0FDUCxJQUFBLGNBQUEsQ0FBZTtBQUFBLE1BQUEsUUFBQSxFQUFVLElBQVY7S0FBZixFQURPO0VBQUEsQ0FuQmIsQ0FBQTs7QUFBQSxxQkF1QkEsVUFBQSxHQUFZLFNBQUMsY0FBRCxFQUFpQixVQUFqQixHQUFBO0FBQ1YsUUFBQSxnQ0FBQTtBQUFBLElBQUEsbUJBQUEsaUJBQW1CLElBQUMsQ0FBQSxXQUFELENBQUEsRUFBbkIsQ0FBQTtBQUFBLElBQ0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxTQUFTLENBQUMsS0FBWCxDQUFBLENBRFIsQ0FBQTtBQUFBLElBRUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQU0sQ0FBQSxDQUFBLENBQXRCLENBRmIsQ0FBQTtXQUlBLGFBQUEsR0FBb0IsSUFBQSxhQUFBLENBQ2xCO0FBQUEsTUFBQSxLQUFBLEVBQU8sY0FBUDtBQUFBLE1BQ0EsS0FBQSxFQUFPLEtBRFA7QUFBQSxNQUVBLFVBQUEsRUFBWSxVQUZaO0FBQUEsTUFHQSxVQUFBLEVBQVksVUFIWjtLQURrQixFQUxWO0VBQUEsQ0F2QlosQ0FBQTs7QUFBQSxxQkFtQ0EsU0FBQSxHQUFXLFNBQUMsSUFBRCxHQUFBO0FBR1QsSUFBQSxJQUFBLEdBQU8sQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLE1BQVIsQ0FBZSxTQUFDLEtBQUQsR0FBQTthQUNwQixJQUFDLENBQUEsUUFBRCxLQUFZLEVBRFE7SUFBQSxDQUFmLENBQVAsQ0FBQTtBQUFBLElBSUEsTUFBQSxDQUFPLElBQUksQ0FBQyxNQUFMLEtBQWUsQ0FBdEIsRUFBMEIsMERBQUEsR0FBN0IsSUFBQyxDQUFBLFVBQTRCLEdBQXdFLGNBQXhFLEdBQTdCLElBQUksQ0FBQyxNQUFGLENBSkEsQ0FBQTtXQU1BLEtBVFM7RUFBQSxDQW5DWCxDQUFBOztBQUFBLHFCQThDQSxhQUFBLEdBQWUsU0FBQSxHQUFBO0FBQ2IsUUFBQSxJQUFBO0FBQUEsSUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVUsQ0FBQSxDQUFBLENBQWxCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLENBRGQsQ0FBQTtXQUdBLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDZixnQkFBTyxTQUFTLENBQUMsSUFBakI7QUFBQSxlQUNPLFVBRFA7bUJBRUksS0FBQyxDQUFBLGNBQUQsQ0FBZ0IsU0FBUyxDQUFDLElBQTFCLEVBQWdDLFNBQVMsQ0FBQyxJQUExQyxFQUZKO0FBQUEsZUFHTyxXQUhQO21CQUlJLEtBQUMsQ0FBQSxlQUFELENBQWlCLFNBQVMsQ0FBQyxJQUEzQixFQUFpQyxTQUFTLENBQUMsSUFBM0MsRUFKSjtBQUFBLGVBS08sTUFMUDttQkFNSSxLQUFDLENBQUEsVUFBRCxDQUFZLFNBQVMsQ0FBQyxJQUF0QixFQUE0QixTQUFTLENBQUMsSUFBdEMsRUFOSjtBQUFBLFNBRGU7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQixFQUphO0VBQUEsQ0E5Q2YsQ0FBQTs7QUFBQSxxQkE4REEsaUJBQUEsR0FBbUIsU0FBQyxJQUFELEdBQUE7QUFDakIsUUFBQSwrQkFBQTtBQUFBLElBQUEsUUFBQSxHQUFlLElBQUEsaUJBQUEsQ0FBa0IsSUFBbEIsQ0FBZixDQUFBO0FBQUEsSUFDQSxVQUFBLEdBQWlCLElBQUEsbUJBQUEsQ0FBQSxDQURqQixDQUFBO0FBR0EsV0FBTSxJQUFBLEdBQU8sUUFBUSxDQUFDLFdBQVQsQ0FBQSxDQUFiLEdBQUE7QUFDRSxNQUFBLFNBQUEsR0FBWSxpQkFBaUIsQ0FBQyxLQUFsQixDQUF3QixJQUF4QixDQUFaLENBQUE7QUFDQSxNQUFBLElBQTZCLFNBQTdCO0FBQUEsUUFBQSxVQUFVLENBQUMsR0FBWCxDQUFlLFNBQWYsQ0FBQSxDQUFBO09BRkY7SUFBQSxDQUhBO1dBT0EsV0FSaUI7RUFBQSxDQTlEbkIsQ0FBQTs7QUFBQSxxQkEyRUEsY0FBQSxHQUFnQixTQUFDLElBQUQsR0FBQTtBQUNkLFFBQUEsNkJBQUE7QUFBQSxJQUFBLFFBQUEsR0FBZSxJQUFBLGlCQUFBLENBQWtCLElBQWxCLENBQWYsQ0FBQTtBQUFBLElBQ0EsbUJBQUEsR0FBc0IsSUFBQyxDQUFBLFVBQVUsQ0FBQyxLQUFaLENBQUEsQ0FEdEIsQ0FBQTtBQUdBLFdBQU0sSUFBQSxHQUFPLFFBQVEsQ0FBQyxXQUFULENBQUEsQ0FBYixHQUFBO0FBQ0UsTUFBQSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsRUFBMkIsbUJBQTNCLENBQUEsQ0FERjtJQUFBLENBSEE7V0FNQSxvQkFQYztFQUFBLENBM0VoQixDQUFBOztBQUFBLHFCQXFGQSxjQUFBLEdBQWdCLFNBQUMsSUFBRCxFQUFPLElBQVAsR0FBQTtBQUNkLFFBQUEsbUJBQUE7QUFBQSxJQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFBQSxJQUNBLEtBQUssQ0FBQyxRQUFOLENBQWUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUExQixDQURBLENBQUE7QUFBQSxJQUdBLFlBQUEsR0FBZSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxTQUFoQixDQUhmLENBQUE7QUFBQSxJQUlBLElBQUMsQ0FBQSxRQUFTLENBQUEsSUFBQSxDQUFWLEdBQXFCLFlBQUgsR0FBcUIsWUFBckIsR0FBdUMsRUFKekQsQ0FBQTtXQUtBLElBQUksQ0FBQyxTQUFMLEdBQWlCLEdBTkg7RUFBQSxDQXJGaEIsQ0FBQTs7QUFBQSxxQkE4RkEsZUFBQSxHQUFpQixTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7V0FFZixJQUFJLENBQUMsU0FBTCxHQUFpQixHQUZGO0VBQUEsQ0E5RmpCLENBQUE7O0FBQUEscUJBbUdBLFVBQUEsR0FBWSxTQUFDLElBQUQsRUFBTyxJQUFQLEdBQUE7QUFDVixRQUFBLFlBQUE7QUFBQSxJQUFBLFlBQUEsR0FBZSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxTQUFoQixDQUFmLENBQUE7QUFDQSxJQUFBLElBQWtDLFlBQWxDO0FBQUEsTUFBQSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUEsQ0FBVixHQUFrQixZQUFsQixDQUFBO0tBREE7V0FFQSxJQUFJLENBQUMsU0FBTCxHQUFpQixHQUhQO0VBQUEsQ0FuR1osQ0FBQTs7QUFBQSxxQkE2R0EsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLFFBQUEsNkJBQUE7QUFBQSxJQUFBLEdBQUEsR0FDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFQO0FBQUEsTUFDQSxNQUFBLHFDQUFlLENBQUUsYUFEakI7QUFBQSxNQUVBLFVBQUEsRUFBWSxFQUZaO0FBQUEsTUFHQSxVQUFBLEVBQVksRUFIWjtLQURGLENBQUE7QUFBQSxJQU1BLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQyxTQUFELEdBQUE7QUFDZixZQUFBLFVBQUE7QUFBQSxRQUFFLGlCQUFBLElBQUYsRUFBUSxpQkFBQSxJQUFSLENBQUE7ZUFDQSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQWYsQ0FBb0I7QUFBQSxVQUFFLE1BQUEsSUFBRjtBQUFBLFVBQVEsTUFBQSxJQUFSO1NBQXBCLEVBRmU7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQixDQU5BLENBQUE7QUFXQTtBQUFBLFNBQUEsYUFBQTswQkFBQTtBQUNFLE1BQUEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CO0FBQUEsUUFBRSxNQUFBLElBQUY7QUFBQSxRQUFRLElBQUEsRUFBTSxnQkFBZDtPQUFwQixDQUFBLENBREY7QUFBQSxLQVhBO0FBQUEsSUFjQSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQWYsQ0FBb0IsVUFBcEIsQ0FkQSxDQUFBO0FBQUEsSUFlQSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQWYsQ0FBb0IsVUFBcEIsQ0FmQSxDQUFBO1dBZ0JBLElBakJJO0VBQUEsQ0E3R04sQ0FBQTs7a0JBQUE7O0lBNUJGLENBQUE7O0FBQUEsUUFpS1EsQ0FBQyxlQUFULEdBQTJCLFNBQUMsVUFBRCxHQUFBO0FBQ3pCLE1BQUEsS0FBQTtBQUFBLEVBQUEsSUFBQSxDQUFBLFVBQUE7QUFBQSxVQUFBLENBQUE7R0FBQTtBQUFBLEVBRUEsS0FBQSxHQUFRLFVBQVUsQ0FBQyxLQUFYLENBQWlCLEdBQWpCLENBRlIsQ0FBQTtBQUdBLEVBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNFO0FBQUEsTUFBRSxVQUFBLEVBQVksTUFBZDtBQUFBLE1BQXlCLElBQUEsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQUFyQztNQURGO0dBQUEsTUFFSyxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0g7QUFBQSxNQUFFLFVBQUEsRUFBWSxLQUFNLENBQUEsQ0FBQSxDQUFwQjtBQUFBLE1BQXdCLElBQUEsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQUFwQztNQURHO0dBQUEsTUFBQTtXQUdILEdBQUcsQ0FBQyxLQUFKLENBQVcsaURBQUEsR0FBZCxVQUFHLEVBSEc7R0FOb0I7QUFBQSxDQWpLM0IsQ0FBQTs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgb2JqZWN0S2V5cyA9IHJlcXVpcmUoJy4vbGliL2tleXMuanMnKTtcbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vbGliL2lzX2FyZ3VtZW50cy5qcycpO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWRPck51bGwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzQnVmZmVyICh4KSB7XG4gIGlmICgheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHgubGVuZ3RoICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIHguY29weSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeC5zbGljZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoeC5sZW5ndGggPiAwICYmIHR5cGVvZiB4WzBdICE9PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgb3B0cykge1xuICB2YXIgaSwga2V5O1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gZGVlcEVxdWFsKGEsIGIsIG9wdHMpO1xuICB9XG4gIGlmIChpc0J1ZmZlcihhKSkge1xuICAgIGlmICghaXNCdWZmZXIoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgfSBjYXRjaCAoZSkgey8vaGFwcGVucyB3aGVuIG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIGFuZCB0aGUgb3RoZXIgaXNuJ3RcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBvcHRzKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuIiwidmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59O1xuXG5leHBvcnRzLnVuc3VwcG9ydGVkID0gdW5zdXBwb3J0ZWQ7XG5mdW5jdGlvbiB1bnN1cHBvcnRlZChvYmplY3Qpe1xuICByZXR1cm4gb2JqZWN0ICYmXG4gICAgdHlwZW9mIG9iamVjdCA9PSAnb2JqZWN0JyAmJlxuICAgIHR5cGVvZiBvYmplY3QubGVuZ3RoID09ICdudW1iZXInICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpICYmXG4gICAgIU9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChvYmplY3QsICdjYWxsZWUnKSB8fFxuICAgIGZhbHNlO1xufTtcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJ1xuICA/IE9iamVjdC5rZXlzIDogc2hpbTtcblxuZXhwb3J0cy5zaGltID0gc2hpbTtcbmZ1bmN0aW9uIHNoaW0gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgcmV0dXJuIGtleXM7XG59XG4iLCJ2YXIgU2NoZW1lLCBqU2NoZW1lO1xuXG5TY2hlbWUgPSByZXF1aXJlKCcuL3NjaGVtZScpO1xuXG5qU2NoZW1lID0gbmV3IFNjaGVtZSgpO1xuXG5qU2NoZW1lW1wibmV3XCJdID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgU2NoZW1lKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGpTY2hlbWU7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyAhPT0gbnVsbCkge1xuICB3aW5kb3cualNjaGVtZSA9IGpTY2hlbWU7XG59XG4iLCJ2YXIgUHJvcGVydHlWYWxpZGF0b3I7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvcGVydHlWYWxpZGF0b3IgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciB0ZXJtUmVnZXg7XG5cbiAgdGVybVJlZ2V4ID0gL1xcd1tcXHcgXSpcXHcvZztcblxuICBmdW5jdGlvbiBQcm9wZXJ0eVZhbGlkYXRvcihfYXJnKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgdGhpcy5pbnB1dFN0cmluZyA9IF9hcmcuaW5wdXRTdHJpbmcsIHRoaXMuc2NoZW1lID0gX2FyZy5zY2hlbWUsIHRoaXMucHJvcGVydHkgPSBfYXJnLnByb3BlcnR5LCB0aGlzLnBhcmVudCA9IF9hcmcucGFyZW50O1xuICAgIHRoaXMudmFsaWRhdG9ycyA9IFtdO1xuICAgIHRoaXMubG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuc2NoZW1lLnByb3BlcnRpZXNSZXF1aXJlZCkge1xuICAgICAgaWYgKChfcmVmID0gdGhpcy5wYXJlbnQpICE9IG51bGwpIHtcbiAgICAgICAgX3JlZi5hZGRSZXF1aXJlZFByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmFkZFZhbGlkYXRpb25zKHRoaXMuaW5wdXRTdHJpbmcpO1xuICB9XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmdldExvY2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucHJvcGVydHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wYXJlbnQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmxvY2F0aW9uICsgdGhpcy5zY2hlbWUud3JpdGVQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2NoZW1lLndyaXRlUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgfVxuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5nZXRQcm9wTG9jYXRpb24gPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gXCJcIiArIHRoaXMubG9jYXRpb24gKyAodGhpcy5zY2hlbWUud3JpdGVQcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuYWRkVmFsaWRhdGlvbnMgPSBmdW5jdGlvbihjb25maWdTdHJpbmcpIHtcbiAgICB2YXIgcmVzdWx0LCB0ZXJtLCB0eXBlcztcbiAgICB3aGlsZSAocmVzdWx0ID0gdGVybVJlZ2V4LmV4ZWMoY29uZmlnU3RyaW5nKSkge1xuICAgICAgdGVybSA9IHJlc3VsdFswXTtcbiAgICAgIGlmICh0ZXJtID09PSAnb3B0aW9uYWwnKSB7XG4gICAgICAgIHRoaXMucGFyZW50LnJlbW92ZVJlcXVpcmVkUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgICB9IGVsc2UgaWYgKHRlcm0gPT09ICdyZXF1aXJlZCcpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQuYWRkUmVxdWlyZWRQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICAgIH0gZWxzZSBpZiAodGVybS5pbmRleE9mKCdhcnJheSBvZiAnKSA9PT0gMCkge1xuICAgICAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCgnYXJyYXknKTtcbiAgICAgICAgdGhpcy5hcnJheVZhbGlkYXRvciA9IHRlcm0uc2xpY2UoOSk7XG4gICAgICB9IGVsc2UgaWYgKHRlcm0uaW5kZXhPZignIG9yICcpICE9PSAtMSkge1xuICAgICAgICB0eXBlcyA9IHRlcm0uc3BsaXQoJyBvciAnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3RvZG8nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKHRlcm0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlLCBlcnJvcnMpIHtcbiAgICB2YXIgaXNWYWxpZCwgbmFtZSwgdmFsaWQsIHZhbGlkYXRvciwgdmFsaWRhdG9ycywgX2ksIF9sZW4sIF9yZWY7XG4gICAgaXNWYWxpZCA9IHRydWU7XG4gICAgaWYgKCh2YWx1ZSA9PSBudWxsKSAmJiB0aGlzLmlzT3B0aW9uYWwoKSkge1xuICAgICAgcmV0dXJuIGlzVmFsaWQ7XG4gICAgfVxuICAgIHZhbGlkYXRvcnMgPSB0aGlzLnNjaGVtZS52YWxpZGF0b3JzO1xuICAgIF9yZWYgPSB0aGlzLnZhbGlkYXRvcnMgfHwgW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBuYW1lID0gX3JlZltfaV07XG4gICAgICB2YWxpZGF0b3IgPSB2YWxpZGF0b3JzW25hbWVdO1xuICAgICAgaWYgKHZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnMuYWRkKFwibWlzc2luZyB2YWxpZGF0b3IgXCIgKyBuYW1lLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMubG9jYXRpb25cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAodmFsaWQgPSB2YWxpZGF0b3IodmFsdWUpID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZXJyb3JzLmFkZCh2YWxpZCwge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5sb2NhdGlvbixcbiAgICAgICAgZGVmYXVsdE1lc3NhZ2U6IFwiXCIgKyBuYW1lICsgXCIgdmFsaWRhdG9yIGZhaWxlZFwiXG4gICAgICB9KTtcbiAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCEoaXNWYWxpZCA9IHRoaXMudmFsaWRhdGVBcnJheSh2YWx1ZSwgZXJyb3JzKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCEoaXNWYWxpZCA9IHRoaXMudmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXModmFsdWUsIGVycm9ycykpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBpc1ZhbGlkO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS52YWxpZGF0ZUFycmF5ID0gZnVuY3Rpb24oYXJyLCBlcnJvcnMpIHtcbiAgICB2YXIgZW50cnksIGluZGV4LCBpc1ZhbGlkLCBsb2NhdGlvbiwgcmVzLCB2YWxpZGF0b3IsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGlmICh0aGlzLmFycmF5VmFsaWRhdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICB2YWxpZGF0b3IgPSB0aGlzLnNjaGVtZS52YWxpZGF0b3JzW3RoaXMuYXJyYXlWYWxpZGF0b3JdO1xuICAgIGlmICh2YWxpZGF0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGVycm9ycy5hZGQoXCJtaXNzaW5nIHZhbGlkYXRvciBcIiArIHRoaXMuYXJyYXlWYWxpZGF0b3IsIHtcbiAgICAgICAgbG9jYXRpb246IHRoaXMubG9jYXRpb25cbiAgICAgIH0pO1xuICAgIH1cbiAgICBfcmVmID0gYXJyIHx8IFtdO1xuICAgIGZvciAoaW5kZXggPSBfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBpbmRleCA9ICsrX2kpIHtcbiAgICAgIGVudHJ5ID0gX3JlZltpbmRleF07XG4gICAgICByZXMgPSB2YWxpZGF0b3IoZW50cnkpO1xuICAgICAgaWYgKHJlcyA9PT0gdHJ1ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxvY2F0aW9uID0gXCJcIiArIHRoaXMubG9jYXRpb24gKyBcIltcIiArIGluZGV4ICsgXCJdXCI7XG4gICAgICBlcnJvcnMuYWRkKHJlcywge1xuICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgIGRlZmF1bHRNZXNzYWdlOiBcIlwiICsgdGhpcy5hcnJheVZhbGlkYXRvciArIFwiIHZhbGlkYXRvciBmYWlsZWRcIlxuICAgICAgfSk7XG4gICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBpc1ZhbGlkO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS52YWxpZGF0ZU90aGVyUHJvcGVydHkgPSBmdW5jdGlvbihrZXksIHZhbHVlLCBlcnJvcnMpIHtcbiAgICB2YXIgaXNWYWxpZDtcbiAgICBpZiAodGhpcy5vdGhlclByb3BlcnR5VmFsaWRhdG9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZW1lLmVycm9ycyA9IHZvaWQgMDtcbiAgICAgIGlmIChpc1ZhbGlkID0gdGhpcy5vdGhlclByb3BlcnR5VmFsaWRhdG9yLmNhbGwodGhpcywga2V5LCB2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zY2hlbWUuZXJyb3JzICE9IG51bGwpIHtcbiAgICAgICAgZXJyb3JzLmpvaW4odGhpcy5zY2hlbWUuZXJyb3JzLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvcnMuYWRkKFwiYWRkaXRpb25hbCBwcm9wZXJ0eSBjaGVjayBmYWlsZWRcIiwge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmdldFByb3BMb2NhdGlvbihrZXkpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zY2hlbWUuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9ycy5hZGQoXCJ1bnNwZWNpZmllZCBhZGRpdGlvbmFsIHByb3BlcnR5XCIsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5nZXRQcm9wTG9jYXRpb24oa2V5KVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUudmFsaWRhdGVSZXF1aXJlZFByb3BlcnRpZXMgPSBmdW5jdGlvbihvYmosIGVycm9ycykge1xuICAgIHZhciBpc1JlcXVpcmVkLCBpc1ZhbGlkLCBrZXksIF9yZWY7XG4gICAgaXNWYWxpZCA9IHRydWU7XG4gICAgX3JlZiA9IHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzO1xuICAgIGZvciAoa2V5IGluIF9yZWYpIHtcbiAgICAgIGlzUmVxdWlyZWQgPSBfcmVmW2tleV07XG4gICAgICBpZiAoKG9ialtrZXldID09IG51bGwpICYmIGlzUmVxdWlyZWQpIHtcbiAgICAgICAgZXJyb3JzLmFkZChcInJlcXVpcmVkIHByb3BlcnR5IG1pc3NpbmdcIiwge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmdldFByb3BMb2NhdGlvbihrZXkpXG4gICAgICAgIH0pO1xuICAgICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpc1ZhbGlkO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5hZGRSZXF1aXJlZFByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzID09IG51bGwpIHtcbiAgICAgIHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzID0ge307XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlcXVpcmVkUHJvcGVydGllc1trZXldID0gdHJ1ZTtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUucmVtb3ZlUmVxdWlyZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzKSAhPSBudWxsID8gX3JlZltrZXldID0gdm9pZCAwIDogdm9pZCAwO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5pc09wdGlvbmFsID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucGFyZW50ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiAhdGhpcy5wYXJlbnQucmVxdWlyZWRQcm9wZXJ0aWVzW3RoaXMucHJvcGVydHldID09PSB0cnVlO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gUHJvcGVydHlWYWxpZGF0b3I7XG5cbn0pKCk7XG4iLCJ2YXIgUHJvcGVydHlWYWxpZGF0b3IsIFNjaGVtZSwgVmFsaWRhdGlvbkVycm9ycywgdHlwZSwgdmFsaWRhdG9ycztcblxuVmFsaWRhdGlvbkVycm9ycyA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbl9lcnJvcnMnKTtcblxuUHJvcGVydHlWYWxpZGF0b3IgPSByZXF1aXJlKCcuL3Byb3BlcnR5X3ZhbGlkYXRvcicpO1xuXG52YWxpZGF0b3JzID0gcmVxdWlyZSgnLi92YWxpZGF0b3JzJyk7XG5cbnR5cGUgPSByZXF1aXJlKCcuL3R5cGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY2hlbWUgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBqc1ZhcmlhYmxlTmFtZTtcblxuICBqc1ZhcmlhYmxlTmFtZSA9IC9eW2EtekEtWl1cXHcqJC87XG5cbiAgZnVuY3Rpb24gU2NoZW1lKCkge1xuICAgIHRoaXMudmFsaWRhdG9ycyA9IE9iamVjdC5jcmVhdGUodmFsaWRhdG9ycyk7XG4gICAgdGhpcy5zY2hlbWFzID0ge307XG4gICAgdGhpcy5wcm9wZXJ0aWVzUmVxdWlyZWQgPSB0cnVlO1xuICAgIHRoaXMuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcyA9IHRydWU7XG4gIH1cblxuICBTY2hlbWUucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB0aGlzLnByb3BlcnRpZXNSZXF1aXJlZCA9IF9hcmcucHJvcGVydGllc1JlcXVpcmVkLCB0aGlzLmFsbG93QWRkaXRpb25hbFByb3BlcnRpZXMgPSBfYXJnLmFsbG93QWRkaXRpb25hbFByb3BlcnRpZXM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihuYW1lLCBzY2hlbWEpIHtcbiAgICBpZiAodHlwZS5pc0Z1bmN0aW9uKHNjaGVtYSkpIHtcbiAgICAgIHRoaXMuYWRkVmFsaWRhdG9yKG5hbWUsIHNjaGVtYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkU2NoZW1hKG5hbWUsIHRoaXMucGFyc2VDb25maWdPYmooc2NoZW1hLCB2b2lkIDAsIG5hbWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5hZGRTY2hlbWEgPSBmdW5jdGlvbihuYW1lLCBzY2hlbWEpIHtcbiAgICBpZiAodGhpcy52YWxpZGF0b3JzW25hbWVdICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgdmFsaWRhdG9yIGlzIGFscmVkeSByZWdpc3RlcmVkIHVuZGVyIHRoaXMgbmFtZTogXCIgKyBuYW1lKTtcbiAgICB9XG4gICAgdGhpcy5zY2hlbWFzW25hbWVdID0gc2NoZW1hO1xuICAgIHRoaXMudmFsaWRhdG9yc1tuYW1lXSA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHZhciBlcnJvcnM7XG4gICAgICAgIGVycm9ycyA9IF90aGlzLnJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYSwgdmFsdWUpO1xuICAgICAgICBpZiAoZXJyb3JzLmhhc0Vycm9ycygpKSB7XG4gICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KSh0aGlzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZFZhbGlkYXRvciA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcbiAgICB0aGlzLnZhbGlkYXRvcnNbbmFtZV0gPSBmdW5jO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihzY2hlbWFOYW1lLCBvYmopIHtcbiAgICB2YXIgc2NoZW1hO1xuICAgIHRoaXMuZXJyb3JzID0gdm9pZCAwO1xuICAgIHNjaGVtYSA9IHRoaXMuc2NoZW1hc1tzY2hlbWFOYW1lXTtcbiAgICBpZiAoc2NoZW1hID09IG51bGwpIHtcbiAgICAgIHRoaXMuZXJyb3JzID0gbmV3IFZhbGlkYXRpb25FcnJvcnMoKTtcbiAgICAgIHRoaXMuZXJyb3JzLmFkZChcIm1pc3Npbmcgc2NoZW1hXCIsIHtcbiAgICAgICAgbG9jYXRpb246IHNjaGVtYU5hbWVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmVycm9ycyA9IHRoaXMucmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hLCBvYmopLnNldFJvb3Qoc2NoZW1hTmFtZSk7XG4gICAgcmV0dXJuICF0aGlzLmVycm9ycy5oYXNFcnJvcnMoKTtcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmhhc0Vycm9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHRoaXMuZXJyb3JzKSAhPSBudWxsID8gX3JlZi5oYXNFcnJvcnMoKSA6IHZvaWQgMDtcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmdldEVycm9yTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3JlZjtcbiAgICByZXR1cm4gKF9yZWYgPSB0aGlzLmVycm9ycykgIT0gbnVsbCA/IF9yZWYuZ2V0TWVzc2FnZXMoKSA6IHZvaWQgMDtcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLnJlY3Vyc2l2ZVZhbGlkYXRlID0gZnVuY3Rpb24oc2NoZW1hT2JqLCBvYmopIHtcbiAgICB2YXIgZXJyb3JzLCBpc1ZhbGlkLCBrZXksIHBhcmVudFZhbGlkYXRvciwgcHJvcGVydHlWYWxpZGF0b3IsIHZhbHVlO1xuICAgIHBhcmVudFZhbGlkYXRvciA9IHNjaGVtYU9ialsnX192YWxpZGF0b3InXTtcbiAgICBlcnJvcnMgPSBuZXcgVmFsaWRhdGlvbkVycm9ycygpO1xuICAgIHBhcmVudFZhbGlkYXRvci52YWxpZGF0ZShvYmosIGVycm9ycyk7XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKHNjaGVtYU9ialtrZXldICE9IG51bGwpIHtcbiAgICAgICAgcHJvcGVydHlWYWxpZGF0b3IgPSBzY2hlbWFPYmpba2V5XVsnX192YWxpZGF0b3InXTtcbiAgICAgICAgaXNWYWxpZCA9IHByb3BlcnR5VmFsaWRhdG9yLnZhbGlkYXRlKHZhbHVlLCBlcnJvcnMpO1xuICAgICAgICBpZiAoaXNWYWxpZCAmJiAocHJvcGVydHlWYWxpZGF0b3IuY2hpbGRTY2hlbWFOYW1lID09IG51bGwpICYmIHR5cGUuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgICAgZXJyb3JzLmpvaW4odGhpcy5yZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWFPYmpba2V5XSwgdmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50VmFsaWRhdG9yLnZhbGlkYXRlT3RoZXJQcm9wZXJ0eShrZXksIHZhbHVlLCBlcnJvcnMpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXJyb3JzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUucGFyc2VDb25maWdPYmogPSBmdW5jdGlvbihvYmosIHBhcmVudFZhbGlkYXRvcikge1xuICAgIHZhciBrZXksIHByb3BWYWxpZGF0b3IsIHZhbHVlO1xuICAgIGlmIChwYXJlbnRWYWxpZGF0b3IgPT0gbnVsbCkge1xuICAgICAgcGFyZW50VmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKHtcbiAgICAgICAgaW5wdXRTdHJpbmc6ICdvYmplY3QnLFxuICAgICAgICBzY2hlbWU6IHRoaXNcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAodGhpcy5hZGRQYXJlbnRWYWxpZGF0b3IocGFyZW50VmFsaWRhdG9yLCBrZXksIHZhbHVlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICBwcm9wVmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKHtcbiAgICAgICAgICBpbnB1dFN0cmluZzogdmFsdWUsXG4gICAgICAgICAgcHJvcGVydHk6IGtleSxcbiAgICAgICAgICBwYXJlbnQ6IHBhcmVudFZhbGlkYXRvcixcbiAgICAgICAgICBzY2hlbWU6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgICAgIG9ialtrZXldID0ge1xuICAgICAgICAgICdfX3ZhbGlkYXRvcic6IHByb3BWYWxpZGF0b3JcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZS5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgcHJvcFZhbGlkYXRvciA9IG5ldyBQcm9wZXJ0eVZhbGlkYXRvcih7XG4gICAgICAgICAgaW5wdXRTdHJpbmc6ICdvYmplY3QnLFxuICAgICAgICAgIHByb3BlcnR5OiBrZXksXG4gICAgICAgICAgcGFyZW50OiBwYXJlbnRWYWxpZGF0b3IsXG4gICAgICAgICAgc2NoZW1lOiB0aGlzXG4gICAgICAgIH0pO1xuICAgICAgICBvYmpba2V5XSA9IHRoaXMucGFyc2VDb25maWdPYmoodmFsdWUsIHByb3BWYWxpZGF0b3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBvYmpbJ19fdmFsaWRhdG9yJ10gPSBwYXJlbnRWYWxpZGF0b3I7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZFBhcmVudFZhbGlkYXRvciA9IGZ1bmN0aW9uKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWxpZGF0b3IpIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSAnX192YWxpZGF0ZSc6XG4gICAgICAgIHBhcmVudFZhbGlkYXRvci5hZGRWYWxpZGF0aW9ucyh2YWxpZGF0b3IpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ19fYWRkaXRpb25hbFByb3BlcnR5JzpcbiAgICAgICAgaWYgKHR5cGUuaXNGdW5jdGlvbih2YWxpZGF0b3IpKSB7XG4gICAgICAgICAgcGFyZW50VmFsaWRhdG9yLm90aGVyUHJvcGVydHlWYWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUud3JpdGVQcm9wZXJ0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKGpzVmFyaWFibGVOYW1lLnRlc3QodmFsdWUpKSB7XG4gICAgICByZXR1cm4gXCIuXCIgKyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFwiWydcIiArIHZhbHVlICsgXCInXVwiO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gU2NoZW1lO1xuXG59KSgpO1xuIiwidmFyIHRvU3RyaW5nLCB0eXBlO1xuXG50b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZSA9IHtcbiAgaXNPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB0O1xuICAgIHQgPSB0eXBlb2Ygb2JqO1xuICAgIHJldHVybiB0ID09PSAnb2JqZWN0JyAmJiAhIW9iaiAmJiAhdGhpcy5pc0FycmF5KG9iaik7XG4gIH0sXG4gIGlzQm9vbGVhbjogZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9XG59O1xuXG5bJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnLCAnQXJyYXknXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHR5cGVbXCJpc1wiICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAoXCJbb2JqZWN0IFwiICsgbmFtZSArIFwiXVwiKTtcbiAgfTtcbn0pO1xuXG5pZiAoQXJyYXkuaXNBcnJheSkge1xuICB0eXBlLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xufVxuIiwidmFyIFZhbGlkYXRpb25FcnJvcnMsIHR5cGU7XG5cbnR5cGUgPSByZXF1aXJlKCcuL3R5cGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0aW9uRXJyb3JzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBWYWxpZGF0aW9uRXJyb3JzKCkge31cblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5oYXNFcnJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvcnMgIT0gbnVsbDtcbiAgfTtcblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5zZXRSb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICAgIHRoaXMucm9vdCA9IHJvb3Q7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24obWVzc2FnZSwgX2FyZykge1xuICAgIHZhciBkZWZhdWx0TWVzc2FnZSwgZXJyb3IsIGxvY2F0aW9uLCBfcmVmO1xuICAgIF9yZWYgPSBfYXJnICE9IG51bGwgPyBfYXJnIDoge30sIGxvY2F0aW9uID0gX3JlZi5sb2NhdGlvbiwgZGVmYXVsdE1lc3NhZ2UgPSBfcmVmLmRlZmF1bHRNZXNzYWdlO1xuICAgIGlmIChtZXNzYWdlID09PSBmYWxzZSkge1xuICAgICAgbWVzc2FnZSA9IGRlZmF1bHRNZXNzYWdlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lcnJvcnMgPT0gbnVsbCkge1xuICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICB9XG4gICAgaWYgKHR5cGUuaXNTdHJpbmcobWVzc2FnZSkpIHtcbiAgICAgIHRoaXMuZXJyb3JzLnB1c2goe1xuICAgICAgICBwYXRoOiBsb2NhdGlvbixcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9ycykge1xuICAgICAgdGhpcy5qb2luKG1lc3NhZ2UsIHtcbiAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UucGF0aCAmJiBtZXNzYWdlLm1lc3NhZ2UpIHtcbiAgICAgIGVycm9yID0gbWVzc2FnZTtcbiAgICAgIHRoaXMuZXJyb3JzLnB1c2goe1xuICAgICAgICBwYXRoOiBsb2NhdGlvbiArIGVycm9yLnBhdGgsXG4gICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbGlkYXRpb25FcnJvci5hZGQoKSB1bmtub3duIGVycm9yIHR5cGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbihfYXJnLCBfYXJnMSkge1xuICAgIHZhciBlcnJvciwgZXJyb3JzLCBsb2NhdGlvbiwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIGVycm9ycyA9IF9hcmcuZXJyb3JzO1xuICAgIGxvY2F0aW9uID0gKF9hcmcxICE9IG51bGwgPyBfYXJnMSA6IHt9KS5sb2NhdGlvbjtcbiAgICBpZiAoZXJyb3JzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLmVycm9ycyA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgICB9XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBlcnJvcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZXJyb3IgPSBlcnJvcnNbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKHRoaXMuZXJyb3JzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IChsb2NhdGlvbiB8fCAnJykgKyBlcnJvci5wYXRoLFxuICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2VcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH1cbiAgfTtcblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5nZXRNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlcnJvciwgbWVzc2FnZXMsIF9pLCBfbGVuLCBfcmVmO1xuICAgIG1lc3NhZ2VzID0gW107XG4gICAgX3JlZiA9IHRoaXMuZXJyb3JzIHx8IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgZXJyb3IgPSBfcmVmW19pXTtcbiAgICAgIG1lc3NhZ2VzLnB1c2goXCJcIiArICh0aGlzLnJvb3QgfHwgJycpICsgZXJyb3IucGF0aCArIFwiOiBcIiArIGVycm9yLm1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZXM7XG4gIH07XG5cbiAgcmV0dXJuIFZhbGlkYXRpb25FcnJvcnM7XG5cbn0pKCk7XG4iLCJ2YXIgdHlwZTtcblxudHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ29iamVjdCc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNPYmplY3QodmFsdWUpO1xuICB9LFxuICAnc3RyaW5nJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc1N0cmluZyh2YWx1ZSk7XG4gIH0sXG4gICdib29sZWFuJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0Jvb2xlYW4odmFsdWUpO1xuICB9LFxuICAnbnVtYmVyJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc051bWJlcih2YWx1ZSk7XG4gIH0sXG4gICdmdW5jdGlvbic6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNGdW5jdGlvbih2YWx1ZSk7XG4gIH0sXG4gICdkYXRlJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0RhdGUodmFsdWUpO1xuICB9LFxuICAncmVnZXhwJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc1JlZ0V4cCh2YWx1ZSk7XG4gIH0sXG4gICdhcnJheSc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNBcnJheSh2YWx1ZSk7XG4gIH0sXG4gICdmYWxzeSc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhdmFsdWUgPT09IGZhbHNlO1xuICB9LFxuICAndHJ1dGh5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gISF2YWx1ZSA9PT0gdHJ1ZTtcbiAgfSxcbiAgJ25vdCBlbXB0eSc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhdmFsdWUgPT09IHRydWU7XG4gIH0sXG4gICdkZXByZWNhdGVkJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuOSAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuICAgICAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cbiAgICAgKlxuICAgICAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuICAgIC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG4gICAgdmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcbiAgICB2YXIgZXhwb3J0cyA9IHRoaXM7XG4gICAgdmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdHMgc3RvcmFnZSBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2RcbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG4gICAgICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuICAgICAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG4gICAgICovXG4gICAgcHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG4gICAgICAgIHZhciByZXNwb25zZTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICAvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuICAgICAgICAvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICAgIGlmIChldnQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge307XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuICAgICAqL1xuICAgIHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuICAgICAgICB2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmbGF0TGlzdGVuZXJzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cbiAgICAgKi9cbiAgICBwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICAgIGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG4gICAgICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG4gICAgICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuICAgICAgICB2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgICAgICAgICAgICAgICBvbmNlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG4gICAgICovXG4gICAgcHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG4gICAgICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0cyBmaXJzdCBleGVjdXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuICAgICAgICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuICAgICAqL1xuICAgIHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuICAgICAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcbiAgICAgICAgdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG4gICAgICovXG4gICAgcHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG4gICAgICAgIHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG4gICAgICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG4gICAgICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG4gICAgICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgdmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuICAgICAgICB2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG4gICAgICAgIC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXRzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2RcbiAgICAgICAgaWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgZm9yIChpIGluIGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG4gICAgICAgICAgICAvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG4gICAgICAgICAgICAvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuICAgICAgICAgICAgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgc2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuICAgICAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcbiAgICAgICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1tldnRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuICAgICAgICAgICAgZm9yIChrZXkgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG4gICAgICpcbiAgICAgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG4gICAgICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG4gICAgICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuICAgICAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cbiAgICAgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBsaXN0ZW5lcjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIHZhciByZXNwb25zZTtcblxuICAgICAgICBmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIGVtaXRFdmVudFxuICAgICAqL1xuICAgIHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG4gICAgICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcbiAgICAgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcbiAgICAgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAgICAgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuICAgICAqXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG4gICAgICovXG4gICAgRXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgICAgICBleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG4gICAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgfTtcblxuICAgIC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBleHBvcnRzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcbiAgICB9XG59LmNhbGwodGhpcykpO1xuIiwiY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5hdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnJylcbkxpdmluZ2RvYyA9IHJlcXVpcmUoJy4vbGl2aW5nZG9jJylcbkNvbXBvbmVudFRyZWUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxudmVyc2lvbiA9IHJlcXVpcmUoJy4uL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuICAjIFNldCB0aGUgY3VycmVudCB2ZXJzaW9uXG4gIHZlcnNpb246IHZlcnNpb24udmVyc2lvblxuICByZXZpc2lvbjogdmVyc2lvbi5yZXZpc2lvblxuXG5cbiAgIyBMb2FkIGFuZCBhY2Nlc3MgZGVzaWducy5cbiAgI1xuICAjIExvYWQgYSBkZXNpZ246XG4gICMgZGVzaWduLmxvYWQoeW91ckRlc2lnbkpzb24pXG4gICNcbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBhbHJlYWR5IGxvYWRlZDpcbiAgIyBkZXNpZ24uaGFzKG5hbWVPZllvdXJEZXNpZ24pXG4gICNcbiAgIyBHZXQgYW4gYWxyZWFkeSBsb2FkZWQgZGVzaWduOlxuICAjIGRlc2lnbi5nZXQobmFtZU9mWW91ckRlc2lnbilcbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG5cbiAgIyBEaXJlY3QgYWNjZXNzIHRvIG1vZGVsc1xuICBMaXZpbmdkb2M6IExpdmluZ2RvY1xuICBDb21wb25lbnRUcmVlOiBDb21wb25lbnRUcmVlXG5cblxuICAjIExvYWQgYSBsaXZpbmdkb2MgZnJvbSBzZXJpYWxpemVkIGRhdGEgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBjcmVhdGVMaXZpbmdkb2M6ICh7IGRhdGEsIGRlc2lnbiwgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIExpdmluZ2RvYy5jcmVhdGUoeyBkYXRhLCBkZXNpZ25OYW1lOiBkZXNpZ24sIGNvbXBvbmVudFRyZWUgfSlcblxuXG4gICMgQWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIG5ldzogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIGNyZWF0ZTogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuXG4gICMgQ2hhbmdlIHRoZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG5cbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3IgY29tcG9uZW50cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgQ29tcG9uZW50QXJyYXkgdGhhdCB3b3JrcyBzaW1pbGFyIHRvIGEgalF1ZXJ5IG9iamVjdC5cbiMgRm9yIGV4dGVuc2liaWxpdHkgdmlhIHBsdWdpbnMgd2UgZXhwb3NlIHRoZSBwcm90b3R5cGUgb2YgQ29tcG9uZW50QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRBcnJheVxuXG5cbiAgIyBAcGFyYW0gY29tcG9uZW50czogYXJyYXkgb2YgY29tcG9uZW50c1xuICBjb25zdHJ1Y3RvcjogKEBjb21wb25lbnRzKSAtPlxuICAgIEBjb21wb25lbnRzID89IFtdXG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBjb21wb25lbnRzXG4gICAgICBAW2luZGV4XSA9IHJlc3VsdFxuXG4gICAgQGxlbmd0aCA9IEBjb21wb25lbnRzLmxlbmd0aFxuICAgIGlmIEBjb21wb25lbnRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0Bjb21wb25lbnRzLmxlbmd0aCAtIDFdXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGNvbXBvbmVudCBpbiBAY29tcG9uZW50c1xuICAgICAgY2FsbGJhY2soY29tcG9uZW50KVxuXG4gICAgdGhpc1xuXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICBjb21wb25lbnQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIENvbXBvbmVudENvbnRhaW5lclxuIyAtLS0tLS0tLS0tLS0tLS0tXG4jIEEgQ29tcG9uZW50Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2YgY29tcG9uZW50cy5cbiNcbiMgVGhlIGNvbXBvbmVudENvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyBpdHMgY29tcG9uZW50VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBjb21wb25lbnQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IGNvbXBvbmVudCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIHBhcmVudENvbXBvbmVudDogcGFyZW50IENvbXBvbmVudE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudENvbnRhaW5lclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBwYXJlbnRDb21wb25lbnQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoY29tcG9uZW50KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAcGFyZW50Q29tcG9uZW50XG4gICAgICBhc3NlcnQgY29tcG9uZW50IGlzbnQgQHBhcmVudENvbXBvbmVudCwgJ2Nhbm5vdCBhcHBlbmQgY29tcG9uZW50IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5wcmV2aW91cyA9PSBpbnNlcnRlZENvbXBvbmVudFxuICAgIGFzc2VydCBjb21wb25lbnQgaXNudCBpbnNlcnRlZENvbXBvbmVudCwgJ2Nhbm5vdCBpbnNlcnQgY29tcG9uZW50IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogY29tcG9uZW50LnByZXZpb3VzXG4gICAgICBuZXh0OiBjb21wb25lbnRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5uZXh0ID09IGluc2VydGVkQ29tcG9uZW50XG4gICAgYXNzZXJ0IGNvbXBvbmVudCBpc250IGluc2VydGVkQ29tcG9uZW50LCAnY2Fubm90IGluc2VydCBjb21wb25lbnQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IGNvbXBvbmVudFxuICAgICAgbmV4dDogY29tcG9uZW50Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICB1cDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBAaW5zZXJ0QmVmb3JlKGNvbXBvbmVudC5wcmV2aW91cywgY29tcG9uZW50KVxuXG5cbiAgZG93bjogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihjb21wb25lbnQubmV4dCwgY29tcG9uZW50KVxuXG5cbiAgZ2V0Q29tcG9uZW50VHJlZTogLT5cbiAgICBAY29tcG9uZW50VHJlZSB8fCBAcGFyZW50Q29tcG9uZW50Py5jb21wb25lbnRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnQgPSBAZmlyc3RcbiAgICB3aGlsZSAoY29tcG9uZW50KVxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzIGFuZCBjb250YWluZXJzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudClcbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoY29tcG9uZW50KSAtPlxuICAgIGNvbXBvbmVudC5kZXN0cm95KClcbiAgICBAX2RldGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBjb21wb25lbnQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoQ29tcG9uZW50OiAoY29tcG9uZW50LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoY29tcG9uZW50LCBwb3NpdGlvbilcblxuICAgIGlmIGNvbXBvbmVudFRyZWUgPSBAZ2V0Q29tcG9uZW50VHJlZSgpXG4gICAgICBjb21wb25lbnRUcmVlLmF0dGFjaGluZ0NvbXBvbmVudChjb21wb25lbnQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IGNvbXBvbmVudCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBDb21wb25lbnRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIGNvbXBvbmVudFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaENvbXBvbmVudCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBDb21wb25lbnRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgY29tcG9uZW50VHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaENvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoY29tcG9uZW50KVxuXG4gICAgaWYgY29tcG9uZW50VHJlZSA9IEBnZXRDb21wb25lbnRUcmVlKClcbiAgICAgIGNvbXBvbmVudFRyZWUuZGV0YWNoaW5nQ29tcG9uZW50KGNvbXBvbmVudCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChjb21wb25lbnQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoY29tcG9uZW50KSBpZiBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0Q29tcG9uZW50UG9zaXRpb24oY29tcG9uZW50LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKGNvbXBvbmVudCkgLT5cbiAgICBjb250YWluZXIgPSBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50Lm5leHQgdW5sZXNzIGNvbXBvbmVudC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gY29tcG9uZW50LnByZXZpb3VzIHVubGVzcyBjb21wb25lbnQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIGNvbXBvbmVudC5uZXh0Py5wcmV2aW91cyA9IGNvbXBvbmVudC5wcmV2aW91c1xuICAgICAgY29tcG9uZW50LnByZXZpb3VzPy5uZXh0ID0gY29tcG9uZW50Lm5leHRcblxuICAgICAgQHNldENvbXBvbmVudFBvc2l0aW9uKGNvbXBvbmVudCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRDb21wb25lbnRQb3NpdGlvbjogKGNvbXBvbmVudCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgY29tcG9uZW50LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIGNvbXBvbmVudC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgY29tcG9uZW50Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBjb21wb25lbnQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBjb21wb25lbnQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50IHVubGVzcyBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IGNvbXBvbmVudCB1bmxlc3MgY29tcG9uZW50Lm5leHQ/XG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcblxuRWRpdGFibGVEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2VkaXRhYmxlX2RpcmVjdGl2ZScpXG5JbWFnZURpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vaW1hZ2VfZGlyZWN0aXZlJylcbkh0bWxEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2h0bWxfZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gIGNyZWF0ZTogKHsgY29tcG9uZW50LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIERpcmVjdGl2ZSA9IEBnZXREaXJlY3RpdmVDb25zdHJ1Y3Rvcih0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlKVxuICAgIG5ldyBEaXJlY3RpdmUoeyBjb21wb25lbnQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pXG5cblxuICBnZXREaXJlY3RpdmVDb25zdHJ1Y3RvcjogKGRpcmVjdGl2ZVR5cGUpIC0+XG4gICAgc3dpdGNoIGRpcmVjdGl2ZVR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICBFZGl0YWJsZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaW1hZ2UnXG4gICAgICAgIEltYWdlRGlyZWN0aXZlXG4gICAgICB3aGVuICdodG1sJ1xuICAgICAgICBIdG1sRGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIGFzc2VydCBmYWxzZSwgXCJVbnN1cHBvcnRlZCBjb21wb25lbnQgZGlyZWN0aXZlOiAjeyBkaXJlY3RpdmVUeXBlIH1cIlxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkNvbXBvbmVudENvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kaXJlY3RpdmVGYWN0b3J5ID0gcmVxdWlyZSgnLi9jb21wb25lbnRfZGlyZWN0aXZlX2ZhY3RvcnknKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcblxuIyBDb21wb25lbnRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBDb21wb25lbnRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBjb21wb25lbnRWaWV3XG4jIGZyb20gYSBjb21wb25lbnRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIENvbXBvbmVudFRyZWUuXG4jIEV2ZXJ5IENvbXBvbmVudE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChDb21wb25lbnRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgY29tcG9uZW50cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKENvbXBvbmVudENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIENvbXBvbmVudE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgQ29tcG9uZW50Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgY29tcG9uZW50IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAZGF0YVZhbHVlcyA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAY29tcG9uZW50TmFtZSA9IEB0ZW1wbGF0ZS5uYW1lXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBDb21wb25lbnRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgQGNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBDb21wb25lbnRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY3JlYXRlQ29tcG9uZW50RGlyZWN0aXZlKGRpcmVjdGl2ZSlcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gQ29tcG9uZW50TW9kZWxcIlxuXG5cbiAgIyBDcmVhdGUgYSBkaXJlY3RpdmUgZm9yICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJyB0ZW1wbGF0ZSBkaXJlY3RpdmVzXG4gIGNyZWF0ZUNvbXBvbmVudERpcmVjdGl2ZTogKHRlbXBsYXRlRGlyZWN0aXZlKSAtPlxuICAgIEBkaXJlY3RpdmVzLmFkZCBkaXJlY3RpdmVGYWN0b3J5LmNyZWF0ZVxuICAgICAgY29tcG9uZW50OiB0aGlzXG4gICAgICB0ZW1wbGF0ZURpcmVjdGl2ZTogdGVtcGxhdGVEaXJlY3RpdmVcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICAjIENvbXBvbmVudFRyZWUgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgY29tcG9uZW50TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIGNvbXBvbmVudE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBjb21wb25lbnQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBpZiBjb21wb25lbnRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBjb21wb25lbnRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChjb21wb25lbnRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgY29tcG9uZW50TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKGNvbXBvbmVudE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIGNvbXBvbmVudCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBjb21wb25lbnQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIGNvbXBvbmVudCBmcm9tIGl0cyBjb250YWluZXIgYW5kIENvbXBvbmVudFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIENvbXBvbmVudFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIGNvbXBvbmVudFRyZWUgcmVsYXRpdmUgdG8gdGhpcyBjb21wb25lbnQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRDb21wb25lbnRcblxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRNb2RlbClcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjb21wb25lbnRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIGNvbXBvbmVudE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIGNvbXBvbmVudHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChjb21wb25lbnRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKSBpZiBjb21wb25lbnRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IGNvbXBvbmVudE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBjb21wb25lbnRcbiAgc2V0Q29udGVudDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgaWYgQGNvbnRlbnRbbmFtZV1cbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICBpZiBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSAhPSB2YWx1ZVxuICAgICAgICBkaXJlY3RpdmUuc2V0SW1hZ2VVcmwodmFsdWUpXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAY29tcG9uZW50VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgY29tcG9uZW50TW9kZWwuXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBjb21wb25lbnRUcmVlICYmIGNoYW5nZWREYXRhUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICAjIFN0eWxlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0U3R5bGU6IChuYW1lKSAtPlxuICAgIEBzdHlsZXNbbmFtZV1cblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gQ29tcG9uZW50TW9kZWwgI3sgQGNvbXBvbmVudE5hbWUgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIENvbXBvbmVudE1vZGVsICN7IEBjb21wb25lbnROYW1lIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBjb21wb25lbnRUcmVlXG4gICAgICAgICAgQGNvbXBvbmVudFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gICMgQGRlcHJlY2F0ZWRcbiAgIyBHZXR0ZXIgYW5kIFNldHRlciBpbiBvbmUuXG4gIHN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgY29uc29sZS5sb2coXCJDb21wb25lbnRNb2RlbCNzdHlsZSgpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgI2dldFN0eWxlKCkgYW5kICNzZXRTdHlsZSgpLlwiKVxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gICMgQ29tcG9uZW50TW9kZWwgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIkNvbXBvbmVudE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBDb21wb25lbnRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5Db21wb25lbnRNb2RlbCA9IHJlcXVpcmUoJy4vY29tcG9uZW50X21vZGVsJylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBQdWJsaWMgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tXG5cbiAgIyBTZXJpYWxpemUgYSBDb21wb25lbnRNb2RlbFxuICAjXG4gICMgRXh0ZW5kcyB0aGUgcHJvdG90eXBlIG9mIENvbXBvbmVudE1vZGVsXG4gICNcbiAgIyBFeGFtcGxlIFJlc3VsdDpcbiAgIyBpZDogJ2FrazdoanV1ZTInXG4gICMgaWRlbnRpZmllcjogJ3RpbWVsaW5lLnRpdGxlJ1xuICAjIGNvbnRlbnQ6IHsgLi4uIH1cbiAgIyBzdHlsZXM6IHsgLi4uIH1cbiAgIyBkYXRhOiB7IC4uLiB9XG4gICMgY29udGFpbmVyczogeyAuLi4gfVxuICBDb21wb25lbnRNb2RlbDo6dG9Kc29uID0gKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPz0gdGhpc1xuXG4gICAganNvbiA9XG4gICAgICBpZDogY29tcG9uZW50LmlkXG4gICAgICBpZGVudGlmaWVyOiBjb21wb25lbnQudGVtcGxhdGUuaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShjb21wb25lbnQuY29udGVudClcbiAgICAgIGpzb24uY29udGVudCA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoY29tcG9uZW50LmNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KGNvbXBvbmVudC5zdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoY29tcG9uZW50LnN0eWxlcylcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoY29tcG9uZW50LmRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgY29tcG9uZW50LmRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuICBmcm9tSnNvbjogKGpzb24sIGRlc2lnbikgLT5cbiAgICB0ZW1wbGF0ZSA9IGRlc2lnbi5nZXQoanNvbi5jb21wb25lbnQgfHwganNvbi5pZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IHRlbXBsYXRlLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogdW5rbm93biB0ZW1wbGF0ZSBpZGVudGlmaWVyICcjeyBqc29uLmlkZW50aWZpZXIgfSdcIlxuXG4gICAgbW9kZWwgPSBuZXcgQ29tcG9uZW50TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgY29tcG9uZW50ICN7IG1vZGVsLmNvbXBvbmVudE5hbWUgfTogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcblxuICAgICAgIyBUcmFuc2Zvcm0gc3RyaW5nIGludG8gb2JqZWN0OiBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igb2xkIGltYWdlIHZhbHVlcy5cbiAgICAgIGlmIG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLnR5cGUgPT0gJ2ltYWdlJyAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9XG4gICAgICAgICAgdXJsOiB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICAgIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgICBtb2RlbC5zZXRTdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gICAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gICAgZm9yIGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudEFycmF5IG9mIGpzb24uY29udGFpbmVyc1xuICAgICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICAgIGlmIGNvbXBvbmVudEFycmF5XG4gICAgICAgIGFzc2VydCAkLmlzQXJyYXkoY29tcG9uZW50QXJyYXkpLFxuICAgICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgICAgZm9yIGNoaWxkIGluIGNvbXBvbmVudEFycmF5XG4gICAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBAZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gICAgbW9kZWxcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkNvbXBvbmVudENvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2NvbnRhaW5lcicpXG5Db21wb25lbnRBcnJheSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2FycmF5JylcbkNvbXBvbmVudE1vZGVsID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWwnKVxuY29tcG9uZW50TW9kZWxTZXJpYWxpemVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWxfc2VyaWFsaXplcicpXG5cbiMgQ29tcG9uZW50VHJlZVxuIyAtLS0tLS0tLS0tLVxuIyBMaXZpbmdkb2NzIGVxdWl2YWxlbnQgdG8gdGhlIERPTSB0cmVlLlxuIyBBIGNvbXBvbmVudFRyZWUgY29udGFpbmVzIGFsbCB0aGUgY29tcG9uZW50cyBvZiBhIHBhZ2UgaW4gaGllcmFyY2hpY2FsIG9yZGVyLlxuI1xuIyBUaGUgcm9vdCBvZiB0aGUgQ29tcG9uZW50VHJlZSBpcyBhIENvbXBvbmVudENvbnRhaW5lci4gQSBDb21wb25lbnRDb250YWluZXJcbiMgY29udGFpbnMgYSBsaXN0IG9mIGNvbXBvbmVudHMuXG4jXG4jIGNvbXBvbmVudHMgY2FuIGhhdmUgbXVsdGlibGUgQ29tcG9uZW50Q29udGFpbmVycyB0aGVtc2VsdmVzLlxuI1xuIyAjIyMgRXhhbXBsZTpcbiMgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyIChyb290KVxuIyAgICAgICAtIENvbXBvbmVudCAnSGVybydcbiMgICAgICAgLSBDb21wb25lbnQgJzIgQ29sdW1ucydcbiMgICAgICAgICAtIENvbXBvbmVudENvbnRhaW5lciAnbWFpbidcbiMgICAgICAgICAgIC0gQ29tcG9uZW50ICdUaXRsZSdcbiMgICAgICAgICAtIENvbXBvbmVudENvbnRhaW5lciAnc2lkZWJhcidcbiMgICAgICAgICAgIC0gQ29tcG9uZW50ICdJbmZvLUJveCcnXG4jXG4jICMjIyBFdmVudHM6XG4jIFRoZSBmaXJzdCBzZXQgb2YgQ29tcG9uZW50VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3ZpbmcgY29tcG9uZW50cy5cbiNcbiMgQ29uc2lkZXI6IEhhdmUgYSBkb2N1bWVudEZyYWdtZW50IGFzIHRoZSByb290Tm9kZSBpZiBubyByb290Tm9kZSBpcyBnaXZlblxuIyBtYXliZSB0aGlzIHdvdWxkIGhlbHAgc2ltcGxpZnkgc29tZSBjb2RlIChzaW5jZSBjb21wb25lbnRzIGFyZSBhbHdheXNcbiMgYXR0YWNoZWQgdG8gdGhlIERPTSkuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBDb21wb25lbnRUcmVlOiBkZXNpZ24gcGFyYW0gaXMgbWlzc3NpbmcuXCJcbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgY29tcG9uZW50VHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgY29tcG9uZW50IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBjb21wb25lbnRNb2RlbCBpbnN0YW5jZSBvciBjb21wb25lbnQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5wcmVwZW5kKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IGNvbXBvbmVudCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogY29tcG9uZW50TW9kZWwgaW5zdGFuY2Ugb3IgY29tcG9uZW50IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5hcHBlbmQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0Q29tcG9uZW50OiAoY29tcG9uZW50TmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgY29tcG9uZW50TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZUNvbXBvbmVudChjb21wb25lbnROYW1lKVxuICAgIGVsc2VcbiAgICAgIGNvbXBvbmVudE5hbWVcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoY29tcG9uZW50TmFtZSlcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBnZXRUZW1wbGF0ZTogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChjb21wb25lbnROYW1lKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBjb21wb25lbnROYW1lIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIGNvbXBvbmVudFRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3QgY29tcG9uZW50XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBjb21wb25lbnRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnROYW1lID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKGNvbXBvbmVudClcblxuICAgICAgbmV3IENvbXBvbmVudEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgQ29tcG9uZW50QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcblxuICAgIG9sZFJvb3QgPSBAcm9vdFxuICAgIEByb290ID0gbmV3IENvbXBvbmVudENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKGNvbXBvbmVudCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goY29tcG9uZW50KVxuICAjICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAjICAgICBjb21wb25lbnQgPSBjb21wb25lbnRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoY29tcG9uZW50KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoY29tcG9uZW50LCBwYXJlbnRzKVxuICAjICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdDb21wb25lbnRUcmVlXFxuLS0tLS0tLS0tLS1cXG4nXG5cbiAgICBhZGRMaW5lID0gKHRleHQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIG91dHB1dCArPSBcIiN7IEFycmF5KGluZGVudGF0aW9uICsgMSkuam9pbihcIiBcIikgfSN7IHRleHQgfVxcblwiXG5cbiAgICB3YWxrZXIgPSAoY29tcG9uZW50LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IGNvbXBvbmVudC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUubGFiZWwgfSAoI3sgdGVtcGxhdGUubmFtZSB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihjb21wb25lbnRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihjb21wb25lbnQubmV4dCwgaW5kZW50YXRpb24pIGlmIGNvbXBvbmVudC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIGNvbXBvbmVudHNcbiAgIyBUaGVzZSBmdW5jdGlvbnMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IGNvbXBvbmVudENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdDb21wb25lbnQ6IChjb21wb25lbnQsIGF0dGFjaENvbXBvbmVudEZ1bmMpIC0+XG4gICAgaWYgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPT0gdGhpc1xuICAgICAgIyBtb3ZlIGNvbXBvbmVudFxuICAgICAgYXR0YWNoQ29tcG9uZW50RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRNb3ZlZCcsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBpZiBjb21wb25lbnQuY29tcG9uZW50VHJlZT9cbiAgICAgICAgY29tcG9uZW50LnJlbW92ZSgpICMgcmVtb3ZlIGZyb20gb3RoZXIgY29tcG9uZW50VHJlZVxuXG4gICAgICBjb21wb25lbnQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LmNvbXBvbmVudFRyZWUgPSB0aGlzXG5cbiAgICAgIGF0dGFjaENvbXBvbmVudEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnY29tcG9uZW50QWRkZWQnLCBjb21wb25lbnQpXG5cblxuICBmaXJlRXZlbnQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICB0aGlzW2V2ZW50XS5maXJlLmFwcGx5KGV2ZW50LCBhcmdzKVxuICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG5cbiAgZGV0YWNoaW5nQ29tcG9uZW50OiAoY29tcG9uZW50LCBkZXRhY2hDb21wb25lbnRGdW5jKSAtPlxuICAgIGFzc2VydCBjb21wb25lbnQuY29tcG9uZW50VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgY29tcG9uZW50IGZyb20gYW5vdGhlciBDb21wb25lbnRUcmVlJ1xuXG4gICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hDb21wb25lbnRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRSZW1vdmVkJywgY29tcG9uZW50KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudENvbnRlbnRDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEh0bWxDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgZGF0YUNoYW5naW5nOiAoY29tcG9uZW50LCBjaGFuZ2VkUHJvcGVydGllcykgLT5cbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnREYXRhQ2hhbmdlZCcsIGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgcHJpbnRKc29uOiAtPlxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihAdG9Kc29uKCkpXG5cblxuICAjIFJldHVybnMgYSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gICMgdGhhdCBjYW4gYmUgc2VudCB0byB0aGUgc2VydmVyIGFzIEpTT04uXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkYXRhID0ge31cbiAgICBkYXRhWydjb250ZW50J10gPSBbXVxuICAgIGRhdGFbJ2Rlc2lnbiddID0geyBuYW1lOiBAZGVzaWduLm5hbWUgfVxuXG4gICAgY29tcG9uZW50VG9EYXRhID0gKGNvbXBvbmVudCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgY29tcG9uZW50RGF0YSA9IGNvbXBvbmVudC50b0pzb24oKVxuICAgICAgY29udGFpbmVyQXJyYXkucHVzaCBjb21wb25lbnREYXRhXG4gICAgICBjb21wb25lbnREYXRhXG5cbiAgICB3YWxrZXIgPSAoY29tcG9uZW50LCBsZXZlbCwgZGF0YU9iaikgLT5cbiAgICAgIGNvbXBvbmVudERhdGEgPSBjb21wb25lbnRUb0RhdGEoY29tcG9uZW50LCBsZXZlbCwgZGF0YU9iailcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IGNvbXBvbmVudERhdGEuY29udGFpbmVyc1tjb21wb25lbnRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoY29tcG9uZW50Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBjb21wb25lbnRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKGNvbXBvbmVudC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgY29tcG9uZW50Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgIyBJbml0aWFsaXplIGEgY29tcG9uZW50VHJlZVxuICAjIFRoaXMgbWV0aG9kIHN1cHByZXNzZXMgY2hhbmdlIGV2ZW50cyBpbiB0aGUgY29tcG9uZW50VHJlZS5cbiAgI1xuICAjIENvbnNpZGVyIHRvIGNoYW5nZSBwYXJhbXM6XG4gICMgZnJvbURhdGEoeyBjb250ZW50LCBkZXNpZ24sIHNpbGVudCB9KSAjIHNpbGVudCBbYm9vbGVhbl06IHN1cHByZXNzIGNoYW5nZSBldmVudHNcbiAgZnJvbURhdGE6IChkYXRhLCBkZXNpZ24sIHNpbGVudD10cnVlKSAtPlxuICAgIGlmIGRlc2lnbj9cbiAgICAgIGFzc2VydCBub3QgQGRlc2lnbj8gfHwgZGVzaWduLmVxdWFscyhAZGVzaWduKSwgJ0Vycm9yIGxvYWRpbmcgZGF0YS4gU3BlY2lmaWVkIGRlc2lnbiBpcyBkaWZmZXJlbnQgZnJvbSBjdXJyZW50IGNvbXBvbmVudFRyZWUgZGVzaWduJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ25cblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3QuY29tcG9uZW50VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgaWYgZGF0YS5jb250ZW50XG4gICAgICBmb3IgY29tcG9uZW50RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50TW9kZWxTZXJpYWxpemVyLmZyb21Kc29uKGNvbXBvbmVudERhdGEsIGRlc2lnbilcbiAgICAgICAgQHJvb3QuYXBwZW5kKGNvbXBvbmVudClcblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3QuY29tcG9uZW50VHJlZSA9IHRoaXNcbiAgICAgIEByb290LmVhY2ggKGNvbXBvbmVudCkgPT5cbiAgICAgICAgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPSB0aGlzXG5cblxuICAjIEFwcGVuZCBkYXRhIHRvIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIEZpcmVzIGNvbXBvbmVudEFkZGVkIGV2ZW50IGZvciBldmVyeSBjb21wb25lbnRcbiAgYWRkRGF0YTogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAZnJvbURhdGEoZGF0YSwgZGVzaWduLCBmYWxzZSlcblxuXG4gIGFkZERhdGFXaXRoQW5pbWF0aW9uOiAoZGF0YSwgZGVsYXk9MjAwKSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgJ0Vycm9yIGFkZGluZyBkYXRhLiBDb21wb25lbnRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBjb21wb25lbnREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IGNvbXBvbmVudERhdGFcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb250ZW50LCBAZGVzaWduKVxuICAgICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG4gICAgICAgICwgdGltZW91dFxuXG4gICAgICB0aW1lb3V0ICs9IE51bWJlcihkZWxheSlcblxuXG4gIHRvRGF0YTogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gICMgQWxpYXNlc1xuICAjIC0tLS0tLS1cblxuICBmcm9tSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQGZyb21EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB0b0pzb246IChhcmdzLi4uKSAtPlxuICAgIEB0b0RhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZURpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNFZGl0YWJsZTogdHJ1ZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIdG1sRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0h0bWw6IHRydWVcblxuXG4gIGdldENvbnRlbnQ6IC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4uL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAY29tcG9uZW50LmNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKEBjb21wb25lbnQsIEBuYW1lKSBpZiBAY29tcG9uZW50LmNvbXBvbmVudFRyZWVcblxuXG4gIHNldEltYWdlVXJsOiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0udXJsID0gdmFsdWVcblxuICAgIEByZXNldENyb3AoKVxuICAgIEBiYXNlNjRJbWFnZSA9IHVuZGVmaW5lZFxuICAgIEBwcm9jZXNzSW1hZ2VVcmwodmFsdWUpXG5cblxuICBnZXRJbWFnZVVybDogLT5cbiAgICBpbWFnZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBpZiBpbWFnZVxuICAgICAgaW1hZ2UudXJsXG4gICAgZWxzZVxuICAgICAgdW5kZWZpbmVkXG5cblxuICBnZXRJbWFnZU9iamVjdDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdLm9yaWdpbmFsVXJsIHx8IEBnZXRJbWFnZVVybCgpXG5cblxuICBzZXRDcm9wOiAoeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBuYW1lIH0pIC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG4gICAgaWYgY3VycmVudFZhbHVlPy51cmw/XG4gICAgICBjdXJyZW50VmFsdWUuY3JvcCA9XG4gICAgICAgIHg6IHhcbiAgICAgICAgeTogeVxuICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgbmFtZTogbmFtZVxuXG4gICAgICBAcHJvY2Vzc0ltYWdlVXJsKGN1cnJlbnRWYWx1ZS5vcmlnaW5hbFVybCB8fCBjdXJyZW50VmFsdWUudXJsKVxuICAgICAgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyhAY29tcG9uZW50LCBAbmFtZSkgaWYgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlXG5cblxuICByZXNldENyb3A6IC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGN1cnJlbnRWYWx1ZT9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID0gbnVsbFxuXG5cbiAgc2V0SW1hZ2VTZXJ2aWNlOiAoaW1hZ2VTZXJ2aWNlTmFtZSkgLT5cbiAgICBhc3NlcnQgaW1hZ2VTZXJ2aWNlLmhhcyhpbWFnZVNlcnZpY2VOYW1lKSwgXCJFcnJvcjogY291bGQgbm90IGxvYWQgaW1hZ2Ugc2VydmljZSAjeyBpbWFnZVNlcnZpY2VOYW1lIH1cIlxuXG4gICAgaW1hZ2VVcmwgPSBAZ2V0SW1hZ2VVcmwoKVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0gPVxuICAgICAgdXJsOiBpbWFnZVVybFxuICAgICAgaW1hZ2VTZXJ2aWNlOiBpbWFnZVNlcnZpY2VOYW1lIHx8IG51bGxcblxuXG4gIGdldEltYWdlU2VydmljZU5hbWU6IC0+XG4gICAgQGdldEltYWdlU2VydmljZSgpLm5hbWVcblxuXG4gIGhhc0RlZmF1bHRJbWFnZVNlcnZpY2U6IC0+XG4gICAgQGdldEltYWdlU2VydmljZU5hbWUoKSA9PSAnZGVmYXVsdCdcblxuXG4gIGdldEltYWdlU2VydmljZTogLT5cbiAgICBzZXJ2aWNlTmFtZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV0/LmltYWdlU2VydmljZVxuICAgIGltYWdlU2VydmljZS5nZXQoc2VydmljZU5hbWUgfHwgdW5kZWZpbmVkKVxuXG5cbiAgcHJvY2Vzc0ltYWdlVXJsOiAodXJsKSAtPlxuICAgIGlmIG5vdCBAaGFzRGVmYXVsdEltYWdlU2VydmljZSgpXG4gICAgICBpbWdTZXJ2aWNlID0gQGdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWdPYmogPSBAZ2V0SW1hZ2VPYmplY3QoKVxuICAgICAgaW1nT2JqLnVybCA9IGltZ1NlcnZpY2UuZ2V0VXJsKHVybCwgY3JvcDogaW1nT2JqLmNyb3ApXG4gICAgICBpbWdPYmoub3JpZ2luYWxVcmwgPSB1cmxcblxuIiwiIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvbiB3aXRoIHNob3J0aGFuZHMgYW5kIGNvbXB1dGVkIHZhbHVlcy5cbiNcbiMgY29uZmlnLmRvY0RpcmVjdGl2ZVxuIyAgIFdpbGwgcHJlZml4IHRoZSBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXhcbiMgICBlLmcuIGNvbmZpZy5kb2NEaXJlY3RpdmUuZWRpdGFibGUgPT0gJ2RhdGEtZG9jLWVkaXRhYmxlJ1xuI1xuIyBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwXG4jICAgQSBsb29rdXAgb2JqZWN0IGZvciBlYXNpZXIgbG9va3VwcyBvZiB0aGUgZGlyZWN0aXZlIG5hbWUgYnkgdGVtcGxhdGUgYXR0cmlidXRlLlxuIyAgIGUuZy4gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFsnZG9jLWVkaXRhYmxlJ10gPT0gJ2VkaXRhYmxlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChjb25maWcpIC0+XG5cbiAgIyBTaG9ydGhhbmRzIGZvciBzdHVmZiB0aGF0IGlzIHVzZWQgYWxsIG92ZXIgdGhlIHBsYWNlIHRvIG1ha2VcbiAgIyBjb2RlIGFuZCBzcGVjcyBtb3JlIHJlYWRhYmxlLlxuICBjb25maWcuZG9jRGlyZWN0aXZlID0ge31cbiAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cCA9IHt9XG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG5cbiAgICAjIENyZWF0ZSB0aGUgcmVuZGVyZWRBdHRycyBmb3IgdGhlIGRpcmVjdGl2ZXNcbiAgICAjIChwcmVwZW5kIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggdGhlIGNvbmZpZ3VyZWQgcHJlZml4KVxuICAgIHByZWZpeCA9IGlmIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggdGhlbiBcIiN7IGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggfS1cIiBlbHNlICcnXG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfSN7IHZhbHVlLmF0dHIgfVwiXG5cbiAgICBjb25maWcuZG9jRGlyZWN0aXZlW25hbWVdID0gdmFsdWUucmVuZGVyZWRBdHRyXG4gICAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFt2YWx1ZS5hdHRyXSA9IG5hbWVcblxuIiwiYXVnbWVudENvbmZpZyA9IHJlcXVpcmUoJy4vYXVnbWVudF9jb25maWcnKVxuXG4jIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBjb25maWcgPSBkbyAtPlxuXG4gICMgTG9hZCBjc3MgYW5kIGpzIHJlc291cmNlcyBpbiBwYWdlcyBhbmQgaW50ZXJhY3RpdmUgcGFnZXNcbiAgbG9hZFJlc291cmNlczogdHJ1ZVxuXG4gICMgQ1NTIHNlbGVjdG9yIGZvciBlbGVtZW50cyAoYW5kIHRoZWlyIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBpZ25vcmVkXG4gICMgd2hlbiBmb2N1c3Npbmcgb3IgYmx1cnJpbmcgYSBjb21wb25lbnRcbiAgaWdub3JlSW50ZXJhY3Rpb246ICcubGQtY29udHJvbCdcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEVkaXRhYmxlIGNvbmZpZ3VyYXRpb25cbiAgZWRpdGFibGU6XG4gICAgYWxsb3dOZXdsaW5lOiB0cnVlICMgQWxsb3cgdG8gaW5zZXJ0IG5ld2xpbmVzIHdpdGggU2hpZnQrRW50ZXJcbiAgICBjaGFuZ2VEZWxheTogMCAjIERlbGF5IGZvciB1cGRhdGluZyB0aGUgY29tcG9uZW50IG1vZGVscyBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgdXNlciBjaGFuZ2VzLiAwIEZvciBpbW1lZGlhdGUgdXBkYXRlcy4gZmFsc2UgdG8gZGlzYWJsZS5cbiAgICBicm93c2VyU3BlbGxjaGVjazogZmFsc2UgIyBTZXQgdGhlIHNwZWxsY2hlY2sgYXR0cmlidXRlIG9uIGNvbnRlbnRlZGl0YWJsZXMgdG8gJ3RydWUnIG9yICdmYWxzZSdcbiAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBmYWxzZSAjIFdoZXRoZXIgdG8gZmlyZSBjdXJzb3IgYW5kIHNlbGN0aW9uIGNoYW5nZXMgb24gbW91c2Vtb3ZlXG5cblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIGNvbXBvbmVudCBjbGFzc2VzXG4gICAgY29tcG9uZW50OiAnZG9jLWNvbXBvbmVudCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIGNvbXBvbmVudEhpZ2hsaWdodDogJ2RvYy1jb21wb25lbnQtaGlnaGxpZ2h0J1xuICAgIGNvbnRhaW5lckhpZ2hsaWdodDogJ2RvYy1jb250YWluZXItaGlnaGxpZ2h0J1xuXG4gICAgIyBkcmFnICYgZHJvcFxuICAgIGRyYWdnZWQ6ICdkb2MtZHJhZ2dlZCdcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXI6ICdkb2MtZHJhZ2dlZC1wbGFjZWhvbGRlcidcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyOiAnZG9jLWRyYWctY291bnRlcidcbiAgICBkcmFnQmxvY2tlcjogJ2RvYy1kcmFnLWJsb2NrZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG5hdWdtZW50Q29uZmlnKGNvbmZpZylcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEFzc2V0c1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAZGVzaWduIH0pIC0+XG5cblxuICBsb2FkQ3NzOiAoY3NzTG9hZGVyLCBjYikgLT5cbiAgICByZXR1cm4gY2IoKSB1bmxlc3MgQGNzcz9cbiAgICBjc3NVcmxzID0gQGNvbnZlcnRUb0Fic29sdXRlUGF0aHMoQGNzcylcbiAgICBjc3NMb2FkZXIubG9hZChjc3NVcmxzLCBjYilcblxuXG4gIGdldEFzc2V0UGF0aDogLT5cbiAgICBcIiN7IGNvbmZpZy5kZXNpZ25QYXRoIH0vI3sgQGRlc2lnbi5uYW1lIH1cIlxuXG5cbiAgY29udmVydFRvQWJzb2x1dGVQYXRoczogKHVybHMpIC0+XG4gICAgJC5tYXAgdXJscywgKHBhdGgpID0+XG4gICAgICAjIFVSTHMgYXJlIGFic29sdXRlIHdoZW4gdGhleSBjb250YWluIHR3byBgLy9gIG9yIGJlZ2luIHdpdGggYSBgL2BcbiAgICAgIHJldHVybiBwYXRoIGlmIC9cXC9cXC8vLnRlc3QocGF0aCkgfHwgL15cXC8vLnRlc3QocGF0aClcblxuICAgICAgIyBOb3JtYWxpemUgcGF0aHMgdGhhdCBiZWdpbiB3aXRoIGEgYC4vXG4gICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eW1xcLlxcL10qLywgJycpXG4gICAgICBcIiN7IEBnZXRBc3NldFBhdGgoKSB9LyN7IHBhdGggfVwiXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSBvZiBTdHJpbmdzIH1cbiAgYWRkQ3NzOiAoY3NzVXJscykgLT5cbiAgICBAYWRkKCdjc3MnLCBjc3NVcmxzKVxuXG5cbiAgIyBAcGFyYW0geyBTdHJpbmcgb3IgQXJyYXkgb2YgU3RyaW5ncyB9XG4gIGFkZEpzOiAoanNVcmxzKSAtPlxuICAgIEBhZGQoJ2pzJywganNVcmxzKVxuXG5cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBhc3NldCB0eXBlOiAnanMnIG9yICdjc3MnXG4gICMgQHBhcmFtIHsgU3RyaW5nIG9yIEFycmF5IG9mIFN0cmluZ3MgfVxuICBhZGQ6ICh0eXBlLCB1cmxzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgdXJscz9cblxuICAgIHRoaXNbdHlwZV0gPz0gW11cbiAgICBpZiAkLnR5cGUodXJscykgPT0gJ3N0cmluZydcbiAgICAgIHRoaXNbdHlwZV0ucHVzaCh1cmxzKVxuICAgIGVsc2VcbiAgICAgIGZvciB1cmwgaW4gdXJsc1xuICAgICAgICB0aGlzW3R5cGVdLnB1c2godXJsKVxuXG5cbiAgaGFzQ3NzOiAtPlxuICAgIEBjc3M/XG5cblxuICBoYXNKczogLT5cbiAgICBAanM/XG5cblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgbGFiZWwsIEB0eXBlLCB2YWx1ZSwgb3B0aW9ucyB9KSAtPlxuICAgIEBsYWJlbCA9IGxhYmVsIHx8IHdvcmRzLmh1bWFuaXplKCBAbmFtZSApXG5cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ29wdGlvbidcbiAgICAgICAgYXNzZXJ0IHZhbHVlLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICd2YWx1ZScgcHJvdmlkZWRcIlxuICAgICAgICBAdmFsdWUgPSB2YWx1ZVxuICAgICAgd2hlbiAnc2VsZWN0J1xuICAgICAgICBhc3NlcnQgb3B0aW9ucywgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiBubyAnb3B0aW9ucycgcHJvdmlkZWRcIlxuICAgICAgICBAb3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgbG9nLmVycm9yIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogdW5rbm93biB0eXBlICcjeyBAdHlwZSB9J1wiXG5cblxuICAjIEdldCBpbnN0cnVjdGlvbnMgd2hpY2ggY3NzIGNsYXNzZXMgdG8gYWRkIGFuZCByZW1vdmUuXG4gICMgV2UgZG8gbm90IGNvbnRyb2wgdGhlIGNsYXNzIGF0dHJpYnV0ZSBvZiBhIGNvbXBvbmVudCBET00gZWxlbWVudFxuICAjIHNpbmNlIHRoZSBVSSBvciBvdGhlciBzY3JpcHRzIGNhbiBtZXNzIHdpdGggaXQgYW55IHRpbWUuIFNvIHRoZVxuICAjIGluc3RydWN0aW9ucyBhcmUgZGVzaWduZWQgbm90IHRvIGludGVyZmVyZSB3aXRoIG90aGVyIGNzcyBjbGFzc2VzXG4gICMgcHJlc2VudCBpbiBhbiBlbGVtZW50cyBjbGFzcyBhdHRyaWJ1dGUuXG4gIGNzc0NsYXNzQ2hhbmdlczogKHZhbHVlKSAtPlxuICAgIGlmIEB2YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBpZiBub3QgdmFsdWUgdGhlbiBbQHZhbHVlXSBlbHNlIHVuZGVmaW5lZFxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh2YWx1ZSlcbiAgICAgICAgYWRkOiB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICAgIHJlbW92ZTogY3VycmVudFZhbHVlXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG4gICAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICAgIHJlbW92ZTogQG90aGVyQ2xhc3Nlcyh1bmRlZmluZWQpXG4gICAgICAgIGFkZDogdW5kZWZpbmVkXG5cblxuICB2YWxpZGF0ZVZhbHVlOiAodmFsdWUpIC0+XG4gICAgaWYgbm90IHZhbHVlXG4gICAgICB0cnVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgdmFsdWUgPT0gQHZhbHVlXG4gICAgZWxzZSBpZiBAdHlwZSBpcyAnc2VsZWN0J1xuICAgICAgQGNvbnRhaW5zT3B0aW9uKHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIGxvZy53YXJuIFwiTm90IGltcGxlbWVudGVkOiBDc3NNb2RpZmljYXRvclByb3BlcnR5I3ZhbGlkYXRlVmFsdWUoKSBmb3IgdHlwZSAjeyBAdHlwZSB9XCJcblxuXG4gIGNvbnRhaW5zT3B0aW9uOiAodmFsdWUpIC0+XG4gICAgZm9yIG9wdGlvbiBpbiBAb3B0aW9uc1xuICAgICAgcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgb3B0aW9uLnZhbHVlXG5cbiAgICBmYWxzZVxuXG5cbiAgb3RoZXJPcHRpb25zOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24gaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuXG5cbiAgb3RoZXJDbGFzc2VzOiAodmFsdWUpIC0+XG4gICAgb3RoZXJzID0gW11cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICBvdGhlcnMucHVzaCBvcHRpb24udmFsdWUgaWYgb3B0aW9uLnZhbHVlIGlzbnQgdmFsdWVcblxuICAgIG90aGVyc1xuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuT3JkZXJlZEhhc2ggPSByZXF1aXJlKCcuLi9tb2R1bGVzL29yZGVyZWRfaGFzaCcpXG5Bc3NldHMgPSByZXF1aXJlKCcuL2Fzc2V0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGVzaWduXG5cbiAgIyBAcGFyYW1cbiAgIyAgLSBuYW1lIHsgU3RyaW5nIH0gVGhlIG5hbWUgb2YgdGhlIGRlc2lnbi5cbiAgIyAgLSB2ZXJzaW9uIHsgU3RyaW5nIH0gZS5nLiAnMS4wLjAnXG4gICMgIC0gYXV0aG9yIHsgU3RyaW5nIH1cbiAgIyAgLSBkZXNjcmlwdGlvbiB7IFN0cmluZyB9XG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgQHZlcnNpb24sIEBhdXRob3IsIEBkZXNjcmlwdGlvbiB9KSAtPlxuICAgIGFzc2VydCBAbmFtZT8sICdEZXNpZ24gbmVlZHMgYSBuYW1lJ1xuICAgIEBpZGVudGlmaWVyID0gRGVzaWduLmdldElkZW50aWZpZXIoQG5hbWUsIEB2ZXJzaW9uKVxuXG4gICAgIyB0ZW1wbGF0ZXMgaW4gYSBzdHJ1Y3R1cmVkIGZvcm1hdFxuICAgIEBncm91cHMgPSBbXVxuXG4gICAgIyB0ZW1wbGF0ZXMgYnkgaWQgYW5kIHNvcnRlZFxuICAgIEBjb21wb25lbnRzID0gbmV3IE9yZGVyZWRIYXNoKClcbiAgICBAaW1hZ2VSYXRpb3MgPSB7fVxuXG4gICAgIyBhc3NldHMgcmVxdWlyZWQgYnkgdGhlIGRlc2lnblxuICAgIEBhc3NldHMgPSBuZXcgQXNzZXRzKGRlc2lnbjogdGhpcylcblxuICAgICMgZGVmYXVsdCBjb21wb25lbnRzXG4gICAgQGRlZmF1bHRQYXJhZ3JhcGggPSB1bmRlZmluZWRcbiAgICBAZGVmYXVsdEltYWdlID0gdW5kZWZpbmVkXG5cblxuICBlcXVhbHM6IChkZXNpZ24pIC0+XG4gICAgZGVzaWduLm5hbWUgPT0gQG5hbWUgJiYgZGVzaWduLnZlcnNpb24gPT0gQHZlcnNpb25cblxuXG4gICMgU2ltcGxlIGltcGxlbWVudGF0aW9uIHdpdGggc3RyaW5nIGNvbXBhcmlzb25cbiAgIyBDYXV0aW9uOiB3b24ndCB3b3JrIGZvciAnMS4xMC4wJyA+ICcxLjkuMCdcbiAgaXNOZXdlclRoYW46IChkZXNpZ24pIC0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIGRlc2lnbj9cbiAgICBAdmVyc2lvbiA+IChkZXNpZ24udmVyc2lvbiB8fCAnJylcblxuXG4gIGdldDogKGlkZW50aWZpZXIpIC0+XG4gICAgY29tcG9uZW50TmFtZSA9IEBnZXRDb21wb25lbnROYW1lRnJvbUlkZW50aWZpZXIoaWRlbnRpZmllcilcbiAgICBAY29tcG9uZW50cy5nZXQoY29tcG9uZW50TmFtZSlcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAY29tcG9uZW50cy5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgYWRkOiAodGVtcGxhdGUpIC0+XG4gICAgdGVtcGxhdGUuc2V0RGVzaWduKHRoaXMpXG4gICAgQGNvbXBvbmVudHMucHVzaCh0ZW1wbGF0ZS5uYW1lLCB0ZW1wbGF0ZSlcblxuXG4gIGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcjogKGlkZW50aWZpZXIpIC0+XG4gICAgeyBuYW1lIH0gPSBUZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIoaWRlbnRpZmllcilcbiAgICBuYW1lXG5cblxuICBAZ2V0SWRlbnRpZmllcjogKG5hbWUsIHZlcnNpb24pIC0+XG4gICAgaWYgdmVyc2lvblxuICAgICAgXCIjeyBuYW1lIH1AI3sgdmVyc2lvbiB9XCJcbiAgICBlbHNlXG4gICAgICBcIiN7IG5hbWUgfVwiXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkRlc2lnbiA9IHJlcXVpcmUoJy4vZGVzaWduJylcbmRlc2lnblBhcnNlciA9IHJlcXVpcmUoJy4vZGVzaWduX3BhcnNlcicpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGRlc2lnbnM6IHt9XG5cbiAgIyBDYW4gbG9hZCBhIGRlc2lnbiBzeW5jaHJvbm91c2x5IGlmIHlvdSBpbmNsdWRlIHRoZVxuICAjIGRlc2lnbi5qcyBmaWxlIGJlZm9yZSBsaXZpbmdkb2NzLlxuICAjIGRvYy5kZXNpZ24ubG9hZChkZXNpZ25zWyduYW1lT2ZZb3VyRGVzaWduJ10pXG4gICNcbiAgIyBQcm9wb3NlZCBleHRlbnNpb25zOlxuICAjIFdpbGwgYmUgZXh0ZW5kZWQgdG8gbG9hZCBkZXNpZ25zIHJlbW90ZWx5IGZyb20gYSBzZXJ2ZXI6XG4gICMgTG9hZCBmcm9tIGEgcmVtb3RlIHNlcnZlciBieSBuYW1lIChzZXJ2ZXIgaGFzIHRvIGJlIGNvbmZpZ3VyZWQgYXMgZGVmYXVsdClcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2doaWJsaScpXG4gICNcbiAgIyBMb2FkIGZyb20gYSBjdXN0b20gc2VydmVyOlxuICAjIGRvYy5kZXNpZ24ubG9hZCgnaHR0cDovL3lvdXJzZXJ2ZXIuaW8vZGVzaWducy9naGlibGkvZGVzaWduLmpzb24nKVxuICBsb2FkOiAoZGVzaWduU3BlYykgLT5cbiAgICBhc3NlcnQgZGVzaWduU3BlYz8sICdkZXNpZ24ubG9hZCgpIHdhcyBjYWxsZWQgd2l0aCB1bmRlZmluZWQuJ1xuICAgIGFzc2VydCBub3QgKHR5cGVvZiBkZXNpZ25TcGVjID09ICdzdHJpbmcnKSwgJ2Rlc2lnbi5sb2FkKCkgbG9hZGluZyBhIGRlc2lnbiBieSBuYW1lIGlzIG5vdCBpbXBsZW1lbnRlZC4nXG5cbiAgICB2ZXJzaW9uID0gVmVyc2lvbi5wYXJzZShkZXNpZ25TcGVjLnZlcnNpb24pXG4gICAgZGVzaWduSWRlbnRpZmllciA9IERlc2lnbi5nZXRJZGVudGlmaWVyKGRlc2lnblNwZWMubmFtZSwgdmVyc2lvbilcbiAgICByZXR1cm4gaWYgQGhhcyhkZXNpZ25JZGVudGlmaWVyKVxuXG4gICAgZGVzaWduID0gZGVzaWduUGFyc2VyLnBhcnNlKGRlc2lnblNwZWMpXG4gICAgaWYgZGVzaWduXG4gICAgICBAYWRkKGRlc2lnbilcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRGVzaWduLnBhcnNlci5lcnJvcnMpXG5cblxuICAjIEFkZCBhbiBhbHJlYWR5IHBhcnNlZCBkZXNpZ24uXG4gICMgQHBhcmFtIHsgRGVzaWduIG9iamVjdCB9XG4gIGFkZDogKGRlc2lnbikgLT5cbiAgICBpZiBkZXNpZ24uaXNOZXdlclRoYW4oQGRlc2lnbnNbZGVzaWduLm5hbWVdKVxuICAgICAgQGRlc2lnbnNbZGVzaWduLm5hbWVdID0gZGVzaWduXG4gICAgQGRlc2lnbnNbZGVzaWduLmlkZW50aWZpZXJdID0gZGVzaWduXG5cblxuICAjIENoZWNrIGlmIGEgZGVzaWduIGlzIGxvYWRlZFxuICBoYXM6IChkZXNpZ25JZGVudGlmaWVyKSAtPlxuICAgIEBkZXNpZ25zW2Rlc2lnbklkZW50aWZpZXJdP1xuXG5cbiAgIyBHZXQgYSBsb2FkZWQgZGVzaWduXG4gICMgQHJldHVybiB7IERlc2lnbiBvYmplY3QgfVxuICBnZXQ6IChkZXNpZ25JZGVudGlmaWVyKSAtPlxuICAgIGFzc2VydCBAaGFzKGRlc2lnbklkZW50aWZpZXIpLCBcIkVycm9yOiBkZXNpZ24gJyN7IGRlc2lnbklkZW50aWZpZXIgfScgaXMgbm90IGxvYWRlZC5cIlxuICAgIEBkZXNpZ25zW2Rlc2lnbklkZW50aWZpZXJdXG5cblxuICAjIENsZWFyIHRoZSBjYWNoZSBpZiB5b3Ugd2FudCB0byByZWxvYWQgZGVzaWduc1xuICByZXNldENhY2hlOiAtPlxuICAgIEBkZXNpZ25zID0ge31cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxualNjaGVtZSA9IHJlcXVpcmUoJ2pzY2hlbWUnKVxuVmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpXG5tb2R1bGUuZXhwb3J0cyA9IHZhbGlkYXRvciA9IGpTY2hlbWUubmV3KClcblxuIyBDdXN0b20gVmFsaWRhdG9yc1xuIyAtLS0tLS0tLS0tLS0tLS0tLVxuXG52YWxpZGF0b3IuYWRkICdzdHlsZVR5cGUnLCAodmFsdWUpIC0+XG4gIHZhbHVlID09ICdvcHRpb24nIG9yIHZhbHVlID09ICdzZWxlY3QnXG5cblxudmFsaWRhdG9yLmFkZCAnc2VtVmVyJywgKHZhbHVlKSAtPlxuICBWZXJzaW9uLnNlbVZlci50ZXN0KHZhbHVlKVxuXG5cbiMgY3NzQ2xhc3NNb2RpZmljYXRvciBwcm9wZXJ0aWVzIG5lZWQgb25lICdEZWZhdWx0JyBvcHRpb25cbiMgd2l0aCBhbiB1bmRlZmluZWQgdmFsdWUuIE90aGVyd2lzZSB1c2VycyBjYW5ub3QgcmVzZXQgdGhlXG4jIHN0eWxlIHZpYSB0aGUgZHJvcGRvd24gaW4gdGhlIFVJLlxudmFsaWRhdG9yLmFkZCAnb25lIGVtcHR5IG9wdGlvbicsICh2YWx1ZSkgLT5cbiAgZW1wdHlDb3VudCA9IDBcbiAgZm9yIGVudHJ5IGluIHZhbHVlXG4gICAgZW1wdHlDb3VudCArPSAxIGlmIG5vdCBlbnRyeS52YWx1ZVxuXG4gIGVtcHR5Q291bnQgPT0gMVxuXG5cbiMgU2NoZW1hc1xuIyAtLS0tLS0tXG5cbnZhbGlkYXRvci5hZGQgJ2Rlc2lnbicsXG4gIG5hbWU6ICdzdHJpbmcnXG4gIHZlcnNpb246ICdzdHJpbmcsIHNlbVZlcidcbiAgYXV0aG9yOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgZGVzY3JpcHRpb246ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBhc3NldHM6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIGNzczogJ2FycmF5IG9mIHN0cmluZydcbiAgICBqczogJ2FycmF5IG9mIHN0cmluZywgb3B0aW9uYWwnXG4gIGNvbXBvbmVudHM6ICdhcnJheSBvZiBjb21wb25lbnQnXG4gIGNvbXBvbmVudFByb3BlcnRpZXM6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIF9fYWRkaXRpb25hbFByb3BlcnR5OiAoa2V5LCB2YWx1ZSkgLT4gdmFsaWRhdG9yLnZhbGlkYXRlKCdjb21wb25lbnRQcm9wZXJ0eScsIHZhbHVlKVxuICBncm91cHM6ICdhcnJheSBvZiBncm91cCwgb3B0aW9uYWwnXG4gIGRlZmF1bHRDb21wb25lbnRzOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBwYXJhZ3JhcGg6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICAgIGltYWdlOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgaW1hZ2VSYXRpb3M6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIF9fYWRkaXRpb25hbFByb3BlcnR5OiAoa2V5LCB2YWx1ZSkgLT4gdmFsaWRhdG9yLnZhbGlkYXRlKCdpbWFnZVJhdGlvJywgdmFsdWUpXG5cblxudmFsaWRhdG9yLmFkZCAnY29tcG9uZW50JyxcbiAgbmFtZTogJ3N0cmluZydcbiAgbGFiZWw6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBodG1sOiAnc3RyaW5nJ1xuICBkaXJlY3RpdmVzOiAnb2JqZWN0LCBvcHRpb25hbCdcbiAgcHJvcGVydGllczogJ2FycmF5IG9mIHN0cmluZywgb3B0aW9uYWwnXG4gIF9fYWRkaXRpb25hbFByb3BlcnR5OiAoa2V5LCB2YWx1ZSkgLT4gZmFsc2VcblxuXG52YWxpZGF0b3IuYWRkICdncm91cCcsXG4gIGxhYmVsOiAnc3RyaW5nJ1xuICBjb21wb25lbnRzOiAnYXJyYXkgb2Ygc3RyaW5nJ1xuXG5cbiMgdG9kbzogcmVuYW1lIHR5cGUgYW5kIHVzZSB0eXBlIHRvIGlkZW50aWZ5IHRoZSBjb21wb25lbnRQcm9wZXJ0eSB0eXBlIGxpa2UgY3NzQ2xhc3NcbnZhbGlkYXRvci5hZGQgJ2NvbXBvbmVudFByb3BlcnR5JyxcbiAgbGFiZWw6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICB0eXBlOiAnc3RyaW5nLCBzdHlsZVR5cGUnXG4gIHZhbHVlOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgb3B0aW9uczogJ2FycmF5IG9mIHN0eWxlT3B0aW9uLCBvbmUgZW1wdHkgb3B0aW9uLCBvcHRpb25hbCdcblxuXG52YWxpZGF0b3IuYWRkICdpbWFnZVJhdGlvJyxcbiAgbGFiZWw6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICByYXRpbzogJ3N0cmluZydcblxuXG52YWxpZGF0b3IuYWRkICdzdHlsZU9wdGlvbicsXG4gIGNhcHRpb246ICdzdHJpbmcnXG4gIHZhbHVlOiAnc3RyaW5nLCBvcHRpb25hbCdcblxuIiwibG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmRlc2lnbkNvbmZpZ1NjaGVtYSA9IHJlcXVpcmUoJy4vZGVzaWduX2NvbmZpZ19zY2hlbWEnKVxuQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vY3NzX21vZGlmaWNhdG9yX3Byb3BlcnR5JylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuVmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpXG5JbWFnZVJhdGlvID0gcmVxdWlyZSgnLi9pbWFnZV9yYXRpbycpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBkZXNpZ25QYXJzZXIgPVxuXG4gIHBhcnNlOiAoZGVzaWduQ29uZmlnKSAtPlxuICAgIEBkZXNpZ24gPSB1bmRlZmluZWRcbiAgICBpZiBkZXNpZ25Db25maWdTY2hlbWEudmFsaWRhdGUoJ2Rlc2lnbicsIGRlc2lnbkNvbmZpZylcbiAgICAgIEBjcmVhdGVEZXNpZ24oZGVzaWduQ29uZmlnKVxuICAgIGVsc2VcbiAgICAgIGVycm9ycyA9IGRlc2lnbkNvbmZpZ1NjaGVtYS5nZXRFcnJvck1lc3NhZ2VzKClcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMpXG5cblxuICBjcmVhdGVEZXNpZ246IChkZXNpZ25Db25maWcpIC0+XG4gICAgeyBhc3NldHMsIGNvbXBvbmVudHMsIGNvbXBvbmVudFByb3BlcnRpZXMsIGdyb3VwcywgZGVmYXVsdENvbXBvbmVudHMsIGltYWdlUmF0aW9zIH0gPSBkZXNpZ25Db25maWdcbiAgICB0cnlcbiAgICAgIEBkZXNpZ24gPSBAcGFyc2VEZXNpZ25JbmZvKGRlc2lnbkNvbmZpZylcbiAgICAgIEBwYXJzZUFzc2V0cyhhc3NldHMpXG4gICAgICBAcGFyc2VDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXBvbmVudFByb3BlcnRpZXMpXG4gICAgICBAcGFyc2VJbWFnZVJhdGlvcyhpbWFnZVJhdGlvcylcbiAgICAgIEBwYXJzZUNvbXBvbmVudHMoY29tcG9uZW50cylcbiAgICAgIEBwYXJzZUdyb3Vwcyhncm91cHMpXG4gICAgICBAcGFyc2VEZWZhdWx0cyhkZWZhdWx0Q29tcG9uZW50cylcbiAgICBjYXRjaCBlcnJvclxuICAgICAgZXJyb3IubWVzc2FnZSA9IFwiRXJyb3IgY3JlYXRpbmcgdGhlIGRlc2lnbjogI3sgZXJyb3IubWVzc2FnZSB9XCJcbiAgICAgIHRocm93IGVycm9yXG5cbiAgICBAZGVzaWduXG5cblxuICBwYXJzZURlc2lnbkluZm86IChkZXNpZ24pIC0+XG4gICAgdmVyc2lvbiA9IG5ldyBWZXJzaW9uKGRlc2lnbi52ZXJzaW9uKVxuICAgIG5ldyBEZXNpZ25cbiAgICAgIG5hbWU6IGRlc2lnbi5uYW1lXG4gICAgICB2ZXJzaW9uOiB2ZXJzaW9uLnRvU3RyaW5nKClcblxuXG4gIHBhcnNlQXNzZXRzOiAoYXNzZXRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgYXNzZXRzP1xuICAgIEBkZXNpZ24uYXNzZXRzLmFkZENzcyhhc3NldHMuY3NzKVxuICAgIEBkZXNpZ24uYXNzZXRzLmFkZEpzKGFzc2V0cy5qcylcblxuXG4gICMgTm90ZTogQ3VycmVudGx5IGNvbXBvbmVudFByb3BlcnRpZXMgY29uc2lzdCBvbmx5IG9mIGRlc2lnbiBzdHlsZXNcbiAgcGFyc2VDb21wb25lbnRQcm9wZXJ0aWVzOiAoY29tcG9uZW50UHJvcGVydGllcykgLT5cbiAgICBAY29tcG9uZW50UHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUsIGNvbmZpZyBvZiBjb21wb25lbnRQcm9wZXJ0aWVzXG4gICAgICBjb25maWcubmFtZSA9IG5hbWVcbiAgICAgIEBjb21wb25lbnRQcm9wZXJ0aWVzW25hbWVdID0gQGNyZWF0ZUNvbXBvbmVudFByb3BlcnR5KGNvbmZpZylcblxuXG4gIHBhcnNlSW1hZ2VSYXRpb3M6IChyYXRpb3MpIC0+XG4gICAgZm9yIG5hbWUsIHJhdGlvIG9mIHJhdGlvc1xuICAgICAgQGRlc2lnbi5pbWFnZVJhdGlvc1tuYW1lXSA9IG5ldyBJbWFnZVJhdGlvXG4gICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgbGFiZWw6IHJhdGlvLmxhYmVsXG4gICAgICAgIHJhdGlvOiByYXRpby5yYXRpb1xuXG5cbiAgcGFyc2VDb21wb25lbnRzOiAoY29tcG9uZW50cz1bXSkgLT5cbiAgICBmb3IgeyBuYW1lLCBsYWJlbCwgaHRtbCwgcHJvcGVydGllcywgZGlyZWN0aXZlcyB9IGluIGNvbXBvbmVudHNcbiAgICAgIHByb3BlcnRpZXMgPSBAbG9va3VwQ29tcG9uZW50UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuXG4gICAgICBjb21wb25lbnQgPSBuZXcgVGVtcGxhdGVcbiAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICBsYWJlbDogbGFiZWxcbiAgICAgICAgaHRtbDogaHRtbFxuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzXG5cbiAgICAgIEBwYXJzZURpcmVjdGl2ZXMoY29tcG9uZW50LCBkaXJlY3RpdmVzKVxuICAgICAgQGRlc2lnbi5hZGQoY29tcG9uZW50KVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoY29tcG9uZW50LCBkaXJlY3RpdmVzKSAtPlxuICAgIGZvciBuYW1lLCBjb25mIG9mIGRpcmVjdGl2ZXNcbiAgICAgIGRpcmVjdGl2ZSA9IGNvbXBvbmVudC5kaXJlY3RpdmVzLmdldChuYW1lKVxuICAgICAgYXNzZXJ0IGRpcmVjdGl2ZSwgXCJDb3VsZCBub3QgZmluZCBkaXJlY3RpdmUgI3sgbmFtZSB9IGluICN7IGNvbXBvbmVudC5uYW1lIH0gY29tcG9uZW50LlwiXG4gICAgICBkaXJlY3RpdmVDb25maWcgPVxuICAgICAgICBpbWFnZVJhdGlvczogQGxvb2t1cEltYWdlUmF0aW9zKGNvbmYuaW1hZ2VSYXRpb3MpXG4gICAgICBkaXJlY3RpdmUuc2V0Q29uZmlnKGRpcmVjdGl2ZUNvbmZpZylcblxuXG4gIGxvb2t1cENvbXBvbmVudFByb3BlcnRpZXM6IChwcm9wZXJ0eU5hbWVzKSAtPlxuICAgIHByb3BlcnRpZXMgPSB7fVxuICAgIGZvciBuYW1lIGluIHByb3BlcnR5TmFtZXMgfHwgW11cbiAgICAgIHByb3BlcnR5ID0gQGNvbXBvbmVudFByb3BlcnRpZXNbbmFtZV1cbiAgICAgIGFzc2VydCBwcm9wZXJ0eSwgXCJUaGUgY29tcG9uZW50UHJvcGVydHkgJyN7IG5hbWUgfScgd2FzIG5vdCBmb3VuZC5cIlxuICAgICAgcHJvcGVydGllc1tuYW1lXSA9IHByb3BlcnR5XG5cbiAgICBwcm9wZXJ0aWVzXG5cblxuICBsb29rdXBJbWFnZVJhdGlvczogKHJhdGlvTmFtZXMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyByYXRpb05hbWVzP1xuICAgIEBtYXBBcnJheSByYXRpb05hbWVzLCAobmFtZSkgPT5cbiAgICAgIHJhdGlvID0gQGRlc2lnbi5pbWFnZVJhdGlvc1tuYW1lXVxuICAgICAgYXNzZXJ0IHJhdGlvLCBcIlRoZSBpbWFnZVJhdGlvICcjeyBuYW1lIH0nIHdhcyBub3QgZm91bmQuXCJcbiAgICAgIHJhdGlvXG5cblxuICBwYXJzZUdyb3VwczogKGdyb3Vwcz1bXSkgLT5cbiAgICBmb3IgZ3JvdXAgaW4gZ3JvdXBzXG4gICAgICBjb21wb25lbnRzID0gZm9yIGNvbXBvbmVudE5hbWUgaW4gZ3JvdXAuY29tcG9uZW50c1xuICAgICAgICBAZGVzaWduLmdldChjb21wb25lbnROYW1lKVxuXG4gICAgICBAZGVzaWduLmdyb3Vwcy5wdXNoXG4gICAgICAgIGxhYmVsOiBncm91cC5sYWJlbFxuICAgICAgICBjb21wb25lbnRzOiBjb21wb25lbnRzXG5cblxuICBwYXJzZURlZmF1bHRzOiAoZGVmYXVsdENvbXBvbmVudHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBkZWZhdWx0Q29tcG9uZW50cz9cbiAgICB7IHBhcmFncmFwaCwgaW1hZ2UgfSA9IGRlZmF1bHRDb21wb25lbnRzXG4gICAgQGRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoID0gQGdldENvbXBvbmVudChwYXJhZ3JhcGgpIGlmIHBhcmFncmFwaFxuICAgIEBkZXNpZ24uZGVmYXVsdEltYWdlID0gQGdldENvbXBvbmVudChpbWFnZSkgaWYgaW1hZ2VcblxuXG4gIGdldENvbXBvbmVudDogKG5hbWUpIC0+XG4gICAgY29tcG9uZW50ID0gQGRlc2lnbi5nZXQobmFtZSlcbiAgICBhc3NlcnQgY29tcG9uZW50LCBcIkNvdWxkIG5vdCBmaW5kIGNvbXBvbmVudCAjeyBuYW1lIH1cIlxuICAgIGNvbXBvbmVudFxuXG5cbiAgY3JlYXRlQ29tcG9uZW50UHJvcGVydHk6IChzdHlsZURlZmluaXRpb24pIC0+XG4gICAgbmV3IENzc01vZGlmaWNhdG9yUHJvcGVydHkoc3R5bGVEZWZpbml0aW9uKVxuXG5cbiAgbWFwQXJyYXk6IChlbnRyaWVzLCBsb29rdXApIC0+XG4gICAgbmV3QXJyYXkgPSBbXVxuICAgIGZvciBlbnRyeSBpbiBlbnRyaWVzXG4gICAgICB2YWwgPSBsb29rdXAoZW50cnkpXG4gICAgICBuZXdBcnJheS5wdXNoKHZhbCkgaWYgdmFsP1xuXG4gICAgbmV3QXJyYXlcblxuXG5EZXNpZ24ucGFyc2VyID0gZGVzaWduUGFyc2VyXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZVJhdGlvXG5cbiAgcmF0aW9TdHJpbmcgPSAvKFxcZCspW1xcLzp4XShcXGQrKS9cblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIGxhYmVsLCByYXRpbyB9KSAtPlxuICAgIEBsYWJlbCA9IGxhYmVsIHx8IHdvcmRzLmh1bWFuaXplKCBAbmFtZSApXG4gICAgQHJhdGlvID0gQHBhcnNlUmF0aW8ocmF0aW8pXG5cblxuICBwYXJzZVJhdGlvOiAocmF0aW8pIC0+XG4gICAgaWYgJC50eXBlKHJhdGlvKSA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gcmF0aW9TdHJpbmcuZXhlYyhyYXRpbylcbiAgICAgIHJhdGlvID0gTnVtYmVyKHJlc1sxXSkgLyBOdW1iZXIocmVzWzJdKVxuXG4gICAgYXNzZXJ0ICQudHlwZShyYXRpbykgPT0gJ251bWJlcicsIFwiQ291bGQgbm90IHBhcnNlIGltYWdlIHJhdGlvICN7IHJhdGlvIH1cIlxuICAgIHJhdGlvXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZlcnNpb25cbiAgQHNlbVZlcjogIC8oXFxkKylcXC4oXFxkKylcXC4oXFxkKykoLispPy9cblxuICBjb25zdHJ1Y3RvcjogKHZlcnNpb25TdHJpbmcpIC0+XG4gICAgQHBhcnNlVmVyc2lvbih2ZXJzaW9uU3RyaW5nKVxuXG5cbiAgcGFyc2VWZXJzaW9uOiAodmVyc2lvblN0cmluZykgLT5cbiAgICByZXMgPSBWZXJzaW9uLnNlbVZlci5leGVjKHZlcnNpb25TdHJpbmcpXG4gICAgaWYgcmVzXG4gICAgICBAbWFqb3IgPSByZXNbMV1cbiAgICAgIEBtaW5vciA9IHJlc1syXVxuICAgICAgQHBhdGNoID0gcmVzWzNdXG4gICAgICBAYWRkZW5kdW0gPSByZXNbNF1cblxuXG4gIGlzVmFsaWQ6IC0+XG4gICAgQG1ham9yP1xuXG5cbiAgdG9TdHJpbmc6IC0+XG4gICAgXCIjeyBAbWFqb3IgfS4jeyBAbWlub3IgfS4jeyBAcGF0Y2ggfSN7IEBhZGRlbmR1bSB8fCAnJyB9XCJcblxuXG4gIEBwYXJzZTogKHZlcnNpb25TdHJpbmcpIC0+XG4gICAgdiA9IG5ldyBWZXJzaW9uKHZlcnNpb25TdHJpbmcpXG4gICAgaWYgdi5pc1ZhbGlkKCkgdGhlbiB2LnRvU3RyaW5nKCkgZWxzZSAnJ1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG5cbiAgIyBJbWFnZSBTZXJ2aWNlIEludGVyZmFjZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbmFtZTogJ2RlZmF1bHQnXG5cbiAgIyBTZXQgdmFsdWUgdG8gYW4gaW1hZ2Ugb3IgYmFja2dyb3VuZCBpbWFnZSBlbGVtZW50LlxuICAjXG4gICMgQHBhcmFtIHsgalF1ZXJ5IG9iamVjdCB9IE5vZGUgdG8gc2V0IHRoZSBpbWFnZSB0by5cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBJbWFnZSB1cmxcbiAgc2V0OiAoJGVsZW0sIHZhbHVlKSAtPlxuICAgIGlmIEBpc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgQHNldElubGluZUltYWdlKCRlbGVtLCB2YWx1ZSlcbiAgICBlbHNlXG4gICAgICBAc2V0QmFja2dyb3VuZEltYWdlKCRlbGVtLCB2YWx1ZSlcblxuXG4gIHNldFBsYWNlaG9sZGVyOiAoJGVsZW0pIC0+XG4gICAgZGltID0gQGdldEltYWdlRGltZW5zaW9ucygkZWxlbSlcbiAgICBpbWFnZVVybCA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8jeyBkaW0ud2lkdGggfXgjeyBkaW0uaGVpZ2h0IH0vQkVGNTZGL0IyRTY2OFwiXG5cblxuICAjIFRoZSBkZWZhdWx0IHNlcnZpY2UgZG9lcyBub3QgdHJhbnNmb3IgdGhlIGdpdmVuIHVybFxuICBnZXRVcmw6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZVxuXG5cbiAgIyBEZWZhdWx0IEltYWdlIFNlcnZpY2UgbWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGdldEltYWdlRGltZW5zaW9uczogKCRlbGVtKSAtPlxuICAgIGlmIEBpc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgd2lkdGg6ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aDogJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQ6ICRlbGVtLm91dGVySGVpZ2h0KClcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDAgaWYgdmFsdWU/XG5cblxuICBpc0lubGluZUltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9ICdpbWcnXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGVmYXVsdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9zZXJ2aWNlJylcbnJlc3JjaXRJbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEF2YWlsYWJsZSBJbWFnZSBTZXJ2aWNlc1xuICBzZXJ2aWNlcyA9XG4gICAgJ3Jlc3JjLml0JzogcmVzcmNpdEltYWdlU2VydmljZVxuICAgICdkZWZhdWx0JzogZGVmYXVsdEltYWdlU2VydmljZVxuXG5cbiAgIyBTZXJ2aWNlXG4gICMgLS0tLS0tLVxuXG4gIGhhczogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXT9cblxuXG4gIGdldDogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIGFzc2VydCBAaGFzKHNlcnZpY2VOYW1lKSwgXCJDb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IHNlcnZpY2VOYW1lIH1cIlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXVxuXG5cbiAgZWFjaFNlcnZpY2U6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc2VydmljZSBvZiBzZXJ2aWNlc1xuICAgICAgY2FsbGJhY2sobmFtZSwgc2VydmljZSlcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgcmVzcmNpdFVybDogJ2h0dHA6Ly9hcHAucmVzcmMuaXQvJ1xuXG4gICMgSW1hZ2UgU2VydmljZSBJbnRlcmZhY2VcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIG5hbWU6ICdyZXNyYy5pdCdcblxuICAjIEBwYXJhbSB7IGpRdWVyeSBvYmplY3QgfVxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEEgcmVzcmMuaXQgdXJsLiBFLmcuIGh0dHA6Ly9hcHAucmVzcmMuaXQvaHR0cDovL2ltYWdlcy5jb20vMS5qcGdcbiAgc2V0OiAoJGVsZW0sIHVybCkgLT5cbiAgICBhc3NlcnQgdXJsPyAmJiB1cmwgIT0gJycsICdTcmMgdmFsdWUgZm9yIGFuIGltYWdlIGhhcyB0byBiZSBkZWZpbmVkJ1xuXG4gICAgcmV0dXJuIEBzZXRCYXNlNjQoJGVsZW0sIHVybCkgaWYgaW1nU2VydmljZS5pc0Jhc2U2NCh1cmwpXG5cbiAgICAkZWxlbS5hZGRDbGFzcygncmVzcmMnKVxuICAgIGlmIGltZ1NlcnZpY2UuaXNJbmxpbmVJbWFnZSgkZWxlbSlcbiAgICAgIEBzZXRJbmxpbmVJbWFnZSgkZWxlbSwgdXJsKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHVybClcblxuXG4gIHNldFBsYWNlaG9sZGVyOiAoJGVsZW0pIC0+XG4gICAgaW1nU2VydmljZS5zZXRQbGFjZWhvbGRlcigkZWxlbSlcblxuXG4gIGdldFVybDogKHZhbHVlLCB7IGNyb3AgfSkgLT5cbiAgICBjcm9wUGFyYW0gPSBcIkM9VyN7IGNyb3Aud2lkdGggfSxII3sgY3JvcC5oZWlnaHQgfSxYI3sgY3JvcC54IH0sWSN7IGNyb3AueSB9L1wiIGlmIGNyb3A/XG4gICAgXCIjeyBAcmVzcmNpdFVybCB9I3sgY3JvcFBhcmFtIHx8ICcnIH0jeyB2YWx1ZSB9XCJcblxuXG4gICMgSW1hZ2Ugc3BlY2lmaWMgbWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBmb3JtYXRDc3NVcmw6ICh1cmwpIC0+XG4gICAgdXJsID0gaW1nU2VydmljZS5lc2NhcGVDc3NVcmkodXJsKVxuICAgIFwidXJsKCN7IHVybCB9KVwiXG5cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB1cmwpIC0+XG4gICAgJGVsZW0ucmVtb3ZlQXR0cignc3JjJykgaWYgaW1nU2VydmljZS5pc0Jhc2U2NCgkZWxlbS5hdHRyKCdzcmMnKSlcbiAgICAkZWxlbS5hdHRyKCdkYXRhLXNyYycsIHVybClcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB1cmwpIC0+XG4gICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgQGZvcm1hdENzc1VybCh1cmwpKVxuXG5cbiAgIyBTZXQgc3JjIGRpcmVjdGx5LCBkb24ndCBhZGQgcmVzcmMgY2xhc3NcbiAgc2V0QmFzZTY0OiAoJGVsZW0sIGJhc2U2NFN0cmluZykgLT5cbiAgICBpbWdTZXJ2aWNlLnNldCgkZWxlbSwgYmFzZTY0U3RyaW5nKVxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5pc1N1cHBvcnRlZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZmVhdHVyZV9kZXRlY3Rpb24vaXNfc3VwcG9ydGVkJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnREcmFnXG5cbiAgd2lnZ2xlU3BhY2UgPSAwXG4gIHN0YXJ0QW5kRW5kT2Zmc2V0ID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcgfSkgLT5cbiAgICBAJHZpZXcgPSBjb21wb25lbnRWaWV3LiRodG1sIGlmIGNvbXBvbmVudFZpZXdcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIHN0YXJ0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIuZGlzYWJsZUFsbCgpXG4gICAgQHBhZ2UuYmx1ckZvY3VzZWRFbGVtZW50KClcblxuICAgICMgcGxhY2Vob2xkZXIgYmVsb3cgY3Vyc29yXG4gICAgQCRwbGFjZWhvbGRlciA9IEBjcmVhdGVQbGFjZWhvbGRlcigpLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgQCRkcmFnQmxvY2tlciA9IEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIilcblxuICAgICMgZHJvcCBtYXJrZXJcbiAgICBAJGRyb3BNYXJrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyb3BNYXJrZXIgfSc+XCIpXG5cbiAgICBAcGFnZS4kYm9keVxuICAgICAgLmFwcGVuZChAJGRyb3BNYXJrZXIpXG4gICAgICAuYXBwZW5kKEAkcGxhY2Vob2xkZXIpXG4gICAgICAuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpXG5cbiAgICAjIG1hcmsgZHJhZ2dlZCBjb21wb25lbnRcbiAgICBAJHZpZXcuYWRkQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cblxuICAgICMgcG9zaXRpb24gdGhlIHBsYWNlaG9sZGVyXG4gICAgQG1vdmUoZXZlbnRQb3NpdGlvbilcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG5cbiAgbW92ZTogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQCRwbGFjZWhvbGRlci5jc3NcbiAgICAgIGxlZnQ6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWCB9cHhcIlxuICAgICAgdG9wOiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVkgfXB4XCJcblxuICAgIEB0YXJnZXQgPSBAZmluZERyb3BUYXJnZXQoZXZlbnRQb3NpdGlvbilcbiAgICAjIEBzY3JvbGxJbnRvVmlldyh0b3AsIGV2ZW50KVxuXG5cbiAgZmluZERyb3BUYXJnZXQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGdldEVsZW1VbmRlckN1cnNvcihldmVudFBvc2l0aW9uKVxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIGVsZW0/XG5cbiAgICAjIHJldHVybiB0aGUgc2FtZSBhcyBsYXN0IHRpbWUgaWYgdGhlIGN1cnNvciBpcyBhYm92ZSB0aGUgZHJvcE1hcmtlclxuICAgIHJldHVybiBAdGFyZ2V0IGlmIGVsZW0gPT0gQCRkcm9wTWFya2VyWzBdXG5cbiAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50UG9zaXRpb24ucGFnZVgsIHRvcDogZXZlbnRQb3NpdGlvbi5wYWdlWSB9XG4gICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKSBpZiBlbGVtP1xuICAgIEB1bmRvTWFrZVNwYWNlKClcblxuICAgIGlmIHRhcmdldD8gJiYgdGFyZ2V0LmNvbXBvbmVudFZpZXc/Lm1vZGVsICE9IEBjb21wb25lbnRNb2RlbFxuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgQG1hcmtEcm9wUG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAjIGlmIHRhcmdldC5jb250YWluZXJOYW1lXG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5wYXJlbnQpXG4gICAgICAjICAgJGNvbnRhaW5lciA9ICQodGFyZ2V0Lm5vZGUpXG4gICAgICAjIGVsc2UgaWYgdGFyZ2V0LmNvbXBvbmVudFZpZXdcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LmNvbXBvbmVudFZpZXcpXG4gICAgICAjICAgJGNvbnRhaW5lciA9IHRhcmdldC5jb21wb25lbnRWaWV3LmdldCRjb250YWluZXIoKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgZWxzZVxuICAgICAgQCRkcm9wTWFya2VyLmhpZGUoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG5cbiAgICAgIGlmIG5vdCB0YXJnZXQ/XG4gICAgICAgIEAkcGxhY2Vob2xkZXIuYWRkQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmVDbGFzcyhjc3Mubm9Ecm9wKVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBtYXJrRHJvcFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdjb21wb25lbnQnXG4gICAgICAgIEBjb21wb25lbnRQb3NpdGlvbih0YXJnZXQpXG4gICAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuXG5cbiAgY29tcG9uZW50UG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICBiZWZvcmUgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5wcmV2KClcblxuICAgICAgaWYgYmVmb3JlP1xuICAgICAgICBpZiBiZWZvcmUubW9kZWwgPT0gQGNvbXBvbmVudE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2FmdGVyJ1xuICAgICAgICAgIHJldHVybiBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlbkNvbXBvbmVudHMoYmVmb3JlLCB0YXJnZXQuY29tcG9uZW50VmlldylcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5jb21wb25lbnRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG4gICAgZWxzZVxuICAgICAgbmV4dCA9IHRhcmdldC5jb21wb25lbnRWaWV3Lm5leHQoKVxuICAgICAgaWYgbmV4dD9cbiAgICAgICAgaWYgbmV4dC5tb2RlbCA9PSBAY29tcG9uZW50TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYmVmb3JlJ1xuICAgICAgICAgIHJldHVybiBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuXG4gICAgICAgIEBzaG93TWFya2VyQmV0d2VlbkNvbXBvbmVudHModGFyZ2V0LmNvbXBvbmVudFZpZXcsIG5leHQpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcih0YXJnZXQuY29tcG9uZW50Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuXG5cbiAgc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzOiAodmlld0EsIHZpZXdCKSAtPlxuICAgIGJveEEgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0EuJGVsZW1bMF0pXG4gICAgYm94QiA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3Qi4kZWxlbVswXSlcblxuICAgIGhhbGZHYXAgPSBpZiBib3hCLnRvcCA+IGJveEEuYm90dG9tXG4gICAgICAoYm94Qi50b3AgLSBib3hBLmJvdHRvbSkgLyAyXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveEEubGVmdFxuICAgICAgdG9wOiBib3hBLmJvdHRvbSArIGhhbGZHYXBcbiAgICAgIHdpZHRoOiBib3hBLndpZHRoXG5cblxuICBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmZpcnN0Q2hpbGQsICd0b3AnKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdUb3AgPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy10b3AnKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3gudG9wICsgc3RhcnRBbmRFbmRPZmZzZXQgKyBwYWRkaW5nVG9wXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyQXRFbmRPZkNvbnRhaW5lcjogKGVsZW0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtP1xuXG4gICAgQG1ha2VTcGFjZShlbGVtLmxhc3RDaGlsZCwgJ2JvdHRvbScpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLWJvdHRvbScpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC5ib3R0b20gLSBzdGFydEFuZEVuZE9mZnNldCAtIHBhZGRpbmdCb3R0b21cbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXI6ICh7IGxlZnQsIHRvcCwgd2lkdGggfSkgLT5cbiAgICBpZiBAaWZyYW1lQm94P1xuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gaWZyYW1lIHZpZXdwb3J0XG4gICAgICAkYm9keSA9ICQoQGlmcmFtZUJveC53aW5kb3cuZG9jdW1lbnQuYm9keSlcbiAgICAgIHRvcCAtPSAkYm9keS5zY3JvbGxUb3AoKVxuICAgICAgbGVmdCAtPSAkYm9keS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgbGVmdCArPSBAaWZyYW1lQm94LmxlZnRcbiAgICAgIHRvcCArPSBAaWZyYW1lQm94LnRvcFxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBkb2N1bWVudCAoYWJzb2x1dGUgcG9zaXRpb25pbmcpXG4gICAgICAjIHRvcCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcCgpXG4gICAgICAjIGxlZnQgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0KClcblxuICAgICAgIyBXaXRoIHBvc2l0aW9uIGZpeGVkIHdlIGRvbid0IG5lZWQgdG8gdGFrZSBzY3JvbGxpbmcgaW50byBhY2NvdW50XG4gICAgICAjIGluIGFuIGlmcmFtZSBzY2VuYXJpb1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2ZpeGVkJylcbiAgICBlbHNlXG4gICAgICAjIElmIHdlJ3JlIG5vdCBpbiBhbiBpZnJhbWUgbGVmdCBhbmQgdG9wIGFyZSBhbHJlYWR5XG4gICAgICAjIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlc1xuICAgICAgQCRkcm9wTWFya2VyLmNzcyhwb3NpdGlvbjogJ2Fic29sdXRlJylcblxuICAgIEAkZHJvcE1hcmtlclxuICAgIC5jc3NcbiAgICAgIGxlZnQ6ICBcIiN7IGxlZnQgfXB4XCJcbiAgICAgIHRvcDogICBcIiN7IHRvcCB9cHhcIlxuICAgICAgd2lkdGg6IFwiI3sgd2lkdGggfXB4XCJcbiAgICAuc2hvdygpXG5cblxuICBtYWtlU3BhY2U6IChub2RlLCBwb3NpdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpZ2dsZVNwYWNlICYmIG5vZGU/XG4gICAgJG5vZGUgPSAkKG5vZGUpXG4gICAgQGxhc3RUcmFuc2Zvcm0gPSAkbm9kZVxuXG4gICAgaWYgcG9zaXRpb24gPT0gJ3RvcCdcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsICN7IHdpZ2dsZVNwYWNlIH1weClcIilcbiAgICBlbHNlXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAtI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuXG5cbiAgdW5kb01ha2VTcGFjZTogKG5vZGUpIC0+XG4gICAgaWYgQGxhc3RUcmFuc2Zvcm0/XG4gICAgICBAbGFzdFRyYW5zZm9ybS5jc3ModHJhbnNmb3JtOiAnJylcbiAgICAgIEBsYXN0VHJhbnNmb3JtID0gdW5kZWZpbmVkXG5cblxuICBoaWdobGlnaENvbnRhaW5lcjogKCRjb250YWluZXIpIC0+XG4gICAgaWYgJGNvbnRhaW5lclswXSAhPSBAJGhpZ2hsaWdodGVkQ29udGFpbmVyWzBdXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9ICRjb250YWluZXJcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIuYWRkQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG5cblxuICByZW1vdmVDb250YWluZXJIaWdobGlnaHQ6IC0+XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0ge31cblxuXG4gICMgcGFnZVgsIHBhZ2VZOiBhYnNvbHV0ZSBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudClcbiAgIyBjbGllbnRYLCBjbGllbnRZOiBmaXhlZCBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydClcbiAgZ2V0RWxlbVVuZGVyQ3Vyc29yOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBlbGVtID0gdW5kZWZpbmVkXG4gICAgQHVuYmxvY2tFbGVtZW50RnJvbVBvaW50ID0+XG4gICAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50UG9zaXRpb25cblxuICAgICAgaWYgY2xpZW50WD8gJiYgY2xpZW50WT9cbiAgICAgICAgZWxlbSA9IEBwYWdlLmRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcblxuICAgICAgaWYgZWxlbT8ubm9kZU5hbWUgPT0gJ0lGUkFNRSdcbiAgICAgICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZmluZEVsZW1JbklmcmFtZShlbGVtLCBldmVudFBvc2l0aW9uKVxuICAgICAgZWxzZVxuICAgICAgICBAaWZyYW1lQm94ID0gdW5kZWZpbmVkXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgZmluZEVsZW1JbklmcmFtZTogKGlmcmFtZUVsZW0sIGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQGlmcmFtZUJveCA9IGJveCA9IGlmcmFtZUVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBAaWZyYW1lQm94LndpbmRvdyA9IGlmcmFtZUVsZW0uY29udGVudFdpbmRvd1xuICAgIGRvY3VtZW50ID0gaWZyYW1lRWxlbS5jb250ZW50RG9jdW1lbnRcbiAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSlcblxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WCAtPSBib3gubGVmdFxuICAgIGV2ZW50UG9zaXRpb24uY2xpZW50WSAtPSBib3gudG9wXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWCA9IGV2ZW50UG9zaXRpb24uY2xpZW50WCArICRib2R5LnNjcm9sbExlZnQoKVxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVkgPSBldmVudFBvc2l0aW9uLmNsaWVudFkgKyAkYm9keS5zY3JvbGxUb3AoKVxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50UG9zaXRpb24uY2xpZW50WCwgZXZlbnRQb3NpdGlvbi5jbGllbnRZKVxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gICMgUmVtb3ZlIGVsZW1lbnRzIHVuZGVyIHRoZSBjdXJzb3Igd2hpY2ggY291bGQgaW50ZXJmZXJlXG4gICMgd2l0aCBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KClcbiAgdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQ6IChjYWxsYmFjaykgLT5cblxuICAgICMgUG9pbnRlciBFdmVudHMgYXJlIGEgbG90IGZhc3RlciBzaW5jZSB0aGUgYnJvd3NlciBkb2VzIG5vdCBuZWVkXG4gICAgIyB0byByZXBhaW50IHRoZSB3aG9sZSBzY3JlZW4uIElFIDkgYW5kIDEwIGRvIG5vdCBzdXBwb3J0IHRoZW0uXG4gICAgaWYgaXNTdXBwb3J0ZWQoJ2h0bWxQb2ludGVyRXZlbnRzJylcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdhdXRvJylcbiAgICBlbHNlXG4gICAgICBAJGRyYWdCbG9ja2VyLmhpZGUoKVxuICAgICAgQCRwbGFjZWhvbGRlci5oaWRlKClcbiAgICAgIGNhbGxiYWNrKClcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuc2hvdygpXG4gICAgICBAJHBsYWNlaG9sZGVyLnNob3coKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgZHJvcDogLT5cbiAgICBpZiBAdGFyZ2V0P1xuICAgICAgQG1vdmVUb1RhcmdldChAdGFyZ2V0KVxuICAgICAgQHBhZ2UuY29tcG9uZW50V2FzRHJvcHBlZC5maXJlKEBjb21wb25lbnRNb2RlbClcbiAgICBlbHNlXG4gICAgICAjY29uc2lkZXI6IG1heWJlIGFkZCBhICdkcm9wIGZhaWxlZCcgZWZmZWN0XG5cblxuICAjIE1vdmUgdGhlIGNvbXBvbmVudCBhZnRlciBhIHN1Y2Nlc3NmdWwgZHJvcFxuICBtb3ZlVG9UYXJnZXQ6ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ2NvbXBvbmVudCdcbiAgICAgICAgY29tcG9uZW50VmlldyA9IHRhcmdldC5jb21wb25lbnRWaWV3XG4gICAgICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIGNvbXBvbmVudFZpZXcubW9kZWwuYmVmb3JlKEBjb21wb25lbnRNb2RlbClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbXBvbmVudFZpZXcubW9kZWwuYWZ0ZXIoQGNvbXBvbmVudE1vZGVsKVxuICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICBjb21wb25lbnRNb2RlbCA9IHRhcmdldC5jb21wb25lbnRWaWV3Lm1vZGVsXG4gICAgICAgIGNvbXBvbmVudE1vZGVsLmFwcGVuZCh0YXJnZXQuY29udGFpbmVyTmFtZSwgQGNvbXBvbmVudE1vZGVsKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgY29tcG9uZW50VHJlZSA9IHRhcmdldC5jb21wb25lbnRUcmVlXG4gICAgICAgIGNvbXBvbmVudFRyZWUucHJlcGVuZChAY29tcG9uZW50TW9kZWwpXG5cblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gICMgUmVzZXQgaXMgYWx3YXlzIGNhbGxlZCBhZnRlciBhIGRyYWcgZW5kZWQuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG5cbiAgICAgICMgdW5kbyBET00gY2hhbmdlc1xuICAgICAgQHVuZG9NYWtlU3BhY2UoKVxuICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICBAcGFnZS4kYm9keS5jc3MoJ2N1cnNvcicsICcnKVxuICAgICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLnJlZW5hYmxlQWxsKClcbiAgICAgIEAkdmlldy5yZW1vdmVDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuICAgICAgZG9tLnJlc3RvcmVDb250YWluZXJIZWlnaHQoKVxuXG4gICAgICAjIHJlbW92ZSBlbGVtZW50c1xuICAgICAgQCRwbGFjZWhvbGRlci5yZW1vdmUoKVxuICAgICAgQCRkcm9wTWFya2VyLnJlbW92ZSgpXG5cblxuICBjcmVhdGVQbGFjZWhvbGRlcjogLT5cbiAgICBudW1iZXJPZkRyYWdnZWRFbGVtcyA9IDFcbiAgICB0ZW1wbGF0ZSA9IFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXIgfVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cIiN7IGNzcy5kcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyIH1cIj5cbiAgICAgICAgICAjeyBudW1iZXJPZkRyYWdnZWRFbGVtcyB9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgU2VsZWN0ZWQgSXRlbVxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcblxuICAgICRwbGFjZWhvbGRlciA9ICQodGVtcGxhdGUpXG4gICAgICAuY3NzKHBvc2l0aW9uOiBcImFic29sdXRlXCIpXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBET00gaGVscGVyIG1ldGhvZHNcbiMgLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE1ldGhvZHMgdG8gcGFyc2UgYW5kIHVwZGF0ZSB0aGUgRG9tIHRyZWUgaW4gYWNjb3JkYW5jZSB0b1xuIyB0aGUgQ29tcG9uZW50VHJlZSBhbmQgTGl2aW5nZG9jcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG4gIGNvbXBvbmVudFJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3MuY29tcG9uZW50IH0oPzogfCQpXCIpXG4gIHNlY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLnNlY3Rpb24gfSg/OiB8JClcIilcblxuICAjIEZpbmQgdGhlIGNvbXBvbmVudCB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgIyBDb21wb25lbnRzIGFyZSBtYXJrZWQgYnkgYSBjbGFzcyBhdCB0aGUgbW9tZW50LlxuICBmaW5kQ29tcG9uZW50VmlldzogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBjb21wb25lbnRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICB2aWV3ID0gQGdldENvbXBvbmVudFZpZXcobm9kZSlcbiAgICAgICAgcmV0dXJuIHZpZXdcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZmluZE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIG5vZGVDb250ZXh0ID0gQGdldE5vZGVDb250ZXh0KG5vZGUpXG4gICAgICByZXR1cm4gbm9kZUNvbnRleHQgaWYgbm9kZUNvbnRleHRcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgZ2V0Tm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIGZvciBkaXJlY3RpdmVUeXBlLCBvYmogb2YgY29uZmlnLmRpcmVjdGl2ZXNcbiAgICAgIGNvbnRpbnVlIGlmIG5vdCBvYmouZWxlbWVudERpcmVjdGl2ZVxuXG4gICAgICBkaXJlY3RpdmVBdHRyID0gb2JqLnJlbmRlcmVkQXR0clxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb250ZXh0QXR0cjogZGlyZWN0aXZlQXR0clxuICAgICAgICAgIGF0dHJOYW1lOiBub2RlLmdldEF0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICAjIEZpbmQgdGhlIGNvbnRhaW5lciB0aGlzIG5vZGUgaXMgY29udGFpbmVkIHdpdGhpbi5cbiAgZmluZENvbnRhaW5lcjogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBpZiBub3Qgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgICAgdmlldyA9IEBmaW5kQ29tcG9uZW50Vmlldyhub2RlKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbm9kZVxuICAgICAgICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcbiAgICAgICAgICBjb21wb25lbnRWaWV3OiB2aWV3XG4gICAgICAgIH1cblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG4gICAge31cblxuXG4gIGdldEltYWdlTmFtZTogKG5vZGUpIC0+XG4gICAgaW1hZ2VBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaW1hZ2VBdHRyKVxuICAgICAgcmV0dXJuIGltYWdlTmFtZVxuXG5cbiAgZ2V0SHRtbEVsZW1lbnROYW1lOiAobm9kZSkgLT5cbiAgICBodG1sQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICBodG1sRWxlbWVudE5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIHJldHVybiBodG1sRWxlbWVudE5hbWVcblxuXG4gIGdldEVkaXRhYmxlTmFtZTogKG5vZGUpIC0+XG4gICAgZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgaW1hZ2VOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoZWRpdGFibGVBdHRyKVxuICAgICAgcmV0dXJuIGVkaXRhYmxlTmFtZVxuXG5cbiAgZHJvcFRhcmdldDogKG5vZGUsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgICMgYWJvdmUgY29udGFpbmVyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50RGF0YSA9IEBnZXRDbG9zZXN0Q29tcG9uZW50KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RDb21wb25lbnREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdENvbXBvbmVudFRhcmdldChjbG9zZXN0Q29tcG9uZW50RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Q29udGFpbmVyVGFyZ2V0KG5vZGUpXG5cbiAgICAgICMgYWJvdmUgY29tcG9uZW50XG4gICAgICBlbHNlIGlmIGNvbXBvbmVudFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHJldHVybiBAZ2V0Q29tcG9uZW50VGFyZ2V0KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG5cbiAgICAgICMgYWJvdmUgcm9vdCBjb250YWluZXJcbiAgICAgIGVsc2UgaWYgc2VjdGlvblJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnREYXRhID0gQGdldENsb3Nlc3RDb21wb25lbnQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdENvbXBvbmVudERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0Q29tcG9uZW50VGFyZ2V0KGNsb3Nlc3RDb21wb25lbnREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRSb290VGFyZ2V0KG5vZGUpXG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuXG4gIGdldENvbXBvbmVudFRhcmdldDogKGVsZW0sIHsgdG9wLCBsZWZ0LCBwb3NpdGlvbiB9KSAtPlxuICAgIHRhcmdldDogJ2NvbXBvbmVudCdcbiAgICBjb21wb25lbnRWaWV3OiBAZ2V0Q29tcG9uZW50VmlldyhlbGVtKVxuICAgIHBvc2l0aW9uOiBwb3NpdGlvbiB8fCBAZ2V0UG9zaXRpb25PbkNvbXBvbmVudChlbGVtLCB7IHRvcCwgbGVmdCB9KVxuXG5cbiAgZ2V0Q2xvc2VzdENvbXBvbmVudFRhcmdldDogKGNsb3Nlc3RDb21wb25lbnREYXRhKSAtPlxuICAgIGVsZW0gPSBjbG9zZXN0Q29tcG9uZW50RGF0YS4kZWxlbVswXVxuICAgIHBvc2l0aW9uID0gY2xvc2VzdENvbXBvbmVudERhdGEucG9zaXRpb25cbiAgICBAZ2V0Q29tcG9uZW50VGFyZ2V0KGVsZW0sIHsgcG9zaXRpb24gfSlcblxuXG4gIGdldENvbnRhaW5lclRhcmdldDogKG5vZGUpIC0+XG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcbiAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcblxuICAgIHRhcmdldDogJ2NvbnRhaW5lcidcbiAgICBub2RlOiBub2RlXG4gICAgY29tcG9uZW50VmlldzogQGZpbmRDb21wb25lbnRWaWV3KG5vZGUpXG4gICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuXG5cbiAgZ2V0Um9vdFRhcmdldDogKG5vZGUpIC0+XG4gICAgY29tcG9uZW50VHJlZSA9ICQobm9kZSkuZGF0YSgnY29tcG9uZW50VHJlZScpXG5cbiAgICB0YXJnZXQ6ICdyb290J1xuICAgIG5vZGU6IG5vZGVcbiAgICBjb21wb25lbnRUcmVlOiBjb21wb25lbnRUcmVlXG5cblxuICAjIEZpZ3VyZSBvdXQgaWYgd2Ugc2hvdWxkIGluc2VydCBiZWZvcmUgb3IgYWZ0ZXIgYSBjb21wb25lbnRcbiAgIyBiYXNlZCBvbiB0aGUgY3Vyc29yIHBvc2l0aW9uLlxuICBnZXRQb3NpdGlvbk9uQ29tcG9uZW50OiAoZWxlbSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgIGlmIEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICdiZWZvcmUnXG4gICAgZWxzZVxuICAgICAgJ2FmdGVyJ1xuXG5cbiAgIyBHZXQgdGhlIGNsb3Nlc3QgY29tcG9uZW50IGluIGEgY29udGFpbmVyIGZvciBhIHRvcCBsZWZ0IHBvc2l0aW9uXG4gIGdldENsb3Nlc3RDb21wb25lbnQ6IChjb250YWluZXIsIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGNvbXBvbmVudHMgPSAkKGNvbnRhaW5lcikuZmluZChcIi4jeyBjc3MuY29tcG9uZW50IH1cIilcbiAgICBjbG9zZXN0ID0gdW5kZWZpbmVkXG4gICAgY2xvc2VzdENvbXBvbmVudCA9IHVuZGVmaW5lZFxuXG4gICAgJGNvbXBvbmVudHMuZWFjaCAoaW5kZXgsIGVsZW0pID0+XG4gICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgICBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1IZWlnaHRcblxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbVRvcClcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYmVmb3JlJ31cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2FmdGVyJ31cblxuICAgIGNsb3Nlc3RDb21wb25lbnRcblxuXG4gIGRpc3RhbmNlOiAoYSwgYikgLT5cbiAgICBpZiBhID4gYiB0aGVuIGEgLSBiIGVsc2UgYiAtIGFcblxuXG4gICMgZm9yY2UgYWxsIGNvbnRhaW5lcnMgb2YgYSBjb21wb25lbnQgdG8gYmUgYXMgaGlnaCBhcyB0aGV5IGNhbiBiZVxuICAjIHNldHMgY3NzIHN0eWxlIGhlaWdodFxuICBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodDogKHZpZXcpIC0+XG4gICAgaWYgdmlldy50ZW1wbGF0ZS5jb250YWluZXJDb3VudCA+IDFcbiAgICAgIGZvciBuYW1lLCBlbGVtIG9mIHZpZXcuY29udGFpbmVyc1xuICAgICAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAgICAgY29udGludWUgaWYgJGVsZW0uaGFzQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcbiAgICAgICAgJHBhcmVudCA9ICRlbGVtLnBhcmVudCgpXG4gICAgICAgIHBhcmVudEhlaWdodCA9ICRwYXJlbnQuaGVpZ2h0KClcbiAgICAgICAgb3V0ZXIgPSAkZWxlbS5vdXRlckhlaWdodCh0cnVlKSAtICRlbGVtLmhlaWdodCgpXG4gICAgICAgICRlbGVtLmhlaWdodChwYXJlbnRIZWlnaHQgLSBvdXRlcilcbiAgICAgICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gICMgcmVtb3ZlIGFsbCBjc3Mgc3R5bGUgaGVpZ2h0IGRlY2xhcmF0aW9ucyBhZGRlZCBieVxuICAjIG1heGltaXplQ29udGFpbmVySGVpZ2h0KClcbiAgcmVzdG9yZUNvbnRhaW5lckhlaWdodDogKCkgLT5cbiAgICAkKFwiLiN7IGNzcy5tYXhpbWl6ZWRDb250YWluZXIgfVwiKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAucmVtb3ZlQ2xhc3MoY3NzLm1heGltaXplZENvbnRhaW5lcilcblxuXG4gIGdldEVsZW1lbnROb2RlOiAobm9kZSkgLT5cbiAgICBpZiBub2RlPy5qcXVlcnlcbiAgICAgIG5vZGVbMF1cbiAgICBlbHNlIGlmIG5vZGU/Lm5vZGVUeXBlID09IDMgIyBOb2RlLlRFWFRfTk9ERSA9PSAzXG4gICAgICBub2RlLnBhcmVudE5vZGVcbiAgICBlbHNlXG4gICAgICBub2RlXG5cblxuICAjIENvbXBvbmVudHMgc3RvcmUgYSByZWZlcmVuY2Ugb2YgdGhlbXNlbHZlcyBpbiB0aGVpciBEb20gbm9kZVxuICAjIGNvbnNpZGVyOiBzdG9yZSByZWZlcmVuY2UgZGlyZWN0bHkgd2l0aG91dCBqUXVlcnlcbiAgZ2V0Q29tcG9uZW50VmlldzogKG5vZGUpIC0+XG4gICAgJChub2RlKS5kYXRhKCdjb21wb25lbnRWaWV3JylcblxuXG4gICMgR2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qgd2l0aCB0b3AgYW5kIGxlZnQgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50XG4gICMgKGlkZWFsIGZvciBhYnNvbHV0ZSBwb3NpdGlvbmVkIGVsZW1lbnRzKVxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogKG5vZGUpIC0+XG4gICAgd2luID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgeyBzY3JvbGxYLCBzY3JvbGxZIH0gPSBAZ2V0U2Nyb2xsUG9zaXRpb24od2luKVxuXG4gICAgIyB0cmFuc2xhdGUgaW50byBhYnNvbHV0ZSBwb3NpdGlvbnNcbiAgICBjb29yZHMgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgY29vcmRzID1cbiAgICAgIHRvcDogY29vcmRzLnRvcCArIHNjcm9sbFlcbiAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSArIHNjcm9sbFlcbiAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0ICsgc2Nyb2xsWFxuICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCArIHNjcm9sbFhcblxuICAgIGNvb3Jkcy5oZWlnaHQgPSBjb29yZHMuYm90dG9tIC0gY29vcmRzLnRvcFxuICAgIGNvb3Jkcy53aWR0aCA9IGNvb3Jkcy5yaWdodCAtIGNvb3Jkcy5sZWZ0XG5cbiAgICBjb29yZHNcblxuXG4gIGdldFNjcm9sbFBvc2l0aW9uOiAod2luKSAtPlxuICAgICMgY29kZSBmcm9tIG1kbjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy5zY3JvbGxYXG4gICAgc2Nyb2xsWDogaWYgKHdpbi5wYWdlWE9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VYT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdFxuICAgIHNjcm9sbFk6IGlmICh3aW4ucGFnZVlPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWU9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbFRvcFxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRHJhZ0Jhc2VcbiNcbiMgU3VwcG9ydGVkIGRyYWcgbW9kZXM6XG4jIC0gRGlyZWN0IChzdGFydCBpbW1lZGlhdGVseSlcbiMgLSBMb25ncHJlc3MgKHN0YXJ0IGFmdGVyIGEgZGVsYXkgaWYgdGhlIGN1cnNvciBkb2VzIG5vdCBtb3ZlIHRvbyBtdWNoKVxuIyAtIE1vdmUgKHN0YXJ0IGFmdGVyIHRoZSBjdXJzb3IgbW92ZWQgYSBtaW51bXVtIGRpc3RhbmNlKVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnQmFzZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UsIG9wdGlvbnMpIC0+XG4gICAgQG1vZGVzID0gWydkaXJlY3QnLCAnbG9uZ3ByZXNzJywgJ21vdmUnXVxuXG4gICAgZGVmYXVsdENvbmZpZyA9XG4gICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcbiAgICAgIG9uRHJhZ1N0YXJ0OiB1bmRlZmluZWRcbiAgICAgIHNjcm9sbEFyZWE6IDUwXG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcbiAgICAgIG1vdmU6XG4gICAgICAgIGRpc3RhbmNlOiAwXG5cbiAgICBAZGVmYXVsdENvbmZpZyA9ICQuZXh0ZW5kKHRydWUsIGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG5cbiAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgQHN0YXJ0ZWQgPSBmYWxzZVxuXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgQGRlZmF1bHRDb25maWcsIG9wdGlvbnMpXG4gICAgQG1vZGUgPSBpZiBvcHRpb25zLmRpcmVjdD9cbiAgICAgICdkaXJlY3QnXG4gICAgZWxzZSBpZiBvcHRpb25zLmxvbmdwcmVzcz9cbiAgICAgICdsb25ncHJlc3MnXG4gICAgZWxzZSBpZiBvcHRpb25zLm1vdmU/XG4gICAgICAnbW92ZSdcbiAgICBlbHNlXG4gICAgICAnbG9uZ3ByZXNzJ1xuXG5cbiAgc2V0RHJhZ0hhbmRsZXI6IChkcmFnSGFuZGxlcikgLT5cbiAgICBAZHJhZ0hhbmRsZXIgPSBkcmFnSGFuZGxlclxuICAgIEBkcmFnSGFuZGxlci5wYWdlID0gQHBhZ2VcblxuXG4gICMgU3RhcnQgYSBwb3NzaWJsZSBkcmFnXG4gICMgVGhlIGRyYWcgaXMgb25seSByZWFsbHkgc3RhcnRlZCBpZiBjb25zdHJhaW50cyBhcmUgbm90IHZpb2xhdGVkXG4gICMgKGxvbmdwcmVzc0RlbGF5IGFuZCBsb25ncHJlc3NEaXN0YW5jZUxpbWl0IG9yIG1pbkRpc3RhbmNlKS5cbiAgaW5pdDogKGRyYWdIYW5kbGVyLCBldmVudCwgb3B0aW9ucykgLT5cbiAgICBAcmVzZXQoKVxuICAgIEBpbml0aWFsaXplZCA9IHRydWVcbiAgICBAc2V0T3B0aW9ucyhvcHRpb25zKVxuICAgIEBzZXREcmFnSGFuZGxlcihkcmFnSGFuZGxlcilcbiAgICBAc3RhcnRQb2ludCA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuXG4gICAgQGFkZFN0b3BMaXN0ZW5lcnMoZXZlbnQpXG4gICAgQGFkZE1vdmVMaXN0ZW5lcnMoZXZlbnQpXG5cbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgQGFkZExvbmdwcmVzc0luZGljYXRvcihAc3RhcnRQb2ludClcbiAgICAgIEB0aW1lb3V0ID0gc2V0VGltZW91dCA9PlxuICAgICAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgICAgIEBzdGFydChldmVudClcbiAgICAgICAgLCBAb3B0aW9ucy5sb25ncHJlc3MuZGVsYXlcbiAgICBlbHNlIGlmIEBtb2RlID09ICdkaXJlY3QnXG4gICAgICBAc3RhcnQoZXZlbnQpXG5cbiAgICAjIHByZXZlbnQgYnJvd3NlciBEcmFnICYgRHJvcFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgaWYgQG9wdGlvbnMucHJldmVudERlZmF1bHRcblxuXG4gIG1vdmU6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5sb25ncHJlc3MudG9sZXJhbmNlXG4gICAgICAgIEByZXNldCgpXG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnbW92ZSdcbiAgICAgIGlmIEBkaXN0YW5jZShldmVudFBvc2l0aW9uLCBAc3RhcnRQb2ludCkgPiBAb3B0aW9ucy5tb3ZlLmRpc3RhbmNlXG4gICAgICAgIEBzdGFydChldmVudClcblxuXG4gICMgc3RhcnQgdGhlIGRyYWcgcHJvY2Vzc1xuICBzdGFydDogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBAc3RhcnRlZCA9IHRydWVcblxuICAgICMgcHJldmVudCB0ZXh0LXNlbGVjdGlvbnMgd2hpbGUgZHJhZ2dpbmdcbiAgICBAYWRkQmxvY2tlcigpXG4gICAgQHBhZ2UuJGJvZHkuYWRkQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG4gICAgQGRyYWdIYW5kbGVyLnN0YXJ0KGV2ZW50UG9zaXRpb24pXG5cblxuICBkcm9wOiAoZXZlbnQpIC0+XG4gICAgQGRyYWdIYW5kbGVyLmRyb3AoZXZlbnQpIGlmIEBzdGFydGVkXG4gICAgaWYgJC5pc0Z1bmN0aW9uKEBvcHRpb25zLm9uRHJvcClcbiAgICAgIEBvcHRpb25zLm9uRHJvcChldmVudCwgQGRyYWdIYW5kbGVyKVxuICAgIEByZXNldCgpXG5cblxuICBjYW5jZWw6IC0+XG4gICAgQHJlc2V0KClcblxuXG4gIHJlc2V0OiAtPlxuICAgIGlmIEBzdGFydGVkXG4gICAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgICBAcGFnZS4kYm9keS5yZW1vdmVDbGFzcyhjc3MucHJldmVudFNlbGVjdGlvbilcblxuICAgIGlmIEBpbml0aWFsaXplZFxuICAgICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgICBAZHJhZ0hhbmRsZXIucmVzZXQoKVxuICAgICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgICBpZiBAdGltZW91dD9cbiAgICAgICAgY2xlYXJUaW1lb3V0KEB0aW1lb3V0KVxuICAgICAgICBAdGltZW91dCA9IHVuZGVmaW5lZFxuXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcbiAgICAgIEByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3IoKVxuICAgICAgQHJlbW92ZUJsb2NrZXIoKVxuXG5cbiAgYWRkQmxvY2tlcjogLT5cbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJhZ0Jsb2NrZXIgfSc+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGJsb2NrZXIpXG5cblxuICByZW1vdmVCbG9ja2VyOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmRyYWdCbG9ja2VyIH1cIikucmVtb3ZlKClcblxuXG4gIGFkZExvbmdwcmVzc0luZGljYXRvcjogKHsgcGFnZVgsIHBhZ2VZIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAb3B0aW9ucy5sb25ncHJlc3Muc2hvd0luZGljYXRvclxuICAgICRpbmRpY2F0b3IgPSAkKFwiPGRpdiBjbGFzcz1cXFwiI3sgY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XFxcIj48ZGl2PjwvZGl2PjwvZGl2PlwiKVxuICAgICRpbmRpY2F0b3IuY3NzKGxlZnQ6IHBhZ2VYLCB0b3A6IHBhZ2VZKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkaW5kaWNhdG9yKVxuXG5cbiAgcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yOiAtPlxuICAgIEBwYWdlLiRib2R5LmZpbmQoXCIuI3sgY3NzLmxvbmdwcmVzc0luZGljYXRvciB9XCIpLnJlbW92ZSgpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgaW5pdGlhbGl6ZWQgaW1tZWRpYXRlbHkgdG8gYWxsb3cgYSBsb25nLXByZXNzIGZpbmlzaFxuICBhZGRTdG9wTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgZXZlbnROYW1lcyA9XG4gICAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgICAndG91Y2hlbmQubGl2aW5nZG9jcy1kcmFnIHRvdWNoY2FuY2VsLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGxlYXZlLmxpdmluZ2RvY3MtZHJhZydcbiAgICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ2VudGVyJyB8fCBldmVudC50eXBlID09ICdkcmFnYmV0dGVyZW50ZXInXG4gICAgICAgICdkcm9wLmxpdmluZ2RvY3MtZHJhZyBkcmFnZW5kLmxpdmluZ2RvY3MtZHJhZydcbiAgICAgIGVsc2VcbiAgICAgICAgJ21vdXNldXAubGl2aW5nZG9jcy1kcmFnJ1xuXG4gICAgQHBhZ2UuJGRvY3VtZW50Lm9uIGV2ZW50TmFtZXMsIChldmVudCkgPT5cbiAgICAgIEBkcm9wKGV2ZW50KVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIHBvc3NpYmx5IGluaXRpYWxpemVkIHdpdGggYSBkZWxheSBpbiBjb21wb25lbnREcmFnI29uU3RhcnRcbiAgYWRkTW92ZUxpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ3RvdWNobW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ2VudGVyJyB8fCBldmVudC50eXBlID09ICdkcmFnYmV0dGVyZW50ZXInXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ2RyYWdvdmVyLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuICAgIGVsc2UgIyBhbGwgb3RoZXIgaW5wdXQgZGV2aWNlcyBiZWhhdmUgbGlrZSBhIG1vdXNlXG4gICAgICBAcGFnZS4kZG9jdW1lbnQub24gJ21vdXNlbW92ZS5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cblxuICBnZXRFdmVudFBvc2l0aW9uOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgfHwgZXZlbnQudHlwZSA9PSAndG91Y2htb3ZlJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cbiAgICAjIFNvIGZhciBJIGRvIG5vdCB1bmRlcnN0YW5kIHdoeSB0aGUgalF1ZXJ5IGV2ZW50IGRvZXMgbm90IGNvbnRhaW4gY2xpZW50WCBldGMuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnb3ZlcidcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuXG4gICAgY2xpZW50WDogZXZlbnQuY2xpZW50WFxuICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFlcbiAgICBwYWdlWDogZXZlbnQucGFnZVhcbiAgICBwYWdlWTogZXZlbnQucGFnZVlcblxuXG4gIGRpc3RhbmNlOiAocG9pbnRBLCBwb2ludEIpIC0+XG4gICAgcmV0dXJuIHVuZGVmaW5lZCBpZiAhcG9pbnRBIHx8ICFwb2ludEJcblxuICAgIGRpc3RYID0gcG9pbnRBLnBhZ2VYIC0gcG9pbnRCLnBhZ2VYXG4gICAgZGlzdFkgPSBwb2ludEEucGFnZVkgLSBwb2ludEIucGFnZVlcbiAgICBNYXRoLnNxcnQoIChkaXN0WCAqIGRpc3RYKSArIChkaXN0WSAqIGRpc3RZKSApXG5cblxuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgZWRpdGFibGUuanMgQ29udHJvbGxlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW50ZWdyYXRlIGVkaXRhYmxlLmpzIGludG8gTGl2aW5nZG9jc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZUNvbnRyb2xsZXJcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlKSAtPlxuXG4gICAgIyBJbml0aWFsaXplIGVkaXRhYmxlLmpzXG4gICAgQGVkaXRhYmxlID0gbmV3IEVkaXRhYmxlXG4gICAgICB3aW5kb3c6IEBwYWdlLndpbmRvd1xuICAgICAgYnJvd3NlclNwZWxsY2hlY2s6IGNvbmZpZy5lZGl0YWJsZS5icm93c2VyU3BlbGxjaGVja1xuICAgICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogY29uZmlnLmVkaXRhYmxlLm1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXNcblxuICAgIEBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBAc2VsZWN0aW9uID0gJC5DYWxsYmFja3MoKVxuXG4gICAgQGVkaXRhYmxlXG4gICAgICAuZm9jdXMoQHdpdGhDb250ZXh0KEBmb2N1cykpXG4gICAgICAuYmx1cihAd2l0aENvbnRleHQoQGJsdXIpKVxuICAgICAgLmluc2VydChAd2l0aENvbnRleHQoQGluc2VydCkpXG4gICAgICAubWVyZ2UoQHdpdGhDb250ZXh0KEBtZXJnZSkpXG4gICAgICAuc3BsaXQoQHdpdGhDb250ZXh0KEBzcGxpdCkpXG4gICAgICAuc2VsZWN0aW9uKEB3aXRoQ29udGV4dChAc2VsZWN0aW9uQ2hhbmdlZCkpXG4gICAgICAubmV3bGluZShAd2l0aENvbnRleHQoQG5ld2xpbmUpKVxuICAgICAgLmNoYW5nZShAd2l0aENvbnRleHQoQGNoYW5nZSkpXG5cblxuICAjIFJlZ2lzdGVyIERPTSBub2RlcyB3aXRoIGVkaXRhYmxlLmpzLlxuICAjIEFmdGVyIHRoYXQgRWRpdGFibGUgd2lsbCBmaXJlIGV2ZW50cyBmb3IgdGhhdCBub2RlLlxuICBhZGQ6IChub2RlcykgLT5cbiAgICBAZWRpdGFibGUuYWRkKG5vZGVzKVxuXG5cbiAgZGlzYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuc3VzcGVuZCgpXG5cblxuICByZWVuYWJsZUFsbDogLT5cbiAgICBAZWRpdGFibGUuY29udGludWUoKVxuXG5cbiAgIyBHZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lIGZyb20gdGhlIERPTSBlbGVtZW50IHBhc3NlZCBieSBlZGl0YWJsZS5qc1xuICAjXG4gICMgQWxsIGxpc3RlbmVycyBwYXJhbXMgZ2V0IHRyYW5zZm9ybWVkIHNvIHRoZXkgZ2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZVxuICAjIGluc3RlYWQgb2YgZWxlbWVudDpcbiAgI1xuICAjIEV4YW1wbGU6IGxpc3RlbmVyKHZpZXcsIGVkaXRhYmxlTmFtZSwgb3RoZXJQYXJhbXMuLi4pXG4gIHdpdGhDb250ZXh0OiAoZnVuYykgLT5cbiAgICAoZWxlbWVudCwgYXJncy4uLikgPT5cbiAgICAgIHZpZXcgPSBkb20uZmluZENvbXBvbmVudFZpZXcoZWxlbWVudClcbiAgICAgIGVkaXRhYmxlTmFtZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKEBlZGl0YWJsZUF0dHIpXG4gICAgICBhcmdzLnVuc2hpZnQodmlldywgZWRpdGFibGVOYW1lKVxuICAgICAgZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuXG5cbiAgZXh0cmFjdENvbnRlbnQ6IChlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGVkaXRhYmxlLmdldENvbnRlbnQoZWxlbWVudClcbiAgICBpZiBjb25maWcuc2luZ2xlTGluZUJyZWFrLnRlc3QodmFsdWUpIHx8IHZhbHVlID09ICcnXG4gICAgICB1bmRlZmluZWRcbiAgICBlbHNlXG4gICAgICB2YWx1ZVxuXG5cbiAgdXBkYXRlTW9kZWw6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW1lbnQpIC0+XG4gICAgdmFsdWUgPSBAZXh0cmFjdENvbnRlbnQoZWxlbWVudClcbiAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIHZhbHVlKVxuXG5cbiAgZm9jdXM6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgdmlldy5mb2N1c0VkaXRhYmxlKGVkaXRhYmxlTmFtZSlcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlRm9jdXNlZChlbGVtZW50LCB2aWV3KVxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gIGJsdXI6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KVxuXG4gICAgdmlldy5ibHVyRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuICAgIEBwYWdlLmZvY3VzLmVkaXRhYmxlQmx1cnJlZChlbGVtZW50LCB2aWV3KVxuXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBJbnNlcnQgYSBuZXcgYmxvY2suXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgYXQgdGhlIGVuZCBvZiBhIGJsb2NrXG4gICMgb3IgYnkgcHJlc3NpbmcgZGVsZXRlIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBibG9jay5cbiAgaW5zZXJ0OiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBkZWZhdWx0UGFyYWdyYXBoID0gQHBhZ2UuZGVzaWduLmRlZmF1bHRQYXJhZ3JhcGhcbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldykgJiYgZGVmYXVsdFBhcmFncmFwaD9cbiAgICAgIGNvcHkgPSBkZWZhdWx0UGFyYWdyYXBoLmNyZWF0ZU1vZGVsKClcblxuICAgICAgbmV3VmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICB2aWV3Lm1vZGVsLmJlZm9yZShjb3B5KVxuICAgICAgICB2aWV3LnByZXYoKVxuICAgICAgZWxzZVxuICAgICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICAgIHZpZXcubmV4dCgpXG5cbiAgICAgIG5ld1ZpZXcuZm9jdXMoKSBpZiBuZXdWaWV3ICYmIGRpcmVjdGlvbiA9PSAnYWZ0ZXInXG5cblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBNZXJnZSB0d28gYmxvY2tzLiBXb3JrcyBpbiB0d28gZGlyZWN0aW9ucy5cbiAgIyBFaXRoZXIgdGhlIGN1cnJlbnQgYmxvY2sgaXMgYmVpbmcgbWVyZ2VkIGludG8gdGhlIHByZWNlZWRpbmcgKCdiZWZvcmUnKVxuICAjIG9yIHRoZSBmb2xsb3dpbmcgKCdhZnRlcicpIGJsb2NrLlxuICAjIEFmdGVyIHRoZSBtZXJnZSB0aGUgY3VycmVudCBibG9jayBpcyByZW1vdmVkIGFuZCB0aGUgZm9jdXMgc2V0IHRvIHRoZVxuICAjIG90aGVyIGJsb2NrIHRoYXQgd2FzIG1lcmdlZCBpbnRvLlxuICBtZXJnZTogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG4gICAgICBtZXJnZWRWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnIHRoZW4gdmlldy5wcmV2KCkgZWxzZSB2aWV3Lm5leHQoKVxuXG4gICAgICBpZiBtZXJnZWRWaWV3ICYmIG1lcmdlZFZpZXcudGVtcGxhdGUgPT0gdmlldy50ZW1wbGF0ZVxuICAgICAgICB2aWV3RWxlbSA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICAgIG1lcmdlZFZpZXdFbGVtID0gbWVyZ2VkVmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcblxuICAgICAgICAjIEdhdGhlciB0aGUgY29udGVudCB0aGF0IGlzIGdvaW5nIHRvIGJlIG1lcmdlZFxuICAgICAgICBjb250ZW50VG9NZXJnZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KHZpZXdFbGVtKVxuXG4gICAgICAgIGN1cnNvciA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgICAgIEBlZGl0YWJsZS5hcHBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZWRpdGFibGUucHJlcGVuZFRvKG1lcmdlZFZpZXdFbGVtLCBjb250ZW50VG9NZXJnZSlcblxuICAgICAgICB2aWV3Lm1vZGVsLnJlbW92ZSgpXG4gICAgICAgIGN1cnNvci5zZXRWaXNpYmxlU2VsZWN0aW9uKClcblxuICAgICAgICAjIEFmdGVyIGV2ZXJ5dGhpbmcgaXMgZG9uZSBhbmQgdGhlIGZvY3VzIGlzIHNldCB1cGRhdGUgdGhlIG1vZGVsIHRvXG4gICAgICAgICMgbWFrZSBzdXJlIHRoZSBtb2RlbCBpcyB1cCB0byBkYXRlIGFuZCBjaGFuZ2VzIGFyZSBub3RpZmllZC5cbiAgICAgICAgQHVwZGF0ZU1vZGVsKG1lcmdlZFZpZXcsIGVkaXRhYmxlTmFtZSwgbWVyZ2VkVmlld0VsZW0pXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgU3BsaXQgYSBibG9jayBpbiB0d28uXG4gICMgVXN1YWxseSB0cmlnZ2VyZWQgYnkgcHJlc3NpbmcgZW50ZXIgaW4gdGhlIG1pZGRsZSBvZiBhIGJsb2NrLlxuICBzcGxpdDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgYmVmb3JlLCBhZnRlciwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuXG4gICAgICAjIGFwcGVuZCBhbmQgZm9jdXMgY29weSBvZiBjb21wb25lbnRcbiAgICAgIGNvcHkgPSB2aWV3LnRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcbiAgICAgIGNvcHkuc2V0KGVkaXRhYmxlTmFtZSwgQGV4dHJhY3RDb250ZW50KGFmdGVyKSlcbiAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgIHZpZXcubmV4dCgpPy5mb2N1cygpXG5cbiAgICAgICMgc2V0IGNvbnRlbnQgb2YgdGhlIGJlZm9yZSBlbGVtZW50IChhZnRlciBmb2N1cyBpcyBzZXQgdG8gdGhlIGFmdGVyIGVsZW1lbnQpXG4gICAgICB2aWV3Lm1vZGVsLnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChiZWZvcmUpKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIE9jY3VycyB3aGVuZXZlciB0aGUgdXNlciBzZWxlY3RzIG9uZSBvciBtb3JlIGNoYXJhY3RlcnMgb3Igd2hlbmV2ZXIgdGhlXG4gICMgc2VsZWN0aW9uIGlzIGNoYW5nZWQuXG4gIHNlbGVjdGlvbkNoYW5nZWQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIHNlbGVjdGlvbikgLT5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAc2VsZWN0aW9uLmZpcmUodmlldywgZWxlbWVudCwgc2VsZWN0aW9uKVxuXG5cbiAgIyBJbnNlcnQgYSBuZXdsaW5lIChTaGlmdCArIEVudGVyKVxuICBuZXdsaW5lOiAodmlldywgZWRpdGFibGUsIGN1cnNvcikgLT5cbiAgICBpZiBjb25maWcuZWRpdGFibGUuYWxsb3dOZXdsaW5lXG4gICAgICByZXR1cm4gdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuICAgIGVsc2VcbiAgICAgcmV0dXJuIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBUcmlnZ2VyZWQgd2hlbmV2ZXIgdGhlIHVzZXIgY2hhbmdlcyB0aGUgY29udGVudCBvZiBhIGJsb2NrLlxuICAjIFRoZSBjaGFuZ2UgZXZlbnQgZG9lcyBub3QgYXV0b21hdGljYWxseSBmaXJlIGlmIHRoZSBjb250ZW50IGhhc1xuICAjIGJlZW4gY2hhbmdlZCB2aWEgamF2YXNjcmlwdC5cbiAgY2hhbmdlOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuICAgIHJldHVybiBpZiBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXkgPT0gZmFsc2VcblxuICAgIEBjaGFuZ2VUaW1lb3V0ID0gc2V0VGltZW91dCA9PlxuICAgICAgZWxlbSA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgICBAdXBkYXRlTW9kZWwodmlldywgZWRpdGFibGVOYW1lLCBlbGVtKVxuICAgICAgQGNoYW5nZVRpbWVvdXQgPSB1bmRlZmluZWRcbiAgICAsIGNvbmZpZy5lZGl0YWJsZS5jaGFuZ2VEZWxheVxuXG5cbiAgY2xlYXJDaGFuZ2VUaW1lb3V0OiAtPlxuICAgIGlmIEBjaGFuZ2VUaW1lb3V0P1xuICAgICAgY2xlYXJUaW1lb3V0KEBjaGFuZ2VUaW1lb3V0KVxuICAgICAgQGNoYW5nZVRpbWVvdXQgPSB1bmRlZmluZWRcblxuXG4gIGhhc1NpbmdsZUVkaXRhYmxlOiAodmlldykgLT5cbiAgICB2aWV3LmRpcmVjdGl2ZXMubGVuZ3RoID09IDEgJiYgdmlldy5kaXJlY3RpdmVzWzBdLnR5cGUgPT0gJ2VkaXRhYmxlJ1xuXG4iLCJkb20gPSByZXF1aXJlKCcuL2RvbScpXG5cbiMgQ29tcG9uZW50IEZvY3VzXG4jIC0tLS0tLS0tLS0tLS0tLVxuIyBNYW5hZ2UgdGhlIGNvbXBvbmVudCBvciBlZGl0YWJsZSB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEZvY3VzXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuICAgIEBjb21wb25lbnRWaWV3ID0gdW5kZWZpbmVkXG5cbiAgICBAY29tcG9uZW50Rm9jdXMgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudEJsdXIgPSAkLkNhbGxiYWNrcygpXG5cblxuICBzZXRGb2N1czogKGNvbXBvbmVudFZpZXcsIGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBlZGl0YWJsZU5vZGUgIT0gQGVkaXRhYmxlTm9kZVxuICAgICAgQHJlc2V0RWRpdGFibGUoKVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IGVkaXRhYmxlTm9kZVxuXG4gICAgaWYgY29tcG9uZW50VmlldyAhPSBAY29tcG9uZW50Vmlld1xuICAgICAgQHJlc2V0Q29tcG9uZW50VmlldygpXG4gICAgICBpZiBjb21wb25lbnRWaWV3XG4gICAgICAgIEBjb21wb25lbnRWaWV3ID0gY29tcG9uZW50Vmlld1xuICAgICAgICBAY29tcG9uZW50Rm9jdXMuZmlyZShAY29tcG9uZW50VmlldylcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUZvY3VzZWQ6IChlZGl0YWJsZU5vZGUsIGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSAhPSBlZGl0YWJsZU5vZGVcbiAgICAgIGNvbXBvbmVudFZpZXcgfHw9IGRvbS5maW5kQ29tcG9uZW50VmlldyhlZGl0YWJsZU5vZGUpXG4gICAgICBAc2V0Rm9jdXMoY29tcG9uZW50VmlldywgZWRpdGFibGVOb2RlKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlQmx1cnJlZDogKGVkaXRhYmxlTm9kZSkgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlID09IGVkaXRhYmxlTm9kZVxuICAgICAgQHNldEZvY3VzKEBjb21wb25lbnRWaWV3LCB1bmRlZmluZWQpXG5cblxuICAjIGNhbGwgYWZ0ZXIgY2xpY2tcbiAgY29tcG9uZW50Rm9jdXNlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgQGNvbXBvbmVudFZpZXcgIT0gY29tcG9uZW50Vmlld1xuICAgICAgQHNldEZvY3VzKGNvbXBvbmVudFZpZXcsIHVuZGVmaW5lZClcblxuXG4gIGJsdXI6IC0+XG4gICAgQHNldEZvY3VzKHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0RWRpdGFibGU6IC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZVxuICAgICAgQGVkaXRhYmxlTm9kZSA9IHVuZGVmaW5lZFxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRDb21wb25lbnRWaWV3OiAtPlxuICAgIGlmIEBjb21wb25lbnRWaWV3XG4gICAgICBwcmV2aW91cyA9IEBjb21wb25lbnRWaWV3XG4gICAgICBAY29tcG9uZW50VmlldyA9IHVuZGVmaW5lZFxuICAgICAgQGNvbXBvbmVudEJsdXIuZmlyZShwcmV2aW91cylcblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuUmVuZGVyaW5nQ29udGFpbmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3JlbmRlcmluZ19jb250YWluZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9pbnRlcmFjdGl2ZV9wYWdlJylcblJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvcmVuZGVyZXInKVxuVmlldyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3ZpZXcnKVxuRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5kb20gPSByZXF1aXJlKCcuL2ludGVyYWN0aW9uL2RvbScpXG5kZXNpZ25DYWNoZSA9IHJlcXVpcmUoJy4vZGVzaWduL2Rlc2lnbl9jYWNoZScpXG5Db21wb25lbnRUcmVlID0gcmVxdWlyZSgnLi9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfdHJlZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGl2aW5nZG9jIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICAjIENyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBAY3JlYXRlOiAoeyBkYXRhLCBkZXNpZ25OYW1lLCBjb21wb25lbnRUcmVlIH0pIC0+XG4gICAgY29tcG9uZW50VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGxpdmluZ2RvYzogTm8gZGVzaWduIGlzIHNwZWNpZmllZC4nXG4gICAgICBkZXNpZ24gPSBkZXNpZ25DYWNoZS5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBDb21wb25lbnRUcmVlKGNvbnRlbnQ6IGRhdGEsIGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2UgaWYgZGVzaWduTmFtZT9cbiAgICAgIGRlc2lnbiA9IGRlc2lnbkNhY2hlLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IENvbXBvbmVudFRyZWUoZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgY29tcG9uZW50VHJlZVxuXG4gICAgbmV3IExpdmluZ2RvYyh7IGNvbXBvbmVudFRyZWUgfSlcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb21wb25lbnRUcmVlIH0pIC0+XG4gICAgQGRlc2lnbiA9IGNvbXBvbmVudFRyZWUuZGVzaWduXG4gICAgQHNldENvbXBvbmVudFRyZWUoY29tcG9uZW50VHJlZSlcbiAgICBAdmlld3MgPSB7fVxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB1bmRlZmluZWRcblxuXG4gICMgR2V0IGEgZHJvcCB0YXJnZXQgZm9yIGFuIGV2ZW50XG4gIGdldERyb3BUYXJnZXQ6ICh7IGV2ZW50IH0pIC0+XG4gICAgZG9jdW1lbnQgPSBldmVudC50YXJnZXQub3duZXJEb2N1bWVudFxuICAgIHsgY2xpZW50WCwgY2xpZW50WSB9ID0gZXZlbnRcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuICAgIGlmIGVsZW0/XG4gICAgICBjb29yZHMgPSB7IGxlZnQ6IGV2ZW50LnBhZ2VYLCB0b3A6IGV2ZW50LnBhZ2VZIH1cbiAgICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcylcblxuXG4gIHNldENvbXBvbmVudFRyZWU6IChjb21wb25lbnRUcmVlKSAtPlxuICAgIGFzc2VydCBjb21wb25lbnRUcmVlLmRlc2lnbiA9PSBAZGVzaWduLFxuICAgICAgJ0NvbXBvbmVudFRyZWUgbXVzdCBoYXZlIHRoZSBzYW1lIGRlc2lnbiBhcyB0aGUgZG9jdW1lbnQnXG5cbiAgICBAbW9kZWwgPSBAY29tcG9uZW50VHJlZSA9IGNvbXBvbmVudFRyZWVcbiAgICBAZm9yd2FyZENvbXBvbmVudFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZENvbXBvbmVudFRyZWVFdmVudHM6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBlbWl0ICdjaGFuZ2UnLCBhcmd1bWVudHNcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgb3B0aW9ucy5yZWFkT25seSA/PSB0cnVlXG5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcblxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KEBjb21wb25lbnRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHByb21pc2UgPSB2aWV3LmNyZWF0ZShvcHRpb25zKVxuXG4gICAgaWYgdmlldy5pc0ludGVyYWN0aXZlXG4gICAgICBAc2V0SW50ZXJhY3RpdmVWaWV3KHZpZXcpXG5cbiAgICBwcm9taXNlXG5cblxuICBjcmVhdGVDb21wb25lbnQ6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuY3JlYXRlQ29tcG9uZW50LmFwcGx5KEBjb21wb25lbnRUcmVlLCBhcmd1bWVudHMpXG5cblxuICAjIEFwcGVuZCB0aGUgYXJ0aWNsZSB0byB0aGUgRE9NLlxuICAjXG4gICMgQHBhcmFtIHsgRE9NIE5vZGUsIGpRdWVyeSBvYmplY3Qgb3IgQ1NTIHNlbGVjdG9yIHN0cmluZyB9IFdoZXJlIHRvIGFwcGVuZCB0aGUgYXJ0aWNsZSBpbiB0aGUgZG9jdW1lbnQuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH0gb3B0aW9uczpcbiAgIyAgIGludGVyYWN0aXZlOiB7IEJvb2xlYW4gfSBXaGV0aGVyIHRoZSBkb2N1bWVudCBpcyBlZHRpYWJsZS5cbiAgIyAgIGxvYWRBc3NldHM6IHsgQm9vbGVhbiB9IExvYWQgQ1NTIGZpbGVzLiBPbmx5IGRpc2FibGUgdGhpcyBpZiB5b3UgYXJlIHN1cmUgeW91IGhhdmUgbG9hZGVkIGV2ZXJ5dGhpbmcgbWFudWFsbHkuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIGFydGljbGUuYXBwZW5kVG8oJy5hcnRpY2xlJywgeyBpbnRlcmFjdGl2ZTogdHJ1ZSwgbG9hZEFzc2V0czogZmFsc2UgfSk7XG4gIGFwcGVuZFRvOiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgICRwYXJlbnQgPSAkKHBhcmVudCkuZmlyc3QoKVxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KEBjb21wb25lbnRUcmVlLCAkcGFyZW50WzBdKVxuICAgIHZpZXcuY3JlYXRlUmVuZGVyZXIoeyBvcHRpb25zIH0pXG5cblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBMaXZpbmdkb2MgY2FuIGhhdmUgb25seSBvbmUgaW50ZXJhY3RpdmUgdmlldydcblxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB2aWV3XG5cblxuICB0b0h0bWw6ICh7IGV4Y2x1ZGVDb21wb25lbnRzIH09e30pIC0+XG4gICAgbmV3IFJlbmRlcmVyKFxuICAgICAgY29tcG9uZW50VHJlZTogQGNvbXBvbmVudFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgICBleGNsdWRlQ29tcG9uZW50czogZXhjbHVkZUNvbXBvbmVudHNcbiAgICApLmh0bWwoKVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIGluZGVudGF0aW9uID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIGluZGVudGF0aW9uKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBDb21wb25lbnRUcmVlLlxuICBwcmludE1vZGVsOiAoKSAtPlxuICAgIEBjb21wb25lbnRUcmVlLnByaW50KClcblxuXG4gIExpdmluZ2RvYy5kb20gPSBkb21cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSAkLkNhbGxiYWNrcyBvYmplY3QgdGhhdCB3aWxsXG4gICMgcmVtb3ZlIGl0c2VsZiBmcm9tIGl0cyAkLkNhbGxiYWNrcyBhZnRlciB0aGUgZmlyc3QgY2FsbC5cbiAgY2FsbE9uY2U6IChjYWxsYmFja3MsIGxpc3RlbmVyKSAtPlxuICAgIHNlbGZSZW1vdmluZ0Z1bmMgPSAoYXJncy4uLikgLT5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmUoc2VsZlJlbW92aW5nRnVuYylcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjYWxsYmFja3MuYWRkKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgc2VsZlJlbW92aW5nRnVuY1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGh0bWxQb2ludGVyRXZlbnRzOiAtPlxuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4JylcbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSAncG9pbnRlci1ldmVudHM6YXV0bydcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID09ICdhdXRvJ1xuIiwiZGV0ZWN0cyA9IHJlcXVpcmUoJy4vZmVhdHVyZV9kZXRlY3RzJylcblxuZXhlY3V0ZWRUZXN0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG5hbWUpIC0+XG4gIGlmIChyZXN1bHQgPSBleGVjdXRlZFRlc3RzW25hbWVdKSA9PSB1bmRlZmluZWRcbiAgICBleGVjdXRlZFRlc3RzW25hbWVdID0gQm9vbGVhbihkZXRlY3RzW25hbWVdKCkpXG4gIGVsc2VcbiAgICByZXN1bHRcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlkQ291bnRlciA9IGxhc3RJZCA9IHVuZGVmaW5lZFxuXG4gICMgR2VuZXJhdGUgYSB1bmlxdWUgaWQuXG4gICMgR3VhcmFudGVlcyBhIHVuaXF1ZSBpZCBpbiB0aGlzIHJ1bnRpbWUuXG4gICMgQWNyb3NzIHJ1bnRpbWVzIGl0cyBsaWtlbHkgYnV0IG5vdCBndWFyYW50ZWVkIHRvIGJlIHVuaXF1ZVxuICAjIFVzZSB0aGUgdXNlciBwcmVmaXggdG8gYWxtb3N0IGd1YXJhbnRlZSB1bmlxdWVuZXNzLFxuICAjIGFzc3VtaW5nIHRoZSBzYW1lIHVzZXIgY2Fubm90IGdlbmVyYXRlIGNvbXBvbmVudHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICRcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3JkZXJlZEhhc2hcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAb2JqID0ge31cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgcHVzaDogKGtleSwgdmFsdWUpIC0+XG4gICAgQG9ialtrZXldID0gdmFsdWVcbiAgICBAW0BsZW5ndGhdID0gdmFsdWVcbiAgICBAbGVuZ3RoICs9IDFcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAb2JqW2tleV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdmFsdWUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2sodmFsdWUpXG5cblxuICB0b0FycmF5OiAtPlxuICAgIHZhbHVlIGZvciB2YWx1ZSBpbiB0aGlzXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cbiAgY2FtZWxpemU6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgICAgIGMudG9VcHBlckNhc2UoKVxuICAgIClcblxuICB0cmltOiAoc3RyKSAtPlxuICAgIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblxuXG4gICMgY2FtZWxpemU6IChzdHIpIC0+XG4gICMgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAjICAgICBjLnRvVXBwZXJDYXNlKClcblxuICAjIGNsYXNzaWZ5OiAoc3RyKSAtPlxuICAjICAgJC50aXRsZWl6ZShTdHJpbmcoc3RyKS5yZXBsYWNlKC9bXFxXX10vZywgJyAnKSkucmVwbGFjZSgvXFxzL2csICcnKVxuXG5cblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5hdHRyID0gY29uZmlnLmF0dHJcbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yJylcbmV2ZW50aW5nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ldmVudGluZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKHsgQG1vZGVsLCBAJGh0bWwsIEBkaXJlY3RpdmVzLCBAaXNSZWFkT25seSB9KSAtPlxuICAgIEAkZWxlbSA9IEAkaHRtbFxuICAgIEB0ZW1wbGF0ZSA9IEBtb2RlbC50ZW1wbGF0ZVxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBmYWxzZVxuICAgIEB3YXNBdHRhY2hlZFRvRG9tID0gJC5DYWxsYmFja3MoKTtcblxuICAgIHVubGVzcyBAaXNSZWFkT25seVxuICAgICAgIyBhZGQgYXR0cmlidXRlcyBhbmQgcmVmZXJlbmNlcyB0byB0aGUgaHRtbFxuICAgICAgQCRodG1sXG4gICAgICAgIC5kYXRhKCdjb21wb25lbnRWaWV3JywgdGhpcylcbiAgICAgICAgLmFkZENsYXNzKGNzcy5jb21wb25lbnQpXG4gICAgICAgIC5hdHRyKGF0dHIudGVtcGxhdGUsIEB0ZW1wbGF0ZS5pZGVudGlmaWVyKVxuXG4gICAgQHJlbmRlcigpXG5cblxuICByZW5kZXI6IChtb2RlKSAtPlxuICAgIEB1cGRhdGVDb250ZW50KClcbiAgICBAdXBkYXRlSHRtbCgpXG5cblxuICB1cGRhdGVDb250ZW50OiAtPlxuICAgIEBjb250ZW50KEBtb2RlbC5jb250ZW50KVxuXG4gICAgaWYgbm90IEBoYXNGb2N1cygpXG4gICAgICBAZGlzcGxheU9wdGlvbmFscygpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICB1cGRhdGVIdG1sOiAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBAbW9kZWwuc3R5bGVzXG4gICAgICBAc2V0U3R5bGUobmFtZSwgdmFsdWUpXG5cbiAgICBAc3RyaXBIdG1sSWZSZWFkT25seSgpXG5cblxuICBkaXNwbGF5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbFxuICAgICAgICAkZWxlbSA9ICQoZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIGlmIEBtb2RlbC5pc0VtcHR5KGRpcmVjdGl2ZS5uYW1lKVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICRlbGVtLmNzcygnZGlzcGxheScsICcnKVxuXG5cbiAgIyBTaG93IGFsbCBkb2Mtb3B0aW9uYWxzIHdoZXRoZXIgdGhleSBhcmUgZW1wdHkgb3Igbm90LlxuICAjIFVzZSBvbiBmb2N1cy5cbiAgc2hvd09wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLnNob3coJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICAjIEhpZGUgYWxsIGVtcHR5IGRvYy1vcHRpb25hbHNcbiAgIyBVc2Ugb24gYmx1ci5cbiAgaGlkZUVtcHR5T3B0aW9uYWxzOiAtPlxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5vcHRpb25hbCAmJiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgY29uZmlnLmFuaW1hdGlvbnMub3B0aW9uYWxzLmhpZGUoJChkaXJlY3RpdmUuZWxlbSkpXG5cblxuICBuZXh0OiAtPlxuICAgIEAkaHRtbC5uZXh0KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBwcmV2OiAtPlxuICAgIEAkaHRtbC5wcmV2KCkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICBhZnRlckZvY3VzZWQ6ICgpIC0+XG4gICAgQCRodG1sLmFkZENsYXNzKGNzcy5jb21wb25lbnRIaWdobGlnaHQpXG4gICAgQHNob3dPcHRpb25hbHMoKVxuXG5cbiAgYWZ0ZXJCbHVycmVkOiAoKSAtPlxuICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhjc3MuY29tcG9uZW50SGlnaGxpZ2h0KVxuICAgIEBoaWRlRW1wdHlPcHRpb25hbHMoKVxuXG5cbiAgIyBAcGFyYW0gY3Vyc29yOiB1bmRlZmluZWQsICdzdGFydCcsICdlbmQnXG4gIGZvY3VzOiAoY3Vyc29yKSAtPlxuICAgIGZpcnN0ID0gQGRpcmVjdGl2ZXMuZWRpdGFibGU/WzBdLmVsZW1cbiAgICAkKGZpcnN0KS5mb2N1cygpXG5cblxuICBoYXNGb2N1czogLT5cbiAgICBAJGh0bWwuaGFzQ2xhc3MoY3NzLmNvbXBvbmVudEhpZ2hsaWdodClcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAJGh0bWxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAJGh0bWxbMF0pXG5cblxuICBjb250ZW50OiAoY29udGVudCkgLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgY29udGVudFxuICAgICAgZGlyZWN0aXZlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgICBpZiBkaXJlY3RpdmUuaXNJbWFnZVxuICAgICAgICBpZiBkaXJlY3RpdmUuYmFzZTY0SW1hZ2U/XG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuYmFzZTY0SW1hZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc2V0KG5hbWUsIGRpcmVjdGl2ZS5nZXRJbWFnZVVybCgpIClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldChuYW1lLCB2YWx1ZSlcblxuXG4gIHNldDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQHNldEVkaXRhYmxlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaW1hZ2UnIHRoZW4gQHNldEltYWdlKG5hbWUsIHZhbHVlKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAc2V0SHRtbChuYW1lLCB2YWx1ZSlcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gQGRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICB3aGVuICdlZGl0YWJsZScgdGhlbiBAZ2V0RWRpdGFibGUobmFtZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBnZXRJbWFnZShuYW1lKVxuICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAZ2V0SHRtbChuYW1lKVxuXG5cbiAgZ2V0RWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEVkaXRhYmxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgcmV0dXJuIGlmIEBoYXNGb2N1cygpXG5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0udG9nZ2xlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIsIEJvb2xlYW4odmFsdWUpKVxuICAgICRlbGVtLmF0dHIoYXR0ci5wbGFjZWhvbGRlciwgQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuXG4gIGZvY3VzRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGJsdXJFZGl0YWJsZTogKG5hbWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgIGlmIEBtb2RlbC5pc0VtcHR5KG5hbWUpXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhjc3Mubm9QbGFjZWhvbGRlcilcblxuXG4gIGdldEh0bWw6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5odG1sKClcblxuXG4gIHNldEh0bWw6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCh2YWx1ZSB8fCAnJylcblxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgJGVsZW0uaHRtbChAdGVtcGxhdGUuZGVmYXVsdHNbbmFtZV0pXG4gICAgZWxzZSBpZiB2YWx1ZSBhbmQgbm90IEBpc1JlYWRPbmx5XG4gICAgICBAYmxvY2tJbnRlcmFjdGlvbigkZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzVG9SZXNldCB8fD0ge31cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXRbbmFtZV0gPSBuYW1lXG5cblxuICBnZXREaXJlY3RpdmVFbGVtZW50OiAoZGlyZWN0aXZlTmFtZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5nZXQoZGlyZWN0aXZlTmFtZSk/LmVsZW1cblxuXG4gICMgUmVzZXQgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gYXJiaXRyYXJ5IGh0bWwgYWZ0ZXIgdGhlIHZpZXcgaXMgbW92ZWQgaW5cbiAgIyB0aGUgRE9NIHRvIHJlY3JlYXRlIGlmcmFtZXMuIEluIHRoZSBjYXNlIG9mIHR3aXR0ZXIgd2hlcmUgdGhlIGlmcmFtZXNcbiAgIyBkb24ndCBoYXZlIGEgc3JjIHRoZSByZWxvYWRpbmcgdGhhdCBoYXBwZW5zIHdoZW4gb25lIG1vdmVzIGFuIGlmcmFtZSBjbGVhcnNcbiAgIyBhbGwgY29udGVudCAoTWF5YmUgd2UgY291bGQgbGltaXQgcmVzZXR0aW5nIHRvIGlmcmFtZXMgd2l0aG91dCBhIHNyYykuXG4gICNcbiAgIyBTb21lIG1vcmUgaW5mbyBhYm91dCB0aGUgaXNzdWUgb24gc3RhY2tvdmVyZmxvdzpcbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzgzMTgyNjQvaG93LXRvLW1vdmUtYW4taWZyYW1lLWluLXRoZS1kb20td2l0aG91dC1sb3NpbmctaXRzLXN0YXRlXG4gIHJlc2V0RGlyZWN0aXZlczogLT5cbiAgICBmb3IgbmFtZSBvZiBAZGlyZWN0aXZlc1RvUmVzZXRcbiAgICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAgIGlmICRlbGVtLmZpbmQoJ2lmcmFtZScpLmxlbmd0aFxuICAgICAgICBAc2V0KG5hbWUsIEBtb2RlbC5jb250ZW50W25hbWVdKVxuXG5cbiAgZ2V0SW1hZ2U6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICAkZWxlbS5hdHRyKCdzcmMnKVxuXG5cbiAgc2V0SW1hZ2U6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG5cbiAgICBpZiB2YWx1ZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcblxuICAgICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLmdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGVsc2VcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gJC5wcm94eShAc2V0UGxhY2Vob2xkZXJJbWFnZSwgdGhpcywgJGVsZW0sIG5hbWUpXG4gICAgICBAZGVsYXlVbnRpbEF0dGFjaGVkKG5hbWUsIHNldFBsYWNlaG9sZGVyKSAjIHRvZG86IHJlcGxhY2Ugd2l0aCBAYWZ0ZXJJbnNlcnRlZCAtPiAuLi4gKHNvbWV0aGluZyBsaWtlICQuQ2FsbGJhY2tzKCdvbmNlIHJlbWVtYmVyJykpXG5cblxuICBzZXRQbGFjZWhvbGRlckltYWdlOiAoJGVsZW0sIG5hbWUpIC0+XG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lbXB0eUltYWdlKVxuICAgIGlmICRlbGVtWzBdLm5vZGVOYW1lID09ICdJTUcnXG4gICAgICB3aWR0aCA9ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLmhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgd2lkdGggPSAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICB2YWx1ZSA9IFwiaHR0cDovL3BsYWNlaG9sZC5pdC8je3dpZHRofXgje2hlaWdodH0vQkVGNTZGL0IyRTY2OFwiXG5cbiAgICBpbWFnZVNlcnZpY2UgPSBAbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkuZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICBpbWFnZVNlcnZpY2Uuc2V0KCRlbGVtLCB2YWx1ZSlcblxuXG4gIHNldFN0eWxlOiAobmFtZSwgY2xhc3NOYW1lKSAtPlxuICAgIGNoYW5nZXMgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdLmNzc0NsYXNzQ2hhbmdlcyhjbGFzc05hbWUpXG4gICAgaWYgY2hhbmdlcy5yZW1vdmVcbiAgICAgIGZvciByZW1vdmVDbGFzcyBpbiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgICBAJGh0bWwucmVtb3ZlQ2xhc3MocmVtb3ZlQ2xhc3MpXG5cbiAgICBAJGh0bWwuYWRkQ2xhc3MoY2hhbmdlcy5hZGQpXG5cblxuICAjIERpc2FibGUgdGFiYmluZyBmb3IgdGhlIGNoaWxkcmVuIG9mIGFuIGVsZW1lbnQuXG4gICMgVGhpcyBpcyB1c2VkIGZvciBodG1sIGNvbnRlbnQgc28gaXQgZG9lcyBub3QgZGlzcnVwdCB0aGUgdXNlclxuICAjIGV4cGVyaWVuY2UuIFRoZSB0aW1lb3V0IGlzIHVzZWQgZm9yIGNhc2VzIGxpa2UgdHdlZXRzIHdoZXJlIHRoZVxuICAjIGlmcmFtZSBpcyBnZW5lcmF0ZWQgYnkgYSBzY3JpcHQgd2l0aCBhIGRlbGF5LlxuICBkaXNhYmxlVGFiYmluZzogKCRlbGVtKSAtPlxuICAgIHNldFRpbWVvdXQoID0+XG4gICAgICAkZWxlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgLCA0MDApXG5cblxuICAjIEFwcGVuZCBhIGNoaWxkIHRvIHRoZSBlbGVtZW50IHdoaWNoIHdpbGwgYmxvY2sgdXNlciBpbnRlcmFjdGlvblxuICAjIGxpa2UgY2xpY2sgb3IgdG91Y2ggZXZlbnRzLiBBbHNvIHRyeSB0byBwcmV2ZW50IHRoZSB1c2VyIGZyb20gZ2V0dGluZ1xuICAjIGZvY3VzIG9uIGEgY2hpbGQgZWxlbW50IHRocm91Z2ggdGFiYmluZy5cbiAgYmxvY2tJbnRlcmFjdGlvbjogKCRlbGVtKSAtPlxuICAgIEBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uKCRlbGVtKVxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5pbnRlcmFjdGlvbkJsb2NrZXIgfSc+XCIpXG4gICAgICAuYXR0cignc3R5bGUnLCAncG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGJvdHRvbTogMDsgbGVmdDogMDsgcmlnaHQ6IDA7JylcbiAgICAkZWxlbS5hcHBlbmQoJGJsb2NrZXIpXG5cbiAgICBAZGlzYWJsZVRhYmJpbmcoJGVsZW0pXG5cblxuICAjIE1ha2Ugc3VyZSB0aGF0IGFsbCBhYnNvbHV0ZSBwb3NpdGlvbmVkIGNoaWxkcmVuIGFyZSBwb3NpdGlvbmVkXG4gICMgcmVsYXRpdmUgdG8gJGVsZW0uXG4gIGVuc3VyZVJlbGF0aXZlUG9zaXRpb246ICgkZWxlbSkgLT5cbiAgICBwb3NpdGlvbiA9ICRlbGVtLmNzcygncG9zaXRpb24nKVxuICAgIGlmIHBvc2l0aW9uICE9ICdhYnNvbHV0ZScgJiYgcG9zaXRpb24gIT0gJ2ZpeGVkJyAmJiBwb3NpdGlvbiAhPSAncmVsYXRpdmUnXG4gICAgICAkZWxlbS5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJylcblxuXG4gIGdldCRjb250YWluZXI6IC0+XG4gICAgJChkb20uZmluZENvbnRhaW5lcihAJGh0bWxbMF0pLm5vZGUpXG5cblxuICAjIFdhaXQgdG8gZXhlY3V0ZSBhIG1ldGhvZCB1bnRpbCB0aGUgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgRE9NXG4gIGRlbGF5VW50aWxBdHRhY2hlZDogKG5hbWUsIGZ1bmMpIC0+XG4gICAgaWYgQGlzQXR0YWNoZWRUb0RvbVxuICAgICAgZnVuYygpXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbERlbGF5ZWQobmFtZSlcbiAgICAgIEBkZWxheWVkIHx8PSB7fVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSBldmVudGluZy5jYWxsT25jZSBAd2FzQXR0YWNoZWRUb0RvbSwgPT5cbiAgICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZnVuYygpXG5cblxuICBjYW5jZWxEZWxheWVkOiAobmFtZSkgLT5cbiAgICBpZiBAZGVsYXllZD9bbmFtZV1cbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLnJlbW92ZShAZGVsYXllZFtuYW1lXSlcbiAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG5cblxuICBzdHJpcEh0bWxJZlJlYWRPbmx5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzUmVhZE9ubHlcblxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKEAkaHRtbFswXSlcbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgQHN0cmlwRG9jQ2xhc3NlcyhlbGVtKVxuICAgICAgQHN0cmlwRG9jQXR0cmlidXRlcyhlbGVtKVxuICAgICAgQHN0cmlwRW1wdHlBdHRyaWJ1dGVzKGVsZW0pXG5cblxuICBzdHJpcERvY0NsYXNzZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBrbGFzcyBpbiBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvXFxzKy8pXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcyhrbGFzcykgaWYgL2RvY1xcLS4qL2kudGVzdChrbGFzcylcblxuXG4gIHN0cmlwRG9jQXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgICAkZWxlbS5yZW1vdmVBdHRyKG5hbWUpIGlmIC9kYXRhXFwtZG9jXFwtLiovaS50ZXN0KG5hbWUpXG5cblxuICBzdHJpcEVtcHR5QXR0cmlidXRlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgc3RyaXBwYWJsZUF0dHJpYnV0ZXMgPSBbJ3N0eWxlJywgJ2NsYXNzJ11cbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgPSBzdHJpcHBhYmxlQXR0cmlidXRlcy5pbmRleE9mKGF0dHJpYnV0ZS5uYW1lKSA+PSAwXG4gICAgICBpc0VtcHR5QXR0cmlidXRlID0gYXR0cmlidXRlLnZhbHVlLnRyaW0oKSA9PSAnJ1xuICAgICAgaWYgaXNTdHJpcHBhYmxlQXR0cmlidXRlIGFuZCBpc0VtcHR5QXR0cmlidXRlXG4gICAgICAgICRlbGVtLnJlbW92ZUF0dHIoYXR0cmlidXRlLm5hbWUpXG5cblxuICBzZXRBdHRhY2hlZFRvRG9tOiAobmV3VmFsKSAtPlxuICAgIHJldHVybiBpZiBuZXdWYWwgPT0gQGlzQXR0YWNoZWRUb0RvbVxuXG4gICAgQGlzQXR0YWNoZWRUb0RvbSA9IG5ld1ZhbFxuXG4gICAgaWYgbmV3VmFsXG4gICAgICBAcmVzZXREaXJlY3RpdmVzKClcbiAgICAgIEB3YXNBdHRhY2hlZFRvRG9tLmZpcmUoKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmVyXG5cbiAgIyBAcGFyYW0geyBPYmplY3QgfVxuICAjIC0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfVxuICAjIC0gcmVuZGVyaW5nQ29udGFpbmVyIHsgUmVuZGVyaW5nQ29udGFpbmVyIH1cbiAgIyAtICR3cmFwcGVyIHsgalF1ZXJ5IG9iamVjdCB9IEEgd3JhcHBlciB3aXRoIGEgbm9kZSB3aXRoIGEgJ2RvYy1zZWN0aW9uJyBjc3MgY2xhc3Mgd2hlcmUgdG8gaW5zZXJ0IHRoZSBjb250ZW50LlxuICAjIC0gZXhjbHVkZUNvbXBvbmVudHMgeyBTdHJpbmcgb3IgQXJyYXkgfSBjb21wb25lbnRNb2RlbC5pZCBvciBhbiBhcnJheSBvZiBzdWNoLlxuICBjb25zdHJ1Y3RvcjogKHsgQGNvbXBvbmVudFRyZWUsIEByZW5kZXJpbmdDb250YWluZXIsICR3cmFwcGVyLCBleGNsdWRlQ29tcG9uZW50cyB9KSAtPlxuICAgIGFzc2VydCBAY29tcG9uZW50VHJlZSwgJ25vIGNvbXBvbmVudFRyZWUgc3BlY2lmaWVkJ1xuICAgIGFzc2VydCBAcmVuZGVyaW5nQ29udGFpbmVyLCAnbm8gcmVuZGVyaW5nIGNvbnRhaW5lciBzcGVjaWZpZWQnXG5cbiAgICBAJHJvb3QgPSAkKEByZW5kZXJpbmdDb250YWluZXIucmVuZGVyTm9kZSlcbiAgICBAJHdyYXBwZXJIdG1sID0gJHdyYXBwZXJcbiAgICBAY29tcG9uZW50Vmlld3MgPSB7fVxuXG4gICAgQGV4Y2x1ZGVkQ29tcG9uZW50SWRzID0ge31cbiAgICBAZXhjbHVkZUNvbXBvbmVudChleGNsdWRlQ29tcG9uZW50cylcbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAcmVuZGVyT25jZVBhZ2VSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gICMgQHBhcmFtIHsgU3RyaW5nIG9yIEFycmF5IH0gY29tcG9uZW50TW9kZWwuaWQgb3IgYW4gYXJyYXkgb2Ygc3VjaC5cbiAgZXhjbHVkZUNvbXBvbmVudDogKGNvbXBvbmVudElkKSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29tcG9uZW50SWQ/XG4gICAgaWYgJC5pc0FycmF5KGNvbXBvbmVudElkKVxuICAgICAgZm9yIGNvbXBJZCBpbiBjb21wb25lbnRJZFxuICAgICAgICBAZXhjbHVkZUNvbXBvbmVudChjb21wSWQpXG4gICAgZWxzZVxuICAgICAgQGV4Y2x1ZGVkQ29tcG9uZW50SWRzW2NvbXBvbmVudElkXSA9IHRydWVcbiAgICAgIHZpZXcgPSBAY29tcG9uZW50Vmlld3NbY29tcG9uZW50SWRdXG4gICAgICBpZiB2aWV3PyBhbmQgdmlldy5pc0F0dGFjaGVkVG9Eb21cbiAgICAgICAgQHJlbW92ZUNvbXBvbmVudCh2aWV3Lm1vZGVsKVxuXG5cbiAgc2V0Um9vdDogKCkgLT5cbiAgICBpZiBAJHdyYXBwZXJIdG1sPy5sZW5ndGggJiYgQCR3cmFwcGVySHRtbC5qcXVlcnlcbiAgICAgIHNlbGVjdG9yID0gXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIlxuICAgICAgJGluc2VydCA9IEAkd3JhcHBlckh0bWwuZmluZChzZWxlY3RvcikuYWRkKCBAJHdyYXBwZXJIdG1sLmZpbHRlcihzZWxlY3RvcikgKVxuICAgICAgaWYgJGluc2VydC5sZW5ndGhcbiAgICAgICAgQCR3cmFwcGVyID0gQCRyb290XG4gICAgICAgIEAkd3JhcHBlci5hcHBlbmQoQCR3cmFwcGVySHRtbClcbiAgICAgICAgQCRyb290ID0gJGluc2VydFxuXG4gICAgIyBTdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50VHJlZSBpbiB0aGUgJHJvb3Qgbm9kZS5cbiAgICAjIFNvbWUgZG9tLmNvZmZlZSBtZXRob2RzIG5lZWQgaXQgdG8gZ2V0IGhvbGQgb2YgdGhlIGNvbXBvbmVudFRyZWVcbiAgICBAJHJvb3QuZGF0YSgnY29tcG9uZW50VHJlZScsIEBjb21wb25lbnRUcmVlKVxuXG5cbiAgcmVuZGVyT25jZVBhZ2VSZWFkeTogLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuaW5jcmVtZW50KClcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLnJlYWR5ID0+XG4gICAgICBAc2V0Um9vdCgpXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEBzZXR1cENvbXBvbmVudFRyZWVMaXN0ZW5lcnMoKVxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcblxuXG4gIGlzUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmlzUmVhZHkoKVxuXG5cbiAgaHRtbDogLT5cbiAgICBhc3NlcnQgQGlzUmVhZHkoKSwgJ0Nhbm5vdCBnZW5lcmF0ZSBodG1sLiBSZW5kZXJlciBpcyBub3QgcmVhZHkuJ1xuICAgIEByZW5kZXJpbmdDb250YWluZXIuaHRtbCgpXG5cblxuICAjIENvbXBvbmVudFRyZWUgRXZlbnQgSGFuZGxpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0dXBDb21wb25lbnRUcmVlTGlzdGVuZXJzOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudEFkZGVkLmFkZCggJC5wcm94eShAY29tcG9uZW50QWRkZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRSZW1vdmVkLmFkZCggJC5wcm94eShAY29tcG9uZW50UmVtb3ZlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudE1vdmVkLmFkZCggJC5wcm94eShAY29tcG9uZW50TW92ZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRDb250ZW50Q2hhbmdlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudENvbnRlbnRDaGFuZ2VkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50SHRtbENoYW5nZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRIdG1sQ2hhbmdlZCwgdGhpcykgKVxuXG5cbiAgY29tcG9uZW50QWRkZWQ6IChtb2RlbCkgLT5cbiAgICBAaW5zZXJ0Q29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY29tcG9uZW50UmVtb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVDb21wb25lbnQobW9kZWwpXG4gICAgQGRlbGV0ZUNhY2hlZENvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpXG5cblxuICBjb21wb25lbnRNb3ZlZDogKG1vZGVsKSAtPlxuICAgIEByZW1vdmVDb21wb25lbnQobW9kZWwpXG4gICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNvbXBvbmVudENvbnRlbnRDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnVwZGF0ZUNvbnRlbnQoKVxuXG5cbiAgY29tcG9uZW50SHRtbENoYW5nZWQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkudXBkYXRlSHRtbCgpXG5cblxuICAjIFJlbmRlcmluZ1xuICAjIC0tLS0tLS0tLVxuXG5cbiAgY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3c1ttb2RlbC5pZF0gfHw9IG1vZGVsLmNyZWF0ZVZpZXcoQHJlbmRlcmluZ0NvbnRhaW5lci5pc1JlYWRPbmx5KVxuXG5cbiAgZGVsZXRlQ2FjaGVkQ29tcG9uZW50Vmlld0ZvckNvbXBvbmVudDogKG1vZGVsKSAtPlxuICAgIGRlbGV0ZSBAY29tcG9uZW50Vmlld3NbbW9kZWwuaWRdXG5cblxuICByZW5kZXI6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAaW5zZXJ0Q29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY2xlYXI6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuZWFjaCAobW9kZWwpID0+XG4gICAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcblxuICAgIEAkcm9vdC5lbXB0eSgpXG5cblxuICByZWRyYXc6IC0+XG4gICAgQGNsZWFyKClcbiAgICBAcmVuZGVyKClcblxuXG4gIGluc2VydENvbXBvbmVudDogKG1vZGVsKSAtPlxuICAgIHJldHVybiBpZiBAaXNDb21wb25lbnRBdHRhY2hlZChtb2RlbCkgfHwgQGV4Y2x1ZGVkQ29tcG9uZW50SWRzW21vZGVsLmlkXSA9PSB0cnVlXG5cbiAgICBpZiBAaXNDb21wb25lbnRBdHRhY2hlZChtb2RlbC5wcmV2aW91cylcbiAgICAgIEBpbnNlcnRDb21wb25lbnRBc1NpYmxpbmcobW9kZWwucHJldmlvdXMsIG1vZGVsKVxuICAgIGVsc2UgaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwubmV4dClcbiAgICAgIEBpbnNlcnRDb21wb25lbnRBc1NpYmxpbmcobW9kZWwubmV4dCwgbW9kZWwpXG4gICAgZWxzZSBpZiBtb2RlbC5wYXJlbnRDb250YWluZXJcbiAgICAgIEBhcHBlbmRDb21wb25lbnRUb1BhcmVudENvbnRhaW5lcihtb2RlbClcbiAgICBlbHNlXG4gICAgICBsb2cuZXJyb3IoJ0NvbXBvbmVudCBjb3VsZCBub3QgYmUgaW5zZXJ0ZWQgYnkgcmVuZGVyZXIuJylcblxuICAgIGNvbXBvbmVudFZpZXcgPSBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbClcbiAgICBjb21wb25lbnRWaWV3LnNldEF0dGFjaGVkVG9Eb20odHJ1ZSlcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmNvbXBvbmVudFZpZXdXYXNJbnNlcnRlZChjb21wb25lbnRWaWV3KVxuICAgIEBhdHRhY2hDaGlsZENvbXBvbmVudHMobW9kZWwpXG5cblxuICBpc0NvbXBvbmVudEF0dGFjaGVkOiAobW9kZWwpIC0+XG4gICAgbW9kZWwgJiYgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLmlzQXR0YWNoZWRUb0RvbVxuXG5cbiAgYXR0YWNoQ2hpbGRDb21wb25lbnRzOiAobW9kZWwpIC0+XG4gICAgbW9kZWwuY2hpbGRyZW4gKGNoaWxkTW9kZWwpID0+XG4gICAgICBpZiBub3QgQGlzQ29tcG9uZW50QXR0YWNoZWQoY2hpbGRNb2RlbClcbiAgICAgICAgQGluc2VydENvbXBvbmVudChjaGlsZE1vZGVsKVxuXG5cbiAgaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nOiAoc2libGluZywgbW9kZWwpIC0+XG4gICAgbWV0aG9kID0gaWYgc2libGluZyA9PSBtb2RlbC5wcmV2aW91cyB0aGVuICdhZnRlcicgZWxzZSAnYmVmb3JlJ1xuICAgIEAkbm9kZUZvckNvbXBvbmVudChzaWJsaW5nKVttZXRob2RdKEAkbm9kZUZvckNvbXBvbmVudChtb2RlbCkpXG5cblxuICBhcHBlbmRDb21wb25lbnRUb1BhcmVudENvbnRhaW5lcjogKG1vZGVsKSAtPlxuICAgIEAkbm9kZUZvckNvbXBvbmVudChtb2RlbCkuYXBwZW5kVG8oQCRub2RlRm9yQ29udGFpbmVyKG1vZGVsLnBhcmVudENvbnRhaW5lcikpXG5cblxuICAkbm9kZUZvckNvbXBvbmVudDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS4kaHRtbFxuXG5cbiAgJG5vZGVGb3JDb250YWluZXI6IChjb250YWluZXIpIC0+XG4gICAgaWYgY29udGFpbmVyLmlzUm9vdFxuICAgICAgQCRyb290XG4gICAgZWxzZVxuICAgICAgcGFyZW50VmlldyA9IEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KGNvbnRhaW5lci5wYXJlbnRDb21wb25lbnQpXG4gICAgICAkKHBhcmVudFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChjb250YWluZXIubmFtZSkpXG5cblxuICByZW1vdmVDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuc2V0QXR0YWNoZWRUb0RvbShmYWxzZSlcbiAgICBAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpLmRldGFjaCgpXG5cbiIsIlJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZW5kZXJlcicpXG5QYWdlID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlJylcbkludGVyYWN0aXZlUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmlld1xuXG4gIGNvbnN0cnVjdG9yOiAoQGNvbXBvbmVudFRyZWUsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgQGlmcmFtZSA9IGlmcmFtZVxuICAgICAgcmVuZGVyZXIgPSBAY3JlYXRlSUZyYW1lUmVuZGVyZXIoaWZyYW1lLCBvcHRpb25zKVxuICAgICAgaWZyYW1lOiBpZnJhbWVcbiAgICAgIHJlbmRlcmVyOiByZW5kZXJlclxuXG5cbiAgY3JlYXRlSUZyYW1lOiAocGFyZW50KSAtPlxuICAgIGRlZmVycmVkID0gJC5EZWZlcnJlZCgpXG5cbiAgICBpZnJhbWUgPSBwYXJlbnQub3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKVxuICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnXG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVCb3JkZXInLCAnMCcpXG4gICAgaWZyYW1lLm9ubG9hZCA9IC0+IGRlZmVycmVkLnJlc29sdmUoaWZyYW1lKVxuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGlmcmFtZSlcbiAgICBkZWZlcnJlZC5wcm9taXNlKClcblxuXG4gIGNyZWF0ZUlGcmFtZVJlbmRlcmVyOiAoaWZyYW1lLCBvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVSZW5kZXJlclxuICAgICAgcmVuZGVyTm9kZTogaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5XG4gICAgICBvcHRpb25zOiBvcHRpb25zXG5cblxuICBjcmVhdGVSZW5kZXJlcjogKHsgcmVuZGVyTm9kZSwgb3B0aW9ucyB9PXt9KSAtPlxuICAgIHBhcmFtcyA9XG4gICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlIHx8IEBwYXJlbnRcbiAgICAgIGRlc2lnbjogQGNvbXBvbmVudFRyZWUuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcblxuICAgIG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgY29tcG9uZW50VHJlZTogQGNvbXBvbmVudFRyZWVcbiAgICAgICR3cmFwcGVyOiBvcHRpb25zLiR3cmFwcGVyXG5cblxuICBjcmVhdGVQYWdlOiAocGFyYW1zLCB7IGludGVyYWN0aXZlLCByZWFkT25seSwgbG9hZFJlc291cmNlcyB9PXt9KSAtPlxuICAgIHBhcmFtcyA/PSB7fVxuICAgIHBhcmFtcy5sb2FkUmVzb3VyY2VzID0gbG9hZFJlc291cmNlc1xuICAgIGlmIGludGVyYWN0aXZlP1xuICAgICAgQGlzSW50ZXJhY3RpdmUgPSB0cnVlXG4gICAgICBuZXcgSW50ZXJhY3RpdmVQYWdlKHBhcmFtcylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFnZShwYXJhbXMpXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENzc0xvYWRlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHdpbmRvdykgLT5cbiAgICBAbG9hZGVkVXJscyA9IFtdXG5cblxuICBsb2FkOiAodXJscywgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc0Rpc2FibGVkXG5cbiAgICB1cmxzID0gW3VybHNdIHVubGVzcyAkLmlzQXJyYXkodXJscylcbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgQGxvYWRTaW5nbGVVcmwodXJsLCBzZW1hcGhvcmUud2FpdCgpKSBmb3IgdXJsIGluIHVybHNcbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgZGlzYWJsZTogLT5cbiAgICBAaXNEaXNhYmxlZCA9IHRydWVcblxuXG4gICMgQHByaXZhdGVcbiAgbG9hZFNpbmdsZVVybDogKHVybCwgY2FsbGJhY2s9JC5ub29wKSAtPlxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc0Rpc2FibGVkXG5cbiAgICBpZiBAaXNVcmxMb2FkZWQodXJsKVxuICAgICAgY2FsbGJhY2soKVxuICAgIGVsc2VcbiAgICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgICAgbGluay5vbmxvYWQgPSBjYWxsYmFja1xuXG4gICAgICAjIERvIG5vdCBwcmV2ZW50IHRoZSBwYWdlIGZyb20gbG9hZGluZyBiZWNhdXNlIG9mIGNzcyBlcnJvcnNcbiAgICAgICMgb25lcnJvciBpcyBub3Qgc3VwcG9ydGVkIGJ5IGV2ZXJ5IGJyb3dzZXIuXG4gICAgICAjIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC9saW5rXG4gICAgICBsaW5rLm9uZXJyb3IgPSAtPlxuICAgICAgICBjb25zb2xlLndhcm4gXCJTdHlsZXNoZWV0IGNvdWxkIG5vdCBiZSBsb2FkZWQ6ICN7IHVybCB9XCJcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgICBsaW5rLmhyZWYgPSB1cmxcbiAgICAgIEB3aW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKVxuICAgICAgQG1hcmtVcmxBc0xvYWRlZCh1cmwpXG5cblxuICAjIEBwcml2YXRlXG4gIGlzVXJsTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLmluZGV4T2YodXJsKSA+PSAwXG5cblxuICAjIEBwcml2YXRlXG4gIG1hcmtVcmxBc0xvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5wdXNoKHVybClcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcbkNvbXBvbmVudERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9jb21wb25lbnRfZHJhZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdG9yUGFnZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXRXaW5kb3coKVxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuXG4gICAgIyBTdHVic1xuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPVxuICAgICAgZGlzYWJsZUFsbDogLT5cbiAgICAgIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBjb21wb25lbnRXYXNEcm9wcGVkID1cbiAgICAgIGZpcmU6IC0+XG4gICAgQGJsdXJGb2N1c2VkRWxlbWVudCA9IC0+XG5cblxuICBzdGFydERyYWc6ICh7IGNvbXBvbmVudE1vZGVsLCBjb21wb25lbnRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb21wb25lbnRNb2RlbCB8fCBjb21wb25lbnRWaWV3XG4gICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRWaWV3Lm1vZGVsIGlmIGNvbXBvbmVudFZpZXdcblxuICAgIGNvbXBvbmVudERyYWcgPSBuZXcgQ29tcG9uZW50RHJhZ1xuICAgICAgY29tcG9uZW50TW9kZWw6IGNvbXBvbmVudE1vZGVsXG4gICAgICBjb21wb25lbnRWaWV3OiBjb21wb25lbnRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoY29tcG9uZW50RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIHNldFdpbmRvdzogLT5cbiAgICBAd2luZG93ID0gd2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuUGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuRm9jdXMgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9mb2N1cycpXG5FZGl0YWJsZUNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyJylcbkRyYWdCYXNlID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZHJhZ19iYXNlJylcbkNvbXBvbmVudERyYWcgPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9jb21wb25lbnRfZHJhZycpXG5cbiMgQW4gSW50ZXJhY3RpdmVQYWdlIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhbGxvd3MgZm9yIG1hbmlwdWxhdGlvbiBvZiB0aGVcbiMgcmVuZGVyZWQgQ29tcG9uZW50VHJlZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW50ZXJhY3RpdmVQYWdlIGV4dGVuZHMgUGFnZVxuXG4gIExFRlRfTU9VU0VfQlVUVE9OID0gMVxuXG4gIGlzUmVhZE9ubHk6IGZhbHNlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgaG9zdFdpbmRvdyB9PXt9KSAtPlxuICAgIHN1cGVyXG5cbiAgICBAZm9jdXMgPSBuZXcgRm9jdXMoKVxuICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIgPSBuZXcgRWRpdGFibGVDb250cm9sbGVyKHRoaXMpXG5cbiAgICAjIGV2ZW50c1xuICAgIEBpbWFnZUNsaWNrID0gJC5DYWxsYmFja3MoKSAjIChjb21wb25lbnRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBodG1sRWxlbWVudENsaWNrID0gJC5DYWxsYmFja3MoKSAjIChjb21wb25lbnRWaWV3LCBmaWVsZE5hbWUsIGV2ZW50KSAtPlxuICAgIEBjb21wb25lbnRXaWxsQmVEcmFnZ2VkID0gJC5DYWxsYmFja3MoKSAjIChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBAY29tcG9uZW50V2FzRHJvcHBlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgQGRyYWdCYXNlID0gbmV3IERyYWdCYXNlKHRoaXMpXG4gICAgQGZvY3VzLmNvbXBvbmVudEZvY3VzLmFkZCggJC5wcm94eShAYWZ0ZXJDb21wb25lbnRGb2N1c2VkLCB0aGlzKSApXG4gICAgQGZvY3VzLmNvbXBvbmVudEJsdXIuYWRkKCAkLnByb3h5KEBhZnRlckNvbXBvbmVudEJsdXJyZWQsIHRoaXMpIClcbiAgICBAYmVmb3JlSW50ZXJhY3RpdmVQYWdlUmVhZHkoKVxuICAgIEAkZG9jdW1lbnRcbiAgICAgIC5vbignbW91c2Vkb3duLmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCd0b3VjaHN0YXJ0LmxpdmluZ2RvY3MnLCAkLnByb3h5KEBtb3VzZWRvd24sIHRoaXMpKVxuICAgICAgLm9uKCdkcmFnc3RhcnQnLCAkLnByb3h5KEBicm93c2VyRHJhZ1N0YXJ0LCB0aGlzKSlcblxuXG4gIGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5OiAtPlxuICAgIGlmIGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZVxuICAgICAgQGNzc0xvYWRlci5sb2FkKGNvbmZpZy5saXZpbmdkb2NzQ3NzRmlsZSwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gICMgcHJldmVudCB0aGUgYnJvd3NlciBEcmFnJkRyb3AgZnJvbSBpbnRlcmZlcmluZ1xuICBicm93c2VyRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cblxuICByZW1vdmVMaXN0ZW5lcnM6IC0+XG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzJylcbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG5cblxuICBtb3VzZWRvd246IChldmVudCkgLT5cbiAgICByZXR1cm4gaWYgZXZlbnQud2hpY2ggIT0gTEVGVF9NT1VTRV9CVVRUT04gJiYgZXZlbnQudHlwZSA9PSAnbW91c2Vkb3duJyAjIG9ubHkgcmVzcG9uZCB0byBsZWZ0IG1vdXNlIGJ1dHRvblxuXG4gICAgIyBJZ25vcmUgaW50ZXJhY3Rpb25zIG9uIGNlcnRhaW4gZWxlbWVudHNcbiAgICBpc0NvbnRyb2wgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChjb25maWcuaWdub3JlSW50ZXJhY3Rpb24pLmxlbmd0aFxuICAgIHJldHVybiBpZiBpc0NvbnRyb2xcblxuICAgICMgSWRlbnRpZnkgdGhlIGNsaWNrZWQgY29tcG9uZW50XG4gICAgY29tcG9uZW50VmlldyA9IGRvbS5maW5kQ29tcG9uZW50VmlldyhldmVudC50YXJnZXQpXG5cbiAgICAjIFRoaXMgaXMgY2FsbGVkIGluIG1vdXNlZG93biBzaW5jZSBlZGl0YWJsZXMgZ2V0IGZvY3VzIG9uIG1vdXNlZG93blxuICAgICMgYW5kIG9ubHkgYmVmb3JlIHRoZSBlZGl0YWJsZXMgY2xlYXIgdGhlaXIgcGxhY2Vob2xkZXIgY2FuIHdlIHNhZmVseVxuICAgICMgaWRlbnRpZnkgd2hlcmUgdGhlIHVzZXIgaGFzIGNsaWNrZWQuXG4gICAgQGhhbmRsZUNsaWNrZWRDb21wb25lbnQoZXZlbnQsIGNvbXBvbmVudFZpZXcpXG5cbiAgICBpZiBjb21wb25lbnRWaWV3XG4gICAgICBAc3RhcnREcmFnXG4gICAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcbiAgICAgICAgZXZlbnQ6IGV2ZW50XG5cblxuICBzdGFydERyYWc6ICh7IGNvbXBvbmVudE1vZGVsLCBjb21wb25lbnRWaWV3LCBldmVudCwgY29uZmlnIH0pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb21wb25lbnRNb2RlbCB8fCBjb21wb25lbnRWaWV3XG4gICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRWaWV3Lm1vZGVsIGlmIGNvbXBvbmVudFZpZXdcblxuICAgIGNvbXBvbmVudERyYWcgPSBuZXcgQ29tcG9uZW50RHJhZ1xuICAgICAgY29tcG9uZW50TW9kZWw6IGNvbXBvbmVudE1vZGVsXG4gICAgICBjb21wb25lbnRWaWV3OiBjb21wb25lbnRWaWV3XG5cbiAgICBjb25maWcgPz1cbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuXG4gICAgQGRyYWdCYXNlLmluaXQoY29tcG9uZW50RHJhZywgZXZlbnQsIGNvbmZpZylcblxuXG4gIGNhbmNlbERyYWc6IC0+XG4gICAgQGRyYWdCYXNlLmNhbmNlbCgpXG5cblxuICBoYW5kbGVDbGlja2VkQ29tcG9uZW50OiAoZXZlbnQsIGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgQGZvY3VzLmNvbXBvbmVudEZvY3VzZWQoY29tcG9uZW50VmlldylcblxuICAgICAgbm9kZUNvbnRleHQgPSBkb20uZmluZE5vZGVDb250ZXh0KGV2ZW50LnRhcmdldClcbiAgICAgIGlmIG5vZGVDb250ZXh0XG4gICAgICAgIHN3aXRjaCBub2RlQ29udGV4dC5jb250ZXh0QXR0clxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaW1hZ2UucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaW1hZ2VDbGljay5maXJlKGNvbXBvbmVudFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmh0bWwucmVuZGVyZWRBdHRyXG4gICAgICAgICAgICBAaHRtbEVsZW1lbnRDbGljay5maXJlKGNvbXBvbmVudFZpZXcsIG5vZGVDb250ZXh0LmF0dHJOYW1lLCBldmVudClcbiAgICBlbHNlXG4gICAgICBAZm9jdXMuYmx1cigpXG5cblxuICBnZXRGb2N1c2VkRWxlbWVudDogLT5cbiAgICB3aW5kb3cuZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuXG5cbiAgYmx1ckZvY3VzZWRFbGVtZW50OiAtPlxuICAgIEBmb2N1cy5zZXRGb2N1cyh1bmRlZmluZWQpXG4gICAgZm9jdXNlZEVsZW1lbnQgPSBAZ2V0Rm9jdXNlZEVsZW1lbnQoKVxuICAgICQoZm9jdXNlZEVsZW1lbnQpLmJsdXIoKSBpZiBmb2N1c2VkRWxlbWVudFxuXG5cbiAgY29tcG9uZW50Vmlld1dhc0luc2VydGVkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhjb21wb25lbnRWaWV3KVxuXG5cbiAgaW5pdGlhbGl6ZUVkaXRhYmxlczogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgY29tcG9uZW50Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBjb21wb25lbnRWaWV3LmRpcmVjdGl2ZXMuZWRpdGFibGVcbiAgICAgICAgZGlyZWN0aXZlLmVsZW1cblxuICAgICAgQGVkaXRhYmxlQ29udHJvbGxlci5hZGQoZWRpdGFibGVOb2RlcylcblxuXG4gIGFmdGVyQ29tcG9uZW50Rm9jdXNlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgY29tcG9uZW50Vmlldy5hZnRlckZvY3VzZWQoKVxuXG5cbiAgYWZ0ZXJDb21wb25lbnRCbHVycmVkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBjb21wb25lbnRWaWV3LmFmdGVyQmx1cnJlZCgpXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5Dc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzc19sb2FkZXInKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIEEgUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFJlbmRlcmluZ0NvbnRhaW5lciB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSBzaG93biB0b1xuIyB0aGUgdXNlci4gSXQgaGFzIGEgTG9hZGVyIHdoaWNoIGFsbG93cyB5b3UgdG8gaW5qZWN0IENTUyBhbmQgSlMgZmlsZXMgaW50byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGFnZSBleHRlbmRzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCByZWFkT25seSwgaG9zdFdpbmRvdywgQGRlc2lnbiwgQGNvbXBvbmVudFRyZWUsIEBsb2FkUmVzb3VyY2VzIH09e30pIC0+XG4gICAgQGlzUmVhZE9ubHkgPSByZWFkT25seSBpZiByZWFkT25seT9cbiAgICBAcmVuZGVyTm9kZSA9IGlmIHJlbmRlck5vZGU/LmpxdWVyeSB0aGVuIHJlbmRlck5vZGVbMF0gZWxzZSByZW5kZXJOb2RlXG4gICAgQHNldFdpbmRvdyhob3N0V2luZG93KVxuICAgIEByZW5kZXJOb2RlID89ICQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIiwgQCRib2R5KVxuXG4gICAgc3VwZXIoKVxuXG4gICAgQGNzc0xvYWRlciA9IG5ldyBDc3NMb2FkZXIoQHdpbmRvdylcbiAgICBAY3NzTG9hZGVyLmRpc2FibGUoKSBpZiBub3QgQHNob3VsZExvYWRSZXNvdXJjZXMoKVxuICAgIEBiZWZvcmVQYWdlUmVhZHkoKVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBzaG91bGRMb2FkUmVzb3VyY2VzOiAtPlxuICAgIGlmIEBsb2FkUmVzb3VyY2VzP1xuICAgICAgQm9vbGVhbihAbG9hZFJlc291cmNlcylcbiAgICBlbHNlXG4gICAgICBCb29sZWFuKGNvbmZpZy5sb2FkUmVzb3VyY2VzKVxuXG5cbiAgIyB0b2RvOiBtb3ZlIHBhdGggcmVzb2x1dGlvbnMgdG8gZGVzaWduLmFzc2V0c1xuICBiZWZvcmVQYWdlUmVhZHk6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAZGVzaWduXG4gICAgQGRlc2lnbi5hc3NldHMubG9hZENzcyhAY3NzTG9hZGVyLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgc2V0V2luZG93OiAoaG9zdFdpbmRvdykgLT5cbiAgICBob3N0V2luZG93ID89IEBnZXRQYXJlbnRXaW5kb3coQHJlbmRlck5vZGUpXG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuICBnZXRQYXJlbnRXaW5kb3c6IChlbGVtKSAtPlxuICAgIGlmIGVsZW0/XG4gICAgICBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICBlbHNlXG4gICAgICB3aW5kb3dcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbiMgQSBSZW5kZXJpbmdDb250YWluZXIgaXMgdXNlZCBieSB0aGUgUmVuZGVyZXIgdG8gZ2VuZXJhdGUgSFRNTC5cbiNcbiMgVGhlIFJlbmRlcmVyIGluc2VydHMgQ29tcG9uZW50Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPz0gJCgnPGRpdi8+JylbMF1cbiAgICBAcmVhZHlTZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBAYmVmb3JlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICBodG1sOiAtPlxuICAgICQoQHJlbmRlck5vZGUpLmh0bWwoKVxuXG5cbiAgY29tcG9uZW50Vmlld1dhc0luc2VydGVkOiAoY29tcG9uZW50VmlldykgLT5cblxuXG4gICMgVGhpcyBpcyBjYWxsZWQgYmVmb3JlIHRoZSBzZW1hcGhvcmUgaXMgc3RhcnRlZCB0byBnaXZlIHN1YmNsYXNzZXMgYSBjaGFuY2VcbiAgIyB0byBpbmNyZW1lbnQgdGhlIHNlbWFwaG9yZSBzbyBpdCBkb2VzIG5vdCBmaXJlIGltbWVkaWF0ZWx5LlxuICBiZWZvcmVSZWFkeTogLT5cblxuXG4gIHJlYWR5OiAoY2FsbGJhY2spIC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5lZGl0b3JDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5kb20gPSByZXF1aXJlKCcuLi9pbnRlcmFjdGlvbi9kb20nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBuYW1lLCBAdHlwZSwgQGVsZW0sIGNvbmZpZyB9KSAtPlxuICAgIEBjb25maWcgPSBPYmplY3QuY3JlYXRlKGVkaXRvckNvbmZpZy5kaXJlY3RpdmVzW0B0eXBlXSlcbiAgICBAbmFtZSA9IG5hbWUgfHwgQGNvbmZpZy5kZWZhdWx0TmFtZVxuICAgIEBzZXRDb25maWcoY29uZmlnKVxuICAgIEBvcHRpb25hbCA9IGZhbHNlXG5cblxuICBzZXRDb25maWc6IChjb25maWcpIC0+XG4gICAgJC5leHRlbmQoQGNvbmZpZywgY29uZmlnKVxuXG5cbiAgcmVuZGVyZWRBdHRyOiAtPlxuICAgIEBjb25maWcucmVuZGVyZWRBdHRyXG5cblxuICBpc0VsZW1lbnREaXJlY3RpdmU6IC0+XG4gICAgQGNvbmZpZy5lbGVtZW50RGlyZWN0aXZlXG5cblxuICAjIFJldHVybiB0aGUgbm9kZU5hbWUgaW4gbG93ZXIgY2FzZVxuICBnZXRUYWdOYW1lOiAtPlxuICAgIEBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKClcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBDb21wb25lbnRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWQgZnJvbSB0aGVcbiAgIyB0ZW1wbGF0ZSBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3XG4gIGNsb25lOiAtPlxuICAgIG5ld0RpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmUobmFtZTogQG5hbWUsIHR5cGU6IEB0eXBlLCBjb25maWc6IEBjb25maWcpXG4gICAgbmV3RGlyZWN0aXZlLm9wdGlvbmFsID0gQG9wdGlvbmFsXG4gICAgbmV3RGlyZWN0aXZlXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQGVsZW0pXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbiMgQSBsaXN0IG9mIGFsbCBkaXJlY3RpdmVzIG9mIGEgdGVtcGxhdGVcbiMgRXZlcnkgbm9kZSB3aXRoIGFuIGRvYy0gYXR0cmlidXRlIHdpbGwgYmUgc3RvcmVkIGJ5IGl0cyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUNvbGxlY3Rpb25cblxuICBjb25zdHJ1Y3RvcjogKEBhbGw9e30pIC0+XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIGFkZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBAYXNzZXJ0TmFtZU5vdFVzZWQoZGlyZWN0aXZlKVxuXG4gICAgIyBjcmVhdGUgcHNldWRvIGFycmF5XG4gICAgdGhpc1tAbGVuZ3RoXSA9IGRpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZS5pbmRleCA9IEBsZW5ndGhcbiAgICBAbGVuZ3RoICs9IDFcblxuICAgICMgaW5kZXggYnkgbmFtZVxuICAgIEBhbGxbZGlyZWN0aXZlLm5hbWVdID0gZGlyZWN0aXZlXG5cbiAgICAjIGluZGV4IGJ5IHR5cGVcbiAgICAjIGRpcmVjdGl2ZS50eXBlIGlzIG9uZSBvZiB0aG9zZSAnY29udGFpbmVyJywgJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0gfHw9IFtdXG4gICAgdGhpc1tkaXJlY3RpdmUudHlwZV0ucHVzaChkaXJlY3RpdmUpXG4gICAgZGlyZWN0aXZlXG5cblxuICBuZXh0OiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuICAgIHRoaXNbZGlyZWN0aXZlLmluZGV4ICs9IDFdXG5cblxuICBuZXh0T2ZUeXBlOiAobmFtZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBuYW1lIGlmIG5hbWUgaW5zdGFuY2VvZiBEaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUgPz0gQGFsbFtuYW1lXVxuXG4gICAgcmVxdWlyZWRUeXBlID0gZGlyZWN0aXZlLnR5cGVcbiAgICB3aGlsZSBkaXJlY3RpdmUgPSBAbmV4dChkaXJlY3RpdmUpXG4gICAgICByZXR1cm4gZGlyZWN0aXZlIGlmIGRpcmVjdGl2ZS50eXBlIGlzIHJlcXVpcmVkVHlwZVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAYWxsW25hbWVdXG5cblxuICBjb3VudDogKHR5cGUpIC0+XG4gICAgaWYgdHlwZVxuICAgICAgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQGxlbmd0aFxuXG5cbiAgbmFtZXM6ICh0eXBlKSAtPlxuICAgIHJldHVybiBbXSB1bmxlc3MgdGhpc1t0eXBlXT8ubGVuZ3RoXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICBkaXJlY3RpdmUubmFtZVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaE9mVHlwZTogKHR5cGUsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHRoaXNbdHlwZV1cbiAgICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBlYWNoRWRpdGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnZWRpdGFibGUnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hJbWFnZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdpbWFnZScsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdjb250YWluZXInLCBjYWxsYmFjaylcblxuXG4gIGVhY2hIdG1sOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2h0bWwnLCBjYWxsYmFjaylcblxuXG4gIGNsb25lOiAtPlxuICAgIG5ld0NvbGxlY3Rpb24gPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIG5ld0NvbGxlY3Rpb24uYWRkKGRpcmVjdGl2ZS5jbG9uZSgpKVxuXG4gICAgbmV3Q29sbGVjdGlvblxuXG5cbiAgIyBoZWxwZXIgdG8gZGlyZWN0bHkgZ2V0IGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3RcbiAgIyB0b2RvOiByZW5hbWUgb3IgYmV0dGVyIHJlbW92ZVxuICAkZ2V0RWxlbTogKG5hbWUpIC0+XG4gICAgJChAYWxsW25hbWVdLmVsZW0pXG5cblxuICBhc3NlcnRBbGxMaW5rZWQ6IC0+XG4gICAgQGVhY2ggKGRpcmVjdGl2ZSkgLT5cbiAgICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGlyZWN0aXZlLmVsZW1cblxuICAgIHJldHVybiB0cnVlXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBhc3NlcnROYW1lTm90VXNlZDogKGRpcmVjdGl2ZSkgLT5cbiAgICBhc3NlcnQgZGlyZWN0aXZlICYmIG5vdCBAYWxsW2RpcmVjdGl2ZS5uYW1lXSxcbiAgICAgIFwiXCJcIlxuICAgICAgI3tkaXJlY3RpdmUudHlwZX0gVGVtcGxhdGUgcGFyc2luZyBlcnJvcjpcbiAgICAgICN7IGNvbmZpZy5kaXJlY3RpdmVzW2RpcmVjdGl2ZS50eXBlXS5yZW5kZXJlZEF0dHIgfT1cIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIi5cbiAgICAgIFwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiIGlzIGEgZHVwbGljYXRlIG5hbWUuXG4gICAgICBcIlwiXCJcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBwYXJzZTogKGVsZW0pIC0+XG4gICAgZWxlbURpcmVjdGl2ZSA9IHVuZGVmaW5lZFxuICAgIG1vZGlmaWNhdGlvbnMgPSBbXVxuICAgIEBwYXJzZURpcmVjdGl2ZXMgZWxlbSwgKGRpcmVjdGl2ZSkgLT5cbiAgICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgICBlbGVtRGlyZWN0aXZlID0gZGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGlmaWNhdGlvbnMucHVzaChkaXJlY3RpdmUpXG5cbiAgICBAYXBwbHlNb2RpZmljYXRpb25zKGVsZW1EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIGlmIGVsZW1EaXJlY3RpdmVcbiAgICByZXR1cm4gZWxlbURpcmVjdGl2ZVxuXG5cbiAgcGFyc2VEaXJlY3RpdmVzOiAoZWxlbSwgZnVuYykgLT5cbiAgICBkaXJlY3RpdmVEYXRhID0gW11cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIGF0dHJpYnV0ZU5hbWUgPSBhdHRyLm5hbWVcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0cmlidXRlTmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlRGF0YS5wdXNoXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogYXR0cmlidXRlTmFtZVxuICAgICAgICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVxuICAgICAgICAgICAgbmFtZTogYXR0ci52YWx1ZVxuICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgZWxlbTogZWxlbVxuXG4gICAgIyBTaW5jZSB3ZSBtb2RpZnkgdGhlIGF0dHJpYnV0ZXMgd2UgaGF2ZSB0byBzcGxpdFxuICAgICMgdGhpcyBpbnRvIHR3byBsb29wc1xuICAgIGZvciBkYXRhIGluIGRpcmVjdGl2ZURhdGFcbiAgICAgIGRpcmVjdGl2ZSA9IGRhdGEuZGlyZWN0aXZlXG4gICAgICBAcmV3cml0ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGRhdGEuYXR0cmlidXRlTmFtZSlcbiAgICAgIGZ1bmMoZGlyZWN0aXZlKVxuXG5cbiAgYXBwbHlNb2RpZmljYXRpb25zOiAobWFpbkRpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIG1vZGlmaWNhdGlvbnNcbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdvcHRpb25hbCdcbiAgICAgICAgICBtYWluRGlyZWN0aXZlLm9wdGlvbmFsID0gdHJ1ZVxuXG5cbiAgIyBOb3JtYWxpemUgb3IgcmVtb3ZlIHRoZSBhdHRyaWJ1dGVcbiAgIyBkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICByZXdyaXRlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGlmIGRpcmVjdGl2ZS5pc0VsZW1lbnREaXJlY3RpdmUoKVxuICAgICAgaWYgYXR0cmlidXRlTmFtZSAhPSBkaXJlY3RpdmUucmVuZGVyZWRBdHRyKClcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgICBlbHNlIGlmIG5vdCBkaXJlY3RpdmUubmFtZVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSlcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcblxuXG4gICMgZm9yY2UgYXR0cmlidXRlIHN0eWxlIGFzIHNwZWNpZmllZCBpbiBjb25maWdcbiAgIyBlLmcuIGF0dHJpYnV0ZSAnZG9jLWNvbnRhaW5lcicgYmVjb21lcyAnZGF0YS1kb2MtY29udGFpbmVyJ1xuICBub3JtYWxpemVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZWxlbSA9IGRpcmVjdGl2ZS5lbGVtXG4gICAgaWYgYXR0cmlidXRlTmFtZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG4gICAgZWxlbS5zZXRBdHRyaWJ1dGUoZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpLCBkaXJlY3RpdmUubmFtZSlcblxuXG4gIHJlbW92ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBkaXJlY3RpdmUuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpcmVjdGl2ZUZpbmRlciA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIGxpbms6IChlbGVtLCBkaXJlY3RpdmVDb2xsZWN0aW9uKSAtPlxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbGxlY3Rpb24uZ2V0KGF0dHIudmFsdWUpXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtID0gZWxlbVxuXG4gICAgdW5kZWZpbmVkXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbiMgRGlyZWN0aXZlIEl0ZXJhdG9yXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBDb2RlIGlzIHBvcnRlZCBmcm9tIHJhbmd5IE5vZGVJdGVyYXRvciBhbmQgYWRhcHRlZCBmb3IgY29tcG9uZW50IHRlbXBsYXRlc1xuIyBzbyBpdCBkb2VzIG5vdCB0cmF2ZXJzZSBpbnRvIGNvbnRhaW5lcnMuXG4jXG4jIFVzZSB0byB0cmF2ZXJzZSBhbGwgbm9kZXMgb2YgYSB0ZW1wbGF0ZS4gVGhlIGl0ZXJhdG9yIGRvZXMgbm90IGdvIGludG9cbiMgY29udGFpbmVycyBhbmQgaXMgc2FmZSB0byB1c2UgZXZlbiBpZiB0aGVyZSBpcyBjb250ZW50IGluIHRoZXNlIGNvbnRhaW5lcnMuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERpcmVjdGl2ZUl0ZXJhdG9yXG5cbiAgY29uc3RydWN0b3I6IChyb290KSAtPlxuICAgIEByb290ID0gQF9uZXh0ID0gcm9vdFxuICAgIEBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG5cbiAgY3VycmVudDogbnVsbFxuXG5cbiAgaGFzTmV4dDogLT5cbiAgICAhIUBfbmV4dFxuXG5cbiAgbmV4dDogKCkgLT5cbiAgICBuID0gQGN1cnJlbnQgPSBAX25leHRcbiAgICBjaGlsZCA9IG5leHQgPSB1bmRlZmluZWRcbiAgICBpZiBAY3VycmVudFxuICAgICAgY2hpbGQgPSBuLmZpcnN0Q2hpbGRcbiAgICAgIGlmIGNoaWxkICYmIG4ubm9kZVR5cGUgPT0gMSAmJiAhbi5oYXNBdHRyaWJ1dGUoQGNvbnRhaW5lckF0dHIpXG4gICAgICAgIEBfbmV4dCA9IGNoaWxkXG4gICAgICBlbHNlXG4gICAgICAgIG5leHQgPSBudWxsXG4gICAgICAgIHdoaWxlIChuICE9IEByb290KSAmJiAhKG5leHQgPSBuLm5leHRTaWJsaW5nKVxuICAgICAgICAgIG4gPSBuLnBhcmVudE5vZGVcblxuICAgICAgICBAX25leHQgPSBuZXh0XG5cbiAgICBAY3VycmVudFxuXG5cbiAgIyBvbmx5IGl0ZXJhdGUgb3ZlciBlbGVtZW50IG5vZGVzIChOb2RlLkVMRU1FTlRfTk9ERSA9PSAxKVxuICBuZXh0RWxlbWVudDogKCkgLT5cbiAgICB3aGlsZSBAbmV4dCgpXG4gICAgICBicmVhayBpZiBAY3VycmVudC5ub2RlVHlwZSA9PSAxXG5cbiAgICBAY3VycmVudFxuXG5cbiAgZGV0YWNoOiAoKSAtPlxuICAgIEBjdXJyZW50ID0gQF9uZXh0ID0gQHJvb3QgPSBudWxsXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbkRpcmVjdGl2ZUl0ZXJhdG9yID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfaXRlcmF0b3InKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbGxlY3Rpb24nKVxuZGlyZWN0aXZlQ29tcGlsZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb21waWxlcicpXG5kaXJlY3RpdmVGaW5kZXIgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9maW5kZXInKVxuXG5Db21wb25lbnRNb2RlbCA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9tb2RlbCcpXG5Db21wb25lbnRWaWV3ID0gcmVxdWlyZSgnLi4vcmVuZGVyaW5nL2NvbXBvbmVudF92aWV3Jylcblxuc29ydEJ5TmFtZSA9IChhLCBiKSAtPlxuICBpZiAoYS5uYW1lID4gYi5uYW1lKVxuICAgIDFcbiAgZWxzZSBpZiAoYS5uYW1lIDwgYi5uYW1lKVxuICAgIC0xXG4gIGVsc2VcbiAgICAwXG5cbiMgVGVtcGxhdGVcbiMgLS0tLS0tLS1cbiMgUGFyc2VzIGNvbXBvbmVudCB0ZW1wbGF0ZXMgYW5kIGNyZWF0ZXMgQ29tcG9uZW50TW9kZWxzIGFuZCBDb21wb25lbnRWaWV3cy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGVtcGxhdGVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgaHRtbCwgbGFiZWwsIHByb3BlcnRpZXMgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBodG1sLCAnVGVtcGxhdGU6IHBhcmFtIGh0bWwgbWlzc2luZydcblxuICAgIEAkdGVtcGxhdGUgPSAkKCBAcHJ1bmVIdG1sKGh0bWwpICkud3JhcCgnPGRpdj4nKVxuICAgIEAkd3JhcCA9IEAkdGVtcGxhdGUucGFyZW50KClcblxuICAgIEBsYWJlbCA9IGxhYmVsIHx8IHdvcmRzLmh1bWFuaXplKCBAbmFtZSApXG4gICAgQHN0eWxlcyA9IHByb3BlcnRpZXMgfHwge31cbiAgICBAZGVmYXVsdHMgPSB7fVxuXG4gICAgQHBhcnNlVGVtcGxhdGUoKVxuXG5cbiAgc2V0RGVzaWduOiAoZGVzaWduKSAtPlxuICAgIEBkZXNpZ24gPSBkZXNpZ25cbiAgICBAaWRlbnRpZmllciA9IFwiI3sgZGVzaWduLm5hbWUgfS4jeyBAbmFtZSB9XCJcblxuXG4gICMgY3JlYXRlIGEgbmV3IENvbXBvbmVudE1vZGVsIGluc3RhbmNlIGZyb20gdGhpcyB0ZW1wbGF0ZVxuICBjcmVhdGVNb2RlbDogKCkgLT5cbiAgICBuZXcgQ29tcG9uZW50TW9kZWwodGVtcGxhdGU6IHRoaXMpXG5cblxuICBjcmVhdGVWaWV3OiAoY29tcG9uZW50TW9kZWwsIGlzUmVhZE9ubHkpIC0+XG4gICAgY29tcG9uZW50TW9kZWwgfHw9IEBjcmVhdGVNb2RlbCgpXG4gICAgJGVsZW0gPSBAJHRlbXBsYXRlLmNsb25lKClcbiAgICBkaXJlY3RpdmVzID0gQGxpbmtEaXJlY3RpdmVzKCRlbGVtWzBdKVxuXG4gICAgY29tcG9uZW50VmlldyA9IG5ldyBDb21wb25lbnRWaWV3XG4gICAgICBtb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgICRodG1sOiAkZWxlbVxuICAgICAgZGlyZWN0aXZlczogZGlyZWN0aXZlc1xuICAgICAgaXNSZWFkT25seTogaXNSZWFkT25seVxuXG5cbiAgcHJ1bmVIdG1sOiAoaHRtbCkgLT5cblxuICAgICMgcmVtb3ZlIGFsbCBjb21tZW50c1xuICAgIGh0bWwgPSAkKGh0bWwpLmZpbHRlciAoaW5kZXgpIC0+XG4gICAgICBAbm9kZVR5cGUgIT04XG5cbiAgICAjIG9ubHkgYWxsb3cgb25lIHJvb3QgZWxlbWVudFxuICAgIGFzc2VydCBodG1sLmxlbmd0aCA9PSAxLCBcIlRlbXBsYXRlcyBtdXN0IGNvbnRhaW4gb25lIHJvb3QgZWxlbWVudC4gVGhlIFRlbXBsYXRlIFxcXCIjeyBAaWRlbnRpZmllciB9XFxcIiBjb250YWlucyAjeyBodG1sLmxlbmd0aCB9XCJcblxuICAgIGh0bWxcblxuICBwYXJzZVRlbXBsYXRlOiAoKSAtPlxuICAgIGVsZW0gPSBAJHRlbXBsYXRlWzBdXG4gICAgQGRpcmVjdGl2ZXMgPSBAY29tcGlsZURpcmVjdGl2ZXMoZWxlbSlcblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgICBAZm9ybWF0RWRpdGFibGUoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgICAgQGZvcm1hdENvbnRhaW5lcihkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2h0bWwnXG4gICAgICAgICAgQGZvcm1hdEh0bWwoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuXG5cbiAgIyBJbiB0aGUgaHRtbCBvZiB0aGUgdGVtcGxhdGUgZmluZCBhbmQgc3RvcmUgYWxsIERPTSBub2Rlc1xuICAjIHdoaWNoIGFyZSBkaXJlY3RpdmVzIChlLmcuIGVkaXRhYmxlcyBvciBjb250YWluZXJzKS5cbiAgY29tcGlsZURpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgZGlyZWN0aXZlcyA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb21waWxlci5wYXJzZShlbGVtKVxuICAgICAgZGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKSBpZiBkaXJlY3RpdmVcblxuICAgIGRpcmVjdGl2ZXNcblxuXG4gICMgRm9yIGV2ZXJ5IG5ldyBDb21wb25lbnRWaWV3IHRoZSBkaXJlY3RpdmVzIGFyZSBjbG9uZWRcbiAgIyBhbmQgbGlua2VkIHdpdGggdGhlIGVsZW1lbnRzIGZyb20gdGhlIG5ldyB2aWV3LlxuICBsaW5rRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBjb21wb25lbnREaXJlY3RpdmVzID0gQGRpcmVjdGl2ZXMuY2xvbmUoKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZUZpbmRlci5saW5rKGVsZW0sIGNvbXBvbmVudERpcmVjdGl2ZXMpXG5cbiAgICBjb21wb25lbnREaXJlY3RpdmVzXG5cblxuICBmb3JtYXRFZGl0YWJsZTogKG5hbWUsIGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgJGVsZW0uYWRkQ2xhc3MoY29uZmlnLmNzcy5lZGl0YWJsZSlcblxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gaWYgZGVmYXVsdFZhbHVlIHRoZW4gZGVmYXVsdFZhbHVlIGVsc2UgJydcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRDb250YWluZXI6IChuYW1lLCBlbGVtKSAtPlxuICAgICMgcmVtb3ZlIGFsbCBjb250ZW50IGZyb24gYSBjb250YWluZXIgZnJvbSB0aGUgdGVtcGxhdGVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICBmb3JtYXRIdG1sOiAobmFtZSwgZWxlbSkgLT5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICBlbGVtLmlubmVySFRNTCA9ICcnXG5cblxuICAjIFJldHVybiBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgaW50ZXJmYWNlIG9mIHRoaXMgdGVtcGxhdGVcbiAgIyBAcmV0dXJucyB7IE9iamVjdCB9IEFuIG9iamVjdCB3aWNoIGNvbnRhaW5zIHRoZSBpbnRlcmZhY2UgZGVzY3JpcHRpb25cbiAgIyAgIG9mIHRoaXMgdGVtcGxhdGUuIFRoaXMgb2JqZWN0IHdpbGwgYmUgdGhlIHNhbWUgaWYgdGhlIGludGVyZmFjZSBkb2VzXG4gICMgICBub3QgY2hhbmdlIHNpbmNlIGRpcmVjdGl2ZXMgYW5kIHByb3BlcnRpZXMgYXJlIHNvcnRlZC5cbiAgaW5mbzogKCkgLT5cbiAgICBkb2MgPVxuICAgICAgbmFtZTogQG5hbWVcbiAgICAgIGRlc2lnbjogQGRlc2lnbj8ubmFtZVxuICAgICAgZGlyZWN0aXZlczogW11cbiAgICAgIHByb3BlcnRpZXM6IFtdXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICB7IG5hbWUsIHR5cGUgfSA9IGRpcmVjdGl2ZVxuICAgICAgZG9jLmRpcmVjdGl2ZXMucHVzaCh7IG5hbWUsIHR5cGUgfSlcblxuXG4gICAgZm9yIG5hbWUsIHN0eWxlIG9mIEBzdHlsZXNcbiAgICAgIGRvYy5wcm9wZXJ0aWVzLnB1c2goeyBuYW1lLCB0eXBlOiAnY3NzTW9kaWZpY2F0b3InIH0pXG5cbiAgICBkb2MuZGlyZWN0aXZlcy5zb3J0KHNvcnRCeU5hbWUpXG4gICAgZG9jLnByb3BlcnRpZXMuc29ydChzb3J0QnlOYW1lKVxuICAgIGRvY1xuXG5cblxuIyBTdGF0aWMgZnVuY3Rpb25zXG4jIC0tLS0tLS0tLS0tLS0tLS1cblxuVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyID0gKGlkZW50aWZpZXIpIC0+XG4gIHJldHVybiB1bmxlc3MgaWRlbnRpZmllciAjIHNpbGVudGx5IGZhaWwgb24gdW5kZWZpbmVkIG9yIGVtcHR5IHN0cmluZ3NcblxuICBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoJy4nKVxuICBpZiBwYXJ0cy5sZW5ndGggPT0gMVxuICAgIHsgZGVzaWduTmFtZTogdW5kZWZpbmVkLCBuYW1lOiBwYXJ0c1swXSB9XG4gIGVsc2UgaWYgcGFydHMubGVuZ3RoID09IDJcbiAgICB7IGRlc2lnbk5hbWU6IHBhcnRzWzBdLCBuYW1lOiBwYXJ0c1sxXSB9XG4gIGVsc2VcbiAgICBsb2cuZXJyb3IoXCJjb3VsZCBub3QgcGFyc2UgY29tcG9uZW50IHRlbXBsYXRlIGlkZW50aWZpZXI6ICN7IGlkZW50aWZpZXIgfVwiKVxuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcInZlcnNpb25cIjogXCIwLjQuMVwiLFxuICBcInJldmlzaW9uXCI6IFwiYmQyNTg3MFwiXG59XG4iXX0=
