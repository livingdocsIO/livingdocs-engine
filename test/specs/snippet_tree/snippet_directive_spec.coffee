describe 'Snippet Directive', ->

  describe 'snippet with inline image', ->
    beforeEach ->
      @image = test.getComponent('image')
      @imgDirective = @image.directives.get('image')


    it 'has a snippet directive with its parent snippet set', ->
      expect(@imgDirective.snippet).to.equal(@image)


    describe 'getImageUrl()', ->

      it 'returns undefined for an empty image', ->
        expect(@imgDirective.getImageUrl()).to.equal(undefined)


    describe 'setImageService()', ->

      it 'sets resrc.it as image service', ->
        @imgDirective.setImageService('resrc.it')
        expect(@imgDirective.getImageServiceName()).to.equal('resrc.it')


    describe 'setImageUrl()', ->

      it 'sets a URL', ->
        @imgDirective.setImageUrl('http:://images.com/1.jpg')
        expect(@imgDirective.getImageUrl()).to.equal('http:://images.com/1.jpg')


      it 'sets a URL with resrc.it as image service', ->
        @imgDirective.setImageService('resrc.it')
        @imgDirective.setImageUrl('http:://images.com/1.jpg')
        expect( @imgDirective.getImageUrl() ).to.equal('http://app.resrc.it/http:://images.com/1.jpg')
        expect( @imgDirective.getOriginalUrl() ).to.equal('http:://images.com/1.jpg')


    describe 'setCrop()', ->

      beforeEach ->
        @imgDirective.setImageService('resrc.it')
        @imgDirective.setImageUrl('http:://images.com/1.jpg')


      it 'updates the url with resrc.it as image service', ->
        @imgDirective.setCrop(x: 10, y: 20, width: 400, height: 300)
        expect( @imgDirective.getImageUrl() ).to.equal('http://app.resrc.it/C=W400,H300,X10,Y20/http:://images.com/1.jpg')


      it 'resets the crop after setting another url', ->
        @imgDirective.setCrop(x: 10, y: 20, width: 400, height: 300)
        @imgDirective.setImageUrl('http:://images.com/kitten.jpg')
        expect( @imgDirective.getImageUrl() ).to.equal('http://app.resrc.it/http:://images.com/kitten.jpg')


    describe 'isInlineImage()', ->

      it 'returns true', ->
        expect(@imgDirective.isInlineImage()).to.equal(true)


    describe 'isBackgroundImage()', ->

      it 'return false', ->
        expect(@imgDirective.isBackgroundImage()).to.equal(false)


  describe 'snippet with background image', ->
    beforeEach ->
      @cover = test.getComponent('cover')
      @imgDirective = @cover.directives.get('image')


    it 'has a snippet directive with its parent snippet set', ->
      expect(@imgDirective.snippet).to.equal(@cover)


    describe 'isBackgroundImage()', ->

      it 'returns true', ->
        expect(@imgDirective.isBackgroundImage()).to.equal(true)


    describe 'isInlineImage()', ->

      it 'return false', ->
        expect(@imgDirective.isInlineImage()).to.equal(false)

