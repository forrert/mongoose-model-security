'use strict';

var _ = require('lodash'),
    promise = require('promise'),
    util = require('./util.js');

var templateOptions = {
    interpolate: /{{([\s\S]+?)}}/g
};

var getParameters = function(modelProviders, target) {
    var parameters = {target: target};
    _.reduce(modelProviders, function(parameters, modelProvider) {
        return _.assign(parameters, modelProvider());
    }, parameters);
    return parameters;
};

var getRulesPromise = function(securityManager, parameters, rules) {
    var promises = _.map(rules, function(rule) {
        if (_.isFunction(rule)) {
            return securityManager.privileged(function() {
                var result = rule(parameters);
                if (result.then) {
                    return result;
                } else {
                    return util.promisify(result);
                }
            });
        } else if (_.isBoolean(rule)) {
            return util.promisify(rule);
        } else if (rule.then) {
            return rule;
        } else {
            return util.promisify(rule);
        }
    });
    return promise.all(promises);
};

/**
 * Builds conditions from a given set of rules
 * @param {Object} domain the domain object
 * @param {String|Document} target
 * @param {Object[]} rules a list of rules
 * @param {function[]} modelProviders a list of functions
 * @param {SecurityManager} securityManager
 * @constructor
 */
function ConditionBuilder(domain, target, rules, modelProviders, securityManager) {
    this.domain = domain;
    this.target = target;
    this.rules = rules;
    this.modelProviders = modelProviders;
    this.securityManager = securityManager;
}

ConditionBuilder.prototype.getPromise = function() {
    var domain = this.domain;
    if (this.rules.length > 0) {
        var parameters = getParameters(this.modelProviders, this.target);
        return getRulesPromise(this.securityManager, parameters, this.rules)
            .then(function(conditions) {
                return domain.aggregateConditions(conditions);
            }).then(function(condition) {
                var template = JSON.stringify(condition);
                return JSON.parse(_.template(template, templateOptions)(parameters));
            });
    } else {
        return util.promisify(domain.aggregateConditions([]));
    }
};

module.exports = ConditionBuilder;
