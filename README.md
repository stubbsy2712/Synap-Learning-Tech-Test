Database Used: MongoDB
Additional libraries used: mongodb, @types/mongodb
Time spent: 3 hours on code. Far more on research.

## Trade-offs and improvements to be made:
- A relationship should be added between between questions and quizzes.
- A proper `.env` file should be added to contain the mongo URI, database name, password, etc.

## To Run:

Run a local mongoDB instance or change the contents of `db.ts` to connect to an existing one, it is currently configured like so:

```
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME ?? "Synap-Tech-Test";
```

```
npm install
npm run build
npm run start
```

To run in debug:
```
npm install
npm run debug
```