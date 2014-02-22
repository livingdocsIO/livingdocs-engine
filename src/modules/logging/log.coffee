
# Log Helper
# ----------
# Default logging helper
# @params: pass `"trace"` as last parameter to output the call stack
module.exports = log = (args...) ->
  if window.console?
    if args.length and args[args.length - 1] == 'trace'
      args.pop()
      window.console.trace() if window.console.trace?

    window.console.log.apply(window.console, args)
    undefined


do ->

  # Custom error type for livingdocs.
  # We can use this to track the origin of an expection in unit tests.
  class LivingdocsError extends Error

    constructor: (message) ->
      super
      @message = message
      @thrownByLivingdocs = true


  # @param level: one of these strings:
  # 'critical', 'error', 'warning', 'info', 'debug'
  notify = (message, level = 'error') ->
    if _rollbar?
      _rollbar.push new Error(message), ->
        if (level == 'critical' or level == 'error') and window.console?.error?
          window.console.error.call(window.console, message)
        else
          log.call(undefined, message)
    else
      if (level == 'critical' or level == 'error')
        throw new LivingdocsError(message)
      else
        log.call(undefined, message)

    undefined


  log.debug = (message) ->
    notify(message, 'debug') unless log.debugDisabled


  log.warn = (message) ->
    notify(message, 'warning') unless log.warningsDisabled


  # Log error and throw exception
  log.error = (message) ->
    notify(message, 'error')

