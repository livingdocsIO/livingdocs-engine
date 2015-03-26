Directive = require('../../../src/template/directive')

describe 'directive:', ->

  describe 'overwritesContent()', ->

    it 'returns true for "editable"', ->
      directive = new Directive (name: 'foo', type: 'editable')
      expect(directive.overwritesContent()).to.be.true


    it 'returns false for "option"', ->
      directive = new Directive (name: 'foo', type: 'optional')
      expect(directive.overwritesContent()).to.be.false


  describe 'isModification()', ->

    it 'returns true for "option"', ->
      directive = new Directive (name: 'foo', type: 'optional')
      expect(directive.isModification()).to.be.true


    it 'returns false for "editable"', ->
      directive = new Directive (name: 'foo', type: 'editable')
      expect(directive.isModification()).to.be.false

