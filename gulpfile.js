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

gulp.task('lint-src', function() {
    return gulp.src(['*.js', './lib/*.js'])
        .pipe(jshint({
                node: true
            }
        ))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('lint-test', function() {
    return gulp.src(['./test/*.js'])
        .pipe(jshint({
            node: true,
            mocha: true
        }))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('lint', ['lint-src', 'lint-test']);
