# In a browser context we can use the globalWindow
# On node however a window will have to be passed explicitly
globalWindow = window if window?

module.exports =

  create: ({ window, element, width, height }={}) ->
    window ?= globalWindow
    element ?= window.document.body
    width ?= 100
    height ?= 100

    deferred = $.Deferred()
    $element = $(element).first()
    iframe = @createiFrameTag({ element: $element[0], width, height })

    iframe.onload = ->
      # In FF we need to set the contentDocument css AFTER the iframe has loaded
      # more info: http://stackoverflow.com/questions/16381648/behavior-of-iframe-contentdocument-in-chrome-and-firefox
      iframe.contentDocument.body.style.cssText = (
        'margin: 0px;' +
        'padding: 0px;' +
        'height: 100%;' +
        'width: 100%;'
      )
      deferred.resolve iframe

    $element.append(iframe)
    deferred.promise()


  createiFrameTag: ({ element, width, height }) ->
    iframe = element.ownerDocument.createElement('iframe')
    iframe.src = 'about:blank'
    iframe.setAttribute('width', width)
    iframe.setAttribute('height', height)
    iframe


