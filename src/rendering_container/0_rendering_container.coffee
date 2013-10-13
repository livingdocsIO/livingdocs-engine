# A RenderingContainer is used by the Renderer to generate HTML.
#
# The Renderer inserts SnippetViews into the RenderingContainer and notifies it
# of the insertion.
#
# The RenderingContainer is intended for generating HTML. Page is a subclass of
# this base class that is intended for displaying to the user. InteractivePage
# is a subclass of Page which adds interactivity, and thus editability, to the
# page.
class RenderingContainer

  isReadOnly: true


  constructor: ->
    @renderNode = $('<div/>')[0]


  html: ->
    $(@renderNode).html()


  snippetViewWasInserted: (snippetView) ->
