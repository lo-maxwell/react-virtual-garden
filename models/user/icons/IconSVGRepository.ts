import Icon from "./Icon";
import iconData from "@/data/final/current/SVGIcons.json";

class IconSVGRepository {
	Icons: Record<string, Icon[]> = {};

	constructor() {
		this.loadIcons();
	}

	loadIcons() {
		// Example to load PlacedItems > Plants
		this.Icons['Plants'] = iconData.Icons.Plants.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.path);}
		);
		this.Icons['Decorations'] = iconData.Icons.Decorations.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.path);}
		);
		// this.Icons['Error'] = iconData.Icons.Error.map((iconObject: any) =>
		//   {return new Icon(iconObject.name, iconObject.icon);}
		// );
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
}

export const iconSVGRepository = new IconSVGRepository();