import Icon from "./Icon";
import { iconEmojiRepository } from "./IconEmojiRepository";

class IconFactory {
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
		// this.Icons['Error'] = iconData.Icons.Error.map((iconObject: any) =>
		//   {return new Icon(iconObject.name, iconObject.icon);}
		// );
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	

	/**
	 * 
	 * @name the icon name
	 * @returns the found icon image (as a string) or null
	 */
	getIconByName(name: string): string | null {
		const icons = Object.values(this.Icons).flat().filter(icon => icon.getName() === name);
		if (icons.length === 1) return icons[0].getIcon();
		else if (icons.length === 0) return "ERROR";
		else {
			console.error('Error: found multiple icons with the same name!');
			console.error(icons);
			return null;
		}
	}
	
}

export const iconFactory = new IconFactory(iconEmojiRepository.Icons);