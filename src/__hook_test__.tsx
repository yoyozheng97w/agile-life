// hook test file - should be blocked by security-reviewer
export const Bad = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
);
