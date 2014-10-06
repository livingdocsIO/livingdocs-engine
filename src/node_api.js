var jsdom = require("jsdom");
global.window = jsdom.jsdom().parentWindow;

var document = require('./document');
exports.Document = document;
