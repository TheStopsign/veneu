const { ForbiddenError, withFilter } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

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

module.exports = (pubsub) => ({
  Query: {
    auth: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ _id, type: "Auth" }, { requester, models, loaders, pubsub });
    },
    auths: async (parent, args, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return args.shared_resource
        ? readMany({ shared_resource: args.shared_resource, type: "Auth" }, { requester, models, loaders, pubsub })
        : requester.auths;
    },
  },
  Mutation: {
    createAuth: async (
      parent,
      { role, user, shared_resource, shared_resource_type },
      { requester, models, loaders, pubsub },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return readOne({ email: user, type: "User" }, { requester, models, loaders, pubsub }).then((x) => {
        if (x) {
          return createOne(
            { role, user: x._id, shared_resource, shared_resource_type, type: "Auth" },
            { requester, models, loaders, pubsub }
          );
        } else {
          return createOne({ email: user, type: "User" }, { requester, models, loaders, pubsub }).then((y) => {
            if (y) {
              return readOne(
                { _id: shared_resource, type: shared_resource_type },
                { requester, models, loaders, pubsub }
              ).then((z) => {
                oauth2Client.setCredentials({
                  refresh_token: GMAIL_OAUTH_REFRESH,
                });
                let finishedEmail = new Promise((resolve, reject) => {
                  oauth2Client.getAccessToken((err, accessToken) => {
                    if (err) {
                      console.log("OATH2CLIENT GETACCESSTOKEN ERROR:", err);
                      deleteOne({ email: user, type: "User" }, { requester, models, loaders, pubsub });
                      reject(null);
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
                            deleteOne({ email: user, type: "User" }, { requester, models, loaders, pubsub });
                            reject(null);
                          } else {
                            resolve({ role, user: y._id, shared_resource, shared_resource_type, type: "Auth" });
                          }
                        });
                      } else {
                        console.log("MAILER FAILED");
                        deleteOne({ email: user, type: "User" }, { requester, models, loaders, pubsub });
                        reject(null);
                      }
                    }
                  });
                });
                return finishedEmail
                  .then((authInfo) => createOne(authInfo, { requester, models, loaders, pubsub }))
                  .catch((e) => null);
              });
            } else {
              return null;
            }
          });
        }
      });
    },
    updateAuth: async (parent, { _id, role }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "Auth" }, { role });
    },
    deleteAuth: async (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "Auth" });
    },
  },
  Subscription: {
    authCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([eventName.AUTH_CREATED]),
        (payload, variables) => payload.authCreated.user == variables.user
      ),
      resolve: (payload, variables, context, info) => payload.authCreated,
    },
  },
  Auth: {
    user: async (parent, args, { loaders: { User } }, info) => User.load(parent.user),
    shared_resource: async (parent, args, { loaders }, info) =>
      loaders["" + parent.shared_resource_type].load(parent.shared_resource),
  },
});
