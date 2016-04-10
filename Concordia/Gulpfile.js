// simple gulp task to copy from ./Concordia/dist to gh-pages root
var gulp  = require('gulp'),
    clean = require('gulp-clean');


gulp.task('default', ['deploy'], function() {});

gulp.task('clean', function() {
    return gulp.src(['../{index.html,js,css,fonts,img}'], {read: false})
        .pipe(clean({force: true}));
});

gulp.task('deploy', ['clean'], function() {
    return gulp.src(['./dist/index.html', './dist/{js,css,fonts,img}/**'])
        .pipe(gulp.dest('../'));
});

