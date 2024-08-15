import React, { useState } from 'react';
import colors from '../colors/colors';

const UsernameDisplay = ({ username, onUsernameChange }: { username: string, onUsernameChange: Function}) => {
    const [editing, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(username);

    const handleEdit = () => {
        setEditing(true);
    };

    const handleSave = () => {
        onUsernameChange(newUsername);
        setEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    };

    return (
        <>
            {editing ? (
                <span className="flex flex-row justify-center">
                    <input type="text" 
					maxLength={24}
					value={newUsername} 
					onChange={handleChange} 
					className={`border-none text-3xl ml-2 px-2 py-1 w-[16ch] ${colors.user.usernameTextColor}`}/>
                    <button onClick={handleSave}
							className={`ml-2 my-4 px-2 text-xl rounded-lg ${colors.user.usernameEditButtonTextColor} ${colors.user.usernameEditButtonBackgroundColor}`}>
						Save</button>
                </span>
            ) : (
                <span className="flex flex-row justify-center items-center">
                    <span className={`px-2 py-1 text-3xl align-bottom ${colors.user.usernameTextColor}`}>{username}</span>
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