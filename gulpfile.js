var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    shell = require('gulp-shell');

gulp.task('ts', ['clean'], function () {
    var tsProject = ts.createProject({
        target: 'ES5',
        declarationFiles: true,
        noExternalResolve: false,
        removeComments: true,
        //typescript: require('typescript'),
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

gulp.task('test', ['clean', 'ts'], shell.task([
    'zuul --local 8080 -- ./test/*-Test.js'
]));

gulp.task('phantom', ['clean', 'ts'], shell.task([
    'zuul --phantom -- ./test/*-Test.js'
]));