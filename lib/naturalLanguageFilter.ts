// lib/naturalLanguageFilter.ts
export class NaturalLanguageFilter {
  /**
   * Parse natural language filter and apply to results
   */
  static applyFilter(
    results: any[],
    filterQuery: string
  ): { filtered: any[]; message: string } {
    if (!results || results.length === 0) {
      return { filtered: [], message: "No results to filter" };
    }

    const lowerQuery = filterQuery.toLowerCase();

    // Parse different filter types
    const filters = this.parseFilterQuery(lowerQuery, results[0]);

    if (filters.length === 0) {
      return {
        filtered: results,
        message:
          "Could not understand the filter. Try: 'amount > 100' or 'status = failed'",
      };
    }

    // Apply filters
    let filtered = results;
    for (const filter of filters) {
      filtered = this.applyFilterCondition(filtered, filter);
    }

    const message = `Showing ${filtered.length} of ${results.length} results`;
    return { filtered, message };
  }

  private static parseFilterQuery(query: string, sampleRow: any) {
    const filters: any[] = [];
    const columns = Object.keys(sampleRow).map((k) => k.toLowerCase());

    // Pattern: "column operator value"
    const patterns = [
      // Greater than patterns
      {
        regex:
          /([\w_]+)\s*(?:>|greater than|more than|above|over)\s*([\d.,]+)/gi,
        operator: ">",
      },
      // Less than patterns
      {
        regex: /([\w_]+)\s*(?:<|less than|below|under)\s*([\d.,]+)/gi,
        operator: "<",
      },
      // Equals patterns for numbers
      {
        regex: /([\w_]+)\s*(?:=|equals?|is)\s*([\d.,]+)/gi,
        operator: "=",
        type: "number",
      },
      // Equals patterns for strings
      {
        regex: /([\w_]+)\s*(?:=|equals?|is)\s*['""]?([^'""]+)['""]?/gi,
        operator: "=",
        type: "string",
      },
      // Contains patterns
      {
        regex:
          /([\w_]+)\s*(?:contains?|includes?|has)\s*['""]?([^'""]+)['""]?/gi,
        operator: "contains",
      },
      // Not equals patterns
      {
        regex: /([\w_]+)\s*(?:!=|not equals?|is not)\s*['""]?([^'""]+)['""]?/gi,
        operator: "!=",
      },
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex);
      let match;
      while ((match = regex.exec(query)) !== null) {
        const columnName = this.findMatchingColumn(match[1], columns);
        if (columnName) {
          let value: any = match[2];

          // Parse value based on type
          if (
            pattern.type === "number" ||
            [">", "<"].includes(pattern.operator)
          ) {
            value = parseFloat(value.replace(/,/g, ""));
          }

          filters.push({
            column: columnName,
            operator: pattern.operator,
            value: value,
          });
        }
      }
    }

    // Special cases
    if (query.includes("only") || query.includes("just")) {
      // "only amounts over 1000" or "just failed transactions"
      const overMatch = query.match(/only\s+(\w+)?\s*over\s*([\d.,]+)/);
      if (overMatch) {
        const column = this.findMatchingColumn(
          overMatch[1] || "amount",
          columns
        );
        if (column) {
          filters.push({
            column,
            operator: ">",
            value: parseFloat(overMatch[2].replace(/,/g, "")),
          });
        }
      }

      // "just merchant X" or "only status failed"
      const justMatch = query.match(/(?:just|only)\s+(\w+)\s+([^\s]+)/);
      if (justMatch) {
        const column = this.findMatchingColumn(justMatch[1], columns);
        if (column) {
          filters.push({
            column,
            operator: "=",
            value: justMatch[2],
          });
        }
      }
    }

    // Top N pattern
    const topMatch = query.match(/top\s*(\d+)/);
    if (topMatch) {
      filters.push({
        type: "limit",
        value: parseInt(topMatch[1]),
      });
    }

    return filters;
  }

  private static findMatchingColumn(
    searchTerm: string,
    columns: string[]
  ): string | null {
    const term = searchTerm.toLowerCase();

    // Exact match
    if (columns.includes(term)) {
      return term;
    }

    // Partial match
    const partial = columns.find((col) => col.includes(term));
    if (partial) {
      return partial;
    }

    // Common aliases
    const aliases: { [key: string]: string[] } = {
      amount: ["value", "total", "sum", "price"],
      status: ["state", "result"],
      merchant: ["vendor", "store", "seller"],
      user: ["customer", "client"],
      date: ["time", "timestamp", "created", "updated"],
    };

    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(term)) {
        const match = columns.find((col) => col.includes(key));
        if (match) return match;
      }
    }

    return null;
  }

  private static applyFilterCondition(results: any[], filter: any): any[] {
    if (filter.type === "limit") {
      return results.slice(0, filter.value);
    }

    return results.filter((row) => {
      const value = row[filter.column];

      switch (filter.operator) {
        case ">":
          return parseFloat(value) > filter.value;
        case "<":
          return parseFloat(value) < filter.value;
        case "=":
          if (typeof filter.value === "number") {
            return parseFloat(value) === filter.value;
          }
          return (
            String(value).toLowerCase() === String(filter.value).toLowerCase()
          );
        case "!=":
          return (
            String(value).toLowerCase() !== String(filter.value).toLowerCase()
          );
        case "contains":
          return String(value)
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  }
}
