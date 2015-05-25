var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    shell = require('gulp-shell'),
    mocha = require('gulp-mocha');

gulp.task('ts', ['clean'], function () {
    var tsProject = ts.createProject({
        target: 'ES5',
        declarationFiles: true,
        noExternalResolve: false,
        removeComments: true,
        module: 'commonjs'
    });
    var tsResult = gulp.src('src/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));
        tsResult.dts.pipe(gulp.dest('./dist'));

    tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('clean', function() {
    del(['dist'], function (err, deletedFiles) {
        console.log('Files deleted:', deletedFiles.join(', '));
    });
});

gulp.task('zuul', ['clean', 'ts'], shell.task([
    './node_modules/.bin/zuul --local 8080 -- ./test/zuul/*-Test.js'
]));

gulp.task('phantom', ['clean', 'ts'], shell.task([
    './node_modules/.bin/zuul --phantom -- ./test/zuul/*-Test.js'
]));

gulp.task('mocha', function () {
    return gulp.src('./test/mocha/*.js', {read: false})
            .pipe(mocha({reporter: 'min'}));
});

gulp.task('test', ['clean', 'ts', 'phantom', 'mocha']);