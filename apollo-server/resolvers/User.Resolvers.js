const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

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

module.exports = {
  Query: {
    user: (parent, { _id }, { requester, loaders: { User } }, info) => {
      if (!requester) throw new ForbiddenError("Not allowed");
      return User.load(_id);
    },
    users: (parent, args, { requester, models: { User } }, info) =>
      !requester ? new ForbiddenError("Not allowed") : User.find(),
    me: (parent, args, { requester, loaders: { User } }, info) =>
      !requester ? new ForbiddenError("Not allowed") : User.load(requester._id),
  },
  Mutation: {
    createUser: (parent, { email }, { models: { User } }, info) => {
      return User.create({
        email,
      }).then((user) => {
        if (user) {
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
                to: email,
                subject: "Veneu Account Creation",
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
                }
              });
            } else {
              console.log("MAILER FAILED");
            }
          });
          return global.pubsub.publish(eventName.USER_CREATED, { userCreated: user }).then((done) => {
            return user;
          });
        } else {
          return null;
        }
      });
    },
    updateUser(parent, { _id, ...patch }, { requester, models: { User } }, info) {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return User.findOneAndUpdate({ _id }, patch, { new: true }).then((user) => {
        return global.pubsub.publish(eventName.USER_UPDATED, { userUpdated: user }).then((done) => {
          return user;
        });
      });
    },
    deleteUser: (parent, { _id }, { requester, models: { User } }, info) => {
      if (!requester || requester._id != _id) throw new ForbiddenError("Not allowed");
      return User.findOne({ _id })
        .then((user) => user.deleteOne())
        .then((user) => {
          return global.pubsub.publish(eventName.USER_DELETED, { userDeleted: user }).then((done) => {
            return user;
          });
        });
    },
    login(parent, { email, password }, { models: { User } }, info) {
      return User.findOne({ email }).then((user) => {
        if (!user) throw new AuthenticationError("Bad credentials");
        return bcrypt.compare(password, user.password).then((hash) => {
          if (!hash) throw new AuthenticationError("Bad credentials");
          return jwt.sign({ _id: user._id }, process.env.JWTAUTH_KEY);
        });
      });
    },
    firstLogin(parent, { access_code, password, first_name, last_name }, { models: { User } }, info) {
      return bcrypt.hash(password, saltRounds).then((hash) => {
        return User.updateOne(
          { access_code },
          {
            first_name: first_name,
            last_name: last_name,
            password: hash,
            access_code: null,
            active: true,
          },
          { new: true }
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
      subscribe: () => global.pubsub.asyncIterator([eventName.USER_CREATED]),
    },
    userUpdated: {
      subscribe: () => global.pubsub.asyncIterator([eventName.USER_UPDATED]),
    },
    userDeleted: {
      subscribe: () => global.pubsub.asyncIterator([eventName.USER_DELETED]),
    },
  },
  User: {
    notifications: (parent, args, { loaders: { Notification } }, info) => Notification.loadMany(parent.notifications),
    auths: (parent, args, { loaders: { Auth } }, info) => Auth.loadMany(parent.auths),
    name: (parent, args, context, info) => parent.first_name + " " + parent.last_name,
  },
};
