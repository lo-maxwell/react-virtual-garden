import Icon from '@/models/user/icons/Icon';
import { iconRepository } from '@/models/user/icons/IconRepository';
import React, { useState } from 'react';
import DropdownComponent from '../lists/DropdownComponent';
import { PopupWindow } from '../window/popupWindow';

const availableIcons = iconRepository.Icons; // Example list of icons

const IconSelector = ({ iconIndex, onIconChange }: {iconIndex: string, onIconChange: Function}) => {
    const [showAllIcons, setShowAllIcons] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string | null>('');
    const showAllIconsWindow = () => {
        setShowAllIcons(true);
    }

    const onIconClick = (iconOption: Icon) => {
        setShowAllIcons(false);
        return onIconChange(iconOption.getName());
    }

    const RenderCategoryFilter = () => {
		const categories = iconRepository.getIconCategories();
		const selectCategoryFilter = (value: string | null) => {
			setCategoryFilter(value);
		}

		return (<>
            <DropdownComponent
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
            iconRepository.getIconCategories().map((categoryName) => {
                availableIcons[categoryName].map((iconOption) => {
                    iconSet.push(iconOption);
                })
            });
        } else {
            availableIcons[categoryFilter].map((iconOption) => {
                iconSet.push(iconOption);
            });
        }

        const chunkedIcons = [];
        // Chunk the icons into arrays of 5
        for (let i = 0; i < iconSet.length; i += 5) {
            chunkedIcons.push(iconSet.slice(i, i + 5));
        }

        // return (<>
        // {iconSet.map((iconOption) => (
        //     <button key={iconOption.getName()} onClick={() => onIconClick(iconOption)}>
        //         <span>{iconRepository.getIconByName(iconOption.getName())}</span>
        //     </button>
        // ))}</>);
        return chunkedIcons.map((iconGroup, index) => (
            <div key={index} className="flex space-x-2 mb-2"> {/* Flexbox for horizontal alignment */}
              {iconGroup.map((iconOption) => (
                <button key={iconOption.getName()} onClick={() => onIconClick(iconOption)}>
                  <span>{iconRepository.getIconByName(iconOption.getName())}</span>
                </button>
              ))}
            </div>
          ));
    }

    
	return (
        <span className="icon-selector">
            <button onClick={showAllIconsWindow} className="px-1 py-1 border border-2 border-coffee-700 align-text-bottom text-center bg-gray-300 min-w-12 min-h-12 text-3xl text-purple-600 font-semibold rounded-lg" >{iconRepository.getIconByName(iconIndex)}</button>
            <PopupWindow showWindow={showAllIcons} setShowWindow={setShowAllIcons}>
                <div className="text-8xl w-max bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
                    <div className="text-xl my-4">{RenderCategoryFilter()}</div>
                    {RenderIconChoices()}
                    </div>
            </PopupWindow>
        </span>
    );
}

export default IconSelector;