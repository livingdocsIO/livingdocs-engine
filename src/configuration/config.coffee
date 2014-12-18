augmentConfig = require('./augment_config')

# Configuration
# -------------
module.exports = augmentConfig(

  # Load css and js resources in pages and interactive pages
  loadResources: true

  # CSS selector for elements (and their children) that should be ignored
  # when focussing or blurring a component
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
    changeDelay: 0 # Delay for updating the component models in milliseconds after user changes. 0 For immediate updates. false to disable.
    browserSpellcheck: false # Set the spellcheck attribute on contenteditables to 'true' or 'false'
    mouseMoveSelectionChanges: false # Whether to fire cursor and selction changes on mousemove


  # In css and attr you find everything that can end up in the html
  # the engine spits out or works with.

  # css classes injected by the engine
  css:
    # document classes
    section: 'doc-section'

    # component classes
    component: 'doc-component'
    editable: 'doc-editable'
    noPlaceholder: 'doc-no-placeholder'
    emptyImage: 'doc-image-empty'
    interface: 'doc-ui'

    # highlight classes
    componentHighlight: 'doc-component-highlight'
    containerHighlight: 'doc-container-highlight'

    # drag & drop
    dragged: 'doc-dragged'
    draggedPlaceholder: 'doc-dragged-placeholder'
    draggedPlaceholderCounter: 'doc-drag-counter'
    dragBlocker: 'doc-drag-blocker'
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


  imageServices:
    'resrc.it':
      quality: 75
      host: 'http://app.resrc.it'
)
