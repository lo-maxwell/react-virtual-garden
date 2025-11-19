
import { ToolType } from "./ToolTypes";
import { v4 as uuidv4 } from 'uuid';
import { ToolList } from "../toolList";
import { ToolTransactionResponse } from "./ToolTransactionResponse";
import { BooleanResponse } from "@/models/utility/BooleanResponse";
import { Tool } from "@/models/items/tools/Tool";
import ToolTemplate from "@/models/items/templates/models/ToolTemplates/ToolTemplate";
import { generateTool } from "@/models/items/ItemFactory";

export interface ToolboxEntity {
	id: string,
	owner: string,
}


/** TODO: Make this like toollist, with immutable fields and helper functions to interact with it */
export default class Toolbox {
	private toolboxId: string;
	private tools: ToolList;

	constructor(toolboxId: string, tools: ToolList = new ToolList()) {
		this.toolboxId = toolboxId;
		this.tools = tools;
	}

	static generateDefaultToolbox() {
		const defaultTools: Tool[] = [];
		const basicShovel = generateTool("Basic Axe");
		if (basicShovel.itemData.name == "Basic Axe") {
			defaultTools.push(basicShovel);
		} else {
			console.warn(`Could not generate item with name ${"Basic Axe"}`);
		}

		return new Toolbox(uuidv4(), new ToolList(defaultTools));
	}

	static fromPlainObject(plainObject: any): Toolbox {
		// Validate plainObject structure
		if (!plainObject || typeof plainObject !== 'object') {
			throw new Error('Invalid plainObject structure for Toolbox');
		}
		
		// Initialize default values
		let toolboxId = uuidv4();
		let tools = new ToolList();

		if (plainObject && typeof plainObject.toolboxId === 'string') {
			toolboxId = plainObject.toolboxId;
		}
	
		// Validate and assign tools
		if (plainObject && plainObject.tools !== undefined) {
			if (typeof plainObject.tools === 'object' && plainObject.tools !== null) {
				tools = ToolList.fromPlainObject(plainObject.tools) || new ToolList();
			}
		}
	
		return new Toolbox(toolboxId, tools);
		
	}

	toPlainObject(): any {
		return {
			toolboxId: this.toolboxId,
			tools: this.tools.toPlainObject()
		}
	} 

	/**
	 * @returns the inventory id for database access
	 */
	getToolboxId(): string {
		return this.toolboxId;
	}

	/**
	 * @returns a copy of the tools within the list.
	 */
	 getAllTools(): Tool[] {
		return this.tools.getAllTools();
	}

	/**
	 * @type the type string, ie. SEED, HARVESTED, BLUEPRINT
	 * @category (optional) the category string, ie. Allium, Normal
	 * @returns a copy of the toolbox tools matching the given type
	 */
	getToolsByType(type: ToolType, category: string | null = null): Tool[] {
		return this.tools.getToolsByType(type, category);
	}

	//TODO: Needs unit tests
	/**
	 * @returns a list of strings containing all the types of tools in this toollist
	 */
	 getAllTypes(): string[] {
		return this.tools.getAllTypes();
	}

	/**
     * Gains tool to toolbox at no cost.
     * @tool The tool to add, identified by Tool or ToolTemplate.
     * @returns ToolTransactionResponse containing the added tool or an error message.
     */
	 gainTool(tool: Tool | ToolTemplate): ToolTransactionResponse {
		const response = this.addTool(tool);
		return response;
	}

	/**
     * Deletes tool from toolbox
     * @tool The tool to remove, identified by Tool, ToolTemplate, or name
     * @returns ToolTransactionResponse containing the tool or an error message.
     */
	trashTool(tool: Tool | ToolTemplate | string): ToolTransactionResponse {
		const response = this.deleteTool(tool);
		return response;
	}


	/**
     * Find an tool in the toolbox.
     * @tool The tool to get, identified by Tool, ToolTemplate, or name.
     * @returns ToolTransactionResponse containing the found Tool or error message.
     */
	 getTool(tool: Tool | ToolTemplate | string): ToolTransactionResponse {
		const response = this.tools.getTool(tool);
		return response;
	}

	/**
     * Check if the toolbox contains an tool.
     * @tool - The tool to check for, identified by Tool, ToolTemplate, or name.
     * @returns BooleanResponse containing True/False or error message.
     */
	contains(tool: Tool | ToolTemplate | string): BooleanResponse {
		const response = this.tools.contains(tool);
		return response;
	}

	/**
     * Add an tool to the toolbox.
     * @tool The tool to add.
     * @quantity The quantity of the tool to add.
     * @returns ToolTransactionResponse containing the added Tool or error message
     */
	protected addTool(tool: Tool | ToolTemplate): ToolTransactionResponse {
		if (!(tool instanceof Tool) && !(tool instanceof ToolTemplate)) {
			const response = new ToolTransactionResponse();
			response.addErrorMessage(`Cannot add tool to toolbox`);
			return response;
		}
		const response = this.tools.addTool(tool);
		return response;
	}

	/**
     * Delete an tool from the toolbox.
     * @tool The tool to delete, identified by Tool, ToolTemplate, or name.
     * @returns ToolTransactionResponse containing the deleted Tool or error message.
     */
	protected deleteTool(tool: Tool | ToolTemplate | string): ToolTransactionResponse {
		const response = this.tools.deleteTool(tool);
		return response;
	}

	/**
	 * Deletes all tools from the toolbox.
	 * @returns ToolTransactionResponse containing the deleted toolList or error message.
	 */
	protected deleteAll(): ToolTransactionResponse {
		const response = new ToolTransactionResponse();
		response.payload = this.tools.deleteAll();
		return response;
	}

	/**
     * Get the size of the toolbox.
     * @returns The number of tools in the toolbox.
     */
	 size(): number {
		return this.tools.size();
	}
}