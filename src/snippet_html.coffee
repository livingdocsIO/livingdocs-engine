class SnippetHtml

  constructor: ({ @template, @$html, @snippet }) ->
    @attachedToDom = false

    # add a reference to the DOM
    @$html.data("snippet", @snippet)


  #methods to modify the html


