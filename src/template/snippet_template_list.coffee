# SnippetTemplateList
# -------------------
# Represents a repeatable Template inside another Template
#
# Consider: Instead of defining a list inside a template we could
# just define another template. If we can mark the position of the first
# and last element, we don't need a container as in the current implementation
#
# Consider: Implement limitations. An attribute like `list-repetitions="{1,3}"`
# could deifine how many elements can be created (here with a regex-like syntax).
class SnippetTemplateList

  constructor: (@name, $list) ->
    @$list = $list
    $item = @$list.children().first().detach()

    @_item = new Template(
      name: "#{ @name }-item",
      html: $item
    )


  # array with an object literal for every list item
  # if only one item is submitted then the wrapping array can be omitted
  content: (content) ->
    if !@isEmpty()
      @clear()

    if $.isArray(content)
      for listItem in content
        @add(listItem)
    else
      @add(content)


  # param is the same as in content()
  # but the elements are appended instead of replaced
  add: (listItems, events) ->
    if $.isArray(listItems)
      for listItem in listItems
        @add(listItem, events)
    else
      $newItem = @_item.create(listItems)

      # register events
      for event, func of events
        $newItem.on(event, func)

      @$list.append($newItem)


  # remove list item
  # if index is blank or -1, the last item is removed
  # the first list item has index == 0
  remove: (index) ->
    if index == undefined || index == -1
      @$list.children(":last").remove()
    else
      @$list.children(":nth-child(#{ index + 1 })").remove()


  clear: ($list) ->
    @$list.children().remove()


  isEmpty: ($list) ->
    !@$list.children().length
