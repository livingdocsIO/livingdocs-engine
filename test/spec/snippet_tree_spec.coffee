# SnippetTree
# -----------

describe "SnippetTree ->", ->

  beforeEach ->
    @tree = new SnippetTree()

  it "should instantiate", ->
    expect(@tree instanceof SnippetTree).toBe(true)

  it "should have a SnippetContainer as root", ->
    expect(@tree.root instanceof SnippetContainer).toBe(true)

  it "append() should set snippetTree property of the appended snippet", ->
    snippet = test.getH1Snippet()
    @tree.append(snippet)
    expect(snippet).toBeDefined()
    expect(snippet.snippetTree).toEqual(@tree)

  it "append() should append a snippet to root", ->
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

  it "should set previous and next props of snippet", ->
    expect(@snippetA.previous).not.toBeDefined()
    expect(@snippetA.next).toEqual(@snippetB)

  it "should update first and last pointer of the container", ->
    expect(@tree.root.first).toEqual(@snippetA)
    expect(@tree.root.last).toEqual(@snippetB)

  it "should be linked correctly", ->
    expect(@tree.root.first.previous).not.toBeDefined()
    expect(@tree.root.first.next).toEqual(@snippetB)
    expect(@tree.root.last.previous).toEqual(@snippetA)
    expect(@tree.root.last.next).not.toBeDefined()

  it "up() should move the second snippet up", ->
    @snippetB.up()

    expect(@snippetB.previous).not.toBeDefined()
    expect(@snippetB.next).toEqual(@snippetA)

    expect(@snippetA.previous).toEqual(@snippetB)
    expect(@snippetA.next).not.toBeDefined()

  it "up() should update first and last pointers of the container", ->
    @snippetB.up()

    expect(@tree.root.first).toEqual(@snippetB)
    expect(@tree.root.last).toEqual(@snippetA)

  it "remove() should remove the second Snippet", ->
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


  it "should append a snippet to the main column via the snippetContainer", ->
    titleSnippet = test.getH1Snippet()
    mainContainer = @rowSnippet.containers["main"]
    mainContainer.append(titleSnippet)
    expect(mainContainer.first).toEqual(titleSnippet)

  it "should append a snippet to the main column via snippet", ->
    titleSnippet = test.getH1Snippet()
    @rowSnippet.append("main", titleSnippet)

    mainContainer = @rowSnippet.containers["main"]
    expect(mainContainer.first).toEqual(titleSnippet)

  it "appended snippet should have a parent snippet", ->
    titleSnippet = test.getH1Snippet()
    @rowSnippet.append("main", titleSnippet)
    expect( titleSnippet.getParent() ).toEqual(@rowSnippet)


  it "each() should visit the row snippet", ->
    visits = 0
    @tree.each ->
      visits += 1
    expect(visits).toEqual(1)

  it "each() should visit the row snippet", ->
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



