import Icon from "./Icon";
import { iconSVGRepository } from "./IconSVGRepository";

export class IconSVGFactory {
	Icons: Record<string, Icon[]> = {};

	constructor(icons: Record<string, Icon[]>) {
		this.loadIcons(icons);
	}

	loadIcons(icons: Record<string, Icon[]>) {
		Object.keys(icons).forEach((type) => {
			this.Icons[type] = icons[type].map((iconObject: any) => {
				// Construct the SVG path dynamically
				const iconPath = `/assets/icons/${type.toLowerCase()}/${iconObject.name}.svg`;
				return new Icon(iconObject.name, iconPath);
			});
		});
	}

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
	static getDefaultErrorIcon(): Icon {
		return new Icon("error", "/assets/icons/error/error.svg");
	}

	/**
	 * 
	 * @name the icon name
	 * @returns the found icon image (as a string) or null
	 */
	getIconByName(name: string): string | null {
		const icons = Object.values(this.Icons).flat().filter(icon => icon.getName() === name);
		if (icons.length === 1) return icons[0].getIcon();
		else if (icons.length === 0) return IconSVGFactory.getDefaultErrorIcon().getIcon();
		else {
			console.error('Error: found multiple icons with the same name!');
			console.error(icons);
			return IconSVGFactory.getDefaultErrorIcon().getIcon();
		}
	}
	
}

export const iconSVGFactory = new IconSVGFactory(iconSVGRepository.Icons);