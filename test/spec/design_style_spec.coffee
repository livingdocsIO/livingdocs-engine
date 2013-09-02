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
