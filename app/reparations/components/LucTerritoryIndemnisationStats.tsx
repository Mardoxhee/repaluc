"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiDownload,
  FiDollarSign,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useFetch } from '../../context/FetchContext';

interface TableauBordLucTerritoire {
  territoire: string;
  cibleTotale: number;
  victimesRecontactees: number;
  pourcentageRecontactees: number;
  contratsSignes: number;
  pourcentageContratsSignes: number;
  victimesAyantCommenceIndemnisation: number;
  pourcentageVictimesAyantCommenceIndemnisation: number;
  resteVictimesACommencerIndemnisation: number;
  montantTotalPlanifieUSD: number;
  montantTotalPayeUSD: number;
  resteAPayer: number;
}

type TableauBordLucTotal = Omit<TableauBordLucTerritoire, 'territoire'>;

interface TableauBordLucResponse {
  success: boolean;
  mention: 'LUC';
  province?: string;
  totalTerritoires: number;
  territoires: TableauBordLucTerritoire[];
  totalGeneral: TableauBordLucTotal;
}

const EMPTY_TOTAL: TableauBordLucTotal = {
  cibleTotale: 0,
  victimesRecontactees: 0,
  pourcentageRecontactees: 0,
  contratsSignes: 0,
  pourcentageContratsSignes: 0,
  victimesAyantCommenceIndemnisation: 0,
  pourcentageVictimesAyantCommenceIndemnisation: 0,
  resteVictimesACommencerIndemnisation: 0,
  montantTotalPlanifieUSD: 0,
  montantTotalPayeUSD: 0,
  resteAPayer: 0,
};

const COLORS = {
  cible: '#1f4e78',
  recontact: '#5b9bd5',
  contrat: '#2f855a',
  indemnisation: '#ed7d31',
  reste: '#b91c1c',
  planifie: '#475569',
  paye: '#0f766e',
};

const formatNombre = new Intl.NumberFormat('fr-FR');
const formatUSD = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeTerritory = (row: any): TableauBordLucTerritoire => ({
  territoire: String(row?.territoire || 'INCONNU'),
  cibleTotale: toNumber(row?.cibleTotale),
  victimesRecontactees: toNumber(row?.victimesRecontactees),
  pourcentageRecontactees: toNumber(row?.pourcentageRecontactees),
  contratsSignes: toNumber(row?.contratsSignes),
  pourcentageContratsSignes: toNumber(row?.pourcentageContratsSignes),
  victimesAyantCommenceIndemnisation: toNumber(row?.victimesAyantCommenceIndemnisation),
  pourcentageVictimesAyantCommenceIndemnisation: toNumber(row?.pourcentageVictimesAyantCommenceIndemnisation),
  resteVictimesACommencerIndemnisation: toNumber(row?.resteVictimesACommencerIndemnisation),
  montantTotalPlanifieUSD: toNumber(row?.montantTotalPlanifieUSD),
  montantTotalPayeUSD: toNumber(row?.montantTotalPayeUSD),
  resteAPayer: toNumber(row?.resteAPayer),
});

const normalizeResponse = (payload: any): TableauBordLucResponse => {
  const data = payload?.data ?? payload ?? {};
  const province = [data?.province, data?.provinceName, data?.nomProvince]
    .find((value) => typeof value === 'string' && value.trim().length > 0)
    ?.trim() || 'Toutes-provinces';
  const territoires = Array.isArray(data?.territoires)
    ? data.territoires.map(normalizeTerritory)
    : [];
  const totalGeneral = data?.totalGeneral
    ? normalizeTerritory({ territoire: 'TOTAL', ...data.totalGeneral })
    : { territoire: 'TOTAL', ...EMPTY_TOTAL };

  return {
    success: Boolean(data?.success ?? true),
    mention: 'LUC',
    province,
    totalTerritoires: toNumber(data?.totalTerritoires ?? territoires.length),
    territoires,
    totalGeneral: {
      cibleTotale: totalGeneral.cibleTotale,
      victimesRecontactees: totalGeneral.victimesRecontactees,
      pourcentageRecontactees: totalGeneral.pourcentageRecontactees,
      contratsSignes: totalGeneral.contratsSignes,
      pourcentageContratsSignes: totalGeneral.pourcentageContratsSignes,
      victimesAyantCommenceIndemnisation: totalGeneral.victimesAyantCommenceIndemnisation,
      pourcentageVictimesAyantCommenceIndemnisation: totalGeneral.pourcentageVictimesAyantCommenceIndemnisation,
      resteVictimesACommencerIndemnisation: totalGeneral.resteVictimesACommencerIndemnisation,
      montantTotalPlanifieUSD: totalGeneral.montantTotalPlanifieUSD,
      montantTotalPayeUSD: totalGeneral.montantTotalPayeUSD,
      resteAPayer: totalGeneral.resteAPayer,
    },
  };
};

const formatPercent = (value: number) => `${value.toFixed(2)} %`;

const formatDateForFile = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
};

const normalizeFileSegment = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'Toutes-provinces'
);

const getExportFileBaseName = (response: TableauBordLucResponse | null, date = new Date()) => {
  const province = normalizeFileSegment(response?.province || 'Toutes-provinces');
  return `Extraction_Suivi-idenmnisation_${province}_${formatDateForFile(date)}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const getExportRows = (territoires: TableauBordLucTerritoire[]) => (
  territoires.map((row) => ({
    Territoire: row.territoire,
    'Cible totale': row.cibleTotale,
    'Victimes recontactées': row.victimesRecontactees,
    '% recontactées': row.pourcentageRecontactees,
    'Contrats signés': row.contratsSignes,
    '% contrats signés': row.pourcentageContratsSignes,
    'Indemnisation commencée': row.victimesAyantCommenceIndemnisation,
    '% indemnisation commencée': row.pourcentageVictimesAyantCommenceIndemnisation,
    'Victimes restant à commencer': row.resteVictimesACommencerIndemnisation,
    'Montant planifié USD': row.montantTotalPlanifieUSD,
    'Montant payé USD': row.montantTotalPayeUSD,
    'Reste à payer USD': row.resteAPayer,
  }))
);

const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const LucTerritoryIndemnisationStats: React.FC = () => {
  const { fetcher } = useFetch();
  const [data, setData] = useState<TableauBordLucResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher('/victime/stats/tableau-bord/LUC/par-territoire');
      setData(normalizeResponse(response));
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Chargement impossible pour les statistiques par territoire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [fetcher]);

  const territoires = data?.territoires || [];
  const total = data?.totalGeneral || EMPTY_TOTAL;

  const progressChartData = useMemo(() => (
    territoires.map((item) => ({
      territoire: item.territoire,
      cible: item.cibleTotale,
      recontactees: item.victimesRecontactees,
      contrats: item.contratsSignes,
      indemnisation: item.victimesAyantCommenceIndemnisation,
    }))
  ), [territoires]);

  const financeChartData = useMemo(() => (
    territoires.map((item) => ({
      territoire: item.territoire,
      planifie: item.montantTotalPlanifieUSD,
      paye: item.montantTotalPayeUSD,
      reste: item.resteAPayer,
    }))
  ), [territoires]);

  const reportingSteps = [
    {
      label: 'Recontact',
      value: total.victimesRecontactees,
      pct: total.pourcentageRecontactees,
      color: COLORS.recontact,
    },
    {
      label: 'Contrat signé',
      value: total.contratsSignes,
      pct: total.pourcentageContratsSignes,
      color: COLORS.contrat,
    },
    {
      label: 'Indemnisation démarrée',
      value: total.victimesAyantCommenceIndemnisation,
      pct: total.pourcentageVictimesAyantCommenceIndemnisation,
      color: COLORS.indemnisation,
    },
  ];

  const canExport = territoires.length > 0 && !loading && !error;

  const handleExportExcel = async () => {
    if (!canExport) return;

    setExportingExcel(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const generatedAt = new Date();

      const summaryRows = [
        ['Rapport', 'Suivi LUC par territoire'],
        ['Date d’export', generatedAt.toLocaleString('fr-FR')],
        ['Mention', 'LUC'],
        ['Province', data?.province || 'Toutes-provinces'],
        ['Territoires suivis', data?.totalTerritoires || territoires.length],
        [],
        ['Indicateur', 'Valeur', 'Pourcentage'],
        ['Cible totale', total.cibleTotale, ''],
        ['Victimes recontactées', total.victimesRecontactees, total.pourcentageRecontactees],
        ['Contrats signés', total.contratsSignes, total.pourcentageContratsSignes],
        ['Indemnisation commencée', total.victimesAyantCommenceIndemnisation, total.pourcentageVictimesAyantCommenceIndemnisation],
        ['Victimes restant à commencer', total.resteVictimesACommencerIndemnisation, ''],
        ['Montant planifié USD', total.montantTotalPlanifieUSD, ''],
        ['Montant payé USD', total.montantTotalPayeUSD, ''],
        ['Reste à payer USD', total.resteAPayer, ''],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');

      const territorySheet = XLSX.utils.json_to_sheet(getExportRows(territoires));
      territorySheet['!cols'] = [
        { wch: 22 },
        { wch: 14 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 24 },
        { wch: 26 },
        { wch: 28 },
        { wch: 22 },
        { wch: 18 },
        { wch: 20 },
      ];
      territorySheet['!autofilter'] = { ref: `A1:L${territoires.length + 1}` };
      XLSX.utils.book_append_sheet(workbook, territorySheet, 'Territoires');

      const chartSheet = XLSX.utils.json_to_sheet([
        ...territoires.map((row) => ({
          Territoire: row.territoire,
          Cible: row.cibleTotale,
          Recontactées: row.victimesRecontactees,
          Contrats: row.contratsSignes,
          'Indemnisation commencée': row.victimesAyantCommenceIndemnisation,
          Planifié: row.montantTotalPlanifieUSD,
          Payé: row.montantTotalPayeUSD,
          'Reste à payer': row.resteAPayer,
        })),
      ]);
      chartSheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, chartSheet, 'Données graphiques');

      XLSX.writeFile(workbook, `${getExportFileBaseName(data, generatedAt)}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!canExport) return;

    setExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const generatedAt = new Date();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const primary = '#1f4e78';
      const softBlue = '#eaf3fb';
      const grayText = '#64748b';
      const darkText = '#0f172a';

      const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
      const setText = (hex: string) => doc.setTextColor(...hexToRgb(hex));
      const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));
      const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} USD`;
      const percent = (value: number) => `${value.toFixed(1)}%`;

      const drawFooter = (page: number) => {
        setDraw('#dbeafe');
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(grayText);
        doc.text('FONAREV OPS - Tableau de bord LUC par territoire', margin, pageHeight - 7);
        doc.text(`Page ${page}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      };

      setFill(primary);
      doc.rect(0, 0, pageWidth, 46, 'F');
      setFill('#2f80c8');
      doc.roundedRect(margin, 12, 15, 15, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setText('#ffffff');
      doc.text('LUC', margin + 7.5, 21.5, { align: 'center' });
      doc.setFontSize(20);
      doc.text('Suivi LUC par territoire', margin + 22, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Contrats, indemnisations et reste à payer - synthèse opérationnelle', margin + 22, 27);
      doc.text(`Exporté le ${generatedAt.toLocaleString('fr-FR')}`, margin + 22, 35);

      setText(darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Synthèse générale', margin, 58);

      const cardW = (pageWidth - margin * 2 - 8) / 2;
      const cards = [
        { label: 'Cible totale', value: formatNombre.format(total.cibleTotale), meta: `${data?.totalTerritoires || territoires.length} territoire(s)`, color: COLORS.cible },
        { label: 'Contrats signés', value: formatNombre.format(total.contratsSignes), meta: percent(total.pourcentageContratsSignes), color: COLORS.contrat },
        { label: 'Indemnisation commencée', value: formatNombre.format(total.victimesAyantCommenceIndemnisation), meta: `${formatNombre.format(total.resteVictimesACommencerIndemnisation)} à démarrer`, color: COLORS.indemnisation },
        { label: 'Reste à payer', value: money(total.resteAPayer), meta: `${money(total.montantTotalPayeUSD)} payé`, color: COLORS.reste },
      ];

      cards.forEach((card, index) => {
        const x = margin + (index % 2) * (cardW + 8);
        const y = 64 + Math.floor(index / 2) * 31;
        setFill('#ffffff');
        setDraw('#dbeafe');
        doc.roundedRect(x, y, cardW, 24, 3, 3, 'FD');
        setFill(card.color);
        doc.roundedRect(x, y, 3, 24, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setText(grayText);
        doc.text(card.label.toUpperCase(), x + 8, y + 8);
        doc.setFontSize(card.value.length > 15 ? 12 : 15);
        setText(darkText);
        doc.text(card.value, x + 8, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(grayText);
        doc.text(card.meta, x + 8, y + 21);
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setText(darkText);
      doc.text('Circuit de reporting', margin, 136);
      const stepY = 144;
      const stepW = (pageWidth - margin * 2 - 10) / 3;
      reportingSteps.forEach((step, index) => {
        const x = margin + index * (stepW + 5);
        setFill(softBlue);
        setDraw('#dbeafe');
        doc.roundedRect(x, stepY, stepW, 33, 3, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        setText(grayText);
        doc.text(step.label.toUpperCase(), x + 5, stepY + 8);
        doc.setFontSize(16);
        setText(darkText);
        doc.text(formatNombre.format(step.value), x + 5, stepY + 18);
        setFill('#ffffff');
        doc.roundedRect(x + 5, stepY + 24, stepW - 10, 3, 1.5, 1.5, 'F');
        setFill(step.color);
        doc.roundedRect(x + 5, stepY + 24, (stepW - 10) * Math.min(100, Math.max(0, step.pct)) / 100, 3, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(grayText);
        doc.text(percent(step.pct), x + stepW - 5, stepY + 18, { align: 'right' });
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setText(darkText);
      doc.text('Lecture financière', margin, 193);
      const maxMoney = Math.max(total.montantTotalPlanifieUSD, total.montantTotalPayeUSD, total.resteAPayer, 1);
      [
        { label: 'Planifié', value: total.montantTotalPlanifieUSD, color: COLORS.planifie },
        { label: 'Payé', value: total.montantTotalPayeUSD, color: COLORS.paye },
        { label: 'Reste à payer', value: total.resteAPayer, color: COLORS.reste },
      ].forEach((item, index) => {
        const y = 202 + index * 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setText(darkText);
        doc.text(item.label, margin, y);
        setFill('#edf2f7');
        doc.roundedRect(margin + 35, y - 4, 104, 6, 2, 2, 'F');
        setFill(item.color);
        doc.roundedRect(margin + 35, y - 4, 104 * item.value / maxMoney, 6, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(money(item.value), pageWidth - margin, y, { align: 'right' });
      });

      const topReste = [...territoires].sort((a, b) => b.resteAPayer - a.resteAPayer).slice(0, 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setText(darkText);
      doc.text('Territoires à suivre en priorité', margin, 254);
      const maxReste = Math.max(...topReste.map((row) => row.resteAPayer), 1);
      topReste.forEach((row, index) => {
        const y = 264 + index * 5.2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setText(darkText);
        doc.text(row.territoire.slice(0, 18), margin, y);
        setFill('#fee2e2');
        doc.rect(margin + 36, y - 3, 80, 3, 'F');
        setFill(COLORS.reste);
        doc.rect(margin + 36, y - 3, 80 * row.resteAPayer / maxReste, 3, 'F');
        doc.text(money(row.resteAPayer), pageWidth - margin, y, { align: 'right' });
      });
      drawFooter(1);

      doc.addPage('a4', 'landscape');
      const tablePageWidth = doc.internal.pageSize.getWidth();
      const tablePageHeight = doc.internal.pageSize.getHeight();
      const landscapeMargin = 10;
      const columns = [
        { label: 'Territoire', width: 34 },
        { label: 'Cible', width: 18 },
        { label: 'Recontact', width: 29 },
        { label: 'Contrats', width: 29 },
        { label: 'Indemnisation', width: 33 },
        { label: 'À démarrer', width: 24 },
        { label: 'Payé USD', width: 34 },
        { label: 'Reste USD', width: 34 },
      ];
      let page = 2;
      let y = 28;

      const drawTableHeader = () => {
        setFill(primary);
        doc.rect(0, 0, tablePageWidth, 17, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        setText('#ffffff');
        doc.text('Détail territorial LUC', landscapeMargin, 11);
        doc.setFontSize(8);
        doc.text(`Exporté le ${generatedAt.toLocaleDateString('fr-FR')}`, tablePageWidth - landscapeMargin, 11, { align: 'right' });
        setFill('#f8fafc');
        setDraw('#cbd5e1');
        doc.rect(landscapeMargin, 21, tablePageWidth - landscapeMargin * 2, 8, 'FD');
        let x = landscapeMargin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        setText('#334155');
        columns.forEach((col) => {
          doc.text(col.label, x + 2, 26);
          x += col.width;
        });
      };

      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      territoires.forEach((row, index) => {
        if (y > tablePageHeight - 16) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          setText(grayText);
          doc.text(`Page ${page}`, tablePageWidth - landscapeMargin, tablePageHeight - 7, { align: 'right' });
          doc.addPage('a4', 'landscape');
          page += 1;
          y = 28;
          drawTableHeader();
        }
        if (index % 2 === 0) {
          setFill('#f8fafc');
          doc.rect(landscapeMargin, y - 5, tablePageWidth - landscapeMargin * 2, 7, 'F');
        }
        let x = landscapeMargin;
        const cells = [
          row.territoire,
          formatNombre.format(row.cibleTotale),
          `${formatNombre.format(row.victimesRecontactees)} (${percent(row.pourcentageRecontactees)})`,
          `${formatNombre.format(row.contratsSignes)} (${percent(row.pourcentageContratsSignes)})`,
          `${formatNombre.format(row.victimesAyantCommenceIndemnisation)} (${percent(row.pourcentageVictimesAyantCommenceIndemnisation)})`,
          formatNombre.format(row.resteVictimesACommencerIndemnisation),
          money(row.montantTotalPayeUSD),
          money(row.resteAPayer),
        ];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        setText(darkText);
        cells.forEach((cell, cellIndex) => {
          doc.text(String(cell), x + 2, y, {
            maxWidth: columns[cellIndex].width - 4,
          });
          x += columns[cellIndex].width;
        });
        y += 7;
      });

      setFill('#0f172a');
      doc.rect(landscapeMargin, y - 5, tablePageWidth - landscapeMargin * 2, 8, 'F');
      const totalCells = [
        'TOTAL GÉNÉRAL',
        formatNombre.format(total.cibleTotale),
        `${formatNombre.format(total.victimesRecontactees)} (${percent(total.pourcentageRecontactees)})`,
        `${formatNombre.format(total.contratsSignes)} (${percent(total.pourcentageContratsSignes)})`,
        `${formatNombre.format(total.victimesAyantCommenceIndemnisation)} (${percent(total.pourcentageVictimesAyantCommenceIndemnisation)})`,
        formatNombre.format(total.resteVictimesACommencerIndemnisation),
        money(total.montantTotalPayeUSD),
        money(total.resteAPayer),
      ];
      let totalX = landscapeMargin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      setText('#ffffff');
      totalCells.forEach((cell, cellIndex) => {
        doc.text(String(cell), totalX + 2, y, { maxWidth: columns[cellIndex].width - 4 });
        totalX += columns[cellIndex].width;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setText(grayText);
      doc.text(`Page ${page}`, tablePageWidth - landscapeMargin, tablePageHeight - 7, { align: 'right' });

      doc.save(`${getExportFileBaseName(data, generatedAt)}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <section className="mb-8">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50">
            <FiMapPin className="text-emerald-700" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Suivi LUC par territoire</h2>
            <p className="text-sm text-gray-500 max-w-3xl">
              Lecture douce du circuit: recontact, contrat, démarrage des indemnisations et reste à payer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!canExport || exportingExcel}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            <FiDownload size={16} />
            {exportingExcel ? 'Excel...' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!canExport || exportingPdf}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 disabled:opacity-60"
          >
            <FiFileText size={16} />
            {exportingPdf ? 'PDF...' : 'PDF'}
          </button>
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <FiAlertCircle className="text-red-600" size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Statistiques LUC indisponibles</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            <FiRefreshCw size={16} />
            Réessayer
          </button>
        </div>
      ) : territoires.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="font-semibold text-gray-900">Aucune donnée territoriale LUC</p>
          <p className="text-sm text-gray-500 mt-1">Les graphiques apparaîtront dès que le backend retournera des territoires.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Cible totale"
              value={formatNombre.format(total.cibleTotale)}
              subtitle={`${data?.totalTerritoires || territoires.length} territoire(s) suivis`}
              icon={<FiUsers className="text-blue-700" size={18} />}
              accent="bg-blue-50"
            />
            <KpiCard
              title="Contrats signés"
              value={formatNombre.format(total.contratsSignes)}
              subtitle={formatPercent(total.pourcentageContratsSignes)}
              icon={<FiFileText className="text-emerald-700" size={18} />}
              accent="bg-emerald-50"
            />
            <KpiCard
              title="Indemnisation commencée"
              value={formatNombre.format(total.victimesAyantCommenceIndemnisation)}
              subtitle={`${formatNombre.format(total.resteVictimesACommencerIndemnisation)} à démarrer`}
              icon={<FiTrendingUp className="text-orange-700" size={18} />}
              accent="bg-orange-50"
            />
            <KpiCard
              title="Reste à payer"
              value={formatUSD.format(total.resteAPayer)}
              subtitle={`${formatUSD.format(total.montantTotalPayeUSD)} déjà payé`}
              icon={<FiCreditCard className="text-rose-700" size={18} />}
              accent="bg-rose-50"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Circuit de reporting LUC</h3>
                <p className="text-sm text-gray-500">Synthèse du parcours mentionné dans le document de reporting.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[640px]">
                {reportingSteps.map((step) => (
                  <div key={step.label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{step.label}</span>
                      <span className="text-sm font-bold text-gray-900">{formatPercent(step.pct)}</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, step.pct))}%`, backgroundColor: step.color }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{formatNombre.format(step.value)} victime(s)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-blue-50">
                  <FiCheckCircle className="text-blue-700" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Progression par territoire</h3>
                  <p className="text-sm text-gray-500">Volumes de victimes à chaque étape du circuit.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={progressChartData} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="territoire" angle={-40} textAnchor="end" height={90} fontSize={11} interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: any) => formatNombre.format(Number(value) || 0)} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="cible" name="Cible totale" fill={COLORS.cible} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recontactees" name="Recontactées" fill={COLORS.recontact} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contrats" name="Contrats signés" fill={COLORS.contrat} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="indemnisation" name="Indemnisation commencée" fill={COLORS.indemnisation} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <FiDollarSign className="text-emerald-700" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Flux financiers par territoire</h3>
                  <p className="text-sm text-gray-500">Montants planifiés, payés et restant à payer.</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={financeChartData} margin={{ top: 10, right: 20, left: 8, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="territoire" angle={-40} textAnchor="end" height={90} fontSize={11} interval={0} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value: any) => formatUSD.format(Number(value) || 0)} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="planifie" name="Planifié" fill={COLORS.planifie} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paye" name="Payé" fill={COLORS.paye} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reste" name="Reste à payer" fill={COLORS.reste} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tableau territorial</h3>
                <p className="text-sm text-gray-500">Détail opérationnel pour lecture et comparaison rapide.</p>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-[11px] md:text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {[
                      'Territoire',
                      'Cible',
                      'Recontactées',
                      '%',
                      'Contrats',
                      '%',
                      'Indemnisation commencée',
                      '%',
                      'À démarrer',
                      'Planifié',
                      'Payé',
                      'Reste à payer',
                    ].map((label) => (
                      <th key={label} className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide break-words">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {territoires.map((row) => (
                    <tr key={row.territoire} className="hover:bg-gray-50">
                      <td className="px-2 py-3 font-semibold text-gray-900 break-words">{row.territoire}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.cibleTotale)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.victimesRecontactees)}</td>
                      <td className="px-2 py-3 text-blue-700 font-medium break-words">{formatPercent(row.pourcentageRecontactees)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.contratsSignes)}</td>
                      <td className="px-2 py-3 text-emerald-700 font-medium break-words">{formatPercent(row.pourcentageContratsSignes)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.victimesAyantCommenceIndemnisation)}</td>
                      <td className="px-2 py-3 text-orange-700 font-medium break-words">{formatPercent(row.pourcentageVictimesAyantCommenceIndemnisation)}</td>
                      <td className="px-2 py-3 break-words">{formatNombre.format(row.resteVictimesACommencerIndemnisation)}</td>
                      <td className="px-2 py-3 break-words">{formatUSD.format(row.montantTotalPlanifieUSD)}</td>
                      <td className="px-2 py-3 break-words">{formatUSD.format(row.montantTotalPayeUSD)}</td>
                      <td className="px-2 py-3 font-semibold text-rose-700 break-words">{formatUSD.format(row.resteAPayer)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900 text-white">
                    <td className="px-2 py-3 font-bold break-words">TOTAL GÉNÉRAL</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.cibleTotale)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.victimesRecontactees)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageRecontactees)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.contratsSignes)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageContratsSignes)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.victimesAyantCommenceIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatPercent(total.pourcentageVictimesAyantCommenceIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatNombre.format(total.resteVictimesACommencerIndemnisation)}</td>
                    <td className="px-2 py-3 break-words">{formatUSD.format(total.montantTotalPlanifieUSD)}</td>
                    <td className="px-2 py-3 break-words">{formatUSD.format(total.montantTotalPayeUSD)}</td>
                    <td className="px-2 py-3 font-bold break-words">{formatUSD.format(total.resteAPayer)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LucTerritoryIndemnisationStats;
