'use client'
import { UserContext } from '@/hooks/contexts/UserContext';
import User from '@/models/user/User';
import { loadUser, saveUser } from '@/utils/localStorage/user';
import React, { ReactNode, useEffect, useState } from 'react';

// Define props for the provider
interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
	const [username, setUsername] = useState<string | null>(null);
	const [icon, setIcon] = useState<string | null>(null);

	function setupUser(username: string): User {
		let user = loadUser();
		console.log(user);
		if (!(user instanceof User)) {
		  console.log('user not found, setting up');
		  user = new User(username, "apple");
		  saveUser(user);
		}
		if (user.getIcon() === 'error') {
			console.log('user data corrupted, resetting');
			console.log(user);
			user = new User(username, "apple");
			saveUser(user);
		}
		return user;
	  }

	useEffect(() => {
		const user = setupUser("Test User");
		setUser(user);
		setUsername(user.getUsername());
		setIcon(user.getIcon());
	}, []);

	function handleChangeUsername(newUsername: string) {
		if (!user) return;
		user.setUsername(newUsername);
		setUsername(newUsername);
		saveUser(user);
	}

	function handleChangeIcon(newIcon: string) {
		if (!user) return;
		user.setIcon(newIcon);
		setIcon(newIcon);
		saveUser(user);
	}

    return (
        <UserContext.Provider value={{ user: user!, username: username!, handleChangeUsername, icon: icon!, handleChangeIcon }}>
            {children}
        </UserContext.Provider>
    );
};