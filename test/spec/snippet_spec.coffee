describe @snippet, ->

  # Setup
  # =====
  beforeEach ->
    @snippet = new Snippet({})


  # Tests
  # =====

  it "should instantiate", ->
    expect(@snippet).toBeDefined()

  it "should contain mixin TreeNode", ->
    expect( test.hasProperty(@snippet, "parent") ).toBe(true)
    expect( test.hasProperty(@snippet, "previous") ).toBe(true)
    expect( test.hasProperty(@snippet, "next") ).toBe(true)







