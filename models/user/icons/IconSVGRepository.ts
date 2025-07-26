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
		this.Icons['Error'] = iconData.Icons.Error.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.path);}
		);
		this.Icons['Ground'] = iconData.Icons.Ground.map((iconObject: any) =>
		{return new Icon(iconObject.name, iconObject.path);}
	  	);
		this.Icons['Tools'] = iconData.Icons.Tools.map((iconObject: any) =>
		{return new Icon(iconObject.name, iconObject.path);}
		);
		this.Icons['User'] = iconData.Icons.User.map((iconObject: any) =>
		{return new Icon(iconObject.name, iconObject.path);}
		);
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
}

export const iconSVGRepository = new IconSVGRepository();