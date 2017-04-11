/*
** This Gruntfile is based heavily on the Gruntfile from UI Bootstrap.
** https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js 
*/
var marked = require('marked');
var fs = require('fs');
var _ = require('lodash');

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.util.linefeed = '\n';

  // This is the configuration.
  grunt.initConfig({
    modules: [], // to be filled in by build task
    pkg: grunt.file.readJSON('package.json'),
    dist: 'dist',
    filename: 'angular-cjm-directives',
    filenamecustom: '<%= filename %>-custom',
    license: grunt.file.read('LICENSE').replace(/(^|\n)(.*)*/g, '** $2'),
    meta: {
      modules: 'angular.module("cjm.directives", ["cjm.directives.posit", "cjm.directives.resiz"]);',
      cssInclude: '',
      cssFileBanner: '/* Include this file in your html if you are using the CSP mode. */\n\n',
      cssFileDest: '<%= dist %>/<%= filename %>-<%= pkg.version %>-csp.css',
      banner: [
        '/*',
        '** <%= pkg.name %>',
        '** <%= pkg.homepage %>',
        '**',
        '** Version: <%= pkg.version %> - Built <%= grunt.template.today("yyyy-mm-dd") %>',
        '<%= license %>',
        '*/\n'
      ].join('\n')
    },
    concat: {
      dist: {
        options: {
          banner: '<%= meta.banner %><%= meta.modules %>\n',
          footer: '<%= meta.cssInclude %>'
        },
        src: [],
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
    },
    'ddescribe-iit': {
      files: [
        'src/**/*.spec.js'
      ]
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['ddescribe-iit', 'eslint']);
  grunt.registerTask('package', ['concat', 'uglify']);

// Basic Grunt functions
// https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js#L290-L293
  grunt.registerTask('dist', 'Override dist directory', function() {
    var dir = this.args[0];
    if (dir) { grunt.config('dist', dir); }
  });

// https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js#L445-L468
  function setVersion(type, suffix) {
    var file = 'package.json';
    var VERSION_REGEX = /([\'|\"]version[\'|\"][ ]*:[ ]*[\'|\"])([\d|.]*)(-\w+)*([\'|\"])/;
    var contents = grunt.file.read(file);
    var version;
    contents = contents.replace(VERSION_REGEX, function(match, left, center) {
      version = center;
      if (type) {
        version = require('semver').inc(version, type);
        if(!version) {
          version = center;
        }
      }
      //semver.inc strips our suffix if it existed
      if (suffix) {
        version += '-' + suffix;
      }
      return left + version + '"';
    });
    grunt.log.ok('Version set to ' + version.cyan);
    grunt.file.write(file, contents);
    return version;
  }

  grunt.registerTask('version', 'Set version. If no arguments, it just takes off suffix', function() {
    setVersion(this.args[0], this.args[1]);
  });

// https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js#L207-L288
  //Common cjm.directives module containing all modules for src and templates
  //findModule: Adds a given module to config
  var foundModules = {};
  function findModule(name) {
    if (foundModules[name]) { return; }
    foundModules[name] = true;

    function breakup(text, separator) {
      return text.replace(/[A-Z]/g, function (match) {
        return separator + match;
      });
    }
    function ucwords(text) {
      return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    }
    function enquote(str) {
      return `"${str}"`;
    }
    function enquoteCJMDir(str) {
      return enquote(`cjm/${str}`);
    }

    var module = {
      name: name,
      moduleName: enquote(`cjm.directives.${name}`),
      displayName: ucwords(breakup(name, ' ')),
      srcFiles: grunt.file.expand([`src/${name}/*.js`, `!src/${name}/index.js`, `!src/${name}/index-nocss.js`]),
      cssFiles: grunt.file.expand(`src/${name}/*.css`),
      // tplFiles: grunt.file.expand(`template/${name}/*.html`),
      // tpljsFiles: grunt.file.expand(`template/${name}/*.html.js`),
      // tplModules: grunt.file.expand(`template/${name}/*.html`).map(enquoteCJMDir),
      dependencies: dependenciesForModule(name),
      docs: {
        md: grunt.file.expand(`src/${name}/docs/*.md`)
          .map(grunt.file.read).map((str) => marked(str)).join('\n'),
        js: grunt.file.expand(`src/${name}/docs/*.js`)
          .map(grunt.file.read).join('\n'),
        html: grunt.file.expand(`src/${name}/docs/*.html`)
          .map(grunt.file.read).join('\n')
      }
    };

    var styles = {
      css: [],
      js: []
    };
    module.cssFiles.forEach(processCSS.bind(null, module.name, styles, true));
    if (styles.css.length) {
      module.css = styles.css.join('\n');
      module.cssJs = styles.js.join('\n');
    }

    module.dependencies.forEach(findModule);
    grunt.config('modules', grunt.config('modules').concat(module));
  }

  function dependenciesForModule(name) {
    var deps = [];
    grunt.file.expand([`src/${name}/*.js`, `!src/${name}/index.js`, `!src/${name}/index-nocss.js`])
    .map(grunt.file.read)
    .forEach(function(contents) {
      //Strategy: find where module is declared,
      //and from there get everything inside the [] and split them by comma
      var moduleDeclIndex = contents.indexOf('angular.module(');
      var depArrayStart = contents.indexOf('[', moduleDeclIndex);
      var depArrayEnd = contents.indexOf(']', depArrayStart);
      var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
      dependencies.split(',').forEach(function(dep) {
        if (dep.indexOf('cjm.directives.') > -1) {
          var depName = dep.trim().replace('cjm.directives.','').replace(/['"]/g,'');
          if (deps.indexOf(depName) < 0) {
            deps.push(depName);
            //Get dependencies for this new dependency
            deps = deps.concat(dependenciesForModule(depName));
          }
        }
      });
    });
    return deps;
  }

// https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js#L295-L348
  grunt.registerTask('build', 'Create cjm-directives build files', function() {

    //If arguments define what modules to build, build those. Else, everything
    if (this.args.length) {
      this.args.forEach(findModule);
      grunt.config('filename', grunt.config('filenamecustom'));
    } else {
      grunt.file.expand({
        filter: 'isDirectory', cwd: '.'
      }, 'src/*').forEach((dir) => {
        findModule(dir.split('/')[1]);
      });
    }

    var modules = grunt.config('modules');
    grunt.config('srcModules', _.map(modules, 'moduleName'));
    // grunt.config('tplModules', _.map(modules, 'tplModules').filter((tpls) => tpls.length > 0));
    grunt.config('demoModules', modules
      .filter((module) => module.docs.md && module.docs.js && module.docs.html)
      .sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      })
    );

    var cssStrings = _.flatten(_.compact(_.map(modules, 'css')));
    var cssJsStrings = _.flatten(_.compact(_.map(modules, 'cssJs')));
    if (cssStrings.length) {
      grunt.config('meta.cssInclude', cssJsStrings.join('\n'));

      grunt.file.write(grunt.config('meta.cssFileDest'), grunt.config('meta.cssFileBanner') +
                       cssStrings.join('\n'));

      grunt.log.writeln('File ' + grunt.config('meta.cssFileDest') + ' created');
    }

    var moduleFileMapping = _.clone(modules, true);
    moduleFileMapping.forEach((module) => delete module.docs);

    grunt.config('moduleFileMapping', moduleFileMapping);

    var srcFiles = _.map(modules, 'srcFiles');
    var tpljsFiles = _.map(modules, 'tpljsFiles');
    //Set the concat task to concatenate the given src modules
    grunt.config('concat.dist.src', grunt.config('concat.dist.src')
                 .concat(srcFiles));
    //Set the concat-with-templates task to concat the given src & tpl modules
    //grunt.config('concat.dist_tpls.src', grunt.config('concat.dist_tpls.src')
    //             .concat(srcFiles).concat(tpljsFiles));

    grunt.task.run(['concat', 'uglify']);
    //grunt.task.run(['concat', 'uglify', 'makeModuleMappingFile', 'makeRawFilesJs', 'makeVersionsMappingFile']);
  });

// https://github.com/angular-ui/bootstrap/blob/0d79005f8d1f4d674bb04ba93c41bb9c06280b4f/Gruntfile.js#L415-L443
  /**
   * Logic from AngularJS
   * https://github.com/angular/angular.js/blob/36831eccd1da37c089f2141a2c073a6db69f3e1d/lib/grunt/utils.js#L121-L145
   */
  function processCSS(moduleName, state, minify, file) {
    var css = fs.readFileSync(file).toString(),
      js;
    state.css.push(css);

    if (minify) {
      css = css
        .replace(/\r?\n/g, '')
        .replace(/\/\*.*?\*\//g, '')
        .replace(/:\s+/g, ':')
        .replace(/\s*\{\s*/g, '{')
        .replace(/\s*\}\s*/g, '}')
        .replace(/\s*\,\s*/g, ',')
        .replace(/\s*\;\s*/g, ';');
    }
    //escape for js
    css = css
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
    js = `angular.module('cjm.directives.${moduleName}').run(function() {!angular.$$csp().noInlineStyle && !angular.$$cjm${_.capitalize(moduleName)}Css && angular.element(document).find('head').prepend('<style type="text/css">${css}</style>'); angular.$$cjm${_.capitalize(moduleName)}Css = true; });`;
    state.js.push(js);

    return state;
  }

};
