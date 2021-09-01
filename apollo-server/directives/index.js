const AuthDirective = require("./Auth.Directive");
const { createRateLimitDirective } = require("graphql-rate-limit");

module.exports = {
  auth: AuthDirective,
  rateLimit: createRateLimitDirective({ identifyContext: (ctx) => (ctx.requester ? ctx.requester._id : null) }),
};
