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
    pluginProvider = require('./lib/pluginprovider');

function Security() {
    this.modelProviders = [];
    this.securityManager = new securityManager();
    this.policy = new policy(this.modelProviders, this.securityManager);
    this.policyBuilder = new policyBuilder(this.policy);
}

var findFunctions = ['find', 'findOne', 'findById'];

// the arguments variable is not a proper array, this turns it into an array to make standard array function available
var asArray = function(args) {
    var result = [];
    for (var i = 0; i < args.length; i++) {
        result.push(args[i]);
    }
    return result;
};

// strap the callback from a find function (if present) to ensure query.exec is being called
var strapCallback = function(name) {
    var model = mongoose.Model;
    var func = model[name];
    model[name] = function() {
        var args = asArray(arguments);
        if (_.isFunction(_.last(args))) {
            var newArgs = args.slice(0, -1);
            var query;
            if (newArgs.length === 0) {
                query = func.apply(this);
            } else {
                query = func.apply(this, newArgs);
            }
            return query.exec(_.last(args));
        } else {
            return func.apply(this, args);
        }
    };
};

/**
 * Initialize security. This needs to be called before initializing models in mongoose.
 */
Security.prototype.init = function() {
    var self = this;
    mongoose.plugin(this.getPlugin());

    _.forEach(findFunctions, function(func) {
        strapCallback(func);
    });

    var query = mongoose.Query;
    _.assign(query, hooks);
    query.hook(query.exec, query.prototype.exec);
    query.pre('exec', function(next) {
        var query = this;
        if (self.securityManager.isPrivileged()) {
            return next();
        } else {
            self.policy.getCondition(query.model.modelName, 'readFields').then(function(fields) {
                if (fields) {
                    applyFieldReadPermissions(query, fields);
                }

                // add read conditions after adding field security - otherwise read permissions could get
                // modified (ignored) because of field security
                self.policy.getCondition(query.model.modelName, 'read').then(function(condition) {
                    query.where(condition);
                    return next();
                }).catch(function(error) {
                    next(error);
                });
            }).catch(function(error) {
                next(error);
            });
        }
    });
};

var applyFieldReadPermissions = function(query, fields) {
    var includesDefined = hasIncludedFieldsDefined(query);

    _.forOwn(fields, function(readAllowed, fieldName) {
        if (readAllowed) {
            return;
        }
        applySelection(query, includesDefined, fieldName);
        cleanSort(query.options, fieldName);
        cleanQuery(query._conditions, fieldName);
    });
};

var hasIncludedFieldsDefined = function(query) {
    var includesDefined = false;
    if (query._fields) {
        _.forOwn(query._fields, function(value) {
            if (value) {
                includesDefined = true;
            }
        });
    }
    return includesDefined;
};

var applySelection = function(query, includesDefined, fieldName) {
    if (includesDefined) { // we cannot mix excludes and includes, so only remove includes when existing
        delete query._fields[fieldName];
        if (_.isEmpty(query._fields)) { // in case no field is selected more, select id so that no other fields are exposed which are probably protected
            query.select('_id');
        }
    } else {
        query.select('-' + fieldName); // 'populate' is handled here also
    }
};

var cleanSort = function(options, fieldName) {
    if (options && options.sort) {
        if (options.sort[fieldName]) {
            delete options.sort[fieldName];
        }
    }
};

var cleanQuery = function(conditions, fieldName) {
    if (conditions) {
        var cleanQueryRecursively = function(conditions) {
            _.forOwn(conditions, function(conditionValue, conditionKey) {
                if (conditionKey === fieldName) {
                    delete conditions[conditionKey];
                }
                if (conditionValue instanceof Array) {
                    var hasNonEmptyValue = false;
                    _.forEach(conditionValue, function(arrayItem) {
                        cleanQueryRecursively(arrayItem);
                        if (!_.isEmpty(arrayItem)) {
                            hasNonEmptyValue = true;
                        }
                    });
                    if (!hasNonEmptyValue) { // remove empty arrays (like '{'$or': []}')
                        delete conditions[conditionKey];
                    }
                }
            });
        };
        cleanQueryRecursively(conditions);
    }
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
