describe 'edtiable_directive:', ->

  describe 'getContent()', ->

    beforeEach ->
      @directive = test.getComponent('text').directives.get('text')


    it 'gets the content from an empty directive', ->
      expect(@directive.getContent()).to.equal(undefined)


  describe 'getText()', ->

    beforeEach ->
      @directive = test.getComponent('text').directives.get('text')


    it 'returns an empty string for an empty directive', ->
      expect(@directive.getText()).to.equal('')


    it 'gets the text "a"', ->
      @directive.setContent('a')
      expect(@directive.getText()).to.equal('a')


    it 'transforms HTML entities', ->
      @directive.setContent('&amp;')
      expect(@directive.getText()).to.equal('&')


    it 'gets the text from "<i>b</i>"', ->
      @directive.setContent('<i>b</i>')
      expect(@directive.getText()).to.equal('b')


    it 'does not trim whitespaces', ->
      @directive.setContent(' b ')
      expect(@directive.getText()).to.equal(' b ')


