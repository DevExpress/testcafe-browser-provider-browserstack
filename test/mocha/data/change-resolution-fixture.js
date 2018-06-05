import { ClientFunction } from 'testcafe';

fixture `Changing resolution`
    .page `example.com`;

const getAvailWidth = ClientFunction(() => window.screen.availWidth);

test('Low resolution', async t => {
    await t.expect(getAvailWidth()).eql(1024);
});

test('High resolution', async t => {
    await t.expect(getAvailWidth()).eql(1920);
});
