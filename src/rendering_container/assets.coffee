$ = require('jquery')
JsLoader = require('./js_loader')
CssLoader = require('./css_loader')

module.exports = class Assets

  constructor: ({ @prefix, @window }) ->
    @prefix ?= ''

    @cssLoader = new CssLoader(@window)
    @jsLoader = new JsLoader(@window)



  loadCss: (cssLoader, cb) ->
    return cb() unless @css?
    cssUrls = @convertToAbsolutePaths(@css)
    cssLoader.load(cssUrls, cb)





