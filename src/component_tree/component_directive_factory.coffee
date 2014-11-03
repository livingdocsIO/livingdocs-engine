assert = require('../modules/logging/assert')
imageService = require('../image_services/image_service')

EditableDirective = require('./editable_directive')
ImageDirective = require('./image_directive')
HtmlDirective = require('./html_directive')

module.exports =

  create: ({ snippet, templateDirective }) ->
    Directive = @getDirectiveConstructor(templateDirective.type)
    new Directive({ snippet, templateDirective })


  getDirectiveConstructor: (directiveType) ->
    switch directiveType
      when 'editable'
        EditableDirective
      when 'image'
        ImageDirective
      when 'html'
        HtmlDirective
      else
        assert false, "Unsupported component directive: #{ directiveType }"

