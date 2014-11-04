module.exports = class Version
  @semVer:  /(\d+)\.(\d+)\.(\d+)(.+)?/

  constructor: (versionString) ->
    @parseVersion(versionString)


  parseVersion: (versionString) ->
    res = Version.semVer.exec(versionString)
    if res
      @major = res[1]
      @minor = res[2]
      @patch = res[3]
      @addendum = res[4]


  isValid: ->
    @major?


  toString: ->
    "#{ @major }.#{ @minor }.#{ @patch }#{ @addendum || '' }"


  @parse: (versionString) ->
    v = new Version(versionString)
    if v.isValid() then v.toString() else ''

