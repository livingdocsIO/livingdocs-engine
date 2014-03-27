assert = require('./modules/logging/assert')

Document = require('./document')
SnippetTree = require('./snippet_tree/snippet_tree')
Design = require('./design/design')
designCache = require('./design/design_cache')
EditorPage = require('./rendering_container/editor_page')

module.exports = doc = do ->

  editorPage = new EditorPage()


  # Instantiation process:
  # async or sync -> get design (include js for synchronous loading)
  # sync -> create document
  # async -> create view (iframe)
  # async -> load resources into view


  # Load a document from serialized data
  # in a synchronous way. Design must be loaded first.
  new: ({ data, design }) ->
    snippetTree = if data?
      designName = data.design?.name
      assert designName?, 'Error creating document: No design is specified.'
      design = @design.get(designName)
      new SnippetTree(content: data, design: design)
    else
      designName = design
      design = @design.get(designName)
      new SnippetTree(design: design)

    @create(snippetTree)


  # Todo: add async api (async because of the loading of the design)
  #
  # Example:
  # doc.load(jsonFromServer)
  #  .then (document) ->
  #    document.createView('.container', { interactive: true })
  #  .then (view) ->
  #    # view is ready


  # Direct creation with an existing SnippetTree
  create: (snippetTree) ->
    new Document({ snippetTree })


  # See designCache.load for examples how to load your design.
  design: designCache

  # Start drag & drop
  startDrag: $.proxy(editorPage, 'startDrag')


# Export global variable
window.doc = doc
