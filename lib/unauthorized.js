'use strict';

var _ = require('lodash');

function UnauthorizedError(target, permission, cause) {
    Error.captureStackTrace(this);
    var id = '';
    var model = target;
    if (!_.isString(target) && target.constructor.modelName) {
        id = target._id;
        model = target.constructor.modelName;
    }
    this.message = 'Unauthorized: No permission to ' + permission + ' ' + model + '.';
    this.id = id;
    this.model = model;
    this.target = target;
    this.permission = permission;
    this.status = 403;
    this.cause = cause;
    this.name = 'UnauthorizedError';
}

UnauthorizedError.prototype = Object.create(Error.prototype);

module.exports = UnauthorizedError;
