import { Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/formatters';

// ── Formula banner ───────────────────────────────────────────────────────────

function FormulaBanner() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-700">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-maroon-500" />
      <div>
        <p className="font-semibold">Formule de répartition</p>
        <p className="mt-0.5 font-mono text-xs">
          Montant&nbsp;=&nbsp;(Consommation individuelle&nbsp;÷&nbsp;Consommation totale)&nbsp;×&nbsp;Montant total
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPart(part) {
  return (part * 100).toFixed(2) + '\u00a0%';
}

function formatConsommation(value) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(value);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RepartitionTable({ locataires = [], montantTotal, totalConsommation }) {
  const safeTotal = totalConsommation > 0 ? totalConsommation : 1; // avoid divide-by-zero

  return (
    <div>
      <FormulaBanner />

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--primary)]/5">
              <TableHead className="font-semibold text-[var(--primary)]">Locataire</TableHead>
              <TableHead className="text-right font-semibold text-[var(--primary)]">
                Index début
              </TableHead>
              <TableHead className="text-right font-semibold text-[var(--primary)]">
                Index fin
              </TableHead>
              <TableHead className="text-right font-semibold text-[var(--primary)]">
                Consommation&nbsp;(m³/kWh)
              </TableHead>
              <TableHead className="text-right font-semibold text-[var(--primary)]">
                %&nbsp;Part
              </TableHead>
              <TableHead className="text-right font-semibold text-[var(--primary)]">
                Montant à payer
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {locataires.map((loc) => {
              const consommation = loc.consommation ?? 0;
              const isZero = consommation === 0;
              const part = consommation / safeTotal;
              const montant = part * (montantTotal ?? 0);

              return (
                <TableRow
                  key={loc.id}
                  className={isZero ? 'bg-gray-50 text-gray-400 italic' : undefined}
                >
                  {/* Locataire */}
                  <TableCell className="font-medium">
                    {loc.prenom} {loc.nom}
                  </TableCell>

                  {/* Index début */}
                  <TableCell className="text-right tabular-nums">
                    {loc.index_debut ?? '—'}
                  </TableCell>

                  {/* Index fin */}
                  <TableCell className="text-right tabular-nums">
                    {loc.index_fin ?? '—'}
                  </TableCell>

                  {/* Consommation */}
                  <TableCell className="text-right tabular-nums">
                    {formatConsommation(consommation)}
                  </TableCell>

                  {/* Part % */}
                  <TableCell className="text-right tabular-nums">
                    {isZero ? (
                      <span className="text-gray-400">0,00&nbsp;%</span>
                    ) : (
                      formatPart(part)
                    )}
                  </TableCell>

                  {/* Montant */}
                  <TableCell className="text-right tabular-nums font-semibold">
                    {isZero ? (
                      <span className="text-gray-400">0&nbsp;FCFA</span>
                    ) : (
                      <span className="text-[var(--primary)]">{formatCurrency(montant)}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {/* ── Totals row ── */}
          <TableFooter>
            <TableRow className="border-t-2 border-[var(--primary)]/20 bg-[var(--primary)]/5">
              <TableCell className="font-bold text-[var(--primary)]">Totaux</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
              <TableCell className="text-right font-bold tabular-nums text-[var(--primary)]">
                {formatConsommation(totalConsommation)}
              </TableCell>
              <TableCell className="text-right font-bold text-[var(--primary)]">
                100&nbsp;%
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums text-[var(--primary)]">
                {formatCurrency(montantTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
