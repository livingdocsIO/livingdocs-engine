# Configuration
# -------------
config = {
  wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"
  attributePrefix: 'data'
}

# constants for classes used in a document
docClass =

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
templateAttr =
  editable: 'doc-editable'
  container: 'doc-container'
  image: 'doc-image'
  defaultValues:
    editable: 'default'
    container: 'default'
    image: 'image'

templateAttrLookup = {}
for n, v of templateAttr
  templateAttrLookup[v] = n

# constants for attributes used in a document
docAttr =
  # snippet attributes
  template: 'doc-template'

for name, value of templateAttr
  docAttr[name] = value

# prepend attributes with prefix
if config.attributePrefix
  for key, value of docAttr
    docAttr[key] = "#{ config.attributePrefix }-#{ value }"
