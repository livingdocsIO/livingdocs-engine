# Configuration
# -------------
config = {
  wordSeparators: "./\\()\"':,.;<>~!#%^&*|+=[]{}`~?"
}

# constants for classes used in a document
docClass =

  # document classes
  section: "doc-section"

  # snippet classes
  snippet: "doc-snippet"
  editable: "doc-editable"

  # highlight classes
  snippetHighlight: "doc-snippet-highlight"
  containerHighlight: "doc-container-highlight"


# constants for attributes used in a document
docAttr =

  # snippet attributes
  template: "doc-template"
  editable: "doc-editable"
  container: "doc-container"
  list: "doc-list"


# prepend attributes with data-
for key, value of docAttr
  docAttr[key] = "data-#{ value }"
