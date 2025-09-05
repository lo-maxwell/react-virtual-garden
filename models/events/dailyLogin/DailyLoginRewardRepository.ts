import dailyLoginData from '@/data/final/current/DailyLoginRewards.json';
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { InventoryItemList } from "@/models/itemStore/InventoryItemList";

interface RewardConfigItem {
    id: string;
    name: string;
    quantity: number;
}

interface RewardSet {
    maxQuantity: number;
    maxItems: number;
    items: RewardConfigItem[];
}

interface DailyLoginConfig {
    defaultRewards: {
        normal: RewardSet;
        weeklyBonus: RewardSet;
    };
}

export class DailyLoginRewardRepository {
    private config: DailyLoginConfig;

    constructor() {
        this.config = dailyLoginData;
    }

    getDailyLoginConfig(): DailyLoginConfig {
        // Return a deep copy to prevent external modification
        return JSON.parse(JSON.stringify(this.config));
    }
}

export const dailyLoginRewardRepository = new DailyLoginRewardRepository();
