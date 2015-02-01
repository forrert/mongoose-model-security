'use strict';

var _ = require('lodash'),
    promise = require('promise');

/**
 * some reusable utilities, that are not already provided by 'lodash'
 */
module.exports = {
    /**
     * Get or create an object's property
     * @param object
     * @param property
     * @param provider function to be called, if the the property does not exist yet (must be synchronous a.t.m.)
     * @returns {*} the object's property value
     */
    getOrCreate: function(object, property, provider) {
        if (!_.has(object, property)) {
            object[property] = provider();
        }
        return object[property];
    },

    /**
     * Resolve a property path on an object
     * @param object
     * @param path an array of strings containing property names
     * @returns {*} the value at the desired path, or undefined, if any of the properties does not exist
     */
    path: function(object, path) {
        return _.reduce(path, function(o, property) {
            if (o === undefined) {
                return o;
            }
            if (_.has(o, property)) {
                return o[property];
            } else {
                return undefined;
            }
        }, object);
    },

    /**
     * Turn the argument into a promise that resolves to the provided argument.
     * @param arg an arbitrary object or a function that returns an arbitrary object
     * @return {promise} a promise that resolves to the provided argument (or the provided function's return value)
     */
    promisify: function(arg) {
        if (_.isFunction(arg)) {
            return new promise(function(resolve, reject) {
                try {
                    resolve(arg());
                } catch (error) {
                    reject(error);
                }
            });
        } else {
            return promise.resolve(arg);
        }
    },

    emptyObjectProvider: function() {
        return {};
    },

    emptyArrayProvider: function() {
        return [];
    }
};
