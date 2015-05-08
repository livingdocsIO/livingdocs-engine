assert = require('../modules/logging/assert')
imageService = require('../image_services/image_service')
ComponentDirective = require('./component_directive')

module.exports = class ImageDirective extends ComponentDirective

  isImage: true

  constructor: ->
    @origins = []
    super


  setContent: (value) ->
    @setImageUrl(value)


  getContent: ->
    @getImageUrl()


  # Copy the contents of this directive to another directive
  # (possibly of a different component).
  #
  # Cropping info should not be copied. And the other directive
  # could possibly have a different image service. Thus we
  # just copy over the original image url.
  copyTo: (otherDirective) ->
    otherDirective.setImageUrl( @getOriginalUrl() )
    otherDirective.setOriginalImageDimensions( @getOriginalImageDimensions() )
    otherDirective.setMimeType( @getMimeType() )



  # Image Directive Methods
  # -----------------------

  isBackgroundImage: (directive) ->
    @templateDirective.getTagName() != 'img'


  isInlineImage: (directive) ->
    @templateDirective.getTagName() == 'img'


  isBase64: ->
    !!@base64Image


  setBase64Image: (base64String) ->
    @base64Image = base64String
    @component.componentTree.contentChanging(@component, @name) if @component.componentTree


  setImageUrl: (value) ->
    @component.content[@name] ?= {}
    @component.content[@name].url = value

    @resetCrop()
    @base64Image = undefined
    @processImageUrl(value)


  getImageUrl: ->
    image = @component.content[@name]
    if image
      image.url
    else
      undefined


  getImageObject: ->
    @component.content[@name]


  getOriginalUrl: ->
    @component.content[@name]?.originalUrl || @getImageUrl()


  setCrop: (crop) ->
    currentValue = @component.content[@name]
    return unless currentValue?.url?

    if crop
      { x, y, width, height, name } = crop
      currentValue.crop = {x, y, width, height, name}
    else
      delete currentValue.crop

    @processImageUrl(currentValue.originalUrl || currentValue.url)
    @component.componentTree.contentChanging(@component, @name) if @component.componentTree


  getCrop: ->
    @component.content[@name].crop


  setOriginalImageDimensions: ({width, height}) ->
    content = @component.content[@name]
    content.width = width
    content.height = height


  getOriginalImageDimensions: ->
    content = @component.content[@name]

    width: content?.width,
    height: content?.height


  setMimeType: (mimeType) ->
    @component.content[@name] ?= {}
    content = @component.content[@name]
    content.mimeType = mimeType


  getMimeType: ->
    content = @component.content[@name]
    content?.mimeType


  resetCrop: ->
    currentValue = @component.content[@name]
    currentValue.crop = null if currentValue?


  setImageService: (imageServiceName) ->
    assert imageService.has(imageServiceName), "Error: could not load image service #{ imageServiceName }"

    imageUrl = @getImageUrl()
    @component.content[@name] =
      url: imageUrl
      imageService: imageServiceName || null


  getImageServiceName: ->
    @getImageService().name


  hasDefaultImageService: ->
    @getImageServiceName() == 'default'


  getImageService: ->
    serviceName = @component.content[@name]?.imageService
    imageService.get(serviceName || undefined)


  processImageUrl: (url) ->
    if not @hasDefaultImageService()
      imgService = @getImageService()
      imgObj = @getImageObject()
      imgObj.url = imgService.getUrl(url, crop: imgObj.crop)
      imgObj.originalUrl = url


  setOrigins: ->
    # TODO


  getOrigins: ->
    @origins

