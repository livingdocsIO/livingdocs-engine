class ModelDirectives

  constructor: (snippetModel, templateDirectives) ->
    @editables = @images = @containers = { length: 0 }

    for directive in templateDirectives
      @all[directive.name] = directive

      list = switch directive.type
        when 'editable'
          @editables
        when 'image'
          @images
        when 'container'
          @containers

      @addDirective(list, directive, snippetModel)


    addDirective: (list, directive, snippetModel) ->
      listElem = directive
      if directive.type == 'container'
        listElem = new SnippetContainer
          name: directive.name
          parentSnippet: snippetModel

      list[list.length] = listElem
      list.length += 1
      @length += 1
