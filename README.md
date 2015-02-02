# mongoose-model-security

[![Build Status](https://travis-ci.org/forrert/mongoose-model-security.svg?branch=master)](https://travis-ci.org/forrert/mongoose-model-security)

Simple data driven access control layer for [mongoose](https://github.com/LearnBoost/mongoose).

## Mongoose Security Made Easy
1. Define a policy for each of your models
  ```javascript
  var security = require('mongoose-model-security');
  
  security.buildPolicy().model('MyModel').
    read({someProperty: 'someValue'}).
    write(function() {
      // some complicated logic...
      if (satisfied) {
        return true;
      } else {
        return false;
      }
    }).
    write({someOtherProperty: {$in: ['value1', 'value2']}}).
    delete(false).
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
      // write conditions from the policy file are met
    });
  });
  ```
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
