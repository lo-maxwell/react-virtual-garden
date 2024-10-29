import { Account } from "@/models/account/Account";

export const loadAccount = () => {
	try {
	  const serializedAccount = localStorage.getItem('account');
	  if (serializedAccount === null) {
		return [];
	  }
	  return Account.fromPlainObject(JSON.parse(serializedAccount));
	} catch (err) {
	  console.error('Could not load account', err);
	  return [];
	}
  };
  
export const saveAccount = (account: Account) => {
	try {
		const serializedAccount = JSON.stringify(account.toPlainObject());
		localStorage.setItem('account', serializedAccount);
	} catch (err) {
		console.error('Could not save account', err);
	}
};