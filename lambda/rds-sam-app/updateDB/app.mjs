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
const allowedOperators = [
    "=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "+", "-", "*", "/",
    "jsonb_set", "jsonb_inc", "jsonb_mul", "jsonb_remove"
];

function buildJsonbOp(columnName, expr, op, paramIndexStart) {
    const params = [];
  
    if (!op.operator || !allowedOperators.includes(op.operator)) {
      throw new Error(`Unsupported JSONB operator: ${op.operator}`);
    }
  
    if (op.operator === "jsonb_set") {
      if (!Array.isArray(op.path)) throw new Error("jsonb_set requires path: string[]");
      params.push(op.value);
      const pgPath = `{${op.path.join(",")}}`;
      return {
        sql: `jsonb_set(${expr}, '${pgPath}', to_jsonb($${paramIndexStart}::jsonb), true)`,
        params
      };
    }
  
    if (op.operator === "jsonb_remove") {
      if (!Array.isArray(op.path)) throw new Error("jsonb_remove requires path: string[]");
      const pgPath = `{${op.path.join(",")}}`;
      return { sql: `${expr} #- '${pgPath}'`, params };
    }
  
    if (op.operator === "jsonb_inc" || op.operator === "jsonb_mul") {
      if (!Array.isArray(op.path) || typeof op.value !== "number") {
        throw new Error(`${op.operator} requires { path: string[], value: number }`);
      }
      params.push(op.value);
      const pgPath = `{${op.path.join(",")}}`;
      const extractor = op.path.map(p => `'${p}'`).join("->>");
      const operatorSymbol = op.operator === "jsonb_inc" ? "+" : "*";
      const defaultValue = op.operator === "jsonb_inc" ? 0 : 1;
  
      return {
        sql: `jsonb_set(${expr}, '${pgPath}', to_jsonb(coalesce((${columnName}#>>'{${op.path[0]}}')::numeric, ${defaultValue}) ${operatorSymbol} $${paramIndexStart}), true)`,
        params
      };
    }
  
    throw new Error(`Unsupported JSONB operator: ${op.operator}`);
  }
  
  // Construct UPDATE query with correct param indexing
  export const constructUpdateQuery = (tableName, values, conditions, returnColumns) => {
    const queryParams = [];
  
    // Build SET clause
    const setClause = Object.keys(values).map(key => {
      const val = values[key];
  
      if (Array.isArray(val)) {
        let expr = key;
        for (const op of val) {
          const { sql, params } = buildJsonbOp(key, expr, op, queryParams.length + 1);
          expr = sql;
          queryParams.push(...params);
        }
        return `${key} = ${expr}`;
      }
  
      if (val && typeof val === "object" && "operator" in val && val.operator.startsWith("jsonb")) {
        const { sql, params } = buildJsonbOp(key, key, val, queryParams.length + 1);
        queryParams.push(...params);
        return `${key} = ${sql}`;
      }
  
      if (val && typeof val === "object" && "operator" in val) {
        queryParams.push(val.value);
        return `${key} = ${key} ${val.operator} $${queryParams.length}`;
      }
  
      queryParams.push(val);
      return `${key} = $${queryParams.length}`;
    }).join(", ");
  
    // Build WHERE clause
    const conditionStrings = Object.keys(conditions).map(key => {
      const { operator, value } = conditions[key];
      queryParams.push(value);
      if (operator === "IN") {
        const placeholders = value.map((_, idx) => `$${queryParams.length - value.length + idx + 1}`).join(", ");
        return `${key} IN (${placeholders})`;
      } else {
        return `${key} ${operator} $${queryParams.length}`;
      }
    }).join(" AND ");
  
    const queryString = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE ${conditionStrings}
      RETURNING ${returnColumns.join(", ")};
    `;
  
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
            error: `Update query failed: ${error.message}\n${queryString}\n------\n ${queryParams}` // Return detailed error message for this query
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