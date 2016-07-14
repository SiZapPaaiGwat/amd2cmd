import AMD2CMDTransformer from '../src/AMD2CMDTransformer';
import { describe, it } from 'mocha';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

const amdCode = readFileSync(join(__dirname, './code/amdcode.js'), 'utf-8');
const cmdCode = readFileSync(join(__dirname, './code/cmdcode.js'), 'utf-8');

describe('AMD2CMDFormat', () => {
  it('format', () => {
    const moduleNameTransform = moduleName => {
      if ((!moduleName.startsWith('.')) && moduleName.indexOf('/') >= 0) {
        return `./${moduleName}`;
      }
      return moduleName;
    };

    const actual = new AMD2CMDTransformer(amdCode, moduleNameTransform).transform();
    expect(actual).to.eql(cmdCode);
  });
});
