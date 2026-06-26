import { describe, it, expect, vi } from 'vitest';
import { ok, created } from './response';

function mockRes() {
  const res: any = { statusCode: 200 };
  res.status = vi.fn((c: number) => { res.statusCode = c; return res; });
  res.json = vi.fn((b: unknown) => { res.body = b; return res; });
  return res;
}

describe('response envelope', () => {
  it('ok() wraps data in the success envelope', () => {
    const res = mockRes();
    ok(res, { hello: 'world' });
    expect(res.body).toMatchObject({ success: true, data: { hello: 'world' }, error: null });
  });

  it('ok() attaches meta when provided', () => {
    const res = mockRes();
    ok(res, [1, 2], { cursor: 'abc' });
    expect(res.body.meta).toMatchObject({ cursor: 'abc' });
  });

  it('created() responds with 201', () => {
    const res = mockRes();
    created(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body).toMatchObject({ success: true, data: { id: '1' } });
  });
});
