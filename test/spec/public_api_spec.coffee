describe 'Public API', ->

  it 'defines the global variable doc', ->
    expect(window.doc).toBeDefined()


  it 'global variable doc is a function', ->
    expect( $.isFunction(window.doc) ).toBe(true)


  it 'defines doc.loadDocument', ->
    expect( window.doc.loadDocument ).toBeDefined()


  it 'defines doc.addSnippetCollection', ->
    expect( window.doc.addSnippetCollection ).toBeDefined()


  describe '(events)', ->

    it 'define ready', ->
      expect( $.isFunction(window.doc.ready)).toBe(true)


    it 'define snippetFocused', ->
      expect( $.isFunction(window.doc.snippetFocused)).toBe(true)


    it 'define snippetBlurred', ->
      expect( $.isFunction(window.doc.snippetBlurred)).toBe(true)


    it 'define textSelection', ->
      expect( $.isFunction(window.doc.textSelection)).toBe(true)
