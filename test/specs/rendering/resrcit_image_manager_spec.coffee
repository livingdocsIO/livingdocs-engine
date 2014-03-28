ResrcitImageManager = require('../../../src/rendering/resrcit_image_manager')
TestImage = require('../../support/test_base64_image')

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


    # happens when uploading image and recalculating
    it 'removes the src attribute on an image tag that already has a base64 src data url', ->
      $elem = $("<img src='#{TestImage}'>")
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).not.to.have.attr('src')


    # happen e.g. when changing the caption -> should not recalc the image
    it 'does not remove the src attribute on an image tag that has a url', ->
      $elem = $('<img src="http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg">')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg')
      expect($elem).to.have.attr('src', 'http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg')


    it 'adds the correct background-image on a div', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.css('background-image', "url(#{ResrcitImageManager.resrcitUrl}http://www.lolcats.com/images/u/13/39/tastegood.jpg)")


    it 'adds the "resrc" class on a div', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.class('resrc')


  describe 'setting a base 64 image representation', ->

    it 'adds a base64 string to the src of an img tag', ->
      $elem = $('<img>')
      @imageManager.set($elem, TestImage)
      expect($elem).to.have.attr('src', TestImage)


    it 'adds a base64 string to the background-image tag', ->
      $elem = $('<div></div>')
      @imageManager.set($elem, TestImage)
      expect($elem).to.have.css('background-image', "url(#{TestImage})")
