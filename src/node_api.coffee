# load jsdom and create a global window
jsdom = require("jsdom")
path = require('path')
window = jsdom.jsdom().parentWindow
jquery = require('jquery')(window)

# rewrite the jquery variable to allow requiring
# it in other files without setting the window again
jqueryModulePath = path.resolve('./node_modules/jquery/dist/jquery.js')
require.cache[jqueryModulePath].exports = jquery

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
  window: window


  createLivingdoc: ({ data, design, componentTree }) ->
    Livingdoc.create({ data, designName: design, componentTree })


  config: (userConfig) ->
    $.extend(true, config, userConfig)
    augmentConfig(config)

