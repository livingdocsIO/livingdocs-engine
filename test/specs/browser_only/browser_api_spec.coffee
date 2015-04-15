require('../../../src/browser_api')
config = test.config

describe 'browser_api:', ->

  afterEach ->
    doc.design.resetCache()


  it 'exposes "getImageService"', ->
    expect(doc.getImageService('resrc.it').name).to.equal('resrc.it')


  describe 'Global variable', ->

    it 'defines the global variable doc', ->
      expect(window.doc).to.exist


  describe 'design', ->

    it 'loads a design synchronously', ->
      expect(doc.design.has('test', '0.0.1')).to.be.false
      doc.design.load(test.designJson)
      expect(doc.design.has('test', '0.0.1')).to.be.true


    it 'resets the design cache', ->
      doc.design.load(test.designJson)
      doc.design.resetCache()
      expect(doc.design.has('test', '0.0.1')).to.be.false


    it 'does not load a design twice', ->
      spy = sinon.spy(doc.design, 'add')
      doc.design.load(test.designJson)
      doc.design.load(test.designJson)
      expect(spy.callCount).to.equal(1)


    describe 'with two versions', ->

      beforeEach ->
        newerDesignJson = $.extend({}, test.designJson, { version: '0.0.2'})
        doc.design.load(newerDesignJson)
        doc.design.load(test.designJson)


      it 'saves versioned designs', ->
        expect(doc.design.has('test', '0.0.1')).to.equal(true)
        expect(doc.design.has('test', '0.0.2')).to.equal(true)


      it 'does not save a design only under its name', ->
        expect(doc.design.has('test')).to.equal(false)


      it 'saves the newest design under its name and version', ->
        newestDesign = doc.design.get('test', '0.0.2')
        expect(newestDesign.version).to.equal('0.0.2')


  describe 'new', ->

    beforeEach ->
      doc.design.load(test.designJson)
      @componentTree = test.createComponentTree
        title: { title: 'It Works' }
      @data = @componentTree.serialize()


    it 'creates a new empty livingdoc', ->
      livingdoc = doc.new
        designName: 'test'
        designVersion: '0.0.1'
      firstComponent = livingdoc.componentTree.first()
      expect(firstComponent).to.be.undefined


    it 'creates a new livingdoc from data', ->
      livingdoc = doc.new(data: @data)
      firstComponent = livingdoc.componentTree.first()
      expect(firstComponent.get('title')).to.equal('It Works')


    it 'creates a new livingdoc from json data', ->
      livingdoc = doc.new({
        data: {
          content: [
            {
              "component": "title",
              "content": {
                "title": "This is it!"
              }
            }
          ],
          design: {
            name: "test"
            version: "0.0.1"
          }
        }
      })
      expect(livingdoc.componentTree.first().get('title')).to.equal('This is it!')


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

