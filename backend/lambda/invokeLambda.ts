import { InvokeCommand, InvokeCommandOutput } from "@aws-sdk/client-lambda";
import lambda from "./lambda";

/**
 * Determines the Lambda function name prefix based on the environment.
 * Production uses 'prod-' prefix, development uses 'dev-' prefix.
 */
function getFunctionNamePrefix(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? 'prod-' : 'dev-';
}

/**
 * Adds the environment prefix to a function name if it's not already present.
 * @param functionName - The base function name (e.g., 'garden-select')
 * @returns The function name with appropriate prefix (e.g., 'dev-garden-select' or 'prod-garden-select')
 */
function addEnvironmentPrefix(functionName: string): string {
    const prefix = getFunctionNamePrefix();
    
    // If the function name already starts with 'dev-' or 'prod-', don't add prefix again
    if (functionName.startsWith('dev-') || functionName.startsWith('prod-')) {
        return functionName;
    }
    
    return `${prefix}${functionName}`;
}

export async function invokeLambda<T = any>(functionName: string, payload: any): Promise<T> {
    try {
        // Automatically add environment prefix to function name
        const prefixedFunctionName = addEnvironmentPrefix(functionName);
        
        const command = new InvokeCommand({
            FunctionName: prefixedFunctionName,
            Payload: JSON.stringify(payload),
        });
    
        const { Payload, FunctionError }: InvokeCommandOutput = await lambda.send(command);
        
        if (FunctionError) {
            throw new Error(`Lambda execution failed: ${FunctionError}`);
        }
        
        if (!Payload) {
            throw new Error('No payload returned from Lambda');
        }

        const result = JSON.parse(new TextDecoder().decode(Payload));
        
        // Handle Lambda's response format
        if (result.statusCode && result.statusCode !== 200) {
            throw new Error(result.body?.message || 'Lambda execution failed');
        }
        const body: T = (result.body != null) ? JSON.parse(result.body): null;
        return body || result;
    } catch (error) {
        throw new Error(`Failed to invoke Lambda: ${(error as Error).message}`);
    }
}

export function parseRows<T = any>(result: any): T {
    if (!result) {
      throw new Error("Failed to parse result: no result object returned");
    }
  
    if (result.error) {
      throw new Error(`Lambda query error for ${result.tableName}: ${result.error}`);
    }
  
    if (!result.rows) {
        console.log(result);
      throw new Error(`No rows returned for ${result.tableName}`);
    }
  
    return result.rows;
  }
  