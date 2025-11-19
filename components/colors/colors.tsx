const colors = {

	plant: {
		plotBackgroundColor: "bg-apple-400", //unused, plots have a scaling green based on growtime
		defaultBorderColor: "border border-reno-sand-700",
		grownBorderColor: "border-2 border-yellow-500",
		plotTooltipBackground: "bg-green-400 border-2 border-reno-sand-700",
		categoryTextColor: "text-coffee-700",
	},

	decoration: {
		defaultBorderColor: "border border-reno-sand-700",
		plotBackgroundColor: "bg-reno-sand-100",
		plotTooltipBackground: "bg-reno-sand-100 border-2 border-coffee-600",
		categoryTextColor: "text-coffee-700",
	},

	ground: {
		defaultBorderColor: "border border-reno-sand-700",
		plotBackgroundColor: "bg-reno-sand-100",
		plotTooltipBackground: "bg-reno-sand-100 border-2 border-coffee-600",
		categoryTextColor: "text-coffee-700",
	},

	seed: {
		defaultBorderColor: "border border-reno-sand-700",
		inventoryBackgroundColor: "bg-apple-200",
		inventoryTooltipBackground: "bg-green-400 border-2 border-reno-sand-700",
		categoryTextColor: "text-coffee-700",
	},

	harvested: {
		defaultBorderColor: "border border-reno-sand-700",
		inventoryBackgroundColor: "bg-orange-300",
		inventoryTooltipBackground: "bg-green-400 border-2 border-reno-sand-700",
		categoryTextColor: "text-coffee-700",

	},

	blueprint: {
		defaultBorderColor: "border border-reno-sand-700",
		inventoryBackgroundColor: "bg-cyan-200",
		inventoryTooltipBackground: "bg-reno-sand-100 border-2 border-coffee-600",
		categoryTextColor: "text-coffee-700",
	},

	user: {
		usernameTextColor: "text-coffee-800",
		usernameBackgroundColor: "bg-reno-sand-400",
		usernameBorder: "border border-2 border-coffee-800",
		usernameEditButtonTextColor: "text-coffee-800",
		usernameEditButtonBackgroundColor: "bg-reno-sand-400"
	},

	level: {
		levelTextColor: "text-coffee-800",
		levelBackgroundColor: "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500",
		levelCircleBorder: "border border-4 border-yellow-500",
		levelXPBarFilledColor: "bg-green-500",
		levelXPBarBackgroundColor: "bg-reno-sand-100",
		levelXPBarBorder: "border border-4 border-yellow-500"
	},

	store: {
		storeDefaultItemTextColor: "text-coffee-800",
		storeHighPrice: "text-red-900",
		storeRegularPrice: "text-coffee-700 font-bold",
		storeLowPrice: "text-green-300"
	},

	inventory: {
		inventoryDefaultItemTextColor: "text-coffee-800",
		inventoryHighPrice: "text-green-300",
		inventoryRegularPrice: "text-coffee-800",
		inventoryLowPrice: "text-green-300",
		inventoryItemBorderColor: "border-2 border-apple-600",
		inventoryFocusBackgroundColor: "bg-purple-200",
		inventoryHoverBackgroundColor: "hover:bg-purple-200",
		inventoryHoverTextColor: "hover:text-coffee-800"
	},

	tool: {
		descriptionTextColor: "text-coffee-800",
		toolFocusBackgroundColor: "bg-moon-mist-300",
		toolBorderColor: "border-4 border-apple-600",
		backgroundColor: "hover:bg-moon-mist-300 bg-moon-mist-400",
	},

	error: {
		redErrorText: "text-red-600"
	}

	
}

export default colors;