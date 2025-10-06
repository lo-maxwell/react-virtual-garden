'use client'
import { UserContext } from '@/app/hooks/contexts/UserContext';
import Icon from '@/models/user/icons/Icon';
import User from '@/models/user/User';
import { loadUser, saveUser } from '@/utils/localStorage/user';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
	// Initialize with a placeholder User object; will be replaced with localStorage data in useEffect
	const [user, setUser] = useState<User>(User.generateDefaultNewUser());
	const [username, setUsername] = useState<string>(user.getUsername());
	const [icon, setIcon] = useState<string>(user.getIcon());
  
	// Update state from localStorage on mount
	useEffect(() => {
	  const loaded = loadUser();
	  if (!(loaded instanceof User) || loaded.getIcon() === 'error') {
		const newUser = User.generateDefaultNewUser();
		saveUser(newUser);
		setUser(newUser);
		setUsername(newUser.getUsername());
		setIcon(newUser.getIcon());
	  } else {
		setUser(loaded);
		setUsername(loaded.getUsername());
		setIcon(loaded.getIcon());
	  }
	}, []);
  
	// Stable callbacks
	const handleChangeUsername = useCallback((newUsername: string) => {
	  user.setUsername(newUsername);
	  setUsername(newUsername);
	  saveUser(user);
	}, [user]);
  
	const handleChangeIcon = useCallback((newIcon: Icon) => {
	  user.setIcon(newIcon.getName());
	  setIcon(newIcon.getName());
	  saveUser(user);
	}, [user]);
  
	const resetUser = useCallback(() => {
	  const newUser = User.generateDefaultNewUser();
	  setUser(newUser);
	  setUsername(newUser.getUsername());
	  setIcon(newUser.getIcon());
	  saveUser(newUser);
	}, []);
  
	const reloadUser = useCallback(() => {
	  const loaded = loadUser();
	  const u = (loaded instanceof User) ? loaded : User.generateDefaultNewUser();
	  setUser(u);
	  setUsername(u.getUsername());
	  setIcon(u.getIcon());
	}, []);
  
	// Memoized context value
	const contextValue = useMemo(() => ({
	  user,
	  username,
	  icon,
	  handleChangeUsername,
	  handleChangeIcon,
	  resetUser,
	  reloadUser
	}), [user, username, icon, handleChangeUsername, handleChangeIcon, resetUser, reloadUser]);
  
	return (
	  <UserContext.Provider value={contextValue}>
		{children}
	  </UserContext.Provider>
	);
  };