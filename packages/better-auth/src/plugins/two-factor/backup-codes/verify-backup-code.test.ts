import { describe, expect, it } from "vitest";
import { verifyBackupCode } from ".";

const SECRET = "better-auth-test-secret-0123456789";
const CODES = ["aaaa-1111", "bbbb-2222", "cccc-3333"];
const encoded = (codes: unknown[]) => JSON.stringify(codes);

describe("verifyBackupCode", () => {
	// Every stored code must be compared, so a match must not depend on where in
	// the list the code sits.
	it.each([0, 1, 2])("verifies the code stored at index %i", async (index) => {
		const result = await verifyBackupCode(
			{ backupCodes: encoded(CODES), code: CODES[index]! },
			SECRET,
		);

		expect(result.status).toBe(true);
		expect(result.updated).toEqual(CODES.filter((_, i) => i !== index));
	});

	it("rejects a code that is not stored and leaves the list intact", async () => {
		const result = await verifyBackupCode(
			{ backupCodes: encoded(CODES), code: "dddd-4444" },
			SECRET,
		);

		expect(result.status).toBe(false);
		expect(result.updated).toEqual(CODES);
	});

	// Guards the length handling: a prefix or an extension of a stored code must
	// not be accepted.
	it.each([
		"aaaa",
		"aaaa-1111-extra",
		"",
		"AAAA-1111",
	])("rejects the near-miss %j", async (code) => {
		const result = await verifyBackupCode(
			{ backupCodes: encoded(CODES), code },
			SECRET,
		);

		expect(result.status).toBe(false);
	});

	it("removes every copy when the same code is stored twice", async () => {
		const duplicated = ["aaaa-1111", "bbbb-2222", "aaaa-1111"];
		const result = await verifyBackupCode(
			{ backupCodes: encoded(duplicated), code: "aaaa-1111" },
			SECRET,
		);

		expect(result.status).toBe(true);
		expect(result.updated).toEqual(["bbbb-2222"]);
	});

	// `getBackupCodes` asserts `string[]` through `safeJSONParse` without
	// validating it, so a corrupted or tampered column can yield non-string
	// entries. Those must not match and must not throw.
	it.each([
		[[123]],
		[[null]],
		[[{}]],
		[[["nested"]]],
	])("rejects non-string stored entries such as %j without throwing", async (codes) => {
		const result = await verifyBackupCode(
			{ backupCodes: encoded(codes), code: "aaaa-1111" },
			SECRET,
		);

		expect(result.status).toBe(false);
	});

	it("returns a failed status when the stored payload is not valid JSON", async () => {
		const result = await verifyBackupCode(
			{ backupCodes: "not-json", code: "aaaa-1111" },
			SECRET,
		);

		expect(result.status).toBe(false);
		expect(result.updated).toBeNull();
	});
});
