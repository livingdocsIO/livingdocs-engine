SnippetTree = require('../../../src/snippet_tree/snippet_tree')
SnippetModel = require('../../../src/snippet_tree/snippet_model')
SnippetContainer = require('../../../src/snippet_tree/snippet_container')

describe 'SnippetTree', ->

  beforeEach ->
    @tree = new SnippetTree()


  it 'has a SnippetContainer as root', ->
    expect(@tree.root).to.be.an.instanceof(SnippetContainer)


  describe 'append()', ->

    it 'sets snippetTree property of the appended snippet', ->
      snippet = test.getSnippet('title')
      @tree.append(snippet)
      expect(snippet.snippetTree).to.equal(@tree)


    it 'appends a snippet to root', ->
      snippet = test.getSnippet('title')
      @tree.append(snippet)
      expect(@tree.root.first).to.equal(snippet)
      expect(@tree.root.last).to.equal(snippet)


describe 'SnippetTree with two snippets', ->

  beforeEach ->
    @tree = new SnippetTree()

    @snippetA = test.getSnippet('title')
    @tree.append(@snippetA)

    @snippetB = test.getSnippet('title')
    @tree.append(@snippetB)


  it 'has previous and next properties of snippet set', ->
    expect(@snippetA.previous).to.be.undefined
    expect(@snippetA.next).to.equal(@snippetB)


  it 'has first and last pointer of root set', ->
    expect(@tree.root.first).to.equal(@snippetA)
    expect(@tree.root.last).to.equal(@snippetB)


  it 'has linked snippets correctly', ->
    expect(@tree.root.first.previous).to.be.undefined
    expect(@tree.root.first.next).to.equal(@snippetB)
    expect(@tree.root.last.previous).to.equal(@snippetA)
    expect(@tree.root.last.next).to.be.undefined


  describe 'up()', ->

    it 'moves the second snippet up', ->
      @snippetB.up()

      expect(@snippetB.previous).to.be.undefined
      expect(@snippetB.next).to.equal(@snippetA)

      expect(@snippetA.previous).to.equal(@snippetB)
      expect(@snippetA.next).to.be.undefined


    it 'updates the first and last pointers of the container', ->
      @snippetB.up()

      expect(@tree.root.first).to.equal(@snippetB)
      expect(@tree.root.last).to.equal(@snippetA)


  describe 'remove()', ->

    it 'removes the second Snippet', ->
      @snippetB.remove()

      expect(@snippetA.previous).to.be.undefined
      expect(@snippetA.next).to.be.undefined

      expect(@tree.root.first).to.equal(@snippetA)
      expect(@tree.root.last).to.equal(@snippetA)

      expect(@snippetB.parentContainer).to.be.undefined
      expect(@snippetB.snippetTree).to.be.undefined
      expect(@snippetB.previous).to.be.undefined
      expect(@snippetB.next).to.be.undefined


  describe 'inserting the second snippet after the first', ->

    it 'is ignored', ->
      @snippetA.after(@snippetB)
      expect(@snippetA.previous).to.be.undefined
      expect(@snippetA.next).to.equal(@snippetB)
      expect(@snippetB.previous).to.equal(@snippetA)
      expect(@snippetB.next).to.be.undefined


  describe 'inserting the first snippet before the second', ->

    it 'is ignored', ->
      @snippetB.before(@snippetA)
      expect(@snippetA.previous).to.be.undefined
      expect(@snippetA.next).to.equal(@snippetB)
      expect(@snippetB.previous).to.equal(@snippetA)
      expect(@snippetB.next).to.be.undefined


describe 'SnippetTree with a single-column row snippet', ->

  beforeEach ->
    @tree = new SnippetTree()
    @container = test.getSnippet('container')
    @defaultName = config.directives.container.defaultName
    @tree.append(@container)


  describe 'append()', ->

    it 'adds a snippet to the single column via the snippetContainer', ->
      titleSnippet = test.getSnippet('title')
      mainContainer = @container.containers[@defaultName]
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getSnippet('title')
      @container.append(titleSnippet)
      mainContainer = @container.containers[@defaultName]
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getSnippet('title')
      @container.append(titleSnippet)
      expect( titleSnippet.getParent() ).to.equal(@container)



describe 'SnippetTree with a multi-column row snippet', ->

  beforeEach ->
    @tree = new SnippetTree()
    @rowSnippet = test.getSnippet('row')
    @tree.append(@rowSnippet)


  describe 'append()', ->

    it 'adds a snippet to the main column via the snippetContainer', ->
      titleSnippet = test.getSnippet('title')
      mainContainer = @rowSnippet.containers['main']
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getSnippet('title')
      @rowSnippet.append('main', titleSnippet)

      mainContainer = @rowSnippet.containers['main']
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getSnippet('title')
      @rowSnippet.append('main', titleSnippet)
      expect( titleSnippet.getParent() ).to.equal(@rowSnippet)


  describe 'each()', ->

    it 'visits the row snippet', ->
      visits = 0
      @tree.each ->
        visits += 1
      expect(visits).to.equal(1)


    it 'visits the row snippet and its children', ->
      # add 2 snippets to main container
      for num in [0..2]
        @rowSnippet.append('main', test.getSnippet('title'))

      # add 3 snippets to sidebar container
      for num in [0..1]
        @rowSnippet.append('sidebar', test.getSnippet('title'))

      visits = 0
      @tree.each ->
        visits += 1

      # check that all 6 snippets where visited by each
      expect(visits).to.equal(6)


  describe 'eachContainer()', ->

    it 'visits all containers', ->
      visits = 0
      @tree.eachContainer ->
        visits += 1

      expect(visits).to.equal(3)


  describe 'all()', ->

    it 'visits all snippets and containers', ->
      visitedSnippets = 0
      visitedContainers = 0
      @tree.all (snippetOrContainer) ->
        if snippetOrContainer instanceof SnippetModel
          visitedSnippets += 1
        else if snippetOrContainer instanceof SnippetContainer
          visitedContainers += 1

      expect(visitedSnippets).to.equal(1)
      expect(visitedContainers).to.equal(3)


describe 'SnippetTree with three levels', ->

  beforeEach ->
    @tree = new SnippetTree()
    @row = test.getSnippet('row')
    @rowInMain = test.getSnippet('row')
    @title = test.getSnippet('title')
    @text = test.getSnippet('text')

    @tree.append(@row)
    @row.append('main', @rowInMain)
    @row.append('main', @title)
    @rowInMain.append('sidebar', @text)

    # Thats how the snippet tree looks now:
    # -row
    #   main:
    #     -rowInMain
    #       sidebar:
    #         -text
    #     -title


  describe 'each()', ->

    it 'visits all containers in the right order', ->
      visitedSnippets = []
      @tree.each (snippet) ->
        visitedSnippets.push(snippet)

      # snippets should be traversed in order of appearance
      expect(visitedSnippets.length).to.equal(4)
      expect(visitedSnippets[0]).to.equal(@row)
      expect(visitedSnippets[1]).to.equal(@rowInMain)
      expect(visitedSnippets[2]).to.equal(@text)
      expect(visitedSnippets[3]).to.equal(@title)


describe 'SnippetTree with three snippets', ->

  beforeEach ->
    @tree = new SnippetTree()
    @snippets = []
    for index in [0..2]
      @snippets[index] = test.getSnippet('text')
      @tree.append(@snippets[index])


  # regression test for https://github.com/upfrontIO/livingdocs-engine/issues/13
  it 'moving the last snippet one up does not currupt the snippet tree', ->
    @snippets[2].up()
    visitedSnippets = []
    @tree.each (snippet) ->
      visitedSnippets.push(snippet)

    expect(visitedSnippets.length).to.equal(3)
    expect(visitedSnippets[0]).to.equal(@snippets[0])
    expect(visitedSnippets[1]).to.equal(@snippets[2])
    expect(visitedSnippets[2]).to.equal(@snippets[1])
