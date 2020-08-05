import 'jasmine';
import { Dereferencer } from '../src/index';

describe('Dereferencer', function () {
    it('should normalize URIs', async function () {
        expect(
            Dereferencer.normalizeURI('HTTP://ABC.com:80/%7Esmith/home.html')
        ).toEqual('http://abc.com/~smith/home.html');
        expect(Dereferencer.normalizeURI('/test.json')).toEqual('test.json');
    });

    it('should validate schema URIs', async function () {
        expect(() =>
            Dereferencer.validateSchemaURI(
                'HTTP://ABC.com:80/%7Esmith/home.html'
            )
        ).not.toThrowError();
        expect(() =>
            Dereferencer.validateSchemaURI('test.json#/hi')
        ).toThrowError();
    });

    it('should get schema URIs', async function () {
        expect(Dereferencer.getSchemaURI('test.json')).toEqual('test.json');
        expect(Dereferencer.getSchemaURI('path/here.json#/hello')).toEqual(
            'path/here.json'
        );
    });

    it('should append to JSON Pointer fragments', async function () {
        expect(
            Dereferencer.appendToJSONPointerFragment('test.json', 'hello')
        ).toEqual('test.json#/hello');
        expect(
            Dereferencer.appendToJSONPointerFragment('test.json', '/\\~3')
        ).toEqual('test.json#/~1%5C~03');
        expect(
            Dereferencer.appendToJSONPointerFragment('test.json#/hi', 'hello')
        ).toEqual('test.json#/hi/hello');
    });

    it('should get JSON Pointer keys', async function () {
        expect(Dereferencer.getJSONPointerKeys('/one/two')).toEqual([
            'one',
            'two',
        ]);
        expect(Dereferencer.getJSONPointerKeys('/')).toEqual([]);
        expect(Dereferencer.getJSONPointerKeys('')).toEqual([]);
        expect(() => Dereferencer.getJSONPointerKeys('one/two')).toThrowError();
        expect(() => Dereferencer.getJSONPointerKeys('/one/')).toThrowError();
    });

    it('should merge objects', async function () {
        expect(
            Dereferencer.merge(
                {
                    a: 1,
                    b: 2,
                },
                { b: 'overwritten', c: 3 }
            )
        ).toEqual({
            a: 1,
            b: 'overwritten',
            c: 3,
        });
        expect(
            Dereferencer.merge(
                {
                    a: {
                        b: 2,
                    },
                },
                {
                    a: {
                        b: 'overwritten',
                        c: 3,
                    },
                }
            )
        ).toEqual({
            a: {
                b: 'overwritten',
                c: 3,
            },
        });
    });

    it('should merge array by overwriting them', async function () {
        expect(
            Dereferencer.merge(
                {
                    a: ['test', 'another test'],
                    b: 2,
                },
                { a: ['overwritten'], b: ['overwritten'] }
            )
        ).toEqual({
            a: ['overwritten'],
            b: ['overwritten'],
        });
    });
});
