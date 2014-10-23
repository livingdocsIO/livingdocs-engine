ObjectSchema = require('../../../src/modules/object_schema/object_schema')

describe 'ObjectSchema', ->

  beforeEach ->
    @jimmy = new ObjectSchema()

  describe 'add()', ->

    it 'adds a schema', ->
      @jimmy.add 'test', {}

      expect(@jimmy.getSchema('test')).to.exist

    it 'adds a __validator property to the schema', ->
      @jimmy.add 'test',
        property: 'string'

      expect(@jimmy.getSchema('test')['property']['__validator']).to.exist


    it 'creates a validator for the property', ->
      @jimmy.add 'test',
        property: 'string'

      validator = @jimmy.getSchema('test')['property']['__validator']
      expect(validator.location).to.equal('property')


    it 'adds a validator location at the second level', ->
      @jimmy.add 'test',
        levelOne:
          levelTwo: 'string'

      validator = @jimmy.getSchema('test')['levelOne']['levelTwo']['__validator']
      expect(validator.location).to.equal('levelOne.levelTwo')


  describe 'validate()', ->

    describe 'a schema with one property', ->

      beforeEach ->
        @jimmy.add 'test',
          name: 'string'


      it 'validates a valid entry', ->
        isValid = @jimmy.validate 'test',
          name: 'I am a valid entry'

        expect(isValid).to.equal(true)


      it 'validates a valid entry with an additional field', ->
        isValid = @jimmy.validate 'test',
          name: 'I am a valid entry'
          anotherProperty: true

        expect(isValid).to.equal(true)


      it 'records an error for an missing property', ->
        isValid = @jimmy.validate 'test',
          anotherProperty: 'there is something missing here'

        expect(isValid).to.equal(false)
        expect(@jimmy.errors[0]).to.equal('require property name')


      it 'records an error for an invalid property type', ->
        isValid = @jimmy.validate 'test',
          name: false

        expect(isValid).to.equal(false)
        expect(@jimmy.errors[0]).to.equal('name: string validator failed')


    describe 'a schema with additional properties', ->

      beforeEach ->
        @jimmy.add 'missingPropertyMethod',
          property: 'string'
          __additionalProperty: -> false
          # __checkAdditionalProperty: (key, value) -> key == 'hello'

      it 'records an error with an additional field', ->
        isValid = @jimmy.validate 'missingPropertyMethod',
          property: 'I am a valid entry'
          anotherProperty: true

        expect(isValid).to.equal(false)


    describe 'a schema with an optional property', ->

      beforeEach ->
        @jimmy.add 'optionalProperty',
          id: 'string'
          name: 'string, optional'

      it 'validates a missing optional field', ->
        isValid = @jimmy.validate 'optionalProperty',
          id: 'AAA'

        expect(isValid).to.equal(true)


    describe 'a schema with two levels', ->

      beforeEach ->
        @jimmy.add 'test',
          levelOne:
            levelTwo: 'string'


      it 'validates a valid entry', ->
        isValid = @jimmy.validate 'test',
          levelOne:
            levelTwo: 'I am a valid second level entry'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid first level entry', ->
        isValid = @jimmy.validate 'test',
          levelOne: 'invalid'

        expect(isValid).to.equal(false)


      it 'records an error for an invalid second level entry', ->
        isValid = @jimmy.validate 'test',
          levelOne:
            levelTwo:
              levelThree: 'one too many'

        expect(isValid).to.equal(false)


      it 'records an error for an empty object', ->
        isValid = @jimmy.validate 'test',
          levelOne: {}

        expect(isValid).to.equal(false)


    describe 'a schema with a nested type', ->

      beforeEach ->
        @jimmy.add 'nested type',
          template: 'template'

        @jimmy.add 'template',
          id: 'number'
          name: 'string'


      it 'validates a nested type', ->
        isValid = @jimmy.validate 'nested type',
          template:
            id: 1
            name: 'just another template'

        expect(isValid).to.equal(true)


      it 'records an error for an invalid nested type', ->
        isValid = @jimmy.validate 'nested type',
          template:
            id: false
            name: 'just another template'

        expect(isValid).to.equal(false)


      it 'records an error for a nested type with the wrong property', ->
        isValid = @jimmy.validate 'nested type',
          template:
            id: 1
            nameMisspelled: 'just another template'

        expect(isValid).to.equal(false)


    describe 'a schema with an array of strings', ->

      beforeEach ->
        @jimmy.add 'array',
          words: 'array of string'


      it 'validates an array of strings', ->
        isValid = @jimmy.validate 'array',
          words: ['hey', 'you']

        expect(isValid).to.equal(true)


      it 'records an error for an array of numbers', ->
        isValid = @jimmy.validate 'array',
          words: [1, 2]

        expect(isValid).to.equal(false)


    describe 'a schema with an array of a nested type', ->

      beforeEach ->
        @jimmy.add 'array',
          templates: 'array of template'

        @jimmy.add 'template',
          id: 'number'
          name: 'string'


      it 'validates an array with two entries', ->
        isValid = @jimmy.validate 'array',
          templates: [
            id: 1
            name: 'just another template'
          ,
            id: 2
            name: 'just another template'
          ]

        expect(isValid).to.equal(true)


      it 'validates an empty array', ->
        isValid = @jimmy.validate 'array',
          templates: []

        expect(isValid).to.equal(true)


      it 'records an error for a missing array', ->
        isValid = @jimmy.validate 'array',
          templates: undefined

        expect(isValid).to.equal(false)


      it 'records an error for an invalid array entry', ->
        isValid = @jimmy.validate 'array',
          templates: [
            id: 1
          ]

        expect(isValid).to.equal(false)



