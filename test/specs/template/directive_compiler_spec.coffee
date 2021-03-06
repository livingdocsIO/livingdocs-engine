$ = require('jquery')
directiveCompiler = require('../../../src/template/directive_compiler')
config = test.config

describe 'directive_compiler:', ->

  describe 'node without attributes', ->

    beforeEach ->
      @elem = $('<div>')[0]
      @directives = directiveCompiler.parse(@elem)


    it 'is not a data node', ->
      expect(@directives.length).to.equal(0)


  describe 'container node', ->

    beforeEach ->
      @elem = $("<div #{ config.directives.container.attr }='children' />")[0]
      @directives = directiveCompiler.parse(@elem)


    it 'is Directive', ->
      expect(@directives.length).to.equal(1)


    it 'is of type container', ->
      expect(@directives[0].type).to.equal('container')


  describe 'convert template attributes into rendered attributes', ->

    it 'unifies attribute naming style', ->
      nude = $("<div #{ config.directives.container.attr }='field' />")[0]
      x =    $("<div x-#{ config.directives.container.attr }='field' />")[0]
      data = $("<div data-#{ config.directives.container.attr }='field' />")[0]
      for node in [nude, x, data]
        directive = directiveCompiler.parse(node)[0]
        expect(directive.elem.hasAttribute(test.containerAttr)).to.be.ok


  describe 'nodes with different attribute naming styles', ->

    it 'finds data- prepended editable', ->
      elem = $("<div data-#{ config.directives.editable.attr }='data' />")[0]
      directive = directiveCompiler.parse(elem)[0]
      expect(directive.type).to.equal('editable')
      expect(directive.name).to.equal('data')


    it 'finds x- prepended editable', ->
      elem = $("<div x-#{ config.directives.editable.attr }='x' />")[0]
      directive = directiveCompiler.parse(elem)[0]
      expect(directive.type).to.equal('editable')
      expect(directive.name).to.equal('x')


  describe 'optional directive', ->

    beforeEach ->
      elem = test.createElem """
        <div #{ config.directives.editable.attr }='text'
        #{ config.directives.optional.attr } />
        """
      @directive = directiveCompiler.parse(elem)[0]


    it 'detects a doc-optional directive', ->
      expect(@directive.optional).to.equal(true)


    it 'removes the doc-optional directive attribute', ->
      expected = "<div #{ test.editableAttr }='text'></div>"
      expect(@directive.elem).to.have.same.html(expected)


