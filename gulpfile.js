const { src, dest, series, parallel, watch, lastRun } = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();

const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const modRewrite = require('connect-modrewrite');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const cssnano = require('cssnano');
const wiredep = require('wiredep').stream;
const browserSync = require('browser-sync');
const ngtemplate = require('gulp-ng-templates');
const uglifyEs = require('gulp-uglify-es').default;
const del = require('del');
const server = browserSync.create();
const { argv } = require('yargs');
const port = argv.port || 9000;

var isProd = argv.production ? true : false;

function styles() {
    return src('app/styles/base.scss')
        .pipe(sass())
        .pipe($.postcss([
            autoprefixer()
        ]))
        .pipe(dest('app/styles/css'))
}

function scripts() {
    return src('app/scripts/**/*.js', {
        sourcemaps: !isProd,
    })
        .pipe($.plumber())
        .pipe($.babel())
        .pipe(dest('.tmp/scripts', {
            sourcemaps: !isProd ? '.' : false,
        }))
        .pipe(server.reload({ stream: true }));
}

function images() {
    return src('app/images/**/*', { since: lastRun(images) })
        .pipe($.imagemin({
            verbose: true,
            silent: true,
            interlaced: true,
            progressive: true,
            optimizationLevel: 5,
            svgoPlugins: [
                {
                    removeViewBox: true
                }
            ]
        }))
        .pipe(dest('dist/images'));
}

function html() {
    return src('app/*.html')
        .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
        .pipe($.if(/\.js$/, uglifyEs()))
        .pipe($.if(/\.css$/, $.postcss([cssnano({ safe: true, autoprefixer: false })])))
        .pipe($.if(/\.html$/, $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true, minifyCSS: true, minifyJS: true })))
        .pipe(dest('dist'));
}

function injectBower() {
    var options = {
        bowerJson: require("./bower.json"),
        directory: 'app/components'
    };
    var target = src('app/index.html');
    return target.pipe(wiredep(options)).pipe(dest('app', { overwrite: true }));
}

function copyHtml() {
    return src(['app/views/*.html'])
        .pipe(ngtemplate({
            filename: 'templates.js',
            module: 'templates',
            htmlMinifier: {
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: { compress: { drop_console: true } },
                processConditionalComments: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true
            },
            path: function (path, base) {
                return path.replace(base, 'views');
            }
        }))
        .pipe(uglifyEs())
        .pipe(dest('dist/scripts', { overwrite: true }));
}

const lintBase = (files, options) => {
    return src(files)
        .pipe($.eslint(options))
        .pipe(server.reload({ stream: true, once: true }))
        .pipe($.eslint.format())
        .pipe($.if(!server.active, $.eslint.failAfterError()));
}

function lint() {
    return lintBase('app/scripts/**/*.js', { fix: true })
        .pipe(dest('app/scripts'));
}

function copyJs() {
    isProd = true;
    return src(['app/scripts/controllers/*.js'])
        .pipe($.if(/\.js$/, uglifyEs()))
        .pipe(dest('dist/scripts/controllers'));
}

function clean() {
    return del(['.tmp', 'dist'])
}

function cleanUpDist() {
    return del(['dist/scripts/templates.js', 'dist/components', 'dist/views']);
}

function concatTemplate() {
    return src(['dist/scripts/templates.js', 'dist/scripts/app.js'])
        .pipe($.concat('app.js'))
        .pipe(dest('dist/scripts'));
}

const build = series(
    clean,
    injectBower,
    copyJs,
    copyHtml,
    parallel(
        lint,
        series(parallel(styles, scripts), html, concatTemplate),
        images
    ),
    cleanUpDist,
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
    watch('app/scripts/{,*/}*.js', scripts);
}

let serve = series(clean, injectBower, parallel(styles, scripts), startAppServer);
exports.serveDist = startDistServer;
exports.serve = serve;
exports.build = build;
exports.default = build;