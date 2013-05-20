# SnippetTree
# -----------

describe "SnippetTree", ->

  beforeEach ->
    @tree = new SnippetTree()

  it "should instantiate", ->
    expect(@tree instanceof SnippetTree).toBe(true)

  it "should have a SnippetContainer as root", ->
    expect(@tree.root instanceof SnippetContainer).toBe(true)

  it "append() should set snippetTreeNode property of the appended snippet", ->
    snippet = test.getH1Snippet()
    @tree.append(snippet)
    expect(snippet.snippetTreeNode).toBeDefined()
    expect(snippet.snippetTreeNode.snippetTree).toEqual(@tree)

  it "append() should append a snippet to root", ->
    snippet = test.getH1Snippet()
    @tree.append(snippet)
    expect(@tree.root.first).toEqual(snippet.snippetTreeNode)
    expect(@tree.root.last).toEqual(snippet.snippetTreeNode)


describe "SnippetTree with two snippets", ->

  beforeEach ->
    @tree = new SnippetTree()

    @firstSnippet = test.getH1Snippet()
    @tree.append(@firstSnippet)
    @treeNodeA = @firstSnippet.snippetTreeNode

    @secondSnippet = test.getH1Snippet()
    @tree.append(@secondSnippet)
    @treeNodeB = @secondSnippet.snippetTreeNode

  it "should set properties of snippetTreeNdoe", ->
    expect(@treeNodeA instanceof SnippetTreeNode).toBe(true)
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







