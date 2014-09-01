# Enrich the configuration
# ------------------------
#
# Enrich the configuration with shorthands and computed values.
#
# config.docDirective
#   Will prefix the directive attributes with config.attributePrefix
#   e.g. config.docDirective.editable == 'data-doc-editable'
#
# config.templateAttrLookup
#   A lookup object for easier lookups of the directive name by template attribute.
#   e.g. config.templateAttrLookup['doc-editable'] == 'editable'

module.exports = (config) ->

  # Shorthands for stuff that is used all over the place to make
  # code and specs more readable.
  config.docDirective = {}
  config.templateAttrLookup = {}

  for name, value of config.directives

    # Create the renderedAttrs for the directives
    # (prepend directive attributes with the configured prefix)
    prefix = if config.attributePrefix then "#{ config.attributePrefix }-" else ''
    value.renderedAttr = "#{ prefix }#{ value.attr }"

    config.docDirective[name] = value.renderedAttr
    config.templateAttrLookup[value.attr] = name

