'use strict';

var unauthorized = require('./unauthorized');
var securityQueryHook = require('./queryhooks/securityqueryhook');
var fieldQueryHook = require('./queryhooks/fieldqueryhook');

/**
 * Provider providing mongoose plugin that checks permissions on update / remove
 * @param {Security} security
 * @returns {Function} the mongoose plugin function
 */
module.exports = function(security) {
    function checkPermission(target, permission, next) {
        security.askPermission(target, permission).then(function(decision) {
            if (decision) {
                next();
            } else {
                next(new unauthorized(target, permission));
            }
        }).catch(function(error) {
            next(new unauthorized(target, permission, error));
        });
    }

    var securityMiddleWare = function(permission) {
        return function(next) {
            var doc = this;
            if (!doc.isNew) {
                checkPermission(doc, permission, next);
            } else {
                next();
            }
        };
    };

    var createSecurityMiddleWare = function(next) {
        var doc = this;
        if (doc.isNew) {
            checkPermission(doc, 'create', next);
        } else {
            next();
        }
    };

    return function(schema) {
        schema.pre('remove', securityMiddleWare('remove'));
        schema.pre('save', securityMiddleWare('update'));
        schema.pre('save', createSecurityMiddleWare);
        schema.pre('find', securityQueryHook(security.policy, security.securityManager));
        schema.pre('find', fieldQueryHook(security.policy, security.securityManager));
        schema.pre('findOne', securityQueryHook(security.policy, security.securityManager));
        schema.pre('findOne', fieldQueryHook(security.policy, security.securityManager));
    };
};
