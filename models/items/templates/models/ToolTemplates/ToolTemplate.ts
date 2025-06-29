export default abstract class ToolTemplate {
	id: string;
	name: string;
	type: string;
	icon: string;
	description: string;
	value: number;
	level: number;
	constructor(id: string, name: string, type: string, icon: string, description: string, value: number, level: number) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.icon = icon;
		this.description = description;
		this.value = value;
		this.level = level;
	}
}