ImageRatio = require('../../../src/design/image_ratio')

describe 'image_ratio', ->

  describe 'with a ratio of "16:9"', ->

    beforeEach ->
      @ratio = new ImageRatio
        name: "16:9"
        label: "Cinema"
        ratio: "16:9"


    it 'parses "16:9"', ->
      expect(@ratio.ratio).to.be.closeTo(1.77, 0.01)


    it 'has a label', ->
      expect(@ratio.label).to.equal('Cinema')


  describe 'with a ratio of "16/9"', ->

    it 'parses "16/9"', ->
      @ratio = new ImageRatio
        name: "16:9"
        ratio: "16/9"
      expect(@ratio.ratio).to.be.closeTo(1.77, 0.01)


  describe 'with a ratio of "16x9"', ->

    it 'parses "16x9"', ->
      @ratio = new ImageRatio
        name: "16:9"
        ratio: "16x9"
      expect(@ratio.ratio).to.be.closeTo(1.77, 0.01)


  describe 'with a ratio of 1.777777', ->

    it 'parses 1.777777', ->
      @ratio = new ImageRatio
        name: "16:9"
        ratio: 1.777777
      expect(@ratio.ratio).to.be.closeTo(1.77, 0.01)


  describe 'with no label', ->

    it 'sets a humanized label', ->
      @ratio = new ImageRatio
        name: "cinemascope"
        ratio: "16:9"
      expect(@ratio.label).to.equal("Cinemascope")


