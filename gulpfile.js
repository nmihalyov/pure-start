/* 
 * Gulp Pure Start (GPS) Copyright © 2017, Nikita Mihalyov nikita.mihalyov@gmail.com
 * ISC Licensed
 */

// Подключаем все необходимые плагины
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
	return gulp.src('app/sass/style.sass')  	// В этом файле(-ах) хранятся основные стили, остальные следует импортировать в него
	.pipe(sourcemaps.init())					// инциализация sourcemap'ов
	.pipe(sass({
		outputStyle: ':nested'					// компиляции в CSS с отступами
	}))
	.pipe(sourcemaps.write())					// запись sourcemap'ов
	.on('error', notify.onError({
		title: 'SASS',
		message: '<%= error.message %>'			// вывод сообщения об ошибке
	}))
	.pipe(autoprefixer(['last 15 versions', '> 1%'], {cascade: false}))		// настройка автоматической подстановки вендорных префиксов
	.pipe(gulp.dest('app/css'));				// путь вывода файла(-ов)
});

// Минифицируем CSS (предвариетльно собрав SASS)
gulp.task('css', ['sass'], () => {
	return gulp.src('app/css/style.css')		// файл(-ы), скомпилируемый предыдущим таском
	.pipe(mmq())								// собираем все медиа запросы
	.pipe(cssnano())							// минификация стилей
	.pipe(rename({
		suffix: '.min'							// переименовываем минифицированный(-ые) файл(-ы) стилей
	}))
	.pipe(gulp.dest('app/css'))					// путь вывода файла(-ов)
	.pipe(browserSync.reload({
		stream: true							// инжектим стили без перезагрузки страницы
	}));
});

// Таск SASS для продакшена, без sourcemap'ов
gulp.task('_sass',  () => {
	return gulp.src('app/sass/style.sass')
	.pipe(sass())
	.pipe(autoprefixer(['last 15 versions', '> 1%'], {cascade: false}))
	.pipe(mmq())
	.pipe(cssnano())
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(uncss({
		html: ['app/*.html']
	}))
	.pipe(gulp.dest('dist/css'));
});

// Чистим неиспользуемые стили
gulp.task('uncss', () => {
	return gulp.src('app/css/*.min.css')		// все файлы стилей
	.pipe(uncss({
        html: ['app/*.html']					// убираем неиспользуемые стили
    }))
	.pipe(gulp.dest('app/css'));				// путь вывода файлов
});

// Компилируем Pug (Jade) в HTML без его минификации
gulp.task('pug',  () => {
    return gulp.src('app/pug/*.pug')			// файл(-ы) pug препроцессора
    .pipe(pug({
        pretty: true							// компилируем pug в html без сжатия
	}))
	.pipe(critical({							// генерируемый критический CSS для быстрой загрузки страниц
		base:    'app/',						// из всех наших файлов в директории app
		minify:  true,							// с минификацией
		inline:  true,
		width: 1920,
		height: 1280,
		css:     ['app/css/style.min.css']}))	// путь к вашему основному файлу стилей, или несколько файлов через звпятую
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'			// выводим сообщение об ошибке
	}))
    .pipe(gulp.dest('app'))						// путь вывода html файла(-ов)
    .pipe(browserSync.reload({
        stream: true							// перезагружаем страницу
    }));
});

// Линтинг JS-кода
gulp.task('eslint', () => {
    return gulp.src(['app/js/common.js', 'app/assets/*.js'])	// все JS файлы
    .pipe(eslint({
        fix: true,								// если возможно исправление ошибки - делаем это
        rules: {
            'no-undef': 0       				// делаем так, чтобы ESLint не ругался на непоределённые переменные (в т.ч. глобальные, библиотек)
        },
        globals: ['$']          				// определяем глобальные переменные (самое распространённое - jQuery)
    }))
    .pipe(eslint.format());						// выводит сообщения ESLint'а в консоль
});

// Подключаем JS файлы результирующего файла common.js, конкатенируем и минифицируем
gulp.task('scripts', ['eslint'], () => {
	return gulp.src('app/js/common.js')   		// основной(-ые) файл(-ы) наших сценариев
	.pipe(plumber({
        errorHandler: notify.onError({
            title: 'JS',
            message: '<%= error.message %>'		// выводим сообщение об ошибке
        })
    }))
    .pipe(importFile({							// 
        prefix: '@@',							// импортим все файлы, описанные в результируещем js
        basepath: '@file'						// 
    }))
	.pipe(sourcemaps.init())					// инициализация sourcemaps'ов
    .pipe(babel())								// транспиляция ES6 в ES5
    .pipe(uglify())								// минификация JS
    .pipe(rename({
        suffix: '.min'							// переименовываем сжатый файл
    }))
	.pipe(sourcemaps.write())					// запись sourcemap'ов
    .pipe(gulp.dest('app/js'))					// путь вывода файлов
    .pipe(browserSync.reload({
        stream: true							// перезагружаем страницу
    }));
});

// Таск scripts для продакшена, без sourcemap'ов
gulp.task('_scripts', ['eslint'], () => {
	return gulp.src('app/js/common.js')
    .pipe(importFile({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest('dist/js'))
});

// Подключаем JS файлы бибилотек из директории 'app/libs/', установленные bower'ом, конкатенируем их и минифицируем
gulp.task('jsLibs', () => {
	return gulp.src('app/js/libs.js')			// файл, в который импортируются наши библиотеки
	.pipe(plumber({
        errorHandler: notify.onError({
            title: 'JS',
            message: '<%= error.message %>'		// выводим сообщение об ошибке
        })
    }))
    .pipe(importFile({							// 
        prefix: '@@',							// импортим все файлы, описанные в результируещем js
        basepath: '@file'						// 
    }))
    .pipe(uglify())								// минификация JS
    .pipe(rename({
        suffix: '.min'							// переименовываем сжатый файл
    }))
    .pipe(gulp.dest('app/js'))					// путь вывода файлов
    .pipe(browserSync.reload({
        stream: true							// перезагружаем страницу
    }));
});

// Минифицируем изображения и кидаем их в кэш
gulp.task('img', () => {
    return gulp.src('app/img/**/*')				// путь ко всем изображениям
    .pipe(cache(imagemin([						// сжатие изображений без потери качества
		imagemin.gifsicle(), 					// сжатие gif
		imagemin.jpegtran(), 					// сжатие jpeg
		imagemin.optipng()])))					// сжатие png
    .pipe(gulp.dest('dist/img'));				// путь вывода файлов
});

// Запускаем наш локальный сервер из директории 'app/'
gulp.task('browser-sync', () => {
    browserSync({
        server: {
            baseDir: 'app'						// корневая папка для запускаемого проекта
        },
        notify: false							// отключаем стандартные уведомления browsersync
    });
});

// Следим за изменениями файлов, компилируем их и обновляем страницу/инжектим стили
gulp.task('default', ['css', 'pug', 'jsLibs', 'scripts', 'browser-sync'], () => {
    gulp.watch('app/sass/**/*.sass', ['css']);
    gulp.watch('app/pug/**/*.pug', ['pug']);
    gulp.watch(['app/js/common.js', 'app/js/assets/*.js'], ['scripts']);
    gulp.watch('app/js/libs.js', ['jsLibs']);
});

// Удаляем все лишние файлы: '.gitkeep', 'changelog.md' и 'readme.md'
gulp.task('misc', () => {
    return del.sync(['**/.gitkeep', 'changelog.md', 'readme.md']);
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
gulp.task('build', ['clean', 'img', '_sass', 'pug', 'jsLibs', '_scripts'], () => {
    // Собираем HTML
    var buildHtml = gulp.src('app/*.html')
    .pipe(gulp.dest('dist'));

    // Собираем JS-библиотеки
    var buildJs = gulp.src('app/js/libs.min.js')
    .pipe(gulp.dest('dist/js'));

    // Собираем шрифты
    var buildFonts = gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));
});