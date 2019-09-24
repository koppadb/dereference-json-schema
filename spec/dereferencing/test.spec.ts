import { pathExists, readdir, readJSON } from 'fs-extra';
import 'jasmine';
import { join } from 'path';
import { Dereferencer, DereferencerOptions } from '../../src/index';

describe('dereferencing', function() {
    it('should dereference as expected', async function() {
        const folderPaths = (await readdir(__dirname))
            .filter(path => !path.includes('.'))
            .map(path => join(__dirname, path));
        for (const basePath of folderPaths) {
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
        }
    });
});
