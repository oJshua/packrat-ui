var gulp = require('gulp');
var jshint = require('gulp-jshint');

module.exports = function() {
  return gulp.src(['src/js/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
};
