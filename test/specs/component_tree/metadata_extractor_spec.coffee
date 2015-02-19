ComponentModel = require('../../../src/component_tree/component_model')
ComponentTree = require('../../../src/component_tree/component_tree')
FieldExtractor = require('../../../src/component_tree/field_extractor')

describe 'Field Extractor', ->

  simpleConfig = [
    identifier: 'title'
    type: 'text'
    matches: ['hero.title', 'title.title']
  ,
    identifier: 'description'
    type: 'text'
    matches: ['title.title']
  ]

  beforeEach ->
    @tree = test.createComponentTree [
      hero: { title: 'Hero Title' },
      title: { title: 'Title Title' }
    ]
    @extractor = new FieldExtractor @tree, simpleConfig


  it 'parses the config correctly', ->
    expect(@extractor.getMatches().length).to.equal(3)


  describe 'matching', ->

    it 'uses the title from the hero component', ->
      fields = @extractor.getFields()
      expect(fields.title.content).to.equal('Hero Title')


    it 'uses the description from the title component', ->
      fields = @extractor.getFields()
      expect(fields.description.content).to.equal('Title Title')


    it 'uses the title from the title after moving it up', ->
      @tree.find('title').first.up()
      fields = @extractor.getFields()
      expect(fields.title.content).to.equal('Title Title')


  describe 'recheckComponent()', ->


    it 'rechecks a component', ->
      # NOTE: we create a new model so the events are not triggered
      newModel = test.getComponent('hero')
      newModel.set 'title', 'new Hero'
      { changedFields, fields } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedFields).length).to.equal(1)
      expect(changedFields.title.content).to.equal('new Hero')
      expect(fields.title.content).to.equal('new Hero')


    it 'rechecks a component with 2 matches', ->
      newModel = test.getComponent('title')
      newModel.set 'title', 'new Title'
      { changedFields, fields } = @extractor.recheckComponent(newModel)
      expect(Object.keys(changedFields).length).to.equal(2)
      expect(changedFields.title.content).to.equal('new Title')
      expect(fields.title.content).to.equal('new Title')


  describe 'events', ->

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
      @tree.find('title').first.remove()
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when moving a component', ->
      @tree.find('title').first.up()
      expect(@fieldsChanged).to.have.been.calledOnce

