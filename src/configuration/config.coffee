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
  # attr {String}: attribute used in templates to define the directive
  # renderedAttr {String}: attribute used in output html (will be set in augment_config)
  # overwritesContent {Boolean}: directive takes control over the child nodes
  #   (there can only be one per element)
  # modifies {Array of String}: modifies any of the specified directives
  directives:
    container:
      attr: 'doc-container'
      renderedAttr: 'calculated in augment_config'
      overwritesContent: true
    editable:
      attr: 'doc-editable'
      renderedAttr: 'calculated in augment_config'
      overwritesContent: true
    html:
      attr: 'doc-html'
      renderedAttr: 'calculated in augment_config'
      overwritesContent: true
    image:
      attr: 'doc-image'
      renderedAttr: 'calculated in augment_config'
    link:
      attr: 'doc-link'
      renderedAttr: 'calculated in augment_config'
    optional:
      attr: 'doc-optional'
      renderedAttr: 'calculated in augment_config'
      modifies: ['editable']


  animations:
    optionals:
      show: ($elem) ->
        $elem.slideDown(250)

      hide: ($elem) ->
        $elem.slideUp(250)


  # Define an image placeholder using an url or a base64 image
  # echo '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><svg xmlns="http://www.w3.org/2000/svg" width="620" height="350" viewBox="0 0 620 350" preserveAspectRatio="none"><rect width="620" height="350" fill="#D4D4CE"/><line x1="0" y1="0" x2="620" y2="350" style="stroke:#ffffff;stroke-width:2"/><line x1="620" y1="0" x2="0" y2="350" style="stroke:#ffffff;stroke-width:2"/></svg>' | base64
  imagePlaceholder: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjIwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDYyMCAzNTAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxyZWN0IHdpZHRoPSI2MjAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRDRENENFIi8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iNjIwIiB5Mj0iMzUwIiBzdHlsZT0ic3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIiLz48bGluZSB4MT0iNjIwIiB5MT0iMCIgeDI9IjAiIHkyPSIzNTAiIHN0eWxlPSJzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MiIvPjwvc3ZnPgo"
  imageServices:
    'resrc.it':
      quality: 75
      host: 'https://app.resrc.it'
)
