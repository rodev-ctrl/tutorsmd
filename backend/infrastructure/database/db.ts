// MONG0

/*
const { MongoClient } = require('mongodb');

// let URL = "mongodb+srv://jemand:123@cluster3.zrkulg8.mongodb.net/postsbox?retryWrites=true&w=majority";

let URL = "mongodb+srv://jemand:123@cluster3.zrkulg8.mongodb.net/postsbox?retryWrites=true&w=majority&appName=Cluster3";

let dbConnection;
module.exports = {
	connectionToDb: (cb) => {
       MongoClient
          .connect(URL, {useNewUrlParser: true, useUnifiedTopology: true})
          .then((client) => {
			console.log(URL);
			console.log("etwas AAAAAAAAAA");
          	console.log('Connected to MongoDB');
          	dbConnection = client.db();
          	return cb();
          })
          .catch((err) => {
			console.log(URL);
			console.log("etwas AAAAAAAAAA");
          	return cb(err);
          })
	},
	getDb: () => {return dbConnection},
}
*/






// POSTGRES
//const Pool = require('pg').Pool;   // 'pg' - PostgresSql
                                   // Pool - клас
                                   import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions:
      process.env.NODE_ENV === "production"
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : undefined,
  }
);

// module.exports = pool;
// export default pool;


