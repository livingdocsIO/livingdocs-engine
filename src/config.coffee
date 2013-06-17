# Configuration
# -------------
config = {
  wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"
  defaultContainerName: 'default'
  defaultEditableName: 'default'
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

  # utility classes
  preventSelection: 'doc-no-selection'
  maximizedContainer: 'doc-js-maximized-container'


# constants for attributes used in a document
docAttr =

  # snippet attributes
  template: 'doc-template'
  editable: 'doc-editable'
  container: 'doc-container'
  list: 'doc-list'


# prepend attributes with data-
for key, value of docAttr
  docAttr[key] = "data-#{ value }"
