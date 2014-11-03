SnippetTree = require('../../../src/snippet_tree/snippet_tree')
SnippetModel = require('../../../src/snippet_tree/snippet_model')
SnippetContainer = require('../../../src/snippet_tree/snippet_container')

describe 'SnippetTree', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')


  it 'has a SnippetContainer as root', ->
    expect(@componentTree.root).to.be.an.instanceof(SnippetContainer)


  describe 'append()', ->

    it 'sets componentTree property of the appended snippet', ->
      snippet = test.getSnippet('title')
      @componentTree.append(snippet)
      expect(snippet.componentTree).to.equal(@componentTree)


    it 'appends a snippet to root', ->
      snippet = test.getSnippet('title')
      @componentTree.append(snippet)
      expect(@componentTree.first()).to.equal(snippet)
      expect(@componentTree.root.last).to.equal(snippet)


describe 'SnippetTree with two snippets', ->

  beforeEach ->
    @componentTree = test.createSnippetTree [
      title: undefined
    ,
      title: undefined
    ]
    @snippetA = @componentTree.first()
    @snippetB = @snippetA.next


  it 'has previous and next properties of snippet set', ->
    expect(@snippetA.previous).to.be.undefined
    expect(@snippetA.next).to.equal(@snippetB)


  it 'has first and last pointer of root set', ->
    expect(@componentTree.first()).to.equal(@snippetA)
    expect(@componentTree.root.last).to.equal(@snippetB)


  it 'has linked snippets correctly', ->
    expect(@componentTree.first().previous).to.be.undefined
    expect(@componentTree.first().next).to.equal(@snippetB)
    expect(@componentTree.root.last.previous).to.equal(@snippetA)
    expect(@componentTree.root.last.next).to.be.undefined


  describe 'up()', ->

    it 'moves the second snippet up', ->
      @snippetB.up()

      expect(@snippetB.previous).to.be.undefined
      expect(@snippetB.next).to.equal(@snippetA)

      expect(@snippetA.previous).to.equal(@snippetB)
      expect(@snippetA.next).to.be.undefined


    it 'updates the first and last pointers of the container', ->
      @snippetB.up()

      expect(@componentTree.first()).to.equal(@snippetB)
      expect(@componentTree.root.last).to.equal(@snippetA)


  describe 'remove()', ->

    it 'removes the second Snippet', ->
      @snippetB.remove()

      expect(@snippetA.previous).to.be.undefined
      expect(@snippetA.next).to.be.undefined

      expect(@componentTree.first()).to.equal(@snippetA)
      expect(@componentTree.root.last).to.equal(@snippetA)

      expect(@snippetB.parentContainer).to.be.undefined
      expect(@snippetB.componentTree).to.be.undefined
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
    { @componentTree } = getInstances('componentTree')
    @container = test.getSnippet('container')
    @defaultName = config.directives.container.defaultName
    @componentTree.append(@container)


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
    { @componentTree } = getInstances('componentTree')
    @rowSnippet = test.getSnippet('row')
    @componentTree.append(@rowSnippet)


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
      @componentTree.each ->
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
      @componentTree.each ->
        visits += 1

      # check that all 6 snippets where visited by each
      expect(visits).to.equal(6)


  describe 'eachContainer()', ->

    it 'visits all containers', ->
      visits = 0
      @componentTree.eachContainer ->
        visits += 1

      expect(visits).to.equal(3)


  describe 'all()', ->

    it 'visits all snippets and containers', ->
      visitedSnippets = 0
      visitedContainers = 0
      @componentTree.all (snippetOrContainer) ->
        if snippetOrContainer instanceof SnippetModel
          visitedSnippets += 1
        else if snippetOrContainer instanceof SnippetContainer
          visitedContainers += 1

      expect(visitedSnippets).to.equal(1)
      expect(visitedContainers).to.equal(3)


describe 'SnippetTree with three levels', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @row = test.getSnippet('row')
    @rowInMain = test.getSnippet('row')
    @title = test.getSnippet('title')
    @text = test.getSnippet('text')

    @componentTree.append(@row)
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
      @componentTree.each (snippet) ->
        visitedSnippets.push(snippet)

      # snippets should be traversed in order of appearance
      expect(visitedSnippets.length).to.equal(4)
      expect(visitedSnippets[0]).to.equal(@row)
      expect(visitedSnippets[1]).to.equal(@rowInMain)
      expect(visitedSnippets[2]).to.equal(@text)
      expect(visitedSnippets[3]).to.equal(@title)


describe 'SnippetTree with three snippets', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @snippets = []
    for index in [0..2]
      @snippets[index] = test.getSnippet('text')
      @componentTree.append(@snippets[index])


  # regression test for https://github.com/upfrontIO/livingdocs-engine/issues/13
  it 'moving the last snippet one up does not currupt the snippet tree', ->
    @snippets[2].up()
    visitedSnippets = []
    @componentTree.each (snippet) ->
      visitedSnippets.push(snippet)

    expect(visitedSnippets.length).to.equal(3)
    expect(visitedSnippets[0]).to.equal(@snippets[0])
    expect(visitedSnippets[1]).to.equal(@snippets[2])
    expect(visitedSnippets[2]).to.equal(@snippets[1])
