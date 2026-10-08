import { Card } from "./components/card";
import { PageTitle } from "./components/page-title";

export default function OggiPage() {
  return (
    <main>
      <PageTitle>Oggi</PageTitle>
      <Card>
        <p className="text-muted">Qui compariranno anello delle kcal, nutrienti e pasti del giorno.</p>
      </Card>
    </main>
  );
}
