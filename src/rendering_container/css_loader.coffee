$ = require('jquery')
Semaphore = require('../modules/semaphore')

module.exports = class CssLoader

  constructor: (@window) ->
    @loadedUrls = []


  load: (urls, callback = ->) ->
    return callback() if @isDisabled

    urls = [urls] unless $.isArray(urls)
    semaphore = new Semaphore()
    semaphore.addCallback(callback)
    @loadSingleUrl(url, semaphore.wait()) for url in urls
    semaphore.start()


  disable: ->
    @isDisabled = true


  # @private
  loadSingleUrl: (url, callback = ->) ->
    return callback() if @isDisabled

    if @isUrlLoaded(url)
      callback()
    else
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
