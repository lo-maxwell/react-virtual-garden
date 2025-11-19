import Icon from "./Icon";
import { iconEmojiRepository } from "./IconEmojiRepository";

class IconEmojiFactory {
	Icons: Record<string, Icon[]> = {};

	constructor(icons: Record<string, Icon[]>) {
		this.loadIcons(icons);
	}

	loadIcons(icons: Record<string, Icon[]>) {
		for (const category of Object.keys(icons)) {
		  this.Icons[category] = icons[category].map(
			(iconObject: any) => new Icon(iconObject.name, iconObject.icon)
		  );
		}
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}

	getDefaultErrorIcon() {
		return new Icon("error", "❌");
	}
	

	/**
	 * 
	 * @name the icon name
	 * @returns the found icon image (as a string)
	 */
	getIconByName(name: string): string {
		const icons = Object.values(this.Icons).flat().filter(icon => icon.getName() === name);
		if (icons.length === 1) return icons[0].getIcon();
		else if (icons.length === 0) return this.getDefaultErrorIcon().getIcon();
		else {
			return this.getDefaultErrorIcon().getIcon();
		}
	}
	
}

export const iconEmojiFactory = new IconEmojiFactory(iconEmojiRepository.Icons);