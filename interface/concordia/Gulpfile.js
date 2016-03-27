// plugins
var gulp      = require('gulp'),
	clean     = require('gulp-clean'),
    minifyCss = require('gulp-minify-css'),
    less      = require('gulp-less'),
    concat    = require('gulp-concat'),
    runSequence = require('gulp-run-sequence'),
    connect   = require('gulp-connect'),
    watch     = require('gulp-watch'),
    merge     = require('merge-stream'), // for multiple src in a single task
    spawn     = require('child_process').spawn; // auto-reload gulp process on Gulpfile.js change


// paths
var dist = 'dist',
    src = 'src',

    lessSrc = src + '/less',
    cssDist = dist + '/css',

    imgSrc = src + '/img',
    imgDist = dist + '/img',

    jsSrc = src + '/js',
    jsDist = dist + '/js';

// default task
gulp.task('default', ['watch'], function() {});

// clean task
gulp.task('clean', function() {
    return gulp.src(dist, {read: false})
        .pipe(clean());
});

// html task
gulp.task('html', function() {
  return gulp.src(src + '/*.html')
    .pipe(gulp.dest(dist))
    .pipe(connect.reload());
});

// task for fonts
gulp.task('fonts', function () {
  gulp.src(src + '/fonts/**/*.*')
    .pipe(gulp.dest('./dist/fonts'))
    .pipe(connect.reload());
});

// favicon
gulp.task('favicon', function() {
    gulp.src(src + '/favicon.png')
        .pipe(gulp.dest(dist))
        .pipe(connect.reload());
});

//img task
gulp.task('images', function() {
    return gulp.src(imgSrc + '/**/*.**')
        .pipe(gulp.dest(imgDist))
        .pipe(connect.reload());
});

// js task
gulp.task('js', function() {
    var appStream = gulp.src([
            // tesseract
            jsSrc + '/vendor/pre3d.js',
            jsSrc + '/vendor/shapeutils.js',
            jsSrc + '/vendor/tesseract.js',
            // font metrics & detect
            jsSrc + '/vendor/fontmetrics.js',
            jsSrc + '/vendor/font.js',
            jsSrc + '/vendor/fontdetect.js',
            // app code
            jsSrc + '/draw-tesseract.js',
            // jsSrc + '/safe-box.js',
            jsSrc + '/grid-configurator.js',
            jsSrc + '/app.js'
        ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest(jsDist));

    var scriptsStream = gulp.src([
            './node_modules/jquery/dist/jquery.js',
            './../../JavaScript/RhythmicGridGenerator.js'
        ])
        .pipe(gulp.dest(jsDist))
        .pipe(connect.reload());


    return merge(appStream, scriptsStream);
});

// task for compiling styles
gulp.task('styles', function() {
    return gulp.src(lessSrc + '/*.**')
        .pipe(less())
        .pipe(minifyCss())
        .pipe(gulp.dest(cssDist))
        .pipe(connect.reload());
});

// build static site for local testing
gulp.task('build-static', ['clean'], function(cb) {
    runSequence(['styles', 'images', 'favicon', 'js', 'html', 'fonts'], cb);
});

// run server via gulp-connect
gulp.task('server', ['build-static'], function() {
  connect.server({
    root: dist,
    livereload: true,
    port: 8080
  });
});

// watch task
gulp.task('watch', ['server'], function() {
    gulp.watch([lessSrc + '/**/*.less'], ['styles']);
    gulp.watch([src + '/*.html'], ['html']);
    gulp.watch([jsSrc + '/**/*.js'], ['js']);
    gulp.watch('Gulpfile.js', ['gulp-reload']);
    connect.reload();
});

gulp.task('gulp-reload', function() {
  spawn('gulp', ['watch'], {stdio: 'inherit'}); // TOFIX
  process.exit();
});