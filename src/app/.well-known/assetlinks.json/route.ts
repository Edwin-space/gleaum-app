import { NextResponse } from 'next/server';

const assetlinks = [
  {
    relation: [
      'delegate_permission/common.handle_all_urls',
      'delegate_permission/common.get_login_creds',
    ],
    target: {
      namespace: 'android_app',
      package_name: 'com.gleaum.app',
      sha256_cert_fingerprints: [
        'C3:A0:94:A7:96:60:26:DA:80:08:94:05:2E:FD:8E:6A:77:1F:DE:B3:AD:A6:54:1E:FB:EA:28:EC:CB:F6:ED:01',
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(assetlinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
