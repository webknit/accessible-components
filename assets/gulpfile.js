// Makes thing work!
var gulp = require('gulp');
// Jshint - Checks JS syntax
var jshint = require('gulp-jshint');
// Sass
var sass = require('gulp-sass');
// cssGlobbing - Allows you to use wildcards to get files eg sass/*
var cssGlobbing = require('gulp-sass-glob');
// sourcemaps - adds a sourcemap to the css to allow easier debugging
var sourcemaps = require('gulp-sourcemaps');
// cleanCss - mimifys the css
var cleanCss = require('gulp-clean-css');
// concat - combindes files
var concat = require('gulp-concat');
// browserSync - Syncs new changes in the browser
var browserSync = require('browser-sync').create();
// autoprefix - Adds prefixes onto css
var autoprefix = require('gulp-autoprefixer');
// uglify - Minify the JS
var uglify = require('gulp-uglify');
// imagemin - compresses images
var imagemin = require('gulp-imagemin');
// notify - adds a little notification panel in top right
var notify = require('gulp-notify');
// svgSymbols - converts a bunch of svg files to a single svg file containing each one as a symbol
var svgSymbols = require('gulp-svg-symbols');
// browserify - Lets you require modules
var browserify = require('browserify');
// babelify - allows writing ES6
var babelify = require('babelify');

// buffer - allows the use of .pipe()
var buffer = require('vinyl-buffer');
// Helps with browserify
var source = require('vinyl-source-stream');

// access - accessibility checker
var access = require('gulp-accessibility');
// htmlhint - html checker
var htmlhint = require("gulp-htmlhint");

var paths = {
	assets: {
		js: 'js/',
		css: 'SASS/',
		html: '../web/'
	},
	output: {
		js: '../web/scripts/',
		css: '../web/css/',
		cssCritical: '../web/css/critical',
		img: '../web/img/'
	}
};

// If you are running the site with a different webserver change this to the URL of the site e.g. localhost:8888
var proxy = '';

// Creates a file with SVG's as symbols to save on http requests
gulp.task('SVGsprites', function(done) {
    gulp.src(paths.output.img + 'svgsprite/*.svg').pipe(svgSymbols({
        templates: ['default-svg'],
        svgClassname: 'svg-icon-lib'
	})).pipe(gulp.dest(paths.output.img + '/svgsprite/svgsprite/'));
	done();
});

// SASS tasks when developing
// compiling sass, creating sourcemap, autoprefixing, outputting the css
gulp.task('styles:dev', function (done) {
	gulp.src(paths.assets.css + '**/*.scss')
        .pipe(cssGlobbing())
        .pipe(sourcemaps.init())
            .pipe(sass({
                outputStyle: 'expanded'
            }))
            .on('error', notify.onError())
            .pipe(sass().on('error', sass.logError))
            .pipe(autoprefix({
                browsers: ['last 2 version', 'ie 9']
            }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.output.css))
        .pipe(browserSync.stream())
        .pipe(notify({
            title: 'Sigma',
            message: 'Styles task complete.'
		}));
	done();
});

// SASS tasks when deploying
// Compile the sass, Prefixing, Minify the css, output
gulp.task('styles:deploy', function (done) {
	gulp.src('./sass/style.scss')
		.pipe(cssGlobbing({
			extensions: ['.css', '.scss']
		}))
		.pipe(sourcemaps.init())
			.pipe(sass({
				outputStyle: 'expanded'
			}))
			.on('error', notify.onError())
			.pipe(sass().on('error', sass.logError))
			.pipe(autoprefix({
				browsers: ['last 2 version', 'ie 9']
			}))
		.pipe(sourcemaps.write())
		.pipe(cleanCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(paths.output.css))
		.pipe(browserSync.stream())
	done();
});

gulp.task('styles:deploy:critical', function (done) {
	gulp.src('./sass/style-critical.scss')
		.pipe(cssGlobbing({
			extensions: ['.css', '.scss']
		}))
		.pipe(sourcemaps.init())
			.pipe(sass({
				outputStyle: 'expanded'
			}))
			.on('error', notify.onError())
			.pipe(sass().on('error', sass.logError))
			.pipe(autoprefix({
				browsers: ['last 2 version', 'ie 9']
			}))
		.pipe(sourcemaps.write())
		.pipe(cleanCss({compatibility: 'ie8'}))
		.pipe(gulp.dest(paths.output.css))
		.pipe(browserSync.stream())
		.pipe(notify({
			title: 'Sigma',
			message: 'Styles critical and none deployment task complete.'
		}));
	done();
});

// JS lint tasks when developing
// Check syntax for errors
gulp.task('scripts:lint', function(done) {
	gulp.src([paths.assets.js + 'script.js', paths.assets.js + '**/*.js'])
		.pipe(jshint())
    	.pipe(jshint.reporter('jshint-stylish'))
    	.pipe(notify(function (file) {
		    if (file.jshint.success) {
		    	// Don't show something if success
		    	return false;
		    }
		    var errors = file.jshint.results.map(function (data) {
		    	if (data.error) {
		    		return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
		    	}
		    }).join("\n");
		    return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
		}));
	done();
});


// JS tasks for bundling
// Compile any es6, create sourcemap, output js
gulp.task('scripts:bundle', function (done) {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: [paths.assets.js + 'script.js', paths.assets.js + 'plugins.js'],
    debug: true
  });

  b.transform(babelify, { presets: ['env'], plugins: [] })
  	.bundle()
  	.on('error', function(e) {
	  console.error(e.message);
      this.emit('end');
    })
    .pipe(source('script.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .on('error', function(e) {notify({
			title: 'Noah',
			message: e.message
		})})
    .pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(paths.output.js));
	
	done();
});

// JS tasks when deploying
// Compile any es6, output minified js
gulp.task('scripts:deploy', function(done) {
    // set up the browserify instance on a task basis
    var b = browserify({
    	entries: paths.assets.js + 'script.js'
	});

    b.transform(babelify, { presets: ['env'], plugins: [] })
		.bundle()
		.on('error', function(e) {
			console.error(e.message);
			this.emit('end');
		})
        .pipe(source('script.js'))
        .pipe(buffer())
        .pipe(uglify())
		.pipe(gulp.dest(paths.output.js));
		
	done();
});

// Reloads browserSync
gulp.task('templates', function(done) {
	browserSync.reload();
	done();
});

// Compresses images
gulp.task('images', function(done) {
	gulp.src(paths.output.img + '**/*')
		.pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
		.pipe(gulp.dest(paths.output.img))
		.pipe(notify({
			title: 'Sigma',
			message: 'Images task complete.'
		}));
	done();
});

// Testing Accessibility
gulp.task('test:accessibility', function(done) {
	var options = {
		accessibilityLevel: 'WCAG2AA',
		force: true,
		reportLevels: {
			notice: false,
			warning: false,
			error: true
		}
	};
	gulp.src(paths.assets.html + '*.{php,html,cshtml}')
	  .pipe(access(options))
	  .on('error', console.log)
	done();
});

// Testing HTML
gulp.task('test:html', function(done) {
	gulp.src(paths.assets.html + '*.{php,html,cshtml}')
		.pipe(htmlhint())
		.pipe(htmlhint.reporter())

	done();
});

// Default task, run by 'gulp'
gulp.task('watch', function (done) {
	var settings = {};
	if(proxy !== '') {
		settings.proxy = proxy;
	} else {
		settings.server = paths.assets.html;
	}
	browserSync.init([paths.output.js + '**/*.js'], settings);

	// Watch Img folder for SVGs
    gulp.watch(paths.output.img + '*.svg', gulp.series('SVGsprites'));
	// Watch .js files
	gulp.watch(paths.assets.js + '**/*.js', gulp.series('scripts:lint', 'scripts:bundle'));
	// Watch .scss files
	gulp.watch(paths.assets.css + '**/*.scss', gulp.series('styles:dev'));
	// Watch .html files
	gulp.watch([paths.assets.html + '**/*.{php,html,cshtml}', paths.assets.html + 'Views/*.{php,html,cshtml}'], gulp.series('templates'));
});

gulp.task(
	'default',
	gulp.series('scripts:lint', 'scripts:bundle', 'styles:dev', 'SVGsprites', 'watch')
);

// Deployment task
//gulp.task('deploy', ['scripts:lint', 'scripts:deploy', 'styles:deploy', 'SVGsprites']);
gulp.task(
	'deploy',
	gulp.series('scripts:lint', 'scripts:deploy', 'styles:deploy', 'styles:deploy:critical', 'SVGsprites')
);

// testing task
gulp.task(
	'test', 
	gulp.series('test:html', 'test:accessibility')
);