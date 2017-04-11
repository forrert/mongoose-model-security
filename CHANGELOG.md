# Changelog

## 2.0.0 (Apr 10, 2017)
- support latest mongoose version
- refactor query hook to use built-in mongoose hooks
- removed support for templates in rules

## 1.0.0 (Mar 30, 2015)
- main module (security) is not a singleton anymore, but can be and must be
  instantiated, providing a mongoose instance. Any security related operations
  should be done on this instance.
- policy files loaded by ```security#loadPolicy``` must now export a function
  taking the ```security``` instance as the only parameter
- introduce field level read permissions ([PR](https://github.com/forrert/mongoose-model-security/pull/1))
- some refactorings around query hook

## 0.0.4 (Feb 25, 2015)
- update some dependencies

## 0.0.3 (Feb 3, 2015)
- bug fixes

## 0.0.2 (Feb 2, 2015)
- API changes:
    - renamed permissions to ```create, read, update, remove```
    - changed ```security#buildPolicy()``` to ```security#buildPolicy(modelName)```,
      now directly returns model's policy builder.

## 0.0.1 (Jan 31, 2015)
- initial beta release
