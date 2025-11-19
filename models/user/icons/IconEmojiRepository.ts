import Icon from "./Icon";
import iconData from "@/data/final/current/Icons.json";

class IconEmojiRepository {
	Icons: Record<string, Icon[]> = {};

	constructor() {
		this.loadIcons();
	}

	loadIcons() {
		this.Icons = Object.fromEntries(
		  Object.entries(iconData.Icons).map(([category, list]) => [
			category,
			list.map(icon => new Icon(icon.name, icon.icon))
		  ])
		);
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
}

export const iconEmojiRepository = new IconEmojiRepository();