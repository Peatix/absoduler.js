module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'lib/**/*.js', 'sample/*.js'],
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['lib/Absoduler.js', 'lib/Serialize.js'],
        dest: './<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: {
          './<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      },
    },
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('before-release', 'jobs before release', function() {
    grunt.file.delete('./Absoduler.js');
  });

  grunt.registerTask('test',['jshint']);
  grunt.registerTask('default', []);
  grunt.registerTask('release', ['jshint', 'concat', 'uglify', 'before-release']);
};
