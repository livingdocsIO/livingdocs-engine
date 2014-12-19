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



},{"../configuration/config":22,"../modules/guid":43,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/serialization":50,"./component_model":15,"deep-equal":1,"jquery":"0LLS5o"}],17:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"./component_array":12,"./component_container":13,"./component_model":15,"./component_model_serializer":16,"jquery":"0LLS5o"}],18:[function(require,module,exports){
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



},{}],22:[function(require,module,exports){
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



},{"../configuration/config":22,"jquery":"0LLS5o"}],24:[function(require,module,exports){
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



},{"../modules/logging/assert":46,"../modules/words":51,"jquery":"0LLS5o"}],30:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/logging/assert":46,"./default_image_service":31}],34:[function(require,module,exports){
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



},{"../configuration/config":22,"jquery":"0LLS5o"}],36:[function(require,module,exports){
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



},{}],"0LLS5o":[function(require,module,exports){
module.exports = $;



},{}],"jquery":[function(require,module,exports){
module.exports=require('0LLS5o');
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



},{"jquery":"0LLS5o"}],52:[function(require,module,exports){
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



},{"../configuration/config":22,"../interaction/dom":35,"../modules/eventing":40,"../template/directive_iterator":64,"jquery":"0LLS5o"}],53:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/semaphore":49,"jquery":"0LLS5o"}],54:[function(require,module,exports){
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



},{"../modules/semaphore":49,"jquery":"0LLS5o"}],56:[function(require,module,exports){
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



},{"../configuration/config":22,"./css_loader":55,"./rendering_container":59,"jquery":"0LLS5o"}],59:[function(require,module,exports){
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



},{"../modules/semaphore":49,"jquery":"0LLS5o"}],60:[function(require,module,exports){
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



},{"../configuration/config":22,"../interaction/dom":35,"jquery":"0LLS5o"}],61:[function(require,module,exports){
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



},{"../configuration/config":22,"../modules/logging/assert":46,"./directive":60,"jquery":"0LLS5o"}],62:[function(require,module,exports){
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



},{"../component_tree/component_model":15,"../configuration/config":22,"../modules/logging/assert":46,"../modules/logging/log":47,"../modules/words":51,"../rendering/component_view":52,"./directive_collection":61,"./directive_compiler":62,"./directive_finder":63,"./directive_iterator":64,"jquery":"0LLS5o"}],66:[function(require,module,exports){
module.exports={
  "version": "0.4.2",
  "revision": "fd211fb"
}

},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9pbmRleC5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvZGVlcC1lcXVhbC9saWIva2V5cy5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi9qc2NoZW1lLmpzIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL2pzY2hlbWUvbGliL3Byb3BlcnR5X3ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi9zY2hlbWUuanMiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9ub2RlX21vZHVsZXMvanNjaGVtZS9saWIvdHlwZS5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi92YWxpZGF0aW9uX2Vycm9ycy5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL25vZGVfbW9kdWxlcy9qc2NoZW1lL2xpYi92YWxpZGF0b3JzLmpzIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9icm93c2VyX2FwaS5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X2FycmF5LmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfZGlyZWN0aXZlX2ZhY3RvcnkuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF9tb2RlbC5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvY29tcG9uZW50X3RyZWUvY29tcG9uZW50X21vZGVsX3NlcmlhbGl6ZXIuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9lZGl0YWJsZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbXBvbmVudF90cmVlL2h0bWxfZGlyZWN0aXZlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9jb21wb25lbnRfdHJlZS9pbWFnZV9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vYXVnbWVudF9jb25maWcuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2NvbmZpZ3VyYXRpb24vY29uZmlnLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vYXNzZXRzLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vY3NzX21vZGlmaWNhdG9yX3Byb3BlcnR5LmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NhY2hlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vZGVzaWduX2NvbmZpZ19zY2hlbWEuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi9kZXNpZ25fcGFyc2VyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9kZXNpZ24vaW1hZ2VfcmF0aW8uY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2Rlc2lnbi92ZXJzaW9uLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbWFnZV9zZXJ2aWNlcy9kZWZhdWx0X2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ltYWdlX3NlcnZpY2VzL3Jlc3JjaXRfaW1hZ2Vfc2VydmljZS5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vY29tcG9uZW50X2RyYWcuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL2ludGVyYWN0aW9uL2RvbS5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvaW50ZXJhY3Rpb24vZHJhZ19iYXNlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9lZGl0YWJsZV9jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9pbnRlcmFjdGlvbi9mb2N1cy5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbGl2aW5nZG9jLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2V2ZW50aW5nLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2ZlYXR1cmVfZGV0ZWN0cy5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9mZWF0dXJlX2RldGVjdGlvbi9pc19zdXBwb3J0ZWQuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvZ3VpZC5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9qcXVlcnlfYnJvd3NlcmlmeS5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2Fzc2VydC5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9sb2dnaW5nL2xvZy5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvbW9kdWxlcy9vcmRlcmVkX2hhc2guY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvc2VtYXBob3JlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9tb2R1bGVzL3NlcmlhbGl6YXRpb24uY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL21vZHVsZXMvd29yZHMuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZy9jb21wb25lbnRfdmlldy5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nL3JlbmRlcmVyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmcvdmlldy5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9jc3NfbG9hZGVyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2VkaXRvcl9wYWdlLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3JlbmRlcmluZ19jb250YWluZXIvcGFnZS5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmUuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uLmNvZmZlZSIsIi9Vc2Vycy9tYXJjYmFjaG1hbm4vRGV2ZWxvcG1lbnQvdXBmcm9udElPL2xpdmluZ2RvY3MtZW5naW5lL3NyYy90ZW1wbGF0ZS9kaXJlY3RpdmVfY29tcGlsZXIuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9maW5kZXIuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvc3JjL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvci5jb2ZmZWUiLCIvVXNlcnMvbWFyY2JhY2htYW5uL0RldmVsb3BtZW50L3VwZnJvbnRJTy9saXZpbmdkb2NzLWVuZ2luZS9zcmMvdGVtcGxhdGUvdGVtcGxhdGUuY29mZmVlIiwiL1VzZXJzL21hcmNiYWNobWFubi9EZXZlbG9wbWVudC91cGZyb250SU8vbGl2aW5nZG9jcy1lbmdpbmUvdmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQUEsUUFBUSxJQUFBLEVBQU0sZ0JBQWQ7T0FBcEIsQ0FBQSxDQURGO0FBQUEsS0FYQTtBQUFBLElBY0EsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLFVBQXBCLENBZEEsQ0FBQTtBQUFBLElBZUEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLFVBQXBCLENBZkEsQ0FBQTtXQWdCQSxJQWpCSTtFQUFBLENBN0dOLENBQUE7O2tCQUFBOztJQTVCRixDQUFBOztBQUFBLFFBaUtRLENBQUMsZUFBVCxHQUEyQixTQUFDLFVBQUQsR0FBQTtBQUN6QixNQUFBLEtBQUE7QUFBQSxFQUFBLElBQUEsQ0FBQSxVQUFBO0FBQUEsVUFBQSxDQUFBO0dBQUE7QUFBQSxFQUVBLEtBQUEsR0FBUSxVQUFVLENBQUMsS0FBWCxDQUFpQixHQUFqQixDQUZSLENBQUE7QUFHQSxFQUFBLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7V0FDRTtBQUFBLE1BQUUsVUFBQSxFQUFZLE1BQWQ7QUFBQSxNQUF5QixJQUFBLEVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBckM7TUFERjtHQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtXQUNIO0FBQUEsTUFBRSxVQUFBLEVBQVksS0FBTSxDQUFBLENBQUEsQ0FBcEI7QUFBQSxNQUF3QixJQUFBLEVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBcEM7TUFERztHQUFBLE1BQUE7V0FHSCxHQUFHLENBQUMsS0FBSixDQUFXLGlEQUFBLEdBQWQsVUFBRyxFQUhHO0dBTm9CO0FBQUEsQ0FqSzNCLENBQUE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzLmpzJyk7XG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2xpYi9pc19hcmd1bWVudHMuanMnKTtcblxudmFyIGRlZXBFcXVhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRGF0ZSAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMy4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgYWN0dWFsICE9ICdvYmplY3QnICYmIHR5cGVvZiBleHBlY3RlZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcHRzLnN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy40LiBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID0gKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKVxufSkoKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA/IHN1cHBvcnRlZCA6IHVuc3VwcG9ydGVkO1xuXG5leHBvcnRzLnN1cHBvcnRlZCA9IHN1cHBvcnRlZDtcbmZ1bmN0aW9uIHN1cHBvcnRlZChvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuZnVuY3Rpb24gdW5zdXBwb3J0ZWQob2JqZWN0KXtcbiAgcmV0dXJuIG9iamVjdCAmJlxuICAgIHR5cGVvZiBvYmplY3QgPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdjYWxsZWUnKSAmJlxuICAgICFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCAnY2FsbGVlJykgfHxcbiAgICBmYWxzZTtcbn07XG4iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbidcbiAgPyBPYmplY3Qua2V5cyA6IHNoaW07XG5cbmV4cG9ydHMuc2hpbSA9IHNoaW07XG5mdW5jdGlvbiBzaGltIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gIHJldHVybiBrZXlzO1xufVxuIiwidmFyIFNjaGVtZSwgalNjaGVtZTtcblxuU2NoZW1lID0gcmVxdWlyZSgnLi9zY2hlbWUnKTtcblxualNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcblxualNjaGVtZVtcIm5ld1wiXSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFNjaGVtZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBqU2NoZW1lO1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgd2luZG93LmpTY2hlbWUgPSBqU2NoZW1lO1xufVxuIiwidmFyIFByb3BlcnR5VmFsaWRhdG9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3BlcnR5VmFsaWRhdG9yID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgdGVybVJlZ2V4O1xuXG4gIHRlcm1SZWdleCA9IC9cXHdbXFx3IF0qXFx3L2c7XG5cbiAgZnVuY3Rpb24gUHJvcGVydHlWYWxpZGF0b3IoX2FyZykge1xuICAgIHZhciBfcmVmO1xuICAgIHRoaXMuaW5wdXRTdHJpbmcgPSBfYXJnLmlucHV0U3RyaW5nLCB0aGlzLnNjaGVtZSA9IF9hcmcuc2NoZW1lLCB0aGlzLnByb3BlcnR5ID0gX2FyZy5wcm9wZXJ0eSwgdGhpcy5wYXJlbnQgPSBfYXJnLnBhcmVudDtcbiAgICB0aGlzLnZhbGlkYXRvcnMgPSBbXTtcbiAgICB0aGlzLmxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnNjaGVtZS5wcm9wZXJ0aWVzUmVxdWlyZWQpIHtcbiAgICAgIGlmICgoX3JlZiA9IHRoaXMucGFyZW50KSAhPSBudWxsKSB7XG4gICAgICAgIF9yZWYuYWRkUmVxdWlyZWRQcm9wZXJ0eSh0aGlzLnByb3BlcnR5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5hZGRWYWxpZGF0aW9ucyh0aGlzLmlucHV0U3RyaW5nKTtcbiAgfVxuXG4gIFByb3BlcnR5VmFsaWRhdG9yLnByb3RvdHlwZS5nZXRMb2NhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnByb3BlcnR5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudC5sb2NhdGlvbiArIHRoaXMuc2NoZW1lLndyaXRlUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNjaGVtZS53cml0ZVByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgIH1cbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuZ2V0UHJvcExvY2F0aW9uID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIFwiXCIgKyB0aGlzLmxvY2F0aW9uICsgKHRoaXMuc2NoZW1lLndyaXRlUHJvcGVydHkoa2V5KSk7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLmFkZFZhbGlkYXRpb25zID0gZnVuY3Rpb24oY29uZmlnU3RyaW5nKSB7XG4gICAgdmFyIHJlc3VsdCwgdGVybSwgdHlwZXM7XG4gICAgd2hpbGUgKHJlc3VsdCA9IHRlcm1SZWdleC5leGVjKGNvbmZpZ1N0cmluZykpIHtcbiAgICAgIHRlcm0gPSByZXN1bHRbMF07XG4gICAgICBpZiAodGVybSA9PT0gJ29wdGlvbmFsJykge1xuICAgICAgICB0aGlzLnBhcmVudC5yZW1vdmVSZXF1aXJlZFByb3BlcnR5KHRoaXMucHJvcGVydHkpO1xuICAgICAgfSBlbHNlIGlmICh0ZXJtID09PSAncmVxdWlyZWQnKSB7XG4gICAgICAgIHRoaXMucGFyZW50LmFkZFJlcXVpcmVkUHJvcGVydHkodGhpcy5wcm9wZXJ0eSk7XG4gICAgICB9IGVsc2UgaWYgKHRlcm0uaW5kZXhPZignYXJyYXkgb2YgJykgPT09IDApIHtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2goJ2FycmF5Jyk7XG4gICAgICAgIHRoaXMuYXJyYXlWYWxpZGF0b3IgPSB0ZXJtLnNsaWNlKDkpO1xuICAgICAgfSBlbHNlIGlmICh0ZXJtLmluZGV4T2YoJyBvciAnKSAhPT0gLTEpIHtcbiAgICAgICAgdHlwZXMgPSB0ZXJtLnNwbGl0KCcgb3IgJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCd0b2RvJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh0ZXJtKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbih2YWx1ZSwgZXJyb3JzKSB7XG4gICAgdmFyIGlzVmFsaWQsIG5hbWUsIHZhbGlkLCB2YWxpZGF0b3IsIHZhbGlkYXRvcnMsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgIGlmICgodmFsdWUgPT0gbnVsbCkgJiYgdGhpcy5pc09wdGlvbmFsKCkpIHtcbiAgICAgIHJldHVybiBpc1ZhbGlkO1xuICAgIH1cbiAgICB2YWxpZGF0b3JzID0gdGhpcy5zY2hlbWUudmFsaWRhdG9ycztcbiAgICBfcmVmID0gdGhpcy52YWxpZGF0b3JzIHx8IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgbmFtZSA9IF9yZWZbX2ldO1xuICAgICAgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1tuYW1lXTtcbiAgICAgIGlmICh2YWxpZGF0b3IgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZXJyb3JzLmFkZChcIm1pc3NpbmcgdmFsaWRhdG9yIFwiICsgbmFtZSwge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmxvY2F0aW9uXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHZhbGlkID0gdmFsaWRhdG9yKHZhbHVlKSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVycm9ycy5hZGQodmFsaWQsIHtcbiAgICAgICAgbG9jYXRpb246IHRoaXMubG9jYXRpb24sXG4gICAgICAgIGRlZmF1bHRNZXNzYWdlOiBcIlwiICsgbmFtZSArIFwiIHZhbGlkYXRvciBmYWlsZWRcIlxuICAgICAgfSk7XG4gICAgICBpc1ZhbGlkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghKGlzVmFsaWQgPSB0aGlzLnZhbGlkYXRlQXJyYXkodmFsdWUsIGVycm9ycykpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghKGlzVmFsaWQgPSB0aGlzLnZhbGlkYXRlUmVxdWlyZWRQcm9wZXJ0aWVzKHZhbHVlLCBlcnJvcnMpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaXNWYWxpZDtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUudmFsaWRhdGVBcnJheSA9IGZ1bmN0aW9uKGFyciwgZXJyb3JzKSB7XG4gICAgdmFyIGVudHJ5LCBpbmRleCwgaXNWYWxpZCwgbG9jYXRpb24sIHJlcywgdmFsaWRhdG9yLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBpZiAodGhpcy5hcnJheVZhbGlkYXRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaXNWYWxpZCA9IHRydWU7XG4gICAgdmFsaWRhdG9yID0gdGhpcy5zY2hlbWUudmFsaWRhdG9yc1t0aGlzLmFycmF5VmFsaWRhdG9yXTtcbiAgICBpZiAodmFsaWRhdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVybiBlcnJvcnMuYWRkKFwibWlzc2luZyB2YWxpZGF0b3IgXCIgKyB0aGlzLmFycmF5VmFsaWRhdG9yLCB7XG4gICAgICAgIGxvY2F0aW9uOiB0aGlzLmxvY2F0aW9uXG4gICAgICB9KTtcbiAgICB9XG4gICAgX3JlZiA9IGFyciB8fCBbXTtcbiAgICBmb3IgKGluZGV4ID0gX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgaW5kZXggPSArK19pKSB7XG4gICAgICBlbnRyeSA9IF9yZWZbaW5kZXhdO1xuICAgICAgcmVzID0gdmFsaWRhdG9yKGVudHJ5KTtcbiAgICAgIGlmIChyZXMgPT09IHRydWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsb2NhdGlvbiA9IFwiXCIgKyB0aGlzLmxvY2F0aW9uICsgXCJbXCIgKyBpbmRleCArIFwiXVwiO1xuICAgICAgZXJyb3JzLmFkZChyZXMsIHtcbiAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uLFxuICAgICAgICBkZWZhdWx0TWVzc2FnZTogXCJcIiArIHRoaXMuYXJyYXlWYWxpZGF0b3IgKyBcIiB2YWxpZGF0b3IgZmFpbGVkXCJcbiAgICAgIH0pO1xuICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaXNWYWxpZDtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUudmFsaWRhdGVPdGhlclByb3BlcnR5ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSwgZXJyb3JzKSB7XG4gICAgdmFyIGlzVmFsaWQ7XG4gICAgaWYgKHRoaXMub3RoZXJQcm9wZXJ0eVZhbGlkYXRvciAhPSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVtZS5lcnJvcnMgPSB2b2lkIDA7XG4gICAgICBpZiAoaXNWYWxpZCA9IHRoaXMub3RoZXJQcm9wZXJ0eVZhbGlkYXRvci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2NoZW1lLmVycm9ycyAhPSBudWxsKSB7XG4gICAgICAgIGVycm9ycy5qb2luKHRoaXMuc2NoZW1lLmVycm9ycywge1xuICAgICAgICAgIGxvY2F0aW9uOiB0aGlzLmdldFByb3BMb2NhdGlvbihrZXkpXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLmFkZChcImFkZGl0aW9uYWwgcHJvcGVydHkgY2hlY2sgZmFpbGVkXCIsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5nZXRQcm9wTG9jYXRpb24oa2V5KVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuc2NoZW1lLmFsbG93QWRkaXRpb25hbFByb3BlcnRpZXMpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvcnMuYWRkKFwidW5zcGVjaWZpZWQgYWRkaXRpb25hbCBwcm9wZXJ0eVwiLCB7XG4gICAgICAgICAgbG9jYXRpb246IHRoaXMuZ2V0UHJvcExvY2F0aW9uKGtleSlcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnZhbGlkYXRlUmVxdWlyZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24ob2JqLCBlcnJvcnMpIHtcbiAgICB2YXIgaXNSZXF1aXJlZCwgaXNWYWxpZCwga2V5LCBfcmVmO1xuICAgIGlzVmFsaWQgPSB0cnVlO1xuICAgIF9yZWYgPSB0aGlzLnJlcXVpcmVkUHJvcGVydGllcztcbiAgICBmb3IgKGtleSBpbiBfcmVmKSB7XG4gICAgICBpc1JlcXVpcmVkID0gX3JlZltrZXldO1xuICAgICAgaWYgKChvYmpba2V5XSA9PSBudWxsKSAmJiBpc1JlcXVpcmVkKSB7XG4gICAgICAgIGVycm9ycy5hZGQoXCJyZXF1aXJlZCBwcm9wZXJ0eSBtaXNzaW5nXCIsIHtcbiAgICAgICAgICBsb2NhdGlvbjogdGhpcy5nZXRQcm9wTG9jYXRpb24oa2V5KVxuICAgICAgICB9KTtcbiAgICAgICAgaXNWYWxpZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaXNWYWxpZDtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuYWRkUmVxdWlyZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICh0aGlzLnJlcXVpcmVkUHJvcGVydGllcyA9PSBudWxsKSB7XG4gICAgICB0aGlzLnJlcXVpcmVkUHJvcGVydGllcyA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZXF1aXJlZFByb3BlcnRpZXNba2V5XSA9IHRydWU7XG4gIH07XG5cbiAgUHJvcGVydHlWYWxpZGF0b3IucHJvdG90eXBlLnJlbW92ZVJlcXVpcmVkUHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgX3JlZjtcbiAgICByZXR1cm4gKF9yZWYgPSB0aGlzLnJlcXVpcmVkUHJvcGVydGllcykgIT0gbnVsbCA/IF9yZWZba2V5XSA9IHZvaWQgMCA6IHZvaWQgMDtcbiAgfTtcblxuICBQcm9wZXJ0eVZhbGlkYXRvci5wcm90b3R5cGUuaXNPcHRpb25hbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gIXRoaXMucGFyZW50LnJlcXVpcmVkUHJvcGVydGllc1t0aGlzLnByb3BlcnR5XSA9PT0gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFByb3BlcnR5VmFsaWRhdG9yO1xuXG59KSgpO1xuIiwidmFyIFByb3BlcnR5VmFsaWRhdG9yLCBTY2hlbWUsIFZhbGlkYXRpb25FcnJvcnMsIHR5cGUsIHZhbGlkYXRvcnM7XG5cblZhbGlkYXRpb25FcnJvcnMgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25fZXJyb3JzJyk7XG5cblByb3BlcnR5VmFsaWRhdG9yID0gcmVxdWlyZSgnLi9wcm9wZXJ0eV92YWxpZGF0b3InKTtcblxudmFsaWRhdG9ycyA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpO1xuXG50eXBlID0gcmVxdWlyZSgnLi90eXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2NoZW1lID0gKGZ1bmN0aW9uKCkge1xuICB2YXIganNWYXJpYWJsZU5hbWU7XG5cbiAganNWYXJpYWJsZU5hbWUgPSAvXlthLXpBLVpdXFx3KiQvO1xuXG4gIGZ1bmN0aW9uIFNjaGVtZSgpIHtcbiAgICB0aGlzLnZhbGlkYXRvcnMgPSBPYmplY3QuY3JlYXRlKHZhbGlkYXRvcnMpO1xuICAgIHRoaXMuc2NoZW1hcyA9IHt9O1xuICAgIHRoaXMucHJvcGVydGllc1JlcXVpcmVkID0gdHJ1ZTtcbiAgICB0aGlzLmFsbG93QWRkaXRpb25hbFByb3BlcnRpZXMgPSB0cnVlO1xuICB9XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5jb25maWd1cmUgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdGhpcy5wcm9wZXJ0aWVzUmVxdWlyZWQgPSBfYXJnLnByb3BlcnRpZXNSZXF1aXJlZCwgdGhpcy5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzID0gX2FyZy5hbGxvd0FkZGl0aW9uYWxQcm9wZXJ0aWVzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24obmFtZSwgc2NoZW1hKSB7XG4gICAgaWYgKHR5cGUuaXNGdW5jdGlvbihzY2hlbWEpKSB7XG4gICAgICB0aGlzLmFkZFZhbGlkYXRvcihuYW1lLCBzY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZFNjaGVtYShuYW1lLCB0aGlzLnBhcnNlQ29uZmlnT2JqKHNjaGVtYSwgdm9pZCAwLCBuYW1lKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIFNjaGVtZS5wcm90b3R5cGUuYWRkU2NoZW1hID0gZnVuY3Rpb24obmFtZSwgc2NoZW1hKSB7XG4gICAgaWYgKHRoaXMudmFsaWRhdG9yc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIHZhbGlkYXRvciBpcyBhbHJlZHkgcmVnaXN0ZXJlZCB1bmRlciB0aGlzIG5hbWU6IFwiICsgbmFtZSk7XG4gICAgfVxuICAgIHRoaXMuc2NoZW1hc1tuYW1lXSA9IHNjaGVtYTtcbiAgICB0aGlzLnZhbGlkYXRvcnNbbmFtZV0gPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgZXJyb3JzO1xuICAgICAgICBlcnJvcnMgPSBfdGhpcy5yZWN1cnNpdmVWYWxpZGF0ZShzY2hlbWEsIHZhbHVlKTtcbiAgICAgICAgaWYgKGVycm9ycy5oYXNFcnJvcnMoKSkge1xuICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5hZGRWYWxpZGF0b3IgPSBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG4gICAgdGhpcy52YWxpZGF0b3JzW25hbWVdID0gZnVuYztcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24oc2NoZW1hTmFtZSwgb2JqKSB7XG4gICAgdmFyIHNjaGVtYTtcbiAgICB0aGlzLmVycm9ycyA9IHZvaWQgMDtcbiAgICBzY2hlbWEgPSB0aGlzLnNjaGVtYXNbc2NoZW1hTmFtZV07XG4gICAgaWYgKHNjaGVtYSA9PSBudWxsKSB7XG4gICAgICB0aGlzLmVycm9ycyA9IG5ldyBWYWxpZGF0aW9uRXJyb3JzKCk7XG4gICAgICB0aGlzLmVycm9ycy5hZGQoXCJtaXNzaW5nIHNjaGVtYVwiLCB7XG4gICAgICAgIGxvY2F0aW9uOiBzY2hlbWFOYW1lXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5lcnJvcnMgPSB0aGlzLnJlY3Vyc2l2ZVZhbGlkYXRlKHNjaGVtYSwgb2JqKS5zZXRSb290KHNjaGVtYU5hbWUpO1xuICAgIHJldHVybiAhdGhpcy5lcnJvcnMuaGFzRXJyb3JzKCk7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5oYXNFcnJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3JlZjtcbiAgICByZXR1cm4gKF9yZWYgPSB0aGlzLmVycm9ycykgIT0gbnVsbCA/IF9yZWYuaGFzRXJyb3JzKCkgOiB2b2lkIDA7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5nZXRFcnJvck1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgcmV0dXJuIChfcmVmID0gdGhpcy5lcnJvcnMpICE9IG51bGwgPyBfcmVmLmdldE1lc3NhZ2VzKCkgOiB2b2lkIDA7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5yZWN1cnNpdmVWYWxpZGF0ZSA9IGZ1bmN0aW9uKHNjaGVtYU9iaiwgb2JqKSB7XG4gICAgdmFyIGVycm9ycywgaXNWYWxpZCwga2V5LCBwYXJlbnRWYWxpZGF0b3IsIHByb3BlcnR5VmFsaWRhdG9yLCB2YWx1ZTtcbiAgICBwYXJlbnRWYWxpZGF0b3IgPSBzY2hlbWFPYmpbJ19fdmFsaWRhdG9yJ107XG4gICAgZXJyb3JzID0gbmV3IFZhbGlkYXRpb25FcnJvcnMoKTtcbiAgICBwYXJlbnRWYWxpZGF0b3IudmFsaWRhdGUob2JqLCBlcnJvcnMpO1xuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmIChzY2hlbWFPYmpba2V5XSAhPSBudWxsKSB7XG4gICAgICAgIHByb3BlcnR5VmFsaWRhdG9yID0gc2NoZW1hT2JqW2tleV1bJ19fdmFsaWRhdG9yJ107XG4gICAgICAgIGlzVmFsaWQgPSBwcm9wZXJ0eVZhbGlkYXRvci52YWxpZGF0ZSh2YWx1ZSwgZXJyb3JzKTtcbiAgICAgICAgaWYgKGlzVmFsaWQgJiYgKHByb3BlcnR5VmFsaWRhdG9yLmNoaWxkU2NoZW1hTmFtZSA9PSBudWxsKSAmJiB0eXBlLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICAgIGVycm9ycy5qb2luKHRoaXMucmVjdXJzaXZlVmFsaWRhdGUoc2NoZW1hT2JqW2tleV0sIHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudFZhbGlkYXRvci52YWxpZGF0ZU90aGVyUHJvcGVydHkoa2V5LCB2YWx1ZSwgZXJyb3JzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVycm9ycztcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLnBhcnNlQ29uZmlnT2JqID0gZnVuY3Rpb24ob2JqLCBwYXJlbnRWYWxpZGF0b3IpIHtcbiAgICB2YXIga2V5LCBwcm9wVmFsaWRhdG9yLCB2YWx1ZTtcbiAgICBpZiAocGFyZW50VmFsaWRhdG9yID09IG51bGwpIHtcbiAgICAgIHBhcmVudFZhbGlkYXRvciA9IG5ldyBQcm9wZXJ0eVZhbGlkYXRvcih7XG4gICAgICAgIGlucHV0U3RyaW5nOiAnb2JqZWN0JyxcbiAgICAgICAgc2NoZW1lOiB0aGlzXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKHRoaXMuYWRkUGFyZW50VmFsaWRhdG9yKHBhcmVudFZhbGlkYXRvciwga2V5LCB2YWx1ZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAodHlwZS5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcHJvcFZhbGlkYXRvciA9IG5ldyBQcm9wZXJ0eVZhbGlkYXRvcih7XG4gICAgICAgICAgaW5wdXRTdHJpbmc6IHZhbHVlLFxuICAgICAgICAgIHByb3BlcnR5OiBrZXksXG4gICAgICAgICAgcGFyZW50OiBwYXJlbnRWYWxpZGF0b3IsXG4gICAgICAgICAgc2NoZW1lOiB0aGlzXG4gICAgICAgIH0pO1xuICAgICAgICBvYmpba2V5XSA9IHtcbiAgICAgICAgICAnX192YWxpZGF0b3InOiBwcm9wVmFsaWRhdG9yXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKHR5cGUuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHByb3BWYWxpZGF0b3IgPSBuZXcgUHJvcGVydHlWYWxpZGF0b3Ioe1xuICAgICAgICAgIGlucHV0U3RyaW5nOiAnb2JqZWN0JyxcbiAgICAgICAgICBwcm9wZXJ0eToga2V5LFxuICAgICAgICAgIHBhcmVudDogcGFyZW50VmFsaWRhdG9yLFxuICAgICAgICAgIHNjaGVtZTogdGhpc1xuICAgICAgICB9KTtcbiAgICAgICAgb2JqW2tleV0gPSB0aGlzLnBhcnNlQ29uZmlnT2JqKHZhbHVlLCBwcm9wVmFsaWRhdG9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgb2JqWydfX3ZhbGlkYXRvciddID0gcGFyZW50VmFsaWRhdG9yO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgU2NoZW1lLnByb3RvdHlwZS5hZGRQYXJlbnRWYWxpZGF0b3IgPSBmdW5jdGlvbihwYXJlbnRWYWxpZGF0b3IsIGtleSwgdmFsaWRhdG9yKSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgJ19fdmFsaWRhdGUnOlxuICAgICAgICBwYXJlbnRWYWxpZGF0b3IuYWRkVmFsaWRhdGlvbnModmFsaWRhdG9yKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdfX2FkZGl0aW9uYWxQcm9wZXJ0eSc6XG4gICAgICAgIGlmICh0eXBlLmlzRnVuY3Rpb24odmFsaWRhdG9yKSkge1xuICAgICAgICAgIHBhcmVudFZhbGlkYXRvci5vdGhlclByb3BlcnR5VmFsaWRhdG9yID0gdmFsaWRhdG9yO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICBTY2hlbWUucHJvdG90eXBlLndyaXRlUHJvcGVydHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmIChqc1ZhcmlhYmxlTmFtZS50ZXN0KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIFwiLlwiICsgdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlsnXCIgKyB2YWx1ZSArIFwiJ11cIjtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFNjaGVtZTtcblxufSkoKTtcbiIsInZhciB0b1N0cmluZywgdHlwZTtcblxudG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGUgPSB7XG4gIGlzT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdDtcbiAgICB0ID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdCA9PT0gJ29iamVjdCcgJiYgISFvYmogJiYgIXRoaXMuaXNBcnJheShvYmopO1xuICB9LFxuICBpc0Jvb2xlYW46IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfVxufTtcblxuWydGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJywgJ0FycmF5J10uZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiB0eXBlW1wiaXNcIiArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gKFwiW29iamVjdCBcIiArIG5hbWUgKyBcIl1cIik7XG4gIH07XG59KTtcblxuaWYgKEFycmF5LmlzQXJyYXkpIHtcbiAgdHlwZS5pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbn1cbiIsInZhciBWYWxpZGF0aW9uRXJyb3JzLCB0eXBlO1xuXG50eXBlID0gcmVxdWlyZSgnLi90eXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdGlvbkVycm9ycyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gVmFsaWRhdGlvbkVycm9ycygpIHt9XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuaGFzRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JzICE9IG51bGw7XG4gIH07XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuc2V0Um9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgICB0aGlzLnJvb3QgPSByb290O1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIFZhbGlkYXRpb25FcnJvcnMucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1lc3NhZ2UsIF9hcmcpIHtcbiAgICB2YXIgZGVmYXVsdE1lc3NhZ2UsIGVycm9yLCBsb2NhdGlvbiwgX3JlZjtcbiAgICBfcmVmID0gX2FyZyAhPSBudWxsID8gX2FyZyA6IHt9LCBsb2NhdGlvbiA9IF9yZWYubG9jYXRpb24sIGRlZmF1bHRNZXNzYWdlID0gX3JlZi5kZWZhdWx0TWVzc2FnZTtcbiAgICBpZiAobWVzc2FnZSA9PT0gZmFsc2UpIHtcbiAgICAgIG1lc3NhZ2UgPSBkZWZhdWx0TWVzc2FnZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZXJyb3JzID09IG51bGwpIHtcbiAgICAgIHRoaXMuZXJyb3JzID0gW107XG4gICAgfVxuICAgIGlmICh0eXBlLmlzU3RyaW5nKG1lc3NhZ2UpKSB7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKHtcbiAgICAgICAgcGF0aDogbG9jYXRpb24sXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcnMpIHtcbiAgICAgIHRoaXMuam9pbihtZXNzYWdlLCB7XG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvblxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnBhdGggJiYgbWVzc2FnZS5tZXNzYWdlKSB7XG4gICAgICBlcnJvciA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKHtcbiAgICAgICAgcGF0aDogbG9jYXRpb24gKyBlcnJvci5wYXRoLFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWYWxpZGF0aW9uRXJyb3IuYWRkKCkgdW5rbm93biBlcnJvciB0eXBlJyk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBWYWxpZGF0aW9uRXJyb3JzLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24oX2FyZywgX2FyZzEpIHtcbiAgICB2YXIgZXJyb3IsIGVycm9ycywgbG9jYXRpb24sIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICBlcnJvcnMgPSBfYXJnLmVycm9ycztcbiAgICBsb2NhdGlvbiA9IChfYXJnMSAhPSBudWxsID8gX2FyZzEgOiB7fSkubG9jYXRpb247XG4gICAgaWYgKGVycm9ycyA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICBpZiAodGhpcy5lcnJvcnMgPT0gbnVsbCkge1xuICAgICAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgICAgfVxuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gZXJyb3JzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGVycm9yID0gZXJyb3JzW19pXTtcbiAgICAgICAgX3Jlc3VsdHMucHVzaCh0aGlzLmVycm9ycy5wdXNoKHtcbiAgICAgICAgICBwYXRoOiAobG9jYXRpb24gfHwgJycpICsgZXJyb3IucGF0aCxcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9XG4gIH07XG5cbiAgVmFsaWRhdGlvbkVycm9ycy5wcm90b3R5cGUuZ2V0TWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZXJyb3IsIG1lc3NhZ2VzLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBtZXNzYWdlcyA9IFtdO1xuICAgIF9yZWYgPSB0aGlzLmVycm9ycyB8fCBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGVycm9yID0gX3JlZltfaV07XG4gICAgICBtZXNzYWdlcy5wdXNoKFwiXCIgKyAodGhpcy5yb290IHx8ICcnKSArIGVycm9yLnBhdGggKyBcIjogXCIgKyBlcnJvci5tZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VzO1xuICB9O1xuXG4gIHJldHVybiBWYWxpZGF0aW9uRXJyb3JzO1xuXG59KSgpO1xuIiwidmFyIHR5cGU7XG5cbnR5cGUgPSByZXF1aXJlKCcuL3R5cGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICdvYmplY3QnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzT2JqZWN0KHZhbHVlKTtcbiAgfSxcbiAgJ3N0cmluZyc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNTdHJpbmcodmFsdWUpO1xuICB9LFxuICAnYm9vbGVhbic6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNCb29sZWFuKHZhbHVlKTtcbiAgfSxcbiAgJ251bWJlcic6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNOdW1iZXIodmFsdWUpO1xuICB9LFxuICAnZnVuY3Rpb24nOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzRnVuY3Rpb24odmFsdWUpO1xuICB9LFxuICAnZGF0ZSc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNEYXRlKHZhbHVlKTtcbiAgfSxcbiAgJ3JlZ2V4cCc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGUuaXNSZWdFeHAodmFsdWUpO1xuICB9LFxuICAnYXJyYXknOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlLmlzQXJyYXkodmFsdWUpO1xuICB9LFxuICAnZmFsc3knOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlID09PSBmYWxzZTtcbiAgfSxcbiAgJ3RydXRoeSc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhdmFsdWUgPT09IHRydWU7XG4gIH0sXG4gICdub3QgZW1wdHknOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiAhIXZhbHVlID09PSB0cnVlO1xuICB9LFxuICAnZGVwcmVjYXRlZCc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjExIC0gZ2l0LmlvL2VlXG4gKiBVbmxpY2Vuc2UgLSBodHRwOi8vdW5saWNlbnNlLm9yZy9cbiAqIE9saXZlciBDYWxkd2VsbCAtIGh0dHA6Ly9vbGkubWUudWsvXG4gKiBAcHJlc2VydmVcbiAqL1xuXG47KGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuICAgICAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cbiAgICAgKlxuICAgICAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuICAgIC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG4gICAgdmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcbiAgICB2YXIgZXhwb3J0cyA9IHRoaXM7XG4gICAgdmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdHMgc3RvcmFnZSBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2RcbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG4gICAgICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuICAgICAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG4gICAgICovXG4gICAgcHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG4gICAgICAgIHZhciByZXNwb25zZTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICAvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuICAgICAgICAvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICAgIGlmIChldnQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge307XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuICAgICAqL1xuICAgIHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuICAgICAgICB2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmbGF0TGlzdGVuZXJzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cbiAgICAgKi9cbiAgICBwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICAgIGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG4gICAgICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG4gICAgICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuICAgICAgICB2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgICAgICAgICAgICAgICBvbmNlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG4gICAgICovXG4gICAgcHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG4gICAgICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0cyBmaXJzdCBleGVjdXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuICAgICAgICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuICAgICAqL1xuICAgIHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuICAgICAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcbiAgICAgICAgdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG4gICAgICovXG4gICAgcHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG4gICAgICAgIHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG4gICAgICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG4gICAgICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG4gICAgICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgdmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuICAgICAgICB2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG4gICAgICAgIC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXRzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2RcbiAgICAgICAgaWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgZm9yIChpIGluIGV2dCkge1xuICAgICAgICAgICAgICAgIGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG4gICAgICAgICAgICAvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG4gICAgICAgICAgICAvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuICAgICAgICAgICAgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgc2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuICAgICAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcbiAgICAgICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1tldnRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuICAgICAgICAgICAgZm9yIChrZXkgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG4gICAgICpcbiAgICAgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG4gICAgICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG4gICAgICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuICAgICAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cbiAgICAgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG4gICAgICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBsaXN0ZW5lcjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIHZhciByZXNwb25zZTtcblxuICAgICAgICBmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIGVtaXRFdmVudFxuICAgICAqL1xuICAgIHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG4gICAgICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcbiAgICAgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcbiAgICAgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAgICAgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuICAgICAqXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG4gICAgICovXG4gICAgRXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuICAgICAgICBleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG4gICAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgfTtcblxuICAgIC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBleHBvcnRzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcbiAgICB9XG59LmNhbGwodGhpcykpO1xuIiwiY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5hdWdtZW50Q29uZmlnID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uL2F1Z21lbnRfY29uZmlnJylcbkxpdmluZ2RvYyA9IHJlcXVpcmUoJy4vbGl2aW5nZG9jJylcbkNvbXBvbmVudFRyZWUgPSByZXF1aXJlKCcuL2NvbXBvbmVudF90cmVlL2NvbXBvbmVudF90cmVlJylcbmRlc2lnbkNhY2hlID0gcmVxdWlyZSgnLi9kZXNpZ24vZGVzaWduX2NhY2hlJylcbkVkaXRvclBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvZWRpdG9yX3BhZ2UnKVxudmVyc2lvbiA9IHJlcXVpcmUoJy4uL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvYyA9IGRvIC0+XG5cbiAgZWRpdG9yUGFnZSA9IG5ldyBFZGl0b3JQYWdlKClcblxuICAjIFNldCB0aGUgY3VycmVudCB2ZXJzaW9uXG4gIHZlcnNpb246IHZlcnNpb24udmVyc2lvblxuICByZXZpc2lvbjogdmVyc2lvbi5yZXZpc2lvblxuXG5cbiAgIyBMb2FkIGFuZCBhY2Nlc3MgZGVzaWducy5cbiAgI1xuICAjIExvYWQgYSBkZXNpZ246XG4gICMgZGVzaWduLmxvYWQoeW91ckRlc2lnbkpzb24pXG4gICNcbiAgIyBDaGVjayBpZiBhIGRlc2lnbiBpcyBhbHJlYWR5IGxvYWRlZDpcbiAgIyBkZXNpZ24uaGFzKG5hbWVPZllvdXJEZXNpZ24pXG4gICNcbiAgIyBHZXQgYW4gYWxyZWFkeSBsb2FkZWQgZGVzaWduOlxuICAjIGRlc2lnbi5nZXQobmFtZU9mWW91ckRlc2lnbilcbiAgZGVzaWduOiBkZXNpZ25DYWNoZVxuXG5cbiAgIyBEaXJlY3QgYWNjZXNzIHRvIG1vZGVsc1xuICBMaXZpbmdkb2M6IExpdmluZ2RvY1xuICBDb21wb25lbnRUcmVlOiBDb21wb25lbnRUcmVlXG5cblxuICAjIExvYWQgYSBsaXZpbmdkb2MgZnJvbSBzZXJpYWxpemVkIGRhdGEgaW4gYSBzeW5jaHJvbm91cyB3YXkuXG4gICMgVGhlIGRlc2lnbiBtdXN0IGJlIGxvYWRlZCBmaXJzdC5cbiAgI1xuICAjIENhbGwgT3B0aW9uczpcbiAgIyAtIG5ldyh7IGRhdGEgfSlcbiAgIyAgIExvYWQgYSBsaXZpbmdkb2Mgd2l0aCBKU09OIGRhdGFcbiAgI1xuICAjIC0gbmV3KHsgZGVzaWduIH0pXG4gICMgICBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVtcHR5IGxpdmluZ2RvYyB3aXRoIHlvdXJcbiAgIyAgIHNwZWNpZmllZCBkZXNpZ25cbiAgI1xuICAjIC0gbmV3KHsgY29tcG9uZW50VHJlZSB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsaXZpbmdkb2MgZnJvbSBhXG4gICMgICBjb21wb25lbnRUcmVlXG4gICNcbiAgIyBAcGFyYW0gZGF0YSB7IGpzb24gc3RyaW5nIH0gU2VyaWFsaXplZCBMaXZpbmdkb2NcbiAgIyBAcGFyYW0gZGVzaWduTmFtZSB7IHN0cmluZyB9IE5hbWUgb2YgYSBkZXNpZ25cbiAgIyBAcGFyYW0gY29tcG9uZW50VHJlZSB7IENvbXBvbmVudFRyZWUgfSBBIGNvbXBvbmVudFRyZWUgaW5zdGFuY2VcbiAgIyBAcmV0dXJucyB7IExpdmluZ2RvYyBvYmplY3QgfVxuICBjcmVhdGVMaXZpbmdkb2M6ICh7IGRhdGEsIGRlc2lnbiwgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIExpdmluZ2RvYy5jcmVhdGUoeyBkYXRhLCBkZXNpZ25OYW1lOiBkZXNpZ24sIGNvbXBvbmVudFRyZWUgfSlcblxuXG4gICMgQWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIG5ldzogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIGNyZWF0ZTogLT4gQGNyZWF0ZUxpdmluZ2RvYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cblxuICAjIFN0YXJ0IGRyYWcgJiBkcm9wXG4gIHN0YXJ0RHJhZzogJC5wcm94eShlZGl0b3JQYWdlLCAnc3RhcnREcmFnJylcblxuXG4gICMgQ2hhbmdlIHRoZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZzogKHVzZXJDb25maWcpIC0+XG4gICAgJC5leHRlbmQodHJ1ZSwgY29uZmlnLCB1c2VyQ29uZmlnKVxuICAgIGF1Z21lbnRDb25maWcoY29uZmlnKVxuXG5cblxuIyBFeHBvcnQgZ2xvYmFsIHZhcmlhYmxlXG53aW5kb3cuZG9jID0gZG9jXG5cbiIsIiMgalF1ZXJ5IGxpa2UgcmVzdWx0cyB3aGVuIHNlYXJjaGluZyBmb3IgY29tcG9uZW50cy5cbiMgYGRvYyhcImhlcm9cIilgIHdpbGwgcmV0dXJuIGEgQ29tcG9uZW50QXJyYXkgdGhhdCB3b3JrcyBzaW1pbGFyIHRvIGEgalF1ZXJ5IG9iamVjdC5cbiMgRm9yIGV4dGVuc2liaWxpdHkgdmlhIHBsdWdpbnMgd2UgZXhwb3NlIHRoZSBwcm90b3R5cGUgb2YgQ29tcG9uZW50QXJyYXkgdmlhIGBkb2MuZm5gLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRBcnJheVxuXG5cbiAgIyBAcGFyYW0gY29tcG9uZW50czogYXJyYXkgb2YgY29tcG9uZW50c1xuICBjb25zdHJ1Y3RvcjogKEBjb21wb25lbnRzKSAtPlxuICAgIEBjb21wb25lbnRzID89IFtdXG4gICAgQGNyZWF0ZVBzZXVkb0FycmF5KClcblxuXG4gIGNyZWF0ZVBzZXVkb0FycmF5OiAoKSAtPlxuICAgIGZvciByZXN1bHQsIGluZGV4IGluIEBjb21wb25lbnRzXG4gICAgICBAW2luZGV4XSA9IHJlc3VsdFxuXG4gICAgQGxlbmd0aCA9IEBjb21wb25lbnRzLmxlbmd0aFxuICAgIGlmIEBjb21wb25lbnRzLmxlbmd0aFxuICAgICAgQGZpcnN0ID0gQFswXVxuICAgICAgQGxhc3QgPSBAW0Bjb21wb25lbnRzLmxlbmd0aCAtIDFdXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGNvbXBvbmVudCBpbiBAY29tcG9uZW50c1xuICAgICAgY2FsbGJhY2soY29tcG9uZW50KVxuXG4gICAgdGhpc1xuXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICBjb21wb25lbnQucmVtb3ZlKClcblxuICAgIHRoaXNcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG4jIENvbXBvbmVudENvbnRhaW5lclxuIyAtLS0tLS0tLS0tLS0tLS0tXG4jIEEgQ29tcG9uZW50Q29udGFpbmVyIGNvbnRhaW5zIGFuZCBtYW5hZ2VzIGEgbGlua2VkIGxpc3RcbiMgb2YgY29tcG9uZW50cy5cbiNcbiMgVGhlIGNvbXBvbmVudENvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyBpdHMgY29tcG9uZW50VHJlZVxuIyBpbmZvcm1lZCBhYm91dCBjaGFuZ2VzIChvbmx5IGlmIHRoZXkgYXJlIGF0dGFjaGVkIHRvIG9uZSkuXG4jXG4jIEBwcm9wIGZpcnN0OiBmaXJzdCBjb21wb25lbnQgaW4gdGhlIGNvbnRhaW5lclxuIyBAcHJvcCBsYXN0OiBsYXN0IGNvbXBvbmVudCBpbiB0aGUgY29udGFpbmVyXG4jIEBwcm9wIHBhcmVudENvbXBvbmVudDogcGFyZW50IENvbXBvbmVudE1vZGVsXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudENvbnRhaW5lclxuXG5cbiAgY29uc3RydWN0b3I6ICh7IEBwYXJlbnRDb21wb25lbnQsIEBuYW1lLCBpc1Jvb3QgfSkgLT5cbiAgICBAaXNSb290ID0gaXNSb290P1xuICAgIEBmaXJzdCA9IEBsYXN0ID0gdW5kZWZpbmVkXG5cblxuICBwcmVwZW5kOiAoY29tcG9uZW50KSAtPlxuICAgIGlmIEBmaXJzdFxuICAgICAgQGluc2VydEJlZm9yZShAZmlyc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBAcGFyZW50Q29tcG9uZW50XG4gICAgICBhc3NlcnQgY29tcG9uZW50IGlzbnQgQHBhcmVudENvbXBvbmVudCwgJ2Nhbm5vdCBhcHBlbmQgY29tcG9uZW50IHRvIGl0c2VsZidcblxuICAgIGlmIEBsYXN0XG4gICAgICBAaW5zZXJ0QWZ0ZXIoQGxhc3QsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoQ29tcG9uZW50KGNvbXBvbmVudClcblxuICAgIHRoaXNcblxuXG4gIGluc2VydEJlZm9yZTogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5wcmV2aW91cyA9PSBpbnNlcnRlZENvbXBvbmVudFxuICAgIGFzc2VydCBjb21wb25lbnQgaXNudCBpbnNlcnRlZENvbXBvbmVudCwgJ2Nhbm5vdCBpbnNlcnQgY29tcG9uZW50IGJlZm9yZSBpdHNlbGYnXG5cbiAgICBwb3NpdGlvbiA9XG4gICAgICBwcmV2aW91czogY29tcG9uZW50LnByZXZpb3VzXG4gICAgICBuZXh0OiBjb21wb25lbnRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICBpbnNlcnRBZnRlcjogKGNvbXBvbmVudCwgaW5zZXJ0ZWRDb21wb25lbnQpIC0+XG4gICAgcmV0dXJuIGlmIGNvbXBvbmVudC5uZXh0ID09IGluc2VydGVkQ29tcG9uZW50XG4gICAgYXNzZXJ0IGNvbXBvbmVudCBpc250IGluc2VydGVkQ29tcG9uZW50LCAnY2Fubm90IGluc2VydCBjb21wb25lbnQgYWZ0ZXIgaXRzZWxmJ1xuXG4gICAgcG9zaXRpb24gPVxuICAgICAgcHJldmlvdXM6IGNvbXBvbmVudFxuICAgICAgbmV4dDogY29tcG9uZW50Lm5leHRcbiAgICAgIHBhcmVudENvbnRhaW5lcjogY29tcG9uZW50LnBhcmVudENvbnRhaW5lclxuXG4gICAgQGF0dGFjaENvbXBvbmVudChpbnNlcnRlZENvbXBvbmVudCwgcG9zaXRpb24pXG5cblxuICB1cDogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBAaW5zZXJ0QmVmb3JlKGNvbXBvbmVudC5wcmV2aW91cywgY29tcG9uZW50KVxuXG5cbiAgZG93bjogKGNvbXBvbmVudCkgLT5cbiAgICBpZiBjb21wb25lbnQubmV4dD9cbiAgICAgIEBpbnNlcnRBZnRlcihjb21wb25lbnQubmV4dCwgY29tcG9uZW50KVxuXG5cbiAgZ2V0Q29tcG9uZW50VHJlZTogLT5cbiAgICBAY29tcG9uZW50VHJlZSB8fCBAcGFyZW50Q29tcG9uZW50Py5jb21wb25lbnRUcmVlXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnQgPSBAZmlyc3RcbiAgICB3aGlsZSAoY29tcG9uZW50KVxuICAgICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZihjYWxsYmFjaylcbiAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5uZXh0XG5cblxuICBlYWNoQ29udGFpbmVyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRDb250YWluZXIpXG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb21wb25lbnRzIGFuZCBjb250YWluZXJzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKHRoaXMpXG4gICAgQGVhY2ggKGNvbXBvbmVudCkgLT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudClcbiAgICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgcmVtb3ZlOiAoY29tcG9uZW50KSAtPlxuICAgIGNvbXBvbmVudC5kZXN0cm95KClcbiAgICBAX2RldGFjaENvbXBvbmVudChjb21wb25lbnQpXG5cblxuICAjIFByaXZhdGVcbiAgIyAtLS0tLS0tXG5cbiAgIyBFdmVyeSBjb21wb25lbnQgYWRkZWQgb3IgbW92ZWQgbW9zdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXR0YWNoQ29tcG9uZW50OiAoY29tcG9uZW50LCBwb3NpdGlvbiA9IHt9KSAtPlxuICAgIGZ1bmMgPSA9PlxuICAgICAgQGxpbmsoY29tcG9uZW50LCBwb3NpdGlvbilcblxuICAgIGlmIGNvbXBvbmVudFRyZWUgPSBAZ2V0Q29tcG9uZW50VHJlZSgpXG4gICAgICBjb21wb25lbnRUcmVlLmF0dGFjaGluZ0NvbXBvbmVudChjb21wb25lbnQsIGZ1bmMpXG4gICAgZWxzZVxuICAgICAgZnVuYygpXG5cblxuICAjIEV2ZXJ5IGNvbXBvbmVudCB0aGF0IGlzIHJlbW92ZWQgbXVzdCBjb21lIHRocm91Z2ggaGVyZS5cbiAgIyBOb3RpZmllcyB0aGUgY29tcG9uZW50VHJlZSBpZiB0aGUgcGFyZW50IGNvbXBvbmVudCBpc1xuICAjIGF0dGFjaGVkIHRvIG9uZS5cbiAgIyBDb21wb25lbnRzIHRoYXQgYXJlIG1vdmVkIGluc2lkZSBhIGNvbXBvbmVudFRyZWUgc2hvdWxkIG5vdFxuICAjIGNhbGwgX2RldGFjaENvbXBvbmVudCBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGZpcmVcbiAgIyBDb21wb25lbnRSZW1vdmVkIGV2ZW50cyBvbiB0aGUgY29tcG9uZW50VHJlZSwgaW4gdGhlc2VcbiAgIyBjYXNlcyB1bmxpbmsgY2FuIGJlIHVzZWRcbiAgIyBAYXBpIHByaXZhdGVcbiAgX2RldGFjaENvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBmdW5jID0gPT5cbiAgICAgIEB1bmxpbmsoY29tcG9uZW50KVxuXG4gICAgaWYgY29tcG9uZW50VHJlZSA9IEBnZXRDb21wb25lbnRUcmVlKClcbiAgICAgIGNvbXBvbmVudFRyZWUuZGV0YWNoaW5nQ29tcG9uZW50KGNvbXBvbmVudCwgZnVuYylcbiAgICBlbHNlXG4gICAgICBmdW5jKClcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIGxpbms6IChjb21wb25lbnQsIHBvc2l0aW9uKSAtPlxuICAgIEB1bmxpbmsoY29tcG9uZW50KSBpZiBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG5cbiAgICBwb3NpdGlvbi5wYXJlbnRDb250YWluZXIgfHw9IHRoaXNcbiAgICBAc2V0Q29tcG9uZW50UG9zaXRpb24oY29tcG9uZW50LCBwb3NpdGlvbilcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHVubGluazogKGNvbXBvbmVudCkgLT5cbiAgICBjb250YWluZXIgPSBjb21wb25lbnQucGFyZW50Q29udGFpbmVyXG4gICAgaWYgY29udGFpbmVyXG5cbiAgICAgICMgdXBkYXRlIHBhcmVudENvbnRhaW5lciBsaW5rc1xuICAgICAgY29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50Lm5leHQgdW5sZXNzIGNvbXBvbmVudC5wcmV2aW91cz9cbiAgICAgIGNvbnRhaW5lci5sYXN0ID0gY29tcG9uZW50LnByZXZpb3VzIHVubGVzcyBjb21wb25lbnQubmV4dD9cblxuICAgICAgIyB1cGRhdGUgcHJldmlvdXMgYW5kIG5leHQgbm9kZXNcbiAgICAgIGNvbXBvbmVudC5uZXh0Py5wcmV2aW91cyA9IGNvbXBvbmVudC5wcmV2aW91c1xuICAgICAgY29tcG9uZW50LnByZXZpb3VzPy5uZXh0ID0gY29tcG9uZW50Lm5leHRcblxuICAgICAgQHNldENvbXBvbmVudFBvc2l0aW9uKGNvbXBvbmVudCwge30pXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBzZXRDb21wb25lbnRQb3NpdGlvbjogKGNvbXBvbmVudCwgeyBwYXJlbnRDb250YWluZXIsIHByZXZpb3VzLCBuZXh0IH0pIC0+XG4gICAgY29tcG9uZW50LnBhcmVudENvbnRhaW5lciA9IHBhcmVudENvbnRhaW5lclxuICAgIGNvbXBvbmVudC5wcmV2aW91cyA9IHByZXZpb3VzXG4gICAgY29tcG9uZW50Lm5leHQgPSBuZXh0XG5cbiAgICBpZiBwYXJlbnRDb250YWluZXJcbiAgICAgIHByZXZpb3VzLm5leHQgPSBjb21wb25lbnQgaWYgcHJldmlvdXNcbiAgICAgIG5leHQucHJldmlvdXMgPSBjb21wb25lbnQgaWYgbmV4dFxuICAgICAgcGFyZW50Q29udGFpbmVyLmZpcnN0ID0gY29tcG9uZW50IHVubGVzcyBjb21wb25lbnQucHJldmlvdXM/XG4gICAgICBwYXJlbnRDb250YWluZXIubGFzdCA9IGNvbXBvbmVudCB1bmxlc3MgY29tcG9uZW50Lm5leHQ/XG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5pbWFnZVNlcnZpY2UgPSByZXF1aXJlKCcuLi9pbWFnZV9zZXJ2aWNlcy9pbWFnZV9zZXJ2aWNlJylcblxuRWRpdGFibGVEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2VkaXRhYmxlX2RpcmVjdGl2ZScpXG5JbWFnZURpcmVjdGl2ZSA9IHJlcXVpcmUoJy4vaW1hZ2VfZGlyZWN0aXZlJylcbkh0bWxEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2h0bWxfZGlyZWN0aXZlJylcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gIGNyZWF0ZTogKHsgY29tcG9uZW50LCB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIERpcmVjdGl2ZSA9IEBnZXREaXJlY3RpdmVDb25zdHJ1Y3Rvcih0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlKVxuICAgIG5ldyBEaXJlY3RpdmUoeyBjb21wb25lbnQsIHRlbXBsYXRlRGlyZWN0aXZlIH0pXG5cblxuICBnZXREaXJlY3RpdmVDb25zdHJ1Y3RvcjogKGRpcmVjdGl2ZVR5cGUpIC0+XG4gICAgc3dpdGNoIGRpcmVjdGl2ZVR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJ1xuICAgICAgICBFZGl0YWJsZURpcmVjdGl2ZVxuICAgICAgd2hlbiAnaW1hZ2UnXG4gICAgICAgIEltYWdlRGlyZWN0aXZlXG4gICAgICB3aGVuICdodG1sJ1xuICAgICAgICBIdG1sRGlyZWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIGFzc2VydCBmYWxzZSwgXCJVbnN1cHBvcnRlZCBjb21wb25lbnQgZGlyZWN0aXZlOiAjeyBkaXJlY3RpdmVUeXBlIH1cIlxuXG4iLCJkZWVwRXF1YWwgPSByZXF1aXJlKCdkZWVwLWVxdWFsJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcbkNvbXBvbmVudENvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2NvbnRhaW5lcicpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kaXJlY3RpdmVGYWN0b3J5ID0gcmVxdWlyZSgnLi9jb21wb25lbnRfZGlyZWN0aXZlX2ZhY3RvcnknKVxuRGlyZWN0aXZlQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcblxuIyBDb21wb25lbnRNb2RlbFxuIyAtLS0tLS0tLS0tLS1cbiMgRWFjaCBDb21wb25lbnRNb2RlbCBoYXMgYSB0ZW1wbGF0ZSB3aGljaCBhbGxvd3MgdG8gZ2VuZXJhdGUgYSBjb21wb25lbnRWaWV3XG4jIGZyb20gYSBjb21wb25lbnRNb2RlbFxuI1xuIyBSZXByZXNlbnRzIGEgbm9kZSBpbiBhIENvbXBvbmVudFRyZWUuXG4jIEV2ZXJ5IENvbXBvbmVudE1vZGVsIGNhbiBoYXZlIGEgcGFyZW50IChDb21wb25lbnRDb250YWluZXIpLFxuIyBzaWJsaW5ncyAob3RoZXIgY29tcG9uZW50cykgYW5kIG11bHRpcGxlIGNvbnRhaW5lcnMgKENvbXBvbmVudENvbnRhaW5lcnMpLlxuI1xuIyBUaGUgY29udGFpbmVycyBhcmUgdGhlIHBhcmVudHMgb2YgdGhlIGNoaWxkIENvbXBvbmVudE1vZGVscy5cbiMgRS5nLiBhIGdyaWQgcm93IHdvdWxkIGhhdmUgYXMgbWFueSBjb250YWluZXJzIGFzIGl0IGhhc1xuIyBjb2x1bW5zXG4jXG4jICMgQHByb3AgcGFyZW50Q29udGFpbmVyOiBwYXJlbnQgQ29tcG9uZW50Q29udGFpbmVyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudE1vZGVsXG5cbiAgY29uc3RydWN0b3I6ICh7IEB0ZW1wbGF0ZSwgaWQgfSA9IHt9KSAtPlxuICAgIGFzc2VydCBAdGVtcGxhdGUsICdjYW5ub3QgaW5zdGFudGlhdGUgY29tcG9uZW50IHdpdGhvdXQgdGVtcGxhdGUgcmVmZXJlbmNlJ1xuXG4gICAgQGluaXRpYWxpemVEaXJlY3RpdmVzKClcbiAgICBAc3R5bGVzID0ge31cbiAgICBAZGF0YVZhbHVlcyA9IHt9XG4gICAgQGlkID0gaWQgfHwgZ3VpZC5uZXh0KClcbiAgICBAY29tcG9uZW50TmFtZSA9IEB0ZW1wbGF0ZS5uYW1lXG5cbiAgICBAbmV4dCA9IHVuZGVmaW5lZCAjIHNldCBieSBDb21wb25lbnRDb250YWluZXJcbiAgICBAcHJldmlvdXMgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50Q29udGFpbmVyXG4gICAgQGNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWQgIyBzZXQgYnkgQ29tcG9uZW50VHJlZVxuXG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICBmb3IgZGlyZWN0aXZlIGluIEB0ZW1wbGF0ZS5kaXJlY3RpdmVzXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBjb250YWluZXJzIHx8PSB7fVxuICAgICAgICAgIEBjb250YWluZXJzW2RpcmVjdGl2ZS5uYW1lXSA9IG5ldyBDb21wb25lbnRDb250YWluZXJcbiAgICAgICAgICAgIG5hbWU6IGRpcmVjdGl2ZS5uYW1lXG4gICAgICAgICAgICBwYXJlbnRDb21wb25lbnQ6IHRoaXNcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnLCAnaW1hZ2UnLCAnaHRtbCdcbiAgICAgICAgICBAY3JlYXRlQ29tcG9uZW50RGlyZWN0aXZlKGRpcmVjdGl2ZSlcbiAgICAgICAgICBAY29udGVudCB8fD0ge31cbiAgICAgICAgICBAY29udGVudFtkaXJlY3RpdmUubmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvZy5lcnJvciBcIlRlbXBsYXRlIGRpcmVjdGl2ZSB0eXBlICcjeyBkaXJlY3RpdmUudHlwZSB9JyBub3QgaW1wbGVtZW50ZWQgaW4gQ29tcG9uZW50TW9kZWxcIlxuXG5cbiAgIyBDcmVhdGUgYSBkaXJlY3RpdmUgZm9yICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJyB0ZW1wbGF0ZSBkaXJlY3RpdmVzXG4gIGNyZWF0ZUNvbXBvbmVudERpcmVjdGl2ZTogKHRlbXBsYXRlRGlyZWN0aXZlKSAtPlxuICAgIEBkaXJlY3RpdmVzLmFkZCBkaXJlY3RpdmVGYWN0b3J5LmNyZWF0ZVxuICAgICAgY29tcG9uZW50OiB0aGlzXG4gICAgICB0ZW1wbGF0ZURpcmVjdGl2ZTogdGVtcGxhdGVEaXJlY3RpdmVcblxuXG4gIGNyZWF0ZVZpZXc6IChpc1JlYWRPbmx5KSAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVWaWV3KHRoaXMsIGlzUmVhZE9ubHkpXG5cblxuICAjIENvbXBvbmVudFRyZWUgb3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAjIEluc2VydCBhIGNvbXBvbmVudCBiZWZvcmUgdGhpcyBvbmVcbiAgYmVmb3JlOiAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgY29tcG9uZW50TW9kZWxcbiAgICAgIEBwYXJlbnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMsIGNvbXBvbmVudE1vZGVsKVxuICAgICAgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBwcmV2aW91c1xuXG5cbiAgIyBJbnNlcnQgYSBjb21wb25lbnQgYWZ0ZXIgdGhpcyBvbmVcbiAgYWZ0ZXI6IChjb21wb25lbnRNb2RlbCkgLT5cbiAgICBpZiBjb21wb25lbnRNb2RlbFxuICAgICAgQHBhcmVudENvbnRhaW5lci5pbnNlcnRBZnRlcih0aGlzLCBjb21wb25lbnRNb2RlbClcbiAgICAgIHRoaXNcbiAgICBlbHNlXG4gICAgICBAbmV4dFxuXG5cbiAgIyBBcHBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgYXBwZW5kOiAoY29udGFpbmVyTmFtZSwgY29tcG9uZW50TW9kZWwpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA9PSAxXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbnRhaW5lck5hbWVcbiAgICAgIGNvbnRhaW5lck5hbWUgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIuZGVmYXVsdE5hbWVcblxuICAgIEBjb250YWluZXJzW2NvbnRhaW5lck5hbWVdLmFwcGVuZChjb21wb25lbnRNb2RlbClcbiAgICB0aGlzXG5cblxuICAjIFByZXBlbmQgYSBjb21wb25lbnQgdG8gYSBjb250YWluZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgcHJlcGVuZDogKGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgY29tcG9uZW50TW9kZWwgPSBjb250YWluZXJOYW1lXG4gICAgICBjb250YWluZXJOYW1lID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLmRlZmF1bHROYW1lXG5cbiAgICBAY29udGFpbmVyc1tjb250YWluZXJOYW1lXS5wcmVwZW5kKGNvbXBvbmVudE1vZGVsKVxuICAgIHRoaXNcblxuXG4gICMgTW92ZSB0aGlzIGNvbXBvbmVudCB1cCAocHJldmlvdXMpXG4gIHVwOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIudXAodGhpcylcbiAgICB0aGlzXG5cblxuICAjIE1vdmUgdGhpcyBjb21wb25lbnQgZG93biAobmV4dClcbiAgZG93bjogLT5cbiAgICBAcGFyZW50Q29udGFpbmVyLmRvd24odGhpcylcbiAgICB0aGlzXG5cblxuICAjIFJlbW92ZSB0aGlzIGNvbXBvbmVudCBmcm9tIGl0cyBjb250YWluZXIgYW5kIENvbXBvbmVudFRyZWVcbiAgcmVtb3ZlOiAtPlxuICAgIEBwYXJlbnRDb250YWluZXIucmVtb3ZlKHRoaXMpXG5cblxuICAjIENvbXBvbmVudFRyZWUgSXRlcmF0b3JzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICNcbiAgIyBOYXZpZ2F0ZSBhbmQgcXVlcnkgdGhlIGNvbXBvbmVudFRyZWUgcmVsYXRpdmUgdG8gdGhpcyBjb21wb25lbnQuXG5cbiAgZ2V0UGFyZW50OiAtPlxuICAgICBAcGFyZW50Q29udGFpbmVyPy5wYXJlbnRDb21wb25lbnRcblxuXG4gIHBhcmVudHM6IChjYWxsYmFjaykgLT5cbiAgICBjb21wb25lbnRNb2RlbCA9IHRoaXNcbiAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5nZXRQYXJlbnQoKSlcbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuXG5cbiAgY2hpbGRyZW46IChjYWxsYmFjaykgLT5cbiAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIEBjb250YWluZXJzXG4gICAgICBjb21wb25lbnRNb2RlbCA9IGNvbXBvbmVudENvbnRhaW5lci5maXJzdFxuICAgICAgd2hpbGUgKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjYWxsYmFjayhjb21wb25lbnRNb2RlbClcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50czogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBjb21wb25lbnRDb250YWluZXIgb2YgQGNvbnRhaW5lcnNcbiAgICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG4gICAgICB3aGlsZSAoY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKVxuICAgICAgICBjb21wb25lbnRNb2RlbC5kZXNjZW5kYW50cyhjYWxsYmFjaylcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSBjb21wb25lbnRNb2RlbC5uZXh0XG5cblxuICBkZXNjZW5kYW50c0FuZFNlbGY6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0aGlzKVxuICAgIEBkZXNjZW5kYW50cyhjYWxsYmFjaylcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgKGluY2x1ZGluZyB0aG9zZSBvZiB0aGlzIGNvbXBvbmVudE1vZGVsKVxuICBkZXNjZW5kYW50Q29udGFpbmVyczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZXNjZW5kYW50c0FuZFNlbGYgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnRNb2RlbC5jb250YWluZXJzXG4gICAgICAgIGNhbGxiYWNrKGNvbXBvbmVudENvbnRhaW5lcilcblxuXG4gICMgcmV0dXJuIGFsbCBkZXNjZW5kYW50IGNvbnRhaW5lcnMgYW5kIGNvbXBvbmVudHNcbiAgYWxsRGVzY2VuZGFudHM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVzY2VuZGFudHNBbmRTZWxmIChjb21wb25lbnRNb2RlbCkgPT5cbiAgICAgIGNhbGxiYWNrKGNvbXBvbmVudE1vZGVsKSBpZiBjb21wb25lbnRNb2RlbCAhPSB0aGlzXG4gICAgICBmb3IgbmFtZSwgY29tcG9uZW50Q29udGFpbmVyIG9mIGNvbXBvbmVudE1vZGVsLmNvbnRhaW5lcnNcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50Q29udGFpbmVyKVxuXG5cbiAgY2hpbGRyZW5BbmRTZWxmOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGhpcylcbiAgICBAY2hpbGRyZW4oY2FsbGJhY2spXG5cblxuICAjIERpcmVjdGl2ZSBPcGVyYXRpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgI1xuICAjIEV4YW1wbGUgaG93IHRvIGdldCBhbiBJbWFnZURpcmVjdGl2ZTpcbiAgIyBpbWFnZURpcmVjdGl2ZSA9IGNvbXBvbmVudE1vZGVsLmRpcmVjdGl2ZXMuZ2V0KCdpbWFnZScpXG5cbiAgaGFzQ29udGFpbmVyczogLT5cbiAgICBAZGlyZWN0aXZlcy5jb3VudCgnY29udGFpbmVyJykgPiAwXG5cblxuICBoYXNFZGl0YWJsZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2VkaXRhYmxlJykgPiAwXG5cblxuICBoYXNIdG1sOiAtPlxuICAgIEBkaXJlY3RpdmVzLmNvdW50KCdodG1sJykgPiAwXG5cblxuICBoYXNJbWFnZXM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuY291bnQoJ2ltYWdlJykgPiAwXG5cblxuICAjIHNldCB0aGUgY29udGVudCBkYXRhIGZpZWxkIG9mIHRoZSBjb21wb25lbnRcbiAgc2V0Q29udGVudDogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCB2YWx1ZVxuICAgICAgaWYgQGNvbnRlbnRbbmFtZV1cbiAgICAgICAgQGNvbnRlbnRbbmFtZV0gPSB1bmRlZmluZWRcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZSBpZiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgIGlmIEBjb250ZW50W25hbWVdICE9IHZhbHVlXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG4gICAgZWxzZVxuICAgICAgaWYgbm90IGRlZXBFcXVhbChAY29udGVudFtuYW1lXSwgdmFsdWUpXG4gICAgICAgIEBjb250ZW50W25hbWVdID0gdmFsdWVcbiAgICAgICAgQGNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKHRoaXMsIG5hbWUpIGlmIEBjb21wb25lbnRUcmVlXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJzZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIGlmIGRpcmVjdGl2ZS5pc0ltYWdlXG4gICAgICBpZiBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSAhPSB2YWx1ZVxuICAgICAgICBkaXJlY3RpdmUuc2V0SW1hZ2VVcmwodmFsdWUpXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyh0aGlzLCBuYW1lKSBpZiBAY29tcG9uZW50VHJlZVxuICAgIGVsc2VcbiAgICAgIEBzZXRDb250ZW50KG5hbWUsIHZhbHVlKVxuXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBhc3NlcnQgQGNvbnRlbnQ/Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgXCJnZXQgZXJyb3I6ICN7IEBjb21wb25lbnROYW1lIH0gaGFzIG5vIGNvbnRlbnQgbmFtZWQgI3sgbmFtZSB9XCJcblxuICAgIEBkaXJlY3RpdmVzLmdldChuYW1lKS5nZXRDb250ZW50KClcblxuXG4gICMgQ2hlY2sgaWYgYSBkaXJlY3RpdmUgaGFzIGNvbnRlbnRcbiAgaXNFbXB0eTogKG5hbWUpIC0+XG4gICAgdmFsdWUgPSBAZ2V0KG5hbWUpXG4gICAgdmFsdWUgPT0gdW5kZWZpbmVkIHx8IHZhbHVlID09ICcnXG5cblxuICAjIERhdGEgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLVxuICAjXG4gICMgU2V0IGFyYml0cmFyeSBkYXRhIHRvIGJlIHN0b3JlZCB3aXRoIHRoaXMgY29tcG9uZW50TW9kZWwuXG5cblxuICAjIGNhbiBiZSBjYWxsZWQgd2l0aCBhIHN0cmluZyBvciBhIGhhc2hcbiAgZGF0YTogKGFyZykgLT5cbiAgICBpZiB0eXBlb2YoYXJnKSA9PSAnb2JqZWN0J1xuICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzID0gW11cbiAgICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhcmdcbiAgICAgICAgaWYgQGNoYW5nZURhdGEobmFtZSwgdmFsdWUpXG4gICAgICAgICAgY2hhbmdlZERhdGFQcm9wZXJ0aWVzLnB1c2gobmFtZSlcbiAgICAgIGlmIEBjb21wb25lbnRUcmVlICYmIGNoYW5nZWREYXRhUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIEBjb21wb25lbnRUcmVlLmRhdGFDaGFuZ2luZyh0aGlzLCBjaGFuZ2VkRGF0YVByb3BlcnRpZXMpXG4gICAgZWxzZVxuICAgICAgQGRhdGFWYWx1ZXNbYXJnXVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgY2hhbmdlRGF0YTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5vdCBkZWVwRXF1YWwoQGRhdGFWYWx1ZXNbbmFtZV0sIHZhbHVlKVxuICAgICAgQGRhdGFWYWx1ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cblxuICAjIFN0eWxlIE9wZXJhdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0U3R5bGU6IChuYW1lKSAtPlxuICAgIEBzdHlsZXNbbmFtZV1cblxuXG4gIHNldFN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgc3R5bGUgPSBAdGVtcGxhdGUuc3R5bGVzW25hbWVdXG4gICAgaWYgbm90IHN0eWxlXG4gICAgICBsb2cud2FybiBcIlVua25vd24gc3R5bGUgJyN7IG5hbWUgfScgaW4gQ29tcG9uZW50TW9kZWwgI3sgQGNvbXBvbmVudE5hbWUgfVwiXG4gICAgZWxzZSBpZiBub3Qgc3R5bGUudmFsaWRhdGVWYWx1ZSh2YWx1ZSlcbiAgICAgIGxvZy53YXJuIFwiSW52YWxpZCB2YWx1ZSAnI3sgdmFsdWUgfScgZm9yIHN0eWxlICcjeyBuYW1lIH0nIGluIENvbXBvbmVudE1vZGVsICN7IEBjb21wb25lbnROYW1lIH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIEBzdHlsZXNbbmFtZV0gIT0gdmFsdWVcbiAgICAgICAgQHN0eWxlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgIGlmIEBjb21wb25lbnRUcmVlXG4gICAgICAgICAgQGNvbXBvbmVudFRyZWUuaHRtbENoYW5naW5nKHRoaXMsICdzdHlsZScsIHsgbmFtZSwgdmFsdWUgfSlcblxuXG4gICMgQGRlcHJlY2F0ZWRcbiAgIyBHZXR0ZXIgYW5kIFNldHRlciBpbiBvbmUuXG4gIHN0eWxlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgY29uc29sZS5sb2coXCJDb21wb25lbnRNb2RlbCNzdHlsZSgpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgI2dldFN0eWxlKCkgYW5kICNzZXRTdHlsZSgpLlwiKVxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgQHN0eWxlc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgIEBzZXRTdHlsZShuYW1lLCB2YWx1ZSlcblxuXG4gICMgQ29tcG9uZW50TW9kZWwgT3BlcmF0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgY29weTogLT5cbiAgICBsb2cud2FybihcIkNvbXBvbmVudE1vZGVsI2NvcHkoKSBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LlwiKVxuXG4gICAgIyBzZXJpYWxpemluZy9kZXNlcmlhbGl6aW5nIHNob3VsZCB3b3JrIGJ1dCBuZWVkcyB0byBnZXQgc29tZSB0ZXN0cyBmaXJzdFxuICAgICMganNvbiA9IEB0b0pzb24oKVxuICAgICMganNvbi5pZCA9IGd1aWQubmV4dCgpXG4gICAgIyBDb21wb25lbnRNb2RlbC5mcm9tSnNvbihqc29uKVxuXG5cbiAgY29weVdpdGhvdXRDb250ZW50OiAtPlxuICAgIEB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG5cblxuICAjIEBhcGkgcHJpdmF0ZVxuICBkZXN0cm95OiAtPlxuICAgICMgdG9kbzogbW92ZSBpbnRvIHRvIHJlbmRlcmVyXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuZGVlcEVxdWFsID0gcmVxdWlyZSgnZGVlcC1lcXVhbCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5ndWlkID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9ndWlkJylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5Db21wb25lbnRNb2RlbCA9IHJlcXVpcmUoJy4vY29tcG9uZW50X21vZGVsJylcbnNlcmlhbGl6YXRpb24gPSByZXF1aXJlKCcuLi9tb2R1bGVzL3NlcmlhbGl6YXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgIyBQdWJsaWMgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tXG5cbiAgIyBTZXJpYWxpemUgYSBDb21wb25lbnRNb2RlbFxuICAjXG4gICMgRXh0ZW5kcyB0aGUgcHJvdG90eXBlIG9mIENvbXBvbmVudE1vZGVsXG4gICNcbiAgIyBFeGFtcGxlIFJlc3VsdDpcbiAgIyBpZDogJ2FrazdoanV1ZTInXG4gICMgaWRlbnRpZmllcjogJ3RpbWVsaW5lLnRpdGxlJ1xuICAjIGNvbnRlbnQ6IHsgLi4uIH1cbiAgIyBzdHlsZXM6IHsgLi4uIH1cbiAgIyBkYXRhOiB7IC4uLiB9XG4gICMgY29udGFpbmVyczogeyAuLi4gfVxuICBDb21wb25lbnRNb2RlbDo6dG9Kc29uID0gKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPz0gdGhpc1xuXG4gICAganNvbiA9XG4gICAgICBpZDogY29tcG9uZW50LmlkXG4gICAgICBpZGVudGlmaWVyOiBjb21wb25lbnQudGVtcGxhdGUuaWRlbnRpZmllclxuXG4gICAgdW5sZXNzIHNlcmlhbGl6YXRpb24uaXNFbXB0eShjb21wb25lbnQuY29udGVudClcbiAgICAgIGpzb24uY29udGVudCA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoY29tcG9uZW50LmNvbnRlbnQpXG5cbiAgICB1bmxlc3Mgc2VyaWFsaXphdGlvbi5pc0VtcHR5KGNvbXBvbmVudC5zdHlsZXMpXG4gICAgICBqc29uLnN0eWxlcyA9IHNlcmlhbGl6YXRpb24uZmxhdENvcHkoY29tcG9uZW50LnN0eWxlcylcblxuICAgIHVubGVzcyBzZXJpYWxpemF0aW9uLmlzRW1wdHkoY29tcG9uZW50LmRhdGFWYWx1ZXMpXG4gICAgICBqc29uLmRhdGEgPSAkLmV4dGVuZCh0cnVlLCB7fSwgY29tcG9uZW50LmRhdGFWYWx1ZXMpXG5cbiAgICAjIGNyZWF0ZSBhbiBhcnJheSBmb3IgZXZlcnkgY29udGFpbmVyXG4gICAgZm9yIG5hbWUgb2YgY29tcG9uZW50LmNvbnRhaW5lcnNcbiAgICAgIGpzb24uY29udGFpbmVycyB8fD0ge31cbiAgICAgIGpzb24uY29udGFpbmVyc1tuYW1lXSA9IFtdXG5cbiAgICBqc29uXG5cblxuICBmcm9tSnNvbjogKGpzb24sIGRlc2lnbikgLT5cbiAgICB0ZW1wbGF0ZSA9IGRlc2lnbi5nZXQoanNvbi5jb21wb25lbnQgfHwganNvbi5pZGVudGlmaWVyKVxuXG4gICAgYXNzZXJ0IHRlbXBsYXRlLFxuICAgICAgXCJlcnJvciB3aGlsZSBkZXNlcmlhbGl6aW5nIGNvbXBvbmVudDogdW5rbm93biB0ZW1wbGF0ZSBpZGVudGlmaWVyICcjeyBqc29uLmlkZW50aWZpZXIgfSdcIlxuXG4gICAgbW9kZWwgPSBuZXcgQ29tcG9uZW50TW9kZWwoeyB0ZW1wbGF0ZSwgaWQ6IGpzb24uaWQgfSlcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBqc29uLmNvbnRlbnRcbiAgICAgIGFzc2VydCBtb2RlbC5jb250ZW50Lmhhc093blByb3BlcnR5KG5hbWUpLFxuICAgICAgICBcImVycm9yIHdoaWxlIGRlc2VyaWFsaXppbmcgY29tcG9uZW50ICN7IG1vZGVsLmNvbXBvbmVudE5hbWUgfTogdW5rbm93biBjb250ZW50ICcjeyBuYW1lIH0nXCJcblxuICAgICAgIyBUcmFuc2Zvcm0gc3RyaW5nIGludG8gb2JqZWN0OiBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igb2xkIGltYWdlIHZhbHVlcy5cbiAgICAgIGlmIG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLnR5cGUgPT0gJ2ltYWdlJyAmJiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZydcbiAgICAgICAgbW9kZWwuY29udGVudFtuYW1lXSA9XG4gICAgICAgICAgdXJsOiB2YWx1ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RlbC5jb250ZW50W25hbWVdID0gdmFsdWVcblxuICAgIGZvciBzdHlsZU5hbWUsIHZhbHVlIG9mIGpzb24uc3R5bGVzXG4gICAgICBtb2RlbC5zZXRTdHlsZShzdHlsZU5hbWUsIHZhbHVlKVxuXG4gICAgbW9kZWwuZGF0YShqc29uLmRhdGEpIGlmIGpzb24uZGF0YVxuXG4gICAgZm9yIGNvbnRhaW5lck5hbWUsIGNvbXBvbmVudEFycmF5IG9mIGpzb24uY29udGFpbmVyc1xuICAgICAgYXNzZXJ0IG1vZGVsLmNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoY29udGFpbmVyTmFtZSksXG4gICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IHVua25vd24gY29udGFpbmVyICN7IGNvbnRhaW5lck5hbWUgfVwiXG5cbiAgICAgIGlmIGNvbXBvbmVudEFycmF5XG4gICAgICAgIGFzc2VydCAkLmlzQXJyYXkoY29tcG9uZW50QXJyYXkpLFxuICAgICAgICAgIFwiZXJyb3Igd2hpbGUgZGVzZXJpYWxpemluZyBjb21wb25lbnQ6IGNvbnRhaW5lciBpcyBub3QgYXJyYXkgI3sgY29udGFpbmVyTmFtZSB9XCJcbiAgICAgICAgZm9yIGNoaWxkIGluIGNvbXBvbmVudEFycmF5XG4gICAgICAgICAgbW9kZWwuYXBwZW5kKCBjb250YWluZXJOYW1lLCBAZnJvbUpzb24oY2hpbGQsIGRlc2lnbikgKVxuXG4gICAgbW9kZWxcblxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5hc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbkNvbXBvbmVudENvbnRhaW5lciA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2NvbnRhaW5lcicpXG5Db21wb25lbnRBcnJheSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X2FycmF5JylcbkNvbXBvbmVudE1vZGVsID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWwnKVxuY29tcG9uZW50TW9kZWxTZXJpYWxpemVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRfbW9kZWxfc2VyaWFsaXplcicpXG5cbiMgQ29tcG9uZW50VHJlZVxuIyAtLS0tLS0tLS0tLVxuIyBMaXZpbmdkb2NzIGVxdWl2YWxlbnQgdG8gdGhlIERPTSB0cmVlLlxuIyBBIGNvbXBvbmVudFRyZWUgY29udGFpbmVzIGFsbCB0aGUgY29tcG9uZW50cyBvZiBhIHBhZ2UgaW4gaGllcmFyY2hpY2FsIG9yZGVyLlxuI1xuIyBUaGUgcm9vdCBvZiB0aGUgQ29tcG9uZW50VHJlZSBpcyBhIENvbXBvbmVudENvbnRhaW5lci4gQSBDb21wb25lbnRDb250YWluZXJcbiMgY29udGFpbnMgYSBsaXN0IG9mIGNvbXBvbmVudHMuXG4jXG4jIGNvbXBvbmVudHMgY2FuIGhhdmUgbXVsdGlibGUgQ29tcG9uZW50Q29udGFpbmVycyB0aGVtc2VsdmVzLlxuI1xuIyAjIyMgRXhhbXBsZTpcbiMgICAgIC0gQ29tcG9uZW50Q29udGFpbmVyIChyb290KVxuIyAgICAgICAtIENvbXBvbmVudCAnSGVybydcbiMgICAgICAgLSBDb21wb25lbnQgJzIgQ29sdW1ucydcbiMgICAgICAgICAtIENvbXBvbmVudENvbnRhaW5lciAnbWFpbidcbiMgICAgICAgICAgIC0gQ29tcG9uZW50ICdUaXRsZSdcbiMgICAgICAgICAtIENvbXBvbmVudENvbnRhaW5lciAnc2lkZWJhcidcbiMgICAgICAgICAgIC0gQ29tcG9uZW50ICdJbmZvLUJveCcnXG4jXG4jICMjIyBFdmVudHM6XG4jIFRoZSBmaXJzdCBzZXQgb2YgQ29tcG9uZW50VHJlZSBFdmVudHMgYXJlIGNvbmNlcm5lZCB3aXRoIGxheW91dCBjaGFuZ2VzIGxpa2VcbiMgYWRkaW5nLCByZW1vdmluZyBvciBtb3ZpbmcgY29tcG9uZW50cy5cbiNcbiMgQ29uc2lkZXI6IEhhdmUgYSBkb2N1bWVudEZyYWdtZW50IGFzIHRoZSByb290Tm9kZSBpZiBubyByb290Tm9kZSBpcyBnaXZlblxuIyBtYXliZSB0aGlzIHdvdWxkIGhlbHAgc2ltcGxpZnkgc29tZSBjb2RlIChzaW5jZSBjb21wb25lbnRzIGFyZSBhbHdheXNcbiMgYXR0YWNoZWQgdG8gdGhlIERPTSkuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENvbXBvbmVudFRyZWVcblxuXG4gIGNvbnN0cnVjdG9yOiAoeyBjb250ZW50LCBAZGVzaWduIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgQGRlc2lnbj8sIFwiRXJyb3IgaW5zdGFudGlhdGluZyBDb21wb25lbnRUcmVlOiBkZXNpZ24gcGFyYW0gaXMgbWlzc3NpbmcuXCJcbiAgICBAcm9vdCA9IG5ldyBDb21wb25lbnRDb250YWluZXIoaXNSb290OiB0cnVlKVxuXG4gICAgIyBpbml0aWFsaXplIGNvbnRlbnQgYmVmb3JlIHdlIHNldCB0aGUgY29tcG9uZW50VHJlZSB0byB0aGUgcm9vdFxuICAgICMgb3RoZXJ3aXNlIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkIHdoaWxlIGJ1aWxkaW5nIHRoZSB0cmVlXG4gICAgQGZyb21Kc29uKGNvbnRlbnQsIEBkZXNpZ24pIGlmIGNvbnRlbnQ/XG5cbiAgICBAcm9vdC5jb21wb25lbnRUcmVlID0gdGhpc1xuICAgIEBpbml0aWFsaXplRXZlbnRzKClcblxuXG4gICMgSW5zZXJ0IGEgY29tcG9uZW50IGF0IHRoZSBiZWdpbm5pbmcuXG4gICMgQHBhcmFtOiBjb21wb25lbnRNb2RlbCBpbnN0YW5jZSBvciBjb21wb25lbnQgbmFtZSBlLmcuICd0aXRsZSdcbiAgcHJlcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5wcmVwZW5kKGNvbXBvbmVudCkgaWYgY29tcG9uZW50P1xuICAgIHRoaXNcblxuXG4gICMgSW5zZXJ0IGNvbXBvbmVudCBhdCB0aGUgZW5kLlxuICAjIEBwYXJhbTogY29tcG9uZW50TW9kZWwgaW5zdGFuY2Ugb3IgY29tcG9uZW50IG5hbWUgZS5nLiAndGl0bGUnXG4gIGFwcGVuZDogKGNvbXBvbmVudCkgLT5cbiAgICBjb21wb25lbnQgPSBAZ2V0Q29tcG9uZW50KGNvbXBvbmVudClcbiAgICBAcm9vdC5hcHBlbmQoY29tcG9uZW50KSBpZiBjb21wb25lbnQ/XG4gICAgdGhpc1xuXG5cbiAgZ2V0Q29tcG9uZW50OiAoY29tcG9uZW50TmFtZSkgLT5cbiAgICBpZiB0eXBlb2YgY29tcG9uZW50TmFtZSA9PSAnc3RyaW5nJ1xuICAgICAgQGNyZWF0ZUNvbXBvbmVudChjb21wb25lbnROYW1lKVxuICAgIGVsc2VcbiAgICAgIGNvbXBvbmVudE5hbWVcblxuXG4gIGNyZWF0ZUNvbXBvbmVudDogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZ2V0VGVtcGxhdGUoY29tcG9uZW50TmFtZSlcbiAgICB0ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpIGlmIHRlbXBsYXRlXG5cblxuICBnZXRUZW1wbGF0ZTogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdGVtcGxhdGUgPSBAZGVzaWduLmdldChjb21wb25lbnROYW1lKVxuICAgIGFzc2VydCB0ZW1wbGF0ZSwgXCJDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSAjeyBjb21wb25lbnROYW1lIH1cIlxuICAgIHRlbXBsYXRlXG5cblxuICBpbml0aWFsaXplRXZlbnRzOiAoKSAtPlxuXG4gICAgIyBsYXlvdXQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRBZGRlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50UmVtb3ZlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50TW92ZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICAjIGNvbnRlbnQgY2hhbmdlc1xuICAgIEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50SHRtbENoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG4gICAgQGNvbXBvbmVudFNldHRpbmdzQ2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcbiAgICBAY29tcG9uZW50RGF0YUNoYW5nZWQgPSAkLkNhbGxiYWNrcygpXG5cbiAgICBAY2hhbmdlZCA9ICQuQ2FsbGJhY2tzKClcblxuXG4gICMgVHJhdmVyc2UgdGhlIHdob2xlIGNvbXBvbmVudFRyZWUuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBAcm9vdC5lYWNoKGNhbGxiYWNrKVxuXG5cbiAgZWFjaENvbnRhaW5lcjogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmVhY2hDb250YWluZXIoY2FsbGJhY2spXG5cblxuICAjIEdldCB0aGUgZmlyc3QgY29tcG9uZW50XG4gIGZpcnN0OiAtPlxuICAgIEByb290LmZpcnN0XG5cblxuICAjIFRyYXZlcnNlIGFsbCBjb250YWluZXJzIGFuZCBjb21wb25lbnRzXG4gIGFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEByb290LmFsbChjYWxsYmFjaylcblxuXG4gIGZpbmQ6IChzZWFyY2gpIC0+XG4gICAgaWYgdHlwZW9mIHNlYXJjaCA9PSAnc3RyaW5nJ1xuICAgICAgcmVzID0gW11cbiAgICAgIEBlYWNoIChjb21wb25lbnQpIC0+XG4gICAgICAgIGlmIGNvbXBvbmVudC5jb21wb25lbnROYW1lID09IHNlYXJjaFxuICAgICAgICAgIHJlcy5wdXNoKGNvbXBvbmVudClcblxuICAgICAgbmV3IENvbXBvbmVudEFycmF5KHJlcylcbiAgICBlbHNlXG4gICAgICBuZXcgQ29tcG9uZW50QXJyYXkoKVxuXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByb290LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcbiAgICBAZWFjaCAoY29tcG9uZW50KSAtPlxuICAgICAgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPSB1bmRlZmluZWRcblxuICAgIG9sZFJvb3QgPSBAcm9vdFxuICAgIEByb290ID0gbmV3IENvbXBvbmVudENvbnRhaW5lcihpc1Jvb3Q6IHRydWUpXG5cbiAgICBvbGRSb290XG5cblxuICAjIGVhY2hXaXRoUGFyZW50czogKGNvbXBvbmVudCwgcGFyZW50cykgLT5cbiAgIyAgIHBhcmVudHMgfHw9IFtdXG5cbiAgIyAgICMgdHJhdmVyc2VcbiAgIyAgIHBhcmVudHMgPSBwYXJlbnRzLnB1c2goY29tcG9uZW50KVxuICAjICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAjICAgICBjb21wb25lbnQgPSBjb21wb25lbnRDb250YWluZXIuZmlyc3RcblxuICAjICAgICB3aGlsZSAoY29tcG9uZW50KVxuICAjICAgICAgIEBlYWNoV2l0aFBhcmVudHMoY29tcG9uZW50LCBwYXJlbnRzKVxuICAjICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5uZXh0XG5cbiAgIyAgIHBhcmVudHMuc3BsaWNlKC0xKVxuXG5cbiAgIyByZXR1cm5zIGEgcmVhZGFibGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gIHByaW50OiAoKSAtPlxuICAgIG91dHB1dCA9ICdDb21wb25lbnRUcmVlXFxuLS0tLS0tLS0tLS1cXG4nXG5cbiAgICBhZGRMaW5lID0gKHRleHQsIGluZGVudGF0aW9uID0gMCkgLT5cbiAgICAgIG91dHB1dCArPSBcIiN7IEFycmF5KGluZGVudGF0aW9uICsgMSkuam9pbihcIiBcIikgfSN7IHRleHQgfVxcblwiXG5cbiAgICB3YWxrZXIgPSAoY29tcG9uZW50LCBpbmRlbnRhdGlvbiA9IDApIC0+XG4gICAgICB0ZW1wbGF0ZSA9IGNvbXBvbmVudC50ZW1wbGF0ZVxuICAgICAgYWRkTGluZShcIi0gI3sgdGVtcGxhdGUubGFiZWwgfSAoI3sgdGVtcGxhdGUubmFtZSB9KVwiLCBpbmRlbnRhdGlvbilcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBhZGRMaW5lKFwiI3sgbmFtZSB9OlwiLCBpbmRlbnRhdGlvbiArIDIpXG4gICAgICAgIHdhbGtlcihjb21wb25lbnRDb250YWluZXIuZmlyc3QsIGluZGVudGF0aW9uICsgNCkgaWYgY29tcG9uZW50Q29udGFpbmVyLmZpcnN0XG5cbiAgICAgICMgdHJhdmVyc2Ugc2libGluZ3NcbiAgICAgIHdhbGtlcihjb21wb25lbnQubmV4dCwgaW5kZW50YXRpb24pIGlmIGNvbXBvbmVudC5uZXh0XG5cbiAgICB3YWxrZXIoQHJvb3QuZmlyc3QpIGlmIEByb290LmZpcnN0XG4gICAgcmV0dXJuIG91dHB1dFxuXG5cbiAgIyBUcmVlIENoYW5nZSBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBSYWlzZSBldmVudHMgZm9yIEFkZCwgUmVtb3ZlIGFuZCBNb3ZlIG9mIGNvbXBvbmVudHNcbiAgIyBUaGVzZSBmdW5jdGlvbnMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGJ5IGNvbXBvbmVudENvbnRhaW5lcnNcblxuICBhdHRhY2hpbmdDb21wb25lbnQ6IChjb21wb25lbnQsIGF0dGFjaENvbXBvbmVudEZ1bmMpIC0+XG4gICAgaWYgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPT0gdGhpc1xuICAgICAgIyBtb3ZlIGNvbXBvbmVudFxuICAgICAgYXR0YWNoQ29tcG9uZW50RnVuYygpXG4gICAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRNb3ZlZCcsIGNvbXBvbmVudClcbiAgICBlbHNlXG4gICAgICBpZiBjb21wb25lbnQuY29tcG9uZW50VHJlZT9cbiAgICAgICAgY29tcG9uZW50LnJlbW92ZSgpICMgcmVtb3ZlIGZyb20gb3RoZXIgY29tcG9uZW50VHJlZVxuXG4gICAgICBjb21wb25lbnQuZGVzY2VuZGFudHNBbmRTZWxmIChkZXNjZW5kYW50KSA9PlxuICAgICAgICBkZXNjZW5kYW50LmNvbXBvbmVudFRyZWUgPSB0aGlzXG5cbiAgICAgIGF0dGFjaENvbXBvbmVudEZ1bmMoKVxuICAgICAgQGZpcmVFdmVudCgnY29tcG9uZW50QWRkZWQnLCBjb21wb25lbnQpXG5cblxuICBmaXJlRXZlbnQ6IChldmVudCwgYXJncy4uLikgLT5cbiAgICB0aGlzW2V2ZW50XS5maXJlLmFwcGx5KGV2ZW50LCBhcmdzKVxuICAgIEBjaGFuZ2VkLmZpcmUoKVxuXG5cbiAgZGV0YWNoaW5nQ29tcG9uZW50OiAoY29tcG9uZW50LCBkZXRhY2hDb21wb25lbnRGdW5jKSAtPlxuICAgIGFzc2VydCBjb21wb25lbnQuY29tcG9uZW50VHJlZSBpcyB0aGlzLFxuICAgICAgJ2Nhbm5vdCByZW1vdmUgY29tcG9uZW50IGZyb20gYW5vdGhlciBDb21wb25lbnRUcmVlJ1xuXG4gICAgY29tcG9uZW50LmRlc2NlbmRhbnRzQW5kU2VsZiAoZGVzY2VuZGFudHMpIC0+XG4gICAgICBkZXNjZW5kYW50cy5jb21wb25lbnRUcmVlID0gdW5kZWZpbmVkXG5cbiAgICBkZXRhY2hDb21wb25lbnRGdW5jKClcbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnRSZW1vdmVkJywgY29tcG9uZW50KVxuXG5cbiAgY29udGVudENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudENvbnRlbnRDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgaHRtbENoYW5naW5nOiAoY29tcG9uZW50KSAtPlxuICAgIEBmaXJlRXZlbnQoJ2NvbXBvbmVudEh0bWxDaGFuZ2VkJywgY29tcG9uZW50KVxuXG5cbiAgZGF0YUNoYW5naW5nOiAoY29tcG9uZW50LCBjaGFuZ2VkUHJvcGVydGllcykgLT5cbiAgICBAZmlyZUV2ZW50KCdjb21wb25lbnREYXRhQ2hhbmdlZCcsIGNvbXBvbmVudCwgY2hhbmdlZFByb3BlcnRpZXMpXG5cblxuICAjIFNlcmlhbGl6YXRpb25cbiAgIyAtLS0tLS0tLS0tLS0tXG5cbiAgcHJpbnRKc29uOiAtPlxuICAgIHdvcmRzLnJlYWRhYmxlSnNvbihAdG9Kc29uKCkpXG5cblxuICAjIFJldHVybnMgYSBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB3aG9sZSB0cmVlXG4gICMgdGhhdCBjYW4gYmUgc2VudCB0byB0aGUgc2VydmVyIGFzIEpTT04uXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkYXRhID0ge31cbiAgICBkYXRhWydjb250ZW50J10gPSBbXVxuICAgIGRhdGFbJ2Rlc2lnbiddID0geyBuYW1lOiBAZGVzaWduLm5hbWUgfVxuXG4gICAgY29tcG9uZW50VG9EYXRhID0gKGNvbXBvbmVudCwgbGV2ZWwsIGNvbnRhaW5lckFycmF5KSAtPlxuICAgICAgY29tcG9uZW50RGF0YSA9IGNvbXBvbmVudC50b0pzb24oKVxuICAgICAgY29udGFpbmVyQXJyYXkucHVzaCBjb21wb25lbnREYXRhXG4gICAgICBjb21wb25lbnREYXRhXG5cbiAgICB3YWxrZXIgPSAoY29tcG9uZW50LCBsZXZlbCwgZGF0YU9iaikgLT5cbiAgICAgIGNvbXBvbmVudERhdGEgPSBjb21wb25lbnRUb0RhdGEoY29tcG9uZW50LCBsZXZlbCwgZGF0YU9iailcblxuICAgICAgIyB0cmF2ZXJzZSBjaGlsZHJlblxuICAgICAgZm9yIG5hbWUsIGNvbXBvbmVudENvbnRhaW5lciBvZiBjb21wb25lbnQuY29udGFpbmVyc1xuICAgICAgICBjb250YWluZXJBcnJheSA9IGNvbXBvbmVudERhdGEuY29udGFpbmVyc1tjb21wb25lbnRDb250YWluZXIubmFtZV0gPSBbXVxuICAgICAgICB3YWxrZXIoY29tcG9uZW50Q29udGFpbmVyLmZpcnN0LCBsZXZlbCArIDEsIGNvbnRhaW5lckFycmF5KSBpZiBjb21wb25lbnRDb250YWluZXIuZmlyc3RcblxuICAgICAgIyB0cmF2ZXJzZSBzaWJsaW5nc1xuICAgICAgd2Fsa2VyKGNvbXBvbmVudC5uZXh0LCBsZXZlbCwgZGF0YU9iaikgaWYgY29tcG9uZW50Lm5leHRcblxuICAgIHdhbGtlcihAcm9vdC5maXJzdCwgMCwgZGF0YVsnY29udGVudCddKSBpZiBAcm9vdC5maXJzdFxuXG4gICAgZGF0YVxuXG5cbiAgIyBJbml0aWFsaXplIGEgY29tcG9uZW50VHJlZVxuICAjIFRoaXMgbWV0aG9kIHN1cHByZXNzZXMgY2hhbmdlIGV2ZW50cyBpbiB0aGUgY29tcG9uZW50VHJlZS5cbiAgI1xuICAjIENvbnNpZGVyIHRvIGNoYW5nZSBwYXJhbXM6XG4gICMgZnJvbURhdGEoeyBjb250ZW50LCBkZXNpZ24sIHNpbGVudCB9KSAjIHNpbGVudCBbYm9vbGVhbl06IHN1cHByZXNzIGNoYW5nZSBldmVudHNcbiAgZnJvbURhdGE6IChkYXRhLCBkZXNpZ24sIHNpbGVudD10cnVlKSAtPlxuICAgIGlmIGRlc2lnbj9cbiAgICAgIGFzc2VydCBub3QgQGRlc2lnbj8gfHwgZGVzaWduLmVxdWFscyhAZGVzaWduKSwgJ0Vycm9yIGxvYWRpbmcgZGF0YS4gU3BlY2lmaWVkIGRlc2lnbiBpcyBkaWZmZXJlbnQgZnJvbSBjdXJyZW50IGNvbXBvbmVudFRyZWUgZGVzaWduJ1xuICAgIGVsc2VcbiAgICAgIGRlc2lnbiA9IEBkZXNpZ25cblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3QuY29tcG9uZW50VHJlZSA9IHVuZGVmaW5lZFxuXG4gICAgaWYgZGF0YS5jb250ZW50XG4gICAgICBmb3IgY29tcG9uZW50RGF0YSBpbiBkYXRhLmNvbnRlbnRcbiAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50TW9kZWxTZXJpYWxpemVyLmZyb21Kc29uKGNvbXBvbmVudERhdGEsIGRlc2lnbilcbiAgICAgICAgQHJvb3QuYXBwZW5kKGNvbXBvbmVudClcblxuICAgIGlmIHNpbGVudFxuICAgICAgQHJvb3QuY29tcG9uZW50VHJlZSA9IHRoaXNcbiAgICAgIEByb290LmVhY2ggKGNvbXBvbmVudCkgPT5cbiAgICAgICAgY29tcG9uZW50LmNvbXBvbmVudFRyZWUgPSB0aGlzXG5cblxuICAjIEFwcGVuZCBkYXRhIHRvIHRoaXMgY29tcG9uZW50VHJlZVxuICAjIEZpcmVzIGNvbXBvbmVudEFkZGVkIGV2ZW50IGZvciBldmVyeSBjb21wb25lbnRcbiAgYWRkRGF0YTogKGRhdGEsIGRlc2lnbikgLT5cbiAgICBAZnJvbURhdGEoZGF0YSwgZGVzaWduLCBmYWxzZSlcblxuXG4gIGFkZERhdGFXaXRoQW5pbWF0aW9uOiAoZGF0YSwgZGVsYXk9MjAwKSAtPlxuICAgIGFzc2VydCBAZGVzaWduPywgJ0Vycm9yIGFkZGluZyBkYXRhLiBDb21wb25lbnRUcmVlIGhhcyBubyBkZXNpZ24nXG5cbiAgICB0aW1lb3V0ID0gTnVtYmVyKGRlbGF5KVxuICAgIGZvciBjb21wb25lbnREYXRhIGluIGRhdGEuY29udGVudFxuICAgICAgZG8gPT5cbiAgICAgICAgY29udGVudCA9IGNvbXBvbmVudERhdGFcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudE1vZGVsU2VyaWFsaXplci5mcm9tSnNvbihjb250ZW50LCBAZGVzaWduKVxuICAgICAgICAgIEByb290LmFwcGVuZChjb21wb25lbnQpXG4gICAgICAgICwgdGltZW91dFxuXG4gICAgICB0aW1lb3V0ICs9IE51bWJlcihkZWxheSlcblxuXG4gIHRvRGF0YTogLT5cbiAgICBAc2VyaWFsaXplKClcblxuXG4gICMgQWxpYXNlc1xuICAjIC0tLS0tLS1cblxuICBmcm9tSnNvbjogKGFyZ3MuLi4pIC0+XG4gICAgQGZyb21EYXRhLmFwcGx5KHRoaXMsIGFyZ3MpXG5cblxuICB0b0pzb246IChhcmdzLi4uKSAtPlxuICAgIEB0b0RhdGEuYXBwbHkodGhpcywgYXJncylcblxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFZGl0YWJsZURpcmVjdGl2ZVxuXG4gIGNvbnN0cnVjdG9yOiAoeyBAY29tcG9uZW50LCBAdGVtcGxhdGVEaXJlY3RpdmUgfSkgLT5cbiAgICBAbmFtZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS5uYW1lXG4gICAgQHR5cGUgPSBAdGVtcGxhdGVEaXJlY3RpdmUudHlwZVxuXG5cbiAgaXNFZGl0YWJsZTogdHJ1ZVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIdG1sRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0h0bWw6IHRydWVcblxuXG4gIGdldENvbnRlbnQ6IC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4uL2ltYWdlX3NlcnZpY2VzL2ltYWdlX3NlcnZpY2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlRGlyZWN0aXZlXG5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnQsIEB0ZW1wbGF0ZURpcmVjdGl2ZSB9KSAtPlxuICAgIEBuYW1lID0gQHRlbXBsYXRlRGlyZWN0aXZlLm5hbWVcbiAgICBAdHlwZSA9IEB0ZW1wbGF0ZURpcmVjdGl2ZS50eXBlXG5cblxuICBpc0ltYWdlOiB0cnVlXG5cblxuICBzZXRDb250ZW50OiAodmFsdWUpIC0+XG4gICAgQHNldEltYWdlVXJsKHZhbHVlKVxuXG5cbiAgZ2V0Q29udGVudDogLT5cbiAgICBAZ2V0SW1hZ2VVcmwoKVxuXG5cbiAgIyBJbWFnZSBEaXJlY3RpdmUgTWV0aG9kc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgaXNCYWNrZ3JvdW5kSW1hZ2U6IChkaXJlY3RpdmUpIC0+XG4gICAgQHRlbXBsYXRlRGlyZWN0aXZlLmdldFRhZ05hbWUoKSAhPSAnaW1nJ1xuXG5cbiAgaXNJbmxpbmVJbWFnZTogKGRpcmVjdGl2ZSkgLT5cbiAgICBAdGVtcGxhdGVEaXJlY3RpdmUuZ2V0VGFnTmFtZSgpID09ICdpbWcnXG5cblxuICBzZXRCYXNlNjRJbWFnZTogKGJhc2U2NFN0cmluZykgLT5cbiAgICBAYmFzZTY0SW1hZ2UgPSBiYXNlNjRTdHJpbmdcbiAgICBAY29tcG9uZW50LmNvbXBvbmVudFRyZWUuY29udGVudENoYW5naW5nKEBjb21wb25lbnQsIEBuYW1lKSBpZiBAY29tcG9uZW50LmNvbXBvbmVudFRyZWVcblxuXG4gIHNldEltYWdlVXJsOiAodmFsdWUpIC0+XG4gICAgQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXSA/PSB7fVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0udXJsID0gdmFsdWVcblxuICAgIEByZXNldENyb3AoKVxuICAgIEBiYXNlNjRJbWFnZSA9IHVuZGVmaW5lZFxuICAgIEBwcm9jZXNzSW1hZ2VVcmwodmFsdWUpXG5cblxuICBnZXRJbWFnZVVybDogLT5cbiAgICBpbWFnZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV1cbiAgICBpZiBpbWFnZVxuICAgICAgaW1hZ2UudXJsXG4gICAgZWxzZVxuICAgICAgdW5kZWZpbmVkXG5cblxuICBnZXRJbWFnZU9iamVjdDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdXG5cblxuICBnZXRPcmlnaW5hbFVybDogLT5cbiAgICBAY29tcG9uZW50LmNvbnRlbnRbQG5hbWVdLm9yaWdpbmFsVXJsIHx8IEBnZXRJbWFnZVVybCgpXG5cblxuICBzZXRDcm9wOiAoeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBuYW1lIH0pIC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuXG4gICAgaWYgY3VycmVudFZhbHVlPy51cmw/XG4gICAgICBjdXJyZW50VmFsdWUuY3JvcCA9XG4gICAgICAgIHg6IHhcbiAgICAgICAgeTogeVxuICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgbmFtZTogbmFtZVxuXG4gICAgICBAcHJvY2Vzc0ltYWdlVXJsKGN1cnJlbnRWYWx1ZS5vcmlnaW5hbFVybCB8fCBjdXJyZW50VmFsdWUudXJsKVxuICAgICAgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlLmNvbnRlbnRDaGFuZ2luZyhAY29tcG9uZW50LCBAbmFtZSkgaWYgQGNvbXBvbmVudC5jb21wb25lbnRUcmVlXG5cblxuICByZXNldENyb3A6IC0+XG4gICAgY3VycmVudFZhbHVlID0gQGNvbXBvbmVudC5jb250ZW50W0BuYW1lXVxuICAgIGlmIGN1cnJlbnRWYWx1ZT9cbiAgICAgIGN1cnJlbnRWYWx1ZS5jcm9wID0gbnVsbFxuXG5cbiAgc2V0SW1hZ2VTZXJ2aWNlOiAoaW1hZ2VTZXJ2aWNlTmFtZSkgLT5cbiAgICBhc3NlcnQgaW1hZ2VTZXJ2aWNlLmhhcyhpbWFnZVNlcnZpY2VOYW1lKSwgXCJFcnJvcjogY291bGQgbm90IGxvYWQgaW1hZ2Ugc2VydmljZSAjeyBpbWFnZVNlcnZpY2VOYW1lIH1cIlxuXG4gICAgaW1hZ2VVcmwgPSBAZ2V0SW1hZ2VVcmwoKVxuICAgIEBjb21wb25lbnQuY29udGVudFtAbmFtZV0gPVxuICAgICAgdXJsOiBpbWFnZVVybFxuICAgICAgaW1hZ2VTZXJ2aWNlOiBpbWFnZVNlcnZpY2VOYW1lIHx8IG51bGxcblxuXG4gIGdldEltYWdlU2VydmljZU5hbWU6IC0+XG4gICAgQGdldEltYWdlU2VydmljZSgpLm5hbWVcblxuXG4gIGhhc0RlZmF1bHRJbWFnZVNlcnZpY2U6IC0+XG4gICAgQGdldEltYWdlU2VydmljZU5hbWUoKSA9PSAnZGVmYXVsdCdcblxuXG4gIGdldEltYWdlU2VydmljZTogLT5cbiAgICBzZXJ2aWNlTmFtZSA9IEBjb21wb25lbnQuY29udGVudFtAbmFtZV0/LmltYWdlU2VydmljZVxuICAgIGltYWdlU2VydmljZS5nZXQoc2VydmljZU5hbWUgfHwgdW5kZWZpbmVkKVxuXG5cbiAgcHJvY2Vzc0ltYWdlVXJsOiAodXJsKSAtPlxuICAgIGlmIG5vdCBAaGFzRGVmYXVsdEltYWdlU2VydmljZSgpXG4gICAgICBpbWdTZXJ2aWNlID0gQGdldEltYWdlU2VydmljZSgpXG4gICAgICBpbWdPYmogPSBAZ2V0SW1hZ2VPYmplY3QoKVxuICAgICAgaW1nT2JqLnVybCA9IGltZ1NlcnZpY2UuZ2V0VXJsKHVybCwgY3JvcDogaW1nT2JqLmNyb3ApXG4gICAgICBpbWdPYmoub3JpZ2luYWxVcmwgPSB1cmxcblxuIiwiIyBFbnJpY2ggdGhlIGNvbmZpZ3VyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIEVucmljaCB0aGUgY29uZmlndXJhdGlvbiB3aXRoIHNob3J0aGFuZHMgYW5kIGNvbXB1dGVkIHZhbHVlcy5cbiNcbiMgY29uZmlnLmRvY0RpcmVjdGl2ZVxuIyAgIFdpbGwgcHJlZml4IHRoZSBkaXJlY3RpdmUgYXR0cmlidXRlcyB3aXRoIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXhcbiMgICBlLmcuIGNvbmZpZy5kb2NEaXJlY3RpdmUuZWRpdGFibGUgPT0gJ2RhdGEtZG9jLWVkaXRhYmxlJ1xuI1xuIyBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwXG4jICAgQSBsb29rdXAgb2JqZWN0IGZvciBlYXNpZXIgbG9va3VwcyBvZiB0aGUgZGlyZWN0aXZlIG5hbWUgYnkgdGVtcGxhdGUgYXR0cmlidXRlLlxuIyAgIGUuZy4gY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFsnZG9jLWVkaXRhYmxlJ10gPT0gJ2VkaXRhYmxlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChjb25maWcpIC0+XG5cbiAgIyBTaG9ydGhhbmRzIGZvciBzdHVmZiB0aGF0IGlzIHVzZWQgYWxsIG92ZXIgdGhlIHBsYWNlIHRvIG1ha2VcbiAgIyBjb2RlIGFuZCBzcGVjcyBtb3JlIHJlYWRhYmxlLlxuICBjb25maWcuZG9jRGlyZWN0aXZlID0ge31cbiAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cCA9IHt9XG5cbiAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG5cbiAgICAjIENyZWF0ZSB0aGUgcmVuZGVyZWRBdHRycyBmb3IgdGhlIGRpcmVjdGl2ZXNcbiAgICAjIChwcmVwZW5kIGRpcmVjdGl2ZSBhdHRyaWJ1dGVzIHdpdGggdGhlIGNvbmZpZ3VyZWQgcHJlZml4KVxuICAgIHByZWZpeCA9IGlmIGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggdGhlbiBcIiN7IGNvbmZpZy5hdHRyaWJ1dGVQcmVmaXggfS1cIiBlbHNlICcnXG4gICAgdmFsdWUucmVuZGVyZWRBdHRyID0gXCIjeyBwcmVmaXggfSN7IHZhbHVlLmF0dHIgfVwiXG5cbiAgICBjb25maWcuZG9jRGlyZWN0aXZlW25hbWVdID0gdmFsdWUucmVuZGVyZWRBdHRyXG4gICAgY29uZmlnLnRlbXBsYXRlQXR0ckxvb2t1cFt2YWx1ZS5hdHRyXSA9IG5hbWVcblxuICBjb25maWdcbiIsImF1Z21lbnRDb25maWcgPSByZXF1aXJlKCcuL2F1Z21lbnRfY29uZmlnJylcblxuIyBDb25maWd1cmF0aW9uXG4jIC0tLS0tLS0tLS0tLS1cbm1vZHVsZS5leHBvcnRzID0gYXVnbWVudENvbmZpZyhcblxuICAjIExvYWQgY3NzIGFuZCBqcyByZXNvdXJjZXMgaW4gcGFnZXMgYW5kIGludGVyYWN0aXZlIHBhZ2VzXG4gIGxvYWRSZXNvdXJjZXM6IHRydWVcblxuICAjIENTUyBzZWxlY3RvciBmb3IgZWxlbWVudHMgKGFuZCB0aGVpciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxuICAjIHdoZW4gZm9jdXNzaW5nIG9yIGJsdXJyaW5nIGEgY29tcG9uZW50XG4gIGlnbm9yZUludGVyYWN0aW9uOiAnLmxkLWNvbnRyb2wnXG5cbiAgIyBTZXR1cCBwYXRocyB0byBsb2FkIHJlc291cmNlcyBkeW5hbWljYWxseVxuICBkZXNpZ25QYXRoOiAnL2Rlc2lnbnMnXG4gIGxpdmluZ2RvY3NDc3NGaWxlOiAnL2Fzc2V0cy9jc3MvbGl2aW5nZG9jcy5jc3MnXG5cbiAgd29yZFNlcGFyYXRvcnM6IFwiLi9cXFxcKClcXFwiJzosLjs8Pn4hIyVeJip8Kz1bXXt9YH4/XCJcblxuICAjIHN0cmluZyBjb250YWlubmcgb25seSBhIDxicj4gZm9sbG93ZWQgYnkgd2hpdGVzcGFjZXNcbiAgc2luZ2xlTGluZUJyZWFrOiAvXjxiclxccypcXC8/PlxccyokL1xuXG4gIGF0dHJpYnV0ZVByZWZpeDogJ2RhdGEnXG5cbiAgIyBFZGl0YWJsZSBjb25maWd1cmF0aW9uXG4gIGVkaXRhYmxlOlxuICAgIGFsbG93TmV3bGluZTogdHJ1ZSAjIEFsbG93IHRvIGluc2VydCBuZXdsaW5lcyB3aXRoIFNoaWZ0K0VudGVyXG4gICAgY2hhbmdlRGVsYXk6IDAgIyBEZWxheSBmb3IgdXBkYXRpbmcgdGhlIGNvbXBvbmVudCBtb2RlbHMgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHVzZXIgY2hhbmdlcy4gMCBGb3IgaW1tZWRpYXRlIHVwZGF0ZXMuIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgYnJvd3NlclNwZWxsY2hlY2s6IGZhbHNlICMgU2V0IHRoZSBzcGVsbGNoZWNrIGF0dHJpYnV0ZSBvbiBjb250ZW50ZWRpdGFibGVzIHRvICd0cnVlJyBvciAnZmFsc2UnXG4gICAgbW91c2VNb3ZlU2VsZWN0aW9uQ2hhbmdlczogZmFsc2UgIyBXaGV0aGVyIHRvIGZpcmUgY3Vyc29yIGFuZCBzZWxjdGlvbiBjaGFuZ2VzIG9uIG1vdXNlbW92ZVxuXG5cbiAgIyBJbiBjc3MgYW5kIGF0dHIgeW91IGZpbmQgZXZlcnl0aGluZyB0aGF0IGNhbiBlbmQgdXAgaW4gdGhlIGh0bWxcbiAgIyB0aGUgZW5naW5lIHNwaXRzIG91dCBvciB3b3JrcyB3aXRoLlxuXG4gICMgY3NzIGNsYXNzZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBjc3M6XG4gICAgIyBkb2N1bWVudCBjbGFzc2VzXG4gICAgc2VjdGlvbjogJ2RvYy1zZWN0aW9uJ1xuXG4gICAgIyBjb21wb25lbnQgY2xhc3Nlc1xuICAgIGNvbXBvbmVudDogJ2RvYy1jb21wb25lbnQnXG4gICAgZWRpdGFibGU6ICdkb2MtZWRpdGFibGUnXG4gICAgbm9QbGFjZWhvbGRlcjogJ2RvYy1uby1wbGFjZWhvbGRlcidcbiAgICBlbXB0eUltYWdlOiAnZG9jLWltYWdlLWVtcHR5J1xuICAgIGludGVyZmFjZTogJ2RvYy11aSdcblxuICAgICMgaGlnaGxpZ2h0IGNsYXNzZXNcbiAgICBjb21wb25lbnRIaWdobGlnaHQ6ICdkb2MtY29tcG9uZW50LWhpZ2hsaWdodCdcbiAgICBjb250YWluZXJIaWdobGlnaHQ6ICdkb2MtY29udGFpbmVyLWhpZ2hsaWdodCdcblxuICAgICMgZHJhZyAmIGRyb3BcbiAgICBkcmFnZ2VkOiAnZG9jLWRyYWdnZWQnXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyOiAnZG9jLWRyYWdnZWQtcGxhY2Vob2xkZXInXG4gICAgZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlcjogJ2RvYy1kcmFnLWNvdW50ZXInXG4gICAgZHJhZ0Jsb2NrZXI6ICdkb2MtZHJhZy1ibG9ja2VyJ1xuICAgIGRyb3BNYXJrZXI6ICdkb2MtZHJvcC1tYXJrZXInXG4gICAgYmVmb3JlRHJvcDogJ2RvYy1iZWZvcmUtZHJvcCdcbiAgICBub0Ryb3A6ICdkb2MtZHJhZy1uby1kcm9wJ1xuICAgIGFmdGVyRHJvcDogJ2RvYy1hZnRlci1kcm9wJ1xuICAgIGxvbmdwcmVzc0luZGljYXRvcjogJ2RvYy1sb25ncHJlc3MtaW5kaWNhdG9yJ1xuXG4gICAgIyB1dGlsaXR5IGNsYXNzZXNcbiAgICBwcmV2ZW50U2VsZWN0aW9uOiAnZG9jLW5vLXNlbGVjdGlvbidcbiAgICBtYXhpbWl6ZWRDb250YWluZXI6ICdkb2MtanMtbWF4aW1pemVkLWNvbnRhaW5lcidcbiAgICBpbnRlcmFjdGlvbkJsb2NrZXI6ICdkb2MtaW50ZXJhY3Rpb24tYmxvY2tlcidcblxuICAjIGF0dHJpYnV0ZXMgaW5qZWN0ZWQgYnkgdGhlIGVuZ2luZVxuICBhdHRyOlxuICAgIHRlbXBsYXRlOiAnZGF0YS1kb2MtdGVtcGxhdGUnXG4gICAgcGxhY2Vob2xkZXI6ICdkYXRhLWRvYy1wbGFjZWhvbGRlcidcblxuXG4gICMgRGlyZWN0aXZlIGRlZmluaXRpb25zXG4gICNcbiAgIyBhdHRyOiBhdHRyaWJ1dGUgdXNlZCBpbiB0ZW1wbGF0ZXMgdG8gZGVmaW5lIHRoZSBkaXJlY3RpdmVcbiAgIyByZW5kZXJlZEF0dHI6IGF0dHJpYnV0ZSB1c2VkIGluIG91dHB1dCBodG1sXG4gICMgZWxlbWVudERpcmVjdGl2ZTogZGlyZWN0aXZlIHRoYXQgdGFrZXMgY29udHJvbCBvdmVyIHRoZSBlbGVtZW50XG4gICMgICAodGhlcmUgY2FuIG9ubHkgYmUgb25lIHBlciBlbGVtZW50KVxuICAjIGRlZmF1bHROYW1lOiBkZWZhdWx0IG5hbWUgaWYgbm9uZSB3YXMgc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZVxuICBkaXJlY3RpdmVzOlxuICAgIGNvbnRhaW5lcjpcbiAgICAgIGF0dHI6ICdkb2MtY29udGFpbmVyJ1xuICAgICAgcmVuZGVyZWRBdHRyOiAnY2FsY3VsYXRlZCBsYXRlcidcbiAgICAgIGVsZW1lbnREaXJlY3RpdmU6IHRydWVcbiAgICAgIGRlZmF1bHROYW1lOiAnZGVmYXVsdCdcbiAgICBlZGl0YWJsZTpcbiAgICAgIGF0dHI6ICdkb2MtZWRpdGFibGUnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIGltYWdlOlxuICAgICAgYXR0cjogJ2RvYy1pbWFnZSdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiB0cnVlXG4gICAgICBkZWZhdWx0TmFtZTogJ2ltYWdlJ1xuICAgIGh0bWw6XG4gICAgICBhdHRyOiAnZG9jLWh0bWwnXG4gICAgICByZW5kZXJlZEF0dHI6ICdjYWxjdWxhdGVkIGxhdGVyJ1xuICAgICAgZWxlbWVudERpcmVjdGl2ZTogdHJ1ZVxuICAgICAgZGVmYXVsdE5hbWU6ICdkZWZhdWx0J1xuICAgIG9wdGlvbmFsOlxuICAgICAgYXR0cjogJ2RvYy1vcHRpb25hbCdcbiAgICAgIHJlbmRlcmVkQXR0cjogJ2NhbGN1bGF0ZWQgbGF0ZXInXG4gICAgICBlbGVtZW50RGlyZWN0aXZlOiBmYWxzZVxuXG5cbiAgYW5pbWF0aW9uczpcbiAgICBvcHRpb25hbHM6XG4gICAgICBzaG93OiAoJGVsZW0pIC0+XG4gICAgICAgICRlbGVtLnNsaWRlRG93bigyNTApXG5cbiAgICAgIGhpZGU6ICgkZWxlbSkgLT5cbiAgICAgICAgJGVsZW0uc2xpZGVVcCgyNTApXG5cblxuICBpbWFnZVNlcnZpY2VzOlxuICAgICdyZXNyYy5pdCc6XG4gICAgICBxdWFsaXR5OiA3NVxuICAgICAgaG9zdDogJ2h0dHBzOi8vYXBwLnJlc3JjLml0J1xuKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQXNzZXRzXG5cbiAgY29uc3RydWN0b3I6ICh7IEBkZXNpZ24gfSkgLT5cblxuXG4gIGxvYWRDc3M6IChjc3NMb2FkZXIsIGNiKSAtPlxuICAgIHJldHVybiBjYigpIHVubGVzcyBAY3NzP1xuICAgIGNzc1VybHMgPSBAY29udmVydFRvQWJzb2x1dGVQYXRocyhAY3NzKVxuICAgIGNzc0xvYWRlci5sb2FkKGNzc1VybHMsIGNiKVxuXG5cbiAgZ2V0QXNzZXRQYXRoOiAtPlxuICAgIFwiI3sgY29uZmlnLmRlc2lnblBhdGggfS8jeyBAZGVzaWduLm5hbWUgfVwiXG5cblxuICBjb252ZXJ0VG9BYnNvbHV0ZVBhdGhzOiAodXJscykgLT5cbiAgICAkLm1hcCB1cmxzLCAocGF0aCkgPT5cbiAgICAgICMgVVJMcyBhcmUgYWJzb2x1dGUgd2hlbiB0aGV5IGNvbnRhaW4gdHdvIGAvL2Agb3IgYmVnaW4gd2l0aCBhIGAvYFxuICAgICAgcmV0dXJuIHBhdGggaWYgL1xcL1xcLy8udGVzdChwYXRoKSB8fCAvXlxcLy8udGVzdChwYXRoKVxuXG4gICAgICAjIE5vcm1hbGl6ZSBwYXRocyB0aGF0IGJlZ2luIHdpdGggYSBgLi9cbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15bXFwuXFwvXSovLCAnJylcbiAgICAgIFwiI3sgQGdldEFzc2V0UGF0aCgpIH0vI3sgcGF0aCB9XCJcblxuXG4gICMgQHBhcmFtIHsgU3RyaW5nIG9yIEFycmF5IG9mIFN0cmluZ3MgfVxuICBhZGRDc3M6IChjc3NVcmxzKSAtPlxuICAgIEBhZGQoJ2NzcycsIGNzc1VybHMpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSBvZiBTdHJpbmdzIH1cbiAgYWRkSnM6IChqc1VybHMpIC0+XG4gICAgQGFkZCgnanMnLCBqc1VybHMpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyB9IGFzc2V0IHR5cGU6ICdqcycgb3IgJ2NzcydcbiAgIyBAcGFyYW0geyBTdHJpbmcgb3IgQXJyYXkgb2YgU3RyaW5ncyB9XG4gIGFkZDogKHR5cGUsIHVybHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyB1cmxzP1xuXG4gICAgdGhpc1t0eXBlXSA/PSBbXVxuICAgIGlmICQudHlwZSh1cmxzKSA9PSAnc3RyaW5nJ1xuICAgICAgdGhpc1t0eXBlXS5wdXNoKHVybHMpXG4gICAgZWxzZVxuICAgICAgZm9yIHVybCBpbiB1cmxzXG4gICAgICAgIHRoaXNbdHlwZV0ucHVzaCh1cmwpXG5cblxuICBoYXNDc3M6IC0+XG4gICAgQGNzcz9cblxuXG4gIGhhc0pzOiAtPlxuICAgIEBqcz9cblxuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NNb2RpZmljYXRvclByb3BlcnR5XG5cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBsYWJlbCwgQHR5cGUsIHZhbHVlLCBvcHRpb25zIH0pIC0+XG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcblxuICAgIHN3aXRjaCBAdHlwZVxuICAgICAgd2hlbiAnb3B0aW9uJ1xuICAgICAgICBhc3NlcnQgdmFsdWUsIFwiVGVtcGxhdGVTdHlsZSBlcnJvcjogbm8gJ3ZhbHVlJyBwcm92aWRlZFwiXG4gICAgICAgIEB2YWx1ZSA9IHZhbHVlXG4gICAgICB3aGVuICdzZWxlY3QnXG4gICAgICAgIGFzc2VydCBvcHRpb25zLCBcIlRlbXBsYXRlU3R5bGUgZXJyb3I6IG5vICdvcHRpb25zJyBwcm92aWRlZFwiXG4gICAgICAgIEBvcHRpb25zID0gb3B0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBsb2cuZXJyb3IgXCJUZW1wbGF0ZVN0eWxlIGVycm9yOiB1bmtub3duIHR5cGUgJyN7IEB0eXBlIH0nXCJcblxuXG4gICMgR2V0IGluc3RydWN0aW9ucyB3aGljaCBjc3MgY2xhc3NlcyB0byBhZGQgYW5kIHJlbW92ZS5cbiAgIyBXZSBkbyBub3QgY29udHJvbCB0aGUgY2xhc3MgYXR0cmlidXRlIG9mIGEgY29tcG9uZW50IERPTSBlbGVtZW50XG4gICMgc2luY2UgdGhlIFVJIG9yIG90aGVyIHNjcmlwdHMgY2FuIG1lc3Mgd2l0aCBpdCBhbnkgdGltZS4gU28gdGhlXG4gICMgaW5zdHJ1Y3Rpb25zIGFyZSBkZXNpZ25lZCBub3QgdG8gaW50ZXJmZXJlIHdpdGggb3RoZXIgY3NzIGNsYXNzZXNcbiAgIyBwcmVzZW50IGluIGFuIGVsZW1lbnRzIGNsYXNzIGF0dHJpYnV0ZS5cbiAgY3NzQ2xhc3NDaGFuZ2VzOiAodmFsdWUpIC0+XG4gICAgaWYgQHZhbGlkYXRlVmFsdWUodmFsdWUpXG4gICAgICBpZiBAdHlwZSBpcyAnb3B0aW9uJ1xuICAgICAgICByZW1vdmU6IGlmIG5vdCB2YWx1ZSB0aGVuIFtAdmFsdWVdIGVsc2UgdW5kZWZpbmVkXG4gICAgICAgIGFkZDogdmFsdWVcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHZhbHVlKVxuICAgICAgICBhZGQ6IHZhbHVlXG4gICAgZWxzZVxuICAgICAgaWYgQHR5cGUgaXMgJ29wdGlvbidcbiAgICAgICAgcmVtb3ZlOiBjdXJyZW50VmFsdWVcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcbiAgICAgIGVsc2UgaWYgQHR5cGUgaXMgJ3NlbGVjdCdcbiAgICAgICAgcmVtb3ZlOiBAb3RoZXJDbGFzc2VzKHVuZGVmaW5lZClcbiAgICAgICAgYWRkOiB1bmRlZmluZWRcblxuXG4gIHZhbGlkYXRlVmFsdWU6ICh2YWx1ZSkgLT5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdvcHRpb24nXG4gICAgICB2YWx1ZSA9PSBAdmFsdWVcbiAgICBlbHNlIGlmIEB0eXBlIGlzICdzZWxlY3QnXG4gICAgICBAY29udGFpbnNPcHRpb24odmFsdWUpXG4gICAgZWxzZVxuICAgICAgbG9nLndhcm4gXCJOb3QgaW1wbGVtZW50ZWQ6IENzc01vZGlmaWNhdG9yUHJvcGVydHkjdmFsaWRhdGVWYWx1ZSgpIGZvciB0eXBlICN7IEB0eXBlIH1cIlxuXG5cbiAgY29udGFpbnNPcHRpb246ICh2YWx1ZSkgLT5cbiAgICBmb3Igb3B0aW9uIGluIEBvcHRpb25zXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBvcHRpb24udmFsdWVcblxuICAgIGZhbHNlXG5cblxuICBvdGhlck9wdGlvbnM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbiBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG5cblxuICBvdGhlckNsYXNzZXM6ICh2YWx1ZSkgLT5cbiAgICBvdGhlcnMgPSBbXVxuICAgIGZvciBvcHRpb24gaW4gQG9wdGlvbnNcbiAgICAgIG90aGVycy5wdXNoIG9wdGlvbi52YWx1ZSBpZiBvcHRpb24udmFsdWUgaXNudCB2YWx1ZVxuXG4gICAgb3RoZXJzXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5PcmRlcmVkSGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvb3JkZXJlZF9oYXNoJylcbkFzc2V0cyA9IHJlcXVpcmUoJy4vYXNzZXRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEZXNpZ25cblxuICAjIEBwYXJhbVxuICAjICAtIG5hbWUgeyBTdHJpbmcgfSBUaGUgbmFtZSBvZiB0aGUgZGVzaWduLlxuICAjICAtIHZlcnNpb24geyBTdHJpbmcgfSBlLmcuICcxLjAuMCdcbiAgIyAgLSBhdXRob3IgeyBTdHJpbmcgfVxuICAjICAtIGRlc2NyaXB0aW9uIHsgU3RyaW5nIH1cbiAgY29uc3RydWN0b3I6ICh7IEBuYW1lLCBAdmVyc2lvbiwgQGF1dGhvciwgQGRlc2NyaXB0aW9uIH0pIC0+XG4gICAgYXNzZXJ0IEBuYW1lPywgJ0Rlc2lnbiBuZWVkcyBhIG5hbWUnXG4gICAgQGlkZW50aWZpZXIgPSBEZXNpZ24uZ2V0SWRlbnRpZmllcihAbmFtZSwgQHZlcnNpb24pXG5cbiAgICAjIHRlbXBsYXRlcyBpbiBhIHN0cnVjdHVyZWQgZm9ybWF0XG4gICAgQGdyb3VwcyA9IFtdXG5cbiAgICAjIHRlbXBsYXRlcyBieSBpZCBhbmQgc29ydGVkXG4gICAgQGNvbXBvbmVudHMgPSBuZXcgT3JkZXJlZEhhc2goKVxuICAgIEBpbWFnZVJhdGlvcyA9IHt9XG5cbiAgICAjIGFzc2V0cyByZXF1aXJlZCBieSB0aGUgZGVzaWduXG4gICAgQGFzc2V0cyA9IG5ldyBBc3NldHMoZGVzaWduOiB0aGlzKVxuXG4gICAgIyBkZWZhdWx0IGNvbXBvbmVudHNcbiAgICBAZGVmYXVsdFBhcmFncmFwaCA9IHVuZGVmaW5lZFxuICAgIEBkZWZhdWx0SW1hZ2UgPSB1bmRlZmluZWRcblxuXG4gIGVxdWFsczogKGRlc2lnbikgLT5cbiAgICBkZXNpZ24ubmFtZSA9PSBAbmFtZSAmJiBkZXNpZ24udmVyc2lvbiA9PSBAdmVyc2lvblxuXG5cbiAgIyBTaW1wbGUgaW1wbGVtZW50YXRpb24gd2l0aCBzdHJpbmcgY29tcGFyaXNvblxuICAjIENhdXRpb246IHdvbid0IHdvcmsgZm9yICcxLjEwLjAnID4gJzEuOS4wJ1xuICBpc05ld2VyVGhhbjogKGRlc2lnbikgLT5cbiAgICByZXR1cm4gdHJ1ZSB1bmxlc3MgZGVzaWduP1xuICAgIEB2ZXJzaW9uID4gKGRlc2lnbi52ZXJzaW9uIHx8ICcnKVxuXG5cbiAgZ2V0OiAoaWRlbnRpZmllcikgLT5cbiAgICBjb21wb25lbnROYW1lID0gQGdldENvbXBvbmVudE5hbWVGcm9tSWRlbnRpZmllcihpZGVudGlmaWVyKVxuICAgIEBjb21wb25lbnRzLmdldChjb21wb25lbnROYW1lKVxuXG5cbiAgZWFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEBjb21wb25lbnRzLmVhY2goY2FsbGJhY2spXG5cblxuICBhZGQ6ICh0ZW1wbGF0ZSkgLT5cbiAgICB0ZW1wbGF0ZS5zZXREZXNpZ24odGhpcylcbiAgICBAY29tcG9uZW50cy5wdXNoKHRlbXBsYXRlLm5hbWUsIHRlbXBsYXRlKVxuXG5cbiAgZ2V0Q29tcG9uZW50TmFtZUZyb21JZGVudGlmaWVyOiAoaWRlbnRpZmllcikgLT5cbiAgICB7IG5hbWUgfSA9IFRlbXBsYXRlLnBhcnNlSWRlbnRpZmllcihpZGVudGlmaWVyKVxuICAgIG5hbWVcblxuXG4gIEBnZXRJZGVudGlmaWVyOiAobmFtZSwgdmVyc2lvbikgLT5cbiAgICBpZiB2ZXJzaW9uXG4gICAgICBcIiN7IG5hbWUgfUAjeyB2ZXJzaW9uIH1cIlxuICAgIGVsc2VcbiAgICAgIFwiI3sgbmFtZSB9XCJcbiIsImFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuRGVzaWduID0gcmVxdWlyZSgnLi9kZXNpZ24nKVxuZGVzaWduUGFyc2VyID0gcmVxdWlyZSgnLi9kZXNpZ25fcGFyc2VyJylcblZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvIC0+XG5cbiAgZGVzaWduczoge31cblxuICAjIENhbiBsb2FkIGEgZGVzaWduIHN5bmNocm9ub3VzbHkgaWYgeW91IGluY2x1ZGUgdGhlXG4gICMgZGVzaWduLmpzIGZpbGUgYmVmb3JlIGxpdmluZ2RvY3MuXG4gICMgZG9jLmRlc2lnbi5sb2FkKGRlc2lnbnNbJ25hbWVPZllvdXJEZXNpZ24nXSlcbiAgI1xuICAjIFByb3Bvc2VkIGV4dGVuc2lvbnM6XG4gICMgV2lsbCBiZSBleHRlbmRlZCB0byBsb2FkIGRlc2lnbnMgcmVtb3RlbHkgZnJvbSBhIHNlcnZlcjpcbiAgIyBMb2FkIGZyb20gYSByZW1vdGUgc2VydmVyIGJ5IG5hbWUgKHNlcnZlciBoYXMgdG8gYmUgY29uZmlndXJlZCBhcyBkZWZhdWx0KVxuICAjIGRvYy5kZXNpZ24ubG9hZCgnZ2hpYmxpJylcbiAgI1xuICAjIExvYWQgZnJvbSBhIGN1c3RvbSBzZXJ2ZXI6XG4gICMgZG9jLmRlc2lnbi5sb2FkKCdodHRwOi8veW91cnNlcnZlci5pby9kZXNpZ25zL2doaWJsaS9kZXNpZ24uanNvbicpXG4gIGxvYWQ6IChkZXNpZ25TcGVjKSAtPlxuICAgIGFzc2VydCBkZXNpZ25TcGVjPywgJ2Rlc2lnbi5sb2FkKCkgd2FzIGNhbGxlZCB3aXRoIHVuZGVmaW5lZC4nXG4gICAgYXNzZXJ0IG5vdCAodHlwZW9mIGRlc2lnblNwZWMgPT0gJ3N0cmluZycpLCAnZGVzaWduLmxvYWQoKSBsb2FkaW5nIGEgZGVzaWduIGJ5IG5hbWUgaXMgbm90IGltcGxlbWVudGVkLidcblxuICAgIHZlcnNpb24gPSBWZXJzaW9uLnBhcnNlKGRlc2lnblNwZWMudmVyc2lvbilcbiAgICBkZXNpZ25JZGVudGlmaWVyID0gRGVzaWduLmdldElkZW50aWZpZXIoZGVzaWduU3BlYy5uYW1lLCB2ZXJzaW9uKVxuICAgIHJldHVybiBpZiBAaGFzKGRlc2lnbklkZW50aWZpZXIpXG5cbiAgICBkZXNpZ24gPSBkZXNpZ25QYXJzZXIucGFyc2UoZGVzaWduU3BlYylcbiAgICBpZiBkZXNpZ25cbiAgICAgIEBhZGQoZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihEZXNpZ24ucGFyc2VyLmVycm9ycylcblxuXG4gICMgQWRkIGFuIGFscmVhZHkgcGFyc2VkIGRlc2lnbi5cbiAgIyBAcGFyYW0geyBEZXNpZ24gb2JqZWN0IH1cbiAgYWRkOiAoZGVzaWduKSAtPlxuICAgIGlmIGRlc2lnbi5pc05ld2VyVGhhbihAZGVzaWduc1tkZXNpZ24ubmFtZV0pXG4gICAgICBAZGVzaWduc1tkZXNpZ24ubmFtZV0gPSBkZXNpZ25cbiAgICBAZGVzaWduc1tkZXNpZ24uaWRlbnRpZmllcl0gPSBkZXNpZ25cblxuXG4gICMgQ2hlY2sgaWYgYSBkZXNpZ24gaXMgbG9hZGVkXG4gIGhhczogKGRlc2lnbklkZW50aWZpZXIpIC0+XG4gICAgQGRlc2lnbnNbZGVzaWduSWRlbnRpZmllcl0/XG5cblxuICAjIEdldCBhIGxvYWRlZCBkZXNpZ25cbiAgIyBAcmV0dXJuIHsgRGVzaWduIG9iamVjdCB9XG4gIGdldDogKGRlc2lnbklkZW50aWZpZXIpIC0+XG4gICAgYXNzZXJ0IEBoYXMoZGVzaWduSWRlbnRpZmllciksIFwiRXJyb3I6IGRlc2lnbiAnI3sgZGVzaWduSWRlbnRpZmllciB9JyBpcyBub3QgbG9hZGVkLlwiXG4gICAgQGRlc2lnbnNbZGVzaWduSWRlbnRpZmllcl1cblxuXG4gICMgQ2xlYXIgdGhlIGNhY2hlIGlmIHlvdSB3YW50IHRvIHJlbG9hZCBkZXNpZ25zXG4gIHJlc2V0Q2FjaGU6IC0+XG4gICAgQGRlc2lnbnMgPSB7fVxuXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5qU2NoZW1lID0gcmVxdWlyZSgnanNjaGVtZScpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yID0galNjaGVtZS5uZXcoKVxuXG4jIEN1c3RvbSBWYWxpZGF0b3JzXG4jIC0tLS0tLS0tLS0tLS0tLS0tXG5cbnZhbGlkYXRvci5hZGQgJ3N0eWxlVHlwZScsICh2YWx1ZSkgLT5cbiAgdmFsdWUgPT0gJ29wdGlvbicgb3IgdmFsdWUgPT0gJ3NlbGVjdCdcblxuXG52YWxpZGF0b3IuYWRkICdzZW1WZXInLCAodmFsdWUpIC0+XG4gIFZlcnNpb24uc2VtVmVyLnRlc3QodmFsdWUpXG5cblxuIyBjc3NDbGFzc01vZGlmaWNhdG9yIHByb3BlcnRpZXMgbmVlZCBvbmUgJ0RlZmF1bHQnIG9wdGlvblxuIyB3aXRoIGFuIHVuZGVmaW5lZCB2YWx1ZS4gT3RoZXJ3aXNlIHVzZXJzIGNhbm5vdCByZXNldCB0aGVcbiMgc3R5bGUgdmlhIHRoZSBkcm9wZG93biBpbiB0aGUgVUkuXG52YWxpZGF0b3IuYWRkICdvbmUgZW1wdHkgb3B0aW9uJywgKHZhbHVlKSAtPlxuICBlbXB0eUNvdW50ID0gMFxuICBmb3IgZW50cnkgaW4gdmFsdWVcbiAgICBlbXB0eUNvdW50ICs9IDEgaWYgbm90IGVudHJ5LnZhbHVlXG5cbiAgZW1wdHlDb3VudCA9PSAxXG5cblxuIyBTY2hlbWFzXG4jIC0tLS0tLS1cblxudmFsaWRhdG9yLmFkZCAnZGVzaWduJyxcbiAgbmFtZTogJ3N0cmluZydcbiAgdmVyc2lvbjogJ3N0cmluZywgc2VtVmVyJ1xuICBhdXRob3I6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBkZXNjcmlwdGlvbjogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGFzc2V0czpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgY3NzOiAnYXJyYXkgb2Ygc3RyaW5nJ1xuICAgIGpzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgY29tcG9uZW50czogJ2FycmF5IG9mIGNvbXBvbmVudCdcbiAgY29tcG9uZW50UHJvcGVydGllczpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiB2YWxpZGF0b3IudmFsaWRhdGUoJ2NvbXBvbmVudFByb3BlcnR5JywgdmFsdWUpXG4gIGdyb3VwczogJ2FycmF5IG9mIGdyb3VwLCBvcHRpb25hbCdcbiAgZGVmYXVsdENvbXBvbmVudHM6XG4gICAgX192YWxpZGF0ZTogJ29wdGlvbmFsJ1xuICAgIHBhcmFncmFwaDogJ3N0cmluZywgb3B0aW9uYWwnXG4gICAgaW1hZ2U6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBpbWFnZVJhdGlvczpcbiAgICBfX3ZhbGlkYXRlOiAnb3B0aW9uYWwnXG4gICAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiB2YWxpZGF0b3IudmFsaWRhdGUoJ2ltYWdlUmF0aW8nLCB2YWx1ZSlcblxuXG52YWxpZGF0b3IuYWRkICdjb21wb25lbnQnLFxuICBuYW1lOiAnc3RyaW5nJ1xuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIGh0bWw6ICdzdHJpbmcnXG4gIGRpcmVjdGl2ZXM6ICdvYmplY3QsIG9wdGlvbmFsJ1xuICBwcm9wZXJ0aWVzOiAnYXJyYXkgb2Ygc3RyaW5nLCBvcHRpb25hbCdcbiAgX19hZGRpdGlvbmFsUHJvcGVydHk6IChrZXksIHZhbHVlKSAtPiBmYWxzZVxuXG5cbnZhbGlkYXRvci5hZGQgJ2dyb3VwJyxcbiAgbGFiZWw6ICdzdHJpbmcnXG4gIGNvbXBvbmVudHM6ICdhcnJheSBvZiBzdHJpbmcnXG5cblxuIyB0b2RvOiByZW5hbWUgdHlwZSBhbmQgdXNlIHR5cGUgdG8gaWRlbnRpZnkgdGhlIGNvbXBvbmVudFByb3BlcnR5IHR5cGUgbGlrZSBjc3NDbGFzc1xudmFsaWRhdG9yLmFkZCAnY29tcG9uZW50UHJvcGVydHknLFxuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIHR5cGU6ICdzdHJpbmcsIHN0eWxlVHlwZSdcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuICBvcHRpb25zOiAnYXJyYXkgb2Ygc3R5bGVPcHRpb24sIG9uZSBlbXB0eSBvcHRpb24sIG9wdGlvbmFsJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ2ltYWdlUmF0aW8nLFxuICBsYWJlbDogJ3N0cmluZywgb3B0aW9uYWwnXG4gIHJhdGlvOiAnc3RyaW5nJ1xuXG5cbnZhbGlkYXRvci5hZGQgJ3N0eWxlT3B0aW9uJyxcbiAgY2FwdGlvbjogJ3N0cmluZydcbiAgdmFsdWU6ICdzdHJpbmcsIG9wdGlvbmFsJ1xuXG4iLCJsb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuZGVzaWduQ29uZmlnU2NoZW1hID0gcmVxdWlyZSgnLi9kZXNpZ25fY29uZmlnX3NjaGVtYScpXG5Dc3NNb2RpZmljYXRvclByb3BlcnR5ID0gcmVxdWlyZSgnLi9jc3NfbW9kaWZpY2F0b3JfcHJvcGVydHknKVxuVGVtcGxhdGUgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZS90ZW1wbGF0ZScpXG5EZXNpZ24gPSByZXF1aXJlKCcuL2Rlc2lnbicpXG5WZXJzaW9uID0gcmVxdWlyZSgnLi92ZXJzaW9uJylcbkltYWdlUmF0aW8gPSByZXF1aXJlKCcuL2ltYWdlX3JhdGlvJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlc2lnblBhcnNlciA9XG5cbiAgcGFyc2U6IChkZXNpZ25Db25maWcpIC0+XG4gICAgQGRlc2lnbiA9IHVuZGVmaW5lZFxuICAgIGlmIGRlc2lnbkNvbmZpZ1NjaGVtYS52YWxpZGF0ZSgnZGVzaWduJywgZGVzaWduQ29uZmlnKVxuICAgICAgQGNyZWF0ZURlc2lnbihkZXNpZ25Db25maWcpXG4gICAgZWxzZVxuICAgICAgZXJyb3JzID0gZGVzaWduQ29uZmlnU2NoZW1hLmdldEVycm9yTWVzc2FnZXMoKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycylcblxuXG4gIGNyZWF0ZURlc2lnbjogKGRlc2lnbkNvbmZpZykgLT5cbiAgICB7IGFzc2V0cywgY29tcG9uZW50cywgY29tcG9uZW50UHJvcGVydGllcywgZ3JvdXBzLCBkZWZhdWx0Q29tcG9uZW50cywgaW1hZ2VSYXRpb3MgfSA9IGRlc2lnbkNvbmZpZ1xuICAgIHRyeVxuICAgICAgQGRlc2lnbiA9IEBwYXJzZURlc2lnbkluZm8oZGVzaWduQ29uZmlnKVxuICAgICAgQHBhcnNlQXNzZXRzKGFzc2V0cylcbiAgICAgIEBwYXJzZUNvbXBvbmVudFByb3BlcnRpZXMoY29tcG9uZW50UHJvcGVydGllcylcbiAgICAgIEBwYXJzZUltYWdlUmF0aW9zKGltYWdlUmF0aW9zKVxuICAgICAgQHBhcnNlQ29tcG9uZW50cyhjb21wb25lbnRzKVxuICAgICAgQHBhcnNlR3JvdXBzKGdyb3VwcylcbiAgICAgIEBwYXJzZURlZmF1bHRzKGRlZmF1bHRDb21wb25lbnRzKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBlcnJvci5tZXNzYWdlID0gXCJFcnJvciBjcmVhdGluZyB0aGUgZGVzaWduOiAjeyBlcnJvci5tZXNzYWdlIH1cIlxuICAgICAgdGhyb3cgZXJyb3JcblxuICAgIEBkZXNpZ25cblxuXG4gIHBhcnNlRGVzaWduSW5mbzogKGRlc2lnbikgLT5cbiAgICB2ZXJzaW9uID0gbmV3IFZlcnNpb24oZGVzaWduLnZlcnNpb24pXG4gICAgbmV3IERlc2lnblxuICAgICAgbmFtZTogZGVzaWduLm5hbWVcbiAgICAgIHZlcnNpb246IHZlcnNpb24udG9TdHJpbmcoKVxuXG5cbiAgcGFyc2VBc3NldHM6IChhc3NldHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBhc3NldHM/XG4gICAgQGRlc2lnbi5hc3NldHMuYWRkQ3NzKGFzc2V0cy5jc3MpXG4gICAgQGRlc2lnbi5hc3NldHMuYWRkSnMoYXNzZXRzLmpzKVxuXG5cbiAgIyBOb3RlOiBDdXJyZW50bHkgY29tcG9uZW50UHJvcGVydGllcyBjb25zaXN0IG9ubHkgb2YgZGVzaWduIHN0eWxlc1xuICBwYXJzZUNvbXBvbmVudFByb3BlcnRpZXM6IChjb21wb25lbnRQcm9wZXJ0aWVzKSAtPlxuICAgIEBjb21wb25lbnRQcm9wZXJ0aWVzID0ge31cbiAgICBmb3IgbmFtZSwgY29uZmlnIG9mIGNvbXBvbmVudFByb3BlcnRpZXNcbiAgICAgIGNvbmZpZy5uYW1lID0gbmFtZVxuICAgICAgQGNvbXBvbmVudFByb3BlcnRpZXNbbmFtZV0gPSBAY3JlYXRlQ29tcG9uZW50UHJvcGVydHkoY29uZmlnKVxuXG5cbiAgcGFyc2VJbWFnZVJhdGlvczogKHJhdGlvcykgLT5cbiAgICBmb3IgbmFtZSwgcmF0aW8gb2YgcmF0aW9zXG4gICAgICBAZGVzaWduLmltYWdlUmF0aW9zW25hbWVdID0gbmV3IEltYWdlUmF0aW9cbiAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICBsYWJlbDogcmF0aW8ubGFiZWxcbiAgICAgICAgcmF0aW86IHJhdGlvLnJhdGlvXG5cblxuICBwYXJzZUNvbXBvbmVudHM6IChjb21wb25lbnRzPVtdKSAtPlxuICAgIGZvciB7IG5hbWUsIGxhYmVsLCBodG1sLCBwcm9wZXJ0aWVzLCBkaXJlY3RpdmVzIH0gaW4gY29tcG9uZW50c1xuICAgICAgcHJvcGVydGllcyA9IEBsb29rdXBDb21wb25lbnRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG5cbiAgICAgIGNvbXBvbmVudCA9IG5ldyBUZW1wbGF0ZVxuICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgIGxhYmVsOiBsYWJlbFxuICAgICAgICBodG1sOiBodG1sXG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXNcblxuICAgICAgQHBhcnNlRGlyZWN0aXZlcyhjb21wb25lbnQsIGRpcmVjdGl2ZXMpXG4gICAgICBAZGVzaWduLmFkZChjb21wb25lbnQpXG5cblxuICBwYXJzZURpcmVjdGl2ZXM6IChjb21wb25lbnQsIGRpcmVjdGl2ZXMpIC0+XG4gICAgZm9yIG5hbWUsIGNvbmYgb2YgZGlyZWN0aXZlc1xuICAgICAgZGlyZWN0aXZlID0gY29tcG9uZW50LmRpcmVjdGl2ZXMuZ2V0KG5hbWUpXG4gICAgICBhc3NlcnQgZGlyZWN0aXZlLCBcIkNvdWxkIG5vdCBmaW5kIGRpcmVjdGl2ZSAjeyBuYW1lIH0gaW4gI3sgY29tcG9uZW50Lm5hbWUgfSBjb21wb25lbnQuXCJcbiAgICAgIGRpcmVjdGl2ZUNvbmZpZyA9XG4gICAgICAgIGltYWdlUmF0aW9zOiBAbG9va3VwSW1hZ2VSYXRpb3MoY29uZi5pbWFnZVJhdGlvcylcbiAgICAgIGRpcmVjdGl2ZS5zZXRDb25maWcoZGlyZWN0aXZlQ29uZmlnKVxuXG5cbiAgbG9va3VwQ29tcG9uZW50UHJvcGVydGllczogKHByb3BlcnR5TmFtZXMpIC0+XG4gICAgcHJvcGVydGllcyA9IHt9XG4gICAgZm9yIG5hbWUgaW4gcHJvcGVydHlOYW1lcyB8fCBbXVxuICAgICAgcHJvcGVydHkgPSBAY29tcG9uZW50UHJvcGVydGllc1tuYW1lXVxuICAgICAgYXNzZXJ0IHByb3BlcnR5LCBcIlRoZSBjb21wb25lbnRQcm9wZXJ0eSAnI3sgbmFtZSB9JyB3YXMgbm90IGZvdW5kLlwiXG4gICAgICBwcm9wZXJ0aWVzW25hbWVdID0gcHJvcGVydHlcblxuICAgIHByb3BlcnRpZXNcblxuXG4gIGxvb2t1cEltYWdlUmF0aW9zOiAocmF0aW9OYW1lcykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJhdGlvTmFtZXM/XG4gICAgQG1hcEFycmF5IHJhdGlvTmFtZXMsIChuYW1lKSA9PlxuICAgICAgcmF0aW8gPSBAZGVzaWduLmltYWdlUmF0aW9zW25hbWVdXG4gICAgICBhc3NlcnQgcmF0aW8sIFwiVGhlIGltYWdlUmF0aW8gJyN7IG5hbWUgfScgd2FzIG5vdCBmb3VuZC5cIlxuICAgICAgcmF0aW9cblxuXG4gIHBhcnNlR3JvdXBzOiAoZ3JvdXBzPVtdKSAtPlxuICAgIGZvciBncm91cCBpbiBncm91cHNcbiAgICAgIGNvbXBvbmVudHMgPSBmb3IgY29tcG9uZW50TmFtZSBpbiBncm91cC5jb21wb25lbnRzXG4gICAgICAgIEBkZXNpZ24uZ2V0KGNvbXBvbmVudE5hbWUpXG5cbiAgICAgIEBkZXNpZ24uZ3JvdXBzLnB1c2hcbiAgICAgICAgbGFiZWw6IGdyb3VwLmxhYmVsXG4gICAgICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHNcblxuXG4gIHBhcnNlRGVmYXVsdHM6IChkZWZhdWx0Q29tcG9uZW50cykgLT5cbiAgICByZXR1cm4gdW5sZXNzIGRlZmF1bHRDb21wb25lbnRzP1xuICAgIHsgcGFyYWdyYXBoLCBpbWFnZSB9ID0gZGVmYXVsdENvbXBvbmVudHNcbiAgICBAZGVzaWduLmRlZmF1bHRQYXJhZ3JhcGggPSBAZ2V0Q29tcG9uZW50KHBhcmFncmFwaCkgaWYgcGFyYWdyYXBoXG4gICAgQGRlc2lnbi5kZWZhdWx0SW1hZ2UgPSBAZ2V0Q29tcG9uZW50KGltYWdlKSBpZiBpbWFnZVxuXG5cbiAgZ2V0Q29tcG9uZW50OiAobmFtZSkgLT5cbiAgICBjb21wb25lbnQgPSBAZGVzaWduLmdldChuYW1lKVxuICAgIGFzc2VydCBjb21wb25lbnQsIFwiQ291bGQgbm90IGZpbmQgY29tcG9uZW50ICN7IG5hbWUgfVwiXG4gICAgY29tcG9uZW50XG5cblxuICBjcmVhdGVDb21wb25lbnRQcm9wZXJ0eTogKHN0eWxlRGVmaW5pdGlvbikgLT5cbiAgICBuZXcgQ3NzTW9kaWZpY2F0b3JQcm9wZXJ0eShzdHlsZURlZmluaXRpb24pXG5cblxuICBtYXBBcnJheTogKGVudHJpZXMsIGxvb2t1cCkgLT5cbiAgICBuZXdBcnJheSA9IFtdXG4gICAgZm9yIGVudHJ5IGluIGVudHJpZXNcbiAgICAgIHZhbCA9IGxvb2t1cChlbnRyeSlcbiAgICAgIG5ld0FycmF5LnB1c2godmFsKSBpZiB2YWw/XG5cbiAgICBuZXdBcnJheVxuXG5cbkRlc2lnbi5wYXJzZXIgPSBkZXNpZ25QYXJzZXJcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxud29yZHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL3dvcmRzJylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUmF0aW9cblxuICByYXRpb1N0cmluZyA9IC8oXFxkKylbXFwvOnhdKFxcZCspL1xuXG4gIGNvbnN0cnVjdG9yOiAoeyBAbmFtZSwgbGFiZWwsIHJhdGlvIH0pIC0+XG4gICAgQGxhYmVsID0gbGFiZWwgfHwgd29yZHMuaHVtYW5pemUoIEBuYW1lIClcbiAgICBAcmF0aW8gPSBAcGFyc2VSYXRpbyhyYXRpbylcblxuXG4gIHBhcnNlUmF0aW86IChyYXRpbykgLT5cbiAgICBpZiAkLnR5cGUocmF0aW8pID09ICdzdHJpbmcnXG4gICAgICByZXMgPSByYXRpb1N0cmluZy5leGVjKHJhdGlvKVxuICAgICAgcmF0aW8gPSBOdW1iZXIocmVzWzFdKSAvIE51bWJlcihyZXNbMl0pXG5cbiAgICBhc3NlcnQgJC50eXBlKHJhdGlvKSA9PSAnbnVtYmVyJywgXCJDb3VsZCBub3QgcGFyc2UgaW1hZ2UgcmF0aW8gI3sgcmF0aW8gfVwiXG4gICAgcmF0aW9cbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVmVyc2lvblxuICBAc2VtVmVyOiAgLyhcXGQrKVxcLihcXGQrKVxcLihcXGQrKSguKyk/L1xuXG4gIGNvbnN0cnVjdG9yOiAodmVyc2lvblN0cmluZykgLT5cbiAgICBAcGFyc2VWZXJzaW9uKHZlcnNpb25TdHJpbmcpXG5cblxuICBwYXJzZVZlcnNpb246ICh2ZXJzaW9uU3RyaW5nKSAtPlxuICAgIHJlcyA9IFZlcnNpb24uc2VtVmVyLmV4ZWModmVyc2lvblN0cmluZylcbiAgICBpZiByZXNcbiAgICAgIEBtYWpvciA9IHJlc1sxXVxuICAgICAgQG1pbm9yID0gcmVzWzJdXG4gICAgICBAcGF0Y2ggPSByZXNbM11cbiAgICAgIEBhZGRlbmR1bSA9IHJlc1s0XVxuXG5cbiAgaXNWYWxpZDogLT5cbiAgICBAbWFqb3I/XG5cblxuICB0b1N0cmluZzogLT5cbiAgICBcIiN7IEBtYWpvciB9LiN7IEBtaW5vciB9LiN7IEBwYXRjaCB9I3sgQGFkZGVuZHVtIHx8ICcnIH1cIlxuXG5cbiAgQHBhcnNlOiAodmVyc2lvblN0cmluZykgLT5cbiAgICB2ID0gbmV3IFZlcnNpb24odmVyc2lvblN0cmluZylcbiAgICBpZiB2LmlzVmFsaWQoKSB0aGVuIHYudG9TdHJpbmcoKSBlbHNlICcnXG5cbiIsIm1vZHVsZS5leHBvcnRzID1cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAnZGVmYXVsdCdcblxuICAjIFNldCB2YWx1ZSB0byBhbiBpbWFnZSBvciBiYWNrZ3JvdW5kIGltYWdlIGVsZW1lbnQuXG4gICNcbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH0gTm9kZSB0byBzZXQgdGhlIGltYWdlIHRvLlxuICAjIEBwYXJhbSB7IFN0cmluZyB9IEltYWdlIHVybFxuICBzZXQ6ICgkZWxlbSwgdmFsdWUpIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIEBzZXRCYWNrZ3JvdW5kSW1hZ2UoJGVsZW0sIHZhbHVlKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXI6ICgkZWxlbSkgLT5cbiAgICBkaW0gPSBAZ2V0SW1hZ2VEaW1lbnNpb25zKCRlbGVtKVxuICAgIGltYWdlVXJsID0gXCJodHRwOi8vcGxhY2Vob2xkLml0LyN7IGRpbS53aWR0aCB9eCN7IGRpbS5oZWlnaHQgfS9CRUY1NkYvQjJFNjY4XCJcblxuXG4gICMgVGhlIGRlZmF1bHQgc2VydmljZSBkb2VzIG5vdCB0cmFuc2ZvciB0aGUgZ2l2ZW4gdXJsXG4gIGdldFVybDogKHZhbHVlKSAtPlxuICAgIHZhbHVlXG5cblxuICAjIERlZmF1bHQgSW1hZ2UgU2VydmljZSBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRJbmxpbmVJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5hdHRyKCdzcmMnLCB2YWx1ZSlcblxuXG4gIHNldEJhY2tncm91bmRJbWFnZTogKCRlbGVtLCB2YWx1ZSkgLT5cbiAgICAkZWxlbS5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCBcInVybCgjeyBAZXNjYXBlQ3NzVXJpKHZhbHVlKSB9KVwiKVxuXG5cbiAgIyBFc2NhcGUgdGhlIFVSSSBpbiBjYXNlIGludmFsaWQgY2hhcmFjdGVycyBsaWtlICcoJyBvciAnKScgYXJlIHByZXNlbnQuXG4gICMgVGhlIGVzY2FwaW5nIG9ubHkgaGFwcGVucyBpZiBpdCBpcyBuZWVkZWQgc2luY2UgdGhpcyBkb2VzIG5vdCB3b3JrIGluIG5vZGUuXG4gICMgV2hlbiB0aGUgVVJJIGlzIGVzY2FwZWQgaW4gbm9kZSB0aGUgYmFja2dyb3VuZC1pbWFnZSBpcyBub3Qgd3JpdHRlbiB0byB0aGVcbiAgIyBzdHlsZSBhdHRyaWJ1dGUuXG4gIGVzY2FwZUNzc1VyaTogKHVyaSkgLT5cbiAgICBpZiAvWygpXS8udGVzdCh1cmkpXG4gICAgICBcIicjeyB1cmkgfSdcIlxuICAgIGVsc2VcbiAgICAgIHVyaVxuXG5cbiAgZ2V0SW1hZ2VEaW1lbnNpb25zOiAoJGVsZW0pIC0+XG4gICAgaWYgQGlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICB3aWR0aDogJGVsZW0ud2lkdGgoKVxuICAgICAgaGVpZ2h0OiAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoOiAkZWxlbS5vdXRlcldpZHRoKClcbiAgICAgIGhlaWdodDogJGVsZW0ub3V0ZXJIZWlnaHQoKVxuXG5cbiAgaXNCYXNlNjQ6ICh2YWx1ZSkgLT5cbiAgICB2YWx1ZS5pbmRleE9mKCdkYXRhOmltYWdlJykgPT0gMCBpZiB2YWx1ZT9cblxuXG4gIGlzSW5saW5lSW1hZ2U6ICgkZWxlbSkgLT5cbiAgICAkZWxlbVswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbWcnXG5cblxuICBpc0JhY2tncm91bmRJbWFnZTogKCRlbGVtKSAtPlxuICAgICRlbGVtWzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgIT0gJ2ltZydcblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5kZWZhdWx0SW1hZ2VTZXJ2aWNlID0gcmVxdWlyZSgnLi9kZWZhdWx0X2ltYWdlX3NlcnZpY2UnKVxucmVzcmNpdEltYWdlU2VydmljZSA9IHJlcXVpcmUoJy4vcmVzcmNpdF9pbWFnZV9zZXJ2aWNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQXZhaWxhYmxlIEltYWdlIFNlcnZpY2VzXG4gIHNlcnZpY2VzID1cbiAgICAncmVzcmMuaXQnOiByZXNyY2l0SW1hZ2VTZXJ2aWNlXG4gICAgJ2RlZmF1bHQnOiBkZWZhdWx0SW1hZ2VTZXJ2aWNlXG5cblxuICAjIFNlcnZpY2VcbiAgIyAtLS0tLS0tXG5cbiAgaGFzOiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdP1xuXG5cbiAgZ2V0OiAoc2VydmljZU5hbWUgPSAnZGVmYXVsdCcpIC0+XG4gICAgYXNzZXJ0IEBoYXMoc2VydmljZU5hbWUpLCBcIkNvdWxkIG5vdCBsb2FkIGltYWdlIHNlcnZpY2UgI3sgc2VydmljZU5hbWUgfVwiXG4gICAgc2VydmljZXNbc2VydmljZU5hbWVdXG5cblxuICBlYWNoU2VydmljZTogKGNhbGxiYWNrKSAtPlxuICAgIGZvciBuYW1lLCBzZXJ2aWNlIG9mIHNlcnZpY2VzXG4gICAgICBjYWxsYmFjayhuYW1lLCBzZXJ2aWNlKVxuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcbmltZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2RlZmF1bHRfaW1hZ2Vfc2VydmljZScpXG5yZXNyY2l0Q29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKS5pbWFnZVNlcnZpY2VzWydyZXNyYy5pdCddXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICAjIEltYWdlIFNlcnZpY2UgSW50ZXJmYWNlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBuYW1lOiAncmVzcmMuaXQnXG5cbiAgIyBAcGFyYW0geyBqUXVlcnkgb2JqZWN0IH1cbiAgIyBAcGFyYW0geyBTdHJpbmcgfSBBIHJlc3JjLml0IHVybC4gRS5nLiBodHRwOi8vYXBwLnJlc3JjLml0L2h0dHA6Ly9pbWFnZXMuY29tLzEuanBnXG4gIHNldDogKCRlbGVtLCB1cmwpIC0+XG4gICAgYXNzZXJ0IHVybD8gJiYgdXJsICE9ICcnLCAnU3JjIHZhbHVlIGZvciBhbiBpbWFnZSBoYXMgdG8gYmUgZGVmaW5lZCdcblxuICAgIHJldHVybiBAc2V0QmFzZTY0KCRlbGVtLCB1cmwpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQodXJsKVxuXG4gICAgJGVsZW0uYWRkQ2xhc3MoJ3Jlc3JjJylcbiAgICBpZiBpbWdTZXJ2aWNlLmlzSW5saW5lSW1hZ2UoJGVsZW0pXG4gICAgICBAc2V0SW5saW5lSW1hZ2UoJGVsZW0sIHVybClcbiAgICBlbHNlXG4gICAgICBAc2V0QmFja2dyb3VuZEltYWdlKCRlbGVtLCB1cmwpXG5cblxuICBzZXRQbGFjZWhvbGRlcjogKCRlbGVtKSAtPlxuICAgIGltZ1NlcnZpY2Uuc2V0UGxhY2Vob2xkZXIoJGVsZW0pXG5cblxuICBnZXRVcmw6ICh2YWx1ZSwgeyBjcm9wLCBxdWFsaXR5IH09e30pIC0+XG4gICAgc3R5bGUgPSBcIlwiXG4gICAgc3R5bGUgKz0gXCIvQz1XI3sgY3JvcC53aWR0aCB9LEgjeyBjcm9wLmhlaWdodCB9LFgjeyBjcm9wLnggfSxZI3sgY3JvcC55IH1cIiBpZiBjcm9wP1xuICAgIHN0eWxlICs9IFwiL089I3sgcSB9XCIgaWYgcSA9IHF1YWxpdHkgfHwgcmVzcmNpdENvbmZpZy5xdWFsaXR5XG4gICAgXCIjeyByZXNyY2l0Q29uZmlnLmhvc3QgfSN7IHN0eWxlIH0vI3sgdmFsdWUgfVwiXG5cblxuICAjIEltYWdlIHNwZWNpZmljIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZm9ybWF0Q3NzVXJsOiAodXJsKSAtPlxuICAgIHVybCA9IGltZ1NlcnZpY2UuZXNjYXBlQ3NzVXJpKHVybClcbiAgICBcInVybCgjeyB1cmwgfSlcIlxuXG5cbiAgc2V0SW5saW5lSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLnJlbW92ZUF0dHIoJ3NyYycpIGlmIGltZ1NlcnZpY2UuaXNCYXNlNjQoJGVsZW0uYXR0cignc3JjJykpXG4gICAgJGVsZW0uYXR0cignZGF0YS1zcmMnLCB1cmwpXG5cblxuICBzZXRCYWNrZ3JvdW5kSW1hZ2U6ICgkZWxlbSwgdXJsKSAtPlxuICAgICRlbGVtLmNzcygnYmFja2dyb3VuZC1pbWFnZScsIEBmb3JtYXRDc3NVcmwodXJsKSlcblxuXG4gICMgU2V0IHNyYyBkaXJlY3RseSwgZG9uJ3QgYWRkIHJlc3JjIGNsYXNzXG4gIHNldEJhc2U2NDogKCRlbGVtLCBiYXNlNjRTdHJpbmcpIC0+XG4gICAgaW1nU2VydmljZS5zZXQoJGVsZW0sIGJhc2U2NFN0cmluZylcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuaXNTdXBwb3J0ZWQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2ZlYXR1cmVfZGV0ZWN0aW9uL2lzX3N1cHBvcnRlZCcpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgQ29tcG9uZW50RHJhZ1xuXG4gIHdpZ2dsZVNwYWNlID0gMFxuICBzdGFydEFuZEVuZE9mZnNldCA9IDBcblxuICBjb25zdHJ1Y3RvcjogKHsgQGNvbXBvbmVudE1vZGVsLCBjb21wb25lbnRWaWV3IH0pIC0+XG4gICAgQCR2aWV3ID0gY29tcG9uZW50Vmlldy4kaHRtbCBpZiBjb21wb25lbnRWaWV3XG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICBzdGFydDogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQHBhZ2UuZWRpdGFibGVDb250cm9sbGVyLmRpc2FibGVBbGwoKVxuICAgIEBwYWdlLmJsdXJGb2N1c2VkRWxlbWVudCgpXG5cbiAgICAjIHBsYWNlaG9sZGVyIGJlbG93IGN1cnNvclxuICAgIEAkcGxhY2Vob2xkZXIgPSBAY3JlYXRlUGxhY2Vob2xkZXIoKS5jc3MoJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnKVxuICAgIEAkZHJhZ0Jsb2NrZXIgPSBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpXG5cbiAgICAjIGRyb3AgbWFya2VyXG4gICAgQCRkcm9wTWFya2VyID0gJChcIjxkaXYgY2xhc3M9JyN7IGNzcy5kcm9wTWFya2VyIH0nPlwiKVxuXG4gICAgQHBhZ2UuJGJvZHlcbiAgICAgIC5hcHBlbmQoQCRkcm9wTWFya2VyKVxuICAgICAgLmFwcGVuZChAJHBsYWNlaG9sZGVyKVxuICAgICAgLmNzcygnY3Vyc29yJywgJ3BvaW50ZXInKVxuXG4gICAgIyBtYXJrIGRyYWdnZWQgY29tcG9uZW50XG4gICAgQCR2aWV3LmFkZENsYXNzKGNzcy5kcmFnZ2VkKSBpZiBAJHZpZXc/XG5cbiAgICAjIHBvc2l0aW9uIHRoZSBwbGFjZWhvbGRlclxuICAgIEBtb3ZlKGV2ZW50UG9zaXRpb24pXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuXG4gIG1vdmU6IChldmVudFBvc2l0aW9uKSAtPlxuICAgIEAkcGxhY2Vob2xkZXIuY3NzXG4gICAgICBsZWZ0OiBcIiN7IGV2ZW50UG9zaXRpb24ucGFnZVggfXB4XCJcbiAgICAgIHRvcDogXCIjeyBldmVudFBvc2l0aW9uLnBhZ2VZIH1weFwiXG5cbiAgICBAdGFyZ2V0ID0gQGZpbmREcm9wVGFyZ2V0KGV2ZW50UG9zaXRpb24pXG4gICAgIyBAc2Nyb2xsSW50b1ZpZXcodG9wLCBldmVudClcblxuXG4gIGZpbmREcm9wVGFyZ2V0OiAoZXZlbnRQb3NpdGlvbikgLT5cbiAgICB7IGV2ZW50UG9zaXRpb24sIGVsZW0gfSA9IEBnZXRFbGVtVW5kZXJDdXJzb3IoZXZlbnRQb3NpdGlvbilcbiAgICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBlbGVtP1xuXG4gICAgIyByZXR1cm4gdGhlIHNhbWUgYXMgbGFzdCB0aW1lIGlmIHRoZSBjdXJzb3IgaXMgYWJvdmUgdGhlIGRyb3BNYXJrZXJcbiAgICByZXR1cm4gQHRhcmdldCBpZiBlbGVtID09IEAkZHJvcE1hcmtlclswXVxuXG4gICAgY29vcmRzID0geyBsZWZ0OiBldmVudFBvc2l0aW9uLnBhZ2VYLCB0b3A6IGV2ZW50UG9zaXRpb24ucGFnZVkgfVxuICAgIHRhcmdldCA9IGRvbS5kcm9wVGFyZ2V0KGVsZW0sIGNvb3JkcykgaWYgZWxlbT9cbiAgICBAdW5kb01ha2VTcGFjZSgpXG5cbiAgICBpZiB0YXJnZXQ/ICYmIHRhcmdldC5jb21wb25lbnRWaWV3Py5tb2RlbCAhPSBAY29tcG9uZW50TW9kZWxcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcbiAgICAgIEBtYXJrRHJvcFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgIyBpZiB0YXJnZXQuY29udGFpbmVyTmFtZVxuICAgICAgIyAgIGRvbS5tYXhpbWl6ZUNvbnRhaW5lckhlaWdodCh0YXJnZXQucGFyZW50KVxuICAgICAgIyAgICRjb250YWluZXIgPSAkKHRhcmdldC5ub2RlKVxuICAgICAgIyBlbHNlIGlmIHRhcmdldC5jb21wb25lbnRWaWV3XG4gICAgICAjICAgZG9tLm1heGltaXplQ29udGFpbmVySGVpZ2h0KHRhcmdldC5jb21wb25lbnRWaWV3KVxuICAgICAgIyAgICRjb250YWluZXIgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5nZXQkY29udGFpbmVyKClcblxuICAgICAgcmV0dXJuIHRhcmdldFxuICAgIGVsc2VcbiAgICAgIEAkZHJvcE1hcmtlci5oaWRlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuXG4gICAgICBpZiBub3QgdGFyZ2V0P1xuICAgICAgICBAJHBsYWNlaG9sZGVyLmFkZENsYXNzKGNzcy5ub0Ryb3ApXG4gICAgICBlbHNlXG4gICAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlQ2xhc3MoY3NzLm5vRHJvcClcblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgbWFya0Ryb3BQb3NpdGlvbjogKHRhcmdldCkgLT5cbiAgICBzd2l0Y2ggdGFyZ2V0LnRhcmdldFxuICAgICAgd2hlbiAnY29tcG9uZW50J1xuICAgICAgICBAY29tcG9uZW50UG9zaXRpb24odGFyZ2V0KVxuICAgICAgICBAcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0KClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgQHNob3dNYXJrZXJBdEJlZ2lubmluZ09mQ29udGFpbmVyKHRhcmdldC5ub2RlKVxuICAgICAgICBAaGlnaGxpZ2hDb250YWluZXIoJCh0YXJnZXQubm9kZSkpXG4gICAgICB3aGVuICdyb290J1xuICAgICAgICBAc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXIodGFyZ2V0Lm5vZGUpXG4gICAgICAgIEBoaWdobGlnaENvbnRhaW5lcigkKHRhcmdldC5ub2RlKSlcblxuXG4gIGNvbXBvbmVudFBvc2l0aW9uOiAodGFyZ2V0KSAtPlxuICAgIGlmIHRhcmdldC5wb3NpdGlvbiA9PSAnYmVmb3JlJ1xuICAgICAgYmVmb3JlID0gdGFyZ2V0LmNvbXBvbmVudFZpZXcucHJldigpXG5cbiAgICAgIGlmIGJlZm9yZT9cbiAgICAgICAgaWYgYmVmb3JlLm1vZGVsID09IEBjb21wb25lbnRNb2RlbFxuICAgICAgICAgIHRhcmdldC5wb3NpdGlvbiA9ICdhZnRlcidcbiAgICAgICAgICByZXR1cm4gQGNvbXBvbmVudFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzKGJlZm9yZSwgdGFyZ2V0LmNvbXBvbmVudFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93TWFya2VyQXRCZWdpbm5pbmdPZkNvbnRhaW5lcih0YXJnZXQuY29tcG9uZW50Vmlldy4kZWxlbVswXS5wYXJlbnROb2RlKVxuICAgIGVsc2VcbiAgICAgIG5leHQgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5uZXh0KClcbiAgICAgIGlmIG5leHQ/XG4gICAgICAgIGlmIG5leHQubW9kZWwgPT0gQGNvbXBvbmVudE1vZGVsXG4gICAgICAgICAgdGFyZ2V0LnBvc2l0aW9uID0gJ2JlZm9yZSdcbiAgICAgICAgICByZXR1cm4gQGNvbXBvbmVudFBvc2l0aW9uKHRhcmdldClcblxuICAgICAgICBAc2hvd01hcmtlckJldHdlZW5Db21wb25lbnRzKHRhcmdldC5jb21wb25lbnRWaWV3LCBuZXh0KVxuICAgICAgZWxzZVxuICAgICAgICBAc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXIodGFyZ2V0LmNvbXBvbmVudFZpZXcuJGVsZW1bMF0ucGFyZW50Tm9kZSlcblxuXG4gIHNob3dNYXJrZXJCZXR3ZWVuQ29tcG9uZW50czogKHZpZXdBLCB2aWV3QikgLT5cbiAgICBib3hBID0gZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KHZpZXdBLiRlbGVtWzBdKVxuICAgIGJveEIgPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Qodmlld0IuJGVsZW1bMF0pXG5cbiAgICBoYWxmR2FwID0gaWYgYm94Qi50b3AgPiBib3hBLmJvdHRvbVxuICAgICAgKGJveEIudG9wIC0gYm94QS5ib3R0b20pIC8gMlxuICAgIGVsc2VcbiAgICAgIDBcblxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3hBLmxlZnRcbiAgICAgIHRvcDogYm94QS5ib3R0b20gKyBoYWxmR2FwXG4gICAgICB3aWR0aDogYm94QS53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0QmVnaW5uaW5nT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5maXJzdENoaWxkLCAndG9wJylcbiAgICBib3ggPSBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoZWxlbSlcbiAgICBwYWRkaW5nVG9wID0gcGFyc2VJbnQoJChlbGVtKS5jc3MoJ3BhZGRpbmctdG9wJykpIHx8IDBcbiAgICBAc2hvd01hcmtlclxuICAgICAgbGVmdDogYm94LmxlZnRcbiAgICAgIHRvcDogYm94LnRvcCArIHN0YXJ0QW5kRW5kT2Zmc2V0ICsgcGFkZGluZ1RvcFxuICAgICAgd2lkdGg6IGJveC53aWR0aFxuXG5cbiAgc2hvd01hcmtlckF0RW5kT2ZDb250YWluZXI6IChlbGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbT9cblxuICAgIEBtYWtlU3BhY2UoZWxlbS5sYXN0Q2hpbGQsICdib3R0b20nKVxuICAgIGJveCA9IGRvbS5nZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdChlbGVtKVxuICAgIHBhZGRpbmdCb3R0b20gPSBwYXJzZUludCgkKGVsZW0pLmNzcygncGFkZGluZy1ib3R0b20nKSkgfHwgMFxuICAgIEBzaG93TWFya2VyXG4gICAgICBsZWZ0OiBib3gubGVmdFxuICAgICAgdG9wOiBib3guYm90dG9tIC0gc3RhcnRBbmRFbmRPZmZzZXQgLSBwYWRkaW5nQm90dG9tXG4gICAgICB3aWR0aDogYm94LndpZHRoXG5cblxuICBzaG93TWFya2VyOiAoeyBsZWZ0LCB0b3AsIHdpZHRoIH0pIC0+XG4gICAgaWYgQGlmcmFtZUJveD9cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIGlmcmFtZSB2aWV3cG9ydFxuICAgICAgJGJvZHkgPSAkKEBpZnJhbWVCb3gud2luZG93LmRvY3VtZW50LmJvZHkpXG4gICAgICB0b3AgLT0gJGJvZHkuc2Nyb2xsVG9wKClcbiAgICAgIGxlZnQgLT0gJGJvZHkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgdHJhbnNsYXRlIHRvIHJlbGF0aXZlIHRvIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcbiAgICAgIGxlZnQgKz0gQGlmcmFtZUJveC5sZWZ0XG4gICAgICB0b3AgKz0gQGlmcmFtZUJveC50b3BcblxuICAgICAgIyB0cmFuc2xhdGUgdG8gcmVsYXRpdmUgdG8gZG9jdW1lbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nKVxuICAgICAgIyB0b3AgKz0gJChkb2N1bWVudC5ib2R5KS5zY3JvbGxUb3AoKVxuICAgICAgIyBsZWZ0ICs9ICQoZG9jdW1lbnQuYm9keSkuc2Nyb2xsTGVmdCgpXG5cbiAgICAgICMgV2l0aCBwb3NpdGlvbiBmaXhlZCB3ZSBkb24ndCBuZWVkIHRvIHRha2Ugc2Nyb2xsaW5nIGludG8gYWNjb3VudFxuICAgICAgIyBpbiBhbiBpZnJhbWUgc2NlbmFyaW9cbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdmaXhlZCcpXG4gICAgZWxzZVxuICAgICAgIyBJZiB3ZSdyZSBub3QgaW4gYW4gaWZyYW1lIGxlZnQgYW5kIHRvcCBhcmUgYWxyZWFkeVxuICAgICAgIyB0aGUgYWJzb2x1dGUgY29vcmRpbmF0ZXNcbiAgICAgIEAkZHJvcE1hcmtlci5jc3MocG9zaXRpb246ICdhYnNvbHV0ZScpXG5cbiAgICBAJGRyb3BNYXJrZXJcbiAgICAuY3NzXG4gICAgICBsZWZ0OiAgXCIjeyBsZWZ0IH1weFwiXG4gICAgICB0b3A6ICAgXCIjeyB0b3AgfXB4XCJcbiAgICAgIHdpZHRoOiBcIiN7IHdpZHRoIH1weFwiXG4gICAgLnNob3coKVxuXG5cbiAgbWFrZVNwYWNlOiAobm9kZSwgcG9zaXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aWdnbGVTcGFjZSAmJiBub2RlP1xuICAgICRub2RlID0gJChub2RlKVxuICAgIEBsYXN0VHJhbnNmb3JtID0gJG5vZGVcblxuICAgIGlmIHBvc2l0aW9uID09ICd0b3AnXG4gICAgICAkbm9kZS5jc3ModHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLCAjeyB3aWdnbGVTcGFjZSB9cHgpXCIpXG4gICAgZWxzZVxuICAgICAgJG5vZGUuY3NzKHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCwgLSN7IHdpZ2dsZVNwYWNlIH1weClcIilcblxuXG4gIHVuZG9NYWtlU3BhY2U6IChub2RlKSAtPlxuICAgIGlmIEBsYXN0VHJhbnNmb3JtP1xuICAgICAgQGxhc3RUcmFuc2Zvcm0uY3NzKHRyYW5zZm9ybTogJycpXG4gICAgICBAbGFzdFRyYW5zZm9ybSA9IHVuZGVmaW5lZFxuXG5cbiAgaGlnaGxpZ2hDb250YWluZXI6ICgkY29udGFpbmVyKSAtPlxuICAgIGlmICRjb250YWluZXJbMF0gIT0gQCRoaWdobGlnaHRlZENvbnRhaW5lclswXVxuICAgICAgQCRoaWdobGlnaHRlZENvbnRhaW5lci5yZW1vdmVDbGFzcz8oY3NzLmNvbnRhaW5lckhpZ2hsaWdodClcbiAgICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIgPSAkY29udGFpbmVyXG4gICAgICBAJGhpZ2hsaWdodGVkQ29udGFpbmVyLmFkZENsYXNzPyhjc3MuY29udGFpbmVySGlnaGxpZ2h0KVxuXG5cbiAgcmVtb3ZlQ29udGFpbmVySGlnaGxpZ2h0OiAtPlxuICAgIEAkaGlnaGxpZ2h0ZWRDb250YWluZXIucmVtb3ZlQ2xhc3M/KGNzcy5jb250YWluZXJIaWdobGlnaHQpXG4gICAgQCRoaWdobGlnaHRlZENvbnRhaW5lciA9IHt9XG5cblxuICAjIHBhZ2VYLCBwYWdlWTogYWJzb2x1dGUgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgZG9jdW1lbnQpXG4gICMgY2xpZW50WCwgY2xpZW50WTogZml4ZWQgcG9zaXRpb25zIChyZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQpXG4gIGdldEVsZW1VbmRlckN1cnNvcjogKGV2ZW50UG9zaXRpb24pIC0+XG4gICAgZWxlbSA9IHVuZGVmaW5lZFxuICAgIEB1bmJsb2NrRWxlbWVudEZyb21Qb2ludCA9PlxuICAgICAgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFBvc2l0aW9uXG5cbiAgICAgIGlmIGNsaWVudFg/ICYmIGNsaWVudFk/XG4gICAgICAgIGVsZW0gPSBAcGFnZS5kb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGNsaWVudFgsIGNsaWVudFkpXG5cbiAgICAgIGlmIGVsZW0/Lm5vZGVOYW1lID09ICdJRlJBTUUnXG4gICAgICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9ID0gQGZpbmRFbGVtSW5JZnJhbWUoZWxlbSwgZXZlbnRQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgQGlmcmFtZUJveCA9IHVuZGVmaW5lZFxuXG4gICAgeyBldmVudFBvc2l0aW9uLCBlbGVtIH1cblxuXG4gIGZpbmRFbGVtSW5JZnJhbWU6IChpZnJhbWVFbGVtLCBldmVudFBvc2l0aW9uKSAtPlxuICAgIEBpZnJhbWVCb3ggPSBib3ggPSBpZnJhbWVFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgQGlmcmFtZUJveC53aW5kb3cgPSBpZnJhbWVFbGVtLmNvbnRlbnRXaW5kb3dcbiAgICBkb2N1bWVudCA9IGlmcmFtZUVsZW0uY29udGVudERvY3VtZW50XG4gICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpXG5cbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFggLT0gYm94LmxlZnRcbiAgICBldmVudFBvc2l0aW9uLmNsaWVudFkgLT0gYm94LnRvcFxuICAgIGV2ZW50UG9zaXRpb24ucGFnZVggPSBldmVudFBvc2l0aW9uLmNsaWVudFggKyAkYm9keS5zY3JvbGxMZWZ0KClcbiAgICBldmVudFBvc2l0aW9uLnBhZ2VZID0gZXZlbnRQb3NpdGlvbi5jbGllbnRZICsgJGJvZHkuc2Nyb2xsVG9wKClcbiAgICBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudFBvc2l0aW9uLmNsaWVudFgsIGV2ZW50UG9zaXRpb24uY2xpZW50WSlcblxuICAgIHsgZXZlbnRQb3NpdGlvbiwgZWxlbSB9XG5cblxuICAjIFJlbW92ZSBlbGVtZW50cyB1bmRlciB0aGUgY3Vyc29yIHdoaWNoIGNvdWxkIGludGVyZmVyZVxuICAjIHdpdGggZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCgpXG4gIHVuYmxvY2tFbGVtZW50RnJvbVBvaW50OiAoY2FsbGJhY2spIC0+XG5cbiAgICAjIFBvaW50ZXIgRXZlbnRzIGFyZSBhIGxvdCBmYXN0ZXIgc2luY2UgdGhlIGJyb3dzZXIgZG9lcyBub3QgbmVlZFxuICAgICMgdG8gcmVwYWludCB0aGUgd2hvbGUgc2NyZWVuLiBJRSA5IGFuZCAxMCBkbyBub3Qgc3VwcG9ydCB0aGVtLlxuICAgIGlmIGlzU3VwcG9ydGVkKCdodG1sUG9pbnRlckV2ZW50cycpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnbm9uZScpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLmNzcygncG9pbnRlci1ldmVudHMnOiAnYXV0bycpXG4gICAgZWxzZVxuICAgICAgQCRkcmFnQmxvY2tlci5oaWRlKClcbiAgICAgIEAkcGxhY2Vob2xkZXIuaGlkZSgpXG4gICAgICBjYWxsYmFjaygpXG4gICAgICBAJGRyYWdCbG9ja2VyLnNob3coKVxuICAgICAgQCRwbGFjZWhvbGRlci5zaG93KClcblxuXG4gICMgQ2FsbGVkIGJ5IERyYWdCYXNlXG4gIGRyb3A6IC0+XG4gICAgaWYgQHRhcmdldD9cbiAgICAgIEBtb3ZlVG9UYXJnZXQoQHRhcmdldClcbiAgICAgIEBwYWdlLmNvbXBvbmVudFdhc0Ryb3BwZWQuZmlyZShAY29tcG9uZW50TW9kZWwpXG4gICAgZWxzZVxuICAgICAgI2NvbnNpZGVyOiBtYXliZSBhZGQgYSAnZHJvcCBmYWlsZWQnIGVmZmVjdFxuXG5cbiAgIyBNb3ZlIHRoZSBjb21wb25lbnQgYWZ0ZXIgYSBzdWNjZXNzZnVsIGRyb3BcbiAgbW92ZVRvVGFyZ2V0OiAodGFyZ2V0KSAtPlxuICAgIHN3aXRjaCB0YXJnZXQudGFyZ2V0XG4gICAgICB3aGVuICdjb21wb25lbnQnXG4gICAgICAgIGNvbXBvbmVudFZpZXcgPSB0YXJnZXQuY29tcG9uZW50Vmlld1xuICAgICAgICBpZiB0YXJnZXQucG9zaXRpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBjb21wb25lbnRWaWV3Lm1vZGVsLmJlZm9yZShAY29tcG9uZW50TW9kZWwpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb21wb25lbnRWaWV3Lm1vZGVsLmFmdGVyKEBjb21wb25lbnRNb2RlbClcbiAgICAgIHdoZW4gJ2NvbnRhaW5lcidcbiAgICAgICAgY29tcG9uZW50TW9kZWwgPSB0YXJnZXQuY29tcG9uZW50Vmlldy5tb2RlbFxuICAgICAgICBjb21wb25lbnRNb2RlbC5hcHBlbmQodGFyZ2V0LmNvbnRhaW5lck5hbWUsIEBjb21wb25lbnRNb2RlbClcbiAgICAgIHdoZW4gJ3Jvb3QnXG4gICAgICAgIGNvbXBvbmVudFRyZWUgPSB0YXJnZXQuY29tcG9uZW50VHJlZVxuICAgICAgICBjb21wb25lbnRUcmVlLnByZXBlbmQoQGNvbXBvbmVudE1vZGVsKVxuXG5cblxuICAjIENhbGxlZCBieSBEcmFnQmFzZVxuICAjIFJlc2V0IGlzIGFsd2F5cyBjYWxsZWQgYWZ0ZXIgYSBkcmFnIGVuZGVkLlxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuXG4gICAgICAjIHVuZG8gRE9NIGNoYW5nZXNcbiAgICAgIEB1bmRvTWFrZVNwYWNlKClcbiAgICAgIEByZW1vdmVDb250YWluZXJIaWdobGlnaHQoKVxuICAgICAgQHBhZ2UuJGJvZHkuY3NzKCdjdXJzb3InLCAnJylcbiAgICAgIEBwYWdlLmVkaXRhYmxlQ29udHJvbGxlci5yZWVuYWJsZUFsbCgpXG4gICAgICBAJHZpZXcucmVtb3ZlQ2xhc3MoY3NzLmRyYWdnZWQpIGlmIEAkdmlldz9cbiAgICAgIGRvbS5yZXN0b3JlQ29udGFpbmVySGVpZ2h0KClcblxuICAgICAgIyByZW1vdmUgZWxlbWVudHNcbiAgICAgIEAkcGxhY2Vob2xkZXIucmVtb3ZlKClcbiAgICAgIEAkZHJvcE1hcmtlci5yZW1vdmUoKVxuXG5cbiAgY3JlYXRlUGxhY2Vob2xkZXI6IC0+XG4gICAgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgPSAxXG4gICAgdGVtcGxhdGUgPSBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyIH1cIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCIjeyBjc3MuZHJhZ2dlZFBsYWNlaG9sZGVyQ291bnRlciB9XCI+XG4gICAgICAgICAgI3sgbnVtYmVyT2ZEcmFnZ2VkRWxlbXMgfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIFNlbGVjdGVkIEl0ZW1cbiAgICAgIDwvZGl2PlxuICAgICAgXCJcIlwiXG5cbiAgICAkcGxhY2Vob2xkZXIgPSAkKHRlbXBsYXRlKVxuICAgICAgLmNzcyhwb3NpdGlvbjogXCJhYnNvbHV0ZVwiKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5cbiMgRE9NIGhlbHBlciBtZXRob2RzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLVxuIyBNZXRob2RzIHRvIHBhcnNlIGFuZCB1cGRhdGUgdGhlIERvbSB0cmVlIGluIGFjY29yZGFuY2UgdG9cbiMgdGhlIENvbXBvbmVudFRyZWUgYW5kIExpdmluZ2RvY3MgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xubW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuICBjb21wb25lbnRSZWdleCA9IG5ldyBSZWdFeHAoXCIoPzogfF4pI3sgY3NzLmNvbXBvbmVudCB9KD86IHwkKVwiKVxuICBzZWN0aW9uUmVnZXggPSBuZXcgUmVnRXhwKFwiKD86IHxeKSN7IGNzcy5zZWN0aW9uIH0oPzogfCQpXCIpXG5cbiAgIyBGaW5kIHRoZSBjb21wb25lbnQgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gICMgQ29tcG9uZW50cyBhcmUgbWFya2VkIGJ5IGEgY2xhc3MgYXQgdGhlIG1vbWVudC5cbiAgZmluZENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcblxuICAgIHdoaWxlIG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PSAxICMgTm9kZS5FTEVNRU5UX05PREUgPT0gMVxuICAgICAgaWYgY29tcG9uZW50UmVnZXgudGVzdChub2RlLmNsYXNzTmFtZSlcbiAgICAgICAgdmlldyA9IEBnZXRDb21wb25lbnRWaWV3KG5vZGUpXG4gICAgICAgIHJldHVybiB2aWV3XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGZpbmROb2RlQ29udGV4dDogKG5vZGUpIC0+XG4gICAgbm9kZSA9IEBnZXRFbGVtZW50Tm9kZShub2RlKVxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBub2RlQ29udGV4dCA9IEBnZXROb2RlQ29udGV4dChub2RlKVxuICAgICAgcmV0dXJuIG5vZGVDb250ZXh0IGlmIG5vZGVDb250ZXh0XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gIGdldE5vZGVDb250ZXh0OiAobm9kZSkgLT5cbiAgICBmb3IgZGlyZWN0aXZlVHlwZSwgb2JqIG9mIGNvbmZpZy5kaXJlY3RpdmVzXG4gICAgICBjb250aW51ZSBpZiBub3Qgb2JqLmVsZW1lbnREaXJlY3RpdmVcblxuICAgICAgZGlyZWN0aXZlQXR0ciA9IG9iai5yZW5kZXJlZEF0dHJcbiAgICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGRpcmVjdGl2ZUF0dHIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGV4dEF0dHI6IGRpcmVjdGl2ZUF0dHJcbiAgICAgICAgICBhdHRyTmFtZTogbm9kZS5nZXRBdHRyaWJ1dGUoZGlyZWN0aXZlQXR0cilcbiAgICAgICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIyBGaW5kIHRoZSBjb250YWluZXIgdGhpcyBub2RlIGlzIGNvbnRhaW5lZCB3aXRoaW4uXG4gIGZpbmRDb250YWluZXI6IChub2RlKSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICBpZiBub2RlLmhhc0F0dHJpYnV0ZShjb250YWluZXJBdHRyKVxuICAgICAgICBjb250YWluZXJOYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgaWYgbm90IHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICAgIHZpZXcgPSBAZmluZENvbXBvbmVudFZpZXcobm9kZSlcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IG5vZGVcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBjb250YWluZXJOYW1lXG4gICAgICAgICAgY29tcG9uZW50Vmlldzogdmlld1xuICAgICAgICB9XG5cbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcblxuICAgIHt9XG5cblxuICBnZXRJbWFnZU5hbWU6IChub2RlKSAtPlxuICAgIGltYWdlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGltYWdlQXR0cilcbiAgICAgIHJldHVybiBpbWFnZU5hbWVcblxuXG4gIGdldEh0bWxFbGVtZW50TmFtZTogKG5vZGUpIC0+XG4gICAgaHRtbEF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGh0bWxBdHRyKVxuICAgICAgaHRtbEVsZW1lbnROYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoaHRtbEF0dHIpXG4gICAgICByZXR1cm4gaHRtbEVsZW1lbnROYW1lXG5cblxuICBnZXRFZGl0YWJsZU5hbWU6IChub2RlKSAtPlxuICAgIGVkaXRhYmxlQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmVkaXRhYmxlLnJlbmRlcmVkQXR0clxuICAgIGlmIG5vZGUuaGFzQXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIGltYWdlTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGVkaXRhYmxlQXR0cilcbiAgICAgIHJldHVybiBlZGl0YWJsZU5hbWVcblxuXG4gIGRyb3BUYXJnZXQ6IChub2RlLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgIG5vZGUgPSBAZ2V0RWxlbWVudE5vZGUobm9kZSlcbiAgICBjb250YWluZXJBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuY29udGFpbmVyLnJlbmRlcmVkQXR0clxuXG4gICAgd2hpbGUgbm9kZSAmJiBub2RlLm5vZGVUeXBlID09IDEgIyBOb2RlLkVMRU1FTlRfTk9ERSA9PSAxXG4gICAgICAjIGFib3ZlIGNvbnRhaW5lclxuICAgICAgaWYgbm9kZS5oYXNBdHRyaWJ1dGUoY29udGFpbmVyQXR0cilcbiAgICAgICAgY2xvc2VzdENvbXBvbmVudERhdGEgPSBAZ2V0Q2xvc2VzdENvbXBvbmVudChub2RlLCB7IHRvcCwgbGVmdCB9KVxuICAgICAgICBpZiBjbG9zZXN0Q29tcG9uZW50RGF0YT9cbiAgICAgICAgICByZXR1cm4gQGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQoY2xvc2VzdENvbXBvbmVudERhdGEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gQGdldENvbnRhaW5lclRhcmdldChub2RlKVxuXG4gICAgICAjIGFib3ZlIGNvbXBvbmVudFxuICAgICAgZWxzZSBpZiBjb21wb25lbnRSZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICByZXR1cm4gQGdldENvbXBvbmVudFRhcmdldChub2RlLCB7IHRvcCwgbGVmdCB9KVxuXG4gICAgICAjIGFib3ZlIHJvb3QgY29udGFpbmVyXG4gICAgICBlbHNlIGlmIHNlY3Rpb25SZWdleC50ZXN0KG5vZGUuY2xhc3NOYW1lKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50RGF0YSA9IEBnZXRDbG9zZXN0Q29tcG9uZW50KG5vZGUsIHsgdG9wLCBsZWZ0IH0pXG4gICAgICAgIGlmIGNsb3Nlc3RDb21wb25lbnREYXRhP1xuICAgICAgICAgIHJldHVybiBAZ2V0Q2xvc2VzdENvbXBvbmVudFRhcmdldChjbG9zZXN0Q29tcG9uZW50RGF0YSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBAZ2V0Um9vdFRhcmdldChub2RlKVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG5cblxuICBnZXRDb21wb25lbnRUYXJnZXQ6IChlbGVtLCB7IHRvcCwgbGVmdCwgcG9zaXRpb24gfSkgLT5cbiAgICB0YXJnZXQ6ICdjb21wb25lbnQnXG4gICAgY29tcG9uZW50VmlldzogQGdldENvbXBvbmVudFZpZXcoZWxlbSlcbiAgICBwb3NpdGlvbjogcG9zaXRpb24gfHwgQGdldFBvc2l0aW9uT25Db21wb25lbnQoZWxlbSwgeyB0b3AsIGxlZnQgfSlcblxuXG4gIGdldENsb3Nlc3RDb21wb25lbnRUYXJnZXQ6IChjbG9zZXN0Q29tcG9uZW50RGF0YSkgLT5cbiAgICBlbGVtID0gY2xvc2VzdENvbXBvbmVudERhdGEuJGVsZW1bMF1cbiAgICBwb3NpdGlvbiA9IGNsb3Nlc3RDb21wb25lbnREYXRhLnBvc2l0aW9uXG4gICAgQGdldENvbXBvbmVudFRhcmdldChlbGVtLCB7IHBvc2l0aW9uIH0pXG5cblxuICBnZXRDb250YWluZXJUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbnRhaW5lckF0dHIgPSBjb25maWcuZGlyZWN0aXZlcy5jb250YWluZXIucmVuZGVyZWRBdHRyXG4gICAgY29udGFpbmVyTmFtZSA9IG5vZGUuZ2V0QXR0cmlidXRlKGNvbnRhaW5lckF0dHIpXG5cbiAgICB0YXJnZXQ6ICdjb250YWluZXInXG4gICAgbm9kZTogbm9kZVxuICAgIGNvbXBvbmVudFZpZXc6IEBmaW5kQ29tcG9uZW50Vmlldyhub2RlKVxuICAgIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWVcblxuXG4gIGdldFJvb3RUYXJnZXQ6IChub2RlKSAtPlxuICAgIGNvbXBvbmVudFRyZWUgPSAkKG5vZGUpLmRhdGEoJ2NvbXBvbmVudFRyZWUnKVxuXG4gICAgdGFyZ2V0OiAncm9vdCdcbiAgICBub2RlOiBub2RlXG4gICAgY29tcG9uZW50VHJlZTogY29tcG9uZW50VHJlZVxuXG5cbiAgIyBGaWd1cmUgb3V0IGlmIHdlIHNob3VsZCBpbnNlcnQgYmVmb3JlIG9yIGFmdGVyIGEgY29tcG9uZW50XG4gICMgYmFzZWQgb24gdGhlIGN1cnNvciBwb3NpdGlvbi5cbiAgZ2V0UG9zaXRpb25PbkNvbXBvbmVudDogKGVsZW0sIHsgdG9wLCBsZWZ0IH0pIC0+XG4gICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgZWxlbVRvcCA9ICRlbGVtLm9mZnNldCgpLnRvcFxuICAgIGVsZW1IZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICBpZiBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IEBkaXN0YW5jZSh0b3AsIGVsZW1Cb3R0b20pXG4gICAgICAnYmVmb3JlJ1xuICAgIGVsc2VcbiAgICAgICdhZnRlcidcblxuXG4gICMgR2V0IHRoZSBjbG9zZXN0IGNvbXBvbmVudCBpbiBhIGNvbnRhaW5lciBmb3IgYSB0b3AgbGVmdCBwb3NpdGlvblxuICBnZXRDbG9zZXN0Q29tcG9uZW50OiAoY29udGFpbmVyLCB7IHRvcCwgbGVmdCB9KSAtPlxuICAgICRjb21wb25lbnRzID0gJChjb250YWluZXIpLmZpbmQoXCIuI3sgY3NzLmNvbXBvbmVudCB9XCIpXG4gICAgY2xvc2VzdCA9IHVuZGVmaW5lZFxuICAgIGNsb3Nlc3RDb21wb25lbnQgPSB1bmRlZmluZWRcblxuICAgICRjb21wb25lbnRzLmVhY2ggKGluZGV4LCBlbGVtKSA9PlxuICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICBlbGVtVG9wID0gJGVsZW0ub2Zmc2V0KCkudG9wXG4gICAgICBlbGVtSGVpZ2h0ID0gJGVsZW0ub3V0ZXJIZWlnaHQoKVxuICAgICAgZWxlbUJvdHRvbSA9IGVsZW1Ub3AgKyBlbGVtSGVpZ2h0XG5cbiAgICAgIGlmIG5vdCBjbG9zZXN0PyB8fCBAZGlzdGFuY2UodG9wLCBlbGVtVG9wKSA8IGNsb3Nlc3RcbiAgICAgICAgY2xvc2VzdCA9IEBkaXN0YW5jZSh0b3AsIGVsZW1Ub3ApXG4gICAgICAgIGNsb3Nlc3RDb21wb25lbnQgPSB7ICRlbGVtLCBwb3NpdGlvbjogJ2JlZm9yZSd9XG4gICAgICBpZiBub3QgY2xvc2VzdD8gfHwgQGRpc3RhbmNlKHRvcCwgZWxlbUJvdHRvbSkgPCBjbG9zZXN0XG4gICAgICAgIGNsb3Nlc3QgPSBAZGlzdGFuY2UodG9wLCBlbGVtQm90dG9tKVxuICAgICAgICBjbG9zZXN0Q29tcG9uZW50ID0geyAkZWxlbSwgcG9zaXRpb246ICdhZnRlcid9XG5cbiAgICBjbG9zZXN0Q29tcG9uZW50XG5cblxuICBkaXN0YW5jZTogKGEsIGIpIC0+XG4gICAgaWYgYSA+IGIgdGhlbiBhIC0gYiBlbHNlIGIgLSBhXG5cblxuICAjIGZvcmNlIGFsbCBjb250YWluZXJzIG9mIGEgY29tcG9uZW50IHRvIGJlIGFzIGhpZ2ggYXMgdGhleSBjYW4gYmVcbiAgIyBzZXRzIGNzcyBzdHlsZSBoZWlnaHRcbiAgbWF4aW1pemVDb250YWluZXJIZWlnaHQ6ICh2aWV3KSAtPlxuICAgIGlmIHZpZXcudGVtcGxhdGUuY29udGFpbmVyQ291bnQgPiAxXG4gICAgICBmb3IgbmFtZSwgZWxlbSBvZiB2aWV3LmNvbnRhaW5lcnNcbiAgICAgICAgJGVsZW0gPSAkKGVsZW0pXG4gICAgICAgIGNvbnRpbnVlIGlmICRlbGVtLmhhc0NsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG4gICAgICAgICRwYXJlbnQgPSAkZWxlbS5wYXJlbnQoKVxuICAgICAgICBwYXJlbnRIZWlnaHQgPSAkcGFyZW50LmhlaWdodCgpXG4gICAgICAgIG91dGVyID0gJGVsZW0ub3V0ZXJIZWlnaHQodHJ1ZSkgLSAkZWxlbS5oZWlnaHQoKVxuICAgICAgICAkZWxlbS5oZWlnaHQocGFyZW50SGVpZ2h0IC0gb3V0ZXIpXG4gICAgICAgICRlbGVtLmFkZENsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICAjIHJlbW92ZSBhbGwgY3NzIHN0eWxlIGhlaWdodCBkZWNsYXJhdGlvbnMgYWRkZWQgYnlcbiAgIyBtYXhpbWl6ZUNvbnRhaW5lckhlaWdodCgpXG4gIHJlc3RvcmVDb250YWluZXJIZWlnaHQ6ICgpIC0+XG4gICAgJChcIi4jeyBjc3MubWF4aW1pemVkQ29udGFpbmVyIH1cIilcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLnJlbW92ZUNsYXNzKGNzcy5tYXhpbWl6ZWRDb250YWluZXIpXG5cblxuICBnZXRFbGVtZW50Tm9kZTogKG5vZGUpIC0+XG4gICAgaWYgbm9kZT8uanF1ZXJ5XG4gICAgICBub2RlWzBdXG4gICAgZWxzZSBpZiBub2RlPy5ub2RlVHlwZSA9PSAzICMgTm9kZS5URVhUX05PREUgPT0gM1xuICAgICAgbm9kZS5wYXJlbnROb2RlXG4gICAgZWxzZVxuICAgICAgbm9kZVxuXG5cbiAgIyBDb21wb25lbnRzIHN0b3JlIGEgcmVmZXJlbmNlIG9mIHRoZW1zZWx2ZXMgaW4gdGhlaXIgRG9tIG5vZGVcbiAgIyBjb25zaWRlcjogc3RvcmUgcmVmZXJlbmNlIGRpcmVjdGx5IHdpdGhvdXQgalF1ZXJ5XG4gIGdldENvbXBvbmVudFZpZXc6IChub2RlKSAtPlxuICAgICQobm9kZSkuZGF0YSgnY29tcG9uZW50VmlldycpXG5cblxuICAjIEdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0IHdpdGggdG9wIGFuZCBsZWZ0IHJlbGF0aXZlIHRvIHRoZSBkb2N1bWVudFxuICAjIChpZGVhbCBmb3IgYWJzb2x1dGUgcG9zaXRpb25lZCBlbGVtZW50cylcbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IChub2RlKSAtPlxuICAgIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld1xuICAgIHsgc2Nyb2xsWCwgc2Nyb2xsWSB9ID0gQGdldFNjcm9sbFBvc2l0aW9uKHdpbilcblxuICAgICMgdHJhbnNsYXRlIGludG8gYWJzb2x1dGUgcG9zaXRpb25zXG4gICAgY29vcmRzID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGNvb3JkcyA9XG4gICAgICB0b3A6IGNvb3Jkcy50b3AgKyBzY3JvbGxZXG4gICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20gKyBzY3JvbGxZXG4gICAgICBsZWZ0OiBjb29yZHMubGVmdCArIHNjcm9sbFhcbiAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQgKyBzY3JvbGxYXG5cbiAgICBjb29yZHMuaGVpZ2h0ID0gY29vcmRzLmJvdHRvbSAtIGNvb3Jkcy50b3BcbiAgICBjb29yZHMud2lkdGggPSBjb29yZHMucmlnaHQgLSBjb29yZHMubGVmdFxuXG4gICAgY29vcmRzXG5cblxuICBnZXRTY3JvbGxQb3NpdGlvbjogKHdpbikgLT5cbiAgICAjIGNvZGUgZnJvbSBtZG46IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cuc2Nyb2xsWFxuICAgIHNjcm9sbFg6IGlmICh3aW4ucGFnZVhPZmZzZXQgIT0gdW5kZWZpbmVkKSB0aGVuIHdpbi5wYWdlWE9mZnNldCBlbHNlICh3aW4uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IHdpbi5kb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgd2luLmRvY3VtZW50LmJvZHkpLnNjcm9sbExlZnRcbiAgICBzY3JvbGxZOiBpZiAod2luLnBhZ2VZT2Zmc2V0ICE9IHVuZGVmaW5lZCkgdGhlbiB3aW4ucGFnZVlPZmZzZXQgZWxzZSAod2luLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCB3aW4uZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IHdpbi5kb2N1bWVudC5ib2R5KS5zY3JvbGxUb3BcblxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuXG4jIERyYWdCYXNlXG4jXG4jIFN1cHBvcnRlZCBkcmFnIG1vZGVzOlxuIyAtIERpcmVjdCAoc3RhcnQgaW1tZWRpYXRlbHkpXG4jIC0gTG9uZ3ByZXNzIChzdGFydCBhZnRlciBhIGRlbGF5IGlmIHRoZSBjdXJzb3IgZG9lcyBub3QgbW92ZSB0b28gbXVjaClcbiMgLSBNb3ZlIChzdGFydCBhZnRlciB0aGUgY3Vyc29yIG1vdmVkIGEgbWludW11bSBkaXN0YW5jZSlcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRHJhZ0Jhc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWdlLCBvcHRpb25zKSAtPlxuICAgIEBtb2RlcyA9IFsnZGlyZWN0JywgJ2xvbmdwcmVzcycsICdtb3ZlJ11cblxuICAgIGRlZmF1bHRDb25maWcgPVxuICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG4gICAgICBvbkRyYWdTdGFydDogdW5kZWZpbmVkXG4gICAgICBzY3JvbGxBcmVhOiA1MFxuICAgICAgbG9uZ3ByZXNzOlxuICAgICAgICBzaG93SW5kaWNhdG9yOiB0cnVlXG4gICAgICAgIGRlbGF5OiA0MDBcbiAgICAgICAgdG9sZXJhbmNlOiAzXG4gICAgICBtb3ZlOlxuICAgICAgICBkaXN0YW5jZTogMFxuXG4gICAgQGRlZmF1bHRDb25maWcgPSAkLmV4dGVuZCh0cnVlLCBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuXG4gICAgQHN0YXJ0UG9pbnQgPSB1bmRlZmluZWRcbiAgICBAZHJhZ0hhbmRsZXIgPSB1bmRlZmluZWRcbiAgICBAaW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBzdGFydGVkID0gZmFsc2VcblxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIEBkZWZhdWx0Q29uZmlnLCBvcHRpb25zKVxuICAgIEBtb2RlID0gaWYgb3B0aW9ucy5kaXJlY3Q/XG4gICAgICAnZGlyZWN0J1xuICAgIGVsc2UgaWYgb3B0aW9ucy5sb25ncHJlc3M/XG4gICAgICAnbG9uZ3ByZXNzJ1xuICAgIGVsc2UgaWYgb3B0aW9ucy5tb3ZlP1xuICAgICAgJ21vdmUnXG4gICAgZWxzZVxuICAgICAgJ2xvbmdwcmVzcydcblxuXG4gIHNldERyYWdIYW5kbGVyOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgQGRyYWdIYW5kbGVyID0gZHJhZ0hhbmRsZXJcbiAgICBAZHJhZ0hhbmRsZXIucGFnZSA9IEBwYWdlXG5cblxuICAjIFN0YXJ0IGEgcG9zc2libGUgZHJhZ1xuICAjIFRoZSBkcmFnIGlzIG9ubHkgcmVhbGx5IHN0YXJ0ZWQgaWYgY29uc3RyYWludHMgYXJlIG5vdCB2aW9sYXRlZFxuICAjIChsb25ncHJlc3NEZWxheSBhbmQgbG9uZ3ByZXNzRGlzdGFuY2VMaW1pdCBvciBtaW5EaXN0YW5jZSkuXG4gIGluaXQ6IChkcmFnSGFuZGxlciwgZXZlbnQsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG4gICAgQHNldE9wdGlvbnMob3B0aW9ucylcbiAgICBAc2V0RHJhZ0hhbmRsZXIoZHJhZ0hhbmRsZXIpXG4gICAgQHN0YXJ0UG9pbnQgPSBAZ2V0RXZlbnRQb3NpdGlvbihldmVudClcblxuICAgIEBhZGRTdG9wTGlzdGVuZXJzKGV2ZW50KVxuICAgIEBhZGRNb3ZlTGlzdGVuZXJzKGV2ZW50KVxuXG4gICAgaWYgQG1vZGUgPT0gJ2xvbmdwcmVzcydcbiAgICAgIEBhZGRMb25ncHJlc3NJbmRpY2F0b3IoQHN0YXJ0UG9pbnQpXG4gICAgICBAdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgICAgICBAc3RhcnQoZXZlbnQpXG4gICAgICAgICwgQG9wdGlvbnMubG9uZ3ByZXNzLmRlbGF5XG4gICAgZWxzZSBpZiBAbW9kZSA9PSAnZGlyZWN0J1xuICAgICAgQHN0YXJ0KGV2ZW50KVxuXG4gICAgIyBwcmV2ZW50IGJyb3dzZXIgRHJhZyAmIERyb3BcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIGlmIEBvcHRpb25zLnByZXZlbnREZWZhdWx0XG5cblxuICBtb3ZlOiAoZXZlbnQpIC0+XG4gICAgZXZlbnRQb3NpdGlvbiA9IEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KVxuICAgIGlmIEBtb2RlID09ICdsb25ncHJlc3MnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubG9uZ3ByZXNzLnRvbGVyYW5jZVxuICAgICAgICBAcmVzZXQoKVxuICAgIGVsc2UgaWYgQG1vZGUgPT0gJ21vdmUnXG4gICAgICBpZiBAZGlzdGFuY2UoZXZlbnRQb3NpdGlvbiwgQHN0YXJ0UG9pbnQpID4gQG9wdGlvbnMubW92ZS5kaXN0YW5jZVxuICAgICAgICBAc3RhcnQoZXZlbnQpXG5cblxuICAjIHN0YXJ0IHRoZSBkcmFnIHByb2Nlc3NcbiAgc3RhcnQ6IChldmVudCkgLT5cbiAgICBldmVudFBvc2l0aW9uID0gQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG5cbiAgICAjIHByZXZlbnQgdGV4dC1zZWxlY3Rpb25zIHdoaWxlIGRyYWdnaW5nXG4gICAgQGFkZEJsb2NrZXIoKVxuICAgIEBwYWdlLiRib2R5LmFkZENsYXNzKGNzcy5wcmV2ZW50U2VsZWN0aW9uKVxuICAgIEBkcmFnSGFuZGxlci5zdGFydChldmVudFBvc2l0aW9uKVxuXG5cbiAgZHJvcDogKGV2ZW50KSAtPlxuICAgIEBkcmFnSGFuZGxlci5kcm9wKGV2ZW50KSBpZiBAc3RhcnRlZFxuICAgIGlmICQuaXNGdW5jdGlvbihAb3B0aW9ucy5vbkRyb3ApXG4gICAgICBAb3B0aW9ucy5vbkRyb3AoZXZlbnQsIEBkcmFnSGFuZGxlcilcbiAgICBAcmVzZXQoKVxuXG5cbiAgY2FuY2VsOiAtPlxuICAgIEByZXNldCgpXG5cblxuICByZXNldDogLT5cbiAgICBpZiBAc3RhcnRlZFxuICAgICAgQHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgQHBhZ2UuJGJvZHkucmVtb3ZlQ2xhc3MoY3NzLnByZXZlbnRTZWxlY3Rpb24pXG5cbiAgICBpZiBAaW5pdGlhbGl6ZWRcbiAgICAgIEBpbml0aWFsaXplZCA9IGZhbHNlXG4gICAgICBAc3RhcnRQb2ludCA9IHVuZGVmaW5lZFxuICAgICAgQGRyYWdIYW5kbGVyLnJlc2V0KClcbiAgICAgIEBkcmFnSGFuZGxlciA9IHVuZGVmaW5lZFxuICAgICAgaWYgQHRpbWVvdXQ/XG4gICAgICAgIGNsZWFyVGltZW91dChAdGltZW91dClcbiAgICAgICAgQHRpbWVvdXQgPSB1bmRlZmluZWRcblxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9mZignLmxpdmluZ2RvY3MtZHJhZycpXG4gICAgICBAcmVtb3ZlTG9uZ3ByZXNzSW5kaWNhdG9yKClcbiAgICAgIEByZW1vdmVCbG9ja2VyKClcblxuXG4gIGFkZEJsb2NrZXI6IC0+XG4gICAgJGJsb2NrZXIgPSAkKFwiPGRpdiBjbGFzcz0nI3sgY3NzLmRyYWdCbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgQHBhZ2UuJGJvZHkuYXBwZW5kKCRibG9ja2VyKVxuXG5cbiAgcmVtb3ZlQmxvY2tlcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5kcmFnQmxvY2tlciB9XCIpLnJlbW92ZSgpXG5cblxuICBhZGRMb25ncHJlc3NJbmRpY2F0b3I6ICh7IHBhZ2VYLCBwYWdlWSB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9wdGlvbnMubG9uZ3ByZXNzLnNob3dJbmRpY2F0b3JcbiAgICAkaW5kaWNhdG9yID0gJChcIjxkaXYgY2xhc3M9XFxcIiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVxcXCI+PGRpdj48L2Rpdj48L2Rpdj5cIilcbiAgICAkaW5kaWNhdG9yLmNzcyhsZWZ0OiBwYWdlWCwgdG9wOiBwYWdlWSlcbiAgICBAcGFnZS4kYm9keS5hcHBlbmQoJGluZGljYXRvcilcblxuXG4gIHJlbW92ZUxvbmdwcmVzc0luZGljYXRvcjogLT5cbiAgICBAcGFnZS4kYm9keS5maW5kKFwiLiN7IGNzcy5sb25ncHJlc3NJbmRpY2F0b3IgfVwiKS5yZW1vdmUoKVxuXG5cbiAgIyBUaGVzZSBldmVudHMgYXJlIGluaXRpYWxpemVkIGltbWVkaWF0ZWx5IHRvIGFsbG93IGEgbG9uZy1wcmVzcyBmaW5pc2hcbiAgYWRkU3RvcExpc3RlbmVyczogKGV2ZW50KSAtPlxuICAgIGV2ZW50TmFtZXMgPVxuICAgICAgaWYgZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCdcbiAgICAgICAgJ3RvdWNoZW5kLmxpdmluZ2RvY3MtZHJhZyB0b3VjaGNhbmNlbC5saXZpbmdkb2NzLWRyYWcgdG91Y2hsZWF2ZS5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgICAnZHJvcC5saXZpbmdkb2NzLWRyYWcgZHJhZ2VuZC5saXZpbmdkb2NzLWRyYWcnXG4gICAgICBlbHNlXG4gICAgICAgICdtb3VzZXVwLmxpdmluZ2RvY3MtZHJhZydcblxuICAgIEBwYWdlLiRkb2N1bWVudC5vbiBldmVudE5hbWVzLCAoZXZlbnQpID0+XG4gICAgICBAZHJvcChldmVudClcblxuXG4gICMgVGhlc2UgZXZlbnRzIGFyZSBwb3NzaWJseSBpbml0aWFsaXplZCB3aXRoIGEgZGVsYXkgaW4gY29tcG9uZW50RHJhZyNvblN0YXJ0XG4gIGFkZE1vdmVMaXN0ZW5lcnM6IChldmVudCkgLT5cbiAgICBpZiBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0J1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICd0b3VjaG1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlIGlmIGV2ZW50LnR5cGUgPT0gJ2RyYWdlbnRlcicgfHwgZXZlbnQudHlwZSA9PSAnZHJhZ2JldHRlcmVudGVyJ1xuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdkcmFnb3Zlci5saXZpbmdkb2NzLWRyYWcnLCAoZXZlbnQpID0+XG4gICAgICAgIGlmIEBzdGFydGVkXG4gICAgICAgICAgQGRyYWdIYW5kbGVyLm1vdmUoQGdldEV2ZW50UG9zaXRpb24oZXZlbnQpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1vdmUoZXZlbnQpXG5cbiAgICBlbHNlICMgYWxsIG90aGVyIGlucHV0IGRldmljZXMgYmVoYXZlIGxpa2UgYSBtb3VzZVxuICAgICAgQHBhZ2UuJGRvY3VtZW50Lm9uICdtb3VzZW1vdmUubGl2aW5nZG9jcy1kcmFnJywgKGV2ZW50KSA9PlxuICAgICAgICBpZiBAc3RhcnRlZFxuICAgICAgICAgIEBkcmFnSGFuZGxlci5tb3ZlKEBnZXRFdmVudFBvc2l0aW9uKGV2ZW50KSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtb3ZlKGV2ZW50KVxuXG5cbiAgZ2V0RXZlbnRQb3NpdGlvbjogKGV2ZW50KSAtPlxuICAgIGlmIGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnIHx8IGV2ZW50LnR5cGUgPT0gJ3RvdWNobW92ZSdcbiAgICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlc1swXVxuXG4gICAgIyBTbyBmYXIgSSBkbyBub3QgdW5kZXJzdGFuZCB3aHkgdGhlIGpRdWVyeSBldmVudCBkb2VzIG5vdCBjb250YWluIGNsaWVudFggZXRjLlxuICAgIGVsc2UgaWYgZXZlbnQudHlwZSA9PSAnZHJhZ292ZXInXG4gICAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnRcblxuICAgIGNsaWVudFg6IGV2ZW50LmNsaWVudFhcbiAgICBjbGllbnRZOiBldmVudC5jbGllbnRZXG4gICAgcGFnZVg6IGV2ZW50LnBhZ2VYXG4gICAgcGFnZVk6IGV2ZW50LnBhZ2VZXG5cblxuICBkaXN0YW5jZTogKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgaWYgIXBvaW50QSB8fCAhcG9pbnRCXG5cbiAgICBkaXN0WCA9IHBvaW50QS5wYWdlWCAtIHBvaW50Qi5wYWdlWFxuICAgIGRpc3RZID0gcG9pbnRBLnBhZ2VZIC0gcG9pbnRCLnBhZ2VZXG4gICAgTWF0aC5zcXJ0KCAoZGlzdFggKiBkaXN0WCkgKyAoZGlzdFkgKiBkaXN0WSkgKVxuXG5cblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIGVkaXRhYmxlLmpzIENvbnRyb2xsZXJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEludGVncmF0ZSBlZGl0YWJsZS5qcyBpbnRvIExpdmluZ2RvY3Ncbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWRpdGFibGVDb250cm9sbGVyXG5cbiAgY29uc3RydWN0b3I6IChAcGFnZSkgLT5cblxuICAgICMgSW5pdGlhbGl6ZSBlZGl0YWJsZS5qc1xuICAgIEBlZGl0YWJsZSA9IG5ldyBFZGl0YWJsZVxuICAgICAgd2luZG93OiBAcGFnZS53aW5kb3dcbiAgICAgIGJyb3dzZXJTcGVsbGNoZWNrOiBjb25maWcuZWRpdGFibGUuYnJvd3NlclNwZWxsY2hlY2tcbiAgICAgIG1vdXNlTW92ZVNlbGVjdGlvbkNoYW5nZXM6IGNvbmZpZy5lZGl0YWJsZS5tb3VzZU1vdmVTZWxlY3Rpb25DaGFuZ2VzXG5cbiAgICBAZWRpdGFibGVBdHRyID0gY29uZmlnLmRpcmVjdGl2ZXMuZWRpdGFibGUucmVuZGVyZWRBdHRyXG4gICAgQHNlbGVjdGlvbiA9ICQuQ2FsbGJhY2tzKClcblxuICAgIEBlZGl0YWJsZVxuICAgICAgLmZvY3VzKEB3aXRoQ29udGV4dChAZm9jdXMpKVxuICAgICAgLmJsdXIoQHdpdGhDb250ZXh0KEBibHVyKSlcbiAgICAgIC5pbnNlcnQoQHdpdGhDb250ZXh0KEBpbnNlcnQpKVxuICAgICAgLm1lcmdlKEB3aXRoQ29udGV4dChAbWVyZ2UpKVxuICAgICAgLnNwbGl0KEB3aXRoQ29udGV4dChAc3BsaXQpKVxuICAgICAgLnNlbGVjdGlvbihAd2l0aENvbnRleHQoQHNlbGVjdGlvbkNoYW5nZWQpKVxuICAgICAgLm5ld2xpbmUoQHdpdGhDb250ZXh0KEBuZXdsaW5lKSlcbiAgICAgIC5jaGFuZ2UoQHdpdGhDb250ZXh0KEBjaGFuZ2UpKVxuXG5cbiAgIyBSZWdpc3RlciBET00gbm9kZXMgd2l0aCBlZGl0YWJsZS5qcy5cbiAgIyBBZnRlciB0aGF0IEVkaXRhYmxlIHdpbGwgZmlyZSBldmVudHMgZm9yIHRoYXQgbm9kZS5cbiAgYWRkOiAobm9kZXMpIC0+XG4gICAgQGVkaXRhYmxlLmFkZChub2RlcylcblxuXG4gIGRpc2FibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLnN1c3BlbmQoKVxuXG5cbiAgcmVlbmFibGVBbGw6IC0+XG4gICAgQGVkaXRhYmxlLmNvbnRpbnVlKClcblxuXG4gICMgR2V0IHZpZXcgYW5kIGVkaXRhYmxlTmFtZSBmcm9tIHRoZSBET00gZWxlbWVudCBwYXNzZWQgYnkgZWRpdGFibGUuanNcbiAgI1xuICAjIEFsbCBsaXN0ZW5lcnMgcGFyYW1zIGdldCB0cmFuc2Zvcm1lZCBzbyB0aGV5IGdldCB2aWV3IGFuZCBlZGl0YWJsZU5hbWVcbiAgIyBpbnN0ZWFkIG9mIGVsZW1lbnQ6XG4gICNcbiAgIyBFeGFtcGxlOiBsaXN0ZW5lcih2aWV3LCBlZGl0YWJsZU5hbWUsIG90aGVyUGFyYW1zLi4uKVxuICB3aXRoQ29udGV4dDogKGZ1bmMpIC0+XG4gICAgKGVsZW1lbnQsIGFyZ3MuLi4pID0+XG4gICAgICB2aWV3ID0gZG9tLmZpbmRDb21wb25lbnRWaWV3KGVsZW1lbnQpXG4gICAgICBlZGl0YWJsZU5hbWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShAZWRpdGFibGVBdHRyKVxuICAgICAgYXJncy51bnNoaWZ0KHZpZXcsIGVkaXRhYmxlTmFtZSlcbiAgICAgIGZ1bmMuYXBwbHkodGhpcywgYXJncylcblxuXG4gIGV4dHJhY3RDb250ZW50OiAoZWxlbWVudCkgLT5cbiAgICB2YWx1ZSA9IEBlZGl0YWJsZS5nZXRDb250ZW50KGVsZW1lbnQpXG4gICAgaWYgY29uZmlnLnNpbmdsZUxpbmVCcmVhay50ZXN0KHZhbHVlKSB8fCB2YWx1ZSA9PSAnJ1xuICAgICAgdW5kZWZpbmVkXG4gICAgZWxzZVxuICAgICAgdmFsdWVcblxuXG4gIHVwZGF0ZU1vZGVsOiAodmlldywgZWRpdGFibGVOYW1lLCBlbGVtZW50KSAtPlxuICAgIHZhbHVlID0gQGV4dHJhY3RDb250ZW50KGVsZW1lbnQpXG4gICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCB2YWx1ZSlcblxuXG4gIGZvY3VzOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIHZpZXcuZm9jdXNFZGl0YWJsZShlZGl0YWJsZU5hbWUpXG5cbiAgICBlbGVtZW50ID0gdmlldy5nZXREaXJlY3RpdmVFbGVtZW50KGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUZvY3VzZWQoZWxlbWVudCwgdmlldylcbiAgICB0cnVlICMgZW5hYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICBibHVyOiAodmlldywgZWRpdGFibGVOYW1lKSAtPlxuICAgIEBjbGVhckNoYW5nZVRpbWVvdXQoKVxuXG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbWVudClcblxuICAgIHZpZXcuYmx1ckVkaXRhYmxlKGVkaXRhYmxlTmFtZSlcbiAgICBAcGFnZS5mb2N1cy5lZGl0YWJsZUJsdXJyZWQoZWxlbWVudCwgdmlldylcblxuICAgIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgSW5zZXJ0IGEgbmV3IGJsb2NrLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGF0IHRoZSBlbmQgb2YgYSBibG9ja1xuICAjIG9yIGJ5IHByZXNzaW5nIGRlbGV0ZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgYmxvY2suXG4gIGluc2VydDogKHZpZXcsIGVkaXRhYmxlTmFtZSwgZGlyZWN0aW9uLCBjdXJzb3IpIC0+XG4gICAgZGVmYXVsdFBhcmFncmFwaCA9IEBwYWdlLmRlc2lnbi5kZWZhdWx0UGFyYWdyYXBoXG4gICAgaWYgQGhhc1NpbmdsZUVkaXRhYmxlKHZpZXcpICYmIGRlZmF1bHRQYXJhZ3JhcGg/XG4gICAgICBjb3B5ID0gZGVmYXVsdFBhcmFncmFwaC5jcmVhdGVNb2RlbCgpXG5cbiAgICAgIG5ld1ZpZXcgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgdmlldy5tb2RlbC5iZWZvcmUoY29weSlcbiAgICAgICAgdmlldy5wcmV2KClcbiAgICAgIGVsc2VcbiAgICAgICAgdmlldy5tb2RlbC5hZnRlcihjb3B5KVxuICAgICAgICB2aWV3Lm5leHQoKVxuXG4gICAgICBuZXdWaWV3LmZvY3VzKCkgaWYgbmV3VmlldyAmJiBkaXJlY3Rpb24gPT0gJ2FmdGVyJ1xuXG5cbiAgICBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgTWVyZ2UgdHdvIGJsb2Nrcy4gV29ya3MgaW4gdHdvIGRpcmVjdGlvbnMuXG4gICMgRWl0aGVyIHRoZSBjdXJyZW50IGJsb2NrIGlzIGJlaW5nIG1lcmdlZCBpbnRvIHRoZSBwcmVjZWVkaW5nICgnYmVmb3JlJylcbiAgIyBvciB0aGUgZm9sbG93aW5nICgnYWZ0ZXInKSBibG9jay5cbiAgIyBBZnRlciB0aGUgbWVyZ2UgdGhlIGN1cnJlbnQgYmxvY2sgaXMgcmVtb3ZlZCBhbmQgdGhlIGZvY3VzIHNldCB0byB0aGVcbiAgIyBvdGhlciBibG9jayB0aGF0IHdhcyBtZXJnZWQgaW50by5cbiAgbWVyZ2U6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGRpcmVjdGlvbiwgY3Vyc29yKSAtPlxuICAgIGlmIEBoYXNTaW5nbGVFZGl0YWJsZSh2aWV3KVxuICAgICAgbWVyZ2VkVmlldyA9IGlmIGRpcmVjdGlvbiA9PSAnYmVmb3JlJyB0aGVuIHZpZXcucHJldigpIGVsc2Ugdmlldy5uZXh0KClcblxuICAgICAgaWYgbWVyZ2VkVmlldyAmJiBtZXJnZWRWaWV3LnRlbXBsYXRlID09IHZpZXcudGVtcGxhdGVcbiAgICAgICAgdmlld0VsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgICBtZXJnZWRWaWV3RWxlbSA9IG1lcmdlZFZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG5cbiAgICAgICAgIyBHYXRoZXIgdGhlIGNvbnRlbnQgdGhhdCBpcyBnb2luZyB0byBiZSBtZXJnZWRcbiAgICAgICAgY29udGVudFRvTWVyZ2UgPSBAZWRpdGFibGUuZ2V0Q29udGVudCh2aWV3RWxlbSlcblxuICAgICAgICBjdXJzb3IgPSBpZiBkaXJlY3Rpb24gPT0gJ2JlZm9yZSdcbiAgICAgICAgICBAZWRpdGFibGUuYXBwZW5kVG8obWVyZ2VkVmlld0VsZW0sIGNvbnRlbnRUb01lcmdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRhYmxlLnByZXBlbmRUbyhtZXJnZWRWaWV3RWxlbSwgY29udGVudFRvTWVyZ2UpXG5cbiAgICAgICAgdmlldy5tb2RlbC5yZW1vdmUoKVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZVNlbGVjdGlvbigpXG5cbiAgICAgICAgIyBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgYW5kIHRoZSBmb2N1cyBpcyBzZXQgdXBkYXRlIHRoZSBtb2RlbCB0b1xuICAgICAgICAjIG1ha2Ugc3VyZSB0aGUgbW9kZWwgaXMgdXAgdG8gZGF0ZSBhbmQgY2hhbmdlcyBhcmUgbm90aWZpZWQuXG4gICAgICAgIEB1cGRhdGVNb2RlbChtZXJnZWRWaWV3LCBlZGl0YWJsZU5hbWUsIG1lcmdlZFZpZXdFbGVtKVxuXG4gICAgZmFsc2UgIyBkaXNhYmxlIGVkaXRhYmxlLmpzIGRlZmF1bHQgYmVoYXZpb3VyXG5cblxuICAjIFNwbGl0IGEgYmxvY2sgaW4gdHdvLlxuICAjIFVzdWFsbHkgdHJpZ2dlcmVkIGJ5IHByZXNzaW5nIGVudGVyIGluIHRoZSBtaWRkbGUgb2YgYSBibG9jay5cbiAgc3BsaXQ6ICh2aWV3LCBlZGl0YWJsZU5hbWUsIGJlZm9yZSwgYWZ0ZXIsIGN1cnNvcikgLT5cbiAgICBpZiBAaGFzU2luZ2xlRWRpdGFibGUodmlldylcblxuICAgICAgIyBhcHBlbmQgYW5kIGZvY3VzIGNvcHkgb2YgY29tcG9uZW50XG4gICAgICBjb3B5ID0gdmlldy50ZW1wbGF0ZS5jcmVhdGVNb2RlbCgpXG4gICAgICBjb3B5LnNldChlZGl0YWJsZU5hbWUsIEBleHRyYWN0Q29udGVudChhZnRlcikpXG4gICAgICB2aWV3Lm1vZGVsLmFmdGVyKGNvcHkpXG4gICAgICB2aWV3Lm5leHQoKT8uZm9jdXMoKVxuXG4gICAgICAjIHNldCBjb250ZW50IG9mIHRoZSBiZWZvcmUgZWxlbWVudCAoYWZ0ZXIgZm9jdXMgaXMgc2V0IHRvIHRoZSBhZnRlciBlbGVtZW50KVxuICAgICAgdmlldy5tb2RlbC5zZXQoZWRpdGFibGVOYW1lLCBAZXh0cmFjdENvbnRlbnQoYmVmb3JlKSlcblxuICAgIGZhbHNlICMgZGlzYWJsZSBlZGl0YWJsZS5qcyBkZWZhdWx0IGJlaGF2aW91clxuXG5cbiAgIyBPY2N1cnMgd2hlbmV2ZXIgdGhlIHVzZXIgc2VsZWN0cyBvbmUgb3IgbW9yZSBjaGFyYWN0ZXJzIG9yIHdoZW5ldmVyIHRoZVxuICAjIHNlbGVjdGlvbiBpcyBjaGFuZ2VkLlxuICBzZWxlY3Rpb25DaGFuZ2VkOiAodmlldywgZWRpdGFibGVOYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgZWxlbWVudCA9IHZpZXcuZ2V0RGlyZWN0aXZlRWxlbWVudChlZGl0YWJsZU5hbWUpXG4gICAgQHNlbGVjdGlvbi5maXJlKHZpZXcsIGVsZW1lbnQsIHNlbGVjdGlvbilcblxuXG4gICMgSW5zZXJ0IGEgbmV3bGluZSAoU2hpZnQgKyBFbnRlcilcbiAgbmV3bGluZTogKHZpZXcsIGVkaXRhYmxlLCBjdXJzb3IpIC0+XG4gICAgaWYgY29uZmlnLmVkaXRhYmxlLmFsbG93TmV3bGluZVxuICAgICAgcmV0dXJuIHRydWUgIyBlbmFibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBlbHNlXG4gICAgIHJldHVybiBmYWxzZSAjIGRpc2FibGUgZWRpdGFibGUuanMgZGVmYXVsdCBiZWhhdmlvdXJcblxuXG4gICMgVHJpZ2dlcmVkIHdoZW5ldmVyIHRoZSB1c2VyIGNoYW5nZXMgdGhlIGNvbnRlbnQgb2YgYSBibG9jay5cbiAgIyBUaGUgY2hhbmdlIGV2ZW50IGRvZXMgbm90IGF1dG9tYXRpY2FsbHkgZmlyZSBpZiB0aGUgY29udGVudCBoYXNcbiAgIyBiZWVuIGNoYW5nZWQgdmlhIGphdmFzY3JpcHQuXG4gIGNoYW5nZTogKHZpZXcsIGVkaXRhYmxlTmFtZSkgLT5cbiAgICBAY2xlYXJDaGFuZ2VUaW1lb3V0KClcbiAgICByZXR1cm4gaWYgY29uZmlnLmVkaXRhYmxlLmNoYW5nZURlbGF5ID09IGZhbHNlXG5cbiAgICBAY2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIGVsZW0gPSB2aWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoZWRpdGFibGVOYW1lKVxuICAgICAgQHVwZGF0ZU1vZGVsKHZpZXcsIGVkaXRhYmxlTmFtZSwgZWxlbSlcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgLCBjb25maWcuZWRpdGFibGUuY2hhbmdlRGVsYXlcblxuXG4gIGNsZWFyQ2hhbmdlVGltZW91dDogLT5cbiAgICBpZiBAY2hhbmdlVGltZW91dD9cbiAgICAgIGNsZWFyVGltZW91dChAY2hhbmdlVGltZW91dClcbiAgICAgIEBjaGFuZ2VUaW1lb3V0ID0gdW5kZWZpbmVkXG5cblxuICBoYXNTaW5nbGVFZGl0YWJsZTogKHZpZXcpIC0+XG4gICAgdmlldy5kaXJlY3RpdmVzLmxlbmd0aCA9PSAxICYmIHZpZXcuZGlyZWN0aXZlc1swXS50eXBlID09ICdlZGl0YWJsZSdcblxuIiwiZG9tID0gcmVxdWlyZSgnLi9kb20nKVxuXG4jIENvbXBvbmVudCBGb2N1c1xuIyAtLS0tLS0tLS0tLS0tLS1cbiMgTWFuYWdlIHRoZSBjb21wb25lbnQgb3IgZWRpdGFibGUgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBGb2N1c1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcbiAgICBAY29tcG9uZW50VmlldyA9IHVuZGVmaW5lZFxuXG4gICAgQGNvbXBvbmVudEZvY3VzID0gJC5DYWxsYmFja3MoKVxuICAgIEBjb21wb25lbnRCbHVyID0gJC5DYWxsYmFja3MoKVxuXG5cbiAgc2V0Rm9jdXM6IChjb21wb25lbnRWaWV3LCBlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgZWRpdGFibGVOb2RlICE9IEBlZGl0YWJsZU5vZGVcbiAgICAgIEByZXNldEVkaXRhYmxlKClcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSBlZGl0YWJsZU5vZGVcblxuICAgIGlmIGNvbXBvbmVudFZpZXcgIT0gQGNvbXBvbmVudFZpZXdcbiAgICAgIEByZXNldENvbXBvbmVudFZpZXcoKVxuICAgICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgICBAY29tcG9uZW50VmlldyA9IGNvbXBvbmVudFZpZXdcbiAgICAgICAgQGNvbXBvbmVudEZvY3VzLmZpcmUoQGNvbXBvbmVudFZpZXcpXG5cblxuICAjIGNhbGwgYWZ0ZXIgYnJvd3NlciBmb2N1cyBjaGFuZ2VcbiAgZWRpdGFibGVGb2N1c2VkOiAoZWRpdGFibGVOb2RlLCBjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGUgIT0gZWRpdGFibGVOb2RlXG4gICAgICBjb21wb25lbnRWaWV3IHx8PSBkb20uZmluZENvbXBvbmVudFZpZXcoZWRpdGFibGVOb2RlKVxuICAgICAgQHNldEZvY3VzKGNvbXBvbmVudFZpZXcsIGVkaXRhYmxlTm9kZSlcblxuXG4gICMgY2FsbCBhZnRlciBicm93c2VyIGZvY3VzIGNoYW5nZVxuICBlZGl0YWJsZUJsdXJyZWQ6IChlZGl0YWJsZU5vZGUpIC0+XG4gICAgaWYgQGVkaXRhYmxlTm9kZSA9PSBlZGl0YWJsZU5vZGVcbiAgICAgIEBzZXRGb2N1cyhAY29tcG9uZW50VmlldywgdW5kZWZpbmVkKVxuXG5cbiAgIyBjYWxsIGFmdGVyIGNsaWNrXG4gIGNvbXBvbmVudEZvY3VzZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIEBjb21wb25lbnRWaWV3ICE9IGNvbXBvbmVudFZpZXdcbiAgICAgIEBzZXRGb2N1cyhjb21wb25lbnRWaWV3LCB1bmRlZmluZWQpXG5cblxuICBibHVyOiAtPlxuICAgIEBzZXRGb2N1cyh1bmRlZmluZWQsIHVuZGVmaW5lZClcblxuXG4gICMgUHJpdmF0ZVxuICAjIC0tLS0tLS1cblxuICAjIEBhcGkgcHJpdmF0ZVxuICByZXNldEVkaXRhYmxlOiAtPlxuICAgIGlmIEBlZGl0YWJsZU5vZGVcbiAgICAgIEBlZGl0YWJsZU5vZGUgPSB1bmRlZmluZWRcblxuXG4gICMgQGFwaSBwcml2YXRlXG4gIHJlc2V0Q29tcG9uZW50VmlldzogLT5cbiAgICBpZiBAY29tcG9uZW50Vmlld1xuICAgICAgcHJldmlvdXMgPSBAY29tcG9uZW50Vmlld1xuICAgICAgQGNvbXBvbmVudFZpZXcgPSB1bmRlZmluZWRcbiAgICAgIEBjb21wb25lbnRCbHVyLmZpcmUocHJldmlvdXMpXG5cblxuIiwiYXNzZXJ0ID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblJlbmRlcmluZ0NvbnRhaW5lciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nX2NvbnRhaW5lci9yZW5kZXJpbmdfY29udGFpbmVyJylcblBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXIvaW50ZXJhY3RpdmVfcGFnZScpXG5SZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyaW5nL3JlbmRlcmVyJylcblZpZXcgPSByZXF1aXJlKCcuL3JlbmRlcmluZy92aWV3JylcbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi9pbnRlcmFjdGlvbi9kb20nKVxuZGVzaWduQ2FjaGUgPSByZXF1aXJlKCcuL2Rlc2lnbi9kZXNpZ25fY2FjaGUnKVxuQ29tcG9uZW50VHJlZSA9IHJlcXVpcmUoJy4vY29tcG9uZW50X3RyZWUvY29tcG9uZW50X3RyZWUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIExpdmluZ2RvYyBleHRlbmRzIEV2ZW50RW1pdHRlclxuXG5cbiAgIyBDcmVhdGUgYSBuZXcgbGl2aW5nZG9jIGluIGEgc3luY2hyb25vdXMgd2F5LlxuICAjIFRoZSBkZXNpZ24gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gICNcbiAgIyBDYWxsIE9wdGlvbnM6XG4gICMgLSBuZXcoeyBkYXRhIH0pXG4gICMgICBMb2FkIGEgbGl2aW5nZG9jIHdpdGggSlNPTiBkYXRhXG4gICNcbiAgIyAtIG5ldyh7IGRlc2lnbiB9KVxuICAjICAgVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBlbXB0eSBsaXZpbmdkb2Mgd2l0aCB5b3VyXG4gICMgICBzcGVjaWZpZWQgZGVzaWduXG4gICNcbiAgIyAtIG5ldyh7IGNvbXBvbmVudFRyZWUgfSlcbiAgIyAgIFRoaXMgd2lsbCBjcmVhdGUgYSBuZXcgbGl2aW5nZG9jIGZyb20gYVxuICAjICAgY29tcG9uZW50VHJlZVxuICAjXG4gICMgQHBhcmFtIGRhdGEgeyBqc29uIHN0cmluZyB9IFNlcmlhbGl6ZWQgTGl2aW5nZG9jXG4gICMgQHBhcmFtIGRlc2lnbk5hbWUgeyBzdHJpbmcgfSBOYW1lIG9mIGEgZGVzaWduXG4gICMgQHBhcmFtIGNvbXBvbmVudFRyZWUgeyBDb21wb25lbnRUcmVlIH0gQSBjb21wb25lbnRUcmVlIGluc3RhbmNlXG4gICMgQHJldHVybnMgeyBMaXZpbmdkb2Mgb2JqZWN0IH1cbiAgQGNyZWF0ZTogKHsgZGF0YSwgZGVzaWduTmFtZSwgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIGNvbXBvbmVudFRyZWUgPSBpZiBkYXRhP1xuICAgICAgZGVzaWduTmFtZSA9IGRhdGEuZGVzaWduPy5uYW1lXG4gICAgICBhc3NlcnQgZGVzaWduTmFtZT8sICdFcnJvciBjcmVhdGluZyBsaXZpbmdkb2M6IE5vIGRlc2lnbiBpcyBzcGVjaWZpZWQuJ1xuICAgICAgZGVzaWduID0gZGVzaWduQ2FjaGUuZ2V0KGRlc2lnbk5hbWUpXG4gICAgICBuZXcgQ29tcG9uZW50VHJlZShjb250ZW50OiBkYXRhLCBkZXNpZ246IGRlc2lnbilcbiAgICBlbHNlIGlmIGRlc2lnbk5hbWU/XG4gICAgICBkZXNpZ24gPSBkZXNpZ25DYWNoZS5nZXQoZGVzaWduTmFtZSlcbiAgICAgIG5ldyBDb21wb25lbnRUcmVlKGRlc2lnbjogZGVzaWduKVxuICAgIGVsc2VcbiAgICAgIGNvbXBvbmVudFRyZWVcblxuICAgIG5ldyBMaXZpbmdkb2MoeyBjb21wb25lbnRUcmVlIH0pXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgY29tcG9uZW50VHJlZSB9KSAtPlxuICAgIEBkZXNpZ24gPSBjb21wb25lbnRUcmVlLmRlc2lnblxuICAgIEBzZXRDb21wb25lbnRUcmVlKGNvbXBvbmVudFRyZWUpXG4gICAgQHZpZXdzID0ge31cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdW5kZWZpbmVkXG5cblxuICAjIEdldCBhIGRyb3AgdGFyZ2V0IGZvciBhbiBldmVudFxuICBnZXREcm9wVGFyZ2V0OiAoeyBldmVudCB9KSAtPlxuICAgIGRvY3VtZW50ID0gZXZlbnQudGFyZ2V0Lm93bmVyRG9jdW1lbnRcbiAgICB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50XG4gICAgZWxlbSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoY2xpZW50WCwgY2xpZW50WSlcbiAgICBpZiBlbGVtP1xuICAgICAgY29vcmRzID0geyBsZWZ0OiBldmVudC5wYWdlWCwgdG9wOiBldmVudC5wYWdlWSB9XG4gICAgICB0YXJnZXQgPSBkb20uZHJvcFRhcmdldChlbGVtLCBjb29yZHMpXG5cblxuICBzZXRDb21wb25lbnRUcmVlOiAoY29tcG9uZW50VHJlZSkgLT5cbiAgICBhc3NlcnQgY29tcG9uZW50VHJlZS5kZXNpZ24gPT0gQGRlc2lnbixcbiAgICAgICdDb21wb25lbnRUcmVlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZXNpZ24gYXMgdGhlIGRvY3VtZW50J1xuXG4gICAgQG1vZGVsID0gQGNvbXBvbmVudFRyZWUgPSBjb21wb25lbnRUcmVlXG4gICAgQGZvcndhcmRDb21wb25lbnRUcmVlRXZlbnRzKClcblxuXG4gIGZvcndhcmRDb21wb25lbnRUcmVlRXZlbnRzOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmNoYW5nZWQuYWRkID0+XG4gICAgICBAZW1pdCAnY2hhbmdlJywgYXJndW1lbnRzXG5cblxuICBjcmVhdGVWaWV3OiAocGFyZW50LCBvcHRpb25zPXt9KSAtPlxuICAgIHBhcmVudCA/PSB3aW5kb3cuZG9jdW1lbnQuYm9keVxuICAgIG9wdGlvbnMucmVhZE9ubHkgPz0gdHJ1ZVxuXG4gICAgJHBhcmVudCA9ICQocGFyZW50KS5maXJzdCgpXG5cbiAgICBvcHRpb25zLiR3cmFwcGVyID89IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuICAgIHZpZXcgPSBuZXcgVmlldyhAY29tcG9uZW50VHJlZSwgJHBhcmVudFswXSlcbiAgICBwcm9taXNlID0gdmlldy5jcmVhdGUob3B0aW9ucylcblxuICAgIGlmIHZpZXcuaXNJbnRlcmFjdGl2ZVxuICAgICAgQHNldEludGVyYWN0aXZlVmlldyh2aWV3KVxuXG4gICAgcHJvbWlzZVxuXG5cbiAgY3JlYXRlQ29tcG9uZW50OiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmNyZWF0ZUNvbXBvbmVudC5hcHBseShAY29tcG9uZW50VHJlZSwgYXJndW1lbnRzKVxuXG5cbiAgIyBBcHBlbmQgdGhlIGFydGljbGUgdG8gdGhlIERPTS5cbiAgI1xuICAjIEBwYXJhbSB7IERPTSBOb2RlLCBqUXVlcnkgb2JqZWN0IG9yIENTUyBzZWxlY3RvciBzdHJpbmcgfSBXaGVyZSB0byBhcHBlbmQgdGhlIGFydGljbGUgaW4gdGhlIGRvY3VtZW50LlxuICAjIEBwYXJhbSB7IE9iamVjdCB9IG9wdGlvbnM6XG4gICMgICBpbnRlcmFjdGl2ZTogeyBCb29sZWFuIH0gV2hldGhlciB0aGUgZG9jdW1lbnQgaXMgZWR0aWFibGUuXG4gICMgICBsb2FkQXNzZXRzOiB7IEJvb2xlYW4gfSBMb2FkIENTUyBmaWxlcy4gT25seSBkaXNhYmxlIHRoaXMgaWYgeW91IGFyZSBzdXJlIHlvdSBoYXZlIGxvYWRlZCBldmVyeXRoaW5nIG1hbnVhbGx5LlxuICAjXG4gICMgRXhhbXBsZTpcbiAgIyBhcnRpY2xlLmFwcGVuZFRvKCcuYXJ0aWNsZScsIHsgaW50ZXJhY3RpdmU6IHRydWUsIGxvYWRBc3NldHM6IGZhbHNlIH0pO1xuICBhcHBlbmRUbzogKHBhcmVudCwgb3B0aW9ucz17fSkgLT5cbiAgICAkcGFyZW50ID0gJChwYXJlbnQpLmZpcnN0KClcbiAgICBvcHRpb25zLiR3cmFwcGVyID89IEBmaW5kV3JhcHBlcigkcGFyZW50KVxuICAgICRwYXJlbnQuaHRtbCgnJykgIyBlbXB0eSBjb250YWluZXJcblxuICAgIHZpZXcgPSBuZXcgVmlldyhAY29tcG9uZW50VHJlZSwgJHBhcmVudFswXSlcbiAgICB2aWV3LmNyZWF0ZVJlbmRlcmVyKHsgb3B0aW9ucyB9KVxuXG5cblxuICAjIEEgdmlldyBzb21ldGltZXMgaGFzIHRvIGJlIHdyYXBwZWQgaW4gYSBjb250YWluZXIuXG4gICNcbiAgIyBFeGFtcGxlOlxuICAjIEhlcmUgdGhlIGRvY3VtZW50IGlzIHJlbmRlcmVkIGludG8gJCgnLmRvYy1zZWN0aW9uJylcbiAgIyA8ZGl2IGNsYXNzPVwiaWZyYW1lLWNvbnRhaW5lclwiPlxuICAjICAgPHNlY3Rpb24gY2xhc3M9XCJjb250YWluZXIgZG9jLXNlY3Rpb25cIj48L3NlY3Rpb24+XG4gICMgPC9kaXY+XG4gIGZpbmRXcmFwcGVyOiAoJHBhcmVudCkgLT5cbiAgICBpZiAkcGFyZW50LmZpbmQoXCIuI3sgY29uZmlnLmNzcy5zZWN0aW9uIH1cIikubGVuZ3RoID09IDFcbiAgICAgICR3cmFwcGVyID0gJCgkcGFyZW50Lmh0bWwoKSlcblxuICAgICR3cmFwcGVyXG5cblxuICBzZXRJbnRlcmFjdGl2ZVZpZXc6ICh2aWV3KSAtPlxuICAgIGFzc2VydCBub3QgQGludGVyYWN0aXZlVmlldz8sXG4gICAgICAnRXJyb3IgY3JlYXRpbmcgaW50ZXJhY3RpdmUgdmlldzogTGl2aW5nZG9jIGNhbiBoYXZlIG9ubHkgb25lIGludGVyYWN0aXZlIHZpZXcnXG5cbiAgICBAaW50ZXJhY3RpdmVWaWV3ID0gdmlld1xuXG5cbiAgdG9IdG1sOiAoeyBleGNsdWRlQ29tcG9uZW50cyB9PXt9KSAtPlxuICAgIG5ldyBSZW5kZXJlcihcbiAgICAgIGNvbXBvbmVudFRyZWU6IEBjb21wb25lbnRUcmVlXG4gICAgICByZW5kZXJpbmdDb250YWluZXI6IG5ldyBSZW5kZXJpbmdDb250YWluZXIoKVxuICAgICAgZXhjbHVkZUNvbXBvbmVudHM6IGV4Y2x1ZGVDb21wb25lbnRzXG4gICAgKS5odG1sKClcblxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAY29tcG9uZW50VHJlZS5zZXJpYWxpemUoKVxuXG5cbiAgdG9Kc29uOiAocHJldHRpZnkpIC0+XG4gICAgZGF0YSA9IEBzZXJpYWxpemUoKVxuICAgIGlmIHByZXR0aWZ5P1xuICAgICAgcmVwbGFjZXIgPSBudWxsXG4gICAgICBpbmRlbnRhdGlvbiA9IDJcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEsIHJlcGxhY2VyLCBpbmRlbnRhdGlvbilcbiAgICBlbHNlXG4gICAgICBKU09OLnN0cmluZ2lmeShkYXRhKVxuXG5cbiAgIyBEZWJ1Z1xuICAjIC0tLS0tXG5cbiAgIyBQcmludCB0aGUgQ29tcG9uZW50VHJlZS5cbiAgcHJpbnRNb2RlbDogKCkgLT5cbiAgICBAY29tcG9uZW50VHJlZS5wcmludCgpXG5cblxuICBMaXZpbmdkb2MuZG9tID0gZG9tXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gICMgQWRkIGFuIGV2ZW50IGxpc3RlbmVyIHRvIGEgJC5DYWxsYmFja3Mgb2JqZWN0IHRoYXQgd2lsbFxuICAjIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgJC5DYWxsYmFja3MgYWZ0ZXIgdGhlIGZpcnN0IGNhbGwuXG4gIGNhbGxPbmNlOiAoY2FsbGJhY2tzLCBsaXN0ZW5lcikgLT5cbiAgICBzZWxmUmVtb3ZpbmdGdW5jID0gKGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFja3MucmVtb3ZlKHNlbGZSZW1vdmluZ0Z1bmMpXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKVxuXG4gICAgY2FsbGJhY2tzLmFkZChzZWxmUmVtb3ZpbmdGdW5jKVxuICAgIHNlbGZSZW1vdmluZ0Z1bmNcbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBodG1sUG9pbnRlckV2ZW50czogLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneCcpXG4gICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gJ3BvaW50ZXItZXZlbnRzOmF1dG8nXG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9PSAnYXV0bydcbiIsImRldGVjdHMgPSByZXF1aXJlKCcuL2ZlYXR1cmVfZGV0ZWN0cycpXG5cbmV4ZWN1dGVkVGVzdHMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IChuYW1lKSAtPlxuICBpZiAocmVzdWx0ID0gZXhlY3V0ZWRUZXN0c1tuYW1lXSkgPT0gdW5kZWZpbmVkXG4gICAgZXhlY3V0ZWRUZXN0c1tuYW1lXSA9IEJvb2xlYW4oZGV0ZWN0c1tuYW1lXSgpKVxuICBlbHNlXG4gICAgcmVzdWx0XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBpZENvdW50ZXIgPSBsYXN0SWQgPSB1bmRlZmluZWRcblxuICAjIEdlbmVyYXRlIGEgdW5pcXVlIGlkLlxuICAjIEd1YXJhbnRlZXMgYSB1bmlxdWUgaWQgaW4gdGhpcyBydW50aW1lLlxuICAjIEFjcm9zcyBydW50aW1lcyBpdHMgbGlrZWx5IGJ1dCBub3QgZ3VhcmFudGVlZCB0byBiZSB1bmlxdWVcbiAgIyBVc2UgdGhlIHVzZXIgcHJlZml4IHRvIGFsbW9zdCBndWFyYW50ZWUgdW5pcXVlbmVzcyxcbiAgIyBhc3N1bWluZyB0aGUgc2FtZSB1c2VyIGNhbm5vdCBnZW5lcmF0ZSBjb21wb25lbnRzIGluXG4gICMgbXVsdGlwbGUgcnVudGltZXMgYXQgdGhlIHNhbWUgdGltZSAoYW5kIHRoYXQgY2xvY2tzIGFyZSBpbiBzeW5jKVxuICBuZXh0OiAodXNlciA9ICdkb2MnKSAtPlxuXG4gICAgIyBnZW5lcmF0ZSA5LWRpZ2l0IHRpbWVzdGFtcFxuICAgIG5leHRJZCA9IERhdGUubm93KCkudG9TdHJpbmcoMzIpXG5cbiAgICAjIGFkZCBjb3VudGVyIGlmIG11bHRpcGxlIHRyZWVzIG5lZWQgaWRzIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kXG4gICAgaWYgbGFzdElkID09IG5leHRJZFxuICAgICAgaWRDb3VudGVyICs9IDFcbiAgICBlbHNlXG4gICAgICBpZENvdW50ZXIgPSAwXG4gICAgICBsYXN0SWQgPSBuZXh0SWRcblxuICAgIFwiI3sgdXNlciB9LSN7IG5leHRJZCB9I3sgaWRDb3VudGVyIH1cIlxuIiwibW9kdWxlLmV4cG9ydHMgPSAkXG4iLCJsb2cgPSByZXF1aXJlKCcuL2xvZycpXG5cbiMgRnVuY3Rpb24gdG8gYXNzZXJ0IGEgY29uZGl0aW9uLiBJZiB0aGUgY29uZGl0aW9uIGlzIG5vdCBtZXQsIGFuIGVycm9yIGlzXG4jIHJhaXNlZCB3aXRoIHRoZSBzcGVjaWZpZWQgbWVzc2FnZS5cbiNcbiMgQGV4YW1wbGVcbiNcbiMgICBhc3NlcnQgYSBpc250IGIsICdhIGNhbiBub3QgYmUgYidcbiNcbm1vZHVsZS5leHBvcnRzID0gYXNzZXJ0ID0gKGNvbmRpdGlvbiwgbWVzc2FnZSkgLT5cbiAgbG9nLmVycm9yKG1lc3NhZ2UpIHVubGVzcyBjb25kaXRpb25cbiIsIlxuIyBMb2cgSGVscGVyXG4jIC0tLS0tLS0tLS1cbiMgRGVmYXVsdCBsb2dnaW5nIGhlbHBlclxuIyBAcGFyYW1zOiBwYXNzIGBcInRyYWNlXCJgIGFzIGxhc3QgcGFyYW1ldGVyIHRvIG91dHB1dCB0aGUgY2FsbCBzdGFja1xubW9kdWxlLmV4cG9ydHMgPSBsb2cgPSAoYXJncy4uLikgLT5cbiAgaWYgd2luZG93LmNvbnNvbGU/XG4gICAgaWYgYXJncy5sZW5ndGggYW5kIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAndHJhY2UnXG4gICAgICBhcmdzLnBvcCgpXG4gICAgICB3aW5kb3cuY29uc29sZS50cmFjZSgpIGlmIHdpbmRvdy5jb25zb2xlLnRyYWNlP1xuXG4gICAgd2luZG93LmNvbnNvbGUubG9nLmFwcGx5KHdpbmRvdy5jb25zb2xlLCBhcmdzKVxuICAgIHVuZGVmaW5lZFxuXG5cbmRvIC0+XG5cbiAgIyBDdXN0b20gZXJyb3IgdHlwZSBmb3IgbGl2aW5nZG9jcy5cbiAgIyBXZSBjYW4gdXNlIHRoaXMgdG8gdHJhY2sgdGhlIG9yaWdpbiBvZiBhbiBleHBlY3Rpb24gaW4gdW5pdCB0ZXN0cy5cbiAgY2xhc3MgTGl2aW5nZG9jc0Vycm9yIGV4dGVuZHMgRXJyb3JcblxuICAgIGNvbnN0cnVjdG9yOiAobWVzc2FnZSkgLT5cbiAgICAgIHN1cGVyXG4gICAgICBAbWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgIEB0aHJvd25CeUxpdmluZ2RvY3MgPSB0cnVlXG5cblxuICAjIEBwYXJhbSBsZXZlbDogb25lIG9mIHRoZXNlIHN0cmluZ3M6XG4gICMgJ2NyaXRpY2FsJywgJ2Vycm9yJywgJ3dhcm5pbmcnLCAnaW5mbycsICdkZWJ1ZydcbiAgbm90aWZ5ID0gKG1lc3NhZ2UsIGxldmVsID0gJ2Vycm9yJykgLT5cbiAgICBpZiBfcm9sbGJhcj9cbiAgICAgIF9yb2xsYmFyLnB1c2ggbmV3IEVycm9yKG1lc3NhZ2UpLCAtPlxuICAgICAgICBpZiAobGV2ZWwgPT0gJ2NyaXRpY2FsJyBvciBsZXZlbCA9PSAnZXJyb3InKSBhbmQgd2luZG93LmNvbnNvbGU/LmVycm9yP1xuICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmVycm9yLmNhbGwod2luZG93LmNvbnNvbGUsIG1lc3NhZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG4gICAgZWxzZVxuICAgICAgaWYgKGxldmVsID09ICdjcml0aWNhbCcgb3IgbGV2ZWwgPT0gJ2Vycm9yJylcbiAgICAgICAgdGhyb3cgbmV3IExpdmluZ2RvY3NFcnJvcihtZXNzYWdlKVxuICAgICAgZWxzZVxuICAgICAgICBsb2cuY2FsbCh1bmRlZmluZWQsIG1lc3NhZ2UpXG5cbiAgICB1bmRlZmluZWRcblxuXG4gIGxvZy5kZWJ1ZyA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZGVidWcnKSB1bmxlc3MgbG9nLmRlYnVnRGlzYWJsZWRcblxuXG4gIGxvZy53YXJuID0gKG1lc3NhZ2UpIC0+XG4gICAgbm90aWZ5KG1lc3NhZ2UsICd3YXJuaW5nJykgdW5sZXNzIGxvZy53YXJuaW5nc0Rpc2FibGVkXG5cblxuICAjIExvZyBlcnJvciBhbmQgdGhyb3cgZXhjZXB0aW9uXG4gIGxvZy5lcnJvciA9IChtZXNzYWdlKSAtPlxuICAgIG5vdGlmeShtZXNzYWdlLCAnZXJyb3InKVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE9yZGVyZWRIYXNoXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQG9iaiA9IHt9XG4gICAgQGxlbmd0aCA9IDBcblxuXG4gIHB1c2g6IChrZXksIHZhbHVlKSAtPlxuICAgIEBvYmpba2V5XSA9IHZhbHVlXG4gICAgQFtAbGVuZ3RoXSA9IHZhbHVlXG4gICAgQGxlbmd0aCArPSAxXG5cblxuICBnZXQ6IChrZXkpIC0+XG4gICAgQG9ialtrZXldXG5cblxuICBlYWNoOiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIHZhbHVlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKHZhbHVlKVxuXG5cbiAgdG9BcnJheTogLT5cbiAgICB2YWx1ZSBmb3IgdmFsdWUgaW4gdGhpc1xuXG4iLCJhc3NlcnQgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvYXNzZXJ0JylcblxuIyBUaGlzIGNsYXNzIGNhbiBiZSB1c2VkIHRvIHdhaXQgZm9yIHRhc2tzIHRvIGZpbmlzaCBiZWZvcmUgZmlyaW5nIGEgc2VyaWVzIG9mXG4jIGNhbGxiYWNrcy4gT25jZSBzdGFydCgpIGlzIGNhbGxlZCwgdGhlIGNhbGxiYWNrcyBmaXJlIGFzIHNvb24gYXMgdGhlIGNvdW50XG4jIHJlYWNoZXMgMC4gVGh1cywgeW91IHNob3VsZCBpbmNyZW1lbnQgdGhlIGNvdW50IGJlZm9yZSBzdGFydGluZyBpdC4gV2hlblxuIyBhZGRpbmcgYSBjYWxsYmFjayBhZnRlciBoYXZpbmcgZmlyZWQgY2F1c2VzIHRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgcmlnaHRcbiMgYXdheS4gSW5jcmVtZW50aW5nIHRoZSBjb3VudCBhZnRlciBpdCBmaXJlZCByZXN1bHRzIGluIGFuIGVycm9yLlxuI1xuIyBAZXhhbXBsZVxuI1xuIyAgIHNlbWFwaG9yZSA9IG5ldyBTZW1hcGhvcmUoKVxuI1xuIyAgIHNlbWFwaG9yZS5pbmNyZW1lbnQoKVxuIyAgIGRvU29tZXRoaW5nKCkudGhlbihzZW1hcGhvcmUuZGVjcmVtZW50KCkpXG4jXG4jICAgZG9Bbm90aGVyVGhpbmdUaGF0VGFrZXNBQ2FsbGJhY2soc2VtYXBob3JlLndhaXQoKSlcbiNcbiMgICBzZW1hcGhvcmUuc3RhcnQoKVxuI1xuIyAgIHNlbWFwaG9yZS5hZGRDYWxsYmFjaygtPiBwcmludCgnaGVsbG8nKSlcbiNcbiMgICAjIE9uY2UgY291bnQgcmVhY2hlcyAwIGNhbGxiYWNrIGlzIGV4ZWN1dGVkOlxuIyAgICMgPT4gJ2hlbGxvJ1xuI1xuIyAgICMgQXNzdW1pbmcgdGhhdCBzZW1hcGhvcmUgd2FzIGFscmVhZHkgZmlyZWQ6XG4jICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKC0+IHByaW50KCd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknKSlcbiMgICAjID0+ICd0aGlzIHdpbGwgcHJpbnQgaW1tZWRpYXRlbHknXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNlbWFwaG9yZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb3VudCA9IDBcbiAgICBAc3RhcnRlZCA9IGZhbHNlXG4gICAgQHdhc0ZpcmVkID0gZmFsc2VcbiAgICBAY2FsbGJhY2tzID0gW11cblxuXG4gIGFkZENhbGxiYWNrOiAoY2FsbGJhY2spIC0+XG4gICAgaWYgQHdhc0ZpcmVkXG4gICAgICBjYWxsYmFjaygpXG4gICAgZWxzZVxuICAgICAgQGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuXG5cbiAgaXNSZWFkeTogLT5cbiAgICBAd2FzRmlyZWRcblxuXG4gIHN0YXJ0OiAtPlxuICAgIGFzc2VydCBub3QgQHN0YXJ0ZWQsXG4gICAgICBcIlVuYWJsZSB0byBzdGFydCBTZW1hcGhvcmUgb25jZSBzdGFydGVkLlwiXG4gICAgQHN0YXJ0ZWQgPSB0cnVlXG4gICAgQGZpcmVJZlJlYWR5KClcblxuXG4gIGluY3JlbWVudDogLT5cbiAgICBhc3NlcnQgbm90IEB3YXNGaXJlZCxcbiAgICAgIFwiVW5hYmxlIHRvIGluY3JlbWVudCBjb3VudCBvbmNlIFNlbWFwaG9yZSBpcyBmaXJlZC5cIlxuICAgIEBjb3VudCArPSAxXG5cblxuICBkZWNyZW1lbnQ6IC0+XG4gICAgYXNzZXJ0IEBjb3VudCA+IDAsXG4gICAgICBcIlVuYWJsZSB0byBkZWNyZW1lbnQgY291bnQgcmVzdWx0aW5nIGluIG5lZ2F0aXZlIGNvdW50LlwiXG4gICAgQGNvdW50IC09IDFcbiAgICBAZmlyZUlmUmVhZHkoKVxuXG5cbiAgd2FpdDogLT5cbiAgICBAaW5jcmVtZW50KClcbiAgICA9PiBAZGVjcmVtZW50KClcblxuXG4gICMgQHByaXZhdGVcbiAgZmlyZUlmUmVhZHk6IC0+XG4gICAgaWYgQGNvdW50ID09IDAgJiYgQHN0YXJ0ZWQgPT0gdHJ1ZVxuICAgICAgQHdhc0ZpcmVkID0gdHJ1ZVxuICAgICAgY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gQGNhbGxiYWNrc1xuIiwibW9kdWxlLmV4cG9ydHMgPSBkbyAtPlxuXG4gIGlzRW1wdHk6IChvYmopIC0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIG9iaj9cbiAgICBmb3IgbmFtZSBvZiBvYmpcbiAgICAgIHJldHVybiBmYWxzZSBpZiBvYmouaGFzT3duUHJvcGVydHkobmFtZSlcblxuICAgIHRydWVcblxuXG4gIGZsYXRDb3B5OiAob2JqKSAtPlxuICAgIGNvcHkgPSB1bmRlZmluZWRcblxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBvYmpcbiAgICAgIGNvcHkgfHw9IHt9XG4gICAgICBjb3B5W25hbWVdID0gdmFsdWVcblxuICAgIGNvcHlcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuXG4jIFN0cmluZyBIZWxwZXJzXG4jIC0tLS0tLS0tLS0tLS0tXG4jIGluc3BpcmVkIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vZXBlbGkvdW5kZXJzY29yZS5zdHJpbmddKClcbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnQ2FtZWwgQ2FzZSdcbiAgaHVtYW5pemU6IChzdHIpIC0+XG4gICAgdW5jYW1lbGl6ZWQgPSAkLnRyaW0oc3RyKS5yZXBsYWNlKC8oW2EtelxcZF0pKFtBLVpdKykvZywgJyQxICQyJykudG9Mb3dlckNhc2UoKVxuICAgIEB0aXRsZWl6ZSggdW5jYW1lbGl6ZWQgKVxuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgdG8gdXBwZXJjYXNlXG4gIGNhcGl0YWxpemUgOiAoc3RyKSAtPlxuICAgICAgc3RyID0gaWYgIXN0cj8gdGhlbiAnJyBlbHNlIFN0cmluZyhzdHIpXG4gICAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuXG5cbiAgIyBjb252ZXJ0IHRoZSBmaXJzdCBsZXR0ZXIgb2YgZXZlcnkgd29yZCB0byB1cHBlcmNhc2VcbiAgdGl0bGVpemU6IChzdHIpIC0+XG4gICAgaWYgIXN0cj9cbiAgICAgICcnXG4gICAgZWxzZVxuICAgICAgU3RyaW5nKHN0cikucmVwbGFjZSAvKD86XnxcXHMpXFxTL2csIChjKSAtPlxuICAgICAgICBjLnRvVXBwZXJDYXNlKClcblxuXG4gICMgY29udmVydCAnY2FtZWxDYXNlJyB0byAnY2FtZWwtY2FzZSdcbiAgc25ha2VDYXNlOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpLnJlcGxhY2UoL1stX1xcc10rL2csICctJykudG9Mb3dlckNhc2UoKVxuXG5cbiAgIyBwcmVwZW5kIGEgcHJlZml4IHRvIGEgc3RyaW5nIGlmIGl0IGlzIG5vdCBhbHJlYWR5IHByZXNlbnRcbiAgcHJlZml4OiAocHJlZml4LCBzdHJpbmcpIC0+XG4gICAgaWYgc3RyaW5nLmluZGV4T2YocHJlZml4KSA9PSAwXG4gICAgICBzdHJpbmdcbiAgICBlbHNlXG4gICAgICBcIlwiICsgcHJlZml4ICsgc3RyaW5nXG5cblxuICAjIEpTT04uc3RyaW5naWZ5IHdpdGggcmVhZGFiaWxpdHkgaW4gbWluZFxuICAjIEBwYXJhbSBvYmplY3Q6IGphdmFzY3JpcHQgb2JqZWN0XG4gIHJlYWRhYmxlSnNvbjogKG9iaikgLT5cbiAgICBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIDIpICMgXCJcXHRcIlxuXG4gIGNhbWVsaXplOiAoc3RyKSAtPlxuICAgICQudHJpbShzdHIpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpIC0+XG4gICAgICBjLnRvVXBwZXJDYXNlKClcbiAgICApXG5cbiAgdHJpbTogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG5cblxuICAjIGNhbWVsaXplOiAoc3RyKSAtPlxuICAjICAgJC50cmltKHN0cikucmVwbGFjZSgvWy1fXFxzXSsoLik/L2csIChtYXRjaCwgYykgLT5cbiAgIyAgICAgYy50b1VwcGVyQ2FzZSgpXG5cbiAgIyBjbGFzc2lmeTogKHN0cikgLT5cbiAgIyAgICQudGl0bGVpemUoU3RyaW5nKHN0cikucmVwbGFjZSgvW1xcV19dL2csICcgJykpLnJlcGxhY2UoL1xccy9nLCAnJylcblxuXG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuY3NzID0gY29uZmlnLmNzc1xuYXR0ciA9IGNvbmZpZy5hdHRyXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlL2RpcmVjdGl2ZV9pdGVyYXRvcicpXG5ldmVudGluZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvZXZlbnRpbmcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDb21wb25lbnRWaWV3XG5cbiAgY29uc3RydWN0b3I6ICh7IEBtb2RlbCwgQCRodG1sLCBAZGlyZWN0aXZlcywgQGlzUmVhZE9ubHkgfSkgLT5cbiAgICBAJGVsZW0gPSBAJGh0bWxcbiAgICBAdGVtcGxhdGUgPSBAbW9kZWwudGVtcGxhdGVcbiAgICBAaXNBdHRhY2hlZFRvRG9tID0gZmFsc2VcbiAgICBAd2FzQXR0YWNoZWRUb0RvbSA9ICQuQ2FsbGJhY2tzKCk7XG5cbiAgICB1bmxlc3MgQGlzUmVhZE9ubHlcbiAgICAgICMgYWRkIGF0dHJpYnV0ZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIGh0bWxcbiAgICAgIEAkaHRtbFxuICAgICAgICAuZGF0YSgnY29tcG9uZW50VmlldycsIHRoaXMpXG4gICAgICAgIC5hZGRDbGFzcyhjc3MuY29tcG9uZW50KVxuICAgICAgICAuYXR0cihhdHRyLnRlbXBsYXRlLCBAdGVtcGxhdGUuaWRlbnRpZmllcilcblxuICAgIEByZW5kZXIoKVxuXG5cbiAgcmVuZGVyOiAobW9kZSkgLT5cbiAgICBAdXBkYXRlQ29udGVudCgpXG4gICAgQHVwZGF0ZUh0bWwoKVxuXG5cbiAgdXBkYXRlQ29udGVudDogLT5cbiAgICBAY29udGVudChAbW9kZWwuY29udGVudClcblxuICAgIGlmIG5vdCBAaGFzRm9jdXMoKVxuICAgICAgQGRpc3BsYXlPcHRpb25hbHMoKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgdXBkYXRlSHRtbDogLT5cbiAgICBmb3IgbmFtZSwgdmFsdWUgb2YgQG1vZGVsLnN0eWxlc1xuICAgICAgQHNldFN0eWxlKG5hbWUsIHZhbHVlKVxuXG4gICAgQHN0cmlwSHRtbElmUmVhZE9ubHkoKVxuXG5cbiAgZGlzcGxheU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWxcbiAgICAgICAgJGVsZW0gPSAkKGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICBpZiBAbW9kZWwuaXNFbXB0eShkaXJlY3RpdmUubmFtZSlcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAkZWxlbS5jc3MoJ2Rpc3BsYXknLCAnJylcblxuXG4gICMgU2hvdyBhbGwgZG9jLW9wdGlvbmFscyB3aGV0aGVyIHRoZXkgYXJlIGVtcHR5IG9yIG5vdC5cbiAgIyBVc2Ugb24gZm9jdXMuXG4gIHNob3dPcHRpb25hbHM6IC0+XG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgaWYgZGlyZWN0aXZlLm9wdGlvbmFsXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5zaG93KCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgIyBIaWRlIGFsbCBlbXB0eSBkb2Mtb3B0aW9uYWxzXG4gICMgVXNlIG9uIGJsdXIuXG4gIGhpZGVFbXB0eU9wdGlvbmFsczogLT5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBpZiBkaXJlY3RpdmUub3B0aW9uYWwgJiYgQG1vZGVsLmlzRW1wdHkoZGlyZWN0aXZlLm5hbWUpXG4gICAgICAgIGNvbmZpZy5hbmltYXRpb25zLm9wdGlvbmFscy5oaWRlKCQoZGlyZWN0aXZlLmVsZW0pKVxuXG5cbiAgbmV4dDogLT5cbiAgICBAJGh0bWwubmV4dCgpLmRhdGEoJ2NvbXBvbmVudFZpZXcnKVxuXG5cbiAgcHJldjogLT5cbiAgICBAJGh0bWwucHJldigpLmRhdGEoJ2NvbXBvbmVudFZpZXcnKVxuXG5cbiAgYWZ0ZXJGb2N1c2VkOiAoKSAtPlxuICAgIEAkaHRtbC5hZGRDbGFzcyhjc3MuY29tcG9uZW50SGlnaGxpZ2h0KVxuICAgIEBzaG93T3B0aW9uYWxzKClcblxuXG4gIGFmdGVyQmx1cnJlZDogKCkgLT5cbiAgICBAJGh0bWwucmVtb3ZlQ2xhc3MoY3NzLmNvbXBvbmVudEhpZ2hsaWdodClcbiAgICBAaGlkZUVtcHR5T3B0aW9uYWxzKClcblxuXG4gICMgQHBhcmFtIGN1cnNvcjogdW5kZWZpbmVkLCAnc3RhcnQnLCAnZW5kJ1xuICBmb2N1czogKGN1cnNvcikgLT5cbiAgICBmaXJzdCA9IEBkaXJlY3RpdmVzLmVkaXRhYmxlP1swXS5lbGVtXG4gICAgJChmaXJzdCkuZm9jdXMoKVxuXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgQCRodG1sLmhhc0NsYXNzKGNzcy5jb21wb25lbnRIaWdobGlnaHQpXG5cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgQCRodG1sWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblxuICBnZXRBYnNvbHV0ZUJvdW5kaW5nQ2xpZW50UmVjdDogLT5cbiAgICBkb20uZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3QoQCRodG1sWzBdKVxuXG5cbiAgY29udGVudDogKGNvbnRlbnQpIC0+XG4gICAgZm9yIG5hbWUsIHZhbHVlIG9mIGNvbnRlbnRcbiAgICAgIGRpcmVjdGl2ZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKVxuICAgICAgaWYgZGlyZWN0aXZlLmlzSW1hZ2VcbiAgICAgICAgaWYgZGlyZWN0aXZlLmJhc2U2NEltYWdlP1xuICAgICAgICAgIEBzZXQobmFtZSwgZGlyZWN0aXZlLmJhc2U2NEltYWdlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHNldChuYW1lLCBkaXJlY3RpdmUuZ2V0SW1hZ2VVcmwoKSApXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXQobmFtZSwgdmFsdWUpXG5cblxuICBzZXQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICBkaXJlY3RpdmUgPSBAZGlyZWN0aXZlcy5nZXQobmFtZSlcbiAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgIHdoZW4gJ2VkaXRhYmxlJyB0aGVuIEBzZXRFZGl0YWJsZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2ltYWdlJyB0aGVuIEBzZXRJbWFnZShuYW1lLCB2YWx1ZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQHNldEh0bWwobmFtZSwgdmFsdWUpXG5cblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIGRpcmVjdGl2ZSA9IEBkaXJlY3RpdmVzLmdldChuYW1lKVxuICAgIHN3aXRjaCBkaXJlY3RpdmUudHlwZVxuICAgICAgd2hlbiAnZWRpdGFibGUnIHRoZW4gQGdldEVkaXRhYmxlKG5hbWUpXG4gICAgICB3aGVuICdpbWFnZScgdGhlbiBAZ2V0SW1hZ2UobmFtZSlcbiAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGdldEh0bWwobmFtZSlcblxuXG4gIGdldEVkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRFZGl0YWJsZTogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJldHVybiBpZiBAaGFzRm9jdXMoKVxuXG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLnRvZ2dsZUNsYXNzKGNzcy5ub1BsYWNlaG9sZGVyLCBCb29sZWFuKHZhbHVlKSlcbiAgICAkZWxlbS5hdHRyKGF0dHIucGxhY2Vob2xkZXIsIEB0ZW1wbGF0ZS5kZWZhdWx0c1tuYW1lXSlcblxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cblxuICBmb2N1c0VkaXRhYmxlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYWRkQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBibHVyRWRpdGFibGU6IChuYW1lKSAtPlxuICAgICRlbGVtID0gQGRpcmVjdGl2ZXMuJGdldEVsZW0obmFtZSlcbiAgICBpZiBAbW9kZWwuaXNFbXB0eShuYW1lKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoY3NzLm5vUGxhY2Vob2xkZXIpXG5cblxuICBnZXRIdG1sOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uaHRtbCgpXG5cblxuICBzZXRIdG1sOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuICAgICRlbGVtLmh0bWwodmFsdWUgfHwgJycpXG5cbiAgICBpZiBub3QgdmFsdWVcbiAgICAgICRlbGVtLmh0bWwoQHRlbXBsYXRlLmRlZmF1bHRzW25hbWVdKVxuICAgIGVsc2UgaWYgdmFsdWUgYW5kIG5vdCBAaXNSZWFkT25seVxuICAgICAgQGJsb2NrSW50ZXJhY3Rpb24oJGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlc1RvUmVzZXQgfHw9IHt9XG4gICAgQGRpcmVjdGl2ZXNUb1Jlc2V0W25hbWVdID0gbmFtZVxuXG5cbiAgZ2V0RGlyZWN0aXZlRWxlbWVudDogKGRpcmVjdGl2ZU5hbWUpIC0+XG4gICAgQGRpcmVjdGl2ZXMuZ2V0KGRpcmVjdGl2ZU5hbWUpPy5lbGVtXG5cblxuICAjIFJlc2V0IGRpcmVjdGl2ZXMgdGhhdCBjb250YWluIGFyYml0cmFyeSBodG1sIGFmdGVyIHRoZSB2aWV3IGlzIG1vdmVkIGluXG4gICMgdGhlIERPTSB0byByZWNyZWF0ZSBpZnJhbWVzLiBJbiB0aGUgY2FzZSBvZiB0d2l0dGVyIHdoZXJlIHRoZSBpZnJhbWVzXG4gICMgZG9uJ3QgaGF2ZSBhIHNyYyB0aGUgcmVsb2FkaW5nIHRoYXQgaGFwcGVucyB3aGVuIG9uZSBtb3ZlcyBhbiBpZnJhbWUgY2xlYXJzXG4gICMgYWxsIGNvbnRlbnQgKE1heWJlIHdlIGNvdWxkIGxpbWl0IHJlc2V0dGluZyB0byBpZnJhbWVzIHdpdGhvdXQgYSBzcmMpLlxuICAjXG4gICMgU29tZSBtb3JlIGluZm8gYWJvdXQgdGhlIGlzc3VlIG9uIHN0YWNrb3ZlcmZsb3c6XG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MzE4MjY0L2hvdy10by1tb3ZlLWFuLWlmcmFtZS1pbi10aGUtZG9tLXdpdGhvdXQtbG9zaW5nLWl0cy1zdGF0ZVxuICByZXNldERpcmVjdGl2ZXM6IC0+XG4gICAgZm9yIG5hbWUgb2YgQGRpcmVjdGl2ZXNUb1Jlc2V0XG4gICAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgICBpZiAkZWxlbS5maW5kKCdpZnJhbWUnKS5sZW5ndGhcbiAgICAgICAgQHNldChuYW1lLCBAbW9kZWwuY29udGVudFtuYW1lXSlcblxuXG4gIGdldEltYWdlOiAobmFtZSkgLT5cbiAgICAkZWxlbSA9IEBkaXJlY3RpdmVzLiRnZXRFbGVtKG5hbWUpXG4gICAgJGVsZW0uYXR0cignc3JjJylcblxuXG4gIHNldEltYWdlOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgJGVsZW0gPSBAZGlyZWN0aXZlcy4kZ2V0RWxlbShuYW1lKVxuXG4gICAgaWYgdmFsdWVcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG5cbiAgICAgIGltYWdlU2VydmljZSA9IEBtb2RlbC5kaXJlY3RpdmVzLmdldChuYW1lKS5nZXRJbWFnZVNlcnZpY2UoKVxuICAgICAgaW1hZ2VTZXJ2aWNlLnNldCgkZWxlbSwgdmFsdWUpXG5cbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBlbHNlXG4gICAgICBzZXRQbGFjZWhvbGRlciA9ICQucHJveHkoQHNldFBsYWNlaG9sZGVySW1hZ2UsIHRoaXMsICRlbGVtLCBuYW1lKVxuICAgICAgQGRlbGF5VW50aWxBdHRhY2hlZChuYW1lLCBzZXRQbGFjZWhvbGRlcikgIyB0b2RvOiByZXBsYWNlIHdpdGggQGFmdGVySW5zZXJ0ZWQgLT4gLi4uIChzb21ldGhpbmcgbGlrZSAkLkNhbGxiYWNrcygnb25jZSByZW1lbWJlcicpKVxuXG5cbiAgc2V0UGxhY2Vob2xkZXJJbWFnZTogKCRlbGVtLCBuYW1lKSAtPlxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZW1wdHlJbWFnZSlcbiAgICBpZiAkZWxlbVswXS5ub2RlTmFtZSA9PSAnSU1HJ1xuICAgICAgd2lkdGggPSAkZWxlbS53aWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5oZWlnaHQoKVxuICAgIGVsc2VcbiAgICAgIHdpZHRoID0gJGVsZW0ub3V0ZXJXaWR0aCgpXG4gICAgICBoZWlnaHQgPSAkZWxlbS5vdXRlckhlaWdodCgpXG4gICAgdmFsdWUgPSBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvI3t3aWR0aH14I3toZWlnaHR9L0JFRjU2Ri9CMkU2NjhcIlxuXG4gICAgaW1hZ2VTZXJ2aWNlID0gQG1vZGVsLmRpcmVjdGl2ZXMuZ2V0KG5hbWUpLmdldEltYWdlU2VydmljZSgpXG4gICAgaW1hZ2VTZXJ2aWNlLnNldCgkZWxlbSwgdmFsdWUpXG5cblxuICBzZXRTdHlsZTogKG5hbWUsIGNsYXNzTmFtZSkgLT5cbiAgICBjaGFuZ2VzID0gQHRlbXBsYXRlLnN0eWxlc1tuYW1lXS5jc3NDbGFzc0NoYW5nZXMoY2xhc3NOYW1lKVxuICAgIGlmIGNoYW5nZXMucmVtb3ZlXG4gICAgICBmb3IgcmVtb3ZlQ2xhc3MgaW4gY2hhbmdlcy5yZW1vdmVcbiAgICAgICAgQCRodG1sLnJlbW92ZUNsYXNzKHJlbW92ZUNsYXNzKVxuXG4gICAgQCRodG1sLmFkZENsYXNzKGNoYW5nZXMuYWRkKVxuXG5cbiAgIyBEaXNhYmxlIHRhYmJpbmcgZm9yIHRoZSBjaGlsZHJlbiBvZiBhbiBlbGVtZW50LlxuICAjIFRoaXMgaXMgdXNlZCBmb3IgaHRtbCBjb250ZW50IHNvIGl0IGRvZXMgbm90IGRpc3J1cHQgdGhlIHVzZXJcbiAgIyBleHBlcmllbmNlLiBUaGUgdGltZW91dCBpcyB1c2VkIGZvciBjYXNlcyBsaWtlIHR3ZWV0cyB3aGVyZSB0aGVcbiAgIyBpZnJhbWUgaXMgZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IHdpdGggYSBkZWxheS5cbiAgZGlzYWJsZVRhYmJpbmc6ICgkZWxlbSkgLT5cbiAgICBzZXRUaW1lb3V0KCA9PlxuICAgICAgJGVsZW0uZmluZCgnaWZyYW1lJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICwgNDAwKVxuXG5cbiAgIyBBcHBlbmQgYSBjaGlsZCB0byB0aGUgZWxlbWVudCB3aGljaCB3aWxsIGJsb2NrIHVzZXIgaW50ZXJhY3Rpb25cbiAgIyBsaWtlIGNsaWNrIG9yIHRvdWNoIGV2ZW50cy4gQWxzbyB0cnkgdG8gcHJldmVudCB0aGUgdXNlciBmcm9tIGdldHRpbmdcbiAgIyBmb2N1cyBvbiBhIGNoaWxkIGVsZW1udCB0aHJvdWdoIHRhYmJpbmcuXG4gIGJsb2NrSW50ZXJhY3Rpb246ICgkZWxlbSkgLT5cbiAgICBAZW5zdXJlUmVsYXRpdmVQb3NpdGlvbigkZWxlbSlcbiAgICAkYmxvY2tlciA9ICQoXCI8ZGl2IGNsYXNzPScjeyBjc3MuaW50ZXJhY3Rpb25CbG9ja2VyIH0nPlwiKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOycpXG4gICAgJGVsZW0uYXBwZW5kKCRibG9ja2VyKVxuXG4gICAgQGRpc2FibGVUYWJiaW5nKCRlbGVtKVxuXG5cbiAgIyBNYWtlIHN1cmUgdGhhdCBhbGwgYWJzb2x1dGUgcG9zaXRpb25lZCBjaGlsZHJlbiBhcmUgcG9zaXRpb25lZFxuICAjIHJlbGF0aXZlIHRvICRlbGVtLlxuICBlbnN1cmVSZWxhdGl2ZVBvc2l0aW9uOiAoJGVsZW0pIC0+XG4gICAgcG9zaXRpb24gPSAkZWxlbS5jc3MoJ3Bvc2l0aW9uJylcbiAgICBpZiBwb3NpdGlvbiAhPSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9ICdmaXhlZCcgJiYgcG9zaXRpb24gIT0gJ3JlbGF0aXZlJ1xuICAgICAgJGVsZW0uY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpXG5cblxuICBnZXQkY29udGFpbmVyOiAtPlxuICAgICQoZG9tLmZpbmRDb250YWluZXIoQCRodG1sWzBdKS5ub2RlKVxuXG5cbiAgIyBXYWl0IHRvIGV4ZWN1dGUgYSBtZXRob2QgdW50aWwgdGhlIHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIERPTVxuICBkZWxheVVudGlsQXR0YWNoZWQ6IChuYW1lLCBmdW5jKSAtPlxuICAgIGlmIEBpc0F0dGFjaGVkVG9Eb21cbiAgICAgIGZ1bmMoKVxuICAgIGVsc2VcbiAgICAgIEBjYW5jZWxEZWxheWVkKG5hbWUpXG4gICAgICBAZGVsYXllZCB8fD0ge31cbiAgICAgIEBkZWxheWVkW25hbWVdID0gZXZlbnRpbmcuY2FsbE9uY2UgQHdhc0F0dGFjaGVkVG9Eb20sID0+XG4gICAgICAgIEBkZWxheWVkW25hbWVdID0gdW5kZWZpbmVkXG4gICAgICAgIGZ1bmMoKVxuXG5cbiAgY2FuY2VsRGVsYXllZDogKG5hbWUpIC0+XG4gICAgaWYgQGRlbGF5ZWQ/W25hbWVdXG4gICAgICBAd2FzQXR0YWNoZWRUb0RvbS5yZW1vdmUoQGRlbGF5ZWRbbmFtZV0pXG4gICAgICBAZGVsYXllZFtuYW1lXSA9IHVuZGVmaW5lZFxuXG5cbiAgc3RyaXBIdG1sSWZSZWFkT25seTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc1JlYWRPbmx5XG5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihAJGh0bWxbMF0pXG4gICAgd2hpbGUgZWxlbSA9IGl0ZXJhdG9yLm5leHRFbGVtZW50KClcbiAgICAgIEBzdHJpcERvY0NsYXNzZXMoZWxlbSlcbiAgICAgIEBzdHJpcERvY0F0dHJpYnV0ZXMoZWxlbSlcbiAgICAgIEBzdHJpcEVtcHR5QXR0cmlidXRlcyhlbGVtKVxuXG5cbiAgc3RyaXBEb2NDbGFzc2VzOiAoZWxlbSkgLT5cbiAgICAkZWxlbSA9ICQoZWxlbSlcbiAgICBmb3Iga2xhc3MgaW4gZWxlbS5jbGFzc05hbWUuc3BsaXQoL1xccysvKVxuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3Moa2xhc3MpIGlmIC9kb2NcXC0uKi9pLnRlc3Qoa2xhc3MpXG5cblxuICBzdHJpcERvY0F0dHJpYnV0ZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIGZvciBhdHRyaWJ1dGUgaW4gQXJyYXk6OnNsaWNlLmFwcGx5KGVsZW0uYXR0cmlidXRlcylcbiAgICAgIG5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgICAgJGVsZW0ucmVtb3ZlQXR0cihuYW1lKSBpZiAvZGF0YVxcLWRvY1xcLS4qL2kudGVzdChuYW1lKVxuXG5cbiAgc3RyaXBFbXB0eUF0dHJpYnV0ZXM6IChlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgIHN0cmlwcGFibGVBdHRyaWJ1dGVzID0gWydzdHlsZScsICdjbGFzcyddXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiBBcnJheTo6c2xpY2UuYXBwbHkoZWxlbS5hdHRyaWJ1dGVzKVxuICAgICAgaXNTdHJpcHBhYmxlQXR0cmlidXRlID0gc3RyaXBwYWJsZUF0dHJpYnV0ZXMuaW5kZXhPZihhdHRyaWJ1dGUubmFtZSkgPj0gMFxuICAgICAgaXNFbXB0eUF0dHJpYnV0ZSA9IGF0dHJpYnV0ZS52YWx1ZS50cmltKCkgPT0gJydcbiAgICAgIGlmIGlzU3RyaXBwYWJsZUF0dHJpYnV0ZSBhbmQgaXNFbXB0eUF0dHJpYnV0ZVxuICAgICAgICAkZWxlbS5yZW1vdmVBdHRyKGF0dHJpYnV0ZS5uYW1lKVxuXG5cbiAgc2V0QXR0YWNoZWRUb0RvbTogKG5ld1ZhbCkgLT5cbiAgICByZXR1cm4gaWYgbmV3VmFsID09IEBpc0F0dGFjaGVkVG9Eb21cblxuICAgIEBpc0F0dGFjaGVkVG9Eb20gPSBuZXdWYWxcblxuICAgIGlmIG5ld1ZhbFxuICAgICAgQHJlc2V0RGlyZWN0aXZlcygpXG4gICAgICBAd2FzQXR0YWNoZWRUb0RvbS5maXJlKClcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG5sb2cgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2xvZ2dpbmcvbG9nJylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW5kZXJlclxuXG4gICMgQHBhcmFtIHsgT2JqZWN0IH1cbiAgIyAtIGNvbXBvbmVudFRyZWUgeyBDb21wb25lbnRUcmVlIH1cbiAgIyAtIHJlbmRlcmluZ0NvbnRhaW5lciB7IFJlbmRlcmluZ0NvbnRhaW5lciB9XG4gICMgLSAkd3JhcHBlciB7IGpRdWVyeSBvYmplY3QgfSBBIHdyYXBwZXIgd2l0aCBhIG5vZGUgd2l0aCBhICdkb2Mtc2VjdGlvbicgY3NzIGNsYXNzIHdoZXJlIHRvIGluc2VydCB0aGUgY29udGVudC5cbiAgIyAtIGV4Y2x1ZGVDb21wb25lbnRzIHsgU3RyaW5nIG9yIEFycmF5IH0gY29tcG9uZW50TW9kZWwuaWQgb3IgYW4gYXJyYXkgb2Ygc3VjaC5cbiAgY29uc3RydWN0b3I6ICh7IEBjb21wb25lbnRUcmVlLCBAcmVuZGVyaW5nQ29udGFpbmVyLCAkd3JhcHBlciwgZXhjbHVkZUNvbXBvbmVudHMgfSkgLT5cbiAgICBhc3NlcnQgQGNvbXBvbmVudFRyZWUsICdubyBjb21wb25lbnRUcmVlIHNwZWNpZmllZCdcbiAgICBhc3NlcnQgQHJlbmRlcmluZ0NvbnRhaW5lciwgJ25vIHJlbmRlcmluZyBjb250YWluZXIgc3BlY2lmaWVkJ1xuXG4gICAgQCRyb290ID0gJChAcmVuZGVyaW5nQ29udGFpbmVyLnJlbmRlck5vZGUpXG4gICAgQCR3cmFwcGVySHRtbCA9ICR3cmFwcGVyXG4gICAgQGNvbXBvbmVudFZpZXdzID0ge31cblxuICAgIEBleGNsdWRlZENvbXBvbmVudElkcyA9IHt9XG4gICAgQGV4Y2x1ZGVDb21wb25lbnQoZXhjbHVkZUNvbXBvbmVudHMpXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQHJlbmRlck9uY2VQYWdlUmVhZHkoKVxuICAgIEByZWFkeVNlbWFwaG9yZS5zdGFydCgpXG5cblxuICAjIEBwYXJhbSB7IFN0cmluZyBvciBBcnJheSB9IGNvbXBvbmVudE1vZGVsLmlkIG9yIGFuIGFycmF5IG9mIHN1Y2guXG4gIGV4Y2x1ZGVDb21wb25lbnQ6IChjb21wb25lbnRJZCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudElkP1xuICAgIGlmICQuaXNBcnJheShjb21wb25lbnRJZClcbiAgICAgIGZvciBjb21wSWQgaW4gY29tcG9uZW50SWRcbiAgICAgICAgQGV4Y2x1ZGVDb21wb25lbnQoY29tcElkKVxuICAgIGVsc2VcbiAgICAgIEBleGNsdWRlZENvbXBvbmVudElkc1tjb21wb25lbnRJZF0gPSB0cnVlXG4gICAgICB2aWV3ID0gQGNvbXBvbmVudFZpZXdzW2NvbXBvbmVudElkXVxuICAgICAgaWYgdmlldz8gYW5kIHZpZXcuaXNBdHRhY2hlZFRvRG9tXG4gICAgICAgIEByZW1vdmVDb21wb25lbnQodmlldy5tb2RlbClcblxuXG4gIHNldFJvb3Q6ICgpIC0+XG4gICAgaWYgQCR3cmFwcGVySHRtbD8ubGVuZ3RoICYmIEAkd3JhcHBlckh0bWwuanF1ZXJ5XG4gICAgICBzZWxlY3RvciA9IFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCJcbiAgICAgICRpbnNlcnQgPSBAJHdyYXBwZXJIdG1sLmZpbmQoc2VsZWN0b3IpLmFkZCggQCR3cmFwcGVySHRtbC5maWx0ZXIoc2VsZWN0b3IpIClcbiAgICAgIGlmICRpbnNlcnQubGVuZ3RoXG4gICAgICAgIEAkd3JhcHBlciA9IEAkcm9vdFxuICAgICAgICBAJHdyYXBwZXIuYXBwZW5kKEAkd3JhcHBlckh0bWwpXG4gICAgICAgIEAkcm9vdCA9ICRpbnNlcnRcblxuICAgICMgU3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudFRyZWUgaW4gdGhlICRyb290IG5vZGUuXG4gICAgIyBTb21lIGRvbS5jb2ZmZWUgbWV0aG9kcyBuZWVkIGl0IHRvIGdldCBob2xkIG9mIHRoZSBjb21wb25lbnRUcmVlXG4gICAgQCRyb290LmRhdGEoJ2NvbXBvbmVudFRyZWUnLCBAY29tcG9uZW50VHJlZSlcblxuXG4gIHJlbmRlck9uY2VQYWdlUmVhZHk6IC0+XG4gICAgQHJlYWR5U2VtYXBob3JlLmluY3JlbWVudCgpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5yZWFkeSA9PlxuICAgICAgQHNldFJvb3QoKVxuICAgICAgQHJlbmRlcigpXG4gICAgICBAc2V0dXBDb21wb25lbnRUcmVlTGlzdGVuZXJzKClcbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuXG5cbiAgcmVhZHk6IChjYWxsYmFjaykgLT5cbiAgICBAcmVhZHlTZW1hcGhvcmUuYWRkQ2FsbGJhY2soY2FsbGJhY2spXG5cblxuICBpc1JlYWR5OiAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5pc1JlYWR5KClcblxuXG4gIGh0bWw6IC0+XG4gICAgYXNzZXJ0IEBpc1JlYWR5KCksICdDYW5ub3QgZ2VuZXJhdGUgaHRtbC4gUmVuZGVyZXIgaXMgbm90IHJlYWR5LidcbiAgICBAcmVuZGVyaW5nQ29udGFpbmVyLmh0bWwoKVxuXG5cbiAgIyBDb21wb25lbnRUcmVlIEV2ZW50IEhhbmRsaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldHVwQ29tcG9uZW50VHJlZUxpc3RlbmVyczogLT5cbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRBZGRlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudEFkZGVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50UmVtb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudFJlbW92ZWQsIHRoaXMpIClcbiAgICBAY29tcG9uZW50VHJlZS5jb21wb25lbnRNb3ZlZC5hZGQoICQucHJveHkoQGNvbXBvbmVudE1vdmVkLCB0aGlzKSApXG4gICAgQGNvbXBvbmVudFRyZWUuY29tcG9uZW50Q29udGVudENoYW5nZWQuYWRkKCAkLnByb3h5KEBjb21wb25lbnRDb250ZW50Q2hhbmdlZCwgdGhpcykgKVxuICAgIEBjb21wb25lbnRUcmVlLmNvbXBvbmVudEh0bWxDaGFuZ2VkLmFkZCggJC5wcm94eShAY29tcG9uZW50SHRtbENoYW5nZWQsIHRoaXMpIClcblxuXG4gIGNvbXBvbmVudEFkZGVkOiAobW9kZWwpIC0+XG4gICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNvbXBvbmVudFJlbW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBkZWxldGVDYWNoZWRDb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKVxuXG5cbiAgY29tcG9uZW50TW92ZWQ6IChtb2RlbCkgLT5cbiAgICBAcmVtb3ZlQ29tcG9uZW50KG1vZGVsKVxuICAgIEBpbnNlcnRDb21wb25lbnQobW9kZWwpXG5cblxuICBjb21wb25lbnRDb250ZW50Q2hhbmdlZDogKG1vZGVsKSAtPlxuICAgIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS51cGRhdGVDb250ZW50KClcblxuXG4gIGNvbXBvbmVudEh0bWxDaGFuZ2VkOiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnVwZGF0ZUh0bWwoKVxuXG5cbiAgIyBSZW5kZXJpbmdcbiAgIyAtLS0tLS0tLS1cblxuXG4gIGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld3NbbW9kZWwuaWRdIHx8PSBtb2RlbC5jcmVhdGVWaWV3KEByZW5kZXJpbmdDb250YWluZXIuaXNSZWFkT25seSlcblxuXG4gIGRlbGV0ZUNhY2hlZENvbXBvbmVudFZpZXdGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBkZWxldGUgQGNvbXBvbmVudFZpZXdzW21vZGVsLmlkXVxuXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGluc2VydENvbXBvbmVudChtb2RlbClcblxuXG4gIGNsZWFyOiAtPlxuICAgIEBjb21wb25lbnRUcmVlLmVhY2ggKG1vZGVsKSA9PlxuICAgICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG5cbiAgICBAJHJvb3QuZW1wdHkoKVxuXG5cbiAgcmVkcmF3OiAtPlxuICAgIEBjbGVhcigpXG4gICAgQHJlbmRlcigpXG5cblxuICBpbnNlcnRDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICByZXR1cm4gaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwpIHx8IEBleGNsdWRlZENvbXBvbmVudElkc1ttb2RlbC5pZF0gPT0gdHJ1ZVxuXG4gICAgaWYgQGlzQ29tcG9uZW50QXR0YWNoZWQobW9kZWwucHJldmlvdXMpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLnByZXZpb3VzLCBtb2RlbClcbiAgICBlbHNlIGlmIEBpc0NvbXBvbmVudEF0dGFjaGVkKG1vZGVsLm5leHQpXG4gICAgICBAaW5zZXJ0Q29tcG9uZW50QXNTaWJsaW5nKG1vZGVsLm5leHQsIG1vZGVsKVxuICAgIGVsc2UgaWYgbW9kZWwucGFyZW50Q29udGFpbmVyXG4gICAgICBAYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXIobW9kZWwpXG4gICAgZWxzZVxuICAgICAgbG9nLmVycm9yKCdDb21wb25lbnQgY291bGQgbm90IGJlIGluc2VydGVkIGJ5IHJlbmRlcmVyLicpXG5cbiAgICBjb21wb25lbnRWaWV3ID0gQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpXG4gICAgY29tcG9uZW50Vmlldy5zZXRBdHRhY2hlZFRvRG9tKHRydWUpXG4gICAgQHJlbmRlcmluZ0NvbnRhaW5lci5jb21wb25lbnRWaWV3V2FzSW5zZXJ0ZWQoY29tcG9uZW50VmlldylcbiAgICBAYXR0YWNoQ2hpbGRDb21wb25lbnRzKG1vZGVsKVxuXG5cbiAgaXNDb21wb25lbnRBdHRhY2hlZDogKG1vZGVsKSAtPlxuICAgIG1vZGVsICYmIEBjb21wb25lbnRWaWV3Rm9yQ29tcG9uZW50KG1vZGVsKS5pc0F0dGFjaGVkVG9Eb21cblxuXG4gIGF0dGFjaENoaWxkQ29tcG9uZW50czogKG1vZGVsKSAtPlxuICAgIG1vZGVsLmNoaWxkcmVuIChjaGlsZE1vZGVsKSA9PlxuICAgICAgaWYgbm90IEBpc0NvbXBvbmVudEF0dGFjaGVkKGNoaWxkTW9kZWwpXG4gICAgICAgIEBpbnNlcnRDb21wb25lbnQoY2hpbGRNb2RlbClcblxuXG4gIGluc2VydENvbXBvbmVudEFzU2libGluZzogKHNpYmxpbmcsIG1vZGVsKSAtPlxuICAgIG1ldGhvZCA9IGlmIHNpYmxpbmcgPT0gbW9kZWwucHJldmlvdXMgdGhlbiAnYWZ0ZXInIGVsc2UgJ2JlZm9yZSdcbiAgICBAJG5vZGVGb3JDb21wb25lbnQoc2libGluZylbbWV0aG9kXShAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpKVxuXG5cbiAgYXBwZW5kQ29tcG9uZW50VG9QYXJlbnRDb250YWluZXI6IChtb2RlbCkgLT5cbiAgICBAJG5vZGVGb3JDb21wb25lbnQobW9kZWwpLmFwcGVuZFRvKEAkbm9kZUZvckNvbnRhaW5lcihtb2RlbC5wYXJlbnRDb250YWluZXIpKVxuXG5cbiAgJG5vZGVGb3JDb21wb25lbnQ6IChtb2RlbCkgLT5cbiAgICBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChtb2RlbCkuJGh0bWxcblxuXG4gICRub2RlRm9yQ29udGFpbmVyOiAoY29udGFpbmVyKSAtPlxuICAgIGlmIGNvbnRhaW5lci5pc1Jvb3RcbiAgICAgIEAkcm9vdFxuICAgIGVsc2VcbiAgICAgIHBhcmVudFZpZXcgPSBAY29tcG9uZW50Vmlld0ZvckNvbXBvbmVudChjb250YWluZXIucGFyZW50Q29tcG9uZW50KVxuICAgICAgJChwYXJlbnRWaWV3LmdldERpcmVjdGl2ZUVsZW1lbnQoY29udGFpbmVyLm5hbWUpKVxuXG5cbiAgcmVtb3ZlQ29tcG9uZW50OiAobW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFZpZXdGb3JDb21wb25lbnQobW9kZWwpLnNldEF0dGFjaGVkVG9Eb20oZmFsc2UpXG4gICAgQCRub2RlRm9yQ29tcG9uZW50KG1vZGVsKS5kZXRhY2goKVxuXG4iLCJSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKVxuUGFnZSA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZ19jb250YWluZXIvcGFnZScpXG5JbnRlcmFjdGl2ZVBhZ2UgPSByZXF1aXJlKCcuLi9yZW5kZXJpbmdfY29udGFpbmVyL2ludGVyYWN0aXZlX3BhZ2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFZpZXdcblxuICBjb25zdHJ1Y3RvcjogKEBjb21wb25lbnRUcmVlLCBAcGFyZW50KSAtPlxuICAgIEBwYXJlbnQgPz0gd2luZG93LmRvY3VtZW50LmJvZHlcbiAgICBAaXNJbnRlcmFjdGl2ZSA9IGZhbHNlXG5cblxuICAjIEF2YWlsYWJsZSBPcHRpb25zOlxuICAjIFJlYWRPbmx5IHZpZXc6IChkZWZhdWx0IGlmIG5vdGhpbmcgaXMgc3BlY2lmaWVkKVxuICAjIGNyZWF0ZShyZWFkT25seTogdHJ1ZSlcbiAgI1xuICAjIEluZXJhY3RpdmUgdmlldzpcbiAgIyBjcmVhdGUoaW50ZXJhY3RpdmU6IHRydWUpXG4gICNcbiAgIyBXcmFwcGVyOiAoRE9NIG5vZGUgdGhhdCBoYXMgdG8gY29udGFpbiBhIG5vZGUgd2l0aCBjbGFzcyAnLmRvYy1zZWN0aW9uJylcbiAgIyBjcmVhdGUoICR3cmFwcGVyOiAkKCc8c2VjdGlvbiBjbGFzcz1cImNvbnRhaW5lciBkb2Mtc2VjdGlvblwiPicpIClcbiAgY3JlYXRlOiAob3B0aW9ucykgLT5cbiAgICBAY3JlYXRlSUZyYW1lKEBwYXJlbnQpLnRoZW4gKGlmcmFtZSwgcmVuZGVyTm9kZSkgPT5cbiAgICAgIEBpZnJhbWUgPSBpZnJhbWVcbiAgICAgIHJlbmRlcmVyID0gQGNyZWF0ZUlGcmFtZVJlbmRlcmVyKGlmcmFtZSwgb3B0aW9ucylcbiAgICAgIGlmcmFtZTogaWZyYW1lXG4gICAgICByZW5kZXJlcjogcmVuZGVyZXJcblxuXG4gIGNyZWF0ZUlGcmFtZTogKHBhcmVudCkgLT5cbiAgICBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKVxuXG4gICAgaWZyYW1lID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgICBpZnJhbWUuc3JjID0gJ2Fib3V0OmJsYW5rJ1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lQm9yZGVyJywgJzAnKVxuICAgIGlmcmFtZS5vbmxvYWQgPSAtPiBkZWZlcnJlZC5yZXNvbHZlKGlmcmFtZSlcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChpZnJhbWUpXG4gICAgZGVmZXJyZWQucHJvbWlzZSgpXG5cblxuICBjcmVhdGVJRnJhbWVSZW5kZXJlcjogKGlmcmFtZSwgb3B0aW9ucykgLT5cbiAgICBAY3JlYXRlUmVuZGVyZXJcbiAgICAgIHJlbmRlck5vZGU6IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuYm9keVxuICAgICAgb3B0aW9uczogb3B0aW9uc1xuXG5cbiAgY3JlYXRlUmVuZGVyZXI6ICh7IHJlbmRlck5vZGUsIG9wdGlvbnMgfT17fSkgLT5cbiAgICBwYXJhbXMgPVxuICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSB8fCBAcGFyZW50XG4gICAgICBkZXNpZ246IEBjb21wb25lbnRUcmVlLmRlc2lnblxuXG4gICAgQHBhZ2UgPSBAY3JlYXRlUGFnZShwYXJhbXMsIG9wdGlvbnMpXG5cbiAgICBuZXcgUmVuZGVyZXJcbiAgICAgIHJlbmRlcmluZ0NvbnRhaW5lcjogQHBhZ2VcbiAgICAgIGNvbXBvbmVudFRyZWU6IEBjb21wb25lbnRUcmVlXG4gICAgICAkd3JhcHBlcjogb3B0aW9ucy4kd3JhcHBlclxuXG5cbiAgY3JlYXRlUGFnZTogKHBhcmFtcywgeyBpbnRlcmFjdGl2ZSwgcmVhZE9ubHksIGxvYWRSZXNvdXJjZXMgfT17fSkgLT5cbiAgICBwYXJhbXMgPz0ge31cbiAgICBwYXJhbXMubG9hZFJlc291cmNlcyA9IGxvYWRSZXNvdXJjZXNcbiAgICBpZiBpbnRlcmFjdGl2ZT9cbiAgICAgIEBpc0ludGVyYWN0aXZlID0gdHJ1ZVxuICAgICAgbmV3IEludGVyYWN0aXZlUGFnZShwYXJhbXMpXG4gICAgZWxzZVxuICAgICAgbmV3IFBhZ2UocGFyYW1zKVxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcblNlbWFwaG9yZSA9IHJlcXVpcmUoJy4uL21vZHVsZXMvc2VtYXBob3JlJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDc3NMb2FkZXJcblxuICBjb25zdHJ1Y3RvcjogKEB3aW5kb3cpIC0+XG4gICAgQGxvYWRlZFVybHMgPSBbXVxuXG5cbiAgbG9hZDogKHVybHMsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soKSBpZiBAaXNEaXNhYmxlZFxuXG4gICAgdXJscyA9IFt1cmxzXSB1bmxlc3MgJC5pc0FycmF5KHVybHMpXG4gICAgc2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgc2VtYXBob3JlLmFkZENhbGxiYWNrKGNhbGxiYWNrKVxuICAgIEBsb2FkU2luZ2xlVXJsKHVybCwgc2VtYXBob3JlLndhaXQoKSkgZm9yIHVybCBpbiB1cmxzXG4gICAgc2VtYXBob3JlLnN0YXJ0KClcblxuXG4gIGRpc2FibGU6IC0+XG4gICAgQGlzRGlzYWJsZWQgPSB0cnVlXG5cblxuICAjIEBwcml2YXRlXG4gIGxvYWRTaW5nbGVVcmw6ICh1cmwsIGNhbGxiYWNrPSQubm9vcCkgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soKSBpZiBAaXNEaXNhYmxlZFxuXG4gICAgaWYgQGlzVXJsTG9hZGVkKHVybClcbiAgICAgIGNhbGxiYWNrKClcbiAgICBlbHNlXG4gICAgICBsaW5rID0gJCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIC8+JylbMF1cbiAgICAgIGxpbmsub25sb2FkID0gY2FsbGJhY2tcblxuICAgICAgIyBEbyBub3QgcHJldmVudCB0aGUgcGFnZSBmcm9tIGxvYWRpbmcgYmVjYXVzZSBvZiBjc3MgZXJyb3JzXG4gICAgICAjIG9uZXJyb3IgaXMgbm90IHN1cHBvcnRlZCBieSBldmVyeSBicm93c2VyLlxuICAgICAgIyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvbGlua1xuICAgICAgbGluay5vbmVycm9yID0gLT5cbiAgICAgICAgY29uc29sZS53YXJuIFwiU3R5bGVzaGVldCBjb3VsZCBub3QgYmUgbG9hZGVkOiAjeyB1cmwgfVwiXG4gICAgICAgIGNhbGxiYWNrKClcblxuICAgICAgbGluay5ocmVmID0gdXJsXG4gICAgICBAd2luZG93LmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluaylcbiAgICAgIEBtYXJrVXJsQXNMb2FkZWQodXJsKVxuXG5cbiAgIyBAcHJpdmF0ZVxuICBpc1VybExvYWRlZDogKHVybCkgLT5cbiAgICBAbG9hZGVkVXJscy5pbmRleE9mKHVybCkgPj0gMFxuXG5cbiAgIyBAcHJpdmF0ZVxuICBtYXJrVXJsQXNMb2FkZWQ6ICh1cmwpIC0+XG4gICAgQGxvYWRlZFVybHMucHVzaCh1cmwpXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5jc3MgPSBjb25maWcuY3NzXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5Db21wb25lbnREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vY29tcG9uZW50X2RyYWcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVkaXRvclBhZ2VcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAc2V0V2luZG93KClcbiAgICBAZHJhZ0Jhc2UgPSBuZXcgRHJhZ0Jhc2UodGhpcylcblxuICAgICMgU3R1YnNcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID1cbiAgICAgIGRpc2FibGVBbGw6IC0+XG4gICAgICByZWVuYWJsZUFsbDogLT5cbiAgICBAY29tcG9uZW50V2FzRHJvcHBlZCA9XG4gICAgICBmaXJlOiAtPlxuICAgIEBibHVyRm9jdXNlZEVsZW1lbnQgPSAtPlxuXG5cbiAgc3RhcnREcmFnOiAoeyBjb21wb25lbnRNb2RlbCwgY29tcG9uZW50VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29tcG9uZW50TW9kZWwgfHwgY29tcG9uZW50Vmlld1xuICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Vmlldy5tb2RlbCBpZiBjb21wb25lbnRWaWV3XG5cbiAgICBjb21wb25lbnREcmFnID0gbmV3IENvbXBvbmVudERyYWdcbiAgICAgIGNvbXBvbmVudE1vZGVsOiBjb21wb25lbnRNb2RlbFxuICAgICAgY29tcG9uZW50VmlldzogY29tcG9uZW50Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KGNvbXBvbmVudERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBzZXRXaW5kb3c6IC0+XG4gICAgQHdpbmRvdyA9IHdpbmRvd1xuICAgIEBkb2N1bWVudCA9IEB3aW5kb3cuZG9jdW1lbnRcbiAgICBAJGRvY3VtZW50ID0gJChAZG9jdW1lbnQpXG4gICAgQCRib2R5ID0gJChAZG9jdW1lbnQuYm9keSlcblxuXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcbkZvY3VzID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZm9jdXMnKVxuRWRpdGFibGVDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZWRpdGFibGVfY29udHJvbGxlcicpXG5EcmFnQmFzZSA9IHJlcXVpcmUoJy4uL2ludGVyYWN0aW9uL2RyYWdfYmFzZScpXG5Db21wb25lbnREcmFnID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vY29tcG9uZW50X2RyYWcnKVxuXG4jIEFuIEludGVyYWN0aXZlUGFnZSBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWxsb3dzIGZvciBtYW5pcHVsYXRpb24gb2YgdGhlXG4jIHJlbmRlcmVkIENvbXBvbmVudFRyZWUuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEludGVyYWN0aXZlUGFnZSBleHRlbmRzIFBhZ2VcblxuICBMRUZUX01PVVNFX0JVVFRPTiA9IDFcblxuICBpc1JlYWRPbmx5OiBmYWxzZVxuXG5cbiAgY29uc3RydWN0b3I6ICh7IHJlbmRlck5vZGUsIGhvc3RXaW5kb3cgfT17fSkgLT5cbiAgICBzdXBlclxuXG4gICAgQGZvY3VzID0gbmV3IEZvY3VzKClcbiAgICBAZWRpdGFibGVDb250cm9sbGVyID0gbmV3IEVkaXRhYmxlQ29udHJvbGxlcih0aGlzKVxuXG4gICAgIyBldmVudHNcbiAgICBAaW1hZ2VDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAaHRtbEVsZW1lbnRDbGljayA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50VmlldywgZmllbGROYW1lLCBldmVudCkgLT5cbiAgICBAY29tcG9uZW50V2lsbEJlRHJhZ2dlZCA9ICQuQ2FsbGJhY2tzKCkgIyAoY29tcG9uZW50TW9kZWwpIC0+XG4gICAgQGNvbXBvbmVudFdhc0Ryb3BwZWQgPSAkLkNhbGxiYWNrcygpICMgKGNvbXBvbmVudE1vZGVsKSAtPlxuICAgIEBkcmFnQmFzZSA9IG5ldyBEcmFnQmFzZSh0aGlzKVxuICAgIEBmb2N1cy5jb21wb25lbnRGb2N1cy5hZGQoICQucHJveHkoQGFmdGVyQ29tcG9uZW50Rm9jdXNlZCwgdGhpcykgKVxuICAgIEBmb2N1cy5jb21wb25lbnRCbHVyLmFkZCggJC5wcm94eShAYWZ0ZXJDb21wb25lbnRCbHVycmVkLCB0aGlzKSApXG4gICAgQGJlZm9yZUludGVyYWN0aXZlUGFnZVJlYWR5KClcbiAgICBAJGRvY3VtZW50XG4gICAgICAub24oJ21vdXNlZG93bi5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbigndG91Y2hzdGFydC5saXZpbmdkb2NzJywgJC5wcm94eShAbW91c2Vkb3duLCB0aGlzKSlcbiAgICAgIC5vbignZHJhZ3N0YXJ0JywgJC5wcm94eShAYnJvd3NlckRyYWdTdGFydCwgdGhpcykpXG5cblxuICBiZWZvcmVJbnRlcmFjdGl2ZVBhZ2VSZWFkeTogLT5cbiAgICBpZiBjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGVcbiAgICAgIEBjc3NMb2FkZXIubG9hZChjb25maWcubGl2aW5nZG9jc0Nzc0ZpbGUsIEByZWFkeVNlbWFwaG9yZS53YWl0KCkpXG5cblxuICAjIHByZXZlbnQgdGhlIGJyb3dzZXIgRHJhZyZEcm9wIGZyb20gaW50ZXJmZXJpbmdcbiAgYnJvd3NlckRyYWdTdGFydDogKGV2ZW50KSAtPlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG5cbiAgcmVtb3ZlTGlzdGVuZXJzOiAtPlxuICAgIEAkZG9jdW1lbnQub2ZmKCcubGl2aW5nZG9jcycpXG4gICAgQCRkb2N1bWVudC5vZmYoJy5saXZpbmdkb2NzLWRyYWcnKVxuXG5cbiAgbW91c2Vkb3duOiAoZXZlbnQpIC0+XG4gICAgcmV0dXJuIGlmIGV2ZW50LndoaWNoICE9IExFRlRfTU9VU0VfQlVUVE9OICYmIGV2ZW50LnR5cGUgPT0gJ21vdXNlZG93bicgIyBvbmx5IHJlc3BvbmQgdG8gbGVmdCBtb3VzZSBidXR0b25cblxuICAgICMgSWdub3JlIGludGVyYWN0aW9ucyBvbiBjZXJ0YWluIGVsZW1lbnRzXG4gICAgaXNDb250cm9sID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoY29uZmlnLmlnbm9yZUludGVyYWN0aW9uKS5sZW5ndGhcbiAgICByZXR1cm4gaWYgaXNDb250cm9sXG5cbiAgICAjIElkZW50aWZ5IHRoZSBjbGlja2VkIGNvbXBvbmVudFxuICAgIGNvbXBvbmVudFZpZXcgPSBkb20uZmluZENvbXBvbmVudFZpZXcoZXZlbnQudGFyZ2V0KVxuXG4gICAgIyBUaGlzIGlzIGNhbGxlZCBpbiBtb3VzZWRvd24gc2luY2UgZWRpdGFibGVzIGdldCBmb2N1cyBvbiBtb3VzZWRvd25cbiAgICAjIGFuZCBvbmx5IGJlZm9yZSB0aGUgZWRpdGFibGVzIGNsZWFyIHRoZWlyIHBsYWNlaG9sZGVyIGNhbiB3ZSBzYWZlbHlcbiAgICAjIGlkZW50aWZ5IHdoZXJlIHRoZSB1c2VyIGhhcyBjbGlja2VkLlxuICAgIEBoYW5kbGVDbGlja2VkQ29tcG9uZW50KGV2ZW50LCBjb21wb25lbnRWaWV3KVxuXG4gICAgaWYgY29tcG9uZW50Vmlld1xuICAgICAgQHN0YXJ0RHJhZ1xuICAgICAgICBjb21wb25lbnRWaWV3OiBjb21wb25lbnRWaWV3XG4gICAgICAgIGV2ZW50OiBldmVudFxuXG5cbiAgc3RhcnREcmFnOiAoeyBjb21wb25lbnRNb2RlbCwgY29tcG9uZW50VmlldywgZXZlbnQsIGNvbmZpZyB9KSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29tcG9uZW50TW9kZWwgfHwgY29tcG9uZW50Vmlld1xuICAgIGNvbXBvbmVudE1vZGVsID0gY29tcG9uZW50Vmlldy5tb2RlbCBpZiBjb21wb25lbnRWaWV3XG5cbiAgICBjb21wb25lbnREcmFnID0gbmV3IENvbXBvbmVudERyYWdcbiAgICAgIGNvbXBvbmVudE1vZGVsOiBjb21wb25lbnRNb2RlbFxuICAgICAgY29tcG9uZW50VmlldzogY29tcG9uZW50Vmlld1xuXG4gICAgY29uZmlnID89XG4gICAgICBsb25ncHJlc3M6XG4gICAgICAgIHNob3dJbmRpY2F0b3I6IHRydWVcbiAgICAgICAgZGVsYXk6IDQwMFxuICAgICAgICB0b2xlcmFuY2U6IDNcblxuICAgIEBkcmFnQmFzZS5pbml0KGNvbXBvbmVudERyYWcsIGV2ZW50LCBjb25maWcpXG5cblxuICBjYW5jZWxEcmFnOiAtPlxuICAgIEBkcmFnQmFzZS5jYW5jZWwoKVxuXG5cbiAgaGFuZGxlQ2xpY2tlZENvbXBvbmVudDogKGV2ZW50LCBjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIGNvbXBvbmVudFZpZXdcbiAgICAgIEBmb2N1cy5jb21wb25lbnRGb2N1c2VkKGNvbXBvbmVudFZpZXcpXG5cbiAgICAgIG5vZGVDb250ZXh0ID0gZG9tLmZpbmROb2RlQ29udGV4dChldmVudC50YXJnZXQpXG4gICAgICBpZiBub2RlQ29udGV4dFxuICAgICAgICBzd2l0Y2ggbm9kZUNvbnRleHQuY29udGV4dEF0dHJcbiAgICAgICAgICB3aGVuIGNvbmZpZy5kaXJlY3RpdmVzLmltYWdlLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGltYWdlQ2xpY2suZmlyZShjb21wb25lbnRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgICAgICAgd2hlbiBjb25maWcuZGlyZWN0aXZlcy5odG1sLnJlbmRlcmVkQXR0clxuICAgICAgICAgICAgQGh0bWxFbGVtZW50Q2xpY2suZmlyZShjb21wb25lbnRWaWV3LCBub2RlQ29udGV4dC5hdHRyTmFtZSwgZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQGZvY3VzLmJsdXIoKVxuXG5cbiAgZ2V0Rm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgd2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuXG4gIGJsdXJGb2N1c2VkRWxlbWVudDogLT5cbiAgICBAZm9jdXMuc2V0Rm9jdXModW5kZWZpbmVkKVxuICAgIGZvY3VzZWRFbGVtZW50ID0gQGdldEZvY3VzZWRFbGVtZW50KClcbiAgICAkKGZvY3VzZWRFbGVtZW50KS5ibHVyKCkgaWYgZm9jdXNlZEVsZW1lbnRcblxuXG4gIGNvbXBvbmVudFZpZXdXYXNJbnNlcnRlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgQGluaXRpYWxpemVFZGl0YWJsZXMoY29tcG9uZW50VmlldylcblxuXG4gIGluaXRpYWxpemVFZGl0YWJsZXM6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGlmIGNvbXBvbmVudFZpZXcuZGlyZWN0aXZlcy5lZGl0YWJsZVxuICAgICAgZWRpdGFibGVOb2RlcyA9IGZvciBkaXJlY3RpdmUgaW4gY29tcG9uZW50Vmlldy5kaXJlY3RpdmVzLmVkaXRhYmxlXG4gICAgICAgIGRpcmVjdGl2ZS5lbGVtXG5cbiAgICAgIEBlZGl0YWJsZUNvbnRyb2xsZXIuYWRkKGVkaXRhYmxlTm9kZXMpXG5cblxuICBhZnRlckNvbXBvbmVudEZvY3VzZWQ6IChjb21wb25lbnRWaWV3KSAtPlxuICAgIGNvbXBvbmVudFZpZXcuYWZ0ZXJGb2N1c2VkKClcblxuXG4gIGFmdGVyQ29tcG9uZW50Qmx1cnJlZDogKGNvbXBvbmVudFZpZXcpIC0+XG4gICAgY29tcG9uZW50Vmlldy5hZnRlckJsdXJyZWQoKVxuIiwiJCA9IHJlcXVpcmUoJ2pxdWVyeScpXG5SZW5kZXJpbmdDb250YWluZXIgPSByZXF1aXJlKCcuL3JlbmRlcmluZ19jb250YWluZXInKVxuQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3NfbG9hZGVyJylcbmNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxuIyBBIFBhZ2UgaXMgYSBzdWJjbGFzcyBvZiBSZW5kZXJpbmdDb250YWluZXIgd2hpY2ggaXMgaW50ZW5kZWQgdG8gYmUgc2hvd24gdG9cbiMgdGhlIHVzZXIuIEl0IGhhcyBhIExvYWRlciB3aGljaCBhbGxvd3MgeW91IHRvIGluamVjdCBDU1MgYW5kIEpTIGZpbGVzIGludG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBhZ2UgZXh0ZW5kcyBSZW5kZXJpbmdDb250YWluZXJcblxuICBjb25zdHJ1Y3RvcjogKHsgcmVuZGVyTm9kZSwgcmVhZE9ubHksIGhvc3RXaW5kb3csIEBkZXNpZ24sIEBjb21wb25lbnRUcmVlLCBAbG9hZFJlc291cmNlcyB9PXt9KSAtPlxuICAgIEBpc1JlYWRPbmx5ID0gcmVhZE9ubHkgaWYgcmVhZE9ubHk/XG4gICAgQHJlbmRlck5vZGUgPSBpZiByZW5kZXJOb2RlPy5qcXVlcnkgdGhlbiByZW5kZXJOb2RlWzBdIGVsc2UgcmVuZGVyTm9kZVxuICAgIEBzZXRXaW5kb3coaG9zdFdpbmRvdylcbiAgICBAcmVuZGVyTm9kZSA/PSAkKFwiLiN7IGNvbmZpZy5jc3Muc2VjdGlvbiB9XCIsIEAkYm9keSlcblxuICAgIHN1cGVyKClcblxuICAgIEBjc3NMb2FkZXIgPSBuZXcgQ3NzTG9hZGVyKEB3aW5kb3cpXG4gICAgQGNzc0xvYWRlci5kaXNhYmxlKCkgaWYgbm90IEBzaG91bGRMb2FkUmVzb3VyY2VzKClcbiAgICBAYmVmb3JlUGFnZVJlYWR5KClcblxuXG4gIGJlZm9yZVJlYWR5OiAtPlxuICAgICMgYWx3YXlzIGluaXRpYWxpemUgYSBwYWdlIGFzeW5jaHJvbm91c2x5XG4gICAgQHJlYWR5U2VtYXBob3JlLndhaXQoKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZWFkeVNlbWFwaG9yZS5kZWNyZW1lbnQoKVxuICAgICwgMFxuXG5cbiAgc2hvdWxkTG9hZFJlc291cmNlczogLT5cbiAgICBpZiBAbG9hZFJlc291cmNlcz9cbiAgICAgIEJvb2xlYW4oQGxvYWRSZXNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgQm9vbGVhbihjb25maWcubG9hZFJlc291cmNlcylcblxuXG4gICMgdG9kbzogbW92ZSBwYXRoIHJlc29sdXRpb25zIHRvIGRlc2lnbi5hc3NldHNcbiAgYmVmb3JlUGFnZVJlYWR5OiA9PlxuICAgIHJldHVybiB1bmxlc3MgQGRlc2lnblxuICAgIEBkZXNpZ24uYXNzZXRzLmxvYWRDc3MoQGNzc0xvYWRlciwgQHJlYWR5U2VtYXBob3JlLndhaXQoKSlcblxuXG4gIHNldFdpbmRvdzogKGhvc3RXaW5kb3cpIC0+XG4gICAgaG9zdFdpbmRvdyA/PSBAZ2V0UGFyZW50V2luZG93KEByZW5kZXJOb2RlKVxuICAgIEB3aW5kb3cgPSBob3N0V2luZG93XG4gICAgQGRvY3VtZW50ID0gQHdpbmRvdy5kb2N1bWVudFxuICAgIEAkZG9jdW1lbnQgPSAkKEBkb2N1bWVudClcbiAgICBAJGJvZHkgPSAkKEBkb2N1bWVudC5ib2R5KVxuXG5cbiAgZ2V0UGFyZW50V2luZG93OiAoZWxlbSkgLT5cbiAgICBpZiBlbGVtP1xuICAgICAgZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3XG4gICAgZWxzZVxuICAgICAgd2luZG93XG5cbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuU2VtYXBob3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9zZW1hcGhvcmUnKVxuXG4jIEEgUmVuZGVyaW5nQ29udGFpbmVyIGlzIHVzZWQgYnkgdGhlIFJlbmRlcmVyIHRvIGdlbmVyYXRlIEhUTUwuXG4jXG4jIFRoZSBSZW5kZXJlciBpbnNlcnRzIENvbXBvbmVudFZpZXdzIGludG8gdGhlIFJlbmRlcmluZ0NvbnRhaW5lciBhbmQgbm90aWZpZXMgaXRcbiMgb2YgdGhlIGluc2VydGlvbi5cbiNcbiMgVGhlIFJlbmRlcmluZ0NvbnRhaW5lciBpcyBpbnRlbmRlZCBmb3IgZ2VuZXJhdGluZyBIVE1MLiBQYWdlIGlzIGEgc3ViY2xhc3Mgb2ZcbiMgdGhpcyBiYXNlIGNsYXNzIHRoYXQgaXMgaW50ZW5kZWQgZm9yIGRpc3BsYXlpbmcgdG8gdGhlIHVzZXIuIEludGVyYWN0aXZlUGFnZVxuIyBpcyBhIHN1YmNsYXNzIG9mIFBhZ2Ugd2hpY2ggYWRkcyBpbnRlcmFjdGl2aXR5LCBhbmQgdGh1cyBlZGl0YWJpbGl0eSwgdG8gdGhlXG4jIHBhZ2UuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbmRlcmluZ0NvbnRhaW5lclxuXG4gIGlzUmVhZE9ubHk6IHRydWVcblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZW5kZXJOb2RlID89ICQoJzxkaXYvPicpWzBdXG4gICAgQHJlYWR5U2VtYXBob3JlID0gbmV3IFNlbWFwaG9yZSgpXG4gICAgQGJlZm9yZVJlYWR5KClcbiAgICBAcmVhZHlTZW1hcGhvcmUuc3RhcnQoKVxuXG5cbiAgaHRtbDogLT5cbiAgICAkKEByZW5kZXJOb2RlKS5odG1sKClcblxuXG4gIGNvbXBvbmVudFZpZXdXYXNJbnNlcnRlZDogKGNvbXBvbmVudFZpZXcpIC0+XG5cblxuICAjIFRoaXMgaXMgY2FsbGVkIGJlZm9yZSB0aGUgc2VtYXBob3JlIGlzIHN0YXJ0ZWQgdG8gZ2l2ZSBzdWJjbGFzc2VzIGEgY2hhbmNlXG4gICMgdG8gaW5jcmVtZW50IHRoZSBzZW1hcGhvcmUgc28gaXQgZG9lcyBub3QgZmlyZSBpbW1lZGlhdGVseS5cbiAgYmVmb3JlUmVhZHk6IC0+XG5cblxuICByZWFkeTogKGNhbGxiYWNrKSAtPlxuICAgIEByZWFkeVNlbWFwaG9yZS5hZGRDYWxsYmFjayhjYWxsYmFjaylcbiIsIiQgPSByZXF1aXJlKCdqcXVlcnknKVxuZWRpdG9yQ29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuZG9tID0gcmVxdWlyZSgnLi4vaW50ZXJhY3Rpb24vZG9tJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVcblxuICBjb25zdHJ1Y3RvcjogKHsgbmFtZSwgQHR5cGUsIEBlbGVtLCBjb25maWcgfSkgLT5cbiAgICBAY29uZmlnID0gT2JqZWN0LmNyZWF0ZShlZGl0b3JDb25maWcuZGlyZWN0aXZlc1tAdHlwZV0pXG4gICAgQG5hbWUgPSBuYW1lIHx8IEBjb25maWcuZGVmYXVsdE5hbWVcbiAgICBAc2V0Q29uZmlnKGNvbmZpZylcbiAgICBAb3B0aW9uYWwgPSBmYWxzZVxuXG5cbiAgc2V0Q29uZmlnOiAoY29uZmlnKSAtPlxuICAgICQuZXh0ZW5kKEBjb25maWcsIGNvbmZpZylcblxuXG4gIHJlbmRlcmVkQXR0cjogLT5cbiAgICBAY29uZmlnLnJlbmRlcmVkQXR0clxuXG5cbiAgaXNFbGVtZW50RGlyZWN0aXZlOiAtPlxuICAgIEBjb25maWcuZWxlbWVudERpcmVjdGl2ZVxuXG5cbiAgIyBSZXR1cm4gdGhlIG5vZGVOYW1lIGluIGxvd2VyIGNhc2VcbiAgZ2V0VGFnTmFtZTogLT5cbiAgICBAZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpXG5cblxuICAjIEZvciBldmVyeSBuZXcgQ29tcG9uZW50VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkIGZyb20gdGhlXG4gICMgdGVtcGxhdGUgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlld1xuICBjbG9uZTogLT5cbiAgICBuZXdEaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlKG5hbWU6IEBuYW1lLCB0eXBlOiBAdHlwZSwgY29uZmlnOiBAY29uZmlnKVxuICAgIG5ld0RpcmVjdGl2ZS5vcHRpb25hbCA9IEBvcHRpb25hbFxuICAgIG5ld0RpcmVjdGl2ZVxuXG5cbiAgZ2V0QWJzb2x1dGVCb3VuZGluZ0NsaWVudFJlY3Q6IC0+XG4gICAgZG9tLmdldEFic29sdXRlQm91bmRpbmdDbGllbnRSZWN0KEBlbGVtKVxuXG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiAtPlxuICAgIEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmFzc2VydCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9hc3NlcnQnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9kaXJlY3RpdmUnKVxuXG4jIEEgbGlzdCBvZiBhbGwgZGlyZWN0aXZlcyBvZiBhIHRlbXBsYXRlXG4jIEV2ZXJ5IG5vZGUgd2l0aCBhbiBkb2MtIGF0dHJpYnV0ZSB3aWxsIGJlIHN0b3JlZCBieSBpdHMgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVDb2xsZWN0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAYWxsPXt9KSAtPlxuICAgIEBsZW5ndGggPSAwXG5cblxuICBhZGQ6IChkaXJlY3RpdmUpIC0+XG4gICAgQGFzc2VydE5hbWVOb3RVc2VkKGRpcmVjdGl2ZSlcblxuICAgICMgY3JlYXRlIHBzZXVkbyBhcnJheVxuICAgIHRoaXNbQGxlbmd0aF0gPSBkaXJlY3RpdmVcbiAgICBkaXJlY3RpdmUuaW5kZXggPSBAbGVuZ3RoXG4gICAgQGxlbmd0aCArPSAxXG5cbiAgICAjIGluZGV4IGJ5IG5hbWVcbiAgICBAYWxsW2RpcmVjdGl2ZS5uYW1lXSA9IGRpcmVjdGl2ZVxuXG4gICAgIyBpbmRleCBieSB0eXBlXG4gICAgIyBkaXJlY3RpdmUudHlwZSBpcyBvbmUgb2YgdGhvc2UgJ2NvbnRhaW5lcicsICdlZGl0YWJsZScsICdpbWFnZScsICdodG1sJ1xuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdIHx8PSBbXVxuICAgIHRoaXNbZGlyZWN0aXZlLnR5cGVdLnB1c2goZGlyZWN0aXZlKVxuICAgIGRpcmVjdGl2ZVxuXG5cbiAgbmV4dDogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cbiAgICB0aGlzW2RpcmVjdGl2ZS5pbmRleCArPSAxXVxuXG5cbiAgbmV4dE9mVHlwZTogKG5hbWUpIC0+XG4gICAgZGlyZWN0aXZlID0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgRGlyZWN0aXZlXG4gICAgZGlyZWN0aXZlID89IEBhbGxbbmFtZV1cblxuICAgIHJlcXVpcmVkVHlwZSA9IGRpcmVjdGl2ZS50eXBlXG4gICAgd2hpbGUgZGlyZWN0aXZlID0gQG5leHQoZGlyZWN0aXZlKVxuICAgICAgcmV0dXJuIGRpcmVjdGl2ZSBpZiBkaXJlY3RpdmUudHlwZSBpcyByZXF1aXJlZFR5cGVcblxuXG4gIGdldDogKG5hbWUpIC0+XG4gICAgQGFsbFtuYW1lXVxuXG5cbiAgY291bnQ6ICh0eXBlKSAtPlxuICAgIGlmIHR5cGVcbiAgICAgIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBsZW5ndGhcblxuXG4gIG5hbWVzOiAodHlwZSkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIHRoaXNbdHlwZV0/Lmxlbmd0aFxuICAgIGZvciBkaXJlY3RpdmUgaW4gdGhpc1t0eXBlXVxuICAgICAgZGlyZWN0aXZlLm5hbWVcblxuXG4gIGVhY2g6IChjYWxsYmFjaykgLT5cbiAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNcbiAgICAgIGNhbGxiYWNrKGRpcmVjdGl2ZSlcblxuXG4gIGVhY2hPZlR5cGU6ICh0eXBlLCBjYWxsYmFjaykgLT5cbiAgICBpZiB0aGlzW3R5cGVdXG4gICAgICBmb3IgZGlyZWN0aXZlIGluIHRoaXNbdHlwZV1cbiAgICAgICAgY2FsbGJhY2soZGlyZWN0aXZlKVxuXG5cbiAgZWFjaEVkaXRhYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVhY2hPZlR5cGUoJ2VkaXRhYmxlJywgY2FsbGJhY2spXG5cblxuICBlYWNoSW1hZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnaW1hZ2UnLCBjYWxsYmFjaylcblxuXG4gIGVhY2hDb250YWluZXI6IChjYWxsYmFjaykgLT5cbiAgICBAZWFjaE9mVHlwZSgnY29udGFpbmVyJywgY2FsbGJhY2spXG5cblxuICBlYWNoSHRtbDogKGNhbGxiYWNrKSAtPlxuICAgIEBlYWNoT2ZUeXBlKCdodG1sJywgY2FsbGJhY2spXG5cblxuICBjbG9uZTogLT5cbiAgICBuZXdDb2xsZWN0aW9uID0gbmV3IERpcmVjdGl2ZUNvbGxlY3Rpb24oKVxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICBuZXdDb2xsZWN0aW9uLmFkZChkaXJlY3RpdmUuY2xvbmUoKSlcblxuICAgIG5ld0NvbGxlY3Rpb25cblxuXG4gICMgaGVscGVyIHRvIGRpcmVjdGx5IGdldCBlbGVtZW50IHdyYXBwZWQgaW4gYSBqUXVlcnkgb2JqZWN0XG4gICMgdG9kbzogcmVuYW1lIG9yIGJldHRlciByZW1vdmVcbiAgJGdldEVsZW06IChuYW1lKSAtPlxuICAgICQoQGFsbFtuYW1lXS5lbGVtKVxuXG5cbiAgYXNzZXJ0QWxsTGlua2VkOiAtPlxuICAgIEBlYWNoIChkaXJlY3RpdmUpIC0+XG4gICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRpcmVjdGl2ZS5lbGVtXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG5cbiAgIyBAYXBpIHByaXZhdGVcbiAgYXNzZXJ0TmFtZU5vdFVzZWQ6IChkaXJlY3RpdmUpIC0+XG4gICAgYXNzZXJ0IGRpcmVjdGl2ZSAmJiBub3QgQGFsbFtkaXJlY3RpdmUubmFtZV0sXG4gICAgICBcIlwiXCJcbiAgICAgICN7ZGlyZWN0aXZlLnR5cGV9IFRlbXBsYXRlIHBhcnNpbmcgZXJyb3I6XG4gICAgICAjeyBjb25maWcuZGlyZWN0aXZlc1tkaXJlY3RpdmUudHlwZV0ucmVuZGVyZWRBdHRyIH09XCIjeyBkaXJlY3RpdmUubmFtZSB9XCIuXG4gICAgICBcIiN7IGRpcmVjdGl2ZS5uYW1lIH1cIiBpcyBhIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgXCJcIlwiXG4iLCJjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWd1cmF0aW9uL2NvbmZpZycpXG5EaXJlY3RpdmUgPSByZXF1aXJlKCcuL2RpcmVjdGl2ZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG8gLT5cblxuICBhdHRyaWJ1dGVQcmVmaXggPSAvXih4LXxkYXRhLSkvXG5cbiAgcGFyc2U6IChlbGVtKSAtPlxuICAgIGVsZW1EaXJlY3RpdmUgPSB1bmRlZmluZWRcbiAgICBtb2RpZmljYXRpb25zID0gW11cbiAgICBAcGFyc2VEaXJlY3RpdmVzIGVsZW0sIChkaXJlY3RpdmUpIC0+XG4gICAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgICAgZWxlbURpcmVjdGl2ZSA9IGRpcmVjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBtb2RpZmljYXRpb25zLnB1c2goZGlyZWN0aXZlKVxuXG4gICAgQGFwcGx5TW9kaWZpY2F0aW9ucyhlbGVtRGlyZWN0aXZlLCBtb2RpZmljYXRpb25zKSBpZiBlbGVtRGlyZWN0aXZlXG4gICAgcmV0dXJuIGVsZW1EaXJlY3RpdmVcblxuXG4gIHBhcnNlRGlyZWN0aXZlczogKGVsZW0sIGZ1bmMpIC0+XG4gICAgZGlyZWN0aXZlRGF0YSA9IFtdXG4gICAgZm9yIGF0dHIgaW4gZWxlbS5hdHRyaWJ1dGVzXG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0ci5uYW1lXG4gICAgICBub3JtYWxpemVkTmFtZSA9IGF0dHJpYnV0ZU5hbWUucmVwbGFjZShhdHRyaWJ1dGVQcmVmaXgsICcnKVxuICAgICAgaWYgdHlwZSA9IGNvbmZpZy50ZW1wbGF0ZUF0dHJMb29rdXBbbm9ybWFsaXplZE5hbWVdXG4gICAgICAgIGRpcmVjdGl2ZURhdGEucHVzaFxuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGF0dHJpYnV0ZU5hbWVcbiAgICAgICAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVcbiAgICAgICAgICAgIG5hbWU6IGF0dHIudmFsdWVcbiAgICAgICAgICAgIHR5cGU6IHR5cGVcbiAgICAgICAgICAgIGVsZW06IGVsZW1cblxuICAgICMgU2luY2Ugd2UgbW9kaWZ5IHRoZSBhdHRyaWJ1dGVzIHdlIGhhdmUgdG8gc3BsaXRcbiAgICAjIHRoaXMgaW50byB0d28gbG9vcHNcbiAgICBmb3IgZGF0YSBpbiBkaXJlY3RpdmVEYXRhXG4gICAgICBkaXJlY3RpdmUgPSBkYXRhLmRpcmVjdGl2ZVxuICAgICAgQHJld3JpdGVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBkYXRhLmF0dHJpYnV0ZU5hbWUpXG4gICAgICBmdW5jKGRpcmVjdGl2ZSlcblxuXG4gIGFwcGx5TW9kaWZpY2F0aW9uczogKG1haW5EaXJlY3RpdmUsIG1vZGlmaWNhdGlvbnMpIC0+XG4gICAgZm9yIGRpcmVjdGl2ZSBpbiBtb2RpZmljYXRpb25zXG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnb3B0aW9uYWwnXG4gICAgICAgICAgbWFpbkRpcmVjdGl2ZS5vcHRpb25hbCA9IHRydWVcblxuXG4gICMgTm9ybWFsaXplIG9yIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICMgZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgcmV3cml0ZUF0dHJpYnV0ZTogKGRpcmVjdGl2ZSwgYXR0cmlidXRlTmFtZSkgLT5cbiAgICBpZiBkaXJlY3RpdmUuaXNFbGVtZW50RGlyZWN0aXZlKClcbiAgICAgIGlmIGF0dHJpYnV0ZU5hbWUgIT0gZGlyZWN0aXZlLnJlbmRlcmVkQXR0cigpXG4gICAgICAgIEBub3JtYWxpemVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgICAgZWxzZSBpZiBub3QgZGlyZWN0aXZlLm5hbWVcbiAgICAgICAgQG5vcm1hbGl6ZUF0dHJpYnV0ZShkaXJlY3RpdmUpXG4gICAgZWxzZVxuICAgICAgQHJlbW92ZUF0dHJpYnV0ZShkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpXG5cblxuICAjIGZvcmNlIGF0dHJpYnV0ZSBzdHlsZSBhcyBzcGVjaWZpZWQgaW4gY29uZmlnXG4gICMgZS5nLiBhdHRyaWJ1dGUgJ2RvYy1jb250YWluZXInIGJlY29tZXMgJ2RhdGEtZG9jLWNvbnRhaW5lcidcbiAgbm9ybWFsaXplQXR0cmlidXRlOiAoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKSAtPlxuICAgIGVsZW0gPSBkaXJlY3RpdmUuZWxlbVxuICAgIGlmIGF0dHJpYnV0ZU5hbWVcbiAgICAgIEByZW1vdmVBdHRyaWJ1dGUoZGlyZWN0aXZlLCBhdHRyaWJ1dGVOYW1lKVxuICAgIGVsZW0uc2V0QXR0cmlidXRlKGRpcmVjdGl2ZS5yZW5kZXJlZEF0dHIoKSwgZGlyZWN0aXZlLm5hbWUpXG5cblxuICByZW1vdmVBdHRyaWJ1dGU6IChkaXJlY3RpdmUsIGF0dHJpYnV0ZU5hbWUpIC0+XG4gICAgZGlyZWN0aXZlLmVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cbiIsImNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZ3VyYXRpb24vY29uZmlnJylcblxubW9kdWxlLmV4cG9ydHMgPSBkaXJlY3RpdmVGaW5kZXIgPSBkbyAtPlxuXG4gIGF0dHJpYnV0ZVByZWZpeCA9IC9eKHgtfGRhdGEtKS9cblxuICBsaW5rOiAoZWxlbSwgZGlyZWN0aXZlQ29sbGVjdGlvbikgLT5cbiAgICBmb3IgYXR0ciBpbiBlbGVtLmF0dHJpYnV0ZXNcbiAgICAgIG5vcm1hbGl6ZWROYW1lID0gYXR0ci5uYW1lLnJlcGxhY2UoYXR0cmlidXRlUHJlZml4LCAnJylcbiAgICAgIGlmIHR5cGUgPSBjb25maWcudGVtcGxhdGVBdHRyTG9va3VwW25vcm1hbGl6ZWROYW1lXVxuICAgICAgICBkaXJlY3RpdmUgPSBkaXJlY3RpdmVDb2xsZWN0aW9uLmdldChhdHRyLnZhbHVlKVxuICAgICAgICBkaXJlY3RpdmUuZWxlbSA9IGVsZW1cblxuICAgIHVuZGVmaW5lZFxuIiwiY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG4jIERpcmVjdGl2ZSBJdGVyYXRvclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQ29kZSBpcyBwb3J0ZWQgZnJvbSByYW5neSBOb2RlSXRlcmF0b3IgYW5kIGFkYXB0ZWQgZm9yIGNvbXBvbmVudCB0ZW1wbGF0ZXNcbiMgc28gaXQgZG9lcyBub3QgdHJhdmVyc2UgaW50byBjb250YWluZXJzLlxuI1xuIyBVc2UgdG8gdHJhdmVyc2UgYWxsIG5vZGVzIG9mIGEgdGVtcGxhdGUuIFRoZSBpdGVyYXRvciBkb2VzIG5vdCBnbyBpbnRvXG4jIGNvbnRhaW5lcnMgYW5kIGlzIHNhZmUgdG8gdXNlIGV2ZW4gaWYgdGhlcmUgaXMgY29udGVudCBpbiB0aGVzZSBjb250YWluZXJzLlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaXJlY3RpdmVJdGVyYXRvclxuXG4gIGNvbnN0cnVjdG9yOiAocm9vdCkgLT5cbiAgICBAcm9vdCA9IEBfbmV4dCA9IHJvb3RcbiAgICBAY29udGFpbmVyQXR0ciA9IGNvbmZpZy5kaXJlY3RpdmVzLmNvbnRhaW5lci5yZW5kZXJlZEF0dHJcblxuXG4gIGN1cnJlbnQ6IG51bGxcblxuXG4gIGhhc05leHQ6IC0+XG4gICAgISFAX25leHRcblxuXG4gIG5leHQ6ICgpIC0+XG4gICAgbiA9IEBjdXJyZW50ID0gQF9uZXh0XG4gICAgY2hpbGQgPSBuZXh0ID0gdW5kZWZpbmVkXG4gICAgaWYgQGN1cnJlbnRcbiAgICAgIGNoaWxkID0gbi5maXJzdENoaWxkXG4gICAgICBpZiBjaGlsZCAmJiBuLm5vZGVUeXBlID09IDEgJiYgIW4uaGFzQXR0cmlidXRlKEBjb250YWluZXJBdHRyKVxuICAgICAgICBAX25leHQgPSBjaGlsZFxuICAgICAgZWxzZVxuICAgICAgICBuZXh0ID0gbnVsbFxuICAgICAgICB3aGlsZSAobiAhPSBAcm9vdCkgJiYgIShuZXh0ID0gbi5uZXh0U2libGluZylcbiAgICAgICAgICBuID0gbi5wYXJlbnROb2RlXG5cbiAgICAgICAgQF9uZXh0ID0gbmV4dFxuXG4gICAgQGN1cnJlbnRcblxuXG4gICMgb25seSBpdGVyYXRlIG92ZXIgZWxlbWVudCBub2RlcyAoTm9kZS5FTEVNRU5UX05PREUgPT0gMSlcbiAgbmV4dEVsZW1lbnQ6ICgpIC0+XG4gICAgd2hpbGUgQG5leHQoKVxuICAgICAgYnJlYWsgaWYgQGN1cnJlbnQubm9kZVR5cGUgPT0gMVxuXG4gICAgQGN1cnJlbnRcblxuXG4gIGRldGFjaDogKCkgLT5cbiAgICBAY3VycmVudCA9IEBfbmV4dCA9IEByb290ID0gbnVsbFxuXG4iLCIkID0gcmVxdWlyZSgnanF1ZXJ5JylcbmxvZyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvbG9nZ2luZy9sb2cnKVxuYXNzZXJ0ID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9sb2dnaW5nL2Fzc2VydCcpXG53b3JkcyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvd29yZHMnKVxuY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlndXJhdGlvbi9jb25maWcnKVxuXG5EaXJlY3RpdmVJdGVyYXRvciA9IHJlcXVpcmUoJy4vZGlyZWN0aXZlX2l0ZXJhdG9yJylcbkRpcmVjdGl2ZUNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL2RpcmVjdGl2ZV9jb2xsZWN0aW9uJylcbmRpcmVjdGl2ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfY29tcGlsZXInKVxuZGlyZWN0aXZlRmluZGVyID0gcmVxdWlyZSgnLi9kaXJlY3RpdmVfZmluZGVyJylcblxuQ29tcG9uZW50TW9kZWwgPSByZXF1aXJlKCcuLi9jb21wb25lbnRfdHJlZS9jb21wb25lbnRfbW9kZWwnKVxuQ29tcG9uZW50VmlldyA9IHJlcXVpcmUoJy4uL3JlbmRlcmluZy9jb21wb25lbnRfdmlldycpXG5cbnNvcnRCeU5hbWUgPSAoYSwgYikgLT5cbiAgaWYgKGEubmFtZSA+IGIubmFtZSlcbiAgICAxXG4gIGVsc2UgaWYgKGEubmFtZSA8IGIubmFtZSlcbiAgICAtMVxuICBlbHNlXG4gICAgMFxuXG4jIFRlbXBsYXRlXG4jIC0tLS0tLS0tXG4jIFBhcnNlcyBjb21wb25lbnQgdGVtcGxhdGVzIGFuZCBjcmVhdGVzIENvbXBvbmVudE1vZGVscyBhbmQgQ29tcG9uZW50Vmlld3MuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFRlbXBsYXRlXG5cblxuICBjb25zdHJ1Y3RvcjogKHsgQG5hbWUsIGh0bWwsIGxhYmVsLCBwcm9wZXJ0aWVzIH0gPSB7fSkgLT5cbiAgICBhc3NlcnQgaHRtbCwgJ1RlbXBsYXRlOiBwYXJhbSBodG1sIG1pc3NpbmcnXG5cbiAgICBAJHRlbXBsYXRlID0gJCggQHBydW5lSHRtbChodG1sKSApLndyYXAoJzxkaXY+JylcbiAgICBAJHdyYXAgPSBAJHRlbXBsYXRlLnBhcmVudCgpXG5cbiAgICBAbGFiZWwgPSBsYWJlbCB8fCB3b3Jkcy5odW1hbml6ZSggQG5hbWUgKVxuICAgIEBzdHlsZXMgPSBwcm9wZXJ0aWVzIHx8IHt9XG4gICAgQGRlZmF1bHRzID0ge31cblxuICAgIEBwYXJzZVRlbXBsYXRlKClcblxuXG4gIHNldERlc2lnbjogKGRlc2lnbikgLT5cbiAgICBAZGVzaWduID0gZGVzaWduXG4gICAgQGlkZW50aWZpZXIgPSBcIiN7IGRlc2lnbi5uYW1lIH0uI3sgQG5hbWUgfVwiXG5cblxuICAjIGNyZWF0ZSBhIG5ldyBDb21wb25lbnRNb2RlbCBpbnN0YW5jZSBmcm9tIHRoaXMgdGVtcGxhdGVcbiAgY3JlYXRlTW9kZWw6ICgpIC0+XG4gICAgbmV3IENvbXBvbmVudE1vZGVsKHRlbXBsYXRlOiB0aGlzKVxuXG5cbiAgY3JlYXRlVmlldzogKGNvbXBvbmVudE1vZGVsLCBpc1JlYWRPbmx5KSAtPlxuICAgIGNvbXBvbmVudE1vZGVsIHx8PSBAY3JlYXRlTW9kZWwoKVxuICAgICRlbGVtID0gQCR0ZW1wbGF0ZS5jbG9uZSgpXG4gICAgZGlyZWN0aXZlcyA9IEBsaW5rRGlyZWN0aXZlcygkZWxlbVswXSlcblxuICAgIGNvbXBvbmVudFZpZXcgPSBuZXcgQ29tcG9uZW50Vmlld1xuICAgICAgbW9kZWw6IGNvbXBvbmVudE1vZGVsXG4gICAgICAkaHRtbDogJGVsZW1cbiAgICAgIGRpcmVjdGl2ZXM6IGRpcmVjdGl2ZXNcbiAgICAgIGlzUmVhZE9ubHk6IGlzUmVhZE9ubHlcblxuXG4gIHBydW5lSHRtbDogKGh0bWwpIC0+XG5cbiAgICAjIHJlbW92ZSBhbGwgY29tbWVudHNcbiAgICBodG1sID0gJChodG1sKS5maWx0ZXIgKGluZGV4KSAtPlxuICAgICAgQG5vZGVUeXBlICE9OFxuXG4gICAgIyBvbmx5IGFsbG93IG9uZSByb290IGVsZW1lbnRcbiAgICBhc3NlcnQgaHRtbC5sZW5ndGggPT0gMSwgXCJUZW1wbGF0ZXMgbXVzdCBjb250YWluIG9uZSByb290IGVsZW1lbnQuIFRoZSBUZW1wbGF0ZSBcXFwiI3sgQGlkZW50aWZpZXIgfVxcXCIgY29udGFpbnMgI3sgaHRtbC5sZW5ndGggfVwiXG5cbiAgICBodG1sXG5cbiAgcGFyc2VUZW1wbGF0ZTogKCkgLT5cbiAgICBlbGVtID0gQCR0ZW1wbGF0ZVswXVxuICAgIEBkaXJlY3RpdmVzID0gQGNvbXBpbGVEaXJlY3RpdmVzKGVsZW0pXG5cbiAgICBAZGlyZWN0aXZlcy5lYWNoIChkaXJlY3RpdmUpID0+XG4gICAgICBzd2l0Y2ggZGlyZWN0aXZlLnR5cGVcbiAgICAgICAgd2hlbiAnZWRpdGFibGUnXG4gICAgICAgICAgQGZvcm1hdEVkaXRhYmxlKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcbiAgICAgICAgd2hlbiAnY29udGFpbmVyJ1xuICAgICAgICAgIEBmb3JtYXRDb250YWluZXIoZGlyZWN0aXZlLm5hbWUsIGRpcmVjdGl2ZS5lbGVtKVxuICAgICAgICB3aGVuICdodG1sJ1xuICAgICAgICAgIEBmb3JtYXRIdG1sKGRpcmVjdGl2ZS5uYW1lLCBkaXJlY3RpdmUuZWxlbSlcblxuXG4gICMgSW4gdGhlIGh0bWwgb2YgdGhlIHRlbXBsYXRlIGZpbmQgYW5kIHN0b3JlIGFsbCBET00gbm9kZXNcbiAgIyB3aGljaCBhcmUgZGlyZWN0aXZlcyAoZS5nLiBlZGl0YWJsZXMgb3IgY29udGFpbmVycykuXG4gIGNvbXBpbGVEaXJlY3RpdmVzOiAoZWxlbSkgLT5cbiAgICBpdGVyYXRvciA9IG5ldyBEaXJlY3RpdmVJdGVyYXRvcihlbGVtKVxuICAgIGRpcmVjdGl2ZXMgPSBuZXcgRGlyZWN0aXZlQ29sbGVjdGlvbigpXG5cbiAgICB3aGlsZSBlbGVtID0gaXRlcmF0b3IubmV4dEVsZW1lbnQoKVxuICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlQ29tcGlsZXIucGFyc2UoZWxlbSlcbiAgICAgIGRpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSkgaWYgZGlyZWN0aXZlXG5cbiAgICBkaXJlY3RpdmVzXG5cblxuICAjIEZvciBldmVyeSBuZXcgQ29tcG9uZW50VmlldyB0aGUgZGlyZWN0aXZlcyBhcmUgY2xvbmVkXG4gICMgYW5kIGxpbmtlZCB3aXRoIHRoZSBlbGVtZW50cyBmcm9tIHRoZSBuZXcgdmlldy5cbiAgbGlua0RpcmVjdGl2ZXM6IChlbGVtKSAtPlxuICAgIGl0ZXJhdG9yID0gbmV3IERpcmVjdGl2ZUl0ZXJhdG9yKGVsZW0pXG4gICAgY29tcG9uZW50RGlyZWN0aXZlcyA9IEBkaXJlY3RpdmVzLmNsb25lKClcblxuICAgIHdoaWxlIGVsZW0gPSBpdGVyYXRvci5uZXh0RWxlbWVudCgpXG4gICAgICBkaXJlY3RpdmVGaW5kZXIubGluayhlbGVtLCBjb21wb25lbnREaXJlY3RpdmVzKVxuXG4gICAgY29tcG9uZW50RGlyZWN0aXZlc1xuXG5cbiAgZm9ybWF0RWRpdGFibGU6IChuYW1lLCBlbGVtKSAtPlxuICAgICRlbGVtID0gJChlbGVtKVxuICAgICRlbGVtLmFkZENsYXNzKGNvbmZpZy5jc3MuZWRpdGFibGUpXG5cbiAgICBkZWZhdWx0VmFsdWUgPSB3b3Jkcy50cmltKGVsZW0uaW5uZXJIVE1MKVxuICAgIEBkZWZhdWx0c1tuYW1lXSA9IGlmIGRlZmF1bHRWYWx1ZSB0aGVuIGRlZmF1bHRWYWx1ZSBlbHNlICcnXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0Q29udGFpbmVyOiAobmFtZSwgZWxlbSkgLT5cbiAgICAjIHJlbW92ZSBhbGwgY29udGVudCBmcm9uIGEgY29udGFpbmVyIGZyb20gdGhlIHRlbXBsYXRlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgZm9ybWF0SHRtbDogKG5hbWUsIGVsZW0pIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gd29yZHMudHJpbShlbGVtLmlubmVySFRNTClcbiAgICBAZGVmYXVsdHNbbmFtZV0gPSBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG5cbiAgIyBSZXR1cm4gYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGludGVyZmFjZSBvZiB0aGlzIHRlbXBsYXRlXG4gICMgQHJldHVybnMgeyBPYmplY3QgfSBBbiBvYmplY3Qgd2ljaCBjb250YWlucyB0aGUgaW50ZXJmYWNlIGRlc2NyaXB0aW9uXG4gICMgICBvZiB0aGlzIHRlbXBsYXRlLiBUaGlzIG9iamVjdCB3aWxsIGJlIHRoZSBzYW1lIGlmIHRoZSBpbnRlcmZhY2UgZG9lc1xuICAjICAgbm90IGNoYW5nZSBzaW5jZSBkaXJlY3RpdmVzIGFuZCBwcm9wZXJ0aWVzIGFyZSBzb3J0ZWQuXG4gIGluZm86ICgpIC0+XG4gICAgZG9jID1cbiAgICAgIG5hbWU6IEBuYW1lXG4gICAgICBkZXNpZ246IEBkZXNpZ24/Lm5hbWVcbiAgICAgIGRpcmVjdGl2ZXM6IFtdXG4gICAgICBwcm9wZXJ0aWVzOiBbXVxuXG4gICAgQGRpcmVjdGl2ZXMuZWFjaCAoZGlyZWN0aXZlKSA9PlxuICAgICAgeyBuYW1lLCB0eXBlIH0gPSBkaXJlY3RpdmVcbiAgICAgIGRvYy5kaXJlY3RpdmVzLnB1c2goeyBuYW1lLCB0eXBlIH0pXG5cblxuICAgIGZvciBuYW1lLCBzdHlsZSBvZiBAc3R5bGVzXG4gICAgICBkb2MucHJvcGVydGllcy5wdXNoKHsgbmFtZSwgdHlwZTogJ2Nzc01vZGlmaWNhdG9yJyB9KVxuXG4gICAgZG9jLmRpcmVjdGl2ZXMuc29ydChzb3J0QnlOYW1lKVxuICAgIGRvYy5wcm9wZXJ0aWVzLnNvcnQoc29ydEJ5TmFtZSlcbiAgICBkb2NcblxuXG5cbiMgU3RhdGljIGZ1bmN0aW9uc1xuIyAtLS0tLS0tLS0tLS0tLS0tXG5cblRlbXBsYXRlLnBhcnNlSWRlbnRpZmllciA9IChpZGVudGlmaWVyKSAtPlxuICByZXR1cm4gdW5sZXNzIGlkZW50aWZpZXIgIyBzaWxlbnRseSBmYWlsIG9uIHVuZGVmaW5lZCBvciBlbXB0eSBzdHJpbmdzXG5cbiAgcGFydHMgPSBpZGVudGlmaWVyLnNwbGl0KCcuJylcbiAgaWYgcGFydHMubGVuZ3RoID09IDFcbiAgICB7IGRlc2lnbk5hbWU6IHVuZGVmaW5lZCwgbmFtZTogcGFydHNbMF0gfVxuICBlbHNlIGlmIHBhcnRzLmxlbmd0aCA9PSAyXG4gICAgeyBkZXNpZ25OYW1lOiBwYXJ0c1swXSwgbmFtZTogcGFydHNbMV0gfVxuICBlbHNlXG4gICAgbG9nLmVycm9yKFwiY291bGQgbm90IHBhcnNlIGNvbXBvbmVudCB0ZW1wbGF0ZSBpZGVudGlmaWVyOiAjeyBpZGVudGlmaWVyIH1cIilcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJ2ZXJzaW9uXCI6IFwiMC40LjJcIixcbiAgXCJyZXZpc2lvblwiOiBcImZkMjExZmJcIlxufVxuIl19
