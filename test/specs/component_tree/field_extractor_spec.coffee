ComponentModel = require('../../../src/component_tree/component_model')
ComponentTree = require('../../../src/component_tree/component_tree')
FieldExtractor = require('../../../src/component_tree/field_extractor')
MetadataConfig = require('../../../src/configuration/metadata_config')
_ = require('underscore')

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
    identifier: 'firstText'
    type: 'text'
    matches: ['text.text']
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
    @metadataConfig = new MetadataConfig(simpleConfig)

    @extractor = new FieldExtractor(@tree, @metadataConfig)


  describe 'extraction', ->

    it 'uses the documentTitle from the hero component', ->
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


    it 'does not break when a component is added that fills a previously empty field', ->
      expect(=>
        textComponent = @tree.getComponent('text')
        @tree.append(textComponent)
        textComponent.set('text', 'foo')
      ).to.not.throw()


  describe 'event', ->

    beforeEach ->
      @fieldsChanged = sinon.spy(@extractor.fieldsChanged, 'fire')

    it 'fires when the first field of an empty tree is edited', ->
      # Create an empty tree
      tree = test.createComponentTree([hero: {}])
      extractor = new FieldExtractor(tree, @metadataConfig)

      fieldsChanged = sinon.spy(extractor.fieldsChanged, 'fire')

      model = tree.find('hero').first
      model.set('title', 'new Hero')

      expect(fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when changing content', ->
      model = @tree.find('hero').first
      model.set('title', 'new Hero')
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'fires the fieldsChanged event when adding a component', (done) ->
      testString = 'hello world'
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.firstText.text).to.equal(testString)
        expect(_(changedFields).size()).to.equal(1)
        done()

      textComponent = @tree.getComponent('text')
      textComponent.set('text', testString)
      @tree.append(textComponent)


    it 'does not fire the fieldsChanged event when adding a component that does not change the metadata', ->
      @tree.append('title')
      expect(@fieldsChanged).to.not.have.been.called


    it 'fires the fieldsChanged event when moving a component', ->
      @tree.find('subtitle').first.up()
      expect(@fieldsChanged).to.have.been.calledOnce


    it 'does not fire with field when changing the second possible field source', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle).to.equal(undefined)
        done()

      model = @tree.find('subtitle').first
      model.set('title', 'New Subtitle Title')


    it 'does not fire when another component directive is fired', ->
      model = @tree.find('hero').first
      model.set('tagline', 'Hello world')
      expect(@fieldsChanged).to.not.have.been.called


    it 'fires the event only with the fields that have changed in a move', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle).to.not.equal(undefined)
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('subtitle').first.up()


    # Setting empty string to directive
    it 'fires the event only with the fields that have changed in a remove', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Subtitle Title')
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('hero').first.set('title', '')


    it 'fires the fieldsChanged event when removing a component', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Subtitle Title')
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('hero').first.set('title', '')


    it 'fires with `undefined` when the last component for a field is removed', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.description).to.equal(undefined)
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('subtitle').first.set('title', '')


    it 'does not fire when removing a component that does not change the metadata', ->
      tree = test.createComponentTree [
        hero: { title: 'Hero Title' }
      ,
        subtitle: { title: 'Subtitle Title' }
      ,
        subtitle: { title: 'Second Subtitle Title' }
      ,
        cover: { image: 'http://www.lolcats.com/images/1.jpg' }
      ]
      extractor = new FieldExtractor(tree, @metadataConfig)

      fieldsChanged = sinon.spy(extractor.fieldsChanged, 'fire')

      model = tree.find('subtitle')[1]
      model.set('title', '')

      expect(fieldsChanged).to.not.have.been.called


    # Removing components
    it 'fires the event only with the fields that have changed in a remove', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Subtitle Title')
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('hero').first.remove()


    it 'fires the fieldsChanged event when removing a component', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.documentTitle.text).to.equal('Subtitle Title')
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('hero').first.remove()


    it 'fires with `undefined` when the last component for a field is removed', (done) ->
      @extractor.fieldsChanged.add (changedFields) ->
        expect(changedFields.description).to.equal(undefined)
        expect(_(changedFields).size()).to.equal(1)
        done()
      @tree.find('subtitle').first.remove()


    it 'does not fire when removing a component that does not change the metadata', ->
      tree = test.createComponentTree [
        hero: { title: 'Hero Title' }
      ,
        subtitle: { title: 'Subtitle Title' }
      ,
        subtitle: { title: 'Second Subtitle Title' }
      ,
        cover: { image: 'http://www.lolcats.com/images/1.jpg' }
      ]
      extractor = new FieldExtractor(tree, @metadataConfig)

      fieldsChanged = sinon.spy(extractor.fieldsChanged, 'fire')

      model = tree.find('subtitle')[1]
      model.remove()

      expect(fieldsChanged).to.not.have.been.called
