import postgres from "postgres";

const sql = postgres(process.env.NEON_DB_CONNECTION_STRING!, {
  ssl: "require",
});

export default sql;