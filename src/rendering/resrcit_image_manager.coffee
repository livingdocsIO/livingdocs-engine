DefaultImageManager = require('./default_image_manager')
assert = require('../modules/logging/assert')

module.exports = class RescritImageManager extends DefaultImageManager

  @resrcitUrl: 'http://app.resrc.it/'


  constructor: ->
    # empty


  getUrl: (value, cropInfo) ->
    cropParam = "C=W#{ cropInfo.width },H#{ cropInfo.height },X#{ cropInfo.x },Y#{ cropInfo.y }/" if cropInfo?
    "#{ RescritImageManager.resrcitUrl }#{ cropParam || '' }#{ value }"


  getCssUrl: (value) ->
    "url(#{RescritImageManager.resrcitUrl}#{ @escapeCssUri(value) })"


  set: ($elem, value) ->
    return @setBase64($elem, value) if @isBase64(value)

    assert value? && value != '', 'Src value for an image has to be defined'

    $elem.addClass('resrc')
    if @isImgTag($elem)
      @resetSrcAttribute($elem) if $elem.attr('src') && @isBase64($elem.attr('src'))
      $elem.attr('data-src', @getUrl(value))
    else
      $elem.css('background-image', @getCssUrl(value))


  # Set src directly, don't add resrc class
  setBase64: ($elem, value) ->
    if @isImgTag($elem)
      $elem.attr('src', value)
    else
      $elem.css('background-image', "url(#{ @escapeCssUri(value) })")


  resetSrcAttribute: ($elem) ->
    $elem.removeAttr('src')
