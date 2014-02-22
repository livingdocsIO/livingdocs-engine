// Chai
chai = require('chai');
expect = chai.expect;

// Jsdom
// Define window for jQuery.
jsdom = require("jsdom");
window = jsdom.jsdom().parentWindow;

// Livingdocs Test Helpers
test = require('../support/test');
config = require('../../src/configuration/defaults')
docClass = config.docClass

