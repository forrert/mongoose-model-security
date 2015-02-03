'use strict';

var _ = require('lodash'),
    util = require('./util.js'),
    promise = require('promise'),
    conditionBuilder = require('./conditionbuilder'),
    modelDomain = require('./modeldomain'),
    documentDomain = require('./documentdomain');

var getDomain = function(domains, target, permission) {
    var domain = _.find(domains, function(domain) {
        return domain.accept(permission);
    });
    if (!domain) {
        throw new Error('No Domain for target "' + target + '".');
    }
    return domain;
};

function Policy(modelProviders, securityManager) {
    this.permissions = ['create', 'read', 'update', 'remove'];
    this.policy = {};
    this.modelProviders = modelProviders;
    this.securityManager = securityManager;
    this.domains = [
        new documentDomain(securityManager),
        new modelDomain()
    ];
}

Policy.prototype.getPermissions = function() {
    return this.permissions;
};

Policy.prototype.getCondition = function(target, permission) {
    var domain = getDomain(this.domains, target, permission);
    var modelName = domain.getModelName(target);
    var rules = util.path(this.policy, [modelName, permission]);
    return new conditionBuilder(domain, target, rules ? rules : [], this.modelProviders, this.securityManager).getPromise();
};

Policy.prototype.evaluateCondition = function(target, permission) {
    var domain = getDomain(this.domains, target, permission);
    return this.getCondition(target, permission).then(function(condition) {
        return domain.evaluateCondition(target, condition);
    });
};

Policy.prototype.addRule = function(modelName, permission, condition) {
    if (!_.contains(this.permissions, permission)) {
        throw new Error('Permission "' + permission + '" is not a valid permission. Supported are: "' +
            _.reduce(this.permissions, function(text, permission) {
                return text + '", "' + permission;
            }) + '".'
        );
    }
    var modelPolicy = util.getOrCreate(this.policy, modelName, util.emptyObjectProvider);
    var permissionPolicy = util.getOrCreate(modelPolicy, permission, util.emptyArrayProvider);
    permissionPolicy.push(condition);
};

module.exports = Policy;
