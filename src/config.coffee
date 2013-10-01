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

      # attributes injected by the engine
      attr:
        template: 'doc-template'


    # Directive definitions
    #
    # attr: attribute used in templates to define the directive
    # renderedAttr: attribute used in output html
    # elementDirective: directive that takes control over the element
    #   (there can only be one per element)
    # defaultName: default name if none was specified in the template
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
      html:
        attr: 'doc-html'
        renderedAttr: 'calculated later'
        elementDirective: true
        defaultName: 'default'
      optional:
        attr: 'doc-optional'
        renderedAttr: 'calculated later'
        elementDirective: false
  }

  # Shorthands for stuff that is used all over the place to make
  # code and specs more readable.
  @docClass = config.html.css
  @docAttr = config.html.attr
  @docDirective = {}
  @templateAttrLookup = {}

  for name, value of config.directives

    # Create the renderedAttrs for the directives
    # (prepend directive attributes with the configured prefix)
    prefix = "#{ config.attributePrefix }-" if @config.attributePrefix
    value.renderedAttr = "#{ prefix || '' }#{ value.attr }"


    @docDirective[name] = value.renderedAttr
    @templateAttrLookup[value.attr] = name


