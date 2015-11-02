var gulp = require('gulp');
var livereload = require('gulp-livereload');

module.exports = function() {
  gulp
    .src('src/*.html')
    .pipe(gulp.dest('dist'))
    .pipe(livereload());

  gulp
    .src('src/css/**/*.*')
    .pipe(gulp.dest('dist/css'))
    .pipe(livereload());

  gulp
    .src('src/js/vendor/**/*.js')
    .pipe(gulp.dest('dist/js/vendor'))
    .pipe(livereload());
}
