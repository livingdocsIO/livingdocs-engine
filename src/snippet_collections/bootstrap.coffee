# Twitter Bootstrap Snippet Collection
# ------------------------------------

@snippetCollections ||= {}

snippetCollections.bootstrap = do ->
  config:
    namespace: "bootstrap"
    css: [
      "/test/manual/bootstrap/css/bootstrap.css"
      "/test/manual/css/bootstrap-adjust.css"
    ]

  snippets:
    column:
      name: "Single Centered Column"
      html:
        """
        <div class="row-fluid">
          <div class="span8 offset2" data-doc-container></div>
        </div>
        """

    mainSidebar:
      name: "Main and Sidebar Columns"
      html:
        """
        <div class="row-fluid">
          <div class="span8" data-doc-container="main"></div>
          <div class="span4" data-doc-container="sidebar"></div>
        </div>
        """

    hero:
      name: "Hero"
      html:
        """
        <div class="hero-unit">
          <h1 data-doc-editable="title">Titel</h1>
          <p data-doc-editable="tagline">Tagline</p>
        </div>
        """

    header:
      name: "Header"
      html:
        """
        <div class="page-header">
          <h1 data-doc-editable="title">Header</h1>
        </div>
        """

    title:
      name: "Title"
      html: """<h1 data-doc-editable="title">Titel</h1>"""

    subtitle:
      name: "Subtitle"
      html: """<h2 data-doc-editable="title">Untertitel</h2>"""

    smallSubtitle:
      name: "Paragraph Title"
      html: """<h3 data-doc-editable="title">Lorem ipsum dolorem</h3>"""

    text:
      name: "Text"
      html:
        """
        <p data-doc-editable="title">
          Lorem ipsum dolorem. Lorem ipsum dolorem. Lorem ipsum dolorem
        </p>
        """

    separator:
      name: "Separator"
      html:
        """
        <div>
          <hr>
        </div>
        """

    info:
      name: "Info"
      html:
        """
        <div class="alert alert-info" data-doc-editable="text">
          Lorem Ipsum dolorem
        </div>
        """

    button:
      name: "Button"
      html:
        """
        <button class="btn" type="button" data-doc-editable="button">Button</button>
        """

    largeButton:
      name: "Large Button"
      html:
        """
        <button class="btn btn-block" type="button" data-doc-editable="button">Large Button</button>
        """

    image:
      name: "Image"
      html:
        """
        <div class="img-polaroid" data-doc-editable="image">
          Drag your image here...
        </div>
        """
