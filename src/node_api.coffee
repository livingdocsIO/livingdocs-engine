# load jsdom and create a global window
jsdom = require("jsdom")
global.window = jsdom.jsdom().parentWindow

designCache = require('./design/design_cache')

exports.design = designCache
exports.Livingdoc = require('./livingdoc')
exports.ComponentTree = require('./component_tree/component_tree')
exports.version = require('../version')

