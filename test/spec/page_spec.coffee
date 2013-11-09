describe 'Page', ->

  describe 'simple page with only a renderNode', ->

    beforeEach ->
      @page = new Page(renderNode: $('div'))


    it 'should be readOnly', ->
      expect(@page.isReadOnly).toBe(true)


    it 'should be an instance of RenderingContainer', ->
      expect(@page instanceof RenderingContainer).toBe(true)


  describe 'ready()', ->

    it 'calls the callback as soon as the assets are loaded', ->
      callbackCalled = false
      new Page().ready(-> callbackCalled = true)
      expect(callbackCalled).toBeTruthy()
