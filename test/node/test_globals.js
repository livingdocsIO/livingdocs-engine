
// Chai
chai = require('chai');
expect = chai.expect;
sinon = require('sinon');


// Extend chai with chai jquery
// https://github.com/chaijs/chai-jquery
chai.use(function (_chai, utils) {
  engine = require('../../')
  // Patch the loaded jQuery
  return require('../support/chai-jquery/chai-jquery')(_chai, utils, engine.jquery);
});

// Livingdocs Test Helpers
require('../support/setup');
test = require('../support/test_helpers');

