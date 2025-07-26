import Icon from "./Icon";
import { iconEmojiRepository } from "./IconEmojiRepository";

class IconEmojiFactory {
	Icons: Record<string, Icon[]> = {};

	constructor(icons: Record<string, Icon[]>) {
		this.loadIcons(icons);
	}

	loadIcons(icons: Record<string, Icon[]>) {
		// Example to load PlacedItems > Plants
		this.Icons['Plants'] = icons.Plants.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		this.Icons['Decorations'] = icons.Decorations.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		this.Icons['Ground'] = icons.Ground.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		this.Icons['Error'] = icons.Error.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		this.Icons['Tools'] = icons.Tools.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
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
			console.error('Error: found multiple icons with the same name!');
			console.error(icons);
			return this.getDefaultErrorIcon().getIcon();
		}
	}
	
}

export const iconEmojiFactory = new IconEmojiFactory(iconEmojiRepository.Icons);