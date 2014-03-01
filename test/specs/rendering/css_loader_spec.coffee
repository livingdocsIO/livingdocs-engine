CssLoader = require('../../../src/rendering/css_loader')

describe 'CssLoader', ->
  beforeEach ->
    @window = document: head: $('<div>')[0]
    @loader = new CssLoader(@window)


  describe 'load()', ->

    describe 'when passing a single url', ->

      beforeEach ->
        @loader.load('foo.css')


      it "injects a link tag with that url into the window's document head", ->
        expect(@window.document.head).to.have.html """
          <div>
            <link rel="stylesheet" type="text/css" href="foo.css">
          </div>
        """


    describe 'when passing a single url', ->

      beforeEach ->
        @loader.load(['foo.css', 'bar.css'])


      it "injects a link tag for each url into the window's document head", ->
        expect(@window.document.head).to.have.html """
          <div>
            <link rel="stylesheet" type="text/css" href="foo.css">
            <link rel="stylesheet" type="text/css" href="bar.css">
          </div>
        """


    it 'does not load a file twice', ->
      @loader.load(['foo.css', 'bar.css', 'foo.css'])
      @loader.load('bar.css')
      expect(@window.document.head).to.have.html """
        <div>
          <link rel="stylesheet" type="text/css" href="foo.css">
          <link rel="stylesheet" type="text/css" href="bar.css">
        </div>
      """
