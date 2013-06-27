describe 'SnippetTree', ->

  beforeEach ->
    @tree = new SnippetTree()


  it 'has a SnippetContainer as root', ->
    expect(@tree.root instanceof SnippetContainer).toBe(true)


  describe 'append()', ->

    it 'sets snippetTree property of the appended snippet', ->
      snippet = test.getSnippet('title')
      @tree.append(snippet)
      expect(snippet.snippetTree).toEqual(@tree)


    it 'appends a snippet to root', ->
      snippet = test.getSnippet('title')
      @tree.append(snippet)
      expect(@tree.root.first).toEqual(snippet)
      expect(@tree.root.last).toEqual(snippet)


describe 'SnippetTree with two snippets', ->

  beforeEach ->
    @tree = new SnippetTree()

    @snippetA = test.getSnippet('title')
    @tree.append(@snippetA)

    @snippetB = test.getSnippet('title')
    @tree.append(@snippetB)


  it 'has previous and next properties of snippet set', ->
    expect(@snippetA.previous).not.toBeDefined()
    expect(@snippetA.next).toEqual(@snippetB)


  it 'has first and last pointer of root set', ->
    expect(@tree.root.first).toEqual(@snippetA)
    expect(@tree.root.last).toEqual(@snippetB)


  it 'has linked snippets correctly', ->
    expect(@tree.root.first.previous).not.toBeDefined()
    expect(@tree.root.first.next).toEqual(@snippetB)
    expect(@tree.root.last.previous).toEqual(@snippetA)
    expect(@tree.root.last.next).not.toBeDefined()


  describe 'up()', ->

    it 'moves the second snippet up', ->
      @snippetB.up()

      expect(@snippetB.previous).not.toBeDefined()
      expect(@snippetB.next).toEqual(@snippetA)

      expect(@snippetA.previous).toEqual(@snippetB)
      expect(@snippetA.next).not.toBeDefined()


    it 'updates the first and last pointers of the container', ->
      @snippetB.up()

      expect(@tree.root.first).toEqual(@snippetB)
      expect(@tree.root.last).toEqual(@snippetA)


  describe 'remove()', ->

    it 'removes the second Snippet', ->
      @snippetB.remove()

      expect(@snippetA.previous).not.toBeDefined()
      expect(@snippetA.next).not.toBeDefined()

      expect(@tree.root.first).toEqual(@snippetA)
      expect(@tree.root.last).toEqual(@snippetA)

      expect(@snippetB.parentContainer).not.toBeDefined()
      expect(@snippetB.snippetTree).not.toBeDefined()
      expect(@snippetB.previous).not.toBeDefined()
      expect(@snippetB.next).not.toBeDefined()


describe 'SnippetTree with a single-column row snippet', ->

  beforeEach ->
    @tree = new SnippetTree()
    @container = test.getSnippet('container')
    @tree.append(@container)


  describe 'append()', ->

    it 'adds a snippet to the single column via the snippetContainer', ->
      titleSnippet = test.getSnippet('title')
      mainContainer = @container.containers['default']
      mainContainer.append(titleSnippet)
      expect(mainContainer.first).toEqual(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getSnippet('title')
      @container.append(titleSnippet)

      mainContainer = @container.containers['default']
      expect(mainContainer.first).toEqual(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getSnippet('title')
      @container.append(titleSnippet)
      expect( titleSnippet.getParent() ).toEqual(@container)



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
      expect(mainContainer.first).toEqual(titleSnippet)


    it 'adds a snippet to the main column via snippet', ->
      titleSnippet = test.getSnippet('title')
      @rowSnippet.append('main', titleSnippet)

      mainContainer = @rowSnippet.containers['main']
      expect(mainContainer.first).toEqual(titleSnippet)


    it 'the appended snippet has a parent snippet', ->
      titleSnippet = test.getSnippet('title')
      @rowSnippet.append('main', titleSnippet)
      expect( titleSnippet.getParent() ).toEqual(@rowSnippet)


  describe 'each()', ->

    it 'visits the row snippet', ->
      visits = 0
      @tree.each ->
        visits += 1
      expect(visits).toEqual(1)


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
      expect(visits).toEqual(6)


  describe 'eachContainer()', ->

    it 'visits all containers', ->
      visits = 0
      @tree.eachContainer ->
        visits += 1

      expect(visits).toEqual(3)


  describe 'all()', ->

    it 'visits all snippets and containers', ->
      visitedSnippets = 0
      visitedContainers = 0
      @tree.all (snippetOrContainer) ->
        if snippetOrContainer instanceof Snippet
          visitedSnippets += 1
        else if snippetOrContainer instanceof SnippetContainer
          visitedContainers += 1

      expect(visitedSnippets).toEqual(1)
      expect(visitedContainers).toEqual(3)


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
      expect( visitedSnippets.length).toEqual(4)
      expect( visitedSnippets[0] == @row).toBe(true)
      expect( visitedSnippets[1] == @rowInMain).toBe(true)
      expect( visitedSnippets[2] == @text).toBe(true)
      expect( visitedSnippets[3] == @title).toBe(true)


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

    expect( visitedSnippets.length).toEqual(3)
    expect( visitedSnippets[0] == @snippets[0]).toBe(true)
    expect( visitedSnippets[1] == @snippets[2]).toBe(true)
    expect( visitedSnippets[2] == @snippets[1]).toBe(true)
