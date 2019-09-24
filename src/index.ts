import * as cloneDeep from 'lodash.clonedeep';
import * as merge from 'lodash.merge';
import * as URI from 'uri-js';

export interface InputSchema {
    $id: string;
    [key: string]: any;
}

export type DereferencerOptions = Partial<typeof Dereferencer.defaultOptions>;

export class Dereferencer {
    public static readonly defaultOptions = {
        mergeAdditionalProperties: false,
        removeIDs: false,
    };

    /**
     * Partially dereferenced schemas
     */
    private schemas: {
        [schemaURI: string]: any;
    } = {};

    /**
     * Schemas that have been fully dereferenced
     */
    private dereferencedSchemaURIs = new Set<string>();

    constructor(
        inputSchemas: InputSchema[],
        private options: DereferencerOptions = Dereferencer.defaultOptions
    ) {
        inputSchemas = cloneDeep(inputSchemas);

        cloneDeep;

        this.extractIDs(inputSchemas);
    }

    /**
     * Fully dereferences all schemas
     */
    public dereferenceSchemas() {
        for (const schemaURI in this.schemas) {
            if (!this.dereferencedSchemaURIs.has(schemaURI)) {
                this.dereferenceSchema(schemaURI);
            }
        }
        return Object.values(this.schemas);
    }

    /**
     * Extracts schema IDs and loads the inputs schemas
     */
    private extractIDs(inputSchemas: InputSchema[]) {
        for (const schema of inputSchemas) {
            const uri = Dereferencer.normalizeURI(schema.$id);
            Dereferencer.validateSchemaURI(uri);
            if (this.schemas[uri]) {
                throw new Error(`Duplicate schema for URI "${uri}".`);
            }
            this.schemas[uri] = schema;
        }
    }

    /**
     * Checks if a schema URI is valid
     * @param schemaURI URI of schema
     */
    public static validateSchemaURI(schemaURI: string) {
        const data = URI.parse(schemaURI);
        if (data.fragment) {
            throw new Error(`Schema URI "${schemaURI}" contains a fragment.`);
        }
    }

    /**
     * Fully dereferences a schema
     * @param schemaURI URI of the schema
     */
    private dereferenceSchema(schemaURI: string) {
        const schema = this.schemas[schemaURI];
        this.schemas[schemaURI] = this.dereferenceSubSchema(schemaURI, schema);
        this.dereferencedSchemaURIs.add(schemaURI);
    }

    /**
     * Recursivly dereferences a subschema that has a given URI and returns it
     * @param uri Base URI of the subschema
     * @return Dereferenced subschema
     */
    private dereferenceSubSchema(uri: string, subSchema: any) {
        if (Dereferencer.isPlainValue(subSchema)) {
            return subSchema;
        }

        if (subSchema.$deref === false) {
            // TODO: Document $deref feature
            return subSchema;
        }

        let referenceSubSchema: any;
        if (subSchema.hasOwnProperty('$ref')) {
            if (typeof subSchema.$ref !== 'string') {
                throw new Error(
                    `Reference in subschema "${uri}" is not a string.`
                );
            }
            const refereceURI = Dereferencer.normalizeURI(
                URI.resolve(uri, subSchema.$ref)
            );
            const referencedSchemaURI = Dereferencer.getSchemaURI(refereceURI);

            if (!this.dereferencedSchemaURIs.has(referencedSchemaURI)) {
                referenceSubSchema = this.dereferenceSubSchema(
                    refereceURI,
                    this.getSubSchema(refereceURI)
                );
            } else {
                referenceSubSchema = this.getSubSchema(refereceURI);
            }

            if (this.options.removeIDs) {
                delete referenceSubSchema.$id;
            }
            if (!this.options.mergeAdditionalProperties) {
                return referenceSubSchema;
            }
        }

        const dereferencedSubSchema: any = Array.isArray(subSchema)
            ? new Array(subSchema.length)
            : {};
        for (const key in subSchema) {
            if (!subSchema.hasOwnProperty(key)) {
                continue;
            }
            dereferencedSubSchema[key] = this.dereferenceSubSchema(
                Dereferencer.appendToJSONPointerFragment(uri, key),
                subSchema[key]
            );
        }

        if (this.options.mergeAdditionalProperties) {
            merge(dereferencedSubSchema, referenceSubSchema);
            delete dereferencedSubSchema.$ref;
        }

        return dereferencedSubSchema;
    }

    /**
     * Checks if a value may contain references or subschemas
     * Only arrays and JSON objects will return true
     */
    public static isPlainValue(value: any) {
        return (
            typeof value !== 'object' ||
            value == null ||
            (!Array.isArray(value) && value.constructor != Object)
        );
    }

    /**
     * Appends a key to the JSON Pointer in a URI
     * @param uri URI containing JSON Pointer as fragment
     * @param key JSON Poiner key that gets appended
     */
    public static appendToJSONPointerFragment(uri: string, key: string) {
        const data = URI.parse(uri);
        data.fragment =
            (data.fragment || '') +
            '/' +
            key.replace(/~/g, '~0').replace(/\//g, '~1');
        return URI.serialize(data);
    }

    /**
     * Removes the fragment of a URI
     */
    public static getSchemaURI(uri: string) {
        const data = URI.parse(uri);
        delete data.fragment;
        return URI.serialize(data);
    }

    /**
     * Resolves a URI to a registered schema while dereferencing it and returns a deep clone of it
     * Therefore it can also get subschemas inside of references
     * @param uri Target URI
     */
    public getSubSchema(uri: string) {
        const schemaURI = Dereferencer.getSchemaURI(uri);
        const fragment = URI.parse(uri).fragment || '';

        let subSchema = this.schemas;
        let subURI = schemaURI;
        const keys = Dereferencer.getJSONPointerKeys(fragment);
        keys.unshift(schemaURI);

        let disableDereferencing = this.schemas[schemaURI].$deref == false;

        for (const key of keys) {
            let value = subSchema[key];
            if (
                !Dereferencer.isPlainValue(value) &&
                value.hasOwnProperty('$ref')
            ) {
                subSchema[key] = value = disableDereferencing
                    ? value
                    : this.dereferenceSubSchema(subURI, value);
            }
            subSchema = value;
            subURI = Dereferencer.appendToJSONPointerFragment(subURI, key);
        }

        subSchema = this.dereferenceSubSchema(uri, subSchema);

        return cloneDeep(subSchema);
    }

    /**
     * Splits a JSON pointer into the individual JSON keys and decodes them
     * @param pointer JSON Pointer
     */
    public static getJSONPointerKeys(pointer: string) {
        if (pointer === '' || pointer === '/') {
            return [];
        }
        if (!pointer.startsWith('/')) {
            throw new Error(
                `JSON Pointer ${pointer} must start with "/" or be an empty string.`
            );
        }
        if (pointer.endsWith('/')) {
            throw new Error('JSON Pointer must not end with a trailing "/".');
        }
        const keys = pointer.split('/');
        keys.shift();

        return keys.map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'));
    }

    /**
     * Normalizes a URI
     */
    public static normalizeURI(uri: string) {
        uri = URI.normalize(uri);
        if (uri.startsWith('/')) {
            uri = uri.substring(1);
        }
        return uri;
    }
}
