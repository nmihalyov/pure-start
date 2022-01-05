# Pure Start

**Pure Start** is a boilerplate that allows you to start working on a new project fast and easy. It provides you with a clean and flexible environment to create static applications and can be extended to create something more complex.

## Features
+ Starting local server
+ SASS/SCSS preprocessors
+ Pug templating
+ JS transpilation
+ TypesScript support
+ File minification
+ Some predefined UI components
+ and more...

## Installation
+ Manually download and unpack repository archive
+ Using Git `git clone https://github.com/nmihalyov/pure-start.git`

## Commands
Run this commands using `npm run ${command}` or `yarn ${command}`
+ `start` – starts local dev server on development mode
+ `build` – creates production build
+ `stats` – generates JSON file for analyzing bundle
+ `analyze` – opens analyze report (run `stats` before)
+ `comp` – creates new component (see below for details)
+ `prettier:check` – checks for prettier compliance
+ `prettier:fix` – fixes prettier issues
+ `eslint:check` – checks for eslint compliance
+ `eslint:fix` – fixes eslint issues

## Creating a component
You can create component manually or by CLI. The comman below will create catalog and **pug**, **scss** files named by `<component_name>` in components catalog with simple layout:

`npm run comp <component_name>`

#### Modificators

`--ui` – creates component in **_ui** subfolder

`--js` – additionaly creates **js** file

`--ts` – additionaly creates **ts** file

`--section` – generates section layout for **pug** file

## Structure
Boilerplate's structure is pretty simple!

At the root there a some config files and script for creating components via CLI.

`dist` folder contains production build for your project that can be deployed. Do not changing anything here by your hands.

`src` is a working directory which contains your project source code. Below folders are located here.

`assets` is used for static content like images and fonts.

`components` contains your... components! They can be UI (like button, checkbox, etc.) or just simple components, as you like. Components usually has 3 realizations: markup – pug, styles – scss, scripts – javascript (this one may be missing).

`pug` consists of `layouts` (which are shells for different page, e.g. one for online shop interface and other for admin section), `pages` (for pages markup) and `utils` (any utilities you can use for pages or layouts).

`scss` for JavaScript and TypesScript files (you can write both, but it's highly recommended to use TS).

`scss` for global styles (don't write component specific styles here).

`index.js` is entry point for youe JS/TS files.