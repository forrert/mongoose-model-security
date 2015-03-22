# mongoose-model-security

[![Build Status](https://travis-ci.org/forrert/mongoose-model-security.svg?branch=master)](https://travis-ci.org/forrert/mongoose-model-security)
[![Coverage Status](https://coveralls.io/repos/forrert/mongoose-model-security/badge.svg?branch=master)](https://coveralls.io/r/forrert/mongoose-model-security?branch=master)

Data driven access control layer for [mongoose](https://github.com/LearnBoost/mongoose).

* Define access rules to models based on the content of a document
* Define access rules as MongoDB query conditions
* Handle security globally and transparently
* Integrates seamlessly with the [MEAN.JS](http://meanjs.org/) stack.

## Introduction

This node.js module for [mongoose](https://github.com/LearnBoost/mongoose) is
still under development.
Changes are documented in [CHANGELOG.md](https://github.com/forrert/mongoose-model-security/blob/master/CHANGELOG.md).

If you are using this module and experiencing problems, please report them
[here](https://github.com/forrert/mongoose-model-security/issues/new).

## Install
```
npm install -save mongoose-model-security
```

Please note that this module does not automatically install `mongoose`.

## Mongoose Security Made Easy
1. Define a policy for each of your models
  ```javascript
  var security = require('mongoose-model-security');
  
  security.buildPolicy('MyModel').
    read({someProperty: 'someValue'}).
    // only fields with final 'false' value are removed (or excluded) from select, query and ordering
    readFields({someProperty: false, otherField: false}).
    update(function(parameters) {
      // some complicated logic...
      if (satisfied) {
        return true;
      } else {
        return false;
      }
    }).
    update({someOtherProperty: {$in: ['value1', 'value2']}}).
    remove(false).
    create(true);
  ```

2. Initialize Security with `mongoose`
  ```javascript
  var mongoose = require('mongoose'),
      security = require('mongoose-model-security');

  // setup mongoose / connection
  // ...

  // initialize security
  security.init();

  // load your models
  // ...

  // load your policy
  security.loadPolicy(policyConfig);
  ```

3. Use `mongoose` like you're used to
  ```javascript
  var mongoose = require('mongoose'),
      myModel = mongoose.model('MyModel');
      
  myModel.find(someQueryObj).exec(function(err, myDocuments) {
    // only returns myDocuments that satisfy any of the read conditions 
    // defined in the policy file
    myDocuments[0].someProperty = 'someNewValue';
    myDocuments[0].save(function(err) {
      // will return with an error and not save the document, if none of the
      // update conditions from the policy file are met
    });
  });
  ```

## Concept
Using this module in combination with [mongoose](https://github.com/LearnBoost/mongoose)
allows defining access permissions (create, read, update, remove) for all models.
It acts transparently on all interactions with mongoose, i.e. you should not have
to change already implemented business code, in order to have permissions checked.

### Queries
Queries are automatically decorated with conditions as defined in the model's
policy. Queries will always only return documents that the current user has
permission to read.

### Create / Update / Remove
Each of these operations are automatically intercepted and permissions are tested
before the operation is executed. The provided callback is called with an error
if the current user has insufficient permissions.

### Defining a Policy
A policy can be defined per model and per permission (create, read, update,
remove). This is done by providing rules. A rule might be any of the following:

- a boolean value (true if the permission is to be granted, false otherwise)
- a mongodb query object (see [here](http://docs.mongodb.org/manual/tutorial/query-documents/))
- a promise resolving to any of the above
- a function returning any of the above

All provided rules for the same model and permission are ```or```-combined when
evaluated, i.e. the permission is granted if **any** of the provided conditions
are met.

### Parameters
When using functions to return rules (see above), a parameters object is passed
in as the only argument. The parameters object contains the following properties:

- **target**: the document that is being tested (for create, update and delete
  permissions only).
- **user defined**: user defined parameters can be provided using the following
  method:
  ```javascript
  var security = require('mongoose-model-security');

  security.addModelProvider(function() {
    var myValue;
    return {
      myParam: myValue
    };
  });
  ```
  All defined model providers will be called before the rules are evaluated.

## Current Limitations
- Permissions are not checked for all `#find[*]And[Remove|Update]` methods on both
  `model` and `query` as well as `Model.update`. This is due to the fact that mongoose middleware is not
  called for these methods (see [here](http://mongoosejs.com/docs/middleware.html)).

## License
Copyright (c) 2015 Thomas Forrer

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
