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


  describe 'config', ->

    beforeEach ->
      @originalConfig = $.extend(true, {}, config)

    afterEach ->
      doc.config(@originalConfig)


    it 'changes an editable config property', ->
      expect(config.editable.browserSpellcheck).to.equal(false)
      doc.config( editable: { browserSpellcheck: true } )
      expect(config.editable.browserSpellcheck).to.equal(true)


    it 'does not reset sibling properties', ->
      expect(config.editable.changeDelay).to.equal(0)
      expect(config.editable.browserSpellcheck).to.equal(false)
      doc.config( editable: { browserSpellcheck: true } )
      expect(config.editable.changeDelay).to.equal(0)
      expect(config.editable.browserSpellcheck).to.equal(true)


    it 're-calculates the docDirectives after changing the attributePrefix', ->
      expect(config.docDirective.editable).to.equal('data-doc-editable')
      doc.config(attributePrefix: 'x')
      expect(config.docDirective.editable).to.equal('x-doc-editable')

