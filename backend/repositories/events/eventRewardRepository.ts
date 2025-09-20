import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import { EventReward, EventRewardEntity } from "@/models/events/EventReward";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { getItemClassFromSubtype } from "@/models/items/utility/itemClassMaps";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";
import { UserEventEntity } from "@/models/user/userEvents/UserEvent";
import { UserEventType } from "@/models/user/userEvents/UserEventTypes";
import assert from "assert";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from 'uuid';
/**
 * Not implemented for non lambda
 */
class EventRewardRepository {

	/**
	 * Ensures that the object is of type EventRewardEntity, ie. that it contains an id, owner, identifier, and quantity field
	 */
	validateEventRewardEntity(eventRewardEntity: any): boolean {
		if (!eventRewardEntity || (typeof eventRewardEntity.id !== 'string') || (typeof eventRewardEntity.owner !== 'string') || (eventRewardEntity.inventory && typeof eventRewardEntity.inventory !== 'string') || typeof eventRewardEntity.gold !== 'number' || (eventRewardEntity.message && typeof eventRewardEntity.message !== 'string')  ) {
			console.error(eventRewardEntity);
			throw new Error(`Invalid types while creating EventReward from EventRewardEntity`);
		}
		return true;
	}

    /**
     * @param userEventEntity
     * @param eventRewardEntity 
     * @param rewardItems the items contained in this event reward
     * @returns an eventReward
     */
	makeEventRewardObject(userEventEntity: UserEventEntity, eventRewardEntity: EventRewardEntity, rewardItems: InventoryItemList = new InventoryItemList()): EventReward {
		assert(this.validateEventRewardEntity(eventRewardEntity), 'EventRewardEntity validation failed');
        const eventReward = new EventReward({
            eventType: userEventEntity.event_type,
            userId: userEventEntity.owner,
            inventoryId: eventRewardEntity.inventory,
            streak: userEventEntity.streak,
            items: rewardItems,
            gold: eventRewardEntity.gold,
            message: eventRewardEntity.message
        });
		return eventReward;
	}
}

const eventRewardRepository = new EventRewardRepository();
export default eventRewardRepository;
