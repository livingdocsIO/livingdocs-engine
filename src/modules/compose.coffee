# Componese utility
# -------------
# Allow classes to be combinded into one.
# This makes it possible to split up a class into multiple files or
# reuse parts of classes in other classes.
#
# Usage:
# `Hero = compose(Flying, SuperAngry, Indestructible)`
module.exports = (constructorFunctions...) ->

  # Call all constructors
  Composite = ->
    for constructor in constructorFunctions
      constructor.apply(this, arguments)

    undefined


  # add all objects of the constructorFunctions to the prototype of Composite
  for constructor in constructorFunctions by -1 #earlier mixins override later ones
    for name, method of constructor::
      Composite::[name] = method

  Composite
