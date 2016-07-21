// plugins
var gulp      = require('gulp'),
    clean     = require('gulp-clean'),
    minifyCss = require('gulp-minify-css'),
    less      = require('gulp-less'),
    concat    = require('gulp-concat'),
    runSequence = require('gulp-run-sequence'),
    connect   = require('gulp-connect'),
    watch     = require('gulp-watch'),
    prefix    = require('gulp-autoprefixer'),
    strip     = require('gulp-strip-comments'),
    inject    = require('gulp-inject'),
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

// html task (unused because of 'injecthtml' task)
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
            jsSrc + '/tesseract-drawing.js',
            jsSrc + '/audiocontext.js',
            jsSrc + '/credits-toggle.js',
            jsSrc + '/font-configurator.js',
            jsSrc + '/font-dragr.js',
            jsSrc + '/grid-configurator.js',
            jsSrc + '/metrics-drawing.js',
            jsSrc + '/metrics-panning.js',
            jsSrc + '/google-analytics.js',
            jsSrc + '/app.js'
        ])
        .pipe(concat('app.js'))
        .pipe(strip())
        .pipe(gulp.dest(jsDist));

    var scriptsStream = 
        gulp.src([
            // font metrics & detect
            jsSrc + '/vendor/canvas-fontmetrics.js', // redifines Canvas2D.prototype.measureText()
            jsSrc + '/vendor/lorem.js',
            jsSrc + '/vendor/font-detector.js',
            // wierd implementation of font detector using ComicSans, but keep it for comparison
            jsSrc + '/vendor/font-detector-temp.js',
            
            // app code
            jsSrc + '/vendor/pre3d.js',
            jsSrc + '/vendor/shapeutils.js',
            './node_modules/jquery/dist/jquery.min.js',
            './node_modules/dotdotdot/src/js/jquery.dotdotdot.js',
            './../JavaScript/RhythmicGridGenerator.js'
        ])
        .pipe(gulp.dest(jsDist))
        .pipe(strip())
        .pipe(connect.reload());


    return merge(appStream, scriptsStream);
});

// inject <script> tags into .html
gulp.task('injecthtml', function () {
    var generateScriptTag = function(script_attr){
        return function(path) {
            return '<script src="' + path.split(dist)[1].slice(1) + '" ' + script_attr + '></script>';
        }
    }

    return gulp.src('./src/index.html')
        .pipe(inject(
            gulp.src([
                jsDist + '/jquery.min.js',
                jsDist + '/jquery.dotdotdot.js',
                jsDist + '/canvas-fontmetrics.js',
                jsDist + '/lorem.js',
                jsDist + '/pre3d.js',
                jsDist + '/shapeutils.js',
                jsDist + '/font-detector.js',
                jsDist + '/font-detector-temp.js',
                jsDist + '/RhythmicGridGenerator.js',
            ] , {read: false}),
            { 
                transform: generateScriptTag('defer'), // should be async
                starttag: '<!-- inject:head1:{{ext}} -->' 
            }
        ))
        .pipe(inject(
            gulp.src([
                jsDist + '/app.js', 
            ], {read: false}),
            { 
                transform: generateScriptTag('defer'),
                starttag: '<!-- inject:head2:{{ext}} -->'
            }
        ))
        .pipe(strip())
        .pipe(gulp.dest(dist))
        .pipe(connect.reload());;
});

// task for compiling styles
gulp.task('styles', function() {
    return gulp.src(lessSrc + '/*.**')
        .pipe(less())
        .pipe(minifyCss())
        .pipe(prefix('last 4 versions'))
        .pipe(gulp.dest(cssDist))
        .pipe(connect.reload());
});

// build static site for local testing
gulp.task('build-static', ['clean'], function(cb) {
    runSequence('js', 'injecthtml', ['styles', 'images', 'fonts', 'favicon'], cb);
});

// run server via gulp-connect
gulp.task('server', ['build-static'], function() {
  connect.server({
    root: dist,
    livereload: true,
    port: 8081
  });
});

// watch task
gulp.task('watch', ['server'], function() {
    gulp.watch([lessSrc + '/**/*.less'], ['styles']);
    gulp.watch([lessSrc + '/common/fontmetrics.less'], ['js']);
    gulp.watch([src + '/*.html'], ['injecthtml']);
    gulp.watch([jsSrc + '/**/*.js'], ['js']);
    // gulp.watch('Gulpfile.js', ['gulp-reload']);
    connect.reload();
});

// TOFIX: cannot re-launch gulp from terminated process (despite spawn)
gulp.task('gulp-reload', function() {
  spawn('gulp', ['watch'], {stdio: 'inherit'});
  process.exit();
});