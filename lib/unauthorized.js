'use strict';

var _ = require('lodash');

/**
 * creates a new error object for a unauthorized permission
 * @param {String|Document} target the target of the permission request
 * @param {String }permission the requested permission
 * @param {Error} [cause] an optional error object that caused the permission denial
 * @returns {Error} a new error object for the unauthorized permission
 */
module.exports = function(target, permission, cause) {
    var id = '';
    var model = target;
    if (!_.isString(target) && target.constructor.modelName) {
        id = target._id;
        model = target.constructor.modelName;
    }
    var message = 'Unauthorized: No permission to ' + permission + ' this document (' +
        model + '[' + id + ']).';
    var error = new Error(message);
    error.reason = 'Unauthorized';
    error.message = message;
    error.model = model;
    error.target = target;
    error.permission = permission;
    error.status = 403;
    error.cause = cause;
    return error;
};
