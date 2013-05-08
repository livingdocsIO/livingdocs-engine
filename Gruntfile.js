'use strict';

// livereload
var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var folderMount = function folderMount(connect, point) {
  return connect.static(path.resolve(point));
};

module.exports = function (grunt) {

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


  grunt.initConfig({
    livereload: {
      port: 35729 // Default livereload listening port.
    },
    watch: {
      livereload: {
        files: [
          '*.html',
          '.tmp/{,*/}*.js'
        ],
        tasks: ['livereload']
      },
      src: {
        files: [
          'src/{,*/}*.coffee',
          'test/spec/{,*/}*.coffee'
        ],
        tasks: ['coffee']
      }
    },
    connect: {
      livereload: {
        options: {
          port: 9000,
          // Change this to '0.0.0.0' to access the server from outside.
          middleware: function(connect, options) {
            return [lrSnippet, folderMount(connect, options.base)];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect, options) {
            return [
              folderMount(connect, options.base)
            ];
          }
        }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= connect.livereload.options.port %>'
      }
    },
    clean: {
      dist: 'dist',
      tmp: '.tmp'
    },
    coffee: {
      engine: {
        options: {
          join: true
        },
        files: {
          '.tmp/livingdocs_engine.js': 'src/{,*/}*.coffee'
        }
      },
      test: {
        options: {
          join: true
        },
        files: {
          '.tmp/livingdocs_engine_test.js': [
            'src/{,*/}*.coffee',
            'spec/{,*/}*.coffee'
          ]
        }
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS']
      },
      browsers: {
        configFile: 'karma.conf.js',
        browsers: ['Chrome', 'Firefox', 'Safari', 'Opera']
      },
      build: {
        configFile: 'karma.conf.js',
        browsers: ['Chrome', 'Firefox', 'Safari', 'Opera'],
        singleRun: true
      }
    },
    concat: {
      dist: {
        files: {
          'dist/livingdocs_engine.js': [
            '.tmp/livingdocs_engine.js'
          ]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/livingdocs_engine.min.js': [
            'dist/livingdocs_engine.js'
          ],
        }
      }
    }
  });

  // livereload does not work with grunt-contrib-watch, so we use regarde instead
  // https://github.com/gruntjs/grunt-contrib-watch/issues/59
  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('dev', [
    'clean:tmp',
    'coffee',
    'watch:src'
  ]);

  grunt.registerTask('server', [
    'clean:tmp',
    'coffee:engine',
    'livereload-start',
    'connect:livereload',
    'open',
    'watch:livereload'
  ]);

  grunt.registerTask('test', [
    'clean:tmp',
    'coffee',
    'karma:unit'
  ]);

  grunt.registerTask('build', [
    'clean',
    'coffee',
    'karma:build',
    'concat:dist',
    'uglify'
  ]);

  grunt.registerTask('default', ['server']);
};
