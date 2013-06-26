
# livereload
path = require('path')
lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet
folderMount = (connect, point) ->
  return connect.static(path.resolve(point))

module.exports = (grunt) ->

  # load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig
    livereload:
      port: 35729 # Default livereload listening port.
    watch:
      livereload:
        files: [
          '*.html'
          '.tmp/{,*/}*.js'
        ]
        tasks: ['livereload']
      src:
        files: [
          'src/{,*/}*.coffee'
          'test/spec/{,*/}*.coffee'
        ]
        tasks: ['coffee']
    connect:
      livereload:
        options:
          port: 9000
          # Change this to '0.0.0.0' to access the server from outside.
          middleware: (connect, options) ->
            [lrSnippet, folderMount(connect, options.base)]
      test:
        options:
          port: 9001
          middleware: (connect, options) ->
            [folderMount(connect, options.base)]
    open:
      server:
        url: 'http://localhost:<%= connect.livereload.options.port %>'
    clean:
      dist: 'dist'
      tmp: '.tmp'
    coffee:
      engine:
        options:
          join: true
          sourceMap: true
        files:
          '.tmp/livingdocs_engine.js': [
            'src/utils/*.coffee'
            'src/mixins/*.coffee'
            'src/config.coffee'
            'src/!(api|config).coffee'
            'src/api.coffee'
          ]
      test:
        options:
          join: true
        files:
          '.tmp/livingdocs_engine_test.js': [
            'src/utils/*.coffee'
            'src/mixins/*.coffee'
            'src/config.coffee'
            'src/!(api|config).coffee'
            'src/api.coffee'
            'test/spec/utils/*.coffee'
            'test/spec/mocks/*.coffee'
            'test/spec/*.coffee'
          ]
      snippetCollections:
        files:
          '.tmp/snippet_collections.js': [
            'src/snippet_collections/*.coffee'
          ]
    docco:
      src:
        src: ['src/**/*.coffee']
        options:
          output: 'docs'
      test:
        src: ['test/spec/*.coffee']
        options:
          output: 'docs/test'
    karma:
      unit:
        configFile: 'karma.conf.js'
        browsers: ['PhantomJS']
      browsers:
        configFile: 'karma.conf.js'
        browsers: ['Chrome', 'Firefox', 'Safari', 'Opera']
      build:
        configFile: 'karma.conf.js'
        browsers: ['Chrome', 'Firefox', 'Safari', 'Opera']
        singleRun: true
    uglify:
      dist:
        files:
          'dist/livingdocs_engine.min.js': [
            'dist/livingdocs_engine.js'
          ]
    copy:
      dist:
        files: [
          expand: true
          cwd: '.tmp/'
          src: 'livingdocs_engine.*'
          dest: 'dist/'
        ]
      dependencies:
        files: [
            src: 'test/manual/css/livingdocs.css'
            dest: 'dist/css/livingdocs.css'
          ,
            expand: true
            cwd: 'vendor/'
            src: '**'
            dest: 'dist/vendor/'
        ]
      lukas:
        files: [
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: '../livingdocs/vendor/assets/components/livingdocs-engine/'
        ]


  # livereload does not work with grunt-contrib-watch, so we use regarde instead
  # https://github.com/gruntjs/grunt-contrib-watch/issues/59
  grunt.renameTask('regarde', 'watch')

  grunt.registerTask('dev', [
    'clean:tmp'
    'coffee'
    'watch:src'
  ])

  grunt.registerTask('server', [
    'clean:tmp'
    'coffee'
    'livereload-start'
    'connect:livereload'
    'open'
    'watch:livereload'
  ])

  grunt.registerTask('test', [
    'clean:tmp'
    'coffee'
    'karma:unit'
  ])

  grunt.registerTask('build', [
    'clean'
    'coffee'
    'karma:build'
    'copy:dist'
    'uglify'
    'copy:dependencies'
  ])

  grunt.registerTask('default', ['server'])
