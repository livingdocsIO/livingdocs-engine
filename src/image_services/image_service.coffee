DefaultImageManager = require('../rendering/default_image_manager')
ResrcitImageManager = require('../rendering/resrcit_image_manager')

module.exports = do ->

  services = {}

  # Service
  # -------

  has: (serviceName) ->
    @loadService(serviceName)?


  get: (serviceName) ->
    @loadService(serviceName)


  loadService: (serviceName) ->
    return unless serviceName
    return services[serviceName] if services[serviceName]?

    imageService = switch serviceName
      when 'resrc.it'
        new ResrcitImageManager()
      when 'default', '', null, undefined
        new DefaultImageManager()
      else
        assert false, "Could not load image service #{ serviceName }"

    services[serviceName] = imageService if imageService?

