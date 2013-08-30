# SnippetTree Events
# ------------------
# Check that SnippetTree fires events properly

describe 'SnippetTree (Layout Events) ->', ->


  beforeEach ->
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectSnippetAdded = monitor(@tree.snippetAdded)
    @expectSnippetRemoved = monitor(@tree.snippetRemoved)
    @expectSnippetMoved = monitor(@tree.snippetMoved)
    @expectChanged = monitor(@tree.changed)


  describe 'appending a snippet', ->


    beforeEach ->
      @appendSnippet = =>
        snippet = test.getSnippet('title')
        @tree.append(snippet)


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
      @tree.append(@snippetA).append(@snippetB)


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
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@tree.snippetContentChanged)
    @expectChanged = monitor(@tree.changed)

    @snippetA = test.getSnippet('title')
    @imageSnippet = test.getSnippet('image')
    @tree.append(@snippetA)
    @tree.append(@imageSnippet)


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


