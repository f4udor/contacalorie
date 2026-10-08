import { Card } from "../components/card";
import { PageTitle } from "../components/page-title";

export default function SettimanaPage() {
  return (
    <main>
      <PageTitle>Settimana</PageTitle>
      <Card>
        <p className="text-muted">Qui compariranno le barre delle sette giornate e i riepiloghi.</p>
      </Card>
    </main>
  );
}
