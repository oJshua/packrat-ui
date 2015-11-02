var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

module.exports = function() {
  nodemon({
    script: 'app.js',
    ext: 'js',
    env: {
      NODE_ENV: 'development'
    },
    ignore: ['coverage', 'src', 'dist'],
    verbose: false
  });
};
