'use strict';

var should = require('should'),
    modelDomainCtor = require('../lib/modeldomain');

var modelDomain = new modelDomainCtor();
var aModel = 'Activity';
var aDocument = {
    constructor: {
        modelName: aModel
    }
};

describe('ModelDomain Spec:', function() {
    describe('#accept Spec:', function() {
        it('returns true for "create" permission', function(done) {
            var accept = modelDomain.accept('create');
            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            accept.should.be.ok;
            done();
        });
        it('returns false for "read" permission', function(done) {
            var accept = modelDomain.accept('read');
            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            accept.should.be.not.ok;
            done();
        });
    });
    describe('#getModelName Spec:', function() {
        it('returns the model name', function(done) {
            var modelName = modelDomain.getModelName(aDocument);
            modelName.should.be.eql(aModel);
            done();
        });
    });
    describe('#evaluateCondition Spec:', function() {
        var aModel = 'Activity';
        it('returns promise resolving to true if condition is true', function(done) {
            var result = modelDomain.evaluateCondition(aDocument, true);
            should.exist(result);
            should.exist(result.then);
            result.then(function(value) {
                /*jshint -W030 */
                //noinspection BadExpressionStatementJS
                value.should.be.ok;
                done();
            }).catch(function(err) {
                done(err);
            });
        });
        it('returns promise resolving to false if condition is false', function(done) {
            var result = modelDomain.evaluateCondition(aDocument, false);
            should.exist(result);
            should.exist(result.then);
            result.then(function(value) {
                /*jshint -W030 */
                //noinspection BadExpressionStatementJS
                value.should.be.not.ok;
                done();
            }).catch(function(err) {
                done(err);
            });
        });
    });
    describe('#aggregateConditions Spec:', function() {
        it('returns true if conditions contain a true value', function(done) {
            var someConditions = [false, true, true];
            var aggregate = modelDomain.aggregateConditions(someConditions);
            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            aggregate.should.be.ok;
            done();
        });
        it('returns false if conditions don\'t contain a true value', function(done) {
            var someConditions = [false, false, false, false];
            var aggregate = modelDomain.aggregateConditions(someConditions);
            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            aggregate.should.be.not.ok;
            done();
        });
        it('returns false if no conditions are present', function(done) {
            var someConditions = [];
            var aggregate = modelDomain.aggregateConditions(someConditions);
            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            aggregate.should.be.not.ok;
            done();
        });
    });
});
