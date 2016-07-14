/* eslint-disable */
//注释
/**
 * 注释2
 */
var dep1 = require('dep1');
var dep2OtherName = require('dep2');

var dep3 = require('dept3');
var dep4 = require('./modules/moduleB/dep4');//this module path is validate in require.js, but not invalidate in commonjs

module.exports = function() {
  return dep1 + dep2OtherName;
};
