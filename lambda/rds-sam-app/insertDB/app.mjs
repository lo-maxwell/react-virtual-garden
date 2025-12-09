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
  goose_pens: ["id", "owner", "size"],
  gooses: ["id", "owner", "name", "color", "birthday", "attributes"],
  item_details: ["id", "placed_item_id", "inventory_item_id", "details"],
  // Add more tables and their columns as needed
};

// Define allowed operators
const allowedUpdateOperators = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "+", "-", "*", "/"];


// Function to construct the update query string and parameters
// --- Construct UPDATE clause for non-JSONB operators only ---
const constructUpdateQuery = (tableName, values, conditions, numExistingParams = 0) => {
  const queryParams = [];

  for (const key of Object.keys(values)) {
    const val = values[key];
    // Disallow any JSONB operator
    if (val && typeof val === "object" && "operator" in val) {
      const jsonbOps = ["jsonb_set", "jsonb_inc", "jsonb_mul", "jsonb_remove"];
      if (jsonbOps.includes(val.operator)) {
        throw new Error(`JSONB modification is disallowed in ON CONFLICT for column "${key}"`);
      }
    }
  }

  const setClause = Object.keys(values).map((key) => {
    const val = values[key];
    if (typeof val === 'object' && val !== null && val.operator) {
      queryParams.push(val.value);
      return `${key} = ${tableName}.${key} ${val.operator} $${queryParams.length + numExistingParams}`;
    } else {
      queryParams.push(val);
      return `${key} = $${queryParams.length + numExistingParams}`;
    }
  }).join(', ');

  const conditionStrings = Object.keys(conditions || {}).map((key) => {
    const { operator, value } = conditions[key];
    if (!allowedUpdateOperators.includes(operator)) throw new Error(`Invalid operator: ${operator}`);
    if (!allowedTables[tableName].includes(key)) throw new Error(`Invalid column: ${key} for table: ${tableName}`);

    if (operator === 'IN') {
      const placeholders = value.map((_, idx) => `$${queryParams.length + idx + 1 + numExistingParams}`).join(', ');
      queryParams.push(...value);
      return `${tableName}.${key} IN (${placeholders})`;
    } else {
      queryParams.push(value);
      return `${tableName}.${key} ${operator} $${queryParams.length + numExistingParams}`;
    }
  });

  let queryString = setClause;
  if (conditionStrings.length > 0) queryString += ` WHERE ${conditionStrings.join(' AND ')}`;

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

  // Helper function to process a single insert query
  const processInsertQuery = async (query) => {
    const { tableName, columnsToWrite, values, conflictColumns, returnColumns, conflictIndex, updateQuery } = query;

    // Validate table name
    if (!allowedTables.hasOwnProperty(tableName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Invalid table name: ${tableName}` })
      };
    }

    // Validate columnsToWrite and values
    if (!Array.isArray(columnsToWrite) || columnsToWrite.length === 0 || !Array.isArray(values) || values.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid columns or values for insert' })
      };
    }

    // Validate columns to write against allowed list for the specific table
    for (const column of columnsToWrite) {
      if (!allowedTables[tableName].includes(column)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: `Invalid column: ${column} for table: ${tableName}` })
        };
      }
    }

    // Validate conflictColumns
    if (conflictColumns && (!Array.isArray(conflictColumns))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid conflict columns' })
      };
    }
    if (conflictColumns && conflictColumns.length > 0) {
      // Validate conflict columns against allowed list for the specific table
      for (const column of conflictColumns) {
        if (!allowedTables[tableName].includes(column)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: `Invalid conflict column: ${column} for table: ${tableName}` })
          };
        }
      }
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

    // Construct the insert query for batch insertion
    let queryString = `
      INSERT INTO ${tableName} (${columnsToWrite.join(', ')}) 
      VALUES ${values.map((_, rowIndex) => `(${columnsToWrite.map((_, colIndex) => `$${rowIndex * columnsToWrite.length + colIndex + 1}`).join(', ')})`).join(', ')}
    `;

    // Flatten the values for parameterized query
    const queryParams = values.flat();

    // Handle onConflict parameter
    if (conflictColumns.length > 0) {
      queryString += `ON CONFLICT (${conflictColumns.join(', ')}) `
      if (conflictIndex) {
        //TODO: This is probably redundant, any conflictIndex will be not null
        //TODO: This can only take in a single conflictIndex
        queryString += `WHERE ${conflictIndex} IS NOT NULL `
      }
      if (updateQuery) {
        // Use the new updateQuery parameter to construct the update query
        const { values: updateValues, conditions: updateConditions } = updateQuery; // Extract updateQuery details
        const { queryString: updateQueryString, queryParams: updateQueryParams } = constructUpdateQuery(tableName, updateValues, updateConditions, queryParams.length); // Construct the update query
        queryString += `DO UPDATE SET ${updateQueryString} `;
        // Append the parameters for the update query
        queryParams.push(...updateQueryParams);
      } else {
        queryString += `DO NOTHING `;
      }
    }

    // Add RETURNING clause
    queryString += `RETURNING ${returnColumns.join(', ')};`;


    try {
      const result = await pool.query(queryString, queryParams);
      return { tableName, rows: result.rows }; // Return result for this query
    } catch (error) {
      console.error('Error executing insert query:', error);
      return { 
        tableName, 
        error: `Insert query failed: ${error.message}` // Return detailed error message for this query
      };
    }
  };

  // Process each query
  for (const query of queries) {
    const result = await processInsertQuery(query);
    results.push(result); // Always push the result, whether it's a success or an error
  }

  // Return all results if there are multiple queries
  return {
    statusCode: 200,
    body: JSON.stringify(results) // Return all results
  };
};