import { createAccountInDatabase, saveAccountToDatabase } from "@/backend/services/account/accountService";
import { Garden } from "@/models/garden/Garden";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { Store } from "@/models/itemStore/store/Store";
import User from "@/models/user/User";
import { verifyToken } from "@/utils/firebase/authUtils";
import { assert } from "console";
import { NextResponse } from "next/server";
import { ApiErrorCodes } from "@/utils/api/error/apiErrorCodes";
import { ApiResponse } from "@/utils/api/apiResponse";
import GoosePen from "@/models/goose/GoosePen";
//to be obseleted
export async function POST(request: Request) {
	try {
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		if (decodedToken.role !== "admin") {
			return NextResponse.json({ success: false, error: { code: ApiErrorCodes.FORBIDDEN, message: "Forbidden: Admins only" } }, { status: 403 });
		}
		const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject, plainGoosePenObject } = await request.json();
		const result = await createAccountInDatabase(firebaseUid, User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject), GoosePen.fromPlainObject(plainGoosePenObject));
		return ApiResponse.success(result, 201);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
  }

export async function PATCH(request: Request) {
	try {
		const decodedToken = await verifyToken(request.headers.get('Authorization'));
		const firebaseUid = decodedToken.uid;  // Extract UID from the decoded token
		if (decodedToken.role !== "admin") {
			return NextResponse.json({ success: false, error: { code: ApiErrorCodes.FORBIDDEN, message: "Forbidden: Admins only" } }, { status: 403 });
		}
		const { plainUserObject, plainInventoryObject, plainStoreObject, plainGardenObject, plainGoosePenObject, adminPassword } = await request.json();
		const result = await saveAccountToDatabase(firebaseUid, User.fromPlainObject(plainUserObject), Inventory.fromPlainObject(plainInventoryObject), Store.fromPlainObject(plainStoreObject), Garden.fromPlainObject(plainGardenObject), GoosePen.fromPlainObject(plainGoosePenObject));
		return ApiResponse.success(result);
	} catch (error) {
		return ApiResponse.fromError(error);
	}
}