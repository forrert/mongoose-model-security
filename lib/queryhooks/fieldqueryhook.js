'use strict';

var _ = require('lodash');

module.exports = function(policy, securityManager) {
    return function(next) {
        if (securityManager.isPrivileged()) {
            return next();
        } else {
            var query = this;
            policy.getCondition(query.model.modelName, 'readFields').then(function(fields) {
                if (fields) {
                    applyFieldReadPermissions(query, fields);
                }
                return next();
            }).catch(function(err) {
                next(err);
            });
        }
    };
};

var applyFieldReadPermissions = function(query, fields) {
    var includesDefined = hasIncludedFieldsDefined(query);

    _.forOwn(fields, function(readAllowed, fieldName) {
        if (readAllowed) {
            return;
        }
        applySelection(query, includesDefined, fieldName);
        cleanSort(query.options, fieldName);
        cleanQuery(query._conditions, fieldName);
    });
};

var hasIncludedFieldsDefined = function(query) {
    var includesDefined = false;
    if (query._fields) {
        _.forOwn(query._fields, function(value) {
            if (value) {
                includesDefined = true;
            }
        });
    }
    return includesDefined;
};

var applySelection = function(query, includesDefined, fieldName) {
    if (includesDefined) { // we cannot mix excludes and includes, so only remove includes when existing
        delete query._fields[fieldName];
        if (_.isEmpty(query._fields)) { // in case no field is selected more, select id so that no other fields are exposed which are probably protected
            query.select('_id');
        }
    } else {
        query.select('-' + fieldName); // 'populate' is handled here also
    }
};

var cleanSort = function(options, fieldName) {
    if (options && options.sort) {
        if (options.sort[fieldName]) {
            delete options.sort[fieldName];
        }
    }
};

var cleanQuery = function(conditions, fieldName) {
    if (conditions) {
        var cleanQueryRecursively = function(conditions) {
            _.forOwn(conditions, function(conditionValue, conditionKey) {
                if (conditionKey === fieldName) {
                    delete conditions[conditionKey];
                }
                if (conditionValue instanceof Array) {
                    var hasNonEmptyValue = false;
                    _.forEach(conditionValue, function(arrayItem) {
                        cleanQueryRecursively(arrayItem);
                        if (!_.isEmpty(arrayItem)) {
                            hasNonEmptyValue = true;
                        }
                    });
                    if (!hasNonEmptyValue) { // remove empty arrays (like '{'$or': []}')
                        delete conditions[conditionKey];
                    }
                }
            });
        };
        cleanQueryRecursively(conditions);
    }
};

