/* 
 * Gulp Pure Start (GPS) Copyright © 2017, Nikita Mihalyov nikita.mihlyov@gmail.com
 * ISC Licensed
 */

const gulp         = require('gulp'),                       // Сам сборщик Gulp
      sass         = require('gulp-sass'),                  // Пакет компиляции SASS/SCSS
      mmq          = require('gulp-merge-media-queries'),   // Плагин, соединющий медиа-запросы
      pug          = require('gulp-pug'),                   // Пакет компиляции Pug (бывш. Jade)
      browserSync  = require('browser-sync'),               // Запуск локального сервера 
      babel	       = require('gulp-babel'),					// Транспиляция ES6 в ES5
      sourcemaps   = require('gulp-sourcemaps'),			// Плагин, создающий source maps к файлам
      concat       = require('gulp-concat'),                // Пакет конкатенации файлов
      uglify       = require('gulp-uglify'),              	// Пакет минификации файлов JavaScript
      cssnano      = require('gulp-cssnano'),               // Пакет минификации файлов CSS
	  rename       = require('gulp-rename'),                // Переименовывание файлов
      critical     = require('critical').stream,			// Генерирует критические стили для более быстрой загрузки страницы
      uncss	       = require('gulp-uncss'),					// Очищает все неиспользуемые стили
      del          = require('del'),                        // Удаление файлов директории
      imagemin     = require('gulp-imagemin'),              // Пакет минификации изображений (в зависимостях также идут дополнительные пакеты)
      cache        = require('gulp-cache'),                 // Работа с кэшом
      autoprefixer = require('gulp-autoprefixer'),          // Пакет расстановки вендорных перфиксов
      plumber	   = require('gulp-plumber'),				// Предотвращает разрыв pipe'ов, вызванных ошибками gulp-плагинов
      notify       = require('gulp-notify'),				// Выводит уведомления
      eslint       = require('gulp-eslint'),                // Линтинг JS-кода
      importFile   = require('gulp-file-include');          // Импорт файлов (@@include ('path/to/file'))

// Компилируем SASS в CSS (можно изменить на SCSS) и добавляем вендорные префиксы
gulp.task('sass',  () => {
	return gulp.src('app/sass/style.sass')  // В этом файле хранятся основные стили, остальные следует импортировать в него
	.pipe(sourcemaps.init())
	.pipe(sass({
		outputStyle: ':nested'
	}))
	.pipe(sourcemaps.write())
	.on('error', notify.onError({
		title: 'SASS',
		message: '<%= error.message %>'
	}))
	.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8'], {cascade: false}))
	.pipe(gulp.dest('app/css'));
});

// Минифицируем CSS (предвариетльно собрав SASS)
gulp.task('css', ['sass'], () => {
	return gulp.src('app/css/style.css')
	.pipe(mmq())
	.pipe(cssnano())
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({
		stream: true
	}));
});

// Чистим неиспользуемые стили
gulp.task('uncss', () => {
	return gulp.src('app/css/*.css')
	.pipe(uncss({
        html: ['app/*.html']
    }))
	.pipe(gulp.dest('app/css'));
});

// Компилируем Pug (Jade) в HTML без его минификации
gulp.task('pug',  () => {
    return gulp.src('app/pug/*.pug')
    .pipe(pug({
        pretty: true
	}))
	.pipe(critical({		// генерируемый критический CSS для быстрой загрузки страниц
		base:    'app/',
		minify:  true,
		inline:  true,
		width: 1920,
		height: 1280,
		css:     ['app/css/style.min.css']}))	// путь к вашему основному файлу стилей, или несколько файлов через звпятую
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'
	}))
    .pipe(gulp.dest('app'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Линтинг JS-кода
gulp.task('eslint', () => {
    return gulp.src(['app/js/common.js', 'app/partials/*.js'])
    .pipe(eslint({
        fix: true,
        rules: {
            'no-undef': 0       // делаем так, чтобы ESLint не ругался на непоределённые переменные (в т.ч. глобальные, библиотек)
        },
        globals: ['$']          // определяем глобальные переменные (самое распространённое - jQuery)
    }))
    .pipe(eslint.format());
});

// Подключаем JS файлы результирующего файла common.js, конкатенируем и минифицируем
gulp.task('scripts', ['eslint'], () => {
	return gulp.src('app/js/common.js')   // основной файл наших сценариев
	.pipe(plumber({
        errorHandler: notify.onError({
            title: 'JS',
            message: '<%= error.message %>'
        })
    }))
    .pipe(importFile({
        prefix: '@@',
        basepath: '@file'
    }))
	.pipe(sourcemaps.init())	// создание sourcemaps'ов
    .pipe(babel())				// транспиляция ES6 кода
    .pipe(uglify())				// минификация JS
    .pipe(rename({
        suffix: '.min'
    }))
	.pipe(sourcemaps.write())
    .pipe(gulp.dest('app/js'))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Подключаем JS файлы бибилотек из директории 'app/libs/', установленные bower'ом, конкатенируем их и минифицируем
gulp.task('jsLibs', () => {
	return gulp.src('app/js/libs.js')	// файл, в который импортируются наши библиотеки
	.pipe(plumber({
        errorHandler: notify.onError({
            title: 'JS',
            message: '<%= error.message %>'
        })
    }))
    .pipe(importFile({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(uglify())		// минификация JS
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
    .pipe(cache(imagemin([imagemin.gifsicle(), imagemin.jpegtran(), imagemin.optipng()])))
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
gulp.task('default', ['css', 'pug', 'jsLibs', 'scripts', 'browser-sync'], () => {
    gulp.watch('app/sass/**/*.sass', ['css']);
    gulp.watch('app/pug/**/*.pug', ['pug']);
    gulp.watch(['app/js/common.js', 'app/js/partials/*.js'], ['scripts']);
    gulp.watch('app/js/libs.js', ['jsLibs']);
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
gulp.task('build', ['clean', 'img', 'css', 'pug', 'scripts', 'eslint'], () => {

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