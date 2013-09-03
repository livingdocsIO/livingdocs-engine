describe 'DesignStyle', ->

  describe 'instantion', ->

    it 'should throw an error for an unknown type', ->
      createStyle = =>
        new DesignStyle
          name: 'Invalid Style'
          type: 'not-actually-a-type'

      expect(createStyle).toThrow()


    it 'should throw an error if no value is provided', ->
      createStyle = =>
        new DesignStyle
          name: 'No Value'
          type: 'option'

      expect(createStyle).toThrow()


    it 'should throw an error if no options are provided', ->
      createStyle = =>
        new DesignStyle
          name: 'No Value'
          type: 'select'

      expect(createStyle).toThrow()


  describe '"Color" of type "select"', ->

    beforeEach ->
      @style = new DesignStyle
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
        expect(@style.validateValue('color--blue')).toBe(true)


      it 'does not validate value "ponzi-scheme"', ->
        expect(@style.validateValue('ponzi-scheme')).toBe(false)


    describe 'otherOptions()', ->

      it 'returns all other options', ->
        others = [{ caption: 'Red', value:'color--red' }]
        expect(@style.otherOptions('color--blue')).toEqual(others)


  describe 'of type "option"', ->

    beforeEach ->
      @style = new DesignStyle
        name: 'Watsonian'
        type: 'option'
        value: 'todo--code-review'


    describe 'validateValue()', ->

      it 'validates value "todo--code-review"', ->
        expect(@style.validateValue('todo--code-review')).toBe(true)


      it 'validates value "" (empty string)', ->
        expect(@style.validateValue('')).toBe(true)


      it 'validates value null', ->
        expect(@style.validateValue(null)).toBe(true)

