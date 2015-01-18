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
  "version": "0.5.0",
  "revision": "217d398"
}

},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvaW5kZXguanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9rZXlzLmpzIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvanNjaGVtZS9saWIvanNjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3Byb3BlcnR5X3ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3NjaGVtZS5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3R5cGUuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi92YWxpZGF0aW9uX2Vycm9ycy5qcyIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3ZhbGlkYXRvcnMuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy93b2xmeTg3LWV2ZW50ZW1pdHRlci9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfYXJyYXkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9kaXJlY3RpdmVfZmFjdG9yeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfbW9kZWwuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvZWRpdGFibGVfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2ltYWdlX2RpcmVjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9jc3NfbW9kaWZpY2F0b3JfcHJvcGVydHkuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL2Rlc2lnbi5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fY29uZmlnX3NjaGVtYS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX3BhcnNlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vaW1hZ2VfcmF0aW8uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvZGVzaWduL3ZlcnNpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvZGVmYXVsdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW1hZ2Vfc2VydmljZXMvcmVzcmNpdF9pbWFnZV9zZXJ2aWNlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2NvbXBvbmVudF9kcmFnLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9kcmFnX2Jhc2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9saXZpbmdkb2MuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9ldmVudGluZy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZC5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2d1aWQuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9qcXVlcnlfYnJvd3NlcmlmeS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvbG9nZ2luZy9sb2cuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vcmRlcmVkX2hhc2guY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZW1hcGhvcmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9zZXJpYWxpemF0aW9uLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2NvbXBvbmVudF92aWV3LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZXBlbmRlbmNpZXMuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL2RlcGVuZGVuY2llc190b19odG1sLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9kZXBlbmRlbmN5LmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9yZW5kZXJlci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Fzc2V0cy5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZS5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9qc19sb2FkZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lci5jb2ZmZWUiLCIvVXNlcnMvTHVrYXMvZ2l0L2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbGxlY3Rpb24uY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2NvbXBpbGVyLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL0x1a2FzL2dpdC9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvZGlyZWN0aXZlX2l0ZXJhdG9yLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL3RlbXBsYXRlLmNvZmZlZSIsIi9Vc2Vycy9MdWthcy9naXQvbGl2aW5nZG9jcy1lbmdpbmUvdmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUE7V0FnQkEsSUFqQkk7RUFBQSxDQTdHTixDQUFBOztrQkFBQTs7SUE1QkYsQ0FBQTs7QUFBQSxRQWlLUSxDQUFDLGVBQVQsR0FBMkIsU0FBQyxVQUFELEdBQUE7QUFDekIsTUFBQSxLQUFBO0FBQUEsRUFBQSxJQUFBLENBQUEsVUFBQTtBQUFBLFVBQUEsQ0FBQTtHQUFBO0FBQUEsRUFFQSxLQUFBLEdBQVEsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FGUixDQUFBO0FBR0EsRUFBQSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1dBQ0U7QUFBQSxNQUFFLFVBQUEsRUFBWSxNQUFkO0FBQUEsTUFBeUIsSUFBQSxFQUFNLEtBQU0sQ0FBQSxDQUFBLENBQXJDO01BREY7R0FBQSxNQUVLLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDSDtBQUFBLE1BQUUsVUFBQSxFQUFZLEtBQU0sQ0FBQSxDQUFBLENBQXBCO0FBQUEsTUFBd0IsSUFBQSxFQUFNLEtBQU0sQ0FBQSxDQUFBLENBQXBDO01BREc7R0FBQSxNQUFBO1dBR0gsR0FBRyxDQUFDLEtBQUosQ0FBVyxpREFBQSxHQUFkLFVBQUcsRUFIRztHQU5vQjtBQUFBLENBakszQixDQUFBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBvYmplY3RLZXlzID0gcmVxdWlyZSgnLi9saWIva2V5cy5qcycpO1xudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZSgnLi9saWIvaXNfYXJndW1lbnRzLmpzJyk7XG5cbnZhciBkZWVwRXF1YWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb3B0cy5zdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBvcHRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKHgpIHtcbiAgaWYgKCF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgeC5sZW5ndGggIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0eXBlb2YgeC5jb3B5ICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiB4LnNsaWNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh4Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHhbMF0gIT09ICdudW1iZXInKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBvcHRzKSB7XG4gIHZhciBpLCBrZXk7XG4gIGlmIChpc1VuZGVmaW5lZE9yTnVsbChhKSB8fCBpc1VuZGVmaW5lZE9yTnVsbChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBkZWVwRXF1YWwoYSwgYiwgb3B0cyk7XG4gIH1cbiAgaWYgKGlzQnVmZmVyKGEpKSB7XG4gICAgaWYgKCFpc0J1ZmZlcihiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFkZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIG9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA9IChmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50cylcbn0pKCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPyBzdXBwb3J0ZWQgOiB1bnN1cHBvcnRlZDtcblxuZXhwb3J0cy5zdXBwb3J0ZWQgPSBzdXBwb3J0ZWQ7XG5mdW5jdGlvbiBzdXBwb3J0ZWQob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn07XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59O1xuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsInZhciBTY2hlbWUsIGpTY2hlbWU7XG5cblNjaGVtZSA9IHJlcXVpcmUoJy4vc2NoZW1lJyk7XG5cbmpTY2hlbWUgPSBuZXcgU2NoZW1lKCk7XG5cbmpTY2hlbWVbXCJuZXdcIl0gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBTY2hlbWUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0galNjaGVtZTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93ICE9PSBudWxsKSB7XG4gIHdpbmRvdy5qU2NoZW1lID0galNjaGVtZTtcbn1cbiIsInZhciBQcm9wZXJ0eVZhbGlkYXRvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wZXJ0eVZhbGlkYXRvciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHRlcm1SZWdleDtcblxuICB0ZXJtUmVnZXggPSAvXFx3W1xcdyBdKlxcdy9nO1xuXG4gIGZ1bmN0aW9uIFByb3BlcnR5VmFsaWRhdG9yKF9hcmcpIHtcbiAgICB2YXIgX3JlZjtcbiAgICB0aGlzLmlucHV0U3RyaW5nID0gX2FyZy5pbnB1dFN0cmluZywgdGhpcy5zY2hlbWUgPSBfYXJnLnNjaGVtZSwgdGhpcy5wcm9wZXJ0eSA9IF9hcmcucHJvcGVydHksIHRoaXMucGFyZW50ID0gX2FyZy5wYXJlbnQ7XG4gICAgdGhpcy52YWxpZGF0b3JzID0gW107XG4gICAgdGhpcy5sb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zY2hlbWUucHJvcGVydGllc1JlcXVpcmVkKSB7XG4gICAgICBpZiAoKF9yZWYgPSB0aGlzLnBhcmVudCkgIT0gbnVsbCkge1xuICAgICAgICBfcmVmLmFkZFJlcXVpcmVkUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWRkVmFsaWRhdGlvbnModGhpcy5pbnB1dFN0cmluZyk7XG4gIH1cblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuZ2V0TG9jYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5wcm9wZXJ0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQubG9jYXRpb24gKyB0aGlzLnNjaGVtZS53cml0ZVByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zY2hlbWUud3JpdGVQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICB9XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmdldFByb3BMb2NhdGlvbiA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBcIlwiICsgdGhpcy5sb2NhdGlvbiArICh0aGlzLnNjaGVtZS53cml0ZVByb3BlcnR5KGtleSkpO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5hZGRWYWxpZGF0aW9ucyA9IGZ1bmN0aW9uKGNvbmZpZ1N0cmluZykge1xuICAgIHZhciByZXN1bHQsIHRlcm0sIHR5cGVzO1xuICAgIHdoaWxlIChyZXN1bHQgPSB0ZXJtUmVnZXguZXhlYyhjb25maWdTdHJpbmcpKSB7XG4gICAgICB0ZXJtID0gcmVzdWx0WzBdO1xuICAgICAgaWYgKHRlcm0gPT09ICdvcHRpb25hbCcpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQucmVtb3ZlUmVxdWlyZWRQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICAgIH0gZWxzZSBpZiAodGVybSA9PT0gJ3JlcXVpcmVkJykge1xuICAgICAgICB0aGlzLnBhcmVudC5hZGRSZXF1aXJlZFByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgICAgfSBlbHNlIGlmICh0ZXJtLmluZGV4T2YoJ2FycmF5IG9mICcpID09PSAwKSB7XG4gICAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKCdhcnJheScpO1xuICAgICAgICB0aGlzLmFycmF5VmFsaWRhdG9yID0gdGVybS5zbGljZSg5KTtcbiAgICAgIH0gZWxzZSBpZiAodGVybS5pbmRleE9mKCcgb3IgJykgIT09IC0xKSB7XG4gICAgICAgIHR5cGVzID0gdGVybS5zcGxpdCgnIG9yICcpO1xuICAgICAgICBjb25zb2xlLmxvZygndG9kbycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godGVybSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2b2lkIDA7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24odmFsdWUsIGVycm9ycykge1xuICAgIHZhciBpc1ZhbGlkLCBuYW1lLCB2YWxpZCwgdmFsaWRhdG9yLCB2YWxpZGF0b3JzLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICBpZiAoKHZhbHVlID09IG51bGwpICYmIHRoaXMuaXNPcHRpb25hbCgpKSB7XG4gICAgICByZXR1cm4gaXNWYWxpZDtcbiAgICB9XG4gICAgdmFsaWRhdG9ycyA9IHRoaXMuc2NoZW1lLnZhbGlkYXRvcnM7XG4gICAgX3JlZiA9IHRoaXMudmFsaWRhdG9ycyB8fCBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG5hbWUgPSBfcmVmW19pXTtcbiAgICAgIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbbmFtZV07XG4gICAgICBpZiAodmFsaWRhdG9yID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycy5hZGQoXCJtaXNzaW5nIHZhbGlkYXRvciBcIiArIG5hbWUsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5sb2NhdGlvblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWxpZCA9IHZhbGlkYXRvcih2YWx1ZSkgPT09IHRydWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlcnJvcnMuYWRkKHZhbGlkLCB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLmxvY2F0aW9uLFxuICAgICAgICBkZWZhdWx0TWVzc2FnZTogXCJcIiArIG5hbWUgKyBcIiB2YWxpZGF0b3IgZmFpbGVkXCJcbiAgICAgIH0pO1xuICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIShpc1ZhbGlkID0gdGhpcy52YWxpZGF0ZUFycmF5KHZhbHVlLCBlcnJvcnMpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIShpc1ZhbGlkID0gdGhpcy52YWxpZGF0ZVJlcXVpcmVkUHJvcGVydGllcyh2YWx1ZSwgZXJyb3JzKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVycm9ycykge1xuICAgIHZhciBlbnRyeSwgaW5kZXgsIGlzVmFsaWQsIGxvY2F0aW9uLCByZXMsIHZhbGlkYXRvciwgX2ksIF9sZW4sIF9yZWY7XG4gICAgaWYgKHRoaXMuYXJyYXlWYWxpZGF0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgIHZhbGlkYXRvciA9IHRoaXMuc2NoZW1lLnZhbGlkYXRvcnNbdGhpcy5hcnJheVZhbGlkYXRvcl07XG4gICAgaWYgKHZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZXJyb3JzLmFkZChcIm1pc3NpbmcgdmFsaWRhdG9yIFwiICsgdGhpcy5hcnJheVZhbGlkYXRvciwge1xuICAgICAgICBsb2NhdGlvbjogdGhpcy5sb2NhdGlvblxuICAgICAgfSk7XG4gICAgfVxuICAgIF9yZWYgPSBhcnIgfHwgW107XG4gICAgZm9yIChpbmRleCA9IF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IGluZGV4ID0gKytfaSkge1xuICAgICAgZW50cnkgPSBfcmVmW2luZGV4XTtcbiAgICAgIHJlcyA9IHZhbGlkYXRvcihlbnRyeSk7XG4gICAgICBpZiAocmVzID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbG9jYXRpb24gPSBcIlwiICsgdGhpcy5sb2NhdGlvbiArIFwiW1wiICsgaW5kZXggKyBcIl1cIjtcbiAgICAgIGVycm9ycy5hZGQocmVzLCB7XG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgZGVmYXVsdE1lc3NhZ2U6IFwiXCIgKyB0aGlzLmFycmF5VmFsaWRhdG9yICsgXCIgdmFsaWRhdG9yIGZhaWxlZFwiXG4gICAgICB9KTtcbiAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlT3RoZXJQcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGVycm9ycykge1xuICAgIHZhciBpc1ZhbGlkO1xuICAgIGlmICh0aGlzLm90aGVyUHJvcGVydHlWYWxpZGF0b3IgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zY2hlbWUuZXJyb3JzID0gdm9pZCAwO1xuICAgICAgaWYgKGlzVmFsaWQgPSB0aGlzLm90aGVyUHJvcGVydHlWYWxpZGF0b3IuY2FsbCh0aGlzLCBrZXksIHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNjaGVtZS5lcnJvcnMgIT0gbnVsbCkge1xuICAgICAgICBlcnJvcnMuam9pbih0aGlzLnNjaGVtZS5lcnJvcnMsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5nZXRQcm9wTG9jYXRpb24oa2V5KVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9ycy5hZGQoXCJhZGRpdGlvbmFsIHByb3BlcnR5IGNoZWNrIGZhaWxlZFwiLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnNjaGVtZS5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLmFkZChcInVuc3BlY2lmaWVkIGFkZGl0aW9uYWwgcHJvcGVydHlcIiwge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmdldFByb3BMb2NhdGlvbihrZXkpXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS52YWxpZGF0ZVJlcXVpcmVkUHJvcGVydGllcyA9IGZ1bmN0aW9uKG9iaiwgZXJyb3JzKSB7XG4gICAgdmFyIGlzUmVxdWlyZWQsIGlzVmFsaWQsIGtleSwgX3JlZjtcbiAgICBpc1ZhbGlkID0gdHJ1ZTtcbiAgICBfcmVmID0gdGhpcy5yZXF1aXJlZFByb3BlcnRpZXM7XG4gICAgZm9yIChrZXkgaW4gX3JlZikge1xuICAgICAgaXNSZXF1aXJlZCA9IF9yZWZba2V5XTtcbiAgICAgIGlmICgob2JqW2tleV0gPT0gbnVsbCkgJiYgaXNSZXF1aXJlZCkge1xuICAgICAgICBlcnJvcnMuYWRkKFwicmVxdWlyZWQgcHJvcGVydHkgbWlzc2luZ1wiLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICAgIGlzVmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzVmFsaWQ7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmFkZFJlcXVpcmVkUHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAodGhpcy5yZXF1aXJlZFByb3BlcnRpZXMgPT0gbnVsbCkge1xuICAgICAgdGhpcy5yZXF1aXJlZFByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVxdWlyZWRQcm9wZXJ0aWVzW2tleV0gPSB0cnVlO1xuICB9O1xuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5yZW1vdmVSZXF1aXJlZFByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdGhpcy5yZXF1aXJlZFByb3BlcnRpZXMpICE9IG51bGwgPyBfcmVmW2tleV0gPSB2b2lkIDAgOiB2b2lkIDA7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmlzT3B0aW9uYWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuICF0aGlzLnBhcmVudC5yZXF1aXJlZFByb3BlcnRpZXNbdGhpcy5wcm9wZXJ0eV0gPT09IHRydWU7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBQcm9wZXJ0eVZhbGlkYXRvcjtcblxufSkoKTtcbiIsInZhciBQcm9wZXJ0eVZhbGlkYXRvciwgU2NoZW1lLCBWYWxpZGF0aW9uRXJyb3JzLCB0eXBlLCB2YWxpZGF0b3JzO1xuXG5WYWxpZGF0aW9uRXJyb3JzID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uX2Vycm9ycycpO1xuXG5Qcm9wZXJ0eVZhbGlkYXRvciA9IHJlcXVpcmUoJy4vcHJvcGVydHlfdmFsaWRhdG9yJyk7XG5cbnZhbGlkYXRvcnMgPSByZXF1aXJlKCcuL3ZhbGlkYXRvcnMnKTtcblxudHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVtZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGpzVmFyaWFibGVOYW1lO1xuXG4gIGpzVmFyaWFibGVOYW1lID0gL15bYS16QS1aXVxcdyokLztcblxuICBmdW5jdGlvbiBTY2hlbWUoKSB7XG4gICAgdGhpcy52YWxpZGF0b3JzID0gT2JqZWN0LmNyZWF0ZSh2YWxpZGF0b3JzKTtcbiAgICB0aGlzLnNjaGVtYXMgPSB7fTtcbiAgICB0aGlzLnByb3BlcnRpZXNSZXF1aXJlZCA9IHRydWU7XG4gICAgdGhpcy5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzID0gdHJ1ZTtcbiAgfVxuXG4gIFNjaGVtZS5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHRoaXMucHJvcGVydGllc1JlcXVpcmVkID0gX2FyZy5wcm9wZXJ0aWVzUmVxdWlyZWQsIHRoaXMuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcyA9IF9hcmcuYWxsb3dBZGRpdGlvbmFsUHJvcGVydGllcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG5hbWUsIHNjaGVtYSkge1xuICAgIGlmICh0eXBlLmlzRnVuY3Rpb24oc2NoZW1hKSkge1xuICAgICAgdGhpcy5hZGRWYWxpZGF0b3IobmFtZSwgc2NoZW1hKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRTY2hlbWEobmFtZSwgdGhpcy5wYXJzZUNvbmZpZ09iaihzY2hlbWEsIHZvaWQgMCwgbmFtZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLmFkZFNjaGVtYSA9IGZ1bmN0aW9uKG5hbWUsIHNjaGVtYSkge1xuICAgIGlmICh0aGlzLnZhbGlkYXRvcnNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSB2YWxpZGF0b3IgaXMgYWxyZWR5IHJlZ2lzdGVyZWQgdW5kZXIgdGhpcyBuYW1lOiBcIiArIG5hbWUpO1xuICAgIH1cbiAgICB0aGlzLnNjaGVtYXNbbmFtZV0gPSBzY2hlbWE7XG4gICAgdGhpcy52YWxpZGF0b3JzW25hbWVdID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIGVycm9ycztcbiAgICAgICAgZXJyb3JzID0gX3RoaXMucmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hLCB2YWx1ZSk7XG4gICAgICAgIGlmIChlcnJvcnMuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkVmFsaWRhdG9yID0gZnVuY3Rpb24obmFtZSwgZnVuYykge1xuICAgIHRoaXMudmFsaWRhdG9yc1tuYW1lXSA9IGZ1bmM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHNjaGVtYU5hbWUsIG9iaikge1xuICAgIHZhciBzY2hlbWE7XG4gICAgdGhpcy5lcnJvcnMgPSB2b2lkIDA7XG4gICAgc2NoZW1hID0gdGhpcy5zY2hlbWFzW3NjaGVtYU5hbWVdO1xuICAgIGlmIChzY2hlbWEgPT0gbnVsbCkge1xuICAgICAgdGhpcy5lcnJvcnMgPSBuZXcgVmFsaWRhdGlvbkVycm9ycygpO1xuICAgICAgdGhpcy5lcnJvcnMuYWRkKFwibWlzc2luZyBzY2hlbWFcIiwge1xuICAgICAgICBsb2NhdGlvbjogc2NoZW1hTmFtZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXJyb3JzID0gdGhpcy5yZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWEsIG9iaikuc2V0Um9vdChzY2hlbWFOYW1lKTtcbiAgICByZXR1cm4gIXRoaXMuZXJyb3JzLmhhc0Vycm9ycygpO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuaGFzRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdGhpcy5lcnJvcnMpICE9IG51bGwgPyBfcmVmLmhhc0Vycm9ycygpIDogdm9pZCAwO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuZ2V0RXJyb3JNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfcmVmO1xuICAgIHJldHVybiAoX3JlZiA9IHRoaXMuZXJyb3JzKSAhPSBudWxsID8gX3JlZi5nZXRNZXNzYWdlcygpIDogdm9pZCAwO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUucmVjdXJzaXZlVmFsaWRhdGUgPSBmdW5jdGlvbihzY2hlbWFPYmosIG9iaikge1xuICAgIHZhciBlcnJvcnMsIGlzVmFsaWQsIGtleSwgcGFyZW50VmFsaWRhdG9yLCBwcm9wZXJ0eVZhbGlkYXRvciwgdmFsdWU7XG4gICAgcGFyZW50VmFsaWRhdG9yID0gc2NoZW1hT2JqWydfX3ZhbGlkYXRvciddO1xuICAgIGVycm9ycyA9IG5ldyBWYWxpZGF0aW9uRXJyb3JzKCk7XG4gICAgcGFyZW50VmFsaWRhdG9yLnZhbGlkYXRlKG9iaiwgZXJyb3JzKTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAoc2NoZW1hT2JqW2tleV0gIT0gbnVsbCkge1xuICAgICAgICBwcm9wZXJ0eVZhbGlkYXRvciA9IHNjaGVtYU9ialtrZXldWydfX3ZhbGlkYXRvciddO1xuICAgICAgICBpc1ZhbGlkID0gcHJvcGVydHlWYWxpZGF0b3IudmFsaWRhdGUodmFsdWUsIGVycm9ycyk7XG4gICAgICAgIGlmIChpc1ZhbGlkICYmIChwcm9wZXJ0eVZhbGlkYXRvci5jaGlsZFNjaGVtYU5hbWUgPT0gbnVsbCkgJiYgdHlwZS5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgICBlcnJvcnMuam9pbih0aGlzLnJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYU9ialtrZXldLCB2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnRWYWxpZGF0b3IudmFsaWRhdGVPdGhlclByb3BlcnR5KGtleSwgdmFsdWUsIGVycm9ycyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvcnM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5wYXJzZUNvbmZpZ09iaiA9IGZ1bmN0aW9uKG9iaiwgcGFyZW50VmFsaWRhdG9yKSB7XG4gICAgdmFyIGtleSwgcHJvcFZhbGlkYXRvciwgdmFsdWU7XG4gICAgaWYgKHBhcmVudFZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICBwYXJlbnRWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3Ioe1xuICAgICAgICBpbnB1dFN0cmluZzogJ29iamVjdCcsXG4gICAgICAgIHNjaGVtZTogdGhpc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmICh0aGlzLmFkZFBhcmVudFZhbGlkYXRvcihwYXJlbnRWYWxpZGF0b3IsIGtleSwgdmFsdWUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHByb3BWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3Ioe1xuICAgICAgICAgIGlucHV0U3RyaW5nOiB2YWx1ZSxcbiAgICAgICAgICBwcm9wZXJ0eToga2V5LFxuICAgICAgICAgIHBhcmVudDogcGFyZW50VmFsaWRhdG9yLFxuICAgICAgICAgIHNjaGVtZTogdGhpc1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqW2tleV0gPSB7XG4gICAgICAgICAgJ19fdmFsaWRhdG9yJzogcHJvcFZhbGlkYXRvclxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmICh0eXBlLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICBwcm9wVmFsaWRhdG9yID0gbmV3IFByb3BlcnR5VmFsaWRhdG9yKHtcbiAgICAgICAgICBpbnB1dFN0cmluZzogJ29iamVjdCcsXG4gICAgICAgICAgcHJvcGVydHk6IGtleSxcbiAgICAgICAgICBwYXJlbnQ6IHBhcmVudFZhbGlkYXRvcixcbiAgICAgICAgICBzY2hlbWU6IHRoaXNcbiAgICAgICAgfSk7XG4gICAgICAgIG9ialtrZXldID0gdGhpcy5wYXJzZUNvbmZpZ09iaih2YWx1ZSwgcHJvcFZhbGlkYXRvcik7XG4gICAgICB9XG4gICAgfVxuICAgIG9ialsnX192YWxpZGF0b3InXSA9IHBhcmVudFZhbGlkYXRvcjtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkUGFyZW50VmFsaWRhdG9yID0gZnVuY3Rpb24ocGFyZW50VmFsaWRhdG9yLCBrZXksIHZhbGlkYXRvcikge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlICdfX3ZhbGlkYXRlJzpcbiAgICAgICAgcGFyZW50VmFsaWRhdG9yLmFkZFZhbGlkYXRpb25zKHZhbGlkYXRvcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnX19hZGRpdGlvbmFsUHJvcGVydHknOlxuICAgICAgICBpZiAodHlwZS5pc0Z1bmN0aW9uKHZhbGlkYXRvcikpIHtcbiAgICAgICAgICBwYXJlbnRWYWxpZGF0b3Iub3RoZXJQcm9wZXJ0eVZhbGlkYXRvciA9IHZhbGlkYXRvcjtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS53cml0ZVByb3BlcnR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAoanNWYXJpYWJsZU5hbWUudGVzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBcIi5cIiArIHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJbJ1wiICsgdmFsdWUgKyBcIiddXCI7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBTY2hlbWU7XG5cbn0pKCk7XG4iLCJ2YXIgdG9TdHJpbmcsIHR5cGU7XG5cbnRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSB0eXBlID0ge1xuICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHQ7XG4gICAgdCA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHQgPT09ICdvYmplY3QnICYmICEhb2JqICYmICF0aGlzLmlzQXJyYXkob2JqKTtcbiAgfSxcbiAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH1cbn07XG5cblsnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCcsICdBcnJheSddLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gdHlwZVtcImlzXCIgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09IChcIltvYmplY3QgXCIgKyBuYW1lICsgXCJdXCIpO1xuICB9O1xufSk7XG5cbmlmIChBcnJheS5pc0FycmF5KSB7XG4gIHR5cGUuaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG59XG4iLCJ2YXIgVmFsaWRhdGlvbkVycm9ycywgdHlwZTtcblxudHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRpb25FcnJvcnMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFZhbGlkYXRpb25FcnJvcnMoKSB7fVxuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmhhc0Vycm9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVycm9ycyAhPSBudWxsO1xuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLnNldFJvb3QgPSBmdW5jdGlvbihyb290KSB7XG4gICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihtZXNzYWdlLCBfYXJnKSB7XG4gICAgdmFyIGRlZmF1bHRNZXNzYWdlLCBlcnJvciwgbG9jYXRpb24sIF9yZWY7XG4gICAgX3JlZiA9IF9hcmcgIT0gbnVsbCA/IF9hcmcgOiB7fSwgbG9jYXRpb24gPSBfcmVmLmxvY2F0aW9uLCBkZWZhdWx0TWVzc2FnZSA9IF9yZWYuZGVmYXVsdE1lc3NhZ2U7XG4gICAgaWYgKG1lc3NhZ2UgPT09IGZhbHNlKSB7XG4gICAgICBtZXNzYWdlID0gZGVmYXVsdE1lc3NhZ2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmVycm9ycyA9PSBudWxsKSB7XG4gICAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgIH1cbiAgICBpZiAodHlwZS5pc1N0cmluZyhtZXNzYWdlKSkge1xuICAgICAgdGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgIHBhdGg6IGxvY2F0aW9uLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3JzKSB7XG4gICAgICB0aGlzLmpvaW4obWVzc2FnZSwge1xuICAgICAgICBsb2NhdGlvbjogbG9jYXRpb25cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5wYXRoICYmIG1lc3NhZ2UubWVzc2FnZSkge1xuICAgICAgZXJyb3IgPSBtZXNzYWdlO1xuICAgICAgdGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgIHBhdGg6IGxvY2F0aW9uICsgZXJyb3IucGF0aCxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVmFsaWRhdGlvbkVycm9yLmFkZCgpIHVua25vd24gZXJyb3IgdHlwZScpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uKF9hcmcsIF9hcmcxKSB7XG4gICAgdmFyIGVycm9yLCBlcnJvcnMsIGxvY2F0aW9uLCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgZXJyb3JzID0gX2FyZy5lcnJvcnM7XG4gICAgbG9jYXRpb24gPSAoX2FyZzEgIT0gbnVsbCA/IF9hcmcxIDoge30pLmxvY2F0aW9uO1xuICAgIGlmIChlcnJvcnMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuZXJyb3JzID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGVycm9ycy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBlcnJvciA9IGVycm9yc1tfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2godGhpcy5lcnJvcnMucHVzaCh7XG4gICAgICAgICAgcGF0aDogKGxvY2F0aW9uIHx8ICcnKSArIGVycm9yLnBhdGgsXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfVxuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmdldE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVycm9yLCBtZXNzYWdlcywgX2ksIF9sZW4sIF9yZWY7XG4gICAgbWVzc2FnZXMgPSBbXTtcbiAgICBfcmVmID0gdGhpcy5lcnJvcnMgfHwgW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBlcnJvciA9IF9yZWZbX2ldO1xuICAgICAgbWVzc2FnZXMucHVzaChcIlwiICsgKHRoaXMucm9vdCB8fCAnJykgKyBlcnJvci5wYXRoICsgXCI6IFwiICsgZXJyb3IubWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlcztcbiAgfTtcblxuICByZXR1cm4gVmFsaWRhdGlvbkVycm9ycztcblxufSkoKTtcbiIsInZhciB0eXBlO1xuXG50eXBlID0gcmVxdWlyZSgnLi90eXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAnb2JqZWN0JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc09iamVjdCh2YWx1ZSk7XG4gIH0sXG4gICdzdHJpbmcnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzU3RyaW5nKHZhbHVlKTtcbiAgfSxcbiAgJ2Jvb2xlYW4nOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzQm9vbGVhbih2YWx1ZSk7XG4gIH0sXG4gICdudW1iZXInOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzTnVtYmVyKHZhbHVlKTtcbiAgfSxcbiAgJ2Z1bmN0aW9uJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0Z1bmN0aW9uKHZhbHVlKTtcbiAgfSxcbiAgJ2RhdGUnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzRGF0ZSh2YWx1ZSk7XG4gIH0sXG4gICdyZWdleHAnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzUmVnRXhwKHZhbHVlKTtcbiAgfSxcbiAgJ2FycmF5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZS5pc0FycmF5KHZhbHVlKTtcbiAgfSxcbiAgJ2ZhbHN5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gISF2YWx1ZSA9PT0gZmFsc2U7XG4gIH0sXG4gICd0cnV0aHknOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlID09PSB0cnVlO1xuICB9LFxuICAnbm90IGVtcHR5JzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gISF2YWx1ZSA9PT0gdHJ1ZTtcbiAgfSxcbiAgJ2RlcHJlY2F0ZWQnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi45IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG4gICAgICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuICAgICAqXG4gICAgICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG4gICAgLy8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcbiAgICB2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuICAgIHZhciBleHBvcnRzID0gdGhpcztcbiAgICB2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0cyBzdG9yYWdlIGFycmF5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cbiAgICAgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG4gICAgICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG4gICAgICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG4gICAgICAgIC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgICAgaWYgKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICovXG4gICAgcHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG4gICAgICAgIHZhciBmbGF0TGlzdGVuZXJzID0gW107XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuICAgICAqL1xuICAgIHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAgICAgaWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IHt9O1xuICAgICAgICAgICAgcmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cbiAgICAgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG4gICAgLyoqXG4gICAgICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcbiAgICAgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXRzIGZpcnN0IGV4ZWN1dGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG4gICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICBvbmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG4gICAgICovXG4gICAgcHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG4gICAgICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuICAgICAgICB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGluZGV4O1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuICAgICAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuICAgICAgICAvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuICAgICAgICByZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cbiAgICAgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICB2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG4gICAgICAgIHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cbiAgICAgICAgLy8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdHMgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuICAgICAgICBpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2RcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcbiAgICAgICAgICAgIC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcbiAgICAgICAgICAgIC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG4gICAgICAgICAgICBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICAvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuICAgICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW2V2dF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cbiAgICAgKlxuICAgICAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cbiAgICAgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG4gICAgICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuICAgICAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGxpc3RlbmVyO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgZW1pdEV2ZW50XG4gICAgICovXG4gICAgcHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuICAgIC8qKlxuICAgICAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cbiAgICAgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG4gICAgICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuICAgICAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG4gICAgICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuICAgICAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuICAgICAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cbiAgICAgKi9cbiAgICBFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcbiAgICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICB9O1xuXG4gICAgLy8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3RcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuICAgIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcnKVxuTGl2aW5nZG9jID0gcmVxdWlyZSgnLi9saXZpbmdkb2MnKVxuQ29tcG9uZW50VHJlZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUnKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuRWRpdG9yUGFnZSA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9lZGl0b3JfcGFnZScpXG5Kc0xvYWRlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9qc19sb2FkZXInKVxuQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2Nzc19sb2FkZXInKVxudmVyc2lvbiA9IHJlcXVpcmUoJy4uL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuICAjIFNldCB0aGUgY3VycmVudCB2ZXJzaW9uXG4gIHZlcnNpb246IHZlcnNpb24udmVyc2lvblxuICByZXZpc2lvbjogdmVyc2lvbi5yZXZpc2lvblxuXG5cbiAgIyBMb2FkIGFuZCBhY2Nlc3MgZGVzaWducy5cbiAgI1xuICAjIExvYWQgYSBkZXNpZ246XG4gICMgZGVzaWduLmxvYWQoeW91ckRlc2lnbkpzb24pXG4gICNcbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBhbHJlYWR5IGxvYWRlZDpcbiAgIyBkZXNpZ24uaGFzKG5hbWVPZllvdXJEZXNpZ24pXG4gICNcbiAgIyBHZXQgYW4gYWxyZWFkeSBsb2FkZWQgZGVzaWduOlxuICAjIGRlc2lnbi5nZXQobmFtZU9mWW91ckRlc2lnbilcbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG5cbiAgIyBEaXJlY3QgYWNjZXNzIHRvIG1vZGVsc1xuICBMaXZpbmdkb2M6IExpdmluZ2RvY1xuICBDb21wb25lbnRUcmVlOiBDb21wb25lbnRUcmVlXG5cblxuICAjIExvYWQgYSBsaXZpbmdkb2MgZnJvbSBzZXJpYWxpemVkIGRhdGEgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBjcmVhdGVMaXZpbmdkb2M6ICh7IGRhdGEsIGRlc2lnbiwgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIExpdmluZ2RvYy5jcmVhdGUoeyBkYXRhLCBkZXNpZ25OYW1lOiBkZXNpZ24sIGNvbXBvbmVudFRyZWUgfSlcblxuXG4gICMgQWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIG5ldzogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIGNyZWF0ZTogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuXG4gICMgQ2hhbmdlIHRoZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cbiAgIyBFeHBvc2UgbW9kdWxlcyBhbmQgY2xhc3NlcyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBlZGl0b3JcbiAgSnNMb2FkZXI6IEpzTG9hZGVyXG4gIENzc0xvYWRlcjogQ3NzTG9hZGVyXG5cblxuXG5cbiMgRXhwb3J0IGdsb2JhbCB2YXJpYWJsZVxud2luZG93LmRvYyA9IGRvY1xuXG4iLCIjIGpRdWVyeSBsaWtlIHJlc3VsdHMgd2hlbiBzZWFyY2hpbmcgZm9yIGNvbXBvbmVudHMuXG4jIGBkb2MoXCJoZXJvXCIpYCB3aWxsIHJldHVybiBhIENvbXBvbmVudEFycmF5IHRoYXQgd29ya3Mgc2ltaWxhciB0byBhIGpRdWVyeSBvYmplY3QuXG4jIEZvciBleHRlbnNpYmlsaXR5IHZpYSBwbHVnaW5zIHdlIGV4cG9zZSB0aGUgcHJvdG90eXBlIG9mIENvbXBvbmVudEFycmF5IHZpYSBgZG9jLmZuYC5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50QXJyYXlcblxuXG4gICMgQHBhcmFtIGNvbXBvbmVudHM6IGFycmF5IG9mIGNvbXBvbmVudHNcbiAgY29uc3RydWN0b3I6IChAY29tcG9uZW50cykgLT5cbiAgICBAY29tcG9uZW50cyA/PSBbXVxuICAgIEBjcmVhdGVQc2V1ZG9BcnJheSgpXG5cblxuICBjcmVhdGVQc2V1ZG9BcnJheTogKCkgLT5cbiAgICBmb3IgcmVzdWx0LCBpbmRleCBpbiBAY29tcG9uZW50c1xuICAgICAgQFtpbmRleF0gPSByZXN1bHRcblxuICAgIEBsZW5ndGggPSBAY29tcG9uZW50cy5sZW5ndGhcbiAgICBpZiBAY29tcG9uZW50cy5sZW5ndGhcbiAgICAgIEBmaXJzdCA9IEBbMF1cbiAgICAgIEBsYXN0ID0gQFtAY29tcG9uZW50cy5sZW5ndGggLSAxXVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBjb21wb25lbnQgaW4gQGNvbXBvbmVudHNcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgY29tcG9uZW50LnJlbW92ZSgpXG5cbiAgICB0aGlzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBDb21wb25lbnRDb250YWluZXJcbiMgLS0tLS0tLS0tLS0tLS0tLVxuIyBBIENvbXBvbmVudENvbnRhaW5lciBjb250YWlucyBhbmQgbWFuYWdlcyBhIGxpbmtlZCBsaXN0XG4jIG9mIGNvbXBvbmVudHMuXG4jXG4jIFRoZSBjb21wb25lbnRDb250YWluZXIgaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgaXRzIGNvbXBvbmVudFRyZWVcbiMgaW5mb3JtZWQgYWJvdXQgY2hhbmdlcyAob25seSBpZiB0aGV5IGFyZSBhdHRhY2hlZCB0byBvbmUpLlxuI1xuIyBAcHJvcCBmaXJzdDogZmlyc3QgY29tcG9uZW50IGluIHRoZSBjb250YWluZXJcbiMgQHByb3AgbGFzdDogbGFzdCBjb21wb25lbnQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBwYXJlbnRDb21wb25lbnQ6IHBhcmVudCBDb21wb25lbnRNb2RlbFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRDb250YWluZXJcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAcGFyZW50Q29tcG9uZW50LCBAbmFtZSwgaXNSb290IH0pIC0+XG4gICAgQGlzUm9vdCA9IGlzUm9vdD9cbiAgICBAZmlyc3QgPSBAbGFzdCA9IHVuZGVmaW5lZFxuXG5cbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAZmlyc3RcbiAgICAgIEBpbnNlcnRCZWZvcmUoQGZpcnN0LCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cbiAgICB0aGlzXG5cblxuICBhcHBlbmQ6IChjb21wb25lbnQpIC0+XG4gICAgaWYgQHBhcmVudENvbXBvbmVudFxuICAgICAgYXNzZXJ0IGNvbXBvbmVudCBpc250IEBwYXJlbnRDb21wb25lbnQsICdjYW5ub3QgYXBwZW5kIGNvbXBvbmVudCB0byBpdHNlbGYnXG5cbiAgICBpZiBAbGFzdFxuICAgICAgQGluc2VydEFmdGVyKEBsYXN0LCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgQGF0dGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cbiAgICB0aGlzXG5cblxuICBpbnNlcnRCZWZvcmU6IChjb21wb25lbnQsIGluc2VydGVkQ29tcG9uZW50KSAtPlxuICAgIHJldHVybiBpZiBjb21wb25lbnQucHJldmlvdXMgPT0gaW5zZXJ0ZWRDb21wb25lbnRcbiAgICBhc3NlcnQgY29tcG9uZW50IGlzbnQgaW5zZXJ0ZWRDb21wb25lbnQsICdjYW5ub3QgaW5zZXJ0IGNvbXBvbmVudCBiZWZvcmUgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IGNvbXBvbmVudC5wcmV2aW91c1xuICAgICAgbmV4dDogY29tcG9uZW50XG4gICAgICBwYXJlbnRDb250YWluZXI6IGNvbXBvbmVudC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hDb21wb25lbnQoaW5zZXJ0ZWRDb21wb25lbnQsIHBvc2l0aW9uKVxuXG5cbiAgaW5zZXJ0QWZ0ZXI6IChjb21wb25lbnQsIGluc2VydGVkQ29tcG9uZW50KSAtPlxuICAgIHJldHVybiBpZiBjb21wb25lbnQubmV4dCA9PSBpbnNlcnRlZENvbXBvbmVudFxuICAgIGFzc2VydCBjb21wb25lbnQgaXNudCBpbnNlcnRlZENvbXBvbmVudCwgJ2Nhbm5vdCBpbnNlcnQgY29tcG9uZW50IGFmdGVyIGl0c2VsZidcblxuICAgIHBvc2l0aW9uID1cbiAgICAgIHByZXZpb3VzOiBjb21wb25lbnRcbiAgICAgIG5leHQ6IGNvbXBvbmVudC5uZXh0XG4gICAgICBwYXJlbnRDb250YWluZXI6IGNvbXBvbmVudC5wYXJlbnRDb250YWluZXJcblxuICAgIEBhdHRhY2hDb21wb25lbnQoaW5zZXJ0ZWRDb21wb25lbnQsIHBvc2l0aW9uKVxuXG5cbiAgdXA6IChjb21wb25lbnQpIC0+XG4gICAgaWYgY29tcG9uZW50LnByZXZpb3VzP1xuICAgICAgQGluc2VydEJlZm9yZShjb21wb25lbnQucHJldmlvdXMsIGNvbXBvbmVudClcblxuXG4gIGRvd246IChjb21wb25lbnQpIC0+XG4gICAgaWYgY29tcG9uZW50Lm5leHQ/XG4gICAgICBAaW5zZXJ0QWZ0ZXIoY29tcG9uZW50Lm5leHQsIGNvbXBvbmVudClcblxuXG4gIGdldENvbXBvbmVudFRyZWU6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUgfHwgQHBhcmVudENvbXBvbmVudD8uY29tcG9uZW50VHJlZVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29tcG9uZW50c1xuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgY29tcG9uZW50ID0gQGZpcnN0XG4gICAgd2hpbGUgKGNvbXBvbmVudClcbiAgICAgIGNvbXBvbmVudC5kZXNjZW5kYW50c0FuZFNlbGYoY2FsbGJhY2spXG4gICAgICBjb21wb25lbnQgPSBjb21wb25lbnQubmV4dFxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgIyBUcmF2ZXJzZSBhbGwgY29tcG9uZW50cyBhbmQgY29udGFpbmVyc1xuICBhbGw6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICBjYWxsYmFjayhjb21wb25lbnQpXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gIHJlbW92ZTogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQuZGVzdHJveSgpXG4gICAgQF9kZXRhY2hDb21wb25lbnQoY29tcG9uZW50KVxuXG5cbiAgIyBQcml2YXRlXG4gICMgLS0tLS0tLVxuXG4gICMgRXZlcnkgY29tcG9uZW50IGFkZGVkIG9yIG1vdmVkIG1vc3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIGNvbXBvbmVudFRyZWUgaWYgdGhlIHBhcmVudCBjb21wb25lbnQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQGFwaSBwcml2YXRlXG4gIGF0dGFjaENvbXBvbmVudDogKGNvbXBvbmVudCwgcG9zaXRpb24gPSB7fSkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEBsaW5rKGNvbXBvbmVudCwgcG9zaXRpb24pXG5cbiAgICBpZiBjb21wb25lbnRUcmVlID0gQGdldENvbXBvbmVudFRyZWUoKVxuICAgICAgY29tcG9uZW50VHJlZS5hdHRhY2hpbmdDb21wb25lbnQoY29tcG9uZW50LCBmdW5jKVxuICAgIGVsc2VcbiAgICAgIGZ1bmMoKVxuXG5cbiAgIyBFdmVyeSBjb21wb25lbnQgdGhhdCBpcyByZW1vdmVkIG11c3QgY29tZSB0aHJvdWdoIGhlcmUuXG4gICMgTm90aWZpZXMgdGhlIGNvbXBvbmVudFRyZWUgaWYgdGhlIHBhcmVudCBjb21wb25lbnQgaXNcbiAgIyBhdHRhY2hlZCB0byBvbmUuXG4gICMgQ29tcG9uZW50cyB0aGF0IGFyZSBtb3ZlZCBpbnNpZGUgYSBjb21wb25lbnRUcmVlIHNob3VsZCBub3RcbiAgIyBjYWxsIF9kZXRhY2hDb21wb25lbnQgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBmaXJlXG4gICMgQ29tcG9uZW50UmVtb3ZlZCBldmVudHMgb24gdGhlIGNvbXBvbmVudFRyZWUsIGluIHRoZXNlXG4gICMgY2FzZXMgdW5saW5rIGNhbiBiZSB1c2VkXG4gICMgQGFwaSBwcml2YXRlXG4gIF9kZXRhY2hDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgZnVuYyA9ID0+XG4gICAgICBAdW5saW5rKGNvbXBvbmVudClcblxuICAgIGlmIGNvbXBvbmVudFRyZWUgPSBAZ2V0Q29tcG9uZW50VHJlZSgpXG4gICAgICBjb21wb25lbnRUcmVlLmRldGFjaGluZ0NvbXBvbmVudChjb21wb25lbnQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBsaW5rOiAoY29tcG9uZW50LCBwb3NpdGlvbikgLT5cbiAgICBAdW5saW5rKGNvbXBvbmVudCkgaWYgY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgcG9zaXRpb24ucGFyZW50Q29udGFpbmVyIHx8PSB0aGlzXG4gICAgQHNldENvbXBvbmVudFBvc2l0aW9uKGNvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICB1bmxpbms6IChjb21wb25lbnQpIC0+XG4gICAgY29udGFpbmVyID0gY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuICAgIGlmIGNvbnRhaW5lclxuXG4gICAgICAjIHVwZGF0ZSBwYXJlbnRDb250YWluZXIgbGlua3NcbiAgICAgIGNvbnRhaW5lci5maXJzdCA9IGNvbXBvbmVudC5uZXh0IHVubGVzcyBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBjb250YWluZXIubGFzdCA9IGNvbXBvbmVudC5wcmV2aW91cyB1bmxlc3MgY29tcG9uZW50Lm5leHQ/XG5cbiAgICAgICMgdXBkYXRlIHByZXZpb3VzIGFuZCBuZXh0IG5vZGVzXG4gICAgICBjb21wb25lbnQubmV4dD8ucHJldmlvdXMgPSBjb21wb25lbnQucHJldmlvdXNcbiAgICAgIGNvbXBvbmVudC5wcmV2aW91cz8ubmV4dCA9IGNvbXBvbmVudC5uZXh0XG5cbiAgICAgIEBzZXRDb21wb25lbnRQb3NpdGlvbihjb21wb25lbnQsIHt9KVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgc2V0Q29tcG9uZW50UG9zaXRpb246IChjb21wb25lbnQsIHsgcGFyZW50Q29udGFpbmVyLCBwcmV2aW91cywgbmV4dCB9KSAtPlxuICAgIGNvbXBvbmVudC5wYXJlbnRDb250YWluZXIgPSBwYXJlbnRDb250YWluZXJcbiAgICBjb21wb25lbnQucHJldmlvdXMgPSBwcmV2aW91c1xuICAgIGNvbXBvbmVudC5uZXh0ID0gbmV4dFxuXG4gICAgaWYgcGFyZW50Q29udGFpbmVyXG4gICAgICBwcmV2aW91cy5uZXh0ID0gY29tcG9uZW50IGlmIHByZXZpb3VzXG4gICAgICBuZXh0LnByZXZpb3VzID0gY29tcG9uZW50IGlmIG5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lci5maXJzdCA9IGNvbXBvbmVudCB1bmxlc3MgY29tcG9uZW50LnByZXZpb3VzP1xuICAgICAgcGFyZW50Q29udGFpbmVyLmxhc3QgPSBjb21wb25lbnQgdW5sZXNzIGNvbXBvbmVudC5uZXh0P1xuXG5cbiIsIiMgUHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgYXZhaWxhYmxlOlxuIyBAbmFtZVxuIyBAdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnREaXJlY3RpdmVcblxuICAjXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5zZXRDb250ZW50KEBuYW1lLCB2YWx1ZSlcblxuXG4gICMgU2V0IGRhdGEgdGhhdCB3aWxsIGJlIHBlcnNpc3RlZCBhbG9uZ1xuICAjIHdpdGggdGhlIGNvbXBvbmVudE1vZGVsXG4gIHNldERhdGE6IChrZXksIHZhbHVlKSAtPlxuICAgIGRhdGFTdG9yZSA9IFwiXyN7IEBuYW1lIH1EaXJlY3RpdmVcIlxuICAgIGRpcmVjdGl2ZURhdGEgPSBAY29tcG9uZW50LmdldERhdGEoZGF0YVN0b3JlKVxuICAgIGRpcmVjdGl2ZURhdGEgPz0ge31cbiAgICBkaXJlY3RpdmVEYXRhW2tleV0gPSB2YWx1ZVxuICAgIEBjb21wb25lbnQuc2V0RGF0YShkYXRhU3RvcmUsIGRpcmVjdGl2ZURhdGEpXG5cblxuICBnZXREYXRhOiAoa2V5KSAtPlxuICAgIGlmIGtleVxuICAgICAgQGNvbXBvbmVudC5kYXRhVmFsdWVzW1wiXyN7IEBuYW1lIH1EaXJlY3RpdmVcIl0/W2tleV1cbiAgICBlbHNlXG4gICAgICBAY29tcG9uZW50LmRhdGFWYWx1ZXNbXCJfI3sgQG5hbWUgfURpcmVjdGl2ZVwiXVxuXG5cbiAgIyBTZXQgYSB0ZW1wb3JhcnkgdmFsdWUgdGhhdCB3aWxsIG5vdCBiZSBwZXJzaXN0ZWRcbiAgc2V0VG1wOiAoa2V5LCB2YWx1ZSkgLT5cbiAgICBAdG1wID0ge31cbiAgICBAdG1wW2tleV0gPSB2YWx1ZVxuXG5cbiAgZ2V0VG1wOiAoa2V5KSAtPlxuICAgIEB0bXA/W2tleV1cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuaW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi4vaW1hZ2Vfc2VydmljZXMvaW1hZ2Vfc2VydmljZScpXG5cbkVkaXRhYmxlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9lZGl0YWJsZV9kaXJlY3RpdmUnKVxuSW1hZ2VEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2ltYWdlX2RpcmVjdGl2ZScpXG5IdG1sRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9odG1sX2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBjcmVhdGU6ICh7IGNvbXBvbmVudCwgdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBEaXJlY3RpdmUgPSBAZ2V0RGlyZWN0aXZlQ29uc3RydWN0b3IodGVtcGxhdGVEaXJlY3RpdmUudHlwZSlcbiAgICBuZXcgRGlyZWN0aXZlKHsgY29tcG9uZW50LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KVxuXG5cbiAgZ2V0RGlyZWN0aXZlQ29uc3RydWN0b3I6IChkaXJlY3RpdmVUeXBlKSAtPlxuICAgIHN3aXRjaCBkaXJlY3RpdmVUeXBlXG4gICAgICB3aGVuICdlZGl0YWJsZSdcbiAgICAgICAgRWRpdGFibGVEaXJlY3RpdmVcbiAgICAgIHdoZW4gJ2ltYWdlJ1xuICAgICAgICBJbWFnZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgSHRtbERpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBhc3NlcnQgZmFsc2UsIFwiVW5zdXBwb3J0ZWQgY29tcG9uZW50IGRpcmVjdGl2ZTogI3sgZGlyZWN0aXZlVHlwZSB9XCJcblxuIiwiZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5Db21wb25lbnRDb250YWluZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9jb250YWluZXInKVxuZ3VpZCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZ3VpZCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGlyZWN0aXZlRmFjdG9yeSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2RpcmVjdGl2ZV9mYWN0b3J5JylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5cbiMgQ29tcG9uZW50TW9kZWxcbiMgLS0tLS0tLS0tLS0tXG4jIEVhY2ggQ29tcG9uZW50TW9kZWwgaGFzIGEgdGVtcGxhdGUgd2hpY2ggYWxsb3dzIHRvIGdlbmVyYXRlIGEgY29tcG9uZW50Vmlld1xuIyBmcm9tIGEgY29tcG9uZW50TW9kZWxcbiNcbiMgUmVwcmVzZW50cyBhIG5vZGUgaW4gYSBDb21wb25lbnRUcmVlLlxuIyBFdmVyeSBDb21wb25lbnRNb2RlbCBjYW4gaGF2ZSBhIHBhcmVudCAoQ29tcG9uZW50Q29udGFpbmVyKSxcbiMgc2libGluZ3MgKG90aGVyIGNvbXBvbmVudHMpIGFuZCBtdWx0aXBsZSBjb250YWluZXJzIChDb21wb25lbnRDb250YWluZXJzKS5cbiNcbiMgVGhlIGNvbnRhaW5lcnMgYXJlIHRoZSBwYXJlbnRzIG9mIHRoZSBjaGlsZCBDb21wb25lbnRNb2RlbHMuXG4jIEUuZy4gYSBncmlkIHJvdyB3b3VsZCBoYXZlIGFzIG1hbnkgY29udGFpbmVycyBhcyBpdCBoYXNcbiMgY29sdW1uc1xuI1xuIyAjIEBwcm9wIHBhcmVudENvbnRhaW5lcjogcGFyZW50IENvbXBvbmVudENvbnRhaW5lclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRNb2RlbFxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAdGVtcGxhdGUsIGlkIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQHRlbXBsYXRlLCAnY2Fubm90IGluc3RhbnRpYXRlIGNvbXBvbmVudCB3aXRob3V0IHRlbXBsYXRlIHJlZmVyZW5jZSdcblxuICAgIEBpbml0aWFsaXplRGlyZWN0aXZlcygpXG4gICAgQHN0eWxlcyA9IHt9XG4gICAgQGRhdGFWYWx1ZXMgPSB7fVxuICAgIEBpZCA9IGlkIHx8IGd1aWQubmV4dCgpXG4gICAgQGNvbXBvbmVudE5hbWUgPSBAdGVtcGxhdGUubmFtZVxuXG4gICAgQG5leHQgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgQHByZXZpb3VzID0gdW5kZWZpbmVkICMgc2V0IGJ5IENvbXBvbmVudENvbnRhaW5lclxuICAgIEBjb21wb25lbnRUcmVlID0gdW5kZWZpbmVkICMgc2V0IGJ5IENvbXBvbmVudFRyZWVcblxuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzOiAtPlxuICAgIEBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBAdGVtcGxhdGUuZGlyZWN0aXZlc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAY29udGFpbmVycyB8fD0ge31cbiAgICAgICAgICBAY29udGFpbmVyc1tkaXJlY3RpdmUubmFtZV0gPSBuZXcgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgICAgICAgICBuYW1lOiBkaXJlY3RpdmUubmFtZVxuICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50OiB0aGlzXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJywgJ2ltYWdlJywgJ2h0bWwnXG4gICAgICAgICAgQGNyZWF0ZUNvbXBvbmVudERpcmVjdGl2ZShkaXJlY3RpdmUpXG4gICAgICAgICAgQGNvbnRlbnQgfHw9IHt9XG4gICAgICAgICAgQGNvbnRlbnRbZGlyZWN0aXZlLm5hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZSBkaXJlY3RpdmUgdHlwZSAnI3sgZGlyZWN0aXZlLnR5cGUgfScgbm90IGltcGxlbWVudGVkIGluIENvbXBvbmVudE1vZGVsXCJcblxuXG4gICMgQ3JlYXRlIGEgZGlyZWN0aXZlIGZvciAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCcgdGVtcGxhdGUgZGlyZWN0aXZlc1xuICBjcmVhdGVDb21wb25lbnREaXJlY3RpdmU6ICh0ZW1wbGF0ZURpcmVjdGl2ZSkgLT5cbiAgICBAZGlyZWN0aXZlcy5hZGQgZGlyZWN0aXZlRmFjdG9yeS5jcmVhdGVcbiAgICAgIGNvbXBvbmVudDogdGhpc1xuICAgICAgdGVtcGxhdGVEaXJlY3RpdmU6IHRlbXBsYXRlRGlyZWN0aXZlXG5cblxuICAjIFZpZXcgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgY3JlYXRlVmlldzogKGlzUmVhZE9ubHkpIC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZVZpZXcodGhpcywgaXNSZWFkT25seSlcblxuXG4gIGdldE1haW5WaWV3OiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmdldE1haW5Db21wb25lbnRWaWV3KHRoaXMuaWQpXG5cblxuICAjIENvbXBvbmVudFRyZWUgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgY29tcG9uZW50TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIGNvbXBvbmVudE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBjb21wb25lbnQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBpZiBjb21wb25lbnRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBjb21wb25lbnRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChjb21wb25lbnRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgY29tcG9uZW50TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKGNvbXBvbmVudE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIGNvbXBvbmVudCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBjb21wb25lbnQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIGNvbXBvbmVudCBmcm9tIGl0cyBjb250YWluZXIgYW5kIENvbXBvbmVudFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIENvbXBvbmVudFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIGNvbXBvbmVudFRyZWUgcmVsYXRpdmUgdG8gdGhpcyBjb21wb25lbnQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRDb21wb25lbnRcblxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRNb2RlbClcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjb21wb25lbnRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIGNvbXBvbmVudE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIGNvbXBvbmVudHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChjb21wb25lbnRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKSBpZiBjb21wb25lbnRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IGNvbXBvbmVudE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBjb21wb25lbnRcbiAgc2V0Q29udGVudDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgaWYgQGNvbnRlbnRbbmFtZV1cbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICBpZiBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSAhPSB2YWx1ZVxuICAgICAgICBkaXJlY3RpdmUuc2V0SW1hZ2VVcmwodmFsdWUpXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAY29tcG9uZW50VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgY29tcG9uZW50TW9kZWwuXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgIyBnZXR0ZXI6XG4gICMgICBkYXRhKCkgb3JcbiAgIyAgIGRhdGEoJ215LWtleScpXG4gICMgc2V0dGVyOlxuICAjICAgZGF0YSgnbXkta2V5JzogJ2F3ZXNvbWUnKVxuICBkYXRhOiAoYXJnKSAtPlxuICAgIGlmIHR5cGVvZihhcmcpID09ICdvYmplY3QnXG4gICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMgPSBbXVxuICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIGFyZ1xuICAgICAgICBpZiBAY2hhbmdlRGF0YShuYW1lLCB2YWx1ZSlcbiAgICAgICAgICBjaGFuZ2VkRGF0YVByb3BlcnRpZXMucHVzaChuYW1lKVxuICAgICAgaWYgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgQGNvbXBvbmVudFRyZWU/LmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZSBpZiBhcmdcbiAgICAgIEBkYXRhVmFsdWVzW2FyZ11cbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1xuXG5cbiAgc2V0RGF0YTogKGtleSwgdmFsdWUpIC0+XG4gICAgaWYga2V5ICYmIEBjaGFuZ2VEYXRhKGtleSwgdmFsdWUpXG4gICAgICBAY29tcG9uZW50VHJlZT8uZGF0YUNoYW5naW5nKHRoaXMsIFtrZXldKVxuXG5cbiAgZ2V0RGF0YTogKGtleSkgLT5cbiAgICBpZiBrZXlcbiAgICAgIEBkYXRhVmFsdWVzW2tleV1cbiAgICBlbHNlXG4gICAgICBAZGF0YVZhbHVlc1xuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBmYWxzZSBpZiBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuXG4gICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgIHRydWVcblxuXG4gICMgU3R5bGUgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS1cblxuICBnZXRTdHlsZTogKG5hbWUpIC0+XG4gICAgQHN0eWxlc1tuYW1lXVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBzdHlsZSA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV1cbiAgICBpZiBub3Qgc3R5bGVcbiAgICAgIGxvZy53YXJuIFwiVW5rbm93biBzdHlsZSAnI3sgbmFtZSB9JyBpbiBDb21wb25lbnRNb2RlbCAjeyBAY29tcG9uZW50TmFtZSB9XCJcbiAgICBlbHNlIGlmIG5vdCBzdHlsZS52YWxpZGF0ZVZhbHVlKHZhbHVlKVxuICAgICAgbG9nLndhcm4gXCJJbnZhbGlkIHZhbHVlICcjeyB2YWx1ZSB9JyBmb3Igc3R5bGUgJyN7IG5hbWUgfScgaW4gQ29tcG9uZW50TW9kZWwgI3sgQGNvbXBvbmVudE5hbWUgfVwiXG4gICAgZWxzZVxuICAgICAgaWYgQHN0eWxlc1tuYW1lXSAhPSB2YWx1ZVxuICAgICAgICBAc3R5bGVzW25hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgQGNvbXBvbmVudFRyZWVcbiAgICAgICAgICBAY29tcG9uZW50VHJlZS5odG1sQ2hhbmdpbmcodGhpcywgJ3N0eWxlJywgeyBuYW1lLCB2YWx1ZSB9KVxuXG5cbiAgIyBAZGVwcmVjYXRlZFxuICAjIEdldHRlciBhbmQgU2V0dGVyIGluIG9uZS5cbiAgc3R5bGU6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBjb25zb2xlLmxvZyhcIkNvbXBvbmVudE1vZGVsI3N0eWxlKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAjZ2V0U3R5bGUoKSBhbmQgI3NldFN0eWxlKCkuXCIpXG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBAc3R5bGVzW25hbWVdXG4gICAgZWxzZVxuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG5cbiAgIyBDb21wb25lbnRNb2RlbCBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb3B5OiAtPlxuICAgIGxvZy53YXJuKFwiQ29tcG9uZW50TW9kZWwjY29weSgpIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpXG5cbiAgICAjIHNlcmlhbGl6aW5nL2Rlc2VyaWFsaXppbmcgc2hvdWxkIHdvcmsgYnV0IG5lZWRzIHRvIGdldCBzb21lIHRlc3RzIGZpcnN0XG4gICAgIyBqc29uID0gQHRvSnNvbigpXG4gICAgIyBqc29uLmlkID0gZ3VpZC5uZXh0KClcbiAgICAjIENvbXBvbmVudE1vZGVsLmZyb21Kc29uKGpzb24pXG5cblxuICBjb3B5V2l0aG91dENvbnRlbnQ6IC0+XG4gICAgQHRlbXBsYXRlLmNyZWF0ZU1vZGVsKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyB0b2RvOiBtb3ZlIGludG8gdG8gcmVuZGVyZXJcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5kZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmd1aWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2d1aWQnKVxubG9nID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2xvZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkNvbXBvbmVudE1vZGVsID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWwnKVxuc2VyaWFsaXphdGlvbiA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VyaWFsaXphdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIFB1YmxpYyBNZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS1cblxuICAjIFNlcmlhbGl6ZSBhIENvbXBvbmVudE1vZGVsXG4gICNcbiAgIyBFeHRlbmRzIHRoZSBwcm90b3R5cGUgb2YgQ29tcG9uZW50TW9kZWxcbiAgI1xuICAjIEV4YW1wbGUgUmVzdWx0OlxuICAjIGlkOiAnYWtrN2hqdXVlMidcbiAgIyBpZGVudGlmaWVyOiAndGltZWxpbmUudGl0bGUnXG4gICMgY29udGVudDogeyAuLi4gfVxuICAjIHN0eWxlczogeyAuLi4gfVxuICAjIGRhdGE6IHsgLi4uIH1cbiAgIyBjb250YWluZXJzOiB7IC4uLiB9XG4gIENvbXBvbmVudE1vZGVsOjp0b0pzb24gPSAoY29tcG9uZW50KSAtPlxuICAgIGNvbXBvbmVudCA/PSB0aGlzXG5cbiAgICBqc29uID1cbiAgICAgIGlkOiBjb21wb25lbnQuaWRcbiAgICAgIGlkZW50aWZpZXI6IGNvbXBvbmVudC50ZW1wbGF0ZS5pZGVudGlmaWVyXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KGNvbXBvbmVudC5jb250ZW50KVxuICAgICAganNvbi5jb250ZW50ID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShjb21wb25lbnQuY29udGVudClcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoY29tcG9uZW50LnN0eWxlcylcbiAgICAgIGpzb24uc3R5bGVzID0gc2VyaWFsaXphdGlvbi5mbGF0Q29weShjb21wb25lbnQuc3R5bGVzKVxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShjb21wb25lbnQuZGF0YVZhbHVlcylcbiAgICAgIGpzb24uZGF0YSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBjb21wb25lbnQuZGF0YVZhbHVlcylcblxuICAgICMgY3JlYXRlIGFuIGFycmF5IGZvciBldmVyeSBjb250YWluZXJcbiAgICBmb3IgbmFtZSBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAganNvbi5jb250YWluZXJzIHx8PSB7fVxuICAgICAganNvbi5jb250YWluZXJzW25hbWVdID0gW11cblxuICAgIGpzb25cblxuXG4gIGZyb21Kc29uOiAoanNvbiwgZGVzaWduKSAtPlxuICAgIHRlbXBsYXRlID0gZGVzaWduLmdldChqc29uLmNvbXBvbmVudCB8fCBqc29uLmlkZW50aWZpZXIpXG5cbiAgICBhc3NlcnQgdGVtcGxhdGUsXG4gICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgY29tcG9uZW50OiB1bmtub3duIHRlbXBsYXRlIGlkZW50aWZpZXIgJyN7IGpzb24uaWRlbnRpZmllciB9J1wiXG5cbiAgICBtb2RlbCA9IG5ldyBDb21wb25lbnRNb2RlbCh7IHRlbXBsYXRlLCBpZDoganNvbi5pZCB9KVxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGpzb24uY29udGVudFxuICAgICAgYXNzZXJ0IG1vZGVsLmNvbnRlbnQuaGFzT3duUHJvcGVydHkobmFtZSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQgI3sgbW9kZWwuY29tcG9uZW50TmFtZSB9OiB1bmtub3duIGNvbnRlbnQgJyN7IG5hbWUgfSdcIlxuXG4gICAgICAjIFRyYW5zZm9ybSBzdHJpbmcgaW50byBvYmplY3Q6IEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBvbGQgaW1hZ2UgdmFsdWVzLlxuICAgICAgaWYgbW9kZWwuZGlyZWN0aXZlcy5nZXQobmFtZSkudHlwZSA9PSAnaW1hZ2UnICYmIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJ1xuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID1cbiAgICAgICAgICB1cmw6IHZhbHVlXG4gICAgICBlbHNlXG4gICAgICAgIG1vZGVsLmNvbnRlbnRbbmFtZV0gPSB2YWx1ZVxuXG4gICAgZm9yIHN0eWxlTmFtZSwgdmFsdWUgb2YganNvbi5zdHlsZXNcbiAgICAgIG1vZGVsLnNldFN0eWxlKHN0eWxlTmFtZSwgdmFsdWUpXG5cbiAgICBtb2RlbC5kYXRhKGpzb24uZGF0YSkgaWYganNvbi5kYXRhXG5cbiAgICBmb3IgY29udGFpbmVyTmFtZSwgY29tcG9uZW50QXJyYXkgb2YganNvbi5jb250YWluZXJzXG4gICAgICBhc3NlcnQgbW9kZWwuY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShjb250YWluZXJOYW1lKSxcbiAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogdW5rbm93biBjb250YWluZXIgI3sgY29udGFpbmVyTmFtZSB9XCJcblxuICAgICAgaWYgY29tcG9uZW50QXJyYXlcbiAgICAgICAgYXNzZXJ0ICQuaXNBcnJheShjb21wb25lbnRBcnJheSksXG4gICAgICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogY29udGFpbmVyIGlzIG5vdCBhcnJheSAjeyBjb250YWluZXJOYW1lIH1cIlxuICAgICAgICBmb3IgY2hpbGQgaW4gY29tcG9uZW50QXJyYXlcbiAgICAgICAgICBtb2RlbC5hcHBlbmQoIGNvbnRhaW5lck5hbWUsIEBmcm9tSnNvbihjaGlsZCwgZGVzaWduKSApXG5cbiAgICBtb2RlbFxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuQ29tcG9uZW50Q29udGFpbmVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRfY29udGFpbmVyJylcbkNvbXBvbmVudEFycmF5ID0gcmVxdWlyZSgnLi9jb21wb25lbnRfYXJyYXknKVxuQ29tcG9uZW50TW9kZWwgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9tb2RlbCcpXG5jb21wb25lbnRNb2RlbFNlcmlhbGl6ZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9tb2RlbF9zZXJpYWxpemVyJylcblxuIyBDb21wb25lbnRUcmVlXG4jIC0tLS0tLS0tLS0tXG4jIExpdmluZ2RvY3MgZXF1aXZhbGVudCB0byB0aGUgRE9NIHRyZWUuXG4jIEEgY29tcG9uZW50VHJlZSBjb250YWluZXMgYWxsIHRoZSBjb21wb25lbnRzIG9mIGEgcGFnZSBpbiBoaWVyYXJjaGljYWwgb3JkZXIuXG4jXG4jIFRoZSByb290IG9mIHRoZSBDb21wb25lbnRUcmVlIGlzIGEgQ29tcG9uZW50Q29udGFpbmVyLiBBIENvbXBvbmVudENvbnRhaW5lclxuIyBjb250YWlucyBhIGxpc3Qgb2YgY29tcG9uZW50cy5cbiNcbiMgY29tcG9uZW50cyBjYW4gaGF2ZSBtdWx0aWJsZSBDb21wb25lbnRDb250YWluZXJzIHRoZW1zZWx2ZXMuXG4jXG4jICMjIyBFeGFtcGxlOlxuIyAgICAgLSBDb21wb25lbnRDb250YWluZXIgKHJvb3QpXG4jICAgICAgIC0gQ29tcG9uZW50ICdIZXJvJ1xuIyAgICAgICAtIENvbXBvbmVudCAnMiBDb2x1bW5zJ1xuIyAgICAgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyICdtYWluJ1xuIyAgICAgICAgICAgLSBDb21wb25lbnQgJ1RpdGxlJ1xuIyAgICAgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyICdzaWRlYmFyJ1xuIyAgICAgICAgICAgLSBDb21wb25lbnQgJ0luZm8tQm94JydcbiNcbiMgIyMjIEV2ZW50czpcbiMgVGhlIGZpcnN0IHNldCBvZiBDb21wb25lbnRUcmVlIEV2ZW50cyBhcmUgY29uY2VybmVkIHdpdGggbGF5b3V0IGNoYW5nZXMgbGlrZVxuIyBhZGRpbmcsIHJlbW92aW5nIG9yIG1vdmluZyBjb21wb25lbnRzLlxuI1xuIyBDb25zaWRlcjogSGF2ZSBhIGRvY3VtZW50RnJhZ21lbnQgYXMgdGhlIHJvb3ROb2RlIGlmIG5vIHJvb3ROb2RlIGlzIGdpdmVuXG4jIG1heWJlIHRoaXMgd291bGQgaGVscCBzaW1wbGlmeSBzb21lIGNvZGUgKHNpbmNlIGNvbXBvbmVudHMgYXJlIGFsd2F5c1xuIyBhdHRhY2hlZCB0byB0aGUgRE9NKS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50VHJlZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IGNvbnRlbnQsIEBkZXNpZ24gfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgXCJFcnJvciBpbnN0YW50aWF0aW5nIENvbXBvbmVudFRyZWU6IGRlc2lnbiBwYXJhbSBpcyBtaXNzc2luZy5cIlxuICAgIEBjb21wb25lbnRCeUlkID0ge31cbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgY29tcG9uZW50VHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgY29tcG9uZW50IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBjb21wb25lbnRNb2RlbCBpbnN0YW5jZSBvciBjb21wb25lbnQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5wcmVwZW5kKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IGNvbXBvbmVudCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogY29tcG9uZW50TW9kZWwgaW5zdGFuY2Ugb3IgY29tcG9uZW50IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5hcHBlbmQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0Q29tcG9uZW50OiAoY29tcG9uZW50TmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgY29tcG9uZW50TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZUNvbXBvbmVudChjb21wb25lbnROYW1lKVxuICAgIGVsc2VcbiAgICAgIGNvbXBvbmVudE5hbWVcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoY29tcG9uZW50TmFtZSlcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBnZXRUZW1wbGF0ZTogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChjb21wb25lbnROYW1lKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBjb21wb25lbnROYW1lIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIGNvbXBvbmVudFRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3QgY29tcG9uZW50XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBjb21wb25lbnRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnROYW1lID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKGNvbXBvbmVudClcblxuICAgICAgbmV3IENvbXBvbmVudEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgQ29tcG9uZW50QXJyYXkoKVxuXG5cbiAgZmluZEJ5SWQ6IChpZCkgLT5cbiAgICBAY29tcG9uZW50QnlJZFtpZF1cblxuXG4gIGRldGFjaDogLT5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgPT5cbiAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG4gICAgICBAY29tcG9uZW50QnlJZFtjb21wb25lbnQuaWRdID0gdW5kZWZpbmVkXG5cbiAgICBvbGRSb290ID0gQHJvb3RcbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgb2xkUm9vdFxuXG5cbiAgIyBTZXQgYSBtYWluIHZpZXcgZm9yIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIE5vdGU6IFRoZXJlIGNhbiBiZSBtdWx0aXBsZSB2aWV3cyBmb3IgYSBjb21wb25lbnRUcmVlLiBXaXRoIHRoaXNcbiAgIyBtZXRob2Qgd2UgY2FuIHNldCBhIG1haW4gdmlldyBzbyBpdCBiZWNvbWVzIHBvc3NpYmxlIHRvIGdldCBhIHZpZXdcbiAgIyBkaXJlY3RseSBmcm9tIHRoZSBjb21wb25lbnRUcmVlIGZvciBjb252ZW5pZW5jZVxuICBzZXRNYWluVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IHZpZXcucmVuZGVyZXIsICdjb21wb25lbnRUcmVlLnNldE1haW5WaWV3OiB2aWV3IGRvZXMgbm90IGhhdmUgYW4gaW5pdGlhbGl6ZWQgcmVuZGVyZXInXG4gICAgYXNzZXJ0IHZpZXcucmVuZGVyZXIuY29tcG9uZW50VHJlZSA9PSB0aGlzLCAnY29tcG9uZW50VHJlZS5zZXRNYWluVmlldzogQ2Fubm90IHNldCByZW5kZXJlciBmcm9tIGRpZmZlcmVudCBjb21wb25lbnRUcmVlJ1xuICAgIEBtYWluUmVuZGVyZXIgPSB2aWV3LnJlbmRlcmVyXG5cblxuICAjIEdldCB0aGUgY29tcG9uZW50VmlldyBmb3IgYSBtb2RlbFxuICAjIFRoaXMgb25seSB3b3JrcyBpZiBzZXRNYWluVmlldygpIGhhcyBiZWVuIGNhbGxlZC5cbiAgZ2V0TWFpbkNvbXBvbmVudFZpZXc6IChjb21wb25lbnRJZCkgLT5cbiAgICBAbWFpblJlbmRlcmVyPy5nZXRDb21wb25lbnRWaWV3QnlJZChjb21wb25lbnRJZClcblxuXG4gICMgcmV0dXJucyBhIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICBwcmludDogKCkgLT5cbiAgICBvdXRwdXQgPSAnQ29tcG9uZW50VHJlZVxcbi0tLS0tLS0tLS0tXFxuJ1xuXG4gICAgYWRkTGluZSA9ICh0ZXh0LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICBvdXRwdXQgKz0gXCIjeyBBcnJheShpbmRlbnRhdGlvbiArIDEpLmpvaW4oXCIgXCIpIH0jeyB0ZXh0IH1cXG5cIlxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgaW5kZW50YXRpb24gPSAwKSAtPlxuICAgICAgdGVtcGxhdGUgPSBjb21wb25lbnQudGVtcGxhdGVcbiAgICAgIGFkZExpbmUoXCItICN7IHRlbXBsYXRlLmxhYmVsIH0gKCN7IHRlbXBsYXRlLm5hbWUgfSlcIiwgaW5kZW50YXRpb24pXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgYWRkTGluZShcIiN7IG5hbWUgfTpcIiwgaW5kZW50YXRpb24gKyAyKVxuICAgICAgICB3YWxrZXIoY29tcG9uZW50Q29udGFpbmVyLmZpcnN0LCBpbmRlbnRhdGlvbiArIDQpIGlmIGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuXG4gICAgICAjIHRyYXZlcnNlIHNpYmxpbmdzXG4gICAgICB3YWxrZXIoY29tcG9uZW50Lm5leHQsIGluZGVudGF0aW9uKSBpZiBjb21wb25lbnQubmV4dFxuXG4gICAgd2Fsa2VyKEByb290LmZpcnN0KSBpZiBAcm9vdC5maXJzdFxuICAgIHJldHVybiBvdXRwdXRcblxuXG4gICMgVHJlZSBDaGFuZ2UgRXZlbnRzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgUmFpc2UgZXZlbnRzIGZvciBBZGQsIFJlbW92ZSBhbmQgTW92ZSBvZiBjb21wb25lbnRzXG4gICMgVGhlc2UgZnVuY3Rpb25zIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSBjb21wb25lbnRDb250YWluZXJzXG5cbiAgYXR0YWNoaW5nQ29tcG9uZW50OiAoY29tcG9uZW50LCBhdHRhY2hDb21wb25lbnRGdW5jKSAtPlxuICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID09IHRoaXNcbiAgICAgICMgbW92ZSBjb21wb25lbnRcbiAgICAgIGF0dGFjaENvbXBvbmVudEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnY29tcG9uZW50TW92ZWQnLCBjb21wb25lbnQpXG4gICAgZWxzZVxuICAgICAgaWYgY29tcG9uZW50LmNvbXBvbmVudFRyZWU/XG4gICAgICAgIGNvbXBvbmVudC5yZW1vdmUoKSAjIHJlbW92ZSBmcm9tIG90aGVyIGNvbXBvbmVudFRyZWVcblxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudCkgPT5cbiAgICAgICAgZGVzY2VuZGFudC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgICAgICBAY29tcG9uZW50QnlJZFtkZXNjZW5kYW50LmlkXSA9IGNvbXBvbmVudFxuXG4gICAgICBhdHRhY2hDb21wb25lbnRGdW5jKClcbiAgICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEFkZGVkJywgY29tcG9uZW50KVxuXG5cbiAgZmlyZUV2ZW50OiAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgdGhpc1tldmVudF0uZmlyZS5hcHBseShldmVudCwgYXJncylcbiAgICBAY2hhbmdlZC5maXJlKClcblxuXG4gIGRldGFjaGluZ0NvbXBvbmVudDogKGNvbXBvbmVudCwgZGV0YWNoQ29tcG9uZW50RnVuYykgLT5cbiAgICBhc3NlcnQgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgaXMgdGhpcyxcbiAgICAgICdjYW5ub3QgcmVtb3ZlIGNvbXBvbmVudCBmcm9tIGFub3RoZXIgQ29tcG9uZW50VHJlZSdcblxuICAgIGNvbXBvbmVudC5kZXNjZW5kYW50c0FuZFNlbGYgKGRlc2NlbmRhbnQpID0+XG4gICAgICBkZXNjZW5kYW50LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcbiAgICAgIEBjb21wb25lbnRCeUlkW2Rlc2NlbmRhbnQuaWRdID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hDb21wb25lbnRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRSZW1vdmVkJywgY29tcG9uZW50KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudENvbnRlbnRDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEh0bWxDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgIyBEaXNwYXRjaGVkIGV2ZW50IGRlc2NyaXB0aW9uOlxuICAjIGNvbXBvbmVudERhdGFDaGFuZ2VkKGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpXG4gICMgQHBhcmFtIGNvbXBvbmVudCB7Q29tcG9uZW50TW9kZWx9XG4gICMgQHBhcmFtIGNoYW5nZWRQcm9wZXJ0aWVzIHtBcnJheSBvZiBTdHJpbmdzfSBUb3AgbGV2ZWwgZGF0YSBwcm9wZXJ0aWVzXG4gICMgICB0aGF0IGhhdmUgYmVlbiBjaGFuZ2VkXG4gIGRhdGFDaGFuZ2luZzogKGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpIC0+XG4gICAgQGZpcmVFdmVudCgnY29tcG9uZW50RGF0YUNoYW5nZWQnLCBjb21wb25lbnQsIGNoYW5nZWRQcm9wZXJ0aWVzKVxuXG5cbiAgIyBTZXJpYWxpemF0aW9uXG4gICMgLS0tLS0tLS0tLS0tLVxuXG4gIHByaW50SnNvbjogLT5cbiAgICB3b3Jkcy5yZWFkYWJsZUpzb24oQHRvSnNvbigpKVxuXG5cbiAgIyBSZXR1cm5zIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgd2hvbGUgdHJlZVxuICAjIHRoYXQgY2FuIGJlIHNlbnQgdG8gdGhlIHNlcnZlciBhcyBKU09OLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGF0YSA9IHt9XG4gICAgZGF0YVsnY29udGVudCddID0gW11cbiAgICBkYXRhWydkZXNpZ24nXSA9IHsgbmFtZTogQGRlc2lnbi5uYW1lIH1cblxuICAgIGNvbXBvbmVudFRvRGF0YSA9IChjb21wb25lbnQsIGxldmVsLCBjb250YWluZXJBcnJheSkgLT5cbiAgICAgIGNvbXBvbmVudERhdGEgPSBjb21wb25lbnQudG9Kc29uKClcbiAgICAgIGNvbnRhaW5lckFycmF5LnB1c2ggY29tcG9uZW50RGF0YVxuICAgICAgY29tcG9uZW50RGF0YVxuXG4gICAgd2Fsa2VyID0gKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopIC0+XG4gICAgICBjb21wb25lbnREYXRhID0gY29tcG9uZW50VG9EYXRhKGNvbXBvbmVudCwgbGV2ZWwsIGRhdGFPYmopXG5cbiAgICAgICMgdHJhdmVyc2UgY2hpbGRyZW5cbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY29udGFpbmVyQXJyYXkgPSBjb21wb25lbnREYXRhLmNvbnRhaW5lcnNbY29tcG9uZW50Q29udGFpbmVyLm5hbWVdID0gW11cbiAgICAgICAgd2Fsa2VyKGNvbXBvbmVudENvbnRhaW5lci5maXJzdCwgbGV2ZWwgKyAxLCBjb250YWluZXJBcnJheSkgaWYgY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihjb21wb25lbnQubmV4dCwgbGV2ZWwsIGRhdGFPYmopIGlmIGNvbXBvbmVudC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QsIDAsIGRhdGFbJ2NvbnRlbnQnXSkgaWYgQHJvb3QuZmlyc3RcblxuICAgIGRhdGFcblxuXG4gICMgSW5pdGlhbGl6ZSBhIGNvbXBvbmVudFRyZWVcbiAgIyBUaGlzIG1ldGhvZCBzdXBwcmVzc2VzIGNoYW5nZSBldmVudHMgaW4gdGhlIGNvbXBvbmVudFRyZWUuXG4gICNcbiAgIyBDb25zaWRlciB0byBjaGFuZ2UgcGFyYW1zOlxuICAjIGZyb21EYXRhKHsgY29udGVudCwgZGVzaWduLCBzaWxlbnQgfSkgIyBzaWxlbnQgW2Jvb2xlYW5dOiBzdXBwcmVzcyBjaGFuZ2UgZXZlbnRzXG4gIGZyb21EYXRhOiAoZGF0YSwgZGVzaWduLCBzaWxlbnQ9dHJ1ZSkgLT5cbiAgICBpZiBkZXNpZ24/XG4gICAgICBhc3NlcnQgbm90IEBkZXNpZ24/IHx8IGRlc2lnbi5lcXVhbHMoQGRlc2lnbiksICdFcnJvciBsb2FkaW5nIGRhdGEuIFNwZWNpZmllZCBkZXNpZ24gaXMgZGlmZmVyZW50IGZyb20gY3VycmVudCBjb21wb25lbnRUcmVlIGRlc2lnbidcbiAgICBlbHNlXG4gICAgICBkZXNpZ24gPSBAZGVzaWduXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcblxuICAgIGlmIGRhdGEuY29udGVudFxuICAgICAgZm9yIGNvbXBvbmVudERhdGEgaW4gZGF0YS5jb250ZW50XG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb21wb25lbnREYXRhLCBkZXNpZ24pXG4gICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG5cbiAgICBpZiBzaWxlbnRcbiAgICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB0aGlzXG4gICAgICBAcm9vdC5lYWNoIChjb21wb25lbnQpID0+XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgICAgICBAY29tcG9uZW50QnlJZFtjb21wb25lbnQuaWRdID0gY29tcG9uZW50XG5cblxuICAjIEFwcGVuZCBkYXRhIHRvIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIEZpcmVzIGNvbXBvbmVudEFkZGVkIGV2ZW50IGZvciBldmVyeSBjb21wb25lbnRcbiAgYWRkRGF0YTogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAZnJvbURhdGEoZGF0YSwgZGVzaWduLCBmYWxzZSlcblxuXG4gIGFkZERhdGFXaXRoQW5pbWF0aW9uOiAoZGF0YSwgZGVsYXk9MjAwKSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgJ0Vycm9yIGFkZGluZyBkYXRhLiBDb21wb25lbnRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBjb21wb25lbnREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IGNvbXBvbmVudERhdGFcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb250ZW50LCBAZGVzaWduKVxuICAgICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG4gICAgICAgICwgdGltZW91dFxuXG4gICAgICB0aW1lb3V0ICs9IE51bWJlcihkZWxheSlcblxuXG4gIHRvRGF0YTogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gICMgQWxpYXNlc1xuICAjIC0tLS0tLS1cblxuICBmcm9tSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQGZyb21EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB0b0pzb246IChhcmdzLi4uKSAtPlxuICAgIEB0b0RhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbndvcmRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy93b3JkcycpXG5Db21wb25lbnREaXJlY3RpdmUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlRGlyZWN0aXZlIGV4dGVuZHMgQ29tcG9uZW50RGlyZWN0aXZlXG5cbiAgaXNFZGl0YWJsZTogdHJ1ZVxuXG5cbiAgZ2V0VGV4dDogLT5cbiAgICBjb250ZW50ID0gQGdldENvbnRlbnQoKVxuICAgIHJldHVybiAnJyB1bmxlc3MgY29udGVudFxuICAgIHdvcmRzLmV4dHJhY3RUZXh0RnJvbUh0bWwoY29udGVudClcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5Db21wb25lbnREaXJlY3RpdmUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEh0bWxEaXJlY3RpdmUgZXh0ZW5kcyBDb21wb25lbnREaXJlY3RpdmVcblxuICBpc0h0bWw6IHRydWVcblxuXG4gIHNldEVtYmVkSGFuZGxlcjogKGVtYmVkSGFuZGxlck5hbWUpIC0+XG4gICAgQHNldERhdGEoJ19lbWJlZEhhbmRsZXInLCBlbWJlZEhhbmRsZXJOYW1lKVxuXG5cbiAgZ2V0RW1iZWRIYW5kbGVyOiAtPlxuICAgIEBnZXREYXRhKCdfZW1iZWRIYW5kbGVyJylcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcbkNvbXBvbmVudERpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VEaXJlY3RpdmUgZXh0ZW5kcyBDb21wb25lbnREaXJlY3RpdmVcblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAY29tcG9uZW50LmNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKEBjb21wb25lbnQsIEBuYW1lKSBpZiBAY29tcG9uZW50LmNvbXBvbmVudFRyZWVcblxuXG4gIHNldEltYWdlVXJsOiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0udXJsID0gdmFsdWVcblxuICAgIEByZXNldENyb3AoKVxuICAgIEBiYXNlNjRJbWFnZSA9IHVuZGVmaW5lZFxuICAgIEBwcm9jZXNzSW1hZ2VVcmwodmFsdWUpXG5cblxuICBnZXRJbWFnZVVybDogLT5cbiAgICBpbWFnZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBpZiBpbWFnZVxuICAgICAgaW1hZ2UudXJsXG4gICAgZWxzZVxuICAgICAgdW5kZWZpbmVkXG5cblxuICBnZXRJbWFnZU9iamVjdDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdLm9yaWdpbmFsVXJsIHx8IEBnZXRJbWFnZVVybCgpXG5cblxuICBzZXRDcm9wOiAoY3JvcCkgLT5cbiAgICBjdXJyZW50VmFsdWUgPSBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG4gICAgcmV0dXJuIHVubGVzcyBjdXJyZW50VmFsdWU/LnVybD9cblxuICAgIGlmIGNyb3BcbiAgICAgIHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgbmFtZSB9ID0gY3JvcFxuICAgICAgY3VycmVudFZhbHVlLmNyb3AgPSB7eCwgeSwgd2lkdGgsIGhlaWdodCwgbmFtZX1cbiAgICBlbHNlXG4gICAgICBkZWxldGUgY3VycmVudFZhbHVlLmNyb3BcblxuICAgIEBwcm9jZXNzSW1hZ2VVcmwoY3VycmVudFZhbHVlLm9yaWdpbmFsVXJsIHx8IGN1cnJlbnRWYWx1ZS51cmwpXG4gICAgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyhAY29tcG9uZW50LCBAbmFtZSkgaWYgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlXG5cblxuICBnZXRDcm9wOiAtPlxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0uY3JvcFxuXG5cbiAgc2V0T3JpZ2luYWxJbWFnZURpbWVuc2lvbnM6ICh7d2lkdGgsIGhlaWdodH0pIC0+XG4gICAgY29udGVudCA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBjb250ZW50LndpZHRoID0gd2lkdGhcbiAgICBjb250ZW50LmhlaWdodCA9IGhlaWdodFxuXG5cbiAgZ2V0T3JpZ2luYWxJbWFnZURpbWVuc2lvbnM6IC0+XG4gICAgY29udGVudCA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cblxuICAgIHdpZHRoOiBjb250ZW50LndpZHRoLFxuICAgIGhlaWdodDogY29udGVudC5oZWlnaHRcblxuXG4gIHJlc2V0Q3JvcDogLT5cbiAgICBjdXJyZW50VmFsdWUgPSBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG4gICAgaWYgY3VycmVudFZhbHVlP1xuICAgICAgY3VycmVudFZhbHVlLmNyb3AgPSBudWxsXG5cblxuICBzZXRJbWFnZVNlcnZpY2U6IChpbWFnZVNlcnZpY2VOYW1lKSAtPlxuICAgIGFzc2VydCBpbWFnZVNlcnZpY2UuaGFzKGltYWdlU2VydmljZU5hbWUpLCBcIkVycm9yOiBjb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IGltYWdlU2VydmljZU5hbWUgfVwiXG5cbiAgICBpbWFnZVVybCA9IEBnZXRJbWFnZVVybCgpXG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXSA9XG4gICAgICB1cmw6IGltYWdlVXJsXG4gICAgICBpbWFnZVNlcnZpY2U6IGltYWdlU2VydmljZU5hbWUgfHwgbnVsbFxuXG5cbiAgZ2V0SW1hZ2VTZXJ2aWNlTmFtZTogLT5cbiAgICBAZ2V0SW1hZ2VTZXJ2aWNlKCkubmFtZVxuXG5cbiAgaGFzRGVmYXVsdEltYWdlU2VydmljZTogLT5cbiAgICBAZ2V0SW1hZ2VTZXJ2aWNlTmFtZSgpID09ICdkZWZhdWx0J1xuXG5cbiAgZ2V0SW1hZ2VTZXJ2aWNlOiAtPlxuICAgIHNlcnZpY2VOYW1lID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXT8uaW1hZ2VTZXJ2aWNlXG4gICAgaW1hZ2VTZXJ2aWNlLmdldChzZXJ2aWNlTmFtZSB8fCB1bmRlZmluZWQpXG5cblxuICBwcm9jZXNzSW1hZ2VVcmw6ICh1cmwpIC0+XG4gICAgaWYgbm90IEBoYXNEZWZhdWx0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltZ1NlcnZpY2UgPSBAZ2V0SW1hZ2VTZXJ2aWNlKClcbiAgICAgIGltZ09iaiA9IEBnZXRJbWFnZU9iamVjdCgpXG4gICAgICBpbWdPYmoudXJsID0gaW1nU2VydmljZS5nZXRVcmwodXJsLCBjcm9wOiBpbWdPYmouY3JvcClcbiAgICAgIGltZ09iai5vcmlnaW5hbFVybCA9IHVybFxuXG4iLCIjIEVucmljaCB0aGUgY29uZmlndXJhdGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgRW5yaWNoIHRoZSBjb25maWd1cmF0aW9uIHdpdGggc2hvcnRoYW5kcyBhbmQgY29tcHV0ZWQgdmFsdWVzLlxuI1xuIyBjb25maWcuZG9jRGlyZWN0aXZlXG4jICAgV2lsbCBwcmVmaXggdGhlIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggY29uZmlnLmF0dHJpYnV0ZVByZWZpeFxuIyAgIGUuZy4gY29uZmlnLmRvY0RpcmVjdGl2ZS5lZGl0YWJsZSA9PSAnZGF0YS1kb2MtZWRpdGFibGUnXG4jXG4jIGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBcbiMgICBBIGxvb2t1cCBvYmplY3QgZm9yIGVhc2llciBsb29rdXBzIG9mIHRoZSBkaXJlY3RpdmUgbmFtZSBieSB0ZW1wbGF0ZSBhdHRyaWJ1dGUuXG4jICAgZS5nLiBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwWydkb2MtZWRpdGFibGUnXSA9PSAnZWRpdGFibGUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGNvbmZpZykgLT5cblxuICAjIFNob3J0aGFuZHMgZm9yIHN0dWZmIHRoYXQgaXMgdXNlZCBhbGwgb3ZlciB0aGUgcGxhY2UgdG8gbWFrZVxuICAjIGNvZGUgYW5kIHNwZWNzIG1vcmUgcmVhZGFibGUuXG4gIGNvbmZpZy5kb2NEaXJlY3RpdmUgPSB7fVxuICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwID0ge31cblxuICBmb3IgbmFtZSwgdmFsdWUgb2YgY29uZmlnLmRpcmVjdGl2ZXNcblxuICAgICMgQ3JlYXRlIHRoZSByZW5kZXJlZEF0dHJzIGZvciB0aGUgZGlyZWN0aXZlc1xuICAgICMgKHByZXBlbmQgZGlyZWN0aXZlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY29uZmlndXJlZCBwcmVmaXgpXG4gICAgcHJlZml4ID0gaWYgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB0aGVuIFwiI3sgY29uZmlnLmF0dHJpYnV0ZVByZWZpeCB9LVwiIGVsc2UgJydcbiAgICB2YWx1ZS5yZW5kZXJlZEF0dHIgPSBcIiN7IHByZWZpeCB9I3sgdmFsdWUuYXR0ciB9XCJcblxuICAgIGNvbmZpZy5kb2NEaXJlY3RpdmVbbmFtZV0gPSB2YWx1ZS5yZW5kZXJlZEF0dHJcbiAgICBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW3ZhbHVlLmF0dHJdID0gbmFtZVxuXG4gIGNvbmZpZ1xuIiwiYXVnbWVudENvbmZpZyA9IHJlcXVpcmUoJy4vYXVnbWVudF9jb25maWcnKVxuXG4jIENvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLVxubW9kdWxlLmV4cG9ydHMgPSBhdWdtZW50Q29uZmlnKFxuXG4gICMgTG9hZCBjc3MgYW5kIGpzIHJlc291cmNlcyBpbiBwYWdlcyBhbmQgaW50ZXJhY3RpdmUgcGFnZXNcbiAgbG9hZFJlc291cmNlczogdHJ1ZVxuXG4gICMgQ1NTIHNlbGVjdG9yIGZvciBlbGVtZW50cyAoYW5kIHRoZWlyIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBpZ25vcmVkXG4gICMgd2hlbiBmb2N1c3Npbmcgb3IgYmx1cnJpbmcgYSBjb21wb25lbnRcbiAgaWdub3JlSW50ZXJhY3Rpb246ICcubGQtY29udHJvbCdcblxuICAjIFNldHVwIHBhdGhzIHRvIGxvYWQgcmVzb3VyY2VzIGR5bmFtaWNhbGx5XG4gIGRlc2lnblBhdGg6ICcvZGVzaWducydcbiAgbGl2aW5nZG9jc0Nzc0ZpbGU6ICcvYXNzZXRzL2Nzcy9saXZpbmdkb2NzLmNzcydcblxuICB3b3JkU2VwYXJhdG9yczogXCIuL1xcXFwoKVxcXCInOiwuOzw+fiEjJV4mKnwrPVtde31gfj9cIlxuXG4gICMgc3RyaW5nIGNvbnRhaW5uZyBvbmx5IGEgPGJyPiBmb2xsb3dlZCBieSB3aGl0ZXNwYWNlc1xuICBzaW5nbGVMaW5lQnJlYWs6IC9ePGJyXFxzKlxcLz8+XFxzKiQvXG5cbiAgYXR0cmlidXRlUHJlZml4OiAnZGF0YSdcblxuICAjIEVkaXRhYmxlIGNvbmZpZ3VyYXRpb25cbiAgZWRpdGFibGU6XG4gICAgYWxsb3dOZXdsaW5lOiB0cnVlICMgQWxsb3cgdG8gaW5zZXJ0IG5ld2xpbmVzIHdpdGggU2hpZnQrRW50ZXJcbiAgICBjaGFuZ2VEZWxheTogMCAjIERlbGF5IGZvciB1cGRhdGluZyB0aGUgY29tcG9uZW50IG1vZGVscyBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgdXNlciBjaGFuZ2VzLiAwIEZvciBpbW1lZGlhdGUgdXBkYXRlcy4gZmFsc2UgdG8gZGlzYWJsZS5cbiAgICBicm93c2VyU3BlbGxjaGVjazogZmFsc2UgIyBTZXQgdGhlIHNwZWxsY2hlY2sgYXR0cmlidXRlIG9uIGNvbnRlbnRlZGl0YWJsZXMgdG8gJ3RydWUnIG9yICdmYWxzZSdcbiAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBmYWxzZSAjIFdoZXRoZXIgdG8gZmlyZSBjdXJzb3IgYW5kIHNlbGN0aW9uIGNoYW5nZXMgb24gbW91c2Vtb3ZlXG5cblxuICAjIEluIGNzcyBhbmQgYXR0ciB5b3UgZmluZCBldmVyeXRoaW5nIHRoYXQgY2FuIGVuZCB1cCBpbiB0aGUgaHRtbFxuICAjIHRoZSBlbmdpbmUgc3BpdHMgb3V0IG9yIHdvcmtzIHdpdGguXG5cbiAgIyBjc3MgY2xhc3NlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGNzczpcbiAgICAjIGRvY3VtZW50IGNsYXNzZXNcbiAgICBzZWN0aW9uOiAnZG9jLXNlY3Rpb24nXG5cbiAgICAjIGNvbXBvbmVudCBjbGFzc2VzXG4gICAgY29tcG9uZW50OiAnZG9jLWNvbXBvbmVudCdcbiAgICBlZGl0YWJsZTogJ2RvYy1lZGl0YWJsZSdcbiAgICBub1BsYWNlaG9sZGVyOiAnZG9jLW5vLXBsYWNlaG9sZGVyJ1xuICAgIGVtcHR5SW1hZ2U6ICdkb2MtaW1hZ2UtZW1wdHknXG4gICAgaW50ZXJmYWNlOiAnZG9jLXVpJ1xuXG4gICAgIyBoaWdobGlnaHQgY2xhc3Nlc1xuICAgIGNvbXBvbmVudEhpZ2hsaWdodDogJ2RvYy1jb21wb25lbnQtaGlnaGxpZ2h0J1xuICAgIGNvbnRhaW5lckhpZ2hsaWdodDogJ2RvYy1jb250YWluZXItaGlnaGxpZ2h0J1xuXG4gICAgIyBkcmFnICYgZHJvcFxuICAgIGRyYWdnZWQ6ICdkb2MtZHJhZ2dlZCdcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXI6ICdkb2MtZHJhZ2dlZC1wbGFjZWhvbGRlcidcbiAgICBkcmFnZ2VkUGxhY2Vob2xkZXJDb3VudGVyOiAnZG9jLWRyYWctY291bnRlcidcbiAgICBkcmFnQmxvY2tlcjogJ2RvYy1kcmFnLWJsb2NrZXInXG4gICAgZHJvcE1hcmtlcjogJ2RvYy1kcm9wLW1hcmtlcidcbiAgICBiZWZvcmVEcm9wOiAnZG9jLWJlZm9yZS1kcm9wJ1xuICAgIG5vRHJvcDogJ2RvYy1kcmFnLW5vLWRyb3AnXG4gICAgYWZ0ZXJEcm9wOiAnZG9jLWFmdGVyLWRyb3AnXG4gICAgbG9uZ3ByZXNzSW5kaWNhdG9yOiAnZG9jLWxvbmdwcmVzcy1pbmRpY2F0b3InXG5cbiAgICAjIHV0aWxpdHkgY2xhc3Nlc1xuICAgIHByZXZlbnRTZWxlY3Rpb246ICdkb2Mtbm8tc2VsZWN0aW9uJ1xuICAgIG1heGltaXplZENvbnRhaW5lcjogJ2RvYy1qcy1tYXhpbWl6ZWQtY29udGFpbmVyJ1xuICAgIGludGVyYWN0aW9uQmxvY2tlcjogJ2RvYy1pbnRlcmFjdGlvbi1ibG9ja2VyJ1xuXG4gICMgYXR0cmlidXRlcyBpbmplY3RlZCBieSB0aGUgZW5naW5lXG4gIGF0dHI6XG4gICAgdGVtcGxhdGU6ICdkYXRhLWRvYy10ZW1wbGF0ZSdcbiAgICBwbGFjZWhvbGRlcjogJ2RhdGEtZG9jLXBsYWNlaG9sZGVyJ1xuXG5cbiAgIyBEaXJlY3RpdmUgZGVmaW5pdGlvbnNcbiAgI1xuICAjIGF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIHRlbXBsYXRlcyB0byBkZWZpbmUgdGhlIGRpcmVjdGl2ZVxuICAjIHJlbmRlcmVkQXR0cjogYXR0cmlidXRlIHVzZWQgaW4gb3V0cHV0IGh0bWxcbiAgIyBlbGVtZW50RGlyZWN0aXZlOiBkaXJlY3RpdmUgdGhhdCB0YWtlcyBjb250cm9sIG92ZXIgdGhlIGVsZW1lbnRcbiAgIyAgICh0aGVyZSBjYW4gb25seSBiZSBvbmUgcGVyIGVsZW1lbnQpXG4gICMgZGVmYXVsdE5hbWU6IGRlZmF1bHQgbmFtZSBpZiBub25lIHdhcyBzcGVjaWZpZWQgaW4gdGhlIHRlbXBsYXRlXG4gIGRpcmVjdGl2ZXM6XG4gICAgY29udGFpbmVyOlxuICAgICAgYXR0cjogJ2RvYy1jb250YWluZXInXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGVkaXRhYmxlOlxuICAgICAgYXR0cjogJ2RvYy1lZGl0YWJsZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgaW1hZ2U6XG4gICAgICBhdHRyOiAnZG9jLWltYWdlJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnaW1hZ2UnXG4gICAgaHRtbDpcbiAgICAgIGF0dHI6ICdkb2MtaHRtbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2RlZmF1bHQnXG4gICAgb3B0aW9uYWw6XG4gICAgICBhdHRyOiAnZG9jLW9wdGlvbmFsJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IGZhbHNlXG5cblxuICBhbmltYXRpb25zOlxuICAgIG9wdGlvbmFsczpcbiAgICAgIHNob3c6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVEb3duKDI1MClcblxuICAgICAgaGlkZTogKCRlbGVtKSAtPlxuICAgICAgICAkZWxlbS5zbGlkZVVwKDI1MClcblxuXG4gICMgRGVmaW5lIGFuIGltYWdlIHBsYWNlaG9sZGVyIHVzaW5nIGFuIHVybCBvciBhIGJhc2U2NCBpbWFnZVxuICAjIGVjaG8gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCIgc3RhbmRhbG9uZT1cInllc1wiPz48c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjYyMFwiIGhlaWdodD1cIjM1MFwiIHZpZXdCb3g9XCIwIDAgNjIwIDM1MFwiIHByZXNlcnZlQXNwZWN0UmF0aW89XCJub25lXCI+PHJlY3Qgd2lkdGg9XCI2MjBcIiBoZWlnaHQ9XCIzNTBcIiBmaWxsPVwiI0Q0RDRDRVwiLz48bGluZSB4MT1cIjBcIiB5MT1cIjBcIiB4Mj1cIjYyMFwiIHkyPVwiMzUwXCIgc3R5bGU9XCJzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MlwiLz48bGluZSB4MT1cIjYyMFwiIHkxPVwiMFwiIHgyPVwiMFwiIHkyPVwiMzUwXCIgc3R5bGU9XCJzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MlwiLz48L3N2Zz4nIHwgYmFzZTY0XG4gIGltYWdlUGxhY2Vob2xkZXI6IFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW5sbGN5SS9Qanh6ZG1jZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWlCM2FXUjBhRDBpTmpJd0lpQm9aV2xuYUhROUlqTTFNQ0lnZG1sbGQwSnZlRDBpTUNBd0lEWXlNQ0F6TlRBaUlIQnlaWE5sY25abFFYTndaV04wVW1GMGFXODlJbTV2Ym1VaVBqeHlaV04wSUhkcFpIUm9QU0kyTWpBaUlHaGxhV2RvZEQwaU16VXdJaUJtYVd4c1BTSWpSRFJFTkVORklpOCtQR3hwYm1VZ2VERTlJakFpSUhreFBTSXdJaUI0TWowaU5qSXdJaUI1TWowaU16VXdJaUJ6ZEhsc1pUMGljM1J5YjJ0bE9pTm1abVptWm1ZN2MzUnliMnRsTFhkcFpIUm9PaklpTHo0OGJHbHVaU0I0TVQwaU5qSXdJaUI1TVQwaU1DSWdlREk5SWpBaUlIa3lQU0l6TlRBaUlITjBlV3hsUFNKemRISnZhMlU2STJabVptWm1aanR6ZEhKdmEyVXRkMmxrZEdnNk1pSXZQand2YzNablBnb1wiXG4gIGltYWdlU2VydmljZXM6XG4gICAgJ3Jlc3JjLml0JzpcbiAgICAgIHF1YWxpdHk6IDc1XG4gICAgICBob3N0OiAnaHR0cHM6Ly9hcHAucmVzcmMuaXQnXG4pXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NNb2RpZmljYXRvclByb3BlcnR5XG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBsYWJlbCwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcblxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgY29tcG9uZW50IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IENzc01vZGlmaWNhdG9yUHJvcGVydHkjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5PcmRlcmVkSGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvb3JkZXJlZF9oYXNoJylcbkRlcGVuZGVuY2llcyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9kZXBlbmRlbmNpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlc2lnblxuXG4gICMgQHBhcmFtXG4gICMgIC0gbmFtZSB7IFN0cmluZyB9IFRoZSBuYW1lIG9mIHRoZSBkZXNpZ24uXG4gICMgIC0gdmVyc2lvbiB7IFN0cmluZyB9IGUuZy4gJzEuMC4wJ1xuICAjICAtIGF1dGhvciB7IFN0cmluZyB9XG4gICMgIC0gZGVzY3JpcHRpb24geyBTdHJpbmcgfVxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEB2ZXJzaW9uLCBAYXV0aG9yLCBAZGVzY3JpcHRpb24gfSkgLT5cbiAgICBhc3NlcnQgQG5hbWU/LCAnRGVzaWduOiBwYXJhbSBcIm5hbWVcIiBpcyByZXF1aXJlZCdcbiAgICBAaWRlbnRpZmllciA9IERlc2lnbi5nZXRJZGVudGlmaWVyKEBuYW1lLCBAdmVyc2lvbilcblxuICAgICMgdGVtcGxhdGVzIGluIGEgc3RydWN0dXJlZCBmb3JtYXRcbiAgICBAZ3JvdXBzID0gW11cblxuICAgICMgdGVtcGxhdGVzIGJ5IGlkIGFuZCBzb3J0ZWRcbiAgICBAY29tcG9uZW50cyA9IG5ldyBPcmRlcmVkSGFzaCgpXG4gICAgQGltYWdlUmF0aW9zID0ge31cblxuICAgICMganMgYW5kIGNzcyBkZXBlbmRlbmNpZXMgcmVxdWlyZWQgYnkgdGhlIGRlc2lnblxuICAgIEBkZXBlbmRlbmNpZXMgPSBuZXcgRGVwZW5kZW5jaWVzKHByZWZpeDogXCIjeyBjb25maWcuZGVzaWduUGF0aCB9LyN7IHRoaXMubmFtZSB9XCIpXG5cbiAgICAjIGRlZmF1bHQgY29tcG9uZW50c1xuICAgIEBkZWZhdWx0UGFyYWdyYXBoID0gdW5kZWZpbmVkXG4gICAgQGRlZmF1bHRJbWFnZSA9IHVuZGVmaW5lZFxuXG5cbiAgZXF1YWxzOiAoZGVzaWduKSAtPlxuICAgIGRlc2lnbi5uYW1lID09IEBuYW1lICYmIGRlc2lnbi52ZXJzaW9uID09IEB2ZXJzaW9uXG5cblxuICAjIFNpbXBsZSBpbXBsZW1lbnRhdGlvbiB3aXRoIHN0cmluZyBjb21wYXJpc29uXG4gICMgQ2F1dGlvbjogd29uJ3Qgd29yayBmb3IgJzEuMTAuMCcgPiAnMS45LjAnXG4gIGlzTmV3ZXJUaGFuOiAoZGVzaWduKSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBkZXNpZ24/XG4gICAgQHZlcnNpb24gPiAoZGVzaWduLnZlcnNpb24gfHwgJycpXG5cblxuICBnZXQ6IChpZGVudGlmaWVyKSAtPlxuICAgIGNvbXBvbmVudE5hbWUgPSBAZ2V0Q29tcG9uZW50TmFtZUZyb21JZGVudGlmaWVyKGlkZW50aWZpZXIpXG4gICAgQGNvbXBvbmVudHMuZ2V0KGNvbXBvbmVudE5hbWUpXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQGNvbXBvbmVudHMuZWFjaChjYWxsYmFjaylcblxuXG4gIGFkZDogKHRlbXBsYXRlKSAtPlxuICAgIHRlbXBsYXRlLnNldERlc2lnbih0aGlzKVxuICAgIEBjb21wb25lbnRzLnB1c2godGVtcGxhdGUubmFtZSwgdGVtcGxhdGUpXG5cblxuICBnZXRDb21wb25lbnROYW1lRnJvbUlkZW50aWZpZXI6IChpZGVudGlmaWVyKSAtPlxuICAgIHsgbmFtZSB9ID0gVGVtcGxhdGUucGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXIpXG4gICAgbmFtZVxuXG5cbiAgQGdldElkZW50aWZpZXI6IChuYW1lLCB2ZXJzaW9uKSAtPlxuICAgIGlmIHZlcnNpb25cbiAgICAgIFwiI3sgbmFtZSB9QCN7IHZlcnNpb24gfVwiXG4gICAgZWxzZVxuICAgICAgXCIjeyBuYW1lIH1cIlxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5kZXNpZ25QYXJzZXIgPSByZXF1aXJlKCcuL2Rlc2lnbl9wYXJzZXInKVxuVmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBkZXNpZ25zOiB7fVxuXG4gICMgQ2FuIGxvYWQgYSBkZXNpZ24gc3luY2hyb25vdXNseSBpZiB5b3UgaW5jbHVkZSB0aGVcbiAgIyBkZXNpZ24uanMgZmlsZSBiZWZvcmUgbGl2aW5nZG9jcy5cbiAgIyBkb2MuZGVzaWduLmxvYWQoZGVzaWduc1snbmFtZU9mWW91ckRlc2lnbiddKVxuICAjXG4gICMgUHJvcG9zZWQgZXh0ZW5zaW9uczpcbiAgIyBXaWxsIGJlIGV4dGVuZGVkIHRvIGxvYWQgZGVzaWducyByZW1vdGVseSBmcm9tIGEgc2VydmVyOlxuICAjIExvYWQgZnJvbSBhIHJlbW90ZSBzZXJ2ZXIgYnkgbmFtZSAoc2VydmVyIGhhcyB0byBiZSBjb25maWd1cmVkIGFzIGRlZmF1bHQpXG4gICMgZG9jLmRlc2lnbi5sb2FkKCdnaGlibGknKVxuICAjXG4gICMgTG9hZCBmcm9tIGEgY3VzdG9tIHNlcnZlcjpcbiAgIyBkb2MuZGVzaWduLmxvYWQoJ2h0dHA6Ly95b3Vyc2VydmVyLmlvL2Rlc2lnbnMvZ2hpYmxpL2Rlc2lnbi5qc29uJylcbiAgbG9hZDogKGRlc2lnblNwZWMpIC0+XG4gICAgYXNzZXJ0IGRlc2lnblNwZWM/LCAnZGVzaWduLmxvYWQoKSB3YXMgY2FsbGVkIHdpdGggdW5kZWZpbmVkLidcbiAgICBhc3NlcnQgbm90ICh0eXBlb2YgZGVzaWduU3BlYyA9PSAnc3RyaW5nJyksICdkZXNpZ24ubG9hZCgpIGxvYWRpbmcgYSBkZXNpZ24gYnkgbmFtZSBpcyBub3QgaW1wbGVtZW50ZWQuJ1xuXG4gICAgdmVyc2lvbiA9IFZlcnNpb24ucGFyc2UoZGVzaWduU3BlYy52ZXJzaW9uKVxuICAgIGRlc2lnbklkZW50aWZpZXIgPSBEZXNpZ24uZ2V0SWRlbnRpZmllcihkZXNpZ25TcGVjLm5hbWUsIHZlcnNpb24pXG4gICAgcmV0dXJuIGlmIEBoYXMoZGVzaWduSWRlbnRpZmllcilcblxuICAgIGRlc2lnbiA9IGRlc2lnblBhcnNlci5wYXJzZShkZXNpZ25TcGVjKVxuICAgIGlmIGRlc2lnblxuICAgICAgQGFkZChkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKERlc2lnbi5wYXJzZXIuZXJyb3JzKVxuXG5cbiAgIyBBZGQgYW4gYWxyZWFkeSBwYXJzZWQgZGVzaWduLlxuICAjIEBwYXJhbSB7IERlc2lnbiBvYmplY3QgfVxuICBhZGQ6IChkZXNpZ24pIC0+XG4gICAgaWYgZGVzaWduLmlzTmV3ZXJUaGFuKEBkZXNpZ25zW2Rlc2lnbi5uYW1lXSlcbiAgICAgIEBkZXNpZ25zW2Rlc2lnbi5uYW1lXSA9IGRlc2lnblxuICAgIEBkZXNpZ25zW2Rlc2lnbi5pZGVudGlmaWVyXSA9IGRlc2lnblxuXG5cbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBsb2FkZWRcbiAgaGFzOiAoZGVzaWduSWRlbnRpZmllcikgLT5cbiAgICBAZGVzaWduc1tkZXNpZ25JZGVudGlmaWVyXT9cblxuXG4gICMgR2V0IGEgbG9hZGVkIGRlc2lnblxuICAjIEByZXR1cm4geyBEZXNpZ24gb2JqZWN0IH1cbiAgZ2V0OiAoZGVzaWduSWRlbnRpZmllcikgLT5cbiAgICBhc3NlcnQgQGhhcyhkZXNpZ25JZGVudGlmaWVyKSwgXCJFcnJvcjogZGVzaWduICcjeyBkZXNpZ25JZGVudGlmaWVyIH0nIGlzIG5vdCBsb2FkZWQuXCJcbiAgICBAZGVzaWduc1tkZXNpZ25JZGVudGlmaWVyXVxuXG5cbiAgIyBDbGVhciB0aGUgY2FjaGUgaWYgeW91IHdhbnQgdG8gcmVsb2FkIGRlc2lnbnNcbiAgcmVzZXRDYWNoZTogLT5cbiAgICBAZGVzaWducyA9IHt9XG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmpTY2hlbWUgPSByZXF1aXJlKCdqc2NoZW1lJylcblZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKVxubW9kdWxlLmV4cG9ydHMgPSB2YWxpZGF0b3IgPSBqU2NoZW1lLm5ldygpXG5cbiMgQ3VzdG9tIFZhbGlkYXRvcnNcbiMgLS0tLS0tLS0tLS0tLS0tLS1cblxudmFsaWRhdG9yLmFkZCAnc3R5bGVUeXBlJywgKHZhbHVlKSAtPlxuICB2YWx1ZSA9PSAnb3B0aW9uJyBvciB2YWx1ZSA9PSAnc2VsZWN0J1xuXG5cbnZhbGlkYXRvci5hZGQgJ3NlbVZlcicsICh2YWx1ZSkgLT5cbiAgVmVyc2lvbi5zZW1WZXIudGVzdCh2YWx1ZSlcblxuXG4jIGNzc0NsYXNzTW9kaWZpY2F0b3IgcHJvcGVydGllcyBuZWVkIG9uZSAnRGVmYXVsdCcgb3B0aW9uXG4jIHdpdGggYW4gdW5kZWZpbmVkIHZhbHVlLiBPdGhlcndpc2UgdXNlcnMgY2Fubm90IHJlc2V0IHRoZVxuIyBzdHlsZSB2aWEgdGhlIGRyb3Bkb3duIGluIHRoZSBVSS5cbnZhbGlkYXRvci5hZGQgJ29uZSBlbXB0eSBvcHRpb24nLCAodmFsdWUpIC0+XG4gIGVtcHR5Q291bnQgPSAwXG4gIGZvciBlbnRyeSBpbiB2YWx1ZVxuICAgIGVtcHR5Q291bnQgKz0gMSBpZiBub3QgZW50cnkudmFsdWVcblxuICBlbXB0eUNvdW50ID09IDFcblxuXG4jIFNjaGVtYXNcbiMgLS0tLS0tLVxuXG52YWxpZGF0b3IuYWRkICdkZXNpZ24nLFxuICBuYW1lOiAnc3RyaW5nJ1xuICB2ZXJzaW9uOiAnc3RyaW5nLCBzZW1WZXInXG4gIGF1dGhvcjogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGRlc2NyaXB0aW9uOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgYXNzZXRzOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBjc3M6ICdhcnJheSBvZiBzdHJpbmcnXG4gICAganM6ICdhcnJheSBvZiBzdHJpbmcsIG9wdGlvbmFsJ1xuICBjb21wb25lbnRzOiAnYXJyYXkgb2YgY29tcG9uZW50J1xuICBjb21wb25lbnRQcm9wZXJ0aWVzOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBfX2FkZGl0aW9uYWxQcm9wZXJ0eTogKGtleSwgdmFsdWUpIC0+IHZhbGlkYXRvci52YWxpZGF0ZSgnY29tcG9uZW50UHJvcGVydHknLCB2YWx1ZSlcbiAgZ3JvdXBzOiAnYXJyYXkgb2YgZ3JvdXAsIG9wdGlvbmFsJ1xuICBkZWZhdWx0Q29tcG9uZW50czpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgcGFyYWdyYXBoOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgICBpbWFnZTogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGltYWdlUmF0aW9zOlxuICAgIF9fdmFsaWRhdGU6ICdvcHRpb25hbCdcbiAgICBfX2FkZGl0aW9uYWxQcm9wZXJ0eTogKGtleSwgdmFsdWUpIC0+IHZhbGlkYXRvci52YWxpZGF0ZSgnaW1hZ2VSYXRpbycsIHZhbHVlKVxuXG5cbnZhbGlkYXRvci5hZGQgJ2NvbXBvbmVudCcsXG4gIG5hbWU6ICdzdHJpbmcnXG4gIGxhYmVsOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgaHRtbDogJ3N0cmluZydcbiAgZGlyZWN0aXZlczogJ29iamVjdCwgb3B0aW9uYWwnXG4gIHByb3BlcnRpZXM6ICdhcnJheSBvZiBzdHJpbmcsIG9wdGlvbmFsJ1xuICBfX2FkZGl0aW9uYWxQcm9wZXJ0eTogKGtleSwgdmFsdWUpIC0+IGZhbHNlXG5cblxudmFsaWRhdG9yLmFkZCAnZ3JvdXAnLFxuICBsYWJlbDogJ3N0cmluZydcbiAgY29tcG9uZW50czogJ2FycmF5IG9mIHN0cmluZydcblxuXG4jIHRvZG86IHJlbmFtZSB0eXBlIGFuZCB1c2UgdHlwZSB0byBpZGVudGlmeSB0aGUgY29tcG9uZW50UHJvcGVydHkgdHlwZSBsaWtlIGNzc0NsYXNzXG52YWxpZGF0b3IuYWRkICdjb21wb25lbnRQcm9wZXJ0eScsXG4gIGxhYmVsOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgdHlwZTogJ3N0cmluZywgc3R5bGVUeXBlJ1xuICB2YWx1ZTogJ3N0cmluZywgb3B0aW9uYWwnXG4gIG9wdGlvbnM6ICdhcnJheSBvZiBzdHlsZU9wdGlvbiwgb25lIGVtcHR5IG9wdGlvbiwgb3B0aW9uYWwnXG5cblxudmFsaWRhdG9yLmFkZCAnaW1hZ2VSYXRpbycsXG4gIGxhYmVsOiAnc3RyaW5nLCBvcHRpb25hbCdcbiAgcmF0aW86ICdzdHJpbmcnXG5cblxudmFsaWRhdG9yLmFkZCAnc3R5bGVPcHRpb24nLFxuICBjYXB0aW9uOiAnc3RyaW5nJ1xuICB2YWx1ZTogJ3N0cmluZywgb3B0aW9uYWwnXG5cbiIsImxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmRlc2lnbkNvbmZpZ1NjaGVtYSA9IHJlcXVpcmUoJy4vZGVzaWduX2NvbmZpZ19zY2hlbWEnKVxuQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vY3NzX21vZGlmaWNhdG9yX3Byb3BlcnR5JylcblRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdGVtcGxhdGUvdGVtcGxhdGUnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuVmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpXG5JbWFnZVJhdGlvID0gcmVxdWlyZSgnLi9pbWFnZV9yYXRpbycpXG4kID0gcmVxdWlyZSgnanF1ZXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBkZXNpZ25QYXJzZXIgPVxuXG4gIHBhcnNlOiAoZGVzaWduQ29uZmlnKSAtPlxuICAgIEBkZXNpZ24gPSB1bmRlZmluZWRcbiAgICBpZiBkZXNpZ25Db25maWdTY2hlbWEudmFsaWRhdGUoJ2Rlc2lnbicsIGRlc2lnbkNvbmZpZylcbiAgICAgIEBjcmVhdGVEZXNpZ24oZGVzaWduQ29uZmlnKVxuICAgIGVsc2VcbiAgICAgIGVycm9ycyA9IGRlc2lnbkNvbmZpZ1NjaGVtYS5nZXRFcnJvck1lc3NhZ2VzKClcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMpXG5cblxuICBjcmVhdGVEZXNpZ246IChkZXNpZ25Db25maWcpIC0+XG4gICAgeyBhc3NldHMsIGNvbXBvbmVudHMsIGNvbXBvbmVudFByb3BlcnRpZXMsIGdyb3VwcywgZGVmYXVsdENvbXBvbmVudHMsIGltYWdlUmF0aW9zIH0gPSBkZXNpZ25Db25maWdcbiAgICB0cnlcbiAgICAgIEBkZXNpZ24gPSBAcGFyc2VEZXNpZ25JbmZvKGRlc2lnbkNvbmZpZylcbiAgICAgIEBwYXJzZUFzc2V0cyhhc3NldHMpXG4gICAgICBAcGFyc2VDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXBvbmVudFByb3BlcnRpZXMpXG4gICAgICBAcGFyc2VJbWFnZVJhdGlvcyhpbWFnZVJhdGlvcylcbiAgICAgIEBwYXJzZUNvbXBvbmVudHMoY29tcG9uZW50cylcbiAgICAgIEBwYXJzZUdyb3Vwcyhncm91cHMpXG4gICAgICBAcGFyc2VEZWZhdWx0cyhkZWZhdWx0Q29tcG9uZW50cylcbiAgICBjYXRjaCBlcnJvclxuICAgICAgZXJyb3IubWVzc2FnZSA9IFwiRXJyb3IgY3JlYXRpbmcgdGhlIGRlc2lnbjogI3sgZXJyb3IubWVzc2FnZSB9XCJcbiAgICAgIHRocm93IGVycm9yXG5cbiAgICBAZGVzaWduXG5cblxuICBwYXJzZURlc2lnbkluZm86IChkZXNpZ24pIC0+XG4gICAgdmVyc2lvbiA9IG5ldyBWZXJzaW9uKGRlc2lnbi52ZXJzaW9uKVxuICAgIG5ldyBEZXNpZ25cbiAgICAgIG5hbWU6IGRlc2lnbi5uYW1lXG4gICAgICB2ZXJzaW9uOiB2ZXJzaW9uLnRvU3RyaW5nKClcblxuXG4gICMgQXNzZXRzXG4gICMgLS0tLS0tXG5cbiAgcGFyc2VBc3NldHM6IChhc3NldHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBhc3NldHM/XG5cbiAgICBAZWFjaEFzc2V0IGFzc2V0cy5qcywgKGFzc2V0VXJsKSA9PlxuICAgICAgQGRlc2lnbi5kZXBlbmRlbmNpZXMuYWRkSnMoc3JjOiBhc3NldFVybClcblxuICAgIEBlYWNoQXNzZXQgYXNzZXRzLmNzcywgKGFzc2V0VXJsKSA9PlxuICAgICAgQGRlc2lnbi5kZXBlbmRlbmNpZXMuYWRkQ3NzKHNyYzogYXNzZXRVcmwpXG5cblxuICAjIEl0ZXJhdGUgdGhyb3VnaCBhc3NldHNcbiAgIyBAcGFyYW0ge1N0cmluZyBvciBBcnJheSBvZiBTdHJpbmdzIG9yIHVuZGVmaW5lZH1cbiAgIyBAcGFyYW0ge0Z1bmN0aW9ufVxuICBlYWNoQXNzZXQ6IChkYXRhLCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gdW5sZXNzIGRhdGE/XG5cbiAgICBpZiAkLnR5cGUoZGF0YSkgPT0gJ3N0cmluZydcbiAgICAgIGNhbGxiYWNrKGRhdGEpXG4gICAgZWxzZVxuICAgICAgZm9yIGVudHJ5IGluIGRhdGFcbiAgICAgICAgY2FsbGJhY2soZW50cnkpXG5cblxuICAjIENvbXBvbmVudCBQcm9wZXJ0aWVzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIE5vdGU6IEN1cnJlbnRseSBjb21wb25lbnRQcm9wZXJ0aWVzIGNvbnNpc3Qgb25seSBvZiBkZXNpZ24gc3R5bGVzXG4gIHBhcnNlQ29tcG9uZW50UHJvcGVydGllczogKGNvbXBvbmVudFByb3BlcnRpZXMpIC0+XG4gICAgQGNvbXBvbmVudFByb3BlcnRpZXMgPSB7fVxuICAgIGZvciBuYW1lLCBjb25maWcgb2YgY29tcG9uZW50UHJvcGVydGllc1xuICAgICAgY29uZmlnLm5hbWUgPSBuYW1lXG4gICAgICBAY29tcG9uZW50UHJvcGVydGllc1tuYW1lXSA9IEBjcmVhdGVDb21wb25lbnRQcm9wZXJ0eShjb25maWcpXG5cblxuICBwYXJzZUltYWdlUmF0aW9zOiAocmF0aW9zKSAtPlxuICAgIGZvciBuYW1lLCByYXRpbyBvZiByYXRpb3NcbiAgICAgIEBkZXNpZ24uaW1hZ2VSYXRpb3NbbmFtZV0gPSBuZXcgSW1hZ2VSYXRpb1xuICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgIGxhYmVsOiByYXRpby5sYWJlbFxuICAgICAgICByYXRpbzogcmF0aW8ucmF0aW9cblxuXG4gIHBhcnNlQ29tcG9uZW50czogKGNvbXBvbmVudHM9W10pIC0+XG4gICAgZm9yIHsgbmFtZSwgbGFiZWwsIGh0bWwsIHByb3BlcnRpZXMsIGRpcmVjdGl2ZXMgfSBpbiBjb21wb25lbnRzXG4gICAgICBwcm9wZXJ0aWVzID0gQGxvb2t1cENvbXBvbmVudFByb3BlcnRpZXMocHJvcGVydGllcylcblxuICAgICAgY29tcG9uZW50ID0gbmV3IFRlbXBsYXRlXG4gICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgIGh0bWw6IGh0bWxcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllc1xuXG4gICAgICBAcGFyc2VEaXJlY3RpdmVzKGNvbXBvbmVudCwgZGlyZWN0aXZlcylcbiAgICAgIEBkZXNpZ24uYWRkKGNvbXBvbmVudClcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGNvbXBvbmVudCwgZGlyZWN0aXZlcykgLT5cbiAgICBmb3IgbmFtZSwgY29uZiBvZiBkaXJlY3RpdmVzXG4gICAgICBkaXJlY3RpdmUgPSBjb21wb25lbnQuZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICAgIGFzc2VydCBkaXJlY3RpdmUsIFwiQ291bGQgbm90IGZpbmQgZGlyZWN0aXZlICN7IG5hbWUgfSBpbiAjeyBjb21wb25lbnQubmFtZSB9IGNvbXBvbmVudC5cIlxuICAgICAgZGlyZWN0aXZlQ29uZmlnID0gJC5leHRlbmQoe30sIGNvbmYpXG4gICAgICBkaXJlY3RpdmVDb25maWcuaW1hZ2VSYXRpb3MgPSBAbG9va3VwSW1hZ2VSYXRpb3MoY29uZi5pbWFnZVJhdGlvcykgaWYgY29uZi5pbWFnZVJhdGlvc1xuICAgICAgZGlyZWN0aXZlLnNldENvbmZpZyhkaXJlY3RpdmVDb25maWcpXG5cblxuICBsb29rdXBDb21wb25lbnRQcm9wZXJ0aWVzOiAocHJvcGVydHlOYW1lcykgLT5cbiAgICBwcm9wZXJ0aWVzID0ge31cbiAgICBmb3IgbmFtZSBpbiBwcm9wZXJ0eU5hbWVzIHx8IFtdXG4gICAgICBwcm9wZXJ0eSA9IEBjb21wb25lbnRQcm9wZXJ0aWVzW25hbWVdXG4gICAgICBhc3NlcnQgcHJvcGVydHksIFwiVGhlIGNvbXBvbmVudFByb3BlcnR5ICcjeyBuYW1lIH0nIHdhcyBub3QgZm91bmQuXCJcbiAgICAgIHByb3BlcnRpZXNbbmFtZV0gPSBwcm9wZXJ0eVxuXG4gICAgcHJvcGVydGllc1xuXG5cbiAgbG9va3VwSW1hZ2VSYXRpb3M6IChyYXRpb05hbWVzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgcmF0aW9OYW1lcz9cbiAgICBAbWFwQXJyYXkgcmF0aW9OYW1lcywgKG5hbWUpID0+XG4gICAgICByYXRpbyA9IEBkZXNpZ24uaW1hZ2VSYXRpb3NbbmFtZV1cbiAgICAgIGFzc2VydCByYXRpbywgXCJUaGUgaW1hZ2VSYXRpbyAnI3sgbmFtZSB9JyB3YXMgbm90IGZvdW5kLlwiXG4gICAgICByYXRpb1xuXG5cbiAgcGFyc2VHcm91cHM6IChncm91cHM9W10pIC0+XG4gICAgZm9yIGdyb3VwIGluIGdyb3Vwc1xuICAgICAgY29tcG9uZW50cyA9IGZvciBjb21wb25lbnROYW1lIGluIGdyb3VwLmNvbXBvbmVudHNcbiAgICAgICAgQGRlc2lnbi5nZXQoY29tcG9uZW50TmFtZSlcblxuICAgICAgQGRlc2lnbi5ncm91cHMucHVzaFxuICAgICAgICBsYWJlbDogZ3JvdXAubGFiZWxcbiAgICAgICAgY29tcG9uZW50czogY29tcG9uZW50c1xuXG5cbiAgcGFyc2VEZWZhdWx0czogKGRlZmF1bHRDb21wb25lbnRzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZGVmYXVsdENvbXBvbmVudHM/XG4gICAgeyBwYXJhZ3JhcGgsIGltYWdlIH0gPSBkZWZhdWx0Q29tcG9uZW50c1xuICAgIEBkZXNpZ24uZGVmYXVsdFBhcmFncmFwaCA9IEBnZXRDb21wb25lbnQocGFyYWdyYXBoKSBpZiBwYXJhZ3JhcGhcbiAgICBAZGVzaWduLmRlZmF1bHRJbWFnZSA9IEBnZXRDb21wb25lbnQoaW1hZ2UpIGlmIGltYWdlXG5cblxuICBnZXRDb21wb25lbnQ6IChuYW1lKSAtPlxuICAgIGNvbXBvbmVudCA9IEBkZXNpZ24uZ2V0KG5hbWUpXG4gICAgYXNzZXJ0IGNvbXBvbmVudCwgXCJDb3VsZCBub3QgZmluZCBjb21wb25lbnQgI3sgbmFtZSB9XCJcbiAgICBjb21wb25lbnRcblxuXG4gIGNyZWF0ZUNvbXBvbmVudFByb3BlcnR5OiAoc3R5bGVEZWZpbml0aW9uKSAtPlxuICAgIG5ldyBDc3NNb2RpZmljYXRvclByb3BlcnR5KHN0eWxlRGVmaW5pdGlvbilcblxuXG4gIG1hcEFycmF5OiAoZW50cmllcywgbG9va3VwKSAtPlxuICAgIG5ld0FycmF5ID0gW11cbiAgICBmb3IgZW50cnkgaW4gZW50cmllc1xuICAgICAgdmFsID0gbG9va3VwKGVudHJ5KVxuICAgICAgbmV3QXJyYXkucHVzaCh2YWwpIGlmIHZhbD9cblxuICAgIG5ld0FycmF5XG5cblxuRGVzaWduLnBhcnNlciA9IGRlc2lnblBhcnNlclxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VSYXRpb1xuXG4gIHJhdGlvU3RyaW5nID0gLyhcXGQrKVtcXC86eF0oXFxkKykvXG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBsYWJlbCwgcmF0aW8gfSkgLT5cbiAgICBAbGFiZWwgPSBsYWJlbCB8fCB3b3Jkcy5odW1hbml6ZSggQG5hbWUgKVxuICAgIEByYXRpbyA9IEBwYXJzZVJhdGlvKHJhdGlvKVxuXG5cbiAgcGFyc2VSYXRpbzogKHJhdGlvKSAtPlxuICAgIGlmICQudHlwZShyYXRpbykgPT0gJ3N0cmluZydcbiAgICAgIHJlcyA9IHJhdGlvU3RyaW5nLmV4ZWMocmF0aW8pXG4gICAgICByYXRpbyA9IE51bWJlcihyZXNbMV0pIC8gTnVtYmVyKHJlc1syXSlcblxuICAgIGFzc2VydCAkLnR5cGUocmF0aW8pID09ICdudW1iZXInLCBcIkNvdWxkIG5vdCBwYXJzZSBpbWFnZSByYXRpbyAjeyByYXRpbyB9XCJcbiAgICByYXRpb1xuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBWZXJzaW9uXG4gIEBzZW1WZXI6ICAvKFxcZCspXFwuKFxcZCspXFwuKFxcZCspKC4rKT8vXG5cbiAgY29uc3RydWN0b3I6ICh2ZXJzaW9uU3RyaW5nKSAtPlxuICAgIEBwYXJzZVZlcnNpb24odmVyc2lvblN0cmluZylcblxuXG4gIHBhcnNlVmVyc2lvbjogKHZlcnNpb25TdHJpbmcpIC0+XG4gICAgcmVzID0gVmVyc2lvbi5zZW1WZXIuZXhlYyh2ZXJzaW9uU3RyaW5nKVxuICAgIGlmIHJlc1xuICAgICAgQG1ham9yID0gcmVzWzFdXG4gICAgICBAbWlub3IgPSByZXNbMl1cbiAgICAgIEBwYXRjaCA9IHJlc1szXVxuICAgICAgQGFkZGVuZHVtID0gcmVzWzRdXG5cblxuICBpc1ZhbGlkOiAtPlxuICAgIEBtYWpvcj9cblxuXG4gIHRvU3RyaW5nOiAtPlxuICAgIFwiI3sgQG1ham9yIH0uI3sgQG1pbm9yIH0uI3sgQHBhdGNoIH0jeyBAYWRkZW5kdW0gfHwgJycgfVwiXG5cblxuICBAcGFyc2U6ICh2ZXJzaW9uU3RyaW5nKSAtPlxuICAgIHYgPSBuZXcgVmVyc2lvbih2ZXJzaW9uU3RyaW5nKVxuICAgIGlmIHYuaXNWYWxpZCgpIHRoZW4gdi50b1N0cmluZygpIGVsc2UgJydcblxuIiwibW9kdWxlLmV4cG9ydHMgPVxuXG4gICMgSW1hZ2UgU2VydmljZSBJbnRlcmZhY2VcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIG5hbWU6ICdkZWZhdWx0J1xuXG4gICMgU2V0IHZhbHVlIHRvIGFuIGltYWdlIG9yIGJhY2tncm91bmQgaW1hZ2UgZWxlbWVudC5cbiAgI1xuICAjIEBwYXJhbSB7IGpRdWVyeSBvYmplY3QgfSBOb2RlIHRvIHNldCB0aGUgaW1hZ2UgdG8uXG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gSW1hZ2UgdXJsXG4gIHNldDogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICBpZiBAaXNJbmxpbmVJbWFnZSgkZWxlbSlcbiAgICAgIEBzZXRJbmxpbmVJbWFnZSgkZWxlbSwgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgQHNldEJhY2tncm91bmRJbWFnZSgkZWxlbSwgdmFsdWUpXG5cblxuICAjIFRoZSBkZWZhdWx0IHNlcnZpY2UgZG9lcyBub3QgdHJhbnNmb3IgdGhlIGdpdmVuIHVybFxuICBnZXRVcmw6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZVxuXG5cbiAgIyBEZWZhdWx0IEltYWdlIFNlcnZpY2UgbWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uYXR0cignc3JjJywgdmFsdWUpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgJGVsZW0uY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgXCJ1cmwoI3sgQGVzY2FwZUNzc1VyaSh2YWx1ZSkgfSlcIilcblxuXG4gICMgRXNjYXBlIHRoZSBVUkkgaW4gY2FzZSBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSAnKCcgb3IgJyknIGFyZSBwcmVzZW50LlxuICAjIFRoZSBlc2NhcGluZyBvbmx5IGhhcHBlbnMgaWYgaXQgaXMgbmVlZGVkIHNpbmNlIHRoaXMgZG9lcyBub3Qgd29yayBpbiBub2RlLlxuICAjIFdoZW4gdGhlIFVSSSBpcyBlc2NhcGVkIGluIG5vZGUgdGhlIGJhY2tncm91bmQtaW1hZ2UgaXMgbm90IHdyaXR0ZW4gdG8gdGhlXG4gICMgc3R5bGUgYXR0cmlidXRlLlxuICBlc2NhcGVDc3NVcmk6ICh1cmkpIC0+XG4gICAgaWYgL1soKV0vLnRlc3QodXJpKVxuICAgICAgXCInI3sgdXJpIH0nXCJcbiAgICBlbHNlXG4gICAgICB1cmlcblxuXG4gIGdldEltYWdlRGltZW5zaW9uczogKCRlbGVtKSAtPlxuICAgIGlmIEBpc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgd2lkdGg6ICRlbGVtLndpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0uaGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICB3aWR0aDogJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQ6ICRlbGVtLm91dGVySGVpZ2h0KClcblxuXG4gIGlzQmFzZTY0OiAodmFsdWUpIC0+XG4gICAgdmFsdWUuaW5kZXhPZignZGF0YTppbWFnZScpID09IDAgaWYgdmFsdWU/XG5cblxuICBpc0lubGluZUltYWdlOiAoJGVsZW0pIC0+XG4gICAgJGVsZW1bMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW1nJ1xuXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICE9ICdpbWcnXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGVmYXVsdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vZGVmYXVsdF9pbWFnZV9zZXJ2aWNlJylcbnJlc3JjaXRJbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuL3Jlc3JjaXRfaW1hZ2Vfc2VydmljZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEF2YWlsYWJsZSBJbWFnZSBTZXJ2aWNlc1xuICBzZXJ2aWNlcyA9XG4gICAgJ3Jlc3JjLml0JzogcmVzcmNpdEltYWdlU2VydmljZVxuICAgICdkZWZhdWx0JzogZGVmYXVsdEltYWdlU2VydmljZVxuXG5cbiAgIyBTZXJ2aWNlXG4gICMgLS0tLS0tLVxuXG4gIGhhczogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXT9cblxuXG4gIGdldDogKHNlcnZpY2VOYW1lID0gJ2RlZmF1bHQnKSAtPlxuICAgIGFzc2VydCBAaGFzKHNlcnZpY2VOYW1lKSwgXCJDb3VsZCBub3QgbG9hZCBpbWFnZSBzZXJ2aWNlICN7IHNlcnZpY2VOYW1lIH1cIlxuICAgIHNlcnZpY2VzW3NlcnZpY2VOYW1lXVxuXG5cbiAgZWFjaFNlcnZpY2U6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgc2VydmljZSBvZiBzZXJ2aWNlc1xuICAgICAgY2FsbGJhY2sobmFtZSwgc2VydmljZSlcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxucmVzcmNpdENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJykuaW1hZ2VTZXJ2aWNlc1sncmVzcmMuaXQnXVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBJbWFnZSBTZXJ2aWNlIEludGVyZmFjZVxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgbmFtZTogJ3Jlc3JjLml0J1xuXG4gICMgQHBhcmFtIHsgalF1ZXJ5IG9iamVjdCB9XG4gICMgQHBhcmFtIHsgU3RyaW5nIH0gQSByZXNyYy5pdCB1cmwuIEUuZy4gaHR0cDovL2FwcC5yZXNyYy5pdC9odHRwOi8vaW1hZ2VzLmNvbS8xLmpwZ1xuICBzZXQ6ICgkZWxlbSwgdXJsKSAtPlxuICAgIGFzc2VydCB1cmw/ICYmIHVybCAhPSAnJywgJ1NyYyB2YWx1ZSBmb3IgYW4gaW1hZ2UgaGFzIHRvIGJlIGRlZmluZWQnXG5cbiAgICByZXR1cm4gQHNldEJhc2U2NCgkZWxlbSwgdXJsKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KHVybClcblxuICAgICRlbGVtLmFkZENsYXNzKCdyZXNyYycpXG4gICAgaWYgaW1nU2VydmljZS5pc0lubGluZUltYWdlKCRlbGVtKVxuICAgICAgQHNldElubGluZUltYWdlKCRlbGVtLCB1cmwpXG4gICAgZWxzZVxuICAgICAgQHNldEJhY2tncm91bmRJbWFnZSgkZWxlbSwgdXJsKVxuXG5cbiAgZ2V0VXJsOiAodmFsdWUsIHsgY3JvcCwgcXVhbGl0eSB9PXt9KSAtPlxuICAgIHN0eWxlID0gXCJcIlxuXG4gICAgaWYgY3JvcD9cbiAgICAgIHt4LCB5LCB3aWR0aCwgaGVpZ2h0fSA9IGNyb3BcblxuICAgICAgYXNzZXJ0IHR5cGVvZiB4IGlzICdudW1iZXInLCAneCBzaG91bGQgYmUgYSBudW1iZXInXG4gICAgICBhc3NlcnQgdHlwZW9mIHkgaXMgJ251bWJlcicsICd5IHNob3VsZCBiZSBhIG51bWJlcidcbiAgICAgIGFzc2VydCB0eXBlb2Ygd2lkdGggaXMgJ251bWJlcicsICd3aWR0aCBzaG91bGQgYmUgYSBudW1iZXInXG4gICAgICBhc3NlcnQgdHlwZW9mIGhlaWdodCBpcyAnbnVtYmVyJywgJ2hlaWdodCBzaG91bGQgYmUgYSBudW1iZXInXG5cbiAgICAgIHN0eWxlICs9IFwiL0M9VyN7IHdpZHRoIH0sSCN7IGhlaWdodCB9LFgjeyB4IH0sWSN7IHkgfVwiXG5cbiAgICBzdHlsZSArPSBcIi9PPSN7IHEgfVwiIGlmIHEgPSBxdWFsaXR5IHx8IHJlc3JjaXRDb25maWcucXVhbGl0eVxuICAgIFwiI3sgcmVzcmNpdENvbmZpZy5ob3N0IH0jeyBzdHlsZSB9LyN7IHZhbHVlIH1cIlxuXG5cbiAgIyBJbWFnZSBzcGVjaWZpYyBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGZvcm1hdENzc1VybDogKHVybCkgLT5cbiAgICB1cmwgPSBpbWdTZXJ2aWNlLmVzY2FwZUNzc1VyaSh1cmwpXG4gICAgXCJ1cmwoI3sgdXJsIH0pXCJcblxuXG4gIHNldElubGluZUltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5yZW1vdmVBdHRyKCdzcmMnKSBpZiBpbWdTZXJ2aWNlLmlzQmFzZTY0KCRlbGVtLmF0dHIoJ3NyYycpKVxuICAgICRlbGVtLmF0dHIoJ2RhdGEtc3JjJywgdXJsKVxuXG5cbiAgc2V0QmFja2dyb3VuZEltYWdlOiAoJGVsZW0sIHVybCkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBAZm9ybWF0Q3NzVXJsKHVybCkpXG5cblxuICAjIFNldCBzcmMgZGlyZWN0bHksIGRvbid0IGFkZCByZXNyYyBjbGFzc1xuICBzZXRCYXNlNjQ6ICgkZWxlbSwgYmFzZTY0U3RyaW5nKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0KCRlbGVtLCBiYXNlNjRTdHJpbmcpXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmlzU3VwcG9ydGVkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudERyYWdcblxuICB3aWdnbGVTcGFjZSA9IDBcbiAgc3RhcnRBbmRFbmRPZmZzZXQgPSAwXG5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnRNb2RlbCwgY29tcG9uZW50VmlldyB9KSAtPlxuICAgIEAkdmlldyA9IGNvbXBvbmVudFZpZXcuJGh0bWwgaWYgY29tcG9uZW50Vmlld1xuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgc3RhcnQ6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEBzdGFydGVkID0gdHJ1ZVxuICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5kaXNhYmxlQWxsKClcbiAgICBAcGFnZS5ibHVyRm9jdXNlZEVsZW1lbnQoKVxuXG4gICAgIyBwbGFjZWhvbGRlciBiZWxvdyBjdXJzb3JcbiAgICBAJHBsYWNlaG9sZGVyID0gQGNyZWF0ZVBsYWNlaG9sZGVyKCkuY3NzKCdwb2ludGVyLWV2ZW50cyc6ICdub25lJylcbiAgICBAJGRyYWdCbG9ja2VyID0gQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKVxuXG4gICAgIyBkcm9wIG1hcmtlclxuICAgIEAkZHJvcE1hcmtlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuZHJvcE1hcmtlciB9Jz5cIilcblxuICAgIEBwYWdlLiRib2R5XG4gICAgICAuYXBwZW5kKEAkZHJvcE1hcmtlcilcbiAgICAgIC5hcHBlbmQoQCRwbGFjZWhvbGRlcilcbiAgICAgIC5jc3MoJ2N1cnNvcicsICdwb2ludGVyJylcblxuICAgICMgbWFyayBkcmFnZ2VkIGNvbXBvbmVudFxuICAgIEAkdmlldy5hZGRDbGFzcyhjc3MuZHJhZ2dlZCkgaWYgQCR2aWV3P1xuXG4gICAgIyBwb3NpdGlvbiB0aGUgcGxhY2Vob2xkZXJcbiAgICBAbW92ZShldmVudFBvc2l0aW9uKVxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcblxuICBtb3ZlOiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAJHBsYWNlaG9sZGVyLmNzc1xuICAgICAgbGVmdDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VYIH1weFwiXG4gICAgICB0b3A6IFwiI3sgZXZlbnRQb3NpdGlvbi5wYWdlWSB9cHhcIlxuXG4gICAgQHRhcmdldCA9IEBmaW5kRHJvcFRhcmdldChldmVudFBvc2l0aW9uKVxuICAgICMgQHNjcm9sbEludG9WaWV3KHRvcCwgZXZlbnQpXG5cblxuICBmaW5kRHJvcFRhcmdldDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH0gPSBAZ2V0RWxlbVVuZGVyQ3Vyc29yKGV2ZW50UG9zaXRpb24pXG4gICAgcmV0dXJuIHVuZGVmaW5lZCB1bmxlc3MgZWxlbT9cblxuICAgICMgcmV0dXJuIHRoZSBzYW1lIGFzIGxhc3QgdGltZSBpZiB0aGUgY3Vyc29yIGlzIGFib3ZlIHRoZSBkcm9wTWFya2VyXG4gICAgcmV0dXJuIEB0YXJnZXQgaWYgZWxlbSA9PSBAJGRyb3BNYXJrZXJbMF1cblxuICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnRQb3NpdGlvbi5wYWdlWCwgdG9wOiBldmVudFBvc2l0aW9uLnBhZ2VZIH1cbiAgICB0YXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCBjb29yZHMpIGlmIGVsZW0/XG4gICAgQHVuZG9NYWtlU3BhY2UoKVxuXG4gICAgaWYgdGFyZ2V0PyAmJiB0YXJnZXQuY29tcG9uZW50Vmlldz8ubW9kZWwgIT0gQGNvbXBvbmVudE1vZGVsXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBAbWFya0Ryb3BQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICMgaWYgdGFyZ2V0LmNvbnRhaW5lck5hbWVcbiAgICAgICMgICBkb20ubWF4aW1pemVDb250YWluZXJIZWlnaHQodGFyZ2V0LnBhcmVudClcbiAgICAgICMgICAkY29udGFpbmVyID0gJCh0YXJnZXQubm9kZSlcbiAgICAgICMgZWxzZSBpZiB0YXJnZXQuY29tcG9uZW50Vmlld1xuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQuY29tcG9uZW50VmlldylcbiAgICAgICMgICAkY29udGFpbmVyID0gdGFyZ2V0LmNvbXBvbmVudFZpZXcuZ2V0JGNvbnRhaW5lcigpXG5cbiAgICAgIHJldHVybiB0YXJnZXRcbiAgICBlbHNlXG4gICAgICBAJGRyb3BNYXJrZXIuaGlkZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcblxuICAgICAgaWYgbm90IHRhcmdldD9cbiAgICAgICAgQCRwbGFjZWhvbGRlci5hZGRDbGFzcyhjc3Mubm9Ecm9wKVxuICAgICAgZWxzZVxuICAgICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZUNsYXNzKGNzcy5ub0Ryb3ApXG5cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIG1hcmtEcm9wUG9zaXRpb246ICh0YXJnZXQpIC0+XG4gICAgc3dpdGNoIHRhcmdldC50YXJnZXRcbiAgICAgIHdoZW4gJ2NvbXBvbmVudCdcbiAgICAgICAgQGNvbXBvbmVudFBvc2l0aW9uKHRhcmdldClcbiAgICAgICAgQHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodCgpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQubm9kZSlcbiAgICAgICAgQGhpZ2hsaWdoQ29udGFpbmVyKCQodGFyZ2V0Lm5vZGUpKVxuICAgICAgd2hlbiAncm9vdCdcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG5cblxuICBjb21wb25lbnRQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgIGJlZm9yZSA9IHRhcmdldC5jb21wb25lbnRWaWV3LnByZXYoKVxuXG4gICAgICBpZiBiZWZvcmU/XG4gICAgICAgIGlmIGJlZm9yZS5tb2RlbCA9PSBAY29tcG9uZW50TW9kZWxcbiAgICAgICAgICB0YXJnZXQucG9zaXRpb24gPSAnYWZ0ZXInXG4gICAgICAgICAgcmV0dXJuIEBjb21wb25lbnRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuQ29tcG9uZW50cyhiZWZvcmUsIHRhcmdldC5jb21wb25lbnRWaWV3KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0LmNvbXBvbmVudFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcbiAgICBlbHNlXG4gICAgICBuZXh0ID0gdGFyZ2V0LmNvbXBvbmVudFZpZXcubmV4dCgpXG4gICAgICBpZiBuZXh0P1xuICAgICAgICBpZiBuZXh0Lm1vZGVsID09IEBjb21wb25lbnRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdiZWZvcmUnXG4gICAgICAgICAgcmV0dXJuIEBjb21wb25lbnRQb3NpdGlvbih0YXJnZXQpXG5cbiAgICAgICAgQHNob3dNYXJrZXJCZXR3ZWVuQ29tcG9uZW50cyh0YXJnZXQuY29tcG9uZW50VmlldywgbmV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyKHRhcmdldC5jb21wb25lbnRWaWV3LiRlbGVtWzBdLnBhcmVudE5vZGUpXG5cblxuICBzaG93TWFya2VyQmV0d2VlbkNvbXBvbmVudHM6ICh2aWV3QSwgdmlld0IpIC0+XG4gICAgYm94QSA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCh2aWV3QS4kZWxlbVswXSlcbiAgICBib3hCID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdCLiRlbGVtWzBdKVxuXG4gICAgaGFsZkdhcCA9IGlmIGJveEIudG9wID4gYm94QS5ib3R0b21cbiAgICAgIChib3hCLnRvcCAtIGJveEEuYm90dG9tKSAvIDJcbiAgICBlbHNlXG4gICAgICAwXG5cbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94QS5sZWZ0XG4gICAgICB0b3A6IGJveEEuYm90dG9tICsgaGFsZkdhcFxuICAgICAgd2lkdGg6IGJveEEud2lkdGhcblxuXG4gIHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyOiAoZWxlbSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW0/XG5cbiAgICBAbWFrZVNwYWNlKGVsZW0uZmlyc3RDaGlsZCwgJ3RvcCcpXG4gICAgYm94ID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KGVsZW0pXG4gICAgcGFkZGluZ1RvcCA9IHBhcnNlSW50KCQoZWxlbSkuY3NzKCdwYWRkaW5nLXRvcCcpKSB8fCAwXG4gICAgQHNob3dNYXJrZXJcbiAgICAgIGxlZnQ6IGJveC5sZWZ0XG4gICAgICB0b3A6IGJveC50b3AgKyBzdGFydEFuZEVuZE9mZnNldCArIHBhZGRpbmdUb3BcbiAgICAgIHdpZHRoOiBib3gud2lkdGhcblxuXG4gIHNob3dNYXJrZXJBdEVuZE9mQ29udGFpbmVyOiAoZWxlbSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW0/XG5cbiAgICBAbWFrZVNwYWNlKGVsZW0ubGFzdENoaWxkLCAnYm90dG9tJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBwYWRkaW5nQm90dG9tID0gcGFyc2VJbnQoJChlbGVtKS5jc3MoJ3BhZGRpbmctYm90dG9tJykpIHx8IDBcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LmJvdHRvbSAtIHN0YXJ0QW5kRW5kT2Zmc2V0IC0gcGFkZGluZ0JvdHRvbVxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlcjogKHsgbGVmdCwgdG9wLCB3aWR0aCB9KSAtPlxuICAgIGlmIEBpZnJhbWVCb3g/XG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byBpZnJhbWUgdmlld3BvcnRcbiAgICAgICRib2R5ID0gJChAaWZyYW1lQm94LndpbmRvdy5kb2N1bWVudC5ib2R5KVxuICAgICAgdG9wIC09ICRib2R5LnNjcm9sbFRvcCgpXG4gICAgICBsZWZ0IC09ICRib2R5LnNjcm9sbExlZnQoKVxuXG4gICAgICAjIHRyYW5zbGF0ZSB0byByZWxhdGl2ZSB0byB2aWV3cG9ydCAoZml4ZWQgcG9zaXRpb25pbmcpXG4gICAgICBsZWZ0ICs9IEBpZnJhbWVCb3gubGVmdFxuICAgICAgdG9wICs9IEBpZnJhbWVCb3gudG9wXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGRvY3VtZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZylcbiAgICAgICMgdG9wICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wKClcbiAgICAgICMgbGVmdCArPSAkKGRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnQoKVxuXG4gICAgICAjIFdpdGggcG9zaXRpb24gZml4ZWQgd2UgZG9uJ3QgbmVlZCB0byB0YWtlIHNjcm9sbGluZyBpbnRvIGFjY291bnRcbiAgICAgICMgaW4gYW4gaWZyYW1lIHNjZW5hcmlvXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnZml4ZWQnKVxuICAgIGVsc2VcbiAgICAgICMgSWYgd2UncmUgbm90IGluIGFuIGlmcmFtZSBsZWZ0IGFuZCB0b3AgYXJlIGFscmVhZHlcbiAgICAgICMgdGhlIGFic29sdXRlIGNvb3JkaW5hdGVzXG4gICAgICBAJGRyb3BNYXJrZXIuY3NzKHBvc2l0aW9uOiAnYWJzb2x1dGUnKVxuXG4gICAgQCRkcm9wTWFya2VyXG4gICAgLmNzc1xuICAgICAgbGVmdDogIFwiI3sgbGVmdCB9cHhcIlxuICAgICAgdG9wOiAgIFwiI3sgdG9wIH1weFwiXG4gICAgICB3aWR0aDogXCIjeyB3aWR0aCB9cHhcIlxuICAgIC5zaG93KClcblxuXG4gIG1ha2VTcGFjZTogKG5vZGUsIHBvc2l0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgd2lnZ2xlU3BhY2UgJiYgbm9kZT9cbiAgICAkbm9kZSA9ICQobm9kZSlcbiAgICBAbGFzdFRyYW5zZm9ybSA9ICRub2RlXG5cbiAgICBpZiBwb3NpdGlvbiA9PSAndG9wJ1xuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgI3sgd2lnZ2xlU3BhY2UgfXB4KVwiKVxuICAgIGVsc2VcbiAgICAgICRub2RlLmNzcyh0cmFuc2Zvcm06IFwidHJhbnNsYXRlKDAsIC0jeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG5cblxuICB1bmRvTWFrZVNwYWNlOiAobm9kZSkgLT5cbiAgICBpZiBAbGFzdFRyYW5zZm9ybT9cbiAgICAgIEBsYXN0VHJhbnNmb3JtLmNzcyh0cmFuc2Zvcm06ICcnKVxuICAgICAgQGxhc3RUcmFuc2Zvcm0gPSB1bmRlZmluZWRcblxuXG4gIGhpZ2hsaWdoQ29udGFpbmVyOiAoJGNvbnRhaW5lcikgLT5cbiAgICBpZiAkY29udGFpbmVyWzBdICE9IEAkaGlnaGxpZ2h0ZWRDb250YWluZXJbMF1cbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyID0gJGNvbnRhaW5lclxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5hZGRDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcblxuXG4gIHJlbW92ZUNvbnRhaW5lckhpZ2hsaWdodDogLT5cbiAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLnJlbW92ZUNsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSB7fVxuXG5cbiAgIyBwYWdlWCwgcGFnZVk6IGFic29sdXRlIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50KVxuICAjIGNsaWVudFgsIGNsaWVudFk6IGZpeGVkIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0KVxuICBnZXRFbGVtVW5kZXJDdXJzb3I6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIGVsZW0gPSB1bmRlZmluZWRcbiAgICBAdW5ibG9ja0VsZW1lbnRGcm9tUG9pbnQgPT5cbiAgICAgIHsgY2xpZW50WCwgY2xpZW50WSB9ID0gZXZlbnRQb3NpdGlvblxuXG4gICAgICBpZiBjbGllbnRYPyAmJiBjbGllbnRZP1xuICAgICAgICBlbGVtID0gQHBhZ2UuZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKVxuXG4gICAgICBpZiBlbGVtPy5ub2RlTmFtZSA9PSAnSUZSQU1FJ1xuICAgICAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBmaW5kRWxlbUluSWZyYW1lKGVsZW0sIGV2ZW50UG9zaXRpb24pXG4gICAgICBlbHNlXG4gICAgICAgIEBpZnJhbWVCb3ggPSB1bmRlZmluZWRcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICBmaW5kRWxlbUluSWZyYW1lOiAoaWZyYW1lRWxlbSwgZXZlbnRQb3NpdGlvbikgLT5cbiAgICBAaWZyYW1lQm94ID0gYm94ID0gaWZyYW1lRWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIEBpZnJhbWVCb3gud2luZG93ID0gaWZyYW1lRWxlbS5jb250ZW50V2luZG93XG4gICAgZG9jdW1lbnQgPSBpZnJhbWVFbGVtLmNvbnRlbnREb2N1bWVudFxuICAgICRib2R5ID0gJChkb2N1bWVudC5ib2R5KVxuXG4gICAgZXZlbnRQb3NpdGlvbi5jbGllbnRYIC09IGJveC5sZWZ0XG4gICAgZXZlbnRQb3NpdGlvbi5jbGllbnRZIC09IGJveC50b3BcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VYID0gZXZlbnRQb3NpdGlvbi5jbGllbnRYICsgJGJvZHkuc2Nyb2xsTGVmdCgpXG4gICAgZXZlbnRQb3NpdGlvbi5wYWdlWSA9IGV2ZW50UG9zaXRpb24uY2xpZW50WSArICRib2R5LnNjcm9sbFRvcCgpXG4gICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnRQb3NpdGlvbi5jbGllbnRYLCBldmVudFBvc2l0aW9uLmNsaWVudFkpXG5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfVxuXG5cbiAgIyBSZW1vdmUgZWxlbWVudHMgdW5kZXIgdGhlIGN1cnNvciB3aGljaCBjb3VsZCBpbnRlcmZlcmVcbiAgIyB3aXRoIGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoKVxuICB1bmJsb2NrRWxlbWVudEZyb21Qb2ludDogKGNhbGxiYWNrKSAtPlxuXG4gICAgIyBQb2ludGVyIEV2ZW50cyBhcmUgYSBsb3QgZmFzdGVyIHNpbmNlIHRoZSBicm93c2VyIGRvZXMgbm90IG5lZWRcbiAgICAjIHRvIHJlcGFpbnQgdGhlIHdob2xlIHNjcmVlbi4gSUUgOSBhbmQgMTAgZG8gbm90IHN1cHBvcnQgdGhlbS5cbiAgICBpZiBpc1N1cHBvcnRlZCgnaHRtbFBvaW50ZXJFdmVudHMnKVxuICAgICAgQCRkcmFnQmxvY2tlci5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQCRkcmFnQmxvY2tlci5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ2F1dG8nKVxuICAgIGVsc2VcbiAgICAgIEAkZHJhZ0Jsb2NrZXIuaGlkZSgpXG4gICAgICBAJHBsYWNlaG9sZGVyLmhpZGUoKVxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQCRkcmFnQmxvY2tlci5zaG93KClcbiAgICAgIEAkcGxhY2Vob2xkZXIuc2hvdygpXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBkcm9wOiAtPlxuICAgIGlmIEB0YXJnZXQ/XG4gICAgICBAbW92ZVRvVGFyZ2V0KEB0YXJnZXQpXG4gICAgICBAcGFnZS5jb21wb25lbnRXYXNEcm9wcGVkLmZpcmUoQGNvbXBvbmVudE1vZGVsKVxuICAgIGVsc2VcbiAgICAgICNjb25zaWRlcjogbWF5YmUgYWRkIGEgJ2Ryb3AgZmFpbGVkJyBlZmZlY3RcblxuXG4gICMgTW92ZSB0aGUgY29tcG9uZW50IGFmdGVyIGEgc3VjY2Vzc2Z1bCBkcm9wXG4gIG1vdmVUb1RhcmdldDogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnY29tcG9uZW50J1xuICAgICAgICBjb21wb25lbnRWaWV3ID0gdGFyZ2V0LmNvbXBvbmVudFZpZXdcbiAgICAgICAgaWYgdGFyZ2V0LnBvc2l0aW9uID09ICdiZWZvcmUnXG4gICAgICAgICAgY29tcG9uZW50Vmlldy5tb2RlbC5iZWZvcmUoQGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29tcG9uZW50Vmlldy5tb2RlbC5hZnRlcihAY29tcG9uZW50TW9kZWwpXG4gICAgICB3aGVuICdjb250YWluZXInXG4gICAgICAgIGNvbXBvbmVudE1vZGVsID0gdGFyZ2V0LmNvbXBvbmVudFZpZXcubW9kZWxcbiAgICAgICAgY29tcG9uZW50TW9kZWwuYXBwZW5kKHRhcmdldC5jb250YWluZXJOYW1lLCBAY29tcG9uZW50TW9kZWwpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBjb21wb25lbnRUcmVlID0gdGFyZ2V0LmNvbXBvbmVudFRyZWVcbiAgICAgICAgY29tcG9uZW50VHJlZS5wcmVwZW5kKEBjb21wb25lbnRNb2RlbClcblxuXG5cbiAgIyBDYWxsZWQgYnkgRHJhZ0Jhc2VcbiAgIyBSZXNldCBpcyBhbHdheXMgY2FsbGVkIGFmdGVyIGEgZHJhZyBlbmRlZC5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcblxuICAgICAgIyB1bmRvIERPTSBjaGFuZ2VzXG4gICAgICBAdW5kb01ha2VTcGFjZSgpXG4gICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIEBwYWdlLiRib2R5LmNzcygnY3Vyc29yJywgJycpXG4gICAgICBAcGFnZS5lZGl0YWJsZUNvbnRyb2xsZXIucmVlbmFibGVBbGwoKVxuICAgICAgQCR2aWV3LnJlbW92ZUNsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG4gICAgICBkb20ucmVzdG9yZUNvbnRhaW5lckhlaWdodCgpXG5cbiAgICAgICMgcmVtb3ZlIGVsZW1lbnRzXG4gICAgICBAJHBsYWNlaG9sZGVyLnJlbW92ZSgpXG4gICAgICBAJGRyb3BNYXJrZXIucmVtb3ZlKClcblxuXG4gIGNyZWF0ZVBsYWNlaG9sZGVyOiAtPlxuICAgIG51bWJlck9mRHJhZ2dlZEVsZW1zID0gMVxuICAgIHRlbXBsYXRlID0gXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiI3sgY3NzLmRyYWdnZWRQbGFjZWhvbGRlciB9XCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiI3sgY3NzLmRyYWdnZWRQbGFjZWhvbGRlckNvdW50ZXIgfVwiPlxuICAgICAgICAgICN7IG51bWJlck9mRHJhZ2dlZEVsZW1zIH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICBTZWxlY3RlZCBJdGVtXG4gICAgICA8L2Rpdj5cbiAgICAgIFwiXCJcIlxuXG4gICAgJHBsYWNlaG9sZGVyID0gJCh0ZW1wbGF0ZSlcbiAgICAgIC5jc3MocG9zaXRpb246IFwiYWJzb2x1dGVcIilcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERPTSBoZWxwZXIgbWV0aG9kc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiMgTWV0aG9kcyB0byBwYXJzZSBhbmQgdXBkYXRlIHRoZSBEb20gdHJlZSBpbiBhY2NvcmRhbmNlIHRvXG4jIHRoZSBDb21wb25lbnRUcmVlIGFuZCBMaXZpbmdkb2NzIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cbiAgY29tcG9uZW50UmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5jb21wb25lbnQgfSg/OiB8JClcIilcbiAgc2VjdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cChcIig/OiB8XikjeyBjc3Muc2VjdGlvbiB9KD86IHwkKVwiKVxuXG4gICMgRmluZCB0aGUgY29tcG9uZW50IHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICAjIENvbXBvbmVudHMgYXJlIG1hcmtlZCBieSBhIGNsYXNzIGF0IHRoZSBtb21lbnQuXG4gIGZpbmRDb21wb25lbnRWaWV3OiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG5cbiAgICB3aGlsZSBub2RlICYmIG5vZGUubm9kZVR5cGUgPT0gMSAjIE5vZGUuRUxFTUVOVF9OT0RFID09IDFcbiAgICAgIGlmIGNvbXBvbmVudFJlZ2V4LnRlc3Qobm9kZS5jbGFzc05hbWUpXG4gICAgICAgIHZpZXcgPSBAZ2V0Q29tcG9uZW50Vmlldyhub2RlKVxuICAgICAgICByZXR1cm4gdmlld1xuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBmaW5kTm9kZUNvbnRleHQ6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgbm9kZUNvbnRleHQgPSBAZ2V0Tm9kZUNvbnRleHQobm9kZSlcbiAgICAgIHJldHVybiBub2RlQ29udGV4dCBpZiBub2RlQ29udGV4dFxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICBnZXROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZVR5cGUsIG9iaiBvZiBjb25maWcuZGlyZWN0aXZlc1xuICAgICAgY29udGludWUgaWYgbm90IG9iai5lbGVtZW50RGlyZWN0aXZlXG5cbiAgICAgIGRpcmVjdGl2ZUF0dHIgPSBvYmoucmVuZGVyZWRBdHRyXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShkaXJlY3RpdmVBdHRyKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRleHRBdHRyOiBkaXJlY3RpdmVBdHRyXG4gICAgICAgICAgYXR0ck5hbWU6IG5vZGUuZ2V0QXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICMgRmluZCB0aGUgY29udGFpbmVyIHRoaXMgbm9kZSBpcyBjb250YWluZWQgd2l0aGluLlxuICBmaW5kQ29udGFpbmVyOiAobm9kZSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGlmIG5vdCBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgICB2aWV3ID0gQGZpbmRDb21wb25lbnRWaWV3KG5vZGUpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBub2RlXG4gICAgICAgICAgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZVxuICAgICAgICAgIGNvbXBvbmVudFZpZXc6IHZpZXdcbiAgICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cbiAgICB7fVxuXG5cbiAgZ2V0SW1hZ2VOYW1lOiAobm9kZSkgLT5cbiAgICBpbWFnZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShpbWFnZUF0dHIpXG4gICAgICByZXR1cm4gaW1hZ2VOYW1lXG5cblxuICBnZXRIdG1sRWxlbWVudE5hbWU6IChub2RlKSAtPlxuICAgIGh0bWxBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShodG1sQXR0cilcbiAgICAgIGh0bWxFbGVtZW50TmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgcmV0dXJuIGh0bWxFbGVtZW50TmFtZVxuXG5cbiAgZ2V0RWRpdGFibGVOYW1lOiAobm9kZSkgLT5cbiAgICBlZGl0YWJsZUF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5lZGl0YWJsZS5yZW5kZXJlZEF0dHJcbiAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICBpbWFnZU5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShlZGl0YWJsZUF0dHIpXG4gICAgICByZXR1cm4gZWRpdGFibGVOYW1lXG5cblxuICBkcm9wVGFyZ2V0OiAobm9kZSwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICBub2RlID0gQGdldEVsZW1lbnROb2RlKG5vZGUpXG4gICAgY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgIyBhYm92ZSBjb250YWluZXJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnREYXRhID0gQGdldENsb3Nlc3RDb21wb25lbnQobm9kZSwgeyB0b3AsIGxlZnQgfSlcbiAgICAgICAgaWYgY2xvc2VzdENvbXBvbmVudERhdGE/XG4gICAgICAgICAgcmV0dXJuIEBnZXRDbG9zZXN0Q29tcG9uZW50VGFyZ2V0KGNsb3Nlc3RDb21wb25lbnREYXRhKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIEBnZXRDb250YWluZXJUYXJnZXQobm9kZSlcblxuICAgICAgIyBhYm92ZSBjb21wb25lbnRcbiAgICAgIGVsc2UgaWYgY29tcG9uZW50UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgcmV0dXJuIEBnZXRDb21wb25lbnRUYXJnZXQobm9kZSwgeyB0b3AsIGxlZnQgfSlcblxuICAgICAgIyBhYm92ZSByb290IGNvbnRhaW5lclxuICAgICAgZWxzZSBpZiBzZWN0aW9uUmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudERhdGEgPSBAZ2V0Q2xvc2VzdENvbXBvbmVudChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0Q29tcG9uZW50RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQoY2xvc2VzdENvbXBvbmVudERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldFJvb3RUYXJnZXQobm9kZSlcblxuICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZVxuXG5cbiAgZ2V0Q29tcG9uZW50VGFyZ2V0OiAoZWxlbSwgeyB0b3AsIGxlZnQsIHBvc2l0aW9uIH0pIC0+XG4gICAgdGFyZ2V0OiAnY29tcG9uZW50J1xuICAgIGNvbXBvbmVudFZpZXc6IEBnZXRDb21wb25lbnRWaWV3KGVsZW0pXG4gICAgcG9zaXRpb246IHBvc2l0aW9uIHx8IEBnZXRQb3NpdGlvbk9uQ29tcG9uZW50KGVsZW0sIHsgdG9wLCBsZWZ0IH0pXG5cblxuICBnZXRDbG9zZXN0Q29tcG9uZW50VGFyZ2V0OiAoY2xvc2VzdENvbXBvbmVudERhdGEpIC0+XG4gICAgZWxlbSA9IGNsb3Nlc3RDb21wb25lbnREYXRhLiRlbGVtWzBdXG4gICAgcG9zaXRpb24gPSBjbG9zZXN0Q29tcG9uZW50RGF0YS5wb3NpdGlvblxuICAgIEBnZXRDb21wb25lbnRUYXJnZXQoZWxlbSwgeyBwb3NpdGlvbiB9KVxuXG5cbiAgZ2V0Q29udGFpbmVyVGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuICAgIGNvbnRhaW5lck5hbWUgPSBub2RlLmdldEF0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuXG4gICAgdGFyZ2V0OiAnY29udGFpbmVyJ1xuICAgIG5vZGU6IG5vZGVcbiAgICBjb21wb25lbnRWaWV3OiBAZmluZENvbXBvbmVudFZpZXcobm9kZSlcbiAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG5cblxuICBnZXRSb290VGFyZ2V0OiAobm9kZSkgLT5cbiAgICBjb21wb25lbnRUcmVlID0gJChub2RlKS5kYXRhKCdjb21wb25lbnRUcmVlJylcblxuICAgIHRhcmdldDogJ3Jvb3QnXG4gICAgbm9kZTogbm9kZVxuICAgIGNvbXBvbmVudFRyZWU6IGNvbXBvbmVudFRyZWVcblxuXG4gICMgRmlndXJlIG91dCBpZiB3ZSBzaG91bGQgaW5zZXJ0IGJlZm9yZSBvciBhZnRlciBhIGNvbXBvbmVudFxuICAjIGJhc2VkIG9uIHRoZSBjdXJzb3IgcG9zaXRpb24uXG4gIGdldFBvc2l0aW9uT25Db21wb25lbnQ6IChlbGVtLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGVsZW1Ub3AgPSAkZWxlbS5vZmZzZXQoKS50b3BcbiAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgaWYgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgJ2JlZm9yZSdcbiAgICBlbHNlXG4gICAgICAnYWZ0ZXInXG5cblxuICAjIEdldCB0aGUgY2xvc2VzdCBjb21wb25lbnQgaW4gYSBjb250YWluZXIgZm9yIGEgdG9wIGxlZnQgcG9zaXRpb25cbiAgZ2V0Q2xvc2VzdENvbXBvbmVudDogKGNvbnRhaW5lciwgeyB0b3AsIGxlZnQgfSkgLT5cbiAgICAkY29tcG9uZW50cyA9ICQoY29udGFpbmVyKS5maW5kKFwiLiN7IGNzcy5jb21wb25lbnQgfVwiKVxuICAgIGNsb3Nlc3QgPSB1bmRlZmluZWRcbiAgICBjbG9zZXN0Q29tcG9uZW50ID0gdW5kZWZpbmVkXG5cbiAgICAkY29tcG9uZW50cy5lYWNoIChpbmRleCwgZWxlbSkgPT5cbiAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgICAgZWxlbUhlaWdodCA9ICRlbGVtLm91dGVySGVpZ2h0KClcbiAgICAgIGVsZW1Cb3R0b20gPSBlbGVtVG9wICsgZWxlbUhlaWdodFxuXG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbVRvcCkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50ID0geyAkZWxlbSwgcG9zaXRpb246ICdiZWZvcmUnfVxuICAgICAgaWYgbm90IGNsb3Nlc3Q/IHx8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pIDwgY2xvc2VzdFxuICAgICAgICBjbG9zZXN0ID0gQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSlcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudCA9IHsgJGVsZW0sIHBvc2l0aW9uOiAnYWZ0ZXInfVxuXG4gICAgY2xvc2VzdENvbXBvbmVudFxuXG5cbiAgZGlzdGFuY2U6IChhLCBiKSAtPlxuICAgIGlmIGEgPiBiIHRoZW4gYSAtIGIgZWxzZSBiIC0gYVxuXG5cbiAgIyBmb3JjZSBhbGwgY29udGFpbmVycyBvZiBhIGNvbXBvbmVudCB0byBiZSBhcyBoaWdoIGFzIHRoZXkgY2FuIGJlXG4gICMgc2V0cyBjc3Mgc3R5bGUgaGVpZ2h0XG4gIG1heGltaXplQ29udGFpbmVySGVpZ2h0OiAodmlldykgLT5cbiAgICBpZiB2aWV3LnRlbXBsYXRlLmNvbnRhaW5lckNvdW50ID4gMVxuICAgICAgZm9yIG5hbWUsIGVsZW0gb2Ygdmlldy5jb250YWluZXJzXG4gICAgICAgICRlbGVtID0gJChlbGVtKVxuICAgICAgICBjb250aW51ZSBpZiAkZWxlbS5oYXNDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuICAgICAgICAkcGFyZW50ID0gJGVsZW0ucGFyZW50KClcbiAgICAgICAgcGFyZW50SGVpZ2h0ID0gJHBhcmVudC5oZWlnaHQoKVxuICAgICAgICBvdXRlciA9ICRlbGVtLm91dGVySGVpZ2h0KHRydWUpIC0gJGVsZW0uaGVpZ2h0KClcbiAgICAgICAgJGVsZW0uaGVpZ2h0KHBhcmVudEhlaWdodCAtIG91dGVyKVxuICAgICAgICAkZWxlbS5hZGRDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgIyByZW1vdmUgYWxsIGNzcyBzdHlsZSBoZWlnaHQgZGVjbGFyYXRpb25zIGFkZGVkIGJ5XG4gICMgbWF4aW1pemVDb250YWluZXJIZWlnaHQoKVxuICByZXN0b3JlQ29udGFpbmVySGVpZ2h0OiAoKSAtPlxuICAgICQoXCIuI3sgY3NzLm1heGltaXplZENvbnRhaW5lciB9XCIpXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgIC5yZW1vdmVDbGFzcyhjc3MubWF4aW1pemVkQ29udGFpbmVyKVxuXG5cbiAgZ2V0RWxlbWVudE5vZGU6IChub2RlKSAtPlxuICAgIGlmIG5vZGU/LmpxdWVyeVxuICAgICAgbm9kZVswXVxuICAgIGVsc2UgaWYgbm9kZT8ubm9kZVR5cGUgPT0gMyAjIE5vZGUuVEVYVF9OT0RFID09IDNcbiAgICAgIG5vZGUucGFyZW50Tm9kZVxuICAgIGVsc2VcbiAgICAgIG5vZGVcblxuXG4gICMgQ29tcG9uZW50cyBzdG9yZSBhIHJlZmVyZW5jZSBvZiB0aGVtc2VsdmVzIGluIHRoZWlyIERvbSBub2RlXG4gICMgY29uc2lkZXI6IHN0b3JlIHJlZmVyZW5jZSBkaXJlY3RseSB3aXRob3V0IGpRdWVyeVxuICBnZXRDb21wb25lbnRWaWV3OiAobm9kZSkgLT5cbiAgICAkKG5vZGUpLmRhdGEoJ2NvbXBvbmVudFZpZXcnKVxuXG5cbiAgIyBHZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdCB3aXRoIHRvcCBhbmQgbGVmdCByZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnRcbiAgIyAoaWRlYWwgZm9yIGFic29sdXRlIHBvc2l0aW9uZWQgZWxlbWVudHMpXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAobm9kZSkgLT5cbiAgICB3aW4gPSBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICB7IHNjcm9sbFgsIHNjcm9sbFkgfSA9IEBnZXRTY3JvbGxQb3NpdGlvbih3aW4pXG5cbiAgICAjIHRyYW5zbGF0ZSBpbnRvIGFic29sdXRlIHBvc2l0aW9uc1xuICAgIGNvb3JkcyA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjb29yZHMgPVxuICAgICAgdG9wOiBjb29yZHMudG9wICsgc2Nyb2xsWVxuICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tICsgc2Nyb2xsWVxuICAgICAgbGVmdDogY29vcmRzLmxlZnQgKyBzY3JvbGxYXG4gICAgICByaWdodDogY29vcmRzLnJpZ2h0ICsgc2Nyb2xsWFxuXG4gICAgY29vcmRzLmhlaWdodCA9IGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wXG4gICAgY29vcmRzLndpZHRoID0gY29vcmRzLnJpZ2h0IC0gY29vcmRzLmxlZnRcblxuICAgIGNvb3Jkc1xuXG5cbiAgZ2V0U2Nyb2xsUG9zaXRpb246ICh3aW4pIC0+XG4gICAgIyBjb2RlIGZyb20gbWRuOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvd2luZG93LnNjcm9sbFhcbiAgICBzY3JvbGxYOiBpZiAod2luLnBhZ2VYT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVhPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0XG4gICAgc2Nyb2xsWTogaWYgKHdpbi5wYWdlWU9mZnNldCAhPSB1bmRlZmluZWQpIHRoZW4gd2luLnBhZ2VZT2Zmc2V0IGVsc2UgKHdpbi5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgd2luLmRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCB3aW4uZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmNzcyA9IGNvbmZpZy5jc3NcblxuIyBEcmFnQmFzZVxuI1xuIyBTdXBwb3J0ZWQgZHJhZyBtb2RlczpcbiMgLSBEaXJlY3QgKHN0YXJ0IGltbWVkaWF0ZWx5KVxuIyAtIExvbmdwcmVzcyAoc3RhcnQgYWZ0ZXIgYSBkZWxheSBpZiB0aGUgY3Vyc29yIGRvZXMgbm90IG1vdmUgdG9vIG11Y2gpXG4jIC0gTW92ZSAoc3RhcnQgYWZ0ZXIgdGhlIGN1cnNvciBtb3ZlZCBhIG1pbnVtdW0gZGlzdGFuY2UpXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERyYWdCYXNlXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSwgb3B0aW9ucykgLT5cbiAgICBAbW9kZXMgPSBbJ2RpcmVjdCcsICdsb25ncHJlc3MnLCAnbW92ZSddXG5cbiAgICBkZWZhdWx0Q29uZmlnID1cbiAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuICAgICAgb25EcmFnU3RhcnQ6IHVuZGVmaW5lZFxuICAgICAgc2Nyb2xsQXJlYTogNTBcbiAgICAgIGxvbmdwcmVzczpcbiAgICAgICAgc2hvd0luZGljYXRvcjogdHJ1ZVxuICAgICAgICBkZWxheTogNDAwXG4gICAgICAgIHRvbGVyYW5jZTogM1xuICAgICAgbW92ZTpcbiAgICAgICAgZGlzdGFuY2U6IDBcblxuICAgIEBkZWZhdWx0Q29uZmlnID0gJC5leHRlbmQodHJ1ZSwgZGVmYXVsdENvbmZpZywgb3B0aW9ucylcblxuICAgIEBzdGFydFBvaW50ID0gdW5kZWZpbmVkXG4gICAgQGRyYWdIYW5kbGVyID0gdW5kZWZpbmVkXG4gICAgQGluaXRpYWxpemVkID0gZmFsc2VcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG5cblxuICBzZXRPcHRpb25zOiAob3B0aW9ucykgLT5cbiAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBAZGVmYXVsdENvbmZpZywgb3B0aW9ucylcbiAgICBAbW9kZSA9IGlmIG9wdGlvbnMuZGlyZWN0P1xuICAgICAgJ2RpcmVjdCdcbiAgICBlbHNlIGlmIG9wdGlvbnMubG9uZ3ByZXNzP1xuICAgICAgJ2xvbmdwcmVzcydcbiAgICBlbHNlIGlmIG9wdGlvbnMubW92ZT9cbiAgICAgICdtb3ZlJ1xuICAgIGVsc2VcbiAgICAgICdsb25ncHJlc3MnXG5cblxuICBzZXREcmFnSGFuZGxlcjogKGRyYWdIYW5kbGVyKSAtPlxuICAgIEBkcmFnSGFuZGxlciA9IGRyYWdIYW5kbGVyXG4gICAgQGRyYWdIYW5kbGVyLnBhZ2UgPSBAcGFnZVxuXG5cbiAgIyBTdGFydCBhIHBvc3NpYmxlIGRyYWdcbiAgIyBUaGUgZHJhZyBpcyBvbmx5IHJlYWxseSBzdGFydGVkIGlmIGNvbnN0cmFpbnRzIGFyZSBub3QgdmlvbGF0ZWRcbiAgIyAobG9uZ3ByZXNzRGVsYXkgYW5kIGxvbmdwcmVzc0Rpc3RhbmNlTGltaXQgb3IgbWluRGlzdGFuY2UpLlxuICBpbml0OiAoZHJhZ0hhbmRsZXIsIGV2ZW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgQGluaXRpYWxpemVkID0gdHJ1ZVxuICAgIEBzZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgQHNldERyYWdIYW5kbGVyKGRyYWdIYW5kbGVyKVxuICAgIEBzdGFydFBvaW50ID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG5cbiAgICBAYWRkU3RvcExpc3RlbmVycyhldmVudClcbiAgICBAYWRkTW92ZUxpc3RlbmVycyhldmVudClcblxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBAYWRkTG9uZ3ByZXNzSW5kaWNhdG9yKEBzdGFydFBvaW50KVxuICAgICAgQHRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICAgICAgQHN0YXJ0KGV2ZW50KVxuICAgICAgICAsIEBvcHRpb25zLmxvbmdwcmVzcy5kZWxheVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ2RpcmVjdCdcbiAgICAgIEBzdGFydChldmVudClcblxuICAgICMgcHJldmVudCBicm93c2VyIERyYWcgJiBEcm9wXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAb3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG5cbiAgbW92ZTogKGV2ZW50KSAtPlxuICAgIGV2ZW50UG9zaXRpb24gPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcbiAgICBpZiBAbW9kZSA9PSAnbG9uZ3ByZXNzJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLmxvbmdwcmVzcy50b2xlcmFuY2VcbiAgICAgICAgQHJlc2V0KClcbiAgICBlbHNlIGlmIEBtb2RlID09ICdtb3ZlJ1xuICAgICAgaWYgQGRpc3RhbmNlKGV2ZW50UG9zaXRpb24sIEBzdGFydFBvaW50KSA+IEBvcHRpb25zLm1vdmUuZGlzdGFuY2VcbiAgICAgICAgQHN0YXJ0KGV2ZW50KVxuXG5cbiAgIyBzdGFydCB0aGUgZHJhZyBwcm9jZXNzXG4gIHN0YXJ0OiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIEBzdGFydGVkID0gdHJ1ZVxuXG4gICAgIyBwcmV2ZW50IHRleHQtc2VsZWN0aW9ucyB3aGlsZSBkcmFnZ2luZ1xuICAgIEBhZGRCbG9ja2VyKClcbiAgICBAcGFnZS4kYm9keS5hZGRDbGFzcyhjc3MucHJldmVudFNlbGVjdGlvbilcbiAgICBAZHJhZ0hhbmRsZXIuc3RhcnQoZXZlbnRQb3NpdGlvbilcblxuXG4gIGRyb3A6IChldmVudCkgLT5cbiAgICBAZHJhZ0hhbmRsZXIuZHJvcChldmVudCkgaWYgQHN0YXJ0ZWRcbiAgICBpZiAkLmlzRnVuY3Rpb24oQG9wdGlvbnMub25Ecm9wKVxuICAgICAgQG9wdGlvbnMub25Ecm9wKGV2ZW50LCBAZHJhZ0hhbmRsZXIpXG4gICAgQHJlc2V0KClcblxuXG4gIGNhbmNlbDogLT5cbiAgICBAcmVzZXQoKVxuXG5cbiAgcmVzZXQ6IC0+XG4gICAgaWYgQHN0YXJ0ZWRcbiAgICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICAgIEBwYWdlLiRib2R5LnJlbW92ZUNsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuXG4gICAgaWYgQGluaXRpYWxpemVkXG4gICAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICAgIEBkcmFnSGFuZGxlci5yZXNldCgpXG4gICAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICAgIGlmIEB0aW1lb3V0P1xuICAgICAgICBjbGVhclRpbWVvdXQoQHRpbWVvdXQpXG4gICAgICAgIEB0aW1lb3V0ID0gdW5kZWZpbmVkXG5cbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuICAgICAgQHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcigpXG4gICAgICBAcmVtb3ZlQmxvY2tlcigpXG5cblxuICBhZGRCbG9ja2VyOiAtPlxuICAgICRibG9ja2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcmFnQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgIEBwYWdlLiRib2R5LmFwcGVuZCgkYmxvY2tlcilcblxuXG4gIHJlbW92ZUJsb2NrZXI6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MuZHJhZ0Jsb2NrZXIgfVwiKS5yZW1vdmUoKVxuXG5cbiAgYWRkTG9uZ3ByZXNzSW5kaWNhdG9yOiAoeyBwYWdlWCwgcGFnZVkgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvcHRpb25zLmxvbmdwcmVzcy5zaG93SW5kaWNhdG9yXG4gICAgJGluZGljYXRvciA9ICQoXCI8ZGl2IGNsYXNzPVxcXCIjeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cXFwiPjxkaXY+PC9kaXY+PC9kaXY+XCIpXG4gICAgJGluZGljYXRvci5jc3MobGVmdDogcGFnZVgsIHRvcDogcGFnZVkpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRpbmRpY2F0b3IpXG5cblxuICByZW1vdmVMb25ncHJlc3NJbmRpY2F0b3I6IC0+XG4gICAgQHBhZ2UuJGJvZHkuZmluZChcIi4jeyBjc3MubG9uZ3ByZXNzSW5kaWNhdG9yIH1cIikucmVtb3ZlKClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBpbml0aWFsaXplZCBpbW1lZGlhdGVseSB0byBhbGxvdyBhIGxvbmctcHJlc3MgZmluaXNoXG4gIGFkZFN0b3BMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBldmVudE5hbWVzID1cbiAgICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnXG4gICAgICAgICd0b3VjaGVuZC5saXZpbmdkb2NzLWRyYWcgdG91Y2hjYW5jZWwubGl2aW5nZG9jcy1kcmFnIHRvdWNobGVhdmUubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgICAgJ2Ryb3AubGl2aW5nZG9jcy1kcmFnIGRyYWdlbmQubGl2aW5nZG9jcy1kcmFnJ1xuICAgICAgZWxzZVxuICAgICAgICAnbW91c2V1cC5saXZpbmdkb2NzLWRyYWcnXG5cbiAgICBAcGFnZS4kZG9jdW1lbnQub24gZXZlbnROYW1lcywgKGV2ZW50KSA9PlxuICAgICAgQGRyb3AoZXZlbnQpXG5cblxuICAjIFRoZXNlIGV2ZW50cyBhcmUgcG9zc2libHkgaW5pdGlhbGl6ZWQgd2l0aCBhIGRlbGF5IGluIGNvbXBvbmVudERyYWcjb25TdGFydFxuICBhZGRNb3ZlTGlzdGVuZXJzOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAndG91Y2htb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSBpZiBldmVudC50eXBlID09ICdkcmFnZW50ZXInIHx8IGV2ZW50LnR5cGUgPT0gJ2RyYWdiZXR0ZXJlbnRlcidcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnZHJhZ292ZXIubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG4gICAgZWxzZSAjIGFsbCBvdGhlciBpbnB1dCBkZXZpY2VzIGJlaGF2ZSBsaWtlIGEgbW91c2VcbiAgICAgIEBwYWdlLiRkb2N1bWVudC5vbiAnbW91c2Vtb3ZlLmxpdmluZ2RvY3MtZHJhZycsIChldmVudCkgPT5cbiAgICAgICAgaWYgQHN0YXJ0ZWRcbiAgICAgICAgICBAZHJhZ0hhbmRsZXIubW92ZShAZ2V0RXZlbnRQb3NpdGlvbihldmVudCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbW92ZShldmVudClcblxuXG4gIGdldEV2ZW50UG9zaXRpb246IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyB8fCBldmVudC50eXBlID09ICd0b3VjaG1vdmUnXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXNbMF1cblxuICAgICMgU28gZmFyIEkgZG8gbm90IHVuZGVyc3RhbmQgd2h5IHRoZSBqUXVlcnkgZXZlbnQgZG9lcyBub3QgY29udGFpbiBjbGllbnRYIGV0Yy5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdvdmVyJ1xuICAgICAgZXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50XG5cbiAgICBjbGllbnRYOiBldmVudC5jbGllbnRYXG4gICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgIHBhZ2VYOiBldmVudC5wYWdlWFxuICAgIHBhZ2VZOiBldmVudC5wYWdlWVxuXG5cbiAgZGlzdGFuY2U6IChwb2ludEEsIHBvaW50QikgLT5cbiAgICByZXR1cm4gdW5kZWZpbmVkIGlmICFwb2ludEEgfHwgIXBvaW50QlxuXG4gICAgZGlzdFggPSBwb2ludEEucGFnZVggLSBwb2ludEIucGFnZVhcbiAgICBkaXN0WSA9IHBvaW50QS5wYWdlWSAtIHBvaW50Qi5wYWdlWVxuICAgIE1hdGguc3FydCggKGRpc3RYICogZGlzdFgpICsgKGRpc3RZICogZGlzdFkpIClcblxuXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBlZGl0YWJsZS5qcyBDb250cm9sbGVyXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBJbnRlZ3JhdGUgZWRpdGFibGUuanMgaW50byBMaXZpbmdkb2NzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRhYmxlQ29udHJvbGxlclxuXG4gIGNvbnN0cnVjdG9yOiAoQHBhZ2UpIC0+XG5cbiAgICAjIEluaXRpYWxpemUgZWRpdGFibGUuanNcbiAgICBAZWRpdGFibGUgPSBuZXcgRWRpdGFibGVcbiAgICAgIHdpbmRvdzogQHBhZ2Uud2luZG93XG4gICAgICBicm93c2VyU3BlbGxjaGVjazogY29uZmlnLmVkaXRhYmxlLmJyb3dzZXJTcGVsbGNoZWNrXG4gICAgICBtb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzOiBjb25maWcuZWRpdGFibGUubW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlc1xuXG4gICAgQGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIEBzZWxlY3Rpb24gPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAZWRpdGFibGVcbiAgICAgIC5mb2N1cyhAd2l0aENvbnRleHQoQGZvY3VzKSlcbiAgICAgIC5ibHVyKEB3aXRoQ29udGV4dChAYmx1cikpXG4gICAgICAuaW5zZXJ0KEB3aXRoQ29udGV4dChAaW5zZXJ0KSlcbiAgICAgIC5tZXJnZShAd2l0aENvbnRleHQoQG1lcmdlKSlcbiAgICAgIC5zcGxpdChAd2l0aENvbnRleHQoQHNwbGl0KSlcbiAgICAgIC5zZWxlY3Rpb24oQHdpdGhDb250ZXh0KEBzZWxlY3Rpb25DaGFuZ2VkKSlcbiAgICAgIC5uZXdsaW5lKEB3aXRoQ29udGV4dChAbmV3bGluZSkpXG4gICAgICAuY2hhbmdlKEB3aXRoQ29udGV4dChAY2hhbmdlKSlcblxuXG4gICMgUmVnaXN0ZXIgRE9NIG5vZGVzIHdpdGggZWRpdGFibGUuanMuXG4gICMgQWZ0ZXIgdGhhdCBFZGl0YWJsZSB3aWxsIGZpcmUgZXZlbnRzIGZvciB0aGF0IG5vZGUuXG4gIGFkZDogKG5vZGVzKSAtPlxuICAgIEBlZGl0YWJsZS5hZGQobm9kZXMpXG5cblxuICBkaXNhYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5zdXNwZW5kKClcblxuXG4gIHJlZW5hYmxlQWxsOiAtPlxuICAgIEBlZGl0YWJsZS5jb250aW51ZSgpXG5cblxuICAjIEdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWUgZnJvbSB0aGUgRE9NIGVsZW1lbnQgcGFzc2VkIGJ5IGVkaXRhYmxlLmpzXG4gICNcbiAgIyBBbGwgbGlzdGVuZXJzIHBhcmFtcyBnZXQgdHJhbnNmb3JtZWQgc28gdGhleSBnZXQgdmlldyBhbmQgZWRpdGFibGVOYW1lXG4gICMgaW5zdGVhZCBvZiBlbGVtZW50OlxuICAjXG4gICMgRXhhbXBsZTogbGlzdGVuZXIodmlldywgZWRpdGFibGVOYW1lLCBvdGhlclBhcmFtcy4uLilcbiAgd2l0aENvbnRleHQ6IChmdW5jKSAtPlxuICAgIChlbGVtZW50LCBhcmdzLi4uKSA9PlxuICAgICAgdmlldyA9IGRvbS5maW5kQ29tcG9uZW50VmlldyhlbGVtZW50KVxuICAgICAgZWRpdGFibGVOYW1lID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoQGVkaXRhYmxlQXR0cilcbiAgICAgIGFyZ3MudW5zaGlmdCh2aWV3LCBlZGl0YWJsZU5hbWUpXG4gICAgICBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICBleHRyYWN0Q29udGVudDogKGVsZW1lbnQpIC0+XG4gICAgdmFsdWUgPSBAZWRpdGFibGUuZ2V0Q29udGVudChlbGVtZW50KVxuICAgIGlmIGNvbmZpZy5zaW5nbGVMaW5lQnJlYWsudGVzdCh2YWx1ZSkgfHwgdmFsdWUgPT0gJydcbiAgICAgIHVuZGVmaW5lZFxuICAgIGVsc2VcbiAgICAgIHZhbHVlXG5cblxuICB1cGRhdGVNb2RlbDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBleHRyYWN0Q29udGVudChlbGVtZW50KVxuICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgdmFsdWUpXG5cblxuICBmb2N1czogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICB2aWV3LmZvY3VzRWRpdGFibGUoZWRpdGFibGVOYW1lKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVGb2N1c2VkKGVsZW1lbnQsIHZpZXcpXG4gICAgdHJ1ZSAjIGVuYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgYmx1cjogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcblxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW1lbnQpXG5cbiAgICB2aWV3LmJsdXJFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG4gICAgQHBhZ2UuZm9jdXMuZWRpdGFibGVCbHVycmVkKGVsZW1lbnQsIHZpZXcpXG5cbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIEluc2VydCBhIG5ldyBibG9jay5cbiAgIyBVc3VhbGx5IHRyaWdnZXJlZCBieSBwcmVzc2luZyBlbnRlciBhdCB0aGUgZW5kIG9mIGEgYmxvY2tcbiAgIyBvciBieSBwcmVzc2luZyBkZWxldGUgYXQgdGhlIGJlZ2lubmluZyBvZiBhIGJsb2NrLlxuICBpbnNlcnQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGRlZmF1bHRQYXJhZ3JhcGggPSBAcGFnZS5kZXNpZ24uZGVmYXVsdFBhcmFncmFwaFxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KSAmJiBkZWZhdWx0UGFyYWdyYXBoP1xuICAgICAgY29weSA9IGRlZmF1bHRQYXJhZ3JhcGguY3JlYXRlTW9kZWwoKVxuXG4gICAgICBuZXdWaWV3ID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnXG4gICAgICAgIHZpZXcubW9kZWwuYmVmb3JlKGNvcHkpXG4gICAgICAgIHZpZXcucHJldigpXG4gICAgICBlbHNlXG4gICAgICAgIHZpZXcubW9kZWwuYWZ0ZXIoY29weSlcbiAgICAgICAgdmlldy5uZXh0KClcblxuICAgICAgbmV3Vmlldy5mb2N1cygpIGlmIG5ld1ZpZXcgJiYgZGlyZWN0aW9uID09ICdhZnRlcidcblxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIE1lcmdlIHR3byBibG9ja3MuIFdvcmtzIGluIHR3byBkaXJlY3Rpb25zLlxuICAjIEVpdGhlciB0aGUgY3VycmVudCBibG9jayBpcyBiZWluZyBtZXJnZWQgaW50byB0aGUgcHJlY2VlZGluZyAoJ2JlZm9yZScpXG4gICMgb3IgdGhlIGZvbGxvd2luZyAoJ2FmdGVyJykgYmxvY2suXG4gICMgQWZ0ZXIgdGhlIG1lcmdlIHRoZSBjdXJyZW50IGJsb2NrIGlzIHJlbW92ZWQgYW5kIHRoZSBmb2N1cyBzZXQgdG8gdGhlXG4gICMgb3RoZXIgYmxvY2sgdGhhdCB3YXMgbWVyZ2VkIGludG8uXG4gIG1lcmdlOiAodmlldywgZWRpdGFibGVOYW1lLCBkaXJlY3Rpb24sIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcbiAgICAgIG1lcmdlZFZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZScgdGhlbiB2aWV3LnByZXYoKSBlbHNlIHZpZXcubmV4dCgpXG5cbiAgICAgIGlmIG1lcmdlZFZpZXcgJiYgbWVyZ2VkVmlldy50ZW1wbGF0ZSA9PSB2aWV3LnRlbXBsYXRlXG4gICAgICAgIHZpZXdFbGVtID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgICAgbWVyZ2VkVmlld0VsZW0gPSBtZXJnZWRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuXG4gICAgICAgICMgR2F0aGVyIHRoZSBjb250ZW50IHRoYXQgaXMgZ29pbmcgdG8gYmUgbWVyZ2VkXG4gICAgICAgIGNvbnRlbnRUb01lcmdlID0gQGVkaXRhYmxlLmdldENvbnRlbnQodmlld0VsZW0pXG5cbiAgICAgICAgY3Vyc29yID0gaWYgZGlyZWN0aW9uID09ICdiZWZvcmUnXG4gICAgICAgICAgQGVkaXRhYmxlLmFwcGVuZFRvKG1lcmdlZFZpZXdFbGVtLCBjb250ZW50VG9NZXJnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBlZGl0YWJsZS5wcmVwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuXG4gICAgICAgIHZpZXcubW9kZWwucmVtb3ZlKClcbiAgICAgICAgY3Vyc29yLnNldFZpc2libGVTZWxlY3Rpb24oKVxuXG4gICAgICAgICMgQWZ0ZXIgZXZlcnl0aGluZyBpcyBkb25lIGFuZCB0aGUgZm9jdXMgaXMgc2V0IHVwZGF0ZSB0aGUgbW9kZWwgdG9cbiAgICAgICAgIyBtYWtlIHN1cmUgdGhlIG1vZGVsIGlzIHVwIHRvIGRhdGUgYW5kIGNoYW5nZXMgYXJlIG5vdGlmaWVkLlxuICAgICAgICBAdXBkYXRlTW9kZWwobWVyZ2VkVmlldywgZWRpdGFibGVOYW1lLCBtZXJnZWRWaWV3RWxlbSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBTcGxpdCBhIGJsb2NrIGluIHR3by5cbiAgIyBVc3VhbGx5IHRyaWdnZXJlZCBieSBwcmVzc2luZyBlbnRlciBpbiB0aGUgbWlkZGxlIG9mIGEgYmxvY2suXG4gIHNwbGl0OiAodmlldywgZWRpdGFibGVOYW1lLCBiZWZvcmUsIGFmdGVyLCBjdXJzb3IpIC0+XG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpXG5cbiAgICAgICMgYXBwZW5kIGFuZCBmb2N1cyBjb3B5IG9mIGNvbXBvbmVudFxuICAgICAgY29weSA9IHZpZXcudGVtcGxhdGUuY3JlYXRlTW9kZWwoKVxuICAgICAgY29weS5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYWZ0ZXIpKVxuICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgdmlldy5uZXh0KCk/LmZvY3VzKClcblxuICAgICAgIyBzZXQgY29udGVudCBvZiB0aGUgYmVmb3JlIGVsZW1lbnQgKGFmdGVyIGZvY3VzIGlzIHNldCB0byB0aGUgYWZ0ZXIgZWxlbWVudClcbiAgICAgIHZpZXcubW9kZWwuc2V0KGVkaXRhYmxlTmFtZSwgQGV4dHJhY3RDb250ZW50KGJlZm9yZSkpXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgT2NjdXJzIHdoZW5ldmVyIHRoZSB1c2VyIHNlbGVjdHMgb25lIG9yIG1vcmUgY2hhcmFjdGVycyBvciB3aGVuZXZlciB0aGVcbiAgIyBzZWxlY3Rpb24gaXMgY2hhbmdlZC5cbiAgc2VsZWN0aW9uQ2hhbmdlZDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIGVsZW1lbnQgPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgIEBzZWxlY3Rpb24uZmlyZSh2aWV3LCBlbGVtZW50LCBzZWxlY3Rpb24pXG5cblxuICAjIEluc2VydCBhIG5ld2xpbmUgKFNoaWZ0ICsgRW50ZXIpXG4gIG5ld2xpbmU6ICh2aWV3LCBlZGl0YWJsZSwgY3Vyc29yKSAtPlxuICAgIGlmIGNvbmZpZy5lZGl0YWJsZS5hbGxvd05ld2xpbmVcbiAgICAgIHJldHVybiB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgZWxzZVxuICAgICByZXR1cm4gZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFRyaWdnZXJlZCB3aGVuZXZlciB0aGUgdXNlciBjaGFuZ2VzIHRoZSBjb250ZW50IG9mIGEgYmxvY2suXG4gICMgVGhlIGNoYW5nZSBldmVudCBkb2VzIG5vdCBhdXRvbWF0aWNhbGx5IGZpcmUgaWYgdGhlIGNvbnRlbnQgaGFzXG4gICMgYmVlbiBjaGFuZ2VkIHZpYSBqYXZhc2NyaXB0LlxuICBjaGFuZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUpIC0+XG4gICAgQGNsZWFyQ2hhbmdlVGltZW91dCgpXG4gICAgcmV0dXJuIGlmIGNvbmZpZy5lZGl0YWJsZS5jaGFuZ2VEZWxheSA9PSBmYWxzZVxuXG4gICAgQGNoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICBlbGVtID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICAgIEB1cGRhdGVNb2RlbCh2aWV3LCBlZGl0YWJsZU5hbWUsIGVsZW0pXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuICAgICwgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5XG5cblxuICBjbGVhckNoYW5nZVRpbWVvdXQ6IC0+XG4gICAgaWYgQGNoYW5nZVRpbWVvdXQ/XG4gICAgICBjbGVhclRpbWVvdXQoQGNoYW5nZVRpbWVvdXQpXG4gICAgICBAY2hhbmdlVGltZW91dCA9IHVuZGVmaW5lZFxuXG5cbiAgaGFzU2luZ2xlRWRpdGFibGU6ICh2aWV3KSAtPlxuICAgIHZpZXcuZGlyZWN0aXZlcy5sZW5ndGggPT0gMSAmJiB2aWV3LmRpcmVjdGl2ZXNbMF0udHlwZSA9PSAnZWRpdGFibGUnXG5cbiIsImRvbSA9IHJlcXVpcmUoJy4vZG9tJylcblxuIyBDb21wb25lbnQgRm9jdXNcbiMgLS0tLS0tLS0tLS0tLS0tXG4jIE1hbmFnZSB0aGUgY29tcG9uZW50IG9yIGVkaXRhYmxlIHRoYXQgaXMgY3VycmVudGx5IGZvY3VzZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRm9jdXNcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG4gICAgQGNvbXBvbmVudFZpZXcgPSB1bmRlZmluZWRcblxuICAgIEBjb21wb25lbnRGb2N1cyA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50Qmx1ciA9ICQuQ2FsbGJhY2tzKClcblxuXG4gIHNldEZvY3VzOiAoY29tcG9uZW50VmlldywgZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIGVkaXRhYmxlTm9kZSAhPSBAZWRpdGFibGVOb2RlXG4gICAgICBAcmVzZXRFZGl0YWJsZSgpXG4gICAgICBAZWRpdGFibGVOb2RlID0gZWRpdGFibGVOb2RlXG5cbiAgICBpZiBjb21wb25lbnRWaWV3ICE9IEBjb21wb25lbnRWaWV3XG4gICAgICBAcmVzZXRDb21wb25lbnRWaWV3KClcbiAgICAgIGlmIGNvbXBvbmVudFZpZXdcbiAgICAgICAgQGNvbXBvbmVudFZpZXcgPSBjb21wb25lbnRWaWV3XG4gICAgICAgIEBjb21wb25lbnRGb2N1cy5maXJlKEBjb21wb25lbnRWaWV3KVxuXG5cbiAgIyBjYWxsIGFmdGVyIGJyb3dzZXIgZm9jdXMgY2hhbmdlXG4gIGVkaXRhYmxlRm9jdXNlZDogKGVkaXRhYmxlTm9kZSwgY29tcG9uZW50VmlldykgLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlICE9IGVkaXRhYmxlTm9kZVxuICAgICAgY29tcG9uZW50VmlldyB8fD0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGVkaXRhYmxlTm9kZSlcbiAgICAgIEBzZXRGb2N1cyhjb21wb25lbnRWaWV3LCBlZGl0YWJsZU5vZGUpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVCbHVycmVkOiAoZWRpdGFibGVOb2RlKSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgPT0gZWRpdGFibGVOb2RlXG4gICAgICBAc2V0Rm9jdXMoQGNvbXBvbmVudFZpZXcsIHVuZGVmaW5lZClcblxuXG4gICMgY2FsbCBhZnRlciBjbGlja1xuICBjb21wb25lbnRGb2N1c2VkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBpZiBAY29tcG9uZW50VmlldyAhPSBjb21wb25lbnRWaWV3XG4gICAgICBAc2V0Rm9jdXMoY29tcG9uZW50VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgYmx1cjogLT5cbiAgICBAc2V0Rm9jdXModW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgcmVzZXRFZGl0YWJsZTogLT5cbiAgICBpZiBAZWRpdGFibGVOb2RlXG4gICAgICBAZWRpdGFibGVOb2RlID0gdW5kZWZpbmVkXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldENvbXBvbmVudFZpZXc6IC0+XG4gICAgaWYgQGNvbXBvbmVudFZpZXdcbiAgICAgIHByZXZpb3VzID0gQGNvbXBvbmVudFZpZXdcbiAgICAgIEBjb21wb25lbnRWaWV3ID0gdW5kZWZpbmVkXG4gICAgICBAY29tcG9uZW50Qmx1ci5maXJlKHByZXZpb3VzKVxuXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcmVuZGVyaW5nX2NvbnRhaW5lcicpXG5QYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL3BhZ2UnKVxuSW50ZXJhY3RpdmVQYWdlID0gcmVxdWlyZSgnLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZy9yZW5kZXJlcicpXG5WaWV3ID0gcmVxdWlyZSgnLi9yZW5kZXJpbmcvdmlldycpXG5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpXG5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4vaW50ZXJhY3Rpb24vZG9tJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkNvbXBvbmVudFRyZWUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlJylcbkRlcGVuZGVuY2llcyA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL2RlcGVuZGVuY2llcycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTGl2aW5nZG9jIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cblxuICAjIENyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBAY3JlYXRlOiAoeyBkYXRhLCBkZXNpZ25OYW1lLCBjb21wb25lbnRUcmVlIH0pIC0+XG4gICAgY29tcG9uZW50VHJlZSA9IGlmIGRhdGE/XG4gICAgICBkZXNpZ25OYW1lID0gZGF0YS5kZXNpZ24/Lm5hbWVcbiAgICAgIGFzc2VydCBkZXNpZ25OYW1lPywgJ0Vycm9yIGNyZWF0aW5nIGxpdmluZ2RvYzogTm8gZGVzaWduIGlzIHNwZWNpZmllZC4nXG4gICAgICBkZXNpZ24gPSBkZXNpZ25DYWNoZS5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBDb21wb25lbnRUcmVlKGNvbnRlbnQ6IGRhdGEsIGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2UgaWYgZGVzaWduTmFtZT9cbiAgICAgIGRlc2lnbiA9IGRlc2lnbkNhY2hlLmdldChkZXNpZ25OYW1lKVxuICAgICAgbmV3IENvbXBvbmVudFRyZWUoZGVzaWduOiBkZXNpZ24pXG4gICAgZWxzZVxuICAgICAgY29tcG9uZW50VHJlZVxuXG4gICAgbmV3IExpdmluZ2RvYyh7IGNvbXBvbmVudFRyZWUgfSlcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb21wb25lbnRUcmVlIH0pIC0+XG4gICAgQGRlc2lnbiA9IGNvbXBvbmVudFRyZWUuZGVzaWduXG5cbiAgICBAY29tcG9uZW50VHJlZSA9IHVuZGVmaW5lZFxuICAgIEBkZXBlbmRlbmNpZXMgPSB1bmRlZmluZWRcbiAgICBAc2V0Q29tcG9uZW50VHJlZShjb21wb25lbnRUcmVlKVxuXG4gICAgQGludGVyYWN0aXZlVmlldyA9IHVuZGVmaW5lZFxuICAgIEBhZGRpdGlvbmFsVmlld3MgPSBbXVxuXG5cbiAgIyBHZXQgYSBkcm9wIHRhcmdldCBmb3IgYW4gZXZlbnRcbiAgZ2V0RHJvcFRhcmdldDogKHsgZXZlbnQgfSkgLT5cbiAgICBkb2N1bWVudCA9IGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50XG4gICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFxuICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG4gICAgaWYgZWxlbT9cbiAgICAgIGNvb3JkcyA9IHsgbGVmdDogZXZlbnQucGFnZVgsIHRvcDogZXZlbnQucGFnZVkgfVxuICAgICAgdGFyZ2V0ID0gZG9tLmRyb3BUYXJnZXQoZWxlbSwgY29vcmRzKVxuXG5cbiAgc2V0Q29tcG9uZW50VHJlZTogKGNvbXBvbmVudFRyZWUpIC0+XG4gICAgYXNzZXJ0IGNvbXBvbmVudFRyZWUuZGVzaWduID09IEBkZXNpZ24sXG4gICAgICAnQ29tcG9uZW50VHJlZSBtdXN0IGhhdmUgdGhlIHNhbWUgZGVzaWduIGFzIHRoZSBkb2N1bWVudCdcblxuICAgIEBtb2RlbCA9IEBjb21wb25lbnRUcmVlID0gY29tcG9uZW50VHJlZVxuICAgIEBkZXBlbmRlbmNpZXMgPSBuZXcgRGVwZW5kZW5jaWVzKHsgQGNvbXBvbmVudFRyZWUgfSlcbiAgICBAZm9yd2FyZENvbXBvbmVudFRyZWVFdmVudHMoKVxuXG5cbiAgZm9yd2FyZENvbXBvbmVudFRyZWVFdmVudHM6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuY2hhbmdlZC5hZGQgPT5cbiAgICAgIEBlbWl0ICdjaGFuZ2UnLCBhcmd1bWVudHNcblxuXG4gIGNyZWF0ZVZpZXc6IChwYXJlbnQsIG9wdGlvbnM9e30pIC0+XG4gICAgcGFyZW50ID89IHdpbmRvdy5kb2N1bWVudC5ib2R5XG4gICAgb3B0aW9ucy5yZWFkT25seSA/PSB0cnVlXG5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcblxuICAgIG9wdGlvbnMuJHdyYXBwZXIgPz0gQGZpbmRXcmFwcGVyKCRwYXJlbnQpXG4gICAgJHBhcmVudC5odG1sKCcnKSAjIGVtcHR5IGNvbnRhaW5lclxuXG4gICAgdmlldyA9IG5ldyBWaWV3KHRoaXMsICRwYXJlbnRbMF0pXG4gICAgd2hlblZpZXdJc1JlYWR5ID0gdmlldy5jcmVhdGUob3B0aW9ucylcblxuICAgIGlmIHZpZXcuaXNJbnRlcmFjdGl2ZVxuICAgICAgQHNldEludGVyYWN0aXZlVmlldyh2aWV3KVxuICAgICAgd2hlblZpZXdJc1JlYWR5LnRoZW4gKHsgaWZyYW1lLCByZW5kZXJlciB9KSA9PlxuICAgICAgICBAY29tcG9uZW50VHJlZS5zZXRNYWluVmlldyh2aWV3KVxuXG4gICAgd2hlblZpZXdJc1JlYWR5XG5cblxuICBjcmVhdGVDb21wb25lbnQ6IC0+XG4gICAgQGNvbXBvbmVudFRyZWUuY3JlYXRlQ29tcG9uZW50LmFwcGx5KEBjb21wb25lbnRUcmVlLCBhcmd1bWVudHMpXG5cblxuICAjIEFwcGVuZCB0aGUgYXJ0aWNsZSB0byB0aGUgRE9NLlxuICAjXG4gICMgQHBhcmFtIHsgRE9NIE5vZGUsIGpRdWVyeSBvYmplY3Qgb3IgQ1NTIHNlbGVjdG9yIHN0cmluZyB9IFdoZXJlIHRvIGFwcGVuZCB0aGUgYXJ0aWNsZSBpbiB0aGUgZG9jdW1lbnQuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH0gb3B0aW9uczpcbiAgIyAgIGludGVyYWN0aXZlOiB7IEJvb2xlYW4gfSBXaGV0aGVyIHRoZSBkb2N1bWVudCBpcyBlZHRpYWJsZS5cbiAgIyAgIGxvYWRBc3NldHM6IHsgQm9vbGVhbiB9IExvYWQgSnMgYW5kIENTUyBmaWxlcy5cbiAgIyAgICAgT25seSBkaXNhYmxlIHRoaXMgaWYgeW91IGFyZSBzdXJlIHlvdSBoYXZlIGxvYWRlZCBldmVyeXRoaW5nIG1hbnVhbGx5LlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBhcnRpY2xlLmFwcGVuZFRvKCcuYXJ0aWNsZScsIHsgaW50ZXJhY3RpdmU6IHRydWUsIGxvYWRBc3NldHM6IGZhbHNlIH0pO1xuICBhcHBlbmRUbzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcbiAgICBvcHRpb25zLiR3cmFwcGVyID89IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuICAgIHZpZXcgPSBuZXcgVmlldyh0aGlzLCAkcGFyZW50WzBdKVxuICAgIHZpZXcuY3JlYXRlUmVuZGVyZXIoeyBvcHRpb25zIH0pXG5cblxuXG4gICMgQSB2aWV3IHNvbWV0aW1lcyBoYXMgdG8gYmUgd3JhcHBlZCBpbiBhIGNvbnRhaW5lci5cbiAgI1xuICAjIEV4YW1wbGU6XG4gICMgSGVyZSB0aGUgZG9jdW1lbnQgaXMgcmVuZGVyZWQgaW50byAkKCcuZG9jLXNlY3Rpb24nKVxuICAjIDxkaXYgY2xhc3M9XCJpZnJhbWUtY29udGFpbmVyXCI+XG4gICMgICA8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPjwvc2VjdGlvbj5cbiAgIyA8L2Rpdj5cbiAgZmluZFdyYXBwZXI6ICgkcGFyZW50KSAtPlxuICAgIGlmICRwYXJlbnQuZmluZChcIi4jeyBjb25maWcuY3NzLnNlY3Rpb24gfVwiKS5sZW5ndGggPT0gMVxuICAgICAgJHdyYXBwZXIgPSAkKCRwYXJlbnQuaHRtbCgpKVxuXG4gICAgJHdyYXBwZXJcblxuXG4gIHNldEludGVyYWN0aXZlVmlldzogKHZpZXcpIC0+XG4gICAgYXNzZXJ0IG5vdCBAaW50ZXJhY3RpdmVWaWV3PyxcbiAgICAgICdFcnJvciBjcmVhdGluZyBpbnRlcmFjdGl2ZSB2aWV3OiBMaXZpbmdkb2MgY2FuIGhhdmUgb25seSBvbmUgaW50ZXJhY3RpdmUgdmlldydcblxuICAgIEBpbnRlcmFjdGl2ZVZpZXcgPSB2aWV3XG5cblxuICBhZGRKc0RlcGVuZGVuY3k6IChvYmopIC0+XG4gICAgQGRlcGVuZGVuY2llcy5hZGRKcyhvYmopXG5cblxuICBhZGRDc3NEZXBlbmRlbmN5OiAob2JqKSAtPlxuICAgIEBkZXBlbmRlbmNpZXMuYWRkQ3NzKG9iailcblxuXG4gIGhhc0RlcGVuZGVuY2llczogLT5cbiAgICBAZGVwZW5kZW5jaWVzPy5oYXNKcygpIHx8IEBkZXBlbmRlbmNpZXM/Lmhhc0NzcygpXG5cblxuICB0b0h0bWw6ICh7IGV4Y2x1ZGVDb21wb25lbnRzIH09e30pIC0+XG4gICAgbmV3IFJlbmRlcmVyKFxuICAgICAgY29tcG9uZW50VHJlZTogQGNvbXBvbmVudFRyZWVcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogbmV3IFJlbmRlcmluZ0NvbnRhaW5lcigpXG4gICAgICBleGNsdWRlQ29tcG9uZW50czogZXhjbHVkZUNvbXBvbmVudHNcbiAgICApLmh0bWwoKVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLnNlcmlhbGl6ZSgpXG5cblxuICB0b0pzb246IChwcmV0dGlmeSkgLT5cbiAgICBkYXRhID0gQHNlcmlhbGl6ZSgpXG4gICAgaWYgcHJldHRpZnk/XG4gICAgICByZXBsYWNlciA9IG51bGxcbiAgICAgIGluZGVudGF0aW9uID0gMlxuICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIGluZGVudGF0aW9uKVxuICAgIGVsc2VcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cblxuICAjIERlYnVnXG4gICMgLS0tLS1cblxuICAjIFByaW50IHRoZSBDb21wb25lbnRUcmVlLlxuICBwcmludE1vZGVsOiAoKSAtPlxuICAgIEBjb21wb25lbnRUcmVlLnByaW50KClcblxuXG4gIExpdmluZ2RvYy5kb20gPSBkb21cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgdG8gYSAkLkNhbGxiYWNrcyBvYmplY3QgdGhhdCB3aWxsXG4gICMgcmVtb3ZlIGl0c2VsZiBmcm9tIGl0cyAkLkNhbGxiYWNrcyBhZnRlciB0aGUgZmlyc3QgY2FsbC5cbiAgY2FsbE9uY2U6IChjYWxsYmFja3MsIGxpc3RlbmVyKSAtPlxuICAgIHNlbGZSZW1vdmluZ0Z1bmMgPSAoYXJncy4uLikgLT5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmUoc2VsZlJlbW92aW5nRnVuYylcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpXG5cbiAgICBjYWxsYmFja3MuYWRkKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgc2VsZlJlbW92aW5nRnVuY1xuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gJCgnPHg+JylbMF1cbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSAncG9pbnRlci1ldmVudHM6YXV0bydcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID09ICdhdXRvJ1xuIiwiZGV0ZWN0cyA9IHJlcXVpcmUoJy4vZmVhdHVyZV9kZXRlY3RzJylcblxuZXhlY3V0ZWRUZXN0cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG5hbWUpIC0+XG4gIGlmIChyZXN1bHQgPSBleGVjdXRlZFRlc3RzW25hbWVdKSA9PSB1bmRlZmluZWRcbiAgICBleGVjdXRlZFRlc3RzW25hbWVdID0gQm9vbGVhbihkZXRlY3RzW25hbWVdKCkpXG4gIGVsc2VcbiAgICByZXN1bHRcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlkQ291bnRlciA9IGxhc3RJZCA9IHVuZGVmaW5lZFxuXG4gICMgR2VuZXJhdGUgYSB1bmlxdWUgaWQuXG4gICMgR3VhcmFudGVlcyBhIHVuaXF1ZSBpZCBpbiB0aGlzIHJ1bnRpbWUuXG4gICMgQWNyb3NzIHJ1bnRpbWVzIGl0cyBsaWtlbHkgYnV0IG5vdCBndWFyYW50ZWVkIHRvIGJlIHVuaXF1ZVxuICAjIFVzZSB0aGUgdXNlciBwcmVmaXggdG8gYWxtb3N0IGd1YXJhbnRlZSB1bmlxdWVuZXNzLFxuICAjIGFzc3VtaW5nIHRoZSBzYW1lIHVzZXIgY2Fubm90IGdlbmVyYXRlIGNvbXBvbmVudHMgaW5cbiAgIyBtdWx0aXBsZSBydW50aW1lcyBhdCB0aGUgc2FtZSB0aW1lIChhbmQgdGhhdCBjbG9ja3MgYXJlIGluIHN5bmMpXG4gIG5leHQ6ICh1c2VyID0gJ2RvYycpIC0+XG5cbiAgICAjIGdlbmVyYXRlIDktZGlnaXQgdGltZXN0YW1wXG4gICAgbmV4dElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzMilcblxuICAgICMgYWRkIGNvdW50ZXIgaWYgbXVsdGlwbGUgdHJlZXMgbmVlZCBpZHMgaW4gdGhlIHNhbWUgbWlsbGlzZWNvbmRcbiAgICBpZiBsYXN0SWQgPT0gbmV4dElkXG4gICAgICBpZENvdW50ZXIgKz0gMVxuICAgIGVsc2VcbiAgICAgIGlkQ291bnRlciA9IDBcbiAgICAgIGxhc3RJZCA9IG5leHRJZFxuXG4gICAgXCIjeyB1c2VyIH0tI3sgbmV4dElkIH0jeyBpZENvdW50ZXIgfVwiXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICRcbiIsImxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxuIyBGdW5jdGlvbiB0byBhc3NlcnQgYSBjb25kaXRpb24uIElmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldCwgYW4gZXJyb3IgaXNcbiMgcmFpc2VkIHdpdGggdGhlIHNwZWNpZmllZCBtZXNzYWdlLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIGFzc2VydCBhIGlzbnQgYiwgJ2EgY2FuIG5vdCBiZSBiJ1xuI1xubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnQgPSAoY29uZGl0aW9uLCBtZXNzYWdlKSAtPlxuICBsb2cuZXJyb3IobWVzc2FnZSkgdW5sZXNzIGNvbmRpdGlvblxuIiwiXG4jIExvZyBIZWxwZXJcbiMgLS0tLS0tLS0tLVxuIyBEZWZhdWx0IGxvZ2dpbmcgaGVscGVyXG4jIEBwYXJhbXM6IHBhc3MgYFwidHJhY2VcImAgYXMgbGFzdCBwYXJhbWV0ZXIgdG8gb3V0cHV0IHRoZSBjYWxsIHN0YWNrXG5tb2R1bGUuZXhwb3J0cyA9IGxvZyA9IChhcmdzLi4uKSAtPlxuICBpZiB3aW5kb3cuY29uc29sZT9cbiAgICBpZiBhcmdzLmxlbmd0aCBhbmQgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICd0cmFjZSdcbiAgICAgIGFyZ3MucG9wKClcbiAgICAgIHdpbmRvdy5jb25zb2xlLnRyYWNlKCkgaWYgd2luZG93LmNvbnNvbGUudHJhY2U/XG5cbiAgICB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkod2luZG93LmNvbnNvbGUsIGFyZ3MpXG4gICAgdW5kZWZpbmVkXG5cblxuZG8gLT5cblxuICAjIEN1c3RvbSBlcnJvciB0eXBlIGZvciBsaXZpbmdkb2NzLlxuICAjIFdlIGNhbiB1c2UgdGhpcyB0byB0cmFjayB0aGUgb3JpZ2luIG9mIGFuIGV4cGVjdGlvbiBpbiB1bml0IHRlc3RzLlxuICBjbGFzcyBMaXZpbmdkb2NzRXJyb3IgZXh0ZW5kcyBFcnJvclxuXG4gICAgY29uc3RydWN0b3I6IChtZXNzYWdlKSAtPlxuICAgICAgc3VwZXJcbiAgICAgIEBtZXNzYWdlID0gbWVzc2FnZVxuICAgICAgQHRocm93bkJ5TGl2aW5nZG9jcyA9IHRydWVcblxuXG4gICMgQHBhcmFtIGxldmVsOiBvbmUgb2YgdGhlc2Ugc3RyaW5nczpcbiAgIyAnY3JpdGljYWwnLCAnZXJyb3InLCAnd2FybmluZycsICdpbmZvJywgJ2RlYnVnJ1xuICBub3RpZnkgPSAobWVzc2FnZSwgbGV2ZWwgPSAnZXJyb3InKSAtPlxuICAgIGlmIF9yb2xsYmFyP1xuICAgICAgX3JvbGxiYXIucHVzaCBuZXcgRXJyb3IobWVzc2FnZSksIC0+XG4gICAgICAgIGlmIChsZXZlbCA9PSAnY3JpdGljYWwnIG9yIGxldmVsID09ICdlcnJvcicpIGFuZCB3aW5kb3cuY29uc29sZT8uZXJyb3I/XG4gICAgICAgICAgd2luZG93LmNvbnNvbGUuZXJyb3IuY2FsbCh3aW5kb3cuY29uc29sZSwgbWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKVxuICAgICAgICB0aHJvdyBuZXcgTGl2aW5nZG9jc0Vycm9yKG1lc3NhZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy5jYWxsKHVuZGVmaW5lZCwgbWVzc2FnZSlcblxuICAgIHVuZGVmaW5lZFxuXG5cbiAgbG9nLmRlYnVnID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdkZWJ1ZycpIHVubGVzcyBsb2cuZGVidWdEaXNhYmxlZFxuXG5cbiAgbG9nLndhcm4gPSAobWVzc2FnZSkgLT5cbiAgICBub3RpZnkobWVzc2FnZSwgJ3dhcm5pbmcnKSB1bmxlc3MgbG9nLndhcm5pbmdzRGlzYWJsZWRcblxuXG4gICMgTG9nIGVycm9yIGFuZCB0aHJvdyBleGNlcHRpb25cbiAgbG9nLmVycm9yID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICdlcnJvcicpXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgT3JkZXJlZEhhc2hcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAb2JqID0ge31cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgcHVzaDogKGtleSwgdmFsdWUpIC0+XG4gICAgQG9ialtrZXldID0gdmFsdWVcbiAgICBAW0BsZW5ndGhdID0gdmFsdWVcbiAgICBAbGVuZ3RoICs9IDFcblxuXG4gIGdldDogKGtleSkgLT5cbiAgICBAb2JqW2tleV1cblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgdmFsdWUgaW4gdGhpc1xuICAgICAgY2FsbGJhY2sodmFsdWUpXG5cblxuICB0b0FycmF5OiAtPlxuICAgIHZhbHVlIGZvciB2YWx1ZSBpbiB0aGlzXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gd2FpdCBmb3IgdGFza3MgdG8gZmluaXNoIGJlZm9yZSBmaXJpbmcgYSBzZXJpZXMgb2ZcbiMgY2FsbGJhY2tzLiBPbmNlIHN0YXJ0KCkgaXMgY2FsbGVkLCB0aGUgY2FsbGJhY2tzIGZpcmUgYXMgc29vbiBhcyB0aGUgY291bnRcbiMgcmVhY2hlcyAwLiBUaHVzLCB5b3Ugc2hvdWxkIGluY3JlbWVudCB0aGUgY291bnQgYmVmb3JlIHN0YXJ0aW5nIGl0LiBXaGVuXG4jIGFkZGluZyBhIGNhbGxiYWNrIGFmdGVyIGhhdmluZyBmaXJlZCBjYXVzZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCByaWdodFxuIyBhd2F5LiBJbmNyZW1lbnRpbmcgdGhlIGNvdW50IGFmdGVyIGl0IGZpcmVkIHJlc3VsdHMgaW4gYW4gZXJyb3IuXG4jXG4jIEBleGFtcGxlXG4jXG4jICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4jXG4jICAgc2VtYXBob3JlLmluY3JlbWVudCgpXG4jICAgZG9Tb21ldGhpbmcoKS50aGVuKHNlbWFwaG9yZS5kZWNyZW1lbnQoKSlcbiNcbiMgICBkb0Fub3RoZXJUaGluZ1RoYXRUYWtlc0FDYWxsYmFjayhzZW1hcGhvcmUud2FpdCgpKVxuI1xuIyAgIHNlbWFwaG9yZS5zdGFydCgpXG4jXG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCdoZWxsbycpKVxuI1xuIyAgICMgT25jZSBjb3VudCByZWFjaGVzIDAgY2FsbGJhY2sgaXMgZXhlY3V0ZWQ6XG4jICAgIyA9PiAnaGVsbG8nXG4jXG4jICAgIyBBc3N1bWluZyB0aGF0IHNlbWFwaG9yZSB3YXMgYWxyZWFkeSBmaXJlZDpcbiMgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soLT4gcHJpbnQoJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseScpKVxuIyAgICMgPT4gJ3RoaXMgd2lsbCBwcmludCBpbW1lZGlhdGVseSdcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU2VtYXBob3JlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvdW50ID0gMFxuICAgIEBzdGFydGVkID0gZmFsc2VcbiAgICBAd2FzRmlyZWQgPSBmYWxzZVxuICAgIEBjYWxsYmFja3MgPSBbXVxuXG5cbiAgYWRkQ2FsbGJhY2s6IChjYWxsYmFjaykgLT5cbiAgICBpZiBAd2FzRmlyZWRcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEB3YXNGaXJlZFxuXG5cbiAgc3RhcnQ6IC0+XG4gICAgYXNzZXJ0IG5vdCBAc3RhcnRlZCxcbiAgICAgIFwiVW5hYmxlIHRvIHN0YXJ0IFNlbWFwaG9yZSBvbmNlIHN0YXJ0ZWQuXCJcbiAgICBAc3RhcnRlZCA9IHRydWVcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgaW5jcmVtZW50OiAtPlxuICAgIGFzc2VydCBub3QgQHdhc0ZpcmVkLFxuICAgICAgXCJVbmFibGUgdG8gaW5jcmVtZW50IGNvdW50IG9uY2UgU2VtYXBob3JlIGlzIGZpcmVkLlwiXG4gICAgQGNvdW50ICs9IDFcblxuXG4gIGRlY3JlbWVudDogLT5cbiAgICBhc3NlcnQgQGNvdW50ID4gMCxcbiAgICAgIFwiVW5hYmxlIHRvIGRlY3JlbWVudCBjb3VudCByZXN1bHRpbmcgaW4gbmVnYXRpdmUgY291bnQuXCJcbiAgICBAY291bnQgLT0gMVxuICAgIEBmaXJlSWZSZWFkeSgpXG5cblxuICB3YWl0OiAtPlxuICAgIEBpbmNyZW1lbnQoKVxuICAgID0+IEBkZWNyZW1lbnQoKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBmaXJlSWZSZWFkeTogLT5cbiAgICBpZiBAY291bnQgPT0gMCAmJiBAc3RhcnRlZCA9PSB0cnVlXG4gICAgICBAd2FzRmlyZWQgPSB0cnVlXG4gICAgICBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgaXNFbXB0eTogKG9iaikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3Mgb2JqP1xuICAgIGZvciBuYW1lIG9mIG9ialxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG9iai5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gICAgdHJ1ZVxuXG5cbiAgZmxhdENvcHk6IChvYmopIC0+XG4gICAgY29weSA9IHVuZGVmaW5lZFxuXG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIG9ialxuICAgICAgY29weSB8fD0ge31cbiAgICAgIGNvcHlbbmFtZV0gPSB2YWx1ZVxuXG4gICAgY29weVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbiMgU3RyaW5nIEhlbHBlcnNcbiMgLS0tLS0tLS0tLS0tLS1cbiMgaW5zcGlyZWQgYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9lcGVsaS91bmRlcnNjb3JlLnN0cmluZ10oKVxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdDYW1lbCBDYXNlJ1xuICBodW1hbml6ZTogKHN0cikgLT5cbiAgICB1bmNhbWVsaXplZCA9ICQudHJpbShzdHIpLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0rKS9nLCAnJDEgJDInKS50b0xvd2VyQ2FzZSgpXG4gICAgQHRpdGxlaXplKCB1bmNhbWVsaXplZCApXG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciB0byB1cHBlcmNhc2VcbiAgY2FwaXRhbGl6ZSA6IChzdHIpIC0+XG4gICAgICBzdHIgPSBpZiAhc3RyPyB0aGVuICcnIGVsc2UgU3RyaW5nKHN0cilcbiAgICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG5cblxuICAjIGNvbnZlcnQgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSB3b3JkIHRvIHVwcGVyY2FzZVxuICB0aXRsZWl6ZTogKHN0cikgLT5cbiAgICBpZiAhc3RyP1xuICAgICAgJydcbiAgICBlbHNlXG4gICAgICBTdHJpbmcoc3RyKS5yZXBsYWNlIC8oPzpefFxccylcXFMvZywgKGMpIC0+XG4gICAgICAgIGMudG9VcHBlckNhc2UoKVxuXG5cbiAgIyBjb252ZXJ0ICdjYW1lbENhc2UnIHRvICdjYW1lbC1jYXNlJ1xuICBzbmFrZUNhc2U6IChzdHIpIC0+XG4gICAgJC50cmltKHN0cikucmVwbGFjZSgvKFtBLVpdKS9nLCAnLSQxJykucmVwbGFjZSgvWy1fXFxzXSsvZywgJy0nKS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIHByZXBlbmQgYSBwcmVmaXggdG8gYSBzdHJpbmcgaWYgaXQgaXMgbm90IGFscmVhZHkgcHJlc2VudFxuICBwcmVmaXg6IChwcmVmaXgsIHN0cmluZykgLT5cbiAgICBpZiBzdHJpbmcuaW5kZXhPZihwcmVmaXgpID09IDBcbiAgICAgIHN0cmluZ1xuICAgIGVsc2VcbiAgICAgIFwiXCIgKyBwcmVmaXggKyBzdHJpbmdcblxuXG4gICMgSlNPTi5zdHJpbmdpZnkgd2l0aCByZWFkYWJpbGl0eSBpbiBtaW5kXG4gICMgQHBhcmFtIG9iamVjdDogamF2YXNjcmlwdCBvYmplY3RcbiAgcmVhZGFibGVKc29uOiAob2JqKSAtPlxuICAgIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMikgIyBcIlxcdFwiXG5cblxuICBjYW1lbGl6ZTogKHN0cikgLT5cbiAgICAkLnRyaW0oc3RyKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSAtPlxuICAgICAgYy50b1VwcGVyQ2FzZSgpXG4gICAgKVxuXG4gIHRyaW06IChzdHIpIC0+XG4gICAgc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxuXG5cbiAgIyBFeHRyYWN0IG9ubHkgdGhlIHRleHQgZnJvbSBhbiBIVE1MIHN0cmluZ1xuICAjICc8ZGl2PkEgJmFtcDsgQjwvZGl2PicgLT4gJ0EgJiBCJ1xuICBleHRyYWN0VGV4dEZyb21IdG1sOiAoc3RyKSAtPlxuICAgIGRpdiA9ICQoJzxkaXY+JylbMF1cbiAgICBkaXYuaW5uZXJIVE1MID0gc3RyXG4gICAgZGl2LnRleHRDb250ZW50XG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuYXR0ciA9IGNvbmZpZy5hdHRyXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5ldmVudGluZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZXZlbnRpbmcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRWaWV3XG5cbiAgY29uc3RydWN0b3I6ICh7IEBtb2RlbCwgQCRodG1sLCBAZGlyZWN0aXZlcywgQGlzUmVhZE9ubHkgfSkgLT5cbiAgICBAJGVsZW0gPSBAJGh0bWxcbiAgICBAdGVtcGxhdGUgPSBAbW9kZWwudGVtcGxhdGVcbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gZmFsc2VcbiAgICBAd2FzQXR0YWNoZWRUb0RvbSA9ICQuQ2FsbGJhY2tzKCk7XG5cbiAgICB1bmxlc3MgQGlzUmVhZE9ubHlcbiAgICAgICMgYWRkIGF0dHJpYnV0ZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIGh0bWxcbiAgICAgIEAkaHRtbFxuICAgICAgICAuZGF0YSgnY29tcG9uZW50VmlldycsIHRoaXMpXG4gICAgICAgIC5hZGRDbGFzcyhjc3MuY29tcG9uZW50KVxuICAgICAgICAuYXR0cihhdHRyLnRlbXBsYXRlLCBAdGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIEByZW5kZXIoKVxuXG5cbiAgcmVuZGVyOiAobW9kZSkgLT5cbiAgICBAdXBkYXRlQ29udGVudCgpXG4gICAgQHVwZGF0ZUh0bWwoKVxuXG5cbiAgdXBkYXRlQ29udGVudDogLT5cbiAgICBAY29udGVudChAbW9kZWwuY29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ2NvbXBvbmVudFZpZXcnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ2NvbXBvbmVudFZpZXcnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3MuY29tcG9uZW50SGlnaGxpZ2h0KVxuICAgIEBzaG93T3B0aW9uYWxzKClcblxuXG4gIGFmdGVyQmx1cnJlZDogKCkgLT5cbiAgICBAJGh0bWwucmVtb3ZlQ2xhc3MoY3NzLmNvbXBvbmVudEhpZ2hsaWdodClcbiAgICBAaGlkZUVtcHR5T3B0aW9uYWxzKClcblxuXG4gICMgQHBhcmFtIGN1cnNvcjogdW5kZWZpbmVkLCAnc3RhcnQnLCAnZW5kJ1xuICBmb2N1czogKGN1cnNvcikgLT5cbiAgICBmaXJzdCA9IEBkaXJlY3RpdmVzLmVkaXRhYmxlP1swXS5lbGVtXG4gICAgJChmaXJzdCkuZm9jdXMoKVxuXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgQCRodG1sLmhhc0NsYXNzKGNzcy5jb21wb25lbnRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbnRlbnRcbiAgICAgIGRpcmVjdGl2ZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKVxuICAgICAgaWYgZGlyZWN0aXZlLmlzSW1hZ2VcbiAgICAgICAgaWYgZGlyZWN0aXZlLmJhc2U2NEltYWdlP1xuICAgICAgICAgIEBzZXQobmFtZSwgZGlyZWN0aXZlLmJhc2U2NEltYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSApXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXQobmFtZSwgdmFsdWUpXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBzZXRFZGl0YWJsZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBzZXRJbWFnZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQHNldEh0bWwobmFtZSwgdmFsdWUpXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQGdldEVkaXRhYmxlKG5hbWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAZ2V0SW1hZ2UobmFtZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGdldEh0bWwobmFtZSlcblxuXG4gIGdldEVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRFZGl0YWJsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBpZiBAaGFzRm9jdXMoKVxuXG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLnRvZ2dsZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyLCBCb29sZWFuKHZhbHVlKSlcbiAgICAkZWxlbS5hdHRyKGF0dHIucGxhY2Vob2xkZXIsIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcblxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG5cbiAgICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1hZ2VTZXJ2aWNlLnNldCgkZWxlbSwgdmFsdWUpXG5cbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBlbHNlXG4gICAgICBzZXRQbGFjZWhvbGRlciA9ICQucHJveHkoQHNldFBsYWNlaG9sZGVySW1hZ2UsIHRoaXMsICRlbGVtLCBuYW1lKVxuICAgICAgQGRlbGF5VW50aWxBdHRhY2hlZChuYW1lLCBzZXRQbGFjZWhvbGRlcikgIyB0b2RvOiByZXBsYWNlIHdpdGggQGFmdGVySW5zZXJ0ZWQgLT4gLi4uIChzb21ldGhpbmcgbGlrZSAkLkNhbGxiYWNrcygnb25jZSByZW1lbWJlcicpKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtLCBuYW1lKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcblxuICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgIGltYWdlU2VydmljZS5zZXQoJGVsZW0sIGNvbmZpZy5pbWFnZVBsYWNlaG9sZGVyKVxuXG5cbiAgc2V0U3R5bGU6IChuYW1lLCBjbGFzc05hbWUpIC0+XG4gICAgY2hhbmdlcyA9IEB0ZW1wbGF0ZS5zdHlsZXNbbmFtZV0uY3NzQ2xhc3NDaGFuZ2VzKGNsYXNzTmFtZSlcbiAgICBpZiBjaGFuZ2VzLnJlbW92ZVxuICAgICAgZm9yIHJlbW92ZUNsYXNzIGluIGNoYW5nZXMucmVtb3ZlXG4gICAgICAgIEAkaHRtbC5yZW1vdmVDbGFzcyhyZW1vdmVDbGFzcylcblxuICAgIEAkaHRtbC5hZGRDbGFzcyhjaGFuZ2VzLmFkZClcblxuXG4gICMgRGlzYWJsZSB0YWJiaW5nIGZvciB0aGUgY2hpbGRyZW4gb2YgYW4gZWxlbWVudC5cbiAgIyBUaGlzIGlzIHVzZWQgZm9yIGh0bWwgY29udGVudCBzbyBpdCBkb2VzIG5vdCBkaXNydXB0IHRoZSB1c2VyXG4gICMgZXhwZXJpZW5jZS4gVGhlIHRpbWVvdXQgaXMgdXNlZCBmb3IgY2FzZXMgbGlrZSB0d2VldHMgd2hlcmUgdGhlXG4gICMgaWZyYW1lIGlzIGdlbmVyYXRlZCBieSBhIHNjcmlwdCB3aXRoIGEgZGVsYXkuXG4gIGRpc2FibGVUYWJiaW5nOiAoJGVsZW0pIC0+XG4gICAgc2V0VGltZW91dCggPT5cbiAgICAgICRlbGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAsIDQwMClcblxuXG4gICMgQXBwZW5kIGEgY2hpbGQgdG8gdGhlIGVsZW1lbnQgd2hpY2ggd2lsbCBibG9jayB1c2VyIGludGVyYWN0aW9uXG4gICMgbGlrZSBjbGljayBvciB0b3VjaCBldmVudHMuIEFsc28gdHJ5IHRvIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBnZXR0aW5nXG4gICMgZm9jdXMgb24gYSBjaGlsZCBlbGVtbnQgdGhyb3VnaCB0YWJiaW5nLlxuICBibG9ja0ludGVyYWN0aW9uOiAoJGVsZW0pIC0+XG4gICAgQGVuc3VyZVJlbGF0aXZlUG9zaXRpb24oJGVsZW0pXG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmludGVyYWN0aW9uQmxvY2tlciB9Jz5cIilcbiAgICAgIC5hdHRyKCdzdHlsZScsICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgYm90dG9tOiAwOyBsZWZ0OiAwOyByaWdodDogMDsnKVxuICAgICRlbGVtLmFwcGVuZCgkYmxvY2tlcilcblxuICAgIEBkaXNhYmxlVGFiYmluZygkZWxlbSlcblxuXG4gICMgTWFrZSBzdXJlIHRoYXQgYWxsIGFic29sdXRlIHBvc2l0aW9uZWQgY2hpbGRyZW4gYXJlIHBvc2l0aW9uZWRcbiAgIyByZWxhdGl2ZSB0byAkZWxlbS5cbiAgZW5zdXJlUmVsYXRpdmVQb3NpdGlvbjogKCRlbGVtKSAtPlxuICAgIHBvc2l0aW9uID0gJGVsZW0uY3NzKCdwb3NpdGlvbicpXG4gICAgaWYgcG9zaXRpb24gIT0gJ2Fic29sdXRlJyAmJiBwb3NpdGlvbiAhPSAnZml4ZWQnICYmIHBvc2l0aW9uICE9ICdyZWxhdGl2ZSdcbiAgICAgICRlbGVtLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuXG5cbiAgZ2V0JGNvbnRhaW5lcjogLT5cbiAgICAkKGRvbS5maW5kQ29udGFpbmVyKEAkaHRtbFswXSkubm9kZSlcblxuXG4gICMgV2FpdCB0byBleGVjdXRlIGEgbWV0aG9kIHVudGlsIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBET01cbiAgZGVsYXlVbnRpbEF0dGFjaGVkOiAobmFtZSwgZnVuYykgLT5cbiAgICBpZiBAaXNBdHRhY2hlZFRvRG9tXG4gICAgICBmdW5jKClcbiAgICBlbHNlXG4gICAgICBAY2FuY2VsRGVsYXllZChuYW1lKVxuICAgICAgQGRlbGF5ZWQgfHw9IHt9XG4gICAgICBAZGVsYXllZFtuYW1lXSA9IGV2ZW50aW5nLmNhbGxPbmNlIEB3YXNBdHRhY2hlZFRvRG9tLCA9PlxuICAgICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgICBmdW5jKClcblxuXG4gIGNhbmNlbERlbGF5ZWQ6IChuYW1lKSAtPlxuICAgIGlmIEBkZWxheWVkP1tuYW1lXVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20ucmVtb3ZlKEBkZWxheWVkW25hbWVdKVxuICAgICAgQGRlbGF5ZWRbbmFtZV0gPSB1bmRlZmluZWRcblxuXG4gIHN0cmlwSHRtbElmUmVhZE9ubHk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNSZWFkT25seVxuXG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoQCRodG1sWzBdKVxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBAc3RyaXBEb2NDbGFzc2VzKGVsZW0pXG4gICAgICBAc3RyaXBEb2NBdHRyaWJ1dGVzKGVsZW0pXG4gICAgICBAc3RyaXBFbXB0eUF0dHJpYnV0ZXMoZWxlbSlcblxuXG4gIHN0cmlwRG9jQ2xhc3NlczogKGVsZW0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZm9yIGtsYXNzIGluIGVsZW0uY2xhc3NOYW1lLnNwbGl0KC9cXHMrLylcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGtsYXNzKSBpZiAvZG9jXFwtLiovaS50ZXN0KGtsYXNzKVxuXG5cbiAgc3RyaXBEb2NBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3IgYXR0cmlidXRlIGluIEFycmF5OjpzbGljZS5hcHBseShlbGVtLmF0dHJpYnV0ZXMpXG4gICAgICBuYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICRlbGVtLnJlbW92ZUF0dHIobmFtZSkgaWYgL2RhdGFcXC1kb2NcXC0uKi9pLnRlc3QobmFtZSlcblxuXG4gIHN0cmlwRW1wdHlBdHRyaWJ1dGVzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBzdHJpcHBhYmxlQXR0cmlidXRlcyA9IFsnc3R5bGUnLCAnY2xhc3MnXVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSA9IHN0cmlwcGFibGVBdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlLm5hbWUpID49IDBcbiAgICAgIGlzRW1wdHlBdHRyaWJ1dGUgPSBhdHRyaWJ1dGUudmFsdWUudHJpbSgpID09ICcnXG4gICAgICBpZiBpc1N0cmlwcGFibGVBdHRyaWJ1dGUgYW5kIGlzRW1wdHlBdHRyaWJ1dGVcbiAgICAgICAgJGVsZW0ucmVtb3ZlQXR0cihhdHRyaWJ1dGUubmFtZSlcblxuXG4gIHNldEF0dGFjaGVkVG9Eb206IChuZXdWYWwpIC0+XG4gICAgcmV0dXJuIGlmIG5ld1ZhbCA9PSBAaXNBdHRhY2hlZFRvRG9tXG5cbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gbmV3VmFsXG5cbiAgICBpZiBuZXdWYWxcbiAgICAgIEByZXNldERpcmVjdGl2ZXMoKVxuICAgICAgQHdhc0F0dGFjaGVkVG9Eb20uZmlyZSgpXG5cblxuICBnZXRPd25lcldpbmRvdzogLT5cbiAgICBAJGVsZW1bMF0ub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5EZXBlbmRlbmN5ID0gcmVxdWlyZSgnLi9kZXBlbmRlbmN5JylcbmRlcGVuZGVuY2llc1RvSHRtbCA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzX3RvX2h0bWwnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlcGVuZGVuY2llc1xuXG4gICMgQHBhcmFtIHtDb21wb25lbnRUcmVlfSBvcHRpb25hbC4gUmVxdWlyZWQgaWYgeW91IHdhbnQgdG9cbiAgIyAgIHRyYWNrIHdoaWNoIGNvbXBvbmVudHMgdXNlIGEgZGVwZW5kZW5jeS5cbiAgIyBAcGFyYW0ge1N0cmluZ30gb3B0aW9uYWwuIFByZWZpeCByZWxhdGl2ZSB1cmxzIHdpdGggdGhpcyBzdHJpbmdcbiAgIyAgICh0aGUgc3RyaW5nIHNob3VsZCBub3QgaGF2ZSBhIHNsYXNoIGF0IHRoZSBlbmQpLlxuICAjIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9uYWwuIFdoZXRoZXIgdG8gYWxsb3cgcmVsYXRpdmUgdXJscyBvciBub3QuXG4gICMgICBEZWZhdWx0cyB0byBmYWxzZS5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnRUcmVlLCBAcHJlZml4LCBhbGxvd1JlbGF0aXZlVXJscyB9PXt9KSAtPlxuICAgIEBhbGxvd1JlbGF0aXZlVXJscyA9IGlmIEBwcmVmaXggdGhlbiB0cnVlIGVsc2UgYWxsb3dSZWxhdGl2ZVVybHMgfHwgZmFsc2VcbiAgICBAcHJlZml4ID89ICcnXG5cbiAgICBAanMgPSBbXVxuICAgIEBjc3MgPSBbXVxuICAgIEBuYW1lc3BhY2VzID0ge31cblxuICAgIEBkZXBlbmRlbmN5QWRkZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGRlcGVuZGVuY3lSZW1vdmVkID0gJC5DYWxsYmFja3MoKVxuXG4gICAgaWYgQGNvbXBvbmVudFRyZWU/XG4gICAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRSZW1vdmVkLmFkZChAb25Db21wb25lbnRSZW1vdmVkKVxuXG5cbiAgIyBBZGQgYSBkZXBlbmRlbmN5XG4gIGFkZDogKG9iaikgLT5cbiAgICBAY29udmVydFRvQWJzb2x1dGVQYXRocyhvYmopXG4gICAgZGVwID0gbmV3IERlcGVuZGVuY3kob2JqKVxuICAgIGlmIGV4aXN0aW5nID0gQGdldEV4aXN0aW5nKGRlcClcbiAgICAgIGV4aXN0aW5nLmFkZENvbXBvbmVudChjb21wb25lbnQpIGlmIGNvbXBvbmVudD9cbiAgICBlbHNlXG4gICAgICBAYWRkRGVwZW5kZW5jeShkZXApXG5cblxuICBhZGRKczogKG9iaikgLT5cbiAgICBvYmoudHlwZSA9ICdqcydcbiAgICBAYWRkKG9iailcblxuXG4gIGFkZENzczogKG9iaikgLT5cbiAgICBvYmoudHlwZSA9ICdjc3MnXG4gICAgQGFkZChvYmopXG5cblxuICAjIEFic29sdXRlIHBhdGhzOlxuICAjIC8vXG4gICMgL1xuICAjIGh0dHA6Ly9nb29nbGUuY29tXG4gICMgaHR0cHM6Ly9nb29nbGUuY29tXG4gICNcbiAgIyBFdmVyeXRoaW5nIGVsc2UgaXMgcHJlZml4ZWQgaWYgYSBwcmVmaXggaXMgcHJvdmlkZWQuXG4gICMgVG8gZXhwbGljaXRseSBwYXNzIGEgcmVsYXRpdmUgVVJMIHN0YXJ0IGl0IHdpdGggJy4vJ1xuICBjb252ZXJ0VG9BYnNvbHV0ZVBhdGhzOiAob2JqKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgb2JqLnNyY1xuICAgIHNyYyA9IG9iai5zcmNcblxuICAgIGlmIG5vdCBAaXNBYnNvbHV0ZVVybChzcmMpXG4gICAgICBhc3NlcnQgQGFsbG93UmVsYXRpdmVVcmxzLCBcIkRlcGVuZGVuY2llczogcmVsYXRpdmUgdXJscyBhcmUgbm90IGFsbG93ZWQ6ICN7IHNyYyB9XCJcbiAgICAgIHNyYyA9IHNyYy5yZXBsYWNlKC9eW1xcLlxcL10qLywgJycpXG4gICAgICBvYmouc3JjID0gXCIjeyBAcHJlZml4IH0vI3sgc3JjIH1cIlxuXG5cbiAgaXNBYnNvbHV0ZVVybDogKHNyYykgLT5cbiAgICAjIFVSTHMgYXJlIGFic29sdXRlIHdoZW4gdGhleSBjb250YWluIHR3byBgLy9gIG9yIGJlZ2luIHdpdGggYSBgL2BcbiAgICAvKF5cXC9cXC98W2Etel0qOlxcL1xcLykvLnRlc3Qoc3JjKSB8fCAvXlxcLy8udGVzdChzcmMpXG5cblxuICBhZGREZXBlbmRlbmN5OiAoZGVwZW5kZW5jeSkgLT5cbiAgICBAYWRkVG9OYW1lc3BhY2UoZGVwZW5kZW5jeSkgaWYgZGVwZW5kZW5jeS5uYW1lc3BhY2VcblxuICAgIGNvbGxlY3Rpb24gPSBpZiBkZXBlbmRlbmN5LmlzSnMoKSB0aGVuIEBqcyBlbHNlIEBjc3NcbiAgICBjb2xsZWN0aW9uLnB1c2goZGVwZW5kZW5jeSlcblxuICAgIEBkZXBlbmRlbmN5QWRkZWQuZmlyZShkZXBlbmRlbmN5KVxuXG4gICAgZGVwZW5kZW5jeVxuXG5cbiAgIyBOYW1lc3BhY2VzXG4gICMgLS0tLS0tLS0tLVxuXG4gIGFkZFRvTmFtZXNwYWNlOiAoZGVwZW5kZW5jeSkgLT5cbiAgICBpZiBkZXBlbmRlbmN5Lm5hbWVzcGFjZVxuICAgICAgQG5hbWVzcGFjZXNbZGVwZW5kZW5jeS5uYW1lc3BhY2VdID89IFtdXG4gICAgICBuYW1lc3BhY2UgPSBAbmFtZXNwYWNlc1tkZXBlbmRlbmN5Lm5hbWVzcGFjZV1cbiAgICAgIG5hbWVzcGFjZS5wdXNoKGRlcGVuZGVuY3kpXG5cblxuICByZW1vdmVGcm9tTmFtZXNwYWNlOiAoZGVwZW5kZW5jeSkgLT5cbiAgICBpZiBuYW1lc3BhY2UgPSBAZ2V0TmFtZXNwYWNlKGRlcGVuZGVuY3kubmFtZXNwYWNlKVxuICAgICAgaW5kZXggPSBuYW1lc3BhY2UuaW5kZXhPZihkZXBlbmRlbmN5KVxuICAgICAgbmFtZXNwYWNlLnNwbGljZShpbmRleCwgMSkgaWYgaW5kZXggPiAtMVxuXG5cbiAgZ2V0TmFtZXNwYWNlczogLT5cbiAgICBmb3IgbmFtZSwgYXJyYXkgb2YgQG5hbWVzcGFjZXNcbiAgICAgIG5hbWVcblxuXG4gIGdldE5hbWVzcGFjZTogKG5hbWUpIC0+XG4gICAgbmFtZXNwYWNlID0gQG5hbWVzcGFjZXNbbmFtZV1cbiAgICBpZiBuYW1lc3BhY2U/Lmxlbmd0aCB0aGVuIG5hbWVzcGFjZSBlbHNlIHVuZGVmaW5lZFxuXG5cbiAgZ2V0RXhpc3Rpbmc6IChkZXApIC0+XG4gICAgY29sbGVjdGlvbiA9IGlmIGRlcC5pc0pzKCkgdGhlbiBAanMgZWxzZSBAY3NzXG4gICAgZm9yIGVudHJ5IGluIGNvbGxlY3Rpb25cbiAgICAgIHJldHVybiBlbnRyeSBpZiBlbnRyeS5pc1NhbWVBcyhkZXApXG5cbiAgICB1bmRlZmluZWRcblxuXG4gIGhhc0NzczogLT5cbiAgICBAY3NzLmxlbmd0aCA+IDBcblxuXG4gIGhhc0pzOiAtPlxuICAgIEBqcy5sZW5ndGggPiAwXG5cblxuICBvbkNvbXBvbmVudFJlbW92ZWQ6IChjb21wb25lbnQpID0+XG4gICAgdG9CZVJlbW92ZWQgPSBbXVxuICAgIGZvciBkZXBlbmRlbmN5IGluIEBqc1xuICAgICAgbmVlZGVkID0gZGVwZW5kZW5jeS5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgdG9CZVJlbW92ZWQucHVzaChkZXBlbmRlbmN5KSBpZiBub3QgbmVlZGVkXG5cbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBAY3NzXG4gICAgICBuZWVkZWQgPSBkZXBlbmRlbmN5LnJlbW92ZUNvbXBvbmVudChjb21wb25lbnQpXG4gICAgICB0b0JlUmVtb3ZlZC5wdXNoKGRlcGVuZGVuY3kpIGlmIG5vdCBuZWVkZWRcblxuICAgIGZvciBkZXBlbmRlbmN5IGluIHRvQmVSZW1vdmVkXG4gICAgICBAcmVtb3ZlRGVwZW5kZW5jeShkZXBlbmRlbmN5KVxuXG5cbiAgcmVtb3ZlRGVwZW5kZW5jeTogKGRlcGVuZGVuY3kpIC0+XG4gICAgQHJlbW92ZUZyb21OYW1lc3BhY2UoZGVwZW5kZW5jeSkgaWYgZGVwZW5kZW5jeS5uYW1lc3BhY2VcbiAgICBjb2xsZWN0aW9uID0gaWYgZGVwZW5kZW5jeS5pc0pzKCkgdGhlbiBAanMgZWxzZSBAY3NzXG4gICAgaW5kZXggPSBjb2xsZWN0aW9uLmluZGV4T2YoZGVwZW5kZW5jeSlcbiAgICBjb2xsZWN0aW9uLnNwbGljZShpbmRleCwgMSkgaWYgaW5kZXggPiAtMVxuXG4gICAgQGRlcGVuZGVuY3lSZW1vdmVkLmZpcmUoZGVwZW5kZW5jeSlcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkYXRhID0ge31cbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBAanNcbiAgICAgIGRhdGFbJ2pzJ10gPz0gW11cbiAgICAgIGRhdGFbJ2pzJ10ucHVzaCggZGVwZW5kZW5jeS5zZXJpYWxpemUoKSApXG5cbiAgICBmb3IgZGVwZW5kZW5jeSBpbiBAY3NzXG4gICAgICBkYXRhWydjc3MnXSA/PSBbXVxuICAgICAgZGF0YVsnY3NzJ10ucHVzaCggZGVwZW5kZW5jeS5zZXJpYWxpemUoKSApXG5cbiAgICBkYXRhXG5cblxuICBkZXNlcmlhbGl6ZTogKGRhdGEpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBkYXRhP1xuXG4gICAgIyBqc1xuICAgIGZvciBlbnRyeSBpbiBkYXRhLmpzIHx8IFtdXG4gICAgICBvYmogPVxuICAgICAgICB0eXBlOiAnanMnXG4gICAgICAgIHNyYzogZW50cnkuc3JjXG4gICAgICAgIGNvZGU6IGVudHJ5LmNvZGVcbiAgICAgICAgbmFtZXNwYWNlOiBlbnRyeS5uYW1lc3BhY2VcbiAgICAgICAgbmFtZTogZW50cnkubmFtZVxuXG4gICAgICBAYWRkRGVzZXJpYWx6ZWRPYmoob2JqLCBlbnRyeSlcblxuICAgICMgY3NzXG4gICAgZm9yIGVudHJ5IGluIGRhdGEuY3NzIHx8IFtdXG4gICAgICBvYmogPVxuICAgICAgICB0eXBlOiAnY3NzJ1xuICAgICAgICBzcmM6IGVudHJ5LnNyY1xuICAgICAgICBjb2RlOiBlbnRyeS5jb2RlXG4gICAgICAgIG5hbWVzcGFjZTogZW50cnkubmFtZXNwYWNlXG4gICAgICAgIG5hbWU6IGVudHJ5Lm5hbWVcblxuICAgICAgQGFkZERlc2VyaWFsemVkT2JqKG9iaiwgZW50cnkpXG5cblxuICBhZGREZXNlcmlhbHplZE9iajogKG9iaiwgZW50cnkpIC0+XG4gICAgaWYgZW50cnkuY29tcG9uZW50SWRzPy5sZW5ndGhcbiAgICAgIGNvbXBvbmVudHMgPSBbXVxuICAgICAgZm9yIGlkIGluIGVudHJ5LmNvbXBvbmVudElkc1xuICAgICAgICBjb21wb25lbnQgPSBAY29tcG9uZW50VHJlZS5maW5kQnlJZChpZClcbiAgICAgICAgY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuXG4gICAgICAjIG9ubHkgYWRkIHRoZSBkZXBlbmRlbmN5IGlmIHRoZXJlIGFyZSBzdGlsbCBjb21wb25lbnRzXG4gICAgICAjIGRlcGVuZGluZyBvbiBpdFxuICAgICAgaWYgY29tcG9uZW50cy5sZW5ndGhcbiAgICAgICAgZGVwZW5kZW5jeSA9IEBhZGQob2JqKVxuICAgICAgICBmb3IgY29tcG9uZW50IGluIGNvbXBvbmVudHNcbiAgICAgICAgICBkZXBlbmRlbmN5LmFkZENvbXBvbmVudChjb21wb25lbnQpXG4gICAgICBlbHNlXG4gICAgICAgIGxvZy53YXJuKCdEcm9wcGVkIGRlcGVuZGVuY3k6IGNvdWxkIG5vdCBmaW5kIGNvbXBvbmVudHMgdGhhdCBkZXBlbmQgb24gaXQnLCBlbnRyeSlcbiAgICBlbHNlXG4gICAgICBAYWRkKG9iailcblxuXG4gIHByaW50SnM6IC0+XG4gICAgZGVwZW5kZW5jaWVzVG9IdG1sLnByaW50SnModGhpcylcblxuXG4gIHByaW50Q3NzOiAtPlxuICAgIGRlcGVuZGVuY2llc1RvSHRtbC5wcmludENzcyh0aGlzKVxuXG4iLCJKc0xvYWRlciA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvanNfbG9hZGVyJylcbkNzc0xvYWRlciA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvY3NzX2xvYWRlcicpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICBwcmludEpzOiAoZGVwZW5kZW5jaWVzKSAtPlxuICAgIGh0bWwgPSAnJ1xuICAgIGZvciBkZXBlbmRlbmN5IGluIGRlcGVuZGVuY2llcy5qc1xuICAgICAgaWYgZGVwZW5kZW5jeS5pbmxpbmVcbiAgICAgICAgaHRtbCArPSBAcHJpbnRJbmxpbmVTY3JpcHQoY29kZUJsb2NrOiBkZXBlbmRlbmN5LmNvZGUpXG4gICAgICBlbHNlXG4gICAgICAgIGh0bWwgKz0gQHByaW50U2NyaXB0VGFnKHNyYzogZGVwZW5kZW5jeS5zcmMpXG5cbiAgICAgIGh0bWwgKz0gJ1xcbidcblxuICAgIGh0bWxcblxuXG4gIHByaW50Q3NzOiAoZGVwZW5kZW5jaWVzKSAtPlxuICAgIGh0bWwgPSAnJ1xuICAgIGZvciBkZXBlbmRlbmN5IGluIGRlcGVuZGVuY2llcy5jc3NcbiAgICAgIGlmIGRlcGVuZGVuY3kuaW5saW5lXG4gICAgICAgIGh0bWwgKz0gQHByaW50SW5saW5lQ3NzKHN0eWxlczogZGVwZW5kZW5jeS5jb2RlKVxuICAgICAgZWxzZVxuICAgICAgICBodG1sICs9IEBwcmludENzc0xpbmsoc3JjOiBkZXBlbmRlbmN5LnNyYylcblxuICAgICAgaHRtbCArPSAnXFxuJ1xuXG4gICAgaHRtbFxuXG5cbiAgcHJpbnRTY3JpcHRUYWc6ICh7IHNyYyB9ICkgLT5cbiAgICBcIjxzY3JpcHQgc3JjPVxcXCIjeyBzcmMgfVxcXCI+PC9zY3JpcHQ+XCJcblxuXG4gIHByaW50SW5saW5lU2NyaXB0OiAoeyBjb2RlQmxvY2sgfSkgLT5cbiAgICBjb2RlQmxvY2sgPSBKc0xvYWRlci5wcm90b3R5cGUucHJlcGFyZUlubGluZUNvZGUoY29kZUJsb2NrKVxuXG4gICAgXCJcbiAgICA8c2NyaXB0PlxuICAgICAgI3sgY29kZUJsb2NrIH1cbiAgICA8L3NjcmlwdD5cbiAgICBcIlxuXG4gIHByaW50Q3NzTGluazogKHsgc3JjLCBoZWFkIH0pIC0+XG4gICAgaGVhZCA/PSB0cnVlXG4gICAgaWYgaGVhZFxuICAgICAgXCI8bGluayByZWw9XFxcInN0eWxlc2hlZXRcXFwiIHR5cGU9XFxcInRleHQvY3NzXFxcIiBocmVmPVxcXCIjeyBzcmMgfVxcXCI+XCJcbiAgICBlbHNlXG4gICAgICAjIExpbmsgdGFncyB3b3JrIGluIGJvZHkgYnV0IHRoaXMgaXMgbm90IHJlY29tbWVuZGVkLlxuICAgICAgIyBUaGV5IHNob3VsZCBvbmx5IGFwcGVhciBpbiB0aGUgPGhlYWQ+XG4gICAgICBcIjxsaW5rIHJlbD1cXFwic3R5bGVzaGVldFxcXCIgdHlwZT1cXFwidGV4dC9jc3NcXFwiIGhyZWY9XFxcIiN7IHNyYyB9XFxcIj5cIlxuXG5cbiAgcHJpbnRJbmxpbmVDc3M6ICh7IHN0eWxlcyB9KSAtPlxuICAgIHN0eWxlcyA9IENzc0xvYWRlci5wcm90b3R5cGUucHJlcGFyZUlubGluZVN0eWxlcyhzdHlsZXMpXG5cbiAgICBcIlxuICAgIDxzdHlsZT5cbiAgICAgICN7IHN0eWxlcyB9XG4gICAgPC9zdHlsZT5cbiAgICBcIlxuXG5cbiAgcHJpbnRDb21tZW50OiAodGV4dCkgLT5cbiAgICBcIjwhLS0gI3sgdGV4dCB9IC0tPlwiXG5cbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIERlcGVuZGVuY3lcblxuXG4gICMgQHBhcmFtIHtPYmplY3R9XG4gICMgICAtIHR5cGUge1N0cmluZ30gRWl0aGVyICdqcycgb3IgJ2NzcydcbiAgI1xuICAjICAgT25lIG9mIHRoZSBmb2xsb3dpbmcgbmVlZHMgdG8gYmUgcHJvdmlkZWQ6XG4gICMgICAtIHNyYyB7U3RyaW5nfSBVUkwgdG8gYSBqYXZhc2NyaXB0IG9yIGNzcyBmaWxlXG4gICMgICAtIGNvZGUge1N0cmluZ30gSlMgb3IgQ1NTIGNvZGVcbiAgI1xuICAjICAgQWxsIG9mIHRoZSBmb2xsb3dpbmcgYXJlIG9wdGlvbmFsOlxuICAjICAgLSBuYW1lc3BhY2Uge1N0cmluZ30gT3B0aW9uYWwuIEEgbmFtZSB0byBpZGVudGlmeSBhIGRlcGVuZGVuY3kgbW9yZSBlYXNpbHkuXG4gICMgICAtIG5hbWVzcGFjZSB7U3RyaW5nfSBPcHRpb25hbC4gQSBOYW1lc3BhY2UgdG8gZ3JvdXAgZGVwZW5kZW5jaWVzIHRvZ2V0aGVyLlxuICAjICAgLSBjb21wb25lbnQge0NvbXBvbmVudE1vZGVsfSBUaGUgY29tcG9uZW50TW9kZWwgdGhhdCBpcyBkZXBlbmRpbmcgb24gdGhpcyByZXNvdXJjZVxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIEBuYW1lc3BhY2UsIEBzcmMsIEBjb2RlLCBAdHlwZSwgY29tcG9uZW50IH0pIC0+XG4gICAgYXNzZXJ0IEBzcmMgfHwgQGNvZGUsICdEZXBlbmRlbmN5OiBObyBcInNyY1wiIG9yIFwiY29kZVwiIHBhcmFtIHByb3ZpZGVkJ1xuICAgIGFzc2VydCBub3QgKEBzcmMgJiYgQGNvZGUpLCAnRGVwZW5kZW5jeTogT25seSBwcm92aWRlIG9uZSBvZiBcInNyY1wiIG9yIFwiY29kZVwiIHBhcmFtcydcbiAgICBhc3NlcnQgQHR5cGUsIFwiRGVwZW5kZW5jeTogUGFyYW0gdHlwZSBtdXN0IGJlIHNwZWNpZmllZFwiXG4gICAgYXNzZXJ0IEB0eXBlIGluIFsnanMnLCAnY3NzJ10sIFwiRGVwZW5kZW5jeTogVW5yZWNvZ25pemVkIHR5cGU6ICN7IEB0eXBlIH1cIlxuXG4gICAgQGlubGluZSA9IHRydWUgaWYgQGNvZGU/XG5cbiAgICBAY29tcG9uZW50cyA9IHt9ICMgY29tcG9uZW50cyB3aGljaCBkZXBlbmQgdXBvbiB0aGlzIHJlc291cmNlXG4gICAgQGNvbXBvbmVudENvdW50ID0gMFxuICAgIEBhZGRDb21wb25lbnQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG5cblxuICBpc0pzOiAtPlxuICAgIEB0eXBlID09ICdqcydcblxuXG4gIGlzQ3NzOiAtPlxuICAgIEB0eXBlID09ICdjc3MnXG5cblxuICAjIENoZWNrIGlmIHRoaXMgaXMgYSBkZXBlbmRlbmN5IG9mIGEgY2VydGFpbiBjb21wb25lbnRcbiAgaGFzQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIEBjb21wb25lbnRzW2NvbXBvbmVudC5pZF0/XG5cblxuICBhZGRDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgaWYgbm90IEBoYXNDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgQGNvbXBvbmVudENvdW50ICs9IDFcbiAgICAgIEBjb21wb25lbnRzW2NvbXBvbmVudC5pZF0gPSB0cnVlXG5cblxuICAjIFJlbW92ZSBhIGNvbXBvbmVudCBmcm9tIHRoaXMgZGVwZW5kZW5jeS5cbiAgIyBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIHRoZXJlIGFyZSBzdGlsbCBjb21wb25lbnRzXG4gICMgICBkZXBlbmRpbmcgb24gdGhpcyBkZXBlbmRlbmN5LCBvdGhlcndpc2UgZmFsc2VcbiAgcmVtb3ZlQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIGlmIEBoYXNDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgQGNvbXBvbmVudENvdW50IC09IDFcbiAgICAgIEBjb21wb25lbnRzW2NvbXBvbmVudC5pZF0gPSB1bmRlZmluZWRcblxuICAgIEBjb21wb25lbnRDb3VudCAhPSAwXG5cblxuICBpc1NhbWVBczogKG90aGVyRGVwZW5kZW5jeSkgLT5cbiAgICByZXR1cm4gZmFsc2UgaWYgQHR5cGUgIT0gb3RoZXJEZXBlbmRlbmN5LnR5cGVcbiAgICByZXR1cm4gZmFsc2UgaWYgQG5hbWVzcGFjZSAhPSBvdGhlckRlcGVuZGVuY3kubmFtZXNwYWNlXG5cbiAgICBpZiBvdGhlckRlcGVuZGVuY3kuc3JjXG4gICAgICBAc3JjID09IG90aGVyRGVwZW5kZW5jeS5zcmNcbiAgICBlbHNlXG4gICAgICBAY29kZSA9PSBvdGhlckRlcGVuZGVuY3kuY29kZVxuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIG9iaiA9IHt9XG5cbiAgICBmb3Iga2V5IGluIFsnc3JjJywgJ2NvZGUnLCAnaW5saW5lJywgJ25hbWUnLCAnbmFtZXNwYWNlJ11cbiAgICAgIG9ialtrZXldID0gdGhpc1trZXldIGlmIHRoaXNba2V5XT9cblxuICAgIGZvciBjb21wb25lbnRJZCBvZiBAY29tcG9uZW50c1xuICAgICAgb2JqLmNvbXBvbmVudElkcyA/PSBbXVxuICAgICAgb2JqLmNvbXBvbmVudElkcy5wdXNoKGNvbXBvbmVudElkKVxuXG4gICAgb2JqXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH1cbiAgIyAtIGNvbXBvbmVudFRyZWUgeyBDb21wb25lbnRUcmVlIH1cbiAgIyAtIHJlbmRlcmluZ0NvbnRhaW5lciB7IFJlbmRlcmluZ0NvbnRhaW5lciB9XG4gICMgLSAkd3JhcHBlciB7IGpRdWVyeSBvYmplY3QgfSBBIHdyYXBwZXIgd2l0aCBhIG5vZGUgd2l0aCBhICdkb2Mtc2VjdGlvbicgY3NzIGNsYXNzIHdoZXJlIHRvIGluc2VydCB0aGUgY29udGVudC5cbiAgIyAtIGV4Y2x1ZGVDb21wb25lbnRzIHsgU3RyaW5nIG9yIEFycmF5IH0gY29tcG9uZW50TW9kZWwuaWQgb3IgYW4gYXJyYXkgb2Ygc3VjaC5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciwgZXhjbHVkZUNvbXBvbmVudHMgfSkgLT5cbiAgICBhc3NlcnQgQGNvbXBvbmVudFRyZWUsICdubyBjb21wb25lbnRUcmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQGNvbXBvbmVudFZpZXdzID0ge31cblxuICAgIEBleGNsdWRlZENvbXBvbmVudElkcyA9IHt9XG4gICAgQGV4Y2x1ZGVDb21wb25lbnQoZXhjbHVkZUNvbXBvbmVudHMpXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSB9IGNvbXBvbmVudE1vZGVsLmlkIG9yIGFuIGFycmF5IG9mIHN1Y2guXG4gIGV4Y2x1ZGVDb21wb25lbnQ6IChjb21wb25lbnRJZCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudElkP1xuICAgIGlmICQuaXNBcnJheShjb21wb25lbnRJZClcbiAgICAgIGZvciBjb21wSWQgaW4gY29tcG9uZW50SWRcbiAgICAgICAgQGV4Y2x1ZGVDb21wb25lbnQoY29tcElkKVxuICAgIGVsc2VcbiAgICAgIEBleGNsdWRlZENvbXBvbmVudElkc1tjb21wb25lbnRJZF0gPSB0cnVlXG4gICAgICB2aWV3ID0gQGNvbXBvbmVudFZpZXdzW2NvbXBvbmVudElkXVxuICAgICAgaWYgdmlldz8gYW5kIHZpZXcuaXNBdHRhY2hlZFRvRG9tXG4gICAgICAgIEByZW1vdmVDb21wb25lbnQodmlldy5tb2RlbClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBjb21wb25lbnRUcmVlXG4gICAgQCRyb290LmRhdGEoJ2NvbXBvbmVudFRyZWUnLCBAY29tcG9uZW50VHJlZSlcblxuXG4gIHJlbmRlck9uY2VQYWdlUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmluY3JlbWVudCgpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5yZWFkeSA9PlxuICAgICAgQHNldFJvb3QoKVxuICAgICAgQHJlbmRlcigpXG4gICAgICBAc2V0dXBDb21wb25lbnRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBDb21wb25lbnRUcmVlIEV2ZW50IEhhbmRsaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwQ29tcG9uZW50VHJlZUxpc3RlbmVyczogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRBZGRlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudEFkZGVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50UmVtb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudFJlbW92ZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRNb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudE1vdmVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAY29tcG9uZW50SHRtbENoYW5nZWQsIHRoaXMpIClcblxuXG4gIGNvbXBvbmVudEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNvbXBvbmVudFJlbW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRDb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY29tcG9uZW50TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBpbnNlcnRDb21wb25lbnQobW9kZWwpXG5cblxuICBjb21wb25lbnRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS51cGRhdGVDb250ZW50KClcblxuXG4gIGNvbXBvbmVudEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnVwZGF0ZUh0bWwoKVxuXG5cbiAgIyBSZW5kZXJpbmdcbiAgIyAtLS0tLS0tLS1cblxuICBnZXRDb21wb25lbnRWaWV3QnlJZDogKGNvbXBvbmVudElkKSAtPlxuICAgIEBjb21wb25lbnRWaWV3c1tjb21wb25lbnRJZF1cblxuXG4gIGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld3NbbW9kZWwuaWRdIHx8PSBtb2RlbC5jcmVhdGVWaWV3KEByZW5kZXJpbmdDb250YWluZXIuaXNSZWFkT25seSlcblxuXG4gIGRlbGV0ZUNhY2hlZENvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQGNvbXBvbmVudFZpZXdzW21vZGVsLmlkXVxuXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICByZXR1cm4gaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwpIHx8IEBleGNsdWRlZENvbXBvbmVudElkc1ttb2RlbC5pZF0gPT0gdHJ1ZVxuXG4gICAgaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc0NvbXBvbmVudEF0dGFjaGVkKG1vZGVsLm5leHQpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdDb21wb25lbnQgY291bGQgbm90IGJlIGluc2VydGVkIGJ5IHJlbmRlcmVyLicpXG5cbiAgICBjb21wb25lbnRWaWV3ID0gQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpXG4gICAgY29tcG9uZW50Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5jb21wb25lbnRWaWV3V2FzSW5zZXJ0ZWQoY29tcG9uZW50VmlldylcbiAgICBAYXR0YWNoQ2hpbGRDb21wb25lbnRzKG1vZGVsKVxuXG5cbiAgaXNDb21wb25lbnRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkQ29tcG9uZW50czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc0NvbXBvbmVudEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRDb21wb25lbnQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydENvbXBvbmVudEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JDb21wb25lbnQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpKVxuXG5cbiAgYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChjb250YWluZXIucGFyZW50Q29tcG9uZW50KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yQ29tcG9uZW50KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBsaXZpbmdkb2MsIEBwYXJlbnQpIC0+XG4gICAgQHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIEBpc0ludGVyYWN0aXZlID0gZmFsc2VcblxuXG4gICMgQXZhaWxhYmxlIE9wdGlvbnM6XG4gICMgUmVhZE9ubHkgdmlldzogKGRlZmF1bHQgaWYgbm90aGluZyBpcyBzcGVjaWZpZWQpXG4gICMgY3JlYXRlKHJlYWRPbmx5OiB0cnVlKVxuICAjXG4gICMgSW5lcmFjdGl2ZSB2aWV3OlxuICAjIGNyZWF0ZShpbnRlcmFjdGl2ZTogdHJ1ZSlcbiAgI1xuICAjIFdyYXBwZXI6IChET00gbm9kZSB0aGF0IGhhcyB0byBjb250YWluIGEgbm9kZSB3aXRoIGNsYXNzICcuZG9jLXNlY3Rpb24nKVxuICAjIGNyZWF0ZSggJHdyYXBwZXI6ICQoJzxzZWN0aW9uIGNsYXNzPVwiY29udGFpbmVyIGRvYy1zZWN0aW9uXCI+JykgKVxuICBjcmVhdGU6IChvcHRpb25zKSAtPlxuICAgIEBjcmVhdGVJRnJhbWUoQHBhcmVudCkudGhlbiAoaWZyYW1lLCByZW5kZXJOb2RlKSA9PlxuICAgICAgQGlmcmFtZSA9IGlmcmFtZVxuICAgICAgQHJlbmRlcmVyID0gQGNyZWF0ZUlGcmFtZVJlbmRlcmVyKGlmcmFtZSwgb3B0aW9ucylcbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogQHJlbmRlcmVyXG5cblxuICBjcmVhdGVJRnJhbWU6IChwYXJlbnQpIC0+XG4gICAgZGVmZXJyZWQgPSAkLkRlZmVycmVkKClcblxuICAgIGlmcmFtZSA9IHBhcmVudC5vd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpXG4gICAgaWZyYW1lLnNyYyA9ICdhYm91dDpibGFuaydcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJylcbiAgICBpZnJhbWUub25sb2FkID0gLT4gZGVmZXJyZWQucmVzb2x2ZShpZnJhbWUpXG5cbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoaWZyYW1lKVxuICAgIGRlZmVycmVkLnByb21pc2UoKVxuXG5cbiAgY3JlYXRlSUZyYW1lUmVuZGVyZXI6IChpZnJhbWUsIG9wdGlvbnMpIC0+XG4gICAgQGNyZWF0ZVJlbmRlcmVyXG4gICAgICByZW5kZXJOb2RlOiBpZnJhbWUuY29udGVudERvY3VtZW50LmJvZHlcbiAgICAgIG9wdGlvbnM6IG9wdGlvbnNcblxuXG4gIGNyZWF0ZVJlbmRlcmVyOiAoeyByZW5kZXJOb2RlLCBvcHRpb25zIH09e30pIC0+XG4gICAgcGFyYW1zID1cbiAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUgfHwgQHBhcmVudFxuICAgICAgZG9jdW1lbnREZXBlbmRlbmNpZXM6IEBsaXZpbmdkb2MuZGVwZW5kZW5jaWVzXG4gICAgICBkZXNpZ246IEBsaXZpbmdkb2MuZGVzaWduXG5cbiAgICBAcGFnZSA9IEBjcmVhdGVQYWdlKHBhcmFtcywgb3B0aW9ucylcblxuICAgIG5ldyBSZW5kZXJlclxuICAgICAgcmVuZGVyaW5nQ29udGFpbmVyOiBAcGFnZVxuICAgICAgY29tcG9uZW50VHJlZTogQGxpdmluZ2RvYy5jb21wb25lbnRUcmVlXG4gICAgICAkd3JhcHBlcjogb3B0aW9ucy4kd3JhcHBlclxuXG5cbiAgY3JlYXRlUGFnZTogKHBhcmFtcywgeyBpbnRlcmFjdGl2ZSwgcmVhZE9ubHksIGxvYWRSZXNvdXJjZXMgfT17fSkgLT5cbiAgICBwYXJhbXMgPz0ge31cbiAgICBwYXJhbXMubG9hZFJlc291cmNlcyA9IGxvYWRSZXNvdXJjZXNcbiAgICBpZiBpbnRlcmFjdGl2ZT9cbiAgICAgIEBpc0ludGVyYWN0aXZlID0gdHJ1ZVxuICAgICAgbmV3IEludGVyYWN0aXZlUGFnZShwYXJhbXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFBhZ2UocGFyYW1zKVxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbkpzTG9hZGVyID0gcmVxdWlyZSgnLi9qc19sb2FkZXInKVxuQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3NfbG9hZGVyJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBBc3NldHNcblxuICAjIEBwYXJhbSB7V2luZG93fVxuICAjIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9uYWwuIElmIHNldCB0byB0cnVlIG5vIGFzc2V0cyB3aWxsIGJlIGxvYWRlZC5cbiAgY29uc3RydWN0b3I6ICh7IEB3aW5kb3csIGRpc2FibGUgfSkgLT5cbiAgICBAaXNEaXNhYmxlZCA9IGRpc2FibGUgfHwgZmFsc2VcblxuICAgIEBjc3NMb2FkZXIgPSBuZXcgQ3NzTG9hZGVyKEB3aW5kb3cpXG4gICAgQGpzTG9hZGVyID0gbmV3IEpzTG9hZGVyKEB3aW5kb3cpXG5cblxuICBsb2FkRGVwZW5kZW5jaWVzOiAoZGVwZW5kZW5jaWVzLCBjYWxsYmFjaykgLT5cbiAgICBzZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKClcbiAgICBzZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4gICAgZm9yIGRlcCBpbiBkZXBlbmRlbmNpZXMuanNcbiAgICAgIEBsb2FkSnMoZGVwLCBzZW1hcGhvcmUud2FpdCgpKVxuXG4gICAgZm9yIGRlcCBpbiBkZXBlbmRlbmNpZXMuY3NzXG4gICAgICBAbG9hZENzcyhkZXAsIHNlbWFwaG9yZS53YWl0KCkpXG5cbiAgICBzZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgbG9hZERlcGVuZGVuY3k6IChkZXBlbmRlbmN5LCBjYWxsYmFjaykgLT5cbiAgICBpZiBkZXBlbmRlbmN5LmlzSnMoKVxuICAgICAgQGxvYWRKcyhkZXBlbmRlbmN5LCBjYWxsYmFjaylcbiAgICBlbHNlIGlmIGRlcGVuZGVuY3kuaXNDc3MoKVxuICAgICAgQGxvYWRDc3MoZGVwZW5kZW5jeSwgY2FsbGJhY2spXG5cblxuICBsb2FkSnM6IChkZXBlbmRlbmN5LCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soKSAgaWYgQGlzRGlzYWJsZWRcblxuICAgIGlmIGRlcGVuZGVuY3kuaW5saW5lXG4gICAgICBAanNMb2FkZXIubG9hZElubGluZVNjcmlwdChkZXBlbmRlbmN5LmNvZGUsIGNhbGxiYWNrKVxuICAgIGVsc2VcbiAgICAgIEBqc0xvYWRlci5sb2FkU2luZ2xlVXJsKGRlcGVuZGVuY3kuc3JjLCBjYWxsYmFjaylcblxuXG4gIGxvYWRDc3M6IChkZXBlbmRlbmN5LCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soKSAgaWYgQGlzRGlzYWJsZWRcblxuICAgIGlmIGRlcGVuZGVuY3kuaW5saW5lXG4gICAgICBAY3NzTG9hZGVyLmxvYWRJbmxpbmVTdHlsZXMoZGVwZW5kZW5jeS5jb2RlLCBjYWxsYmFjaylcbiAgICBlbHNlXG4gICAgICBAY3NzTG9hZGVyLmxvYWRTaW5nbGVVcmwoZGVwZW5kZW5jeS5zcmMsIGNhbGxiYWNrKVxuXG5cblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ3NzTG9hZGVyXG5cbiAgY29uc3RydWN0b3I6IChAd2luZG93KSAtPlxuICAgIEBsb2FkZWRVcmxzID0gW11cbiAgICBAbG9hZGVkSW5saW5lU3R5bGVzID0gW11cblxuXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrID0gLT4pIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKCkgaWYgQGlzVXJsTG9hZGVkKHVybClcblxuICAgIGxpbmsgPSAkKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgLz4nKVswXVxuICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcblxuICAgICMgRG8gbm90IHByZXZlbnQgdGhlIHBhZ2UgZnJvbSBsb2FkaW5nIGJlY2F1c2Ugb2YgY3NzIGVycm9yc1xuICAgICMgb25lcnJvciBpcyBub3Qgc3VwcG9ydGVkIGJ5IGV2ZXJ5IGJyb3dzZXIuXG4gICAgIyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvbGlua1xuICAgIGxpbmsub25lcnJvciA9IC0+XG4gICAgICBjb25zb2xlLndhcm4gXCJTdHlsZXNoZWV0IGNvdWxkIG5vdCBiZSBsb2FkZWQ6ICN7IHVybCB9XCJcbiAgICAgIGNhbGxiYWNrKClcblxuICAgIGxpbmsuaHJlZiA9IHVybFxuICAgIEB3aW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKVxuICAgIEBsb2FkZWRVcmxzLnB1c2godXJsKVxuXG5cbiAgaXNVcmxMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMuaW5kZXhPZih1cmwpID49IDBcblxuXG4gICMgSW5saW5lIFN0eWxlc1xuICAjIC0tLS0tLS0tLS0tLS1cblxuICBsb2FkSW5saW5lU3R5bGVzOiAoaW5saW5lU3R5bGVzLCBjYWxsYmFjayA9IC0+KSAtPlxuICAgIGlubGluZVN0eWxlcyA9IEBwcmVwYXJlSW5saW5lU3R5bGVzKGlubGluZVN0eWxlcylcbiAgICByZXR1cm4gY2FsbGJhY2soKSBpZiBAYXJlSW5saW5lU3R5bGVzTG9hZGVkKGlubGluZVN0eWxlcylcblxuICAgICMgSW5qZWN0IGFuIGlubGluZSBzY3JpcHQgZWxlbWVudCB0byB0aGUgZG9jdW1lbnRcbiAgICBkb2MgPSBAd2luZG93LmRvY3VtZW50XG4gICAgc3R5bGVzID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGVzLmlubmVySFRNTCA9IGlubGluZVN0eWxlcztcbiAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChzdHlsZXMpO1xuICAgIEBsb2FkZWRJbmxpbmVTdHlsZXMucHVzaChpbmxpbmVTdHlsZXMpXG5cbiAgICBjYWxsYmFjaygpXG5cblxuICBwcmVwYXJlSW5saW5lU3R5bGVzOiAoaW5saW5lU3R5bGVzKSAtPlxuICAgICMgUmVtb3ZlIDxzdHlsZT4gdGFncyBhcm91bmQgdGhlIGlubGluZSBzdHlsZXNcbiAgICBpbmxpbmVTdHlsZXMucmVwbGFjZSgvPHN0eWxlW14+XSo+fDxcXC9zdHlsZT4vZ2ksICcnKVxuXG5cbiAgYXJlSW5saW5lU3R5bGVzTG9hZGVkOiAoaW5saW5lU3R5bGVzKSAtPlxuICAgIEBsb2FkZWRJbmxpbmVTdHlsZXMuaW5kZXhPZihpbmxpbmVTdHlsZXMpID49IDBcblxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5Db21wb25lbnREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vY29tcG9uZW50X2RyYWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRvclBhZ2VcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAc2V0V2luZG93KClcbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcblxuICAgICMgU3R1YnNcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID1cbiAgICAgIGRpc2FibGVBbGw6IC0+XG4gICAgICByZWVuYWJsZUFsbDogLT5cbiAgICBAY29tcG9uZW50V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBjb21wb25lbnRNb2RlbCwgY29tcG9uZW50VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29tcG9uZW50TW9kZWwgfHwgY29tcG9uZW50Vmlld1xuICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Vmlldy5tb2RlbCBpZiBjb21wb25lbnRWaWV3XG5cbiAgICBjb21wb25lbnREcmFnID0gbmV3IENvbXBvbmVudERyYWdcbiAgICAgIGNvbXBvbmVudE1vZGVsOiBjb21wb25lbnRNb2RlbFxuICAgICAgY29tcG9uZW50VmlldzogY29tcG9uZW50Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KGNvbXBvbmVudERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBzZXRXaW5kb3c6IC0+XG4gICAgQHdpbmRvdyA9IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkZvY3VzID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZm9jdXMnKVxuRWRpdGFibGVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlcicpXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5Db21wb25lbnREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vY29tcG9uZW50X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIENvbXBvbmVudFRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEludGVyYWN0aXZlUGFnZSBleHRlbmRzIFBhZ2VcblxuICBMRUZUX01PVVNFX0JVVFRPTiA9IDFcblxuICBpc1JlYWRPbmx5OiBmYWxzZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIGhvc3RXaW5kb3cgfT17fSkgLT5cbiAgICBzdXBlclxuXG4gICAgQGZvY3VzID0gbmV3IEZvY3VzKClcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID0gbmV3IEVkaXRhYmxlQ29udHJvbGxlcih0aGlzKVxuXG4gICAgIyBldmVudHNcbiAgICBAaW1hZ2VDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAaHRtbEVsZW1lbnRDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAY29tcG9uZW50V2lsbEJlRHJhZ2dlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuICAgIEBmb2N1cy5jb21wb25lbnRGb2N1cy5hZGQoICQucHJveHkoQGFmdGVyQ29tcG9uZW50Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5jb21wb25lbnRCbHVyLmFkZCggJC5wcm94eShAYWZ0ZXJDb21wb25lbnRCbHVycmVkLCB0aGlzKSApXG4gICAgQGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5KClcbiAgICBAJGRvY3VtZW50XG4gICAgICAub24oJ21vdXNlZG93bi5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbigndG91Y2hzdGFydC5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgJC5wcm94eShAYnJvd3NlckRyYWdTdGFydCwgdGhpcykpXG5cblxuICBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeTogLT5cbiAgICBpZiBjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGVcbiAgICAgIEBhc3NldHMuY3NzTG9hZGVyLmxvYWRTaW5nbGVVcmwoY29uZmlnLmxpdmluZ2RvY3NDc3NGaWxlLCBAcmVhZHlTZW1hcGhvcmUud2FpdCgpKVxuXG5cbiAgIyBwcmV2ZW50IHRoZSBicm93c2VyIERyYWcmRHJvcCBmcm9tIGludGVyZmVyaW5nXG4gIGJyb3dzZXJEcmFnU3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuXG4gIHJlbW92ZUxpc3RlbmVyczogLT5cbiAgICBAJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MnKVxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcy1kcmFnJylcblxuXG4gIG1vdXNlZG93bjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC53aGljaCAhPSBMRUZUX01PVVNFX0JVVFRPTiAmJiBldmVudC50eXBlID09ICdtb3VzZWRvd24nICMgb25seSByZXNwb25kIHRvIGxlZnQgbW91c2UgYnV0dG9uXG5cbiAgICAjIElnbm9yZSBpbnRlcmFjdGlvbnMgb24gY2VydGFpbiBlbGVtZW50c1xuICAgIGlzQ29udHJvbCA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KGNvbmZpZy5pZ25vcmVJbnRlcmFjdGlvbikubGVuZ3RoXG4gICAgcmV0dXJuIGlmIGlzQ29udHJvbFxuXG4gICAgIyBJZGVudGlmeSB0aGUgY2xpY2tlZCBjb21wb25lbnRcbiAgICBjb21wb25lbnRWaWV3ID0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGV2ZW50LnRhcmdldClcblxuICAgICMgVGhpcyBpcyBjYWxsZWQgaW4gbW91c2Vkb3duIHNpbmNlIGVkaXRhYmxlcyBnZXQgZm9jdXMgb24gbW91c2Vkb3duXG4gICAgIyBhbmQgb25seSBiZWZvcmUgdGhlIGVkaXRhYmxlcyBjbGVhciB0aGVpciBwbGFjZWhvbGRlciBjYW4gd2Ugc2FmZWx5XG4gICAgIyBpZGVudGlmeSB3aGVyZSB0aGUgdXNlciBoYXMgY2xpY2tlZC5cbiAgICBAaGFuZGxlQ2xpY2tlZENvbXBvbmVudChldmVudCwgY29tcG9uZW50VmlldylcblxuICAgIGlmIGNvbXBvbmVudFZpZXdcbiAgICAgIEBzdGFydERyYWdcbiAgICAgICAgY29tcG9uZW50VmlldzogY29tcG9uZW50Vmlld1xuICAgICAgICBldmVudDogZXZlbnRcblxuXG4gIHN0YXJ0RHJhZzogKHsgY29tcG9uZW50TW9kZWwsIGNvbXBvbmVudFZpZXcsIGV2ZW50LCBjb25maWcgfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudE1vZGVsIHx8IGNvbXBvbmVudFZpZXdcbiAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudFZpZXcubW9kZWwgaWYgY29tcG9uZW50Vmlld1xuXG4gICAgY29tcG9uZW50RHJhZyA9IG5ldyBDb21wb25lbnREcmFnXG4gICAgICBjb21wb25lbnRNb2RlbDogY29tcG9uZW50TW9kZWxcbiAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXdcblxuICAgIGNvbmZpZyA/PVxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG5cbiAgICBAZHJhZ0Jhc2UuaW5pdChjb21wb25lbnREcmFnLCBldmVudCwgY29uZmlnKVxuXG5cbiAgY2FuY2VsRHJhZzogLT5cbiAgICBAZHJhZ0Jhc2UuY2FuY2VsKClcblxuXG4gIGhhbmRsZUNsaWNrZWRDb21wb25lbnQ6IChldmVudCwgY29tcG9uZW50VmlldykgLT5cbiAgICBpZiBjb21wb25lbnRWaWV3XG4gICAgICBAZm9jdXMuY29tcG9uZW50Rm9jdXNlZChjb21wb25lbnRWaWV3KVxuXG4gICAgICBub2RlQ29udGV4dCA9IGRvbS5maW5kTm9kZUNvbnRleHQoZXZlbnQudGFyZ2V0KVxuICAgICAgaWYgbm9kZUNvbnRleHRcbiAgICAgICAgc3dpdGNoIG5vZGVDb250ZXh0LmNvbnRleHRBdHRyXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5pbWFnZS5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBpbWFnZUNsaWNrLmZpcmUoY29tcG9uZW50Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgICAgICAgIHdoZW4gY29uZmlnLmRpcmVjdGl2ZXMuaHRtbC5yZW5kZXJlZEF0dHJcbiAgICAgICAgICAgIEBodG1sRWxlbWVudENsaWNrLmZpcmUoY29tcG9uZW50Vmlldywgbm9kZUNvbnRleHQuYXR0ck5hbWUsIGV2ZW50KVxuICAgIGVsc2VcbiAgICAgIEBmb2N1cy5ibHVyKClcblxuXG4gIGdldEZvY3VzZWRFbGVtZW50OiAtPlxuICAgIEB3aW5kb3cuZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuXG5cbiAgYmx1ckZvY3VzZWRFbGVtZW50OiAtPlxuICAgIEBmb2N1cy5zZXRGb2N1cyh1bmRlZmluZWQpXG4gICAgZm9jdXNlZEVsZW1lbnQgPSBAZ2V0Rm9jdXNlZEVsZW1lbnQoKVxuICAgICQoZm9jdXNlZEVsZW1lbnQpLmJsdXIoKSBpZiBmb2N1c2VkRWxlbWVudFxuXG5cbiAgY29tcG9uZW50Vmlld1dhc0luc2VydGVkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBAaW5pdGlhbGl6ZUVkaXRhYmxlcyhjb21wb25lbnRWaWV3KVxuXG5cbiAgaW5pdGlhbGl6ZUVkaXRhYmxlczogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgaWYgY29tcG9uZW50Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICBlZGl0YWJsZU5vZGVzID0gZm9yIGRpcmVjdGl2ZSBpbiBjb21wb25lbnRWaWV3LmRpcmVjdGl2ZXMuZWRpdGFibGVcbiAgICAgICAgZGlyZWN0aXZlLmVsZW1cblxuICAgICAgQGVkaXRhYmxlQ29udHJvbGxlci5hZGQoZWRpdGFibGVOb2RlcylcblxuXG4gIGFmdGVyQ29tcG9uZW50Rm9jdXNlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgY29tcG9uZW50Vmlldy5hZnRlckZvY3VzZWQoKVxuXG5cbiAgYWZ0ZXJDb21wb25lbnRCbHVycmVkOiAoY29tcG9uZW50VmlldykgLT5cbiAgICBjb21wb25lbnRWaWV3LmFmdGVyQmx1cnJlZCgpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpzTG9hZGVyXG5cbiAgY29uc3RydWN0b3I6IChAd2luZG93KSAtPlxuICAgIEBsb2FkZWRVcmxzID0gW11cbiAgICBAbG9hZGVkU2NyaXB0cyA9IFtdXG5cblxuICAjIENvcmUgbWV0aG9kIGV4dHJhY3RlZCBmcm9tICRzY3JpcHQgKGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvc2NyaXB0LmpzKS5cbiAgIyBMb2FkcyBpbmRpdmlkdWFsIHNjcmlwdHMgYXN5bmNocm9ub3VzbHkuXG4gICNcbiAgIyBAcGFyYW0ge3dpbmRvdy5kb2N1bWVudH0gVGhlIGRvY3VtZW50IHlvdSB3YW50IHRoZSBzY3JpcHQgdG8gbG9hZCBpblxuICAjIEBwYXJhbSB7U3RyaW5nfSBQYXRoIHRvIHRoZSBqcyBmaWxlXG4gICMgQHBhcmFtIHtGdW5jdGlvbn0gQ2FsbGJhY2sgd2hlbiB0aGUgc2NyaXB0IGlzIGxvYWRlZCBvciBhbiBlcnJvciBvY2N1cmVkLlxuICBsb2FkU2luZ2xlVXJsOiAocGF0aCwgY2FsbGJhY2sgPSAtPikgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soKSBpZiBAaXNVcmxMb2FkZWQocGF0aClcblxuICAgIGRvYyA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICByZWFkeVN0YXRlID0gJ3JlYWR5U3RhdGUnXG4gICAgb25yZWFkeXN0YXRlY2hhbmdlID0gJ29ucmVhZHlzdGF0ZWNoYW5nZSdcbiAgICBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF1cblxuICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgbG9hZGVkID0gdW5kZWZpbmVkXG5cbiAgICBlbC5vbmxvYWQgPSBlbC5vbmVycm9yID0gZWxbb25yZWFkeXN0YXRlY2hhbmdlXSA9ID0+XG4gICAgICByZXR1cm4gaWYgKChlbFtyZWFkeVN0YXRlXSAmJiAhKC9eY3xsb2FkZS8udGVzdChlbFtyZWFkeVN0YXRlXSkpKSB8fCBsb2FkZWQpXG4gICAgICBlbC5vbmxvYWQgPSBlbFtvbnJlYWR5c3RhdGVjaGFuZ2VdID0gbnVsbFxuICAgICAgbG9hZGVkID0gdHJ1ZVxuICAgICAgQGxvYWRlZFVybHMucHVzaChwYXRoKVxuICAgICAgY2FsbGJhY2soKVxuXG4gICAgZWwuYXN5bmMgPSB0cnVlXG4gICAgZWwuc3JjID0gcGF0aFxuICAgIGhlYWQuaW5zZXJ0QmVmb3JlKGVsLCBoZWFkLmxhc3RDaGlsZClcblxuXG4gIGlzVXJsTG9hZGVkOiAodXJsKSAtPlxuICAgIEBsb2FkZWRVcmxzLmluZGV4T2YodXJsKSA+PSAwXG5cblxuICAjIElubGluZSBTY3JpcHRcbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgbG9hZElubGluZVNjcmlwdDogKGNvZGVCbG9jaywgY2FsbGJhY2sgPSAtPikgLT5cbiAgICBjb2RlQmxvY2sgPSBAcHJlcGFyZUlubGluZUNvZGUoY29kZUJsb2NrKVxuICAgIHJldHVybiBjYWxsYmFjaygpIGlmIEBpc0lubGluZUJsb2NrTG9hZGVkKGNvZGVCbG9jaylcblxuICAgICMgSW5qZWN0IGFuIGlubGluZSBzY3JpcHQgZWxlbWVudCB0byB0aGUgZG9jdW1lbnRcbiAgICBkb2MgPSBAd2luZG93LmRvY3VtZW50XG4gICAgc2NyaXB0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5pbm5lckhUTUwgPSBjb2RlQmxvY2s7XG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICBAbG9hZGVkU2NyaXB0cy5wdXNoKGNvZGVCbG9jaylcblxuICAgIGNhbGxiYWNrKClcblxuXG4gIHByZXBhcmVJbmxpbmVDb2RlOiAoY29kZUJsb2NrKSAtPlxuICAgICMgUmVtb3ZlIDxzY3JpcHQ+IHRhZ3MgYXJvdW5kIHRoZSBzY3JpcHRcbiAgICBjb2RlQmxvY2sucmVwbGFjZSgvPHNjcmlwdFtePl0qPnw8XFwvc2NyaXB0Pi9naSwgJycpXG5cblxuICBpc0lubGluZUJsb2NrTG9hZGVkOiAoY29kZUJsb2NrKSAtPlxuICAgIEBsb2FkZWRTY3JpcHRzLmluZGV4T2YoY29kZUJsb2NrKSA+PSAwXG5cblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXInKVxuQXNzZXRzID0gcmVxdWlyZSgnLi9hc3NldHMnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIEEgUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFJlbmRlcmluZ0NvbnRhaW5lciB3aGljaCBpcyBpbnRlbmRlZCB0byBiZSBzaG93biB0b1xuIyB0aGUgdXNlci4gSXQgaGFzIGEgTG9hZGVyIHdoaWNoIGFsbG93cyB5b3UgdG8gaW5qZWN0IENTUyBhbmQgSlMgZmlsZXMgaW50byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGFnZSBleHRlbmRzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGNvbnN0cnVjdG9yOiAoeyByZW5kZXJOb2RlLCByZWFkT25seSwgaG9zdFdpbmRvdywgQGRvY3VtZW50RGVwZW5kZW5jaWVzLCBAZGVzaWduLCBAY29tcG9uZW50VHJlZSwgQGxvYWRSZXNvdXJjZXMgfT17fSkgLT5cbiAgICBAbG9hZFJlc291cmNlcyA/PSBjb25maWcubG9hZFJlc291cmNlc1xuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHJlbmRlck5vZGUgPSBpZiByZW5kZXJOb2RlPy5qcXVlcnkgdGhlbiByZW5kZXJOb2RlWzBdIGVsc2UgcmVuZGVyTm9kZVxuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcbiAgICBAcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcblxuICAgIHN1cGVyKClcblxuICAgICMgUHJlcGFyZSBhc3NldHNcbiAgICBwcmV2ZW50QXNzZXRMb2FkaW5nID0gbm90IEBsb2FkUmVzb3VyY2VzXG4gICAgQGFzc2V0cyA9IG5ldyBBc3NldHMod2luZG93OiBAd2luZG93LCBkaXNhYmxlOiBwcmV2ZW50QXNzZXRMb2FkaW5nKVxuXG4gICAgQGxvYWRBc3NldHMoKVxuXG5cbiAgYmVmb3JlUmVhZHk6IC0+XG4gICAgIyBhbHdheXMgaW5pdGlhbGl6ZSBhIHBhZ2UgYXN5bmNocm9ub3VzbHlcbiAgICBAcmVhZHlTZW1hcGhvcmUud2FpdCgpXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlYWR5U2VtYXBob3JlLmRlY3JlbWVudCgpXG4gICAgLCAwXG5cblxuICBsb2FkQXNzZXRzOiA9PlxuICAgICMgRmlyc3QgbG9hZCBkZXNpZ24gZGVwZW5kZW5jaWVzXG4gICAgaWYgQGRlc2lnbj9cbiAgICAgIEBhc3NldHMubG9hZERlcGVuZGVuY2llcyhAZGVzaWduLmRlcGVuZGVuY2llcywgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuICAgICMgVGhlbiBsb2FkIGRvY3VtZW50IHNwZWNpZmljIGRlcGVuZGVuY2llc1xuICAgIGlmIEBkb2N1bWVudERlcGVuZGVuY2llcz9cbiAgICAgIEBhc3NldHMubG9hZERlcGVuZGVuY2llcyhAZG9jdW1lbnREZXBlbmRlbmNpZXMsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cbiAgICAgICMgbGlzdGVuIGZvciBuZXcgZGVwZW5kZW5jaWVzXG4gICAgICBAZG9jdW1lbnREZXBlbmRlbmNpZXMuZGVwZW5kZW5jeUFkZGVkLmFkZCAoZGVwZW5kZW5jeSkgPT5cbiAgICAgICAgQGFzc2V0cy5sb2FkRGVwZW5kZW5jeShkZXBlbmRlbmN5KVxuXG5cbiAgc2V0V2luZG93OiAoaG9zdFdpbmRvdykgLT5cbiAgICBob3N0V2luZG93ID89IEBnZXRQYXJlbnRXaW5kb3coQHJlbmRlck5vZGUpXG4gICAgQHdpbmRvdyA9IGhvc3RXaW5kb3dcbiAgICBAZG9jdW1lbnQgPSBAd2luZG93LmRvY3VtZW50XG4gICAgQCRkb2N1bWVudCA9ICQoQGRvY3VtZW50KVxuICAgIEAkYm9keSA9ICQoQGRvY3VtZW50LmJvZHkpXG5cblxuICBnZXRQYXJlbnRXaW5kb3c6IChlbGVtKSAtPlxuICAgIGlmIGVsZW0/XG4gICAgICBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXdcbiAgICBlbHNlXG4gICAgICB3aW5kb3dcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5TZW1hcGhvcmUgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlbWFwaG9yZScpXG5cbiMgQSBSZW5kZXJpbmdDb250YWluZXIgaXMgdXNlZCBieSB0aGUgUmVuZGVyZXIgdG8gZ2VuZXJhdGUgSFRNTC5cbiNcbiMgVGhlIFJlbmRlcmVyIGluc2VydHMgQ29tcG9uZW50Vmlld3MgaW50byB0aGUgUmVuZGVyaW5nQ29udGFpbmVyIGFuZCBub3RpZmllcyBpdFxuIyBvZiB0aGUgaW5zZXJ0aW9uLlxuI1xuIyBUaGUgUmVuZGVyaW5nQ29udGFpbmVyIGlzIGludGVuZGVkIGZvciBnZW5lcmF0aW5nIEhUTUwuIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZlxuIyB0aGlzIGJhc2UgY2xhc3MgdGhhdCBpcyBpbnRlbmRlZCBmb3IgZGlzcGxheWluZyB0byB0aGUgdXNlci4gSW50ZXJhY3RpdmVQYWdlXG4jIGlzIGEgc3ViY2xhc3Mgb2YgUGFnZSB3aGljaCBhZGRzIGludGVyYWN0aXZpdHksIGFuZCB0aHVzIGVkaXRhYmlsaXR5LCB0byB0aGVcbiMgcGFnZS5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVuZGVyaW5nQ29udGFpbmVyXG5cbiAgaXNSZWFkT25seTogdHJ1ZVxuXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHJlbmRlck5vZGUgPz0gJCgnPGRpdj4nKVswXVxuICAgIEByZWFkeVNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuICAgIEBiZWZvcmVSZWFkeSgpXG4gICAgQHJlYWR5U2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGh0bWw6IC0+XG4gICAgJChAcmVuZGVyTm9kZSkuaHRtbCgpXG5cblxuICBjb21wb25lbnRWaWV3V2FzSW5zZXJ0ZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuXG5cbiAgIyBUaGlzIGlzIGNhbGxlZCBiZWZvcmUgdGhlIHNlbWFwaG9yZSBpcyBzdGFydGVkIHRvIGdpdmUgc3ViY2xhc3NlcyBhIGNoYW5jZVxuICAjIHRvIGluY3JlbWVudCB0aGUgc2VtYXBob3JlIHNvIGl0IGRvZXMgbm90IGZpcmUgaW1tZWRpYXRlbHkuXG4gIGJlZm9yZVJlYWR5OiAtPlxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmVkaXRvckNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbmRvbSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RvbScpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IG5hbWUsIEB0eXBlLCBAZWxlbSwgY29uZmlnIH0pIC0+XG4gICAgQGNvbmZpZyA9IE9iamVjdC5jcmVhdGUoZWRpdG9yQ29uZmlnLmRpcmVjdGl2ZXNbQHR5cGVdKVxuICAgIEBuYW1lID0gbmFtZSB8fCBAY29uZmlnLmRlZmF1bHROYW1lXG4gICAgQHNldENvbmZpZyhjb25maWcpXG4gICAgQG9wdGlvbmFsID0gZmFsc2VcblxuXG4gIHNldENvbmZpZzogKGNvbmZpZykgLT5cbiAgICAkLmV4dGVuZChAY29uZmlnLCBjb25maWcpXG5cblxuICByZW5kZXJlZEF0dHI6IC0+XG4gICAgQGNvbmZpZy5yZW5kZXJlZEF0dHJcblxuXG4gIGlzRWxlbWVudERpcmVjdGl2ZTogLT5cbiAgICBAY29uZmlnLmVsZW1lbnREaXJlY3RpdmVcblxuXG4gICMgUmV0dXJuIHRoZSBub2RlTmFtZSBpbiBsb3dlciBjYXNlXG4gIGdldFRhZ05hbWU6IC0+XG4gICAgQGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IENvbXBvbmVudFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZCBmcm9tIHRoZVxuICAjIHRlbXBsYXRlIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXdcbiAgY2xvbmU6IC0+XG4gICAgbmV3RGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZShuYW1lOiBAbmFtZSwgdHlwZTogQHR5cGUsIGNvbmZpZzogQGNvbmZpZylcbiAgICBuZXdEaXJlY3RpdmUub3B0aW9uYWwgPSBAb3B0aW9uYWxcbiAgICBuZXdEaXJlY3RpdmVcblxuXG4gIGdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChAZWxlbSlcblxuXG4gIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkRpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlJylcblxuIyBBIGxpc3Qgb2YgYWxsIGRpcmVjdGl2ZXMgb2YgYSB0ZW1wbGF0ZVxuIyBFdmVyeSBub2RlIHdpdGggYW4gZG9jLSBhdHRyaWJ1dGUgd2lsbCBiZSBzdG9yZWQgYnkgaXRzIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlQ29sbGVjdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGFsbD17fSkgLT5cbiAgICBAbGVuZ3RoID0gMFxuXG5cbiAgYWRkOiAoZGlyZWN0aXZlKSAtPlxuICAgIEBhc3NlcnROYW1lTm90VXNlZChkaXJlY3RpdmUpXG5cbiAgICAjIGNyZWF0ZSBwc2V1ZG8gYXJyYXlcbiAgICB0aGlzW0BsZW5ndGhdID0gZGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlLmluZGV4ID0gQGxlbmd0aFxuICAgIEBsZW5ndGggKz0gMVxuXG4gICAgIyBpbmRleCBieSBuYW1lXG4gICAgQGFsbFtkaXJlY3RpdmUubmFtZV0gPSBkaXJlY3RpdmVcblxuICAgICMgaW5kZXggYnkgdHlwZVxuICAgICMgZGlyZWN0aXZlLnR5cGUgaXMgb25lIG9mIHRob3NlICdjb250YWluZXInLCAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXSB8fD0gW11cbiAgICB0aGlzW2RpcmVjdGl2ZS50eXBlXS5wdXNoKGRpcmVjdGl2ZSlcbiAgICBkaXJlY3RpdmVcblxuXG4gIG5leHQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSA/PSBAYWxsW25hbWVdXG4gICAgdGhpc1tkaXJlY3RpdmUuaW5kZXggKz0gMV1cblxuXG4gIG5leHRPZlR5cGU6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIERpcmVjdGl2ZVxuICAgIGRpcmVjdGl2ZSA/PSBAYWxsW25hbWVdXG5cbiAgICByZXF1aXJlZFR5cGUgPSBkaXJlY3RpdmUudHlwZVxuICAgIHdoaWxlIGRpcmVjdGl2ZSA9IEBuZXh0KGRpcmVjdGl2ZSlcbiAgICAgIHJldHVybiBkaXJlY3RpdmUgaWYgZGlyZWN0aXZlLnR5cGUgaXMgcmVxdWlyZWRUeXBlXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIEBhbGxbbmFtZV1cblxuXG4gIGNvdW50OiAodHlwZSkgLT5cbiAgICBpZiB0eXBlXG4gICAgICB0aGlzW3R5cGVdPy5sZW5ndGhcbiAgICBlbHNlXG4gICAgICBAbGVuZ3RoXG5cblxuICBuYW1lczogKHR5cGUpIC0+XG4gICAgcmV0dXJuIFtdIHVubGVzcyB0aGlzW3R5cGVdPy5sZW5ndGhcbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNbdHlwZV1cbiAgICAgIGRpcmVjdGl2ZS5uYW1lXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzXG4gICAgICBjYWxsYmFjayhkaXJlY3RpdmUpXG5cblxuICBlYWNoT2ZUeXBlOiAodHlwZSwgY2FsbGJhY2spIC0+XG4gICAgaWYgdGhpc1t0eXBlXVxuICAgICAgZm9yIGRpcmVjdGl2ZSBpbiB0aGlzW3R5cGVdXG4gICAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGVhY2hFZGl0YWJsZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdlZGl0YWJsZScsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaEltYWdlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2ltYWdlJywgY2FsbGJhY2spXG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2NvbnRhaW5lcicsIGNhbGxiYWNrKVxuXG5cbiAgZWFjaEh0bWw6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnaHRtbCcsIGNhbGxiYWNrKVxuXG5cbiAgY2xvbmU6IC0+XG4gICAgbmV3Q29sbGVjdGlvbiA9IG5ldyBEaXJlY3RpdmVDb2xsZWN0aW9uKClcbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgbmV3Q29sbGVjdGlvbi5hZGQoZGlyZWN0aXZlLmNsb25lKCkpXG5cbiAgICBuZXdDb2xsZWN0aW9uXG5cblxuICAjIGhlbHBlciB0byBkaXJlY3RseSBnZXQgZWxlbWVudCB3cmFwcGVkIGluIGEgalF1ZXJ5IG9iamVjdFxuICAjIHRvZG86IHJlbmFtZSBvciBiZXR0ZXIgcmVtb3ZlXG4gICRnZXRFbGVtOiAobmFtZSkgLT5cbiAgICAkKEBhbGxbbmFtZV0uZWxlbSlcblxuXG4gIGFzc2VydEFsbExpbmtlZDogLT5cbiAgICBAZWFjaCAoZGlyZWN0aXZlKSAtPlxuICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBkaXJlY3RpdmUuZWxlbVxuXG4gICAgcmV0dXJuIHRydWVcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGFzc2VydE5hbWVOb3RVc2VkOiAoZGlyZWN0aXZlKSAtPlxuICAgIGFzc2VydCBkaXJlY3RpdmUgJiYgbm90IEBhbGxbZGlyZWN0aXZlLm5hbWVdLFxuICAgICAgXCJcIlwiXG4gICAgICAje2RpcmVjdGl2ZS50eXBlfSBUZW1wbGF0ZSBwYXJzaW5nIGVycm9yOlxuICAgICAgI3sgY29uZmlnLmRpcmVjdGl2ZXNbZGlyZWN0aXZlLnR5cGVdLnJlbmRlcmVkQXR0ciB9PVwiI3sgZGlyZWN0aXZlLm5hbWUgfVwiLlxuICAgICAgXCIjeyBkaXJlY3RpdmUubmFtZSB9XCIgaXMgYSBkdXBsaWNhdGUgbmFtZS5cbiAgICAgIFwiXCJcIlxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgYXR0cmlidXRlUHJlZml4ID0gL14oeC18ZGF0YS0pL1xuXG4gIHBhcnNlOiAoZWxlbSkgLT5cbiAgICBlbGVtRGlyZWN0aXZlID0gdW5kZWZpbmVkXG4gICAgbW9kaWZpY2F0aW9ucyA9IFtdXG4gICAgQHBhcnNlRGlyZWN0aXZlcyBlbGVtLCAoZGlyZWN0aXZlKSAtPlxuICAgICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICAgIGVsZW1EaXJlY3RpdmUgPSBkaXJlY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgbW9kaWZpY2F0aW9ucy5wdXNoKGRpcmVjdGl2ZSlcblxuICAgIEBhcHBseU1vZGlmaWNhdGlvbnMoZWxlbURpcmVjdGl2ZSwgbW9kaWZpY2F0aW9ucykgaWYgZWxlbURpcmVjdGl2ZVxuICAgIHJldHVybiBlbGVtRGlyZWN0aXZlXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChlbGVtLCBmdW5jKSAtPlxuICAgIGRpcmVjdGl2ZURhdGEgPSBbXVxuICAgIGZvciBhdHRyIGluIGVsZW0uYXR0cmlidXRlc1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHIubmFtZVxuICAgICAgbm9ybWFsaXplZE5hbWUgPSBhdHRyaWJ1dGVOYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmVEYXRhLnB1c2hcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBhdHRyaWJ1dGVOYW1lXG4gICAgICAgICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlXG4gICAgICAgICAgICBuYW1lOiBhdHRyLnZhbHVlXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICBlbGVtOiBlbGVtXG5cbiAgICAjIFNpbmNlIHdlIG1vZGlmeSB0aGUgYXR0cmlidXRlcyB3ZSBoYXZlIHRvIHNwbGl0XG4gICAgIyB0aGlzIGludG8gdHdvIGxvb3BzXG4gICAgZm9yIGRhdGEgaW4gZGlyZWN0aXZlRGF0YVxuICAgICAgZGlyZWN0aXZlID0gZGF0YS5kaXJlY3RpdmVcbiAgICAgIEByZXdyaXRlQXR0cmlidXRlKGRpcmVjdGl2ZSwgZGF0YS5hdHRyaWJ1dGVOYW1lKVxuICAgICAgZnVuYyhkaXJlY3RpdmUpXG5cblxuICBhcHBseU1vZGlmaWNhdGlvbnM6IChtYWluRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSAtPlxuICAgIGZvciBkaXJlY3RpdmUgaW4gbW9kaWZpY2F0aW9uc1xuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ29wdGlvbmFsJ1xuICAgICAgICAgIG1haW5EaXJlY3RpdmUub3B0aW9uYWwgPSB0cnVlXG5cblxuICAjIE5vcm1hbGl6ZSBvciByZW1vdmUgdGhlIGF0dHJpYnV0ZVxuICAjIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gIHJld3JpdGVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgaWYgZGlyZWN0aXZlLmlzRWxlbWVudERpcmVjdGl2ZSgpXG4gICAgICBpZiBhdHRyaWJ1dGVOYW1lICE9IGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKVxuICAgICAgICBAbm9ybWFsaXplQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICAgIGVsc2UgaWYgbm90IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlKVxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuXG5cbiAgIyBmb3JjZSBhdHRyaWJ1dGUgc3R5bGUgYXMgc3BlY2lmaWVkIGluIGNvbmZpZ1xuICAjIGUuZy4gYXR0cmlidXRlICdkb2MtY29udGFpbmVyJyBiZWNvbWVzICdkYXRhLWRvYy1jb250YWluZXInXG4gIG5vcm1hbGl6ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBlbGVtID0gZGlyZWN0aXZlLmVsZW1cbiAgICBpZiBhdHRyaWJ1dGVOYW1lXG4gICAgICBAcmVtb3ZlQXR0cmlidXRlKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSlcbiAgICBlbGVtLnNldEF0dHJpYnV0ZShkaXJlY3RpdmUucmVuZGVyZWRBdHRyKCksIGRpcmVjdGl2ZS5uYW1lKVxuXG5cbiAgcmVtb3ZlQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGRpcmVjdGl2ZS5lbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlyZWN0aXZlRmluZGVyID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgbGluazogKGVsZW0sIGRpcmVjdGl2ZUNvbGxlY3Rpb24pIC0+XG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHIubmFtZS5yZXBsYWNlKGF0dHJpYnV0ZVByZWZpeCwgJycpXG4gICAgICBpZiB0eXBlID0gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFtub3JtYWxpemVkTmFtZV1cbiAgICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29sbGVjdGlvbi5nZXQoYXR0ci52YWx1ZSlcbiAgICAgICAgZGlyZWN0aXZlLmVsZW0gPSBlbGVtXG5cbiAgICB1bmRlZmluZWRcbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBEaXJlY3RpdmUgSXRlcmF0b3JcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIENvZGUgaXMgcG9ydGVkIGZyb20gcmFuZ3kgTm9kZUl0ZXJhdG9yIGFuZCBhZGFwdGVkIGZvciBjb21wb25lbnQgdGVtcGxhdGVzXG4jIHNvIGl0IGRvZXMgbm90IHRyYXZlcnNlIGludG8gY29udGFpbmVycy5cbiNcbiMgVXNlIHRvIHRyYXZlcnNlIGFsbCBub2RlcyBvZiBhIHRlbXBsYXRlLiBUaGUgaXRlcmF0b3IgZG9lcyBub3QgZ28gaW50b1xuIyBjb250YWluZXJzIGFuZCBpcyBzYWZlIHRvIHVzZSBldmVuIGlmIHRoZXJlIGlzIGNvbnRlbnQgaW4gdGhlc2UgY29udGFpbmVycy5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlyZWN0aXZlSXRlcmF0b3JcblxuICBjb25zdHJ1Y3RvcjogKHJvb3QpIC0+XG4gICAgQHJvb3QgPSBAX25leHQgPSByb290XG4gICAgQGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG5cblxuICBjdXJyZW50OiBudWxsXG5cblxuICBoYXNOZXh0OiAtPlxuICAgICEhQF9uZXh0XG5cblxuICBuZXh0OiAoKSAtPlxuICAgIG4gPSBAY3VycmVudCA9IEBfbmV4dFxuICAgIGNoaWxkID0gbmV4dCA9IHVuZGVmaW5lZFxuICAgIGlmIEBjdXJyZW50XG4gICAgICBjaGlsZCA9IG4uZmlyc3RDaGlsZFxuICAgICAgaWYgY2hpbGQgJiYgbi5ub2RlVHlwZSA9PSAxICYmICFuLmhhc0F0dHJpYnV0ZShAY29udGFpbmVyQXR0cilcbiAgICAgICAgQF9uZXh0ID0gY2hpbGRcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dCA9IG51bGxcbiAgICAgICAgd2hpbGUgKG4gIT0gQHJvb3QpICYmICEobmV4dCA9IG4ubmV4dFNpYmxpbmcpXG4gICAgICAgICAgbiA9IG4ucGFyZW50Tm9kZVxuXG4gICAgICAgIEBfbmV4dCA9IG5leHRcblxuICAgIEBjdXJyZW50XG5cblxuICAjIG9ubHkgaXRlcmF0ZSBvdmVyIGVsZW1lbnQgbm9kZXMgKE5vZGUuRUxFTUVOVF9OT0RFID09IDEpXG4gIG5leHRFbGVtZW50OiAoKSAtPlxuICAgIHdoaWxlIEBuZXh0KClcbiAgICAgIGJyZWFrIGlmIEBjdXJyZW50Lm5vZGVUeXBlID09IDFcblxuICAgIEBjdXJyZW50XG5cblxuICBkZXRhY2g6ICgpIC0+XG4gICAgQGN1cnJlbnQgPSBAX25leHQgPSBAcm9vdCA9IG51bGxcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuRGlyZWN0aXZlSXRlcmF0b3IgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5EaXJlY3RpdmVDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29sbGVjdGlvbicpXG5kaXJlY3RpdmVDb21waWxlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2NvbXBpbGVyJylcbmRpcmVjdGl2ZUZpbmRlciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2ZpbmRlcicpXG5cbkNvbXBvbmVudE1vZGVsID0gcmVxdWlyZSgnLi4vY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsJylcbkNvbXBvbmVudFZpZXcgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmcvY29tcG9uZW50X3ZpZXcnKVxuXG5zb3J0QnlOYW1lID0gKGEsIGIpIC0+XG4gIGlmIChhLm5hbWUgPiBiLm5hbWUpXG4gICAgMVxuICBlbHNlIGlmIChhLm5hbWUgPCBiLm5hbWUpXG4gICAgLTFcbiAgZWxzZVxuICAgIDBcblxuIyBUZW1wbGF0ZVxuIyAtLS0tLS0tLVxuIyBQYXJzZXMgY29tcG9uZW50IHRlbXBsYXRlcyBhbmQgY3JlYXRlcyBDb21wb25lbnRNb2RlbHMgYW5kIENvbXBvbmVudFZpZXdzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUZW1wbGF0ZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBodG1sLCBsYWJlbCwgcHJvcGVydGllcyB9ID0ge30pIC0+XG4gICAgYXNzZXJ0IGh0bWwsICdUZW1wbGF0ZTogcGFyYW0gaHRtbCBtaXNzaW5nJ1xuXG4gICAgQCR0ZW1wbGF0ZSA9ICQoIEBwcnVuZUh0bWwoaHRtbCkgKS53cmFwKCc8ZGl2PicpXG4gICAgQCR3cmFwID0gQCR0ZW1wbGF0ZS5wYXJlbnQoKVxuXG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcbiAgICBAc3R5bGVzID0gcHJvcGVydGllcyB8fCB7fVxuICAgIEBkZWZhdWx0cyA9IHt9XG5cbiAgICBAcGFyc2VUZW1wbGF0ZSgpXG5cblxuICBzZXREZXNpZ246IChkZXNpZ24pIC0+XG4gICAgQGRlc2lnbiA9IGRlc2lnblxuICAgIEBpZGVudGlmaWVyID0gXCIjeyBkZXNpZ24ubmFtZSB9LiN7IEBuYW1lIH1cIlxuXG5cbiAgIyBjcmVhdGUgYSBuZXcgQ29tcG9uZW50TW9kZWwgaW5zdGFuY2UgZnJvbSB0aGlzIHRlbXBsYXRlXG4gIGNyZWF0ZU1vZGVsOiAoKSAtPlxuICAgIG5ldyBDb21wb25lbnRNb2RlbCh0ZW1wbGF0ZTogdGhpcylcblxuXG4gIGNyZWF0ZVZpZXc6IChjb21wb25lbnRNb2RlbCwgaXNSZWFkT25seSkgLT5cbiAgICBjb21wb25lbnRNb2RlbCB8fD0gQGNyZWF0ZU1vZGVsKClcbiAgICAkZWxlbSA9IEAkdGVtcGxhdGUuY2xvbmUoKVxuICAgIGRpcmVjdGl2ZXMgPSBAbGlua0RpcmVjdGl2ZXMoJGVsZW1bMF0pXG5cbiAgICBjb21wb25lbnRWaWV3ID0gbmV3IENvbXBvbmVudFZpZXdcbiAgICAgIG1vZGVsOiBjb21wb25lbnRNb2RlbFxuICAgICAgJGh0bWw6ICRlbGVtXG4gICAgICBkaXJlY3RpdmVzOiBkaXJlY3RpdmVzXG4gICAgICBpc1JlYWRPbmx5OiBpc1JlYWRPbmx5XG5cblxuICBwcnVuZUh0bWw6IChodG1sKSAtPlxuXG4gICAgIyByZW1vdmUgYWxsIGNvbW1lbnRzXG4gICAgaHRtbCA9ICQoaHRtbCkuZmlsdGVyIChpbmRleCkgLT5cbiAgICAgIEBub2RlVHlwZSAhPThcblxuICAgICMgb25seSBhbGxvdyBvbmUgcm9vdCBlbGVtZW50XG4gICAgYXNzZXJ0IGh0bWwubGVuZ3RoID09IDEsIFwiVGVtcGxhdGVzIG11c3QgY29udGFpbiBvbmUgcm9vdCBlbGVtZW50LiBUaGUgVGVtcGxhdGUgXFxcIiN7IEBpZGVudGlmaWVyIH1cXFwiIGNvbnRhaW5zICN7IGh0bWwubGVuZ3RoIH1cIlxuXG4gICAgaHRtbFxuXG4gIHBhcnNlVGVtcGxhdGU6ICgpIC0+XG4gICAgZWxlbSA9IEAkdGVtcGxhdGVbMF1cbiAgICBAZGlyZWN0aXZlcyA9IEBjb21waWxlRGlyZWN0aXZlcyhlbGVtKVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgc3dpdGNoIGRpcmVjdGl2ZS50eXBlXG4gICAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICAgIEBmb3JtYXRFZGl0YWJsZShkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG4gICAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgICBAZm9ybWF0Q29udGFpbmVyKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnaHRtbCdcbiAgICAgICAgICBAZm9ybWF0SHRtbChkaXJlY3RpdmUubmFtZSwgZGlyZWN0aXZlLmVsZW0pXG5cblxuICAjIEluIHRoZSBodG1sIG9mIHRoZSB0ZW1wbGF0ZSBmaW5kIGFuZCBzdG9yZSBhbGwgRE9NIG5vZGVzXG4gICMgd2hpY2ggYXJlIGRpcmVjdGl2ZXMgKGUuZy4gZWRpdGFibGVzIG9yIGNvbnRhaW5lcnMpLlxuICBjb21waWxlRGlyZWN0aXZlczogKGVsZW0pIC0+XG4gICAgaXRlcmF0b3IgPSBuZXcgRGlyZWN0aXZlSXRlcmF0b3IoZWxlbSlcbiAgICBkaXJlY3RpdmVzID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZUNvbXBpbGVyLnBhcnNlKGVsZW0pXG4gICAgICBkaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpIGlmIGRpcmVjdGl2ZVxuXG4gICAgZGlyZWN0aXZlc1xuXG5cbiAgIyBGb3IgZXZlcnkgbmV3IENvbXBvbmVudFZpZXcgdGhlIGRpcmVjdGl2ZXMgYXJlIGNsb25lZFxuICAjIGFuZCBsaW5rZWQgd2l0aCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgbmV3IHZpZXcuXG4gIGxpbmtEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIGNvbXBvbmVudERpcmVjdGl2ZXMgPSBAZGlyZWN0aXZlcy5jbG9uZSgpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlRmluZGVyLmxpbmsoZWxlbSwgY29tcG9uZW50RGlyZWN0aXZlcylcblxuICAgIGNvbXBvbmVudERpcmVjdGl2ZXNcblxuXG4gIGZvcm1hdEVkaXRhYmxlOiAobmFtZSwgZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICAkZWxlbS5hZGRDbGFzcyhjb25maWcuY3NzLmVkaXRhYmxlKVxuXG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBpZiBkZWZhdWx0VmFsdWUgdGhlbiBkZWZhdWx0VmFsdWUgZWxzZSAnJ1xuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdENvbnRhaW5lcjogKG5hbWUsIGVsZW0pIC0+XG4gICAgIyByZW1vdmUgYWxsIGNvbnRlbnQgZnJvbiBhIGNvbnRhaW5lciBmcm9tIHRoZSB0ZW1wbGF0ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gIGZvcm1hdEh0bWw6IChuYW1lLCBlbGVtKSAtPlxuICAgIGRlZmF1bHRWYWx1ZSA9IHdvcmRzLnRyaW0oZWxlbS5pbm5lckhUTUwpXG4gICAgQGRlZmF1bHRzW25hbWVdID0gZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgIGVsZW0uaW5uZXJIVE1MID0gJydcblxuXG4gICMgUmV0dXJuIGFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBpbnRlcmZhY2Ugb2YgdGhpcyB0ZW1wbGF0ZVxuICAjIEByZXR1cm5zIHsgT2JqZWN0IH0gQW4gb2JqZWN0IHdpY2ggY29udGFpbnMgdGhlIGludGVyZmFjZSBkZXNjcmlwdGlvblxuICAjICAgb2YgdGhpcyB0ZW1wbGF0ZS4gVGhpcyBvYmplY3Qgd2lsbCBiZSB0aGUgc2FtZSBpZiB0aGUgaW50ZXJmYWNlIGRvZXNcbiAgIyAgIG5vdCBjaGFuZ2Ugc2luY2UgZGlyZWN0aXZlcyBhbmQgcHJvcGVydGllcyBhcmUgc29ydGVkLlxuICBpbmZvOiAoKSAtPlxuICAgIGRvYyA9XG4gICAgICBuYW1lOiBAbmFtZVxuICAgICAgZGVzaWduOiBAZGVzaWduPy5uYW1lXG4gICAgICBkaXJlY3RpdmVzOiBbXVxuICAgICAgcHJvcGVydGllczogW11cblxuICAgIEBkaXJlY3RpdmVzLmVhY2ggKGRpcmVjdGl2ZSkgPT5cbiAgICAgIHsgbmFtZSwgdHlwZSB9ID0gZGlyZWN0aXZlXG4gICAgICBkb2MuZGlyZWN0aXZlcy5wdXNoKHsgbmFtZSwgdHlwZSB9KVxuXG5cbiAgICBmb3IgbmFtZSwgc3R5bGUgb2YgQHN0eWxlc1xuICAgICAgZG9jLnByb3BlcnRpZXMucHVzaCh7IG5hbWUsIHR5cGU6ICdjc3NNb2RpZmljYXRvcicgfSlcblxuICAgIGRvYy5kaXJlY3RpdmVzLnNvcnQoc29ydEJ5TmFtZSlcbiAgICBkb2MucHJvcGVydGllcy5zb3J0KHNvcnRCeU5hbWUpXG4gICAgZG9jXG5cblxuXG4jIFN0YXRpYyBmdW5jdGlvbnNcbiMgLS0tLS0tLS0tLS0tLS0tLVxuXG5UZW1wbGF0ZS5wYXJzZUlkZW50aWZpZXIgPSAoaWRlbnRpZmllcikgLT5cbiAgcmV0dXJuIHVubGVzcyBpZGVudGlmaWVyICMgc2lsZW50bHkgZmFpbCBvbiB1bmRlZmluZWQgb3IgZW1wdHkgc3RyaW5nc1xuXG4gIHBhcnRzID0gaWRlbnRpZmllci5zcGxpdCgnLicpXG4gIGlmIHBhcnRzLmxlbmd0aCA9PSAxXG4gICAgeyBkZXNpZ25OYW1lOiB1bmRlZmluZWQsIG5hbWU6IHBhcnRzWzBdIH1cbiAgZWxzZSBpZiBwYXJ0cy5sZW5ndGggPT0gMlxuICAgIHsgZGVzaWduTmFtZTogcGFydHNbMF0sIG5hbWU6IHBhcnRzWzFdIH1cbiAgZWxzZVxuICAgIGxvZy5lcnJvcihcImNvdWxkIG5vdCBwYXJzZSBjb21wb25lbnQgdGVtcGxhdGUgaWRlbnRpZmllcjogI3sgaWRlbnRpZmllciB9XCIpXG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwidmVyc2lvblwiOiBcIjAuNS4wXCIsXG4gIFwicmV2aXNpb25cIjogXCIyMTdkMzk4XCJcbn1cbiJdfQ==
