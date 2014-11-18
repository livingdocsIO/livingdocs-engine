DirectiveCollection = require('../../../src/template/directive_collection')
Directive = require('../../../src/template/directive')
directiveFinder = require('../../../src/template/directive_finder')

describe 'directive_finder:', ->

  beforeEach ->
    @collection = new DirectiveCollection()
    @collection.add new Directive
      name: 'text'
      type: 'editable'


  it 'links element with directive', ->
    elem = test.createElem("<div #{ test.editableAttr }='text'></div>")
    expect(@collection[0].elem).to.be.undefined
    directiveFinder.link(elem, @collection)
    expect(@collection[0].elem).to.equal(elem)
