import { ContaminantRecord } from '@/pdf/types';

type SqlGeneratorOptions = {
  formData?: Record<string, unknown>;
  contaminants: ContaminantRecord[];
};

const TABLE_NAME = 'water_quality_reports';

const TABLE_SCHEMA: Record<string, string> = {
  id: 'INT AUTO_INCREMENT PRIMARY KEY',
  report_date: 'DATE NOT NULL',
  contaminant_name: 'VARCHAR(255) NOT NULL',
  level_detected_avg_max: 'DECIMAL(12,6)',
  level_detected_range: 'VARCHAR(100)',
  unit_measurement: 'VARCHAR(50)',
  date_of_sample: 'DATE',
  violation: "ENUM('Yes', 'No') DEFAULT 'No'",
  mclg: 'VARCHAR(100)',
  regulatory_limit: 'VARCHAR(100)',
  likely_source: 'TEXT',
  created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'INDEX idx_contaminant_name': '(contaminant_name)',
  'INDEX idx_report_date': '(report_date)',
  'INDEX idx_violation': '(violation)',
  'INDEX idx_sample_date': '(date_of_sample)',
  'INDEX idx_contaminant_report': '(contaminant_name, report_date)',
};

const escapeSqlString = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

const formatDateForSql = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    if (value.includes('/')) {
      const [month, day, year] = value.split('/').map((segment) => segment.trim());
      if (year && month && day) {
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    if (/^\d{4}$/.test(value)) {
      return `${value}-01-01`;
    }
  } catch (error) {
    console.warn('Failed to format date', value, error);
  }
  return null;
};

const generateCreateTableStatement = (): string => {
  const columns = Object.entries(TABLE_SCHEMA)
    .map(([key, definition]) => {
      if (key.startsWith('INDEX')) {
        return `  ${key} ${definition}`;
      }
      return `  \`${key}\` ${definition}`;
    })
    .join(',\n');

  return `CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (\n${columns}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
};

const generateInsertStatement = (contaminant: ContaminantRecord, reportDate: string): string => {
  const name = escapeSqlString(contaminant.Contaminant);
  const levelAvgMax = contaminant['Level Detected (Avg/Max)'] ?? '';
  const levelRange = escapeSqlString(contaminant['Level Detected (Range)'] ?? '');
  const unit = escapeSqlString(contaminant['Unit Measurement'] ?? '');
  const dateOfSample = formatDateForSql(contaminant['Date of Sample']);
  const violation = escapeSqlString(contaminant.Violation ?? 'No');
  const mclg = escapeSqlString(contaminant.MCLG ?? '');
  const regulatoryLimit = escapeSqlString(contaminant['Regulatory Limit'] ?? '');
  const likelySource = escapeSqlString(contaminant['Likely Source of Contamination'] ?? '');

  const levelValue = levelAvgMax && levelAvgMax.length > 0 ? `'${escapeSqlString(levelAvgMax)}'` : 'NULL';
  const dateValue = dateOfSample ? `'${dateOfSample}'` : 'NULL';

  return `INSERT INTO \`${TABLE_NAME}\` (
  \`report_date\`,
  \`contaminant_name\`,
  \`level_detected_avg_max\`,
  \`level_detected_range\`,
  \`unit_measurement\`,
  \`date_of_sample\`,
  \`violation\`,
  \`mclg\`,
  \`regulatory_limit\`,
  \`likely_source\`
) VALUES (
  '${reportDate}',
  '${name}',
  ${levelValue},
  '${levelRange}',
  '${unit}',
  ${dateValue},
  '${violation}',
  '${mclg}',
  '${regulatoryLimit}',
  '${likelySource}'
);`;
};

const QUERY_EXAMPLES = `-- =================================================================
-- WATER QUALITY DATABASE QUERY EXAMPLES
-- =================================================================

-- 1. Count total records
SELECT COUNT(*) AS total_records FROM ${TABLE_NAME};

-- 2. View all contaminant names (unique list)
SELECT DISTINCT contaminant_name FROM ${TABLE_NAME} ORDER BY contaminant_name;

-- 3. Find all violations
SELECT contaminant_name, level_detected_avg_max, regulatory_limit, date_of_sample
FROM ${TABLE_NAME}
WHERE violation = 'Yes'
ORDER BY date_of_sample DESC;

-- 4. View data for a specific contaminant
SELECT * FROM ${TABLE_NAME}
WHERE contaminant_name = 'Lead'
ORDER BY report_date DESC;`;

export const generateSqlScript = ({ formData, contaminants }: SqlGeneratorOptions): string => {
  const generatedAt = new Date().toISOString();
  const reportDateRaw = (formData?.report_date as string | undefined) ?? new Date().toISOString().slice(0, 10);
  const reportDate = formatDateForSql(reportDateRaw) ?? new Date().toISOString().slice(0, 10);

  const header = `-- Water Quality Report Database Script\n-- Generated on: ${generatedAt}\n-- Total contaminants: ${contaminants.length}\n`;
  const createTable = `-- Create table structure with indexes for optimal querying\n${generateCreateTableStatement()}\n`;
  const inserts = contaminants
    .map((contaminant, index) => `-- Contaminant ${index + 1}\n${generateInsertStatement(contaminant, reportDate)}\n`)
    .join('\n');

  return [header, createTable, '-- Insert water quality data', inserts, QUERY_EXAMPLES].join('\n');
};
