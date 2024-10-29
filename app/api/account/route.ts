import { createAccountInDatabase, saveAccountToDatabase } from "@/backend/services/account/accountService";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
	  const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject } = await request.json();
	  const result = await createAccountInDatabase(User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject));
	  return NextResponse.json(result, {status: 201});
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }

export async function PATCH(request: Request) {
	try {
		const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject } = await request.json();
		const result = await saveAccountToDatabase(User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject));
		return NextResponse.json(result, {status: 200});
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}