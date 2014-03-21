require('../../../src/browser_api')

describe 'Browser API', ->
  afterEach ->
    docs.design.resetCache()


  describe 'Global variable', ->

    it 'defines the global variable docs', ->
      expect(window.docs).to.exist


  describe 'design', ->

    it 'loads a design snchronously', ->
      expect(docs.design.has('test')).to.be.false
      docs.design.load(test.designJson)
      expect(docs.design.has('test')).to.be.true


  describe 'new', ->
    beforeEach ->
      @snippetTree = test.createSnippetTree
        title: { title: 'It Works' }
      @data = @snippetTree.serialize()


    it 'creates a new empty document', ->
      docs.design.load(test.designJson)
      document = docs.new(design: 'test')
      firstSnippet = document.snippetTree.first()
      expect(firstSnippet).to.be.undefined


    it 'creates a new document from data', ->
      docs.design.load(test.designJson)
      document = docs.new(data: @data)
      firstSnippet = document.snippetTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')

