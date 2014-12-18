config = require('../configuration/config').imageServices['resrc.it']
assert = require('../modules/logging/assert')
imgService = require('./default_image_service')

module.exports = do ->

  # Image Service Interface
  # -----------------------

  name: 'resrc.it'

  # @param { jQuery object }
  # @param { String } A resrc.it url. E.g. http://app.resrc.it/http://images.com/1.jpg
  set: ($elem, url) ->
    assert url? && url != '', 'Src value for an image has to be defined'

    return @setBase64($elem, url) if imgService.isBase64(url)

    $elem.addClass('resrc')
    if imgService.isInlineImage($elem)
      @setInlineImage($elem, url)
    else
      @setBackgroundImage($elem, url)


  setPlaceholder: ($elem) ->
    imgService.setPlaceholder($elem)


  getUrl: (value, { crop, quality }={}) ->
    style = ""
    style += "/C=W#{ crop.width },H#{ crop.height },X#{ crop.x },Y#{ crop.y }" if crop?
    style += "/O=#{ q }" if q = quality || config.quality
    "#{ config.host }#{ style }/#{ value }"


  # Image specific methods
  # ----------------------

  formatCssUrl: (url) ->
    url = imgService.escapeCssUri(url)
    "url(#{ url })"


  setInlineImage: ($elem, url) ->
    $elem.removeAttr('src') if imgService.isBase64($elem.attr('src'))
    $elem.attr('data-src', url)


  setBackgroundImage: ($elem, url) ->
    $elem.css('background-image', @formatCssUrl(url))


  # Set src directly, don't add resrc class
  setBase64: ($elem, base64String) ->
    imgService.set($elem, base64String)

