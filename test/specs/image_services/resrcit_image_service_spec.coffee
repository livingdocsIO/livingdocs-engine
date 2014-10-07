resrcitImageService = require('../../../src/image_services/resrcit_image_service')
base64Image = require('../../support/test_base64_image')

describe 'resrcitImageService', ->

  beforeEach ->
    @imageService = resrcitImageService


  describe 'setting the image', ->

    it 'adds the correct data-src attribute on an img tag', ->
      $elem = $('<img>')
      @imageService.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem.data('src')).to.equal("http://www.lolcats.com/images/u/13/39/tastegood.jpg")


    it 'adds the "resrc" class on an img tag', ->
      $elem = $('<img>')
      @imageService.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.class('resrc')


    # happens when uploading image and recalculating
    it 'removes the src attribute on an image tag that already has a base64 src data url', ->
      $elem = $("<img src='#{ base64Image }'>")
      @imageService.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).not.to.have.attr('src')


    # happen e.g. when changing the caption -> should not recalc the image
    it 'does not remove the src attribute on an image tag that has a url', ->
      $elem = $('<img src="http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg">')
      @imageService.set($elem, 'http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg')
      expect($elem).to.have.attr('src', 'http://www.lolcats.com/images/u/12/43/lolcatsdotcomlikemyself.jpg')


    it 'adds the correct background-image on a div', ->
      $elem = $('<div></div>')
      @imageService.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expectedUrlFirefox = "url(\"http://www.lolcats.com/images/u/13/39/tastegood.jpg\")"
      expectedUrlOthers = "url(http://www.lolcats.com/images/u/13/39/tastegood.jpg)"
      test = $elem.css('background-image') == expectedUrlFirefox || $elem.css('background-image') == expectedUrlOthers
      expect(test).to.be.true


    it 'adds the "resrc" class on a div', ->
      $elem = $('<div></div>')
      @imageService.set($elem, 'http://www.lolcats.com/images/u/13/39/tastegood.jpg')
      expect($elem).to.have.class('resrc')


  describe 'setting a base 64 image representation', ->

    it 'adds a base64 string to the src of an img tag', ->
      $elem = $('<img>')
      @imageService.set($elem, base64Image)
      expect($elem).to.have.attr('src', base64Image)


    it 'adds a base64 string to the background-image tag', ->
      $elem = $('<div></div>')
      @imageService.set($elem, base64Image)
      expectedUrlFirefox = "url(\"#{ base64Image }\")"
      expectedUrlOthers = "url(#{ base64Image })"
      test = $elem.css('background-image') == expectedUrlFirefox || $elem.css('background-image') == expectedUrlOthers
      expect(test).to.be.true
