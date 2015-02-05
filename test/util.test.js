'use strict';

var util = require('../lib/util'),
    should = require('should');

describe('Util Spec:', function() {
    describe('#getOrCreate Spec:', function() {
        it('invokes the creator and returns its return value', function(done) {
            var obj = {key: 'value'};
            var providedValue = {key: 'providedValue'};
            var result = util.getOrCreate(obj, 'newKey', function() {
                return providedValue;
            });
            should.exist(result);
            result.should.be.equal(providedValue);
            done();
        });
        it('returns the existing value', function(done) {
            var obj = {key: 'value'};
            var providedValue = {key: 'providedValue'};
            var result = util.getOrCreate(obj, 'key', function() {
                return providedValue;
            });
            should.exist(result);
            result.should.be.equal('value');
            done();
        });
        it('properly propagates provider exceptions', function(done) {
            var error = new Error('Error in provider');
            var obj = {};
            should(function() {
                util.getOrCreate(obj, 'key', function() {
                    throw error;
                });
            }).throw(error);
            should.not.exist(obj.key);
            done();
        });
    });

    describe('#promisify Spec:', function() {
        it('returns a promise that resolves to the passed argument', function(done) {
            var arg = {key: 'value'};
            var promise = util.promisify(arg);
            should.exist(promise);
            should.exist(promise.then);
            promise.then(function(resolveValue) {
                resolveValue.should.be.equal(arg);
                done();
            });
        });
        it('returns a promise that resolves to the return value of the passed function', function(done) {
            var arg = {key: 'value'};
            var fun = function() {
                return arg;
            };
            var promise = util.promisify(fun);
            should.exist(promise);
            should.exist(promise.then);
            promise.then(function(resolveValue) {
                resolveValue.should.be.equal(arg);
                done();
            });
        });
        it('returns a promise that rejects with the thrown error of the passed function', function(done) {
            var error;
            var fun = function() {
                error = new Error('Test Error');
                throw  error;
            };
            var promise = util.promisify(fun);
            should.exist(promise);
            should.exist(promise.then);
            promise.then(function(resolveValue) {
                done('promise resolved, but should have rejected.');
            }, function(rejectValue) {
                should.exist(rejectValue);
                rejectValue.should.be.eql(error);
                done();
            });
        });
    });

    describe('#path Spec:', function() {
        var testObject = {
            name: 'John',
            address: {
                street: 'Main St.',
                city: {
                    name: 'Portland',
                    state: 'Oregon',
                    country: {
                        name: 'United States of America',
                        short: 'USA'
                    }
                }
            }
        };

        it('returns property at 1st level', function(done) {
            var aPath = ['name'];

            var value = util.path(testObject, aPath);

            value.should.be.equal('John');
            done();
        });
        it('returns property at deep level', function(done) {
            var aPath = ['address', 'city', 'country', 'short'];

            var value = util.path(testObject, aPath);

            value.should.be.equal('USA');
            done();
        });
        it('returns undefined if 1st level property does not exist', function(done) {
            var aPath = ['lastname'];

            var value = util.path(testObject, aPath);

            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            (value === undefined).should.be.ok;
            done();
        });
        it('returns undefined if deep level property does not exist', function(done) {
            var aPath = ['address', 'city', 'population', 'percentageMale'];

            var value = util.path(testObject, aPath);

            /*jshint -W030 */
            //noinspection BadExpressionStatementJS
            (value === undefined).should.be.ok; /*jshint -W030 */
            done();
        });
    });
});
