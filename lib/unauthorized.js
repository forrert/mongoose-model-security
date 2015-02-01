'use strict';

var _ = require('lodash');

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
