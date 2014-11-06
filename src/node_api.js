var jsdom = require("jsdom");
global.window = jsdom.jsdom().parentWindow;

$ = require('../components/jquery/jquery');
exports.$ = $;

exports.Design = require('./design/design');
exports.Livingdoc = require('./livingdoc');
exports.ComponentTree = require('./component_tree/component_tree');
