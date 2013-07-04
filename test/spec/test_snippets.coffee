testSnippets =

  config:
    namespace: 'test'


  snippets:
    hero:
      name: 'Hero'
      html:
        """
          <div>
            <h1 #{ docAttr.editable }="title"></h1>
            <p #{ docAttr.editable }="tagline"></p>
          </div>
        """


    title:
      name: 'Title'
      html: """<h1 #{ docAttr.editable }="title"></h1>"""


    subtitle:
      name: 'Subtitle with a default value'
      html: """<h2 #{ docAttr.editable }="title">Who's your Caddy?</h2>"""


    text:
      name: 'Paragraph'
      html: """<p #{ docAttr.editable }="text"></p>"""


    row:
      name: 'Row with two columns'
      html:
        """
        <div class="row-fluid">
          <div class="span8" #{ docAttr.container }="main"></div>
          <div class="span4" #{ docAttr.container }="sidebar"></div>
        </div>
        """


    container:
      name: 'Container with no container name'
      html:
        """
        <div class="container">
          <div #{ docAttr.container }></div>
        </div>
        """


    stuffedContainer:
      name: 'Container with some stuff in it'
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

