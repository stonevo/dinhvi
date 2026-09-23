export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p className="muted">Phần này đang được xây.</p>
    </section>
  );
}
