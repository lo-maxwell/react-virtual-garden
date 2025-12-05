import User from "@/models/user/User";


export const loadUser = () => {
	try {
		const serializedUser = localStorage.getItem('user');
		if (serializedUser === null) {
			return [];
		}
		return User.fromPlainObject(JSON.parse(serializedUser));
	} catch (err) {
		console.error('Could not load user', err);
		return [];
	}
};

export const saveUser = (user: User) => {
	try {
		const serializedUser = JSON.stringify(user.toPlainObject());
		localStorage.setItem('user', serializedUser);
	} catch (err) {
		console.error('Could not save user', err);
	}
};