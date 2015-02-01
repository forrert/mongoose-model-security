var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish');

gulp.task('test', function() {
    return gulp.src(['test/*.js'], {read: false})
        .pipe(mocha({
            reporter: 'spec',
            globals: {
                should: require('should')
            }
        }));
});

gulp.task('lint', function() {
    return gulp.src('./lib/*.js')
        .pipe(jshint({
                node: true
            }
        ))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});
