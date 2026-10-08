import { Card } from "../components/card";
import { PageTitle } from "../components/page-title";

export default function ImpostazioniPage() {
  return (
    <main>
      <PageTitle>Impostazioni</PageTitle>
      <Card>
        <p className="text-muted">Qui potrai regolare profilo, obiettivi e regole di calcolo.</p>
      </Card>
    </main>
  );
}
