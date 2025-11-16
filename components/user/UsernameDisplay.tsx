import { useUser } from '@/app/hooks/contexts/UserContext';
import React, { useState, useCallback, useMemo } from 'react';
import colors from '../colors/colors';

const UsernameDisplay = ({ username, onUsernameChange }: { username: string, onUsernameChange: Function}) => {
    const [editing, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(username);
    const { user } = useUser();

    const handleEdit = useCallback(() => {
        setEditing(true);
    }, []);

    const handleSave = useCallback(() => {
        if (newUsername !== user.getUsername()) {
            onUsernameChange(newUsername);
        }
        setEditing(false);
    }, [newUsername, user, onUsernameChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    }, []);

    return (
        <>
            {editing ? (
                <span className="relative flex flex-row justify-left items-center">
                    <input type="text" 
					maxLength={24}
					value={newUsername} 
					onChange={handleChange} 
					className={`rounded-lg text-2xl px-1 ${colors.user.usernameTextColor}`}/>
                    <button onClick={handleSave}
							className={`absolute right-0 ml-2 px-2 text-2xl rounded-lg ${colors.user.usernameEditButtonTextColor} ${colors.user.usernameEditButtonBackgroundColor}`}>
						Save</button>
                </span>
            ) : (
                <span className="relative flex flex-row justify-left items-center">
                    <span className={`text-2xl px-1 ${colors.user.usernameTextColor}`}>{username}</span>
                    <button onClick={handleEdit}
							className={`absolute right-0 ml-2 px-2 text-2xl rounded-lg ${colors.user.usernameEditButtonTextColor} ${colors.user.usernameEditButtonBackgroundColor}`}>
						Edit
					</button>
                </span>
            )}
        </>
    );
}

export default UsernameDisplay;
