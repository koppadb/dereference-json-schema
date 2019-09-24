# dereference-json-schema

JavaScript library to resolve `$ref` references in a given set of JSON schemas

```javascript
const schemas = new Dereferencer(inputSchemas, options).dereferenceSchemas();
```

This package is to be used with the JSON schema specification (Draft 7), altough it does not fully comply with the specification. For exmaple, it does only support `$id` at the root of each schema.

## Usage

All input schemas must have exactly one [`$id` key with a (partial) URI value](https://tools.ietf.org/html/draft-handrews-json-schema-01#section-8.2).

Upon [dereferencing](https://tools.ietf.org/html/draft-handrews-json-schema-01#section-8.3.2), this package recursivly scans for `$ref`s and resolves them agaist other supplied input schemas, also following further `$ref`s is encounters.

This package does **not**:

-   load any schemas from the file system or the network.
-   validate any data against JSON schemas.
-   support nested `$id` values. It does only support `$id` at the root of each schema.

### Additional features

-   Specify `$deref: false` at the root of a schema to fully disable dereferencing in that schema
-   Set `options.mergeAdditionalProperties` to `true` in order to keep or override properties from references:

```json
{
    "$ref": "test.json",
    "someOtherProperty": "will get merged over the dereferenced value. A error will be thrown if the referenced value is not a object."
}
```

-   Set `options.removeIDs` to `true`, so that root `$id` fields will get removed after dereferencing a value. Additional properties that get merged will not get removed thi way.
-   A variety of other functions get exposed, see `src/index.ts` or the type definitions for details.

### Exmaples

Additional exmaples can be found in the `spec/dereferencing` folder.

## Development

```bash
# Install dependencies
$ npm install
# Build JavaScript files and typings
$ npm build
# Run tests
$ npm run test
# Lint and format files
$ npm run lint
```

This package is developed in TypeScript and thus also includes type definitions.

This package uses the following production dependencies:

-   `uri-js` for handling schema URIs
-   `lodash.clonedeep` for cloning objects
-   `lodash.merge` for merging objects

## License

ISC
