'use strict';

var _ = require('lodash'),
    util = require('./util');

/**
 * Domain handling permission requests on Model level
 * @constructor
 */
function ModelDomain() {
}

ModelDomain.prototype.accept = function(permission) {
    return permission === 'create';
};

ModelDomain.prototype.getModelName = function(target) {
    return target.constructor.modelName;
};

ModelDomain.prototype.evaluateCondition = function(target, condition) {
    // just pass on the boolean value
    return util.promisify(condition);
};

ModelDomain.prototype.aggregateConditions = function(conditions) {
    // at least one rule must have evaluated to true
    return _.includes(conditions, true);
};

module.exports = ModelDomain;
