var gulp = require('gulp');
var stylus = require('gulp-stylus');

module.exports = function() {
  gulp.src('src/css/**/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('dist/css'));
};
