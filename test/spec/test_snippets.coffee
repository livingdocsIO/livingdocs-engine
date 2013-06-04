testSnippets =

  config:
    namespace: 'test'
    css: []

  snippets:
    title:
      name: 'Title'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    row:
      name: 'Row'
      html:
        """
        <div class="row-fluid">
          <div class="span8" #{ docAttr.container }="main"></div>
          <div class="span4" #{ docAttr.container }="sidebar"></div>
        </div>
        """

