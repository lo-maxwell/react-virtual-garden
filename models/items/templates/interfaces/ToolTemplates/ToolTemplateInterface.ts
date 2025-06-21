import { ItemTemplateInterface } from "../ItemTemplateInterface";

export default interface ToolTemplateInterface {
	id: string;
	name: string;
	type: string;
	icon: string;
	description: string;
	value: number;
	level: number;
}