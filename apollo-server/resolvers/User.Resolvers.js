const { AuthenticationError, ForbiddenError } = require("apollo-server-express");
const { createOne, readOne, readMany, updateOne, deleteOne } = require("../crudHandlers");

const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const fs = require("fs");
const hbs = require("nodemailer-express-handlebars");

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";
const { GMAIL_OAUTH_ID, GMAIL_OAUTH_SECRET, GMAIL_OAUTH_REFRESH, GMAIL } = process.env;
const oauth2Client = new OAuth2(GMAIL_OAUTH_ID, GMAIL_OAUTH_SECRET, OAUTH_PLAYGROUND);

const eventName = {
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
};

module.exports = (pubsub) => ({
  Query: {
    user: (parent, { _id }, { requester, models, loaders, pubsub }, info) =>
      !requester
        ? new ForbiddenError("Not allowed")
        : readOne({ _id, type: "User" }, { requester, models, loaders, pubsub }),
    users: (parent, args, { requester, models, loaders, pubsub }, info) =>
      !requester
        ? new ForbiddenError("Not allowed")
        : readMany({ type: "User" }, { requester, models, loaders, pubsub }),
    me: (parent, args, { requester, models, loaders, pubsub }, info) =>
      !requester
        ? new ForbiddenError("Not allowed")
        : readOne({ _id: requester._id, type: "User" }, { requester, models, loaders, pubsub }),
  },
  Mutation: {
    createUser: (parent, { email }, { requester, models, loaders, pubsub }, info) => {
      return createOne(
        {
          email,
          type: "User",
        },
        { requester, models, loaders, pubsub }
      ).then((user) => {
        if (user) {
          oauth2Client.setCredentials({
            refresh_token: GMAIL_OAUTH_REFRESH,
          });
          let finishedEmail = new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, accessToken) => {
              if (err) {
                console.log("OATH2CLIENT GETACCESSTOKEN ERROR:", err);
                deleteOne({ email, type: "User" }, { requester, models, loaders, pubsub });
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
                    to: email,
                    subject: "Veneu - Account Creation",
                    template: "newUser",
                    context: {
                      url: process.env.BASE_URL + "firstlogin/" + user.access_code,
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
                      deleteOne({ email, type: "User" }, { requester, models, loaders, pubsub });
                      reject(null);
                    } else {
                      resolve(user);
                    }
                  });
                } else {
                  console.log("MAILER FAILED");
                  deleteOne({ email, type: "User" }, { requester, models, loaders, pubsub });
                  reject(null);
                }
              }
            });
          });
          return finishedEmail.then((userInfo) => userInfo).catch((e) => null);
        } else {
          return null;
        }
      });
    },
    updateUser(parent, { _id, ...patch }, { requester, models, loaders, pubsub }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return updateOne({ _id, type: "User" }, patch, { requester, models, loaders, pubsub });
    },
    deleteUser: (parent, { _id }, { requester, models, loaders, pubsub }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return deleteOne({ _id, type: "User" }, { requester, models, loaders, pubsub });
    },
    login(parent, { email, password }, { requester, models, loaders, pubsub }, info) {
      return readOne({ email, type: "User" }, { requester, models, loaders, pubsub }).then((user) => {
        if (!user) throw new AuthenticationError("Bad credentials");
        return bcrypt.compare(password, user.password).then((hash) => {
          if (!hash) throw new AuthenticationError("Bad credentials");
          return jwt.sign({ _id: user._id }, process.env.JWTAUTH_KEY);
        });
      });
    },
    firstLogin(parent, { access_code, password, first_name, last_name }, { requester, models, loaders, pubsub }, info) {
      return bcrypt.hash(password, saltRounds).then((hash) => {
        return updateOne(
          { access_code, type: "User" },
          {
            first_name: first_name,
            last_name: last_name,
            password: hash,
            access_code: null,
            active: true,
          },
          { requester, models, loaders, pubsub }
        ).then((user) => {
          if (user) {
            return true;
          }
          return false;
        });
      });
    },
  },
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator([eventName.USER_CREATED]),
    },
    userUpdated: {
      subscribe: () => pubsub.asyncIterator([eventName.USER_UPDATED]),
    },
    userDeleted: {
      subscribe: () => pubsub.asyncIterator([eventName.USER_DELETED]),
    },
  },
  User: {
    notifications: (parent, args, { loaders: { Notification } }, info) => Notification.loadMany(parent.notifications),
    auths: (parent, args, { loaders: { Auth } }, info) => Auth.loadMany(parent.auths),
    name: (parent, args, context, info) => parent.first_name + " " + parent.last_name,
  },
});
