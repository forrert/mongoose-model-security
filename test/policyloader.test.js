'use strict';

var should = require('should'),
    proxyquire = require('proxyquire').noCallThru(),
    util = require('../lib/util'),
    _ = require('lodash'),
    policyLoader = require('../lib/policyloader.js');


// records calls to #buildPolicy and #grantAll
function SecurityMock() {
    this.callers = [];
    this.grantAll = [];
}

SecurityMock.prototype.buildPolicy = function(modelName) {
    var self = this;
    this.callers.push(modelName);
    return {
        grantAll: function() {
            self.grantAll.push(modelName);
        }
    };
};

var securityMock;

describe('PolicyLoader Spec:', function() {
    beforeEach(function() {
        securityMock = new SecurityMock();
    });

    var aConfig = {
        path: 'test/fixtures/',
        extension: '.policy'
    };

    it('loads an existing policy file for a model', function(done) {
        var aMongooseFake = {
            modelNames: function() {
                return ['SimpleModel'];
            }
        };
        proxyquire('./fixtures/simplemodel.policy', {'security': securityMock});

        policyLoader(securityMock, aMongooseFake, aConfig);

        securityMock.callers.should.be.eql(['SimpleModel']);
        done();
    });
    it('loads grantAll policy for missing policy file without default policy configured', function(done) {
        var aModelName = 'ComplexModel';
        var aMongooseFake = {
            modelNames: function() {
                return [aModelName];
            }
        };

        policyLoader(securityMock, aMongooseFake, aConfig);

        securityMock.callers.should.be.eql([aModelName]);
        securityMock.grantAll.should.be.eql([aModelName]);
        done();
    });
    it('loads configured default policy for missing file', function(done) {
        var aModelName = 'ComplexModel';
        var aMongooseFake = {
            modelNames: function() {
                return [aModelName];
            }
        };

        var defaultPolicyCalled = false;
        var anotherConfig = _.assign({
            defaultPolicy: function() {
                defaultPolicyCalled = true;
            }
        }, aConfig);

        policyLoader(securityMock, aMongooseFake, anotherConfig);

        securityMock.callers.should.be.eql([aModelName]);
        /*jshint -W030 */
        //noinspection BadExpressionStatementJS
        defaultPolicyCalled.should.be.ok;
        done();
    });
});
