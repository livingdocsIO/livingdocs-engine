testDesign =

  config:
    namespace: 'test'

    groups:
      layout:
        title: 'Layout'
        templates: [
          'row'
          'container'
          'stuffedContainer'
        ]
      header:
        title: 'Header'
        styles: [
          name: 'Capitalized'
          type: 'option'
          value: 'capitalized'
        ]
        templates: [
          'cover'
          'hero'
          'title'
        ]
      other:
        title: 'Other'
        templates: [
          'subtitle'
          'text'
          'image'
        ]

    styles: [
      name: 'Color'
      type: 'select'
      options: [
        caption: 'Red'
        value: 'color--red'
      ,
        caption: 'Blue'
        value: 'color--blue'
      ,
        caption: 'Green'
        value: 'color--green'
      ]
    ]

  templates: [
      id:   'hero'
      title: 'Hero'
      styles: [
        name: 'Extra Space'
        type: 'option'
        value: 'extra-space'
      ]
      html:
        """
          <div>
            <h1 #{ docAttr.editable }="title"></h1>
            <p #{ docAttr.editable }="tagline"></p>
          </div>
        """
    ,
      id: 'title'
      title: 'Title'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""
    ,
      id: 'subtitle'
      title: 'Subtitle with a default value'
      html: """<h2 #{ docAttr.editable }="title">Who's your Caddy?</h2>"""
    ,
      id: 'text'
      title: 'Paragraph'
      html: """<p #{ docAttr.editable }="text"></p>"""
    ,
      id: 'image'
      title: 'Image'
      html: """<img #{ docAttr.image }="image" src=""/>"""
    ,
      id: 'cover'
      title: 'Cover'
      html:
        """
        <div>
          <h4 doc-editable="title">Titel</h4>
          <div #{ docAttr.image }="image" style="background-image:url();">
            <h3 doc-editable="uppertitle">Oberzeile</h3>
            <h2 doc-editable="maintitle">Titel</h2>
          </div>
        </div>
        """
    ,
      id: 'row'
      title: 'Row with two columns'
      html:
        """
        <div class="row-fluid">
          <div class="span8" #{ docAttr.container }="main"></div>
          <div class="span4" #{ docAttr.container }="sidebar"></div>
        </div>
        """
    ,
      id: 'container'
      title: 'Container with no container name'
      html:
        """
        <div class="container">
          <div #{ docAttr.container }></div>
        </div>
        """
    ,
      id: 'stuffedContainer'
      title: 'Container with some stuff in it'
      html:
        """
        <div class="stuffed">
          <div class="container" #{ docAttr.container }="container">
            <!-- Garbage that will be annihilated by livingdocs -->
            <section>
              <notEvenATag>The Tony Blair Witch Project</notEvenATag>
            </section>
          </div>
        </div>
        """
    ,
      id: 'html'
      title: 'Freeform html'
      html:
        """
        <div #{ docAttr.html }="html">
          <span class="html-placeholder">placholder text</text>
        </div>
        """
    ]
