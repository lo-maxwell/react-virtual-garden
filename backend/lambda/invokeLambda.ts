import { InvokeCommand, InvokeCommandOutput } from "@aws-sdk/client-lambda";
import lambda from "./lambda";

export async function invokeLambda<T = any>(functionName: string, payload: any): Promise<T> {
    try {
        const command = new InvokeCommand({
            FunctionName: functionName,
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
      throw new Error(`No rows returned for ${result.tableName}`);
    }
  
    return result.rows;
  }
  