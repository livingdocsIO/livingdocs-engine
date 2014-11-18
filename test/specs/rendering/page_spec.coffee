$ = require('jquery')
RenderingContainer = require('../../../src/rendering_container/rendering_container')
Page = require('../../../src/rendering_container/page')

describe 'page:', ->

  describe 'simple page with only a renderNode', ->

    beforeEach ->
      @page = new Page(renderNode: $('div'))


    it 'should be readOnly', ->
      expect(@page.isReadOnly).to.be.true


    it 'should be an instance of RenderingContainer', ->
      expect(@page).to.be.an.instanceof(RenderingContainer)


  describe 'ready()', ->

    it 'calls the callback as soon as the assets are loaded', (done) ->
      new Page().ready ->
        done()
