describe "jQuery extensions", ->

  describe "findIn", ->

    it "is defined", ->
      expect($().findIn).toBeDefined()


    it "includes the current node", ->
      $fragment = $ """
      <div class="shouldBeIncluded">
        <p class="shouldBeIncluded"></p>
      </div>
      <div class="shouldBeIncluded">
        <p class="shouldBeIncluded"></p>
      </div>
      """

      # jQuery find only searches children, so will miss the div tags
      expect($fragment.find(".shouldBeIncluded").length).toEqual(2)

      # ...but our extension should include the divs
      expect($fragment.findIn(".shouldBeIncluded").length).toEqual(4)


  describe "outerHtml", ->

    it "should define outerHtml", ->
      expect($().outerHtml).toBeDefined()


    it "outerHtml should return the outer Html", ->
      html = "<p>odynometer</p>"
      expect($(html).html()).toEqual("odynometer")
      expect($(html).outerHtml()).toEqual(html)

