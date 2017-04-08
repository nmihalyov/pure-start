/* 
 * Gulp Pure Start (GPS) Copyright © 2017, Nikita Mihalyov nikita.mihlyov@gmail.com
 * ISC Licensed
 */

const gulp         = require('gulp'),                 // Сам сборщик Gulp
      sass         = require('gulp-sass'),            // Пакет компиляции SASS/SCSS
      pug          = require('gulp-pug'),             // Пакет компиляции Pug (бывш. Jade)
      browserSync  = require('browser-sync'),         // Запуск локального сервера 
      concat       = require('gulp-concat'),          // Пакет конкатенации файлов
      uglifyjs     = require('gulp-uglifyjs'),        // Пакет минификации файлов JavaScript
      cssnano      = require('gulp-cssnano'),         // Пакет минификации файлов CSS
      rename       = require('gulp-rename'),          // Переименовывание файлов
      del          = require('del'),                  // Удаление файлов директории
      imagemin     = require('gulp-imagemin'),        // Пакет минификации изображений (в зависимостях также идут дополнительные пакеты)
      cache        = require('gulp-cache'),           // Работа с кэшом
      autoprefixer = require('gulp-autoprefixer'),    // Пакет расстановки вендорных перфиксов
      eslint       = require('gulp-eslint');          // Линтинг JS-кода

// Компилируем SASS в CSS (можно изменить на SCSS) и добавляем вендорные префиксы
gulp.task('sass',  () => {
    return gulp.src('app/sass/style.sass')  // В этом файле хранятся основные стили, остальные следует импортировать в него
    .pipe(sass())
    .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8'], {cascade: false}))
    .pipe(gulp.dest('app/css'));
});

// Минифицируем CSS (предвариетльно собрав SASS)
gulp.task('css', ['sass'], () => {
    return gulp.src('app/css/style.css')
    .pipe(cssnano())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Компилируем Pug (Jade) в HTML без его минификации
gulp.task('pug',  () => {
    return gulp.src('app/pug/*.pug')
    .pipe(pug({
        pretty: '\t'
    }))
    .pipe(gulp.dest('app'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Подключаем JS файлы бибилотек из директории 'app/libs/', установленные bower'ом, конкатенируем их и минифицируем
gulp.task('scripts', () => {
    return gulp.src([
        'app/libs/jquery/dist/jquery.min.js' // Пример подключения библиотеки в проект (по-умолчанию не уставлена)
    ]).pipe(concat('libs.min.js'))
    .pipe(uglifyjs())
    .pipe(gulp.dest('app/js'));
});

// Линтинг JS-кода
gulp.task('eslint', () => {
    return gulp.src(['app/js/*.js', '!app/js/*.min.js'])
    .pipe(eslint({fix: true}))
    .pipe(eslint.format());
});

// Минификация кастомных скриптов JS
gulp.task('js-min', ['eslint'], () => {
    return gulp.src(['app/js/*.js', '!app/js/*.min.js'])
    .pipe(uglifyjs())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('app/js'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Минифицируем изображения и кидаем их в кэш
gulp.task('img', () => {
    return gulp.src('app/img/**/*')
    .pipe(cache(imagemin()))
    .pipe(gulp.dest('dist/img'));
});

// Запускаем наш локальный сервер из директории 'app/'
gulp.task('browser-sync', () => {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false
    });
});

// Следим за изменениями файлов, компилируем их и обновляем страницу/инжектим стили
gulp.task('default', ['browser-sync', 'css', 'pug', 'scripts', 'js-min'], () => {
    gulp.watch('app/sass/**/*.sass', ['css']);
    gulp.watch('app/pug/**/*.pug', ['pug']);
    gulp.watch(['app/js/*.js', '!app/js/*.min.js'], ['js-min']);
    gulp.watch('app/*.html', browserSync.reload);
});

// Очищаем директорию билда 'dist/'
gulp.task('clean', () => {
    return del.sync('dist/**/*');
});

// Чистим кэш изображений (вообще весь кэш)
gulp.task('clear', () => {
    return cache.clearAll();
});


// Собираем наш билд в директорию 'dist/'
gulp.task('build', ['clean', 'img', 'css', 'pug', 'scripts', 'js-min', 'eslint'], () => {

    // Собираем CSS
    var buildCss = gulp.src('app/css/style.min.css')
    .pipe(gulp.dest('dist/css'));

    // Собираем шрифты
    var buildFonts = gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));

    // Собираем JS
    var buildJs = gulp.src('app/js/*.min.js')
    .pipe(gulp.dest('dist/js'));

    // Собираем HTML
    var buildHtml = gulp.src('app/*.html')
    .pipe(gulp.dest('dist'));
});