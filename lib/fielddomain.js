'use strict';

var _ = require('lodash');

var permissions = ['readFields'];

/**
 * Domain handling permission requests on field level
 * @param {SecurityManager} securityManager
 * @constructor
 */
function FieldDomain(securityManager) {
    this.securityManager = securityManager;
}

FieldDomain.prototype.accept = function(permission) {
    return _.includes(permissions, permission);
};

FieldDomain.prototype.getModelName = function(target) {
    if (_.isString(target)) {
        return target;
    } else {
        return target.constructor.modelName;
    }
};

FieldDomain.prototype.aggregateConditions = function(conditions) {
    var result = {};
    _.forEach(conditions, function(condition) {
        _.assign(result, condition);
    });

    return result;
};

module.exports = FieldDomain;
