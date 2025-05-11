import { v4 as uuidv4 } from 'uuid';

export interface LevelSystemEntity {
	id: string;
	total_xp: number;
	growth_rate: number;
}

class LevelSystem {
	//No maximum level for now
	private levelSystemId: string;
	private level: number;
	private currentExp: number;
	private expToLevelUp: number;
	private growthRate: number;

	/**
	 * @startingLevel the initial level
	 * @currentExp the initial xp
	 * @growthRate divides the amount of xp needed per level. higher values = less xp.
	 */
	constructor(levelSystemId: string, startingLevel: number = 1, currentExp: number = 0, growthRate: number = 1) {
		this.levelSystemId = levelSystemId;
		this.level = startingLevel;
		this.currentExp = currentExp;
		this.expToLevelUp = LevelSystem.calculateExpToLevelUp(startingLevel, growthRate);
		this.growthRate = growthRate;
		//TODO: Test this, should auto level to the right numbers
		while(this.expToLevelUp < this.currentExp) {
			this.currentExp -= this.expToLevelUp;
			this.levelUp();
		}
	}

	static fromPlainObject(plainObject: any): LevelSystem {
		let levelSystemId = uuidv4();
		if (!plainObject || typeof plainObject !== 'object') {
			console.error('Error creating LevelSystem from plainObject: Invalid plainObject structure for LevelSystem')
			return new LevelSystem(levelSystemId);
		}
		// Initialize default values
		let level = 1;
		let currentExp = 0;
		let growthRate = 1;

		// Validate and assign level
		if (plainObject && typeof plainObject.levelSystemId === 'string') {
			levelSystemId = plainObject.levelSystemId;
		}

		// Validate and assign level
		if (plainObject && typeof plainObject.level === 'number') {
			level = plainObject.level;
		}

		// Validate and assign currentExp
		if (plainObject && typeof plainObject.currentExp === 'number') {
			currentExp = plainObject.currentExp;
		}

		// Validate and assign growthRate
		if (plainObject && typeof plainObject.growthRate === 'number') {
			growthRate = plainObject.growthRate;
		}

		// Create a new LevelSystem instance with the validated values
		return new LevelSystem(levelSystemId, level, currentExp, growthRate);
	}

	toPlainObject(): any {
		return {
			levelSystemId: this.levelSystemId,
			level: this.level,
			currentExp: this.currentExp,
			growthRate: this.growthRate,
		  };
	}
	
	clone(): LevelSystem {
		return new LevelSystem(this.levelSystemId, this.level, this.currentExp, this.growthRate);
	}

	toLevelSystemEntity(): LevelSystemEntity {
		return {
			id: this.getLevelSystemId(),
			total_xp: LevelSystem.getTotalExpForLevel(this.getLevel(), this.getGrowthRate()) + this.getCurrentExp(),
			growth_rate: this.getGrowthRate()
		}
	}

	addExperience(exp: number) {
		this.currentExp += exp;
		while (this.currentExp >= this.expToLevelUp) {
			this.currentExp -= this.expToLevelUp;
			this.levelUp();
		}
	}

	/** 
	 * @returns the level system id for database access
	 */
	 getLevelSystemId(): string {
		return this.levelSystemId;
	}

	/** 
	 * @returns the current level
	 */
	getLevel(): number {
		return this.level;
	}

	/**
	 * @returns the current xp
	 */
	getCurrentExp(): number {
		return this.currentExp;
	}

	/**
	 * @returns the total xp
	 */
	getTotalExp(): number {
		return LevelSystem.getTotalExpForLevel(this.getLevel(), this.getGrowthRate()) + this.getCurrentExp();
	}

	/**
	 * @returns the amount of xp needed to level up (total, not considering how much current xp)
	 */
	getExpToLevelUp(): number {
		return this.expToLevelUp;
	}

	/**
	 * @returns the growth rate. 2 = half xp needed, 0.5 = double xp needed per level.
	 */
	getGrowthRate(): number {
		return this.growthRate;
	}

	private levelUp() {
		this.level++;
		this.expToLevelUp = LevelSystem.calculateExpToLevelUp(this.level, this.growthRate);
	}

	static calculateExpToLevelUp(currentLevel: number, growthRate: number): number {
		return Math.floor((currentLevel + 1) * 100 / growthRate);
	}

	static getTotalExpForLevel(level: number, growthRate: number): number {
		// let totalExp = 0;
		// for (let i = 1; i < level; i++) {
		//   totalExp += this.calculateExpToLevelUp(i, growthRate);
		// }
		// return totalExp;
		if (level <= 1) return 0;

		const n = level - 1;
		const firstTerm = this.calculateExpToLevelUp(1, growthRate);
		const lastTerm = this.calculateExpToLevelUp(n, growthRate);

		const sum = (n / 2) * (firstTerm + lastTerm);
		return Math.floor(sum);
	  }
	
	static getLevelForTotalExp(totalExp: number, growthRate: number): number {
		if (totalExp <= 0) return 1;
		let requiredExp = 0;
		let level = 1;
		while (requiredExp < totalExp) {
			requiredExp += LevelSystem.calculateExpToLevelUp(level, growthRate);
			if (requiredExp > totalExp) break;
			level += 1;
		}
		return level;
	}
}

export default LevelSystem;