class LevelSystem {
	//No maximum level for now
	private level: number;
	private currentExp: number;
	private expToLevelUp: number;
	private growthRate: number;

	/**
	 * @param startingLevel - the initial level
	 * @param currentExp - the initial xp
	 * @param growthRate - divides the amount of xp needed per level. higher values = less xp.
	 */
	constructor(startingLevel: number = 1, currentExp: number = 0, growthRate: number = 1) {
		this.level = startingLevel;
		this.currentExp = currentExp;
		this.expToLevelUp = LevelSystem.calculateExpToLevelUp(startingLevel, growthRate);
		this.growthRate = growthRate;
	}

	static fromPlainObject(plainObject: any): LevelSystem {
		if (!plainObject || typeof plainObject !== 'object') {
			console.error('Error creating LevelSystem from plainObject: Invalid plainObject structure for LevelSystem')
			return new LevelSystem();
		}
		// Initialize default values
		let level = 1;
		let currentExp = 0;
		let growthRate = 1;

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
		return new LevelSystem(level, currentExp, growthRate);
	}

	toPlainObject(): any {
		return {
			level: this.level,
			currentExp: this.currentExp,
			growthRate: this.growthRate,
		  };
	} 

	addExperience(exp: number) {
		this.currentExp += exp;
		while (this.currentExp >= this.expToLevelUp) {
			this.currentExp -= this.expToLevelUp;
			this.levelUp();
		}
	}

	/** 
	 * @returns the current level
	 */
	getLevel() {
		return this.level;
	}

	/**
	 * @returns the current xp
	 */
	getCurrentExp() {
		return this.currentExp;
	}

	/**
	 * @returns the amount of xp needed to level up (total, not considering how much current xp)
	 */
	getExpToLevelUp() {
		return this.expToLevelUp;
	}

	/**
	 * @returns the growth rate. 2 = half xp needed, 0.5 = double xp needed per level.
	 */
	getGrowthRate() {
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
}

export default LevelSystem;