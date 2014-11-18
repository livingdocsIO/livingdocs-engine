config = require('./configuration/config')
augmentConfig = require('./configuration/augment_config')
Livingdoc = require('./livingdoc')
ComponentTree = require('./component_tree/component_tree')
designCache = require('./design/design_cache')
EditorPage = require('./rendering_container/editor_page')
version = require('../version')

module.exports = doc = do ->

  editorPage = new EditorPage()

  # Set the current version
  version: version.version
  revision: version.revision


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


  # Direct access to models
  Livingdoc: Livingdoc
  ComponentTree: ComponentTree


  # Load a livingdoc from serialized data in a synchronous way.
  # The design must be loaded first.
  #
  # Call Options:
  # - new({ data })
  #   Load a livingdoc with JSON data
  #
  # - new({ design })
  #   This will create a new empty livingdoc with your
  #   specified design
  #
  # - new({ componentTree })
  #   This will create a new livingdoc from a
  #   componentTree
  #
  # @param data { json string } Serialized Livingdoc
  # @param designName { string } Name of a design
  # @param componentTree { ComponentTree } A componentTree instance
  # @returns { Livingdoc object }
  createLivingdoc: ({ data, design, componentTree }) ->
    Livingdoc.create({ data, designName: design, componentTree })


  # Alias for backwards compatibility
  new: -> @createLivingdoc.apply(this, arguments)
  create: -> @createLivingdoc.apply(this, arguments)


  # Start drag & drop
  startDrag: $.proxy(editorPage, 'startDrag')


  # Change the configuration
  config: (userConfig) ->
    $.extend(true, config, userConfig)
    augmentConfig(config)



# Export global variable
window.doc = doc

