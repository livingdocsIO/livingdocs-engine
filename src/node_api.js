var jsdom = require("jsdom");
global.window = jsdom.jsdom().parentWindow;

$ = require('../components/jquery/jquery');
exports.$ = $;

var document = require('./document');
exports.Document = document;

var design = require('./design/design');
exports.Design = design;

var snippetTree = require('./snippet_tree/snippet_tree');
exports.SnippetTree = snippetTree;
