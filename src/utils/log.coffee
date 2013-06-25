
# Log Helper
# ----------
# Default logging helper
# @params: pass `"trace"` as last parameter to output the call stack
log = (args...) ->
  if window.console?
    if args.length and args[args.length - 1] == 'trace'
      args.pop()
      window.console.trace() if window.console.trace?

    window.console.log.apply(window.console, args)
    undefined


do ->

  # @param level: one of these strings:
  # 'critical', 'error', 'warning', 'info', 'debug'
  notify = (message, level = 'error') ->
    if _rollbar
      _rollbar.push new Error(message), ->
        if (level == 'critical' or level == 'error') and window.console?.error?
          window.console.error.call(window.console, message)
        else
          log.call(undefined, message)
    else
      if (level == 'critical' or level == 'error')
        throw new Error(message)
      else
        log.call(undefined, message)

    undefined


  log.debug = (message) ->
    notify(message, 'debug')


  log.warn = (message) ->
    notify(message, 'warning')


  # Log error and throw exception
  log.error = (message) ->
    notify(message, 'error')

