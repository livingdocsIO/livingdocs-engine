$ = require('jquery')
defaultImageService = require('../../../src/image_services/default_image_service')

describe 'default_image_service:', ->

  beforeEach ->
    @imageService = defaultImageService


  describe 'setting the image', ->

    it 'renders the image src on an img', ->
      $elem = $('<img>')
      @imageService.set($elem, 'http://www.lolcats.com/images/1.jpg')
      expect($elem).to.have.html """
        <img src="http://www.lolcats.com/images/1.jpg">
      """


    it 'renders the image background property on a div', ->
      $elem = $('<div></div>')
      @imageService.set($elem, 'http://www.lolcats.com/images/1.jpg')
      expect($elem).to.have.html """
        <div style="background-image:url(http://www.lolcats.com/images/1.jpg)"></div>
      """


  describe 'escapeCssUri()', ->

    it 'escapes an uri with paranthesis', ->
      escapedUri = @imageService.escapeCssUri('http://test.com/1')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      style = $elem[0].getAttribute('style')

      # Firefox always returns the url in double quotes
      style = test.normalizeStyle(style, removeUrlQuotes: true)

      expect(style).to.equal('background-image: url(http://test.com/1);')
