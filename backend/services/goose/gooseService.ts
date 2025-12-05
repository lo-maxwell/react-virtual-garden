import { invokeLambda, parseRows } from "@/backend/lambda/invokeLambda";
import goosePenRepository from "@/backend/repositories/goose/goosePenRepository";
import gooseRepository from "@/backend/repositories/goose/gooseRepository";
import GoosePen, { GoosePenEntity } from "@/models/goose/GoosePen";
import assert from "assert";
import { PoolClient } from "pg";
import { transactionWrapper } from "../utility/utility";

/**
 * Create a goose pen and all geese inside it (no-op on conflict).
 */
export async function createGoosePenInDatabase(
	pen: GoosePen,
	userId: string,
	client?: PoolClient
): Promise<boolean> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const geese = pen.getAllGeese();
			const payload: any = {
				queries: [
					{
						tableName: "goose_pens",
						columnsToWrite: ["id", "owner", "size"],
						values: [[pen.getId(), userId, pen.getSize()]],
						conflictColumns: ["id"],
						returnColumns: ["id"],
					},
				],
			};

			if (geese.length > 0) {
				const gooseValues = geese.map((g) => {
					const gp = g.toPlainObject();
					return [
						g.getId(),
						pen.getId(),           // owner = pen.id (goose belongs to pen)
						gp.name,
						gp.color,
						gp.birthday,
						gp.attributes ?? {},   // JSONB attributes
					];
				});

				payload.queries.push({
					tableName: "gooses",
					columnsToWrite: ["id", "owner", "name", "color", "birthday", "attributes"],
					values: gooseValues,
					conflictColumns: ["id"],
					returnColumns: ["id"],
				});
			}

			const insertResult = await invokeLambda("garden-insert", payload);
			if (!insertResult) throw new Error(`Failed to create goose pen ${pen.getId()}`);

			// optional: check counts
			// const penRows = parseRows<string[]>(insertResult[0]);
			// const gooseRows = geese.length > 0 ? parseRows<string[]>(insertResult[1]) : [];

			return true;
		} catch (err) {
			console.error("Error creating goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('CreateGoosePen is not implemented for non lambda mode');
	}
}


/**
 * Upsert (insert or update) a goose pen and upsert contained geese.
 */
export async function upsertGoosePenInDatabase(
	pen: GoosePen,
	userId: string,
	client?: PoolClient
): Promise<boolean> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const geese = pen.getAllGeese();
			const payload: any = {
				queries: [
					{
						tableName: "goose_pens",
						columnsToWrite: ["id", "owner", "size"],
						values: [[pen.getId(), userId, pen.getSize()]],
						conflictColumns: ["id"],
						updateQuery: {
							values: {
								size: { excluded: true } // replace as desired; here we choose excluded behavior
							},
							conditions: {
								owner: { operator: "=", value: userId }
							}
						},
						returnColumns: ["id"]
					}
				]
			};

			if (geese.length > 0) {
				const gooseValues = geese.map((g) => {
					const gp = g.toPlainObject();
					return [
						g.getId(),
						pen.getId(),
						gp.name,
						gp.color,
						gp.birthday,
						gp.attributes ?? {},
					];
				});

				payload.queries.push({
					tableName: "gooses",
					columnsToWrite: ["id", "owner", "name", "color", "birthday", "attributes"],
					values: gooseValues,
					conflictColumns: ["id"],
					updateQuery: {
						values: {
							name: { excluded: true },
							color: { excluded: true },
							birthday: { excluded: true },
							attributes: { excluded: true }
						},
						conditions: {}
					},
					returnColumns: ["id"]
				});
			}

			const res = await invokeLambda("garden-insert", payload);
			if (!res) throw new Error(`Failed to upsert goose pen ${pen.getId()}`);

			return true;
		} catch (err) {
			console.error("Error upserting goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('UpsertGoosePen is not implemented for non lambda mode');
	}
}

/**
 * Fetch a goose pen and its geese, verify owner, and return a plain object representation.
 */
export async function getGoosePenFromDatabase(
	penId: string,
	userId: string,
	client?: PoolClient
): Promise<GoosePen> {
	if (process.env.USE_DATABASE === "LAMBDA") {
		try {
			const payload = {
				queries: [
					{
						tableName: "goose_pens",
						returnColumns: ["id", "owner", "size"],
						conditions: {
							id: { operator: "=", value: penId },
							owner: { operator: "=", value: userId }
						},
						limit: 1
					},
					{
						tableName: "gooses",
						returnColumns: ["id", "owner", "name", "color", "birthday", "attributes"],
						conditions: {
							owner: { operator: "=", value: penId }
						},
						limit: 500
					}
				]
			};

			const queryResult = await invokeLambda("garden-select", payload);
			if (!queryResult) throw new Error(`Failed to fetch goose pen ${penId}`);

			const penRows = parseRows<any[]>(queryResult[0]);
			if (!penRows || penRows.length === 0) throw new Error(`No goose pen found for id ${penId}`);
			const penEntity = penRows[0];

			// validate pen (optional): goosePenRepository.validateGoosePenEntity(penEntity)

			const geeseRows = parseRows<any[]>(queryResult[1]) || [];
			// Optionally hydrate domain objects:
			const gooseObjs = geeseRows.map((r) => gooseRepository.makeGooseObject(r)); // or Goose.fromPlainObject(r)

			// Build plain object to return
			const penPlain: any = {
				id: penEntity.id,
				owner: penEntity.owner,
				size: penEntity.size,
				geese: gooseObjs.map((g: any) => g.toPlainObject ? g.toPlainObject() : g)
			};

			return penPlain;
		} catch (err) {
			console.error("Error fetching goose pen via Lambda:", err);
			throw err;
		}
	} else {
		throw new Error('GetGoosePen is not implemented for non lambda mode');
	}
}