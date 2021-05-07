require("dotenv").config({ path: __dirname + "/../variables.env" });

const http = require("http");
const express = require("express");
const path = require("path");
const cors = require("cors");

const { ApolloServer, PubSub, makeExecutableSchema } = require("apollo-server-express");
global.pubsub = new PubSub();

const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

const typeDefs = require("./schema.graphql");
const resolvers = require("./resolvers");
const context = require("./context");
// const schemaDirectives = require("./directives");

const server = new ApolloServer({
  schema: makeExecutableSchema({
    typeDefs,
    resolvers,
    // schemaDirectives,
    inheritResolversFromInterfaces: true
  }),
  context,
  introspection: process.env.NODE_ENV === "production" ? false : true,
  playground: process.env.NODE_ENV === "production" ? false : true,
  tracing: process.env.NODE_ENV === "production" ? false : true
});

const app = express();
app.use(cors());

if (process.env.NODE_ENV === "production") {
  app.enable("trust proxy");
  app.use(function(request, response, next) {
    if (!request.secure) {
      return response.redirect("https://" + request.headers.host + request.url);
    }
    next();
  });
  app.use(express.static(path.join(__dirname, "..", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"));
  });
}

const httpServer = http.createServer(app);

server.applyMiddleware({ app });
server.installSubscriptionHandlers(httpServer);

httpServer.listen(process.env.PORT || 4000, () => {
  console.log("🚝 Express ready at http://localhost:4000");
  console.log("📈 GraphQL ready at http://localhost:4000" + `${server.graphqlPath}`);
});
