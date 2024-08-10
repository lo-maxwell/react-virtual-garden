class Icon {
	private name: string;
	private icon: string;

	constructor(name: string, icon: string) {
		this.name = name;
		this.icon = icon;
	}

	getName() {
		return this.name;
	}

	getIcon() {
		return this.icon;
	}

}

export default Icon;