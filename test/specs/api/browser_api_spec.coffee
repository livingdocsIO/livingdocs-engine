require('../../../src/browser_api')

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


    it 'reseets the design cache', ->
      doc.design.load(test.designJson)
      doc.design.resetCache()
      expect(doc.design.has('test')).to.be.false


    it 'does not load a design twice', ->
      spy = sinon.spy(doc.design, 'add')
      doc.design.load(test.designJson)
      doc.design.load(test.designJson)
      expect(spy.callCount).to.equal(1)


  describe 'new', ->
    beforeEach ->
      @snippetTree = test.createSnippetTree
        title: { title: 'It Works' }
      @data = @snippetTree.serialize()


    it 'creates a new empty document', ->
      doc.design.load(test.designJson)
      document = doc.new(design: 'test')
      firstSnippet = document.snippetTree.first()
      expect(firstSnippet).to.be.undefined


    it 'creates a new document from data', ->
      doc.design.load(test.designJson)
      document = doc.new(data: @data)
      firstSnippet = document.snippetTree.first()
      expect(firstSnippet.get('title')).to.equal('It Works')

