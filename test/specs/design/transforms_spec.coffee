_ = require('underscore')
Template = require('../../../src/template/template')

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


  describe 'isCompatible()', ->

    h1 = new Template(name: 'h1', html: """<h1 #{ test.editableAttr }="title"></h1>""")
    h2 = new Template(name: 'h2', html: """<h2 #{ test.editableAttr }="title"></h2>""")
    p = new Template(name: 'p', html: """<p #{ test.editableAttr }="text"></p>""")
    image = new Template(name: 'image', html: """<img #{ test.imageAttr }="image" src=""/>""")
    backgroundImage = new Template(name: 'image', html: """<div #{ test.imageAttr }="image"></div>""")


    context 'an h1 template', ->

      it 'is compatible with an h2', ->
        compatibility = @transforms.isCompatible(h1, h2)
        expect(compatibility).to.deep.equal
          name: 'h2'
          isCompatible: true
          mapping:
            'title': 'title'


      it 'is not compatible with an image', ->
        compatibility = @transforms.isCompatible(h1, image)
        expect(compatibility).to.deep.equal
          name: 'image'
          isCompatible: false
          mapping:
            'title': null


    context 'an image template', ->

      it 'is compatible with another image template', ->
        compatibility = @transforms.isCompatible(image, backgroundImage)
        expect(compatibility.isCompatible).to.equal(true)


    context 'a teaser template', ->

      teaser1 = new Template(name: 'teaser1', html: """
        <a #{ test.linkAttr}="teaser1">
          <h1 #{ test.editableAttr }="title1"></h1>
        </a>""")

      teaser2 = new Template(name: 'teaser2', html: """
        <article>
          <a #{ test.linkAttr}="teaser2">
            <h1 #{ test.editableAttr }="title2"></h1>
          </a>
        </article>""")


      it 'is compatible with another teaser template', ->
        compatibility = @transforms.isCompatible(teaser1, teaser2)
        expect(compatibility.isCompatible).to.equal(true)


    context 'an html template', ->

      html = new Template(name: 'html', html: """<div class="html" #{ test.htmlAttr }="code"></div>""")
      embed = new Template(name: 'embed', html: """<div class="embed" #{ test.htmlAttr }="code"></div>""")

      it 'is not compatible with another html template', ->
        compatibility = @transforms.isCompatible(html, embed)
        expect(compatibility.isCompatible).to.equal(false)

