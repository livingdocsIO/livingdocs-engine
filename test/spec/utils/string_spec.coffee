describe "string helper", ->

  describe "humanize", ->

    it "works with camel case", ->
      expect(S.humanize("camelCase")).toEqual("Camel Case")

    it "trims the input", ->
      expect(S.humanize(" camelCase   ")).toEqual("Camel Case")


  describe "titleize", ->

    it "converts first letters to uppercase", ->
      expect(S.titleize("my fair lady")).toEqual("My Fair Lady")


  describe "capitalize", ->

    it "converts first letters to uppercase", ->
      expect(S.capitalize("a sentence")).toEqual("A sentence")


  describe "prefix", ->

    it "adds a prefix to a string", ->
      expect(S.prefix("ms-", "word")).toEqual("ms-word")


    it "does not add a prefix twice", ->
      expect(S.prefix("ms-", "ms-word")).toEqual("ms-word")

