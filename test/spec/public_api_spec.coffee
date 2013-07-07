describe 'Public API', ->

  it 'defines the global variable doc', ->
    expect(window.doc).toBeDefined()


  it 'global variable doc is a function', ->
    expect( $.isFunction(window.doc) ).toBe(true)


  describe 'addDesign()', ->

    it 'is defined', ->
      expect( window.doc.addDesign ).toBeDefined()


  describe 'loadDocument()', ->

    it 'is defined', ->
      expect( window.doc.loadDocument ).toBeDefined()


    # currently loadDocument() can only be done once
    # so this is not really unit testable
    it 'loads an empty document', ->
      node = $('<div>')[0]
      doc.addDesign(testSnippets.snippets, testSnippets.config)
      doc.loadDocument(json: undefined, rootNode: node)
      expect( doc.toJson().content ).toEqual([])




  describe 'toJson()', ->

    it 'is defined', ->
      expect( window.doc.toJson ).toBeDefined()


  it 'define ready', ->
    expect( $.isFunction(window.doc.ready)).toBe(true)


  it 'define changed', ->
    expect( $.isFunction(window.doc.changed)).toBe(true)


  # it 'define snippetFocused', ->
  #   expect( $.isFunction(window.doc.snippetFocused)).toBe(true)


  # it 'define snippetBlurred', ->
  #   expect( $.isFunction(window.doc.snippetBlurred)).toBe(true)


  # it 'define textSelection', ->
  #   expect( $.isFunction(window.doc.textSelection)).toBe(true)


