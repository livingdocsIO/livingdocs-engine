test =

  # wrapper for `'prop' in object`
  # since this does not exist in coffeescript.
  # You can use this function to check for properties in the prototype chain.
  hasProperty: (obj, expectedProperty) ->
    `expectedProperty in obj`
