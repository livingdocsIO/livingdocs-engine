DirectiveIterator = require('../../../src/template/directive_iterator')
config = test.config
css = config.css

describe 'directive_iterator:', ->

  describe 'for a component with multiple directives', ->

    beforeEach ->
      @html = test.createElem """
        <div class="#{ css.component }">
          <!-- Adding a comment node so we have another nodeType in play -->
          <h1 #{ test.editableAttr }="title"></h1>
          <div #{ test.containerAttr }="children">
            <!-- This should not be traversed -->
            <h1 class="#{ css.component }" #{ test.editableAttr }="title"></h1>
          </div>
        </div>
        """

      @iterator = new DirectiveIterator(@html)


    it 'searches only through component and not descendant nodes', ->
      visitedElements = 0
      visitedComments = 0
      while @iterator.next()
        if @iterator.current.nodeType == 1 # Node.ELEMENT_NODE
          visitedElements += 1
        if @iterator.current.nodeType == 8 # Node.COMMENT_NODE
          visitedComments += 1

      expect(visitedElements).to.equal(3)
      expect(visitedComments).to.equal(1)


    it 'domNode.hasAttribute works', ->
      foundEditables = 0
      while @iterator.next()
        node = @iterator.current
        if node.nodeType == 1 && node.hasAttribute(test.editableAttr)
          foundEditables += 1

      expect(foundEditables).to.equal(1)


    describe '#nextElement()', ->

      it 'iterates only over element nodes', ->
        traversedNodes = 0
        while @iterator.nextElement()
          expect(@iterator.current.nodeType).to.equal(1)
          traversedNodes += 1

        expect(traversedNodes).to.equal(3)


  describe 'template with directive attributes without a "data-" prefix', ->

    beforeEach ->
      htmlAttr = config.directives['html'].attr
      editableAttr = config.directives['editable'].attr
      @html = test.createElem """
        <div #{ htmlAttr }="source">
          <h1 #{ editableAttr }="title">HMTL Freeform Title</h1>
          <span class="html-placeholder">placholder text</span>
        </div>
        """

      @iterator = new DirectiveIterator(@html)


    it 'does not traverse inside of the doc-html directive', ->
      visitedElements = 0
      while @iterator.next()
        if @iterator.current.nodeType == 1 # Node.ELEMENT_NODE
          visitedElements += 1

      expect(visitedElements).to.equal(1)
