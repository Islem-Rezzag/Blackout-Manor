type WorkspaceCardProps = {
  title: string;
  description: string;
  bullets: string[];
};

export function WorkspaceCard({
  title,
  description,
  bullets,
}: WorkspaceCardProps) {
  return (
    <article className="workspace-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  );
}
