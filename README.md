# veneu

<p align="center"><img src="https://raw.githubusercontent.com/TheStopsign/veneu/main/src/assets/veneu-logo.svg" alt="alt text" width="96" height="96"></p>

## About

Veneu has goals to be the go-to solution for both synchronous and asynchronous education, in the classroom or from home.
Want to contribute? Checkout out our [Contributing](./CONTRIBUTING.md)

## Local Development Setup

### 1) Prerequisites

- `node`/`npm` installed
- a runnable `mongod` client (remember to configure the `/data/db` folder)
- a gmail address set-up with OAuth2 (we use email verification on all account creations and invites).
  - <a href="https://levelup.gitconnected.com/multi-purposes-mailing-api-using-nodemailer-gmail-google-oauth-28de49118d77">Follow the first two steps here to acquire your client ID, client secret, and refresh token</a>

### 2) Installation

1. Clone the repository
2. Run `npm install` in the project's root directory

- Should any errors occur during installation, try running `npm update` in both the `/` and `/apollo-server` directories, and retrying step 2

  Note: Occasionally, `npm install` needs to be run in the `/apollo-server` directory as well, however the root package's `postinstall` should handle it for us.

### 3) Environment

1. Create a `variables.env` file in the root directory (`/variables.env`)
2. Add the following entries to the file you just created, replacing `<XYZ>` with the described item

- BASE_URL="`http://localhost:8080/`"
- DB_URL="`mongodb://localhost:27017/veneu?readPreference=primary&appname=MongoDB%20Compass&ssl=false`"
- GMAIL_OAUTH_ID="`<Client ID for Gmail OAuth>`"
- GMAIL_OAUTH_REFRESH="`<Client Refresh token for Gmail OAuth>`"
- GMAIL_OAUTH_SECRET="`<Client Secret for Gmail OAuth>`"
- JWTAUTH_KEY="`<Some 32-character alphanumeric string>`"
- REFRESH_KEY="`<Some 32-character alphanumeric string>`"
- VUE_APP_GRAPHQL_HTTP="`https://localhost:4000/graphql`"
- VUE_APP_GRAPHQL_WS="`wss://localhost:4000/graphql`"

## Running the app

1. Open a new terminal and run `mongod`

... Now the database is running.

2. Open a new terminal at the project's root directory `/` and run `npm run apollo:dev`

... Now the local server is running.

3. Open a new terminal at the project's root directory `/` and run `npm run serve`

... Now the client app is running.

### All set! Navigate to `localhost:8080` in your browser to view the app live.

## References and Docs for Development

- Vue Apollo https://apollo.vuejs.org/guide/
- Vue Apollo https://apollo.vuejs.org/api/
- Quasar https://quasar.dev/
- Apollo / GraphQL https://www.apollographql.com/docs/apollo-server/

<hr/>
Docker commands (UNKNOWN working status, not actively tested)

Build containers: `docker-compose build`

Seed database: `docker-compose run --rm veneu_server node seed.js`

Update docker npm dependencies for server or web: `docker-compose run --rm --no-deps <veneu_server|veneu_web> npm install`

Start docker: `docker-compose up`

Nuke everything: `docker-compose down -v`
