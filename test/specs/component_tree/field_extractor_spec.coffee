ComponentModel = require('../../../src/component_tree/component_model')
ComponentTree = require('../../../src/component_tree/component_tree')
FieldExtractor = require('../../../src/component_tree/field_extractor')
MetadataConfig = require('../../../src/configuration/metadata_config')

describe 'Field Extractor', ->

  simpleConfig = [
    identifier: 'documentTitle'
    type: 'text'
    matches: ['hero.title', 'subtitle.title']
  ,
    identifier: 'description'
    type: 'text'
    matches: ['subtitle.title']
  ,
    identifier: 'teaser'
    type: 'image'
    matches: ['cover.image']
  ]

  beforeEach ->

    @tree = test.createComponentTree [
      hero: { title: 'Hero Title' },
      subtitle: { title: 'Subtitle Title' }
      cover: { image: 'http://www.lolcats.com/images/1.jpg' }
    ]

    @extractor = new FieldExtractor(@tree, simpleConfig)


  describe 'extraction', ->

    it 'uses the title from the hero component', ->
      fields = @extractor.getFields()
      expect(fields.documentTitle.content).to.equal('Hero Title')
      expect(fields.documentTitle.text).to.equal('Hero Title')


    it 'uses the description from the title component', ->
      fields = @extractor.getFields()
      expect(fields.description.content).to.equal('Subtitle Title')
      expect(fields.description.text).to.equal('Subtitle Title')


    it 'uses the title from the title after moving it up', ->
      @tree.find('subtitle').first.up()
      fields = @extractor.getFields()
      expect(fields.documentTitle.content).to.equal('Subtitle Title')
      expect(fields.documentTitle.text).to.equal('Subtitle Title')


    it 'uses the teaser image from the cover', ->
      fields = @extractor.getFields()
      expect(fields.teaser.image.originalUrl).to.equal('http://www.lolcats.com/images/1.jpg')


    it 'removes previously set fields', ->
      @tree.find('subtitle').first.set('title', '')
      fields = @extractor.getFields()
      expect(fields.description).to.equal(undefined)


    it 'uses the next component\'s text when directive is cleared', ->
      @tree.find('hero').first.set('title', '')
      fields = @extractor.getFields()
      expect(fields.description.content).to.equal('Subtitle Title')
      expect(fields.description.text).to.equal('Subtitle Title')

  describe 'recheckComponent()', ->


    it 'rechecks a component', ->
      # NOTE: we create a new model so the events are not triggered
      newModel = test.getComponent('hero')
      newModel.set 'title', 'new Hero'
      { changedFields, fields } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedFields).length).to.equal(1)
      expect(changedFields.documentTitle.content).to.equal('new Hero')
      expect(fields.documentTitle.content).to.equal('new Hero')


    it 'rechecks a component with 2 matches', ->
      newModel = test.getComponent('subtitle')
      newModel.set 'title', 'new Title'
      { changedFields, fields } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedFields).length).to.equal(2)
      expect(changedFields.documentTitle.content).to.equal('new Title')
      expect(fields.documentTitle.content).to.equal('new Title')


  describe 'event', ->

    beforeEach ->
      @fieldsChanged = sinon.spy(@extractor.fieldsChanged, 'fire')


    it 'fires the fieldsChanged event when changing content', ->
      model = @tree.find('hero').first
      model.set('title', 'new Hero')
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when adding a component', ->
      @tree.append('title')
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when removing a component', ->
      @tree.find('subtitle').first.remove()
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when moving a component', ->
      @tree.find('subtitle').first.up()
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires with new field when a previously used field is cleared', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Subtitle Title')
        done()
      model = @tree.find('hero').first
      model.set('title', '')


    it 'fires with first matched field when changing the second one', (done) ->

      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Hero Title')
        done()

      model = @tree.find('subtitle').first
      model.set('title', 'New Subtitle Title')
