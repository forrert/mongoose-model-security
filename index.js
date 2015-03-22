'use strict';

var _ = require('lodash'),
    promise = require('promise'),
    mongoose = require('mongoose'),
    hooks = require('hooks'),
    util = require('./lib/util.js'),
    policy = require('./lib/policy.js'),
    policyLoader = require('./lib/policyloader'),
    policyBuilder = require('./lib/policybuilder'),
    securityManager = require('./lib/securitymanager'),
    pluginProvider = require('./lib/pluginprovider'),
    queryHook = require('./lib/queryhook');

function Security() {
    this.modelProviders = [];
    this.securityManager = new securityManager();
    this.policy = new policy(this.modelProviders, this.securityManager);
    this.policyBuilder = new policyBuilder(this.policy);
}

/**
 * Initialize security. This needs to be called before initializing models in mongoose.
 */
Security.prototype.init = function() {
    mongoose.plugin(this.getPlugin());
    queryHook.registerHooks(this.policy, this.securityManager);
};

/**
 * Load policies for all models in the database. This should be called after initializing models in mongoose.
 * If no policy file for a model can be found the config.defaultPolicy function is called (if present). If no such function
 * is provided, full permissions are granted for the model.
 *
 * @param {Object} config a config object for policy loading
 * @param {String} config.path a relative path for the location of policy files
 * @param {String} config.extension an optional extension for policy files
 * @param {function} config.defaultPolicy an optional function to build the policy for each model that does not have an own policy file
 */
Security.prototype.loadPolicy = function(config) {
    policyLoader(this, mongoose, config);
};

/**
 * Ask for permission for a specific document
 * @param {Document} target a mongoose document object
 * @param {String} permission a permission
 * @returns {promise} a promise that resolves to true if the permission is granted, false otherwise
 */
Security.prototype.askPermission = function(target, permission) {
    if (this.securityManager.isPrivileged()) {
        return util.promisify(true);
    } else {
        return this.policy.evaluateCondition(target, permission);
    }
};

/**
 * Get the permissions for a specific document
 * @param {Document} document a mongoose document object
 * @param {String|Array} [permissions] a permission or a list of permissions, or all permissions, if left blank
 * @returns {promise} a promise that resolves to an object containing the required permissions as keys with true/false values
 */
Security.prototype.getPermissions = function(document, permissions) {
    if (_.isNull(permissions) || _.isUndefined(permissions)) {
        permissions = this.policy.getPermissions();
    }
    if (_.isString(permissions)) {
        permissions = [permissions];
    }
    var decisions = _.map(permissions, function(permission) {
        return this.askPermission(document, permission).then(function(decision) {
            var result = {};
            result[permission] = decision;
            return result;
        });
    }, this);
    return promise.all(decisions).then(function(decisionArray) {
        return _.reduce(decisionArray, function(result, item) {
            return _.assign(result, item);
        }, {});
    });
};

Security.prototype.getPlugin = function() {
    return pluginProvider(this);
};

/**
 * @param {String} modelName name of a model
 * @returns {PolicyBuilder|*} a builder to help build the policy for a model
 */
Security.prototype.buildPolicy = function(modelName) {
    return this.policyBuilder.model(modelName);
};

/**
 * Add a model provider to the policy. Model providers add parameters that are accessible to rules in the policy.
 * Parameters may be accessed using double curly ('{{paramName}}') braces in any rules.
 *
 * @param {function} modelProvider a function taking no arguments that returns an object.
 */
Security.prototype.addModelProvider = function(modelProvider) {
    this.modelProviders.push(modelProvider);
};

Security.prototype.unauthorized = require('./lib/unauthorized');

module.exports = new Security();
