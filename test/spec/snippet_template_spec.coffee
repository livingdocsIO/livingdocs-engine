# Simple Template
# ---------------

describe "Simple H1 Template", ->

  # Setup
  # -----
  template = undefined
  beforeEach ->
    template = new SnippetTemplate
      name: "h1"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

  # Tests
  # -----
  it "should have $template Property", ->
    expect(template.$template).toBeDefined()

  it "should have a name", ->
    expect(template.name).toEqual("h1")

  it "should have stored the html", ->
    expect(template.$template.outerHtml()).toEqual("<h1 #{ docAttr.editable }=\"title\" class=\"#{ docClass.editable }\"></h1>")

  it "should return a snippet", ->
    snippet = template.create()
    expect(snippet instanceof Snippet).toBe(true)

  it "should return a snippet", ->
    snippet = template.create
      title: "Humble Bundle"

    expect(snippet.$snippet.outerHtml()).toEqual(
      """
      <h1 #{ docAttr.editable }="title" class="#{ docClass.editable } #{ docClass.snippet }">Humble Bundle</h1>
      """
    )

# Dropdown Template
# -----------------
describe "Dropdown Template", ->

  template = null
  beforeEach ->
    template = new SnippetTemplate
      name: "dropdown"
      html:
        """
        <div>
          <a class='btn btn-primary dropdown-toggle' data-toggle='dropdown' href='#'>
            <i class='icon-plus icon-white'></i>
          </a>
          <ul class='dropdown-menu' #{ docAttr.list }="links">
            <li>
              <a href='#' #{ docAttr.editable }="dropdownLink"></a>
            </li>
          </ul>
        </div>
        """

  it "should have stored the html", ->
    $template = template.$template
    expect($template.findIn("div").length).toEqual(1)
    expect($template.findIn("a").length).toEqual(1)
    expect($template.findIn("i").length).toEqual(1)
    expect($template.findIn("ul").length).toEqual(1)

    # the <li> element should have been cut out and stored in a list item template
    expect($template.findIn("li").length).toEqual(0)

  it "should have a list called 'links'", ->
    expect(template.list("links").name).toEqual("links")

  it "should return a snippet", ->
    snippet = template.create
      links: { dropdownLink: "one" }

    expect(snippet instanceof Snippet).toBe(true)


# Static function SnippetTemplate.parseIdentifier()
describe "SnippetTemplate.parseIdentifier()", ->

  it "should parse 'bootstrap.title'", ->
    identifier = SnippetTemplate.parseIdentifier("bootstrap.title")
    expect(identifier.namespace).toEqual("bootstrap")
    expect(identifier.name).toEqual("title")

  it "should not parse 'bootstrap'", ->
    identifier = SnippetTemplate.parseIdentifier("bootstrap")
    expect(identifier.namespace).toBeUndefined()
    expect(identifier.name).toBeUndefined()

  it "should not parse emtpy string", ->
    identifier = SnippetTemplate.parseIdentifier("")
    expect(identifier.namespace).toBeUndefined()
    expect(identifier.name).toBeUndefined()

  it "should not parse undefined", ->
    identifier = SnippetTemplate.parseIdentifier()
    expect(identifier.namespace).toBeUndefined()
    expect(identifier.name).toBeUndefined()


# SnippetTemplate constructor
describe "new SnippetTemplate()", ->

  it "should accept idenfitier param", ->
    template = new SnippetTemplate
      identifier: "bootstrap.title"
      html: """<h1 #{ docAttr.editable }="title"></h1>"""

    expect(template.namespace).toEqual("bootstrap")
    expect(template.name).toEqual("title")


# Snippet with snippet containers
describe "container template", ->

  template = null
  beforeEach ->
    template = test.getRowTemplate()

  it "should initialize SnippetContainers", ->
    snippet = template.create()
    treeNode = snippet.snippetTreeNode
    expect(treeNode).toBeDefined()
    expect(treeNode.containers.main instanceof SnippetContainer).toBe(true)
    expect(treeNode.containers.sidebar instanceof SnippetContainer).toBe(true)




