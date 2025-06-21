import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432, // Adjust if necessary
  ssl: {
    rejectUnauthorized: false
  }
});


// Define allowed tables and their corresponding columns
const allowedTables = {
  action_histories: ["id", "owner", "identifier", "quantity"],
  gardens: ["id", "owner", "rows", "columns"],
  icons: ["id", "name", "icon"],
  inventories: ["id", "owner", "gold"],
  inventory_items: ["id", "owner", "identifier", "quantity"],
  item_histories: ["id", "owner", "identifier", "quantity"],
  levels: ["id", "owner_uuid", "owner_uid", "owner_type", "total_xp", "growth_rate"],
  placed_items: ["id", "owner", "identifier", "status"],
  plots: ["id", "owner", "row_index", "col_index", "plant_time", "uses_remaining", "random_seed"],
  store_items: ["id", "owner", "identifier", "quantity"],
  stores: ["id", "owner", "identifier", "last_restock_time_ms"],
  users: ["id", "username", "password_hash", "password_salt", "icon"], //Disallow password hash/salt select statements?
  toolboxes: ["id", "owner"],
  tools: ["id", "owner", "identifier"],
  // Add more tables and their columns as needed
};

// Define allowed operators
const allowedOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"];

export const handler = async (event) => {
  const { queries } = event; // Updated to accept queries object

  // Validate input
  if (!Array.isArray(queries) || queries.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid queries input' })
    };
  }

  const results = []; // Array to hold results from each query

  // Helper function to process a single query
  const processQuery = async (query) => {
    const { tableName, conditions, limit } = query; // Added limit to the destructured query

    // Validate table name
    if (!allowedTables.hasOwnProperty(tableName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Invalid table name: ${tableName}` })
      };
    }

    // Validate conditions
    if (!conditions || Object.keys(conditions).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Conditions are required for delete operation' })
      };
    }

    // Construct the count query to check how many rows would be deleted
    let countQueryString = `SELECT COUNT(*) FROM ${tableName}`;
    const countQueryParams = [];

    const conditionStrings = Object.keys(conditions).map((key, index) => {
        const { operator, value } = conditions[key]; // Extract operator and value from the condition object
        
        // Validate operator
        if (!allowedOperators.includes(operator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }

        // Validate key against allowed columns for the specific table
        if (!allowedTables[tableName].includes(key)) {
            throw new Error(`Invalid column: ${key} for table: ${tableName}`);
        }

        if (operator === 'IN') {
          // Create placeholders for each value in the array
          const placeholders = value.map((_, idx) => `$${queryParams.length + idx + 1}`).join(', ');
          queryParams.push(...value); // Add all values to queryParams
          return `${key} IN (${placeholders})`; // Use the placeholders in the query
        } else {
            queryParams.push(value); // Add the single value to queryParams
            return `${key} ${operator} $${queryParams.length}`; // Use parameterized query for the value
        }
    });
    countQueryString += ` WHERE ${conditionStrings.join(' AND ')};`; // Add WHERE clause

    // Check how many rows would be deleted
    const countResult = await pool.query(countQueryString, countQueryParams);
    const rowCount = parseInt(countResult.rows[0].count, 10);

    // Check if the row count exceeds the limit
    if (limit && rowCount > limit) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Delete operation would affect ${rowCount} rows, exceeding the limit of ${limit}.` })
        };
    }

    // Construct the delete query
    let queryString = `DELETE FROM ${tableName}`;
    const queryParams = [];

    const deleteConditionStrings = Object.keys(conditions).map((key, index) => {
        const { operator, value } = conditions[key]; // Extract operator and value from the condition object
        
        // Validate operator
        if (!allowedOperators.includes(operator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }

        // Validate key against allowed columns for the specific table
        if (!allowedTables[tableName].includes(key)) {
            throw new Error(`Invalid column: ${key} for table: ${tableName}`);
        }

        queryParams.push(value);
        return `${key} ${operator} $${index + 1}`; // Use parameterized queries for values
    });
    queryString += ` WHERE ${deleteConditionStrings.join(' AND ')};`; // Add WHERE clause

    try {
        const result = await pool.query(queryString, queryParams);
        return { tableName, deletedCount: result.rowCount }; // Return count of deleted rows
    } catch (error) {
        console.error('Error executing query:', error);
        return { 
            tableName, 
            error: `Query ${queryString} failed: ${error.message}` // Return detailed error message for this query
        };
    }
  };

  // Process each query
  for (const query of queries) {
    const result = await processQuery(query);
    results.push(result); // Always push the result, whether it's a success or an error
  }

  // Return all results if there are multiple queries
  return {
    statusCode: 200,
    body: JSON.stringify(results) // Return all results
  };
};