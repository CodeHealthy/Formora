export function FormsPage() {
  return (
    <section aria-labelledby="forms-title">
      <p className="eyebrow">Forms</p>
      <h1 id="forms-title">Your forms</h1>
      <div className="empty-state">
        <h2>No forms yet</h2>
        <p>Form creation will be introduced after authentication and workspaces.</p>
      </div>
    </section>
  );
}
