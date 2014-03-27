DefaultImageManager = require('./default_image_manager')
module.exports = class RescritImageManager extends DefaultImageManager

  @resrcitUrl: 'http://trial.resrc.it/'


  constructor: ->
    # empty


  set: ($elem, value) ->
    if $elem[0].nodeName.toLowerCase() == 'img'
    $elem.addClass('resrc')
    if @isImgTag($elem)
      $elem.removeAttr('src')
      $elem.attr('data-src', "#{RescritImageManager.resrcitUrl}#{value}")
    else
      $elem.css('background-image', "url(#{RescritImageManager.resrcitUrl}#{ @escapeCssUri(value) })")

