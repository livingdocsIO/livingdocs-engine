require('../../../src/browser_api_proposal')

describe 'Browser API', ->
  afterEach ->
    doc.design.resetCache()


  describe 'Global variable', ->

    it 'defines the global variable doc', ->
      expect(window.doc).to.exist


  describe 'design', ->

    it 'loads a design snchronously', ->
      expect(doc.design.has('test')).to.be.false
      doc.design.load(test.designJson)
      expect(doc.design.has('test')).to.be.true


  describe 'new', ->
    beforeEach ->
      @snippetTree = test.createSnippetTree
        title: { title: 'It Works' }
      @data = @snippetTree.serialize()


    it 'creates a new document', ->
      doc.design.load(test.designJson)
      document = doc.new(data: @data)
      firstSnippet = document.snippetTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')

