ObjectSchema = require('../../../src/modules/object_schema/object_schema')

describe 'ObjectSchema', ->

  beforeEach ->
    @schema = new ObjectSchema()

  describe 'add()', ->

    it 'adds a schema', ->
      @schema.add 'test', {}

      expect(@schema.getSchema('test')).to.exist

    it 'adds a __validator property to the schema', ->
      @schema.add 'test',
        property: 'string'

      expect(@schema.getSchema('test')['property']['__validator']).to.exist


    it 'creates a validator for the property', ->
      @schema.add 'test',
        property: 'string'

      validator = @schema.getSchema('test')['property']['__validator']
      expect(validator.location).to.equal('property')


    it 'adds a validator location at the second level', ->
      @schema.add 'test',
        levelOne:
          levelTwo: 'string'

      validator = @schema.getSchema('test')['levelOne']['levelTwo']['__validator']
      expect(validator.location).to.equal('levelOne.levelTwo')


  describe 'validate()', ->

    describe 'a schema with one property', ->

      beforeEach ->
        @schema.add 'test',
          name: 'string'


      it 'validates a valid entry', ->
        isValid = @schema.validate 'test',
          name: 'I am a valid entry'

        expect(isValid).to.equal(true)


      it 'validates a valid entry with an additional field', ->
        isValid = @schema.validate 'test',
          name: 'I am a valid entry'
          anotherProperty: true

        expect(isValid).to.equal(true)


      it 'records an error for an missing property', ->
        isValid = @schema.validate 'test',
          anotherProperty: 'there is something missing here'

        expect(isValid).to.equal(false)
        expect(@schema.errors[0]).to.equal('require property name')


      it 'records an error for an invalid property type', ->
        isValid = @schema.validate 'test',
          name: false

        expect(isValid).to.equal(false)
        expect(@schema.errors[0]).to.equal('name: string validator failed')


    describe 'a schema with additional properties', ->

      beforeEach ->
        @schema.add 'missingPropertyMethod',
          property: 'string'
          __additionalProperty: -> false


      it 'records an error with an additional field', ->
        isValid = @schema.validate 'missingPropertyMethod',
          property: 'I am a valid entry'
          anotherProperty: true

        expect(isValid).to.equal(false)


    describe 'a schema with an optional property', ->

      beforeEach ->
        @schema.add 'optionalProperty',
          id: 'string'
          name: 'string, optional'

      it 'validates a missing optional field', ->
        isValid = @schema.validate 'optionalProperty',
          id: 'AAA'

        expect(isValid).to.equal(true)


    describe 'a schema with two levels', ->

      beforeEach ->
        @schema.add 'test',
          levelOne:
            levelTwo: 'string'


      it 'validates a valid entry', ->
        isValid = @schema.validate 'test',
          levelOne:
            levelTwo: 'I am a valid second level entry'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid first level entry', ->
        isValid = @schema.validate 'test',
          levelOne: 'invalid'

        expect(isValid).to.equal(false)


      it 'records an error for an invalid second level entry', ->
        isValid = @schema.validate 'test',
          levelOne:
            levelTwo:
              levelThree: 'one too many'

        expect(isValid).to.equal(false)


      it 'records an error for an empty object', ->
        isValid = @schema.validate 'test',
          levelOne: {}

        expect(isValid).to.equal(false)


    describe 'a schema with a nested type', ->

      beforeEach ->
        @schema.add 'nested type',
          template: 'template'

        @schema.add 'template',
          id: 'number'
          name: 'string'


      it 'validates a nested type', ->
        isValid = @schema.validate 'nested type',
          template:
            id: 1
            name: 'just another template'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid nested type', ->
        isValid = @schema.validate 'nested type',
          template:
            id: false
            name: 'just another template'

        expect(isValid).to.equal(false)


      it 'records an error for a nested type with the wrong property', ->
        isValid = @schema.validate 'nested type',
          template:
            id: 1
            nameMisspelled: 'just another template'

        expect(isValid).to.equal(false)


    describe 'a schema with an array of strings', ->

      beforeEach ->
        @schema.add 'array',
          words: 'array of string'


      it 'validates an array of strings', ->
        isValid = @schema.validate 'array',
          words: ['hey', 'you']

        expect(isValid).to.equal(true)


      it 'records an error for an array of numbers', ->
        isValid = @schema.validate 'array',
          words: [1, 2]

        expect(isValid).to.equal(false)


    describe 'a schema with an array of a nested type', ->

      beforeEach ->
        @schema.add 'array',
          templates: 'array of template'

        @schema.add 'template',
          id: 'number'
          name: 'string'


      it 'validates an array with two entries', ->
        isValid = @schema.validate 'array',
          templates: [
            id: 1
            name: 'just another template'
          ,
            id: 2
            name: 'just another template'
          ]

        expect(isValid).to.equal(true)


      it 'validates an empty array', ->
        isValid = @schema.validate 'array',
          templates: []

        expect(isValid).to.equal(true)


      it 'records an error for a missing array', ->
        isValid = @schema.validate 'array',
          templates: undefined

        expect(isValid).to.equal(false)


      it 'records an error for an invalid array entry', ->
        isValid = @schema.validate 'array',
          templates: [
            id: 1
          ]

        expect(isValid).to.equal(false)


    describe 'a schema with password confirmation', ->

      beforeEach ->
        @schema.addValidator 'confirmPassword', (obj) ->
          obj.password == obj.passwordConfirmation

        @schema.add 'password',
          __validate: 'confirmPassword'
          password: 'string, not empty'
          passwordConfirmation: 'string'


      it 'validates a valid object', ->
        isValid = @schema.validate 'password',
          password: '1234'
          passwordConfirmation: '1234'

        expect(isValid).to.equal(true)


      it 'records an error for a mistyped password confirmation', ->
        isValid = @schema.validate 'password',
          password: '1234'
          passwordConfirmation: '1235'

        expect(isValid).to.equal(false)
        expect(@schema.errors[0]).to.equal('confirmPassword validator failed')


    describe 'a schema with a custom validator in a nested object', ->

      beforeEach ->
        @schema.addValidator 'phone', (value) ->
          /\d{7,12}/.test(value)

        @schema.add 'person',
          person:
            name: 'string'
            phone: 'string, phone'


      it 'validates a valid object', ->
        isValid = @schema.validate 'person',
          person:
            name: 'Peter Pan'
            phone: '0764352253'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid phone number', ->
        isValid = @schema.validate 'person',
          person:
            name: 'Peter Pan'
            phone: 'no number here'

        expect(isValid).to.equal(false)
        expect(@schema.errors[0]).to.equal('person.phone: phone validator failed')


    describe 'a schema wich calls validate', ->

      beforeEach ->
        @schema.add 'persons',
          persons:
            __additionalProperty: (key, value) => @schema.validate('person', value)

        @schema.add 'person',
          name: 'string'
          place: 'string'


      it 'validates a valid object', ->
        isValid = @schema.validate 'persons',
          persons:
            '1':
              name: 'Peter Pan'
              place: 'Neverland'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid child object', ->
        isValid = @schema.validate 'persons',
          persons:
            '1':
              name: 'Lucky Luke'

        expect(isValid).to.equal(false)
        expect(@schema.errors[0]).to.equal('persons: additional property check failed')
        expect(@schema.errors.length).to.equal(1)

