import { useUser } from '@/app/hooks/contexts/UserContext';
import { itemTemplateFactory } from '@/models/items/templates/models/ItemTemplateFactory';
import Icon from '@/models/user/icons/Icon';
import { iconFactory } from '@/models/user/icons/IconFactory';
import React, { useState } from 'react';
import DropdownMenu from '../../lists/DropdownMenu';
import { PopupWindow } from '../../window/popupWindow';
import IconButton from './IconButton';

const availableIcons = iconFactory.Icons; // Example list of icons

const IconSelector = ({ iconIndex, onIconChange }: {iconIndex: string, onIconChange: Function}) => {
    const [showAllIcons, setShowAllIcons] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string | null>('');
    const { user } = useUser();
    const showAllIconsWindow = () => {
        setShowAllIcons(true);
    }

    const onIconClick = (iconOption: Icon) => {
        if (iconOption.getName() !== user.getIcon()) {
            onIconChange(iconOption);
        }
        setShowAllIcons(false);
    }

    const RenderCategoryFilter = () => {
		const categories = iconFactory.getIconCategories();
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

        if (!categoryFilter || categoryFilter === '') {
            iconFactory.getIconCategories().map((categoryName) => {
                availableIcons[categoryName].map((iconOption) => {
                    if(user.isIconUnlocked(iconOption)) {
                        iconSet.push(iconOption);
                    }
                })
            });
        } else {
            availableIcons[categoryFilter].map((iconOption) => {
                if(user.isIconUnlocked(iconOption)) {
                    iconSet.push(iconOption);
                }
            });
        }

        const chunkedIcons = [];
        // Chunk the icons into arrays of 5
        for (let i = 0; i < iconSet.length; i += 5) {
            chunkedIcons.push(iconSet.slice(i, i + 5));
        }

        if (chunkedIcons.length === 0) {
            return <div className="max-h-[60vh] overflow-y-auto">
                No icons found. Try another category!
            </div>;
        }

        return <div className="max-h-[60vh] overflow-y-auto">
            {chunkedIcons.map((iconGroup, index) => (
            <div key={index} className="flex flex-row mx-4 my-4"> {/* Flexbox for horizontal alignment */}
              {iconGroup.map((iconOption) => (
                <IconButton key={iconOption.getName()} icon={iconOption.getName()} onClickFunction={() => onIconClick(iconOption)} bgColor={`gray-300`} borderColor={`coffee-700`} textSize={"text-8xl"} elementSize={"100"}/>
              ))}
            </div>
          ))}
          </div>;
    }

    
	return (
        <span className="icon-selector">
            <IconButton icon={iconIndex} onClickFunction={showAllIconsWindow} bgColor={`gray-300`} borderColor={`coffee-700`} textSize={"text-4xl"} elementSize={"12"}/>
            <PopupWindow showWindow={showAllIcons} setShowWindow={setShowAllIcons}>
                <div className="w-max bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
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