# Function to assert a condition. If the condition is not met, an error is
# raised with the specified message.
#
# @example
#
#   assert a isnt b, 'a can not be b'
#
assert = (condition, message) ->
  log.error(message) unless condition
