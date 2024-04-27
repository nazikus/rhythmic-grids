// plugins
var gulp      = require('gulp'),
    gulpif    = require('gulp-if'),
    clean     = require('gulp-clean'),
    watch     = require('gulp-watch'),
    connect   = require('gulp-connect'),
  runSequence = require('gulp-run-sequence'),
    less      = require('gulp-less'),
    minifyCss = require('gulp-minify-css'),
    cssImport = require('gulp-cssimport'),
    prefix    = require('gulp-autoprefixer'),
    concat    = require('gulp-concat'),
    strip     = require('gulp-strip-comments'),
    stripDebug= require('gulp-strip-debug'),
    uglify    = require('gulp-uglify'),
    rename    = require('gulp-rename'),
    inject    = require('gulp-inject'),
    ghPages   = require('gulp-gh-pages'), // deploy to gh-pages
    series    = require('stream-series'); // combine multiple src in a single task with preserved order



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
gulp.task('default', ['watch'], function(){});


// deploy tasks
var deploy = false;  // deploy flag

gulp.task('build-deploy', ['clean'], function(cb) {
    deploy = true;
    runSequence('js', 'injecthtml', ['styles', 'images', 'fonts', 'favicon'], cb);
});

gulp.task('deploy', ['build-deploy'], function(cb) {
    return gulp.src(['CNAME', './dist/**/*'])
        .pipe(ghPages(/*{push: false}*/));
});

gulp.task('deploy-local', function(cb) {
    deploy = true;
    runSequence('default', cb);
});


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

    var vendorStream =
        gulp.src([
            // skip wierd implementation of font detector (used for tests only)
            '!'+jsSrc + '/vendor/font-detector-temp.js',

            './../JavaScript/RhythmicGridGenerator.js',
            './node_modules/jquery/dist/jquery.min.js',
            // './node_modules/octavian/octavian.js',
            jsSrc + '/vendor/*.js'
        ])
        .pipe(gulpif(!deploy, gulp.dest(jsDist+'/vendor')));

    var appStream =
        gulp.src([
            // app modules, must preserve order for concat (app.js always the last)
            jsSrc + '/tesseract-drawing.js',
            jsSrc + '/google-analytics.js',
            jsSrc + '/credits-toggle.js',
            jsSrc + '/font-configurator.js',
            jsSrc + '/font-dragr.js',
            jsSrc + '/metrics-drawing.js',
            jsSrc + '/metrics-panning.js',
            jsSrc + '/grid-configurator.js',
            jsSrc + '/app.js',
        ])
        .pipe(gulpif(!deploy, gulp.dest(jsDist)));

    if (deploy) {
        return series(vendorStream, appStream)   // combine streams in order (vendors first)
            .pipe(concat('concordia-app.js'))
            .pipe(strip())
            .pipe(stripDebug())
            .pipe(uglify())  // NB! UglifyJS re-arranges declarations! (safely?)
            .pipe(rename({ suffix: '.min'}))
            .pipe(gulp.dest(jsDist))
            .pipe(connect.reload());
    } else { // static (dev)
        return series(vendorStream, appStream)
            .pipe(connect.reload());
    }
});

// inject <script> tags into index.html
gulp.task('injecthtml', function () {
    var generateScriptTag = function(script_attr){
        return function(path) {
            return '<script src="' + path.split(dist)[1].slice(1) + '" ' + script_attr + '></script>';
        }
    }

    return gulp.src('./src/index.html')
        .pipe(inject(
            gulp.src([
                // if dev (default), preserve <script src='..'> order
                jsDist + '/vendor/*.js',
                jsDist + '/tesseract-drawing.js',
                jsDist + '/google-analytics.js',
                jsDist + '/credits-toggle.js',
                jsDist + '/font-configurator.js',
                jsDist + '/font-dragr.js',
                jsDist + '/grid-configurator.js',
                jsDist + '/metrics-drawing.js',
                jsDist + '/metrics-panning.js',
                jsDist + '/app.js',
                // if deploy
                jsDist + '/concordia-app{,.min}.js' //  single-file app (deploy)
            ] , {read: false}),
            {
                transform: generateScriptTag('defer'),
                starttag: '<!-- inject:head:{{ext}} -->' 
            }
        ))
        .pipe(gulpif(deploy, strip())) // strip html comments/tags
        .pipe(gulp.dest(dist))
        .pipe(connect.reload());
});

// task for compiling styles
gulp.task('styles', function() {
    return gulp.src(lessSrc + '/*.**')
        .pipe(less())
        .pipe(gulpif(deploy, minifyCss(), cssImport()))
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
    gulp.watch('./Gulpfile.js').once('change', gulpReload);  // will self-kill and re-spawn gulp process
    connect.reload();
});

// TOFIX: spawned processes are not killed
var gulpReload = function(){
    connect.serverClose();
    var p = null;
    var childProcess = require('child_process');
    if(process.platform === 'win32'){
        console.log('gulp process: %s', p);
        if(p){
            childProcess.exec('taskkill /PID' + p.id + ' /T /F', function(){});
            p.kill();
        }else{
            p = childProcess.spawn(process.argv[0],[process.argv[1]],{stdio: 'inherit'});
        }
    }
};