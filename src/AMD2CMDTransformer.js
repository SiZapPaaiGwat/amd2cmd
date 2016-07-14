import { parse } from 'acorn';
import { filter, map } from 'lodash';
import StringEditor from './StringEditor';

const REQUIRE_EXPRESSION_REGEXP = /require[\s\n\r]*\([\s\n\r]*['"](.+?)['"][\s\n\r]*\)/g;
const TWO_BLACK_START_REGEXP = /^ {2}/gm;
const TAB_START_REGEXP = /^\t/gm;

export default class AMD2CMDTransformer {
  constructor(content, moduleNameTransform) {
    this.content = content;
    this.moduleNameTransform = moduleNameTransform || (moduleName => moduleName);
    this.result = new StringEditor(this.content);
    this.indentType = this.content.indexOf('\t') >= 0 ? 'TAB' : 'BLACK';
  }

  transform() {
    const ast = parse(this.content);
    const exps = ast.body;
    const defineExps = this.findDefineCallExpressions(exps);
    for (const exp of defineExps) {
      this.result.replace(exp.start, exp.end,
        this.handleDefineExpression(exp.expression));
    }
    return this.result.toString();
  }

  findDefineCallExpressions(exps) {
    return filter(exps, exp => {
      const expression = exp.expression;
      return expression && expression.type === 'CallExpression' &&
        expression.callee.name === 'define';
    });
  }

  /**
   * handle define expression
   *
   * transform
   *
   * ```js
   * define(['moduleA', 'moduleB'], function(moduleA, moduleBOtherName) {
   *   return moduleA + moduleBOtherName;
   * });
   * ```
   *
   * to
   *
   * ```js
   * var moduleA = require('moduleA');
   * var moduleBOtherName = require('moduleB');
   * module.exports = moduleA + moduleBOtherName;
   * ```
   *
   * @param {CallExpression} defineExp
   * @returns
   */
  handleDefineExpression(defineExp) {
    const dependencyExps = defineExp.arguments.length === 2 ? defineExp.arguments[0] : null;
    const fnExp = defineExp.arguments[defineExp.arguments.length - 1];
    let content = '';
    if (dependencyExps) {
      content += this.handleDependencyModules(dependencyExps, fnExp);
    }
    content += this.handleDefineFnExpression(fnExp);
    return content;
  }

  /**
   * Handle function of define expression. like this:
   *
   * ```js
   * define(['moduleA', 'moduleB'], function defineFn() {
   *   return '123';
   * });
   * ```
   *
   * this method handle defineFn method to:
   *
   * ```js
   * module.exports = '123';
   * ```
   *
   * this method trasforms:
   *
   * * first return statement to `module.exports =`
   * * remove one indent from every lines
   * * `require('moduleA/index')` to `require('./moduleA/index')`
   *
   * @param {FunctionExpression} fnExp
   * @returns
   */
  handleDefineFnExpression(fnExp) {
    const fnBodyExp = fnExp.body;
    const result = new StringEditor(this.content, fnBodyExp.start + 1, fnBodyExp.end - 1);
    for (const exp of fnBodyExp.body) {
      if (exp.type === 'ReturnStatement') {
        result.replace(
            exp.start,
            exp.end,
            this.content.substring(exp.start, exp.end)
              .replace(/return/, 'module.exports ='));
        break;
      }
    }

    return result.toString()
      .replace(this.indentType === 'TAB' ? TAB_START_REGEXP : TWO_BLACK_START_REGEXP, '')
      .replace(/^\n/, '')
      .replace(/\n$/, '')
      .replace(REQUIRE_EXPRESSION_REGEXP,
        (match, moduleName) => `require('${this.moduleNameTransform(moduleName)}')`);
  }

  handleDependencyModules(dependencyExps, fnExp) {
    return this.formatDependencyModules(
        this.findDependencyModules(dependencyExps.elements, fnExp));
  }

  findDependencyModules(dependencyExps, fnExp) {
    const modules = [];
    const params = fnExp.params;

    for (let i = 0, len = dependencyExps.length; i < len; i++) {
      const dependencyExp = dependencyExps[i];
      const param = params[i];
      modules.push({
        moduleName: this.moduleNameTransform(dependencyExp.value),
        dependencyName: param ? param.name : null,
      });
    }
    return modules;
  }

  formatDependencyModules(dependencyModules) {
    const mapFn = module => {
      if (module.dependencyName) {
        return `var ${module.dependencyName} = require('${module.moduleName}');`;
      }
      return `require('${module.moduleName}');`;
    };

    return `${map(dependencyModules, mapFn).join('\n')}\n`;
  }
}
