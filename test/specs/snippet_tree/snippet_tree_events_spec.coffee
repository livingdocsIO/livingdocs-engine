ComponentTree = require('../../../src/component_tree/component_tree')
base64Image = require('../../support/test_base64_image')

# ComponentTree Events
# ------------------
# Check that ComponentTree fires events properly

describe 'ComponentTree (Layout Events) ->', ->


  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    monitor = test.createCallbackMonitor
    @expectSnippetAdded = monitor(@componentTree.componentAdded)
    @expectSnippetRemoved = monitor(@componentTree.componentRemoved)
    @expectSnippetMoved = monitor(@componentTree.componentMoved)
    @expectChanged = monitor(@componentTree.changed)


  describe 'appending a snippet', ->


    beforeEach ->
      @appendSnippet = =>
        snippet = test.getSnippet('title')
        @componentTree.append(snippet)


    it 'fires componentAdded event', ->
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
      @componentTree.append(@snippetA).append(@snippetB)


    describe 'removing a snippet', ->
      beforeEach ->
        @removeComponent = =>
          @snippetB.remove()


      it 'fires componentRemoved event', ->
        @expectSnippetAdded 0, =>
          @expectSnippetMoved 0, =>
            @expectSnippetRemoved 1, =>
              @removeComponent()


      it 'fires changed event', ->
        @expectChanged 1, => @removeComponent()


    describe 'moving a snippet', ->


      beforeEach ->
        @moveSnippets = =>
          @snippetB.up()
          @snippetA.up()


      it 'fires componentMoved event', ->
        @expectSnippetMoved 2, => @moveSnippets()


      it 'fires changed event', ->
        @expectChanged 2, => @moveSnippets()


      describe "that can't be moved", ->


        beforeEach ->
          @unsuccessfullyMoveSnippet = => @snippetA.up()


        it 'does not fire componentMoved event', ->
          @expectSnippetMoved 0, => @unsuccessfullyMoveSnippet()


        it 'does not fire changed event', ->
          @expectChanged 0, => @unsuccessfullyMoveSnippet()


describe 'ComponentTree (Content Events)', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@componentTree.componentContentChanged)
    @expectChanged = monitor(@componentTree.changed)

    @snippetA = test.getSnippet('title')
    @imageSnippet = test.getSnippet('image')
    @coverSnippet = test.getSnippet('cover')
    @componentTree.append(@snippetA)
    @componentTree.append(@imageSnippet)
    @componentTree.append(@coverSnippet)


  describe 'changing the title content', ->

    beforeEach ->
      @changeSnippetContent = =>
        @snippetA.set('title', 'Talk to the hand')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


    it 'fires changed event', ->
      @expectChanged 1, => @changeSnippetContent()


  describe 'changing the image src', ->

    beforeEach ->
      @changeSnippetContent = =>
        @imageSnippet.set('image', 'http://www.lolcats.com/images/1.jpg')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


  describe 'changing the background image', ->

    beforeEach ->
      @changeSnippetContent = =>
        @coverSnippet.set('image', 'http://www.lolcats.com/images/u/11/39/lolcatsdotcomaptplf8mvc1o2ldb.jpg')


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


  describe 'changing the img src to a volatile base64 string', ->

    beforeEach ->
      @changeSnippetContent = =>
        @imageSnippet.directives.get('image').setBase64Image(base64Image)


    it 'fires componentContentChanged event', ->
      @expectContentChanged 1, => @changeSnippetContent()


describe 'ComponentTree (Html Events)', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    monitor = test.createCallbackMonitor
    @expectHtlmChanged = monitor(@componentTree.componentHtmlChanged)
    @expectChanged = monitor(@componentTree.changed)

    @hero = test.getSnippet('hero')
    @componentTree.append(@hero)


  describe 'adding a style', ->

    beforeEach ->
      @changeStyle = => @hero.setStyle('extra-space', 'extra-space')

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
        @hero.setStyle('extra-space', 'gazillion-pixel-whitespace')


  describe 'ComponentTree (Data Events)', ->

    beforeEach ->
      { @componentTree } = getInstances('componentTree')
      monitor = test.createCallbackMonitor
      @expectDataChanged = monitor(@componentTree.snippetDataChanged)
      @expectChanged = monitor(@componentTree.changed)

      @hero = test.getSnippet('hero')
      @componentTree.append(@hero)


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
