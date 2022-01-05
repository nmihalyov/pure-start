// Creates component from CLI
const fs = require('fs');
const path = require('path');

let basePath = './src/components/';
const files = {
  pug: `mixin {component}\n  .{component}`,
  scss: `.{component} {\n  \n}`,
};

const args = process.argv.slice(2);

const createFiles = (component) => {
  const componentPath = path.join(basePath, component);

  Object.keys(files).forEach((extension) => {
    const fileName = `${component}.${extension}`;
    const fileSource = files[extension].replace(/\{component}/g, component);
    const filePath = path.join(componentPath, fileName);

    fs.writeFile(filePath, fileSource, 'utf8', (err) => {
      if (err) throw err;
    });
  });
};

const createFolder = (component) => {
  fs.mkdir(`${basePath}${component}`, (err) => {
    if (err) {
      throw err;
    } else {
      createFiles(component);
    }
  });
};

if (args.includes('--ui')) {
  basePath += '_ui/';
}

if (args.includes('--js')) {
  files.js = '';
}

if (args.includes('--ts')) {
  files.ts = '';
}

if (args.includes('--section')) {
  files.pug = `mixin {component}\n  section.{component}.container\n    .{component}__wrapper.wrapper`;
}

args.map((component) => {
  if (!['--ui', '--js', '--ts', '--section'].includes(component)) {
    createFolder(component);
    console.info(`Component "${component}" was successfully created`);
  }
});
