engine = require('../../../src/node_api')
Livingdoc = require('../../../src/livingdoc')
ComponentTree = require('../../../src/component_tree/component_tree')
designCache = require('../../../src/design/design_cache')

config = test.config

describe 'node_api:', ->

  it 'exposes "getImageService"', ->
    expect(engine.getImageService('resrc.it').name).to.equal('resrc.it')


  describe 'global variables', ->

    it 'does not set window as global', ->
      expect(window?).to.equal(false)


    it 'exports a window', ->
      expect(engine.window).to.exist


    # jquery required a window with a document
    it 'sets a window with a document', ->
      expect(engine.window.document).to.exist


  describe 'variables', ->

    it 'exposes "design"', ->
      expect(engine.design).to.equal(designCache)


    it 'exposes "createLivingdoc"', ->
      expect(engine.createLivingdoc).to.be.an.instanceof(Function)


    it 'exposes "config"', ->
      expect(engine.config).to.be.an.instanceof(Function)


    it 'exposes the Livingdoc class', ->
      expect(engine.Livingdoc).to.equal(Livingdoc)


    it 'exposes the ComponentTree class', ->
      expect(engine.ComponentTree).to.equal(ComponentTree)


    it 'exposes the version', ->
      expect(engine.version).to.exist


    it 'exposes the revision', ->
      expect(engine.revision).to.exist

