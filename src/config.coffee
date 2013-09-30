# Configuration
# -------------

do ->

  @config = {
    wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"
    attributePrefix: 'data'

    directives:
      container:
        attr: 'doc-container'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      editable:
        attr: 'doc-editable'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      image:
        attr: 'doc-image'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'image'
  }

  # constants for classes used in a document
  @docClass =

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


  # constants for attributes used in a template
  @templateAttr =
    editable: 'doc-editable'
    container: 'doc-container'
    image: 'doc-image'
    defaultValues:
      editable: 'default'
      container: 'default'
      image: 'image'


  @docAttr =
    # snippet attributes
    template: 'doc-template'


  @templateAttrLookup = {}
  for name, value of config.directives
    @templateAttrLookup[value.attr] = name


  # prepend attributes with prefix
  if @config.attributePrefix
    for name, value of config.directives
      value.renderedAttr = "#{ config.attributePrefix }-#{ value.attr }"
