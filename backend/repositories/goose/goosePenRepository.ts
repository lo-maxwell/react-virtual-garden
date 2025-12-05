import { pool, query } from "@/backend/connection/db";
import { transactionWrapper } from "@/backend/services/utility/utility";
import Goose from "@/models/goose/Goose";
import GoosePen, { GoosePenEntity } from "@/models/goose/GoosePen";
import { PoolClient } from "pg";
import gooseRepository from "./gooseRepository";

class GoosePenRepository {

    /**
     * Validates that the plain object has the necessary GoosePenEntity fields
     */
    validateGoosePenEntity(penEntity: any): boolean {
        if (
            !penEntity ||
            typeof penEntity.id !== "string" ||
            typeof penEntity.owner !== "string" ||
            typeof penEntity.size !== "number"
        ) {
            console.error(penEntity);
            throw new Error("Invalid GoosePenEntity");
        }
        return true;
    }

    makeGoosePenObject(penEntity: GoosePenEntity, geese: Goose[] = []): GoosePen {
        this.validateGoosePenEntity(penEntity);
        return new GoosePen(penEntity.id, penEntity.owner, penEntity.size, geese);
    }

    /**
     * Returns all goose pens
     */
    async getAllGoosePens(): Promise<GoosePenEntity[]> {
        const result = await query<GoosePenEntity>("SELECT * FROM goose_pens", []);
        if (!result || result.rows.length === 0) return [];
        return result.rows;
    }

    /**
     * Get a pen by id
     */
    async getGoosePenById(id: string): Promise<GoosePen | null> {
        const result = await query<GoosePenEntity>("SELECT * FROM goose_pens WHERE id = $1", [id]);
        if (!result || result.rows.length === 0) return null;

        const penEntity = result.rows[0];
        // Optionally, fetch geese belonging to this pen
        const geeseResult = await query<any>("SELECT * FROM gooses WHERE owner = $1", [id]);
        const geese = geeseResult.rows.map((g) => Goose.fromPlainObject(g));

        return new GoosePen(penEntity.id, penEntity.owner, penEntity.size, geese);
    }

    /**
     * Get a pen by owner
     */
     async getGoosePenByOwnerId(userId: string): Promise<GoosePenEntity | null> {
        const result = await query<GoosePenEntity>(
            "SELECT * FROM goose_pens WHERE owner = $1",
            [userId]
        );
    
        if (!result || result.rows.length === 0) return null;
    
        const penEntity = result.rows[0];
        return penEntity;
    }
    

    /**
     * Creates a new pen
     */
    async createGoosePen(pen: GoosePen, client?: PoolClient): Promise<GoosePenEntity> {
        const innerFunction = async (client: PoolClient) => {
            const result = await client.query<GoosePenEntity>(
                "INSERT INTO goose_pens (id, owner, size) VALUES ($1, $2, $3) RETURNING *",
                [pen.getId(), pen.getOwner(), pen.getSize()]
            );

            if (!result || result.rows.length === 0) {
                throw new Error("Failed to create GoosePen");
            }
            return result.rows[0];
        };

        return await transactionWrapper(innerFunction, "creating goose pen", client);
    }

    /**
     * Updates pen size or owner
     */
    async updateGoosePen(pen: GoosePen, client?: PoolClient): Promise<GoosePenEntity> {
        const innerFunction = async (client: PoolClient) => {
            const result = await client.query<GoosePenEntity>(
                "UPDATE goose_pens SET owner = $1, size = $2 WHERE id = $3 RETURNING *",
                [pen.getOwner(), pen.getSize(), pen.getId()]
            );

            if (!result || result.rows.length === 0) {
                throw new Error(`Failed to update GoosePen ${pen.getId()}`);
            }

            return result.rows[0];
        };

        return await transactionWrapper(innerFunction, "updating goose pen", client);
    }

    /**
     * Deletes a pen by id
     */
    async deleteGoosePen(id: string, client?: PoolClient): Promise<boolean> {
        const innerFunction = async (client: PoolClient) => {
            const result = await client.query(
                "DELETE FROM goose_pens WHERE id = $1",
                [id]
            );
            return result.rowCount && result.rowCount > 0;
        };

        return await transactionWrapper(innerFunction, "deleting goose pen", client);
    }
}

const goosePenRepository = new GoosePenRepository();
export default goosePenRepository;