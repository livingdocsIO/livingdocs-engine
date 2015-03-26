config = require('../../src/configuration/config')

# Define attribute names as specified in the config
containerAttr = config.directives.container.attr
editableAttr = config.directives.editable.attr
htmlAttr = config.directives.html.attr
imageAttr = config.directives.image.attr
linkAttr = config.directives.link.attr
optionalAttr = config.directives.optional.attr

module.exports = do ->

  # Configuration
  # -------------

  name: 'test'
  version: '0.0.1'
  author: 'upfront.io'

  components: [
      name:   'hero'
      label: 'Hero'
      properties: ['extra-space', 'capitalized', 'color']
      html:
        """
          <div>
            <h1 #{ editableAttr }="title"></h1>
            <p #{ editableAttr }="tagline" #{ optionalAttr }></p>
          </div>
        """
    ,
      name: 'title'
      label: 'Title'
      properties: ['capitalized', 'color']
      html: """<h1 #{ editableAttr }="title"></h1>"""
    ,
      name: 'subtitle'
      properties: ['color']
      label: 'Subtitle with a default value'
      html: """<h2 #{ editableAttr }="title">Who's your Caddy?</h2>"""
    ,
      name: 'text'
      label: 'Paragraph'
      html: """<p #{ editableAttr }="text"></p>"""
    ,
      name: 'image'
      label: 'Image'
      html: """<img #{ imageAttr }="image" src=""/>"""
    ,
      name: 'background-image'
      label: 'Background Image'
      html: """<div #{ imageAttr }="image"></div>"""
    ,
      name: 'cover'
      label: 'Cover'
      properties: ['capitalized']
      directives:
        image:
          imageRatios: ["16:9"]
      html:
        """
        <div>
          <h4 #{ editableAttr }="title">Titel</h4>
          <div #{ imageAttr }="image" style="background-image:url();">
            <h3 #{ editableAttr }="uppertitle">Oberzeile</h3>
            <h2 #{ editableAttr }="maintitle">Titel</h2>
          </div>
        </div>
        """
    ,
      # Button Component to test a link and editable directive
      # on the same element.
      name: 'button'
      html:
        """
        <a #{ linkAttr }="link" #{ editableAttr }="text">
          Find out more
        </a>
        """
    ,
      name: 'related-article'
      html:
        """
        <div>
          <a #{ linkAttr }="article-link">
            <h2 #{ editableAttr }="article-title"></h2>
          </a>
        </div>
        """
    ,
      name: 'row'
      label: 'Row with two columns'
      html:
        """
        <div class="row-fluid">
          <div class="span8" #{ containerAttr }="main"></div>
          <div class="span4" #{ containerAttr }="sidebar"></div>
        </div>
        """
    ,
      name: 'container'
      label: 'Container with no container name'
      html:
        """
        <div class="container">
          <div #{ containerAttr }="children"></div>
        </div>
        """
    ,
      name: 'list'
      label: 'A list that only accepts certain components'
      directives:
        children:
          allowedChildren: ['listItem', 'text']
      html:
        """
        <div class="list">
          <div #{ containerAttr }="children"></div>
        </div>
        """
    ,
      name: 'listItem'
      label: 'Component that can only be placed in a restricted container'
      allowedParents: ['list']
      html:
        """
        <div #{ editableAttr }="content"></div>
        """
    ,
      name: 'stuffedContainer'
      label: 'Container with some stuff in it'
      html:
        """
        <div class="stuffed">
          <div class="container" #{ containerAttr }="container">
            <!-- Garbage that will be annihilated by livingdocs -->
            <section>
              <notEvenATag>The Tony Blair Witch Project</notEvenATag>
            </section>
          </div>
        </div>
        """
    ,
      name: 'html'
      label: 'Freeform html'
      html:
        """
        <div #{ htmlAttr }="source">
          <span class="html-placeholder">placholder text</text>
        </div>
        """
    ,
      name: 'compositeHtml'
      label: 'Freeform html with a title'
      html:
        """
        <div>
          <h1 #{ editableAttr }="title">HMTL Freeform Title</h1>
          <div #{ htmlAttr }="source">
            <span class="html-placeholder">placholder text</span>
          </div>
        </div>
        """
    ]


  defaultComponents:
    paragraph: 'text'
    image: 'image'


  componentProperties:
    'color':
      type: 'select'
      options: [
        caption: 'Default'
      ,
        caption: 'Red'
        value: 'color--red'
      ,
        caption: 'Blue'
        value: 'color--blue'
      ,
        caption: 'Green'
        value: 'color--green'
      ]
    'extra-space':
      type: 'option'
      value: 'extra-space'
    'capitalized':
      type: 'option'
      value: 'capitalized'


  imageRatios:
    "16:9":
      label: "16:9"
      ratio: "16/9"


  metadata: [
    identifier: 'title'
    type: 'text'
    matches: ['hero.title', 'title.title']
  ,
    identifier: 'description'
    type: 'text'
    matches: ['title.title']
  ],

  groups: [
    label: 'Layout'
    components: ['row', 'container', 'stuffedContainer']
  ,
    label: 'Header'
    components: ['cover', 'hero', 'title']
  ,
    label: 'Other'
    components: ['subtitle', 'text', 'image']
  ]

  wrapper: '<div class="doc-section"></div>'

  layouts: [
    name: 'layout1'
    caption: 'Layout #1'
    wrapper: '<div class="doc-section layout-wrapper"></div>'
  ,
    name: 'layout2'
    caption: 'Layout #2'
    wrapper: '<div class="doc-section layout-wrapper-extended"></div>'
  ]

  defaultLayout: 'layout2'

  defaultContent: [
    identifier: 'hero'
  ,
    identifier: 'text'
  ]

  prefilledComponents: {}

  metadata: [
    identifier: 'title'
    type: 'text'
    matches: ['hero.title']
  ]
