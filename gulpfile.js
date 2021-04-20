/*
 * Gulp Pure Start © 2017 – 2021, Nikita Mihalyov <nikita.mihalyov@gmail.com>
 * ISC Licensed
 * v1.3.0
 */

'use strict';

const dev = './dev';     // рабочая среда проекта
const build = './build'; // рабочий билд
const prod = './prod';   // билд в продакшен

// Подключаем все необходимые плагины
const gulp     = require('gulp'),                       // Сам сборщик Gulp
	sass         = require('gulp-sass'),                  // Компиляция SASS/SCSS
	mmq          = require('gulp-merge-media-queries'),   // Соединение медиа-запросов
	pug          = require('gulp-pug'),                   // Компиляция Pug
	browserSync  = require('browser-sync'),               // Запуск локального сервера
	babel        = require('gulp-babel'),                 // Транспиляция ES6 в ES5
	sourcemaps   = require('gulp-sourcemaps'),            // Sourcemap'ы к файлам
	uglify       = require('gulp-uglify-es').default,     // Минификация файлов JavaScript
	cssnano      = require('gulp-cssnano'),               // Минификация файлов CSS
	rename       = require('gulp-rename'),                // Переименовывание файлов
	critical     = require('critical').stream,            // Создание критических стилей
	del          = require('del'),                        // Удаление файлов директории
	imagemin     = require('gulp-imagemin'),              // Минификация изображений (в зависимостях также идут дополнительные пакеты)
	autoprefixer = require('gulp-autoprefixer'),          // Расстановка вендорных перфиксов
	plumber      = require('gulp-plumber'),               // Предотвращение разрыв pipe'ов, вызванных ошибками gulp-плагинов
	notify       = require('gulp-notify'),                // Вывод уведомления
  importFile   = require('gulp-file-include'),          // Импорт файлов (@@include('path/to/file'))
  imageminJpeg = require('imagemin-mozjpeg'),
  imageminPng  = require('imagemin-pngquant');

// Компилируем SASS (можно изменить на SCSS) в CSS с минификацией и добавляем вендорные префиксы
gulp.task('sass', () => {
	return gulp.src(`${dev}/sass/style.sass`)   // в этом файле хранятся основные стили, остальные следует импортировать в него
	.pipe(sourcemaps.init())                    // инциализация sourcemap'ов
	.pipe(sass({
		outputStyle: ':nested'                    // компиляции в CSS с отступами
	}))
	.on('error', notify.onError({
		title: 'SASS',
		message: '<%= error.message %>'           // вывод сообщения об ошибке
	}))
	.pipe(autoprefixer(['last 15 versions', '> 1%'], {cascade: false}))    // настройка автоматической подстановки вендорных префиксов
	.pipe(mmq())                                // собираем все медиа запросы
	.pipe(cssnano())                            // минификация стилей
	.pipe(rename({
		suffix: '.min'                            // переименовываем минифицированный файл стилей
	}))
	.pipe(sourcemaps.write())                   // запись sourcemap'ов
	.pipe(gulp.dest(`${build}/css`))            // путь вывода файла
	.pipe(browserSync.reload({
		stream: true                              // инжектим стили без перезагрузки страницы
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

// Компилируем Pug в HTML без его минификации
gulp.task('pug',  () => {
	return gulp.src(`${dev}/pug/*.pug`)         // файлы pug препроцессора
	.pipe(pug({
		pretty: true                              // компилируем pug в html без сжатия
	}))
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'           // выводим сообщение об ошибке
	}))
	.pipe(gulp.dest(`${build}`))                // путь вывода html файлов
	.pipe(browserSync.reload({
		stream: true                              // перезагружаем страницу
	}));
});

// Таск PUG для продакшена - генерация критических стилей
gulp.task('_pug', () => {
	return gulp.src(`${dev}/pug/*.pug`)
	.pipe(pug({
		pretty: true
	}))
	.pipe(critical({                            // генерируем критический CSS для быстрой загрузки страниц
		base: `${build}/`,                        // из всех наших файлов
    minify: true,                             // с минификацией
		inline: true,
		width: 1920,
		height: 1280,
		css: [`${build}/css/style.min.css`]       // путь к вашему основному файлу стилей, или несколько файлов через звпятую
	}))
	.on('error', notify.onError({
		title: 'PUG',
		message: '<%= error.message %>'
	}))
	.pipe(gulp.dest(`${prod}`));
});

// Подключаем JS файлы результирующего файла common.js, конкатенируем и минифицируем
gulp.task('scripts', () => {
	return gulp.src(`${dev}/js/common.js`)      // основной файл скриптов
	.pipe(plumber({
		errorHandler: notify.onError({
			title: 'JavaScript',
			message: '<%= error.message %>'         // выводим сообщение об ошибке
		})
	}))
	.pipe(importFile({                          //
		prefix: '@@',                             // импортим все файлы, описанные в результирующем js
		basepath: '@file'                         //
	}))
	.pipe(sourcemaps.init())                    // инициализация sourcemap'ов
	.pipe(babel({
    presets: ['@babel/preset-env']
  }))
	.pipe(uglify())                             // минификация JS
	.pipe(rename({
		suffix: '.min'                            // переименовываем сжатый файл
	}))
	.pipe(sourcemaps.write())                   // запись sourcemap'ов
	.pipe(gulp.dest(`${build}/js`))             // путь вывода файлов
	.pipe(browserSync.reload({
		stream: true                              // перезагружаем страницу
	}));
});

// Таск scripts для продакшена, без sourcemap'ов
gulp.task('_scripts', () => {
	return gulp.src(`${dev}/js/common.js`)
	.pipe(importFile({
		prefix: '@@',
		basepath: '@file'
	}))
	.pipe(babel({
    presets: ['@babel/preset-env']
  }))
	.pipe(uglify())
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(gulp.dest(`${prod}/js`))
});

// Подключаем JS файлы бибилотек конкатенируем их и минифицируем
gulp.task('jsLibs', () => {
	return gulp.src(`${dev}/js/libs.js`)        // файл, в который импортируются наши библиотеки
	.pipe(plumber({
		errorHandler: notify.onError({
			title: 'JavaScript',
			message: '<%= error.message %>'         // выводим сообщение об ошибке
		})
	}))
	.pipe(importFile({                          //
		prefix: '@@',                             // импортим все файлы, описанные в результирующем js
		basepath: '@file'                         //
	}))
	.pipe(uglify())                             // минификация JS
	.pipe(rename({
		suffix: '.min'                            // переименовываем сжатый файл
	}))
	.pipe(gulp.dest(`${build}/js`))             // путь вывода файлов
	.pipe(browserSync.reload({
		stream: true                              // перезагружаем страницу
	}));
});

// Минифицируем изображения
gulp.task('img', () => {
	return gulp.src(`${dev}/img/**/*`)          // путь ко всем изображениям
	.pipe(imagemin([                            // сжатие изображений без потери качества
		imageminJpeg(),                           // сжатие jpeg
    imageminPng()                             // сжатие png
  ], {
    progressive: true,
    strip: true
  }))
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
			baseDir: `${build}`                     // корневая папка для запускаемого проекта
		},
		notify: false                             // отключаем стандартные уведомления browsersync
	});
});

// Переносим файл манифеста в папку build
gulp.task('manifest', () => {
	return gulp.src(`${dev}/manifest.json`)
	.pipe(gulp.dest(`${build}/`));
});

// Следим за изменениями файлов и выполняем соответствующие таски
gulp.task('default', gulp.parallel('sass', 'img', 'pug', 'jsLibs', 'scripts', 'fonts', 'manifest', 'browser-sync', () => {
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
	// манифест
  gulp.watch(`${dev}/manifest.json`, gulp.series('manifest'));
}));

// Удаляем все лишние файлы: '.gitkeep', 'changelog.md' и 'readme.md'
gulp.task('misc', async () => {
	return del.sync(['**/.gitkeep', '.assets', 'changelog.md', 'readme.md']);
});

// Очищаем директорию продакшен билда
gulp.task('clean', async () => {
	return del.sync(`${prod}/**/*`);
});

// Собираем наш билд в продакшен
gulp.task('prod', gulp.series('clean', 'img', '_sass', '_pug', 'jsLibs', '_scripts', async () => {
	// Собираем JS
	gulp.src(`${build}/js/libs.min.js`)
	.pipe(gulp.dest(`${prod}/js`));

	// Собираем шрифты
	gulp.src(`${dev}/fonts/**/*`)
	.pipe(gulp.dest(`${prod}/fonts`));

	// Собираем изображения
	gulp.src(`${build}/img/**/*`)
	.pipe(gulp.dest(`${prod}/img`));

	// Собираем manifest.json
	gulp.src(`${dev}/manifest.json`)
	.pipe(gulp.dest(`${prod}/`));
}));