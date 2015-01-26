config = require('../configuration/config')
jScheme = require('jscheme')
Version = require('./version')
module.exports = validator = jScheme.new()

# Custom Validators
# -----------------

validator.add 'styleType', (value) ->
  value == 'option' or value == 'select'


validator.add 'semVer', (value) ->
  Version.semVer.test(value)


validator.add 'wrapper', (value) ->
  regexp = ///
    <.*\u0020 # start of tag
    (?:[^>]*\u0020|) # optionally followed by other attributes
    class=("|')doc-section\1 # class="doc-section"
    (?:\u0020[^>]*|) # optionally followed by other attributes
    > # end of tag
  ///
  if not regexp.test(value)
    "design.wrapper is missing a 'doc-section' class ('#{ value}')."
  else
    true


# cssClassModificator properties need one 'Default' option
# with an undefined value. Otherwise users cannot reset the
# style via the dropdown in the UI.
validator.add 'one empty option', (value) ->
  emptyCount = 0
  for entry in value
    emptyCount += 1 if not entry.value

  emptyCount == 1


# Schemas
# -------

validator.add 'design',
  name: 'string'
  version: 'string, semVer'
  author: 'string, optional'
  description: 'string, optional'
  assetsBasePath: 'string, optional'
  assets:
    __validate: 'optional'
    css: 'array of string'
    js: 'array of string, optional'
  components: 'array of component'
  componentProperties:
    __validate: 'optional'
    __additionalProperty: (key, value) -> validator.validate('componentProperty', value)
  groups: 'array of group, optional'
  defaultComponents:
    __validate: 'optional'
    paragraph: 'string, optional'
    image: 'string, optional'
  imageRatios:
    __validate: 'optional'
    __additionalProperty: (key, value) -> validator.validate('imageRatio', value)
  metadata: 'array of object, optional'
  wrapper: 'string, wrapper, optional'
  defaultContent: 'array of object, optional'
  prefilledComponents: 'object, optional'


validator.add 'component',
  name: 'string'
  label: 'string, optional'
  html: 'string'
  directives: 'object, optional'
  properties: 'array of string, optional'
  __additionalProperty: (key, value) -> false


validator.add 'group',
  label: 'string'
  components: 'array of string'


# todo: rename type and use type to identify the componentProperty type like cssClass
validator.add 'componentProperty',
  label: 'string, optional'
  type: 'string, styleType'
  value: 'string, optional'
  options: 'array of styleOption, one empty option, optional'


validator.add 'imageRatio',
  label: 'string, optional'
  ratio: 'string'


validator.add 'styleOption',
  caption: 'string'
  value: 'string, optional'

