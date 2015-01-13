// Chai
chai = require('chai');
expect = chai.expect;
sinon = require('sinon');


// Extend chai with chai jquery
// This also monkey patches the loaded jquery
// https://github.com/chaijs/chai-jquery
chai.use(function (_chai, utils) {
  engine = require('../../src/node_api')
  // This jquery module already contains a window
  // that's set inside the node_api.coffee file
  jquery = require('jquery')
  return require('../support/chai-jquery/chai-jquery')(_chai, utils, jquery);
});

// Livingdocs Test Helpers
require('../support/setup');
test = require('../support/test_helpers');

