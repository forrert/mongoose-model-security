'use strict';

var mongoose = require('mongoose'),
    hooks = require('hooks'),
    _ = require('lodash');

var middlewareProviders = [
    require('./queryhooks/fieldqueryhook'),
    require('./queryhooks/securityqueryhook')
];

var findFunctions = ['find', 'findOne', 'findById'];

// the arguments variable is not a proper array, this turns it into an array to make standard array function available
var asArray = function(args) {
    var result = [];
    for (var i = 0; i < args.length; i++) {
        result.push(args[i]);
    }
    return result;
};

// strap the callback from a find function (if present) to ensure query.exec is being called
var strapCallback = function(name) {
    var model = mongoose.Model;
    var func = model[name];
    model[name] = function() {
        var args = asArray(arguments);
        if (_.isFunction(_.last(args))) {
            var newArgs = args.slice(0, -1);
            var query;
            if (newArgs.length === 0) {
                query = func.apply(this);
            } else {
                query = func.apply(this, newArgs);
            }
            return query.exec(_.last(args));
        } else {
            return func.apply(this, args);
        }
    };
};

exports.registerHooks = function(policy, securityManager) {
    _.forEach(findFunctions, function(func) {
        strapCallback(func);
    });

    var query = mongoose.Query;
    _.assign(query, hooks);
    query.hook(query.exec, query.prototype.exec);

    _.forEach(middlewareProviders, function(middleware) {
        query.pre('exec', middleware(policy, securityManager));
    });
};
