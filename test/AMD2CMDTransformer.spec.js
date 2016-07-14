import AMD2CMDTransformer, { StringReplace } from '../src/AMD2CMDTransformer';
import { describe, it } from 'mocha';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expect } from 'chai';

const amdCode = readFileSync(join(__dirname, './code/amdcode.js'), 'utf-8');
const cmdCode = readFileSync(join(__dirname, './code/cmdcode.js'), 'utf-8');

describe('StringReplace', () => {
  it('replace', () => {
    const stringReplace = new StringReplace('0123456789ABCDEFG', 3, 13);
    stringReplace.replace('test1', 3, 5);
    stringReplace.replace('test2', 6, 8);
    const actual = stringReplace.getResult();
    expect(actual).to.equal('test15test289ABC');
  });

  it('put another string replace', () => {
    const content = '0123456789ABCDEFG';
    const stringReplace = new StringReplace(content, 3, 13);
    const stringReplace2 = new StringReplace(content, 3, 9);
    stringReplace2.replace('test1', 3, 5);
    stringReplace2.replace('test2', 6, 8);
    stringReplace.addReplace(stringReplace2);

    const actual = stringReplace.getResult();
    expect(actual).to.equal('test15test289ABC');
  });
});

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
