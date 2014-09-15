assert = require('../modules/logging/assert')
imageService = require('../image_services/image_service')

module.exports = class SnippetDirective

  constructor: ({ @snippet, @templateDirective }) ->
    @name = @templateDirective.name
    @type = @templateDirective.type


  # Image Directive Methods
  # -----------------------

  isBackgroundImage: (directive) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    @templateDirective.getTagName() != 'img'


  isInlineImage: (directive) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    @templateDirective.getTagName() == 'img'


  setBase64Image: (base64String) ->
    @base64Image = base64String
    @snippet.snippetTree.contentChanging(@snippet, name) if @snippet.snippetTree


  isImage: ->
    @type == 'image'


  setImageUrl: (value) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    currentValue = @snippet.content[@name]
    if typeof currentValue == 'string' || not currentValue
      @snippet.content[@name] =
        url: value
    else
      @snippet.content[@name].url = value

    @resetCrop()
    @base64Image = undefined
    @processImageUrl(value)


  getImageUrl: ->
    assert @type == 'image', 'Error: method only viable for image directives'

    image = @snippet.content[@name]
    if not image
      undefined
    else if typeof image == 'string'
      image
    else
      image.url


  getOriginalUrl: ->
    @snippet.content[@name].originalUrl || @getImageUrl()


  setCrop: ({ x, y, width, height }) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    currentValue = @snippet.content[@name]

    if currentValue?.url?
      currentValue.imageWidth = 0
      currentValue.imageHeight = 0
      currentValue.crop =
        x: x
        y: y
        width: width
        height: height

      @processImageUrl(currentValue.originalUrl || currentValue.url)
      @snippet.snippetTree.contentChanging(@snippet, name) if @snippet.snippetTree


  getCropData: ->
    @snippet.content[@name]?.crop


  resetCrop: ->
    currentValue = @snippet.content[@name]
    if currentValue?
      currentValue.imageWidth = null
      currentValue.imageHeight = null
      currentValue.crop = null


  setImageService: (imageServiceName) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    assert imageService.has(imageServiceName), "Error: could not load image service #{ imageServiceName }"

    imageUrl = @getImageUrl()
    @snippet.content[@name] =
      url: imageUrl
      imageService: imageServiceName || null


  getImageService: ->
    @snippet.content[@name].imageService


  processImageUrl: (value) ->
    assert @type == 'image', 'Error: method only viable for image directives'
    currentValue = @snippet.content[@name]

    if currentValue?.imageService?
      imgService = imageService.get(currentValue.imageService)
      cropInfo = currentValue.crop
      currentValue.url = imgService.getUrl(value, cropInfo)
      currentValue.originalUrl = value

