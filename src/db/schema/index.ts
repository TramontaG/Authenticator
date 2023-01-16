import { ObjectSchema } from 'realm';

export type JsonValues =
	| string
	| number
	| boolean
	| {
			[key: string]: JsonValues;
	  }
	| null;

export type Json = {
	[key: string]: JsonValues | JsonValues[] | Json;
};

export type Schema = {
	name: string;
	primaryKey: string;
	properties: Json;
};

export type Schemas = {
	[key: string]: ObjectSchema;
};

export const userSchema: Schema = {
	name: 'user',
	primaryKey: 'id',
	properties: {
		id: { type: 'int', indexed: true },
		dateAdded: 'int',
		username: 'string',
		passwordHash: 'string',
		dateRemoved: 'int?',
		permissions: 'string[]',
	},
};

export type Permission = 'image' | 'user-management';

export type User = {
	id: number;
	username: string;
	passwordHash: string;
	dateAdded: number;
	dateRemoved: number | null;
	permissions: Permission[];
};

export type AllEntitiesModel = {
	user: User;
};

export default {
	user: userSchema,
} as Schemas;
