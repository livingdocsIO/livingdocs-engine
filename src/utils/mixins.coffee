# Mixin utility
# -------------
# Allow classes to extend from multiple mixins via `extends`.
# Currently this is a simplified version of the [mixin pattern](http://coffeescriptcookbook.com/chapters/classes_and_objects/mixins)
#
# __Usage:__
# `class Superhero extends mixins Flying, SuperAngry, Indestructible`

mixins = (mixins...) ->

  # create an empty function
  Mixed = ->

  # add all objects of the mixins to the prototype of Mixed
  for mixin in mixins by -1 #earlier mixins override later ones
    for name, method of mixin
      Mixed::[name] = method

  Mixed
