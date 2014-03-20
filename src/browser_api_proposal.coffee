assert = require('./modules/logging/assert')

Document = require('.//document_proposal')
SnippetTree = require('./snippet_tree/snippet_tree')
Design = require('./design/design')
designCache = require('./design/design_cache')

module.exports = doc = do ->

  # # async -> get design
  # # sync -> create document
  # # async -> create view (iframe)
  # # async -> load resources into view

  # Load a document from serialized data.
  #
  # Todo: transform into async api (because of the loading of the design)
  #
  # Example use:
  # doc.new(jsonFromServer)
  #  .then (document) ->
  #    document.createView()
  #  .then (view) ->
  #    # view is ready
  new: ({ data, design }) ->
    snippetTree = if data?
      designName = data.design
      design = @design.get(designName)
      new SnippetTree(content: data, design: design)
    else
      designName = design
      design = @design.get(designName)
      new SnippetTree(design: design)

    @create(snippetTree)


  # Sync api
  create: (snippetTree) ->
    new Document({ snippetTree })


  design: designCache


# Export global variable
window.doc = doc


# promise = document.createView
#   interactive: true
#   parent: '.host'

# # Combined new call
# doc.new
#   json: jsonFromServer
#   view:
#     interactive: true
#     parent: '.host'


# # Create an additional view
# promise = document.createView
#   name: 'preview'
#   readonly: true
#   iframe: true


# # Replace the document with another one
# document.load(jsonFromServer)

# # Replace the document with a new one
# document.new()
