module.exports = class DefaultImageManager

  constructor: ->
    # empty


  set: ($elem, value) ->
    if $elem[0].nodeName.toLowerCase() == 'img'
      $elem.attr('src', value)
    else
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
