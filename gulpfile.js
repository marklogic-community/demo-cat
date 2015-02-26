/*jshint node: true */

'use strict';

var gulp = require('gulp');

var argv = require('yargs').argv;
var concat = require('gulp-concat');
var fs = require('fs');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var karma = require('karma').server;
var path = require('path');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var options = {
  appPort: argv['app-port'] || 4000,
  mlHost: argv['ml-host'] || 'localhost',
  mlPort: argv['ml-port'] || '8070',
  defaultUser: 'demo-cat-user',
  defaultPass: 'c2t2l0g'
};

// start express
gulp.task('server', function () {
  fs.writeFileSync('gulp-server.pid', process.pid.toString(), 'ascii');
  var server = require('./server.js').buildExpress(options);
  console.log('Listening on port ' + options.appPort);
  server.listen(options.appPort);
});


gulp.task('jshint', function() {
  gulp.src('ui/app/scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our Less
gulp.task('less', function() {
  return gulp.src('ui/app/styles/main.less')
    .pipe(less())
    .pipe(gulp.dest('ui/app/styles/'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
  return gulp.src('./ui/app/scripts/**/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('./ui/app/scripts/**/*.js', ['jshint', 'scripts']);
  gulp.watch('./ui/app/styles/*.less', ['less']);
});

gulp.task('test', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

gulp.task('autotest', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

// Default Task
gulp.task('default', ['jshint', 'less', 'scripts', 'watch', 'server'], function() {
  fs.writeFileSync('gulp-default.pid', process.pid.toString(), 'ascii');
});
