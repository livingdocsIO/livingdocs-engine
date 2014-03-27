DefaultImageManager = require('../../../src/rendering/default_image_manager')
describe 'DefaultImageManager', ->

  beforeEach ->
    @imageManager = new DefaultImageManager()


  describe 'setting the image', ->

    it 'renders the image src on an img', ->
      $elem = $('<img>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/1.jpg')
      expect($elem).to.have.html """
        <img src="http://www.lolcats.com/images/1.jpg">
      """


    it 'renders the image background property on a div', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/1.jpg')
      expect($elem).to.have.html """
        <div style="background-image:url(http://www.lolcats.com/images/1.jpg)"></div>
      """


  describe 'escapeCssUri()', ->

    it 'escapes an uri with paranthesis', ->
      escapedUri = @imageManager.escapeCssUri('http://test.com/1')

      $elem = $('<div>')
      $elem.css('background-image', "url(#{ escapedUri })")

      # Firefox always returns the url in double quotes
      attr = $elem[0].getAttribute('style')
      attr = attr.replace(/"/g, '')

      expect(attr).to.equal('background-image: url(http://test.com/1);')
