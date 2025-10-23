import { useAccount } from '@/app/hooks/contexts/AccountContext';
import { useUser } from '@/app/hooks/contexts/UserContext';
import { itemTemplateFactory } from '@/models/items/templates/models/ItemTemplateFactory';
import Icon from '@/models/user/icons/Icon';
import { iconEmojiFactory } from '@/models/user/icons/IconEmojiFactory';
import { iconSVGFactory } from '@/models/user/icons/IconSVGFactory';
import React, { useState } from 'react';
import DropdownMenu from '../../lists/DropdownMenu';
import { PopupWindow } from '../../window/popupWindow';
import IconButton from './IconButton';

const IconSelector = ({ iconIndex, onIconChange }: {iconIndex: string, onIconChange: Function}) => {
    const [showAllIcons, setShowAllIcons] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string | null>('');
    const { user } = useUser();
    const { displayEmojiIcons } = useAccount();
    const showAllIconsWindow = () => {
        setShowAllIcons(true);
    }

    function getIconFactory() {
        if (displayEmojiIcons) return iconEmojiFactory;
        else return iconSVGFactory;
    }

    const onIconClick = (iconOption: Icon) => {
        if (iconOption.getName() !== user.getIcon()) {
            onIconChange(iconOption);
        }
        setShowAllIcons(false);
    }

    const RenderCategoryFilter = () => {
		const categories = getIconFactory().getIconCategories();
		const selectCategoryFilter = (value: string | null) => {
			setCategoryFilter(value);
		}

		return (<>
            <DropdownMenu
                label="Filter by Category"
                options={categories}
                selectedValue={categoryFilter}
                onChange={selectCategoryFilter}
                renderOptionLabel={(option) => option} // Just return the option since it's a string
            />
		</>
		);
	}

    const RenderIconChoices = () => {
        const iconSet: Icon[] = [];
        let factory = getIconFactory();
        let availableIcons = factory.Icons;
        if (!categoryFilter || categoryFilter === '') {
            factory.getIconCategories().map((categoryName) => {
                availableIcons[categoryName].map((iconOption) => {
                    if(user.isIconUnlocked(iconOption, displayEmojiIcons)) {
                        iconSet.push(iconOption);
                    }
                })
            });
        } else {
            availableIcons[categoryFilter].map((iconOption) => {
                if(user.isIconUnlocked(iconOption, displayEmojiIcons)) {
                    iconSet.push(iconOption);
                }
            });
        }

        if (iconSet.length === 0) {
            return <div className="max-h-[60vh] overflow-y-auto">
                No icons found. Try another category!
            </div>;
        }

        return <div className="max-h-[60vh] overflow-y-auto flex flex-wrap justify-center gap-4">
            {iconSet.map((iconOption) => (
                <IconButton key={iconOption.getName() + iconOption.getIcon()} icon={iconOption.getName()} onClickFunction={() => onIconClick(iconOption)} bgColor={`bg-blue-300`} borderColor={`border-2 border-coffee-700`} textSize={"text-8xl"} elementSize={"100"}/>
            ))}
          </div>;
    }

    
	return (
        <span className="icon-selector">
            <IconButton icon={iconIndex} onClickFunction={showAllIconsWindow} bgColor={`bg-blue-300`} borderColor={`border border-2 border-coffee-700`} textSize={"text-5xl"} elementSize={"16"}/>
            <PopupWindow showWindow={showAllIcons} setShowWindow={setShowAllIcons}>
                <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
                    <div className="text-2xl text-semibold"> Select a new icon: </div>
                    <div className="text-xl mb-2">{RenderCategoryFilter()}</div>
                    <div className="text-sm mb-4">Plant crops or place decorations to unlock new icons.</div>
                    {RenderIconChoices()}
                    </div>
            </PopupWindow>
        </span>
    );
}

export default IconSelector;