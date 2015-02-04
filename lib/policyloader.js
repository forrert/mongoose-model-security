'use strict';

var _ = require('lodash'),
    path = require('path');

module.exports = function(security, mongoose, config) {
    // load policy files
    _.forEach(mongoose.modelNames(), function(modelName) {
        try {
            // load policy file for model
            var policyFile = config.path + modelName.toLowerCase() + (config.extension ? config.extension : '');
            require(path.resolve(policyFile));
        } catch (error) {
            console.log('Warning: no policy file found for model "' + modelName + '". ' +
            'All users will have default privileges for the model.');
            var policyBuilder = security.buildPolicy(modelName);
            if (config.defaultPolicy && _.isFunction(config.defaultPolicy)) {
                config.defaultPolicy(policyBuilder);
            } else {
                policyBuilder.grantAll();
            }
        }
    }, this);
};
