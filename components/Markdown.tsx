import ReactMarkdown from "react-markdown";

export function Markdown({ content }: Readonly<{ content: string }>) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-4 space-y-2 list-disc list-inside">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 space-y-2 list-decimal list-inside">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="ml-4">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-4 mt-6 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-5 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-4 first:mt-0">{children}</h3>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
