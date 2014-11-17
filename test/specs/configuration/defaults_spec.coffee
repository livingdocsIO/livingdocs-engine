config = test.config

describe 'default config', ->

  describe 'singleLineBreak regex', ->

    it 'is truthy for linebreaks', ->
      expect(config.singleLineBreak.test('<br>')).to.be.ok
      expect(config.singleLineBreak.test('<br> ')).to.be.ok
      expect(config.singleLineBreak.test('<br> \n\t')).to.be.ok


    it 'is falsy for everything but single line breaks', ->
      expect(config.singleLineBreak.test('<br>a')).not.to.be.ok
      expect(config.singleLineBreak.test(' <br>')).not.to.be.ok
      expect(config.singleLineBreak.test(' ')).not.to.be.ok
      expect(config.singleLineBreak.test('<i></i>')).not.to.be.ok
