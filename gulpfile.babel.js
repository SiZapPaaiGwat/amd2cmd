'use strict';

import gulp from 'gulp';

import eslint from 'gulp-eslint';

import mocha from 'gulp-mocha';
import istanbul from 'gulp-istanbul';
import coveralls from 'gulp-coveralls';
import { Instrumenter as ispartaInstrumenter } from 'isparta';

import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import del from 'del';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import gulpBabel from 'gulp-babel';

/**
 * 清空非源码文件
 */
gulp.task('clean', ['build:clean'], callback => {
  del(['reporters/**/*', 'reporters']).then(() => {
    callback();
  }, error => {
    callback(error);
  });
});

/**
 * javascript代码静态检查
 */
gulp.task('lint', () => {
  const srcPath = ['**/*.js', '!node_modules/**', '!dist/**', '!build/**', '!reporters/**'];
  return gulp.src(srcPath)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/**
 * 执行单元测试
 */
gulp.task('unittest', () => {
  const testSrcPath = ['test/**/*.spec.js'];
  return gulp.src(testSrcPath)
    .pipe(mocha({
      require: ['chai'],
    }));
});

/**
 * 单元测试覆盖率前期准备
 */
gulp.task('unittest:coverage:pre', () => {
  const srcPath = ['src/**/*.js'];
  return gulp.src(srcPath)
    .pipe(istanbul({
      includeUntested: false,
      instrumenter: ispartaInstrumenter,
    }))
    .pipe(istanbul.hookRequire());
});

/**
 * 单元测试覆盖率
 */
gulp.task('unittest:coverage', ['unittest:coverage:pre'], () => {
  const testSrcPath = ['test/**/*.spec.js'];
  return gulp.src(testSrcPath)
    .pipe(mocha({
      require: ['chai'],
    }))
    .pipe(istanbul.writeReports({
      dir: 'reporters/coverage',
      reporters: ['lcov', 'json', 'text', 'text-summary'],
    }))
    .pipe(istanbul.enforceThresholds({
      thresholds: {
        global: {
          statements: 90,
          branches: 85,
          lines: 90,
          functions: 90,
        },
      },
    }));
});

gulp.task('coveralls', () =>
  gulp.src('reporters/coverage/lcov.info')
    .pipe(coveralls())
);

gulp.task('test', ['unittest']);
gulp.task('coverage', ['unittest:coverage']);

/**
 * 自动执行单元测试和代码检查
 */
gulp.task('watch', () => {
  const srcPath = ['/*.js', 'src/**/*.js', 'test/**/*.js'];
  return gulp.watch(srcPath, ['lint', 'unittest']);
});

/**
 * 项目构建
 */
gulp.task('build', callback => {
  process.env.BABEL_DISABLE_CACHE = true;
  runSequence('build:clean', ['build:src-copy', 'build:generate-rollup-babelrc'],
    ['build:es5', 'build:es6'], 'build:clean-temp', callback);
});

/**
 * 清空临时文件和构建文件
 */
gulp.task('build:clean', done => {
  del(['build/**/*', 'build', 'dist/**/*', 'dist']).then(() => {
    done();
  }, error => {
    done(error);
  });
});

/**
 * 清空临时文件
 */
gulp.task('build:clean-temp', done => {
  del(['build/**/*', 'build']).then(() => {
    done();
  }, error => {
    done(error);
  });
});

/**
 * js合并、编译成es5
 */
gulp.task('build:es5', () => {
  const entryJsFilePath = 'build/src/main.js';
  return rollup({
    entry: entryJsFilePath,
    plugins: [
      babel({
        runtimeHelpers: true,
      }),
    ],
  }).then(bundle => {
    bundle.write({
      format: 'cjs',
      dest: 'dist/index.js',
    });
  });
});

/**
 * js合并、编译成EcmaScript 2015
 */
gulp.task('build:es6', () => {
  const entryJsFilePath = 'build/src/main.js';
  return rollup({
    entry: entryJsFilePath,
  }).then(bundle => {
    bundle.write({
      format: 'es6',
      dest: 'dist/index.es6.js',
    });
  });
});

/**
 * 拷贝源码
 */
gulp.task('build:src-copy', () =>
  gulp.src('src/**/*')
    .pipe(gulp.dest('build/src'))
);

/**
 * 产生用于rollup的.babelrc文件
 */
gulp.task('build:generate-rollup-babelrc', () =>
  gulp.src('scripts/rollup.babelrc')
    .pipe(rename('.babelrc'))
    .pipe(gulp.dest('build/src/'))
);

gulp.task('babelbuild', () => gulp.src(['p2pServer.js', 'p2pClient.js'])
  .pipe(gulpBabel({ presets: ['es2015'] })).pipe(gulp.dest('dist')));

gulp.task('default', done => {
  runSequence('lint', 'test', 'build', done);
});
