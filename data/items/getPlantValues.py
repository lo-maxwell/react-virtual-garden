def main():
	baseGold = 1
	baseExp = 0.1
	goldMultiplier = {'slow': 1.2, 'medium': 1, 'fast': 0.8}
	expMultiplier = {'slow': 0.8, 'medium': 1, 'fast': 1.5}
	roi = {'slow': 5, 'medium': 3, 'fast': 2}

	growTime = 300 #in seconds
	plantType = 'slow'
	shopSellMultiplier = 2.0

	plantGold = growTime * goldMultiplier[plantType] * baseGold
	plantExp = growTime * expMultiplier[plantType] * baseExp
	seedCost = plantGold * 1.0/(roi[plantType] - 1.0) / shopSellMultiplier
	harvestValue = plantGold + seedCost * shopSellMultiplier

	print('value: ', plantGold)
	print('baseExp: ', plantExp)
	print('seedValue: ', seedCost)
	print('harvest value: ', harvestValue)



main()	