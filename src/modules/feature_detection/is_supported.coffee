detects = require('./feature_detects')

executedTests = {}

module.exports = (name) ->
  if (result = executedTests[name]) == undefined
    executedTests[name] = Boolean(detects[name]())
  else
    result

