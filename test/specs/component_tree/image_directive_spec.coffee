base64Image = require('../../support/test_base64_image')

describe 'image_directive:', ->

  describe 'setImageService()', ->

    beforeEach ->
      @imageComponent = test.getComponent('image')
      @directive = @imageComponent.directives.get('image')


    it 'sets the imageService to "undefined"', ->
      @directive.setImageService(undefined)
      expect(@directive.getImageServiceName()).to.equal('default')


    it 'throws an error for an unknown imageService', ->
      method = =>
        @directive.setImageService('noServiceHere')

      expect(method).to.throw()


  describe 'origins', ->

    beforeEach ->
      @imageComponent = test.getComponent('image')
      @directive = @imageComponent.directives.get('image')


    it 'starts with an empty origins array', ->
      expect(@directive.getOrigins()).to.be.empty


    it 'sets a single hugo origin', ->
      @directive.setOrigins(name: 'hugo', identifier: 'picture-1234')
      expect(@directive.getOrigins()).to.deep.have.same.members [
        name: 'hugo'
        identifier: 'picture-1234'
      ]


    it 'sets several hugo origins', ->
      @directive.setOrigins [
        name: 'hugo'
        identifier: 'picture-1234'
      ,
        name: 'watson'
        identifier: 'grumpy-cat-2345'
      ]
      expect(@directive.getOrigins()).to.deep.have.same.members [
        name: 'hugo'
        identifier: 'picture-1234'
      ,
        name: 'watson'
        identifier: 'grumpy-cat-2345'
      ]


    it 'sets the origins to an empty array', ->
      @directive.setOrigins(name: 'hugo', identifier: 'picture-1234')
      @directive.setOrigins([])
      expect(@directive.getOrigins()).to.be.empty
