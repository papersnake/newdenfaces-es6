"use strict";
/*jshint esversion: 6 */
/*jslint node: true */
import gulp from 'gulp';
import gutil from 'gulp-util';
import gulpif from 'gulp-if';
import streamify from 'gulp-streamify';
import autoprefixer from 'gulp-autoprefixer';
import cssmin from 'gulp-cssmin';
import less from 'gulp-less';
import concat from 'gulp-concat';
import plumber from 'gulp-plumber';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import browserify from 'browserify';
import watchify from 'watchify';
import uglify from 'gulp-uglify';

const production = process.env.NODE_ENV === 'production';

const dependencies = [
	'alt',
	'react',
	'react-router',
	'lodash'
];

/*
 |--------------------------------------------------------------------------
 | Combine all JS libraries into a single file for fewer HTTP requests.
 |--------------------------------------------------------------------------
 */
gulp.task('vendor',()=>
	gulp.src([
		'bower_components/jquery/dist/jquery.js',
		'bower_components/bootstrap/dist/bootstrap.js',
		'bower_components/magnific-popup/dist/jquery.magnific-popup.js',
		'bower_components/toastr/toastr.js'
		]).pipe(concat('vendor.js'))
		  .pipe(gulpif(production,uglify({ mangle:false })))
		  .pipe(gulp.dest('public/js'))
	);


/*
 |--------------------------------------------------------------------------
 | Compile third-party dependencies separately for faster performance.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify-vendor', () =>
  browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('vendor.bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'))
);

/*
 |--------------------------------------------------------------------------
 | Compile only project files, excluding all third-party dependencies.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify', ['browserify-vendor'], () =>
  browserify('app/main.js')
    .external(dependencies)
    .transform(babelify,{ presets: ["es2015", "react"]}) //注意这里，只有加上presets配置才能正常编译
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'))
);

/*
 |--------------------------------------------------------------------------
 | Same as browserify task, but will also watch for changes and re-compile.
 |--------------------------------------------------------------------------
 */
gulp.task('browserify-watch', ['browserify-vendor'], () =>{
  var bundler = watchify(browserify('app/main.js', watchify.args));
  bundler.external(dependencies);
  bundler.transform(babelify,{ presets: ["es2015", "react"]});
  bundler.on('update', rebundle);
  return rebundle();

  function rebundle() {
    var start = Date.now();
    bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .on('end', function() {
        gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('public/js/'));
  }
});


/*
 |--------------------------------------------------------------------------
 | Compile LESS stylesheets.
 |--------------------------------------------------------------------------
 */
gulp.task('styles', () =>
  gulp.src('app/stylesheets/main.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulpif(production, cssmin()))
    .pipe(gulp.dest('public/css'))
);

gulp.task('watch', () =>{
  gulp.watch('app/stylesheets/**/*.less', ['styles']);
});

gulp.task('default', ['styles', 'vendor', 'browserify-watch', 'watch']);
gulp.task('build', ['styles', 'vendor', 'browserify']);
