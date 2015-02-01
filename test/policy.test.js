'use strict';

var policyCtor = require('../lib/policy'),
    securityManagerCtor = require('../lib/securitymanager'),
    should = require('should'),
    promise = require('promise'),
    _ = require('lodash');

var noModelProviders = [];
var securityManager = new securityManagerCtor();

var unsatisfiableRule = {_id: {$exists: false}};

var permissionFilter = function(permission) {
    return function(rule) {
        return rule.permission === permission;
    };
};
var getRule = function(rule) {
    return rule.rule;
};

var assertCondition = function(actualCondition, expectedCondition, done) {
    should.exist(actualCondition);
    should.exist(actualCondition.then);
    actualCondition.then(function(theCondition) {
        theCondition.should.be.eql(expectedCondition);
        done();
    }).catch(done);
};

describe('Policy Spec:', function() {
    describe('Single rule Spec:', function() {
        var aModel = 'Activity',
            aPermission = 'read',
            aRule = {userId: 'tester'};
        var policy = new policyCtor(noModelProviders, securityManager);
        policy.addRule(aModel, aPermission, aRule);

        it('returns an added rule for model', function(done) {
            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, aRule, done);
        });
        it('returns an added rule for document', function(done) {
            var aTarget = {constructor: {modelName: aModel}};

            var condition = policy.getCondition(aTarget, aPermission);

            assertCondition(condition, aRule, done);
        });
        it('returns unsatisfiable rule for another model', function(done) {
            var anotherModel = 'Organisation';

            var condition = policy.getCondition(anotherModel, aPermission);

            assertCondition(condition, unsatisfiableRule, done);
        });
        it('returns unsatisfiable rule for a document of another model', function(done) {
            var anotherTarget = {constructor: {modelName: 'Organisation'}};

            var condition = policy.getCondition(anotherTarget, aPermission);

            assertCondition(condition, unsatisfiableRule, done);
        });
        it('returns unsatisfiable rule for another permission', function(done) {
            var anotherPermission = 'write';

            var condition = policy.getCondition(aModel, anotherPermission);

            assertCondition(condition, unsatisfiableRule, done);
        });
    });
    describe('Functions as rules Spec:', function() {
        var aModel = 'Activity',
            aPermission = 'read',
            aRule = {userId: 'tester'};

        it('executes function to get condition', function(done) {
            var aRuleFunction = function() {
                return aRule;
            };
            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aRuleFunction);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, aRule, done);
        });
        it('executes function and returned promise to get condition', function(done) {
            var aRuleFunctionReturningAPromise = function() {
                return promise.resolve(aRule);
            };
            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aRuleFunctionReturningAPromise);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, aRule, done);
        });
    });
    describe('Boolean as rules Spec:', function() {
        var aModel = 'Activity',
            aPermission = 'read',
            aTrueRule = true,
            aFalseRule = false;

        it('true rule returns no condition', function(done) {
            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aTrueRule);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, {}, done);
        });
        it('false rule returns unsatisfiable condition', function(done) {
            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aFalseRule);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, unsatisfiableRule, done);
        });
        it('true rule amongst others returns no condition', function(done) {
            var anotherRule = {userId: 'tester'};

            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aTrueRule);
            policy.addRule(aModel, aPermission, anotherRule);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, {}, done);
        });
        it('false rule amongst others returns condition', function(done) {
            var anotherRule = {userId: 'tester'};

            var policy = new policyCtor(noModelProviders, securityManager);
            policy.addRule(aModel, aPermission, aFalseRule);
            policy.addRule(aModel, aPermission, anotherRule);

            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, anotherRule, done);
        });
    });
    describe('Multiple rules Spec:', function() {
        var aModel = 'Activity',
            aPermission = 'read',
            someRules = [
                {permission: 'read', rule: {userId: 'tester'}},
                {permission: 'read', rule: {category: 'Sport'}},
                {permission: 'write', rule: {date: {$gte: '2014-01-05'}}}
            ];

        var policy = new policyCtor(noModelProviders, securityManager);

        _.forEach(someRules, function(aRule) {
            policy.addRule(aModel, aRule.permission, aRule.rule);
        });

        it('combines multiple added rules', function(done) {
            var condition = policy.getCondition(aModel, aPermission);

            var expectedConditions = _.map(_.filter(someRules, permissionFilter(aPermission)), getRule);
            assertCondition(condition, {$or: expectedConditions}, done);
        });
    });
    describe('ModelProvider Spec:', function() {
        var aUserId = 'joe';
        var aModelProvider = function() {
            return {
                userId: aUserId
            };
        };
        var aDate = '2015-01-10';
        var anotherModelProvider = function() {
            return {
                today: aDate
            };
        };

        var aModel = 'Activity',
            aPermission = 'read',
            aRule = {userId: '{{userId}}'},
            anotherRule = {date: {$gt: '{{today}}'}};

        it('replaces a parameter in rule', function(done) {
            var policy = new policyCtor([aModelProvider], securityManager);
            policy.addRule(aModel, aPermission, aRule);
            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, {userId: 'joe'}, done);
        });
        it('replaces multiple parameters in rules', function(done) {
            var policy = new policyCtor([aModelProvider, anotherModelProvider], securityManager);
            policy.addRule(aModel, aPermission, aRule);
            policy.addRule(aModel, aPermission, anotherRule);
            var condition = policy.getCondition(aModel, aPermission);

            assertCondition(condition, {$or: [{userId: aUserId}, {date: {$gt: aDate}}]}, done);
        });
        it('throws an exception if a parameter is absent', function(done) {
            var policy = new policyCtor([aModelProvider], securityManager);
            var aRuleWithAbsentParameter = {userId: '{{adminId}}'};

            policy.addRule(aModel, aPermission, aRuleWithAbsentParameter);
            var condition = policy.getCondition(aModel, aPermission);
            condition.done(function() {
                done(new Error('Promise resolved, but should have rejected'));
            }, function(error) {
                should.exist(error);
                done();
            });
        });
    });
});
