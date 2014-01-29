
# livereload
path = require('path')
lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet
folderMount = (connect, point) ->
  return connect.static(path.resolve(point))

module.exports = (grunt) ->

  # load all grunt tasks
  require('load-grunt-tasks')(grunt)

  grunt.initConfig
    livereload:
      # Default livereload listening port: 35729
      # The port is different so it plays well togehter with other projects
      port: 35739
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
          port: 9010
          # Change this to '0.0.0.0' to access the server from outside.
          hostname: 'localhost'
          middleware: (connect, options) ->
            [lrSnippet, folderMount(connect, options.base)]
      test:
        options:
          port: 9011
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
          '.tmp/livingdocs-engine.js': [
            'src/config.coffee'
            'src/utils/*.coffee'
            'src/mixins/*.coffee'
            'src/rendering_container/*.coffee'
            'src/snippet_tree/*.coffee'
            'src/template/*.coffee'
            'src/!(api|config).coffee'
            'src/api.coffee'
          ]
      test:
        options:
          join: true
        files:
          '.tmp/livingdocs-engine-test.js': [
            'src/config.coffee'
            'src/utils/*.coffee'
            'src/mixins/*.coffee'
            'src/rendering_container/*.coffee'
            'src/snippet_tree/*.coffee'
            'src/template/*.coffee'
            'src/!(api|config).coffee'
            'src/api.coffee'
            'test/spec/helpers/*.coffee'
            'test/spec/mocks/*.coffee'
            'test/spec/utils/*.coffee'
            'test/spec/*.coffee'
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
      unit_once:
        configFile: 'karma.conf.coffee'
        browsers: ['PhantomJS']
        singleRun: true
      unit:
        configFile: 'karma.conf.coffee'
        browsers: ['PhantomJS']
      browsers:
        configFile: 'karma.conf.coffee'
        browsers: ['Chrome', 'Firefox', 'Safari']
      build:
        configFile: 'karma.conf.coffee'
        browsers: ['Chrome', 'Firefox', 'Safari']
        singleRun: true
    uglify:
      dist:
        files:
          'dist/livingdocs-engine.min.js': [
            'dist/livingdocs-engine.js'
          ]
    copy:
      dist:
        files: [
          expand: true
          cwd: '.tmp/'
          src: 'livingdocs-engine.*'
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

    bump:
      options:
        files: ['package.json', 'bower.json']
        commitFiles: ['package.json', 'bower.json', 'Changelog.md'], # '-a' for all files
        pushTo: 'origin'
        push: true

    concurrent:
      dev: [
        'watch:src'
        'server'
      ]


  # livereload does not work with grunt-contrib-watch, so we use regarde instead
  # https://github.com/gruntjs/grunt-contrib-watch/issues/59
  grunt.renameTask('regarde', 'watch')

  grunt.registerTask('dev', [
    'clean:tmp'
    'coffee'
    'concurrent:dev'
  ])

  grunt.registerTask('server', [
    'livereload-start'
    'connect:livereload'
    'open'
    'watch:livereload'
  ])

  grunt.registerTask('test', [
    'coffee:test'
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

  # Release a new version
  # Only do this on the `master` branch.
  #
  # options:
  # release:patch
  # release:minor
  # release:major
  grunt.registerTask 'release', (type) ->
    type = if type then type else 'patch'
    grunt.task.run('bump:' + type)


  grunt.registerTask('default', ['server'])
