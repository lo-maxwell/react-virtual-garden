import { CustomResponse } from "./CustomResponse";

export class BooleanResponse extends CustomResponse<boolean>  {
	constructor(payload: boolean = false, messages: string[] = []) {
		super(payload, messages);
	}
}