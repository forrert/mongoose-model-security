'use strict';

var _ = require('lodash'),
    promise = require('promise');

exports.model = function(mongoose) {
    var Schema = mongoose.Schema;
    var ActivitySchema = new Schema({
        name: {
            type: String,
            default: '',
            required: 'Please fill Activity name',
            trim: true
        },
        categories: {
            type: [{
                type: String
            }]
        }
    });
    return mongoose.model('Activity', ActivitySchema);
};

exports.simpleModel = function(mongoose) {
    var Schema = mongoose.Schema;
    var SimpleSchema = new Schema({
        name: {
            type: String
        }
    });
    return mongoose.model('SimpleModel', SimpleSchema);
};

module.exports.modelWithRelation = function(mongoose) {
    var Schema = mongoose.Schema;
    return mongoose.model('ModelWithRelation', new Schema({
        relatedWith: {
            type: Schema.ObjectId,
            ref: 'Activity'
        }
    }));
};

exports.fieldSecurityRelatedModel = function(mongoose) {
    var Schema = mongoose.Schema;
    var FieldSecurityRelatedSchema = new Schema({
        name: {
            type: String
        },
        hidden: {
            type: String
        }
    });
    return mongoose.model('FieldSecurityRelatedModel', FieldSecurityRelatedSchema);
};

exports.fieldSecurityModel = function(mongoose) {
    var Schema = mongoose.Schema,
        ObjectId = Schema.ObjectId;
    var FieldSecuritySchema = new Schema({
        name: {
            type: String
        },
        secretInformation: {
            type: String
        },
        anotherSecretInformation: {
            type: String
        },
        protectedRelation: {
            type: ObjectId, ref: 'FieldSecurityRelatedModel'
        },
        unprotectedRelation: {
            type: ObjectId, ref: 'FieldSecurityRelatedModel'
        }
    });
    return mongoose.model('FieldSecurityModel', FieldSecuritySchema);
};

exports.policy = function(security) {
    security.buildPolicy('Activity').
        read({categories: {$in: ['sport', 'tech']}}).
        read({name: 'Concert'}).
        update({categories: 'music'}).
        remove({name: 'Dance class'});
    security.buildPolicy('SimpleModel').
        read(true).
        create(true);
    security.buildPolicy('ModelWithRelation').
        read(true).
        create(true);
    security.buildPolicy('FieldSecurityRelatedModel').
        readFields({hidden: false}). // should get overwritten by next rule
        read(true).
        create(true);
    security.buildPolicy('FieldSecurityModel').
        readFields({secretInformation: true}). // should get overwritten by next rule
        readFields({secretInformation: false}).
        readFields({anotherSecretInformation: true}). // should get overwritten by next rule
        readFields(function() {
            return {anotherSecretInformation: false};
        }).
        readFields({protectedRelation: false}).
        read(true).
        create(true);
};

exports.testData = function(security, mongoose, Activity) {
    var createActivity = function(data, permissions) {
        return security.securityManager.privilegedAsync(new promise(function(resolve, reject) {
            new Activity(data).save(function(err, activity) {
                if (err) return reject(err);
                var result = {};
                result[activity._id] = permissions;
                resolve(result);
            });
        }));
    };

    return promise.all([
        createActivity({
            name: 'Hockey practise',
            categories: ['sport']
        }, {
            read: true,
            update: false,
            remove: false
        }),
        createActivity({
            name: 'Skiing weekend',
            categories: ['sport']
        }, {
            read: true,
            update: false,
            remove: false
        }),
        createActivity({
            name: 'Book reading',
            categories: ['culture']
        }, {
            read: false,
            update: false,
            remove: false
        }),
        createActivity({
            name: 'Concert',
            categories: ['culture', 'music']
        }, {
            read: true,
            update: true,
            remove: false
        }),
        createActivity({
            name: 'Dance class',
            categories: ['music', 'culture']
        }, {
            read: false,
            update: true,
            remove: true
        })
    ]).then(function(testData) {
        return _.reduce(testData, function(object, item) {
            return _.assign(object, item);
        }, {});
    });
};

module.exports.simpleModelData = function(SimpleModel) {
    return new promise(function(resolve, reject) {
        SimpleModel.create({
            name: 'test'
        }, function(err, document) {
            if (err) return reject(err);
            resolve(document);
        });
    });
};

module.exports.createRelatedDocument = function(ModelWithRelation, document) {
    return new promise(function(resolve, reject) {
        new ModelWithRelation({
            relatedWith: document
        }).save(function(err, document) {
            if (err) return reject(err);
            resolve(document);
        });
    });
};

module.exports.fieldSecurityModelData = function(FieldSecurityModel, FieldSecurityRelatedModel) {
    return new promise(function(resolve, reject) {
        FieldSecurityRelatedModel.create({
            name: 'test',
            hidden: 'hidden password'
        }, function(err, relatedDocument) {
            if (err) return reject(err);
            FieldSecurityModel.create({
                name: 'test',
                secretInformation: 'my password',
                anotherSecretInformation: 'not so secret',
                protectedRelation: relatedDocument,
                unprotectedRelation: relatedDocument
            }, function(err, document) {
                if (err) return reject(err);
                FieldSecurityModel.create({
                    name: '2nd document',
                    secretInformation: 'another key',
                    anotherSecretInformation: 'empty',
                    protectedRelation: relatedDocument,
                    unprotectedRelation: relatedDocument
                }, function(err, document) {
                    if (err) return reject(err);
                    resolve(document);
                });
            });
        });
    });
};
