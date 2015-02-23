$ = require('jquery')
JsLoader = require('./js_loader')
CssLoader = require('./css_loader')
Semaphore = require('../modules/semaphore')

module.exports = class Assets

  # @param {Window}
  # @param {Boolean} optional. If set to true no assets will be loaded.
  constructor: ({ @window, disable }) ->
    @isDisabled = disable || false

    @cssLoader = new CssLoader(@window)
    @jsLoader = new JsLoader(@window)


  loadDependencies: (jsDependencies, cssDependencies, callback) ->
    semaphore = new Semaphore()
    semaphore.addCallback(callback)

    @loadSequentially(jsDependencies, semaphore)

    for dep in cssDependencies || []
      @loadCss(dep, semaphore.wait())

    semaphore.start()


  # load js dependencies sequentially
  loadSequentially: (jsDependencies, semaphore) ->
    if jsDependencies?.length
      semaphore.increment(jsDependencies.length)

      current = 0
      next = =>
        @loadJs jsDependencies[current], ->
          semaphore.decrement()
          current += 1
          next() if current < jsDependencies.length

      next()


  loadDependency: (dependency, callback) ->
    if dependency.isJs()
      @loadJs(dependency, callback)
    else if dependency.isCss()
      @loadCss(dependency, callback)


  loadJs: (dependency, callback) ->
    return callback()  if @isDisabled

    if dependency.inline
      preventRepeatedExecution = not dependency.isExecuteOnly
      @jsLoader.loadInlineScript(dependency.code, preventRepeatedExecution, callback)
    else
      @jsLoader.loadSingleUrl(dependency.src, callback)


  loadCss: (dependency, callback) ->
    return callback()  if @isDisabled

    if dependency.inline
      @cssLoader.loadInlineStyles(dependency.code, callback)
    else
      @cssLoader.loadSingleUrl(dependency.src, callback)



