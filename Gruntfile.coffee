module.exports = (grunt) ->

  # load all grunt tasks
  require('load-grunt-tasks')(grunt)

  grunt.initConfig

    watch:
      src:
        files: [
          'src/**/*.coffee'
        ]
        tasks: ['browserify:test', 'browserify:tmp']
      styles:
        files: [
          'styles/*'
        ]
        tasks: ['autoprefixer:styles']
      livereload:
        options:
          livereload: '<%= connect.options.livereload %>'
        files: [
          'public/assets/css/*.css'
          'public/*.html'
          '.tmp/livingdocs-engine.js'
        ]
      gruntfile:
        files: ['Gruntfile.coffee']
      test:
        files: [
          'test/support/{,*/}*.coffee'
          'test/specs/{,*/}*.coffee'
        ]
        tasks: ['browserify:test']

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

    browserify:
      options:
        extensions: ['.coffee']
        transform: ['coffeeify']
        debug: true
      tmp:
        files:
          '.tmp/livingdocs-engine.js' : [
            'src/browser_api.coffee'
          ]
      test:
        options:
          debug: false
        files:
          '.tmp/livingdocs-engine-test.js' : [
            'test/support/setup.coffee'
            'test/specs/{,*/}*.coffee'
          ]
      build:
        options:
          debug: true
        files:
          'dist/livingdocs-engine.js' : [
            'src/browser_api.coffee'
          ]

    mochaTest:
      test:
        options:
          reporter: 'dot'
          compilers: 'coffee-script/register'
          require: './test/node/test_globals.js'
        src: [
          'test/specs/!(browser_only)/*.coffee'
        ]

    karma:
      unit_once:
        configFile: 'karma.conf.coffee'
        browsers: ['PhantomJS']
        singleRun: true
      unit:
        configFile: 'karma.conf.coffee'
        browsers: ['Chrome']
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

    autoprefixer:
      styles:
        expand: true
        flatten: true
        src: 'styles/*.css'
        dest: 'public/assets/css/'
      dist:
        src: 'styles/livingdocs.css'
        dest: 'dist/css/livingdocs.css'

    bump:
      options:
        files: ['package.json', 'bower.json']
        commitFiles: ['-a'], # '-a' for all files
        pushTo: 'origin'
        push: true


  # Tasks
  # -----

  grunt.registerTask('dev', [
    'clean:tmp'
    'browserify:tmp'
    'connect:livereload'
    'watch'
  ])

  grunt.registerTask('test', [
    'browserify:test'
    'karma:unit'
  ])

  grunt.registerTask('node-test', [
    'mochaTest'
  ])

  grunt.registerTask('devbuild', [
    'clean:dist'
    'browserify:build'
    'uglify'
    'autoprefixer:dist'
  ])

  grunt.registerTask('build', [
    'clean:dist'
    'browserify:test'
    'browserify:build'
    'karma:build'
    'mochaTest'
    'uglify'
    'autoprefixer:dist'
  ])

  # Release a new version
  # Only do this on the `master` branch.
  #
  # options:
  # release:patch
  # release:minor
  # release:major
  grunt.registerTask 'release', (type) ->
    type ?= 'patch'
    grunt.task.run('build')
    grunt.task.run('bump:' + type)


  grunt.registerTask('default', ['dev'])
