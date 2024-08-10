import React, { useState } from 'react';

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
        <div className="username-display">
            {editing ? (
                <>
                    <input type="text" value={newUsername} onChange={handleChange} />
                    <button onClick={handleSave}>Save</button>
                </>
            ) : (
                <>
                    <span>{username}</span>
                    <button onClick={handleEdit}>Edit</button>
                </>
            )}
        </div>
    );
}

export default UsernameDisplay;