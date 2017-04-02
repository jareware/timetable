'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-scss-lint');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      src: ['dist']
    },
    browserify: {
      dist: {
        options: {
          transform: [['babelify', {'presets': ['es2015', 'react']}]]
        },
        files: {
          'dist/<%= pkg.name %>.js': 'src/<%= pkg.name %>.js'
        }
      }
    },
    uglify: {
      options: {
        preserveComments: false
      },
      dist: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
    },
    scsslint : {
      allFiles: [
        'src/*.scss'
      ],
      options: {
        colorizeOutput: true,
        config: '.scss-lint.yml'
      }
    },
    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'dist/styles.css': 'src/styles.scss'
        }
      }
    },
    watch: {
      js: {
        files: ['src/*.js'],
        tasks: ['compile-js']
      },
      css: {
        files: ['src/*.scss'],
        tasks: ['compile-sass']
      }
    }
  });

  grunt.registerTask('compile-js', ['browserify', 'uglify'])
  grunt.registerTask('compile-sass', ['scsslint', 'sass'])
  // Only run in dev-mode
  grunt.registerTask('default', ['clean', 'compile-js', 'compile-sass', 'watch']);
};
