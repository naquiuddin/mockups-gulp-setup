var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var notify = require('gulp-notify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var buffer = require('vinyl-buffer');

var browserSync = require('browser-sync');
var reload = browserSync.reload;
var historyApiFallback = require('connect-history-api-fallback')

/*
  Browser Sync
*/
gulp.task('browser-sync', function() {
    browserSync({
        server : {},
        middleware : [ historyApiFallback() ],
        ghostMode: false
    });
});

gulp.task('styles',function() {
  // move over fonts
  gulp.src('./node_modules/bootstrap-sass/assets/ fonts/**/**.*')
    .pipe(gulp.dest('./build/fonts'));
  gulp.src('./node_modules/font-awesome/fonts/**.*')
    .pipe(gulp.dest('./build/fonts'));
  // Compiles CSS
  gulp.src('stylesheets/main.scss')
    .pipe(sass(
      {
        includePaths: [
          "./stylesheets/",
          "./node_modules/bootstrap-sass/assets/stylesheets",
          "./node_modules/font-awesome/scss/"
        ]
      }
    ).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./build/css/'))
    .pipe(reload({stream:true}))

});

gulp.task('images',function() {
  gulp.src('images/**.*')
    .pipe(gulp.dest('./build/css/fonts'))
});

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildScript(file, watch) {

  var props = {
    entries: './app/' + file,
    debug : true,
    transform:  [["babelify", { "presets": ["es2015","react"] }]]
  };

  // watchify() if watch requested, otherwise run browserify() once
  var bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    var stream = bundler.bundle()
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(gulp.dest('./build/js/'))
      // If you also want to uglify it
      // .pipe(buffer())
      // .pipe(uglify())
      // .pipe(rename('app.min.js'))
      // .pipe(gulp.dest('./build'))
      .pipe(reload({stream:true}))
  }

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  // run it once the first time buildScript is called
  return rebundle();
}

// gulp.task('scripts', function() {
//   return buildScript('main.js', false); // this will once run once because we set watch to false
// });

// run 'scripts' task first, then watch for future changes
gulp.task('default', ['images','styles','scripts','browser-sync'], function() {
  gulp.watch('./stylesheets/**.*', ['styles']); // gulp watch for sass changes
  gulp.watch("./*.html").on('change', reload);
  return buildScript('main.js', true); // browserify watch for JS changes
});
