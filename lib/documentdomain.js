'use strict';

var _ = require('lodash'),
    util = require('./util'),
    mongoose = require('mongoose');

// since every document has an _id field this can be used as an unsatisfiable condition
var unsatisfiableCondition = {_id: {$exists: false}};
var permissions = ['read', 'write', 'delete'];

function DocumentDomain(securityManager) {
    this.securityManager = securityManager;
}

DocumentDomain.prototype.accept = function(permission) {
    return _.contains(permissions, permission);
};

DocumentDomain.prototype.getModelName = function(target) {
    if (_.isString(target)) {
        return target;
    } else {
        return target.constructor.modelName;
    }
};

DocumentDomain.prototype.evaluateCondition = function(target, condition) {
    if (target.isNew) {
        return util.promisify(true);
    }
    return this.securityManager.privileged(function() {
        condition = _.assign({}, {_id: target._id}, condition);
        return target.constructor.find(condition).exec().then(function(documents) {
            return documents !== undefined && documents.length === 1;
        });
    });
};

DocumentDomain.prototype.aggregateConditions = function(conditions) {
    conditions = _.filter(conditions, function(condition) {
        return condition !== false && condition !== null && condition !== undefined;
    });
    if (conditions.length > 0) {
        if (!_.contains(conditions, true)) {
            if (conditions.length === 1) {
                return conditions[0];
            } else {
                return {
                    $or: conditions
                };
            }
        } else {
            return {};
        }
    } else {
        return unsatisfiableCondition;
    }
};

module.exports = DocumentDomain;
