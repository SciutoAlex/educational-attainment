module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['bower_components/jquery/dist/jquery.js', 'bower_components/d3/d3.js', 'bower_components/topojson/topojson.js', 'bower_components/typeahead.js/dist/typeahead.bundle.js'],
        dest: 'js/main.js',
      },
    },
  uglify: {
    my_target: {
      files: {
        'js/main.js': ['bower_components/jquery/dist/jquery.js', 'bower_components/d3/d3.js', 'bower_components/topojson/topojson.js', 'bower_components/typeahead.js/dist/typeahead.bundle.js']
      }
    }
  }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');


  // Default task(s).
  grunt.registerTask('default', ['uglify']);
}
