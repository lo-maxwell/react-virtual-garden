import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { EventRewardItemEntity } from "@/models/events/EventReward";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import assert from "assert";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';

/**
 * Not implemented for non lambda
 */
class EventRewardItemRepository {

	/**
	 * Ensures that the object is of type EventRewardItemEntity, ie. that it contains an id, owner, identifier, and quantity field
	 */
	validateEventRewardItemEntity(eventRewardItemEntity: any): boolean {
		if (!eventRewardItemEntity || (typeof eventRewardItemEntity.id !== 'string') || (typeof eventRewardItemEntity.owner !== 'string') || (typeof eventRewardItemEntity.identifier !== 'string') || (typeof eventRewardItemEntity.quantity !== 'number')) {
			console.error(eventRewardItemEntity);
			throw new Error(`Invalid types while creating InventoryItem from EventRewardItemEntity`);
		}
		return true;
	}

	makeEventRewardItemObjectBatch(inventoryItemEntities: EventRewardItemEntity[]): InventoryItemList {
		const items = new InventoryItemList();
		for (const itemResult of inventoryItemEntities) {
			try {
				const item = this.makeEventRewardItemObject(itemResult);
				items.addItem(item, item.getQuantity());
			} catch (error) {
				console.error(`Failure while initializing items for inventory from database: `);
				console.error(error);
			}
		}
		return items;
	}

	makeEventRewardItemObject(eventRewardItemEntity: EventRewardItemEntity): InventoryItem {
		assert(this.validateEventRewardItemEntity(eventRewardItemEntity), 'EventRewardItemEntity validation failed');

		const itemData = itemTemplateFactory.getInventoryTemplateById(eventRewardItemEntity.identifier);
		if (!itemData) {
			console.warn(`Could not find eventRewardItem matching id ${eventRewardItemEntity.identifier}`)
			return new HarvestedItem(eventRewardItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		const itemClass = getItemClassFromSubtype(itemData);

		const instance = new itemClass(eventRewardItemEntity.id, itemData, eventRewardItemEntity.quantity);
		if (!(instance instanceof InventoryItem)) {
			console.warn(`Attempted to create non InventoryItem for id ${eventRewardItemEntity.identifier}`);
			return new HarvestedItem(eventRewardItemEntity.id, HarvestedItemTemplate.getErrorTemplate(), 0);
		}
		return instance;
	}
}

const eventRewardItemRepository = new EventRewardItemRepository();
export default eventRewardItemRepository;
