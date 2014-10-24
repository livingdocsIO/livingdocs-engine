# Extend Validator interface
# A: return an instance of ValidationErrors
# B: return truthy or falsy (we can check for true explicitly to speed up the default case)
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
