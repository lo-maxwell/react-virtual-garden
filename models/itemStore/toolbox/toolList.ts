import { getToolClassFromType, ToolConstructor } from "@/models/items/utility/toolClassMaps";
import { BooleanResponse } from "@/models/utility/BooleanResponse";
import { ToolTransactionResponse } from "./tool/ToolTransactionResponse";
import { ToolType } from "./tool/ToolTypes";
import { v4 as uuidv4 } from 'uuid';
import ToolTemplate from "@/models/items/templates/models/ToolTemplates/ToolTemplate";
import { Tool } from "@/models/items/tools/Tool";

export class ToolList {
	private tools: Tool[];
	static fixedOrder = ['Shovel'];
	
	constructor(tools: Tool[] = []) {
		this.tools = tools;
		this.sortTools(this.tools);
	}

	private sortTools(list: any[]) {
		list.sort((a, b) => {
			const numA = parseInt(a.itemData.id.replace(/-/g, ''), 10);
			const numB = parseInt(b.itemData.id.replace(/-/g, ''), 10);
			return numA - numB;
		});
	}

	static fromPlainObject(plainObject: any): ToolList {
		try {
			if (!plainObject || typeof plainObject !== 'object') {
				throw new Error('Invalid plainObject structure for ToolList');
			}
			const tools = plainObject.tools.map((tool: any) => {
				if (!tool) return null;
				const ToolClass = getToolClassFromType(tool);
				if (!ToolClass) {
					console.warn(`Unknown tool type of ${tool}`);
					return null;
				}
				const toReturn = ToolClass.fromPlainObject(tool);
				if (toReturn.itemData.name == 'error') {
					return null;
				}
				return toReturn;
			}).filter((tool: null | Tool) => tool !== null);
			return new ToolList(tools);
		} catch (err) {
			console.error('Error creating ToolList from plainObject:', err);
			return new ToolList();
		}
	}

	toPlainObject(): any {
		const toReturn = {
			tools: this.tools.map(tool => {
				return tool.toPlainObject();
			})
		};
		return toReturn;
	} 

	/**
	 * Check if tool is a Tool.
	 * @tool The tool to check.
	 * @returns True/False
	 */
	static isTool(tool: any): tool is Tool {
		return tool instanceof Tool;
	}
	
	/**
	 * Check if tool is a ToolTemplate.
	 * @tool The tool to check.
	 * @returns True/False
	 */
	static isToolTemplate(tool: any): tool is ToolTemplate {
		return tool instanceof ToolTemplate;
	}

	/**
	 * @returns a copy of the inventory tools within the list.
	 */
	getAllTools(): Tool[] {
		return this.tools.slice();
	}

	/**
	 * @type the type string, ie Shovel
	 * @returns a copy of the inventory tools matching the given type
	 */
	getToolsByType(type: ToolType, category: string | null = null): Tool[] {
		if (!category) {
			return this.tools.slice().filter((tool) => tool.itemData.type === type);
		}
		return this.tools.slice().filter((tool) => tool.itemData.type === type);
	}

	/**
	 * @returns a list of strings containing all the types of tools in this toollist
	 */
	getAllTypes(): string[] {
		const types: string[] = [];
		this.tools.forEach((tool) => {
			if (!types.includes(tool.itemData.type)) {
				types.push(tool.itemData.type);
			}
		})
		
		types.sort((a, b) => {
			const indexA = ToolList.fixedOrder.indexOf(a);
			const indexB = ToolList.fixedOrder.indexOf(b);
			const orderA = indexA !== -1 ? indexA : ToolList.fixedOrder.length;
			const orderB = indexB !== -1 ? indexB : ToolList.fixedOrder.length;
			return orderA - orderB;
		});
		return types;
	}

	/**
	 * Converts a Tool or ToolTemplate to its tool name. Strings are unaffected. Can be used on Placed or Tools.
	 * @tool The tool to convert, identified by Tool, ToolTemplate, or name.
	 * @returns ToolTransactionResponse containing the name or an error message.
	 */
	static getToolName(tool: Tool | ToolTemplate | string): ToolTransactionResponse<string | null> {
		const response = new ToolTransactionResponse<string>();
		let toolName: string;
		if (typeof tool === 'string') {
			toolName = tool;
		} else if (typeof tool === 'object' && ToolList.isToolTemplate(tool)) {
			toolName = tool.name;
		} else if (typeof tool === 'object' && (tool instanceof Tool)) {
			toolName = tool.itemData.name;
		} else {
			response.addErrorMessage(`Could not parse tool: ${tool}`);
			return response;
		}
		response.payload = toolName;
		return response;
	}

	/**
	 * Converts a Tool or ToolTemplate to its tool id. Can be used on Placed or Tools.
	 * @tool The tool to convert, identified by Tool or ToolTemplate.
	 * @returns ToolTransactionResponse containing the id string or an error message.
	 */
	static getToolId(tool: string | Tool | ToolTemplate): ToolTransactionResponse<string | null> {
		const response = new ToolTransactionResponse<string>();
		let toolId: string;
		if (typeof tool === 'string') {
			toolId = tool;
		} else if (typeof tool === 'object' && ToolList.isToolTemplate(tool)) {
			toolId = tool.id;
		} else if (typeof tool === 'object' && (tool instanceof Tool)) {
			toolId = tool.itemData.id;
		} else {
			response.addErrorMessage(`Could not parse tool: ${tool}`);
			return response;
		}
		response.payload = toolId;
		return response;
	}

	/**
	 * Get a tool from the inventory.
	 * @tool The tool to get, identified by Tool, ToolTemplate, or name.
	 * @returns ToolTransactionResponse containing the found Tool or error message.
	 */
	getTool(tool: Tool | ToolTemplate | string): ToolTransactionResponse<Tool | null> {
		const response = new ToolTransactionResponse<Tool>();
		const toolNameResponse = ToolList.getToolName(tool);
		if (!toolNameResponse.isSuccessful()) {
			response.addErrorMessages(toolNameResponse.messages);
			return response;
		}
		const toolName = toolNameResponse.payload as string;

		this.tools.forEach((element, index) => {
			if (element.itemData.name == toolName) {
				response.payload = element;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.addErrorMessage(`tool ${toolName} not found`);
		return response;
	}

	/**
	 * Check if the inventory contains a tool.
	 * Only returns true if the tool matches the given name
	 * @tool The tool to check for, identified by Tool, ToolTemplate, or name.
	 * @returns BooleanResponse containing True/False or error message.
	 */
	contains(tool: Tool | ToolTemplate | string): BooleanResponse {
		const response = new BooleanResponse();
		const toolNameResponse = ToolList.getToolName(tool);
		if (!toolNameResponse.isSuccessful()) {
			console.warn(`Error calling contains() on toolList: ` + toolNameResponse.messages);
			response.payload = false;
			return response;
		}
		const toolName = toolNameResponse.payload as string;
		
		this.tools.forEach((element, index) => {
			if (element.itemData.name == toolName) {
				response.payload = true;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.payload = false;
		return response;
	}

	/**
	 * Consumes x quantity from the specified tool.
	 * Performs a specific action depending on the tool type:
	 * Blueprint -> returns the Decoration ToolTemplate corresponding to the Blueprint
	 * Seed -> returns the Plant ToolTemplate corresponding to the Seed
	 * HarvestedTool -> error
	 * @tool The tool to use, identified by Tool, ToolTemplate, or name.
	 * @quantity the quantity of tool consumed
	 * @returns a response containing the following object, or an error message
	 * {originalTool: Tool, newTemplate: ToolTemplate}
	 */
	// useTool(tool: Tool | ToolTemplate | string, quantity: number): ToolTransactionResponse<{originalTool: Tool, newTemplate: ToolTemplate} | null> {
	// 	const toUse = this.getTool(tool);
	// 	if (toUse.isSuccessful()) {
	// 		const useTool = toUse.payload as Tool;
	// 		const response = useTool.use(quantity);
	// 		return response;
	// 	} else {
	// 		const response = new ToolTransactionResponse<{originalTool: Tool, newTemplate: ToolTemplate}>();
	// 		response.addErrorMessages(toUse.messages);
	// 		return response;
	// 	}
	// }

	/**
	 * Add a tool to the inventory. Must not already exist in toolbox.
	 * @tool The tool to add.
	 * @returns ToolTransactionResponse containing the added Tool or error message
	 */
	addTool(tool: Tool | ToolTemplate): ToolTransactionResponse<Tool | null> {
		const response = new ToolTransactionResponse<Tool>();

		let toUpdate = this.getTool(tool);
		if (toUpdate.isSuccessful()) {
			const existingTool = toUpdate.payload as Tool;
			response.addErrorMessage(`Tool ${existingTool.itemData.name} already in toolbox.`)
			return response;
		} else {
			// Add tool to inventory
			let newTool: Tool;
			if (ToolList.isTool(tool)) {
				const toolClass = getToolClassFromType(tool) as ToolConstructor<Tool>;
				newTool = new toolClass(tool.getToolId(), tool.itemData);
			} else if (ToolList.isToolTemplate(tool)) {
				const toolClass = getToolClassFromType(tool) as ToolConstructor<Tool>;
				newTool = new toolClass(uuidv4(), tool);
			} else {
				response.addErrorMessage(`Could not parse tool of type ${typeof tool}`);
				return response;
			}
			if (newTool.itemData.name === 'error') {
				response.addErrorMessage('Cannot add error tool.');
				return response;
			}
			this.tools.push(newTool);
			this.sortTools(this.tools);
			response.payload = newTool;
			return response;
		}
	}

	/**
	 * Delete a tool from the inventory.
	 * @tool The tool to delete, identified by Tool, ToolTemplate, or name.
	 * @returns ToolTransactionResponse containing the deleted Tool with quantity set to 0 or error message.
	 */
	deleteTool(tool: Tool | ToolTemplate | string): ToolTransactionResponse<Tool | null> {
		const response = new ToolTransactionResponse<Tool>();
		let toDelete = this.getTool(tool);
		if (toDelete.isSuccessful()) {
			const toolToDelete = toDelete.payload as Tool;
			response.payload = toolToDelete;
			const toDeleteIndex = this.tools.indexOf(toolToDelete);
			this.tools.splice(toDeleteIndex, 1);
			return response;
		} else {
			response.addErrorMessages(toDelete.messages);
			return response;
		}
	}

	/**
	 * Deletes all tools from the inventory.
	 * @returns ToolTransactionResponse containing the deleted toolList or error message.
	 */
	deleteAll(): ToolTransactionResponse<Tool[] | null> {
		const response = new ToolTransactionResponse<Tool[]>();
		response.payload = this.getAllTools();
		this.tools = [];
		return response;
	}

	/**
	 * Get the size of the inventory.
	 * @returns The number of tools in the inventory.
	 */
	size(): number {
		return this.tools.length;
	}
}