
describe "SnippetTree ->", ->

  beforeEach ->
    @tree = new SnippetTree()


  it "has a SnippetContainer as root", ->
    expect(@tree.root instanceof SnippetContainer).toBe(true)


  describe "append", ->

    it "sets snippetTree property of the appended snippet", ->
      snippet = test.getH1Snippet()
      @tree.append(snippet)
      expect(snippet.snippetTree).toEqual(@tree)


    it "appends a snippet to root", ->
      snippet = test.getH1Snippet()
      @tree.append(snippet)
      expect(@tree.root.first).toEqual(snippet)
      expect(@tree.root.last).toEqual(snippet)


describe "SnippetTree with two snippets ->", ->

  beforeEach ->
    @tree = new SnippetTree()

    @snippetA = test.getH1Snippet()
    @tree.append(@snippetA)

    @snippetB = test.getH1Snippet()
    @tree.append(@snippetB)


  it "has previous and next properties of snippet set", ->
    expect(@snippetA.previous).not.toBeDefined()
    expect(@snippetA.next).toEqual(@snippetB)


  it "has first and last pointer of root set", ->
    expect(@tree.root.first).toEqual(@snippetA)
    expect(@tree.root.last).toEqual(@snippetB)


  it "has linked snippets correctly", ->
    expect(@tree.root.first.previous).not.toBeDefined()
    expect(@tree.root.first.next).toEqual(@snippetB)
    expect(@tree.root.last.previous).toEqual(@snippetA)
    expect(@tree.root.last.next).not.toBeDefined()


  describe "up", ->

    it "moves the second snippet up", ->
      @snippetB.up()

      expect(@snippetB.previous).not.toBeDefined()
      expect(@snippetB.next).toEqual(@snippetA)

      expect(@snippetA.previous).toEqual(@snippetB)
      expect(@snippetA.next).not.toBeDefined()


    it "updates the first and last pointers of the container", ->
      @snippetB.up()

      expect(@tree.root.first).toEqual(@snippetB)
      expect(@tree.root.last).toEqual(@snippetA)


  describe "remove", ->

    it "removes the second Snippet", ->
      @snippetB.remove()

      expect(@snippetA.previous).not.toBeDefined()
      expect(@snippetA.next).not.toBeDefined()

      expect(@tree.root.first).toEqual(@snippetA)
      expect(@tree.root.last).toEqual(@snippetA)

      expect(@snippetB.parentContainer).not.toBeDefined()
      expect(@snippetB.snippetTree).not.toBeDefined()
      expect(@snippetB.previous).not.toBeDefined()
      expect(@snippetB.next).not.toBeDefined()


describe "SnippetTree with a row snippet ->", ->

  beforeEach ->
    @tree = new SnippetTree()

    @rowSnippet = test.getRowSnippet()
    @tree.append(@rowSnippet)


  describe "append", ->

    it "adds a snippet to the main column via the snippetContainer", ->
      titleSnippet = test.getH1Snippet()
      mainContainer = @rowSnippet.containers["main"]
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).toEqual(titleSnippet)


    it "adds a snippet to the main column via snippet", ->
      titleSnippet = test.getH1Snippet()
      @rowSnippet.append("main", titleSnippet)

      mainContainer = @rowSnippet.containers["main"]
      expect(mainContainer.first).toEqual(titleSnippet)


    it "the appended snippet has a parent snippet", ->
      titleSnippet = test.getH1Snippet()
      @rowSnippet.append("main", titleSnippet)
      expect( titleSnippet.getParent() ).toEqual(@rowSnippet)


  describe "each", ->

      it "visits the row snippet", ->
        visits = 0
        @tree.each ->
          visits += 1
        expect(visits).toEqual(1)


      it "visits the row snippet and its children", ->
        # add 2 snippets to main container
        for num in [0..2]
          @rowSnippet.append("main", test.getH1Snippet())

        # add 3 snippets to sidebar container
        for num in [0..1]
          @rowSnippet.append("sidebar", test.getH1Snippet())

        visits = 0
        @tree.each ->
          visits += 1

        # check that all 6 snippets where visited by each
        expect(visits).toEqual(6)
