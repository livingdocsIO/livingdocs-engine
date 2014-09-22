assert = require('../modules/logging/assert')
defaultImageService = require('./default_image_service')
resrcitImageService = require('./resrcit_image_service')

module.exports = do ->

  # Available Image Services
  services =
    'resrc.it': resrcitImageService
    'default': defaultImageService


  # Service
  # -------

  has: (serviceName) ->
    services[serviceName]?


  get: (serviceName) ->
    assert @has(serviceName), "Could not load image service #{ serviceName }"
    services[serviceName]


  eachService: (callback) ->
    for name, service of services
      callback(name, service)

