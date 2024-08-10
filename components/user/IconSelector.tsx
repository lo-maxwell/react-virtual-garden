import { iconRepository } from '@/models/user/icons/IconRepository';
import React from 'react';

const availableIcons = iconRepository.Icons; // Example list of icons

const IconSelector = ({ iconIndex, onIconChange }: {iconIndex: string, onIconChange: Function}) => {
    
	return (
        <div className="icon-selector">
            <span>{iconRepository.getIconByName(iconIndex)}</span>
            <div>
                {availableIcons['Plants'].map((iconOption) => (
                    <button key={iconOption.getName()} onClick={() => onIconChange(iconOption.getName())}>
                        <span>{iconRepository.getIconByName(iconOption.getName())}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default IconSelector;