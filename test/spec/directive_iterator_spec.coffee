describe 'DirectiveIterator', ->

  beforeEach ->
    @html = $(
      """
      <div class="#{ docClass.snippet }">
        <!-- Adding a comment node so we have another nodeType in play -->
        <h1 #{ docAttr.editable }="title"></h1>
        <div #{ docAttr.container }="children">
          <!-- This should not be traversed -->
          <h1 class="#{ docClass.snippet }" #{ docAttr.editable }="title"></h1>
        </div>
      </div>
      """
    )[0]

    @iterator = new DirectiveIterator(@html)


  it 'searches only through snippet and not descendant nodes', ->
    visitedElements = 0
    visitedComments = 0
    while @iterator.next()
      if @iterator.current.nodeType == Node.ELEMENT_NODE
        visitedElements += 1
      if @iterator.current.nodeType == Node.COMMENT_NODE
        visitedComments += 1

    expect(visitedElements).toEqual(3)
    expect(visitedComments).toEqual(1)


  it 'domNode.hasAttribute works', ->
    foundEditables = 0
    while @iterator.next()
      node = @iterator.current
      if node.nodeType == 1 && node.hasAttribute(docAttr.editable)
        foundEditables += 1

    expect(foundEditables).toEqual(1)


  describe '#nextElement()', ->

    it 'iterates only over element nodes', ->
      traversedNodes = 0
      while @iterator.nextElement()
        expect(@iterator.current.nodeType).toEqual(1)
        traversedNodes += 1

      expect(traversedNodes).toEqual(3)
