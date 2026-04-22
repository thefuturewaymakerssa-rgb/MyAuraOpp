import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 Load Test — 500 Concurrent Users 🧪🚀
// Run with: k6 run tests/load_test.js

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up
    { duration: '3m', target: 500 }, // Stay at 500 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadTest() {
  // 1. Visit Home Page
  let res = http.get(`${BASE_URL}/`);
  check(res, { 'status is 200': (r) => r.status === 200 });

  // 2. Discover Feed (Simulate heavy fetch)
  res = http.get(`${BASE_URL}/api/proofs`); // Placeholder for actual discovery API
  check(res, { 'discovery api 200': (r) => r.status === 200 });

  // 3. User Profile
  res = http.get(`${BASE_URL}/u/test-user`);
  check(res, { 'profile page 200': (r) => r.status === 200 });

  sleep(Math.random() * 3 + 1); // Simulate human think time
}
