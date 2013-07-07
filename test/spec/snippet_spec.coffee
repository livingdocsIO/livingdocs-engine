describe 'Title Snippet', ->

  beforeEach ->
    @title = test.getSnippet('title')


  it 'instantiates from template', ->
    expect(@title).toBeDefined()


  it 'has an identifier', ->
    expect(@title.identifier).toEqual('test.title')


  it 'has an id', ->
    expect(@title.id).toBeDefined()
    expect(typeof @title.id == 'string').toBeTruthy()
    expect(@title.id.length).toBeGreaterThan(10)


  it 'has no containers', ->
    expect(@title.containers).not.toBeDefined()


  it 'has no next or previous', ->
    expect(@title.next).not.toBeDefined()
    expect(@title.previous).not.toBeDefined()


  it 'has one editable named "title"', ->
    expect( test.size(@title.editables) ).toEqual(1)
    expect( @title.editables.hasOwnProperty('title') ).toEqual(true)


  it 'title editable has no value at the beginning', ->
    expect(@title.editables['title']).not.toBeDefined()


  describe '#set()', ->

    it 'sets editable content', ->
      caption = 'Talk to the hand'
      @title.set('title', caption)
      expect(@title.get('title')).toEqual(caption)


describe 'Row Snippet', ->

  beforeEach ->
    @row = test.getSnippet('row')


  it 'has an identifier', ->
    expect(@row.identifier).toEqual('test.row')


  it 'has two containers named main and sidebar', ->
    expect( test.size(@row.containers)).toEqual(2)
    expect(@row.containers.hasOwnProperty('main')).toEqual(true)
    expect(@row.containers.hasOwnProperty('sidebar')).toEqual(true)


  it 'has no editables', ->
    expect(@row.editables).not.toBeDefined()


describe 'Container Snippet', ->

  beforeEach ->
    @container = test.getSnippet('container')


  it 'has named its unnamed container to the default', ->
    expect(@container.containers[templateAttr.defaultValues.container]).toBeDefined()


