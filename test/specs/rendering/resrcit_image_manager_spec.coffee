ResrcitImageManager = require('../../../src/rendering/resrcit_image_manager')

describe 'ResrcitImageManager', ->

  beforeEach ->
    @imageManager = new ResrcitImageManager()


  describe 'setting the image', ->

    it 'adds the correct data-src attribute on an img tag', ->
      $elem = $('<img>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem.data('src')).to.equal("#{ResrcitImageManager.resrcitUrl}http://www.lolcats.com/images/u/13/39/tastegood.jpg")


    it 'adds the "resrc" class on an img tag', ->
      $elem = $('<img>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.class('resrc')


    it 'removes the src attribute on an image tag that already has one', ->
      $elem = $('<img src="http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg">')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).not.to.have.attr('src')


    it 'adds the correct background-image on a div', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.css('background-image', "url(#{ResrcitImageManager.resrcitUrl}http://www.lolcats.com/images/u/13/39/tastegood.jpg)")


    it 'adds the "resrc" class on a div', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.class('resrc')
