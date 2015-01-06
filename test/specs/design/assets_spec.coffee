Assets = require('../../../src/design/assets')

describe 'assets:', ->

  describe 'from test design', ->

    beforeEach ->
      { @design } = test.get('design')
      @assets = new Assets(prefix: '/designs/test')


    it 'creates an instance', ->
      expect(@assets).to.be.an.instanceof(Assets)


    describe 'convertToAbsolutePaths()', ->

      it 'converts an url that starts with "./"', ->
        @assets.addCss('./design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('/designs/test/design.css')


      it 'converts a relative url', ->
        @assets.addCss('design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('/designs/test/design.css')


      it 'does not touch a url that starts with "http://"', ->
        @assets.addCss('http://design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('http://design.css')


      it 'does not touch a url that starts with "https://"', ->
        @assets.addCss('https://design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('https://design.css')


      it 'does not touch a url that starts with "/"', ->
        @assets.addCss('/my/custom/path/to/the/design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('/my/custom/path/to/the/design.css')

