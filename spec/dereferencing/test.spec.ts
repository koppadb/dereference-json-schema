import { pathExists, readdir, readdirSync, readJSON } from 'fs-extra';
import 'jasmine';
import { join } from 'path';
import { Dereferencer, DereferencerOptions } from '../../src/index';

describe('dereferencing', function() {
    const folderPaths = readdirSync(__dirname).filter(
        path => !path.includes('.')
    );
    for (let basePath of folderPaths) {
        it(`should dereference test "${basePath}" as expected`, async function() {
            basePath = join(__dirname, basePath);
            const inputSchemas = await readJSON(
                join(basePath, 'inputSchemas.json')
            );

            const optionsPath = join(basePath, 'options.json');
            let options: DereferencerOptions = {};
            if (await pathExists(optionsPath)) {
                options = await readJSON(optionsPath);
            }

            const dereferencedSchemas = new Dereferencer(
                inputSchemas,
                options
            ).dereferenceSchemas();
            const schemas: {
                [schemaURI: string]: any;
            } = {};
            for (const schema of dereferencedSchemas) {
                schemas[schema.$id] = schema;
            }

            const expectedSchemas = await Promise.all(
                (await readdir(basePath))
                    .filter(path => path.includes('.expected.json'))
                    .map(path => readJSON(join(basePath, path)))
            );

            for (const schema of expectedSchemas) {
                expect(schemas[schema.$id]).toEqual(schema, basePath);
            }
        });
    }
});
