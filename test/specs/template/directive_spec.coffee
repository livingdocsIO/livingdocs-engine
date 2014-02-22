Directive = require('../../../src/template/directive')

describe 'Directive', ->

  describe 'isElementDirective()', ->

    it 'returns true for "editable"', ->
      directive = new Directive (name: 'foo', type: 'editable')
      expect(directive.isElementDirective()).to.be.true


    it 'returns false for "option"', ->
      directive = new Directive (name: 'foo', type: 'optional')
      expect(directive.isElementDirective()).to.be.false
