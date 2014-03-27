DefaultImageManager = require('./default_image_manager')
ResrcitImageManager = require('./resrcit_image_manager')

module.exports = do ->

  defaultImageManager = new DefaultImageManager()
  resrcitImageManager = new ResrcitImageManager()


  set: ($elem, value, imageService) ->
    imageManager = @_getImageManager(imageService)
    imageManager.set($elem, value)


  _getImageManager: (imageService) ->
    switch imageService
      when 'resrc.it' then resrcitImageManager
      else
        defaultImageManager


  getDefaultImageManager: ->
    defaultImageManager


  getResrcitImageManager: ->
    resrcitImageManager
