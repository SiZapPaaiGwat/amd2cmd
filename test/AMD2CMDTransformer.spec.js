import AMD2CMDTransformer from '../src/AMD2CMDTransformer';
import { describe, it } from 'mocha';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

const amdCode = readFileSync(join(__dirname, './code/amdcode.js'), 'utf-8');
const simpleAmdCode = readFileSync(join(__dirname, './code/simpleamdcode.js'), 'utf-8');
const cmdCode = readFileSync(join(__dirname, './code/cmdcode.js'), 'utf-8');

describe('AMD2CMDFormat', () => {
  const moduleNameTransform = moduleName => {
    if (moduleName === 'dep1') {
      return './dep1';
    }
    if ((!moduleName.startsWith('.')) && moduleName.indexOf('/') >= 0) {
      return `./${moduleName}`;
    }
    return moduleName;
  };

  it('format', () => {
    const actual = new AMD2CMDTransformer(amdCode, moduleNameTransform).transform();
    expect(actual).to.eql(cmdCode);
  });

  it('format require', () => {
    const actual = new AMD2CMDTransformer(simpleAmdCode, moduleNameTransform).transform();
    expect(actual).to.eql(cmdCode);
  });
});
