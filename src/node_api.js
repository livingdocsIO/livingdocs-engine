var version = require('../version');
var jsdom = require("jsdom");

global.window = jsdom.jsdom().parentWindow;

exports.$ = require('../components/jquery/jquery');
exports.Design = require('./design/design');
exports.Livingdoc = require('./livingdoc');
exports.ComponentTree = require('./component_tree/component_tree');
exports.version = version.version;
