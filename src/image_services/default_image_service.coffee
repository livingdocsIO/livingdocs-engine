module.exports =

  # Image Service Interface
  # -----------------------

  name: 'default'

  # Set value to an image or background image element.
  #
  # @param { jQuery object } Node to set the image to.
  # @param { String } Image url
  set: ($elem, value) ->
    if @isInlineImage($elem)
      @setInlineImage($elem, value)
    else
      @setBackgroundImage($elem, value)


  setPlaceholder: ($elem) ->
    dim = @getImageDimensions($elem)
    imageUrl = "http://placehold.it/#{ dim.width }x#{ dim.height }/BEF56F/B2E668"


  # The default service does not transfor the given url
  getUrl: (value) ->
    value


  # Default Image Service methods
  # -----------------------------

  setInlineImage: ($elem, value) ->
    $elem.attr('src', value)


  setBackgroundImage: ($elem, value) ->
    $elem.css('background-image', "url(#{ @escapeCssUri(value) })")


  # Escape the URI in case invalid characters like '(' or ')' are present.
  # The escaping only happens if it is needed since this does not work in node.
  # When the URI is escaped in node the background-image is not written to the
  # style attribute.
  escapeCssUri: (uri) ->
    if /[()]/.test(uri)
      "'#{ uri }'"
    else
      uri


  getImageDimensions: ($elem) ->
    if @isInlineImage($elem)
      width: $elem.width()
      height: $elem.height()
    else
      width: $elem.outerWidth()
      height: $elem.outerHeight()


  isBase64: (value) ->
    value.indexOf('data:image') == 0 if value?


  isInlineImage: ($elem) ->
    $elem[0].nodeName.toLowerCase() == 'img'


  isBackgroundImage: ($elem) ->
    $elem[0].nodeName.toLowerCase() != 'img'

