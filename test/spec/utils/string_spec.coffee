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

  it "S.prefix should add a prefix to a string", ->
    expect(S.prefix("ms-", "word")).toEqual("ms-word")

  it "S.prefix should not add a prefix twice", ->
    expect(S.prefix("ms-", "ms-word")).toEqual("ms-word")

