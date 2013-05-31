describe "mixins util", ->

  beforeEach ->
    @Indestructible =
      destroy: ->
        "nope"


  it "returns a function with a prototype", ->
    mixinClass = mixins @Indestructible
    expect( $.isFunction(mixinClass) ).toBe(true)
    expect( mixinClass::destroy ).toBeDefined


  it "generally works", ->

    # class witch uses the mixin
    class Superhero extends mixins @Indestructible

      attackWithLaserbeam: ->
        @destroy()

    rudolf = new Superhero()
    expect( rudolf ).toBeDefined()
    expect( rudolf.destroy ).toBeDefined()
    expect( rudolf.attackWithLaserbeam() ).toEqual("nope")

