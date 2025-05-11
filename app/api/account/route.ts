import { createAccountInDatabase, saveAccountToDatabase } from "@/backend/services/account/accountService";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { verifyToken } from "@/utils/firebase/authUtils";
import { NextResponse } from "next/server";
//to be obseleted
export async function POST(request: Request) {
	try {
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject } = await request.json();
		const result = await createAccountInDatabase(firebaseUid, User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject));
		return NextResponse.json(result, {status: 201});
	} catch (error) {
	 	return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }

export async function PATCH(request: Request) {
	try {
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject } = await request.json();
		const result = await saveAccountToDatabase(firebaseUid, User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject));
		return NextResponse.json(result, {status: 200});
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}