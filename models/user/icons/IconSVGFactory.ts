import Icon from "./Icon";
import { iconSVGRepository } from "./IconSVGRepository";

class IconSVGFactory {
	Icons: Record<string, Icon[]> = {};

	constructor(icons: Record<string, Icon[]>) {
		this.loadIcons(icons);
	}

	loadIcons(icons: Record<string, Icon[]>) {
		Object.keys(icons).forEach((type) => {
			this.Icons[type] = icons[type].map((iconObject: any) => {
				// Construct the SVG path dynamically
				const iconPath = `/assets/icons/${type.toLowerCase()}/${iconObject.icon}`;
				return new Icon(iconObject.name, iconPath);
			});
		});
	}

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
	getDefaultErrorIcon(): Icon {
		return new Icon("default", "/assets/icons/error/error.svg");
	}

	iconExists(name: string): boolean {
		if (name === 'error') return false;
		return Object.values(this.Icons).flat().filter(icon => icon.getName() === name).length === 1;
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

export const iconSVGFactory = new IconSVGFactory(iconSVGRepository.Icons);