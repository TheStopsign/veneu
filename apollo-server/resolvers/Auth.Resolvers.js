const { ForbiddenError, withFilter, UserInputError } = require("apollo-server-express");
const { readOne, crudFunnel } = require("../crudHandlers");

const hbs = require("nodemailer-express-handlebars");

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";
const { GMAIL_OAUTH_ID, GMAIL_OAUTH_SECRET, GMAIL_OAUTH_REFRESH, GMAIL } = process.env;
const oauth2Client = new OAuth2(GMAIL_OAUTH_ID, GMAIL_OAUTH_SECRET, OAUTH_PLAYGROUND);

const eventName = {
  AUTH_CREATED: "AUTH_CREATED",
  AUTH_UPDATED: "AUTH_UPDATED",
  AUTH_DELETED: "AUTH_DELETED",
};

module.exports = (pubsub, caches) => ({
  Query: {
    auth: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Auth", "findOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
    auths: async (parent, args, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      let ids = args.shared_resource
        ? requester.auths.filter((a) => a.shared_resource == args.shared_resource).map((a) => a._id)
        : requester.auths.map((a) => a._id);
      return crudFunnel("Auth", "find", { _id: { $in: ids } }, ids, { models, loaders, pubsub, caches });
    },
  },
  Mutation: {
    createAuth: async (
      parent,
      { role, user, shared_resource, shared_resource_type },
      { requester, models, loaders, pubsub, caches },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ email: user, type: "User" }, { requester, models, loaders, pubsub }).then(async (x) => {
        if (x) {
          const existingAuth = await readOne(
            { user: x._id, shared_resource, shared_resource_type, type: "Auth" },
            { requester, models, loaders, pubsub }
          );
          return existingAuth
            ? crudFunnel("Auth", "updateOne", [{ _id: existingAuth._id }, { role }], existingAuth._id, {
                models,
                loaders,
                pubsub,
                caches,
              })
            : crudFunnel(
                "Auth",
                "create",
                { role, user: x._id, shared_resource, shared_resource_type, type: "Auth" },
                null,
                { models, loaders, pubsub, caches }
              );
        } else {
          return crudFunnel("User", "create", { email: user, type: "User" }, null, {
            models,
            loaders,
            pubsub,
            caches,
          }).then((y) => {
            if (y) {
              return crudFunnel(
                shared_resource_type,
                "findOne",
                { _id: shared_resource, type: shared_resource_type },
                shared_resource,
                { models, loaders, pubsub, caches }
              ).then((z) => {
                oauth2Client.setCredentials({
                  refresh_token: GMAIL_OAUTH_REFRESH,
                });
                let finishedEmail = new Promise((resolve, reject) => {
                  oauth2Client.getAccessToken((err, accessToken) => {
                    if (err) {
                      console.log("OATH2CLIENT GETACCESSTOKEN ERROR:", err);
                      crudFunnel("User", "deleteOne", { _id: y._id }, y._id, { models, loaders, pubsub, caches }).then(
                        (a) => {
                          reject(null);
                        }
                      );
                    } else {
                      var transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                          type: "OAuth2",
                          user: GMAIL,
                          clientId: GMAIL_OAUTH_ID,
                          clientSecret: GMAIL_OAUTH_SECRET,
                          refreshToken: GMAIL_OAUTH_REFRESH,
                          accessToken,
                        },
                      });

                      if (transporter) {
                        transporter.use(
                          "compile",
                          hbs({
                            viewEngine: {
                              extName: ".handlebars",
                              partialsDir: "./apollo-server/email_templates/",
                              layoutsDir: "./apollo-server/email_templates/",
                              defaultLayout: "",
                            },
                            viewPath: "./apollo-server/email_templates/",
                            extName: ".handlebars",
                          })
                        );
                        var mailOptions = {
                          from: GMAIL,
                          to: user,
                          subject: "You have been added to a Veneu course",
                          template: "newAuth",
                          context: {
                            url: process.env.BASE_URL + "firstlogin/" + y.access_code,
                            role: role.toLowerCase(),
                            type: shared_resource_type.toLowerCase(),
                            course: z.name,
                            instructor: requester.first_name + " " + requester.last_name,
                          },
                          attachments: [
                            {
                              filename: "venue-logo.png",
                              path: "./apollo-server/email_templates/venue-logo.png",
                              cid: "logo",
                            },
                          ],
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                          if (error || info == null) {
                            console.log(error);
                            crudFunnel("User", "deleteOne", { _id: y._id }, y._id, {
                              models,
                              loaders,
                              pubsub,
                              caches,
                            }).then((a) => {
                              reject(null);
                            });
                          } else {
                            resolve({ role, user: y._id, shared_resource, shared_resource_type, type: "Auth" });
                          }
                        });
                      } else {
                        console.log("MAILER FAILED");
                        crudFunnel("User", "deleteOne", { _id: y._id }, y._id, {
                          models,
                          loaders,
                          pubsub,
                          caches,
                        }).then((a) => {
                          reject(null);
                        });
                      }
                    }
                  });
                });
                return finishedEmail
                  .then((authInfo) => crudFunnel("Auth", "create", authInfo, null, { models, loaders, pubsub, caches }))
                  .catch((e) => null);
              });
            } else {
              return null;
            }
          });
        }
      });
    },
    updateAuth: async (parent, { _id, role }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Auth", "updateOne", [{ _id }, { role }], _id, {
        models,
        loaders,
        pubsub,
        caches,
      });
    },
    deleteAuth: async (parent, { _id }, { requester, models, loaders, pubsub, caches }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return crudFunnel("Auth", "deleteOne", { _id }, _id, { models, loaders, pubsub, caches });
    },
  },
  Subscription: {
    authCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([eventName.AUTH_CREATED]),
        (payload, variables) => payload.resource.user == variables.user
      ),
      resolve: (payload, variables, context, info) => payload.resource,
    },
  },
  Auth: {
    user: async (parent, args, { models, loaders, pubsub, caches }, info) =>
      crudFunnel("User", "findOne", { _id: parent.user }, parent.user, { models, loaders, pubsub, caches }),
    shared_resource: async (parent, args, { models, loaders, pubsub, caches }, info) => {
      return crudFunnel(
        parent.shared_resource_type,
        "findOne",
        { _id: parent.shared_resource },
        parent.shared_resource,
        {
          models,
          loaders,
          pubsub,
          caches,
        }
      );
    },
  },
});
