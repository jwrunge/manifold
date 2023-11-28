const { test, expect } = require('@jest/globals');

function run() {
    return 'test';
}

test("test run", () => {
    expect(run()).toBe('test');
});
