import StringEditor from '../src/StringEditor';
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('StringEditor', () => {
  const content = '0123456789ABCDEF';

  it('create an string editor with range', () => {
    const stringEditor = new StringEditor(content, 3, 10);

    expect(stringEditor.content).to.equal(content);
    expect(stringEditor.start).to.equal(3);
    expect(stringEditor.end).to.equal(10);
  });

  it('create an string editor without range', () => {
    const stringEditor = new StringEditor(content);

    expect(stringEditor.content).to.equal(content);
    expect(stringEditor.start).to.equal(0);
    expect(stringEditor.end).to.equal(16);
  });

  it('replace range chars', () => {
    const stringEditor = new StringEditor(content);
    expect(stringEditor.toString()).to.equals(content);

    stringEditor.replace(2, 4, 'test');
    expect(stringEditor.toString()).to.equal('01test456789ABCDEF');

    stringEditor.replace(6, 8, 'jacking');
    expect(stringEditor.toString()).to.equal('01test45jacking89ABCDEF');
  });

  it('get string value from range string', () => {
    const stringEditor = new StringEditor(content, 3, 10);
    expect(stringEditor.toString()).to.equals('3456789');
  });
});
