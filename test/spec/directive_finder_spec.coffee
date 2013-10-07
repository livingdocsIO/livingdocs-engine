describe 'DirectiveFinder', ->

  beforeEach ->
    @collection = new DirectiveCollection()
    @collection.add new Directive
      name: 'text'
      type: 'editable'


  it 'links element with directive', ->
    elem = test.createElem("<div #{ test.editableAttr }='text'></div>")
    expect(@collection[0].elem).toBeUndefined()
    directiveFinder.link(elem, @collection)
    expect(@collection[0].elem).toBe(elem)
