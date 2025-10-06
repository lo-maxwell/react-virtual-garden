'use client'
import { AccountContext } from "@/app/hooks/contexts/AccountContext";
import { loadAccount, saveAccount } from "@/utils/localStorage/account";
import { ReactNode, useEffect, useState, useCallback, useMemo } from "react";
import { Account } from '@/models/account/Account';
import { AccountSettings } from "@/models/account/AccountSettings";

// Define props for the provider
interface AccountProviderProps {
    children: ReactNode;
}

export const AccountProvider = ({ children }: AccountProviderProps) => {
	const defaultSettings = AccountSettings.getDefaultSettings();
    const [account, setAccount] = useState<Account | null>(null);
	const [guestMode, setGuestMode] = useState<boolean>(defaultSettings.guestMode);
	const [displayEmojiIcons, setDisplayEmojiIcons] = useState<boolean>(defaultSettings.displayEmojiIcons);
	const [confirmDeletePlants, setConfirmDeletePlants] = useState<boolean>(defaultSettings.confirmDeletePlants);
	const [environmentTestKey, setEnvironmentTestKey] = useState<string>('');

	const generateDefaultNewAccount = (): Account => {
		return new Account();
	};
	
	const setupAccount = useCallback((): Account => {
		let tempAccount = loadAccount();
		console.log(tempAccount);
		if (!(tempAccount instanceof Account)) {
		  console.log('account not found, setting up');
		  tempAccount = generateDefaultNewAccount();  
		  saveAccount(tempAccount);
		}
		return tempAccount;
	}, []);

	useEffect(() => {
		const account = setupAccount();
		setAccount(account);
		setGuestMode(account.settings.guestMode);
		setDisplayEmojiIcons(account.settings.displayEmojiIcons);
		setConfirmDeletePlants(account.settings.confirmDeletePlants);
		console.log('loaded account')
	}, [setupAccount]);

	const setGuestModeHandler = useCallback((value: boolean): void => {
		setGuestMode(value);
		if (account) {
			account.settings.guestMode = value;
			saveAccount(account);
		}
	}, [account]);

	const setDisplayEmojiIconsHandler = useCallback((value: boolean): void => {
		setDisplayEmojiIcons(value);
		if (account) {
			account.settings.displayEmojiIcons = value;
			saveAccount(account);
		}
	}, [account]);

	const setConfirmDeletePlantsHandler = useCallback((value: boolean): void => {
		setConfirmDeletePlants(value);
		if (account) {
			account.settings.confirmDeletePlants = value;
			saveAccount(account);
		}
	}, [account]);

	const fetchEnvironmentTestKey = useCallback(async () => {
		try {
			const response = await fetch('/api/test', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch test key');
			}

			const result = await response.json();
			return result;
		} catch (error) {
			console.error(error);
		}
	}, []);

	useEffect(() => {
		const updateTestKey = async () => {
			const testKey = process.env.NEXT_PUBLIC_TEST_ENV_KEY || 'error';
			setEnvironmentTestKey(testKey);
		};

		updateTestKey();
	}, []);

	const contextValue = useMemo(() => ({
		account: account!,
		guestMode,
		setGuestMode: setGuestModeHandler,
		displayEmojiIcons,
		setDisplayEmojiIcons: setDisplayEmojiIconsHandler,
		confirmDeletePlants,
		setConfirmDeletePlants: setConfirmDeletePlantsHandler,
		environmentTestKey
	}), [
		account,
		guestMode,
		setGuestModeHandler,
		displayEmojiIcons,
		setDisplayEmojiIconsHandler,
		confirmDeletePlants,
		setConfirmDeletePlantsHandler,
		environmentTestKey
	]);

    return (
        <AccountContext.Provider value={contextValue}>
            {children}
        </AccountContext.Provider>
    );
};
