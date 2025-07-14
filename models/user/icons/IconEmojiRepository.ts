import Icon from "./Icon";
import iconData from "@/data/final/current/Icons.json";

class IconEmojiRepository {
	Icons: Record<string, Icon[]> = {};

	constructor() {
		this.loadIcons();
	}

	loadIcons() {
		// Example to load PlacedItems > Plants
		this.Icons['Plants'] = iconData.Icons.Plants.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		this.Icons['Decorations'] = iconData.Icons.Decorations.map((iconObject: any) =>
		  {return new Icon(iconObject.name, iconObject.icon);}
		);
		// this.Icons['Error'] = iconData.Icons.Error.map((iconObject: any) =>
		//   {return new Icon(iconObject.name, iconObject.icon);}
		// );
	  }

	getIconCategories() {
		return Object.keys(this.Icons);
	}
	
}

export const iconEmojiRepository = new IconEmojiRepository();