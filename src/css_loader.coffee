class CssLoader

  constructor: (@window) ->
    @loadedUrls = []


  load: (urls, callback=$.noop) ->
    urls = [urls] unless $.isArray(urls)
    semaphore = new Semaphore()
    semaphore.addCallback(callback)
    @loadSingleUrl(url, semaphore.wait()) for url in urls
    semaphore.start()


  # @private
  loadSingleUrl: (url, callback=$.noop) ->
    if @isUrlLoaded(url)
      callback()
    else
      link = $('<link rel="stylesheet" type="text/css" />')[0]
      link.onload = callback
      link.href = url
      @window.document.head.appendChild(link)
      @markUrlAsLoaded(url)


  # @private
  isUrlLoaded: (url) ->
    @loadedUrls.indexOf(url) >= 0


  # @private
  markUrlAsLoaded: (url) ->
    @loadedUrls.push(url)
