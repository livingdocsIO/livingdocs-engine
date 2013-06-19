# Log Helper
# ----------
# Default logging helper
# @params: pass `"trace"` as last parameter to output the call stack
log = ->

  args = Array.prototype.slice.call(arguments)

  if args.length
    if args[args.length - 1] == 'trace'
      args.pop()
      console.trace() if window.console?.trace

  args = args[0] if args.length == 1

  if (window.console)
    console.log(args)

# Log debug messages
# Use this if you're ok with everybody deleting your debug lines
# if you leave them in code accidentally
debug = ->
  log.apply(undefined, arguments)


# Log errors
error = (message) ->
  throw new Error(message)
