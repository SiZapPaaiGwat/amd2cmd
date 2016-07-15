import amd2cmd, { ModulePathTransform, formatFilePath, formatFilePathToGlob } from '../src/amd2cmd';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { join } from 'path';
import { readFileSync } from 'fs';

describe('amd2cmd', () => {
  it('transform module path', () => {
    const transformer = new ModulePathTransform('base/modules/moduleA', 'base');
    expect(transformer.transform('modules/moduleB/index'))
      .to.equal('../moduleB/index');
    expect(transformer.transform('modules/moduleA/fnA'))
      .to.equal('./fnA');
  });

  it('transform amd code', done => {
    const inFiles = [join(__dirname, './code/**/*.js')];
    const outDir = join(__dirname, '../build/tmp');
    const basedir = join(__dirname, 'code');
    const expected = readFileSync(join(__dirname, './code/cmdcode.js'), 'utf-8');
    amd2cmd(inFiles, outDir, basedir)
    .on('finish', () => {
      expect(readFileSync(join(outDir, 'amdcode.js'), 'utf-8')).equal(expected);
      expect(readFileSync(join(outDir, 'cmdcode.js'), 'utf-8')).equal(expected);
      done();
    });
  });

  it('format file path', () => {
    expect(formatFilePath('./test.js')).to.equal(join(process.cwd(), 'test.js'));
    expect(formatFilePath(null)).to.equal(null);
    expect(formatFilePath('/test/*')).to.equal('/test/*');
  });

  it('format file path glob', () => {
    expect(formatFilePathToGlob(__dirname)).to.equal(join(__dirname, '**/*.js'));
    expect(formatFilePathToGlob('/test/**/*')).to.equal('/test/**/*');
  });
});
