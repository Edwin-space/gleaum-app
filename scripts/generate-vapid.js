#!/usr/bin/env node
// VAPID 키 생성 스크립트
// 사용: node scripts/generate-vapid.js
// 출력값을 .env.local 에 붙여넣으세요

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('');
console.log('# 아래 값을 .env.local 에 추가하세요:');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('VAPID_EMAIL=mailto:admin@gleaum.com');
console.log('');
