assert = require('../modules/logging/assert')
imageService = require('../image_services/image_service')

module.exports = class ImageDirective

  constructor: ({ @snippet, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


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
    @snippet.snippetTree.contentChanging(@snippet, @name) if @snippet.snippetTree


  setImageUrl: (value) ->
    @snippet.content[@name] ?= {}
    @snippet.content[@name].url = value

    @resetCrop()
    @base64Image = undefined
    @processImageUrl(value)


  getImageUrl: ->
    image = @snippet.content[@name]
    if image
      image.url
    else
      undefined


  getImageObject: ->
    @snippet.content[@name]


  getOriginalUrl: ->
    @snippet.content[@name].originalUrl || @getImageUrl()


  setCrop: ({ x, y, width, height, name }) ->
    currentValue = @snippet.content[@name]

    if currentValue?.url?
      currentValue.crop =
        x: x
        y: y
        width: width
        height: height
        name: name

      @processImageUrl(currentValue.originalUrl || currentValue.url)
      @snippet.snippetTree.contentChanging(@snippet, @name) if @snippet.snippetTree


  resetCrop: ->
    currentValue = @snippet.content[@name]
    if currentValue?
      currentValue.crop = null


  setImageService: (imageServiceName) ->
    assert imageService.has(imageServiceName), "Error: could not load image service #{ imageServiceName }"

    imageUrl = @getImageUrl()
    @snippet.content[@name] =
      url: imageUrl
      imageService: imageServiceName || null


  getImageServiceName: ->
    if @snippet.content[@name]?.imageService?
      @snippet.content[@name].imageService
    else
      'default'


  hasDefaultImageService: ->
    @getImageServiceName() == 'default'


  getImageService: ->
    serviceName = @getImageServiceName()
    imageService.get(serviceName)


  processImageUrl: (url) ->
    if not @hasDefaultImageService()
      imgService = @getImageService()
      imgObj = @getImageObject()
      imgObj.url = imgService.getUrl(url, crop: imgObj.crop)
      imgObj.originalUrl = url

