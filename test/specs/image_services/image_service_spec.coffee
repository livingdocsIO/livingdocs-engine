imageService = require('../../../src/image_services/image_service')
defaultImageService = require('../../../src/image_services/default_image_service')

describe 'imageService', ->

  describe 'has()', ->

    it 'returns true for "default"', ->
      expect(imageService.has('default')).to.equal(true)


  describe 'get()', ->

    it 'returns the "default" service', ->
      expect(imageService.get('default')).to.equal(defaultImageService)


# Generated interface tests for each image service
# ------------------------------------------------

imageService.eachService (name, service) ->

  describe "#{ name }_image_service", ->

      it 'has a name property', ->
        expect(service.name).to.equal(name)


      it 'has a set() method', ->
        expect(service.set).to.be.a('function')


      it 'has a setPlaceholder() method', ->
        expect(service.setPlaceholder).to.be.a('function')


      it 'has a getUrl() method', ->
        expect(service.getUrl).to.be.a('function')

