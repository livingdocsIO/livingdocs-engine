DefaultImageManager = require('./default_image_manager')
module.exports = class RescritImageManager extends DefaultImageManager

  @resrcitUrl: 'http://trial.resrc.it/'


  constructor: ->
    # empty


  set: ($elem, value) ->
    return @setBase64($elem, value) if @isBase64(value)

    $elem.addClass('resrc')
    if @isImgTag($elem)
      $elem.removeAttr('src')
      $elem.attr('data-src', "#{RescritImageManager.resrcitUrl}#{value}")
    else
      $elem.css('background-image', "url(#{RescritImageManager.resrcitUrl}#{ @escapeCssUri(value) })")


  # Set src directly, don't add resrc class
  setBase64: ($elem, value) ->
    if @isImgTag($elem)
      $elem.attr('src', value)
    else
      $elem.css('background-image', "url(#{ @escapeCssUri(value) })")
