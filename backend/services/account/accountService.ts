import { pool } from "@/backend/connection/db";
import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import gardenRepository from "@/backend/repositories/garden/gardenRepository";
import goosePenRepository from "@/backend/repositories/goose/goosePenRepository";
import inventoryRepository from "@/backend/repositories/itemStore/inventory/inventoryRepository";
import storeRepository from "@/backend/repositories/itemStore/store/storeRepository";
import { Garden, GardenEntity } from "@/models/garden/Garden";
import Goose from "@/models/goose/Goose";
import GoosePen, { GoosePenEntity } from "@/models/goose/GoosePen";
import { Inventory, InventoryEntity } from "@/models/itemStore/inventory/Inventory";
import { Store, StoreEntity } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { PoolClient } from "pg";
import { createGardenInDatabase, getGardenFromDatabase, upsertGardenInDatabase } from "../garden/gardenService";
import { createGoosePenInDatabase, getGoosePenFromDatabase, upsertGoosePenInDatabase } from "../goose/gooseService";
import { createInventoryInDatabase, getInventoryFromDatabase, upsertInventoryInDatabase } from "../inventory/inventoryService";
import { createStoreInDatabase, getStoreFromDatabase, upsertStoreInDatabase } from "../store/storeService";
import { createUserInDatabase, getUserFromDatabase, upsertUserInDatabase } from "../user/userService";

//Does not need lambda specific
/**
 * Calls createAccountInDatabase with the default user, store, inventory, garden objects.
 * @returns the result of createAccountInDatabase
 */
 export async function createDefaultAccountInDatabase(
    firebaseUid: string,
    client?: PoolClient
): Promise<string | null> {
    const defaultUser = User.generateNewUserWithId(firebaseUid);
    const defaultGarden = Garden.generateDefaultNewGarden();
    const defaultInventory = Inventory.generateDefaultNewInventory();
    const defaultStore = Store.generateDefaultNewStore();

    // ✨ Create an empty goose pen
    const defaultPen = GoosePen.generateDefaultGoosePen(firebaseUid);
    // goose pen is empty

    const createResult = await createAccountInDatabase(
        firebaseUid,
        defaultUser,
        defaultInventory,
        defaultStore,
        defaultGarden,
        defaultPen,        // <--- empty pen
        client
    );

    if (!createResult) {
        throw new Error(`There was an error initializing default objects`);
    }

    return defaultUser.getUserId();
}


/**
 * Begins a transaction if there is not already one. Creates a new row in the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
 * If the object already exists in the database (with the corresponding id), does nothing.
 * TODO: Might not even work to begin with since we use firebaseUid instead of userId now
 * On error, rolls back.
 * @userId the firebase uid
 * @user the User to add
 * @inventory the User's inventory
 * @store the store associated with the User
 * @garden the garden associated with the User
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns true if success, throws error on failure
 */
 export async function createAccountInDatabase(
    userId: string,
    user: User,
    inventory: Inventory,
    store: Store,
    garden: Garden,
    goosePen: GoosePen,
    client?: PoolClient
): Promise<boolean | null> {

    const userResult = await createUserInDatabase(user, userId, client);
    const gardenResult = await createGardenInDatabase(garden, userId, client);
    const inventoryResult = await createInventoryInDatabase(inventory, userId, client);
    const storeResult = await createStoreInDatabase(store, userId, client);

    // ✨ Pen insertion (geese auto-inserted if any exist)
    const penResult = await createGoosePenInDatabase(goosePen, userId, client);

    return (
        userResult &&
        gardenResult &&
        inventoryResult &&
        storeResult &&
        penResult
    );
}

/**
 * Begins a transaction if there is not already one. Updates the users, levels, itemstores, inventoryItems (if there are existing items), garden, plots tables.
 * If the object does not already exist with a suitable id, does nothing.
 * On error, rolls back.
 * @userId the firebase uid
 * @user the User to update
 * @inventory the User's inventory
 * @store the store associated with the User
 * @garden the garden associated with the User
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns true if success, throws error on failure
 */
 export async function saveAccountToDatabase(
    userId: string,
    user: User,
    inventory: Inventory,
    store: Store,
    garden: Garden,
    goosePen: GoosePen,
    client?: PoolClient
): Promise<boolean | null> {
	//TODO: Make this atomic
	const userResult = await upsertUserInDatabase(user, userId, client);
	const gardenResult = await upsertGardenInDatabase(garden, userId, client);
	const inventoryResult = await upsertInventoryInDatabase(inventory, userId, client);
	const storeResult = await upsertStoreInDatabase(store, userId, client);
    const penResult = await upsertGoosePenInDatabase(goosePen, userId, client);

	return userResult && gardenResult && inventoryResult && storeResult && penResult;
}

export interface AccountObjects {
	plainUserObject: any,
	plainGardenObject: any,
	plainInventoryObject: any,
	plainStoreObject: any
	plainGoosePenObject: any
}

//TODO: Fetches a random one of garden, store, inventory. if users can ever have multiple instances of these, this code will break
/**
 * Begins a transaction if there is not already one. Fetches the user, garden, inventory, store from the database and returns them as a json object.
 * On error, rolls back.
 * @userId the user id to fetch from the database
 * @client the pool client that this is nested within, or null if it should create its own transaction.
 * @returns AccountObjects object containing user, garden, inventory, store in plainObject format, or throws error
 */
 export async function getAccountFromDatabase(
    userId: string,
    client?: PoolClient
): Promise<AccountObjects> {

    let gardenId;
    let inventoryId;
    let storeId;
    let penId;

    if (process.env.USE_DATABASE === 'LAMBDA') {

        const fetch_payload = {
            queries: [
                {
                    tableName: "gardens",
                    returnColumns: ["id", "owner", "rows", "columns"],
                    conditions: { owner: { operator: "=", value: userId } },
                    limit: 1
                },
                {
                    tableName: "inventories",
                    returnColumns: ["id", "owner", "gold"],
                    conditions: { owner: { operator: "=", value: userId } },
                    limit: 1
                },
                {
                    tableName: "stores",
                    returnColumns: ["id", "owner", "identifier", "last_restock_time_ms"],
                    conditions: { owner: { operator: "=", value: userId } },
                    limit: 1
                },
                {
                    tableName: "goose_pens",
                    returnColumns: ["id", "owner", "size"],
                    conditions: { owner: { operator: "=", value: userId } },
                    limit: 1
                }
            ]
        };

        const queryResult = await invokeLambda('garden-select', fetch_payload);

        const gardenEntity    = parseRows<GardenEntity[]>(queryResult[0])[0];
        const inventoryEntity = parseRows<InventoryEntity[]>(queryResult[1])[0];
        const storeEntity     = parseRows<StoreEntity[]>(queryResult[2])[0];
        const penEntity       = parseRows<GoosePenEntity[]>(queryResult[3])[0];

        gardenId    = gardenEntity ? gardenEntity.id : "Error";
        inventoryId = inventoryEntity ? inventoryEntity.id : "Error";
        storeId     = storeEntity ? storeEntity.id : "Error";
        penId       = penEntity ? penEntity.id : "Error";

    } else {
        const gardenEntity    = await gardenRepository.getGardenByOwnerId(userId);
        const inventoryEntity = await inventoryRepository.getInventoryByOwnerId(userId);
        const storeEntity     = await storeRepository.getStoreByOwnerId(userId);
        const penEntity       = await goosePenRepository.getGoosePenByOwnerId(userId);

        gardenId    = gardenEntity ? gardenEntity.id : "Error";
        inventoryId = inventoryEntity ? inventoryEntity.id : "Error";
        storeId     = storeEntity ? storeEntity.id : "Error";
        penId       = penEntity ? penEntity.id : "Error";
    }

    // Now fetch each object in plain-object form
    const userPlainObject      = await getUserFromDatabase(userId, client);
    const gardenPlainObject    = await getGardenFromDatabase(gardenId, userId, client);
    const inventoryPlainObject = await getInventoryFromDatabase(inventoryId, userId, client);
    const storePlainObject     = await getStoreFromDatabase(storeId, userId, client);
    const penPlainObject       = await getGoosePenFromDatabase(penId, userId, client);

    return {
        plainUserObject: userPlainObject,
        plainGardenObject: gardenPlainObject,
        plainInventoryObject: inventoryPlainObject,
        plainStoreObject: storePlainObject,
        plainGoosePenObject: penPlainObject
    };
}
