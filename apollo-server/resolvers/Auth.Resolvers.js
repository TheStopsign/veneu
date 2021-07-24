const { PubSub, ForbiddenError, withFilter } = require("apollo-server-express");

const fs = require("fs");
const hbs = require("nodemailer-express-handlebars");
const mongoose = require("mongoose");

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

module.exports = {
  Query: {
    auth: (parent, { _id }, { requester, loaders: { Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.load(_id);
    },
    auths: (parent, args, { requester, models: { Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      if (args.shared_resource) {
        return Auth.find({ shared_resource: args.shared_resource });
      } else {
        return requester.auths;
      }
    },
  },
  Mutation: {
    createAuth: async (
      parent,
      { role, user, shared_resource, shared_resource_type },
      { requester, models: { Auth, User } },
      info
    ) => {
      if (!requester) throw new ForbiddenError("Not allowed");

      return User.findOne({ email: user }).then((x) => {
        if (!x) {
          return User.create({ email: user }).then((y) => {
            if (y) {
              return mongoose
                .model(shared_resource_type)
                .findOne({ _id: shared_resource })
                .then((z) => {
                  oauth2Client.setCredentials({
                    refresh_token: GMAIL_OAUTH_REFRESH,
                  });
                  oauth2Client.getAccessToken((err, accessToken) => {
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
                        }
                      });
                    } else {
                      console.log("MAILER FAILED");
                    }
                  });

                  return Auth.create({ role, user: y._id, shared_resource, shared_resource_type }).then((auth) => {
                    return global.pubsub
                      .publish(eventName.AUTH_CREATED, {
                        authCreated: auth,
                      })
                      .then((done) => {
                        return auth;
                      });
                  });
                });
            } else {
              return null;
            }
          });
        } else {
          return Auth.create({ role, user: x[0]._id, shared_resource, shared_resource_type }).then((auth) => {
            return global.pubsub
              .publish(eventName.AUTH_CREATED, {
                authCreated: auth,
              })
              .then((done) => {
                return auth;
              });
          });
        }
      });
    },
    updateAuth(parent, { _id, role }, { requester, models: { Auth } }, info) {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.findOneAndUpdate(
        { _id },
        { role },
        {
          new: true,
        }
      ).then((auth) => {
        return global.pubsub
          .publish(eventName.AUTH_UPDATED, {
            authUpdated: auth,
          })
          .then((done) => {
            return auth;
          });
      });
    },
    deleteAuth: (parent, { _id }, { requester, models: { Auth } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return Auth.findOne({ _id })
        .then((auth) => auth.deleteOne())
        .then((auth) => {
          return global.pubsub
            .publish(eventName.AUTH_DELETED, {
              authDeleted: auth,
            })
            .then((done) => {
              return auth;
            });
        });
    },
  },
  Subscription: {
    authCreated: {
      subscribe: withFilter(
        () => global.pubsub.asyncIterator([eventName.AUTH_CREATED]),
        (payload, variables) => {
          return payload.authCreated.user == variables.user;
        }
      ),
      resolve: (payload, variables, context, info) => {
        return payload.authCreated;
      },
    },
  },
  Auth: {
    user: async (parent, args, { loaders: { User } }, info) => User.load(parent.user),
    shared_resource: async (parent, args, { loaders }, info) =>
      loaders["" + parent.shared_resource_type].load(parent.shared_resource),
  },
};
