describe "string helper util", ->

  # Tests
  # -----

  it "S.humanize should work with camel case", ->
    expect(S.humanize("camelCase")).toEqual("Camel Case")

  it "S.humanize should trim the input", ->
    expect(S.humanize(" camelCase   ")).toEqual("Camel Case")

  it "S.titleize should convert first letters to uppercase", ->
    expect(S.titleize("my fair lady")).toEqual("My Fair Lady")

  it "S.capitalize should convert first letters to uppercase", ->
    expect(S.capitalize("a sentence")).toEqual("A sentence")

