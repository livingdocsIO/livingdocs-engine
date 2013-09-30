describe 'DirectiveParser', ->

  describe 'node without attributes', ->

    beforeEach ->
      @elem = $('<div/>')[0]
      @directive = directiveParser.parse(@elem)


    it 'is not a data node', ->
      expect(@directive).toBeUndefined()


  describe 'container node', ->

    beforeEach ->
      @elem = $("<div #{ templateAttr.container } />")[0]
      @directive = directiveParser.parse(@elem)


    it 'is Directive', ->
      expect(@directive).toBeDefined()


    it 'is of type container', ->
      expect(@directive.type).toEqual('container')


  describe 'convert template attributes into rendered attributes', ->

    it 'unifies attribute naming style', ->
      @nude = $("<div #{ config.directives.container.attr } />")[0]
      @x =    $("<div x-#{ config.directives.container.attr } />")[0]
      @data = $("<div data-#{ config.directives.container.attr } />")[0]
      for node in [@nude, @x, @data]
        directive = directiveParser.parse(node)
        expect(directive.elem.hasAttribute(test.containerAttr)).toBeTruthy()


  describe 'nodes with different attribute naming styles', ->

    it 'finds data- prepended editable', ->
      @elem = $("<div data-#{ config.directives.editable.attr } />")[0]
      directive = directiveParser.parse(@elem)
      expect(directive.type).toEqual('editable')


    it 'finds x- prepended editable', ->
      @elem = $("<div x-#{ config.directives.editable.attr } />")[0]
      directive = directiveParser.parse(@elem)
      expect(directive.type).toEqual('editable')


  # describe 'type', ->

  #   it 'uses the key of the attribute constant as the type', ->
  #     templateAttrLookup['doc-bar'] = 'foo'
  #     elem = $('<div doc-bar />')[0]
  #     directive = directiveParser.parse(elem)
  #     delete templateAttrLookup.foo

  #     expect(directive.type).toBe('foo')
