import 'jasmine';
import { Dereferencer } from '../src/index';

const specs = {
    'should detect duplicate schema URIs': [
        {
            $id: 'test.json',
        },
        {
            $id: 'test.json',
        },
    ],
    'should detect invalid schema URIs': [
        {
            $id: 'test.json#/fragment',
        },
    ],
    'should detect non-string references': [
        {
            $id: 'test.json#/fragment',
            a: {
                $ref: 5,
            },
        },
    ],
    'should detect references pointing to nen-existent value': [
        {
            $id: 'test.json#/fragment',
            a: {
                $ref: '#/b',
            },
        },
    ],
};

describe('Dereferencer', function () {
    for (const specDescription in specs) {
        it(specDescription, async function () {
            expect(() =>
                new Dereferencer(specs[specDescription]).dereferenceSchemas()
            ).toThrowError();
        });
    }
});
