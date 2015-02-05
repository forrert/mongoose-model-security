'use strict';

var _ = require('lodash'),
    path = require('path');

/**
 * Helper function to require node modules that contain policies for models. If
 * no policy file can be found, a default policy is loaded. The default policy
 * grants all permissions (unless otherwise provided).
 * @param {Security} security
 * @param {Mongoose} mongoose the mongoose instance
 * @param {Object} config
 * @param {String} config.path path to a folder containing policy files starting with the name of the model
 * @param {String} [config.extension] an optional file extension for the policy files
 * @param {function} [config.defaultPolicy] a function taking a PolicyBuilder as input to build a default policy
 *
 */
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
