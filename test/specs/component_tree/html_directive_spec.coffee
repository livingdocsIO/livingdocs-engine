describe 'html_directive:', ->

  describe 'setEmbedHandler() and getEmbedHandler()', ->

    beforeEach ->
      @htmlComponent = test.getComponent('html')
      @directive = @htmlComponent.directives.get('source')


    it 'sets a value in the parent components data', ->
      @directive.setEmbedHandler('twitter')
      expect(@directive.component.dataValues).to.deep.equal
        '_sourceDirective':
          '_embedHandler': 'twitter'


    it 'gets an embedHandler', ->
      @directive.setEmbedHandler('twitter')
      expect(@directive.getEmbedHandler()).to.equal('twitter')

