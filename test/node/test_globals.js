// Define window for jQuery.
var jsdom = require("jsdom");
window = jsdom.jsdom().parentWindow;

// Chai
chai = require('chai');
expect = chai.expect;
sinon = require('sinon');

// Extend chai with chai jquery
// https://github.com/chaijs/chai-jquery
chai.use(function (_chai, utils) {
  var jquery = require('jquery');
  return require('../support/chai-jquery/chai-jquery')(_chai, utils, jquery);
});

// Livingdocs Test Helpers
require('../support/setup');
test = require('../support/test_helpers');

