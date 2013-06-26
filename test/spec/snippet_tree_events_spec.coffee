# SnippetTree Events
# ------------------
# Check that SnippetTree fires events properly

describe 'SnippetTree (Layout Events) ->', ->

  beforeEach ->
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectSnippetAdded = monitor(@tree.snippetAdded)
    @expectSnippetRemoved = monitor(@tree.snippetRemoved)
    @expectSnippetMoved = monitor(@tree.snippetMoved)


  it 'fires snippetAdded event', ->
    snippet = test.getSnippet('title')

    @expectSnippetRemoved 0, =>
      @expectSnippetMoved 0, =>
        @expectSnippetAdded 1, =>
          @tree.append(snippet)


  describe 'with two snippets (Events) ->', ->

    beforeEach ->
      @snippetA = test.getSnippet('title')
      @snippetB = test.getSnippet('title')
      @tree.append(@snippetA).append(@snippetB)


    it 'fires snippetRemoved event', ->
      @expectSnippetAdded 0, =>
        @expectSnippetMoved 0, =>
          @expectSnippetRemoved 1, =>
            @snippetB.remove()


    it 'fires snippetMoved event', ->
      @expectSnippetMoved 2, =>
        @snippetB.up()
        @snippetA.up()


    it 'does not fire snippetMoved event if snippet did not move', ->
      @expectSnippetMoved 0, =>
        @snippetA.up()


describe 'SnippetTree (Content Events)', ->

  beforeEach ->
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@tree.snippetContentChanged)

    @snippetA = test.getSnippet('title')
    @tree.append(@snippetA)


  it 'fires snippetContentChanged event', ->
    @expectContentChanged 1, =>
      @snippetA.set('title', 'Talk to the hand')


