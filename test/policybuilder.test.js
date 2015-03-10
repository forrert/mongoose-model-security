'use strict';

var policyBuilderCtor = require('../lib/policybuilder'),
    should = require('should'),
    util = require('../lib/util'),
    _ = require('lodash');

var fakePolicy = function() {
    this.rules = {};
};

fakePolicy.prototype.addRule = function(modelName, permission, condition) {
    var modelPolicy = util.getOrCreate(this.rules, modelName, util.emptyObjectProvider);
    var conditions = util.getOrCreate(modelPolicy, permission, util.emptyArrayProvider);
    conditions.push(condition);
};

fakePolicy.prototype.getPermissions = function() {
    return ['create', 'read', 'update', 'remove'];
};

fakePolicy.prototype.getRules = function() {
    return this.rules;
};

describe('PolicyBuilder Spec:', function() {
    describe('#grantAll Spec:', function() {
        var aTestModel = 'TestModel';
        it('Creates a true condition for all permissions', function(done) {
            var policy = new fakePolicy();

            var policyBuilder = new policyBuilderCtor(policy);
            policyBuilder.model(aTestModel).grantAll();

            var actualRules = policy.getRules();
            actualRules.should.be.eql({
                TestModel: {
                    create: [true],
                    read: [true],
                    update: [true],
                    remove: [true]
                }
            });
            done();
        });
        it('Creates a true condition for one provided permission', function(done) {
            var policy = new fakePolicy();

            var policyBuilder = new policyBuilderCtor(policy);
            policyBuilder.model(aTestModel).grantAll('read');

            var actualRules = policy.getRules();
            actualRules.should.be.eql({
                TestModel: {
                    read: [true]
                }
            });
            done();
        });
        it('Creates a true condition for an array of provided permissions', function(done) {
            var policy = new fakePolicy();

            var policyBuilder = new policyBuilderCtor(policy);
            policyBuilder.model(aTestModel).grantAll(['read', 'update']);

            var actualRules = policy.getRules();
            actualRules.should.be.eql({
                TestModel: {
                    read: [true],
                    update: [true]
                }
            });
            done();
        });
    });
});
