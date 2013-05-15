# Configuration
# -------------

config = {}

# constants for classes used in a document
docClass =

  # document classes
  section: "doc-section"

  # snippet classes
  snippet: "doc-snippet"
  editable: "doc-editable"


# constants for attributes used in a document
docAttr =

  # snippet attributes
  template: "doc-template"
  editable: "doc-editable"
  list: "doc-list"


# prepend attributes with data-
for key, value of docAttr
  docAttr[key] = "data-#{ value }"



  # Code from Livingdocs settings.coffee
  # # Layout & Sections
  # @layoutAttribute = "data-upfront-layout"
  # @sectionClass = "upfront-section"

  # # Content & Controls
  # @contentClass = "upfront-content"
  # @controlClass = "upfront-control"
  # @dropzoneClass = "upfront-dropzone"

  # # Snippets
  # @snippetClass = "upfront-snippet"
  # @activeSnippetClass = "upfront-active"
  # @editableClass = "upfront-editable"
  # @draggedClass = "upfront-dragged"

  # @snippetData = "snippet"

  # # Templates
  # @templateAttribute = "data-upfront-template"
  # @fieldAttribute = "data-upfront-field"
  # @listAttribute = "data-upfront-list"
  # @optionalAttribute = "data-upfront-optional"
  # @tempAttribute = "data-upfront-temporary"
