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
  return typeof a === typeof b;
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
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
var ComponentTree, CssLoader, EditorPage, JsLoader, Livingdoc, augmentConfig, config, designCache, doc, imageService, version;

config = require('./configuration/config');

augmentConfig = require('./configuration/augment_config');

Livingdoc = require('./livingdoc');

ComponentTree = require('./component_tree/component_tree');

designCache = require('./design/design_cache');

EditorPage = require('./rendering_container/editor_page');

JsLoader = require('./rendering_container/js_loader');

CssLoader = require('./rendering_container/css_loader');

version = require('../version');

imageService = require('./image_services/image_service');

module.exports = doc = (function() {
  var editorPage;
  editorPage = new EditorPage();
  return {
    version: version.version,
    revision: version.revision,
    design: designCache,
    Livingdoc: Livingdoc,
    ComponentTree: ComponentTree,
    createLivingdoc: function(arg) {
      var componentTree, data, design, layout;
      data = arg.data, design = arg.design, layout = arg.layout, componentTree = arg.componentTree;
      return Livingdoc.create({
        data: data,
        designName: design,
        layoutName: layout,
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
    CssLoader: CssLoader,
    getImageService: function(serviceName) {
      return imageService.get(serviceName);
    }
  };
})();

window.doc = doc;



},{"../version":74,"./component_tree/component_tree":19,"./configuration/augment_config":25,"./configuration/config":26,"./design/design_cache":30,"./image_services/image_service":36,"./livingdoc":44,"./rendering_container/css_loader":62,"./rendering_container/editor_page":63,"./rendering_container/js_loader":65}],13:[function(require,module,exports){
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
    var i, index, len, ref, result;
    ref = this.components;
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      result = ref[index];
      this[index] = result;
    }
    this.length = this.components.length;
    if (this.components.length) {
      this.first = this[0];
      return this.last = this[this.components.length - 1];
    }
  };

  ComponentArray.prototype.each = function(callback) {
    var component, i, len, ref;
    ref = this.components;
    for (i = 0, len = ref.length; i < len; i++) {
      component = ref[i];
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



},{}],14:[function(require,module,exports){
var ComponentContainer, assert;

assert = require('../modules/logging/assert');

module.exports = ComponentContainer = (function() {
  function ComponentContainer(arg) {
    var config, isRoot;
    this.parentComponent = arg.parentComponent, this.name = arg.name, isRoot = arg.isRoot, config = arg.config;
    this.isRoot = isRoot != null;
    this.first = this.last = void 0;
    this.allowedChildren = void 0;
    this.parseConfig(config);
  }

  ComponentContainer.prototype.parseConfig = function(configuration) {
    var componentName, i, len, ref, results;
    if (configuration == null) {
      return;
    }
    ref = configuration.allowedChildren || [];
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      componentName = ref[i];
      if (this.allowedChildren == null) {
        this.allowedChildren = {};
      }
      results.push(this.allowedChildren[componentName] = true);
    }
    return results;
  };

  ComponentContainer.prototype.isAllowedAsChild = function(component) {
    return !!(this.canBeNested(component) && this.isChildAllowed(component) && this.isAllowedAsParent(component));
  };

  ComponentContainer.prototype.canBeNested = function(component) {
    var parent;
    parent = this.parentComponent;
    while (parent != null) {
      if (parent.id === component.id) {
        return false;
      }
      parent = parent.getParent();
    }
    return true;
  };

  ComponentContainer.prototype.isChildAllowed = function(component) {
    return this.allowedChildren === void 0 || this.allowedChildren[component.componentName];
  };

  ComponentContainer.prototype.isAllowedAsParent = function(component) {
    var allowed, allowedParents, i, len, parentName, ref;
    if (!(allowedParents = component.template.allowedParents)) {
      return true;
    }
    parentName = this.isRoot ? 'root' : (ref = this.parentComponent) != null ? ref.componentName : void 0;
    for (i = 0, len = allowedParents.length; i < len; i++) {
      allowed = allowedParents[i];
      if (parentName === allowed) {
        return true;
      }
    }
    return false;
  };

  ComponentContainer.prototype.getComponentTree = function() {
    var ref;
    return this.componentTree || ((ref = this.parentComponent) != null ? ref.componentTree : void 0);
  };

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

  ComponentContainer.prototype.remove = function(component) {
    component.destroy();
    return this._detachComponent(component);
  };

  ComponentContainer.prototype.each = function(callback) {
    var component, results;
    component = this.first;
    results = [];
    while (component) {
      component.descendantsAndSelf(callback);
      results.push(component = component.next);
    }
    return results;
  };

  ComponentContainer.prototype.eachContainer = function(callback) {
    callback(this);
    return this.each(function(component) {
      var componentContainer, name, ref, results;
      ref = component.containers;
      results = [];
      for (name in ref) {
        componentContainer = ref[name];
        results.push(callback(componentContainer));
      }
      return results;
    });
  };

  ComponentContainer.prototype.all = function(callback) {
    callback(this);
    return this.each(function(component) {
      var componentContainer, name, ref, results;
      callback(component);
      ref = component.containers;
      results = [];
      for (name in ref) {
        componentContainer = ref[name];
        results.push(callback(componentContainer));
      }
      return results;
    });
  };

  ComponentContainer.prototype.attachComponent = function(component, position) {
    var componentTree, func;
    if (position == null) {
      position = {};
    }
    assert(this.isAllowedAsChild(component), "Component '" + component.componentName + "' is not allowed as a child of " + (this.getContainerIdentifier()));
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
    var container, ref, ref1;
    container = component.parentContainer;
    if (container) {
      if (component.previous == null) {
        container.first = component.next;
      }
      if (component.next == null) {
        container.last = component.previous;
      }
      if ((ref = component.next) != null) {
        ref.previous = component.previous;
      }
      if ((ref1 = component.previous) != null) {
        ref1.next = component.next;
      }
      return this.setComponentPosition(component, {});
    }
  };

  ComponentContainer.prototype.setComponentPosition = function(component, arg) {
    var next, parentContainer, previous;
    parentContainer = arg.parentContainer, previous = arg.previous, next = arg.next;
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

  ComponentContainer.prototype.getContainerIdentifier = function() {
    if (this.isRoot) {
      return 'root';
    } else {
      return this.parentComponent.componentName + ".containers['" + this.name + "']";
    }
  };

  return ComponentContainer;

})();



},{"../modules/logging/assert":49}],15:[function(require,module,exports){
var ComponentDirective;

module.exports = ComponentDirective = (function() {
  function ComponentDirective(arg) {
    this.component = arg.component, this.templateDirective = arg.templateDirective;
    this.name = this.templateDirective.name;
    this.type = this.templateDirective.type;
  }

  ComponentDirective.prototype.getContent = function() {
    return this.component.content[this.name];
  };

  ComponentDirective.prototype.setContent = function(value) {
    return this.component.setContent(this.name, value);
  };

  ComponentDirective.prototype.isEmpty = function() {
    return !this.getContent();
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
    var ref;
    if (key) {
      return (ref = this.component.dataValues["_" + this.name + "Directive"]) != null ? ref[key] : void 0;
    } else {
      return this.component.dataValues["_" + this.name + "Directive"];
    }
  };

  ComponentDirective.prototype.setTmp = function(key, value) {
    this.tmp = {};
    return this.tmp[key] = value;
  };

  ComponentDirective.prototype.getTmp = function(key) {
    var ref;
    return (ref = this.tmp) != null ? ref[key] : void 0;
  };

  return ComponentDirective;

})();



},{}],16:[function(require,module,exports){
var EditableDirective, HtmlDirective, ImageDirective, LinkDirective, assert, imageService;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

EditableDirective = require('./editable_directive');

ImageDirective = require('./image_directive');

HtmlDirective = require('./html_directive');

LinkDirective = require('./link_directive');

module.exports = {
  create: function(arg) {
    var Directive, component, templateDirective;
    component = arg.component, templateDirective = arg.templateDirective;
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
      case 'link':
        return LinkDirective;
      default:
        return assert(false, "Unsupported component directive: " + directiveType);
    }
  }
};



},{"../image_services/image_service":36,"../modules/logging/assert":49,"./editable_directive":20,"./html_directive":22,"./image_directive":23,"./link_directive":24}],17:[function(require,module,exports){
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
  function ComponentModel(arg1) {
    var id, ref;
    ref = arg1 != null ? arg1 : {}, this.template = ref.template, id = ref.id;
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
    var directive, i, len, ref, results;
    this.directives = new DirectiveCollection();
    ref = this.template.directives;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      directive = ref[i];
      switch (directive.type) {
        case 'container':
          this.containers || (this.containers = {});
          results.push(this.containers[directive.name] = new ComponentContainer({
            name: directive.name,
            parentComponent: this,
            config: directive.config
          }));
          break;
        case 'editable':
        case 'image':
        case 'html':
        case 'link':
          this.createComponentDirective(directive);
          this.content || (this.content = {});
          results.push(this.content[directive.name] = void 0);
          break;
        default:
          results.push(log.error("Template directive type '" + directive.type + "' not implemented in ComponentModel"));
      }
    }
    return results;
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

  ComponentModel.prototype.isAllowedAsSibling = function(component) {
    return this.parentContainer.isAllowedAsChild(component);
  };

  ComponentModel.prototype.isAllowedAsChild = function(containerName, component) {
    return this.containers[containerName].isAllowedAsChild(component);
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
    this.containers[containerName].append(componentModel);
    return this;
  };

  ComponentModel.prototype.prepend = function(containerName, componentModel) {
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
    var ref;
    return (ref = this.parentContainer) != null ? ref.parentComponent : void 0;
  };

  ComponentModel.prototype.parents = function(callback) {
    var componentModel, results;
    componentModel = this;
    results = [];
    while ((componentModel = componentModel.getParent())) {
      results.push(callback(componentModel));
    }
    return results;
  };

  ComponentModel.prototype.children = function(callback) {
    var componentContainer, componentModel, name, ref, results;
    ref = this.containers;
    results = [];
    for (name in ref) {
      componentContainer = ref[name];
      componentModel = componentContainer.first;
      results.push((function() {
        var results1;
        results1 = [];
        while (componentModel) {
          callback(componentModel);
          results1.push(componentModel = componentModel.next);
        }
        return results1;
      })());
    }
    return results;
  };

  ComponentModel.prototype.childrenAndSelf = function(callback) {
    callback(this);
    return this.children(callback);
  };

  ComponentModel.prototype.descendants = function(callback) {
    var componentContainer, componentModel, name, ref, results;
    ref = this.containers;
    results = [];
    for (name in ref) {
      componentContainer = ref[name];
      componentModel = componentContainer.first;
      results.push((function() {
        var results1;
        results1 = [];
        while (componentModel) {
          callback(componentModel);
          componentModel.descendants(callback);
          results1.push(componentModel = componentModel.next);
        }
        return results1;
      })());
    }
    return results;
  };

  ComponentModel.prototype.descendantsAndSelf = function(callback) {
    callback(this);
    return this.descendants(callback);
  };

  ComponentModel.prototype.parentContainers = function(callback) {
    var componentModel, results;
    componentModel = this;
    results = [];
    while (componentModel != null) {
      callback(componentModel.parentContainer);
      results.push(componentModel = componentModel.getParent());
    }
    return results;
  };

  ComponentModel.prototype.descendantContainers = function(callback) {
    return this.descendantsAndSelf(function(componentModel) {
      var componentContainer, name, ref, results;
      ref = componentModel.containers;
      results = [];
      for (name in ref) {
        componentContainer = ref[name];
        results.push(callback(componentContainer));
      }
      return results;
    });
  };

  ComponentModel.prototype.allDescendants = function(callback) {
    return this.descendantsAndSelf((function(_this) {
      return function(componentModel) {
        var componentContainer, name, ref, results;
        if (componentModel !== _this) {
          callback(componentModel);
        }
        ref = componentModel.containers;
        results = [];
        for (name in ref) {
          componentContainer = ref[name];
          results.push(callback(componentContainer));
        }
        return results;
      };
    })(this));
  };

  ComponentModel.prototype.hasContainers = function() {
    return this.containers != null;
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

  ComponentModel.prototype.hasLinks = function() {
    return this.directives.count('link') > 0;
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
    var directive, ref;
    assert((ref = this.content) != null ? ref.hasOwnProperty(name) : void 0, "set error: " + this.componentName + " has no content named " + name);
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
    var ref;
    assert((ref = this.content) != null ? ref.hasOwnProperty(name) : void 0, "get error: " + this.componentName + " has no content named " + name);
    return this.directives.get(name).getContent();
  };

  ComponentModel.prototype.isEmpty = function(name) {
    var value;
    value = this.get(name);
    return value === void 0 || value === '';
  };

  ComponentModel.prototype.data = function(arg) {
    var changedDataProperties, name, ref, value;
    if (typeof arg === 'object') {
      changedDataProperties = [];
      for (name in arg) {
        value = arg[name];
        if (this.changeData(name, value)) {
          changedDataProperties.push(name);
        }
      }
      if (changedDataProperties.length > 0) {
        return (ref = this.componentTree) != null ? ref.dataChanging(this, changedDataProperties) : void 0;
      }
    } else if (arg) {
      return this.dataValues[arg];
    } else {
      return this.dataValues;
    }
  };

  ComponentModel.prototype.setData = function(key, value) {
    var ref;
    if (key && this.changeData(key, value)) {
      return (ref = this.componentTree) != null ? ref.dataChanging(this, [key]) : void 0;
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

  ComponentModel.prototype.getPluginName = function() {
    var ref;
    return (ref = this.plugin) != null ? ref.name : void 0;
  };

  ComponentModel.prototype.setPlugin = function(plugin) {
    return this.plugin = plugin;
  };

  ComponentModel.prototype.getPlugin = function(plugin) {
    return this.plugin;
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



},{"../configuration/config":26,"../modules/guid":48,"../modules/logging/assert":49,"../modules/logging/log":50,"../template/directive_collection":69,"./component_container":14,"./component_directive_factory":16,"deep-equal":1}],18:[function(require,module,exports){
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
      var child, componentArray, containerName, i, len, model, name, ref, ref1, ref2, styleName, template, value;
      template = design.get(json.component || json.identifier);
      assert(template, "error while deserializing component: unknown template identifier '" + json.identifier + "'");
      model = new ComponentModel({
        template: template,
        id: json.id
      });
      ref = json.content;
      for (name in ref) {
        value = ref[name];
        assert(model.content.hasOwnProperty(name), "error while deserializing component " + model.componentName + ": unknown content '" + name + "'");
        if (model.directives.get(name).type === 'image' && typeof value === 'string') {
          model.content[name] = {
            url: value
          };
        } else {
          model.content[name] = value;
        }
      }
      ref1 = json.styles;
      for (styleName in ref1) {
        value = ref1[styleName];
        model.setStyle(styleName, value);
      }
      if (json.data) {
        model.data(json.data);
      }
      ref2 = json.containers;
      for (containerName in ref2) {
        componentArray = ref2[containerName];
        assert(model.containers.hasOwnProperty(containerName), "error while deserializing component: unknown container " + containerName);
        if (componentArray) {
          assert($.isArray(componentArray), "error while deserializing component: container is not array " + containerName);
          for (i = 0, len = componentArray.length; i < len; i++) {
            child = componentArray[i];
            model.append(containerName, this.fromJson(child, design));
          }
        }
      }
      return model;
    }
  };
})();



},{"../configuration/config":26,"../modules/guid":48,"../modules/logging/assert":49,"../modules/logging/log":50,"../modules/serialization":53,"./component_model":17,"deep-equal":1,"jquery":"jquery"}],19:[function(require,module,exports){
var $, ComponentArray, ComponentContainer, ComponentModel, ComponentTree, assert, componentModelSerializer,
  slice = [].slice;

$ = require('jquery');

assert = require('../modules/logging/assert');

ComponentContainer = require('./component_container');

ComponentArray = require('./component_array');

ComponentModel = require('./component_model');

componentModelSerializer = require('./component_model_serializer');

module.exports = ComponentTree = (function() {
  function ComponentTree(arg) {
    var content, ref;
    ref = arg != null ? arg : {}, content = ref.content, this.design = ref.design;
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

  ComponentTree.prototype.setMainView = function(arg) {
    var renderer;
    renderer = arg.renderer;
    assert(renderer, 'componentTree.setMainView: view does not have an initialized renderer');
    assert(renderer.componentTree === this, 'componentTree.setMainView: Cannot set renderer from different componentTree');
    return this.mainRenderer = renderer;
  };

  ComponentTree.prototype.getMainComponentView = function(componentId) {
    var ref;
    return (ref = this.mainRenderer) != null ? ref.getComponentViewById(componentId) : void 0;
  };

  ComponentTree.prototype.isDropAllowed = function(component, targetObj) {
    var componentView, containerName, target, targetComponent;
    target = targetObj.target, componentView = targetObj.componentView, containerName = targetObj.containerName;
    if (target === 'root') {
      return this.root.isAllowedAsChild(component);
    } else if (target === 'component') {
      targetComponent = componentView.model;
      return targetComponent.isAllowedAsSibling(component);
    } else if (target === 'container') {
      targetComponent = componentView.model;
      return targetComponent.isAllowedAsChild(containerName, component);
    }
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
      var componentContainer, name, ref, template;
      if (indentation == null) {
        indentation = 0;
      }
      template = component.template;
      addLine("- " + template.label + " (" + template.name + ")", indentation);
      ref = component.containers;
      for (name in ref) {
        componentContainer = ref[name];
        addLine(name + ":", indentation + 2);
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
    event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this[event].fire.apply(void 0, args);
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
      name: this.design.name,
      version: this.design.version
    };
    componentToData = function(component, level, containerArray) {
      var componentData;
      componentData = component.toJson();
      containerArray.push(componentData);
      return componentData;
    };
    walker = function(component, level, dataObj) {
      var componentContainer, componentData, containerArray, name, ref;
      componentData = componentToData(component, level, dataObj);
      ref = component.containers;
      for (name in ref) {
        componentContainer = ref[name];
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
    var component, componentData, i, len, ref;
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
      ref = data.content;
      for (i = 0, len = ref.length; i < len; i++) {
        componentData = ref[i];
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
    var componentData, fn, i, len, ref, results, timeout;
    if (delay == null) {
      delay = 200;
    }
    assert(this.design != null, 'Error adding data. ComponentTree has no design');
    timeout = Number(delay);
    ref = data.content;
    fn = (function(_this) {
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
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      componentData = ref[i];
      fn();
      results.push(timeout += Number(delay));
    }
    return results;
  };

  ComponentTree.prototype.toData = function() {
    return this.serialize();
  };

  ComponentTree.prototype.fromJson = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.fromData.apply(this, args);
  };

  ComponentTree.prototype.toJson = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.toData.apply(this, args);
  };

  return ComponentTree;

})();



},{"../modules/logging/assert":49,"./component_array":13,"./component_container":14,"./component_model":17,"./component_model_serializer":18,"jquery":"jquery"}],20:[function(require,module,exports){
var ComponentDirective, EditableDirective, assert, words,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../modules/logging/assert');

words = require('../modules/words');

ComponentDirective = require('./component_directive');

module.exports = EditableDirective = (function(superClass) {
  extend(EditableDirective, superClass);

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



},{"../modules/logging/assert":49,"../modules/words":54,"./component_directive":15}],21:[function(require,module,exports){
var $, FieldExtractor, _, assert,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

assert = require('../modules/logging/assert');

_ = require('underscore');

$ = require('jquery');

module.exports = FieldExtractor = (function() {
  function FieldExtractor(componentTree, metadataConfig) {
    this.componentTree = componentTree;
    this.metadataConfig = metadataConfig;
    this.onComponentChange = bind(this.onComponentChange, this);
    this.extractAll = bind(this.extractAll, this);
    this.onTreeChange = bind(this.onTreeChange, this);
    this.fields = {};
    this.initEvents();
    this.extractAll();
    this.setupListeners();
  }

  FieldExtractor.prototype.setupListeners = function() {
    this.componentTree.componentAdded.add(this.onTreeChange);
    this.componentTree.componentRemoved.add(this.onTreeChange);
    this.componentTree.componentMoved.add(this.onTreeChange);
    return this.componentTree.componentContentChanged.add(this.onComponentChange);
  };

  FieldExtractor.prototype.onTreeChange = function(componentModel) {
    var changedFields, componentName, field, fieldName, fieldsHaveChanged, fieldsToExtract, ref;
    componentName = componentModel.componentName;
    fieldsToExtract = this.metadataConfig.getComponentMap()[componentName];
    changedFields = {};
    fieldsHaveChanged = false;
    ref = this.extractFields(fieldsToExtract);
    for (fieldName in ref) {
      field = ref[fieldName];
      if (!(!_.isEqual(this.fields[fieldName], field))) {
        continue;
      }
      fieldsHaveChanged = true;
      changedFields[fieldName] = this.fields[fieldName] = field;
    }
    if (!fieldsHaveChanged) {
      return;
    }
    return this.fieldsChanged.fire(changedFields, this.fields);
  };

  FieldExtractor.prototype.extractAll = function() {
    var allFields;
    allFields = this.metadataConfig.getListOfFields();
    this.fields = this.extractFields(allFields);
    this.fieldsChanged.fire(this.fields, this.fields);
    return this.fields;
  };

  FieldExtractor.prototype.extractFields = function(fieldsToExtract) {
    var fields, fieldsByComponentToExtract;
    fields = {};
    fieldsByComponentToExtract = {};
    _(this.metadataConfig.getComponentMap()).forEach(function(fieldsByComponent, componentName) {
      return fieldsByComponentToExtract[componentName] = _.intersection(fieldsByComponent, fieldsToExtract);
    });
    this.componentTree.each((function(_this) {
      return function(componentModel) {
        var componentName, newFields, ref;
        componentName = componentModel.componentName;
        if (!((ref = fieldsByComponentToExtract[componentName]) != null ? ref.length : void 0)) {
          return;
        }
        newFields = _this.extractFieldsFromComponent(componentModel, fieldsByComponentToExtract[componentName]);
        return _(newFields).forEach(function(field, fieldName) {
          _(fieldsByComponentToExtract).forEach(function(fieldsByComponent, componentName) {
            return fieldsByComponentToExtract[componentName] = _.without(fieldsByComponent, fieldName);
          });
          return fields[fieldName] = field;
        });
      };
    })(this));
    return fields;
  };

  FieldExtractor.prototype.extractFieldsFromComponent = function(componentModel, fieldsToExtract) {
    var componentName, fields;
    fields = {};
    componentName = componentModel.componentName;
    fieldsToExtract.forEach((function(_this) {
      return function(fieldToExtract) {
        var directives;
        directives = _this.metadataConfig.getDirectivesByComponentAndField(componentName, fieldToExtract);
        return directives.forEach(function(directiveName) {
          var directiveModel, field;
          if (fields[fieldToExtract]) {
            return;
          }
          directiveModel = componentModel.directives.get(directiveName);
          if (directiveModel.isEmpty()) {
            return;
          }
          field = _this.extractFieldFromDirective(directiveModel, fieldToExtract);
          return fields[fieldToExtract] = field;
        });
      };
    })(this));
    return fields;
  };

  FieldExtractor.prototype.onComponentChange = function(componentModel, directiveName) {
    var changedFields, componentName, directiveModel, fieldNames, fieldsThatNeedFullExtraction;
    componentName = componentModel.componentName;
    fieldNames = this.metadataConfig.getFieldsBySource(componentName, directiveName);
    changedFields = {};
    fieldsThatNeedFullExtraction = [];
    directiveModel = componentModel.directives.get(directiveName);
    _(fieldNames).forEach((function(_this) {
      return function(fieldName) {
        var field, fieldIsEmpty, fieldWasEmpty, fieldWasFilledFromThisComponent, ref;
        field = directiveModel.isEmpty() ? void 0 : _this.extractFieldFromDirective(directiveModel, fieldName);
        fieldIsEmpty = field == null;
        fieldWasEmpty = _this.fields[fieldName] == null;
        fieldWasFilledFromThisComponent = ((ref = _this.fields[fieldName]) != null ? ref.component.id : void 0) === componentModel.id;
        if (fieldIsEmpty && fieldWasFilledFromThisComponent) {
          fieldsThatNeedFullExtraction.push(fieldName);
          return _this.fields[fieldName] = changedFields[fieldName] = void 0;
        } else if ((fieldWasEmpty || fieldWasFilledFromThisComponent) && !_.isEqual(_this.fields[fieldName], field)) {
          return _this.fields[fieldName] = changedFields[fieldName] = field;
        }
      };
    })(this));
    if (fieldsThatNeedFullExtraction.length) {
      _(this.extractFields(fieldsThatNeedFullExtraction)).forEach((function(_this) {
        return function(field, fieldName) {
          return _this.fields[fieldName] = changedFields[fieldName] = field;
        };
      })(this));
    }
    if (_(changedFields).size()) {
      return this.fieldsChanged.fire(changedFields, this.fields);
    }
  };

  FieldExtractor.prototype.initEvents = function() {
    return this.fieldsChanged = $.Callbacks();
  };

  FieldExtractor.prototype.extractFieldFromDirective = function(directiveModel, fieldToExtract) {
    var type, value;
    type = this.metadataConfig.getConfigMap()[fieldToExtract].type;
    if (type === 'text') {
      return value = this.extractTextField(directiveModel);
    } else if (type === 'image') {
      if (!directiveModel.isBase64()) {
        return value = this.extractImageField(directiveModel);
      }
    } else {
      return assert(false, "Unknown template type " + type);
    }
  };

  FieldExtractor.prototype.extractTextField = function(directiveModel) {
    var content;
    content = directiveModel.getContent();
    return {
      content: content,
      component: directiveModel.component,
      directiveName: directiveModel.name,
      text: directiveModel.getText(),
      type: 'text'
    };
  };

  FieldExtractor.prototype.extractImageField = function(imageDirective) {
    var ref, ref1;
    return {
      component: imageDirective.component,
      directiveName: imageDirective.name,
      type: 'image',
      image: {
        originalUrl: imageDirective.getOriginalUrl(),
        url: imageDirective.getImageUrl(),
        width: (ref = imageDirective.getOriginalImageDimensions()) != null ? ref.width : void 0,
        height: (ref1 = imageDirective.getOriginalImageDimensions()) != null ? ref1.height : void 0,
        imageService: imageDirective.getImageServiceName()
      }
    };
  };

  FieldExtractor.prototype.getFields = function() {
    return this.fields;
  };

  return FieldExtractor;

})();



},{"../modules/logging/assert":49,"jquery":"jquery","underscore":10}],22:[function(require,module,exports){
var ComponentDirective, HtmlDirective, assert,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../modules/logging/assert');

ComponentDirective = require('./component_directive');

module.exports = HtmlDirective = (function(superClass) {
  extend(HtmlDirective, superClass);

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



},{"../modules/logging/assert":49,"./component_directive":15}],23:[function(require,module,exports){
var ComponentDirective, ImageDirective, assert, imageService,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

assert = require('../modules/logging/assert');

imageService = require('../image_services/image_service');

ComponentDirective = require('./component_directive');

module.exports = ImageDirective = (function(superClass) {
  extend(ImageDirective, superClass);

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

  ImageDirective.prototype.isBase64 = function() {
    return !!this.base64Image;
  };

  ImageDirective.prototype.setBase64Image = function(base64String) {
    this.base64Image = base64String;
    if (this.component.componentTree) {
      return this.component.componentTree.contentChanging(this.component, this.name);
    }
  };

  ImageDirective.prototype.setImageUrl = function(value) {
    var base, name1;
    if ((base = this.component.content)[name1 = this.name] == null) {
      base[name1] = {};
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
    var ref;
    return ((ref = this.component.content[this.name]) != null ? ref.originalUrl : void 0) || this.getImageUrl();
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

  ImageDirective.prototype.setOriginalImageDimensions = function(arg) {
    var content, height, width;
    width = arg.width, height = arg.height;
    content = this.component.content[this.name];
    content.width = width;
    return content.height = height;
  };

  ImageDirective.prototype.getOriginalImageDimensions = function() {
    var content;
    content = this.component.content[this.name];
    return {
      width: content != null ? content.width : void 0,
      height: content != null ? content.height : void 0
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
    var ref, serviceName;
    serviceName = (ref = this.component.content[this.name]) != null ? ref.imageService : void 0;
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



},{"../image_services/image_service":36,"../modules/logging/assert":49,"./component_directive":15}],24:[function(require,module,exports){
var ComponentDirective, LinkDirective,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ComponentDirective = require('./component_directive');

module.exports = LinkDirective = (function(superClass) {
  extend(LinkDirective, superClass);

  function LinkDirective() {
    return LinkDirective.__super__.constructor.apply(this, arguments);
  }

  LinkDirective.prototype.isLink = true;

  return LinkDirective;

})(ComponentDirective);



},{"./component_directive":15}],25:[function(require,module,exports){
module.exports = function(config) {
  var name, prefix, ref, value;
  config.docDirective = {};
  config.templateAttrLookup = {};
  ref = config.directives;
  for (name in ref) {
    value = ref[name];
    prefix = config.attributePrefix ? config.attributePrefix + "-" : '';
    value.renderedAttr = "" + prefix + value.attr;
    config.docDirective[name] = value.renderedAttr;
    config.templateAttrLookup[value.attr] = name;
  }
  return config;
};



},{}],26:[function(require,module,exports){
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
      renderedAttr: 'calculated in augment_config',
      overwritesContent: true
    },
    editable: {
      attr: 'doc-editable',
      renderedAttr: 'calculated in augment_config',
      overwritesContent: true
    },
    html: {
      attr: 'doc-html',
      renderedAttr: 'calculated in augment_config',
      overwritesContent: true
    },
    image: {
      attr: 'doc-image',
      renderedAttr: 'calculated in augment_config'
    },
    link: {
      attr: 'doc-link',
      renderedAttr: 'calculated in augment_config'
    },
    optional: {
      attr: 'doc-optional',
      renderedAttr: 'calculated in augment_config',
      modifies: ['editable']
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
  imagePlaceholder: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="620" height="350" viewBox="0 0 620 350" preserveAspectRatio="none"><rect width="620" height="350" fill="#D4D4CE"/><line x1="0" y1="0" x2="620" y2="350" style="stroke:#ffffff;stroke-width:2"/><line x1="620" y1="0" x2="0" y2="350" style="stroke:#ffffff;stroke-width:2"/></svg>'),
  imageServices: {
    'resrc.it': {
      quality: 75,
      host: 'https://app.resrc.it'
    }
  }
});



},{"./augment_config":25}],27:[function(require,module,exports){
var MetadataConfig;

module.exports = MetadataConfig = (function() {
  function MetadataConfig(config) {
    this.fieldsArray = [];
    this.editableFieldsArray = [];
    this.fieldMap = {};
    this.configMap = {};
    this.componentDirectiveMap = {};
    this.componentMap = {};
    if ((config != null) && config.length) {
      this.parse(config);
    }
  }

  MetadataConfig.prototype.parse = function(config) {
    var base, componentName, directive, fieldItemConfig, fieldName, i, isEditable, len, pattern, results, type;
    results = [];
    for (i = 0, len = config.length; i < len; i++) {
      fieldItemConfig = config[i];
      fieldName = fieldItemConfig.identifier;
      type = fieldItemConfig.type;
      this.fieldsArray.push(fieldName);
      this.configMap[fieldName] = fieldItemConfig;
      if ((base = this.fieldMap)[fieldName] == null) {
        base[fieldName] = {};
      }
      isEditable = fieldItemConfig.isEditable != null ? !!fieldItemConfig.isEditable : true;
      if (isEditable) {
        this.editableFieldsArray.push(fieldName);
      }
      results.push((function() {
        var base1, base2, base3, base4, j, len1, ref, ref1, results1;
        ref = fieldItemConfig.matches;
        results1 = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          pattern = ref[j];
          ref1 = pattern.split('.'), componentName = ref1[0], directive = ref1[1];
          if ((base1 = this.componentDirectiveMap)[componentName] == null) {
            base1[componentName] = {};
          }
          if ((base2 = this.componentDirectiveMap[componentName])[directive] == null) {
            base2[directive] = [];
          }
          this.componentDirectiveMap[componentName][directive].push(fieldName);
          if ((base3 = this.componentMap)[componentName] == null) {
            base3[componentName] = [];
          }
          this.componentMap[componentName].push(fieldName);
          if ((base4 = this.fieldMap[fieldName])[componentName] == null) {
            base4[componentName] = [];
          }
          results1.push(this.fieldMap[fieldName][componentName].push(directive));
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  MetadataConfig.prototype.getListOfEditableFields = function() {
    return this.editableFieldsArray;
  };

  MetadataConfig.prototype.getListOfFields = function() {
    return this.fieldsArray;
  };

  MetadataConfig.prototype.getConfigMap = function() {
    return this.configMap;
  };

  MetadataConfig.prototype.getComponentMap = function() {
    return this.componentMap;
  };

  MetadataConfig.prototype.getFieldsBySource = function(componentName, directive) {
    var ref;
    return ((ref = this.componentDirectiveMap[componentName]) != null ? ref[directive] : void 0) || [];
  };

  MetadataConfig.prototype.getDirectivesByComponentAndField = function(componentName, fieldName) {
    return this.fieldMap[fieldName][componentName];
  };

  return MetadataConfig;

})();



},{}],28:[function(require,module,exports){
var CssModificatorProperty, assert, log, words;

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

words = require('../modules/words');

module.exports = CssModificatorProperty = (function() {
  function CssModificatorProperty(arg) {
    var label, options, value;
    this.name = arg.name, label = arg.label, this.type = arg.type, value = arg.value, options = arg.options;
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
    var i, len, option, ref;
    ref = this.options;
    for (i = 0, len = ref.length; i < len; i++) {
      option = ref[i];
      if (value === option.value) {
        return true;
      }
    }
    return false;
  };

  CssModificatorProperty.prototype.otherOptions = function(value) {
    var i, len, option, others, ref;
    others = [];
    ref = this.options;
    for (i = 0, len = ref.length; i < len; i++) {
      option = ref[i];
      if (option.value !== value) {
        others.push(option);
      }
    }
    return others;
  };

  CssModificatorProperty.prototype.otherClasses = function(value) {
    var i, len, option, others, ref;
    others = [];
    ref = this.options;
    for (i = 0, len = ref.length; i < len; i++) {
      option = ref[i];
      if (option.value !== value) {
        others.push(option.value);
      }
    }
    return others;
  };

  return CssModificatorProperty;

})();



},{"../modules/logging/assert":49,"../modules/logging/log":50,"../modules/words":54}],29:[function(require,module,exports){
var Dependencies, Design, OrderedHash, Template, _, assert, config, log, words;

config = require('../configuration/config');

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

words = require('../modules/words');

Template = require('../template/template');

OrderedHash = require('../modules/ordered_hash');

Dependencies = require('../rendering/dependencies');

_ = require('underscore');

module.exports = Design = (function() {
  function Design(arg) {
    var label;
    this.name = arg.name, this.version = arg.version, label = arg.label, this.author = arg.author, this.description = arg.description;
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
    var ref;
    return (ref = this.getDefaultParagraphTemplate()) != null ? ref.name : void 0;
  };

  Design.prototype.getDefaultImageComponentName = function() {
    var ref;
    return (ref = this.getDefaultImageTemplate()) != null ? ref.name : void 0;
  };

  Design.prototype.getDefaultImageDirectiveName = function() {
    var ref, ref1;
    return (ref = this.defaultImage) != null ? (ref1 = ref.directives.firstOfType('image')) != null ? ref1.name : void 0 : void 0;
  };

  Design.prototype.getLayout = function(name) {
    if (!this.layouts) {
      return {
        wrapper: this.wrapper
      };
    }
    if (!((name != null) || (this.defaultLayout != null))) {
      return _.first(this.layouts);
    }
    if (name == null) {
      name = this.defaultLayout;
    }
    return _.findWhere(this.layouts, {
      name: name
    });
  };

  Design.getIdentifier = function(name, version) {
    if (version) {
      return name + "@" + version;
    } else {
      return "" + name;
    }
  };

  return Design;

})();



},{"../configuration/config":26,"../modules/logging/assert":49,"../modules/logging/log":50,"../modules/ordered_hash":51,"../modules/words":54,"../rendering/dependencies":56,"../template/template":73,"underscore":10}],30:[function(require,module,exports){
var Design, Version, assert, designParser;

assert = require('../modules/logging/assert');

Design = require('./design');

designParser = require('./design_parser');

Version = require('./version');

module.exports = (function() {
  return {
    designs: {},
    load: function(designSpec, arg) {
      var basePath, design, designIdentifier, version;
      basePath = (arg != null ? arg : {}).basePath;
      assert(designSpec != null, 'design.load() was called with undefined.');
      assert(!(typeof designSpec === 'string'), 'design.load() loading a design by name is not implemented.');
      version = Version.parse(designSpec.version);
      designIdentifier = Design.getIdentifier(designSpec.name, version);
      if (this.has(designIdentifier)) {
        return;
      }
      if ((basePath != null) && (designSpec.assets != null)) {
        designSpec.assets.basePath = basePath;
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



},{"../modules/logging/assert":49,"./design":29,"./design_parser":32,"./version":34}],31:[function(require,module,exports){
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
  var emptyCount, entry, i, len;
  emptyCount = 0;
  for (i = 0, len = value.length; i < len; i++) {
    entry = value[i];
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
  layouts: 'array of layout, optional',
  defaultLayout: 'string, optional',
  defaultContent: 'array of object, optional',
  prefilledComponents: 'object, optional'
});

validator.add('component', {
  name: 'string',
  label: 'string, optional',
  html: 'string',
  directives: 'object, optional',
  properties: 'array of string, optional',
  allowedParents: 'array of string, optional',
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

validator.add('layout', {
  name: 'string',
  caption: 'string',
  wrapper: 'wrapper',
  icon: 'string, optional'
});



},{"../configuration/config":26,"./version":34,"jscheme":4}],32:[function(require,module,exports){
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
      $.each(['metadata', 'wrapper', 'layouts', 'defaultLayout', 'defaultContent', 'prefilledComponents'], (function(_this) {
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
    var entry, i, len, results;
    if (data == null) {
      return;
    }
    if ($.type(data) === 'string') {
      return callback(data);
    } else {
      results = [];
      for (i = 0, len = data.length; i < len; i++) {
        entry = data[i];
        results.push(callback(entry));
      }
      return results;
    }
  },
  parseComponentProperties: function(componentProperties) {
    var config, name, results;
    this.componentProperties = {};
    results = [];
    for (name in componentProperties) {
      config = componentProperties[name];
      config.name = name;
      results.push(this.componentProperties[name] = this.createComponentProperty(config));
    }
    return results;
  },
  parseImageRatios: function(ratios) {
    var name, ratio, results;
    results = [];
    for (name in ratios) {
      ratio = ratios[name];
      results.push(this.design.imageRatios[name] = new ImageRatio({
        name: name,
        label: ratio.label,
        ratio: ratio.ratio
      }));
    }
    return results;
  },
  parseComponents: function(components) {
    var allowedParents, directives, html, i, label, len, name, properties, ref, results, template;
    if (components == null) {
      components = [];
    }
    results = [];
    for (i = 0, len = components.length; i < len; i++) {
      ref = components[i], name = ref.name, label = ref.label, html = ref.html, properties = ref.properties, directives = ref.directives, allowedParents = ref.allowedParents;
      properties = this.lookupComponentProperties(properties);
      template = new Template({
        name: name,
        label: label,
        html: html,
        properties: properties,
        allowedParents: allowedParents
      });
      this.parseDirectives(template, directives);
      results.push(this.design.add(template));
    }
    return results;
  },
  parseDirectives: function(template, directivesConfig) {
    var conf, directive, directiveConfig, name, results;
    results = [];
    for (name in directivesConfig) {
      conf = directivesConfig[name];
      directive = template.directives.get(name);
      assert(directive, "Could not find directive " + name + " in " + template.name + " component.");
      directiveConfig = $.extend({}, conf);
      if (conf.imageRatios) {
        directiveConfig.imageRatios = this.lookupImageRatios(conf.imageRatios);
      }
      results.push(directive.setConfig(directiveConfig));
    }
    return results;
  },
  lookupComponentProperties: function(propertyNames) {
    var i, len, name, properties, property, ref;
    properties = {};
    ref = propertyNames || [];
    for (i = 0, len = ref.length; i < len; i++) {
      name = ref[i];
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
    var componentName, components, group, i, len, results;
    if (groups == null) {
      groups = [];
    }
    results = [];
    for (i = 0, len = groups.length; i < len; i++) {
      group = groups[i];
      components = (function() {
        var j, len1, ref, results1;
        ref = group.components;
        results1 = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          componentName = ref[j];
          results1.push(this.design.get(componentName));
        }
        return results1;
      }).call(this);
      results.push(this.design.groups.push({
        label: group.label,
        components: components
      }));
    }
    return results;
  },
  parseDefaults: function(defaultComponents) {
    var image, paragraph;
    if (defaultComponents == null) {
      return;
    }
    paragraph = defaultComponents.paragraph, image = defaultComponents.image;
    if (paragraph) {
      this.design.defaultParagraph = this.getTemplate(paragraph);
    }
    if (image) {
      return this.design.defaultImage = this.getTemplate(image);
    }
  },
  getTemplate: function(name) {
    var template;
    template = this.design.get(name);
    assert(template, "Could not find component " + name);
    return template;
  },
  createComponentProperty: function(styleDefinition) {
    return new CssModificatorProperty(styleDefinition);
  },
  mapArray: function(entries, lookup) {
    var entry, i, len, newArray, val;
    newArray = [];
    for (i = 0, len = entries.length; i < len; i++) {
      entry = entries[i];
      val = lookup(entry);
      if (val != null) {
        newArray.push(val);
      }
    }
    return newArray;
  }
};

Design.parser = designParser;



},{"../modules/logging/assert":49,"../modules/logging/log":50,"../template/template":73,"./css_modificator_property":28,"./design":29,"./design_config_schema":31,"./image_ratio":33,"./version":34,"jquery":"jquery"}],33:[function(require,module,exports){
var $, ImageRatio, assert, words;

$ = require('jquery');

words = require('../modules/words');

assert = require('../modules/logging/assert');

module.exports = ImageRatio = (function() {
  var ratioString;

  ratioString = /(\d+)[\/:x](\d+)/;

  function ImageRatio(arg) {
    var label, ratio;
    this.name = arg.name, label = arg.label, ratio = arg.ratio;
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



},{"../modules/logging/assert":49,"../modules/words":54,"jquery":"jquery"}],34:[function(require,module,exports){
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
    return this.major + "." + this.minor + "." + this.patch + (this.addendum || '');
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



},{}],35:[function(require,module,exports){
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



},{}],36:[function(require,module,exports){
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
      var name, results, service;
      results = [];
      for (name in services) {
        service = services[name];
        results.push(callback(name, service));
      }
      return results;
    }
  };
})();



},{"../modules/logging/assert":49,"./default_image_service":35,"./resrcit_image_service":37}],37:[function(require,module,exports){
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
    getUrl: function(value, arg) {
      var crop, height, q, quality, ref, style, width, x, y;
      ref = arg != null ? arg : {}, crop = ref.crop, quality = ref.quality;
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



},{"../configuration/config":26,"../modules/logging/assert":49,"./default_image_service":35}],38:[function(require,module,exports){
var $, ComponentDrag, config, css, dom, isSupported;

$ = require('jquery');

dom = require('./dom');

isSupported = require('../modules/feature_detection/is_supported');

config = require('../configuration/config');

css = config.css;

module.exports = ComponentDrag = (function() {
  var startAndEndOffset, wiggleSpace;

  wiggleSpace = 0;

  startAndEndOffset = 0;

  function ComponentDrag(arg) {
    var componentView;
    this.componentModel = arg.componentModel, componentView = arg.componentView;
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
      left: eventPosition.pageX + "px",
      top: eventPosition.pageY + "px"
    });
    return this.target = this.findDropTarget(eventPosition);
  };

  ComponentDrag.prototype.findDropTarget = function(eventPosition) {
    var coords, elem, ref, ref1, target;
    ref = this.getElemUnderCursor(eventPosition), eventPosition = ref.eventPosition, elem = ref.elem;
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
    if (!this.canBeDropped(target)) {
      target = void 0;
    }
    this.undoMakeSpace();
    if ((target != null) && ((ref1 = target.componentView) != null ? ref1.model : void 0) !== this.componentModel) {
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

  ComponentDrag.prototype.canBeDropped = function(target) {
    var componentTree, isAllowed;
    if (target == null) {
      return false;
    }
    componentTree = target.componentTree;
    if (componentTree == null) {
      componentTree = target.componentView.model.componentTree;
    }
    isAllowed = componentTree.isDropAllowed(this.componentModel, target);
    return isAllowed;
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

  ComponentDrag.prototype.showMarker = function(arg) {
    var $body, left, top, width;
    left = arg.left, top = arg.top, width = arg.width;
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
      left: left + "px",
      top: top + "px",
      width: width + "px"
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
    var base, base1;
    if ($container[0] !== this.$highlightedContainer[0]) {
      if (typeof (base = this.$highlightedContainer).removeClass === "function") {
        base.removeClass(css.containerHighlight);
      }
      this.$highlightedContainer = $container;
      return typeof (base1 = this.$highlightedContainer).addClass === "function" ? base1.addClass(css.containerHighlight) : void 0;
    }
  };

  ComponentDrag.prototype.removeContainerHighlight = function() {
    var base;
    if (typeof (base = this.$highlightedContainer).removeClass === "function") {
      base.removeClass(css.containerHighlight);
    }
    return this.$highlightedContainer = {};
  };

  ComponentDrag.prototype.getElemUnderCursor = function(eventPosition) {
    var elem;
    elem = void 0;
    this.unblockElementFromPoint((function(_this) {
      return function() {
        var clientX, clientY, ref;
        clientX = eventPosition.clientX, clientY = eventPosition.clientY;
        if ((clientX != null) && (clientY != null)) {
          elem = _this.page.document.elementFromPoint(clientX, clientY);
        }
        if ((elem != null ? elem.nodeName : void 0) === 'IFRAME') {
          return ref = _this.findElemInIframe(elem, eventPosition), eventPosition = ref.eventPosition, elem = ref.elem, ref;
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



},{"../configuration/config":26,"../modules/feature_detection/is_supported":47,"./dom":40,"jquery":"jquery"}],39:[function(require,module,exports){
var ContainerEvent;

module.exports = ContainerEvent = (function() {
  function ContainerEvent(arg) {
    var blur, focus;
    this.target = arg.target, focus = arg.focus, blur = arg.blur;
    this.type = focus ? 'containerFocus' : blur ? 'containerBlur' : void 0;
  }

  return ContainerEvent;

})();



},{}],40:[function(require,module,exports){
var $, config, css, directiveFinder;

$ = require('jquery');

config = require('../configuration/config');

directiveFinder = require('../template/directive_finder');

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
    getDirectiveContext: function(node) {
      var directives;
      node = this.getElementNode(node);
      while (node && node.nodeType === 1) {
        directives = this.getDirectives(node);
        if (directives) {
          return directives;
        }
        node = node.parentNode;
      }
      return void 0;
    },
    isInsideDocLink: function(node) {
      var directives;
      while (node && node.nodeType === 1) {
        directives = this.getDirectives(node);
        if (directives != null ? directives['link'] : void 0) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    },
    getDirectives: function(node) {
      var directives;
      directives = void 0;
      directiveFinder.eachDirective(node, function(type, name) {
        if (type === 'optional') {
          return;
        }
        if (directives == null) {
          directives = {};
        }
        return directives[type] = {
          type: type,
          name: name
        };
      });
      return directives;
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
    dropTarget: function(node, arg) {
      var closestComponentData, containerAttr, left, top;
      top = arg.top, left = arg.left;
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
    getComponentTarget: function(elem, arg) {
      var left, position, top;
      top = arg.top, left = arg.left, position = arg.position;
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
    getPositionOnComponent: function(elem, arg) {
      var $elem, elemBottom, elemHeight, elemTop, left, top;
      top = arg.top, left = arg.left;
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
    getClosestComponent: function(container, arg) {
      var $components, closest, closestComponent, left, top;
      top = arg.top, left = arg.left;
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
      var $elem, $parent, elem, name, outer, parentHeight, ref, results;
      if (view.template.containerCount > 1) {
        ref = view.containers;
        results = [];
        for (name in ref) {
          elem = ref[name];
          $elem = $(elem);
          if ($elem.hasClass(css.maximizedContainer)) {
            continue;
          }
          $parent = $elem.parent();
          parentHeight = $parent.height();
          outer = $elem.outerHeight(true) - $elem.height();
          $elem.height(parentHeight - outer);
          results.push($elem.addClass(css.maximizedContainer));
        }
        return results;
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
      var coords, ref, scrollX, scrollY, win;
      win = node.ownerDocument.defaultView;
      ref = this.getScrollPosition(win), scrollX = ref.scrollX, scrollY = ref.scrollY;
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



},{"../configuration/config":26,"../template/directive_finder":71,"jquery":"jquery"}],41:[function(require,module,exports){
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

  DragBase.prototype.addLongpressIndicator = function(arg) {
    var $indicator, pageX, pageY;
    pageX = arg.pageX, pageY = arg.pageY;
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



},{"../configuration/config":26}],42:[function(require,module,exports){
var EditableController, config, dom,
  slice = [].slice;

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
    this.editable.focus(this.withContext(this.focus)).blur(this.withContext(this.blur)).insert(this.withContext(this.insert)).paste(this.withContext(this.paste)).merge(this.withContext(this.merge)).split(this.withContext(this.split)).selection(this.withContext(this.selectionChanged)).newline(this.withContext(this.newline)).change(this.withContext(this.change));
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
        element = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
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

  EditableController.prototype.paste = function(view, editableName, blocks, cursor) {
    var block, currentBlock, defaultParagraph, firstBlock, firstEditable, i, index, len, newBlock, ref, viewDirective;
    firstBlock = blocks[0];
    cursor.insertBefore(firstBlock);
    if (blocks.length <= 1) {
      cursor.setVisibleSelection();
    } else {
      defaultParagraph = this.page.design.defaultParagraph;
      firstEditable = (ref = defaultParagraph.directives['editable']) != null ? ref[0] : void 0;
      currentBlock = view.model;
      for (index = i = 0, len = blocks.length; i < len; index = ++i) {
        block = blocks[index];
        if (index === 0) {
          continue;
        }
        newBlock = defaultParagraph.createModel();
        newBlock.set(firstEditable.name, block);
        currentBlock.after(newBlock);
        currentBlock = newBlock;
      }
      view = currentBlock.getMainView();
      if (view != null) {
        viewDirective = view.directives.get(firstEditable.name);
        cursor = this.editable.createCursorAtEnd(viewDirective.elem);
        cursor.setVisibleSelection();
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
    var copy, ref;
    if (this.hasSingleEditable(view)) {
      copy = view.template.createModel();
      copy.set(editableName, this.extractContent(after));
      view.model.after(copy);
      if ((ref = view.next()) != null) {
        ref.focus();
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



},{"../configuration/config":26,"./dom":40}],43:[function(require,module,exports){
var ContainerEvent, Focus, dom;

dom = require('./dom');

ContainerEvent = require('./container_event');

module.exports = Focus = (function() {
  function Focus() {
    this.editableNode = void 0;
    this.componentView = void 0;
    this.componentFocus = $.Callbacks();
    this.componentBlur = $.Callbacks();
    this.containerFocus = $.Callbacks();
    this.containerBlur = $.Callbacks();
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
        this.componentFocus.fire(this.componentView);
        return this.fireContainerEvent({
          view: this.componentView,
          focus: true
        });
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
      this.componentBlur.fire(previous);
      return this.fireContainerEvent({
        view: previous,
        blur: true
      });
    }
  };

  Focus.prototype.fireContainerEvent = function(arg) {
    var blur, component, event, focus, view;
    view = arg.view, focus = arg.focus, blur = arg.blur;
    event = new ContainerEvent({
      target: view,
      focus: focus,
      blur: blur
    });
    component = view.model;
    return component.parentContainers((function(_this) {
      return function(container) {
        return _this[event.type].fire(container, event);
      };
    })(this));
  };

  return Focus;

})();



},{"./container_event":39,"./dom":40}],44:[function(require,module,exports){
var ComponentTree, Dependencies, EventEmitter, FieldExtractor, InteractivePage, Livingdoc, MetadataConfig, Page, Renderer, RenderingContainer, View, assert, config, designCache, dom,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

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

FieldExtractor = require('./component_tree/field_extractor');

MetadataConfig = require('./configuration/metadata_config');

module.exports = Livingdoc = (function(superClass) {
  extend(Livingdoc, superClass);

  Livingdoc.create = function(arg) {
    var componentTree, data, design, designName, layoutName, ref;
    data = arg.data, designName = arg.designName, layoutName = arg.layoutName, componentTree = arg.componentTree;
    componentTree = data != null ? (designName = (ref = data.design) != null ? ref.name : void 0, assert(designName != null, 'Error creating livingdoc: No design is specified.'), design = designCache.get(designName), new ComponentTree({
      content: data,
      design: design
    })) : designName != null ? (design = designCache.get(designName), new ComponentTree({
      design: design
    })) : componentTree;
    if (data != null ? data.layout : void 0) {
      layoutName = data.layout;
    }
    return new Livingdoc({
      componentTree: componentTree,
      layoutName: layoutName
    });
  };

  function Livingdoc(arg) {
    this.componentTree = arg.componentTree, this.layoutName = arg.layoutName;
    this.model = this.componentTree;
    this.interactiveView = void 0;
    this.readOnlyViews = [];
    this.design = this.componentTree.design;
    this.dependencies = new Dependencies({
      componentTree: this.componentTree
    });
    this.metadataConfig = new MetadataConfig(this.design.metadata);
    this.fieldExtractor = new FieldExtractor(this.componentTree, this.metadataConfig);
    this.forwardComponentTreeEvents();
  }

  Livingdoc.prototype.getDropTarget = function(arg) {
    var clientX, clientY, coords, document, elem, event, target;
    event = arg.event;
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

  Livingdoc.prototype.createView = function(arg) {
    var host, iframe, interactive, layoutName, loadResources, view, viewWrapper, wrapper;
    host = arg.host, interactive = arg.interactive, loadResources = arg.loadResources, wrapper = arg.wrapper, layoutName = arg.layoutName, iframe = arg.iframe;
    viewWrapper = this.getWrapper({
      wrapper: wrapper,
      layoutName: layoutName,
      host: host
    });
    if (iframe == null) {
      iframe = true;
    }
    view = new View({
      livingdoc: this,
      parent: $(host),
      isInteractive: interactive,
      loadResources: loadResources,
      wrapper: viewWrapper
    });
    this.addView(view);
    return view.create({
      renderInIframe: iframe
    });
  };

  Livingdoc.prototype.appendTo = function(options) {
    if (options == null) {
      options = {};
    }
    options.iframe = false;
    return this.createView(options);
  };

  Livingdoc.prototype.createComponent = function() {
    return this.componentTree.createComponent.apply(this.componentTree, arguments);
  };

  Livingdoc.prototype.getWrapper = function(arg) {
    var host, layoutName, ref, wrapper;
    wrapper = arg.wrapper, layoutName = arg.layoutName, host = arg.host;
    if (wrapper != null) {
      return wrapper;
    }
    if (layoutName == null) {
      layoutName = this.layoutName;
    }
    wrapper = (ref = this.design.getLayout(layoutName)) != null ? ref.wrapper : void 0;
    if (wrapper == null) {
      wrapper = this.extractWrapper(host);
    }
    return wrapper;
  };

  Livingdoc.prototype.extractWrapper = function(parent) {
    var $parent, $wrapper;
    $parent = $(parent).first();
    if ($parent.find("." + config.css.section).length === 1) {
      $wrapper = $($parent.html());
    }
    $parent.html('');
    return $wrapper;
  };

  Livingdoc.prototype.addView = function(view) {
    if (view.isInteractive) {
      assert(this.interactiveView == null, 'Error creating interactive view: A Livingdoc can have only one interactive view');
      this.interactiveView = view;
      return view.whenReady.then((function(_this) {
        return function(arg) {
          var iframe, renderer;
          iframe = arg.iframe, renderer = arg.renderer;
          return _this.componentTree.setMainView(view);
        };
      })(this));
    } else {
      return this.readOnlyViews.push(view);
    }
  };

  Livingdoc.prototype.addJsDependency = function(obj) {
    return this.dependencies.addJs(obj);
  };

  Livingdoc.prototype.addCssDependency = function(obj) {
    return this.dependencies.addCss(obj);
  };

  Livingdoc.prototype.hasDependencies = function() {
    var ref, ref1;
    return ((ref = this.dependencies) != null ? ref.hasJs() : void 0) || ((ref1 = this.dependencies) != null ? ref1.hasCss() : void 0);
  };

  Livingdoc.prototype.toHtml = function(arg) {
    var excludeComponents;
    excludeComponents = (arg != null ? arg : {}).excludeComponents;
    return new Renderer({
      componentTree: this.componentTree,
      renderingContainer: new RenderingContainer(),
      excludeComponents: excludeComponents
    }).html();
  };

  Livingdoc.prototype.serialize = function() {
    var serialized;
    serialized = this.componentTree.serialize();
    serialized['layout'] = this.layoutName;
    return serialized;
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



},{"./component_tree/component_tree":19,"./component_tree/field_extractor":21,"./configuration/config":26,"./configuration/metadata_config":27,"./design/design_cache":30,"./interaction/dom":40,"./modules/logging/assert":49,"./rendering/dependencies":56,"./rendering/renderer":59,"./rendering/view":60,"./rendering_container/interactive_page":64,"./rendering_container/page":66,"./rendering_container/rendering_container":67,"wolfy87-eventemitter":11}],45:[function(require,module,exports){
var slice = [].slice;

module.exports = (function() {
  return {
    callOnce: function(callbacks, listener) {
      var selfRemovingFunc;
      selfRemovingFunc = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        callbacks.remove(selfRemovingFunc);
        return listener.apply(this, args);
      };
      callbacks.add(selfRemovingFunc);
      return selfRemovingFunc;
    }
  };
})();



},{}],46:[function(require,module,exports){
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



},{"jquery":"jquery"}],47:[function(require,module,exports){
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



},{"./feature_detects":46}],48:[function(require,module,exports){
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
      return user + "-" + nextId + idCounter;
    }
  };
})();



},{}],49:[function(require,module,exports){
var assert, log;

log = require('./log');

module.exports = assert = function(condition, message) {
  if (!condition) {
    return log.error(message);
  }
};



},{"./log":50}],50:[function(require,module,exports){
var log,
  slice = [].slice,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

module.exports = log = function() {
  var args;
  args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
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
  LivingdocsError = (function(superClass) {
    extend(LivingdocsError, superClass);

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
        var ref;
        if ((level === 'critical' || level === 'error') && (((ref = window.console) != null ? ref.error : void 0) != null)) {
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



},{}],51:[function(require,module,exports){
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
    var i, len, results, value;
    results = [];
    for (i = 0, len = this.length; i < len; i++) {
      value = this[i];
      results.push(callback(value));
    }
    return results;
  };

  OrderedHash.prototype.toArray = function() {
    var i, len, results, value;
    results = [];
    for (i = 0, len = this.length; i < len; i++) {
      value = this[i];
      results.push(value);
    }
    return results;
  };

  return OrderedHash;

})();



},{}],52:[function(require,module,exports){
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

  Semaphore.prototype.increment = function(num) {
    if (num == null) {
      num = 1;
    }
    assert(!this.wasFired, "Unable to increment count once Semaphore is fired.");
    return this.count += num;
  };

  Semaphore.prototype.decrement = function(num) {
    if (num == null) {
      num = 1;
    }
    assert(this.count > 0, "Unable to decrement count resulting in negative count.");
    this.count -= num;
    return this.fireIfReady();
  };

  Semaphore.prototype.wait = function(num) {
    this.increment(num);
    return (function(_this) {
      return function() {
        return _this.decrement(num);
      };
    })(this);
  };

  Semaphore.prototype.fireIfReady = function() {
    var callback, i, len, ref, results;
    if (this.count === 0 && this.started === true) {
      this.wasFired = true;
      ref = this.callbacks;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        callback = ref[i];
        results.push(callback());
      }
      return results;
    }
  };

  return Semaphore;

})();



},{"../modules/logging/assert":49}],53:[function(require,module,exports){
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



},{}],54:[function(require,module,exports){
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



},{"jquery":"jquery"}],55:[function(require,module,exports){
var $, ComponentView, DirectiveIterator, attr, config, css, dom, eventing;

$ = require('jquery');

config = require('../configuration/config');

css = config.css;

attr = config.attr;

DirectiveIterator = require('../template/directive_iterator');

eventing = require('../modules/eventing');

dom = require('../interaction/dom');

module.exports = ComponentView = (function() {
  function ComponentView(arg) {
    this.model = arg.model, this.$html = arg.$html, this.directives = arg.directives, this.isReadOnly = arg.isReadOnly;
    this.renderer = void 0;
    this.$elem = this.$html;
    this.template = this.model.template;
    this.isAttachedToDom = false;
    this.wasAttachedToDom = $.Callbacks();
    this.decorateMarkup();
    this.render();
  }

  ComponentView.prototype.decorateMarkup = function() {
    if (!this.isReadOnly) {
      return this.$html.data('componentView', this).addClass(css.component).attr(attr.template, this.template.identifier);
    }
  };

  ComponentView.prototype.setRenderer = function(renderer) {
    return this.renderer = renderer;
  };

  ComponentView.prototype.removeRenderer = function() {
    return this.renderer = void 0;
  };

  ComponentView.prototype.viewForModel = function(model) {
    var ref;
    if (model != null) {
      return (ref = this.renderer) != null ? ref.getComponentViewById(model.id) : void 0;
    }
  };

  ComponentView.prototype.recreateHtml = function() {
    var ref;
    this.isAttachedToDom = false;
    ref = this.model.template.createViewHtml(this.model), this.$elem = ref.$elem, this.directives = ref.directives;
    this.$html = this.$elem;
    this.decorateMarkup();
    return this.render();
  };

  ComponentView.prototype.refresh = function() {
    return this.renderer.refreshComponent(this.model);
  };

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
    var name, ref, value;
    ref = this.model.styles;
    for (name in ref) {
      value = ref[name];
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

  ComponentView.prototype.afterFocused = function() {
    this.$html.addClass(css.componentHighlight);
    return this.showOptionals();
  };

  ComponentView.prototype.afterBlurred = function() {
    this.$html.removeClass(css.componentHighlight);
    return this.hideEmptyOptionals();
  };

  ComponentView.prototype.focus = function(editableName) {
    var directive, ref;
    directive = editableName ? this.directives.get(editableName) : (ref = this.directives.editable) != null ? ref[0] : void 0;
    return $(directive != null ? directive.elem : void 0).focus();
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
    var name, ref, value;
    ref = this.model.content;
    for (name in ref) {
      value = ref[name];
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
      case 'link':
        return this.setLink(name, value);
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
      case 'link':
        return this.getLink(name);
    }
  };

  ComponentView.prototype.getEditable = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.html();
  };

  ComponentView.prototype.setEditable = function(name, value) {
    var $elem, element, elementHasFocus, ownerDocument;
    $elem = this.directives.$getElem(name);
    element = $elem[0];
    ownerDocument = element.ownerDocument;
    elementHasFocus = ownerDocument.activeElement === element;
    if (elementHasFocus) {
      return;
    }
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

  ComponentView.prototype.setLink = function(name, value) {
    var $elem;
    $elem = this.directives.$getElem(name);
    if (value) {
      return $elem.attr('href', value);
    } else {
      return $elem.removeAttr('href');
    }
  };

  ComponentView.prototype.getLink = function(name) {
    var $elem;
    $elem = this.directives.$getElem(name);
    return $elem.attr('href');
  };

  ComponentView.prototype.getDirectiveElement = function(directiveName) {
    var ref;
    return (ref = this.directives.get(directiveName)) != null ? ref.elem : void 0;
  };

  ComponentView.prototype.resetDirectives = function() {
    var $elem, name, results;
    results = [];
    for (name in this.directivesToReset) {
      $elem = this.directives.$getElem(name);
      if ($elem.find('iframe').length) {
        results.push(this.set(name, this.model.content[name]));
      } else {
        results.push(void 0);
      }
    }
    return results;
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
    var changes, i, len, ref, removeClass;
    changes = this.template.styles[name].cssClassChanges(className);
    if (changes.remove) {
      ref = changes.remove;
      for (i = 0, len = ref.length; i < len; i++) {
        removeClass = ref[i];
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
    var ref;
    if ((ref = this.delayed) != null ? ref[name] : void 0) {
      this.wasAttachedToDom.remove(this.delayed[name]);
      return this.delayed[name] = void 0;
    }
  };

  ComponentView.prototype.stripHtmlIfReadOnly = function() {
    var elem, iterator, results;
    if (!this.isReadOnly) {
      return;
    }
    iterator = new DirectiveIterator(this.$html[0]);
    results = [];
    while (elem = iterator.nextElement()) {
      this.stripDocClasses(elem);
      this.stripDocAttributes(elem);
      results.push(this.stripEmptyAttributes(elem));
    }
    return results;
  };

  ComponentView.prototype.stripDocClasses = function(elem) {
    var $elem, i, klass, len, ref, results;
    $elem = $(elem);
    ref = elem.className.split(/\s+/);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      klass = ref[i];
      if (/doc\-.*/i.test(klass)) {
        results.push($elem.removeClass(klass));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  ComponentView.prototype.stripDocAttributes = function(elem) {
    var $elem, attribute, i, len, name, ref, results;
    $elem = $(elem);
    ref = Array.prototype.slice.apply(elem.attributes);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      attribute = ref[i];
      name = attribute.name;
      if (/data\-doc\-.*/i.test(name)) {
        results.push($elem.removeAttr(name));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  ComponentView.prototype.stripEmptyAttributes = function(elem) {
    var $elem, attribute, i, isEmptyAttribute, isStrippableAttribute, len, ref, results, strippableAttributes;
    $elem = $(elem);
    strippableAttributes = ['style', 'class'];
    ref = Array.prototype.slice.apply(elem.attributes);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      attribute = ref[i];
      isStrippableAttribute = strippableAttributes.indexOf(attribute.name) >= 0;
      isEmptyAttribute = attribute.value.trim() === '';
      if (isStrippableAttribute && isEmptyAttribute) {
        results.push($elem.removeAttr(attribute.name));
      } else {
        results.push(void 0);
      }
    }
    return results;
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

  ComponentView.prototype.next = function() {
    return this.viewForModel(this.model.next);
  };

  ComponentView.prototype.prev = function() {
    return this.previous();
  };

  ComponentView.prototype.previous = function() {
    return this.viewForModel(this.model.previous);
  };

  ComponentView.prototype.parent = function() {
    return this.viewForModel(this.model.getParent());
  };

  return ComponentView;

})();

['parents', 'children', 'childrenAndSelf', 'descendants', 'descendantsAndSelf'].forEach(function(method) {
  return ComponentView.prototype[method] = function(callback) {
    return this.model[method]((function(_this) {
      return function(model) {
        return callback(_this.viewForModel(model));
      };
    })(this));
  };
});



},{"../configuration/config":26,"../interaction/dom":40,"../modules/eventing":45,"../template/directive_iterator":72,"jquery":"jquery"}],56:[function(require,module,exports){
var $, Dependencies, Dependency, assert, dependenciesToHtml, log,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require('jquery');

log = require('../modules/logging/log');

assert = require('../modules/logging/assert');

Dependency = require('./dependency');

dependenciesToHtml = require('./dependencies_to_html');

module.exports = Dependencies = (function() {
  function Dependencies(arg) {
    this.componentTree = (arg != null ? arg : {}).componentTree;
    this.onComponentRemoved = bind(this.onComponentRemoved, this);
    this.js = [];
    this.css = [];
    this.namespaces = {};
    this.jsWaitlist = [];
    this.dependenciesAdded = $.Callbacks();
    this.dependencyToExecute = $.Callbacks();
    this.codeToExecute = $.Callbacks();
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

  Dependencies.prototype.executeJs = function(obj) {
    obj.isExecuteOnly = true;
    return this.addJs(obj);
  };

  Dependencies.prototype.executeCode = function(callback) {
    return this.codeToExecute.fire(callback);
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
      return obj.src = (obj.basePath.replace(/\/$/, '')) + "/" + src;
    }
  };

  Dependencies.prototype.isAbsoluteUrl = function(src) {
    return /(^\/\/|[a-z]*:\/\/)/.test(src) || /^\//.test(src);
  };

  Dependencies.prototype.addDependency = function(dependency) {
    if (!dependency.isExecuteOnly) {
      if (dependency.namespace) {
        this.addToNamespace(dependency);
      }
      if (dependency.isJs()) {
        this.js.push(dependency);
        this.delayedDependency(dependency);
      } else {
        this.css.push(dependency);
        this.dependenciesAdded.fire(void 0, [dependency]);
      }
    } else {
      this.dependencyToExecute.fire(dependency);
    }
    return dependency;
  };

  Dependencies.prototype.delayedDependency = function(dependency) {
    this.jsWaitlist.push(dependency);
    if (this.jsWaitlist.length === 1) {
      return setTimeout((function(_this) {
        return function() {
          _this.dependenciesAdded.fire(_this.jsWaitlist, void 0);
          return _this.jsWaitlist = [];
        };
      })(this), 0);
    }
  };

  Dependencies.prototype.addToNamespace = function(dependency) {
    var base, name1, namespace;
    if (dependency.namespace) {
      if ((base = this.namespaces)[name1 = dependency.namespace] == null) {
        base[name1] = [];
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
    var array, name, ref, results;
    ref = this.namespaces;
    results = [];
    for (name in ref) {
      array = ref[name];
      results.push(name);
    }
    return results;
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
    var collection, entry, i, len;
    collection = dep.isJs() ? this.js : this.css;
    for (i = 0, len = collection.length; i < len; i++) {
      entry = collection[i];
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
    var dependency, i, j, k, len, len1, len2, needed, ref, ref1, results, toBeRemoved;
    toBeRemoved = [];
    ref = this.js;
    for (i = 0, len = ref.length; i < len; i++) {
      dependency = ref[i];
      needed = dependency.removeComponent(component);
      if (!needed) {
        toBeRemoved.push(dependency);
      }
    }
    ref1 = this.css;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      dependency = ref1[j];
      needed = dependency.removeComponent(component);
      if (!needed) {
        toBeRemoved.push(dependency);
      }
    }
    results = [];
    for (k = 0, len2 = toBeRemoved.length; k < len2; k++) {
      dependency = toBeRemoved[k];
      results.push(this.removeDependency(dependency));
    }
    return results;
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
    var data, dependency, i, j, len, len1, ref, ref1;
    data = {};
    ref = this.js;
    for (i = 0, len = ref.length; i < len; i++) {
      dependency = ref[i];
      if (data['js'] == null) {
        data['js'] = [];
      }
      data['js'].push(dependency.serialize());
    }
    ref1 = this.css;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      dependency = ref1[j];
      if (data['css'] == null) {
        data['css'] = [];
      }
      data['css'].push(dependency.serialize());
    }
    return data;
  };

  Dependencies.prototype.deserialize = function(data) {
    var entry, i, j, len, len1, obj, ref, ref1, results;
    if (data == null) {
      return;
    }
    ref = data.js || [];
    for (i = 0, len = ref.length; i < len; i++) {
      entry = ref[i];
      obj = {
        type: 'js',
        src: entry.src,
        code: entry.code,
        namespace: entry.namespace,
        library: entry.library
      };
      this.addDeserialzedObj(obj, entry);
    }
    ref1 = data.css || [];
    results = [];
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      entry = ref1[j];
      obj = {
        type: 'css',
        src: entry.src,
        code: entry.code,
        namespace: entry.namespace,
        library: entry.library
      };
      results.push(this.addDeserialzedObj(obj, entry));
    }
    return results;
  };

  Dependencies.prototype.addDeserialzedObj = function(obj, entry) {
    var component, components, dependency, i, id, j, len, len1, ref, ref1, results;
    if ((ref = entry.componentIds) != null ? ref.length : void 0) {
      components = [];
      ref1 = entry.componentIds;
      for (i = 0, len = ref1.length; i < len; i++) {
        id = ref1[i];
        component = this.componentTree.findById(id);
        if (component != null) {
          components.push(component);
        }
      }
      if (components.length) {
        dependency = this.add(obj);
        results = [];
        for (j = 0, len1 = components.length; j < len1; j++) {
          component = components[j];
          results.push(dependency.addComponent(component));
        }
        return results;
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



},{"../modules/logging/assert":49,"../modules/logging/log":50,"./dependencies_to_html":57,"./dependency":58,"jquery":"jquery"}],57:[function(require,module,exports){
var CssLoader, JsLoader;

JsLoader = require('../rendering_container/js_loader');

CssLoader = require('../rendering_container/css_loader');

module.exports = {
  printJs: function(dependencies) {
    var dependency, html, i, len, ref;
    html = '';
    ref = dependencies.js;
    for (i = 0, len = ref.length; i < len; i++) {
      dependency = ref[i];
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
    var dependency, html, i, len, ref;
    html = '';
    ref = dependencies.css;
    for (i = 0, len = ref.length; i < len; i++) {
      dependency = ref[i];
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
  printScriptTag: function(arg) {
    var src;
    src = arg.src;
    return "<script src=\"" + src + "\"></script>";
  },
  printInlineScript: function(arg) {
    var codeBlock;
    codeBlock = arg.codeBlock;
    codeBlock = JsLoader.prototype.prepareInlineCode(codeBlock);
    return "<script> " + codeBlock + " </script>";
  },
  printCssLink: function(arg) {
    var head, src;
    src = arg.src, head = arg.head;
    if (head == null) {
      head = true;
    }
    if (head) {
      return "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + src + "\">";
    } else {
      return "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + src + "\">";
    }
  },
  printInlineCss: function(arg) {
    var styles;
    styles = arg.styles;
    styles = CssLoader.prototype.prepareInlineStyles(styles);
    return "<style> " + styles + " </style>";
  },
  printComment: function(text) {
    return "<!-- " + text + " -->";
  }
};



},{"../rendering_container/css_loader":62,"../rendering_container/js_loader":65}],58:[function(require,module,exports){
var Dependency, assert;

assert = require('../modules/logging/assert');

module.exports = Dependency = (function() {
  function Dependency(arg) {
    var component, ref;
    this.type = arg.type, this.src = arg.src, this.code = arg.code, this.namespace = arg.namespace, this.library = arg.library, this.isExecuteOnly = arg.isExecuteOnly, component = arg.component;
    assert(this.src || this.code, 'Dependency: No "src" or "code" param provided');
    assert(!(this.src && this.code), 'Dependency: Only provide one of "src" or "code" params');
    assert(this.type, "Dependency: Param type must be specified");
    assert((ref = this.type) === 'js' || ref === 'css', "Dependency: Unrecognized type: " + this.type);
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
    var componentId, i, key, len, obj, ref;
    assert(!this.isExecuteOnly, 'engine//dependency.coffee: Cannot serialize a temporary dependency');
    obj = {};
    ref = ['src', 'code', 'inline', 'library', 'namespace'];
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
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



},{"../modules/logging/assert":49}],59:[function(require,module,exports){
var $, Renderer, Semaphore, assert, config, log;

$ = require('jquery');

assert = require('../modules/logging/assert');

log = require('../modules/logging/log');

Semaphore = require('../modules/semaphore');

config = require('../configuration/config');

module.exports = Renderer = (function() {
  function Renderer(arg) {
    var $wrapper, excludeComponents;
    this.componentTree = arg.componentTree, this.renderingContainer = arg.renderingContainer, $wrapper = arg.$wrapper, excludeComponents = arg.excludeComponents;
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
    var compId, i, len, results, view;
    if (componentId == null) {
      return;
    }
    if ($.isArray(componentId)) {
      results = [];
      for (i = 0, len = componentId.length; i < len; i++) {
        compId = componentId[i];
        results.push(this.excludeComponent(compId));
      }
      return results;
    } else {
      this.excludedComponentIds[componentId] = true;
      view = this.componentViews[componentId];
      if ((view != null) && view.isAttachedToDom) {
        return this.removeComponentFromDom(view.model);
      }
    }
  };

  Renderer.prototype.setRoot = function() {
    var $insert, ref, selector;
    if (((ref = this.$wrapperHtml) != null ? ref.length : void 0) && this.$wrapperHtml.jquery) {
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

  Renderer.prototype.componentRemoved = function(component) {
    return component.descendantsAndSelf((function(_this) {
      return function(model) {
        _this.removeComponentFromDom(model);
        return _this.deleteCachedComponentView(model);
      };
    })(this));
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
    var view;
    if (view = this.componentViews[model.id]) {
      return view;
    }
    view = model.createView(this.renderingContainer.isReadOnly);
    view.setRenderer(this);
    return this.componentViews[model.id] = view;
  };

  Renderer.prototype.deleteCachedComponentView = function(model) {
    var ref;
    if ((ref = this.componentViews[model.id]) != null) {
      ref.removeRenderer();
    }
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

  Renderer.prototype.refreshComponent = function(component) {
    var view;
    view = this.getComponentViewById(component.id);
    view.descendantsAndSelf((function(_this) {
      return function(view) {
        _this.removeComponentFromDom(view.model);
        return view.recreateHtml();
      };
    })(this));
    this.insertComponent(component);
    return this.renderingContainer.componentViewWasRefreshed.fire(view);
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
    var ref;
    return model && ((ref = this.getComponentViewById(model.id)) != null ? ref.isAttachedToDom : void 0);
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



},{"../configuration/config":26,"../modules/logging/assert":49,"../modules/logging/log":50,"../modules/semaphore":52,"jquery":"jquery"}],60:[function(require,module,exports){
var InteractivePage, Page, Renderer, View;

Renderer = require('./renderer');

Page = require('../rendering_container/page');

InteractivePage = require('../rendering_container/interactive_page');

module.exports = View = (function() {
  function View(arg) {
    var parent;
    this.livingdoc = arg.livingdoc, parent = arg.parent, this.isInteractive = arg.isInteractive, this.wrapper = arg.wrapper, this.loadResources = arg.loadResources;
    this.parent = (parent != null ? parent.jquery : void 0) ? parent[0] : parent;
    if (this.parent == null) {
      this.parent = window.document.body;
    }
    if (this.isInteractive == null) {
      this.isInteractive = false;
    }
    this.isReady = false;
    this.whenReadyDeferred = $.Deferred();
    this.whenReady = this.whenReadyDeferred.promise();
  }

  View.prototype.create = function(arg) {
    var renderInIframe;
    renderInIframe = (arg != null ? arg : {}).renderInIframe;
    if (renderInIframe) {
      this.createIFrame(this.parent, (function(_this) {
        return function() {
          _this.addBaseTarget();
          _this.createIFrameRenderer();
          _this.isReady = true;
          return _this.whenReadyDeferred.resolve({
            iframe: _this.iframe,
            renderer: _this.renderer
          });
        };
      })(this));
    } else {
      this.createRenderer({
        renderNode: this.parent
      });
      this.isReady = true;
      this.whenReadyDeferred.resolve({
        renderer: this.renderer
      });
    }
    return this.whenReady;
  };

  View.prototype.addBaseTarget = function() {
    var base, doc;
    doc = this.iframe.contentDocument;
    base = doc.createElement('base');
    base.setAttribute('target', '_blank');
    return doc.getElementsByTagName('head')[0].appendChild(base);
  };

  View.prototype.createIFrame = function(parent, callback) {
    var iframe;
    iframe = parent.ownerDocument.createElement('iframe');
    iframe.src = 'about:blank';
    iframe.setAttribute('frameBorder', '0');
    this.iframe = iframe;
    iframe.onload = function() {
      return callback(iframe);
    };
    return parent.appendChild(iframe);
  };

  View.prototype.createIFrameRenderer = function() {
    return this.createRenderer({
      renderNode: this.iframe.contentDocument.body
    });
  };

  View.prototype.createRenderer = function(arg) {
    var params, renderNode;
    renderNode = (arg != null ? arg : {}).renderNode;
    params = {
      renderNode: renderNode || this.parent,
      documentDependencies: this.livingdoc.dependencies,
      design: this.livingdoc.design,
      loadResources: this.loadResources
    };
    this.page = this.isInteractive ? new InteractivePage(params) : new Page(params);
    return this.renderer = new Renderer({
      renderingContainer: this.page,
      componentTree: this.livingdoc.componentTree,
      $wrapper: $(this.wrapper)
    });
  };

  return View;

})();



},{"../rendering_container/interactive_page":64,"../rendering_container/page":66,"./renderer":59}],61:[function(require,module,exports){
var $, Assets, CssLoader, JsLoader, Semaphore;

$ = require('jquery');

JsLoader = require('./js_loader');

CssLoader = require('./css_loader');

Semaphore = require('../modules/semaphore');

module.exports = Assets = (function() {
  function Assets(arg) {
    var disable;
    this.window = arg.window, disable = arg.disable;
    this.isDisabled = disable || false;
    this.cssLoader = new CssLoader(this.window);
    this.jsLoader = new JsLoader(this.window);
  }

  Assets.prototype.loadDependencies = function(jsDependencies, cssDependencies, callback) {
    var dep, i, len, ref, semaphore;
    semaphore = new Semaphore();
    semaphore.addCallback(callback);
    this.loadSequentially(jsDependencies, semaphore);
    ref = cssDependencies || [];
    for (i = 0, len = ref.length; i < len; i++) {
      dep = ref[i];
      this.loadCss(dep, semaphore.wait());
    }
    return semaphore.start();
  };

  Assets.prototype.loadSequentially = function(jsDependencies, semaphore) {
    var current, next;
    if (jsDependencies != null ? jsDependencies.length : void 0) {
      semaphore.increment(jsDependencies.length);
      current = 0;
      next = (function(_this) {
        return function() {
          return _this.loadJs(jsDependencies[current], function() {
            semaphore.decrement();
            current += 1;
            if (current < jsDependencies.length) {
              return next();
            }
          });
        };
      })(this);
      return next();
    }
  };

  Assets.prototype.loadDependency = function(dependency, callback) {
    if (dependency.isJs()) {
      return this.loadJs(dependency, callback);
    } else if (dependency.isCss()) {
      return this.loadCss(dependency, callback);
    }
  };

  Assets.prototype.loadJs = function(dependency, callback) {
    var preventRepeatedExecution;
    if (this.isDisabled) {
      return callback();
    }
    if (dependency.inline) {
      preventRepeatedExecution = !dependency.isExecuteOnly;
      return this.jsLoader.loadInlineScript(dependency.code, preventRepeatedExecution, callback);
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



},{"../modules/semaphore":52,"./css_loader":62,"./js_loader":65,"jquery":"jquery"}],62:[function(require,module,exports){
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



},{"jquery":"jquery"}],63:[function(require,module,exports){
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

  EditorPage.prototype.startDrag = function(arg) {
    var componentDrag, componentModel, componentView, config, event;
    componentModel = arg.componentModel, componentView = arg.componentView, event = arg.event, config = arg.config;
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



},{"../configuration/config":26,"../interaction/component_drag":38,"../interaction/drag_base":41}],64:[function(require,module,exports){
var ComponentDrag, DragBase, EditableController, Focus, InteractivePage, Page, config, dom,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

config = require('../configuration/config');

Page = require('./page');

dom = require('../interaction/dom');

Focus = require('../interaction/focus');

EditableController = require('../interaction/editable_controller');

DragBase = require('../interaction/drag_base');

ComponentDrag = require('../interaction/component_drag');

module.exports = InteractivePage = (function(superClass) {
  var LEFT_MOUSE_BUTTON;

  extend(InteractivePage, superClass);

  LEFT_MOUSE_BUTTON = 1;

  InteractivePage.prototype.isReadOnly = false;

  function InteractivePage(arg) {
    var hostWindow, ref, renderNode;
    ref = arg != null ? arg : {}, renderNode = ref.renderNode, hostWindow = ref.hostWindow;
    InteractivePage.__super__.constructor.apply(this, arguments);
    this.focus = new Focus();
    this.editableController = new EditableController(this);
    this.imageClick = $.Callbacks();
    this.htmlElementClick = $.Callbacks();
    this.linkClick = $.Callbacks();
    this.componentWillBeDragged = $.Callbacks();
    this.componentWasDropped = $.Callbacks();
    this.dragBase = new DragBase(this);
    this.focus.componentFocus.add($.proxy(this.afterComponentFocused, this));
    this.focus.componentBlur.add($.proxy(this.afterComponentBlurred, this));
    this.beforeInteractivePageReady();
    this.$document.on('mousedown.livingdocs', $.proxy(this.mousedown, this)).on('click.livingdocs', $.proxy(this.click, this)).on('touchstart.livingdocs', $.proxy(this.mousedown, this)).on('dragstart.livingdocs', $.proxy(this.browserDragStart, this));
  }

  InteractivePage.prototype.beforeInteractivePageReady = function() {
    if (config.livingdocsCssFile && this.loadResources) {
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

  InteractivePage.prototype.click = function(event) {
    var target;
    target = event.target;
    if (dom.isInsideDocLink(target)) {
      return event.preventDefault();
    }
  };

  InteractivePage.prototype.startDrag = function(arg) {
    var componentDrag, componentModel, componentView, config, event;
    componentModel = arg.componentModel, componentView = arg.componentView, event = arg.event, config = arg.config;
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
    var directives;
    if (componentView) {
      this.focus.componentFocused(componentView);
      directives = dom.getDirectiveContext(event.target);
      if (directives != null) {
        if (directives['image']) {
          return this.imageClick.fire(componentView, directives['image'].name, event);
        } else if (directives['link']) {
          return this.linkClick.fire(componentView, directives['link'].name, event);
        } else if (directives['html']) {
          return this.htmlElementClick.fire(componentView, directives['html'].name, event);
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
        var i, len, ref, results;
        ref = componentView.directives.editable;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          directive = ref[i];
          results.push(directive.elem);
        }
        return results;
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



},{"../configuration/config":26,"../interaction/component_drag":38,"../interaction/dom":40,"../interaction/drag_base":41,"../interaction/editable_controller":42,"../interaction/focus":43,"./page":66}],65:[function(require,module,exports){
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

  JsLoader.prototype.loadInlineScript = function(codeBlock, preventRepeatedExecution, callback) {
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
    if (preventRepeatedExecution) {
      this.loadedScripts.push(codeBlock);
    }
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



},{}],66:[function(require,module,exports){
var $, Assets, Page, RenderingContainer, config,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

$ = require('jquery');

RenderingContainer = require('./rendering_container');

Assets = require('./assets');

config = require('../configuration/config');

module.exports = Page = (function(superClass) {
  extend(Page, superClass);

  function Page(arg) {
    var hostWindow, preventAssetLoading, readOnly, ref, renderNode;
    ref = arg != null ? arg : {}, renderNode = ref.renderNode, readOnly = ref.readOnly, hostWindow = ref.hostWindow, this.documentDependencies = ref.documentDependencies, this.design = ref.design, this.componentTree = ref.componentTree, this.loadResources = ref.loadResources;
    this.loadAssets = bind(this.loadAssets, this);
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
    this.componentViewWasRefreshed = $.Callbacks();
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
    var deps;
    if (this.design != null) {
      deps = this.design.dependencies;
      this.assets.loadDependencies(deps.js, deps.css, this.readySemaphore.wait());
    }
    if (this.documentDependencies != null) {
      deps = this.documentDependencies;
      this.assets.loadDependencies(deps.js, deps.css, this.readySemaphore.wait());
      this.documentDependencies.dependenciesAdded.add((function(_this) {
        return function(jsDependencies, cssDependencies) {
          return _this.assets.loadDependencies(jsDependencies, cssDependencies, function() {});
        };
      })(this));
      this.documentDependencies.dependencyToExecute.add((function(_this) {
        return function(dependency) {
          return _this.assets.loadDependency(dependency);
        };
      })(this));
      return this.documentDependencies.codeToExecute.add((function(_this) {
        return function(callback) {
          return callback(_this.window);
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



},{"../configuration/config":26,"./assets":61,"./rendering_container":67,"jquery":"jquery"}],67:[function(require,module,exports){
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



},{"../modules/semaphore":52,"jquery":"jquery"}],68:[function(require,module,exports){
var $, Directive, assert, dom, editorConfig;

$ = require('jquery');

editorConfig = require('../configuration/config');

dom = require('../interaction/dom');

assert = require('../modules/logging/assert');

module.exports = Directive = (function() {
  function Directive(arg) {
    var config;
    this.name = arg.name, this.type = arg.type, this.elem = arg.elem, config = arg.config;
    if (this.type !== 'optional') {
      assert(this.name, "TemplateDirective: name is missing from " + this.type + " directive");
    }
    this.config = Object.create(editorConfig.directives[this.type]);
    this.setConfig(config);
    this.optional = false;
  }

  Directive.prototype.setConfig = function(config) {
    return $.extend(this.config, config);
  };

  Directive.prototype.renderedAttr = function() {
    return this.config.renderedAttr;
  };

  Directive.prototype.overwritesContent = function() {
    return !!this.config.overwritesContent;
  };

  Directive.prototype.isModification = function() {
    return this.config.modifies != null;
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



},{"../configuration/config":26,"../interaction/dom":40,"../modules/logging/assert":49,"jquery":"jquery"}],69:[function(require,module,exports){
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
    var name1;
    this.assertNameNotUsed(directive);
    this[this.length] = directive;
    directive.index = this.length;
    this.length += 1;
    this.all[directive.name] = directive;
    this[name1 = directive.type] || (this[name1] = []);
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
    var ref;
    if (type) {
      return (ref = this[type]) != null ? ref.length : void 0;
    } else {
      return this.length;
    }
  };

  DirectiveCollection.prototype.names = function(type) {
    var directive, i, len, ref, ref1, results;
    if (!((ref = this[type]) != null ? ref.length : void 0)) {
      return [];
    }
    ref1 = this[type];
    results = [];
    for (i = 0, len = ref1.length; i < len; i++) {
      directive = ref1[i];
      results.push(directive.name);
    }
    return results;
  };

  DirectiveCollection.prototype.each = function(callback) {
    var directive, i, len, results;
    results = [];
    for (i = 0, len = this.length; i < len; i++) {
      directive = this[i];
      results.push(callback(directive));
    }
    return results;
  };

  DirectiveCollection.prototype.eachOfType = function(type, callback) {
    var directive, i, len, ref, results;
    if (this[type]) {
      ref = this[type];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        directive = ref[i];
        results.push(callback(directive));
      }
      return results;
    }
  };

  DirectiveCollection.prototype.firstOfType = function(type) {
    var ref;
    return (ref = this[type]) != null ? ref[0] : void 0;
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
    return assert(directive && !this.all[directive.name], directive.type + " Template parsing error:\n" + config.directives[directive.type].renderedAttr + "=\"" + directive.name + "\".\n\"" + directive.name + "\" is a duplicate name.");
  };

  return DirectiveCollection;

})();



},{"../configuration/config":26,"../modules/logging/assert":49,"./directive":68,"jquery":"jquery"}],70:[function(require,module,exports){
var Directive, _, assert, config, directiveFinder;

config = require('../configuration/config');

Directive = require('./directive');

directiveFinder = require('./directive_finder');

assert = require('../modules/logging/assert');

_ = require('underscore');

module.exports = (function() {
  return {
    parse: function(elem) {
      var directives, modifications, overwritesContent;
      directives = [];
      modifications = [];
      overwritesContent = false;
      this.eachDirective(elem, function(directive) {
        if (directive.isModification()) {
          return modifications.push(directive);
        } else {
          if (directive.overwritesContent()) {
            assert(!overwritesContent, "Incompatible directives declared on element (" + directive.type + " directive '" + directive.name + "')");
            overwritesContent = true;
          }
          return directives.push(directive);
        }
      });
      if (directives.length) {
        this.applyModifications(directives, modifications);
      }
      return directives;
    },
    eachDirective: function(elem, func) {
      var data, directive, directiveData, i, len, results;
      directiveData = [];
      directiveFinder.eachDirective(elem, (function(_this) {
        return function(type, name, attributeName) {
          return directiveData.push({
            attributeName: attributeName,
            directive: new Directive({
              name: name,
              type: type,
              elem: elem
            })
          });
        };
      })(this));
      results = [];
      for (i = 0, len = directiveData.length; i < len; i++) {
        data = directiveData[i];
        directive = data.directive;
        this.rewriteAttribute(directive, data.attributeName);
        results.push(func(directive));
      }
      return results;
    },
    applyModifications: function(directives, modifications) {
      var directive, i, len, modification, results;
      results = [];
      for (i = 0, len = modifications.length; i < len; i++) {
        modification = modifications[i];
        if (modification.type === 'optional') {
          results.push((function() {
            var j, len1, results1;
            results1 = [];
            for (j = 0, len1 = directives.length; j < len1; j++) {
              directive = directives[j];
              if (_.contains(modification.config.modifies, directive.type)) {
                results1.push(directive.optional = true);
              } else {
                results1.push(void 0);
              }
            }
            return results1;
          })());
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    rewriteAttribute: function(directive, attributeName) {
      if (directive.isModification()) {
        return this.removeAttribute(directive, attributeName);
      } else {
        if (attributeName !== directive.renderedAttr()) {
          return this.normalizeAttribute(directive, attributeName);
        } else if (!directive.name) {
          return this.normalizeAttribute(directive);
        }
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



},{"../configuration/config":26,"../modules/logging/assert":49,"./directive":68,"./directive_finder":71,"underscore":10}],71:[function(require,module,exports){
var config, directiveFinder;

config = require('../configuration/config');

module.exports = directiveFinder = (function() {
  var prefixes;
  prefixes = /^(x-|data-)/;
  return {
    link: function(elem, directiveCollection) {
      return this.eachDirective(elem, function(type, name) {
        var directive;
        directive = directiveCollection.get(name);
        return directive.elem = elem;
      });
    },
    eachDirective: function(elem, callback) {
      var attr, attrName, i, len, normalizedName, ref, type;
      ref = elem.attributes;
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        attrName = attr.name;
        normalizedName = attrName.replace(prefixes, '');
        if (type = config.templateAttrLookup[normalizedName]) {
          callback(type, attr.value, attrName);
        }
      }
      return void 0;
    }
  };
})();



},{"../configuration/config":26}],72:[function(require,module,exports){
var DirectiveIterator, config, directiveFinder;

config = require('../configuration/config');

directiveFinder = require('./directive_finder');

module.exports = DirectiveIterator = (function() {
  function DirectiveIterator(root) {
    this.root = this._next = root;
  }

  DirectiveIterator.prototype.current = null;

  DirectiveIterator.prototype.next = function() {
    var child, n, next;
    n = this.current = this._next;
    child = next = void 0;
    if (this.current) {
      child = n.firstChild;
      if (child && n.nodeType === 1 && !this.skipChildren(n)) {
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

  DirectiveIterator.prototype.skipChildren = function(elem) {
    var skipChildren;
    skipChildren = false;
    directiveFinder.eachDirective(elem, function(type, name) {
      if (config.directives[type].overwritesContent) {
        return skipChildren = true;
      }
    });
    return skipChildren;
  };

  DirectiveIterator.prototype.nextElement = function() {
    var skipChildren;
    while (this.next()) {
      skipChildren = false;
      if (this.current.nodeType === 1) {
        break;
      }
    }
    return this.current;
  };

  DirectiveIterator.prototype.detach = function() {
    return this.current = this.root = null;
  };

  return DirectiveIterator;

})();



},{"../configuration/config":26,"./directive_finder":71}],73:[function(require,module,exports){
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
  function Template(arg) {
    var html, label, properties, ref;
    ref = arg != null ? arg : {}, this.name = ref.name, html = ref.html, label = ref.label, properties = ref.properties, this.allowedParents = ref.allowedParents;
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
    return this.identifier = design.name + "." + this.name;
  };

  Template.prototype.createModel = function() {
    return new ComponentModel({
      template: this
    });
  };

  Template.prototype.createView = function(componentModel, isReadOnly) {
    var $elem, componentView, directives, ref;
    ref = this.createViewHtml(), $elem = ref.$elem, directives = ref.directives;
    componentModel || (componentModel = this.createModel());
    return componentView = new ComponentView({
      model: componentModel,
      $html: $elem,
      directives: directives,
      isReadOnly: isReadOnly
    });
  };

  Template.prototype.createViewHtml = function() {
    var $elem, directives;
    $elem = this.$template.clone();
    directives = this.linkDirectives($elem[0]);
    return {
      $elem: $elem,
      directives: directives
    };
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
    var directive, directives, foundDirectives, i, iterator, len;
    iterator = new DirectiveIterator(elem);
    directives = new DirectiveCollection();
    while (elem = iterator.nextElement()) {
      foundDirectives = directiveCompiler.parse(elem);
      for (i = 0, len = foundDirectives.length; i < len; i++) {
        directive = foundDirectives[i];
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
    var doc, name, ref, ref1, style;
    doc = {
      name: this.name,
      design: (ref = this.design) != null ? ref.name : void 0,
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
    ref1 = this.styles;
    for (name in ref1) {
      style = ref1[name];
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



},{"../component_tree/component_model":17,"../configuration/config":26,"../modules/logging/assert":49,"../modules/logging/log":50,"../modules/words":54,"../rendering/component_view":55,"./directive_collection":69,"./directive_compiler":70,"./directive_finder":71,"./directive_iterator":72,"jquery":"jquery"}],74:[function(require,module,exports){
module.exports={
  "version": "0.10.3",
  "revision": "edf9c71"
}

},{}],"jquery":[function(require,module,exports){
module.exports = $;



},{}]},{},[12]);
