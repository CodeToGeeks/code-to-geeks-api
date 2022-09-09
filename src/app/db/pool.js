"use strict"
const { Pool } = require("pg");

const db_config = {
 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 850,
  idleTimeoutMillis: 200,
  max: 12,
  
};

const pool = new Pool(db_config);
/*
pool.on("connect", (client) => {
  console.log("Connected to Postgresql..");
});

pool.on("remove", (client) => {
  console.log("DB connection remove ..");
});
*/
pool.on("error", (err, client) => {
  console.log("DB connection error ..", err);
});

module.exports = pool;
