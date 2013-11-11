window.Page = Page
# ScrollSyncer is responsible for synchronizing the scroll position of multiple
# pages. To sync two or more pages, simply add the pages to the ScrollSyncer.
#
# @example
#
#   ScrollSyncer.addPages(page1, page2)
#
class ScrollSyncer

  @addPages = (pages...) ->
    this::singleton ||= new this()

    pages = pages[0] if $.isArray(pages[0])
    this::singleton.addPage(i) for i in pages


  # private

  constructor: ->
    @pages = []


  addPage: (page) ->
    unless ~@pages.indexOf(page)
      @pages.push(page)
      @observePage(page)


  observePage: (page) ->
    @$windowForPage(page).scroll (event) =>
      event.stopPropagation()
      @pageScrolled(page)


  pageScrolled: (page) ->
    return if @pages.length == 1 or @wasPageScrollProgrammatically(page)
    return unless @isPageScrollable(page)

    @setPageBeingScrolled(page)

    relativeScrollPosition = @relativeScrollPositionForPage(page)
    for page in @pages
      unless page is @pageBeingScrolled
        @setRelativeScrollPositionForPage(page, relativeScrollPosition)


  wasPageScrollProgrammatically: (page) ->
    @pageBeingScrolled && @pageBeingScrolled != page


  isPageScrollable: (page) ->
    @scrollLimitForPage(page) > 0


  setPageBeingScrolled: (page) ->
    clearTimeout(@scrollingEndedTimeout)
    @pageBeingScrolled = page
    @scrollingEndedTimeout = setTimeout(
      => @pageBeingScrolled = undefined
      10
    )


  relativeScrollPositionForPage: (page) ->
    @scrollPositionForPage(page) / @scrollLimitForPage(page)


  scrollLimitForPage: (page) ->
    @$documentForPage(page).height() - @windowForPage(page).innerHeight


  scrollPositionForPage: (page) ->
    Math.min(
      @scrollLimitForPage(page)
      Math.max(0, @$windowForPage(page).scrollTop())
    )


  setRelativeScrollPositionForPage: (page, relativeScrollPosition) ->
    scrollPosition = @scrollLimitForPage(page) * relativeScrollPosition
    @$windowForPage(page).scrollTop(scrollPosition)


  $windowForPage: (page) ->
    $(@windowForPage(page))


  windowForPage: (page) ->
    @documentForPage(page).defaultView


  $documentForPage: (page) ->
    $(@documentForPage(page))


  documentForPage: (page) ->
    page.renderNode.ownerDocument

window.ScrollSyncer = ScrollSyncer
