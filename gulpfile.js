const { src, dest, series, parallel, watch, lastRun } = require('gulp');
const fs = require('fs');
const mkdirp = require('mkdirp');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();

const sass = require('gulp-sass');
const autoprefixer = require('autoprefixer');
const modRewrite = require('connect-modrewrite');
const Modernizr = require('modernizr');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const cssnano = require('cssnano');
const wiredep = require('wiredep').stream;
const browserSync = require('browser-sync');
const ngtemplate = require('gulp-ng-templates');
const uglifyEs = require('gulp-uglify-es').default;
const del = require('del');
const workboxBuild = require('workbox-build');
const server = browserSync.create();
const { argv } = require('yargs');
const ngConstant = require('gulp-ng-constant');

const port = argv.port || 9000;

var isProd = argv.production ? true : false;
var envSet = {
    loc: {
        name: 'local'
    },
    production: {
        name: 'production'
    }
};

function generateENV() {
    var env = isProd ? envSet.production : envSet.loc;
    return src('config.json')
        .pipe(ngConstant({
            name: 'config',
            deps: isProd ? ['templates'] : [],
            constants: {
                ENV: {
                    name: env.name
                }
            },
            wrap: '<%= __ngModule %>'
        }))
        .pipe(dest('app/scripts/services/env', { overwrite: true }));
}


function injectBower() {
    var options = {
        bowerJson: require("./bower.json"),
        directory: 'app/components'
    };
    var target = src('app/index.html');
    return target.pipe(wiredep(options)).pipe(dest('app', { overwrite: true }));
}

function copyJs() {
    isProd = true;
    return src(['app/scripts/controllers/*.js'])
        .pipe($.if(/\.js$/, uglifyEs()))
        .pipe(dest('dist/scripts/controllers'));
}

function copyAssets() {
    return src(['app/upload/**'])
        .pipe(dest('dist/upload'));
}

function copyFonts() {
    return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
        .pipe(dest('dist/fonts'));
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

function concatTemplate() {
    return src(['dist/scripts/templates.js', 'dist/scripts/app.js'])
        .pipe($.concat('app.js'))
        .pipe(dest('dist/scripts'));
}

function styles() {
    return src('app/styles/*.scss', {
        sourcemaps: !isProd,
    })
        .pipe($.plumber())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.postcss([
            autoprefixer()
        ]))
        .pipe(dest('.tmp/styles', {
            sourcemaps: !isProd,
        }))
        .pipe(server.reload({ stream: true }));
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

async function modernizr() {
    const readConfig = () => new Promise((resolve, reject) => {
        fs.readFile(`${__dirname}/modernizr.json`, 'utf8', (err, data) => {
            if (err)
                reject(err);
            resolve(JSON.parse(data));
        })
    })
    const createDir = () => new Promise((resolve, reject) => {
        mkdirp(`${__dirname}/.tmp/scripts`, err => {
            if (err)
                reject(err);
            resolve();
        })
    });
    const generateScript = config => new Promise((resolve, reject) => {
        Modernizr.build(config, content => {
            fs.writeFile(`${__dirname}/.tmp/scripts/modernizr.js`, content, err => {
                if (err)
                    reject(err);
                resolve(content);
            });
        })
    });

    const [config] = await Promise.all([
        readConfig(),
        createDir()
    ]);
    await generateScript(config);
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

function html() {
    return src('app/*.html')
        .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
        .pipe($.if(/\.js$/, uglifyEs()))
        .pipe($.if(/\.css$/, $.postcss([cssnano({ safe: true, autoprefixer: false })])))
        .pipe($.if(/\.html$/, $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true, minifyCSS: true, minifyJS: true })))
        .pipe(dest('dist'));
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

function fonts() {
    return src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
        .pipe($.if(!isProd, dest('.tmp/fonts'), dest('dist/fonts')));
}

function extras() {
    return src([
        'app/*',
        '!app/*.html'
    ], {
        dot: true
    }).pipe(dest('dist'));
}

function clean() {
    return del(['.tmp', 'dist'])
}

function cleanUpDist() {
    return del(['dist/scripts/templates.js', 'dist/components', 'dist/views']);
}

function measureSize() {
    return src('dist/**/*')
        .pipe($.size({ title: 'build', gzip: true }));
}

function serviceWorker() {
    return workboxBuild.generateSW({
        cacheId: require('./bower.json').name,
        //        importWorkboxFrom: 'local',
        globDirectory: 'dist',
        globPatterns: [
            '**\/*.{js,css,jpg,png,woff,ttf,svg,eot}'
        ],
        cleanupOutdatedCaches: true,
        directoryIndex: 'index.html',
        swDest: 'dist/service-worker.js',
        //        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 3145728
    }).then(({ count, size }) => {
        console.log(`precache ${count} files, totaling ${size} bytes.`);
    });
}

const build = series(
    clean,
    injectBower,
    copyJs,
    copyAssets,
    copyHtml,
    generateENV,
    parallel(
        lint,
        series(parallel(styles, scripts, modernizr), html, concatTemplate),
        images,
        copyFonts,
        extras
    ),
    cleanUpDist,
    serviceWorker,
    measureSize
);

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
    watch('modernizr.json', modernizr);
    watch('app/fonts/**/*', fonts);
}

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

let serve = series(clean, injectBower, generateENV, parallel(styles, scripts, modernizr, fonts), startAppServer);
exports.serveDist = startDistServer;
exports.serve = serve;
exports.build = build;
exports.default = build;