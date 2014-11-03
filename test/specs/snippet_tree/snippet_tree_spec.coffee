ComponentTree = require('../../../src/component_tree/component_tree')
ComponentModel = require('../../../src/component_tree/component_model')
ComponentContainer = require('../../../src/component_tree/component_container')

describe 'ComponentTree', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')


  it 'has a ComponentContainer as root', ->
    expect(@componentTree.root).to.be.an.instanceof(ComponentContainer)


  describe 'append()', ->

    it 'sets componentTree property of the appended snippet', ->
      snippet = test.getComponent('title')
      @componentTree.append(snippet)
      expect(snippet.componentTree).to.equal(@componentTree)


    it 'appends a snippet to root', ->
      snippet = test.getComponent('title')
      @componentTree.append(snippet)
      expect(@componentTree.first()).to.equal(snippet)
      expect(@componentTree.root.last).to.equal(snippet)


describe 'ComponentTree with two snippets', ->

  beforeEach ->
    @componentTree = test.createComponentTree [
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


describe 'ComponentTree with a single-column row snippet', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @container = test.getComponent('container')
    @defaultName = config.directives.container.defaultName
    @componentTree.append(@container)


  describe 'append()', ->

    it 'adds a snippet to the single column via the componentContainer', ->
      titleSnippet = test.getComponent('title')
      mainContainer = @container.containers[@defaultName]
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getComponent('title')
      @container.append(titleSnippet)
      mainContainer = @container.containers[@defaultName]
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getComponent('title')
      @container.append(titleSnippet)
      expect( titleSnippet.getParent() ).to.equal(@container)



describe 'ComponentTree with a multi-column row snippet', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @rowSnippet = test.getComponent('row')
    @componentTree.append(@rowSnippet)


  describe 'append()', ->

    it 'adds a snippet to the main column via the componentContainer', ->
      titleSnippet = test.getComponent('title')
      mainContainer = @rowSnippet.containers['main']
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getComponent('title')
      @rowSnippet.append('main', titleSnippet)

      mainContainer = @rowSnippet.containers['main']
      expect(mainContainer.first).to.equal(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getComponent('title')
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
        @rowSnippet.append('main', test.getComponent('title'))

      # add 3 snippets to sidebar container
      for num in [0..1]
        @rowSnippet.append('sidebar', test.getComponent('title'))

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
      visitedComponents = 0
      visitedContainers = 0
      @componentTree.all (snippetOrContainer) ->
        if snippetOrContainer instanceof ComponentModel
          visitedComponents += 1
        else if snippetOrContainer instanceof ComponentContainer
          visitedContainers += 1

      expect(visitedComponents).to.equal(1)
      expect(visitedContainers).to.equal(3)


describe 'ComponentTree with three levels', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @row = test.getComponent('row')
    @rowInMain = test.getComponent('row')
    @title = test.getComponent('title')
    @text = test.getComponent('text')

    @componentTree.append(@row)
    @row.append('main', @rowInMain)
    @row.append('main', @title)
    @rowInMain.append('sidebar', @text)

    # Thats how the componentTree looks now:
    # -row
    #   main:
    #     -rowInMain
    #       sidebar:
    #         -text
    #     -title


  describe 'each()', ->

    it 'visits all containers in the right order', ->
      visitedComponents = []
      @componentTree.each (snippet) ->
        visitedComponents.push(snippet)

      # snippets should be traversed in order of appearance
      expect(visitedComponents.length).to.equal(4)
      expect(visitedComponents[0]).to.equal(@row)
      expect(visitedComponents[1]).to.equal(@rowInMain)
      expect(visitedComponents[2]).to.equal(@text)
      expect(visitedComponents[3]).to.equal(@title)


describe 'ComponentTree with three snippets', ->

  beforeEach ->
    { @componentTree } = getInstances('componentTree')
    @snippets = []
    for index in [0..2]
      @snippets[index] = test.getComponent('text')
      @componentTree.append(@snippets[index])


  # regression test for https://github.com/upfrontIO/livingdocs-engine/issues/13
  it 'moving the last snippet one up does not currupt the componentTree', ->
    @snippets[2].up()
    visitedComponents = []
    @componentTree.each (snippet) ->
      visitedComponents.push(snippet)

    expect(visitedComponents.length).to.equal(3)
    expect(visitedComponents[0]).to.equal(@snippets[0])
    expect(visitedComponents[1]).to.equal(@snippets[2])
    expect(visitedComponents[2]).to.equal(@snippets[1])
