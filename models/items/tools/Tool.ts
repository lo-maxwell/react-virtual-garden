import ToolTemplate from "../templates/models/ToolTemplates/ToolTemplate";

export interface ToolEntity {
	id: string,
	owner: string, //maps to toolbox
	identifier: string, //itemData.id
}

export abstract class Tool {
	protected toolId: string;
	itemData: ToolTemplate;
	
	constructor(toolId: string, itemData: ToolTemplate) {
		this.toolId = toolId;
		this.itemData = itemData;
	}


	static fromPlainObject(plainObject: any): Tool {
        throw new Error("fromPlainObject must be implemented in subclasses");
    }

	abstract toPlainObject(): any;

	/**
	 * @returns the toolId for database access
	 */
	getToolId(): string {
		return this.toolId;
	}

	/**
	 * TODO: Fix any function that uses this, this is a dangerous operation
	 * Sets the id for database access.
	 */
	 setToolId(newId: string): void {
		this.toolId = newId;
	}

}