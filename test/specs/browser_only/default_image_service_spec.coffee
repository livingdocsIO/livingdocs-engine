$ = require('jquery')
defaultImageService = require('../../../src/image_services/default_image_service')

describe '(browser only) default_image_service:', ->

  beforeEach ->
    @imageService = defaultImageService


  describe 'escapeCssUri()', ->

    it 'escapes an uri with paranthesis', ->
      escapedUri = @imageService.escapeCssUri('http://test.com/(1)')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      style = $elem[0].getAttribute('style')
      style = test.normalizeStyle(style)

      expect(style).to.equal('background-image: url(\'http://test.com/(1)\');')

