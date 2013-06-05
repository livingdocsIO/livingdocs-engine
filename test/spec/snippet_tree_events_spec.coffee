# SnippetTree Events
# ------------------
# Check that SnippetTree raises events properly

describe 'SnippetTree (Layout Events) ->', ->

  beforeEach ->
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectSnippetAdded = monitor(@tree.snippetAdded)
    @expectSnippetRemoved = monitor(@tree.snippetRemoved)
    @expectSnippetMoved = monitor(@tree.snippetMoved)


  it 'raises snippetAdded event', ->
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


    it 'raises snippetRemoved event', ->
      @expectSnippetAdded 0, =>
        @expectSnippetMoved 0, =>
          @expectSnippetRemoved 1, =>
            @snippetB.remove()


    it 'raises snippetMoved event', ->
      @expectSnippetMoved 2, =>
        @snippetB.up()
        @snippetA.up()


    it 'does not raise snippetMoved event if snippet did not move', ->
      @expectSnippetMoved 0, =>
        @snippetA.up()


describe 'SnippetTree (Content Events)', ->

  beforeEach ->
    @tree = new SnippetTree()
    monitor = test.createCallbackMonitor
    @expectContentChanged = monitor(@tree.snippetContentChanged)

    @snippetA = test.getSnippet('title')
    @tree.append(@snippetA)


  it 'raises snippetContentChanged event', ->
    @expectContentChanged 1, =>
      @snippetA.set('title', 'Talk to the hand')


