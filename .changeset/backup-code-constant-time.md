---
"better-auth": patch
---

Compare two-factor backup codes in constant time. Redemption used `Array.prototype.includes`, which stops scanning at the matching code and stops each comparison at the first differing character, so both the matched code's position and a wrong guess's shared prefix length were observable in the response time. Every stored code is now compared with `constantTimeEqual` and without an early exit, matching the comparison already used by the two-factor OTP path.
