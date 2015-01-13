assert = require('../modules/logging/assert')
imageService = require('../image_services/image_service')
ComponentDirective = require('./component_directive')

module.exports = class ImageDirective extends ComponentDirective

  isImage: true


  setContent: (value) ->
    @setImageUrl(value)


  getContent: ->
    @getImageUrl()


  # Image Directive Methods
  # -----------------------

  isBackgroundImage: (directive) ->
    @templateDirective.getTagName() != 'img'


  isInlineImage: (directive) ->
    @templateDirective.getTagName() == 'img'


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
    @component.content[@name].originalUrl || @getImageUrl()


  setCrop: ({ x, y, width, height, name }) ->
    currentValue = @component.content[@name]

    if currentValue?.url?
      currentValue.crop =
        x: x
        y: y
        width: width
        height: height
        name: name

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
    {
      width: content.width,
      height: content.height
    }


  resetCrop: ->
    currentValue = @component.content[@name]
    if currentValue?
      currentValue.crop = null


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

