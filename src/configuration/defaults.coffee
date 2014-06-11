# Configuration
# -------------
module.exports = config = do ->

  # Load css and js resources in pages and interactive pages
  loadResources: true

  # CSS selector for elements (and their children) that should be ignored
  # when focussing or blurring a snippet
  ignoreInteraction: '.ld-control'

  # Setup paths to load resources dynamically
  designPath: '/designs'
  livingdocsCssFile: '/assets/css/livingdocs.css'

  wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"

  # string containng only a <br> followed by whitespaces
  singleLineBreak: /^<br\s*\/?>\s*$/

  attributePrefix: 'data'

  # Editable configuration
  editable:
    allowNewline: true # Allow to insert newlines with Shift+Enter
    changeTimeout: 0 # Delay in milliseconds. 0 For immediate updates. false to disable.


  # In css and attr you find everything that can end up in the html
  # the engine spits out or works with.

  # css classes injected by the engine
  css:
    # document classes
    section: 'doc-section'

    # snippet classes
    snippet: 'doc-snippet'
    editable: 'doc-editable'
    noPlaceholder: 'doc-no-placeholder'
    emptyImage: 'doc-image-empty'
    interface: 'doc-ui'

    # highlight classes
    snippetHighlight: 'doc-snippet-highlight'
    containerHighlight: 'doc-container-highlight'

    # drag & drop
    dragged: 'doc-dragged'
    draggedPlaceholder: 'doc-dragged-placeholder'
    draggedPlaceholderCounter: 'doc-drag-counter'
    dropMarker: 'doc-drop-marker'
    beforeDrop: 'doc-before-drop'
    noDrop: 'doc-drag-no-drop'
    afterDrop: 'doc-after-drop'
    longpressIndicator: 'doc-longpress-indicator'

    # utility classes
    preventSelection: 'doc-no-selection'
    maximizedContainer: 'doc-js-maximized-container'
    interactionBlocker: 'doc-interaction-blocker'

  # attributes injected by the engine
  attr:
    template: 'data-doc-template'
    placeholder: 'data-doc-placeholder'


  # Kickstart config
  kickstart:
    attr:
      styles: 'doc-styles'

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


  animations:
    optionals:
      show: ($elem) ->
        $elem.slideDown(250)

      hide: ($elem) ->
        $elem.slideUp(250)


# Enrich the configuration
# ------------------------
#
# Enrich the configuration with shorthands and computed values.
enrichConfig = ->

  # Shorthands for stuff that is used all over the place to make
  # code and specs more readable.
  @docDirective = {}
  @templateAttrLookup = {}

  for name, value of @directives

    # Create the renderedAttrs for the directives
    # (prepend directive attributes with the configured prefix)
    prefix = "#{ @attributePrefix }-" if @attributePrefix
    value.renderedAttr = "#{ prefix || '' }#{ value.attr }"

    @docDirective[name] = value.renderedAttr
    @templateAttrLookup[value.attr] = name


enrichConfig.call(config)
