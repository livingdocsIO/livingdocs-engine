Livingdoc = require('../../../src/livingdoc')

describe 'livingdoc:', ->

  beforeEach ->
    { @componentTree } = test.get('componentTree')
    @doc = new Livingdoc({ @componentTree })


  describe 'instantiation', ->

    it 'creates a new livingdoc', ->
      expect(@doc).to.be.an.instanceof(Livingdoc)


  describe 'events', ->

    it 'emits a change event', (done) ->
      @doc.on 'change', ->
        done()

      component = test.getComponent('title')
      @componentTree.append(component)


  describe 'serialize()', ->

    it 'serializes an empty livingdoc', ->
      expect(@doc.serialize()).to.deep.equal
        content: []
        design:
          name: 'test'


    it 'serializes a minimal livingdoc', ->
      model = test.getComponent('title')
      model.set('title', 'It Works')
      @componentTree.append(model)
      data = @doc.serialize()
      expect(data.content.length).to.equal(1)


  describe 'toHtml()', ->

    it 'renders an empty livingdoc', ->
      expect(@doc.toHtml()).to.equal('')


    it 'renders a minimal livingdoc', ->
      model = test.getComponent('title')
      model.set('title', 'It Works')
      @componentTree.append(model)
      expect(@doc.toHtml()).to.have.same.html """
        <h1>It Works</h1>"""


  describe 'toJson()', ->

    it 'renders an empty livingdoc', ->
      expect(@doc.toJson()).to.equal(
        '{"content":[],"design":{"name":"test"}}')


    it 'renders an empty livingdoc with prettify', ->
      expect(@doc.toJson('prettify')).to.contain('\n  ')


describe 'livingdoc of two components tree:', ->

  beforeEach ->
    componentTree = test.createComponentTree [
      hero: { title: 'Hero Title' },
      title: { title: 'Title Title' }
    ]
    @doc = new Livingdoc({ componentTree })


