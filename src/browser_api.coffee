assert = require('./modules/logging/assert')

config = require('./configuration/config')
augmentConfig = require('./configuration/augment_config')
Livingdoc = require('./livingdoc')
SnippetTree = require('./snippet_tree/snippet_tree')
designParser = require('./design/design_parser')
Design = require('./design/design')
designCache = require('./design/design_cache')
EditorPage = require('./rendering_container/editor_page')

module.exports = doc = do ->

  editorPage = new EditorPage()


  # Load and access designs.
  #
  # Load a design:
  # design.load(yourDesignJson)
  #
  # Check if a design is already loaded:
  # design.has(nameOfYourDesign)
  #
  # Get an already loaded design:
  # design.get(nameOfYourDesign)
  design: designCache


  # Load a livingdoc from serialized data in a synchronous way.
  # The design must be loaded first.
  #
  # @returns { Livingdoc object }
  new: ({ data, design }) ->
    snippetTree = if data?
      designName = data.design?.name
      assert designName?, 'Error creating livingdoc: No design is specified.'
      design = @design.get(designName)
      new SnippetTree(content: data, design: design)
    else
      designName = design
      design = @design.get(designName)
      new SnippetTree(design: design)

    @create(snippetTree)


  # Direct creation with an existing SnippetTree
  # @returns { Livingdoc object }
  create: (snippetTree) ->
    new Livingdoc({ snippetTree })


  # Todo: add async api (async because of the loading of the design)
  # Move the design loading code from the editor into the enigne.
  #
  # Example:
  # doc.load(jsonFromServer)
  #  .then (livingdoc) ->
  #    livingdoc.createView('.container', { interactive: true })
  #  .then (view) ->
  #    # view is ready


  # Start drag & drop
  startDrag: $.proxy(editorPage, 'startDrag')


  # Change the configuration
  config: (userConfig) ->
    $.extend(true, config, userConfig)
    augmentConfig(config)



# Export global variable
window.doc = doc
