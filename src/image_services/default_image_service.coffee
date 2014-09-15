module.exports =

  setInlineImage: ($elem, value) ->
    $elem.attr('src', value)


  setBackgroundImage: ($elem, value) ->
    $elem.css('background-image', "url(#{ @escapeCssUri(value) })")


  setPlaceholder: ($elem) ->
    dim = @getImageDimensions($elem)
    imageUrl = "http://placehold.it/#{ dim.width }x#{ dim.height }/BEF56F/B2E668"


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
    if @isInlineImage()
      width: $elem.width()
      height: $elem.height()
    else
      width: $elem.outerWidth()
      height: $elem.outerHeight()


  isBase64: (value) ->
    value.indexOf('data:image') == 0


  isInlineImage: ($elem) ->
    $elem[0].nodeName.toLowerCase() == 'img'


  isBackgroundImage: ($elem) ->
    $elem[0].nodeName.toLowerCase() != 'img'

