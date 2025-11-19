import Icon from "./Icon";
import iconData from "@/data/final/current/SVGIcons.json";

class IconSVGRepository {
	Icons: Record<string, Icon[]> = {};

	constructor() {
		this.loadIcons();
	}

	loadIcons() {
		this.Icons = Object.fromEntries(
		  Object.entries(iconData.Icons).map(([category, list]) => [
			category,
			list.map(icon => new Icon(icon.name, icon.path))
		  ])
		);
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
}

export const iconSVGRepository = new IconSVGRepository();