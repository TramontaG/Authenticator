import Database, { FilterFn } from 'src/db/manager';
import schema, { AllEntitiesModel, User } from 'src/db/schema';
import crypto from 'crypto';
import fs from 'fs';

export type WithoutId<T extends keyof AllEntitiesModel> = {
	[Property in keyof AllEntitiesModel[T] as Exclude<
		Property,
		'id'
	>]: AllEntitiesModel[T][Property];
};

export type MaybeWithId<T extends keyof AllEntitiesModel> =
	| WithoutId<T>
	| AllEntitiesModel[T];

const privateKEY = fs.readFileSync('./keys/keys2.key', 'utf8');

class UserManager {
	DBInstance: Database;

	constructor(db: Database) {
		this.DBInstance = db;
	}

	private hasId(user: MaybeWithId<'user'>): user is User {
		return Object.keys(user).includes('id');
	}

	private async userExists(user: MaybeWithId<'user'>) {
		const [maybeUser] = await this.DBInstance.getEntities(
			'user',
			u => u.username === user.username
		);
		return !!maybeUser;
	}

	private async userDeleted(user: MaybeWithId<'user'>) {
		const [myUser] = await this.getUserByUsername(user.username);
		return !!myUser && myUser.dateRemoved !== null;
	}

	async insertUser(user: MaybeWithId<'user'>) {
		if ((await this.userExists(user)) && (await !this.userDeleted(user))) {
			return undefined;
		}

		if (this.hasId(user)) {
			await this.DBInstance.upsert('user', user);
		} else {
			const newId = await this.DBInstance.incrementID('user');

			await this.DBInstance.upsert('user', {
				...user,
				dateAdded: new Date().getTime(),
				id: newId,
			});
		}
	}

	async updateUser(id: User['id'], newUser: Partial<User>) {
		const [oldUser] = await this.DBInstance.getEntities('user', u => u.id === id);
		if (!oldUser) return;

		await this.DBInstance.upsert('user', {
			...oldUser,
			...newUser,
		});
	}

	async deleteUser(id: User['id']) {
		return this.updateUser(id, {
			dateRemoved: new Date().getTime(),
		});
	}

	async getUsers(filterFn: FilterFn<'user'> = (u, i) => !u.dateRemoved) {
		return this.DBInstance.getEntities('user', filterFn);
	}

	async getUserByUsername(username: User['username']) {
		return this.DBInstance.getEntities('user', u => u.username === username);
	}

	async getDeletedUsers() {
		return this.DBInstance.getEntities('user', u => !!u.dateRemoved);
	}

	async getAllUsers() {
		return this.DBInstance.getAllEntities('user');
	}

	hashPassword(password: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let salt = privateKEY;
			crypto.scrypt(password, salt, 128, (err, derivedKey) => {
				if (err) reject(err);
				resolve(derivedKey.toString('hex'));
			});
		});
	}
}

export default new UserManager(new Database(schema));
