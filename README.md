# AMD2CMD

transform [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) or CommonJS inspired by [require.js](http://requirejs.org/) to [CommonJS](http://www.commonjs.org/).

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

## Transform What

before(AMD):

```js
define(['dep1', 'dep2'], function(dep1, dep2OtherName) {
  return dep1 + dep2OtherName;
});
```

transform after(CommonJS):

```js
var dep1 = require('dep1');
var dep2OtherName = require('dep2');
module.exports = dep1 + dep2OtherName;
```

* transform `define(['dep1', 'dep2'], function() {});` to `require('dep1');require('dep2');`
* transform `define(function(){return statements;})` to `module.exports = statements;`
* transform `require('obj/xxx')` to `require('../obj/xxx')`

So, Notice this tool can not transform all require.js features.

## Usage

### cli

First, install amd2cmd:

```bash
 npm install -g amd2cmd
```

Second, cd your project, and exec cmd:

```bash
 amd2cmd --in=src/scripts/**/*.js --out=build/scripts --baseDir=src/scripts
```

### use with node.js

First, install amd2cmd:

```bash
 npm install --save amd2cmd
```

Then, you can use amd2cmd like this:

```js
import transform from 'amd2cmd';

transform(['src/scripts/**/*.js'], 'build/scripts', 'src/scripts')
.on('finish', function() {
  console.log('finish to transform amd code to cmd code');
});
```

## scripts

Build the project shell:

```bash
 $ npm build
```

Test the project shell:

```bash
 $ npm test
```

Test the project with coverage result:

```bash
 $ npm coverage
```

Generate JavaScript API doc:

```bash
 $ npm esdoc
```

[npm-image]: https://badge.fury.io/js/amd2cmd.svg
[npm-url]: https://npmjs.org/package/amd2cmd
[travis-image]: https://travis-ci.org/sinolz/amd2cmd.svg?branch=master
[travis-url]: https://travis-ci.org/sinolz/amd2cmd
