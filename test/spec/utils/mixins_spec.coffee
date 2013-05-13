describe "mixins util", ->

  # Setup
  # =====
  beforeEach ->

    # mixin
    @Indestructible =
      destroy: ->
        "nope"


  # Tests
  # =====

  it "should return a function with prototype", ->
    mixinClass = mixins @Indestructible
    expect( $.isFunction(mixinClass) ).toBe(true)
    expect( mixinClass::destroy ).toBeDefined


  it "should generally work", ->

    # class witch uses the mixin
    class Superhero extends mixins @Indestructible

      attackWithLaserbeam: ->
        @destroy()

    rudolf = new Superhero()
    expect( rudolf ).toBeDefined()
    expect( rudolf.destroy ).toBeDefined()
    expect( rudolf.attackWithLaserbeam() ).toEqual("nope")

