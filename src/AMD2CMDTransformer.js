import { parse } from 'espree';
import { filter, map } from 'lodash';

const REQUIRE_EXPRESSION_REGEXP = /require[\s\n\r]*\([\s\n\r]*['"](.+?)['"][\s\n\r]*\)/g;
const TWO_BLACK_START_REGEXP = /^ {2}/gm;
const TAB_START_REGEXP = /^\t/gm;

export class StringReplace {
  constructor(content, start, end) {
    this.content = content;
    this.start = start;
    this.end = end;
    this.replaces = [];
  }

  replace(content, start, end) {
    /* eslint no-use-before-define:0 */
    this.replaces.push(new SimpleStringReplace(start, end, content));
  }

  addReplace(stringReplace) {
    this.replaces.push(stringReplace);
  }

  getResult() {
    let result = '';
    let start = this.start;
    for (const replace of this.replaces) {
      result += this.content.substring(start, replace.start);
      result += replace.getResult();
      start = replace.end;
    }
    result += this.content.substring(start, this.end);
    return result;
  }
}

class SimpleStringReplace extends StringReplace {
  constructor(start, end, content) {
    super(null, start, end);
    this.content = content;
  }

  getResult() {
    return this.content;
  }
}

export default class AMD2CMDTransformer {
  constructor(content, moduleNameTransform) {
    this.content = content;
    this.moduleNameTransform = moduleNameTransform || (moduleName => moduleName);
    this.result = new StringReplace(this.content, 0, this.content.length);
    this.indentType = this.content.indexOf('\t') >= 0 ? 'TAB' : 'BLACK';
  }

  transform() {
    const ast = parse(this.content);
    const exps = ast.body;
    const defineExps = this.findDefineCallExpressions(exps);
    for (const exp of defineExps) {
      this.result.addReplace(this.handleDefineExpression(exp));
    }
    return this.result.getResult();
  }

  findDefineCallExpressions(exps) {
    return map(
      filter(exps, exp => {
        const expression = exp.expression;
        return expression && expression.type === 'CallExpression' &&
          expression.callee.name === 'define';
      }),
      exp => exp.expression
    );
  }

  handleDefineExpression(defineExp) {
    const dependencyExps = defineExp.arguments.length === 2 ? defineExp.arguments[0] : null;
    const fnExp = defineExp.arguments[defineExp.arguments.length - 1];
    let content = '';
    if (dependencyExps) {
      content += this.formatDependencyModules(
        this.getDependencyModules(dependencyExps.elements, fnExp));
    }
    content += this.handleDefineFnExpression(fnExp);
    return new SimpleStringReplace(defineExp.start,
      this.charIsSemicolon(defineExp.end) ? defineExp.end + 1 : defineExp.end,
      content);
  }

  charIsSemicolon(idx) {
    return this.content.charAt(idx) === ';';
  }

  handleDefineFnExpression(fnExp) {
    const fnBodyExp = fnExp.body;
    const result = new StringReplace(this.content, fnBodyExp.start + 1, fnBodyExp.end - 1);
    for (const exp of fnBodyExp.body) {
      if (exp.type === 'ReturnStatement') {
        result.replace(
              this.content.substring(exp.start, exp.end)
                .replace(/return/, 'module.exports ='), exp.start, exp.end);
        break;
      }
    }

    return result.getResult()
      .replace(this.indentType === 'TAB' ? TAB_START_REGEXP : TWO_BLACK_START_REGEXP, '')
      .replace(/\n$/, '')
      .replace(REQUIRE_EXPRESSION_REGEXP,
        (match, moduleName) => `require('${this.moduleNameTransform(moduleName)}')`);
  }

  getDependencyModules(dependencyExps, fnExp) {
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
      return `require('${module.moduleName}')`;
    };

    return `${map(dependencyModules, mapFn).join('\n')}\n`;
  }
}
