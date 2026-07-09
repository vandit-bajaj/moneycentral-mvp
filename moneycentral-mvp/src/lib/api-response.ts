import { NextResponse } from 'next/server';

export function apiError(message: any, status: number, headers?: HeadersInit) {
  const init: ResponseInit = { status };
  if (headers !== undefined) {
    init.headers = headers;
  }
  return NextResponse.json({ error: message }, init);
}

export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit) {
  const init: ResponseInit = { status };
  if (headers !== undefined) {
    init.headers = headers;
  }
  return NextResponse.json(data, init);
}
