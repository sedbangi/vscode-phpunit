import { describe, expect, it } from '@jest/globals';
import { Configuration } from './configuration';

describe('Configuration Test', () => {
    it('key not exists', () => {
        const configuration = new Configuration();

        expect(configuration.get('foo')).toBeFalsy();
    });

    it('update key', async () => {
        const configuration = new Configuration();
        const key = 'foo';

        await configuration.update(key, 'bar');

        expect(configuration.get(key)).toEqual('bar');
    });

    it('get key', () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const configuration = new Configuration({ foo: 'bar', 'foo.bar': 'foobar' });

        expect(configuration.get('foo')).toEqual('bar');
        expect(configuration.get('foo.bar')).toEqual('foobar');
    });

    it('get default value when key not exists', () => {
        const configuration = new Configuration();

        expect(configuration.get('foo', 'bar')).toEqual('bar');
    });

    it('constructor with map', () => {
        const configuration = new Configuration(new Map<string, string>([['foo', 'bar']]));

        expect(configuration.get('foo')).toEqual('bar');
        expect(configuration.has('buzz')).toBeFalsy();
    });

    it('constructor with json', () => {
        const configuration = new Configuration({ foo: 'bar' });

        expect(configuration.get('foo')).toEqual('bar');
        expect(configuration.has('buzz')).toBeFalsy();
    });
});
