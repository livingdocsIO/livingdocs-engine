# Log Helper
# ----------

# Default logging helper
log = ->

  args = Array.prototype.slice.call(arguments)
  args = args[0] if args.length == 1

  if (window.console)
    console.log(args)

# Log debug messages
# Use this if you're ok with everybody deleting your debug lines
# if you leave them in code accidentally
debug = ->
  log.apply(undefined, arguments)


# Log errors
error = ->
  args = Array.prototype.slice.call(arguments)
  args = args[0] if args.length == 1

  if ( window.console && typeof window.console.error == "function")
    console.error( args )
  else if ( window.console )
    console.log( args )
