Semaphore = require('../modules/semaphore')

# A RenderingContainer is used by the Renderer to generate HTML.
#
# The Renderer inserts SnippetViews into the RenderingContainer and notifies it
# of the insertion.
#
# The RenderingContainer is intended for generating HTML. Page is a subclass of
# this base class that is intended for displaying to the user. InteractivePage
# is a subclass of Page which adds interactivity, and thus editability, to the
# page.
module.exports = class RenderingContainer

  isReadOnly: true


  constructor: ->
    @renderNode ?= $('<div/>')[0]
    @readySemaphore = new Semaphore()
    @beforeReady()
    @readySemaphore.start()


  html: ->
    $(@renderNode).html()


  snippetViewWasInserted: (snippetView) ->


  # This is called before the semaphore is started to give subclasses a chance
  # to increment the semaphore so it does not fire immediately.
  beforeReady: ->


  ready: (callback) ->
    @readySemaphore.addCallback(callback)
