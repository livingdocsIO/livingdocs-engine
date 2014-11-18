detects = require('../../../src/modules/feature_detection/feature_detects')
isSupported = require('../../../src/modules/feature_detection/is_supported')

describe '(browser only) feature_detection:', ->

  # do everything in one test since isSupported caches the results internally
  it 'detects pointerEvents and uses the cache on the second call', ->
    detected = Boolean(detects.htmlPointerEvents())
    spy = sinon.spy(detects, 'htmlPointerEvents')
    isSupportedResult = isSupported('htmlPointerEvents')
    isSupported('htmlPointerEvents')

    expect(spy.callCount).to.equal(1)
    expect(detected).to.equal(isSupportedResult)

