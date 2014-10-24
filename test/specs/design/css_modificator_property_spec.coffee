CssModificatorProperty = require('../../../src/design/css_modificator_property')

describe 'CssModificatorProperty', ->

  describe 'instantion', ->

    it 'should throw an error for an unknown type', ->
      createStyle = =>
        new CssModificatorProperty
          name: 'Invalid Style'
          type: 'not-actually-a-type'

      expect(createStyle).to.throw()


    it 'should throw an error if no value is provided', ->
      createStyle = =>
        new CssModificatorProperty
          name: 'No Value'
          type: 'option'

      expect(createStyle).to.throw()


    it 'should throw an error if no options are provided', ->
      createStyle = =>
        new CssModificatorProperty
          name: 'No Value'
          type: 'select'

      expect(createStyle).to.throw()


  describe '"Color" of type "select"', ->

    beforeEach ->
      @style = new CssModificatorProperty
        name: 'Color'
        type: 'select'
        options: [
          caption: 'Red'
          value: 'color--red'
        ,
          caption: 'Blue'
          value: 'color--blue'
        ]


    describe 'validateValue()', ->

      it 'validates value "color--blue"', ->
        expect(@style.validateValue('color--blue')).to.be.true


      it 'does not validate value "ponzi-scheme"', ->
        expect(@style.validateValue('ponzi-scheme')).to.be.false


    describe 'otherOptions()', ->

      it 'returns all other options', ->
        expect(@style.otherOptions('color--blue')).to.deep.equal [
          { caption: 'Red', value:'color--red' }
        ]


  describe 'of type "option"', ->

    beforeEach ->
      @style = new CssModificatorProperty
        name: 'Watsonian'
        type: 'option'
        value: 'todo--code-review'


    describe 'validateValue()', ->

      it 'validates value "todo--code-review"', ->
        expect(@style.validateValue('todo--code-review')).to.be.true


      it 'validates value "" (empty string)', ->
        expect(@style.validateValue('')).to.be.true


      it 'validates value null', ->
        expect(@style.validateValue(null)).to.be.true

