import { NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

export async function POST(request: Request) {
	try {
		const req = await request.json();
		// Create the Lambda invocation command
		const command = new InvokeCommand({
			FunctionName: 'test-db-lambda',
			Payload: JSON.stringify(req)
		});


		// Invoke the Lambda function
		const { Payload } = await lambda.send(command);
		
		// Parse the response
		const result = JSON.parse(new TextDecoder().decode(Payload));

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }