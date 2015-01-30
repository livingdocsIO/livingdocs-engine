require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    var isValid, name, validationResult, validator, validators, _i, _len, _ref;
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
      validationResult = validator(value);
      if (validationResult === true) {
        continue;
      }
      errors.add(validationResult, {
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
    var entry, index, isValid, location, validationResult, validator, _i, _len, _ref;
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
      validationResult = validator(entry);
      if (validationResult === true) {
        continue;
      }
      location = "" + this.location + "[" + index + "]";
      errors.add(validationResult, {
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
    if (message === void 0) {
      message = "validator returned undefined. Check your validator implementation.";
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
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function () {
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



},{"../version":69,"./component_tree/component_tree":18,"./configuration/augment_config":22,"./configuration/config":23,"./design/design_cache":26,"./livingdoc":39,"./rendering_container/css_loader":57,"./rendering_container/editor_page":58,"./rendering_container/js_loader":60}],12:[function(require,module,exports){
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



},{"../modules/logging/assert":44}],14:[function(require,module,exports){
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



},{"../image_services/image_service":32,"../modules/logging/assert":44,"./editable_directive":19,"./html_directive":20,"./image_directive":21}],16:[function(require,module,exports){
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



},{"../configuration/config":23,"../modules/guid":43,"../modules/logging/assert":44,"../modules/logging/log":45,"../template/directive_collection":64,"./component_container":13,"./component_directive_factory":15,"deep-equal":1}],17:[function(require,module,exports){
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



},{"../configuration/config":23,"../modules/guid":43,"../modules/logging/assert":44,"../modules/logging/log":45,"../modules/serialization":48,"./component_model":16,"deep-equal":1,"jquery":"jquery"}],18:[function(require,module,exports){
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

  ComponentTree.prototype.contentChanging = function(component, directiveName) {
    return this.fireEvent('componentContentChanged', component, directiveName);
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



},{"../modules/logging/assert":44,"./component_array":12,"./component_container":13,"./component_model":16,"./component_model_serializer":17,"jquery":"jquery"}],19:[function(require,module,exports){
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



},{"../modules/logging/assert":44,"../modules/words":49,"./component_directive":14}],20:[function(require,module,exports){
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



},{"../modules/logging/assert":44,"./component_directive":14}],21:[function(require,module,exports){
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

  ImageDirective.prototype.setCrop = function(crop) {
    var currentValue, height, name, width, x, y;
    currentValue = this.component.content[this.name];
    if ((currentValue != null ? currentValue.url : void 0) == null) {
      return;
    }
    if (crop) {
      x = crop.x, y = crop.y, width = crop.width, height = crop.height, name = crop.name;
      currentValue.crop = {
        x: x,
        y: y,
        width: width,
        height: height,
        name: name
      };
    } else {
      delete currentValue.crop;
    }
    this.processImageUrl(currentValue.originalUrl || currentValue.url);
    if (this.component.componentTree) {
      return this.component.componentTree.contentChanging(this.component, this.name);
    }
  };

  ImageDirective.prototype.getCrop = function() {
    return this.component.content[this.name].crop;
  };

  ImageDirective.prototype.setOriginalImageDimensions = function(_arg) {
    var content, height, width;
    width = _arg.width, height = _arg.height;
    content = this.component.content[this.name];
    content.width = width;
    return content.height = height;
  };

  ImageDirective.prototype.getOriginalImageDimensions = function() {
    var content;
    content = this.component.content[this.name];
    return {
      width: content.width,
      height: content.height
    };
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



},{"../image_services/image_service":32,"../modules/logging/assert":44,"./component_directive":14}],22:[function(require,module,exports){
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
  imagePlaceholder: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjIwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDYyMCAzNTAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxyZWN0IHdpZHRoPSI2MjAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRDRENENFIi8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iNjIwIiB5Mj0iMzUwIiBzdHlsZT0ic3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIiLz48bGluZSB4MT0iNjIwIiB5MT0iMCIgeDI9IjAiIHkyPSIzNTAiIHN0eWxlPSJzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MiIvPjwvc3ZnPgo",
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



},{"../modules/logging/assert":44,"../modules/logging/log":45,"../modules/words":49}],25:[function(require,module,exports){
var Dependencies, Design, OrderedHash, Template, assert, config, log, words;

config = require('../configuration/config');

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

words = require('../modules/words');

Template = require('../template/template');

OrderedHash = require('../modules/ordered_hash');

Dependencies = require('../rendering/dependencies');

module.exports = Design = (function() {
  function Design(_arg) {
    var label;
    this.name = _arg.name, this.version = _arg.version, label = _arg.label, this.author = _arg.author, this.description = _arg.description;
    assert(this.name != null, 'Design: param "name" is required');
    this.label = label || words.humanize(this.name);
    this.identifier = Design.getIdentifier(this.name, this.version);
    this.groups = [];
    this.components = new OrderedHash();
    this.imageRatios = {};
    this.dependencies = new Dependencies();
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

  Design.prototype.getDefaultParagraphTemplate = function() {
    return this.defaultParagraph;
  };

  Design.prototype.getDefaultImageTemplate = function() {
    return this.defaultImage;
  };

  Design.prototype.getDefaultParagraphComponentName = function() {
    var _ref;
    return (_ref = this.getDefaultParagraphTemplate()) != null ? _ref.name : void 0;
  };

  Design.prototype.getDefaultImageComponentName = function() {
    var _ref;
    return (_ref = this.getDefaultImageTemplate()) != null ? _ref.name : void 0;
  };

  Design.prototype.getDefaultImageDirectiveName = function() {
    var _ref, _ref1;
    return (_ref = this.defaultImage) != null ? (_ref1 = _ref.directives.firstOfType('image')) != null ? _ref1.name : void 0 : void 0;
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



},{"../configuration/config":23,"../modules/logging/assert":44,"../modules/logging/log":45,"../modules/ordered_hash":46,"../modules/words":49,"../rendering/dependencies":51,"../template/template":68}],26:[function(require,module,exports){
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



},{"../modules/logging/assert":44,"./design":25,"./design_parser":28,"./version":30}],27:[function(require,module,exports){
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

validator.add('wrapper', function(value) {
  var regexp;
  regexp = /<.*\u0020(?:[^>]*\u0020|)class=("|')[^'"]*doc-section[^'"]*\1(?:\u0020[^>]*|)>/;
  if (!regexp.test(value)) {
    return "design.wrapper is missing a 'doc-section' class ('" + value + "').";
  } else {
    return true;
  }
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
  label: 'string, optional',
  version: 'string, semVer',
  author: 'string, optional',
  description: 'string, optional',
  assets: {
    __validate: 'optional',
    css: 'array of string',
    js: 'array of string, optional',
    basePath: 'string, optional'
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
  },
  metadata: 'array of object, optional',
  wrapper: 'string, wrapper, optional',
  defaultContent: 'array of object, optional',
  prefilledComponents: 'object, optional'
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
      $.each(['metadata', 'wrapper', 'defaultContent', 'prefilledComponents'], (function(_this) {
        return function(index, attributeName) {
          return _this.design[attributeName] = designConfig[attributeName];
        };
      })(this));
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
      label: design.label,
      version: version.toString()
    });
  },
  parseAssets: function(assets) {
    var basePath;
    if (assets == null) {
      return;
    }
    basePath = assets.basePath;
    this.eachAsset(assets.js, (function(_this) {
      return function(assetUrl) {
        return _this.design.dependencies.addJs({
          src: assetUrl,
          basePath: basePath
        });
      };
    })(this));
    return this.eachAsset(assets.css, (function(_this) {
      return function(assetUrl) {
        return _this.design.dependencies.addCss({
          src: assetUrl,
          basePath: basePath
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



},{"../modules/logging/assert":44,"../modules/logging/log":45,"../template/template":68,"./css_modificator_property":24,"./design":25,"./design_config_schema":27,"./image_ratio":29,"./version":30,"jquery":"jquery"}],29:[function(require,module,exports){
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



},{"../modules/logging/assert":44,"../modules/words":49,"jquery":"jquery"}],30:[function(require,module,exports){
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



},{"../modules/logging/assert":44,"./default_image_service":31,"./resrcit_image_service":33}],33:[function(require,module,exports){
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
    getUrl: function(value, _arg) {
      var crop, height, q, quality, style, width, x, y, _ref;
      _ref = _arg != null ? _arg : {}, crop = _ref.crop, quality = _ref.quality;
      style = "";
      if (crop != null) {
        x = crop.x, y = crop.y, width = crop.width, height = crop.height;
        assert(typeof x === 'number', 'x should be a number');
        assert(typeof y === 'number', 'y should be a number');
        assert(typeof width === 'number', 'width should be a number');
        assert(typeof height === 'number', 'height should be a number');
        style += "/C=W" + width + ",H" + height + ",X" + x + ",Y" + y;
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



},{"../configuration/config":23,"../modules/logging/assert":44,"./default_image_service":31}],34:[function(require,module,exports){
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



},{"../configuration/config":23,"jquery":"jquery"}],36:[function(require,module,exports){
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
    this.componentTree = _arg.componentTree;
    this.model = this.componentTree;
    this.interactiveView = void 0;
    this.additionalViews = [];
    this.design = this.componentTree.design;
    this.dependencies = new Dependencies({
      componentTree: this.componentTree
    });
    this.forwardComponentTreeEvents();
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



},{"./component_tree/component_tree":18,"./configuration/config":23,"./design/design_cache":26,"./interaction/dom":35,"./modules/logging/assert":44,"./rendering/dependencies":51,"./rendering/renderer":54,"./rendering/view":55,"./rendering_container/interactive_page":59,"./rendering_container/page":61,"./rendering_container/rendering_container":62,"wolfy87-eventemitter":10}],40:[function(require,module,exports){
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



},{"jquery":"jquery"}],42:[function(require,module,exports){
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



},{}],44:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};



},{"./log":45}],45:[function(require,module,exports){
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



},{}],46:[function(require,module,exports){
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



},{}],47:[function(require,module,exports){
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



},{"../modules/logging/assert":44}],48:[function(require,module,exports){
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



},{}],49:[function(require,module,exports){
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



},{"jquery":"jquery"}],50:[function(require,module,exports){
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

  ComponentView.prototype.updateContent = function(directiveName) {
    if (directiveName) {
      this.set(directiveName, this.model.content[directiveName]);
    } else {
      this.setAll();
    }
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

  ComponentView.prototype.setAll = function() {
    var name, value, _ref;
    _ref = this.model.content;
    for (name in _ref) {
      value = _ref[name];
      this.set(name, value);
    }
    return void 0;
  };

  ComponentView.prototype.set = function(name, value) {
    var directive;
    directive = this.model.directives.get(name);
    switch (directive.type) {
      case 'editable':
        return this.setEditable(name, value);
      case 'image':
        if (directive.base64Image != null) {
          return this.setImage(name, directive.base64Image);
        } else {
          return this.setImage(name, directive.getImageUrl());
        }
        break;
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
    var imageService;
    $elem.addClass(config.css.emptyImage);
    imageService = this.model.directives.get(name).getImageService();
    return imageService.set($elem, config.imagePlaceholder);
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



},{"../configuration/config":23,"../interaction/dom":35,"../modules/eventing":40,"../template/directive_iterator":67,"jquery":"jquery"}],51:[function(require,module,exports){
var $, Dependencies, Dependency, assert, dependenciesToHtml, log,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require('jquery');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

Dependency = require('./dependency');

dependenciesToHtml = require('./dependencies_to_html');

module.exports = Dependencies = (function() {
  function Dependencies(_arg) {
    this.componentTree = (_arg != null ? _arg : {}).componentTree;
    this.onComponentRemoved = __bind(this.onComponentRemoved, this);
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
      if (obj.component != null) {
        return existing.addComponent(obj.component);
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
      assert(obj.basePath, "Dependencies: relative urls are not allowed: " + src);
      src = src.replace(/^[\.\/]*/, '');
      return obj.src = "" + (obj.basePath.replace(/\/$/, '')) + "/" + src;
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



},{"../modules/logging/assert":44,"../modules/logging/log":45,"./dependencies_to_html":52,"./dependency":53,"jquery":"jquery"}],52:[function(require,module,exports){
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



},{"../rendering_container/css_loader":57,"../rendering_container/js_loader":60}],53:[function(require,module,exports){
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
      return this.componentCount !== 0;
    } else {
      return true;
    }
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



},{"../modules/logging/assert":44}],54:[function(require,module,exports){
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
        return this.removeComponentFromDom(view.model);
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
    this.removeComponentFromDom(model);
    return this.deleteCachedComponentView(model);
  };

  Renderer.prototype.componentMoved = function(model) {
    this.removeComponentFromDom(model);
    return this.insertComponent(model);
  };

  Renderer.prototype.componentContentChanged = function(model, directiveName) {
    return this.getOrCreateComponentView(model).updateContent(directiveName);
  };

  Renderer.prototype.componentHtmlChanged = function(model) {
    return this.getOrCreateComponentView(model).updateHtml();
  };

  Renderer.prototype.getComponentViewById = function(componentId) {
    return this.componentViews[componentId];
  };

  Renderer.prototype.getOrCreateComponentView = function(model) {
    var _base, _name;
    return (_base = this.componentViews)[_name = model.id] || (_base[_name] = model.createView(this.renderingContainer.isReadOnly));
  };

  Renderer.prototype.deleteCachedComponentView = function(model) {
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
        return _this.getOrCreateComponentView(model).setAttachedToDom(false);
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
    componentView = this.getOrCreateComponentView(model);
    componentView.setAttachedToDom(true);
    this.renderingContainer.componentViewWasInserted(componentView);
    return this.attachChildComponents(model);
  };

  Renderer.prototype.isComponentAttached = function(model) {
    var _ref;
    return model && ((_ref = this.getComponentViewById(model.id)) != null ? _ref.isAttachedToDom : void 0);
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
    var $container, $node;
    $node = this.$nodeForComponent(model);
    $container = this.$nodeForContainer(model.parentContainer);
    return $container.append($node);
  };

  Renderer.prototype.$nodeForComponent = function(model) {
    return this.getOrCreateComponentView(model).$html;
  };

  Renderer.prototype.$nodeForContainer = function(container) {
    var parentView;
    if (container.isRoot) {
      return this.$root;
    } else {
      parentView = this.getOrCreateComponentView(container.parentComponent);
      return $(parentView.getDirectiveElement(container.name));
    }
  };

  Renderer.prototype.removeComponentFromDom = function(model) {
    var view;
    if (this.isComponentAttached(model)) {
      view = this.getComponentViewById(model.id);
      view.$html.detach();
      return view.setAttachedToDom(false);
    }
  };

  return Renderer;

})();



},{"../configuration/config":23,"../modules/logging/assert":44,"../modules/logging/log":45,"../modules/semaphore":47,"jquery":"jquery"}],55:[function(require,module,exports){
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



},{"../rendering_container/interactive_page":59,"../rendering_container/page":61,"./renderer":54}],56:[function(require,module,exports){
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



},{"../modules/semaphore":47,"./css_loader":57,"./js_loader":60,"jquery":"jquery"}],57:[function(require,module,exports){
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



},{"jquery":"jquery"}],58:[function(require,module,exports){
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



},{"../configuration/config":23,"../interaction/component_drag":34,"../interaction/drag_base":36}],59:[function(require,module,exports){
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



},{"../configuration/config":23,"../interaction/component_drag":34,"../interaction/dom":35,"../interaction/drag_base":36,"../interaction/editable_controller":37,"../interaction/focus":38,"./page":61}],60:[function(require,module,exports){
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



},{}],61:[function(require,module,exports){
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



},{"../configuration/config":23,"./assets":56,"./rendering_container":62,"jquery":"jquery"}],62:[function(require,module,exports){
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



},{"../modules/semaphore":47,"jquery":"jquery"}],63:[function(require,module,exports){
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



},{"../configuration/config":23,"../interaction/dom":35,"jquery":"jquery"}],64:[function(require,module,exports){
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

  DirectiveCollection.prototype.firstOfType = function(type) {
    var _ref;
    return (_ref = this[type]) != null ? _ref[0] : void 0;
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



},{"../configuration/config":23,"../modules/logging/assert":44,"./directive":63,"jquery":"jquery"}],65:[function(require,module,exports){
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



},{"../configuration/config":23,"./directive":63}],66:[function(require,module,exports){
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



},{"../configuration/config":23}],67:[function(require,module,exports){
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



},{"../configuration/config":23}],68:[function(require,module,exports){
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



},{"../component_tree/component_model":16,"../configuration/config":23,"../modules/logging/assert":44,"../modules/logging/log":45,"../modules/words":49,"../rendering/component_view":50,"./directive_collection":64,"./directive_compiler":65,"./directive_finder":66,"./directive_iterator":67,"jquery":"jquery"}],69:[function(require,module,exports){
module.exports={
  "version": "0.5.4",
  "revision": "3aacfc8"
}

},{}],"jquery":[function(require,module,exports){
module.exports = $;



},{}]},{},[11]);
