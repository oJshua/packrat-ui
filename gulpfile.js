var gulp = require('./gulp')([
  'lint',
  'browserify',
  'stylus',
  'copy',
  'serve'
]);

var livereload = require('gulp-livereload');

gulp.task('watch', function() {
  livereload.listen({
    quiet: true
  });
  gulp.watch('src/js/**/*', ['lint', 'browserify', 'copy']);
  gulp.watch('src/css/**', ['stylus']);
  gulp.watch('src/**/*', ['copy']);
});

gulp.task('build', ['lint', 'browserify', 'stylus', 'copy']);
gulp.task('default', ['build', 'watch', 'serve']);
