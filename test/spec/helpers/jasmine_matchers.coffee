beforeEach ->

  this.addMatchers

    toLookLike: (expected) ->
      notText = if @isNot then ' not' else ''

      actualHtml = if @actual.jquery then @actual.outerHtml() else @actual
      expectedlHtml = if expected.jquery then expected.outerHtml() else expected
      @message = ->
        "#{ actualHtml } \n#{ notText } should look like \n#{ expectedlHtml }"

      htmlCompare.compare(@actual, expected)
