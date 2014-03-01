// Chai
chai = require('chai');
expect = chai.expect;

// Jsdom
// Define window for jQuery.
jsdom = require("jsdom");
window = jsdom.jsdom().parentWindow;

// Livingdocs Test Helpers
require('../support/setup');

// Setup global variables for tests
test = require('../support/test_helpers');
$ = test.$;
config = require('../../src/configuration/defaults')
docClass = config.docClass

