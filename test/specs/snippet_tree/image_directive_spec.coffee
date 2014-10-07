base64Image = require('../../support/test_base64_image')

describe 'ImageDirective', ->

  describe 'setImageService()', ->

    beforeEach ->
      @imageSnippet = test.getSnippet('image')
      @directive = @imageSnippet.directives.get('image')


    it 'sets the imageService to "undefined"', ->
      @directive.setImageService(undefined)
      expect(@directive.getImageServiceName()).to.equal('default')


    it 'throws an error for an unknown imageService', ->
      method = =>
        @directive.setImageService('noServiceHere')

      expect(method).to.throw()

