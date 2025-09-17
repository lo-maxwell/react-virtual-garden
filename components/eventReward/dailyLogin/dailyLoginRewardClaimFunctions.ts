import { EventReward, EventRewardInterface } from "@/models/events/EventReward";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import User from "@/models/user/User";
import { UserEvent } from "@/models/user/userEvents/UserEvent";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";
import { makeApiRequest } from "@/utils/api/api";
import { saveInventory } from "@/utils/localStorage/inventory";
import { saveUser } from "@/utils/localStorage/user";

/**
 * Processes an event reward interface and updates the given user.
 * @param user - the User to update
 * @param inventory - the inventory to add rewards to
 * @param eventRewardInterface - the details of the event reward
 * @returns - the userEvent added to the user
 */
export function handleDailyLoginApiResponse(user: User, inventory: Inventory, eventRewardInterface: EventRewardInterface): UserEvent {
	let eventReward = EventReward.fromPlainObject(eventRewardInterface);
	let userEvent: UserEvent = new UserEvent(user.getUserId(), eventReward.getEventType(), new Date(Date.now()), eventReward.getStreak());
	if (userEvent.getEventType() !== UserEventTypes.DAILY.name) {
		console.error(userEvent);
		console.error(`Error: invalid userEvent input for handleDailyLoginApiResponse`);
		return userEvent;
	}
	if (eventReward.getInventoryId() != inventory.getInventoryId()) {
		console.error(`Error: invalid receiving inventory for handleDailyLoginApiResponse`);
		return userEvent;
	}
	user.addEvent(userEvent);
	inventory.addGold(eventReward.getGold());
	eventReward.getItems().getAllItems().forEach((item, index) => {
		inventory.gainItem(item, item.getQuantity());
	})

	return userEvent;
}

export async function syncUserInventory(user: User, inventory: Inventory): Promise<boolean> {
  
	try {
	  // Sync user data
	  const userApiRoute = `/api/user/${user.getUserId()}/get`;
	  const userResult = await makeApiRequest('GET', userApiRoute, {}, true);
	  saveUser(User.fromPlainObject(userResult));
  
	  // Sync inventory data
	  const inventoryApiRoute = `/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`;
	  const inventoryResult = await makeApiRequest('GET', inventoryApiRoute, {}, true);
	  saveInventory(Inventory.fromPlainObject(inventoryResult));
	  return true;
	} catch (error) {
	  console.error(error);
	  return false;
	}
  }