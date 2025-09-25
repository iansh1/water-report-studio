export type ContaminantRecord = {
  Contaminant: string;
  Category?: string | null;
  Violation?: string | null;
  'Date of Sample'?: string | null;
  'Level Detected (Avg/Max)'?: string | null;
  'Level Detected (Range)'?: string | null;
  'Unit Measurement'?: string | null;
  MCLG?: string | null;
  'Regulatory Limit'?: string | null;
  'Likely Source of Contamination'?: string | null;
  rawText: string;
};

export interface PdfExtractionResult {
  metadata: {
    fileName: string;
    pageCount: number;
  };
  contaminants: ContaminantRecord[];
  rawText: string;
  warnings: string[];
}

export const CONTAMINANT_CATEGORY_MAP: Record<string, string> = {
  Alkalinity: 'Inorganic Contaminants',
  Barium: 'Inorganic Contaminants',
  Calcium: 'Inorganic Contaminants',
  'Calcium as Calcium Carbonate': 'Inorganic Contaminants',
  Chloride: 'Inorganic Contaminants',
  'Corrosivity by Calculation': 'Inorganic Contaminants',
  Fluoride: 'Inorganic Contaminants',
  Hardness: 'Inorganic Contaminants',
  Nickel: 'Inorganic Contaminants',
  Nitrate: 'Inorganic Contaminants',
  pH: 'Inorganic Contaminants',
  Sodium: 'Inorganic Contaminants',
  Sulfate: 'Inorganic Contaminants',
  'Total Dissolved Solids': 'Inorganic Contaminants',
  TDS: 'Inorganic Contaminants',
  'Dissolved Solids': 'Inorganic Contaminants',
  Zinc: 'Inorganic Contaminants',
  'Gross Alpha': 'Radioactive Contaminants',
  'Beta particles and': 'Radioactive Contaminants',
  'Combined radium-226': 'Radioactive Contaminants',
  Uranium: 'Radioactive Contaminants',
  'Total Haloacetic Acids': 'Disinfection Byproducts',
  'Total Trihalomethanes': 'Disinfection Byproducts',
  'Chlorine Residual': 'Disinfectants',
  'Distribution Turbidity': 'Microbiological Contaminants',
  'Perfluorooctanoic Acid': 'Synthetic Organic Contaminants',
  'Perfluorooctanesulfonic Acid': 'Synthetic Organic Contaminants',
  Bromochloroacetic: 'Unregulated Detected Substances',
  'Bromochloroacetic Acid': 'Unregulated Detected Substances',
  Lead: 'Lead and Copper',
  Copper: 'Lead and Copper'
};
