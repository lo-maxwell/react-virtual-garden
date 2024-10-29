import { useUser } from '@/app/hooks/contexts/UserContext';
import React, { useState } from 'react';
import colors from '../colors/colors';

const UsernameDisplay = ({ username, onUsernameChange }: { username: string, onUsernameChange: Function}) => {
    const [editing, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(username);
    const { user } = useUser();

    const handleEdit = () => {
        setEditing(true);
    };

    const handleSave = () => {
        if (newUsername !== user.getUsername()) {
            onUsernameChange(newUsername);
        }
        setEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    };

    const getUsernameFontSize = () => {
		if (username.length > 20) {
			return 'text-base';
		} else if (username.length > 16) {
			return 'text-lg';
		} else if (username.length > 12) {
			return 'text-xl';
		} else if (username.length > 8) {
			return 'text-2xl';
		}
		return 'text-3xl';
	}

    return (
        <>
            {editing ? (
                <span className="flex flex-row justify-center">
                    <input type="text" 
					maxLength={24}
					value={newUsername} 
					onChange={handleChange} 
					className={`border-none text-2xl ml-2 px-2 py-1 w-[16ch] ${getUsernameFontSize()} ${colors.user.usernameTextColor}`}/>
                    <button onClick={handleSave}
							className={`ml-2 my-4 px-2 text-xl rounded-lg ${colors.user.usernameEditButtonTextColor} ${colors.user.usernameEditButtonBackgroundColor}`}>
						Save</button>
                </span>
            ) : (
                <span className="flex flex-row justify-center items-center">
                    <span className={`px-2 py-1 text-2xl align-bottom ${getUsernameFontSize()} ${colors.user.usernameTextColor}`}>{username}</span>
                    <button onClick={handleEdit}
							className={`ml-2 my-4 px-2 text-xl rounded-lg ${colors.user.usernameEditButtonTextColor} ${colors.user.usernameEditButtonBackgroundColor}`}>
						Edit
					</button>
                </span>
            )}
        </>
    );
}

export default UsernameDisplay;