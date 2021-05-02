import 'jasmine';
import { Dereferencer } from '../src/index';

const specs: {
    [expectation: string]: {
        inputSchemas: any[];
        expectedError: string;
    };
} = {
    'should detect duplicate schema URIs': {
        inputSchemas: [
            {
                $id: 'test.json',
            },
            {
                $id: 'test.json',
            },
        ],
        expectedError: 'Duplicate schema for URI "test.json".',
    },
    'should detect fragments in schema URIs': {
        inputSchemas: [
            {
                $id: 'test.json#/fragment',
            },
        ],
        expectedError: 'Schema URI "test.json#/fragment" contains a fragment.',
    },
    'should detect non-string references': {
        inputSchemas: [
            {
                $id: 'test.json',
                a: {
                    $ref: 5,
                },
            },
        ],
        expectedError: 'Reference in subschema "test.json#/a" is not a string.',
    },
    'should detect references pointing to non-existent values': {
        inputSchemas: [
            {
                $id: 'test.json',
                a: {
                    $ref: '#/b',
                },
            },
        ],
        expectedError:
            'Reference URI "test.json#/b" could not be resolved at part "b".',
    },
    'should detect invalid additional properties': {
        inputSchemas: [
            {
                $id: 'test.json',
                definitions: {},
                test: {
                    $ref: '#/definitions',
                    a: 4,
                },
            },
        ],
        expectedError:
            'Additional properties [ \'$ref\', \'a\' ] when using "$ref" in schema "test.json#/test" are only allowed with the "mergeAdditionalProperties" option.',
    },
};

describe('Dereferencer', function () {
    for (const specDescription in specs) {
        it(specDescription, async function () {
            expect(() => {
                new Dereferencer(
                    specs[specDescription].inputSchemas
                ).dereferenceSchemas();
            }).toThrowError(specs[specDescription].expectedError);
        });
    }
});
