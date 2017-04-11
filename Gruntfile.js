module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.util.linefeed = '\n';

  // This is the configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    dist: 'dist',
    filename: 'cjm-directives',
    filenamecustom: '<%= filename %>-custom',
    meta: {
      modules: 'angular.module("cjm.directives", ["cjm.directives.posit", "cjm.directives.resiz"]);',
      banner: [
        '/*',
        ' * <%= pkg.name %>',
        ' * <%= pkg.homepage %>\n',
        ' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
        ' * License: <%= pkg.license %>',
        ' */\n'
      ].join('\n')
    },
    concat: {
      dist: {
        options: {
          banner: '<%= meta.banner %><%= meta.modules %>\n'
        },
        src: ['src/posit/posit.js', 'src/resiz/resiz.js'],
        dest: '<%= dist %>/<%= filename %>-<%= pkg.version %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: '<%= dist %>/<%= filename %>-<%= pkg.version %>.min.js'
      }
    },
    eslint: {
      files: ['Gruntfile.js', 'src/**/*.js']
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['eslint', 'concat', 'uglify']);
};
