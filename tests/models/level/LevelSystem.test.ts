import LevelSystem from "@/models/level/LevelSystem";

let testLevelSystem: LevelSystem;

beforeEach(() => {
	testLevelSystem = new LevelSystem(1, 0, 1);
});

test('Should level up', () => {
	testLevelSystem.addExperience(200);
	expect(testLevelSystem.getLevel()).toBe(2);
	expect(testLevelSystem.getExpToLevelUp()).toBe(300);
	expect(testLevelSystem.getCurrentExp()).toBe(0);
	expect(testLevelSystem.getGrowthRate()).toBe(1);
})

test('Should add xp', () => {
	testLevelSystem.addExperience(100);
	expect(testLevelSystem.getLevel()).toBe(1);
	expect(testLevelSystem.getExpToLevelUp()).toBe(200);
	expect(testLevelSystem.getCurrentExp()).toBe(100);

})

test('Should level up and get overflow xp', () => {
	testLevelSystem.addExperience(1000);
	expect(testLevelSystem.getLevel()).toBe(4);
	expect(testLevelSystem.getExpToLevelUp()).toBe(500);
	expect(testLevelSystem.getCurrentExp()).toBe(100);
})

test('Should gain xp and level with different growth rate', () => {
	testLevelSystem = new LevelSystem(5, 0, 0.5);
	testLevelSystem.addExperience(2000);
	expect(testLevelSystem.getLevel()).toBe(6);
	expect(testLevelSystem.getExpToLevelUp()).toBe(1400);
	expect(testLevelSystem.getCurrentExp()).toBe(800);
})

test('Should calculate xp', () => {
	expect(LevelSystem.calculateExpToLevelUp(1, 1)).toBe(200);
	expect(LevelSystem.calculateExpToLevelUp(1, 2)).toBe(100);
	expect(LevelSystem.calculateExpToLevelUp(2, 1)).toBe(300);
	expect(LevelSystem.calculateExpToLevelUp(2, 2)).toBe(150);
	expect(LevelSystem.calculateExpToLevelUp(3, 1)).toBe(400);
	expect(LevelSystem.calculateExpToLevelUp(3, 2)).toBe(200);
	expect(LevelSystem.calculateExpToLevelUp(4, 1)).toBe(500);
	expect(LevelSystem.calculateExpToLevelUp(4, 2)).toBe(250);
	expect(LevelSystem.calculateExpToLevelUp(5, 1)).toBe(600);
	expect(LevelSystem.calculateExpToLevelUp(5, 2)).toBe(300);
	expect(LevelSystem.getTotalExpForLevel(1, 1)).toBe(0);
	expect(LevelSystem.getTotalExpForLevel(1, 2)).toBe(0);
	expect(LevelSystem.getTotalExpForLevel(2, 1)).toBe(200);
	expect(LevelSystem.getTotalExpForLevel(2, 2)).toBe(100);
	expect(LevelSystem.getTotalExpForLevel(3, 1)).toBe(500);
	expect(LevelSystem.getTotalExpForLevel(3, 2)).toBe(250);
	expect(LevelSystem.getTotalExpForLevel(4, 1)).toBe(900);
	expect(LevelSystem.getTotalExpForLevel(4, 2)).toBe(450);
	expect(LevelSystem.getTotalExpForLevel(5, 1)).toBe(1400);
	expect(LevelSystem.getTotalExpForLevel(5, 2)).toBe(700);

})

test('Should Create LevelSystem Object From PlainObject', () => {
	const serializedLevel = JSON.stringify(testLevelSystem.toPlainObject());
	const item = LevelSystem.fromPlainObject(JSON.parse(serializedLevel));
	expect(item).toBeTruthy();
	expect(item.getCurrentExp()).toBe(0);
	expect(item.getLevel()).toBe(1);
	expect(item.getExpToLevelUp()).toBe(200);
	expect(item.getGrowthRate()).toBe(1);
})