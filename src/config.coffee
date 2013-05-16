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
