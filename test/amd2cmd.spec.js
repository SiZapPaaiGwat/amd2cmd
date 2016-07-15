import amd2cmd, { ModulePathTransform } from '../src/amd2cmd';
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
});
