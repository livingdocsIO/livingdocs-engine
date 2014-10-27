# Extend Validator interface
#
# Example Validator Method:
# -------------------------
# @param { object } Value to validate. Can be an object or a primitive data type.
# @returns { true, false, String or ValidationErrors instance }
#   - true: valid
#   - false: invalid with standard error message
#   - String: invalid with one single custom error message
#   - ValidationErrors: invalid with multiple complete error messages
#
# (value) ->
#   return true if value == 'valid'
#
module.exports =
  'object': (value) -> $.type(value) == 'object'
  'string': (value) -> $.type(value) == 'string'
  'boolean': (value) -> $.type(value) == 'boolean'
  'number': (value) -> $.type(value) == 'number'
  'function': (value) -> $.type(value) == 'function'
  'date': (value) -> $.type(value) == 'date'
  'regexp': (value) -> $.type(value) == 'regexp'
  'array': (value) -> $.type(value) == 'array'
  'falsy': (value) -> !!value == false
  'truthy': (value) -> !!value == true
  'not empty': (value) -> !!value == true
  'deprecated': (value) -> true


# suggestions:
# accompanied by address -> makes address optional unless this field is specified
# depends on address -> same as above
# value(true) -> true if value is boolean true
# value('address') -> true if value is string 'address'
# value([0, 1]) -> true if value is an array with the specified values

