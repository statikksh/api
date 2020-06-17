### Statikk API

:zap: The Statikk backend API server.

#### Features

- :closed_lock_with_key: Users can create an account and authenticate.
- :card_index_dividers: Authenticated users can list, create, update and delete projects.
- :hammer_and_wrench: Authenticated users can run builds manually. (*requires [build server](https://github.com/statikksh/builder) and RabbitMQ*)

#### Technologies

###### Language & Runtime

- :rocket: [**NodeJS**](https://nodejs.org) - Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. (*JavaScript Runtime*)
- :blue_book: [**TypeScript**](https://typescriptlang.org) - TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. (*Programming Language*)

###### General Services & Tools

- :hammer_and_wrench: [**Git**](https://git-scm.com/) - Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency. (*Version Control System*)
- :cat: [**Yarn**](https://classic.yarnpkg.com/en/docs/install) - Fast, reliable, and secure dependency management. (*Package Manager*)
- :elephant: [**PostgreSQL**](https://postgresql.org) - A object-relational database system that provides reliability and data integrity. (*Database*)
- :rabbit: [**RabbitMQ**](https://rabbitmq.com/) - RabbitMQ is an open source multi-protocol messaging broker.

###### Libraries

- :leopard: [**Fastify**](https://fastify.io) - Fast and low overhead web framework, for Node.js. (*HTTP framework*)
- :floppy_disk: [**Prisma**](https://prisma.io) - Modern DB toolkit to query, migrate and model your database. (*Database ORM*)

#### Getting Started

##### Getting the source

Open your terminal and execute the following command.

```sh
$ git clone https://github.com/statikksh/api.git && cd api
```

##### Downloading dependencies

Inside the project directory, download project dependencies with **Yarn**.

```sh
$ yarn
```

##### Setup environment variables

###### Prisma environment file

Inside `prisma` directory, create a new `.env` (`prisma/.env`) file and copy the following content to it.

```ini
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#using-environment-variables

# Prisma supports the native connection string format for PostgreSQL, MySQL and SQLite.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/statikk?schema=public"
```

> :memo: Replace `DATABASE_URL` with the connection URL of your database.

###### Project environment file

After that, create a new file called `.env` at project root. You can copy all contents from `.env.example` and edit it as you like.

##### Running Migrations

```sh
$ yarn prisma up --experimental
```

##### Building the project

```sh
# As the project uses Prisma, a type-safe code generated Database ORM,
# You need to generate Prisma ORM souces with the following command.
$ yarn prisma generate

# Then, compile the TypeScript source code into Node JavaScript.
$ yarn build
```

##### Running the API server

After configuring all steps above, you can start the API server by running the following command inside your terminal.

```
$ yarn start 
```
