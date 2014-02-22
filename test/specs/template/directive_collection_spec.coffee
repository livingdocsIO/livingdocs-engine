DirectiveCollection = require('../../../src/template/directive_collection')
Directive = require('../../../src/template/directive')

describe 'DirectiveCollection', ->

  describe 'with one directive', ->
    beforeEach ->
      @list = new DirectiveCollection()
      @directive = new Directive (name: 'foo', type: 'editable')
      @list.add(@directive)


    it 'adds the snippet', ->
      expect(@list.all['foo']).to.equal(@directive)


    it 'has a length of one', ->
      expect(@list.length).to.equal(1)


    it 'has one directive of type editable', ->
      expect(@list['editable'].length).to.equal(1)


    it 'makes the directive accessible by a pseudo array', ->
      expect(@list[0]).to.equal(@directive)


    it 'makes the directive accessible by its name', ->
      expect(@list.get('foo')).to.equal(@directive)


    it 'makes the snippet available by its type', ->
      expect(@list.editable['foo']).to.equal(@directive.elem)


    describe 'adding a snippet with a name that is used by another snippet', ->

      it 'throws an error', ->
        node = name: @directive.name, type: 'image'
        expect( => @list.add(node) ).to.throw()


      it 'throws a nice error', ->
        try
          node = name: @directive.name, type: 'image'
          @list.add(node)
        catch error
          expect(error.message).to.contain('data-doc-image')


  describe 'with many directives', ->
    beforeEach ->
      @list = new DirectiveCollection()
      @list.add(new Directive (name: 'A', type: 'editable'))
      @list.add(new Directive (name: 'image', type: 'image'))
      @list.add(new Directive (name: 'B', type: 'editable'))


    describe 'next()', ->

      it 'gets the next directive', ->
        image = @list.get('image')
        expect(@list.next('A')).to.equal(image)


      it 'returns undefined for the last directive', ->
        expect(@list.next('B')).to.be.undefined


    describe 'nextOfType()', ->

      it 'gets the next directive of the same type', ->
        B = @list.get('B')
        expect(@list.nextOfType('A')).to.equal(B)


      it 'returns undefined for the last directive of its type', ->
        expect(@list.nextOfType('image')).to.be.undefined
        expect(@list.nextOfType('B')).to.be.undefined


