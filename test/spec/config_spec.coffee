describe 'config', ->

  describe 'singleLineBreak regex', ->

    it 'is truthy for linebreaks', ->
      expect(config.singleLineBreak.test('<br>')).toBeTruthy()
      expect(config.singleLineBreak.test('<br> ')).toBeTruthy()
      expect(config.singleLineBreak.test('<br> \n\t')).toBeTruthy()


    it 'is falsy for everything but single line breaks', ->
      expect(config.singleLineBreak.test('<br>a')).toBeFalsy()
      expect(config.singleLineBreak.test(' <br>')).toBeFalsy()
      expect(config.singleLineBreak.test(' ')).toBeFalsy()
      expect(config.singleLineBreak.test('<i></i>')).toBeFalsy()
