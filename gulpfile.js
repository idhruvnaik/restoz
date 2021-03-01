const { src, dest, series, parallel, watch } = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();

const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const modRewrite = require('connect-modrewrite');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const wiredep = require('wiredep').stream;
const browserSync = require('browser-sync');
const server = browserSync.create();
const { argv } = require('yargs');
const port = argv.port || 9000;

function styles() {
    return src('app/styles/base.scss')
        .pipe(sass())
        .pipe($.postcss([
            autoprefixer()
        ]))
        .pipe(dest('app/styles/css'))
}

function html() {
    return src('app/*.html')
        .pipe($.useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(dest('dist'))
}

function injectBower() {
    var options = {
        bowerJson: require("./bower.json"),
        directory: 'app/components'
    };
    var target = src('app/account/index.html');
    return target.pipe(wiredep(options)).pipe(dest('app', { overwrite: true }));
}

const build = series(injectBower,
    parallel(
        series(parallel(styles), html)
    )
);

function startDistServer() {
    server.init({
        notify: false,
        port,
        server: {
            baseDir: 'dist',
            middleware: [
                modRewrite(['^[^\\.]*$ /index.html [L]'])
            ]
        }
    });
}

function startAppServer() {
    server.init({
        notify: false,
        port,
        server: {
            baseDir: ['.tmp', 'app'],
            middleware: [
                modRewrite(['^[^\\.]*$ /index.html [L]'])
            ]
        }
    });
    watch([
        'app/{,*/}*.html',
        'app/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', server.reload);

    watch('app/styles/**/*.scss', styles);
}

let serve = series(injectBower, parallel(styles), startAppServer);
exports.serveDist = startDistServer;
exports.serve = serve;
exports.build = build;
exports.default = build;