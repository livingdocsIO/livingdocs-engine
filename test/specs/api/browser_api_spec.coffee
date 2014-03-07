require('../../../src/browser_api')

describe 'Public API', ->

  it 'defines the global variable doc', ->
    expect(window.doc).to.exist


  it 'global variable doc is a function', ->
    expect( $.isFunction(window.doc) ).to.be.true


  describe 'init()', ->

    it 'is defined', ->
      expect( window.doc.init ).to.exist


    # currently doc.init() can only be done once
    # so this is not really unit testable
    it 'loads an empty document', ->
      node = $('<div>')[0]
      doc.init(design: test.testDesign, json: undefined, rootNode: node)
      expect( doc.toJson().content ).to.deep.equal([])


  describe 'toJson()', ->

    it 'is defined', ->
      expect( window.doc.toJson ).to.exist


  it 'define ready', ->
    expect( $.isFunction(window.doc.ready)).to.be.true


  it 'define changed', ->
    expect( $.isFunction(window.doc.changed)).to.be.true

