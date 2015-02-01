'use strict';

var _ = require('lodash');

function PolicyBuilder(policy) {
    this.policy = policy;
}

PolicyBuilder.prototype.model = function(modelName) {
    var policy = this.policy;
    var policyBuilders = {};
    /**
     * Grants unconditional permission to every user for the specified permissions. If no permission is specified,
     * unconditional permission to all existing permissions are granted.
     * @param [permissions] none, one or multiple permissions
     * @returns {{PolicyBuilder}} this
     */
    policyBuilders.grantAll = function(permissions) {
        if (!permissions) {
            permissions = policy.getPermissions();
        }
        if (!_.isArray(permissions)) {
            permissions = [permissions];
        }
        _.each(permissions, function(permission) {
            policy.addRule(modelName, permission, true);
        });
        return policyBuilders;
    };
    var permissions = policy.getPermissions();
    _.each(permissions, function(permission) {
        policyBuilders[permission] = function(condition) {
            policy.addRule(modelName, permission, condition);
            return policyBuilders;
        };
    });
    return policyBuilders;
};

module.exports = PolicyBuilder;
