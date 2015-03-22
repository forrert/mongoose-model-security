'use strict';

module.exports = function(policy, securityManager) {
    return function(next) {
        if (securityManager.isPrivileged()) {
            return next();
        } else {
            var query = this;
            policy.getCondition(query.model.modelName, 'read').then(function(condition) {
                query.where(condition);
                return next();
            }).catch(function(error) {
                next(error);
            });
        }
    };
};
