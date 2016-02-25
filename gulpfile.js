// Load gulp
var gulp = require('gulp');

// Load plugins
var jsdoc = require("gulp-jsdoc");


gulp.task('api', function () {
    gulp.src("./public/js/sensorium.js")
        .pipe(jsdoc('public/api'))
});


// Default task
gulp.task('default', function() {
    gulp.start('api');
});

