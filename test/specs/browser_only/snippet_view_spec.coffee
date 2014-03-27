DefaultImageManager = require('../../../src/rendering/default_image_manager')

describe 'Browser only: DefaultImageManager', ->

  beforeEach ->
    @imageManager = new DefaultImageManager()


  describe 'escapeCssUri()', ->

    it 'escapes an uri with paranthesis', ->
      escapedUri = @imageManager.escapeCssUri('http://test.com/(1)')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      # Firefox always returns the url in double quotes
      attr = $elem[0].getAttribute('style')
      attr = attr.replace(/"/g, '\'')

      expect(attr).to.equal('background-image: url(\'http://test.com/(1)\');')
