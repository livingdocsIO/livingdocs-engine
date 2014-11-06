Version = require('../../../src/design/version')

describe 'Version', ->

  it 'parses "1.0.0"', ->
    v = new Version('1.0.0')
    expect(v.toString()).to.equal('1.0.0')


  it 'parses "v1.0.0"', ->
    v = new Version('v1.0.0')
    expect(v.toString()).to.equal('1.0.0')


  it 'parses "version 1.0.0-stupendous-horror"', ->
    v = new Version('version 1.0.0-stupendous-horror')
    expect(v.toString()).to.equal('1.0.0-stupendous-horror')

