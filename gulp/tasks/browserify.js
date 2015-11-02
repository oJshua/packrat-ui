var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');

module.exports = function() {
  try {
    var b = browserify(
          { insertGlobals: false,
            detectGlobals: false,
            entries: ['./src/js/packrat.js']
          })
          .bundle()
          .on('error', onError)
          .pipe(source('packrat.js'))
          .pipe(gulp.dest('dist/js'));
  } catch(e) {
    delete e.stream;
    console.log(e);
    this.emit('end');
  }

  return b;
};

function onError(err) {
  delete err.stream;
  console.log(err);
  this.emit('end');
}
