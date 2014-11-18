Assets = require('../../../src/design/assets')

describe 'assets:', ->

  describe 'from test design', ->

    beforeEach ->
      { @design } = test.get('design')
      @assets = new Assets(design: @design)


    it 'creates an instance', ->
      expect(@assets).to.be.an.instanceof(Assets)


    describe 'convertToAbsolutePaths()', ->

      it 'converts a relative url', ->
        @assets.addCss('./design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('/designs/test/design.css')


      it 'leaves absolute urls alone', ->
        @assets.addCss('/my/custom/path/to/the/design.css')
        absUrls = @assets.convertToAbsolutePaths(@assets.css)
        expect(absUrls[0]).to.equal('/my/custom/path/to/the/design.css')

