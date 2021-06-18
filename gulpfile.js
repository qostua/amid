const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const fileinclude = require('gulp-file-include');

const notify = require('gulp-notify');
const rename = require('gulp-rename');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();

const svgSprite = require('gulp-svg-sprite');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');

const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;



const svgSprites = () => {
	return src('./src/img/logo**.svg')
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../sprite.svg"
				}
			}
		}))
		.pipe(dest('./app/img'))
}
const styles = () => {
  return src('./src/scss/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
        outputStyle: 'expanded'
      }
    ).on('error', notify.onError()))
    // Обработчик ошибок
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream());
}
const htmlInclude = () => {
	return src(['./src/index.html'])
		.pipe(fileinclude({
			prefix: '@',
			basepath: '@file'
		}))
		.pipe(dest('./app'))
		.pipe(browserSync.stream());
}
const imgToApp = () => {
  return src('./src/img/**.{jpg,png,svg}')
    .pipe(dest('./app/img'))
}
const convertWebp = () => {
	return src(['./src/img/**.{jpg,png}', '!./src/img/css-*.{jpg,png}'])
		.pipe(webp({quality: 90}))
		.pipe(dest('./app/img'))
}
const resources = () => {
  return src('./src/resources/**')
    .pipe(dest('./app'))
}
const clean = () => {
	return del(['app/*'])
}
const scripts = () => {
	return src('./src/js/main.js')
		.pipe(webpackStream({
			mode: 'development',
			output: {
				filename: 'main.js',
			},
			module: {
				rules: [{
					test: /\.m?js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					}
				}]
			},
		}))
		.on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end'); // Don't stop the rest of the task
		})

		.pipe(sourcemaps.init())
		.pipe(uglify().on("error", notify.onError()))
		.pipe(sourcemaps.write('.'))
		.pipe(dest('./app/js'))
		.pipe(browserSync.stream());
}
const fonts = () => {
  src('./src/fonts/**.{ttf,woff,woff2}')
		.pipe(ttf2woff())
		.pipe(dest('./app/fonts'))
	return src('./src/fonts/**.{ttf,woff,woff2}')
	.pipe(ttf2woff2())
	.pipe(dest('./app/fonts'))
}
const watchFiles = () => {
  browserSync.init({
        server: {
            baseDir: "./app"
        },
        cors: true,
        notify: false,
        ui: false,
    });

    watch('./src/scss/**/*.scss', styles);
    watch('./src/index.html', htmlInclude);
    watch('./src/img/**.{jpg,png,svg}', imgToApp);
    watch('./src/img/**.svg', svgSprites);
		watch('./src/resources/**', resources);
		watch('./src/fonts/**.{ttf,woff,woff2}', fonts);
		watch('./src/js/**/*.js', scripts);
}

exports.styles = styles;
exports.watchFiles = watchFiles;
exports.fileinclude = htmlInclude;

exports.default = series(clean, parallel(htmlInclude, scripts, fonts, imgToApp, convertWebp, svgSprites, resources), styles, watchFiles);

const stylesBuild = () => {
  return src('./src/scss/main.scss')
    .pipe(sass({
        outputStyle: 'expanded'
      }
    ).on('error', notify.onError()))
    // Обработчик ошибок
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(dest('./app/css/'))
}
const scriptsBuild = () => {
	return src('./src/js/main.js')
		.pipe(webpackStream({
			mode: 'development',
			output: {
				filename: 'main.js',
			},
			module: {
				rules: [{
					test: /\.m?js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					}
				}]
			},
		}))
		.on('error', function (err) {
			console.error('WEBPACK ERROR', err);
			this.emit('end'); // Don't stop the rest of the task
		})

		.pipe(uglify().on("error", notify.onError()))
		.pipe(dest('./app/js'))
}
const images = () => {
	return src('./src/img/*.{jpg,png,svg}')
		.pipe(imagemin([
			imagemin.optipng({optimizationLevel: 3}),
			imagemin.mozjpeg({quality: 75, progressive: true}),
			imagemin.svgo()
		]))
		.pipe(dest('./app/img'))
}

exports.build = series(clean, parallel(htmlInclude, scriptsBuild, fonts, imgToApp, convertWebp, svgSprites, resources), stylesBuild, images);
