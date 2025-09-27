// lib/smartSuggestions.ts
interface Suggestion {
  question: string;
  description: string;
  category: "drill-down" | "time-based" | "comparison" | "related";
}

export class SmartSuggestionsEngine {
  private static instance: SmartSuggestionsEngine;

  static getInstance(): SmartSuggestionsEngine {
    if (!SmartSuggestionsEngine.instance) {
      SmartSuggestionsEngine.instance = new SmartSuggestionsEngine();
    }
    return SmartSuggestionsEngine.instance;
  }

  generateSuggestions(
    originalQuestion: string,
    sql: string,
    results: any[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Analyze the query to understand what was asked
    const queryAnalysis = this.analyzeQuery(originalQuestion, sql);

    // Generate different types of suggestions based on the analysis
    suggestions.push(
      ...this.generateDrillDownSuggestions(queryAnalysis, results)
    );
    suggestions.push(...this.generateTimeBasedSuggestions(queryAnalysis));
    suggestions.push(...this.generateComparisonSuggestions(queryAnalysis));
    suggestions.push(...this.generateRelatedSuggestions(queryAnalysis));

    // Return top 6 suggestions, prioritized by relevance
    return suggestions.slice(0, 6);
  }

  private analyzeQuery(question: string, sql: string) {
    const questionLower = question.toLowerCase();
    const sqlLower = sql.toLowerCase();

    return {
      hasTimeFilter:
        /\b(today|yesterday|week|month|year|date|time)\b/.test(questionLower) ||
        /\b(created_at|updated_at|date|timestamp)\b/.test(sqlLower),
      hasAggregation:
        /\b(count|sum|avg|total|average)\b/.test(questionLower) ||
        /(count\(|sum\(|avg\(|group by)/i.test(sqlLower),
      hasFilter: /\b(where|having)\b/i.test(sqlLower),
      tables: this.extractTablesFromSQL(sqlLower),
      columns: this.extractColumnsFromSQL(sqlLower),
      metrics: this.extractMetrics(questionLower),
      entities: this.extractEntities(questionLower),
    };
  }

  private generateDrillDownSuggestions(
    analysis: any,
    results: any[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // If we have aggregated data, suggest drilling down
    if (analysis.hasAggregation && results.length > 0) {
      const firstRow = results[0];

      // Suggest breakdown by common dimensions
      if (analysis.tables.includes("transactions")) {
        suggestions.push({
          question: `Break down these results by merchant`,
          description: "See which merchants drive these numbers",
          category: "drill-down",
        });

        suggestions.push({
          question: `Show the individual transactions behind these numbers`,
          description: "See the raw transaction details",
          category: "drill-down",
        });
      }

      if (analysis.tables.includes("users")) {
        suggestions.push({
          question: `Break down by user status or type`,
          description: "Segment users to understand patterns",
          category: "drill-down",
        });
      }
    }

    return suggestions;
  }

  private generateTimeBasedSuggestions(analysis: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (!analysis.hasTimeFilter) {
      suggestions.push({
        question: `Show the same data over the last 30 days`,
        description: "See trends over time",
        category: "time-based",
      });
    }

    suggestions.push({
      question: `Compare this week vs last week`,
      description: "Identify week-over-week changes",
      category: "time-based",
    });

    suggestions.push({
      question: `Show hourly patterns for this data`,
      description: "Find peak usage times",
      category: "time-based",
    });

    return suggestions;
  }

  private generateComparisonSuggestions(analysis: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (analysis.tables.includes("transactions")) {
      suggestions.push({
        question: `Compare success vs failed transaction rates`,
        description: "Understand transaction health",
        category: "comparison",
      });
    }

    if (
      analysis.entities.includes("merchant") ||
      analysis.tables.includes("merchants")
    ) {
      suggestions.push({
        question: `Compare performance across different merchants`,
        description: "Identify top and bottom performers",
        category: "comparison",
      });
    }

    if (
      analysis.entities.includes("user") ||
      analysis.tables.includes("users")
    ) {
      suggestions.push({
        question: `Compare new vs returning users`,
        description: "Understand user behavior differences",
        category: "comparison",
      });
    }

    return suggestions;
  }

  private generateRelatedSuggestions(analysis: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Based on tables involved, suggest related analyses
    if (analysis.tables.includes("transactions")) {
      suggestions.push({
        question: `What are the most common decline reasons?`,
        description: "Identify payment friction points",
        category: "related",
      });

      suggestions.push({
        question: `Which payment methods are most successful?`,
        description: "Optimize payment flow",
        category: "related",
      });
    }

    if (analysis.tables.includes("users")) {
      suggestions.push({
        question: `What's the user retention rate?`,
        description: "Understand user stickiness",
        category: "related",
      });
    }

    return suggestions;
  }

  private extractTablesFromSQL(sql: string): string[] {
    const tableMatches = sql.match(/from\s+(\w+)|join\s+(\w+)/gi) || [];
    return tableMatches
      .map((match) => match.replace(/from\s+|join\s+/gi, "").trim())
      .filter(Boolean);
  }

  private extractColumnsFromSQL(sql: string): string[] {
    // Simple extraction - in production, you'd want proper SQL parsing
    const columnMatches = sql.match(/select\s+(.*?)\s+from/is);
    if (!columnMatches) return [];

    return columnMatches[1]
      .split(",")
      .map((col) => col.trim().replace(/\s+as\s+\w+/gi, ""))
      .filter((col) => col !== "*");
  }

  private extractMetrics(question: string): string[] {
    const metrics = [];
    if (/\b(revenue|sales|amount|money|payment)\b/i.test(question))
      metrics.push("financial");
    if (/\b(transaction|payment|purchase)\b/i.test(question))
      metrics.push("transaction");
    if (/\b(user|customer|account)\b/i.test(question)) metrics.push("user");
    if (/\b(merchant|vendor|business)\b/i.test(question))
      metrics.push("merchant");
    return metrics;
  }

  private extractEntities(question: string): string[] {
    const entities = [];
    if (/\b(user|customer|account)\b/i.test(question)) entities.push("user");
    if (/\b(merchant|vendor|business|store)\b/i.test(question))
      entities.push("merchant");
    if (/\b(transaction|payment|purchase)\b/i.test(question))
      entities.push("transaction");
    if (/\b(product|item|service)\b/i.test(question)) entities.push("product");
    return entities;
  }
}