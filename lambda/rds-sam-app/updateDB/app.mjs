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
  user_events: ["id", "owner", "event_type", "streak", "created_at"],
  event_rewards: ["id", "owner", "inventory", "gold", "message"],
  event_reward_items: ["id", "owner", "identifier", "quantity"],
  // Add more tables and their columns as needed
};

// Define allowed operators
const allowedOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "+", "-", "*", "/"];

// Function to construct the update query string and parameters
const constructUpdateQuery = (tableName, values, conditions, returnColumns) => {
    const queryParams = [];

    // Construct the set clause and populate queryParams with values
    const setClause = Object.keys(values).map((key) => {
        // Check if the value is an object with an operator
        if (typeof values[key] === 'object' && values[key].operator) {
            // Validate operator
            if (!allowedOperators.includes(values[key].operator)) {
                throw new Error(`Invalid operator: ${values[key].operator}`);
            }
            // Use the current value in the database for the calculation
            queryParams.push(values[key].value);
            return `${key} = ${key} ${values[key].operator} $${queryParams.length}`; // Use parameterized query
        } else {
            queryParams.push(values[key]); // Push the value for the column into queryParams
            return `${key} = $${queryParams.length}`; // Use parameterized query
        }
    }).join(', ');

    // Construct the initial query string
    let queryString = `UPDATE ${tableName} SET ${setClause}`; // Initial query string

    // Add conditions if provided
    const conditionStrings = Object.keys(conditions).map((key) => {
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
    queryString += ` WHERE ${conditionStrings.join(' AND ')}`;

    queryString += ` RETURNING ${returnColumns.join(', ')};`; // Append RETURNING clause

    return { queryString, queryParams };
};

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

  // Update the processUpdateQuery function to use constructUpdateQuery
  const processUpdateQuery = async (query) => {
    const { tableName, values, returnColumns, conditions } = query;

    // Validate table name
    if (!allowedTables.hasOwnProperty(tableName)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Invalid table name: ${tableName}` })
        };
    }

    // Validate values
    if (typeof values !== 'object' || Object.keys(values).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid values for update' })
        };
    }

    // Validate returnColumns
    if (!Array.isArray(returnColumns) || returnColumns.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid return columns' })
        };
    }

    // Validate return columns against allowed list for the specific table
    for (const column of returnColumns) {
        if (!allowedTables[tableName].includes(column)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid return column: ${column} for table: ${tableName}` })
            };
        }
    }

    // Validate values keys against allowed columns for the specific table
    for (const key of Object.keys(values)) {
        if (!allowedTables[tableName].includes(key)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid update column: ${key} for table: ${tableName}` })
            };
        }
    }

    // Validate conditions
    if (!conditions || Object.keys(conditions).length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'At least one condition is required for the update' })
        };
    }

    // Use the new function to construct the query
    const { queryString, queryParams } = constructUpdateQuery(tableName, values, conditions, returnColumns);

    try {
        const result = await pool.query(queryString, queryParams);
        return { tableName, rows: result.rows }; // Return result for this query
    } catch (error) {
        console.error('Error executing update query:', error);
        return { 
            tableName, 
            error: `Update query failed: ${error.message}` // Return detailed error message for this query
        };
    }
  };

  // Process each query
  for (const query of queries) {
    const result = await processUpdateQuery(query);
    results.push(result); // Always push the result, whether it's a success or an error
  }

  // Return all results if there are multiple queries
  return {
    statusCode: 200,
    body: JSON.stringify(results) // Return all results
  };
};