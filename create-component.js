// Создание компонентов через командyю строку
const fs = require('fs');
const path = require('path');

let basePath = './dev/components/';
const files = {
  pug: `mixin {component}\n\t.{component}`,
  sass: `.{component}`
};

const args = process.argv.slice(2);

const createFiles = component => {
  const componentPath = path.join(basePath, component);

  Object.keys(files).forEach(extension => {
    const fileName = `${component}.${extension}`;
    const fileSource = files[extension].replace(/\{component}/g, component);
    const filePath = path.join(componentPath, fileName);

    fs.writeFile(filePath, fileSource, 'utf8', err => {
      if (err) throw err;
    });
  });
}

const createFolder = component => {
  fs.mkdir(basePath + component, err => {
    if (err) {
      throw err;
    } else {
      createFiles(component);
    }
  });
}

if (args.includes('--ui')) {
  basePath += '_ui/';
}

if (args.includes('--js')) {
  files.js = '';
}

if (args.includes('--section')) {
  files.pug = `mixin {component}\n\tsection.{component}.container\n\t\t.{component}__wrapper.wrapper`;
}

args.map(component => {
  if (component !== '--ui' && component !== '--js' && component !== '--section') {
    createFolder(component);
    console.log(`Компонент ${component} успешно создан`)
  }
});