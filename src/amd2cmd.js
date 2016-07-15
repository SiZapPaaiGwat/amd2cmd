import vfs from 'vinyl-fs';
import map from 'map-stream';
import { join, relative, dirname, isAbsolute } from 'path';
import { existsSync } from 'fs';
import AMD2CMDTransformer from './AMD2CMDTransformer';

export class ModulePathTransform {
  /**
   * Creates an instance of ModulePathTransform.
   *
   * @param {String} filepath
   * @param {String} basedir
   */
  constructor(filepath, basedir) {
    this.filepath = filepath;
    this.basedir = basedir;
  }

  /**
   * transform module path to commonjs pattern
   *
   * @param {String} modulePath module path
   * @returns {String} return transformed module path
   */
  transform(modulePath) {
    if (modulePath.startsWith('.')) {
      return modulePath;
    } else if (modulePath.indexOf('/') === -1) {
      if (existsSync(`${join(this.filepath, modulePath)}.js`)) {
        return `./${modulePath}`;
      }
      return modulePath;
    }
    const result = relative(this.filepath, join(this.basedir, modulePath));
    if (!result.startsWith('.')) {
      return `./${result}`;
    }
    return result;
  }
}

function generateCodeTransformFn(basedir) {
  return (file, cb) => {
    const modulePathTransformer = new ModulePathTransform(dirname(file.path), basedir || file.base);
    const modulePathTransformFn = (modulePath) => modulePathTransformer.transform(modulePath);
    /* eslint no-param-reassign:0 */
    file.contents = Buffer.from(new AMD2CMDTransformer(file.contents.toString('utf-8'),
      modulePathTransformFn).transform(), 'utf-8');
    cb(null, file);
  };
}

function formatBaseDir(basedir) {
  if (basedir && (!isAbsolute(basedir))) {
    return join(process.cwd(), basedir);
  }

  return basedir;
}

/**
 * transform amd code to cmd code
 *
 * @export
 * @param {String[]} inFiles files pattern which will be transformed, pattern visit https://github.com/isaacs/node-glob
 * @param {String} outDir target directory
 * @param {String?} basedir amd module base dir. If relative path, will join with `process.cwd()`, or if null, will reguest basedir from inFiles, visit https://github.com/gulpjs/vinyl#optionsbase
 */
export default function amd2cmd(inFiles, outDir, basedir) {
  const mapFn = generateCodeTransformFn(formatBaseDir(basedir));
  return vfs.src(inFiles, { buffer: true })
   .pipe(map(mapFn))
   .pipe(vfs.dest(outDir));
}
