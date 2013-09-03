describe 'DesignStyle', ->

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


  describe '"Watsonian" of type "option"', ->
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

