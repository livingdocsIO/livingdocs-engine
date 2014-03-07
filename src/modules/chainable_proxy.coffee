# Helper method to create chainable proxies.
#
# Returns a method that works the same as $.proxy() but always returns the chainedObj
# *its mostly the same code as $.proxy ;)*
module.exports = (chainedObj) ->

  (fn, context) ->
    if typeof context == 'string'
      tmp = fn[ context ]
      context = fn
      fn = tmp

    # Simulated bind
    args = Array.prototype.slice.call( arguments, 2 )
    proxy = ->
      fn.apply( context || this, args.concat( Array.prototype.slice.call( arguments ) ) )
      chainedObj

    proxy
