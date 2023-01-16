import Realm from 'realm';
import { AllEntitiesModel, Schemas } from '../schema';

export type FilterFn<T extends keyof AllEntitiesModel> = (
	_entity: AllEntitiesModel[T],
	_index: number
) => boolean;

class Database {
	DatabaseVersion: number;
	_RealmInstance: Realm | undefined;
	schemas: Schemas;

	constructor(schema: Schemas) {
		this.DatabaseVersion = 9;
		this._RealmInstance = undefined;

		this.schemas = schema;
	}

	private init = async () => {
		this._RealmInstance = await this.openRealm();
		return this._RealmInstance;
	};

	getInstance = async () => {
		if (this._RealmInstance) return this._RealmInstance;
		return this.init();
	};

	async incrementID(entity: keyof AllEntitiesModel) {
		const realm = await this.getInstance();
		const maxId = realm.objects(entity).max('id') as number;
		return maxId + 1 || 1;
	}

	async incrementValue(entity: string, key: string) {
		const realm = await this.getInstance();
		const maxId = realm.objects(entity).max(key) as number;
		return maxId + 1 || 1;
	}

	private async openRealm() {
		const config = {
			schema: Object.values(this.schemas),
			schemaVersion: this.DatabaseVersion,
		};
		return new Realm(config);
	}

	private all<T extends keyof AllEntitiesModel>(
		_entity: AllEntitiesModel[T],
		_index: number
	) {
		return true;
	}

	async getAllEntities<T extends keyof AllEntitiesModel>(entityName: T) {
		return this.getEntities(entityName, this.all);
	}

	async getEntities<T extends keyof AllEntitiesModel>(
		entityName: T,
		filterFunction: FilterFn<T>
	) {
		const DB = await this.getInstance();
		const objects = DB.objects<AllEntitiesModel[T]>(entityName);
		const objJSON = objects.toJSON() as AllEntitiesModel[T][];
		return objJSON.filter((obj, index) => filterFunction(obj, index));
	}

	async upsert<T extends keyof AllEntitiesModel>(
		entityName: T,
		entityData: AllEntitiesModel[T]
	) {
		try {
			const DB = await this.getInstance();
			DB.write(() => {
				// typing is wrong, Docs says that this method call is correct:
				// https://www.mongodb.com/docs/realm/sdk/node/examples/read-and-write-data/#upsert-an-object
				// @ts-ignore
				DB.create(entityName, entityData, Realm.UpdateMode.Modified);
			});
		} catch (e) {
			console.warn(e);
		}
	}

	async deleteEntity<T extends keyof AllEntitiesModel>(
		entityName: T,
		entityId: string | number
	) {
		try {
			const DB = await this.getInstance();
			DB.write(() => {
				const obj = DB.objectForPrimaryKey(entityName, entityId);
				DB.delete(obj);
			});
		} catch (e) {
			console.warn(e);
		}
	}
}

export default Database;
