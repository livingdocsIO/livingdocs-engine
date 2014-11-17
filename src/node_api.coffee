# load jsdom and create a global window
jsdom = require("jsdom")
global.window = jsdom.jsdom().parentWindow

Livingdoc = require('./livingdoc')
ComponentTree = require('./component_tree/component_tree')
designCache = require('./design/design_cache')
config = require('./configuration/config')
augmentConfig = require('./configuration/augment_config')
version = require('../version')

module.exports = do ->

  design: designCache
  Livingdoc: Livingdoc
  ComponentTree: ComponentTree
  version: version.version
  revision: version.revision


  createLivingdoc: ({ data, design, componentTree }) ->
    Livingdoc.create({ data, designName: design, componentTree })


  config: (userConfig) ->
    $.extend(true, config, userConfig)
    augmentConfig(config)

