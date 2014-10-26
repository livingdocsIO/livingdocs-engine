Scheme = require('../modules/object_schema/scheme')
validator = new Scheme()

# Custom Validators
# -----------------

validator.add 'styleType', (value) ->
  value == 'option' or value == 'select'


validator.add 'semVer', (value) ->
  /\d\.\d\.\d/.test(value)


# Schemas
# -------

validator.add 'designConfig',
  design:
    name: 'string'
    version: 'string, semVer'
    author: 'string, optional'
    description: 'string, optional'
  assets:
    css: 'array of string'
  components: 'array of component'
  componentProperties:
    __validate: 'optional'
    __additionalProperty: (key, value) -> validator.validate('componentProperty', value)
  groups: 'array, optional'


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
  options: 'array of styleOption, optional'


validator.add 'styleOption',
  caption: 'string'
  value: 'string'


module.exports =

  validate: (designConfig) ->
    validator.validate('designConfig', designConfig)
    validator.errors

