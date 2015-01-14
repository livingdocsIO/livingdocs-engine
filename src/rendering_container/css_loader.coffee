$ = require('jquery')

module.exports = class CssLoader

  constructor: (@window) ->
    @loadedUrls = []


  disable: ->
    @isDisabled = true


  loadInlineStyles: (codeBlock, callback = ->) ->
    # todo
    callback()


  # @private
  loadSingleUrl: (url, callback = ->) ->
    return callback() if @isDisabled || @isUrlLoaded(url)

    link = $('<link rel="stylesheet" type="text/css" />')[0]
    link.onload = callback

    # Do not prevent the page from loading because of css errors
    # onerror is not supported by every browser.
    # https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
    link.onerror = ->
      console.warn "Stylesheet could not be loaded: #{ url }"
      callback()

    link.href = url
    @window.document.head.appendChild(link)
    @markUrlAsLoaded(url)


  # @private
  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # @private
  markUrlAsLoaded: (url) ->
    @loadedUrls.push(url)
