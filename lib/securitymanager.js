'use strict';

/**
 * SecurityManager allows to execute code segments in privileged mode (i.e. no
 * permissions are being checked)
 * @constructor
 */
function SecurityManager() {
    this.stack = [];
}

SecurityManager.prototype.privileged = function(callback) {
    this.stack.push(true);
    try {
        return callback();
    } finally {
        this.stack.pop();
    }
};

SecurityManager.prototype.privilegedAsync = function(promise) {
    this.stack.push(true);
    var self = this;
    return promise.then(function(result) {
        self.stack.pop();
        return result;
    });
};

SecurityManager.prototype.safe = function(callback) {
    this.stack.push(false);
    try {
        return callback();
    } finally {
        this.stack.pop();
    }
};

SecurityManager.prototype.isPrivileged = function() {
    return this.stack[this.stack.length - 1];
};

module.exports = SecurityManager;
