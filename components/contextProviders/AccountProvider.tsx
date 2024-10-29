'use client'
import { AccountContext } from "@/app/hooks/contexts/AccountContext";
import { loadAccount, saveAccount } from "@/utils/localStorage/account";
import { ReactNode, useEffect, useState } from "react";
import { Account } from '@/models/account/Account';

// Define props for the provider
interface AccountProviderProps {
    children: ReactNode;
}

export const AccountProvider = ({ children }: AccountProviderProps) => {
    const [account, setAccount] = useState<Account | null>(null);
	const [cloudSave, setCloudSave] = useState<boolean>(false);

	function generateDefaultNewAccount(): Account {
		return new Account(false);
	}
	
	function setupAccount(): Account {
		let tempAccount = loadAccount();
		console.log(tempAccount);
		if (!(tempAccount instanceof Account)) {
		  console.log('account not found, setting up');
		  tempAccount = generateDefaultNewAccount();
		  saveAccount(tempAccount);
		}
		return tempAccount;
	  }

	useEffect(() => {
		const account = setupAccount();
		setAccount(account);
		setCloudSave(account.cloudSave);
	}, []);

	function toggleCloudSave(): boolean {
		if (!account) return false;
		const current = cloudSave;
		setCloudSave((cloudSave) => !cloudSave);
		account.cloudSave = !current;
		saveAccount(account);
		return !current;
	}

    return (
        <AccountContext.Provider value={{ account: account!, cloudSave: cloudSave, toggleCloudSave}}>
            {children}
        </AccountContext.Provider>
    );
};
