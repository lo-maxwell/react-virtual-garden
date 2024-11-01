import { Pool, QueryResult, QueryResultRow } from 'pg';

export const pool = new Pool({
	host: process.env.DATABASE_HOST || 'localhost',
	port: parseInt(process.env.DATABASE_PORT || '5432', 10),
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
  });

export const query = <T extends QueryResultRow>(text: string, params: any[]): Promise<QueryResult<T>> => {
	return pool.query<T>(text, params);
};