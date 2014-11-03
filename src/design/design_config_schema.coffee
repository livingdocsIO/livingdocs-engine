Scheme = require('../modules/object_schema/scheme')
module.exports = validator = new Scheme()

# Custom Validators
# -----------------

validator.add 'styleType', (value) ->
  value == 'option' or value == 'select'


validator.add 'semVer', (value) ->
  /\d\.\d\.\d/.test(value)

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
  design:
    name: 'string'
    version: 'string, semVer'
    author: 'string, optional'
    description: 'string, optional'
  assets:
    __validate: 'optional'
    css: 'array of string'
    js: 'array of string, optional'
  components: 'array of component'
  componentProperties:
    __validate: 'optional'
    __additionalProperty: (key, value) -> validator.validate('componentProperty', value)
  groups: 'array, optional'
  defaultComponents:
    __validate: 'optional'
    paragraph: 'string, optional'
    image: 'string, optional'


validator.add 'component',
  id: 'string'
  title: 'string, optional'
  html: 'string'
  properties: 'array of string, optional'


# todo: rename type and use type to identify the componentProperty type like cssClass
validator.add 'componentProperty',
  name: 'string'
  type: 'string, styleType'
  value: 'string, optional'
  options: 'array of styleOption, one empty option, optional'


validator.add 'styleOption',
  caption: 'string'
  value: 'string, optional'

