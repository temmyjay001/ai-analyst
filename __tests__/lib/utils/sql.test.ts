// __tests__/lib/utils/sql.test.ts

import { cleanSQL, validateAndCleanSQL } from "@/lib/utils/sql";

describe("SQL Cleaning Utilities", () => {
  describe("cleanSQL", () => {
    it("should remove markdown code blocks", () => {
      const input = "```sql\nSELECT * FROM users\n```";
      const expected = "SELECT * FROM users";
      expect(cleanSQL(input)).toBe(expected);
    });

    it("should remove generic code blocks", () => {
      const input = "```\nSELECT * FROM users\n```";
      const expected = "SELECT * FROM users";
      expect(cleanSQL(input)).toBe(expected);
    });

    it("should handle multiple code blocks", () => {
      const input = "```sql\nSELECT * FROM users```";
      const expected = "SELECT * FROM users";
      expect(cleanSQL(input)).toBe(expected);
    });

    it("should trim whitespace", () => {
      const input = "  \n  SELECT * FROM users  \n  ";
      const expected = "SELECT * FROM users";
      expect(cleanSQL(input)).toBe(expected);
    });

    it("should handle already clean SQL", () => {
      const input = "SELECT * FROM users";
      expect(cleanSQL(input)).toBe(input);
    });
  });

  describe("validateAndCleanSQL", () => {
    it("should allow valid SELECT queries", () => {
      const input = "SELECT * FROM users";
      expect(validateAndCleanSQL(input)).toBe(input);
    });

    it("should clean and validate SELECT queries", () => {
      const input = "```sql\nSELECT * FROM users\n```";
      const expected = "SELECT * FROM users";
      expect(validateAndCleanSQL(input)).toBe(expected);
    });

    it("should reject DROP statements", () => {
      const input = "DROP TABLE users";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Dangerous SQL operation detected"
      );
    });

    it("should reject DELETE statements", () => {
      const input = "DELETE FROM users WHERE id = 1";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Dangerous SQL operation detected"
      );
    });

    it("should reject UPDATE statements", () => {
      const input = "UPDATE users SET name = 'hacker'";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Dangerous SQL operation detected"
      );
    });

    it("should reject INSERT statements", () => {
      const input = "INSERT INTO users VALUES (1, 'hacker')";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Dangerous SQL operation detected"
      );
    });

    it("should reject non-SELECT queries", () => {
      const input = "SHOW TABLES";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Only SELECT queries are allowed"
      );
    });

    it("should be case-insensitive for dangerous operations", () => {
      const input = "DrOp TaBlE users";
      expect(() => validateAndCleanSQL(input)).toThrow(
        "Dangerous SQL operation detected"
      );
    });
  });
});
