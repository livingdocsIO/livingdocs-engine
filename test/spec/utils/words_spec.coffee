describe "words util", ->

  describe "humanize", ->

    it "works with camel case", ->
      expect(words.humanize("camelCase")).toEqual("Camel Case")

    it "trims the input", ->
      expect(words.humanize(" camelCase   ")).toEqual("Camel Case")


  describe "titleize", ->

    it "converts first letters to uppercase", ->
      expect(words.titleize("my fair lady")).toEqual("My Fair Lady")


  describe "capitalize", ->

    it "converts first letters to uppercase", ->
      expect(words.capitalize("a sentence")).toEqual("A sentence")


  describe "prefix", ->

    it "adds a prefix to a string", ->
      expect(words.prefix("ms-", "word")).toEqual("ms-word")


    it "does not add a prefix twice", ->
      expect(words.prefix("ms-", "ms-word")).toEqual("ms-word")


  describe "snakeCase", ->

    it "converts to snakeCase", ->
      expect(words.snakeCase("snakeCase")).toEqual("snake-case")


  describe "camelize", ->

    it "converts to camelCase", ->
      expect(words.camelize("camel-case")).toEqual("camelCase")

    it "leaves camelCase string untouched", ->
      expect(words.camelize("camelCase")).toEqual("camelCase")

    it "removes unnecessary dashes", ->
      expect(words.camelize("camel--case")).toEqual("camelCase")
