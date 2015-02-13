module.exports = class ContainerEvent

  constructor: ({ @target, focus, blur }) ->
    @type = if focus
      'containerFocus'
    else if blur
      'containerBlur'
