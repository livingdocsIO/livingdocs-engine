# load jsdom and create a global window
jsdom = require("jsdom")
path = require('path')
window = jsdom.jsdom().parentWindow
jquery = require('jquery')(window)
imageService = require('./image_services/image_service')


# rewrite the jquery variable to allow requiring
# it in other files without setting the window again
jqueryModulePath = path.join(__dirname, '../node_modules/jquery/dist/jquery.js')
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


  createLivingdoc: ({ data, design, layout, componentTree }) ->
    Livingdoc.create({ data, designName: design, layoutName: layout, componentTree })


  config: (userConfig) ->
    $.extend(true, config, userConfig)
    augmentConfig(config)


  getImageService: (serviceName) ->
    imageService.get(serviceName)
