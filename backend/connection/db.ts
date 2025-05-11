import { Pool, QueryResult, QueryResultRow } from 'pg';

const local_pool = new Pool({
	host: process.env.LOCAL_DATABASE_HOST || 'localhost',
	port: parseInt(process.env.LOCAL_DATABASE_PORT || '5432', 10),
	user: process.env.LOCAL_DATABASE_USER,
	password: process.env.LOCAL_DATABASE_PASSWORD,
	database: process.env.LOCAL_DATABASE_NAME,
  });

const cloud_pool = new Pool({
	host: process.env.CLOUD_DATABASE_HOST || 'localhost',
	port: parseInt(process.env.CLOUD_DATABASE_PORT || '5433', 10),
	user: process.env.CLOUD_DATABASE_USER,
	password: process.env.CLOUD_DATABASE_PASSWORD,
	database: process.env.CLOUD_DATABASE_NAME,
	ssl: {
		rejectUnauthorized: false  // To allow self-signed certificates (or set up a CA cert if you want full validation)
	  }
  });

export const pool = (process.env.USE_DATABASE == 'LOCAL') ? local_pool : cloud_pool;

export const query = <T extends QueryResultRow>(text: string, params: any[]): Promise<QueryResult<T>> => {
	return pool.query<T>(text, params);
};

