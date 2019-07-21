const util = require('util');


function AuthError(message) {
  this.message = message;
  Error.captureStackTrace(this, AuthError);
}
util.inherits(AuthError, Error);
AuthError.prototype.name = 'AuthError';


global.AuthError = AuthError;
