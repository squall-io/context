describe('noop', () => {
    it('power to be 81', () => {
        expect(3 ** 4).toBe(81);
    });

    it('callback to throw panic', () => {
        expect(() => { throw new Error('panic!'); }).toThrowError(Error, 'panic!');
    });
});
