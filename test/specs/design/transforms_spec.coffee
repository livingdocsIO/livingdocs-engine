_ = require('underscore')
describe 'transforms:', ->

  expectToContain = (array, searched) ->
    first = _.find array, (obj) ->
      _.isEqual(obj, searched)

    expect(first).to.exist


  beforeEach ->
    @design = test.getDesign()
    @transforms = @design.transforms


  describe 'getTransformations()', ->

    it 'returns hero as fully-compatible templates for title', ->
      options = @transforms.getTransformations(componentName: 'title')

      subtitle = _.find(options, (item) -> item.name == 'subtitle')
      expect(subtitle.isCompatible).to.equal(true)
      expect(subtitle.template.name).to.equal('subtitle')
      expect(subtitle.mapping).to.deep.equal
        'title': 'title'


    it 'returns all fully-compatible templates for title', ->
      options = @transforms.getTransformations(componentName: 'title')
      componentNames = _.map(options, (item) -> item.name)
      expect(componentNames).to.have.members [
        'subtitle', 'text', 'listItem'
      ]


    it 'does not return itself', ->
      options = @transforms.getTransformations(componentName: 'title')
      componentNames = _.map(options, (item) -> item.name)
      expect(componentNames).not.to.include('title')


    it 'returns all one way compatible templates for title', ->
      options = @transforms.getTransformations
        template: @design.get('title')
        oneWay: true

      componentNames = _.map(options, (item) -> item.name)
      expect(componentNames).to.have.members [
        'hero', 'subtitle', 'text', 'cover', 'button',
        'related-article', 'listItem', 'compositeHtml'
      ]


    it 'returns all compatible templates for cover directive image', ->
      options = @transforms.getTransformations
        componentName: 'cover'
        directives: ['image']

      componentNames = _.map(options, (item) -> item.name)
      expect(componentNames).to.have.members ['image', 'background-image']

