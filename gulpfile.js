var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('js', function() {
	return gulp.src(['js/*.js'])
		.pipe(concat('game.js'))
		.pipe(gulp.dest('www'));
});

gulp.task('watch', ['default'], function() {
	gulp.watch('js/*.js', ['js']);
});

gulp.task('default', ['js']);

