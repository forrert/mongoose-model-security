# mongoose-model-security

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
  
