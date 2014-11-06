defaultImageService = require('../../../src/image_services/default_image_service')

describe 'Browser only: DefaultImageManager', ->

  beforeEach ->
    @imageService = defaultImageService


  describe 'escapeCssUri()', ->

    it 'escapes an uri with paranthesis', ->
      escapedUri = @imageService.escapeCssUri('http://test.com/(1)')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      # Firefox always returns the url in double quotes
      attr = $elem[0].getAttribute('style')
      attr = attr.replace(/"/g, '\'')

      expect(attr).to.equal('background-image: url(\'http://test.com/(1)\');')
