/*
 * Gulp Pure Start © 2017 – 2019, Nikita Mihalyov <nikita.mihalyov@gmail.com>
 * ISC Licensed
 * v1.0.1
 */

'use strict';

let dev = './dev',     // рабочая среда проекта
	build = './build', // рабочий билд
	prod = './prod';   // билд в продакшен

// Подключаем все необходимые плагины
const gulp       = require('gulp'),                       // Сам сборщик Gulp
	sass         = require('gulp-sass'),                  // Пакет компиляции SASS/SCSS
	mmq          = require('gulp-merge-media-queries'),   // Плагин, соединющий медиа-запросы
	pug          = require('gulp-pug'),                   // Пакет компиляции Pug (бывш. Jade)
	browserSync  = require('browser-sync'),               // Запуск локального сервера
	babel        = require('gulp-babel'),                 // Транспиляция ES6 в ES5
	sourcemaps   = require('gulp-sourcemaps'),            // Плагин, создающий source maps к файлам
	uglify       = require('gulp-uglify'),                // Пакет минификации файлов JavaScript
	cssnano      = require('gulp-cssnano'),               // Пакет минификации файлов CSS
	rename       = require('gulp-rename'),                // Переименовывание файлов
	critical     = require('critical').stream,            // Генерирует критические стили для более быстрой загрузки страницы
	del          = require('del'),                        // Удаление файлов директории
	imagemin     = require('gulp-imagemin'),              // Пакет минификации изображений (в зависимостях также идут дополнительные пакеты)
	cache        = require('gulp-cache'),                 // Работа с кэшом
	autoprefixer = require('gulp-autoprefixer'),          // Пакет расстановки вендорных перфиксов
	plumber      = require('gulp-plumber'),               // Предотвращает разрыв pipe'ов, вызванных ошибками gulp-плагинов
	notify       = require('gulp-notify'),                // Выводит уведомления
	eslint       = require('gulp-eslint'),                // Линтинг JS-кода
	importFile   = require('gulp-file-include');          // Импорт файлов (@@include('path/to/file'))

// Компилируем SASS (можно изменить на SCSS) в CSS с минификацией и добавляем вендорные префиксы
gulp.task('sass', () => {
	return gulp.src(`${dev}/sass/style.sass`)   // В этом файле(-ах) хранятся основные стили, остальные следует импортировать в него
	.pipe(sourcemaps.init())                    // инциализация sourcemap'ов
	.pipe(sass({
		outputStyle: ':nested'                  // компиляции в CSS с отступами
	}))
	.on('error', notify.onError({
		title: 'SASS',
		message: '<%= error.message %>'         // вывод сообщения об ошибке
	}))
	.pipe(autoprefixer(['last 15 versions', '> 1%'], {cascade: false}))    // настройка автоматической подстановки вендорных префиксов
	.pipe(mmq())                                // собираем все медиа запросы
	.pipe(cssnano())                            // минификация стилей
	.pipe(rename({
		suffix: '.min'                          // переименовываем минифицированный(-ые) файл(-ы) стилей
	}))
	.pipe(sourcemaps.write())                   // запись sourcemap'ов
	.pipe(gulp.dest(`${build}/css`))            // путь вывода файла(-ов)
	.pipe(browserSync.reload({
		stream: true                            // инжектим стили без перезагрузки страницы
	}));
});

// Таск SASS для продакшена, без sourcemap'ов
gulp.task('_sass',  () => {
	return gulp.src(`${dev}/sass/style.sass`)
	.pipe(sass())
	.pipe(autoprefixer(['last 15 versions', '> 1%'], {cascade: false}))
	.pipe(mmq())
	.pipe(cssnano())
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(gulp.dest(`${prod}/css`));
});

// Компилируем Pug (Jade) в HTML без его минификации
gulp.task('pug',  () => {
	return gulp.src(`${dev}/pug/*.pug`)         // файл(-ы) pug препроцессора
	.pipe(pug({
		pretty: true                            // компилируем pug в html без сжатия
	}))
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'         // выводим сообщение об ошибке
	}))
	.pipe(gulp.dest(`${build}`))                // путь вывода html файла(-ов)
	.pipe(browserSync.reload({
		stream: true                            // перезагружаем страницу
	}));
});

// Таск PUG для продакшена - генерация критических стилей
gulp.task('_pug',  () => {
	return gulp.src(`${dev}/pug/*.pug`)
	.pipe(pug({
		pretty: true
	}))
	.pipe(critical({                            // генерируем критический CSS для быстрой загрузки страниц
		base: `${build}/`,                      // из всех наших файлов
		minify: true,                           // с минификацией
		inline: true,
		width: 1920,
		height: 1280,
		css: [`${build}/css/style.min.css`]     // путь к вашему основному файлу стилей, или несколько файлов через звпятую
	}))
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'
	}))
	.pipe(gulp.dest(`${prod}`));
});

// Линтинг JS-кода
gulp.task('eslint', () => {
	return gulp.src([`${dev}/components/**/*.js`, `${dev}/assets/*.js`])    // все JS файлы
	.pipe(eslint({
		fix: true
	}))
	.pipe(eslint.format());                     // выводит сообщения ESLint'а в консоль
});

// Подключаем JS файлы результирующего файла common.js, конкатенируем и минифицируем
gulp.task('scripts', gulp.parallel('eslint', () => {
	return gulp.src(`${dev}/js/common.js`)      // основной(-ые) файл(-ы) наших сценариев
	.pipe(plumber({
		errorHandler: notify.onError({
			title: 'JavaScript',
			message: '<%= error.message %>'     // выводим сообщение об ошибке
		})
	}))
	.pipe(importFile({                          //
		prefix: '@@',                           // импортим все файлы, описанные в результируещем js
		basepath: '@file'                       //
	}))
	.pipe(sourcemaps.init())                    // инициализация sourcemaps'ов
	.pipe(babel())                              // транспиляция ES6 в ES5
	.pipe(uglify())                             // минификация JS
	.pipe(rename({
		suffix: '.min'                          // переименовываем сжатый файл
	}))
	.pipe(sourcemaps.write())                   // запись sourcemap'ов
	.pipe(gulp.dest(`${build}/js`))             // путь вывода файлов
	.pipe(browserSync.reload({
		stream: true                            // перезагружаем страницу
	}));
}));

// Таск scripts для продакшена, без sourcemap'ов
gulp.task('_scripts', gulp.parallel('eslint', () => {
	return gulp.src(`${dev}/js/common.js`)
	.pipe(importFile({
		prefix: '@@',
		basepath: '@file'
	}))
	.pipe(babel())
	.pipe(uglify())
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(gulp.dest(`${prod}/js`))
}));

// Подключаем JS файлы бибилотек, установленные bower'ом, конкатенируем их и минифицируем
gulp.task('jsLibs', () => {
	return gulp.src(`${dev}/js/libs.js`)        // файл, в который импортируются наши библиотеки
	.pipe(plumber({
		errorHandler: notify.onError({
			title: 'JavaScript',
			message: '<%= error.message %>'     // выводим сообщение об ошибке
		})
	}))
	.pipe(importFile({                          //
		prefix: '@@',                           // импортим все файлы, описанные в результируещем js
		basepath: '@file'                       //
	}))
	.pipe(uglify())                             // минификация JS
	.pipe(rename({
		suffix: '.min'                          // переименовываем сжатый файл
	}))
	.pipe(gulp.dest(`${build}/js`))             // путь вывода файлов
	.pipe(browserSync.reload({
		stream: true                            // перезагружаем страницу
	}));
});

// Минифицируем изображения и кидаем их в кэш
gulp.task('img', () => {
	return gulp.src(`${dev}/img/**/*`)          // путь ко всем изображениям
	.pipe(cache(imagemin([                      // сжатие изображений без потери качества
		imagemin.gifsicle(),                    // сжатие gif
		imagemin.jpegtran(),                    // сжатие jpeg
		imagemin.optipng()])))                  // сжатие png
	.pipe(gulp.dest(`${build}/img`));           // путь вывода файлов
});

// Переносим шрифты
gulp.task('fonts', () => {
	return gulp.src(`${dev}/fonts/**/*`)
	.pipe(gulp.dest(`${build}/fonts`));
});

// Запускаем наш локальный сервер
gulp.task('browser-sync', () => {
	browserSync({
		server: {
			baseDir: `${build}`                 // корневая папка для запускаемого проекта
		},
		notify: false                           // отключаем стандартные уведомления browsersync
	});
});

// Следим за изменениями файлов и вывполняем соответствующие таски
gulp.task('default', gulp.parallel('sass', 'img', 'pug', 'jsLibs', 'scripts', 'fonts', 'browser-sync', () => {
	// стили
	gulp.watch(`${dev}/**/*.sass`, gulp.series('sass'));
	// разметка
	gulp.watch(`${dev}/**/*.pug`, gulp.series('pug'));
	// скрипты
	gulp.watch(`${dev}/**/*.js`, gulp.series('scripts'));
	// скрипты библиотек
	gulp.watch(`${dev}/js/libs.js`, gulp.series('jsLibs'));
	// шрифты
	gulp.watch(`${dev}/fonts/**/*`, gulp.series('fonts'));
	// изображения
	gulp.watch(`${dev}/img/**/*`, gulp.series('img'));
}));

// Удаляем все лишние файлы: '.gitkeep', 'changelog.md' и 'readme.md'
gulp.task('misc', async () => {
	return del.sync(['**/.gitkeep', 'changelog.md', 'readme.md']);
});

// Очищаем директорию продакшен билда
gulp.task('clean', async () => {
	return del.sync(`${prod}/**/*`);
});

// Чистим кэш изображений (вообще весь кэш)
gulp.task('clear', async () => {
	return cache.clearAll();
});

// Собираем наш билд в продакшен
gulp.task('prod', gulp.series('clean', 'img', '_sass', '_pug', 'jsLibs', '_scripts', async () => {
	// Собираем JS-библиотеки
	let buildJsLibs = gulp.src(`${build}/js/libs.min.js`)
	.pipe(gulp.dest(`${prod}/js`));

	// Собираем шрифты
	let buildFonts = gulp.src(`${dev}/fonts/**/*`)
	.pipe(gulp.dest(`${prod}/fonts`));

	// Собираем изображения
	let buildImages = gulp.src(`${build}/img/**/*`)
	.pipe(gulp.dest(`${prod}/img`));

	// Собираем manifest.json
	let buildManifest = gulp.src(`${dev}/manifest.json`)
	.pipe(gulp.dest(`${prod}/`));
}));