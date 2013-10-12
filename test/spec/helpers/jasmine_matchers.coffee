do ->

  # Accepts:
  # - undefined
  # - string
  # - DOM node
  # - jquery element
  #
  # Always returns a string
  outerHtml = (obj) ->
    if not obj?
      ''
    else if typeof obj == 'string'
      obj
    else
      obj = $(obj) if !obj.jquery
      obj.outerHtml()


  beforeEach ->

    this.addMatchers


      toEqualHtmlOf: (expected) ->
        notText = if @isNot then ' not' else ''

        actualHtml = outerHtml(@actual)
        expectedlHtml = outerHtml(expected)
        @message = ->
          "#{ actualHtml } \n#{ notText } should have equal html as \n#{ expectedlHtml }"

        htmlCompare.compare(@actual, expected)


      toThrowLivingdocsError: (expected) ->
        notText = if @isNot then ' not' else ''

        try
          @actual.call()
        catch error
          hasThrown = true
          livingdocsError = error.thrownByLivingdocs

        @message = ->
          "Expected#{ notText } to throw a LivingdocsError"

        hasThrown && livingdocsError
