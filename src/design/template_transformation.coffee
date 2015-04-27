

# Caution:
# --------
#
# Experimental class. Not yet used (or working for that matter).
# The idea would be to have an instance for every possible pairing
# of two templates instead of calculating these pairings fresh every
# time someone calls transforms.getTransformations()


module.exports = class TemplateTransforms

  # editable
  # A 1, B 1
  # A 2, B 2 : one needs to be named equally
  # A 3, B 2 : one needs to be empty in A and one of the remaining needs to have the same name
  constructor: (@a, @b) ->
    fromAtoB = {}
    fromBtoA = {}

  # consider:
  # eachType: ->
  # 1. only one -> ok
  # todo...
  #
  # mapping options
  # - undefined -> 'impossible' no other directives of the same type
  # - 'name'
  # - 'choice' has more than one choices in the other directive: ['name-x', 'name-xx']
  # - contested: more than one directive need the same field -> target field is of mapping type 'choice' or one-toMany
  # -> algorithm could do a reverse look-up. If I want to transform from A to B it could look up if the mappings of B fit.
  getMappings: ->
    for directive in @a.directives
      { name, type } = directive
      if @b.directives.get(name)?.type == type
        fromAtoB[name] = name
        fromBtoA[name] = name
      else
        fromAtoB[name] = null


    for aName, bName of fromAtoB
      continue unless bName == null
      { name, type } = @a.directives.get(aName)

      for bDirective in @b.directives[type]
        continue if fromBtoA[bDirective.name]?
        if candidateName == undefined
          candidateName = bDirective.name
        else
          candidateName = null

      if candidateName?
        fromAtoB[aName] = candidateName
        fromBtoA[candidateName] = aName

