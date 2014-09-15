SnippetTree = require('../../../src/snippet_tree/snippet_tree')
base64Image = require('../../support/test_base64_image')

# SnippetTree Events
# ------------------
# Check that SnippetTree fires events properly

describe 'SnippetTree (Layout Events) ->', ->


  beforeEach ->
    { @snippetTree } = getInstances('snippetTree')
    monitor = test.createCallbackMonitor
    @expectSnippetAdded = monitor(@snippetTree.snippetAdded)
    @expectSnippetRemoved = monitor(@snippetTree.snippetRemoved)
    @expectSnippetMoved = monitor(@snippetTree.snippetMoved)
    @expectChanged = monitor(@snippetTree.changed)


  describe 'appending a snippet', ->


    beforeEach ->
      @appendSnippet = =>
        snippet = test.getSnippet('title')
        @snippetTree.append(snippet)


    it 'fires snippetAdded event', ->
      @expectSnippetRemoved 0, =>
        @expectSnippetMoved 0, =>
          @expectSnippetAdded 1, =>
            @appendSnippet()


    it 'fires changed event', ->
      @expectChanged 1, => @appendSnippet()


  describe 'with two snippets (Events) ->', ->


    beforeEach ->
      @snippetA = test.getSnippet('title')
      @snippetB = test.getSnippet('title')
      @snippetTree.append(@snippetA).append(@snippetB)


    describe 'removing a snippet', ->
      beforeEach ->
        @removeSnippet = =>
          @snippetB.remove()


      it 'fires snippetRemoved event', ->
        @expectSnippetAdded 0, =>
          @expectSnippetMoved 0, =>
            @expectSnippetRemoved 1, =>
              @removeSnippet()


      it 'fires changed event', ->
        @expectChanged 1, => @removeSnippet()


    describe 'moving a snippet', ->


      beforeEach ->
        @moveSnippets = =>
          @snippetB.up()
          @snippetA.up()


      it 'fires snippetMoved event', ->
        @expectSnippetMoved 2, => @moveSnippets()


      it 'fires changed event', ->
        @expectChanged 2, => @moveSnippets()


      describe "that can't be moved", ->


        beforeEach ->
          @unsuccessfullyMoveSnippet = => @snippetA.up()


        it 'does not fire snippetMoved event', ->
          @expectSnippetMoved 0, => @unsuccessfullyMoveSnippet()


        it 'does not fire changed event', ->
          @expectChanged 0, => @unsuccessfullyMoveSnippet()


describe 'SnippetTree (Content Events)', ->

  beforeEach ->
    { @snippetTree } = getInstances('snippetTree')
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@snippetTree.snippetContentChanged)
    @expectChanged = monitor(@snippetTree.changed)

    @snippetA = test.getSnippet('title')
    @imageSnippet = test.getSnippet('image')
    @coverSnippet = test.getSnippet('cover')
    @snippetTree.append(@snippetA)
    @snippetTree.append(@imageSnippet)
    @snippetTree.append(@coverSnippet)


  describe 'changing the title content', ->

    beforeEach ->
      @changeSnippetContent = =>
        @snippetA.set('title', 'Talk to the hand')


    it 'fires snippetContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


    it 'fires changed event', ->
      @expectChanged 1, => @changeSnippetContent()


  describe 'changing the image src', ->

    beforeEach ->
      @changeSnippetContent = =>
        @imageSnippet.set('image', 'http://www.lolcats.com/images/1.jpg')


    it 'fires snippetContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


  describe 'changing the background image', ->

    beforeEach ->
      @changeSnippetContent = =>
        @coverSnippet.set('image', 'http://www.lolcats.com/images/u/11/39/lolcatsdotcomaptplf8mvc1o2ldb.jpg')


    it 'fires snippetContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


  describe 'changing the img src to a volatile base64 string', ->

    beforeEach ->
      @changeSnippetContent = =>
        @imageSnippet.directives['image'].setBase64Image(base64Image)


    it 'fires snippetContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


describe 'SnippetTree (Html Events)', ->

  beforeEach ->
    { @snippetTree } = getInstances('snippetTree')
    monitor = test.createCallbackMonitor
    @expectHtlmChanged = monitor(@snippetTree.snippetHtmlChanged)
    @expectChanged = monitor(@snippetTree.changed)

    @hero = test.getSnippet('hero')
    @snippetTree.append(@hero)


  describe 'adding a style', ->

    beforeEach ->
      @changeStyle = => @hero.style('Extra Space', 'extra-space')

    it 'fires htmlChanged event', ->
      @expectHtlmChanged 1, => @changeStyle()


    it 'fires changed event', ->
      @expectChanged 1, => @changeStyle()


    it '...twice fires htmlChanged event only once', ->
      @expectHtlmChanged 1, =>
        @changeStyle()
        @changeStyle()


  describe 'adding an invalid style', ->

    it 'does not fire the htmlChanged event', ->
      @expectHtlmChanged 0, =>
        @hero.style('Extra Space', 'gazillion-pixel-whitespace')


  describe 'SnippetTree (Data Events)', ->

    beforeEach ->
      { @snippetTree } = getInstances('snippetTree')
      monitor = test.createCallbackMonitor
      @expectDataChanged = monitor(@snippetTree.snippetDataChanged)
      @expectChanged = monitor(@snippetTree.changed)

      @hero = test.getSnippet('hero')
      @snippetTree.append(@hero)


    describe 'adding data', ->

      beforeEach ->
        @changeData = => @hero.data(
          'geojson':
            'features': []
        )


      it 'fires dataChanged event', ->
        @expectDataChanged 1, => @changeData()


      it 'fires changed event', ->
        @expectChanged 1, => @changeData()


      it '...twice fires dataChanged event only once', ->
        @expectDataChanged 1, =>
          @changeData()
          @changeData()
