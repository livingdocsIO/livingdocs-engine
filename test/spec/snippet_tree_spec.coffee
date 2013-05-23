# SnippetTree
# -----------

describe "SnippetTree", ->

  beforeEach ->
    @tree = new SnippetTree()

  it "should instantiate", ->
    expect(@tree instanceof SnippetTree).toBe(true)

  it "should have a SnippetContainer as root", ->
    expect(@tree.root instanceof SnippetContainer).toBe(true)

  it "append() should set snippetNode property of the appended snippet", ->
    snippet = test.getH1Snippet()
    @tree.append(snippet)
    expect(snippet.snippetNode).toBeDefined()
    expect(snippet.snippetNode.snippetTree).toEqual(@tree)

  it "append() should append a snippet to root", ->
    snippet = test.getH1Snippet()
    @tree.append(snippet)
    expect(@tree.root.first).toEqual(snippet.snippetNode)
    expect(@tree.root.last).toEqual(snippet.snippetNode)


describe "SnippetTree with two snippets", ->

  beforeEach ->
    @tree = new SnippetTree()

    @firstSnippet = test.getH1Snippet()
    @tree.append(@firstSnippet)
    @treeNodeA = @firstSnippet.snippetNode

    @secondSnippet = test.getH1Snippet()
    @tree.append(@secondSnippet)
    @treeNodeB = @secondSnippet.snippetNode

  it "should set properties of snippetTreeNdoe", ->
    expect(@treeNodeA instanceof SnippetNode).toBe(true)
    expect(@treeNodeA.previous).not.toBeDefined()
    expect(@treeNodeA.next).toEqual(@treeNodeB)

  it "should update first and last pointer of the container", ->
    expect(@tree.root.first).toEqual(@treeNodeA)
    expect(@tree.root.last).toEqual(@treeNodeB)

  it "should be linked correctly", ->
    expect(@tree.root.first.previous).not.toBeDefined()
    expect(@tree.root.first.next).toEqual(@treeNodeB)
    expect(@tree.root.last.previous).toEqual(@treeNodeA)
    expect(@tree.root.last.next).not.toBeDefined()

  it "up() should move the second snippet up", ->
    @treeNodeB.up()

    expect(@treeNodeB.previous).not.toBeDefined()
    expect(@treeNodeB.next).toEqual(@treeNodeA)

    expect(@treeNodeA.previous).toEqual(@treeNodeB)
    expect(@treeNodeA.next).not.toBeDefined()

  it "up() should update first and last pointers of the container", ->
    @treeNodeB.up()

    expect(@tree.root.first).toEqual(@treeNodeB)
    expect(@tree.root.last).toEqual(@treeNodeA)

  it "unlink() should remove the second TreeNode", ->
    @treeNodeB.unlink()

    expect(@treeNodeA.previous).not.toBeDefined()
    expect(@treeNodeA.next).not.toBeDefined()

    expect(@tree.root.first).toEqual(@treeNodeA)
    expect(@tree.root.last).toEqual(@treeNodeA)

    expect(@treeNodeB.parentContainer).not.toBeDefined()
    expect(@treeNodeB.snippetTree).not.toBeDefined()
    expect(@treeNodeB.previous).not.toBeDefined()
    expect(@treeNodeB.next).not.toBeDefined()


describe "SnippetTree with a row snippet", ->

  beforeEach ->
    @tree = new SnippetTree()

    @rowSnippet = test.getRowSnippet()
    @tree.append(@rowSnippet)
    @treeNodeRow = @rowSnippet.snippetNode

  it "should append a snippet to the main column via the snippetContainer", ->
    titleSnippet = test.getH1Snippet()
    mainContainer = @treeNodeRow.containers["main"]
    mainContainer.append(titleSnippet)
    expect(mainContainer.first).toEqual(titleSnippet.snippetNode)

  it "should append a snippet to the main column via snippet", ->
    titleSnippet = test.getH1Snippet()
    @rowSnippet.append("main", titleSnippet)

    mainContainer = @treeNodeRow.containers["main"]
    expect(mainContainer.first).toEqual(titleSnippet.snippetNode)

  it "appended snippet should have a parent snippet", ->
    titleSnippet = test.getH1Snippet()
    @rowSnippet.append("main", titleSnippet)
    expect( titleSnippet.parent() ).toEqual(@rowSnippet)




