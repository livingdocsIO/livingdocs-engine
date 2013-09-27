# Configuration
# -------------

do ->

  @config = {
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"
    attributePrefix: 'data'

    # Here you find everything that can end up in the html
    # the engine spits out or works with.
    html:

      # css classes injected by the engine
      css:
        # document classes
        section: 'doc-section'

        # snippet classes
        snippet: 'doc-snippet'
        editable: 'doc-editable'
        interface: 'doc-ui'

        # highlight classes
        snippetHighlight: 'doc-snippet-highlight'
        containerHighlight: 'doc-container-highlight'

        # drag & drop
        draggedPlaceholder: 'doc-dragged-placeholder'
        dragged: 'doc-dragged'
        beforeDrop: 'doc-before-drop'
        afterDrop: 'doc-after-drop'

        # utility classes
        preventSelection: 'doc-no-selection'
        maximizedContainer: 'doc-js-maximized-container'
        interactionBlocker: 'doc-interaction-blocker'


    template:

      # attributes used in templates to define directives
      directives:
        editable: 'doc-editable'
        container: 'doc-container'
        image: 'doc-image'
        html: 'doc-html'

      defaultValues:
        editable: 'default'
        container: 'default'
        image: 'image'
        html: 'default'
  }

  # shorthands
  @docClass = config.html.css
  @templateAttr = config.template.directives
  @templateAttr.defaultValues = config.template.defaultValues

  @templateAttrLookup = {}

  # constants for attributes used in a document
  @docAttr =
    # snippet attributes
    template: 'doc-template'

  for n, v of @templateAttr
    @templateAttrLookup[v] = n


  for name, value of @templateAttr
    @docAttr[name] = value

  # prepend attributes with prefix
  if @config.attributePrefix
    for key, value of @docAttr
      @docAttr[key] = "#{ config.attributePrefix }-#{ value }"
