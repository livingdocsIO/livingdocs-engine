// Chai
chai = require('chai');
expect = chai.expect;
sinon = require('sinon');

// Jsdom
// Define window for jQuery.
jsdom = require("jsdom");
window = jsdom.jsdom().parentWindow;

// Livingdocs Test Helpers
require('../support/setup');

// Setup global variables for tests
log = require('../../src/modules/logging/log')
assert = require('../../src/modules/logging/assert')

test = require('../support/test_helpers');
_ = require('underscore')

config = require('../../src/configuration/config')
getInstances = require('../support/factories/instance_injector').get

function initTestGlobals() {
  var $ = require('jquery');
  chai.use(function (_chai, utils) {
    return require('../support/chai-jquery/chai-jquery')(_chai, utils, $);
  });
}

initTestGlobals();
