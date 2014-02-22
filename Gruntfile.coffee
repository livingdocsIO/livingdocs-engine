module.exports = (grunt) ->

  # load all grunt tasks
  require('load-grunt-tasks')(grunt)

  grunt.initConfig

    watch:
      src:
        files: [
          'src/{,*/}*.coffee'
          'test/spec/{,*/}*.coffee'
        ]
        tasks: ['coffee']
      livereload:
        options:
          livereload: '<%= connect.options.livereload %>'
        files: [
          'public/*.html'
          '.tmp/*.*'
        ]
      gruntfile:
        files: ['Gruntfile.coffee']

    connect:
      options:
        port: 9010
        # Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
        livereload: 35739 # Default livereload listening port: 35729
      livereload:
        options:
          open: true
          base: [
            '.tmp'
            'public'
            'components'
          ]
      test:
        options:
          port: 9011
          base: [
            '.tmp'
            'public'
            'test'
            'components'
          ]

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
        ]

    bump:
      options:
        files: ['package.json', 'bower.json']
        commitFiles: ['-a'], # '-a' for all files
        pushTo: 'origin'
        push: true

  grunt.registerTask('dev', [
    'clean:tmp'
    'coffee:engine'
    'connect:livereload'
    'watch'
  ])

  grunt.registerTask('server', [
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
