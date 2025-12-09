import { pool, query} from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import Goose, { GooseEntity } from "@/models/goose/Goose";
import { GoosePersonality, isGoosePersonality } from "@/models/goose/GoosePersonalities";
import { PoolClient } from "pg";

class GooseRepository {

    normalizeGooseEntity(raw: any): GooseEntity {
        return {
            ...raw,
            birthday: raw.birthday instanceof Date
                ? raw.birthday
                : new Date(raw.birthday),
            attributes: raw.attributes ?? {}
        };
    }

    /**
     * Validates that a plain object is a proper GooseEntity
     */
    validateGooseEntity(goose: any): goose is GooseEntity {
        if (
            !goose ||
            typeof goose.id !== "string" ||
            typeof goose.owner !== "string" ||
            typeof goose.name !== "string" ||
            typeof goose.color !== "string" ||
            !(goose.birthday instanceof Date) ||
            typeof goose.attributes !== "object"
        ) {
            console.error(goose);
            throw new Error("Invalid GooseEntity root fields");
        }

        const a = goose.attributes;

        if (
            typeof a.power !== "number" ||
            typeof a.charisma !== "number" ||
            typeof a.mood !== "number" ||
            typeof a.location !== "number" ||
            typeof a.personality !== "string" ||
            !isGoosePersonality(a.personality)
        ) {
            console.error(goose);
            throw new Error("Invalid GooseEntity.attributes");
        }

        return true;
    }

    /**
     * Creates a Goose domain object from a GooseEntity row.
     * @param raw a object containing goose entity parts, usually gotten from the database
     */
    makeGooseObject(raw: any): Goose {
        const entity = this.normalizeGooseEntity(raw);
        this.validateGooseEntity(entity);

        const attr = entity.attributes;

        return new Goose(
            entity.id,
            entity.name,
            entity.color,
            entity.birthday.getTime(),
            attr.power!,
            attr.charisma!,
            attr.personality! as GoosePersonality,
            attr.mood!,
            attr.location!
        );
    }

    // ------------------------------------------------------------
    // Query helpers
    // ------------------------------------------------------------

    async getAllGeese(): Promise<Goose[]> {
        const result = await query<GooseEntity>("SELECT * FROM gooses", []);
        if (!result || result.rows.length === 0) return [];

        return result.rows.map(r => Goose.fromPlainObject(r));
    }

    async getGooseById(id: string): Promise<Goose | null> {
        const result = await query<GooseEntity>(
            "SELECT * FROM gooses WHERE id = $1",
            [id]
        );

        if (!result || result.rows.length === 0) return null;

        return Goose.fromPlainObject(result.rows[0]);
    }

    async getGeeseByPenId(penId: string): Promise<Goose[]> {
        const result = await query<GooseEntity>(
            "SELECT * FROM gooses WHERE owner = $1",
            [penId]
        );

        if (!result || result.rows.length === 0) return [];

        return result.rows.map(r => Goose.fromPlainObject(r));
    }

    // ------------------------------------------------------------
    // Create
    // ------------------------------------------------------------

    async createGoose(goose: Goose, client?: PoolClient): Promise<GooseEntity> {
        const innerFunction = async (client: PoolClient) => {

            const attributes = {
                power: goose.getPower(),
                charisma: goose.getCharisma(),
                personality: goose.getPersonality(),
                mood: goose.getMood(),
                location: goose.getLocation()
            };

            const result = await client.query<GooseEntity>(
                `INSERT INTO gooses 
                    (id, owner, name, color, birthday, attributes)
                 VALUES ($1,$2,$3,$4,to_timestamp($5 / 1000.0),$6)
                 RETURNING *`,
                [
                    goose.getId(),
                    (goose as any).owner,     // Make sure owner is attached at creation
                    goose.getName(),
                    goose.getColor(),
                    goose.getBirthday(),
                    attributes
                ]
            );

            if (!result || result.rows.length === 0) {
                throw new Error("Failed to create Goose");
            }

            return result.rows[0];
        };

        return await transactionWrapper(innerFunction, "creating goose", client);
    }

    // ------------------------------------------------------------
    // Update
    // ------------------------------------------------------------

    async updateGoose(goose: Goose, client?: PoolClient): Promise<GooseEntity> {
        const innerFunction = async (client: PoolClient) => {

            const attributes = {
                power: goose.getPower(),
                charisma: goose.getCharisma(),
                personality: goose.getPersonality(),
                mood: goose.getMood(),
                location: goose.getLocation()
            };

            const result = await client.query<GooseEntity>(
                `UPDATE gooses
                 SET name=$1,
                     color=$2,
                     birthday=to_timestamp($3 / 1000.0),
                     attributes=$4
                 WHERE id=$5
                 RETURNING *`,
                [
                    goose.getName(),
                    goose.getColor(),
                    goose.getBirthday(),
                    attributes,
                    goose.getId()
                ]
            );

            if (!result || result.rows.length === 0) {
                throw new Error(`Failed to update Goose with id ${goose.getId()}`);
            }

            return result.rows[0];
        };

        return await transactionWrapper(innerFunction, "updating goose", client);
    }

    // ------------------------------------------------------------
    // Delete
    // ------------------------------------------------------------

    async deleteGoose(id: string, client?: PoolClient): Promise<boolean> {
        const innerFunction = async (client: PoolClient) => {
            const result = await client.query(
                "DELETE FROM gooses WHERE id = $1",
                [id]
            );
            return result.rowCount && result.rowCount > 0;
        };

        return await transactionWrapper(innerFunction, "deleting goose", client);
    }
}

const gooseRepository = new GooseRepository();
export default gooseRepository;
