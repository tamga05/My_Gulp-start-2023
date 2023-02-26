'use strict';

const {src, dest} = require('gulp');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cssbeautify = require('gulp-cssbeautify');
const removeComments = require('gulp-strip-css-comments');
const rename = require('gulp-rename');
const rigger = require('gulp-rigger');
const sass = require('gulp-sass')(require('sass'));
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const panini = require('panini');
const imagemin = require('gulp-imagemin');
const del = require('del');
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const ghPages = require('gulp-gh-pages');


/* Paths */
const srcPath = 'src/';
const distPath = 'dist/';

const path = {
    build: {
        html: distPath,
        css: distPath + 'assets/css/',
        js: distPath + 'assets/js/',
        images: distPath + 'assets/images/',
        fonts: distPath + 'assets/fonts/'
    },
    src: {
        html: srcPath + '*.html',
        css: srcPath + 'assets/scss/*.scss',
        js: srcPath + 'assets/js/*.js',
        images: srcPath + 'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    watch: {
        html: srcPath + '**/*.html',
        js: srcPath + 'assets/js/**/*.js',
        css: srcPath + 'assets/scss/**/*.scss',
        images: srcPath + 'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    clean: './' + distPath
};


// Таска для Создания Сайта на gh-pages и "Деплоя" на этот сайт моего проекта.
gulp.task('deploy', function () {
    return gulp.src('./dist/**/*')
        .pipe(ghPages());
});

// Локальный сервер.
function serve() {
    browserSync.init({
        server: {
            baseDir: './' + distPath
        }
    });
}

function html() {
    panini.refresh();
    return src(path.src.html, {base: srcPath})
        .pipe(plumber())
        .pipe(panini({
            root: srcPath,
            layouts: srcPath + 'template/layout/',
            partials: srcPath + 'template/partials/',
            data: srcPath + 'template/data/'
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}));
}

function css() {
    return src(path.src.css, {base: srcPath + 'assets/scss/'})
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: 'SCSS Error',
                    message: 'Error: <%= error.message %>'
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(cssbeautify())
        .pipe(dest(path.build.css))
        .pipe(cssnano({
            zindex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(removeComments())
        .pipe(rename({
            suffix: '.min',
            extname: '.css'
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));
}

function js() {
    return src(path.src.js, {base: srcPath + 'assets/js/'})
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    title: 'JS Error',
                    message: 'Error: <%= error.message %>'
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rigger())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min',
            extname: '.js'
        }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}));
}

function images() {
    return src(path.src.images, {base: srcPath + 'assets/images/'})
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.reload({stream: true}));

}

function fonts() {
    return src(path.src.fonts, {base: srcPath + 'assets/fonts/'})
        .pipe(browserSync.reload({stream: true}));

}

function clean() {
    return del(path.clean);
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.images], images);
    gulp.watch([path.watch.fonts], fonts);
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts)); // Будет запускаться по команде gulp build.
const watch = gulp.series(build, gulp.parallel(watchFiles, serve)); // Будет запускаться по дефолтной команде gulp.

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;


// На сервер (или заказчику) пойдет ТОЛЬКО папка dist.


// Как юзать этот Gulp-сборщик в другом проекте:

// 1. B Пустую папку с Новым проектом из Папки My_Gulp-start-2023 перенести ВСЕ 3 файла!!! (gulpfile.js, package.json и папку src);

// 2. B консоли VSCode, Webstorm открыть Папку с Новым проектом, написать и запустить команду npm install (установятся все нужные модули);

// 3. После того как всё корректно установится и в папке с Новым проектом появится папка node_modules и файл package-lock.json, нужно в консоли ввести и запустить команду gulp (после её отработки появится Приветственная страница в браузере). После этого нужно ОБЯЗАТЕЛЬНО из папки src/index.html удалить строку {{> greeting}} !!!;

// 4. После этого нужно Подключить этот новый проект к Git по методичке Урока №1.

// 5. Соблюдаем файловую структуру или в сборках подправляем пути "откуда берём"/"куда кладём" файлы.

// 6. !!!!! Для Деплоя готового проекта на GitHub-pages РАСКОММЕНТИРОВАТЬ (если она закомментирована) строки 19 и 53-56 ЭТОГО файла Gulpfile.js, в консоли ввести сначала команду npm install --save-dev gulp-gh-pages и после её отработки ввести команду gulp deploy   !!!!!

// 7. !!!!!!!!!! После того, как Деплой без ошибок завершён, в консоли написать и поочерёдно запустить 3 команды: git add . и git commit -m"deploy" и git push !!!!!!!!!!


// 8. После автоматического обновления плагинов (del и gulp-imagemin) будут возникать ошибки и проект не будет собираться !!!!!!!!!!
//
// В этом случае в обязательном порядке НАДО ПОНИЗИТЬ версии этих двух плагинов, ПООЧЕРЕДНО введя в консоль команды:
// npm i del@6.0.0
// и затем
// npm i gulp-imagemin@7.1.0
// После понижения версий этих двух плагинов всё будет корректно работать и проект собираться !!!!!